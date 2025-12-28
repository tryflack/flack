# Flack - Implementation TODO

This file tracks the remaining UI features that need to be implemented based on the existing server actions.

## Recently Completed (Current Session)

| Feature                   | Description                                            | Files                                                             |
| ------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------- |
| Default Channels          | Auto-create general + announcements on org creation    | `actions/channels/create-default-channels.ts`                     |
| Start DM Dialog           | Member picker to start new conversations               | `components/start-dm-dialog.tsx`                                  |
| Message Edit/Delete       | Inline editing and delete confirmation                 | `components/message-item.tsx`                                     |
| Emoji Picker              | Quick reaction picker with toggle support              | `components/emoji-picker.tsx`                                     |
| Channel Settings          | Settings dialog with edit, delete, leave, members view | `components/channel-settings-dialog.tsx`                          |
| Browse Channels           | Discover and join public channels                      | `components/browse-channels-dialog.tsx`                           |
| Group DM                  | Multi-select member picker for group conversations     | `components/create-group-dm-dialog.tsx`                           |
| User Presence             | Online status indicators on avatars                    | `components/presence-indicator.tsx`, `use-presence.ts`            |
| Channel Member Management | Invite/remove members from channels                    | `actions/channels/invite-to-channel.ts`, `remove-from-channel.ts` |
| Channel Info Dialog       | Click channel name in header for details               | `components/channel-info-dialog.tsx`                              |
| Unread Messages           | Unread counts in sidebar, mark as read on view         | `actions/messages/mark-as-read.ts`, API updates                   |

## Summary of Ready Actions

| Category          | Actions                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **Channels**      | createChannel, updateChannel, deleteChannel, joinChannel, leaveChannel, inviteToChannel, removeFromChannel |
| **Conversations** | createDm, createGroupDm, addParticipant, removeParticipant, updateConversation                             |
| **Messages**      | sendMessage, editMessage, deleteMessage, addReaction, removeReaction, markAsRead                           |
| **Members**       | inviteMember, resendInvitation, cancelInvitation, removeMember, updateRole                                 |

---

## Implementation Progress

### Priority 1: Core Features

- [x] **Default Channels on Org Creation** ✓
  - Created `general` and `announcements` channels automatically when a new organization is created
  - Location: `apps/web/app/(onboarding)/setup/workspace/page.tsx`
  - New action: `actions/channels/create-default-channels.ts`

- [x] **Start DM Dialog** ✓
  - Added "+" button to DM section in sidebar
  - Created member picker dialog: `components/start-dm-dialog.tsx`
  - Wired to `createDm` action via `useConversations` hook

- [x] **Wire Message Edit/Delete** ✓
  - Connected edit button to inline editing mode with save/cancel
  - Connected delete button with confirmation dialog
  - Added permission checks (author only for edit, author/admin for delete)
  - Location: `apps/web/app/(dashboard)/[org-slug]/components/message-item.tsx`

- [x] **Emoji Reaction Picker** ✓
  - Created `emoji-picker.tsx` with `QuickEmojiPicker` component
  - Wired to `addReaction` action
  - Added toggle behavior with `removeReaction` (click existing reaction to remove)

### Priority 2: Channel Management

- [x] **Channel Settings Dialog** ✓
  - Created `channel-settings-dialog.tsx` with tabs for General/Members
  - Edit name, description, privacy toggle
  - Delete channel and leave channel options
  - Wired to `updateChannel`, `deleteChannel`, and `leaveChannel` actions

- [x] **Browse/Join/Leave Channels** ✓
  - Created `browse-channels-dialog.tsx` with search and join functionality
  - Added "Browse channels" button in sidebar
  - Leave channel option in channel settings dialog
  - Wired to `joinChannel` and `leaveChannel` actions

- [x] **Channel Member Management** ✓
  - Added "Add member" button in channel settings Members tab
  - Member search and picker for inviting users to channels
  - Remove member functionality with confirmation dialog
  - New actions: `actions/channels/invite-to-channel.ts`, `remove-from-channel.ts`

### Priority 3: Polish Features

- [x] **Channel Info Dialog from Header** ✓
  - Click channel name in header to open channel info dialog
  - Shows channel description, member count, member list with presence
  - Quick access to settings and leave channel
  - Created: `components/channel-info-dialog.tsx`

- [x] **User Presence Indicators** ✓
  - Created `use-presence.ts` hook for subscribing to presence updates
  - Created `presence-indicator.tsx` and `AvatarWithPresence` component
  - Created `presence-provider.tsx` context for organization-wide presence
  - Added presence indicators to DM list in sidebar

- [x] **Create Group DM** ✓
  - Created `create-group-dm-dialog.tsx` with multi-select member picker
  - Optional group name input
  - Accessible from "Create group" button in Start DM dialog
  - Wired to `createGroupDm` action

### Priority 4: Larger Features

- [x] **Unread Messages** ✓
  - Added `lastReadAt` field to `ChannelMember` model
  - Track last read message per channel/conversation
  - Show unread count badges in sidebar with bold text for unread rooms
  - Mark as read automatically when viewing channel/conversation
  - New action: `actions/messages/mark-as-read.ts`
  - Updated API routes to include unread counts

- [ ] **Search**
  - Global search modal (Cmd+K)
  - Search messages, channels, members
  - New API routes and hooks needed

- [ ] **Notifications System**
  - Unread message counts
  - Notification preferences
  - Desktop/push notifications (optional)

- [ ] **File Attachments**
  - File upload in message input
  - Attachment display in messages
  - Storage integration (S3/R2)

---

## Notes

- Actions are located in `apps/web/app/actions/`
- UI components are in `apps/web/app/(dashboard)/[org-slug]/components/`
- SWR hooks are in `apps/web/app/lib/hooks/`
- Real-time is handled via PartyKit in `packages/realtime/`
