import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";

import { AuthProvider } from "#/features/authentication/provider";
import { Footer } from "#/features/branding/footer";
import { absoluteUrl, getOrigin, SITE } from "#/features/seo/config";
import {
	jsonLdScript,
	organisationSchema,
	websiteSchema,
} from "#/features/seo/schema";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => {
		const origin = getOrigin();
		const ogImage = absoluteUrl(SITE.ogImage);
		const twitterImage = absoluteUrl(SITE.twitterImage);
		return {
			meta: [
				{ charSet: "utf-8" },
				{ name: "viewport", content: "width=device-width, initial-scale=1" },
				{ title: `${SITE.name} | ${SITE.tagline}` },
				{ name: "description", content: SITE.description },
				{ name: "author", content: SITE.organisation.legalName },
				{ name: "theme-color", content: SITE.themeColor },
				{ property: "og:site_name", content: SITE.name },
				{ property: "og:type", content: "website" },
				{ property: "og:locale", content: SITE.locale },
				{ property: "og:title", content: SITE.name },
				{ property: "og:description", content: SITE.description },
				...(origin ? [{ property: "og:url", content: origin }] : []),
				{ property: "og:image", content: ogImage },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
				{ property: "og:image:alt", content: `${SITE.name} - ${SITE.tagline}` },
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: SITE.name },
				{ name: "twitter:description", content: SITE.description },
				{ name: "twitter:image", content: twitterImage },
			],
			links: [
				{ rel: "icon", href: "/favicon.ico" },
				{ rel: "apple-touch-icon", href: "/logo192.png" },
				{ rel: "manifest", href: "/manifest.json" },
				{ rel: "stylesheet", href: appCss },
				{ rel: "preconnect", href: "https://fonts.googleapis.com" },
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossOrigin: "anonymous",
				},
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap",
				},
			],
			scripts: [
				jsonLdScript(organisationSchema()),
				jsonLdScript(websiteSchema()),
			],
		};
	},
	component: RootComponent,
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en-GB" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="font-sans antialiased">
				<div aria-hidden="true" />
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return (
		<AuthProvider>
			<div className="flex min-h-screen flex-col">
				<div className="flex-1">
					<Outlet />
				</div>
				<Footer />
			</div>
		</AuthProvider>
	);
}
