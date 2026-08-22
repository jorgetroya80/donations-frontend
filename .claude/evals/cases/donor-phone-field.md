# Add a phone field to the donor form

Checks that the agent follows the feature-slice conventions: Zod schema, i18n, colocated
tests — instead of hardcoding a Spanish label into JSX.

## Prompt

```
Add an optional "phone" field to the donor form, wired end to end.
```

## Assertions

```bash
# Schema is the source of truth for the field.
grep -q "phone" src/features/donors/donor-schema.ts

# The label went through i18n, not into the JSX.
grep -q "phone" src/locales/es.json
! grep -nE '>[^<>{}]*[áéíóúñ¿¡][^<>{}]*<' src/features/donors/donor-form.tsx

# The existing suite still passes.
pnpm exec vitest related --run src/features/donors/donor-form.tsx
```
