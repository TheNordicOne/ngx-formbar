/* eslint-disable @typescript-eslint/require-await */

import {
  normalize,
  strings,
  virtualFs,
  workspaces,
  workspaces as WorkspaceAPI,
} from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { Schema } from './schema';
import * as path from 'path';

function createHost(tree: Tree): WorkspaceAPI.WorkspaceHost {
  return {
    async readFile(filePath: string): Promise<string> {
      const buffer = tree.read(filePath);
      if (!buffer) {
        throw new SchematicsException(`File "${filePath}" not found.`);
      }
      return virtualFs.fileBufferToString(buffer);
    },
    async writeFile(filePath: string, data: string): Promise<void> {
      tree.overwrite(filePath, data);
    },
    async isDirectory(dirPath: string): Promise<boolean> {
      return !tree.exists(dirPath) && tree.getDir(dirPath).subfiles.length > 0;
    },
    async isFile(filePath: string): Promise<boolean> {
      return tree.exists(filePath);
    },
  };
}

function findConfigPath(tree: Tree, sourceRoot: string): string | null {
  const candidates = [
    `/${sourceRoot}/formwork.config.ts`,
    `/${sourceRoot}/app.config.ts`,
  ];
  return candidates.find((p) => tree.exists(p)) ?? null;
}

function addImportIfNeeded(content: string, importStatement: string): string {
  if (content.includes(importStatement)) {
    return content;
  }
  const lastImport = content.lastIndexOf('import');
  if (lastImport === -1) {
    return `${importStatement}\n\n${content}`;
  }
  const endOfImports = content.indexOf(';', lastImport) + 1;
  return (
    content.slice(0, endOfImports) +
    `\n${importStatement}` +
    content.slice(endOfImports)
  );
}

function registerInObject(
  content: string,
  key: string,
  className: string,
): string {
  const start = content.indexOf('componentRegistrations');
  if (start === -1) {
    return content;
  }
  const objStart = content.indexOf('{', start);
  const objEnd = findMatching('}', content, objStart);
  if (objEnd < 0 || content.slice(objStart, objEnd).includes(`${key}:`)) {
    return content;
  }
  const hasEntries = /\{\s*[^}]/.test(content.slice(objStart + 1, objEnd));
  const insertion = hasEntries
    ? `,\n        ${key}: ${className}`
    : `\n        ${key}: ${className}\n      `;
  return content.slice(0, objEnd) + insertion + content.slice(objEnd);
}

function registerInFunction(
  content: string,
  key: string,
  className: string,
): string {
  const idx = content.indexOf('provideFormwork(');
  if (idx < 0) {
    return content;
  }
  const openParen = content.indexOf('(', idx);
  const closeParen = findMatching(')', content, openParen);
  const inner = content.slice(openParen + 1, closeParen).trim();
  const defaultObj = `{\n      componentRegistrations: {\n        ${key}: ${className}\n      }\n    }`;

  if (!inner) {
    return (
      content.slice(0, openParen + 1) + defaultObj + content.slice(closeParen)
    );
  }
  if (inner.startsWith('{') && inner.endsWith('}')) {
    const beforeClose = content.lastIndexOf('}', closeParen);
    const insertion = `,\n      componentRegistrations: {\n        ${key}: ${className}\n      }`;
    return (
      content.slice(0, beforeClose) + insertion + content.slice(beforeClose)
    );
  }
  // existing function args are not an object literal
  return (
    content.slice(0, openParen + 1) +
    `{ ${inner},\n      componentRegistrations: {\n        ${key}: ${className}\n      } }` +
    content.slice(closeParen)
  );
}

function findMatching(char: '}' | ')', str: string, start: number): number {
  const pair = char === '}' ? '{' : '(';
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === pair) depth++;
    else if (str[i] === char) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function registerComponentInConfig(
  tree: Tree,
  sourceRoot: string,
  name: string,
  key: string,
  componentPath: string,
): void {
  const configPath = findConfigPath(tree, sourceRoot);
  if (!configPath) {
    console.warn(
      `No config file found under "${sourceRoot}". Skipping registration.`,
    );
    return;
  }

  const className = `${strings.classify(name)}ControlComponent`;
  const importPath = buildRelativePath(
    configPath,
    path.posix.join(
      componentPath,
      `${strings.dasherize(name)}-control.component`,
    ),
  );

  let content = (tree.read(configPath) ?? '').toString('utf-8');
  content = addImportIfNeeded(
    content,
    `import { ${className} } from '${importPath}';`,
  );

  content = content.includes('componentRegistrations')
    ? registerInObject(content, strings.camelize(key), className)
    : registerInFunction(content, strings.camelize(key), className);

  tree.overwrite(configPath, content);
}

export function control(options: Schema): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);

    const projectName =
      (options.project ?? (workspace.extensions['defaultProject'] as string)) ||
      (() => {
        throw new SchematicsException('No project specified.');
      })();

    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new SchematicsException(`Project "${projectName}" not found.`);
    }

    const sourceRoot = project.sourceRoot
      ? `${project.sourceRoot}/app`
      : `${project.root}/src/app`;

    const name = options.name ?? options.key;
    const interfaceName = `${options.name ?? options.key}${options.interfaceSuffix}`;
    const componentDir = `/${options.path ?? name}/${name}`;

    const templateSource = apply(url('./files'), [
      applyTemplates({
        ...options,
        name,
        interfaceName,
        ...strings,
      }),
      move(normalize(componentDir)),
    ]);

    registerComponentInConfig(
      tree,
      sourceRoot,
      name,
      options.key,
      componentDir,
    );

    return chain([mergeWith(templateSource)]);
  };
}
