"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import type { ServerMessage, ChatMessage, PresenceUser, Reaction } from "@flack/realtime";
import { getBearerToken, fetchBearerToken } from "@flack/auth/auth-client";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

interface UsePartyKitOptions {
  roomId: string;
  roomType: "channel" | "conversation" | "presence";
  onMessage?: (message: ChatMessage) => void;
  onMessageEdit?: (messageId: string, content: string, updatedAt: string) => void;
  onMessageDelete?: (messageId: string) => void;
  onReactionAdd?: (messageId: string, reaction: Reaction) => void;
  onReactionRemove?: (messageId: string, reactionId: string) => void;
  onTyping?: (userId: string, userName: string, isTyping: boolean) => void;
  onPresence?: (users: PresenceUser[]) => void;
}

export function usePartyKit({
  roomId,
  roomType,
  onMessage,
  onMessageEdit,
  onMessageDelete,
  onReactionAdd,
  onReactionRemove,
  onTyping,
  onPresence,
}: UsePartyKitOptions) {
  const socketRef = useRef<PartySocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

  // Use refs to store callbacks so they don't cause socket reconnection
  const callbacksRef = useRef({
    onMessage,
    onMessageEdit,
    onMessageDelete,
    onReactionAdd,
    onReactionRemove,
    onTyping,
    onPresence,
  });

  // Keep refs up to date with latest callbacks
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onMessageEdit,
      onMessageDelete,
      onReactionAdd,
      onReactionRemove,
      onTyping,
      onPresence,
    };
  });

  useEffect(() => {
    if (!roomId) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomId,
      party: roomType,
    });

    socketRef.current = socket;

    socket.addEventListener("open", async () => {
      // Send authentication message with bearer token
      let token = getBearerToken();
      
      // If no token in localStorage, try to fetch one
      if (!token) {
        token = await fetchBearerToken();
      }
      
      if (token) {
        socket.send(JSON.stringify({ type: "auth", token }));
      } else {
        console.warn("PartyKit: No bearer token available for authentication");
      }
      setIsConnected(true);
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
    });

    socket.addEventListener("message", (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        const callbacks = callbacksRef.current;

        switch (message.type) {
          case "message:new":
            callbacks.onMessage?.(message.message);
            break;

          case "message:edit":
            callbacks.onMessageEdit?.(message.messageId, message.content, message.updatedAt);
            break;

          case "message:delete":
            callbacks.onMessageDelete?.(message.messageId);
            break;

          case "reaction:add":
            callbacks.onReactionAdd?.(message.messageId, message.reaction);
            break;

          case "reaction:remove":
            callbacks.onReactionRemove?.(message.messageId, message.reactionId);
            break;

          case "typing":
            if (message.isTyping) {
              setTypingUsers((prev) => new Map(prev).set(message.userId, message.userName));
            } else {
              setTypingUsers((prev) => {
                const next = new Map(prev);
                next.delete(message.userId);
                return next;
              });
            }
            callbacks.onTyping?.(message.userId, message.userName, message.isTyping);
            break;

          case "presence":
            callbacks.onPresence?.(message.users);
            break;

          case "connected":
            console.log("PartyKit connected:", message.userId);
            break;

          case "error":
            console.error("PartyKit error:", message.message);
            break;
        }
      } catch (error) {
        console.error("Failed to parse PartyKit message:", error);
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, roomType]); // Only reconnect when room changes, not when callbacks change

  // Send typing indicator
  const sendTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "typing", isTyping }));
    }
  }, []);

  // Mark message as read
  const sendRead = useCallback((messageId: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "read", messageId }));
    }
  }, []);

  return {
    isConnected,
    typingUsers: Array.from(typingUsers.values()),
    sendTyping,
    sendRead,
  };
}

// Helper hook for presence in an organization
export function usePresence(organizationId: string | null) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  const { isConnected } = usePartyKit({
    roomId: organizationId || "",
    roomType: "presence",
    onPresence: setUsers,
  });

  const onlineUsers = users.filter((u) => u.status === "online");
  const awayUsers = users.filter((u) => u.status === "away");

  return {
    isConnected,
    users,
    onlineUsers,
    awayUsers,
    onlineCount: onlineUsers.length,
  };
}

