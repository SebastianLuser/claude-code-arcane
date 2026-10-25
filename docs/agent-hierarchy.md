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

## Roster Completo (115 Agentes)

> Generado desde `agents/`: cada nombre de abajo es un archivo. El tier sale de `maxTurns`
> (30 director, 20 lead, 15 specialist). `src/__tests__/agents-integrity.test.ts` verifica
> que todo agente nombrado en otro agente exista, así que un nombre sin archivo rompe el build.

### División 1 — Game Development Studio (32)

**Directors (3):** `creative-director`, `producer`, `technical-director`

**Leads (26):** `ai-programmer`, `analytics-engineer`, `art-director`, `economy-designer`, `game-designer`, `gameplay-programmer`, `lead-programmer`, `level-designer`, `live-ops-designer`, `narrative-director`, `network-programmer`, `performance-analyst`, `qa-lead`, `release-manager`, `systems-designer`, `technical-artist`, `ue-blueprint-specialist`, `ue-gas-specialist`, `ue-replication-specialist`, `ue-umg-specialist`, `unity-shader-specialist`, `unity-specialist`, `unreal-specialist`, `ux-designer`, `world-builder`, `writer`

**Specialists (3):** `accessibility-specialist`, `qa-tester-gamedev`, `sound-designer`

### División 2 — Software Engineering (19)

**Directors (2):** `chief-technology-officer`, `vp-engineering`

**Leads (4):** `backend-architect`, `database-architect`, `frontend-architect`, `mobile-lead`

**Specialists (13):** `android-engineer`, `dotnet-engineer`, `e2e-tester`, `flutter-engineer`, `go-engineer`, `ios-engineer`, `nestjs-engineer`, `nextjs-engineer`, `nextjs-reviewer`, `node-engineer`, `react-engineer`, `react-native-engineer`, `sql-specialist`

### División 3 — DevOps & Infrastructure (4)

**Leads (3):** `cloud-architect`, `platform-lead`, `sre-lead`

**Specialists (1):** `devops-engineer`

### División 4 — Product & Design (5)

**Directors (1):** `chief-product-officer`

**Leads (4):** `design-system-lead`, `product-manager`, `ui-lead`, `ux-lead`

### División 5 — Project Management Office (4)

**Directors (1):** `program-director`

**Leads (2):** `delivery-manager`, `project-manager`

**Specialists (1):** `scrum-master`

### División 6 — Quality & Security (3)

**Leads (3):** `qa-director`, `qa-engineer`, `security-architect`

### División 7 — Tools & Integrations (6)

**Directors (1):** `integrations-architect`

**Leads (3):** `design-tools-specialist`, `docs-tools-specialist`, `project-tools-specialist`

**Specialists (2):** `api-tools-specialist`, `comms-tools-specialist`

### División 8 — AI & Data Science (4)

**Directors (1):** `ai-architect`

**Leads (3):** `data-engineer`, `data-scientist`, `ml-engineer`

### División 9 — C-Suite Advisory (6)

**Directors (6):** `ceo-advisor`, `cfo-advisor`, `chief-of-staff`, `cmo-advisor`, `coo-advisor`, `cto-advisor`

### División 10 — Business & Finance (3)

**Directors (1):** `business-ops-lead`

**Leads (2):** `financial-analyst`, `sales-engineer`

### División 11 — Marketing (5)

**Directors (1):** `marketing-director`

**Leads (4):** `content-lead`, `growth-lead`, `marketing-analyst`, `seo-lead`

### División 12 — Regulatory & Compliance (3)

**Directors (1):** `regulatory-director`

**Leads (2):** `compliance-officer`, `quality-manager`

### División 13 — Career & Job Hunt (4)

**Directors (1):** `mock-interviewer`

**Leads (1):** `career-strategist`

**Specialists (2):** `cv-reviewer`, `hiring-manager`



### División 14 — Freelance (4)

**Directors (1):** `discovery-call`

**Leads (1):** `pipeline-strategist`

**Specialists (2):** `client-screener`, `proposal-reviewer`



### División 15 — Audio (6)

**Leads (3):** `audio-programmer`, `composer`, `technical-sound-designer`

**Specialists (3):** `audio-director`, `audio-qa`, `voice-director`

### División 16 — E-Commerce (1)

**Directors (1):** `ecommerce-architect`

### División 17 — Visual Novel (6)

**Leads (6):** `vn-comfyui-artist`, `vn-narrative-director`, `vn-producer`, `vn-renpy-developer`, `vn-scene-director`, `vn-ui-designer`

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

### Ejecutores (100) - escriben

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
