# verification

Email ownership verification via one-time password. Proves the sender actually controls the email they entered before we let them create a transfer.

## Files

```
verification/
  components/
    otp-input.tsx                      6-digit code input with auto-advance and error handling
  data/mutations/functions/
    request-otp.ts                     Generates a 6-digit code, hashes it, emails the plaintext via Resend
    verify-otp.ts                      Validates the code, returns a JWT upload token (1h TTL)
  utils.ts                             OTP generation/hashing + JWT sign/verify wrappers over jose
  types.ts                             `UploadTokenClaims`, `OtpRecord`
```

## Storage format

OTPs are never stored in plaintext. `hashOtp()` generates a random salt, concatenates `"${otp}:${salt}"`, and stores `"${salt}:${hash}"` in the `email_verifications.code_hash` column. Verification recomputes the hash with the stored salt and compares.

## Limits

- 5 failed verification attempts marks the record `used=true` and burns the code.
- Rate-limit buckets: `otp:ip` (5/hour), `otp:email` (3/hour), `verify:ip` (10/5min).
- Tokens are JWT-signed (HS256) with `UPLOAD_TOKEN_SECRET` and expire after one hour.
