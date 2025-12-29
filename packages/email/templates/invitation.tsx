import {
  Body,
  Button,
  Container,
  Font,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";

interface Props {
  email: string;
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  inviteLink: string;
}

export const InvitationEmail = ({
  email,
  organizationName,
  inviterName,
  inviterEmail,
  role,
  inviteLink,
}: Props) => {
  return (
    <Html>
      <Tailwind>
        <head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://app.trycomp.ai/fonts/geist/geist-sans-latin-400-normal.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://app.trycomp.ai/fonts/geist/geist-sans-latin-500-normal.woff2",
              format: "woff2",
            }}
            fontWeight={500}
            fontStyle="normal"
          />
        </head>

        <Preview>
          You&apos;ve been invited to join {organizationName} on Flack
        </Preview>

        <Body className="mx-auto my-auto bg-[#fff] font-sans">
          <Container
            className="mx-auto my-[40px] max-w-[600px] border-transparent p-[20px] md:border-[#E8E7E1]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo />
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-[#121212]">
              Join {organizationName} on Flack
            </Heading>

            <Text className="text-[14px] leading-[24px] text-[#121212]">
              Hey there,
              <br />
              <br />
              {inviterName} ({inviterEmail}) has invited you to join{" "}
              <strong>{organizationName}</strong> as a {role}.
            </Text>

            <Section className="my-[32px] text-center">
              <Button
                className="rounded-md bg-[#121212] px-[20px] py-[12px] text-center text-[14px] font-medium text-white no-underline"
                href={inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px] text-[#121212]">
              If you weren&apos;t expecting this invitation, you can safely
              ignore this email.
            </Text>

            <br />
            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                This invitation was sent to{" "}
                <span className="text-[#121212]">{email}</span> and expires in 7
                days.
              </Text>
            </Section>

            <br />

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
