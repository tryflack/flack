"use client";

import { createContext, useContext, useMemo } from "react";
import { usePresence } from "@/app/lib/hooks/use-presence";
import type { PresenceUser } from "@flack/realtime";

interface PresenceContextValue {
  users: PresenceUser[];
  isConnected: boolean;
  getStatus: (userId: string) => "online" | "away" | "offline";
  isOnline: (userId: string) => boolean;
  onlineUsers: PresenceUser[];
  setStatus: (status: "online" | "away") => void;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

interface PresenceProviderProps {
  organizationId: string;
  children: React.ReactNode;
}

export function PresenceProvider({
  organizationId,
  children,
}: PresenceProviderProps) {
  const presence = usePresence({ organizationId });

  const value = useMemo(
    () => ({
      users: presence.users,
      isConnected: presence.isConnected,
      getStatus: presence.getStatus,
      isOnline: presence.isOnline,
      onlineUsers: presence.onlineUsers,
      setStatus: presence.setStatus,
    }),
    [presence],
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext() {
  const context = useContext(PresenceContext);
  if (!context) {
    // Return a default value if not within provider (e.g., during SSR)
    return {
      users: [],
      isConnected: false,
      getStatus: () => "offline" as const,
      isOnline: () => false,
      onlineUsers: [],
      setStatus: () => {},
    };
  }
  return context;
}
