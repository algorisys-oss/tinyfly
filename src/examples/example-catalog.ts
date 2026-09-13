import { sampleDefinitions, type SampleDefinition } from '../editor/samples'
import { codeExamples, type CodeExample, type CodeCategory } from './code-examples'
import { liveDemos, type LiveDemoWithCode } from './live-demos'

/**
 * The single catalog behind the Examples page.
 *
 * There are two kinds of example, because there are two ways to use tinyfly:
 *
 * - **editable** — a scene built in the editor's format (elements + tracks).
 *   "Open in editor" loads it into a new project.
 * - **code** — for your own page, shown as code rather than opened in the
 *   editor. Two formats: a `timeline` (JSON plus the markup it animates), or
 *   `live` (GSAP-style `live.to()` code that runs on the card).
 *
 * Both kinds share one category list, so the page filters them together.
 */

export type ExampleCategory =
  | 'gsap'
  | 'showcase'
  | 'basics'
  | 'motion'
  | 'text'
  | 'ui'
  | 'loaders'
  | 'effects'
  | 'data'
  | 'camera'
  | 'scroll'
  | 'products'

export type ExampleKind = 'editable' | 'code'

interface ExampleBase {
  id: string
  name: string
  description: string
  category: ExampleCategory
  /** Extra search terms */
  tags: string[]
}

export interface EditableExample extends ExampleBase {
  kind: 'editable'
  sample: SampleDefinition
}

export interface CodeCatalogExample extends ExampleBase {
  kind: 'code'
  format: 'timeline'
  code: CodeExample
}

export interface LiveCatalogExample extends ExampleBase {
  kind: 'code'
  format: 'live'
  demo: LiveDemoWithCode
}

export type Example = EditableExample | CodeCatalogExample | LiveCatalogExample

/** Display order and labels. */
export const exampleCategories: { id: ExampleCategory; label: string }[] = [
  { id: 'gsap', label: 'GSAP-style' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'basics', label: 'Basics' },
  { id: 'motion', label: 'Motion' },
  { id: 'text', label: 'Text' },
  { id: 'ui', label: 'UI & Interactions' },
  { id: 'loaders', label: 'Loaders' },
  { id: 'effects', label: 'Effects' },
  { id: 'data', label: 'Data' },
  { id: 'camera', label: 'Camera' },
  { id: 'scroll', label: 'Scroll' },
  { id: 'products', label: 'Algorisys' },
]

export const exampleKindLabels: Record<ExampleKind, string> = {
  editable: 'Open in editor',
  code: 'Code',
}

const SAMPLE_CATEGORY: Record<SampleDefinition['category'], ExampleCategory> = {
  basic: 'basics',
  motion: 'motion',
  text: 'text',
  ui: 'ui',
  effects: 'effects',
  showcase: 'showcase',
  products: 'products',
  camera: 'camera',
}

const CODE_CATEGORY: Record<CodeCategory, ExampleCategory> = {
  'UI Components': 'ui',
  'Micro-interactions': 'ui',
  'Text Effects': 'text',
  Loaders: 'loaders',
  'Data Visualization': 'data',
  Creative: 'effects',
  Scroll: 'scroll',
}

function fromSample(sample: SampleDefinition): EditableExample {
  return {
    kind: 'editable',
    id: sample.id,
    name: sample.name,
    description: sample.description,
    category: SAMPLE_CATEGORY[sample.category],
    tags: [sample.category],
    sample,
  }
}

function fromCode(code: CodeExample): CodeCatalogExample {
  return {
    kind: 'code',
    format: 'timeline',
    id: code.id,
    name: code.name,
    description: code.description,
    category: CODE_CATEGORY[code.category],
    tags: code.tags,
    code,
  }
}

function fromLiveDemo(demo: LiveDemoWithCode): LiveCatalogExample {
  return {
    kind: 'code',
    format: 'live',
    id: demo.id,
    name: demo.name,
    description: demo.description,
    category: 'gsap',
    tags: demo.tags,
    demo,
  }
}

export const examples: Example[] = [
  ...liveDemos.map(fromLiveDemo),
  ...sampleDefinitions.map(fromSample),
  ...codeExamples.map(fromCode),
]

/** Look up an example by id. */
export function getExample(id: string): Example | undefined {
  return examples.find((example) => example.id === id)
}

export interface ExampleFilter {
  category?: ExampleCategory | 'all'
  kind?: ExampleKind | 'all'
  query?: string
}

/** Filter the catalog. Pure, so the page and tests share it. */
export function filterExamples(list: Example[], filter: ExampleFilter): Example[] {
  const query = filter.query?.trim().toLowerCase() ?? ''
  return list.filter((example) => {
    if (filter.category && filter.category !== 'all' && example.category !== filter.category) return false
    if (filter.kind && filter.kind !== 'all' && example.kind !== filter.kind) return false
    if (!query) return true
    return (
      example.name.toLowerCase().includes(query) ||
      example.description.toLowerCase().includes(query) ||
      example.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })
}
