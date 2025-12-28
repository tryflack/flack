"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { QuickEmojiPicker } from "./emoji-picker";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { Button } from "@flack/ui/components/button";
import { Textarea } from "@flack/ui/components/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@flack/ui/components/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@flack/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flack/ui/components/tooltip";
import { Spinner } from "@flack/ui/components/spinner";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import type { Message } from "@/app/lib/hooks/use-messages";
import { cn } from "@flack/ui/lib/utils";
import { toast } from "sonner";

interface MessageItemProps {
  message: Message;
  showAvatar?: boolean;
  currentUserId?: string;
  onEdit?: (
    messageId: string,
    content: string,
  ) => Promise<{ serverError?: string } | undefined>;
  onDelete?: (
    messageId: string,
  ) => Promise<{ serverError?: string } | undefined>;
  onReact?: (messageId: string, emoji: string) => Promise<void>;
  onAuthorClick?: (userId: string) => void;
}

export function MessageItem({
  message,
  showAvatar = true,
  currentUserId,
  onEdit,
  onDelete,
  onReact,
  onAuthorClick,
}: MessageItemProps) {
  const { openThread } = useChatParams();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDeleted = !!message.deletedAt;
  const isAuthor = currentUserId === message.authorId;

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }
  }, [isEditing]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name, preferring displayName over name
  const getDisplayName = (user: {
    name: string;
    displayName?: string | null;
  }) => {
    return user.displayName || user.name;
  };

  const authorDisplayName = getDisplayName(message.author);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce(
    (acc, reaction) => {
      const reactionUserName = reaction.user.displayName || reaction.user.name;
      const existing = acc.find((r) => r.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reactionUserName);
        if (reaction.userId === currentUserId) {
          existing.hasReacted = true;
        }
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reactionUserName],
          hasReacted: reaction.userId === currentUserId,
        });
      }
      return acc;
    },
    [] as {
      emoji: string;
      count: number;
      users: string[];
      hasReacted: boolean;
    }[],
  );

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (!onEdit || editContent.trim() === message.content) {
      handleCancelEdit();
      return;
    }

    if (!editContent.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onEdit(message.id, editContent.trim());
      if (result?.serverError) {
        toast.error(result.serverError);
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to edit message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsSubmitting(true);
    try {
      const result = await onDelete(message.id);
      if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error("Failed to delete message");
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // System messages (join/leave notifications)
  if (message.type === "system") {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1">
          <span className="text-xs text-muted-foreground">
            {message.content}
          </span>
          <span className="text-[10px] text-muted-foreground/60">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div
        className={cn(
          "group relative flex gap-3 px-1 py-1",
          showAvatar ? "items-start" : "items-center",
        )}
      >
        {showAvatar ? <div className="w-9" /> : <div className="w-9" />}
        <p className="text-sm italic text-muted-foreground">
          This message was deleted
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "group relative flex gap-3 rounded-md px-1 py-1 transition-colors hover:bg-muted/50",
          showAvatar ? "items-start" : "items-center",
          isEditing && "bg-muted/50",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Avatar or spacing */}
        {showAvatar ? (
          <button
            type="button"
            onClick={() => onAuthorClick?.(message.authorId)}
            className="shrink-0 rounded-full transition-opacity hover:opacity-80"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={message.author.image || undefined} />
              <AvatarFallback>{getInitials(authorDisplayName)}</AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <div className="w-9 shrink-0 text-center">
            <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {showAvatar && (
            <div className="flex items-baseline gap-2">
              <button
                type="button"
                onClick={() => onAuthorClick?.(message.authorId)}
                className="font-semibold text-sm hover:underline"
              >
                {authorDisplayName}
              </button>
              <span className="text-xs text-muted-foreground">
                {formatTime(message.createdAt)}
              </span>
              {message.isEdited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[60px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting || !editContent.trim()}
                >
                  {isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Check className="mr-1 h-4 w-4" />
                  )}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <span className="text-xs text-muted-foreground">
                  Press Enter to save, Escape to cancel
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Reactions */}
          {!isEditing && groupedReactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {groupedReactions.map(({ emoji, count, users, hasReacted }) => (
                <TooltipProvider key={emoji}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onReact?.(message.id, emoji)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
                          hasReacted
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "bg-muted hover:bg-muted/80",
                        )}
                      >
                        <span>{emoji}</span>
                        <span>{count}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{users.join(", ")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* Thread preview */}
          {!isEditing && message.replyCount > 0 && (
            <button
              onClick={() => openThread(message.id)}
              className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <MessageSquare className="h-3 w-3" />
              {message.replyCount}{" "}
              {message.replyCount === 1 ? "reply" : "replies"}
            </button>
          )}
        </div>

        {/* Hover actions */}
        {isHovered && !isEditing && (
          <div className="absolute -top-3 right-2 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openThread(message.id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply in thread</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <QuickEmojiPicker
              onEmojiSelect={(emoji) => onReact?.(message.id, emoji)}
              disabled={!onReact}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && onEdit && (
                  <DropdownMenuItem onClick={handleStartEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit message
                  </DropdownMenuItem>
                )}
                {(isAuthor || onDelete) && (
                  <>
                    {isAuthor && onEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete message
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
