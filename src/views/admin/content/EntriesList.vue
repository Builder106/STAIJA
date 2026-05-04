<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../../components/ui/Container.vue'
import Section from '../../../components/ui/Section.vue'
import Heading from '../../../components/ui/Heading.vue'
import Body from '../../../components/ui/Body.vue'
import Eyebrow from '../../../components/ui/Eyebrow.vue'
import UiCard from '../../../components/ui/UiCard.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import {
  listEntries,
  publishEntry,
  unpublishEntry,
  deleteEntry,
  type EntrySummary,
  type LmsContentType,
} from '../../../services/lmsContent'

// Generic listing for any LMS content type. The route's name encodes
// which type to show — keeps four URLs reading the same view file
// without having to duplicate the table.
const route = useRoute()
const TYPE_BY_NAME: Record<string, { type: LmsContentType; title: string; eyebrow: string; editPath: string; description: string }> = {
  'admin-content-courses': {
    type: 'course',
    title: 'Courses',
    eyebrow: 'Course list',
    editPath: '/admin/content/courses',
    description: 'Top-level units. Each cohort pins a course slug + version.',
  },
  'admin-content-modules': {
    type: 'module',
    title: 'Modules',
    eyebrow: 'Module list',
    editPath: '/admin/content/modules',
    description: 'Groups of lessons and assignments inside a course.',
  },
  'admin-content-lessons': {
    type: 'lesson',
    title: 'Lessons',
    eyebrow: 'Lesson list',
    editPath: '/admin/content/lessons',
    description: 'Rich-text bodies, optional videos, attachments.',
  },
  'admin-content-assignments': {
    type: 'assignmentSpec',
    title: 'Assignments',
    eyebrow: 'Assignment list',
    editPath: '/admin/content/assignments',
    description: 'Prompts students submit against.',
  },
}

const meta = computed(() => TYPE_BY_NAME[route.name as string] ?? TYPE_BY_NAME['admin-content-courses'])

const entries = ref<EntrySummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const busy = ref<string | null>(null)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return entries.value
  return entries.value.filter((e) => {
    const title = ((e.fields.title as string) ?? '').toLowerCase()
    const slug = ((e.fields.slug as string) ?? '').toLowerCase()
    return title.includes(term) || slug.includes(term)
  })
})

async function load() {
  loading.value = true
  error.value = null
  try {
    entries.value = await listEntries(meta.value.type)
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Failed to load entries.'
  } finally {
    loading.value = false
  }
}

async function togglePublish(e: EntrySummary) {
  if (busy.value) return
  busy.value = e.id
  try {
    if (e.isPublished) await unpublishEntry(e.id)
    else await publishEntry(e.id)
    await load()
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Action failed.'
  } finally {
    busy.value = null
  }
}

async function remove(e: EntrySummary) {
  const label = (e.fields.title as string) ?? e.id
  if (!confirm(`Delete "${label}"? This can't be undone.`)) return
  busy.value = e.id
  try {
    await deleteEntry(e.id)
    await load()
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Delete failed.'
  } finally {
    busy.value = null
  }
}

function fmtUpdated(e: EntrySummary) {
  const d = new Date(e.updatedAt)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusFor(e: EntrySummary): { label: string; cls: string } {
  if (e.isDraft) return { label: 'Draft', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' }
  if (e.isPublished) return { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
  return { label: 'Changed', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-6 wash-violet-6 border-b hairline-ink">
      <Container>
        <RouterLink
          to="/admin/content"
          class="text-xs text-ink/60 hover:text-ink mb-3 inline-flex items-center gap-1"
        >
          <Icon icon="lucide:arrow-left" width="12" /> Content home
        </RouterLink>
        <Eyebrow class="text-brand-violet mb-3 block">{{ meta.eyebrow }}</Eyebrow>
        <Heading :level="1" class="mb-3">{{ meta.title }}</Heading>
        <Body class="text-ink/70 max-w-2xl">{{ meta.description }}</Body>
      </Container>
    </Section>

    <Section class="!py-8">
      <Container class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-3 justify-between">
          <input
            v-model="search"
            type="text"
            :placeholder="`Search ${meta.title.toLowerCase()}…`"
            class="flex-1 min-w-[220px] max-w-md px-3 py-2 rounded-md border hairline-ink bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-violet"
          />
          <UiButton variant="primary" :to="`${meta.editPath}/new`">
            <Icon icon="lucide:plus" width="14" />
            New {{ meta.type }}
          </UiButton>
        </div>

        <UiCard v-if="loading" class="p-10 bg-white text-center">
          <Icon icon="lucide:loader-2" width="24" class="animate-spin text-brand-violet mx-auto" />
        </UiCard>

        <UiCard v-else-if="error" class="p-6 bg-white">
          <Body class="text-red-700 text-sm">{{ error }}</Body>
        </UiCard>

        <UiCard v-else-if="filtered.length === 0" class="p-10 bg-white text-center">
          <Body class="text-ink/60 text-sm">
            {{ entries.length === 0 ? `No ${meta.title.toLowerCase()} yet.` : 'No matches.' }}
          </Body>
        </UiCard>

        <UiCard v-else class="bg-white p-0 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-ink/[0.03] text-ink/60">
                <tr>
                  <th class="text-left font-semibold px-5 py-3">Title</th>
                  <th class="text-left font-semibold px-5 py-3">Slug</th>
                  <th class="text-left font-semibold px-5 py-3">Status</th>
                  <th class="text-left font-semibold px-5 py-3">Updated</th>
                  <th class="text-right font-semibold px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="e in filtered"
                  :key="e.id"
                  class="border-t hairline-ink hover:bg-ink/[0.015]"
                >
                  <td class="px-5 py-3">
                    <RouterLink
                      :to="`${meta.editPath}/${e.id}`"
                      class="text-ink font-medium hover:text-brand-violet"
                    >
                      {{ (e.fields.title as string) || '(untitled)' }}
                    </RouterLink>
                  </td>
                  <td class="px-5 py-3 text-ink/70 text-xs font-mono">
                    {{ (e.fields.slug as string) || '—' }}
                  </td>
                  <td class="px-5 py-3">
                    <span
                      class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                      :class="statusFor(e).cls"
                    >
                      {{ statusFor(e).label }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-ink/70 text-xs whitespace-nowrap">
                    {{ fmtUpdated(e) }}
                  </td>
                  <td class="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      class="text-xs font-medium text-brand-violet hover:underline disabled:text-ink/30 disabled:no-underline disabled:cursor-not-allowed"
                      :disabled="busy === e.id"
                      @click="togglePublish(e)"
                    >
                      {{ e.isPublished ? 'Unpublish' : 'Publish' }}
                    </button>
                    <span class="text-ink/20 mx-2">·</span>
                    <button
                      type="button"
                      class="text-xs font-medium text-red-700 hover:underline disabled:text-ink/30 disabled:no-underline disabled:cursor-not-allowed"
                      :disabled="busy === e.id"
                      @click="remove(e)"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiCard>
      </Container>
    </Section>
  </div>
</template>
