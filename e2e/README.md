# Cross-browser checks

Runs tinyfly in real Chromium, Firefox and WebKit and measures what matters:
engine results against each browser's own geometry, adapter output by pixels,
exports, IndexedDB persistence, every GSAP-style demo, and the editor.

```bash
npx playwright-core install firefox webkit   # once; Chromium uses installed Chrome
npm run e2e                                  # all browsers
npm run e2e -- --browser firefox             # one browser
npm run e2e -- --check demos                 # one check
```

It starts the Vite dev server itself. Checks import source modules directly
(`/src/engine/index.ts`) into `e2e/harness.html`, so they test the code as
written, in each engine, without a build.

Each check lives in `checks/` and exports `{ name, run(context) }`, returning a
list of `{ label, ok, detail }` results. A browser that lacks a capability
(WebCodecs in some engines) reports it as a note rather than a failure.
