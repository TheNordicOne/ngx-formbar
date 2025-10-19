import { vol } from 'memfs';
import { Project, PropertyAssignment, SyntaxKind, ts } from 'ts-morph';
import { writeComponentsToFile } from './component-writer';
import {
  FormworkComponentInfo,
  FormworkComponentType,
} from './models/component-info.model';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Component Writer: writeComponentsToFile', () => {
  let project: Project;

  beforeEach(() => {
    vol.reset();
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
      },
    });
  });

  it('should generate a TypeScript file with component registrations', () => {
    const components: FormworkComponentInfo[] = [
      {
        type: FormworkComponentType.Block,
        filePath: '/workspace/src/app/components/my-block.component.ts',
        className: 'MyBlockComponent',
        selector: 'app-my-block',
        directiveInputs: ['content', 'name'],
      },
      {
        type: FormworkComponentType.Control,
        filePath: '/workspace/src/app/components/text-control.component.ts',
        className: 'TextControlComponent',
        selector: 'app-text-control',
        directiveInputs: ['value', 'required'],
      },
    ];
    const outputPath = '/workspace/src/app/component-registrations.provider.ts';

    writeComponentsToFile(components, outputPath);

    expect(vol.existsSync(outputPath)).toBe(true);

    expect(vol.existsSync('/workspace/src/app')).toBe(true);

    const fileContent = vol.readFileSync(outputPath, 'utf8').toString();

    const sourceFile = project.createSourceFile('test.ts', fileContent);

    const importDeclarations = sourceFile.getImportDeclarations();
    expect(importDeclarations).toHaveLength(3);

    const ngxFwImport = importDeclarations.find(
      (importDecl) => importDecl.getModuleSpecifierValue() === 'ngx-formwork',
    );
    expect(ngxFwImport).toBeDefined();
    expect(ngxFwImport?.getNamedImports()[0].getName()).toBe(
      'NGX_FW_COMPONENT_REGISTRATIONS',
    );

    expect(
      importDeclarations.some(
        (importDecl) =>
          importDecl.getModuleSpecifierValue() ===
            './components/my-block.component' &&
          importDecl.getNamedImports()[0].getName() === 'MyBlockComponent',
      ),
    ).toBe(true);

    expect(
      importDeclarations.some(
        (importDecl) =>
          importDecl.getModuleSpecifierValue() ===
            './components/text-control.component' &&
          importDecl.getNamedImports()[0].getName() === 'TextControlComponent',
      ),
    ).toBe(true);

    const exportAssignment = sourceFile.getVariableDeclaration(
      'componentRegistrationsProvider',
    );
    expect(exportAssignment).toBeDefined();
    expect(
      sourceFile
        .getExportedDeclarations()
        .has('componentRegistrationsProvider'),
    ).toBe(true);

    const objectLiteral = exportAssignment?.getInitializer();
    expect(objectLiteral?.getKind()).toBe(SyntaxKind.ObjectLiteralExpression);

    const objectLiteralExp = objectLiteral?.asKind(
      SyntaxKind.ObjectLiteralExpression,
    );

    const provideProp = objectLiteralExp?.getProperty('provide');
    expect(provideProp).toBeDefined();

    const provideInit = (provideProp as PropertyAssignment).getInitializer();
    expect(provideInit?.getKind()).toBe(SyntaxKind.Identifier);
    expect(provideInit?.getText()).toBe('NGX_FW_COMPONENT_REGISTRATIONS');

    const useValueProperty = objectLiteralExp?.getProperty('useValue');
    expect(useValueProperty).toBeDefined();

    const newExpression = useValueProperty?.getFirstDescendantByKind(
      SyntaxKind.NewExpression,
    );
    expect(newExpression?.getExpression().getText()).toBe('Map');

    const arrayLiteral = newExpression?.getArguments()[0];
    expect(arrayLiteral?.getKind()).toBe(SyntaxKind.ArrayLiteralExpression);

    const arrayElements = arrayLiteral
      ?.asKind(SyntaxKind.ArrayLiteralExpression)
      ?.getElements();
    expect(arrayElements).toHaveLength(2); // 2 components registered

    const entries = arrayElements?.map((element) => {
      const arrayEntry = element.asKind(SyntaxKind.ArrayLiteralExpression);
      const key = arrayEntry?.getElements()[0].getText();
      const value = arrayEntry?.getElements()[1].getText();
      return { key, value };
    });

    expect(entries).toContainEqual({
      key: "'my-block'",
      value: 'MyBlockComponent',
    });
    expect(entries).toContainEqual({
      key: "'text-control'",
      value: 'TextControlComponent',
    });
  });

  it('handles empty component array correctly', () => {
    const components: FormworkComponentInfo[] = [];
    const outputPath = '/workspace/src/app/component-registrations.provider.ts';

    writeComponentsToFile(components, outputPath);

    expect(vol.existsSync(outputPath)).toBe(true);

    const fileContent = vol.readFileSync(outputPath, 'utf8').toString();

    const sourceFile = project.createSourceFile('test-empty.ts', fileContent);

    const importDeclarations = sourceFile.getImportDeclarations();
    expect(importDeclarations).toHaveLength(1);

    const mapArgument = sourceFile
      .getFirstDescendantByKind(SyntaxKind.NewExpression)
      ?.getArguments()[0]
      .asKind(SyntaxKind.ArrayLiteralExpression);

    expect(mapArgument?.getElements().length).toBe(0);
  });

  it('creates the output directory if it does not exist', () => {
    const components: FormworkComponentInfo[] = [
      {
        type: FormworkComponentType.Block,
        filePath: '/workspace/src/app/components/info-block.component.ts',
        className: 'InfoBlockComponent',
        selector: 'app-info',
        directiveInputs: ['content'],
      },
    ];
    const outputPath =
      '/workspace/src/app/nested/dir/component-registrations.provider.ts';

    writeComponentsToFile(components, outputPath);

    expect(vol.existsSync('/workspace/src/app/nested/dir')).toBe(true);

    expect(vol.existsSync(outputPath)).toBe(true);

    const fileContent = vol.readFileSync(outputPath, 'utf8').toString();

    const sourceFile = project.createSourceFile('test-nested.ts', fileContent);

    const mapEntries = sourceFile
      .getFirstDescendantByKind(SyntaxKind.NewExpression)
      ?.getArguments()[0]
      .asKind(SyntaxKind.ArrayLiteralExpression)
      ?.getElements();

    expect(mapEntries).toHaveLength(1);

    const firstEntry = mapEntries?.[0].asKind(
      SyntaxKind.ArrayLiteralExpression,
    );
    expect(firstEntry?.getElements()[0].getText()).toBe("'info'");
    expect(firstEntry?.getElements()[1].getText()).toBe('InfoBlockComponent');
  });
});
