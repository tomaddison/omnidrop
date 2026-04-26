import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/features/branding/legal-page";
import { absoluteUrl, getOrigin } from "@/features/seo/config";

const TITLE = "Privacy Policy · Omnidrop";
const DESCRIPTION =
	"How Omnidrop collects, uses, and protects personal data for its file transfer service. Operated by HUMMIFY LTD (UK).";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
	head: () => {
		const origin = getOrigin();
		const canonical = absoluteUrl("/privacy");
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

function PrivacyPage() {
	return (
		<LegalPage title="Privacy Policy" effectiveDate="24 April 2026">
			<p>
				Omnidrop (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
				operated by <strong>HUMMIFY LTD</strong>, a company registered in
				England and Wales (company number <strong>16826424</strong>) with a
				registered office at 82a James Carter Road, Mildenhall, England, IP28
				7DE. This Privacy Policy explains how we collect, use, store, and share
				personal data when you use the Omnidrop website and file transfer
				service (the &ldquo;Service&rdquo;).
			</p>
			<p>
				For your account and our operation of the Service we act as a{" "}
				<strong>data controller</strong>. For the files you upload and deliver
				through the Service we act as a <strong>data processor</strong> on
				behalf of the sender, and we only retain that content for the time
				needed to make it available to the recipient.
			</p>

			<h2>1. Information we collect</h2>
			<p>
				We limit collection to what is needed to run the Service. Depending on
				how you use Omnidrop we may collect:
			</p>
			<ul>
				<li>
					<strong>Account data:</strong> your email address and an internal user
					identifier created when you first sign in.
				</li>
				<li>
					<strong>Transfer metadata:</strong> an optional title, an optional
					message, the transfer slug, the transfer mode (link or email), status,
					size, creation and expiry timestamps, and, for email-mode transfers,
					the recipient email address you provide.
				</li>
				<li>
					<strong>File content and file metadata:</strong> the files you upload,
					together with file names, relative paths, and sizes, until the
					transfer expires or is deleted.
				</li>
				<li>
					<strong>Technical data:</strong> IP address, user agent, request logs,
					and basic diagnostic information generated when you access the
					Service.
				</li>
				<li>
					<strong>Authentication tokens:</strong> a session cookie set after
					successful sign-in so you stay signed in between visits.
				</li>
			</ul>
			<p>
				We do not collect special-category personal data, payment card details,
				profile avatars, or third-party social identifiers.
			</p>

			<h2>2. How we use your data</h2>
			<ul>
				<li>
					<strong>Provide the Service:</strong> authenticate you, create
					transfers, store and serve files, and deliver them to the recipient
					you choose.
				</li>
				<li>
					<strong>Send transactional email:</strong> one-time verification codes
					during sign-in and, for email-mode transfers, a notification to the
					recipient with a download link.
				</li>
				<li>
					<strong>Enforce limits and prevent abuse:</strong> apply rate limits,
					the 20 transfers per calendar month cap per signed-in user, and
					automated cleanup of expired content.
				</li>
				<li>
					<strong>Keep the Service secure and reliable:</strong> monitor for
					errors, detect misuse, and maintain the availability and integrity of
					the Service.
				</li>
				<li>
					<strong>Comply with law:</strong> meet our legal, accounting, and
					regulatory obligations, and respond to lawful requests.
				</li>
			</ul>

			<h2>3. Legal grounds for processing</h2>
			<p>
				Where UK GDPR or EU GDPR applies we rely on the following legal bases:
			</p>
			<ul>
				<li>
					<strong>Contract:</strong> to provide the Service you request.
				</li>
				<li>
					<strong>Legitimate interests:</strong> to secure, operate, and improve
					the Service, balanced against your rights and expectations.
				</li>
				<li>
					<strong>Legal obligation:</strong> to meet accounting, tax, and other
					statutory requirements.
				</li>
			</ul>
			<p>
				We do not run optional analytics or tracking, so we do not rely on
				consent as a legal basis.
			</p>

			<h2>4. Cookies and similar technologies</h2>
			<p>
				Omnidrop uses only the cookies and tokens needed to sign you in and keep
				your session secure. We do not use analytics cookies, session replay,
				advertising pixels, or third-party trackers.
			</p>

			<h2>5. Sharing your information</h2>
			<p>
				We share personal data only where necessary to run and protect the
				Service:
			</p>
			<ul>
				<li>
					<strong>Service providers:</strong> we use third parties to support
					hosting, storage, email delivery, and similar operational needs. They
					process personal data only on our instructions and under contracts
					that include appropriate safeguards.
				</li>
				<li>
					<strong>Professional advisers:</strong> legal, accounting, and
					technical advisers where needed.
				</li>
				<li>
					<strong>Legal requests:</strong> where required by law or to protect
					the rights, safety, and security of our users or the Service.
				</li>
				<li>
					<strong>Business transfers:</strong> if we undergo a merger,
					acquisition, or sale of assets, personal data may transfer as part of
					that transaction, subject to continued protection consistent with this
					policy.
				</li>
			</ul>
			<p>
				We do <strong>not</strong> sell personal data and we do not share it for
				advertising purposes.
			</p>

			<h2>6. Data retention</h2>
			<ul>
				<li>
					<strong>Files and transfer records:</strong> the sender chooses an
					expiry of 1, 3, or 7 days when creating a transfer. Once the expiry
					has passed, an automated hourly job deletes the files from our storage
					and removes the related transfer records.
				</li>
				<li>
					<strong>Download links:</strong> each signed download URL is valid for
					approximately five minutes.
				</li>
				<li>
					<strong>Account data:</strong> retained while your account remains in
					use. You can ask us to delete it at any time by contacting us.
				</li>
				<li>
					<strong>Operational logs:</strong> retained for a limited period for
					security, debugging, and abuse prevention, then deleted or aggregated.
				</li>
			</ul>

			<h2>7. International transfers</h2>
			<p>
				Some of our service providers may process data outside the UK or EEA.
				Where personal data is transferred to a country that does not have an
				adequacy decision, we rely on appropriate safeguards such as Standard
				Contractual Clauses and the UK International Data Transfer Addendum.
			</p>

			<h2>8. Security</h2>
			<p>
				We use technical and organisational measures designed to protect
				personal data, including:
			</p>
			<ul>
				<li>Encryption in transit and at rest.</li>
				<li>Access controls and role-based permissions.</li>
				<li>
					Signed, time-limited links for file uploads and downloads, with file
					size limits enforced server-side.
				</li>
				<li>
					Deny-by-default access to our data stores, with changes routed through
					authenticated server-side functions.
				</li>
			</ul>
			<p>
				No system is perfectly secure, but we work to reduce risk and improve
				controls over time.
			</p>

			<h2>9. Your rights</h2>
			<p>
				Depending on where you live, you may have rights in relation to your
				personal data, including the right to:
			</p>
			<ul>
				<li>Access a copy of the data we hold about you.</li>
				<li>Correct inaccurate or incomplete data.</li>
				<li>
					Request deletion (subject to legal or operational requirements).
				</li>
				<li>Restrict or object to certain kinds of processing.</li>
				<li>Receive your data in a portable, machine-readable format.</li>
			</ul>
			<p>
				To exercise any of these rights, contact us at{" "}
				<a href="mailto:contact@hummify.app">contact@hummify.app</a>. We may
				need to verify your identity before we respond.
			</p>

			<h2>10. Children</h2>
			<p>
				The Service is intended for users aged 18 and over. We do not knowingly
				collect personal data from children. If you believe a child has provided
				personal data, please contact us so we can review and, where
				appropriate, remove it.
			</p>

			<h2>11. Third-party services</h2>
			<p>
				Omnidrop relies on a small number of service providers acting as
				processors to help us deliver the Service. Where these providers act on
				our instructions, we remain responsible for how personal data is
				handled. Where you interact directly with third parties outside of
				Omnidrop, those activities are governed by the third party&rsquo;s own
				terms and privacy policies.
			</p>

			<h2>12. Changes, contact, and complaints</h2>
			<p>
				We may update this Privacy Policy from time to time to reflect changes
				in the Service or applicable law. When we make material changes we will
				update the effective date above and, where appropriate, notify you
				through the Service.
			</p>
			<p>
				<strong>Controller:</strong> HUMMIFY LTD, 82a James Carter Road,
				Mildenhall, England, IP28 7DE. Company number 16826424.
				<br />
				<strong>Email:</strong>{" "}
				<a href="mailto:contact@hummify.app">contact@hummify.app</a>
			</p>
			<p>
				If you are in the UK you have the right to lodge a complaint with the{" "}
				<a
					href="https://ico.org.uk/make-a-complaint/"
					target="_blank"
					rel="noreferrer"
				>
					Information Commissioner&rsquo;s Office
				</a>
				. If you are in the EEA you can contact your local supervisory
				authority.
			</p>
		</LegalPage>
	);
}
