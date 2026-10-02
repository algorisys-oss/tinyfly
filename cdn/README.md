# tinyfly CDN bundles (v0.76.0)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.76.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.76.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.76.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.76.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-BN+BpQpdlWQ6uxSaDKaGQs+F+sTZ7isZkCG1DZCDD975hRwSvF/EiuFS5nM6Tbi3` |
| `tinyfly.umd.js` | `sha384-hc6fIrHehkp1LzRqA01Um332LhCK88pyZG+K3Gvqi6x7PT85EgexU/l9dX6Q3I+a` |
| `tinyfly.esm.js` | `sha384-CUNiKTGMV4bf7+HtnUk3pyYsCmpnFCX3sKUB0Z2PY0SQUQ5MvvESE0Vhp162GhON` |
| `tinyfly-player.iife.js` | `sha384-uT530d8IemDDsf4Ekg7+6qDhVB1bXMHI9FchEj/y91iexRiXlbfwNPjhgJOH/VIZ` |
| `tinyfly-embed.iife.js` | `sha384-gZzJRnzwJFA1sD7MGQ15JCpC5qD9z21GLZ0IZ1Wlg93bwap152Fa5/1KlnVriyp0` |

