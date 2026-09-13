# Editor Guide

The tinyfly visual editor lets you create animations through a graphical interface — no code required. It lives at `/studio` (the site root, `/`, is the tinyfly home page, with **Open the editor** at the top). This guide covers every feature of the editor.

## Editor Layout

The editor is divided into several panels:

```
┌─────────────────────────────────────────────────────┐
│ Header: tinyfly BETA · ? · ⚙ · toolbar               │
├─────────────────────────────────────────────────────┤
│ AI prompt bar  (shown with the AI button)            │
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

Next to the **tinyfly** logo, the header has a **?** button that replays the
onboarding tour and a **⚙ Project Settings** button (project name, canvas size and
background colour; see [Project Settings](#project-settings)). The toolbar follows,
left to right:

- **Project title** — shows the current project's name; **double-click to rename**
  it inline. A `*` means there are unsaved edits.
- **Save** — an explicit save with a live status: **Save** (unsaved) →
  **Saving…** → **Saved ✓**. Auto-save always runs in the background; this button
  is a reassuring, tap-friendly manual save (handy on tablets).
- **New** — start a fresh project (prompts if you have unsaved changes).
- **AI** — show or hide the AI prompt bar, where you describe an animation and
  click **Generate**.
- **My Animations** — open the gallery of every project you've saved (thumbnails,
  open / duplicate / delete). See [Project Management](#project-management).
- **Examples** — every ready-made animation on one page (`/examples`). Open one in
  the editor, or copy the code of a code example into your own page.
- **Export** — open the export dialog: **CSS**, **Lottie**, **GIF**, **WebP**,
  **MP4** (MP4 or WebM, depending on the browser) or **Sprite** sheet. See
  [Export Formats](#export-formats).
- **More** (⋯) — a menu with **Import JSON…**, **Export JSON**, **Embed…**
  (copy-paste embed code), **Docs** (this documentation, in-app) and **Keyboard
  Shortcuts** (or press `?`).

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
| **Path** | Custom SVG path defined by path data (d attribute) — draw one with the ✒️ Pen tool |
| **⬡ Polygon** | Regular polygon; edit the number of **sides** in Properties |
| **★ Star** | Star; edit the number of **points** and the **inner %** in Properties |
| **Group** | Container that groups multiple elements |

Polygon and star are **parametric** paths: change the sides/points/inner ratio in
the Property Panel and the shape regenerates, and they rescale cleanly when you
resize the box. See [polygon-star.md](polygon-star.md).

### Adding Elements

Click an element type in the **Elements** panel on the left (Rectangle, Circle,
Text, Line, Arrow, Path, Image, Audio, Video, or ⬡ Polygon / ★ Star). The element appears at the center of the canvas with default dimensions. You can then:

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

### Pen Tool (draw paths)

In the **DOM** preview, click **✒️ Pen** to draw a custom path:

- **Click** to place anchor points (straight segments).
- **Click-drag** to pull out a smooth bezier curve as you place a point; hold
  **Alt** while dragging a handle for a **corner** (cusp) instead of a smooth point.
- **Drag an existing anchor or handle** to adjust it before finishing.
- With **🧲 Snap** on, pen points snap to the grid, guides, elements, and artboard.
- **Finish**: click the highlighted **first point** to close (filled), or press
  **Enter** / double-click for an open path (stroked). **Backspace** removes the
  last point; **Esc** cancels.

The result is a normal Path element. See [pen-tool.md](pen-tool.md).

### Grid, Snapping, Rulers & Guides

In the **DOM** preview header:

- **▦ Grid** — overlay a 20px grid on the artboard.
- **🧲 Snap** (on by default) — while dragging or resizing, an element's
  edges/centre snap to the grid, to other elements' edges/centres, and to the
  artboard centre, with a **pink guide** showing what caught. Hold **Shift** for
  aspect-lock resize (snapping pauses so the two don't fight).
- **📏 Rulers** — show rulers along the top and left. **Drag out of a ruler** to
  drop a **guide** line (cyan); reposition by dragging, delete by dropping it off
  the stage. Elements snap to your guides too.

Grid, guides, and snapping are **editor-only** — they never appear in the saved
JSON or exports. See [grid-and-snapping.md](grid-and-snapping.md).

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

## Symbols & Library

A **symbol** is a reusable bundle of elements you define once and place many
times. The **Library** panel (bottom of the left sidebar) holds them, shared
across all scenes in the project.

### Create a symbol

1. Select one or more elements on the stage.
2. In the **Library** panel, click **+ Symbol**.

The selected elements are bundled into a new symbol and replaced on the stage
with a single **instance** — it looks identical to what was there.

### Place instances

Click a symbol's thumbnail in the Library to drop another **instance** onto the
current scene. Move and resize an instance like any element; resizing scales the
symbol's contents to fit. Because every instance references the same symbol,
they'll all reflect changes to the definition.

### Edit a symbol (in place)

**Double-click an instance** on the stage, or click the **pencil** on a Library
item, to open the symbol for editing. The stage and timeline switch to the
symbol's own contents, and a **breadcrumb** appears at the top:

```
‹ Scene 1  ▸  🔷 My Symbol      editing symbol — changes apply to all instances
```

Edit the elements and the symbol's own timeline as usual; **every instance
updates** to match. Click the breadcrumb's scene name (or the `‹`) to return to
the scene. Everything auto-saves.

### Manage symbols

- **Rename** — double-click a symbol's name.
- **Delete** — the `×` button. Blocked while instances of it are still in use
  (the `×N` badge shows the instance count).

### Nested animation

A symbol can have its **own timeline**. When it does, every instance **plays that
animation** inside its box as the scene plays — synced to the scene playhead and
looped over the symbol's duration. Combine it with animating the *instance*
(move/scale/rotate the whole thing on the scene timeline) for true nested motion:
the instance travels while its insides animate. Nested playback runs in the
**DOM** preview.

### Symbol swap (lip-sync)

An instance can **swap between several symbols over time** — the primitive behind
lip-sync (mouth shapes) and any "which drawing shows now" effect, no bones needed.
With a symbol instance selected, in the Property Panel's **Symbol Swap** section:

1. Build an ordered **swap set** (add symbols from the Library, reorder with ↑/↓).
2. Click **+ Add swap track** — it adds a `swapIndex` track that steps through the
   set across the timeline.
3. Edit the `swapIndex` keyframes (Dope Sheet / Curves) to time the swaps. The
   instance shows `set[floor(swapIndex)]` at each moment (a plain numeric track
   gives step/hold behaviour).

Symbol swap plays in the **DOM** preview.

### Symbols in export & embeds

Symbol instances render in the **DOM**, **Canvas** and **SVG** previews, and in your output too. **Raster export (GIF / WebP / MP4)** bakes in a symbol's **nested animation and swaps** — the exported file matches
what plays in the preview, including lip-sync. **Embeds, thumbnails and the
Canvas preview** show the symbol's poster frame (static).

> **Embeds now animate symbols** — both single-scene (player) and multi-scene
> sequence (sequencer) embeds run each instance's nested timeline. Still to come:
> **swap** in embeds and instance-opacity compositing in export — see
> [symbols-and-library.md](symbols-and-library.md).

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

For a **⬡ Polygon / ★ Star**, the panel also shows a **Shape** section (Sides /
Points / Inner %) that regenerates the path as you change it.

**🌀 Shape Morph.** For any path, the Properties panel has a Shape Morph section:
pick a target shape (Polygon/Star + points/inner %) and click **Create shape
morph →** to add a `d` track that **tweens the shape** across the timeline. Press
Play to watch it morph — it plays in every preview, export, and embed. See
[shape-morph.md](shape-morph.md).

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
- The **end of the scene** is drawn as a dashed amber line, and everything past it
  is dimmed. Nothing in the dimmed region plays or exports — see
  [Scene duration](#scene-duration) below.

### Scene duration

The readout in the playback bar shows `current / duration` in seconds. **The
duration is editable** — click it, type a new length, press Enter.

Each scene carries its own duration (new scenes start at 2 seconds), and it is
the hard end of the animation: playback stops there, the playhead cannot scrub
past it, and every exporter (GIF, WebP, MP4, sprite sheet, CSS, Lottie) samples
`0 → duration`.

You rarely need to set it by hand, because **the timeline grows to fit your
keyframes**: drag a keyframe to 4s in a 2s scene, or apply a preset that runs
long, and the duration extends to cover it. It never shrinks on its own.

If you *shorten* the duration below your last keyframe, those keyframes stay put
but become unreachable — the track just holds its last in-range value. The
duration turns amber and a **Fit** button appears next to it; click it to snap
the duration back out to the last keyframe. Both are ordinary edits, so
<kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes them.

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

1. In the Track Panel, click **+**
2. Type the **Target**: the element's name as shown in the Elements panel (for
   example `box`)
3. Type the **Property** to animate (for example `opacity` or `x`)
4. Click **Add Track** for a keyframe track. It starts with two keyframes: `0` at
   the start and `1` at the end of the scene, which you then edit.

The same form has **Add Spring** and **Add Inertia**, which create physics tracks
edited by parameters instead of keyframes (see [Spring tracks](#spring-tracks) and
[Throws with inertia](#throws-with-inertia-inertia-tracks)). Click **×** to close
the form.

### Spring tracks

A spring track moves a property from one value to another like a physical spring,
so you set how it feels instead of placing keyframes. It appears as a span on the
timeline. Select it to edit in Properties:

- **Feel** — one-click presets: Gentle, Default, Snappy, Bouncy, Wobbly, Stiff.
- **Values** — From, To and Delay (ms).
- **Physics** — Stiffness (higher is snappier), Damping (higher settles sooner; 0
  oscillates forever), Mass (higher is more sluggish) and an initial Velocity.

The inspector shows how long the spring takes to settle and flags a spring that
overshoots its target.

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

### Looping, speed and direction

The editor has no loop, speed or direction controls. These are playback settings,
chosen where the animation is played:

- **Embed code** passes `loop: -1` (loop forever) to the player; edit it in the
  copied code.
- The **player** accepts `loop` (`0` none, `-1` infinite, or a count), `alternate`
  (ping-pong) and `speed` options. See [API Reference](api-reference.md).
- In **JSON**, the same settings are `config.loop`, `config.alternate`,
  `config.speed` and `config.repeatDelay` on the timeline. See
  [File Format](file-format.md).

## Playback Controls

The playback bar provides:

| Control | Description |
|---------|-------------|
| Undo / Redo | Undo the last change (Ctrl+Z); redo it (Ctrl+Shift+Z or Ctrl+Y) |
| Stop | Stop and return to the beginning |
| Play/Pause | Start or pause playback |
| `current / duration` | The playhead time, and the scene duration in seconds, which you can type into. A **Fit** button appears when keyframes sit past the end. See [Scene duration](#scene-duration) |
| Seek bar | Drag to move the playhead (you can also click the timeline ruler) |

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

### Throws with inertia (inertia tracks)

In the Tracks panel, click **+**, enter a target and a property (for example `x`),
then **Add Inertia**. An inertia track is a throw: it starts with a velocity and
slows under friction until it rests. It appears as a span on the timeline, like a
spring, and is labelled `inertia` in the track list.

Select it to edit in Properties:

- **Throw**: From, Velocity (units per second), Friction (higher stops sooner),
  and Delay.
- **Landing**: Min and Max, and **Snap to**. One number snaps to a grid of that
  size; a list such as `0, 120, 300` snaps to the nearest value. The header shows
  where it comes to rest (marked *snapped* when snapping moved it) and how long
  it takes to settle.

The scene grows automatically to fit the throw. Inertia tracks play in every
preview and bake into keyframes for exports.

### Scramble and type-on (text tracks)

Select a text element and use **🔤 Text Animation** in Properties:

1. Choose **Scramble** (the current text scrambles into new words) or **Type on**.
2. Enter the new text and a duration, then **Add text animation →**. It starts at
   the playhead.

This adds a **text** track (labelled `text` in the track list). Select it to edit:

- **Words** — From, To, and right-to-left.
- **Scramble** — the characters to scramble through (A–Z, a–z, A–z, 0–9, or your own),
  how often they change, how long before they start to settle (reveal delay), and
  whether the length grows or shrinks. **New scramble** picks a different random
  sequence; each sequence is seeded, so it replays identically in previews and exports.
- **Timing** — start, duration and easing.

While a text track exists it decides the element's text (before it starts, the element
shows *From*). Remove the track and the element's own Content shows again. Text tracks
play in every preview and in GIF/WebP/MP4/sprite exports; CSS and Lottie exports leave
them out, since neither can animate text content.

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

## Examples

Every ready-made animation lives on one page. Open it with the **Examples** button
in the toolbar (or go to `/examples`). Cards show a still frame and play while you
hover over them.

There are two kinds of example, and a filter for each:

- **Open in editor** — built in the editor. **Open in editor** loads it into a
  **new project**, so your existing work is never replaced.
- **Code** — for your own page. Timeline examples show their JSON and HTML under
  **View code** and play on DOM or Canvas. **GSAP-style** examples are real `live.to()` code that
  runs on the card while you hover. The code shown is read from the demo's own
  source file, so it is exactly what runs.

### Categories

| Category | Examples |
|----------|---------|
| **GSAP-style** | 41 live `live.to()` demos, grouped below |
| **Showcase** | Draw · Guess · Repeat (vertical promo), Logo Intro, Social Card, Menu Animation |
| **Basics** | Fade in/out, scale pulse, rotation, shape morph |
| **Motion** | Bouncing ball, slide-in, orbit, pendulum, wave, zigzag, motion path |
| **Text** | Letter drop & bounce, fade, slide, scale, bounce, typewriter, wave, glitch, highlight, reveal |
| **UI & Interactions** | Loading spinner, button press, notification, toggle switch, skeleton loader, like, success check |
| **Loaders** | Progress bar, dot spinner, orbit loader |
| **Effects** | Colour morph, particle burst, ripple, confetti, starburst, floating shapes |
| **Data** | Bar chart, number counter |
| **Camera** | Push In, Pan Across, Orbit Reveal |
| **Scroll** | Scroll reveal, parallax, progress bar |
| **Algorisys** | Product showcase demos (TinyFly, YappyDraw, HappyPaint, ProPeak, SkillzEngine) |

The GSAP-style demos cover:

- **Flip layout transitions** — shuffle grid, filter gallery, layout switch, expand tile,
  shared-element gallery (`data-flip-id`).
- **Scroll** — pinned horizontal scroll (`scrollTrigger` with `pin` and `scrub`).
- **Motion paths** — following an SVG path, a path through points, orbits, draw & follow.
- **Shape morphing** — shape morph, icon morph (play/pause), menu morph.
- **Text** — scramble text, typewriter, stats decode, split-text reveal, line mask reveal (`splitText`).
- **Springs, inertia and dragging** — spring release, throw to slots, inertia carousel, friction, swipe cards.
- **Canvas and WebGL** — canvas from object tweens (plain-object targets and `live.ticker`).
- **Timelines and easing** — staggered grid, logo sequence, composed tweens,
  timeline controls, elastic/bounce/steps.
- **Pointer and UI effects** — pointer follow, magnetic button, proximity grid, dock
  magnify, velocity skew, card stack, card flip, infinite marquee, SVG line draw (`drawSVG`).

Above the cards is a **full-page showcase**: an agency-style landing page built from
the same API — masked headline reveal, a pointer-lit canvas on the ticker, a
velocity marquee, scroll-lit copy, a pinned horizontal work section, count-ups,
drawn icons, a shared-element lightbox and springy type. **Open the page** runs it
at `/showcase/agency-landing` on the real window scroll; **Copy code** gives the
whole page as one HTML file.

Every card has a **Copy code** button. It copies a complete, standalone HTML page
for that example (markup, styles, the animation, and a script tag that loads
tinyfly from the jsDelivr GitHub CDN, pinned to the editor's version) that you can
save as a `.html` file and open. For editable examples the animation is the same
as the editor's Embed; for GSAP-style examples it is the demo's code, unchanged.
Scroll code examples also have **Drive it from scroll**, showing how to scrub the
same timeline from scroll position.

Every example also has its own page at `/examples/<id>`. Click its title to open it,
or use **Copy link** there to share it. On its own page an example plays without
hovering and lists more from the same category.

Use the search box to find examples by name, description or tag. Search and filters
are part of the URL, so `/examples?kind=code&category=scroll` links straight to a
filtered view. Examples are a good way to learn: study how they use tracks,
keyframes, and easing to achieve different effects.

## Motion Paths

Motion path animation moves an element along a path you draw.

1. Add a **Path** element (or draw one with the ✒️ Pen tool) and select it.
2. In Properties, find the **Motion Path** section:
   - **Element** — the element to move along this path.
   - **Duration** — how long the trip takes, in ms.
   - **Auto-Rotate** — turn the element to face the direction of travel.
   - **Rotation Offset** — shown with Auto-Rotate; adjusts the facing angle (degrees).
3. Click **Apply Motion Path**.

This adds a `motionPath` track to that element, starting at 0 ms, with two
keyframes that go from `0` (the start of the path) to `1` (the end) with
`ease-in-out`. Edit those keyframes like any other to change the timing or easing,
or add keyframes in between to pause or reverse along the path.

The path is standard SVG path data (the `d` attribute), supporting commands like:
- `M` (move to), `L` (line to), `C` (cubic bezier curve)
- `Q` (quadratic bezier), `A` (arc), `Z` (close path)

## Export & Embed

### Embed Dialog

Choose **More → Embed…** in the toolbar to generate copy-paste code for your website.

**Scope options:**
- **Single Scene** — Embed only the current scene's animation
- **All Scenes (Sequence)** — Embed all scenes with transitions as a sequence

**Format options:**
- **Inline JSON** — Animation data embedded directly in the HTML. Best for small animations.
- **External File** — Animation loads from a separate JSON file. Better for larger animations.

The dialog shows the generated HTML/JavaScript code with a **Copy Code** button. For external file mode, you can also **Download JSON** to get the animation data file.

**Steps to embed:**
1. Build the player: `npm run build:player`
2. Copy `lib/player/tinyfly-player.iife.js` to your project (or load
   `https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.59.0/cdn/tinyfly-player.iife.js`
   instead; see [Deployment](DEPLOYMENT.md))
3. Copy the generated code into your HTML
4. Adjust the script `src` path if needed

### Export Formats

Click **Export** in the toolbar and pick a format:

- **CSS** — Generates CSS `@keyframes` animations
- **Lottie** — Exports bodymovin-compatible Lottie JSON
- **GIF** — A real animated GIF (per-frame palette, transparent background option)
- **WebP** — Animated WebP — smaller and truer in colour than GIF, with full alpha
- **MP4** — video. Pick the codec from the formats your browser supports: MP4
  (H.264) is encoded frame by frame with WebCodecs where available; otherwise MP4 or
  WebM (VP9/VP8) is recorded in real time with MediaRecorder
- **Sprite** — Every frame packed into one **PNG grid** plus a **JSON** metadata
  file (frame size, columns/rows, count, fps) — ready for game engines or a custom
  `<canvas>` player. Alpha is kept when Transparent is on. See
  [sprite-sheet-export.md](sprite-sheet-export.md).

**JSON** export/import lives in the **More** (⋯) menu — the standard tinyfly
format, which can be re-imported. GIF/WebP/MP4/Sprite composite shapes, text,
paths, images, video layers, symbols, **and the camera**.

### Import

Choose **More → Import JSON…** in the toolbar to load a previously exported JSON file. This replaces the current project.

## Renderer Preview

The preview panel supports three rendering modes, switchable via the renderer selector:

- **DOM** — Elements rendered as HTML `<div>` elements with CSS
- **Canvas** — Elements drawn on a `<canvas>` using Canvas 2D API
- **SVG** — Elements rendered as SVG shapes

All three renderers play the same animation — switch between them to verify cross-renderer compatibility.

### Onion skinning

In the **Canvas** renderer, click **🧅 Onion** to show faint **ghost frames**
before and after the playhead — brightest nearest the current time — so you can
see the arc of a move (a bounce, a swing) while editing a single frame. It draws
only while paused and is editor-only (never exported). See
[onion-skinning.md](onion-skinning.md).

### Maximizing the preview

The stage automatically scales up to fill the available preview area. For a much
larger view, click **⛶ Maximize** in the preview header — the preview fills the
whole window with a floating play / stop / exit bar. Press **Esc** (or **Restore**)
to return. Selection and dragging stay pixel-accurate at any scale.

## Camera

A **camera** animates a **pan / zoom / rotate** over the whole stage — cinematic
moves without touching your elements. Click **🎥 Camera** in the preview header to
add one (click again to remove it).

Adding a camera creates four tracks on a reserved **`Camera`** target:

- `x`, `y` — pan the stage
- `scale` — zoom (around the centre)
- `rotate` — rotate (around the centre)

They're seeded at identity with a keyframe at the start and end, so the camera
starts still. There are three ways to author it:

- **Camera inspector.** With a camera present and nothing selected, the Property
  Panel shows a **🎥 Camera** section (Pan X/Y, Zoom, Rotation). Editing a field
  sets a keyframe **at the playhead** — scrub to a time, dial in the framing, done.
  "Reset to identity" and "Remove camera" live there too.
- **On-stage pan.** Click **✋ Pan** in the preview header, then drag the stage to
  pan the camera (also keyframed at the playhead).
- **Timeline lane.** The Camera tracks float to the top of the timeline as a
  distinct **🎥 Camera** lane — keyframe/drag them like any track (e.g. `scale`
  `1`→`2` for a push-in, or `x` across the frame for a pan).

The camera applies in **all previews (DOM/Canvas/SVG)**, **raster export**
(GIF/WebP/MP4/Sprite) and **embeds** (single & multi-scene). Ready-made **Camera**
examples (Push In, Pan Across, Orbit Reveal) are on the Examples page. Tip: set up
your elements first, then keyframe the camera (editing while the camera is mid-move
is approximate for now). See [camera.md](camera.md).

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
or open **Project Settings** (⚙ in the header).

### Project Settings

Open Project Settings (⚙ in the header, next to the logo) to:

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

2. **Study the examples** — Open examples in the editor to learn common patterns. Look at how tracks, keyframes, and easing work together.

3. **Use easing** — Linear animations look mechanical. Use `ease-out` for entrance animations (fast start, gentle landing) and `ease-in` for exits.

4. **Layer your animations** — Combine multiple properties (e.g., opacity + x + rotation) for richer effects.

5. **Use scenes for multi-step animations** — Break complex animations into scenes with transitions between them.

6. **Preview in all renderers** — Switch between DOM, Canvas, and SVG to ensure your animation looks good everywhere.

7. **Export early, test often** — Use the Embed dialog to generate test code and verify your animation works in a real webpage.
