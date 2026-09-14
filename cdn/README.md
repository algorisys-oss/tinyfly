# tinyfly CDN bundles (v0.66.0)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.66.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.66.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.66.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.66.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-T21D3ewcyE8ZLj2GqAAKG79hlvaJynluf4gKLPrDOpGula9gsL/2kd7ND8T5hmOK` |
| `tinyfly.umd.js` | `sha384-hKrEQRXiYQ/UQgHW0XM3D8Lr+7jWLn/SC8sRnM/l2FmvoRwU+4mkJwUyIIVB72zB` |
| `tinyfly.esm.js` | `sha384-kK+FBOX0dmIbJj2jO+nCA1y5eLMrRpAHBZhvvR8iD622DGt+Z23PghD3TSAruuAi` |
| `tinyfly-player.iife.js` | `sha384-fcCf+LEj22Q7i67IrtPjU6iUUflFlwsDibqhNWFFWQtzQDscyMNrzpegingVVUtg` |
| `tinyfly-embed.iife.js` | `sha384-ATBsgYJeGJL90kKFeKxzlUG+B/wgWuHy9q5wH7zblC5L//n4DYMib8raORR8rmGm` |

