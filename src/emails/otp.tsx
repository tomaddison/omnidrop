import {
	Body,
	Container,
	Head,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

type OtpEmailProps = {
	code: string;
	email: string;
	appUrl: string;
};

export function OtpEmail({ code, email, appUrl }: OtpEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Your Omnidrop verification code is {code}</Preview>
			<Tailwind>
				<Body className="font-sans">
					<Container className="mx-auto max-w-[480px] px-6 py-10">
						<Text className="text-[24px] font-bold mb-6 font-stretch-130%">
							<Link href={appUrl} className="text-black no-underline">
								Omnidrop
							</Link>
						</Text>
						<Text className="mb-6 text-[15px] leading-6 text-black">
							Use the code below to verify your email address and continue your
							file transfer. This code expires in 10 minutes.
						</Text>
						<Section className="mb-6 px-6 py-6 text-center">
							<Text className="m-0 text-4xl font-bold tracking-[10px] text-black">
								{code}
							</Text>
						</Section>
						<Text className="mb-6 text-[13px] leading-5 text-black">
							Requested by{" "}
							<span className="font-medium text-black">{email}</span>. If this
							wasn't you, you can safely ignore this email.
						</Text>
						<Text className="m-0 text-[11px] text-gray-500">
							<Link
								href={`${appUrl}/privacy`}
								className="text-gray-500 underline"
							>
								Privacy
							</Link>
							<span> · </span>
							<Link
								href={`${appUrl}/terms`}
								className="text-gray-500 underline"
							>
								Terms
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

OtpEmail.PreviewProps = {
	code: "123456",
	email: "you@example.com",
	appUrl: "https://omnidrop.example.com",
} satisfies OtpEmailProps;

export default OtpEmail;
