import { describe, it, expect } from 'vitest'
import { Timeline } from '../engine/core/timeline'
import { codePanel, codeTokens } from './code-panel'

const SOURCE = ['func total(items []Item) int {', '    sum := 0', '    return sum', '    fmt.Println("unreachable")', '}'].join('\n')
const make = () => codePanel({ code: SOURCE, language: 'go', x: 40, y: 20, fontSize: 10, lineHeight: 2, padding: 5 })

describe('codePanel', () => {
  it('lays lines out by arithmetic: anchors need no font', () => {
    const code = make()
    // Gutter: one digit + 2 characters of 6 px.
    const line = code.line(2)
    expect(line.left).toBe(40 + 5 + 18)
    expect(line.top).toBe(20 + 5 + 20)
    expect(line.height).toBe(20)
    expect(line.width).toBe('    sum := 0'.length * 6)
    expect(line.y).toBe(line.top + 10)
    expect(code.box.height).toBe(5 * 2 + 5 * 20)
  })

  it('finds tokens on a line, by occurrence', () => {
    const code = make()
    const word = code.token(4, 'Println')
    expect(word.left).toBe(code.line(4).left + '    fmt.'.length * 6)
    expect(word.width).toBe(7 * 6)
    expect(() => code.token(4, 'Println', 2)).toThrow(/no 2th "Println"/)
    expect(() => code.line(9)).toThrow(/no line 9/)
  })

  it('removes a line: wipes it, then the lines below close the gap', () => {
    const code = make().remove(4, { at: 1000, duration: 300, close: 200, from: 'right' })
    const timeline = new Timeline({ id: 'c', tracks: code.tracks('code') })
    const at = (time: number, property: string) => timeline.getStateAtTime(time).values.get('code')?.get(property)
    expect(at(1150, 'line.4.wipe')).toBeCloseTo(0.5)
    expect(at(1300, 'line.5.shift')).toBe(0)
    expect(at(1500, 'line.5.shift')).toBe(1)
    expect(at(1500, 'line.3.shift')).toBeUndefined()
    // Anchors know where a line is once the gap has closed.
    expect(code.line(5, 1000).top).toBe(code.line(5, 0).top)
    expect(code.line(5, 1500).top).toBe(code.line(4, 0).top)
  })

  it('keeps one track per prop, so a later edit starts where the earlier ended', () => {
    const code = make().highlight(2, { at: 0 }).highlight(2, { at: 1000, on: false })
    const tracks = code.tracks('code')
    expect(tracks).toHaveLength(1)
    expect(tracks[0].keyframes.map((k) => [k.time, k.value])).toEqual([[0, 0], [200, 1], [1000, 1], [1200, 0]])
  })

  it('types hidden lines in', () => {
    const code = codePanel({ code: 'a\nhello', x: 0, y: 0, hidden: [2] }).type(2, { at: 0 })
    expect(code.target.props?.['line.2.reveal']).toBe(0)
    expect(code.tracks('c')[0].keyframes.at(-1)).toMatchObject({ time: 5 * 45, value: 1 })
  })

  it('colours keywords, strings, numbers and comments', () => {
    const kinds = codeTokens('    if x == 42 { s := "a // b" } // done', 'go').map((t) => [t.kind, t.text.trim()]).filter(([, t]) => t)
    expect(kinds).toContainEqual(['keyword', 'if'])
    expect(kinds).toContainEqual(['number', '42'])
    expect(kinds).toContainEqual(['string', '"a // b"'])
    expect(kinds).toContainEqual(['comment', '// done'])
    expect(codeTokens('# note', 'python')[0].kind).toBe('comment')
  })
})

describe('codePanel pieces', () => {
  it('carries a piece along a path, then flings it from where it was', () => {
    const code = make()
    const word = code.piece(4, 'Println')
    code.follow(word, [
      { time: 0, x: word.home.x, y: word.home.y },
      { time: 330, x: word.home.x + 33, y: word.home.y - 33 },
    ])
    code.fling(word, { at: 330, duration: 660 })
    const timeline = new Timeline({ id: 'c', tracks: code.tracks('code') })
    const at = (time: number, property: string) => timeline.getStateAtTime(time).values.get('code')?.get(property) as number
    expect(at(330, `piece.${word.id}.x`)).toBeCloseTo(33)
    // It keeps the path's velocity (0.1 px/ms right, 0.1 up) and falls.
    expect(at(330 + 330, `piece.${word.id}.x`)).toBeCloseTo(66, 0)
    expect(at(990, `piece.${word.id}.opacity`)).toBe(0)
    expect(at(600, `piece.${word.id}.rotate`)).toBeGreaterThan(0)
  })

  it('makes one piece per word, and refuses overlaps', () => {
    const code = make()
    expect(code.piece(4, 'Println')).toBe(code.piece(4, 'Println'))
    expect(() => code.piece(4, 'Print')).toThrow(/overlaps/)
  })

  it('writes new text into a piece’s place', () => {
    const code = make()
    const word = code.piece(2, 'sum')
    code.write(word, 'total', { at: 100 })
    const write = code.tracks('code').find((t) => t.property === `piece.${word.id}.write`)!
    expect(write.keyframes.map((k) => [k.time, k.value])).toEqual([[100, 0], [100 + 5 * 70, 1]])
  })

  it('removes a line in any style, closing the gap after it has gone', () => {
    for (const style of ['wipe', 'fly', 'blur'] as const) {
      const code = make().remove(3, { at: 0, duration: 400, close: 100, style })
      expect(code.line(4, 500).top).toBe(code.line(3, 0).top)
    }
  })
})

describe('codePanel inserts and drops', () => {
  it('types text into a line, and spots after it make room', () => {
    const code = make().insert(2, 4, 'var ', { at: 100 })
    const tracks = code.tracks('code')
    expect(tracks.find((t) => t.property === 'insert.1.type')!.keyframes.at(-1)).toMatchObject({ time: 100 + 4 * 70, value: 1 })
    // Before the insert, column 4 is where it always was; after, it is 4 characters on.
    expect(code.spot(2, 4, 1, 0).left).toBe(code.line(2).left + 4 * 6)
    expect(code.spot(2, 4, 1, 200).left).toBe(code.line(2).left + 8 * 6)
  })

  it('drops a piece into another line: it lands in the room that opens, and its old place closes', () => {
    const code = make()
    const word = code.piece(4, 'Println')
    const landing = code.spot(3, 4, 7)
    code.drop(word, 3, 4, { at: 500, duration: 200 })
    const timeline = new Timeline({ id: 'c', tracks: code.tracks('code') })
    const at = (time: number, property: string) => timeline.getStateAtTime(time).values.get('code')?.get(property) as number
    expect(word.home.x + at(700, `piece.${word.id}.x`)).toBeCloseTo(landing.x)
    expect(word.home.y + at(700, `piece.${word.id}.y`)).toBeCloseTo(landing.y)
    expect(at(700, 'insert.1.open')).toBe(1)
    expect(at(700, `piece.${word.id}.away`)).toBe(1)
    expect(at(400, `piece.${word.id}.away`)).toBe(0)
  })
})

describe('codePanel: riding lines and sliding words', () => {
  it('carries a figure standing on a line up with it as a gap above closes', () => {
    const code = make()
    const ground = code.line(5).top
    // A figure that stands on line 5 the whole time, with a hop at 2000 that lands back on it.
    const tracks = [
      { id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 2000, value: 0 }, { time: 2200, value: -30, easing: 'ease-out' as const }, { time: 2400, value: 0, easing: 'ease-in' as const }] },
    ]
    code.remove(3, { at: 500, duration: 300, close: 200 })
    const ridden = code.ride(tracks, 'hero', { ground })
    const timeline = new Timeline({ id: 'r', tracks: ridden })
    const y = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('y') as number
    expect(y(400)).toBe(0)
    expect(y(1000)).toBeCloseTo(-20)
    // Later moves keep their shape, one line up.
    expect(y(2400)).toBeCloseTo(-20)
    expect(ridden[0].keyframes.find((k) => k.time === 2200)).toMatchObject({ value: -50, easing: 'ease-out' })
  })

  it('leaves a figure alone when nothing moves under it', () => {
    const code = make().remove(5, { at: 0 })
    const tracks = [{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 900, value: 0 }] }]
    // Standing on line 2: only lines below the removed one move.
    expect(code.ride(tracks, 'hero', { ground: code.line(2).top })[0].keyframes.map((k) => k.value)).toEqual([0, 0])
  })

  it('slides a word along its own line, the text it passes closing up behind it', () => {
    const code = make()
    // "    fmt.Println(...)": slide "fmt." to before the "(".
    const word = code.piece(4, 'fmt.')
    const column = code.lines[3].indexOf('(')
    const landing = code.landing(word, 4, column)
    // It ends just before the "(", which has moved back four characters.
    expect(landing.left).toBe(code.line(4).left + (column - 4) * 6)
    code.drop(word, 4, column, { at: 0, duration: 1000 })
    const timeline = new Timeline({ id: 'c', tracks: code.tracks('code') })
    const at = (time: number, property: string) => timeline.getStateAtTime(time).values.get('code')?.get(property) as number
    expect(at(500, `piece.${word.id}.x`)).toBeCloseTo((landing.x - word.home.x) / 2)
    expect(at(500, `piece.${word.id}.away`)).toBeCloseTo(0.5)
    expect(at(500, 'insert.1.open')).toBeCloseTo(0.5)
  })
})

describe('codePanel.ride from the ground', () => {
  it('does not carry a figure on its own ground, and lands it on a line that has moved', () => {
    const code = make()
    const ground = code.box.bottom
    const onto = code.line(5).top - ground
    code.remove(3, { at: 0, duration: 100, close: 100 })
    // Stands on the ground until 1000, then leaps onto line 5 (laid out where it was) by 1400.
    const tracks = [{ id: 'hero-y', target: 'hero', property: 'y', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 0 }, { time: 1400, value: onto, easing: 'ease-in' as const }] }]
    const ridden = code.ride(tracks, 'hero', { ground })
    const timeline = new Timeline({ id: 'r', tracks: ridden })
    const y = (time: number) => timeline.getStateAtTime(time).values.get('hero')?.get('y') as number
    expect(y(500)).toBe(0)
    expect(y(1400)).toBeCloseTo(onto - 20)
  })
})

describe('codePanel as a surface: places and edits by name', () => {
  it('names its places: the same boxes as line, token and spot', () => {
    const code = make()
    expect(code.kind).toBe('code')
    expect(code.anchor('box')).toEqual(code.box)
    expect(code.anchor('line:2')).toEqual(code.line(2))
    expect(code.anchor('token:4:Println')).toEqual(code.token(4, 'Println'))
    expect(code.anchor('token:1#2:t')).toEqual(code.token(1, 't', 2))
    // A token's text may hold colons.
    expect(code.anchor('token:2::=')).toEqual(code.token(2, ':='))
    expect(code.anchor('spot:3:4')).toEqual(code.spot(3, 4))
    expect(code.anchor('spot:3:4:6')).toEqual(code.spot(3, 4, 6))
  })

  it('says what is wrong with a place it does not have', () => {
    const code = make()
    expect(() => code.anchor('lin:2')).toThrow(/Unknown anchor "lin": did you mean "line"\?/)
    expect(() => code.anchor('line:two')).toThrow(/write it line:N/)
    expect(() => code.anchor('line:9')).toThrow(/no line 9/)
    expect(() => code.anchor('token:4')).toThrow(/token:N:TEXT/)
    expect(() => code.piece('line:4')).toThrow(/a piece is a word/)
  })

  it('makes the same piece whether asked by name or by line and word', () => {
    const code = make()
    expect(code.piece('token:4:Println')).toBe(code.piece(4, 'Println'))
  })

  it('records the same tracks by name as by the direct calls', () => {
    const direct = make()
    direct.highlight([2, 3], { at: 100 }).strike(3, { at: 200 }).remove(2, { at: 900, style: 'fly' })
    direct.insert(3, 4, 'x', { at: 400 })
    const word = direct.piece(4, 'Println')
    direct.write(word, 'Printf', { at: 500 })
    direct.move(direct.piece(4, 'fmt.'), { at: 600, to: { x: direct.box.x, y: direct.box.y } })
    direct.fling(word, { at: 1500 })
    direct.drop(direct.piece(1, 'int'), 3, 2, { at: 1600 })

    const named = make()
    named
      .edit('highlight', ['line:2', 'line:3'], { at: 100 })
      .edit('strike', 'line:3', { at: 200 })
      .edit('remove', 'line:2', { at: 900, style: 'fly' })
      .edit('insert', 'spot:3:4', { at: 400, text: 'x' })
      .edit('write', 'token:4:Println', { at: 500, text: 'Printf' })
      .edit('move', 'token:4:fmt.', { at: 600, to: 'box' })
      .edit('fling', ['token:4:Println'], { at: 1500 })
      .edit('drop', 'token:1:int', { at: 1600, into: 'spot:3:2' })
    expect(named.tracks('code')).toEqual(direct.tracks('code'))
  })

  it('says what an edit takes when it is given the wrong place or options', () => {
    const code = make()
    expect(() => code.edit('higlight', 'line:2', { at: 0 })).toThrow(/Unknown edit "higlight": did you mean "highlight"\?/)
    expect(() => code.edit('strike', 'token:4:fmt', { at: 0 })).toThrow(/strike takes line anchors/)
    expect(() => code.edit('fling', ['token:4:fmt', 'token:4:Println'], { at: 0 })).toThrow(/takes one token anchor/)
    expect(() => code.edit('write', 'token:4:fmt', { at: 0 })).toThrow(/needs `text`/)
    expect(() => code.edit('drop', 'token:4:fmt', { at: 0, into: 'line:2' })).toThrow(/a spot anchor/)
    expect(() => code.edit('move', 'token:4:fmt', { at: 0 })).toThrow(/needs `to`/)
  })

  it('lists an edit for every name it takes', () => {
    const code = make()
    for (const name of Object.keys(code.about.edits)) {
      const anchor = ['insert'].includes(name) ? 'spot:3:4' : ['highlight', 'strike', 'remove', 'type'].includes(name) ? 'line:3' : 'token:4:fmt'
      expect(() => code.edit(name, anchor, { at: 0, text: 'x', into: 'spot:3:1', to: 'box' }), name).not.toThrow()
    }
  })
})
