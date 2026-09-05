ALTER TABLE public.settlements
  ADD COLUMN amount_minor integer,
  ADD COLUMN currency text,
  ADD COLUMN created_by uuid,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.settlements AS settlement
SET
  amount_minor = round(settlement.amount * 100)::integer,
  currency = groups.currency,
  created_by = settlement.paid_by
FROM public.groups AS groups
WHERE groups.id = settlement.group_id;

ALTER TABLE public.settlements
  DROP CONSTRAINT settlement_amount_positive,
  DROP CONSTRAINT settlement_different_users;

ALTER TABLE public.settlements
  ALTER COLUMN amount_minor SET NOT NULL,
  ALTER COLUMN currency SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL,
  DROP COLUMN amount;

ALTER TABLE public.settlements RENAME COLUMN settlement_date TO date;
ALTER TABLE public.settlements RENAME COLUMN notes TO note;

ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_amount_minor_positive CHECK (amount_minor > 0),
  ADD CONSTRAINT settlements_currency_iso_format CHECK (currency ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT settlements_distinct_members CHECK (paid_by <> paid_to),
  ADD CONSTRAINT settlements_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.settlements FROM anon, authenticated;
