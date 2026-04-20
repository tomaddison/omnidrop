# upload

The core feature: pick files, verify the sender's email, push bytes to S3, and finalise the transfer.

## Files

```
upload/
  components/
    transfer-card.tsx                  Top-level state machine (form → otp → uploading → complete)
    transfer-card/                     Compound subcomponents of the form + Zod validation schema
    expiry/
      expiry-popover.tsx               1 / 3 / 7 day expiry picker
  data/mutations/functions/
    create-transfer.ts                 Issues presigned POST URLs after validating the upload token
    finalize-transfer.ts               Flips transfer to `ready` and dispatches the recipient email
  hooks/
    use-block-unload.ts                Blocks tab-close while an upload is in flight
    use-file-pickers.ts                Files + folder input refs with a shared change handler
    use-upload.ts                      Upload orchestration: presign → POST each file → finalise
  s3-client.ts                         XHR POST with progress events (fetch has no upload-progress API)
  utils.ts                             File walking (drag-drop), path validation, size caps
  types.ts                             `UploadEntry`
```

## Flow

1. The transfer card collects files plus sender and recipient details.
2. On submit, it calls `requestOtp` (in the `verification` feature) and shows the OTP input.
3. Once the OTP is verified it receives a JWT upload token.
4. `createTransferFn` exchanges the token for presigned POST URLs, one per file. S3 enforces a `content-length-range` on each URL so the declared size cannot be exceeded.
5. `s3-client.ts` uploads each file as `multipart/form-data`, tracking progress via `XMLHttpRequest.upload.onprogress`.
6. `finalizeTransferFn` sets the transfer status to `ready`, stamps `expires_at`, and (in email mode) sends the notification email.

## Limits

- 2 GB total per transfer, enforced at three layers: client `MAX_TOTAL_BYTES`, the presigned-POST `content-length-range`, and an S3 bucket policy.
- Rate-limit buckets: `create_transfer:ip` (10/hour), `create_transfer:email` (20/day).
