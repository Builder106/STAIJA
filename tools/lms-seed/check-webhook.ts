// One-off probe: list the Contentful webhooks in this space and their
// most recent delivery attempts. Helps diagnose why publishes aren't
// reaching the Cloud Function.
//
// Run with: npx tsx tools/lms-seed/check-webhook.ts

import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env' })
loadEnv({ path: '.env.local', override: true })

import contentful from 'contentful-management'
const { createClient } = contentful

async function main() {
  const space = await createClient({
    accessToken: process.env.VITE_CONTENTFUL_MANAGEMENT_TOKEN!,
  }).getSpace(process.env.VITE_CONTENTFUL_SPACE_ID!)

  const hooks = await space.getWebhooks()
  if (!hooks.items.length) {
    console.log('No webhooks configured in this space.')
    return
  }

  // Raw dump first — surfaces fields the SDK doesn't pretty-print
  // (notably any environment scoping).
  for (const hook of hooks.items) {
    const raw = (hook as unknown as { toPlainObject?: () => unknown }).toPlainObject?.() ?? hook
    console.log('--- raw webhook config ---')
    console.log(JSON.stringify(raw, null, 2))
    console.log('--------------------------')
  }

  for (const hook of hooks.items) {
    console.log(`\n# ${hook.name}`)
    console.log(`  url:      ${hook.url}`)
    console.log(`  active:   ${hook.active}`)
    console.log(`  topics:   ${(hook.topics ?? []).join(', ') || '(all)'}`)
    console.log(`  filters:  ${JSON.stringify(hook.filters ?? [])}`)
    console.log(`  headers:  ${(hook.headers ?? []).map((h) => `${h.key}=${h.secret ? '<redacted>' : (h.value ?? '')}`).join(', ') || '(none)'}`)
    console.log(`  contentType: ${hook.transformation?.contentType ?? '(default)'}`)
    // Contentful environment scope — when present, the webhook only fires
    // for events in those envs. Empty/undefined = all environments.
    const raw = hook as unknown as { environments?: unknown[] }
    console.log(`  environments: ${raw.environments ? JSON.stringify(raw.environments) : '(all)'}`)

    try {
      const health = await (hook as unknown as { getHealth?: () => Promise<unknown> }).getHealth?.()
      console.log(`  health:   ${JSON.stringify(health)}`)
    } catch (e) {
      console.log(`  health:   (unavailable: ${e instanceof Error ? e.message : 'err'})`)
    }
    const calls = await hook.getCalls()
    const recent = calls.items.slice(0, 5)
    if (recent.length === 0) {
      console.log('  recent calls: (none)')
      continue
    }
    console.log('  recent calls:')
    for (const c of recent) {
      console.log(`    ${c.statusCode}  ${c.requestAt}  ${c.eventType}  ${c.url}`)
      if (c.errors?.length) console.log(`      errors: ${c.errors.join('; ')}`)
    }
  }
}

main().catch((e) => {
  console.error('Failed:', e instanceof Error ? e.message : e)
  process.exitCode = 1
})
