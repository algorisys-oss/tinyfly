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
    id: 'props',
    title: 'Props: Everyday Objects with Behaviours',
    summary: 'Cars, trucks, buses, tractors, carts, train carriages, bikes, motorbikes, trees, houses, a helicopter and a plane: 3D rigs drawn with the characters’ pens (clean, pencil) that turn toward the camera, with beats acted through the 12 principles (anticipation, squash and stretch, follow-through, an exaggeration dial), wheels that roll exactly, effects, and figures riding them.',
    section: 'Guides',
  },
  {
    id: 'llm-guide',
    title: 'Building Animations with an LLM',
    summary: 'For assistants and the people setting them up: read the capability catalog (`tinyfly capabilities`), ask targets what they animate (`describeTarget`), check beats and tracks with did-you-mean errors (`tinyfly check`, `checkTracks`), render stills to look at, and the agent skill shipped in the package.',
    section: 'Start here',
  },
  {
    id: 'teaching',
    title: 'Teaching Animations',
    summary: 'Step-through explanatory figures: markers, captions in several languages, the teaching player, step controls, one-script declarative embeds, tinyfly/teach diagram primitives, and validate / render for build pipelines.',
    section: 'Guides',
  },
  {
    id: 'video-rendering',
    title: 'Rendering Video from Code',
    summary: 'Rendering a scene to MP4 without a browser: `tinyfly video`, custom canvas targets drawn by code, timing from narration and recorded voice-over, the stick-figure character, SRT/WebVTT captions, stills, porting Cairo scripts, and a benchmark against pycairo.',
    section: 'Guides',
  },
  {
    id: 'maps',
    title: 'Animated Maps',
    summary: 'Maps that animate: a camera that flies in to a city, pins that drop in, routes that draw themselves while a marker travels them, on OpenStreetMap tiles or an offline world outline (also in pencil), in the browser and in headless video.',
    section: 'Guides',
  },
  {
    id: 'cartoon-hands',
    title: 'Cartoon Hands',
    summary: 'A hand you can pose: a palm and five fingers in 3D, posed by numbers (curls, thumb, spread, wrist turn), ready-made shapes from a fist to a pencil grip, left and right, four or five fingers, in clean, pencil and silhouette looks; the animator\'s hand and character gloves are built on it.',
    section: 'Guides',
  },
  {
    id: 'character-appearance',
    title: 'Character Appearance',
    summary: 'Hair (34 styles), facial hair (20), glasses, hats and ears for the v2 character as plain data on the head, so they turn with it through all eight views; builds (child, tall, short…), a recurring cast (castMember), expressions with blush, tears and sweat, everyday poses, held items (mug, phone, bags, umbrella, parcel) and two characters’ hands meeting (meetHands: handshake, high five, hand-over).',
    section: 'Guides',
  },
  {
    id: 'acting',
    title: 'Cartoon Acting',
    summary: 'actTracks(): the same key poses, acted: anticipation, overshoot and settle, overlapping joints, eyes that lead and blink, moving holds and jump squash, in full, snappy or limited styles; gags as data (take, double take, wind-up); a line of action (bend); gaits with personality; lip-sync from text (Latin and Devanagari); beat scripts compiled to acted tracks; your own actions (defineAction), gaits (defineGait) and personas (persona()); acting on code (codePanel lines and words as anchors: leap onto a line, point at it, swipe it away wiped, knocked off or blurred; grab, throw, kick, carry and drop words, push them along their line, write new text in by hand; ride a line as gaps close); camera shots (push in, cut, shake, follow); the cartoon zip; speed lines, dust puffs and impact stars; drawing on twos (a timeline setting); acting, gags, walks and lines in the editor.',
    section: 'Guides',
  },
  {
    id: 'dance',
    title: 'Dance and Flips',
    summary: 'The stick figure dances disco, hip hop, breaking, jazz, K-pop, Bollywood, Bhangra, Bharatanatyam (with mudras), the Charleston, tap (with tap sounds) and popping (side glide, moonwalk), and does front, back, layout and scissor flips, cartwheels, handsprings, split leaps and full splits: wrists, ankles, turn-out, spin and rise as pose fields; moves keyed in beats; styles, grooves and routines as plain data.',
    section: 'Guides',
  },
  {
    id: 'scene-3d',
    title: '3D Scenes',
    summary: '@algorisys/tinyfly/scene-3d: cameras, lights and meshes as JSON, in metres, animated by tracks at <scene>/<object> (cuts with activeCamera), drawn on a 2D canvas with flat, smooth or toon shading, ink outlines and fog, in browsers, Workers and Node (MP4 with tinyfly video); v2 characters in scenes, dancing, in their pen looks or as solid figures, seen by any camera.',
    section: 'Guides',
  },
  {
    id: '3d-rotations',
    title: '3D Transforms and Rotations',
    summary: 'CSS-style 3D for flat elements in every renderer (rotateX, rotateY, z, perspective, backface visibility; true perspective on Canvas and WebGL, matching CSS within a pixel), one documented transform order, the editor\'s 3D fields; smooth quaternion rotations with interpolation: "slerp"; the vec3, quat and mat4 helpers; format version 2.',
    section: 'Guides',
  },
  {
    id: 'extending',
    title: 'Extending tinyfly',
    summary: 'Writing a render adapter, animating any object with live and the ticker, custom and parametric eases, stagger offsets, adding a track kind, and contributing gallery examples.',
    section: 'Guides',
  },
  {
    id: 'DEPLOYMENT',
    title: 'Deployment',
    summary: 'Building and hosting the editor, and serving the player bundles.',
    section: 'Guides',
  },
]
