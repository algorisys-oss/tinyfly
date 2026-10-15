# tinyfly CDN bundles (v0.116.0)

Built from this commit by the release process — do not edit by hand.

| File | What | Global |
|---|---|---|
| `tinyfly.iife.js` | Everything: engine, player, `live` (GSAP-style), drivers, interaction, teaching embeds (`data-tinyfly-auto`) | `tinyfly` |
| `tinyfly.umd.js` | The same, as UMD | `tinyfly` |
| `tinyfly.esm.js` | The same, as an ES module | — |
| `tinyfly-player.iife.js` | Player only, for playing exported JSON (smaller) | `tinyfly` |
| `tinyfly-embed.iife.js` | Only teaching figures: player + step controls + `[data-tinyfly-embed]` mounting (smaller) | `tinyfly` |
| `tinyfly-maps.iife.js` | Maps add-on: projection, the offline world outline, OpenStreetMap / {z}/{x}/{y} tiles, map targets. Load after `tinyfly.iife.js` | `tinyfly` (adds to it) |
| `tinyfly-scene-3d.iife.js` | 3D scenes add-on: cameras, lights and meshes drawn on a canvas. Load after `tinyfly.iife.js` | `tinyfly` (adds to it) |
| `tinyfly-scene-3d-webgl.iife.js` | WebGL2 renderer for 3D scenes (depth buffer, light per pixel). Load after `tinyfly-scene-3d.iife.js` | `tinyfly` (adds to it) |
| `tinyfly-math.iife.js` | Maths add-on: figures, equations, lesson steps, math embeds (`data-tinyfly-math`) and explorables. Works on its own | `tinyfly` (adds to it) |

Pick one: `tinyfly.iife.js` covers everything, including teaching embeds; the
player and embed bundles are smaller subsets. Loading more than one is safe — they
add to the same `tinyfly` global.

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.116.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.116.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.116.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.116.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-WN9/iLDeRg7H+dudY/SMZJWStDRzRt5eWu6xNVcXMg35lnqEVBph+5uEuzHrNg6l` |
| `tinyfly-maps.iife.js` | `sha384-lvWHYnqzSNjCDgRKhfM0B2KGtNcF3w16oC/Y7mB8K/8BpfMBK7n1FvyaVQphrUUr` |
| `tinyfly-scene-3d.iife.js` | `sha384-Hk9QQzLviekqgLbY20gVZnYvUhIPlsyxMUrosVXFiGVosHeqCaNvzEIuJ5in2gn4` |
| `tinyfly-scene-3d-webgl.iife.js` | `sha384-T/qe9AD1kw5iWrn5yM8jtw8wZH4S7anYkgHlyo8X+wMt1eKdp1E5GKQUsWsAuFXI` |
| `tinyfly-math.iife.js` | `sha384-a9Wl4wl/hbb3GrY1fAf36/GzDkjo9oA3Ol/beB6WQXQ+J6DFWdHhpbIzcMGrffxT` |
| `tinyfly.umd.js` | `sha384-/3f0a732YM8rD8iJOyeZV/5zuJfy6LvuGVuMcfCE8Y6i+FbfZrWlVjUuTzKgfaKS` |
| `tinyfly.esm.js` | `sha384-9zhUY3xYa72aRlO/WHjxJiTnZKRS+8rSW64791lV2M2i4onEPR6tU52lV82Ttj/m` |
| `tinyfly-player.iife.js` | `sha384-8DRZFfLBB1kLha1JclRmXpiaWsaOoKvQGVUg45M3XmLO5ta67cFo25pnbfnGiZh5` |
| `tinyfly-embed.iife.js` | `sha384-hnFbCO8k8FaS/wkCv4T4gG0WCrqvL8LKPc1r2kYR6AHSGG70ZCWUU2fhbkAViOPE` |

