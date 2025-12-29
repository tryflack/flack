"use server";

import { z } from "zod";
import { auth } from "@flack/auth";
import { headers } from "next/headers";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const updateRoleSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  role: z.enum(["member", "admin", "owner"]),
});

export const updateMemberRole = orgActionClient
  .metadata({ actionName: "updateMemberRole" })
  .schema(updateRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { memberId, role } = parsedInput;
    const { organizationId, memberRole } = ctx;

    // Only owners can change roles
    if (memberRole !== "owner") {
      throw new ActionError("Only organization owners can change member roles");
    }

    try {
      const result = await auth.api.updateMemberRole({
        headers: await headers(),
        body: {
          memberId,
          role,
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
      throw new ActionError("Failed to update member role");
    }
  });


