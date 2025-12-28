"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastNewMessage } from "@/app/lib/partykit";

const inviteToChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const inviteToChannel = orgActionClient
  .metadata({ actionName: "inviteToChannel" })
  .schema(inviteToChannelSchema)
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

    // Check if the inviter has permission
    // Channel admins, org admins/owners, or the channel creator can invite
    const inviterMembership = await db.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    const isOrgAdmin = memberRole === "admin" || memberRole === "owner";
    const isChannelAdmin = inviterMembership?.role === "admin";
    const isChannelCreator = channel.createdById === userId;

    if (!isOrgAdmin && !isChannelAdmin && !isChannelCreator) {
      throw new ActionError("You don't have permission to invite members to this channel");
    }

    // Check if target user is a member of the organization
    const targetOrgMember = await db.member.findFirst({
      where: {
        userId: targetUserId,
        organizationId,
      },
    });

    if (!targetOrgMember) {
      throw new ActionError("User is not a member of this organization");
    }

    // Check if already a member
    const existingMember = await db.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });

    if (existingMember) {
      throw new ActionError("User is already a member of this channel");
    }

    // Get user info for the system message
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, image: true },
    });

    const inviter = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!targetUser || !inviter) {
      throw new ActionError("User not found");
    }

    // Add user to channel
    const membership = await db.channelMember.create({
      data: {
        channelId,
        userId: targetUserId,
        role: "member",
      },
    });

    // Create a system message announcing the addition
    const systemMessage = await db.message.create({
      data: {
        content: `${inviter.name} added ${targetUser.name} to the channel`,
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
      organizationId
    );

    return { success: true, membership };
  });

