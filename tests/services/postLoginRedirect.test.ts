import { describe, it, expect } from 'vitest'
import { postLoginRouteName } from '../../src/services/postLoginRedirect'
import type { UserRole } from '../../src/services/types'

describe('postLoginRouteName', () => {
  it('returns home for null', () => {
    expect(postLoginRouteName(null)).toBe('home')
  })

  it('returns home for undefined', () => {
    expect(postLoginRouteName(undefined)).toBe('home')
  })

  it('routes admin to admin', () => {
    expect(postLoginRouteName('admin')).toBe('admin')
  })

  it('routes staff to admin', () => {
    expect(postLoginRouteName('staff')).toBe('admin')
  })

  it('routes student to student-dashboard', () => {
    expect(postLoginRouteName('student')).toBe('student-dashboard')
  })

  it('routes alumni to alumni-home', () => {
    expect(postLoginRouteName('alumni')).toBe('alumni-home')
  })

  it('routes mentor to mentor-dashboard', () => {
    expect(postLoginRouteName('mentor')).toBe('mentor-dashboard')
  })

  it('routes applicant to applicant-dashboard', () => {
    expect(postLoginRouteName('applicant')).toBe('applicant-dashboard')
  })

  it('covers every UserRole without falling through to home', () => {
    const roles: UserRole[] = ['admin', 'staff', 'student', 'alumni', 'mentor', 'applicant']
    for (const role of roles) {
      expect(postLoginRouteName(role)).not.toBe('home')
    }
  })
})
