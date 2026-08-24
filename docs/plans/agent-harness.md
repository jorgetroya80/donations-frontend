# Agent harness

Estado: **implementado** en `chore/agent-harness` (commits `1715bc0`, `16c754d`, `bc39e64`, `52a98a4`, `2d5f244`). Fase 3 pendiente de correr.

## Contexto

El repositorio tenía piezas sueltas de configuración para Claude Code (`.claude/skills/`, `.claude/agents/`, `launch.json`, `.mcp.json` con chrome-devtools), pero le faltaban las tres capas que convierten eso en un *harness*: contexto de proyecto, verificación automática y medición.

Punto de partida:

- **Contexto**: `CLAUDE.md` (92 líneas) era casi todo guía genérica anti-errores de LLM, ya cubierta por la skill `karpathy-guidelines`. No documentaba ninguna convención real del código. `docs/ARCHITECTURE.md` sí, pero el agente no sabía que existía.
- **Verificación**: ningún hook. El agente corría `biome`/`tsc`/`vitest` sólo si se acordaba. Las redes reales (husky, CI) llegan demasiado tarde para corregirle a mitad de tarea.
- **Medición**: ninguna forma de saber si tocar `CLAUDE.md` o el catálogo de skills mejora o empeora los resultados.

Fuera de alcance: tests e2e / Playwright.

## Qué se versiona y qué no

Decisión central, tomada después de descubrir que `.claude/` estaba entero en `.gitignore`:

**El harness no son las skills.** Se versiona lo que es regla del proyecto y cualquiera que clone necesita; queda personal lo que es preferencia del desarrollador.

| Versionado | Personal (ignorado) |
| --- | --- |
| `.claude/settings.json` (hooks, plugins, overrides) | `.claude/settings.local.json` |
| `.claude/hooks/*.sh` | `.claude/skills/` |
| `.claude/evals/cases/` | `.claude/agents/` |
| `.claude/launch.json` | `.claude/evals/results/` |
| `CLAUDE.md` | |

Las skills y subagentes locales no llevan conocimiento de este repo, así que versionarlos obligaría a todo el que clone a heredar un catálogo ajeno. Se desindexaron con `git rm --cached` (siguen en disco).

Si en el futuro se quieren sincronizar entre máquinas, la migración limpia es un **plugin privado** (repo aparte + marketplace, activado por proyecto desde `settings.local.json`). No hay que deshacer nada de lo hecho aquí. Alternativa descartada: `~/.claude/skills/`, porque `react-patterns`, `react-ui-patterns`, `tailwind-patterns` y `make-interfaces-feel-better` se cargarían también en proyectos que no son React 19 + Tailwind v4.

## Fase 0 — Higiene del catálogo de skills

El plugin [`agent-skills`](https://github.com/addyosmani/agent-skills) ya estaba instalado y activo: 24 skills de proceso, 4 subagentes (`code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`), 8 slash commands y un hook `SessionStart` que inyecta el meta-skill `using-agent-skills` en cada sesión (requiere `jq`). Se mantiene: cubre la capa de *proceso*.

Regla de corte aplicada — **el plugin gana en proceso genérico, lo local gana en conocimiento del stack**. Borradas por duplicar al plugin:

| Borrada | La cubre |
| --- | --- |
| `tdd` | `agent-skills:test-driven-development` |
| `prd-to-plan`, `to-issues`, `write-a-prd` | `agent-skills:spec-driven-development`, `planning-and-task-breakdown` |
| `react-best-practices` (240 KB, 5× el resto junto) | `agent-skills:performance-optimization`, `frontend-ui-engineering` |

Conservadas: `react-patterns`, `react-ui-patterns`, `tailwind-patterns`, `make-interfaces-feel-better` (saben de React 19 + Compiler + Tailwind v4 + base-ui), `docker-expert`, `grill-me`.

Con el borrado desaparece la cadena local PRD → plan → issues. Los ~24 `docs/PRD-*.md` existentes quedan como historial; los nuevos salen del flujo del plugin.

En `settings.json`, `skillOverrides: "name-only"` para lo que no aplica a un SPA frontend: `observability-and-instrumentation`, `deprecation-and-migration`, `api-and-interface-design`.

> Sin verificar: las claves se escribieron prefijadas (`agent-skills:observability-and-instrumentation`), mientras que el precedente local usa el nombre pelado (`docker-expert`). Si el prefijo no es el formato correcto, esos tres overrides se ignoran en silencio.

## Fase 0b — Caveman en el harness

El plugin `caveman` (7 skills, 3 subagentes `cavecrew-*`, 5 slash commands) es una capa de compresión de tokens, ortogonal al resto.

- **Delegación** — documentada en `CLAUDE.md`: `cavecrew-investigator` para localizar código (sustituye a `Explore`), `cavecrew-reviewer` para diffs pequeños, `code-reviewer` del plugin para revisión profunda pre-merge. Su salida comprimida ocupa mucho menos contexto en el hilo principal.
- **Commits** — `/caveman-commit` es la forma estándar de escribir mensajes en este repo. Emite Conventional Commits, así que el job `validate-title` de `ci.yml` y release-please siguen funcionando sin tocar nada. Riesgo a vigilar: un sujeto demasiado comprimido degrada el `CHANGELOG.md`, que sí leen humanos — el sujeto debe leerse solo, sin el diff delante.
- **Compresión de `CLAUDE.md`** — hecha. El backup **no** queda en el repo: `caveman-compress` lo escribe en `~/.local/share/caveman-compress/backups/donations-frontend/CLAUDE.original.md`, a propósito, para que ningún auto-loader lo reingiera.
- **`/caveman-init`** — escribe la regla de activación para otros agentes IDE (Cursor, Windsurf, Cline, `AGENTS.md`). Sólo tiene sentido si se usan esos IDEs; correr con `--dry-run` primero. No ejecutado.

Límite: caveman comprime conversación y mensajes de commit. PRs, issues, docs y código siguen en prosa normal.

## Fase 1 — Capa de contexto

`CLAUDE.md` se carga en cada turno, así que es presupuesto fijo: debe enrutar, no explicar. Reescrito a 47 líneas con:

- Comandos (corregida la errata `test:coveragee`).
- Convenciones duras que antes no estaban en ningún sitio que el agente leyera: slices por feature, kebab-case, datos de servidor **sólo** vía el cliente generado con `client` + `throwOnError` + `signal`, reutilizar `parse-api-field-errors.ts` y `get-problem-message.ts`, i18n en `es.json` sin literales en JSX, HTML + Tailwind plano sin wrappers nuevos de base-ui (prop `render`, no `asChild`), React Compiler sin memoización manual, tests con `src/test/test-utils.tsx` + `msw-handlers.ts`.
- Punteros a `docs/ARCHITECTURE.md` y a la skill `karpathy-guidelines`, que reemplaza las 40 líneas de guía genérica que había.
- Workflow: nunca commitear a `main`, commits vía `/caveman-commit`, política de delegación.

## Fase 2 — Capa de verificación (hooks)

`.claude/settings.json` versionado + tres scripts en `.claude/hooks/`. Son la diferencia entre "el agente debería verificar" y "el agente no puede no verificar".

| Hook | Script | Qué hace |
| --- | --- | --- |
| `PostToolUse` (`Edit\|Write`) | `format-file.sh` | `biome check --write` sobre el archivo tocado, si es `src/**/*.{ts,tsx}`. Milisegundos. Cierra además el hueco de que lint-staged usa `biome lint`, sin organizar imports. Siempre sale 0 |
| `Stop` | `verify.sh` | Si hay cambios en `src/`: `pnpm run typecheck` + `vitest related` sobre lo cambiado. Al fallar imprime en stderr y **sale con código 2**, devolviendo el error al agente en vez de terminar el turno |
| `UserPromptSubmit` | `context.sh` | Inyecta rama + `git status --short`. Evita el "commitea en main", que hoy sólo bloquea `pre-push` |

Detalles de implementación que costaron:

- Anti-bucle en `Stop`: se usa el flag `stop_hook_active` del payload, no un fichero centinela.
- macOS trae bash 3.2: **no hay `mapfile`**. La lista de archivos cambiados va como string separado por saltos de línea.

## Fase 3 — Capa de medición (evals)

Sin esto, las fases anteriores son opinión. Runner mínimo, no framework.

`scripts/run-evals.sh`: por cada caso crea un `git worktree` desechable, enlaza `node_modules` del repo (evita un `pnpm install` por caso), corre el bloque `## Setup` si existe, lanza `claude -p` con `--output-format json`, ejecuta las aserciones y registra pass/fail + coste + turnos en `.claude/evals/results/<label>-<fecha>.json`. Los worktrees de casos fallidos se conservan para inspección.

Permisos: por defecto `--permission-mode acceptEdits`, que deja editar pero no ejecutar shell. Los casos que necesiten que el agente corra los tests requieren `EVAL_PERMISSION_MODE=bypassPermissions` — desactiva toda comprobación de permisos durante esa ejecución, dentro del worktree desechable. Es una decisión consciente, no el default.

Cuatro casos en `.claude/evals/cases/`:

| Caso | Qué mide |
| --- | --- |
| `donor-phone-field` | i18n en `es.json` y Zod schema, en vez de un literal español en el JSX |
| `query-hook-conventions` | Cliente generado con `client` + `throwOnError` + `signal`, no `fetch` crudo |
| `fix-seeded-bug` | Arregla el bug sembrado en `permissions.ts` sin vaciar el test que lo detecta |
| `new-list-page` | Reutiliza `use-sort`, `use-page-param`, `SortableTh`, helpers de error |

> El caso original "haz ordenable la tabla de gastos" resultó vacuo: **todas** las páginas de lista ya reutilizan `use-sort` y los helpers de error. Por eso el cuarto caso pide una página nueva — es la única forma de medir reutilización en un repo ya maduro.

## Puesta en marcha

El harness no se despliega: son archivos que el agente lee al arrancar. Tres cosas no obvias:

1. **Los hooks se leen al iniciar sesión.** Editar `settings.json` a mitad de sesión no activa nada. Ciclo real: editar → sesión nueva → probar.
2. **Permisos y dependencias.** `chmod +x .claude/hooks/*.sh` (un hook sin bit de ejecución falla en silencio) y `jq` en PATH. Probar cada script a mano antes de cablearlo:
   ```bash
   echo '{"tool_input":{"file_path":"src/lib/utils.ts"}}' | bash .claude/hooks/format-file.sh; echo "exit=$?"
   ```
   Un hook `Stop` con un bug puede bloquear el fin de turno; se depura antes de activarlo.
3. **Los plugins no viajan en el repo.** `enabledPlugins` sólo funciona si la máquina ya conoce el marketplace; añadirlo requiere un terminal `claude` interactivo (`/plugin marketplace add …`). Documentado en el `README.md` bajo "Working with AI Agents".

### Pruebas de humo (requieren sesión nueva)

| Prueba | Acción | Esperado |
| --- | --- | --- |
| Formato | pedir una edición con formato sucio a propósito | el archivo queda formateado sin pedirlo |
| Tipos | romper un tipo a propósito | al cerrar turno el agente recibe el error de `tsc` y lo corrige |
| Delegación | "¿dónde se define `useDonors`?" | va a `cavecrew-investigator`, vuelve `file:line` |

Si las tres pasan, el harness está en marcha. Los evals sirven para lo siguiente: decidir si además **mejora** algo.

### Salida de emergencia

Los hooks ejecutan shell en cada edición. Tres niveles, de menos a más drástico:

1. Comentar la entrada del hook en `.claude/settings.json` y reiniciar sesión.
2. `git revert` del commit correspondiente — todo vive en archivos versionados, no hay estado externo.
3. Renombrar `.claude/settings.json`; `settings.local.json` sigue funcionando aparte.

Por eso cada fase se commiteó por separado.

## Estado

| Paso | Estado |
| --- | --- |
| Higiene del catálogo de skills | hecho |
| Reparto versionado / personal | hecho |
| `CLAUDE.md` reescrito y comprimido | hecho |
| Hooks `PostToolUse`, `Stop`, `UserPromptSubmit` | hechos, probados aislados con stdin sintético |
| `verify.sh` devuelve error real al agente | verificado (tipo roto → `exit=2` con salida de `tsc`) |
| Plumbing de evals (worktree + setup + asserts) | verificado sin agente |
| Pruebas de humo en sesión nueva | hechas, las cuatro pasaron |
| `EVAL_LABEL=baseline bash scripts/run-evals.sh` | hecho, 4/4 (ver abajo) |
| Corrida de control sin harness | pendiente (es lo que falta para poder comparar) |
| `/caveman-init --dry-run` | pendiente, sólo si se usan otros IDEs |

## Baseline de evals

Los cuatro casos pasan. La corrida completa cuesta unos 2,50 USD y unos 10 minutos, que es
el precio recurrente de cada cambio a `CLAUDE.md` o a los hooks.

| Caso | Coste | Turnos |
| --- | --- | --- |
| `fix-seeded-bug` | 0,30 USD | 6 |
| `query-hook-conventions` | 0,52 USD | 12 |
| `new-list-page` | 0,75 USD | 18 |
| `donor-phone-field` | 0,90 USD | 30 |

**El número aún no significa nada por sí solo.** Falta la corrida de control, sin hooks y
sin `CLAUDE.md`: 4/4 con el harness puesto sólo se puede leer comparado contra 4/4 sin él.

Llegar a una medición fiable exigió tres arreglos, incluidos en esta rama:

- Los hooks llamaban a `pnpm exec`, que aborta dentro de los worktrees de eval, así que
  `verify.sh` le devolvía al agente un error de pnpm en vez de la salida real de `tsc`.
  Ahora llaman a `./node_modules/.bin/*` directamente; no volver a "ordenarlo" a `pnpm`.
- Los worktrees enlazaban por symlink el `node_modules` del repo anfitrión. Un agente que
  ejecutara pnpm dentro de un worktree lo reescribía y dejaba la copia de trabajo real
  apuntando a un almacén temporal que la propia corrida borraba después. Cada caso recibe
  ahora su propio clon APFS.
- Tres de los cuatro casos no medían nada: dos pedían categorías de gasto, que son un enum
  de Zod local sin endpoint, y el tercero afirmaba un campo que el formulario de donante ya
  tenía. Cada caso borra ahora en su `## Setup` aquello que pide.

De paso quedó claro que un agente en `--permission-mode acceptEdits` sí ejecuta comandos de
shell: así fue como se corrompió el `node_modules`.

## Deuda detectada, no tocada

`.gitignore:31` tiene un salto de línea perdido (`.eslintcache# See https://…`), así que `.eslintcache` no está realmente ignorado. Preexistente y ajeno a este trabajo.
