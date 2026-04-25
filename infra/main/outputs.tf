output "bucket_id" {
  value = module.s3.bucket_id
}

output "app_access_key_id" {
  value     = module.iam.access_key_id
  sensitive = true
}

output "app_secret_access_key" {
  value     = module.iam.secret_access_key
  sensitive = true
}

output "cleanup_access_key_id" {
  value     = module.iam_cleanup.access_key_id
  sensitive = true
}

output "cleanup_secret_access_key" {
  value     = module.iam_cleanup.secret_access_key
  sensitive = true
}
