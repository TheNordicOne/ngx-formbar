# Claude Instructions

This project follows the [Agent Skills](https://agentskills.io/specification) pattern for modular, reusable coding guidelines.

## Agent Skills

All coding guidelines are defined in the `skills/` directory:

- **[TypeScript](skills/typescript/SKILL.md)** - Code style, type safety, control flow
- **[Angular Development](skills/angular-development/SKILL.md)** - Components, signals, templates, services
- **[Component Tests](skills/component-tests/SKILL.md)** - Test host pattern, Angular Testing Library

## Workflow

- Interview me in detail using the AskUserQuestionTool about literally anything: technical implementations, UI & UX, concerns, tradeoffs, etc. but make sure the questions are not obvious. Look for the best sub agent for the several tasks.
  Be very in-depth and continue interviewing me continually until it's complete, then write to the file.
- **NEVER write out markdown files unless explicitly asked to**
