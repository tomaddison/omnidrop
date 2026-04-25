variable "aws_region" {
  description = "AWS region for S3 and IAM resources"
  type        = string
  default     = "eu-west-2"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for transfer uploads"
  type        = string
  default     = "omnidrop-transfers"
}

variable "environment_name" {
  description = "Environment name (tag/suffix)"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed origins for S3 CORS (e.g. app domain)"
  type        = list(string)
}

variable "app_iam_username" {
  description = "IAM username for the app (server-side presigning)"
  type        = string
  default     = "omnidrop-app-user"
}

variable "cleanup_iam_username" {
  description = "IAM username for the cleanup edge function"
  type        = string
  default     = "omnidrop-cleanup-user"
}

variable "localstack_endpoint" {
  description = "LocalStack endpoint URL. Set (e.g. http://localhost:4566) to target LocalStack; leave empty for real AWS."
  type        = string
  default     = ""
}
