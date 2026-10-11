import { describe, it, expect } from 'vitest'
import { createEditorStore, createSceneStore, createProjectStore } from '../stores'
import type { ProjectBackend } from '../stores/project-store'
import type { CharacterElement } from '../stores/scene-store'
import { applyGeneratedAnimation, compileCharacterBeats, generatedProblems, parseAnimation, type GeneratedAnimation } from './animation-generator'
import { buildAnimationSystemPrompt } from './animation-system-prompt'
import type { Beat } from '../../characters'

const VALID = {
  name: 'Title Reveal',
  description: 'Headline fades up',
  duration: 1600,
  canvas: { width: 800, height: 450 },
  elements: [
    { type: 'text', name: 'Headline', x: 80, y: 150, width: 640, height: 60, text: 'tinyfly' },
    { type: 'rect', name: 'Bar', x: 340, y: 230, width: 120, height: 6, fill: '#4a9eff' },
  ],
  tracks: [
    { target: 'Headline', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 500, value: 1, easing: 'ease-out' }] },
    { target: 'Bar', property: 'clipRight', keyframes: [{ time: 300, value: 100 }, { time: 1000, value: 0 }] },
  ],
}

describe('parseAnimation', () => {
  it('parses a clean JSON object', () => {
    const anim = parseAnimation(JSON.stringify(VALID))
    expect(anim).not.toBeNull()
    expect(anim?.name).toBe('Title Reveal')
    expect(anim?.elements).toHaveLength(2)
    expect(anim?.tracks).toHaveLength(2)
  })

  it('strips ```json markdown fences', () => {
    const wrapped = '```json\n' + JSON.stringify(VALID) + '\n```'
    expect(parseAnimation(wrapped)?.name).toBe('Title Reveal')
  })

  it('extracts JSON when the model adds prose around it', () => {
    const noisy = `Sure! Here is your animation:\n${JSON.stringify(VALID)}\nHope that helps.`
    expect(parseAnimation(noisy)?.duration).toBe(1600)
  })

  it('rejects a track targeting an unknown element name', () => {
    const bad = { ...VALID, tracks: [{ target: 'Ghost', property: 'x', keyframes: [{ time: 0, value: 0 }] }] }
    expect(parseAnimation(JSON.stringify(bad))).toBeNull()
  })

  it('rejects an element missing a name', () => {
    const bad = { ...VALID, elements: [{ type: 'rect', x: 0, y: 0, width: 10, height: 10 }], tracks: [] }
    expect(parseAnimation(JSON.stringify(bad))).toBeNull()
  })

  it('rejects a non-positive duration', () => {
    expect(parseAnimation(JSON.stringify({ ...VALID, duration: 0 }))).toBeNull()
  })

  it('rejects empty elements', () => {
    expect(parseAnimation(JSON.stringify({ ...VALID, elements: [], tracks: [] }))).toBeNull()
  })

  it('rejects a track with no keyframes', () => {
    const bad = { ...VALID, tracks: [{ target: 'Bar', property: 'x', keyframes: [] }] }
    expect(parseAnimation(JSON.stringify(bad))).toBeNull()
  })

  it('returns null on non-JSON garbage', () => {
    expect(parseAnimation('the model refused to answer')).toBeNull()
  })

  it('allows an animation with no tracks (static scene)', () => {
    const anim = parseAnimation(JSON.stringify({ ...VALID, tracks: [] }))
    expect(anim?.tracks).toHaveLength(0)
  })
})

const ACTED: GeneratedAnimation = {
  name: 'Ticking Box',
  description: 'Amy walks up to a box, hears it tick, and bolts',
  duration: 1000,
  elements: [
    { type: 'rect', name: 'Box', x: 520, y: 248, width: 70, height: 52, fill: '#c9a24a' },
    {
      type: 'character',
      name: 'Amy',
      x: 60,
      y: 120,
      height: 180,
      cast: 'youngWoman',
      beats: [
        { do: 'walk', to: 330, mood: 'happy' },
        { do: 'look', toward: 520, mood: 'confused' },
        { do: 'take' },
        { do: 'say', say: 'Is that box ticking?', mood: 'worried' },
        { do: 'zip', to: -200 },
      ],
    },
  ],
  tracks: [{ target: 'Box', property: 'rotate', keyframes: [{ time: 0, value: -2 }, { time: 500, value: 2 }] }],
}

/** An in-memory project backend, so the test never touches IndexedDB. */
const memoryBackend: ProjectBackend = {
  loadProjects: () => new Map(),
  saveProjects: () => {},
  loadCurrentProjectId: () => null,
  saveCurrentProjectId: () => {},
}

describe('characters with beat scripts', () => {
  it('parse, and a character needs no tracks of its own', () => {
    expect(parseAnimation(JSON.stringify(ACTED))).not.toBeNull()
    expect(generatedProblems(ACTED)).toEqual([])
  })

  it('reject beats that are not beats, and name the ones that would not play', () => {
    expect(parseAnimation(JSON.stringify({ ...ACTED, elements: [{ ...ACTED.elements[1], beats: [{ to: 300 }] }] }))).toBeNull()
    expect(parseAnimation(JSON.stringify({ ...ACTED, elements: [{ ...ACTED.elements[0], beats: [{ do: 'walk' }] }] }))).toBeNull()
    const problems = generatedProblems({ ...ACTED, elements: [ACTED.elements[0], { ...ACTED.elements[1], beats: [{ do: 'moonwalk', to: 300 }, { do: 'walk', to: 200, mood: 'ecstatic' }] as unknown as Beat[] }] })
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/^Amy: beat 1: /)
    expect(problems[1]).toMatch(/^Amy: beat 2: /)
  })

  it('compile into the character’s tracks from where its feet stand, with hair follow-through', () => {
    const element = { id: 'c1', name: 'Amy', type: 'character', x: 60, y: 120, width: 144, height: 180, rotation: 0, opacity: 1, visible: true, locked: false, figure: 'fluid', look: 'clean', ink: '#1e293b', skin: '#f2c49b', outfit: 'basic', shirt: '#e2493b', trousers: '#24476b', hair: 'highPonytail', pose: {} } as CharacterElement
    const { tracks, duration } = compileCharacterBeats(element, ACTED.elements[1].beats!)
    expect(duration).toBeGreaterThan(3000)
    const x = tracks.find((track) => track.property === 'x')!
    // Walks from the feet (x + width / 2 = 132) to 330: an offset of 198, before the zip takes it off to the left.
    expect(Math.max(...x.keyframes.map((key) => Number(key.value)))).toBeCloseTo(198, 6)
    for (const property of ['walk', 'walking', 'gait', 'turn', 'mouth', 'hair.swing']) expect(tracks.some((track) => track.target === 'Amy' && track.property === property)).toBe(true)
  })

  it('load into the editor: the cast dresses the element, its beats stay on it, and the timeline fits the script', () => {
    const stores = { store: createEditorStore(), sceneStore: createSceneStore(), projectStore: createProjectStore({ backend: memoryBackend }) }
    applyGeneratedAnimation(stores, ACTED)
    const amy = stores.sceneStore.elements().find((element) => element.name === 'Amy') as CharacterElement
    expect(amy.type).toBe('character')
    expect(amy.hair).toBe('highPonytail')
    expect(amy.width).toBe(144)
    expect(amy.beats).toHaveLength(5)
    expect('cast' in amy).toBe(false)
    const timeline = stores.store.state.timeline!
    const tracks = timeline.tracks
    expect(tracks.some((track) => track.target === 'Box' && track.property === 'rotate')).toBe(true)
    expect(tracks.filter((track) => track.target === 'Amy').length).toBeGreaterThan(5)
    expect(timeline.duration).toBeGreaterThan(3000)
  })

  it('are described to the model from the library’s own names', () => {
    const prompt = buildAnimationSystemPrompt(800, 450)
    for (const word of ['youngWoman', 'grandma', 'doubleTake', 'bouncy', 'handsOnHips', 'skeptical', 'zip (to)', 'push (target, to)']) expect(prompt).toContain(word)
  })
})
