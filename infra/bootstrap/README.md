# Bootstrap

One-shot Terraform stack that provisions the AWS resources the main `infra/main/` stack and the `Deploy` GitHub Actions workflow assume already exist:

- The Terraform state bucket (`omnidrop-tfstate`) - encrypted, versioned, public access blocked, `prevent_destroy`.
- The GitHub Actions OIDC provider in this AWS account.
- `omnidrop-gha-deploy` - the IAM role GitHub Actions assumes via OIDC, scoped to this repo, the `main` branch, and the `production` environment. Inline policy is the minimum needed to manage state and the resources `infra/main/` creates.

The human admin IAM user (`omnidrop-admin`) is created manually in the AWS console and lives outside this stack - see `docs/bootstrap.md`.

This stack uses **local Terraform state** (it cannot store its state in the bucket it creates). The state file is gitignored.

## Run it

```sh
export AWS_PROFILE=omnidrop-admin
cd infra/bootstrap
terraform init
terraform apply
```

Capture the output that goes into the GitHub secret:

```sh
terraform output -raw deploy_role_arn   # → GitHub secret AWS_IAM_ROLE_ARN
```

See `docs/bootstrap.md` for the full deploy flow.

## Re-run / update

Re-run from the same machine that holds the local state file. The deploy role's permissions live here, so widening them (e.g. when adding a new resource type to `infra/main/`) means a `terraform apply` here, not in CI.

## Teardown

`prevent_destroy = true` on the state bucket guards against accidental loss. To actually destroy:

1. Empty `omnidrop-tfstate` (`aws s3 rm s3://omnidrop-tfstate --recursive`) - irreversible, kills your main-infra state history.
2. Remove the `lifecycle { prevent_destroy = true }` block from `aws_s3_bucket.tfstate`.
3. `terraform destroy`.
