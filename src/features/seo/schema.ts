import { absoluteUrl, getOrigin, SITE } from "./config";

export function organisationSchema() {
	const origin = getOrigin();
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: SITE.organisation.legalName,
		alternateName: SITE.name,
		url: origin || SITE.organisation.url,
		logo: origin ? absoluteUrl("/logo.png") : undefined,
		email: SITE.organisation.email,
		address: {
			"@type": "PostalAddress",
			...SITE.organisation.address,
		},
	};
}

export function websiteSchema() {
	const origin = getOrigin();
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE.name,
		url: origin || undefined,
		description: SITE.shortDescription,
		inLanguage: SITE.htmlLang,
		publisher: {
			"@type": "Organization",
			name: SITE.organisation.legalName,
		},
	};
}

export function webApplicationSchema() {
	const origin = getOrigin();
	return {
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: SITE.name,
		url: origin || undefined,
		description: SITE.description,
		applicationCategory: "UtilityApplication",
		operatingSystem: "Any",
		browserRequirements: "Requires JavaScript. Requires HTML5.",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "GBP",
			availability: "https://schema.org/InStock",
		},
		featureList: [
			"Send files up to 4 GB per transfer",
			"Share by link or direct email",
			"Automatic expiry after 1, 3, or 7 days",
			"One-time passcode sign-in",
			"No account required for recipients",
		],
		publisher: {
			"@type": "Organization",
			name: SITE.organisation.legalName,
		},
	};
}

export function jsonLdScript(data: object) {
	return {
		type: "application/ld+json",
		children: JSON.stringify(data),
	};
}
