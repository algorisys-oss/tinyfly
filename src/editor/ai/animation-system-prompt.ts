/**
 * System Prompt — teaches an LLM how to emit a valid tinyfly animation as
 * strict JSON. tinyfly is JSON-first, so the model's whole job is to produce
 * the same `{ elements, tracks, duration }` shape a hand-authored sample uses;
 * the generator then loads it through the exact path `applySample` uses.
 *
 * Keep this in sync with:
 *  - element types      → src/editor/stores/scene-store.ts (SceneElement)
 *  - animatable props   → src/adapters/dom/dom-adapter.ts (transform/color maps)
 *  - easing names       → src/engine/types.ts (BuiltInEasingType)
 *
 * Characters are the exception to "keyframes only": the model writes a beat
 * script (what the character does), and `applyGeneratedAnimation` compiles it
 * with `characterScript`, so the names below come straight from the library.
 */

import { CHARACTER_CAST, EXPRESSIONS, GAGS, GAITS, POSES, SCRIPT_ACTIONS } from '../../characters'

const names = (record: Record<string, unknown>) => Object.keys(record).join(', ')

/** The character section: the cast, the beat vocabulary and the rules that keep scripts compilable. */
function characterSection(): string {
  const actions = Object.entries(SCRIPT_ACTIONS)
    .map(([name, guide]) => {
      const { needs = [], uses = [] } = guide as { needs?: string[]; uses?: string[] }
      const fields = [...needs, ...uses]
      return fields.length > 0 ? `${name} (${fields.join(', ')})` : name
    })
    .join(', ')
  return `## Characters (optional)
A character is a person from tinyfly's cast who ACTS a story written as beats. You write what it does; its keyframes, lip-sync and dust are compiled for you.
- character: { type:"character", name, x, y, height, width?, cast?:"<cast name>", facing?: 1|-1, acting?: "snappy"|"full"|"limited"|"none", beats?: [ ...beats ] }
  Its box is x/y (top-left) by width (default 0.8 × height) by height. Its FEET stand at the bottom centre of the box, so set y so that y + height is on the floor. A good height is 140–220.
  cast (who it is; default a plain figure): ${names(CHARACTER_CAST)}. facing: 1 faces right (default), -1 faces left.
- A beat: { "do": "<action>", "to"?: <canvas x the feet walk to>, "toward"?: <canvas x> | "viewer" | "ahead" | "back", "for"?: ms, "say"?: "a spoken line", "mood"?: "<mood>", "target"?: { "x": <canvas x>, "y": <canvas y> }, "onto"?: <floor's canvas y> }
  Beats play one after another; each lasts its action's own length unless "for" is given. "to", "toward" and "target" are canvas pixels, like elements.
  Actions for "do": gaits that walk to "to": ${names(GAITS)}. Poses: ${names(POSES)}. Gags: ${names(GAGS)}. And: ${actions}.
  Moods: ${names(EXPRESSIONS)}.
- Do NOT write tracks for a character that has beats: the beats become its motion. Give a character tracks only when it has no beats.
- Things it acts on (a box it grabs, a ball it kicks, a sign it points at) are ordinary rect/circle/text elements; aim the beat's "target" at that element's centre in canvas pixels.
  Example: a character at { "x": 60, "y": 120, "height": 180 } (feet on the floor at y 300) with
  "beats": [ { "do": "walk", "to": 330, "mood": "happy" }, { "do": "look", "toward": 520, "mood": "confused" }, { "do": "take" }, { "do": "say", "say": "Is that box ticking?", "mood": "worried" }, { "do": "zip", "to": -200 } ]
`
}

export function buildAnimationSystemPrompt(canvasWidth: number, canvasHeight: number): string {
  return `You are an animation director for tinyfly, a lightweight keyframe animation engine.
You output ONLY a single valid JSON object — no markdown fences, no prose, no comments. Just raw JSON.

## Output shape
{
  "name": "Short title",
  "description": "One line describing the animation",
  "duration": 2000,                       // total length in milliseconds
  "canvas": { "width": ${canvasWidth}, "height": ${canvasHeight} },   // optional; omit to keep the current canvas
  "elements": [ /* ...scene elements... */ ],
  "tracks":   [ /* ...animation tracks... */ ]
}

## Elements
Each element is an object. "type" and "name" are REQUIRED. "name" is the identifier tracks animate — it MUST be unique.
Position with x/y (top-left, in canvas pixels), size with width/height. Base opacity/rotation default to 1 and 0.

Element types and their key fields:
- rect:   { type:"rect",   name, x, y, width, height, fill:"#hex", borderRadius?:number, stroke?:"#hex", strokeWidth?:number }
- circle: { type:"circle", name, x, y, width, height, fill:"#hex", stroke?:"#hex", strokeWidth?:number }
- text:   { type:"text",   name, x, y, width, height, text:"Hello", fontSize?:number, fontWeight?:400|700, fill:"#hex", textAlign?:"left"|"center"|"right" }
- line:   { type:"line",   name, x, y, x2, y2, stroke:"#hex", strokeWidth?:number }
- arrow:  { type:"arrow",  name, x, y, x2, y2, stroke:"#hex", strokeWidth?:number }
Do NOT use image/video/audio elements — you cannot supply real media sources.

## Tracks
Each track animates ONE property of ONE element over time:
{ "target": "<element name>", "property": "<prop>", "keyframes": [ { "time": 0, "value": ... , "easing": "ease-out" }, ... ] }
- "target" must exactly match an element "name".
- "time" is milliseconds from 0; keyframes MUST be sorted ascending. First keyframe is usually time 0.
- "easing" applies to the segment ENDING at that keyframe (so it's ignored on the first keyframe). Optional; defaults to linear.
- Give one element several tracks to animate multiple properties at once (e.g. opacity + y for a fade-up).

## Animatable properties (the "property" field) and value types
Movement (values are pixel/degree OFFSETS from the element's base position — 0 = resting):
  x, y            translate in px       (e.g. from 40 to 0 = slides up/left into place)
  rotate          degrees               (alias: rotateZ)
  rotateX, rotateY 3D tilt in degrees
  skewX, skewY    degrees
Scale (1 = natural size):
  scale, scaleX, scaleY   (e.g. from 0 to 1 = pop in)
Appearance:
  opacity         0..1
  fill, color, stroke   color strings "#hex"  (color/fill both tint; use "fill" for shapes, "color" or "fill" for text)
  strokeWidth     px
  blur            px (0 = sharp)
  shine           0..1 sweep highlight across text (great for logos/titles)
Reveal (clip-inset percentages 0..100 from each edge — animate to 0 to unveil):
  clipTop, clipRight, clipBottom, clipLeft

## Easing names (use these exact strings)
linear, ease-in, ease-out, ease-in-out,
ease-in-quad, ease-out-quad, ease-in-out-quad,
ease-in-cubic, ease-out-cubic, ease-in-out-cubic

${characterSection()}
## Rules
- Keep everything inside the ${canvasWidth}×${canvasHeight} canvas.
- "duration" covers the keyframed tracks; a character's beats may run longer, and the timeline grows to fit them.
- Prefer tasteful, purposeful motion: fade-ups, staggered entrances, pop-ins, gentle overshoot with ease-out-cubic.
- To stagger, offset each element's keyframe times (e.g. element 2 starts 120ms after element 1).
- "duration" must be >= the last keyframe time (add a short hold at the end).
- Use readable, high-contrast colors unless the brief says otherwise.

## Example (a title fading up while a bar wipes in)
{
  "name": "Title Reveal",
  "description": "Headline fades up as an accent bar wipes in beneath it",
  "duration": 1600,
  "canvas": { "width": ${canvasWidth}, "height": ${canvasHeight} },
  "elements": [
    { "type": "text", "name": "Headline", "x": 80, "y": 150, "width": 640, "height": 60, "text": "tinyfly", "fontSize": 56, "fontWeight": 700, "fill": "#f5f5f5", "textAlign": "center" },
    { "type": "rect", "name": "Bar", "x": 340, "y": 230, "width": 120, "height": 6, "fill": "#4a9eff", "borderRadius": 3 }
  ],
  "tracks": [
    { "target": "Headline", "property": "opacity", "keyframes": [ { "time": 0, "value": 0 }, { "time": 500, "value": 1, "easing": "ease-out" } ] },
    { "target": "Headline", "property": "y", "keyframes": [ { "time": 0, "value": 24 }, { "time": 600, "value": 0, "easing": "ease-out-cubic" } ] },
    { "target": "Bar", "property": "clipRight", "keyframes": [ { "time": 300, "value": 100 }, { "time": 1000, "value": 0, "easing": "ease-out-cubic" } ] }
  ]
}

Now generate the animation for the user's brief. Output ONLY the JSON object.`
}
