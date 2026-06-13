/**
 * Import Instagram JSON data into the database.
 *
 * Reads local JSON files in the format:
 *   { "user": {...}, "posts": IGPost[] }
 *
 * Maps IG username → twitter username via mapping.ts, then:
 *   1. Upserts IG user info into users.ins_json_data
 *   2. Batch-inserts posts into ins_posts with FK = twitter username
 *
 * Usage:
 *   bun run apps/scripts/src/import-ins-data.ts <file.json> [<file2.json> ...]
 *
 * Env:
 *   DATABASE_URL — Neon Postgres connection string
 */

import type { IGPost, IGUserInfo } from '@tweets-viewer/shared'
import { neon } from '@neondatabase/serverless'
import { createInsPosts, upsertInsUserInfo } from '@tweets-viewer/database'
import * as schema from '@tweets-viewer/database/schema'
import { drizzle } from 'drizzle-orm/neon-http'
import { INSUsernameToTwitter } from './mapping'
import 'dotenv'

/** 导入 JSON 文件中 user 部分的原始结构 */
interface InsImportUser {
  userName: string
  fullName: string
  profileImage?: string
  isVerified?: boolean
  description?: string
  url?: string
  followersCount?: number
  followingsCount?: number
  statusesCount?: number
}

/** 导入 JSON 文件的顶层结构 */
interface InsImportData {
  user: InsImportUser
  posts: IGPost[]
}

const filePaths = process.argv.slice(2).filter(a => !a.startsWith('-'))
if (filePaths.length === 0) {
  console.error('Usage: bun run apps/scripts/src/import-ins-data.ts <file.json> [<file2.json> ...]')
  process.exit(1)
}

const db = drizzle({
  client: neon(process.env.DATABASE_URL!),
  schema,
})

/** 将导入格式的 user 字段映射为 IGUserInfo */
function mapUser(raw: InsImportUser): IGUserInfo {
  return {
    username: raw.userName,
    fullname: raw.fullName,
    avatar_url: raw.profileImage,
    verified: raw.isVerified,
    bio: raw.description,
    external_url: raw.url,
    followers_count: raw.followersCount,
    following_count: raw.followingsCount,
    posts_count: raw.statusesCount,
  }
}

async function importFile(filePath: string): Promise<void> {
  console.log(`\nImporting ${filePath} ...`)

  const raw = await Bun.file(filePath).text()
  const data: InsImportData = JSON.parse(raw)
  const { user: rawUser, posts } = data

  console.log(`  User: ${rawUser.fullName} (@${rawUser.userName})`)
  console.log(`  Posts: ${posts.length}`)

  if (posts.length === 0) {
    console.log('  No posts to import, skipping.')
    return
  }

  const insUsername = rawUser.userName
  const twitterUsername = INSUsernameToTwitter[insUsername]
  if (!twitterUsername) {
    console.error(`  ✗ No twitter mapping for IG username "${insUsername}" — add to mapping.ts`)
    return
  }

  const user = mapUser(rawUser)

  // Upsert IG user info into users table
  await upsertInsUserInfo({
    db,
    twitterUsername,
    insUsername,
    user,
  })
  console.log(`  User info → users.ins_json_data (twitter: @${twitterUsername})`)

  // Batch-insert posts referencing twitter username as FK
  const { rowCount } = await createInsPosts({ db, posts, username: twitterUsername })
  console.log(`  Inserted posts: ${rowCount}/${posts.length}`)
}

async function main(): Promise<void> {
  console.log(`Importing ${filePaths.length} file(s): ${filePaths.join(', ')}`)

  for (const fp of filePaths) {
    try {
      await importFile(fp)
    }
    catch (err: any) {
      console.error(`  Error ${fp}:`, err.message)
    }
  }

  console.log('\nImport complete.')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
