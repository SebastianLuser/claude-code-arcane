#!/usr/bin/env python3
"""
Imports freelance billing history from a CSV you exported yourself.

Same pattern as job-scrape/network_map.py: it does not touch your account or ask
for credentials. You download the CSV from the platform and this script reads
it. No API key, no login, no scraping.

Why it detects the columns instead of assuming them: Upwork has at least two
different exports (Transaction History and Contract History), their column
names are not publicly documented, and they change. Hardcoding a schema that
cannot be verified produces exactly the code that fails on the user's first
real run. It also makes it work for any other source: Freelancer.com, a bank
export, or the spreadsheet you were already keeping by hand. The column names
and transaction types it knows live in columns.<lang>.json next to this script
(columns.en.json, columns.es.json); every pack applies at once, and a new
language is a new pack.

The contract with the user is explicit: `inspect` shows which column was mapped
to which field and **which columns could not be mapped**, so the user fixes it
with --map before trusting the numbers.

Usage:
  python import_history.py inspect transactions.csv
  python import_history.py summary transactions.csv
  python import_history.py summary transactions.csv --map "Payment=amount" --map "Hours worked=hours"
  python import_history.py import transactions.csv

Read-only: never writes the CSV or the notes. Stdlib only. Python 3.9.
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
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Normalized fields. Field order matters: exact matches are tried first and
# then substrings, field by field in this order. `fee` and `net` go before
# `amount`: "amount" is a substring of almost everything, and without this
# order a fee column falls into amount.
FIELDS = ("date", "type", "client", "contract", "fee", "net", "amount", "hours", "currency")


def load_packs():
    """Every columns.<lang>.json next to this script: a hand-kept spreadsheet mixes languages."""
    packs = []
    for path in sorted(HERE.glob("columns.*.json")):
        with open(path, encoding="utf-8") as handle:
            packs.append(json.load(handle))
    return packs


_PACKS = load_packs()

# The real column names each field shows up with, from every pack.
FIELD_ALIASES = OrderedDict(
    (field, [alias for pack in _PACKS for alias in pack["fields"].get(field, [])])
    for field in FIELDS)

# Transaction types that are NOT income. An export mixes everything together
# and summing without filtering gives an inflated total.
NON_INCOME_HINTS = tuple(hint for pack in _PACKS for hint in pack["non_income_types"])

# In Upwork's transaction history the fee is NOT a column: it is a separate
# row with a negative amount and type "Service Fee". Without detecting them per
# row, the total comes out right but labeled as gross, and fees stay at zero -
# in other words, the report lies about where the number came from.
FEE_ROW_HINTS = tuple(hint for pack in _PACKS for hint in pack["fee_row_types"])

DATE_FORMATS = (
    "%Y-%m-%d",
    "%d/%m/%Y",
    "%m/%d/%Y",
    "%Y/%m/%d",
    "%b %d, %Y",
    "%d %b %Y",
    "%Y-%m-%d %H:%M:%S",
    "%m/%d/%y",
)

MIN_ROWS_FOR_RATES = 5


def fold(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", str(text or "").lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn")


def normalize_header(name: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", fold(name))).strip()


def parse_money(raw):
    """
    Money in any of the formats a real export shows.

    Cases that were seen and must be handled: "$1,234.56", "1.234,56" (European),
    "(45.00)" negative in parentheses (accounting convention), "-", empty, and
    currency suffixes like "120.00 USD".
    """
    text = str(raw or "").strip()
    if not text or text in ("-", "--", "n/a", "N/A"):
        return None
    negative = text.startswith("(") and text.endswith(")")
    text = re.sub(r"[()]", "", text)
    text = re.sub(r"[^\d.,\-]", "", text)
    if not text or text in ("-", ".", ","):
        return None
    # European format: the comma is the decimal if it is the last separator.
    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        # Comma alone: decimal if it leaves 1 or 2 digits after it, thousands otherwise.
        tail = text.split(",")[-1]
        text = text.replace(",", "." if len(tail) in (1, 2) else "")
    try:
        value = float(text)
    except ValueError:
        return None
    return -value if negative else value


def parse_hours(raw):
    """Hours: accepts decimals and also the "3:30" some exports use."""
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
    Returns (mapping, unmapped, ambiguous).

    Ambiguous = two columns want the same field. It is not picked silently: it
    is reported, because picking wrong there changes every number below.
    """
    overrides = overrides or {}
    mapping, claims = {}, {}

    # Overrides are processed first and lock the field: `--map` exists to beat
    # detection, and if they were mixed into the same pass the column that
    # appears first in the header would win, which is the opposite of the ask.
    forced = set()
    for header in headers:
        if header in overrides:
            field = overrides[header]
            claims[field] = [header]
            forced.add(field)

    # Exact names first, over every header: "Amount" must beat the partial
    # match "total" finds in an earlier "Total Hours" column.
    candidates = [h for h in headers if h not in overrides and normalize_header(h)]
    exact = set()
    for header in candidates:
        norm = normalize_header(header)
        for field, aliases in FIELD_ALIASES.items():
            if field not in forced and norm in [normalize_header(a) for a in aliases]:
                claims.setdefault(field, []).append(header)
                exact.add(header)
                break
    for header in candidates:
        if header in exact:
            continue
        norm = normalize_header(header)
        for field, aliases in FIELD_ALIASES.items():
            if field in forced:
                continue
            if any(normalize_header(a) in norm for a in aliases):
                claims.setdefault(field, []).append(header)
                break

    ambiguous = {}
    for field, columns in claims.items():
        if len(columns) > 1:
            ambiguous[field] = columns
        mapping[field] = columns[0]

    mapped = set(mapping.values())
    unmapped = [h for h in headers if h not in mapped and normalize_header(h)]
    return mapping, unmapped, ambiguous


def read_csv(path):
    """Reads the CSV skipping the notice preamble some exports put on top."""
    with open(path, "r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        lines = handle.read().splitlines()
    if not lines:
        raise ValueError("the file is empty")

    # Heuristic: the header row is the first one with at least 3 separators.
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

        amount = parse_money(get("amount"))
        fee = parse_money(get("fee"))
        net = parse_money(get("net"))
        # If the export has gross and fee but no net, net is derived. The fee
        # usually comes negative, so the absolute value is used.
        if net is None and amount is not None and fee is not None:
            net = amount - abs(fee)

        kind = str(get("type") or "").strip()
        folded = fold(kind)
        is_fee_row = any(h in folded for h in FEE_ROW_HINTS)
        out.append({
            "date": parse_date(get("date")),
            "type": kind,
            "is_fee_row": is_fee_row,
            "is_income": not is_fee_row and not any(h in folded for h in NON_INCOME_HINTS),
            "client": str(get("client") or "").strip(),
            "contract": str(get("contract") or "").strip(),
            "amount": amount,
            "fee": fee,
            "net": net if net is not None else amount,
            "hours": parse_hours(get("hours")),
            "currency": str(get("currency") or "").strip(),
        })
    return out


def summarize(rows):
    income = [r for r in rows if r["is_income"]]
    fee_rows = [r for r in rows if r.get("is_fee_row")]
    amounts = [r["amount"] for r in income if r["amount"] is not None]
    # Fees can come as a column (one per transaction) or as a separate row.
    # Both forms are added up; a given export has only one.
    fees = [abs(r["fee"]) for r in income if r["fee"] is not None]
    fees += [abs(r["amount"]) for r in fee_rows if r["amount"] is not None]
    # Net is derived from gross minus fees when fees come as rows, because in
    # that case each transaction's `net` column does not know about them.
    nets = [r["net"] for r in income if r["net"] is not None]
    hours = [r["hours"] for r in income if r["hours"] is not None]
    dates = sorted(r["date"] for r in rows if r["date"])

    by_client = {}
    for row in income:
        key = row["client"] or "(no client)"
        bucket = by_client.setdefault(key, {"net": 0.0, "hours": 0.0, "transactions": 0})
        bucket["net"] += row["net"] or 0
        bucket["hours"] += row["hours"] or 0
        bucket["transactions"] += 1

    total_gross = sum(amounts)
    total_fees = sum(fees)
    total_net = (total_gross - total_fees) if fee_rows else sum(nets)
    ranking = sorted(by_client.items(), key=lambda kv: kv[1]["net"], reverse=True)
    concentration = None
    if total_net and ranking:
        concentration = {
            "largest_client": ranking[0][0],
            "share_of_income_pct": round(ranking[0][1]["net"] / total_net * 100, 1),
        }

    # The effective rate is the number that says whether the business works,
    # but it can only be computed if the export has hours. Without hours the
    # report says the data is missing; it does not estimate.
    effective_rate = None
    if hours and sum(hours) > 0 and total_net:
        effective_rate = round(total_net / sum(hours), 2)

    return {
        "transactions_read": len(rows),
        "income_transactions": len(income),
        "fee_rows": len(fee_rows),
        "excluded_by_type": len(rows) - len(income) - len(fee_rows),
        "date_range": [str(dates[0]), str(dates[-1])] if dates else None,
        "gross": round(total_gross, 2) if amounts else None,
        "fees": round(total_fees, 2) if fees else None,
        "net": round(total_net, 2) if (nets or fee_rows) else None,
        "hours_logged": round(sum(hours), 2) if hours else None,
        "effective_hourly_rate": effective_rate,
        "effective_rate_computable": effective_rate is not None,
        "by_client": OrderedDict(
            (name, {"net": round(v["net"], 2), "hours": round(v["hours"], 2),
                    "transactions": v["transactions"]})
            for name, v in ranking),
        "concentration": concentration,
        "enough_sample": len(income) >= MIN_ROWS_FOR_RATES,
    }


# --------------------------------------------------------------------------- #

def load(args):
    headers, rows, skipped = read_csv(args.csv)
    overrides = {}
    for item in (args.map or []):
        if "=" not in item:
            raise ValueError("--map expects 'Column=field', got: {0}".format(item))
        column, field = item.split("=", 1)
        field = field.strip()
        if field not in FIELD_ALIASES:
            raise ValueError("unknown field '{0}'; valid: {1}".format(
                field, ", ".join(FIELD_ALIASES)))
        overrides[column.strip()] = field
    mapping, unmapped, ambiguous = map_columns(headers, overrides)
    return headers, rows, skipped, mapping, unmapped, ambiguous


def run_inspect(args) -> int:
    headers, rows, skipped, mapping, unmapped, ambiguous = load(args)
    missing = [f for f in ("date", "amount") if f not in mapping]
    emit({
        "file": args.csv,
        "preamble_rows_skipped": skipped,
        "columns_found": headers,
        "mapping": mapping,
        "unmapped_columns": unmapped,
        "ambiguous_columns": ambiguous,
        "missing_critical_fields": missing,
        "usable": not missing,
        "normalized_sample": normalize_rows(rows[:2], mapping),
        "how_to_fix": "--map \"Exact column name=field\"; fields: {0}".format(
            ", ".join(FIELD_ALIASES)),
    })
    return 0 if not missing else 1


def run_summary(args) -> int:
    _, rows, _, mapping, unmapped, ambiguous = load(args)
    if "amount" not in mapping:
        emit({"error": "no amount column found; run `inspect` and use --map",
              "code": "NO_AMOUNT_COLUMN"})
        return 1
    payload = summarize(normalize_rows(rows, mapping))
    payload["mapping_used"] = mapping
    # Repeated here on purpose: whoever reads the summary has to see whether
    # the mapping left something out before trusting the totals.
    payload["unmapped_columns"] = unmapped
    payload["ambiguous_columns"] = ambiguous
    emit(payload)
    return 0


def run_import(args) -> int:
    _, rows, _, mapping, unmapped, ambiguous = load(args)
    emit({
        "mapping_used": mapping,
        "unmapped_columns": unmapped,
        "ambiguous_columns": ambiguous,
        "transactions": normalize_rows(rows, mapping),
    })
    return 0


def emit(payload) -> None:
    json.dump(payload, sys.stdout, ensure_ascii=False, indent=2, default=str)
    sys.stdout.write("\n")


def force_utf8_streams() -> None:
    """On Windows stdout is cp1252 and a name with an accent blows up when piped."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")


def build_parser():
    parser = argparse.ArgumentParser(
        description="Imports freelance billing history from a CSV exported by hand.")
    sub = parser.add_subparsers(dest="command", required=True)
    for name, func, help_text in (
        ("inspect", run_inspect, "show which columns were detected and which could not be mapped"),
        ("summary", run_summary, "totals, effective rate and client concentration"),
        ("import", run_import, "dump the normalized transactions as JSON"),
    ):
        cmd = sub.add_parser(name, help=help_text)
        cmd.add_argument("csv", help="path to the exported CSV")
        cmd.add_argument("--map", action="append",
                         help="force a mapping: \"Column=field\" (repeatable)")
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
