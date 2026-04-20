# Roadmap

Planned work, loosely ordered by priority. Not a commitment.

## Near-term

- Password-protected downloads (schema already has `password_hash`; UI + verify flow missing).
- Resumable uploads for flaky connections. S3 multipart with client-side chunk tracking.
- Per-file progress in addition to the overall progress ring.
- Toast notifications for background cleanup failures (currently silent).

## Medium-term

- Larger-than-2GB transfers. Requires switching from single presigned POST to multipart upload.
- Transfer analytics for the sender: open count, download count, per-file breakdown. New `transfer_events` table keyed by transfer id.
- Custom expiry (arbitrary date/time rather than the 1/3/7 day presets).
- Sender history page. List transfers the current email has sent, gated behind the same OTP flow.

## Nice to have

- Drag-and-drop reordering of files before upload.
- Image/video preview thumbnails on the download page.
- Slack-style share shortcut that copies a formatted message with the link, file count, and expiry.
- Internationalisation. Most strings are in `TransferCard` and email templates today.

## Infrastructure

- Terraform plan review in CI.
- Replace single-region S3 with a CloudFront distribution to cut cold-start latency for global downloads.
- Move the cleanup edge function onto the Supabase queue primitive once it is GA.
