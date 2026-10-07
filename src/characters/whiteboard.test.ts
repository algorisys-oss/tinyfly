import { describe, expect, it } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { surfaceScript } from './acting/surface-script'
import { whiteboard, type WhiteboardOptions } from './whiteboard'

const OPTIONS: WhiteboardOptions = {
  x: 40,
  y: 30,
  width: 600,
  height: 340,
  fontSize: 20,
  charWidth: 0.5,
  items: [
    { id: 'eq', text: '2x + 4 = 12', at: [60, 80] },
    { id: 'step', text: '2x = 6', at: [60, 160], hidden: true },
    { id: 'ring', mark: 'circle', around: 'term:eq:+ 4', hidden: true },
    { id: 'line', mark: 'underline', around: 'text:step', color: 'red' },
    { id: 'go', mark: 'arrow', from: 'text:eq', to: 'text:step', hidden: true },
  ],
}
const make = (options: Partial<WhiteboardOptions> = {}) => whiteboard({ ...OPTIONS, ...options })

describe('whiteboard', () => {
  it('lays text out by arithmetic: places need no font', () => {
    const board = make()
    expect(board.kind).toBe('board')
    // A character is 10 px wide (20 px × 0.5), a line 26 px tall.
    expect(board.anchor('text:eq')).toMatchObject({ left: 100, top: 110, width: 11 * 10, height: 26 })
    expect(board.anchor('term:eq:+ 4')).toMatchObject({ left: 100 + 3 * 10, width: 30 })
    expect(board.anchor('term:eq#2:2')).toMatchObject({ left: 100 + 10 * 10 })
    expect(board.anchor('box')).toEqual(board.box)
  })

  it('puts marks around the places they name, the same every time', () => {
    const ring = make().anchor('mark:ring')
    const term = make().anchor('term:eq:+ 4')
    expect(ring.left).toBeLessThan(term.left)
    expect(ring.right).toBeGreaterThan(term.right)
    expect(make().anchor('mark:ring')).toEqual(ring)
    const arrow = make().anchor('mark:go')
    expect(arrow.top).toBeGreaterThan(make().anchor('text:eq').bottom)
    expect(arrow.bottom).toBeLessThan(make().anchor('text:step').top)
  })

  it('starts hidden items unwritten and undrawn', () => {
    const props = make().target.props!
    expect(props['text.eq.write']).toBe(1)
    expect(props['text.step.write']).toBe(0)
    expect(props['mark.ring.draw']).toBe(0)
    expect(props['mark.line.draw']).toBe(1)
  })

  it('records its edits by name as tracks', () => {
    const board = make()
      .edit('draw', 'mark:ring', { at: 500 })
      .edit('write', 'text:step', { at: 1000 })
      .edit('strike', 'term:eq:+ 4', { at: 2000 })
      .edit('erase', ['text:eq', 'mark:ring'], { at: 3000, duration: 200 })
    const timeline = new Timeline({ id: 'b', tracks: board.tracks('board') })
    const at = (time: number, prop: string) => timeline.getStateAtTime(time).values.get('board')?.get(prop) as number
    expect(at(750, 'mark.ring.draw')).toBeCloseTo(0.5)
    // Written at 90 ms a character.
    expect(at(1000 + 3 * 90, 'text.step.write')).toBeCloseTo(0.5)
    expect(at(2250, 'strike.1.draw')).toBe(1)
    expect(at(3100, 'text.eq.erase')).toBeCloseTo(0.5)
    expect(at(3200, 'mark.ring.erase')).toBe(1)
  })

  it('lets a term come loose, fly off, and be written over', () => {
    const board = make()
    const piece = board.piece('term:eq:+ 4')
    expect(board.piece('term:eq:+ 4')).toBe(piece)
    expect(piece.home).toEqual(board.anchor('term:eq:+ 4'))
    board.edit('move', 'term:eq:+ 4', { at: 0, duration: 100, to: 'text:step' })
    board.edit('write', 'term:eq#2:2', { at: 0, text: '3' })
    const timeline = new Timeline({ id: 'b', tracks: board.tracks('board') })
    const x = timeline.getStateAtTime(100).values.get('board')?.get('piece.1.x') as number
    expect(piece.home.x + x).toBeCloseTo(board.anchor('text:step').x)
    expect(board.target.props!['piece.2.write']).toBe(0)
  })

  it('says what is wrong, naming what it has', () => {
    const board = make()
    expect(() => board.anchor('txt:eq')).toThrow(/Unknown anchor "txt": did you mean "text"\?/)
    expect(() => board.anchor('text:eqn')).toThrow(/there is no text "eqn" \(texts: eq, step\)/)
    expect(() => board.anchor('term:eq:+ 5')).toThrow(/text "eq" has no "\+ 5"/)
    expect(() => board.edit('draw', 'text:eq', { at: 0 })).toThrow(/draw takes mark anchors, not "text:eq"/)
    expect(() => board.edit('erse', 'text:eq', { at: 0 })).toThrow(/Unknown edit "erse": did you mean "erase"\?/)
    expect(() => board.edit('write', 'term:eq:4', { at: 0 })).toThrow(/needs `text`/)
    expect(() => make({ theme: 'chalk' as never })).toThrow(/Unknown theme "chalk": did you mean "chalkboard"\?/)
    expect(() => make({ items: [{ id: 'm', mark: 'cirle' as never, around: 'box' }] })).toThrow(/Unknown mark "cirle": did you mean "circle"\?/)
    expect(() => make({ items: [{ id: 'm', mark: 'circle', around: 'text:later' }, { id: 'later', text: 'x', at: [0, 0] }] })).toThrow(/there is no text "later"/)
    expect(() => make({ items: [{ id: 'a', text: 'x', at: [0, 0] }, { id: 'a', text: 'y', at: [0, 40] }] })).toThrow(/two items are called "a"/)
  })

  it('takes every edit it lists', () => {
    for (const name of Object.keys(make().about.edits)) {
      const anchor = name === 'draw' ? 'mark:ring' : name === 'write' ? 'text:step' : 'term:eq:+ 4'
      expect(() => make().edit(name, anchor, { at: 0, to: 'box' }), name).not.toThrow()
    }
  })

  it('draws without throwing, in both themes and at every stage', () => {
    for (const theme of ['whiteboard', 'chalkboard'] as const) {
      const board = make({ theme })
      board.piece('term:eq:+ 4')
      board.edit('strike', 'text:eq', { at: 0 }).edit('write', 'term:eq:+ 4', { at: 0, text: '- 4' })
      const calls: string[] = []
      const ctx = new Proxy({}, { get: (_, key) => (typeof key === 'string' && !['font', 'fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin'].includes(key) ? (...args: unknown[]) => calls.push(`${key}${args.length}`) : undefined), set: () => true }) as unknown as CanvasRenderingContext2D
      board.target.draw(ctx, { ...board.target, props: { ...board.target.props, 'piece.1.write': 0.5, 'strike.1.draw': 1 } }, 0)
      expect(calls.filter((c) => c.startsWith('fillText')).length).toBeGreaterThan(5)
    }
  })
})

describe('whiteboard with surfaceScript', () => {
  it('a figure writes a line in, circles a term and knocks it off the board', () => {
    const board = make()
    const result = surfaceScript(
      'teacher',
      { board },
      [
        { do: 'write', target: { surface: 'board', anchor: 'text:step' }, then: { surface: 'board', edit: 'write', anchor: 'text:step', until: 'release' } },
        { do: 'point', target: { surface: 'board', anchor: 'term:eq:+ 4' }, then: { surface: 'board', edit: 'draw', anchor: 'mark:ring' } },
        { do: 'swipe', target: { surface: 'board', anchor: 'term:eq:+ 4' }, then: { surface: 'board', edit: 'fling', anchor: 'term:eq:+ 4' } },
      ],
      { from: 500, ground: 420, height: 120 }
    )
    const [write, point] = result.beats
    const track = (prop: string) => result.tracks.find((t) => t.target === 'board' && t.property === prop)!
    expect(track('text.step.write').keyframes.map((k) => k.time)).toEqual([write.contact, write.release])
    expect(track('mark.ring.draw').keyframes[0].time).toBe(point.contact)
    expect(track('piece.1.opacity')).toBeDefined()
  })
})
