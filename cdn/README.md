# tinyfly CDN bundles (v0.75.0)

Built from this commit by the release process — do not edit by hand.

| File | What | Global |
|---|---|---|
| `tinyfly.iife.js` | Everything: engine, player, `live` (GSAP-style), drivers, interaction, teaching embeds (`data-tinyfly-auto`) | `tinyfly` |
| `tinyfly.umd.js` | The same, as UMD | `tinyfly` |
| `tinyfly.esm.js` | The same, as an ES module | — |
| `tinyfly-player.iife.js` | Player only, for playing exported JSON (smaller) | `tinyfly` |
| `tinyfly-embed.iife.js` | Only teaching figures: player + step controls + `[data-tinyfly-embed]` mounting (smaller) | `tinyfly` |

Pick one: `tinyfly.iife.js` covers everything, including teaching embeds; the
player and embed bundles are smaller subsets. Loading more than one is safe — they
add to the same `tinyfly` global.

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.75.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.75.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.75.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.75.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-LMU53aXUU1rnT2yJF5VPLSQ0uKUB7IkpRzzXEP/nWyOhD6KpWp43LfDHF/LGmlZy` |
| `tinyfly.umd.js` | `sha384-WLR3PkobIi1KqfcTJztJSndrNWWsP5UvqZd1fdx1PEdOwcMtc7Ek51oqdkyUnNlp` |
| `tinyfly.esm.js` | `sha384-EEK5NM0+BZDdURwPShmMDfuDlDT2/a8HfpR1IHtQiwxNHirRJ5pi28LhFh+Q+P3W` |
| `tinyfly-player.iife.js` | `sha384-uT530d8IemDDsf4Ekg7+6qDhVB1bXMHI9FchEj/y91iexRiXlbfwNPjhgJOH/VIZ` |
| `tinyfly-embed.iife.js` | `sha384-gZzJRnzwJFA1sD7MGQ15JCpC5qD9z21GLZ0IZ1Wlg93bwap152Fa5/1KlnVriyp0` |

