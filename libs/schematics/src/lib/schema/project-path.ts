/**
 * Turns a path out of `schema.emitters` — an entry's `output` or a `use`
 * pointing at a file — into a Tree path. Such paths are project-relative,
 * matching how the `type` reference already resolves. A leading `/` means
 * workspace-absolute, for the consumer who genuinely wants to reach outside
 * their project. Resolving here rather than in each emitter keeps every
 * emitter, ours and a consumer's, from having to know the convention.
 */
export function resolveProjectPath(spec: string, projectRoot: string): string {
  if (spec.startsWith('/')) {
    return spec;
  }

  return `/${projectRoot}/${spec.replace(/^\.\//, '')}`;
}
