# A deck made with tinyfly

Three slides: a figure that walks in and waves, one point per click, and a
question with a countdown. See [docs/presenting.md](../../docs/presenting.md).

```sh
npm run build:browser                     # once: builds lib/browser/tinyfly.iife.js
npx vite examples/present-deck            # or any static server, then open index.html
node bin/tinyfly.mjs present examples/present-deck/index.html -o deck.html   # one offline file
```

- `index.html`: the slides, their CSS and notes.
- `scenes.js`: one scene factory per slide id.

For a real talk, copy the built `tinyfly.iife.js` into a `vendor/` folder beside
the deck and load it from there, so the deck keeps the version it was rehearsed with.
