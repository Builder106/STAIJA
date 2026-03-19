import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/config/firebase.ts', () => ({
  db: {},
  auth: {},
  storage: {},
}))

const mockAddDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockGetDoc = vi.fn()
const mockUpdateDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  or: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  serverTimestamp: vi.fn(() => new Date()),
}))

import { ConnectionService } from '../../src/services/connectionService'

describe('ConnectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendRequest', () => {
    it('throws when trying to connect with yourself', async () => {
      await expect(
        ConnectionService.sendRequest('uid1', 'uid1')
      ).rejects.toThrow('Cannot connect with yourself')
    })

    it('throws when connection already exists', async () => {
      mockGetDocs.mockResolvedValueOnce({ empty: false })

      await expect(
        ConnectionService.sendRequest('uid1', 'uid2')
      ).rejects.toThrow('Connection already exists')
    })

    it('throws when a pending request already exists', async () => {
      mockGetDocs
        .mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce({ empty: false })

      await expect(
        ConnectionService.sendRequest('uid1', 'uid2')
      ).rejects.toThrow('Pending request already exists')
    })

    it('creates a connection request successfully', async () => {
      mockGetDocs
        .mockResolvedValueOnce({ empty: true })
        .mockResolvedValueOnce({ empty: true })
      mockAddDoc.mockResolvedValueOnce({ id: 'req123' })

      const id = await ConnectionService.sendRequest('uid1', 'uid2')
      expect(id).toBe('req123')
      expect(mockAddDoc).toHaveBeenCalledOnce()
    })
  })

  describe('respondToRequest', () => {
    it('throws when request is not found', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })

      await expect(
        ConnectionService.respondToRequest('reqId', 'accepted')
      ).rejects.toThrow('Request not found')
    })

    it('throws when request is not pending', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ status: 'accepted', fromUid: 'a', toUid: 'b' }),
      })

      await expect(
        ConnectionService.respondToRequest('reqId', 'accepted')
      ).rejects.toThrow('Request is not pending')
    })

    it('accepts a request and creates a connection', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ status: 'pending', fromUid: 'uid1', toUid: 'uid2' }),
      })
      mockUpdateDoc.mockResolvedValueOnce(undefined)
      mockAddDoc.mockResolvedValueOnce({ id: 'conn1' })

      await ConnectionService.respondToRequest('reqId', 'accepted')
      expect(mockUpdateDoc).toHaveBeenCalledOnce()
      expect(mockAddDoc).toHaveBeenCalledOnce()
    })

    it('declines a request without creating a connection', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ status: 'pending', fromUid: 'uid1', toUid: 'uid2' }),
      })
      mockUpdateDoc.mockResolvedValueOnce(undefined)

      await ConnectionService.respondToRequest('reqId', 'declined')
      expect(mockUpdateDoc).toHaveBeenCalledOnce()
      expect(mockAddDoc).not.toHaveBeenCalled()
    })
  })
})
