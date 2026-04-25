import { useRef, useState } from "react";
import { OtpInput } from "#/features/authentication/components/otp-input";
import {
	Turnstile,
	type TurnstileHandle,
} from "#/features/authentication/components/turnstile";
import { loginWithOtp } from "#/features/authentication/data/server/login-with-otp";
import { useAuth } from "#/features/authentication/provider";
import { useBlockUnload } from "#/features/upload/hooks/use-block-unload";
import { useFilePickers } from "#/features/upload/hooks/use-file-pickers";
import { useTransferForm } from "#/features/upload/hooks/use-transfer-form";
import { useUpload } from "#/features/upload/hooks/use-upload";
import type { UploadEntry } from "#/features/upload/types";
import { EXPIRY_OPTIONS, ExpiryPopover } from "./expiry/expiry-popover";
import { SuccessView } from "./transfer-card/success-view";
import { type Mode, TabSwitcher } from "./transfer-card/tab-switcher";
import { TransferForm } from "./transfer-card/transfer-form";
import { UploadingView } from "./transfer-card/uploading-view";

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
	const [isPendingOtp, setIsPendingOtp] = useState(false);
	const [otpError, setOtpError] = useState<string | null>(null);
	const turnstileRef = useRef<TurnstileHandle>(null);

	const { user, refresh: refreshAuth } = useAuth();
	const signedIn = user !== null;

	const form = useTransferForm({
		mode,
		entries,
		signedInEmail: user?.email ?? null,
	});

	const upload = useUpload();
	const pickers = useFilePickers({ onPick: addEntries });

	useBlockUnload(upload.isUploading);

	function reset() {
		setMode("link");
		setStep("form");
		setOtpError(null);
		form.reset();
		clearEntries();
		upload.reset();
	}

	async function startUpload() {
		setStep("uploading");
		const outcome = await upload.start({
			mode,
			expiryDays: form.expiryDays,
			recipientEmail: form.recipientEmail,
			title: form.title,
			message: form.message,
			entries,
		});
		if (outcome === "complete") setStep("complete");
		else if (outcome === "aborted") reset();
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		if (form.formError !== null) return;
		if (signedIn) {
			await startUpload();
			return;
		}
		setIsPendingOtp(true);
		setOtpError(null);
		try {
			const captchaToken = await turnstileRef.current?.getToken();
			await loginWithOtp({
				data: { email: form.yourEmail, captchaToken },
			});
			setStep("otp");
		} catch (err) {
			setOtpError(err instanceof Error ? err.message : "Something went wrong.");
		} finally {
			setIsPendingOtp(false);
		}
	}

	async function handleOtpVerified() {
		await refreshAuth();
		await startUpload();
	}

	const expiryLabel =
		EXPIRY_OPTIONS.find((option) => option.id === form.expiryDays)?.label ??
		`${form.expiryDays} days`;

	const submitLabel = mode === "link" ? "Get a link" : "Transfer";

	return (
		<div className="om-fade-in overflow-hidden relative z-3 flex h-[470px] w-[320px] flex-col shadow-xl shadow-black/50 rounded-xl bg-card">
			{pickers.inputs}

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
								anchorRef={form.filesAnchorRef}
							/>
						}
					>
						<TransferForm.Recipient
							show={mode === "email"}
							value={form.recipientEmail}
							onChange={form.setRecipientEmail}
							anchorRef={form.recipientEmailAnchorRef}
						/>
						<TransferForm.Fields
							yourEmail={form.yourEmail}
							onYourEmailChange={form.setYourEmail}
							yourEmailLocked={signedIn}
							title={form.title}
							onTitleChange={form.setTitle}
							message={form.message}
							onMessageChange={form.setMessage}
							yourEmailAnchorRef={form.yourEmailAnchorRef}
						/>
					</TransferForm.Body>
					{!signedIn && <Turnstile ref={turnstileRef} />}
					<TransferForm.Footer
						formError={form.formError}
						formErrorAnchorRef={form.formErrorAnchorRef}
						error={otpError}
						submitLabel={submitLabel}
						isLoading={isPendingOtp}
					>
						<TabSwitcher
							mode={mode}
							onChange={setMode}
							disabled={isPendingOtp}
						/>
						<ExpiryPopover
							value={form.expiryDays}
							onChange={form.setExpiryDays}
						/>
					</TransferForm.Footer>
				</TransferForm>
			)}

			{step === "otp" && (
				<div className="om-fade-in-fast h-full flex items-center p-6">
					<OtpInput
						email={form.yourEmail}
						onSuccess={handleOtpVerified}
						onBack={() => setStep("form")}
					/>
				</div>
			)}

			{step === "uploading" && (
				<UploadingView
					progress={upload.progress}
					bytesLoaded={upload.bytesLoaded}
					totalBytes={upload.totalBytes}
					filesCount={entries.length}
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
						totalBytes={form.totalBytes}
						expiryLabel={expiryLabel}
						onNewTransfer={reset}
					/>
				) : (
					<SuccessView
						variant="email"
						recipientEmail={form.recipientEmail}
						filesCount={entries.length}
						totalBytes={form.totalBytes}
						expiryLabel={expiryLabel}
						onNewTransfer={reset}
					/>
				))}
		</div>
	);
}
