import { describe, it, expect } from 'vitest'
import { createCanvas } from '@napi-rs/canvas'
import { createSceneStore, type ChartElement } from '../stores/scene-store'
import { chartElementProblem, chartElementProps, chartElementSurface, chartElementTarget, isChartField, paintChartCanvas } from './chart-element'
import { sceneElementToCanvasTarget } from './scene-to-canvas'
import type { AnimationState } from '../../engine/types'

function aChart(overrides: Partial<ChartElement> = {}): ChartElement {
  const store = createSceneStore()
  store.addElement('chart', { x: 30, y: 20, width: 400, height: 260, ...overrides })
  return store.elements()[0] as ChartElement
}

describe('chart elements', () => {
  it('are named Chart, start as a bar chart of four quarters, and are custom targets whose props are the chart’s values', () => {
    const element = aChart()
    expect(element.name).toBe('Chart 1')
    expect(element.chartKind).toBe('bar')
    expect(chartElementProblem(element)).toBeNull()
    const target = chartElementTarget(element)
    expect([target.type, target.x, target.y, target.width, target.height]).toEqual(['custom', 30, 20, 400, 260])
    expect(target.props).toHaveProperty('bar.q1.value', 45)
    expect(sceneElementToCanvasTarget(element)?.type).toBe('custom')
    expect(isChartField('slice.a.pull')).toBe(true)
    expect(isChartField('opacity')).toBe(false)
  })

  it('take animated values by name or id, paint, and name bad data instead of throwing', () => {
    const element = aChart({ chartKind: 'donut' })
    const state: AnimationState = { values: new Map([[element.name, new Map<string, number>([['slice.q2.pull', 1], ['x', 40]])]]), currentTime: 0, playbackState: 'paused', direction: 'forward', loopIteration: 0 }
    const props = chartElementProps(element, state)
    expect(props['slice.q2.pull']).toBe(1)
    expect(props).not.toHaveProperty('x')
    const canvas = createCanvas(10, 10) as unknown as HTMLCanvasElement
    expect(() => paintChartCanvas(canvas, element, props, 0, 1)).not.toThrow()
    expect(canvas.width).toBe(400)
    const broken = aChart({ data: [{ id: 'a', value: 1 }, { id: 'a', value: 2 }] })
    expect(chartElementProblem(broken)).toMatch(/two data are called "a"/)
    expect(sceneElementToCanvasTarget(broken)).toBeNull()
    expect(() => paintChartCanvas(canvas, broken, {}, 0, 1)).not.toThrow()
  })

  it('are surfaces in the scene: their bars are places in scene px', () => {
    const element = aChart()
    const bar = chartElementSurface(element).anchor('bar:q2')
    expect(bar.left).toBeGreaterThan(30)
    expect(bar.bottom).toBeLessThan(20 + element.height)
    expect(bar.top).toBeGreaterThan(20)
  })
})
