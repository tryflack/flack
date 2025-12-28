-- CreateTable
CREATE TABLE "channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "channel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "channel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "channel_member" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "channel_member_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "channel_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation_participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" DATETIME,
    CONSTRAINT "conversation_participant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "conversation_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT,
    "conversationId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "message_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "channel_organizationId_idx" ON "channel"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_organizationId_slug_key" ON "channel"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "channel_member_channelId_idx" ON "channel_member"("channelId");

-- CreateIndex
CREATE INDEX "channel_member_userId_idx" ON "channel_member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "channel_member_channelId_userId_key" ON "channel_member"("channelId", "userId");

-- CreateIndex
CREATE INDEX "conversation_organizationId_idx" ON "conversation"("organizationId");

-- CreateIndex
CREATE INDEX "conversation_participant_conversationId_idx" ON "conversation_participant"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_participant_userId_idx" ON "conversation_participant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participant_conversationId_userId_key" ON "conversation_participant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "message_organizationId_idx" ON "message"("organizationId");

-- CreateIndex
CREATE INDEX "message_channelId_idx" ON "message"("channelId");

-- CreateIndex
CREATE INDEX "message_conversationId_idx" ON "message"("conversationId");

-- CreateIndex
CREATE INDEX "message_parentId_idx" ON "message"("parentId");

-- CreateIndex
CREATE INDEX "message_authorId_idx" ON "message"("authorId");

-- CreateIndex
CREATE INDEX "reaction_messageId_idx" ON "reaction"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "reaction_messageId_userId_emoji_key" ON "reaction"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "attachment_messageId_idx" ON "attachment"("messageId");
