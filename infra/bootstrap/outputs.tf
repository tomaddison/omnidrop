output "deploy_role_arn" {
  description = "Paste this into the GitHub secret AWS_IAM_ROLE_ARN."
  value       = aws_iam_role.gha_deploy.arn
}

output "tfstate_bucket_name" {
  value = aws_s3_bucket.tfstate.id
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}
