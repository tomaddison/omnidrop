import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { CircularProgress } from "@/components/ui/circular-progress";
import { formatBytes } from "@/lib/format";
import type { EtaSample } from "../../types";
import { computeEta, ETA_WINDOW_MS, formatTimeRemaining } from "../../utils";

type UploadingViewProps = {
	progress: number;
	bytesLoaded: number;
	totalBytes: number;
	filesCount: number;
	error: string | null;
	onCancel: () => void;
	onRetry: () => void;
};

export function UploadingView({
	progress,
	bytesLoaded,
	totalBytes,
	filesCount,
	error,
	onCancel,
	onRetry,
}: UploadingViewProps) {
	const samplesRef = useRef<EtaSample[]>([]);
	const lastBytesRef = useRef<number>(-1);

	if (bytesLoaded !== lastBytesRef.current) {
		const now = Date.now();
		const samples = samplesRef.current;
		samples.push({ t: now, bytes: bytesLoaded });
		const cutoff = now - ETA_WINDOW_MS;
		while (samples.length > 1 && samples[0].t < cutoff) samples.shift();
		lastBytesRef.current = bytesLoaded;
	}

	const etaMs =
		progress >= 100
			? null
			: computeEta(samplesRef.current, bytesLoaded, totalBytes);
	const timeRemaining = etaMs !== null ? formatTimeRemaining(etaMs) : null;

	if (error) {
		return (
			<div className="om-fade-in-fast flex flex-col items-center gap-4 p-2.5 py-6">
				<p className="text-center text-sm text-destructive">{error}</p>
				<Button type="button" variant="secondary" size="sm" onClick={onRetry}>
					Try again
				</Button>
			</div>
		);
	}

	const fileLabel = `Sending ${filesCount} file${filesCount !== 1 ? "s" : ""}`;
	const bytesLabel =
		totalBytes > 0
			? `${formatBytes(bytesLoaded)} of ${formatBytes(totalBytes)} uploaded`
			: null;

	return (
		<div className="om-fade-in-fast h-full flex justify-between flex-col pt-6">
			<div className="mt-10 flex flex-col items-center">
				<CircularProgress
					value={progress}
					size={170}
					strokeWidth={9}
					indeterminate={progress === 0 || progress >= 100}
				>
					<span className="flex items-start gap-0.5 ml-1.5 leading-none">
						<span className="text-5xl font-medium tabular-nums tracking-tighter leading-none text-foreground">
							{Math.round(progress)}
						</span>
						<span className="text-md font-medium text-muted-foreground">%</span>
					</span>
				</CircularProgress>
				<div className="mt-5 flex flex-col items-center gap-1 text-center">
					<p className="text-base font-semibold text-foreground">
						Transferring...
					</p>
					<p className="text-sm font-medium text-primary">{fileLabel}</p>
					{bytesLabel && (
						<p className="text-xs text-muted-foreground">{bytesLabel}</p>
					)}
					{timeRemaining && (
						<p className="text-xs text-muted-foreground">{timeRemaining}</p>
					)}
				</div>
			</div>

			<div className="p-2.5">
				<Button
					type="button"
					variant="secondary"
					size="xl"
					className="w-full"
					onClick={onCancel}
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
