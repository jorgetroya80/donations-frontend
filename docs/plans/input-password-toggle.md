# Plan: Password Visibility Toggle

> Source PRD: docs/PRD-input-password-toggle.md — Issue #99

## Architectural decisions

- **Scope**: Change is contained to the shared `Input` component and the Spanish locale file. No route, schema, or API changes.
- **Activation**: Toggle renders automatically when `type="password"`. Zero call-site changes.
- **Icons**: `Eye` / `EyeOff` from `lucide-react` (already a project dependency).
- **i18n**: Two new keys under `common` namespace in `src/locales/es.json`.
- **Layout**: Wrapper `div` with `relative` positioning. Button absolutely positioned right. Input gets extra right padding to prevent text overlap.

---

## Phase 1: Toggle implementation

**User stories**: 1, 2, 3, 4, 5, 6, 8, 9, 10, 11

### What to build

Add two Spanish translation keys (`common.showPassword`, `common.hidePassword`). Modify the `Input` component so that when `type="password"`, it renders a relative wrapper containing the input and an absolutely-positioned toggle button. Clicking the button switches the input between `password` and `text` types and swaps the icon. The button carries a dynamic Spanish `aria-label` that reflects current state. Non-password inputs are unaffected.

### Acceptance criteria

- [ ] Eye icon button appears on all password fields (login, change-password ×3, user-form)
- [ ] Clicking the button reveals the typed password as plain text
- [ ] Clicking again masks the password
- [ ] Icon switches between Eye and EyeOff on each click
- [ ] Form layout does not shift when toggle is present
- [ ] Typed text is not obscured by the toggle button
- [ ] Button is reachable and activatable via keyboard (Tab + Enter/Space)
- [ ] `aria-label` reads "Mostrar contraseña" when masked, "Ocultar contraseña" when visible
- [ ] Non-password inputs render exactly as before

---

## Phase 2: Unit tests

**Testing decisions from PRD**

### What to build

Write unit tests for the `Input` component covering the password toggle behavior. Tests assert external behavior only — what the user sees and what attributes the DOM exposes — not internal state.

### Acceptance criteria

- [ ] Test: `type="password"` renders an eye toggle button
- [ ] Test: `type="text"` (and other non-password types) renders no toggle button
- [ ] Test: clicking toggle changes input `type` attribute from `password` to `text`
- [ ] Test: clicking toggle a second time changes input `type` attribute back to `password`
- [ ] Test: button `aria-label` is "Mostrar contraseña" when password is hidden
- [ ] Test: button `aria-label` is "Ocultar contraseña" when password is visible
