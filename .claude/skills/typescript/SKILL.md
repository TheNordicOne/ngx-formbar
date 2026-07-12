---
name: typescript
description: Opinionated TypeScript code style and type safety rules. Activate when editing any `.ts` file — covers control flow, type safety, enums, and naming conventions.
license: MIT
compatibility: Requires TypeScript 5+
---

# TypeScript Code Style

Strict, opinionated rules. Follow these to write correct code on the first draft.

## Control Flow

- **Early returns for guard clauses** — return early for error/edge cases to keep main logic flat
- **Always use block bodies** for `if` with `return` — never `if (!x) return;` on one line
- **Prefer positive conditions** — check what should happen, not what shouldn't. Does NOT apply to guard clauses, where negative checks are expected
- **No `else` after `return`** — if a branch returns, the next block needs no `else`
- **`switch` over chained `if`** — when checking the same variable against multiple values

## Functions

A named, standalone function is a `function` declaration — not `const name = () => {}`. Reach for arrow-const only when the language forces your hand, never as the default.

- **Named standalone functions → `function` declarations** — `function sortByDate(items: Item[]) {}`, not `const sortByDate = () => {}`. Declarations hoist (so you can order code top-down, callers above definitions), the `function` keyword announces what the thing is, and stack traces get a real name for free. The reflexive `const fn = () =>` habit buys none of this.
- **Arrow functions are for the cases the rule doesn't reach**, not for dodging it:
  - **Anonymous callbacks** passed as arguments — `users.filter(u => u.active).map(u => u.name)`. Never named, so nothing to declare.
  - **Functions you're handed back and must store** — `const onClick = useCallback(() => {...}, [id])`, or an arrow you immediately `return`. Something else produces the function; you're just naming the result. There's no declaration form to prefer.
- **Currying is not a reason** — the named outer function stays a declaration; only the returned inner lambda is an arrow:

  ```typescript
  function withRetry(attempts: number) {
    return (fn: () => void) => {
      for (let i = 0; i < attempts; i++) { /* ... */ }
    };
  }
  ```
- **Follow the framework's idiom where one exists** — if a library or framework has an established best practice for how its functions are written (component or hook conventions, etc.), match it rather than fighting it. Defer to real, documented convention — not to habit.

## Type Safety

- **No `any`** — forbidden. Use `unknown` for uncertain types, generics to preserve/relate types
- **No non-null assertions (`!`)** — forbidden. Use optional chaining (`?.`) or guard clauses
- **Minimize `as` casting** — fix types at the source. Use generics, `satisfies`, or type guards instead
- **Generics over broad types** — prefer generic parameters over accepting broad types and casting results
- **Let TypeScript infer return types** — only annotate when needed (public APIs, recursion, or when inference produces the wrong type)

## Enums

**No enums** — forbidden. Use `as const` objects with derived types:

```typescript
const Status = {
  Active: 'active',
  Inactive: 'inactive',
} as const;

type Status = (typeof Status)[keyof typeof Status];
```

## Naming

- **Be descriptive** — prefer specificity over brevity. `activeUsers` not `data`, `sortByDate` not `process`
- **No `I`/`T` prefixes** — `User` not `IUser`, `Config` not `TConfig`
