import { describe, it, expect } from 'vitest'
import { slugify, normalizeSlug } from '../../src/services/lmsContent'

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('HELLO World')).toBe('hello-world')
  })

  it('collapses non-alphanumerics into single hyphens', () => {
    expect(slugify('foo!!!bar???baz')).toBe('foo-bar-baz')
  })

  it('strips diacritics', () => {
    expect(slugify('Yorùbá greeting')).toBe('yoruba-greeting')
    expect(slugify('café')).toBe('cafe')
    expect(slugify('Müller')).toBe('muller')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('---hello---')).toBe('hello')
    expect(slugify(' . hello . ')).toBe('hello')
  })

  it('returns empty string for non-alphanumeric input', () => {
    expect(slugify('!!!')).toBe('')
    expect(slugify('')).toBe('')
  })

  it('keeps numbers', () => {
    expect(slugify('Term 2026 Spring')).toBe('term-2026-spring')
  })
})

describe('normalizeSlug', () => {
  // Same rules as slugify, but additionally tolerates null/undefined so
  // the chokepoint in shapeFields() can call it without preflight checks.

  it('returns empty string for null/undefined/empty', () => {
    expect(normalizeSlug(null)).toBe('')
    expect(normalizeSlug(undefined)).toBe('')
    expect(normalizeSlug('')).toBe('')
  })

  it('lowercases an already-clean slug unchanged', () => {
    expect(normalizeSlug('foundations-of-statistics')).toBe('foundations-of-statistics')
  })

  it('coerces uppercase to lowercase', () => {
    expect(normalizeSlug('Foundations-of-Statistics')).toBe('foundations-of-statistics')
    expect(normalizeSlug('STEPUP-FOUNDATIONS')).toBe('stepup-foundations')
  })

  it('strips spaces and special chars from editor-typed input', () => {
    expect(normalizeSlug('Hello World!')).toBe('hello-world')
    expect(normalizeSlug('foo / bar / baz')).toBe('foo-bar-baz')
  })

  it('contract: never produces uppercase output', () => {
    // The point of normalizeSlug is the chokepoint guarantee. Sample
    // adversarial inputs to confirm.
    const inputs = [
      'ABC',
      'a B c',
      'StepUp Scholars',
      '___FOO___',
      'Course-2026-SPRING',
      'YORÙBÁ',
    ]
    for (const input of inputs) {
      const out = normalizeSlug(input)
      expect(out).toBe(out.toLowerCase())
    }
  })
})
