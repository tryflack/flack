# User Profile Features - Implementation Summary

This document tracks the user profile features that have been implemented.

## Completed Features

### 1. Database Schema Updates

- [x] Added `displayName` field (optional, shown instead of full name)
- [x] Added `firstName` field
- [x] Added `lastName` field
- [x] Added `bio` field (max ~500 chars)
- Migration: `20251228081153_add_profile_fields`

### 2. Avatar Upload (Vercel Blob Storage)

- [x] Installed `@vercel/blob` package
- [x] Created `actions/profile/upload-avatar.ts` server action
- [x] Max file size: 4MB
- [x] Accepted types: image/jpeg, image/png, image/webp
- [x] Old avatars are automatically deleted when uploading new ones

### 3. Profile Editing

- [x] Created `actions/profile/update-profile.ts` server action
- [x] Edit display name, first/last name, bio
- [x] Profile API endpoint: `GET /api/users/[userId]`

### 4. Profile Sidebar Sheet

- [x] Created `components/user-profile-sheet.tsx`
- [x] Uses Sheet component (slides from right)
- [x] Shows large avatar with presence indicator
- [x] Displays name, role, bio, member since date
- [x] "Edit Profile" button visible only when viewing own profile
- [x] Inline editing mode with form fields
- [x] Click avatar to upload new photo (own profile only)

### 5. Trigger Points (Clickable Names/Avatars)

- [x] **Message Item** - Click author name or avatar in messages
- [x] **Thread Panel** - Click author name or avatar in thread replies
- [x] **User Navigation** - "My Profile" menu item in user dropdown

### 6. Real-time Profile Updates

- [x] Added `user:updated` message type to PartyKit presence party
- [x] Profile actions broadcast updates to all user's organizations
- [x] Client-side presence hook handles updates and invalidates SWR caches
- [x] Avatar and display name changes propagate to all connected users immediately

## Architecture

### New Files Created

- `apps/web/app/actions/profile/update-profile.ts`
- `apps/web/app/actions/profile/upload-avatar.ts`
- `apps/web/app/actions/profile/index.ts`
- `apps/web/app/api/users/[userId]/route.ts`
- `apps/web/app/(dashboard)/[org-slug]/components/user-profile-sheet.tsx`
- `apps/web/app/(dashboard)/[org-slug]/components/user-profile-provider.tsx`

### Modified Files

- `packages/db/prisma/schema.prisma` - Added profile fields to User model
- `apps/web/app/(dashboard)/[org-slug]/layout.tsx` - Added UserProfileProvider
- `apps/web/app/(dashboard)/[org-slug]/components/message-item.tsx` - Added onAuthorClick prop
- `apps/web/app/(dashboard)/[org-slug]/components/message-list.tsx` - Added onAuthorClick prop
- `apps/web/app/(dashboard)/[org-slug]/components/message-area.tsx` - Wired up profile opening
- `apps/web/app/(dashboard)/[org-slug]/components/thread-panel.tsx` - Wired up profile opening
- `apps/web/app/components/user-navigation.tsx` - Added "My Profile" menu item
- `apps/web/app/lib/partykit.ts` - Added broadcastUserUpdated function
- `apps/web/app/lib/hooks/use-presence.ts` - Handle user:updated messages
- `packages/realtime/src/parties/presence.ts` - Added user:updated message handling
- `packages/realtime/src/lib/types.ts` - Added user:updated ServerMessage type

## Environment Variables Required

For Vercel Blob storage to work, you need to set:

```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

Get this from your Vercel project dashboard under Storage > Blob.

## Usage

### Opening a Profile

```tsx
import { useUserProfile } from "./user-profile-provider";

function MyComponent() {
  const { openProfile } = useUserProfile();

  return <button onClick={() => openProfile(userId)}>View Profile</button>;
}
```

### Updating Profile (Server Action)

```tsx
import { updateProfile } from "@/app/actions/profile";

await updateProfile({
  displayName: "Johnny",
  firstName: "John",
  lastName: "Doe",
  bio: "Software engineer from NYC",
});
```

### Uploading Avatar (Server Action)

```tsx
import { uploadAvatar } from "@/app/actions/profile";

await uploadAvatar({ file: selectedFile });
```
