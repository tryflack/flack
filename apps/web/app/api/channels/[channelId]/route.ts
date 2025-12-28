import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;
  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 }
    );
  }

  const channel = await db.channel.findFirst({
    where: {
      id: channelId,
      organizationId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
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

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Check access for private channels
  if (channel.isPrivate) {
    const isMember = channel.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "You don't have access to this channel" },
        { status: 403 }
      );
    }
  }

  const userMembership = channel.members.find(
    (m) => m.userId === session.user.id
  );

  return NextResponse.json({
    channel: {
      id: channel.id,
      name: channel.name,
      slug: channel.slug,
      description: channel.description,
      isPrivate: channel.isPrivate,
      createdBy: channel.createdBy,
      createdAt: channel.createdAt,
      members: channel.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      messageCount: channel._count.messages,
      isMember: !!userMembership,
      userRole: userMembership?.role ?? null,
    },
  });
}

