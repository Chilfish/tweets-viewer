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
  'watase_yuzuki': 'Watase_Yuzuki',
  'aoki_hina_official': 'aoki__hina',
  'amane_shindo_official': 'amane_bushi',
  '240y_k': '240y_k',
  'kohinata_mika': 'kohinatamika',
  'rin_.t710': 'ttisrn_0710',
  'nakashima_yuki.official': 'Yuki_Nakashim',
  'tanda_hazuki': 'tandahazuki_',
  'yunoch1': 'yuno_yumemita',
  'arale_yumemita': 'arale_yumemita',
  'dr_mikaco': 'mika_d_dr',
  'tandahazuki_': 'tanda_hazuki',
  // Add more mappings here as needed
}

/** Reverse: twitter username → Instagram username */
export const twitterToInsUsername: Record<string, string> = Object.fromEntries(
  Object.entries(INSUsernameToTwitter).map(([ins, twitter]) => [twitter, ins]),
)
