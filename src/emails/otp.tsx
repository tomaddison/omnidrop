import {
	Body,
	Container,
	Head,
	Heading,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

type OtpEmailProps = {
	code: string;
};

export function OtpEmail({ code }: OtpEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Your Omnidrop verification code is {code}</Preview>
			<Tailwind>
				<Body className="bg-[#f6f9f3] font-sans">
					<Container className="mx-auto max-w-[480px] px-6 py-10">
						<Heading className="mb-4 text-2xl font-semibold text-[#1a1f16]">
							Omnidrop
						</Heading>
						<Text className="mb-6 text-[15px] leading-6 text-[#4a5240]">
							Use the code below to verify your email address and start your
							file transfer. This code expires in 10 minutes.
						</Text>
						<Section className="mb-6 rounded-[10px] border border-[#dde8d8] bg-white px-6 py-6 text-center">
							<Text className="m-0 text-4xl font-bold tracking-[12px] text-[#1a1f16]">
								{code}
							</Text>
						</Section>
						<Hr className="mb-4 border-[#dde8d8]" />
						<Text className="m-0 text-[13px] text-[#8a9480]">
							If you did not request this code, you can safely ignore this
							email.
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}
