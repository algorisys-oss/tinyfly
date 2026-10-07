import type { BuiltInEasingType } from '../engine/types'
import { CANVAS_PROPERTIES, type PropertyInfo } from '../adapters/canvas/target-properties'
import { EXPRESSIONS, POSES } from './stick-figure'
import { GAITS } from './gaits'
import { DANCE_STYLES, MUDRAS } from './dance'
import { FLIPS } from './acrobatics'
import { HAND_SHAPES } from './hands/hand-rig'
import { HUMAN_POSES, HUMAN_EXPRESSIONS } from './species/human'
import { HUMAN_GAGS } from './species/human-motion'
import { GAGS, gagDuration, type GagName } from './acting/gags'
import { ACTING_STYLES } from './acting/acting'
import { BEAT_FIELDS, SCRIPT_ACTIONS } from './acting/beat-check'
import { STICK_FIGURE_EXTRAS, STICK_POSE_FIELDS, HAND_FIELDS } from './figure-props'
import { CODE_LANGUAGES, CODE_PANEL_EDITS, REMOVE_STYLES } from './code-panel'

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
  character: { poses: string[]; expressions: string[]; gags: string[] }
  codePanel: { languages: readonly string[]; removeStyles: readonly string[]; anchors: Record<string, string>; edits: Record<string, string> }
  cameraShots: Record<string, string>
  teach: Record<string, string>
  cli: Record<string, string>
}

export function capabilities(version?: string): Capabilities {
  const actions: Capabilities['stickFigure']['actions'] = {}
  for (const gait of Object.keys(GAITS)) actions[gait] = { summary: `Walks to \`to\` in the ${gait} gait.`, needs: ['to'] }
  for (const pose of Object.keys(POSES)) actions[pose] = { summary: `Moves into the ${pose} pose and holds it (\`for\` ms).` }
  for (const gag of Object.keys(GAGS)) actions[gag] = { summary: `The ${gag} gag (${gagDuration(gag as GagName)} ms).` }
  for (const [name, guide] of Object.entries(SCRIPT_ACTIONS)) actions[name] = { ...guide }

  return {
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
    character: { poses: Object.keys(HUMAN_POSES), expressions: Object.keys(HUMAN_EXPRESSIONS), gags: Object.keys(HUMAN_GAGS) },
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
export function capabilitiesMarkdown(version?: string): string {
  const c = capabilities(version)
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
    '## Character (v2 human)',
    '',
    `Poses: ${list(c.character.poses)}. Expressions: ${list(c.character.expressions)}. Gags: ${list(c.character.gags)}.`,
    '',
    '## Code panel',
    '',
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${list(c.codePanel.languages)}. Remove styles: ${list(c.codePanel.removeStyles)}.`,
    '',
    ...Object.entries(c.codePanel.anchors).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    ...Object.values(c.codePanel.edits).map((what) => `- \`${what.split(':')[0]}\`:${what.split(':').slice(1).join(':')}`),
    '',
    '## Camera shots (`cameraTracks(shots, { stage })`)',
    '',
    ...Object.entries(c.cameraShots).map(([name, shape]) => `- **${name}**: \`${shape}\``),
    '',
    '## Teaching (`@algorisys/tinyfly/teach`)',
    '',
    ...Object.entries(c.teach).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
    '## Command line',
    '',
    ...Object.entries(c.cli).map(([name, what]) => `- \`${name}\`: ${what}`),
    '',
  ]
  return lines.join('\n')
}
