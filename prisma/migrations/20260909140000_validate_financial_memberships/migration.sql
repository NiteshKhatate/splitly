-- The preceding triggers protect new writes. Validate the existing ledger as a
-- separate forward migration so an environment with historical inconsistencies
-- cannot be certified as production-ready.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.expenses AS expense
    LEFT JOIN public.group_members AS member
      ON member.group_id = expense.group_id AND member.user_id = expense.created_by
    WHERE member.user_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.expense_payments AS payment
    JOIN public.expenses AS expense ON expense.id = payment.expense_id
    LEFT JOIN public.group_members AS member
      ON member.group_id = expense.group_id AND member.user_id = payment.payer_id
    WHERE member.user_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.expense_shares AS share_record
    JOIN public.expenses AS expense ON expense.id = share_record.expense_id
    LEFT JOIN public.group_members AS member
      ON member.group_id = expense.group_id AND member.user_id = share_record.participant_id
    WHERE member.user_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public.settlements AS settlement
    LEFT JOIN public.group_members AS payer
      ON payer.group_id = settlement.group_id AND payer.user_id = settlement.paid_by
    LEFT JOIN public.group_members AS payee
      ON payee.group_id = settlement.group_id AND payee.user_id = settlement.paid_to
    LEFT JOIN public.group_members AS creator
      ON creator.group_id = settlement.group_id AND creator.user_id = settlement.created_by
    WHERE payer.user_id IS NULL OR payee.user_id IS NULL OR creator.user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Financial membership data must be reconciled before this migration';
  END IF;
END;
$$;

-- Preserve intentional group cascade deletion while continuing to reject a
-- direct attempt to remove a member who is referenced by the live ledger.
CREATE OR REPLACE FUNCTION public.prevent_financial_member_removal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = OLD.group_id) THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.expenses
    WHERE group_id = OLD.group_id AND created_by = OLD.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.expense_payments AS payment
    JOIN public.expenses AS expense ON expense.id = payment.expense_id
    WHERE expense.group_id = OLD.group_id AND payment.payer_id = OLD.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.expense_shares AS share_record
    JOIN public.expenses AS expense ON expense.id = share_record.expense_id
    WHERE expense.group_id = OLD.group_id AND share_record.participant_id = OLD.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.settlements
    WHERE group_id = OLD.group_id
      AND (paid_by = OLD.user_id OR paid_to = OLD.user_id OR created_by = OLD.user_id)
  ) THEN
    RAISE EXCEPTION 'Members with financial history cannot be removed'
      USING ERRCODE = '23514';
  END IF;

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_financial_member_removal() FROM PUBLIC, anon, authenticated;
