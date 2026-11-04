import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin';

const STATICALLY_READ = [
  'input',
  'model',
  'output',
  'viewChild',
  'viewChildren',
  'contentChild',
  'contentChildren',
];

function isStaticallyRead({ node }) {
  const callee = node.type === 'CallExpression' ? node.callee : null;
  const name = callee?.type === 'MemberExpression' ? callee.object : callee;

  return name?.type === 'Identifier' && STATICALLY_READ.includes(name.name);
}

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'signal-options', {
    shouldIgnore: (path) =>
      isStaticallyRead(path)
        ? 'Angular reads the options of this call at compile time.'
        : undefined,
  }),
];
