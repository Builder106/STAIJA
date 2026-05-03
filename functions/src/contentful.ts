/**
 * Contentful → Firestore mirror.
 *
 * Receives publish/unpublish/delete events from Contentful and mirrors
 * blogPost + event entries into Firestore so the public site can read
 * content without a round-trip to Contentful.
 *
 * Secret: CONTENTFUL_WEBHOOK_SECRET (set via firebase functions:secrets:set).
 */

import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'

const CONTENTFUL_WEBHOOK_SECRET = defineSecret('CONTENTFUL_WEBHOOK_SECRET')

type ContentfulTopic =
  | 'ContentManagement.Entry.publish'
  | 'ContentManagement.Entry.unpublish'
  | 'ContentManagement.Entry.delete'
  | 'ContentManagement.Entry.archive'
  | 'ContentManagement.Entry.unarchive'
  | string

interface ContentfulEntryPayload {
  sys: {
    id: string
    type: string
    contentType?: { sys: { id: string } }
    createdAt?: string
    updatedAt?: string
  }
  fields?: Record<string, Record<string, unknown>>
}

const COLLECTION_MAP: Record<string, string> = {
  blogPost: 'cms_blogPosts',
  event: 'cms_events',
  // LMS content types — see /Users/.../misty-nibbling-steele.md plan for
  // shape. Same flatten + soft-delete behavior; no special handling.
  course: 'cms_courses',
  module: 'cms_modules',
  lesson: 'cms_lessons',
  assignmentSpec: 'cms_assignmentSpecs',
}

export const contentfulWebhook = onRequest(
  {
    cors: false,
    secrets: [CONTENTFUL_WEBHOOK_SECRET],
    region: 'us-central1',
    memory: '256MiB',
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed')
      return
    }

    const provided = req.header('x-webhook-secret')
    if (!provided || provided !== CONTENTFUL_WEBHOOK_SECRET.value()) {
      res.status(401).send('Unauthorized')
      return
    }

    const topic = (req.header('x-contentful-topic') || '') as ContentfulTopic
    const payload = req.body as ContentfulEntryPayload

    if (!payload?.sys?.id || !payload.sys.contentType?.sys.id) {
      res.status(400).send('Malformed Contentful payload')
      return
    }

    const contentTypeId = payload.sys.contentType.sys.id
    const collection = COLLECTION_MAP[contentTypeId]
    if (!collection) {
      res.status(200).send(`Ignored content type: ${contentTypeId}`)
      return
    }

    const db = admin.firestore()
    const entryId = payload.sys.id
    const docRef = db.collection(collection).doc(entryId)

    try {
      if (
        topic === 'ContentManagement.Entry.unpublish' ||
        topic === 'ContentManagement.Entry.delete' ||
        topic === 'ContentManagement.Entry.archive'
      ) {
        await docRef.delete()
        res.status(200).send(`Removed ${collection}/${entryId}`)
        return
      }

      if (topic === 'ContentManagement.Entry.publish' || topic === 'ContentManagement.Entry.unarchive') {
        const locale = 'en-US'
        const fields = payload.fields ?? {}
        const flattened: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(fields)) {
          flattened[key] = value?.[locale] ?? null
        }
        await docRef.set(
          {
            ...flattened,
            _sys: {
              id: entryId,
              contentType: contentTypeId,
              createdAt: payload.sys.createdAt ?? null,
              updatedAt: payload.sys.updatedAt ?? null,
              mirroredAt: admin.firestore.FieldValue.serverTimestamp(),
            },
          },
          { merge: true },
        )
        res.status(200).send(`Mirrored ${collection}/${entryId}`)
        return
      }

      res.status(200).send(`Ignored topic: ${topic}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[contentfulWebhook] Failed:', message, { topic, entryId, contentTypeId })
      res.status(500).send(`Mirror failed: ${message}`)
    }
  },
)
