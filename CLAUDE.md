# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Code Arcane

Repo de configuración: skills, agentes, hooks y rules para Claude Code. Instalable via `npx claude-code-arcane install <profile>`.

Casi todo el repo es **contenido** (Markdown + Bash + Python) que se copia al `.claude/` del proyecto del usuario. `src/` es el instalador TypeScript que decide qué copiar — es el único código con build y typecheck.

## Comandos

```bash
npm run build                     # tsup src/cli.ts -> dist/cli.js
npm test                          # vitest, solo src/__tests__/**
npx vitest run src/__tests__/installer.test.ts        # un archivo
npx vitest run -t "nombre del test"                   # un test
npx tsc --noEmit                  # typecheck (job aparte en CI)
npm run test:skills               # specs Python de scripts de skill (tests/)
python -m compileall -q skills    # gate de sintaxis sobre todo script shippeado
for f in hooks/*.sh skills/*/hooks/*.sh; do bash -n "$f"; done   # lint de hooks
```

Probar el CLI a mano **siempre aislado**:

```bash
ARCANE_SOURCE=bundled ARCANE_HOME=/tmp/arcane-test node dist/cli.js install backend-ts --target /tmp/proj --dry-run
```

`ARCANE_SOURCE=bundled` usa el working tree en vez de bajar contenido de GitHub. `ARCANE_HOME` desvía `~/.arcane`: ahí vive el **registry** (`installations.json`) y `arcane update` sin `--here` reescribe **todas** las instalaciones registradas de la máquina. Sin aislar, un test o una prueba manual despliega el working tree sobre repos reales. `vitest.config.ts` ya fija ambas para la suite — no lo saques.

## Arquitectura

**Content source** (`content-source.ts`, `cache.ts`): el contenido no sale necesariamente del working tree. `resolveContentSource()` elige entre `bundled` (paquete npm local), `github` (tarball de la rama main, cacheado en `~/.arcane/cache/<version>`) y `cache`, en ese orden de fallback. `remove` y `update` usan `resolveContentSourceForVersion()` para leer las definiciones de la **versión instalada**: si un profile creció desde entonces, resolver "auto" borraría el set equivocado.

**Profiles** (`profiles/*.yaml` → `profiles.ts`): declarativos, todos iguales (no hay base/addon), se combinan con `+`, `core.yaml` siempre se carga primero. `mergeProfiles()` deduplica skills, rules, agentes y permisos. **Nada se instala si no está listado en algún profile.**

**Installer** (`installer.ts`): copia `skills/ rules/ agents/ docs/ hooks/ output-styles/` al `.claude/` del target (previo backup a `.claude.bak/`), genera `settings.json` (permisos + hooks + statusline) y `arcane-manifest.json` con los `content_hashes` de lo instalado.

**Update** (`commands/update.ts`): comparación a tres bandas — hash del manifest vs. archivo en disco vs. fuente — que decide `update` / `skip-unchanged` / `skip-customized` (editaste vos, no se toca salvo `--force`) / `conflict` (divergieron los dos: backup y aplica) / `add` / `remove` (va a `.claude/.arcane-trash/`, nunca `rm`) / `keep-foreign`. Borrar es la única decisión que necesita el manifest: "no está en el source" significa *desactualizado*, no *ajeno*. Lo que el installer escribe pero `computeSourceHashes()` no modela — `_templates`, agentes de entradas granulares, `statusline.sh`, output styles — se refresca en `syncUnhashedFiles()`, no por el plan hasheado.

**Worktrees** (`worktree.ts`): `hooks/` y `docs/` se comparten por symlink desde el worktree principal; `skills/ agents/ rules/` se copian para que puedan divergir por rama.

**Agentes** (`agent-entries.ts`): una entrada `agents:` de un profile nombra una división entera (`game`, 30 agentes) o uno solo (`game/qa-lead`). La forma granular existe para no arrastrar 30 agentes por querer uno.

## Invariantes que hacen fallar los tests

Estos son los que cuesta descubrir a mano — todos viven en `src/__tests__/`:

- **`doc-counts.test.ts`**: agregar o borrar un skill, agente, rule o hook rompe los conteos escritos en `README.md` (headline + árbol), `docs/USER-GUIDE.md`, `docs/agent-hierarchy.md`, `docs/directory-structure.md` (total **y** por división) y `docs/SKILLS-CATALOG.md` (intro, cobertura declarada y cada header `## X (N skills)`). Se arregla el doc, no el test.
- **`agents-integrity.test.ts`**: el frontmatter solo puede declarar campos que Claude Code realmente lee; `agent:` exige `context: fork`, que el agente exista y que sea alcanzable desde todo profile que shippea ese skill; los `skills:` y las delegaciones de cada agente tienen que resolver a archivos en disco. El allowlist `KNOWN_DEAD_REFS` **solo se achica**: una referencia muerta nueva es un test que falla, no una línea más.
- **`agent-specs.test.ts`**: los specs de `skills-selftest/` tienen que coincidir con el model tier y la división del agente, y la cobertura no puede bajar.
- **`tests/repo/test_python_floor.py`**: el piso de Python es 3.9, así que un script de skill con anotaciones `X | Y` necesita `from __future__ import annotations` (compila en 3.9 pero explota al importar).

## Agregar contenido

| Qué | Dónde | Además |
|---|---|---|
| Skill | `skills/<name>/SKILL.md` | listarlo en el/los profile YAML, en `docs/SKILLS-CATALOG.md` y en `skills-selftest/catalog.yaml` |
| Agente | `agents/<division>/<name>.md` | `docs/agent-hierarchy.md` + `docs/directory-structure.md` |
| Rule | `rules/<name>.md` o `rules/gamedev/<name>.md` | `rules.universal` / `rules.gamedev` del profile |
| Hook | `hooks/<name>.sh` | `hooks:` del profile (normalmente `core.yaml`) |

## Stack

TypeScript (CLI installer) + Markdown (skills, agents, rules, docs) + Bash (hooks) + Python (skill scripts/helpers). QA: `skills-selftest/`. Skills: `skills/`. Profiles: `profiles/*.yaml`.

El lenguaje lo dicta el contexto de ejecución: **TS solo en `src/`** (tiene build y typecheck), **Bash en hooks**, **Python stdlib-only en `skills/*/scripts/`** (se copian al proyecto del usuario y corren sin build). Otro lenguaje solo si una dependencia obligatoria lo impone, justificado en el SKILL.md. Detalle y casos vigentes: `docs/coding-standards.md`.

## Reglas

- Espanol para comunicación, ingles para código/commits (conventional commits)
- Correr `/skill-test` antes de commitear cambios a skills
- Ciclo colaborativo: Question → Options → Decision → Draft → Approval
- Release: `semantic-release` en cada push a main. El tipo del commit determina la versión — no editar `version` de `package.json` ni `CHANGELOG.md` a mano.
- Catalogo completo: `docs/SKILLS-CATALOG.md`

## Referencias

- **Proyectos Educabot:** Project_T, Scholar Duel, VR Game, Alizia-BE, Tich, TUNI, Vigia
- **ClickUp:** Project_T (90138713959), VR Game (901313710103), Scholar Duel (901313710122)
- **Jira:** ALZ (Alizia), TICH, TUNI, VIA (Vigia)
