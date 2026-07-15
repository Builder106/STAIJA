#!/usr/bin/env node
/**
 * Renders every email template to HTML files and opens them in the
 * default browser. Run after `npm run build`:
 *
 *   npm run preview-emails
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Inline hosted images as base64 data URIs so they render from file:// in
// the browser — and so previews stay accurate for assets (like the Uli
// divider) that haven't shipped to staija.org yet. The production
// templates keep the hosted URLs; this substitution is preview-only.
const LOCAL_ASSETS = {
  'https://staija.org/staija-64.png': path.join(__dirname, '..', 'public', 'staija-64.png'),
  'https://staija.org/email/uli-divider-v1.png': path.join(__dirname, '..', 'public', 'email', 'uli-divider-v1.png'),
  'https://staija.org/email/masthead-violet-v1.png': path.join(__dirname, '..', 'public', 'email', 'masthead-violet-v1.png'),
  'https://staija.org/email/masthead-sky-v1.png': path.join(__dirname, '..', 'public', 'email', 'masthead-sky-v1.png'),
  'https://staija.org/email/masthead-gold-v1.png': path.join(__dirname, '..', 'public', 'email', 'masthead-gold-v1.png'),
}

function injectLocalAssets(html) {
  for (const [url, filePath] of Object.entries(LOCAL_ASSETS)) {
    const b64 = fs.readFileSync(filePath).toString('base64')
    html = html.replaceAll(`src="${url}"`, `src="data:image/png;base64,${b64}"`)
  }
  return html
}

const {
  applicationReceivedEmail,
  applicationAcceptedEmail,
  applicationRejectedEmail,
  referenceInviteEmail,
  referenceLetterReceivedEmail,
  welcomeEmail,
  newApplicationStaffNotificationEmail,
  referenceReminderEmail,
} = require('./lib/emailTemplates')

const outDir = path.join(__dirname, 'email-previews')
fs.mkdirSync(outDir, { recursive: true })

const templates = [
  {
    file: '1-application-received.html',
    label: 'Application received',
    content: applicationReceivedEmail({
      firstName: 'Amara',
      programLabel: 'StepUp Scholars',
      applicationId: 'app-abc123xyz',
    }).html,
  },
  {
    file: '2-application-accepted.html',
    label: 'Application accepted',
    content: applicationAcceptedEmail({
      firstName: 'Amara',
      programLabel: 'StepUp Scholars',
      applicationId: 'app-abc123xyz',
    }).html,
  },
  {
    file: '3-application-rejected.html',
    label: 'Application rejected',
    content: applicationRejectedEmail({
      firstName: 'Amara',
      programLabel: 'Dynamerge',
      applicationId: 'app-def456uvw',
    }).html,
  },
  {
    file: '4-reference-invite.html',
    label: 'Reference invite',
    content: referenceInviteEmail({
      refName: 'Dr. Okafor',
      applicantName: 'Amara Nwosu',
      programLabel: 'StepUp Scholars',
      relationship: 'supervisor',
      institution: 'University of Lagos',
      uploadUrl: 'https://staija.org/refs/eyJhcHBsaWNhdGlvbklkIjoiYXBwLWFiYzEyM3h5eiIsInJlZkluZGV4IjowfQ.abc123',
    }).html,
  },
  {
    file: '5-letter-received.html',
    label: 'Reference letter received',
    content: referenceLetterReceivedEmail({
      firstName: 'Amara',
      refName: 'Dr. Okafor',
      programLabel: 'StepUp Scholars',
      applicationId: 'app-abc123xyz',
    }).html,
  },
  {
    file: '6-welcome.html',
    label: 'Welcome',
    content: welcomeEmail({
      firstName: 'Amara',
    }).html,
  },
  {
    file: '7-staff-notification.html',
    label: 'Staff: new application',
    content: newApplicationStaffNotificationEmail({
      applicantName: 'Amara Nwosu',
      applicantEmail: 'amara@example.com',
      programLabel: 'StepUp Scholars',
      applicationId: 'app-abc123xyz',
    }).html,
  },
  {
    file: '8-reference-reminder.html',
    label: 'Reference reminder (14-day)',
    content: referenceReminderEmail({
      refName: 'Dr. Okafor',
      applicantName: 'Amara Nwosu',
      programLabel: 'StepUp Scholars',
      relationship: 'supervisor',
      institution: 'University of Lagos',
      uploadUrl: 'https://staija.org/refs/eyJhcHBsaWNhdGlvbklkIjoiYXBwLWFiYzEyM3h5eiIsInJlZkluZGV4IjowfQ.def456',
    }).html,
  },
]

for (const tpl of templates) {
  const filePath = path.join(outDir, tpl.file)
  fs.writeFileSync(filePath, injectLocalAssets(tpl.content), 'utf8')
  console.log(`  ✓ ${tpl.label} → email-previews/${tpl.file}`)
  try {
    execSync(`open "${filePath}"`)
  } catch {
    // non-macOS or no default browser — paths are printed above
  }
}

console.log(`\nAll previews written to functions/email-previews/`)
