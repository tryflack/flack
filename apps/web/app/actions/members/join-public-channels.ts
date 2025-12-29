"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { authActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastNewMessage } from "@/app/lib/partykit";

const joinPublicChannelsSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

/**
 * Adds the current user to all public channels in an organization.
 * This should be called after a user joins an organization (accepts invitation).
 */
export const joinPublicChannels = authActionClient
  .metadata({ actionName: "joinPublicChannels" })
  .schema(joinPublicChannelsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { organizationId } = parsedInput;
    const { userId } = ctx;

    // Verify the user is a member of this organization
    const membership = await db.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new ActionError("You are not a member of this organization");
    }

    // Find all public channels in this organization
    const publicChannels = await db.channel.findMany({
      where: {
        organizationId,
        isPrivate: false,
      },
      select: { id: true, name: true },
    });

    if (publicChannels.length === 0) {
      return { joined: [], count: 0 };
    }

    // Check which channels the user is NOT already a member of
    const existingMemberships = await db.channelMember.findMany({
      where: {
        userId,
        channelId: { in: publicChannels.map((c) => c.id) },
      },
      select: { channelId: true },
    });

    const existingChannelIds = new Set(
      existingMemberships.map((m) => m.channelId),
    );
    const channelsToJoin = publicChannels.filter(
      (c) => !existingChannelIds.has(c.id),
    );

    if (channelsToJoin.length === 0) {
      return { joined: [], count: 0 };
    }

    // Get user info for system messages
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true },
    });

    if (!user) {
      throw new ActionError("User not found");
    }

    // Add user to all public channels they're not already in
    await db.$transaction(
      channelsToJoin.map((channel) =>
        db.channelMember.create({
          data: {
            channelId: channel.id,
            userId,
            role: "member",
          },
        }),
      ),
    );

    // Create system messages and broadcast for each channel joined
    for (const channel of channelsToJoin) {
      const systemMessage = await db.message.create({
        data: {
          content: `${user.name} joined the channel`,
          type: "system",
          organizationId,
          channelId: channel.id,
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
        channel.id,
        null,
        organizationId,
      );
    }

    return {
      joined: channelsToJoin.map((c) => c.name),
      count: channelsToJoin.length,
    };
  });
