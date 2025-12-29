"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { UserProfileSheet } from "./user-profile-sheet";

interface UserProfileContextValue {
  openProfile: (userId: string) => void;
  closeProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

interface UserProfileProviderProps {
  children: React.ReactNode;
}

export function UserProfileProvider({ children }: UserProfileProviderProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openProfile = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <UserProfileContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      {selectedUserId && (
        <UserProfileSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          userId={selectedUserId}
        />
      )}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
}


