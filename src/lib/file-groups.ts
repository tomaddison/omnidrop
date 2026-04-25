export type FileGroup<T> =
	| { kind: "file"; item: T }
	| { kind: "folder"; folder: string; count: number; bytes: number };

export function groupByTopFolder<T>(
	items: T[],
	getPath: (item: T) => string,
	getSize: (item: T) => number,
): FileGroup<T>[] {
	type Agg = { count: number; bytes: number };
	const folders = new Map<string, Agg>();
	const order: (string | T)[] = [];

	for (const item of items) {
		const path = getPath(item);
		const slash = path.indexOf("/");
		if (slash === -1) {
			order.push(item);
			continue;
		}
		const folder = path.slice(0, slash);
		const existing = folders.get(folder);
		if (existing) {
			existing.count += 1;
			existing.bytes += getSize(item);
		} else {
			folders.set(folder, { count: 1, bytes: getSize(item) });
			order.push(folder);
		}
	}

	return order.map((entry) => {
		if (typeof entry === "string") {
			const agg = folders.get(entry) ?? { count: 0, bytes: 0 };
			return {
				kind: "folder",
				folder: entry,
				count: agg.count,
				bytes: agg.bytes,
			};
		}
		return { kind: "file", item: entry };
	});
}
