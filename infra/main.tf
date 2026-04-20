locals {
  is_localstack = var.localstack_endpoint != ""
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

  bucket_name         = var.bucket_name
  environment_name    = var.environment_name
  allowed_origins     = var.allowed_origins
  enable_acceleration = !local.is_localstack
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
