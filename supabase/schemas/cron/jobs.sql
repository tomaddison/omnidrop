-- Hourly cleanup job - deletes expired transfers from S3 via the cleanup-s3 edge function.
-- Requires: pg_cron extension, public.call_edge_function, and the supabase_url /
-- service_role_key vault secrets (populated from config.toml's [db.vault] block).

SELECT cron.schedule(
  'cleanup-expired-transfers',   -- job name (idempotent handle for updates/deletion)
  '0 * * * *',                   -- every hour, on the hour (UTC)
  $$SELECT public.call_edge_function('cleanup-s3')$$
);
