# Claude Code Arcane — Master Configuration

Organización de skills, agentes y hooks para Claude Code. 5 stacks: general, software, gamedev, design, agile.

## Stack del Proyecto

- **Engine/Framework:** [A definir por proyecto — ver `.claude/docs/stack-registry.md`]
- **Version Control:** Git con trunk-based development
- **CI/CD:** [A definir por proyecto]
- **Lenguaje de comunicación:** Español
- **Lenguaje de código/commits:** Inglés (convención internacional)

## Divisiones Activas

@.claude/docs/division-structure.md

## Jerarquía de Agentes

@.claude/docs/agent-hierarchy.md

## Estructura del Proyecto

@.claude/docs/directory-structure.md

## Protocolo de Colaboración

**Colaboración dirigida por usuario, NO ejecución autónoma.**

Todo trabajo sigue el ciclo: **Question → Options → Decision → Draft → Approval**

- Los agentes DEBEN preguntar "¿Puedo escribir esto en [filepath]?" antes de usar Write/Edit
- Los agentes DEBEN mostrar drafts o summaries antes de pedir aprobación
- Cambios multi-archivo requieren aprobación explícita del changeset completo
- No hay commits sin instrucción del usuario

Ver `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` para el protocolo completo.

> **¿Primera sesión?** Corre `/start` para el onboarding guiado.

## Estándares de Código

@.claude/docs/coding-standards.md

## Preferencias Técnicas

@.claude/docs/technical-preferences.md

## Reglas de Coordinación

@.claude/docs/coordination-rules.md

## Gestión de Contexto

@.claude/docs/context-management.md

## Convenciones Globales

### Comunicación
- Todas las respuestas en español (a menos que el código requiera inglés)
- Commits en inglés siguiendo conventional commits
- Documentación técnica en español, referencias de código en inglés

### Atomicidad
- Preferir commits atómicos con formato conventional commit
- Correr tests antes de commitear cuando exista test suite
- Usar agents en paralelo cuando las tareas sean independientes
- Código simple — evitar over-engineering

### Seguridad
- NUNCA commitear `.env`, credenciales, API keys
- NUNCA hacer `git push --force` sin autorización explícita
- NUNCA usar `rm -rf`, `git reset --hard`, `git clean -f` sin confirmación
- Secrets SIEMPRE via variables de entorno o secret managers

## Contactos & Referencias

- **Proyectos Educabot activos:** Project_T, Scholar Duel, VR Game, Alizia-BE, Tich, TUNI, Vigía
- **ClickUp spaces:** Project_T (90138713959), VR Game (901313710103), Scholar Duel (901313710122)
- **Jira projects:** ALZ (Alizia), TICH, TUNI, VIA (Vigía)
