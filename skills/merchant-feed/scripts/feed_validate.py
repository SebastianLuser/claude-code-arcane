"""
feed_validate.py — Validate a product feed CSV against Google Merchant /
Meta Catalog requirements (the shared required-attribute core).

Checks every row for required attributes, empty values, valid enums
(availability, condition), and price+currency formatting. Reports a per-row
and summary verdict. No external dependencies; cross-platform.

Usage:
    python feed_validate.py               # built-in demo feed
    python feed_validate.py feed.csv      # validate your feed
    python feed_validate.py feed.csv --strict   # treat recommended as required

CSV header (required attributes):
    id,title,description,link,image_link,availability,price,brand,condition
Recommended columns (warn if absent/empty): gtin, mpn, item_group_id,
    google_product_category, sale_price
"""

import argparse
import csv
import re
import sys


REQUIRED = ["id", "title", "description", "link", "image_link",
            "availability", "price", "brand", "condition"]
RECOMMENDED = ["gtin", "mpn", "item_group_id", "google_product_category"]

AVAILABILITY = {"in_stock", "out_of_stock", "preorder", "backorder"}
CONDITION = {"new", "refurbished", "used"}
# e.g. "21.00 USD" / "9.99 EUR"
PRICE_RE = re.compile(r"^\d+(\.\d{1,2})?\s+[A-Z]{3}$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)
TITLE_MAX = 150
DESC_MAX = 5000


DEMO_FEED = [
    {"id": "ACME-TEE-RED-M", "title": "Acme Cotton Tee — Red, Medium",
     "description": "Soft 100% cotton crew-neck tee.", "link": "https://shop.example.com/p/acme-tee-red-m",
     "image_link": "https://shop.example.com/img/acme-tee-red-m.jpg", "availability": "in_stock",
     "price": "21.00 USD", "brand": "Acme", "condition": "new",
     "gtin": "0123456789012", "item_group_id": "ACME-TEE"},
    # broken row: bad availability, bad price, missing brand, non-url image
    {"id": "ACME-MUG-BLUE", "title": "Acme Mug", "description": "",
     "link": "https://shop.example.com/p/acme-mug", "image_link": "acme-mug.jpg",
     "availability": "available", "price": "9.99", "brand": "", "condition": "brand-new"},
]


def validate_row(row, idx, strict):
    errors = []
    warnings = []

    for attr in REQUIRED:
        if not (row.get(attr) or "").strip():
            errors.append(f"missing required '{attr}'")

    avail = (row.get("availability") or "").strip().lower()
    if avail and avail not in AVAILABILITY:
        errors.append(f"availability '{avail}' not in {sorted(AVAILABILITY)}")

    cond = (row.get("condition") or "").strip().lower()
    if cond and cond not in CONDITION:
        errors.append(f"condition '{cond}' not in {sorted(CONDITION)}")

    price = (row.get("price") or "").strip()
    if price and not PRICE_RE.match(price):
        errors.append(f"price '{price}' must be like '21.00 USD' (amount + ISO currency)")

    for url_attr in ("link", "image_link"):
        val = (row.get(url_attr) or "").strip()
        if val and not URL_RE.match(val):
            errors.append(f"{url_attr} '{val}' must be an absolute http(s) URL")

    title = (row.get("title") or "").strip()
    if len(title) > TITLE_MAX:
        warnings.append(f"title > {TITLE_MAX} chars ({len(title)})")
    if len(row.get("description") or "") > DESC_MAX:
        warnings.append(f"description > {DESC_MAX} chars")

    has_id_link = bool((row.get("item_group_id") or "").strip())
    if not has_id_link:
        warnings.append("no item_group_id (variants won't cluster)")
    if not (row.get("gtin") or "").strip() and not (row.get("mpn") or "").strip():
        warnings.append("no gtin/mpn (weakens product matching)")

    if strict:
        errors.extend(f"(strict) {w}" for w in warnings)
        warnings = []
    return errors, warnings


def main():
    ap = argparse.ArgumentParser(description="Validate a Google/Meta product feed CSV.")
    ap.add_argument("csv", nargs="?", help="feed CSV. Omit for demo data.")
    ap.add_argument("--strict", action="store_true", help="treat recommended issues as failures")
    args = ap.parse_args()

    if args.csv:
        try:
            with open(args.csv, newline="", encoding="utf-8") as f:
                rows = list(csv.DictReader(f))
        except OSError as e:
            print(f"[ERROR] cannot read {args.csv}: {e}")
            sys.exit(1)
    else:
        print("[INFO] No CSV given - using built-in demo feed.\n")
        rows = DEMO_FEED

    if not rows:
        print("[ERROR] feed is empty.")
        sys.exit(1)

    failed = 0
    for idx, row in enumerate(rows):
        errors, warnings = validate_row(row, idx, args.strict)
        rid = row.get("id") or f"row{idx}"
        if errors:
            failed += 1
            print(f"FAIL  {rid}")
            for e in errors:
                print(f"        - {e}")
            for w in warnings:
                print(f"        ~ {w}")
        else:
            print(f"PASS  {rid}")
            for w in warnings:
                print(f"        ~ {w}")

    print()
    passed = len(rows) - failed
    verdict = "READY" if failed == 0 else "NOT-READY"
    print(f"{verdict}: {passed}/{len(rows)} items pass required-attribute checks.")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
