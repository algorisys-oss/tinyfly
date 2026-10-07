import { describe, it, expect } from 'vitest'
import { capabilities, capabilitiesMarkdown } from './capabilities'
import { POSES, EXPRESSIONS } from './stick-figure'
import { GAITS } from './gaits'
import { GAGS } from './acting/gags'
import { actionNames } from './acting/beat-check'
import * as teach from '../teach'
import { scriptTracks } from './acting/script'

describe('capabilities', () => {
  it('lists what the library has, read from the library', () => {
    const c = capabilities('1.2.3')
    expect(c.version).toBe('1.2.3')
    expect(c.stickFigure.poses).toEqual(Object.keys(POSES))
    expect(c.stickFigure.expressions).toEqual(Object.keys(EXPRESSIONS))
    expect(c.stickFigure.gaits).toEqual(Object.keys(GAITS))
    expect(Object.keys(c.stickFigure.gags)).toEqual(Object.keys(GAGS))
    expect(Object.keys(c.stickFigure.actions).sort()).toEqual([...actionNames()].sort())
    expect(c.codePanel.languages).toContain('rust')
  })

  it('lists each surface with the anchors and edits it takes', () => {
    const c = capabilities()
    expect(Object.keys(c.surfaces.code.anchors)).toEqual(['box', 'line:N', 'token:N:TEXT', 'spot:N:C'])
    expect(c.surfaces.code.edits).toHaveProperty('fling')
    expect(Object.keys(c.surfaces.board.anchors)).toEqual(['box', 'text:ID', 'term:ID:TEXT', 'mark:ID'])
    expect(capabilitiesMarkdown()).toContain('### code')
    expect(capabilitiesMarkdown()).toContain('`whiteboard({')
    expect(Object.keys(c.surfaces.chart.edits)).toEqual(['set', 'show', 'highlight'])
    expect(capabilitiesMarkdown()).toContain('- `token:N:TEXT`')
  })

  it('names teaching helpers that exist', () => {
    for (const name of ['lesson', 'cells', 'pointer', 'stack', 'queue', 'table', 'pipeline', 'figure']) expect(teach, name).toHaveProperty(name)
  })

  it('every action it lists compiles in a beat script', () => {
    const target = { x: 120, y: -60, left: 100, right: 140 }
    for (const [action, guide] of Object.entries(capabilities().stickFigure.actions)) {
      const beat = { do: action, ...(guide.needs?.includes('to') || action in GAITS ? { to: 200 } : {}), ...(guide.needs?.includes('target') ? { target } : {}), ...(guide.needs?.includes('say') ? { say: 'hi' } : {}) }
      expect(() => scriptTracks('hero', [beat as never], { height: 100 }), action).not.toThrow()
    }
  })

  it('reads as markdown', () => {
    const md = capabilitiesMarkdown('1.2.3')
    expect(md.startsWith('# tinyfly capabilities (v1.2.3)')).toBe(true)
    expect(md).toContain('| `rightShoulder` | degrees |')
    expect(md).toContain('`doubleTake`')
    expect(md).toMatch(/\| `push` \| `target`, `to` \|/)
  })
})

describe('capabilities with a cast', () => {
  it('lists the cast’s own actions and gaits', async () => {
    const { defineAction, defineGait } = await import('./acting/custom')
    const cast = {
      actions: { facepalm: defineAction({ summary: 'Face into hand.', steps: () => [{ after: 300, pose: { rightShoulder: 150 } }] }) },
      gaits: { limp: defineGait({ swing: 14, knee: 10, arm: 10, elbow: 6, lean: 6, summary: 'A limp' }) },
    }
    expect(capabilities(undefined, cast).custom.actions.facepalm.summary).toBe('Face into hand.')
    const md = capabilitiesMarkdown(undefined, cast)
    expect(md).toContain('- `facepalm`: Face into hand.')
    expect(md).toContain('- `limp` (gait): A limp')
    expect(capabilitiesMarkdown()).toContain('persona({ name')
  })
})

describe('capabilities: props', () => {
  it('lists every preset with its actions, controls and anchors', () => {
    const c = capabilities()
    expect(Object.keys(c.props.presets)).toEqual(expect.arrayContaining(['car', 'tree', 'house', 'helicopter', 'airplane', 'bike']))
    expect(c.props.presets.car.actions.drive.needs).toEqual(['to'])
    expect(c.props.presets.car.anchors).toContain('seat')
    expect(c.props.commonActions.pop).toMatch(/Pops/)
    expect(capabilitiesMarkdown()).toMatch(/\| `helicopter\(\)` \| aircraft \|/)
  })
})
