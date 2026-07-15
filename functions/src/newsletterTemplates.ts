/**
 * HTML email templates for the /stay-connected newsletter mechanic.
 *
 * Three audience-specific bodies, all built on the shared layout
 * primitives exported from emailTemplates.ts so they read as family
 * with the transactional emails:
 *
 *   - notifyMeWelcomeEmail({ interestTag })
 *       One-shot welcome / re-orient. Sets expectations — what we'll
 *       send, what we won't. Body pivots on the subscriber's tag.
 *
 *   - nextCycleOpenedEmail({ programLabel, applyUrl, applicationEnd? })
 *       The headliner. Fires when a program's application window
 *       opens, to subscribers tagged for that program. This is the
 *       email subscribers actually signed up for.
 *
 *   - mentorIntroEmail({ inviteUrl? })
 *       Outreach to subscribers tagged "mentor" — what mentoring at
 *       STAIJA looks like, with an optional invite link the
 *       /stay-connected admin surface can mint when a slot opens.
 *
 * Each function returns `{ subject, html, text }` (a `RenderedEmail`).
 * Callers (`sendInterestSegmentEmail` in announceCycle.ts) pair the
 * three with `sendMailgun` from emailTemplates.ts.
 *
 * Why a separate file from emailTemplates.ts: those are 1:1
 * transactional emails tied to a specific user action (application
 * accepted, reference letter received). These are broadcast nurture
 * sends keyed by audience tag, with a different cadence and a
 * different deliverability profile. Keeping them apart avoids the
 * "every email template lives in one 1500-line file" tar pit.
 */

import {
  APP_URL,
  VIOLET,
  MUTED,
  button,
  divider,
  eyebrow,
  heading,
  layout,
  p,
} from './emailTemplates'

export type InterestTag = 'stepup-next' | 'dynamerge-next' | 'mentor' | 'general'

/** Pretty label for the headline + body copy. The tag is the stored
 *  identity; the label is the spoken one. */
export function labelForInterestTag(tag: InterestTag): string {
  switch (tag) {
    case 'stepup-next':
      return 'StepUp Scholars'
    case 'dynamerge-next':
      return 'Dynamerge'
    case 'mentor':
      return 'mentoring at STAIJA'
    case 'general':
      return 'STAIJA news'
  }
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

// --- 1. Notify-me welcome ----------------------------------------------

export function notifyMeWelcomeEmail(params: {
  interestTag: InterestTag
}): RenderedEmail {
  const { interestTag } = params
  // Body lines pivot on the tag so the email doesn't read as generic.
  // The "what to expect" promise is the load-bearing part — people
  // signed up trusting we wouldn't spam.
  const tagLine = (() => {
    switch (interestTag) {
      case 'stepup-next':
        return `You'll hear from us the day the next StepUp Scholars cycle opens — Nigeria-based, in-person, 6 months — and not really before.`
      case 'dynamerge-next':
        return `You'll hear from us the day the next Dynamerge cycle opens — pan-African, virtual, 4 weeks — and not really before.`
      case 'mentor':
        return `We'll reach out when we're opening the next mentor cohort. Mentoring at STAIJA is light-touch (a few hours a month) and entirely remote; an admin will pair you with a student fit when the time comes.`
      case 'general':
        return `We'll send occasional notes when there's real news — new programs, big student wins, dispatches from the lab. No weekly digest, no marketing pile-on.`
    }
  })()

  const ctaUrl = `${APP_URL}/stay-connected`

  const subject = `You're on the STAIJA list.`

  const html = layout(`
    ${eyebrow('Stay connected')}
    ${heading("Thanks for signing up.")}
    ${p(tagLine)}
    ${p(`If your plans change — different program, different timing, or you'd rather not hear from us at all — you can update or unsubscribe from any of our emails.`, 'margin-bottom:0;')}
    ${button('Browse STAIJA', ctaUrl)}
    ${divider()}
    ${p(`Questions? Reply to this email or write to <a href="mailto:contact@staija.org" style="color:${VIOLET};text-decoration:none;">contact@staija.org</a>.`, `font-size:13px;color:${MUTED};margin-bottom:0;`)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `Thanks for signing up.`,
    ``,
    tagLine,
    ``,
    `If your plans change — different program, different timing, or you'd rather not hear from us at all — you can update or unsubscribe from any of our emails.`,
    ``,
    `Browse STAIJA: ${ctaUrl}`,
    ``,
    `Questions? Reply to this email or write to contact@staija.org.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { subject, html, text }
}

// --- 2. Next cycle opened ----------------------------------------------

export function nextCycleOpenedEmail(params: {
  programLabel: string
  applyUrl: string
  applicationEnd?: string  // optional human-readable deadline ("March 15")
}): RenderedEmail {
  const { programLabel, applyUrl, applicationEnd } = params

  const deadlineLine = applicationEnd
    ? `Applications close ${applicationEnd}.`
    : `Applications stay open until the cohort fills.`

  const subject = `${programLabel} applications are open.`

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading(`${programLabel} applications are open.`)}
    ${p(`This is the email you signed up for — the next ${programLabel} cycle is taking applications now.`)}
    ${p(deadlineLine)}
    ${p(`Read the eligibility list, look at the timeline, and apply when you're ready. The form auto-saves so you can step away mid-application and pick up later.`, 'margin-bottom:0;')}
    ${button(`Apply to ${programLabel}`, applyUrl)}
    ${divider()}
    ${p(`Not the right fit this cycle? Reply with what changed and we'll update your list preferences.`, `font-size:13px;color:${MUTED};margin-bottom:0;`)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `${programLabel} applications are open.`,
    ``,
    `This is the email you signed up for — the next ${programLabel} cycle is taking applications now.`,
    ``,
    deadlineLine,
    ``,
    `Read the eligibility list, look at the timeline, and apply when you're ready. The form auto-saves so you can step away mid-application and pick up later.`,
    ``,
    `Apply: ${applyUrl}`,
    ``,
    `Not the right fit this cycle? Reply with what changed and we'll update your list preferences.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { subject, html, text }
}

// --- 3. Mentor intro ---------------------------------------------------

export function mentorIntroEmail(params: {
  inviteUrl?: string  // optional — when present, links to a personalised invite
}): RenderedEmail {
  const { inviteUrl } = params

  const subject = `Mentoring at STAIJA — what it actually looks like.`

  const cta = inviteUrl
    ? button('Accept your mentor invite', inviteUrl)
    : button('Read about mentoring', `${APP_URL}/stay-connected`)

  const followupLine = inviteUrl
    ? `The invite link above is yours — opening it signs you in and turns on your mentor profile.`
    : `When we have a student fit for what you bring, we'll send an invite link from this address.`

  const html = layout(`
    ${eyebrow('Mentoring')}
    ${heading(`Mentoring at STAIJA.`)}
    ${p(`You signed up to hear about mentoring — here's the honest pitch.`)}
    ${p(`Mentors at STAIJA are working scientists, engineers, and builders who give a few hours a month to one or two students. The structure is light: an intro session, async check-ins (DM or async voice — students are in West Africa, often on phones), and one or two live calls per project milestone.`)}
    ${p(`We pair you to a student whose research interest or stage matches your background. You're not designing their curriculum — STAIJA staff handles that. Your job is the unstuck-er, the proof-reader, the person who's already been through the thing.`)}
    ${p(followupLine, 'margin-bottom:0;')}
    ${cta}
    ${divider()}
    ${p(`Reply with questions or scheduling constraints — we'll match them before sending an invite.`, `font-size:13px;color:${MUTED};margin-bottom:0;`)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `Mentoring at STAIJA.`,
    ``,
    `You signed up to hear about mentoring — here's the honest pitch.`,
    ``,
    `Mentors at STAIJA are working scientists, engineers, and builders who give a few hours a month to one or two students. The structure is light: an intro session, async check-ins (DM or async voice — students are in West Africa, often on phones), and one or two live calls per project milestone.`,
    ``,
    `We pair you to a student whose research interest or stage matches your background. You're not designing their curriculum — STAIJA staff handles that. Your job is the unstuck-er, the proof-reader, the person who's already been through the thing.`,
    ``,
    followupLine,
    ``,
    inviteUrl ? `Accept invite: ${inviteUrl}` : `Learn more: ${APP_URL}/stay-connected`,
    ``,
    `Reply with questions or scheduling constraints — we'll match them before sending an invite.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { subject, html, text }
}
