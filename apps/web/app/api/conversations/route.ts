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
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "dm" | "group_dm" | null (all)

  // Get conversations the user is a participant of
  const conversations = await db.conversation.findMany({
    where: {
      organizationId,
      participants: {
        some: { userId: session.user.id },
      },
      ...(type ? { type } : {}),
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Transform conversations for the client
  const transformedConversations = conversations.map((conv) => {
    // For DMs, get the other participant
    const otherParticipants = conv.participants.filter(
      (p) => p.userId !== session.user.id
    );

    // Get current user's participation info
    const userParticipation = conv.participants.find(
      (p) => p.userId === session.user.id
    );

    return {
      id: conv.id,
      type: conv.type,
      name:
        conv.name ||
        (conv.type === "dm"
          ? otherParticipants[0]?.user.name
          : otherParticipants.map((p) => p.user.name).join(", ")),
      participants: conv.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
      })),
      lastMessage: conv.messages[0] || null,
      messageCount: conv._count.messages,
      lastReadAt: userParticipation?.lastReadAt,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  });

  return NextResponse.json({ conversations: transformedConversations });
}

