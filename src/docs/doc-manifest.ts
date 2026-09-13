/**
 * The published documentation: which markdown files under `docs/` are
 * user-facing, what they are called, and what each one covers.
 *
 * One list feeds both the in-app docs viewer and the `llms.txt` /
 * `llms-full.txt` files, so a page added here shows up everywhere. Design
 * notes and launch material in `docs/` are deliberately left out.
 */

export type DocSection = 'Start here' | 'Reference' | 'Editor features' | 'Guides'

export interface DocEntry {
  /** File name under `docs/`, without `.md` */
  id: string
  title: string
  /** One sentence: what a reader (or a language model) finds on the page */
  summary: string
  section: DocSection
}

export const DOC_SECTIONS: DocSection[] = ['Start here', 'Reference', 'Editor features', 'Guides']

export const DOCS: DocEntry[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    summary: 'What tinyfly is, making a first animation in the editor, and using it from code, a script tag or the CDN.',
    section: 'Start here',
  },
  {
    id: 'gsap-compat',
    title: 'GSAP Compatibility',
    summary: 'The GSAP-style API (`live.to`, `tf.timeline`): supported vars, motion paths, morphSVG, text, inertia, Draggable, Flip, and where it differs from GSAP.',
    section: 'Start here',
  },
  {
    id: 'examples',
    title: 'Code Examples',
    summary: 'Recipes with the engine API: fades, loops, colour and bezier easing, loading JSON, canvas and SVG rendering, multi-scene sequences, motion paths and script-tag embeds.',
    section: 'Start here',
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    summary: 'Every public engine, player and adapter API: Timeline, tracks, keyframes, easing, drivers, serialization and exports.',
    section: 'Reference',
  },
  {
    id: 'file-format',
    title: 'File Format',
    summary: 'The JSON animation format: timelines, every track kind, keyframes, easing and the project file — for generating or consuming animations.',
    section: 'Reference',
  },
  {
    id: 'editor-guide',
    title: 'Editor Guide',
    summary: 'Every panel and feature of the visual editor, from elements and keyframes to text and inertia tracks, preview and export.',
    section: 'Editor features',
  },
  {
    id: 'shape-morph',
    title: 'Shape Morphing',
    summary: 'Tweening one path into another, including shapes with different point counts and several subpaths.',
    section: 'Editor features',
  },
  {
    id: 'pen-tool',
    title: 'Pen Tool',
    summary: 'Drawing custom paths point by point with straight segments and bezier curves.',
    section: 'Editor features',
  },
  {
    id: 'polygon-star',
    title: 'Polygons & Stars',
    summary: 'Parametric polygon and star shapes that stay editable while animating like any path.',
    section: 'Editor features',
  },
  {
    id: 'grid-and-snapping',
    title: 'Grid & Snapping',
    summary: 'The grid overlay, snapping to grid, elements and artboard centre, and alignment guides.',
    section: 'Editor features',
  },
  {
    id: 'onion-skinning',
    title: 'Onion Skinning',
    summary: 'Ghost frames before and after the playhead for judging arcs and easing.',
    section: 'Editor features',
  },
  {
    id: 'sprite-sheet-export',
    title: 'Sprite-sheet Export',
    summary: 'Exporting frames as a PNG grid plus JSON metadata for game engines and canvas players.',
    section: 'Editor features',
  },
  {
    id: 'scroll-animation',
    title: 'Scroll Animation',
    summary: 'Scroll-driven and play-when-visible animation with ScrollDriver and VisibilityDriver.',
    section: 'Guides',
  },
  {
    id: 'DEPLOYMENT',
    title: 'Deployment',
    summary: 'Building and hosting the editor, and serving the player bundles.',
    section: 'Guides',
  },
]
