-- get_expired_transfers: returns transfers in 'ready' state whose expires_at has passed.
-- Called by the cleanup edge function to know which transfers to delete from S3.
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

-- Restrict direct invocation to service_role only.
REVOKE EXECUTE ON FUNCTION public.get_expired_transfers() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_expired_transfers() TO service_role;


-- call_edge_function: invokes a Supabase Edge Function over HTTP via pg_net.
-- Requires the following database settings:
--   app.supabase_url        e.g. https://<project-ref>.supabase.co
--   app.service_role_key    service-role JWT
-- Set these in the Supabase dashboard: Database -> Settings -> Configuration.
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

-- Restrict to service_role; this function is only called from pg_cron jobs.
REVOKE EXECUTE ON FUNCTION public.call_edge_function(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.call_edge_function(text) TO service_role;


-- check_and_record_rate_limit: atomic rate-limit check.
-- Counts recent events matching `p_bucket` inside the sliding window `p_window_seconds`.
-- If the count is already at or above `p_limit`, returns false and writes nothing.
-- Otherwise inserts a fresh event row and returns true.
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


-- cleanup_rate_limit_events: deletes rate-limit rows older than 24 hours.
-- Scheduled nightly via pg_cron.
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
