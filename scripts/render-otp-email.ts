import { render } from "@react-email/components";
import { OtpEmail } from "../src/emails/otp";

const appUrl = process.env.VITE_APP_URL ?? "";

// Emit Supabase Auth template placeholders verbatim — substituted at send time.
const html = await render(
	OtpEmail({
		code: "{{ .Token }}",
		email: "{{ .Email }}",
		appUrl,
	}),
);
process.stdout.write(html);
