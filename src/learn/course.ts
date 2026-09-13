import type { Lesson, Module, Step } from './types'
import { gsapApiModule } from './modules/gsap-api'

/** The course, in order. Modules are added here as they are written (see todo.md, Phase 29). */
export const course: Module[] = [gsapApiModule]

export interface StepLocation {
  module: Module
  lesson: Lesson
  step: Step
  /** Position in the whole course, for next/previous */
  index: number
}

/** Every step in course order. */
export const allSteps: StepLocation[] = course.flatMap((module) =>
  module.lessons.flatMap((lesson) => lesson.steps.map((step) => ({ module, lesson, step })))
).map((location, index) => ({ ...location, index }))

export const stepKey = (location: Pick<StepLocation, 'module' | 'lesson' | 'step'>) =>
  `${location.module.id}/${location.lesson.id}/${location.step.id}`

export function findStep(moduleId?: string, lessonId?: string, stepId?: string): StepLocation | undefined {
  return allSteps.find(
    (location) =>
      location.module.id === moduleId &&
      location.lesson.id === lessonId &&
      (stepId === undefined || location.step.id === stepId)
  )
}
