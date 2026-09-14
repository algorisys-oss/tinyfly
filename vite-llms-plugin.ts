import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { DOCS } from './src/docs/doc-manifest.ts'
import { buildLlmsTxt, buildLlmsFullTxt } from './src/docs/llms-text.ts'
import { course } from './src/learn/course.ts'
import { courseMarkdown } from './src/learn/course-text.ts'

/**
 * Publishes the docs for language models alongside the editor:
 *
 *   /llms.txt           index of the docs (https://llmstxt.org)
 *   /llms-full.txt      every doc, then the interactive course, in one file
 *   /docs/<id>.md       each doc as raw markdown
 *
 * Emitted into the build, and served by the dev server, straight from `docs/`.
 */
export function llmsPlugin(): Plugin {
  const readDoc = (id: string) => readFileSync(resolve(__dirname, 'docs', `${id}.md`), 'utf-8')

  const files = (): Map<string, string> => {
    const out = new Map<string, string>()
    out.set('llms.txt', buildLlmsTxt({ docUrl: (id) => `docs/${id}.md`, fullUrl: 'llms-full.txt' }))
    out.set('llms-full.txt', buildLlmsFullTxt(readDoc, courseMarkdown(course)))
    for (const doc of DOCS) out.set(`docs/${doc.id}.md`, readDoc(doc.id))
    return out
  }

  return {
    name: 'tinyfly-llms',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // `/docs/x.md?raw` is the app importing a doc as a module: leave it to Vite.
        const url = req.url ?? ''
        if (url.includes('?')) return next()
        const path = decodeURIComponent(url).replace(/^\//, '')
        const body = files().get(path)
        if (body === undefined) return next()
        res.setHeader('Content-Type', `${path.endsWith('.md') ? 'text/markdown' : 'text/plain'}; charset=utf-8`)
        res.end(body)
      })
    },

    generateBundle() {
      for (const [fileName, source] of files()) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}
