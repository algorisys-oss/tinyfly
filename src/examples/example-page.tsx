import { createMemo, createSignal, For, onMount, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, useParams } from '@solidjs/router'
import { BrandMark } from '../components/brand-mark'
import { copyText } from './copy-code-button'
import { exampleCategories, examples, getExample } from './example-catalog'
import { ExampleCard } from './examples-page'
import './code-examples.css'
import './examples-page.css'

/**
 * One example on its own page, `/examples/<id>`, for sharing a link to it. It
 * plays straight away, and lists more examples from the same category.
 */
export const ExamplePage: Component = () => {
  const params = useParams<{ id: string }>()
  const example = createMemo(() => getExample(params.id))
  const [copied, setCopied] = createSignal(false)

  const related = createMemo(() => {
    const current = example()
    if (!current) return []
    return examples.filter((other) => other.category === current.category && other.id !== current.id).slice(0, 6)
  })
  const categoryLabel = () => exampleCategories.find((c) => c.id === example()?.category)?.label

  onMount(() => {
    const current = example()
    if (current) document.title = `${current.name} — tinyfly examples`
  })

  const copyLink = async () => {
    try {
      await copyText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div class="examples-page example-single-page">
      <header class="examples-header">
        <div class="header-content">
          <div class="header-left">
            <A href="/" class="examples-brand" title="tinyfly home">
              <BrandMark size={28} wordmark={<span class="examples-wordmark">tinyfly</span>} />
            </A>
            <A href="/examples" class="back-link">
              ← All examples
            </A>
          </div>
        </div>
      </header>

      <Show
        when={example()}
        keyed
        fallback={
          <main class="example-single">
            <p>No example called “{params.id}”.</p>
            <A href="/examples">See all examples</A>
          </main>
        }
      >
        {(current) => (
          <main class="example-single">
            <div class="example-single-bar">
              <A href={`/examples?category=${current.category}`} class="example-single-category">
                {categoryLabel()}
              </A>
              <button class="secondary-btn" onClick={copyLink}>
                {copied() ? 'Link copied' : 'Copy link'}
              </button>
            </div>
            <ExampleCard example={current} single />

            <Show when={related().length}>
              <section class="example-related">
                <h2>More {categoryLabel()} examples</h2>
                <ul>
                  <For each={related()}>
                    {(other) => (
                      <li>
                        <A href={`/examples/${other.id}`}>{other.name}</A>
                        <span>{other.description}</span>
                      </li>
                    )}
                  </For>
                </ul>
              </section>
            </Show>
          </main>
        )}
      </Show>
    </div>
  )
}

export default ExamplePage
