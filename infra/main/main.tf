locals {
  is_localstack = var.localstack_endpoint != ""

  # Single source of truth for the transfer size cap. Also read by
  # src/features/upload/utils.ts so client + server + bucket policy agree.
  limits             = jsondecode(file("${path.root}/../../limits.json"))
  max_transfer_bytes = local.limits.maxTransferGb * 1024 * 1024 * 1024
  # Must match PART_SIZE in src/features/upload/utils.ts (10 MiB).
  max_part_bytes = 10 * 1024 * 1024
}

provider "aws" {
  region = var.aws_region

  access_key                  = local.is_localstack ? "test" : null
  secret_key                  = local.is_localstack ? "test" : null
  skip_credentials_validation = local.is_localstack
  skip_metadata_api_check     = local.is_localstack
  skip_requesting_account_id  = local.is_localstack
  s3_use_path_style           = local.is_localstack

  dynamic "endpoints" {
    for_each = local.is_localstack ? [1] : []
    content {
      s3  = var.localstack_endpoint
      iam = var.localstack_endpoint
      sts = var.localstack_endpoint
    }
  }
}

module "s3" {
  source = "./modules/s3"

  bucket_name            = var.bucket_name
  environment_name       = var.environment_name
  allowed_origins        = var.allowed_origins
  enable_acceleration    = !local.is_localstack
  enable_lifecycle_rules = !local.is_localstack
  max_transfer_bytes     = local.max_transfer_bytes
  max_part_bytes         = local.max_part_bytes
}

module "iam" {
  source = "./modules/iam"

  iam_username = var.app_iam_username
  bucket_name  = module.s3.bucket_id
}

module "iam_cleanup" {
  source = "./modules/iam-cleanup"

  iam_username = var.cleanup_iam_username
  bucket_name  = module.s3.bucket_id
}
