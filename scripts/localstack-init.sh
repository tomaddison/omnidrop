#!/bin/bash
# LocalStack readiness hook. Runs inside the container on startup.
# Resource provisioning is handled by Terraform from the host.
echo "=== LocalStack is ready ==="
echo "Run 'npm run localstack:provision' from the host to create AWS resources."
