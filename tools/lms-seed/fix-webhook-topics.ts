// Update the existing webhook's topics from short-form (Entry.publish)
// to namespaced form (ContentManagement.Entry.publish). Some accounts
// only deliver when the namespaced form is used; the short form is
// silently ignored.

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env' })
loadEnv({ path: '.env.local', override: true })

import contentful from 'contentful-management'
const { createClient } = contentful

const NAMESPACED = [
  'ContentManagement.Entry.archive',
  'ContentManagement.Entry.unarchive',
  'ContentManagement.Entry.publish',
  'ContentManagement.Entry.unpublish',
  'ContentManagement.Entry.delete',
]

async function main() {
  const space = await createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
  }).getSpace(process.env.VITE_CONTENTFUL_SPACE_ID!)

  const hooks = await space.getWebhooks()
  for (const hook of hooks.items) {
    if (!hook.url.includes('contentfulwebhook')) continue
    console.log(`Patching ${hook.name}…`)
    hook.topics = NAMESPACED
    const updated = await hook.update()
    console.log(`  topics now: ${updated.topics.join(', ')}`)
  }
}

main().catch((e) => {
  console.error('Failed:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
