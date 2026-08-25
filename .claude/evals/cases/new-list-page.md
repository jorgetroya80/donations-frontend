# Build a list page from the shared pieces

Every list page in the repo already reuses the shared table stack, so the only way to test
reuse is to take one away. The setup deletes the users list page — the route in
`app-routes.tsx` still lazy-imports it, so `typecheck` only goes green once the page is
back with the same export.

Checks the agent reaches for `use-sort`, `use-page-param`, `SortableTh` and `EmptyState`
instead of reimplementing them with local `useState`.

## Setup

```bash
rm src/features/users/users-page.tsx
rm src/features/users/users-page.test.tsx
```

## Prompt

```
src/features/users/users-page.tsx is missing, but /users still routes to it. Rebuild the
page, following how the donors list page works.
```

## Assertions

```bash
page=src/features/users/users-page.tsx
[ -f "$page" ]

grep -q "use-sort" "$page"
grep -q "sortable-th" "$page"
grep -q "use-page-param" "$page"
grep -q "get-problem-message\|EmptyState" "$page"

# Reused, not reinvented.
! grep -qE "useState<.*(sort|Sort|page|Page)" "$page"
# Labels went to i18n.
! grep -nE '>[^<>{}]*[áéíóúñ¿¡][^<>{}]*<' "$page"

./node_modules/.bin/tsc --build --force
```
