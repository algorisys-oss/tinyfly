import type { CustomTarget } from '../../adapters/canvas/canvas-adapter'
import { unknownName } from '../../engine/authoring/did-you-mean'
import type { Track } from '../../engine/types'
import type { EditOptions } from './edit-log'
import type { FlingOptions, SurfacePiece, TimedPoint } from './pieces'
import type { SurfaceBox } from './surface-box'

/**
 * A surface: a scene object figures act on. A code panel is one; boards,
 * charts and stateful props follow the same contract.
 *
 * Its places are named by strings, `kind:args`, so a beat can aim at one as
 * plain data: `line:7` and `token:7:Println` on a code panel. `anchor(name)`
 * gives the box there (stand on `top`, point at `x`, `y`), `piece(name)`
 * makes the part there come loose, and `edit(name, anchor, options)` changes
 * the surface at a time. Every edit is recorded as keys on the surface's own
 * props and written out by `tracks()`, so the same calls always give the
 * same tracks.
 *
 * ```ts
 * const code = codePanel({ code: source, language: 'go', x: 40, y: 30 })
 * code.anchor('token:4:Println')                        // where the word is
 * code.edit('highlight', 'line:4', { at: 1200 })
 * code.edit('fling', 'token:4:Println', { at: 2000 })   // knocked off the panel
 * ```
 */
export interface Surface {
  /** What it is: 'code', 'board', 'chart'… */
  readonly kind: string
  /** The canvas target that draws it; put it in the scene's targets */
  readonly target: CustomTarget
  /** The whole surface */
  readonly box: SurfaceBox
  /** Its anchors and edits, said as data (for the capability catalog and the checks) */
  readonly about: SurfaceAbout
  /** The box at a named place (see `about.anchors`), at `time` (default: after every edit) */
  anchor(name: string, time?: number): SurfaceBox
  /** Make the part at a named place a piece that can come loose (the same piece each time it is asked for) */
  piece(anchor: string): SurfacePiece
  /** Change the surface at a time: `name` is one of `about.edits`, `anchor` one place or several */
  edit(name: string, anchor: string | string[], options: SurfaceEditOptions): Surface
  /** Carry a piece along a path of scene points (its centre follows them) */
  follow(piece: SurfacePiece, path: TimedPoint[]): Surface
  /** Throw or kick a piece away: it flies on a ballistic arc, spinning, and fades */
  fling(piece: SurfacePiece, options: FlingOptions): Surface
  /** Move a piece's centre to a scene point */
  move(piece: SurfacePiece, options: EditOptions & { to: { x: number; y: number } }): Surface
  /** A figure's tracks with it carried along by what it stands on; `ground` is the script's `ground` */
  ride(tracks: Track[], target: string, options: { ground: number; every?: number }): Track[]
  /** The recorded edits as tracks on `target` (the surface's key in the scene) */
  tracks(target: string): Track[]
}

/** An edit's options: when, plus what that edit takes (see `about.edits`). */
export type SurfaceEditOptions = EditOptions & Record<string, unknown>

/** A surface's anchors and edits, as data. */
export interface SurfaceAbout {
  kind: string
  /** How to make one */
  create?: string
  /** Anchor patterns, such as `line:N`, and what each names */
  anchors: Record<string, string>
  /** Edit names, with the anchors and options each takes */
  edits: Record<string, string>
}

/** An anchor name split into its kind and the rest: `token:7:Println` → `token`, `7:Println`. */
export function parseAnchor(name: string): { kind: string; rest: string } {
  const colon = name.indexOf(':')
  return colon < 0 ? { kind: name, rest: '' } : { kind: name.slice(0, colon), rest: name.slice(colon + 1) }
}

/** The error for an anchor a surface does not have, naming the ones it does. */
export function anchorError(owner: string, name: string, about: SurfaceAbout, why?: string): Error {
  const kinds = Object.keys(about.anchors).map((pattern) => parseAnchor(pattern).kind)
  const { kind } = parseAnchor(name)
  if (!kinds.includes(kind)) return new Error(`${owner}: ${unknownName('anchor', kind, kinds)} (anchors: ${Object.keys(about.anchors).join(', ')})`)
  return new Error(`${owner}: no anchor "${name}"${why ? `: ${why}` : ''} (anchors: ${Object.keys(about.anchors).join(', ')})`)
}

/** The error for an edit a surface does not have. */
export function editError(owner: string, name: string, about: SurfaceAbout): Error {
  return new Error(`${owner}.edit: ${unknownName('edit', name, Object.keys(about.edits))}`)
}
