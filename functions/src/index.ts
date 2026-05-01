/**
 * STAIJA Firebase Functions entrypoint.
 *
 * Currently exports:
 *   - contentfulWebhook: receives publish/unpublish/delete events from
 *     Contentful and mirrors blogPost + event entries into Firestore so the
 *     public site can read content from Firestore (cheaper, faster, less
 *     coupled to Contentful availability) once content is populated.
 *
 * Deployment:
 *   1. cd functions && npm install
 *   2. firebase functions:secrets:set CONTENTFUL_WEBHOOK_SECRET
 *   3. firebase deploy --only functions:contentfulWebhook
 *   4. In Contentful: Settings → Webhooks → Add webhook
 *      - URL: the deployed function URL
 *      - Triggers: Entry → publish, unpublish, delete, archive
 *      - Headers: X-Webhook-Secret = (the secret from step 2)
 *      - Filter: sys.contentType.sys.id in [blogPost, event]
 */

import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()

const CONTENTFUL_WEBHOOK_SECRET = defineSecret('CONTENTFUL_WEBHOOK_SECRET')

// Contentful sends X-Contentful-Topic like "ContentManagement.Entry.publish".
// We only care about Entry-level events for blogPost + event types.
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

// Map Contentful content type IDs → Firestore collection names.
const COLLECTION_MAP: Record<string, string> = {
  blogPost: 'cms_blogPosts',
  event: 'cms_events',
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

    // Shared-secret auth. Contentful supports custom headers per webhook;
    // configure X-Webhook-Secret to match the deployed secret value.
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
      // We only mirror blogPost + event. Acknowledge anything else so
      // Contentful doesn't retry.
      res.status(200).send(`Ignored content type: ${contentTypeId}`)
      return
    }

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
        // Flatten Contentful's per-locale fields to a single locale (en-US by
        // default). Localized variants get their own collection later.
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
