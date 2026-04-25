# seo

Brand metadata and JSON-LD builders shared across route `head()` functions. Keeping strings and schema here prevents drift between the root layout, landing page, legal pages, and any future public route.

## Files

- `config.ts` - `SITE` brand constants (name, descriptions, locale, OG image paths, operator details) plus `getOrigin()` and `absoluteUrl()` helpers that resolve `import.meta.env.VITE_APP_URL` at build time and strip trailing slashes.
- `schema.ts` - schema.org JSON-LD builders: `organisationSchema()`, `websiteSchema()`, `webApplicationSchema()`, and a `jsonLdScript()` helper that returns a TanStack Start `{ type: "application/ld+json", children }` script entry ready to drop into a route's `head().scripts` array.

## Usage

```ts
import { SITE, absoluteUrl } from "#/features/seo/config";
import { jsonLdScript, webApplicationSchema } from "#/features/seo/schema";

head: () => ({
  meta: [
    { title: `${SITE.name} - ${SITE.tagline}` },
    { name: "description", content: SITE.description },
  ],
  links: [{ rel: "canonical", href: absoluteUrl("/") }],
  scripts: [jsonLdScript(webApplicationSchema())],
}),
```

## Notes

- `VITE_APP_URL` must be set at build time for canonical URLs, `og:url`, and absolute JSON-LD URLs to render. In dev without it set, canonical and `og:url` are omitted rather than rendered empty.
- The sitemap is emitted by the TanStack Start Vite plugin (`vite.config.ts`) using the same `VITE_APP_URL` as its host.
- No `FAQPage` schema is shipped - adding FAQ schema without visible FAQ content on the page risks a Google manual action.
