# Infrastructure

Single Terraform config for the Omnidrop AWS resources: one S3 bucket (with transfer acceleration + CORS) and two IAM users (app + cleanup). The same code runs against LocalStack for local development and against real AWS for production, parameterised by per-environment tfvars.

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- For prod: AWS CLI configured with credentials that can create S3 buckets and IAM users
- For dev: Docker (LocalStack runs via `docker compose up -d`)

## Layout

```
infra/
  main.tf, variables.tf, outputs.tf, versions.tf
  modules/
    s3/            S3 bucket + CORS + (optional) acceleration
    iam/           App IAM user (GET, PUT, ListBucket)
    iam-cleanup/   Cleanup IAM user (ListBucket, DeleteObject)
  envs/
    dev.tfvars     LocalStack target
    prod.tfvars    Real AWS target
  backends/
    production.hcl         S3-backed remote state
    production.local.hcl   Local variant (uses named profile)
```

## Local development (LocalStack)

```sh
# 1. Start LocalStack
docker compose up -d

# 2. Apply Terraform against LocalStack
cd infra
terraform init
terraform apply -var-file=envs/dev.tfvars
```

No AWS credentials needed; the dev tfvars sets `localstack_endpoint` and the provider falls back to `test`/`test` keys. Transfer acceleration is disabled for LocalStack.

The default `.env.example` values (`test`/`test` keys, `S3_ENDPOINT=http://localhost:4566`) work with this setup.

## Production (real AWS)

1. Review `envs/prod.tfvars` and update `allowed_origins`, `bucket_name`, `aws_region` as needed.
2. Initialise with the production backend. Use `production.local.hcl` from a laptop (it sets a named profile); use `production.hcl` in CI where credentials come from env vars or an instance role.

   ```sh
   cd infra
   terraform init -backend-config=backends/production.local.hcl
   terraform plan -var-file=envs/prod.tfvars -out=prod.tfplan
   ```

3. Read the plan carefully before applying. On a fresh deploy against an empty state every line should be `+ create`. If you see any `- destroy` or unexpected resource, stop and investigate.

4. Apply the saved plan and pull the IAM keys:

   ```sh
   terraform apply prod.tfplan

   terraform output -raw app_access_key_id
   terraform output -raw app_secret_access_key
   terraform output -raw cleanup_access_key_id
   terraform output -raw cleanup_secret_access_key
   ```

5. Paste the four outputs into `env.production` and into the Supabase edge function secrets. Delete `prod.tfplan` afterwards.

## Teardown

```sh
terraform destroy -var-file=envs/prod.tfvars
```

The S3 bucket has `force_destroy = false`, so destroy will fail with `BucketNotEmpty` if any transfer uploads are still in the bucket. This is intentional, to prevent accidental loss of user data. To actually tear down:

```sh
aws s3 rm s3://ht-transfers --recursive
terraform destroy -var-file=envs/prod.tfvars
```

## Resources created

| Resource  | Name (prod default) | Purpose                                     |
| --------- | ------------------- | ------------------------------------------- |
| S3 bucket | `ht-transfers`      | Transfer file uploads, acceleration enabled |
| IAM user  | `ht-app-user`       | Server-side presigning (get, put)           |
| IAM user  | `ht-cleanup-user`   | Edge function cleanup (list, delete)        |
