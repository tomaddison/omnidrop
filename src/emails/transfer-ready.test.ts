import { render } from "@react-email/components";
import { describe, expect, it } from "vitest";
import { TransferReadyEmail } from "./transfer-ready";

describe("TransferReadyEmail", () => {
	it("escapes HTML in user-controlled message and title", async () => {
		const html = await render(
			TransferReadyEmail({
				senderEmail: "alice@example.com",
				title: '<script>alert("title")</script>',
				message: "<img src=x onerror=\"fetch('//evil')\">",
				files: [{ name: "report.pdf", size: 1024 }],
				downloadUrl: "https://omnidrop.example/d/abc123",
				expiresAt: new Date("2030-01-01").toISOString(),
				appUrl: "https://omnidrop.example",
			}),
		);
		expect(html).not.toMatch(/<script[\s>]/);
		expect(html).not.toMatch(/<img\s/);
		expect(html).toContain("&lt;script&gt;");
		expect(html).toContain("&lt;img");
	});
});
