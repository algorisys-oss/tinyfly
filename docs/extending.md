# Extending tinyfly

tinyfly has no plugin system, and that is deliberate. A plugin would put
arbitrary code inside the engine, which evaluates animations and must stay
deterministic and serializable. Instead there are four ways to extend it, from
the one that needs no engine change to the one that does:

1. **Render somewhere new:** write an adapter.
2. **Animate new kinds of things:** plain-object targets and the ticker.
3. **Shape motion:** eases, custom curves and stagger offsets.
4. **Add a track kind:** an engine change, with the contract below.

Examples and showcases are also contributions. The last section covers how to
add one to the gallery.

## 1. A render adapter

The engine never draws anything. A timeline answers one question: *what are the
values at this time?*

```ts
const state = timeline.getStateAtTime(1250)
// state.values: Map<targetName, Map<property, value>>
```

An adapter applies that state to something: DOM elements, a canvas, WebGL
uniforms, a terminal, a LED strip. Its whole contract is a method that takes an
`AnimationState`:

```ts
import { Timeline, type AnimationState } from '@algorisys/tinyfly'

class ConsoleAdapter {
  private readonly targets = new Map<string, { label: string }>()

  registerTarget(name: string, target: { label: string }) {
    this.targets.set(name, target)
  }

  applyState(state: AnimationState) {
    for (const [name, properties] of state.values) {
      const target = this.targets.get(name)
      if (!target) continue
      console.log(target.label, Object.fromEntries(properties))
    }
  }
}
```

Drive it with whatever clock you have:

```ts
let last = performance.now()
requestAnimationFrame(function frame(now) {
  timeline.tick(now - last)
  last = now
  adapter.applyState(timeline.getStateAtTime(timeline.currentTime))
  requestAnimationFrame(frame)
})
timeline.play()
```

The built-in adapters show the patterns to copy:

| Adapter | Look at it for |
|---|---|
| `DOMAdapter` (`src/adapters/dom`) | Merging several properties into one `transform` per element; filters; text |
| `CanvasAdapter` (`src/adapters/canvas`) | Retained targets redrawn each frame; gradients; clip insets |
| `SVGAdapter` (`src/adapters/svg`) | Attributes vs. styles; path `d`; stroke drawing |
| `WebGLAdapter` (`src/adapters/webgl`) | Writing values into uniforms |

**Rules an adapter keeps:**

- **Read nothing back.** An adapter writes values; it never measures the thing it
  renders to decide what to write. Values come from the timeline only, which is
  what keeps playback deterministic.
- **Ignore what you don't understand.** An unknown property is skipped, not an
  error, so one JSON file plays in several renderers.
- **Apply the whole state.** Don't cache "what changed" in the adapter; the engine
  and stage already avoid redundant work.

## 2. Animating anything with `live`

For most integrations you don't need an adapter at all. `live` tweens **plain
objects**, and `ticker.add` runs your drawing code after each frame's values are
applied:

```js
const uniforms = { time: 0, glow: 0 }
live.to(uniforms, { glow: 1, duration: 0.6, repeat: -1, yoyo: true })
live.ticker.add(() => {
  material.uniforms.uGlow.value = uniforms.glow   // Three.js, PixiJS, a game loop…
  renderer.render(scene, camera)
})
```

Plain objects work with everything else too: scroll triggers, stagger, springs,
keyframes, `quickTo` and `repeatRefresh`.

## 3. Shaping motion

- **Named eases:**
  - `live.customEase(name, 'M0,0 C…')` takes a curve drawn in a design tool.
  - `customBounce` and `customWiggle` generate physical curves.
  - All of these register a name you can use as `ease`.
- **Parametric eases:** `{ type: 'elastic' | 'bounce' | 'back' | 'steps', … }` are
  exact and serializable. Prefer them over sampled curves when one fits.
- **Explicit stagger offsets:** a track's `stagger.offsets` takes any per-target
  timing you can compute, such as a hex grid, distance from the pointer or reading
  order. They are stored as plain numbers in the JSON.
- **Function values:** `x: (index, target, targets) => …` run when the tween is built
  (and on every repeat with `repeatRefresh`). Randomness comes from `live.utils`,
  which is seeded.

## 4. A new track kind

Keyframe, spring, inertia, motion-path and text tracks cover most motion. A new
kind of track is an engine change. It is welcome when it describes motion that
keyframes can't, compactly and deterministically.

A track kind must provide:

| Piece | Where | Why |
|---|---|---|
| A JSON shape and type guard | `src/engine/types.ts` | Definitions are the source of truth |
| Evaluation at any time, with no hidden state | `src/engine/core/` | Scrubbing backwards and seeking must match playing |
| Duration | `src/engine/core/track.ts` | Timelines size themselves from their tracks |
| Validation on load | `src/engine/serialization` | Bad JSON fails loudly, not halfway through playback |
| Baking to keyframes | `src/engine/core/bake.ts` | CSS, Lottie and other keyframe formats can export it |
| A `live` / GSAP-style entry | `src/compat/gsap` | Code users can author it |
| Tests | beside each file | Solution values at set times, a JSON round trip, and a bake |

Springs (`spring.ts`) and inertia (`inertia.ts`) are good models: each is a
closed-form or fixed-step function of time, serialized as a few parameters.

## Contributing an example

Gallery examples live in `src/examples/live-demos/` (cards) and
`src/examples/showcases/` (full pages). Each is a plain JavaScript module that
exports:

- `html`: the markup, with a scoped `<style>`;
- `run(live, root)`: the animation. It may return a cleanup function.

The code between `// #region code` and `// #endregion code` is what the card shows
and what **Copy code** puts in a standalone page. Keep everything the animation
uses inside that region, so the copied page runs as is. Register the module in the
folder's `index.ts`. `npx vitest run src/examples` then runs it, checks that it
cleans up, and builds its standalone page.

A good example:

- shows one idea well, or a whole page done properly;
- respects `prefers-reduced-motion` (see `live.matchMedia`);
- animates transforms and opacity rather than layout;
- stops work that isn't visible.
