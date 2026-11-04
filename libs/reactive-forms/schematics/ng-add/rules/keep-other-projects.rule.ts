import { Rule } from '@angular-devkit/schematics';
import { joinToSourceRoot, resolveWithinWorkspace } from '@ngx-formbar/setup';
import { JSONFile } from '@schematics/angular/utility/json-file';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { ProjectDefinition } from '@schematics/angular/utility';

import { RuleContext } from '../schema';
import { generatorDefaults, schematicsConfigLink } from '../helper';
import {
  OWN_SCHEMATICS_CONFIG,
  schematicsConfigFile,
  settingsLostToNewShared,
  SHARED_CONFIG_FILE,
} from '../schematics-config-file';
import { SCHEMATICS_GENERATORS } from '../../shared/constants';

/**
 * A file leaves out what is at its default, so a new shared file would change it.
 * Such a setting gets stated in the file of every other project.
 */
export function keepOtherProjects(ruleContext: RuleContext): Rule {
  return async (tree, context) => {
    const { useSchematicConfig, projectName } = ruleContext;

    if (
      !useSchematicConfig ||
      tree.exists(SHARED_CONFIG_FILE) ||
      schematicsConfigFile(tree, ruleContext) !== SHARED_CONFIG_FILE
    ) {
      return;
    }

    const stated = generatorDefaults(ruleContext);
    const { projects } = await getWorkspace(tree);

    for (const [name, project] of projects) {
      const file = name === projectName ? null : configFileOf(project);

      if (file && tree.exists(file)) {
        const lost = settingsLostToNewShared(tree, file, stated);
        const json = new JSONFile(tree, file);

        lost.forEach(([setting, value]) => {
          json.modify([setting], value);
        });

        if (lost.length > 0) {
          context.logger.info(
            `${file} now states ${lost.map(([setting]) => setting).join(', ')}, so ${SHARED_CONFIG_FILE} does not change project ${name}.`,
          );
        }
      }
    }
  };
}

function configFileOf(project: ProjectDefinition) {
  const sourceRoot = project.sourceRoot ?? project.root;
  const link = schematicsConfigLink(project, SCHEMATICS_GENERATORS);

  return link
    ? resolveWithinWorkspace(link, sourceRoot)
    : joinToSourceRoot(OWN_SCHEMATICS_CONFIG, sourceRoot);
}
