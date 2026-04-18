# Claude Code Arcane

Repo de configuración: skills, agentes, hooks y rules para Claude Code. No es software — es el harness que proyectos Educabot importan copiando `.claude/`.

## Stack

Markdown (skills, agents, rules, docs) + Bash (hooks, migration tools). QA: `skills-selftest/`. Estructura: `.claude/docs/directory-structure.md`

## Reglas

- Espanol para comunicación, ingles para código/commits (conventional commits)
- Correr `/skill-test` antes de commitear cambios a skills
- Ciclo colaborativo: Question → Options → Decision → Draft → Approval
- Catalogo completo: `docs/SKILLS-CATALOG.md`

## Referencias

- **Proyectos Educabot:** Project_T, Scholar Duel, VR Game, Alizia-BE, Tich, TUNI, Vigia
- **ClickUp:** Project_T (90138713959), VR Game (901313710103), Scholar Duel (901313710122)
- **Jira:** ALZ (Alizia), TICH, TUNI, VIA (Vigia)
