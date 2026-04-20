-- transfer_mode: how the transfer link is shared
CREATE TYPE public.transfer_mode AS ENUM (
  'link',   -- sender copies a shareable link
  'email'   -- app emails the link to the recipient
);

-- transfer_status: lifecycle state of a transfer
CREATE TYPE public.transfer_status AS ENUM (
  'uploading',  -- presigned URLs issued, files are being sent to S3
  'pending',    -- general in-between / transitional state
  'ready',      -- upload finalised, download link is live
  'failed',     -- upload or finalisation failed
  'expired'     -- past expires_at, awaiting S3 cleanup
);
