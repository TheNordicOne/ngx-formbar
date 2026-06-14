Like any other package, ngx-formbar has some known issues. Below you find a list with links to GitHub issues, where they exist.
This list is not exhaustive, so also check the [GitHub Issues](https://github.com/TheNordicOne/ngx-formbar/issues) for anything not listed here.

- <span class="badge badge--improvement">Improvement</span> [Type safety in expression functions](https://github.com/TheNordicOne/ngx-formbar/issues/75)
  - The `formValue` parameter defaults to `FormContext` (`Record<string, unknown>`) and is not inferred from the form structure. As a workaround, annotate the parameter with the type you already use for this data. See [Configuring a Form &rarr; Typing the Form Value](/fundamentals/configuration#typing-the-form-value).
