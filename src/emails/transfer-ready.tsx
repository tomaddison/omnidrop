import {
	Body,
	Button,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

type TransferReadyEmailProps = {
	senderEmail: string;
	title: string | null;
	message: string | null;
	files: { name: string; size: number }[];
	downloadUrl: string;
	expiresAt: string | null;
};

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatExpiry(iso: string): string {
	return new Date(iso).toLocaleDateString("en-GB", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function TransferReadyEmail({
	senderEmail,
	title,
	message,
	files,
	downloadUrl,
	expiresAt,
}: TransferReadyEmailProps) {
	const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
	const fileWord = files.length === 1 ? "file" : "files";

	return (
		<Html>
			<Head />
			<Preview>
				{senderEmail} sent you {String(files.length)} {fileWord} via Omnidrop
			</Preview>
			<Tailwind>
				<Body className="bg-[#dce8f5] font-sans">
					<Container className="mx-auto max-w-[480px] px-6 py-10">
						<Heading className="mb-1 text-2xl font-semibold text-[#1a1f16]">
							{title ?? "You have files to download"}
						</Heading>
						<Text className="mb-6 mt-1 text-[15px] leading-6 text-[#4a5240]">
							From {senderEmail}
						</Text>

						{message && (
							<Text className="mb-6 text-[15px] leading-6 text-[#4a5240]">
								{message}
							</Text>
						)}

						<Section className="mb-4 overflow-hidden rounded-[10px] border border-[#c4d8ee] bg-white">
							{files.map((file, i) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: order is stable
									key={i}
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										padding: "10px 16px",
										borderBottom:
											i < files.length - 1 ? "1px solid #e8eff8" : undefined,
									}}
								>
									<Text
										style={{
											margin: 0,
											fontSize: 14,
											color: "#1a1f16",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{file.name}
									</Text>
									<Text
										style={{
											margin: "0 0 0 16px",
											flexShrink: 0,
											fontSize: 13,
											color: "#8a9480",
										}}
									>
										{formatBytes(file.size)}
									</Text>
								</div>
							))}
						</Section>

						<Text className="mb-6 text-[13px] text-[#8a9480]">
							{files.length} {fileWord}, {formatBytes(totalBytes)}
							{expiresAt ? ` · Expires ${formatExpiry(expiresAt)}` : ""}
						</Text>

						<Button
							href={downloadUrl}
							style={{
								display: "inline-block",
								borderRadius: 8,
								backgroundColor: "#1a1f16",
								padding: "12px 24px",
								fontSize: 15,
								fontWeight: 600,
								color: "#ffffff",
								textDecoration: "none",
							}}
						>
							Download files
						</Button>

						<Hr className="mb-4 mt-8 border-[#c4d8ee]" />
						<Text className="m-0 text-[13px] text-[#8a9480]">
							This link will expire{" "}
							{expiresAt ? `on ${formatExpiry(expiresAt)}` : "soon"}. Files were
							shared via Omnidrop.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
