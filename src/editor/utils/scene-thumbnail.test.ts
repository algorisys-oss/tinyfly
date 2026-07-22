// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { renderSceneThumbnail } from './scene-thumbnail'
import type { SceneElement } from '../stores/scene-store'

const CANVAS = { width: 300, height: 200, background: '#101010' }

function rect(overrides: Partial<SceneElement> = {}): SceneElement {
  return {
    id: 'r1',
    type: 'rect',
    name: 'box',
    x: 10,
    y: 10,
    width: 80,
    height: 40,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    fill: '#ff0000',
    ...overrides,
  } as SceneElement
}

describe('renderSceneThumbnail', () => {
  it('returns null for an empty scene', async () => {
    expect(await renderSceneThumbnail([], CANVAS)).toBeNull()
  })

  it('returns null when every element is hidden or a group', async () => {
    const hidden = rect({ visible: false })
    const group = rect({ type: 'group' } as Partial<SceneElement>)
    expect(await renderSceneThumbnail([hidden, group], CANVAS)).toBeNull()
  })

  it('returns null for a zero-sized canvas', async () => {
    expect(await renderSceneThumbnail([rect()], { ...CANVAS, width: 0, height: 0 })).toBeNull()
  })

  it('degrades gracefully without a 2D context (no throw)', async () => {
    // happy-dom's canvas has no 2D rendering context, so this exercises the
    // graceful-null path rather than a real render.
    const result = await renderSceneThumbnail([rect()], CANVAS)
    expect(result === null || typeof result === 'string').toBe(true)
  })
})
