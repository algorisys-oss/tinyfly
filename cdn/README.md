# tinyfly CDN bundles (v0.64.0)

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
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.64.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.64.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.64.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.64.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-RKJnGUVBVQlh4nrmx7IDEjnjPy4AvQkez4JK+Xa6qkrBBF3MeBgDMX95ZqzhwObs` |
| `tinyfly.umd.js` | `sha384-UKowEZe4ItN4at5kXm6hV5FZq7r8La42OrAZVY/PK16QDtZ9vfEN3DH/u462TZ6O` |
| `tinyfly.esm.js` | `sha384-+G7YwAXAuo6l4hLCfRSpsF4UhNd7Z6R7qU8Gq4mqYJlVe8viu/D2RJCJMYQ11pl9` |
| `tinyfly-player.iife.js` | `sha384-6BWUSnPxHH64CxsyeEf28I5IvQw/lJT/cnFwAvRfVjaq6OMNiIHfF4K2mi2laZbA` |
| `tinyfly-embed.iife.js` | `sha384-OV6Hb02TkW5CVmhXtSYPBN0gcj7CpovvpxHo6/0yC9JW/Wjri+oh9LXQjZZ6q+Y3` |

