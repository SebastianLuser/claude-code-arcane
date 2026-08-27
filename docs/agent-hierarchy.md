# Jerarquía de Agentes

## Modelo de 3 Tiers

Cada división sigue una jerarquía de estudio real con 3 niveles de autoridad:

### Tier 1 — Directors (Model: Opus)
**Autoridad:** Decisiones estratégicas, resolución de conflictos cross-disciplina, vision guardianship
**Max turns:** 30
**Cuándo invocar:** Decisiones que afectan la identidad del producto, conflictos entre leads, escalaciones

### Tier 2 — Leads (Model: Sonnet)
**Autoridad:** Owners de dominio, estándares del área, coordinación de specialists
**Max turns:** 20
**Cuándo invocar:** Diseño de sistemas, reviews de área, decisiones de arquitectura local

### Tier 3 — Specialists (Model: Sonnet/Haiku)
**Autoridad:** Ejecución técnica especializada en su nicho
**Max turns:** 15
**Cuándo invocar:** Tareas técnicas específicas que requieren expertise profundo

---

## Roster Completo (143 Agentes)

### División 1 — Game Development Studio (44)

**Directors (3):**
- `creative-director`, `technical-director`, `producer`

**Leads (8):**
- `game-designer`, `lead-programmer`, `art-director`, `audio-director`, `narrative-director`, `qa-lead`, `release-manager`, `localization-lead`

**Specialists (33):**
- Engineering: `gameplay-programmer`, `engine-programmer`, `ai-programmer`, `network-programmer`, `tools-programmer`, `ui-programmer`
- Design: `systems-designer`, `level-designer`, `economy-designer`
- Art: `technical-artist`, `sound-designer`, `writer`, `world-builder`, `ux-designer`, `prototyper`
- Ops: `performance-analyst`, `devops-engineer`, `analytics-engineer`, `security-engineer`, `qa-tester`, `accessibility-specialist`, `live-ops-designer`, `community-manager`
- Unity: `unity-specialist`, `unity-dots-specialist`, `unity-shader-specialist`, `unity-addressables-specialist`, `unity-ui-specialist`
- Unreal: `unreal-specialist`, `ue-gas-specialist`, `ue-blueprint-specialist`, `ue-replication-specialist`, `ue-umg-specialist`

### División 2 — Software Engineering (20)

**Directors (2):** `chief-technology-officer`, `vp-engineering`

**Leads (5):** `backend-architect`, `frontend-architect`, `api-architect`, `database-architect`, `mobile-lead`

**Specialists (14 planificados, 6 implementados):**
- Backend: `go-engineer` ✓, `node-engineer` ✓, `python-engineer`, `rust-engineer`
- Frontend: `react-engineer` ✓, `vue-engineer`, `angular-engineer`
- Mobile: `flutter-engineer`, `react-native-engineer` ✓
- Data: `sql-specialist` ✓, `postgres-specialist` ✓, `nosql-specialist`, `graphql-specialist`, `websocket-specialist`

### División 3 — DevOps & Infrastructure (11)

**Leads (3):** `cloud-architect`, `platform-lead`, `sre-lead`

**Specialists (8):** `docker-specialist`, `kubernetes-specialist`, `ci-cd-specialist`, `terraform-specialist`, `aws-specialist`, `gcp-specialist`, `monitoring-specialist`, `security-ops-specialist`

### División 4 — Product & Design (11)

**Directors (1):** `chief-product-officer`

**Leads (4):** `product-manager`, `ux-lead`, `ui-lead`, `design-system-lead`

**Specialists (6):** `ux-researcher`, `ui-designer`, `ux-writer`, `interaction-designer`, `accessibility-expert`, `data-analyst`, `market-researcher`

### División 5 — Project Management Office (8)

**Directors (1):** `program-director`

**Leads (3):** `project-manager`, `scrum-master`, `delivery-manager`

**Specialists (4):** `agile-coach`, `business-analyst`, `technical-writer`, `stakeholder-manager`

### División 6 — Quality & Security (7)

**Leads (2):** `qa-director`, `security-architect`

**Specialists (5):** `test-automation-engineer`, `performance-tester`, `manual-qa-tester`, `penetration-tester`, `compliance-specialist`

### División 7 — Educabot (7)

**Leads (2):** `edtech-architect`, `curriculum-director`

**Specialists (5):** `learning-experience-designer`, `content-developer`, `robotics-specialist`, `ai-tutor-designer`, `assessment-designer`

### División 8 — Tools & Integrations (6)

**Lead (1):** `integrations-architect`

**Specialists (5):** `project-tools-specialist`, `docs-tools-specialist`, `design-tools-specialist`, `comms-tools-specialist`, `api-tools-specialist`

### División 9 — AI & Data Science (4)

**Directors (1):** `ai-architect`

**Specialists (3):** `ml-engineer`, `data-scientist`, `data-engineer`

### División 10 — C-Suite Advisory (6)

**Directors (1):** `chief-of-staff`

**Leads (5):** `ceo-advisor`, `cfo-advisor`, `cto-advisor`, `cmo-advisor`, `coo-advisor`

### División 11 — Business & Finance (3)

**Leads (1):** `business-ops-lead`

**Specialists (2):** `financial-analyst`, `sales-engineer`

### División 12 — Marketing (5)

**Directors (1):** `marketing-director`

**Leads (4):** `content-lead`, `growth-lead`, `seo-lead`, `marketing-analyst`

### División 13 — Regulatory & Compliance (3)

**Directors (1):** `regulatory-director`

**Specialists (2):** `quality-manager`, `compliance-officer`

### División 14 — Career & Job Hunt (4)

**Leads (1):** `career-strategist`

**Specialists (3):** `cv-reviewer`, `hiring-manager`, `mock-interviewer`

Los cuatro son **read-only por diseño, no por precaución**. Existen porque la búsqueda laboral tiene lecturas que solo sirven con contexto fresco: el que escribió el CV no lo puede revisar, y el que preparó las respuestas STAR no puede simular la entrevista. Un agente que hereda ese contexto no agrega nada.

Se lanzan desde los skills del perfil `+job-hunt`, no entre ellos: `cv-reviewer` y `hiring-manager` son lentes independientes sobre la misma postulación y corren **en paralelo**.

### División 15 — Freelance (4)

**Leads (1):** `pipeline-strategist`

**Specialists (3):** `client-screener`, `proposal-reviewer`, `discovery-call`

Read-only, igual que la División 14, y por la misma razón de fondo con una vuelta más: acá el que redacta no solo está convencido de su propio texto, además **está gastando plata en enviarlo**. `client-screener` es explícitamente adversarial - arranca de la hipótesis de que el trabajo es un problema, porque el sesgo del usuario apunta al otro lado.

Se lanzan desde los skills de `+freelance`. `client-screener` y `proposal-reviewer` corren **en paralelo**: uno juzga al cliente, el otro la propuesta.

---

## Reglas de Delegación

1. **Main session → Lead → Specialists** (típico)
2. **Specialists → Lead → Director** (para escalaciones)
3. **Lead de una división → Lead de otra división** (para colaboración cross-area)
4. **Director → Director** (para conflictos estratégicos)

## Consultores y ejecutores

Cada agente es una de dos cosas, nunca las dos. La distinción no es de estilo:
**un subagente no puede hacer preguntas.** `AskUserQuestion` no está en su pool
de tools y su única salida es el reporte final al parent. Un agente con
`Write`/`Edit` y la instrucción de pedir aprobación antes de escribir lee,
formula sus preguntas, no tiene a quién hacérselas, devuelve texto y no toca un
archivo. Ese fue el bug: 46 de 109 agentes estaban en esa situación.

### Consultores (15) - read-only por diseño

`career/` (4), `freelance/` (4), `clevel/` (6) y `engineering/nextjs-reviewer`.

Existen para dar una lectura independiente: el que escribió el CV no lo puede
revisar, y el que redactó la propuesta está convencido de su propio texto.
Declaran `tools` sin `Write`/`Edit` y `disallowedTools: Bash, Write, Edit`.
Read-only por diseño, no por precaución.

### Ejecutores (94) - escriben

Todo el resto. Declaran `permissionMode: acceptEdits`, que es el campo oficial
que deja al subagente escribir sin gate interactivo.

Su protocolo no es "preguntá y esperá" sino **declará el supuesto y seguí**:
ante una ambigüedad eligen la opción más consistente con el código existente,
la anotan en el reporte en una línea que empieza con `ASSUMPTION:` para que el
caller pueda grepearla y contradecirla, y avanzan. La disciplina de leer el
diseño antes de escribir se mantiene; lo que se eliminó es la espera imposible.

### Quién aplica los cambios

El ejecutor escribe sus propios archivos. La main session sigue siendo la que
decide *a quién* invocar y la que integra los resultados, pero ya no es el
único camino a disco.
