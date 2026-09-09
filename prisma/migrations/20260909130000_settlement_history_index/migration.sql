CREATE INDEX idx_settlements_group_date_created_at
  ON public.settlements(group_id, date DESC, created_at DESC);
