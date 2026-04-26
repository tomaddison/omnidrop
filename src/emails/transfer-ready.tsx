import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { formatBytes, formatExpiryDate, pluralizeFiles } from "@/lib/format";

type TransferReadyEmailProps = {
	senderEmail: string;
	title: string | null;
	message: string | null;
	files: { name: string; size: number }[];
	downloadUrl: string;
	expiresAt: string | null;
	appUrl: string;
};

export function TransferReadyEmail({
	senderEmail,
	title,
	message,
	files,
	downloadUrl,
	expiresAt,
	appUrl,
}: TransferReadyEmailProps) {
	const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
	const fileWord = pluralizeFiles(files.length);
	const MAX_LISTED = 5;
	const visibleFiles = files.slice(0, MAX_LISTED);
	const remaining = files.length - visibleFiles.length;

	return (
		<Html>
			<Head />
			<Preview>
				{senderEmail} sent you {String(files.length)} {fileWord} via Omnidrop
			</Preview>
			<Tailwind>
				<Body className="font-sans">
					<Container className="mx-auto max-w-[480px] px-6 py-10">
						<Text className="text-[24px] font-bold mb-8 font-stretch-130%">
							<Link href={appUrl} className="text-black no-underline">
								Omnidrop
							</Link>
						</Text>
						<Text className="mb-6 text-[18px] font-semibold leading-6 text-black">
							{title ?? "You have files to download"}
						</Text>
						<Text className="mb-6 text-[13px] leading-5 text-gray-500">
							Sent by{" "}
							<span className="font-medium text-black">{senderEmail}</span>
						</Text>

						{message && (
							<Section className="mb-6 rounded-xl bg-gray-100 px-5 py-4">
								<Text className="m-0 text-[15px] leading-6 text-black">
									{message}
								</Text>
							</Section>
						)}

						<Section className="mb-4">
							{visibleFiles.map((file, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: order is stable
									key={i}
									className={`flex items-center justify-between py-[10px] ${i < visibleFiles.length - 1 || remaining > 0 ? "border-b border-gray-200" : ""}`}
								>
									<Text className="m-0 truncate text-[14px] text-black">
										{file.name}
									</Text>
									<Text className="m-0 ml-4 shrink-0 text-[13px] text-gray-500">
										{formatBytes(file.size)}
									</Text>
								</div>
							))}
							{remaining > 0 && (
								<Text className="m-0 py-[10px] text-[14px] text-gray-500">
									+ {remaining} more {pluralizeFiles(remaining)}
								</Text>
							)}
						</Section>

						<Text className="mb-6 text-[13px] leading-5 text-gray-500">
							{files.length} {fileWord} · {formatBytes(totalBytes)}
						</Text>

						<Button
							href={downloadUrl}
							className="box-border block w-full text-center rounded-xl bg-black px-6 py-3 text-[15px] font-semibold text-white no-underline"
						>
							Download files
						</Button>
						<Text className="mt-8 text-[13px] leading-5 text-black">
							This link will expire{" "}
							{expiresAt ? `on ${formatExpiryDate(expiresAt)}` : "soon"}. If you
							weren't expecting this email, you can safely ignore it.
						</Text>
						<Text className="mt-2 mb-0 text-[11px] text-gray-500">
							<Link
								href={`${appUrl}/privacy`}
								className="text-gray-500 underline"
							>
								Privacy
							</Link>
							<span> · </span>
							<Link
								href={`${appUrl}/terms`}
								className="text-gray-500 underline"
							>
								Terms
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

TransferReadyEmail.PreviewProps = {
	senderEmail: "sender@example.com",
	title: "Project handover",
	message:
		"Latest drafts and the full asset pack. Shout if anything is missing.",
	files: [
		{ name: "brief.pdf", size: 184_320 },
		{ name: "logo-pack.zip", size: 12_582_912 },
		{ name: "walkthrough.mov", size: 284_164_096 },
		{ name: "style-guide.pdf", size: 2_457_600 },
		{ name: "hero-shot.png", size: 4_915_200 },
		{ name: "outtakes.mov", size: 156_237_824 },
		{ name: "notes.txt", size: 4_096 },
		{ name: "contract.pdf", size: 312_320 },
	],
	downloadUrl: "https://omnidrop.example.com/d/abc123",
	expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
	appUrl: "https://omnidrop.example.com",
} satisfies TransferReadyEmailProps;

export default TransferReadyEmail;
