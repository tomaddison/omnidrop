import {
	CheckmarkCircle02Icon,
	Clock01Icon,
	Copy01Icon,
	Mail01Icon,
	Tick01Icon,
	Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HI } from "@/components/ui/hi";
import { formatBytes, pluralizeFiles } from "@/lib/format";
import { cn } from "@/lib/utils";

type Summary = {
	filesCount: number;
	totalBytes: number;
	expiryLabel: string;
};

type LinkVariant = { variant: "link"; shareUrl: string };
type EmailVariant = { variant: "email"; recipientEmail: string };

type SuccessViewProps = Summary & {
	onNewTransfer: () => void;
} & (LinkVariant | EmailVariant);

export function SuccessView(props: SuccessViewProps) {
	return (
		<div className="om-fade-in flex h-full flex-col justify-between">
			<div className="mt-10 px-6 pt-6">
				<SuccessHeader {...props} />

				{props.variant === "link" ? (
					<ShareUrl url={props.shareUrl} />
				) : (
					<RecipientPill email={props.recipientEmail} />
				)}

				<ExpiryBadge expiryLabel={props.expiryLabel} />
			</div>

			<div className="p-2.5">
				<Button
					type="button"
					variant="secondary"
					size="xl"
					onClick={props.onNewTransfer}
					className="w-full"
				>
					Send another
				</Button>
			</div>
		</div>
	);
}

function SuccessHeader(props: Summary & (LinkVariant | EmailVariant)) {
	const isLink = props.variant === "link";
	return (
		<div className="flex flex-col items-center px-0 pt-2.5 pb-4">
			<div
				className={cn(
					"om-pop flex size-12 items-center justify-center rounded-full text-primary bg-emerald-800",
				)}
			>
				{isLink ? (
					<HI
						icon={Tick01Icon}
						size={24}
						strokeWidth={3}
						className="text-emerald-300"
					/>
				) : (
					<HI
						icon={Mail01Icon}
						size={24}
						strokeWidth={1.8}
						className="text-emerald-300"
					/>
				)}
			</div>
			<div className="mt-3.5 text-md font-medium tracking-[-0.01em] text-foreground">
				{isLink ? "Your transfer is ready" : "Transfer sent"}
			</div>
			<div className="mt-1 text-center text-sm text-muted-foreground">
				{!isLink && "1 recipient · "}
				{props.filesCount} {pluralizeFiles(props.filesCount)} ·{" "}
				{formatBytes(props.totalBytes)}
			</div>
		</div>
	);
}

function ShareUrl({ url }: { url: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard?.writeText(url);
		} catch (error) {
			console.warn("Clipboard write failed:", error);
		}
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1800);
	}

	return (
		<div className="flex items-center rounded-2xl bg-muted p-1.5">
			<div className="flex-1 truncate overflow-hidden px-2 font-mono text-sm text-foreground">
				{url}
			</div>
			<Button
				className={cn("rounded-lg group", copied && "pointer-events-none")}
				type="button"
				size="icon"
				onClick={copy}
				aria-label={copied ? "Link copied" : "Copy link"}
			>
				<span className="relative grid place-items-center group-active:scale-93">
					<HI
						icon={Copy01Icon}
						size={14}
						className={cn(
							"col-start-1 row-start-1 transition-all duration-150 ease-out",
							copied
								? "scale-50 opacity-0 blur-sm"
								: "delay-50 scale-100 opacity-100 blur-0",
						)}
					/>
					<HI
						icon={Tick02Icon}
						size={14}
						strokeWidth={2}
						className={cn(
							"col-start-1 row-start-1 transition-all duration-150 ease-out",
							copied
								? "delay-50 scale-100 opacity-100 blur-0"
								: "scale-50 opacity-0 blur-sm",
						)}
					/>
				</span>
			</Button>
		</div>
	);
}

function RecipientPill({ email }: { email: string }) {
	return (
		<div className="rounded-2xl bg-muted p-3">
			<div className="mb-2 text-xs text-muted-foreground">Sent to</div>
			<div className="flex items-center gap-2.5 text-sm text-foreground">
				<div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-2xs font-medium text-muted-foreground">
					{email.slice(0, 1).toUpperCase()}
				</div>
				<span className="flex-1 truncate">{email}</span>
				<HI
					icon={CheckmarkCircle02Icon}
					size={14}
					strokeWidth={2}
					className="text-emerald-300"
				/>
			</div>
		</div>
	);
}

function ExpiryBadge({ expiryLabel }: { expiryLabel: string }) {
	return (
		<div className="mt-3.5 flex flex-wrap gap-2">
			<div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium">
				<HI icon={Clock01Icon} size={12} />
				Expires in {expiryLabel}
			</div>
		</div>
	);
}
