# Animated Maps

`@algorisys/tinyfly/maps` draws animated maps on a canvas: a camera that flies
from the whole world in to a city, pins that drop in, and routes that draw
themselves while a marker travels them. Everything that moves is a number, so
it is a timeline track like any other, and it renders the same in a browser and
in headless video.

```js
import { mapTarget, mapFlyTracks, routeStops, fitView } from '@algorisys/tinyfly/maps'
```

On a page with no build step, load the maps add-on after the browser bundle; it
adds to the same `tinyfly` global:

```html
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.88.0/cdn/tinyfly.iife.js"></script>
<script src="https://cdn.jsdelivr.net/gh/algorisys-oss/tinyfly@v0.88.0/cdn/tinyfly-maps.iife.js"></script>
```

It is a separate script because the offline world map it carries adds about
33 KB (gzipped), which pages without maps should not pay for.

In the editor, the **🗺 Map** element does all of this without code (see the
[editor guide](editor-guide.md#maps)).

## Two base maps

| Base | What | Use it for |
|---|---|---|
| `tiles` | Raster map tiles: OpenStreetMap by default, or any server with the standard `{z}/{x}/{y}` scheme | Real street maps in a browser |
| `outline` (default) | Country outlines from Natural Earth (public domain), bundled | Headless video, offline use, and the pencil look |

**Tiles come from a server.** OpenStreetMap's tile servers allow light use with
attribution ("© OpenStreetMap contributors", which the map draws for you) and
do not allow heavy use. For anything busy, set `url` to your own tile server or
a commercial provider:

```js
const tiles = { url: 'https://tiles.example.com/{z}/{x}/{y}.png', attribution: '© My Maps', maxZoom: 18 }
```

Tiles load in the background. Until a tile arrives, the matching corner of an
already-loaded zoomed-out tile stands in, so flying in never shows blank
squares. For frames that must be complete (exports, stills), call
`preloadTiles(cache, source, views)` first.

**The outline needs nothing.** It is drawn from vector shapes, so it renders
the same everywhere, colours countries the way you ask
(`style.highlight: { IND: '#f7d9a8' }`), and can be drawn in hand-drawn
pencil strokes that boil (`style.sketch`).

## A map target

```js
const trip = mapTarget({
  x: 0, y: 0, width: 1280, height: 720,
  view: { lon: 30, lat: 25, zoom: 2.2 },          // where it starts
  base: 'outline',
  style: { highlight: { IND: '#f7d9a8', NPL: '#f3c9a0' } },
  places: [
    { id: 'mumbai', lon: 72.88, lat: 19.08, label: 'Mumbai' },
    { id: 'delhi', lon: 77.10, lat: 28.70, label: 'Delhi' },
    { id: 'kathmandu', lon: 85.32, lat: 27.72, label: 'Kathmandu' },
  ],
  routes: [{ id: 'trip', through: ['mumbai', 'delhi', 'kathmandu'] }],
})
```

Its props are the values tracks animate:

| Prop | Meaning |
|---|---|
| `view.lon`, `view.lat`, `view.zoom` | The camera: what is at the centre, and the zoom (0 is the whole world, each step doubles) |
| `<place>.show` | 0..1: the pin drops in and its label fades up (default 1) |
| `<route>.draw` | 0..1: how much of the route is drawn (default 1) |
| `<route>.marker` | 0..1: where a marker travelling the route is; below 0 hides it (default -1) |

The view's props are named with a dot so they never clash with a CSS property
(`zoom` is one).

Routes are `arc` (a flight-path bow, the default), `great-circle` (the shortest
way over the globe) or `straight`, in a colour and width, optionally dashed,
with an `arrow` or `dot` marker.

## Helpers

| | |
|---|---|
| `fitView(places, width, height, padding)` | The centre and zoom that show every place |
| `flyView(from, to, t)` | A view part way along a flight, pulling out in the middle when the ends are far apart |
| `mapFlyTracks(target, from, to, start, end)` | That flight as `view.*` keyframe tracks |
| `routeStops(options, routeId)` | How far along a route each stop is (0..1), so a pin can drop as the line arrives |
| `mapAt(target, frame, id)` | The view in a frame, and `point(lon, lat)` in the scene, for drawing that stays on the map |
| `project(view, lon, lat)`, `unproject(view, x, y)` | Web Mercator, the projection web maps use |
| `greatCircle(from, to)` | Points along the shortest route over the globe |
| `WORLD_CITIES`, `findCity(name)` | About 80 major cities, so you need not look up coordinates |
| `worldCountries()`, `findCountry(code)` | The outline map's countries, by ISO code or name |

## A trip in a timeline

```js
const stops = routeStops(trip.map, 'trip')
tracks: [
  ...mapFlyTracks('map', world, india, 800, 3200),          // fly in
  { id: 'd', target: 'map', property: 'trip.draw', keyframes: [{ time: 3600, value: 0 }, { time: 8200, value: 1 }] },
  { id: 'm', target: 'map', property: 'trip.marker', keyframes: [{ time: 3599, value: -1 }, { time: 3600, value: 0 }, { time: 8200, value: 1 }] },
  // Delhi's pin drops as the line reaches it:
  { id: 'p', target: 'map', property: 'delhi.show', keyframes: [{ time: 0, value: 0 }, { time: 3600 + 4600 * stops[1], value: 1 }] },
]
```

The full scene is
[`examples/headless-video/map-route.mjs`](../examples/headless-video/map-route.mjs);
the **Map Route** card in the Examples gallery plays the same trip on
OpenStreetMap tiles.
