import type { Tweet } from '../../models/data/Tweet'
import type { RettiwtConfig } from '../../models/RettiwtConfig'
import type { ITweetDetailsResponse } from '../../types/raw/tweet/Details'
import type { ITweetDetailsBulkResponse } from '../../types/raw/tweet/DetailsBulk'
import type { ITweetRepliesResponse } from '../../types/raw/tweet/Replies'
import { Extractors } from '../../collections/Extractors'
import { ResourceType } from '../../enums/Resource'

import { FetcherService } from './FetcherService'

/**
 * Handles interacting with resources related to tweets.
 *
 * @public
 */
export class TweetService extends FetcherService {
  /**
   * @param config - The config object for configuring the Rettiwt instance.
   *
   * @internal
   */
  public constructor(config: RettiwtConfig) {
    super(config)
  }

  /**
   * Get the details of one or more tweets.
   *
   * @param id - The ID/IDs of the target tweet/tweets.
   *
   * @returns
   * The details of the tweet with the given ID.
   *
   * If more than one ID is provided, returns a list.
   *
   * If no tweet/tweets matches the given ID/IDs, returns `undefined`/`[]`.
   *
   * @example
   *
   * #### Fetching the details of a single tweet
   * ```ts
   * import { Rettiwt } from 'rettiwt-api';
   *
   * // Creating a new Rettiwt instance using the given 'API_KEY'
   * const rettiwt = new Rettiwt({ apiKey: API_KEY });
   *
   * // Fetching the details of the tweet with the id '1234567890'
   * rettiwt.tweet.details('1234567890')
   * .then(res => {
   *   console.log(res);  # 'res' is a single tweet
   * })
   * .catch(err => {
   *   console.log(err);
   * });
   * ```
   *
   * @example
   *
   * #### Fetching the details of multiple tweets
   * ```ts
   * import { Rettiwt } from 'rettiwt-api';
   *
   * // Creating a new Rettiwt instance using the given 'API_KEY'
   * const rettiwt = new Rettiwt({ apiKey: API_KEY });
   *
   * // Fetching the details of the tweets with IDs '123', '456', '789'
   * rettiwt.tweet.details(['123', '456', '789'])
   * .then(res => {
   *   console.log(res);  # 'res' is an array of tweets
   * })
   * .catch(err => {
   *   console.log(err);
   * });
   * ```
   */
  public async details<T extends string | string[]>(
    id: T,
  ): Promise<T extends string ? Tweet | undefined : Tweet[]> {
    let resource: ResourceType

    // If user is authenticated and details of single tweet required
    if (this.config.userId !== undefined && typeof id === 'string') {
      resource = ResourceType.TWEET_DETAILS_ALT

      // Fetching raw tweet details
      const response = await this.request<ITweetRepliesResponse>(resource, {
        id,
      })

      // Deserializing response
      const data = Extractors[resource](response, id)

      return data as T extends string ? Tweet | undefined : Tweet[]
    }
    // If user is authenticated and details of multiple tweets required
    else if (this.config.userId !== undefined && Array.isArray(id)) {
      resource = ResourceType.TWEET_DETAILS_BULK

      // Fetching raw tweet details
      const response = await this.request<ITweetDetailsBulkResponse>(resource, {
        ids: id,
      })

      // Deserializing response
      const data = Extractors[resource](response, id)

      return data as T extends string ? Tweet | undefined : Tweet[]
    }
    // If user is not authenticated
    else {
      resource = ResourceType.TWEET_DETAILS

      // Fetching raw tweet details
      const response = await this.request<ITweetDetailsResponse>(resource, {
        id: String(id),
      })

      // Deserializing response
      const data = Extractors[resource](response, String(id))

      return data as T extends string ? Tweet | undefined : Tweet[]
    }
  }
}
