-- ============================================================
-- Phase 9 — security hardening: rate-limit storage + RPC
-- ============================================================

-- ------------------------------------------------------------
-- New columns on existing tables
-- ------------------------------------------------------------

ALTER TABLE public.email_verifications
  ADD COLUMN attempts   smallint NOT NULL DEFAULT 0,
  ADD COLUMN ip_address inet;

ALTER TABLE public.transfers
  ADD COLUMN sender_ip inet;

-- ------------------------------------------------------------
-- rate_limit_events — one row per guarded-request observation
-- ------------------------------------------------------------

CREATE TABLE public.rate_limit_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX rate_limit_events_bucket_time_idx
  ON public.rate_limit_events (bucket, created_at DESC);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limit_events_deny_anon"
  ON public.rate_limit_events FOR ALL TO anon          USING (false);
CREATE POLICY "rate_limit_events_deny_authenticated"
  ON public.rate_limit_events FOR ALL TO authenticated USING (false);

-- ------------------------------------------------------------
-- check_and_record_rate_limit — atomic check + insert
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  p_bucket         text,
  p_limit          int,
  p_window_seconds int
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.rate_limit_events
  WHERE bucket = p_bucket
    AND created_at > now() - make_interval(secs => p_window_seconds);

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_events (bucket) VALUES (p_bucket);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_record_rate_limit(text, int, int) TO service_role;

-- ------------------------------------------------------------
-- cleanup_rate_limit_events — nightly purge of stale rows
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.rate_limit_events
  WHERE created_at < now() - interval '24 hours';
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limit_events() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cleanup_rate_limit_events() TO service_role;

-- ------------------------------------------------------------
-- Cron — nightly cleanup job
-- ------------------------------------------------------------

SELECT cron.schedule(
  'cleanup-rate-limit-events',
  '30 3 * * *',                  -- 03:30 UTC every night
  $$SELECT public.cleanup_rate_limit_events()$$
);
