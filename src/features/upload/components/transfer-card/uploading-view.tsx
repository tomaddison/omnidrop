import { Button } from "#/components/ui/button";
import { CircularProgress } from "#/components/ui/circular-progress";

type UploadingViewProps = {
	progress: number;
	error: string | null;
	onCancel: () => void;
	onRetry: () => void;
};

export function UploadingView({
	progress,
	error,
	onCancel,
	onRetry,
}: UploadingViewProps) {
	if (error) {
		return (
			<div className="ht-fade-in-fast flex flex-col items-center gap-4 p-2.5 py-6">
				<p className="text-center text-sm text-destructive">{error}</p>
				<Button type="button" variant="secondary" size="sm" onClick={onRetry}>
					Try again
				</Button>
			</div>
		);
	}

	return (
		<div className="ht-fade-in-fast p-2.5">
			<div className="flex justify-center py-10">
				<CircularProgress value={progress} size={112} strokeWidth={8}>
					<span className="text-md font-medium tracking-[-0.02em] text-foreground">
						{Math.round(progress)}%
					</span>
				</CircularProgress>
			</div>

			<div className="mt-4 flex items-center justify-between">
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span
						className="ht-pulse-dot h-1.5 w-1.5 rounded-full bg-primary"
						aria-hidden="true"
					/>
					Uploading
				</div>
				<Button type="button" variant="secondary" size="sm" onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</div>
	);
}
