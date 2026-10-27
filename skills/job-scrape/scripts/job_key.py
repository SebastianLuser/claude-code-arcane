#!/usr/bin/env python3
"""job_key de seen_jobs.json, y una auditoria del estado que ya existe.

La regla estaba solo en prosa (references/dedup-playbook.md), asi que cada
corrida la aplicaba a su manera y el archivo juntaba la misma oferta bajo dos
claves: un titulo cortado en otro punto, un sufijo legal que una vez se saco y
otra no. Aca la clave es una funcion pura de empresa + titulo:

  * slug: minusculas, sin acentos, palabras unidas con "-", conserva el "."
    interno (coderslab.io, .net);
  * empresa sin sufijo legal (inc, llc, s.a., gmbh...); titulo sin los
    calificadores de modalidad o region entre parentesis ("(remote)", "(latam)");
  * largo acotado con un hash del slug completo: un titulo largo da siempre la
    misma clave y dos titulos largos distintos nunca chocan;
  * un nombre en otro alfabeto (cirilico, CJK) se reduce a casi nada al pasarlo
    a ASCII, y "Программист 1С" y "Аналитик 1С" quedarian ambos en "1": ahi la
    identidad sale del id numerico de la URL, o de un hash.

Adaptado de tools/job_key.py de ai-job-search (MIT, (c) 2026 Mads Lorentzen;
ver ATTRIBUTION.md) a la clave `empresa|titulo` y al schema de Arcane.

Uso:
  python .claude/skills/job-scrape/scripts/job_key.py --company "Acme Inc." --title "Backend Dev (Remote)" [--url URL]
  python .claude/skills/job-scrape/scripts/job_key.py --audit [ruta/a/seen_jobs.json]

Sin ruta, --audit lee <workspace>/tools/job_scraper/seen_jobs.json, con el
workspace de CAREER_WORKSPACE o ./career-workspace. Sale 0 con una clave, o con
una auditoria sin problemas; 1 si la auditoria encuentra claves malformadas o
URLs repetidas en dos entradas. Nunca renombra nada: reporta y decide el usuario.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

COMPANY_MAX = 40
TITLE_MAX = 60
HASH_LEN = 6

LEGAL_SUFFIXES = {
    "inc", "llc", "ltd", "ltda", "corp", "co", "plc", "gmbh", "ag", "bv", "sa", "sas", "sl",
    "srl", "spa", "sapi", "sac", "cv", "de", "limited", "corporation", "company",
}
QUALIFIERS = {
    "remote", "remoto", "remota", "latam", "hybrid", "hibrido", "hibrida", "onsite", "on-site",
    "presencial", "full-time", "part-time", "contract", "contractor", "freelance", "worldwide",
    "anywhere", "global", "usa", "us", "eu", "emea", "americas",
}
_PAREN = re.compile(r"\(([^()]*)\)")
_WORD = re.compile(r"[a-z0-9]+(?:\.[a-z0-9]+)*")
_JOB_ID = re.compile(r"(\d{6,})")
# Clave canonica: dos slugs separados por un solo "|".
_SLUG = r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?"
_CANONICAL = re.compile(rf"^{_SLUG}\|{_SLUG}$")


def _ascii(text):
    return unicodedata.normalize("NFKD", str(text or "")).encode("ascii", "ignore").decode("ascii").lower()


def slugify(text):
    """Palabras ASCII unidas con "-"; el "." solo sobrevive entre alfanumericos."""
    return "-".join(_WORD.findall(_ascii(text)))


def _lost_letters(text):
    """True si pasar a ASCII tiro letras de otro alfabeto, y el slug ya no identifica.

    Las letras latinas sin descomposicion (o, ae, ss, l con trazo) no cuentan:
    "Ørsted" queda "rsted" y no choca con nadie en la practica.
    """
    for ch in unicodedata.normalize("NFKD", str(text or "")):
        if ord(ch) >= 128 and ch.isalpha() and not unicodedata.name(ch, "LATIN").startswith("LATIN"):
            return True
    return False


def _cap(slug, limit):
    """Acota el largo sin que el corte cambie entre corridas: hash del slug completo."""
    if len(slug) <= limit:
        return slug
    return f"{slug[:limit].rstrip('-.')}-{hashlib.sha1(slug.encode('utf-8')).hexdigest()[:HASH_LEN]}"


def _digest(text):
    return hashlib.sha1(str(text).encode("utf-8")).hexdigest()[:HASH_LEN]


def company_slug(company):
    words = slugify(company).split("-") if slugify(company) else []
    while len(words) > 1 and words[-1].replace(".", "") in LEGAL_SUFFIXES:
        words.pop()
    slug = _cap("-".join(words), COMPANY_MAX)
    if slug and not _lost_letters(company):
        return slug
    name = unicodedata.normalize("NFC", str(company or "").strip().casefold())
    if not name:
        return "sin-empresa"
    # Un nombre en otro alfabeto igual tiene identidad: el hash. Lo latino que
    # sobrevive queda como prefijo legible ("Сбер AI" y "Яндекс AI" dan "ai").
    return f"{slug}-{_digest(name)}" if slug else f"empresa-{_digest(name)}"


def title_slug(title, url=""):
    def keep(group):
        words = set(slugify(group.group(1)).split("-"))
        return " " if words and words <= QUALIFIERS else group.group(0)

    slug = _cap(slugify(_PAREN.sub(keep, str(title or ""))), TITLE_MAX)
    if slug and not _lost_letters(title):
        return slug
    # Titulo en otro alfabeto: el id numerico del portal es la identidad estable;
    # sin id, el hash de la URL (no del titulo: un portal que re-publica con otro
    # titulo guardaria la misma oferta dos veces).
    match = _JOB_ID.search(url or "")
    if match:
        return f"{slug}-{match.group(1)}" if slug else match.group(1)
    digest = _digest(url or title)
    return f"{slug}-{digest}" if slug else f"sin-titulo-{digest}"


def make_key(company, title, url=""):
    """La clave de seen_jobs.json para una oferta."""
    return f"{company_slug(company)}|{title_slug(title, url)}"


def default_state():
    workspace = Path(os.environ.get("CAREER_WORKSPACE") or "career-workspace")
    return workspace / "tools" / "job_scraper" / "seen_jobs.json"


def audit(path):
    """Claves malformadas, URLs en dos entradas, y claves que hoy darian distinto."""
    try:
        doc = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(json.dumps({"error": f"no se pudo leer {path}: {exc}"}, ensure_ascii=False), file=sys.stderr)
        return 1
    jobs = doc.get("jobs") if isinstance(doc, dict) else None
    if not isinstance(jobs, dict) or not all(isinstance(v, dict) for v in jobs.values()):
        print(json.dumps({"error": f"{path}: se esperaba un objeto 'jobs' de entradas"}, ensure_ascii=False), file=sys.stderr)
        return 1

    malformed = [k for k in jobs if not _CANONICAL.match(k)]
    by_url = {}
    for key, entry in jobs.items():
        for source in entry.get("sources") or []:
            url = str((source or {}).get("url") or "").rstrip("/")
            if url and key not in by_url.setdefault(url, []):
                by_url[url].append(key)
    duplicates = {u: ks for u, ks in by_url.items() if len(ks) > 1}
    drift = {}
    for key, entry in jobs.items():
        url = next((s.get("url") for s in entry.get("sources") or [] if isinstance(s, dict) and s.get("url")), "")
        expected = make_key(entry.get("company", ""), entry.get("title", ""), url)
        if key != expected:
            drift[key] = expected

    print(json.dumps({
        "entradas": len(jobs),
        "claves_malformadas": malformed,
        "urls_repetidas": duplicates,
        "claves_con_otra_forma": drift,
    }, indent=2, ensure_ascii=False))
    return 1 if (malformed or duplicates) else 0


def _force_utf8_output():
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)  # no existe en un StringIO de test
        if reconfigure:
            reconfigure(encoding="utf-8")


def main(argv=None):
    _force_utf8_output()
    ap = argparse.ArgumentParser(description="job_key de seen_jobs.json, o auditoria del estado.")
    ap.add_argument("--company")
    ap.add_argument("--title")
    ap.add_argument("--url", default="")
    ap.add_argument("--audit", nargs="?", const="", metavar="SEEN_JOBS_JSON")
    args = ap.parse_args(argv)

    if args.audit is not None:
        return audit(args.audit or default_state())
    if args.company is None or args.title is None:
        ap.error("pasa --company y --title, o --audit")
    print(make_key(args.company, args.title, args.url))
    return 0


if __name__ == "__main__":
    sys.exit(main())
