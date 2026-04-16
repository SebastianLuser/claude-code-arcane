# Claude Code Mega Studios

> **El repositorio de skills más completo para Claude Code.**
> 119 agentes especializados · 244 skills · 8 divisiones

Un sistema integral que transforma Claude Code en una organización completa con divisiones especializadas desde game development hasta integraciones con herramientas SaaS.

Construido sobre la arquitectura de [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) pero expandido a todo el ciclo de desarrollo de software, producto y operaciones.

---

## Tabla de Divisiones

| # | División | Agentes | Skills | Propósito |
|---|----------|---------|--------|-----------|
| 1 | 🎮 Game Development Studio | 49 | 72 | Desarrollo de videojuegos (Unity/Godot/Unreal) |
| 2 | 💻 Software Engineering | 20 | 60 | Backend, frontend, fullstack, APIs, DBs |
| 3 | ☁️ DevOps & Infrastructure | 11 | 18 | Cloud, K8s, CI/CD, IaC, monitoring |
| 4 | 🎨 Product & Design | 11 | 22 | Product management, UX/UI, research |
| 5 | 📋 Project Management Office | 8 | 18 | Sprints, stakeholders, delivery |
| 6 | 🛡️ Quality & Security | 7 | 14 | QA, testing, security, compliance |
| 7 | 🎓 Educabot | 7 | 10 | EdTech, curriculum, learning experience |
| 8 | 🔌 Tools & Integrations | 6 | 30 | ClickUp, Jira, Gdocs, Notion, Slack, Figma |
| **Total** | | **119** | **244** | |

---

## Arquitectura de 3 Tiers

Cada división sigue una jerarquía tipo estudio real:

**Tier 1 — Directors (Opus)** → Decisiones estratégicas, resolución de conflictos cross-disciplina
**Tier 2 — Leads (Sonnet)** → Owners de dominio, estándares, coordinación de specialists
**Tier 3 — Specialists (Sonnet/Haiku)** → Ejecución técnica especializada

---

## Quick Start

```bash
# 1. Clonar el repo
git clone <url> mi-proyecto
cd mi-proyecto

# 2. Abrir Claude Code
claude

# 3. Comenzar con el comando raíz
/start
```

El comando `/start` te guía por un onboarding adaptativo según:
- Qué tipo de proyecto estás haciendo (juego, app web, app móvil, herramienta interna)
- En qué etapa estás (idea, diseño, desarrollo, producción)
- Qué división te va a servir más

---

## Divisiones en Detalle

### 1. Game Development Studio
Replicado de Claude-Code-Game-Studios. Cubre todo el pipeline de game dev: brainstorm → GDD → prototipo → producción → release.

**Directores:** creative-director, technical-director, producer
**Leads:** game-designer, lead-programmer, art-director, audio-director, narrative-director, qa-lead, release-manager, localization-lead
**Especialistas:** 37 incluyendo engine-specialists para Unity, Godot y Unreal

### 2. Software Engineering
Desarrollo de software profesional: backend, frontend, mobile, databases, APIs.

**Directores:** chief-technology-officer, vp-engineering
**Leads:** backend-architect, frontend-architect, api-architect, database-architect, mobile-lead
**Especialistas:** go-engineer, node-engineer, python-engineer, react-engineer, vue-engineer, angular-engineer, flutter-engineer, react-native-engineer, sql-specialist, nosql-specialist, graphql-specialist, websocket-specialist, rust-engineer

### 3. DevOps & Infrastructure
Cloud, containers, CI/CD, observability, IaC.

**Leads:** cloud-architect, platform-lead, sre-lead
**Especialistas:** docker-specialist, kubernetes-specialist, ci-cd-specialist, terraform-specialist, aws-specialist, gcp-specialist, monitoring-specialist, security-ops-specialist

### 4. Product & Design
Product management, UX research, UI design, design systems.

**Directores:** chief-product-officer
**Leads:** product-manager, ux-lead, ui-lead, design-system-lead
**Especialistas:** ux-researcher, ui-designer, ux-writer, interaction-designer, accessibility-expert, data-analyst, market-researcher

### 5. Project Management Office
Multi-project coordination, agile, delivery, stakeholder management.

**Directores:** program-director
**Leads:** project-manager, scrum-master, delivery-manager
**Especialistas:** agile-coach, business-analyst, technical-writer, stakeholder-manager

### 6. Quality & Security
Testing strategy, automation, security, compliance.

**Leads:** qa-director, security-architect
**Especialistas:** test-automation-engineer, performance-tester, manual-qa-tester, penetration-tester, compliance-specialist

### 7. Educabot
Especializada en la vertical educativa de Educabot.

**Leads:** edtech-architect, curriculum-director
**Especialistas:** learning-experience-designer, content-developer, robotics-specialist, ai-tutor-designer, assessment-designer

### 8. Tools & Integrations
Orquestación de herramientas SaaS del día a día.

**Arquitecto:** integrations-architect
**Especialistas:** project-tools-specialist (ClickUp/Jira/Linear), docs-tools-specialist (Gdocs/Sheets/Coda/Notion), design-tools-specialist (Figma/Miro), comms-tools-specialist (Slack/Discord), api-tools-specialist (Postman/Bruno)

---

## Skills Destacadas

### Onboarding & Workflow
- `/start` — Onboarding adaptativo
- `/help` — Guía contextual
- `/next` — ¿Qué hago ahora?
- `/status` — Estado global del proyecto

### Cross-Tool Workflows (Division 8 ⭐)
- `/sync-all` — Sincronizar ClickUp + Jira + GitHub
- `/standup-report` — Daily automático desde múltiples fuentes
- `/release-announce` — Changelog → Slack + Discord + Email
- `/design-handoff` — Figma → Spec + Component code
- `/meeting-to-tasks` — Notas → Tasks en ClickUp/Jira
- `/weekly-digest` — Reporte semanal unificado

### Creación & Scaffolding
- `/scaffold-go` — Proyecto Go estilo Clean Arch
- `/scaffold-unity` — Proyecto Unity estilo Project_T
- `/scaffold-nextjs` — Next.js 15 con App Router
- `/scaffold-nestjs` — NestJS con Clean Architecture
- `/scaffold-fastapi` — FastAPI con SQLAlchemy
- `/scaffold-flutter` — Flutter con Riverpod

### Reviews & Audits
- `/audit-dev` — Auditoría de software
- `/audit-game` — Auditoría de game design
- `/code-review-backend` — Review especializada backend
- `/code-review-frontend` — Review especializada frontend
- `/security-review` — Threat modeling + OWASP
- `/a11y-audit` — Accessibility audit

---

## Compatibilidad

- **OS:** Windows 10/11 (Git Bash), macOS, Linux
- **Shell:** Bash (POSIX-compatible)
- **Claude Code:** v1.0+
- **Lenguaje:** Español (comunicación) + English (código/commits)

---

## Filosofía

Los agentes siguen el principio de **diseño colaborativo**:

> **Question → Options → Decision → Draft → Approval**

- El usuario toma las decisiones finales
- Los agentes presentan opciones con trade-offs
- No se escribe código sin aprobación
- No se hacen commits sin instrucción del usuario

Ver `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` para más detalles.

---

## Licencia

MIT — Ver [LICENSE](LICENSE)

## Créditos

- Inspirado en [Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) por Donchitos
- División 1 (Game Dev) portada directamente del repo original
- Resto construido desde cero para este proyecto
