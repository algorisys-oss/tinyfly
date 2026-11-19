/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createDeck, type Deck, type DeckFrame } from './deck'

const MARKUP = `
<main id="deck">
  <section data-slide="intro" data-title="Welcome">
    <h1>Hello</h1>
    <aside data-notes>Say hello.</aside>
  </section>
  <section data-slide="points" data-title="Two points">
    <p data-step="1" id="one">One</p>
    <div data-step="2" id="two"><button data-timer="20" id="timer"></button></div>
    <aside data-notes>First note.</aside>
    <aside data-notes>Second note.</aside>
  </section>
  <section data-slide="end"><h1>Thanks</h1></section>
</main>`

const key = (name: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key: name }))
const classes = (id: string) => [...(document.getElementById(id) as HTMLElement).classList]

describe('createDeck', () => {
  let deck: Deck
  let frames: DeckFrame[]

  beforeEach(() => {
    document.body.innerHTML = MARKUP
    history.replaceState(null, '', '#')
    frames = []
    deck = createDeck('#deck', {
      autoStart: false,
      scenes: { points: () => ({ marks: [200, 1000, 3000], update: (frame) => frames.push(frame) }) },
    })
  })

  afterEach(() => {
    deck.destroy()
    vi.restoreAllMocks()
  })

  it('reads slides, notes, steps and countdowns from the markup', () => {
    expect(deck.state.slides.map((slide) => [slide.id, slide.title])).toEqual([
      ['intro', 'Welcome'],
      ['points', 'Two points'],
      ['end', 'end'],
    ])
    expect(deck.state.slides[1].notes).toBe('First note.\n\nSecond note.')
    expect(deck.state.slides[1].timers).toMatchObject([{ step: 2, seconds: 20 }])
    expect(document.querySelector('[data-slide="intro"]')?.classList.contains('tf-current')).toBe(true)
    expect(deck.element.style.width).toBe('1920px')
  })

  it('steps with the keyboard, revealing fragments and keeping the place in the URL', () => {
    key('ArrowRight')
    expect(deck.state.index).toBe(1)
    expect(deck.state.slide.steps).toBe(2)
    expect(classes('one')).toEqual([])
    // The entrance is still playing: the first press only ends it.
    key(' ')
    expect(deck.state.slide.step).toBe(0)
    key(' ')
    expect(classes('one')).toEqual(['tf-on', 'tf-now'])
    expect(location.hash).toBe('#2.1')
    key('ArrowLeft')
    expect(classes('one')).toEqual([])
    expect(location.hash).toBe('#2')
  })

  it('gives the scene its clock, step and countdown each frame', () => {
    deck.goTo(2)
    deck.render(1000)
    deck.render(1050)
    expect(frames.at(-1)).toMatchObject({ time: 50, clock: 1050, step: 0, timer: null, width: 1920, height: 1080 })
    deck.seek(2, 2)
    deck.render(2000)
    expect(frames.at(-1)).toMatchObject({ time: 3000, step: 2 })
    deck.seek(2, 1, 640)
    deck.render(2016)
    expect(frames.at(-1)).toMatchObject({ time: 640, step: 1 })
  })

  it('runs a countdown from the clicker and from its button', () => {
    const now = vi.spyOn(performance, 'now')
    const button = document.getElementById('timer') as HTMLElement
    deck.seek(2, 2)
    expect(button.dataset.state).toBe('idle')
    expect(button.textContent).toBe('▶ Start 20s timer')
    now.mockReturnValue(1000)
    deck.next()
    expect(button.dataset.state).toBe('running')
    deck.render(6000)
    expect(button.textContent).toBe('15')
    expect(frames.at(-1)?.timer).toMatchObject({ state: 'running', elapsed: 5000 })
    deck.render(21_500)
    expect(button.dataset.state).toBe('done')
    expect((document.getElementById('two') as HTMLElement).dataset.timerState).toBe('done')
    expect(deck.state.index).toBe(1)
    button.click()
    expect(button.dataset.state).toBe('running')
    key('t')
    expect(button.dataset.state).toBe('done')
    key('ArrowRight')
    expect(deck.state.index).toBe(2)
  })

  it('a click goes on, a right click goes back, and a link or button does neither', () => {
    deck.element.click()
    expect(deck.state.index).toBe(1)
    deck.element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    expect(deck.state.index).toBe(0)
    const link = document.createElement('a')
    document.querySelector('[data-slide="intro"]')?.appendChild(link)
    link.click()
    expect(deck.state.index).toBe(0)
  })

  it('jumps to a typed slide number, the ends, and blanks the screen', () => {
    key('3')
    expect(document.querySelector('.tf-deck-goto')?.textContent).toBe('Go to 3')
    key('Enter')
    expect(deck.state.index).toBe(2)
    key('Home')
    expect(deck.state.index).toBe(0)
    key('End')
    expect(deck.state.index).toBe(2)
    const blank = document.querySelector('.tf-deck-blank') as HTMLElement
    key('b')
    expect([...blank.classList]).toContain('tf-on')
    key('w')
    expect([...blank.classList]).toEqual(expect.arrayContaining(['tf-on', 'tf-white']))
    key('Escape')
    expect([...blank.classList]).not.toContain('tf-on')
  })

  it('starts from the URL hash, shown as that step ends', () => {
    deck.destroy()
    history.replaceState(null, '', '#2.1')
    deck = createDeck('#deck', { autoStart: false, scenes: { points: () => ({ marks: [200, 1000, 3000] }) } })
    expect([deck.state.index, deck.state.slide.step, deck.state.slide.time]).toEqual([1, 1, 1000])
  })

  it('stops a scene that throws and keeps the deck running', () => {
    deck.destroy()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    deck = createDeck('#deck', {
      autoStart: false,
      hash: false,
      scenes: {
        intro: () => {
          throw new Error('bad build')
        },
        points: () => ({
          update: () => {
            throw new Error('bad frame')
          },
        }),
      },
    })
    deck.next()
    deck.render(0)
    deck.render(16)
    expect(error).toHaveBeenCalledTimes(2)
    deck.next()
    expect(deck.state.slide.step).toBe(1)
  })

  it('uses the given labels, and removes what it added when destroyed', () => {
    deck.destroy()
    deck = createDeck('#deck', { autoStart: false, hash: false, labels: { timerStart: 'Démarrer {seconds} s' } })
    deck.seek(2, 2)
    expect(document.getElementById('timer')?.textContent).toBe('Démarrer 20 s')
    deck.destroy()
    expect(document.querySelector('.tf-deck-help')).toBeNull()
    key('ArrowRight')
    expect(deck.state.index).toBe(1)
  })

  it('refuses a page with no slides', () => {
    document.body.insertAdjacentHTML('beforeend', '<div id="empty"></div>')
    expect(() => createDeck('#empty')).toThrow(/data-slide/)
    expect(() => createDeck('#nowhere')).toThrow(/no element/)
  })
})
