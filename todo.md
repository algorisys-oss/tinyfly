# tinyfly Development Progress

## Phase 1: Core Engine ✓

- [x] Set up Vite + SolidJS + TypeScript project
- [x] Set up Vitest testing framework
- [x] Define core types (Timeline, Track, Keyframe, AnimationState)
- [x] Implement easing functions (linear, quad, cubic)
- [x] Implement interpolators (number, color, array)
- [x] Build Clock/time management (RAF + Manual)
- [x] Build Track with keyframe interpolation
- [x] Build Timeline with playback controls
  - [x] play/pause/stop/seek/reverse
  - [x] Looping (finite and infinite)
  - [x] Alternate direction (ping-pong)
  - [x] Speed control
- [x] Add JSON serialization (import/export)

## Phase 2: Adapters ✓

- [x] DOM adapter (CSS styles, transforms)
- [x] Canvas adapter (rect, circle shapes)
- [x] SVG adapter (attributes, transforms)

## Phase 3: Editor UI (SolidJS) ✓

- [x] Editor store (state management)
- [x] Timeline visualization component
- [x] Playback controls (play/pause/stop/seek)
- [x] Preview panel with DOM adapter
- [x] Keyframe editor (property inspector)
- [x] Track management UI (add/remove tracks)

## Phase 4: Undo/Redo ✓

- [x] History store with push/undo/redo/batch operations
- [x] Editor store integration (track/keyframe mutations)
- [x] Undo/redo buttons in playback controls
- [x] Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)

## Phase 5: Export/Import ✓

- [x] Export timeline as JSON file download
- [x] Import timeline from JSON file
- [x] Toolbar component with import/export buttons
- [x] Clear history on import (fresh start)

## Phase 6: Drag Keyframes ✓

- [x] Mouse drag to reposition keyframes on timeline
- [x] Real-time visual feedback during drag
- [x] Snap to nearest millisecond on release
- [x] History integration (undo/redo works with drags)

## Phase 7: Project Management ✓

- [x] Project store with LocalStorage persistence
- [x] Project metadata (name, canvas size, created/modified)
- [x] New Project button with confirmation dialog
- [x] Project settings dialog (rename, canvas dimensions)
- [x] Auto-save to LocalStorage on changes
- [x] Load/restore projects from LocalStorage

## Phase 8: Embeddable Player ✓

- [x] TinyflyPlayer class for runtime playback
- [x] Auto-register targets by data-tinyfly attribute, class, or id
- [x] Simple play() helper function for quick embedding
- [x] Embed dialog with copy-paste code generation
- [x] Inline JSON and external file embed options
- [x] Player supports all playback controls (play/pause/seek/speed)

## Phase 9: Multiple Preview Elements ✓

- [x] Scene store for element management
- [x] Element types: rect, circle, text
- [x] Element library UI (add/remove/reorder)
- [x] Dynamic preview panel rendering
- [x] Element selection in preview
- [x] Property panel for element editing
  - [x] Transform properties (x, y, width, height, rotation, opacity)
  - [x] Appearance properties (fill, stroke, strokeWidth, borderRadius)
  - [x] Text properties (content, fontSize, fontFamily, fontWeight, textAlign)
- [x] Layer ordering controls (up/down/top/bottom)
- [x] Element visibility and lock toggles
- [x] Element duplication

## Phase 10: Additional Elements ✓

- [x] Line element (x, y, x2, y2, stroke, strokeWidth, lineCap)
- [x] Arrow element (startHead, endHead, headSize)
- [x] Image element (src, objectFit)
- [x] Color animation support for fill/stroke properties

## Phase 11: Element Grouping ✓

- [x] Multi-selection with Ctrl/Cmd+click
- [x] Group selected elements into a group
- [x] Ungroup to restore individual elements
- [x] Group rendering with child elements

## Phase 12: Canvas Interaction ✓

- [x] Drag elements on canvas to reposition
- [x] Resize handles on selected elements (8 handles for shapes, 2 endpoints for line/arrow)
- [x] Rotation handle for elements (hold Shift to snap to 15° increments)

## Phase 13: Keyboard Shortcuts ✓

- [x] Delete/Backspace key for element deletion
- [x] Ctrl+D for duplicate element
- [x] Ctrl+G for group, Ctrl+Shift+G for ungroup
- [x] Arrow keys for nudging (1px, 10px with Shift)

## Phase 14: Copy/Paste ✓

- [x] Copy elements to internal clipboard (Ctrl+C)
- [x] Cut elements (Ctrl+X) - copy and remove
- [x] Paste elements with offset (Ctrl+V)
- [x] Multi-element copy/paste support

## Phase 15: Animation Presets ✓

- [x] Preset definitions (entrance, emphasis, exit, motion categories)
- [x] 17 presets: fade in/out, slide, scale, pulse, bounce, shake, spin, flash, float, swing, breathe
- [x] Preset panel UI with category tabs
- [x] Apply preset to selected element
- [x] applyPreset method in editor store

## Phase 16: Path/Bezier Element ✓

- [x] PathElement type with SVG path data (d attribute)
- [x] Fill, stroke, strokeWidth, lineCap, lineJoin properties
- [x] Path rendering in preview panel using SVG
- [x] Path property editing in property panel
- [x] Path support in embed dialog export

## Phase 17: Gradient Fills ✓

- [x] Gradient types (LinearGradient, RadialGradient)
- [x] FillValue union type (string | Gradient)
- [x] Gradient helper functions (isGradient, fillToCss, create*)
- [x] Gradient UI in property panel with color stops
- [x] Support for rect, circle, and path elements

## Phase 18: Enhanced Canvas Adapter ✓

- [x] Text target support (font, alignment, baseline)
- [x] Line target support (x2, y2, lineCap)
- [x] Path target support (SVG path data via Path2D)
- [x] Image target support (CanvasImageSource)
- [x] Linear gradient fill support
- [x] Radial gradient fill support
- [x] Border radius support for rectangles
- [x] Static loadImage helper method

## Phase 19: Export Formats ✓

- [x] CSS animations exporter (@keyframes, animation properties)
- [x] Easing to CSS timing function mapping
- [x] Transform property combination (translateX, rotate, scale)
- [x] Minification support for CSS output
- [x] Lottie JSON exporter (bodymovin-compatible)
- [x] Animated transform properties (position, rotation, scale, opacity)
- [x] GIF exporter with frame extraction
- [x] Simple LZW encoder for GIF compression
- [x] Color quantization for palette-based GIF

## All Core Features Complete ✓

---

## Phase 20: Polish & UX ✓

- [x] Add more sample animations (14 new samples added)
- [x] Add onboarding/help tooltips
- [x] Improve mobile responsiveness
- [x] Keyboard shortcuts help dialog
- [x] Ctrl+A should select all elements on canvas (not text)
- [x] Shift+resize should resize elements proportionately
- [x] Test motion path animation thoroughly (center alignment, full path coverage)
- [x] Renderer switcher (DOM/Canvas/SVG) in preview panel

## Phase 21: Advanced Features

- [ ] Audio/video sync support
- [x] Motion path (animate along SVG path)
- [ ] Mask/clip support
- [ ] Multiple scenes/artboards
- [ ] Collaborative editing
- [x] Custom easing curve editor

## Phase 22: Distribution

- [ ] NPM package for the engine
- [ ] Documentation site
- [x] Example gallery (14 professional examples with DOM/Canvas renderer toggle)
- [ ] CDN hosted player script

---

## Test Coverage

- 370 tests passing
- Easing functions: 48 tests
- Interpolators: 21 tests
- Clock: 19 tests
- Track: 14 tests
- Timeline: 33 tests
- JSON serialization: 12 tests
- DOM adapter: 16 tests
- Canvas adapter: 25 tests
- SVG adapter: 16 tests
- History store: 14 tests
- Project store: 29 tests
- Player: 30 tests
- Scene store: 45 tests
- Animation presets: 18 tests
- CSS export: 10 tests
- Lottie export: 10 tests
- GIF export: 10 tests
