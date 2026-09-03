-- Fix PL/pgSQL ambiguity in the group invitation creation RPC.
--
-- The returned table has an output column named email. Inside PL/pgSQL that is
-- also a variable, so `on conflict (group_id, email)` can be ambiguous.

create or replace function public.create_group_invitation(
  target_group_id uuid,
  target_email text
)
returns table (
  status text,
  email text
)
language plpgsql
security definer
set search_path = public
volatile
as $$
#variable_conflict use_column
declare
  normalized_email text := lower(trim(target_email));
begin
  if auth.uid() is null or not public.is_group_admin(target_group_id, auth.uid()) then
    return query select 'permission_denied'::text, null::text;
    return;
  end if;

  if normalized_email = '' then
    return query select 'invalid_email'::text, null::text;
    return;
  end if;

  if normalized_email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    return query select 'self'::text, normalized_email;
    return;
  end if;

  if exists (
    select 1
    from public.profiles
    where lower(profiles.email) = normalized_email
  ) then
    return query select 'existing_user'::text, normalized_email;
    return;
  end if;

  insert into public.group_invitations (
    group_id,
    email,
    invited_by,
    created_at,
    expires_at,
    accepted_at
  )
  values (
    target_group_id,
    normalized_email,
    auth.uid(),
    now(),
    now() + interval '7 days',
    null
  )
  on conflict (group_id, email)
  do update set
    invited_by = excluded.invited_by,
    created_at = excluded.created_at,
    expires_at = excluded.expires_at,
    accepted_at = null;

  return query select 'created'::text, normalized_email;
end;
$$;

notify pgrst, 'reload schema';
