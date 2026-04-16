# Technical Preferences

Preferencias técnicas globales. Override en proyectos específicos via su propio `CLAUDE.md`.

## Lenguajes Preferidos por Dominio

| Dominio | Primera opción | Segunda | Por qué |
|---------|---------------|---------|---------|
| Backend (servicios) | Go | Node/TS | Performance, simplicidad, typing estricto |
| Backend (AI/ML) | Python | - | Ecosystem madurez |
| Frontend web | TypeScript + React/Next | Vue | Typing, ecosystem |
| Mobile | Flutter | React Native | Single codebase, performance |
| Game dev | C# (Unity) / GDScript (Godot) | C++ (Unreal) | Depende del engine |
| Scripts/tooling | Python / Bash | Go | Simple, rápido de escribir |

## Frameworks Preferidos

- **Go:** Gin (via team-ai-toolkit), GORM, Viper
- **Node:** NestJS (Clean Arch) o Fastify (performance)
- **Python:** FastAPI (APIs), Django (full-stack), SQLAlchemy
- **React:** Next.js 15+ (App Router, RSC)
- **Mobile:** Flutter + Riverpod

## Databases

- **Relacional:** PostgreSQL (primera opción siempre)
- **Cache:** Redis
- **NoSQL doc:** MongoDB (solo si hay razón clara)
- **Search:** Elasticsearch / Meilisearch
- **Time series:** TimescaleDB

## Infra

- **Cloud:** GCP (preferido), AWS (secundario)
- **Contenedores:** Docker + Kubernetes (GKE)
- **CI/CD:** GitHub Actions
- **IaC:** Terraform
- **Monitoring:** Grafana + Prometheus + Loki
- **APM:** Datadog o Sentry

## Game Engines

- **Web/casual games:** Godot 4 (open source, MIT)
- **2D/indie:** Godot 4 o Unity 6
- **AAA/3D complejo:** Unreal Engine 5
- **VR:** Unity 6 (OpenXR)

## Herramientas de Equipo

- **Project management:** ClickUp (Educabot) + Jira (para proyectos ALZ/TICH/TUNI/VIA)
- **Docs:** Google Docs + Coda
- **Design:** Figma
- **API testing:** Postman
- **Communication:** Slack

## Anti-Patterns a Evitar

- **Microservicios prematuros.** Empezar con monolito bien modulado.
- **GraphQL porque sí.** Usar REST si el shape de datos es estable.
- **ORMs pesados en hot paths.** Raw SQL cuando la performance importa.
- **State management global en todo.** Context/props primero, Redux/Zustand solo cuando se necesita.
- **DDD en CRUD apps.** Overkill.
