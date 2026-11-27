---
name: pre-merge-review
description: Review the current branch against origin/main before merge, using this repo's quality bar (CONSTRAINTS.md) and conventions (AGENTS.md). Use when asked to review a branch, a PR or a change before merging.
---

Review the branch as a reviewer who is not its author. Report findings; do not fix them
unless the user asks. The scripts catch the mechanical rules; this review is for what
they cannot judge.

This skill covers only what is specific to this repo. General code quality (design,
readability, change size, test quality) comes from the `code-review-and-quality` skill of
[agent-skills](https://github.com/addyosmani/agent-skills): if it is available, apply it to
the same diff first and merge its findings into the output below. If it is not installed,
say so in the output and continue with this checklist.

## 1. Scope

- `git fetch origin main`, then read `git log --format='%h %s%n%b' origin/main..HEAD` and
  `git diff origin/main...HEAD`.
- Read every changed file in full where the diff alone hides the context.

## 2. Gates

Run `pnpm run check:task` and report its real result. If the diff touches dependencies,
security code or input handling, also run `pnpm run check:full` (needs network). A failing
gate is a blocker. Never suggest weakening a check, a threshold or `CONSTRAINTS.md`.

## 3. Quality bar the gates cannot judge (`CONSTRAINTS.md`)

- **Replaced assertions** (`Assertion:` trailer): the new assertion checks at least as much
  as the one it replaces.
- **Approval trailers** (`Exception:`, `Floor:`, `Ratchet:`, `Assertion:`): each one needs
  an approval from someone other than the author. Flag every trailer for the human
  reviewer. Never treat your own review as that approval.
- **Exceptions**: a new row has a reason, an owner and an Expires date that is not open-ended.
- **Bundle growth**: if the entry bundle grew, the PR states the new measured size.

## 4. Repo conventions (`AGENTS.md`)

- **Feature slices**: new code sits in `src/features/<domain>/` with the expected file
  names, kebab-case, tests colocated.
- **Server data**: only through `@jorgetroya80/donations-api-client` with `client` from
  `src/lib/api.ts`, `throwOnError: true` and `signal`. No `fetch` or `ky` in a feature.
  No hand-written API types.
- **API errors**: reuses `parse-api-field-errors.ts` and `get-problem-message.ts`; no new
  error parsing.
- **i18n**: no string literals in JSX; every new user-visible string is in
  `src/locales/es.json`.
- **UI**: plain HTML + Tailwind; no new wrappers around `@base-ui/react`; base-ui
  components use `render`, not `asChild`; shared pieces in `src/components/` and
  `src/lib/` are reused instead of reimplemented.
- **React Compiler**: no manual `useMemo` or `useCallback`.
- **Browser support**: a feature beyond Baseline Widely available has feature detection
  and a fallback of 20 lines or fewer, with no new dependency or polyfill.
- **Tests**: render with `src/test/test-utils.tsx`, mock with `src/test/msw-handlers.ts`,
  no real network.
- **Dependency CVE fixes**: pinned under `overrides` in `pnpm-workspace.yaml`, never
  forked or vendored.

## 5. Commits and PR

- Conventional Commits with an allowed type, imperative mood, subject of 50 characters or
  fewer that reads as a `CHANGELOG.md` line. Scope is a lowercase area, not a file name.
  No `chore(main):`. A breaking change has `!` and a `BREAKING CHANGE:` footer.
- No `chore(agent): checkpoint` commits left in the branch; they must be squashed or
  reworded before merge.
- PR body has What / Why / Test plan, and the test plan matches what was actually run.

## Output

1. **Verdict**: ready to merge / needs changes / blocked.
2. **Gates**: each command run and its result, and whether `code-review-and-quality` ran.
3. **Findings**, most severe first: blocker, should fix, nit. Each with `file:line`, the
   rule it breaks (cite `CONSTRAINTS.md` or `AGENTS.md`), and the fix.
4. **For the human reviewer**: approval trailers and judgment calls that need a person.

Keep it short. No praise, no restating the diff.
