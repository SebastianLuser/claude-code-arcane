"""
restock_forecast.py — Safety stock & reorder points from a sales history CSV.

Turns daily sales into per-SKU reorder signals using the classic
reorder-point model. No external dependencies (stdlib only), cross-platform.

Usage:
    python restock_forecast.py                                  # built-in demo data
    python restock_forecast.py sales.csv                        # your data, defaults
    python restock_forecast.py sales.csv --lead-time 14 --service-level 0.95
    python restock_forecast.py sales.csv --on-hand on_hand.csv  # flag what to reorder

CSV format (header required):
    sku,date,units_sold
    ACME-TEE-RED-M,2026-05-01,4
    ACME-TEE-RED-M,2026-05-02,2
    ...

Optional on-hand CSV (header required):  sku,on_hand

Model:
    avg_daily_demand   = mean(units_sold per day)
    sigma_demand       = stdev(units_sold per day)
    safety_stock       = z(service_level) * sigma_demand * sqrt(lead_time)
    reorder_point      = avg_daily_demand * lead_time + safety_stock

When on-hand is provided, a SKU is flagged REORDER when on_hand <= reorder_point.
"""

import argparse
import csv
import math
import sys
from collections import defaultdict


# Embedded demo data: two SKUs, ~3 weeks of daily sales.
DEMO_ROWS = [
    ("ACME-TEE-RED-M", d, u)
    for d, u in zip(
        [f"2026-05-{n:02d}" for n in range(1, 22)],
        [4, 2, 5, 3, 6, 8, 7, 3, 4, 5, 2, 6, 9, 7, 4, 3, 5, 6, 8, 4, 5],
    )
] + [
    ("ACME-MUG-BLUE", d, u)
    for d, u in zip(
        [f"2026-05-{n:02d}" for n in range(1, 22)],
        [1, 0, 2, 1, 1, 3, 2, 0, 1, 1, 0, 2, 1, 2, 1, 0, 1, 2, 3, 1, 1],
    )
]
DEMO_ON_HAND = {"ACME-TEE-RED-M": 40, "ACME-MUG-BLUE": 60}


def z_for_service_level(p):
    """Inverse standard-normal CDF (Acklam's rational approximation)."""
    if not 0.0 < p < 1.0:
        raise ValueError("service-level must be between 0 and 1 (exclusive)")
    a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
         1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
    b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
         6.680131188771972e+01, -1.328068155288572e+01]
    c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
         -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
    d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
         3.754408661907416e+00]
    plow, phigh = 0.02425, 1 - 0.02425
    if p < plow:
        q = math.sqrt(-2 * math.log(p))
        return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
               ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    if p > phigh:
        q = math.sqrt(-2 * math.log(1 - p))
        return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / \
                ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)
    q = p - 0.5
    r = q * q
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / \
           (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)


def load_sales(path):
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        required = {"sku", "date", "units_sold"}
        if not required.issubset({c.strip() for c in (reader.fieldnames or [])}):
            print(f"[ERROR] {path}: header must include sku,date,units_sold")
            sys.exit(1)
        for r in reader:
            try:
                rows.append((r["sku"].strip(), r["date"].strip(), float(r["units_sold"])))
            except (KeyError, ValueError):
                print(f"[WARN] skipping malformed row: {r}")
    return rows


def load_on_hand(path):
    out = {}
    with open(path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                out[r["sku"].strip()] = float(r["on_hand"])
            except (KeyError, ValueError):
                pass
    return out


def stdev(xs):
    if len(xs) < 2:
        return 0.0
    mean = sum(xs) / len(xs)
    return math.sqrt(sum((x - mean) ** 2 for x in xs) / (len(xs) - 1))


def forecast(rows, lead_time, service_level, on_hand):
    z = z_for_service_level(service_level)
    by_sku = defaultdict(list)
    for sku, _date, units in rows:
        by_sku[sku].append(units)

    results = []
    for sku in sorted(by_sku):
        daily = by_sku[sku]
        avg = sum(daily) / len(daily)
        sigma = stdev(daily)
        safety = z * sigma * math.sqrt(lead_time)
        rop = avg * lead_time + safety
        oh = on_hand.get(sku)
        flag = ""
        if oh is not None:
            flag = "REORDER" if oh <= rop else "OK"
        results.append((sku, avg, sigma, safety, rop, oh, flag))
    return results


def main():
    ap = argparse.ArgumentParser(description="Safety stock & reorder points from sales CSV.")
    ap.add_argument("csv", nargs="?", help="sales CSV (sku,date,units_sold). Omit for demo.")
    ap.add_argument("--lead-time", type=float, default=14, help="supplier lead time in days (default 14)")
    ap.add_argument("--service-level", type=float, default=0.95, help="0-1 target fill rate (default 0.95)")
    ap.add_argument("--on-hand", help="optional CSV (sku,on_hand) to flag what to reorder")
    args = ap.parse_args()

    if args.csv:
        rows = load_sales(args.csv)
        on_hand = load_on_hand(args.on_hand) if args.on_hand else {}
    else:
        print("[INFO] No CSV given - using built-in demo data.\n")
        rows = DEMO_ROWS
        on_hand = DEMO_ON_HAND

    if not rows:
        print("[ERROR] No sales rows to analyze.")
        sys.exit(1)

    results = forecast(rows, args.lead_time, args.service_level, on_hand)

    z = z_for_service_level(args.service_level)
    print(f"Lead time: {args.lead_time:g}d | Service level: {args.service_level:g} (z={z:.2f})\n")
    header = f"{'SKU':<20} {'avg/day':>8} {'sigma':>7} {'safety':>8} {'reorder_pt':>11} {'on_hand':>8} {'flag':>8}"
    print(header)
    print("-" * len(header))
    for sku, avg, sigma, safety, rop, oh, flag in results:
        oh_s = f"{oh:g}" if oh is not None else "-"
        print(f"{sku:<20} {avg:>8.2f} {sigma:>7.2f} {safety:>8.1f} {rop:>11.1f} {oh_s:>8} {flag:>8}")

    reorder = [r for r in results if r[6] == "REORDER"]
    if on_hand:
        print(f"\n{'PASS' if not reorder else 'ACTION'}: {len(reorder)} SKU(s) at/below reorder point.")


if __name__ == "__main__":
    main()
