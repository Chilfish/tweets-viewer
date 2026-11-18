import { parseHTML } from 'linkedom'
import { describe, expect, it } from 'vitest'
import { buildXShellHeaders, isUsableXDocument, X_SHELL_URLS } from '../services/public/FetcherService'

/**
 * X's migration to a Rolldown/Vite build ("x-web") removed the `ondemand.s`
 * webpack chunk map from anonymous `/home` responses, which made
 * `x-client-transaction-id` throw `OnDemandFileUrlResolutionError`. The legacy
 * shell is only served to an authenticated session, so the shell request must
 * carry the decoded cookie (see `buildXShellHeaders`). These cases pin the
 * "usable document" rule and the header construction.
 */

function doc(body: string): Document {
  return parseHTML(`<!DOCTYPE html><html><head>${body}</head><body></body></html>`).document as unknown as Document
}

const VERIFICATION_META = '<meta name="twitter-site-verification" content="abc123"/>'

describe('isUsableXDocument', () => {
  it('accepts a legacy shell exposing both the verification key and the ondemand chunk', () => {
    const d = doc(`${VERIFICATION_META}<script>window.__chunks={"5":"ondemand.s"}</script>`)
    expect(isUsableXDocument(d)).toBe(true)
  })

  it('rejects the new x-web shell that dropped the ondemand chunk map', () => {
    const d = doc(`${VERIFICATION_META}<script type="module" src="https://abs.twimg.com/x-web/entry-client-logged-out.js"></script>`)
    expect(isUsableXDocument(d)).toBe(false)
  })

  it('rejects a document without the site verification key', () => {
    const d = doc('<script>window.__chunks={"5":"ondemand.s"}</script>')
    expect(isUsableXDocument(d)).toBe(false)
  })

  it('rejects an empty document', () => {
    expect(isUsableXDocument(doc(''))).toBe(false)
  })

  it('probes /home first and keeps fallbacks', () => {
    expect(X_SHELL_URLS.length).toBeGreaterThan(1)
    expect(X_SHELL_URLS[0]).toBe('https://x.com/home')
  })
})

describe('buildXShellHeaders', () => {
  it('attaches the decoded cookie when an API key is configured', () => {
    const cookie = 'auth_token=abc; ct0=def'
    const apiKey = Buffer.from(cookie).toString('base64')

    expect(buildXShellHeaders({ 'accept': 'text/html' }, apiKey)).toEqual({
      'accept': 'text/html',
      'cookie': cookie,
    })
  })

  it('leaves the headers untouched without an API key', () => {
    expect(buildXShellHeaders({ 'accept': 'text/html' })).toEqual({
      'accept': 'text/html',
    })
  })
})
