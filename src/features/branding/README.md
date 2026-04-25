# branding

Layout primitives and copy for the landing page. These exist as a feature rather than living under `components/ui/` because they are tied to the product's visual identity and are not reusable design-system primitives.

## Files

- `stage.tsx` - wraps the transfer card and positions the hero copy alongside it.
- `hero.tsx` - headline and tagline copy rendered next to the transfer card.
- `top-bar.tsx` - header with the logo on the left; when a user is signed in, shows their email and a Sign out button on the right.
- `footer.tsx` - site-wide footer with `Privacy` and `Terms` links, rendered once by `routes/__root.tsx` and pinned to the bottom of the viewport via a flex column wrapper.
- `legal-page.tsx` - shared shell used by `/privacy` and `/terms`. Renders the `TopBar` and a centred prose container with styling for `<h2>`, `<h3>`, `<p>`, `<ul>`, `<strong>`, and `<a>`.
