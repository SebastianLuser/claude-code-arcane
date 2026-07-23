# GetOnBoard API v0 - referencia de endpoints (verificada 2026-07-13)

Base: `https://www.getonbrd.com/api/v0` - sin autenticacion para endpoints publicos. Formato JSON:API.

## Search de ofertas

```
GET /search/jobs?query=<q>&per_page=<n>&page=<n>&expand[]=seniority&expand[]=company
```

- `query`: requerido, min 3 chars. Hace AND de todos los terminos (queries largas sobre-restringen).
- `per_page` / `page`: paginacion; `meta: { page, per_page, total_pages }` en la respuesta.
- `expand[]`: resuelve las referencias `seniority` y `company` inline (sin expand vienen solo como `{id, type}`).

Respuesta por job (`data[]`): `id` = slug, `links.public_url`, y en `attributes`:
`title`, `description` (HTML), `functions` (HTML), `desirable` (HTML), `benefits` (HTML), `remote` (bool), `remote_modality` (`remote_local` | `hybrid` | `no_remote` | ...), `remote_zone`, `countries[]`, `min_salary`/`max_salary` (USD/mes, null si no publican), `published_at` (unix), `applications_count`, `seniority.data.attributes.name`, `company.data.attributes.name`, `lang`, `perks[]`.

## Catalogos publicos

```
GET /seniorities   -> Junior=2, Semi Senior=3, Senior=4, Expert=5, Sin experiencia=1
GET /categories    -> categorias (programming, design-ux, etc.)
```

## Lo que NO es publico

- `GET /jobs/<slug>` devuelve **401** (endpoint privado, requiere API key de cuenta).
  Por eso `detail` del CLI usa search + filtro por id exacto, con fallback a microdata.

## Paginas SSR (fallback de detail)

- `https://www.getonbrd.com/jobs/<slug>` redirige 301 a `/jobs/<categoria>/<slug>`.
- La pagina renderiza microdata schema.org JobPosting via atributos `itemprop`:
  `title`, `hiringOrganization > name`, `datePosted`, `baseSalary > minValue/maxValue`,
  `description`, `qualifications` (seniority), `address`.
- Ofertas cerradas: pierden el `itemtype="http://schema.org/JobPosting"` pero conservan
  los `itemprop`; la pagina contiene el texto "Closed job" / "No longer accepting".
