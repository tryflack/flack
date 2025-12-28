"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastNewMessage } from "@/app/lib/partykit";

const removeFromChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const removeFromChannel = orgActionClient
  .metadata({ actionName: "removeFromChannel" })
  .schema(removeFromChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { channelId, userId: targetUserId } = parsedInput;
    const { userId, organizationId, memberRole } = ctx;

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

    // Check if target is a member
    const targetMembership = await db.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new ActionError("User is not a member of this channel");
    }

    // Check if the remover has permission
    const removerMembership = await db.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    const isOrgAdmin = memberRole === "admin" || memberRole === "owner";
    const isChannelAdmin = removerMembership?.role === "admin";
    const isChannelCreator = channel.createdById === userId;
    const isRemovingSelf = targetUserId === userId;

    // Users can remove themselves, or admins can remove others
    if (!isRemovingSelf && !isOrgAdmin && !isChannelAdmin && !isChannelCreator) {
      throw new ActionError("You don't have permission to remove members from this channel");
    }

    // Cannot remove the channel creator (they should delete the channel instead)
    if (targetUserId === channel.createdById && !isRemovingSelf) {
      throw new ActionError("Cannot remove the channel creator");
    }

    // Get user info for the system message
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, image: true },
    });

    const remover = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!targetUser || !remover) {
      throw new ActionError("User not found");
    }

    // Remove the member
    await db.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });

    // Create a system message
    const messageContent = isRemovingSelf
      ? `${targetUser.name} left the channel`
      : `${remover.name} removed ${targetUser.name} from the channel`;

    const systemMessage = await db.message.create({
      data: {
        content: messageContent,
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

    return { success: true };
  });

