# Local Development

LocalStack (S3) + Supabase CLI (Postgres + Auth + Studio + Inbucket). Nothing here touches production - see `bootstrap.md`.

## Prerequisites

- Docker Desktop
- Terraform 1.10+
- Supabase CLI 2.67.1 (matches CI)
- Node 20+

## First run

```sh
cp .env.example .env.development   # fill values from the table below
npm install
npm run backend:up                 # LocalStack + Terraform + Supabase
npm run dev                        # http://localhost:3000
```

`backend:up` is idempotent. It runs `docker compose up -d --wait`, then `scripts/localstack-provision.sh`, then `supabase start`.

Tear down: `npm run backend:down`. For a clean slate (drops the LocalStack volume): `docker compose down -v`.

Services:

- Studio: <http://127.0.0.1:54323>
- Inbucket (Supabase Auth OTPs): <http://127.0.0.1:54324>
- Mailpit (transfer-ready, if SMTP-routed): <http://localhost:8025>
- LocalStack edge: <http://localhost:4566>

## Environment

```
VITE_APP_URL=http://localhost:3000

VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<anon key from `supabase status`>
SUPABASE_SECRET_KEY=<service_role key from `supabase status`>

AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=eu-west-2
S3_BUCKET=omnidrop-transfers
S3_ENDPOINT=http://localhost:4566   # LocalStack only - never set in prod

RESEND_API_KEY=dev                  # `dev` prints emails to stdout
FROM_EMAIL=dev@localhost
```

## Schema changes

```sh
supabase db reset
npm run types
```

## Tests & lint

```sh
npm test
npm run check
```

Both gate CI.

## Emails

```sh
npm run email                       # http://localhost:3001
```

Re-render the OTP template (paste into Supabase dashboard manually - no CLI path):

```sh
VITE_APP_URL=http://localhost:3000 npx tsx scripts/render-otp-email.ts > otp.html
```
