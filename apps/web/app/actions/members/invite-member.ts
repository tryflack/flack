"use server";

import { z } from "zod";
import { auth } from "@flack/auth";
import { headers } from "next/headers";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]).default("member"),
});

export const inviteMember = orgActionClient
  .metadata({ actionName: "inviteMember" })
  .schema(inviteMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { email, role } = parsedInput;
    const { organizationId, memberRole } = ctx;

    // Only owners and admins can invite members
    if (memberRole !== "owner" && memberRole !== "admin") {
      throw new ActionError("You don't have permission to invite members");
    }

    // Only owners can invite admins
    if (role === "admin" && memberRole !== "owner") {
      throw new ActionError("Only organization owners can invite admins");
    }

    try {
      const result = await auth.api.createInvitation({
        headers: await headers(),
        body: {
          email,
          role,
          organizationId,
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
      throw new ActionError("Failed to send invitation");
    }
  });


