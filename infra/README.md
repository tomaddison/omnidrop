# Infrastructure

Two Terraform stacks split by lifecycle.

```
infra/
  bootstrap/   One-shot: tfstate bucket, GitHub OIDC provider, deploy role
  main/        Ongoing: S3 bucket + app/cleanup IAM users
```

## When to run which

- **`bootstrap/`** - first-time setup, or when the deploy role's permissions need widening (e.g. you added a new resource type to `main/`). Local state, run by hand from a machine with admin AWS credentials. See [`bootstrap/README.md`](./bootstrap/README.md) and [`../docs/BOOTSTRAP.md`](../docs/BOOTSTRAP.md).
- **`main/`** - every push to `main` triggers `terraform apply` via the `Deploy` GitHub Action. Remote state in S3 (`omnidrop-tfstate`). Also the stack to run locally against LocalStack for dev. See [`main/README.md`](./main/README.md).

The `bootstrap/` stack creates the state bucket and the role that `main/` runs as, so it has to exist before `main/` can apply.
