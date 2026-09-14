# tinyfly CDN bundles (v0.68.1)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.68.1/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.68.1/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.68.1`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.68.1/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-lfw7c8LawvvP2KdgSsVOL8r/xWc8zgPwuNT2dUkUc3XUi8qkiq3n3esV4VT8163C` |
| `tinyfly.umd.js` | `sha384-Vn1z6R4WRqaxa+kbvnUDwHYm6X9C8TUWu0zeS25RvU2mb8jYyRlC54KGAmnEETQ4` |
| `tinyfly.esm.js` | `sha384-jGu/E2/BEDAslQ17DwZ+khhzNvrgvU5ULAQ4QpZ3wOf0hFwp4LwT0QcsWVdCCJ/s` |
| `tinyfly-player.iife.js` | `sha384-fcCf+LEj22Q7i67IrtPjU6iUUflFlwsDibqhNWFFWQtzQDscyMNrzpegingVVUtg` |
| `tinyfly-embed.iife.js` | `sha384-ATBsgYJeGJL90kKFeKxzlUG+B/wgWuHy9q5wH7zblC5L//n4DYMib8raORR8rmGm` |

