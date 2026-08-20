# Web performance follow-up — task list

Companion checklist for [web-perf-followup.md](./web-perf-followup.md). Tracks issue
[#172](https://github.com/jorgetroya80/donations-frontend/issues/172).

Each task is a vertical slice: it changes something, and it ends with a number or a passing check.

## Phase 1 — nginx caching + compression (`perf(nginx):`)

- [x] **1.1 `Cache-Control: no-cache` on the HTML entry point** — `default.conf.template`.
      Accept: `curl -sI /` and `curl -sI /donations` both return `cache-control: no-cache`.
      Accept: hashed assets keep `public, immutable, max-age=31536000`.
      Accept: the five security headers (CSP, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, X-XSS-Protection) still present on the HTML response — `add_header`
      does not merge across nginx levels, so a new block silently drops them.
- [x] **1.2 Raise gzip level and widen the type list** — `default.conf.template`:
      `gzip_comp_level 6`, add `text/javascript`, `font/woff2`, `application/wasm`.
      Accept: served size of the entry chunk matches `gzip -9`/`gzip -6`, not `gzip -1`.
      Baseline to beat: 167,853 B served vs 142,495 B at `gzip -9` (raw 449,635 B).
- [x] **1.3 Precompress assets at build time** — inline `writeBundle` plugin in `vite.config.ts`
      using `node:zlib` at level 9, plus `gzip_static on` in nginx. No new dependency.
      Accept: `dist/assets/*.js.gz` exist after `pnpm run build`; nginx serves them
      (byte-identical to the local `.gz`, zero per-request CPU).
- [x] **1.4 Checkpoint — measure in Docker before opening the PR.**
      `pnpm run build && docker build -t df-perf . && docker run --rm -p 8081:80 -e PORT=80 df-perf`
      Record before/after bytes for the entry chunk in the PR description.
- [ ] **1.5 Flag Cloudflare Brotli to Jorge** — dashboard toggle, not a repo change (~57 KB,
      25% of the critical path). Origin Brotli is not viable: `nginx:1.27-alpine` has no
      `ngx_brotli`. After enabling, re-check whether the edge passes origin gzip through
      or re-compresses.
- [ ] **1.6 Verify in production after deploy** — repeat 1.1 and 1.2 against the live URL.
      Render autodeploys from `main`.

## Phase 2 — lazy-load the calendar (`perf(calendar):`)

- [x] **2.1 Grep every `Calendar` import site** before touching anything. Only
      `src/components/date-range-picker.tsx` is in scope; leave other call sites alone.
- [x] **2.2 Measure the real popover box** — open the two-month calendar and read its
      rendered dimensions from the DOM. The Suspense fallback is sized from this number,
      not guessed.
- [x] **2.3 New `src/components/ui/calendar.lazy.tsx`** — mirror
      `src/features/dashboard/comparison-bar-chart.lazy.tsx`: same exported component name,
      `type`-only props import, local `Suspense` with a box-matched fallback.
- [x] **2.4 Point `date-range-picker.tsx` at the lazy wrapper.** Trigger button stays eager.
      `dayjs` stays eager — the trigger label needs it.
- [x] **2.5 Prefetch on `onMouseEnter`/`onFocus`** of the trigger so the chunk is usually
      resident before the popover opens.
- [x] **2.6 Checkpoint.** `pnpm run test` green, including all 10 keyboard-nav tests in
      `src/components/ui/calendar.test.tsx` — if the lazy boundary breaks them the wrapper
      is wrong; do not weaken the tests. Then `pnpm run typecheck`, `pnpm run check:ci`.
- [x] **2.7 Confirm the bundle actually moved** — `pnpm run analyze`; `date-range-picker-*.js`
      (93.19 KB raw / 29.05 KB gzip) must leave the eager graph of `/`, `/donations`,
      `/expenses`, `/reports`.
- [x] **2.8 Browser check** — open the picker on `/` and `/donations`, pick a range, confirm
      the query refires and the popover does not resize when the chunk lands.

## Phase 3 — font preload (`perf(fonts):`) — optional, revert if it does not pay

- [x] **3.1 Emit the preload tag from a Vite `transformIndexHtml` hook** reading the hashed
      woff2 filename out of the bundle. Never hardcode the hash. `crossorigin` is required
      even same-origin, or the font double-fetches.
- [ ] **3.2 Checkpoint** — production trace showing the font starting alongside the CSS
      instead of after it (was: 390 ms, third hop).
      **Under ~100 ms improvement → revert.** Not a CLS source; that stays refuted.

## Phase 4 — measure, then decide

- [x] **4.1 Production INP on the date picker** — after Phase 2 lands, since it changes the
      load path. Under 200 ms → close 4.2 unchanged.
- [x] **4.2 Calendar focus reflow** (`src/components/ui/calendar.tsx:198-201`) — only if 4.1
      says it is genuinely slow. The behaviour is an accessibility requirement (`cde0184`)
      and 9 of 10 tests fail without it.
- [x] **4.3 Sidebar prefetch** (`src/layouts/sidebar.tsx:114`) — measure a cold sidebar
      navigation; act only if the chunk hop is a material share of the total.
- [x] **4.4 Lazy `AppLayout`** — recommend closing as won't-do. It introduces a waterfall for
      already-authenticated arrivals and recovers well under the 35 KB first estimated.
- [ ] **4.5 Open a separate issue for a `web-vitals` field beacon.** CrUX has nothing for this
      origin; every number in #172 is lab data.

## Closing out

- [ ] Update #172 with measured results, including the won't-do decisions — the issue exists
      partly so refuted findings are not re-raised.
- [ ] Delete the local `feat-exp-web-perf` branch (superseded by PR #173, released in 0.3.8).

## Measured so far (branch `feat-web-perf-followup`)

| What | Before | After |
|---|---:|---:|
| Entry chunk over the wire | 98,926 B (`gzip -1`) | 84,607 B (build-time `gzip -9`, served via `gzip_static`) |
| `date-range-picker` chunk, eager | 93.19 kB / 29.06 kB gzip | 22.53 kB / 9.04 kB gzip |
| Calendar (`react-day-picker`) | eager on 4 routes | 72.64 kB / 21.40 kB gzip, on demand |
| Font request start (preview) | after CSS parse (387 ms in prod) | 12 ms, same burst as CSS and entry JS |
| `/login` Lighthouse (preview, desktop) | 100 / LCP 0.6 s / CLS 0 | 100 / LCP 0.6 s / CLS 0 — no regression |

nginx headers verified against `nginx:1.27-alpine` serving the real `dist`: `/` and
`/donations` both return `cache-control: no-cache` plus all five security headers; assets
keep `public, immutable` and are served as the build-time `.gz` byte for byte.

Test suite: 401 passed (4 added), typecheck and Biome clean.

### Authenticated session, production build on `vite preview`

Measured against the local API with a real login, unthrottled desktop.

| Check | Result |
|---|---|
| Popover box, fallback vs calendar | 604 px → 569 px. Shrinks by one week row, never grows. |
| Calendar chunk on trigger hover | fetched on `mouseover`, 5 ms; one frame of fallback still shows because React's `lazy` awaits its own promise |
| Range change on `/` | six-query fan-out refires with the new dates, **CLS 0** |
| Range change on `/donations` | applies to the list, no shift |
| **INP, opening the picker** | **40 ms**, zero long tasks |
| **INP, clicking a day** | **48 ms**, zero long tasks |
| Cold sidebar nav to `/expenses` | chunk starts +0 ms, API fires +7 ms — the serialization is real but 7 ms locally |
| Dashboard load | CLS 0, no shifts recorded |

**4.1/4.2 decision — close, change nothing.** The audit's 280 ms came from the dev server at
4× CPU throttle. A production build measures 40–48 ms with no long task, so the ~70 focus
effects are not worth touching accessibility-critical code for. Caveat: unthrottled desktop;
even at 4× this stays around 200 ms, and the `cde0184` focus behaviour is required by 9 of
the 10 keyboard tests.

**4.3 decision — defer.** The chunk → mount → query ordering is confirmed, but locally it
costs 7 ms. On a real network hover prefetch would save roughly one RTT for a small chunk.
Not worth coupling the sidebar to route module paths until a production number says otherwise.

**4.4 decision — won't do**, per the audit's own reasoning: it introduces a waterfall for
already-authenticated arrivals and recovers well under the 35 KB first estimated.

## Measurement caveats

- `:4173` needs a manual login first — the session token is origin-scoped to `:3000`.
- Do not measure against real production donation records. Seed a staging instance with fake
  data, and use a **populated** date range: the last dashboard figures came from an empty
  August 2026 range.
