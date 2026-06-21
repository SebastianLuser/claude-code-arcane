---
name: job-search
description: "Find, score and prioritize job openings against your profile, then build a structured 7-day search plan with daily goals. Creates application and company notes in the workspace. Triggers: buscar trabajo, encontrar ofertas, scorear ofertas, plan de busqueda laboral, priorizar postulaciones, job search plan, donde aplicar."
argument-hint: "[search <query> | score <job-url> | plan]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebFetch, WebSearch
---

# Job Search — Búsqueda, scoring y plan

Encontrás ofertas, las **scoreás** contra el perfil del usuario, priorizás, y armás un **plan de búsqueda de 7 días** con objetivos diarios. Alimentás el workspace con notas de aplicación y empresa para que el resto del flujo (`/cv-tailor`, `/cover-letter`, etc.) las consuma.

## Inputs

- **Perfil(es) objetivo** (`01-Perfiles/`): rol, seniority, stack, modalidad, mercado, **score mínimo** (default 75), salario mínimo, keywords y keywords a excluir.
- Fuentes de ofertas que use el usuario (job boards, WeWorkRemotely, LinkedIn, Workable, etc.).

## Modos

### `search <query>` — Encontrar ofertas
1. **Sourcing.** Conseguir ofertas frescas que matcheen el perfil (rol + stack + modalidad + mercado). Dos caminos:
   - **Apify MCP (opcional).** Si hay un MCP de Apify conectado, podés usar un actor de scraping de LinkedIn Jobs para traer ofertas estructuradas. Ejemplo de pedido: *"Scrapeá LinkedIn jobs para [rol] posteadas en los últimos 7 días en empresas de 50–5000 empleados; filtrá por match con mi background en [dominio]; devolvé tabla rankeada con empresa, rol, ubicación, salario, fecha de posteo y fit score 1–10 basado en mi resume; marcá el top 10 para aplicar hoy."* Buscá el actor con ToolSearch (`apify`) si el MCP está presente. **⚠️ OBLIGATORIO: antes de invocar Apify, mostrá el warning de abajo y pedí confirmación explícita.**
   - **WebSearch/WebFetch (default recomendado).** Camino sin Apify: buscar en job boards (muchos con feed/API pública: WeWorkRemotely, RemoteOK, etc.) y fetchear los JDs. Es el default seguro y gratis.

> ### ⚠️ Warning Apify — mostralo SIEMPRE antes de usar esta parte
>
> Antes de correr cualquier actor de Apify (especialmente scraping de LinkedIn), presentá estos puntos al usuario y esperá confirmación explícita. No invoques Apify "en silencio".
>
> 1. **No es gratis.** Apify cobra por uso (compute units / por resultado); un scrape grande consume crédito. El tier free es limitado.
> 2. **Scrapear LinkedIn viola sus Términos de Servicio.** LinkedIn detecta y bloquea scraping activamente y puede **restringir o banear la cuenta**. La legalidad de scrapear datos públicos está en zona gris (caso hiQ vs LinkedIn); el riesgo de ToS/cuenta es real y es del usuario, no de Apify. Preferir actors sobre **job boards públicos** antes que LinkedIn directo; si igual se scrapea LinkedIn, hacerlo de forma consciente y no con una cuenta crítica.
> 3. **El API token de Apify es sensible.** Autoriza correr actors (y gastar el plan) en nombre del usuario. Mantenerlo seguro; no exponerlo ni commitearlo. (Apify no recolecta conversaciones/tokens y trata a los actors como no confiables: les da un proxy y no les entrega las credenciales — un actor malicioso puede usar las tools habilitadas pero no exfiltrar el token.)
> 4. **Calidad/estabilidad variable.** Los scrapers de LinkedIn se rompen seguido; los resultados pueden venir incompletos o desactualizados.
>
> Si el usuario no confirma, usá el camino WebSearch/WebFetch.
2. Para cada oferta candidata: extraer rol, empresa, stack, modalidad, ubicación, rango salarial, link, fecha de cierre.
3. Scorear (ver rúbrica) y filtrar por el umbral del perfil.
4. Crear nota en `03-Aplicaciones/` (template `Aplicacion`, estado `interesado`, con `score`) + nota en `04-Empresas/` (template `Empresa`) por cada una sobre el umbral.
5. Actualizar el `00-Dashboard.md` con las activas por prioridad, marcando el **top 10 para hoy**.

### `score <job-url>` — Scorear una oferta puntual
1. WebFetch del JD.
2. Aplicar la rúbrica contra el perfil → score 0–100 + breakdown + recomendación (aplicar / borderline / skip).
3. Si pasa, crear las notas como arriba.

### `plan` — Plan de búsqueda de 7 días
Generar un plan accionable con objetivos diarios. Ejemplo de esqueleto (ajustar al estado del usuario):

- **Día 1 — Base.** Perfil maestro + perfiles por rol al día; LinkedIn optimizado (`/linkedin-optimize`).
- **Día 2 — Sourcing.** Buscar y scorear 15–20 ofertas; quedarte con las ≥ umbral.
- **Día 3 — Research.** Empresas + contactos objetivo de las top.
- **Día 4 — Aplicaciones tanda 1.** CV custom + cover letter para las 5 de mayor prioridad (`/cv-tailor`, `/cv-ats-export`, `/cover-letter`).
- **Día 5 — Outreach.** Mensajes a recruiters/hiring managers de las top (`/cold-outreach`).
- **Día 6 — Aplicaciones tanda 2** + follow-ups de la tanda 1.
- **Día 7 — Review.** Métricas (aplicadas / respuestas / entrevistas), ajustar perfil/CV según señales, planear próxima semana.

## Rúbrica de scoring

Ver `references/scoring-rubric.md`. En resumen, score ponderado 0–100 sobre:
- Match de stack/skills (peso alto)
- Seniority correcto (penalizar over/under-qualified)
- Modalidad y mercado/elegibilidad (remoto, zona horaria, visa)
- Salario vs mínimo
- Cultura/etapa según preferencia
- Señales de calidad de la oferta (claridad, recencia, # aplicantes)

Umbral default ≥75 (configurable en el frontmatter del perfil, campo `match_score_minimo`).

## Tracking

- Estados de aplicación: `interesado` → `aplicado` → `en proceso` → `entrevista` → `oferta` / `rechazado` / `descartado`.
- Mantener el `00-Dashboard.md` como vista única: activas por prioridad, próximas entrevistas, qué cierra pronto, a seguir esta semana.

## Reglas

- No aplicar a todo: el umbral existe para concentrar esfuerzo donde hay match real.
- Marcar gaps con honestidad al scorear (no inflar el match).
- Respetar elegibilidad (visa/zona horaria) — un score alto con bloqueo de elegibilidad no sirve.
- No guardar datos sensibles de recruiters en remotos sin confirmación.

## Handoff

Confirmá (approval) antes de crear notas de aplicación/empresa o tocar el Dashboard. Cuando las ofertas priorizadas están READY, el siguiente paso es `/cv-tailor` sobre las de prioridad alta.
