"use client";

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  const getText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    }
    if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    }
    return `${users[0]} and ${users.length - 1} others are typing...`;
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground">
      <span className="flex gap-0.5">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
          •
        </span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
          •
        </span>
      </span>
      <span>{getText()}</span>
    </div>
  );
}


