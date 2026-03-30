---
name: angular-signals
description: Angular signals, computed properties, and effects. Activate when code uses `signal()`, `computed()`, or `effect()` — critical rules to prevent infinite loops and misuse in components or services.
license: MIT
compatibility: Requires Angular 20+
---

# Angular Signals

Critical rules for Angular's reactive primitives. Misuse of effects is the #1 source of bugs.

## Signal Usage

- **`signal()`** for local mutable state
- **`computed()`** for any value derived from other signals — always the first choice for transformations
- **`set()` or `update()`** to modify signal values
- Keep state transformations pure and predictable

## Effects — Critical Rules

**NEVER set a signal inside an effect.** This creates circular dependencies and infinite loops.

```typescript
// FORBIDDEN — infinite loop
effect(() => {
  this.mySignal.set(this.someInput());
});

// CORRECT — use computed
mySignal = computed(() => this.someInput());
```

**Effects are for side effects ONLY:**
- Logging and analytics
- DOM manipulation (rare, escape hatch)
- External event emissions
- **NEVER for state updates** — use `computed()` instead

## When to Use What

| Need | Use |
|:-----|:----|
| Local mutable state | `signal()` |
| Derived/transformed value | `computed()` |
| React to changes with side effects | `effect()` |
| Combine multiple signals | `computed()` |
