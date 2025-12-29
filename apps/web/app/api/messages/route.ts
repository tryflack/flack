import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const conversationId = searchParams.get("conversationId");
  const parentId = searchParams.get("parentId"); // For thread replies
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  if (!channelId && !conversationId && !parentId) {
    return NextResponse.json(
      { error: "channelId, conversationId, or parentId is required" },
      { status: 400 },
    );
  }

  // Verify access
  if (channelId) {
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        organizationId,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: { some: { userId: session.user.id } },
          },
        ],
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }
  }

  if (conversationId) {
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        participants: { some: { userId: session.user.id } },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }
  }

  // Build query conditions
  // For thread queries, include both the parent message AND its replies
  const where = {
    organizationId,
    deletedAt: null,
    ...(channelId && !parentId ? { channelId, parentId: null } : {}),
    ...(conversationId && !parentId ? { conversationId, parentId: null } : {}),
    ...(parentId
      ? { OR: [{ id: parentId }, { parentId }] } // Include parent + replies
      : {}),
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  // For thread replies, order ascending (oldest first) for natural reading order
  // For main messages, order descending (newest first) for flex-col-reverse display
  const isThreadQuery = !!parentId;

  const messages = await db.message.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          displayName: true,
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
              displayName: true,
            },
          },
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
      _count: {
        select: { replies: true },
      },
    },
    orderBy: { createdAt: isThreadQuery ? "asc" : "desc" },
    take: limit + 1, // Fetch one extra to determine if there are more
  });

  // Get all unique author IDs (including parent message authors) to check membership status
  const authorIds = [
    ...new Set([
      ...messages.map((msg) => msg.authorId),
      ...messages
        .filter((msg) => msg.parent)
        .map((msg) => msg.parent!.author.id),
    ]),
  ];

  // Check which authors are still members of the organization
  const activeMembers = await db.member.findMany({
    where: {
      organizationId,
      userId: { in: authorIds },
    },
    select: { userId: true },
  });

  const activeMemberIds = new Set(activeMembers.map((m) => m.userId));

  // Determine if there are more messages
  const hasMore = messages.length > limit;
  const messageSlice = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore
    ? messageSlice[messageSlice.length - 1]?.createdAt.toISOString()
    : null;

  // Transform messages
  const transformedMessages = messageSlice.map((msg) => ({
    id: msg.id,
    content: msg.content,
    type: msg.type as "message" | "system",
    authorId: msg.authorId,
    author: {
      ...msg.author,
      isDeactivated: !activeMemberIds.has(msg.authorId),
    },
    channelId: msg.channelId,
    conversationId: msg.conversationId,
    parentId: msg.parentId,
    parent: msg.parent
      ? {
          ...msg.parent,
          author: {
            ...msg.parent.author,
            isDeactivated: !activeMemberIds.has(msg.parent.author.id),
          },
        }
      : null,
    isEdited: msg.isEdited,
    createdAt: msg.createdAt,
    updatedAt: msg.updatedAt,
    deletedAt: msg.deletedAt,
    reactions: msg.reactions,
    attachments: msg.attachments,
    replyCount: msg._count.replies,
  }));

  return NextResponse.json({
    // Return in reverse chronological order (newest first) for flex-col-reverse display
    messages: transformedMessages,
    nextCursor,
    hasMore,
  });
}
