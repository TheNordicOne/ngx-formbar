import { Rule, Tree } from '@angular-devkit/schematics';
import { joinToSourceRoot, resolveWithinWorkspace } from '@ngx-formbar/setup';
import { ProjectDefinition } from '@schematics/angular/utility';
import { JSONFile } from '@schematics/angular/utility/json-file';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { createInterface } from 'node:readline';

import { RuleContext } from '../schema';
import { generatorDefaults, schematicsConfigLink } from '../helper';
import {
  OWN_SCHEMATICS_CONFIG,
  schematicsConfigFile,
  settingsLostToNewShared,
  SHARED_CONFIG_FILE,
} from '../schematics-config-file';
import { SCHEMATICS_GENERATORS } from '../../shared/constants';

interface AffectedFile {
  file: string;
  settings: [string, string | null][];
}

/**
 * A file leaves out what is at its default, so a new shared file would change
 * it. That can be intended, so writing those settings into the file of each other
 * project takes `updateOtherProjects` or a yes to the prompt.
 */
export function keepOtherProjects(ruleContext: RuleContext): Rule {
  return async (tree, context) => {
    const { useSchematicConfig, updateOtherProjects } = ruleContext;

    if (
      !useSchematicConfig ||
      tree.exists(SHARED_CONFIG_FILE) ||
      schematicsConfigFile(tree, ruleContext) !== SHARED_CONFIG_FILE
    ) {
      return;
    }

    const affected = await affectedFiles(tree, ruleContext);

    if (affected.length === 0) {
      return;
    }

    const list = affected.map(describe).join('\n');
    const update =
      updateOtherProjects ??
      (isInteractive() &&
        (await confirm(
          `${SHARED_CONFIG_FILE} would change other projects. Write what they use now into their files?\n${list}`,
        )));

    if (!update) {
      context.logger.warn(
        `${SHARED_CONFIG_FILE} changes other projects. To keep what they use now, write this into their files:\n${list}`,
      );

      return;
    }

    affected.forEach(({ file, settings }) => {
      const json = new JSONFile(tree, file);

      settings.forEach(([setting, value]) => {
        json.modify([setting], value);
      });
    });
    context.logger.info(`Updated other projects:\n${list}`);
  };
}

async function affectedFiles(tree: Tree, ruleContext: RuleContext) {
  const stated = generatorDefaults(ruleContext);
  const { projects } = await getWorkspace(tree);

  return [...projects]
    .filter(([name]) => name !== ruleContext.projectName)
    .map(([, project]) => configFileOf(project))
    .filter((file): file is string => !!file && tree.exists(file))
    .map(
      (file): AffectedFile => ({
        file,
        settings: settingsLostToNewShared(tree, file, stated),
      }),
    )
    .filter(({ settings }) => settings.length > 0);
}

function configFileOf(project: ProjectDefinition) {
  const sourceRoot = project.sourceRoot ?? project.root;
  const link = schematicsConfigLink(project, SCHEMATICS_GENERATORS);

  return link
    ? resolveWithinWorkspace(link, sourceRoot)
    : joinToSourceRoot(OWN_SCHEMATICS_CONFIG, sourceRoot);
}

function describe({ file, settings }: AffectedFile) {
  const values = settings
    .map(([setting, value]) => `"${setting}": ${JSON.stringify(value)}`)
    .join(', ');

  return `  ${file}: ${values}`;
}

/** `x-prompt` asks on every run, as a schema cannot depend on what a rule finds. */
function isInteractive() {
  return (
    process.stdout.isTTY &&
    process.stdin.isTTY &&
    !process.env.CI &&
    flagValue('interactive') !== false &&
    flagValue('defaults') !== true
  );
}

/** The CLI does not hand a schematic these flags, so they are read like it reads them. */
function flagValue(flag: string) {
  const { argv } = process;
  const index = argv.findIndex(
    (argument) =>
      argument === `--${flag}` ||
      argument === `--no-${flag}` ||
      argument.startsWith(`--${flag}=`),
  );

  return index < 0
    ? undefined
    : argv[index] !== `--no-${flag}` &&
        (argv[index].split('=').at(1) ?? argv.at(index + 1)) !== 'false';
}

function confirm(question: string) {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<boolean>((resolve) => {
    prompt.question(`${question}\n(y/N) `, (answer) => {
      prompt.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}
