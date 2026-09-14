// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { allSteps, course, stepKey } from './course'
import { checkStep, runStep } from './runner'
import { stubSvgGeometry } from '../examples/live-demos/test-support'

// happy-dom has no SVG geometry; drawSVG needs a stroke length.
stubSvgGeometry()

/**
 * The course's quality gate: every step's solution passes all of its checks, and
 * no step is already solved by its starter code.
 */
const scheduler = { request: () => 1, cancel: () => {} }

describe('course structure', () => {
  it('has unique ids and at least one check per step', () => {
    const keys = allSteps.map(stepKey)
    expect(new Set(keys).size).toBe(keys.length)
    expect(course.length).toBeGreaterThan(0)
    for (const { step } of allSteps) expect(step.checks.length, step.id).toBeGreaterThan(0)
  })
})

describe('every step', () => {
  for (const location of allSteps) {
    const key = stepKey(location)

    it(`${key}: the solution passes every check`, () => {
      const root = document.createElement('div')
      const run = runStep(location.step, location.step.solution, root, { scheduler })
      const failed = checkStep(location.step, run).filter((result) => !result.passed)
      run.destroy()
      expect(failed.map((result) => `${result.label}: ${result.message}`)).toEqual([])
    })

    it(`${key}: the solution runs without warnings`, async () => {
      const root = document.createElement('div')
      const run = runStep(location.step, location.step.solution, root, { scheduler })
      // Scroll triggers are created a microtask after the code runs, and may warn then.
      await Promise.resolve()
      await Promise.resolve()
      run.destroy()
      expect(run.warnings).toEqual([])
    })

    it(`${key}: the starter does not already pass`, () => {
      const root = document.createElement('div')
      const run = runStep(location.step, location.step.starter, root, { scheduler })
      const results = checkStep(location.step, run)
      run.destroy()
      expect(results.some((result) => !result.passed)).toBe(true)
    })
  }
})
