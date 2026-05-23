import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { join } from 'path';
import { app, src, writeTs } from './helper';
import { strings } from '@angular-devkit/core';
const { classify } = strings;
import {
  CORE_PACKAGE_NAME,
  REACTIVE_FORMS_PACKAGE_NAME,
} from '../shared/constants';

export const COLLECTION_PATH = join(
  __dirname,
  '../../../../../dist/libs/schematics/lib/collection.json',
);

export async function setupWorkspace(
  runner: SchematicTestRunner,
): Promise<UnitTestTree> {
  const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    version: '19.0.0',
    newProjectRoot: 'projects',
  };

  const workspaceTree = await runner.runExternalSchematic(
    '@schematics/angular',
    'workspace',
    workspaceOptions,
  );

  const appOptions: ApplicationOptions = {
    name: 'test-app',
    standalone: true,
  };

  return await runner.runExternalSchematic(
    '@schematics/angular',
    'application',
    appOptions,
    workspaceTree,
  );
}

export function provideToken(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
  registrationsPath: string,
  initialRegistrations = '',
  initialImports = '',
): void {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    `import { provideFormbar } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    "import { formbarConfig } from './formbar.config';",
    "import { componentRegistrationsProvider } from './registrations';",
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormbar(formbarConfig),',
    '    componentRegistrationsProvider,',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);

  const formbarConfigContent = [
    `import { NGX_FW_COMPONENT_REGISTRATIONS } from '${CORE_PACKAGE_NAME}';`,
    initialImports,
    '',
    'export const componentRegistrationsProvider = {',
    '  provide: NGX_FW_COMPONENT_REGISTRATIONS,',
    `  useValue: new Map([${initialRegistrations}])`,
    '};',
  ].join('\n');

  writeTs(appTree, src(registrationsPath), formbarConfigContent);
}

export function provideTokenNoSplit(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
  initialRegistrations = '',
  initialImports = '',
): void {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    `import { provideFormbar } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    `import { NGX_FW_COMPONENT_REGISTRATIONS } from '${CORE_PACKAGE_NAME}';`,
    initialImports,
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormbar(),',
    '    {',
    '      provide: NGX_FW_COMPONENT_REGISTRATIONS,',
    `      useValue: new Map([${initialRegistrations}])`,
    '    }',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);
}

export function provideMapInlineNoSplit(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
  initialRegistrations = '',
  initialImports = '',
): void {
  const content = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    `import { provideFormbar } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    initialImports,
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormbar({',
    `      componentRegistrations: {${initialRegistrations}}`,
    '    }),',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), content);
}

export function provideMap(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
  registrationsPath: string,
  formbarConfigPath: string,
  initialRegistrations = '',
  initialImports = '',
): void {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    `import { provideFormbar } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    "import { formbarConfig } from './formbar.config';",
    initialImports,
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormbar(formbarConfig),',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);

  const formbarConfigContent = [
    `import { defineFormbarConfig } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    "import { componentRegistrations } from './registrations';",
    '',
    'export const formbarConfig = defineFormbarConfig({',
    '    componentRegistrations,',
    '});',
  ].join('\n');

  writeTs(appTree, src(formbarConfigPath), formbarConfigContent);

  const registrationsContent = [
    `import { ComponentRegistrationConfig } from '${CORE_PACKAGE_NAME}';`,
    '',
    `export const componentRegistrations: ComponentRegistrationConfig = {${initialRegistrations}};`,
  ].join('\n');

  writeTs(appTree, src(registrationsPath), registrationsContent);
}

export function provideMapNoSplit(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
  formbarConfigPath: string,
  initialRegistrations = '',
  initialImports = '',
): void {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    `import { provideFormbar } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    "import { formbarConfig } from './formbar.config';",
    initialImports,
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormbar(formbarConfig),',
    '    {',
    '        provide: NGX_FW_COMPONENT_REGISTRATIONS,',
    `        useValue: new Map([${initialRegistrations}])`,
    '    }',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);

  const formbarConfigContent = [
    `import { defineFormbarConfig } from '${REACTIVE_FORMS_PACKAGE_NAME}';`,
    '',
    'export const formbarConfig = defineFormbarConfig({',
    '    componentRegistrations: {},',
    '});',
  ].join('\n');

  writeTs(appTree, src(formbarConfigPath), formbarConfigContent);
}

export function addHelperIndexFile(
  appTree: UnitTestTree,
  helperPath: string,
): void {
  const index = [
    "export { controlContainerViewProviders } from './control-container.view-provider';",
    "export { viewProviders } from './view-provider';",
  ].join('\n');

  writeTs(appTree, src(`${helperPath}/index.ts`), index);
}

export function addComponentFiles(
  appTree: UnitTestTree,
  files: TestComponentDetails[],
): void {
  for (const { path, content } of files) {
    writeTs(appTree, path, content);
  }
}

export function createControlComponent(
  name: string,
  providersAndImports: [string, string],
  className: string,
): string {
  const classifiedName = classify(name);

  const [providers, imports] = providersAndImports;

  return `import { Component, input } from '@angular/core';
import { ReactiveFormbarControl } from '${REACTIVE_FORMS_PACKAGE_NAME}';
import { ReactiveFormsModule } from '@angular/forms';
${imports}

@Component({
  selector: 'app-${name}-control',
  imports: [ReactiveFormsModule],
  templateUrl: './${name}-control.component.html',
  ${providers}
})
export class ${className} implements ReactiveFormbarControl<${classifiedName}Control> {
  readonly name = input.required<string>();
}
`;
}

export type TestComponentDetails = {
  path: string;
  content: string;
  className: string;
  key: string;
  shouldRegister?: boolean;
};

export const inlineProviders: [string, string] = [
  `viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],`,
  `import { inject } from '@angular/core';
import { ControlContainer } from '@angular/forms';`,
];

export const helperProviders: [string, string] = [
  `viewProviders: viewProviders,`,
  `import { viewProviders } from '../shared/helper';`,
];

export function createUnrelatedComponent(
  name: string,
  className: string,
): string {
  return `import { Component } from '@angular/core';
        @Component({ selector: 'app-${name}', template: '' })
        export class ${className} {}`;
}
