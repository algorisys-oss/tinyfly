# Editor Guide

The tinyfly visual editor lets you create animations through a graphical interface — no code required. This guide covers every feature of the editor.

## Editor Layout

The editor is divided into several panels:

```
┌─────────────────────────────────────────────────────┐
│ Header: tinyfly BETA · Save · toolbar buttons        │
├─────────────────────────────────────────────────────┤
│ AI prompt bar  (describe → Generate)                 │
├──────────┬──────────────────────────┬───────────────┤
│ Elements │                          │   Property    │
│ + Tracks │     Canvas / Preview     │  + Presets    │
│ (left «) │        (center)          │  (right »)    │
├──────────┴──────────────────────────┴───────────────┤
│ Playback Controls                                    │
├─────────────────────────────────────────────────────┤
│ Scene Bar                                            │
├─────────────────────────────────────────────────────┤
│ Timeline  [ Dope Sheet | Curves ]   zoom −  100%  +  │
└─────────────────────────────────────────────────────┘
```

**Collapsible side panels.** The left (Elements/Tracks) and right
(Properties/Presets) columns each have a `«` / `»` button to hide them and give
the canvas more room; a slim tab on the edge brings a hidden panel back. On
phones/tablets the panels slide in from the edges via the ☰ / ⚙ buttons.

## Toolbar

The header/toolbar at the top provides:

- **Project title** — shows the current project's name; **double-click to rename**
  it inline. A `*` means there are unsaved edits.
- **Save** — an explicit save with a live status: **Save** (unsaved) →
  **Saving…** → **Saved ✓**. Auto-save always runs in the background; this button
  is a reassuring, tap-friendly manual save (handy on tablets).
- **New** — start a fresh project (prompts if you have unsaved changes).
- **My Animations** — open the gallery of every project you've saved (thumbnails,
  open / duplicate / delete). See [Project Management](#project-management).
- **Samples** — browse and load ready-made animations.
- **Gallery** — a separate page of curated example animations (opens `/gallery`).
- **Docs** — open this documentation in-app.
- **Import / Export** — load or save the animation as a JSON file.
- **Export As** — render to **GIF / WebP / MP4 / CSS / Lottie**.
- **Embed** — generate copy-paste embed code for a website.
- **Help / Shortcuts** — keyboard shortcuts (or press `?`); the `?` tour button
  replays the onboarding walkthrough.
- **Project Settings** (gear) — project name, canvas size, and background colour.

Shapes, text, images, video, lines, arrows and paths are added from the
**Elements** panel on the left (see [Adding Elements](#adding-elements)).

## Canvas & Elements

### Element Types

| Type | Description |
|------|-------------|
| **Rectangle** | Rectangular shape with fill, stroke, border radius |
| **Circle** | Elliptical shape with fill and stroke |
| **Text** | Text with font, size, weight, alignment controls |
| **Image** | Image element with URL source |
| **Audio** | Audio clip synced to the timeline (source, start time, volume, mute, loop) |
| **Video** | Video clip synced to the timeline (source, fit, start time, volume, mute, loop) |
| **Line** | Straight line with stroke and line cap options |
| **Arrow** | Line with arrowhead(s) at start/end |
| **Path** | Custom SVG path defined by path data (d attribute) |
| **Group** | Container that groups multiple elements |

### Adding Elements

Click any shape button in the toolbar. The element appears at the center of the canvas with default dimensions. You can then:

- **Drag** to reposition it on the canvas
- **Resize** using the 8 handles around the element (corners and midpoints)
- **Rotate** using the rotation handle above the element

### Audio

Add an **Audio** element to play a sound in time with the animation (background
music, a voiceover, or an effect). It shows as a small speaker badge on the
canvas and does not render visually in the output.

In the property panel you can set:

- **Source** — choose a file (embedded as a data URI) or paste a URL
- **Start (ms)** — the timeline time at which the audio begins
- **Volume**, **Muted**, **Loop**

The clip follows the timeline as you play, pause, and scrub — the timeline stays
the clock, and the audio is kept in sync (drift is corrected as it plays).

A **Video** element works the same way but also renders its frames on the canvas
(with a **Fit** option). Both audio and video are carried into exported/embedded
HTML, where the player discovers them (`[data-tinyfly-media]`) and keeps them in
sync during playback.

### Selecting Elements

- **Click** an element to select it
- **Ctrl+Click** (Cmd+Click on Mac) to toggle multi-selection
- **Ctrl+A** to select all elements
- **Esc** to deselect all
- Click empty canvas area to deselect

### Moving & Transforming

- **Drag** selected elements to move them
- **Arrow keys** nudge elements by 1px
- **Shift+Arrow keys** nudge by 10px
- **Shift+Drag resize handle** for proportionate resize
- **Shift+Rotate** to snap to 15-degree increments

### Copy, Paste & Duplicate

| Shortcut | Action |
|----------|--------|
| Ctrl+C | Copy selected element(s) |
| Ctrl+X | Cut selected element(s) |
| Ctrl+V | Paste element(s) with slight offset |
| Ctrl+D | Duplicate selected element |

### Grouping

Select multiple elements, then:

- **Ctrl+G** — Group selected elements into a single group
- **Ctrl+Shift+G** — Ungroup a selected group

Groups move and transform as a unit.

### Layer Ordering

In the Element Panel (left side), you can reorder layers:

- **Bring to Front** — Move element to the top layer
- **Send to Back** — Move element to the bottom layer
- **Move Up/Down** — Shift element one layer up or down
- **Visibility toggle** — Show/hide an element
- **Lock toggle** — Prevent accidental edits to an element

### Deleting Elements

Select an element and press **Delete** or **Backspace**.

## Property Panel

When an element is selected, the Property Panel on the right shows editable properties:

### Transform Properties

| Property | Description |
|----------|-------------|
| X | Horizontal position in pixels |
| Y | Vertical position in pixels |
| Width | Element width in pixels |
| Height | Element height in pixels |
| Rotation | Rotation angle in degrees |
| Opacity | Transparency, 0 (invisible) to 1 (fully opaque) |

### Appearance Properties

| Property | Description |
|----------|-------------|
| Fill | Fill color (solid color or gradient) |
| Stroke | Border/outline color |
| Stroke Width | Border thickness in pixels |
| Border Radius | Corner rounding for rectangles |

### Gradient Fills

Elements support gradient fills:

- **Linear Gradient** — Color transitions along an angle
- **Radial Gradient** — Color radiates from a center point

To set a gradient:
1. Select an element
2. In the Fill property, switch from solid color to gradient
3. Add color stops and adjust positions
4. Set the gradient angle (linear) or center point (radial)

### Text Properties

For text elements:

| Property | Description |
|----------|-------------|
| Content | The text to display |
| Font Size | Text size in pixels |
| Font Family | Font name (e.g., Arial, Helvetica) |
| Font Weight | Weight: normal (400), bold (700), etc. |
| Text Align | Horizontal alignment: left, center, right |

### Line/Arrow Properties

| Property | Description |
|----------|-------------|
| X2, Y2 | End point coordinates |
| Stroke | Line color |
| Stroke Width | Line thickness |
| Line Cap | Line end style: butt, round, square |
| Start Head | Arrow head at start (arrows only) |
| End Head | Arrow head at end (arrows only) |
| Head Size | Arrow head size (arrows only) |

### Path Properties

| Property | Description |
|----------|-------------|
| Path Data (d) | SVG path data string |
| Fill | Path fill color |
| Stroke | Path outline color |
| Stroke Width | Outline thickness |
| Line Cap | End cap style |
| Line Join | Corner join style: miter, round, bevel |

## Timeline & Keyframes

The timeline panel at the bottom is where you define how properties change over time.

### Timeline Layout

```
Track Panel         │  Time Ruler (milliseconds)
─────────────────── │──0───100───200───300───400───500───
box > opacity       │  ◆─────────────────◆──────────◆
box > x             │  ◆────────────────────────────◆
box > rotation      │  ◆─────◆──────────────────────◆
─────────────────── │─────────────────────────────────
                    │  ▲ Playhead
```

- **Tracks** are listed on the left — each controls one property of one element
- **Keyframes** are shown as diamonds (◆) on the timeline; the **selected** one
  is highlighted (amber). Click one to edit its value in the Property Panel.
- The **playhead** (vertical line) indicates the current time. Click the ruler to
  move it (scrub).

### Two views: Dope Sheet and Curves

A switch at the top-left of the timeline flips between two ways to see the same
keyframes:

- **Dope Sheet** — the classic keyframe grid (diamonds on a time ruler). Best for
  **timing**: when things happen, nudging them earlier/later, copy/paste.
- **Curves** — every *numeric* track (x, y, opacity, scale, rotate, …) is drawn
  as a **value-over-time curve**, with the real easing shown between keyframes.
  Best for **feel**:
  - Drag a point **horizontally** to retime it, **vertically** to change its value.
  - Select a keyframe and drag its **amber easing handles** to shape the
    cubic-bezier between it and the previous keyframe (a named easing becomes a
    custom curve the moment you grab a handle).
  - **Double-click** an empty lane to add a keyframe there.
  - **Ctrl/⌘-click** points to multi-select, or **drag a box** across empty space
    to rubber-band-select every point inside it.
  - **Lanes / Overlay** toggle (top-left of the curve area): *Lanes* gives each
    track its own editable row; *Overlay* draws every curve on one shared axis
    with a colour legend — handy for comparing timing across tracks.

  Non-numeric tracks (colours, motion paths, arrays) can't be a single curve, so
  they're listed at the bottom — edit those in the Dope Sheet.

The Dope Sheet also supports **box (rubber-band) select** — drag across empty
track space to select every keyframe inside the rectangle.

Both views share the playhead, zoom, scroll and selection, so switching never
loses your place. Scene tabs in the **Scene Bar** show a small live **thumbnail**
of each scene so you can tell them apart at a glance.

### Zoom & scroll

- **Zoom**: the **− / 100% / +** control at the top-right of the timeline, or
  **Ctrl/⌘ + scroll** over the timeline (zooms toward the cursor). Click the
  percentage to reset zoom and scroll to the start.
- **Scroll (pan)**: drag the **scrollbar** under the timeline, or **Shift + scroll**
  (or a horizontal trackpad swipe).

### Adding Tracks

1. In the Track Panel, click **+ Add Track**
2. Select the target element
3. Select the property to animate

### Adding Keyframes

There are a few ways:

- **Double-click** a track row (Dope Sheet) or a lane (Curves) at the time you
  want. The new keyframe holds the track's current value at that point (in Curves,
  it takes the value at the height you clicked), so it won't snap to zero.
- With an element selected, move the playhead and **change a value** in the
  Property Panel — a keyframe is created at the playhead automatically.

Then fine-tune the value in the Property Panel (or by dragging in the Curves view).

### Moving Keyframes

Drag a keyframe diamond left or right to change its time. The keyframe snaps to the nearest millisecond on release.

### Selecting Multiple Keyframes

**Ctrl/Cmd-click** keyframes to add or remove them from a selection (across
tracks). Selected keyframes are highlighted.

### Copy, Paste & Delete Keyframes

With one or more keyframes selected:

- **Ctrl/Cmd+C** — copy the selected keyframes
- **Ctrl/Cmd+V** — paste them starting at the playhead (relative timing between
  copied keyframes is preserved; they return to their source tracks). The pasted
  keyframes become the new selection.
- **Delete / Backspace** — remove all selected keyframes

Keyframe shortcuts take precedence while keyframes are selected; otherwise the
same shortcuts act on selected elements.

### Easing Between Keyframes

Each keyframe has an easing setting that controls how the value transitions FROM the previous keyframe TO this one:

- **linear** — Constant speed, no acceleration
- **ease-in** — Starts slow, speeds up (cubic)
- **ease-out** — Starts fast, slows down (cubic)
- **ease-in-out** — Slow start and end, fast middle (cubic)
- **ease-in-quad** — Quadratic ease in (gentler than cubic)
- **ease-out-quad** — Quadratic ease out
- **ease-in-out-quad** — Quadratic ease in-out
- **ease-in-cubic** — Cubic ease in (steeper)
- **ease-out-cubic** — Cubic ease out
- **ease-in-out-cubic** — Cubic ease in-out
- **Custom cubic-bezier** — Define your own curve with the visual curve editor

### Timeline Configuration

In the playback controls area:

| Setting | Description |
|---------|-------------|
| Duration | Total animation length in milliseconds |
| Loop | Number of repetitions: 0 (none), -1 (infinite), or a specific count |
| Speed | Playback speed multiplier (0.5x, 1x, 2x, etc.) |
| Alternate | Ping-pong mode — reverses direction on each loop |

## Playback Controls

The playback bar provides:

| Control | Description |
|---------|-------------|
| Play/Pause | Start or pause animation playback |
| Stop | Stop and reset to the beginning |
| Seek | Click on the time ruler or drag the playhead |
| Speed | Adjust playback speed |
| Reverse | Toggle playback direction |
| Undo | Undo last action (Ctrl+Z) |
| Redo | Redo undone action (Ctrl+Shift+Z or Ctrl+Y) |

## Scenes & Transitions

### Working with Scenes

Scenes are shown in the **Scene Bar** between the canvas and the timeline. Each scene has its own set of elements and its own timeline.

- **Add Scene** — Click the **+** button at the end of the scene bar
- **Switch Scene** — Click a scene tab to switch to it
- **Rename Scene** — Double-click the scene tab name
- **Duplicate Scene** — Right-click a scene tab and select "Duplicate"
- **Delete Scene** — Right-click and select "Delete" (cannot delete the last scene)
- **Reorder Scenes** — Drag scene tabs to rearrange their order

### Scene Transitions

Transitions define how one scene visually transitions into the next. Between scene tabs, you'll see transition indicators.

**Available transition types:**

| Type | Description |
|------|-------------|
| `none` | Instant switch, no animation |
| `fade` | Cross-fade between scenes |
| `slide-left` | New scene slides in from the right |
| `slide-right` | New scene slides in from the left |
| `slide-up` | New scene slides in from the bottom |
| `slide-down` | New scene slides in from the top |

**To set a transition:**

1. Click the transition indicator between two scene tabs, OR
2. Right-click a scene tab (not the first scene) and select "Set Transition..."
3. In the Transition Dialog:
   - Choose the transition type from the dropdown
   - Set the duration in milliseconds (default: 500ms)
   - Preview the effect with the live preview
4. Click "Apply"

The first scene's transition setting is ignored (there's no scene before it to transition from).

When you switch scenes in the editor, you'll see a brief preview of the configured transition animation.

## Animation Presets

The Preset Panel provides ready-made animation templates that you can apply to any selected element with a single click.

### Entrance Animations

| Preset | Duration | Description |
|--------|----------|-------------|
| Fade In | 500ms | Fade from transparent to opaque |
| Fade In Up | 600ms | Fade in while sliding up |
| Fade In Down | 600ms | Fade in while sliding down |
| Slide In Left | 500ms | Slide in from the left edge |
| Slide In Right | 500ms | Slide in from the right edge |
| Scale In | 500ms | Scale up from 0 to full size |

### Emphasis Animations

| Preset | Duration | Description |
|--------|----------|-------------|
| Pulse | 800ms | Scale pulse effect |
| Bounce | 1000ms | Bouncing with scale and vertical movement |
| Shake | 500ms | Horizontal shake effect |
| Spin | 600ms | Full 360-degree rotation |
| Flash | 600ms | Opacity flash effect |

### Exit Animations

| Preset | Duration | Description |
|--------|----------|-------------|
| Fade Out | 500ms | Fade from opaque to transparent |
| Fade Out Down | 600ms | Fade out while sliding down |
| Scale Out | 500ms | Scale down to 0 |

### Motion Animations

| Preset | Duration | Description |
|--------|----------|-------------|
| Float | 2000ms | Gentle vertical floating |
| Swing | 1000ms | Pendulum rotation effect |
| Breathe | 2000ms | Subtle scale breathing |

### Text Animations

| Preset | Duration | Description |
|--------|----------|-------------|
| Text Color Cycle | 2000ms | Smooth color transition |
| Text Glow | 1500ms | Glow effect with shadow |
| Text Bounce In | 800ms | Bounce in with scale |
| Letter Drop & Bounce | 700ms | Letters drop in and bounce (best with per-letter stagger) |
| Letter Cascade Up | 500ms | Letters fade and rise into place |
| Letter Wave | 900ms | A rolling wave travels across the letters |
| Letter Assemble | 650ms | Letters spin and scale in to assemble the word |
| Letter Pop In | 450ms | Letters pop in with a springy overshoot |

**To apply a preset:**
1. Select an element on the canvas
2. Open the Preset Panel
3. Browse by category or scroll through the list
4. Click a preset to apply it to the selected element

The preset creates the appropriate tracks and keyframes automatically.

### Per-letter stagger (text)

Select a **text** element (or multiple elements) and the Preset Panel shows a
**Per-letter stagger** toggle with a delay control. With it enabled, applying a
preset:

- **Splits the text into one element per letter** (like Adobe Animate's "break
  apart"), positioned to match the original layout, then
- **Fans the preset across the letters**, each starting `delay` ms after the
  previous one.

This is how Animate-style **drop & bounce**, **cascade**, and **wave** text
effects are built. The `Text` category includes purpose-built letter presets —
**Letter Drop & Bounce**, **Cascade Up**, **Wave**, **Assemble**, and **Pop
In** — tuned to look their best when staggered. The stagger is pure data (offset
keyframe tracks), so it exports to JSON and plays anywhere the engine runs.

> Tip: with several elements selected, the stagger fans across the selection in
> selection order instead of splitting text — handy for animating rows of
> icons or cards.

### Typewriter (text)

Select a **text** element and the Preset Panel shows a **Typewriter** section.
Set the typing **Speed** (ms per character), optionally enable the **Blinking
cursor**, and click **Apply Typewriter**. This:

- Splits the text into letters, then reveals each one instantly in sequence
  (a crisp character-by-character type-on, not a fade),
- Optionally adds a thin cursor element that **steps to each letter as it is
  typed** and blinks, and
- **Extends the timeline automatically** to fit the full reveal plus the cursor
  hold.

Like everything else, the result is plain keyframe tracks — it exports to JSON
and plays anywhere the engine runs.

### Reveal / mask wipe

The **Entrance** category includes **Reveal Right / Left / Up / Down** presets.
These animate a clip-inset that wipes the element into view like a mask — no
extra layer required. Reveal works on any element (text, shapes, images) and is
rendered consistently across the DOM, SVG, and Canvas renderers.

Combine a Reveal preset with **Per-letter stagger** to get a cascading,
letter-by-letter mask reveal (each glyph wipes in a moment after the last).

### Filters (blur, glow, drop-shadow)

Elements support animatable filter properties, composed the same way across the
DOM, SVG, and Canvas renderers:

- `blur` (px) — used by the **Blur In** entrance preset (sharpen into focus)
- `glow` (+ `glowColor`) — a coloured halo; used by **Glow Pulse**
- `shadowX` / `shadowY` / `shadowBlur` (+ `shadowColor`) — used by **Drop Shadow**

### Shine sweep

The **Shine Sweep** text preset sends a bright highlight travelling across the
text, clipped to the glyph shapes (like a metallic sheen). The base text colour
stays visible underneath. Shine renders on the DOM, SVG, and Canvas renderers.

## Sample Animations

Tinyfly includes 42 sample animations organized into 6 categories. Access them from the **Samples** button in the toolbar.

### Categories

| Category | Count | Examples |
|----------|-------|---------|
| **Basic** | 4 | Fade in/out, scale pulse, rotation, morph |
| **Motion** | 7 | Bounce, slide-in, orbit, pendulum, wave, zigzag, motion path |
| **Text** | 12 | Text fade, slide, scale, bounce, typewriter, wave, glitch, highlight |
| **UI** | 7 | Button hover, loader spinner, progress bar, notification, modal, tooltip, menu |
| **Effects** | 5 | Glow pulse, shake, parallax, particle burst, color cycle |
| **Showcase** | 5 | Logo reveal, hero animation, card flip, scroll indicator, call to action |

Loading a sample replaces your current project. Samples are a great way to learn animation techniques — study how they use tracks, keyframes, and easing to achieve different effects.

## Motion Paths

Motion path animation lets you move an element along a custom SVG path.

1. Add a Path element to your canvas (or define a path in the track)
2. The motion path track uses a `motionPath` property with progress keyframes (0 to 1)
3. Enable **auto-rotate** to make the element face the direction of travel
4. Set a **rotation offset** to adjust the facing angle

Motion paths are defined using standard SVG path data (`d` attribute), supporting commands like:
- `M` (move to), `L` (line to), `C` (cubic bezier curve)
- `Q` (quadratic bezier), `A` (arc), `Z` (close path)

## Export & Embed

### Embed Dialog

Click **Embed** in the toolbar to generate copy-paste code for your website.

**Scope options:**
- **Single Scene** — Embed only the current scene's animation
- **All Scenes (Sequence)** — Embed all scenes with transitions as a sequence

**Format options:**
- **Inline JSON** — Animation data embedded directly in the HTML. Best for small animations.
- **External File** — Animation loads from a separate JSON file. Better for larger animations.

The dialog shows the generated HTML/JavaScript code with a **Copy Code** button. For external file mode, you can also **Download JSON** to get the animation data file.

**Steps to embed:**
1. Build the player: `npm run build:player`
2. Copy `dist/player/tinyfly-player.iife.js` to your project
3. Copy the generated code into your HTML
4. Adjust the script `src` path if needed

### Export Formats

Click **Export** in the toolbar for additional formats:

- **JSON** — Standard tinyfly animation format (can be re-imported)
- **CSS** — Generates CSS `@keyframes` animations
- **Lottie** — Exports bodymovin-compatible Lottie JSON
- **GIF** — Extracts frames for GIF creation

### Import

Click **Import** in the toolbar to load a previously exported JSON file. This replaces the current project.

## Renderer Preview

The preview panel supports three rendering modes, switchable via the renderer selector:

- **DOM** — Elements rendered as HTML `<div>` elements with CSS
- **Canvas** — Elements drawn on a `<canvas>` using Canvas 2D API
- **SVG** — Elements rendered as SVG shapes

All three renderers play the same animation — switch between them to verify cross-renderer compatibility.

### Maximizing the preview

The stage automatically scales up to fill the available preview area. For a much
larger view, click **⛶ Maximize** in the preview header — the preview fills the
whole window with a floating play / stop / exit bar. Press **Esc** (or **Restore**)
to return. Selection and dragging stay pixel-accurate at any scale.

## Project Management

### Saving & auto-save

tinyfly saves continuously — like Google Docs, there's no "save or lose it":

- **Auto-save.** Every edit is written to the browser's **IndexedDB** a moment
  after you make it. The `*` next to the title means a save is pending; it clears
  once written. Nothing is uploaded — it's all local to your browser.
- **Explicit Save.** The **Save** button shows **Save / Saving… / Saved ✓** and
  lets you force a save any time (nice on touch devices). It's optional — auto-save
  already has you covered.
- **On close.** The latest edit is flushed when you close or reload the tab, so a
  fast reload can't lose your last change.

Projects made before this used a single LocalStorage slot; those are migrated
into IndexedDB automatically the first time you open the new version.

### My Animations (the gallery)

Click **My Animations** in the toolbar to see **every project you've made** as a
grid of cards, each with a live thumbnail and "last modified" time:

- **Open** — click a card to keep editing it (the one you're on is badged).
- **Duplicate** — make a copy to experiment safely.
- **Delete** — remove one (with a confirm).
- **New** — start a fresh project from the gallery.

### Renaming

Two ways: **double-click the project title** in the toolbar to rename it inline,
or open **Project Settings** (gear icon).

### Project Settings

Open Project Settings (gear icon) from the toolbar to:

- **Rename** the project
- **Set canvas size** (width and height in pixels)
- **Set the artboard background** colour (also the default background for GIF/
  WebP/MP4 export)

### New Project

Click **New** in the toolbar. If you have unsaved changes you'll be asked whether
to save first. Your previous project isn't lost — it stays in **My Animations**.

## Keyboard Shortcuts

### General

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+Y | Redo (alternate) |
| ? | Show keyboard shortcuts |

### Selection

| Shortcut | Action |
|----------|--------|
| Ctrl+A | Select all elements |
| Ctrl+Click | Toggle multi-selection |
| Esc | Deselect all |

### Elements

| Shortcut | Action |
|----------|--------|
| Delete / Backspace | Delete selected element(s) |
| Ctrl+D | Duplicate element |
| Ctrl+C | Copy element(s) |
| Ctrl+X | Cut element(s) |
| Ctrl+V | Paste element(s) |
| Ctrl+G | Group selected elements |
| Ctrl+Shift+G | Ungroup |

### Transform

| Shortcut | Action |
|----------|--------|
| Arrow keys | Nudge element 1px |
| Shift+Arrow | Nudge element 10px |
| Shift+Resize | Proportionate resize |
| Shift+Rotate | Snap to 15-degree increments |

> **Mac users:** Replace Ctrl with Cmd for all shortcuts.

## Tips & Workflow

1. **Start with presets** — Apply a preset to quickly set up tracks and keyframes, then customize from there.

2. **Study the samples** — Load sample animations to learn common patterns. Look at how tracks, keyframes, and easing work together.

3. **Use easing** — Linear animations look mechanical. Use `ease-out` for entrance animations (fast start, gentle landing) and `ease-in` for exits.

4. **Layer your animations** — Combine multiple properties (e.g., opacity + x + rotation) for richer effects.

5. **Use scenes for multi-step animations** — Break complex animations into scenes with transitions between them.

6. **Preview in all renderers** — Switch between DOM, Canvas, and SVG to ensure your animation looks good everywhere.

7. **Export early, test often** — Use the Embed dialog to generate test code and verify your animation works in a real webpage.
