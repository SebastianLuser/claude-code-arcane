# Dedup entre corridas de /freelance-scan

Si `+job-hunt` está instalado, la fuente de verdad es `../job-scrape/references/dedup-playbook.md` y el archivo de estado es **el mismo**: no se crean dos. Este archivo es el resumen autosuficiente para quien instaló `+freelance` solo.

## Dónde vive

`<workspace>/tools/job_scraper/seen_jobs.json`, no entre las notas: es dato de máquina, y el vault de Obsidian no debería indexarlo.

## Matriz de fuente de verdad

| Dato | Fuente de verdad | Quién escribe |
|---|---|---|
| "Ya vi esta oferta" + triage + descartes pre-nota | `seen_jobs.json` | `/freelance-scan` |
| Estado del pipeline, `match_score` definitivo | Frontmatter de la nota en `03-Aplicaciones/` | `/client-screen` crea; `/job-outcome` actualiza |
| Vista humana de la cola | `00-Dashboard.md` | Derivado de las notas |

El flujo es **unidireccional**: `seen_jobs` → nota → dashboard. Cuando una entrada pasa a `nota_creada` se congela y conserva solo el puntero a la nota; el pipeline sigue en la nota y nunca se sincroniza de vuelta. Por eso `propuesta_enviada` no existe en este archivo.

## Claves de dedup

1. **URL canónica**: sin parámetros de tracking (`utm_*`, referidos), reducida al identificador de la oferta.
2. **`job_key`** = `slug(cliente)|slug(titulo)`: lowercase, sin acentos ni puntuación, sin sufijos legales (inc, llc, sa), sin calificadores del título entre paréntesis ("(remote)", "(urgent)"). Detecta la misma oferta con URLs distintas.
3. **Matching blando** (mismo cliente + alto solapamiento de tokens del título) es **warning**, nunca dedup automático: un cliente puede tener dos proyectos parecidos y legítimos.

## Reposteos: el caso propio de Upwork

Es común que un cliente cierre una oferta y la vuelva a publicar, a veces varias veces. Con URL nueva, la URL canónica no alcanza - lo detecta el `job_key`.

Cuando un `job_key` matchea una entrada en `descartado`, **no volver a triagear de cero**: avisar que ya se descartó antes y por qué, y dejar que el usuario decida si algo cambió (presupuesto corregido, alcance aclarado). Un cliente que republica la misma oferta cinco veces sin cambiar el presupuesto es en sí una señal para `/client-screen`.

## Mantenimiento

- **Punteros rotos:** al arrancar, validar que toda entrada `nota_creada` apunte a una nota que existe. Reportar las rotas, no borrarlas en silencio.
- **Poda (opt-in):** entradas `new` o `descartado` con `last_seen` de más de 90 días se pueden borrar, solo a pedido del usuario. Las `nota_creada` no se podan: son el historial contra el que se mide el pipeline.
- **Primer run:** el archivo arranca con el esqueleto vacío. Si ya hay notas en `03-Aplicaciones/` con `tipo: freelance`, ofrecer backfillearlas como `nota_creada`.
