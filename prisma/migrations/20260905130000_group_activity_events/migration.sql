-- Keep group and membership history complete regardless of whether a mutation
-- originates from Prisma or an authorized Supabase RPC.
CREATE FUNCTION public.record_group_created_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_events (
    group_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'GROUP_CREATED',
    'GROUP',
    NEW.id,
    jsonb_build_object('name', NEW.name)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER groups_record_created_activity
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.record_group_created_activity();

CREATE FUNCTION public.record_group_member_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_actor_id uuid;
  group_creator_id uuid;
  target_group_id uuid;
  target_member_id uuid;
  member_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_group_id := OLD.group_id;
    target_member_id := OLD.user_id;
  ELSE
    target_group_id := NEW.group_id;
    target_member_id := NEW.user_id;
  END IF;

  SELECT created_by INTO group_creator_id
  FROM public.groups
  WHERE id = target_group_id;

  -- The creator's initial admin membership is represented by GROUP_CREATED.
  IF TG_OP = 'INSERT' AND NEW.user_id = group_creator_id THEN
    RETURN NEW;
  END IF;

  activity_actor_id := COALESCE(auth.uid(), target_member_id);

  SELECT full_name INTO member_name
  FROM public.profiles
  WHERE id = target_member_id;

  INSERT INTO public.activity_events (
    group_id,
    actor_id,
    type,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    target_group_id,
    activity_actor_id,
    CASE WHEN TG_OP = 'INSERT'
      THEN 'MEMBER_JOINED'::public.activity_event_type
      ELSE 'MEMBER_REMOVED'::public.activity_event_type
    END,
    'MEMBER',
    target_member_id,
    jsonb_build_object('memberName', COALESCE(member_name, 'A member'))
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER group_members_record_activity
AFTER INSERT OR DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.record_group_member_activity();

REVOKE ALL ON FUNCTION public.record_group_created_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_group_member_activity() FROM PUBLIC, anon, authenticated;
