output "iam_user_name" {
  value = aws_iam_user.app.name
}

output "access_key_id" {
  value     = aws_iam_access_key.app.id
  sensitive = true
}

output "secret_access_key" {
  value     = aws_iam_access_key.app.secret
  sensitive = true
}
