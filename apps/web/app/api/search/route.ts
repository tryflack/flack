import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Search result limits per category for performance
const LIMITS = {
  messages: 10,
  channels: 5,
  members: 5,
};

export interface SearchResultMessage {
  id: string;
  content: string;
  createdAt: Date;
  channelId: string | null;
  conversationId: string | null;
  channel: { id: string; name: string; slug: string } | null;
  conversation: {
    id: string;
    type: string;
    name: string | null;
  } | null;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface SearchResultChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  memberCount: number;
  isMember: boolean;
}

export interface SearchResultMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface SearchResponse {
  messages: SearchResultMessage[];
  channels: SearchResultChannel[];
  members: SearchResultMember[];
  query: string;
}

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
  const query = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type"); // Optional: "messages", "channels", "members"

  // Early return for empty queries
  if (!query) {
    return NextResponse.json({
      messages: [],
      channels: [],
      members: [],
      query: "",
    } satisfies SearchResponse);
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
      { status: 403 },
    );
  }

  const userId = session.user.id;

  // Run searches in parallel for speed
  const [messages, channels, members] = await Promise.all([
    // Search messages
    !type || type === "messages"
      ? searchMessages(organizationId, userId, query)
      : Promise.resolve([]),

    // Search channels
    !type || type === "channels"
      ? searchChannels(organizationId, userId, query)
      : Promise.resolve([]),

    // Search members
    !type || type === "members"
      ? searchMembers(organizationId, query)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    messages,
    channels,
    members,
    query,
  } satisfies SearchResponse);
}

async function searchMessages(
  organizationId: string,
  userId: string,
  query: string,
): Promise<SearchResultMessage[]> {
  // Get channels user has access to
  const accessibleChannelIds = await db.channel
    .findMany({
      where: {
        organizationId,
        OR: [
          { isPrivate: false },
          { isPrivate: true, members: { some: { userId } } },
        ],
      },
      select: { id: true },
    })
    .then((channels) => channels.map((c) => c.id));

  // Get conversations user participates in
  const participatingConversationIds = await db.conversation
    .findMany({
      where: {
        organizationId,
        participants: { some: { userId } },
      },
      select: { id: true },
    })
    .then((convs) => convs.map((c) => c.id));

  // Search messages with case-insensitive contains
  const messages = await db.message.findMany({
    where: {
      organizationId,
      deletedAt: null,
      content: { contains: query },
      OR: [
        { channelId: { in: accessibleChannelIds } },
        { conversationId: { in: participatingConversationIds } },
      ],
    },
    include: {
      channel: {
        select: { id: true, name: true, slug: true },
      },
      conversation: {
        select: { id: true, type: true, name: true },
      },
      author: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: LIMITS.messages,
  });

  return messages;
}

async function searchChannels(
  organizationId: string,
  userId: string,
  query: string,
): Promise<SearchResultChannel[]> {
  const channels = await db.channel.findMany({
    where: {
      organizationId,
      OR: [{ name: { contains: query } }, { description: { contains: query } }],
      // Only show accessible channels
      AND: {
        OR: [
          { isPrivate: false },
          { isPrivate: true, members: { some: { userId } } },
        ],
      },
    },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
    take: LIMITS.channels,
  });

  return channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    slug: channel.slug,
    description: channel.description,
    isPrivate: channel.isPrivate,
    memberCount: channel._count.members,
    isMember: channel.members.length > 0,
  }));
}

async function searchMembers(
  organizationId: string,
  query: string,
): Promise<SearchResultMember[]> {
  const members = await db.member.findMany({
    where: {
      organizationId,
      user: {
        OR: [{ name: { contains: query } }, { email: { contains: query } }],
      },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { user: { name: "asc" } },
    take: LIMITS.members,
  });

  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    user: member.user,
  }));
}


