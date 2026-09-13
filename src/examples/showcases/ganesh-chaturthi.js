// ── Illustration helpers ─────────────────────────────────────────────────────
// Everything on this page is drawn as inline SVG. These build the repeated
// pieces (marigolds, modaks, diyas, rangoli petals) as markup strings once,
// when the module loads; the animation code below never touches them.

const round = (n) => Math.round(n * 10) / 10

/** A point on a circle around (cx, cy), with 0° pointing straight up. */
const polar = (cx, cy, r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180
  return `${round(cx + r * Math.cos(a))},${round(cy + r * Math.sin(a))}`
}

/** A layered marigold bloom. */
const marigold = (x, y, r, tone) =>
  `<g transform="translate(${round(x)} ${round(y)})"><circle r="${r}" fill="${tone ? '#ffb703' : '#ff8c1a'}"/><circle r="${round(r * 0.72)}" fill="${tone ? '#fb8500' : '#f76707'}" stroke="${tone ? '#ffd166' : '#ffa94d'}" stroke-width="1.5" stroke-dasharray="2 2.5"/><circle r="${round(r * 0.32)}" fill="#c2410c"/></g>`

/** A modak: a pleated teardrop dumpling, point up. */
const modak = (x, y, s) =>
  `<g transform="translate(${x} ${y}) scale(${s / 20})"><path d="M0,-20 C9,-12 16,-2 13,7 C9,13 -9,13 -13,7 C-16,-2 -9,-12 0,-20Z" fill="#fff4dc" stroke="#e9b949" stroke-width="1.2"/><path d="M0,-19 L0,11 M0,-19 C-5,-8 -8,2 -7,10 M0,-19 C5,-8 8,2 7,10" fill="none" stroke="#e9c46a" stroke-width="1"/></g>`

/** A clay diya. The flame group scales and leans from its base when it flickers. */
const diya = (x, y, s) =>
  `<g transform="translate(${x} ${y}) scale(${s})">
    <circle class="gc-diya-glow" cy="-26" r="34" fill="url(#gc-glow)"/>
    <g class="gc-diya">
      <path d="M-36,-6 C-32,18 32,18 36,-6 Z" fill="#b5451b"/>
      <path d="M-36,-6 C-20,2 20,2 36,-6 C20,-12 -20,-12 -36,-6Z" fill="#7c2d12"/>
      <path d="M-26,4 L26,4" stroke="#ffd166" stroke-width="2" stroke-dasharray="1 5" stroke-linecap="round"/>
      <path d="M-30,-2 C-14,5 14,5 30,-2" stroke="#fb8500" stroke-width="2" fill="none"/>
      <g class="gc-flame" style="transform-box: fill-box; transform-origin: 50% 100%">
        <path d="M0,-8 C-9,-14 -8,-30 0,-44 C8,-30 9,-14 0,-8Z" fill="url(#gc-flame-g)"/>
        <path d="M0,-10 C-4,-14 -4,-22 0,-30 C4,-22 4,-14 0,-10Z" fill="#fff8d6"/>
      </g>
    </g>
  </g>`

// The toran: marigold swags across the top, with hanging strands and mango leaves.
const toranWidth = 1200
const swags = 5
const swagWidth = toranWidth / swags
let toranSwags = ''
let toranStrands = ''
for (let i = 0; i < swags; i++) {
  const x0 = i * swagWidth
  for (let t = 0; t <= 1.001; t += 1 / 9) {
    // A quadratic curve from (x0, 18) to (x0 + w, 18) sagging through y ≈ 78.
    const x = x0 + swagWidth * t
    const y = 18 + 2 * (1 - t) * t * 120
    toranSwags += marigold(x, y, 13, (Math.round(t * 9) + i) % 2)
  }
}
for (let i = 0; i <= swags; i++) {
  const x = i * swagWidth
  let blooms = ''
  for (let k = 0; k < 4; k++) blooms += marigold(x, 34 + k * 21, 10, k % 2)
  toranStrands += `<g class="gc-strand" style="transform-box: fill-box; transform-origin: 50% 0%"><path d="M${x},18 L${x},110" stroke="#7c2d12" stroke-width="2"/>${blooms}<path d="M${x},112 C${x + 9},122 ${x + 8},140 ${x},150 C${x - 8},140 ${x - 9},122 ${x},112Z" fill="#2d8a4e"/></g>`
}
let toranLeaves = ''
for (let x = 10; x < toranWidth; x += 30) {
  toranLeaves += `<path transform="translate(${x} 4) rotate(${x % 60 ? 12 : -12})" d="M0,0 C8,10 8,28 0,38 C-8,28 -8,10 0,0Z" fill="${x % 90 ? '#2d8a4e' : '#40a869'}"/>`
}

// The rangoli, centred on the halo: rings, lotus loops and petal tips (stroked,
// so they can be drawn in), and dots between the petals.
const rc = [300, 290]
let rangoliLines = `<circle class="gc-rangoli-line" cx="${rc[0]}" cy="${rc[1]}" r="318" stroke="#ffb703" stroke-width="3"/>
  <circle class="gc-rangoli-line" cx="${rc[0]}" cy="${rc[1]}" r="252" stroke="#ffd166" stroke-width="2"/>`
for (let i = 0; i < 24; i++) {
  const a = i * 15
  rangoliLines += `<path class="gc-rangoli-line" d="M${polar(...rc, 258, a)} Q${polar(...rc, 285, a - 7)} ${polar(...rc, 310, a)} Q${polar(...rc, 285, a + 7)} ${polar(...rc, 258, a)}" stroke="#ff4d8d" stroke-width="3"/>`
}
for (let i = 0; i < 12; i++) {
  const a = i * 30 + 15
  rangoliLines += `<path class="gc-rangoli-line" d="M${polar(...rc, 196, a)} Q${polar(...rc, 238, a - 16)} ${polar(...rc, 246, a)} Q${polar(...rc, 238, a + 16)} ${polar(...rc, 196, a)}" stroke="#2ec4b6" stroke-width="3"/>`
}
let rangoliDots = ''
for (let i = 0; i < 24; i++) {
  const [x, y] = polar(...rc, 300, i * 15 + 7.5).split(',')
  rangoliDots += `<circle class="gc-rangoli-dot" cx="${x}" cy="${y}" r="4" fill="#fff3b0"/>`
}

// Halo rays.
let rays = ''
for (let i = 0; i < 36; i++) {
  rays += `<path d="M${polar(300, 280, 212, i * 10)} L${polar(300, 280, i % 2 ? 228 : 240, i * 10)}" stroke="#ffd166" stroke-width="${i % 2 ? 2 : 3}" stroke-linecap="round"/>`
}

// The lotus seat: a back row of petals and a front row fanned outward.
let lotus = ''
for (let i = -4; i <= 4; i++) {
  const x = 300 + i * 40
  lotus += `<path d="M${x},606 C${x - 26},590 ${x - 16},560 ${x},540 C${x + 16},560 ${x + 26},590 ${x},606Z" fill="#e05780" stroke="#ffb3c6" stroke-width="1.5"/>`
}
for (let i = -3.5; i <= 3.5; i++) {
  const x = 300 + i * 44
  lotus += `<path transform="rotate(${i * 7} ${x} 618)" d="M${x},618 C${x - 28},604 ${x - 18},576 ${x},560 C${x + 18},576 ${x + 28},604 ${x},618Z" fill="#ff8fab" stroke="#ffe0e9" stroke-width="1.5"/>`
}

const skin = '#f7a35c'
const skinShade = '#e0823a'
const outline = '#a84f1c'

export const html = `<style>
  .gc { --gold: #ffd166; --marigold: #ff9f1c; --ink: #fff7e6;
    position: relative; min-height: 100vh; min-height: 100svh; overflow: hidden; display: flex; flex-direction: column;
    background: radial-gradient(ellipse 80% 70% at 62% 55%, #8c2a1c 0%, #5a1116 45%, #2a070c 100%);
    color: var(--ink); font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
  .gc * { box-sizing: border-box; }
  .gc h1, .gc p { margin: 0; }

  .gc-toran { position: relative; z-index: 2; display: block; width: 100%; height: clamp(64px, 11vw, 132px); flex: none; }

  .gc-main { position: relative; z-index: 1; flex: 1; display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    align-items: center; gap: clamp(8px, 3vw, 40px); padding: 0 clamp(16px, 5vw, 80px) 72px; }
  .gc-copy { display: flex; flex-direction: column; gap: clamp(10px, 1.6vw, 18px); }
  .gc-deva { font-size: clamp(22px, 2.8vw, 38px); color: var(--gold); font-weight: 700; letter-spacing: 0.01em; }
  .gc-title { font-size: clamp(44px, 7.4vw, 112px); line-height: 0.95; font-weight: 900; letter-spacing: -0.03em;
    color: var(--ink); text-shadow: 0 0 28px rgba(255, 170, 60, 0.45); }
  .gc-title .gc-accent { color: var(--marigold); }
  .gc-title .char { will-change: transform; }
  .gc-sub { font-size: clamp(18px, 2.2vw, 30px); font-weight: 600; color: #ffe3b3; letter-spacing: 0.04em; text-transform: uppercase; }
  .gc-hint { margin-top: 6px; font-size: 14px; color: #f6c28b; opacity: 0.85; }
  .gc-hint b { color: var(--gold); font-weight: 700; }

  .gc-art { display: grid; place-items: center; min-width: 0; }
  .gc-art svg { width: 100%; height: auto; max-height: calc(100svh - 170px); overflow: visible; }
  .gc-mouse { cursor: pointer; outline: none; }
  .gc-mouse:focus-visible .gc-mouse-body { stroke: var(--gold); stroke-width: 3; }

  .gc-petals { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 3; pointer-events: none; }

  @media (max-width: 820px) {
    .gc-main { grid-template-columns: 1fr; align-content: start; text-align: center; padding-top: 4px; gap: 0; }
    .gc-copy { align-items: center; }
    .gc-art svg { max-height: 62svh; }
  }
</style>
<div class="gc">
  <svg class="gc-toran" viewBox="0 0 ${toranWidth} 150" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
    <path d="M0,16 H${toranWidth}" stroke="#7c2d12" stroke-width="4"/>
    ${toranLeaves}${toranStrands}${toranSwags}
  </svg>

  <main class="gc-main">
    <div class="gc-copy">
      <p class="gc-deva" lang="hi">गणपति बप्पा मोरया</p>
      <h1 class="gc-title">Ganpati Bappa <span class="gc-accent">Morya!</span></h1>
      <p class="gc-sub">Happy Ganesh Chaturthi</p>
      <p class="gc-hint">Tap <b>Mooshak</b> to make him hop · tap anywhere for flowers</p>
    </div>

    <div class="gc-art">
      <svg viewBox="-60 -40 720 740" role="img" aria-label="Lord Ganesha seated on a lotus with his mouse Mooshak, diyas and a rangoli">
        <defs>
          <radialGradient id="gc-halo-g">
            <stop offset="0" stop-color="#fff6c8" stop-opacity="0.95"/>
            <stop offset="0.45" stop-color="#ffd166" stop-opacity="0.7"/>
            <stop offset="0.8" stop-color="#f77f00" stop-opacity="0.28"/>
            <stop offset="1" stop-color="#f77f00" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="gc-glow">
            <stop offset="0" stop-color="#ffe08a" stop-opacity="0.85"/>
            <stop offset="1" stop-color="#ff9f1c" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="gc-flame-g" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#ff6a00"/>
            <stop offset="0.6" stop-color="#ffb703"/>
            <stop offset="1" stop-color="#ffe066"/>
          </linearGradient>
          <linearGradient id="gc-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff1a8"/>
            <stop offset="0.5" stop-color="#ffc53d"/>
            <stop offset="1" stop-color="#d98e04"/>
          </linearGradient>
          <radialGradient id="gc-belly" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stop-color="#ffc58a"/>
            <stop offset="1" stop-color="${skin}"/>
          </radialGradient>
        </defs>

        <!-- Back layer: rangoli and halo -->
        <g class="gc-layer-back">
          <g class="gc-rangoli" fill="none" stroke-linecap="round" opacity="0.8">${rangoliLines}</g>
          <g>${rangoliDots}</g>
          <g class="gc-halo">
            <circle class="gc-halo-glow" cx="300" cy="280" r="210" fill="url(#gc-halo-g)"/>
            <circle cx="300" cy="280" r="206" fill="none" stroke="#ffd166" stroke-width="3" opacity="0.8"/>
            <g class="gc-rays" opacity="0.75">${rays}</g>
          </g>
        </g>

        <!-- Middle layer: Ganesh ji -->
        <g class="gc-layer-mid">
          <g class="gc-rise">
            ${lotus}

            <!-- Ears, behind the head; each flaps from where it meets the head -->
            <g class="gc-ear-l" style="transform-box: fill-box; transform-origin: 95% 35%">
              <path d="M232,196 C188,160 118,172 106,236 C94,300 146,348 214,322 C230,300 234,250 232,196Z" fill="${skin}" stroke="${outline}" stroke-width="3"/>
              <path d="M222,214 C190,194 142,204 130,244 C122,286 158,316 206,302 C218,284 222,250 222,214Z" fill="#f28b8b"/>
            </g>
            <g transform="matrix(-1 0 0 1 600 0)">
              <g class="gc-ear-r" style="transform-box: fill-box; transform-origin: 95% 35%">
                <path d="M232,196 C188,160 118,172 106,236 C94,300 146,348 214,322 C230,300 234,250 232,196Z" fill="${skin}" stroke="${outline}" stroke-width="3"/>
                <path d="M222,214 C190,194 142,204 130,244 C122,286 158,316 206,302 C218,284 222,250 222,214Z" fill="#f28b8b"/>
              </g>
            </g>

            <!-- Upper arms: an axe (parashu) and a lotus -->
            <g stroke-linecap="round">
              <path d="M240,326 L168,286" stroke="${outline}" stroke-width="31"/><path d="M240,326 L168,286" stroke="${skin}" stroke-width="26"/>
              <path d="M158,322 L176,200" stroke="#8d5524" stroke-width="5"/>
              <path d="M178,196 C150,182 132,214 144,238 L172,226 Z" fill="url(#gc-gold)" stroke="#b7791f" stroke-width="1.5"/>
              <circle cx="166" cy="282" r="15" fill="${skin}" stroke="${outline}" stroke-width="2.5"/>
              <path d="M154,290 L176,294" stroke="#ffc53d" stroke-width="5"/>
              <path d="M360,326 L432,286" stroke="${outline}" stroke-width="31"/><path d="M360,326 L432,286" stroke="${skin}" stroke-width="26"/>
              <path d="M436,286 C440,262 440,248 442,236" stroke="#2d8a4e" stroke-width="4" fill="none"/>
              <g transform="translate(442 226)">
                <path d="M0,6 C-16,-2 -18,-16 -12,-22 C-6,-10 -2,-4 0,6Z" fill="#ff8fab"/>
                <path d="M0,6 C16,-2 18,-16 12,-22 C6,-10 2,-4 0,6Z" fill="#ff8fab"/>
                <path d="M0,6 C-8,-6 -6,-20 0,-30 C6,-20 8,-6 0,6Z" fill="#e05780"/>
              </g>
              <circle cx="434" cy="284" r="15" fill="${skin}" stroke="${outline}" stroke-width="2.5"/>
              <path d="M424,292 L446,288" stroke="#ffc53d" stroke-width="5"/>
            </g>

            <!-- Body: torso, dhoti, belly, sash, sacred thread and necklace -->
            <path d="M234,310 C212,340 200,392 206,444 L394,444 C400,392 388,340 366,310 Z" fill="${skin}" stroke="${outline}" stroke-width="3"/>
            <path d="M246,356 Q270,372 292,366 M308,366 Q330,372 354,356" stroke="${skinShade}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M146,566 C134,504 198,480 300,490 C402,480 466,504 454,566 C414,596 186,596 146,566Z" fill="#d62828" stroke="#ffd166" stroke-width="5"/>
            <path d="M170,560 C220,576 380,576 430,560" stroke="#ffd166" stroke-width="2" fill="none" stroke-dasharray="2 7" stroke-linecap="round"/>
            <ellipse cx="300" cy="432" rx="98" ry="80" fill="url(#gc-belly)" stroke="${outline}" stroke-width="3"/>
            <path d="M294,446 Q300,454 306,446" stroke="${skinShade}" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M202,482 C250,506 350,506 398,482 L402,500 C352,526 248,526 198,500Z" fill="url(#gc-gold)"/>
            <path d="M254,318 C292,378 334,444 376,486" stroke="#fff3b0" stroke-width="3" fill="none"/>
            <path d="M240,320 Q300,396 360,320" stroke="url(#gc-gold)" stroke-width="7" fill="none" stroke-linecap="round"/>
            <circle cx="300" cy="358" r="9" fill="#d62828" stroke="#ffd166" stroke-width="3"/>
            <path d="M318,550 C330,532 382,528 400,540 C410,548 404,562 392,563 C368,566 330,566 318,550Z" fill="${skin}" stroke="${outline}" stroke-width="2.5"/>
            <path d="M396,534 a5,5 0 1 1 8,6 M402,544 a5,5 0 1 1 6,7" fill="${skin}" stroke="${outline}" stroke-width="2"/>
            <path d="M332,556 L336,540" stroke="#ffd166" stroke-width="4" stroke-linecap="round"/>

            <!-- Lower right hand: blessing (abhaya mudra), glowing -->
            <circle class="gc-bless-glow" cx="188" cy="330" r="46" fill="url(#gc-glow)"/>
            <g stroke-linecap="round" stroke-linejoin="round">
              <path d="M234,334 L198,420 L188,366" stroke="${outline}" stroke-width="37" fill="none"/>
              <path d="M234,334 L198,420" stroke="${skin}" stroke-width="32"/>
              <path d="M198,420 L188,366" stroke="${skin}" stroke-width="26"/>
              <path d="M174,372 L202,368" stroke="#ffc53d" stroke-width="6"/>
            </g>
            <g class="gc-bless-hand" transform="translate(189 350) scale(1.3) translate(-189 -350)" stroke="${outline}" stroke-width="1.6">
              <rect x="171" y="318" width="36" height="46" rx="14" fill="${skin}"/>
              <rect x="172" y="296" width="8" height="30" rx="4" fill="${skin}"/>
              <rect x="181" y="291" width="8" height="34" rx="4" fill="${skin}"/>
              <rect x="190" y="293" width="8" height="32" rx="4" fill="${skin}"/>
              <rect x="199" y="300" width="7.5" height="26" rx="3.75" fill="${skin}"/>
              <rect x="160" y="330" width="9" height="24" rx="4.5" fill="${skin}" transform="rotate(-32 164 342)"/>
              <circle cx="189" cy="342" r="5" fill="#d62828" stroke="none"/>
            </g>

            <!-- Lower left hand: a bowl of modaks -->
            <g stroke-linecap="round">
              <path d="M366,334 L404,420 L420,454" stroke="${outline}" stroke-width="37" fill="none"/>
              <path d="M366,334 L404,420" stroke="${skin}" stroke-width="32"/>
              <path d="M404,420 L420,454" stroke="${skin}" stroke-width="26"/>
            </g>
            ${modak(404, 446, 17)}${modak(438, 446, 17)}${modak(421, 428, 17)}
            <path d="M378,452 L464,452 C460,486 382,486 378,452Z" fill="url(#gc-gold)" stroke="#b7791f" stroke-width="1.5"/>
            <ellipse cx="421" cy="484" rx="22" ry="9" fill="${skin}" stroke="${outline}" stroke-width="2.5"/>

            <!-- Head -->
            <g class="gc-head">
              <path d="M300,136 C362,136 394,180 392,232 C390,278 362,306 334,314 C320,318 280,318 266,314 C238,306 210,278 208,232 C206,180 238,136 300,136Z" fill="${skin}" stroke="${outline}" stroke-width="3"/>
              <ellipse cx="250" cy="274" rx="24" ry="14" fill="#ff8a80" opacity="0.35"/>
              <ellipse cx="350" cy="274" rx="24" ry="14" fill="#ff8a80" opacity="0.35"/>
              <!-- one whole tusk, and the broken one -->
              <path d="M274,290 C274,318 264,340 246,352 C250,330 254,310 258,288 Z" fill="#fffaf0" stroke="#c9a96e" stroke-width="2"/>
              <path d="M326,290 L342,290 L338,306 Z" fill="#fffaf0" stroke="#c9a96e" stroke-width="2"/>
              <!-- eyes -->
              <g class="gc-eye">
                <path d="M244,238 Q262,222 280,238 Q262,250 244,238Z" fill="#fff"/>
                <circle cx="264" cy="237" r="6" fill="#2b1a12"/><circle cx="266" cy="235" r="2" fill="#fff"/>
              </g>
              <g class="gc-eye">
                <path d="M320,238 Q338,222 356,238 Q338,250 320,238Z" fill="#fff"/>
                <circle cx="336" cy="237" r="6" fill="#2b1a12"/><circle cx="338" cy="235" r="2" fill="#fff"/>
              </g>
              <path d="M240,222 Q262,208 282,220 M318,220 Q338,208 360,222" stroke="#7c2d12" stroke-width="3" fill="none" stroke-linecap="round"/>
              <!-- tilak -->
              <path d="M290,180 Q300,214 310,180" stroke="#d62828" stroke-width="5" fill="none" stroke-linecap="round"/>
              <circle cx="300" cy="206" r="5" fill="#ffd166"/>
              <!-- trunk: sways from its root between the eyes -->
              <g class="gc-trunk" style="transform-box: fill-box; transform-origin: 50% 0%" stroke-linecap="round" fill="none">
                <path d="M300,262 C300,292 298,322 306,352 C318,390 354,394 364,368 C370,352 354,344 346,356" stroke="${outline}" stroke-width="27"/>
                <path d="M300,262 C300,292 298,322 306,352" stroke="${outline}" stroke-width="43"/>
                <path d="M300,250 C300,292 298,322 306,352" stroke="${skin}" stroke-width="38"/>
                <path d="M306,352 C318,390 354,394 364,368 C370,352 354,344 346,356" stroke="${skin}" stroke-width="22"/>
                <path d="M288,286 Q300,292 312,286 M288,304 Q300,310 312,304 M290,322 Q302,328 314,322 M296,342 Q308,346 318,338" stroke="${skinShade}" stroke-width="2.5"/>
              </g>
              <!-- mukut -->
              <g class="gc-crown">
                <path d="M234,154 C236,124 250,108 262,96 L280,110 L292,64 L300,36 L308,64 L320,110 L338,96 C350,108 364,124 366,154 C340,142 260,142 234,154 Z" fill="url(#gc-gold)" stroke="#b7791f" stroke-width="2"/>
                <path d="M224,176 C250,160 350,160 376,176 L372,150 C346,138 254,138 228,150 Z" fill="#ffc53d" stroke="#b7791f" stroke-width="2"/>
                <path d="M238,160 C270,152 330,152 362,160" stroke="#d62828" stroke-width="3" stroke-dasharray="0.1 12" stroke-linecap="round" fill="none"/>
                <circle cx="300" cy="120" r="10" fill="#d62828" stroke="#fff1a8" stroke-width="3"/>
                <circle cx="264" cy="132" r="6" fill="#2a9d8f" stroke="#fff1a8" stroke-width="2"/>
                <circle cx="336" cy="132" r="6" fill="#2a9d8f" stroke="#fff1a8" stroke-width="2"/>
                <circle cx="300" cy="70" r="5" fill="#d62828"/>
                <circle cx="300" cy="30" r="7" fill="url(#gc-gold)" stroke="#b7791f" stroke-width="1.5"/>
              </g>
              <!-- sparkles on the crown -->
              ${[[262, 72, 1], [344, 98, 0.8], [300, 4, 1.1], [376, 142, 0.7], [226, 132, 0.6]]
                .map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="gc-sparkle"><path class="gc-twinkle" d="M0,-14 Q2,-2 14,0 Q2,2 0,14 Q-2,2 -14,0 Q-2,-2 0,-14Z" fill="#fffbe0"/></g></g>`)
                .join('')}
            </g>
          </g>
        </g>

        <!-- Front layer: modak plate, diyas and Mooshak -->
        <g class="gc-layer-front">
          <g class="gc-plate">
            <ellipse cx="300" cy="668" rx="86" ry="16" fill="url(#gc-gold)" stroke="#b7791f" stroke-width="2"/>
            ${modak(270, 652, 20)}${modak(300, 654, 20)}${modak(330, 652, 20)}${modak(285, 626, 20)}${modak(315, 626, 20)}${modak(300, 600, 20)}
          </g>
          ${diya(-10, 650, 1.05)}${diya(92, 676, 0.9)}${diya(628, 540, 0.8)}

          <g transform="translate(528 684) scale(1.2)">
            <g class="gc-mouse-pop">
              <g class="gc-mouse" tabindex="0" role="button" aria-label="Mooshak, Ganesh ji's mouse. Tap to make him hop." style="transform-box: fill-box; transform-origin: 50% 100%">
                <path class="gc-tail" style="transform-box: fill-box; transform-origin: 0% 90%" d="M40,-12 C84,-6 96,-44 74,-60 C62,-68 50,-56 58,-48" stroke="#a58a80" stroke-width="5" fill="none" stroke-linecap="round"/>
                <ellipse class="gc-mouse-body" cx="10" cy="-40" rx="50" ry="40" fill="#9c8177"/>
                <ellipse cx="-6" cy="-30" rx="28" ry="26" fill="#e7d9d2"/>
                <ellipse cx="-22" cy="-3" rx="13" ry="6" fill="#f4a5b0"/>
                <ellipse cx="28" cy="-3" rx="13" ry="6" fill="#f4a5b0"/>
                <g class="gc-mouse-head" style="transform-box: fill-box; transform-origin: 75% 90%"><g transform="translate(16 18)">
                  <circle cx="-50" cy="-110" r="14" fill="#9c8177"/><circle cx="-50" cy="-110" r="8" fill="#f4a5b0"/>
                  <path d="M-12,-104 C-22,-60 -58,-58 -90,-72 C-70,-88 -56,-112 -30,-112 C-20,-112 -14,-108 -12,-104Z" fill="#9c8177"/>
                  <circle cx="-22" cy="-114" r="17" fill="#a88d83"/><circle cx="-22" cy="-114" r="10" fill="#f4a5b0"/>
                  <circle cx="-90" cy="-72" r="6" fill="#e85d75"/>
                  <circle cx="-48" cy="-90" r="5.5" fill="#1f130e"/><circle cx="-46" cy="-92" r="1.8" fill="#fff"/>
                  <ellipse cx="-58" cy="-76" rx="7" ry="4" fill="#f4a5b0" opacity="0.7"/>
                  <g class="gc-whiskers" style="transform-box: fill-box; transform-origin: 100% 50%" stroke="#5b4640" stroke-width="1.5" stroke-linecap="round">
                    <path d="M-84,-74 L-116,-86 M-84,-72 L-120,-72 M-84,-70 L-114,-58"/>
                  </g>
                </g></g>
                <!-- his modak, held up to nibble -->
                <g class="gc-mouse-modak">${modak(-66, -36, 15)}
                  <ellipse cx="-80" cy="-32" rx="6" ry="5" fill="#f4a5b0"/><ellipse cx="-52" cy="-32" rx="6" ry="5" fill="#f4a5b0"/>
                </g>
              </g>
            </g>
            <g class="gc-bubble" opacity="0">
              <rect x="-80" y="-196" width="120" height="40" rx="20" fill="#fff7e6"/>
              <path d="M-40,-158 L-50,-142 L-26,-158Z" fill="#fff7e6"/>
              <text class="gc-bubble-text" x="-20" y="-170" text-anchor="middle" font-size="17" font-weight="800" fill="#b5451b" font-family="system-ui, sans-serif">Morya!</text>
            </g>
          </g>
        </g>
      </svg>
    </div>
  </main>

  <canvas class="gc-petals" aria-hidden="true"></canvas>
</div>`

/**
 * @param {import('../../compat/gsap').LiveApi} live
 * @param {HTMLElement} root
 */
export function run(live, root) {
  // #region code
  const $ = (selector) => root.querySelector(selector)
  const $$ = (selector) => [...root.querySelectorAll(selector)]

  // A small seeded random, so the petals and flicker are the same on every load.
  let seed = 2026
  const random = (min = 0, max = 1) => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min)
  }

  // Custom eases, registered by name and usable anywhere.
  live.customBounce('gc-drop', { strength: 0.55 })
  live.customWiggle('gc-flap', { wiggles: 3, type: 'easeInOut' })
  live.customWiggle('gc-nibble', { wiggles: 5, type: 'uniform' })
  live.customWiggle('gc-whisker', { wiggles: 6, type: 'easeOut' })
  live.customWiggle('gc-wag', { wiggles: 3, type: 'easeInOut' })

  // Everything is set up per motion preference; matchMedia reverts the old
  // setup (tweens, split text, ticker, listeners) when the preference changes.
  const mm = live.matchMedia()
  mm.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (context) => {
    const reduce = context.conditions.reduce
    const events = new AbortController() // removes every listener on revert
    const on = (target, type, handler) => target.addEventListener(type, handler, { signal: events.signal })
    root.classList.toggle('gc-reduced', reduce)

    // ── Mooshak: tap him and he hops, and says something ──────────────────
    const mouse = $('.gc-mouse')
    const bubble = $('.gc-bubble')
    const bubbleText = $('.gc-bubble-text')
    const sayings = ['Morya!', 'Modak?', 'Bappa!', 'Wheee!', 'One more!']
    let hops = 0
    let hop = null
    let speech = null
    const hopMooshak = () => {
      bubbleText.textContent = sayings[hops++ % sayings.length]
      if (reduce) {
        live.set(bubble, { opacity: 1 })
        return
      }
      context.add(() => {
        hop?.kill()
        speech?.kill()
        // Squash, leap with a lean, then land on a bounce while the lean springs back.
        hop = live
          .timeline()
          .to(mouse, { scaleY: 0.8, scaleX: 1.14, duration: 0.09, ease: 'power2.out' })
          .to(mouse, { y: -120, scaleY: 1.08, scaleX: 0.94, rotate: -10, duration: 0.32, ease: 'power2.out' })
          .to(mouse, { y: 0, duration: 0.75, ease: 'gc-drop' })
          .to(mouse, { scaleY: 1, scaleX: 1, rotate: 0, spring: 'wobbly' }, '<')
        speech = live
          .timeline()
          .fromTo(bubble, { opacity: 0, y: 14, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, spring: 'bouncy' })
          .to(bubble, { opacity: 0, y: -10, duration: 0.4, ease: 'power2.in' }, '+=0.8')
      })
    }
    on(mouse, 'click', (event) => {
      event.stopPropagation()
      hopMooshak()
      burstAt(event.clientX, event.clientY, 18)
    })
    on(mouse, 'keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      hopMooshak()
    })

    // ── Petals: a canvas drawn on the ticker ──────────────────────────────
    const canvas = $('.gc-petals')
    const ctx = canvas.getContext('2d')
    const colours = ['#ff9f1c', '#ffb703', '#f76707', '#ffd166', '#e63946', '#fff4dc']
    const petals = [] // falling forever, recycled at the top
    const bursts = [] // thrown out by a tap, removed once they fall off screen
    let width = 0
    let height = 0

    const makePetal = (x, y) => ({
      x,
      y,
      vx: 0,
      vy: random(40, 90),
      size: random(5, 10),
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
      const wanted = reduce ? 0 : Math.min(48, Math.round(width / 28))
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

    // Throw a handful of petals out from a point on screen.
    function burstAt(clientX, clientY, count) {
      if (reduce || !ctx) return
      const box = canvas.getBoundingClientRect()
      for (let i = 0; i < count && bursts.length < 400; i++) {
        const angle = random(0, Math.PI * 2)
        const speed = random(120, 420)
        const p = makePetal(clientX - box.left, clientY - box.top)
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed - 160
        bursts.push(p)
      }
    }

    // ── Diya flames: flicker by re-targeting quickTo setters a few times a second
    const flames = $$('.gc-flame').map((flame, i) => ({
      scaleY: live.quickTo(flame, 'scaleY', { duration: 0.14, ease: 'sine.inOut' }),
      scaleX: live.quickTo(flame, 'scaleX', { duration: 0.14, ease: 'sine.inOut' }),
      rotate: live.quickTo(flame, 'rotate', { duration: 0.2, ease: 'sine.inOut' }),
      glow: live.quickTo($$('.gc-diya-glow')[i], 'opacity', { duration: 0.2, ease: 'sine.inOut' }),
    }))
    let flickerClock = 0

    const tick = (time, deltaTime) => {
      const dt = Math.min(deltaTime, 50) / 1000 // a long pause never teleports petals

      flickerClock += dt
      if (flickerClock > 0.11) {
        flickerClock = 0
        for (const flame of flames) {
          flame.scaleY(random(0.82, 1.18))
          flame.scaleX(random(0.9, 1.06))
          flame.rotate(random(-7, 7))
          flame.glow(random(0.65, 1))
        }
      }

      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      for (const p of petals) {
        p.sway += dt * 1.3
        p.x += Math.sin(p.sway) * 22 * dt
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

    // ── Reduced motion: the finished illustration, still, with the text shown
    if (reduce) {
      return () => {
        events.abort()
        root.classList.remove('gc-reduced')
      }
    }

    live.ticker.add(tick)
    // Stop drawing while the tab is hidden; resume when it is back.
    on(document, 'visibilitychange', () => {
      if (document.hidden) live.ticker.remove(tick)
      else context.add(() => live.ticker.add(tick))
    })
    // Tap anywhere for flowers.
    on(root, 'click', (event) => burstAt(event.clientX, event.clientY, 36))

    // ── Entrance: rangoli draws in, halo blooms, Ganesh ji rises ──────────
    live
      .timeline()
      .fromTo('.gc-toran', { y: -150 }, { y: 0, spring: 'gentle' }, 0)
      // Every stroke is measured on its own, so rings and petals draw over the same
      // time; the stagger sweeps round the mandala, the last starting ~0.9s later.
      .fromTo('.gc-rangoli-line', { drawSVG: 0 }, { drawSVG: true, duration: 1.8, ease: 'power2.inOut', stagger: 0.025 }, 0.1)
      .fromTo('.gc-rangoli-dot', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out', stagger: 0.03 }, 1)
      .fromTo('.gc-halo', { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'expo.out' }, 0.3)
      .fromTo('.gc-rise', { y: 160 }, { y: 0, spring: 'gentle' }, 0.5)
      .fromTo('.gc-rise', { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 0.5)
      .fromTo('.gc-sparkle', { scale: 0, rotate: -120 }, { scale: 1, rotate: 0, duration: 0.7, ease: 'back.out', stagger: 0.12 }, 1.5)
      .fromTo('.gc-diya', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, spring: 'bouncy', stagger: 0.15 }, 1.3)
      .fromTo('.gc-plate', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'back.out' }, 1.6)
      // Mooshak drops in from above and bounces to a stop.
      .fromTo('.gc-mouse-pop', { y: -420 }, { y: 0, duration: 1.2, ease: 'gc-drop' }, 1.9)
      .fromTo('.gc-mouse-pop', { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.9)

    // ── Greeting: words, then letters rising on springs ───────────────────
    const deva = live.splitText('.gc-deva', { type: 'words' }) // Devanagari stays whole: its letters join
    const title = live.splitText('.gc-title', { type: 'chars' })
    live.fromTo(deva.words, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15, delay: 0.4 })
    live.fromTo(title.chars, { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.04, delay: 0.8 })
    live.fromTo(title.chars, { y: 90, rotate: 18, scale: 0.6 }, {
      y: 0,
      rotate: 0,
      scale: 1,
      spring: 'bouncy',
      stagger: 0.04,
      delay: 0.8,
      // The greeting is complete: a shower of flowers from the title.
      onComplete: () => {
        const box = $('.gc-title').getBoundingClientRect()
        burstAt(box.left + box.width / 2, box.top + box.height / 2, 90)
      },
    })
    live.fromTo('.gc-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: 1.6 })
    live.fromTo('.gc-hint', { opacity: 0 }, { opacity: 0.85, duration: 0.8, delay: 3.4 })

    // ── Loops: the scene keeps breathing ──────────────────────────────────
    live.to('.gc-rays', { rotate: 360, duration: 90, ease: 'none', repeat: -1 })
    live.fromTo('.gc-halo-glow', { scale: 0.96 }, { scale: 1.05, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
    live.fromTo('.gc-trunk', { rotate: -4 }, { rotate: 4, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true })
    live.fromTo('.gc-bless-glow', { opacity: 0.3, scale: 0.8 }, { opacity: 1, scale: 1.2, duration: 1.6, ease: 'sine.inOut', repeat: -1, yoyo: true })
    live.fromTo('.gc-twinkle', { scale: 0.5, opacity: 0.5 }, { scale: 1.2, opacity: 1, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.3 })
    live.fromTo('.gc-strand', { rotate: -3 }, { rotate: 3, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.35 })
    // Ears flap now and then; the wiggle ease swings them and brings them home.
    live
      .timeline({ repeat: -1, repeatDelay: 2.4 })
      .to('.gc-ear-l', { rotate: -8, duration: 1.4, ease: 'gc-flap' })
      .to('.gc-ear-r', { rotate: -8, duration: 1.4, ease: 'gc-flap' }, '<')
    live
      .timeline({ repeat: -1, repeatDelay: 3.6 })
      .to('.gc-eye', { scaleY: 0.1, duration: 0.08, ease: 'power1.in' })
      .to('.gc-eye', { scaleY: 1, duration: 0.14, ease: 'power1.out' })
    // Mooshak nibbles, twitches his whiskers and wags his tail.
    live
      .timeline({ repeat: -1, repeatDelay: 1.3 })
      .to('.gc-mouse-head', { rotate: 5, duration: 0.9, ease: 'gc-nibble' })
      .to('.gc-mouse-modak', { y: -4, duration: 0.9, ease: 'gc-nibble' }, '<')
    live.timeline({ repeat: -1, repeatDelay: 1.1 }).to('.gc-whiskers', { rotate: 12, duration: 0.8, ease: 'gc-whisker' })
    live.to('.gc-tail', { rotate: 16, duration: 2, ease: 'gc-wag', repeat: -1 })

    // ── Parallax: layers drift with the pointer, nearer ones further ──────
    const layers = [
      ['.gc-layer-back', -10],
      ['.gc-layer-mid', 8],
      ['.gc-layer-front', 20],
      ['.gc-copy', -12],
    ].map(([selector, depth]) => ({
      depth,
      x: live.quickTo(selector, 'x', { duration: 0.9, ease: 'power3.out' }),
      y: live.quickTo(selector, 'y', { duration: 0.9, ease: 'power3.out' }),
    }))
    on(window, 'pointermove', (event) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1
      const ny = (event.clientY / window.innerHeight) * 2 - 1
      for (const layer of layers) {
        layer.x(nx * layer.depth)
        layer.y(ny * layer.depth * 0.6)
      }
    })

    return () => {
      events.abort()
      root.classList.remove('gc-reduced')
    }
  })
  // #endregion code

  return () => mm.revert()
}

/** @type {import('../live-demos/types').LiveDemo} */
export const ganeshChaturthi = {
  id: 'ganesh-chaturthi',
  name: 'Ganesh Chaturthi',
  description:
    'A festive full-page greeting: Ganesh ji and Mooshak hand-drawn in SVG. The rangoli draws in, the halo blooms, the trunk sways and the ears flap, diyas flicker, marigold petals fall on a canvas, and the greeting rises on springs. Tap Mooshak and he hops. Reduced motion shows the still illustration.',
  tags: ['splitText', 'drawSVG', 'spring', 'customBounce', 'customWiggle', 'quickTo', 'ticker', 'matchMedia'],
  html,
  run,
}
