import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/config/firebase.ts', () => ({
  auth: {},
  getDb: vi.fn(async () => ({})),
  getStorageBucket: vi.fn(async () => ({})),
  getPublicStorageBucket: vi.fn(async () => ({})),
  getFns: vi.fn(async () => ({})),
}))

const mockAddDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockGetDoc = vi.fn()
const mockUpdateDoc = vi.fn()
const mockRunTransaction = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  doc: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => new Date()),
  runTransaction: (...args: unknown[]) => mockRunTransaction(...args),
}))

import { EventService } from '../../src/services/eventService'

describe('EventService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createEvent', () => {
    it('creates an event and returns its id', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'evt123' })

      const id = await EventService.createEvent({
        title: 'Test Event',
        description: 'A test event description',
        start: new Date('2026-06-01'),
        end: new Date('2026-06-02'),
        timezone: 'UTC',
        location: { type: 'online', url: 'https://meet.example.com' },
        capacity: 100,
        tags: ['test'],
        published: false,
        createdBy: 'admin',
      })

      expect(id).toBe('evt123')
      expect(mockAddDoc).toHaveBeenCalledOnce()
    })
  })

  describe('updateEvent', () => {
    it('updates an event by id', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined)

      await EventService.updateEvent('evt123', { title: 'Updated Title' })
      expect(mockUpdateDoc).toHaveBeenCalledOnce()
    })
  })

  describe('getEvents', () => {
    it('returns a list of events', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'evt1',
            data: () => ({ title: 'Event 1', start: new Date(), end: new Date() }),
          },
          {
            id: 'evt2',
            data: () => ({ title: 'Event 2', start: new Date(), end: new Date() }),
          },
        ],
      })

      const events = await EventService.getEvents()
      expect(events).toHaveLength(2)
      expect(events[0].title).toBe('Event 1')
      expect(events[1].id).toBe('evt2')
    })
  })

  describe('getEvent', () => {
    it('returns null when event not found', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })

      const event = await EventService.getEvent('nonexistent')
      expect(event).toBeNull()
    })

    it('returns the event when found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'evt1',
        data: () => ({ title: 'Found Event' }),
      })

      const event = await EventService.getEvent('evt1')
      expect(event).not.toBeNull()
      expect(event!.title).toBe('Found Event')
    })
  })

  describe('registerForEvent', () => {
    it('calls runTransaction for registration', async () => {
      mockRunTransaction.mockResolvedValueOnce('reg123')

      const regId = await EventService.registerForEvent('evt1', 'uid1')
      expect(regId).toBe('reg123')
      expect(mockRunTransaction).toHaveBeenCalledOnce()
    })
  })
})
