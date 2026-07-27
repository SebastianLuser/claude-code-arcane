# LinkedIn Search CLI

Busca ofertas en el job board publico de LinkedIn (endpoints `jobs-guest`) para cualquier pais/region y remoto. Sin autenticacion, sin API key, **cero dependencias**: solo la stdlib de Python 3.

El script es `scripts/linkedin_search.py`. Portado del CLI en TypeScript vendoreado de [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) (`.agents/skills/linkedin-search/`): los scripts de skill corren en el proyecto del usuario sin build step, y TypeScript ahi implica exigir Node 24+ para el type stripping nativo (ver `docs/coding-standards.md`). La traduccion se verifico comparando la salida de las dos versiones sobre el mismo HTML y el mismo detalle: identica.

Diferencias respecto del upstream, todas deliberadas:
- `normalize_id` acepta el slash final: la URL del boton de compartir es `/jobs/view/<id>/?refId=...` y el regex original solo anclaba en `?`.
- Warning `NO_CARDS_PARSED` a stderr cuando la respuesta trae contenido pero se parsean 0 cards (cambio de markup vs "no hay ofertas").
- `&nbsp;` se normaliza a espacio comun: U+00A0 es invisible y rompe el matching de keywords en el JD.
- Salida UTF-8 forzada: en Windows `stdout` es cp1252 y cualquier acento del JD reventaba al redirigir.

## ⚠️ Uso personal, volumen bajo

Lee paginas publicas de LinkedIn; el acceso automatizado va contra sus Terms of Service. **Mantener volumen bajo** (busquedas puntuales, no barridos masivos ni uso comercial). El script reintenta 429/5xx con backoff exponencial. `/job-scrape` pide confirmacion explicita antes de la primera corrida de la sesion.

## Comandos

### Buscar ofertas

```bash
python .claude/skills/job-scrape/scripts/linkedin_search.py search -l "<lugar>" [flags]
```

Flags:
- `-l / --location <texto>` - **requerido.** Place string de LinkedIn: `"Spain"`, `"European Union"`, `"Remote"`, `"Berlin, Germany"`.
- `-q / --query <texto>` - keywords (titulo, skill, rol). Recomendado.
- `--jobage <dias>` - publicado en los ultimos `1`, `7`, `14` o `30` dias.
- `--remote <modo>` - `remote`, `hybrid` u `onsite`.
- `--page <n>` - paginacion (10 resultados por pagina).
- `-n / --limit <n>` - tope de resultados emitidos (`0` no emite ninguno).
- `--format json|table|plain` - default `json`.

### Detalle completo de una oferta

```bash
python .claude/skills/job-scrape/scripts/linkedin_search.py detail <id|url> [--format json|plain]
```

Acepta el ID numerico del search, una URL `jobs/view/...` (con o sin slash final y query params, como la que da el boton de compartir) o un URN. Devuelve descripcion completa, seniority, tipo de empleo, industrias y link.

## Ejemplos

```bash
# Fullstack remoto en un pais, ultima semana
python .claude/skills/job-scrape/scripts/linkedin_search.py search -q "full stack developer" -l "Spain" --remote remote --jobage 7 --format table

# Backend .NET remoto en una region
python .claude/skills/job-scrape/scripts/linkedin_search.py search -q ".NET developer" -l "European Union" --remote remote --jobage 14 --format table

# Game developer remoto global
python .claude/skills/job-scrape/scripts/linkedin_search.py search -q "game developer" -l "Remote" --jobage 30 --format table

# JD completo de una oferta
python .claude/skills/job-scrape/scripts/linkedin_search.py detail 4434569000 --format plain
```

## Notas

- Errores van a **stderr** como `{ "error": "...", "code": "..." }` con exit code `1`. Los diagnosticos no fatales usan la misma forma con clave `warning` (ej. `NO_CARDS_PARSED`) y no cambian el exit code.
- El search de LinkedIn **no es determinista**: dos corridas seguidas con los mismos parametros pueden devolver ofertas distintas. No asumir que "no aparece" significa "no existe"; el dedup de `/job-scrape` esta justamente para eso.
- `--format json` sirve para encadenar: sacar IDs y pasarlos a `detail`, o scorear ofertas contra los criterios (`match_score`) antes de crear notas en `03-Aplicaciones/` del career workspace.
- Referencia de como se construyen las URLs upstream: `linkedin-urls.md`.
- Tests de los parsers: `tests/job_scrape/test_linkedin_search.py` en el repo de Arcane.
