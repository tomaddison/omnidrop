# Bootstrap

One-time production setup. After this, every push to `main` deploys via `.github/workflows/deploy.yaml`.

## 0. Prerequisites

```sh
brew install awscli terraform
brew install --cask docker
```

- AWS account with admin credentials available locally (any profile).
- Production domain (DNS need not resolve yet).
- Resend account with a verified sending domain.

Optional: `gh`, `supabase`, `vercel` CLIs.

```sh
export APP_URL=https://omnidrop.example.com
export AWS_REGION=eu-west-2
```

## 1. Create the `omnidrop-admin` IAM user

Only manual AWS step. In the console:

1. IAM → Users → Create user `omnidrop-admin`, no console access.
2. Attach `AdministratorAccess` directly.
3. Security credentials → Create access key (CLI). Copy both values.

```sh
aws configure --profile omnidrop-admin   # paste keys, region eu-west-2, json
export AWS_PROFILE=omnidrop-admin
aws sts get-caller-identity
```

## 2. Bootstrap stack

```sh
cd infra/bootstrap
terraform init
terraform apply              # ~7 resources, all `+ create`
ROLE_ARN=$(terraform output -raw deploy_role_arn)
cd ../..
```

Provisions: tfstate bucket, GitHub OIDC provider, `omnidrop-gha-deploy` role.

## 3. Supabase

1. Create a project at https://supabase.com/dashboard near `$AWS_REGION`. Record the **project ref** and **DB password**.
2. **Project Settings → API**: copy project URL, **publishable key** (`sb_publishable_...`), **secret key** (`sb_secret_...`).
3. **Database → Extensions** → enable `pg_cron`.
4. **Authentication → URL Configuration** → Site URL = `$APP_URL`.
5. **Authentication → Email Templates → Magic Link** → paste rendered OTP HTML:
   ```sh
   VITE_APP_URL=$APP_URL npx tsx scripts/render-otp-email.ts > /tmp/otp.html
   ```
6. Avatar → **Account preferences → Access tokens** → generate `omnidrop-deploy` (this is `SUPABASE_ACCESS_TOKEN`, not the project secret key).

Migrations and Vault entries are applied by CI on first deploy. After step 7, verify:

```sql
SELECT jobname, schedule FROM cron.job;
-- cleanup-expired-transfers | 0 * * * *
```

## 4. Resend

1. **Domains → Add Domain** with a `send.` subdomain (e.g. `send.omnidrop.example.com`), region **Ireland**.
2. Add the DKIM/SPF/MX records at your registrar. Wait for **Verified**.
3. **API Keys → Create** with **Sending access**, scoped to the domain. Save `re_...`.

Sender becomes `no-reply@send.<your-domain>`.

## 5. Cloudflare Turnstile

1. **Cloudflare dashboard → Turnstile → Add site**: domain `omnidrop.example.com`, mode **Invisible**.
2. Capture the **Site Key** (`0x4AAAAA...`) and **Secret Key**.
3. **Supabase dashboard → Authentication → Settings → Attack Protection → Captcha**: enable, provider **Turnstile**, paste the **Secret Key**. (Supabase verifies tokens; the secret never goes to Vercel or CI.)

Site key goes into GitHub variables in the next section as `TURNSTILE_SITE_KEY` and is pushed to Vercel as `VITE_TURNSTILE_SITE_KEY` automatically.

## 6. Vercel

1. **Add New → Project**, import `example-org/omnidrop`, accept defaults.
2. **Project → Settings → Git → Disconnect** (CI is the only deploy path).
3. Capture: **Project ID** (`prj_...`), **Team ID**, **personal token** from https://vercel.com/account/tokens.
4. **Project → Settings → Domains** → add `omnidrop.example.com`, follow the registrar prompts until **Valid Configuration**.

Don't set env vars in the dashboard - the workflow owns them.

## 7. GitHub secrets and variables

**Settings → Secrets and variables → Actions.**

### Secrets

| Name                    | Value                               |
| ----------------------- | ----------------------------------- |
| `AWS_IAM_ROLE_ARN`      | `$ROLE_ARN` from step 2             |
| `SUPABASE_ACCESS_TOKEN` | Personal access token (step 3)      |
| `SUPABASE_DB_PASSWORD`  | DB password (step 3)                |
| `SUPABASE_PROJECT_REF`  | `<your-project-ref>`                |
| `SUPABASE_URL`          | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY`     | `sb_publishable_...`                |
| `SUPABASE_SECRET_KEY`   | `sb_secret_...`                     |
| `RESEND_API_KEY`        | `re_...`                            |
| `VERCEL_TOKEN`          | https://vercel.com/account/tokens   |
| `VERCEL_ORG_ID`         | Vercel Team ID                      |
| `VERCEL_PROJECT_ID`     | `prj_...`                           |

### Variables

| Name                 | Value                         |
| -------------------- | ----------------------------- |
| `APP_URL`            | `$APP_URL`                    |
| `AWS_REGION`         | `eu-west-2`                   |
| `FROM_EMAIL`         | `no-reply@send.<your-domain>` |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

With `gh`:

```sh
gh secret set AWS_IAM_ROLE_ARN --body "$ROLE_ARN"
# ...repeat for each secret
gh variable set APP_URL --body "$APP_URL"
gh variable set AWS_REGION --body "$AWS_REGION"
gh variable set FROM_EMAIL --body "no-reply@send.<your-domain>"
gh variable set TURNSTILE_SITE_KEY --body "0x4AAAAA..."
```

Optional: **Settings → Environments → `production`** with a required reviewer. The OIDC trust policy already accepts only that environment or `main`.

## 8. First deploy

Merge to `main` or run **Actions → Deploy → Run workflow**. The first run does the inaugural `terraform apply` of `infra/main/`.

## 9. Smoke test

End-to-end: pick file → request OTP → verify → share link → incognito download.

```sql
SELECT public.call_edge_function('cleanup-s3');
```

```sh
aws s3 ls s3://omnidrop-transfers/ --profile omnidrop-admin
```

## 9. SEO (later)

Submit `$APP_URL/sitemap.xml` to Google Search Console and Bing. For meta-tag verification, add `<meta name="google-site-verification">` to `head()` in `src/routes/__root.tsx`.

---

## Teardown

```sh
aws s3 rm s3://omnidrop-transfers --recursive --profile omnidrop-admin
cd infra/main
terraform init -backend-config=backends/production.local.hcl
terraform destroy -var-file=envs/prod.tfvars -var='allowed_origins=["'"$APP_URL"'"]'
```

Bootstrap stack is left intact; see `infra/bootstrap/README.md` to remove it (state bucket has `prevent_destroy`). Delete the `omnidrop-admin` user, Supabase project, Vercel project, and Resend key by hand.
