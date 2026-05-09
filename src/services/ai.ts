/**
 * Thin wrappers around AI-backed Cloud Functions.
 */

import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase.ts'

export interface OutlineCoursePayload {
  topic: string
  program: 'stepup_scholars' | 'dynamerge'
  weeks: number
  lessonsPerModule?: number
  audience?: string
  version?: string
  env?: string
}

export interface OutlineCourseResult {
  courseId: string
  title: string
  moduleCount: number
  lessonCount: number
  assignmentCount: number
}

export const outlineCourse = (data: OutlineCoursePayload) =>
  httpsCallable<OutlineCoursePayload, OutlineCourseResult>(functions, 'outlineCourse')(data).then(
    (r) => r.data,
  )
