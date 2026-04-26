import { useCallback, useRef, useState } from "react";
import { completeMultipartFn } from "@/features/upload/data/mutations/functions/complete-multipart";
import { createTransferFn } from "@/features/upload/data/mutations/functions/create-transfer";
import { finalizeTransferFn } from "@/features/upload/data/mutations/functions/finalize-transfer";
import { uploadMultipartToS3 } from "@/features/upload/s3-client";
import type {
	ExpiryDays,
	Mode,
	UploadEntry,
} from "@/features/upload/types";

type StartUploadInput = {
	mode: Mode;
	expiryDays: ExpiryDays;
	recipientEmail?: string;
	title?: string;
	message?: string;
	entries: UploadEntry[];
};

type UseUpload = {
	progress: number;
	bytesLoaded: number;
	totalBytes: number;
	error: string | null;
	transferSlug: string | null;
	isUploading: boolean;
	start: (input: StartUploadInput) => Promise<"complete" | "aborted" | "error">;
	cancel: () => void;
	reset: () => void;
};

export function useUpload(): UseUpload {
	const [progress, setProgress] = useState(0);
	const [bytesLoaded, setBytesLoaded] = useState(0);
	const [totalBytes, setTotalBytes] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [transferSlug, setTransferSlug] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const controllerRef = useRef<AbortController | null>(null);

	const start = useCallback(
		async (
			input: StartUploadInput,
		): Promise<"complete" | "aborted" | "error"> => {
			setIsUploading(true);
			setError(null);
			setProgress(0);
			setBytesLoaded(0);
			setTotalBytes(0);
			const controller = new AbortController();
			controllerRef.current = controller;

			try {
				const { transferId, slug, uploadUrls } = await createTransferFn({
					data: {
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

				const total = Math.max(
					1,
					input.entries.reduce((sum, entry) => sum + entry.file.size, 0),
				);
				setTotalBytes(total);
				let loadedSoFar = 0;

				for (let i = 0; i < input.entries.length; i++) {
					const entry = input.entries[i];
					const { fileId, uploadId, partUrls } = uploadUrls[i];

					const parts = await uploadMultipartToS3(
						partUrls,
						entry.file,
						(loadedForFile) => {
							setBytesLoaded(loadedSoFar + loadedForFile);
							setProgress(
								Math.round(((loadedSoFar + loadedForFile) / total) * 100),
							);
						},
						controller.signal,
					);

					await completeMultipartFn({
						data: { transferId, fileId, uploadId, parts },
					});

					loadedSoFar += entry.file.size;
				}

				await finalizeTransferFn({
					data: {
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
				return "error";
			}
		},
		[],
	);

	const cancel = useCallback(() => {
		controllerRef.current?.abort();
	}, []);

	const reset = useCallback(() => {
		controllerRef.current = null;
		setProgress(0);
		setBytesLoaded(0);
		setTotalBytes(0);
		setError(null);
		setTransferSlug(null);
		setIsUploading(false);
	}, []);

	return {
		progress,
		bytesLoaded,
		totalBytes,
		error,
		transferSlug,
		isUploading,
		start,
		cancel,
		reset,
	};
}
