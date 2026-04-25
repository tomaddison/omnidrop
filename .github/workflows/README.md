# Deployment

Production deploys are fully automated. Every push to `main` (or manual run of the `Deploy` workflow) triggers `.github/workflows/deploy.yaml`, which:

1. Runs `npm run check` and `npm test` (gating job).
2. Applies Supabase migrations against the production project.
3. Assumes the Omnidrop deploy IAM role via OIDC and runs `terraform apply` against the S3 + IAM infra.
4. Sets the `cleanup-s3` edge function's AWS secrets from fresh Terraform outputs and redeploys it.
5. Syncs every production env var into Vercel (Supabase keys, AWS credentials from Terraform, Resend, `VITE_APP_URL`, `VITE_TURNSTILE_SITE_KEY`, `FROM_EMAIL`, `AWS_REGION`, `S3_BUCKET`).
6. Runs `vercel deploy --prod`.

This doc is the operational reference. **For the first-time setup of a fresh environment, work through [`docs/bootstrap.md`](../../docs/bootstrap.md) instead** - it's the runbook.

## Workflow triggers

- `push` to `main`
- Manual: **Actions → Deploy → Run workflow** (or `gh workflow run Deploy`)

Concurrency is serialised on the `deploy-prod` group with `cancel-in-progress: false`, so two merges in quick succession queue cleanly and a mid-flight apply is never cancelled.

## Order of operations, and why

```
test ─▶ deploy
          ├─ supabase db push           (1)
          ├─ terraform apply            (2)
          ├─ supabase secrets set       (3)
          ├─ supabase functions deploy  (4)
          ├─ vercel env sync            (5)
          └─ vercel deploy --prod       (6)
```

- **Migrations first (1)**: schema must exist before app code runs against it. If migrations fail, Terraform never runs - we don't rotate IAM keys for nothing.
- **Terraform before edge (2 → 3, 4)**: the cleanup edge function needs the cleanup IAM user's keys and the bucket name, both Terraform outputs.
- **Vercel env sync before deploy (5 → 6)**: the new build inherits whatever env vars are current when Vercel pulls.

## GitHub secrets and variables

The workflow reads these. Populate them as part of [`docs/bootstrap.md`](../../docs/bootstrap.md) §6.

### Secrets

| Name                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `AWS_IAM_ROLE_ARN`      | ARN of the `omnidrop-gha-deploy` role                  |
| `SUPABASE_ACCESS_TOKEN` | CLI auth for `supabase link` / `db push` / `functions` |
| `SUPABASE_DB_PASSWORD`  | Used by `supabase link`                                |
| `SUPABASE_PROJECT_REF`  | e.g. `xdbkjsphdcijovklecnh`                            |
| `SUPABASE_URL`          | Pushed to Vercel as `VITE_SUPABASE_URL`                |
| `SUPABASE_ANON_KEY`     | Pushed to Vercel as `VITE_SUPABASE_ANON_KEY`           |
| `SUPABASE_SECRET_KEY`   | Pushed to Vercel as `SUPABASE_SECRET_KEY`              |
| `RESEND_API_KEY`        | Pushed to Vercel                                       |
| `VERCEL_TOKEN`          | Auth for `vercel` CLI                                  |
| `VERCEL_ORG_ID`         | Required by `vercel deploy` in CI                      |
| `VERCEL_PROJECT_ID`     | Required by `vercel deploy` in CI                      |

### Variables

| Name                 | Used by                                               |
| -------------------- | ----------------------------------------------------- |
| `APP_URL`            | Terraform `allowed_origins`, Vercel `VITE_APP_URL`    |
| `AWS_REGION`         | `configure-aws-credentials`, Vercel, Supabase secrets |
| `FROM_EMAIL`         | Vercel                                                |
| `TURNSTILE_SITE_KEY` | Vercel `VITE_TURNSTILE_SITE_KEY`                      |

## What the workflow does not do

A few things can't be automated and sit in [`docs/bootstrap.md`](../../docs/bootstrap.md):

- **First `terraform apply`** - CI can't bootstrap a state file that doesn't exist.
- **Supabase dashboard settings** - `pg_cron` enable, Site URL, OTP email template, **Turnstile captcha secret** (Authentication → Settings → Attack Protection). The CLI has no coverage for these.
- **Postgres cron secrets** - populated automatically into Supabase Vault via `config.toml`'s `[db.vault]` block during `supabase db push` (CI exports `SUPABASE_URL` and `SUPABASE_SECRET_KEY` first). Read by `private.get_secret(...)` from `public.call_edge_function`.
- **DNS / domain attach** - done in Vercel and at your registrar.
- **SEO submission** - Google Search Console / Bing Webmaster Tools.

## Changing production config

| Change             | How                                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production domain  | Update the `APP_URL` GitHub Actions variable, merge any commit. Terraform will update S3 CORS; Vercel will get the new `VITE_APP_URL`.                                                                                                                     |
| AWS region         | Update the `AWS_REGION` variable. **Moving region mid-prod is destructive** (new bucket, keys rotate).                                                                                                                                                     |
| New Vercel env var | Add it to the `Sync Vercel production env vars` step in `.github/workflows/deploy.yaml` and push the corresponding secret or variable in GitHub.                                                                                                           |
| Rotate Secret key  | Update the `SUPABASE_SECRET_KEY` GitHub secret and re-run the `Deploy` workflow. `supabase db push` will refresh the `service_role_key` entry in `vault.decrypted_secrets` from the new env var, and the cron job picks up the new value on its next tick. |
| Transfer size cap  | Edit `/limits.json` and merge. The build rebuilds and Terraform updates the `DenyLargeUploads` bucket policy. The per-part cap (`DenyOversizedPart`) is `local.max_part_bytes` in `infra/main/main.tf`; bump it there if you change `PART_SIZE`.                |

## Debugging a failed run

- **`test` job fails** → fix lint / format / test locally, push.
- **`supabase db push` fails** → check migrations against production by running `supabase db diff --linked` locally. There may be drift from someone editing the schema in the dashboard.
- **`terraform apply` fails on IAM** → the `omnidrop-gha-deploy` policy is probably under-scoped. Widen the permissions in `infra/bootstrap/main.tf` (the `gha_deploy` policy document) and re-apply from `infra/bootstrap/`.
- **`terraform apply` reports a destroy-and-recreate on the S3 bucket** → something (a variable override, a module change) wants a new bucket. Stop. Back out the change; buckets with data can't be recreated without losing it.
- **`vercel env add` errors** → run `vercel env ls` locally against the same project to see current state. The workflow removes-then-adds, so a half-run may leave a variable missing - re-run the workflow to resolve.
- **`vercel deploy --prod` builds but app 500s** → look at the Vercel runtime logs for missing env vars. The sync step is idempotent - re-run the workflow to re-push values.

## Smoke test

Any time prod changes materially:

1. Upload a small file at `$APP_URL`. Complete the OTP flow end-to-end.
2. Open the share link in an incognito window. Confirm download works.
3. Manually trigger cleanup and confirm the S3 object is deleted:

   ```sql
   SELECT public.call_edge_function('cleanup-s3');
   ```

   ```sh
   aws s3 ls s3://omnidrop-transfers/ --profile omnidrop-admin
   ```
