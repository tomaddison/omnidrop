import type { ReactNode } from "react";
import { useMemo } from "react";
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
			<form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
				{children}
			</form>
		</TransferFormProvider>
	);
}

type BodyProps = {
	files: ReactNode;
	children: ReactNode;
};

function FormBody({ files, children }: BodyProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col p-2.5">
			<div className="shrink-0">{files}</div>
			<div className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
				{children}
			</div>
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
