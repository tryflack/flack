"use client"

import * as React from "react"
import { useState } from "react"
import { ChevronRight, Hash, Lock, MessageSquare, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

import { NavUser } from "./user-navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@flack/ui/components/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@flack/ui/components/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@flack/ui/components/avatar"
import { Skeleton } from "@flack/ui/components/skeleton"
import { useChatParams } from "@/app/lib/hooks/use-chat-params"
import { useChannels } from "@/app/lib/hooks/use-channels"
import { useConversations } from "@/app/lib/hooks/use-conversations"
import { authClient } from "@flack/auth/auth-client"
import { CreateChannelDialog } from "@/app/(dashboard)/[org-slug]/components/create-channel-dialog"
import { StartDmDialog } from "@/app/(dashboard)/[org-slug]/components/start-dm-dialog"
import { BrowseChannelsDialog } from "@/app/(dashboard)/[org-slug]/components/browse-channels-dialog"
import { AvatarWithPresence } from "@/app/(dashboard)/[org-slug]/components/presence-indicator"
import { usePresenceContext } from "@/app/(dashboard)/[org-slug]/components/presence-provider"
import { cn } from "@flack/ui/lib/utils"

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
}

interface OrganizationSidebarProps extends React.ComponentProps<typeof Sidebar> {
  organization: Organization;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ChannelSection() {
  const { activeChannel, navigateToChannel } = useChatParams();
  const { channels, isLoading } = useChannels();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBrowseDialog, setShowBrowseDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Only show channels the user is a member of in the sidebar
  const memberChannels = channels.filter((c) => c.isMember);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center">
              <ChevronRight className="mr-1 h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              Channels
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <SidebarGroupAction onClick={() => setShowCreateDialog(true)} title="Create Channel">
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>
          <CollapsibleContent>
            <SidebarMenu>
              {isLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <SidebarMenuItem key={i}>
                      <Skeleton className="h-7 w-full" />
                    </SidebarMenuItem>
                  ))}
                </>
              ) : (
                <>
                  {memberChannels.length === 0 ? (
                    <SidebarMenuItem>
                      <span className="px-2 py-1 text-xs text-muted-foreground">
                        No channels yet
                      </span>
                    </SidebarMenuItem>
                  ) : (
                    memberChannels.map((channel) => (
                      <SidebarMenuItem key={channel.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeChannel === channel.slug}
                          tooltip={channel.name}
                        >
                          <button onClick={() => navigateToChannel(channel.slug)}>
                            {channel.isPrivate ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Hash className="h-4 w-4" />
                            )}
                            <span className="truncate">{channel.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                  {/* Browse channels button */}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Browse all channels"
                    >
                      <button
                        onClick={() => setShowBrowseDialog(true)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="truncate">Browse channels</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <CreateChannelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      <BrowseChannelsDialog
        open={showBrowseDialog}
        onOpenChange={setShowBrowseDialog}
      />
    </>
  );
}

function DirectMessagesSection() {
  const { activeDm, navigateToDm } = useChatParams();
  const { conversations, isLoading } = useConversations();
  const { getStatus } = usePresenceContext();
  const { data: session } = authClient.useSession();
  const [isOpen, setIsOpen] = useState(true);
  const [showStartDmDialog, setShowStartDmDialog] = useState(false);

  const currentUserId = session?.user?.id;

  // Use conversation.name which is already computed correctly by the API
  // (it shows the OTHER participant's name for DMs)
  const getDisplayName = (conversation: (typeof conversations)[0]) => {
    return conversation.name || "Unknown";
  };

  // For avatar and presence, we need to find the OTHER participant
  // The current user is also in the participants array, so we need to filter them out
  const getOtherParticipant = (conversation: (typeof conversations)[0]) => {
    if (!currentUserId) return conversation.participants[0];
    return conversation.participants.find((p) => p.userId !== currentUserId) ?? conversation.participants[0];
  };

  const getAvatarUrl = (conversation: (typeof conversations)[0]) => {
    if (conversation.type === "dm") {
      const other = getOtherParticipant(conversation);
      return other?.user.image;
    }
    return null;
  };

  const getOtherUserId = (conversation: (typeof conversations)[0]) => {
    if (conversation.type === "dm") {
      const other = getOtherParticipant(conversation);
      return other?.user.id;
    }
    return null;
  };

  return (
    <>
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="flex w-full items-center">
            <ChevronRight className="mr-1 h-3.5 w-3.5 transition-transform group-data-[state=open]/collapsible:rotate-90" />
            Direct Messages
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <SidebarGroupAction onClick={() => setShowStartDmDialog(true)} title="Start DM">
          <Plus className="h-4 w-4" />
        </SidebarGroupAction>
        <CollapsibleContent>
          <SidebarMenu>
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <SidebarMenuItem key={i}>
                    <Skeleton className="h-8 w-full" />
                  </SidebarMenuItem>
                ))}
              </>
            ) : conversations.length === 0 ? (
              <SidebarMenuItem>
                <span className="px-2 py-1 text-xs text-muted-foreground">
                  No conversations yet
                </span>
              </SidebarMenuItem>
            ) : (
              conversations.map((conversation) => {
                const displayName = getDisplayName(conversation);
                const avatarUrl = getAvatarUrl(conversation);
                const otherUserId = getOtherUserId(conversation);
                const userStatus = otherUserId ? getStatus(otherUserId) : undefined;
                // Note: getAvatarUrl and getOtherUserId now use currentUserId from scope

                return (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeDm === conversation.id}
                      tooltip={displayName}
                    >
                      <button onClick={() => navigateToDm(conversation.id)}>
                        {conversation.type === "dm" ? (
                          <AvatarWithPresence status={userStatus} size="sm">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={avatarUrl || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                          </AvatarWithPresence>
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        <span className="truncate">{displayName}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>

    <StartDmDialog
      open={showStartDmDialog}
      onOpenChange={setShowStartDmDialog}
    />
    </>
  );
}

export function OrganizationSidebar({ organization, ...props }: OrganizationSidebarProps) {
  const logoDomain = organization.domain ?? `${organization.slug}.com`;

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href={`/${organization.slug}`}>
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                  <Image src={`https://img.logo.dev/${logoDomain}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY}`} alt={organization.name} width={32} height={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{organization.name}</span>
                  <span className="truncate text-xs">{organization.slug}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ChannelSection />
        <DirectMessagesSection />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
