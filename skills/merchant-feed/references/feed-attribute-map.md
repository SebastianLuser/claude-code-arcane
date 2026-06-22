# Product Feed — Attribute Reference & Catalog Mapping

Maps the commerce data model to Google Merchant / Meta Catalog feed attributes. The `feed_validate.py` script enforces the required core.

## Required attributes (every item)
| Feed attribute | Source (data model) | Rule |
|----------------|---------------------|------|
| id | variant.sku | Stable, unique per variant |
| title | product.title (+ variant) | Front-load product; ≤150 chars; match PDP |
| description | product.description | Plain, accurate; no promo/ALL CAPS |
| link | product URL | Canonical, absolute https |
| image_link | main image | Absolute https; meets resolution min |
| availability | variant stock | in_stock / out_of_stock / preorder / backorder |
| price | variant.price | `"21.00 USD"` — matches PDP exactly |
| brand | product.brand | Required unless exempt category |
| condition | — | new / refurbished / used |

## Strongly recommended
| Feed attribute | Source | Why |
|----------------|--------|-----|
| gtin | variant.barcode | Improves matching / eligibility |
| mpn | variant.mpn | Fallback when no GTIN |
| item_group_id | product.id | Clusters variants (else they compete) |
| google_product_category | category map | Taxonomy alignment |
| product_type | primary_category | Your own taxonomy |
| color / size / gender / age_group | attributes | Apparel facets |
| sale_price | compare_at logic | Promo pricing |
| shipping | shipping-tax rules | Overrides account settings |

## Hard rules (disapproval triggers)
- Feed **price + availability must match the live PDP** exactly.
- No promotional text in `title`/`description` (no "Free shipping!", no emojis/caps).
- `image_link` must resolve and meet the channel's minimum resolution.
- Variants without a shared `item_group_id` are treated as separate products.

## Worked example (CSV row)
```csv
id,title,description,link,image_link,availability,price,brand,condition,gtin,item_group_id
ACME-TEE-RED-M,"Acme Cotton Tee — Red, Medium","Soft 100% cotton crew-neck tee.",https://shop.example.com/p/acme-tee-red-m,https://shop.example.com/img/acme-tee-red-m.jpg,in_stock,21.00 USD,Acme,new,0123456789012,ACME-TEE
```

## Verdict: READY when
- [ ] All required attributes present and non-empty
- [ ] price/availability match PDP
- [ ] valid availability + condition enums
- [ ] price formatted `amount ISO-currency`
- [ ] variants share item_group_id; GTIN present where it exists
