variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "github_repo" {
  description = "GitHub repository slug, e.g. 'example/omnidrop'. Used to scope the OIDC trust policy."
  type        = string
}

variable "tfstate_bucket_name" {
  type    = string
  default = "omnidrop-tfstate"
}

variable "deploy_role_name" {
  type    = string
  default = "omnidrop-gha-deploy"
}

variable "app_bucket_name" {
  type    = string
  default = "omnidrop-transfers"
}

variable "iam_user_name_prefix" {
  description = "Prefix for IAM users/policies the deploy role is allowed to manage."
  type        = string
  default     = "omnidrop-"
}
