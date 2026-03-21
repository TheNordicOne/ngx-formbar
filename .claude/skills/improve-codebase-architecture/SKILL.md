---
name: improve-codebase-architecture
description: Analyze codebase for shallow modules and architectural friction, then propose deepening candidates. Activate when asked to review architecture, find coupling issues, reduce module boundaries, or improve codebase structure.
license: MIT
---

# Improve Codebase Architecture

Identify shallow, tightly-coupled modules and propose how to deepen them — merging unnecessary boundaries, simplifying interfaces, and reducing integration risk.

## Process

1. **Scan** — explore the codebase for module boundaries, looking for shallow modules that delegate without adding value
2. **Identify candidates** — find clusters of tightly-coupled shallow modules that could be merged into a single deep module with a clean interface
3. **Classify dependencies** — for each candidate, classify its dependencies using the categories in [REFERENCE.md](REFERENCE.md) (in-process, local-substitutable, ports & adapters, mock)
4. **Design the interface** — propose what the deepened module should expose, hide, and own
5. **Plan testing** — identify boundary tests to write and shallow tests to delete
6. **Write findings** — output all findings to a markdown file using the template below

## Output

Write findings to a markdown file (e.g., `architecture-improvements.md`) in the project root. Use one section per candidate, following this structure:

```markdown
# Architecture Improvement Proposals

> Generated on YYYY-MM-DD

## Candidate: [Name]

### Problem

- Which modules are shallow and tightly coupled
- What integration risk exists in the seams between them
- Why this makes the codebase harder to navigate and maintain

### Proposed Interface

- Interface signature (types, methods, params)
- Usage example showing how callers use it
- What complexity it hides internally

### Dependency Strategy

Which category applies and how dependencies are handled:

- **In-process**: merged directly
- **Local-substitutable**: tested with [specific stand-in]
- **Ports & adapters**: port definition, production adapter, test adapter
- **Mock**: mock boundary for external services

### Testing Strategy

- **New boundary tests to write**: behaviors to verify at the interface
- **Old tests to delete**: shallow module tests that become redundant
- **Test environment needs**: any local stand-ins or adapters required

### Implementation Recommendations

Durable guidance NOT coupled to current file paths:

- What the module should own (responsibilities)
- What it should hide (implementation details)
- What it should expose (the interface contract)
- How callers should migrate to the new interface
```

## Rules

- Recommendations must be **durable** — describe responsibilities and interfaces, not file paths that will change
- Focus on **observable friction** — don't propose changes for theoretical purity
- Each candidate must have a clear **before/after** in terms of interface complexity
- Refer to [REFERENCE.md](REFERENCE.md) for dependency classification details and testing philosophy
