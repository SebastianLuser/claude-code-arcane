# Skills Catalog — Claude Code Arcane

Los 437 skills disponibles para proyectos consumidores, organizados por division.

La tabla cubre 395: hay 42 skills instalables que todavia no estan catalogados aca. Un test de CI (`src/__tests__/doc-counts.test.ts`) verifica que estos numeros coincidan con el filesystem y que el header de cada seccion coincida con sus filas.

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

## Gamedev (25 skills)

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
| `/install-mcp` | Conecta Claude con el MCP del engine: Unity (package UPM) o Unreal (plugins del engine) | `[unity\|unreal] [--secondary] [path]` |
| `/meshy-derive` | Deriva targets (FBX, GLB web, blend, STL) desde el master GLB | `<slug> [game\|web\|edit\|print\|all]` |
| `/meshy-generate` | Genera asset 3D con Meshy: preview -> refine, con gate de creditos | `<slug> [--from-image <path>] [--spec <path>]` |
| `/meshy-print` | Prepara asset para impresion 3D: analyze -> repair -> resize -> STL/3MF | `<slug> [--height-mm <n>] [--multicolor]` |
| `/meshy-setup` | Conecta Claude Code con Meshy AI: API key, MCP oficial, estructura de assets | `[--verify]` |
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

## Blender (5 skills)

Instalables con el perfil `blender`. El MCP de Blender es **recomendado, no se instala desde este
repo**: la comparacion entre el de la comunidad y el oficial esta en `/blender-context`.

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/blender-context` | Foundation: version, MCP recomendado, headless, unidades y ejes, estructura de assets | `[--verify]` |
| `/blender-modeling` | Presupuesto de tris, topologia, stack de modifiers, booleans, LODs, bmesh | `[slug] [--budget <tris>] [--lod]` |
| `/blender-materials` | Principled BSDF, UVs y lightmap UV1, bake, color space, normal maps OpenGL vs DirectX | `[slug] [--bake] [--target unity\|ue5\|web]` |
| `/blender-animation` | Armature y naming, weights, bake de constraints, NLA como clips, root motion, retarget Mixamo | `[slug] [--retarget <fbx>] [--bake]` |
| `/blender-export` | Formato y settings, export headless, y validacion automatica del glTF resultante | `[slug] [--target unity\|ue5\|web] [--budget-tris <n>]` |

---

## Unreal (30 skills)

Instalables con el perfil `unreal-dev`. Procedencia y licencias en `ATTRIBUTION.md`.

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/ue-project-context` | Documento de contexto del proyecto: modulos, plataformas, convenciones, standards | `[new \| update \| section]` |
| `/ue-naming-conventions` | Naming de assets y estructura de Content: Prefix_BaseAssetName_Variant_Suffix, prefijos por tipo, layout de carpetas | `[asset, folder o review]` |
| `/ue-cpp-foundations` | UPROPERTY, UFUNCTION, UCLASS, TArray, TMap, delegates, FString, garbage collection | `[class, type o question]` |
| `/ue-actor-component-architecture` | Diseno de actors y components: BeginPlay, Tick, attachment, ownership, child actors | `[actor o component]` |
| `/ue-gameplay-framework` | GameMode, GameState, PlayerController, PlayerState, Pawn, HUD | `[class o flow]` |
| `/ue-module-build-system` | Build.cs, Target.cs, creacion de modulos, setup de plugins, configuracion de build | `[module o plugin]` |
| `/ue-async-threading` | Operaciones async, threading, ejecucion paralela, tasks, FRunnable, AsyncTask | `[operation o task]` |
| `/ue-blueprints` | Blueprint visual scripting: Event Graph, Construction Script, Cast vs Interface vs Dispatcher | `[blueprint o graph]` |
| `/ue-gameplay-abilities` | GAS: Gameplay Abilities, Effects, Attribute Sets, Tags, Gameplay Cues | `[ability, effect o attribute]` |
| `/ue-character-movement` | CharacterMovementComponent, movement modes, root motion, network prediction | `[movement mode o feature]` |
| `/ue-animation-system` | AnimInstance, montages, blend spaces, state machines, notifies, linked anim graphs | `[character o anim feature]` |
| `/ue-physics-collision` | Colisiones, traces, simulacion fisica, interacciones, Chaos physics | `[interaction o collision setup]` |
| `/ue-game-features` | Game Feature plugins, modular gameplay, GameFeatureAction, ComponentManager | `[plugin o experience]` |
| `/ue-networking-replication` | Multiplayer: replication, RPCs, net roles, autoridad server/client | `[system o property]` |
| `/ue-ai-navigation` | AI controllers, behavior trees, blackboards, perception, NavMesh, EQS | `[behavior o AI feature]` |
| `/ue-state-trees` | State Tree, state machines, StateTreeTask, Condition, Evaluator | `[state tree o behavior]` |
| `/ue-mass-entity` | Mass Entity: MassProcessor, MassFragment, MassTag, MassObserver (UE 5.5+) | `[system o entity type]` |
| `/ue-materials-rendering` | Materials, shaders, dynamic instances, post-process, render targets, Nanite, Lumen | `[material o effect]` |
| `/ue-niagara-effects` | Niagara: sistemas de particulas, VFX, emitters, data interfaces, simulacion GPU | `[effect o system]` |
| `/ue-audio-system` | UAudioComponent, SoundCue, MetaSound, atenuacion, concurrencia, analisis | `[sound o audio system]` |
| `/ue-sequencer-cinematics` | Sequencer, LevelSequence, cutscenes, camera tracks, Movie Render Queue | `[sequence o shot]` |
| `/ue-world-level-streaming` | World Partition, level streaming, level travel, data layers, world subsystems | `[level o streaming strategy]` |
| `/ue-procedural-generation` | PCG framework, ProceduralMesh, instanced mesh, generacion en runtime, noise | `[generator o PCG graph]` |
| `/ue-data-assets-tables` | DataAsset, DataTable, soft references, TSoftObjectPtr, async loading, Asset Manager | `[data type o asset]` |
| `/ue-serialization-savegames` | Save/load, persistencia de progreso, serializacion de datos, FArchive | `[save system o data]` |
| `/ue-ui-umg-slate` | UMG, Slate, UserWidget, HUD, BindWidget, Common UI, MVVM | `[widget o UI flow]` |
| `/ue-input-system` | Enhanced Input: Input Actions, Mapping Contexts, modifiers, triggers | `[action o input scheme]` |
| `/ue-editor-tools` | Editor utility widgets, Blutility, detail customization, property editors, subsystems | `[tool o customization]` |
| `/ue-testing-debugging` | Automation tests, functional tests, UE_LOG, visual logger, debug drawing | `[test o debug target]` |
| `/ue-packaging` | Packaging y cooking: build configs, Game Default Map, RunUAT BuildCookRun | `[platform o build config]` |

---

## Audio (13 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/audio-bible` | Identidad sonora: paleta, emotional targets por game state, frequency allocation, standards | `[full\|core\|standards]` |
| `/audio-spec` | SFX spec sheets y event lists con concurrencia, cooldown y prioridad | `[system-name \| all \| events]` |
| `/music-composition` | Armonia, melodia, forma, groove, orquestacion con salida accionable | `[harmony\|melody\|form\|groove\|orchestration\|analyze]` |
| `/adaptive-music` | Musica interactiva: layering, re-secuenciacion, stingers, sync points, histeresis | `[design\|layers\|transitions\|stingers\|map]` |
| `/midi-compose` | Genera `.mid` desde spec JSON con scripts Python stdlib-only | `[spec-path \| new \| validate]` |
| `/sfx-design` | Capas attack/body/tail, variacion, round-robin, anti-repeticion | `[sound-name \| layers \| variation \| review]` |
| `/procedural-audio` | Footsteps, viento y ambientes por sintesis; decision y presupuesto de CPU | `[decide \| footsteps \| wind \| ambience \| budget]` |
| `/ui-sound-design` | Feedback de UI: duraciones y niveles por tipo, jerarquia, haptics, accesibilidad | `[set \| event-name \| review \| haptics]` |
| `/spatial-audio` | HRTF vs Ambisonics vs panning, atenuacion, oclusion vs obstruccion, presupuesto | `[decide \| hrtf \| ambisonics \| occlusion \| budget]` |
| `/audio-mix` | Jerarquia de buses, ducking, mix states, masking, loudness | `[buses \| ducking \| states \| loudness \| review]` |
| `/middleware-integration` | Wwise/FMOD: containers, eventos, Switch/State/RTPC, banks, contrato con codigo | `[structure \| events \| rtpc \| banks \| contract]` |
| `/voice-pipeline` | VO: naming, script con contexto, casting, barks, localizacion, batch | `[script \| casting \| naming \| loc \| barks]` |
| `/audio-audit` | QA: voice count, CPU, memoria, leaks, loudness ASWG-R001, conformidad de assets | `[full \| perf \| loudness \| assets \| platform]` |

---

## General (54 skills)

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

## Software (48 skills)

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
| `/dotnet-architecture` | Arquitectura .NET: Vertical Slice y Clean Architecture | `[vertical-slice\|clean\|when-to-use]` |
| `/dotnet-best-practices` | ASP.NET Core best practices: 40 reglas priorizadas | `[architecture\|di\|security\|performance\|all]` |
| `/dotnet-scaffold` | Scaffold ASP.NET Core: .NET 10, EF Core, Postgres, JWT | `[project-name]` |
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

## Job Hunt (17 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/job-hunt` | Entry point: crea/gestiona el career workspace (perfiles, CVs, aplicaciones, empresas, contactos, entrevistas) y rutea | `[setup\|status\|next]` |
| `/master-profile` | Perfil maestro single-source-of-truth del que derivan CVs, LinkedIn y portfolio | `[build\|update\|derive <role>]` |
| `/cv-tailor` | Adapta el CV a una oferta: keywords ATS, que resaltar/bajar, reescritura de highlights | `[job-url\|jd-path\|application]` |
| `/cv-ats-export` | Markdown -> PDF ATS-compliant (una columna, texto seleccionable) via Chrome/Edge headless | `[cv-name\|all] [--workspace <path>]` |
| `/linkedin-optimize` | Optimiza LinkedIn: headline, About, experiencia con KPIs, keywords, value prop, pitch 30s | `[section\|full]` |
| `/portfolio-site` | Genera/actualiza portfolio web desde el source-of-truth | `[sync\|scaffold] [repo\|--new]` |
| `/job-search` | Busca, scorea y prioriza ofertas + plan de busqueda de 7 dias | `[search <query>\|score <url>\|plan]` |
| `/job-scrape` | Busca ofertas (CLIs LinkedIn + GetOnBoard bundleados) con dedup entre corridas, scorea y ofrece crear notas | `[perfil] [--jobage N]` |
| `/job-aplicar` | Pipeline completo de una postulacion: fit, CV custom, cover, review, PDF verificado y dashboard | `<url\|nota>` |
| `/career-registry` | Trazabilidad: contesta si ya te postulaste a una empresa/URL, exporta todo a CSV, audita huecos, notas frenadas y horas por encima de lo estimado. Sirve a empleo y freelance | `[check\|export\|stats\|audit]` |
| `/job-outcome` | Registra resultado/avance de una aplicacion y actualiza nota + dashboard | `[empresa]` |
| `/job-upskill` | Gaps de skills agregados de las aplicaciones + plan de estudio con recursos reales | `[url\|nota]` |
| `/cover-letter` | Cover letters y mensajes de aplicacion concisos y custom | `[application\|company + role]` |
| `/cold-outreach` | Mensajes en frio a recruiters/hiring managers + follow-ups post-aplicacion | `[contact\|recruiter + company]` |
| `/interview-prep` | Prep de entrevista: research, banco de preguntas, respuestas STAR, red flags | `[application\|company + role + round]` |
| `/network-map` | Convierte el export de conexiones de LinkedIn en contactos por empresa + warm intros + mensajes | `[company] \| import <Connections.csv>` |
| `/personal-brand` | Backlog secuenciado de posts de LinkedIn (4 pilares) para construir autoridad antes del outreach | `[plan\|ideas <N>\|draft <idea>]` |

---

## Second Brain (14 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/second-brain` | Entry point: crea o adopta el vault (PARA + Zettelkasten + hub files), escribe su CLAUDE.md y su cache hot.md, detecta plugins, conecta otros proyectos al mismo vault y rutea | `[setup\|adopt\|status\|next\|link]` |
| `/brain-dump` | Captura sin friccion al dump del dia: sin tags, sin clasificar, sin decidir donde va | `[texto a capturar]` |
| `/review-dump` | Procesa el dump: clasifica item por item con confirmacion, actualiza hubs, rutea tareas y crea el daily | `[today\|YYYY-MM-DD]` |
| `/review-weekly` | Retrospectiva semanal: temas recurrentes, hilos abiertos y tareas hechas vs no hechas | `[current\|YYYY-Www\|YYYY-MM-DD]` |
| `/review-monthly` | Retrospectiva mensual: patrones, logros con evidencia, semillas y salud del vault | `[current\|YYYY-MM]` |
| `/zettel` | Nota atomica con el criterio de cuando una idea pasa de nota de proyecto a permanente | `[idea\|ruta#seccion\|dump YYYY-MM-DD]` |
| `/hub-note` | Hub file (MOC) por entidad que importa: el tejido entre PARA y Zettelkasten | `[entidad] [--update]` |
| `/vault-recall` | Busqueda con ranking (BM25, acentos plegados, expansion por alias) y notas relacionadas por vocabulario compartido, via indice cacheado | `<consulta> \| related <nota> [-n N]` |
| `/vault-clip` | URL a nota limpia: contenido sin menus ni banners, con resumen propio y fuente | `<url> [--full\|--summary]` |
| `/vault-audit` | Reporte de salud via script Python: huerfanas, links roto, stale, semillas que no crecieron, contradicciones, tag sprawl, nombres duplicados. Read-only | `[--vault <path>] [--stale-days N]` |
| `/vault-tidy` | Aplica los arreglos del audit con approval item por item. Nunca borra, archiva | `[orphans\|broken\|duplicates\|tasks\|frontmatter\|archive\|all]` |
| `/obsidian-markdown` | Sintaxis Obsidian: wikilinks, embeds, callouts, block IDs, propiedades. Valida o corrige una nota | `[reference\|check <archivo>\|fix <archivo>]` |
| `/obsidian-bases` | Archivos .base: vistas, filtros, formulas y summaries. Incluye migracion desde Dataview | `[create <desc>\|explain <archivo>\|migrate <query>]` |
| `/obsidian-canvas` | Archivos .canvas (JSON Canvas): nodos, grupos y edges con direccion y color | `[create <desc>\|explain <archivo>\|edit <archivo>]` |

---

## E-Commerce (12 skills)

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/commerce-data-model` | Modela y audita el dominio de catalogo: product/variant/SKU/option, collections, atributos, taxonomia, faceted search y paginacion | `[model\|audit\|taxonomy]` |
| `/cart-checkout` | Disena/audita carrito y checkout: estado del cart, multi-step vs one-page, guest checkout, abandoned-cart recovery | `[design\|audit\|abandoned]` |
| `/inventory-stock` | Inventario y stock: tracking, optimistic locking anti-overselling, reservas, multi-location, restock forecast (script) | `[design\|forecast\|audit]` |
| `/order-lifecycle` | State machine de ordenes: order/payment/fulfillment, returns/RMA, refunds, eventos/webhooks | `[design\|states\|returns]` |
| `/payments-architecture` | Arquitectura de pagos PSP-agnostica: payment intents, idempotencia, webhooks fiables, reconciliacion, PCI, fraude | `[design\|webhooks\|audit]` |
| `/promotions-discounts` | Motor de promociones: cupones, automaticos, BOGO, tiered, reglas de stacking/exclusividad, gift cards | `[design\|rules\|audit]` |
| `/shipping-tax` | Envios (zonas/rates/metodos) e impuestos (VAT/GST/nexus, duties, landed cost) calculados server-side | `[shipping\|tax\|audit]` |
| `/product-listing` | Optimiza PDP y listings de marketplace (Amazon A10/COSMO/Rufus), titulos, bullets, A+, copy en bulk | `[pdp\|marketplace\|bulk]` |
| `/commerce-analytics` | KPIs de commerce (CR, AOV, CLV, cohort) + spec de eventos GA4 ecommerce + validador de dataLayer (script) | `[kpis\|events\|audit]` |
| `/merchant-feed` | Feeds de producto Google Merchant / Meta Catalog: atributos requeridos, mapping y validacion (script) | `[validate\|generate\|map]` |
| `/storefront-architecture` | IA del storefront (home/PLP/PDP/cart/checkout/search/megamenu) + decision headless-vs-monolito + performance | `[design\|pages\|headless]` |
| `/subscription-billing` | Billing recurrente: modelos, ciclos, proration, trials, plan changes y dunning anti-churn involuntario | `[design\|dunning\|audit]` |

---

## Freelance (9 skills)

Perfil `+freelance`. Reutiliza ademas 6 skills ya catalogados: `/master-profile`, `/portfolio-site`, `/cold-outreach`, `/job-outcome` (Job Hunt), `/contract-and-proposal-writer` (Business) y `/estimate` (Agile). Comparte el career workspace con `+job-hunt`: una propuesta es una aplicacion con `tipo: freelance`.

Las fuentes automaticas son publicas y **sin API key**, para que funcionen apenas se instala el perfil: una fuente con credenciales por usuario dejaria el skill roto para todos menos uno.

A los marketplaces (Upwork, Workana, Freelancer.com, PeoplePerHour, Guru), que no tienen API publica, se llega por el modo `web` de `/freelance-scan`: WebSearch en paralelo mas un triage por patron de URL, porque la mitad de lo que devuelve la busqueda son landings y no ofertas. Ese modo descubre pero no lee (WebFetch da 403 en todas), asi que entrega links para abrir y tiene prohibido escribir fechas sin confirmar en el registro.

Quien consiga una API key propia la activa poniendo una variable de entorno: `keys` explica como conseguir cada una y avisa si falta. El analisis de cada plataforma, con los codigos medidos, esta en `skills/freelance-scan/references/platforms.md`.

| Skill | Descripcion | Uso |
|-------|-------------|-----|
| `/freelance-hunt` | Orquestador: extiende el career workspace con contratos y ledger de Connects, define piso de tarifa y capacidad, y rutea | `[setup\|status\|next]` |
| `/freelance-profile` | Perfil de la plataforma: titulo de nicho, primeros 250 caracteres del overview, portfolio items, specialized profiles y tarifa derivada del piso | `[audit\|title\|overview\|portfolio\|rate]` |
| `/fiverr-gig` | Lado de la oferta en Fiverr: titulo I will y tags, los tres packages separados por alcance, gallery, FAQ y precio sobre el piso neto | `[audit\|title\|packages\|gallery\|faq\|price]` |
| `/freelance-scan` | Scorea ofertas (fit tecnico + viabilidad economica + probabilidad de que la oferta exista) con dedup entre corridas. `search` sobre fuentes publicas sin API key (GetOnBrd, Himalayas), `web` llega a los marketplaces via WebSearch + triage de ruido SEO, `market` para tarifas, `keys` para las fuentes con credencial propia | `[search\|web\|market\|keys\|sources\|post pegado]` |
| `/client-screen` | Riesgo del cliente antes de gastar Connects: payment verificado, hire rate, brecha presupuesto/alcance, red flags. Registra el descarte tambien | `[job-url\|nota\|post]` |
| `/freelance-proposal` | Propuesta que sobrevive la vista de lista (2 primeras lineas) + bid sobre el piso neto: fijo vs hora, buffer de riesgo, comision | `[nota\|job-url]` |
| `/freelance-kickoff` | Convierte el contrato ganado en plan: desarma alcance en entregables, criterios de aceptacion, y valida si entra en las horas cotizadas antes de arrancar | `[nota de contrato\|cliente]` |
| `/freelance-deliver` | Loop de ejecucion: registra horas facturables y no facturables, detecta scope creep el dia que pasa, y cotiza el change order antes de hacer el trabajo | `[log\|check\|change\|close]` |
| `/freelance-pipeline` | Diagnostico del negocio: ROI de Connects, embudo, tarifa efectiva real neta de horas no facturables, utilizacion, concentracion, scope drift | `[--desde YYYY-MM-DD]` |

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
