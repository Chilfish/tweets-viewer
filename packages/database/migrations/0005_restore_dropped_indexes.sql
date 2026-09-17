-- 修复：0001 的两个索引在生产库中缺失
-- 原因：`drizzle-kit push` 按 schema.ts 对齐数据库，而 schema 当时未声明这些索引 → 被 DROP
--       （0001 已记录为 applied，`db:migrate` 不会重跑，故单开本迁移补回）
-- 预防：schema.ts 现已声明全部查询索引，push 不再会删除它们；本迁移幂等，可安全重复执行
CREATE INDEX IF NOT EXISTS idx_tweets_username_createdat ON "tweets" ("userName", "createdAt" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tweets_createdat ON "tweets" ("createdAt");
