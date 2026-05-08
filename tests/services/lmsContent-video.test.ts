import { describe, it, expect } from 'vitest'
import { detectVideoProvider } from '../../src/services/lmsContent'

describe('detectVideoProvider', () => {
  it('returns null for empty / whitespace / nullish input', () => {
    expect(detectVideoProvider('')).toBe(null)
    expect(detectVideoProvider('   ')).toBe(null)
    expect(detectVideoProvider(null)).toBe(null)
    expect(detectVideoProvider(undefined)).toBe(null)
  })

  it('detects YouTube watch-page URLs', () => {
    expect(detectVideoProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube')
    expect(detectVideoProvider('https://youtube.com/watch?v=abc')).toBe('youtube')
    expect(detectVideoProvider('https://m.youtube.com/watch?v=abc')).toBe('youtube')
  })

  it('detects youtu.be short-share URLs', () => {
    expect(detectVideoProvider('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
  })

  it('detects Vimeo URLs', () => {
    expect(detectVideoProvider('https://vimeo.com/123456789')).toBe('vimeo')
    expect(detectVideoProvider('https://player.vimeo.com/video/123')).toBe('vimeo')
  })

  it('classifies other valid URLs as "other"', () => {
    expect(detectVideoProvider('https://example.com/video.mp4')).toBe('other')
    expect(detectVideoProvider('https://example.org/embed/123')).toBe('other')
  })

  it('classifies non-URL input as "invalid"', () => {
    expect(detectVideoProvider('not a url')).toBe('invalid')
    expect(detectVideoProvider('youtube.com/watch?v=abc')).toBe('invalid') // missing scheme
    expect(detectVideoProvider('???')).toBe('invalid')
  })

  it('trims surrounding whitespace before parsing', () => {
    expect(detectVideoProvider('  https://youtu.be/abc  ')).toBe('youtube')
  })

  it("doesn't crash on edge-case URL shapes", () => {
    // Even malformed-but-parseable URLs shouldn't throw — they should
    // route through the catch branch and return 'invalid'.
    expect(() => detectVideoProvider('http://')).not.toThrow()
    expect(() => detectVideoProvider('//')).not.toThrow()
  })
})
