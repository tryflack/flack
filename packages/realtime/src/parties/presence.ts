import type {
  PartyKitServer,
  Connection,
  Room,
  Request,
} from "partykit/server";
import type {
  ServerMessage,
  ConnectionState,
  PresenceUser,
} from "../lib/types.js";
import { validateToken } from "../lib/auth.js";

// Presence party - handles online status for an organization
export default class PresenceParty implements PartyKitServer {
  connections: Map<string, ConnectionState> = new Map();
  userConnections: Map<string, Set<string>> = new Map(); // userId -> Set<connectionId>
  userStatus: Map<string, PresenceUser> = new Map();

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

    let parsed: { type: string; token?: string; status?: string };

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
        if (!parsed.token) {
          sender.send(
            JSON.stringify({ type: "error", message: "Token required" })
          );
          return;
        }

        const authUrl =
          process.env.BETTER_AUTH_URL || "https://flack-web.vercel.app";
        const state = await validateToken(parsed.token, authUrl);

        if (state) {
          this.connections.set(sender.id, state);
          this.addUserConnection(state.userId, sender.id, state);
          sender.send(
            JSON.stringify({ type: "connected", userId: state.userId })
          );
          this.broadcastPresence();
        } else {
          sender.send(
            JSON.stringify({ type: "error", message: "Invalid token" })
          );
        }
        break;
      }

      case "status": {
        if (!connectionState?.authenticated) {
          sender.send(
            JSON.stringify({ type: "error", message: "Not authenticated" })
          );
          return;
        }

        const user = this.userStatus.get(connectionState.userId);
        if (user && parsed.status) {
          user.status = parsed.status as "online" | "away" | "offline";
          user.lastSeen = new Date().toISOString();
          this.broadcastPresence();
        }
        break;
      }

      case "ping": {
        // Keep connection alive and update last seen
        if (connectionState?.authenticated) {
          const user = this.userStatus.get(connectionState.userId);
          if (user) {
            user.lastSeen = new Date().toISOString();
          }
        }
        sender.send(JSON.stringify({ type: "pong" }));
        break;
      }

      case "unread": {
        // Broadcast unread notification to all users except sender
        // This is used to notify other users that there's a new message in a channel/conversation
        const notification = parsed as {
          type: "unread";
          channelId?: string;
          conversationId?: string;
          senderId?: string;
        };

        for (const conn of this.room.getConnections()) {
          const state = this.connections.get(conn.id);
          // Send to all authenticated users except the message sender
          if (state?.authenticated && state.userId !== notification.senderId) {
            conn.send(
              JSON.stringify({
                type: "unread",
                channelId: notification.channelId,
                conversationId: notification.conversationId,
              })
            );
          }
        }
        break;
      }

      case "user:updated": {
        // User updated their profile - broadcast to all other users
        if (!connectionState?.authenticated) {
          sender.send(
            JSON.stringify({ type: "error", message: "Not authenticated" })
          );
          return;
        }

        const update = parsed as {
          type: "user:updated";
          name?: string;
          image?: string | null;
        };

        // Update user in presence
        const user = this.userStatus.get(connectionState.userId);
        if (user) {
          if (update.name !== undefined) user.name = update.name;
          if (update.image !== undefined) user.image = update.image;
        }

        // Also update connection state
        if (update.name !== undefined) connectionState.userName = update.name;
        if (update.image !== undefined)
          connectionState.userImage = update.image;

        // Broadcast to all users (including sender so their UI updates)
        const updateMessage: ServerMessage = {
          type: "user:updated",
          userId: connectionState.userId,
          user: {
            id: connectionState.userId,
            name: update.name ?? user?.name,
            image: update.image ?? user?.image,
          },
        };

        for (const conn of this.room.getConnections()) {
          const state = this.connections.get(conn.id);
          if (state?.authenticated) {
            conn.send(JSON.stringify(updateMessage));
          }
        }
        break;
      }
    }
  }

  onClose(conn: Connection) {
    const state = this.connections.get(conn.id);

    if (state) {
      this.removeUserConnection(state.userId, conn.id);
    }

    this.connections.delete(conn.id);
  }

  private addUserConnection(
    userId: string,
    connectionId: string,
    state: ConnectionState
  ) {
    // Track user connections
    let userConns = this.userConnections.get(userId);
    if (!userConns) {
      userConns = new Set();
      this.userConnections.set(userId, userConns);
    }
    userConns.add(connectionId);

    // Update or create user status
    if (!this.userStatus.has(userId)) {
      this.userStatus.set(userId, {
        id: userId,
        name: state.userName,
        image: state.userImage,
        status: "online",
        lastSeen: new Date().toISOString(),
      });
    } else {
      const user = this.userStatus.get(userId)!;
      user.status = "online";
      user.lastSeen = new Date().toISOString();
    }
  }

  private removeUserConnection(userId: string, connectionId: string) {
    const userConns = this.userConnections.get(userId);
    if (userConns) {
      userConns.delete(connectionId);

      // If no more connections, mark user as offline
      if (userConns.size === 0) {
        this.userConnections.delete(userId);
        const user = this.userStatus.get(userId);
        if (user) {
          user.status = "offline";
          user.lastSeen = new Date().toISOString();
        }
        this.broadcastPresence();
      }
    }
  }

  private broadcastPresence() {
    const users = Array.from(this.userStatus.values());

    const message: ServerMessage = {
      type: "presence",
      users,
    };

    const messageStr = JSON.stringify(message);

    for (const conn of this.room.getConnections()) {
      const state = this.connections.get(conn.id);
      if (state?.authenticated) {
        conn.send(messageStr);
      }
    }
  }

  // Handle HTTP POST requests from server (for broadcasting unread notifications)
  async onRequest(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = (await req.json()) as {
        type: string;
        channelId?: string;
        conversationId?: string;
        senderId?: string;
        userId?: string;
        name?: string;
        image?: string | null;
      };

      switch (body.type) {
        case "unread":
          // Broadcast to all authenticated users except the sender
          for (const conn of this.room.getConnections()) {
            const state = this.connections.get(conn.id);
            if (state?.authenticated && state.userId !== body.senderId) {
              conn.send(
                JSON.stringify({
                  type: "unread",
                  channelId: body.channelId,
                  conversationId: body.conversationId,
                } satisfies ServerMessage)
              );
            }
          }
          break;

        case "user:updated":
          // Update user in presence state
          if (body.userId) {
            const user = this.userStatus.get(body.userId);
            if (user) {
              if (body.name !== undefined) user.name = body.name;
              if (body.image !== undefined) user.image = body.image;
            }

            // Update connection state for all connections of this user
            const userConns = this.userConnections.get(body.userId);
            if (userConns) {
              for (const connId of userConns) {
                const state = this.connections.get(connId);
                if (state) {
                  if (body.name !== undefined) state.userName = body.name;
                  if (body.image !== undefined) state.userImage = body.image;
                }
              }
            }

            // Broadcast to all users
            const updateMessage: ServerMessage = {
              type: "user:updated",
              userId: body.userId,
              user: {
                id: body.userId,
                name: body.name ?? user?.name,
                image: body.image ?? user?.image,
              },
            };

            for (const conn of this.room.getConnections()) {
              const state = this.connections.get(conn.id);
              if (state?.authenticated) {
                conn.send(JSON.stringify(updateMessage));
              }
            }
          }
          break;

        default:
          return new Response("Unknown message type", { status: 400 });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Presence request error:", error);
      return new Response("Internal error", { status: 500 });
    }
  }
}
