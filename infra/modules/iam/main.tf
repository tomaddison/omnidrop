resource "aws_iam_user" "app" {
  name = var.iam_username
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

data "aws_iam_policy_document" "s3_access" {
  statement {
    sid       = "ListBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.bucket_name}"]
  }

  statement {
    sid    = "ObjectReadWrite"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = ["arn:aws:s3:::${var.bucket_name}/*"]
  }
}

resource "aws_iam_policy" "app" {
  name   = "${var.iam_username}-s3"
  policy = data.aws_iam_policy_document.s3_access.json
}

resource "aws_iam_user_policy_attachment" "attach" {
  user       = aws_iam_user.app.name
  policy_arn = aws_iam_policy.app.arn
}
