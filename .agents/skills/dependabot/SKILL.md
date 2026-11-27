---
name: dependabot
description: Check open Dependabot security alerts on this repo and open a fix PR for each one that lacks one (optional alert number as argument). Use only when the user explicitly asks to handle Dependabot or security alerts.
---

Check Dependabot **security alerts** on jorgetroya80/donations-frontend
(`repos/jorgetroya80/donations-frontend/dependabot/alerts`) and open a PR
that bumps each vulnerable package to its patched version, when one doesn't
already exist. Never merge — PR only, merge stays manual for the user.

Note: `.github/dependabot.yml` restricts auto-PRs to one package
(`@jorgetroya80/donations-api-client`), so most alerts (transitive deps like
`browserslist`, `undici`, etc.) will NOT get an automatic Dependabot PR —
that's what this skill is for.

## Steps

1. List open alerts:
   `gh api repos/jorgetroya80/donations-frontend/dependabot/alerts --jq '.[] | select(.state=="open") | {number, severity: .security_advisory.severity, package: .dependency.package.name, ecosystem: .dependency.package.ecosystem, manifest: .dependency.manifest_path, vulnerable_range: .security_vulnerability.vulnerable_version_range, patched: .security_vulnerability.first_patched_version.identifier}'`
   If the user gave an alert number, restrict to that one.
   If there are none open, say so and stop.

2. For each open alert, check whether a fix already exists:
   - `gh pr list --state open --search "<package> in:title"` and also check
     for an existing branch like `dependabot/npm_and_yarn/...` or a prior
     `fix-dependabot-alert-<n>` branch. If an open PR already covers this
     package at or above the patched version, skip it (report as
     "already has PR #<n>").

3. If no PR exists yet, fix it:
   - Branch off current `main` (fetch + checkout `-b
     fix/dependabot-alert-<n>-<package>` from `origin/main`).
   - Bump the package: `pnpm update <package>@<patched-version>` (add
     `--recursive` if it's transitive). If the lockfile still shows the old
     version afterward (common for deep transitive deps), pin the patched
     version under `overrides` in `pnpm-workspace.yaml` (see `AGENTS.md`;
     never fork or vendor), then `pnpm install` again to regenerate the lockfile.
   - Verify: `pnpm run check:task`. If it fails, stop and report — do not
     open a PR for a bump that breaks the build.
   - Commit (`fix(deps): bump <package> to <patched-version>` — Conventional
     Commits, matches `validate-title` CI check) and push the branch.
   - Open the PR: `gh pr create --title "fix(deps): bump <package> to
     <patched-version>" --body "<link the alert, state the severity and
     vulnerable range>"`.

4. Never run `gh pr merge`. Never open a PR when local verification failed.

## Output

One short line per alert: number, package, severity, verdict (PR opened
with URL / already covered by PR #<n> / verification failed + why).
