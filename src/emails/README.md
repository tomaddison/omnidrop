# Transactional emails

React Email templates used by Omnidrop.

- **`otp.tsx`** - the sign-in OTP email. Sent by Supabase Auth, _not_ by our own server code. The template variables Supabase injects are `{{ .Token }}` (the 6-digit code) and `{{ .Email }}` (the recipient). The `appUrl` prop is baked in at render time from `VITE_APP_URL` and is used to build absolute links to `/privacy` and `/terms` in the email footer.
- **`transfer-ready.tsx`** - the notification email sent via Resend when an email-mode transfer finalises. Takes an `appUrl` prop for the same legal footer links; the call site in `finalize-transfer.ts` reads it from `process.env.VITE_APP_URL`.

## Updating the Supabase OTP email template

The OTP email lives in Supabase's Email Templates, not in this repo's runtime. To update it:

1. Edit `otp.tsx`.
2. Render to HTML, substituting Supabase's placeholders for the props. Set `VITE_APP_URL` to the production origin so the Privacy and Terms footer links resolve correctly:
   ```bash
   VITE_APP_URL=https://transfer.example.com npx tsx scripts/render-otp-email.ts
   ```
   The script prints the rendered HTML to stdout. `code` is replaced by `{{ .Token }}`, `email` by `{{ .Email }}`, and `appUrl` by the env value.
3. Copy the output and paste it into Supabase Dashboard → Authentication → Email Templates → **Magic Link** (HTML body). Set the subject to something like "Your Omnidrop verification code".

Locally (via `supabase start`), Supabase uses its built-in default template and emails land in Inbucket at `http://127.0.0.1:54324` - no dashboard step needed for dev.
