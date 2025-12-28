-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "channelId" TEXT,
    "conversationId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'message',
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
INSERT INTO "new_message" ("authorId", "channelId", "content", "conversationId", "createdAt", "deletedAt", "id", "isEdited", "organizationId", "parentId", "updatedAt") SELECT "authorId", "channelId", "content", "conversationId", "createdAt", "deletedAt", "id", "isEdited", "organizationId", "parentId", "updatedAt" FROM "message";
DROP TABLE "message";
ALTER TABLE "new_message" RENAME TO "message";
CREATE INDEX "message_organizationId_idx" ON "message"("organizationId");
CREATE INDEX "message_channelId_idx" ON "message"("channelId");
CREATE INDEX "message_conversationId_idx" ON "message"("conversationId");
CREATE INDEX "message_parentId_idx" ON "message"("parentId");
CREATE INDEX "message_authorId_idx" ON "message"("authorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
