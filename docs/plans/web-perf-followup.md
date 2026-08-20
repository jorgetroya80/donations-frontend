# Web performance follow-up (issue #172)

## Context

Issue [#172](https://github.com/jorgetroya80/donations-frontend/issues/172) records a web performance audit run twice: once on localhost, once against the live Render deployment. It documents what was fixed, what was **refuted** (recharts namespace import, font-caused CLS — do not re-raise either), and what remains open.

Since the issue was written, its priority 3 ("deploy the branch") has already landed: PR #173 (`60a3de5`) merged every dashboard fix — `staleTime: 30_000`, skeleton removal, `PctChange` reservation, chart-card `min-h-75`, the preview proxy — and released as 0.3.8. Production autodeploys from `main`, so the 0.0543 → ~0.008 dashboard CLS win is already live. The local `feat-exp-web-perf` branch is now redundant and should be deleted.

What remains is everything the audit ranked **above** that deployment plus the deferred code items:

1. **HTML ships with no `Cache-Control`** — a stale `index.html` referencing content-hashed assets that no longer exist white-screens users after a deploy. Failure mode, not a slowdown.
2. **Compression runs at gzip level 1** — production bytes match `gzip -1` to within 7 bytes. `gzip -9` alone saves 25.4 KB (15.1%) on the entry chunk; ~57 KB (25%) across the critical path with Brotli.
3. **The date-range picker is 93 KB raw / 29 KB gzip loaded eagerly** on four routes for a calendar that only renders when a popover opens.
4. Font preload, calendar INP, and sidebar prefetch — all gated in the issue on measurement that has not been taken.

The audit named the origin of items 1 and 2 as "infrastructure, not code, neither lives in this repo." That is wrong: `default.conf.template` **is** in this repo, and it has `gzip on` with no `gzip_comp_level` — nginx's default is 1, which exactly explains the measured bytes. Both are fixable here.

**Outcome**: remove the white-screen-after-deploy failure mode, cut 15–25% off the critical path, defer the largest remaining JS payload, and close #172 with every open item either done or explicitly decided with a number behind it.

## Files

| File                                   | Change                                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `default.conf.template`                | `Cache-Control` on HTML, `gzip_comp_level`, `gzip_types`, `gzip_static`          |
| `vite.config.ts`                       | build-time gzip precompression plugin; font preload tag                          |
| `src/components/date-range-picker.tsx` | lazy popover content                                                             |
| `src/components/ui/calendar.lazy.tsx`  | **new** — mirrors `src/features/dashboard/comparison-bar-chart.lazy.tsx`         |
| `index.html`                           | font preload target (via a Vite `transformIndexHtml` hook, not a hardcoded hash) |

---

## Phase 1 — nginx: caching + compression

**Both changes are in `default.conf.template`.** No app code.

### 1a. `Cache-Control: no-cache` on HTML

`location /` currently serves `index.html` via `try_files` with no `Cache-Control` at all. Per RFC 9111 browsers then apply heuristic freshness (~10% of document age); production's `last-modified` was 13 days old at audit time, giving ~1.3 days of caching with zero revalidation. Add an exact-match location:

```nginx
location = /index.html {
    add_header Cache-Control "no-cache" always;
}
```

`no-cache` (revalidate every time), **not** `no-store` — `no-store` would break bfcache, which the audit confirmed is currently preserved. Cost is one conditional request per navigation, ~54 ms at the measured TTFB, almost always a 304.

Note `location = /index.html` does not catch `try_files` internal rewrites of deep links by itself; verify a deep-link request (`/donations`) also carries the header, and if it does not, put the `add_header` on `location /` instead.

**Watch out**: nginx `add_header` does not merge across levels. Any new block that declares its own `add_header` **discards every inherited security header** (CSP, X-Frame-Options, nosniff, Referrer-Policy). The existing asset regex block already has this bug — assets ship with no security headers today. Fixing that is out of scope for this plan, but do not _widen_ it: whichever block gets the new `Cache-Control` must repeat the five security headers, or use `include` for a shared snippet.

### 1b. Compression

```nginx
gzip_comp_level 6;
gzip_static on;
gzip_types
    text/plain text/css text/javascript
    application/javascript application/json application/xml
    image/svg+xml font/woff2;
```

Three separate gaps:

- **Level**: default 1 → 6. This alone is the 15.1% win.
- **Types**: current list misses `text/javascript` (what Vite-built `.js` is served as by nginx's default mime map — verify with `curl -I`), `font/woff2`, `application/wasm`.
- **`gzip_static on`**: serves a precompressed `.js.gz` if one sits next to the file, at zero per-request CPU. Matters on the free Render plan.

Precompress at build time with a small inline Vite plugin in `vite.config.ts` using `node:zlib` at level 9 — no new dependency, matching the repo's existing habit of inline config (`apiProxy`) over packages:

```ts
{
  name: 'gzip-assets',
  apply: 'build',
  writeBundle(options, bundle) { /* gzipSync(level: 9) each .js/.css/.svg > 1024 B */ }
}
```

`dist/` is gitignored, so the `.gz` files ride along in the Docker `COPY dist` with no repo noise.

**Brotli is deliberately not done at origin**: `nginx:1.27-alpine` has no `ngx_brotli` module, so `brotli_static` would need a custom nginx build. Brotli belongs at the Cloudflare edge (a dashboard toggle, ~57 KB, zero code) — flag it to Jorge as a separate manual action, and re-check afterward whether Cloudflare passes origin gzip through or re-compresses.

**Checkpoint 1 — measure before continuing.**

```bash
pnpm run build && docker build -t df-perf . && docker run --rm -p 8081:80 -e PORT=80 df-perf
```

- `curl -sI http://localhost:8081/ | grep -i cache-control` → `no-cache`
- `curl -sI http://localhost:8081/donations` → same (deep-link check)
- `curl -sI -H 'Accept-Encoding: gzip' http://localhost:8081/assets/index-*.js` → `content-encoding: gzip`, security headers still present
- Byte comparison: served size vs `gzip -1` vs `gzip -9` on the same file. Expect the served size to match `gzip -9`, not `gzip -1`.
- After deploy, repeat all of the above against the production URL — the audit's measured `gzip -1` figure is the baseline to beat.

---

## Phase 2 — lazy-load the date-range picker calendar

`src/components/date-range-picker.tsx` statically imports `Calendar`, pulling react-day-picker into the entry path of `/`, `/donations`, `/expenses`, and `/reports` (six consumer sites; `donors` does not use it). The calendar only ever renders inside an open popover.

Follow the established pattern in `src/features/dashboard/comparison-bar-chart.lazy.tsx` exactly: a `<name>.lazy.tsx` wrapper re-exporting the **same component name**, a `type`-only import of props, and a local `Suspense` whose fallback matches the real component's box so nothing shifts.

- New `src/components/ui/calendar.lazy.tsx`: `lazy(() => import('./calendar').then((m) => ({ default: m.Calendar })))`.
- `date-range-picker.tsx` imports from `./ui/calendar.lazy`; the trigger button stays eager so it cannot shift.
- Fallback must be sized to the real two-month calendar (`numberOfMonths={2}`), measured from the rendered DOM, not guessed — a popover that resizes on chunk arrival is a worse experience than the current one.
- Prefetch the chunk on the trigger's `onMouseEnter`/`onFocus` so the calendar is usually already resident by the time the popover opens.

Keep `dayjs` eager — the trigger label formats with it and it is used app-wide.

`Calendar` is also imported directly elsewhere; leave those call sites alone (surgical-change rule). Grep before editing to confirm which they are.

**Checkpoint 2:**

- `pnpm run test` — 397+ tests green; `src/components/ui/calendar.test.tsx` (10 keyboard-nav tests) must still pass. If the lazy boundary breaks them, the wrapper is wrong — do not weaken the tests.
- `pnpm run typecheck`, `pnpm run check:ci`.
- `pnpm run analyze` → confirm `date-range-picker-*.js` no longer appears in the dashboard's eager graph.
- Browser: open the picker on `/` and on `/donations`, pick a range, confirm the query refires and the popover does not resize on chunk arrival.

---

## Phase 3 — font preload

`/login` → `index-*.css` → `geist-latin-wght-normal.woff2` is a 390 ms three-hop chain; the font is not discoverable until the CSS parses. **This is not a CLS source** — that finding stays refuted (0.0000 attributed shift). The only cost is a late swap-in, and LCP is already 418 ms.

The filename is content-hashed, so do **not** hardcode it in `index.html`. Emit the tag from a Vite `transformIndexHtml` hook that reads the woff2 filename out of the bundle:

```html
<link
  rel="preload"
  as="font"
  type="font/woff2"
  href="/assets/geist-...woff2"
  crossorigin
/>
```

`crossorigin` is required even same-origin — font fetches are CORS-mode, and omitting it double-fetches.

**Checkpoint 3**: production trace showing the font request starting alongside the CSS rather than after it. **If the measured improvement is under ~100 ms, revert this phase** — it adds build machinery for a hashed filename and the audit already rated it "lower priority than it looks."

---

## Phase 4 — measure, then decide the deferred items

These are _decisions_, not implementations. Each is currently gated on a number nobody has.

**4a. Calendar forced reflow** (`src/components/ui/calendar.tsx:198-201`). ~70 day buttons each run a `useEffect` calling `ref.current?.focus()`. 47 ms attributed reflow, 280 ms INP — but that is a **dev-server figure at 4× throttle**, the least trustworthy number in the audit. Get production INP on the picker (Phase 2 changes the load path, so measure after it lands). **If it lands under 200 ms, close this and change nothing** — the focus behaviour is an accessibility requirement (`cde0184`), and 9 of 10 calendar tests fail without it. Only if it is genuinely slow, hoist one effect to the calendar root targeting the currently-focused day.

**4b. Sidebar route prefetch** (`src/layouts/sidebar.tsx:114`). Plain `NavLink`: click → download chunk → mount → _then_ query. Warming the route module on `onMouseEnter` captures most of it; the cost is coupling the sidebar to route module paths. Unquantified in production — measure a cold sidebar navigation, and only act if the chunk hop is a material share of the total.

**4c. Lazy `AppLayout`** (`src/app-routes.tsx`). The audit's own analysis argues against it: base-ui is pinned to `/login` independently by `TooltipProvider`/`ToastProvider`/`Input`, so the recovery is well under the ~35 KB first estimated, and it _introduces_ a waterfall for already-authenticated arrivals. **Recommend closing as won't-do** unless the auth-state distribution of real traffic says otherwise.

**4d. Field data.** There is no CrUX data for this origin — it is below the reporting threshold, and every number in #172 is lab data. A `web-vitals` beacon would give real INP attribution no lab run can. Worth a separate issue, not this plan.

---

## Deliverables

- `docs/plans/web-perf-followup.md` — this plan (repo convention: `docs/plans/`, alongside the 40+ existing plans).
- `docs/plans/web-perf-followup-todo.md` — the task checklist.
- One PR per phase, conventional-commit titled (CI enforces it): `perf(nginx):`, `perf(calendar):`, `perf(fonts):`.
- Close #172 with the measured results, including the items decided as won't-do — the issue's own framing is that refuted findings must be documented so they are not re-raised.
- Delete the now-redundant local `feat-exp-web-perf` branch.

## Verification

Full gate before each PR: `pnpm run typecheck && pnpm run check:ci && pnpm run test && pnpm run build`.

Performance verification is measurement, not inspection — every phase ships with a before/after number:

```bash
pnpm run build && pnpm run preview   # :4173, proxies /api
pnpm run lighthouse                  # writes to gitignored .lighthouse/
```

Deeper traces use the `chrome-devtools` MCP server (already in `.mcp.json`).

**Two caveats carried over from the audit, both of which make preview numbers untrustworthy:**

- The session token is origin-scoped to `:3000`, so `:4173` needs a manual login before authenticated routes can be traced.
- Do not measure against real production donation records. The last audit hit the authenticated dashboard **incidentally** — the browser profile held a live production session that the SPA restored mid-run. Seed a staging instance with fake data instead, and measure a **populated** date range: the last dashboard numbers came from an empty August 2026 range.
