"""
ga4_ecommerce_validate.py — Validate a captured dataLayer against the GA4
standard ecommerce event spec.

Checks each event for: a known ecommerce event name, required top-level
parameters (currency/value/transaction_id where applicable), a non-empty
items[] array, and required per-item fields. No external dependencies.

Usage:
    python ga4_ecommerce_validate.py                 # built-in demo events
    python ga4_ecommerce_validate.py events.json     # your captured dataLayer

Input JSON: either a single event object or an array of event objects, each:
    {"event": "purchase", "ecommerce": {"currency": "USD", "value": 42.0,
        "transaction_id": "T123", "items": [{"item_id": "SKU1",
        "item_name": "Tee", "price": 21.0, "quantity": 2}, ...]}}

Some setups put params at the top level instead of under "ecommerce"; both
shapes are accepted.
"""

import json
import sys


# event name -> required top-level (ecommerce) params beyond items[]
EVENT_REQS = {
    "view_item_list": [],
    "view_item": ["currency"],
    "select_item": [],
    "add_to_cart": ["currency"],
    "remove_from_cart": ["currency"],
    "view_cart": ["currency"],
    "begin_checkout": ["currency"],
    "add_shipping_info": ["currency"],
    "add_payment_info": ["currency"],
    "purchase": ["currency", "value", "transaction_id"],
    "refund": ["currency", "transaction_id"],
}
EVENTS_REQUIRING_ITEMS = set(EVENT_REQS) - {"refund"}
ITEM_REQUIRED = ["item_id", "item_name"]  # GA4 needs id or name; we require both for quality
ITEM_RECOMMENDED = ["price", "quantity"]


DEMO_EVENTS = [
    {"event": "view_item", "ecommerce": {"currency": "USD",
        "items": [{"item_id": "ACME-TEE", "item_name": "Acme Tee", "price": 21.0}]}},
    {"event": "add_to_cart", "ecommerce": {"currency": "USD",
        "items": [{"item_id": "ACME-TEE", "item_name": "Acme Tee", "price": 21.0, "quantity": 2}]}},
    {"event": "purchase", "ecommerce": {"currency": "USD", "value": 42.0, "transaction_id": "T-1001",
        "items": [{"item_id": "ACME-TEE", "item_name": "Acme Tee", "price": 21.0, "quantity": 2}]}},
    # intentionally broken: missing transaction_id + value, item missing name
    {"event": "purchase", "ecommerce": {"currency": "USD",
        "items": [{"item_id": "ACME-MUG", "price": 9.0}]}},
    {"event": "add_to_cart", "ecommerce": {  # missing currency + empty items
        "items": []}},
]


def get_ecom(event):
    """Return the param dict — under 'ecommerce' or at the top level."""
    if isinstance(event.get("ecommerce"), dict):
        return event["ecommerce"]
    return {k: v for k, v in event.items() if k != "event"}


def validate_event(event, idx):
    errors = []
    name = event.get("event")
    if not name:
        return [f"event[{idx}]: missing 'event' name"], None
    if name not in EVENT_REQS:
        return [f"event[{idx}] '{name}': not a recognized GA4 ecommerce event"], name

    ecom = get_ecom(event)

    for param in EVENT_REQS[name]:
        if param not in ecom or ecom[param] in (None, ""):
            errors.append(f"missing required param '{param}'")

    if name in EVENTS_REQUIRING_ITEMS:
        items = ecom.get("items")
        if not isinstance(items, list) or not items:
            errors.append("missing or empty 'items[]'")
        else:
            for i, it in enumerate(items):
                missing = [f for f in ITEM_REQUIRED if not it.get(f)]
                if missing:
                    errors.append(f"items[{i}]: missing {', '.join(missing)}")
                rec_missing = [f for f in ITEM_RECOMMENDED if it.get(f) in (None, "")]
                if rec_missing:
                    errors.append(f"items[{i}]: (recommended) missing {', '.join(rec_missing)}")
    return errors, name


def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            print(f"[ERROR] cannot read {path}: {e}")
            sys.exit(1)
    else:
        print("[INFO] No JSON given - using built-in demo events.\n")
        data = DEMO_EVENTS

    events = data if isinstance(data, list) else [data]

    total_fail = 0
    for idx, event in enumerate(events):
        errors, name = validate_event(event, idx)
        hard = [e for e in errors if "(recommended)" not in e]
        if hard:
            total_fail += 1
            print(f"FAIL  [{idx}] {name or '?'}")
            for e in errors:
                print(f"        - {e}")
        else:
            warn = [e for e in errors if "(recommended)" in e]
            print(f"PASS  [{idx}] {name}")
            for w in warn:
                print(f"        ~ {w}")

    print()
    passed = len(events) - total_fail
    verdict = "COMPLIANT" if total_fail == 0 else "NON-COMPLIANT"
    print(f"{verdict}: {passed}/{len(events)} events passed.")
    sys.exit(0 if total_fail == 0 else 1)


if __name__ == "__main__":
    main()
