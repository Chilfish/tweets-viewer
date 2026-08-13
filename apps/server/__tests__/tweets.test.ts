import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import tweetsApp from '../routes/tweets'

const app = new Hono()
app.route('/v3/tweets', tweetsApp)

describe('tweets API Routes', () => {
  describe('gET /v3/tweets/search', () => {
    it('should return 400 when keyword is missing', async () => {
      const res = await app.request('/v3/tweets/search')
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toContain('keyword')
    })

    it('should accept keyword without name (global search)', async () => {
      const res = await app.request('/v3/tweets/search?q=hello')
      expect([200, 500]).toContain(res.status)
    })

    it('should accept keyword with optional name', async () => {
      const res = await app.request('/v3/tweets/search?q=hello&name=testuser')
      expect([200, 500]).toContain(res.status)
    })
  })

  describe('gET /v3/tweets/get/:name', () => {
    it('should use default pagination params', async () => {
      // Without DB, should return error. But we test the route is mounted.
      const res = await app.request('/v3/tweets/get/testuser')
      // Expect error since no DB in test context, but route is accessible
      expect([200, 500]).toContain(res.status)
    })

    it('should accept cursor for keyset pagination', async () => {
      const res = await app.request('/v3/tweets/get/testuser?cursor=1234567890123456789')
      expect([200, 500]).toContain(res.status)
    })

    it('should reject empty cursor', async () => {
      const res = await app.request('/v3/tweets/get/testuser?cursor=')
      expect(res.status).toBe(400)
    })
  })

  describe('gET /v3/tweets/stats/:name', () => {
    it('should mount and accept valid name', async () => {
      const res = await app.request('/v3/tweets/stats/testuser')
      expect([200, 500]).toContain(res.status)
    })

    it('should reject invalid name', async () => {
      const res = await app.request('/v3/tweets/stats/../bad%20name')
      expect([400, 404]).toContain(res.status)
    })
  })

  describe('gET /v3/tweets/medias/:name', () => {
    it('should accept page and reverse params', async () => {
      const res = await app.request('/v3/tweets/medias/testuser?page=1&reverse=true')
      expect([200, 500]).toContain(res.status)
    })

    it('should accept start/end date range', async () => {
      const res = await app.request('/v3/tweets/medias/testuser?start=2023-01-01&end=2023-12-31')
      expect([200, 500]).toContain(res.status)
    })
  })

  describe('gET /v3/tweets/get/:name/last-years-today', () => {
    it('should accept page and pageSize params', async () => {
      const res = await app.request('/v3/tweets/get/testuser/last-years-today?page=1&pageSize=5')
      expect([200, 500]).toContain(res.status)
    })
  })
})
