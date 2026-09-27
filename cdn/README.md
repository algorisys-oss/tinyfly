# tinyfly CDN bundles (v0.74.1)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.74.1/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.74.1/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.74.1`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.74.1/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-GUkw9gM8eFoVx9CtnfuAOkOjLArBqRz3sCm+nqfZqmg5CNKJcSxp21RpB3mJP1Lb` |
| `tinyfly.umd.js` | `sha384-p4FpPw/1MBWiEI289GAEJhTPDfbP4/E73JoaWaHJyfpMaG14hDKxOBIABdbpqZED` |
| `tinyfly.esm.js` | `sha384-F2mW50YRVKJ4ZskwL1t2iaL8s0u9E1GpBxOg/E/LFKevjNMByrCxZen5+WGBh6Gb` |
| `tinyfly-player.iife.js` | `sha384-/x7WYXTh/H+0tdBT7oQJXH6tDKPzGgh2j7B1X7cOK1vkpSXkrRYnxZEmx2sAHtXT` |
| `tinyfly-embed.iife.js` | `sha384-uBt39OHzZEP3lOfkOm/dPRznbsRNC3MZeYxIPkZsHSAoJJxA7il1VQRRevi1siKh` |

