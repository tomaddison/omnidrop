# Local Development

The local stack runs against LocalStack (S3) and the Supabase CLI (Postgres + Studio). LocalStack state is ephemeral, so the bucket and CORS config must be re-applied after each container restart.

## Prerequisites

- Docker Desktop running
- Terraform CLI
- Supabase CLI
- Node 20+

## First run

```sh
cp .env.example .env.development       # fill in values
docker compose up -d                   # start LocalStack
bash scripts/localstack-provision.sh   # create the local S3 bucket via Terraform
supabase start                         # start local Postgres + Studio
npm install
npm run dev                            # http://localhost:3000
```

## Environment values

Everything the app needs for local dev, with values that work against LocalStack and the Supabase CLI:

```
VITE_APP_URL=http://localhost:3000
UPLOAD_TOKEN_SECRET=dev-secret-change-in-prod

AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_ENDPOINT=http://localhost:4566

RESEND_API_KEY=dev
```

With `RESEND_API_KEY=dev`, OTPs and transfer-ready emails are printed to the server console instead of sent.

## After a LocalStack restart

LocalStack forgets everything on container restart. Re-provision in one line:

```sh
docker compose up -d && sleep 5 && (cd infra && terraform apply -var-file=envs/dev.tfvars -auto-approve)
```

## After a schema change

```sh
supabase db reset   # recreate the local DB from migrations
npm run types       # regenerate supabase/db.types.ts
```

## Running tests

```sh
npm test            # vitest
npm run check       # biome lint + format check
```
