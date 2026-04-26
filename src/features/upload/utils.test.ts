import { describe, expect, it } from "vitest";
import { shouldSkipBasename, validateRelativePath } from "./utils";

describe("validateRelativePath", () => {
	it("accepts a bare filename", () => {
		expect(validateRelativePath("photo.jpg").ok).toBe(true);
	});

	it("accepts a nested path", () => {
		expect(validateRelativePath("vacation/day1/photo.jpg").ok).toBe(true);
	});

	it("rejects empty", () => {
		expect(validateRelativePath("").ok).toBe(false);
	});

	it("rejects whitespace-only", () => {
		expect(validateRelativePath("   ").ok).toBe(false);
	});

	it("rejects a path with a `..` segment", () => {
		expect(validateRelativePath("../etc/passwd").ok).toBe(false);
		expect(validateRelativePath("a/../b").ok).toBe(false);
	});

	it("rejects a path with a `.` segment", () => {
		expect(validateRelativePath("./foo").ok).toBe(false);
		expect(validateRelativePath("a/./b").ok).toBe(false);
	});

	it("rejects a leading slash", () => {
		expect(validateRelativePath("/abs").ok).toBe(false);
	});

	it("rejects a Windows drive prefix", () => {
		expect(validateRelativePath("C:/foo").ok).toBe(false);
	});

	it("rejects a backslash", () => {
		expect(validateRelativePath("a\\b").ok).toBe(false);
	});

	it("rejects a null byte", () => {
		expect(validateRelativePath("foo\x00bar").ok).toBe(false);
	});

	it("rejects a control char", () => {
		expect(validateRelativePath("foo\x01bar").ok).toBe(false);
	});

	it("rejects an empty segment (double slash)", () => {
		expect(validateRelativePath("a//b").ok).toBe(false);
	});

	it("rejects a trailing slash", () => {
		expect(validateRelativePath("a/b/").ok).toBe(false);
	});

	it("rejects a path longer than 1024 chars", () => {
		const long = `${"a".repeat(1025)}`;
		expect(validateRelativePath(long).ok).toBe(false);
	});

	it("rejects a single segment longer than 255 chars", () => {
		const seg = "a".repeat(256);
		expect(validateRelativePath(seg).ok).toBe(false);
	});

	it("rejects depth greater than 32", () => {
		const deep = `${Array.from({ length: 33 }, (_, i) => `d${i}`).join("/")}/file.txt`;
		expect(validateRelativePath(deep).ok).toBe(false);
	});

	it("accepts depth at the limit", () => {
		const segs = Array.from({ length: 31 }, (_, i) => `d${i}`);
		segs.push("file.txt");
		expect(validateRelativePath(segs.join("/")).ok).toBe(true);
	});

	it("rejects a right-to-left override character", () => {
		expect(validateRelativePath("report\u202Efdp.exe").ok).toBe(false);
	});

	it("rejects a left-to-right override character", () => {
		expect(validateRelativePath("file\u202Dname.txt").ok).toBe(false);
	});

	it("rejects a zero-width space", () => {
		expect(validateRelativePath("file\u200Bname.txt").ok).toBe(false);
	});

	it("accepts normal unicode in filenames", () => {
		expect(validateRelativePath("café.txt").ok).toBe(true);
		expect(validateRelativePath("日本語/ファイル.pdf").ok).toBe(true);
	});
});

describe("shouldSkipBasename", () => {
	it("skips .DS_Store", () => {
		expect(shouldSkipBasename(".DS_Store")).toBe(true);
	});

	it("skips Thumbs.db", () => {
		expect(shouldSkipBasename("Thumbs.db")).toBe(true);
	});

	it("skips desktop.ini", () => {
		expect(shouldSkipBasename("desktop.ini")).toBe(true);
	});

	it("does not skip a regular file", () => {
		expect(shouldSkipBasename("photo.jpg")).toBe(false);
	});
});
