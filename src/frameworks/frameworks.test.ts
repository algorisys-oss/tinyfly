// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { createElement, useRef, act } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp, defineComponent, h, ref, nextTick } from 'vue'
import { createRoot as createSolidRoot } from 'solid-js'
import { createLive, Stage, type LiveApi } from '../compat/gsap'
import { useTinyfly } from './react'
import { useTinyfly as useVueTinyfly } from './vue'
import { tinyfly } from './svelte'
import { createTinyfly } from './solid'

/**
 * Each wrapper runs its setup scoped to an element and reverts what it made on
 * unmount. Split text shows both at once: it changes the DOM synchronously, only
 * inside the scope, and revert() restores the original markup.
 */

let live: LiveApi
const TITLE = '<h1 class="title">Hi</h1>'
const split = (api: LiveApi) => {
  api.splitText('.title', { type: 'chars' })
}
const charsIn = (root: ParentNode) => root.querySelectorAll('.title .char').length

beforeEach(() => {
  document.body.innerHTML = `<div id="outside">${TITLE}</div><div id="mount"></div>`
  live = createLive(new Stage({ scheduler: { request: () => 1, cancel: () => {} } }))
})

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('tinyfly/react', () => {
  it('runs scoped to the ref, and reverts on unmount; contextSafe joins the context', async () => {
    let safe: (() => void) | undefined
    function Hero() {
      const root = useRef<HTMLElement>(null)
      const { contextSafe } = useTinyfly((api) => split(api), { scope: root, live })
      safe = contextSafe(() => {
        live.splitText('.later', { type: 'words' })
      })
      return createElement('section', { ref: root, dangerouslySetInnerHTML: { __html: `${TITLE}<p class="later">a b</p>` } })
    }
    const mount = document.getElementById('mount')!
    const reactRoot = createRoot(mount)
    await act(async () => reactRoot.render(createElement(Hero)))
    expect(charsIn(mount)).toBe(2)
    expect(charsIn(document.getElementById('outside')!)).toBe(0)
    await act(async () => safe?.())
    expect(mount.querySelectorAll('.later .word').length).toBe(2)
    await act(async () => reactRoot.unmount())
  })

  it('reverts before running again when dependencies change', async () => {
    const runs: number[] = []
    function Counter({ n }: { n: number }) {
      const root = useRef<HTMLElement>(null)
      useTinyfly(
        (api) => {
          runs.push(n)
          split(api)
        },
        { scope: root, dependencies: [n], live }
      )
      return createElement('section', { ref: root, dangerouslySetInnerHTML: { __html: TITLE } })
    }
    const mount = document.getElementById('mount')!
    const reactRoot = createRoot(mount)
    await act(async () => reactRoot.render(createElement(Counter, { n: 1 })))
    await act(async () => reactRoot.render(createElement(Counter, { n: 2 })))
    expect(runs).toEqual([1, 2])
    expect(charsIn(mount)).toBe(2) // split once, not split-inside-split
    await act(async () => reactRoot.unmount())
  })
})

describe('tinyfly/vue', () => {
  it('runs on mount scoped to the ref and reverts on unmount', async () => {
    let section: Element | null = null
    const Hero = defineComponent({
      setup() {
        const root = ref<Element | null>(null)
        useVueTinyfly((api) => split(api), { scope: root, live })
        return () => h('section', { ref: root, innerHTML: TITLE })
      },
    })
    const app = createApp(Hero)
    app.mount('#mount')
    await nextTick()
    section = document.querySelector('#mount section')
    expect(charsIn(section!)).toBe(2)
    expect(charsIn(document.getElementById('outside')!)).toBe(0)
    const title = section!.querySelector('.title')!
    app.unmount()
    expect(title.querySelectorAll('.char').length).toBe(0)
    expect(title.textContent).toBe('Hi')
  })
})

describe('tinyfly/svelte', () => {
  it('is an action: runs scoped to the node, updates and destroys', () => {
    const node = document.getElementById('mount')!
    node.innerHTML = TITLE
    const action = tinyfly(node, (api) => split(api), live)
    expect(charsIn(node)).toBe(2)
    expect(charsIn(document.getElementById('outside')!)).toBe(0)
    action.update((api) => {
      api.splitText('.title', { type: 'words' })
    })
    expect(charsIn(node)).toBe(0)
    expect(node.querySelectorAll('.title .word').length).toBe(1)
    action.destroy()
    expect(node.querySelector('.title')!.innerHTML).toBe('Hi')
  })
})

describe('tinyfly/solid', () => {
  it('runs on mount and reverts when the owner is disposed', async () => {
    const node = document.getElementById('mount')!
    node.innerHTML = TITLE
    let dispose!: () => void
    createSolidRoot((d) => {
      dispose = d
      createTinyfly((api) => split(api), () => node, live)
    })
    await Promise.resolve()
    expect(charsIn(node)).toBe(2)
    dispose()
    expect(charsIn(node)).toBe(0)
  })
})
