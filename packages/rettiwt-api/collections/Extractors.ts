import type { ITweetDetailsResponse } from '../types/raw/tweet/Details'
import type { ITweetDetailsBulkResponse } from '../types/raw/tweet/DetailsBulk'
import type { ITweetRepliesResponse } from '../types/raw/tweet/Replies'
import { Tweet } from '../models/data/Tweet'

/**
 * Collection of data extractors for each resource.
 *
 * @internal
 */
export const Extractors = {
  TWEET_DETAILS: (
    response: ITweetDetailsResponse,
    id: string,
  ): Tweet | undefined => Tweet.single(response, id),
  TWEET_DETAILS_ALT: (
    response: ITweetRepliesResponse,
    id: string,
  ): Tweet | undefined => Tweet.single(response, id),
  TWEET_DETAILS_BULK: (
    response: ITweetDetailsBulkResponse,
    ids: string[],
  ): Tweet[] => Tweet.multiple(response, ids),
}
