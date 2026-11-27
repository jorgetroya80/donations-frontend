# Write a new React Query hook

Checks that server data goes through the generated API client with the shared `client`,
`throwOnError` and `signal` — not a raw `fetch`.

The setup deletes the balance hook that `financial-overview.tsx` depends on, so the agent
has to write it from scratch against the call site and the reference pattern in
`src/features/donors/use-donors.ts`. `tsc` is the real gate: it only passes if the
recreated export shape matches the consumer.

## Setup

```bash
rm src/features/dashboard/use-dashboard-data.ts
rm src/features/dashboard/use-dashboard-data.test.tsx
```

## Prompt

```
src/features/dashboard/financial-overview.tsx imports useBalance from
./use-dashboard-data, but that file is missing. Write it.
```

## Assertions

```bash
file=src/features/dashboard/use-dashboard-data.ts
[ -f "$file" ]

grep -q "from '@/lib/api'" "$file"
grep -q "throwOnError" "$file"
grep -q "signal" "$file"
grep -q "balance" "$file"

# No hand-rolled HTTP in a feature.
! grep -qE '\bfetch\(|from .ky.' "$file"

./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
```
