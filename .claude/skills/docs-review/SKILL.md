---
name: docs-review
description: Manual, multi-phase review-and-fix pass over the ngx-formbar documentation. Runs seven gated phases (correctness, consistency, wording, simplification, reusability, framework improvements, final review), each landing in its own commit. This skill is USER-INVOKED ONLY via /docs-review. Never activate it automatically, never infer it from a request to edit or fix docs, and never start it as a side effect of another task. Only run it when the user explicitly invokes it.
---

# Documentation Review

A disciplined, multi-phase sweep over the documentation. Each phase checks one concern, fixes what it finds, gets reviewed, and lands in a single commit before the next phase begins. The phases are ordered on purpose: correctness before consistency, consistency before wording, and so on. A later phase may rely on an earlier one already being clean, so they never overlap or run out of order.

## Activation

This skill is manual only. Run it solely when the user invokes `/docs-review`. If the user merely asks to edit, fix, or improve docs without invoking the skill, do that work directly. Do not propose or auto-start this workflow.

## Scope

"The documentation" means:

- `apps/docs/src/docs/**` — all ng-doc guide pages (`index.md`), category/page metadata, changelog pages, and shared includes
- `apps/docs/src/docs/shared/**` — reusable includes (`*.md`) and `scaffolds.njk`
- `README.md` (root)
- `libs/*/README.md` — per-library READMEs (`core`, `reactive-forms`, `schematics`, `setup`)

Out of scope: generated output under `ng-doc/`, source code (touch source only when a doc documents behavior that the code contradicts and the user confirms the doc is right — see Phase 1), and anything outside the paths above.

Useful framework facts (verify before relying on them, they can drift):
- Framework is **ng-doc 21**, config at `ng-doc.config.ts`, docs root `apps/docs/src/docs`.
- Includes use Liquid `{% include "path" %}`; code scaffolds use Nunjucks macros imported from `shared/scaffolds.njk`.
- Code groups use `group="..."`, external file embeds use `file="..."`, demos use `{{ NgDocActions.demo("Name") }}`.
- API reference is auto-generated from `libs/*/src/index.ts`; do not hand-write API docs that ng-doc generates.
- The example domain is **asset/maintenance forms** (maintenance-form, complex-maintenance-form, etc.). Consistency work should keep that domain coherent, not invent new ones.

## Operating rules (apply to every phase)

**Sequential and gated.** Run phases 1 through 7 in order. A phase starts only after the previous one is committed (or explicitly recorded as a clean pass). Never parallelize across phases.

**One commit per phase.** Each phase that changes anything ends in exactly one commit. If a phase finds nothing to change, skip the commit and record it as a clean pass in the running summary — do not create empty commits.

**Commit messages.** One short conventional-commit subject line, no body unless genuinely important. The message must describe the concrete change, not the process: it must never contain the word "Phase" or a phase number. The type prefix tracks what actually changed, not the phase — use `fix:` when the commit touches source, `refactor:` for a structural rename or move, `docs:` for doc-only edits. The per-phase examples below mirror the real commits already in this repo's history; match that level of specificity rather than copying them verbatim.

**Uncertainties.** When something looks wrong or ambiguous, first verify it is a genuine uncertainty — read the relevant source, the other docs, the git history. Most apparent uncertainties resolve themselves on inspection. If after verifying it is still genuinely uncertain and it blocks a correct fix, pause and ask the user with the question tool, then continue. Do not guess on a verified uncertainty, and do not flag things you could have resolved yourself.

**Per-phase execution.** For each phase:
1. Spawn a fresh check subagent scoped to that phase's concern and the doc scope above. It reports findings only; it does not commit.
2. Apply the fixes (yourself, or via a fix subagent for a wide mechanical sweep). Resolve uncertainties per the rule above as they arise.
3. Gate: spawn an **independent review subagent** that reads the phase diff and judges it against this phase's goal — did it fix the real issues, introduce regressions, or overreach? Address whatever it surfaces.
4. Commit.
5. Append a one-line entry to the running summary (what changed, or "clean pass").

**Writing constraints** (these reflect standing project preferences):
- No em-dashes. Use short, direct sentences instead.
- State facts; do not hand-hold or add "convenience"/"not runtime-checked" style caveats. Treat readers as competent.
- Changelog entries are one-line announcements that something is new or changed. No symbol lists, sub-bullets, or how-it-works explanations — that is the guide's job. Link to the guide instead of re-explaining.
- Keep commit subjects short.

**Don't run the dev server.** The only build you run is the one-time ng-doc build in Phase 7 as a validation step. Do not start the docs dev server, and do not rebuild repeatedly between edits.

## The phases

### Phase 1 — Correctness
The docs must describe what the library actually does. Where a page is stale, correct it against the source. Check directive/input/output names, default values, behavior of `hideStrategy`/`valueStrategy`/disabled/readonly handling, code examples that no longer compile or match the API, and changelog claims against actual released behavior.

When a doc and the code disagree, the doc is usually the thing to fix. But if the doc describes the intended contract and the code contradicts it, that is a genuine uncertainty: verify, then ask the user which is right before changing either. Source edits happen only here and only with confirmation.

Commit example (use `fix:` when source is touched): `fix: align docs with actual behavior and fix related source bugs`

### Phase 2 — Consistency
Make wording, naming, examples, and page layout consistent — but only within like cases. Same kind of page should follow the same structure; the same concept should use the same term and the same example domain. Consistency does **not** mean forcing one pattern onto everything. A control guide and a changelog page legitimately differ. The goal is that pages doing the same job look and read the same way, and that the asset/maintenance example domain stays coherent across guides.

Commit example (`refactor:` when it is a rename/convention change): `refactor: standardize NgxFb symbol casing and unify doc conventions`

### Phase 3 — Wording
Docs state facts, not marketing. Remove promotional language ("powerful", "seamless", "effortless", "blazing"). The clear exception is pages whose purpose is persuasion or positioning (for example "Why ngx-formbar", the about/features pages) — there, value framing is appropriate and should stay. Everywhere else, prefer plain statements of what something does.

Commit example: `docs: replace promotional wording with factual statements`

### Phase 4 — Simplification
Cut filler. Remove bloated sentences, redundant preambles, and over-explanation, while keeping the meaning. For changelogs specifically, this is aggressive: a changelog highlights the interesting change in a line and links to the actual documentation rather than re-explaining it. Prefer a link over kept prose. Check whether the version/link can be derived dynamically (ng-doc routing, the injected version define) instead of hardcoded.

Commit example: `docs: trim bloat and condense the changelogs`

### Phase 5 — Reusability
Content that repeats and is not expected to diverge should become a shared include (`apps/docs/src/docs/shared/`), following the existing `{% include %}` and `scaffolds.njk` patterns. De-duplicate where it genuinely helps. Bias toward leaving things alone: when in doubt, do not deduplicate. Over-aggressive extraction that couples unrelated pages is worse than a little repetition.

Commit example: `docs: extract repeated guide notes into shared includes`

### Phase 6 — Improvements
Look at what ng-doc provides and use it to cut maintenance, links especially (cross-page link helpers, keyword references, API auto-references, file embeds instead of pasted code). Apply low-risk mechanical migrations directly — for example swapping a hardcoded path link for a framework reference. For anything broad or behavior-affecting, write up a short proposal and ask the user before applying. Verify a feature exists and works in this ng-doc version before relying on it.

Commit example: `docs: use ng-doc features to reduce link maintenance`

### Phase 7 — Final review
This validates the final result after all prior changes have landed. Spawn a **separate fresh subagent for each prior phase's concern** (correctness, consistency, wording, simplification, reusability, improvements), each re-checking the whole documentation in its final state — not just that phase's diff. Collect their findings.

Then run the lint/validation check using existing tooling only (do not introduce new linters):
- Prettier check on the docs
- ESLint
- the ng-doc build, which validates link references and TypeScript code blocks

Fix anything the review subagents or the checks surface. If that produces changes, land them in this phase's single commit. If the final review is clean, record a clean pass.

Commit example: `docs: resolve final review findings`

## Wrap-up

After Phase 7, report a concise summary: each phase's outcome (committed with a one-line description, or clean pass), any uncertainties that were raised and how they resolved, any proposals deferred to the user from Phase 6, and the result of the final lint/build check.
