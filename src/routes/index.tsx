import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Stage } from "#/features/branding/stage";
import { TopBar } from "#/features/branding/top-bar";
import { absoluteUrl, getOrigin, SITE } from "#/features/seo/config";
import { jsonLdScript, webApplicationSchema } from "#/features/seo/schema";
import { TransferCard } from "#/features/upload/components/transfer-card";
import type { UploadEntry } from "#/features/upload/types";
import { walkDataTransferItems } from "#/features/upload/utils";

const LANDING_TITLE = `${SITE.name} | ${SITE.tagline}`;

export const Route = createFileRoute("/")({
	component: HomePage,
	head: () => {
		const origin = getOrigin();
		const canonical = absoluteUrl("/");
		return {
			meta: [
				{ title: LANDING_TITLE },
				{ property: "og:title", content: LANDING_TITLE },
				{ name: "twitter:title", content: LANDING_TITLE },
				...(origin ? [{ property: "og:url", content: canonical }] : []),
			],
			links: origin ? [{ rel: "canonical", href: canonical }] : [],
			scripts: [jsonLdScript(webApplicationSchema())],
		};
	},
});

function HomePage() {
	const [dragging, setDragging] = useState(false);
	const [entries, setEntries] = useState<UploadEntry[]>([]);

	const dragCounterRef = useRef(0);

	const addEntries = useCallback((newEntries: UploadEntry[]) => {
		setEntries((prev) => {
			const seen = new Set(prev.map((entry) => entry.relativePath));
			return [
				...prev,
				...newEntries.filter((entry) => !seen.has(entry.relativePath)),
			];
		});
	}, []);

	const removeEntry = useCallback((relativePath: string) => {
		setEntries((prev) =>
			prev.filter((entry) => entry.relativePath !== relativePath),
		);
	}, []);

	const removeFolder = useCallback((folder: string) => {
		const prefix = `${folder}/`;
		setEntries((prev) =>
			prev.filter((entry) => !entry.relativePath.startsWith(prefix)),
		);
	}, []);

	const clearEntries = useCallback(() => setEntries([]), []);

	useEffect(() => {
		function hasFiles(event: DragEvent) {
			const types = event.dataTransfer?.types;
			if (!types) return false;
			for (let i = 0; i < types.length; i++) {
				if (types[i] === "Files") return true;
			}
			return false;
		}

		function onEnter(event: DragEvent) {
			if (!hasFiles(event)) return;
			dragCounterRef.current += 1;
			setDragging(true);
		}
		function onOver(event: DragEvent) {
			if (hasFiles(event)) event.preventDefault();
		}
		function onLeave() {
			dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
			if (dragCounterRef.current === 0) setDragging(false);
		}
		async function onDrop(event: DragEvent) {
			if (!hasFiles(event)) return;
			event.preventDefault();
			dragCounterRef.current = 0;
			setDragging(false);
			const items = event.dataTransfer?.items;
			if (!items || items.length === 0) return;
			const dropped = await walkDataTransferItems(items);
			if (dropped.length > 0) addEntries(dropped);
		}

		window.addEventListener("dragenter", onEnter);
		window.addEventListener("dragover", onOver);
		window.addEventListener("dragleave", onLeave);
		window.addEventListener("drop", onDrop);
		return () => {
			window.removeEventListener("dragenter", onEnter);
			window.removeEventListener("dragover", onOver);
			window.removeEventListener("dragleave", onLeave);
			window.removeEventListener("drop", onDrop);
		};
	}, [addEntries]);

	return (
		<div className="relative">
			<TopBar />

			<Stage>
				<TransferCard
					entries={entries}
					addEntries={addEntries}
					removeEntry={removeEntry}
					removeFolder={removeFolder}
					clearEntries={clearEntries}
				/>
			</Stage>

			{dragging && (
				<div
					className="om-fade-in-fast pointer-events-none fixed inset-4 z-90 flex items-end justify-center rounded-3xl backdrop-blur-[2px]"
					style={{
						border: "2px dashed var(--accent-raw)",
						background: "rgba(255,255,255,0.04)",
					}}
					aria-hidden="true"
				>
					<div className="flex items-center animate-in slide-in-from-bottom-10 zoom-in-85 fade-in-0 gap-3 mb-20 rounded-full bg-surface-2 px-5 py-3 text-[15px] font-medium text-fg-0">
						Drop to add items
					</div>
				</div>
			)}
		</div>
	);
}
