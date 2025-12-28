"use client";

import { useEffect } from "react";
import { MessageArea } from "./message-area";
import { ThreadPanel } from "./thread-panel";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { useChannels } from "@/app/lib/hooks/use-channels";

export function ChatLayout() {
  const { activeChannel, activeDm, activeThread, navigateToChannel } = useChatParams();
  const { channels, isLoading } = useChannels();

  // Auto-select the first channel if no channel or DM is selected
  useEffect(() => {
    if (isLoading) return; // Wait for channels to load
    if (activeChannel || activeDm) return; // Already have a selection
    if (channels.length === 0) return; // No channels available

    // Find a default channel - prefer "general", otherwise use first member channel
    const memberChannels = channels.filter((c) => c.isMember);
    const generalChannel = memberChannels.find((c) => c.slug === "general");
    const defaultChannel = generalChannel ?? memberChannels[0];

    if (defaultChannel) {
      navigateToChannel(defaultChannel.slug);
    }
  }, [isLoading, activeChannel, activeDm, channels, navigateToChannel]);

  // Determine active room
  const activeChannelData = channels.find((c) => c.slug === activeChannel);
  const roomId = activeChannelData?.id ?? activeDm ?? null;
  const roomType: "channel" | "conversation" | null = activeChannelData
    ? "channel"
    : activeDm
      ? "conversation"
      : null;

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Message Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <MessageArea
          roomId={roomId}
          roomType={roomType}
          roomName={activeChannelData?.name}
          channel={activeChannelData}
        />
      </div>

      {/* Thread Panel */}
      {activeThread && (
        <ThreadPanel
          threadId={activeThread}
          roomId={roomId}
          roomType={roomType}
        />
      )}
    </div>
  );
}

