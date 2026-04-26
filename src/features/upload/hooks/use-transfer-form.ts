import { useEffect, useRef, useState } from "react";
import {
	type FormError,
	formSchema,
} from "@/features/upload/components/transfer-card/validation";
import type { ExpiryDays, Mode, UploadEntry } from "@/features/upload/types";
import {
	MAX_TOTAL_BYTES,
	MAX_TRANSFER_LABEL,
	titleFromEntries,
} from "@/features/upload/utils";

type UseTransferFormOptions = {
	mode: Mode;
	entries: UploadEntry[];
	signedInEmail?: string | null;
};

export function useTransferForm({
	mode,
	entries,
	signedInEmail,
}: UseTransferFormOptions) {
	const [yourEmail, setYourEmail] = useState(signedInEmail ?? "");
	const [recipientEmail, setRecipientEmail] = useState("");
	const [title, setTitle] = useState("");
	const [titleTouched, setTitleTouched] = useState(false);
	const [message, setMessage] = useState("");
	const [expiryDays, setExpiryDays] = useState<ExpiryDays>(7);

	// Pick up the signed-in email as soon as the AuthProvider resolves it.
	useEffect(() => {
		if (signedInEmail) setYourEmail(signedInEmail);
	}, [signedInEmail]);

	// Auto-fill title from the first file/folder until the user edits it.
	const suggestedTitle = titleFromEntries(entries);
	useEffect(() => {
		if (titleTouched) return;
		setTitle(suggestedTitle);
	}, [suggestedTitle, titleTouched]);

	function handleTitleChange(value: string) {
		setTitleTouched(true);
		setTitle(value);
	}

	const filesAnchorRef = useRef<HTMLDivElement>(null);
	const yourEmailAnchorRef = useRef<HTMLDivElement>(null);
	const recipientEmailAnchorRef = useRef<HTMLDivElement>(null);

	const totalBytes = entries.reduce((sum, entry) => sum + entry.file.size, 0);

	const formError: FormError = (() => {
		if (entries.length === 0) {
			return {
				field: "files",
				message: "We need at least one file to send.",
			};
		}
		if (totalBytes > MAX_TOTAL_BYTES) {
			return {
				field: "files",
				message: `Your transfer is over the ${MAX_TRANSFER_LABEL} limit.`,
			};
		}
		const parsed = formSchema.safeParse({ mode, yourEmail, recipientEmail });
		if (!parsed.success) {
			const invalidFields = new Set(
				parsed.error.issues.map((issue) => issue.path[0]),
			);
			if (invalidFields.has("recipientEmail")) {
				return {
					field: "recipientEmail",
					message: "We need the email address you want to send these files to.",
				};
			}
			return {
				field: "yourEmail",
				message: "We need your email address to keep our platform safe.",
			};
		}
		return null;
	})();
	const ready = formError === null;

	const formErrorAnchorRef = formError
		? formError.field === "yourEmail"
			? yourEmailAnchorRef
			: formError.field === "recipientEmail"
				? recipientEmailAnchorRef
				: filesAnchorRef
		: null;

	function reset() {
		setYourEmail(signedInEmail ?? "");
		setRecipientEmail("");
		setTitle("");
		setTitleTouched(false);
		setMessage("");
		setExpiryDays(7);
	}

	return {
		yourEmail,
		setYourEmail,
		recipientEmail,
		setRecipientEmail,
		title,
		setTitle: handleTitleChange,
		message,
		setMessage,
		expiryDays,
		setExpiryDays,
		filesAnchorRef,
		yourEmailAnchorRef,
		recipientEmailAnchorRef,
		totalBytes,
		formError,
		ready,
		formErrorAnchorRef,
		reset,
	};
}
