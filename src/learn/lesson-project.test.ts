// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { course } from './course'
import { runStep } from './runner'
import { lessonSample } from './lesson-project'
import type { Module } from './types'

const scheduler = { request: () => 1, cancel: () => {} }

/** Run a module's last step solution and build its studio sample. */
function sampleForLastStep(module: Module) {
  const lesson = module.lessons[module.lessons.length - 1]
  const step = lesson.steps[lesson.steps.length - 1]
  const root = document.createElement('div')
  const run = runStep(step, step.solution, root, { scheduler })
  const names = [...root.querySelectorAll('[data-tinyfly]')].map((element) => element.getAttribute('data-tinyfly')!)
  const sample = lessonSample(step.title, run.context.definitions, names)
  run.destroy()
  return sample
}

const moduleById = (id: string) => course.find((module) => module.id === id)!

describe('lessonSample', () => {
  it('turns JSON played with play() into boxes and tracks', () => {
    const sample = sampleForLastStep(moduleById('foundations'))
    expect(sample).toBeDefined()
    expect(sample!.elements.map((element) => element.name)).toEqual(['box'])
    expect(sample!.tracks.length).toBeGreaterThan(0)
    expect(sample!.tracks.every((track) => track.target === 'box' && !('id' in track))).toBe(true)
  })

  it('offers nothing for live code, whose targets are selectors', () => {
    expect(sampleForLastStep(moduleById('capstone'))).toBeUndefined()
  })

  it('offers nothing when a track targets an element the markup lacks', () => {
    const definition = { id: 't', config: { duration: 1000 }, tracks: [{ id: 'a', target: 'ghost', property: 'x', keyframes: [{ time: 0, value: 0 }] }] }
    expect(lessonSample('Ghost', [definition], ['box'])).toBeUndefined()
  })
})
