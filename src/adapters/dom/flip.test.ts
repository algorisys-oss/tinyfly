import { describe, it, expect } from 'vitest'
import { recordFlipState, buildFlipTracks, flip, type FlipTarget } from './flip'

/**
 * Flip measures live layout — which the engine may not do — and emits ordinary
 * keyframes. These tests use fake elements whose rect we can move by hand.
 */

function fakeElement(rect: { left: number; top: number; width: number; height: number }) {
  const state = { ...rect }
  const el = {
    getBoundingClientRect: () => ({
      left: state.left,
      top: state.top,
      width: state.width,
      height: state.height,
      right: state.left + state.width,
      bottom: state.top + state.height,
      x: state.left,
      y: state.top,
      toJSON: () => ({}),
    }),
  } as unknown as Element
  return { el, state }
}

describe('recordFlipState', () => {
  it('measures every target', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 50 })
    const state = recordFlipState([{ name: 'a', element: a.el }])
    expect(state.measurements.get('a')).toEqual({ left: 0, top: 0, width: 100, height: 50 })
  })

  it('tolerates an element without getBoundingClientRect', () => {
    const state = recordFlipState([{ name: 'x', element: {} as Element }])
    expect(state.measurements.get('x')).toEqual({ left: 0, top: 0, width: 0, height: 0 })
  })
})

describe('buildFlipTracks', () => {
  it('emits x and y tracks for a moved element', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const before = recordFlipState(targets)
    a.state.left = 200
    a.state.top = 50

    const tracks = buildFlipTracks(before, targets)
    expect(tracks.map((t) => t.property).sort()).toEqual(['x', 'y'])
  })

  it('animates from the old position back to zero (the "invert" in FLIP)', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const before = recordFlipState(targets)
    a.state.left = 200

    const x = buildFlipTracks(before, targets).find((t) => t.property === 'x')!
    // The element is already at its destination; it starts displaced by -200
    // and animates to 0.
    expect(x.keyframes[0].value).toBe(-200)
    expect(x.keyframes[1].value).toBe(0)
  })

  it('emits nothing for an element that did not move or resize', () => {
    const a = fakeElement({ left: 10, top: 10, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]
    expect(buildFlipTracks(recordFlipState(targets), targets)).toEqual([])
  })

  it('emits scale tracks for a resized element', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const before = recordFlipState(targets)
    a.state.width = 200
    a.state.height = 50

    const tracks = buildFlipTracks(before, targets)
    const sx = tracks.find((t) => t.property === 'scaleX')!
    const sy = tracks.find((t) => t.property === 'scaleY')!
    expect(sx.keyframes[0].value).toBe(0.5)
    expect(sx.keyframes[1].value).toBe(1)
    expect(sy.keyframes[0].value).toBe(2)
  })

  it('skips scale when disabled', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const before = recordFlipState(targets)
    a.state.width = 200

    const tracks = buildFlipTracks(before, targets, { scale: false })
    expect(tracks.find((t) => t.property === 'scaleX')).toBeUndefined()
  })

  it('honours duration and easing', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const before = recordFlipState(targets)
    a.state.left = 100

    const x = buildFlipTracks(before, targets, { duration: 1200, easing: 'ease-in' })[0]
    expect(x.keyframes[1].time).toBe(1200)
    expect(x.keyframes[1].easing).toBe('ease-in')
  })

  it('ignores targets missing from the recorded state', () => {
    const a = fakeElement({ left: 0, top: 0, width: 10, height: 10 })
    const b = fakeElement({ left: 0, top: 0, width: 10, height: 10 })

    const before = recordFlipState([{ name: 'a', element: a.el }])
    b.state.left = 500

    const tracks = buildFlipTracks(before, [
      { name: 'a', element: a.el },
      { name: 'b', element: b.el },
    ])
    expect(tracks).toEqual([])
  })

  it('produces tracks that serialize to plain JSON', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const before = recordFlipState(targets)
    a.state.left = 40

    const tracks = buildFlipTracks(before, targets)
    expect(JSON.parse(JSON.stringify(tracks))).toEqual(tracks)
  })
})

describe('flip', () => {
  it('measures, applies the change, and measures again in one call', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const targets: FlipTarget[] = [{ name: 'a', element: a.el }]

    const tracks = flip(targets, () => { a.state.left = 300 })

    const x = tracks.find((t) => t.property === 'x')!
    expect(x.keyframes[0].value).toBe(-300)
  })

  it('names tracks with the given prefix', () => {
    const a = fakeElement({ left: 0, top: 0, width: 100, height: 100 })
    const tracks = flip(
      [{ name: 'card', element: a.el }],
      () => { a.state.top = 80 },
      { idPrefix: 'reorder' }
    )
    expect(tracks[0].id.startsWith('reorder-card')).toBe(true)
  })
})

describe('buildFlipTracks with a size change', () => {
  it('offsets by centres, so scaling about the centre lands on the old box', () => {
    const element = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } as unknown as Element
    const targets = [{ name: 'card', element }]
    const before = recordFlipState(targets)
    ;(element as unknown as { getBoundingClientRect: () => object }).getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 200 })
    const tracks = buildFlipTracks(before, targets)
    const first = (property: string) => tracks.find((t) => t.property === property)?.keyframes[0].value
    // Old centre (50,50); new centre (100,100); half the size.
    expect(first('x')).toBe(-50)
    expect(first('y')).toBe(-50)
    expect(first('scaleX')).toBe(0.5)
  })
})
