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

function isEmptyArrayInComputed(path) {
  return (
    path.node.type === 'ArrayExpression' &&
    path.node.elements.length === 0 &&
    path.findParent(
      ({ node }) =>
        node.type === 'CallExpression' && node.callee.name === 'computed',
    ) !== null
  );
}

function isInjectionTokenDescription({ node, parent }) {
  return (
    node.type === 'StringLiteral' &&
    parent.type === 'NewExpression' &&
    parent.callee.name === 'InjectionToken' &&
    parent.arguments[0] === node
  );
}

export const strykerPlugins = [
  declareValuePlugin(PluginKind.Ignore, 'signal-options', {
    shouldIgnore: (path) => {
      if (isStaticallyRead(path)) {
        return 'Angular reads the options of this call at compile time.';
      }

      if (isInjectionTokenDescription(path)) {
        return 'Only shows up in Angular error messages.';
      }

      return isEmptyArrayInComputed(path)
        ? 'Filling it widens the type a template reads, which fails the build.'
        : undefined;
    },
  }),
];
