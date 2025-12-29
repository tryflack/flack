"use server";

import { z } from "zod";
import { auth } from "@flack/auth";
import { headers } from "next/headers";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const removeMemberSchema = z.object({
  memberIdOrEmail: z.string().min(1, "Member ID or email is required"),
});

export const removeMember = orgActionClient
  .metadata({ actionName: "removeMember" })
  .schema(removeMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { memberIdOrEmail } = parsedInput;
    const { organizationId, memberRole, userId } = ctx;

    // Only owners and admins can remove members
    if (memberRole !== "owner" && memberRole !== "admin") {
      throw new ActionError("You don't have permission to remove members");
    }

    try {
      const result = await auth.api.removeMember({
        headers: await headers(),
        body: {
          memberIdOrEmail,
          organizationId,
        },
      });

      return {
        success: true,
        member: result,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new ActionError(error.message);
      }
      throw new ActionError("Failed to remove member");
    }
  });
