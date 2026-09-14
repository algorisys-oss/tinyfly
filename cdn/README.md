# tinyfly CDN bundles (v0.65.0)

Built from this commit by the release process — do not edit by hand.

| File | What | Global |
|---|---|---|
| `tinyfly.iife.js` | Everything: engine, player, `live` (GSAP-style), drivers, interaction | `tinyfly` |
| `tinyfly.umd.js` | The same, as UMD | `tinyfly` |
| `tinyfly.esm.js` | The same, as an ES module | — |
| `tinyfly-player.iife.js` | Player only, for playing exported JSON (smaller) | `tinyfly` |
| `tinyfly-embed.iife.js` | Player + step controls + declarative `[data-tinyfly-embed]` mounting, for teaching figures | `tinyfly` |

Load one of the `tinyfly` globals, not both.

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.65.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.65.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.65.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.65.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-4en0vosZrFqcUtorQEIasly38a2TdzErLQUcxqRQViWGc5ruW+trs0LpRJBnZp44` |
| `tinyfly.umd.js` | `sha384-265Qd8K3u7qSM6rQoKQpbIot6ahGi88iKTvONWkXRoNIgVSJEsB5NZnIsvbHyCbN` |
| `tinyfly.esm.js` | `sha384-7egcwZz914AzSm0Dmt48DCDCFFFgFg4scNx3uXbiFHoxADStZ1BH7ZgohF5qFnGz` |
| `tinyfly-player.iife.js` | `sha384-fcCf+LEj22Q7i67IrtPjU6iUUflFlwsDibqhNWFFWQtzQDscyMNrzpegingVVUtg` |
| `tinyfly-embed.iife.js` | `sha384-xYUTt7ZNOgT+xMWrCupc+1zMhiFU/S2VZUTBYPVTKQmllXs2lgxS7QCRYh1uiTNh` |

