import type { PartyKitServer, Connection, Room } from "partykit/server";
import type {
  ClientMessage,
  ServerMessage,
  ConnectionState,
  ChatMessage,
  Reaction,
} from "../lib/types.js";
import { validateToken } from "../lib/auth.js";

export default class ConversationParty implements PartyKitServer {
  connections: Map<string, ConnectionState> = new Map();
  typingUsers: Map<string, NodeJS.Timeout> = new Map();

  constructor(public room: Room) {}

  onConnect(_conn: Connection) {
    // Wait for client to send auth message - no immediate response needed
    // Client will send { type: "auth", token: "..." } on connect
  }

  async onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Connection
  ) {
    if (typeof message !== "string") {
      sender.send(
        JSON.stringify({
          type: "error",
          message: "Binary messages not supported",
        })
      );
      return;
    }

    let parsed: ClientMessage;

    try {
      parsed = JSON.parse(message);
    } catch {
      sender.send(
        JSON.stringify({ type: "error", message: "Invalid message format" })
      );
      return;
    }

    const connectionState = this.connections.get(sender.id);

    switch (parsed.type) {
      case "auth": {
        const authUrl =
          process.env.BETTER_AUTH_URL || "https://flack-web.vercel.app";
        const state = await validateToken(parsed.token, authUrl);

        if (state) {
          this.connections.set(sender.id, state);
          sender.send(
            JSON.stringify({ type: "connected", userId: state.userId })
          );
        } else {
          sender.send(
            JSON.stringify({ type: "error", message: "Invalid token" })
          );
        }
        break;
      }

      case "typing": {
        if (!connectionState?.authenticated) {
          sender.send(
            JSON.stringify({ type: "error", message: "Not authenticated" })
          );
          return;
        }

        const existingTimeout = this.typingUsers.get(connectionState.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (parsed.isTyping) {
          const timeout = setTimeout(() => {
            this.broadcastTyping(
              connectionState.userId,
              connectionState.userName,
              false,
              sender.id
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
          sender.id
        );
        break;
      }

      case "read": {
        // Track read receipts for conversations
        break;
      }
    }
  }

  onClose(conn: Connection) {
    const state = this.connections.get(conn.id);

    if (state) {
      const timeout = this.typingUsers.get(state.userId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingUsers.delete(state.userId);
        this.broadcastTyping(state.userId, state.userName, false, conn.id);
      }
    }

    this.connections.delete(conn.id);
  }

  async onRequest(
    req: Parameters<NonNullable<PartyKitServer["onRequest"]>>[0]
  ): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await req.json();

      switch ((body as { type: string }).type) {
        case "message:new":
          this.broadcast(
            JSON.stringify({
              type: "message:new",
              message: (body as { message: ChatMessage }).message,
            } satisfies ServerMessage)
          );
          break;

        case "message:edit":
          this.broadcast(
            JSON.stringify({
              type: "message:edit",
              messageId: (body as { messageId: string }).messageId,
              content: (body as { content: string }).content,
              updatedAt: (body as { updatedAt: string }).updatedAt,
            } satisfies ServerMessage)
          );
          break;

        case "message:delete":
          this.broadcast(
            JSON.stringify({
              type: "message:delete",
              messageId: (body as { messageId: string }).messageId,
            } satisfies ServerMessage)
          );
          break;

        case "reaction:add":
          this.broadcast(
            JSON.stringify({
              type: "reaction:add",
              messageId: (body as { messageId: string }).messageId,
              reaction: (body as { reaction: Reaction }).reaction,
            } satisfies ServerMessage)
          );
          break;

        case "reaction:remove":
          this.broadcast(
            JSON.stringify({
              type: "reaction:remove",
              messageId: (body as { messageId: string }).messageId,
              reactionId: (body as { reactionId: string }).reactionId,
            } satisfies ServerMessage)
          );
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
    excludeConnectionId: string
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
