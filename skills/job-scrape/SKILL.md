---
name: job-scrape
description: "Search job boards (bundled LinkedIn + GetOnBoard CLIs) with dedup memory across runs, score new openings against a role profile and offer to create application notes. Triggers: buscar ofertas nuevas, scrape de ofertas, correr los CLIs de busqueda, buscar trabajo en LinkedIn o GetOnBoard, nueva corrida de busqueda, ofertas con dedup."
argument-hint: "[perfil] [--jobage N]"
category: "career"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# /job-scrape - Búsqueda de ofertas con memoria

Corre los CLIs de búsqueda bundleados (LinkedIn + GetOnBoard, en `scripts/`) con los criterios de un perfil, deduplica contra `seen_jobs.json` y contra las notas existentes, scorea lo nuevo y ofrece crear notas de aplicación. Adaptado del skill job-scraper de MadsLorentzen/ai-job-search.

Argumentos: `$ARGUMENTS` (perfil, opcional; `--jobage N` para override de recencia, default 7 días).

Todas las rutas de notas son relativas al **career workspace** (flag `--workspace`, env `CAREER_WORKSPACE`, o `./career-workspace/`; lo crea `/job-hunt setup`). El estado de dedup vive en `<workspace>/tools/job_scraper/seen_jobs.json`.

## Requisitos

- **Node 24+** (los CLIs son TypeScript sin build: type stripping nativo; cero dependencias, sin package.json).
- Career workspace con al menos un perfil en `01-Perfiles/`.
- Opcional: skill `job-search` instalado (aporta la rúbrica de scoring completa).

## Pasos

1. **Perfil y criterios.** Si `$ARGUMENTS` no matchea una nota de `01-Perfiles/` (excluir `_index`), listar los perfiles y preguntar cuál usar. Leer del frontmatter: `keywords`, `keywords_excluir`, `match_score_minimo`, `salario_minimo_usd_mes`, `modalidad`, `seniority`, `regla_seniority`, `mercado_objetivo`.

2. **Cargar estado.** Leer `<workspace>/tools/job_scraper/seen_jobs.json` (si no existe, crearlo con el esqueleto de `references/seen_jobs.schema.json`; si hay notas previas en `03-Aplicaciones/`, ofrecer backfillearlas como `nota_creada`). Validar que toda entrada `nota_creada` apunte a una nota existente en `03-Aplicaciones/`; reportar punteros rotos sin frenar.

3. **Derivar queries.** 3-5 queries con forma de rol desde las keywords del perfil (ej. "fullstack developer", "backend developer"), no fragmentos de skill sueltos.

4. **Ejecutar los CLIs** (tolerar el fallo de uno y reportar la degradación):
   ```
   node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts search -q "<query>" -l "<location>" --remote remote --jobage <N> --format json
   node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q "<query>" --jobage <N> --format json
   ```
   La `<location>` de LinkedIn sale del `mercado_objetivo` del perfil; si es worldwide, usar además `-l "Remote"`. Volumen bajo: máximo ~5 queries por CLI por corrida.

5. **Normalizar y dedup intra-batch.** Canonicalizar URLs (sin utm/tracking; LinkedIn → `jobs/view/<id>`; GetOnBoard `/empleos/` → `/jobs/`), calcular `job_key = slug(empresa)|slug(titulo)` (reglas exactas en `references/dedup-playbook.md`). Misma oferta en ambas fuentes = una entrada con dos `sources[]`.

6. **Dedup contra historial:**
   - `seen_jobs.json`: entradas `nota_creada` o `descartado` se omiten de la tabla (contarlas aparte); entradas `new` re-vistas actualizan `last_seen` y se muestran marcadas "vista antes, sin decisión".
   - `03-Aplicaciones/`: Grep por `link_oferta` con las URLs canónicas y por nombre `<Empresa> - <Rol>`. Si hay match no registrado en seen_jobs, registrarlo como `nota_creada` (autocuración).
   - Matching blando (misma empresa + títulos muy parecidos): mostrar warning "posible duplicado de [[nota]]", no dedup automático.

7. **Quick score (todas las nuevas)** usando solo datos del listing:
   - `low`: keyword de `keywords_excluir` en el título (o en la description de GetOnBoard); seniority fuera de banda (aplicando `regla_seniority` del perfil si existe); `salary_max < salario_minimo_usd_mes`; o elegibilidad bloqueada (countries/remote_zone excluye el país del usuario según `mercado_objetivo`).
   - `high`: título matchea keywords del perfil + seniority en banda + sin bloqueos.
   - `medium`: el resto. Campos null = desconocido, no penalizar.

8. **Score completo solo para las `high`**, con la rúbrica de `.claude/skills/job-search/references/scoring-rubric.md` (si el skill job-search no está instalado, quedarse con el quick score y avisar). GetOnBoard ya trae el JD en el search; para LinkedIn usar `detail <id>` con un **cap de ~10 fetches por corrida** (ToS, volumen bajo), priorizando por quick score y recencia.

9. **Presentar tabla** ordenada por score: Título | Empresa | Fuente(s) | Salario | Score | Veredicto. Preguntar si alguna se descarta ya (registrar `status: descartado` + `descarte_motivo`).

10. **Persistir** todas las entradas nuevas/actualizadas en `seen_jobs.json` y actualizar el campo `actualizado`. JSON válido siempre (es un data file con schema).

11. **Ofrecer crear notas** para las de score ≥ `match_score_minimo`, con approval explícito **por oferta** (o "todas") antes de escribir. Por cada confirmada:
    - Nota en `03-Aplicaciones/<Empresa> - <Rol>.md` desde el template `Templates/Aplicacion.md` del workspace, frontmatter completo (`estado: interesado`, `match_score`, `fuente`, `link_oferta`, `salario_rango`, `modalidad`, `ubicacion`, `prioridad`) y sección "Match con mi perfil" con alineaciones y **gaps reales** (alimentan `/job-upskill`).
    - Fila en `00-Dashboard.md`, sección de aplicaciones activas, respetando las columnas exactas del header y escapando `\|` en wikilinks con alias.
    - Entrada seen_jobs → `status: nota_creada` + `nota`.

12. **Resumen final:** contadores (encontradas / ya vistas / nuevas / descartadas / notas creadas) y sugerencia de `/job-aplicar` para las top.

## Qué NO hace

- No crea notas sin confirmación individual.
- No genera CVs ni covers (eso es `/job-aplicar`).
- No marca `estado: aplicado` nunca.
- No edita notas existentes ni re-scorea ofertas ya con nota.
- No borra filas del dashboard ni entradas de seen_jobs.
- No se corre en loop ni excede los caps de volumen.

## Reglas

- Respetar la matriz de fuente de verdad de `references/dedup-playbook.md`: seen_jobs → nota → dashboard, unidireccional.
- Notas nuevas en el idioma del workspace, sin guiones largos, con wikilinks.
- Volumen bajo siempre en LinkedIn (el acceso automatizado va contra sus ToS; uso personal y puntual).
- Si ambos CLIs fallan, frenar y reportar (no degradar a scraping manual sin avisar).

## Handoff

Al cerrar la corrida, las ofertas con nota creada quedan READY para el pipeline de postulación: correr `/job-aplicar <nota|url>` con la mejor. Para gaps recurrentes detectados en los scores, `/job-upskill`.
