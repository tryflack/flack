import { Resend } from "resend";
import { env } from "./env";

export const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactNode;
}) => {
  if (!resend || !env.FROM_ADDRESS) {
    console.log("Resend is not initialized");
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: env.FROM_ADDRESS,
      to,
      replyTo: env.FROM_ADDRESS,
      subject,
      react,
    });

    if (error) {
      console.error("Error sending email:", error);
      return;
    }

    return {
      messageId: data?.id,
      message: "Email sent successfully",
      success: true,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
