import { describe, it, expect } from 'vitest'
import {
  buildApplicantEmail,
  labelForProgram,
  type ApplicationDoc,
} from '../../functions/src/applicantEmail'

// These tests live under the root tests/ tree (not functions/tests/)
// because the functions package doesn't have its own vitest setup.
// Because applicantEmail.ts deliberately has no firebase-functions
// imports, it loads cleanly under the root test environment.

const baseDoc: ApplicationDoc = {
  userId: 'user-1',
  program: 'stepup_scholars',
  personalInfo: {
    firstName: 'Amina',
    lastName: 'Yusuf',
    email: 'amina@example.com',
  },
}

describe('labelForProgram', () => {
  it('maps stepup_scholars to "StepUp Scholars"', () => {
    expect(labelForProgram('stepup_scholars')).toBe('StepUp Scholars')
  })

  it('maps dynamerge to "Dynamerge"', () => {
    expect(labelForProgram('dynamerge')).toBe('Dynamerge')
  })

  it('falls back to "STAIJA" for missing or unknown values', () => {
    expect(labelForProgram(undefined)).toBe('STAIJA')
    // @ts-expect-error — testing the runtime fallback for unknown program
    expect(labelForProgram('martian_mathletes')).toBe('STAIJA')
  })
})

describe('buildApplicantEmail', () => {
  it('returns null for draft status', () => {
    expect(buildApplicantEmail({ ...baseDoc, status: 'draft' }, 'app-1')).toBe(null)
  })

  it('returns null for under_review status', () => {
    expect(buildApplicantEmail({ ...baseDoc, status: 'under_review' }, 'app-1')).toBe(null)
  })

  it('returns null when status is missing entirely', () => {
    expect(buildApplicantEmail({ ...baseDoc, status: undefined }, 'app-1')).toBe(null)
  })

  it('builds a "submitted" email with the right subject + program label', () => {
    const built = buildApplicantEmail({ ...baseDoc, status: 'submitted' }, 'app-1')
    expect(built).not.toBe(null)
    expect(built!.kind).toBe('submitted')
    expect(built!.email.subject).toBe('Your StepUp Scholars application is in')
    expect(built!.email.html).toBeTruthy()
    expect(built!.email.text).toBeTruthy()
  })

  it('builds an "accepted" email', () => {
    const built = buildApplicantEmail({ ...baseDoc, status: 'accepted' }, 'app-1')
    expect(built!.kind).toBe('accepted')
    expect(built!.email.subject).toBe("You've been accepted to StepUp Scholars")
  })

  it('builds a "rejected" email with neutral copy in the subject', () => {
    const built = buildApplicantEmail({ ...baseDoc, status: 'rejected' }, 'app-1')
    expect(built!.kind).toBe('rejected')
    // PRD §17 M4: rejection email is intentionally neutral ("update")
    // — staff handle the actual rejection wording manually.
    expect(built!.email.subject).toBe('An update on your StepUp Scholars application')
  })

  it('uses the right program label for Dynamerge applicants', () => {
    const built = buildApplicantEmail(
      { ...baseDoc, program: 'dynamerge', status: 'submitted' },
      'app-1',
    )
    expect(built!.email.subject).toBe('Your Dynamerge application is in')
  })

  it('falls back to "there" when first name is missing', () => {
    // The template uses firstName for the greeting. Missing names
    // shouldn't produce "Hi, undefined" — the function defaults.
    const built = buildApplicantEmail(
      { ...baseDoc, status: 'submitted', personalInfo: { email: 'a@b.com' } },
      'app-1',
    )
    expect(built).not.toBe(null)
    // We can't assert the greeting verbatim without coupling to the
    // template, but we can confirm the email rendered (no error,
    // valid HTML+text payload).
    expect(built!.email.html).toBeTruthy()
    expect(built!.email.text).toBeTruthy()
  })

  it('returns matching kind in the result envelope', () => {
    const submitted = buildApplicantEmail({ ...baseDoc, status: 'submitted' }, 'app-1')
    const accepted = buildApplicantEmail({ ...baseDoc, status: 'accepted' }, 'app-1')
    const rejected = buildApplicantEmail({ ...baseDoc, status: 'rejected' }, 'app-1')
    expect(submitted!.kind).toBe('submitted')
    expect(accepted!.kind).toBe('accepted')
    expect(rejected!.kind).toBe('rejected')
  })

  it('produces different content per status (sanity — no shared template)', () => {
    const submitted = buildApplicantEmail({ ...baseDoc, status: 'submitted' }, 'app-1')!
    const accepted = buildApplicantEmail({ ...baseDoc, status: 'accepted' }, 'app-1')!
    const rejected = buildApplicantEmail({ ...baseDoc, status: 'rejected' }, 'app-1')!
    expect(submitted.email.subject).not.toBe(accepted.email.subject)
    expect(submitted.email.subject).not.toBe(rejected.email.subject)
    expect(submitted.email.html).not.toBe(accepted.email.html)
    expect(accepted.email.html).not.toBe(rejected.email.html)
  })
})
