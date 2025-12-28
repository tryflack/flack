"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const deleteChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
});

export const deleteChannel = orgActionClient
  .metadata({ actionName: "deleteChannel" })
  .schema(deleteChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { channelId } = parsedInput;
    const { userId, organizationId, memberRole } = ctx;

    // Check if channel exists
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        organizationId,
      },
    });

    if (!channel) {
      throw new ActionError("Channel not found");
    }

    // Only org owners/admins or channel creator can delete
    const isOrgAdmin = memberRole === "owner" || memberRole === "admin";
    const isCreator = channel.createdById === userId;

    if (!isOrgAdmin && !isCreator) {
      throw new ActionError("You don't have permission to delete this channel");
    }

    await db.channel.delete({
      where: { id: channelId },
    });

    return { success: true };
  });
