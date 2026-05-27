-- Add mediaType to Review (TMDB ids overlap between movie and tv)
ALTER TABLE "Review" ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'movie';

-- One watchlist row per user+mediaId; keep tv over movie when deduping
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Watchlist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "mediaId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'movie'
);
INSERT INTO "new_Watchlist" ("userId", "mediaId", "type")
SELECT
  "userId",
  "mediaId",
  COALESCE(MAX(CASE WHEN "type" = 'tv' THEN 'tv' END), MAX("type"))
FROM "Watchlist"
GROUP BY "userId", "mediaId";
DROP TABLE "Watchlist";
ALTER TABLE "new_Watchlist" RENAME TO "Watchlist";
CREATE UNIQUE INDEX "Watchlist_userId_mediaId_key" ON "Watchlist"("userId", "mediaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
