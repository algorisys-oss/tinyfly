import { headingId } from './markdown'

/**
 * Search across the docs by section. Each doc is split at its headings, and a
 * query matches sections whose heading or text contains every word of it —
 * enough to jump to "stagger" or "motion path align" without an index library.
 */

export interface SearchableDoc {
  id: string
  title: string
  content: string
}

export interface DocSection {
  docId: string
  docTitle: string
  heading: string
  /** Anchor of the heading on the rendered page ('' for text before the first heading) */
  anchor: string
  text: string
}

export interface SearchHit extends DocSection {
  snippet: string
}

/** Split markdown into sections at headings, ignoring `#` lines inside code fences. */
export function splitSections(doc: SearchableDoc): DocSection[] {
  const sections: DocSection[] = []
  let current: DocSection = { docId: doc.id, docTitle: doc.title, heading: doc.title, anchor: '', text: '' }
  let inFence = false

  for (const line of doc.content.split('\n')) {
    if (line.startsWith('```')) inFence = !inFence
    const heading = !inFence && line.match(/^#{1,6}\s+(.+)/)
    if (heading) {
      if (current.text.trim() || current.anchor) sections.push(current)
      const text = heading[1].trim()
      current = { docId: doc.id, docTitle: doc.title, heading: text.replace(/[`*]/g, ''), anchor: headingId(text), text: '' }
    } else {
      current.text += line + '\n'
    }
  }
  sections.push(current)
  return sections
}

/** A short excerpt of `text` around the first occurrence of `word`. */
function snippetAround(text: string, word: string): string {
  // Readable text: no fence markers, table pipes or emphasis/code marks.
  const flat = text
    .replace(/^```.*$/gm, '')
    .replace(/[`*|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const at = flat.toLowerCase().indexOf(word)
  if (at < 0) return flat.slice(0, 120)
  const start = Math.max(0, at - 50)
  const end = Math.min(flat.length, at + word.length + 70)
  return `${start > 0 ? '…' : ''}${flat.slice(start, end)}${end < flat.length ? '…' : ''}`
}

export function searchDocs(docs: SearchableDoc[], query: string, limit = 20): SearchHit[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const scored: { hit: SearchHit; score: number; order: number }[] = []
  let order = 0
  for (const doc of docs) {
    for (const section of splitSections(doc)) {
      order++
      const heading = section.heading.toLowerCase()
      const body = section.text.toLowerCase()
      if (!words.every((word) => heading.includes(word) || body.includes(word))) continue
      // Headings that name the query rank first; then how often the words appear.
      let score = words.filter((word) => heading.includes(word)).length * 100
      for (const word of words) score += Math.min(body.split(word).length - 1, 20)
      const bodyWord = words.find((word) => body.includes(word)) ?? words[0]
      scored.push({ hit: { ...section, snippet: snippetAround(section.text, bodyWord) }, score, order })
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map((entry) => entry.hit)
}
