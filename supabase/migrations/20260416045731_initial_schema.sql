-- ============================================================
-- Phase 2 — initial schema
-- Enums → Tables → RLS → Functions
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_net    WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron   WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

CREATE TYPE public.transfer_mode AS ENUM (
  'link',
  'email'
);

CREATE TYPE public.transfer_status AS ENUM (
  'uploading',
  'pending',
  'ready',
  'failed',
  'expired'
);

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

CREATE TABLE public.transfers (
  id              uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text                    NOT NULL UNIQUE,
  mode            public.transfer_mode    NOT NULL,
  status          public.transfer_status  NOT NULL DEFAULT 'uploading',
  password_hash   text,
  recipient_email text,
  sender_email    text                    NOT NULL,
  title           text,
  message         text,
  expires_at      timestamptz,
  created_at      timestamptz             NOT NULL DEFAULT now(),
  updated_at      timestamptz             NOT NULL DEFAULT now()
);

CREATE INDEX transfers_slug_idx    ON public.transfers (slug);
CREATE INDEX transfers_status_idx  ON public.transfers (status);
CREATE INDEX transfers_expires_idx ON public.transfers (expires_at)
  WHERE status = 'ready';

CREATE TABLE public.transfer_files (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id   uuid        NOT NULL REFERENCES public.transfers (id) ON DELETE CASCADE,
  relative_path text        NOT NULL,
  file_size     bigint      NOT NULL,
  s3_key        text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transfer_files_transfer_idx ON public.transfer_files (transfer_id);

CREATE TABLE public.email_verifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  code_hash  text        NOT NULL,
  expires_at timestamptz NOT NULL,
  used       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_verifications_email_idx ON public.email_verifications (email);

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

-- ------------------------------------------------------------
-- RLS — deny-all for anon and authenticated
-- ------------------------------------------------------------

ALTER TABLE public.transfers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_files      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_deny_anon"                    ON public.transfers           FOR ALL TO anon          USING (false);
CREATE POLICY "transfers_deny_authenticated"           ON public.transfers           FOR ALL TO authenticated  USING (false);
CREATE POLICY "transfer_files_deny_anon"               ON public.transfer_files      FOR ALL TO anon          USING (false);
CREATE POLICY "transfer_files_deny_authenticated"      ON public.transfer_files      FOR ALL TO authenticated  USING (false);
CREATE POLICY "email_verifications_deny_anon"          ON public.email_verifications FOR ALL TO anon          USING (false);
CREATE POLICY "email_verifications_deny_authenticated" ON public.email_verifications FOR ALL TO authenticated  USING (false);

-- ------------------------------------------------------------
-- Functions
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_expired_transfers()
RETURNS TABLE (
  id       uuid,
  slug     text,
  s3_keys  text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.slug,
    array_agg(f.s3_key) AS s3_keys
  FROM public.transfers t
  JOIN public.transfer_files f ON f.transfer_id = t.id
  WHERE t.status = 'ready'
    AND t.expires_at IS NOT NULL
    AND t.expires_at < now()
  GROUP BY t.id, t.slug;
$$;

REVOKE EXECUTE ON FUNCTION public.get_expired_transfers() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_expired_transfers() TO service_role;

CREATE OR REPLACE FUNCTION public.call_edge_function(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.call_edge_function(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.call_edge_function(text) TO service_role;

-- ------------------------------------------------------------
-- pg_cron job — hourly cleanup (registered after functions exist)
-- ------------------------------------------------------------

SELECT cron.schedule(
  'cleanup-expired-transfers',   -- job name
  '0 * * * *',                   -- every hour, on the hour
  $$SELECT public.call_edge_function('cleanup-s3')$$
);
