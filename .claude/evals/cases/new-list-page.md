# Build a new list page from the shared pieces

Every existing list page already reuses the shared table stack, so the only way to test
reuse is a new one. Checks the agent reaches for `use-sort`, `use-page-param`,
`SortableTh`, `EmptyState` and the error helpers instead of reimplementing them.

## Prompt

```
Add a list page for expense categories at /settings/categories, following how the donors
list page works.
```

## Assertions

```bash
page=$(git status --porcelain --untracked-files=all | awk '{print $2}' | grep -E 'categor.*-page\.tsx$' | head -1)
[ -n "$page" ]

grep -q "use-sort" "$page"
grep -q "sortable-th" "$page"
grep -q "use-page-param" "$page"
grep -q "get-problem-message\|EmptyState" "$page"

# Reused, not reinvented.
! grep -qE "useState<.*(sort|Sort|page|Page)" "$page"
# Labels went to i18n.
! grep -nE '>[^<>{}]*[áéíóúñ¿¡][^<>{}]*<' "$page"

# The route was registered.
grep -q "categor" src/app-routes.tsx

pnpm run typecheck
```
