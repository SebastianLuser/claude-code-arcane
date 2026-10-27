# Technical Preferences

Global technical preferences. Override them in specific projects via their own `CLAUDE.md`.

## Preferred Languages by Domain

| Domain | First choice | Second | Why |
|---------|---------------|---------|---------|
| Backend (services) | Go | Node/TS | Performance, simplicity, strict typing |
| Backend (AI/ML) | Python | - | Ecosystem maturity |
| Web frontend | TypeScript + React/Next | Vue | Typing, ecosystem |
| Mobile | Flutter | React Native | Single codebase, performance |
| Game dev | C# (Unity) | C++ (Unreal) | Depends on the engine |
| Scripts/tooling | Python / Bash | Go | Simple, fast to write |

## Preferred Frameworks

- **Go:** Gin (via team-ai-toolkit), GORM, Viper
- **Node:** NestJS (Clean Arch) or Fastify (performance)
- **Python:** FastAPI (APIs), Django (full-stack), SQLAlchemy
- **React:** Next.js 15+ (App Router, RSC)
- **Mobile:** Flutter + Riverpod

## Databases

- **Relational:** PostgreSQL (always the first choice)
- **Cache:** Redis
- **NoSQL doc:** MongoDB (only if there is a clear reason)
- **Search:** Elasticsearch / Meilisearch
- **Time series:** TimescaleDB

## Infra

- **Cloud:** GCP (preferred), AWS (secondary)
- **Containers:** Docker + Kubernetes (GKE)
- **CI/CD:** GitHub Actions
- **IaC:** Terraform
- **Monitoring:** Grafana + Prometheus + Loki
- **APM:** Datadog or Sentry

## Game Engines

- **2D/indie:** Unity 6
- **AAA/complex 3D:** Unreal Engine 5
- **VR:** Unity 6 (OpenXR)

## Team Tools

- **Project management:** ClickUp (Educabot) + Jira (for the ALZ/TICH/TUNI/VIA projects)
- **Docs:** Google Docs + Coda
- **Design:** Figma
- **API testing:** Postman
- **Communication:** Slack

## Anti-Patterns to Avoid

- **Premature microservices.** Start with a well-modularized monolith.
- **GraphQL just because.** Use REST if the data shape is stable.
- **Heavy ORMs in hot paths.** Raw SQL when performance matters.
- **Global state management for everything.** Context/props first, Redux/Zustand only when needed.
- **DDD in CRUD apps.** Overkill.
