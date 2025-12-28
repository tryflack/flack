"use client";

import { Search } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Kbd } from "@flack/ui/components/kbd";
import { ChannelList } from "./channel-list";
import { DmList } from "./dm-list";

interface ChatSidebarProps {
  onSearchClick?: () => void;
}

export function ChatSidebar({ onSearchClick }: ChatSidebarProps) {
  return (
    <aside className="flex w-60 flex-col border-r bg-muted/30">
      {/* Search Button */}
      <div className="p-3 pb-0">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onSearchClick}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left text-sm">Search</span>
          <Kbd className="ml-auto">⌘K</Kbd>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-3">
          <ChannelList />
          <DmList />
        </div>
      </ScrollArea>
    </aside>
  );
}
