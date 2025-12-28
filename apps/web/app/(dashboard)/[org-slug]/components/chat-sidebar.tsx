"use client";

import { ScrollArea } from "@flack/ui/components/scroll-area";
import { ChannelList } from "./channel-list";
import { DmList } from "./dm-list";

export function ChatSidebar() {
  return (
    <aside className="flex w-60 flex-col border-r bg-muted/30">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          <ChannelList />
          <DmList />
        </div>
      </ScrollArea>
    </aside>
  );
}

