import * as fs from 'node:fs';
import * as path from 'path';
import { Project, QuoteKind, ts } from 'ts-morph';
import { FormworkComponentInfo } from './models/component-info.model';
import { register } from '../../shared/control-registration';
import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';
import { DEFAULT_REGISTRATION_TYPE } from '../../schematics/ng-add/constants';

/**
 * Writes discovered components to a TypeScript file that provides component registrations
 * @param components The discovered components to write
 * @param outputPath The path where to save the file
 * @param automationConfig Optional automation configuration to customize registration behavior
 */
export function writeComponentsToFile(
  components: FormworkComponentInfo[],
  outputPath: string,
  automationConfig?: NgxFormworkAutomationConfig | null,
): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
    },
  });

  const registrationType =
    automationConfig?.registrationType ?? DEFAULT_REGISTRATION_TYPE;

  let initialContent = '';
  switch ('token') {
    case registrationType:
      initialContent = `
import { NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork';

export const componentRegistrationsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map([])
};
`;
      break;
    default:
      initialContent = `
import { defineFormworkConfig } from 'ngx-formwork';

export default defineFormworkConfig({
  components: {}
});
`;
      break;
  }

  // Create an initial source file with the basic provider structure
  const sourceFile = project.createSourceFile(outputPath, initialContent, {
    overwrite: true,
  });

  // Register each component using the configured registration type
  components.forEach((component) => {
    const rawRelative = path.relative(outputDir, component.filePath);
    const noExt = rawRelative.replace(/\.ts$/, '');
    const posix = noExt.split(path.sep).join('/');
    const needsDotPrefix = !posix.startsWith('.') && !posix.startsWith('/');
    const moduleSpecifier = needsDotPrefix ? `./${posix}` : posix;

    // Determine the component key based on type (control, group, block) if available
    const componentType = component.type.toLowerCase();
    const key =
      component.selector?.split('-').slice(1).join('-') ?? componentType;

    register(sourceFile, {
      key,
      componentClassName: component.className,
      componentImportPath: moduleSpecifier,
      registrationType,
    });
  });

  sourceFile.formatText({
    indentSize: 2,
  });

  fs.writeFileSync(outputPath, sourceFile.getFullText(), 'utf8');
}
