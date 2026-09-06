CREATE TABLE public.rate_limit_buckets (
  key text PRIMARY KEY,
  count integer NOT NULL,
  window_start timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_buckets_count_positive CHECK (count > 0)
);

CREATE INDEX idx_rate_limit_buckets_window_start ON public.rate_limit_buckets(window_start);
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limit_buckets FROM anon, authenticated;
