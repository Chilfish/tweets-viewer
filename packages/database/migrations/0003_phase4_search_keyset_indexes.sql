-- Phase 4A: 检索与 keyset 分页性能索引
-- 1. pg_trgm：ILIKE '%kw%' 子串搜索走 GIN 索引（全文检索升级，4A-1）
-- 2. 排序键表达式索引：keyset 分页按 (userName, sortKey DESC) 走索引（4A-2）
--    排序键 = COALESCE(jsonData->>'retweeted_original_id', "tweetId")（snowflake，时间有序）

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 全文检索（ILIKE %kw% → gin_trgm_ops）
CREATE INDEX IF NOT EXISTS idx_tweets_fulltext_trgm
  ON "tweets" USING GIN ("fullText" gin_trgm_ops);

-- keyset 分页（userName 过滤 + 排序键降序）
CREATE INDEX IF NOT EXISTS idx_tweets_username_sortkey
  ON "tweets" ("userName", (CAST(COALESCE("jsonData"->>'retweeted_original_id', "tweetId") AS BIGINT)) DESC);
