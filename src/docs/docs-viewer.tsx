import { createSignal, createMemo, For } from 'solid-js'
import type { Component } from 'solid-js'
import { A } from '@solidjs/router'
import { renderMarkdown } from './markdown'
import './docs-viewer.css'

// Import documentation markdown files as raw strings
import gettingStartedMd from '../../docs/getting-started.md?raw'
import editorGuideMd from '../../docs/editor-guide.md?raw'
import apiReferenceMd from '../../docs/api-reference.md?raw'
import examplesMd from '../../docs/examples.md?raw'

interface DocPage {
  id: string
  title: string
  content: string
}

const pages: DocPage[] = [
  { id: 'getting-started', title: 'Getting Started', content: gettingStartedMd },
  { id: 'editor-guide', title: 'Editor Guide', content: editorGuideMd },
  { id: 'api-reference', title: 'API Reference', content: apiReferenceMd },
  { id: 'examples', title: 'Examples', content: examplesMd },
]

export const DocsViewer: Component = () => {
  const [currentPageId, setCurrentPageId] = createSignal('getting-started')

  const currentPage = createMemo(() => {
    return pages.find(p => p.id === currentPageId()) ?? pages[0]
  })

  const renderedHtml = createMemo(() => {
    return renderMarkdown(currentPage().content)
  })

  const handlePageChange = (pageId: string) => {
    setCurrentPageId(pageId)
    // Scroll content to top
    const content = document.querySelector('.docs-content')
    if (content) content.scrollTop = 0
  }

  return (
    <div class="docs-viewer">
      <header class="docs-header">
        <A href="/" class="docs-back-link">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor" />
          </svg>
          Back to Editor
        </A>
        <h1 class="docs-title">tinyfly docs</h1>
        <div class="docs-header-spacer" />
      </header>

      <div class="docs-body">
        <nav class="docs-sidebar">
          <For each={pages}>
            {(page) => (
              <button
                class="docs-nav-item"
                classList={{ active: currentPageId() === page.id }}
                onClick={() => handlePageChange(page.id)}
              >
                {page.title}
              </button>
            )}
          </For>
        </nav>

        <main class="docs-content" innerHTML={renderedHtml()} />
      </div>
    </div>
  )
}
