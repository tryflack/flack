"use client";

import { useQueryState, parseAsString } from "nuqs";
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useChatParams() {
  const pathname = usePathname();
  const router = useRouter();
  const [channel, setChannel] = useQueryState("channel", parseAsString);
  const [dm, setDm] = useQueryState("dm", parseAsString);
  const [thread, setThread] = useQueryState("thread", parseAsString);

  // Extract org slug from pathname (e.g., "/my-org/settings" -> "my-org")
  const getOrgSlug = useCallback(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] || "";
  }, [pathname]);

  // Check if we're on a sub-page (settings, team, etc.) vs the main chat view
  const isOnSubPage = useCallback(() => {
    const parts = pathname.split("/").filter(Boolean);
    // If there's more than just the org slug, we're on a sub-page
    return parts.length > 1;
  }, [pathname]);

  const navigateToChannel = useCallback(
    (slug: string) => {
      if (isOnSubPage()) {
        // Navigate to the main org page with the channel param
        const orgSlug = getOrgSlug();
        router.push(`/${orgSlug}?channel=${slug}`);
      } else {
        // Already on the main page, just update query params
        setDm(null);
        setThread(null);
        setChannel(slug);
      }
    },
    [setChannel, setDm, setThread, isOnSubPage, getOrgSlug, router]
  );

  const navigateToDm = useCallback(
    (conversationId: string) => {
      if (isOnSubPage()) {
        // Navigate to the main org page with the dm param
        const orgSlug = getOrgSlug();
        router.push(`/${orgSlug}?dm=${conversationId}`);
      } else {
        // Already on the main page, just update query params
        setChannel(null);
        setThread(null);
        setDm(conversationId);
      }
    },
    [setChannel, setDm, setThread, isOnSubPage, getOrgSlug, router]
  );

  const openThread = useCallback(
    (messageId: string) => {
      setThread(messageId);
    },
    [setThread]
  );

  const closeThread = useCallback(() => {
    setThread(null);
  }, [setThread]);

  return {
    // Current state
    activeChannel: channel,
    activeDm: dm,
    activeThread: thread,
    organizationSlug: getOrgSlug(),

    // Navigation actions
    navigateToChannel,
    navigateToDm,
    openThread,
    closeThread,
  };
}

