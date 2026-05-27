-- CreateTable
CREATE TABLE "FollowRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowRequest_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FollowRequest_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FollowRequest_followingId_idx" ON "FollowRequest"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "FollowRequest_followerId_followingId_key" ON "FollowRequest"("followerId", "followingId");
