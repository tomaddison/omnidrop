import { cn } from "#/lib/utils";
import { useTransferFormContext } from "./form-context";
import { InputRow } from "./input-row";

type FormRecipientProps = {
	show: boolean;
	value: string;
	onChange: (value: string) => void;
};

// Animated collapse: grid-rows transition from 0fr to 1fr lets the row slide
// open without knowing its content height up-front.
export function FormRecipient({ show, value, onChange }: FormRecipientProps) {
	const { disabled } = useTransferFormContext();

	return (
		<div
			className={cn(
				"grid shrink-0 transition-[grid-template-rows] duration-300 ease-out",
				show ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
			)}
			aria-hidden={!show}
			// @ts-expect-error inert is a valid HTML attribute
			inert={!show ? "" : undefined}
		>
			<div className="overflow-hidden">
				<div className="pb-2">
					<InputRow
						type="email"
						placeholder="Email to"
						value={value}
						onChange={onChange}
						disabled={disabled}
						required={show}
					/>
				</div>
			</div>
		</div>
	);
}
