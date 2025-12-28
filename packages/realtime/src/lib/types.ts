// Message types for PartyKit communication

export interface User {
  id: string;
  name: string;
  image: string | null;
}

export interface MessageAuthor {
  id: string;
  name: string;
  image: string | null;
}

// Inbound messages (client -> server)
export type ClientMessage =
  | { type: "auth"; token: string }
  | { type: "typing"; isTyping: boolean }
  | { type: "read"; messageId: string };

// Outbound messages (server -> client)
export type ServerMessage =
  | { type: "connected"; userId: string }
  | { type: "error"; message: string }
  | { type: "message:new"; message: ChatMessage }
  | {
      type: "message:edit";
      messageId: string;
      content: string;
      updatedAt: string;
    }
  | { type: "message:delete"; messageId: string }
  | { type: "reaction:add"; messageId: string; reaction: Reaction }
  | { type: "reaction:remove"; messageId: string; reactionId: string }
  | { type: "typing"; userId: string; userName: string; isTyping: boolean }
  | { type: "presence"; users: PresenceUser[] }
  | { type: "unread"; channelId?: string; conversationId?: string }
  | { type: "user:updated"; userId: string; user: Partial<PresenceUser> };

export interface ChatMessage {
  id: string;
  content: string;
  type?: "message" | "system"; // Message type: regular message or system notification
  authorId: string;
  author: MessageAuthor;
  channelId: string | null;
  conversationId: string | null;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  reactions: Reaction[];
  replyCount: number;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  userName: string;
}

export interface PresenceUser {
  id: string;
  name: string;
  image: string | null;
  status: "online" | "away" | "offline";
  lastSeen: string;
}

// Connection metadata stored per connection
export interface ConnectionState {
  userId: string;
  userName: string;
  userImage: string | null;
  authenticated: boolean;
}
