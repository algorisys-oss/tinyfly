// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import * as characters from '../../characters'
import * as engine from '../../engine'
import type { LiveApi } from '../../compat/gsap'
import { html, run } from './flowing-hair'
import { extractCode } from './index'

vi.mock('../../characters', async importOriginal => ({
  ...await importOriginal<typeof characters>(),
  drawCharacterHead: vi.fn(),
}))

describe('flowing hair controls', () => {
  it.each(['demo', 'standalone'])('applies selected faces, hair and motion in the %s', mode => {
    const root = document.createElement('div')
    root.innerHTML = html
    const ctx = { fillRect: vi.fn(), beginPath: vi.fn(), roundRect: vi.fn(), fill: vi.fn(), stroke: vi.fn(), fillText: vi.fn() }
    vi.spyOn(root.querySelector('canvas')!, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    const kill = vi.fn()
    const live = { to: vi.fn((_clock: { time: number }) => ({ kill })), ticker: { add: vi.fn((_draw: () => void) => {}), remove: vi.fn((_draw: () => void) => {}) } }
    const cleanup = mode === 'demo'
      ? run(live as unknown as LiveApi, root)
      : new Function('tinyfly', 'live', 'root', `${extractCode(run.toString())}\nreturn () => { animation.kill(); live.ticker.remove(draw); controls.forEach(([node, event]) => node.removeEventListener(event, update)) }`)(
        { ...characters, ...engine }, live, root,
      )
    const draw = live.ticker.add.mock.calls[0][0] as () => void
    const clock = (live.to.mock.calls[0] as unknown as [{ time: number }])[0]
    const rendered = vi.mocked(characters.drawCharacterHead)
    const face = root.querySelector<HTMLSelectElement>('.fh-face')!
    const hair = root.querySelector<HTMLSelectElement>('.fh-style')!
    const change = (node: HTMLSelectElement | HTMLInputElement, value: string, event = 'change') => {
      node.value = value
      node.dispatchEvent(new Event(event))
    }
    expect([...root.querySelectorAll('select')].slice(0, 2)).toEqual([face, hair])
    const appearances = new Set<string>()
    for (const option of face.options) {
      change(face, option.value)
      for (const style of hair.options) {
        rendered.mockClear()
        ctx.stroke.mockClear()
        ctx.fillText.mockClear()
        change(hair, style.value)
        expect(rendered).toHaveBeenCalledTimes(11)
        const heads = rendered.mock.calls.map(call => call[1])
        expect(heads.every(who => JSON.stringify(who.face) === JSON.stringify(heads[0].face))).toBe(true)
        appearances.add(JSON.stringify(heads[0].face))
        const selected = heads[hair.selectedIndex]
        expect(heads.slice(3).every(who => who === selected)).toBe(true)
        expect(selected.head.hair!.locks).toEqual(characters.resolveHair(style.value as characters.HairStyleName).locks)
        const combination = `${option.textContent} · ${style.textContent}`
        expect(root.querySelector('.fh-readout')!.textContent).toContain(combination)
        expect(ctx.fillText).toHaveBeenCalledWith(`${combination} · resting shape from eight angles`, 480, 380)
        expect(ctx.stroke).toHaveBeenCalledTimes(1)
      }
    }
    expect(appearances.size).toBe(5)
    for (const look of ['clean', 'pencil', 'silhouette']) {
      rendered.mockClear()
      change(root.querySelector<HTMLSelectElement>('.fh-look')!, look)
      expect(rendered.mock.calls.every(call => call[1].look === look)).toBe(true)
    }
    change(root.querySelector<HTMLInputElement>('.fh-color')!, '#123456', 'input')
    expect(rendered.mock.calls.at(-1)![1].head.hair!.color).toBe('#123456')
    clock.time = 1200
    rendered.mockClear()
    draw()
    expect(rendered.mock.calls.slice(0, 3).some(call => Math.abs(call[2]['hair.swing'] ?? 0) > 0)).toBe(true)
    const motion = root.querySelector<HTMLInputElement>('.fh-motion')!
    motion.checked = false
    rendered.mockClear()
    motion.dispatchEvent(new Event('change'))
    expect(rendered.mock.calls.slice(0, 3).every(call => (call[2]['hair.swing'] ?? 0) === 0)).toBe(true)
    const turn = root.querySelector<HTMLInputElement>('.fh-turn')!
    turn.checked = true
    clock.time = 4400
    rendered.mockClear()
    turn.dispatchEvent(new Event('change'))
    expect(rendered.mock.calls.slice(0, 3).every(call => call[2].turn === 4)).toBe(true)
    cleanup()
    expect(kill).toHaveBeenCalledOnce()
    expect(live.ticker.remove).toHaveBeenCalledWith(draw)
    rendered.mockClear()
    for (const node of root.querySelectorAll('select, input')) {
      node.dispatchEvent(new Event('change'))
      node.dispatchEvent(new Event('input'))
    }
    expect(rendered).not.toHaveBeenCalled()
  }, 30000)
})
