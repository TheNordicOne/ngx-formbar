import { NgDocConfiguration } from '@ng-doc/builder';

const config: NgDocConfiguration = {
  docsPath: 'apps/docs/src/docs',
  repoConfig: {
    url: 'https://github.com/TheNordicOne/ngx-formbar',
    mainBranch: 'main',
    releaseBranch: 'main',
  },
};

export default config;
