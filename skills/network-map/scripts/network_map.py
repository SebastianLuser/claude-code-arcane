"""
network_map.py — Parse a LinkedIn "Connections.csv" data export and query it.

LinkedIn's export prepends a few notice lines before the real CSV header
(First Name, Last Name, URL, Email Address, Company, Position, Connected On).
This script skips that preamble, then lets you:

    # contacts at a target company (substring, case-insensitive)
    python network_map.py --csv Connections.csv --company "Acme"

    # companies where you have the most connections
    python network_map.py --csv Connections.csv --top-companies [N]

Output is a simple table to stdout. The skill turns it into intro paths
and tailored messages — this script only does the data wrangling.

Privacy: Connections.csv is third-party personal data. Keep it local.
"""

import argparse
import csv
import sys
from collections import Counter
from pathlib import Path

EXPECTED_COLS = {"First Name", "Last Name", "Company", "Position"}


def load_rows(csv_path):
    """Read the export, skipping the notice preamble before the header row."""
    raw = Path(csv_path).read_text(encoding="utf-8", errors="replace").splitlines()
    header_idx = None
    for i, line in enumerate(raw):
        # The real header contains these column names.
        if "First Name" in line and "Last Name" in line:
            header_idx = i
            break
    if header_idx is None:
        print("[ERROR] Could not find the CSV header (First Name, Last Name, ...).")
        print("        Is this the LinkedIn Connections.csv export?")
        sys.exit(1)

    reader = csv.DictReader(raw[header_idx:])
    rows = []
    for r in reader:
        rows.append({k.strip(): (v or "").strip() for k, v in r.items() if k})
    return rows


def fullname(r):
    return f"{r.get('First Name', '')} {r.get('Last Name', '')}".strip()


def query_company(rows, company):
    needle = company.lower()
    hits = [r for r in rows if needle in r.get("Company", "").lower()]
    hits.sort(key=lambda r: r.get("Connected On", ""), reverse=True)
    if not hits:
        print(f"No 1st-degree connections matched company '{company}'.")
        return
    print(f"{len(hits)} connection(s) matching '{company}':\n")
    for r in hits:
        print(f"- {fullname(r)} - {r.get('Position','?')} @ {r.get('Company','?')}")
        url = r.get("URL", "")
        if url:
            print(f"    {url}")
        if r.get("Connected On"):
            print(f"    connected: {r['Connected On']}")


def top_companies(rows, n):
    counts = Counter(r.get("Company", "") for r in rows if r.get("Company"))
    print(f"Total connections: {len(rows)}")
    print(f"Distinct companies: {len(counts)}\n")
    print(f"Top {n} companies by connection count:")
    for company, c in counts.most_common(n):
        print(f"  {c:>4}  {company}")


def main():
    ap = argparse.ArgumentParser(description="Query a LinkedIn Connections.csv export.")
    ap.add_argument("--csv", required=True, help="path to Connections.csv")
    ap.add_argument("--company", help="filter connections by company (substring)")
    ap.add_argument(
        "--top-companies",
        nargs="?",
        const=20,
        type=int,
        help="list the top N companies by connection count (default 20)",
    )
    args = ap.parse_args()

    if not Path(args.csv).exists():
        print(f"[ERROR] Not found: {args.csv}")
        sys.exit(1)

    rows = load_rows(args.csv)

    if args.company:
        query_company(rows, args.company)
    elif args.top_companies is not None:
        top_companies(rows, args.top_companies)
    else:
        # default: overview
        top_companies(rows, 20)


if __name__ == "__main__":
    main()
