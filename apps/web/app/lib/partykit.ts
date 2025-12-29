/**
 * PartyKit server-side broadcasting utilities
 * Used to broadcast real-time updates from server actions to connected WebSocket clients
 */

// Server-side PartyKit URL for HTTP broadcasts
// Derive from NEXT_PUBLIC_PARTYKIT_HOST so we only need one env var
// Handle both "host:port" and "https://host" formats
const RAW_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
const PARTYKIT_HOST = RAW_HOST.replace(/^https?:\/\//, ""); // Strip protocol if present
const PARTYKIT_URL = PARTYKIT_HOST.includes("localhost")
  ? `http://${PARTYKIT_HOST}`
  : `https://${PARTYKIT_HOST}`;

export interface BroadcastNewMessagePayload {
  type: "message:new";
  message: {
    id: string;
    content: string;
    type?: "message" | "system"; // Message type: regular message or system notification
    authorId: string;
    author: {
      id: string;
      name: string;
      image: string | null;
    };
    channelId: string | null;
    conversationId: string | null;
    parentId: string | null;
    parent: {
      id: string;
      content: string;
      author: {
        id: string;
        name: string;
      };
    } | null;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    reactions: Array<{
      id: string;
      emoji: string;
      userId: string;
      user: { id: string; name: string };
    }>;
    attachments: Array<{
      id: string;
      url: string;
      filename: string;
      mimeType: string;
      size: number;
    }>;
    replyCount: number;
  };
}

export interface BroadcastEditMessagePayload {
  type: "message:edit";
  messageId: string;
  content: string;
  updatedAt: string;
}

export interface BroadcastDeleteMessagePayload {
  type: "message:delete";
  messageId: string;
}

export interface BroadcastAddReactionPayload {
  type: "reaction:add";
  messageId: string;
  reaction: {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    userName: string;
  };
}

export interface BroadcastRemoveReactionPayload {
  type: "reaction:remove";
  messageId: string;
  reactionId: string;
}

export interface BroadcastUnreadPayload {
  type: "unread";
  channelId?: string;
  conversationId?: string;
  senderId?: string;
}

export interface BroadcastUserUpdatedPayload {
  type: "user:updated";
  userId: string;
  name?: string;
  image?: string | null;
}

type BroadcastPayload =
  | BroadcastNewMessagePayload
  | BroadcastEditMessagePayload
  | BroadcastDeleteMessagePayload
  | BroadcastAddReactionPayload
  | BroadcastRemoveReactionPayload
  | BroadcastUnreadPayload
  | BroadcastUserUpdatedPayload;

/**
 * Broadcast a message to a PartyKit room
 * @param partyType - The party type (channel, conversation, presence)
 * @param roomId - The room ID (channelId, conversationId, or organizationId)
 * @param payload - The message payload to broadcast
 */
export async function broadcastToRoom(
  partyType: "channel" | "conversation" | "presence",
  roomId: string,
  payload: BroadcastPayload
): Promise<boolean> {
  try {
    const response = await fetch(
      `${PARTYKIT_URL}/parties/${partyType}/${roomId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error(
        `Failed to broadcast to PartyKit: ${response.status} ${response.statusText}`
      );
      return false;
    }

    return true;
  } catch (error) {
    // Don't fail the action if broadcast fails - the message is already saved
    console.error("Failed to broadcast to PartyKit:", error);
    return false;
  }
}

/**
 * Broadcast a new message to a channel or conversation
 * Also sends an unread notification to the presence party for the organization
 */
export async function broadcastNewMessage(
  message: BroadcastNewMessagePayload["message"],
  channelId: string | null,
  conversationId: string | null,
  organizationId?: string
): Promise<boolean> {
  const roomId = channelId || conversationId;
  const partyType = channelId ? "channel" : "conversation";

  if (!roomId) {
    console.error("No roomId provided for broadcast");
    return false;
  }

  // Broadcast the message to the channel/conversation
  const messageResult = await broadcastToRoom(partyType, roomId, {
    type: "message:new",
    message,
  });

  // Also broadcast an unread notification to the presence party
  // This notifies all users in the organization that there's a new message
  if (organizationId) {
    await broadcastToRoom("presence", organizationId, {
      type: "unread",
      channelId: channelId ?? undefined,
      conversationId: conversationId ?? undefined,
      senderId: message.authorId,
    });
  }

  return messageResult;
}

/**
 * Broadcast a message edit to a channel or conversation
 */
export async function broadcastMessageEdit(
  messageId: string,
  content: string,
  updatedAt: Date,
  channelId: string | null,
  conversationId: string | null
): Promise<boolean> {
  const roomId = channelId || conversationId;
  const partyType = channelId ? "channel" : "conversation";

  if (!roomId) {
    console.error("No roomId provided for broadcast");
    return false;
  }

  return broadcastToRoom(partyType, roomId, {
    type: "message:edit",
    messageId,
    content,
    updatedAt: updatedAt.toISOString(),
  });
}

/**
 * Broadcast a message deletion to a channel or conversation
 */
export async function broadcastMessageDelete(
  messageId: string,
  channelId: string | null,
  conversationId: string | null
): Promise<boolean> {
  const roomId = channelId || conversationId;
  const partyType = channelId ? "channel" : "conversation";

  if (!roomId) {
    console.error("No roomId provided for broadcast");
    return false;
  }

  return broadcastToRoom(partyType, roomId, {
    type: "message:delete",
    messageId,
  });
}

/**
 * Broadcast a reaction add to a channel or conversation
 */
export async function broadcastReactionAdd(
  messageId: string,
  reaction: {
    id: string;
    userId: string;
    emoji: string;
    userName: string;
  },
  channelId: string | null,
  conversationId: string | null
): Promise<boolean> {
  const roomId = channelId || conversationId;
  const partyType = channelId ? "channel" : "conversation";

  if (!roomId) {
    console.error("No roomId provided for broadcast");
    return false;
  }

  return broadcastToRoom(partyType, roomId, {
    type: "reaction:add",
    messageId,
    reaction: {
      ...reaction,
      messageId,
    },
  });
}

/**
 * Broadcast a reaction removal to a channel or conversation
 */
export async function broadcastReactionRemove(
  messageId: string,
  reactionId: string,
  channelId: string | null,
  conversationId: string | null
): Promise<boolean> {
  const roomId = channelId || conversationId;
  const partyType = channelId ? "channel" : "conversation";

  if (!roomId) {
    console.error("No roomId provided for broadcast");
    return false;
  }

  return broadcastToRoom(partyType, roomId, {
    type: "reaction:remove",
    messageId,
    reactionId,
  });
}

/**
 * Broadcast a user profile update to all users in an organization
 */
export async function broadcastUserUpdated(
  organizationId: string,
  userId: string,
  updates: { name?: string; image?: string | null }
): Promise<boolean> {
  return broadcastToRoom("presence", organizationId, {
    type: "user:updated",
    userId,
    ...updates,
  });
}
