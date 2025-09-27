/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access */
import { fs, vol } from 'memfs';
import * as path from 'path';
import { writeComponentsToFile } from './component-writer';
import {
  FormworkComponentInfo,
  FormworkComponentType,
} from './models/component-info.model';
import { vi } from 'vitest';

vi.mock('path', () => ({
  relative: vi.fn(),
  dirname: vi.fn(),
}));

describe('Component Writer: writeComponentsToFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vol.reset();
  });

  it('should write components with relative paths to a file', () => {
    const components: FormworkComponentInfo[] = [
      {
        type: FormworkComponentType.Block,
        filePath: '/workspace/src/app/components/my-block.component.ts',
        className: 'MyBlockComponent',
        selector: 'app-my-block',
        directiveInputs: ['content', 'name'],
      },
    ];
    const outputPath = '/workspace/dist/formwork-components.json';
    const basePath = '/workspace';

    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => '');
    const writeFileSyncSpy = vi
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {
        // Dummy Content
      });
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(path, 'relative').mockReturnValue(
      'src/app/components/my-block.component.ts',
    );
    vi.spyOn(path, 'dirname').mockReturnValue('/workspace/dist');

    writeComponentsToFile(components, outputPath, basePath);

    expect(mkdirSyncSpy).toHaveBeenCalledWith('/workspace/dist', {
      recursive: true,
    });
    expect(writeFileSyncSpy).toHaveBeenCalled();

    const writtenContent = JSON.parse(
      writeFileSyncSpy.mock.calls[0][1] as string,
    );

    expect(writtenContent.components[0].filePath).toBe(
      'src/app/components/my-block.component.ts',
    );
    expect(writtenContent.components[0].className).toBe('MyBlockComponent');
    expect(writtenContent).toHaveProperty('generatedAt');
  });

  it('should not create directory if it already exists', () => {
    const components: FormworkComponentInfo[] = [];
    const outputPath = '/workspace/dist/formwork-components.json';
    const basePath = '/workspace';

    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync');
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(path, 'dirname').mockReturnValue('/workspace/dist');
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      // Dummy Content
    });

    writeComponentsToFile(components, outputPath, basePath);

    expect(mkdirSyncSpy).not.toHaveBeenCalled();
  });
});
