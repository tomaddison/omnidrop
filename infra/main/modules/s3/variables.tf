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

