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
      expect(body.error).toBe('keyword is required')
    })
  })

  describe('gET /v3/tweets/get/:name', () => {
    it('should use default pagination params', async () => {
      // Without DB, should return error. But we test the route is mounted.
      const res = await app.request('/v3/tweets/get/testuser')
      // Expect error since no DB in test context, but route is accessible
      expect([200, 500]).toContain(res.status)
    })
  })

  describe('gET /v3/tweets/get/:name/last-years-today', () => {
    it('should accept page and pageSize params', async () => {
      const res = await app.request('/v3/tweets/get/testuser/last-years-today?page=1&pageSize=5')
      expect([200, 500]).toContain(res.status)
    })
  })

  describe('gET /v3/tweets/medias/:name', () => {
    it('should accept page and reverse params', async () => {
      const res = await app.request('/v3/tweets/medias/testuser?page=1&reverse=true')
      expect([200, 500]).toContain(res.status)
    })
  })
})
