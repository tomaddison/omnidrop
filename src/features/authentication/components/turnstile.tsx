import type { Ref } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";

type TurnstileApi = {
	render: (
		el: HTMLElement,
		opts: {
			sitekey: string;
			callback: (token: string) => void;
			"error-callback"?: () => void;
			"expired-callback"?: () => void;
			execution?: "render" | "execute";
		},
	) => string;
	remove: (id: string) => void;
	reset: (id: string) => void;
	execute: (id: string) => void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

const SCRIPT_SRC =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
	if (typeof window === "undefined") return Promise.resolve();
	if (window.turnstile) return Promise.resolve();
	if (scriptPromise) return scriptPromise;
	scriptPromise = new Promise<void>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = SCRIPT_SRC;
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error("Failed to load Turnstile"));
		document.head.appendChild(script);
	});
	return scriptPromise;
}

export type TurnstileHandle = {
	getToken: () => Promise<string>;
};

export function Turnstile({ ref }: { ref?: Ref<TurnstileHandle> }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const pendingRef = useRef<{
		resolve: (t: string) => void;
		reject: (e: Error) => void;
	} | null>(null);

	useEffect(() => {
		const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
		if (!sitekey) {
			console.warn("VITE_TURNSTILE_SITE_KEY is not set; captcha disabled");
			return;
		}
		let cancelled = false;
		loadScript()
			.then(() => {
				if (cancelled || !containerRef.current || !window.turnstile) return;
				widgetIdRef.current = window.turnstile.render(containerRef.current, {
					sitekey,
					execution: "execute",
					callback: (token) => {
						pendingRef.current?.resolve(token);
						pendingRef.current = null;
					},
					"error-callback": () => {
						pendingRef.current?.reject(new Error("Verification failed."));
						pendingRef.current = null;
					},
					"expired-callback": () => {
						if (widgetIdRef.current && window.turnstile) {
							window.turnstile.reset(widgetIdRef.current);
						}
					},
				});
			})
			.catch(() =>
				pendingRef.current?.reject(new Error("Captcha unavailable.")),
			);

		return () => {
			cancelled = true;
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.remove(widgetIdRef.current);
				widgetIdRef.current = null;
			}
		};
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			getToken: () =>
				new Promise<string>((resolve, reject) => {
					if (!widgetIdRef.current || !window.turnstile) {
						reject(new Error("Captcha not ready. Refresh and try again."));
						return;
					}
					pendingRef.current = { resolve, reject };
					window.turnstile.reset(widgetIdRef.current);
					window.turnstile.execute(widgetIdRef.current);
				}),
		}),
		[],
	);

	return <div ref={containerRef} />;
}
