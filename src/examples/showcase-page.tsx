import { onCleanup, onMount, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { createLive, Stage } from '../compat/gsap'
import { findShowcase } from './showcases'
import { CopyCodeButton } from './copy-code-button'
import { showcasePage } from './standalone-page'
import './showcase-page.css'

/**
 * A full-page showcase at `/showcase/<id>`. The app normally scrolls inside its
 * root element; a showcase needs the window to scroll, as it would on its own
 * site, so while mounted the document is switched to ordinary page scrolling.
 */
export const ShowcasePage: Component = () => {
  const params = useParams<{ id: string }>()
  const showcase = () => findShowcase(params.id)
  let host: HTMLDivElement | undefined

  onMount(() => {
    const current = showcase()
    if (!current || !host) return
    document.documentElement.classList.add('showcase-mode')
    window.scrollTo(0, 0)

    const stage = new Stage({ root: host })
    const cleanup = current.run(createLive(stage), host)

    onCleanup(() => {
      cleanup?.()
      stage.destroy()
      document.documentElement.classList.remove('showcase-mode')
    })
  })

  return (
    <Show
      when={showcase()}
      fallback={
        <div class="showcase-missing">
          <p>No showcase called “{params.id}”.</p>
          <A href="/examples">Back to examples</A>
        </div>
      }
    >
      {(current) => (
        <>
          <div ref={host} innerHTML={current().html} />
          <div class="showcase-bar">
            <A href="/examples" class="showcase-bar-link">
              ← Examples
            </A>
            <CopyCodeButton getCode={() => showcasePage(current())} />
          </div>
        </>
      )}
    </Show>
  )
}

export default ShowcasePage
