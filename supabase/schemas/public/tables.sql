-- transfers: one row per transfer bundle
CREATE TABLE public.transfers (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text                    NOT NULL UNIQUE,
  mode            public.transfer_mode    NOT NULL,
  status          public.transfer_status  NOT NULL DEFAULT 'uploading',
  password_hash   text,                             -- bcrypt hash; NULL = no password
  recipient_email text,                             -- populated only when mode = 'email'
  sender_email    text                    NOT NULL,
  sender_ip       inet,                             -- IP address of the creator (abuse auditing)
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

-- email_verifications: OTP records for upload authorisation
CREATE TABLE public.email_verifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  code_hash  text        NOT NULL,   -- bcrypt hash of the 6-digit OTP
  expires_at timestamptz NOT NULL,
  used       boolean     NOT NULL DEFAULT false,
  attempts   smallint    NOT NULL DEFAULT 0,   -- failed verify attempts; code is burned at 5
  ip_address inet,                              -- IP of the OTP requester (abuse auditing)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_verifications_email_idx ON public.email_verifications (email);

-- rate_limit_events: one row per guarded-request observation.
-- `bucket` is a composite key like 'otp:ip:1.2.3.4' or 'create_transfer:email:a@b.com'.
-- Rows older than 24h are cleaned up nightly.
CREATE TABLE public.rate_limit_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rate_limit_events_bucket_time_idx
  ON public.rate_limit_events (bucket, created_at DESC);

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
