import { describe, it, expect } from 'vitest'
import { createSceneStore, type CharacterElement, type CodeElement } from '../stores/scene-store'
import { beatProblems, compileCharacterBeats, type ElementBeat } from './character-beats'
import { codeElementSurface } from './code-element'

function scene() {
  const store = createSceneStore()
  store.addElement('character', { x: 40, y: 120, width: 144, height: 180, hair: 'highPonytail' })
  store.addElement('code', { x: 300, y: 60, width: 320, code: 'let a = 1\nlet b = 2\nprint(a + b)' })
  const amy = store.elements()[0] as CharacterElement
  const code = store.elements()[1] as CodeElement
  return { amy, code, surfaces: { [code.name]: codeElementSurface(code) } }
}

describe('character beats in the editor', () => {
  it('aim beats at a code element’s lines and run its edits as tracks on it', () => {
    const { amy, code, surfaces } = scene()
    const beats: ElementBeat[] = [
      { do: 'walk', to: { surface: code.name, anchor: 'line:2' } },
      { do: 'point', target: { surface: code.name, anchor: 'line:2' }, then: { surface: code.name, edit: 'highlight', anchor: 'line:2' } },
      { do: 'swipe', target: { surface: code.name, anchor: 'line:3' }, then: { surface: code.name, edit: 'strike', anchor: 'line:3', at: 'release' } },
    ]
    expect(beatProblems(beats, surfaces)).toEqual([])
    const { tracks, duration } = compileCharacterBeats(amy, beats, { surfaces })
    expect(duration).toBeGreaterThan(1500)
    const highlight = tracks.find((track) => track.target === code.name && track.property === 'line.2.highlight')!
    const strike = tracks.find((track) => track.target === code.name && track.property === 'line.3.strike')!
    expect(highlight).toBeDefined()
    expect(strike).toBeDefined()
    expect(Number(strike.keyframes[0].time)).toBeGreaterThan(Number(highlight.keyframes[0].time))
    // The walk goes to the line's x, measured from the feet.
    const x = tracks.find((track) => track.target === amy.name && track.property === 'x')!
    const line = surfaces[code.name].anchor('line:2')
    expect(Math.max(...x.keyframes.map((key) => Number(key.value)))).toBeCloseTo(line.left + line.width / 2 - (amy.x + amy.width / 2), 6)
    expect(tracks.some((track) => track.target === amy.name && track.property === 'hair.swing')).toBe(true)
  })

  it('name the beat and the place when a surface or anchor is missing, or an edit unknown', () => {
    const { code, surfaces } = scene()
    expect(beatProblems([{ do: 'point', target: { surface: 'Board 1', anchor: 'line:2' } }], surfaces)[0]).toMatch(/^beat 1: `target`: no surface "Board 1"/)
    expect(beatProblems([{ do: 'point', target: { surface: code.name, anchor: 'line:9' } }], surfaces)[0]).toMatch(/^beat 1: `target`: /)
    expect(beatProblems([{ do: 'hold', then: { surface: code.name, edit: 'explode', anchor: 'line:1' } }], surfaces)[0]).toMatch(/has no edit "explode"/)
    expect(beatProblems([{ do: 'moonwalk' }], surfaces)[0]).toMatch(/^beat 1: /)
    expect(beatProblems('walk', surfaces)[0]).toMatch(/Beats are a list/)
  })
})
