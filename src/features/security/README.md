# security

Cross-cutting request hardening. Every mutating server function in the app is wrapped with the `guarded()` helper here rather than hand-rolling its own checks.

## Files

- `server/guard.ts` — `guarded()` wraps a `createServerFn` handler with IP extraction, Cloudflare Turnstile verification, and one or more rate-limit buckets.
- `server/guard.test.ts` — covers the Turnstile dev bypass, token rejection, and rate-limit bucket fan-out.

## Rate-limit buckets

Rate limits are identified by arbitrary string keys (`otp:ip`, `otp:email`, `create_transfer:ip`, etc.) and stored in a `rate_limit_events` table in Postgres. The `check_and_record_rate_limit(p_bucket, p_limit, p_window_seconds)` SECURITY DEFINER RPC does the increment-and-check in a single round trip so there is no TOCTOU gap between check and write. Expired rows are purged nightly by a cron job.

## Turnstile

The client mounts a single invisible Turnstile widget in the transfer card and re-uses the token for both the OTP request and the transfer-create call. Tokens are single-use; the widget regenerates one after each consume. With `TURNSTILE_SECRET_KEY` unset (or set to `dev`), verification is skipped so local dev works without Cloudflare keys.
