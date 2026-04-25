variable "bucket_name" {
  description = "Name of the S3 bucket for transfer uploads"
  type        = string
}

variable "environment_name" {
  description = "Environment name (e.g. production, staging)"
  type        = string
}

variable "allowed_origins" {
  description = "Allowed origins for CORS configuration"
  type        = list(string)
}

variable "enable_acceleration" {
  description = "Enable S3 transfer acceleration"
  type        = bool
  default     = true
}

variable "enable_lifecycle_rules" {
  description = "Apply lifecycle rules (disabled for LocalStack; the provider's consistency poll loops forever against it)"
  type        = bool
  default     = true
}

variable "max_transfer_bytes" {
  description = "Reject S3 PutObject requests above this size. Driven by /limits.json so the bucket policy matches the app-level limit."
  type        = number
}

variable "max_part_bytes" {
  description = "Reject any individual S3 PutObject (including UploadPart) above this size. The app uploads in fixed PART_SIZE chunks; this bucket-level cap defends against a client declaring a small file then shipping a multi-GB body to a single presigned part URL."
  type        = number
}
