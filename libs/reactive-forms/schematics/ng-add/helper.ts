import {
  ArrayLiteralExpression,
  Expression,
  factory,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAssignment,
  PropertyAssignment,
  ShorthandPropertyAssignment,
  SourceFile,
} from 'typescript';
import { Change } from '@schematics/angular/utility/change';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { isJsonObject, JsonObject, strings } from '@angular-devkit/core';
import { posix } from 'node:path';
import {
  DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME,
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
  exportsIdentifier,
  insertNamedImport,
  isNamedImported,
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
  ProjectDefinition,
  updateWorkspace,
  WorkspaceDefinition,
} from '@schematics/angular/utility';
import { Rule, SchematicsException, Tree } from '@angular-devkit/schematics';

type GeneratorOptions = Record<string, string | undefined>;

/**
 * Merges each generator's options into its `@ngx-formbar/schematics:<generator>`
 * entry in angular.json, in a single write, after dropping `replacedKeys`.
 */
export function updateSchematicConfigs(
  configs: Record<string, GeneratorOptions>,
  projectName: string,
  replacedKeys: string[] = [],
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

      const kept = Object.entries(
        existingConfig && isJsonObject(existingConfig) ? existingConfig : {},
      ).filter(([key]) => !replacedKeys.includes(key));

      schematicsExt[schematicKey] = {
        ...Object.fromEntries(kept),
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

/** The file a generator of the project is pointed at. */
export function schematicsConfigLink(
  project: ProjectDefinition,
  generators: string[],
): string | undefined {
  const { schematics } = project.extensions;

  return schematics && isJsonObject(schematics)
    ? generators
        .map(
          (generator) => schematics[`${SCHEMATICS_PACKAGE_NAME}:${generator}`],
        )
        .flatMap((config) =>
          config && isJsonObject(config) ? [config.schematicsConfig] : [],
        )
        .find((link) => typeof link === 'string')
    : undefined;
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

export const DEFAULT_REGISTRATIONS_FILE = `${DEFAULT_REGISTRATIONS_PATH}/${DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME}`;

/** The generator settings that differ from what the generators assume. */
export function generatorDefaults(ruleContext: RuleContext): GeneratorDefaults {
  const { registrationStyle, useHelper, helperDirectory, sourceRoot } =
    ruleContext;
  const registrationsFile = componentRegistrationsFile(ruleContext);
  const defaults: GeneratorDefaults = {};

  if (registrationStyle !== DEFAULT_REGISTRATION_TYPE) {
    defaults.registrationType = registrationStyle;
  }

  if (
    registrationsFile !==
    joinToSourceRoot(DEFAULT_REGISTRATIONS_FILE, sourceRoot)
  ) {
    defaults.controlRegistrationsPath = sourceRootValue(
      registrationsFile,
      sourceRoot,
    );
  }

  if (useHelper) {
    defaults.viewProviderHelperPath = sourceRootValue(
      helperDirectory,
      sourceRoot,
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

/**
 * The registrations folder, as long as its `index.ts` exports the symbol. A kept
 * index need not, so then the seeded file the symbol comes from.
 */
export function registrationImportPath(
  tree: Tree,
  importingFile: string,
  registrationsDirectory: string,
  symbol: string,
): string {
  const seededFile = strings.dasherize(symbol.replace(/Provider$/, ''));

  return buildRelativePath(
    importingFile,
    exportsIdentifier(
      tree,
      posix.join(registrationsDirectory, 'index.ts'),
      symbol,
    )
      ? registrationsDirectory
      : posix.join(registrationsDirectory, seededFile),
  );
}

export function registrationImportStatements(
  tree: Tree,
  importingFile: string,
  registrationsDirectory: string,
  symbols: string[],
): string {
  const paths = symbols.map((symbol) =>
    registrationImportPath(tree, importingFile, registrationsDirectory, symbol),
  );

  return [...new Set(paths)]
    .map((path) => {
      const imported = symbols.filter((_, index) => paths[index] === path);

      return `import { ${imported.join(', ')} } from '${path}';`;
    })
    .join('\n');
}

interface RequestedImport {
  symbol: string;
  from: string;
}

export interface ProvidersUpdateResult {
  addedElements: Expression[];
  importChanges: Change[];
}

export function buildProvidersUpdate(
  tree: Tree,
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

  const imports: RequestedImport[] = [
    { symbol: 'provideFormbar', from: REACTIVE_FORMS_PACKAGE_NAME },
  ];
  const existingElements = [...providersArray.elements];
  const addedElements: Expression[] = [];

  const registrationImport = (symbol: string) =>
    registrationImportPath(tree, appConfigPath, registrationsDirectory, symbol);

  const providerConfigImportPath = buildRelativePath(
    appConfigPath,
    posix.join(providerConfigDirectory, providerConfigFileName),
  );

  if (!existingElements.some(isProvideFormbarCall)) {
    addedElements.push(
      factory.createCallExpression(
        factory.createIdentifier('provideFormbar'),
        undefined,
        createArgsForConfig(
          ruleContext,
          registrationImport,
          providerConfigImportPath,
          imports,
        ),
      ),
    );
  }

  if (registrationStyle === 'token' && splitRegistrations) {
    handleSplitRegistrations(
      ruleContext,
      registrationImport,
      existingElements,
      addedElements,
      imports,
    );
  }

  if (registrationStyle === 'token' && !splitRegistrations) {
    handleStandaloneTokens(
      ruleContext,
      existingElements,
      addedElements,
      imports,
    );
  }

  return {
    addedElements,
    importChanges: importChanges(sourceFile, appConfigPath, imports),
  };
}

/** One import statement per module, leaving out what is imported already. */
function importChanges(
  sourceFile: SourceFile,
  filePath: string,
  imports: RequestedImport[],
) {
  return [...new Set(imports.map(({ from }) => from))].flatMap((from) => {
    const symbols = imports
      .filter((requested) => requested.from === from)
      .map(({ symbol }) => symbol)
      .filter((symbol) => !isNamedImported(sourceFile, symbol, from));

    return symbols.length > 0
      ? [insertNamedImport(sourceFile, filePath, symbols.join(', '), from)]
      : [];
  });
}

function isProvideFormbarCall(n: Expression) {
  return isCallExpression(n) && isCallee(n.expression, 'provideFormbar');
}

function hasIdentifier(name: string) {
  return function (n: Expression) {
    return isIdentifier(n) && n.text === name;
  };
}

function createArgsForConfig(
  ruleContext: RuleContext,
  registrationImport: (symbol: string) => string,
  providerConfigImportPath: string,
  imports: RequestedImport[],
) {
  const {
    provideInline,
    splitRegistrations,
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
    imports.push({
      symbol: 'componentRegistrations',
      from: registrationImport('componentRegistrations'),
    });
    const additionalProperties: ShorthandPropertyAssignment[] = [];

    if (includeSyncValidators) {
      imports.push({
        symbol: 'validatorRegistrations',
        from: registrationImport('validatorRegistrations'),
      });
      additionalProperties.push(
        factory.createShorthandPropertyAssignment('validatorRegistrations'),
      );
    }

    if (includeAsyncValidators) {
      imports.push({
        symbol: 'asyncValidatorRegistrations',
        from: registrationImport('asyncValidatorRegistrations'),
      });
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

  imports.push({ symbol: 'formbarConfig', from: providerConfigImportPath });
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
  existingElements: Expression[],
  addedElements: Expression[],
  imports: RequestedImport[],
  isMultiProvider = false,
) {
  imports.push({ symbol: tokenName, from: packageName });

  if (!checkTokenProviderExists(existingElements, tokenName)) {
    const provider = createMapProviderExpression(tokenName, isMultiProvider);
    addedElements.push(provider);
  }
}

function addSplitRegistrationProvider(
  providerName: string,
  registrationImport: (symbol: string) => string,
  existingElements: Expression[],
  addedElements: Expression[],
  imports: RequestedImport[],
) {
  const hasProvider = existingElements.some(hasIdentifier(providerName));

  if (!hasProvider) {
    imports.push({
      symbol: providerName,
      from: registrationImport(providerName),
    });

    addedElements.push(factory.createIdentifier(providerName));
  }
}

function handleSplitRegistrations(
  ruleContext: RuleContext,
  registrationImport: (symbol: string) => string,
  existingElements: Expression[],
  addedElements: Expression[],
  imports: RequestedImport[],
) {
  const { includeSyncValidators, includeAsyncValidators } = ruleContext;

  addSplitRegistrationProvider(
    'componentRegistrationsProvider',
    registrationImport,
    existingElements,
    addedElements,
    imports,
  );

  if (includeSyncValidators) {
    addSplitRegistrationProvider(
      'validatorRegistrationsProvider',
      registrationImport,
      existingElements,
      addedElements,
      imports,
    );
  }

  if (includeAsyncValidators) {
    addSplitRegistrationProvider(
      'asyncValidatorRegistrationsProvider',
      registrationImport,
      existingElements,
      addedElements,
      imports,
    );
  }
}

function handleStandaloneTokens(
  ruleContext: RuleContext,
  existingElements: Expression[],
  addedElements: Expression[],
  imports: RequestedImport[],
) {
  const { includeSyncValidators, includeAsyncValidators } = ruleContext;

  addStandaloneRegistrationProvider(
    NGX_FW_COMPONENT_REGISTRATIONS,
    CORE_PACKAGE_NAME,
    existingElements,
    addedElements,
    imports,
  );

  if (includeSyncValidators) {
    addStandaloneRegistrationProvider(
      NGX_FW_VALIDATOR_REGISTRATIONS,
      REACTIVE_FORMS_PACKAGE_NAME,
      existingElements,
      addedElements,
      imports,
      true,
    );
  }

  if (includeAsyncValidators) {
    addStandaloneRegistrationProvider(
      NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
      REACTIVE_FORMS_PACKAGE_NAME,
      existingElements,
      addedElements,
      imports,
      true,
    );
  }
}
