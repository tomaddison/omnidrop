variable "iam_username" {
  description = "IAM user used by the app server to sign S3 requests"
  type        = string
  default     = "omnidrop-app-user"
}

variable "bucket_name" {
  description = "S3 bucket name this user can access"
  type        = string
}
