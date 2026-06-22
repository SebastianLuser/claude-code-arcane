# Commerce Data Model — Field-Level Spec & Worked Example

A language- and database-agnostic reference for the core catalog entities. Use it as the template for a model spec.

## Entities & Fields

### Product (marketing/SEO unit)
| Field | Type | Notes |
|-------|------|-------|
| id | id | Internal key |
| title | text | Display name |
| slug | text | Stable URL segment, unique |
| description | rich text | Long copy |
| brand | text | Brand/manufacturer |
| status | enum | draft / active / archived |
| options | Option[] | Axes of variation (0..n) |
| variants | Variant[] | ≥1 always |
| collections | Collection[] | Many-to-many |
| primary_category | Category | One navigational path |
| attributes | Attribute[] | Typed key-values |

### Variant (buyable unit)
| Field | Type | Notes |
|-------|------|-------|
| id | id | |
| sku | text | Stock-keeping code, unique |
| option_values | map | e.g. {Color: Red, Size: M} |
| price | integer (minor units) | Never a float |
| compare_at_price | integer | For showing discounts |
| barcode | text | GTIN/UPC/EAN |
| weight / dimensions | number + unit | For shipping/carrier rates |
| requires_shipping | bool | False for digital |

### Option / Option Value
`Option { name, position }` → `OptionValue { option_id, value, position }`. Example: Option "Size" → values S, M, L.

### Collection (merchandising)
`Collection { title, slug, type: manual|automatic, rules? }`. Automatic collections select by attribute rules (e.g. `tag = summer`).

### Attribute (faceting)
`Attribute { key, type: text|enum|number|boolean|measurement, value, unit? }`. Enum attributes reference a controlled value list.

## Identifiers
- **SKU** — your internal stock identifier (required, unique).
- **GTIN** (UPC/EAN/ISBN) — global trade identifier; required for marketplaces/feeds where one exists.
- **MPN** — manufacturer part number; fallback when no GTIN.

## Bundles / Kits
Model as a Product whose variant references component variants with quantities. Decide inventory rule: track by components (decrement each) vs by kit (own stock).

## Worked Example — "Acme Tee"

```yaml
product:
  title: "Acme Cotton Tee"
  slug: "acme-cotton-tee"
  brand: "Acme"
  status: active
  options:
    - { name: Color, values: [Red, Blue] }
    - { name: Size,  values: [S, M, L] }
  attributes:
    - { key: material, type: enum, value: cotton }
    - { key: sleeve,   type: enum, value: short }
  variants:
    - sku: ACME-TEE-RED-M
      option_values: { Color: Red, Size: M }
      price: 2100            # 21.00 in minor units
      barcode: "0123456789012"
      weight: { value: 180, unit: g }
```

## Checklist (verdict: COMPLIANT when all true)
- [ ] Price + inventory + barcode live on the variant, not the product
- [ ] Every product has ≥1 variant (even with no options)
- [ ] Attributes are typed and enums reference a vocabulary
- [ ] Primary category is single; collections are many-to-many
- [ ] Money stored as integer minor units
- [ ] Slugs/URLs stable and unique
