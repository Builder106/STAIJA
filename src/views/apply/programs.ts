/**
 * Per-program application schemas.
 *
 * The wizard at `/apply/:program` reads from this config to render
 * program-specific fields. Adding a third program is a matter of adding
 * one entry here — no template changes.
 *
 * Skeleton (shared across programs):
 *   1. Eligibility quick-check
 *   2. Personal info
 *   3. Academic info
 *   4. Motivation + experience + references
 *   5. Files + review
 *
 * Each program can override per-step fields and copy. Required-ness is
 * enforced both client-side (UI) and server-side (Cloud Function).
 */

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'url' | 'textarea' | 'select' | 'checkbox' | 'tags' | 'number'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  helpText?: string
  options?: string[] // for select
  rows?: number // for textarea
  pattern?: string // regex for text/email
  /** Min / max for tags type — number of tags allowed. */
  minTags?: number
  maxTags?: number
}

export interface StepDef {
  id: string
  label: string
  description?: string
  fields: FieldDef[]
}

export interface ProgramSchema {
  slug: 'stepup-scholars' | 'dynamerge'
  name: string
  ageRange: string
  scope: string
  /** Used in confirmation emails + receipts. */
  programKey: 'stepup_scholars' | 'dynamerge'
  /** Eligibility checkboxes that gate "Continue". */
  eligibility: { id: string; label: string; required: boolean }[]
  steps: StepDef[]
  /** How many references the program asks for. */
  referenceCount: { min: number; max: number }
}

const personalInfoStep = (extras: FieldDef[] = []): StepDef => ({
  id: 'personal',
  label: 'Personal',
  description: 'Tell us who you are.',
  fields: [
    { name: 'firstName', label: 'First name', type: 'text', required: true },
    { name: 'lastName', label: 'Last name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true, helpText: 'We use this for application updates.' },
    { name: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '+234…' },
    { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
    { name: 'nationality', label: 'Nationality', type: 'text', required: true },
    ...extras,
  ],
})

const academicInfoStep: StepDef = {
  id: 'academic',
  label: 'Academic',
  description: 'Your school and what you study.',
  fields: [
    { name: 'currentInstitution', label: 'Current school / institution', type: 'text', required: true },
    { name: 'currentLevel', label: 'Year / level', type: 'text', required: true, placeholder: 'SS3, gap year, undergrad year 1, etc.' },
    { name: 'major', label: 'Major / area of focus', type: 'text', required: false },
    { name: 'gpa', label: 'GPA / class', type: 'text', required: false, helpText: 'Use whatever scale your school uses.' },
    { name: 'graduationYear', label: 'Expected graduation year', type: 'number', required: false },
    { name: 'relevantCourses', label: 'Relevant courses', type: 'tags', helpText: 'Comma-separated. Up to 8.', maxTags: 8 },
  ],
}

const motivationStep = (researchHelp: string): StepDef => ({
  id: 'motivation',
  label: 'You',
  description: 'Help us understand what you want to do and why.',
  fields: [
    {
      name: 'researchInterests',
      label: 'Research interests',
      type: 'tags',
      required: true,
      minTags: 1,
      maxTags: 6,
      helpText: researchHelp,
    },
    {
      name: 'motivation',
      label: 'Why this program?',
      type: 'textarea',
      required: true,
      rows: 6,
      helpText: '300–500 words. What do you want to learn, and what would you do with it?',
    },
    {
      name: 'experience',
      label: 'Relevant experience',
      type: 'textarea',
      required: true,
      rows: 5,
      helpText: 'Projects, classes, science fairs, hackathons — anything that shows you can do the work.',
    },
  ],
})

export const PROGRAMS: Record<string, ProgramSchema> = {
  'stepup-scholars': {
    slug: 'stepup-scholars',
    name: 'StepUp Scholars',
    ageRange: 'Ages 15–19',
    scope: 'Nigeria · in-person · 6 months',
    programKey: 'stepup_scholars',
    eligibility: [
      { id: 'age', label: 'I am between 15 and 19 years old.', required: true },
      { id: 'nigeria', label: 'I live in Nigeria and can attend in person.', required: true },
      { id: 'school', label: 'I am currently enrolled in secondary school or on a gap year.', required: true },
      { id: 'commit', label: 'I can commit ~10 hours per week for 6 months.', required: true },
    ],
    steps: [
      personalInfoStep([
        {
          name: 'state',
          label: 'State (Nigeria)',
          type: 'select',
          required: true,
          options: [
            'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
            'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
            'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
            'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
            'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
          ],
        },
      ]),
      academicInfoStep,
      motivationStep('What scientific questions excite you? E.g. "soil microbiomes", "low-cost diagnostics".'),
    ],
    referenceCount: { min: 2, max: 3 },
  },

  'dynamerge': {
    slug: 'dynamerge',
    name: 'Dynamerge',
    ageRange: 'Ages 15–20',
    scope: 'Pan-African · virtual · 4 weeks',
    programKey: 'dynamerge',
    eligibility: [
      { id: 'age', label: 'I am between 15 and 20 years old.', required: true },
      { id: 'african', label: 'I am a resident of an African country.', required: true },
      { id: 'internet', label: 'I have reliable internet access (data stipends available based on need).', required: false },
      { id: 'commit', label: 'I can commit ~15 hours per week for 4 weeks.', required: true },
    ],
    steps: [
      personalInfoStep([
        {
          name: 'country',
          label: 'Country of residence',
          type: 'text',
          required: true,
          placeholder: 'Nigeria, Kenya, Ghana, …',
        },
        {
          name: 'timezone',
          label: 'Timezone',
          type: 'text',
          required: true,
          placeholder: 'WAT (UTC+1), EAT (UTC+3), …',
          helpText: 'So we can schedule live sessions you can actually attend.',
        },
        {
          name: 'internetSelfReport',
          label: 'How would you describe your internet?',
          type: 'select',
          required: true,
          options: [
            'Stable broadband / fiber',
            'Reliable 4G or LTE',
            'Patchy 4G / mobile hotspot',
            '3G / data-constrained',
          ],
        },
      ]),
      academicInfoStep,
      motivationStep('Pick technical areas you want to dive into. E.g. "machine learning", "biotech", "clean energy".'),
    ],
    referenceCount: { min: 1, max: 2 },
  },
}

export function getProgram(slug: string): ProgramSchema | null {
  return PROGRAMS[slug] ?? null
}
