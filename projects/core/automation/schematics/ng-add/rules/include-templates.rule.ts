import { filter, Rule } from '@angular-devkit/schematics';
import { normalize, Path } from '@angular-devkit/core';

export function includeTemplates(templateNames: Path[]): Rule {
  return filter((path) => {
    return templateNames.includes(normalize(path));
  });
}
