"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const createDmSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
});

export const createDm = orgActionClient
  .metadata({ actionName: "createDm" })
  .schema(createDmSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { targetUserId } = parsedInput;
    const { userId, organizationId } = ctx;

    // Cannot DM yourself
    if (targetUserId === userId) {
      throw new ActionError("You cannot start a conversation with yourself");
    }

    // Verify target user is a member of the same org
    const targetMembership = await db.member.findFirst({
      where: {
        userId: targetUserId,
        organizationId,
      },
    });

    if (!targetMembership) {
      throw new ActionError("User is not a member of this organization");
    }

    // Check if a DM already exists between these two users in this org
    const existingConversation = await db.conversation.findFirst({
      where: {
        organizationId,
        type: "dm",
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      // Return existing conversation
      return { conversation: existingConversation, isExisting: true };
    }

    // Create new DM conversation
    const conversation = await db.conversation.create({
      data: {
        organizationId,
        type: "dm",
        participants: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return { conversation, isExisting: false };
  });
