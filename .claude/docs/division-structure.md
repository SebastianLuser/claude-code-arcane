# Estructura de Divisiones

El repo está organizado en 13 divisiones. Cada división tiene su propia jerarquía de 3 tiers (directors, leads, specialists) y sus skills asociadas.

## División 1 — Game Development Studio 🎮
**Path:** `agents/game/`
**Propósito:** Desarrollo de videojuegos (Unity, Unreal)
**Agentes:** 44 | **Skills:** 72
**Stack:** C#, C++, Blueprint

**Cuándo usarla:** Cualquier tarea relacionada con juegos — diseño, mecánicas, arte, audio, narrativa, QA de juegos.

## División 2 — Software Engineering 💻
**Path:** `agents/engineering/`
**Propósito:** Desarrollo de software profesional
**Agentes:** 20 | **Skills:** 60
**Stack:** Go, Node.js, Python, TypeScript, Rust, React, Vue, Angular, Flutter, React Native

**Cuándo usarla:** Aplicaciones web, APIs, mobile, bases de datos, arquitectura de software.

## División 3 — DevOps & Infrastructure ☁️
**Path:** `agents/devops/`
**Propósito:** Infraestructura, cloud, deployment, observability
**Agentes:** 11 | **Skills:** 18
**Stack:** AWS, GCP, Azure, K8s, Docker, Terraform, GitHub Actions

**Cuándo usarla:** CI/CD, deploys, infraestructura, monitoreo, security ops.

## División 4 — Product & Design 🎨
**Path:** `agents/product/`
**Propósito:** Product management, UX research, UI design
**Agentes:** 11 | **Skills:** 22
**Stack:** Figma, Miro, research tools, analytics

**Cuándo usarla:** Discovery de producto, diseño de UX/UI, research, priorización.

## División 5 — Project Management Office 📋
**Path:** `agents/management/`
**Propósito:** Gestión de proyectos, agile, delivery
**Agentes:** 8 | **Skills:** 18
**Stack:** Jira, ClickUp, Linear, GitHub Projects

**Cuándo usarla:** Planificación, sprints, stakeholders, risk management.

## División 6 — Quality & Security 🛡️
**Path:** `agents/quality/`
**Propósito:** Testing, QA, seguridad, compliance
**Agentes:** 7 | **Skills:** 14
**Stack:** Jest, Playwright, Cypress, OWASP ZAP, Burp Suite

**Cuándo usarla:** Test strategy, automation, security reviews, compliance audits.

## División 7 — Educabot 🎓
**Path:** `agents/educabot/`
**Propósito:** Desarrollo de productos educativos (EdTech)
**Agentes:** 7 | **Skills:** 10
**Stack:** LMS, adaptive learning, robotics, curriculum design

**Cuándo usarla:** Diseño curricular, actividades educativas, robots, evaluaciones.

## División 8 — Tools & Integrations 🔌
**Path:** `agents/integrations/`
**Propósito:** Orquestación de herramientas SaaS del día a día
**Agentes:** 6 | **Skills:** 30
**Stack:** ClickUp, Jira, Linear, Google Workspace, Notion, Coda, Slack, Discord, Figma, Miro, Postman

**Cuándo usarla:** Cualquier integración con herramientas externas, sincronización cross-tool, workflows automatizados.

## División 9 — AI & Data Science 🤖
**Path:** `agents/ai/`
**Propósito:** Arquitectura AI/ML, data pipelines, MLOps, estadística
**Agentes:** 4 | **Skills:** 7
**Stack:** PyTorch, HuggingFace, MLflow, Airflow, dbt, Spark, vLLM

**Cuándo usarla:** Diseño de RAG, model selection, cost optimization LLM, pipelines de datos, A/B testing, feature engineering.

## División 10 — C-Suite Advisory 👔
**Path:** `agents/clevel/`
**Propósito:** Asesoría ejecutiva para founders y liderazgo
**Agentes:** 6 | **Skills:** 28
**Stack:** Frameworks estratégicos, financial modeling, OKRs

**Cuándo usarla:** Decisiones estratégicas, fundraising, board meetings, org design, operational cadence, marketing strategy de alto nivel.

## División 11 — Business & Finance 💼
**Path:** `agents/business/`
**Propósito:** Revenue operations, análisis financiero, pre-sales
**Agentes:** 3 | **Skills:** 7
**Stack:** CRM, financial modeling, SaaS metrics

**Cuándo usarla:** Pipeline analysis, customer health scoring, DCF/valuaciones, RFP/RFI, propuestas comerciales.

## División 12 — Marketing 📣
**Path:** `agents/marketing/`
**Propósito:** Ejecución de marketing — contenido, growth, SEO, analytics
**Agentes:** 5 | **Skills:** 44
**Stack:** GA4, GTM, Google Ads, Meta, LinkedIn, SEO tools

**Cuándo usarla:** Content production, paid ads, email sequences, SEO audits, CRO, campaign analytics, A/B testing de marketing.

## División 13 — Regulatory & Compliance 📜
**Path:** `agents/regulatory/`
**Propósito:** Regulatory affairs, QMS, compliance de datos y seguridad
**Agentes:** 3 | **Skills:** 13
**Stack:** ISO 13485, ISO 27001, FDA, EU MDR, GDPR, SOC 2

**Cuándo usarla:** Submissions FDA/CE, QMS implementation, CAPA, auditorías ISO, GDPR compliance, SOC 2 readiness.

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
- C-Suite + Business: Revenue strategy → `cfo-advisor` + `business-ops-lead`
- Marketing + Engineering: Landing pages, tracking → `marketing-director` + `frontend-architect`
- AI + Engineering: ML features en producto → `ai-architect` + `backend-architect`
- Regulatory + Quality: Compliance de producto → `regulatory-director` + `security-architect`
- C-Suite + Marketing: GTM strategy → `cmo-advisor` + `marketing-director`
