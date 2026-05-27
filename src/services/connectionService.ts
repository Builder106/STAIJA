import { getDb } from '../config/firebase.ts'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  or,
  and,
  type Timestamp
} from 'firebase/firestore'

export interface ConnectionRequest {
  id?: string
  fromUid: string
  toUid: string
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  createdAt: Date | Timestamp
  handledAt?: Date | Timestamp
}

export interface Connection {
  id?: string
  users: string[] // [uid1, uid2] sorted
  createdAt: Date | Timestamp
}

export class ConnectionService {
  private static async refs() {
    const db = await getDb()
    return {
      requests: collection(db, 'connection_requests'),
      connections: collection(db, 'connections'),
    }
  }

  static async sendRequest(fromUid: string, toUid: string): Promise<string> {
    if (fromUid === toUid) throw new Error('Cannot connect with yourself')
    const { requests, connections } = await this.refs()

    // Check for existing connection
    const users = [fromUid, toUid].sort()
    const connQuery = query(connections, where('users', '==', users))
    const connSnap = await getDocs(connQuery)
    if (!connSnap.empty) throw new Error('Connection already exists')

    // Check for existing pending request (either direction)
    const pendingQuery = query(
      requests,
      and(
        where('status', '==', 'pending'),
        or(
          and(where('fromUid', '==', fromUid), where('toUid', '==', toUid)),
          and(where('fromUid', '==', toUid), where('toUid', '==', fromUid))
        )
      )
    )
    const pendingSnap = await getDocs(pendingQuery)
    if (!pendingSnap.empty) throw new Error('Pending request already exists')

    // Create request
    const docRef = await addDoc(requests, {
      fromUid,
      toUid,
      status: 'pending',
      createdAt: serverTimestamp()
    })

    return docRef.id
  }

  static async respondToRequest(requestId: string, status: 'accepted' | 'declined'): Promise<void> {
    const { requests, connections } = await this.refs()
    const reqRef = doc(requests, requestId)
    const reqSnap = await getDoc(reqRef)

    if (!reqSnap.exists()) throw new Error('Request not found')
    const data = reqSnap.data() as ConnectionRequest

    if (data.status !== 'pending') throw new Error('Request is not pending')

    await updateDoc(reqRef, {
      status,
      handledAt: serverTimestamp()
    })

    if (status === 'accepted') {
      const users = [data.fromUid, data.toUid].sort()
      await addDoc(connections, {
        users,
        createdAt: serverTimestamp()
      })
    }
  }

  static async getPendingRequests(uid: string): Promise<ConnectionRequest[]> {
    const { requests } = await this.refs()
    const q = query(
      requests,
      where('toUid', '==', uid),
      where('status', '==', 'pending')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConnectionRequest))
  }

  static async getConnections(uid: string): Promise<Connection[]> {
    const { connections } = await this.refs()
    const q = query(
      connections,
      where('users', 'array-contains', uid)
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Connection))
  }

  static async getConnectionStatus(uid1: string, uid2: string): Promise<'connected' | 'pending_sent' | 'pending_received' | 'none'> {
    const { requests, connections } = await this.refs()
    const users = [uid1, uid2].sort()
    const connQuery = query(connections, where('users', '==', users))
    if (!(await getDocs(connQuery)).empty) return 'connected'

    const sentQuery = query(
      requests,
      where('fromUid', '==', uid1),
      where('toUid', '==', uid2),
      where('status', '==', 'pending')
    )
    if (!(await getDocs(sentQuery)).empty) return 'pending_sent'

    const receivedQuery = query(
      requests,
      where('fromUid', '==', uid2),
      where('toUid', '==', uid1),
      where('status', '==', 'pending')
    )
    if (!(await getDocs(receivedQuery)).empty) return 'pending_received'

    return 'none'
  }
}
