-- 性能优化：添加关键查询索引
-- 复合索引：用户 + 创建时间 DESC (主推文列表查询)
CREATE INDEX IF NOT EXISTS idx_tweets_username_createdat ON "tweets" ("userName", "createdAt" DESC);
-- 单列索引：创建时间 (那年今日、日期范围查询)
CREATE INDEX IF NOT EXISTS idx_tweets_createdat ON "tweets" ("createdAt");
