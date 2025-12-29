import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { AcceptInvitationForm } from "./components/accept-invitation-form";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  // Get the invitation details
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) {
    notFound();
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.expiresAt) < new Date();

  // Check if invitation is already processed
  const isProcessed = invitation.status !== "pending";

  // Get current session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AcceptInvitationForm
      invitation={{
        id: invitation.id,
        email: invitation.email,
        role: invitation.role || "member",
        status: invitation.status,
        expiresAt: invitation.expiresAt.toISOString(),
        organization: invitation.organization,
        inviter: {
          name: invitation.user.name,
          email: invitation.user.email,
        },
      }}
      isExpired={isExpired}
      isProcessed={isProcessed}
      isAuthenticated={!!session}
      currentUserEmail={session?.user?.email}
    />
  );
}


