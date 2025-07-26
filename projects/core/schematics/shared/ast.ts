import { Tree } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { strings } from '@angular-devkit/core';
import { findConfigPath } from './file';

export function registerComponentInConfig(
  tree: Tree,
  sourceRoot: string,
  key: string,
  componentFilePath: string,
  componentClassName: string,
): void {
  const configPath = findConfigPath(tree, sourceRoot);
  if (!configPath) {
    console.warn(
      `No config file found under "${sourceRoot}". Skipping registration.`,
    );
    return;
  }

  const className = strings.classify(componentClassName);
  const importPath = buildRelativePath(configPath, componentFilePath);

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
  // existing export function args are not an object literal
  return (
    content.slice(0, openParen + 1) +
    `{ ${inner},\n      componentRegistrations: {\n        ${key}: ${className}\n      } }` +
    content.slice(closeParen)
  );
}

export function findMatching(
  char: '}' | ')',
  str: string,
  start: number,
): number {
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
