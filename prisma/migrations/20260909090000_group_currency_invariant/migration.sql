-- A group is a single-currency ledger. Refuse to install the invariant over
-- inconsistent data so an operator must reconcile it explicitly first.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.expenses AS expense
    JOIN public.groups AS group_record ON group_record.id = expense.group_id
    WHERE expense.currency <> group_record.currency
  ) OR EXISTS (
    SELECT 1
    FROM public.settlements AS settlement
    JOIN public.groups AS group_record ON group_record.id = settlement.group_id
    WHERE settlement.currency <> group_record.currency
  ) THEN
    RAISE EXCEPTION 'Cannot enforce group currency: inconsistent financial records exist';
  END IF;
END;
$$;

CREATE FUNCTION public.enforce_financial_record_group_currency()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  expected_currency text;
BEGIN
  SELECT currency INTO expected_currency
  FROM public.groups
  WHERE id = NEW.group_id;

  IF expected_currency IS NULL OR NEW.currency <> expected_currency THEN
    RAISE EXCEPTION 'Financial record currency must match group currency'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER expenses_enforce_group_currency
BEFORE INSERT OR UPDATE OF group_id, currency ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_financial_record_group_currency();

CREATE TRIGGER settlements_enforce_group_currency
BEFORE INSERT OR UPDATE OF group_id, currency ON public.settlements
FOR EACH ROW
EXECUTE FUNCTION public.enforce_financial_record_group_currency();

CREATE FUNCTION public.prevent_group_currency_change_with_financial_records()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.currency <> OLD.currency AND (
    EXISTS (SELECT 1 FROM public.expenses WHERE group_id = NEW.id)
    OR EXISTS (SELECT 1 FROM public.settlements WHERE group_id = NEW.id)
  ) THEN
    RAISE EXCEPTION 'Group currency cannot change after financial activity exists'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER groups_prevent_currency_change
BEFORE UPDATE OF currency ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.prevent_group_currency_change_with_financial_records();

REVOKE ALL ON FUNCTION public.enforce_financial_record_group_currency() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_group_currency_change_with_financial_records() FROM PUBLIC, anon, authenticated;
