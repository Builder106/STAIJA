<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import Container from '../../../components/ui/Container.vue'
import Section from '../../../components/ui/Section.vue'
import Heading from '../../../components/ui/Heading.vue'
import Body from '../../../components/ui/Body.vue'
import Eyebrow from '../../../components/ui/Eyebrow.vue'
import UiButton from '../../../components/ui/UiButton.vue'
import LmsOnboarding from '../../../components/admin/LmsOnboarding.vue'
import {
  listEntries,
  createEntry,
  updateEntry,
  type EntrySummary,
} from '../../../services/lmsContent'

const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)

// Raw entries by id — indexed once on load so child resolution is O(1).
const courses = ref<EntrySummary[]>([])
const modulesById = ref<Map<string, EntrySummary>>(new Map())
const lessonsById = ref<Map<string, EntrySummary>>(new Map())
const assignmentsById = ref<Map<string, EntrySummary>>(new Map())

// IDs that appeared in some parent's reference list. Anything in the
// full list but not referenced is an "orphan" — surfaced separately so
// editors can find content they've created but not yet attached.
const referencedModuleIds = ref<Set<string>>(new Set())
const referencedLessonIds = ref<Set<string>>(new Set())
const referencedAssignmentIds = ref<Set<string>>(new Set())

// Per-id expanded state. Defaults to collapsed; we expand the first
// course automatically after load so the tree isn't empty-looking.
const expanded = ref<Record<string, boolean>>({})

// id currently being added-to (so we can show a spinner on the right
// button). Null when idle.
const pendingParent = ref<string | null>(null)

// ---- Field readers ---------------------------------------------------
//
// EntrySummary.fields holds the locale-stripped raw Contentful values:
// reference arrays look like [{ sys: { id, linkType: 'Entry' } }, ...].
// These helpers pull a clean string[] out.

function extractRefIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const v of value) {
    const id = (v as { sys?: { id?: string } } | null)?.sys?.id
    if (typeof id === 'string' && id.length > 0) out.push(id)
  }
  return out
}

function readField<T = string>(entry: EntrySummary, name: string): T | undefined {
  return (entry.fields as Record<string, unknown>)[name] as T | undefined
}

function entryTitle(entry: EntrySummary): string {
  return readField<string>(entry, 'title') ?? '(untitled)'
}

function entrySlug(entry: EntrySummary): string {
  return readField<string>(entry, 'slug') ?? ''
}

function statusFor(e: EntrySummary): { label: string; cls: string } {
  if (e.isDraft)
    return { label: 'Draft', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' }
  if (e.isPublished)
    return { label: 'Published', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' }
  return { label: 'Changed', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' }
}

// ---- Load ------------------------------------------------------------

async function load() {
  loading.value = true
  error.value = null
  try {
    const [c, m, l, a] = await Promise.all([
      listEntries('course', { limit: 200 }),
      listEntries('module', { limit: 500 }),
      listEntries('lesson', { limit: 1000 }),
      listEntries('assignmentSpec', { limit: 500 }),
    ])

    courses.value = c
    modulesById.value = new Map(m.map((e) => [e.id, e]))
    lessonsById.value = new Map(l.map((e) => [e.id, e]))
    assignmentsById.value = new Map(a.map((e) => [e.id, e]))

    const refMods = new Set<string>()
    const refLessons = new Set<string>()
    const refAssigns = new Set<string>()
    for (const course of c) {
      for (const mid of extractRefIds(readField(course, 'modules'))) refMods.add(mid)
    }
    for (const mod of m) {
      for (const lid of extractRefIds(readField(mod, 'lessons'))) refLessons.add(lid)
      for (const aid of extractRefIds(readField(mod, 'assignments'))) refAssigns.add(aid)
    }
    referencedModuleIds.value = refMods
    referencedLessonIds.value = refLessons
    referencedAssignmentIds.value = refAssigns

    if (c.length > 0) expanded.value[c[0].id] = true
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Failed to load content tree.'
  } finally {
    loading.value = false
  }
}

// ---- Tree resolution -------------------------------------------------

function modulesOf(course: EntrySummary): EntrySummary[] {
  return extractRefIds(readField(course, 'modules'))
    .map((id) => modulesById.value.get(id))
    .filter((m): m is EntrySummary => !!m)
}

function lessonsOf(mod: EntrySummary): EntrySummary[] {
  return extractRefIds(readField(mod, 'lessons'))
    .map((id) => lessonsById.value.get(id))
    .filter((l): l is EntrySummary => !!l)
}

function assignmentsOf(mod: EntrySummary): EntrySummary[] {
  return extractRefIds(readField(mod, 'assignments'))
    .map((id) => assignmentsById.value.get(id))
    .filter((a): a is EntrySummary => !!a)
}

const orphans = computed(() => ({
  modules: [...modulesById.value.values()].filter((e) => !referencedModuleIds.value.has(e.id)),
  lessons: [...lessonsById.value.values()].filter((e) => !referencedLessonIds.value.has(e.id)),
  assignments: [...assignmentsById.value.values()].filter(
    (e) => !referencedAssignmentIds.value.has(e.id),
  ),
}))

const hasAnyOrphans = computed(
  () =>
    orphans.value.modules.length > 0 ||
    orphans.value.lessons.length > 0 ||
    orphans.value.assignments.length > 0,
)

// ---- Add-child flow --------------------------------------------------
//
// Creates a draft entry with auto-generated slug + placeholder title,
// links it onto the parent's reference list, then navigates to the
// editor so the staff member can fill in details. Pre-linking means
// the new entry shows up in the tree the next time the user hits Back.

function toggle(id: string) {
  expanded.value[id] = !expanded.value[id]
}

async function addModule(course: EntrySummary) {
  pendingParent.value = course.id
  try {
    const courseSlug = entrySlug(course) || 'course'
    const existing = extractRefIds(readField(course, 'modules'))
    const n = existing.length + 1
    const slug = `${courseSlug}-mod-${n}`.slice(0, 60)
    const created = await createEntry({
      type: 'module',
      fields: { slug, title: 'New module', unlockRule: 'sequential' },
    })
    await updateEntry(course.id, {
      type: 'course',
      fields: {
        slug: entrySlug(course),
        title: entryTitle(course),
        program: readField<'stepup_scholars' | 'dynamerge'>(course, 'program') ?? 'stepup_scholars',
        version: readField<string>(course, 'version') ?? '',
        modules: [...existing, created.id],
      },
    })
    router.push(`/admin/content/modules/${created.id}`)
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Could not add module.'
  } finally {
    pendingParent.value = null
  }
}

async function addLesson(mod: EntrySummary) {
  pendingParent.value = mod.id + ':l'
  try {
    const modSlug = entrySlug(mod) || 'module'
    const existing = extractRefIds(readField(mod, 'lessons'))
    const n = existing.length + 1
    const slug = `${modSlug}-l-${n}`.slice(0, 64)
    const created = await createEntry({
      type: 'lesson',
      fields: { slug, title: 'New lesson', completionCriteria: 'viewed' },
    })
    await updateEntry(mod.id, {
      type: 'module',
      fields: {
        slug: entrySlug(mod),
        title: entryTitle(mod),
        lessons: [...existing, created.id],
      },
    })
    router.push(`/admin/content/lessons/${created.id}`)
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Could not add lesson.'
  } finally {
    pendingParent.value = null
  }
}

async function addAssignment(mod: EntrySummary) {
  pendingParent.value = mod.id + ':a'
  try {
    const modSlug = entrySlug(mod) || 'module'
    const existing = extractRefIds(readField(mod, 'assignments'))
    const n = existing.length + 1
    const slug = `${modSlug}-a-${n}`.slice(0, 64)
    const created = await createEntry({
      type: 'assignmentSpec',
      fields: { slug, title: 'New assignment', submissionType: 'text', dueOffsetDays: 7 },
    })
    await updateEntry(mod.id, {
      type: 'module',
      fields: {
        slug: entrySlug(mod),
        title: entryTitle(mod),
        assignments: [...existing, created.id],
      },
    })
    router.push(`/admin/content/assignments/${created.id}`)
  } catch (err) {
    error.value = (err as { message?: string }).message ?? 'Could not add assignment.'
  } finally {
    pendingParent.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col bg-paper min-h-screen">
    <Section class="!pt-12 !pb-8 wash-violet-6 border-b hairline-ink">
      <Container>
        <Eyebrow class="text-brand-violet mb-3 block">Admin</Eyebrow>
        <Heading :level="1" class="mb-3">Course content.</Heading>
        <Body class="text-ink/70 max-w-2xl">
          Author and publish course material top-down — start a course, add modules inside it,
          and lessons inside those. All edits save through to Contentful; publishing mirrors them
          into Firestore for the student portal.
        </Body>
      </Container>
    </Section>

    <Section class="!py-10">
      <Container class="flex flex-col gap-8 max-w-4xl">
        <LmsOnboarding />

        <RouterLink
          to="/admin/content/outline"
          class="flex items-start gap-4 p-5 rounded-2xl border hairline-ink hover:border-brand-violet/60 hover:bg-brand-violet/5 transition-colors focus-ring-brand bg-gradient-to-br from-brand-violet/5 to-brand-sky/5"
        >
          <div class="w-10 h-10 rounded-xl bg-brand-violet/15 flex items-center justify-center shrink-0">
            <Icon icon="lucide:wand-2" width="20" class="text-brand-violet" />
          </div>
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <span class="font-semibold text-base text-ink">Outline a course with AI</span>
            <span class="text-sm text-ink/60">
              Sketch a topic; generate a full draft tree of modules, lessons, and assignments.
            </span>
          </div>
          <Icon icon="lucide:arrow-right" width="18" class="text-ink/40 mt-1.5 shrink-0" />
        </RouterLink>

        <!-- Tree -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <h2 class="font-display text-lg font-semibold text-ink m-0">Your courses</h2>
            <div class="flex items-center gap-3">
              <RouterLink
                to="/admin/content/courses"
                class="text-xs text-ink/60 hover:text-brand-violet underline-offset-2 hover:underline"
              >Browse all</RouterLink>
              <UiButton variant="primary" :to="'/admin/content/courses/new'">
                <span class="flex items-center gap-1.5">
                  <Icon icon="lucide:plus" width="14" />
                  New course
                </span>
              </UiButton>
            </div>
          </div>

          <p v-if="error" role="alert" class="text-sm text-red-700 m-0">{{ error }}</p>

          <div
            v-if="loading"
            class="rounded-2xl border hairline-ink bg-white p-10 text-center"
          >
            <Icon icon="lucide:loader-2" width="22" class="animate-spin text-brand-violet mx-auto" />
          </div>

          <div
            v-else-if="courses.length === 0"
            class="rounded-2xl border hairline-ink bg-white p-8 text-center"
          >
            <Body class="text-ink/60 text-sm">
              No courses yet. Start with "New course" above, or generate a full draft with the AI
              outliner.
            </Body>
          </div>

          <ul v-else class="flex flex-col gap-2">
            <li
              v-for="course in courses"
              :key="course.id"
              class="rounded-xl border hairline-ink bg-white overflow-hidden"
            >
              <!-- Course row -->
              <div class="flex items-center gap-2 px-3 py-2.5 hover:bg-ink/[0.015]">
                <button
                  type="button"
                  class="w-6 h-6 rounded-md inline-flex items-center justify-center text-ink/50 hover:bg-ink/5 hover:text-ink shrink-0"
                  :aria-label="expanded[course.id] ? 'Collapse' : 'Expand'"
                  @click="toggle(course.id)"
                >
                  <Icon
                    icon="lucide:chevron-right"
                    width="14"
                    class="transition-transform"
                    :class="expanded[course.id] ? 'rotate-90' : ''"
                  />
                </button>
                <Icon icon="lucide:book-open" width="14" class="text-brand-violet shrink-0" />
                <RouterLink
                  :to="`/admin/content/courses/${course.id}`"
                  class="flex-1 min-w-0 text-sm font-medium text-ink hover:text-brand-violet truncate"
                >
                  {{ entryTitle(course) }}
                </RouterLink>
                <span
                  class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                  :class="statusFor(course).cls"
                >
                  {{ statusFor(course).label }}
                </span>
                <button
                  type="button"
                  class="text-xs font-semibold text-brand-violet hover:underline underline-offset-2 inline-flex items-center gap-1 px-2"
                  :disabled="pendingParent === course.id"
                  @click="addModule(course)"
                >
                  <Icon
                    :icon="pendingParent === course.id ? 'lucide:loader-2' : 'lucide:plus'"
                    width="12"
                    :class="pendingParent === course.id ? 'animate-spin' : ''"
                  />
                  Module
                </button>
              </div>

              <!-- Modules -->
              <ul v-if="expanded[course.id]" class="border-t hairline-ink bg-ink/[0.01]">
                <li
                  v-for="mod in modulesOf(course)"
                  :key="mod.id"
                  class="border-b hairline-ink last:border-b-0"
                >
                  <div class="flex items-center gap-2 pl-8 pr-3 py-2 hover:bg-ink/[0.02]">
                    <button
                      type="button"
                      class="w-6 h-6 rounded-md inline-flex items-center justify-center text-ink/50 hover:bg-ink/5 hover:text-ink shrink-0"
                      :aria-label="expanded[mod.id] ? 'Collapse' : 'Expand'"
                      @click="toggle(mod.id)"
                    >
                      <Icon
                        icon="lucide:chevron-right"
                        width="12"
                        class="transition-transform"
                        :class="expanded[mod.id] ? 'rotate-90' : ''"
                      />
                    </button>
                    <Icon icon="lucide:layers" width="13" class="text-ink/60 shrink-0" />
                    <RouterLink
                      :to="`/admin/content/modules/${mod.id}`"
                      class="flex-1 min-w-0 text-sm text-ink hover:text-brand-violet truncate"
                    >
                      {{ entryTitle(mod) }}
                    </RouterLink>
                    <span
                      class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                      :class="statusFor(mod).cls"
                    >
                      {{ statusFor(mod).label }}
                    </span>
                    <button
                      type="button"
                      class="text-xs font-semibold text-brand-violet hover:underline underline-offset-2 inline-flex items-center gap-1 px-1.5"
                      :disabled="pendingParent === mod.id + ':l'"
                      @click="addLesson(mod)"
                    >
                      <Icon
                        :icon="pendingParent === mod.id + ':l' ? 'lucide:loader-2' : 'lucide:plus'"
                        width="11"
                        :class="pendingParent === mod.id + ':l' ? 'animate-spin' : ''"
                      />
                      Lesson
                    </button>
                    <button
                      type="button"
                      class="text-xs font-semibold text-brand-violet hover:underline underline-offset-2 inline-flex items-center gap-1 px-1.5"
                      :disabled="pendingParent === mod.id + ':a'"
                      @click="addAssignment(mod)"
                    >
                      <Icon
                        :icon="pendingParent === mod.id + ':a' ? 'lucide:loader-2' : 'lucide:plus'"
                        width="11"
                        :class="pendingParent === mod.id + ':a' ? 'animate-spin' : ''"
                      />
                      Assignment
                    </button>
                  </div>

                  <!-- Lessons + assignments under this module -->
                  <ul v-if="expanded[mod.id]" class="border-t hairline-ink bg-ink/[0.02]">
                    <li
                      v-for="lesson in lessonsOf(mod)"
                      :key="lesson.id"
                      class="flex items-center gap-2 pl-14 pr-3 py-1.5 hover:bg-ink/[0.03] border-b hairline-ink last:border-b-0"
                    >
                      <Icon icon="lucide:file-text" width="12" class="text-ink/50 shrink-0" />
                      <RouterLink
                        :to="`/admin/content/lessons/${lesson.id}`"
                        class="flex-1 min-w-0 text-sm text-ink/85 hover:text-brand-violet truncate"
                      >
                        {{ entryTitle(lesson) }}
                      </RouterLink>
                      <span
                        class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                        :class="statusFor(lesson).cls"
                      >
                        {{ statusFor(lesson).label }}
                      </span>
                    </li>
                    <li
                      v-for="assign in assignmentsOf(mod)"
                      :key="assign.id"
                      class="flex items-center gap-2 pl-14 pr-3 py-1.5 hover:bg-ink/[0.03] border-b hairline-ink last:border-b-0"
                    >
                      <Icon icon="lucide:clipboard-edit" width="12" class="text-ink/50 shrink-0" />
                      <RouterLink
                        :to="`/admin/content/assignments/${assign.id}`"
                        class="flex-1 min-w-0 text-sm text-ink/85 hover:text-brand-violet truncate"
                      >
                        {{ entryTitle(assign) }}
                      </RouterLink>
                      <span
                        class="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
                        :class="statusFor(assign).cls"
                      >
                        {{ statusFor(assign).label }}
                      </span>
                    </li>
                    <li
                      v-if="lessonsOf(mod).length === 0 && assignmentsOf(mod).length === 0"
                      class="pl-14 pr-3 py-2 text-xs text-ink/50 italic"
                    >
                      Empty module — use + Lesson or + Assignment above to add.
                    </li>
                  </ul>
                </li>
                <li
                  v-if="modulesOf(course).length === 0"
                  class="pl-8 pr-3 py-3 text-xs text-ink/50 italic"
                >
                  No modules yet — use + Module above to add the first one.
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <!-- Orphans — content that exists but isn't wired up. -->
        <details
          v-if="hasAnyOrphans"
          class="rounded-2xl border hairline-ink bg-white px-5 py-4"
        >
          <summary
            class="cursor-pointer text-sm font-semibold text-ink/70 inline-flex items-center gap-2 select-none"
          >
            <Icon icon="lucide:unlink" width="14" class="text-amber-700" />
            Unlinked entries
            <span class="font-normal text-ink/50">
              ({{ orphans.modules.length + orphans.lessons.length + orphans.assignments.length }}
              not attached to a parent)
            </span>
          </summary>
          <div class="mt-3 flex flex-col gap-3 text-xs">
            <div v-if="orphans.modules.length" class="flex flex-col gap-1">
              <Eyebrow class="text-ink/50 block">Modules</Eyebrow>
              <RouterLink
                v-for="m in orphans.modules"
                :key="m.id"
                :to="`/admin/content/modules/${m.id}`"
                class="text-ink/80 hover:text-brand-violet underline-offset-2 hover:underline"
              >
                {{ entryTitle(m) }}
                <span class="text-ink/40">· {{ entrySlug(m) }}</span>
              </RouterLink>
            </div>
            <div v-if="orphans.lessons.length" class="flex flex-col gap-1">
              <Eyebrow class="text-ink/50 block">Lessons</Eyebrow>
              <RouterLink
                v-for="l in orphans.lessons"
                :key="l.id"
                :to="`/admin/content/lessons/${l.id}`"
                class="text-ink/80 hover:text-brand-violet underline-offset-2 hover:underline"
              >
                {{ entryTitle(l) }}
                <span class="text-ink/40">· {{ entrySlug(l) }}</span>
              </RouterLink>
            </div>
            <div v-if="orphans.assignments.length" class="flex flex-col gap-1">
              <Eyebrow class="text-ink/50 block">Assignments</Eyebrow>
              <RouterLink
                v-for="a in orphans.assignments"
                :key="a.id"
                :to="`/admin/content/assignments/${a.id}`"
                class="text-ink/80 hover:text-brand-violet underline-offset-2 hover:underline"
              >
                {{ entryTitle(a) }}
                <span class="text-ink/40">· {{ entrySlug(a) }}</span>
              </RouterLink>
            </div>
          </div>
        </details>

        <!-- Flat-list fallbacks for bulk search / management. -->
        <div class="flex flex-wrap gap-3 text-xs text-ink/50">
          <span>Browse flat lists:</span>
          <RouterLink to="/admin/content/courses" class="hover:text-brand-violet underline-offset-2 hover:underline">Courses</RouterLink>
          <RouterLink to="/admin/content/modules" class="hover:text-brand-violet underline-offset-2 hover:underline">Modules</RouterLink>
          <RouterLink to="/admin/content/lessons" class="hover:text-brand-violet underline-offset-2 hover:underline">Lessons</RouterLink>
          <RouterLink to="/admin/content/assignments" class="hover:text-brand-violet underline-offset-2 hover:underline">Assignments</RouterLink>
        </div>
      </Container>
    </Section>
  </div>
</template>
