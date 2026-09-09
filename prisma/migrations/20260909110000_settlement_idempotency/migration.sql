ALTER TABLE public.settlements
  ADD COLUMN idempotency_key uuid;

ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_idempotency_key_key UNIQUE (idempotency_key);
