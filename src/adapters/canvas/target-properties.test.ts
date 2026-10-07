import { describe, it, expect } from 'vitest'
import { CANVAS_PROPERTIES, animatableProperties, checkTracks, describeTarget } from './target-properties'
import type { CanvasTarget } from './canvas-adapter'
import { stickFigureTarget } from '../../characters/stick-figure'
import { codePanel } from '../../characters/code-panel'
import '../../characters/acting'

const rect: CanvasTarget = { type: 'rect', x: 10, y: 20, width: 40, height: 30, opacity: 0.5 }

describe('describeTarget', () => {
  it('lists a shape’s properties with units and current values', () => {
    const described = describeTarget(rect)
    const opacity = described.properties.find((p) => p.name === 'opacity')!
    expect(opacity).toMatchObject({ value: 0.5, min: 0, max: 1 })
    expect(described.properties.map((p) => p.name)).toContain('borderRadius')
    expect(described.properties.map((p) => p.name)).not.toContain('radius')
  })

  it('lets a stick figure say its joints, ranges and actions', () => {
    const described = describeTarget(stickFigureTarget({ x: 0, y: 0, style: { hands: {} } }))
    expect(described.kind).toBe('stick figure')
    expect(described.properties.find((p) => p.name === 'rightShoulder')).toMatchObject({ unit: 'degrees', value: 18 })
    expect(described.properties.find((p) => p.name === 'hand.left.spread')?.description).toMatch(/^Left hand/)
    expect(described.actions?.grab).toMatch(/lifts it overhead/)
    expect(Object.keys(described.actions ?? {})).toEqual(expect.arrayContaining(['walk', 'wave', 'take', 'leap', 'push']))
  })

  it('lets a code panel say its props and edits', () => {
    const code = codePanel({ code: 'a\nb', x: 0, y: 0 })
    code.piece(1, 'a')
    const described = describeTarget(code.target)
    expect(described.kind).toBe('code panel')
    expect(described.properties.find((p) => p.name === 'piece.1.x')?.unit).toBe('px')
    expect(described.actions?.remove).toMatch(/wipe \| fly \| blur/)
  })

  it('describes every canvas property for some type', () => {
    for (const [name, info] of Object.entries(CANVAS_PROPERTIES)) expect(info.types.length, name).toBeGreaterThan(0)
    expect(animatableProperties(rect)).toEqual(expect.arrayContaining(['fillStyle', 'lineWidth']))
  })
})

describe('checkTracks', () => {
  const targets = { box: rect, hero: stickFigureTarget({ x: 0, y: 0 }) }
  const track = (target: string, property: string, keyframes: Array<{ time: number; value: unknown }>) => ({ id: `${target}-${property}`, target, property, keyframes }) as never

  it('names the target and property probably meant', () => {
    const problems = checkTracks(
      [track('bx', 'x', [{ time: 0, value: 1 }]), track('box', 'rotation', [{ time: 0, value: 1 }]), track('hero', 'rightSholder', [{ time: 0, value: 1 }])],
      targets
    ).map((p) => p.message)
    expect(problems[0]).toMatch(/Unknown target "bx": did you mean "box"\?/)
    expect(problems[1]).toMatch(/Unknown property "rotation": did you mean "rotate"\?/)
    expect(problems[2]).toMatch(/Unknown property "rightSholder": did you mean "rightShoulder"\?/)
  })

  it('checks key order, value kinds and ranges', () => {
    const problems = checkTracks(
      [
        track('box', 'x', [{ time: 500, value: 1 }, { time: 100, value: 2 }]),
        track('box', 'opacity', [{ time: 0, value: 'half' }]),
        track('box', 'opacity', [{ time: 0, value: 3 }]),
        track('box', 'fill', [{ time: 0, value: '#f00' }]),
      ],
      targets
    )
    expect(problems.map((p) => [p.level, p.message])).toEqual([
      ['error', expect.stringMatching(/out of time order/)],
      ['error', expect.stringMatching(/values are numbers/)],
      ['warning', expect.stringMatching(/outside 0..1/)],
    ])
  })

  it('passes good tracks, aliases included', () => {
    expect(checkTracks([track('box', 'fillStyle', [{ time: 0, value: '#fff' }]), track('hero', 'walking', [{ time: 0, value: 1 }])], targets)).toEqual([])
  })
})
