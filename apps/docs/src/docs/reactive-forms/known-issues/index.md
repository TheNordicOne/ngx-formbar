Like any other package, _ngx-formbar_ has some known issues. Below you find a list with links to GitHub issues, where they exist.
This list is not exhaustive, so also check the [GitHub Issues](https://github.com/TheNordicOne/ngx-formbar/issues) for anything not listed here.

- <span class="badge badge--improvement">Improvement</span> [Registering validators per token prevents from referencing other validators by key since we get the whole map.](https://github.com/TheNordicOne/ngx-formbar/issues/65)
  - Not a bug, but limits the usefulness of validator registrations via DI token. The purpose of the DI token is to provide the values in exactly the shape as they are required.
- <span class="badge badge--improvement">Improvement</span> [Type safety in expression functions](https://github.com/TheNordicOne/ngx-formbar/issues/75)
  - At this point it is not clear what the best solution would be
- <span class="badge badge--bug">Bug</span> [Cross-group `computedValue` string expressions fail on initial render](https://github.com/TheNordicOne/ngx-formbar/issues/83)
  - String expressions like `'groupA.fieldA + " " + groupB.fieldB'` that reference fields inside sibling groups fail on initial render because `setComputedValueEffect` fires before sibling groups have registered their children. Use optional chaining (`'groupA?.fieldA'`) as a workaround. See the [Computed Values](/reactive-forms/guides/controls#computed-values) section for details.
