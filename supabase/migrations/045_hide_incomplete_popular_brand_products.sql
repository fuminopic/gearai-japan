update public.gear_products
set discontinued = true,
    verification_status = 'needs_review',
    last_verified_at = date '2026-06-21'
where brand in ('Columbia', 'MILLET', 'Arc''teryx', 'patagonia', 'GREGORY', 'LA SPORTIVA', 'Mammut')
  and discontinued = false
  and (
    verification_status <> 'verified'
    or official_weight_grams is null
    or msrp_jpy is null
    or image_url is null
    or official_url is null
  );
