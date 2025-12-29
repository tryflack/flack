import { sendEmail } from "./resend";
import { OTPVerificationEmail } from "../templates/otp";

export const sendVerificationEmail = async ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) => {
  await sendEmail({
    to: email,
    subject: "Verify your email for Flack",
    react: OTPVerificationEmail({ email, otp }),
  });
};
