import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { type ReactNode, type RefObject, useState } from "react";
import { Button } from "#/components/ui/button";
import { HI } from "#/components/ui/hi";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { useTransferFormContext } from "./form-context";
import type { FormError } from "./validation";

type FormFooterProps = {
	formError: FormError;
	formErrorAnchorRef: RefObject<HTMLElement | null> | null;
	error: string | null;
	submitLabel: string;
	isLoading?: boolean;
	children: ReactNode;
};

export function FormFooter({
	formError,
	formErrorAnchorRef,
	error,
	submitLabel,
	isLoading = false,
	children,
}: FormFooterProps) {
	const { disabled } = useTransferFormContext();
	const [formErrorOpen, setFormErrorOpen] = useState(false);

	// Close popover when error clears
	const hasError = formError !== null;
	const [prevHasError, setPrevHasError] = useState(hasError);
	if (hasError !== prevHasError) {
		setPrevHasError(hasError);
		if (!hasError) setFormErrorOpen(false);
	}

	function handleSubmitClick(event: React.MouseEvent<HTMLButtonElement>) {
		if (formError !== null) event.preventDefault();
	}

	return (
		<div className="border-t p-2.5">
			<div className="flex shrink-0 items-center gap-2">{children}</div>
			{error && (
				<p className="p-2 bg-destructive/10 rounded-lg mt-3 shrink-0 text-xs text-destructive">
					{error}
				</p>
			)}
			<Popover
				open={formErrorOpen}
				onOpenChange={(next) => {
					if (next && formError === null) return;
					setFormErrorOpen(next);
				}}
			>
				<PopoverTrigger
					render={
						<Button
							type="submit"
							size="xl"
							disabled={disabled}
							isLoading={isLoading}
							onClick={handleSubmitClick}
							className="mt-3.5 w-full shrink-0"
						/>
					}
				>
					{submitLabel}
				</PopoverTrigger>
				{formError !== null && (
					<PopoverContent
						side="right"
						align="center"
						sideOffset={14}
						anchor={formErrorAnchorRef ?? undefined}
						className="w-64 p-5 text-center"
					>
						<div className="flex flex-col items-center gap-3">
							<HI
								icon={AlertCircleIcon}
								size={24}
								strokeWidth={1.75}
								className="text-muted-foreground"
							/>
							<p className="text-sm text-popover-foreground leading-snug">
								{formError.message}
							</p>
						</div>
					</PopoverContent>
				)}
			</Popover>
		</div>
	);
}
