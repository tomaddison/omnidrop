import { useId, useState } from "react";
import { cn } from "#/lib/utils";

type InputRowProps = {
	placeholder: string;
	value: string;
	onChange: (value: string) => void;
	type?: string;
	multiline?: boolean;
	grow?: boolean;
	disabled?: boolean;
	required?: boolean;
};

export function InputRow({
	placeholder,
	value,
	onChange,
	type = "text",
	multiline,
	grow,
	disabled,
	required,
}: InputRowProps) {
	const id = useId();
	const [focused, setFocused] = useState(false);
	const floated = focused || value.length > 0;

	const commonProps = {
		id,
		value,
		onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			onChange(e.target.value),
		onFocus: () => setFocused(true),
		onBlur: () => setFocused(false),
		disabled,
		required,
		placeholder: " ",
		className:
			"peer w-full bg-transparent px-0 pt-5 pb-1.5 text-sm text-foreground outline-none disabled:opacity-50",
	};

	return (
		<div className={cn("relative", grow && "flex h-full flex-col")}>
			{multiline ? (
				<textarea
					rows={2}
					{...commonProps}
					className={cn(commonProps.className, "resize-none", grow && "flex-1")}
				/>
			) : (
				<input type={type} {...commonProps} />
			)}
			<label
				htmlFor={id}
				className={cn(
					"pointer-events-none absolute left-0 origin-left text-muted-foreground transition-all duration-150",
					floated
						? "top-1 text-xs"
						: multiline
							? "top-[22px] text-sm"
							: "top-1/2 -translate-y-1/2 text-sm",
				)}
			>
				{placeholder}
			</label>
		</div>
	);
}
