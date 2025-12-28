"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastMessageEdit } from "@/app/lib/partykit";

const editMessageSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  content: z.string().min(1, "Message cannot be empty").max(4000),
});

export const editMessage = orgActionClient
  .metadata({ actionName: "editMessage" })
  .schema(editMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, content } = parsedInput;
    const { userId, organizationId } = ctx;

    // Get the message
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!message) {
      throw new ActionError("Message not found");
    }

    // Only the author can edit their message
    if (message.authorId !== userId) {
      throw new ActionError("You can only edit your own messages");
    }

    // Update the message
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: { replies: true, reactions: true },
        },
      },
    });

    // Broadcast edit via PartyKit for real-time updates
    await broadcastMessageEdit(
      messageId,
      content,
      updatedMessage.updatedAt,
      message.channelId,
      message.conversationId,
    );

    return { message: updatedMessage };
  });
