# tinyfly CDN bundles (v0.72.0)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.72.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.72.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.72.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.72.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-lcCjjUdy30w4zJSE0wHHNya2LbAAXwt0RISXYlwExcprjwvC44UbnSrPTE3vccjR` |
| `tinyfly.umd.js` | `sha384-pcMYw+OzDsZYGuCoQRxxLz6sCyMgufig2V1QuJdtn2+I1taIKM1mbwZi72DDXMHo` |
| `tinyfly.esm.js` | `sha384-4Mo7YnJ0A/OWb9DAIu3x37jRF+ApPKbuRsrUEDtihjU3Nzplt76pmcviqLnid5m5` |
| `tinyfly-player.iife.js` | `sha384-/x7WYXTh/H+0tdBT7oQJXH6tDKPzGgh2j7B1X7cOK1vkpSXkrRYnxZEmx2sAHtXT` |
| `tinyfly-embed.iife.js` | `sha384-uBt39OHzZEP3lOfkOm/dPRznbsRNC3MZeYxIPkZsHSAoJJxA7il1VQRRevi1siKh` |

