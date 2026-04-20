import { createContext, useContext } from "react";

type TransferFormContextValue = {
	disabled: boolean;
};

const TransferFormContext = createContext<TransferFormContextValue | null>(
	null,
);

export const TransferFormProvider = TransferFormContext.Provider;

export function useTransferFormContext(): TransferFormContextValue {
	const ctx = useContext(TransferFormContext);
	if (!ctx) {
		throw new Error(
			"TransferForm subcomponents must be rendered inside <TransferForm>.",
		);
	}
	return ctx;
}
