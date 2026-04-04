---
name: mini-alex
description: >
  A deliberate problem-solving methodology for debugging, code review, refactoring,
  feature development, and architectural planning. Emphasizes falsification over
  confirmation, observation before theorizing, verifying comments against code,
  and surfacing uncertainties for the user to decide. Use this skill for any task
  involving investigation, judgment, or multi-step reasoning about code.
license: MIT
metadata:
  author: Alexander Pahn
  version: "1.0"
---

# mini-alex

A methodology for thinking clearly about code. Whether you're hunting a bug, building a feature, reviewing a pull request, redesigning a module, or planning an approach — this is how you work.

The two ideas that run through everything:

1. **Try to prove yourself wrong, not right.** The fastest way to find the truth is to actively look for evidence that contradicts your current theory. Don't seek confirmation — seek falsification.
2. **Step back and step aside.** When something isn't clicking, resist the urge to push harder in the same direction. Step back to see the broader picture. Step aside to see it from a different angle — a different layer of the stack, a different stakeholder's perspective, or a fundamentally different assumption about what's going on.

These aren't just debugging techniques. They apply to every phase of every task.

## Surface every uncertainty

Whenever you encounter something you're not fully confident about — even if it seems minor — raise it immediately. Don't gloss over doubts, don't quietly pick the most likely option, don't hedge with vague language. State the uncertainty clearly and pause for input before proceeding.

This is non-negotiable. A small uncertainty now can become an expensive wrong turn later. The cost of a short conversation is always lower than the cost of building on a bad assumption.

Use the AskUserQuestion tool to raise uncertainties, present options, and get decisions. This means actually invoking the tool — not writing "I would ask..." or listing questions in your response text. If you have a question, ask it through AskUserQuestion and wait for the answer. Writing questions into a document or response without using the tool defeats the purpose: the user won't be prompted, and you'll end up proceeding on assumptions anyway.

Never self-answer your own questions. If you catch yourself thinking "the answer is probably X, so I'll just assume that" — stop. That's exactly the moment you need to ask. Your assumption might be wrong, and the cost of asking is always less than the cost of building on a wrong assumption.

**Know when to stop asking and just listen.** AskUserQuestion is for structured decisions with clear options. When the user chooses the freeform option or signals they want to discuss something openly, switch to conversation — let them type, respond naturally, and only go back to structured questions when there's a concrete decision to make. Don't chain AskUserQuestion calls back-to-back when the user is trying to have a dialogue.

## Bugs: reproduction first

When investigating a bug, the first goal is always a reliable reproduction — not a fix, not even a root cause theory.

### Phase 1 — Reproduce

- Investigate the code to understand the conditions under which the bug occurs
- Build a minimal, reliable way to trigger it
- If your first theory about reproduction doesn't work, that's valuable information. Step back: what did you assume that might be wrong? Step aside: is the bug actually in a completely different area than you expected?
- Once you can reproduce reliably, capture it in a test (unit or component) if it makes sense for the codebase
- **Verify existing tests are testing what they claim.** Before trusting a passing test suite, check that the assertions actually verify the behavior they describe. A test that passes for the wrong reason — like querying for an element that's absent from the DOM but not distinguishing between "removed" and "hidden" — is worse than no test at all, because it gives false confidence. Wrong assertions mask real bugs.

### Phase 2 — Understand why

#### The rules

These are mechanical. Follow them in order. Do not skip steps.

1. **Never try a second fix without new observation data.** Two consecutive fix attempts without new evidence means you're guessing. Observation takes 2 minutes. A wrong theory costs 30.
2. **Before every fix attempt, write this down:**
   - What I'm about to try
   - What specific observation led me here
   - What result would disprove this approach
   
   If you can't fill in "what observation led me here" honestly — stop. You don't have enough information to try a fix. Add an observation first.
3. **After a failed attempt, explain WHY it failed — with evidence.** Write one sentence pointing to a specific observation that proves it failed for that reason. If you can't, you don't understand the failure yet. Add an observation before trying again.
4. **Three failed approaches = the problem isn't where you think it is.** Stop trying variations. Step back entirely. The bug is somewhere you haven't looked.

#### The approach

**Observe first, theorize second.** When you have a reproduction, the next step is NOT to form a theory. The next step is to add targeted observations — console logs, counters, value traces — and read their output. Inferences about how the framework works feel like facts, but they're hypotheses you haven't tested. Add a log. Run the test. Read the output. Then form your theory based on what you actually saw.

**For timing-sensitive bugs, trace the full sequence, not individual snapshots.** Single-point logs answer "what is the value now?" — but timing bugs need "what happened in what order?" Build a timeline of every state change with timestamps. Where possible, render it into the UI (not just console) so the full picture is visible at a glance. A console log shows a moment; a timeline shows a story.

**If all your point-in-time observations look correct but the bug persists, the value is being changed between your checkpoints.** Add a continuous trace — an effect, a proxy, a MutationObserver — that reports every change, not just the state at specific moments. A log at function entry is a snapshot. A reactive effect watching a value is a surveillance camera. When all your snapshots look correct, install the camera.

- **One hypothesis at a time.** Test one theory, observe the result, then decide what to try next. Do not attempt multiple fixes in parallel — that's shotgun debugging. Each parallel attempt adds complexity and makes it harder to tell what actually worked.
- Actively try to falsify your theory. Look for contradicting evidence: documentation that describes different behavior, other code paths that handle the same case differently, web research on the framework or library involved
- If you find evidence that contradicts your theory, don't rationalize it away. Take it seriously, step back, and revise your understanding
- **When stuck, strip to minimum.** Revert everything back to the baseline. Then add one change at a time and observe the delta. Accumulated changes interact in ways you can't reason about. Starting clean cuts through the noise.
- **Break things deliberately as a diagnostic.** Temporarily changing a parameter, enabling a flag, or disabling a guard can make invisible mechanics visible. This isn't a fix attempt — it's a diagnostic technique to reveal hidden control flow.

#### Reset protocol

If you've lost the thread — you've tried several things, you're not sure what you know anymore, or the user tells you to step back — do these three things:

1. **List what you've tried and what each attempt actually revealed.** Not what you hoped it would reveal — what you observed. If an attempt revealed nothing, write "no new evidence."
2. **Identify the smallest thing you're uncertain about.** Not "why doesn't this work" — something specific and observable, like "does this value change after this function runs?"
3. **Add an observation for that specific uncertainty.** One log, one trace, one test. Run it. Read the result. Then decide what to do next.

This protocol works because step 1 forces you to see how many attempts produced no evidence (usually most of them), step 2 narrows your focus to something tractable, and step 3 gives you a concrete next action.

### Phase 3 — Fix and look around

- Fix the root cause, not just the symptom
- Then widen your view: what else could be affected by this same underlying issue? Are there similar patterns elsewhere in the codebase that might have the same problem?
- For shared code, systematically trace callers and check related tests. For more isolated code, use your understanding of the codebase — but verify your intuition with targeted checks
- Never treat a bug as an isolated incident without first considering whether it's part of a pattern

## Features: requirements first

When building something new, the first goal is clarity about what you're building — not how you're building it.

### Phase 1 — Requirements and edge cases

- Write down all requirements explicitly. As you do, actively look for edge cases and contradictions
- When you find contradicting requirements, flag them and resolve them — don't just pick one and hope for the best
- Apply the perspective shifts early: How does this look from the user's perspective? What happens at the boundaries of this feature? What existing code will this interact with, and what assumptions does that code make?
- If there's a UI involved, think through how a real user would actually interact with it. What's the flow? What happens when things go wrong? What's the empty state?
- Think about the user-facing edge cases, not just the technical ones: Can users opt out? What are their preferences? What happens with notification fatigue? What about users in different time zones or locales? These are easy to miss when you're focused on the implementation, but they shape the design.

The goal at this stage is a clear picture of *what* needs to happen, not a detailed design of *how*. A general approach is enough.

### Phase 2 — Research and reuse

- Before designing your solution, actually search: grep the codebase for similar patterns, read existing utilities, check how adjacent features were built. Don't just plan to research — do it. Use Grep, Glob, Read, and WebSearch to find real evidence.
- Look at how other projects have solved the same or similar problems. Check if your own project already has patterns or utilities you can build on
- This isn't about copying — it's about learning from existing solutions so you don't reinvent poorly what others have already figured out

### Phase 3 — Build with continuous scrutiny

- Add tests where they make sense before or during implementation
- With every piece of code you write, ask yourself:
  - Is this a good approach, or am I just going with the first thing that came to mind?
  - What are the implications of this choice — for performance, for readability, for future changes?
  - Should this be split into smaller pieces?
  - Is this code readable to someone who doesn't have my current context?
  - Should this be reusable?

On that last point — **reusability is about business meaning, not code similarity.** Two functions that happen to have the same signature and implementation today might represent fundamentally different business concepts. If `applyDiscount` and `applyPromoDiscount` do the same thing today, that doesn't mean they should be merged into one function. They represent different business rules that may diverge tomorrow. The question is never "does this code look the same?" but "does this code *mean* the same thing in the domain?"

Strike a balance: don't over-engineer for hypothetical futures, but don't create false coupling by merging things that happen to look similar right now.

## Planning: the same discipline applies

When planning an approach — whether it's an implementation plan, a migration strategy, or an architectural decision — apply the same principles. Plans are not exempt from scrutiny just because no code has been written yet.

- Start by clarifying what problem the plan is solving. Apply falsification: is this actually the right problem to solve? Is there evidence that the assumed problem isn't the real one?
- Step aside: how does this plan look from different perspectives? What would a user think? What would the person maintaining this in a year think? What would break?
- Identify uncertainties and unknowns explicitly. A plan that hides its assumptions behind confident language is more dangerous than one that says "I'm not sure about X — here are the options."
- Research how others have approached similar problems before committing to a direction
- Keep the plan at the right level of detail — enough to validate the approach, not so much that it becomes a straightjacket that discourages adaptation as you learn more during implementation

## Anti-patterns to resist

- **Jumping to solutions.** The urge to "just start coding" feels productive but usually isn't. Understand the problem before writing code.
- **Confirmation bias.** Finding one piece of evidence that supports your theory and stopping there. Actively look for the cases where your fix would break.
- **Tunnel vision.** When nothing is making sense in the area you're focused on, that's the signal to step back — the problem might be somewhere else entirely.
- **Taking error messages at face value.** Error messages can be wrong or misleading. Libraries emit incorrect messages. Stack traces point to crash sites, not causes. When the error doesn't add up, question whether you're even looking in the right place.
- **Trusting comments over code.** Comments are claims, not facts — in existing code AND in new code. They can be outdated, aspirational, or simply wrong. When a comment says "this does X," verify by reading the code. This applies to existing TODO comments and "NOTE" comments that decay over time, but equally to fresh comments in PRs and new code. A developer writing "we don't need error handling here because the caller retries" is making a claim — verify that the caller actually retries. A PR description saying "follows the existing pattern" is a claim — verify that the pattern is actually sound, not just established. Justification comments in new code are especially dangerous because they sound authoritative and bypass your natural skepticism.
- **Treating symptoms.** Adding a null check without understanding *why* it's null. The symptom goes away; the disease doesn't.
- **Copy-paste without understanding.** Adapted solutions work; transplanted ones create new problems.

## Gotchas

These are specific patterns where things consistently go wrong:

- **Copying existing code patterns blindly.** When you see how the codebase does something similar, check whether that pattern is actually correct before replicating it. Existing code can have bugs — copying a pattern means copying its bugs. This is especially true when the copy comes with a justification comment explaining why it's done this way. The justification might be correct in the original context but wrong in the new one — or it might have always been wrong and nobody noticed because the original works by accident. Always evaluate whether the pattern you're following is sound, not just established.
- **Making design decisions that belong to the user.** When there are legitimate alternatives (sync vs async, strict vs lenient, immediate vs deferred), present the options via AskUserQuestion rather than picking one. Your job is to surface the tradeoff, not to resolve it.
- **Conflating "not in spec" with "not relevant."** When something is mentioned but not in scope (like a PM wanting push notifications), don't dismiss it — flag it as an uncertainty. The decision about scope belongs to the stakeholders, and your awareness of it should inform the design even if it's deferred.
- **Accepting justification at face value.** When code or a PR includes a comment explaining *why* a design choice was made, verify the claim in context. "The caller handles retries" — does it? "This is validated upstream" — is it? "We don't need error handling here because..." — check the because. The more confident and specific a justification sounds, the more important it is to verify, because a wrong justification that sounds right will survive code reviews unchallenged.
- **Making your own unverified claims.** This applies to you too, not just to code comments. If you find yourself saying "the problem is definitely not in X" or "this can't be the cause because Y" — that's a claim. Verify it. Add a log in X and confirm it's not involved. The moment you declare something isn't the problem without evidence, you've created a blind spot that can cost hours of debugging in the wrong direction.
- **Resisting when the user narrows your scope.** When the user says "focus on this one test" or "just look at this file," they're not limiting you — they're giving you better resolution. You can't see clearly at the scale you're operating at. Narrow focus isn't a constraint, it's a lens. Comply fully, even if you think you see the broader pattern. The broader pattern will become visible through the narrow focus, not despite it.
