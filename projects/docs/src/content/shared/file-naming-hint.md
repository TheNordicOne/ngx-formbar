:::caution
Helper and registration files must have a barrel export (index.ts). Otherwise, the schematics will not recognize the files correctly and falling back to the verbose syntax.

The declarations within these files also have to be exact, otherwise you will end up with a broken import that you need to fix manually.
:::
