# Web performance follow-up — task list

Companion checklist for [web-perf-followup.md](./web-perf-followup.md). Tracks issue
[#172](https://github.com/jorgetroya80/donations-frontend/issues/172).

Each task is a vertical slice: it changes something, and it ends with a number or a passing check.

## Phase 1 — nginx caching + compression (`perf(nginx):`)

- [ ] **1.1 `Cache-Control: no-cache` on the HTML entry point** — `default.conf.template`.
      Accept: `curl -sI /` and `curl -sI /donations` both return `cache-control: no-cache`.
      Accept: hashed assets keep `public, immutable, max-age=31536000`.
      Accept: the five security headers (CSP, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, X-XSS-Protection) still present on the HTML response — `add_header`
      does not merge across nginx levels, so a new block silently drops them.
- [ ] **1.2 Raise gzip level and widen the type list** — `default.conf.template`:
      `gzip_comp_level 6`, add `text/javascript`, `font/woff2`, `application/wasm`.
      Accept: served size of the entry chunk matches `gzip -9`/`gzip -6`, not `gzip -1`.
      Baseline to beat: 167,853 B served vs 142,495 B at `gzip -9` (raw 449,635 B).
- [ ] **1.3 Precompress assets at build time** — inline `writeBundle` plugin in `vite.config.ts`
      using `node:zlib` at level 9, plus `gzip_static on` in nginx. No new dependency.
      Accept: `dist/assets/*.js.gz` exist after `pnpm run build`; nginx serves them
      (byte-identical to the local `.gz`, zero per-request CPU).
- [ ] **1.4 Checkpoint — measure in Docker before opening the PR.**
      `pnpm run build && docker build -t df-perf . && docker run --rm -p 8081:80 -e PORT=80 df-perf`
      Record before/after bytes for the entry chunk in the PR description.
- [ ] **1.5 Flag Cloudflare Brotli to Jorge** — dashboard toggle, not a repo change (~57 KB,
      25% of the critical path). Origin Brotli is not viable: `nginx:1.27-alpine` has no
      `ngx_brotli`. After enabling, re-check whether the edge passes origin gzip through
      or re-compresses.
- [ ] **1.6 Verify in production after deploy** — repeat 1.1 and 1.2 against the live URL.
      Render autodeploys from `main`.

## Phase 2 — lazy-load the calendar (`perf(calendar):`)

- [ ] **2.1 Grep every `Calendar` import site** before touching anything. Only
      `src/components/date-range-picker.tsx` is in scope; leave other call sites alone.
- [ ] **2.2 Measure the real popover box** — open the two-month calendar and read its
      rendered dimensions from the DOM. The Suspense fallback is sized from this number,
      not guessed.
- [ ] **2.3 New `src/components/ui/calendar.lazy.tsx`** — mirror
      `src/features/dashboard/comparison-bar-chart.lazy.tsx`: same exported component name,
      `type`-only props import, local `Suspense` with a box-matched fallback.
- [ ] **2.4 Point `date-range-picker.tsx` at the lazy wrapper.** Trigger button stays eager.
      `dayjs` stays eager — the trigger label needs it.
- [ ] **2.5 Prefetch on `onMouseEnter`/`onFocus`** of the trigger so the chunk is usually
      resident before the popover opens.
- [ ] **2.6 Checkpoint.** `pnpm run test` green, including all 10 keyboard-nav tests in
      `src/components/ui/calendar.test.tsx` — if the lazy boundary breaks them the wrapper
      is wrong; do not weaken the tests. Then `pnpm run typecheck`, `pnpm run check:ci`.
- [ ] **2.7 Confirm the bundle actually moved** — `pnpm run analyze`; `date-range-picker-*.js`
      (93.19 KB raw / 29.05 KB gzip) must leave the eager graph of `/`, `/donations`,
      `/expenses`, `/reports`.
- [ ] **2.8 Browser check** — open the picker on `/` and `/donations`, pick a range, confirm
      the query refires and the popover does not resize when the chunk lands.

## Phase 3 — font preload (`perf(fonts):`) — optional, revert if it does not pay

- [ ] **3.1 Emit the preload tag from a Vite `transformIndexHtml` hook** reading the hashed
      woff2 filename out of the bundle. Never hardcode the hash. `crossorigin` is required
      even same-origin, or the font double-fetches.
- [ ] **3.2 Checkpoint** — production trace showing the font starting alongside the CSS
      instead of after it (was: 390 ms, third hop).
      **Under ~100 ms improvement → revert.** Not a CLS source; that stays refuted.

## Phase 4 — measure, then decide

- [ ] **4.1 Production INP on the date picker** — after Phase 2 lands, since it changes the
      load path. Under 200 ms → close 4.2 unchanged.
- [ ] **4.2 Calendar focus reflow** (`src/components/ui/calendar.tsx:198-201`) — only if 4.1
      says it is genuinely slow. The behaviour is an accessibility requirement (`cde0184`)
      and 9 of 10 tests fail without it.
- [ ] **4.3 Sidebar prefetch** (`src/layouts/sidebar.tsx:114`) — measure a cold sidebar
      navigation; act only if the chunk hop is a material share of the total.
- [ ] **4.4 Lazy `AppLayout`** — recommend closing as won't-do. It introduces a waterfall for
      already-authenticated arrivals and recovers well under the 35 KB first estimated.
- [ ] **4.5 Open a separate issue for a `web-vitals` field beacon.** CrUX has nothing for this
      origin; every number in #172 is lab data.

## Closing out

- [ ] Update #172 with measured results, including the won't-do decisions — the issue exists
      partly so refuted findings are not re-raised.
- [ ] Delete the local `feat-exp-web-perf` branch (superseded by PR #173, released in 0.3.8).

## Measurement caveats

- `:4173` needs a manual login first — the session token is origin-scoped to `:3000`.
- Do not measure against real production donation records. Seed a staging instance with fake
  data, and use a **populated** date range: the last dashboard figures came from an empty
  August 2026 range.
