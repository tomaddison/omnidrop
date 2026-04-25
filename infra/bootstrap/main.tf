terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# --- Terraform state bucket ----------------------------------------------------

resource "aws_s3_bucket" "tfstate" {
  bucket        = var.tfstate_bucket_name
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Purpose = "Terraform state"
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- GitHub OIDC provider ------------------------------------------------------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# --- GitHub Actions deploy role -----------------------------------------------

data "aws_iam_policy_document" "gha_deploy_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:ref:refs/heads/main",
        "repo:${var.github_repo}:environment:production",
      ]
    }
  }
}

resource "aws_iam_role" "gha_deploy" {
  name                 = var.deploy_role_name
  assume_role_policy   = data.aws_iam_policy_document.gha_deploy_trust.json
  description          = "Assumed by GitHub Actions via OIDC to run the main infra/ Terraform apply"
  max_session_duration = 3600
}

data "aws_iam_policy_document" "gha_deploy" {
  statement {
    sid       = "TerraformState"
    effect    = "Allow"
    actions   = ["s3:ListBucket", "s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = [aws_s3_bucket.tfstate.arn, "${aws_s3_bucket.tfstate.arn}/*"]
  }

  # Bucket-level access only. Resource is the bucket ARN with no /* — object
  # actions (s3:GetObject, s3:PutObject, s3:DeleteObject) silently don't match,
  # so wildcards here grant full bucket-config management without object access.
  statement {
    sid    = "AppBucket"
    effect = "Allow"
    actions = [
      "s3:Get*", "s3:List*", "s3:Put*", "s3:CreateBucket", "s3:DeleteBucket*",
    ]
    resources = ["arn:aws:s3:::${var.app_bucket_name}"]
  }

  statement {
    sid    = "IamUsers"
    effect = "Allow"
    actions = [
      "iam:GetUser", "iam:CreateUser", "iam:DeleteUser", "iam:TagUser", "iam:UntagUser",
      "iam:ListAccessKeys", "iam:CreateAccessKey", "iam:DeleteAccessKey",
      "iam:GetUserPolicy", "iam:PutUserPolicy", "iam:DeleteUserPolicy",
      "iam:ListUserPolicies", "iam:ListAttachedUserPolicies",
      "iam:GetPolicy", "iam:CreatePolicy", "iam:DeletePolicy",
      "iam:GetPolicyVersion", "iam:CreatePolicyVersion", "iam:DeletePolicyVersion", "iam:ListPolicyVersions",
      "iam:AttachUserPolicy", "iam:DetachUserPolicy",
    ]
    resources = [
      "arn:aws:iam::*:user/${var.iam_user_name_prefix}*",
      "arn:aws:iam::*:policy/${var.iam_user_name_prefix}*",
    ]
  }
}

resource "aws_iam_role_policy" "gha_deploy" {
  name   = "${var.deploy_role_name}-inline"
  role   = aws_iam_role.gha_deploy.id
  policy = data.aws_iam_policy_document.gha_deploy.json
}
