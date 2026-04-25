-- transfers: one row per transfer bundle
CREATE TABLE public.transfers (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text                    NOT NULL UNIQUE,
  mode            public.transfer_mode    NOT NULL,
  status          public.transfer_status  NOT NULL DEFAULT 'uploading',
  recipient_email text,                             -- populated only when mode = 'email'
  sender_user_id  uuid                    REFERENCES auth.users (id) ON DELETE SET NULL,
  sender_email    text                    NOT NULL,
  title           text,                             -- optional transfer title
  message         text,                             -- optional personal message
  expires_at      timestamptz,                      -- set on finalise; NULL until then
  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now()
);

CREATE INDEX transfers_slug_idx    ON public.transfers (slug);
CREATE INDEX transfers_status_idx  ON public.transfers (status);
CREATE INDEX transfers_expires_idx ON public.transfers (expires_at)
  WHERE status = 'ready';
-- Index powers the per-user monthly quota count.
CREATE INDEX transfers_sender_user_month_idx
  ON public.transfers (sender_user_id, created_at DESC);

-- transfer_files: individual files within a transfer.
-- relative_path preserves folder structure (e.g. "photo.jpg" or "vacation/day1/photo.jpg").
CREATE TABLE public.transfer_files (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id   uuid        NOT NULL REFERENCES public.transfers (id) ON DELETE CASCADE,
  relative_path text        NOT NULL,   -- path relative to the transfer root; includes folder structure
  file_size     bigint      NOT NULL,   -- bytes
  s3_key        text        NOT NULL,   -- S3 object key (includes slug prefix)
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transfer_files_transfer_idx ON public.transfer_files (transfer_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_transfers_updated_at
  BEFORE UPDATE ON public.transfers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
