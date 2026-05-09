// One-off probe: print how many docs landed in each cms_* mirror
// collection, and the IDs of any demo-* entries. Run via:
//   cd functions && node check-mirror.cjs
// Auth: Application Default Credentials (gcloud auth application-default login).
const admin = require('firebase-admin')

admin.initializeApp({ projectId: 'staija' })
const db = admin.firestore()

;(async () => {
  for (const c of ['cms_courses', 'cms_modules', 'cms_lessons', 'cms_assignmentSpecs']) {
    const snap = await db.collection(c).get()
    const demos = snap.docs.filter((d) => d.id.startsWith('demo-'))
    console.log(`${c.padEnd(22)} total=${snap.size}  demos=${demos.length}`)
    for (const d of demos) console.log(`  ${d.id}`)
  }
  process.exit(0)
})().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
