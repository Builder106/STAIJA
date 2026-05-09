// Last-resort: delete the existing webhook and recreate it via API,
// guaranteeing every field is exactly right (no UI copy-paste artifacts,
// no leading whitespace in name, etc).

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env' })
loadEnv({ path: '.env.local', override: true })

import contentful from 'contentful-management'
const { createClient } = contentful

const URL = 'https://contentfulwebhook-lyeekzilaq-uc.a.run.app'
const TOKEN = 'izJwH4qWUuGeUXp6dM046KsfVpcyQ6t209PXS9s7mMo='

async function main() {
  const space = await createClient({
    accessToken: process.env.VITE_CONTENTFUL_MANAGEMENT_TOKEN!,
  }).getSpace(process.env.VITE_CONTENTFUL_SPACE_ID!)

  const hooks = await space.getWebhooks()
  for (const hook of hooks.items) {
    if (hook.url.includes('contentfulwebhook')) {
      console.log(`Deleting existing: ${hook.sys.id}`)
      await hook.delete()
    }
  }

  // Recreate from scratch.
  const created = await space.createWebhook({
    name: 'Mirror to Firestore (LMS)',
    url: URL,
    topics: [
      'Entry.publish',
      'Entry.unpublish',
      'Entry.archive',
      'Entry.unarchive',
      'Entry.delete',
    ],
    headers: [{ key: 'x-staija-token', value: TOKEN }],
    active: true,
  } as Parameters<typeof space.createWebhook>[0])
  console.log(`Created: ${created.sys.id}`)
  console.log(`  topics: ${created.topics.join(', ')}`)
  console.log(`  active: ${created.active}`)
}

main().catch((e) => {
  console.error('Failed:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
