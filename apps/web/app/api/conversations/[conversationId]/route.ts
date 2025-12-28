import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 },
    );
  }

  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      organizationId,
      participants: {
        some: { userId: session.user.id },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  // Get other participants for DM display name
  const otherParticipants = conversation.participants.filter(
    (p) => p.userId !== session.user.id,
  );

  const userParticipation = conversation.participants.find(
    (p) => p.userId === session.user.id,
  );

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      type: conversation.type,
      name:
        conversation.name ||
        (conversation.type === "dm"
          ? otherParticipants[0]?.user.name
          : otherParticipants.map((p) => p.user.name).join(", ")),
      participants: conversation.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
      })),
      messageCount: conversation._count.messages,
      lastReadAt: userParticipation?.lastReadAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
  });
}
