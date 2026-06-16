update public.gear_products
set discontinued = false,
    last_verified_at = date '2026-06-16',
    verification_status = 'needs_review'
where brand = 'THE NORTH FACE'
  and model in (
    'フットプリント/マウンテンショット1',
    'フットプリント/マウンテンショット2'
  )
  and image_url is not null
  and official_url is not null;
