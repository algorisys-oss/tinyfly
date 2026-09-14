# Education animation: fixes after the first real rollout

Follow-up to `education-animation.md`. **v0.64.0** shipped almost everything that
document asked for, and teachyourselfcoding.com moved its Go series onto it the
same day: 5 animations, 20 posts, 4 languages (en, pt-BR, es, zh-CN), loaded as
`tinyfly-embed.iife.js@v0.64.0` with the published SRI and mounted with
`mountAll()`.

This lists what that rollout found. Each item was **reproduced on a minimal
page against the v0.64.0 CDN build**, not just seen once on the site. One thing
that first looked like a bug turned out not to be; it's noted at the end so
nobody spends time on it.

Written 14 September 2026 against `fc3bbb9`.

> **Status: all six items are fixed in v0.65.0.** Items 1–2 are
> covered by the e2e `embed` check with computed styles in Chromium, Firefox and
> WebKit; see Phase 30 in [todo.md](todo.md).

---

## What worked first time

This is worth recording, because it's most of the release:

- Markers, `next()` / `prev()`, the step counter and the scrub bar, across all 5
  animations: every rest point landed on exactly one caption.
- **Reduced motion:** the final frame with no autoplay, plus stepping by jumps.
- **`playWhenVisible`:** autoplay waits until the figure is seen.
- **SVG `fill` on the player:** it now works.
- **Translated control labels** passed through `data-labels` (Portuguese,
  Spanish, Chinese).
- **The published SRI hashes** in `cdn/README.md` matched the downloaded files
  byte for byte.
- **Mounting existing markup:** adding `data-tinyfly-embed`,
  `data-tinyfly-timeline` and injected markers at runtime let 20 already-published
  posts adopt the embed with no content change.
- **No console errors or warnings** on any page.

The site's hand-written controller (about 200 lines) was deleted.

---

## Bugs

### 1. The question row, with its Reveal button, shows when there is no question

**Severity:** visible on every figure whose markers have no `question`, which
is most of them.

**Repro:** a timeline with markers but no `question`, mounted with the default
controls. A "Reveal" button appears under the bar and does nothing useful.

**Cause:** `src/embed/controls.ts`.

- **Line 79:** `.tf-ctl-question { display: flex; … }`
- **Line 168:** `question.hidden = true`
- **Lines 199 and 202:** `question.hidden = !waiting` / `question.hidden = true`

The `hidden` attribute only works through the browser's default stylesheet,
`[hidden] { display: none }`. An author rule that sets `display` on the same
element has higher precedence, so `display: flex` wins and the element stays
visible even though `question.hidden === true`.

Measured on the repro page, with no questions defined:

```
question.hidden                                        → true
getComputedStyle(question).display                     → "flex"
```

**Fix, one line in the controls stylesheet:**

```css
.tf-ctl-question[hidden] { display: none; }
```

Or, more robustly, apply it to every element the controls toggle with `hidden`:

```css
.tf-ctl [hidden] { display: none !important; }
```

**Worth checking at the same time:** `prev.hidden`, `next.hidden` and
`step.hidden` (line 187) are safe today, because `.tf-ctl-btn` and
`.tf-ctl-step` don't set `display`. A future rule that does would break them the
same way, so the general rule above is the safer fix.

**Test:** jsdom doesn't compute cascaded styles, so a unit test won't catch
this. It needs the Playwright e2e suite: mount a figure without questions, then
assert `getComputedStyle(q).display === 'none'`.

**teachyourselfcoding.com workaround:** `.tyc-anim .tf-ctl-question[hidden] { display: none; }`
in its snippet, to be removed once a release includes the fix.

### 2. The caption line reserves space when there is nothing to show

**Severity:** cosmetic. It adds about 20px of empty space under the bar on
figures with no captions.

**Repro:** markers without `label` or `captions`, controls with the default
`captions: true`.

**Cause:** `controls.ts:78` gives `.tf-ctl-caption` a `min-height: 1.4em`, and
the element is always appended (line 164). When `player.caption()` returns
nothing, the line stays empty but keeps its height. Measured height: 19.6px.

**Why it matters for teaching figures:** many teaching SVGs draw their step text
inside the figure, so it scales and translates with the drawing. Those figures
have markers for stepping but no captions, and get a blank strip.

**Fix, either of these:**
- Hide the caption line when the timeline has no captions and no marker has a
  label: `caption.hidden = !player.markers.some(m => m.label) && !hasCaptions`.
  That needs the `[hidden]` rule from item 1.
- Or drop the `min-height` when the caption is empty:
  `.tf-ctl-caption:empty { min-height: 0; margin: 0; }`.

The `min-height` exists so the bar doesn't jump as captions change. Keep it when
any marker has a caption, and drop it only when none do.

**teachyourselfcoding.com workaround:** passes `controls: { captions: false }` to
`mountAll()`.

---

## Smaller things

### 3. Loading both IIFE bundles on one page silently replaces the first

`tinyfly-player.iife.js` and `tinyfly-embed.iife.js` both assign a global
`var tinyfly`. A site that loads the player on some pages and the embed on
others, or both through two plugins, gets whichever loaded last. The README
mentions loading one, but nothing enforces it.

**Suggestion:** the second bundle to load should keep the first bundle's
exports, or at least `console.warn('tinyfly: already loaded (player); embed
bundle replaced it')`. That turns a confusing "mountAll is not a function" into
a clear message.

### 4. The visible step counter doesn't use the `step` / `of` labels

`controls.ts:191` shows `${index} / ${markers.length}` as visible text. The
translated `labels.step` and `labels.of` go only into the `aria-label` (line 192).
`2 / 5` reads fine in most languages, so this is a choice rather than a bug.

**Suggestion:** document it, or add an optional `labels.stepFormat` such as
`"{index} / {total}"` or `"第 {index} 步，共 {total} 步"` for sites that want words.

### 5. Document how `initialFrame` interacts with reduced motion

The behaviour is right: under `prefers-reduced-motion`, `applyReducedMotion()`
runs after `showInitialFrame()` and seeks to the end, whatever `initialFrame`
says. The repro confirmed this for `initialFrame: 'start'`, and for no
`initialFrame`, with and without `autoplay`.

It isn't written down, though. Someone setting `initialFrame: 'start'` could
reasonably expect it to win. One sentence under the `initialFrame` option would
settle it: "Reduced motion takes precedence and shows the final frame; set
`respectReducedMotion: false` to opt out."

### 6. A shorthand for markers placed purely by time

Sites adopting embeds on existing content often have step times but no marker
objects. teachyourselfcoding.com keeps `data-steps="0,2300,3800,6500"` on each
figure and converts it at runtime:

```js
def.config.markers = steps.map((t, i) => ({ id: 'step-' + (i + 1), time: t }))
```

**Suggestion (optional):** `data-markers="0,2300,3800,6500"` on the embed element,
producing unlabelled markers with generated ids. It costs a few lines in
`mount.ts` and removes a common piece of glue.

---

## Not a bug: `initialFrame: 'start'` under reduced motion

During the rollout, a figure mounted with `{ autoplay: true, initialFrame: 'start' }`
seemed to stay on step 1 under reduced motion, with "Previous" disabled.

A minimal repro showed otherwise. Under reduced motion, three embeds
(`autoplay` only, `autoplay` + `initialFrame: 'start'`, and `initialFrame: 'start'`
only) all came up at `t=1000` (the end), `reducedMotion=true`, not playing, on
the last marker. That held with both a fresh browser context and
`emulateMedia` on an existing page. The earlier observation came from the site's
own test harness, not tinyfly.

---

## Suggested order

1. **Item 1.** One CSS line, visible on most teaching figures.
2. **Item 2,** with item 1's `[hidden]` rule.
3. **Items 5 and 4.** Documentation only.
4. **Items 3 and 6** whenever convenient.

When a release includes items 1 and 2, teachyourselfcoding.com will bump its pin
and SRI together and delete both workarounds.
