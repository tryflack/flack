"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastNewMessage } from "@/app/lib/partykit";

const leaveChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
});

export const leaveChannel = orgActionClient
  .metadata({ actionName: "leaveChannel" })
  .schema(leaveChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { channelId } = parsedInput;
    const { userId, organizationId } = ctx;

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

    // Cannot leave if you're the creator and only admin
    if (channel.createdById === userId) {
      const adminCount = await db.channelMember.count({
        where: {
          channelId,
          role: "admin",
        },
      });

      if (adminCount <= 1) {
        throw new ActionError(
          "You cannot leave this channel as you are the only admin. Please promote another member first.",
        );
      }
    }

    // Get user info for the system message
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!user) {
      throw new ActionError("User not found");
    }

    // Create a system message announcing the leave (before removing membership)
    const systemMessage = await db.message.create({
      data: {
        content: `${user.name} left the channel`,
        type: "system",
        organizationId,
        channelId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Broadcast the system message via PartyKit
    await broadcastNewMessage(
      {
        id: systemMessage.id,
        content: systemMessage.content,
        type: "system",
        authorId: systemMessage.authorId,
        author: systemMessage.author,
        channelId: systemMessage.channelId,
        conversationId: null,
        parentId: null,
        parent: null,
        isEdited: false,
        createdAt: systemMessage.createdAt.toISOString(),
        updatedAt: systemMessage.updatedAt.toISOString(),
        deletedAt: null,
        reactions: [],
        attachments: [],
        replyCount: 0,
      },
      channelId,
      null,
      organizationId,
    );

    // Remove membership
    await db.channelMember.deleteMany({
      where: {
        channelId,
        userId,
      },
    });

    return { success: true };
  });
