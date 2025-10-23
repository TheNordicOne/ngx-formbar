import * as fs from 'node:fs';
import { FormworkComponentInfo } from './models/component-info.model';
import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';
import { DEFAULT_REGISTRATION_TYPE } from '../../shared/constants';
import { registerTypeMap, registerTypeToken } from './helper';
import { BuilderContext } from '@angular-devkit/architect';
import { parseTS } from '../../schematics/shared/ast';

export function writeComponentsToFile(
  components: FormworkComponentInfo[],
  outputPath: string,
  automationConfig: NgxFormworkAutomationConfig,
  context: BuilderContext,
) {
  if (!fs.existsSync(outputPath)) {
    context.logger.error(
      `Target file ${outputPath} does not exist! Components cannot be registered!`,
    );
    return false;
  }

  const { registrationType = DEFAULT_REGISTRATION_TYPE } = automationConfig;
  const buffer = fs.readFileSync(outputPath);
  const content = buffer.toString('utf-8');
  const sourceFile = parseTS(content);

  switch (registrationType) {
    case 'token':
      return registerTypeToken(
        sourceFile,
        components,
        outputPath,
        automationConfig,
      );
    case 'map':
      return registerTypeMap(
        sourceFile,
        components,
        outputPath,
        automationConfig,
      );
  }
}
