---
name: personal-brand
description: "Build a job-search personal brand on LinkedIn: generate a sequenced backlog of post ideas across credibility pillars (3-4 posts a week) that builds authority before outreach, plus a weekly plan of what to post, when, and who to engage with. Triggers: marca personal, personal brand, contenido LinkedIn, post ideas LinkedIn, calendario de contenido, autoridad LinkedIn, plan de la semana, qué postear, construir audiencia para buscar trabajo."
argument-hint: "[plan | week | ideas <N> | draft <idea>]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit
---

# Personal Brand - Autoridad en LinkedIn para la búsqueda

Construís una marca personal en LinkedIn orientada a conseguir trabajo: un backlog **secuenciado** de ideas de post (3-4 por semana) y un plan semanal que construye autoridad y credibilidad *antes* de salir a hacer outreach, de modo que cuando escribas a un recruiter ya tengan contexto de quién sos.

Trabajás contra el **perfil maestro** (`01-Perfiles/`) y el rol/empresas objetivo. Output: un plan de contenido en `01-Perfiles/Personal Brand.md` (o `07-Recursos/`).

## Los 4 pilares

1. **Builder credibility** - qué construiste/entregaste, con resultados. Demuestra que hacés, no solo que sabés.
2. **Lessons from current role** - aprendizajes concretos del trabajo actual/reciente (técnicos y de proceso).
3. **POVs on your domain** - opiniones/tendencias de tu dominio. Te posiciona como alguien que piensa, no solo ejecuta.
4. **Behind-the-scenes of the job search** - el viaje de la búsqueda (en su justa medida): genera cercanía y a veces atrae oportunidades directas.

Ver `references/post-pillars.md` para ángulos, hooks y formatos por pilar.

## Modos

### `plan` - Backlog de 90 ideas secuenciadas
1. Confirmar rol objetivo, empresas y los temas donde el usuario tiene autoridad real (del perfil maestro).
2. Generar **90 ideas** repartidas en los 4 pilares. Cada idea = **hook + ángulo + formato** (texto, carrusel, lista, story, hot-take).
3. **Secuenciar**: las primeras ~4 semanas priorizan pilares 1-3 (construir autoridad); recién después meter más del pilar 4 y empujar el outreach. La autoridad va antes que el pedido.
4. Entregar como tabla/calendario (día → idea → pilar → formato).

### `ideas <N>` - Lote de N ideas
Generar N ideas frescas para un pilar o tema puntual, mismo formato hook+ángulo+formato.

### `week` - La semana
Una vez por semana, el mismo día. Leé `01-Perfiles/LinkedIn Log.md` para no repetir un tema de las últimas dos semanas, y preguntá **qué pasó esta semana** (algo que construiste, un número, un error, una discusión): de ahí salen los posts, no del backlog en abstracto.

- **Qué postear:** 3-4 posts, nunca dos del mismo tipo seguidos. Mezcla: uno de **prueba** (algo que pasó, con número), uno de **opinión** (una posición que puede costarte seguidores), uno de **enseñar** (algo que el lector puede hacer hoy), y cada dos semanas una **historia** (escena con un costo). Por slot: tema, el ángulo concreto de esta semana y el número de hook de `/linkedin-post` (`references/hooks.json`). "IA" no es un ángulo.
- **Cuándo:** cuando la audiencia está en su escritorio, en *su* zona horaria. Para una audiencia de empresas, martes a jueves a la mañana es el default razonable. Decilo claro: el día y la hora importan mucho menos que la primera línea; si el usuario optimiza horarios antes de tener hooks que funcionen, está puliendo lo equivocado.
- **Con quién interactuar (10):** 5 de **alcance** (gente con la audiencia que querés, en cuyos posts podés aportar; comentá temprano), 3 **pares** (mismo nivel y campo: los que devuelven), 2 **decisores** (recruiters o hiring managers de empresas objetivo, de `04-Empresas/` y `05-Contactos/`): semanas de comentarios útiles antes de cualquier DM, y nunca pedir en un comentario. ~20 minutos por día, antes de postear.

Salida: la semana día por día (post o "solo engagement") + la lista de 10, escrita en `01-Perfiles/Personal Brand.md`. Nada se programa ni se publica: el usuario ejecuta el plan. "Escribí el martes" → `/linkedin-post`.

### `draft <idea>` - Escribir un post
Delegá en `/linkedin-post`: tres hooks, borrador con la voz del perfil maestro, humanizado y puntuado antes de mostrarlo.

## Principios

- **Hook primero.** La primera línea decide si lo leen (en el feed se ve cortado). Específico, con tensión o número.
- **Mostrar, no proclamar.** "Reduje el deploy de 40min a 4" > "Soy bueno en CI/CD".
- **Una idea por post.** Foco.
- **Consistencia > volumen.** El plan asume un ritmo sostenible: 3-4 posts por semana sostenidos rinden más que siete flojos (el quinto de la semana suele ser el que baja el promedio); los otros días, engagement. El backlog de 90 ideas alcanza para varios meses.
- **Autoridad antes que pedido.** No arranques pidiendo trabajo; primero aportá valor.
- **Verdad.** Nada de logros inflados - la audiencia y los recruiters lo notan.
- El modo `week` está adaptado de linkedin-agent-skill de Jake Schincariol (MIT).

## Idioma

Según tu audiencia objetivo: inglés para alcance internacional, español si tu mercado es local. Se puede alternar.

## Handoff

Pedí aprobación (approval) antes de escribir el plan en el workspace. Cuando el backlog está READY, combinalo con `/linkedin-optimize` (perfil a tono con el contenido) y, tras ~30 días de autoridad, con `/cold-outreach` para el outreach.
