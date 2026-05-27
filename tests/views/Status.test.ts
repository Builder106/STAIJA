import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Application } from '../../src/services/types'

vi.mock('../../src/config/firebase.ts', () => ({
  auth: {},
  getDb: vi.fn(async () => ({})),
  getStorageBucket: vi.fn(async () => ({})),
  getPublicStorageBucket: vi.fn(async () => ({})),
  getFns: vi.fn(async () => ({})),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  writeBatch: vi.fn(() => ({ set: vi.fn(), commit: vi.fn() })),
  serverTimestamp: vi.fn(() => new Date()),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@iconify/vue', () => ({
  Icon: { template: '<span />' },
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ params: { id: 'app-abc' } })),
  RouterLink: { template: '<a href="#"><slot /></a>' },
}))

const mockGetApplication = vi.fn()
vi.mock('../../src/services/database', () => ({
  DatabaseService: {
    getApplication: (...args: unknown[]) => mockGetApplication(...args),
  },
}))

vi.mock('../../src/components/ui/Container.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../src/components/ui/Section.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../src/components/ui/Heading.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../src/components/ui/Body.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../src/components/ui/Eyebrow.vue', () => ({ default: { template: '<div><slot /></div>' } }))
vi.mock('../../src/components/ui/UiButton.vue', () => ({
  default: { props: ['to', 'variant'], template: '<a :href="to"><slot /></a>' },
}))
vi.mock('../../src/components/ui/UiCard.vue', () => ({ default: { template: '<div><slot /></div>' } }))

import StatusView from '../../src/views/apply/Status.vue'

function makeApp(overrides: Partial<Application> = {}): Application {
  return {
    id: 'app-abc',
    userId: 'user-1',
    program: 'stepup_scholars',
    status: 'draft',
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      dateOfBirth: '2000-01-01',
      nationality: 'Nigerian',
    },
    academicInfo: {},
    researchInterests: [],
    motivation: '',
    experience: '',
    references: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

async function mountWithApp(overrides: Partial<Application> = {}) {
  mockGetApplication.mockResolvedValue(makeApp(overrides))
  const wrapper = mount(StatusView)
  await flushPromises()
  return wrapper
}

describe('Status.vue — statusInfo computed', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['submitted', 'Under review'],
    ['under_review', 'In active review'],
    ['accepted', 'Accepted'],
    ['rejected', 'Not selected'],
    ['draft', 'Draft'],
  ] as const)('status "%s" renders label "%s"', async (status, expectedLabel) => {
    const wrapper = await mountWithApp({ status })
    expect(wrapper.text()).toContain(expectedLabel)
  })

  it('submitted status shows the 5-business-day description', async () => {
    const wrapper = await mountWithApp({ status: 'submitted' })
    expect(wrapper.text()).toContain('5 business days')
  })

  it('accepted status shows inbox message', async () => {
    const wrapper = await mountWithApp({ status: 'accepted' })
    expect(wrapper.text()).toContain("You're in")
  })

  it('rejected status points applicant to the full note on-page', async () => {
    const wrapper = await mountWithApp({ status: 'rejected' })
    expect(wrapper.text()).toContain('full note from the team is below')
  })

  it('draft status shows resume-application button', async () => {
    const wrapper = await mountWithApp({ status: 'draft' })
    expect(wrapper.text()).toContain('Resume application')
  })

  it('non-draft status does not show resume button', async () => {
    const wrapper = await mountWithApp({ status: 'submitted' })
    expect(wrapper.text()).not.toContain('Resume application')
  })
})

describe('Status.vue — programLabel / programSlug computeds', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stepup_scholars renders "StepUp Scholars"', async () => {
    const wrapper = await mountWithApp({ program: 'stepup_scholars' })
    expect(wrapper.text()).toContain('StepUp Scholars')
  })

  it('dynamerge renders "Dynamerge"', async () => {
    const wrapper = await mountWithApp({ program: 'dynamerge' })
    expect(wrapper.text()).toContain('Dynamerge')
  })

  it('stepup_scholars draft links to /apply/stepup-scholars', async () => {
    const wrapper = await mountWithApp({ program: 'stepup_scholars', status: 'draft' })
    const resumeLink = wrapper.find('a[href="/apply/stepup-scholars"]')
    expect(resumeLink.exists()).toBe(true)
  })

  it('dynamerge draft links to /apply/dynamerge', async () => {
    const wrapper = await mountWithApp({ program: 'dynamerge', status: 'draft' })
    const resumeLink = wrapper.find('a[href="/apply/dynamerge"]')
    expect(resumeLink.exists()).toBe(true)
  })
})

describe('Status.vue — reference status badges', () => {
  beforeEach(() => vi.clearAllMocks())

  it('received reference shows "Letter received"', async () => {
    const wrapper = await mountWithApp({
      references: [{ name: 'Dr. Smith', email: 'smith@uni.edu', institution: 'MIT', relationship: 'Advisor', status: 'received' } as any],
    })
    expect(wrapper.text()).toContain('Letter received')
  })

  it('invited reference shows "Invite sent · awaiting"', async () => {
    const wrapper = await mountWithApp({
      references: [{ name: 'Prof. Lee', email: 'lee@uni.edu', institution: 'Yale', relationship: 'Mentor', status: 'invited' } as any],
    })
    expect(wrapper.text()).toContain('Invite sent · awaiting')
  })

  it('pending reference shows "Not yet invited"', async () => {
    const wrapper = await mountWithApp({
      references: [{ name: 'Ms. Jones', email: 'jones@co.org', institution: '', relationship: 'Manager', status: 'pending' } as any],
    })
    expect(wrapper.text()).toContain('Not yet invited')
  })

  it('reference without explicit status defaults to "Not yet invited"', async () => {
    const wrapper = await mountWithApp({
      references: [{ name: 'A. Person', email: 'a@b.com', institution: '', relationship: '' } as any],
    })
    expect(wrapper.text()).toContain('Not yet invited')
  })
})

describe('Status.vue — loading / error / not-found states', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows not-found message when getApplication returns null', async () => {
    mockGetApplication.mockResolvedValue(null)
    const wrapper = mount(StatusView)
    await flushPromises()
    expect(wrapper.text()).toContain('Application not found')
  })

  it('shows error message when getApplication throws', async () => {
    mockGetApplication.mockRejectedValue(new Error('Network error'))
    const wrapper = mount(StatusView)
    await flushPromises()
    expect(wrapper.text()).toContain('Something went wrong')
  })
})
