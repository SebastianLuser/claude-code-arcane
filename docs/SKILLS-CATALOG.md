# Skills Catalog — Claude Code Arcane

Catalogo completo de los 305 skills disponibles para proyectos consumidores. Organizados por division.

## Como ejecutar un skill

```
/skill-name [argumentos]
```

Desde cualquier proyecto que tenga Arcane configurado, escribi `/` seguido del nombre del skill en Claude Code.

---

## Agile (35 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/bug-report` | Crea bug reports estructurados con pasos de reproduccion | `[description]` o `analyze [path]` |
| `/bug-triage` | Re-evalua bugs por prioridad/severidad, asigna a sprints | `[sprint \| full \| trend]` |
| `/clickup` | Gestiona tareas, docs, time entries en ClickUp | `[task\|doc\|time] <action> <args>` |
| `/create-epics` | Traduce GDDs en epics con ADRs y risk assessment | `[system-name \| layer \| all] [--review]` |
| `/create-stories` | Divide epics en stories implementables con AC | `[epic-slug \| epic-path] [--review]` |
| `/estimate` | Estima esfuerzo analizando complejidad y dependencias | `[task-description]` |
| `/incident` | Genera post-mortems estructurados con timeline y root cause | `[incident-title o ticket-id]` |
| `/jira-tickets` | CRUD de tickets Jira (crear/buscar/actualizar/transicionar) | `[create\|search\|update\|transition] <args>` |
| `/meeting-to-tasks` | Convierte notas de reunion en tareas con owners y fechas | `[path a notas o paste inline]` |
| `/milestone-review` | Review de progreso con metricas y recomendacion go/no-go | `[milestone-name\|current] [--review]` |
| `/product-spec` | Genera PRD completo estilo Educabot | `[feature-name]` |
| `/retrospective` | Retrospectiva de sprint analizando velocidad y patrones | `[sprint-N\|milestone-name]` |
| `/sprint-ceremony` | Prepara agendas para ceremonies agile | `[daily\|planning\|review\|retro\|1on1]` |
| `/sprint-plan` | Genera o actualiza sprint plans | `[new\|update\|status] [--review]` |
| `/sprint-report` | Reporte de sprint combinando Jira + GitHub | `[sprint-id o current]` |
| `/standup-report` | Daily standup automatico: ClickUp/Jira + Git + Slack | `[today\|yesterday\|YYYY-MM-DD]` |
| `/story-done` | Verificacion de completion de story vs AC | `[story-file-path] [--review]` |
| `/story-readiness` | Valida que story esta lista para implementar | `[story-path \| all \| sprint]` |
| `/weekly-digest` | Digest semanal para stakeholders | `[current\|last\|YYYY-WW]` |
| `/create-ticket` | Workflow interactivo para crear tickets Jira | `[project-key] [title]` |
| `/atlassian-admin` | Atlassian Administrator for managing Jira, Confluence, Bitbucket users, permissions, security, integrations, SSO, and org-wide governance | `[audit\|users\|permissions\|security]` |
| `/atlassian-templates` | Creates, modifies, and manages Jira and Confluence templates, blueprints, custom layouts, and standardized content structures | `[create\|modify\|list] [template-name]` |
| `/competitive-teardown` | Analyzes competitor products by synthesizing pricing, reviews, job postings, SEO, and social data into structured competitive intelligence | `[competitor-name]` |
| `/confluence-expert` | Atlassian Confluence expert for creating and managing spaces, knowledge bases, documentation, page hierarchies, templates, and macros | `[space\|page\|template] <action>` |
| `/experiment-designer` | Plan product experiments, write testable hypotheses, estimate sample size, prioritize tests with ICE scoring, and interpret A/B outcomes | `[hypothesis\|design\|analyze]` |
| `/meeting-analyzer` | Analyzes meeting transcripts to surface behavioral patterns, communication anti-patterns, and actionable coaching feedback | `[path-to-transcript]` |
| `/product-analytics` | Define, track, and interpret product metrics across discovery, growth, and mature stages with KPI frameworks and cohort analysis | `[define\|dashboard\|analyze]` |
| `/product-discovery` | Run structured discovery to validate product opportunities, map assumptions, and test problem-solution fit | `[opportunity\|assumption-map\|sprint]` |
| `/product-manager-toolkit` | Comprehensive PM toolkit with RICE prioritization, customer interview analysis, PRD templates, and discovery frameworks | `[rice\|interview\|prd\|gtm]` |
| `/product-strategist` | Strategic product leadership: OKR cascade generation, quarterly planning, competitive landscape analysis, and vision documents | `[okrs\|quarterly\|vision\|scaling]` |
| `/research-summarizer` | Structured research summarization: turns dense papers, articles, and reports into actionable briefs with citations | `[path-to-paper]` |
| `/roadmap-communicator` | Create roadmap communication artifacts: presentations, stakeholder updates, release notes, and feature announcements | `[exec\|engineering\|customer] [update]` |
| `/scrum-master` | Data-driven Scrum Master for sprint analytics, Monte Carlo forecasting, multi-dimension health scoring, and retro tracking | `[analytics\|forecast\|health\|retro]` |
| `/senior-pm` | Senior Project Manager for enterprise software: portfolio management, risk analysis, resource optimization, and executive reporting | `[portfolio\|risk\|resource\|report]` |
| `/team-communications` | Write internal company communications: 3P updates, newsletters, FAQ roundups, incident reports, and status reports | `[update\|newsletter\|faq\|incident]` |

---

## Design (9 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/design-handoff` | Convierte diseno Figma en spec tecnica + ticket + code stub | `[figma-node-id o url]` |
| `/design-system` | Authoring guiado de GDD por secciones | `<system-name> [--review]` |
| `/figma` | Inspecciona disenos, exporta assets, extrae estilos via MCP | `[inspect\|export\|tokens] [node-id o url]` |
| `/figma-to-code` | Convierte Figma a codigo production-ready | `[figma-url o node-id]` |
| `/figma-tokens` | Extrae design tokens de Figma a CSS/Tailwind/JSON | `[css\|tailwind\|json\|style-dict]` |
| `/prototype` | Prototipado rapido para validar conceptos | `[concept-description] [--review]` |
| `/quick-design` | Spec liviana para cambios menores | `[descripcion breve]` |
| `/ux-design` | Spec UX guiada para pantallas, flows o HUD | `[screen/flow name] o hud o patterns` |
| `/ux-review` | Valida specs UX para completitud y accesibilidad | `[file-path \| all \| hud \| patterns]` |

---

## Gamedev (20 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/art-bible` | Authoring guiado de Art Bible | `[--review]` |
| `/asset-audit` | Audita assets por naming, tamano, formato, huerfanos | `[category\|all]` |
| `/asset-spec` | Genera specs visuales por asset desde GDDs | `[system:\|level:\|character:<name>] [--review]` |
| `/audit-game` | Audit integral: GDD vs spec vs code | `[full\|gdd\|spec-docs\|balance\|path]` |
| `/balance-check` | Analiza balance en archivos de datos del juego | `[system-name\|path-to-data]` |
| `/consistency-check` | Detecta inconsistencias cross-documento en stats/items | `[full \| since-last \| entity:<name>]` |
| `/doc-gdd` | Genera Game Design Document completo | `[game-name]` |
| `/doc-pas` | Documentacion PAS (Problem-Analysis-Solution) | `[problem o decision title]` |
| `/map-systems` | Descompone concepto en sistemas, mapea dependencias | `[next \| system-name] [--review]` |
| `/playtest-report` | Genera o analiza reporte de playtest | `[new\|analyze path] [--review]` |
| `/scaffold-unity` | Scaffoldea proyecto Unity estilo Project_T | `[project-name]` |
| `/team-audio` | Orquesta equipo de audio end-to-end | `[feature o area]` |
| `/team-combat` | Orquesta equipo de combate | `[combat feature]` |
| `/team-level` | Orquesta equipo de level design | `[level o area]` |
| `/team-narrative` | Orquesta equipo narrativo | `[narrative content]` |
| `/team-polish` | Orquesta equipo de polish y optimizacion | `[feature o area]` |
| `/team-qa` | Orquesta ciclo QA completo | `[sprint \| feature: name]` |
| `/team-release` | Orquesta equipo de release | `[version o next]` |
| `/team-ui` | Orquesta equipo UI end-to-end | `[UI feature]` |
| `/unity-game-architecture` | Arquitectura Unity 6 moderna | `[system o module]` |

---

## General (55 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/architecture-decision` | Crea ADR (Architecture Decision Record) | `[title] [--review]` |
| `/architecture-review` | Valida arquitectura vs GDDs con traceability | `[full \| coverage \| consistency \| engine]` |
| `/audit-dev` | Audit integral de proyecto software | `[full\|architecture\|security\|quality\|api\|deps]` |
| `/backup-strategy` | Estrategia de backup: Postgres, Redis, object storage | `[postgres\|redis\|object-storage\|dr]` |
| `/brainstorm` | Ideacion guiada de concepto de juego | `[genre/theme o open] [--review]` |
| `/changelog` | Genera changelog desde git log | `[vX..vY \| vX \| last-week \| N]` |
| `/check` | Audit rapido: lint, types, tests, secrets, deps | (sin args) |
| `/code-review` | Code review arquitectural y de calidad | `[path]` |
| `/commit` | Commit con conventional commit format | (sin args) |
| `/context-prime` | Carga contexto completo del proyecto | (sin args) |
| `/contract-testing` | Contract testing con Pact (consumer/provider) | `[consumer\|provider\|setup]` |
| `/create-pr` | Crea PR con gh CLI | (sin args) |
| `/deps-audit` | Audit de dependencias: outdated, vulns, unused | `[full\|security\|outdated\|unused\|licenses]` |
| `/env-sync` | Compara .env.example vs .env actual | `[path, default .]` |
| `/error-tracking` | Setup de error tracking (Bugsnag default) | `[setup\|triage\|release <version>]` |
| `/feature-flags` | Sistema de feature flags | `[setup\|audit\|cleanup]` |
| `/fix-issue` | Fetch issue de GitHub, localiza, implementa fix | `<issue-number>` |
| `/gate-check` | Valida readiness de fase de desarrollo | `[target-phase] [--stack software\|gamedev]` |
| `/gdocs` | Gestiona Google Docs via API | `[create\|read\|edit] [doc-id o title]` |
| `/gdrive` | Gestiona Google Drive via API | `[search\|upload\|move\|share] [query]` |
| `/gh-projects` | Gestiona GitHub Projects v2 | `[list\|create\|add\|update] [project/item]` |
| `/gsheets` | Gestiona Google Sheets via API | `[read\|write\|create] [sheet-id o range]` |
| `/help` | Orientacion y siguiente paso sugerido | `[que acabas de terminar]` |
| `/hotfix` | Workflow de fix de emergencia con audit trail | `[bug-id o description]` |
| `/i18n-setup` | Internacionalizacion: i18next, ICU, lazy-loading | `[react\|rn\|go\|ts]` |
| `/logging-setup` | Logging estructurado: slog, pino, correlation IDs | `[go\|ts\|react\|rn]` |
| `/observability-setup` | Observabilidad: OpenTelemetry + Prometheus + Grafana | `[go\|ts\|react\|rn] [--full\|--lite]` |
| `/onboard` | Genera guia de onboarding del proyecto | `[project path, default .]` |
| `/optimize` | Analiza performance: hot paths, N+1, re-renders | `[file-path o vacio]` |
| `/patch-notes` | Genera patch notes para jugadores | `[version] [--style brief\|detailed\|full]` |
| `/perf-profile` | Profiling estructurado de performance | `[system-name o full]` |
| `/performance-test` | Tests de carga con k6 | `[smoke\|load\|stress\|soak\|spike]` |
| `/postman` | Gestiona Postman: collections, environments | `[collection\|environment\|request] <action>` |
| `/qa-plan` | Plan de QA para sprint o feature | `[sprint \| feature: name \| story: path]` |
| `/regression-suite` | Mapea test coverage vs critical paths | `[update \| audit \| report]` |
| `/release-announce` | Anuncia releases en multiples canales | `[version] [--channels slack,discord,email]` |
| `/release-checklist` | Checklist pre-release por plataforma | `[pc\|console\|mobile\|all]` |
| `/reverse-document` | Genera docs desde implementacion existente | `<type> <path>` |
| `/rollback-strategy` | Estrategia de rollback en < 5 min | `[code\|config\|data\|infra]` |
| `/runbooks` | Crea y gestiona runbooks operativos | `[create <name> \| list \| update <name>]` |
| `/scope-check` | Analiza scope creep vs plan original | `[feature-name o sprint-N]` |
| `/secret-management` | Gestion de secrets: GCP SM, Vault, SOPS | `[setup\|rotate\|audit]` |
| `/security-audit` | Audit de seguridad para juegos | `[full \| network \| save \| input \| quick]` |
| `/skill-improve` | Mejora un skill con loop test-fix-retest | `[skill-name]` |
| `/skill-test` | Valida skills (estructura + comportamiento) | `static [name\|all] \| spec [name] \| audit` |
| `/slack` | Gestiona Slack: mensajes, canales, archivos | `[send\|channel\|file\|search] <args>` |
| `/smoke-check` | Smoke test de paths criticos | `[sprint \| quick \| --platform]` |
| `/start` | Onboarding adaptivo a Arcane | `[project hint]` |
| `/tech-debt` | Trackea y prioriza deuda tecnica | `[scan\|add\|prioritize\|report]` |
| `/test-flakiness` | Detecta tests flaky en CI | `[ci-log-path \| scan \| registry]` |
| `/test-helpers` | Genera helpers de test por engine | `[system-name \| all \| scaffold]` |
| `/test-setup` | Scaffoldea framework de tests + CI | `[force]` |
| `/user-persona` | Genera personas + JTBD + pain points | `[product o feature]` |
| `/visual-regression` | Testing de regresion visual | `[setup\|run\|update-baseline]` |

---

## Software (45 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/accessibility` | Accesibilidad WCAG 2.2 AA para web/mobile | `[audit\|fix] [path]` |
| `/api-design` | Diseno de API REST/GraphQL con OpenAPI | `[rest\|graphql\|contract] [resource]` |
| `/api-docs` | Genera docs de API desde codigo fuente | `[path, default .]` |
| `/api-versioning` | Estrategias de versionado de API | `[deprecate v1\|introduce v2\|audit]` |
| `/audit-log` | Sistema de audit logging | `[design\|implement] [service]` |
| `/caching-strategy` | Caching multi-capa: HTTP, CDN, Redis, in-memory | `[http\|cdn\|redis\|memory\|browser]` |
| `/cdn-setup` | Setup CDN: Cloudflare, Fastly, GCP, AWS | `[cloudflare\|fastly\|gcp\|aws]` |
| `/ci-cd-setup` | GitHub Actions para stacks Educabot | `[go\|ts\|react\|rn]` |
| `/create-test-user` | Crea usuarios de test via seed/admin | `[anonymous \| student \| admin]` |
| `/csp-headers` | Content Security Policy headers | `[go\|ts\|cloudflare]` |
| `/data-migrations` | Migraciones de datos | `[create <name>\|run\|rollback]` |
| `/data-seeding` | Seeding de DB por environment | `[dev\|staging\|demo\|test]` |
| `/database-indexing` | Analisis y gestion de indices | `[analyze\|create\|drop] [table]` |
| `/db-diagram` | Genera diagramas ER en Mermaid | `[output-path]` |
| `/deploy-check` | Checklist pre-deploy automatizado | `[staging\|prod]` |
| `/deploy-staging` | Deploy a staging con status report | (sin args) |
| `/distributed-tracing` | Setup de tracing distribuido | `[go\|ts\|react\|rn] [gcp\|tempo\|datadog]` |
| `/doc-rfc` | Genera RFC tecnico estilo Alizia-BE | `[rfc-title o feature]` |
| `/docker-setup` | Dockerfiles + docker-compose multi-stage | `[go\|ts\|react\|rn] [--dev\|--prod]` |
| `/file-uploads` | Implementacion de file uploads | `[go\|ts\|react\|rn]` |
| `/form-validation` | Validacion de forms: RHF + Zod | `[react\|rn] [form-name]` |
| `/go-clean-architecture` | Clean architecture en Go | `[module o feature]` |
| `/job-scheduling` | Background jobs: BullMQ, asynq, cron | `[go\|ts] [bullmq\|asynq\|cron]` |
| `/jwt-strategy` | Estrategia JWT | `[setup\|rotate\|audit]` |
| `/local-database-setup` | Configura DB local: Docker + Postgres | (sin args) |
| `/mfa-setup` | Multi-factor auth | `[totp\|webauthn\|sms\|backup-codes]` |
| `/monorepo-setup` | Setup monorepo: pnpm, Turborepo, Nx | `[pnpm\|turbo\|nx\|go-workspaces]` |
| `/oauth-setup` | OAuth 2.0 + OIDC con PKCE | `[google\|github\|generic] [stack]` |
| `/owasp-top10-check` | Checklist OWASP Top 10 | `[1-10 \| all]` |
| `/query-optimization` | Optimizacion de queries SQL | `[path-to-sql o query]` |
| `/rate-limiting` | Rate limiting: token bucket, sliding window | `[global\|per-user\|per-endpoint]` |
| `/rbac-abac` | Autorizacion: RBAC, ABAC, ReBAC | `[rbac\|abac\|rebac\|design]` |
| `/read-replicas` | Configuracion de read replicas | `[setup\|route\|audit]` |
| `/run-migrations` | Referencia rapida golang-migrate | `[create <name> \| up \| down [N]]` |
| `/scaffold-fastify-ts` | Scaffold backend Fastify + Prisma + Zod | `[project-name]` |
| `/scaffold-go` | Scaffold Go: Clean Arch, GORM, Gin, Postgres | `[project-name]` |
| `/scaffold-react-native` | Scaffold React Native + Expo | `[project-name]` |
| `/scaffold-react-vite` | Scaffold React + Vite + TanStack + shadcn | `[project-name]` |
| `/search-setup` | Setup de busqueda: Meilisearch, Typesense, etc. | `[meilisearch\|typesense\|elastic\|algolia\|pg-fts]` |
| `/slo-sli` | Definicion de SLOs y SLIs | `[service-name] [--availability\|--latency]` |
| `/start-service` | Detecta tipo de proyecto y arranca servicio | (sin args) |
| `/state-management` | Patrones de state management para React | `[feature o screen]` |
| `/terraform-init` | Genera Terraform: VPC, EKS, RDS, S3, IAM | `[aws\|gcp] [project-name]` |
| `/webhooks` | Diseno de webhooks: HMAC, retries, DLQ | `[outbound\|inbound] [service]` |
| `/websocket-realtime-rooms` | Realtime multi-tenant via WebSocket | `[go\|ts] [centrifugo\|socketio\|raw]` |

---

## AI (7 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/llm-cost-optimizer` | Reduce LLM API spend by 40-80% through model routing, prompt caching, compression, and cost observability without degrading quality | `[audit\|optimize\|monitor]` |
| `/rag-architect` | Design, implement, and optimize production-grade RAG pipelines covering document chunking, embedding selection, vector DBs, and evaluation | `[design\|implement\|evaluate]` |
| `/senior-computer-vision` | Computer vision engineering for object detection, image segmentation, and visual AI systems with YOLO, DETR, SAM, and ONNX/TensorRT | `[detect\|segment\|deploy]` |
| `/senior-data-engineer` | Build scalable data pipelines, ETL/ELT systems, and data infrastructure with Python, SQL, Spark, Airflow, dbt, and Kafka | `[pipeline\|model\|quality]` |
| `/senior-data-scientist` | Statistical modeling, experiment design, causal inference, and predictive analytics with A/B testing, SHAP, and MLflow | `[experiment\|model\|analyze]` |
| `/senior-ml-engineer` | ML engineering for productionizing models, building MLOps pipelines, and integrating LLMs with deployment and drift monitoring | `[deploy\|pipeline\|monitor]` |
| `/senior-prompt-engineer` | Prompt engineering patterns, LLM evaluation frameworks, agentic system design, and structured output design | `[optimize\|evaluate\|agent]` |

---

## Backend (8 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/agent-designer` | Design multi-agent systems, create agent architectures, define communication patterns, and build autonomous agent workflows | `[design\|evaluate\|patterns]` |
| `/agent-workflow-designer` | Design production-grade multi-agent workflows with pattern selection, handoff contracts, failure handling, and cost/context controls | `[sequential\|parallel\|router\|orchestrator]` |
| `/email-template-builder` | Build complete transactional email systems with React Email templates, multi-provider integration, i18n, dark mode, and spam optimization | `[setup\|template\|preview]` |
| `/mcp-server-builder` | Design and ship production-ready MCP servers from OpenAPI contracts with scaffolding, schema quality, and versioning | `[scaffold\|validate\|version]` |
| `/ms365-tenant-manager` | Automate Microsoft 365 tenant setup, Azure AD user management, Exchange Online configuration, security policies, and compliance | `[setup\|users\|security\|compliance]` |
| `/snowflake-development` | Snowflake SQL, data pipelines (Dynamic Tables, Streams+Tasks), Cortex AI functions, Snowpark Python, and dbt integration | `[query\|pipeline\|cortex\|dbt]` |
| `/stripe-integration-expert` | Implement production-grade Stripe integrations: subscriptions, payments, usage-based billing, webhooks, customer portal, and invoicing | `[subscriptions\|payments\|webhooks]` |
| `/tech-stack-evaluator` | Evaluate and compare technology stacks, frameworks, and cloud providers with weighted scoring, TCO analysis, and migration planning | `[evaluate\|compare\|migrate]` |

---

## Business (4 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/contract-and-proposal-writer` | Generate professional, jurisdiction-aware business documents: freelance contracts, project proposals, SOWs, NDAs, and MSAs | `[contract\|proposal\|sow\|nda]` |
| `/customer-success-manager` | Monitor customer health, predict churn risk, and identify expansion opportunities using weighted scoring models for SaaS | `[health\|churn\|expansion]` |
| `/revenue-operations` | Analyze sales pipeline health, revenue forecasting accuracy, and go-to-market efficiency metrics for SaaS optimization | `[pipeline\|forecast\|efficiency]` |
| `/sales-engineer` | Analyze RFP/RFI responses, build competitive feature matrices, and plan proof-of-concept engagements for pre-sales | `[rfp\|matrix\|poc\|demo]` |

---

## C-Level Advisors (10 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/ceo-advisor` | Executive leadership guidance for strategic decision-making, organizational development, and stakeholder management | `[strategy\|org\|fundraising\|board]` |
| `/cfo-advisor` | Financial leadership for startups: financial modeling, unit economics, fundraising strategy, cash management, and board packages | `[model\|fundraise\|cash\|board]` |
| `/chro-advisor` | People leadership for scaling companies: hiring strategy, compensation design, org structure, culture, and retention | `[hiring\|comp\|org\|culture]` |
| `/ciso-advisor` | Security leadership: risk quantification in dollars, compliance roadmap, security architecture strategy, and incident response | `[risk\|compliance\|architecture\|incident]` |
| `/cmo-advisor` | Marketing leadership: brand positioning, growth model design, marketing budget allocation, and channel mix optimization | `[brand\|growth\|budget\|channels]` |
| `/coo-advisor` | Operations leadership: process design, OKR execution, operational cadence, scaling playbooks, and cross-functional coordination | `[process\|okrs\|scaling\|cadence]` |
| `/cpo-advisor` | Product leadership: product vision, portfolio strategy, product-market fit measurement, and north star metrics | `[vision\|portfolio\|pmf\|metrics]` |
| `/cro-advisor` | Revenue leadership for B2B SaaS: revenue forecasting, sales model design, pricing strategy, and net revenue retention | `[forecast\|sales\|pricing\|nrr]` |
| `/cto-advisor` | Technical leadership: tech debt assessment, DORA metrics, build-vs-buy analysis, and engineering org scaling | `[debt\|dora\|build-vs-buy\|scaling]` |
| `/executive-mentor` | Adversarial thinking partner for founders: stress-tests plans, prepares board meetings, and forces honest post-mortems | `[stress-test\|board-prep\|postmortem]` |

---

## C-Level Operations (18 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/agent-protocol` | Inter-agent communication protocol for C-suite agent teams with invocation syntax, loop prevention, and isolation rules | `[invoke\|status\|protocol]` |
| `/board-deck-builder` | Assembles comprehensive board and investor update decks by pulling perspectives from all C-suite roles | `[quarterly\|investor\|custom]` |
| `/board-meeting` | Multi-agent board meeting protocol: structured 6-phase deliberation with independent C-suite contributions and synthesis | `[topic-or-decision]` |
| `/change-management` | Framework for rolling out organizational changes: ADKAR model for startups, communication templates, and resistance patterns | `[plan\|communicate\|assess]` |
| `/chief-of-staff` | C-suite orchestration layer: routes founder questions to the right advisor roles and triggers multi-role board meetings | `[route\|meeting\|synthesize]` |
| `/company-os` | Meta-framework for how a company runs: operating system selection (EOS, Scaling Up, OKR-native), scorecards, and 90-day rocks | `[select\|scorecard\|rocks]` |
| `/competitive-intel` | Systematic competitor tracking that feeds CMO positioning, CRO battlecards, and CPO roadmap decisions | `[track\|battlecard\|analyze]` |
| `/context-engine` | Loads and manages company context for all C-suite advisor skills with stale context detection and privacy/anonymization | `[load\|refresh\|status]` |
| `/cs-onboard` | Founder onboarding interview that captures company context across 7 dimensions for all C-suite advisor skills | `[start\|resume\|status]` |
| `/culture-architect` | Build, measure, and evolve company culture: mission/vision/values workshops, culture code creation, and health assessment | `[workshop\|code\|assess]` |
| `/decision-logger` | Two-layer memory for board meeting decisions: raw transcripts (Layer 1) and approved decisions (Layer 2) | `[log\|query\|export]` |
| `/founder-coach` | Personal leadership development for founders: archetype identification, delegation frameworks, and energy management | `[archetype\|delegation\|calendar]` |
| `/internal-narrative` | Build and maintain one coherent company story across all audiences with narrative contradiction detection | `[build\|audit\|adapt]` |
| `/intl-expansion` | International market expansion: market selection scoring, entry modes, localization checklists, and regulatory compliance | `[score\|plan\|checklist]` |
| `/ma-playbook` | M&A strategy for acquiring companies or being acquired: due diligence, valuation, integration, and deal structure | `[acquire\|sell\|diligence]` |
| `/org-health-diagnostic` | Cross-functional organizational health check: scores 8 dimensions on traffic-light scale with drill-down recommendations | `[full\|dimension] [--detail]` |
| `/scenario-war-room` | Cross-functional what-if modeling for cascading multi-variable scenarios across all business functions | `[scenario-description]` |
| `/strategic-alignment` | Cascade strategy from boardroom to IC: orphan goal detection, silo identification, and realignment protocols | `[cascade\|audit\|realign]` |

---

## DevOps (6 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/aws-solution-architect` | Design AWS architectures with CloudFormation/CDK IaC, serverless patterns, cost optimization for Lambda, API Gateway, DynamoDB, ECS, Aurora | `[design\|review\|cost]` |
| `/azure-cloud-architect` | Design Azure architectures with Bicep IaC templates, cost optimization for App Service, AKS, Functions, Cosmos DB, and Azure SQL | `[design\|review\|cost]` |
| `/gcp-cloud-architect` | Design GCP architectures with Terraform IaC, Cloud Run, GKE, BigQuery pipelines, and Cloud Build CI/CD | `[design\|review\|cost]` |
| `/helm-chart-builder` | Build production-grade Helm charts: scaffolding, values design, template patterns, dependency management, and security hardening | `[scaffold\|lint\|test]` |
| `/incident-commander` | Manage technology incidents end-to-end: severity classification, timeline reconstruction, stakeholder communication, and RCA | `[classify\|timeline\|communicate]` |
| `/incident-response` | Classify and triage security incidents through the full NIST SP 800-61 lifecycle: SEV1-4 scoring and forensic evidence collection | `[classify\|triage\|forensics]` |

---

## Finance (3 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/business-investment-advisor` | Evaluate capital allocation decisions with ROI, NPV, IRR, and payback analysis for equipment, hiring, and technology | `[evaluate\|compare\|model]` |
| `/financial-analyst` | Financial ratio analysis, DCF valuation, budget variance analysis, and rolling forecast construction | `[ratios\|dcf\|variance\|forecast]` |
| `/saas-metrics-coach` | SaaS financial health: calculates ARR, MRR, churn, LTV, CAC, NRR from raw numbers and benchmarks by stage | `[calculate\|benchmark\|diagnose]` |

---

## Marketing — Content (8 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/content-creator` | Deprecated redirect skill — routes legacy requests to content-production or content-strategy | `[topic]` |
| `/content-humanizer` | Transform AI-generated content into authentic human writing — detect AI patterns, fix rhythm, inject brand voice | `[path-to-content]` |
| `/content-production` | Full content production pipeline — research, brief, draft, optimize, and publish blog posts, articles, and guides | `[brief\|draft\|optimize] [topic]` |
| `/content-strategy` | Plan content strategy, topic clusters, content calendars, and decide what to write | `[strategy\|clusters\|calendar]` |
| `/copy-editing` | Systematic copy editing via seven focused sweeps — clarity, voice, so-what, proof, specificity, emotion, zero-risk | `[path-to-copy]` |
| `/copywriting` | Write and improve marketing copy for homepages, landing pages, pricing, feature, and about pages | `[homepage\|landing\|pricing\|feature]` |
| `/social-content` | Create, schedule, and optimize social media content for LinkedIn, Twitter/X, Instagram, TikTok, and Facebook | `[platform] [topic]` |
| `/video-content-strategist` | Plan video content strategy, write scripts, optimize YouTube channels, and build short-form video pipelines | `[strategy\|script\|youtube\|shorts]` |

---

## Marketing — Growth (10 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/app-store-optimization` | ASO toolkit — keyword research, metadata optimization, competitor analysis, and A/B testing for App Store and Google Play | `[audit\|keywords\|metadata]` |
| `/churn-prevention` | Reduce voluntary and involuntary churn — cancel flow design, save offers, exit surveys, and dunning sequences | `[audit\|cancel-flow\|dunning]` |
| `/cold-email` | Write and optimize B2B cold outreach emails and follow-up sequences | `[write\|sequence\|optimize]` |
| `/email-sequence` | Create and optimize email sequences — welcome, nurture, re-engagement, post-purchase, and lifecycle drip campaigns | `[welcome\|nurture\|re-engage]` |
| `/free-tool-strategy` | Evaluate, design, and launch free tools for marketing — calculators, generators, and checkers for lead gen and SEO | `[evaluate\|design\|launch]` |
| `/launch-strategy` | Plan product launches, feature announcements, and release strategies — phased launches and Product Hunt | `[plan\|phased\|producthunt]` |
| `/paid-ads` | Create, optimize, and scale paid ad campaigns on Google Ads, Meta, LinkedIn, Twitter/X, TikTok | `[google\|meta\|linkedin] [action]` |
| `/referral-program` | Design, launch, and optimize referral and affiliate programs — loop mechanics, incentive design, and measurement | `[design\|launch\|optimize]` |
| `/social-media-analyzer` | Analyze social media campaign performance — engagement rates, ROI, platform benchmarks, and recommendations | `[analyze\|benchmark\|report]` |
| `/social-media-manager` | Develop social media strategy, plan content calendars, manage community engagement, and grow social presence | `[strategy\|calendar\|community]` |

---

## Marketing — SEO & CRO (11 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/ai-seo` | Optimize content to get cited by AI search engines — ChatGPT, Perplexity, Google AI Overviews, Claude, Gemini | `[audit\|optimize\|monitor]` |
| `/form-cro` | Optimize lead capture, contact, demo request, and checkout forms — field audit, layout, copy, and mobile | `[audit\|optimize] [form-type]` |
| `/onboarding-cro` | Optimize post-signup onboarding, user activation, and time-to-value — checklists, empty states, guided tours | `[audit\|redesign\|measure]` |
| `/page-cro` | Optimize conversion rates on marketing pages — homepage, landing, pricing, feature, and blog | `[audit\|optimize] [page-type]` |
| `/paywall-upgrade-cro` | Optimize in-app paywalls, upgrade screens, upsell modals, and feature gates — convert free to paid | `[audit\|redesign\|test]` |
| `/popup-cro` | Create and optimize popups, modals, exit-intent overlays, slide-ins, and banners for lead capture | `[create\|audit\|optimize]` |
| `/programmatic-seo` | Build SEO-optimized pages at scale using templates and data — directory, location, comparison pages | `[plan\|template\|generate]` |
| `/schema-markup` | Implement, audit, and validate JSON-LD schema markup — rich results, AI search visibility, and structured data | `[audit\|implement\|validate]` |
| `/seo-audit` | Audit and diagnose SEO issues — technical SEO, on-page optimization, content gaps, and action plans | `[full\|technical\|content\|quick]` |
| `/signup-flow-cro` | Optimize signup, registration, and trial activation flows — reduce friction and increase completion | `[audit\|redesign\|measure]` |
| `/site-architecture` | Audit, redesign, or plan website structure — URL hierarchy, navigation, internal linking, and silo strategy | `[audit\|plan\|redesign]` |

---

## Marketing — Strategy (15 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/ab-test-setup` | Plan, design, and implement A/B tests with statistical rigor — hypothesis frameworks, sample sizing, and result analysis | `[plan\|design\|analyze]` |
| `/ad-creative` | Generate, iterate, and scale ad creative for paid advertising across Google, Meta, LinkedIn, and X | `[generate\|iterate\|scale]` |
| `/analytics-tracking` | Set up, audit, and debug analytics tracking — GA4, GTM, event taxonomy, conversion tracking, and data quality | `[setup\|audit\|debug]` |
| `/brand-guidelines` | Apply, document, and enforce brand guidelines — color systems, typography, logo rules, imagery, and tone matrix | `[create\|audit\|enforce]` |
| `/campaign-analytics` | Analyze campaign performance with multi-touch attribution, funnel conversion analysis, and ROI calculation | `[attribution\|funnel\|roi]` |
| `/competitor-alternatives` | Create competitor comparison and alternative pages for SEO and sales enablement — vs pages and competitive landing pages | `[vs-page\|alternatives\|landing]` |
| `/marketing-context` | Create and maintain the marketing context document — positioning, messaging, ICP, and brand voice for all marketing skills | `[create\|update\|audit]` |
| `/marketing-demand-acquisition` | Demand generation and acquisition playbook for Series A+ startups — paid media, SEO, partnerships, and attribution | `[playbook\|channels\|attribution]` |
| `/marketing-ideas` | 139 proven marketing ideas organized by category, stage, and budget for SaaS and software products | `[browse\|filter\|recommend]` |
| `/marketing-ops` | Central router for the marketing skill ecosystem — routes questions to the right skill and orchestrates campaigns | `[route\|audit\|campaign]` |
| `/marketing-psychology` | Apply psychological principles and behavioral science to marketing — 70+ models for conversion, pricing, and growth | `[model\|apply\|audit]` |
| `/marketing-strategy-pmm` | Product marketing — positioning (April Dunford), GTM strategy, competitive intelligence, and launch playbooks | `[positioning\|gtm\|competitive]` |
| `/pricing-strategy` | Design, optimize, and communicate SaaS pricing — tier structure, value metrics, pricing pages, and price increases | `[design\|optimize\|communicate]` |
| `/prompt-engineer-toolkit` | A/B test prompts, version them, and build reusable templates for marketing AI workflows | `[test\|version\|template]` |
| `/x-twitter-growth` | X/Twitter growth engine — algorithm mechanics, thread engineering, reply strategy, and profile optimization | `[strategy\|thread\|profile]` |

---

## Regulatory & Compliance (13 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/capa-officer` | CAPA system management for medical device QMS — root cause analysis, corrective action planning, and effectiveness verification | `[create\|track\|verify]` |
| `/fda-consultant-specialist` | FDA regulatory consulting — 510(k)/PMA/De Novo pathway guidance, QSR (21 CFR 820) compliance, and HIPAA assessments | `[pathway\|qsr\|hipaa\|cyber]` |
| `/gdpr-dsgvo-expert` | GDPR and German DSGVO compliance — codebase privacy scanning, DPIA generation, and data subject rights tracking | `[scan\|dpia\|rights\|audit]` |
| `/information-security-manager-iso27001` | ISO 27001 ISMS implementation — security risk assessment, control implementation, certification, and incident response | `[assess\|implement\|certify]` |
| `/isms-audit-expert` | ISMS audit management for ISO 27001 — audit planning, control assessment, finding classification, and certification | `[plan\|assess\|report]` |
| `/mdr-745-specialist` | EU MDR 2017/745 compliance — device classification, technical documentation, clinical evidence, and post-market surveillance | `[classify\|document\|pms]` |
| `/qms-audit-expert` | ISO 13485 internal audit expertise — audit planning, execution, nonconformity classification, and CAPA verification | `[plan\|execute\|report]` |
| `/quality-documentation-manager` | Document control for medical device QMS — numbering, version control, change management, and 21 CFR Part 11 compliance | `[create\|control\|audit]` |
| `/quality-manager-qmr` | QMR governance — management review, quality KPIs, quality objectives, and regulatory compliance per ISO 13485 Clause 5.5.2 | `[review\|kpis\|objectives]` |
| `/quality-manager-qms-iso13485` | ISO 13485 QMS implementation and maintenance — document control, internal auditing, process validation, and certification | `[implement\|audit\|certify]` |
| `/regulatory-affairs-head` | Regulatory strategy, FDA submissions, EU MDR CE marking, and global market access for medical devices | `[strategy\|submission\|ce-mark]` |
| `/risk-management-specialist` | ISO 14971 risk management for medical devices — risk analysis, FMEA, risk evaluation, and post-production monitoring | `[analyze\|fmea\|evaluate\|monitor]` |
| `/soc2-compliance` | SOC 2 Type I and Type II compliance — Trust Service Criteria mapping, gap analysis, evidence collection, and audit readiness | `[map\|gap-analysis\|evidence]` |

---

## Security (5 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/ai-security` | Assess AI/ML systems for prompt injection, jailbreak vulnerabilities, model inversion, data poisoning, and agent tool abuse | `[assess\|audit\|mitigate]` |
| `/cloud-security` | Assess cloud infrastructure for IAM privilege escalation, public storage exposure, open security groups, and IaC gaps | `[aws\|azure\|gcp] [audit]` |
| `/red-team` | Plan and execute authorized red team engagements: MITRE ATT&CK kill-chain planning, technique scoring, and choke points | `[plan\|execute\|report]` |
| `/security-pen-testing` | Offensive security testing: OWASP Top 10 audits, static analysis, dependency scanning, secret detection, and API testing | `[owasp\|static\|deps\|secrets\|api]` |
| `/threat-detection` | Proactive threat hunting with hypothesis scoring, IOC sweep generation, z-score anomaly detection, and MITRE ATT&CK prioritization | `[hunt\|sweep\|anomaly]` |

---

## Testing (2 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/playwright-pro` | Production-grade Playwright testing: generate tests, fix flaky failures, migrate from Cypress/Selenium, sync with TestRail | `[generate\|fix\|migrate\|review]` |
| `/tdd-guide` | Test-driven development: writing unit tests, generating fixtures and mocks, analyzing coverage gaps, and red-green-refactor workflows | `[write\|fixture\|coverage\|refactor]` |

---

## Skills internos de Arcane

Estos skills son para mantener y desarrollar el propio repo Arcane:

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/skill-test` | Valida skills (estructura + comportamiento) | `static [name\|all] \| spec [name] \| audit` |
| `/skill-improve` | Mejora un skill con loop test-fix-retest | `[skill-name]` |
| `/start` | Onboarding adaptivo | `[project hint]` |
| `/help` | Orientacion contextual | `[que terminaste]` |

---

## Flags comunes

Muchos skills soportan estas flags opcionales:

- `--review full|lean|solo` — modo de review (full = multi-agente, lean = rapido, solo = sin review)
- `--stack software|gamedev` — fuerza division cuando el proyecto es dual
- `--platform pc|console|mobile|all` — plataforma target

## Notas

- Los skills se ejecutan en el contexto del proyecto actual, no de Arcane
- Algunos skills requieren integraciones configuradas (ClickUp, Jira, Figma, Slack, Google)
- Los skills `team-*` orquestan multiples agentes especializados en paralelo
- Los skills `scaffold-*` crean proyectos desde cero con estructura Educabot
