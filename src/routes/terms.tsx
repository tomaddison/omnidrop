import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/branding/legal-page";
import { absoluteUrl, getOrigin } from "@/features/seo/config";
import { MAX_TRANSFER_LABEL } from "@/features/upload/utils";

const TITLE = "Terms of Service · Omnidrop";
const DESCRIPTION =
	"Terms of Service for Omnidrop, the file transfer service operated by HUMMIFY LTD. Covers accounts, content, acceptable use, and liability.";

export const Route = createFileRoute("/terms")({
	component: TermsPage,
	head: () => {
		const origin = getOrigin();
		const canonical = absoluteUrl("/terms");
		return {
			meta: [
				{ title: TITLE },
				{ name: "description", content: DESCRIPTION },
				{ property: "og:title", content: TITLE },
				{ property: "og:description", content: DESCRIPTION },
				{ name: "twitter:title", content: TITLE },
				{ name: "twitter:description", content: DESCRIPTION },
				...(origin ? [{ property: "og:url", content: canonical }] : []),
			],
			links: origin ? [{ rel: "canonical", href: canonical }] : [],
		};
	},
});

function TermsPage() {
	return (
		<LegalPage title="Terms of Service" effectiveDate="24 April 2026">
			<p>
				These Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement
				between you and <strong>HUMMIFY LTD</strong>, a company registered in
				England and Wales (company number <strong>16826424</strong>) with a
				registered office at 82a James Carter Road, Mildenhall, England, IP28
				7DE (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). They govern
				your access to and use of Omnidrop, our file transfer website and
				service (the &ldquo;Service&rdquo;).
			</p>
			<p>
				By using the Service you agree to these Terms and to our{" "}
				<a href="/privacy">Privacy Policy</a>. If you do not agree, please do
				not use the Service.
			</p>

			<h2>1. Accounts and eligibility</h2>
			<p>
				You must be at least 18 years old to use the Service. You sign in by
				entering your email address and a one-time code we send to that address.
				Your first successful sign-in creates your Omnidrop account.
			</p>
			<p>
				You are responsible for keeping access to your email secure and for any
				activity carried out under your account. You are also responsible for
				the accuracy of any recipient email address you provide, and for your
				right to share files with that recipient.
			</p>

			<h2>2. The Service</h2>
			<p>
				Omnidrop lets you send files to a recipient by a shareable link or by
				email. The Service currently includes:
			</p>
			<ul>
				<li>Transfers of up to {MAX_TRANSFER_LABEL} each.</li>
				<li>A sender-chosen expiry of 1, 3, or 7 days per transfer.</li>
				<li>Up to 20 transfers per calendar month per signed-in user.</li>
			</ul>
			<p>
				We provide the Service on a best-efforts basis and may change, add, or
				remove features over time. We may also adjust limits where we need to in
				order to keep the Service reliable.
			</p>

			<h2>3. Your content</h2>
			<p>
				You retain ownership of the files, titles, and messages you upload
				(&ldquo;Your Content&rdquo;). You grant us a worldwide, non-exclusive,
				royalty-free licence to host, store, transmit, and deliver Your Content
				solely to operate the Service and make it available to the recipient you
				choose, for the duration you select.
			</p>
			<p>
				You confirm that you have the rights necessary to upload Your Content
				and to share it with the recipient, and that doing so will not infringe
				anyone else&rsquo;s rights or break any law. You should not upload
				special-category personal data (such as health, biometric, or similar
				sensitive information) through the Service.
			</p>

			<h2>4. Acceptable use</h2>
			<p>You must not use the Service to:</p>
			<ul>
				<li>
					Store, send, or distribute content that is unlawful, infringing,
					defamatory, fraudulent, or that violates anyone&rsquo;s rights.
				</li>
				<li>
					Distribute malware, viruses, or other software designed to harm
					systems or people.
				</li>
				<li>
					Share child sexual abuse material, content that incites violence, or
					content intended to harass or harm others.
				</li>
				<li>
					Attempt to bypass rate limits, monthly caps, file size limits, or any
					other technical or security controls.
				</li>
				<li>
					Reverse engineer, probe, scan, or test the Service for vulnerabilities
					without our prior written permission.
				</li>
				<li>
					Use the Service to build a competing product, or to scrape or harvest
					data from it.
				</li>
			</ul>
			<p>
				We may review reported content, remove or disable access to content that
				we reasonably believe breaches these Terms or the law, and cooperate
				with lawful requests from authorities.
			</p>

			<h2>5. Free service</h2>
			<p>
				Omnidrop is currently provided free of charge. We reserve the right to
				introduce paid plans or paid features in the future. If we do, we will
				give notice and make any applicable pricing clear before you are
				charged.
			</p>

			<h2>6. Third-party services</h2>
			<p>
				The Service relies on third-party providers for hosting, storage, and
				email delivery. Where those providers act on our instructions, we remain
				responsible for how personal data is handled, as described in our
				Privacy Policy. We are not responsible for third-party services that you
				choose to use separately from Omnidrop.
			</p>

			<h2>7. Suspension and termination</h2>
			<p>
				You may stop using the Service at any time and request that we delete
				your account by contacting us. Outstanding transfers will continue to be
				deleted on their existing expiry schedule.
			</p>
			<p>
				We may suspend or terminate your access to the Service, in whole or in
				part, if we reasonably believe you have breached these Terms, if we are
				required to by law, or if we need to protect the Service, our users, or
				third parties. Where practical we will give notice before doing so.
			</p>

			<h2>8. Disclaimers and limitation of liability</h2>
			<p>
				The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
				available&rdquo; basis. To the fullest extent permitted by law, we do
				not guarantee that the Service will be uninterrupted, error-free, or
				that transfers will always succeed or be retained beyond the expiry you
				selected. You are responsible for keeping your own copy of any files you
				need to preserve.
			</p>
			<p>
				To the fullest extent permitted by law, our total aggregate liability to
				you arising out of or in connection with the Service or these Terms is
				limited to <strong>GBP 100</strong> or the amount you have paid us in
				the 12 months before the claim, whichever is greater. We are not liable
				for indirect, incidental, special, or consequential loss, including loss
				of data, profits, revenue, or goodwill.
			</p>
			<p>
				Nothing in these Terms excludes or limits liability that cannot be
				excluded or limited by law, including liability for death or personal
				injury caused by our negligence, or for fraud.
			</p>

			<h2>9. Changes to the Service and these Terms</h2>
			<p>
				We may update these Terms from time to time to reflect changes in the
				Service or applicable law. When we make material changes we will update
				the effective date above and, where appropriate, notify you through the
				Service. Continued use of the Service after an update means you accept
				the updated Terms.
			</p>

			<h2>10. Governing law and contact</h2>
			<p>
				These Terms and any dispute arising out of them are governed by the laws
				of England and Wales, and are subject to the exclusive jurisdiction of
				the courts of England and Wales, except where mandatory law in your
				country of residence provides otherwise.
			</p>
			<p>
				If any part of these Terms is found to be unenforceable, the rest
				remains in effect. Together with the Privacy Policy, these Terms are the
				entire agreement between you and HUMMIFY LTD about the Service.
			</p>
			<p>
				<strong>Contact:</strong> HUMMIFY LTD, 82a James Carter Road,
				Mildenhall, England, IP28 7DE.
				<br />
				<strong>Email:</strong>{" "}
				<a href="mailto:contact@hummify.app">contact@hummify.app</a>
			</p>
		</LegalPage>
	);
}
