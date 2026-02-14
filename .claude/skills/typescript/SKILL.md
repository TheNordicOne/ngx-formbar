---
name: typescript
description: TypeScript code style and type safety rules. Use when writing, reviewing, or refactoring TypeScript code — covers control flow patterns, type safety, naming conventions, and code clarity.
license: MIT
compatibility: Requires TypeScript 5+
---

# TypeScript Code Style

Strict TypeScript coding rules for clean, flat, type-safe code.

## Control Flow

### Prefer Early Returns (Guard Clauses)

Return early for error/edge cases to keep the main logic flat and un-nested.

```typescript
// BAD - nested
function process(user: User | null) {
  if (user) {
    if (user.isActive) {
      return doWork(user);
    } else {
      return notifyInactive(user);
    }
  } else {
    return reportMissing();
  }
}

// GOOD - flat with guard clauses
function process(user: User | null) {
  if (!user) {
    return reportMissing();
  }

  if (!user.isActive) {
    return notifyInactive(user);
  }

  return doWork(user);
}
```

### Always Use Block Bodies for `if` with `return`

Never put a return on the same line as an `if`.

```typescript
// BAD
if (!isValid()) return;

// GOOD
if (!isValid()) {
  return;
}
```

### Prefer Positive Conditions

Check for what should happen, not what shouldn't. This does **not** apply to guard clauses, where negative checks are expected.

```typescript
// BAD - negative condition wrapping main logic
if (!isInvalid) {
  processData();
}

// GOOD - positive condition
if (isValid) {
  processData();
}
```

### Avoid `else` Statements

If a branch returns, there is no need for `else`. This applies everywhere, not just guard clauses.

```typescript
// BAD
function getLabel(status: Status) {
  if (status === 'active') {
    return 'Active';
  } else if (status === 'pending') {
    return 'Pending';
  } else {
    return 'Unknown';
  }
}

// GOOD
function getLabel(status: Status) {
  if (status === 'active') {
    return 'Active';
  }

  if (status === 'pending') {
    return 'Pending';
  }

  return 'Unknown';
}
```

### Prefer `switch` Over Multiple `if` Checks

When checking the same variable against multiple values, use `switch`.

```typescript
// BAD
if (role === 'admin') {
  // ...
} else if (role === 'editor') {
  // ...
} else if (role === 'viewer') {
  // ...
}

// GOOD
switch (role) {
  case 'admin':
    // ...
    break;
  case 'editor':
    // ...
    break;
  case 'viewer':
    // ...
    break;
}
```

## Type Safety

### No `any` Type

Usage of `any` is **forbidden**. Use `unknown` when the type is uncertain, and use generics when the function needs to preserve or relate types. If `any` is truly unavoidable, add a comment explaining why.

```typescript
// BAD
function parse(data: any) { ... }
function first(items: any[]) { return items[0]; }

// GOOD - unknown for uncertain types
function parse(data: unknown) { ... }

// GOOD - generic to preserve the type
function first<T>(items: T[]) { return items[0]; }
```

### Use Generics to Avoid Casting

When a function operates on multiple types, prefer generics over accepting a broad type and casting the result. This also reduces the need for `as` assertions at call sites.

```typescript
// BAD - forces callers to cast
function getById(id: string) {
  return store.get(id);
}
const user = getById('1') as User;

// GOOD - generic, typed store eliminates casting entirely
function getById<T>(store: Map<string, T>, id: string) {
  return store.get(id);
}
const user = getById(userStore, '1');
```

### Minimize Type Casting

Avoid `as` and `<Type>` casting. Fix types at the source, use generics, `satisfies`, or type guards instead.

```typescript
// BAD
const name = (response as UserResponse).name;

// GOOD - type guard
function isUserResponse(value: unknown): value is UserResponse {
  return typeof value === 'object' && value !== null && 'name' in value;
}

if (isUserResponse(response)) {
  const name = response.name;
}

// GOOD - satisfies
const config = {
  timeout: 3000,
  retries: 3,
} satisfies RequestConfig;
```

### No Non-Null Assertions (`!`)

The non-null assertion operator is **forbidden**. Use proper null/undefined checking with guard clauses or optional chaining.

```typescript
// BAD
const name = user!.name;
const el = document.querySelector('.header')!;

// GOOD
const name = user?.name;

const el = document.querySelector('.header');
if (!el) {
  return;
}
```

### Let TypeScript Infer Return Types

Do not write explicit return types unless absolutely necessary (e.g., public API contracts, recursive functions, or when inference produces an undesirable type).

```typescript
// BAD - unnecessary annotation
function add(a: number, b: number): number {
  return a + b;
}

// GOOD - inferred
function add(a: number, b: number) {
  return a + b;
}
```

## Enums

### No Enums — Use `as const` Objects

Enums are **forbidden**. Use a plain object with `as const` instead. This gives you the same type safety with better tree-shaking, no runtime surprises, and full compatibility with `typeof` and `keyof`.

```typescript
// BAD - enum
enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

// GOOD - as const object
const Status = {
  Active: 'active',
  Inactive: 'inactive',
  Pending: 'pending',
} as const;

type Status = (typeof Status)[keyof typeof Status];
```

## Naming Conventions

### Be Descriptive

Names of variables, functions, classes, and types should clearly convey their purpose. Prefer specificity over brevity — a longer, descriptive name is better than a short, ambiguous one.

```typescript
// BAD - vague
const data = fetchData();
function process(items: Item[]) { ... }
function handleToggle() { ... }
const flag = true;

// GOOD - clear intent
const activeUsers = fetchActiveUsers();
function sortByCreationDate(items: Item[]) { ... }
function onToggle() { ... }
const isMenuOpen = true;
```

### No Prefixes for Interfaces or Types

Do not use `I` or `T` prefixes. Names should be descriptive on their own.

```typescript
// BAD
interface IUser { ... }
type TConfig = { ... };

// GOOD
interface User { ... }
type Config = { ... };
```

## Related Skills

- [Angular Development](../angular-development/SKILL.md) - Angular-specific patterns and component architecture
- [Component Tests](../component-tests/SKILL.md) - Testing patterns
