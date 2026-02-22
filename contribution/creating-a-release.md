# Creating a Release

## Overview

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and release management. The pipeline supports three publishable packages (`@ngx-formbar/core`, `@ngx-formbar/reactive-forms`, `@ngx-formbar/schematics`) with independent versioning.

**Key concepts:**

- **Changesets** are small files that describe what changed and what kind of version bump is needed (patch, minor, major).
- **Linked packages**: `core` and `reactive-forms` are linked — a version bump to one bumps both to the same version.
- **Schematics** is versioned independently.
- Peer dependency updates (`reactive-forms` → `core`) only happen when the new version is out of the current range.

## Workflow

```
Feature PR with changeset
  → merge to main
    → "Changesets Version PR" workflow creates/updates a "Version Packages" PR
      → merge that PR
        → "Release Packages" workflow builds + creates GitHub releases + deploys docs
          → manually trigger "Publish to npm" per package
```

## When to Add a Changeset

A changeset is needed once per PR — not per commit. Add one when your PR contains changes that users of the published packages would care about:

- **Yes**: Bug fixes, new features, breaking changes, dependency updates
- **No**: CI changes, docs-only changes, refactors with no public API impact, test-only changes

If you forget, nothing breaks — the changes just won't be included in the next release version bump. You can always add a changeset in a follow-up PR.

To add one:

```bash
npx changeset add
```

This prompts you to select affected packages, choose the bump type (patch / minor / major), and write a summary. A markdown file is created in `.changeset/` — commit it with your PR.

## Releasing

Once PRs with changesets are merged to `main`, the release process is fully automated:

1. **Automatic**: The **Changesets Version PR** workflow creates (or updates) a "Version Packages" PR containing bumped versions, generated changelogs, and consumed changeset files. Multiple changesets accumulate into a single PR.
2. **Merge the "Version Packages" PR** when you're ready to release.
3. **Automatic**: The **Release Packages** workflow builds all packages, creates a GitHub release per changed package (with `.tgz` attached), and deploys docs to `docs.ngx-formbar.net`.
4. **Trigger "Publish to npm"** in the Actions tab for each created GitHub release:
   - **release_tag**: the GitHub release tag (e.g. `@ngx-formbar/core@1.1.0`)
   - **dist_tag**: `latest`

## Pre-releases (Next)

1. Create a `release/<name>` branch from `main` and push changesets to it.
2. **Automatic**: The **Release Branch Prerelease** workflow enters pre-release mode, versions packages as `X.Y.Z-next.N`, creates pre-release GitHub releases, and deploys docs to `next.docs.ngx-formbar.net`.
3. **Trigger "Publish to npm"** per package with `dist_tag: next`.

## Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | npm publish token |
| `DOCS_FTP_SERVER` | FTP server for docs deployment |
| `DOCS_FTP_USERNAME` | FTP credentials for production docs |
| `DOCS_FTP_PASSWORD` | FTP credentials for production docs |
| `DOCS_FTP_NEXT_USERNAME` | FTP credentials for preview docs |
| `DOCS_FTP_NEXT_PASSWORD` | FTP credentials for preview docs |
