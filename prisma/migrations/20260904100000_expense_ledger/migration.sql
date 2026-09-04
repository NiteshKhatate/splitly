-- Replace the unused prototype expense tables with the integer-minor-unit
-- ledger required by Stage 2. Abort instead of discarding legacy data.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.expenses LIMIT 1)
    OR EXISTS (SELECT 1 FROM public.expense_splits LIMIT 1) THEN
    RAISE EXCEPTION
      'Stage 2 migration requires the legacy expense tables to be empty';
  END IF;
END;
$$;

DROP TABLE public.expense_splits;
DROP TABLE public.expenses;

CREATE TYPE public.expense_category AS ENUM (
  'GENERAL',
  'GROCERIES',
  'DINING',
  'TRANSPORT',
  'HOUSING',
  'UTILITIES',
  'ENTERTAINMENT',
  'TRAVEL',
  'HEALTH',
  'SHOPPING',
  'OTHER'
);

CREATE TYPE public.split_method AS ENUM (
  'EQUAL',
  'EXACT',
  'PERCENTAGE',
  'SHARES'
);

CREATE TYPE public.activity_event_type AS ENUM (
  'GROUP_CREATED',
  'MEMBER_JOINED',
  'MEMBER_REMOVED',
  'EXPENSE_CREATED',
  'EXPENSE_UPDATED',
  'EXPENSE_DELETED',
  'SETTLEMENT_CREATED'
);

CREATE TYPE public.activity_entity_type AS ENUM (
  'GROUP',
  'MEMBER',
  'INVITE',
  'EXPENSE',
  'SETTLEMENT'
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  description text NOT NULL,
  total_minor integer NOT NULL,
  currency text NOT NULL,
  date date NOT NULL,
  category public.expense_category NOT NULL DEFAULT 'GENERAL',
  notes text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expenses_description_not_blank CHECK (length(trim(description)) > 0),
  CONSTRAINT expenses_total_minor_positive CHECK (total_minor > 0),
  CONSTRAINT expenses_currency_iso_format CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE TABLE public.expense_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount_minor integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expense_payments_amount_minor_positive CHECK (amount_minor > 0),
  CONSTRAINT expense_payments_expense_id_payer_id_key UNIQUE (expense_id, payer_id)
);

CREATE TABLE public.expense_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  owed_minor integer NOT NULL,
  split_method public.split_method NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT expense_shares_owed_minor_nonnegative CHECK (owed_minor >= 0),
  CONSTRAINT expense_shares_expense_id_participant_id_key UNIQUE (expense_id, participant_id)
);

CREATE TABLE public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  type public.activity_event_type NOT NULL,
  entity_type public.activity_entity_type NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_events_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_expenses_group_id_date ON public.expenses(group_id, date);
CREATE INDEX idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX idx_expense_payments_payer_id ON public.expense_payments(payer_id);
CREATE INDEX idx_expense_shares_participant_id ON public.expense_shares(participant_id);
CREATE INDEX idx_activity_events_group_id_created_at
  ON public.activity_events(group_id, created_at);
CREATE INDEX idx_activity_events_actor_id ON public.activity_events(actor_id);
CREATE INDEX idx_activity_events_entity
  ON public.activity_events(entity_type, entity_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- These tables are server-only until explicit browser Data API policies are
-- designed and tested. Prisma still performs application-level authorization.
REVOKE ALL ON public.expenses FROM anon, authenticated;
REVOKE ALL ON public.expense_payments FROM anon, authenticated;
REVOKE ALL ON public.expense_shares FROM anon, authenticated;
REVOKE ALL ON public.activity_events FROM anon, authenticated;
