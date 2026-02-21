import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'
import { z } from 'zod'

const rootPath = path.dirname(fileURLToPath(import.meta.url))

config({
  path: path.join(rootPath, '.env'),
  quiet: true,
})

/**
 * Server environment schema definition with validation rules
 */
const serverEnvSchema = z.object({
  ENVIRONMENT: z.enum(['development', 'production']).default('development'),
  TWEET_KEYS: z.string().min(1),
  DATABASE_URL: z.url(),
})

/**
 * Validated server environment variables
 */
export const env = (() => {
  const parsed = serverEnvSchema.safeParse(process.env)

  if (parsed.success === false) {
    console.error(
      '❌ Invalid environment variables:',
      z.treeifyError(parsed.error).properties,
    )
    throw new Error('Invalid environment variables')
  }

  const validatedData = parsed.data
  Object.freeze(validatedData) // Ensure immutability
  return validatedData
})()

// Environment convenience exports
export const isDevelopment = env.ENVIRONMENT === 'development'
export const isProduction = env.ENVIRONMENT === 'production'

/**
 * Returns a subset of environment variables that are safe to expose to the client.
 * SECURITY WARNING: Be careful what you expose here - never include API keys,
 * secrets, or sensitive information as these will be visible in the browser.
 */
export function getPublicEnv() {
  return {
    // Add other public variables here that are safe to expose...
  }
}

export type PublicEnv = ReturnType<typeof getPublicEnv>
