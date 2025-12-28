"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastNewMessage } from "@/app/lib/partykit";

const joinChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
});

export const joinChannel = orgActionClient
  .metadata({ actionName: "joinChannel" })
  .schema(joinChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { channelId } = parsedInput;
    const { userId, organizationId } = ctx;

    // Check if channel exists and is accessible
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        organizationId,
      },
    });

    if (!channel) {
      throw new ActionError("Channel not found");
    }

    // Private channels require an invitation (handled separately)
    if (channel.isPrivate) {
      throw new ActionError("This is a private channel. You need an invitation to join.");
    }

    // Check if already a member
    const existingMember = await db.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new ActionError("You are already a member of this channel");
    }

    // Get user info for the system message
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!user) {
      throw new ActionError("User not found");
    }

    // Join the channel
    const membership = await db.channelMember.create({
      data: {
        channelId,
        userId,
        role: "member",
      },
    });

    // Create a system message announcing the join
    const systemMessage = await db.message.create({
      data: {
        content: `${user.name} joined the channel`,
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
      null
    );

    return { membership };
  });

