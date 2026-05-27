import { getDb } from '../config/firebase.ts'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  orderBy, 
  limit, 
  serverTimestamp,
  type Timestamp
} from 'firebase/firestore'

export interface AppNotification {
  id?: string
  uid: string
  type: 'connection_request' | 'connection_accepted' | 'event_update' | 'general'
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: Date | Timestamp
}

export class NotificationService {
  private static async notifsRef() {
    const db = await getDb()
    return collection(db, 'notifications')
  }

  static async createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<string> {
    const ref = await this.notifsRef()
    const docRef = await addDoc(ref, {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    })
    return docRef.id
  }

  static async getUnreadNotifications(uid: string): Promise<AppNotification[]> {
    const ref = await this.notifsRef()
    const q = query(
      ref,
      where('uid', '==', uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification))
  }

  static async getAllNotifications(uid: string, limitCount = 20): Promise<AppNotification[]> {
    const ref = await this.notifsRef()
    const q = query(
      ref,
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification))
  }

  static async markAsRead(notificationId: string): Promise<void> {
    const collRef = await this.notifsRef()
    const ref = doc(collRef, notificationId)
    await updateDoc(ref, { read: true })
  }

  static async markAllAsRead(uid: string): Promise<void> {
    const unread = await this.getUnreadNotifications(uid)
    const promises = unread.map(n => n.id ? this.markAsRead(n.id) : Promise.resolve())
    await Promise.all(promises)
  }
}

