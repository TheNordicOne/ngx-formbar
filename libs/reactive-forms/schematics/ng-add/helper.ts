import {
  ArrayLiteralExpression,
  createPrinter,
  EmitHint,
  Expression,
  factory,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  Node,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SourceFile,
} from 'typescript';
import { Change, ReplaceChange } from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { isJsonObject, JsonObject } from '@angular-devkit/core';
import { posix } from 'node:path';
import {
  DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME,
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
  isCallee,
  joinToSourceRoot,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_FW_COMPONENT_REGISTRATIONS,
  NGX_FW_VALIDATOR_REGISTRATIONS,
  NgxFormbarAutomationConfig,
  sourceRootValue,
} from '@ngx-formbar/setup';
import {
  CORE_PACKAGE_NAME,
  REACTIVE_FORMS_PACKAGE_NAME,
  SCHEMATICS_PACKAGE_NAME,
} from '../shared/constants';
import { RuleContext } from './schema';
import {
  updateWorkspace,
  WorkspaceDefinition,
} from '@schematics/angular/utility';
import { Rule, SchematicsException } from '@angular-devkit/schematics';

type GeneratorOptions = Record<string, string | undefined>;

/**
 * Merges each generator's options into its `@ngx-formbar/schematics:<generator>`
 * entry in angular.json, in a single write.
 */
export function updateSchematicConfigs(
  configs: Record<string, GeneratorOptions>,
  projectName: string,
): Rule {
  return updateWorkspace((workspace: WorkspaceDefinition) => {
    const projectDef = workspace.projects.get(projectName);

    if (!projectDef) {
      throw new SchematicsException(
        `Project "${projectName}" does not exist in the workspace.`,
      );
    }

    const existing = projectDef.extensions.schematics;
    const schematicsExt: JsonObject =
      existing && isJsonObject(existing) ? existing : {};

    for (const [schematicName, options] of Object.entries(configs)) {
      const schematicKey = `${SCHEMATICS_PACKAGE_NAME}:${schematicName}`;
      const existingConfig = schematicsExt[schematicKey];

      schematicsExt[schematicKey] = {
        ...(existingConfig && isJsonObject(existingConfig)
          ? existingConfig
          : {}),
        ...definedOptions(options),
      };
    }

    projectDef.extensions.schematics = schematicsExt;
  });
}

export function removeSchematicsConfigLink(
  generators: string[],
  projectName: string,
): Rule {
  return updateWorkspace((workspace: WorkspaceDefinition) => {
    const schematics =
      workspace.projects.get(projectName)?.extensions.schematics;

    if (!schematics || !isJsonObject(schematics)) {
      return;
    }

    for (const generator of generators) {
      const schematicKey = `${SCHEMATICS_PACKAGE_NAME}:${generator}`;
      const config = schematics[schematicKey];

      if (config && isJsonObject(config) && 'schematicsConfig' in config) {
        const { schematicsConfig: _, ...others } = config;

        schematics[schematicKey] = others;
      }
    }
  });
}

function definedOptions(options: GeneratorOptions) {
  return Object.fromEntries(
    Object.entries(options).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  );
}

export type GeneratorDefaults = Pick<
  NgxFormbarAutomationConfig,
  'registrationType' | 'controlRegistrationsPath' | 'viewProviderHelperPath'
>;

const DEFAULT_REGISTRATIONS_FILE = `${DEFAULT_REGISTRATIONS_PATH}/${DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME}`;

/** The generator settings that differ from what the generators assume. */
export function generatorDefaults(ruleContext: RuleContext): GeneratorDefaults {
  const { registrationStyle, useHelper, helperDirectory, projectRoot } =
    ruleContext;
  const registrationsFile = componentRegistrationsFile(ruleContext);
  const defaults: GeneratorDefaults = {};

  if (registrationStyle !== DEFAULT_REGISTRATION_TYPE) {
    defaults.registrationType = registrationStyle;
  }

  if (
    registrationsFile !==
    joinToSourceRoot(DEFAULT_REGISTRATIONS_FILE, projectRoot)
  ) {
    defaults.controlRegistrationsPath = sourceRootValue(
      registrationsFile,
      projectRoot,
    );
  }

  if (useHelper) {
    defaults.viewProviderHelperPath = sourceRootValue(
      helperDirectory,
      projectRoot,
    );
  }

  return defaults;
}

function componentRegistrationsFile(ruleContext: RuleContext) {
  const {
    splitRegistrations,
    useTokens,
    provideInline,
    registrationsDirectory,
    providerConfigDirectory,
    providerConfigFileName,
    appConfigPath,
  } = ruleContext;

  const providerFile =
    useTokens || provideInline
      ? appConfigPath
      : posix.join(providerConfigDirectory, `${providerConfigFileName}.ts`);

  return splitRegistrations
    ? posix.join(
        registrationsDirectory,
        DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME,
      )
    : providerFile;
}

export interface ProvidersUpdateResult {
  updatedProvidersArray: ArrayLiteralExpression;
  extraChanges: Change[];
  didChange: boolean;
}

export function buildProvidersUpdate(
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  providersArray: ArrayLiteralExpression,
): ProvidersUpdateResult {
  const {
    appConfigPath,
    registrationStyle,
    registrationsDirectory,
    providerConfigDirectory,
    providerConfigFileName,
    splitRegistrations,
  } = ruleContext;

  const extraChanges: Change[] = [];
  const existingElements = [...providersArray.elements];
  const newElements = [...existingElements];

  const registrationsImportPath = buildRelativePath(
    appConfigPath,
    registrationsDirectory,
  );

  const providerConfigImportPath = buildRelativePath(
    appConfigPath,
    posix.join(providerConfigDirectory, providerConfigFileName),
  );

  const hasProvideCall = existingElements.some(isProvideFormbarCall);
  if (!hasProvideCall) {
    const callArgs = createArgsForConfig(
      sourceFile,
      ruleContext,
      registrationsImportPath,
      providerConfigImportPath,
      extraChanges,
    );

    newElements.push(
      factory.createCallExpression(
        factory.createIdentifier('provideFormbar'),
        undefined,
        callArgs,
      ),
    );
  }

  if (registrationStyle !== 'token') {
    return buildResult(
      providersArray,
      newElements,
      existingElements,
      extraChanges,
    );
  }

  if (splitRegistrations) {
    handleSplitRegistrations(
      sourceFile,
      ruleContext,
      registrationsImportPath,
      existingElements,
      newElements,
      extraChanges,
    );

    return buildResult(
      providersArray,
      newElements,
      existingElements,
      extraChanges,
    );
  }

  handleStandaloneTokens(
    sourceFile,
    ruleContext,
    existingElements,
    newElements,
    extraChanges,
  );

  return buildResult(
    providersArray,
    newElements,
    existingElements,
    extraChanges,
  );
}

export function replaceNodeWithPrinted(
  sf: SourceFile,
  filePath: string,
  fileText: string,
  original: Node,
  replacement: Node,
): ReplaceChange[] {
  const printer = createPrinter({});
  const printed = printer.printNode(EmitHint.Unspecified, replacement, sf);
  const start = original.getStart(sf);
  const end = original.getEnd();
  return [
    new ReplaceChange(filePath, start, fileText.slice(start, end), printed),
  ];
}

function isProvideFormbarCall(n: Expression) {
  return isCallExpression(n) && isCallee(n.expression, 'provideFormbar');
}

function hasIdentifier(name: string) {
  return function (n: Expression) {
    return isIdentifier(n) && n.text === name;
  };
}

function compareElements(
  el: Expression,
  i: number,
  existingElements: Expression[],
) {
  return el !== existingElements[i];
}

function createArgsForConfig(
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  registrationsImportPath: string,
  providerConfigImportPath: string,
  extraChanges: Change[],
) {
  const {
    provideInline,
    splitRegistrations,
    appConfigPath,
    includeSyncValidators,
    includeAsyncValidators,
    useTokens,
  } = ruleContext;

  // Token providers hold the registrations, next to this call.
  if (provideInline && useTokens) {
    return [];
  }

  if (provideInline && !splitRegistrations) {
    const additionalProperties: PropertyAssignment[] = [];

    if (includeSyncValidators) {
      additionalProperties.push(
        factory.createPropertyAssignment(
          'validatorRegistrations',
          factory.createObjectLiteralExpression([], false),
        ),
      );
    }

    if (includeAsyncValidators) {
      additionalProperties.push(
        factory.createPropertyAssignment(
          'asyncValidatorRegistrations',
          factory.createObjectLiteralExpression([], false),
        ),
      );
    }

    return [
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            'componentRegistrations',
            factory.createObjectLiteralExpression([], false),
          ),
          ...additionalProperties,
        ],
        true,
      ),
    ];
  }

  if (provideInline && splitRegistrations) {
    if (registrationsImportPath) {
      extraChanges.push(
        insertImport(
          sourceFile,
          appConfigPath,
          'componentRegistrations',
          registrationsImportPath,
          false,
        ),
      );
    }
    const additionalProperties: ShorthandPropertyAssignment[] = [];

    if (includeSyncValidators) {
      extraChanges.push(
        insertImport(
          sourceFile,
          appConfigPath,
          'validatorRegistrations',
          registrationsImportPath,
          false,
        ),
      );
      additionalProperties.push(
        factory.createShorthandPropertyAssignment('validatorRegistrations'),
      );
    }

    if (includeAsyncValidators) {
      extraChanges.push(
        insertImport(
          sourceFile,
          appConfigPath,
          'asyncValidatorRegistrations',
          registrationsImportPath,
          false,
        ),
      );
      additionalProperties.push(
        factory.createShorthandPropertyAssignment(
          'asyncValidatorRegistrations',
        ),
      );
    }

    return [
      factory.createObjectLiteralExpression(
        [
          factory.createShorthandPropertyAssignment('componentRegistrations'),
          ...additionalProperties,
        ],
        true,
      ),
    ];
  }

  if (providerConfigImportPath) {
    extraChanges.push(
      insertImport(
        sourceFile,
        appConfigPath,
        'formbarConfig',
        providerConfigImportPath,
        false,
      ),
    );
  }
  return [factory.createIdentifier('formbarConfig')];
}

function checkTokenProviderExists(
  existingElements: Expression[],
  tokenName: string,
) {
  return existingElements.some(
    (el) =>
      isObjectLiteralExpression(el) &&
      el.properties.some(
        (prop) =>
          isPropertyAssignment(prop) &&
          isIdentifier(prop.name) &&
          prop.name.text === 'provide' &&
          isIdentifier(prop.initializer) &&
          prop.initializer.text === tokenName,
      ),
  );
}

function createMapProviderExpression(
  tokenName: string,
  isMultiProvider = false,
) {
  const properties: PropertyAssignment[] = [
    factory.createPropertyAssignment(
      factory.createIdentifier('provide'),
      factory.createIdentifier(tokenName),
    ),
    factory.createPropertyAssignment(
      factory.createIdentifier('useValue'),
      factory.createNewExpression(factory.createIdentifier('Map'), undefined, [
        factory.createArrayLiteralExpression([], false),
      ]),
    ),
  ];

  if (isMultiProvider) {
    properties.push(
      factory.createPropertyAssignment(
        factory.createIdentifier('multi'),
        factory.createTrue(),
      ),
    );
  }

  return factory.createObjectLiteralExpression(properties, true);
}

function addStandaloneRegistrationProvider(
  tokenName: string,
  packageName: string,
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  existingElements: Expression[],
  newElements: Expression[],
  extraChanges: Change[],
  isMultiProvider = false,
) {
  const { appConfigPath } = ruleContext;

  extraChanges.push(
    insertImport(sourceFile, appConfigPath, tokenName, packageName, false),
  );

  if (!checkTokenProviderExists(existingElements, tokenName)) {
    const provider = createMapProviderExpression(tokenName, isMultiProvider);
    newElements.push(provider);
  }
}

function addSplitRegistrationProvider(
  providerName: string,
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  registrationsImportPath: string,
  existingElements: Expression[],
  newElements: Expression[],
  extraChanges: Change[],
) {
  const { appConfigPath } = ruleContext;
  const hasProvider = existingElements.some(hasIdentifier(providerName));

  if (!hasProvider) {
    extraChanges.push(
      insertImport(
        sourceFile,
        appConfigPath,
        providerName,
        registrationsImportPath,
        false,
      ),
    );

    newElements.push(factory.createIdentifier(providerName));
  }
}

function handleSplitRegistrations(
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  registrationsImportPath: string,
  existingElements: Expression[],
  newElements: Expression[],
  extraChanges: Change[],
) {
  const { includeSyncValidators, includeAsyncValidators } = ruleContext;

  addSplitRegistrationProvider(
    'componentRegistrationsProvider',
    sourceFile,
    ruleContext,
    registrationsImportPath,
    existingElements,
    newElements,
    extraChanges,
  );

  if (includeSyncValidators) {
    addSplitRegistrationProvider(
      'validatorRegistrationsProvider',
      sourceFile,
      ruleContext,
      registrationsImportPath,
      existingElements,
      newElements,
      extraChanges,
    );
  }

  if (includeAsyncValidators) {
    addSplitRegistrationProvider(
      'asyncValidatorRegistrationsProvider',
      sourceFile,
      ruleContext,
      registrationsImportPath,
      existingElements,
      newElements,
      extraChanges,
    );
  }
}

function handleStandaloneTokens(
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  existingElements: Expression[],
  newElements: Expression[],
  extraChanges: Change[],
) {
  const { includeSyncValidators, includeAsyncValidators } = ruleContext;

  addStandaloneRegistrationProvider(
    NGX_FW_COMPONENT_REGISTRATIONS,
    CORE_PACKAGE_NAME,
    sourceFile,
    ruleContext,
    existingElements,
    newElements,
    extraChanges,
  );

  if (includeSyncValidators) {
    addStandaloneRegistrationProvider(
      NGX_FW_VALIDATOR_REGISTRATIONS,
      REACTIVE_FORMS_PACKAGE_NAME,
      sourceFile,
      ruleContext,
      existingElements,
      newElements,
      extraChanges,
      true,
    );
  }

  if (includeAsyncValidators) {
    addStandaloneRegistrationProvider(
      NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
      REACTIVE_FORMS_PACKAGE_NAME,
      sourceFile,
      ruleContext,
      existingElements,
      newElements,
      extraChanges,
      true,
    );
  }
}

function buildResult(
  providersArray: ArrayLiteralExpression,
  newElements: Expression[],
  existingElements: Expression[],
  extraChanges: Change[],
) {
  const didChange =
    newElements.length !== existingElements.length ||
    newElements.some((el, i) => compareElements(el, i, existingElements));

  const updatedProvidersArray = didChange
    ? factory.updateArrayLiteralExpression(providersArray, newElements)
    : providersArray;

  return { updatedProvidersArray, extraChanges, didChange };
}
