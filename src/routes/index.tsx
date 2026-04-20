import { Download01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { HI } from "#/components/ui/hi";
import { FullBleedBackdrop } from "#/features/branding/fullbleed-backdrop";
import type { Layout } from "#/features/branding/hero";
import { Stage } from "#/features/branding/stage";
import { TopBar } from "#/features/branding/top-bar";
import { TransferCard } from "#/features/upload/components/transfer-card";
import type { UploadEntry } from "#/features/upload/types";
import { walkDataTransferItems } from "#/features/upload/utils";

export const Route = createFileRoute("/")({ component: HomePage });

const LAYOUT_KEY = "ht_layout";
const LAYOUT_VALUES: Layout[] = ["centered", "left", "fullbleed"];

function readInitialLayout(): Layout {
	if (typeof window === "undefined") return "centered";
	try {
		const stored = window.localStorage.getItem(LAYOUT_KEY);
		if (stored && (LAYOUT_VALUES as string[]).includes(stored)) {
			return stored as Layout;
		}
	} catch {}
	return "centered";
}

function HomePage() {
	const [layout] = useState<Layout>(readInitialLayout);
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
		<div className="relative min-h-screen">
			<FullBleedBackdrop layout={layout} />
			<TopBar />

			<Stage layout={layout}>
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
					className="ht-fade-in-fast pointer-events-none fixed inset-4 z-90 flex items-center justify-center rounded-3xl backdrop-blur-[2px]"
					style={{
						border: "2px dashed var(--accent-raw)",
						background: "rgba(255,255,255,0.04)",
					}}
					aria-hidden="true"
				>
					<div className="flex items-center gap-3 rounded-full bg-surface-2 px-5 py-3 text-[15px] font-medium text-fg-0">
						<HI icon={Download01Icon} size={18} strokeWidth={1.8} />
						Drop anywhere to add
					</div>
				</div>
			)}
		</div>
	);
}
