"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const addParticipantSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const addParticipant = orgActionClient
  .metadata({ actionName: "addParticipant" })
  .schema(addParticipantSchema)
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

    // Cannot add participants to a DM - it becomes a group DM
    if (conversation.type === "dm") {
      throw new ActionError(
        "Cannot add participants to a DM. Start a new group conversation instead."
      );
    }

    // Verify target user is a member of the org
    const targetMembership = await db.member.findFirst({
      where: {
        userId: targetUserId,
        organizationId,
      },
    });

    if (!targetMembership) {
      throw new ActionError("User is not a member of this organization");
    }

    // Check if already a participant
    const existingParticipant = conversation.participants.find(
      (p) => p.userId === targetUserId
    );

    if (existingParticipant) {
      throw new ActionError("User is already a participant");
    }

    // Add the participant
    const participant = await db.conversationParticipant.create({
      data: {
        conversationId,
        userId: targetUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return { participant };
  });

