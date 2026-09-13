import { createSignal, createMemo, createEffect, on, For, Show } from 'solid-js'
import type { Component } from 'solid-js'
import { A, useNavigate, useParams, useLocation } from '@solidjs/router'
import { renderMarkdown } from './markdown'
import { DOCS, DOC_SECTIONS } from './doc-manifest'
import { searchDocs } from './doc-search'
import { rewriteDocLinks } from './doc-links'
import { BrandMark } from '../components/brand-mark'
import './docs-viewer.css'

// Every markdown file in docs/, as raw strings; the manifest decides which are shown.
const files = import.meta.glob<string>('../../docs/*.md', { query: '?raw', import: 'default', eager: true })
const contentById = new Map(Object.entries(files).map(([path, text]) => [path.replace(/^.*\/|\.md$/g, ''), text]))

const pages = DOCS.map((doc) => ({ ...doc, content: contentById.get(doc.id) ?? '' }))
const pageIds = new Set(pages.map((page) => page.id))

export const DocsViewer: Component = () => {
  const params = useParams<{ page?: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = createSignal('')
  let contentEl: HTMLElement | undefined

  const currentPage = createMemo(() => pages.find((page) => page.id === params.page) ?? pages[0])
  const renderedHtml = createMemo(() => rewriteDocLinks(renderMarkdown(currentPage().content), pageIds))
  const hits = createMemo(() => searchDocs(pages, query()))

  // After a page or anchor change, show the anchor (or the top of the page).
  createEffect(
    on([renderedHtml, () => location.hash], ([, hash]) => {
      if (!contentEl) return
      const target = hash ? contentEl.querySelector(`[id="${CSS.escape(decodeURIComponent(hash.slice(1)))}"]`) : null
      if (target) target.scrollIntoView()
      else contentEl.scrollTop = 0
    })
  )

  // Links to other doc pages are rendered as plain anchors; route them in-app.
  const handleContentClick = (event: MouseEvent) => {
    const anchor = (event.target as Element).closest('a')
    const href = anchor?.getAttribute('href')
    if (!href?.startsWith('/docs/') || event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    navigate(href)
  }

  const openHit = (href: string) => {
    setQuery('')
    navigate(href)
  }

  return (
    <div class="docs-viewer">
      <header class="docs-header">
        <A href="/studio" class="docs-back-link">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor" />
          </svg>
          Back to Editor
        </A>
        <h1 class="docs-title">
          <BrandMark size={24} wordmark="tinyfly docs" />
        </h1>
        <div class="docs-header-spacer" />
      </header>

      <div class="docs-body">
        <nav class="docs-sidebar">
          <input
            class="docs-search"
            type="search"
            placeholder="Search docs…"
            aria-label="Search docs"
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
              const first = hits()[0]
              if (event.key === 'Enter' && first) openHit(`/docs/${first.docId}${first.anchor ? `#${first.anchor}` : ''}`)
            }}
          />

          <Show
            when={query().trim()}
            fallback={
              <For each={DOC_SECTIONS}>
                {(section) => (
                  <div class="docs-nav-section">
                    <div class="docs-nav-heading">{section}</div>
                    <For each={pages.filter((page) => page.section === section)}>
                      {(page) => (
                        <A
                          href={`/docs/${page.id}`}
                          class="docs-nav-item"
                          classList={{ active: currentPage().id === page.id }}
                          title={page.summary}
                        >
                          {page.title}
                        </A>
                      )}
                    </For>
                  </div>
                )}
              </For>
            }
          >
            <div class="docs-search-results">
              <Show when={hits().length > 0} fallback={<div class="docs-search-empty">No matches</div>}>
                <For each={hits()}>
                  {(hit) => (
                    <button class="docs-search-hit" onClick={() => openHit(`/docs/${hit.docId}${hit.anchor ? `#${hit.anchor}` : ''}`)}>
                      <span class="docs-search-hit-title">{hit.heading}</span>
                      <span class="docs-search-hit-doc">{hit.docTitle}</span>
                      <span class="docs-search-hit-snippet">{hit.snippet}</span>
                    </button>
                  )}
                </For>
              </Show>
            </div>
          </Show>

          <div class="docs-llms">
            For AI tools: <a href="/llms.txt">llms.txt</a> · <a href="/llms-full.txt">llms-full.txt</a> ·{' '}
            <a href={`/docs/${currentPage().id}.md`}>this page as markdown</a>
          </div>
        </nav>

        <main class="docs-content" ref={contentEl} innerHTML={renderedHtml()} onClick={handleContentClick} />
      </div>
    </div>
  )
}
