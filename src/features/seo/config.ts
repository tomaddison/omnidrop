export const SITE = {
	name: "Omnidrop",
	tagline: "Send anything. Fast.",
	description:
		"Secure file transfers for everybody. Send files up to 4 GB per link. Links expire in 1, 3, or 7 days.",
	shortDescription: "Free, secure file transfers up to 4 GB per link.",
	locale: "en_GB",
	htmlLang: "en-GB",
	themeColor: "#000000",
	ogImage: "/og-image.png",
	twitterImage: "/twitter-image.png",
	organisation: {
		legalName: "HUMMIFY LTD",
		url: "https://hummify.app",
		email: "contact@hummify.app",
		companyNumber: "16826424",
		address: {
			streetAddress: "82a James Carter Road",
			addressLocality: "Mildenhall",
			addressRegion: "England",
			postalCode: "IP28 7DE",
			addressCountry: "GB",
		},
	},
} as const;

export function getOrigin(): string {
	const raw = import.meta.env.VITE_APP_URL ?? "";
	return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
	const origin = getOrigin();
	if (!origin) return path;
	return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
