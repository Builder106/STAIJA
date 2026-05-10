// LMS screenshot harness.
//
// Drives the running dev server with Playwright, signs in across four roles
// (anonymous, staff/admin, demo student, demo mentor), seeds a cohort +
// enrollment + a submission + a session so dynamic-id routes have data, then
// captures every LMS screen to tools/screenshot-lms/out/.
//
// Subcommands (run sequentially first time, individually to retry a phase):
//   node tools/screenshot-lms/capture.cjs auth      Sign in / sign up, save storageStates
//   node tools/screenshot-lms/capture.cjs roles     Elevate demo accounts via /admin/users
//   node tools/screenshot-lms/capture.cjs cohort    Create cohort + enroll demo student
//   node tools/screenshot-lms/capture.cjs extras    Demo student submits; demo mentor schedules
//   node tools/screenshot-lms/capture.cjs capture   Walk every route, screenshot
//   node tools/screenshot-lms/capture.cjs all       Run every phase in order
//
// State is persisted in tools/screenshot-lms/.state/manifest.json so phases
// are resumable. Auth states live in tools/screenshot-lms/.auth/. Both
// directories are gitignored — they contain bearer tokens.

const { chromium } = require('playwright')
const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')

// ---------- Config ----------

const BASE_URL = process.env.STAIJA_URL || 'http://localhost:5190'
const VIEWPORT = { width: 1440, height: 900 }
const TOOL_DIR = path.resolve(__dirname)
const AUTH_DIR = path.join(TOOL_DIR, '.auth')
const STATE_DIR = path.join(TOOL_DIR, '.state')
const OUT_DIR = path.join(TOOL_DIR, 'out')
const MANIFEST_PATH = path.join(STATE_DIR, 'manifest.json')

const ACCOUNTS = {
  staff:    { storage: path.join(AUTH_DIR, 'staff.json'),    label: 'staff' },
  applicant:{ storage: path.join(AUTH_DIR, 'applicant.json'),label: 'applicant',
              email: 'staija.demo.applicant@example.com', password: 'StaijaDemo!2026',
              firstName: 'Demo', lastName: 'Applicant' },
  student:  { storage: path.join(AUTH_DIR, 'student.json'),  label: 'student',
              email: 'staija.demo.student@example.com',   password: 'StaijaDemo!2026',
              firstName: 'Demo', lastName: 'Student' },
  mentor:   { storage: path.join(AUTH_DIR, 'mentor.json'),   label: 'mentor',
              email: 'staija.demo.mentor@example.com',    password: 'StaijaDemo!2026',
              firstName: 'Demo', lastName: 'Mentor' },
}

const COHORT_TAG = 'Demo cohort — screenshot harness'
const COURSE_SLUG = 'demo-stepup-research-foundations'
const COURSE_VERSION = '1.0.0'

for (const dir of [AUTH_DIR, STATE_DIR, OUT_DIR]) fs.mkdirSync(dir, { recursive: true })

// ---------- Manifest helpers ----------

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return {}
  try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) } catch { return {} }
}
function saveManifest(m) { fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2)) }
function patchManifest(patch) { const m = loadManifest(); Object.assign(m, patch); saveManifest(m); return m }

// ---------- Logging ----------

const log = (...a) => console.log('•', ...a)
const warn = (...a) => console.warn('⚠', ...a)
const die = (msg) => { console.error('✗', msg); process.exit(1) }

function pause(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl.question(`\n⏸  ${prompt}\nPress ENTER to continue, Ctrl-C to abort. `, () => { rl.close(); resolve() })
  })
}

// ---------- Browser helpers ----------

async function newContext({ storageStateName = null, headless = true } = {}) {
  const browser = await chromium.launch({ headless })
  const opts = { viewport: VIEWPORT, baseURL: BASE_URL }
  if (storageStateName && fs.existsSync(storageStateName)) opts.storageState = storageStateName
  const ctx = await browser.newContext(opts)
  ctx._cleanup = async () => { await ctx.close(); await browser.close() }
  return ctx
}

async function go(page, path, { wait = 3000 } = {}) {
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('load', { timeout: 8_000 }).catch(() => {})
  // Most of these views fetch user profile + role-gated data after mount, so
  // give Vue + Firestore a beat to settle. Tuned by trial.
  await page.waitForTimeout(wait)
}

// Used by routes that paint cards/text far below the fold (StudentDashboard,
// CourseHome, etc.). Ensures the document is at least N px tall and the
// initial render has flushed before screenshotting.
async function waitForStableLayout(page, { minHeight = 600, settle = 800 } = {}) {
  const deadline = Date.now() + 8_000
  let lastHeight = -1
  while (Date.now() < deadline) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight)
    if (h >= minHeight && h === lastHeight) break
    lastHeight = h
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(settle)
}

async function snap(page, slug, { fullPage = true, dir = OUT_DIR, stabilize = true } = {}) {
  const file = path.join(dir, `${slug}.png`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  try {
    if (stabilize) await waitForStableLayout(page)
    await page.screenshot({ path: file, fullPage })
    log(`📸 ${path.relative(TOOL_DIR, file)}`)
    return file
  } catch (err) {
    warn(`screenshot failed for ${slug}: ${err.message}`)
    return null
  }
}

// ---------- Phase: auth ----------

// A complete Firebase storage state (with IndexedDB included) is several KB.
// Anything under this threshold is a broken legacy save (cookies + localStorage
// only, missing the auth user) — overwrite it.
const STATE_MIN_BYTES = 1024

function stateLooksValid(p) {
  try { return fs.statSync(p).size >= STATE_MIN_BYTES } catch { return false }
}

async function authStaff() {
  if (stateLooksValid(ACCOUNTS.staff.storage)) {
    log('staff storageState already exists — skipping. Delete it to re-auth.')
    return
  }
  if (fs.existsSync(ACCOUNTS.staff.storage)) {
    log('staff storageState found but missing IndexedDB — refreshing.')
  }
  const adminEmail = process.env.STAIJA_ADMIN_EMAIL
  const adminPassword = process.env.STAIJA_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    log(`Signing in as admin (${adminEmail}) via email/password — headless.`)
    const ctx = await newContext({ headless: true })
    const page = await ctx.newPage()
    page.on('pageerror', (err) => warn(`page console error: ${err.message}`))
    await go(page, '/login', { wait: 2500 })
    const emailInput = page.locator('input[type="email"], input[autocomplete="email"]').first()
    try {
      await emailInput.waitFor({ state: 'visible', timeout: 15_000 })
    } catch (err) {
      const dbgPath = path.join(STATE_DIR, 'login-debug.png')
      await page.screenshot({ path: dbgPath, fullPage: true }).catch(() => {})
      const html = await page.content().catch(() => '')
      fs.writeFileSync(path.join(STATE_DIR, 'login-debug.html'), html)
      await ctx._cleanup()
      throw new Error(
        `email input not found on /login after 15s. Saved a debug screenshot to ${dbgPath} and HTML to .state/login-debug.html — check what's actually rendering. (Original: ${err.message})`,
      )
    }
    await emailInput.fill(adminEmail)
    await page.locator('input[type="password"]').first().fill(adminPassword)
    await page.click('form button[type="submit"]')
    // Wait for redirect off /login.
    const start = Date.now()
    while (Date.now() - start < 30_000 && /\/login/.test(page.url())) {
      await page.waitForTimeout(750)
    }
    if (/\/login/.test(page.url())) {
      const errMsg = await page.locator('[role="alert"]').first().textContent().catch(() => '')
      await ctx._cleanup()
      throw new Error(`admin email/password sign-in failed. error: ${errMsg || 'unknown'}`)
    }
    await page.waitForTimeout(1500)
    await ctx.storageState({ path: ACCOUNTS.staff.storage, indexedDB: true })
    log(`Saved admin storage to ${path.relative(TOOL_DIR, ACCOUNTS.staff.storage)}`)
    await ctx._cleanup()
    return
  }
  log('Launching headed browser for staff/admin sign-in (no STAIJA_ADMIN_EMAIL/PASSWORD env vars set).')
  console.log('\n  In the window that opens, sign in. Use the ADMIN account if you have one —')
  console.log('  otherwise the harness will fail when trying to assign student/mentor roles.')
  console.log('  Once you land on /admin (or any signed-in page), come back here.')
  const browser = await chromium.launch({ headless: false })
  const ctx = await browser.newContext({ viewport: VIEWPORT, baseURL: BASE_URL })
  const page = await ctx.newPage()
  await page.goto('/login')
  // Wait until we're not on /login or /signup any more.
  const start = Date.now()
  while (Date.now() - start < 10 * 60_000) {
    await page.waitForTimeout(1000)
    const url = page.url()
    if (!/\/(login|signup|auth\/email-link)/.test(url)) break
  }
  await page.waitForTimeout(1500)
  await ctx.storageState({ path: ACCOUNTS.staff.storage, indexedDB: true })
  log(`Saved staff storage to ${path.relative(TOOL_DIR, ACCOUNTS.staff.storage)}`)
  await ctx.close(); await browser.close()
}

async function signUpAccount(key) {
  const acc = ACCOUNTS[key]
  if (stateLooksValid(acc.storage)) { log(`${acc.label} storageState already exists — skipping signup`); return }
  if (fs.existsSync(acc.storage)) log(`${acc.label} storageState missing IndexedDB — refreshing.`)
  log(`Signing up ${acc.label}: ${acc.email}`)
  const ctx = await newContext({ headless: true })
  const page = await ctx.newPage()
  // Try sign-in first; if account exists from a prior run we can reuse it.
  await go(page, '/login')
  await page.fill('input[type="email"]', acc.email)
  await page.fill('input[type="password"]', acc.password)
  await page.click('button[type="submit"]:has-text("Sign in"), form button:has-text("Sign in")')
  // Wait for either redirect or error.
  await page.waitForTimeout(3000)
  if (!/\/login/.test(page.url())) {
    log(`  ${acc.label} already had an account; reused sign-in.`)
    await ctx.storageState({ path: acc.storage, indexedDB: true })
    await ctx._cleanup()
    return
  }
  // No existing account — sign up.
  await go(page, '/signup')
  await page.fill('input[autocomplete="given-name"]', acc.firstName)
  await page.fill('input[autocomplete="family-name"]', acc.lastName)
  await page.fill('input[type="email"]', acc.email)
  await page.fill('input[type="password"]', acc.password)
  await page.click('form button[type="submit"]')
  // Allow sign-up + redirect to applicant dashboard.
  await page.waitForTimeout(5000)
  if (/\/signup/.test(page.url())) {
    const err = await page.locator('[role="alert"]').first().textContent().catch(() => '')
    throw new Error(`signup for ${acc.label} stuck on /signup. error: ${err}`)
  }
  log(`  signed up ${acc.label}.`)
  await ctx.storageState({ path: acc.storage, indexedDB: true })
  await ctx._cleanup()
}

async function captureUidFromState(stateFile) {
  // Firebase v9 web SDK persists the signed-in user in IndexedDB
  // (firebaseLocalStorageDb / firebaseLocalStorage object store).
  // Playwright's storageState preserves IDB, so we can just open it.
  const ctx = await newContext({ storageStateName: stateFile, headless: true })
  const page = await ctx.newPage()
  await go(page, '/account/settings', { wait: 2500 })
  const uid = await page.evaluate(async () => {
    const tryIdb = () => new Promise((resolve) => {
      const req = indexedDB.open('firebaseLocalStorageDb')
      req.onsuccess = () => {
        try {
          const db = req.result
          if (!db.objectStoreNames.contains('firebaseLocalStorage')) return resolve(null)
          const tx = db.transaction(['firebaseLocalStorage'], 'readonly')
          const all = tx.objectStore('firebaseLocalStorage').getAll()
          all.onsuccess = () => {
            for (const entry of all.result || []) {
              const k = entry.fbase_key || entry.key
              if (k && k.startsWith('firebase:authUser:')) {
                const v = entry.value || entry
                if (v && v.uid) return resolve(v.uid)
              }
            }
            resolve(null)
          }
          all.onerror = () => resolve(null)
        } catch { resolve(null) }
      }
      req.onerror = () => resolve(null)
    })
    // Try IDB first; fall back to localStorage in case the SDK switched.
    const fromIdb = await tryIdb()
    if (fromIdb) return fromIdb
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('firebase:authUser:')) {
        try { return JSON.parse(localStorage.getItem(k)).uid } catch {}
      }
    }
    return null
  })
  await ctx._cleanup()
  return uid
}

async function phaseAuth() {
  await authStaff()
  for (const key of ['applicant', 'student', 'mentor']) await signUpAccount(key)
  // Persist UIDs.
  const uids = {}
  for (const key of ['staff', 'applicant', 'student', 'mentor']) {
    if (!fs.existsSync(ACCOUNTS[key].storage)) continue
    const uid = await captureUidFromState(ACCOUNTS[key].storage)
    if (uid) { uids[key] = uid; log(`${key} uid = ${uid}`) }
    else warn(`could not extract uid for ${key}`)
  }
  patchManifest({ uids })
}

// ---------- Phase: roles (elevate via /admin/users) ----------

async function readUserRole(staffPage, email) {
  // Returns the lowercased role badge text from /admin/users for this email,
  // or null if the row isn't visible.
  await go(staffPage, '/admin/users', { wait: 6_000 })
  await staffPage.locator('input[placeholder*="Search"]').first().fill(email)
  await staffPage.waitForTimeout(1200)
  const row = staffPage.locator(`table tbody tr:has-text("${email}")`).first()
  if (!(await row.count())) return null
  // Role is in a span badge inside the row. Pull the row text and find the
  // role token — the text of the role span is one of the known role names.
  const txt = (await row.textContent())?.toLowerCase() ?? ''
  for (const r of ['admin','staff','alumni','applicant','student','mentor']) {
    if (txt.includes(` ${r} `) || txt.includes(`${r} active`) || txt.includes(`${r}\nactive`)) return r
  }
  return null
}

async function assignRoleViaModal(staffPage, email, targetRole) {
  // Caller must already be on /admin/users with the row in view.
  await staffPage.locator('input[placeholder*="Search"]').first().fill(email)
  await staffPage.waitForTimeout(1200)
  const row = staffPage.locator(`table tbody tr:has-text("${email}")`).first()
  if (!(await row.count())) throw new Error(`no row for ${email} in /admin/users`)
  await row.locator('button:has-text("Change role")').click()
  // Modal is teleported to body. Scope all subsequent locators inside it.
  const modal = staffPage.locator('div.fixed.inset-0:has(h3:has-text("Change user role"))').first()
  await modal.waitFor({ state: 'visible', timeout: 10_000 })
  // Wait for assignableRoles to populate (userProfile loads async).
  const radio = modal.locator(`input[type="radio"][value="${targetRole}"]`)
  await radio.waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {})
  if (!(await radio.count())) {
    throw new Error(`role "${targetRole}" not in modal radios — caller is not admin/can't assign this role.`)
  }
  await radio.click()
  await modal.locator('textarea').fill(`Screenshot harness — promote ${email} to ${targetRole}`)
  const confirm = modal.locator('button').last()
  await confirm.waitFor({ state: 'visible' })
  // Wait until the button is enabled (newRole + reason both set).
  for (let i = 0; i < 20; i++) {
    if (!(await confirm.isDisabled())) break
    await staffPage.waitForTimeout(250)
  }
  await confirm.click()
  // Wait for the modal to close (success) or for an error toast.
  await staffPage.waitForTimeout(3500)
}

async function ensureUserRoleViaAdminUsers(staffPage, email, targetRole) {
  let currentRole = await readUserRole(staffPage, email)
  if (currentRole === targetRole) { log(`  ${email} already ${targetRole}; skipping.`); return }
  // Direct transition map. Anything not directly allowed needs an intermediate
  // hop; for our demo accounts, applicant → mentor goes via alumni.
  const direct = { applicant: ['student', 'alumni'], student: ['alumni', 'applicant'], alumni: ['applicant', 'student', 'mentor'], mentor: ['staff', 'alumni'], staff: ['admin', 'applicant', 'mentor'], admin: ['staff', 'applicant', 'alumni', 'mentor'] }
  const path = []
  if ((direct[currentRole] || []).includes(targetRole)) path.push(targetRole)
  else if ((direct[currentRole] || []).includes('alumni') && (direct.alumni || []).includes(targetRole)) path.push('alumni', targetRole)
  else throw new Error(`no transition path from ${currentRole} to ${targetRole}`)
  for (const step of path) {
    log(`  ${email}: ${currentRole} → ${step}`)
    await assignRoleViaModal(staffPage, email, step)
    const after = await readUserRole(staffPage, email)
    if (after !== step) throw new Error(`role assign failed: ${email} expected ${step} but is ${after}`)
    currentRole = after
  }
}

async function phaseRoles() {
  if (!fs.existsSync(ACCOUNTS.staff.storage)) die('No staff storageState. Run `auth` first.')
  const ctx = await newContext({ storageStateName: ACCOUNTS.staff.storage, headless: true })
  const page = await ctx.newPage()
  // Sanity-check that staff is actually admin (else /admin/users won't have student in the radios).
  await go(page, '/admin/users')
  if (!/\/admin\/users/.test(page.url())) {
    await ctx._cleanup()
    die('Staff account cannot reach /admin/users. Make sure your Firestore user doc has role:"admin" (temporarily) and retry.')
  }
  try {
    await ensureUserRoleViaAdminUsers(page, ACCOUNTS.student.email, 'student')
    await ensureUserRoleViaAdminUsers(page, ACCOUNTS.mentor.email, 'mentor')
    patchManifest({ rolesAssigned: true })
  } finally {
    await ctx._cleanup()
  }
}

// ---------- Phase: cohort + enrollment ----------

async function phaseCohort() {
  if (!fs.existsSync(ACCOUNTS.staff.storage)) die('No staff storageState. Run `auth` first.')
  const m = loadManifest()
  const mentorUid = m.uids?.mentor
  if (!mentorUid) die('mentor UID missing from manifest. Re-run `auth`.')

  const ctx = await newContext({ storageStateName: ACCOUNTS.staff.storage, headless: true })
  const page = await ctx.newPage()

  // 1. Check for existing harness cohort by display name. Cohorts load async,
  // so wait for either the table or the empty-state card before deduping.
  await go(page, '/admin/cohorts', { wait: 1000 })
  await page.waitForFunction(
    () => !!document.querySelector('table tbody tr') || !!document.querySelector('div:has(p)') && /No cohorts yet/.test(document.body.innerText),
    { timeout: 15_000 },
  ).catch(() => {})
  await page.waitForTimeout(1500)
  const existingRow = page.locator(`table tbody tr:has-text("${COHORT_TAG}")`).first()
  if (await existingRow.count()) {
    log('  cohort already exists.')
  } else {
    log('  creating cohort.')
    await page.click('button:has-text("New cohort")')
    // Wait for form heading to confirm form opened.
    await page.locator('h2:has-text("New cohort")').waitFor({ state: 'visible', timeout: 8_000 })
    // Selectors keyed off the placeholders in src/views/admin/Cohorts.vue.
    await page.locator('input[placeholder="e.g. stepup-foundations"]').fill(COURSE_SLUG)
    await page.locator('input[placeholder="e.g. 2026-spring"]').fill(COURSE_VERSION)
    await page.locator('input[placeholder="e.g. Spring 2026"]').fill(COHORT_TAG)
    const today = new Date(); const later = new Date(); later.setDate(today.getDate() + 60)
    const dates = page.locator('input[type="date"]')
    await dates.nth(0).fill(today.toISOString().slice(0, 10))
    await dates.nth(1).fill(later.toISOString().slice(0, 10))
    await page.locator('textarea[placeholder*="abc123"]').fill(mentorUid)
    // Status select is the one whose options include "Active".
    await page.locator('select:has(option[value="active"])').selectOption('active')
    await page.click('button:has-text("Create cohort")')
    // Wait for the form to disappear (success) or an error message.
    await page.waitForTimeout(3500)
    if (await page.locator('h2:has-text("New cohort")').count()) {
      const errMsg = await page.locator('p.text-red-700').first().textContent().catch(() => '')
      throw new Error(`cohort creation failed. error on page: ${errMsg || '(none)'}`)
    }
  }

  // 2. Enroll. Wait for both dropdowns to populate before touching them.
  await go(page, '/admin/enroll', { wait: 4000 })
  // Wait until the candidate dropdown has more than the placeholder option.
  await page.waitForFunction(
    () => document.querySelectorAll('select')[1]?.options?.length > 1,
    { timeout: 15_000 },
  ).catch(() => {})
  const cohortSel = page.locator('select').nth(0)
  const studentSel = page.locator('select').nth(1)
  const cohortOptions = await cohortSel.locator('option').allTextContents()
  const cohortIdx = cohortOptions.findIndex((t) => t.includes(COHORT_TAG))
  if (cohortIdx <= 0) throw new Error(`could not find cohort option matching "${COHORT_TAG}". got: ${JSON.stringify(cohortOptions)}`)
  await cohortSel.selectOption({ index: cohortIdx })
  await page.waitForTimeout(800)
  const studentOptions = await studentSel.locator('option').allTextContents()
  const studentIdx = studentOptions.findIndex((t) => /Demo Student\b/i.test(t))
  if (studentIdx <= 0) throw new Error(`could not find Demo Student option in candidates. got: ${JSON.stringify(studentOptions)}`)
  await studentSel.selectOption({ index: studentIdx })
  // Mentor select shows up only after a cohort is selected (v-if).
  const mentorSel = page.locator('select').nth(2)
  if (await mentorSel.count()) {
    const mentorOpts = await mentorSel.locator('option').allTextContents()
    const idx = mentorOpts.findIndex((t) => t.includes(mentorUid))
    if (idx > 0) await mentorSel.selectOption({ index: idx })
  }
  const enrollBtn = page.locator('button:has-text("Enroll")').last()
  // Wait until the button is enabled (canSubmit becomes true).
  for (let i = 0; i < 20; i++) {
    if (!(await enrollBtn.isDisabled())) break
    await page.waitForTimeout(250)
  }
  await enrollBtn.click()
  await page.waitForTimeout(4000)
  const success = await page.locator('p.text-emerald-700').first().textContent().catch(() => '')
  const err = await page.locator('p.text-red-700').first().textContent().catch(() => '')
  if (err) log(`  enroll error: ${err}`)
  if (success) log(`  ${success.trim()}`)
  patchManifest({ enrolled: true })

  await ctx._cleanup()
}

// ---------- Phase: extras (submission, session) ----------

async function phaseExtras() {
  // Student submits an assignment. Navigating directly by known seed slug
  // is more reliable than hunting through module pages.
  {
    const ctx = await newContext({ storageStateName: ACCOUNTS.student.storage, headless: true })
    const page = await ctx.newPage()
    await go(page, '/learn/assignment/demo-stepup-a-paper-summary', { wait: 3500 })
    log(`  submission url: ${page.url()}`)
    const ta = page.locator('textarea[placeholder*="Type your response"]').first()
    if (await ta.count()) {
      await ta.fill('Demo submission — generated by screenshot harness on ' + new Date().toISOString())
      const submitBtn = page.locator('button:has-text("Submit assignment")').first()
      for (let i = 0; i < 20; i++) {
        if (!(await submitBtn.isDisabled().catch(() => true))) break
        await page.waitForTimeout(250)
      }
      await submitBtn.click().catch((err) => warn(`submit click: ${err.message}`))
      // On success the route changes to /learn/submissions/<id>.
      await page.waitForURL(/\/learn\/submissions\//, { timeout: 10_000 }).catch(() => {})
      const m = page.url().match(/\/learn\/submissions\/([^/?#]+)/)
      if (m) {
        log(`  submission id = ${m[1]}`)
        patchManifest({ submissionId: m[1] })
      } else {
        warn(`submission did not redirect; final url = ${page.url()}`)
      }
    } else {
      warn('no Type-your-response textarea on assignment page')
    }
    await ctx._cleanup()
  }

  // Mentor schedules a session for the demo cohort.
  {
    const ctx = await newContext({ storageStateName: ACCOUNTS.mentor.storage, headless: true })
    const page = await ctx.newPage()
    // The post-schedule redirect to /learn/sessions/:id is gated behind
    // 'participate_in_programs', which mentors don't have — so the router
    // bounces them to /mentor. Grab the sessionId off the callable's
    // response instead.
    let capturedSessionId = null
    page.on('response', async (r) => {
      if (capturedSessionId) return
      if (!/scheduleSession/.test(r.url())) return
      try { const j = await r.json(); capturedSessionId = j?.result?.sessionId ?? null } catch {}
    })
    await go(page, '/learn/mentor/schedule', { wait: 4000 })
    const cohortSel = page.locator('select').first()
    const opts = await cohortSel.locator('option').allTextContents()
    const idx = opts.findIndex((t) => t.includes(COHORT_TAG))
    if (idx <= 0) throw new Error(`mentor's cohort dropdown lacks the demo cohort. options: ${JSON.stringify(opts)}`)
    await cohortSel.selectOption({ index: idx })
    await page.locator('input[placeholder*="Week 3 lab walkthrough"]').fill('Demo session — screenshot harness')
    const dts = page.locator('input[type="datetime-local"]')
    const start = new Date(Date.now() + 24 * 3600_000)
    const end = new Date(start.getTime() + 60 * 60_000)
    const fmt = (d) => d.toISOString().slice(0, 16)
    await dts.nth(0).fill(fmt(start))
    await dts.nth(1).fill(fmt(end))
    await page.locator('input[type="url"]').fill('https://zoom.us/j/000000')
    const submit = page.locator('button:has-text("Schedule session")')
    for (let i = 0; i < 20; i++) {
      if (!(await submit.isDisabled().catch(() => true))) break
      await page.waitForTimeout(250)
    }
    await submit.click()
    // Wait for either the redirect to land or the response listener to fire.
    for (let i = 0; i < 40; i++) {
      if (capturedSessionId) break
      await page.waitForTimeout(250)
    }
    if (capturedSessionId) {
      log(`  session id = ${capturedSessionId}`)
      patchManifest({ sessionId: capturedSessionId })
    } else {
      const errMsg = await page.locator('p.text-red-700').first().textContent().catch(() => '')
      warn(`scheduleSession callable response missing; final url = ${page.url()}, error = ${errMsg}`)
    }
    await ctx._cleanup()
  }
  patchManifest({ extrasDone: true })
}

// ---------- Phase: capture ----------

const PUBLIC_ROUTES = [
  ['/', 'public/00-home'],
  ['/about', 'public/about'],
  ['/press', 'public/press'],
  ['/blog', 'public/blog'],
  ['/contact', 'public/contact'],
  ['/donate', 'public/donate'],
  ['/events', 'public/events'],
  ['/get-involved', 'public/get-involved'],
  ['/programs/stepup-scholars', 'public/programs-stepup'],
  ['/programs/dynamerge', 'public/programs-dynamerge'],
  ['/login', 'public/login'],
  ['/signup', 'public/signup'],
  ['/this-route-does-not-exist-anywhere', 'public/404'],
]

const STAFF_ROUTES = [
  ['/admin', 'admin/00-home'],
  ['/admin/applications', 'admin/applications'],
  ['/admin/programs', 'admin/programs'],
  ['/admin/cohorts', 'admin/cohorts'],
  ['/admin/enroll', 'admin/enroll'],
  ['/admin/users', 'admin/users'],
  ['/admin/avatar-preview', 'admin/avatar-preview'],
  ['/admin/content', 'admin/content/00-home'],
  ['/admin/content/outline', 'admin/content/outline'],
  ['/admin/content/courses', 'admin/content/courses-list'],
  ['/admin/content/modules', 'admin/content/modules-list'],
  ['/admin/content/lessons', 'admin/content/lessons-list'],
  ['/admin/content/assignments', 'admin/content/assignments-list'],
  ['/account/settings', 'admin/account-settings'],
]

const STUDENT_ROUTES = [
  ['/student', 'student/dashboard'],
  ['/student/program', 'student/program'],
  ['/student/assignments', 'student/assignments'],
  ['/student/mentor', 'student/mentor-support'],
  ['/student/progress', 'student/progress'],
  ['/learn', 'learn/00-course-home'],
  ['/learn/sessions', 'learn/sessions-list'],
  ['/account/settings', 'student/account-settings'],
]

const MENTOR_ROUTES = [
  ['/mentor', 'mentor/dashboard'],
  ['/learn/mentor/schedule', 'mentor/schedule-session'],
  ['/account/settings', 'mentor/account-settings'],
]

async function captureRouteList(ctx, routes) {
  const page = await ctx.newPage()
  for (const [route, slug] of routes) {
    try {
      await go(page, route)
      await snap(page, slug)
    } catch (err) {
      warn(`${route}: ${err.message}`)
    }
  }
  await page.close()
}

async function capturePublicAndAuth() {
  const ctx = await newContext({ headless: true })
  await captureRouteList(ctx, PUBLIC_ROUTES)
  await ctx._cleanup()
}

async function captureStaff() {
  if (!fs.existsSync(ACCOUNTS.staff.storage)) { warn('skip staff: no storage'); return }
  const ctx = await newContext({ storageStateName: ACCOUNTS.staff.storage, headless: true })
  await captureRouteList(ctx, STAFF_ROUTES)

  // Capture content edit screens — pick the first row from each list and follow.
  const page = await ctx.newPage()
  const types = [
    ['courses', 'courseId'],
    ['modules', 'moduleId'],
    ['lessons', 'lessonId'],
    ['assignments', 'assignmentId'],
  ]
  for (const [type] of types) {
    try {
      await go(page, `/admin/content/${type}`, { wait: 4000 })
      const firstEditLink = page.locator(`a[href^="/admin/content/${type}/"]`).first()
      if (await firstEditLink.count()) {
        const href = await firstEditLink.getAttribute('href')
        await go(page, href, { wait: 3000 })
        await snap(page, `admin/content/${type}-edit`)
      } else {
        warn(`no edit link found in /admin/content/${type} — list still empty after 4s wait`)
      }
    } catch (err) {
      warn(`content/${type} edit screenshot failed: ${err.message}`)
    }
  }

  // /admin/users — open role-change modal then user-details modal.
  try {
    await go(page, '/admin/users', { wait: 6000 })
    const search = page.locator('input[placeholder*="Search"]').first()
    await search.fill(ACCOUNTS.applicant.email)
    await page.waitForTimeout(1500)
    const changeBtn = page.locator(`table tbody tr:has-text("${ACCOUNTS.applicant.email}") button:has-text("Change role")`).first()
    if (await changeBtn.count()) {
      await changeBtn.click()
      await page.waitForTimeout(1500)
      await snap(page, 'admin/users-role-modal')
      // Close (click outside or Escape).
      await page.locator('button[aria-label="Close"]').first().click().catch(() => page.keyboard.press('Escape'))
      await page.waitForTimeout(800)
    } else {
      warn('change-role button for demo applicant not found')
    }
    const detailsBtn = page.locator(`table tbody tr:has-text("${ACCOUNTS.applicant.email}") button:has-text("Details")`).first()
    if (await detailsBtn.count()) {
      await detailsBtn.click()
      await page.waitForTimeout(2500) // audit logs fetch
      await snap(page, 'admin/users-details-modal')
    } else {
      warn('details button for demo applicant not found')
    }
  } catch (err) { warn(`role/details modal capture: ${err.message}`) }

  // /admin/applications/:id — first row.
  try {
    await go(page, '/admin/applications', { wait: 1500 })
    const firstApp = page.locator('a[href^="/admin/applications/"]').first()
    if (await firstApp.count()) {
      const href = await firstApp.getAttribute('href')
      await go(page, href, { wait: 1500 })
      await snap(page, 'admin/applications-detail')
      // Try the review page.
      await go(page, href + '/review', { wait: 1500 })
      if (page.url().includes('/review')) await snap(page, 'admin/applications-review')
    }
  } catch (err) { warn(`applications detail capture: ${err.message}`) }

  await page.close()
  await ctx._cleanup()
}

async function captureStudent() {
  if (!fs.existsSync(ACCOUNTS.student.storage)) { warn('skip student: no storage'); return }
  const ctx = await newContext({ storageStateName: ACCOUNTS.student.storage, headless: true })
  await captureRouteList(ctx, STUDENT_ROUTES)

  // Drill into course/module/lesson/assignment via known seed slugs.
  // CourseHome only exposes lesson-level links, so going by slug is
  // simpler than trying to navigate through module index pages.
  const page = await ctx.newPage()
  const m = loadManifest()
  const SLUGS = {
    module: 'demo-stepup-mod-lab-foundations',
    lesson: 'demo-stepup-l-research-methodology',
    assignment: 'demo-stepup-a-paper-summary',
  }
  try {
    await go(page, `/learn/module/${SLUGS.module}`, { wait: 3000 }); await snap(page, 'learn/module')
    await go(page, `/learn/lesson/${SLUGS.lesson}`, { wait: 3000 }); await snap(page, 'learn/lesson')
    await go(page, `/learn/assignment/${SLUGS.assignment}`, { wait: 3000 }); await snap(page, 'learn/assignment')
    if (m.submissionId) {
      await go(page, `/learn/submissions/${m.submissionId}`, { wait: 3000 })
      await snap(page, 'learn/submission')
    }
    if (m.sessionId) {
      await go(page, `/learn/sessions/${m.sessionId}`, { wait: 3000 })
      await snap(page, 'learn/session-detail')
    }
  } catch (err) { warn(`student deep-link capture: ${err.message}`) }

  // Applicant routes from a freshly-applicant account (separate session).
  await page.close(); await ctx._cleanup()

  if (fs.existsSync(ACCOUNTS.applicant.storage)) {
    const aCtx = await newContext({ storageStateName: ACCOUNTS.applicant.storage, headless: true })
    await captureRouteList(aCtx, [
      ['/applicant', 'applicant/dashboard'],
      ['/applicant/applications', 'applicant/applications'],
      ['/applicant/applications/new', 'applicant/new-application'],
      ['/apply/stepup-scholars', 'applicant/apply-stepup'],
      ['/account/settings', 'applicant/account-settings'],
    ])
    await aCtx._cleanup()
  }
}

async function captureMentor() {
  if (!fs.existsSync(ACCOUNTS.mentor.storage)) { warn('skip mentor: no storage'); return }
  const ctx = await newContext({ storageStateName: ACCOUNTS.mentor.storage, headless: true })
  await captureRouteList(ctx, MENTOR_ROUTES)

  const page = await ctx.newPage()
  const m = loadManifest()
  const studentUid = m.uids?.student
  if (studentUid) {
    try {
      await go(page, `/learn/mentor/students/${studentUid}`, { wait: 2000 })
      await snap(page, 'mentor/student-detail')
      await go(page, `/mentor/feedback/${studentUid}`, { wait: 1500 })
      await snap(page, 'mentor/feedback')
    } catch (err) { warn(`mentor student detail: ${err.message}`) }
    // Submission review — go directly via the submission id captured in extras.
    if (m.submissionId) {
      try {
        await go(page, `/learn/mentor/submissions/${m.submissionId}`, { wait: 3000 })
        await snap(page, 'mentor/submission-review')
      } catch (err) { warn(`mentor submission review: ${err.message}`) }
    }
  }
  await page.close(); await ctx._cleanup()
}

async function phaseCapture() {
  log('Capture: anonymous + auth pages')
  await capturePublicAndAuth()
  log('Capture: staff/admin')
  await captureStaff()
  log('Capture: student')
  await captureStudent()
  log('Capture: mentor')
  await captureMentor()
}

// ---------- Phase: all ----------

async function phaseAll() {
  await phaseAuth()
  await phaseRoles()
  await phaseCohort()
  await phaseExtras()
  await phaseCapture()
}

// ---------- CLI ----------

const cmds = {
  auth: phaseAuth,
  roles: phaseRoles,
  cohort: phaseCohort,
  extras: phaseExtras,
  capture: phaseCapture,
  all: phaseAll,
}

;(async () => {
  const cmd = process.argv[2]
  if (!cmd || !cmds[cmd]) {
    console.log('Usage: node tools/screenshot-lms/capture.cjs <auth|roles|cohort|extras|capture|all>')
    process.exit(cmd ? 2 : 0)
  }
  try {
    await cmds[cmd]()
    log('done.')
  } catch (err) {
    console.error('\n✗', err)
    process.exit(1)
  }
})()
