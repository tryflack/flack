import type { PartyKitServer, Connection, Room } from "partykit/server";
import type {
  ClientMessage,
  ServerMessage,
  ConnectionState,
  ChatMessage,
} from "../lib/types.js";
import { validateToken } from "../lib/auth.js";

// Channel party - handles real-time messaging for channels
export default class ChannelParty implements PartyKitServer {
  connections: Map<string, ConnectionState> = new Map();
  typingUsers: Map<string, NodeJS.Timeout> = new Map();

  constructor(public room: Room) {}

  onConnect(_conn: Connection) {
    // Wait for client to send auth message - no immediate response needed
    // Client will send { type: "auth", token: "..." } on connect
  }

  async onMessage(
    message: string | ArrayBuffer | ArrayBufferView<ArrayBufferLike>,
    sender: Connection<unknown>,
  ) {
    let parsed: ClientMessage;

    try {
      parsed = JSON.parse(message as string);
    } catch {
      sender.send(
        JSON.stringify({ type: "error", message: "Invalid message format" }),
      );
      return;
    }

    const connectionState = this.connections.get(sender.id);

    switch (parsed.type) {
      case "auth": {
        // TODO: Remove hardcoded URL after fixing env vars
        const authUrl =
          process.env.BETTER_AUTH_URL || "https://flack-web.vercel.app";
        const state = await validateToken(parsed.token, authUrl);

        if (state) {
          this.connections.set(sender.id, state);
          sender.send(
            JSON.stringify({ type: "connected", userId: state.userId }),
          );
        } else {
          sender.send(
            JSON.stringify({ type: "error", message: "Invalid token" }),
          );
        }
        break;
      }

      case "typing": {
        if (!connectionState?.authenticated) {
          sender.send(
            JSON.stringify({ type: "error", message: "Not authenticated" }),
          );
          return;
        }

        // Clear existing typing timeout
        const existingTimeout = this.typingUsers.get(connectionState.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (parsed.isTyping) {
          // Set typing timeout (auto-clear after 5 seconds)
          const timeout = setTimeout(() => {
            this.broadcastTyping(
              connectionState.userId,
              connectionState.userName,
              false,
              sender.id,
            );
            this.typingUsers.delete(connectionState.userId);
          }, 5000);

          this.typingUsers.set(connectionState.userId, timeout);
        } else {
          this.typingUsers.delete(connectionState.userId);
        }

        this.broadcastTyping(
          connectionState.userId,
          connectionState.userName,
          parsed.isTyping,
          sender.id,
        );
        break;
      }

      case "read": {
        // Could track read receipts here if needed
        break;
      }
    }
  }

  onClose(conn: Connection) {
    const state = this.connections.get(conn.id);

    if (state) {
      // Clear typing indicator
      const timeout = this.typingUsers.get(state.userId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingUsers.delete(state.userId);
        this.broadcastTyping(state.userId, state.userName, false, conn.id);
      }
    }

    this.connections.delete(conn.id);
  }

  // Broadcast a new message (called from server action via HTTP)
  async onRequest(
    req: Parameters<NonNullable<PartyKitServer["onRequest"]>>[0],
  ): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = (await req.json()) as {
        type: string;
        message?: ChatMessage;
        messageId?: string;
        content?: string;
        updatedAt?: string;
        reaction?: {
          id: string;
          messageId: string;
          userId: string;
          emoji: string;
          userName: string;
        };
        reactionId?: string;
      };

      switch (body.type) {
        case "message:new":
          if (body.message) {
            this.broadcast(
              JSON.stringify({
                type: "message:new",
                message: body.message,
              } satisfies ServerMessage),
            );
          }
          break;

        case "message:edit":
          if (body.messageId && body.content && body.updatedAt) {
            this.broadcast(
              JSON.stringify({
                type: "message:edit",
                messageId: body.messageId,
                content: body.content,
                updatedAt: body.updatedAt,
              } satisfies ServerMessage),
            );
          }
          break;

        case "message:delete":
          if (body.messageId) {
            this.broadcast(
              JSON.stringify({
                type: "message:delete",
                messageId: body.messageId,
              } satisfies ServerMessage),
            );
          }
          break;

        case "reaction:add":
          if (body.messageId && body.reaction) {
            this.broadcast(
              JSON.stringify({
                type: "reaction:add",
                messageId: body.messageId,
                reaction: body.reaction,
              } satisfies ServerMessage),
            );
          }
          break;

        case "reaction:remove":
          if (body.messageId && body.reactionId) {
            this.broadcast(
              JSON.stringify({
                type: "reaction:remove",
                messageId: body.messageId,
                reactionId: body.reactionId,
              } satisfies ServerMessage),
            );
          }
          break;

        default:
          return new Response("Unknown message type", { status: 400 });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Request error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }

  private broadcast(message: string, excludeConnectionId?: string) {
    for (const conn of this.room.getConnections()) {
      if (excludeConnectionId && conn.id === excludeConnectionId) continue;

      const state = this.connections.get(conn.id);
      if (state?.authenticated) {
        conn.send(message);
      }
    }
  }

  private broadcastTyping(
    userId: string,
    userName: string,
    isTyping: boolean,
    excludeConnectionId: string,
  ) {
    const message: ServerMessage = {
      type: "typing",
      userId,
      userName,
      isTyping,
    };

    this.broadcast(JSON.stringify(message), excludeConnectionId);
  }
}
