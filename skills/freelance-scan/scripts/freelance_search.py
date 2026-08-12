#!/usr/bin/env python3
"""
Busca proyectos freelance en fuentes publicas y sin API key.

Toda fuente incluida cumple tres condiciones, porque este repo es publico y lo
instala cualquiera: no pide key ni registro, sus terminos permiten consumirla
desde una herramienta local, y expone trabajo freelance/contract de verdad.

Dos fuentes que parecen candidatas quedaron afuera a proposito (RemoteOK y
Remotive): sus terminos exigen un backlink do-follow desde un sitio web y
amenazan con suspender el acceso si falta. Un CLI local no tiene sitio web, asi
que no podemos cumplirlo, y usarlas igual haria que le suspendan la IP al
usuario. Detalle en ../references/platforms.md.

Ojo con los filtros: ni GetOnBrd ni Himalayas filtran por modalidad del lado del
servidor. Aceptan el parametro, devuelven 200, y te mandan full-time igual (se
probaron 7 variantes de nombre en GetOnBrd y 4 en Himalayas). Por eso el filtro
de freelance es del lado del cliente y hay que paginar para juntar volumen.

El hilo mensual "Ask HN: Freelancer? Seeking freelancer?" no esta en `search` a
proposito. Se midieron 6 meses con el propio subcomando `market`: 113
freelancers ofreciendose contra 2 ofertas de trabajo. Como fuente de proyectos no sirve; como fuente de que cobran
y como se posicionan otros, es la mejor que hay sin pagar. Por eso vive en el
subcomando `market`, que es lo que realmente es.

Buscar por categoria escondia trabajo real: "ecommerce" devolvia 0 mientras
habia un "Desarrollador Web Shopify" en el pool, porque nadie titula una oferta
"ecommerce". Por eso `search` expande sinonimos (ver SYNONYMS) y consulta el
server una vez por termino: el ranking del server depende de `query`, asi que
buscar "ecommerce" nunca trae el pool donde vive el de Shopify. Con --no-expand
se apaga.

Uso:
  python freelance_search.py sources
  python freelance_search.py search --query "unity developer" --source all
  python freelance_search.py search --query python --source getonbrd --pages 3
  python freelance_search.py market --months 3
  python freelance_search.py detail --source getonbrd --id <id>

Salida: JSON a stdout. Errores: JSON con "error" y "code" a stdout, exit 1.
Solo stdlib. Compatible con Python 3.9.
"""

from __future__ import annotations

import argparse
import collections
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (compatible; claude-code-arcane/freelance-scan; +https://github.com/SebastianLuser/claude-code-arcane)"
TIMEOUT = 30
MAX_RETRIES = 3
RETRY_SLEEP = 2

GETONBRD_API = "https://www.getonbrd.com/api/v0"
GETONBRD_JOBS = "https://www.getonbrd.com/jobs"
# /api/v0/modalities -> 1 Full time, 2 Part time, 3 Freelance, 4 Internship.
# Se filtra por locale_key y no por id: con expand[] el id viene como string "3"
# y sin expand como int 3, asi que comparar el id se rompe en silencio.
GETONBRD_FREELANCE_KEY = "freelance"
# expand[] inlinea los atributos de las referencias. Sin esto, company y tags
# vienen como {"data":{"id":...}} y no hay nombre que mostrar. Lo aprendimos de
# job-scrape/scripts/getonbrd_search.py, que ya lo usaba.
GETONBRD_EXPAND = ("company", "tags", "modality")

HIMALAYAS_API = "https://himalayas.app/jobs/api"
HIMALAYAS_CONTRACT = "Contractor"
HIMALAYAS_PAGE = 20  # el limit se topea en 20 aunque pidas mas

HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date"
HN_ITEM = "https://hn.algolia.com/api/v1/items"
HN_THREAD_QUERY = '"Seeking freelancer"'
HN_HIRING = "seeking_freelancer"
HN_AVAILABLE = "seeking_work"

# Fuentes de proyectos. HN no esta aca: ver `market` y el docstring de arriba.
SOURCES = ("getonbrd", "himalayas")

# --------------------------------------------------------------------------- #
# Fuentes con credencial por usuario
#
# No pueden entrar a la corrida automatica: la key es de una persona y este repo
# lo instala cualquiera. Pero omitirlas en silencio es peor, porque el usuario
# no se entera de que existe una fuente que podria usar. Asi que se declaran
# aca: `keys` explica como conseguir cada una, y si la variable de entorno esta
# puesta la fuente se activa sola sin tocar nada mas.
# --------------------------------------------------------------------------- #

UPWORK_GRAPHQL = "https://api.upwork.com/graphql"

KEYED_SOURCES = {
    "upwork": {
        "env": "UPWORK_ACCESS_TOKEN",
        "scope": "el marketplace mas grande; proyectos de todo el mundo",
        "como_conseguirla": [
            "Entrar al API Center de tu cuenta de Upwork (freelancer o cliente, cualquier plan).",
            "Pedir una API key nueva. No hace falta cuenta de empresa.",
            "Upwork revisa a mano y contesta por mail en ~1 semana.",
            "Completar los datos de la cuenta antes de pedirla: el rechazo mas comun es data incompleta.",
            "Con el client id y secret, sacar un access token OAuth 2.0 y exportarlo en UPWORK_ACCESS_TOKEN.",
        ],
        "limites": "40.000 requests por dia, 10 por segundo por IP",
        "lo_que_no_se_puede": (
            "no hay mutation para enviar una propuesta ni para gastar Connects: "
            "Upwork lo cerro a proposito contra el auto-bidding. Postularse sigue siendo a mano"
        ),
        "doc": "https://www.upwork.com/developer/documentation/graphql/api/docs/index.html",
    },
    "freelancer": {
        "env": "FREELANCER_OAUTH_TOKEN",
        "scope": "marketplace global, mucho volumen y mucha competencia por precio",
        "como_conseguirla": [
            "Crear una app en la seccion de desarrolladores de Freelancer.com.",
            "Es self-service: no hay revision manual como en Upwork.",
            "Exportar el token en FREELANCER_OAUTH_TOKEN.",
        ],
        "limites": "sin publicar",
        "lo_que_no_se_puede": "el adaptador todavia no esta escrito; la guia esta para quien quiera hacerlo",
        "doc": "https://developers.freelancer.com/",
        "adapter": False,
    },
}

# Expansion por sinonimos.
#
# Nadie titula una oferta "ecommerce": la titula "Shopify" o "WooCommerce". Se
# midio el pool completo de las dos fuentes (29 ofertas freelance) y buscar
# "ecommerce" devolvia 0 mientras habia un "Desarrollador Web Shopify" adentro;
# "website" devolvia 0 con un "Especialista WordPress" y un "Partner Tecnico
# Astro" presentes. Buscar por categoria escondia trabajo real.
#
# La clave es la palabra que el freelancer piensa; los valores son las que el
# cliente escribe. Solo se expande hacia abajo (categoria -> tecnologias): al
# reves inflaria los resultados de quien ya busca preciso.
SYNONYMS = {
    "ecommerce": ["shopify", "woocommerce", "magento", "vtex", "tiendanube", "prestashop"],
    "tienda": ["shopify", "woocommerce", "vtex", "tiendanube"],
    "website": ["wordpress", "webflow", "astro", "landing", "next.js", "html"],
    "web": ["wordpress", "webflow", "astro", "landing", "next.js"],
    "sitio": ["wordpress", "webflow", "astro", "landing"],
    "landing": ["wordpress", "webflow", "astro", "html"],
    "cms": ["wordpress", "strapi", "contentful", "sanity", "headless"],
    "backend": ["node", "nestjs", "express", "django", "fastapi", "spring", ".net", "laravel"],
    "frontend": ["react", "vue", "angular", "svelte", "next.js", "tailwind"],
    "fullstack": ["node", "react", "typescript", "django", "laravel"],
    "full-stack": ["node", "react", "typescript", "django", "laravel"],
    "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android"],
    "go": ["golang"],
    "golang": ["go"],
    "api": ["rest", "graphql", "openapi", "webhook", "integracion"],
    "integraciones": ["api", "webhook", "erp", "crm", "salesforce", "middleware"],
    "saas": ["multi-tenant", "stripe", "billing", "subscription", "dashboard"],
    "dashboard": ["bi", "reporting", "metabase", "looker", "analytics"],
    "database": ["postgres", "mysql", "mongodb", "sql", "migracion"],
    "migracion": ["legacy", "refactor", "modernizacion", "migration"],
    "testing": ["qa", "automation", "cypress", "playwright", "pytest"],
    "qa": ["testing", "cypress", "playwright", "automation"],
    "devops": ["kubernetes", "docker", "terraform", "aws", "ci/cd"],
    "data": ["sql", "etl", "airflow", "bigquery", "dbt"],
    "scraping": ["crawler", "scraper", "playwright", "extraction"],
    "ai": ["llm", "openai", "rag", "machine learning", "langchain"],
    "automatizacion": ["zapier", "n8n", "make", "airflow", "automation"],
    "automation": ["zapier", "n8n", "make", "workflow"],
    # Unity y game design entran porque son perfil del usuario, no porque el
    # mapa apunte a gamedev: Unreal y Godot quedan afuera a proposito. El foco
    # de este perfil es software en general.
    "unity": ["c#", "gameplay", "game design"],
    "gamedesign": ["game design", "level design", "unity"],
}
MAX_EXPANDED_TERMS = 6  # tope de terminos extra: cada uno es una request mas

RATE_PATTERNS = (
    r"(?:USD|US\$|\$|EUR|€)\s?(\d{1,4})(?:\s?[-a]\s?(?:USD|US\$|\$|EUR|€)?\s?(\d{1,4}))?\s?(?:/|per\s)\s?(hour|hr|h|day|d|week|wk|month|mo)",
    r"(\d{1,4})(?:\s?[-a]\s?(\d{1,4}))?\s?(?:USD|US\$|\$|EUR|€)\s?(?:/|per\s)\s?(hour|hr|h|day|d|week|wk|month|mo)",
)


class SourceError(RuntimeError):
    pass


def fetch(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    last = ""
    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                return response.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            # 4xx no se reintenta: no va a cambiar.
            if 400 <= e.code < 500 and e.code != 429:
                raise SourceError("HTTP {0} {1}".format(e.code, e.reason))
            last = "HTTP {0} {1}".format(e.code, e.reason)
        except Exception as e:  # timeout, DNS, reset
            last = "{0}: {1}".format(type(e).__name__, e)
        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_SLEEP * (attempt + 1))
    raise SourceError(last or "request failed")


def fetch_json(url: str):
    body = fetch(url)
    try:
        return json.loads(body)
    except ValueError as e:
        raise SourceError("respuesta no es JSON: {0}".format(e))


def strip_html(raw: str) -> str:
    text = re.sub(r"<p>", "\n", raw or "")
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text).strip()


# Comas y espacios separan terminos. Solo espacios no alcanza: "typescript,backend"
# es la forma natural de escribir una lista, y separando solo por espacios se
# buscaba ese string literal, que no aparece en ningun aviso. El resultado eran
# cero hits, que se leen como "no hay trabajo" en vez de "no busque nada".
TERM_SEPARATOR = r"[,\s]+"


def expand_query(query: str):
    """
    Devuelve (terminos_de_busqueda, expansiones_aplicadas).

    El primer termino es siempre lo que el usuario escribio: es el que se pagina
    en profundidad. Los sinonimos van despues y se consultan mas superficialmente.
    """
    words = [w for w in re.split(TERM_SEPARATOR, (query or "").strip().lower()) if w]
    terms = list(words)
    applied = {}
    for word in words:
        extra = [s for s in SYNONYMS.get(word, []) if s not in terms]
        if not extra:
            continue
        room = MAX_EXPANDED_TERMS - (len(terms) - len(words))
        if room <= 0:
            break
        applied[word] = extra[:room]
        terms.extend(applied[word])
    return terms, applied


def matches_terms(terms, *fields) -> bool:
    """
    Chequeo de relevancia del lado del cliente.

    La busqueda de GetOnBrd ordena por relevancia, no filtra: `query=unity`
    devuelve 21 paginas donde las ultimas no tienen nada que ver (SAP, COBOL,
    un recruiter). Paginando en profundidad y quedandose con lo freelance de esa
    cola larga, el resultado es basura relevante a nada.

    Alcanza que UN termino aparezca: "unity developer" tiene que traer los que
    dicen Unity aunque no digan developer, y con expansion "ecommerce" tiene que
    traer los de Shopify.

    Match por limite de palabra y no por substring. En este dominio hay muchas
    busquedas de dos letras que son legitimas (go, ux, ai, qa) y por substring
    "ux" matchearia dentro de "Linux" y "go" dentro de "Django". El costo es que
    buscar "script" ya no encuentra "JavaScript"; se prefiere ese costo antes que
    devolver ofertas de Linux a quien busca UX.

    Los terminos con caracteres no alfanumericos (c#, .net, node.js, react
    native) caen a substring: \\b no funciona contra `#`, `.` ni el espacio
    interno de un termino de dos palabras.
    """
    terms = [t for t in (terms or []) if t]
    if not terms:
        return True
    haystack = " ".join(str(f or "") for f in fields).lower()
    for term in terms:
        if term.isalnum():
            if re.search(r"\b{0}\b".format(re.escape(term)), haystack):
                return True
        elif term in haystack:
            return True
    return False


def matches_query(query: str, *fields) -> bool:
    """Version sin expansion, partiendo la query en palabras."""
    return matches_terms([t for t in re.split(r"\s+", (query or "").strip().lower()) if t], *fields)


def record(**kw):
    """Forma comun para que el dedup de /freelance-scan trate todo igual."""
    base = {
        "source": None, "id": None, "title": None, "company": None, "url": None,
        "modality": None, "published_at": None, "location": None,
        "salary_min": None, "salary_max": None, "tags": [], "excerpt": None,
    }
    base.update(kw)
    return base


# --------------------------------------------------------------------------- #
# GetOnBrd: LatAm + remoto. Comparte API con /job-scrape, sin key.
# --------------------------------------------------------------------------- #

def expanded_name(node):
    """Saca el nombre de una referencia JSON:API expandida, o None."""
    data = (node or {}).get("data") or {}
    return ((data.get("attributes") or {}).get("name")) or None


def expanded_names(node):
    data = (node or {}).get("data") or []
    if isinstance(data, dict):
        data = [data]
    return [n for n in ((item.get("attributes") or {}).get("name") for item in data) if n]


def getonbrd_search(query: str, pages: int, per_page: int = 50, terms=None):
    """
    `query` maneja el pool que devuelve el server; `terms` filtra lo que se queda.

    Los dos hacen falta y no son lo mismo: el server rankea por relevancia
    respecto de `query`, asi que buscar "ecommerce" nunca trae el pool donde vive
    el "Desarrollador Web Shopify". Por eso el caller llama una vez por termino
    expandido y dedupea; aca solo se resuelve una.
    """
    terms = terms if terms is not None else [query]
    out = []
    truncated = False
    scanned = 0
    irrelevant = 0
    for page in range(1, pages + 1):
        params = [("query", query), ("per_page", str(per_page)), ("page", str(page))]
        params += [("expand[]", field) for field in GETONBRD_EXPAND]
        payload = fetch_json("{0}/search/jobs?{1}".format(GETONBRD_API, urllib.parse.urlencode(params)))
        data = payload.get("data") or []
        scanned += len(data)
        for job in data:
            attrs = job.get("attributes") or {}
            modality = (attrs.get("modality") or {}).get("data") or {}
            if ((modality.get("attributes") or {}).get("locale_key")) != GETONBRD_FREELANCE_KEY:
                continue
            tags = expanded_names(attrs.get("tags"))
            # El orden importa: la relevancia se chequea DESPUES de la modalidad,
            # asi `irrelevant` cuenta solo freelance descartado por no tener nada
            # que ver, que es el numero que le dice al usuario que afine la query.
            if not matches_terms(terms, attrs.get("title"), " ".join(tags),
                                 attrs.get("description_headline")):
                irrelevant += 1
                continue
            out.append(record(
                source="getonbrd",
                id=str(job.get("id")),
                title=attrs.get("title"),
                company=expanded_name(attrs.get("company")),
                url="{0}/{1}".format(GETONBRD_JOBS, job.get("id")),
                modality="freelance",
                published_at=attrs.get("published_at"),
                location=attrs.get("remote_modality") or ", ".join(attrs.get("location_cities") or []),
                salary_min=attrs.get("min_salary"),
                salary_max=attrs.get("max_salary"),
                tags=tags,
                excerpt=(attrs.get("description_headline") or "")[:400] or None,
            ))
        total_pages = (payload.get("meta") or {}).get("total_pages") or 1
        if page >= total_pages:
            break
        if page == pages and total_pages > pages:
            truncated = True
    return out, truncated, scanned, irrelevant


def getonbrd_detail(job_id: str):
    payload = fetch_json("{0}/jobs/{1}".format(GETONBRD_API, urllib.parse.quote(str(job_id))))
    data = payload.get("data") or {}
    attrs = data.get("attributes") or {}
    return {
        "source": "getonbrd",
        "id": str(data.get("id") or job_id),
        "title": attrs.get("title"),
        "url": "{0}/{1}".format(GETONBRD_JOBS, data.get("id") or job_id),
        "modality_id": (((attrs.get("modality") or {}).get("data") or {}).get("id")),
        "description": strip_html(attrs.get("description") or ""),
        "desirable": strip_html(attrs.get("desirable") or ""),
        "functions": strip_html(attrs.get("functions") or ""),
        "min_salary": attrs.get("min_salary"),
        "max_salary": attrs.get("max_salary"),
        "remote_modality": attrs.get("remote_modality"),
        "tags": attrs.get("tags") or [],
    }


# --------------------------------------------------------------------------- #
# Himalayas: remoto global. employmentType "Contractor" existe pero no filtra.
# --------------------------------------------------------------------------- #

def himalayas_search(query: str, pages: int, terms=None):
    """Himalayas devuelve un feed unico, asi que la expansion es solo del filtro."""
    terms = terms if terms is not None else [query]
    out = []
    truncated = False
    scanned = 0
    irrelevant = 0
    for page in range(pages):
        params = urllib.parse.urlencode({"limit": HIMALAYAS_PAGE, "offset": page * HIMALAYAS_PAGE})
        payload = fetch_json("{0}?{1}".format(HIMALAYAS_API, params))
        jobs = payload.get("jobs") or []
        if not jobs:
            break
        scanned += len(jobs)
        for job in jobs:
            if job.get("employmentType") != HIMALAYAS_CONTRACT:
                continue
            if not matches_terms(terms, job.get("title"), job.get("excerpt"),
                                 " ".join(job.get("categories") or [])):
                irrelevant += 1
                continue
            out.append(record(
                source="himalayas",
                id=str(job.get("guid") or job.get("applicationLink")),
                title=job.get("title"),
                company=job.get("companyName"),
                url=job.get("applicationLink"),
                modality="contract",
                published_at=job.get("pubDate"),
                location=", ".join(job.get("locationRestrictions") or []) or "remote",
                salary_min=job.get("minSalary"),
                salary_max=job.get("maxSalary"),
                tags=job.get("categories") or [],
                excerpt=(job.get("excerpt") or "")[:400] or None,
            ))
        total = payload.get("totalCount")
        if total and (page + 1) * HIMALAYAS_PAGE >= total:
            break
        if page + 1 == pages:
            truncated = True
    return out, truncated, scanned, irrelevant


# --------------------------------------------------------------------------- #
# Hacker News: el hilo mensual "Freelancer? Seeking freelancer?".
#
# Esto NO es un buscador de proyectos, aunque el titulo del hilo lo sugiera. Se
# midieron 6 meses (marzo a agosto 2026): 113 comentarios de freelancers
# ofreciendose contra 2 ofertas de trabajo. Lo que si te da, y gratis, es
# como se presentan y cuanto cobran otros con tu perfil. Eso alimenta
# /freelance-profile y la decision de tarifa.
# --------------------------------------------------------------------------- #

# --------------------------------------------------------------------------- #
# Triage de resultados de WebSearch
#
# WebSearch es el unico camino que llega a los marketplaces sin credencial, pero
# ~la mitad de lo que devuelve no son ofertas: son landings de "Hire Golang
# developers", tablas de tarifas y gigs del Project Catalog. Se separan por
# patron de URL, que es la parte determinista y por eso vive aca y no en el
# criterio del modelo.
#
# Lo que no matchea ningun patron queda `unknown` a proposito. Adivinar mete
# landings en la cola, y una cola con basura se deja de mirar.
# --------------------------------------------------------------------------- #

URL_RULES = (
    ("upwork", r"(^|\.)upwork\.com$", (
        r"/jobs?/[^/]*~[0-9a-z]+",          # /job/Slug_~017abc...
        r"/freelance-jobs/apply/[^/]*~",    # variante con /apply/
    ), (
        r"/hire/", r"/services/product/", r"/services/",
        r"/freelance-jobs/[a-z]{2}/", r"/developer", r"/support",
        r"/nx/search/",                     # la busqueda, no una oferta
    )),
    ("workana", r"(^|\.)workana\.com$", (
        r"/job/[^/?]+$",
        r"/(es|en|pt)/job/[^/?]+$",
    ), (
        r"/hire/", r"/skill/", r"/jobs\b", r"/work/",
    )),
    ("freelancer", r"(^|\.)freelancer\.(com|[a-z]{2})$", (
        r"/projects/[^/]+/[^/]+",
    ), (
        r"/jobs/", r"/freelancers/", r"/hire/",
    )),
    ("peopleperhour", r"(^|\.)peopleperhour\.com$", (
        r"/freelance-job/", r"/job/[^/?]+",
    ), (
        r"/hire-freelancers/", r"/freelance-[a-z-]+-jobs$", r"/site/",
    )),
    ("guru", r"(^|\.)guru\.com$", (
        r"/jobs/[^/]+/\d+",
    ), (
        r"/m/hire/", r"/m/find/", r"/d/jobs/browse/", r"/help/",
    )),
)


def classify_url(url: str):
    """
    Devuelve (plataforma, veredicto) donde veredicto es posting | landing | unknown.

    Se mira solo el path: los parametros de query cambian por sesion y por
    campania, asi que meterlos en la decision la vuelve inestable.
    """
    try:
        parts = urllib.parse.urlsplit(url)
    except ValueError:
        return None, "unknown"

    host = (parts.netloc or "").lower().split(":")[0]
    path = parts.path or "/"

    for name, host_re, posting_res, landing_res in URL_RULES:
        if not re.search(host_re, host):
            continue
        for pattern in posting_res:
            if re.search(pattern, path, re.IGNORECASE):
                return name, "posting"
        for pattern in landing_res:
            if re.search(pattern, path, re.IGNORECASE):
                return name, "landing"
        return name, "unknown"

    return None, "unknown"


def triage_urls(urls):
    postings, landings, unknown, other = [], [], [], []
    seen = set()
    for raw in urls:
        url = (raw or "").strip()
        if not url or url in seen:
            continue
        seen.add(url)
        platform, verdict = classify_url(url)
        row = {"url": url, "platform": platform}
        if platform is None:
            other.append(row)
        elif verdict == "posting":
            postings.append(row)
        elif verdict == "landing":
            landings.append(row)
        else:
            unknown.append(row)

    by_platform = {}
    for row in postings:
        by_platform[row["platform"]] = by_platform.get(row["platform"], 0) + 1

    return {
        # Lo unico que vale abrir. El resto se reporta para que se vea cuanto
        # ruido trajo la busqueda, no para esconderlo.
        "postings": postings,
        "postings_por_plataforma": by_platform,
        "descartados_landing": landings,
        "sin_clasificar": unknown,
        "fuera_de_plataformas_conocidas": other,
        "total_recibidas": len(seen),
        "advertencia": (
            "El indice de busqueda no filtra por fecha: estas URLs pueden ser viejas. "
            "Verificar la fecha al abrir cada una antes de invertir tiempo."
        ),
    }


# --------------------------------------------------------------------------- #
# Upwork (opt-in, requiere UPWORK_ACCESS_TOKEN)
# --------------------------------------------------------------------------- #

# La query va aparte para que se pueda ajustar sin tocar la logica. Sale de la
# doc GraphQL de Upwork; el transporte y el parseo estan testeados contra un
# payload fijo, pero la forma exacta de la query no se pudo verificar contra la
# API real porque hace falta una key aprobada. Si Upwork cambio un nombre de
# campo, el error de abajo lo dice con el mensaje del server en la mano.
UPWORK_QUERY = """
query marketplaceJobPostings($filter: MarketplaceJobPostingsSearchFilter,
                             $pagination: PaginationInput) {
  marketplaceJobPostingsSearch(marketPlaceJobFilter: $filter,
                               searchType: USER_JOBS_SEARCH,
                               pagination: $pagination) {
    totalCount
    edges {
      node {
        id
        title
        description
        ciphertext
        duration
        engagement
        createdDateTime
        amount { rawValue currency }
        hourlyBudgetMin { rawValue }
        hourlyBudgetMax { rawValue }
        client { totalHires totalSpent { rawValue } verificationStatus location { country } }
        skills { name }
      }
    }
  }
}
"""


def upwork_token():
    return os.environ.get(KEYED_SOURCES["upwork"]["env"], "").strip()


def _walk_nodes(obj, out, depth=0):
    """
    Junta los `node` de cualquier conexion GraphQL sin asumir el anidamiento.

    Upwork cambio la forma de la respuesta al menos una vez; caminar el arbol
    cuesta poco y evita que un nivel extra rompa todo con un KeyError.
    """
    if depth > 8:
        return
    if isinstance(obj, dict):
        if "node" in obj and isinstance(obj["node"], dict):
            out.append(obj["node"])
            return
        for value in obj.values():
            _walk_nodes(value, out, depth + 1)
    elif isinstance(obj, list):
        for value in obj:
            _walk_nodes(value, out, depth + 1)


def _money(node, *path):
    cur = node
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    if isinstance(cur, dict):
        cur = cur.get("rawValue")
    return cur


def upwork_search(query: str, pages: int, terms=None):
    token = upwork_token()
    if not token:
        raise SourceError(
            "falta {0}. Correr `keys` para ver como conseguir la credencial".format(
                KEYED_SOURCES["upwork"]["env"]
            )
        )

    found, seen = [], 0
    for page in range(max(1, pages)):
        payload = json.dumps({
            "query": UPWORK_QUERY,
            "variables": {
                "filter": {"titleExpression_eq": query or "developer"},
                "pagination": {"first": 50, "after": str(page * 50)},
            },
        }).encode("utf-8")

        req = urllib.request.Request(
            UPWORK_GRAPHQL,
            data=payload,
            headers={
                "Authorization": "Bearer {0}".format(token),
                "Content-Type": "application/json",
                "User-Agent": UA,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
                body = json.loads(resp.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:300] if exc.fp else ""
            if exc.code in (401, 403):
                raise SourceError(
                    "Upwork rechazo el token ({0}). Puede estar vencido: los access token "
                    "de OAuth 2.0 caducan y hay que refrescarlos. {1}".format(exc.code, detail)
                )
            raise SourceError("Upwork HTTP {0}: {1}".format(exc.code, detail))
        except Exception as exc:  # noqa: BLE001
            raise SourceError("Upwork inalcanzable: {0}".format(exc))

        # GraphQL responde 200 con los errores adentro, asi que hay que mirarlos.
        if body.get("errors"):
            msgs = "; ".join(str(e.get("message", e))[:160] for e in body["errors"][:3])
            raise SourceError(
                "Upwork devolvio errores de GraphQL: {0}. Si menciona un campo desconocido, "
                "ajustar UPWORK_QUERY: el schema pudo haber cambiado.".format(msgs)
            )

        nodes = []
        _walk_nodes(body.get("data"), nodes)
        if not nodes:
            break

        for node in nodes:
            seen += 1
            title = node.get("title") or ""
            desc = strip_html(node.get("description") or "")
            skills = " ".join(s.get("name", "") for s in (node.get("skills") or [])
                              if isinstance(s, dict))
            if not matches_terms(terms, title, desc, skills):
                continue
            client = node.get("client") or {}
            cipher = node.get("ciphertext") or ""
            found.append(record(
                source="upwork",
                id=node.get("id"),
                title=title,
                description=desc[:600],
                url="https://www.upwork.com/jobs/{0}".format(cipher) if cipher else None,
                modality="freelance",
                published=node.get("createdDateTime"),
                engagement=node.get("engagement"),
                duration=node.get("duration"),
                budget=_money(node, "amount"),
                hourly_min=_money(node, "hourlyBudgetMin"),
                hourly_max=_money(node, "hourlyBudgetMax"),
                client_hires=client.get("totalHires"),
                client_spent=_money(client, "totalSpent"),
                client_verified=client.get("verificationStatus"),
                client_country=(client.get("location") or {}).get("country"),
                tags=[s.get("name") for s in (node.get("skills") or []) if isinstance(s, dict)],
            ))

        if len(nodes) < 50:
            break

    return found, seen, 0


def hn_latest_threads(limit: int = 3):
    params = urllib.parse.urlencode({
        "query": HN_THREAD_QUERY, "tags": "story", "hitsPerPage": limit,
    })
    payload = fetch_json("{0}?{1}".format(HN_SEARCH, params))
    return [
        {"id": h.get("objectID"), "title": h.get("title"),
         "created_at": h.get("created_at"), "num_comments": h.get("num_comments")}
        for h in (payload.get("hits") or [])
    ]


def hn_classify(text: str) -> str:
    """La convencion del hilo: el comentario arranca declarando de que lado esta."""
    head = re.sub(r"[^A-Za-z ]", " ", text[:110]).upper()
    head = re.sub(r"\s+", " ", head)
    if "SEEKING FREELANCER" in head:
        return HN_HIRING
    if "SEEKING WORK" in head:
        return HN_AVAILABLE
    return "unknown"


def extract_rates(text: str):
    """Tarifas mencionadas en el texto. Devuelve lo que encuentra, sin inventar."""
    found = []
    for pattern in RATE_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            low, high, unit = m.group(1), m.group(2), m.group(3).lower()
            unit = {"hr": "hour", "h": "hour", "d": "day", "wk": "week", "mo": "month"}.get(unit, unit)
            found.append({"min": int(low), "max": int(high) if high else None,
                          "unit": unit, "quote": m.group(0).strip()})
    return found


def hn_market(months: int, query: str):
    """Inteligencia de posicionamiento, no ofertas. Ver el comentario de arriba."""
    profiles, offers, counts = [], [], collections.Counter()
    threads_read = []

    for thread in hn_latest_threads(months):
        payload = fetch_json("{0}/{1}".format(HN_ITEM, thread["id"]))
        threads_read.append({"title": thread["title"], "id": thread["id"],
                             "created_at": thread["created_at"]})
        for child in (payload.get("children") or []):
            if child.get("type") != "comment":
                continue
            text = strip_html(child.get("text") or "")
            if not text:
                continue
            kind = hn_classify(text)
            counts[kind] += 1
            if query and query.strip().lower() not in text.lower():
                continue
            first = next((line.strip() for line in text.splitlines() if line.strip()), "")
            entry = {
                "author": child.get("author"),
                "created_at": child.get("created_at"),
                "url": "https://news.ycombinator.com/item?id={0}".format(child.get("id")),
                "headline": first[:160],
                "rates_mentioned": extract_rates(text),
                "excerpt": text[:700],
            }
            if kind == HN_HIRING:
                offers.append(entry)
            else:
                profiles.append(entry)

    rates = [r for p in profiles for r in p["rates_mentioned"]]
    return {
        "threads_read": threads_read,
        "composition": dict(counts),
        "note": ("El hilo lo dominan freelancers ofreciendose, no clientes buscando. "
                 "Usalo para posicionamiento y tarifa, no como cola de trabajo. "
                 "Solo ~3% de los perfiles declara una tarifa parseable: mira siempre el n "
                 "de rates_summary antes de tratar la mediana como dato de mercado."),
        "competitor_profiles": profiles,
        "actual_offers": offers,
        "rates_found": rates,
        "rates_summary": rate_summary(rates),
    }


def rate_summary(rates):
    by_unit = {}
    for r in rates:
        by_unit.setdefault(r["unit"], []).append(r["min"])
    out = {}
    for unit, values in by_unit.items():
        values.sort()
        mid = len(values) // 2
        out[unit] = {
            "n": len(values), "min": values[0], "max": values[-1],
            "median": values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2,
        }
    return out


# --------------------------------------------------------------------------- #

def run_search(args) -> int:
    if args.source == "all":
        # Las fuentes con credencial se suman solas cuando la variable esta
        # puesta. Sin ella no se intentan, porque fallarian en cada corrida y el
        # usuario aprenderia a ignorar los errores.
        wanted = list(SOURCES) + [
            name for name, spec in KEYED_SOURCES.items()
            if spec.get("adapter", True) and os.environ.get(spec["env"], "").strip()
        ]
    else:
        wanted = [args.source]
    base_query = args.query or "developer"

    if args.no_expand:
        terms, applied = [t for t in re.split(TERM_SEPARATOR, base_query.lower()) if t], {}
    else:
        terms, applied = expand_query(base_query)

    results, errors, truncated, scanned = [], {}, [], {}
    by_id = {}

    for name in wanted:
        try:
            if name == "getonbrd":
                # Una request por termino: el server rankea segun `query`, asi que
                # "ecommerce" y "shopify" devuelven pools distintos. El termino del
                # usuario se pagina hondo; los sinonimos, una pagina (el tope de
                # relevancia es lo que importa y cada uno cuesta una request).
                found, seen, off, cut = [], 0, 0, False
                for i, term in enumerate(terms):
                    depth = args.pages if i < len(re.split(r"\s+", base_query.strip())) else 1
                    got, c, s, o = getonbrd_search(term, depth, terms=terms)
                    found.extend(got)
                    seen += s
                    off += o
                    cut = cut or c
            elif name == "upwork":
                found, seen, off = upwork_search(base_query, args.pages, terms=terms)
                cut = False
            else:
                found, cut, seen, off = himalayas_search(base_query, args.pages, terms=terms)

            fresh = 0
            for row in found:
                key = (row["source"], row["id"])
                if key in by_id:
                    continue
                by_id[key] = row
                results.append(row)
                fresh += 1
            scanned[name] = {"scanned": seen, "freelance": fresh,
                             "freelance_pero_irrelevante": off}
            if cut:
                truncated.append(name)
        except SourceError as e:
            # Una fuente caida no invalida las otras: se reporta y se sigue.
            errors[name] = str(e)

    if errors and not results:
        emit({"error": "todas las fuentes fallaron", "code": "ALL_SOURCES_FAILED", "detail": errors})
        return 1

    emit({
        "query": args.query,
        # Que se busco realmente. Sin esto el usuario no entiende por que una
        # busqueda de "ecommerce" le trajo una oferta de Shopify.
        "terms_searched": terms,
        "synonyms_applied": applied,
        "sources_requested": list(wanted),
        "sources_failed": errors,
        # El rendimiento por fuente se reporta siempre: filtrar freelance del lado
        # del cliente significa descartar mucho, y eso tiene que quedar a la vista
        # en vez de parecer que la fuente no tiene nada. `freelance_pero_irrelevante`
        # alto quiere decir que la query es muy amplia para el catalogo de la fuente.
        "yield_by_source": scanned,
        "truncated": truncated,
        "count": len(results),
        "results": results,
    })
    return 0


def run_sources(_args) -> int:
    emit({"project_sources": [
        {"name": "getonbrd", "scope": "LatAm y remoto", "auth": "ninguna",
         "freelance_filter": "client-side (modality id 3); el parametro del server no filtra",
         "shares_cli_with": "job-scrape"},
        {"name": "himalayas", "scope": "remoto global", "auth": "ninguna",
         "freelance_filter": "client-side (employmentType Contractor); el parametro del server no filtra",
         "note": "limit topeado en 20 por pagina"},
    ], "market_intel_only": [
        {"name": "hn", "subcommand": "market", "auth": "ninguna (10k req/hora)",
         "why_not_projects": ("medido sobre 6 meses: 113 freelancers ofreciendose contra 2 ofertas. "
                              "Sirve para tarifa y posicionamiento, no como cola de trabajo")},
    ], "con_credencial_propia": [
        {"name": name, "env": spec["env"],
         "configurada": bool(os.environ.get(spec["env"], "").strip()),
         "detalle": "correr `keys` para ver como conseguirla"}
        for name, spec in KEYED_SOURCES.items()
    ], "excluded": [
        {"name": "remoteok", "why": "sus terminos exigen backlink do-follow o suspenden el acceso; un CLI local no puede cumplirlo"},
        {"name": "remotive", "why": "backlink do-follow obligatorio, maximo 4 requests por dia y datos con 24h de retraso"},
        {"name": "jobicy", "why": "sin key y con terminos cumplibles, pero 99 de 100 avisos son full-time y jobType=contract devuelve HTTP 400"},
        {"name": "workingnomads", "why": "sin campo de tipo de contrato: no hay forma de filtrar freelance sin adivinar por el titulo"},
        {"name": "workana", "why": "sin API ni RSS publico (404 en las tres rutas probadas). Se busca con WebSearch y se abre a mano"},
        {"name": "peopleperhour", "why": "sin RSS, y su robots.txt prohibe las URLs con filtros que usaria un buscador"},
        {"name": "guru", "why": "sin RSS y con Disallow: /api/ explicito en robots.txt"},
        {"name": "malt / freelancermap", "why": "API real detras de 401: credencial por usuario, mismo muro que Upwork"},
    ], "sin_api_pero_alcanzables": {
        "como": "WebSearch con allowed_domains, y despues `triage` para separar ofertas del ruido SEO",
        "plataformas": ["upwork", "workana", "freelancer", "peopleperhour", "guru"],
        "limite": "WebFetch devuelve 403 en todas: se descubre la oferta pero hay que abrirla a mano",
    }})
    return 0


def run_keys(_args) -> int:
    """
    Que fuentes necesitan credencial, como se consigue cada una y cual esta lista.

    Existe porque omitirlas en silencio le esconde al usuario que hay una fuente
    que podria estar usando. El estado se calcula mirando el entorno, asi que
    responde por la maquina donde corre y no por lo que diga un README.
    """
    out = []
    for name, spec in KEYED_SOURCES.items():
        configurada = bool(os.environ.get(spec["env"], "").strip())
        tiene_adaptador = spec.get("adapter", True)
        if configurada and tiene_adaptador:
            estado = "lista: la variable esta puesta, `search --source {0}` ya la usa".format(name)
        elif configurada:
            estado = "credencial puesta pero el adaptador no esta escrito todavia"
        elif tiene_adaptador:
            estado = "no disponible: falta {0}. Con la variable puesta se activa sola".format(spec["env"])
        else:
            estado = "no disponible: falta {0} y ademas el adaptador no esta escrito".format(spec["env"])
        out.append({
            "fuente": name,
            "estado": estado,
            "configurada": configurada,
            "variable_de_entorno": spec["env"],
            "scope": spec["scope"],
            "como_conseguirla": spec["como_conseguirla"],
            "limites": spec["limites"],
            "lo_que_no_se_puede": spec["lo_que_no_se_puede"],
            "doc": spec["doc"],
        })
    emit({
        "fuentes_con_credencial": out,
        "por_que_no_vienen_por_defecto": (
            "la credencial es de una persona y este repo lo instala cualquiera. "
            "Una fuente que necesita key funcionaria para uno y estaria rota para el resto"
        ),
        "sin_credencial_ya_funcionan": list(SOURCES),
    })
    return 0


def run_triage(args) -> int:
    urls = list(args.url or [])
    if not urls and not sys.stdin.isatty():
        urls = [line.strip() for line in sys.stdin.read().splitlines()]
    if not urls:
        emit({"error": "no llegaron URLs; pasar --url o por stdin", "code": "NO_URLS"})
        return 1
    emit(triage_urls(urls))
    return 0


def run_market(args) -> int:
    emit(hn_market(args.months, args.query))
    return 0


def run_detail(args) -> int:
    if args.source != "getonbrd":
        emit({"error": "detail solo esta implementado para getonbrd; las otras fuentes ya traen el texto completo en search",
              "code": "NO_DETAIL"})
        return 1
    emit(getonbrd_detail(args.id))
    return 0


def emit(payload) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")


def force_utf8_streams() -> None:
    """
    En Windows stdout es cp1252, asi que un acento o una vinieta en una
    descripcion revienta con UnicodeEncodeError en cuanto se pipea a un archivo.
    Mismo fix que job-scrape/scripts/getonbrd_search.py.
    """
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def main(argv=None) -> int:
    force_utf8_streams()
    parser = argparse.ArgumentParser(description="Busca proyectos freelance en fuentes publicas sin API key.")
    sub = parser.add_subparsers(dest="command", required=True)

    search = sub.add_parser("search", help="buscar proyectos freelance")
    search.add_argument("--query", default="", help="terminos a buscar")
    search.add_argument("--source", default="all",
                        choices=list(SOURCES) + list(KEYED_SOURCES) + ["all"])
    search.add_argument("--pages", type=int, default=3, help="paginas por fuente (default 3)")
    search.add_argument("--no-expand", action="store_true",
                        help="no expandir por sinonimos (ecommerce no busca shopify, etc)")
    search.set_defaults(func=run_search)

    sources = sub.add_parser("sources", help="listar fuentes disponibles y las descartadas con su motivo")
    sources.set_defaults(func=run_sources)

    keys = sub.add_parser("keys", help="fuentes que piden credencial, como conseguirla y cual esta lista")
    keys.set_defaults(func=run_keys)

    triage = sub.add_parser(
        "triage",
        help="separar ofertas reales del ruido SEO en URLs traidas por WebSearch",
    )
    triage.add_argument("--url", action="append", help="repetible; si falta, lee de stdin")
    triage.set_defaults(func=run_triage)

    market = sub.add_parser("market", help="que cobran y como se posicionan otros freelancers (hilo mensual de HN)")
    market.add_argument("--months", type=int, default=3, help="cuantos hilos mensuales leer (default 3)")
    market.add_argument("--query", default="", help="filtrar por stack o palabra")
    market.set_defaults(func=run_market)

    detail = sub.add_parser("detail", help="traer el detalle completo de una oferta")
    detail.add_argument("--source", default="getonbrd", choices=list(SOURCES))
    detail.add_argument("--id", required=True)
    detail.set_defaults(func=run_detail)

    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except SourceError as e:
        emit({"error": str(e), "code": "SOURCE_ERROR"})
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
