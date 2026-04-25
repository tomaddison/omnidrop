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
-- Reads two secrets from Supabase Vault via private.get_secret:
--   supabase_url        e.g. https://<project-ref>.supabase.co
--   service_role_key    the project's Secret key (sb_secret_...)
-- Both are populated from config.toml's [db.vault] block during `supabase db push`,
-- which sources them from the SUPABASE_URL and SUPABASE_SECRET_KEY env vars.
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

-- Restrict to service_role; this function is only called from pg_cron jobs.
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
