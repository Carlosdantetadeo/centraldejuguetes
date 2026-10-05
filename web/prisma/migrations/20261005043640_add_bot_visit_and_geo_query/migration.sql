-- CreateTable
CREATE TABLE "BotVisit" (
    "id" TEXT NOT NULL,
    "botName" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeoQuery" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "foundChatGpt" BOOLEAN NOT NULL DEFAULT false,
    "foundGemini" BOOLEAN NOT NULL DEFAULT false,
    "foundPerplexity" BOOLEAN NOT NULL DEFAULT false,
    "foundCopilot" BOOLEAN NOT NULL DEFAULT false,
    "foundClaude" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeoQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BotVisit_botName_createdAt_idx" ON "BotVisit"("botName", "createdAt");
