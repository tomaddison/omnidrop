import { useRef } from "react";
import { Button } from "#/components/ui/button";
import { CircularProgress } from "#/components/ui/circular-progress";
import { formatBytes } from "#/lib/format";

type UploadingViewProps = {
	progress: number;
	bytesLoaded: number;
	totalBytes: number;
	filesCount: number;
	error: string | null;
	onCancel: () => void;
	onRetry: () => void;
};

function formatTimeRemaining(ms: number): string {
	const secs = Math.round(ms / 1000);
	if (secs < 60)
		return `About ${secs} second${secs !== 1 ? "s" : ""} remaining`;
	const mins = Math.round(secs / 60);
	return `About ${mins} minute${mins !== 1 ? "s" : ""} remaining`;
}

export function UploadingView({
	progress,
	bytesLoaded,
	totalBytes,
	filesCount,
	error,
	onCancel,
	onRetry,
}: UploadingViewProps) {
	const startTimeRef = useRef<number>(Date.now());

	const timeRemaining = (() => {
		if (progress <= 2 || progress >= 100) return null;
		const elapsed = Date.now() - startTimeRef.current;
		const rate = progress / elapsed;
		return formatTimeRemaining((100 - progress) / rate);
	})();

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
