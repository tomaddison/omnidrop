-- Hourly cleanup job — deletes expired transfers from S3 via the cleanup-s3 edge function.
-- Requires: pg_cron extension, public.call_edge_function, and the app.supabase_url /
-- app.service_role_key database settings to be configured.

SELECT cron.schedule(
  'cleanup-expired-transfers',   -- job name (idempotent handle for updates/deletion)
  '0 * * * *',                   -- every hour, on the hour (UTC)
  $$SELECT public.call_edge_function('cleanup-s3')$$
);

-- Nightly cleanup of the rate-limit event log (keeps the table tiny).
SELECT cron.schedule(
  'cleanup-rate-limit-events',
  '30 3 * * *',                  -- 03:30 UTC every night
  $$SELECT public.cleanup_rate_limit_events()$$
);
