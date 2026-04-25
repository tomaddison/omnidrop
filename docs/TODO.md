# Roadmap

## Near-term

- Optional download passwords.
- Resumable uploads.

## Medium-term

- Larger-than-4GB transfers.
- Transfer analytics for the sender: open count, download count, per-file breakdown.
- Custom expiry (arbitrary date/time rather than the 1/3/7 day presets).
- Sender history page at `/history` listing the signed-in user's transfers with status, file count, and remaining TTL.

## Nice to have

- Slack-style share shortcut that copies a formatted message with the link, file count, and expiry.
- Internationalisation. Most strings are in `TransferCard` and email templates today.

## Infrastructure

- Terraform plan review in CI.
- Replace single-region S3 with a CloudFront distribution to cut cold-start latency for global downloads.
