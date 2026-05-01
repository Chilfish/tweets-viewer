import { describe, expect, it } from 'vitest'
import { schema } from '../index'

describe('Database Schema', () => {
  describe('usersTable', () => {
    it('should have expected columns', () => {
      const columns = schema.usersTable
      expect(columns.id).toBeDefined()
      expect(columns.restId).toBeDefined()
      expect(columns.userName).toBeDefined()
      expect(columns.jsonData).toBeDefined()
    })

    it('should have unique constraint on userName', () => {
      const userNameCol = schema.usersTable.userName
      expect(userNameCol.isUnique).toBe(true)
    })

    it('should have primary key on id', () => {
      expect(schema.usersTable.id.primary).toBe(true)
    })
  })

  describe('tweetsTable', () => {
    it('should have expected columns', () => {
      const columns = schema.tweetsTable
      expect(columns.id).toBeDefined()
      expect(columns.tweetId).toBeDefined()
      expect(columns.userId).toBeDefined()
      expect(columns.fullText).toBeDefined()
      expect(columns.createdAt).toBeDefined()
      expect(columns.jsonData).toBeDefined()
    })

    it('should have unique constraint on tweetId', () => {
      expect(schema.tweetsTable.tweetId.isUnique).toBe(true)
    })

    it('should have primary key on id', () => {
      expect(schema.tweetsTable.id.primary).toBe(true)
    })
  })
})
