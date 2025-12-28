"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@flack/ui/components/avatar";
import { Button } from "@flack/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@flack/ui/components/dialog";
import { Input } from "@flack/ui/components/input";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Spinner } from "@flack/ui/components/spinner";
import { toast } from "sonner";
import { useMembers } from "@/app/lib/hooks/use-members";
import { useConversations } from "@/app/lib/hooks/use-conversations";
import { useActiveMember } from "@/app/lib/hooks/use-active-member";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { CreateGroupDmDialog } from "./create-group-dm-dialog";
import { cn } from "@flack/ui/lib/utils";

interface StartDmDialogProps {
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

export function StartDmDialog({ open, onOpenChange }: StartDmDialogProps) {
  const { members, isLoading: membersLoading } = useMembers();
  const { startDm } = useConversations();
  const { member: activeMember } = useActiveMember();
  const { navigateToDm } = useChatParams();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showGroupDmDialog, setShowGroupDmDialog] = useState(false);

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

  const handleStartDm = async (targetUserId: string) => {
    setIsStarting(true);
    setSelectedUserId(targetUserId);
    
    try {
      const result = await startDm(targetUserId);
      
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      
      if (result?.data?.conversation) {
        onOpenChange(false);
        navigateToDm(result.data.conversation.id);
        setSearchQuery("");
      }
    } catch (error) {
      toast.error("Failed to start conversation");
    } finally {
      setIsStarting(false);
      setSelectedUserId(null);
    }
  };

  const handleOpenGroupDm = () => {
    onOpenChange(false);
    setShowGroupDmDialog(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a conversation</DialogTitle>
            <DialogDescription>
              Select a team member to start a direct message.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Create group button */}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleOpenGroupDm}
            >
              <Users className="mr-2 h-4 w-4" />
              Create a group conversation
            </Button>

            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            
            <ScrollArea className="h-[280px] rounded-md border">
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
                  {filteredMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleStartDm(member.userId)}
                      disabled={isStarting}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                        isStarting && selectedUserId === member.userId && "opacity-50"
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
                      {isStarting && selectedUserId === member.userId && (
                        <Spinner className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <CreateGroupDmDialog
        open={showGroupDmDialog}
        onOpenChange={setShowGroupDmDialog}
      />
    </>
  );
}

