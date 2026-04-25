#!/bin/bash
# LocalStack readiness hook. Runs inside the container on startup.
# Resource provisioning is handled by Terraform from the host.
echo "=== LocalStack is ready ==="
echo "Run 'npm run backend:up' from the host to provision AWS resources and start Supabase."
