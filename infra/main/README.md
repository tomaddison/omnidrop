# Main stack

The Omnidrop AWS resources: one S3 bucket (with transfer acceleration + CORS) and two IAM users (app + cleanup). Same code runs against LocalStack for local dev and real AWS for prod, parameterised by per-environment tfvars.

## Layout

```
main/
  main.tf, variables.tf, outputs.tf, versions.tf
  modules/
    s3/            S3 bucket + CORS + (optional) acceleration
    iam/           App IAM user (GET, PUT, DELETE, ListBucket, AbortMultipartUpload)
    iam-cleanup/   Cleanup IAM user (ListBucket, DeleteObject)
  envs/
    dev.tfvars     LocalStack target
    prod.tfvars    Real AWS target
  backends/
    production.hcl         S3-backed remote state
    production.local.hcl   Local variant (uses named profile)
```

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- For prod: AWS CLI configured with credentials that can create S3 buckets and IAM users
- For dev: Docker (LocalStack runs via `docker compose up -d`)
- The `bootstrap/` stack must already be applied (creates the state bucket and deploy role) - see [`../bootstrap/README.md`](../bootstrap/README.md).

## Local development (LocalStack)

```sh
# 1. Start LocalStack
docker compose up -d

# 2. Apply Terraform against LocalStack
cd infra/main
terraform init
terraform apply -var-file=envs/dev.tfvars
```

No AWS credentials needed; the dev tfvars sets `localstack_endpoint` and the provider falls back to `test`/`test` keys. Transfer acceleration is disabled for LocalStack.

The default `.env.example` values (`test`/`test` keys, `S3_ENDPOINT=http://localhost:4566`) work with this setup.

## Production (real AWS)

Ongoing production applies are run by the `Deploy` GitHub Action defined in `.github/workflows/deploy.yaml`. The workflow `terraform init`s with `backends/production.hcl` (state in the `omnidrop-tfstate` bucket, native S3 locking via `use_lockfile = true`), passes `allowed_origins` from the `APP_URL` GitHub Actions variable, and pushes the IAM outputs into Vercel and Supabase secrets.

For an emergency manual apply, prefer running the workflow via **Actions → Deploy → Run workflow** rather than applying locally, so the state the CI role sees stays authoritative.

## Teardown

```sh
terraform destroy -var-file=envs/prod.tfvars
```

The S3 bucket has `force_destroy = false`, so destroy will fail with `BucketNotEmpty` if any transfer uploads are still in the bucket. This is intentional, to prevent accidental loss of user data. To actually tear down:

```sh
aws s3 rm s3://omnidrop-transfers --recursive
terraform destroy -var-file=envs/prod.tfvars
```

## Resources created

| Resource  | Name (prod default)     | Purpose                                     |
| --------- | ----------------------- | ------------------------------------------- |
| S3 bucket | `omnidrop-transfers`    | Transfer file uploads, acceleration enabled |
| IAM user  | `omnidrop-app-user`     | Server-side presigning (get, put, delete)   |
| IAM user  | `omnidrop-cleanup-user` | Edge function cleanup (list, delete)        |
