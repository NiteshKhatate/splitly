-- Secure email invitations for Splitly groups.
--
-- Group admins can create an invitation for an email address. The invited user
-- becomes a member only after authenticating with that same email address.

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  email text not null,
  invited_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  constraint group_invitations_email_normalized
    check (email = lower(trim(email)))
);

create unique index if not exists group_invitations_group_id_email_key
on public.group_invitations (group_id, email);

alter table public.group_invitations enable row level security;

-- Invitations are intentionally not exposed through direct table policies.
-- These functions are the only application-facing write/read boundary.

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

create or replace function public.accept_group_invitation(
  target_group_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
volatile
as $$
declare
  authenticated_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  pending_invitation public.group_invitations%rowtype;
begin
  if auth.uid() is null or authenticated_email = '' then
    return 'permission_denied';
  end if;

  select *
  into pending_invitation
  from public.group_invitations
  where group_id = target_group_id
    and email = authenticated_email
    and accepted_at is null
  limit 1;

  if pending_invitation.id is null then
    if public.is_group_member(target_group_id, auth.uid()) then
      return 'already_member';
    end if;

    return 'not_found';
  end if;

  if pending_invitation.expires_at <= now() then
    return 'expired';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, auth.uid(), 'member')
  on conflict (group_id, user_id) do nothing;

  update public.group_invitations
  set accepted_at = now()
  where id = pending_invitation.id;

  return 'accepted';
end;
$$;

revoke all on table public.group_invitations from anon, authenticated;
revoke execute on function public.create_group_invitation(uuid, text) from public;
revoke execute on function public.accept_group_invitation(uuid) from public;
grant execute on function public.create_group_invitation(uuid, text) to authenticated;
grant execute on function public.accept_group_invitation(uuid) to authenticated;

notify pgrst, 'reload schema';
