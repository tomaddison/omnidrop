import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const config = defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const host = env.VITE_APP_URL?.replace(/\/$/, "");
	return {
		resolve: { tsconfigPaths: true },
		plugins: [
			devtools(),
			tailwindcss(),
			tanstackStart({
				prerender: { enabled: true, crawlLinks: true },
				sitemap: host ? { enabled: true, host } : undefined,
			}),
			viteReact(),
		],
	};
});

export default config;
