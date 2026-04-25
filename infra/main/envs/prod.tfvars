# `allowed_origins` is supplied at apply time (CI passes it from the
# GitHub Actions `APP_URL` variable; locally pass `-var='allowed_origins=[...]'`).
environment_name     = "production"
app_iam_username     = "omnidrop-app-user"
cleanup_iam_username = "omnidrop-cleanup-user"
