import { useEffect, useState, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import { getBearerToken, fetchBearerToken } from "@flack/auth/auth-client";
import type { PresenceUser } from "@flack/realtime";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

interface UsePresenceOptions {
  organizationId: string | null;
}

export function usePresence({ organizationId }: UsePresenceOptions) {
  const [users, setUsers] = useState<Map<string, PresenceUser>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<PartySocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's online status
  const getStatus = useCallback(
    (userId: string): "online" | "away" | "offline" => {
      return users.get(userId)?.status ?? "offline";
    },
    [users]
  );

  // Check if user is online
  const isOnline = useCallback(
    (userId: string): boolean => {
      return getStatus(userId) === "online";
    },
    [getStatus]
  );

  // Get all online users
  const onlineUsers = Array.from(users.values()).filter(
    (u) => u.status === "online"
  );

  useEffect(() => {
    if (!organizationId) return;

    const connect = async () => {
      // Get token for PartyKit auth (same approach as use-partykit.ts)
      let token = getBearerToken();
      if (!token) {
        token = await fetchBearerToken();
      }

      if (!token) {
        console.warn("No bearer token available for presence");
        return;
      }

      // Connect to presence party for this organization
      const socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: organizationId, // Just use orgId, party handles the namespace
        party: "presence",
      });

      socketRef.current = socket;

      socket.onopen = () => {
        // Authenticate with the presence party
        socket.send(JSON.stringify({ type: "auth", token }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "connected":
              setIsConnected(true);
              break;

            case "presence":
              // Update presence state
              const newUsers = new Map<string, PresenceUser>();
              for (const user of data.users as PresenceUser[]) {
                newUsers.set(user.id, user);
              }
              setUsers(newUsers);
              break;

            case "error":
              console.error("Presence error:", data.message);
              break;
          }
        } catch (err) {
          console.error("Failed to parse presence message:", err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      socket.onerror = (error) => {
        console.error("Presence socket error:", error);
      };
    };

    connect();

    // Send periodic pings to keep connection alive
    const pingInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
    };
  }, [organizationId]);

  // Update status (e.g., set to "away" when tab is inactive)
  const setStatus = useCallback((status: "online" | "away") => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "status", status }));
    }
  }, []);

  return {
    users: Array.from(users.values()),
    isConnected,
    getStatus,
    isOnline,
    onlineUsers,
    setStatus,
  };
}

