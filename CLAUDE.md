# Claude Code Arcane — Master Configuration

Repositorio de configuracion: skills, agentes, hooks y rules para Claude Code. No es un proyecto de software/juego — es el harness que los proyectos consumidores importan.

## Que es este repo

Arcane organiza 149 skills, 119 agentes, hooks de validacion, y path-scoped rules en 5 divisiones (general, software, gamedev, design, agile). Los proyectos Educabot lo consumen copiando o linkeando `.claude/` a su propio repo.

## Stack de este repo

- **Contenido:** Markdown (skills, agents, rules, docs, templates)
- **Scripts:** Bash (hooks, tools de migracion)
- **Version Control:** Git con trunk-based development
- **QA:** `skills-selftest/` — framework propio para validar skills y agentes
- **Lenguaje de comunicacion:** Espanol
- **Lenguaje de commits:** Ingles (conventional commits)

## Skills relevantes para desarrollar ESTE repo

| Skill | Para que |
|-------|----------|
| `/skill-test` | Validar skills (estructura + comportamiento) |
| `/skill-improve` | Mejorar un skill con loop test-fix-retest |
| `/check` | Audit rapido de calidad |
| `/commit` | Commit con conventional format |
| `/create-pr` | PR desde branch actual |
| `/code-review` | Revisar cambios |
| `/help` | Orientacion cuando estas trabado |
| `/start` | Onboarding guiado |
| `/changelog` | Generar changelog entre versiones |

> El catalogo completo de skills (149) esta en `docs/SKILLS-CATALOG.md` — esos son para proyectos consumidores.

## Estructura del Proyecto

Ver `.claude/docs/directory-structure.md`

## Protocolo de Colaboracion

**Colaboracion dirigida por usuario, NO ejecucion autonoma.**

Ciclo: **Question -> Options -> Decision -> Draft -> Approval**

- Los agentes DEBEN preguntar "Puedo escribir esto en [filepath]?" antes de usar Write/Edit
- Los agentes DEBEN mostrar drafts o summaries antes de pedir aprobacion
- Cambios multi-archivo requieren aprobacion explicita del changeset completo
- No hay commits sin instruccion del usuario

## Convenciones

### Comunicacion
- Respuestas en espanol (codigo en ingles)
- Commits en ingles con conventional commits
- Documentacion tecnica en espanol, referencias de codigo en ingles

### Atomicidad
- Commits atomicos con formato conventional commit
- Correr `skill-test` antes de commitear cambios a skills
- Usar agents en paralelo cuando las tareas sean independientes
- Codigo simple — evitar over-engineering

### Seguridad
- NUNCA commitear `.env`, credenciales, API keys
- NUNCA hacer `git push --force` sin autorizacion explicita
- NUNCA usar `rm -rf`, `git reset --hard`, `git clean -f` sin confirmacion

## Contactos & Referencias

- **Proyectos Educabot activos:** Project_T, Scholar Duel, VR Game, Alizia-BE, Tich, TUNI, Vigia
- **ClickUp spaces:** Project_T (90138713959), VR Game (901313710103), Scholar Duel (901313710122)
- **Jira projects:** ALZ (Alizia), TICH, TUNI, VIA (Vigia)
- **Catalogo completo de skills:** `docs/SKILLS-CATALOG.md`
