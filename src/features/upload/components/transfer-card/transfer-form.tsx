import type { ReactNode } from "react";
import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TransferFormProvider } from "./form-context";
import { FormFields } from "./form-fields";
import { FormFiles } from "./form-files";
import { FormFooter } from "./form-footer";
import { FormRecipient } from "./form-recipient";

type TransferFormProps = {
	disabled: boolean;
	onSubmit: (event: React.FormEvent) => void;
	children: ReactNode;
};

function TransferFormRoot({ disabled, onSubmit, children }: TransferFormProps) {
	const contextValue = useMemo(() => ({ disabled }), [disabled]);

	return (
		<TransferFormProvider value={contextValue}>
			<TooltipProvider>
				<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
					{children}
				</form>
			</TooltipProvider>
		</TransferFormProvider>
	);
}

type BodyProps = {
	files: ReactNode;
	children: ReactNode;
};

function FormBody({ files, children }: BodyProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
			<ScrollArea className="flex min-h-0 flex-1 flex-col">
				<div className="p-2.5">{files}</div>
				<div className="flex flex-col px-4 pb-2">{children}</div>
			</ScrollArea>
		</div>
	);
}

export const TransferForm = Object.assign(TransferFormRoot, {
	Body: FormBody,
	Files: FormFiles,
	Recipient: FormRecipient,
	Fields: FormFields,
	Footer: FormFooter,
});
