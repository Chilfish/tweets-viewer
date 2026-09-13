/**
 * 临时诊断脚本（配合 .github/workflows/probe-proxy.yml 使用）：
 * 经 TWEET_PROXY 走一次真实的推文拉取，验证 runner 出口能否被 X 接受。
 *
 * 环境变量：TWEET_KEYS、TWEET_PROXY、PROBE_USER_ID（可选）
 */
import { RettiwtPool, TwitterAPIClient } from '@tweets-viewer/rettiwt-api'

const KEYS = (process.env.TWEET_KEYS || '').split(',').map(key => key.trim()).filter(Boolean)
const PROXY = process.env.TWEET_PROXY?.trim() || undefined
const TARGET = process.env.PROBE_USER_ID || '1353543505432301569'

const client = new TwitterAPIClient(new RettiwtPool(KEYS, { proxy: PROXY }))

const started = Date.now()
try {
  const { tweets } = await client.fetchUserTimelineWithRepliesRaw(TARGET)
  console.log(`  rettiwt: OK tweets=${tweets.length} ${Date.now() - started}ms`)
}
catch (error: any) {
  console.log(`  rettiwt: FAIL ${Date.now() - started}ms status=${error?.status} message=${error?.message}`)
  console.log(`  details=${JSON.stringify(error?.details)}`)
  process.exitCode = 1
}
