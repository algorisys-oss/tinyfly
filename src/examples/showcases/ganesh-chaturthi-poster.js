// ── Illustration helpers ─────────────────────────────────────────────────────
// A greeting poster: cream paper, marigold garlands, the company wordmark, the
// headline, and Ganesh ji on a teal throne over a red rangoli carpet, with a
// growth arrow rising behind him. Everything is inline SVG built as markup
// strings when the module loads; the animation code below never touches them.

const round = (n) => Math.round(n * 10) / 10

/** A point on a circle around (cx, cy), with 0° pointing straight up. */
const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))]
}

/** A point on a cubic Bézier curve at t (0..1). */
const cubic = (p0, p1, p2, p3, t) => {
  const u = 1 - t
  return [0, 1].map((i) => round(u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]))
}

const palette = {
  cream: '#f7efe2',
  maroon: '#9b2a1f',
  red: '#d93a2b',
  saffron: '#f39c12',
  gold: '#e8b923',
  skin: '#f2b8a0',
  skinShade: '#e39a82',
  line: '#b86a55',
  teal: '#1f8a84',
  blue: '#2f6fb5',
}

/** A marigold flower ball: a ruffled disc with a darker heart. */
const marigold = (x, y, r, tone) => {
  const outer = tone ? '#f7a21b' : '#f08a0c'
  const inner = tone ? '#ffc93c' : '#f9b233'
  return `<g transform="translate(${round(x)} ${round(y)})"><circle r="${r}" fill="${outer}"/><circle r="${round(r * 0.78)}" fill="none" stroke="${inner}" stroke-width="${round(r * 0.3)}" stroke-dasharray="${round(r * 0.28)} ${round(r * 0.22)}"/><circle r="${round(r * 0.36)}" fill="#e0690b"/><circle cx="${round(-r * 0.35)}" cy="${round(-r * 0.4)}" r="${round(r * 0.18)}" fill="#fff1b8" opacity="0.7"/></g>`
}

/** A small pointed leaf, rotated to angle degrees. */
const leaf = (x, y, s, angle) =>
  `<path transform="translate(${round(x)} ${round(y)}) rotate(${angle}) scale(${s})" d="M0,0 C6,-5 16,-5 22,0 C16,5 6,5 0,0Z" fill="#3f8f3a"/>`

/** A modak: a pleated teardrop dumpling, point up. */
const modak = (x, y, s) =>
  `<g transform="translate(${x} ${y}) scale(${s / 20})"><path d="M0,-20 C9,-12 16,-2 13,7 C9,13 -9,13 -13,7 C-16,-2 -9,-12 0,-20Z" fill="#fff4dc" stroke="#d9a441" stroke-width="1.4"/><path d="M0,-19 L0,11 M0,-19 C-5,-8 -8,2 -7,10 M0,-19 C5,-8 8,2 7,10" fill="none" stroke="#e2b35a" stroke-width="1"/></g>`

/** A four-point sparkle. */
const sparkle = (x, y, s) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path class="gp-twinkle" d="M0,-14 Q2,-2 14,0 Q2,2 0,14 Q-2,2 -14,0 Q-2,-2 0,-14Z" fill="#fff6c9"/></g>`

// ── The garland in the top-left corner (the right one is its mirror) ──────────
// A swag of marigolds along the top edge, one down the side, and two hanging
// strands, with leaves tucked between the flowers.
let garland = ''
const swag = (p0, p1, p2, p3, count, r) => {
  let blooms = ''
  let leaves = ''
  for (let i = 0; i <= count; i++) {
    const [x, y] = cubic(p0, p1, p2, p3, i / count)
    if (i % 2 === 0) leaves += leaf(x, y, r / 12, (i * 47) % 360)
    blooms += marigold(x, y, r, i % 2)
  }
  return leaves + blooms
}
garland += swag([-10, 6], [80, 70], [190, 80], [300, 8], 14, 13)
garland += swag([-6, 10], [40, 90], [30, 190], [4, 300], 13, 12)
for (const [x, y, n] of [[92, 52, 5], [44, 150, 4]]) {
  let strand = `<path d="M${x},${y} L${x},${y + n * 20}" stroke="#7a3b12" stroke-width="1.5"/>`
  for (let k = 1; k <= n; k++) strand += marigold(x, y + k * 20, 9, k % 2)
  strand += `<path d="M${x},${y + n * 20 + 8} C${x + 8},${y + n * 20 + 16} ${x + 7},${y + n * 20 + 32} ${x},${y + n * 20 + 40} C${x - 7},${y + n * 20 + 32} ${x - 8},${y + n * 20 + 16} ${x},${y + n * 20 + 8}Z" fill="#3f8f3a"/>`
  garland += `<g class="gp-strand" style="transform-box: fill-box; transform-origin: 50% 0%">${strand}</g>`
}

// ── The rangoli carpet: a red disc centred below the frame ────────────────────
const rc = [360, 790]
let rangoli = `<circle cx="${rc[0]}" cy="${rc[1]}" r="352" fill="${palette.maroon}"/>
  <circle cx="${rc[0]}" cy="${rc[1]}" r="336" fill="${palette.red}"/>`
// Outer scallops.
for (let i = 0; i < 40; i++) {
  const a = i * 9
  const [x0, y0] = polar(...rc, 312, a - 4.5)
  const [x1, y1] = polar(...rc, 312, a + 4.5)
  const [cx, cy] = polar(...rc, 344, a)
  rangoli += `<path d="M${x0},${y0} Q${cx},${cy} ${x1},${y1}" fill="${palette.gold}"/>`
  const [dx, dy] = polar(...rc, 326, a)
  rangoli += `<circle cx="${dx}" cy="${dy}" r="3.2" fill="${palette.red}"/>`
}
rangoli += `<circle class="gp-rangoli-line" cx="${rc[0]}" cy="${rc[1]}" r="304" fill="none" stroke="${palette.gold}" stroke-width="4"/>`
// A ring of large lotus petals.
for (let i = 0; i < 20; i++) {
  const a = i * 18
  const [bx, by] = polar(...rc, 212, a)
  const [lx, ly] = polar(...rc, 258, a - 9)
  const [tx, ty] = polar(...rc, 292, a)
  const [rx, ry] = polar(...rc, 258, a + 9)
  rangoli += `<path class="gp-rangoli-line" d="M${bx},${by} Q${lx},${ly} ${tx},${ty} Q${rx},${ry} ${bx},${by}" fill="${palette.saffron}" stroke="#ffd66b" stroke-width="3"/>`
  const [ix, iy] = polar(...rc, 262, a)
  rangoli += `<circle cx="${ix}" cy="${iy}" r="7" fill="${palette.maroon}"/><circle cx="${ix}" cy="${iy}" r="3" fill="#ffd66b"/>`
  const [gx, gy] = polar(...rc, 276, a + 9)
  rangoli += `<circle class="gp-rangoli-dot" cx="${gx}" cy="${gy}" r="4" fill="#fff0b3"/>`
}
rangoli += `<circle class="gp-rangoli-line" cx="${rc[0]}" cy="${rc[1]}" r="206" fill="none" stroke="#ffd66b" stroke-width="3"/>`
// An inner ring of narrower gold petals, and a dotted ring.
for (let i = 0; i < 24; i++) {
  const a = i * 15 + 7.5
  const [bx, by] = polar(...rc, 150, a)
  const [lx, ly] = polar(...rc, 176, a - 6)
  const [tx, ty] = polar(...rc, 200, a)
  const [rx, ry] = polar(...rc, 176, a + 6)
  rangoli += `<path class="gp-rangoli-line" d="M${bx},${by} Q${lx},${ly} ${tx},${ty} Q${rx},${ry} ${bx},${by}" fill="${palette.gold}" stroke="${palette.maroon}" stroke-width="2"/>`
}
rangoli += `<circle cx="${rc[0]}" cy="${rc[1]}" r="140" fill="${palette.maroon}"/>
  <circle class="gp-rangoli-line" cx="${rc[0]}" cy="${rc[1]}" r="128" fill="none" stroke="${palette.gold}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`

// ── The growth arrow behind Ganesh ji ─────────────────────────────────────────
const arrowPoints = [[34, 520], [168, 386], [236, 446], [410, 250], [478, 312], [650, 118]]
const arrowEnd = arrowPoints[arrowPoints.length - 1]
const arrowFrom = arrowPoints[arrowPoints.length - 2]
const arrowHead = (() => {
  const dx = arrowEnd[0] - arrowFrom[0]
  const dy = arrowEnd[1] - arrowFrom[1]
  const length = Math.hypot(dx, dy)
  const [ux, uy] = [dx / length, dy / length]
  const tip = [arrowEnd[0] + ux * 58, arrowEnd[1] + uy * 58]
  const left = [arrowEnd[0] - uy * 56 - ux * 10, arrowEnd[1] + ux * 56 - uy * 10]
  const right = [arrowEnd[0] + uy * 56 - ux * 10, arrowEnd[1] - ux * 56 - uy * 10]
  return [tip, left, right].map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
})()

// ── Ganesh ji's cloth (angavastram): a long drape behind each shoulder ────────
// Each drape is a ribbon around a centre line (three cubic segments): an
// outline, an inner shade, a highlight edge, a gold border and three folds, all
// offset from the same line. The right drape is the left one mirrored. The
// ripple is a transform on the whole drape, so no path is rebuilt per frame.
const drapeLine = [[330, 300], [280, 258], [200, 258], [160, 298], [120, 338], [146, 392], [100, 424], [64, 450], [34, 444], [8, 474]]
const drapeSamples = 32

/** The drape's centre line at t (0..1), with a unit normal and the half-width there. */
const drapeFrame = (points, t) => {
  const segment = Math.min(2, Math.floor(t * 3))
  const local = t * 3 - segment
  const at = (u) => {
    const [p0, p1, p2, p3] = points.slice(segment * 3, segment * 3 + 4)
    const v = 1 - u
    return [0, 1].map((i) => v * v * v * p0[i] + 3 * v * v * u * p1[i] + 3 * v * u * u * p2[i] + u * u * u * p3[i])
  }
  const [x, y] = at(local)
  const [ax, ay] = at(Math.max(0, local - 0.01))
  const [bx, by] = at(Math.min(1, local + 0.01))
  const length = Math.hypot(bx - ax, by - ay) || 1
  // Wide in the billows, pinched where the cloth turns over, narrow at both ends.
  const width = (16 + 40 * Math.sin(Math.PI * Math.min(t * 1.08, 1))) * (0.45 + 0.55 * Math.abs(t - 0.5) * 2) + 4
  return { x, y, nx: -(by - ay) / length, ny: (bx - ax) / length, width }
}

/** Points at offset (in half-widths, -1 outer edge .. 1 inner edge) from t0 to t1. */
const drapeOffset = (points, offset, t0 = 0, t1 = 1) => {
  const out = []
  for (let i = 0; i <= drapeSamples; i++) {
    const f = drapeFrame(points, t0 + ((t1 - t0) * i) / drapeSamples)
    const o = typeof offset === 'function' ? offset(i / drapeSamples) : offset
    out.push(`${round(f.x + f.nx * f.width * o)},${round(f.y + f.ny * f.width * o)}`)
  }
  return out
}
const polyline = (pts) => `M${pts.join(' L')}`
const ribbon = (outer, inner) => `M${outer.join(' L')} L${[...inner].reverse().join(' L')} Z`

const drapePieces = {
  cloth: ribbon(drapeOffset(drapeLine, -1), drapeOffset(drapeLine, 1)),
  shade: ribbon(drapeOffset(drapeLine, 0.25), drapeOffset(drapeLine, 1)),
  highlight: polyline(drapeOffset(drapeLine, -0.8, 0.02, 0.96)),
  border: polyline(drapeOffset(drapeLine, 0.86, 0.02, 0.98)),
  folds: [
    drapeOffset(drapeLine, (u) => -0.35 + 0.3 * u, 0.12, 0.5),
    drapeOffset(drapeLine, (u) => 0.1 - 0.4 * u, 0.42, 0.8),
    drapeOffset(drapeLine, -0.1, 0.7, 0.97),
  ].map(polyline).join(' '),
}

const drape = (side) => `<g${side === 'r' ? ' transform="matrix(-1 0 0 1 720 0)"' : ''}>
            <g class="gp-drape gp-drape-${side}" style="transform-box: fill-box; transform-origin: 95% 5%">
              <path d="${drapePieces.cloth}" fill="url(#gp-cloth-g)"/>
              <path d="${drapePieces.shade}" fill="#8f2016" opacity="0.45"/>
              <path d="${drapePieces.folds}" stroke="#8f2016" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.55"/>
              <path d="${drapePieces.highlight}" stroke="#ff8a66" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>
              <path d="${drapePieces.border}" stroke="${palette.gold}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            </g>
          </g>`

// The long flower garland: marigold beads down both sides of the belly, with a
// blue bead and green leaves every few flowers, meeting in a tassel.
let garlandBeads = ''
for (let i = 0; i <= 22; i++) {
  const [x, y] = cubic([318, 302], [294, 404], [314, 496], [360, 504], i / 22)
  for (const bx of [x, round(720 - x)]) {
    if (i % 5 === 3) garlandBeads += `<circle cx="${bx}" cy="${y}" r="5.5" fill="${palette.blue}" stroke="#1d4f8a" stroke-width="1"/>`
    else garlandBeads += (i % 5 === 1 ? leaf(bx - 10, y, 0.5, 200) + leaf(bx + 10, y, 0.5, -20) : '') + marigold(bx, y, 7.5, i % 2)
  }
}

const { skin, skinShade, line } = palette

/**
 * A foot seen from the sole, as in devotional art: heel at the origin, toes
 * pointing up (-y) in decreasing size, a sole shade, a red flower mark and a
 * gold anklet round the ankle. Place it with an SVG transform.
 */
const soleFoot = (transform) => {
  const toes = [[21, -101, 3.8, 4.8], [14.5, -107, 4.4, 5.6], [6, -111, 5, 6.4], [-4, -112, 5.6, 7.2], [-17, -108, 8, 10]]
  const petals = [0, 60, 120, 180, 240, 300].map((a) => {
    const r = (a * Math.PI) / 180
    return `<circle cx="${round(-2 + Math.cos(r) * 5)}" cy="${round(-56 + Math.sin(r) * 5)}" r="2.6" fill="${palette.red}"/>`
  })
  const anklet = [20, 45, 70, 90, 110, 135, 160].map((a) => {
    const r = (a * Math.PI) / 180
    return `<circle cx="${round(Math.cos(r) * 19)}" cy="${round(-1 + Math.sin(r) * 9)}" r="2.8" fill="${palette.gold}" stroke="#a8740c" stroke-width="0.6"/>`
  })
  return `<g transform="${transform}">
            <path d="M-17,-8 C-19,8 17,10 17,-8 C18,-30 11,-48 15,-66 C19,-80 24,-90 22,-100 C10,-106 -14,-106 -26,-100 C-28,-88 -26,-74 -21,-62 C-13,-46 -11,-28 -17,-8Z" fill="#f6bca6" stroke="${line}" stroke-width="2"/>
            <path d="M-9,-10 C-9,0 9,0 9,-10 C10,-36 13,-66 15,-92 C2,-97 -14,-97 -19,-92 C-15,-72 -9,-40 -9,-10Z" fill="#e99a85" opacity="0.55"/>
            ${toes.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#f6bca6" stroke="${line}" stroke-width="1.5"/><ellipse cx="${x}" cy="${round(y - ry * 0.2)}" rx="${round(rx * 0.5)}" ry="${round(ry * 0.45)}" fill="#fcd9cb"/>`).join('')}
            ${petals.join('')}<circle cx="-2" cy="-56" r="2.6" fill="${palette.gold}"/>
            <path d="M-19,-1 C-10,10 10,10 19,-1" stroke="#a8740c" stroke-width="1" fill="none"/>
            ${anklet.join('')}
            <circle cx="0" cy="12" r="2.2" fill="${palette.gold}"/><circle cx="-11" cy="10" r="2" fill="${palette.gold}"/><circle cx="11" cy="10" r="2" fill="${palette.gold}"/>
          </g>`
}

export const html = `<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
  .gp { --cream: ${palette.cream}; --maroon: ${palette.maroon}; --ink: #3b3531;
    min-height: 100vh; min-height: 100svh; display: grid; place-items: center; padding: 24px 16px;
    background: radial-gradient(ellipse 70% 60% at 50% 40%, #f3e6d1 0%, #e6d3b6 100%);
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: var(--ink); overflow-x: clip; }
  .gp * { box-sizing: border-box; }
  .gp h1, .gp p { margin: 0; }

  .gp-poster { position: relative; overflow: hidden; container-type: inline-size;
    width: min(720px, 100%, calc((100svh - 48px) / 1.3)); min-width: min(320px, 100%);
    border-radius: 14px; box-shadow: 0 30px 80px -30px rgba(110, 50, 20, 0.45), 0 2px 0 rgba(255, 255, 255, 0.6) inset;
    background:
      radial-gradient(ellipse 60% 42% at 50% 60%, rgba(255, 252, 240, 0.95) 0%, rgba(255, 246, 228, 0) 100%),
      radial-gradient(ellipse 90% 70% at 50% 35%, #fbf5ea 0%, var(--cream) 55%, #efdfc6 100%); }

  .gp-streaks { position: absolute; left: 0; top: 30%; width: 46%; height: 34%; pointer-events: none; }
  .gp-streak { position: absolute; left: -10%; height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0)); }

  .gp-garland { position: absolute; top: 0; width: 42%; height: auto; z-index: 3; pointer-events: none; overflow: visible; }
  .gp-garland-l { left: 0; }
  .gp-garland-r { right: 0; }

  .gp-head { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; text-align: center;
    padding: 4.2cqw 16% 0; }
  .gp-brand { display: flex; flex-direction: column; align-items: center; gap: 0.4cqw; }
  .gp-wordmark { font-family: 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif; font-weight: 700;
    font-size: max(18px, 5.2cqw); line-height: 1; letter-spacing: -0.01em; display: flex; align-items: baseline; }
  .gp-wordmark .gp-a { background: linear-gradient(160deg, #f39c12 10%, #e8452c 70%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .gp-wordmark .gp-b { color: ${palette.blue}; }
  .gp-wordmark .gp-o { display: inline-block; position: relative; width: 0.52em; height: 0.52em; margin: 0 0.02em;
    border: 0.12em solid ${palette.blue}; border-radius: 50%; }
  .gp-wordmark .gp-o::after { content: ''; position: absolute; right: -0.16em; top: -0.16em; width: 0.16em; height: 0.16em;
    border-radius: 50%; background: #f39c12; }
  .gp-wordmark .gp-r1 { color: #e0392b; }
  .gp-wordmark .gp-r2 { color: #c2304f; }
  .gp-wordmark .gp-r3 { color: #a33a78; }
  .gp-wordmark .gp-r4 { color: #8a3f8f; }
  .gp-tagline { font-size: max(7px, 1.35cqw); letter-spacing: 0.08em; color: #6b625b; }

  .gp-happy { margin-top: 3cqw; font-size: max(10px, 2.3cqw); font-weight: 600; letter-spacing: 0.55em; padding-left: 0.55em; color: #4a4440; }
  .gp-title { margin-top: 0.4cqw; font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-weight: 700;
    font-size: max(26px, 7.2cqw); line-height: 1.05; color: var(--maroon); letter-spacing: -0.005em; white-space: nowrap; }
  .gp-sub { margin-top: 1.6cqw; font-size: max(11px, 2.35cqw); line-height: 1.45; font-weight: 500; color: #3f3934; }
  .gp-sub span { display: block; }

  .gp-art { position: relative; z-index: 1; display: block; width: 100%; height: auto; margin-top: 1cqw; }
  .gp-ganesh { cursor: pointer; outline: none; }
  .gp-ganesh:focus-visible .gp-face { stroke: ${palette.saffron}; stroke-width: 4; }
  .gp-hint { position: absolute; z-index: 3; left: 0; right: 0; bottom: 50px; /* clear of a fixed bottom bar */
    text-shadow: 0 1px 3px rgba(80, 10, 5, 0.8); text-align: center;
    font-size: max(10px, 1.6cqw); letter-spacing: 0.06em; color: #ffe7b0; opacity: 0.85; pointer-events: none; }

  .gp-petals { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 4; pointer-events: none; }

  .gp-reduced .gp-hint { display: none; }

  /* On a phone the page is the poster: it fills the screen, and the illustration
     grows into the height left under the headline, cropping the cloth's tips. */
  @media (max-width: 560px) {
    .gp { padding: 0; place-items: stretch; background: var(--cream); }
    .gp-poster { width: 100%; min-height: 100svh; border-radius: 0; box-shadow: none; display: flex; flex-direction: column; }
    .gp-garland { width: 52%; }
    .gp-head { padding: 13cqw 10% 0; }
    .gp-wordmark { font-size: 7.4cqw; }
    .gp-tagline { font-size: 2cqw; }
    .gp-happy { margin-top: 3.5cqw; font-size: 3.2cqw; }
    .gp-title { font-size: 8.2cqw; }
    .gp-sub { margin-top: 2.5cqw; font-size: 3.2cqw; }
    /* The illustration grows into the height under the headline (cropping its
       sides a little); past that, the rangoli carries on below its frame. */
    .gp-art { flex: 1 1 auto; min-height: 0; max-height: 138cqw; margin-top: 2cqw; overflow: visible; }
    .gp-hint { bottom: 70px; }
  }
</style>
<div class="gp">
  <div class="gp-poster">
    <div class="gp-streaks" aria-hidden="true">
      <i class="gp-streak" style="top: 8%; width: 70%"></i>
      <i class="gp-streak" style="top: 30%; width: 95%"></i>
      <i class="gp-streak" style="top: 52%; width: 60%"></i>
      <i class="gp-streak" style="top: 74%; width: 85%"></i>
    </div>

    <svg class="gp-garland gp-garland-l" viewBox="-20 -10 330 400" aria-hidden="true">
      <g class="gp-swing" style="transform-box: view-box; transform-origin: 0 0">${garland}</g>
    </svg>
    <svg class="gp-garland gp-garland-r" viewBox="-20 -10 330 400" aria-hidden="true" style="transform: scaleX(-1)">
      <g class="gp-swing" style="transform-box: view-box; transform-origin: 0 0">${garland}</g>
    </svg>

    <header class="gp-head">
      <div class="gp-brand" aria-label="Algorisys Technologies Private Limited">
        <p class="gp-wordmark" aria-hidden="true"><span class="gp-a">A</span><span class="gp-b">lg</span><span class="gp-o"></span><span class="gp-r1">r</span><span class="gp-r2">i</span><span class="gp-r3">sy</span><span class="gp-r4">s</span></p>
        <p class="gp-tagline" aria-hidden="true">Technologies Private Limited</p>
      </div>
      <p class="gp-happy">HAPPY</p>
      <h1 class="gp-title">Ganesh Chaturthi</h1>
      <p class="gp-sub"><span>May Bappa Bring Intelligence to Every Idea</span><span>and Success to Every Execution.</span></p>
    </header>

    <svg class="gp-art" viewBox="0 0 720 700" preserveAspectRatio="xMidYMin slice" role="img" aria-label="Lord Ganesha seated on a teal throne over a red rangoli, a rising growth arrow behind him">
      <defs>
        <linearGradient id="gp-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff0a6"/>
          <stop offset="0.45" stop-color="#f2c233"/>
          <stop offset="1" stop-color="#c98a0c"/>
        </linearGradient>
        <linearGradient id="gp-cloth-g" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#e2452f"/>
          <stop offset="0.7" stop-color="${palette.red}"/>
          <stop offset="1" stop-color="#a82a1e"/>
        </linearGradient>
        <linearGradient id="gp-dhoti-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd24a"/>
          <stop offset="1" stop-color="${palette.saffron}"/>
        </linearGradient>
        <linearGradient id="gp-teal-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#34a79f"/>
          <stop offset="1" stop-color="#156862"/>
        </linearGradient>
        <radialGradient id="gp-skin-g" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stop-color="#fbd3c2"/>
          <stop offset="1" stop-color="${skin}"/>
        </radialGradient>
        <radialGradient id="gp-glow-g">
          <stop offset="0" stop-color="#fff6d6" stop-opacity="1"/>
          <stop offset="0.5" stop-color="#ffd98a" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#ffb347" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="gp-glint-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff" stop-opacity="0"/>
          <stop offset="0.5" stop-color="#fff" stop-opacity="0.85"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <clipPath id="gp-frame"><rect x="-100" width="920" height="1200"/></clipPath>
        <clipPath id="gp-crown-clip">
          <path d="M288,178 L296,146 L304,126 L312,96 L318,94 L326,66 L332,66 L340,42 L344,42 C348,28 354,18 360,4 C366,18 372,28 376,42 L380,42 L388,66 L394,66 L402,94 L408,96 L416,126 L424,146 L432,178 Z"/>
        </clipPath>
      </defs>

      <!-- Back: rangoli carpet, growth arrow, soft glow -->
      <g clip-path="url(#gp-frame)">
        <g class="gp-rangoli" style="transform-box: fill-box; transform-origin: 50% 50%">
          ${rangoli}
          <g class="gp-rangoli-spin" style="transform-box: fill-box; transform-origin: 50% 50%">
            ${Array.from({ length: 12 }, (_, i) => {
              const [x, y] = polar(...rc, 96, i * 30)
              return `<circle cx="${x}" cy="${y}" r="9" fill="${palette.gold}"/><circle cx="${x}" cy="${y}" r="4" fill="${palette.red}"/>`
            }).join('')}
          </g>
        </g>
      </g>

      <circle class="gp-halo" cx="360" cy="250" r="230" fill="url(#gp-glow-g)" style="transform-box: fill-box; transform-origin: 50% 50%"/>

      <g class="gp-arrow" opacity="0.9">
        <polyline class="gp-arrow-line" points="${arrowPoints.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#f8cba5" stroke-width="38" stroke-linejoin="miter" stroke-linecap="butt"/>
        <polygon class="gp-arrow-head" points="${arrowHead}" fill="#f6bd90" style="transform-box: fill-box; transform-origin: 40% 60%"/>
      </g>

      <g class="gp-sparkles">
        ${[[150, 190, 1], [600, 250, 0.8], [110, 330, 0.6], [640, 400, 1], [250, 90, 0.7], [520, 60, 0.9]].map(([x, y, s]) => sparkle(x, y, s)).join('')}
      </g>

      <!-- Ganesh ji -->
      <g class="gp-rise">
        <g class="gp-ganesh" tabindex="0" role="button" aria-label="Ganesh ji. Tap for a shower of blessings.">
          <!-- Red cloth drapes, behind everything else of him -->
          ${drape('l')}
          ${drape('r')}

          <!-- Throne: teal cushion with round bolsters -->
          <g class="gp-throne">
            <path d="M178,540 C178,520 200,510 230,510 L490,510 C520,510 542,520 542,540 L542,586 C542,604 520,612 490,612 L230,612 C200,612 178,604 178,586 Z" fill="url(#gp-teal-g)"/>
            <path d="M196,524 C260,512 460,512 524,524" stroke="#5cc6bd" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M184,600 C260,618 460,618 536,600" stroke="${palette.gold}" stroke-width="6" fill="none"/>
            <path d="M190,606 C260,626 460,626 530,606" stroke="${palette.gold}" stroke-width="2" fill="none" stroke-dasharray="1 8" stroke-linecap="round"/>
            ${[[176, 560], [544, 560]].map(([x, y]) => `<g><circle cx="${x}" cy="${y}" r="46" fill="url(#gp-teal-g)"/><circle cx="${x}" cy="${y}" r="34" fill="none" stroke="${palette.gold}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="20" fill="#156862" stroke="#ffd66b" stroke-width="2"/><circle cx="${x}" cy="${y}" r="7" fill="${palette.gold}"/></g>`).join('')}
          </g>

          <!-- Crossed legs under a saffron dhoti: both thighs, knees out to the sides -->
          <path d="M252,470 C300,456 420,456 468,470 C512,482 544,512 536,550 C530,578 488,590 444,582 C414,576 386,572 360,572 C334,572 306,576 276,582 C232,590 190,578 184,550 C176,512 208,482 252,470Z" fill="url(#gp-dhoti-g)" stroke="#d9860b" stroke-width="2"/>
          <path d="M214,504 C228,490 248,482 270,480 M506,504 C492,490 472,482 450,480" stroke="#ffe58a" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>
          <path d="M300,482 C276,500 244,512 214,524 M326,490 C310,512 286,532 250,548 M420,482 C444,500 476,512 506,524 M394,490 C410,512 434,532 470,548" stroke="#e08a0e" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- border band along the knees: gold line over blue -->
          <path d="M186,552 C194,580 236,590 276,582 C300,578 322,574 340,573 M534,552 C526,580 484,590 444,582 C420,578 398,574 380,573" stroke="${palette.blue}" stroke-width="9" fill="none" stroke-linecap="round"/>
          <path d="M190,541 C200,567 238,577 276,571 C300,567 320,564 340,563 M530,541 C520,567 482,577 444,571 C420,567 400,564 380,563" stroke="${palette.gold}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <!-- his left foot, peeking out under the left knee -->
          ${soleFoot('translate(262 588) rotate(-76) scale(0.58)')}
          <!-- the pleated fall between the knees -->
          <path d="M340,480 L380,480 C384,528 388,560 396,600 C376,608 344,608 324,600 C332,560 336,528 340,480Z" fill="#f7ab24" stroke="#d9860b" stroke-width="1.6"/>
          <path d="M350,488 L344,600 M360,488 L360,603 M370,488 L376,600" stroke="#e08a0e" stroke-width="2" fill="none"/>
          <path d="M326,592 C344,600 376,600 394,592" stroke="${palette.gold}" stroke-width="3" fill="none"/>
          <path d="M324,601 C344,610 376,610 396,601" stroke="${palette.blue}" stroke-width="7" fill="none" stroke-linecap="round"/>
          <!-- his right foot, tucked in front with the sole showing -->
          ${soleFoot('translate(408 556) rotate(72) scale(0.95)')}

          <!-- Torso; the belly sits over a gold belt -->
          <path d="M312,292 C286,318 276,366 280,430 L440,430 C444,366 434,318 408,292 Z" fill="${skin}" stroke="${line}" stroke-width="2"/>
          <path d="M320,346 Q338,358 354,352 M366,352 Q382,358 400,346" stroke="${skinShade}" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M272,466 C320,490 400,490 448,466 L452,486 C400,512 320,512 268,486Z" fill="url(#gp-gold)" stroke="#b27a0e" stroke-width="1.2"/>
          <path d="M280,482 C320,500 400,500 440,482" stroke="${palette.red}" stroke-width="2.5" fill="none" stroke-dasharray="1 9" stroke-linecap="round"/>
          <ellipse cx="360" cy="412" rx="84" ry="66" fill="url(#gp-skin-g)" stroke="${line}" stroke-width="2"/>
          <path d="M300,452 C330,470 390,470 420,452" stroke="${skinShade}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.7"/>
          <path d="M354,426 Q360,434 366,426" stroke="${skinShade}" stroke-width="3" fill="none" stroke-linecap="round"/>

          <!-- Red and gold sash across the chest -->
          <path d="M306,300 C340,340 392,400 438,452" stroke="${palette.red}" stroke-width="16" fill="none" stroke-linecap="round"/>
          <path d="M306,300 C340,340 392,400 438,452" stroke="${palette.gold}" stroke-width="3" fill="none" stroke-dasharray="6 6"/>

          <!-- Gold necklace with a pendant, and the long flower garland -->
          <path d="M314,298 Q360,356 406,298" stroke="url(#gp-gold)" stroke-width="8" fill="none" stroke-linecap="round"/>
          <path d="M322,306 Q360,346 398,306" stroke="${palette.gold}" stroke-width="3" fill="none" stroke-dasharray="1 6" stroke-linecap="round"/>
          <path d="M360,322 C374,336 376,356 360,370 C344,356 346,336 360,322Z" fill="url(#gp-gold)" stroke="#a8740c" stroke-width="1.5"/>
          <circle cx="360" cy="348" r="6" fill="${palette.red}" stroke="#fff0a6" stroke-width="1.5"/>
          ${garlandBeads}
          ${marigold(360, 510, 10, 0)}
          <path d="M360,520 C368,530 366,544 360,552 C354,544 352,530 360,520Z" fill="#3f8f3a"/>

          <!-- Upper right hand (viewer's left): the axe (parashu) -->
          <path d="M150,430 L198,122" stroke="#7a4a22" stroke-width="9" stroke-linecap="round"/>
          <path d="M148,424 L194,128" stroke="#a8703f" stroke-width="2.5" stroke-linecap="round"/>
          ${[410, 350, 220].map((y) => {
            const x = 150 + (48 * (430 - y)) / 308
            return `<path d="M${round(x - 0.8)},${y + 5} L${round(x + 0.8)},${y - 5}" stroke="url(#gp-gold)" stroke-width="13" stroke-linecap="butt"/>`
          }).join('')}
          <g class="gp-axe-head" transform="translate(194 150) scale(0.85) translate(-194 -150)">
            <path d="M194,108 C150,98 114,124 112,154 C110,186 144,210 194,198 C178,176 176,132 194,108 Z" fill="#c5d0da"/>
            <path d="M186,190 C172,168 170,136 186,116" stroke="#9aa8b5" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M194,108 C150,98 114,124 112,154 C110,186 144,210 194,198" stroke="#56687a" stroke-width="4" fill="none" stroke-linecap="round"/>
            <path d="M166,116 C140,120 124,138 123,156 C122,172 130,186 142,194" stroke="#f4f8fb" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.9"/>
            <path d="M204,142 L222,138 L214,158 L200,160Z" fill="#aab7c3" stroke="#56687a" stroke-width="1.5"/>
            <path d="M191,166 L197,130" stroke="url(#gp-gold)" stroke-width="16" stroke-linecap="butt"/>
            <path d="M188,160 L202,160 M190,138 L204,138" stroke="#a8740c" stroke-width="1.5"/>
            <circle cx="194" cy="149" r="3.5" fill="${palette.red}"/>
          </g>
          <g stroke-linecap="round" stroke-linejoin="round">
            <path d="M306,318 L228,336 L182,300" stroke="${line}" stroke-width="30" fill="none"/>
            <path d="M306,318 L228,336 L182,300" stroke="${skin}" stroke-width="26" fill="none"/>
            <path d="M262,316 L268,342" stroke="url(#gp-gold)" stroke-width="11"/>
            <path d="M193,322 L207,304" stroke="url(#gp-gold)" stroke-width="8"/>
          </g>
          <!-- the fist wraps the handle -->
          <rect x="157" y="276" width="32" height="30" rx="11" fill="${skin}" stroke="${line}" stroke-width="2"/>
          <path d="M160,284 L186,284 M159,292 L187,292 M160,300 L186,300" stroke="${line}" stroke-width="1.5" stroke-linecap="round"/>
          <ellipse cx="186" cy="279" rx="8" ry="6" fill="${skin}" stroke="${line}" stroke-width="1.6"/>

          <!-- Upper left hand (viewer's right): a conch -->
          <g stroke-linecap="round" stroke-linejoin="round">
            <path d="M414,318 L492,336 L538,284" stroke="${line}" stroke-width="30" fill="none"/>
            <path d="M414,318 L492,336 L538,284" stroke="${skin}" stroke-width="26" fill="none"/>
            <path d="M458,316 L452,340" stroke="url(#gp-gold)" stroke-width="10"/>
            <path d="M516,302 L536,316" stroke="url(#gp-gold)" stroke-width="7"/>
          </g>
          <g transform="translate(548 250) rotate(-24)">
            <path d="M-26,24 C-38,0 -26,-34 4,-40 C30,-44 44,-20 36,2 C30,18 12,30 -8,32 C-16,32 -22,30 -26,24Z" fill="#fffaf2" stroke="#d8c3a5" stroke-width="2"/>
            <path d="M4,-24 C22,-24 26,-4 12,4 C0,10 -8,-2 2,-8" stroke="#d8b99a" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M-26,24 C-30,30 -36,32 -40,30 C-36,26 -34,20 -32,14" fill="#f7c7b0" stroke="#d8c3a5" stroke-width="1.5"/>
            <circle cx="20" cy="-12" r="3" fill="${palette.gold}"/>
          </g>
          <circle cx="538" cy="280" r="16" fill="${skin}" stroke="${line}" stroke-width="2"/>
          <path d="M526,270 L548,268 M526,280 L550,278" stroke="${line}" stroke-width="1.5" stroke-linecap="round"/>

          <!-- Lower right hand (viewer's left): blessing, glowing -->
          <circle class="gp-bless-glow" cx="244" cy="356" r="58" fill="url(#gp-glow-g)" style="transform-box: fill-box; transform-origin: 50% 50%"/>
          <g stroke-linecap="round" stroke-linejoin="round">
            <path d="M310,330 L262,420 L248,378" stroke="${line}" stroke-width="32" fill="none"/>
            <path d="M310,330 L262,420 L248,378" stroke="${skin}" stroke-width="28" fill="none"/>
            <path d="M234,388 L262,380" stroke="url(#gp-gold)" stroke-width="8"/>
            <path d="M284,372 L298,386" stroke="url(#gp-gold)" stroke-width="10"/>
          </g>
          <g stroke="${line}" stroke-width="1.6" fill="${skin}">
            <rect x="226" y="330" width="40" height="48" rx="15"/>
            <rect x="227" y="304" width="9" height="34" rx="4.5"/>
            <rect x="237" y="298" width="9" height="38" rx="4.5"/>
            <rect x="247" y="300" width="9" height="36" rx="4.5"/>
            <rect x="257" y="308" width="8.5" height="30" rx="4.25"/>
            <rect x="214" y="342" width="10" height="26" rx="5" transform="rotate(-30 219 355)"/>
          </g>
          <circle class="gp-palm-mark" cx="246" cy="354" r="8" fill="${palette.saffron}" style="transform-box: fill-box; transform-origin: 50% 50%"/>
          <circle cx="246" cy="354" r="3.5" fill="${palette.red}"/>

          <!-- Lower left hand (viewer's right): a golden bowl of modaks -->
          <g stroke-linecap="round" stroke-linejoin="round">
            <path d="M410,330 L458,420 L478,452" stroke="${line}" stroke-width="32" fill="none"/>
            <path d="M410,330 L458,420 L478,452" stroke="${skin}" stroke-width="28" fill="none"/>
            <path d="M436,372 L422,386" stroke="url(#gp-gold)" stroke-width="10"/>
          </g>
          ${modak(462, 432, 18)}${modak(498, 432, 18)}${modak(480, 412, 18)}
          <path d="M436,440 L524,440 C520,478 440,478 436,440Z" fill="url(#gp-gold)" stroke="#b27a0e" stroke-width="1.5"/>
          <path d="M440,446 L520,446" stroke="${palette.red}" stroke-width="3"/>
          <ellipse cx="480" cy="474" rx="22" ry="9" fill="${skin}" stroke="${line}" stroke-width="2"/>
          <path d="M462,470 L498,470" stroke="url(#gp-gold)" stroke-width="5" stroke-linecap="round"/>

          <!-- Head: ears, face, trunk, crown -->
          <g class="gp-head-group">
            <!-- crown flares, behind the ears -->
            ${['', ' transform="matrix(-1 0 0 1 720 0)"'].map((mirror) => `<g${mirror}><path d="M306,168 C284,136 250,116 214,118 C228,134 234,152 232,178 C256,168 282,168 306,178Z" fill="url(#gp-gold)" stroke="#a8740c" stroke-width="2"/><path d="M296,166 C276,146 254,134 232,132" stroke="#a8740c" stroke-width="1.5" fill="none"/><circle cx="262" cy="152" r="6" fill="${palette.red}" stroke="#fff0a6" stroke-width="1.5"/></g>`).join('')}
            <path d="M316,176 C272,146 206,160 200,222 C194,286 244,322 300,298 C312,264 318,218 316,176Z" fill="${skin}" stroke="${line}" stroke-width="2"/>
            <path d="M306,194 C274,176 228,186 222,228 C216,272 250,296 292,284 C302,258 306,226 306,194Z" fill="#eea08e"/>
            <path d="M404,176 C448,146 514,160 520,222 C526,286 476,322 420,298 C408,264 402,218 404,176Z" fill="${skin}" stroke="${line}" stroke-width="2"/>
            <path d="M414,194 C446,176 492,186 498,228 C504,272 470,296 428,284 C418,258 414,226 414,194Z" fill="#eea08e"/>

            <path class="gp-face" d="M360,150 C412,150 436,190 434,232 C432,270 414,292 394,302 L326,302 C306,292 288,270 286,232 C284,190 308,150 360,150Z" fill="url(#gp-skin-g)" stroke="${line}" stroke-width="2"/>
            <ellipse cx="316" cy="268" rx="18" ry="11" fill="#ee8f86" opacity="0.4"/>
            <ellipse cx="404" cy="268" rx="18" ry="11" fill="#ee8f86" opacity="0.4"/>

            <!-- tusk, and the broken one -->
            <path d="M334,286 C334,314 324,334 306,344 C312,322 316,302 318,284Z" fill="#fffaf0" stroke="#cdb28a" stroke-width="1.6"/>
            <path d="M386,286 L402,286 L398,300Z" fill="#fffaf0" stroke="#cdb28a" stroke-width="1.6"/>

            <!-- calm, lowered eyes -->
            <path d="M314,228 Q330,218 346,230 Q330,238 314,228Z" fill="#fff"/>
            <path d="M374,230 Q390,218 406,228 Q390,238 374,230Z" fill="#fff"/>
            <circle cx="332" cy="229" r="5.5" fill="#2b1a12"/><circle cx="388" cy="229" r="5.5" fill="#2b1a12"/>
            <path d="M312,228 Q330,214 348,229 M372,229 Q390,214 408,228" stroke="#5a2a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M310,210 Q328,200 346,208 M374,208 Q392,200 410,210" stroke="#5a2a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>

            <!-- tilak: a red trishul -->
            <path d="M360,206 L360,176 M348,180 C348,196 354,202 360,204 C366,202 372,196 372,180" stroke="${palette.red}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
            <circle cx="360" cy="212" r="3.5" fill="${palette.saffron}"/>

            <!-- trunk: from between the eyes, down and curling to his left -->
            <g class="gp-trunk" style="transform-box: fill-box; transform-origin: 30% 0%" fill="none" stroke-linecap="round">
              <path d="M360,244 C360,290 354,332 368,372 C382,412 430,420 444,390 C450,372 432,362 422,378" stroke="${line}" stroke-width="26"/>
              <path d="M360,244 C360,290 354,332 368,372 C382,412 430,420 444,390 C450,372 432,362 422,378" stroke="${skin}" stroke-width="22"/>
              <path d="M360,244 C360,290 354,332 368,372" stroke="${line}" stroke-width="40"/>
              <path d="M360,236 C360,290 354,332 368,372" stroke="${skin}" stroke-width="36"/>
              <path d="M348,300 Q360,306 372,300 M349,320 Q361,326 373,320 M354,340 Q366,346 378,338 M360,358 Q372,362 382,354" stroke="${skinShade}" stroke-width="2.4"/>
              <text x="360" y="274" text-anchor="middle" font-size="22" font-weight="700" fill="${palette.red}" stroke="none" font-family="'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif">ॐ</text>
            </g>

            <!-- the crown (mukut): layered gold with lotus motifs and a jewel -->
            <g class="gp-crown">
              <path d="M344,42 C348,28 354,18 360,6 C366,18 372,28 376,42 Z" fill="url(#gp-gold)" stroke="#a8740c" stroke-width="2"/>
              <circle cx="360" cy="9" r="5" fill="#f2c233" stroke="#a8740c" stroke-width="1.5"/>
              <path d="M332,66 L340,42 C352,36 368,36 380,42 L388,66 C374,60 346,60 332,66Z" fill="#f2c233" stroke="#a8740c" stroke-width="2"/>
              <circle cx="360" cy="53" r="5" fill="${palette.teal}" stroke="#fff0a6" stroke-width="1.5"/>
              <path d="M318,96 L326,66 C344,58 376,58 394,66 L402,96 C386,88 334,88 318,96Z" fill="url(#gp-gold)" stroke="#a8740c" stroke-width="2"/>
              ${[[342, 80, palette.red], [360, 78, palette.teal], [378, 80, palette.red]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}" stroke="#fff0a6" stroke-width="1.2"/>`).join('')}
              <path d="M304,128 L312,96 C336,86 384,86 408,96 L416,128 C392,120 328,120 304,128Z" fill="#f2c233" stroke="#a8740c" stroke-width="2"/>
              <circle cx="360" cy="108" r="10" fill="${palette.red}" stroke="#fff0a6" stroke-width="3"/>
              <circle cx="357" cy="105" r="3" fill="#ffd0c4"/>
              ${[[330, 110], [390, 110]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${palette.teal}" stroke="#fff0a6" stroke-width="2"/>`).join('')}
              <path d="M288,178 C318,160 402,160 432,178 L424,146 C400,134 320,134 296,146 Z" fill="url(#gp-gold)" stroke="#a8740c" stroke-width="2"/>
              ${[306, 324, 342, 360, 378, 396, 414].map((x, i) => `<circle cx="${x}" cy="${round(162 - 5 * Math.cos(((x - 360) / 70) * 1.2))}" r="${i === 3 ? 5 : 3.5}" fill="${i % 2 ? palette.teal : palette.red}" stroke="#fff0a6" stroke-width="1"/>`).join('')}
              <!-- lotus-petal band -->
              ${[300, 315, 330, 345, 360, 375, 390, 405, 420].map((x) => {
                const base = round(146 - 8 * Math.cos(((x - 360) / 60) * 1.1))
                return `<path d="M${x},${base} C${x - 8},${base - 8} ${x - 6},${base - 20} ${x},${base - 26} C${x + 6},${base - 20} ${x + 8},${base - 8} ${x},${base}Z" fill="#f7d154" stroke="#a8740c" stroke-width="1.3"/><circle cx="${x}" cy="${base - 12}" r="2.4" fill="${palette.red}"/>`
              }).join('')}
              <g clip-path="url(#gp-crown-clip)">
                <rect class="gp-glint" x="250" y="0" width="46" height="180" fill="url(#gp-glint-g)" transform="rotate(18 273 90)"/>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>

    <p class="gp-hint">Tap Ganesh ji for blessings</p>
    <canvas class="gp-petals" aria-hidden="true"></canvas>
  </div>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const $ = (selector) => root.querySelector(selector)
  const $$ = (selector) => [...root.querySelectorAll(selector)]

  // A small seeded random, so the petals fall the same way on every load.
  let seed = 827
  const random = (min = 0, max = 1) => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min)
  }

  // Everything is set up per motion preference; matchMedia reverts the old
  // setup (tweens, split text, ticker, listeners) when the preference changes.
  const mm = live.matchMedia()
  mm.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    const reduce = context.conditions.reduce
    const events = new AbortController() // removes every listener on revert
    const on = (target, type, handler) => target.addEventListener(type, handler, { signal: events.signal })
    root.classList.toggle('gp-reduced', reduce)

    // ── Reduced motion: the finished poster, still ────────────────────────
    if (reduce) {
      return () => {
        events.abort()
        root.classList.remove('gp-reduced')
      }
    }

    // ── Petals: a canvas over the poster, drawn on the ticker ─────────────
    const canvas = $('.gp-petals')
    const ctx = canvas.getContext('2d')
    const colours = ['#f39c12', '#ffb703', '#f08a0c', '#ffd166', '#d93a2b', '#fff4dc']
    const petals = [] // falling forever, recycled at the top
    const bursts = [] // thrown out by a tap, removed once they fall out of the poster
    let width = 0
    let height = 0

    const makePetal = (x, y) => ({
      x,
      y,
      vx: 0,
      vy: random(30, 70),
      size: random(4, 8),
      spin: random(0, Math.PI * 2),
      spinSpeed: random(-2.5, 2.5),
      sway: random(0, Math.PI * 2),
      colour: colours[Math.floor(random(0, colours.length))],
    })

    const sizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      ctx?.setTransform(ratio, 0, 0, ratio, 0, 0)
      const wanted = Math.min(16, Math.round(width / 45)) // a gentle fall, not a storm
      while (petals.length < wanted) petals.push(makePetal(random(0, width), random(-height, height)))
      petals.length = wanted
    }
    sizeCanvas()
    on(window, 'resize', sizeCanvas)

    const drawPetal = (p) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.spin)
      ctx.scale(1, 0.35 + Math.abs(Math.cos(p.spin * 1.7)) * 0.65) // flutter
      ctx.fillStyle = p.colour
      ctx.beginPath()
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Throw a handful of small petals out from a point on screen. Petals go
    // sideways and down (with a little lift), never up over the headline.
    const burstAt = (clientX, clientY, count, lift = 60) => {
      if (!ctx) return
      const box = canvas.getBoundingClientRect()
      for (let i = 0; i < count && bursts.length < 300; i++) {
        const side = i % 2 ? 1 : -1
        const angle = random(-0.15, 0.55) * Math.PI // from level to steeply down
        const speed = random(90, 260)
        const p = makePetal(clientX - box.left, clientY - box.top)
        p.size = random(3, 6)
        p.vx = side * Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed - lift
        bursts.push(p)
      }
    }

    const tick = (time, deltaTime) => {
      if (!ctx) return
      const dt = Math.min(deltaTime, 50) / 1000 // a long pause never teleports petals
      ctx.clearRect(0, 0, width, height)
      for (const p of petals) {
        p.sway += dt * 1.2
        p.x += Math.sin(p.sway) * 18 * dt
        p.y += p.vy * dt
        p.spin += p.spinSpeed * dt
        if (p.y > height + 20) Object.assign(p, makePetal(random(0, width), -20))
        drawPetal(p)
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const p = bursts[i]
        p.vx *= 1 - 1.6 * dt // air drag
        p.vy += 380 * dt // gravity
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.spin += p.spinSpeed * 3 * dt
        if (p.y > height + 30) bursts.splice(i, 1)
        else drawPetal(p)
      }
    }
    live.ticker.add(tick)
    // Stop drawing while the tab is hidden; resume when it is back.
    on(document, 'visibilitychange', () => {
      if (document.hidden) live.ticker.remove(tick)
      else context.add(() => live.ticker.add(tick))
    })

    // ── Tap Ganesh ji: a burst of petals and a pulse of the blessing glow ─
    const ganesh = $('.gp-ganesh')
    let pulse = null
    const bless = (clientX, clientY) => {
      burstAt(clientX, clientY, 28)
      context.add(() => {
        pulse?.kill()
        pulse = live
          .timeline()
          .fromTo('.gp-halo', { scale: 1 }, { scale: 1.14, duration: 0.25, ease: 'power2.out' })
          .to('.gp-halo', { scale: 1, spring: 'wobbly' })
          .fromTo('.gp-bless-glow', { scale: 1, opacity: 1 }, { scale: 1.8, opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
          .to('.gp-bless-glow', { scale: 1, opacity: 0.6, duration: 0.8, ease: 'power2.inOut' }, 0.3)
          .fromTo('.gp-palm-mark', { scale: 1 }, { scale: 1.6, duration: 0.2, ease: 'power2.out', yoyo: true, repeat: 1 }, 0)
      })
    }
    on(ganesh, 'click', (event) => {
      const hasPoint = event.clientX || event.clientY
      const box = ganesh.getBoundingClientRect()
      bless(hasPoint ? event.clientX : box.left + box.width / 2, hasPoint ? event.clientY : box.top + box.height / 3)
    })
    on(ganesh, 'keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      const box = ganesh.getBoundingClientRect()
      bless(box.left + box.width / 2, box.top + box.height / 3)
    })

    // ── Entrance ──────────────────────────────────────────────────────────
    const title = live.splitText('.gp-title', { type: 'words,chars', mask: 'chars' })
    const subLines = $$('.gp-sub span')

    const intro = live
      .timeline()
      // The garlands swing down from their corners and overshoot a little.
      .fromTo('.gp-swing', { rotate: -38, opacity: 0 }, { rotate: 0, opacity: 1, spring: 'wobbly' }, 0)
      // The carpet turns in from below as it grows.
      .fromTo('.gp-rangoli', { rotate: -70, scale: 0.55, opacity: 0 }, { rotate: 0, scale: 1, opacity: 1, duration: 1.8, ease: 'expo.out' }, 0.1)
      .fromTo('.gp-rangoli-dot', { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out', stagger: 0.04 }, 1.1)
      // Wordmark, then HAPPY.
      .fromTo('.gp-brand', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.2)
      .fromTo('.gp-happy', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0.45)
      // Each letter rises out of its own mask on a spring.
      .fromTo(title.chars, { y: 90, rotate: 8 }, { y: 0, rotate: 0, spring: 'bouncy', stagger: 0.035 }, 0.4)
      .fromTo(subLines, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.18 }, 1)
      // The growth arrow draws up to the right, then its head pops.
      .fromTo('.gp-arrow-line', { drawSVG: 0 }, { drawSVG: true, duration: 1.4, ease: 'power2.inOut' }, 0.7)
      .fromTo('.gp-arrow-head', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, spring: 'bouncy' }, 2.05)
      // Ganesh ji rises and settles; the glow blooms behind him.
      .fromTo('.gp-halo', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'expo.out' }, 0.4)
      .fromTo('.gp-rise', { y: 140 }, { y: 0, duration: 1.4, ease: 'back.out(1.2)' }, 0.35)
      .fromTo('.gp-rise', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.35)
      .fromTo('.gp-twinkle', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out', stagger: 0.1 }, 2)
      .fromTo('.gp-hint', { opacity: 0 }, { opacity: 0.85, duration: 0.8 }, 3.2)
    // Once he has settled, petals spill out and down from his crown.
    intro.call(() => {
      const box = $('.gp-crown').getBoundingClientRect()
      burstAt(box.left + box.width / 2, box.top + box.height * 0.7, 30, 0)
    }, [], 1.8)

    // ── Loops: the poster keeps breathing ─────────────────────────────────
    // Garland strands sway; the garlands themselves rock a little once in.
    live.fromTo('.gp-strand', { rotate: -4 }, { rotate: 4, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.4 })
    live.to('.gp-swing', { rotate: 1.6, duration: 3.2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2 })

    // The drapes billow from the shoulders: a slow lean and a quicker stretch,
    // at different lengths so the motion never quite repeats; the right drape
    // runs a beat behind.
    for (const [drape, delay] of [['.gp-drape-l', 1.4], ['.gp-drape-r', 2.1]]) {
      live.fromTo(drape, { skewY: -3 }, { skewY: 4, duration: 2.7, ease: 'sine.inOut', repeat: -1, yoyo: true, delay })
      live.fromTo(drape, { scaleX: 0.95, scaleY: 1.02 }, { scaleX: 1.05, scaleY: 0.97, duration: 1.9, ease: 'sine.inOut', repeat: -1, yoyo: true, delay })
    }

    // A glint sweeps across the crown every few seconds.
    live.fromTo('.gp-glint', { x: -60 }, { x: 200, duration: 1.1, ease: 'power2.inOut', repeat: -1, repeatDelay: 3.2, delay: 2.6 })
    live.fromTo('.gp-bless-glow', { opacity: 0.45, scale: 0.85 }, { opacity: 1, scale: 1.15, duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
    live.fromTo('.gp-halo', { opacity: 0.85 }, { opacity: 1, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2.4 })
    live.fromTo('.gp-trunk', { rotate: -2.5 }, { rotate: 2.5, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
    live.fromTo('.gp-twinkle', { opacity: 0.35 }, { opacity: 1, duration: 1, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.37, delay: 2.6 })
    live.to('.gp-rangoli-spin', { rotate: 360, duration: 60, ease: 'none', repeat: -1 })
    // Light streaks drift across the paper, one after another, on one timeline.
    live
      .timeline({ repeat: -1, repeatDelay: 1.2, delay: 1 })
      .fromTo('.gp-streak', { x: -120, opacity: 0 }, { x: 30, opacity: 1, duration: 1.8, ease: 'sine.out', stagger: 0.7 })
      .to('.gp-streak', { x: 180, opacity: 0, duration: 1.8, ease: 'sine.in', stagger: 0.7 }, 1.8)

    return () => {
      events.abort()
      root.classList.remove('gp-reduced')
    }
  })
  // #endregion code

  return () => mm.revert()
}

/** @type {import('../live-demos/types').LiveDemo} */
export const ganeshChaturthiPoster = {
  id: 'ganesh-chaturthi-poster',
  name: 'Ganesh Chaturthi Poster',
  description:
    'A company greeting poster: Ganesh ji on a teal throne over a red rangoli, a growth arrow rising behind him, marigold garlands at the corners. The garlands swing in, the headline rises letter by letter from masks, the arrow draws in and its head pops, the red cloth billows, the crown glints and petals fall. Tap Ganesh ji for blessings. Reduced motion shows the still poster.',
  tags: ['splitText', 'drawSVG', 'spring', 'call', 'ticker', 'matchMedia'],
  html,
  run,
}
