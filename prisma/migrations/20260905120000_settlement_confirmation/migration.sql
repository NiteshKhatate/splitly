CREATE TYPE public.settlement_status AS ENUM ('PENDING', 'CONFIRMED');

ALTER TYPE public.activity_event_type ADD VALUE 'SETTLEMENT_CONFIRMED';

ALTER TABLE public.settlements
  ADD COLUMN status public.settlement_status NOT NULL DEFAULT 'CONFIRMED',
  ADD COLUMN confirmed_at timestamptz;

UPDATE public.settlements
SET confirmed_at = created_at;

ALTER TABLE public.settlements
  ALTER COLUMN status SET DEFAULT 'PENDING',
  ADD CONSTRAINT settlements_confirmation_state
    CHECK (
      (status = 'PENDING' AND confirmed_at IS NULL)
      OR (status = 'CONFIRMED' AND confirmed_at IS NOT NULL)
    );

CREATE INDEX idx_settlements_payee_status
  ON public.settlements(paid_to, status);
