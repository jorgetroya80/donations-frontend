# UI/UX Refresh Plan — donations-frontend

## Context

Codebase review (React 19 + Vite 8 + Tailwind v4 + TanStack Query v5 + Base UI + i18next-es) found solid foundations — token-driven primitives in `src/components/ui/`, complete form ARIA, class-based dark mode — but concrete gaps: a real Select prefill bug on edit pages, no mobile navigation, error messages that discard the newly adopted ProblemDetail bodies, zero success feedback, inconsistent loading/empty states, and a handful of a11y/visual leftovers. Goal: fix the bugs, close the UX gaps, and unify the rough edges in 6 independently shippable PR-sized phases.

User decisions: use base-ui Toast (already a dependency), remove all edit-confirm dialogs, light shared pieces (no full DataTable), full scope (bugs+UX, mobile nav, a11y, polish).

Constraints: new shared components are plain HTML+Tailwind (no new base-ui coupling); surgical diffs; each phase verified via existing Vitest/MSW co-located tests + browser preview.

---

## Phase 1 — Fix Select prefill bug (small, ship first)

**Problem:** `Select` receives the *translated label* as `value` while `SelectItem value` is the raw enum, so on edit pages the saved value matches nothing and the trigger shows the placeholder.

**Files:**
- `src/features/donations/donation-form.tsx:112,153-157` — change to `value={field.value ?? ''}`
- `src/features/expenses/expense-form.tsx:112,155` — same fix

Display stays translated because `SelectValue` renders the matched item's label (items already render `t(...)`).

**Verify:** update/add form tests asserting the edit page shows the saved type/category/payment method in the trigger; manual check on `/donations/:id/edit` and `/expenses/:id/edit` via dev server.

---

## Phase 2 — Toasts + success feedback + remove edit-confirm dialogs

**New:** `src/components/ui/toast.tsx` — wrapper over base-ui `Toast` (`@base-ui/react`, already a dependency v1.4.1), following the same wrapping conventions as `dialog.tsx`/`select.tsx` (`data-slot`, `cn()`, token classes styled like `alert.tsx` variants):
- `Toast.Provider` + `Toast.Viewport` (fixed bottom-right) + styled `Toast.Root/Title/Close`; base-ui handles timers, swipe/dismiss, a11y announcements, and focus behavior
- Expose the `Toast.useToastManager()` hook (re-export or thin `useToast()` wrapper) for feature code
- Mount provider in `src/App.tsx`

**Wire success toasts** in the mutation `onSuccess`/submit handlers of all create/edit flows (donations, donors, expenses, users, change-password), adding i18n keys (`common.saved` or per-feature) to `src/locales/es.json`.

**Remove confirm dialogs:** delete the confirm `Dialog` + promise-resolver ref in `src/features/donors/donor-edit-page.tsx:27-38,90-124` and the `pendingData` variant in `src/features/donations/donation-edit-page.tsx`; submit directly. Remove now-unused imports/i18n keys.

**Verify:** toast component tests (render, auto-dismiss with fake timers, aria-live); update edit-page tests to expect direct save (no dialog) + toast; manual create/edit flow in browser.

---

## Phase 3 — Surface ProblemDetail errors

**New:** small helper `getProblemMessage(error, fallback)` in `src/lib/` (next to `parse-api-field-errors.ts`) that extracts RFC 9457 `detail` ?? `title`, falling back to the generic i18n string.

**Apply at the feature layer:**
- Page-level load errors: replace hardcoded `t('X.errorLoading')` in the `<Alert>` blocks of `donations-page.tsx`, `donors-page.tsx`, `expenses-page.tsx`, `users-page.tsx`, `reports-page.tsx` (3 spots), `financial-overview.tsx`, and the edit pages' load/save errors.
- Form field errors: `parse-api-field-errors.ts` is only wired into `donor-form.tsx:45` — wire it identically into donation/expense/user form submit handlers so server field errors land inline.

**What NOT to do:** no global error interceptor rewrite; `src/lib/api.ts` stays untouched.

**Verify:** MSW handlers returning ProblemDetail bodies; tests assert `detail` text appears in the Alert / inline field errors; fallback test for non-ProblemDetail errors.

---

## Phase 4 — Mobile navigation

**Approach:** plain Tailwind responsive drawer, no new deps.
- `src/layouts/app-layout.tsx`: sidebar hidden below `md` (`hidden md:flex` wrapper); add `mobileOpen` state; render sidebar as fixed overlay drawer (`fixed inset-y-0 left-0 z-50` + semi-transparent backdrop) when open on small screens.
- `src/layouts/sidebar.tsx`: accept the drawer mode (always-expanded when in drawer); close on nav link click and Escape; backdrop click closes.
- `src/layouts/header.tsx`: hamburger button (`lucide-react` Menu icon, `md:hidden`, `aria-label` + `aria-expanded`).
- Focus handling: move focus into drawer on open, return to hamburger on close (small effect, no focus-trap library).
- Loosen `p-6` on `<main>` to `p-4 md:p-6`.

**What NOT to do:** don't rebuild the sidebar with base-ui Dialog; don't touch the desktop collapse behavior or its localStorage persistence.

**Verify:** layout tests (hamburger visible/drawer toggles); browser check at 375px (mobile preset) and desktop — screenshot both; keyboard: Escape closes, focus returns.

---

## Phase 5 — Unified loading/empty states + a11y remainders

**Loading:**
- Extend `src/components/skeleton.tsx` with `className` prop (keep default `h-10`); add a `TableSkeleton` (header bar + N row bars) in the same file.
- List pages (`donations-page.tsx:68-80`, `donors-page.tsx`, `users-page.tsx`, `expenses-page.tsx`): use `TableSkeleton`.
- Replace text-Alert loading in `reports-page.tsx:53-57,121-125,195-199`, `financial-overview.tsx:165-169`, and edit pages (`donation-edit-page.tsx:50-56`, `donor-edit-page.tsx:51-57`) with skeletons.

**Empty:** reuse existing `src/components/empty-state.tsx` in `reports-page.tsx:91,161,248` and `financial-overview.tsx:316,360` (replace ad-hoc `<p>`).

**A11y — light shared pieces:**
- New `src/components/sortable-th.tsx`: `<th aria-sort>` wrapping a real `<button>` (focus-visible ring, sort icon). Swap into the 4 list pages, replacing the onClick/tabIndex `<th>` pattern (`donations-page.tsx:98-108` et al.). Keeps `use-sort.ts` unchanged.
- New `src/components/ui/tabs.tsx`: plain HTML+Tailwind tablist with arrow-key/Home/End roving focus. Replace hand-rolled tabs in `reports-page.tsx:270-289`.
- `src/features/users/user-form.tsx:115-141`: convert role group + active checkbox to `<fieldset><legend>`; style checkboxes with `accent-primary` + `focus-visible` ring classes.
- `src/features/donations/donor-picker.tsx:95`: reuse `<Input>` (or its exact classes) and wire `aria-invalid`/`aria-describedby` + inline error like other fields.

**Verify:** existing page tests keep passing (loading assertions updated); new tests for SortableTh (keyboard activation, aria-sort) and Tabs (arrow-key nav); axe-style manual pass in browser.

---

## Phase 6 — Visual polish

- **Success token:** add `--success` / `--success-foreground` (light+dark OKLCH) to `src/index.css` `@theme` + variable blocks; replace `text-green-600 dark:text-green-400` at `financial-overview.tsx:59,179` with `text-success`.
- **Orphan tokens:** delete the unused `sidebar-*` token set from `src/index.css` (sidebar uses `bg-card`; verify no usages first with grep).
- **i18n chart labels:** replace hardcoded Spanish maps at `financial-overview.tsx:66-91` with `t('donations.types.*')` / `t('expenses.categories.*')` lookups (keys already exist).
- **PageHeader:** new tiny `src/components/page-header.tsx` (`<h1 className="text-2xl font-bold">` + optional action slot); swap into the ~10 pages currently repeating the literal classes. Purely mechanical.

**Verify:** `pnpm run check` + full test suite; visual browser pass in light + dark mode (dashboard, one list, reports).

---

## Execution notes

- Each phase = own branch/PR off `main`; run `pnpm run check` and `pnpm run test` per phase.
- Verification workflow per phase: dev server via preview, exercise the changed flow, screenshot proof (including 375px + dark mode where relevant).
- Out of scope (noted, not touched): login lockout ref reset, i18n multi-language support, optimistic updates, full DataTable abstraction.
