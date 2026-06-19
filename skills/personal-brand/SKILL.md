---
name: personal-brand
description: "Build a job-search personal brand on LinkedIn: generate a sequenced backlog of post ideas across credibility pillars (1 post/day) that builds authority before outreach. Triggers: marca personal, personal brand, contenido LinkedIn, post ideas LinkedIn, calendario de contenido, autoridad LinkedIn, 1 post por dia, construir audiencia para buscar trabajo."
argument-hint: "[plan | ideas <N> | draft <idea>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Personal Brand — Autoridad en LinkedIn para la búsqueda

Construís una marca personal en LinkedIn orientada a conseguir trabajo: un backlog **secuenciado** de ideas de post (ritmo 1/día) que construye autoridad y credibilidad *antes* de salir a hacer outreach, de modo que cuando escribas a un recruiter ya tengan contexto de quién sos.

Trabajás contra el **perfil maestro** (`01-Perfiles/`) y el rol/empresas objetivo. Output: un plan de contenido en `01-Perfiles/Personal Brand.md` (o `07-Recursos/`).

## Los 4 pilares

1. **Builder credibility** — qué construiste/entregaste, con resultados. Demuestra que hacés, no solo que sabés.
2. **Lessons from current role** — aprendizajes concretos del trabajo actual/reciente (técnicos y de proceso).
3. **POVs on your domain** — opiniones/tendencias de tu dominio. Te posiciona como alguien que piensa, no solo ejecuta.
4. **Behind-the-scenes of the job search** — el viaje de la búsqueda (en su justa medida): genera cercanía y a veces atrae oportunidades directas.

Ver `references/post-pillars.md` para ángulos, hooks y formatos por pilar.

## Modos

### `plan` — Backlog de 90 ideas secuenciadas
1. Confirmar rol objetivo, empresas y los temas donde el usuario tiene autoridad real (del perfil maestro).
2. Generar **90 ideas** repartidas en los 4 pilares. Cada idea = **hook + ángulo + formato** (texto, carrusel, lista, story, hot-take).
3. **Secuenciar**: los primeros ~30 días priorizan pilares 1–3 (construir autoridad); recién después meter más del pilar 4 y empujar el outreach. La autoridad va antes que el pedido.
4. Entregar como tabla/calendario (día → idea → pilar → formato).

### `ideas <N>` — Lote de N ideas
Generar N ideas frescas para un pilar o tema puntual, mismo formato hook+ángulo+formato.

### `draft <idea>` — Escribir un post
Convertir una idea en un post listo para publicar: hook fuerte en la primera línea, cuerpo escaneable, CTA o pregunta de cierre. Tono humano, sin clichés de LinkedIn ("I'm humbled to announce…").

## Principios

- **Hook primero.** La primera línea decide si lo leen (en el feed se ve cortado). Específico, con tensión o número.
- **Mostrar, no proclamar.** "Reduje el deploy de 40min a 4" > "Soy bueno en CI/CD".
- **Una idea por post.** Foco.
- **Consistencia > perfección.** El plan asume ritmo sostenible; mejor 1/día simple que 1/semana elaborado.
- **Autoridad antes que pedido.** No arranques pidiendo trabajo; primero aportá valor.
- **Verdad.** Nada de logros inflados — la audiencia y los recruiters lo notan.

## Idioma

Según tu audiencia objetivo: inglés para alcance internacional, español si tu mercado es local. Se puede alternar.

## Handoff

Pedí aprobación (approval) antes de escribir el plan en el workspace. Cuando el backlog está READY, combinalo con `/linkedin-optimize` (perfil a tono con el contenido) y, tras ~30 días de autoridad, con `/cold-outreach` para el outreach.
