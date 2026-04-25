import type { Ref } from "react";
import { cn } from "#/lib/utils";
import { useTransferFormContext } from "./form-context";
import { InputRow } from "./input-row";

type FormRecipientProps = {
	show: boolean;
	value: string;
	onChange: (value: string) => void;
	anchorRef?: Ref<HTMLDivElement>;
};

// Animated collapse: grid-rows transition from 0fr to 1fr lets the row slide
// open without knowing its content height up-front.
export function FormRecipient({
	show,
	value,
	onChange,
	anchorRef,
}: FormRecipientProps) {
	const { disabled } = useTransferFormContext();

	return (
		<div
			className={cn(
				"grid shrink-0 transition-all duration-250",
				show
					? "grid-rows-[1fr] opacity-100 scale-100"
					: "grid-rows-[0fr] opacity-0 scale-95",
			)}
			aria-hidden={!show}
			inert={!show}
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
						anchorRef={anchorRef}
					/>
				</div>
			</div>
		</div>
	);
}
