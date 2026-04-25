resource "aws_s3_bucket" "transfers" {
  bucket              = var.bucket_name
  force_destroy       = false
  object_lock_enabled = false

  tags = {
    Environment = var.environment_name
    Purpose     = "Transfer file uploads"
  }
}

resource "aws_s3_bucket_accelerate_configuration" "transfers" {
  count  = var.enable_acceleration ? 1 : 0
  bucket = aws_s3_bucket.transfers.id
  status = "Enabled"
}

resource "aws_s3_bucket_public_access_block" "transfers" {
  bucket = aws_s3_bucket.transfers.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "transfers" {
  bucket = aws_s3_bucket.transfers.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "transfers" {
  count  = var.enable_lifecycle_rules ? 1 : 0
  bucket = aws_s3_bucket.transfers.id

  rule {
    id     = "abort-incomplete-multipart"
    status = "Enabled"

    filter {}

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "transfers" {
  bucket = aws_s3_bucket.transfers.id

  cors_rule {
    # Explicit whitelist - `*` previously allowed arbitrary custom headers on cross-origin PUTs.
    allowed_headers = [
      "content-type",
      "content-length",
      "content-md5",
      "x-amz-content-sha256",
      "x-amz-date",
      "x-amz-security-token",
      "x-amz-user-agent",
      "x-amz-acl",
      "x-amz-meta-*",
    ]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag", "x-amz-id-2", "x-amz-request-id"]
    max_age_seconds = 3000
  }
}
