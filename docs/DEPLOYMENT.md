# Deployment

End-to-end production setup across AWS, Supabase, Resend, and Vercel.

## Prerequisites

```sh
brew install awscli terraform supabase/tap/supabase vercel-cli
brew install --cask docker
```

Node 20+ and `openssl` also need to be on your `PATH`.

## 1. AWS / S3

Create an IAM user with S3 + IAM access, then configure a named profile:

```sh
aws configure --profile hm-production-admin
export AWS_PROFILE=hm-production-admin
export AWS_REGION=eu-west-2
```

Create the Terraform state bucket (Terraform cannot create its own state bucket):

```sh
aws s3api create-bucket --bucket hm-tfstate --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-bucket-versioning --bucket hm-tfstate \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket hm-tfstate \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

Edit `infra/envs/prod.tfvars` with a globally unique bucket name and the real origin domain, then apply:

```sh
cd infra
terraform init -backend-config=backends/production.hcl
terraform apply -var-file=envs/prod.tfvars
```

Pull the access keys out of Terraform output and save them. The **app** user keys go in `.env.production` (used by the server for presigning). The **cleanup** user keys go in the Supabase edge function secrets later.

```sh
terraform output -raw app_access_key_id
terraform output -raw app_secret_access_key
terraform output -raw cleanup_access_key_id
terraform output -raw cleanup_secret_access_key
```

## 2. Supabase

Create a project at https://supabase.com. From **Project Settings → API**, copy:

- Project URL → `VITE_SUPABASE_URL`
- `anon` public key → `VITE_SUPABASE_KEY`
- `service_role` secret key → `SUPABASE_SECRET_KEY` (server-only)

Link the CLI and push the schema:

```sh
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Enable the `pg_cron` extension under **Database → Extensions** (local dev gets it automatically).

## 3. Resend

Create an account, verify your sending domain by adding the SPF/DKIM/DMARC records at your DNS provider, then create an API key under **API Keys → Create API Key**.

```
RESEND_API_KEY=re_...
FROM_EMAIL=no-reply@example.com
```

For local dev, set `RESEND_API_KEY=dev` to log OTPs to the server console instead of sending real emails.

## 4. Cloudflare Turnstile

Register the production domain under **Turnstile → Add site** (include `localhost` for dev). Pick the **Managed** widget type and copy the keys:

```
VITE_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

Leaving both unset in dev bypasses verification.

## 5. App secrets

Generate the upload-token signing secret:

```sh
openssl rand -base64 32
```

```
UPLOAD_TOKEN_SECRET=<generated>
VITE_APP_URL=https://transfer.example.com
```

## 6. Cleanup edge function

The hourly cleanup job deletes S3 objects for expired transfers. Set the function secrets using the **cleanup** IAM keys from step 1:

```sh
supabase secrets set \
  AWS_ACCESS_KEY_ID=<cleanup_key_id> \
  AWS_SECRET_ACCESS_KEY=<cleanup_secret> \
  AWS_REGION=eu-west-2 \
  S3_BUCKET=<your-bucket> \
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

supabase functions deploy cleanup-s3
```

The cron job calls it via `public.call_edge_function`, which reads two Postgres settings. Set them once:

```sql
ALTER DATABASE postgres SET app.supabase_url     = 'https://<project-ref>.supabase.co';
ALTER DATABASE postgres SET app.service_role_key = '<service-role-key>';
```

Verify the schedule:

```sql
SELECT jobname, schedule FROM cron.job;
-- cleanup-expired-transfers | 0 * * * *
```

## 7. Vercel

```sh
vercel login
vercel link
```

Upload the full `.env.production` to **Settings → Environment Variables → Import .env**, or set each variable individually. Do **not** set `S3_ENDPOINT` in production (it is only for LocalStack).

```sh
vercel --prod
```

Point the custom domain at the deployment under **Settings → Domains**.

## Smoke test

On the live site: upload a few files, complete the OTP flow, open the link in an incognito window, confirm downloads work, then trigger cleanup manually and confirm the S3 objects are gone.

```sql
SELECT public.call_edge_function('cleanup-s3');
```
