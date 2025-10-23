import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';
import { Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { join } from 'path';
import { app, src, writeTs } from './helper';

export const COLLECTION_PATH = join(
  __dirname,
  '../../../../../dist/core/schematics/collection.json',
);

export async function setupWorkspace(runner: SchematicTestRunner) {
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
) {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    "import { provideFormwork } from 'ngx-formwork';",
    "import { formworkConfig } from './formwork.config';",
    "import { componentRegistrationsProvider } from './registrations';",
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormwork(formworkConfig),',
    '    componentRegistrationsProvider,',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);

  const formworkConfigContent = [
    "import { NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork';",
    '',
    'export const componentRegistrationsProvider = {',
    '  provide: NGX_FW_COMPONENT_REGISTRATIONS,',
    '  useValue: new Map([])',
    '};',
  ].join('\n');

  writeTs(appTree, src(registrationsPath), formworkConfigContent);
}

export function provideTokenNoSplit(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
) {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    "import { provideFormwork, NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork';",
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormwork(),',
    '    {',
    '      provide: NGX_FW_COMPONENT_REGISTRATIONS,',
    '      useValue: new Map([])',
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
) {
  const content = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    "import { provideFormwork } from 'ngx-formwork';",
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormwork({',
    '      componentRegistrations: {}',
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
  formworkConfigPath: string,
) {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    "import { provideFormwork } from 'ngx-formwork';",
    "import { formworkConfig } from './formwork.config';",
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormwork(formworkConfig),',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);

  const formworkConfigContent = [
    "import { defineFormworkConfig } from 'ngx-formwork';",
    "import { componentRegistrations } from './registrations';",
    '',
    'export const formworkConfig = defineFormworkConfig({',
    '    componentRegistrations,',
    '});',
  ].join('\n');

  writeTs(appTree, src(formworkConfigPath), formworkConfigContent);

  const registrationsContent = [
    "import { ComponentRegistrationConfig } from 'ngx-formwork';",
    '',
    'export const componentRegistrations: ComponentRegistrationConfig = {};',
  ].join('\n');

  writeTs(appTree, src(registrationsPath), registrationsContent);
}

export function provideMapNoSplit(
  appTree: UnitTestTree,
  appConfigPathRaw: string,
  formworkConfigPath: string,
) {
  const appConfigContent = [
    "import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';",
    "import { provideRouter } from '@angular/router';",
    "import { appRoutes } from './app.routes';",
    "import { provideHttpClient } from '@angular/common/http';",
    "import { provideFormwork } from 'ngx-formwork';",
    "import { formworkConfig } from './formwork.config';",
    '',
    'export const appConfig: ApplicationConfig = {',
    '  providers: [',
    '    provideZoneChangeDetection({ eventCoalescing: true }),',
    '    provideRouter(appRoutes),',
    '    provideHttpClient(),',
    '    provideFormwork(formworkConfig),',
    '    {',
    '        provide: NGX_FW_COMPONENT_REGISTRATIONS,',
    '        useValue: new Map([])',
    '    }',
    '  ],',
    '};',
    '',
  ].join('\n');

  writeTs(appTree, app(appConfigPathRaw), appConfigContent);

  const formworkConfigContent = [
    "import { defineFormworkConfig } from 'ngx-formwork';",
    '',
    'export const formworkConfig = defineFormworkConfig({',
    '    componentRegistrations: {},',
    '});',
  ].join('\n');

  writeTs(appTree, src(formworkConfigPath), formworkConfigContent);
}
