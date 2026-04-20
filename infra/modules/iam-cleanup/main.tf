resource "aws_iam_user" "cleanup" {
  name = var.iam_username
}

resource "aws_iam_access_key" "cleanup" {
  user = aws_iam_user.cleanup.name
}

data "aws_iam_policy_document" "s3_cleanup" {
  statement {
    sid       = "ListBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.bucket_name}"]
  }

  statement {
    sid       = "DeleteObjects"
    effect    = "Allow"
    actions   = ["s3:DeleteObject"]
    resources = ["arn:aws:s3:::${var.bucket_name}/*"]
  }
}

resource "aws_iam_policy" "cleanup" {
  name   = "${var.iam_username}-s3"
  policy = data.aws_iam_policy_document.s3_cleanup.json
}

resource "aws_iam_user_policy_attachment" "attach" {
  user       = aws_iam_user.cleanup.name
  policy_arn = aws_iam_policy.cleanup.arn
}
