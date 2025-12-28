"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastMessageDelete } from "@/app/lib/partykit";

const deleteMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
});

export const deleteMessage = orgActionClient
  .metadata({ actionName: "deleteMessage" })
  .schema(deleteMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId } = parsedInput;
    const { userId, organizationId, memberRole } = ctx;

    // Get the message
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        organizationId,
        deletedAt: null,
      },
      include: {
        channel: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!message) {
      throw new ActionError("Message not found");
    }

    // Check deletion permission
    const isAuthor = message.authorId === userId;
    const isOrgAdmin = memberRole === "owner" || memberRole === "admin";
    const isChannelAdmin = message.channel?.members[0]?.role === "admin";

    if (!isAuthor && !isOrgAdmin && !isChannelAdmin) {
      throw new ActionError("You don't have permission to delete this message");
    }

    // Soft delete the message
    await db.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: "", // Clear content for privacy
      },
    });

    // Broadcast deletion via PartyKit for real-time updates
    await broadcastMessageDelete(
      messageId,
      message.channelId,
      message.conversationId
    );

    return { success: true };
  });
