-- 修复：`users.daily_fetch` 只存在于 schema.ts，历史上从未生成迁移
-- 原因：该列由 `drizzle-kit push` 直接推到线上库，`db:migrate` 无法在空库上复现
-- 预防：schema 变更一律经 `db:generate` 生成迁移；本迁移幂等，可安全重复执行
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "daily_fetch" boolean DEFAULT true NOT NULL;
