-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Watchlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'movie'
);
INSERT INTO "new_Watchlist" ("id", "userId", "mediaId", "type") SELECT "id", "userId", "mediaId", "type" FROM "Watchlist";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
CREATE UNIQUE INDEX "Watchlist_userId_mediaId_type_key" ON "Watchlist"("userId", "mediaId", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
