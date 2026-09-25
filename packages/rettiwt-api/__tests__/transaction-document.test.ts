import { parseHTML } from 'linkedom'
import { describe, expect, it } from 'vitest'
import { isUsableXDocument, X_LEGACY_HOME_URLS } from '../services/public/FetcherService'

/**
 * X's migration to a Rolldown/Vite build ("x-web") removed the `ondemand.s`
 * webpack chunk map from `/` and `/home`, which made `x-client-transaction-id`
 * throw `OnDemandFileUrlResolutionError`. FetcherService now probes
 * `X_LEGACY_HOME_URLS` for a page that still serves the legacy shell. These
 * cases pin the "usable document" rule: both the site verification meta and the
 * `ondemand.s` chunk reference must be present.
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

  it('keeps a non-empty probe list with /home as the last-resort fallback', () => {
    expect(X_LEGACY_HOME_URLS.length).toBeGreaterThan(1)
    expect(X_LEGACY_HOME_URLS.at(-1)).toBe('https://x.com/home')
  })
})
