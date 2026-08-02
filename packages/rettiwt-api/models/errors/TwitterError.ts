import type { AxiosError } from 'axios'

import type { ITwitterError, ITwitterErrorDetails } from '../../types/errors/TwitterError'
import type { IErrorData as IRawErrorData, IErrorDetails as IRawErrorDetails } from '../../types/raw/base/Error'

/**
 * The error thrown by Twitter API.
 *
 * @public
 */
export class TwitterError extends Error implements ITwitterError {
  public details: ITwitterErrorDetails[]
  public message: string
  public name: string
  public status: number

  /**
   * @param error - The error response received from Twitter.
   */
  public constructor(error: AxiosError<IRawErrorData | IRawErrorDetails>) {
    super(error.message)
    // console.error(error)

    // 网络层错误（如证书验证失败、DNS 解析失败等）：error.response 为 undefined
    if (!error.response) {
      this.details = [new TwitterErrorDetails({
        code: 0,
        message: error.message || 'Unknown network error',
        kind: error.code || 'NETWORK_ERROR',
        name: error.name || 'NetworkError',
      })].map(item => item.toJSON())
      this.message = error.message || 'Network error'
      this.name = 'TWITTER_ERROR'
      this.status = error.status ?? 0
      return
    }

    // Twitter API 返回的错误响应
    const rawData = error.response?.data
    this.details = (
      (rawData as IRawErrorData)?.errors?.length
        ? (rawData as IRawErrorData).errors.map(item => new TwitterErrorDetails(item))
        : [new TwitterErrorDetails(rawData as IRawErrorDetails)]
    ).map(item => item.toJSON())
    this.message = error.message
    this.name = 'TWITTER_ERROR'
    this.status = error.status ?? 500
  }
}

/**
 * The error details.
 *
 * @public
 */
export class TwitterErrorDetails implements ITwitterErrorDetails {
  public code: number
  public message: string
  public name?: string
  public type?: string

  /**
   * @param details - The details of the error.
   */
  public constructor(details: IRawErrorDetails) {
    this.code = details?.code ?? 0
    this.message = details?.message ?? 'Unknown error'
    this.name = details?.name
    this.type = details?.kind
  }

  /**
   * @returns The JSON representation of `this` object.
   */
  public toJSON(): ITwitterErrorDetails {
    return {
      code: this.code ?? 0,
      message: this.message ?? 'Unknown error',
      name: this.name ?? this.message,
      type: this.type,
    }
  }
}
