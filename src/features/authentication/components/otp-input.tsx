import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyLoginOtp } from "@/features/authentication/data/server/verify-otp";

const OTP_LENGTH = 6;

type OtpInputProps = {
	email: string;
	onSuccess: () => void;
	onBack: () => void;
};

export function OtpInput({ email, onSuccess, onBack }: OtpInputProps) {
	const [code, setCode] = useState("");
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (code.length < OTP_LENGTH) return;
		setIsPending(true);
		setError(null);
		try {
			await verifyLoginOtp({ data: { email, token: code } });
			onSuccess();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong.");
		} finally {
			setIsPending(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
			<div className="flex flex-col items-center gap-6">
				<p className="text-sm text-muted-foreground">
					We sent a 6-digit code to{" "}
					<span className="font-medium text-foreground">{email}</span>
				</p>
				<InputOTP
					maxLength={OTP_LENGTH}
					pattern={REGEXP_ONLY_DIGITS}
					value={code}
					onChange={setCode}
					disabled={isPending}
				>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
			</div>
			{error && (
				<p className="bg-destructive/10 p-1 rounded-md px-3 text-xs text-destructive">
					{error}
				</p>
			)}
			<Button
				type="submit"
				size={"lg"}
				disabled={code.length < OTP_LENGTH}
				isLoading={isPending}
				className="w-full"
			>
				Verify code
			</Button>
			<Button
				type="button"
				variant="link"
				size="sm"
				onClick={onBack}
				className="text-muted-foreground"
			>
				Use a different email
			</Button>
		</form>
	);
}
