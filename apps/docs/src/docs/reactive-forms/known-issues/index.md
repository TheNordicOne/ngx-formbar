Like any other package, _ngx-formbar_ has some known issues. Below you find a list with links to GitHub issues, where they exist.
This list is not exhaustive, so also check the [GitHub Issues](https://github.com/TheNordicOne/ngx-formbar/issues) for anything not listed here.

- <span class="badge badge--improvement">Improvement</span> [Type safety in expression functions](https://github.com/TheNordicOne/ngx-formbar/issues/75)
  - The `formValue` parameter defaults to `FormContext` (`Record<string, unknown>`) and is not inferred from the form structure. As a workaround, annotate the parameter with the type you already use for this data. See [Configuring a Form &rarr; Typing the Form Value](/fundamentals/configuration#typing-the-form-value).
- <span class="badge badge--bug">Bug</span> [Cross-group `computedValue` string expressions fail on initial render](https://github.com/TheNordicOne/ngx-formbar/issues/83)
  - String expressions like `'groupA.fieldA + " " + groupB.fieldB'` that reference fields inside sibling groups fail on initial render because `setComputedValueEffect` fires before sibling groups have registered their children. Use optional chaining (`'groupA?.fieldA'`) as a workaround. See the [Computed Values](/reactive-forms/guides/controls#computed-values) section for details.
