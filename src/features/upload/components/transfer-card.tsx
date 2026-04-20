import { useState } from "react";
import { useTurnstileToken } from "#/features/security/hooks/use-turnstile-token";
import { useBlockUnload } from "#/features/upload/hooks/use-block-unload";
import { useFilePickers } from "#/features/upload/hooks/use-file-pickers";
import { useUpload } from "#/features/upload/hooks/use-upload";
import type { UploadEntry } from "#/features/upload/types";
import { MAX_TOTAL_BYTES } from "#/features/upload/utils";
import { OtpInput } from "#/features/verification/components/otp-input";
import { requestOtp } from "#/features/verification/data/mutations/functions/request-otp";
import {
	EXPIRY_OPTIONS,
	type ExpiryDays,
	ExpiryPopover,
} from "./expiry/expiry-popover";
import { SuccessView } from "./transfer-card/success-view";
import { type Mode, TabSwitcher } from "./transfer-card/tab-switcher";
import { TransferForm } from "./transfer-card/transfer-form";
import { UploadingView } from "./transfer-card/uploading-view";
import { formSchema } from "./transfer-card/validation";

type Step = "form" | "otp" | "uploading" | "complete";

type TransferCardProps = {
	entries: UploadEntry[];
	addEntries: (newEntries: UploadEntry[]) => void;
	removeEntry: (relativePath: string) => void;
	removeFolder: (folder: string) => void;
	clearEntries: () => void;
};

export function TransferCard({
	entries,
	addEntries,
	removeEntry,
	removeFolder,
	clearEntries,
}: TransferCardProps) {
	const [mode, setMode] = useState<Mode>("link");
	const [step, setStep] = useState<Step>("form");

	const [yourEmail, setYourEmail] = useState("");
	const [recipientEmail, setRecipientEmail] = useState("");
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [expiryDays, setExpiryDays] = useState<ExpiryDays>(7);

	const [isPendingOtp, setIsPendingOtp] = useState(false);
	const [otpError, setOtpError] = useState<string | null>(null);

	// Turnstile lives at the card level so the invisible widget survives across
	// form → otp → uploading step changes; remounting would reset the challenge.
	const turnstile = useTurnstileToken();
	const upload = useUpload();
	const pickers = useFilePickers({ onPick: addEntries });

	useBlockUnload(upload.isUploading);

	function reset() {
		setMode("link");
		setStep("form");
		setYourEmail("");
		setRecipientEmail("");
		setTitle("");
		setMessage("");
		setExpiryDays(7);
		clearEntries();
		setOtpError(null);
		upload.reset();
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const parsed = formSchema.safeParse({ mode, yourEmail, recipientEmail });
		if (!parsed.success) {
			setOtpError(
				parsed.error.issues[0]?.message ?? "Please check your inputs.",
			);
			return;
		}
		const totalBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
		if (totalBytes > MAX_TOTAL_BYTES) {
			setOtpError("Transfers are limited to 2GB.");
			return;
		}
		setIsPendingOtp(true);
		setOtpError(null);
		try {
			const turnstileToken = await turnstile.consume();
			await requestOtp({ data: { email: yourEmail, turnstileToken } });
			setStep("otp");
		} catch (err) {
			setOtpError(err instanceof Error ? err.message : "Something went wrong.");
		} finally {
			setIsPendingOtp(false);
		}
	}

	async function handleOtpVerified(uploadToken: string) {
		setStep("uploading");
		const turnstileToken = await turnstile.consume();
		const outcome = await upload.start({
			uploadToken,
			turnstileToken,
			mode,
			expiryDays,
			recipientEmail,
			title,
			message,
			entries,
		});
		if (outcome === "complete") setStep("complete");
		else if (!upload.error) reset();
	}

	const totalBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);
	const expiryLabel =
		EXPIRY_OPTIONS.find((option) => option.id === expiryDays)?.label ??
		`${expiryDays} days`;
	const ready =
		entries.length > 0 &&
		formSchema.safeParse({ mode, yourEmail, recipientEmail }).success;

	const submitLabel = isPendingOtp
		? "Sending code..."
		: mode === "link"
			? "Get a link"
			: "Send transfer";

	return (
		<div className="ht-fade-in relative z-3 flex h-[500px] w-[300px] flex-col shadow-xl shadow-black/50 rounded-3xl bg-card">
			{pickers.inputs}
			{turnstile.widget}

			{step === "form" && (
				<TransferForm disabled={isPendingOtp} onSubmit={handleSubmit}>
					<TransferForm.Body
						files={
							<TransferForm.Files
								entries={entries}
								onAddFiles={pickers.openFiles}
								onAddFolder={pickers.openFolder}
								onRemoveEntry={removeEntry}
								onRemoveFolder={removeFolder}
							/>
						}
					>
						<TransferForm.Recipient
							show={mode === "email"}
							value={recipientEmail}
							onChange={setRecipientEmail}
						/>
						<TransferForm.Fields
							yourEmail={yourEmail}
							onYourEmailChange={setYourEmail}
							title={title}
							onTitleChange={setTitle}
							message={message}
							onMessageChange={setMessage}
						/>
					</TransferForm.Body>
					<TransferForm.Footer
						ready={ready}
						error={otpError}
						submitLabel={submitLabel}
						showSubmitArrow={!isPendingOtp}
					>
						<TabSwitcher
							mode={mode}
							onChange={setMode}
							disabled={isPendingOtp}
						/>
						<ExpiryPopover value={expiryDays} onChange={setExpiryDays} />
					</TransferForm.Footer>
				</TransferForm>
			)}

			{step === "otp" && (
				<div className="ht-fade-in-fast p-3">
					<OtpInput
						email={yourEmail}
						onSuccess={handleOtpVerified}
						onBack={() => setStep("form")}
					/>
				</div>
			)}

			{step === "uploading" && (
				<UploadingView
					progress={upload.progress}
					error={upload.error}
					onCancel={upload.cancel}
					onRetry={reset}
				/>
			)}

			{step === "complete" &&
				upload.transferSlug &&
				(mode === "link" ? (
					<SuccessView
						variant="link"
						shareUrl={`${import.meta.env.VITE_APP_URL ?? ""}/d/${upload.transferSlug}`}
						filesCount={entries.length}
						totalBytes={totalBytes}
						expiryLabel={expiryLabel}
						onNewTransfer={reset}
					/>
				) : (
					<SuccessView
						variant="email"
						recipientEmail={recipientEmail}
						filesCount={entries.length}
						totalBytes={totalBytes}
						expiryLabel={expiryLabel}
						onNewTransfer={reset}
					/>
				))}
		</div>
	);
}
