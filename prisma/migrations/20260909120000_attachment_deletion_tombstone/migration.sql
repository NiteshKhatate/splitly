ALTER TABLE public.attachments
  ADD COLUMN deleted_at timestamptz;

CREATE INDEX idx_attachments_pending_deletion
  ON public.attachments(deleted_at)
  WHERE deleted_at IS NOT NULL;
