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

## Roster Completo (114 Agentes)

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

**Specialists (13):**
- Backend: `go-engineer`, `node-engineer`, `python-engineer`, `rust-engineer`
- Frontend: `react-engineer`, `vue-engineer`, `angular-engineer`
- Mobile: `flutter-engineer`, `react-native-engineer`
- Data: `sql-specialist`, `nosql-specialist`, `graphql-specialist`, `websocket-specialist`

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

---

## Reglas de Delegación

1. **Main session → Lead → Specialists** (típico)
2. **Specialists → Lead → Director** (para escalaciones)
3. **Lead de una división → Lead de otra división** (para colaboración cross-area)
4. **Director → Director** (para conflictos estratégicos)

**Los agentes NUNCA escriben a archivos directamente.** Todos los writes los hace la main session después de que el agente devuelve análisis/propuestas al usuario.
