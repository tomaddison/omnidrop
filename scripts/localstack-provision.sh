#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$PROJECT_ROOT/infra"

echo "=== Provisioning LocalStack resources with Terraform ==="
cd "$TF_DIR"

terraform init -input=false
terraform apply -var-file=envs/dev.tfvars -auto-approve -input=false

echo ""
echo "=== LocalStack provisioning complete ==="
echo "S3 bucket and IAM resources are ready."
echo ""
echo "Verify with:"
echo "  awslocal s3 ls --endpoint-url http://localhost:4566"
