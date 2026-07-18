# Safety Essentials Catalog Candidate Template

> Document status: **reference evidence template**. Candidate values require fresh source checks and human approval before any write. Current safety and database rules are in [`project-rules.md`](project-rules.md) and [`codex-task-contract.md`](codex-task-contract.md).

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
| ホイッスル | mont-bell | アルミホイッスル S | アルミホイッスル S | first_aid | whistle | 11 | 880 | https://webshop.montbell.jp/goods/disp.php?product_id=1124946 | https://webshop.montbell.jp/goods/disp.php?product_id=1124946 | TODO_CONFIRM_OFFICIAL_IMAGE_URL | ホイッスル, 笛, whistle, aluminum whistle | needs_review | mont-bell official product page confirms price ¥880, product #1124946, brand モンベル, weight 11g. |
| エマージェンシーシート | mont-bell | エマージェンシーシート | エマージェンシーシート | first_aid | emergency_sheet | 50 | 594 | https://webshop.montbell.jp/goods/disp.php?product_id=1124306 | https://webshop.montbell.jp/goods/disp.php?product_id=1124306 | TODO_CONFIRM_OFFICIAL_IMAGE_URL | エマージェンシーシート, サバイバルシート, emergency sheet, emergency blanket, survival sheet | needs_review | mont-bell official product page confirms price ¥594, product #1124306, brand モンベル, weight 50g. |
| 熊鈴 | mont-bell | トレッキングベル サイレント | トレッキングベル サイレント | bear_safety | bear_bell | 43 | 2200 | https://webshop.montbell.jp/goods/disp.php?product_id=1124928 | https://webshop.montbell.jp/goods/disp.php?product_id=1124928 | TODO_CONFIRM_OFFICIAL_IMAGE_URL | 熊鈴, クマ鈴, トレッキングベル, bear bell, trekking bell | needs_review | mont-bell official product page confirms weight 43g and list page confirms price ¥2,200, product #1124928, brand モンベル. |
| 熊スプレー | SABRE | フロンティアーズマン マックス ベアスプレー234mL | フロンティアーズマン マックス ベアスプレー234mL | bear_safety | bear_spray | 304 | 12100 | https://webshop.montbell.jp/goods/disp.php?product_id=1899175 | https://webshop.montbell.jp/goods/disp.php?product_id=1899175 | TODO_CONFIRM_OFFICIAL_IMAGE_URL | 熊スプレー, クマよけスプレー, 熊よけスプレー, bear spray, Frontiersman Max Bear Spray | needs_review | mont-bell product page confirms price ¥12,100, product #1899175, brand SABRE(セイバー), weight about 304g, content 234mL. |
| 携帯トイレ | mont-bell | O.D.トイレキット | O.D.トイレキット | first_aid | portable_toilet | 43 | 330 | https://webshop.montbell.jp/goods/disp.php?product_id=1150111 | https://webshop.montbell.jp/goods/disp.php?product_id=1150111 | TODO_CONFIRM_OFFICIAL_IMAGE_URL | 携帯トイレ, O.D.トイレキット, portable toilet, toilet kit | needs_review | mont-bell official product page confirms price ¥330, product #1150111, brand モンベル, weight 43g. |

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
