import { getDb } from '../config/firebase.ts'
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  query, 
  where, 
  getDocs, 
  orderBy,
  serverTimestamp,
  runTransaction,
  type Timestamp,
  type QueryConstraint
} from 'firebase/firestore'

export interface AppEvent {
  id?: string
  title: string
  description: string
  start: Date | string | Timestamp
  end: Date | string | Timestamp
  timezone: string
  location: {
    type: 'online' | 'physical'
    url?: string
    address?: string
  }
  capacity: number
  registeredCount: number
  waitlistCount: number
  tags: string[]
  published: boolean
  createdBy: string
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface EventRegistration {
  id?: string
  eventId: string
  uid: string
  status: 'registered' | 'waitlisted' | 'cancelled'
  createdAt: Date | Timestamp
  cancelledAt?: Date | Timestamp
}

export class EventService {
  private static async refs() {
    const db = await getDb()
    return {
      db,
      events: collection(db, 'events'),
      registrations: collection(db, 'event_registrations'),
    }
  }

  static async createEvent(eventData: Omit<AppEvent, 'id' | 'createdAt' | 'updatedAt' | 'registeredCount' | 'waitlistCount'>): Promise<string> {
    const { events } = await this.refs()
    const docRef = await addDoc(events, {
      ...eventData,
      registeredCount: 0,
      waitlistCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  }

  static async updateEvent(eventId: string, updates: Partial<AppEvent>): Promise<void> {
    const { events } = await this.refs()
    const docRef = doc(events, eventId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
  }

  static async getEvents(filters: { publishedOnly?: boolean, tags?: string[] } = {}): Promise<AppEvent[]> {
    const { events } = await this.refs()
    const constraints: QueryConstraint[] = [orderBy('start', 'asc')]

    if (filters.publishedOnly) {
      constraints.unshift(where('published', '==', true))
    }

    if (filters.tags && filters.tags.length > 0) {
      constraints.push(where('tags', 'array-contains-any', filters.tags))
    }

    const q = query(events, ...constraints)
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppEvent))
  }

  static async getEvent(eventId: string): Promise<AppEvent | null> {
    const { events } = await this.refs()
    const docRef = doc(events, eventId)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as AppEvent
  }

  static async registerForEvent(eventId: string, uid: string): Promise<string> {
    const { db, events, registrations } = await this.refs()
    return await runTransaction(db, async (transaction) => {
      const eventRef = doc(events, eventId)
      const eventSnap = await transaction.get(eventRef)

      if (!eventSnap.exists()) throw new Error('Event not found')
      const event = eventSnap.data() as AppEvent

      // Check existing registration
      const regQuery = query(
        registrations,
        where('eventId', '==', eventId),
        where('uid', '==', uid),
        where('status', 'in', ['registered', 'waitlisted'])
      )
      const regSnap = await getDocs(regQuery)
      if (!regSnap.empty) throw new Error('Already registered')

      let status: 'registered' | 'waitlisted'
      if (event.registeredCount < event.capacity) {
        status = 'registered'
        transaction.update(eventRef, { registeredCount: event.registeredCount + 1 })
      } else {
        status = 'waitlisted'
        transaction.update(eventRef, { waitlistCount: event.waitlistCount + 1 })
      }

      const newRegRef = doc(registrations)
      transaction.set(newRegRef, {
        eventId,
        uid,
        status,
        createdAt: serverTimestamp()
      })

      return newRegRef.id
    })
  }

  static async cancelRegistration(eventId: string, uid: string): Promise<void> {
    const { db, events, registrations } = await this.refs()
    await runTransaction(db, async (transaction) => {
      const q = query(
        registrations,
        where('eventId', '==', eventId),
        where('uid', '==', uid),
        where('status', 'in', ['registered', 'waitlisted'])
      )
      const snap = await getDocs(q)
      if (snap.empty) throw new Error('Registration not found')

      const regDoc = snap.docs[0]
      const regData = regDoc.data() as EventRegistration

      const eventRef = doc(events, eventId)
      const eventSnap = await transaction.get(eventRef)
      if (!eventSnap.exists()) throw new Error('Event not found')
      const event = eventSnap.data() as AppEvent

      if (regData.status === 'registered') {
        transaction.update(eventRef, { registeredCount: event.registeredCount - 1 })
      } else {
        transaction.update(eventRef, { waitlistCount: event.waitlistCount - 1 })
      }

      transaction.update(regDoc.ref, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      })
    })
  }

  static async getUserRegistration(eventId: string, uid: string): Promise<EventRegistration | null> {
    const { registrations } = await this.refs()
    const q = query(
      registrations,
      where('eventId', '==', eventId),
      where('uid', '==', uid),
      where('status', 'in', ['registered', 'waitlisted'])
    )
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as EventRegistration
  }
}
