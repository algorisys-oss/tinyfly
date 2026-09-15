/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TinyflyPlayer, type Scenario } from './player'
import type { TimelineDefinition } from '../engine'

/**
 * Scenarios: one figure, several timelines, and the reader chooses which one
 * plays — cache on or off, a healthy cluster or one with its leader down.
 */

let frameCallbacks: Array<(time: number) => void> = []
let now = 0
function runFrames(count: number, stepMs = 50) {
  for (let i = 0; i < count; i++) {
    const callbacks = frameCallbacks
    frameCallbacks = []
    now += stepMs
    for (const callback of callbacks) callback(now)
  }
}

let reduce = false

const slow: TimelineDefinition = {
  id: 'no-cache',
  config: {
    duration: 3000,
    markers: [
      { id: 'ask', time: 1000, label: 'ask the database' },
      { id: 'answer', time: 3000, label: 'answer after 3 s' },
    ],
  },
  tracks: [
    { id: 'x', target: 'request', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 3000, value: 300 }] },
    { id: 'db', target: 'db', property: 'fill', keyframes: [{ time: 0, value: '#ffffff' }, { time: 1000, value: '#ff0000' }] },
    { id: 'ms', target: 'ms', property: 'text', keyframes: [{ time: 0, value: '0 ms' }, { time: 3000, value: '3000 ms' }] },
  ],
}

const fast: TimelineDefinition = {
  id: 'cache',
  config: {
    duration: 1000,
    markers: [
      { id: 'ask', time: 200, label: 'ask the cache' },
      { id: 'hit', time: 1000, label: 'hit' },
    ],
  },
  tracks: [{ id: 'x', target: 'request', property: 'x', keyframes: [{ time: 0, value: 0 }, { time: 1000, value: 100 }] }],
}

const scenarios: Scenario[] = [
  { id: 'no-cache', label: 'No cache', timeline: slow },
  { id: 'cache', label: 'With cache', timeline: fast },
]

let container: HTMLElement
const el = (name: string) => container.querySelector(`[data-tinyfly="${name}"]`) as unknown as HTMLElement

beforeEach(() => {
  frameCallbacks = []
  now = 0
  reduce = false
  vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => (frameCallbacks.push(callback), frameCallbacks.length))
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return query.includes('reduce') && reduce
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  document.body.innerHTML =
    '<div id="figure"><svg viewBox="0 0 400 100">' +
    '<rect data-tinyfly="request" width="10" height="10" style="opacity: 0.5"/>' +
    '<rect data-tinyfly="db" width="50" height="50"/>' +
    '<text data-tinyfly="ms">idle</text>' +
    '</svg></div>'
  container = document.getElementById('figure')!
})

afterEach(() => vi.unstubAllGlobals())

describe('player listeners', () => {
  it('keeps its subscribers when a timeline is loaded again', async () => {
    const player = new TinyflyPlayer(container, { playWhenVisible: true })
    await player.load(slow)
    let calls = 0
    player.subscribe(() => calls++)
    await player.load(fast)
    calls = 0
    player.seek(500)
    expect(calls).toBeGreaterThan(0)
  })
})

describe('scenarios', () => {
  it('loads the first scenario, or the one asked for, and lists them all', async () => {
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    expect(player.scenario).toBe('no-cache')
    expect(player.scenarios).toEqual([
      { id: 'no-cache', label: 'No cache' },
      { id: 'cache', label: 'With cache' },
    ])
    expect(player.duration).toBe(3000)

    const other = new TinyflyPlayer(container)
    await other.loadScenarios(scenarios, { initial: 'cache' })
    expect(other.scenario).toBe('cache')
    expect(other.duration).toBe(1000)
  })

  it('a plain load has no scenarios', async () => {
    const player = new TinyflyPlayer(container)
    await player.load(slow)
    expect(player.scenarios).toEqual([])
    expect(player.scenario).toBeUndefined()
  })

  it('rejects an empty list and duplicate ids', async () => {
    const player = new TinyflyPlayer(container)
    await expect(player.loadScenarios([])).rejects.toThrow(/at least one/)
    await expect(player.loadScenarios([scenarios[0], { ...scenarios[1], id: 'no-cache' }])).rejects.toThrow(/"no-cache" is used more than once/)
  })

  it('keeps the reader at the same step when the new scenario has that marker', async () => {
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    player.goToMarker('ask')
    expect(player.currentTime).toBe(1000)
    expect(player.setScenario('cache')).toBe(true)
    expect(player.scenario).toBe('cache')
    expect(player.currentTime).toBe(200)
    expect(player.currentMarker?.id).toBe('ask')
  })

  it('goes to the start when the step does not exist there, and to the end from the end', async () => {
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    player.goToMarker('answer')
    player.setScenario('cache')
    // 'answer' is at the end of the slow scenario, so the fast one shows its end too.
    expect(player.currentTime).toBe(1000)

    player.setScenario('no-cache')
    player.seek(2500)
    player.setScenario('cache')
    // At 2500 ms the current marker is 'ask', which the fast scenario has.
    expect(player.currentTime).toBe(200)

    player.seek(50)
    player.setScenario('no-cache')
    // Before any marker: the start.
    expect(player.currentTime).toBe(0)
  })

  it('keeps playing if it was playing, and stays paused if it was paused', async () => {
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    player.play()
    runFrames(4)
    player.setScenario('cache')
    expect(player.isPlaying).toBe(true)
    runFrames(40)
    expect(player.currentTime).toBe(1000)

    player.setScenario('no-cache')
    expect(player.isPlaying).toBe(false)
  })

  it('undoes what the previous scenario drew before drawing the next', async () => {
    const player = new TinyflyPlayer(container, { initialFrame: 'end' })
    await player.loadScenarios(scenarios)
    expect(el('db').style.getPropertyValue('fill')).toMatch(/#ff0000|rgb\(255, 0, 0\)/)
    expect(el('ms').textContent).toBe('3000 ms')

    player.setScenario('cache')
    // The fast scenario never touches the database box or the timer text.
    expect(el('db').getAttribute('style')).toBeNull()
    expect(el('ms').textContent).toBe('idle')
    // The request keeps its authored style, plus the new position.
    expect(el('request').style.opacity).toBe('0.5')
    expect(el('request').style.transform).toBe('translateX(100px)')
  })

  it('ignores an unknown scenario', async () => {
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    player.seek(700)
    expect(player.setScenario('nope')).toBe(false)
    expect(player.scenario).toBe('no-cache')
    expect(player.currentTime).toBe(700)
  })

  it('tells subscribers when the scenario changes', async () => {
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    const seen: Array<string | undefined> = []
    player.subscribe(() => seen.push(player.scenario))
    player.setScenario('cache')
    expect(seen.at(-1)).toBe('cache')
  })

  it('under reduced motion shows the final frame of the chosen scenario', async () => {
    reduce = true
    const player = new TinyflyPlayer(container)
    await player.loadScenarios(scenarios)
    expect(player.currentTime).toBe(3000)
    player.setScenario('cache')
    expect(player.currentTime).toBe(1000)
    expect(player.isPlaying).toBe(false)
  })
})
