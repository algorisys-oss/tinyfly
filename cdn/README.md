# tinyfly CDN bundles (v0.89.0)

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

Pick one: `tinyfly.iife.js` covers everything, including teaching embeds; the
player and embed bundles are smaller subsets. Loading more than one is safe — they
add to the same `tinyfly` global.

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.89.0/cdn/tinyfly.iife.js"></script>
<script>
  tinyfly.to('.box', { x: 200, duration: 1 })
</script>
```

As an ES module:

```html
<script type="module">
  import { live } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.89.0/cdn/tinyfly.esm.js'
  live.to('.box', { x: 200, duration: 1 })
</script>
```

Pin a version tag (`@v0.89.0`) in production. `@main` follows the latest publish
and is cached by jsDelivr for up to a day.

## Subresource Integrity

Lock a pinned URL to its exact bytes with `integrity`:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.89.0/cdn/tinyfly-embed.iife.js" integrity="<hash below>" crossorigin="anonymous" data-tinyfly-auto></script>
```

| File | integrity |
|---|---|
| `tinyfly.iife.js` | `sha384-P/yVo5czAGFwmP8WjLGBcsGZYgDDYtEXwDyRdxdlknRxFUG1gnK+Edu+d0GZWdnj` |
| `tinyfly-maps.iife.js` | `sha384-lvWHYnqzSNjCDgRKhfM0B2KGtNcF3w16oC/Y7mB8K/8BpfMBK7n1FvyaVQphrUUr` |
| `tinyfly-scene-3d.iife.js` | `sha384-zaV/qI9qIzIVeb/6caBcw+u1aJaHojY2UdAqDGwxWIfuHzk0A8X3dxRvsJ8uCv4S` |
| `tinyfly-scene-3d-webgl.iife.js` | `sha384-rhX4eIGP++CM6Jm7xEC9Fe9xB/JrzFe0YnD8gQMC5T2UoHYaJnUoiCSoGEQC82mK` |
| `tinyfly.umd.js` | `sha384-mj00wX9a5jHUuRJBR3ozCh9OUoLbmVHavJr/7meOPzp2i5uKf4J/L5QQQ0MxOyvP` |
| `tinyfly.esm.js` | `sha384-67HKDceH1XSJOlnt0GUVRNyBPXfKurDvIFJlYWE/aXsf8ldHDsLpHmkhYZqaryRS` |
| `tinyfly-player.iife.js` | `sha384-J/TEvIDCDDJcREn2bVUqXznPJVVQGLyaOIVUP7BYUF22JUTRIIkJE/Uix2FRcm7T` |
| `tinyfly-embed.iife.js` | `sha384-kUPVfzQRUGchft5oiNBPBfxs8SiC/vxdhoLVygMl/tC6yb4LXZkGv6TYqKeBe1DU` |

