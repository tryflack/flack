"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const markAsReadSchema = z
  .object({
    channelId: z.string().optional(),
    conversationId: z.string().optional(),
  })
  .refine((data) => data.channelId || data.conversationId, {
    message: "Either channelId or conversationId is required",
  });

export const markAsRead = orgActionClient
  .metadata({ actionName: "markAsRead" })
  .schema(markAsReadSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { channelId, conversationId } = parsedInput;
    const { userId, organizationId } = ctx;
    const now = new Date();

    if (channelId) {
      // Verify channel access
      const channel = await db.channel.findFirst({
        where: {
          id: channelId,
          organizationId,
          OR: [{ isPrivate: false }, { members: { some: { userId } } }],
        },
      });

      if (!channel) {
        throw new ActionError("Channel not found or access denied");
      }

      // Update lastReadAt for the channel member
      await db.channelMember.updateMany({
        where: {
          channelId,
          userId,
        },
        data: {
          lastReadAt: now,
        },
      });

      return { success: true, lastReadAt: now.toISOString() };
    }

    if (conversationId) {
      // Verify conversation access
      const conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId,
          participants: { some: { userId } },
        },
      });

      if (!conversation) {
        throw new ActionError("Conversation not found or access denied");
      }

      // Update lastReadAt for the conversation participant
      await db.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt: now,
        },
      });

      return { success: true, lastReadAt: now.toISOString() };
    }

    throw new ActionError("Invalid request");
  });
