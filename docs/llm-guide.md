# Building Animations with an LLM

tinyfly is built to be written by code, and that includes code a language
model writes. This page is for you, setting up an assistant (Claude Code,
Cursor, Copilot, a chat window), and for the assistant itself.

The short version: **read the catalog, write, check, look.**

## 1. Read the catalog first

Everything tinyfly can do, read from the library itself:

```bash
npx @algorisys/tinyfly capabilities          # markdown
npx @algorisys/tinyfly capabilities --json   # the same as data
```

It lists the easings, track kinds, every property each canvas shape can
animate (with units and ranges), the stick figure's joints, poses,
expressions, gags, gaits, beat actions, dances, flips and hand shapes, the v2
character's poses, the code panel's languages, anchors and edits, camera
shots and the teaching helpers. It is generated from the code, so it can't
fall behind: **a name in it is accepted, and a name not in it is rejected.**
It is also the last part of `llms-full.txt`.

From code, the same catalog is `capabilities()` (and `capabilitiesMarkdown()`)
in `@algorisys/tinyfly/characters`.

## 2. Ask a target what it can do

```js
import { stickFigureTarget, codePanel, describeTarget } from '@algorisys/tinyfly/characters'

describeTarget({ type: 'rect', x: 0, y: 0, width: 80, height: 40 })
// { type: 'rect', properties: [{ name: 'opacity', unit: '0..1', min: 0, max: 1, value: … }, …] }

describeTarget(stickFigureTarget({ x: 200, y: 300 }))
// { kind: 'stick figure', properties: [{ name: 'rightShoulder', unit: 'degrees', description: '…', value: 18 }, …],
//   actions: { walk: '…', grab: 'Steps to where its arm reaches the target …', … } }
```

Custom targets can describe themselves with `about` (`kind`, `summary`,
`props`, `actions`); the stick figure and the code panel do.
`animatableProperties(target)` is just the names.

## 3. Check before you play

Wrong names fail loudly, with the name that was probably meant:

```text
scriptTracks: 2 problem(s) in the beats:
  beat 0: Unknown action "jumpp": did you mean "jump"? Known: walk, bouncy, …
  beat 1: Unknown beat field "expression": did you mean "mood"? Known: do, at, for, …
```

- **Beat scripts**: `scriptTracks()` throws on errors. `checkBeats(beats)`
  returns errors and warnings without throwing, and from the command line:
  `npx @algorisys/tinyfly check beats.json`.
- **Tracks**: `checkTracks(tracks, targets)` finds tracks aimed at targets
  that aren't there, properties a target can't animate (`rotation` → `rotate`),
  keys out of time order, values of the wrong kind and values out of range.
- **Code panels** reject unknown languages and remove styles. `token()` throws
  when a line doesn't have the word.
- **Teaching timelines**: `npx @algorisys/tinyfly validate timeline.json --markup figure.svg`.

## 4. Look at it

An animation that compiles can still look wrong. Render frames and look at
them before calling it done:

```bash
npx @algorisys/tinyfly video scene.mjs --stills frames --times 0,800,1600,2400
```

A model that can read images should look at the PNGs: is the hand on the
word, does the figure stand on the line, does the text land where it should?
Fix, render again.

## The rules that trip models up

- **Milliseconds in JSON, seconds in the GSAP-style API.** Timeline keyframes
  and beats are ms; `live.to(el, { duration: 1 })` is seconds.
- **Canvas `x`/`y` tracks are offsets** from where the target was placed, not
  positions. A beat script's `to` is a scene x, and its tracks are offsets
  from `from` (and `ground` for y).
- **Scene y grows downward.** A floor higher up the screen has a smaller y.
- **Angles are degrees.** Stick-figure arms: 0 hangs down, 90 straight out,
  180 straight up; in profile the left arm's forward is negative.
- **Aim beats at anchors, not guessed numbers**: `code.line(7)`,
  `code.token(3, 'var')`, `code.spot(2, 8, 4)`, `piece.home`.
- **Key reactions to contact times.** Beats that touch something report
  `result.beats[i].contact` (and `release`): wipe the line, fling the word or
  type the text at those times.
- **Record panel edits before `code.ride()`**, which reads the moves they make.

## Set up your assistant

The npm package ships everything an agent needs, at the version installed:

```text
node_modules/@algorisys/tinyfly/
  llms.txt              the index
  llms-full.txt         every doc, the course and the capability catalog
  docs/*.md             the docs
  skills/tinyfly/SKILL.md
```

**Claude Code**: copy the skill into your project and it loads when you ask
for an animation:

```bash
mkdir -p .claude/skills && cp -r node_modules/@algorisys/tinyfly/skills/tinyfly .claude/skills/
```

**Other agents** (Cursor, Copilot, Codex, Aider): point them at the skill
from your `AGENTS.md` or rules file:

```markdown
When writing tinyfly animations, follow node_modules/@algorisys/tinyfly/skills/tinyfly/SKILL.md.
```

**A chat window**: paste the output of `npx @algorisys/tinyfly capabilities`,
or link `llms-full.txt`.
