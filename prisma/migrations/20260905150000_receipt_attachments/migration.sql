CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  byte_size integer NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attachments_storage_key_key UNIQUE (storage_key),
  CONSTRAINT attachments_byte_size_valid CHECK (byte_size > 0 AND byte_size <= 5242880),
  CONSTRAINT attachments_mime_type_valid CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf'))
);

CREATE INDEX idx_attachments_expense_created_at ON public.attachments(expense_id, created_at);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments(uploaded_by);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.attachments FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
