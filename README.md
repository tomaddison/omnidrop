# Omnidrop

## Send anything. Fast.

Omnidrop is a web application for sending large files. Sign in with a 6-digit code and send up to 4 GB per transfer via a shareable link or direct email.

## Features

- Drag-and-drop uploads with presigned POST and live progress
- Sign-in via Supabase Auth (email OTP - first verification creates the account)
- 20 transfers per calendar month per signed-in user
- Two sharing modes: shareable link or email delivery
- Configurable expiry (1 / 3 / 7 days)
- Automatic S3 cleanup of expired transfers via a Supabase edge function on an hourly cron

## Stack

| Layer     | Tech                                                                   |
| --------- | ---------------------------------------------------------------------- |
| Framework | TanStack Start (React 19, Vite)                                        |
| UI        | Base UI + shadcn, Tailwind CSS 4                                       |
| Auth      | Supabase Auth (OTP via `signInWithOtp` / `verifyOtp`, `@supabase/ssr`) |
| Database  | Supabase (Postgres, RLS, declarative schema, pg_cron)                  |
| Storage   | AWS S3 with transfer acceleration                                      |
| Email     | Resend + React Email (notification) + Supabase Auth (sign-in OTP)      |
| Infra     | Terraform (S3 + IAM), LocalStack for dev                               |
| Hosting   | Vercel                                                                 |

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

- [`docs/CODEBASE.md`](docs/CODEBASE.md) - architecture, request flow, and the transfer size limit
- [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) - local dev setup
- [`docs/BOOTSTRAP.md`](docs/BOOTSTRAP.md) - first-time production setup (run once)
- [`docs/TODO.md`](docs/TODO.md) - roadmap
