# Skills Catalog — Claude Code Arcane

Catalogo completo de los 149 skills disponibles para proyectos consumidores. Organizados por division.

## Como ejecutar un skill

```
/skill-name [argumentos]
```

Desde cualquier proyecto que tenga Arcane configurado, escribi `/` seguido del nombre del skill en Claude Code.

---

## Agile (20 skills)

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
| `/tdd` | Guia TDD con Red-Green-Refactor | `[feature description]` |
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
