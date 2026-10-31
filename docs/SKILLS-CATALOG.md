# Skills Catalog — Claude Code Arcane

The 454 skills available to consumer projects, organized by division.

The table covers 402: there are 52 installable skills not cataloged here yet. A CI test (`src/__tests__/doc-counts.test.ts`) checks that these numbers match the filesystem and that each section header matches its rows.

## How to run a skill

```
/skill-name [arguments]
```

From any project with Arcane configured, type `/` followed by the skill name in Claude Code.

---

## Agile (35 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/bug-report` | Creates structured bug reports with reproduction steps | `[description]` or `analyze [path]` |
| `/bug-triage` | Re-evaluates bugs by priority/severity, assigns them to sprints | `[sprint \| full \| trend]` |
| `/clickup` | Manages tasks, docs, time entries in ClickUp | `[task\|doc\|time] <action> <args>` |
| `/create-epics` | Translates GDDs into epics with ADRs and risk assessment | `[system-name \| layer \| all] [--review]` |
| `/create-stories` | Splits epics into implementable stories with AC | `[epic-slug \| epic-path] [--review]` |
| `/estimate` | Estimates effort by analyzing complexity and dependencies | `[task-description]` |
| `/incident` | Generates structured post-mortems with timeline and root cause | `[incident-title or ticket-id]` |
| `/jira-tickets` | Jira ticket CRUD (create/search/update/transition) | `[create\|search\|update\|transition] <args>` |
| `/meeting-to-tasks` | Turns meeting notes into tasks with owners and dates | `[path to notes or paste inline]` |
| `/milestone-review` | Progress review with metrics and a go/no-go recommendation | `[milestone-name\|current] [--review]` |
| `/product-spec` | Generates a full Educabot-style PRD | `[feature-name]` |
| `/retrospective` | Sprint retrospective analyzing velocity and patterns | `[sprint-N\|milestone-name]` |
| `/sprint-ceremony` | Prepares agendas for agile ceremonies | `[daily\|planning\|review\|retro\|1on1]` |
| `/sprint-plan` | Generates or updates sprint plans | `[new\|update\|status] [--review]` |
| `/sprint-report` | Sprint report combining Jira + GitHub | `[sprint-id or current]` |
| `/standup-report` | Automatic daily standup: ClickUp/Jira + Git + Slack | `[today\|yesterday\|YYYY-MM-DD]` |
| `/story-done` | Checks story completion against AC | `[story-file-path] [--review]` |
| `/story-readiness` | Validates that a story is ready to implement | `[story-path \| all \| sprint]` |
| `/weekly-digest` | Weekly digest for stakeholders | `[current\|last\|YYYY-WW]` |
| `/create-ticket` | Interactive workflow to create Jira tickets | `[project-key] [title]` |
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

| Skill | Description | Usage |
|-------|-------------|-----|
| `/design-handoff` | Turns a Figma design into a tech spec + ticket + code stub | `[figma-node-id or url]` |
| `/design-system` | Guided GDD authoring section by section | `<system-name> [--review]` |
| `/figma` | Inspects designs, exports assets, extracts styles via MCP | `[inspect\|export\|tokens] [node-id or url]` |
| `/figma-to-code` | Turns Figma into production-ready code | `[figma-url or node-id]` |
| `/figma-tokens` | Extracts design tokens from Figma to CSS/Tailwind/JSON | `[css\|tailwind\|json\|style-dict]` |
| `/prototype` | Rapid prototyping to validate concepts | `[concept-description] [--review]` |
| `/quick-design` | Lightweight spec for minor changes | `[brief description]` |
| `/ux-design` | Guided UX spec for screens, flows or HUD | `[screen/flow name] or hud or patterns` |
| `/ux-review` | Validates UX specs for completeness and accessibility | `[file-path \| all \| hud \| patterns]` |

---

## Gamedev (18 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/art-bible` | Guided Art Bible authoring | `[--review]` |
| `/asset-audit` | Audits assets for naming, size, format, orphans | `[category\|all]` |
| `/asset-spec` | Generates per-asset visual specs from GDDs | `[system:\|level:\|character:<name>] [--review]` |
| `/audit-game` | Full audit: GDD vs spec vs code | `[full\|gdd\|spec-docs\|balance\|path]` |
| `/balance-check` | Analyzes balance in the game's data files | `[system-name\|path-to-data]` |
| `/consistency-check` | Detects cross-document inconsistencies in stats/items | `[full \| since-last \| entity:<name>]` |
| `/doc-gdd` | Generates a full Game Design Document | `[game-name]` |
| `/doc-pas` | PAS (Problem-Analysis-Solution) documentation | `[problem or decision title]` |
| `/game-security-audit` | Security audit for Unity/Unreal games: saves, network, cheats, input | `[full \| network \| save \| input \| quick]` |
| `/install-mcp` | Connects Claude to the engine's MCP: Unity (UPM package) or Unreal (engine plugins) | `[unity\|unreal] [--secondary] [path]` |
| `/meshy-derive` | Derives targets (FBX, web GLB, blend, STL) from the master GLB | `<slug> [game\|web\|edit\|print\|all]` |
| `/meshy-generate` | Generates a 3D asset with Meshy: preview -> refine, credit-gated | `<slug> [--from-image <path>] [--spec <path>]` |
| `/meshy-print` | Prepares an asset for 3D printing: analyze -> repair -> resize -> STL/3MF | `<slug> [--height-mm <n>] [--multicolor]` |
| `/meshy-setup` | Connects Claude Code to Meshy AI: API key, official MCP, asset structure | `[--verify]` |
| `/map-systems` | Breaks a concept into systems, maps dependencies | `[next \| system-name] [--review]` |
| `/playtest-report` | Generates or analyzes a playtest report | `[new\|analyze path] [--review]` |
| `/scaffold-unity` | Scaffolds a Project_T-style Unity project | `[project-name]` |
| `/unity-game-architecture` | Modern Unity 6 architecture | `[system or module]` |

---

## Blender (5 skills)

Installed with the `blender` profile. The Blender MCP is **recommended, not installed from this
repo**: the comparison between the community one and the official one is in `/blender-context`.

| Skill | Description | Usage |
|-------|-------------|-----|
| `/blender-context` | Foundation: version, recommended MCP, headless, units and axes, asset structure | `[--verify]` |
| `/blender-modeling` | Tri budget, topology, modifier stack, booleans, LODs, bmesh | `[slug] [--budget <tris>] [--lod]` |
| `/blender-materials` | Principled BSDF, UVs and lightmap UV1, bake, color space, OpenGL vs DirectX normal maps | `[slug] [--bake] [--target unity\|ue5\|web]` |
| `/blender-animation` | Armature and naming, weights, constraint baking, NLA as clips, root motion, Mixamo retarget | `[slug] [--retarget <fbx>] [--bake]` |
| `/blender-export` | Format and settings, headless export, and automatic validation of the resulting glTF | `[slug] [--target unity\|ue5\|web] [--budget-tris <n>]` |

---

## Unreal (30 skills)

Installed with the `unreal-dev` profile. Provenance and licenses in `ATTRIBUTION.md`.

| Skill | Description | Usage |
|-------|-------------|-----|
| `/ue-project-context` | Project context document: modules, platforms, conventions, standards | `[new \| update \| section]` |
| `/ue-naming-conventions` | Asset naming and Content structure: Prefix_BaseAssetName_Variant_Suffix, per-type prefixes, folder layout | `[asset, folder or review]` |
| `/ue-cpp-foundations` | UPROPERTY, UFUNCTION, UCLASS, TArray, TMap, delegates, FString, garbage collection | `[class, type or question]` |
| `/ue-actor-component-architecture` | Actor and component design: BeginPlay, Tick, attachment, ownership, child actors | `[actor or component]` |
| `/ue-gameplay-framework` | GameMode, GameState, PlayerController, PlayerState, Pawn, HUD | `[class or flow]` |
| `/ue-module-build-system` | Build.cs, Target.cs, module creation, plugin setup, build configuration | `[module or plugin]` |
| `/ue-async-threading` | Async operations, threading, parallel execution, tasks, FRunnable, AsyncTask | `[operation or task]` |
| `/ue-blueprints` | Blueprint visual scripting: Event Graph, Construction Script, Cast vs Interface vs Dispatcher | `[blueprint or graph]` |
| `/ue-gameplay-abilities` | GAS: Gameplay Abilities, Effects, Attribute Sets, Tags, Gameplay Cues | `[ability, effect or attribute]` |
| `/ue-character-movement` | CharacterMovementComponent, movement modes, root motion, network prediction | `[movement mode or feature]` |
| `/ue-animation-system` | AnimInstance, montages, blend spaces, state machines, notifies, linked anim graphs | `[character or anim feature]` |
| `/ue-physics-collision` | Collisions, traces, physics simulation, interactions, Chaos physics | `[interaction or collision setup]` |
| `/ue-game-features` | Game Feature plugins, modular gameplay, GameFeatureAction, ComponentManager | `[plugin or experience]` |
| `/ue-networking-replication` | Multiplayer: replication, RPCs, net roles, server/client authority | `[system or property]` |
| `/ue-ai-navigation` | AI controllers, behavior trees, blackboards, perception, NavMesh, EQS | `[behavior or AI feature]` |
| `/ue-state-trees` | State Tree, state machines, StateTreeTask, Condition, Evaluator | `[state tree or behavior]` |
| `/ue-mass-entity` | Mass Entity: MassProcessor, MassFragment, MassTag, MassObserver (UE 5.5+) | `[system or entity type]` |
| `/ue-materials-rendering` | Materials, shaders, dynamic instances, post-process, render targets, Nanite, Lumen | `[material or effect]` |
| `/ue-niagara-effects` | Niagara: particle systems, VFX, emitters, data interfaces, GPU simulation | `[effect or system]` |
| `/ue-audio-system` | UAudioComponent, SoundCue, MetaSound, attenuation, concurrency, analysis | `[sound or audio system]` |
| `/ue-sequencer-cinematics` | Sequencer, LevelSequence, cutscenes, camera tracks, Movie Render Queue | `[sequence or shot]` |
| `/ue-world-level-streaming` | World Partition, level streaming, level travel, data layers, world subsystems | `[level or streaming strategy]` |
| `/ue-procedural-generation` | PCG framework, ProceduralMesh, instanced mesh, runtime generation, noise | `[generator or PCG graph]` |
| `/ue-data-assets-tables` | DataAsset, DataTable, soft references, TSoftObjectPtr, async loading, Asset Manager | `[data type or asset]` |
| `/ue-serialization-savegames` | Save/load, progress persistence, data serialization, FArchive | `[save system or data]` |
| `/ue-ui-umg-slate` | UMG, Slate, UserWidget, HUD, BindWidget, Common UI, MVVM | `[widget or UI flow]` |
| `/ue-input-system` | Enhanced Input: Input Actions, Mapping Contexts, modifiers, triggers | `[action or input scheme]` |
| `/ue-editor-tools` | Editor utility widgets, Blutility, detail customization, property editors, subsystems | `[tool or customization]` |
| `/ue-testing-debugging` | Automation tests, functional tests, UE_LOG, visual logger, debug drawing | `[test or debug target]` |
| `/ue-packaging` | Packaging and cooking: build configs, Game Default Map, RunUAT BuildCookRun | `[platform or build config]` |

---

## Audio (13 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/audio-bible` | Sonic identity: palette, emotional targets per game state, frequency allocation, standards | `[full\|core\|standards]` |
| `/audio-spec` | SFX spec sheets and event lists with concurrency, cooldown and priority | `[system-name \| all \| events]` |
| `/music-composition` | Harmony, melody, form, groove, orchestration with actionable output | `[harmony\|melody\|form\|groove\|orchestration\|analyze]` |
| `/adaptive-music` | Interactive music: layering, re-sequencing, stingers, sync points, hysteresis | `[design\|layers\|transitions\|stingers\|map]` |
| `/midi-compose` | Generates `.mid` from a JSON spec with stdlib-only Python scripts | `[spec-path \| new \| validate]` |
| `/sfx-design` | Attack/body/tail layers, variation, round-robin, anti-repetition | `[sound-name \| layers \| variation \| review]` |
| `/procedural-audio` | Footsteps, wind and ambiences by synthesis; decision and CPU budget | `[decide \| footsteps \| wind \| ambience \| budget]` |
| `/ui-sound-design` | UI feedback: durations and levels by type, hierarchy, haptics, accessibility | `[set \| event-name \| review \| haptics]` |
| `/spatial-audio` | HRTF vs Ambisonics vs panning, attenuation, occlusion vs obstruction, budget | `[decide \| hrtf \| ambisonics \| occlusion \| budget]` |
| `/audio-mix` | Bus hierarchy, ducking, mix states, masking, loudness | `[buses \| ducking \| states \| loudness \| review]` |
| `/middleware-integration` | Wwise/FMOD: containers, events, Switch/State/RTPC, banks, contract with code | `[structure \| events \| rtpc \| banks \| contract]` |
| `/voice-pipeline` | VO: naming, script with context, casting, barks, localization, batch | `[script \| casting \| naming \| loc \| barks]` |
| `/audio-audit` | QA: voice count, CPU, memory, leaks, ASWG-R001 loudness, asset conformance | `[full \| perf \| loudness \| assets \| platform]` |

---

## General (53 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/architecture-decision` | Creates an ADR (Architecture Decision Record) | `[title] [--review]` |
| `/architecture-review` | Validates architecture against GDDs with traceability | `[full \| coverage \| consistency \| engine]` |
| `/audit-dev` | Full audit of a software project | `[full\|architecture\|security\|quality\|api\|deps]` |
| `/backup-strategy` | Backup strategy: Postgres, Redis, object storage | `[postgres\|redis\|object-storage\|dr]` |
| `/brainstorm` | Guided game concept ideation | `[genre/theme or open] [--review]` |
| `/changelog` | Generates a changelog from git log | `[vX..vY \| vX \| last-week \| N]` |
| `/check` | Quick audit: lint, types, tests, secrets, deps | (no args) |
| `/quality-review` | Architectural and quality code review | `[path]` |
| `/commit` | Commit in conventional commit format | (no args) |
| `/context-prime` | Loads full project context | (no args) |
| `/contract-testing` | Contract testing with Pact (consumer/provider) | `[consumer\|provider\|setup]` |
| `/create-pr` | Creates a PR with gh CLI | (no args) |
| `/deps-audit` | Dependency audit: outdated, vulns, unused | `[full\|security\|outdated\|unused\|licenses]` |
| `/env-sync` | Compares .env.example against the current .env | `[path, default .]` |
| `/error-tracking` | Error tracking setup (Bugsnag by default) | `[setup\|triage\|release <version>]` |
| `/feature-flags` | Feature flag system | `[setup\|audit\|cleanup]` |
| `/fix-issue` | Fetches a GitHub issue, locates it, implements the fix | `<issue-number>` |
| `/gate-check` | Validates development phase readiness | `[target-phase] [--stack software\|gamedev]` |
| `/gdocs` | Manages Google Docs via API | `[create\|read\|edit] [doc-id or title]` |
| `/gdrive` | Manages Google Drive via API | `[search\|upload\|move\|share] [query]` |
| `/gh-projects` | Manages GitHub Projects v2 | `[list\|create\|add\|update] [project/item]` |
| `/gsheets` | Manages Google Sheets via API | `[read\|write\|create] [sheet-id or range]` |
| `/what-next` | Orientation and a suggested next step | `[what you just finished]` |
| `/hotfix` | Emergency fix workflow with an audit trail | `[bug-id or description]` |
| `/i18n-setup` | Internationalization: i18next, ICU, lazy-loading | `[react\|rn\|go\|ts]` |
| `/logging-setup` | Structured logging: slog, pino, correlation IDs | `[go\|ts\|react\|rn]` |
| `/observability-setup` | Observability: OpenTelemetry + Prometheus + Grafana | `[go\|ts\|react\|rn] [--full\|--lite]` |
| `/onboard` | Generates the project's onboarding guide | `[project path, default .]` |
| `/optimize` | Analyzes performance: hot paths, N+1, re-renders | `[file-path or empty]` |
| `/patch-notes` | Generates patch notes for players | `[version] [--style brief\|detailed\|full]` |
| `/perf-profile` | Structured performance profiling | `[system-name or full]` |
| `/performance-test` | Load tests with k6 | `[smoke\|load\|stress\|soak\|spike]` |
| `/postman` | Manages Postman: collections, environments | `[collection\|environment\|request] <action>` |
| `/qa-plan` | QA plan for a sprint or feature | `[sprint \| feature: name \| story: path]` |
| `/regression-suite` | Maps test coverage against critical paths | `[update \| audit \| report]` |
| `/release-announce` | Announces releases on multiple channels | `[version] [--channels slack,discord,email]` |
| `/release-checklist` | Pre-release checklist per platform | `[pc\|console\|mobile\|all]` |
| `/reverse-document` | Generates docs from an existing implementation | `<type> <path>` |
| `/rollback-strategy` | Rollback strategy in < 5 min | `[code\|config\|data\|infra]` |
| `/runbooks` | Creates and manages operational runbooks | `[create <name> \| list \| update <name>]` |
| `/scope-check` | Analyzes scope creep against the original plan | `[feature-name or sprint-N]` |
| `/secret-management` | Secrets management: GCP SM, Vault, SOPS | `[setup\|rotate\|audit]` |
| `/skill-improve` | Improves a skill with a test-fix-retest loop | `[skill-name]` |
| `/skill-test` | Validates skills (structure + behavior) | `static [name\|all] \| spec [name] \| audit` |
| `/slack` | Manages Slack: messages, channels, files | `[send\|channel\|file\|search] <args>` |
| `/smoke-check` | Smoke test of critical paths | `[sprint \| quick \| --platform]` |
| `/start` | Adaptive onboarding to Arcane | `[project hint]` |
| `/tech-debt` | Tracks and prioritizes technical debt | `[scan\|add\|prioritize\|report]` |
| `/test-flakiness` | Detects flaky tests in CI | `[ci-log-path \| scan \| registry]` |
| `/test-helpers` | Generates test helpers per engine | `[system-name \| all \| scaffold]` |
| `/test-setup` | Scaffolds a test framework + CI | `[force]` |
| `/user-persona` | Generates personas + JTBD + pain points | `[product or feature]` |
| `/visual-regression` | Visual regression testing | `[setup\|run\|update-baseline]` |

---

## Software (52 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/accessibility` | WCAG 2.2 AA accessibility for web/mobile | `[audit\|fix] [path]` |
| `/click-path-audit` | Follows every button through the state changes it triggers to find controls that do not do what they say | `[page <path>\|store <name>\|app]` |
| `/ui-polish` | Finishing pass: visual direction with real content, every state and the details (radii, optical alignment, focus, hit areas) | `[polish <screen>\|review]` |
| `/web-animation` | Purposeful web animation: tokens, reduced motion, transform/opacity, CSS vs Motion and patterns | `[add <component>\|review]` |
| `/api-design` | REST/GraphQL API design with OpenAPI | `[rest\|graphql\|contract] [resource]` |
| `/api-docs` | Generates API docs from source code | `[path, default .]` |
| `/api-versioning` | API versioning strategies | `[deprecate v1\|introduce v2\|audit]` |
| `/audit-log` | Audit logging system | `[design\|implement] [service]` |
| `/caching-strategy` | Multi-layer caching: HTTP, CDN, Redis, in-memory | `[http\|cdn\|redis\|memory\|browser]` |
| `/cdn-setup` | CDN setup: Cloudflare, Fastly, GCP, AWS | `[cloudflare\|fastly\|gcp\|aws]` |
| `/ci-cd-setup` | GitHub Actions for Educabot stacks | `[go\|ts\|react\|rn]` |
| `/create-test-user` | Creates test users via seed/admin | `[anonymous \| student \| admin]` |
| `/csp-headers` | Content Security Policy headers | `[go\|ts\|cloudflare]` |
| `/data-migrations` | Data migrations | `[create <name>\|run\|rollback]` |
| `/data-seeding` | DB seeding per environment | `[dev\|staging\|demo\|test]` |
| `/database-indexing` | Index analysis and management | `[analyze\|create\|drop] [table]` |
| `/database-ops` | Operate Postgres, MySQL, MongoDB and Redis: health checks, slow queries, locks, connections, maintenance and replication | `[health\|incident\|tune] [engine]` |
| `/db-diagram` | Generates ER diagrams in Mermaid | `[output-path]` |
| `/deploy-check` | Automated pre-deploy checklist | `[staging\|prod]` |
| `/deploy-staging` | Deploy to staging with a status report | (no args) |
| `/distributed-tracing` | Distributed tracing setup | `[go\|ts\|react\|rn] [gcp\|tempo\|datadog]` |
| `/doc-rfc` | Generates an Alizia-BE-style technical RFC | `[rfc-title or feature]` |
| `/docker-setup` | Dockerfiles + docker-compose multi-stage | `[go\|ts\|react\|rn] [--dev\|--prod]` |
| `/dotnet-architecture` | .NET architecture: Vertical Slice and Clean Architecture | `[vertical-slice\|clean\|when-to-use]` |
| `/dotnet-best-practices` | ASP.NET Core best practices: 40 prioritized rules | `[architecture\|di\|security\|performance\|all]` |
| `/dotnet-scaffold` | Scaffold ASP.NET Core: .NET 10, EF Core, Postgres, JWT | `[project-name]` |
| `/file-uploads` | File upload implementation | `[go\|ts\|react\|rn]` |
| `/form-validation` | Form validation: RHF + Zod | `[react\|rn] [form-name]` |
| `/go-clean-architecture` | Clean architecture in Go | `[module or feature]` |
| `/job-scheduling` | Background jobs: BullMQ, asynq, cron | `[go\|ts] [bullmq\|asynq\|cron]` |
| `/jwt-strategy` | JWT strategy | `[setup\|rotate\|audit]` |
| `/local-database-setup` | Sets up a local DB: Docker + Postgres | (no args) |
| `/mfa-setup` | Multi-factor auth | `[totp\|webauthn\|sms\|backup-codes]` |
| `/monorepo-setup` | Monorepo setup: pnpm, Turborepo, Nx | `[pnpm\|turbo\|nx\|go-workspaces]` |
| `/oauth-setup` | OAuth 2.0 + OIDC with PKCE | `[google\|github\|generic] [stack]` |
| `/owasp-top10-check` | Checklist OWASP Top 10 | `[1-10 \| all]` |
| `/query-optimization` | SQL query optimization | `[path-to-sql or query]` |
| `/rate-limiting` | Rate limiting: token bucket, sliding window | `[global\|per-user\|per-endpoint]` |
| `/rbac-abac` | Authorization: RBAC, ABAC, ReBAC | `[rbac\|abac\|rebac\|design]` |
| `/read-replicas` | Read replica configuration | `[setup\|route\|audit]` |
| `/run-migrations` | golang-migrate quick reference | `[create <name> \| up \| down [N]]` |
| `/scaffold-fastify-ts` | Fastify + Prisma + Zod backend scaffold | `[project-name]` |
| `/scaffold-go` | Scaffold Go: Clean Arch, GORM, Gin, Postgres | `[project-name]` |
| `/scaffold-react-native` | Scaffold React Native + Expo | `[project-name]` |
| `/scaffold-react-vite` | Scaffold React + Vite + TanStack + shadcn | `[project-name]` |
| `/search-setup` | Search setup: Meilisearch, Typesense, etc. | `[meilisearch\|typesense\|elastic\|algolia\|pg-fts]` |
| `/slo-sli` | SLO and SLI definition | `[service-name] [--availability\|--latency]` |
| `/start-service` | Detects the project type and starts the service | (no args) |
| `/state-management` | State management patterns for React | `[feature or screen]` |
| `/terraform-init` | Generates Terraform: VPC, EKS, RDS, S3, IAM | `[aws\|gcp] [project-name]` |
| `/webhooks` | Webhook design: HMAC, retries, DLQ | `[outbound\|inbound] [service]` |
| `/websocket-realtime-rooms` | Realtime multi-tenant via WebSocket | `[go\|ts] [centrifugo\|socketio\|raw]` |

---

## AI (8 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/llm-cost-optimizer` | Reduce LLM API spend by 40-80% through model routing, prompt caching, compression, and cost observability without degrading quality | `[audit\|optimize\|monitor]` |
| `/llm-evals` | Evals for LLM features, agents and RAG: golden dataset, four eval layers, LLM-as-judge, RAG metrics and a CI gate against a baseline | `[design\|run\|review]` |
| `/rag-architect` | Design, implement, and optimize production-grade RAG pipelines covering document chunking, embedding selection, vector DBs, and evaluation | `[design\|implement\|evaluate]` |
| `/senior-computer-vision` | Computer vision engineering for object detection, image segmentation, and visual AI systems with YOLO, DETR, SAM, and ONNX/TensorRT | `[detect\|segment\|deploy]` |
| `/senior-data-engineer` | Build scalable data pipelines, ETL/ELT systems, and data infrastructure with Python, SQL, Spark, Airflow, dbt, and Kafka | `[pipeline\|model\|quality]` |
| `/senior-data-scientist` | Statistical modeling, experiment design, causal inference, and predictive analytics with A/B testing, SHAP, and MLflow | `[experiment\|model\|analyze]` |
| `/senior-ml-engineer` | ML engineering for productionizing models, building MLOps pipelines, and integrating LLMs with deployment and drift monitoring | `[deploy\|pipeline\|monitor]` |
| `/senior-prompt-engineer` | Prompt engineering patterns, LLM evaluation frameworks, agentic system design, and structured output design | `[optimize\|evaluate\|agent]` |

---

## Backend (8 skills)

| Skill | Description | Usage |
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

| Skill | Description | Usage |
|-------|-------------|-----|
| `/contract-and-proposal-writer` | Generate professional, jurisdiction-aware business documents: freelance contracts, project proposals, SOWs, NDAs, and MSAs | `[contract\|proposal\|sow\|nda]` |
| `/customer-success-manager` | Monitor customer health, predict churn risk, and identify expansion opportunities using weighted scoring models for SaaS | `[health\|churn\|expansion]` |
| `/revenue-operations` | Analyze sales pipeline health, revenue forecasting accuracy, and go-to-market efficiency metrics for SaaS optimization | `[pipeline\|forecast\|efficiency]` |
| `/sales-engineer` | Analyze RFP/RFI responses, build competitive feature matrices, and plan proof-of-concept engagements for pre-sales | `[rfp\|matrix\|poc\|demo]` |

---

## C-Level Advisors (10 skills)

| Skill | Description | Usage |
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

| Skill | Description | Usage |
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

## DevOps (12 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/aws-solution-architect` | Design AWS architectures with CloudFormation/CDK IaC, serverless patterns, cost optimization for Lambda, API Gateway, DynamoDB, ECS, Aurora | `[design\|review\|cost]` |
| `/azure-cloud-architect` | Design Azure architectures with Bicep IaC templates, cost optimization for App Service, AKS, Functions, Cosmos DB, and Azure SQL | `[design\|review\|cost]` |
| `/cloudflare` | Cloudflare as a platform: Workers and static sites, R2, Zero Trust (Tunnel and Access), WAF and DNS | `[workers\|r2\|zero-trust\|review]` |
| `/devcontainers` | Reproducible dev environments in `.devcontainer/` for VS Code, Codespaces and CI, plus an isolated container for coding agents | `[setup\|compose\|agent]` |
| `/firebase` | Firebase for web and mobile: per-environment projects, Auth, Firestore and Storage rules tested in the emulator, App Check, Functions and costs | `[setup\|rules\|functions\|review]` |
| `/gcp-cloud-architect` | Design GCP architectures with Terraform IaC, Cloud Run, GKE, BigQuery pipelines, and Cloud Build CI/CD | `[design\|review\|cost]` |
| `/helm-chart-builder` | Build production-grade Helm charts: scaffolding, values design, template patterns, dependency management, and security hardening | `[scaffold\|lint\|test]` |
| `/incident-commander` | Manage technology incidents end-to-end: severity classification, timeline reconstruction, stakeholder communication, and RCA | `[classify\|timeline\|communicate]` |
| `/incident-response` | Classify and triage security incidents through the full NIST SP 800-61 lifecycle: SEV1-4 scoring and forensic evidence collection | `[classify\|triage\|forensics]` |
| `/vercel-deploy` | Deploying and running on Vercel: environments and variables, previews, promote and rollback, functions, protection and firewall | `[setup\|env\|release\|review]` |
| `/worktree-isolation` | Regenerates or shows this worktree's Docker ports so several worktrees run in parallel without clashing | `[apply\|status]` |
| `/worktree-isolation-setup` | Prepares the repo once: parameterizes the docker-compose ports and container_name, `.gitignore`, CLAUDE.md and the global hook | |

---

## Finance (3 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/business-investment-advisor` | Evaluate capital allocation decisions with ROI, NPV, IRR, and payback analysis for equipment, hiring, and technology | `[evaluate\|compare\|model]` |
| `/financial-analyst` | Financial ratio analysis, DCF valuation, budget variance analysis, and rolling forecast construction | `[ratios\|dcf\|variance\|forecast]` |
| `/saas-metrics-coach` | SaaS financial health: calculates ARR, MRR, churn, LTV, CAC, NRR from raw numbers and benchmarks by stage | `[calculate\|benchmark\|diagnose]` |

---

## Marketing — Content (8 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/content-creator` | Deprecated redirect skill — routes legacy requests to content-production or content-strategy | `[topic]` |
| `/content-humanizer` | Transform AI-generated content into authentic human writing — detect AI patterns, fix rhythm, inject brand voice; `humanize.py` + `detect.py` with en/es lexicons | `[path-to-content]` |
| `/content-production` | Full content production pipeline — research, brief, draft, optimize, and publish blog posts, articles, and guides | `[brief\|draft\|optimize] [topic]` |
| `/content-strategy` | Plan content strategy, topic clusters, content calendars, and decide what to write | `[strategy\|clusters\|calendar]` |
| `/copy-editing` | Systematic copy editing via seven focused sweeps — clarity, voice, so-what, proof, specificity, emotion, zero-risk | `[path-to-copy]` |
| `/copywriting` | Write and improve marketing copy for homepages, landing pages, pricing, feature, and about pages | `[homepage\|landing\|pricing\|feature]` |
| `/social-content` | Create, schedule, and optimize social media content for LinkedIn, Twitter/X, Instagram, TikTok, and Facebook | `[platform] [topic]` |
| `/video-content-strategist` | Plan video content strategy, write scripts, optimize YouTube channels, and build short-form video pipelines | `[strategy\|script\|youtube\|shorts]` |

---

## Marketing — Growth (10 skills)

| Skill | Description | Usage |
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

| Skill | Description | Usage |
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

| Skill | Description | Usage |
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

| Skill | Description | Usage |
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

## Security (8 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/ai-security` | Assess AI/ML systems for prompt injection, jailbreak vulnerabilities, model inversion, data poisoning, and agent tool abuse | `[assess\|audit\|mitigate]` |
| `/cloud-security` | Assess cloud infrastructure for IAM privilege escalation, public storage exposure, open security groups, and IaC gaps | `[aws\|azure\|gcp] [audit]` |
| `/coding-agent-guardrails` | Guardrails for repos where coding agents write code: permissions, managed settings, sandbox, hooks, branch rules, CODEOWNERS and agent tokens | `[setup\|audit] [solo\|team]` |
| `/red-team` | Plan and execute authorized red team engagements: MITRE ATT&CK kill-chain planning, technique scoring, and choke points | `[plan\|execute\|report]` |
| `/security-pen-testing` | Offensive security testing: OWASP Top 10 audits, static analysis, dependency scanning, secret detection, and API testing | `[owasp\|static\|deps\|secrets\|api]` |
| `/supply-chain-security` | Lockfiles, install scripts, release-age gates, typosquatting, provenance, SBOM and the playbook for a compromised package | `[prevent\|audit\|respond <pkg>]` |
| `/threat-modeling` | Threat model a design before building it: data-flow diagram, trust boundaries, STRIDE per element, risk scoring and owners | `[model\|review]` |
| `/threat-detection` | Proactive threat hunting with hypothesis scoring, IOC sweep generation, z-score anomaly detection, and MITRE ATT&CK prioritization | `[hunt\|sweep\|anomaly]` |

---

## Testing (2 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/playwright-pro` | Production-grade Playwright testing: generate tests, fix flaky failures, migrate from Cypress/Selenium | `[generate\|fix\|migrate\|review]` |
| `/tdd-guide` | Test-driven development: writing unit tests, generating fixtures and mocks, analyzing coverage gaps, and red-green-refactor workflows | `[write\|fixture\|coverage\|refactor]` |

---

## Job Hunt (22 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/job-hunt` | Entry point: creates/manages the career workspace (profiles, CVs, applications, companies, contacts, interviews) and routes | `[setup\|status\|next]` |
| `/master-profile` | Single-source-of-truth master profile that CVs, LinkedIn and the portfolio derive from | `[build\|update\|derive <role>]` |
| `/cv-tailor` | Tailors the CV to a posting: ATS keywords, what to highlight/play down, rewritten highlights | `[job-url\|jd-path\|application]` |
| `/cv-ats-export` | Markdown -> ATS-compliant PDF (one column, selectable text) via headless Chrome/Edge | `[cv-name\|all] [--workspace <path>]` |
| `/linkedin-optimize` | Optimizes LinkedIn: headline, About, experience with KPIs, keywords, value prop, 30s pitch | `[section\|full]` |
| `/portfolio-site` | Generates/updates the web portfolio from the source of truth | `[sync\|scaffold] [repo\|--new]` |
| `/job-search` | Searches, scores and prioritizes postings + a 7-day search plan | `[search <query>\|score <url>\|plan]` |
| `/job-scrape` | Searches postings (bundled LinkedIn + GetOnBoard CLIs, plus target companies' ATS boards) with dedup across runs, scores them and offers to create notes | `[profile] [--jobage N]` |
| `/job-apply` | Full pipeline for one application: fit, custom CV, cover letter, review, verified PDF and dashboard; opt-in assisted submission on company ATS forms with a Gmail confirmation check | `<url\|note>` |
| `/career-registry` | Traceability: answers whether you already applied to a company/URL, exports everything to CSV, audits gaps, stalled notes and hours over the estimate. Serves both jobs and freelance | `[check\|export\|stats\|audit]` |
| `/job-outcome` | Records an application's outcome/progress and updates the note + dashboard | `[company]` |
| `/job-upskill` | Skill gaps aggregated across applications + a study plan with real resources | `[url\|note]` |
| `/cover-letter` | Concise, custom cover letters and application messages | `[application\|company + role]` |
| `/cold-outreach` | Cold messages to recruiters/hiring managers + post-application follow-ups | `[contact\|recruiter + company]` |
| `/interview-prep` | Interview prep: research, question bank, STAR answers, red flags | `[application\|company + role + round]` |
| `/network-map` | Turns the LinkedIn connections export into contacts per company + warm intros + messages | `[company] \| import <Connections.csv>` |
| `/personal-brand` | Sequenced backlog of LinkedIn posts (4 pillars) + a weekly plan (what to post, when, who to engage with) to build authority before outreach | `[plan\|week\|ideas <N>\|draft <idea>]` |
| `/linkedin-post` | LinkedIn post from an idea: 3 hooks from 21 formulas, a draft in your voice, humanized and scored; never publishes | `<idea>\|write <day>` |
| `/linkedin-carousel` | Carousel (document post) for a step-shaped topic: slides in your voice, post text and a checked 4:5 PDF; never publishes | `<topic>` |
| `/linkedin-comment` | Comments on other people's posts: 9 types depending on the post, 2 options, an engagement round | `<post>\|batch` |
| `/linkedin-reply` | Replies under your post: lead/substance/peer/support/noise triage and replies in that order | `<comments>` |
| `/linkedin-inbox` | Triage of DMs and invitations (recruiter/lead/peer/ask/spam), detects automated sequences | `<messages>` |

---

## Second Brain (14 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/second-brain` | Entry point: creates or adopts the vault (PARA + Zettelkasten + hub files), writes its CLAUDE.md and its hot.md cache, detects plugins, connects other projects to the same vault and routes | `[setup\|adopt\|status\|next\|link]` |
| `/brain-dump` | Frictionless capture into the day's dump: no tags, no classifying, no deciding where it goes | `[text to capture]` |
| `/review-dump` | Processes the dump: classifies item by item with confirmation, updates hubs, routes tasks and creates the daily | `[today\|YYYY-MM-DD]` |
| `/review-weekly` | Weekly retrospective: recurring themes, open threads and tasks done vs not done | `[current\|YYYY-Www\|YYYY-MM-DD]` |
| `/review-monthly` | Monthly retrospective: patterns, achievements with evidence, seeds and vault health | `[current\|YYYY-MM]` |
| `/zettel` | Atomic note with the criterion for when an idea moves from project note to permanent note | `[idea\|path#section\|dump YYYY-MM-DD]` |
| `/hub-note` | Hub file (MOC) per entity that matters: the fabric between PARA and Zettelkasten | `[entity] [--update]` |
| `/vault-recall` | Ranked search (BM25, folded accents, alias expansion) and related notes by shared vocabulary, via a cached index | `<query> \| related <note> [-n N]` |
| `/vault-clip` | URL to a clean note: content without menus or banners, with its own summary and source | `<url> [--full\|--summary]` |
| `/vault-audit` | Health report via a Python script: orphans, broken links, stale notes, seeds that never grew, contradictions, tag sprawl, duplicate names. Read-only | `[--vault <path>] [--stale-days N]` |
| `/vault-tidy` | Applies the audit's fixes with item-by-item approval. Never deletes, archives | `[orphans\|broken\|duplicates\|tasks\|frontmatter\|archive\|all]` |
| `/obsidian-markdown` | Obsidian syntax: wikilinks, embeds, callouts, block IDs, properties. Validates or fixes a note | `[reference\|check <file>\|fix <file>]` |
| `/obsidian-bases` | .base files: views, filters, formulas and summaries. Includes migration from Dataview | `[create <desc>\|explain <file>\|migrate <query>]` |
| `/obsidian-canvas` | .canvas files (JSON Canvas): nodes, groups and edges with direction and color | `[create <desc>\|explain <file>\|edit <file>]` |

---

## E-Commerce (12 skills)

| Skill | Description | Usage |
|-------|-------------|-----|
| `/commerce-data-model` | Models and audits the catalog domain: product/variant/SKU/option, collections, attributes, taxonomy, faceted search and pagination | `[model\|audit\|taxonomy]` |
| `/cart-checkout` | Designs/audits cart and checkout: cart state, multi-step vs one-page, guest checkout, abandoned-cart recovery | `[design\|audit\|abandoned]` |
| `/inventory-stock` | Inventory and stock: tracking, optimistic locking against overselling, reservations, multi-location, restock forecast (script) | `[design\|forecast\|audit]` |
| `/order-lifecycle` | Order state machine: order/payment/fulfillment, returns/RMA, refunds, events/webhooks | `[design\|states\|returns]` |
| `/payments-architecture` | PSP-agnostic payments architecture: payment intents, idempotency, reliable webhooks, reconciliation, PCI, fraud | `[design\|webhooks\|audit]` |
| `/promotions-discounts` | Promotions engine: coupons, automatic discounts, BOGO, tiered, stacking/exclusivity rules, gift cards | `[design\|rules\|audit]` |
| `/shipping-tax` | Shipping (zones/rates/methods) and taxes (VAT/GST/nexus, duties, landed cost) computed server-side | `[shipping\|tax\|audit]` |
| `/product-listing` | Optimizes PDPs and marketplace listings (Amazon A10/COSMO/Rufus), titles, bullets, A+, bulk copy | `[pdp\|marketplace\|bulk]` |
| `/commerce-analytics` | Commerce KPIs (CR, AOV, CLV, cohort) + GA4 ecommerce event spec + dataLayer validator (script) | `[kpis\|events\|audit]` |
| `/merchant-feed` | Google Merchant / Meta Catalog product feeds: required attributes, mapping and validation (script) | `[validate\|generate\|map]` |
| `/storefront-architecture` | Storefront IA (home/PLP/PDP/cart/checkout/search/megamenu) + headless-vs-monolith decision + performance | `[design\|pages\|headless]` |
| `/subscription-billing` | Recurring billing: models, cycles, proration, trials, plan changes and dunning against involuntary churn | `[design\|dunning\|audit]` |

---

## Freelance (9 skills)

Profile `+freelance`. It also reuses 7 skills already cataloged: `/master-profile`, `/portfolio-site`, `/cold-outreach`, `/job-outcome` (Job Hunt), `/content-humanizer` (Marketing — Content), `/contract-and-proposal-writer` (Business) and `/estimate` (Agile). It shares the career workspace with `+job-hunt`: a proposal is an application with `type: freelance`.

The automatic sources are public and **need no API key**, so they work as soon as the profile is installed: a source with per-user credentials would leave the skill broken for everyone but one person.

The marketplaces (Upwork, Workana, Freelancer.com, PeoplePerHour, Guru), which have no public API, are reached through the `web` mode of `/freelance-scan`: parallel WebSearch plus a triage by URL pattern, because half of what the search returns are landing pages, not postings. That mode discovers but does not read (WebFetch returns 403 on all of them), so it hands back links to open and must not write unconfirmed dates into the registry.

Anyone who gets their own API key turns it on by setting an environment variable: `keys` explains how to get each one and warns when one is missing. The analysis of each platform, with the measured status codes, is in `skills/freelance-scan/references/platforms.md`.

| Skill | Description | Usage |
|-------|-------------|-----|
| `/freelance-hunt` | Orchestrator: extends the career workspace with contracts and a Connects ledger, sets the rate floor and capacity, and routes | `[setup\|status\|next]` |
| `/freelance-profile` | Platform profile: niche title, the first 250 characters of the overview, portfolio items, specialized profiles and a rate derived from the floor | `[audit\|title\|overview\|portfolio\|rate]` |
| `/fiverr-gig` | The offer side on Fiverr: "I will" title and tags, the three packages split by scope, gallery, FAQ and a price above the net floor | `[audit\|title\|packages\|gallery\|faq\|price]` |
| `/freelance-scan` | Scores postings (technical fit + economic viability + likelihood the posting is real) with dedup across runs. `search` over public sources with no API key (GetOnBrd, Himalayas), `web` reaches the marketplaces via WebSearch + SEO-noise triage, `market` for rates, `keys` for the sources that take your own credential | `[search\|web\|market\|keys\|sources\|pasted post]` |
| `/client-screen` | Client risk before spending Connects: verified payment, hire rate, budget/scope gap, red flags. Records the discard too | `[job-url\|note\|post]` |
| `/freelance-proposal` | A proposal that survives the list view (first 2 lines) + a bid above the net floor: fixed vs hourly, risk buffer, fee | `[note\|job-url]` |
| `/freelance-kickoff` | Turns the won contract into a plan: breaks scope into deliverables and acceptance criteria, and checks it fits the quoted hours before starting | `[contract note\|client]` |
| `/freelance-deliver` | Execution loop: logs billable and non-billable hours, catches scope creep the day it happens, and quotes the change order before doing the work | `[log\|check\|change\|close]` |
| `/freelance-pipeline` | Business diagnosis: Connects ROI, funnel, real effective rate net of non-billable hours, utilization, concentration, scope drift | `[--since YYYY-MM-DD]` |

---

## Arcane's internal skills

`/skill-test` and `/skill-improve` (in General) also serve to maintain the Arcane repo itself.

---

## Common flags

Many skills support these optional flags:

- `--review full|lean|solo` — review mode (full = multi-agent, lean = fast, solo = no review)
- `--stack software|gamedev` — forces the division when the project is dual
- `--platform pc|console|mobile|all` — target platform

## Notes

- Skills run in the context of the current project, not Arcane's
- Some skills require configured integrations (ClickUp, Jira, Figma, Slack, Google)
- The `team-*` skills orchestrate multiple specialized agents in parallel
- The `scaffold-*` skills create projects from scratch with the Educabot structure
