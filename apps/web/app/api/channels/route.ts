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

  // Verify membership
  const membership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this organization" },
      { status: 403 }
    );
  }

  // Get channels the user can see
  // Public channels + private channels they're a member of
  const channels = await db.channel.findMany({
    where: {
      organizationId,
      OR: [
        { isPrivate: false },
        {
          isPrivate: true,
          members: {
            some: { userId: session.user.id },
          },
        },
      ],
    },
    include: {
      _count: {
        select: { members: true },
      },
      members: {
        where: { userId: session.user.id },
        select: { role: true, joinedAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Transform to include membership status
  const transformedChannels = channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    slug: channel.slug,
    description: channel.description,
    isPrivate: channel.isPrivate,
    memberCount: channel._count.members,
    isMember: channel.members.length > 0,
    membership: channel.members[0] ?? null,
    createdAt: channel.createdAt,
  }));

  return NextResponse.json({ channels: transformedChannels });
}

