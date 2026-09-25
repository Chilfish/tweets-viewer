import type { Space } from '../../models/data/Space'
import type { RettiwtConfig } from '../../models/RettiwtConfig'
import type { IAudioSpaceByIdResponse } from '../../types/raw/space/AudioSpaceById'
import { Extractors } from '../../collections/Extractors'
import { ResourceType } from '../../enums/Resource'

import { FetcherService } from './FetcherService'

/**
 * Handles interacting with resources related to spaces.
 *
 * @public
 */
export class SpaceService extends FetcherService {
  /**
   * @param config - The config object for configuring the Rettiwt instance.
   *
   * @internal
   */
  public constructor(config: RettiwtConfig) {
    super(config)
  }

  /**
   * Get the details of a space.
   *
   * @param id - The ID of the target space.
   *
   * @returns The details of the space with the given ID.
   *
   * @remarks
   * The request always asks for replays and metatags, so an ended space
   * (`Ended` / `TimedOut`) still returns its metadata.
   *
   * @example
   *
   * ```ts
   * import { Rettiwt } from 'rettiwt-api';
   *
   * const rettiwt = new Rettiwt({ apiKey: API_KEY });
   *
   * rettiwt.space.details('1YqJDNEzvoVKV')
   * .then(res => {
   *  console.log(res);
   * })
   * .catch(err => {
   *  console.log(err);
   * });
   * ```
   */
  public async details(id: string): Promise<Space | undefined> {
    const resource = ResourceType.SPACE_DETAILS

    // Fetching raw space details
    const response = await this.request<IAudioSpaceByIdResponse>(resource, { id })

    // Deserializing response
    const data = Extractors[resource](response)

    return data
  }
}
