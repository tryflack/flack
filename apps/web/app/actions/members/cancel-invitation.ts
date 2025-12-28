"use server";

import { z } from "zod";
import { auth } from "@flack/auth";
import { headers } from "next/headers";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const cancelInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
});

export const cancelInvitation = orgActionClient
  .metadata({ actionName: "cancelInvitation" })
  .schema(cancelInvitationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { invitationId } = parsedInput;
    const { memberRole } = ctx;

    // Only owners and admins can cancel invitations
    if (memberRole !== "owner" && memberRole !== "admin") {
      throw new ActionError("You don't have permission to cancel invitations");
    }

    try {
      await auth.api.cancelInvitation({
        headers: await headers(),
        body: {
          invitationId,
        },
      });

      return { success: true };
    } catch (error) {
      if (error instanceof Error) {
        throw new ActionError(error.message);
      }
      throw new ActionError("Failed to cancel invitation");
    }
  });
