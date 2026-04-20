import { useCallback, useRef, useState } from "react";
import { createTransferFn } from "#/features/upload/data/mutations/functions/create-transfer";
import { finalizeTransferFn } from "#/features/upload/data/mutations/functions/finalize-transfer";
import { uploadToS3 } from "#/features/upload/s3-client";
import type { UploadEntry } from "#/features/upload/types";

export type UploadMode = "link" | "email";
export type UploadExpiryDays = 1 | 3 | 7;

type StartUploadInput = {
	uploadToken: string;
	turnstileToken: string;
	mode: UploadMode;
	expiryDays: UploadExpiryDays;
	recipientEmail?: string;
	title?: string;
	message?: string;
	entries: UploadEntry[];
};

type UseUpload = {
	progress: number;
	error: string | null;
	transferSlug: string | null;
	isUploading: boolean;
	start: (input: StartUploadInput) => Promise<"complete" | "aborted">;
	cancel: () => void;
	clearError: () => void;
	reset: () => void;
};

export function useUpload(): UseUpload {
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [transferSlug, setTransferSlug] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const controllerRef = useRef<AbortController | null>(null);

	const start = useCallback(
		async (input: StartUploadInput): Promise<"complete" | "aborted"> => {
			setIsUploading(true);
			setError(null);
			setProgress(0);
			const controller = new AbortController();
			controllerRef.current = controller;

			try {
				const { transferId, slug, uploadUrls } = await createTransferFn({
					data: {
						token: input.uploadToken,
						turnstileToken: input.turnstileToken,
						mode: input.mode,
						expiryDays: input.expiryDays,
						recipientEmail:
							input.mode === "email" ? input.recipientEmail : undefined,
						title: input.title || undefined,
						message: input.message || undefined,
						files: input.entries.map((entry) => ({
							name: entry.file.name,
							relativePath: entry.relativePath,
							size: entry.file.size,
						})),
					},
				});

				setTransferSlug(slug);

				const totalBytes = Math.max(
					1,
					input.entries.reduce((sum, entry) => sum + entry.file.size, 0),
				);
				let loadedSoFar = 0;

				for (let i = 0; i < input.entries.length; i++) {
					const entry = input.entries[i];
					await uploadToS3(
						uploadUrls[i].url,
						uploadUrls[i].fields,
						entry.file,
						(loaded) => {
							setProgress(
								Math.round(((loadedSoFar + loaded) / totalBytes) * 100),
							);
						},
						controller.signal,
					);
					loadedSoFar += entry.file.size;
				}

				await finalizeTransferFn({
					data: {
						token: input.uploadToken,
						transferId,
						expiryDays: input.expiryDays,
					},
				});

				setIsUploading(false);
				return "complete";
			} catch (err) {
				setIsUploading(false);
				if (err instanceof DOMException && err.name === "AbortError") {
					return "aborted";
				}
				setError(err instanceof Error ? err.message : "Upload failed.");
				return "aborted";
			}
		},
		[],
	);

	const cancel = useCallback(() => {
		controllerRef.current?.abort();
	}, []);

	const clearError = useCallback(() => setError(null), []);

	const reset = useCallback(() => {
		controllerRef.current = null;
		setProgress(0);
		setError(null);
		setTransferSlug(null);
		setIsUploading(false);
	}, []);

	return {
		progress,
		error,
		transferSlug,
		isUploading,
		start,
		cancel,
		clearError,
		reset,
	};
}
