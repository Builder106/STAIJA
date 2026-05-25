// Add an environment filter so the webhook fires for events in BOTH
// master and staging. Contentful's actual default is master-only — even
// when no filters are set, the docs are misleading on this. Without
// this filter, publishes in staging silently produce no webhook calls.

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env' })
loadEnv({ path: '.env.local', override: true })

import contentful from 'contentful-management'
const { createClient } = contentful

async function main() {
  const space = await createClient({
    accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN!,
  }).getSpace(process.env.VITE_CONTENTFUL_SPACE_ID!)

  const hooks = await space.getWebhooks()
  for (const hook of hooks.items) {
    if (!hook.url.includes('contentfulwebhook')) continue
    console.log(`Patching ${hook.name} (${hook.sys.id})…`)
    ;(hook as unknown as { filters: unknown }).filters = [
      {
        in: [{ doc: 'sys.environment.sys.id' }, ['master', 'staging']],
      },
    ]
    const updated = await hook.update()
    console.log(`  filters now: ${JSON.stringify((updated as unknown as { filters: unknown }).filters)}`)
  }
}

main().catch((e) => {
  console.error('Failed:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
