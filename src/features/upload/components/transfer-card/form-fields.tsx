import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import type { Ref } from "react";
import { HI } from "#/components/ui/hi";
import { useTransferFormContext } from "./form-context";
import { InputRow } from "./input-row";

type FormFieldsProps = {
	yourEmail: string;
	onYourEmailChange: (value: string) => void;
	yourEmailLocked?: boolean;
	title: string;
	onTitleChange: (value: string) => void;
	message: string;
	onMessageChange: (value: string) => void;
	yourEmailAnchorRef?: Ref<HTMLDivElement>;
};

export function FormFields({
	yourEmail,
	onYourEmailChange,
	yourEmailLocked,
	title,
	onTitleChange,
	message,
	onMessageChange,
	yourEmailAnchorRef,
}: FormFieldsProps) {
	const { disabled } = useTransferFormContext();

	return (
		<>
			<div className="shrink-0 relative">
				<InputRow
					type="email"
					placeholder="Your email"
					value={yourEmail}
					onChange={onYourEmailChange}
					disabled={disabled}
					readOnly={yourEmailLocked}
					required
					anchorRef={yourEmailAnchorRef}
				/>
				{yourEmailLocked && (
					<HI
						icon={CheckmarkCircle02Icon}
						aria-label="Signed in"
						className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 size-4 text-emerald-300"
					/>
				)}
			</div>
			<div className="mt-2 shrink-0">
				<InputRow
					placeholder="Title"
					value={title}
					onChange={onTitleChange}
					disabled={disabled}
				/>
			</div>
			<div className="mt-2">
				<InputRow
					placeholder="Message"
					value={message}
					onChange={onMessageChange}
					disabled={disabled}
					multiline
				/>
			</div>
		</>
	);
}
