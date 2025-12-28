"use server";

import { z } from "zod";
import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const resendInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
});

export const resendInvitation = orgActionClient
  .metadata({ actionName: "resendInvitation" })
  .schema(resendInvitationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { invitationId } = parsedInput;
    const { organizationId, memberRole } = ctx;

    // Only owners and admins can resend invitations
    if (memberRole !== "owner" && memberRole !== "admin") {
      throw new ActionError("You don't have permission to resend invitations");
    }

    // Get the existing invitation
    const invitation = await db.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new ActionError("Invitation not found");
    }

    if (invitation.organizationId !== organizationId) {
      throw new ActionError("Invitation not found");
    }

    if (invitation.status !== "pending") {
      throw new ActionError("Can only resend pending invitations");
    }

    try {
      // Create a new invitation with resend flag
      const result = await auth.api.createInvitation({
        headers: await headers(),
        body: {
          email: invitation.email,
          role: invitation.role as "member" | "admin" | "owner",
          organizationId,
          resend: true,
        },
      });

      return { 
        success: true,
        invitation: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ActionError(error.message);
      }
      throw new ActionError("Failed to resend invitation");
    }
  });

