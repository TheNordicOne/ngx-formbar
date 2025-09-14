import { createBuilder } from '@angular-devkit/architect';
import { getSystemPath, normalize } from '@angular-devkit/core';

export default createBuilder((_, ctx) => {
  ctx.logger.info('Starting discovery...');
  try {
    const workspaceRoot = getSystemPath(normalize(ctx.workspaceRoot));
    console.log(workspaceRoot);
  } catch {
    ctx.logger.fatal('Discovery failed!');
    return {
      success: false,
    };
  }
  return {
    success: true,
  };
});
