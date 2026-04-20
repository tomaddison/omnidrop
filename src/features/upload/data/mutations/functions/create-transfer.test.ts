import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
	createServerFn: () => ({
		inputValidator: () => ({ handler: vi.fn() }),
	}),
}));

vi.mock("#/features/security/server/guard", () => ({
	applyGuards: vi.fn(),
	extractIp: vi.fn(),
}));

vi.mock("../../../../../../supabase/utils/server", () => ({
	createServiceClient: vi.fn(),
}));

import { schema } from "./create-transfer";

const VALID_FILE = { name: "file.txt", relativePath: "file.txt", size: 100 };

const BASE = {
	token: "tok",
	turnstileToken: "ts",
	mode: "link" as const,
	expiryDays: 3,
	files: [VALID_FILE],
};

describe("createTransfer schema", () => {
	it("accepts a valid link-mode transfer", () => {
		expect(schema.safeParse(BASE).success).toBe(true);
	});

	it("accepts a valid email-mode transfer with a recipient", () => {
		const input = { ...BASE, mode: "email" as const, recipientEmail: "r@example.com" };
		expect(schema.safeParse(input).success).toBe(true);
	});

	it("rejects email mode when recipientEmail is absent", () => {
		const input = { ...BASE, mode: "email" as const };
		const result = schema.safeParse(input);
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((i) => i.path.join("."));
			expect(paths).toContain("recipientEmail");
		}
	});

	it("rejects more than 250 files", () => {
		const input = { ...BASE, files: Array.from({ length: 251 }, () => VALID_FILE) };
		expect(schema.safeParse(input).success).toBe(false);
	});

	it("accepts exactly 250 files", () => {
		const input = { ...BASE, files: Array.from({ length: 250 }, () => VALID_FILE) };
		expect(schema.safeParse(input).success).toBe(true);
	});

	it("rejects a total file size exceeding 2 GB", () => {
		const GB = 1024 ** 3;
		const input = {
			...BASE,
			files: [
				{ name: "a.bin", relativePath: "a.bin", size: GB },
				{ name: "b.bin", relativePath: "b.bin", size: GB + 1 },
			],
		};
		expect(schema.safeParse(input).success).toBe(false);
	});

	it("rejects expiryDays outside 1–7", () => {
		expect(schema.safeParse({ ...BASE, expiryDays: 0 }).success).toBe(false);
		expect(schema.safeParse({ ...BASE, expiryDays: 8 }).success).toBe(false);
	});
});
