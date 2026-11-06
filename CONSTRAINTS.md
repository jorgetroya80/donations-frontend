# Constraints

Last reviewed: 2026-11-06 by @jorgetroya80

## Floor (always enforced)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `// oxlint-disable`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`, `TODO`
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- This file does not get weakened to make a change pass

## Enforced with numbers

| Dimension        | Rule                                                                                       | Why                                                                 | Checked by                                                                           | Runs at    |
| ---------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| Types            | Zero type errors                                                                           | Build and CI gate                                                   | `pnpm run typecheck`                                                                 | check:fast |
| Lint             | Zero errors from `.oxlintrc.json`                                                          | CI gate                                                             | `pnpm exec oxlint src/`                                                              | check:fast |
| Secrets          | No secrets in source                                                                       | Leaked key ends up in history                                       | `gitleaks detect --redact --no-banner --source .`                                    | check:fast |
| Accessibility    | Zero critical or serious axe violations on every form page: login, password change, create and edit (contrast excluded, needs a browser) | Missing labels and broken ARIA hit keyboard and screen-reader users | `pnpm run test`, `src/test/a11y.test.tsx`                                            | check:task |
| Coverage         | Changed lines ≥ 80% covered                                                                | Forces a test for new code, leaves room for config lines            | `node scripts/changed-line-coverage.mjs --min 80`                                    | check:task |
| Floor            | No move that lowers the bar                                                                | Cheapest road to green                                              | `node scripts/floor-guard.mjs`                                                       | check:task |
| Project coverage | Project line coverage ≥ 84.2%                                                              | Ratchet: 84.77% measured, 0.5% tolerance                            | `pnpm run test:coverage` (`coverage.thresholds` in `vitest.config.ts`)               | check:task |
| Entry bundle     | Gzip of `index-*.js` ≤ 46,816 B                                                            | Ratchet: 46,583 B measured, +0.5% tolerance                         | `node scripts/bundle-budget.mjs` (after `pnpm run build`)                            | check:task |
| Security: code   | No Semgrep findings (`p/default`, `p/owasp-top-ten`)                                       | Input handling and XSS paths                                        | `semgrep scan --config p/default --config p/owasp-top-ten --error --metrics=off src` | check:full |
| Security: deps   | Nothing at high or above                                                                   | Below high is mostly noise                                          | `osv-scanner scan source -r .`                                                       | check:full |

Every row names the command that produces the verdict.

## Tools

Install the binaries once. Checked versions are the ones the rules were measured with.

| Tool | Version | Install | Needed by | Notes |
| --- | --- | --- | --- | --- |
| gitleaks | 8.30.1 | `brew install gitleaks` | `check:fast` | Always run with `--redact`. Never print a matched secret. |
| semgrep | 1.183.0 | `brew install semgrep` | `check:full` | Pulls rules from the registry, so needs network. Use `--metrics=off`. |
| osv-scanner | 2.7.0 | `brew install osv-scanner` | `check:full` | Reads the advisory database online. |
| Node, pnpm | per `.nvmrc`, `packageManager` | per README | all | `pnpm install` needs `NODE_AUTH_TOKEN` (GitHub Packages). See AGENTS.md. |

Missing binary: `check:fast` fails with `command not found`. Install it, then rerun. Do not skip the check.

CI (`.github/workflows/ci.yml`) does not run these scripts yet. It runs oxlint, typecheck, tests, coverage and build. The floor guard, changed-line coverage, bundle budget, gitleaks, Semgrep and osv-scanner run only locally until CI wires them in.

## Measured (gated above, values kept as record)

| Metric                            | Today    | Direction     | Measured by                                                 |
| --------------------------------- | -------- | ------------- | ----------------------------------------------------------- |
| Project line coverage             | 84.77%   | must not fall | `pnpm run test:coverage`                                    |
| Entry bundle, gzip (`index-*.js`) | 46,519 B | must not grow | `pnpm run build && gzip -c dist/assets/index-*.js \| wc -c` |

Owner for every enforced row: @jorgetroya80. Review by 2027-02-03.

Ratchets: the gate allows a 0.5% drop from the measured value, then fails. Raise the number when the measured value rises. Do not lower it to pass a change.

## Deferred

- **Color contrast and full-page a11y:** needs a browser run (Playwright + axe against `pnpm preview`, port 4173). Not gated yet. Owner: @jorgetroya80. Revisit by 2027-02-03.

## Exceptions

An exception lets one rule break in one path, for a stated time. Use it only when the fix is real but not yet possible.

To add a row:

1. Pick the next ID: `W<n>` for a warning, `E<n>` for an error-level rule.
2. Owner: a GitHub login who will fix it. Expiry: 90 days from today by default, `YYYY-MM-DD`.
3. Add the row, then commit with the trailer `Exception: <ID>`. The floor guard rejects any row without a matching trailer.
4. Review: the PR reviewer is not the author. The reviewer confirms the reason and the expiry.

The guard (`check:task`) fails when a row's Expires date has passed. Fix the code, or renew with a new row, new ID, and new trailer.

| ID  | Rule | Path | Reason | Owner | Expires |
| --- | ---- | ---- | ------ | ----- | ------- |
