-- 媒体时间线性能（见 #9）：覆盖 jsonb 媒体谓词的 partial index
-- 谓词与 getMediaTweets 的 whereClause 对齐：非转推 + media_details 为非空数组；
-- 排序键与 keyset 分页一致：COALESCE(retweeted_original_id, tweetId)（snowflake，时间有序）。
-- 涉及的 jsonb 函数（json_typeof / json_array_length / ->>）均为 immutable，可作 partial index 谓词。
CREATE INDEX IF NOT EXISTS idx_tweets_media_sortkey
  ON "tweets" ("userName", (CAST(COALESCE("jsonData"->>'retweeted_original_id', "tweetId") AS BIGINT)) DESC)
  WHERE json_typeof("jsonData"->'media_details') = 'array'
    AND json_array_length("jsonData"->'media_details') > 0
    AND "jsonData"->>'retweeted_original_id' IS NULL;
