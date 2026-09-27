# Video from code: example scenes

Each `.mjs` file here default-exports a tinyfly video scene. Render one to MP4
without a browser (needs `ffmpeg` on the PATH and `npm install @napi-rs/canvas`):

```bash
npx tinyfly video examples/headless-video/stick-figure.mjs --srt stick-figure.srt
npx tinyfly video examples/headless-video/bar-chart.mjs --stills stills/
npx tinyfly video examples/headless-video/cairo-style.mjs --scale 0.5 --fps 12
```

In this repository, run `npm run build:libs` first so `@algorisys/tinyfly`
resolves to the built package.

| Scene | Shows |
|---|---|
| `stick-figure.mjs` | Narration timing (`planNarration`), the `characters` stick figure posed, walked and voiced by tracks, a per-scene backdrop, captions |
| `bar-chart.mjs` | Timeline targets only: the whole animation is JSON |
| `cairo-style.mjs` | Pure immediate mode: a duration and `draw(ctx, { time })` |

The guide is [docs/video-rendering.md](../../docs/video-rendering.md). The unit
tests (`src/headless/examples.test.ts`) draw every still of every scene here.
