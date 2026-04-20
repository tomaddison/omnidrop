# branding

Layout primitives and copy for the landing page. These exist as a feature rather than living under `components/ui/` because they are tied to the product's visual identity and are not reusable design-system primitives.

## Files

- `stage.tsx` — the wrapper that positions the transfer card (`centered`, `left`, or `fullbleed`).
- `hero.tsx` — headline and tagline copy, rendered only in the `left` layout.
- `fullbleed-backdrop.tsx` — the oversized background lettering behind the transfer card in the `fullbleed` layout.
- `top-bar.tsx` — header with logo and "Sign in" CTA.

## Layout

`Layout` is a three-way toggle (`centered` | `left` | `fullbleed`). The value is persisted to `localStorage` by the home route and threaded into each branding primitive. The cycling button in the top bar is there for the portfolio build so reviewers can see the variations.
