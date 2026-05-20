# PRD: Password Visibility Toggle

## Problem Statement

Users filling in password fields (login, change password, user management) have no way to verify what they typed. A single mistyped character forces them to clear the field and retype, with no visual feedback. This is especially frustrating on mobile or when entering complex passwords.

## Solution

Add a show/hide toggle button inside every password input field. When the user clicks the eye icon, the field switches from masked to readable text. Clicking again masks it. The toggle is built into the shared `Input` component so it applies automatically to all password fields across the app without any changes at call sites.

## User Stories

1. As a user logging in, I want to reveal my password before submitting, so that I can confirm I typed it correctly.
2. As a user changing my password, I want to toggle visibility on the current password field, so that I can verify I'm entering the right password.
3. As a user changing my password, I want to toggle visibility on the new password field, so that I can confirm I'm typing what I intend.
4. As a user changing my password, I want to toggle visibility on the confirm password field, so that I can check both fields match before submitting.
5. As an admin creating a new user, I want to toggle the password field, so that I can verify the password I'm assigning.
6. As an admin editing a user, I want to toggle the password field, so that I can confirm the new password before saving.
7. As a screen reader user, I want the toggle button to have a descriptive label, so that I know what the button does before activating it.
8. As a Spanish-speaking user, I want all UI labels to be in Spanish, so that the interface is consistent with the rest of the application.
9. As a user, I want the toggle button to be visually inside the input field, so that the form layout does not shift when the toggle is present.
10. As a user, I want the toggle button to not interfere with typing, so that my text is never obscured by the button.
11. As a user with limited mobility, I want the toggle button to be keyboard-accessible, so that I can reveal my password without a mouse.

## Implementation Decisions

- The toggle is built into the shared `Input` component and activates automatically when `type="password"`. No call-site changes are required.
- When `type` is not `"password"`, the component renders exactly as before — no behavioral change.
- The input is wrapped in a `relative` container div only when `type="password"`. The toggle button is absolutely positioned on the right side. The input receives extra right padding to prevent text from overlapping the button.
- The toggle uses `Eye` and `EyeOff` icons from `lucide-react`, the icon library already used in the project.
- Two new Spanish translation keys are added under the `common` namespace: one for "show password" and one for "hide password".
- The `Input` component uses the `useTranslation` hook to access these keys for the button's `aria-label`, which switches dynamically with the toggle state.
- The toggle button has `type="button"` to prevent accidental form submission.

## Testing Decisions

A good test verifies external behavior: what the user sees and interacts with — not implementation details like internal state variable names or component structure.

**Modules to test:** The `Input` component.

**Test cases:**
- When `type="password"`, an eye icon button is rendered.
- When `type` is anything other than `"password"`, no toggle button is rendered.
- Clicking the toggle changes the input's `type` attribute from `password` to `text`.
- Clicking the toggle a second time changes the input's `type` attribute back to `password`.
- The toggle button's `aria-label` reads "Mostrar contraseña" when password is hidden.
- The toggle button's `aria-label` reads "Ocultar contraseña" when password is visible.

**Prior art:** Check existing component tests in the project for patterns on rendering and user interaction with `@testing-library/react`.

## Out of Scope

- Per-field opt-out (all password fields get the toggle).
- Auto-hide after a timeout.
- Any changes to password validation logic.
- Multi-language support beyond Spanish.

## Further Notes

- The `Input` component currently wraps `@base-ui/react/input`. The password branch wraps that primitive in a plain `div` — no new base-ui primitives introduced.
- All three forms that use password inputs (login, change-password, user-form) benefit automatically.
