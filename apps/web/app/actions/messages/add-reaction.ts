"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastReactionAdd } from "@/app/lib/partykit";

const addReactionSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  emoji: z.string().min(1, "Emoji is required").max(8),
});

export const addReaction = orgActionClient
  .metadata({ actionName: "addReaction" })
  .schema(addReactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, emoji } = parsedInput;
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

    // Verify access to the channel/conversation
    if (message.channelId) {
      const channel = await db.channel.findFirst({
        where: {
          id: message.channelId,
          organizationId,
          OR: [
            { isPrivate: false },
            {
              isPrivate: true,
              members: { some: { userId } },
            },
          ],
        },
      });

      if (!channel) {
        throw new ActionError("You don't have access to this message");
      }
    }

    if (message.conversationId) {
      const conversation = await db.conversation.findFirst({
        where: {
          id: message.conversationId,
          organizationId,
          participants: { some: { userId } },
        },
      });

      if (!conversation) {
        throw new ActionError("You don't have access to this message");
      }
    }

    // Check if reaction already exists
    const existingReaction = await db.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      throw new ActionError("You've already added this reaction");
    }

    // Create the reaction
    const reaction = await db.reaction.create({
      data: {
        messageId,
        userId,
        emoji,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Broadcast via PartyKit for real-time updates
    await broadcastReactionAdd(
      messageId,
      {
        id: reaction.id,
        userId: reaction.userId,
        emoji: reaction.emoji,
        userName: reaction.user.name,
      },
      message.channelId,
      message.conversationId
    );

    return { reaction };
  });
