import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { Button } from "#/components/ui/button";
import { HI } from "#/components/ui/hi";
import { useTransferFormContext } from "./form-context";

type FormFooterProps = {
	ready: boolean;
	error: string | null;
	submitLabel: string;
	showSubmitArrow?: boolean;
	children: ReactNode;
};

export function FormFooter({
	ready,
	error,
	submitLabel,
	showSubmitArrow = true,
	children,
}: FormFooterProps) {
	const { disabled } = useTransferFormContext();

	return (
		<div className="border-t p-2.5">
			<div className="flex shrink-0 items-center gap-2">{children}</div>
			{error && (
				<p className="p-2 bg-destructive/10 rounded-lg mt-3 shrink-0 text-xs text-destructive">
					{error}
				</p>
			)}
			<Button
				type="submit"
				size="xl"
				disabled={!ready || disabled}
				className="mt-3.5 w-full shrink-0"
			>
				{submitLabel}
				{ready && !disabled && showSubmitArrow && (
					<HI icon={ArrowRight01Icon} size={16} strokeWidth={2} />
				)}
			</Button>
		</div>
	);
}
