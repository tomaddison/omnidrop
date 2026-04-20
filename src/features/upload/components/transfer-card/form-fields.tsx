import { useTransferFormContext } from "./form-context";
import { InputRow } from "./input-row";

type FormFieldsProps = {
	yourEmail: string;
	onYourEmailChange: (value: string) => void;
	title: string;
	onTitleChange: (value: string) => void;
	message: string;
	onMessageChange: (value: string) => void;
};

export function FormFields({
	yourEmail,
	onYourEmailChange,
	title,
	onTitleChange,
	message,
	onMessageChange,
}: FormFieldsProps) {
	const { disabled } = useTransferFormContext();

	return (
		<>
			<div className="shrink-0">
				<InputRow
					type="email"
					placeholder="Your email"
					value={yourEmail}
					onChange={onYourEmailChange}
					disabled={disabled}
					required
				/>
			</div>
			<div className="mt-2 shrink-0">
				<InputRow
					placeholder="Title (optional)"
					value={title}
					onChange={onTitleChange}
					disabled={disabled}
				/>
			</div>
			<div className="mt-2 flex flex-1 flex-col">
				<InputRow
					placeholder="Message (optional)"
					value={message}
					onChange={onMessageChange}
					disabled={disabled}
					multiline
					grow
				/>
			</div>
		</>
	);
}
