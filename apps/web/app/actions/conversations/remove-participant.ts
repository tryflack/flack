"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const removeParticipantSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const removeParticipant = orgActionClient
  .metadata({ actionName: "removeParticipant" })
  .schema(removeParticipantSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, userId: targetUserId } = parsedInput;
    const { userId, organizationId } = ctx;

    // Get the conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        participants: {
          some: { userId }, // Current user must be a participant
        },
      },
      include: {
        participants: true,
      },
    });

    if (!conversation) {
      throw new ActionError("Conversation not found");
    }

    // Cannot remove from DM
    if (conversation.type === "dm") {
      throw new ActionError("Cannot remove participants from a DM");
    }

    // Users can only remove themselves, unless we add admin roles later
    if (targetUserId !== userId) {
      throw new ActionError(
        "You can only remove yourself from the conversation",
      );
    }

    // Cannot leave if you're the last participant (would orphan the conversation)
    if (conversation.participants.length <= 2) {
      throw new ActionError(
        "Cannot leave a group with only 2 participants. The conversation will remain.",
      );
    }

    // Remove the participant
    await db.conversationParticipant.delete({
      where: {
        conversationId_userId: {
          conversationId,
          userId: targetUserId,
        },
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { success: true };
  });
