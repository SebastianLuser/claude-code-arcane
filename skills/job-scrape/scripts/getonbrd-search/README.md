# GetOnBoard Search CLI

Busca ofertas en GetOnBoard (job board tech de LATAM) via su API pública v0. Sin auth, sin API key, cero dependencias - corre con Node 24+ directamente. Espejo del contrato de `linkedin-search/` para que `/job-scrape` pueda usar ambos de forma intercambiable.

Construido a medida siguiendo el patrón `/add-portal` de MadsLorentzen/ai-job-search (investigar endpoint → scaffold con el mismo contrato → test en vivo).

## Uso

### Buscar ofertas

```bash
node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q "<keywords>" [flags]
```

Flags:
- `-q / --query <texto>` - **requerido**, minimo 3 chars. La API hace AND de todos los terminos.
- `--jobage <dias>` - publicada en los ultimos N dias (filtro client-side sobre `published_at`).
- `--remote <modo>` - `remote` | `hybrid` | `onsite` (filtro client-side).
- `--page <n>` - paginacion (20 resultados por pagina).
- `-n / --limit <n>` - tope de resultados (`0` no emite ninguno).
- `--brief` - solo en `json`: trunca cada `description` a 300 chars y marca `description_truncated`. Los JD completos son ~80% del payload, asi que para triage conviene `--brief` y despues `detail` del shortlist.
- `--format json|table|plain` - default `json`.

Sin flag `--location`: GetOnBoard es LATAM/remoto por naturaleza; filtrar con `--remote` y leer `countries` en el JSON.

### Detalle de una oferta

```bash
node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts detail <slug|url> [--format json|plain]
```

Acepta el `ID` (slug) de los resultados de search o cualquier URL de getonbrd.com (`/jobs/...` o `/empleos/...`, con o sin categoria). Dos capas:
1. **Search API** (queries progresivas derivadas del slug): datos completos, incluye `applications_count`.
2. **Microdata fallback** (pagina SSR, schema.org JobPosting): para ofertas viejas o fuera del indice. Detecta y marca ofertas **CERRADAS**.

## Datos que devuelve (JSON)

`id` (slug), `title`, `company`, `location`, `date` (ISO), `url`, `seniority` (Junior/Semi Senior/Senior/Expert), `remote`, `remote_modality` (`remote_local`/`hybrid`/`no_remote`...), `remote_zone`, `countries`, `salary_min_usd_month`/`salary_max_usd_month` (USD/mes cuando esta publicado), `applications_count` (util para la dimension "calidad de la oferta" de la rubrica), `description` (texto plano).

## Ejemplos

```bash
# Fullstack, ultimas 2 semanas
node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q "fullstack developer" --jobage 14 --format table

# Triage barato: estructurado completo, JD truncado
node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q "fullstack developer" --jobage 14 --brief

# .NET remoto
node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts search -q ".NET developer" --remote remote --format table

# JD completo de una oferta
node .claude/skills/job-scrape/scripts/getonbrd-search/cli.ts detail "https://www.getonbrd.com/jobs/programming/full-stack-developer-buildwithin-remote-b1ef" --format plain
```

## Notas

- API publica en beta (`api/v0`); si cambia, el fallback de microdata sigue funcionando.
- Errores a **stderr** como `{ "error": "...", "code": "..." }` con exit code `1`.
- Volumen bajo por cortesia; la API es publica pero no esta pensada para bulk scraping.
- Referencia de endpoints: `url-reference.md`.
