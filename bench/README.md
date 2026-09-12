# Benchmarks

Three harnesses, each answering a different question. Run the two HTML ones
through the dev server (`npm run dev`, then open the path).

| Harness | Question | How to run |
|---|---|---|
| `engine-bench.mjs` | How fast is evaluation itself, with no DOM? | `node bench/engine-bench.mjs` |
| `work-bench.html` | How much main-thread time per frame, vs GSAP? | `/bench/work-bench.html` |
| `split-bench.html` | Where does that time go — engine or adapter? | `/bench/split-bench.html` |

`browser-bench.html` measures real frame intervals. It is kept for completeness
but is **not** the one to reason from: it is clamped by vsync, so both libraries
report a 16.70 ms median right up until they fall off a cliff. Only its
dropped-frame column carries signal.

## Results — v0.50.1, one machine, Chromium

Absolute numbers are machine-specific. **Ratios travel; absolutes do not.**

### Per-frame work vs GSAP

Both driven manually from the same loop (GSAP's ticker put to sleep and its root
advanced via `gsap.updateRoot`), so the comparison is symmetric. Each element
animates `x` + `opacity` + `rotate` — three tracks per element for tinyfly.

| elements | tinyfly | GSAP | ratio | tinyfly headroom @60fps |
|---:|---:|---:|---:|---:|
| 100 | 0.60 ms | 0.20 ms | 3.0× | 27.8× |
| 500 | 1.70 ms | 0.70 ms | 2.4× | 9.8× |
| 1,000 | 3.00 ms | 1.10 ms | 2.7× | 5.6× |
| 2,000 | 6.00 ms | 2.10 ms | 2.9× | 2.8× |
| 4,000 | 15.30 ms | 3.20 ms | 4.8× | 1.1× |

**Read it this way:** GSAP is meaningfully faster, by roughly 3× at realistic
sizes. But tinyfly still has 5.6× headroom at 1,000 animated elements, which is
far past what most real pages do. The gap matters at 4,000+, where we are at the
frame budget and GSAP still has 5× spare.

The ratio being roughly flat from 100 to 2,000 says this is a **constant factor,
not a worse algorithm** — which is the encouraging reading. The jump at 4,000 is
allocation pressure.

### Where tinyfly's time goes

| elements | engine | adapter | engine share |
|---:|---:|---:|---:|
| 100 | 0.10 ms | 0.20 ms | 33% |
| 500 | 0.40 ms | 0.90 ms | 31% |
| 1,000 | 0.70 ms | 2.30 ms | 23% |
| 2,000 | 1.40 ms | 4.10 ms | 25% |
| 4,000 | 2.20 ms | 6.00 ms | 27% |

**The DOM adapter is ~75% of the cost; interpolation is ~25%.** That is the most
useful thing these benchmarks produced: the engine — the part the project's
principles are about — is not the problem.

Some of the adapter's cost is structural. The engine produces a state
`Map<target, Map<property, value>>` and the adapter reads it back and composes
strings; GSAP writes straight to the element. That indirection is the
adapter architecture, not an accident, so closing the gap means optimising
*within* it rather than removing it.

### Engine evaluation, no DOM (`engine-bench.mjs`)

Microseconds per `getStateAtTime`, median/p95:

| scenario | 100 | 1,000 | 2,000 |
|---|---:|---:|---:|
| keyframe tracks | 22.6 / 82.4 | 206.1 / 464.0 | 416.2 / 918.6 |
| spring tracks | 13.9 / 36.2 | 135.0 / 260.6 | 356.3 / 609.4 |
| runtime stagger (1 track, N targets) | 12.7 / 30.2 | 100.2 / 155.9 | 283.3 / 464.6 |
| colour tracks | 33.7 / 55.7 | 278.3 / 480.4 | 619.9 / 1031.2 |

Roughly 12,000 keyframe tracks fit in a single 60 fps frame, evaluation only.

Note that runtime stagger evaluates ~2× faster than the equivalent baked tracks
at 1,000 targets. An earlier, less rigorous measurement (fewer samples, no
warm-up) reported parity; this harness warms up for 200 iterations and takes the
median of 1,000. The file-size argument for runtime stagger still stands on its
own, but speed is now a second point in its favour rather than a wash.

## Optimisations this found

**Colour interpolation re-parsed its endpoints every frame** and reallocated its
`isHex`/`isRgb`/`isRgba` predicates on every call. Endpoints are keyframe values
— the same few strings for the life of the animation — so they are now memoised
(bounded at 512 entries) and the helpers are hoisted. Measured within a single
run to control for machine state, colour went from **2.44× the cost of a numeric
track to 1.35×**.

**The DOM adapter allocated three objects and an array per element per frame**
for origins, clipping and filters, whether or not the element used any of them —
about a million throwaway objects a second at 4,000 elements. Now allocated
lazily. Adapter cost at 4,000 elements: **7.10 ms → 6.00 ms**.

## An optimisation that made things worse

Caching the last composed transform string per element to skip an unchanged
`style.transform` write **slowed the adapter down** (2.40 ms → 2.80 ms at 1,000
elements) and was reverted. In a running animation every transform changes every
frame, so the cache never hits and each element pays an extra WeakMap get *and*
set for nothing.

It is recorded in a comment at the write site so nobody re-derives it. It would
only pay off for tracks that have already settled, which is not the case worth
optimising for.

## Caveats

- One machine, one browser (Chromium), one workload shape.
- GSAP 3.12.5 from CDN.
- tinyfly runs three tracks per element where GSAP runs one tween with three
  properties. That is the natural way to express the same animation in each
  library, but it is not a like-for-like count of internal objects.
- Nothing here measures memory, startup cost, or Firefox/WebKit.
