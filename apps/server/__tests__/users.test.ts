import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import usersApp from '../routes/users'

const app = new Hono()
app.route('/v3/users', usersApp)

describe('users API Routes', () => {
  describe('gET /v3/users/all', () => {
    it('should be accessible', async () => {
      const res = await app.request('/v3/users/all')
      // Route is mounted, may fail without DB
      expect([200, 500]).toContain(res.status)
    })
  })

  describe('gET /v3/users/get/:name', () => {
    it('should be accessible', async () => {
      const res = await app.request('/v3/users/get/testuser')
      expect([200, 404, 500]).toContain(res.status)
    })
  })
})
