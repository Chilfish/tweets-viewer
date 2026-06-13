/**
 * Instagram → Twitter username mapping.
 *
 * Used by import / daily-fetch scripts to resolve which `users` row
 * (identified by twitter userName) an IG account belongs to.
 *
 * Key: Instagram username
 * Value: Twitter username (= users.userName)
 */
export const INSUsernameToTwitter: Record<string, string> = {
  'meeeei.gt': 'meeeei_Gt',
  // Add more mappings here as needed
}

/** Reverse: twitter username → Instagram username */
export const twitterToInsUsername: Record<string, string> = Object.fromEntries(
  Object.entries(INSUsernameToTwitter).map(([ins, twitter]) => [twitter, ins]),
)
