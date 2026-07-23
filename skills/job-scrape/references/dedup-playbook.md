# seen_jobs - estado de deduplicacion de /job-scrape

`seen_jobs.json` registra todas las ofertas vistas por `/job-scrape` para no volver a presentarlas en corridas siguientes. Schema formal en `seen_jobs.schema.json` (junto a este archivo). Vive en `<workspace>/tools/job_scraper/` (no entre las notas) porque es dato de maquina, no nota: el vault/Obsidian no lo indexa.

## Matriz de fuente de verdad (regla anti-divergencia)

| Dato | Fuente de verdad | Quien escribe |
|---|---|---|
| "Ya vi esta oferta" + triage + descartes pre-nota | `seen_jobs.json` | `/job-scrape` (y `/job-aplicar` al crear o descartar) |
| Estado del pipeline (`interesado -> aplicado -> ...`), match_score definitivo | Frontmatter de la nota en `03-Aplicaciones/` | `/job-aplicar` crea; `/job-outcome` actualiza |
| Vista humana de la cola | `00-Dashboard.md` | Derivado de las notas; `/job-aplicar` y `/job-outcome` fila a fila |

El flujo es **unidireccional**: seen_jobs -> nota -> dashboard. Cuando una entrada pasa a `status: nota_creada` se congela (solo conserva el puntero `nota`); el pipeline sigue en la nota y NUNCA se sincroniza de vuelta. Por eso no existe el estado `aplicado` en este archivo.

## Claves de dedup

1. **URL canonica** (por fuente): sin utm/tracking params; LinkedIn reducido a `linkedin.com/jobs/view/<id>`; GetOnBoard `/empleos/` -> `/jobs/`.
2. **`job_key`** = `slug(empresa)|slug(titulo)`: lowercase, sin acentos, sin puntuacion (conserva `.` interno: coderslab.io, .net), sin sufijos legales (inc, llc, sa...), sin calificadores del titulo entre parentesis ("(remote)", "(latam)"). Detecta la misma oferta publicada en dos fuentes con URLs distintas; se agrega a `sources[]` de la entrada existente en vez de duplicar.
3. Matching blando (misma empresa + alto solapamiento de tokens del titulo) = **warning** en `/job-scrape`, nunca dedup automatico (una empresa puede tener dos roles parecidos legitimos, o el mismo rol con titulo traducido).

## Mantenimiento

- **Punteros rotos:** `/job-scrape` valida al arrancar que toda entrada `nota_creada` apunte a una nota existente y reporta las rotas.
- **Poda (opt-in):** entradas `new`/`descartado` con `last_seen` de mas de 90 dias se pueden borrar. Solo a pedido del usuario, nunca automatico. Las `nota_creada` no se podan (son el historial de dedup contra aplicaciones reales).
- **Primer run:** el archivo arranca vacio (esqueleto del schema). Si ya existen notas en `03-Aplicaciones/`, `/job-scrape` ofrece backfillearlas como `nota_creada` (con `quick_score: null` y `url: "nota://<archivo>"` si la nota no tiene `link_oferta`).
