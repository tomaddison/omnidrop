import { MAX_CONCURRENT_PARTS, PART_SIZE } from "#/features/upload/utils";

export type UploadedPart = { ETag: string; PartNumber: number };

// XHR, not fetch — fetch still has no cross-browser upload-progress event.
export function uploadMultipartToS3(
	partUrls: string[],
	file: File,
	onProgress: (loadedForFile: number) => void,
	signal: AbortSignal,
): Promise<UploadedPart[]> {
	const partLoaded = new Array<number>(partUrls.length).fill(0);
	let totalLoaded = 0;

	function reportProgress(partIndex: number, loadedNow: number) {
		totalLoaded += loadedNow - partLoaded[partIndex];
		partLoaded[partIndex] = loadedNow;
		onProgress(totalLoaded);
	}

	async function uploadOne(partIndex: number): Promise<UploadedPart> {
		const start = partIndex * PART_SIZE;
		const end = Math.min(file.size, start + PART_SIZE);
		const chunk = file.slice(start, end);
		const url = partUrls[partIndex];

		return new Promise<UploadedPart>((resolve, reject) => {
			if (signal.aborted) {
				reject(new DOMException("Upload aborted.", "AbortError"));
				return;
			}

			const xhr = new XMLHttpRequest();

			xhr.upload.addEventListener("progress", (e) => {
				if (e.lengthComputable) reportProgress(partIndex, e.loaded);
			});

			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					const etag =
						xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
					if (!etag) {
						reject(new Error(`Part ${partIndex + 1} returned no ETag.`));
						return;
					}
					reportProgress(partIndex, chunk.size);
					resolve({
						ETag: etag.replace(/"/g, ""),
						PartNumber: partIndex + 1,
					});
				} else {
					reject(
						new Error(
							`Part ${partIndex + 1} failed: ${xhr.status} ${xhr.statusText}`,
						),
					);
				}
			});

			xhr.addEventListener("error", () => {
				reject(new Error("Upload failed due to a network error."));
			});

			// Without a timeout a silent server death leaves the XHR pending forever.
			xhr.timeout = 10 * 60 * 1000;
			xhr.addEventListener("timeout", () => {
				reject(new Error("Upload stalled. Please retry."));
			});

			const onAbort = () => {
				xhr.abort();
				reject(new DOMException("Upload aborted.", "AbortError"));
			};
			signal.addEventListener("abort", onAbort, { once: true });

			xhr.open("PUT", url);
			xhr.setRequestHeader("Content-Type", "application/octet-stream");
			xhr.send(chunk);
		});
	}

	async function runQueue(): Promise<UploadedPart[]> {
		const results: UploadedPart[] = new Array(partUrls.length);
		let nextIndex = 0;

		async function worker(): Promise<void> {
			while (true) {
				const i = nextIndex++;
				if (i >= partUrls.length) return;
				results[i] = await uploadOne(i);
			}
		}

		const workers = Array.from(
			{ length: Math.min(MAX_CONCURRENT_PARTS, partUrls.length) },
			() => worker(),
		);
		await Promise.all(workers);
		return results;
	}

	return runQueue();
}
