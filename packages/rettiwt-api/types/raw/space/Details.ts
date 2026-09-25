import type { IRawSpace } from '../base/Space'

/**
 * The raw data received when fetching the details of a given space.
 *
 * @public
 */
export interface ISpaceDetailsResponse extends IRawSpace {}

/**
 * The `data.audioSpace` node shape (canonical definition lives in `./AudioSpaceById`,
 * re-exported here so the Space request/response types are available from one place).
 */
export type { IAudioSpace, IAudioSpaceByIdResponse } from './AudioSpaceById'
