"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastReactionRemove } from "@/app/lib/partykit";

const removeReactionSchema = z.object({
  messageId: z.string().min(1, "Message ID is required"),
  emoji: z.string().min(1, "Emoji is required"),
});

export const removeReaction = orgActionClient
  .metadata({ actionName: "removeReaction" })
  .schema(removeReactionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { messageId, emoji } = parsedInput;
    const { userId } = ctx;

    // Find and delete the reaction (include message for broadcast context)
    const reaction = await db.reaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      include: {
        message: {
          select: {
            channelId: true,
            conversationId: true,
          },
        },
      },
    });

    if (!reaction) {
      throw new ActionError("Reaction not found");
    }

    await db.reaction.delete({
      where: { id: reaction.id },
    });

    // Broadcast via PartyKit for real-time updates
    await broadcastReactionRemove(
      messageId,
      reaction.id,
      reaction.message.channelId,
      reaction.message.conversationId
    );

    return { success: true, reactionId: reaction.id };
  });
