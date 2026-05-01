import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

describe('server API', () => {
  describe('gET /', () => {
    it('should mount correctly', async () => {
      const app = new Hono()
      app.get('/', c => c.json({ status: 'ok' }))
      const res = await app.request('/')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('ok')
    })

    it('should handle 404', async () => {
      const app = new Hono()
      const res = await app.request('/nonexistent')
      expect(res.status).toBe(404)
    })
  })
})
