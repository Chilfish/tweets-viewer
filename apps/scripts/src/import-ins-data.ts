/**
 * Import Instagram JSON data (IGPost[]) into the database.
 *
 * Reads local JSON files, extracts IGUserInfo from first post, and
 * upserts both user and posts to ins_users / ins_posts tables.
 *
 * Usage:
 *   bun run apps/scripts/src/import-ins-data.ts <file.json> [<file2.json> ...]
 *
 * Env:
 *   DATABASE_URL — Neon Postgres connection string
 */

import type { IGPost, IGUserInfo } from '@tweets-viewer/shared'
import { neon } from '@neondatabase/serverless'
import { createInsPosts, createInsUser } from '@tweets-viewer/database'
import * as schema from '@tweets-viewer/database/schema'
import { drizzle } from 'drizzle-orm/neon-http'
import 'dotenv'

const filePaths = process.argv.slice(2).filter(a => !a.startsWith('-'))
if (filePaths.length === 0) {
  console.error('Usage: bun run apps/scripts/src/import-ins-data.ts <file.json> [<file2.json> ...]')
  process.exit(1)
}

const db = drizzle({
  client: neon(process.env.DATABASE_URL!),
  schema,
})

async function importFile(filePath: string): Promise<void> {
  console.log(`\nImporting ${filePath} ...`)

  const raw = await Bun.file(filePath).text()
  const posts: IGPost[] = JSON.parse(raw)
  console.log(`  Read ${posts.length} posts`)

  if (posts.length === 0)
    return

  const username = posts[0].username

  const user: IGUserInfo = {
    username: posts[0].username,
    fullname: posts[0].fullname,
    avatar_url: posts[0].avatar_url,
    verified: posts[0].verified,
    posts_count: posts.length,
  }

  await createInsUser({ db, user })
  console.log(`  User: ${user.fullname} (@${user.username})`)

  const { rowCount } = await createInsPosts({ db, posts, username })
  console.log(`  Posts: ${rowCount}/${posts.length}`)
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
