#!/usr/bin/env python3
"""
Importa historial de facturacion freelance desde un CSV que exportaste vos.

Mismo patron que job-scrape/network_map.py: no toca tu cuenta ni pide
credenciales. Vos bajas el CSV desde la plataforma y este script lo lee. Sin API
key, sin login, sin scrapear.

Por que detecta las columnas en vez de asumirlas: Upwork tiene al menos dos
exports distintos (Transaction History y Contract History), sus nombres de
columna no estan documentados publicamente, y cambian. Hardcodear un esquema que
no se puede verificar produce justo el codigo que falla en la primera corrida
real del usuario. Ademas asi sirve para cualquier otra fuente: Freelancer.com, un
export de tu banco, o la planilla que ya venias llevando a mano.

El contrato con el usuario es explicito: `inspect` muestra que columna se mapeo a
que campo y **que columnas no se pudieron mapear**, para que el usuario corrija
con --map antes de creerle a los numeros.

Uso:
  python import_history.py inspect transacciones.csv
  python import_history.py summary transacciones.csv
  python import_history.py summary transacciones.csv --map "Importe=monto" --map "Horas trabajadas=horas"
  python import_history.py import transacciones.csv

Read-only: nunca escribe el CSV ni las notas. Solo stdlib. Python 3.9.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import OrderedDict
from datetime import datetime

# Campos normalizados y los nombres reales con los que aparecen. El orden importa:
# se prueba coincidencia exacta primero y despues por substring, asi que los
# alias mas especificos van antes.
FIELD_ALIASES = OrderedDict([
    ("fecha", ["date", "fecha", "transaction date", "date/time", "period",
               "start date", "created", "week"]),
    ("tipo", ["type", "tipo", "transaction type", "category", "categoria"]),
    ("cliente", ["client", "cliente", "company", "empresa", "team",
                 "contract team", "buyer", "payer"]),
    ("contrato", ["contract title", "contract", "contrato", "description",
                  "descripcion", "memo", "project", "proyecto", "job title"]),
    # `fee` y `neto` van antes de `monto`: "amount" hace substring con casi todo,
    # y sin este orden una columna de fee cae en monto.
    ("fee", ["freelancer service fee", "service fee", "upwork fee", "fee",
             "comision", "commission", "marketplace fee"]),
    ("neto", ["net amount", "net", "neto", "take home", "payout", "liquido"]),
    ("monto", ["amount", "monto", "importe", "total", "gross", "bruto",
               "earnings", "ganancia"]),
    ("horas", ["hours", "horas", "quantity", "qty", "cantidad", "duration",
               "time", "hs"]),
    ("moneda", ["currency", "moneda", "curr"]),
])

# Tipos de transaccion que NO son ingreso. Un export trae de todo mezclado y
# sumar sin filtrar da un total inflado.
NON_INCOME_HINTS = ("withdrawal", "retiro", "transfer", "transferencia",
                    "membership", "connects", "refund", "reembolso",
                    "adjustment", "ajuste", "tax", "impuesto")

# En el transaction history de Upwork la comision NO es una columna: es una fila
# aparte con monto negativo y tipo "Service Fee". Sin detectarlas por fila, el
# total sale correcto pero etiquetado como bruto, y comisiones queda en cero -
# o sea, el reporte miente sobre de donde salio el numero.
FEE_ROW_HINTS = ("service fee", "freelancer fee", "upwork fee", "comision",
                 "commission", "marketplace fee", "processing fee")

DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d",
                "%b %d, %Y", "%d %b %Y", "%Y-%m-%d %H:%M:%S", "%m/%d/%y")

MIN_ROWS_FOR_RATES = 5


def fold(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", str(text or "").lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def normalize_header(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", fold(name))).strip()


def parse_money(raw):
    """
    Plata en cualquiera de los formatos que aparecen en un export real.

    Casos que se vieron y hay que aguantar: "$1,234.56", "1.234,56" (europeo),
    "(45.00)" negativo entre parentesis (convencion contable), "-", vacio, y
    sufijos de moneda tipo "120.00 USD".
    """
    text = str(raw or "").strip()
    if not text or text in ("-", "--", "n/a", "N/A"):
        return None
    negative = text.startswith("(") and text.endswith(")")
    text = re.sub(r"[()]", "", text)
    text = re.sub(r"[^\d.,\-]", "", text)
    if not text or text in ("-", ".", ","):
        return None
    # Formato europeo: la coma es el decimal si es el ultimo separador.
    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        # Coma sola: decimal si deja 1 o 2 digitos atras, si no es de miles.
        tail = text.split(",")[-1]
        text = text.replace(",", "." if len(tail) in (1, 2) else "")
    try:
        value = float(text)
    except ValueError:
        return None
    return -value if negative else value


def parse_hours(raw):
    """Horas: acepta decimal y tambien "3:30" que algunos exports usan."""
    text = str(raw or "").strip()
    if not text:
        return None
    match = re.match(r"^(\d+):([0-5]\d)$", text)
    if match:
        return int(match.group(1)) + int(match.group(2)) / 60.0
    return parse_money(text)


def parse_date(raw):
    text = str(raw or "").strip()
    if not text:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def map_columns(headers, overrides=None):
    """
    Devuelve (mapeo, sin_mapear, ambiguos).

    Ambiguo = dos columnas quieren el mismo campo. No se elige en silencio: se
    reporta, porque elegir mal ahi cambia todos los numeros de abajo.
    """
    overrides = overrides or {}
    mapping, claims = {}, {}

    # Los overrides se procesan primero y bloquean el campo: `--map` existe para
    # ganarle a la deteccion, y si se mezclaran en el mismo recorrido ganaria la
    # columna que aparece antes en el header, que es lo contrario de lo pedido.
    forced = set()
    for header in headers:
        if header in overrides:
            field = overrides[header]
            claims[field] = [header]
            forced.add(field)

    for header in headers:
        if header in overrides:
            continue
        norm = normalize_header(header)
        if not norm:
            continue
        chosen = None
        for field, aliases in FIELD_ALIASES.items():
            if field in forced:
                continue
            if norm in [normalize_header(a) for a in aliases]:
                chosen = field
                break
        if not chosen:
            for field, aliases in FIELD_ALIASES.items():
                if field in forced:
                    continue
                if any(normalize_header(a) in norm for a in aliases):
                    chosen = field
                    break
        if chosen:
            claims.setdefault(chosen, []).append(header)

    ambiguous = {}
    for field, columns in claims.items():
        if len(columns) > 1:
            ambiguous[field] = columns
        mapping[field] = columns[0]

    mapped = set(mapping.values())
    unmapped = [h for h in headers if h not in mapped and normalize_header(h)]
    return mapping, unmapped, ambiguous


def read_csv(path):
    """Lee el CSV saltando el preambulo de aviso que algunos exports ponen arriba."""
    with open(path, "r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        lines = handle.read().splitlines()
    if not lines:
        raise ValueError("el archivo esta vacio")

    # Heuristica: la fila de header es la primera con al menos 3 separadores.
    start = 0
    for index, line in enumerate(lines[:20]):
        if line.count(",") >= 2 or line.count(";") >= 2:
            start = index
            break
    sample = "\n".join(lines[start:start + 5])
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(lines[start:], dialect=dialect)
    headers = [h for h in (reader.fieldnames or []) if h is not None]
    return headers, list(reader), start


def normalize_rows(rows, mapping):
    out = []
    for raw in rows:
        def get(field):
            column = mapping.get(field)
            return raw.get(column) if column else None

        monto = parse_money(get("monto"))
        fee = parse_money(get("fee"))
        neto = parse_money(get("neto"))
        # Si el export trae bruto y fee pero no neto, se deriva. El fee suele
        # venir negativo, asi que se usa el valor absoluto.
        if neto is None and monto is not None and fee is not None:
            neto = monto - abs(fee)

        tipo = str(get("tipo") or "").strip()
        folded = fold(tipo)
        es_fila_de_fee = any(h in folded for h in FEE_ROW_HINTS)
        out.append({
            "fecha": parse_date(get("fecha")),
            "tipo": tipo,
            "es_fila_de_fee": es_fila_de_fee,
            "es_ingreso": not es_fila_de_fee and not any(h in folded for h in NON_INCOME_HINTS),
            "cliente": str(get("cliente") or "").strip(),
            "contrato": str(get("contrato") or "").strip(),
            "monto": monto,
            "fee": fee,
            "neto": neto if neto is not None else monto,
            "horas": parse_hours(get("horas")),
            "moneda": str(get("moneda") or "").strip(),
        })
    return out


def summarize(rows):
    income = [r for r in rows if r["es_ingreso"]]
    fee_rows = [r for r in rows if r.get("es_fila_de_fee")]
    montos = [r["monto"] for r in income if r["monto"] is not None]
    # Las comisiones pueden venir por columna (una por movimiento) o por fila
    # aparte. Se suman las dos formas; en un export dado hay una sola.
    fees = [abs(r["fee"]) for r in income if r["fee"] is not None]
    fees += [abs(r["monto"]) for r in fee_rows if r["monto"] is not None]
    # El neto se deriva del bruto menos comisiones cuando estas vienen por fila,
    # porque en ese caso la columna `neto` de cada movimiento no las conoce.
    netos = [r["neto"] for r in income if r["neto"] is not None]
    horas = [r["horas"] for r in income if r["horas"] is not None]
    fechas = sorted(r["fecha"] for r in rows if r["fecha"])

    por_cliente = {}
    for row in income:
        key = row["cliente"] or "(sin cliente)"
        bucket = por_cliente.setdefault(key, {"neto": 0.0, "horas": 0.0, "movimientos": 0})
        bucket["neto"] += row["neto"] or 0
        bucket["horas"] += row["horas"] or 0
        bucket["movimientos"] += 1

    total_bruto = sum(montos)
    total_fees = sum(fees)
    total_neto = (total_bruto - total_fees) if fee_rows else sum(netos)
    ranking = sorted(por_cliente.items(), key=lambda kv: kv[1]["neto"], reverse=True)
    concentracion = None
    if total_neto and ranking:
        concentracion = {
            "cliente_mas_grande": ranking[0][0],
            "porcentaje_del_ingreso": round(ranking[0][1]["neto"] / total_neto * 100, 1),
        }

    # La tarifa efectiva es el numero que dice si el negocio funciona, pero
    # solo se puede calcular si el export trae horas. Sin horas se dice que
    # falta el dato, no se estima.
    tarifa_efectiva = None
    if horas and sum(horas) > 0 and total_neto:
        tarifa_efectiva = round(total_neto / sum(horas), 2)

    return {
        "movimientos_leidos": len(rows),
        "movimientos_de_ingreso": len(income),
        "filas_de_comision": len(fee_rows),
        "excluidos_por_tipo": len(rows) - len(income) - len(fee_rows),
        "rango_de_fechas": [str(fechas[0]), str(fechas[-1])] if fechas else None,
        "bruto": round(total_bruto, 2) if montos else None,
        "comisiones": round(total_fees, 2) if fees else None,
        "neto": round(total_neto, 2) if (netos or fee_rows) else None,
        "horas_registradas": round(sum(horas), 2) if horas else None,
        "tarifa_efectiva_por_hora": tarifa_efectiva,
        "tarifa_efectiva_calculable": tarifa_efectiva is not None,
        "por_cliente": OrderedDict(
            (name, {"neto": round(v["neto"], 2), "horas": round(v["horas"], 2),
                    "movimientos": v["movimientos"]})
            for name, v in ranking),
        "concentracion": concentracion,
        "muestra_suficiente": len(income) >= MIN_ROWS_FOR_RATES,
    }


# --------------------------------------------------------------------------- #

def load(args):
    headers, rows, skipped = read_csv(args.csv)
    overrides = {}
    for item in (args.map or []):
        if "=" not in item:
            raise ValueError("--map espera 'Columna=campo', recibi: {0}".format(item))
        column, field = item.split("=", 1)
        field = field.strip()
        if field not in FIELD_ALIASES:
            raise ValueError("campo desconocido '{0}'; validos: {1}".format(
                field, ", ".join(FIELD_ALIASES)))
        overrides[column.strip()] = field
    mapping, unmapped, ambiguous = map_columns(headers, overrides)
    return headers, rows, skipped, mapping, unmapped, ambiguous


def run_inspect(args) -> int:
    headers, rows, skipped, mapping, unmapped, ambiguous = load(args)
    faltantes = [f for f in ("fecha", "monto") if f not in mapping]
    emit({
        "archivo": args.csv,
        "filas_de_preambulo_salteadas": skipped,
        "columnas_encontradas": headers,
        "mapeo": mapping,
        "columnas_sin_mapear": unmapped,
        "columnas_ambiguas": ambiguous,
        "campos_criticos_faltantes": faltantes,
        "usable": not faltantes,
        "ejemplo_normalizado": normalize_rows(rows[:2], mapping),
        "como_corregir": "--map \"Nombre exacto de la columna=campo\"; campos: {0}".format(
            ", ".join(FIELD_ALIASES)),
    })
    return 0 if not faltantes else 1


def run_summary(args) -> int:
    _, rows, _, mapping, unmapped, ambiguous = load(args)
    if "monto" not in mapping:
        emit({"error": "no encontre la columna de monto; corre `inspect` y usa --map",
              "code": "NO_AMOUNT_COLUMN"})
        return 1
    payload = summarize(normalize_rows(rows, mapping))
    payload["mapeo_usado"] = mapping
    # Se repiten aca a proposito: quien mira el summary tiene que ver si el
    # mapeo dejo algo afuera antes de creerle a los totales.
    payload["columnas_sin_mapear"] = unmapped
    payload["columnas_ambiguas"] = ambiguous
    emit(payload)
    return 0


def run_import(args) -> int:
    _, rows, _, mapping, unmapped, ambiguous = load(args)
    emit({
        "mapeo_usado": mapping,
        "columnas_sin_mapear": unmapped,
        "columnas_ambiguas": ambiguous,
        "movimientos": normalize_rows(rows, mapping),
    })
    return 0


def emit(payload) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2, default=str)
    sys.stdout.write("\n")


def force_utf8_streams() -> None:
    """En Windows stdout es cp1252 y un nombre con acento revienta al pipear."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Importa historial de facturacion freelance desde un CSV exportado a mano.")
    sub = parser.add_subparsers(dest="command", required=True)
    for name, func, help_text in (
        ("inspect", run_inspect, "mostrar que columnas detecto y cuales no pudo mapear"),
        ("summary", run_summary, "totales, tarifa efectiva y concentracion de clientes"),
        ("import", run_import, "volcar los movimientos normalizados en JSON"),
    ):
        cmd = sub.add_parser(name, help=help_text)
        cmd.add_argument("csv", help="ruta del CSV exportado")
        cmd.add_argument("--map", action="append",
                         help="forzar un mapeo: \"Columna=campo\" (repetible)")
        cmd.set_defaults(func=func)
    return parser


def main(argv=None) -> int:
    force_utf8_streams()
    args = build_parser().parse_args(argv)
    try:
        return args.func(args)
    except (OSError, ValueError) as e:
        emit({"error": str(e), "code": "BAD_INPUT"})
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
