-- Splitly group creation and member-management RLS.
--
-- This migration keeps RLS enabled. It permits:
-- - users to create profiles for themselves
-- - users to create groups where created_by = auth.uid()
-- - group creators to insert themselves as the initial admin member
-- - existing group admins to add existing Splitly users by exact email through RPC

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create unique index if not exists group_members_group_id_user_id_key
on public.group_members (group_id, user_id);

create or replace function public.is_group_member(
  target_group_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = target_user_id
  );
$$;

create or replace function public.is_group_admin(
  target_group_id uuid,
  target_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = target_user_id
      and role = 'admin'
  );
$$;

revoke execute on function public.is_group_member(uuid, uuid) from public;
revoke execute on function public.is_group_admin(uuid, uuid) from public;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.is_group_admin(uuid, uuid) to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_self_or_shared_group" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_self_or_shared_group"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.group_members target_member
    where target_member.user_id = profiles.id
      and public.is_group_member(target_member.group_id, auth.uid())
  )
);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "groups_select_member_or_creator" on public.groups;
drop policy if exists "groups_insert_own" on public.groups;

create policy "groups_select_member_or_creator"
on public.groups
for select
to authenticated
using (
  created_by = auth.uid()
  or public.is_group_member(id, auth.uid())
);

create policy "groups_insert_own"
on public.groups
for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "group_members_select_group_members" on public.group_members;
drop policy if exists "group_members_insert_initial_creator_admin" on public.group_members;
drop policy if exists "group_members_insert_admin" on public.group_members;

create policy "group_members_select_group_members"
on public.group_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_group_member(group_id, auth.uid())
);

create policy "group_members_insert_initial_creator_admin"
on public.group_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'admin'
  and exists (
    select 1
    from public.groups
    where id = group_id
      and created_by = auth.uid()
  )
);

create or replace function public.find_addable_group_member_by_email(
  target_group_id uuid,
  target_email text
)
returns table (
  status text,
  user_id uuid,
  full_name text,
  email text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  normalized_email text := lower(trim(target_email));
  found_profile public.profiles%rowtype;
begin
  if auth.uid() is null or not public.is_group_admin(target_group_id, auth.uid()) then
    return query select 'permission_denied'::text, null::uuid, null::text, null::text;
    return;
  end if;

  select *
  into found_profile
  from public.profiles
  where lower(profiles.email) = normalized_email
  limit 1;

  if found_profile.id is null then
    return query select 'not_found'::text, null::uuid, null::text, null::text;
    return;
  end if;

  if found_profile.id = auth.uid() then
    return query select 'self'::text, found_profile.id, found_profile.full_name::text, found_profile.email::text;
    return;
  end if;

  if public.is_group_member(target_group_id, found_profile.id) then
    return query select 'already_member'::text, found_profile.id, found_profile.full_name::text, found_profile.email::text;
    return;
  end if;

  return query select 'found'::text, found_profile.id, found_profile.full_name::text, found_profile.email::text;
end;
$$;

create or replace function public.add_group_member_by_email(
  target_group_id uuid,
  target_email text
)
returns table (
  status text,
  user_id uuid,
  full_name text,
  email text
)
language plpgsql
security definer
set search_path = public
volatile
as $$
declare
  normalized_email text := lower(trim(target_email));
  found_profile public.profiles%rowtype;
begin
  if auth.uid() is null or not public.is_group_admin(target_group_id, auth.uid()) then
    return query select 'permission_denied'::text, null::uuid, null::text, null::text;
    return;
  end if;

  select *
  into found_profile
  from public.profiles
  where lower(profiles.email) = normalized_email
  limit 1;

  if found_profile.id is null then
    return query select 'not_found'::text, null::uuid, null::text, null::text;
    return;
  end if;

  if found_profile.id = auth.uid() then
    return query select 'self'::text, found_profile.id, found_profile.full_name::text, found_profile.email::text;
    return;
  end if;

  if public.is_group_member(target_group_id, found_profile.id) then
    return query select 'already_member'::text, found_profile.id, found_profile.full_name::text, found_profile.email::text;
    return;
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (target_group_id, found_profile.id, 'member');

  return query select 'added'::text, found_profile.id, found_profile.full_name::text, found_profile.email::text;
end;
$$;

revoke execute on function public.find_addable_group_member_by_email(uuid, text) from public;
revoke execute on function public.add_group_member_by_email(uuid, text) from public;
grant execute on function public.find_addable_group_member_by_email(uuid, text) to authenticated;
grant execute on function public.add_group_member_by_email(uuid, text) to authenticated;
