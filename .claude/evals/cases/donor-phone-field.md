# Add a phone field to the donor form

Checks that the agent follows the feature-slice conventions: Zod schema, i18n, colocated
tests — instead of hardcoding a Spanish label into JSX.

The setup strips the existing `phone` field out of the schema, the form and the locale
file. The API type still accepts `phone`, and the MSW handlers still return it, so the
field is addable end to end — the agent just has to do it the repo's way.

## Setup

```bash
perl -ni -e 'print unless /^\s*phone: z\.string\(\)/' src/features/donors/donor-schema.ts
perl -ni -e 'print unless /^\s*phone: defaultValues\?\.phone/' src/features/donors/donor-form.tsx
perl -0pi -e 's{\n\s*<div className="space-y-2">\n\s*<Label htmlFor="phone">.*?</div>\n}{\n}s' src/features/donors/donor-form.tsx
perl -ni -e 'print unless /"phone(Optional)?"\s*:/' src/locales/es.json
perl -ni -e 'print unless /^\s*phone: (data|donor)\.phone/' src/features/donors/donor-create-page.tsx src/features/donors/donor-edit-page.tsx

# The field must actually be gone before the agent starts.
! grep -q phone src/features/donors/donor-schema.ts
! grep -q phone src/features/donors/donor-form.tsx
! grep -q '"phone' src/locales/es.json
```

## Prompt

```
Add an optional "phone" field to the donor form, wired end to end.
```

## Assertions

```bash
# Schema is the source of truth for the field.
grep -q "phone" src/features/donors/donor-schema.ts

# Wired end to end: the create page sends the field to the API.
grep -q "phone" src/features/donors/donor-create-page.tsx

# The label went through i18n, not into the JSX.
grep -q "phone" src/locales/es.json
! grep -nE '>[^<>{}]*[áéíóúñ¿¡][^<>{}]*<' src/features/donors/donor-form.tsx

# The existing suite still passes.
./node_modules/.bin/vitest related --run src/features/donors/donor-form.tsx
```
