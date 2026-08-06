#!/usr/bin/env python3
"""
Registro y trazabilidad del career workspace: empleo y freelance en un solo lugar.

Contesta la pregunta que grepear a mano no contesta bien: "¿ya me postule aca?".
Y exporta todo a CSV para mirarlo en una planilla.

La regla que sostiene todo esto: **las notas son la fuente de verdad y el CSV se
deriva de ellas**. No hay una segunda base que mantener sincronizada, porque una
segunda base diverge en dos semanas y despues no sabes cual miente. Mismo flujo
unidireccional que el dedup de job-scrape: seen_jobs -> nota -> vista.

Lee tres tipos de nota, sin importar que perfil las creo:
  tipo: aplicacion  (03-Aplicaciones/, +job-hunt)
  tipo: freelance   (03-Aplicaciones/, +freelance)
  tipo: contrato    (08-Contratos/, +freelance)

Uso:
  python career_registry.py check "Acme"
  python career_registry.py check https://www.linkedin.com/jobs/view/123
  python career_registry.py export --csv registro.csv
  python career_registry.py stats
  python career_registry.py audit

Todo es read-only salvo `export --csv`, que escribe el archivo que le pidas.
Solo stdlib. Compatible con Python 3.9.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path

DEFAULT_WORKSPACE = "career-workspace"
APPLICATIONS_DIR = "03-Aplicaciones"
CONTRACTS_DIR = "08-Contratos"
SEEN_JOBS = os.path.join("tools", "job_scraper", "seen_jobs.json")

KNOWN_TIPOS = ("aplicacion", "freelance", "contrato")

# Estados abiertos por tipo: los que todavia esperan algo del otro lado.
OPEN_STATES = {
    "aplicacion": ("interesado", "aplicado", "entrevista", "oferta"),
    "freelance": ("interesado", "screeneado", "propuesta_enviada",
                  "en_conversacion", "contrato_activo"),
    "contrato": ("activo", "pausado"),
}
# Estados que significan "esto ya se envio" - los que importan para no repetir.
SENT_STATES = ("aplicado", "entrevista", "oferta", "contratado", "rechazado",
               "sin_respuesta", "declinada", "propuesta_enviada",
               "en_conversacion", "contrato_activo", "entregado",
               "ganado_cerrado", "disputa")

STALE_DAYS = 21

# Sufijos legales que no distinguen una empresa de otra. Mismo criterio que el
# job_key del dedup, para que las dos herramientas coincidan.
LEGAL_SUFFIXES = ("inc", "llc", "ltd", "sa", "srl", "sas", "gmbh", "bv", "co",
                  "corp", "company", "sl", "spa", "plc", "ag", "oy", "ab")

CSV_COLUMNS = ("tipo", "contraparte", "titulo", "estado", "abierto", "plataforma",
               "match_score", "riesgo_cliente", "perfil", "bid_o_monto",
               "costo_postulacion", "fecha_envio", "fecha_actualizacion",
               "dias_sin_movimiento", "link_oferta", "nota")


# --------------------------------------------------------------------------- #
# Lectura de notas
# --------------------------------------------------------------------------- #

def fold(text: str) -> str:
    """Minusculas sin acentos, para comparar 'Tecnologia' con 'tecnología'."""
    decomposed = unicodedata.normalize("NFD", (text or "").lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def slug(text: str) -> str:
    """
    Nombre comparable: sin acentos, sin puntuacion, sin sufijo legal.

    Los puntos se borran ANTES de tokenizar, no se cambian por espacios: "S.A."
    tiene que colapsar a "sa" para que el sufijo legal se reconozca. Partiendolo
    quedaba "s" y "a", ninguno esta en la lista, y "Globex S.A." no matcheaba con
    "Globex".
    """
    base = re.sub(r"\.", "", fold(text))
    base = re.sub(r"[^a-z0-9 ]+", " ", base)
    words = [w for w in base.split() if w and w not in LEGAL_SUFFIXES]
    return " ".join(words)


def parse_frontmatter(text: str):
    """
    Frontmatter YAML plano: `clave: valor` y listas en bloque.

    No usa pyyaml porque los scripts de skill corren sin instalar nada. Soporta
    lo que los templates del workspace realmente usan; cualquier cosa mas
    exotica se ignora en vez de reventar.
    """
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fields = {}
    key = None
    for raw in text[3:end].splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.lstrip().startswith("- ") and key:
            # Una lista en bloque solo cuenta si la clave quedo vacia; si no, el
            # valor escalar ya leido es el bueno.
            if not isinstance(fields.get(key), list):
                if str(fields.get(key) or "").strip():
                    continue
                fields[key] = []
            fields[key].append(line.lstrip()[2:].strip())
            continue
        match = re.match(r"^([A-Za-z0-9_-]+)\s*:\s*(.*)$", line)
        if not match:
            continue
        key = match.group(1)
        fields[key] = match.group(2).strip()
    return fields


def parse_date(value):
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(str(value).strip(), fmt).date()
        except (ValueError, TypeError):
            continue
    return None


def number(value):
    """Numero o None. Un campo de template vacio no es un cero."""
    text = str(value or "").strip().replace(",", ".")
    try:
        return float(text)
    except ValueError:
        return None


def days_since(value, today):
    parsed = parse_date(value)
    return (today - parsed).days if parsed else None


def canonical_url(url: str) -> str:
    """URL sin tracking, para que dos links de la misma oferta coincidan."""
    if not url:
        return ""
    clean = url.strip().split("#")[0]
    clean = re.sub(r"[?&](utm_[^&]*|ref|source|trk|trackingId)=[^&]*", "", clean)
    clean = re.sub(r"[?&]$", "", clean)
    match = re.search(r"linkedin\.com/jobs/view/(\d+)", clean)
    if match:
        return "https://www.linkedin.com/jobs/view/{0}".format(match.group(1))
    return clean.rstrip("/").lower()


def load_notes(workspace: Path):
    """Todas las notas de aplicaciones, propuestas y contratos, normalizadas."""
    rows, problems = [], []
    today = date.today()

    for folder in (APPLICATIONS_DIR, CONTRACTS_DIR):
        base = workspace / folder
        if not base.exists():
            continue
        for path in sorted(base.rglob("*.md")):
            if path.name.startswith("_"):  # _index y similares
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError as e:
                problems.append({"nota": path.name, "problema": "no se pudo leer: {0}".format(e)})
                continue
            fields = parse_frontmatter(text)
            if not fields:
                problems.append({"nota": path.name, "problema": "sin frontmatter"})
                continue

            tipo = (fields.get("tipo") or "").strip() or "desconocido"
            if tipo not in KNOWN_TIPOS:
                problems.append({"nota": path.name,
                                 "problema": "tipo desconocido: {0}".format(tipo)})

            estado = (fields.get("estado") or "").strip()
            # Compatibilidad: notas viejas usan `score` en vez de `match_score`.
            score = fields.get("match_score") or fields.get("score") or ""
            # Empresa en empleo, cliente en freelance y contratos.
            contraparte = (fields.get("empresa") or fields.get("cliente") or "").strip()
            fecha_envio = fields.get("fecha_aplicacion") or fields.get("fecha_envio") \
                or fields.get("fecha_inicio") or ""
            actualizacion = fields.get("fecha_actualizacion") or ""

            rows.append({
                "tipo": tipo,
                "contraparte": contraparte,
                "titulo": path.stem,
                "estado": estado,
                "abierto": "si" if estado in OPEN_STATES.get(tipo, ()) else "no",
                "plataforma": (fields.get("plataforma") or fields.get("fuente") or "").strip(),
                "match_score": score,
                "riesgo_cliente": (fields.get("riesgo_cliente") or "").strip(),
                "perfil": (fields.get("perfil") or fields.get("perfil_base") or "").strip(),
                "bid_o_monto": (fields.get("bid") or fields.get("monto_acordado")
                                or fields.get("salario_rango") or "").strip(),
                "costo_postulacion": (fields.get("connects_gastados") or "").strip(),
                "fecha_envio": fecha_envio,
                "fecha_actualizacion": actualizacion,
                "dias_sin_movimiento": days_since(actualizacion, today),
                "link_oferta": (fields.get("link_oferta") or "").strip(),
                "nota": str(path.relative_to(workspace)).replace("\\", "/"),
                # Solo en contratos. Se guardan crudas para que audit compare sin
                # tener que reabrir el archivo.
                "horas_estimadas": number(fields.get("horas_estimadas")),
                "horas_reales": number(fields.get("horas_reales")),
            })

    return rows, problems


def load_seen_jobs(workspace: Path):
    path = workspace / SEEN_JOBS
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except (OSError, ValueError):
        return None


# --------------------------------------------------------------------------- #
# check: la pregunta "¿ya me postule aca?"
# --------------------------------------------------------------------------- #

def match_rows(rows, needle: str):
    """
    Busca por tres claves distintas porque el usuario pega cualquiera de las tres:
    el nombre de la contraparte, la URL de la oferta, o el titulo de la nota.
    """
    hits = []
    url = canonical_url(needle) if "://" in needle else ""
    target = slug(needle)

    for row in rows:
        why = None
        if url and canonical_url(row["link_oferta"]) == url:
            why = "misma URL de la oferta"
        elif target and target == slug(row["contraparte"]):
            why = "misma contraparte"
        elif target and target and target in slug(row["titulo"]):
            why = "coincide con el titulo de la nota"
        elif target and slug(row["contraparte"]) and target in slug(row["contraparte"]):
            why = "contraparte parecida"
        if why:
            hits.append(dict(row, coincide_por=why))
    return hits


def run_check(args) -> int:
    workspace = resolve_workspace(args)
    rows, _ = load_notes(workspace)
    needle = args.termino
    hits = match_rows(rows, needle)

    seen = load_seen_jobs(workspace)
    seen_hits = []
    if seen and "://" in needle:
        url = canonical_url(needle)
        for entry in (seen.get("jobs") or seen.get("entries") or []):
            if canonical_url(str(entry.get("url") or "")) == url:
                seen_hits.append({"status": entry.get("status"),
                                  "quick_score": entry.get("quick_score"),
                                  "nota": entry.get("nota"),
                                  "last_seen": entry.get("last_seen")})

    already_sent = [h for h in hits if h["estado"] in SENT_STATES]
    veredicto = "YA TE POSTULASTE" if already_sent else (
        "YA LO VISTE, NO TE POSTULASTE" if (hits or seen_hits) else "SIN REGISTRO")

    emit({
        "busque": needle,
        "veredicto": veredicto,
        "coincidencias_en_notas": hits,
        "coincidencias_en_dedup": seen_hits,
        "dedup_disponible": seen is not None,
    })
    return 0


# --------------------------------------------------------------------------- #
# export, stats, audit
# --------------------------------------------------------------------------- #

def run_export(args) -> int:
    workspace = resolve_workspace(args)
    rows, problems = load_notes(workspace)
    if args.tipo != "all":
        rows = [r for r in rows if r["tipo"] == args.tipo]
    rows.sort(key=lambda r: (r["tipo"], str(r["fecha_actualizacion"] or ""), r["titulo"]),
              reverse=True)

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(CSV_COLUMNS), extrasaction="ignore",
                            lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    content = buffer.getvalue()

    if args.csv:
        target = Path(args.csv)
        # newline="" para que csv no meta \r\r\n en Windows.
        with open(target, "w", encoding="utf-8-sig", newline="") as handle:
            handle.write(content)
        emit({"escrito": str(target), "filas": len(rows), "columnas": list(CSV_COLUMNS),
              "notas_con_problemas": problems})
        return 0

    sys.stdout.write(content)
    return 0


def run_stats(args) -> int:
    workspace = resolve_workspace(args)
    rows, problems = load_notes(workspace)
    today = date.today()

    by_tipo = {}
    for row in rows:
        bucket = by_tipo.setdefault(row["tipo"], {"total": 0, "abiertas": 0, "por_estado": {}})
        bucket["total"] += 1
        bucket["abiertas"] += 1 if row["abierto"] == "si" else 0
        estado = row["estado"] or "(sin estado)"
        bucket["por_estado"][estado] = bucket["por_estado"].get(estado, 0) + 1

    enviadas = [r for r in rows if r["estado"] in SENT_STATES]
    costo = sum(float(r["costo_postulacion"]) for r in enviadas
                if str(r["costo_postulacion"]).replace(".", "", 1).isdigit())

    emit({
        "hoy": today.isoformat(),
        "total_notas": len(rows),
        "por_tipo": by_tipo,
        "enviadas": len(enviadas),
        "costo_de_postulaciones_registrado": costo or None,
        "notas_con_problemas": len(problems),
        # Sin muestra suficiente, cualquier tasa es ruido. Que lo diga el script
        # y no la interpretacion de despues.
        "muestra_suficiente_para_tasas": len(enviadas) >= 10,
    })
    return 0


def run_audit(args) -> int:
    """Divergencias. Sin esto la trazabilidad es una intencion."""
    workspace = resolve_workspace(args)
    rows, problems = load_notes(workspace)
    seen = load_seen_jobs(workspace)
    today = date.today()

    sin_estado = [r["nota"] for r in rows if not r["estado"]]
    sin_contraparte = [r["nota"] for r in rows if not r["contraparte"]]
    enviadas_sin_fecha = [r["nota"] for r in rows
                          if r["estado"] in SENT_STATES and not r["fecha_envio"]]
    frenadas = [{"nota": r["nota"], "estado": r["estado"],
                 "dias": r["dias_sin_movimiento"]}
                for r in rows
                if r["abierto"] == "si" and (r["dias_sin_movimiento"] or 0) >= STALE_DAYS]

    # Duplicados: la misma contraparte con el mismo titulo dos veces.
    keys = {}
    for row in rows:
        key = (slug(row["contraparte"]), slug(row["titulo"]))
        if not key[0]:
            continue
        keys.setdefault(key, []).append(row["nota"])
    duplicados = [{"contraparte": k[0], "notas": v} for k, v in keys.items() if len(v) > 1]

    # Horas reales por encima de lo estimado = trabajo regalado si no hubo change
    # order. Aca solo se senala; el analisis del patron es de /freelance-pipeline.
    horas_de_mas = []
    for row in rows:
        est, real = row.get("horas_estimadas"), row.get("horas_reales")
        if est and real and real > est:
            horas_de_mas.append({
                "nota": row["nota"], "estimadas": est, "reales": real,
                "exceso_horas": round(real - est, 2),
                "exceso_pct": round((real - est) / est * 100),
            })

    punteros_rotos = []
    if seen:
        existing = {r["nota"] for r in rows}
        for entry in (seen.get("jobs") or seen.get("entries") or []):
            target = entry.get("nota")
            if target and not any(target in n or n in target for n in existing):
                punteros_rotos.append({"url": entry.get("url"), "nota": target})

    emit({
        "notas_revisadas": len(rows),
        "sin_frontmatter_o_tipo_raro": problems,
        "sin_estado": sin_estado,
        "sin_contraparte": sin_contraparte,
        "enviadas_sin_fecha_de_envio": enviadas_sin_fecha,
        "abiertas_frenadas_mas_de_{0}_dias".format(STALE_DAYS): frenadas,
        "posibles_duplicados": duplicados,
        "contratos_con_horas_arriba_de_lo_estimado": horas_de_mas,
        "punteros_de_dedup_rotos": punteros_rotos,
        "dedup_disponible": seen is not None,
    })
    return 0


# --------------------------------------------------------------------------- #

def resolve_workspace(args) -> Path:
    candidate = args.workspace or os.environ.get("CAREER_WORKSPACE") or DEFAULT_WORKSPACE
    path = Path(candidate).expanduser()
    if not path.exists():
        emit({"error": "no existe el workspace: {0}".format(path),
              "code": "NO_WORKSPACE",
              "ayuda": "pasa --workspace, o defini CAREER_WORKSPACE, o corre /freelance-hunt setup"})
        raise SystemExit(1)
    return path


def emit(payload) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2, default=str)
    sys.stdout.write("\n")


def force_utf8_streams() -> None:
    """En Windows stdout es cp1252 y un acento revienta al pipear a un archivo."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Registro y trazabilidad de postulaciones, propuestas y contratos.")
    parser.add_argument("--workspace", help="ruta del career workspace")
    sub = parser.add_subparsers(dest="command", required=True)

    check = sub.add_parser("check", help="¿ya me postule aca? por empresa, URL o titulo")
    check.add_argument("termino")
    check.set_defaults(func=run_check)

    export = sub.add_parser("export", help="exportar todo a CSV")
    export.add_argument("--csv", help="archivo destino; sin esto va a stdout")
    export.add_argument("--tipo", default="all",
                        choices=list(KNOWN_TIPOS) + ["all"])
    export.set_defaults(func=run_export)

    stats = sub.add_parser("stats", help="conteos por tipo y estado")
    stats.set_defaults(func=run_stats)

    audit = sub.add_parser("audit", help="divergencias, duplicados y notas frenadas")
    audit.set_defaults(func=run_audit)
    return parser


def main(argv=None) -> int:
    force_utf8_streams()
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except SystemExit as e:
        return int(e.code or 0)
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
