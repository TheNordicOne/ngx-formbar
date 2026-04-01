# Contributing to ngx-formbar

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## Prerequisites

- **Node.js** >= 22
- **pnpm** is managed via [corepack](https://nodejs.org/api/corepack.html) (the version is pinned in `package.json` under `packageManager`)

Enable corepack if you haven't already:

```sh
corepack enable
```

## Getting Started

1. Fork the repository and clone your fork
2. Install dependencies:

```sh
pnpm install
```

3. Verify everything works:

```sh
npx nx run-many -t lint test build
```

## Branching Strategy

This project uses **trunk-based development**:

- `main` is the single source of truth
- All pull requests target `main`
- Short-lived feature branches are used for development
- There is no `develop` branch

### Maintenance Branches

When a stable release is published, the **Release Packages** workflow automatically creates a maintenance branch (e.g. `2.0.x`). This branch receives critical patches only. Fixes are committed to `main` first, then cherry-picked to the maintenance branch. Pushing to a maintenance branch triggers the **Hotfix Release** workflow, which publishes a stable patch release directly.

## Pull Requests

### One PR = One Logical Change

Each PR should contain a single type of change. If you're working on a feature and notice something unrelated that needs fixing (a refactor, a config improvement, a lint rule change), split it into a separate PR.

**Example:** You're adding a new composable and notice a refactor opportunity in an existing one.

1. Stash or pause your feature work
2. Create a branch from `main` for the refactor
3. Open a PR, get it merged
4. Rebase your feature branch on the updated `main`
5. Continue with the feature PR

This keeps each squash-merged commit on `main` focused and makes the changelog accurate.

If a change only makes sense in the context of the feature (e.g. an internal API change required by the feature), it belongs in the feature PR.

### Merge Strategy

PRs are **squash-merged**. The PR title becomes the commit message on `main`, so it must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>
```

Common types:

| Type       | Purpose                                    | Triggers version bump? |
|------------|--------------------------------------------|------------------------|
| `feat`     | New functionality                          | Yes (minor)            |
| `fix`      | Bug fix                                    | Yes (patch)            |
| `refactor` | Code restructuring without behavior change | No                     |
| `chore`    | Tooling, CI, dependencies                  | No                     |
| `docs`     | Documentation only                         | No                     |

Use the type that describes the **most significant change** in the PR. If a PR adds a feature but also includes some refactoring to support it, the type is `feat`.

For breaking changes, add `!` after the type:

```
feat!: redesign configuration API
```

### PR Checklist

Before opening a PR, run the full validation suite:

```sh
npx nx run-many -t lint test build
```

## Testing

- **Library unit tests:** `npx nx run-many -t test`
- **Storybook tests:** `npx nx run storybook:test-storybook` (requires Storybook to be running on port 4400)

## Release Process

Releases are fully automated via GitHub Actions.

### Standard Releases

1. Commits land on `main` via squash-merged PRs
2. When ready to release, manually trigger the **Version PR** workflow (Actions > Version PR > Run workflow):
   - Calculates version bumps from conventional commit messages
   - Generates changelogs
   - Creates or updates a PR titled `chore: version packages`
3. When the version PR is merged, the **Release Packages** workflow runs:
   - Builds all packages
   - Creates git tags and GitHub releases
   - Publishes to npm
   - Creates a maintenance branch (e.g. `2.0.x`) for future hotfixes
   - Deploys documentation to production

### Pre-releases

Pre-releases are published from `main` via manual trigger:

1. Commits land on `main` via squash-merged PRs
2. When ready to publish a pre-release, manually trigger the **Pre-release Packages** workflow (Actions > Pre-release Packages > Run workflow):
   - Queries npm for the latest `next` version and auto-increments the `-next.X` suffix
   - For the first pre-release, conventional commits determine the base version (e.g. breaking change from `1.0.0` produces `2.0.0-next.0`)
   - Creates git tags and GitHub pre-releases
   - Publishes to npm under the `next` dist-tag
   - Deploys documentation to the preview environment
3. Repeat step 2 after more changes land on `main` to publish the next pre-release

Consumers can install pre-releases with:

```sh
npm install @ngx-formbar/core@next
```

### Hotfix Releases

Critical fixes for released versions use maintenance branches:

1. Cherry-pick the fix from `main` to the maintenance branch (e.g. `2.0.x`)
2. Push to the maintenance branch
3. The **Hotfix Release** workflow runs automatically:
   - Determines the patch version from conventional commits
   - Publishes directly to npm as a stable release
   - Creates git tags and GitHub releases

## Project Structure

This is an [Nx](https://nx.dev) monorepo. Published packages live under `libs/`, applications under `apps/`:

| Package                       | Path                  | Description                                   |
|-------------------------------|-----------------------|-----------------------------------------------|
| `@ngx-formbar/core`           | `libs/core`           | Core library (no `@angular/forms` dependency) |
| `@ngx-formbar/reactive-forms` | `libs/reactive-forms` | Reactive forms integration (depends on core)  |
| `@ngx-formbar/schematics`     | `libs/schematics`     | Code generation schematics                    |
| `@ngx-formbar/setup`          | `libs/setup`          | Setup utilities                               |
