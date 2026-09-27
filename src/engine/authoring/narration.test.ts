import { describe, it, expect } from 'vitest'
import { planNarration, narrationMarkers, narrationSceneAt } from './narration'

describe('planNarration', () => {
  const scenes = [
    { lines: [{ text: 'one', duration: 1000 }, { text: 'two', duration: 2000 }] },
    { id: 'close', lines: [{ text: 'three', duration: 500, id: 'end' }], tail: 1000 },
  ]

  it('lays lines out with lead, gap and tail', () => {
    const plan = planNarration(scenes)
    expect(plan.cues.map((cue) => [cue.id, cue.start, cue.end])).toEqual([
      ['s0-l0', 350, 1350],
      ['s0-l1', 1650, 3650],
      ['end', 4200 + 350, 4200 + 850],
    ])
    expect(plan.scenes.map((scene) => [scene.id, scene.start, scene.duration])).toEqual([
      ['s0', 0, 4200],
      ['close', 4200, 350 + 500 + 550 + 1000],
    ])
    expect(plan.duration).toBe(4200 + 2400)
  })

  it('takes custom pauses', () => {
    const plan = planNarration([{ lines: [{ text: 'a', duration: 100 }, { text: 'b', duration: 100 }] }], {
      lead: 0,
      gap: 50,
      tail: 0,
    })
    expect(plan.cues.map((cue) => cue.start)).toEqual([0, 150])
    expect(plan.duration).toBe(250)
  })

  it('rejects a missing or negative duration', () => {
    expect(() => planNarration([{ lines: [{ text: 'a', duration: -1 }] }])).toThrow(/scene 0 line 0/)
    expect(() => planNarration([{ lines: [{ text: 'a', duration: NaN }] }])).toThrow()
  })

  it('makes one labelled marker per line', () => {
    expect(narrationMarkers(planNarration(scenes))).toEqual([
      { id: 's0-l0', time: 350, label: 'one' },
      { id: 's0-l1', time: 1650, label: 'two' },
      { id: 'end', time: 4550, label: 'three' },
    ])
  })

  it('finds the scene playing at a time', () => {
    const plan = planNarration(scenes)
    expect(narrationSceneAt(plan, 0)?.id).toBe('s0')
    expect(narrationSceneAt(plan, 4199)?.id).toBe('s0')
    expect(narrationSceneAt(plan, 4200)?.id).toBe('close')
    expect(narrationSceneAt(plan, 99999)?.id).toBe('close')
  })
})
