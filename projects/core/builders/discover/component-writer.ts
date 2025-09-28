import * as fs from 'node:fs';
import * as path from 'path';
import {
  CodeBlockWriter,
  Project,
  QuoteKind,
  ts,
  VariableDeclarationKind,
} from 'ts-morph';
import { FormworkComponentInfo } from './models/component-info.model';

/**
 * Writes discovered components to a TypeScript file that provides component registrations
 * @param components The discovered components to write
 * @param outputPath The path where to save the file
 */
export function writeComponentsToFile(
  components: FormworkComponentInfo[],
  outputPath: string,
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

  const sourceFile = project.createSourceFile(outputPath, '', {
    overwrite: true,
  });

  sourceFile.addImportDeclaration({
    moduleSpecifier: 'ngx-formwork',
    namedImports: ['NGX_FW_COMPONENT_REGISTRATIONS'],
  });

  components.forEach((component) => {
    const rawRelative = path.relative(outputDir, component.filePath);
    const noExt = rawRelative.replace(/\.ts$/, '');

    const posix = noExt.split(path.sep).join('/');

    const needsDotPrefix = !posix.startsWith('.') && !posix.startsWith('/');
    const moduleSpecifier = needsDotPrefix ? `./${posix}` : posix;

    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: [component.className],
    });
  });

  const registrations = components.map((component) => {
    const key =
      component.selector?.split('-').slice(1).join('-') ??
      component.type.toLowerCase();

    return `  ['${key}', ${component.className}]`;
  });

  sourceFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'componentRegistrationsProvider',
        initializer: (w) => {
          writeProvider(w, registrations);
        },
      },
    ],
  });

  sourceFile.formatText({
    indentSize: 2,
  });

  fs.writeFileSync(outputPath, sourceFile.getFullText(), 'utf8');
}

function writeProvider(w: CodeBlockWriter, regs: readonly string[]) {
  w.write('{').newLine();
  w.indent(() => {
    w.writeLine('provide: NGX_FW_COMPONENT_REGISTRATIONS,');
    w.write('useValue: new Map([').newLine();

    if (regs.length === 0) {
      w.write('])');
      return;
    }

    w.indent(() => {
      regs.forEach((entry, i) => {
        w.write(entry);
        if (i < regs.length - 1) {
          w.write(',');
        }
        w.newLine();
      });
    });

    w.write('])');
  });
  w.newLine().write('}');
}
