# Omnidrop

A file sharing app built with TanStack Start, Supabase, and AWS S3. Send up to 2 GB to anyone via a share link or direct email, no account required.

## Features

- Drag-and-drop uploads with presigned POST and live progress
- Email verification via 6-digit OTP (no accounts)
- Two sharing modes: shareable link or email delivery
- Configurable expiry (1 / 3 / 7 days)
- Cloudflare Turnstile + per-bucket rate limiting on all mutating endpoints
- Automatic S3 cleanup of expired transfers via a Supabase edge function on an hourly cron

## Stack

| Layer     | Tech                                                  |
| --------- | ----------------------------------------------------- |
| Framework | TanStack Start (React 19, Vite)                       |
| UI        | Base UI + shadcn, Tailwind CSS 4                      |
| Database  | Supabase (Postgres, RLS, declarative schema, pg_cron) |
| Storage   | AWS S3 with transfer acceleration                     |
| Email     | Resend + React Email                                  |
| Infra     | Terraform (S3 + IAM), LocalStack for dev              |
| Hosting   | Vercel                                                |

## Getting started

```sh
cp .env.example .env.development
docker compose up -d
bash scripts/localstack-provision.sh
supabase start
npm install
npm run dev
```

The app runs at `http://localhost:3000`. Full walkthrough in [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md).

## Documentation

- [`docs/CODEBASE.md`](docs/CODEBASE.md) — architecture and request-flow overview
- [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) — local dev setup
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — production deployment runbook
- [`docs/TODO.md`](docs/TODO.md) — roadmap
