import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

const [target, port] = process.argv.slice(2);
const env = {
  ...process.env,
  NX_DAEMON: 'false',
  NX_DISABLE_DB: 'true',
  STRYKER_BUILD: 'true',
};
const nx = (args) =>
  execSync(`npx nx ${args} --skip-nx-cache`, { env, stdio: 'inherit' });

if (target === 'runtime') {
  nx('run storybook:build-storybook:ci');
  spawn(
    process.execPath,
    ['stryker/serve-storybook.mjs', 'dist/storybook', port],
    { detached: true, stdio: 'ignore' },
  ).unref();
} else {
  nx('run @ngx-formbar/reactive-forms:build-schematics');
  nx('build @ngx-formbar/schematics');
}
