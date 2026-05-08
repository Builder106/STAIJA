/**
 * Pure mapping from application status → applicant-facing email
 * payload. Extracted out of email.ts so it can be unit-tested without
 * standing up firebase-functions imports.
 *
 * Both the `onApplicationStatusChange` Firestore trigger and the
 * `retryApplicationEmail` callable derive their content through this
 * function, so retries always send the *same* email shape as the
 * original — drift between them would mean the retry path differs
 * silently from the natural-trigger path.
 */

import {
  applicationReceivedEmail,
  applicationAcceptedEmail,
  applicationRejectedEmail,
} from './emailTemplates'

export type ApplicantStatus = 'submitted' | 'accepted' | 'rejected'

export interface ApplicationDoc {
  userId?: string
  program?: 'stepup_scholars' | 'dynamerge'
  status?: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  personalInfo?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  submittedAt?: { toDate?: () => Date } | string | null
  lastEmailFailure?: {
    kind: ApplicantStatus
    to: string
    attemptedAt: { toDate?: () => Date } | string | null
    error: string
  } | null
}

export interface BuiltEmail {
  subject: string
  html: string
  text: string
}

/**
 * Returns the applicant-facing email payload for a given status.
 * Returns null for statuses we don't email on (`draft`, `under_review`).
 */
export function buildApplicantEmail(
  after: ApplicationDoc,
  applicationId: string,
): { kind: ApplicantStatus; email: BuiltEmail } | null {
  const status = after.status
  const programLabel = labelForProgram(after.program)
  const firstName = after.personalInfo?.firstName ?? 'there'
  const tplParams = { firstName, programLabel, applicationId }

  if (status === 'submitted') {
    const c = applicationReceivedEmail(tplParams)
    return {
      kind: 'submitted',
      email: { subject: `Your ${programLabel} application is in`, html: c.html, text: c.text },
    }
  }
  if (status === 'accepted') {
    const c = applicationAcceptedEmail(tplParams)
    return {
      kind: 'accepted',
      email: { subject: `You've been accepted to ${programLabel}`, html: c.html, text: c.text },
    }
  }
  if (status === 'rejected') {
    const c = applicationRejectedEmail(tplParams)
    return {
      kind: 'rejected',
      email: {
        subject: `An update on your ${programLabel} application`,
        html: c.html,
        text: c.text,
      },
    }
  }
  return null
}

export function labelForProgram(p?: ApplicationDoc['program']): string {
  if (p === 'stepup_scholars') return 'StepUp Scholars'
  if (p === 'dynamerge') return 'Dynamerge'
  return 'STAIJA'
}
