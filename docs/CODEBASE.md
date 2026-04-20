# Codebase Overview

A tour of how the project is laid out and how a request flows through it.

## Top level

```
src/                 Application code (routes, features, shared UI, email templates)
infra/               Terraform for S3 buckets and IAM users
supabase/            Declarative schema, migrations, edge functions, cron jobs
scripts/             One-shot shell scripts for LocalStack provisioning
public/              Static assets served by Vite
```

## `src/` layout

```
src/
  routes/            TanStack Router file-based routes
  features/          Feature modules (see below)
  lib/               Shared utilities with no feature ownership
  emails/            React Email templates rendered by the server
  components/ui/     Primitives (shadcn + Base UI wrappers)
  router.tsx         Router instantiation
  styles.css         Tailwind entry + design tokens
```

## Feature modules

Each folder under `src/features/` is a self-contained module owning its UI, server functions, utilities, and types. The convention is:

```
features/<name>/
  README.md                            What the feature does
  components/                          React components scoped to the feature
  server/                              Server-only code (queries, external APIs)
  data/mutations/functions/            TanStack Start server functions
  hooks/                               React hooks scoped to the feature
  utils.ts, types.ts                   Shared within the feature
```

Features do not import from each other's internals. If two features need the same code, it moves to `src/lib/` or a new module.

## Request flow: uploading a transfer

1. User picks files in `routes/index.tsx`. The `TransferCard` component in the `upload` feature owns the state machine.
2. On submit, the client calls `requestOtp` (in the `verification` feature) which emails a 6-digit code.
3. Once the code is entered, `verifyOtpFn` returns a short-lived JWT upload token.
4. The client calls `createTransferFn` (in the `upload` feature) with the token. The server inserts rows in Postgres and returns presigned POST URLs for each file.
5. The client uploads each file directly to S3 via `s3-client.ts`.
6. `finalizeTransferFn` flips the transfer to `ready` and, for email mode, dispatches the notification email.
7. Recipient opens `/d/$slug`. `getTransferFn` and `issueDownloadUrlsFn` (in the `download` feature) return signed GET URLs with a 5-minute TTL.

## Security posture

Every user-facing server function is wrapped in `guarded()` from `features/security/server/guard.ts`. The wrapper performs Cloudflare Turnstile verification and per-bucket rate limiting (by IP and/or email) using a Postgres-backed `check_and_record_rate_limit` RPC.

S3 uploads use presigned POST with a `content-length-range` condition so the client cannot exceed the declared size. A bucket policy rejects anything over 2 GiB as a second line of defence.

## Database

The schema lives in `supabase/schemas/` (declarative) and is compiled into migrations under `supabase/migrations/`. Generated types are committed to `supabase/db.types.ts` and regenerated with `npm run types` after a schema change.

Three tables drive the app: `transfers`, `transfer_files`, and `email_verifications`. Rate-limit events live in `rate_limit_events` and are purged nightly.

## Where to add things

- New page: add a file under `src/routes/`.
- New server action: add it under the relevant feature's `data/mutations/functions/` and wrap it in `guarded()`.
- New shared UI primitive: add it to `src/components/ui/` only if it is truly primitive. Otherwise, scope it to the feature.
- New background job: add SQL under `supabase/schemas/cron/` and the runtime code under `supabase/functions/`.
