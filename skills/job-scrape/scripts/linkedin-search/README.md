# LinkedIn Search CLI

Busca ofertas en el job board publico de LinkedIn (endpoints `jobs-guest`) para cualquier pais/region y remoto. Sin autenticacion, sin API key, **cero dependencias** - corre con Node 24+ directamente (type stripping nativo de TypeScript).

Vendoreado de [MadsLorentzen/ai-job-search](https://github.com/MadsLorentzen/ai-job-search) (`.agents/skills/linkedin-search/`), con dos parches locales:
- Imports `./x.js` → `./x.ts` (Bun los reescribe solo; Node necesita la extension real).
- `process.exit(code)` → `process.exitCode = code` (el exit abrupto crasheaba libuv en Windows con stdout sin drenar).

## ⚠️ Uso personal, volumen bajo

Lee paginas publicas de LinkedIn; el acceso automatizado va contra sus Terms of Service. **Mantener volumen bajo** (busquedas puntuales, no barridos masivos ni uso comercial). El CLI reintenta 429/5xx con backoff exponencial.

## Comandos

### Buscar ofertas

```bash
node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts search -l "<lugar>" [flags]
```

Flags:
- `-l / --location <texto>` - **requerido.** Place string de LinkedIn: `"Spain"`, `"European Union"`, `"Remote"`, `"Berlin, Germany"`.
- `-q / --query <texto>` - keywords (titulo, skill, rol). Recomendado.
- `--jobage <dias>` - publicado en los ultimos `1`, `7`, `14` o `30` dias.
- `--remote <modo>` - `remote`, `hybrid` u `onsite`.
- `--page <n>` - paginacion (10 resultados por pagina).
- `-n / --limit <n>` - tope de resultados emitidos.
- `--format json|table|plain` - default `json`.

### Detalle completo de una oferta

```bash
node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts detail <id|url> [--format json|plain]
```

Acepta el ID numerico del search, una URL `jobs/view/...` o un URN. Devuelve descripcion completa, seniority, tipo de empleo, industrias y link.

## Ejemplos

```bash
# Fullstack remoto en un pais, ultima semana
node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts search -q "full stack developer" -l "Spain" --remote remote --jobage 7 --format table

# Backend .NET remoto en una region
node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts search -q ".NET developer" -l "European Union" --remote remote --jobage 14 --format table

# Game developer remoto global
node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts search -q "game developer" -l "Remote" --jobage 30 --format table

# JD completo de una oferta
node .claude/skills/job-scrape/scripts/linkedin-search/cli.ts detail 4434569000 --format plain
```

## Notas

- Errores van a **stderr** como `{ "error": "...", "code": "..." }` con exit code `1`.
- `--format json` sirve para encadenar: sacar IDs y pasarlos a `detail`, o scorear ofertas contra los criterios (`match_score`) antes de crear notas en `03-Aplicaciones/` del career workspace.
- Referencia de como se construyen las URLs upstream: `url-reference.md`.
