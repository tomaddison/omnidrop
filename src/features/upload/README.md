# upload

The core feature: pick files, verify the sender via Supabase Auth, push bytes to S3, and finalise the transfer.

## Files

```
upload/
  components/
    transfer-card.tsx                  Top-level state machine (form → otp → uploading → complete)
    transfer-card/                     Compound subcomponents of the form + Zod validation schema
    expiry/
      expiry-popover.tsx               1 / 3 / 7 day expiry picker
  data/mutations/functions/
    create-transfer.ts                 Authenticates the session user, enforces the monthly quota, initiates multipart uploads, returns per-part presigned PUT URLs
    complete-multipart.ts              CompleteMultipartUpload once all parts finish (per file)
    finalize-transfer.ts               Flips transfer to `ready` and dispatches the recipient email
  hooks/
    use-block-unload.ts                Blocks tab-close while an upload is in flight
    use-file-pickers.tsx               Files + folder input refs with a shared change handler
    use-transfer-form.ts               Form state, validation, and derived error anchors
    use-upload.ts                      Upload orchestration: presign → multipart per file → finalise
  s3-client.ts                         XHR PUT per part with progress events (fetch has no upload-progress API)
  utils.ts                             File walking (drag-drop), path validation, size caps
  types.ts                             `UploadEntry`
```

## Flow

1. The transfer card collects files plus the sender email, title/message, and recipient (for email mode).
2. On submit, it calls `loginWithOtp` (from the `authentication` feature), which triggers Supabase Auth's `signInWithOtp`.
3. The OTP input verifies the code via `verifyLoginOtp`. Supabase creates the user (if new) and writes session cookies - the upload form automatically proceeds.
4. `createTransferFn` reads the session user, checks the 20-per-calendar-month quota, calls `CreateMultipartUpload` for each file, and returns a list of per-part presigned PUT URLs (10 MB per part). A 1-byte file is a single-part upload; a 4 GB file is ~410 parts.
5. `s3-client.ts` slices each file into `PART_SIZE` chunks and PUTs them in parallel (3 in flight at a time) via XHR, collecting ETags per part.
6. `completeMultipartFn` calls `CompleteMultipartUpload` with the collected parts, gated by ownership against `sender_user_id`. On failure it best-effort aborts so the incomplete upload doesn't linger.
7. `finalizeTransferFn` sets the transfer status to `ready`, scoped by `sender_user_id`, stamps `expires_at`, and (in email mode) sends the notification email.

## Limits

- 4 GB total per transfer, enforced at two layers: client `MAX_TOTAL_BYTES` and an S3 bucket policy (`s3:content-length` deny). The number comes from `/limits.json` at the repo root - change it there and both the app and Terraform pick it up. Multipart doesn't give us a per-request size pin like presigned POST did, but individual parts are bounded to `PART_SIZE` (10 MB) and the bucket policy still catches oversized single requests.
- 20 transfers per calendar month (UTC) per authenticated user, enforced in `createTransferFn`.
