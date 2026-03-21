---
name: tdd
description: Test-Driven Development workflow — RED/GREEN/REFACTOR cycle with tracer bullets. Activate when asked to implement a feature or fix using TDD, or when writing code that should be test-driven. Enforces vertical slicing over horizontal.
license: MIT
---

# Test-Driven Development

## Philosophy

Tests should read like specifications — each test name describes a capability that exists. "User can checkout with valid cart" tells you exactly what the system does.

The `testing-principles` skill covers what makes a good test (black box, semantic selectors, mocking at boundaries). This skill covers **how to arrive at those tests** through the RED→GREEN→REFACTOR cycle.

See [references/tests.md](references/tests.md) for TDD-specific examples and [references/mocking.md](references/mocking.md) for interface design patterns that support testability.

## Anti-Pattern: Horizontal Slicing

**DO NOT write all tests first, then all implementation.**

This produces bad tests — tests written in bulk test _imagined_ behavior, not _actual_ behavior. You test the shape of things (data structures, signatures) rather than user-facing behavior.

```
WRONG (horizontal):
  RED:   test1, test2, test3, test4, test5
  GREEN: impl1, impl2, impl3, impl4, impl5

RIGHT (vertical):
  RED→GREEN: test1→impl1
  RED→GREEN: test2→impl2
  RED→GREEN: test3→impl3
```

## Workflow

### 1. Planning

Before writing any code:

- Confirm with user what interface changes are needed
- Confirm which behaviors to test (prioritize — you can't test everything)
- Design interfaces for [testability](references/interface-design.md) (accept dependencies, return results, small surface area)
- Identify opportunities for [deep modules](references/deep-modules.md) (small interface, deep implementation)
- List behaviors to test (not implementation steps)
- Get user approval on the plan

### 2. Tracer Bullet

Write ONE test that confirms ONE thing about the system:

```
RED:   Write test for first behavior → test fails
GREEN: Write minimal code to pass → test passes
```

This proves the path works end-to-end.

### 3. Incremental Loop

For each remaining behavior:

```
RED:   Write next test → fails
GREEN: Minimal code to pass → passes
```

Rules:
- One test at a time
- Only enough code to pass the current test
- Don't anticipate future tests
- Keep tests focused on observable behavior

### 4. Refactor

After all tests pass, look for [refactor candidates](references/refactoring.md):

- Extract duplication
- Deepen modules (move complexity behind simple interfaces)
- Apply SOLID principles where natural
- Consider what new code reveals about existing code
- **Run tests after each refactor step**

**Never refactor while RED.** Get to GREEN first.

## Checklist Per Cycle

- Test describes behavior, not implementation
- Test uses public interface only
- Test would survive internal refactor
- Code is minimal for this test
- No speculative features added
