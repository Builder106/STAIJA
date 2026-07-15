/**
 * HTML email templates for STAIJA transactional email.
 *
 * Every exported template function returns { html, text }. Pass both to
 * sendMailgun — html is used by clients that render it, text is the
 * plain-text fallback.
 *
 * Design notes:
 *   - Table-based outer layout for Outlook desktop compat; div-based inner
 *     content is fine for Gmail, Apple Mail, and Outlook.com.
 *   - All styles are inline — no external stylesheet, no <style> in <head>.
 *   - The header carries the brand violet→sky gradient as a "weave band":
 *     a row of solid-colour cells sampled along the ramp, widths varied
 *     like aso-oke warp stripes. Outlook ignores CSS gradients, so the
 *     stepped band is both the fallback and the aesthetic.
 *   - Below the weave sits an ink (#0E1217) header band with the wordmark,
 *     echoing the site hero's white-on-colour treatment.
 *   - CTA buttons include a VML block for Outlook rounded corners.
 *   - System font stack only — web fonts are unreliable in email clients.
 *     Headings use the heavy sans stack (closest cousin of IBM Plex Sans);
 *     eyebrows and data fields use mono, matching the site's --font-mono role.
 *   - Brand tokens must stay in sync with src/style.css @theme block.
 *   - The divider's Uli-inspired motif is a hosted PNG under
 *     https://staija.org/email/ — asset filenames are versioned (-v1) and
 *     never overwritten, because sent email lives in inboxes forever.
 *
 * Navigational links (dashboard/status/programs URLs) route through
 * the APP_URL param below so staging mail points at staging.staija.org
 * instead of yanking the recipient into prod Firestore. The logo <img>
 * in layout() stays pinned to https://staija.org on purpose: it's a
 * static asset fetch, and staging.staija.org sits behind Vercel SSO,
 * which would break image loading for anyone without a session.
 * APP_URL is set per-project via functions/.env.<projectId> files —
 * see functions/.env.staija-staging.
 */

// Firebase's CLI loads functions/.env.<projectId> into process.env before
// the function runs, regardless of whether the code declares a matching
// `defineString` param. Reading it directly here (instead of importing
// firebase-functions/params) keeps this file free of firebase-functions
// imports, which applicantEmail.ts and its root-level vitest suite rely
// on to load without a functions-specific test setup.
export const APP_URL = process.env.APP_URL ?? 'https://staija.org'

// --- Brand tokens -------------------------------------------------------
// Exported so sibling template modules (e.g. newsletterTemplates.ts) can
// pull from the same palette without redefining colours. Adding a token
// here means updating src/style.css @theme block too.

export const VIOLET = '#8B55FF'
export const VIOLET_DEEP = '#6B3FE0' // violet darkened for text on light backgrounds
export const SKY = '#5EDBE7'
export const SKY_DEEP = '#0E7490'   // sky darkened for text/links on light backgrounds
export const GOLD = '#F0B429'       // hero-illustration gold — acceptance accent
export const GOLD_DEEP = '#A16207'  // gold darkened for text on light backgrounds
export const INK = '#0E1217'
export const PAPER = '#F1F5F9'  // slate-100 — keeps in sync with --color-paper in src/style.css
export const OUTER_BG = '#E2E8F0'  // slate-200 — slightly darker than paper for outer background
export const MUTED = '#64748B'  // slate-500 — cool muted matching the site's slate system
export const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
export const MONO = "'Courier New', Courier, monospace"

// Masthead variants: designed header graphics (gradient field, aso-oke
// weave texture, science line-art, IBM Plex wordmark) hosted under
// https://staija.org/email/. Rendered at 1200×240, displayed at 600×120.
// Generated from a parametric SVG — see JOURNAL.md 2026-07-15. The accent
// follows the recipient's journey: gold for acceptance, sky for
// referee-facing mail, violet for everything else.
export type MastheadVariant = 'violet' | 'sky' | 'gold'

// --- Shared Mailgun sender ---------------------------------------------

// Mailgun's free plan only allows one sending domain, so staging shares
// mg.staija.org with prod. Without isolation, a staging bug or a prod
// Firestore export landing in staija-staging could send real-looking
// STAIJA email to real applicants. Until staging gets its own Mailgun
// domain, gate non-prod sends behind an allowlist — staging can still
// exercise the full template/Functions code path, but only deliver to
// addresses we control.
//
// Add teammate / QA addresses here as needed. Keep small. Entries are
// matched after Gmail-alias canonicalization (dots, +tags, and the
// googlemail.com domain all collapse to the same inbox), so a single
// "name@gmail.com" entry covers "n.a.m.e+staging@googlemail.com" etc.
const PROD_FIREBASE_PROJECT = 'staija'
const STAGING_EMAIL_ALLOWLIST_RAW = [
   'vaughanolayimika@gmail.com',
  'vaughanolayinka@gmail.com',
]

// Gmail ignores dots in the local part, treats "+suffix" as an alias,
// and aliases googlemail.com → gmail.com. Canonicalize before set
// lookup so adding one Gmail address covers every variant of it.
// Non-Gmail addresses pass through with only lowercase normalization —
// other providers' plus/dot semantics aren't universal and we don't
// want to over-match.
function canonicalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase()
  const atIdx = lower.lastIndexOf('@')
  if (atIdx === -1) return lower
  let local = lower.slice(0, atIdx)
  let domain = lower.slice(atIdx + 1)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const plusIdx = local.indexOf('+')
    if (plusIdx !== -1) local = local.slice(0, plusIdx)
    local = local.replace(/\./g, '')
    domain = 'gmail.com'
  }
  return `${local}@${domain}`
}

const STAGING_EMAIL_ALLOWLIST = new Set<string>(
  STAGING_EMAIL_ALLOWLIST_RAW.map(canonicalizeEmail),
)

function isNonProdEnv(): boolean {
  return process.env.GCLOUD_PROJECT !== PROD_FIREBASE_PROJECT
}

export interface MailgunSendParams {
  apiKey: string
  domain: string
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendMailgun(params: MailgunSendParams): Promise<void> {
  if (isNonProdEnv() && !STAGING_EMAIL_ALLOWLIST.has(canonicalizeEmail(params.to))) {
    console.log('[email] non-prod send blocked: recipient not on STAGING_EMAIL_ALLOWLIST', {
      project: process.env.GCLOUD_PROJECT,
      to: params.to,
      subject: params.subject,
    })
    return
  }

  const auth = Buffer.from(`api:${params.apiKey}`).toString('base64')
  const form = new URLSearchParams()
  form.set('from', 'STAIJA <contact@staija.org>')
  form.set('to', params.to)
  form.set('subject', params.subject)
  form.set('text', params.text)
  if (params.html) form.set('html', params.html)

  const res = await fetch(`https://api.mailgun.net/v3/${params.domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Mailgun ${res.status}: ${detail}`)
  }
}

// --- Rendering helpers --------------------------------------------------
// Exported alongside the brand tokens so sibling template modules build
// against the same primitives. refBox stays private because it's
// application-specific (references an applicationId).

export function button(
  label: string,
  url: string,
  opts: { bg?: string; fg?: string } = {},
): string {
  const bg = opts.bg ?? VIOLET
  const fg = opts.fg ?? '#ffffff'
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr>
          <td>
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
              href="${url}" style="height:44px;v-text-anchor:middle;width:200px;"
              arcsize="23%" strokecolor="${bg}" fillcolor="${bg}">
              <w:anchorlock/>
              <center style="color:${fg};font-family:sans-serif;font-size:14px;font-weight:600;">${label}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${url}" style="background-color:${bg};border-radius:10px;color:${fg};display:inline-block;font-family:${SANS};font-size:14px;font-weight:600;line-height:1;padding:13px 24px;text-decoration:none;">${label}</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>`
}

// Specimen label: the reference box styled like a herbarium tag / lab
// sample card — accent left border, dotted ledger rules, mono fields.
function refBox(
  applicationId: string,
  opts: { program?: string; status?: string; accent?: string; statusColor?: string } = {},
): string {
  const accent = opts.accent ?? VIOLET
  const field = (key: string, value: string) => `<tr>
          <td style="padding:9px 12px 8px 0;border-bottom:1px dotted #CBD5E1;width:110px;vertical-align:baseline;">
            <span style="font-family:${MONO};font-size:11px;font-weight:700;color:${MUTED};letter-spacing:0.1em;">${key}</span>
          </td>
          <td style="padding:9px 0 8px;border-bottom:1px dotted #CBD5E1;vertical-align:baseline;">
            <span style="font-family:${MONO};font-size:14px;color:${INK};font-weight:600;">${value}</span>
          </td>
        </tr>`
  const rows = [
    ...(opts.program ? [field('PROGRAM', opts.program)] : []),
    field('REF NO', applicationId),
    ...(opts.status
      ? [field('STATUS', `<span style="color:${opts.statusColor ?? VIOLET_DEEP};">${opts.status}</span>`)]
      : []),
  ].join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="background-color:${PAPER};border-left:3px solid ${accent};border-radius:0 10px 10px 0;margin:0 0 32px;width:100%;">
        <tr>
          <td style="padding:12px 20px 13px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${rows}</table>
          </td>
        </tr>
      </table>`
}

export function eyebrow(text: string): string {
  return `<p style="margin:0 0 14px;font-family:${MONO};font-size:12px;font-weight:700;color:${MUTED};letter-spacing:0.12em;text-transform:uppercase;">${text}</p>`
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 24px;font-family:${SANS};font-size:26px;font-weight:800;color:${INK};line-height:1.25;letter-spacing:-0.4px;">${text}</h1>`
}

export function p(text: string, styles = ''): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;color:${INK};line-height:1.75;${styles}">${text}</p>`
}

export function divider(): string {
  // Uli-inspired line motif between hairline rules. If the image is
  // blocked, the flanking rules still read as a divider. The margin-top
  // on the inner divs vertically centres the rules against the 20px
  // motif; Outlook renders them slightly high, which is acceptable.
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 24px;width:100%;">
        <tr>
          <td style="font-size:0;line-height:0;"><div style="border-top:1px solid #E2E8F0;margin-top:10px;font-size:0;line-height:0;">&nbsp;</div></td>
          <td width="144" align="center" style="padding:0 12px;font-size:0;line-height:0;">
            <img src="https://staija.org/email/uli-divider-v1.png" width="120" height="20" alt="" style="display:block;border:0;" />
          </td>
          <td style="font-size:0;line-height:0;"><div style="border-top:1px solid #E2E8F0;margin-top:10px;font-size:0;line-height:0;">&nbsp;</div></td>
        </tr>
      </table>`
}

export function layout(body: string, opts: { masthead?: MastheadVariant } = {}): string {
  const masthead = opts.masthead ?? 'violet'
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${OUTER_BG};" bgcolor="${OUTER_BG}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${OUTER_BG}" style="background-color:${OUTER_BG};min-width:320px;">
    <tr>
      <td align="center" style="padding:40px 16px 52px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Designed masthead. The td's ink bgcolor is the blocked-image
               fallback: clients that suppress images show an ink band with
               the white STAIJA alt text instead of a blank gap. -->
          <tr>
            <td bgcolor="${INK}" style="background-color:${INK};border-radius:14px 14px 0 0;font-size:0;line-height:0;">
              <img src="https://staija.org/email/masthead-${masthead}-v1.png" width="600" height="120" alt="STAIJA" style="display:block;border:0;width:100%;height:auto;color:#ffffff;font-family:${SANS};font-size:20px;font-weight:700;line-height:120px;text-align:left;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:0 0 14px 14px;padding:28px 40px 44px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px 0;" align="center">
              <p style="margin:0 0 6px;font-family:${SANS};font-size:12px;color:${MUTED};line-height:1.6;">
                Africa's next <em style="font-style:italic;color:${SKY_DEEP};">scientist-leaders</em> start here.
              </p>
              <p style="margin:0;font-family:${SANS};font-size:12px;color:${MUTED};line-height:1.6;">
                STAIJA &nbsp;·&nbsp;
                <a href="${APP_URL}" style="color:${MUTED};text-decoration:underline;">staija.org</a>
                &nbsp;·&nbsp;
                <a href="mailto:contact@staija.org" style="color:${MUTED};text-decoration:underline;">contact@staija.org</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// --- Exported template functions ----------------------------------------

export function applicationReceivedEmail(params: {
  firstName: string
  programLabel: string
  applicationId: string
}): { html: string; text: string } {
  const { firstName, programLabel, applicationId } = params

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading('Your application is in.')}
    ${p(`Hi ${firstName},`)}
    ${p(`We've received your application to ${programLabel}.`)}
    ${p(`A reviewer will go through it within five business days. If we need anything from you in the meantime, we'll reach out directly.`, 'margin-bottom:32px;')}
    ${refBox(applicationId, { program: programLabel, status: 'RECEIVED' })}
    ${p('— STAIJA', 'margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `We've received your application to ${programLabel}.`,
    ``,
    `A reviewer will go through it within five business days. If we need anything from you in the meantime, we'll reach out directly.`,
    ``,
    `Your reference number is ${applicationId} — keep it handy if you need to write to us.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function applicationAcceptedEmail(params: {
  firstName: string
  programLabel: string
  applicationId: string
}): { html: string; text: string } {
  const { firstName, programLabel, applicationId } = params

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading("You've been accepted.")}
    ${p(`Hi ${firstName},`)}
    ${p(`Congratulations — your application to ${programLabel} has been accepted.`)}
    ${p(`A program coordinator will be in touch within 48 hours with everything you need to get started, including the orientation schedule and your scholar agreement.`, 'margin-bottom:32px;')}
    ${refBox(applicationId, { program: programLabel, status: 'ACCEPTED ✓', accent: GOLD, statusColor: GOLD_DEEP })}
    ${p('Welcome.', 'margin-bottom:4px;')}
    ${p('— STAIJA', 'margin-bottom:0;')}
  `, { masthead: 'gold' })

  const text = [
    `Hi ${firstName},`,
    ``,
    `Congratulations — your application to ${programLabel} has been accepted.`,
    ``,
    `A program coordinator will be in touch within 48 hours with everything you need to get started, including the orientation schedule and your scholar agreement.`,
    ``,
    `Your reference number: ${applicationId}`,
    ``,
    `Welcome.`,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function applicationRejectedEmail(params: {
  firstName: string
  programLabel: string
  applicationId: string
}): { html: string; text: string } {
  const { firstName, programLabel, applicationId } = params
  const dashboardUrl = `${APP_URL}/applicant/applications`

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading('An update on your application.')}
    ${p(`Hi ${firstName},`)}
    ${p(`There's an update on your ${programLabel} application. Sign in to your account to read the full message from the team.`, 'margin-bottom:0;')}
    ${button('View update', dashboardUrl)}
    ${refBox(applicationId, { program: programLabel })}
    ${p('Thank you for the time you put into your application.', 'margin-bottom:4px;')}
    ${p('— STAIJA', 'margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `There's an update on your ${programLabel} application.`,
    ``,
    `Sign in to your account to read the full update from the team:`,
    dashboardUrl,
    ``,
    `Your reference number: ${applicationId}`,
    ``,
    `Thank you for the time you put into your application.`,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function spotReOfferedEmail(params: {
  firstName: string
  programLabel: string
  applicationId: string
}): { html: string; text: string } {
  const { firstName, programLabel, applicationId } = params
  const dashboardUrl = `${APP_URL}/applicant/applications/${applicationId}`

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading('Your spot is open again.')}
    ${p(`Hi ${firstName},`)}
    ${p(`Last cycle you deferred your ${programLabel} acceptance — that cycle's open now. Your spot is waiting if you'd like it.`)}
    ${p(`Sign in to confirm, decline, or defer again. The team will start placing applicants in cohorts within a few days, so a quick response helps us plan.`, 'margin-bottom:0;')}
    ${button('Respond to your offer', dashboardUrl)}
    ${refBox(applicationId, { program: programLabel, status: 'OFFER REOPENED' })}
    ${p('— STAIJA', 'margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `Last cycle you deferred your ${programLabel} acceptance — that cycle's open now. Your spot is waiting if you'd like it.`,
    ``,
    `Sign in to confirm, decline, or defer again. The team will start placing applicants in cohorts within a few days, so a quick response helps us plan.`,
    ``,
    `Respond: ${dashboardUrl}`,
    ``,
    `Your reference number: ${applicationId}`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function referenceInviteEmail(params: {
  refName: string
  applicantName: string
  programLabel: string
  relationship: string
  institution: string
  uploadUrl: string
}): { html: string; text: string } {
  const { refName, applicantName, programLabel, relationship, institution, uploadUrl } = params
  const relationshipPhrase = relationship ? `their ${relationship}` : 'a reference'
  const institutionPhrase = institution ? ` at ${institution}` : ''

  const html = layout(`
    ${eyebrow(`${programLabel} · Reference request`)}
    ${heading(`${applicantName} has listed you as a reference.`)}
    ${p(`Hi ${refName},`)}
    ${p(`${applicantName} is applying to ${programLabel} at STAIJA and has listed you as ${relationshipPhrase}${institutionPhrase}.`)}
    ${p(`If you're willing to write a recommendation, you can upload your letter using the button below. The link is personal to you and stays open for 90 days.`, 'margin-bottom:0;')}
    ${button('Upload your letter', uploadUrl, { bg: SKY, fg: INK })}
    ${divider()}
    ${p(`There's no required format. A short, specific letter about what you've seen them do carries more weight than a long one.`, `font-size:13px;color:${MUTED};margin-bottom:8px;`)}
    ${p(`Questions? Write to us at <a href="mailto:contact@staija.org" style="color:${SKY_DEEP};text-decoration:none;">contact@staija.org</a>.`, `font-size:13px;color:${MUTED};margin-bottom:0;`)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `, { masthead: 'sky' })

  const text = [
    `Hi ${refName},`,
    ``,
    `${applicantName} is applying to ${programLabel} at STAIJA and has listed you as ${relationshipPhrase}${institutionPhrase}.`,
    ``,
    `If you're willing to write a recommendation, you can upload your letter here:`,
    uploadUrl,
    ``,
    `The link is personal to you and stays open for 90 days. There's no required format — a short, specific letter about what you've seen them do carries more weight than a long one.`,
    ``,
    `If you have any questions, you can reach us at contact@staija.org.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function referenceLetterReceivedEmail(params: {
  firstName: string
  refName: string
  programLabel: string
  applicationId: string
}): { html: string; text: string } {
  const { firstName, refName, programLabel, applicationId } = params
  const statusUrl = `${APP_URL}/applicant/applications/${applicationId}`

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading(`${refName}'s letter just came in.`)}
    ${p(`Hi ${firstName},`)}
    ${p(`${refName} uploaded their reference letter for your ${programLabel} application. One more box checked.`, 'margin-bottom:0;')}
    ${button('View application status', statusUrl)}
    ${refBox(applicationId, { program: programLabel, status: 'LETTER RECEIVED' })}
    ${p('— STAIJA', 'margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `${refName} uploaded their reference letter for your ${programLabel} application. One more box checked.`,
    ``,
    `See the latest status: ${statusUrl}`,
    ``,
    `Reference number: ${applicationId}`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function welcomeEmail(params: {
  firstName: string
}): { html: string; text: string } {
  const { firstName } = params
  const programsUrl = `${APP_URL}/programs`

  const html = layout(`
    ${eyebrow('Welcome')}
    ${heading('Welcome to STAIJA.')}
    ${p(`Hi ${firstName},`)}
    ${p(`Glad to have you here. STAIJA builds research and learning programs for STEM students across Nigeria — purpose-built, locally grounded, and run with care.`)}
    ${p(`When you're ready, take a look at our open programs. Applications run on a rolling basis, and the StepUp Scholars and Dynamerge tracks are both live right now.`, 'margin-bottom:0;')}
    ${button('Browse programs', programsUrl)}
    ${divider()}
    ${p(`Questions? Write to us at <a href="mailto:contact@staija.org" style="color:${VIOLET};text-decoration:none;">contact@staija.org</a>.`, `font-size:13px;color:${MUTED};margin-bottom:0;`)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `Glad to have you here. STAIJA builds research and learning programs for STEM students across Nigeria — purpose-built, locally grounded, and run with care.`,
    ``,
    `When you're ready, take a look at our open programs. Applications run on a rolling basis, and the StepUp Scholars and Dynamerge tracks are both live right now.`,
    ``,
    `Browse programs: ${programsUrl}`,
    ``,
    `Questions? Write to us at contact@staija.org.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function enrollmentEmail(params: {
  firstName: string
  programLabel: string
  courseUrl: string
}): { html: string; text: string } {
  const { firstName, programLabel, courseUrl } = params

  const html = layout(`
    ${eyebrow(programLabel)}
    ${heading("You're enrolled.")}
    ${p(`Hi ${firstName},`)}
    ${p(`Welcome to ${programLabel}. Your course is ready and your mentor is paired up — open the dashboard whenever you have a few minutes to start.`)}
    ${p(`Lessons are async. You'll have live mentor sessions on the cohort calendar, and assignments come with their own deadlines. Take it at the pace that fits.`, 'margin-bottom:0;')}
    ${button('Open my course', courseUrl)}
    ${divider()}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `Welcome to ${programLabel}. Your course is ready and your mentor is paired up — open the dashboard whenever you have a few minutes to start.`,
    ``,
    `Lessons are async. You'll have live mentor sessions on the cohort calendar, and assignments come with their own deadlines. Take it at the pace that fits.`,
    ``,
    `Open your course: ${courseUrl}`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function submissionGradedEmail(params: {
  firstName: string
  assignmentSlug: string
  grade?: number
  mentorComment: string
  submissionUrl: string
}): { html: string; text: string } {
  const { firstName, grade, mentorComment, submissionUrl } = params

  const html = layout(`
    ${eyebrow('Submission graded')}
    ${heading('Your mentor reviewed your submission.')}
    ${p(`Hi ${firstName},`)}
    ${typeof grade === 'number' ? p(`Grade: <strong>${grade}</strong>.`) : ''}
    ${mentorComment ? p(`Mentor comment: ${mentorComment}`) : ''}
    ${p(`The full review is on your submission page.`, 'margin-bottom:0;')}
    ${button('View submission', submissionUrl)}
    ${divider()}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    typeof grade === 'number' ? `Grade: ${grade}.` : '',
    mentorComment ? `Mentor comment: ${mentorComment}` : '',
    ``,
    `The full review is on your submission page.`,
    ``,
    `View submission: ${submissionUrl}`,
    ``,
    `— STAIJA`,
  ]
    .filter((l) => l !== '')
    .join('\n')

  return { html, text }
}

export function sessionInviteEmail(params: {
  firstName: string
  sessionTitle: string
  startsAt: string // human-readable
  meetingUrl: string
}): { html: string; text: string } {
  const { firstName, sessionTitle, startsAt, meetingUrl } = params

  const html = layout(`
    ${eyebrow('Live session')}
    ${heading(sessionTitle)}
    ${p(`Hi ${firstName},`)}
    ${p(`Your cohort has a live session scheduled for <strong>${startsAt}</strong>.`)}
    ${p(`Use the link below to join — it'll stay the same throughout the cohort if your mentor reuses it.`, 'margin-bottom:0;')}
    ${button('Join session', meetingUrl)}
    ${divider()}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `Your cohort has a live session scheduled: ${sessionTitle}`,
    `Time: ${startsAt}`,
    ``,
    `Join: ${meetingUrl}`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function accountDeletedEmail(params: {
  firstName: string
}): { html: string; text: string } {
  const { firstName } = params

  const html = layout(`
    ${eyebrow('Account deleted')}
    ${heading('Your STAIJA account is gone.')}
    ${p(`Hi ${firstName},`)}
    ${p(`We've removed your STAIJA account and the personal data tied to it — your profile, applications, uploaded files, and any connections you'd made.`)}
    ${p(`Some records have been retained where required: donation receipts (with your name removed) for tax and accounting, and audit logs for compliance. Mentor feedback you wrote about students stays with the program.`)}
    ${p(`If you didn't initiate this deletion, please write to us right away at <a href="mailto:contact@staija.org" style="color:${VIOLET};text-decoration:none;">contact@staija.org</a>.`, 'margin-bottom:0;')}
    ${divider()}
    ${p('— STAIJA', 'margin-top:0;margin-bottom:0;')}
  `)

  const text = [
    `Hi ${firstName},`,
    ``,
    `We've removed your STAIJA account and the personal data tied to it — your profile, applications, uploaded files, and any connections you'd made.`,
    ``,
    `Some records have been retained where required: donation receipts (with your name removed) for tax and accounting, and audit logs for compliance. Mentor feedback you wrote about students stays with the program.`,
    ``,
    `If you didn't initiate this deletion, please write to us right away at contact@staija.org.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function newApplicationStaffNotificationEmail(params: {
  applicantName: string
  applicantEmail: string
  programLabel: string
  applicationId: string
}): { html: string; text: string } {
  const { applicantName, applicantEmail, programLabel, applicationId } = params
  const reviewUrl = `${APP_URL}/admin/applications/${applicationId}`

  const html = layout(`
    ${eyebrow(`${programLabel} · New application`)}
    ${heading(`${applicantName} just applied.`)}
    ${p(`A new ${programLabel} application landed in the queue and is waiting for review.`)}

    <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:${PAPER};border-radius:10px;margin:0 0 32px;width:100%;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-family:${MONO};font-size:10px;font-weight:700;color:${MUTED};letter-spacing:0.1em;">APPLICANT</p>
          <p style="margin:4px 0 12px;font-family:${SANS};font-size:14px;color:${INK};font-weight:600;">${applicantName} &nbsp;·&nbsp; <a href="mailto:${applicantEmail}" style="color:${INK};text-decoration:none;font-weight:500;">${applicantEmail}</a></p>
          <p style="margin:0;font-family:${MONO};font-size:10px;font-weight:700;color:${MUTED};letter-spacing:0.1em;">APPLICATION ID</p>
          <p style="margin:4px 0 0;font-family:${MONO};font-size:13px;color:${INK};font-weight:600;">${applicationId}</p>
        </td>
      </tr>
    </table>

    ${button('Open in admin', reviewUrl)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `)

  const text = [
    `New application: ${applicantName} — ${programLabel}`,
    ``,
    `Applicant: ${applicantName} <${applicantEmail}>`,
    `Application ID: ${applicationId}`,
    ``,
    `Open in admin: ${reviewUrl}`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

export function referenceReminderEmail(params: {
  refName: string
  applicantName: string
  programLabel: string
  relationship: string
  institution: string
  uploadUrl: string
}): { html: string; text: string } {
  const { refName, applicantName, programLabel, relationship, institution, uploadUrl } = params
  const relationshipPhrase = relationship ? `their ${relationship}` : 'a reference'
  const institutionPhrase = institution ? ` at ${institution}` : ''

  const html = layout(`
    ${eyebrow(`${programLabel} · Reminder`)}
    ${heading(`${applicantName} is still waiting on your reference.`)}
    ${p(`Hi ${refName},`)}
    ${p(`A couple of weeks ago we wrote to let you know that ${applicantName} listed you as ${relationshipPhrase}${institutionPhrase} for their ${programLabel} application. We haven't seen your letter come in yet.`)}
    ${p(`If you're still planning to write one, here's the upload link again. Same as before — personal to you, no required format.`, 'margin-bottom:0;')}
    ${button('Upload your letter', uploadUrl, { bg: SKY, fg: INK })}
    ${divider()}
    ${p(`If you'd rather not write the letter, no need to reply — we'll stop reminding after this. Or write back to <a href="mailto:contact@staija.org" style="color:${SKY_DEEP};text-decoration:none;">contact@staija.org</a> and we'll let ${applicantName} know.`, `font-size:13px;color:${MUTED};margin-bottom:0;`)}
    ${p('— STAIJA', 'margin-top:24px;margin-bottom:0;')}
  `, { masthead: 'sky' })

  const text = [
    `Hi ${refName},`,
    ``,
    `A couple of weeks ago we wrote to let you know that ${applicantName} listed you as ${relationshipPhrase}${institutionPhrase} for their ${programLabel} application. We haven't seen your letter come in yet.`,
    ``,
    `If you're still planning to write one, here's the upload link again — same as before, personal to you:`,
    uploadUrl,
    ``,
    `If you'd rather not, no need to reply — we'll stop reminding after this. Or write back to contact@staija.org and we'll let ${applicantName} know.`,
    ``,
    `— STAIJA`,
  ].join('\n')

  return { html, text }
}

// Newsletter campaign templates (nextCycleOpenedEmail, mentorIntroEmail,
// notifyMeWelcomeEmail) live in newsletterTemplates.ts. They share the
// layout primitives exported from this file but stay in their own
// module — different cadence, different deliverability profile, and
// keeps this file from sliding past 1500 lines.
