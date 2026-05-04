/**
 * Admin-side CRUD wrapper around Contentful Management API for the
 * four LMS content types (course / module / lesson / assignmentSpec).
 *
 * Editors live entirely inside STAIJA — no Contentful tab. This service
 * is the storage layer behind /admin/content/*.
 *
 * Security note: the management token is currently exposed client-side
 * via VITE_CONTENTFUL_MANAGEMENT_TOKEN, matching the pre-existing
 * contentful-management.ts service. Anyone who can read the JS bundle
 * has full Contentful write access. Mitigations:
 *   - Admin pages are gated to staff/admin via route meta.
 *   - The token's Contentful role can be scoped to the current space
 *     only (it's project-bound, not org-bound).
 * Proper fix: move all writes to a Cloud Function with the token in
 * Firebase Secret Manager. Tracked as a follow-up. The same pattern
 * already applies to blog/event editing in this app.
 */

import { createClient, type Environment, type Entry, type Asset } from 'contentful-management'
import { getAppConfig } from '../utils/env'
import type { Document } from '@contentful/rich-text-types'

const LOCALE = 'en-US'

// ---------- Types editors interact with ----------

export type LmsContentType = 'course' | 'module' | 'lesson' | 'assignmentSpec'

export interface CourseFields {
  slug: string
  title: string
  program: 'stepup_scholars' | 'dynamerge'
  summary?: string
  modules?: string[] // Array of module entry IDs
  estimatedHours?: number
  track?: string
  published?: boolean
  version: string
  coverImage?: string // Asset entry ID
}

export interface ModuleFields {
  slug: string
  title: string
  summary?: string
  lessons?: string[]
  assignments?: string[]
  unlockRule?: 'sequential' | 'open'
}

export interface LessonFields {
  slug: string
  title: string
  body?: Document // Contentful RichText document
  videoUrl?: string
  attachments?: string[] // Asset entry IDs
  estimatedMinutes?: number
  completionCriteria?: 'viewed' | 'assignment_submitted' | 'quiz_passed'
}

export interface AssignmentSpecFields {
  slug: string
  title: string
  instructions?: Document
  submissionType: 'text' | 'file' | 'link' | 'text_or_file'
  maxFileSizeMb?: number
  acceptedFileTypes?: string[]
  dueOffsetDays?: number
}

export type LmsFields =
  | { type: 'course'; fields: CourseFields }
  | { type: 'module'; fields: ModuleFields }
  | { type: 'lesson'; fields: LessonFields }
  | { type: 'assignmentSpec'; fields: AssignmentSpecFields }

// Lightweight summary used by list views.
export interface EntrySummary {
  id: string
  contentType: LmsContentType
  fields: Record<string, unknown>
  publishedAt: string | null
  updatedAt: string
  isPublished: boolean
  isDraft: boolean
}

// ---------- Client ----------

let cachedEnvironment: Environment | null = null

async function getEnvironment(): Promise<Environment> {
  if (cachedEnvironment) return cachedEnvironment

  const config = getAppConfig()
  if (!config.contentful) throw new Error('Contentful is not configured.')
  const token = import.meta.env.VITE_CONTENTFUL_MANAGEMENT_TOKEN as string | undefined
  if (!token) {
    throw new Error(
      'VITE_CONTENTFUL_MANAGEMENT_TOKEN is not set. Add it to .env.local to use the content editor.',
    )
  }

  const client = createClient({ accessToken: token })
  const space = await client.getSpace(config.contentful.spaceId)
  const env = await space.getEnvironment(config.contentful.environmentId)
  cachedEnvironment = env
  return env
}

// Wrap a localized field value. Contentful expects every field as
// `{ "en-US": value }` even though the space is single-locale.
function L<T>(value: T | undefined): { [LOCALE]: T } | undefined {
  if (value === undefined || value === null) return undefined
  return { [LOCALE]: value }
}

// Convert references (entry IDs) to Contentful link arrays.
function refsArray(ids: string[] | undefined, linkType: 'Entry' | 'Asset') {
  if (!ids || ids.length === 0) return undefined
  return ids.map((id) => ({ sys: { type: 'Link' as const, linkType, id } }))
}

function singleRef(id: string | undefined, linkType: 'Entry' | 'Asset') {
  if (!id) return undefined
  return { sys: { type: 'Link' as const, linkType, id } }
}

// Strip undefined values so we don't blank out unrelated fields when
// patching an existing entry.
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as Partial<T>
}

// ---------- Field shaping per content type ----------

function shapeFields(payload: LmsFields): Record<string, unknown> {
  switch (payload.type) {
    case 'course': {
      const f = payload.fields
      return clean({
        slug: L(f.slug),
        title: L(f.title),
        program: L(f.program),
        summary: L(f.summary),
        modules: L(refsArray(f.modules, 'Entry')),
        estimatedHours: L(f.estimatedHours),
        track: L(f.track),
        published: L(f.published),
        version: L(f.version),
        coverImage: L(singleRef(f.coverImage, 'Asset')),
      })
    }
    case 'module': {
      const f = payload.fields
      return clean({
        slug: L(f.slug),
        title: L(f.title),
        summary: L(f.summary),
        lessons: L(refsArray(f.lessons, 'Entry')),
        assignments: L(refsArray(f.assignments, 'Entry')),
        unlockRule: L(f.unlockRule),
      })
    }
    case 'lesson': {
      const f = payload.fields
      return clean({
        slug: L(f.slug),
        title: L(f.title),
        body: L(f.body),
        videoUrl: L(f.videoUrl),
        attachments: L(refsArray(f.attachments, 'Asset')),
        estimatedMinutes: L(f.estimatedMinutes),
        completionCriteria: L(f.completionCriteria),
      })
    }
    case 'assignmentSpec': {
      const f = payload.fields
      return clean({
        slug: L(f.slug),
        title: L(f.title),
        instructions: L(f.instructions),
        submissionType: L(f.submissionType),
        maxFileSizeMb: L(f.maxFileSizeMb),
        acceptedFileTypes: L(f.acceptedFileTypes),
        dueOffsetDays: L(f.dueOffsetDays),
      })
    }
  }
}

// ---------- CRUD ----------

function summarize(entry: Entry): EntrySummary {
  const fields: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entry.fields ?? {})) {
    fields[k] = (v as Record<string, unknown>)?.[LOCALE]
  }
  const isPublished = !!entry.sys.publishedVersion && entry.sys.version === (entry.sys.publishedVersion + 1)
  const isDraft = !entry.sys.publishedVersion
  return {
    id: entry.sys.id,
    contentType: entry.sys.contentType.sys.id as LmsContentType,
    fields,
    publishedAt: entry.sys.publishedAt ?? null,
    updatedAt: entry.sys.updatedAt,
    isPublished,
    isDraft,
  }
}

export async function listEntries(
  type: LmsContentType,
  opts?: { limit?: number; skip?: number; query?: string },
): Promise<EntrySummary[]> {
  const env = await getEnvironment()
  const params: Record<string, string | number> = {
    content_type: type,
    limit: opts?.limit ?? 100,
    skip: opts?.skip ?? 0,
    order: '-sys.updatedAt',
  }
  if (opts?.query) params['query'] = opts.query
  const result = await env.getEntries(params)
  return result.items.map(summarize)
}

export async function getEntry(id: string): Promise<EntrySummary> {
  const env = await getEnvironment()
  const entry = await env.getEntry(id)
  return summarize(entry)
}

export async function createEntry(payload: LmsFields): Promise<EntrySummary> {
  const env = await getEnvironment()
  const entry = await env.createEntry(payload.type, { fields: shapeFields(payload) })
  return summarize(entry)
}

// `merge: true` means we only overwrite the fields the caller passed.
// Fields the editor didn't touch keep their previous values.
export async function updateEntry(
  id: string,
  payload: LmsFields,
): Promise<EntrySummary> {
  const env = await getEnvironment()
  const entry = await env.getEntry(id)
  const incoming = shapeFields(payload)
  // Mutate entry.fields in-place because the SDK expects to call
  // entry.update() on the same instance it gave us.
  for (const [k, v] of Object.entries(incoming)) {
    if (v === undefined) continue
    ;(entry.fields as Record<string, unknown>)[k] = v
  }
  const updated = await entry.update()
  return summarize(updated)
}

export async function publishEntry(id: string): Promise<EntrySummary> {
  const env = await getEnvironment()
  const entry = await env.getEntry(id)
  const published = await entry.publish()
  return summarize(published)
}

export async function unpublishEntry(id: string): Promise<EntrySummary> {
  const env = await getEnvironment()
  const entry = await env.getEntry(id)
  const unpublished = await entry.unpublish()
  return summarize(unpublished)
}

export async function deleteEntry(id: string): Promise<void> {
  const env = await getEnvironment()
  const entry = await env.getEntry(id)
  if (entry.sys.publishedVersion) {
    await entry.unpublish()
  }
  // Re-fetch after unpublish — the version changed.
  const fresh = await env.getEntry(id)
  await fresh.delete()
}

// ---------- Asset upload ----------

export interface UploadAssetResult {
  id: string
  url: string
  fileName: string
  contentType: string
}

// Upload a File via Contentful's upload pipeline:
//   1. createAssetWithId() with the file blob inline (in-memory upload)
//   2. processForLocale() — Contentful turns the upload into a CDN URL
//   3. publish() — make it available via Delivery API
export async function uploadAsset(file: File, title?: string): Promise<UploadAssetResult> {
  const env = await getEnvironment()
  const arrayBuffer = await file.arrayBuffer()
  const upload = await env.createUpload({ file: arrayBuffer })

  let asset: Asset = await env.createAsset({
    fields: {
      title: { [LOCALE]: title ?? file.name },
      file: {
        [LOCALE]: {
          contentType: file.type || 'application/octet-stream',
          fileName: file.name,
          uploadFrom: {
            sys: {
              type: 'Link',
              linkType: 'Upload',
              id: upload.sys.id,
            },
          },
        },
      },
    },
  } as Parameters<typeof env.createAsset>[0])

  asset = await asset.processForLocale(LOCALE, { processingCheckWait: 1000 })
  asset = await asset.publish()

  const file_ = (asset.fields.file as Record<string, { url: string; contentType: string; fileName: string }>)[LOCALE]
  const rawUrl = file_.url
  return {
    id: asset.sys.id,
    url: rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl,
    fileName: file_.fileName,
    contentType: file_.contentType,
  }
}
