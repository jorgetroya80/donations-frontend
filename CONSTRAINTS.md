# Constraints

Last reviewed: 2026-11-05 by @jorgetroya80

## Floor (always enforced)

- No new suppression comments: `@ts-ignore`, `eslint-disable`, `// oxlint-disable`
- No unimplemented stubs: `throw new Error("Not implemented")`, empty `catch {}`, `TODO`
- No skipped or deleted tests without a reason in the commit message
- No secrets in source
- This file does not get weakened to make a change pass

## Enforced with numbers

| Dimension      | Rule                                                 | Why                                                      | Checked by                                                                           | Runs at    |
| -------------- | ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------- |
| Types          | Zero type errors                                     | Build and CI gate                                        | `pnpm run typecheck`                                                                 | check:fast |
| Lint           | Zero errors from `.oxlintrc.json`                    | CI gate                                                  | `pnpm exec oxlint src/`                                                              | check:fast |
| Secrets        | No secrets in source                                 | Leaked key ends up in history                            | `gitleaks detect --redact --no-banner --source .`                                    | check:fast |
| Accessibility  | Zero critical or serious axe violations on form pages (contrast excluded, needs a browser) | Missing labels and broken ARIA hit keyboard and screen-reader users | `pnpm run test`, `src/test/a11y.test.tsx` | check:task |
| Coverage       | Changed lines ≥ 80% covered                          | Forces a test for new code, leaves room for config lines | `node scripts/changed-line-coverage.mjs --min 80`                                    | check:task |
| Floor          | No move that lowers the bar                          | Cheapest road to green                                   | `node scripts/floor-guard.mjs`                                                       | check:task |
| Security: code | No Semgrep findings (`p/default`, `p/owasp-top-ten`) | Input handling and XSS paths                             | `semgrep scan --config p/default --config p/owasp-top-ten --error --metrics=off src` | check:full |
| Security: deps | Nothing at high or above                             | Below high is mostly noise                               | `osv-scanner scan source -r .`                                                       | check:full |

Every row names the command that produces the verdict.

## Measured, not yet enforced

| Metric                            | Today    | Direction     | Measured by                                                 |
| --------------------------------- | -------- | ------------- | ----------------------------------------------------------- |
| Project line coverage             | 84.77%   | must not fall | `pnpm run test:coverage`                                    |
| Entry bundle, gzip (`index-*.js`) | 46,519 B | must not grow | `pnpm run build && gzip -c dist/assets/index-*.js \| wc -c` |

Promote a row to "enforced" once a command gates it.

## Deferred

- **Color contrast and full-page a11y:** needs a browser run (Playwright + axe against `pnpm preview`, port 4173). Not gated yet. Owner: @jorgetroya80. Revisit by 2027-02-03.

## Exceptions

| ID  | Rule | Path | Reason | Owner | Expires |
| --- | ---- | ---- | ------ | ----- | ------- |
