# Safety Essentials Catalog Candidate Template

This document is a review template for the first safety essentials catalog seed.
Do not use it as a migration source until every required evidence field has been
confirmed by a human reviewer.

## Scope

First batch target entries:

- ホイッスル
- エマージェンシーシート
- 熊鈴
- 熊スプレー
- 携帯トイレ

Target category mapping:

| Item | category_en | subcategory_en |
| --- | --- | --- |
| ホイッスル | first_aid | whistle |
| エマージェンシーシート | first_aid | emergency_sheet |
| 熊鈴 | bear_safety | bear_bell |
| 熊スプレー | bear_safety | bear_spray |
| 携帯トイレ | first_aid | portable_toilet |

## Required Fields

Each catalog candidate should be reviewed with these fields:

| Field | Required for verified seed | Notes |
| --- | --- | --- |
| brand | Yes | Real manufacturer or brand name only. |
| model | Yes | Exact product model. Must not be generic unless explicitly approved. |
| name_ja | Yes | Japanese display name from official or reliable source. |
| category_en | Yes | Must match an existing `gear_categories.name_en`. |
| subcategory_en | Yes | Must match an existing `gear_subcategories.name_en`. |
| official_weight_grams | Yes | Use official listed weight when available. Do not estimate. |
| msrp_jpy | Yes | Use official Japanese MSRP or clearly documented list price. |
| official_url | Yes | Product-level official or reliable source URL. |
| msrp_source_url | Yes | URL that supports the price. Can match `official_url` if the page lists price. |
| image_url | Yes | Product image URL from official or approved source. |
| aliases | Optional | Search aliases, separated by `;`. |
| verification_status | Yes | Use `verified` only after all required evidence is confirmed. |
| evidence_note | Yes | Human-readable note describing source and any caveats. |

## Candidate Table

Leave unknown fields blank. Do not invent missing data.

| target_item | brand | model | name_ja | category_en | subcategory_en | official_weight_grams | msrp_jpy | official_url | msrp_source_url | image_url | aliases | verification_status | evidence_note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ホイッスル |  |  |  | first_aid | whistle |  |  |  |  |  |  |  |  |
| エマージェンシーシート |  |  |  | first_aid | emergency_sheet |  |  |  |  |  |  |  |  |
| 熊鈴 |  |  |  | bear_safety | bear_bell |  |  |  |  |  |  |  |  |
| 熊スプレー |  |  |  | bear_safety | bear_spray |  |  |  |  |  |  |  |  |
| 携帯トイレ |  |  |  | first_aid | portable_toilet |  |  |  |  |  |  |  |  |

## Evidence Rules

Fields that must have real source evidence:

- `brand`
- `model`
- `name_ja`
- `official_weight_grams`
- `msrp_jpy`
- `official_url`
- `msrp_source_url`
- `image_url`

Fields that must not be invented by AI:

- Product brand or model
- Weight
- Price
- Product URL
- Image URL
- Verification status
- Evidence notes claiming a source was checked

If a value is unavailable, leave it blank and keep `verification_status` blank or
`needs_review`. Do not mark a row as `verified` unless the product, weight,
price, official URL, and image URL are all confirmed.

## Migration Readiness Checklist

Before writing a catalog seed migration:

- [ ] Every row is a real product, not a generic placeholder.
- [ ] `brand` + `model` is exact and suitable for the catalog unique key.
- [ ] `category_en` and `subcategory_en` already exist.
- [ ] `official_weight_grams` is confirmed from source.
- [ ] `msrp_jpy` is confirmed from source.
- [ ] `official_url` is product-level or an approved reliable page.
- [ ] `msrp_source_url` supports the price.
- [ ] `image_url` is product-specific and stable enough for catalog use.
- [ ] `verification_status` is `verified` only for fully confirmed rows.
- [ ] `aliases` do not duplicate brand/model/name exactly unless useful for search.
- [ ] No app code, GearForm code, actions/data code, matcher code, or RLS policy needs to change.
- [ ] Migration uses `on conflict (brand, model) do update`.
- [ ] Migration does not delete existing products.
- [ ] Any incomplete or uncertain row is excluded from the write path.
