-- ============================================================
-- Initial schema
-- Extensions → Enums → Tables → RLS → Functions → Cron
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

CREATE TYPE public.transfer_mode AS ENUM (
  'link',
  'email'
);

CREATE TYPE public.transfer_status AS ENUM (
  'uploading',
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
  recipient_email text,
  sender_user_id  uuid                    REFERENCES auth.users (id) ON DELETE SET NULL,
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
CREATE INDEX transfers_sender_user_month_idx
  ON public.transfers (sender_user_id, created_at DESC);

CREATE TABLE public.transfer_files (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id   uuid        NOT NULL REFERENCES public.transfers (id) ON DELETE CASCADE,
  relative_path text        NOT NULL,
  file_size     bigint      NOT NULL,
  s3_key        text        NOT NULL,
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

-- ------------------------------------------------------------
-- RLS - deny-all for anon and authenticated; all access is via
-- the service-role client inside server functions.
-- ------------------------------------------------------------

ALTER TABLE public.transfers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transfers_deny_anon"               ON public.transfers      FOR ALL TO anon          USING (false);
CREATE POLICY "transfers_deny_authenticated"      ON public.transfers      FOR ALL TO authenticated USING (false);
CREATE POLICY "transfer_files_deny_anon"          ON public.transfer_files FOR ALL TO anon          USING (false);
CREATE POLICY "transfer_files_deny_authenticated" ON public.transfer_files FOR ALL TO authenticated USING (false);

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

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_secret(secret_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  secret text;
BEGIN
  SELECT decrypted_secret INTO secret
  FROM vault.decrypted_secrets
  WHERE name = secret_name;

  RETURN secret;
END;
$$;

REVOKE EXECUTE ON FUNCTION private.get_secret(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.call_edge_function(function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url TEXT := private.get_secret('supabase_url');
  v_key TEXT := private.get_secret('service_role_key');
BEGIN
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'call_edge_function: vault secrets supabase_url / service_role_key are not set';
  END IF;

  PERFORM net.http_post(
    url     := v_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := '{}'::jsonb
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.call_edge_function(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.call_edge_function(text) TO service_role;

-- Atomic per-user monthly quota check + insert (replaces a TOCTOU SELECT count → INSERT in app code).
CREATE OR REPLACE FUNCTION public.create_transfer_if_under_quota(
  p_slug            text,
  p_mode            public.transfer_mode,
  p_sender_user_id  uuid,
  p_sender_email    text,
  p_recipient_email text,
  p_title           text,
  p_message         text,
  p_monthly_limit   integer
)
RETURNS TABLE (id uuid, over_quota boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_id    uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_sender_user_id::text));

  SELECT count(*) INTO v_count
  FROM public.transfers
  WHERE sender_user_id = p_sender_user_id
    AND created_at >= date_trunc('month', now() AT TIME ZONE 'UTC');

  IF v_count >= p_monthly_limit THEN
    id := NULL;
    over_quota := true;
    RETURN NEXT;
    RETURN;
  END IF;

  INSERT INTO public.transfers (
    slug, mode, sender_user_id, sender_email, recipient_email, title, message
  )
  VALUES (
    p_slug, p_mode, p_sender_user_id, p_sender_email,
    nullif(p_recipient_email, ''), nullif(p_title, ''), nullif(p_message, '')
  )
  RETURNING transfers.id INTO v_id;

  id := v_id;
  over_quota := false;
  RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_transfer_if_under_quota(text, public.transfer_mode, uuid, text, text, text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.create_transfer_if_under_quota(text, public.transfer_mode, uuid, text, text, text, text, integer) TO service_role;

-- ------------------------------------------------------------
-- Cron - hourly cleanup of expired transfers
-- ------------------------------------------------------------

SELECT cron.schedule(
  'cleanup-expired-transfers',
  '0 * * * *',
  $$SELECT public.call_edge_function('cleanup-s3')$$
);
