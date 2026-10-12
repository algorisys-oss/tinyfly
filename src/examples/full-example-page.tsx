import { createEffect, createMemo, onCleanup, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { getExample } from './example-catalog'
import { editableExamplePage, liveDemoPage, timelineExamplePage } from './standalone-page'
import markupCss from './code-examples.css?raw'

/** The same standalone HTML as Copy code, in a shareable full-viewport player. */
export const FullExamplePage: Component = () => {
  const params = useParams<{ id: string }>()
  const example = createMemo(() => getExample(params.id))
  const html = createMemo(() => {
    const current = example()
    if (!current) return ''
    return current.kind === 'editable'
      ? editableExamplePage(current.sample)
      : current.format === 'live'
        ? liveDemoPage(current.demo, import.meta.env.DEV && !current.demo.addons?.length ? `${location.origin}/src/browser/index.ts` : undefined)
        : timelineExamplePage(current.code, markupCss)
  })
  const previousTitle = document.title
  createEffect(() => { document.title = `${example()?.name ?? 'Example not found'} — tinyfly` })
  onCleanup(() => { document.title = previousTitle })

  return (
    <Show when={example()} keyed fallback={<main><p>Example not found.</p><A href="/examples">All examples</A></main>}>
      {(current) => (
        <iframe
          class="full-example-frame"
          title={`${current.name} full-page example`}
          srcdoc={html()}
          allow="fullscreen"
          style={{ position: 'fixed', inset: '0', width: '100%', height: '100%', border: '0', background: '#111' }}
        />
      )}
    </Show>
  )
}

export default FullExamplePage
