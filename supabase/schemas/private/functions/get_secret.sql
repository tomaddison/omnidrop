-- private.get_secret: looks up a decrypted secret from Supabase Vault by name.
-- Vault entries are populated from config.toml's [db.vault] block during `supabase db push`.
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
