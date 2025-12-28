"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastNewMessage } from "@/app/lib/partykit";

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(4000),
  channelId: z.string().optional(),
  conversationId: z.string().optional(),
  parentId: z.string().optional(), // For threading
});

export const sendMessage = orgActionClient
  .metadata({ actionName: "sendMessage" })
  .schema(sendMessageSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { content, channelId, conversationId, parentId } = parsedInput;
    const { userId, organizationId } = ctx;

    // Must have either channelId or conversationId, not both
    if (!channelId && !conversationId) {
      throw new ActionError("Either channelId or conversationId is required");
    }

    if (channelId && conversationId) {
      throw new ActionError("Cannot specify both channelId and conversationId");
    }

    // Verify access to the channel/conversation
    if (channelId) {
      const channel = await db.channel.findFirst({
        where: {
          id: channelId,
          organizationId,
        },
        include: {
          members: {
            where: { userId },
          },
        },
      });

      if (!channel) {
        throw new ActionError("Channel not found");
      }

      // For private channels, user must be a member
      if (channel.isPrivate && channel.members.length === 0) {
        throw new ActionError("You don't have access to this channel");
      }
    }

    if (conversationId) {
      const conversation = await db.conversation.findFirst({
        where: {
          id: conversationId,
          organizationId,
          participants: {
            some: { userId },
          },
        },
      });

      if (!conversation) {
        throw new ActionError("Conversation not found");
      }
    }

    // If replying to a message, verify the parent exists in the same room
    if (parentId) {
      const parentMessage = await db.message.findFirst({
        where: {
          id: parentId,
          organizationId,
          ...(channelId ? { channelId } : { conversationId }),
          deletedAt: null,
        },
      });

      if (!parentMessage) {
        throw new ActionError("Parent message not found");
      }
    }

    // Create the message
    const message = await db.message.create({
      data: {
        content,
        organizationId,
        authorId: userId,
        channelId: channelId || null,
        conversationId: conversationId || null,
        parentId: parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { replies: true, reactions: true },
        },
      },
    });

    // Update conversation timestamp if applicable
    if (conversationId) {
      await db.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    // Broadcast via PartyKit for real-time updates
    // Also sends unread notification to presence party
    await broadcastNewMessage(
      {
        id: message.id,
        content: message.content,
        type: "message",
        authorId: message.authorId,
        author: message.author,
        channelId: message.channelId,
        conversationId: message.conversationId,
        parentId: message.parentId,
        parent: message.parent,
        isEdited: message.isEdited,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        deletedAt: message.deletedAt?.toISOString() ?? null,
        reactions: [],
        attachments: [],
        replyCount: message._count.replies,
      },
      channelId ?? null,
      conversationId ?? null,
      organizationId
    );

    return { message };
  });
