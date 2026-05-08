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
        slug: L(normalizeSlug(f.slug)),
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
        slug: L(normalizeSlug(f.slug)),
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
        slug: L(normalizeSlug(f.slug)),
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
        slug: L(normalizeSlug(f.slug)),
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

// ---------- Smart-form helpers ----------

/**
 * Convert any string into a kebab-case slug. Strips diacritics, drops
 * non-alphanumerics, collapses runs of '-'. Used to derive a slug from
 * a course/module/lesson title until the editor types into the slug
 * field directly.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Normalize an editor-provided slug to the canonical form. Same rules
 * as slugify() — kept as a separate export so the call sites read as
 * "I'm cleaning a slug the user typed" instead of "I'm deriving a slug
 * from a title", which is what slugify() reads as.
 *
 * Lowercase enforcement is the contract here: every slug that reaches
 * Contentful via shapeFields() runs through this, so URL paths stay
 * consistent regardless of what an editor typed.
 */
export function normalizeSlug(input: string | undefined | null): string {
  if (!input) return ''
  return slugify(input)
}

/**
 * Identify which video host a lesson's URL points at. Mirrors the
 * host-detection branches in [LessonView.vue](../views/learn/LessonView.vue)
 * that rewrite watch-page URLs to embed form. Exported so the
 * authoring UI ([LessonEdit.vue](../views/admin/content/LessonEdit.vue))
 * can show a live "what we detected" hint without re-implementing the
 * branches and risking drift.
 *
 * Return values:
 *   - 'youtube' / 'vimeo' — known providers, will be auto-converted to
 *     embed URLs at render time
 *   - 'other'   — parses as a URL but isn't one of the recognized hosts;
 *     the lesson player will load it raw and depend on the host's
 *     iframe-embed permissions
 *   - 'invalid' — the input doesn't parse as a URL at all
 *   - null      — empty / whitespace input
 */
export type VideoProvider = 'youtube' | 'vimeo' | 'other' | 'invalid'
export function detectVideoProvider(input: string | undefined | null): VideoProvider | null {
  const raw = (input ?? '').trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') return 'youtube'
    if (u.hostname.includes('vimeo.com')) return 'vimeo'
    return 'other'
  } catch {
    return 'invalid'
  }
}

/** Term names this LMS uses, ordered by month. */
const TERM_BY_MONTH = ['spring', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'fall'] as const

/**
 * Best-guess "current term version" for a fresh course. Maps month
 * ranges Jan-Apr → spring, May-Aug → summer, Sep-Dec → fall. Returns
 * a canonical "{year}-{term}" string ready to drop into the version
 * field.
 */
export function currentTermVersion(date: Date = new Date()): string {
  const year = date.getFullYear()
  const term = TERM_BY_MONTH[date.getMonth()]
  return `${year}-${term}`
}

/**
 * Normalize free-form version input to canonical "{year}-{term}".
 * Accepts "Spring 2026", "spring 2026", "2026 Spring", "2026-Spring",
 * "2026-spring" and similar. If the input doesn't contain both a
 * 4-digit year and a known term word, returns the input lowercased
 * with whitespace trimmed (no surprise rewrites).
 */
export function normalizeVersion(input: string): string {
  const raw = input.trim()
  if (!raw) return raw
  const yearMatch = raw.match(/(\d{4})/)
  const termMatch = raw.toLowerCase().match(/(spring|summer|fall|autumn|winter)/)
  if (!yearMatch || !termMatch) return raw.toLowerCase()
  const term = termMatch[1] === 'autumn' ? 'fall' : termMatch[1]
  return `${yearMatch[1]}-${term}`
}

/** Year-bump a version string for the duplicate flow: "2025-spring"
 * becomes "2026-spring". Falls back to the current term if the input
 * doesn't look like a "{year}-{term}" string. */
function bumpVersion(v: string): string {
  const m = v.match(/^(\d{4})-(.+)$/)
  if (!m) return currentTermVersion()
  const year = parseInt(m[1], 10)
  if (Number.isNaN(year)) return currentTermVersion()
  return `${year + 1}-${m[2]}`
}

export interface ComputedHours {
  minutes: number
  hours: number
  lessonCount: number
  moduleCount: number
}

/**
 * Sum estimatedMinutes across all lessons inside the given modules.
 * Two API calls: modules (to read their lesson references), then
 * lessons. `hours` is rounded to one decimal place — readers shouldn't
 * see "12.3333..." in the UI.
 */
export async function computeCourseEstimatedHours(moduleIds: string[]): Promise<ComputedHours> {
  if (!moduleIds.length) return { minutes: 0, hours: 0, lessonCount: 0, moduleCount: 0 }
  const env = await getEnvironment()
  const modulesResult = await env.getEntries({
    content_type: 'module',
    'sys.id[in]': moduleIds.join(','),
    limit: 100,
  })
  const lessonIds = modulesResult.items.flatMap((m) => {
    const lessonsField = (m.fields as Record<string, unknown>).lessons as Record<string, unknown> | undefined
    const localized = lessonsField?.[LOCALE]
    if (!Array.isArray(localized)) return []
    return localized
      .map((l) => (l as { sys?: { id?: string } })?.sys?.id)
      .filter((v): v is string => !!v)
  })
  if (!lessonIds.length) {
    return { minutes: 0, hours: 0, lessonCount: 0, moduleCount: modulesResult.items.length }
  }
  const lessonsResult = await env.getEntries({
    content_type: 'lesson',
    'sys.id[in]': lessonIds.join(','),
    limit: 200,
  })
  const minutes = lessonsResult.items.reduce((sum, l) => {
    const f = (l.fields as Record<string, unknown>).estimatedMinutes as Record<string, unknown> | undefined
    const m = f?.[LOCALE]
    return sum + (typeof m === 'number' ? m : 0)
  }, 0)
  return {
    minutes,
    hours: Math.round((minutes / 60) * 10) / 10,
    lessonCount: lessonsResult.items.length,
    moduleCount: modulesResult.items.length,
  }
}

/**
 * Distinct, non-empty `track` values across all courses in a program.
 * Used to populate chip-autocomplete suggestions on the course form so
 * editors reuse existing tracks instead of inventing new ones every time.
 */
export async function listTracksForProgram(program: 'stepup_scholars' | 'dynamerge'): Promise<string[]> {
  const env = await getEnvironment()
  const result = await env.getEntries({
    content_type: 'course',
    'fields.program': program,
    limit: 200,
  })
  const set = new Set<string>()
  for (const c of result.items) {
    const trackField = (c.fields as Record<string, unknown>).track as Record<string, unknown> | undefined
    const t = trackField?.[LOCALE]
    if (typeof t === 'string' && t.trim()) set.add(t.trim())
  }
  return Array.from(set).sort()
}

/**
 * Build a draft `CourseFields` object from an existing course, ready
 * to feed into a fresh form. Modules are kept by reference (linked,
 * not deep-copied) so the new term reuses the same curriculum nodes —
 * editors who want to fork modules should duplicate them separately.
 *
 * The returned course is unsaved; the caller decides when to persist.
 * `published` is forced false so duplicates always start as drafts.
 */
export async function buildDuplicateCourseFields(sourceId: string): Promise<CourseFields> {
  const source = await getEntry(sourceId)
  const f = source.fields
  const sourceSlug = typeof f.slug === 'string' ? f.slug : ''
  const sourceVersion = typeof f.version === 'string' ? f.version : ''
  return {
    slug: sourceSlug ? normalizeSlug(`${sourceSlug}-copy`) : '',
    title: typeof f.title === 'string' ? f.title : '',
    program: ((f.program as 'stepup_scholars' | 'dynamerge') ?? 'stepup_scholars'),
    summary: typeof f.summary === 'string' ? f.summary : '',
    modules: extractRefIdsFromField(f.modules),
    estimatedHours: typeof f.estimatedHours === 'number' ? f.estimatedHours : undefined,
    track: typeof f.track === 'string' ? f.track : '',
    published: false,
    version: bumpVersion(sourceVersion),
    coverImage: extractRefIdFromField(f.coverImage),
  }
}

function extractRefIdsFromField(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (v as { sys?: { id?: string } })?.sys?.id)
    .filter((v): v is string => !!v)
}
function extractRefIdFromField(value: unknown): string | undefined {
  return (value as { sys?: { id?: string } })?.sys?.id
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
