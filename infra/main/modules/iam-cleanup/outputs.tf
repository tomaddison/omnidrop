output "iam_user_name" {
  value = aws_iam_user.cleanup.name
}

output "access_key_id" {
  value     = aws_iam_access_key.cleanup.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.cleanup.secret
  sensitive = true
}
