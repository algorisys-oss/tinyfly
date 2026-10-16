import type { BuiltInEasingType } from '../engine/types'
import { CANVAS_PROPERTIES, type PropertyInfo } from '../adapters/canvas/target-properties'
import { EXPRESSIONS, POSES } from './stick-figure'
import { GAITS } from './gaits'
import { DANCE_STYLES, MUDRAS } from './dance'
import { HUMAN_DANCES } from './human-dance'
import { FLIPS } from './acrobatics'
import { HAND_SHAPES } from './hands/hand-rig'
import { HUMAN_POSES, HUMAN_EXPRESSIONS, HUMAN_BUILDS, FOOT_SHAPES } from './species/human'
import { BODY_SHAPES } from './body/body-shape'
import { HAIR_STYLES, HAIR_COLORS } from './head/hair'
import { FACIAL_HAIR_STYLES } from './head/facial-hair'
import { GLASSES_STYLES } from './head/glasses'
import { HAT_STYLES } from './head/hats'
import { CHARACTER_CAST } from './cast'
import { HELD_ITEMS } from './hands/held-items'
import { HAND_MEETINGS } from './interactions'
import { HUMAN_GAGS } from './species/human-motion'
import { GAGS, gagDuration, type GagName } from './acting/gags'
import { ACTING_STYLES } from './acting/acting'
import { BEAT_FIELDS, SCRIPT_ACTIONS } from './acting/beat-check'
import { STICK_FIGURE_EXTRAS, STICK_POSE_FIELDS, HAND_FIELDS } from './figure-props'
import { CODE_LANGUAGES, CODE_PANEL_EDITS, CODE_SURFACE, REMOVE_STYLES } from './code-panel'
import { WHITEBOARD_SURFACE } from './whiteboard'
import { CHART_SURFACE } from './chart'
import { PROP_SURFACE } from './props/prop-surface'
import type { SurfaceAbout } from './surface/surface'
import { BEAT_MOMENTS } from './acting/surface-script'
import type { Cast } from './acting/custom'
import { PROP_COMMON_CONTROLS } from './props/rig'
import { PROP_PRESETS } from './props/presets'
import { PROP_COMMON_ACTIONS, PROP_BEAT_FIELDS } from './props/script'
import { CRICKET_ACTIONS, CRICKET_CASTS, CRICKET_FORMATS, CRICKET_FIELDING_POSITIONS } from '../sports/cricket/cricket-types'
import { CRICKET_DECISION_VIEWS } from '../sports/cricket/cricket-camera-review'
import { CRICKET_VIEWS } from '../sports/cricket/cricket-camera'
import { CRICKET_PLAY_COMPONENTS, CRICKET_PLAY_EXAMPLES } from '../sports/cricket/cricket-play'
import { CRICKET_MARKING_PROFILES } from '../sports/cricket/cricket-markings'

/** Every prop preset, by the name of the function that makes it. */

/**
 * Everything tinyfly can do, as data read from the code itself: easings,
 * track kinds, what every shape can animate, the stick figure's joints,
 * poses, expressions, gags, gaits, actions, dances and flips, the v2
 * character's poses, and the code panel's languages and edits. Nothing here
 * is written by hand twice, so the catalog cannot drift from the library.
 *
 * It is what a language model should read before writing an animation:
 * `npx @algorisys/tinyfly capabilities` prints it as markdown (`--json` as
 * data), and `llms-full.txt` ends with it.
 */

/** The named easings (the type keeps this list complete). */
const EASINGS = {
  linear: true,
  'ease-in': true,
  'ease-out': true,
  'ease-in-out': true,
  'ease-in-quad': true,
  'ease-out-quad': true,
  'ease-in-out-quad': true,
  'ease-in-cubic': true,
  'ease-out-cubic': true,
  'ease-in-out-cubic': true,
} satisfies Record<BuiltInEasingType, true>

export interface Capabilities {
  sports: { cricket: { actions: Record<string, { name: string; summary: string }>; formats: typeof CRICKET_FORMATS; casts: typeof CRICKET_CASTS; fieldingPositions: typeof CRICKET_FIELDING_POSITIONS; markingProfiles: typeof CRICKET_MARKING_PROFILES; cameras: typeof CRICKET_VIEWS; decisionCameras: typeof CRICKET_DECISION_VIEWS; playComponents: typeof CRICKET_PLAY_COMPONENTS; playExamples: typeof CRICKET_PLAY_EXAMPLES } }
  version?: string
  timing: string
  easings: { named: string[]; parametric: Record<string, string> }
  trackKinds: Record<string, string>
  canvasProperties: Record<string, PropertyInfo & { types: readonly string[] }>
  stickFigure: {
    poseFields: Record<string, PropertyInfo>
    props: Record<string, PropertyInfo>
    handFields: Record<string, PropertyInfo>
    poses: string[]
    expressions: string[]
    gags: Record<string, number>
    gaits: string[]
    actingStyles: string[]
    beatFields: readonly string[]
    actions: Record<string, { summary: string; needs?: string[]; uses?: string[] }>
    dances: Record<string, string[]>
    flips: Record<string, string>
    handShapes: string[]
    mudras: string[]
  }
  /** Props: everyday objects with behaviours */
  props: {
    api: Record<string, string>
    beatFields: readonly string[]
    commonControls: Record<string, string>
    commonActions: Record<string, string>
    presets: Record<string, { family: string; summary: string; actions: Record<string, { summary: string; needs?: string[] }>; controls: string[]; anchors: string[] }>
  }
  /** Making your own: actions, gaits and personas */
  custom: { api: Record<string, string>; actions: Record<string, { summary: string; needs?: string[] }>; gaits: Record<string, string> }
  character: {
    figureStyles: string[]
    body: Record<string, string>
    poses: string[]
    dances: string[]
    expressions: string[]
    /** `face.style`, independent of the pen's `look`. */
    faceStyles: string[]
    faceShapes: string[]
    gags: string[]
    /** `build` option */
    builds: string[]
    /** `hair` option (`{ style, color, length, … }` changes any field) */
    hair: string[]
    hairColors: Record<string, string>
    /** `facialHair` option */
    facialHair: string[]
    glasses: string[]
    hats: string[]
    /** `feet` option */
    feet: string[]
    /** `castMember(name, height)` */
    cast: string[]
    /** `holding: { left | right | both: item }`, and which hands each takes */
    heldItems: Record<string, string>
    /** `meetHands(kind, a, b)` */
    handMeetings: string[]
  }
  codePanel: { languages: readonly string[]; removeStyles: readonly string[]; anchors: Record<string, string>; edits: Record<string, string> }
  /** Surfaces figures act on, by kind: their named anchors and edits (`surface.anchor(name)`, `surface.edit(name, anchor, options)`) */
  surfaces: Record<string, SurfaceAbout>
  /** Beats that act on surfaces (`surfaceScript`): named places and the cues surfaces answer with */
  surfaceScript: Record<string, string>
  cameraShots: Record<string, string>
  teach: Record<string, string>
  /** `@algorisys/tinyfly/math`: maths figures, equations and lessons */
  math: { api: Record<string, string>; items: Record<string, string>; props: Record<string, string>; functions: string[]; tex: string }
  cli: Record<string, string>
}

/** The catalog; pass a cast (or a persona's `cast`) to list its own actions and gaits too. */
export function capabilities(version?: string, cast: Cast = {}): Capabilities {
  const actions: Capabilities['stickFigure']['actions'] = {}
  for (const gait of Object.keys(GAITS)) actions[gait] = { summary: `Walks to \`to\` in the ${gait} gait.`, needs: ['to'] }
  for (const pose of Object.keys(POSES)) actions[pose] = { summary: `Moves into the ${pose} pose and holds it (\`for\` ms).` }
  for (const gag of Object.keys(GAGS)) actions[gag] = { summary: `The ${gag} gag (${gagDuration(gag as GagName)} ms).` }
  for (const [name, guide] of Object.entries(SCRIPT_ACTIONS)) actions[name] = { ...guide }

  return {
    sports: { cricket: { actions: { ...CRICKET_ACTIONS }, formats: { ...CRICKET_FORMATS }, casts: { ...CRICKET_CASTS }, fieldingPositions: { ...CRICKET_FIELDING_POSITIONS }, markingProfiles: { ...CRICKET_MARKING_PROFILES }, cameras: { ...CRICKET_VIEWS }, decisionCameras: CRICKET_DECISION_VIEWS, playComponents: CRICKET_PLAY_COMPONENTS, playExamples: CRICKET_PLAY_EXAMPLES } },
    ...(version ? { version } : {}),
    timing: 'JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.',
    easings: {
      named: Object.keys(EASINGS),
      parametric: {
        'cubic-bezier': '{ type: "cubic-bezier", points: [x1, y1, x2, y2] }',
        steps: '{ type: "steps", count, position?: start | end | none | both }',
        elastic: '{ type: "elastic", mode?: in | out | in-out, amplitude?, period? }',
        bounce: '{ type: "bounce", mode?: in | out | in-out }',
        back: '{ type: "back", mode?: in | out | in-out, overshoot? }',
      },
    },
    trackKinds: {
      keyframe: '{ id, target, property, keyframes: [{ time, value, easing? }] }: values between keys are interpolated (numbers, colours, paths)',
      spring: '{ id, target, property, kind: "spring", spring: { from, to, stiffness?, damping?, mass?, velocity? }, delay? }: physics settle',
      inertia: '{ id, target, property, kind: "inertia", inertia: { from, velocity, friction?, min?, max?, end? }, delay? }: a flick that slows (end snaps to a value or the nearest of a list)',
      motionPath: '{ property: "motionPath", path, align? }: moves along an SVG path',
      text: '{ property: "text", … }: types or scrambles text',
    },
    canvasProperties: CANVAS_PROPERTIES,
    stickFigure: {
      poseFields: STICK_POSE_FIELDS,
      props: STICK_FIGURE_EXTRAS,
      handFields: HAND_FIELDS,
      poses: Object.keys(POSES),
      expressions: Object.keys(EXPRESSIONS),
      gags: Object.fromEntries(Object.keys(GAGS).map((gag) => [gag, gagDuration(gag as GagName)])),
      gaits: Object.keys(GAITS),
      actingStyles: Object.keys(ACTING_STYLES),
      beatFields: BEAT_FIELDS,
      actions,
      dances: Object.fromEntries(Object.entries(DANCE_STYLES).map(([name, style]) => [name, Object.keys(style.moves)])),
      flips: Object.fromEntries(Object.entries(FLIPS).map(([name, flip]) => [name, flip.label])),
      handShapes: Object.keys(HAND_SHAPES),
      mudras: Object.keys(MUDRAS),
    },
    props: {
      api: {
        'car() · truck() · bus() · tractor() · cart() · trainCar() · bike() · motorbike()': 'wheeled vehicles (vehicle(spec) makes your own)',
        'tree() · house()': 'environment (tree(spec), house(spec))',
        'helicopter() · airplane()': 'aircraft',
        'horse() · dog() · cat() · cow()': 'animals (quadruped(spec) makes your own): gaits with footfall patterns keyed in step with the distance, sit, jump, their calls, species actions',
        'songbird() · crow() · chicken()': 'birds (bird(spec) makes your own): hop, walk, peck, flap, fly and land (a chicken flutters), their calls; wings fold and beat in rhythm',
        "{ kind: 'prop', prop: 'car', position, rotation, values } with loadScene3D(scene, { kinds: [characterObjects, propObjects] })": 'props in 3D scenes, by preset name, seen in perspective by the scene camera; controls are tracks on the object',
        'characterScript3D(id, beats, { scene, position?, heading?, height?, pose? })': 'a v2 character in world metres: gaits, face (shortest turn), spin (signed turns and duration), dance (native style, bpm, beats), hold, pose, gag; checkCharacterBeats3D checks the beats',
        'propRide3D({ prop, propId, propTracks, scene, placement, anchor, riderId, pose, start, end, mount?, dismount? })': 'a character riding a prop in a 3D scene: hips on a seat anchor (saddle, seat) as it moves, hopping on and off; RIDING_POSES.astride / .seated / .driving / .cycling / .wheeling (a wheelchair)',
        'propScript3D(id, prop, beats, { scene, position?, heading?, values? })': 'props scripted in world metres for 3D scenes: moves to [x, z] or through points (wheels and strides keyed with the distance), face, hold, and their actions; checkPropBeats3D checks the beats',
        'propPreset(name, options?)': 'a prop preset by name (did-you-mean on a wrong one)',
        "propTarget({ …, style: 'stick' })": 'line art to go with stick figures: tubes as single strokes, shapes outlined over paper',
        'propTow({ leader, leaderId, leaderTracks, hitch, towed, towedId, anchor, start, end })': 'a prop towed by another (a cart behind a horse): turns with it, its wheels roll exactly',
        'propTarget({ x, y, prop, scale?, values?, look?, ink? })': 'a canvas target that draws a prop (x, y: its middle on the ground; scale px per metre, default 60)',
        'propScript(id, prop, beats, { from, ground, scale, style?, exaggeration?, start? })': 'beats → acted tracks, with contact times and effect cues; checkPropBeats(beats, prop) checks them',
        'drawProp(ctx, target, frame, id, { rider? })': 'draw it as it is in a frame (a rider is drawn between its far and near parts)',
        'propAt(target, frame, id).anchor(name)': 'where an anchor (seat, door, chimney…) is, in scene px',
        'propRide({ prop, propId, propTracks, anchor, figure, figureId, start, end, offset? })': 'a figure carried at an anchor, turning with the prop; spliceTracks() puts it into the figure’s tracks',
        'drawPropEffects(ctx, effects, time)': 'dust, exhaust, skid marks, honk lines, leaves, smoke',
      },
      beatFields: PROP_BEAT_FIELDS,
      commonControls: Object.fromEntries(Object.entries(PROP_COMMON_CONTROLS).map(([name, spec]) => [name, `${spec.description}${spec.unit ? ` (${spec.unit})` : ''}`])),
      commonActions: Object.fromEntries(Object.entries(PROP_COMMON_ACTIONS).map(([name, action]) => [name, action.summary])),
      presets: Object.fromEntries(
        Object.entries(PROP_PRESETS).map(([name, make]) => {
          const prop = make()
          return [
            name,
            {
              family: prop.family,
              summary: prop.summary,
              actions: Object.fromEntries(Object.entries(prop.actions).map(([action, a]) => [action, { summary: a.summary, ...(a.needs ? { needs: a.needs as string[] } : {}) }])),
              controls: Object.keys(prop.rig.controls),
              anchors: Object.keys(prop.rig.anchors ?? {}),
            },
          ]
        })
      ),
    },
    custom: {
      api: {
        'defineAction({ summary, needs?, steps: (from, beat) => [{ after, pose, easing? }] })': 'a new action written as timed pose steps from the current pose, like a gag',
        'defineAction({ summary, needs?, beats: (beat) => [beats] })': 'a new action built from other beats (which may be custom too)',
        'defineGait({ swing, knee, arm, elbow, lean, cycle?, … })': 'a new gait (the Gait fields in degrees; cycle is ms per two steps)',
        'scriptTracks(id, beats, { actions, gaits })': 'beats may then use those names; checkBeats(beats, { actions, gaits }) knows them',
        'stickFigureTarget({ …, cast: { actions, gaits } })': 'a figure that draws the gaits and lists the actions in describeTarget',
        'persona({ name, summary?, height?, look?, acting?, gait?, mood?, stance?, energy?, actions?, gaits? })':
          'a character’s look, acting style and habits: .figure({ x, y }), .script(id, beats, { from, ground }), .check(beats), .handPath(…), .describe(); `go` walks in its gait, `stand` returns to its stance and face',
      },
      actions: Object.fromEntries(Object.entries(cast.actions ?? {}).map(([name, a]) => [name, { summary: a.summary, ...(a.needs ? { needs: a.needs as string[] } : {}) }])),
      gaits: Object.fromEntries(Object.entries(cast.gaits ?? {}).map(([name, g]) => [name, g.summary ?? 'custom gait'])),
    },
    character: {
      figureStyles: ['fluid', 'stick', 'organic'],
      body: {
        'body.torso · body.arm · body.leg · body.neck': 'Organic half-width profiles: [{ at: 0..1, width: fractionOfHeight }], increasing from 0 to 1; independent of ink width.',
        'body.measurements': `Organic torso from tape-measure girths { height, bust, underbust?, waist, hip } in any one unit, or a named shape (${Object.keys(BODY_SHAPES).join(' | ')}). Sets the front width, the side depth (bust forward, seat back, belly) and the hip and thigh spacing; reads correctly at every turn. An explicit torso / torsoFront / torsoBack / hipWidth still wins.`,
        'body.torsoFront · body.torsoBack': 'Organic side-view depth from the spine line toward the chest/belly and toward the back/seat, same profile format; default torso × depth.',
        'body.fill · body.outline · body.shading': 'Shared skin fill, outline { color, width }, cel material { mode: cel | none, light: [x,y], shadow, opacity, highlight }.',
        'softCartoonCharacter(name, options?)': 'Original youngMan / youngWoman / childBoy / childGirl story presets. Children have larger head proportions, shorter limbs and rounded torsos; every face, hair, build, hand, clothing and material option can be overridden.',
        'face.projection': 'Organic default volume follows the head axes, keeps both eyes in three-quarter views and projects a small nose above the mouth; opaque hair covers features. cartoon keeps the classic face slide.',
        'outfitPreset(category, overrides?)': 'Fresh JSON Everyday / Formal / Casual wardrobe defaults for every actor; top: tshirt | shirt | blouse | dress, trouserStyle: plain | jeans | cargo, colours, sleeves, bottoms, collar and tie are editable.',
        'leafOutfit': 'Organic-only JSON garment { top?, color?, accent?, length? }; curved leaves follow torso/thighs at native part depths. Everyday basicOutfit also follows organic contours.',
      },
      poses: Object.keys(HUMAN_POSES),
      dances: Object.keys(HUMAN_DANCES),
      expressions: Object.keys(HUMAN_EXPRESSIONS),
      faceStyles: ['simple', 'anime'],
      faceShapes: ['round', 'angular'],
      gags: Object.keys(HUMAN_GAGS),
      builds: Object.keys(HUMAN_BUILDS),
      hair: Object.keys(HAIR_STYLES),
      hairColors: { ...HAIR_COLORS },
      facialHair: Object.keys(FACIAL_HAIR_STYLES),
      glasses: Object.keys(GLASSES_STYLES),
      hats: Object.keys(HAT_STYLES),
      feet: [...FOOT_SHAPES],
      cast: Object.keys(CHARACTER_CAST),
      heldItems: Object.fromEntries(Object.entries(HELD_ITEMS).map(([name, item]) => [name, item.hands])),
      handMeetings: Object.keys(HAND_MEETINGS),
    },
    codePanel: {
      languages: CODE_LANGUAGES,
      removeStyles: REMOVE_STYLES,
      anchors: {
        'line(n, time?)': 'line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y',
        'token(n, text, occurrence?, time?)': 'a word on a line',
        'spot(n, column, width?, time?)': 'a place in a line, for put and write',
        'landing(piece, n, column)': 'where a dropped piece will land',
        box: 'the whole panel',
      },
      edits: CODE_PANEL_EDITS,
    },
    surfaces: { code: CODE_SURFACE, board: WHITEBOARD_SURFACE, chart: CHART_SURFACE, prop: PROP_SURFACE },
    surfaceScript: {
      'surfaceScript(figureId, { name: surface }, beats, options)': 'compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)',
      'checkSurfaceBeats(beats, surfaces, cast?)': 'every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions',
      '{ surface, anchor }': 'a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it',
      'then: { surface, edit, anchor, at?, until?, …options }': 'what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options',
      'at': `a moment of the beat: ${BEAT_MOMENTS.join(', ')} (default contact, or start when the beat has none); not ms`,
      'until': 'a moment of this beat, or { beat: index, at? } of a later one; sets the edit’s duration (carry needs it)',
    },
    cameraShots: {
      frame: '{ at, duration?, easing?, frame: { focus?: { x, y }, scale?, rotate? } }: push in, pull out, or cut (duration 0)',
      shake: '{ at, duration, shake: { strength?, frequency?, roll?, seed? } }',
      follow: '{ at, until, follow: { x: <the subject’s x keyframes>, lead?, y?, lag?, scale? } }: keeps a subject centred',
    },
    teach: {
      'lesson({ id })': 'steps as timeline JSON: to, set, together, wait, marker (with pause, question, captions)',
      'cells, pointer, stack, queue, table, pipeline': 'diagram primitives (SVG markup + step helpers)',
      'figure({ width, height, children })': 'the SVG holding the pieces',
    },
    math: {
      api: {
        'mathFigure(spec)': 'checks a figure (JSON: width, height, x?, y?, theme?: dark | light | chalk, values, items) and says how to fix it',
        'layoutFigure(spec, props)': 'the figure at some values as shapes; drawDisplayList(ctx, list) or displayListToSvg(list) draws them',
        'mathTarget(spec, { x, y })': 'a canvas target for videos and canvas pages; tracks animate its values and item props',
        'mathSteps(lesson, target, spec, { hidden })': 'lesson steps: toValue, applyMatrix, drawOn, fadeIn, fadeOut, showStep (equations)',
        'mountMath(element) / mountAllMath()': 'lesson-page embeds: <figure data-tinyfly-math> with data-tinyfly-figure and data-tinyfly-timeline JSON scripts, stepped like any embed',
        'mathExplorable(element, spec, { sliders, drag })': 'reader-driven figures: sliders on number values, drag vector tips or matrix columns',
        'mathFigureToSvg(spec, props)': 'a standalone SVG of a figure at some values',
        'linearMapFigure, determinantFigure, eigenFigure, vectorSumFigure, spanFigure': 'ready linear algebra figures; the matrix is the value M',
        'tangentFigure, secantFigure, riemannFigure, areaFigure, taylorFigure, limitFigure': 'ready calculus figures; their moving parts are number values (a, h, n, b, order, p)',
        'differentiate / compileDerivative / integrate': 'exact symbolic derivatives of expressions; Simpson integration',
        'normalFigure, binomialFigure, cltFigure, galtonFigure, monteCarloPiFigure, regressionFigure, bayesFigure': 'ready probability and statistics figures',
        'graphSearchFigure, shortestPathFigure, recursionTreeFigure, vennFigure, clockFigure': 'ready discrete maths figures; searches move with the value step',
        'searchEvents / parseSetExpression / regionCells': 'graph searches as data; set expressions and their Venn cells',
        'neuralNetworkFigure, gradientDescentFigure, attentionFigure, decisionBoundaryFigure, kmeansFigure, activationFigure': 'ready AI/ML figures',
        'distributions': '{ kind: normal | uniform | exponential | binomial | poisson | dice | mean, …numbers or value names }; density, meanOf, sdOf, samples (seeded)',
        'layoutTex(tex) / morphEquation(a, b, t)': 'the built-in TeX subset, and term-by-term transitions',
        'vec2, mat2': '2D vectors and 2×2 matrices (apply, multiply, determinant, inverse, eigen)',
      },
      items: {
        grid: '{ step?, transform?: matrix value, ghost? }: lines of the plane, warped by a matrix',
        axes: '{ ticks?, labels? }',
        vector: '{ to, from?, transform?, label? (TeX), labelAt?: tip | middle }',
        basis: '{ transform? }: î and ĵ',
        point: '{ at, transform?, label?, hollow? } or { on: expr, x } (a point riding a curve)',
        function: '{ expr: "sin(k x)", domain?, derivative?, dashed? }: y = f(x); number values are its parameters',
        parametric: '{ x, y (expressions in t), t?, transform? }',
        polygon: '{ points? (default the unit square), transform?, label? }: \\val{M.det} shows the determinant',
        line: '{ along } or { eigen: matrix value }: a span, or eigenlines',
        label: '{ tex, at, screen?, size?, align?, backdrop? }',
        equation: '{ steps: [TeX…], at, screen? }: ITEM.step moves between steps, terms gliding',
        tangent: '{ expr, at, h? (secant), label? }: \\val{ID.slope} is the exact slope',
        riemann: '{ expr, from, to, n, rule?: left | right | midpoint | trapezoid }: \\val{ID.sum}, \\val{ID.exact}',
        area: '{ expr, from, to, lower? }: signed, coloured by sign; \\val{ID.value}',
        taylor: '{ expr, at, order }: exact Taylor polynomials; a fractional order grows the next term in',
        histogram: '{ distribution, count, bins?, scale?, curve?, seed? }: seeded samples, binned; fills as count grows',
        distribution: '{ distribution, shade?: [a, b] }: a density curve (bars when discrete); \\val{ID.p}',
        galton: '{ rows?, balls, spacing?, top?, seed? }: a Galton board; fractional balls = the next one falling',
        scatter: '{ points: uniform | linear, count, inside?, fit?, seed? }: Monte Carlo and regression; \\val{ID.ratio}, \\val{ID.r}',
        bayes: '{ prior, truePositive, falsePositive }: Bayes as areas; \\val{ID.posterior}',
        graph: '{ nodes, edges, directed?, tree?, search?: { kind: bfs | dfs | dijkstra, start }, step?, frontier? }: searches step by step',
        venn: '{ sets (2 or 3), highlight?: set expression like (A | B)\' }: shaded by clipping',
        clock: '{ modulus, value }: clock arithmetic; \\val{ID.hour}',
        network: '{ layers, activation?, inputs?, flow?, seed?, labels? }: a forward pass, layer by layer',
        heatmap: '{ cells (softmax? per row) or expr in x, y; colormap?, rowLabels?, colLabels?, values? }: attention maps, loss fields',
        contours: '{ expr in x, y, levels? }: level curves (marching squares)',
        descent: '{ expr in x, y, start, rate, steps, momentum? }: gradient descent with an exact gradient',
        classifier: '{ epochs, centres?, rate?, start? }: logistic regression training; \\val{ID.accuracy}',
        kmeans: '{ centres, iteration, k? }: Lloyd iterations; \\val{ID.inertia}',
      },
      props: {
        'NAME': 'a value: a number, [x, y] vector or [a, b, c, d] matrix (row by row; columns are where î and ĵ land)',
        'ITEM.draw': '0..1, draws an item on',
        'ITEM.opacity': '0..1',
        'ITEM.step': 'an equation\'s step; fractional values are part way',
      },
      functions: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh', 'exp', 'ln', 'log', 'log2', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'sign', 'min', 'max', 'sigmoid', 'relu'],
      tex: '^ _ \\frac \\sqrt \\vec \\hat \\bar, \\sum \\prod \\int with limits, \\sin \\lim … , Greek, \\cdot \\times \\le \\to \\infty …, pmatrix / bmatrix / vmatrix, \\text, \\color{c}{…}, \\id{name}{…} (names a term for transitions), \\val{name:digits} (a live value)',
    },
    cli: {
      'tinyfly capabilities [--json]': 'this catalog',
      'tinyfly check <beats.json>': 'check a beat script (names, fields) with suggestions',
      'tinyfly validate <timeline.json> [--markup file]': 'check a timeline against its markup',
      'tinyfly render <timeline.json> <markup> [--at …]': 'a frame as static markup',
      'tinyfly video <scene.mjs> [--stills dir --times …]': 'MP4, or PNG stills to look at',
    },
  }
}

const list = (names: readonly string[]) => names.map((name) => `\`${name}\``).join(', ')
const table = (rows: Record<string, PropertyInfo>) =>
  Object.entries(rows)
    .map(([name, info]) => `| \`${name}\` | ${info.unit ?? info.kind ?? ''} | ${info.description} |`)
    .join('\n')

/** The catalog as markdown, for people and language models. */
export function capabilitiesMarkdown(version?: string, cast: Cast = {}): string {
  const c = capabilities(version, cast)
  const f = c.stickFigure
  const lines = [
    `# tinyfly capabilities${c.version ? ` (v${c.version})` : ''}`,
    '',
    'Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).',
    '',
    `**Timing.** ${c.timing}`,
    '',
    '## Easings',
    '',
    `Named: ${list(c.easings.named)}.`,
    '',
    ...Object.entries(c.easings.parametric).map(([name, shape]) => `- ${name}: \`${shape}\``),
    '',
    '## Track kinds',
    '',
    ...Object.entries(c.trackKinds).map(([name, shape]) => `- **${name}**: ${shape}`),
    '',
    '## Canvas targets',
    '',
    'Types: `rect`, `circle`, `text`, `line`, `path`, `image`, `custom`. `describeTarget(target)` lists what one can animate with its values; `checkTracks(tracks, targets)` checks tracks before playing them.',
    '',
    '| Property | Unit | What it does | Types |',
    '|---|---|---|---|',
    ...Object.entries(c.canvasProperties).map(
      ([name, info]) => `| \`${name}\` | ${info.unit ?? info.kind ?? ''} | ${info.description} | ${info.types.length === 7 ? 'all' : info.types.join(', ')} |`
    ),
    '',
    '## Stick figure (`@algorisys/tinyfly/characters`)',
    '',
    '`stickFigureTarget({ x, y, style })` is a custom canvas target; its props are the pose fields and the props below. Pose it with tracks (`poseTracks`), or write beats (`scriptTracks`).',
    '',
    'Style proportions: `headSize` is a fraction of height; `armLength` multiplies both upper arm and forearm lengths (default 1, positive finite). Hands, shoulders, torso and legs retain their sizes.',
    '',
    '### Pose fields',
    '',
    '| Field | Unit | What it does |',
    '|---|---|---|',
    table(f.poseFields),
    '',
    '### Other props',
    '',
    '| Prop | Unit | What it does |',
    '|---|---|---|',
    table(f.props),
    '',
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${list(Object.keys(f.handFields))}.`,
    '',
    `**Poses** (a beat's \`do\`, or a pose key): ${list(f.poses)}.`,
    '',
    `**Expressions** (a beat's \`mood\`): ${list(f.expressions)}.`,
    '',
    `**Gags** (ms): ${Object.entries(f.gags).map(([name, ms]) => `\`${name}\` (${ms})`).join(', ')}.`,
    '',
    `**Gaits**: ${list(f.gaits)}. **Acting styles** (\`style\`): ${list(f.actingStyles)}.`,
    '',
    '### Beat scripts',
    '',
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${list(f.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
    '',
    '`characterScript(target, who, beats, options)` compiles the same beats for a v2 `character()` on a `characterTarget` (every option but `height`; the same result, its key poses on the human body; the walk phase keyed to that character\'s stride, and `walk` / `walking` / `gait` tracks that step the gait as the target draws). Add `hairFollowTracks(target, tracks, who)` after it so hanging hair swings.',
    '',
    '| `do` | Needs | What happens |',
    '|---|---|---|',
    ...Object.entries(f.actions).map(([name, a]) => `| \`${name}\` | ${(a.needs ?? []).map((n) => `\`${n}\``).join(', ')} | ${a.summary} |`),
    '',
    'Beats that touch something report `contact` (and `release`) times in `result.beats[i]`; key the thing they touch to those.',
    '',
    `**Dances** (\`dancer(style, { move })\`): ${Object.entries(f.dances).map(([name, moves]) => `\`${name}\` (${moves.join(', ')})`).join('; ')}.`,
    '',
    `**Flips**: ${Object.entries(f.flips).map(([name, label]) => `\`${name}\` (${label})`).join(', ')}.`,
    '',
    `**Hand shapes**: ${list(f.handShapes)}. **Mudras**: ${list(f.mudras)}.`,
    '',
    '### Your own actions, gaits and personas',
    '',
    'Nothing is registered globally: pass your definitions where they are used.',
    '',
    ...Object.entries(c.custom.api).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    ...(Object.keys(c.custom.actions).length || Object.keys(c.custom.gaits).length
      ? [
          '**This cast’s own:**',
          '',
          ...Object.entries(c.custom.actions).map(([name, a]) => `- \`${name}\`${a.needs?.length ? ` (needs ${a.needs.map((n) => `\`${n}\``).join(', ')})` : ''}: ${a.summary}`),
          ...Object.entries(c.custom.gaits).map(([name, summary]) => `- \`${name}\` (gait): ${summary}`),
          '',
        ]
      : []),
    '## Props (everyday objects with behaviours)',
    '',
    'A prop is a 3D rig of simple parts drawn with the characters’ pens (clean, pencil, silhouette), so it turns toward the camera (`turn`), and its beats go through the same acting pass (anticipation, overshoot, overlap; `exaggeration` scales them).',
    '',
    ...Object.entries(c.props.api).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    `Prop beat fields: ${list(c.props.beatFields)}. Every prop has the controls ${Object.keys(c.props.commonControls).map((n) => `\`${n}\``).join(', ')} and the actions ${Object.keys(c.props.commonActions).map((n) => `\`${n}\``).join(', ')}.`,
    '',
    'Scenery: `scenery({ x, y, width, height, kind: sky | room, hour, clouds, wind, rain, snow, horizon: hills | city | flat })` is a canvas target whose values `hour` (0–24), `clouds`, `rain`, `snow` (0–1) and `wind` (−1..1) are tracks (`set(prop, { at, value, duration })`, `tracks(id)`; `anchor(\'sun\' | \'moon\' | \'horizon\' | \'ground\', time)`); the same `wind` streams hair (`hairFollowTracks(…, { wind })`). `scenePreset(\'park\' | \'street\' | \'office\' | \'home\', { width, height })` lays out scenery and props as data; `buildScene` builds them into targets.',
    '',
    '| Preset | Family | Actions (needs) | Controls | Anchors |',
    '|---|---|---|---|---|',
    ...Object.entries(c.props.presets).map(
      ([name, p]) =>
        `| \`${name}()\` | ${p.family} | ${Object.entries(p.actions).map(([a, d]) => `\`${a}\`${d.needs?.length ? ` (${d.needs.join(', ')})` : ''}`).join(', ')} | ${p.controls.map((n) => `\`${n}\``).join(', ')} | ${p.anchors.join(', ')} |`
    ),
    '',
    '## Character (v2 human)',
    '',
    `Poses: ${list(c.character.poses)}. Expressions: ${list(c.character.expressions)}. Gags: ${list(c.character.gags)}.`,
    `Native dances: ${list(c.character.dances)}; \`humanDanceFrame(style, beat, base)\` keeps body heading independent; \`humanDanceTracks(target, options)\` bakes JSON pose tracks. \`danceCircleAt(beat, { radius, count, beatsPerTurn, facing, spins })\` gives a formation with planted toes; \`danceCircleTracks(targets, options)\` bakes scene tracks. \`plantDanceFoot(partner, side, worldPoint)\` returns pose AND position; \`meetDandiya(a, b)\` solves both stick tips to one shared world point and reports unreachable contacts.`,
    '',
    'Appearance options of `character({ … })`, all plain data that turns with the head (see docs/character-appearance.md):',
    '',
    `- \`build\`: ${list(c.character.builds)}`,
    `- \`figure\`: ${list(c.character.figureStyles)}`,
    "- `look`: `clean` (default), `pencil`, `silhouette`, `illustrated` (inked and painted: line weight follows the light, brush-tapered strokes, shadow/core/highlight tones from each fill; `illustrated: { light: [x, y], weight, taper, shadow, highlight }`, each 0–1)",
    ...Object.entries(c.character.body).map(([name, description]) => `- \`${name}\`: ${description}`),
    `- \`hair\`: ${list(c.character.hair)} (colours: ${list(Object.keys(c.character.hairColors))} in \`HAIR_COLORS\`)`,
    '- Flowing hair: `softSweep`, `flowingBob`, `cascadingWaves`; editable `locks: [{ path, width, follow? }]` with cubic `{ around, up, lift? }` points (around in degrees, dimensions in head radii), `fall: { taper, wave }` and `shine` (0–1). Roots stay attached; `hairFollowTracks` also drives flexible short locks.',
    `- \`facialHair\`: ${list(c.character.facialHair)}`,
    `- \`glasses\`: ${list(c.character.glasses)}; \`hat\`: ${list(c.character.hats)}; \`ears: true\`; \`face: { teeth, tongue }\` (shown when the mouth opens); \`feet\`: ${list(c.character.feet)}`,
    '- `outfit`: `{ top: tshirt | shirt | blouse | dress, trouserStyle: plain | jeans | cargo, shirt: top colour, trousers: bottom colour, sleeves: short | long | none, bottom: trousers | shorts | skirt, collar, tie: colour, over: apron | labCoat | hoodie | cardigan | overalls | sari, overColor, shoes: boots, shoeColor }`',
    `- \`castMember(name, height)\`: ${list(c.character.cast)}`,
    '- Face marks (pose fields, 0–1): `blush`, `tears`, `sweat`; close-up fields `pupil` (size, 1 usual), `lid` (upper lids lowered, 0–1), `bulge` (eyes out of the head, 0–1); `face: { nose: true, inPupil(ctx, pupil) }`; `drawCharacterHead(ctx, who, pose, { x, y, radius })` draws just the head big',
    `- Face styles: ${list(c.character.faceStyles)}; \`face: { style: 'anime', iris: '#4b7fce', lashes: true, ageLines: 0.8 }\` uses coloured eyes and the same expressions, blinks and gaze. \`ANIME_CAST\` contains eight age presets, also available through \`castMember\`.`,
    `- Face shapes: ${list(c.character.faceShapes)}; \`face: { shape: 'angular', jawWidth: 0.74, chinWidth: 0.14, eyeScale: 0.8, eyeAspect: 0.65 }\` sets a tapered 3D jaw and narrower anime eyes; \`jawRoundness: 1\` softens the cheek/chin corners (default 0 keeps sharp jaws). \`MANGA_CAST\` contains four original young adult presets; hair styles \`mangaSpikes\` and \`mangaSweep\` remain editable.`,
    '- Hair in motion (pose fields): `hair.swing` (degrees round the head, + toward its left), `hair.trail` (head radii back), `hair.lift` (head radii up); key them with `hairFollowTracks(target, tracks, who)` after the character\'s tracks, or `hairFollow` + `hairMotionAt` when posing per frame',
    `- \`holding\`: ${Object.entries(c.character.heldItems).map(([name, hands]) => `\`${name}\` (${hands === 'both' ? 'both' : hands === 'either' ? 'one hand or both' : 'left or right'})`).join(', ')}; pose fields \`held.left\`, \`held.right\`, \`held.both\` (below 0.5 lets go); \`handGrip(joints, side)\``,
    `- \`meetHands(kind, a, b)\` (stand them \`meetingSpacing(kind, a, b)\` apart): ${list(c.character.handMeetings)}; \`embrace(a, b)\` (a hug, \`embraceSpacing\` apart); \`helpUp(helper, sitter, progress)\` (0 on the floor, hand taken; 1 standing; \`helpUpSpacing\` apart)`,
    '- Everyday cycles like a gait: `humanCyclePose(\'sweeping\' | \'brushing\', phase, base)` (0 → 1 is one stroke and back; sweeping with `holding: { right: \'broom\' }`)',
    '',
    '## Code panel',
    '',
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${list(c.codePanel.languages)}. Remove styles: ${list(c.codePanel.removeStyles)}.`,
    '',
    ...Object.entries(c.codePanel.anchors).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    ...Object.values(c.codePanel.edits).map((what) => `- \`${what.split(':')[0]}\`:${what.split(':').slice(1).join(':')}`),
    '',
    '## Surfaces',
    '',
    'Scene objects figures act on. Places are named `kind:args`: `surface.anchor(name)` gives the box there (stand on `top`, point at `x`, `y`; pass it as a beat `target`), `surface.piece(name)` makes the part there come loose, and `surface.edit(name, anchor, options)` changes the surface at a time (`at`, ms).',
    '',
    'Beats name places and say what surfaces do in answer (`surfaceScript`):',
    '',
    ...Object.entries(c.surfaceScript).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    ...Object.entries(c.surfaces).flatMap(([kind, about]) => [
      `### ${kind}`,
      '',
      ...(about.create ? [`\`${about.create}\``, ''] : []),
      'Anchors:',
      ...Object.entries(about.anchors).map(([pattern, what]) => `- \`${pattern}\`: ${what}`),
      '',
      'Edits:',
      ...Object.entries(about.edits).map(([name, what]) => `- \`${name}\`: ${what}`),
      '',
    ]),
    '## Cricket stories (`@algorisys/tinyfly/sports`)',
    '',
    '`cricketClip({ format, action, cast })` returns an organic-player scene, JSON tracks, timed events/captions and a declared result. `cricketField`, `cricketPlayer` and `cricketAction` compose separately; `cricketCameraTracks` adds camera tracks. These are authored tutorial plays, not physics or automatic umpiring. See docs/cricket.md.',
    '',
    `Marking profiles: ${list(Object.keys(c.sports.cricket.markingProfiles))}; default ICC men, independently of cast. Limited-over ICC profiles draw a wicket-centred capsule; Test/MCC have no restriction-area line. \`cricketFieldingAreaContains(field, point)\` returns true/false/null; \`cricketFieldingPositions\` and \`cricketFieldingOverlay\` provide owned setup markers, not umpiring decisions.`,
    '',
    '`cricketPlay(field, options)` / `cricketPlayClip(options)` independently author delivery style/legality, shot, finish, fielding, current free-hit context and candidate dismissal. Omitted dismissal means no dismissal. Unsupported motion combinations throw; no-ball/free-hit protection changes result/signals without removing physical catches or wicket breaks. Run-out remains available. Illegal free hits carry forward; legal ones consume context. Test rejects free-hit context. Keep innings/score/strike in the consuming app.',
    '',
    ...Object.entries(c.sports.cricket.playComponents).map(([name, values]) => `Play ${name}: ${list(values)}`),
    ...Object.entries(c.sports.cricket.playExamples).map(([name, info]) => `- Composed example \`${name}\`: ${info.name}`),
    '',
    ...Object.entries(c.sports.cricket.actions).map(([name, action]) => `- \`${name}\`: ${action.summary}`),
    '',
    `Formats: ${list(Object.keys(c.sports.cricket.formats))}. Casts: ${list(Object.keys(c.sports.cricket.casts))}. Cameras: ${list(Object.keys(c.sports.cricket.cameras))}. Orbit turns 360° around the whole ground. \`cricketCameraTracks(clip, { view, zoom })\` supports 0.25–4× optical magnification (default 1) in every view.`,
    '',
    `Stock fielding labels (\`CRICKET_FIELDING_POSITIONS\`): ${Object.entries(c.sports.cricket.fieldingPositions).map(([id, name]) => `\`${id}\`: ${name}`).join(', ')}. Eleven fielders, two on-field batters and two umpires; nine batting teammates wait off-field. Mid-on is closer to the pitch; long-on is its deeper boundary alternative, not an extra stock fielder. For the right-handed striker, +x is off side and -x is on/leg side.`,
    '',
    'Decision review cameras: front-foot, striker-crease, bowler-crease. cricketCameraFraming returns owned defaults; cricketCameraReview returns a physical event without seeking. Optional cricketDecisionOverlay marks the crease reference. pitch 0–89, distance 0.5–2000, fov 10–100 before zoom, and fixed-view target customize framing. Ball-follow yaw rotates its default offset relative to 75 degrees; pitch/distance apply too. Export all camera tracks, including far for distant framing. These APIs never alter motion or rulings.',
    '',
    '## Camera shots (`cameraTracks(shots, { stage })`)',
    '',
    ...Object.entries(c.cameraShots).map(([name, shape]) => `- **${name}**: \`${shape}\``),
    '',
    '## Teaching (`@algorisys/tinyfly/teach`)',
    '',
    ...Object.entries(c.teach).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    '## Maths (`@algorisys/tinyfly/math`)',
    '',
    'A figure is JSON: a plane and items. Tracks on its target animate values by name and item props. One layout feeds a canvas (videos) and SVG (lesson embeds), so they match.',
    '',
    ...Object.entries(c.math.api).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    'Items (each has `id`, `kind`, and optional `color`, `draw`, `opacity`):',
    '',
    ...Object.entries(c.math.items).map(([name, what]) => `- \`${name}\` ${what}`),
    '',
    'Props a timeline animates:',
    '',
    ...Object.entries(c.math.props).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    `Expression functions: ${c.math.functions.map((name) => `\`${name}\``).join(', ')}; constants \`pi\`, \`e\`, \`tau\`.`,
    '',
    `TeX subset: ${c.math.tex}`,
    '',
    '## Command line',
    '',
    ...Object.entries(c.cli).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
  ]
  return lines.join('\n')
}
