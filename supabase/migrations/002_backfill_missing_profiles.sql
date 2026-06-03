insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(
    users.raw_user_meta_data ->> 'display_name',
    split_part(users.email, '@', 1)
  )
from auth.users
left join public.profiles on profiles.id = users.id
where profiles.id is null;

