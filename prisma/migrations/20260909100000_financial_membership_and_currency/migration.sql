-- Phase 1 supports currencies with two decimal minor units only.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.groups WHERE currency NOT IN ('INR', 'USD', 'EUR', 'GBP')
  ) OR EXISTS (
    SELECT 1 FROM public.expenses WHERE currency NOT IN ('INR', 'USD', 'EUR', 'GBP')
  ) OR EXISTS (
    SELECT 1 FROM public.settlements WHERE currency NOT IN ('INR', 'USD', 'EUR', 'GBP')
  ) THEN
    RAISE EXCEPTION 'Unsupported currency data must be reconciled before this migration';
  END IF;
END;
$$;

ALTER TABLE public.groups
  ADD CONSTRAINT groups_supported_currency_check
  CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP'));

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_supported_currency_check
  CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP'));

ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_supported_currency_check
  CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP'));

-- Lock the membership row while validating a financial write. A concurrent
-- membership deletion must wait, then its own guard sees the committed ledger.
CREATE FUNCTION public.require_locked_group_membership(
  target_group_id uuid,
  target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM 1
  FROM public.group_members
  WHERE group_id = target_group_id
    AND user_id = target_user_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financial participant must be a group member'
      USING ERRCODE = '23514';
  END IF;
END;
$$;

CREATE FUNCTION public.enforce_expense_creator_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_locked_group_membership(NEW.group_id, NEW.created_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER expenses_enforce_creator_membership
BEFORE INSERT OR UPDATE OF group_id, created_by ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_expense_creator_membership();

CREATE FUNCTION public.enforce_expense_ledger_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_group_id uuid;
  target_user_id uuid;
BEGIN
  SELECT group_id INTO target_group_id
  FROM public.expenses
  WHERE id = NEW.expense_id;

  target_user_id := CASE TG_TABLE_NAME
    WHEN 'expense_payments' THEN NEW.payer_id
    ELSE NEW.participant_id
  END;

  PERFORM public.require_locked_group_membership(target_group_id, target_user_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER expense_payments_enforce_membership
BEFORE INSERT OR UPDATE OF expense_id, payer_id ON public.expense_payments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_expense_ledger_membership();

CREATE TRIGGER expense_shares_enforce_membership
BEFORE INSERT OR UPDATE OF expense_id, participant_id ON public.expense_shares
FOR EACH ROW
EXECUTE FUNCTION public.enforce_expense_ledger_membership();

CREATE FUNCTION public.enforce_settlement_membership()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.require_locked_group_membership(NEW.group_id, NEW.paid_by);
  PERFORM public.require_locked_group_membership(NEW.group_id, NEW.paid_to);
  PERFORM public.require_locked_group_membership(NEW.group_id, NEW.created_by);
  RETURN NEW;
END;
$$;

CREATE TRIGGER settlements_enforce_membership
BEFORE INSERT OR UPDATE OF group_id, paid_by, paid_to, created_by ON public.settlements
FOR EACH ROW
EXECUTE FUNCTION public.enforce_settlement_membership();

CREATE FUNCTION public.prevent_financial_member_removal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.expenses
    WHERE group_id = OLD.group_id
      AND created_by = OLD.user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.expense_payments AS payment
    JOIN public.expenses AS expense ON expense.id = payment.expense_id
    WHERE expense.group_id = OLD.group_id
      AND payment.payer_id = OLD.user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.expense_shares AS share_record
    JOIN public.expenses AS expense ON expense.id = share_record.expense_id
    WHERE expense.group_id = OLD.group_id
      AND share_record.participant_id = OLD.user_id
  ) OR EXISTS (
    SELECT 1
    FROM public.settlements
    WHERE group_id = OLD.group_id
      AND (paid_by = OLD.user_id OR paid_to = OLD.user_id OR created_by = OLD.user_id)
  ) THEN
    RAISE EXCEPTION 'Members with financial history cannot be removed'
      USING ERRCODE = '23514';
  END IF;

  RETURN OLD;
END;
$$;

CREATE TRIGGER group_members_prevent_financial_removal
BEFORE DELETE ON public.group_members
FOR EACH ROW
EXECUTE FUNCTION public.prevent_financial_member_removal();

REVOKE ALL ON FUNCTION public.require_locked_group_membership(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_expense_creator_membership() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_expense_ledger_membership() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_settlement_membership() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_financial_member_removal() FROM PUBLIC, anon, authenticated;
