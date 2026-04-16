# Estructura de Divisiones

El repo está organizado en 8 divisiones. Cada división tiene su propia jerarquía de 3 tiers (directors, leads, specialists) y sus skills asociadas.

## División 1 — Game Development Studio 🎮
**Path:** `.claude/agents/game/`
**Propósito:** Desarrollo de videojuegos (Unity, Godot, Unreal)
**Agentes:** 49 | **Skills:** 72
**Stack:** GDScript, C#, C++, Blueprint

**Cuándo usarla:** Cualquier tarea relacionada con juegos — diseño, mecánicas, arte, audio, narrativa, QA de juegos.

## División 2 — Software Engineering 💻
**Path:** `.claude/agents/engineering/`
**Propósito:** Desarrollo de software profesional
**Agentes:** 20 | **Skills:** 60
**Stack:** Go, Node.js, Python, TypeScript, Rust, React, Vue, Angular, Flutter, React Native

**Cuándo usarla:** Aplicaciones web, APIs, mobile, bases de datos, arquitectura de software.

## División 3 — DevOps & Infrastructure ☁️
**Path:** `.claude/agents/devops/`
**Propósito:** Infraestructura, cloud, deployment, observability
**Agentes:** 11 | **Skills:** 18
**Stack:** AWS, GCP, Azure, K8s, Docker, Terraform, GitHub Actions

**Cuándo usarla:** CI/CD, deploys, infraestructura, monitoreo, security ops.

## División 4 — Product & Design 🎨
**Path:** `.claude/agents/product/`
**Propósito:** Product management, UX research, UI design
**Agentes:** 11 | **Skills:** 22
**Stack:** Figma, Miro, research tools, analytics

**Cuándo usarla:** Discovery de producto, diseño de UX/UI, research, priorización.

## División 5 — Project Management Office 📋
**Path:** `.claude/agents/management/`
**Propósito:** Gestión de proyectos, agile, delivery
**Agentes:** 8 | **Skills:** 18
**Stack:** Jira, ClickUp, Linear, GitHub Projects

**Cuándo usarla:** Planificación, sprints, stakeholders, risk management.

## División 6 — Quality & Security 🛡️
**Path:** `.claude/agents/quality/`
**Propósito:** Testing, QA, seguridad, compliance
**Agentes:** 7 | **Skills:** 14
**Stack:** Jest, Playwright, Cypress, OWASP ZAP, Burp Suite

**Cuándo usarla:** Test strategy, automation, security reviews, compliance audits.

## División 7 — Educabot 🎓
**Path:** `.claude/agents/educabot/`
**Propósito:** Desarrollo de productos educativos (EdTech)
**Agentes:** 7 | **Skills:** 10
**Stack:** LMS, adaptive learning, robotics, curriculum design

**Cuándo usarla:** Diseño curricular, actividades educativas, robots, evaluaciones.

## División 8 — Tools & Integrations 🔌
**Path:** `.claude/agents/integrations/`
**Propósito:** Orquestación de herramientas SaaS del día a día
**Agentes:** 6 | **Skills:** 30
**Stack:** ClickUp, Jira, Linear, Google Workspace, Notion, Coda, Slack, Discord, Figma, Miro, Postman

**Cuándo usarla:** Cualquier integración con herramientas externas, sincronización cross-tool, workflows automatizados.

---

## Cómo Elegir la División

El comando `/start` detecta automáticamente qué división(es) necesitas. Pero si quieres invocar manualmente:

```
/detect-division "quiero hacer X"
```

O invocar directamente un agente específico:
```
Task tool con subagent_type: "<agent-name>"
```

## Cross-Division Workflows

Algunas tareas necesitan coordinación entre divisiones. Los directores de cada división pueden ser invocados para resolver conflictos:

- Game + Engineering: Prototipo web de un juego → `technical-director` + `chief-technology-officer`
- Product + Engineering: Feature cross-stack → `chief-product-officer` + `vp-engineering`
- PM + Tools: Reporting automatizado → `program-director` + `integrations-architect`
