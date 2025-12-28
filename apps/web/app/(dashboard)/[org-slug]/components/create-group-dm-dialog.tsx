"use client";

import { useState } from "react";
import { X, Check, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@flack/ui/components/avatar";
import { Badge } from "@flack/ui/components/badge";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Spinner } from "@flack/ui/components/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@flack/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@flack/ui/components/field";
import { toast } from "sonner";
import { useMembers } from "@/app/lib/hooks/use-members";
import { useActiveMember } from "@/app/lib/hooks/use-active-member";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { createGroupDm } from "@/app/actions/conversations/create-group-dm";
import { cn } from "@flack/ui/lib/utils";

interface CreateGroupDmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CreateGroupDmDialog({ open, onOpenChange }: CreateGroupDmDialogProps) {
  const { members, isLoading: membersLoading } = useMembers();
  const { member: activeMember } = useActiveMember();
  const { navigateToDm } = useChatParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Filter out the current user and apply search filter
  const filteredMembers = members.filter((m) => {
    if (m.userId === activeMember?.userId) return false;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      m.user.name.toLowerCase().includes(query) ||
      m.user.email.toLowerCase().includes(query)
    );
  });

  const selectedMembers = members.filter((m) => selectedUserIds.includes(m.userId));

  const toggleSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const removeSelection = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleCreate = async () => {
    if (selectedUserIds.length < 2) {
      toast.error("Select at least 2 members for a group conversation");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createGroupDm({
        participantIds: selectedUserIds,
        name: groupName.trim() || undefined,
      });

      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }

      if (result?.data?.conversation) {
        toast.success("Group conversation created");
        onOpenChange(false);
        navigateToDm(result.data.conversation.id);
        // Reset state
        setSelectedUserIds([]);
        setGroupName("");
        setSearchQuery("");
      }
    } catch (error) {
      toast.error("Failed to create group conversation");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedUserIds([]);
      setGroupName("");
      setSearchQuery("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create group conversation
          </DialogTitle>
          <DialogDescription>
            Select members to start a group conversation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Group name input */}
          <Field>
            <FieldLabel htmlFor="group-name">Group name (optional)</FieldLabel>
            <Input
              id="group-name"
              placeholder="e.g., Project Team"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={80}
            />
            <FieldDescription>
              Leave blank to use participant names
            </FieldDescription>
          </Field>

          {/* Selected members */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <span>{member.user.name}</span>
                  <button
                    onClick={() => removeSelection(member.userId)}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Search input */}
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          <ScrollArea className="h-[250px] rounded-md border">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-5 w-5" />
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No members found" : "No other members in this workspace"}
                </p>
              </div>
            ) : (
              <div className="p-2">
                {filteredMembers.map((member) => {
                  const isSelected = selectedUserIds.includes(member.userId);
                  return (
                    <button
                      key={member.id}
                      onClick={() => toggleSelection(member.userId)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent"
                      )}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.user.image ?? undefined} />
                        <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {member.user.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {member.user.email}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedUserIds.length} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || selectedUserIds.length < 2}
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> Creating...
                  </span>
                ) : (
                  "Create group"
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

