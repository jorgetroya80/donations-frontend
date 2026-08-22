# Write a new React Query hook

Checks that server data goes through the generated API client with the shared `client`,
`throwOnError` and `signal` — not a raw `fetch`.

## Prompt

```
Create a useExpenseCategories hook in src/features/expenses/ that lists expense categories.
```

## Assertions

```bash
file=src/features/expenses/use-expense-categories.ts
[ -f "$file" ]

grep -q "from '@/lib/api'" "$file"
grep -q "throwOnError" "$file"
grep -q "signal" "$file"

# No hand-rolled HTTP in a feature.
! grep -qE '\bfetch\(|from .ky.' "$file"

pnpm exec tsc --noEmit -p tsconfig.app.json
```
