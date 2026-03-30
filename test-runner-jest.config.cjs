const { getJestConfig } = require('@storybook/test-runner');

const testRunnerConfig = getJestConfig();

module.exports = {
  ...testRunnerConfig,
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/'],
};
