# Claude Code Arcane

Repo de configuración: skills, agentes, hooks y rules para Claude Code. Instalable via `npx arcane install <profile>`.

## Stack

TypeScript (CLI installer) + Markdown (skills, agents, rules, docs) + Bash (hooks) + Python (skill scripts/helpers). QA: `skills-selftest/`. Skills: `skills/`. Profiles: `profiles/*.yaml`.

El lenguaje lo dicta el contexto de ejecución: **TS solo en `src/`** (tiene build y typecheck), **Bash en hooks**, **Python stdlib-only en `skills/*/scripts/`** (se copian al proyecto del usuario y corren sin build). Otro lenguaje solo si una dependencia obligatoria lo impone, justificado en el SKILL.md. Detalle y casos vigentes: `docs/coding-standards.md`.

## Reglas

- Espanol para comunicación, ingles para código/commits (conventional commits)
- Correr `/skill-test` antes de commitear cambios a skills
- Ciclo colaborativo: Question → Options → Decision → Draft → Approval
- Catalogo completo: `docs/SKILLS-CATALOG.md`

## Referencias

- **Proyectos Educabot:** Project_T, Scholar Duel, VR Game, Alizia-BE, Tich, TUNI, Vigia
- **ClickUp:** Project_T (90138713959), VR Game (901313710103), Scholar Duel (901313710122)
- **Jira:** ALZ (Alizia), TICH, TUNI, VIA (Vigia)
