variable "iam_username" {
  description = "IAM user used by the cleanup edge function to delete S3 objects"
  type        = string
  default     = "ht-cleanup-user"
}

variable "bucket_name" {
  description = "S3 bucket name this user can delete from"
  type        = string
}
