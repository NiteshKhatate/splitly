CREATE TYPE public.reminder_delivery_status AS ENUM ('PENDING', 'SENT', 'FAILED');

ALTER TABLE public.profiles
ADD COLUMN reminders_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE public.reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_minor integer NOT NULL,
  currency text NOT NULL,
  status public.reminder_delivery_status NOT NULL DEFAULT 'PENDING',
  dedupe_key text NOT NULL,
  provider_id text,
  failure_code text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reminder_deliveries_amount_positive CHECK (amount_minor > 0),
  CONSTRAINT reminder_deliveries_currency_iso CHECK (currency ~ '^[A-Z]{3}$'),
  CONSTRAINT reminder_deliveries_dedupe_key_key UNIQUE (dedupe_key)
);

CREATE INDEX idx_reminder_deliveries_recipient_created_at
ON public.reminder_deliveries(recipient_id, created_at);

CREATE INDEX idx_reminder_deliveries_group_created_at
ON public.reminder_deliveries(group_id, created_at);

ALTER TABLE public.reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reminder_deliveries FROM anon, authenticated;
