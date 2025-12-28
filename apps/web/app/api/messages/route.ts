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
  const where = {
    organizationId,
    deletedAt: null,
    ...(channelId && !parentId ? { channelId, parentId: null } : {}),
    ...(conversationId && !parentId ? { conversationId, parentId: null } : {}),
    ...(parentId ? { parentId } : {}),
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  const messages = await db.message.findMany({
    where,
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
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
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
    orderBy: { createdAt: "desc" },
    take: limit + 1, // Fetch one extra to determine if there are more
  });

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
    author: msg.author,
    channelId: msg.channelId,
    conversationId: msg.conversationId,
    parentId: msg.parentId,
    parent: msg.parent,
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
