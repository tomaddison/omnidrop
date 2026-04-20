import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { type ReactNode, useCallback, useRef } from "react";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as
	| string
	| undefined;

// Sent when Turnstile is not configured. The server-side verifier treats this
// value (and a missing/"dev" secret) as a dev bypass.
const DEV_TURNSTILE_TOKEN = "dev";

const CONSUME_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 100;

type UseTurnstileToken = {
	widget: ReactNode;
	consume: () => Promise<string>;
};

// Renders an invisible Turnstile widget and exposes a single-shot `consume()`
// that waits for the next token and resets the widget afterwards.
export function useTurnstileToken(): UseTurnstileToken {
	const tokenRef = useRef<string | null>(null);
	const instanceRef = useRef<TurnstileInstance | null>(null);

	const consume = useCallback(async (): Promise<string> => {
		if (!TURNSTILE_SITE_KEY) return DEV_TURNSTILE_TOKEN;

		const start = Date.now();
		while (!tokenRef.current) {
			if (Date.now() - start > CONSUME_TIMEOUT_MS) {
				throw new Error("Bot check timed out. Please reload and try again.");
			}
			await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
		}

		const token = tokenRef.current;
		tokenRef.current = null;
		instanceRef.current?.reset();
		return token;
	}, []);

	const widget = TURNSTILE_SITE_KEY ? (
		<Turnstile
			ref={instanceRef}
			siteKey={TURNSTILE_SITE_KEY}
			options={{ size: "invisible" }}
			onSuccess={(token) => {
				tokenRef.current = token;
			}}
			onExpire={() => {
				tokenRef.current = null;
			}}
			onError={() => {
				tokenRef.current = null;
			}}
		/>
	) : null;

	return { widget, consume };
}
