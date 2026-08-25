# Agent harness

Estado: **implementado** en `chore/agent-harness` (commits `1715bc0`, `16c754d`, `bc39e64`, `52a98a4`, `2d5f244`). Fase 3 pendiente de correr.

## Contexto

El repositorio tenía piezas sueltas de configuración para Claude Code (`.claude/skills/`, `.claude/agents/`, `launch.json`, `.mcp.json` con chrome-devtools), pero le faltaban las tres capas que convierten eso en un _harness_: contexto de proyecto, verificación automática y medición.

Punto de partida:

- **Contexto**: `CLAUDE.md` (92 líneas) era casi todo guía genérica anti-errores de LLM, ya cubierta por la skill `karpathy-guidelines`. No documentaba ninguna convención real del código. `docs/ARCHITECTURE.md` sí, pero el agente no sabía que existía.
- **Verificación**: ningún hook. El agente corría `biome`/`tsc`/`vitest` sólo si se acordaba. Las redes reales (husky, CI) llegan demasiado tarde para corregirle a mitad de tarea.
- **Medición**: ninguna forma de saber si tocar `CLAUDE.md` o el catálogo de skills mejora o empeora los resultados.

Fuera de alcance: tests e2e / Playwright.

## Qué se versiona y qué no

Decisión central, tomada después de descubrir que `.claude/` estaba entero en `.gitignore`:

**El harness no son las skills.** Se versiona lo que es regla del proyecto y cualquiera que clone necesita; queda personal lo que es preferencia del desarrollador.

| Versionado                                          | Personal (ignorado)           |
| --------------------------------------------------- | ----------------------------- |
| `.claude/settings.json` (hooks, plugins, overrides) | `.claude/settings.local.json` |
| `.claude/hooks/*.sh`                                | `.claude/skills/`             |
| `.claude/evals/cases/`                              | `.claude/agents/`             |
| `.claude/launch.json`                               | `.claude/evals/results/`      |
| `CLAUDE.md`                                         |                               |

Las skills y subagentes locales no llevan conocimiento de este repo, así que versionarlos obligaría a todo el que clone a heredar un catálogo ajeno. Se desindexaron con `git rm --cached` (siguen en disco).

Si en el futuro se quieren sincronizar entre máquinas, la migración limpia es un **plugin privado** (repo aparte + marketplace, activado por proyecto desde `settings.local.json`). No hay que deshacer nada de lo hecho aquí. Alternativa descartada: `~/.claude/skills/`, porque `react-patterns`, `react-ui-patterns`, `tailwind-patterns` y `make-interfaces-feel-better` se cargarían también en proyectos que no son React 19 + Tailwind v4.

## Fase 0 — Higiene del catálogo de skills

El plugin [`agent-skills`](https://github.com/addyosmani/agent-skills) ya estaba instalado y activo: 24 skills de proceso, 4 subagentes (`code-reviewer`, `security-auditor`, `test-engineer`, `web-performance-auditor`), 8 slash commands y un hook `SessionStart` que inyecta el meta-skill `using-agent-skills` en cada sesión (requiere `jq`). Se mantiene: cubre la capa de _proceso_.

Regla de corte aplicada — **el plugin gana en proceso genérico, lo local gana en conocimiento del stack**. Borradas por duplicar al plugin:

| Borrada                                            | La cubre                                                              |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `tdd`                                              | `agent-skills:test-driven-development`                                |
| `prd-to-plan`, `to-issues`, `write-a-prd`          | `agent-skills:spec-driven-development`, `planning-and-task-breakdown` |
| `react-best-practices` (240 KB, 5× el resto junto) | `agent-skills:performance-optimization`, `frontend-ui-engineering`    |

Conservadas: `react-patterns`, `react-ui-patterns`, `tailwind-patterns`, `make-interfaces-feel-better` (saben de React 19 + Compiler + Tailwind v4 + base-ui), `docker-expert`, `grill-me`.

Con el borrado desaparece la cadena local PRD → plan → issues. Los ~24 `docs/PRD-*.md` existentes quedan como historial; los nuevos salen del flujo del plugin.

En `settings.json` se intentó `skillOverrides: "name-only"` para lo que no aplica a un SPA frontend: `observability-and-instrumentation`, `deprecation-and-migration`, `api-and-interface-design`.

> Retirado: el ajuste no alcanza a los skills que vienen de un plugin, con ninguna forma de clave. Detalle y pruebas más abajo.

## Fase 0b — Caveman en el harness

El plugin `caveman` se usa aquí para dos cosas, y sólo para esas dos:

- **La conversación con el agente.** Respuestas comprimidas; el código, los comandos y los mensajes de error salen exactos.
- **Los mensajes de commit**, vía `/caveman-commit`. Emite Conventional Commits, así que el job `validate-title` de `ci.yml` y release-please siguen funcionando sin tocar nada. Riesgo a vigilar: un sujeto demasiado comprimido degrada el `CHANGELOG.md`, que sí leen humanos — el sujeto debe leerse solo, sin el diff delante.

Todo lo demás va en prosa normal: documentación, PRDs, PRs, issues, código y comentarios los lee una persona, y el ahorro de tokens no compensa. `CLAUDE.md` es la excepción, comprimido con `caveman-compress` porque lo carga el agente en cada turno; el backup queda fuera del repo, en `~/.local/share/caveman-compress/backups/donations-frontend/CLAUDE.original.md`, para que ningún auto-loader lo reingiera.

Descartado el resto del plugin:

- **Delegación en los subagentes `cavecrew-*`** — corren en **Haiku**. El ahorro que prometen es de contexto en el hilo principal, pero lo pagan bajando el modelo que hace el trabajo: localizar código y revisar diffs pasa a un motor más débil que el que lleva la tarea. En un repo de este tamaño el contexto no es el cuello de botella —la corrida autónoma de una feature entera tocó techo en el 39 % de la ventana—, así que se cambia calidad por un recurso que sobra. Aparte, la regla no se cumplía: el agente buscaba a mano igual.
- **`/caveman-init`** — escribe la regla de activación para Cursor, Windsurf, Cline y `AGENTS.md`. Aquí no se usa ninguno de esos IDEs, así que no hay nada que inicializar.
- **`/caveman-review`** — devuelve la revisión en una línea por hallazgo. Las revisiones las lee una persona y acaban en comentarios de PR, que van en prosa; para eso ya está `code-reviewer`.

## Fase 1 — Capa de contexto

`CLAUDE.md` se carga en cada turno, así que es presupuesto fijo: debe enrutar, no explicar. Reescrito a 47 líneas con:

- Comandos (corregida la errata `test:coveragee`).
- Convenciones duras que antes no estaban en ningún sitio que el agente leyera: slices por feature, kebab-case, datos de servidor **sólo** vía el cliente generado con `client` + `throwOnError` + `signal`, reutilizar `parse-api-field-errors.ts` y `get-problem-message.ts`, i18n en `es.json` sin literales en JSX, HTML + Tailwind plano sin wrappers nuevos de base-ui (prop `render`, no `asChild`), React Compiler sin memoización manual, tests con `src/test/test-utils.tsx` + `msw-handlers.ts`.
- Punteros a `docs/ARCHITECTURE.md` y a la skill `karpathy-guidelines`, que reemplaza las 40 líneas de guía genérica que había.
- Workflow: nunca commitear a `main`, commits vía `/caveman-commit`, política de delegación.

## Fase 2 — Capa de verificación (hooks)

`.claude/settings.json` versionado + tres scripts en `.claude/hooks/`. Son la diferencia entre "el agente debería verificar" y "el agente no puede no verificar".

| Hook                          | Script           | Qué hace                                                                                                                                                                                             |
| ----------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PostToolUse` (`Edit\|Write`) | `format-file.sh` | `biome check --write` sobre el archivo tocado, si es `src/**/*.{ts,tsx}`. Milisegundos. Cierra además el hueco de que lint-staged usa `biome lint`, sin organizar imports. Siempre sale 0            |
| `Stop`                        | `verify.sh`      | Si hay cambios en `src/`: `pnpm run typecheck` + `vitest related` sobre lo cambiado. Al fallar imprime en stderr y **sale con código 2**, devolviendo el error al agente en vez de terminar el turno |
| `UserPromptSubmit`            | `context.sh`     | Inyecta rama + `git status --short`. Evita el "commitea en main", que hoy sólo bloquea `pre-push`                                                                                                    |

Detalles de implementación que costaron:

- Anti-bucle en `Stop`: se usa el flag `stop_hook_active` del payload, no un fichero centinela.
- macOS trae bash 3.2: **no hay `mapfile`**. La lista de archivos cambiados va como string separado por saltos de línea.

### Fase 2b — Presupuesto de contexto para corridas autónomas

Una corrida larga sin humano delante tiene un modo de fallo propio: la ventana se llena, la
sesión se compacta y el trabajo a medias se pierde o queda irreconocible. Dos hooks más:

| Hook           | Script              | Qué hace                                                                                                                        |
| -------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `PostToolUse`  | `context-budget.sh` | Lee el uso de tokens del transcript. Bajo 80% calla; 80-89% avisa; al 90% sale con **código 2** y ordena parar, commitear y entregar un traspaso |
| `PreCompact`   | `checkpoint.sh`     | Si la compactación llega igual, commitea el árbol entero antes de que ocurra. Red de seguridad, no historia                     |

Cómo se calcula el uso: la suma de `input_tokens` + ambas cachés + `output_tokens` del
último mensaje de asistente del transcript, contra `CONTEXT_WINDOW` (200 000 por defecto).
Ajustables `CONTEXT_WARN_PCT` y `CONTEXT_STOP_PCT`. Sólo se leen las últimas 400 líneas del
transcript: en sesiones largas el fichero pasa de los cientos de MB.

El corte al 90% dispara **una vez por sesión** (centinela en `.git/`). Sin eso, cada llamada
a herramienta posterior volvería a bloquear el turno y el agente no podría ni commitear.

`checkpoint.sh` no commitea en `main` — ahí prefiere perder el diff antes que ensuciar la
rama — ni cuando el árbol está limpio. El mensaje es genérico a propósito
(`chore(agent): checkpoint before context compaction`): se reescribe después con `rebase`.

Probados con stdin sintético: silencio al 52%, aviso al 89%, bloqueo con instrucciones al
102%, silencio en la segunda llamada de la misma sesión; y el checkpoint commiteando en rama,
saltándose el árbol limpio y negándose en `main`.

Queda por comprobar en vivo: si la auto-compactación del CLI se adelanta al corte del 90%.
Si pasa, la corrida autónoma va con `--autocompact` en un valor de tokens por debajo del
umbral, o desactivada.

## Fase 3 — Capa de medición (evals)

Sin esto, las fases anteriores son opinión. Runner mínimo, no framework.

`scripts/run-evals.sh`: por cada caso crea un `git worktree` desechable, enlaza `node_modules` del repo (evita un `pnpm install` por caso), corre el bloque `## Setup` si existe, lanza `claude -p` con `--output-format json`, ejecuta las aserciones y registra pass/fail + coste + turnos en `.claude/evals/results/<label>-<fecha>.json`. Los worktrees de casos fallidos se conservan para inspección.

Permisos: por defecto `--permission-mode acceptEdits`, que deja editar pero no ejecutar shell. Los casos que necesiten que el agente corra los tests requieren `EVAL_PERMISSION_MODE=bypassPermissions` — desactiva toda comprobación de permisos durante esa ejecución, dentro del worktree desechable. Es una decisión consciente, no el default.

Cuatro casos en `.claude/evals/cases/`:

| Caso                     | Qué mide                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| `donor-phone-field`      | i18n en `es.json` y Zod schema, en vez de un literal español en el JSX        |
| `query-hook-conventions` | Cliente generado con `client` + `throwOnError` + `signal`, no `fetch` crudo   |
| `fix-seeded-bug`         | Arregla el bug sembrado en `permissions.ts` sin vaciar el test que lo detecta |
| `new-list-page`          | Reutiliza `use-sort`, `use-page-param`, `SortableTh`, helpers de error        |

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

| Prueba  | Acción                                          | Esperado                                                        |
| ------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Formato | pedir una edición con formato sucio a propósito | el archivo queda formateado sin pedirlo                         |
| Tipos   | romper un tipo a propósito                      | al cerrar turno el agente recibe el error de `tsc` y lo corrige |

Había una tercera, de delegación en `cavecrew-investigator`; se cae con la regla que la motivaba.

Si las dos pasan, el harness está en marcha. Los evals sirven para lo siguiente: decidir si además **mejora** algo.

### Salida de emergencia

Los hooks ejecutan shell en cada edición. Tres niveles, de menos a más drástico:

1. Comentar la entrada del hook en `.claude/settings.json` y reiniciar sesión.
2. `git revert` del commit correspondiente — todo vive en archivos versionados, no hay estado externo.
3. Renombrar `.claude/settings.json`; `settings.local.json` sigue funcionando aparte.

Por eso cada fase se commiteó por separado.

## Estado

| Paso                                             | Estado                                                |
| ------------------------------------------------ | ----------------------------------------------------- |
| Higiene del catálogo de skills                   | hecho                                                 |
| Reparto versionado / personal                    | hecho                                                 |
| `CLAUDE.md` reescrito y comprimido               | hecho                                                 |
| Hooks `PostToolUse`, `Stop`, `UserPromptSubmit`  | hechos, probados aislados con stdin sintético         |
| `verify.sh` devuelve error real al agente        | verificado (tipo roto → `exit=2` con salida de `tsc`) |
| Plumbing de evals (worktree + setup + asserts)   | verificado sin agente                                 |
| Pruebas de humo en sesión nueva                  | hechas, las cuatro pasaron                            |
| `EVAL_LABEL=baseline bash scripts/run-evals.sh`  | hecho, 4/4 (ver abajo)                                |
| Corrida de control sin harness                   | hecha, 4/4 igual que con harness (ver abajo)          |
| `skillOverrides` para colapsar skills del plugin | no funciona; config retirada (ver abajo)              |
| `/caveman-init --dry-run`                        | descartado, no se usan otros IDEs                     |

## Baseline de evals

Los cuatro casos pasan. La corrida completa cuesta unos 2,50 USD y unos 10 minutos, que es
el precio recurrente de cada cambio a `CLAUDE.md` o a los hooks.

| Caso                     | Coste    | Turnos |
| ------------------------ | -------- | ------ |
| `fix-seeded-bug`         | 0,30 USD | 6      |
| `query-hook-conventions` | 0,52 USD | 12     |
| `new-list-page`          | 0,75 USD | 18     |
| `donor-phone-field`      | 0,90 USD | 30     |

## Corrida de control: el harness no cambia el resultado

`EVAL_NO_HARNESS=1` borra `CLAUDE.md` y `.claude/settings.json` dentro del worktree antes de
arrancar el agente, así que el caso corre sin contexto de proyecto y sin hooks. Las skills y
subagentes personales están en `.gitignore`, de modo que tampoco llegan al worktree.

```bash
EVAL_LABEL=control EVAL_NO_HARNESS=1 bash scripts/run-evals.sh
```

Corrida del 2026-08-24 sobre `383c486`:

| Caso                     | Con harness    | Sin harness    |
| ------------------------ | -------------- | -------------- |
| `fix-seeded-bug`         | pasa, 0,30 USD | pasa, 0,31 USD |
| `query-hook-conventions` | pasa, 0,52 USD | pasa, 0,58 USD |
| `new-list-page`          | pasa, 0,75 USD | pasa, 0,53 USD |
| `donor-phone-field`      | pasa, 0,90 USD | pasa, 0,96 USD |
| **Total**                | 4/4, 2,47 USD  | 4/4, 2,38 USD  |

**El harness no mejora ninguno de los cuatro casos.** El coste queda dentro del ruido, y sin
`CLAUDE.md` la corrida salió incluso algo más barata. Las aserciones sí comprueban
convenciones reales (`use-sort`, `sortable-th`, `throwOnError`, `signal`, i18n sin literales
en JSX), así que la lectura no es que midan de menos: es que el agente deduce esas
convenciones leyendo el código vecino, que ya las cumple. En un repo con precedentes
consistentes, escribir esas mismas reglas en `CLAUDE.md` es redundante.

Lo que esto **no** dice: nada sobre los hooks. `format-file.sh` y `verify.sh` corrigen y
bloquean cosas que las aserciones no miran (formato, tipos rotos a mitad de tarea), y su
efecto no aparece en un pass/fail final que el agente ya alcanzaba por su cuenta.

Para que la suite discrimine haría falta un caso sin precedente vecino que copiar — una
convención que sólo esté escrita en `CLAUDE.md` — o medir estado intermedio en vez del
resultado final.

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

## `skillOverrides` sólo aplica a skills que no vienen de plugin (config retirada)

`.claude/settings.json` llevaba tres entradas `skillOverrides` en `name-only` para colapsar
la descripción de skills del plugin `agent-skills`. No hacían nada, y se han quitado.

Se probaron seis combinaciones contra Claude Code 2.1.231, preguntando a una sesión
headless si el skill seguía apareciendo en su listado:

| Clave                                    | Ámbito               | Valor       | Resultado  |
| ---------------------------------------- | -------------------- | ----------- | ---------- |
| `agent-skills:<skill>`                   | settings de proyecto | `name-only` | sin efecto |
| `<skill>`                                | settings de proyecto | `name-only` | sin efecto |
| `agent-skills@addy-agent-skills:<skill>` | settings de proyecto | `name-only` | sin efecto |
| `agent-skills:<skill>`                   | `--settings`         | `off`       | sin efecto |
| `<skill>`                                | settings de usuario  | `off`       | sin efecto |
| `agent-skills@addy-agent-skills:<skill>` | settings de usuario  | `off`       | sin efecto |

Se usó `off` en la mitad de las pruebas porque es el efecto más visible: debería retirar el
skill del listado por completo. La sonda es fiable — con un nombre de skill inventado
responde correctamente que no está listado.

El changelog de 2.1.129 dice «`skillOverrides` setting now works», y la versión instalada es
posterior, así que no es cuestión de versión.

El control pendiente ya está hecho: con un skill que no viene de plugin el ajuste sí surte
efecto, y con el nombre a secas. Invocando el skill directamente (sonda más fiable que
preguntar por el listado, porque el CLI responde con un mensaje literal):

| Clave                                                     | Origen del skill             | Valor | Resultado                                                         |
| --------------------------------------------------------- | ---------------------------- | ----- | ----------------------------------------------------------------- |
| `docker-expert`                                           | personal (`.claude/skills/`) | `off` | bloqueado: «Skill "docker-expert" is disabled via skillOverrides» |
| `security-review`                                         | bundled del CLI              | `off` | bloqueado, mismo mensaje                                          |
| `api-and-interface-design`                                | plugin `agent-skills`        | `off` | el skill carga igual                                              |
| `agent-skills:api-and-interface-design`                   | plugin `agent-skills`        | `off` | el skill carga igual                                              |
| `addy-agent-skills:api-and-interface-design`              | plugin `agent-skills`        | `off` | el skill carga igual                                              |
| `agent-skills@addy-agent-skills:api-and-interface-design` | plugin `agent-skills`        | `off` | el skill carga igual                                              |
| `caveman:caveman-help`                                    | plugin `caveman`             | `off` | el skill carga igual                                              |

Conclusión: la clave correcta es el nombre a secas, sin prefijo de plugin, pero los skills
que vienen de un plugin no se pueden colapsar ni desactivar por esta vía en 2.1.231 —
ninguna forma de clave los alcanza. Para recortar el listado de un plugin, la única palanca
es desactivar el plugin entero.

## Deuda detectada, no tocada

`.gitignore:31` tiene un salto de línea perdido (`.eslintcache# See https://…`), así que `.eslintcache` no está realmente ignorado. Preexistente y ajeno a este trabajo.
