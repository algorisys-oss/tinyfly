# Editor Guide

The tinyfly visual editor lets you create animations through a graphical interface — no code required. This guide covers every feature of the editor.

## Editor Layout

The editor is divided into several panels:

```
┌─────────────────────────────────────────────────────┐
│ Toolbar (top)                                       │
├──────────┬──────────────────────────┬───────────────┤
│ Track    │                          │   Property    │
│ Panel    │     Canvas / Preview     │    Panel      │
│ (left)   │        (center)          │   (right)     │
│          │                          │               │
├──────────┴──────────────────────────┴───────────────┤
│ Scene Bar                                           │
├─────────────────────────────────────────────────────┤
│ Timeline (bottom)                                   │
│ Playback Controls                                   │
└─────────────────────────────────────────────────────┘
```

## Toolbar

The toolbar at the top provides:

- **Shape tools** — Add Rectangle, Circle, or Text elements
- **Line tools** — Add Line or Arrow elements
- **Image** — Add an Image element
- **Path** — Add an SVG Path element
- **Import/Export** — Load or save animation JSON files
- **Embed** — Generate embed code for websites
- **Export** — Export to CSS, Lottie, or GIF formats
- **Project Settings** — Configure project name and canvas size
- **Samples** — Browse and load sample animations
- **Shortcuts** — View keyboard shortcuts (or press `?`)

## Canvas & Elements

### Element Types

| Type | Description |
|------|-------------|
| **Rectangle** | Rectangular shape with fill, stroke, border radius |
| **Circle** | Elliptical shape with fill and stroke |
| **Text** | Text with font, size, weight, alignment controls |
| **Image** | Image element with URL source |
| **Line** | Straight line with stroke and line cap options |
| **Arrow** | Line with arrowhead(s) at start/end |
| **Path** | Custom SVG path defined by path data (d attribute) |
| **Group** | Container that groups multiple elements |

### Adding Elements

Click any shape button in the toolbar. The element appears at the center of the canvas with default dimensions. You can then:

- **Drag** to reposition it on the canvas
- **Resize** using the 8 handles around the element (corners and midpoints)
- **Rotate** using the rotation handle above the element

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
- **Keyframes** are shown as diamonds (◆) on the timeline
- The **playhead** (vertical line) indicates the current time

### Adding Tracks

1. In the Track Panel, click **+ Add Track**
2. Select the target element
3. Select the property to animate

### Adding Keyframes

1. Move the playhead to the desired time
2. Click on a track row at that position to add a keyframe
3. Set the keyframe value in the Property Panel

Alternatively, with an element selected:
1. Move the playhead to the desired time
2. Change a property value in the Property Panel
3. A keyframe is automatically created at the playhead position

### Moving Keyframes

Drag a keyframe diamond left or right to change its time. The keyframe snaps to the nearest millisecond on release.

### Deleting Keyframes

Select a keyframe and press **Delete**, or right-click and choose "Delete Keyframe".

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

**To apply a preset:**
1. Select an element on the canvas
2. Open the Preset Panel
3. Browse by category or scroll through the list
4. Click a preset to apply it to the selected element

The preset creates the appropriate tracks and keyframes automatically.

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

## Project Management

### Auto-Save

Projects auto-save to the browser's LocalStorage as you work. Your animation is preserved between browser sessions.

### Project Settings

Open Project Settings from the toolbar to:

- **Rename** the project
- **Set canvas size** (width and height in pixels)

### New Project

Click "New Project" in the toolbar. You'll be asked to confirm since this replaces the current project.

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
