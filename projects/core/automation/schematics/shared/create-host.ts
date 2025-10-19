/* eslint-disable @typescript-eslint/require-await */

import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { virtualFs, workspaces as WorkspaceAPI } from '@angular-devkit/core';

export function createHost(tree: Tree): WorkspaceAPI.WorkspaceHost {
  return {
    async readFile(filePath: string): Promise<string> {
      const buffer = tree.read(filePath);
      if (!buffer) {
        throw new SchematicsException(`File "${filePath}" not found.`);
      }
      return virtualFs.fileBufferToString(buffer);
    },
    async writeFile(filePath: string, data: string): Promise<void> {
      tree.overwrite(filePath, data);
    },
    async isDirectory(dirPath: string): Promise<boolean> {
      return !tree.exists(dirPath) && tree.getDir(dirPath).subfiles.length > 0;
    },
    async isFile(filePath: string): Promise<boolean> {
      return tree.exists(filePath);
    },
  };
}
