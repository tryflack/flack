"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@flack/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flack/ui/components/tooltip";
import { cn } from "@flack/ui/lib/utils";

// Common emoji categories
const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😜", "🤪", "😎", "🤩", "🥳"],
  "Gestures": ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "🤟", "🤘", "👌", "🤙", "💪", "🙏", "👋", "🖐️", "✋", "🤚", "👊", "✊", "🫡"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💞", "💓", "💗", "💖", "💝", "💘", "💔", "❣️", "💟", "♥️", "🩷"],
  "Objects": ["🎉", "🎊", "🎁", "🏆", "🥇", "⭐", "🌟", "✨", "💫", "🔥", "💯", "✅", "❌", "⚡", "💡", "🎯", "🚀", "💎", "🎵", "📌"],
  "Faces": ["🤔", "😐", "😑", "😶", "🙄", "😏", "😒", "🤨", "🧐", "🤓", "😤", "😠", "😡", "🤬", "😈", "👿", "💀", "☠️", "😱", "😰"],
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EmojiPicker({ onEmojiSelect, disabled, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>("Smileys");

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", className)}
                disabled={disabled}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Add reaction</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-[320px] p-0" align="end">
        {/* Category tabs */}
        <div className="flex gap-1 border-b p-2">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
            >
              {category}
            </Button>
          ))}
        </div>
        
        {/* Emoji grid */}
        <div className="grid grid-cols-10 gap-1 p-2">
          {EMOJI_CATEGORIES[activeCategory].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Quick emoji reactions for message hover toolbar
const QUICK_EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "👀"];

interface QuickEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function QuickEmojiPicker({ onEmojiSelect, disabled }: QuickEmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={disabled}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Add reaction</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-auto p-1" align="end">
        <div className="flex gap-0.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

