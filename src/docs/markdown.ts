/**
 * Lightweight markdown-to-HTML renderer.
 * Handles the subset of markdown used in tinyfly documentation.
 * No external dependencies.
 */

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Process inline markdown (bold, italic, code, links) */
function processInline(text: string): string {
  let result = escapeHtml(text)

  // Inline code (must be before bold/italic to avoid conflicts)
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Bold + italic
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')

  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Italic
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  return result
}

/** Parse a GFM table block into HTML */
function parseTable(lines: string[]): string {
  if (lines.length < 2) return ''

  const parseRow = (line: string): string[] => {
    return line
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim())
  }

  const headers = parseRow(lines[0])
  // lines[1] is the separator row (---|---)
  const bodyRows = lines.slice(2)

  let html = '<table><thead><tr>'
  for (const header of headers) {
    html += `<th>${processInline(header)}</th>`
  }
  html += '</tr></thead><tbody>'

  for (const row of bodyRows) {
    const cells = parseRow(row)
    html += '<tr>'
    for (let i = 0; i < headers.length; i++) {
      html += `<td>${processInline(cells[i] || '')}</td>`
    }
    html += '</tr>'
  }

  html += '</tbody></table>'
  return html
}

/**
 * Convert markdown string to HTML.
 */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // skip closing ```
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : ''
      output.push(`<pre><code${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
      continue
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line) || /^\*\*\*+\s*$/.test(line)) {
      output.push('<hr>')
      i++
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      output.push(`<h${level} id="${id}">${processInline(text)}</h${level}>`)
      i++
      continue
    }

    // Table (starts with | and next line is separator)
    if (line.startsWith('|') && i + 1 < lines.length && /^\|[\s:|-]+\|/.test(lines[i + 1])) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      output.push(parseTable(tableLines))
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      output.push(`<blockquote>${renderMarkdown(quoteLines.join('\n'))}</blockquote>`)
      continue
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        let item = lines[i].replace(/^[-*]\s+/, '')
        i++
        // Continuation lines (indented)
        while (i < lines.length && /^\s{2,}/.test(lines[i]) && !/^[-*]\s/.test(lines[i].trim())) {
          item += ' ' + lines[i].trim()
          i++
        }
        items.push(item)
      }
      output.push('<ul>' + items.map(item => `<li>${processInline(item)}</li>`).join('') + '</ul>')
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        let item = lines[i].replace(/^\d+\.\s+/, '')
        i++
        // Continuation lines
        while (i < lines.length && /^\s{2,}/.test(lines[i]) && !/^\d+\.\s/.test(lines[i].trim())) {
          item += ' ' + lines[i].trim()
          i++
        }
        items.push(item)
      }
      output.push('<ol>' + items.map(item => `<li>${processInline(item)}</li>`).join('') + '</ol>')
      continue
    }

    // Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph (default)
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') &&
           !lines[i].startsWith('```') && !lines[i].startsWith('|') &&
           !lines[i].startsWith('> ') && !/^[-*]\s/.test(lines[i]) &&
           !/^\d+\.\s/.test(lines[i]) && !/^---+\s*$/.test(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      output.push(`<p>${processInline(paraLines.join(' '))}</p>`)
    }
  }

  return output.join('\n')
}
