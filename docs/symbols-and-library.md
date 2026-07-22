# Symbols + Library — Phase A design

**Status:** In progress (foundation landing incrementally)
**Date:** 2026-07-22
**Roadmap:** [2d-animation-roadmap.md](2d-animation-roadmap.md) → Phase A

Symbols make a bundle of elements **reusable**: define once, place many instances,
edit-once-update-everywhere. It's the highest-leverage Adobe-Animate-parity
feature and stays true to tinyfly's JSON-first, loosely-coupled design — a symbol
is just a small self-contained scene, and an instance is just an element that
references it.

---

## Data model

A **symbol definition** is a self-contained mini-scene (its own elements +
optional internal timeline), stored on the **project** so it's shared across all
scenes:

```ts
interface SymbolDefinition {
  id: string
  name: string
  /** Intrinsic size; instances scale from this into their placement box. */
  width: number
  height: number
  elements: SceneElement[]          // the symbol's own contents
  timeline: TimelineDefinition | null  // the symbol's own (nested) animation
  created: number
  modified: number
}

interface Project {
  // …existing fields…
  symbols: SymbolDefinition[]       // the Library
}
```

A **symbol instance** is a new scene-element type. Its base transform
(`x, y, width, height, rotation, opacity`) places and sizes the instance; the
symbol's contents render scaled from the symbol's intrinsic size into that box:

```ts
type ElementType = /* …existing… */ | 'symbol'

interface SymbolInstanceElement extends BaseElement {
  type: 'symbol'
  symbolId: string                  // → SymbolDefinition.id
  /** Reserved for later per-instance property overrides / symbol-swap. */
  overrides?: Record<string, unknown>
}
```

Everything remains plain JSON and serializes with the project exactly like scenes
do — no engine change is required to *store* symbols.

---

## Why on the project (not the scene)

Symbols are reusable across scenes (a "button" symbol used on every scene), so the
Library belongs to the project. Instances live inside scenes like any other
element. Deleting a symbol that still has instances is guarded (warn / block).

---

## Rendering an instance

An instance renders like a `group`: expand the symbol's `elements`, transformed
into the instance's box (translate to `x,y`, scale `width/symbol.width` ×
`height/symbol.height`, then rotate/opacity from the instance). This reuses the
existing per-element renderers in the preview and the DOM/Canvas/SVG adapters.

- **Static first:** render the symbol's elements at their base values (the poster
  frame). Editing the symbol updates every instance immediately.
- **Nested timeline next:** play the symbol's own timeline relative to the
  instance. Deterministic and still JSON — the engine composes the nested tracks.

---

## Editing: "edit in place"

Double-clicking an instance enters the symbol: the stage shows the symbol's
contents, the timeline shows the symbol's tracks, and a **breadcrumb**
(`Scene ▸ SymbolName`) returns to the parent scene. The parent scene is dimmed.
Changes affect the definition, so all instances update.

---

## Lip-sync for free

Because an instance references a symbol by id, a **symbol-swap** track (change
`symbolId` / an override per keyframe) gives mouth-shape swapping and similar
"which drawing shows now" workflows **without a bone system** — a genuinely
on-brand shortcut.

---

## Implementation slices

1. **Foundation (this slice):** types (`SymbolDefinition`, `SymbolInstanceElement`,
   `'symbol'` element type), `project.symbols` + migration, project-store Library
   methods (`createSymbol`, `getSymbols`, `getSymbol`, `renameSymbol`,
   `deleteSymbol`, `symbolInstanceCount`), serialization, and unit tests. No UI
   yet — the model is proven in isolation.
2. **Convert & place:** "Convert to Symbol" command (bundle selection → symbol +
   replace with an instance) and a Library panel (list, place instance).
3. **Render:** expand instances in the preview + DOM/Canvas/SVG adapters (static
   poster frame).
4. **Edit-in-place:** breadcrumb + nested-timeline editing.
5. **Nested playback + symbol-swap:** compose the symbol's timeline at play time;
   symbol-swap track for lip-sync.

---

## Store API (foundation)

```ts
createSymbol(name, elements, opts?): SymbolDefinition   // add to the Library
getSymbols(): SymbolDefinition[]
getSymbol(id): SymbolDefinition | undefined
renameSymbol(id, name): void
deleteSymbol(id): boolean                                // guarded if instances exist
symbolInstanceCount(id): number                          // across all scenes
```

Instances are created by the "Convert to Symbol" / "Place instance" flows (slice
2), which add a `type: 'symbol'` element via the scene store.

---

## Non-goals (Phase A)

- Bone/IK rigging (see roadmap — out of scope).
- Deep per-property instance overrides beyond transform + symbol-swap (later).
- Recursive symbols-in-symbols beyond a sane depth guard.
