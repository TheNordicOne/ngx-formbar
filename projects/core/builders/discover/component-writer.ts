import * as fs from 'fs';
import * as path from 'path';
import { FormworkComponentInfo } from './models/component-info.model';

/**
 * Writes discovered components to a JSON file
 * @param components The discovered components to write
 * @param outputPath The path where to save the file
 * @param basePath The base path of the workspace (for relative paths)
 */
export function writeComponentsToFile(
  components: FormworkComponentInfo[],
  outputPath: string,
  basePath: string,
): void {
  // Convert absolute paths to relative paths for better portability
  const componentsWithRelativePaths = components.map((component) => ({
    ...component,
    filePath: path.relative(basePath, component.filePath).replace(/\\/g, '/'),
  }));

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the components to the output file
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        components: componentsWithRelativePaths,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  );
}
