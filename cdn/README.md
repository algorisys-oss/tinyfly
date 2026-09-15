# tinyfly CDN bundles (v0.70.1)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.70.1/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.70.1/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.70.1`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.70.1/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-ssrJ58ERonbVoKheU26NHGzReg7QiM1iwpeVk9Wuvlmr2G8I6eiOM9w6HqDk4Ato` |
| `tinyfly.umd.js` | `sha384-ShQFGHtYHBHGMuYUNLxrVdUY+xPT5YLau2vFYLZH04qsCrvEVtRG5nDEehmmAJJS` |
| `tinyfly.esm.js` | `sha384-tS/xXH4hXK0wqEAlFiwILDJNIqeHSXNXWvyCJ3BOt85B8j5dvCb6+hmQxBrZDTQf` |
| `tinyfly-player.iife.js` | `sha384-/x7WYXTh/H+0tdBT7oQJXH6tDKPzGgh2j7B1X7cOK1vkpSXkrRYnxZEmx2sAHtXT` |
| `tinyfly-embed.iife.js` | `sha384-kC6yIxNv13FChTn4flIqJKMW25i3CPWitY7AEZv3L43nsX/G9InBCzgdFLK6mRhJ` |

