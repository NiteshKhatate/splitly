-- Baseline of the public Splitly schema that predates Prisma migration history.
-- This migration is marked as applied on the existing development database.

CREATE TYPE public.group_member_role AS ENUM ('admin', 'member');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  currency text NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.group_member_role NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL CONSTRAINT expense_amount_positive CHECK (amount > 0),
  paid_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  expense_date date NOT NULL DEFAULT current_date,
  notes text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CONSTRAINT split_amount_positive CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_expense_user UNIQUE (expense_id, user_id)
);

CREATE TABLE public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  paid_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  paid_to uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CONSTRAINT settlement_amount_positive CHECK (amount > 0),
  settlement_date date NOT NULL DEFAULT current_date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settlement_different_users CHECK (paid_by <> paid_to)
);

CREATE TABLE public.group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  CONSTRAINT group_invitations_email_normalized CHECK (email = lower(trim(email)))
);

CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX idx_expense_splits_user_id ON public.expense_splits(user_id);
CREATE INDEX idx_settlements_group_id ON public.settlements(group_id);
CREATE INDEX idx_settlements_paid_by ON public.settlements(paid_by);
CREATE INDEX idx_settlements_paid_to ON public.settlements(paid_to);
CREATE UNIQUE INDEX group_invitations_group_id_email_key
  ON public.group_invitations(group_id, email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.is_group_member(target_group_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = target_group_id AND user_id = target_user_id
  );
$$;

CREATE FUNCTION public.is_group_admin(target_group_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = target_group_id
      AND user_id = target_user_id
      AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated;

CREATE POLICY profiles_select_self_or_shared_group ON public.profiles
FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.group_members target_member
    WHERE target_member.user_id = profiles.id
      AND public.is_group_member(target_member.group_id, auth.uid())
  )
);

CREATE POLICY profiles_insert_own ON public.profiles
FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY groups_select_member_or_creator ON public.groups
FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_group_member(id, auth.uid()));

CREATE POLICY groups_insert_own ON public.groups
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY group_members_select_group_members ON public.group_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid()));

CREATE POLICY group_members_insert_initial_creator_admin ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND created_by = auth.uid()
  )
);

CREATE FUNCTION public.find_addable_group_member_by_email(
  target_group_id uuid,
  target_email text
)
RETURNS TABLE(status text, user_id uuid, full_name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  normalized_email text := lower(trim(target_email));
  found_profile public.profiles%rowtype;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_group_admin(target_group_id, auth.uid()) THEN
    RETURN QUERY SELECT 'permission_denied'::text, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO found_profile FROM public.profiles
  WHERE lower(profiles.email) = normalized_email LIMIT 1;

  IF found_profile.id IS NULL THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid, NULL::text, NULL::text;
  ELSIF found_profile.id = auth.uid() THEN
    RETURN QUERY SELECT 'self'::text, found_profile.id, found_profile.full_name, found_profile.email;
  ELSIF public.is_group_member(target_group_id, found_profile.id) THEN
    RETURN QUERY SELECT 'already_member'::text, found_profile.id, found_profile.full_name, found_profile.email;
  ELSE
    RETURN QUERY SELECT 'found'::text, found_profile.id, found_profile.full_name, found_profile.email;
  END IF;
END;
$$;

CREATE FUNCTION public.add_group_member_by_email(
  target_group_id uuid,
  target_email text
)
RETURNS TABLE(status text, user_id uuid, full_name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(trim(target_email));
  found_profile public.profiles%rowtype;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_group_admin(target_group_id, auth.uid()) THEN
    RETURN QUERY SELECT 'permission_denied'::text, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  SELECT * INTO found_profile FROM public.profiles
  WHERE lower(profiles.email) = normalized_email LIMIT 1;

  IF found_profile.id IS NULL THEN
    RETURN QUERY SELECT 'not_found'::text, NULL::uuid, NULL::text, NULL::text;
  ELSIF found_profile.id = auth.uid() THEN
    RETURN QUERY SELECT 'self'::text, found_profile.id, found_profile.full_name, found_profile.email;
  ELSIF public.is_group_member(target_group_id, found_profile.id) THEN
    RETURN QUERY SELECT 'already_member'::text, found_profile.id, found_profile.full_name, found_profile.email;
  ELSE
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (target_group_id, found_profile.id, 'member');
    RETURN QUERY SELECT 'added'::text, found_profile.id, found_profile.full_name, found_profile.email;
  END IF;
END;
$$;

CREATE FUNCTION public.create_group_invitation(target_group_id uuid, target_email text)
RETURNS TABLE(status text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  normalized_email text := lower(trim(target_email));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_group_admin(target_group_id, auth.uid()) THEN
    RETURN QUERY SELECT 'permission_denied'::text, NULL::text;
    RETURN;
  END IF;
  IF normalized_email = '' THEN
    RETURN QUERY SELECT 'invalid_email'::text, NULL::text;
    RETURN;
  END IF;
  IF normalized_email = lower(coalesce(auth.jwt() ->> 'email', '')) THEN
    RETURN QUERY SELECT 'self'::text, normalized_email;
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(profiles.email) = normalized_email) THEN
    RETURN QUERY SELECT 'existing_user'::text, normalized_email;
    RETURN;
  END IF;

  INSERT INTO public.group_invitations (group_id, email, invited_by)
  VALUES (target_group_id, normalized_email, auth.uid())
  ON CONFLICT (group_id, email) DO UPDATE SET
    invited_by = excluded.invited_by,
    created_at = now(),
    expires_at = now() + interval '7 days',
    accepted_at = NULL;

  RETURN QUERY SELECT 'created'::text, normalized_email;
END;
$$;

CREATE FUNCTION public.accept_group_invitation(target_group_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  authenticated_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  pending_invitation public.group_invitations%rowtype;
BEGIN
  IF auth.uid() IS NULL OR authenticated_email = '' THEN
    RETURN 'permission_denied';
  END IF;

  SELECT * INTO pending_invitation FROM public.group_invitations
  WHERE group_id = target_group_id
    AND email = authenticated_email
    AND accepted_at IS NULL
  LIMIT 1;

  IF pending_invitation.id IS NULL THEN
    IF public.is_group_member(target_group_id, auth.uid()) THEN
      RETURN 'already_member';
    END IF;
    RETURN 'not_found';
  END IF;
  IF pending_invitation.expires_at <= now() THEN
    RETURN 'expired';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group_id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  UPDATE public.group_invitations SET accepted_at = now()
  WHERE id = pending_invitation.id;
  RETURN 'accepted';
END;
$$;

REVOKE ALL ON public.group_invitations FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_addable_group_member_by_email(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_group_member_by_email(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_group_invitation(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_group_invitation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_addable_group_member_by_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_group_member_by_email(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group_invitation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_group_invitation(uuid) TO authenticated;
