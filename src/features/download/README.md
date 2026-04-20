# download

Server-side logic for the `/d/$slug` page. No client components live here; the route owns the UI and calls into these server functions.

## Files

- `server/get-transfer.ts` — `getTransferFn` loads the transfer by slug, enforces status (`ready`) and expiry, and returns the shape the download page renders from.
- `server/issue-download-urls.ts` — `issueDownloadUrlsFn` returns signed S3 GET URLs for every file in the transfer. Each URL has a short TTL so a copied link stays useless after the window closes.

## Notes

The transfer row carries a `password_hash` column that is not yet consumed in the UI. The server function exposes `hasPassword` on the payload so the client can branch once that feature lands.
