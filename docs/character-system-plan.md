# Character System Plan — fluid figures, heads, hair and animals

**Status:** Planning (no implementation yet)
**Date:** 2026-10-03

This plan covers the work needed to draw everything in six reference model
sheets with tinyfly, from code, deterministically, in a clean or a
Pencilmation (pencil) look. It is a living plan: each milestone below ships
on its own, with a model sheet in `docs/model-sheet/` that proves it.

---

## The reference sheets

| Sheet | What it asks for |
|---|---|
| **Character model sheet** | Turnaround (bare, clothed), walk and run cycles, action poses, archetypes, clothing, body types, face features |
| **Animation model sheet, movie ready** | Adds emotion body language, lip-sync mouth shapes, hand gestures, props, everyday acting, two-character interactions, ground poses, scale and age, silhouettes |
| **Hair and head sheet** | Hair turnaround with head guides (crown, hairline, ear line, neck line); ~30 male, female and kid styles; hair in motion; facial hair, glasses, hats; hair-plus-expression combos; style tokens |
| **Animal and bird actions sheet** | Quadruped and bird turnarounds, 8 mammals, 8 birds, walk/run cycles, action poses, flight cycle, expressions, beaks, props, scale and age, tokens |
| **Fluid animals and birds sheet** | A bendable spine (curled sleep, pounce, leap), separate dog and cat gaits, trotting, 14 mammals, 11 birds, ear and tail types, aquatic animals (fish, penguin, turtle, frog, duck), richer tokens |
| **Fluid human figures sheet** | Construction with chest and waist, character types (adult, kid, teen, elderly), body types, walk/run, actions, emotions, face expressions, lip-sync, hands, hair and identity, everyday acting, props, interactions, ground poses, scale and age, silhouettes, tokens |

Plus: **every one of these in a Pencilmation look** (graphite strokes that boil,
on paper).

### What all six sheets have in common

1. **Turnarounds.** Every character (people, a dog, a bird) is shown front,
   3/4, side, 3/4 back and back, and hair, faces, clothes and tails have to be
   right from every side.
2. **Cycles.** Walk, run, trot, gallop, flap, swim: each 8 frames, looping.
3. **Poses as data.** Named poses and expressions that blend.
4. **Contact.** Feet on the ground, but also knees, hands, hips, a belly, a
   perch, a water line, a held prop, another character's hand.
5. **Variation by tokens.** "API-friendly style tokens": a character is a small
   description (gender, age, build, hair, species, ears, tail, accessories…).
6. **Silhouette readability.** Every pose must read as a solid black shape.

---

## Where tinyfly is today (0.76)

`@algorisys/tinyfly/characters` has one rig: the stick figure.

| Has | Lacks |
|---|---|
| Pose as numbers (blend, tracks, `poseTracks`) | Any rig other than the human stick figure |
| `walkPose`, `talk`, expressions, squash/stretch, rubber limbs | Run, trot, gallop, flap, swim; gaits as data |
| `turn` 0..1 (front → profile), `facing` mirror | True back views (the face always shows) |
| `sit`, feet planted on the ground | Contact with anything but the feet; whole-body rotation |
| `stickFigureJoints()`, `layers` hooks, `shoulderWidth`, `headSize` | Bendable spine/neck/tail chains; limbs reaching a point (IK) |
| Organic and classic looks, `sketch` (pencil) style | Eye/brow/nose styles, lip-sync shapes, hand shapes, hair, bodies |

Its limb angles live in one plane (the figure's front), and depth is a
hand-written rule (the back arm goes behind the body past `turn` 0.25). That is
the limit the new sheets hit: a front-plane angle cannot be both "arm out to the
side" in the front view and "arm hanging straight" in profile, which is why the
current model sheet has to close the arms up by hand as the figure turns.

---

## Decisions

### 1. A new character system beside the stick figure (v2), not a rewrite of it

`stickFigureTarget`, `drawStickFigure`, `StickPose` and friends stay exactly as
they are (the API the story channel uses, pinned by the golden frames). The new
system is new API in the same `characters` entry point. Once v2's human matches
v1's organic look, v1 can become a thin adapter over it (milestone 8), checked
by the same goldens. No one is forced to migrate.

*Why:* v1's angle conventions (one plane, "outward" angles, a sideways walk
scissor) are baked into existing scenes. Changing what those numbers mean would
silently break them.

### 2. Skeletons are 2.5D: joints in 3D, drawn as 2D lines

Each joint has a position in 3D (x across, y up, z toward the viewer). A
character turns by rotating about its vertical axis, then is projected flat
(orthographic). This one choice solves most of the turnaround problems at once:

| Problem today | With 2.5D |
|---|---|
| Arms spread sideways read as forward/back in profile | Spread is sideways (x); profile sees it edge-on, so it disappears |
| Back arm needs a hand-written depth rule | Parts are drawn far-to-near by their depth |
| Feet direction depends on `turn` by a hand-written blend | Feet point forward (+z); the projection turns them |
| No back view | `turn` 2 is just a 180° rotation; the face is on the far side |
| A quadruped's front view is a separate drawing | The same skeleton, seen from the front |

Lines stay 2D (tapered strokes, pencil strokes); there is no 3D rendering, no
lighting, no perspective. It is still a stick figure.

### 3. Everything a character is, is data

- **Body plan** (one per species): chains of bones, their lengths and widths,
  where they attach, contact points, head shape. A dog, a heron and a person are
  three body plans and no special code.
- **Pose**: a flat record of numbers (`Record<string, number>`), so any two
  poses blend and every value can be a track, exactly like `StickPose` today.
- **Gait**: a table of when each foot lands and lifts, plus how the body bobs,
  leans and flexes. Walk, trot, gallop, run, hop and waddle are rows of data.
- **Character description (tokens)**: plain JSON (`{ species: 'dog', size: 'm',
  ears: 'floppy', tail: 'curled' }`, `{ gender: 'female', age: 'child', hair: {
  tie: 'pigtails' } }`) that resolves to a body plan, proportions, a look and
  layers. Easy to store, sync and have AI generate.

### 4. One pen for everything

Every stroke (bodies, hair, clothes, props, animals) goes through one `Pen`
interface with three looks:

- **clean**: tapered filled strokes (today's organic look);
- **pencil**: Pencilmation; graphite strokes that boil (`sketchPen`), pressure
  taper, overshooting ellipses, optional construction lines and paper;
- **silhouette**: everything filled in one colour (the readability check).

Costume, hair and prop code draws with the pen it is handed, so it matches the
look automatically. (Today hooks get a pen only when sketched.)

### 5. Deterministic secondary motion

Hair, ears and tails that swing are computed, not simulated. A cycle knows its
own phase, so its follow-through is a function of phase. For timeline motion
(an `x` track), a helper reads the keyframes (plain JSON) and writes
follow-through tracks: more JSON, no state between frames. Same time, same
frame, always.

---

## Architecture

All under `src/characters/` (file names hyphenated), exported from
`@algorisys/tinyfly/characters`. Nothing here touches the DOM or a framework;
drawing needs only a Canvas 2D context, as today.

```
src/characters/
  rig/
    body-plan.ts      types: BodyPlan, Chain, Bone, Attachment, ContactPoint
    skeleton.ts       pose → 3D joint positions (forward kinematics)
    view.ts           turn/facing → projection, depth order
    contact.ts        rest the lowest contact point on a surface; root rotation
    reach.ts          IK: two-bone (analytic) and long chains (fixed-iteration FABRIK)
    joints.ts         public joints API (2D points, angles, depth) for any character
  look/
    pen.ts            Pen interface; clean, pencil and silhouette pens
    draw-character.ts draw parts far-to-near, run layer hooks per part
  head/
    head.ts           head as an ellipsoid; points on it by (around, up)
    face.ts           eye, brow, nose, mouth styles; expressions
    visemes.ts        lip-sync mouth shapes as numbers that blend
    hair.ts           hair built from parts: cap, fringe, length, tie, texture
    accessories.ts    glasses, hats, facial hair
  motion/
    gaits.ts          gait tables + gaitPose(plan, gait, phase)
    cycles.ts         non-leg cycles: flap, glide, swim wave, waddle
    follow-through.ts secondary motion for hair, ears, tails
  species/
    human.ts          body plan + poses + gaits for people
    quadrupeds.ts     dog, cat, rabbit, horse, cow, goat, deer, fox, bear,
                      monkey, elephant, giraffe, pig, sheep
    birds.ts          sparrow, pigeon, crow, parrot, owl, duck, eagle, hen,
                      flamingo, peacock
    aquatic.ts        fish, penguin, turtle, frog
  wardrobe/           ready-made outfits as layer factories
  props/              phone, cup, umbrella, box, rope, sword, backpack, …
  tokens.ts           character descriptions → plan, proportions, look, layers
  character.ts        public entry: character(), characterTarget(), drawCharacter()
  stick-figure.ts     v1, unchanged
```

### The data model

```ts
/** A bone chain: a spine, a neck, a leg, a wing, a tail, a trunk. */
interface Chain {
  id: string                       // 'spine', 'neck', 'leg.front.left', 'tail'
  attach: { chain: string; at: number } | 'root'  // parent chain and joint index
  bones: { length: number; width: [number, number] }[]  // fractions of body size
  side?: 'left' | 'right'          // mirrored pairs share one definition
  kind: 'spine' | 'neck' | 'arm' | 'leg' | 'tail' | 'wing' | 'trunk' | 'fin'
  contact?: ('end' | 'joint')[]    // which joints can touch a surface
}

interface BodyPlan {
  id: string                       // 'human', 'dog', 'sparrow'
  chains: Chain[]
  head: HeadSpec                   // ellipsoid size, muzzle or beak, ears
  rest: Pose                       // the standing pose
  gaits: Record<string, Gait>      // 'walk', 'trot', 'gallop', 'run', 'hop'
}

/** Every value is a number, so poses blend and tracks animate them. */
type Pose = Record<string, number>
// e.g. 'spine.bend': 12, 'leg.hind.left.0.swing': -20, 'tail.curl': 0.6,
//      'turn': 1, 'root.rotate': 0, 'mouth.open': 0.4, 'viseme.O': 1
```

Angles on a bone are **swing** (forward/back), **spread** (sideways) and, for
spines, necks, tails and trunks, **bend** spread along the chain, so a cat's
back curls with one number and a tail curls with another.

### Turnaround

`turn` runs 0 → 4: 0 front, 1 profile, 2 back, 3 the other profile, 4 front
again. `facing` stays for compatibility (it picks the profile side). Animals
default to `turn: 1` (profile), people to `turn: 0`. The head is an ellipsoid:
eyes, brows, nose and mouth sit at positions on its surface and are hidden when
they turn away, so the face slides round and disappears at the back without a
special back view. Hair parts and the head guides (crown, hairline, ear line,
neck line) are positions on the same surface.

### Contact and rotation

Each body plan lists contact points (feet, knees, hands, hips, elbows, belly,
head, a bird's feet). After the pose (and any whole-body `root.rotate`) is
applied, the lowest contact point rests on the **surface**:

- `ground`: a line (today's behaviour, generalised);
- `water`: a line the body floats in, by buoyancy depth per plan (a duck sits
  on it, a fish moves under it);
- `perch`: a point the feet grip (a branch);
- `air`: no contact (flying, a jump in mid-air).

Lying down, crawling, kneeling, rolling and tripping are then just poses.

### Reaching

`reach(plan, pose, chain, target)` solves a limb to touch a point: the two-bone
case analytically (arms, legs), long chains (trunk, neck, tail) with a fixed
number of FABRIK iterations, so results never vary. A handshake is one
character's hand reaching the other's; holding a cup is the hand reaching the
cup's handle; helping someone up is two reaches.

### Gaits

```ts
interface Gait {
  feet: { chain: string; offset: number; duty: number }[]  // phase offset, fraction on the ground
  stride: number          // ground per cycle, fraction of body length
  lift: number            // foot height in swing
  bob: number; lean: number; spineFlex: number; headBob: number; tailSwing: number
  flight?: number         // fraction with every foot off the ground (run, gallop)
}
```

A foot on the ground stays planted (it moves back at exactly the body's speed)
and a swinging foot arcs forward; the leg reaches its foot by IK. So feet never
slide, for any body plan and any speed: walk the phase by distance / stride.
Human walk, run, sneak and tired shuffle; quadruped walk, trot, gallop and
bound; bird walk and hop; penguin waddle: all rows of data. Flap, glide and swim
are cycles over wing and spine chains instead of feet.

### Public API (sketch)

```js
import { character, characterTarget, poseTracks, gaitPose } from '@algorisys/tinyfly/characters'

// From tokens: plain JSON, so it can be stored or generated.
const didi = characterTarget({
  x: 400, y: 900,
  character: {
    gender: 'female', age: 'adult', build: 'average',
    hair: { length: 'long', tie: 'bun', texture: 'straight' },
    outfit: { top: 'sari', colors: { sari: '#1f9d55', pallu: '#f4c430' } },
    accessories: ['bindi', 'bangles'],
  },
  look: 'pencil',
})

const bruno = characterTarget({
  x: 900, y: 900,
  character: { species: 'dog', size: 'm', ears: 'floppy', tail: 'curled', accessories: ['collar'] },
})

// Poses, gaits and visemes are numbers, so the timeline drives them.
tracks: [
  ...poseTracks('bruno', [{ time: 0, pose: 'sit' }, { time: 800, pose: 'stand' }]),
  { id: 'trot', target: 'bruno', property: 'gait.trot', keyframes: [/* phase */] },
  { id: 'say', target: 'didi', property: 'viseme', keyframes: [/* from narration */] },
]
```

Joints, layers and `…At(target, frame, id)` work for every character, as
`stickFigureJoints`, `layers` and `stickFigureAt` do for v1.

---

## Coverage: every section of the six sheets

| Area | Sections | Milestone |
|---|---|---|
| Turnaround (people, animals, birds), construction points | all six sheets, §1 | 1 (people), 5–6 (animals) |
| Pencilmation look, silhouettes | all sheets | 1 |
| Walk, run, sneak, tired (people) | char §2–3, fluid human §4–5 | 2 |
| Action, emotion, everyday acting, ground poses | movie §4, §9, §13, §15; fluid human §6–7, §12, §15 | 2 |
| Props, two-character interactions | movie §12, §14; fluid human §13–14 | 2 |
| Face expressions, eye/brow/nose/mouth styles | char §8; movie §8; fluid human §8 | 3 |
| Lip-sync mouth shapes | movie §10; fluid human §9 | 3 |
| Hair styles (male, female, kids), hair turnaround and motion | hair §1–5, §8; fluid human §11 | 3 |
| Facial hair, glasses, hats | hair §6 | 3 |
| Hand gestures | movie §11; fluid human §10 | 4 |
| Archetypes, body types, character types, scale and age | char §5, §7; movie §16; fluid human §2–3, §16 | 4 |
| Clothing | char §6; fluid human §1 (clothed) | 4 |
| Style tokens (people) | hair §9; fluid human §18 | 4 |
| Mammals, gaits (walk, trot, gallop; dog vs cat), poses, ears, tails, expressions | animal §1–4, §9, §12; fluid animal §1–5, §10, §13 | 5 |
| Birds, flight cycle, beaks, perching | animal §5–8, §10; fluid animal §6–9, §11 | 6 |
| Aquatic (fish, penguin, turtle, frog, duck) | fluid animal §15 | 6 |
| Animal props, scale and age, tokens, silhouettes | animal §11–14; fluid animal §12, §14, §16–17 | 5–6 |

---

## Milestones

Each is one minor release, and each ends with its model sheet(s) drawn by code
in `examples/headless-video/` and kept in `docs/model-sheet/`, in both the clean
and the pencil look.

| # | Release | Contents | Model sheet |
|---|---|---|---|
| 1 | **Rig core** | Body plans and chains; 2.5D skeleton and view (`turn` 0–4, depth order); contact with surfaces and `root.rotate`; IK (`reach`); the `Pen` and the clean, pencil and silhouette looks; joints and layers per part; the human body plan matching v1's organic look | Human construction and turnaround, bare and clothed, clean and pencil |
| 2 | **People in motion** | Gait engine; human walk, run, sneak, tired; action, emotion, everyday and ground poses; interactions via IK; first props (phone, cup, umbrella, box, rope, laptop, backpack, sword) | Walk and run cycles, actions, emotions, everyday acting, props, interactions, ground poses, silhouettes |
| 3 | **Heads, faces and hair** | Head ellipsoid with guides; eye, brow and nose styles; mouth shapes and lip-sync (`viseme`, narration-driven); hair from parts, ~30 styles for men, women and kids; facial hair, glasses, hats; hair follow-through | The hair and head sheet; face and lip-sync sections |
| 4 | **Hands, bodies and wardrobe** | Hand shapes; proportions and builds (slim, athletic, broad, stocky, tall); ages (toddler to elderly, with a stoop and cane); wardrobe (t-shirt, hoodie, dress, skirt, jacket, shorts, cap, office wear, kurta, sari); people tokens | Character types, body types, clothing, scale and age, tokens |
| 5 | **Four-legged animals** | Quadruped plans; 14 mammals; walk, trot, gallop, bound with spine flex (dog and cat tuned differently); poses (sit, lie, curl, pounce, leap, sniff, look back, wag); ear and tail types; mammal head expressions; animal props and tokens | Quadruped construction, types, cycles, poses, expressions, ears and tails |
| 6 | **Birds and water** | Bird plan; 10 birds; flap, glide, hop, takeoff, landing, perching; beaks and crests; water surface; fish, penguin, turtle, frog, duck | Bird sheet; aquatic section; animal silhouettes |
| 7 | **Editor support** (optional) | Character picker from tokens, pose and gait tracks in the timeline | — |
| 8 | **v1 on v2** (optional) | `drawStickFigure` as an adapter over the human plan, still matching every golden frame | — |

Milestones 1 and 2 are the foundation; 3–6 can then go in any order (for
dialogue-heavy story channels, 3 first).

---

## Testing

- **Joints match drawing**, for every body plan and look, as today's joints
  tests do for the stick figure.
- **Turnaround invariants**: `turn` 2 is `turn` 0 seen from behind (mirrored,
  face hidden); `turn` 1 and 3 are mirror images.
- **Planted feet**: during a gait's stance phase a foot's ground position is
  constant (within 0.5 px) at every phase, for every gait and plan.
- **Contact**: the lowest contact point is on the surface for every pose in
  every pose library.
- **IK**: `reach` lands within 0.5 px when the target is in reach, and points
  straight at it when it is not.
- **Determinism**: every frame of every model sheet renders identically twice,
  and the sheets are golden PNGs.
- **v1 untouched**: the existing golden frames and tests keep passing.

---

## Review answers (2026-10-03)

| # | Question | Answer |
|---|---|---|
| 1 | v2 beside v1, or replace? | **A new API beside v1** (option A): `character()`, `characterTarget()`, `drawCharacter()` in `@algorisys/tinyfly/characters`; v1 frozen (bug fixes only) until milestone 8 rebuilds it on v2; each milestone is a minor release (milestone 1 is 0.77) |
| 2 | Skeletons with depth? | **Yes**, and the same skeletons must also draw traditional Pencilmation stick figures and bare figures, not only fluid dressed ones |
| 3 | Default line weight | **The bold viral look** (about 4–5% of the height, a bigger head), for now |
| 4 | Pencilmation scope | **All of it**: boiling strokes, construction lines, pressure variation and rubbed-out lines |
| 5 | Order after milestone 2 | **Heads and lip-sync first** |
| 6 | Editor support | **Wanted** |

What changes in the plan:

- **Figure styles (milestone 1).** Besides the look (clean, pencil, silhouette),
  a character has a figure style, all from the same skeleton:
  - **stick**: the traditional Pencilmation figure, single lines and a circle head;
  - **bare**: the fluid body, tapered limbs, hands and feet, no clothes;
  - **dressed**: bare plus wardrobe, hair and accessories.
- **Bold by default.** The default proportions and line weight are the bold
  look; a thin preset matches the reference sheets.
- **Pencil look (milestone 1)** adds construction lines (the skeleton's guide
  shapes under the final line), pressure variation along each stroke, and
  rubbed-out lines (faint erased strokes, using the existing erase helpers),
  all deterministic.
- **Order:** 1 rig core, 2 people in motion, 3 heads, faces, lip-sync and hair,
  then 4 hands, bodies and wardrobe, 5 four-legged animals, 6 birds and water.
- **Editor support is in scope.** Rather than one milestone at the end, each
  milestone adds its part to the editor (a character element from tokens in 1,
  pose and gait tracks in 2, expression and viseme tracks in 3, and so on).
  Milestone 7 becomes the polish pass: a character library panel and pose
  presets.
