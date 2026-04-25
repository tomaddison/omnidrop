import { MAX_TRANSFER_GB } from "#/features/upload/utils";
import { cn } from "#/lib/utils";

export function HeroCopy({ className }: { className?: string }) {
	return (
		<div
			className={cn("om-fade-in max-w-[600px] flex-1 px-6 md:px-14", className)}
		>
			<h1 className="m-0 text-[56px] leading-[1.02] text-fg-0 md:text-[68px]">
				<span className="font-medium tracking-tighter">Send anything.</span>
				<br />
				<span className="font-handwritten">Fast.</span>
			</h1>
			<p className="mt-6 max-w-[600px] text-base leading-[1.55] text-fg-2">
				Secure file transfers for everybody. Up to {MAX_TRANSFER_GB}&nbsp;GB per
				link.
			</p>
		</div>
	);
}
