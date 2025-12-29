import { sendEmail } from "./resend";
import { InvitationEmail } from "../templates/invitation";

export const sendInvitationEmail = async ({
  email,
  organizationName,
  inviterName,
  inviterEmail,
  role,
  inviteLink,
}: {
  email: string;
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  role: string;
  inviteLink: string;
}) => {
  await sendEmail({
    to: email,
    subject: `You've been invited to join ${organizationName} on Flack`,
    react: InvitationEmail({
      email,
      organizationName,
      inviterName,
      inviterEmail,
      role,
      inviteLink,
    }),
  });
};
