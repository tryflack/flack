import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId } = await params;
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  const message = await db.message.findFirst({
    where: {
      id: messageId,
      organizationId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
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
      replies: {
        where: { deletedAt: null },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 3, // Preview of replies
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Verify access to the channel/conversation
  if (message.channelId) {
    const channel = await db.channel.findFirst({
      where: {
        id: message.channelId,
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
      return NextResponse.json(
        { error: "You don't have access to this message" },
        { status: 403 }
      );
    }
  }

  if (message.conversationId) {
    const conversation = await db.conversation.findFirst({
      where: {
        id: message.conversationId,
        organizationId,
        participants: { some: { userId: session.user.id } },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "You don't have access to this message" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    message: {
      id: message.id,
      content: message.deletedAt ? null : message.content,
      authorId: message.authorId,
      author: message.author,
      channelId: message.channelId,
      conversationId: message.conversationId,
      parentId: message.parentId,
      parent: message.parent,
      isEdited: message.isEdited,
      isDeleted: !!message.deletedAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      reactions: message.reactions,
      attachments: message.attachments,
      replyPreview: message.replies,
      replyCount: message._count.replies,
    },
  });
}
