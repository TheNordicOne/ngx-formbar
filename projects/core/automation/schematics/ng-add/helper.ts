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
import { JsonObject, normalize } from '@angular-devkit/core';
import {
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_FW_COMPONENT_REGISTRATIONS,
  NGX_FW_VALIDATOR_REGISTRATIONS,
  PACKAGE_NAME,
} from '../../shared/constants';
import { RuleContext } from './schema';
import {
  updateWorkspace,
  WorkspaceDefinition,
} from '@schematics/angular/utility';
import { SchematicsException } from '@angular-devkit/schematics';
import { isCallee } from '../shared/ast/decorators';

export function updateSchematicConfig(
  schematicName: string,
  options: JsonObject,
  projectName?: string,
) {
  return updateWorkspace((workspace: WorkspaceDefinition) => {
    const targetProject =
      projectName ?? (workspace.extensions['defaultProject'] as string);

    if (!targetProject) {
      throw new SchematicsException(
        `No projectName provided and workspace.defaultProject is not set.`,
      );
    }

    const projectDef = workspace.projects.get(targetProject);
    if (!projectDef) {
      throw new SchematicsException(
        `Project "${targetProject}" does not exist in the workspace.`,
      );
    }

    projectDef.extensions['schematics'] ??= {};
    const schematicsExt = projectDef.extensions['schematics'] as JsonObject;

    const schematicKey = `${PACKAGE_NAME}:${schematicName}`;
    const existingConfig = (schematicsExt[schematicKey] ?? {}) as JsonObject;
    schematicsExt[schematicKey] = {
      ...existingConfig,
      ...options,
    };
  });
}

export function buildProvidersUpdate(
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  providersArray: ArrayLiteralExpression,
) {
  const {
    projectRoot,
    appConfigPath,
    registrationStyle,
    registrationsPath,
    providerConfigPath,
    providerConfigFileName,
    splitRegistrations,
  } = ruleContext;

  const extraChanges: Change[] = [];
  const existingElements = [...providersArray.elements];
  const newElements = [...existingElements];

  const formattedProviderConfigPath =
    providerConfigPath && providerConfigFileName
      ? `${providerConfigPath}/${providerConfigFileName}`
      : (providerConfigPath ?? '');

  const registrationsImportPath = createRelativePath(
    appConfigPath,
    `${projectRoot}/${registrationsPath ?? ''}`,
  );

  const providerConfigImportPath = createRelativePath(
    appConfigPath,
    `${projectRoot}/${formattedProviderConfigPath}`,
  );

  const hasProvideCall = existingElements.some(isProvideFormworkCall);
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
        factory.createIdentifier('provideFormwork'),
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
) {
  const printer = createPrinter({});
  const printed = printer.printNode(EmitHint.Unspecified, replacement, sf);
  const start = original.getStart(sf);
  const end = original.getEnd();
  return [
    new ReplaceChange(filePath, start, fileText.slice(start, end), printed),
  ];
}

function isProvideFormworkCall(n: Expression) {
  return isCallExpression(n) && isCallee(n.expression, 'provideFormwork');
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

function ensureAbsolutePath(path: string) {
  const pathWithLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return normalize(pathWithLeadingSlash);
}

function createRelativePath(from: string, to: string) {
  const absoluteFrom = ensureAbsolutePath(from);
  const absoluteTo = ensureAbsolutePath(to);
  return buildRelativePath(absoluteFrom, absoluteTo);
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
  } = ruleContext;

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
        'formworkConfig',
        providerConfigImportPath,
        false,
      ),
    );
  }
  return [factory.createIdentifier('formworkConfig')];
}

function checkTokenProviderExists(
  existingElements: Expression[],
  tokenName: string,
) {
  return existingElements.some((el) => {
    if (!isCallExpression(el)) {
      return false;
    }

    const objectArg = el.arguments[0];
    if (el.arguments.length === 0 || !isObjectLiteralExpression(objectArg)) {
      return false;
    }

    return objectArg.properties.some(
      (prop) =>
        isPropertyAssignment(prop) &&
        isIdentifier(prop.name) &&
        prop.name.text === 'provide' &&
        isIdentifier(prop.initializer) &&
        prop.initializer.text === tokenName,
    );
  });
}

function createMapProviderExpression(tokenName: string) {
  return factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment(
        factory.createIdentifier('provide'),
        factory.createIdentifier(tokenName),
      ),
      factory.createPropertyAssignment(
        factory.createIdentifier('useValue'),
        factory.createNewExpression(
          factory.createIdentifier('Map'),
          undefined,
          [factory.createArrayLiteralExpression([], false)],
        ),
      ),
    ],
    true,
  );
}

function addStandaloneRegistrationProvider(
  tokenName: string,
  sourceFile: SourceFile,
  ruleContext: RuleContext,
  existingElements: Expression[],
  newElements: Expression[],
  extraChanges: Change[],
) {
  const { appConfigPath } = ruleContext;

  extraChanges.push(
    insertImport(sourceFile, appConfigPath, tokenName, PACKAGE_NAME, false),
  );

  if (!checkTokenProviderExists(existingElements, tokenName)) {
    const provider = createMapProviderExpression(tokenName);
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
  const { registrationsPath, includeSyncValidators, includeAsyncValidators } =
    ruleContext;

  if (registrationsPath) {
    addSplitRegistrationProvider(
      'componentRegistrationsProvider',
      sourceFile,
      ruleContext,
      registrationsImportPath,
      existingElements,
      newElements,
      extraChanges,
    );
  }

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
    sourceFile,
    ruleContext,
    existingElements,
    newElements,
    extraChanges,
  );

  if (includeSyncValidators) {
    addStandaloneRegistrationProvider(
      NGX_FW_VALIDATOR_REGISTRATIONS,
      sourceFile,
      ruleContext,
      existingElements,
      newElements,
      extraChanges,
    );
  }

  if (includeAsyncValidators) {
    addStandaloneRegistrationProvider(
      NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
      sourceFile,
      ruleContext,
      existingElements,
      newElements,
      extraChanges,
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
