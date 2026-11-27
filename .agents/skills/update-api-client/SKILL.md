---
name: update-api-client
description: Bump @jorgetroya80/donations-api-client to a newer version (optional target version as argument), evaluate the contract change, plan and apply the code changes, open a PR. Use only when the user explicitly asks to update the API client.
---

Update `@jorgetroya80/donations-api-client` to a newer published version, adapt the
code to the new contract, and open a PR. Never merge — PR only, merge stays manual.

The package lives on GitHub Packages. Prefix every pnpm call that reaches the
registry with `NODE_AUTH_TOKEN=$(gh auth token)`; the shell's own `NODE_AUTH_TOKEN`
returns 401. The client version always equals the donations-api release tag.

## Steps

1. **Versions.**
   - Pinned: `node -p "require('./package.json').dependencies['@jorgetroya80/donations-api-client']"`
   - Target: the version the user gave, otherwise
     `NODE_AUTH_TOKEN=$(gh auth token) pnpm view @jorgetroya80/donations-api-client version`
   - If target is not newer than pinned, say so and stop.
   - If `gh pr list --state open --search "donations-api-client in:title"` already
     covers the target, report the PR number and stop.

2. **Branch.** Require a clean working tree (stop and report if not). Then
   `git switch main && git pull --ff-only && git switch -c chore/api-client-<target>`.

3. **Snapshot the old client.** Run `pnpm install --frozen-lockfile` with the token, then
   `rm -rf "$TMPDIR/client-old" && cp -RL node_modules/@jorgetroya80/donations-api-client/dist "$TMPDIR/client-old"`.

4. **Bump.**
   - `NODE_AUTH_TOKEN=$(gh auth token) pnpm add -E @jorgetroya80/donations-api-client@<target>`
   - Pin the API image used by the local fullstack to the same version. First confirm the tag
     exists on Docker Hub (`curl -s "https://hub.docker.com/v2/repositories/jorgetroya/donations-api/tags/<target>"`
     returns a `name`); if it does not, report it and leave the image version alone.
     - `docker-compose.yml`: `jorgetroya/donations-api:${DONATIONS_API_VERSION:-<target>}`
     - `.env.example` (tracked): `DONATIONS_API_VERSION=<target>`
     - `.env` (gitignored, local only, if it exists): `DONATIONS_API_VERSION=<target>`. Never commit it.

5. **Evaluate.**
   - `diff -ru "$TMPDIR/client-old" node_modules/@jorgetroya80/donations-api-client/dist > "$TMPDIR/client.diff"`
     and read it. Empty means the contract is unchanged.
   - Read the API release notes for every tag between pinned and target:
     `gh release list -R jorgetroya80/donations-api` and `gh release view v<tag> -R jorgetroya80/donations-api`.
   - Find every use in `src/` of each changed type, SDK function or schema, including
     MSW handlers in `src/test/msw-handlers.ts`.

6. **Plan.** Write the plan (with a planning skill if your agent has one) to
   `docs/plans/api-client-<target>.md`, following the shape of
   `docs/plans/api-client-2.2.0.md` (context, files, dependency graph, decisions, phases,
   risks). If the diff does not affect `src/`, the plan says so and lists no code
   changes. Show a short summary of the plan and **wait for approval** before step 7.

7. **Build.** Execute the approved plan. Only change what the client update requires.

8. **Verify.** `pnpm run check` (auto-fix), then `pnpm run check:task` must pass. Report its
   real result.

9. **PR.**
   - Commit following the convention in `AGENTS.md` (Workflow). Subject:
     `fix(deps): bump donations-api-client to <target>` (a feature the new API enables
     goes in its own `feat:` commit). No AI attribution.
   - `git push -u origin chore/api-client-<target>`
   - `gh pr create` with a body in three sections: **What** (client bump, API image pin in
     `docker-compose.yml` / `.env.example`, plus the code changes), **Why** (what changed in the API, the `dist/` diff result, link to the plan
     doc), **Test plan** (checks run plus a smoke test of the affected pages).
   - Report the PR URL.
