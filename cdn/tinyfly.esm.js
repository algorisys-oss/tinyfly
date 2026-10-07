function mh(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function ss(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const Jo = 2;
function il(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function ao(t) {
  return t.property === "text" && "textConfig" in t;
}
function Ae(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function $e(t) {
  return t.kind === "spring" && "spring" in t;
}
function ol(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function ub(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function yh(t) {
  return "keyframes" in t;
}
class db {
  _currentTime = 0;
  _isRunning = !1;
  onTick = null;
  get currentTime() {
    return this._currentTime;
  }
  get isRunning() {
    return this._isRunning;
  }
  start() {
    this._isRunning = !0;
  }
  stop() {
    this._isRunning = !1;
  }
  tick(e) {
    this._currentTime += e, this.onTick?.(e, this._currentTime);
  }
  reset() {
    this._currentTime = 0;
  }
  seek(e) {
    this._currentTime = e;
  }
}
class fb {
  _currentTime = 0;
  _isRunning = !1;
  _lastFrameTime = null;
  _rafId = null;
  _speed;
  onTick = null;
  constructor(e = {}) {
    this._speed = e.speed ?? 1;
  }
  get currentTime() {
    return this._currentTime;
  }
  get isRunning() {
    return this._isRunning;
  }
  get speed() {
    return this._speed;
  }
  set speed(e) {
    this._speed = e;
  }
  start() {
    this._isRunning || (this._isRunning = !0, this._lastFrameTime = null, this._scheduleFrame());
  }
  stop() {
    this._isRunning = !1, this._rafId !== null && (cancelAnimationFrame(this._rafId), this._rafId = null);
  }
  reset() {
    this._currentTime = 0, this._lastFrameTime = null;
  }
  seek(e) {
    this._currentTime = e;
  }
  _scheduleFrame() {
    this._rafId = requestAnimationFrame(this._onFrame.bind(this));
  }
  _onFrame(e) {
    if (this._isRunning) {
      if (this._lastFrameTime !== null) {
        const s = (e - this._lastFrameTime) * this._speed;
        this._currentTime += s, this.onTick?.(s, this._currentTime);
      }
      this._lastFrameTime = e, this._scheduleFrame();
    }
  }
}
function bh(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function rl(t, e, n = "start") {
  if (e <= 1) return 0;
  if (typeof n == "number") {
    const s = Math.max(0, Math.min(e - 1, n));
    return Math.abs(t - s);
  }
  switch (n) {
    case "end":
      return e - 1 - t;
    case "center":
      return Math.abs(t - (e - 1) / 2);
    case "edges":
      return (e - 1) / 2 - Math.abs(t - (e - 1) / 2);
    default:
      return t;
  }
}
function al(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, rl(s, t, e));
  return n;
}
function lo(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", i = rl(t, e, s);
  if (n.amount !== void 0) {
    const o = al(e, s);
    return o === 0 ? 0 : n.amount * i / o;
  }
  return n.each !== void 0 ? n.each * i : 0;
}
function xi(t, e) {
  return Array.from({ length: t }, (n, s) => lo(s, t, e));
}
function Ts(t, e) {
  return t <= 1 ? 0 : Math.max(...xi(t, e));
}
const dn = 1, ll = 6e4, Cn = ll / dn, Bt = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Bs = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class xs {
  from;
  to;
  stiffness;
  damping;
  mass;
  restDelta;
  restSpeed;
  /** value[i] is the spring's position at time i * SPRING_STEP_MS */
  /**
   * Travel distance, used to scale the rest thresholds.
   *
   * Without this the thresholds are absolute, and a spring animating `scale`
   * from 0 to 1 hits them ~100x sooner than one animating `x` from 0 to 100 —
   * so the small one is declared "settled" at its first pass through the
   * target and never shows the overshoot at all. Scaling by travel makes
   * settling depend on the spring's parameters, not on the units of whatever
   * property it happens to drive.
   */
  distance;
  samples;
  velocity;
  /** Once at rest we stop simulating; every later time returns `to`. */
  settledStep = null;
  constructor(e) {
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? Bt.stiffness, this.damping = e.damping ?? Bt.damping, this.mass = e.mass ?? Bt.mass, this.restDelta = e.restDelta ?? Bt.restDelta, this.restSpeed = e.restSpeed ?? Bt.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? Bt.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
  }
  /**
   * Whether a position/velocity pair counts as settled.
   *
   * Both thresholds are fractions of the spring's travel distance:
   * `restDelta` as a fraction of the distance, and `restSpeed` as a fraction
   * of the distance per second. That keeps settling scale-invariant.
   */
  isAtRest(e) {
    return Math.abs(e - this.to) < this.restDelta * this.distance && Math.abs(this.velocity) < this.restSpeed * this.distance;
  }
  /**
   * Position at `timeMs`. Times before 0 clamp to the start value; times past
   * settling return the target exactly.
   */
  valueAt(e) {
    if (e <= 0) return this.from;
    const n = Math.floor(e / dn);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], i = this.samples[Math.min(n + 1, this.samples.length - 1)], o = e / dn - n;
    return s + (i - s) * o;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Cn + 1), this.settledStep !== null ? this.settledStep * dn : ll;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, Cn + 1), s = dn / 1e3;
    for (; this.samples.length < n; ) {
      const i = this.samples[this.samples.length - 1], o = i - this.to, r = -this.stiffness * o, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = i + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Cn && (this.settledStep = Cn);
  }
}
function pb(t, e) {
  return new xs(t).valueAt(e);
}
function wh(t) {
  return new xs(t).settleTime();
}
function gb(t) {
  const e = t.stiffness ?? Bt.stiffness, n = t.damping ?? Bt.damping, s = t.mass ?? Bt.mass;
  return n < 2 * Math.sqrt(e * s);
}
function mb(t) {
  const e = t.stiffness ?? Bt.stiffness, n = t.mass ?? Bt.mass;
  return 2 * Math.sqrt(e * n);
}
const Zo = 4, kh = 2e-3, vh = 1e-4, Mh = 6e4;
function Es(t) {
  const e = t.friction ?? Zo;
  return e > 0 ? e : Zo;
}
function is(t) {
  return t.from + t.velocity / Es(t);
}
function Sh(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function $n(t) {
  let e = Sh(is(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function Pn(t) {
  const e = Math.abs($n(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(vh, e * kh);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Es(t);
  return Math.min(Mh, s * 1e3);
}
function Ei(t, e) {
  if (e <= 0) return t.from;
  const n = $n(t);
  if (e >= Pn(t)) return n;
  const s = Es(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function yb(t, e) {
  const n = Es(t), s = $n(t);
  return e >= Pn(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Ai = (t) => t, Th = (t) => t * t, xh = (t) => 1 - (1 - t) * (1 - t), Eh = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, cl = (t) => t * t * t, hl = (t) => 1 - Math.pow(1 - t, 3), As = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Ah = cl, $h = hl, Ph = As, _h = {
  linear: Ai,
  "ease-in": Ah,
  "ease-out": $h,
  "ease-in-out": Ph,
  "ease-in-quad": Th,
  "ease-out-quad": xh,
  "ease-in-out-quad": Eh,
  "ease-in-cubic": cl,
  "ease-out-cubic": hl,
  "ease-in-out-cubic": As
};
function Oh(t) {
  const [e, n, s, i] = t, o = 3 * e, r = 3 * (s - e) - o, a = 1 - o - r, l = 3 * n, c = 3 * (i - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + o) * p, d = (p) => ((h * p + c) * p + l) * p, f = (p) => (3 * a * p + 2 * r) * p + o, g = (p) => {
    let m = p;
    for (let b = 0; b < 8; b++) {
      const v = u(m) - p;
      if (Math.abs(v) < 1e-7)
        return m;
      const M = f(m);
      if (Math.abs(M) < 1e-7)
        break;
      m -= v / M;
    }
    let y = 0, w = 1;
    for (m = p; y < w; ) {
      const b = u(m);
      if (Math.abs(b - p) < 1e-7)
        return m;
      p > b ? y = m : w = m, m = (y + w) / 2;
    }
    return m;
  };
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const m = g(p);
    return d(m);
  };
}
function qs(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function Ih(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (i) => i <= 0 ? 0 : i >= 1 ? 1 : n * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / e) + 1;
}
const Hh = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    const i = t - 0.5454545454545454;
    return 7.5625 * i * i + 0.75;
  }
  if (t < 2.5 / 2.75) {
    const i = t - 0.8181818181818182;
    return 7.5625 * i * i + 0.9375;
  }
  const s = t - 2.625 / 2.75;
  return 7.5625 * s * s + 0.984375;
};
function Ch(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function Rh(t, e = "end") {
  const n = Math.max(1, Math.floor(t));
  return (s) => {
    if (s >= 1) return 1;
    if (s <= 0) return e === "start" || e === "both" ? e === "start" ? 1 / n : 1 / (n + 1) : 0;
    const i = Math.floor(s * n);
    switch (e) {
      case "start":
        return Math.min(1, (i + 1) / n);
      case "both":
        return (i + 1) / (n + 1);
      case "none":
        return n === 1 ? 0 : Math.min(1, i / (n - 1));
      default:
        return i / n;
    }
  };
}
function Lh(t) {
  switch (t.type) {
    case "steps":
      return Rh(t.count, t.position);
    case "elastic":
      return qs(Ih(t.amplitude, t.period), t.mode);
    case "bounce":
      return qs(Hh, t.mode);
    case "back":
      return qs(Ch(t.overshoot), t.mode);
  }
}
function $t(t) {
  return t === void 0 ? Ai : mh(t) ? Oh(t.points) : ss(t) ? Lh(t) : _h[t] ?? Ai;
}
const Qo = 32, Fh = 256, De = /* @__PURE__ */ new Map(), Dh = /[MmLlHhVvCcSsQqTtAaZz]/, Nh = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Wh = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0
};
function jh(t) {
  const e = [];
  let n = 0, s = null;
  const i = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (i(), !(n >= t.length)); ) {
    const o = t[n];
    if (Dh.test(o)) {
      s = { type: o, args: [] }, e.push(s), n++;
      continue;
    }
    if (!s) break;
    const r = s.type === "A" || s.type === "a", a = s.args.length % 7;
    if (r && (a === 3 || a === 4)) {
      if (o !== "0" && o !== "1") break;
      s.args.push(o === "1" ? 1 : 0), n++;
      continue;
    }
    const l = Nh.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function Bh(t, e, n, s, i, o, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = i * Math.PI / 180, d = Math.cos(u), f = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = d * g + f * p, y = -f * g + d * p, w = m * m / (c * c) + y * y / (h * h);
  if (w > 1) {
    const G = Math.sqrt(w);
    c *= G, h *= G;
  }
  const b = o === r ? -1 : 1, v = c * c * h * h - c * c * y * y - h * h * m * m, M = c * c * y * y + h * h * m * m, x = b * Math.sqrt(Math.max(0, v / M)), T = x * c * y / h, A = -x * h * m / c, k = d * T - f * A + (t + a) / 2, O = f * T + d * A + (e + l) / 2, $ = (G, E, H, S) => {
    const I = G * H + E * S, F = Math.sqrt((G * G + E * E) * (H * H + S * S)), B = Math.acos(Math.max(-1, Math.min(1, I / F)));
    return G * S - E * H < 0 ? -B : B;
  }, P = $(1, 0, (m - T) / c, (y - A) / h);
  let L = $((m - T) / c, (y - A) / h, (-m - T) / c, (-y - A) / h);
  !r && L > 0 && (L -= 2 * Math.PI), r && L < 0 && (L += 2 * Math.PI);
  const _ = Math.max(1, Math.ceil(Math.abs(L) / (Math.PI / 2))), R = L / _, D = 4 / 3 * Math.tan(R / 4), Y = (G) => {
    const E = c * Math.cos(G), H = h * Math.sin(G);
    return [d * E - f * H + k, f * E + d * H + O];
  }, j = (G) => {
    const E = -c * Math.sin(G), H = h * Math.cos(G);
    return [d * E - f * H, f * E + d * H];
  }, U = [];
  for (let G = 0; G < _; G++) {
    const E = P + G * R, H = E + R, [S, I] = Y(E), [F, B] = G === _ - 1 ? [a, l] : Y(H), [nt, q] = j(E), [Q, C] = j(H);
    U.push([S + D * nt, I + D * q, F - D * Q, B - D * C, F, B]);
  }
  return U;
}
function oe(t, e, n, s, i) {
  const o = 1 - i;
  return o * o * o * t + 3 * o * o * i * e + 3 * o * i * i * n + i * i * i * s;
}
function tr(t, e, n, s, i) {
  const o = 1 - i;
  return 3 * o * o * (e - t) + 6 * o * i * (n - e) + 3 * i * i * (s - n);
}
function en(t, e, n, s) {
  return {
    subpath: 0,
    type: "L",
    points: [n, s],
    startX: t,
    startY: e,
    endX: n,
    endY: s,
    length: Math.hypot(n - t, s - e)
  };
}
function Rn(t, e, n) {
  const [s, i, o, r, a, l] = n, c = [0];
  let h = t, u = e, d = 0;
  for (let f = 1; f <= Qo; f++) {
    const g = f / Qo, p = oe(t, s, o, a, g), m = oe(e, i, r, l, g);
    d += Math.hypot(p - h, m - u), c.push(d), h = p, u = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, i, o, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: d,
    lengths: c
  };
}
function Ue(t) {
  const e = De.get(t);
  if (e) return e;
  const n = [];
  let s = 0, i = 0, o = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of jh(t)) {
    const y = p.toUpperCase(), w = p !== y, b = Wh[y];
    if (y === "Z") {
      (s !== o || i !== r) && u(en(s, i, o, r)), c >= 0 && h.add(c), s = o, i = r, a = l = null;
      continue;
    }
    for (let v = 0; v + b <= m.length; v += b) {
      const M = m.slice(v, v + b), x = w ? s : 0, T = w ? i : 0;
      let A = null, k = null;
      switch (y) {
        case "M":
          v === 0 ? (s = M[0] + x, i = M[1] + T, o = s, r = i, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(en(s, i, M[0] + x, M[1] + T)), s = M[0] + x, i = M[1] + T);
          break;
        case "L":
          u(en(s, i, M[0] + x, M[1] + T)), s = M[0] + x, i = M[1] + T;
          break;
        case "H":
          u(en(s, i, M[0] + x, i)), s = M[0] + x;
          break;
        case "V":
          u(en(s, i, s, M[0] + T)), i = M[0] + T;
          break;
        case "C": {
          const O = [M[0] + x, M[1] + T, M[2] + x, M[3] + T, M[4] + x, M[5] + T];
          u(Rn(s, i, O)), A = [O[2], O[3]], s = O[4], i = O[5];
          break;
        }
        case "S": {
          const [O, $] = a ? [2 * s - a[0], 2 * i - a[1]] : [s, i], P = [O, $, M[0] + x, M[1] + T, M[2] + x, M[3] + T];
          u(Rn(s, i, P)), A = [P[2], P[3]], s = P[4], i = P[5];
          break;
        }
        case "Q":
        case "T": {
          let O = s, $ = i;
          y === "Q" ? (O = M[0] + x, $ = M[1] + T) : l && (O = 2 * s - l[0], $ = 2 * i - l[1]);
          const P = y === "Q" ? M[2] + x : M[0] + x, L = y === "Q" ? M[3] + T : M[1] + T;
          u(
            Rn(s, i, [
              s + 2 / 3 * (O - s),
              i + 2 / 3 * ($ - i),
              P + 2 / 3 * (O - P),
              L + 2 / 3 * ($ - L),
              P,
              L
            ])
          ), k = [O, $], s = P, i = L;
          break;
        }
        case "A": {
          const O = M[5] + x, $ = M[6] + T;
          let P = s, L = i;
          for (const _ of Bh(s, i, M[0], M[1], M[2], M[3], M[4], O, $))
            u(Rn(P, L, _)), P = _[4], L = _[5];
          s = O, i = $;
          break;
        }
      }
      a = A, l = k;
    }
  }
  const d = n.reduce((p, m) => p + m.length, 0), f = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let y = p, w = 0;
    for (; y < n.length && n[y].subpath === m; ) w += n[y++].length;
    const b = n[p], v = n[y - 1], M = h.has(m) || Math.abs(v.endX - b.startX) < 1e-9 && Math.abs(v.endY - b.startY) < 1e-9;
    f.push({ start: p, end: y, length: w, closed: M }), p = y;
  }
  const g = { segments: n, totalLength: d, subpaths: f };
  return De.size >= Fh && De.delete(De.keys().next().value), De.set(t, g), g;
}
function qh(t, e) {
  const n = t.lengths;
  if (e <= 0) return 0;
  if (e >= t.length) return 1;
  let s = 0, i = n.length - 1;
  for (; s < i - 1; ) {
    const a = s + i >> 1;
    n[a] < e ? s = a : i = a;
  }
  const o = n[i] - n[s], r = o > 0 ? (e - n[s]) / o : 0;
  return (s + r) / (n.length - 1);
}
function Yh(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, i, o, r, a] = t.points, l = qh(t, e);
  let c = tr(t.startX, n, i, r, l), h = tr(t.startY, s, o, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), d = oe(t.startX, n, i, r, u), f = oe(t.startY, s, o, a, u), g = oe(t.startX, n, i, r, l), p = oe(t.startY, s, o, a, l);
    c = l < 0.5 ? d - g : g - d, h = l < 0.5 ? f - p : p - f;
  }
  return {
    x: oe(t.startX, n, i, r, l),
    y: oe(t.startY, s, o, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function ul(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let i = 0;
  for (let o = n; o < s; o++) {
    const r = t[o];
    if (i + r.length >= e || o === s - 1)
      return Yh(r, e - i);
    i += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Kh(t, e) {
  const { segments: n, totalLength: s } = Ue(t);
  return ul(n, Math.max(0, Math.min(1, e)) * s);
}
function bb() {
  De.clear();
}
function wb(t) {
  return Ue(t).totalLength;
}
const zh = 24, Xh = 320, Uh = 2.5, nn = 72, kb = 64, Vh = 0.2, Gh = 128, fn = /* @__PURE__ */ new Map();
let Gn = 0, ie;
const er = (t) => Math.round(t * 100) / 100;
function nr(t, e) {
  const { segments: n, subpaths: s, totalLength: i } = Ue(t);
  if (n.length === 0) return [];
  if (e) {
    const o = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: i, closed: o }];
  }
  return s.filter((o) => o.length > 0).map((o) => ({ segments: n, start: o.start, end: o.end, length: o.length, closed: o.closed }));
}
function $i(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = ul(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function sr(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function ir(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push($i(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function or(t) {
  let e = 0, n = 0;
  for (const [s, i] of t)
    e += s, n += i;
  return e /= t.length, n /= t.length, t.map(([s, i]) => [s - e, i - n]);
}
function Jh(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % nn / nn : 0, reversed: n < 0 };
  const i = or(ir(t, nn)), o = or(ir(e, nn)), r = nn;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let u = 0; u < h; u++) {
      let d = 0;
      for (let f = 0; f < r && d < l; f++) {
        const g = s ? c ? (u - f + r) % r : (f + u) % r : c ? r - 1 - f : f, p = i[f][0] - o[g][0], m = i[f][1] - o[g][1];
        d += p * p + m * m;
      }
      d < l && (l = d, a = { offset: s ? u / r : 0, reversed: c });
    }
  }
  return a;
}
function Zh(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Qh(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function tu(t, e, n) {
  const s = t.closed && e.closed, i = Jh(t, e, n.shapeIndex), o = Math.max(
    zh,
    Math.min(Xh, Math.ceil(Math.max(t.length, e.length) / Uh))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= o; u++) a(u / o);
  for (const u of sr(t)) a(u);
  for (const u of sr(e)) a(Qh(u, i, s));
  let l = [...r].sort((u, d) => u - d);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...$i(t, u)), h.push(...$i(e, Zh(u, i, s)));
  return eu({ from: c, to: h, closed: s });
}
function eu(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = Vh;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(rr(t.from, r, a, h), rr(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const i = [], o = [];
  for (let r = 0; r < e; r++)
    n[r] && (i.push(t.from[r * 2], t.from[r * 2 + 1]), o.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: i, to: o, closed: t.closed };
}
function rr(t, e, n, s) {
  const i = t[e * 2], o = t[e * 2 + 1], r = t[n * 2] - i, a = t[n * 2 + 1] - o, l = t[s * 2] - i, c = t[s * 2 + 1] - o, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function nu(t, e, n) {
  const s = n.shapeIndex;
  if (ie && ie.from === t && ie.to === e && ie.shapeIndex === s) return ie.plan;
  const o = fn.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (o)
    return ie = { from: t, to: e, shapeIndex: s, plan: o }, o;
  const r = Ue(t).subpaths.filter((f) => f.length > 0).length === Ue(e).subpaths.filter((f) => f.length > 0).length, a = nr(t, !r), l = nr(e, !r), c = {
    pairs: a.map((f, g) => tu(f, l[g], n))
  };
  Gn >= Gh && (fn.clear(), Gn = 0);
  const h = String(s ?? "auto"), u = fn.get(h) ?? /* @__PURE__ */ new Map();
  fn.set(h, u);
  const d = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, d), d.set(e, c), Gn++, ie = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function su(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const i = Math.max(0, Math.min(1, n));
  if (i === 0) return t;
  if (i === 1) return e;
  const o = nu(t, e, s);
  if (o.pairs.length === 0) return i < 0.5 ? t : e;
  let r = "";
  for (const a of o.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = er(a.from[l] + (a.to[l] - a.from[l]) * i), h = er(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * i);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function vb() {
  fn.clear(), Gn = 0, ie = void 0;
}
function _n(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const Ne = Math.PI / 180, iu = 0.9995;
function co() {
  return [0, 0, 0, 1];
}
function Dt(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return co();
  const s = e * Ne / 2, i = Math.sin(s) / n;
  return [t[0] * i, t[1] * i, t[2] * i, Math.cos(s)];
}
function ou(t, e, n) {
  return Pi(Pi(Dt([0, 1, 0], e), Dt([1, 0, 0], t)), Dt([0, 0, 1], n));
}
function ru(t) {
  const [e, n, s, i] = le(t), o = 2 * (e * s + n * i), r = 2 * (e * n + s * i), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * i), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * i), u = 1 - 2 * (e * e + n * n), d = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [d / Ne, Math.atan2(o, u) / Ne, Math.atan2(r, a) / Ne] : [d / Ne, Math.atan2(-h, c) / Ne, 0];
}
function Pi(t, e) {
  const [n, s, i, o] = t, [r, a, l, c] = e;
  return [
    o * r + n * c + s * l - i * a,
    o * a - n * l + s * c + i * r,
    o * l + n * a - s * r + i * c,
    o * c - n * r - s * a - i * l
  ];
}
function dl(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function fl(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function le(t) {
  const e = fl(t);
  return e === 0 ? co() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function au(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function pl(t, e, n) {
  const s = le(t);
  let i = le(e), o = dl(s, i);
  if (o < 0 && (i = [-i[0], -i[1], -i[2], -i[3]], o = -o), o > iu)
    return le([
      s[0] + (i[0] - s[0]) * n,
      s[1] + (i[1] - s[1]) * n,
      s[2] + (i[2] - s[2]) * n,
      s[3] + (i[3] - s[3]) * n
    ]);
  const r = Math.acos(o), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return le([
    s[0] * l + i[0] * c,
    s[1] * l + i[1] * c,
    s[2] * l + i[2] * c,
    s[3] * l + i[3] * c
  ]);
}
function lu(t, e) {
  const [n, s, i, o] = le(t), r = 2 * (s * e[2] - i * e[1]), a = 2 * (i * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + o * r + (s * l - i * a), e[1] + o * a + (i * r - n * l), e[2] + o * l + (n * a - s * r)];
}
const Mb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: au,
  dot: dl,
  fromAxisAngle: Dt,
  fromEuler: ou,
  identity: co,
  length: fl,
  multiply: Pi,
  normalize: le,
  rotateVec3: lu,
  slerp: pl,
  toEuler: ru
}, Symbol.toStringTag, { value: "Module" })), te = (t, e, n) => t + (e - t) * n, gl = 512, Ys = /* @__PURE__ */ new Map(), Ks = /* @__PURE__ */ new Map();
function ar(t) {
  const e = Ys.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return Ys.size < gl && Ys.set(t, s), s;
}
const lr = (t) => t.charCodeAt(0) === 35, cr = (t) => t.startsWith("rgb"), hr = (t) => t.startsWith("rgba"), cu = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, zs = (t) => Math.round(t).toString(16).padStart(2, "0");
function hu(t, e, n) {
  return `#${zs(t)}${zs(e)}${zs(n)}`;
}
function ur(t) {
  const e = Ks.get(t);
  if (e) return e;
  const n = t.match(cu);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), i = parseInt(n[2], 10), o = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, i, o, parseFloat(n[4])] : [s, i, o];
  return Ks.size < gl && Ks.set(t, r), r;
}
const uu = (t, e, n) => {
  if (lr(t) && lr(e)) {
    const [s, i, o] = ar(t), [r, a, l] = ar(e), c = te(s, r, n), h = te(i, a, n), u = te(o, l, n);
    return hu(c, h, u);
  }
  if ((cr(t) || hr(t)) && (cr(e) || hr(e))) {
    const s = ur(t), i = ur(e), o = Math.round(te(s[0], i[0], n)), r = Math.round(te(s[1], i[1], n)), a = Math.round(te(s[2], i[2], n));
    if (s.length === 4 || i.length === 4) {
      const l = s[3] ?? 1, c = i[3] ?? 1, h = te(l, c, n);
      return `rgba(${o}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${o}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, du = (t, e, n) => {
  const s = Math.min(t.length, e.length), i = [];
  for (let o = 0; o < s; o++)
    i.push(te(t[o], e[o], n));
  return i;
}, fu = (t, e, n) => pl(t, e, n), dr = (t, e, n) => n < 1 ? t : e, pu = (t, e, n) => su(t, e, n);
function os(t, e) {
  return e === "slerp" ? fu : typeof t == "number" ? te : Array.isArray(t) ? du : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? uu : _n(t) ? pu : dr : dr;
}
const ml = 1e3 / 60;
function yl(t, e = {}) {
  if (!$e(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new xs(t.spring);
  return wl(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function bl(t, e = {}) {
  if (!Ae(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return wl(
    t,
    (s) => Ei(n, s),
    Pn(n),
    n.from,
    $n(n),
    e
  );
}
function wl(t, e, n, s, i, o) {
  const r = o.intervalMs ?? ml, a = o.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: i, easing: "linear" }) : h.value = i, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? mu(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function kl(t, e, n, s = {}) {
  const i = s.intervalMs ?? ml, o = typeof n == "function" ? n : $t(n), r = os(t.value, s.interpolation), a = e.time - t.time;
  if (a <= 0) return [e];
  const l = [];
  for (let h = i; h < a; h += i) {
    const u = h / a;
    l.push({
      time: t.time + h,
      value: r(t.value, e.value, o(u)),
      easing: "linear"
    });
  }
  const c = o(1);
  return l.push({ ...e, ...c !== 1 && { value: r(t.value, e.value, c) }, easing: "linear" }), l;
}
function Sb(t, e) {
  return $e(t) ? yl(t, e) : Ae(t) ? bl(t, e) : t;
}
function gu(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((o) => ss(o.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], i = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let o = 1; o < n.length; o++) {
    const r = n[o];
    ss(r.easing) ? s.push(...kl(n[o - 1], r, r.easing, i)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function Tb(t, e) {
  return t.filter(yh).map((n) => gu(n, e)).concat(
    t.filter($e).map((n) => yl(n, e)),
    t.filter(Ae).map((n) => bl(n, e))
  );
}
function mu(t, e) {
  if (t.length <= 2) return t;
  const n = [t[0]];
  for (let s = 1; s < t.length - 1; s++) {
    const i = n[n.length - 1], o = t[s], r = t[s + 1], a = r.time - i.time;
    if (a <= 0) continue;
    const l = (o.time - i.time) / a, c = i.value + (r.value - i.value) * l;
    Math.abs(o.value - c) > e && n.push(o);
  }
  return n.push(t[t.length - 1]), n;
}
function _i(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function ye(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function Ve(t, e, n, s) {
  const i = n ?? 0;
  return !s || e <= 1 ? i : i + lo(t, e, s);
}
class Xs {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = ye(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - Ve(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Ve(i, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - o);
      r !== void 0 && s.push({ target: this.targets[i], value: r, start: o + this.track.keyframes[0].time });
    }
    return s;
  }
  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration() {
    const { keyframes: e } = this.track;
    if (e.length === 0)
      return 0;
    const n = e[e.length - 1].time, s = this.track.stagger ? Ts(this.targets.length, this.track.stagger) : 0;
    return n + (this.track.delay ?? 0) + s + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(e) {
    const { keyframes: n } = this.track;
    if (n.length === 0)
      return;
    if (n.length === 1 || e <= n[0].time)
      return n[0].value;
    if (e >= n[n.length - 1].time)
      return n[n.length - 1].value;
    const { from: s, to: i } = this.findSurroundingKeyframes(e);
    if (!s || !i)
      return;
    if (s.time === e)
      return s.value;
    const o = i.time - s.time, r = (e - s.time) / o, l = $t(i.easing)(r);
    return os(s.value, this.track.interpolation)(s.value, i.value, l);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(e) {
    const { keyframes: n } = this.track;
    for (let s = 0; s < n.length - 1; s++)
      if (e >= n[s].time && e <= n[s + 1].time)
        return { from: n[s], to: n[s + 1] };
    return { from: null, to: null };
  }
}
class yu {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = ye(e), this.sampler = new xs(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - Ve(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Ve(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: this.sampler.valueAt(e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Ts(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class bu {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = ye(e), this.duration = Pn(e.inertia);
  }
  getValueAtTime(e) {
    return Ei(this.track.inertia, e - Ve(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Ve(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: Ei(this.track.inertia, e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Ts(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function vl(t, e) {
  const n = { ...Kh(t.pathData, e) };
  if (t.matrix) {
    const [s, i, o, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + o * h + a, n.y = i * c + r * h + l;
    const u = n.angle * Math.PI / 180, d = Math.cos(u), f = Math.sin(u);
    n.angle = Math.atan2(i * d + r * f, s * d + o * f) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function xb(t, e, n, s) {
  const i = e + (n - e) * s;
  return vl(t, i);
}
const Us = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, wu = 20;
function ku(t) {
  const e = Us[t ?? "upperCase"] ?? t ?? Us.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(Us.upperCase);
}
function vu(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Mu(t, e, n = 0) {
  const s = t.from ?? "", i = t.to, o = Math.max(0, Math.min(1, e));
  if (o <= 0) return s;
  if (o >= 1) return i;
  const r = Array.from(s), a = Array.from(i), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const w = Math.round(o * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - w)).join("") + a.slice(Math.max(0, a.length - w)).join("") : a.slice(0, w).join("") + r.slice(w).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (o - c) / (1 - c)), u = Math.floor(h * a.length), d = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * o), f = ku(t.chars), g = t.refreshRate ?? wu, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let y = "";
  for (let w = 0; w < d; w++) {
    const b = l ? w >= d - u : w < u, v = l ? a[a.length - (d - w)] : a[w];
    b && v !== void 0 || v === " " || v === `
` ? y += v : y += f[vu(m, w, p) % f.length];
  }
  return y;
}
class Kt {
  id;
  name;
  _captions;
  _tracks = [];
  _trackPlayers = /* @__PURE__ */ new Map();
  _motionPathTracks = /* @__PURE__ */ new Map();
  _springTracks = /* @__PURE__ */ new Map();
  _textTracks = /* @__PURE__ */ new Map();
  _config;
  _currentTime = 0;
  _playbackState = "idle";
  _direction = "forward";
  _loopIteration = 0;
  _explicitDuration;
  /** Milliseconds still to wait at a loop boundary before the next iteration */
  _repeatDelayRemaining = 0;
  /**
   * A forward loop reached its end with a repeat delay armed: the playhead
   * holds on the last frame for the delay, then returns to the start.
   */
  _wrapAfterDelay = !1;
  onUpdate = null;
  onComplete = null;
  constructor(e) {
    if (this.id = e.id, this.name = e.name, this._captions = e.captions, this._config = e.config ?? {}, this._explicitDuration = e.config?.duration, e.tracks)
      for (const n of e.tracks)
        this.addTrack(n);
  }
  get tracks() {
    return [...this._tracks];
  }
  get duration() {
    return this._explicitDuration !== void 0 ? this._explicitDuration : this._calculateDuration();
  }
  /**
   * Set an explicit timeline duration (ms). Pass `undefined` to fall back to the
   * duration calculated from the last keyframe across all tracks.
   */
  setDuration(e) {
    if (this._explicitDuration = e, e !== void 0)
      this._config = { ...this._config, duration: e };
    else if (this._config.duration !== void 0) {
      const n = { ...this._config };
      delete n.duration, this._config = n;
    }
  }
  get currentTime() {
    return this._currentTime;
  }
  get playbackState() {
    return this._playbackState;
  }
  get direction() {
    return this._direction;
  }
  get loopIteration() {
    return this._loopIteration;
  }
  /** Milliseconds of `repeatDelay` still to wait at a loop boundary (0 when not waiting). */
  get repeatDelayRemaining() {
    return this._repeatDelayRemaining;
  }
  get speed() {
    return this._config.speed ?? 1;
  }
  set speed(e) {
    this._config.speed = e;
  }
  /** Drawings per second (0: every frame); see `TimelineConfig.drawingRate`. */
  get drawingRate() {
    return this._config.drawingRate ?? 0;
  }
  set drawingRate(e) {
    const n = { ...this._config };
    e > 0 ? n.drawingRate = e : delete n.drawingRate, this._config = n;
  }
  /**
   * Start or resume playback.
   * If at the end and direction is forward, reset to beginning.
   * If at the beginning and direction is reverse, reset to end.
   */
  play() {
    const e = this.duration;
    this._direction === "forward" && this._currentTime >= e && e > 0 ? (this._currentTime = 0, this._loopIteration = 0) : this._direction === "reverse" && this._currentTime <= 0 && e > 0 && (this._currentTime = e, this._loopIteration = 0), this._playbackState = "playing";
  }
  /**
   * Pause playback at current position.
   */
  pause() {
    this._playbackState = "paused";
  }
  /**
   * Stop playback and reset to beginning.
   */
  stop() {
    this._playbackState = "idle", this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1, this._currentTime = 0, this._loopIteration = 0, this._direction = "forward";
  }
  /**
   * Seek to a specific time.
   */
  seek(e) {
    const n = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(e, n)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
  }
  /**
   * Toggle or set playback direction.
   */
  reverse() {
    this._direction = this._direction === "forward" ? "reverse" : "forward";
  }
  /**
   * Advance the timeline by delta milliseconds.
   * Call this from your animation loop or clock.
   */
  tick(e) {
    if (this._playbackState !== "playing")
      return;
    const n = this.duration;
    if (n <= 0)
      return;
    let i = e * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const a = Math.min(this._repeatDelayRemaining, i);
      if (this._repeatDelayRemaining -= a, i -= a, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const o = 1e3;
    for (let a = 0; a < o && i > 0 && this._playbackState === "playing"; a++)
      if (this._direction === "forward") {
        const l = n - this._currentTime;
        if (i >= l) {
          if (i -= l, this._currentTime = n, !this._handleEndReached())
            break;
        } else
          this._currentTime += i, i = 0;
      } else {
        const l = this._currentTime;
        if (i >= l) {
          if (i -= l, this._currentTime = 0, !this._handleStartReached())
            break;
        } else
          this._currentTime -= i, i = 0;
      }
    const r = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(r);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(e) {
    const n = /* @__PURE__ */ new Map();
    if (e = bh(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
      this._resolveShared(e, n);
    else
      for (const [s, i] of this._trackPlayers) {
        const o = i.getTrack().property;
        for (const { target: r, value: a, start: l } of i.getTargetValues(e))
          this._write(n, s, r, o, a, e - l);
      }
    return {
      values: n,
      currentTime: this._currentTime,
      playbackState: this._playbackState,
      direction: this._direction,
      loopIteration: this._loopIteration
    };
  }
  /**
   * Several tracks drive the same target+property. Which one applies at `time`:
   *
   * 1. Of the tracks that have started (their first keyframe, plus delay and
   *    stagger, is at or before `time`), the one that started LAST.
   * 2. If none has started yet, the one that starts FIRST — so the value before
   *    anything plays is the first animation's starting value.
   * 3. Ties on start time go to the track added LAST.
   *
   * This is what makes a sequence of tweens on one property play as a sequence:
   * a later tween holds its starting value, but does not apply it until its
   * turn. `findConflicts()` reports overlaps by the same rule.
   */
  _resolveShared(e, n) {
    const s = /* @__PURE__ */ new Map();
    for (const [i, o] of this._trackPlayers) {
      const r = o.getTrack().property;
      for (const { target: a, value: l, start: c } of o.getTargetValues(e)) {
        const h = `${a}\0${r}`, u = c <= e, d = s.get(h);
        (!d || (u !== d.started ? u : u ? c >= d.start : c <= d.start)) && s.set(h, { trackId: i, target: a, property: r, value: l, start: c, started: u });
      }
    }
    for (const { trackId: i, target: o, property: r, value: a, start: l } of s.values())
      this._write(n, i, o, r, a, e - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(e, n, s, i, o, r) {
    if (o === void 0) return;
    let a = e.get(s);
    a || (a = /* @__PURE__ */ new Map(), e.set(s, a));
    const l = this._textTracks.get(n);
    if (l && typeof o == "number") {
      a.set("text", Mu(l.textConfig, o, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof o == "number") {
      const h = vl(c.motionPathConfig, o);
      a.set("motionPathX", h.x), a.set("motionPathY", h.y), c.motionPathConfig.autoRotate && a.set("motionPathRotate", h.angle);
    } else
      a.set(i, o);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const e = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const s of ye(n)) {
          const i = `${s}\0${n.property}`;
          if (e.has(i)) {
            this._sharedWrites = !0;
            break t;
          }
          e.add(i);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(e) {
    if (this._tracks.push(e), this._sharedWrites = null, Ae(e)) {
      this._trackPlayers.set(e.id, new bu(e));
      return;
    }
    if ($e(e)) {
      this._trackPlayers.set(e.id, new yu(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (ao(e))
      this._trackPlayers.set(e.id, new Xs(e)), this._textTracks.set(e.id, e);
    else if (ol(e)) {
      const n = {
        id: e.id,
        target: e.target,
        property: e.property,
        keyframes: e.keyframes,
        delay: e.delay,
        endDelay: e.endDelay,
        targets: e.targets,
        stagger: e.stagger
      };
      this._trackPlayers.set(e.id, new Xs(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new Xs(e));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(e, n) {
    const s = this._tracks.findIndex((o) => o.id === e);
    if (s < 0) return;
    const i = this._tracks.slice(s + 1);
    this.removeTrack(e);
    for (const o of i) this.removeTrack(o.id);
    this.addTrack(n);
    for (const o of i) this.addTrack(o);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(e) {
    this._tracks = this._tracks.filter((n) => n.id !== e), this._sharedWrites = null, this._trackPlayers.delete(e), this._motionPathTracks.delete(e), this._springTracks.delete(e), this._textTracks.delete(e);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(e = {}) {
    return this._tracks.filter((n) => this._matches(n, e));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(e = {}) {
    const n = this.getTracks(e).map((s) => s.id);
    for (const s of n)
      this.removeTrack(s);
    return n;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(e) {
    const n = this._trackPlayers.get(e);
    if (!n) return;
    const s = n.getTrack(), i = s.delay ?? 0;
    if ($e(s) || Ae(s))
      return { from: i, to: n.getDuration() };
    const o = s.keyframes;
    if (!(!o || o.length === 0))
      return { from: o[0].time + i, to: n.getDuration() };
  }
  /**
   * Overlapping writes to the same target+property.
   *
   * Where two spans overlap, the track that starts later wins from the moment it
   * starts (ties: the one added later) — see `_resolveShared`. That is
   * predictable but silent, so an authoring tool should call this and warn,
   * because a silently discarded stretch of a track looks like a bug.
   */
  findConflicts() {
    const e = [];
    for (let n = 0; n < this._tracks.length; n++) {
      const s = this._tracks[n], i = this.getTrackSpan(s.id);
      if (i)
        for (let o = 0; o < n; o++) {
          const r = this._tracks[o];
          if (r.property !== s.property) continue;
          const a = ye(r).filter((u) => ye(s).includes(u));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(r.id);
          if (!l || !(l.from <= i.to && i.from <= l.to)) continue;
          const h = i.from >= l.from;
          for (const u of a)
            e.push({
              target: u,
              property: s.property,
              losingTrackId: h ? r.id : s.id,
              winningTrackId: h ? s.id : r.id
            });
        }
    }
    return e;
  }
  _matches(e, n) {
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !ye(e).includes(n.target)) return !1;
    if (n.timeRange) {
      const s = this.getTrackSpan(e.id);
      if (!s || s.to < n.timeRange.from || s.from > n.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      formatVersion: il(this._tracks),
      id: this.id,
      name: this.name,
      config: { ...this._config },
      tracks: [...this._tracks],
      ...this.captions && { captions: this.captions }
    };
  }
  /** The playback configuration, as loaded (read-only). */
  get config() {
    return this._config;
  }
  /** The timeline's markers, in time order (empty when it has none). */
  get markers() {
    return [...this._config.markers ?? []].sort((e, n) => e.time - n.time);
  }
  /** Replace the markers (kept in time order); an empty list removes them. */
  setMarkers(e) {
    const n = e && e.length > 0 ? [...e].sort((i, o) => i.time - o.time).map((i) => ({ ...i })) : void 0, s = { ...this._config };
    n ? s.markers = n : delete s.markers, this._config = s;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(e) {
    const n = {};
    for (const [s, i] of Object.entries(e ?? {})) n[s] = { ...i };
    this._captions = Object.keys(n).length > 0 ? n : void 0;
  }
  /** Start the between-iterations pause, if the timeline configures one. */
  _armRepeatDelay() {
    this._repeatDelayRemaining = this._config.repeatDelay ?? 0;
  }
  _calculateDuration() {
    let e = 0;
    for (const [, n] of this._trackPlayers)
      e = Math.max(e, n.getDuration());
    return e;
  }
  /**
   * Handle reaching the end of the timeline.
   * Returns true if we looped and should continue, false if we stopped.
   */
  _handleEndReached() {
    const e = this._config.loop ?? 0;
    return e === -1 || this._loopIteration < e ? (this._loopIteration++, this._armRepeatDelay(), this._config.alternate ? this._direction = "reverse" : this._repeatDelayRemaining > 0 ? this._wrapAfterDelay = !0 : this._currentTime = 0, this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
  }
  /**
   * Handle reaching the start of the timeline (in reverse).
   * Returns true if we looped and should continue, false if we stopped.
   */
  _handleStartReached() {
    const e = this._config.loop ?? 0;
    return this._config.alternate && (e === -1 || this._loopIteration < e) ? (this._loopIteration++, this._armRepeatDelay(), this._direction = "forward", this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
  }
}
const Su = 100;
function Ml(t, e, n, s) {
  const i = [], o = [], { duration: r, alternate: a } = s, l = (f, g, p, m) => {
    o.push([f, g]);
    const y = [];
    t.forEach((w, b) => {
      (p === "forward" ? (m ? w >= f : w > f) && w <= g : (m ? w <= f : w < f) && w >= g) && y.push(b);
    }), y.sort((w, b) => (p === "forward" ? t[w] - t[b] : t[b] - t[w]) || w - b);
    for (const w of y) i.push({ kind: "event", index: w, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const d = Math.min(Su, Math.max(0, n.iteration - e.iteration));
  for (let f = 0; f < d; f++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), i.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return d > 0 && s.holding && !a ? { crossings: i, passes: o } : (l(c, n.time, h, u), { crossings: i, passes: o });
}
function Tu(t) {
  return Ae(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: Sl(t.inertia),
    ...Ut(t)
  } : $e(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...Ut(t)
  } : ao(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(Vs),
    ...Ut(t)
  } : ol(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(Vs),
    ...Ut(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(Vs),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Ut(t)
  };
}
function Sl(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function Vs(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function Ut(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function xu(t) {
  if (Ae(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: Sl(e.inertia),
      ...Ut(e)
    };
  }
  if ($e(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...Ut(e)
    };
  }
  if (ao(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...Ut(e)
    };
  }
  if (t.property === "motionPath" && "motionPathConfig" in t) {
    const e = t, n = [...e.keyframes].sort((s, i) => s.time - i.time);
    return {
      id: e.id,
      target: e.target,
      property: "motionPath",
      motionPathConfig: { ...e.motionPathConfig },
      keyframes: n,
      ...Ut(e)
    };
  }
  return _i({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Ut(t)
  });
}
function Eu(t) {
  const e = t._config.markers;
  return {
    formatVersion: il(t.tracks),
    id: t.id,
    name: t.name,
    config: {
      duration: t.duration > 0 ? t.duration : void 0,
      loop: t._config.loop,
      speed: t._config.speed,
      alternate: t._config.alternate,
      repeatDelay: t._config.repeatDelay,
      ...t._config.drawingRate ? { drawingRate: t._config.drawingRate } : {},
      ...e && { markers: e.map((n) => ({ ...n })) }
    },
    tracks: t.tracks.map(Tu),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function kn(t) {
  const e = t.formatVersion ?? 1;
  if (e > Jo)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${Jo}. Update tinyfly to play it.`
    );
  return new Kt({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(xu),
    captions: t.captions
  });
}
function Eb(t) {
  return JSON.stringify(Eu(t));
}
function Ab(t) {
  const e = JSON.parse(t);
  return kn(e);
}
function Vt(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function On(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function Tl(t, e, n) {
  return e + t.next() * (n - e);
}
function Au(t, e, n, s) {
  if (s <= 0) return Tl(t, e, n);
  const i = Math.floor((n - e) / s), o = Math.round(t.next() * i);
  return e + o * s;
}
function $b(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const xl = /^([+\-*/])=\s*(-?[\d.]+)$/, El = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Pb(t) {
  return typeof t != "string" ? !1 : xl.test(t.trim()) || El.test(t.trim());
}
function Al(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = xl.exec(n);
  if (s) {
    const [, o, r] = s, a = e.base ?? 0, l = Number.parseFloat(r);
    switch (o) {
      case "+":
        return a + l;
      case "-":
        return a - l;
      case "*":
        return a * l;
      case "/":
        return l === 0 ? a : a / l;
    }
  }
  const i = El.exec(n);
  if (i) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const o = Number.parseFloat(i[1]), r = Number.parseFloat(i[2]), a = i[3] !== void 0 ? Number.parseFloat(i[3]) : void 0;
    return a !== void 0 ? Au(e.random, o, r, a) : Tl(e.random, o, r);
  }
  return t;
}
function $u(t, e = 0, n) {
  const s = [];
  let i = e;
  for (const o of t) {
    const r = Al(o, { base: i, random: n });
    s.push(r), typeof r == "number" && (i = r);
  }
  return s;
}
class _b {
  random;
  constructor(e) {
    this.random = On(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return Al(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return $u(e, n, this.random);
  }
}
const Pu = 600;
function _u(t) {
  if (Array.isArray(t)) {
    const [d, f, g, p] = t;
    return { fn: fr(d, f, g, p), bezier: [d, f, g, p] };
  }
  const { segments: e } = Ue(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, i = e[e.length - 1], o = i.endX - n, r = i.endY - s;
  if (o === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (d) => (d - n) / o, l = (d) => (d - s) / r;
  if (e.length === 1 && i.type === "C") {
    const [d, f, g, p] = i.points, m = [a(d), l(f), a(g), l(p)];
    return { fn: fr(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(Pu / e.length));
  for (const d of e)
    for (let f = c.length === 0 ? 0 : 1; f <= u; f++) {
      const [g, p] = Hu(d, f / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: Cu(c, h) };
}
function Ou(t = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, t.strength ?? 0.7)) * 0.7, s = [1];
  for (let o = n; o > 2e-3; o *= n) s.push(2 * Math.sqrt(o));
  const i = s.reduce((o, r) => o + r, 0);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let r = o * i;
    for (let a = 0; a < s.length; a++) {
      if (r <= s[a]) {
        if (a === 0) return (r / s[0]) ** 2;
        const l = s[a] / 2, c = l * l, h = r - l;
        return 1 - (c - h * h);
      }
      r -= s[a];
    }
    return 1;
  };
}
function Iu(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (i) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * i) : (1 - i) ** 2;
  return (i) => i <= 0 || i >= 1 ? 0 : Math.sin(i * e * Math.PI * 2) * s(i);
}
function Hu(t, e) {
  if (t.type === "L") {
    const [c, h] = t.points;
    return [t.startX + (c - t.startX) * e, t.startY + (h - t.startY) * e];
  }
  const [n, s, i, o, r, a] = t.points, l = 1 - e;
  return [
    l * l * l * t.startX + 3 * l * l * e * n + 3 * l * e * e * i + e * e * e * r,
    l * l * l * t.startY + 3 * l * l * e * s + 3 * l * e * e * o + e * e * e * a
  ];
}
function Cu(t, e) {
  return (n) => {
    if (n <= t[0]) return e[0];
    if (n >= t[t.length - 1]) return e[e.length - 1];
    let s = 0, i = t.length - 1;
    for (; i - s > 1; ) {
      const r = s + i >> 1;
      t[r] <= n ? s = r : i = r;
    }
    const o = t[i] - t[s];
    return o === 0 ? e[i] : e[s] + (n - t[s]) / o * (e[i] - e[s]);
  };
}
function fr(t, e, n, s) {
  const i = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, o = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const u = i(a, t, n) - r, d = o(a, t, n);
      if (Math.abs(u) < 1e-6) return i(a, e, s);
      if (Math.abs(d) < 1e-6) break;
      a -= u / d;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      i(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return i(a, e, s);
  };
}
const Ru = 350, Lu = 300, Fu = 550;
function Ob(t, e = {}) {
  const n = e.lead ?? Ru, s = e.gap ?? Lu, i = e.tail ?? Fu, o = [];
  let r = 0;
  return t.forEach((a, l) => {
    const c = [];
    let h = r + n;
    a.lines.forEach((d, f) => {
      if (!(d.duration >= 0))
        throw new Error(`narration: scene ${l} line ${f} has an invalid duration (${d.duration})`);
      f > 0 && (h += s), c.push({
        id: d.id ?? `s${l}-l${f}`,
        scene: l,
        line: f,
        start: h,
        end: h + d.duration,
        text: d.text
      }), h += d.duration;
    });
    const u = h + i + (a.tail ?? 0);
    o.push({ id: a.id ?? `s${l}`, start: r, duration: u - r, cues: c }), r = u;
  }), { duration: r, scenes: o, cues: o.flatMap((a) => a.cues) };
}
function Ib(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function Hb(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const $l = (t) => 6e4 / t.bpm;
function ho(t, e) {
  return t.offset + e * $l(t);
}
function uo(t, e) {
  return (e - t.offset) / $l(t);
}
function Cb(t, e) {
  return ho(t, Math.round(uo(t, e)));
}
function Rb(t, e) {
  return ho(t, Math.ceil(uo(t, e) - 1e-9));
}
function Lb(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), i = [];
  if (!(t.bpm > 0) || n < e) return i;
  for (let o = Math.ceil(uo(t, e) - 1e-9); ; o++) {
    const r = ho(t, o);
    if (r > n + 1e-9) break;
    i.push({ time: r, bar: (o % s + s) % s === 0, n: o });
  }
  return i;
}
const Ie = 100;
function Fb(t, e, n = {}) {
  const s = n.minBpm ?? 70, i = n.maxBpm ?? 180, o = Math.max(1, Math.round(e / Ie)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / o);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let k = 0; k < a; k++) {
    let O = 0;
    for (let $ = k * o; $ < (k + 1) * o; $++) O += t[$] * t[$];
    l[k] = Math.log(1e-6 + O / o);
  }
  const c = new Float64Array(a);
  for (let k = 1; k < a; k++) c[k] = Math.max(0, l[k] - l[k - 1]);
  const h = c.reduce((k, O) => k + O, 0) / a;
  for (let k = 0; k < a; k++) c[k] = Math.max(0, c[k] - h);
  const u = Math.max(1, Math.floor(60 * Ie / i)), d = Math.min(a - 1, Math.ceil(60 * Ie / s)), f = (k) => {
    let O = 0;
    for (let $ = k; $ < a; $++) O += c[$] * c[$ - k];
    return O / (a - k);
  };
  let g = 0;
  for (let k = 0; k < a; k++) g += c[k] * c[k];
  g /= a;
  let p = u, m = -1 / 0;
  for (let k = u; k <= d; k++) {
    const O = 60 * Ie / k, $ = Math.exp(-0.5 * (Math.log2(O / 120) / 0.9) ** 2), P = f(k) * $;
    P > m && (m = P, p = k);
  }
  const y = (k) => {
    const O = Math.floor(k);
    return O < 0 || O + 1 >= a ? 0 : c[O] + (c[O + 1] - c[O]) * (k - O);
  }, w = (k, O) => {
    let $ = 0;
    for (let P = O; P < a; P += k) $ += y(P);
    return $;
  };
  let b = p, v = 0, M = -1 / 0;
  for (let k = p - 0.6; k <= p + 0.6 + 1e-9; k += 0.02) {
    if (k < 1) continue;
    const O = Math.max(1, Math.round(k * 4));
    for (let $ = 0; $ < O; $++) {
      const P = $ / O * k, L = w(k, P);
      L > M && (M = L, v = P, b = k);
    }
  }
  const x = 60 * Ie / b, T = g > 0 ? Math.max(0, Math.min(1, f(p) / g)) : 0, A = (v + 0.5) * 1e3 / Ie;
  return { bpm: Math.round(x * 100) / 100, offset: Math.round(A % (6e4 / x)), confidence: T };
}
const Du = 600, Nu = 250, pr = 1;
function Db(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, i = {}, o = (u, d, f, g) => {
    const p = i[u] ??= [];
    for (; p.length > 0 && p[p.length - 1].time >= d; ) p.pop();
    p.push({ time: d, value: f, ...g ? { easing: g } : {} });
  }, r = (u) => {
    const d = u.rotate * Math.PI / 180, f = (u.focusX - s.x) * u.scale, g = (u.focusY - s.y) * u.scale;
    return {
      x: -(f * Math.cos(d) - g * Math.sin(d)),
      y: -(f * Math.sin(d) + g * Math.cos(d)),
      scale: u.scale,
      rotate: u.rotate
    };
  }, a = (u, d, f) => {
    const g = r(d);
    for (const p of ["x", "y", "scale", "rotate"]) o(p, u, g[p], f);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((u, d) => u.at - d.at), h = c.filter((u) => !("shake" in u));
  h.length > 0 && a(0, l);
  for (const u of h)
    if ("frame" in u) {
      const d = Math.max(pr, u.duration ?? Du);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + d, l, u.easing ?? (d > pr ? "ease-in-out" : void 0));
    } else {
      const { follow: d } = u, f = d.lag ?? Nu, g = new Kt({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: d.x }] }), p = (w) => g.getStateAtTime(w).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...d.x.map((w) => w.time).filter((w) => w > u.at && w < u.until), u.until];
      a(u.at, l);
      const y = (w) => ({
        focusX: p(w) + (d.lead ?? 0),
        focusY: d.y ?? l.focusY,
        scale: d.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const w of m) {
        const b = d.x.find((v) => v.time === w)?.easing;
        a(w + f, y(w), w === u.at ? "ease-in-out" : b);
      }
      l = y(u.until);
    }
  for (const u of c.filter((d) => "shake" in d)) {
    const d = u.shake.strength ?? 12, f = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = On(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) o(y, u.at, 0);
    for (let y = u.at + g; y < u.at + u.duration; y += g) {
      const w = 1 - (y - u.at) / u.duration;
      o("shakeX", y, m() * d * w), o("shakeY", y, m() * d * w), o("shakeRotate", y, m() * f * w);
    }
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) o(y, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(i).map(([u, d]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: d }));
}
function Wu(t, e) {
  const n = t.toLowerCase(), s = e.toLowerCase();
  let i = Array.from({ length: s.length + 1 }, (o, r) => r);
  for (let o = 1; o <= n.length; o++) {
    const r = [o];
    for (let a = 1; a <= s.length; a++)
      r[a] = Math.min(i[a] + 1, r[a - 1] + 1, i[a - 1] + (n[o - 1] === s[a - 1] ? 0 : 1));
    i = r;
  }
  return i[s.length];
}
function rs(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let i, o = 1 / 0;
  for (const r of e) {
    const a = Wu(t, r);
    a < o && (o = a, i = r);
  }
  return i !== void 0 && o <= Math.max(2, Math.floor(t.length / 3)) ? i : void 0;
}
function pt(t, e, n, s) {
  const i = typeof e == "string" ? s ?? rs(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${i ? `: did you mean "${i}"?` : "."} Known: ${n.join(", ")}`;
}
function ju(t, e) {
  const n = e.step ?? 33, s = e.stiffness ?? 120, i = e.damping ?? 9, o = e.mass ?? 1;
  let r = t(e.start), a = 0;
  const l = [{ time: e.start, value: r }];
  let c = e.start + n;
  for (let h = e.start + 1; h <= e.end; h++) {
    const d = s * (t(h) - r) - i * a;
    a += d / o * 1e-3, r += a * 1e-3, (h >= c || h === e.end) && (l.push({ time: h, value: r }), c += n);
  }
  return l;
}
const zt = (t) => Math.round(t * 1e3) / 1e3;
function Bu(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, i = t.length;
  let o = `M${zt(t[0].x)} ${zt(t[0].y)}`;
  if (i === 1) return o;
  const r = (l) => s ? t[(l % i + i) % i] : t[Math.max(0, Math.min(i - 1, l))], a = s ? i : i - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), d = r(l + 2);
    if (n === 0) {
      o += ` L${zt(u.x)} ${zt(u.y)}`;
      continue;
    }
    const f = n / 6, g = h.x + (u.x - c.x) * f, p = h.y + (u.y - c.y) * f, m = u.x - (d.x - h.x) * f, y = u.y - (d.y - h.y) * f;
    o += ` C${zt(g)} ${zt(p)} ${zt(m)} ${zt(y)} ${zt(u.x)} ${zt(u.y)}`;
  }
  return s ? `${o} Z` : o;
}
const St = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function qu(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function fo(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = St(e.cx), s = St(e.cy), i = t.tag.toLowerCase() === "circle" ? St(e.r) : St(e.rx), o = t.tag.toLowerCase() === "circle" ? St(e.r) : St(e.ry);
      return `M${n + i} ${s} A${i} ${o} 0 1 1 ${n - i} ${s} A${i} ${o} 0 1 1 ${n + i} ${s} Z`;
    }
    case "rect": {
      const n = St(e.x), s = St(e.y), i = St(e.width), o = St(e.height);
      let r = e.rx != null ? St(e.rx) : e.ry != null ? St(e.ry) : 0, a = e.ry != null ? St(e.ry) : r;
      return r = Math.min(r, i / 2), a = Math.min(a, o / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + i} V${s + o} H${n} Z` : `M${n + r} ${s} H${n + i - r} A${r} ${a} 0 0 1 ${n + i} ${s + a} V${s + o - a} A${r} ${a} 0 0 1 ${n + i - r} ${s + o} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + o - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${St(e.x1)} ${St(e.y1)} L${St(e.x2)} ${St(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = qu(e.points);
      if (n.length === 0) return null;
      const s = n.map((i, o) => `${o === 0 ? "M" : "L"}${i.x} ${i.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function Nb(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), i = Math.max(0, n.length), o = n.since !== void 0 ? Math.max(e - i, n.since) : e - i;
  if (o >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = o + (e - o) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: i > 0 ? (e - c) / i : 0 });
  }
  return a;
}
const Yu = 2.5;
function Ku(t) {
  const e = [], n = [], s = t.length, i = (o, r) => {
    for (let a = o + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[o].x) * r, c = (t[a].y - t[o].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let o = 0; o < s; o++) {
    const r = t[o], a = i(o, -1), l = i(o, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let u = c[0] + h[0], d = c[1] + h[1];
    const f = Math.hypot(u, d);
    f < 1e-9 ? (u = c[0], d = c[1]) : (u /= f, d /= f);
    const g = u * c[0] + d * c[1], p = Math.min(Yu, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - d * m, y: r.y + u * m }), n.push({ x: r.x + d * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function zu(t) {
  const e = t.length;
  if (e < 2) return null;
  const n = t[e - 1];
  for (let s = e - 2; s >= 0; s--) {
    const i = n.x - t[s].x, o = n.y - t[s].y, r = Math.hypot(i, o);
    if (r > 1e-9)
      return { x: n.x, y: n.y, radius: n.width / 2, start: Math.atan2(i / r, -o / r) };
  }
  return null;
}
function Jn(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function tn(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function qe(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function ce(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function as(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function $s(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function po(t, e) {
  return $s(tn(t, e));
}
function Pe(t) {
  const e = $s(t);
  return e === 0 ? [0, 0, 0] : qe(t, 1 / e);
}
function Pl(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const Wb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Jn,
  cross: as,
  distance: po,
  dot: ce,
  length: $s,
  lerp: Pl,
  normalize: Pe,
  scale: qe,
  subtract: tn
}, Symbol.toStringTag, { value: "Module" })), Xu = Math.PI / 180;
function Ps() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function bt(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let i = 0; i < 4; i++) {
      let o = 0;
      for (let r = 0; r < 4; r++) o += t[r * 4 + i] * e[s * 4 + r];
      n[s * 4 + i] = o;
    }
  return n;
}
function be(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function Te(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function Yt(t) {
  const [e, n, s, i] = t;
  return [
    1 - 2 * (n * n + s * s),
    2 * (e * n + s * i),
    2 * (e * s - n * i),
    0,
    2 * (e * n - s * i),
    1 - 2 * (e * e + s * s),
    2 * (n * s + e * i),
    0,
    2 * (e * s + n * i),
    2 * (n * s - e * i),
    1 - 2 * (e * e + n * n),
    0,
    0,
    0,
    0,
    1
  ];
}
function go(t, e, n) {
  const s = Yt(e);
  for (let i = 0; i < 3; i++)
    s[i] *= n[0], s[4 + i] *= n[1], s[8 + i] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function Uu(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function mo(t) {
  const [e, n, s, i, o, r, a, l, c, h, u, d, f, g, p, m] = t, y = e * r - n * o, w = e * a - s * o, b = e * l - i * o, v = n * a - s * r, M = n * l - i * r, x = s * l - i * a, T = c * g - h * f, A = c * p - u * f, k = c * m - d * f, O = h * p - u * g, $ = h * m - d * g, P = u * m - d * p, L = y * P - w * $ + b * O + v * k - M * A + x * T;
  if (Math.abs(L) < 1e-12) return null;
  const _ = 1 / L;
  return [
    (r * P - a * $ + l * O) * _,
    (s * $ - n * P - i * O) * _,
    (g * x - p * M + m * v) * _,
    (u * M - h * x - d * v) * _,
    (a * k - o * P - l * A) * _,
    (e * P - s * k + i * A) * _,
    (p * b - f * x - m * w) * _,
    (c * x - u * b + d * w) * _,
    (o * $ - r * k + l * T) * _,
    (n * k - e * $ - i * T) * _,
    (f * M - g * b + m * y) * _,
    (h * b - c * M - d * y) * _,
    (r * A - o * O - a * T) * _,
    (e * O - n * A + s * T) * _,
    (g * w - f * v - p * y) * _,
    (c * v - h * w + u * y) * _
  ];
}
function Vu(t, e, n, s) {
  const i = 1 / Math.tan(t * Xu / 2), o = 1 / (n - s);
  return [i / e, 0, 0, 0, 0, i, 0, 0, 0, 0, (s + n) * o, -1, 0, 0, 2 * s * n * o, 0];
}
function Gu(t, e, n, s, i, o) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (o - i);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(o + i) * l, 1];
}
function Ju(t, e, n = [0, 1, 0]) {
  const s = Pe(tn(t, e)), i = Pe(as(n, s)), o = as(s, i);
  return [
    i[0],
    o[0],
    s[0],
    0,
    i[1],
    o[1],
    s[1],
    0,
    i[2],
    o[2],
    s[2],
    0,
    -ce(i, t),
    -ce(o, t),
    -ce(s, t),
    1
  ];
}
function Ht(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], i = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], o = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return o === 1 || o === 0 ? [n, s, i] : [n / o, s / o, i / o];
}
const jb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: go,
  fromQuat: Yt,
  identity: Ps,
  invert: mo,
  lookAt: Ju,
  multiply: bt,
  orthographic: Gu,
  perspective: Vu,
  scaling: Te,
  transformPoint: Ht,
  translation: be,
  transpose: Uu
}, Symbol.toStringTag, { value: "Module" })), Ln = {
  "power1.in": [0.55, 0.085, 0.68, 0.53],
  "power1.out": [0.25, 0.46, 0.45, 0.94],
  "power1.inout": [0.455, 0.03, 0.515, 0.955],
  "power2.in": [0.55, 0.055, 0.675, 0.19],
  "power2.out": [0.215, 0.61, 0.355, 1],
  "power2.inout": [0.645, 0.045, 0.355, 1],
  "power3.in": [0.895, 0.03, 0.685, 0.22],
  "power3.out": [0.165, 0.84, 0.44, 1],
  "power3.inout": [0.77, 0, 0.175, 1],
  "power4.in": [0.755, 0.05, 0.855, 0.06],
  "power4.out": [0.23, 1, 0.32, 1],
  "power4.inout": [0.86, 0, 0.07, 1],
  "sine.in": [0.47, 0, 0.745, 0.715],
  "sine.out": [0.39, 0.575, 0.565, 1],
  "sine.inout": [0.445, 0.05, 0.55, 0.95],
  "expo.in": [0.95, 0.05, 0.795, 0.035],
  "expo.out": [0.19, 1, 0.22, 1],
  "expo.inout": [1, 0, 0, 1],
  "circ.in": [0.6, 0.04, 0.98, 0.335],
  "circ.out": [0.075, 0.82, 0.165, 1],
  "circ.inout": [0.785, 0.135, 0.15, 0.86],
  "back.in": [0.6, -0.28, 0.735, 0.045],
  "back.out": [0.175, 0.885, 0.32, 1.275],
  "back.inout": [0.68, -0.55, 0.265, 1.55]
}, gr = {
  none: "linear",
  linear: "linear",
  "linear.none": "linear",
  // GSAP's powerN is a polynomial of degree N+1: power1 is quad, power2 cubic.
  "power1.in": "ease-in-quad",
  "power1.out": "ease-out-quad",
  "power1.inout": "ease-in-out-quad",
  "power2.in": "ease-in-cubic",
  "power2.out": "ease-out-cubic",
  "power2.inout": "ease-in-out-cubic"
};
function Zu(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
$t({ type: "bounce", mode: "in" });
$t({ type: "bounce", mode: "in-out" });
function ls(t) {
  const e = _l.get(t.trim().toLowerCase());
  if (e) return e;
  const n = Zu(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: $t(r) };
  }
  const i = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (i) {
    const [, o, r, a] = i, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (o === "back" && l.length === 0 && n in Ln)
      return { easing: { type: "cubic-bezier", points: Ln[n] } };
    const h = o === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : o === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: $t(h) };
  }
  return n in gr ? { easing: gr[n] } : n in Ln ? { easing: { type: "cubic-bezier", points: Ln[n] } } : { easing: "ease-out" };
}
const _l = /* @__PURE__ */ new Map();
function yo(t, e) {
  return _l.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function Oi(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const Ol = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Il(t) {
  return typeof t == "string" && Ol.test(t);
}
function Qu(t = 1) {
  let e = Oi(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), i = (l, c, h, u, d) => c === l ? h : h + (d - l) / (c - l) * (u - h), o = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return mr(l, c, 1 / 0);
    if ("values" in l) return mr(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, r = (l, c, h) => {
    const u = l + e() * (c - l);
    return h ? Math.round(u / h) * h : u;
  };
  return {
    clamp: n(3, s),
    mapRange: n(5, i),
    normalize: n(3, (l, c, h) => i(l, c, 0, 1, h)),
    interpolate: n(3, (l, c, h) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const u = {};
        for (const d of Object.keys(l))
          u[d] = os(l[d])(l[d], c[d], h);
        return u;
      }
      return os(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, m = (y) => p[(Math.round(y) % p.length + p.length) % p.length];
        return c === void 0 ? m : m(c);
      }
      const u = l, f = c - u, g = (p) => f === 0 ? u : ((p - u) % f + f) % f + u;
      return h === void 0 ? g : g(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const u = c - l;
      if (u === 0) return l;
      const d = ((h - l) % (u * 2) + u * 2) % (u * 2);
      return l + (d > u ? u * 2 - d : d);
    }),
    snap: n(2, o),
    random: ((l, c, h, u) => {
      if (Array.isArray(l)) {
        const f = () => l[Math.floor(e() * l.length)];
        return c === !0 ? f : f();
      }
      const d = () => r(l, c, h);
      return u ? d : d();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(e() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: u = "start", ease: d }) => (f, g, p) => {
      const m = p.length, w = lo(f, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), b = c !== void 0 ? c : (h ?? 1) * al(m, u), v = d && b > 0 ? d(w / b) * b : w;
      return l + v;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => td(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = Oi(l);
    },
    resolveRandomString: (l) => {
      const c = Ol.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, d] = c.split(",").map((f) => Number.parseFloat(f));
      return r(h, u, Number.isFinite(d) ? d : void 0);
    }
  };
}
function mr(t, e, n) {
  let s = e, i = 1 / 0;
  for (const o of t) {
    const r = Math.abs(o - e);
    r < i && (i = r, s = o);
  }
  return i <= n ? s : e;
}
function td(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const o = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return o.length >= 4 ? [o[0], o[1], o[2], Math.round(o[3] / 255 * 1e3) / 1e3] : [o[0], o[1], o[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((i) => Number.parseFloat(i));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const ed = /^([+-])=\s*(-?[\d.]+)$/, nd = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function sn(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const i = t.trim();
  if (i === "") return e.cursor;
  const o = ed.exec(i);
  if (o) {
    const c = s(o[2]);
    return e.cursor + (o[1] === "-" ? -c : c);
  }
  const r = nd.exec(i);
  if (r) {
    const c = r[1] === "<" ? e.previousStart : e.previousEnd;
    if (r[3] === void 0) return c;
    const h = s(r[3]);
    return c + (r[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(i);
  if (a) {
    const c = e.labels.get(a[1].trim());
    if (c !== void 0) {
      const h = s(a[3]);
      return c + (a[2] === "-" ? -h : h);
    }
  }
  const l = e.labels.get(i);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(i) ? s(i) : e.cursor;
}
function sd(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function id(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, i = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), o = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (i - 1) } : typeof r == "number" ? o(Math.max(0, Math.min(t - 1, r))) : r === "end" ? o(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (i - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = o(g), y = Math.abs(p - a.x), w = Math.abs(m - a.y);
    return e.axis === "x" ? y : e.axis === "y" ? w : Math.hypot(y, w);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, d = e.ease ? ls(e.ease) : void 0, f = d ? d.fn ?? $t(d.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (f ? f(p) : p) * u;
  });
}
const bo = /* @__PURE__ */ new Set([
  "duration",
  "delay",
  "ease",
  "repeat",
  "repeatDelay",
  "yoyo",
  "stagger",
  "onComplete",
  "onUpdate",
  "onStart",
  "onRepeat",
  "onReverseComplete",
  "repeatRefresh",
  "keyframes",
  "easeEach",
  "scrollTo",
  "id",
  "immediateRender",
  "overwrite",
  "paused",
  "scrollTrigger",
  "spring"
]), od = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Zn(t) {
  const e = {}, n = {};
  for (const [s, i] of Object.entries(t))
    bo.has(s) ? e[s] = i : n[od[s] ?? s] = i;
  return { config: e, properties: n };
}
function cs(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function Ii(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : sd(t) ? { offsets: id(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const rd = {
  opacity: 1,
  x: 0,
  y: 0,
  z: 0,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  scaleZ: 1,
  skewX: 0,
  skewY: 0,
  originX: 50,
  originY: 50,
  perspective: 0,
  blur: 0,
  glow: 0,
  clipTop: 0,
  clipRight: 0,
  clipBottom: 0,
  clipLeft: 0
};
function Hl(t) {
  return rd[t];
}
function ad(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = Bu(e.path, { curviness: e.curviness });
  else if (_n(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function ld(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function Cl(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function cd(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = Cl(e);
  if (typeof s != "string" || !_n(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function hd(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, yr(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return yr(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const i = s(n[0]), o = s(n[1]);
  return i <= o ? [i, o] : [o, i];
}
function ud(t, e) {
  const [n, s] = hd(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function dd(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...ud(n, e) };
}
function fd(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function yr(t, e) {
  return Math.max(0, Math.min(e, t));
}
function pd(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function gd(t, e, n) {
  if (t.scrambleText !== void 0) {
    const s = t.scrambleText, i = typeof s == "string" ? { text: s } : s;
    if (typeof i?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const o = i.revealDelay && n > 0 ? i.revealDelay * 1e3 / n : void 0;
    return {
      to: i.text,
      mode: "scramble",
      ...i.chars !== void 0 && { chars: i.chars },
      ...i.speed !== void 0 && { refreshRate: 20 * i.speed },
      ...o !== void 0 && { revealDelay: Math.min(o, 0.999) },
      ...i.tweenLength !== void 0 && { tweenLength: i.tweenLength },
      ...i.rightToLeft !== void 0 && { rightToLeft: i.rightToLeft },
      seed: i.seed ?? pd(`${e}|${i.text}`)
    };
  }
  if (t.text !== void 0) {
    const s = t.text, i = typeof s == "string" ? { value: s } : s;
    if (typeof i?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: i.value,
      mode: "type",
      ...i.rightToLeft !== void 0 && { rightToLeft: i.rightToLeft }
    };
  }
}
function wo(t) {
  return Math.max(0.1, t / 25);
}
function md(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? wo(n.resistance) : void 0), i = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? i.end = [n.end(is(i))] : n.end !== void 0 && (i.end = Array.isArray(n.end) ? [...n.end] : n.end), i;
}
function yd(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in Bs))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(Bs).join(", ")}`
    );
  return {
    ...e.preset ? Bs[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function bd(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class Be {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Oi(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new Kt({
      // A timestamped default would make the same script compile to different
      // JSON on every run, which breaks the determinism contract. Callers that
      // need distinct ids pass one.
      id: e.id ?? "gsap-compat",
      name: e.name,
      config: {
        ...e.repeat !== void 0 && { loop: e.repeat },
        ...e.yoyo !== void 0 && { alternate: e.yoyo },
        ...e.repeatDelay !== void 0 && { repeatDelay: e.repeatDelay * 1e3 },
        ...e.timeScale !== void 0 && { speed: e.timeScale }
      }
    });
  }
  // --- tween creation -----------------------------------------------------
  /** Animate to the given values. */
  to(e, n, s) {
    return this.build(e, void 0, on(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: i, properties: o } = Zn(on(n)), { motionPath: r, text: a, scrambleText: l, ...c } = o, h = this.targetsOf(e)[0], u = { ...i };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = ld(r));
    const d = {}, f = String(this.resolveStart(h, "text"));
    return a !== void 0 && (d.text = Gs(a), u.text = typeof a == "object" ? { ...a, value: f } : f), l !== void 0 && (d.text = Gs(l), u.scrambleText = typeof l == "object" ? { ...l, text: f } : f), this.build(e, { ...c, ...d }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, i) {
    const { properties: o } = Zn(on(n));
    return this.build(e, o, on(s), i);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...on(n), duration: 0 }, s);
  }
  // --- sequencing ---------------------------------------------------------
  /** Start of the tween (after its delay) or call added last, in milliseconds. */
  get lastStart() {
    return this.previousStart;
  }
  /** End of the tween or call added last, in milliseconds. */
  get lastEnd() {
    return this.previousEnd;
  }
  /**
   * Place a zero-length event (a callback or a pause) at a position, as a tween of
   * no duration would be: `'<'` and `'>'` after it refer to it. Returns its time in ms.
   */
  addEvent(e) {
    const n = Math.max(0, sn(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return sn(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, sn(n, this.context())), this;
  }
  /** Time of a label, in milliseconds. */
  /** Every label's time in milliseconds, in time order. */
  labelTimes() {
    return [...this.labels.values()].sort((e, n) => e - n);
  }
  labelTime(e) {
    return this.labels.get(e);
  }
  /**
   * Merge another compat timeline in at a position.
   *
   * Nested timelines are flattened at compile time — every keyframe is offset
   * and copied in — so there is no nested-timeline runtime and the output is
   * one flat, serializable track list.
   */
  add(e, n) {
    const s = sn(n, this.context());
    for (const o of e.timeline.tracks) {
      if (!("keyframes" in o)) continue;
      const r = _i({
        ...o,
        id: this.nextTrackId(`nested-${o.id}`),
        keyframes: o.keyframes.map((a) => ({ ...a, time: a.time + s }))
      });
      this.timeline.addTrack(r);
    }
    const i = s + e.timeline.duration;
    return this.previousStart = s, this.previousEnd = i, this.cursor = Math.max(this.cursor, i), this;
  }
  // --- playback -----------------------------------------------------------
  play() {
    return this.timeline.play(), this;
  }
  pause() {
    return this.timeline.pause(), this;
  }
  restart() {
    return this.timeline.stop(), this.timeline.play(), this;
  }
  reverse() {
    return this.timeline.reverse(), this;
  }
  kill() {
    return this.timeline.removeTracks(), this;
  }
  /**
   * Remove every tween and forget the cursor, labels and chained start values,
   * so the same calls can build it again from scratch (`invalidate` in `live`).
   */
  reset() {
    return this.timeline.removeTracks(), this.cursor = 0, this.previousStart = 0, this.previousEnd = 0, this.labels.clear(), this.lastValues.clear(), this.trackCounter = 0, this;
  }
  /** Seek to a time in seconds, or to a label. */
  seek(e) {
    if (typeof e == "string") {
      const n = this.labels.get(e);
      return n !== void 0 && this.timeline.seek(n), this;
    }
    return this.timeline.seek(e * 1e3), this;
  }
  /** Progress through the timeline, 0..1. */
  progress(e) {
    const n = this.timeline.duration;
    return e !== void 0 && n > 0 && this.timeline.seek(e * n), n > 0 ? this.timeline.currentTime / n : 0;
  }
  /** Playback rate. */
  timeScale(e) {
    return e !== void 0 && (this.timeline.speed = e), this.timeline.speed;
  }
  /** Total duration in seconds (GSAP's unit). */
  duration() {
    return this.timeline.duration / 1e3;
  }
  /** Advance by `deltaMs` — the host still owns the animation loop. */
  tick(e) {
    return this.timeline.tick(e), this;
  }
  /** The compiled animation, as plain JSON. */
  toDefinition() {
    return this.timeline.toDefinition();
  }
  // --- compilation --------------------------------------------------------
  /**
   * Compile one tween into tracks.
   *
   * `fromProperties` holds explicit start values (fromTo / from); when absent,
   * each property's start comes from the resolution chain.
   */
  build(e, n, s, i) {
    const { config: o, properties: r } = Zn(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, d = this.targetsOf(e), f = sn(i, this.context()), g = cs(o.delay, 0), p = cs(o.duration, 500), m = Ii(o.stagger, {
      count: d.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(d) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(o.ease), w = [], b = o.spring;
    let v = 0, M = !1;
    for (const [$, P] of Object.entries(u)) {
      const L = P;
      let _ = n?.[$] !== void 0 ? n[$] : this.resolveStart(d[0], $);
      if (typeof _ != typeof L && (this.warn(
        `no usable start value for "${$}" on "${d[0]}" — it will snap to ${String(L)}. Use fromTo() to animate it.`
      ), _ = L), b !== void 0 && (typeof _ != "number" || typeof L != "number") && this.warn(`spring works on numbers, so "${$}" on "${d[0]}" eases instead`), b !== void 0 && typeof _ == "number" && typeof L == "number") {
        const Y = {
          ...yd(b),
          from: _,
          to: L,
          velocity: bd(b, $) ?? this.options.startVelocity?.(d[0], $) ?? 0
        }, j = this.nextTrackId(`${d[0]}-${$}-spring`), U = {
          id: j,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: $,
          kind: "spring",
          spring: Y,
          delay: f + g
        };
        this.timeline.addTrack(U), w.push(j), v = Math.max(v, wh(Y));
        for (const G of d) this.lastValues.set(`${G}|${$}`, L);
        continue;
      }
      M = !0;
      const R = this.keyframesFor(_, L, p, y, o.ease), D = this.nextTrackId(`${d[0]}-${$}`);
      this.timeline.addTrack(
        _i({
          id: D,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: $,
          delay: f + g,
          keyframes: R,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...$ === "quaternion" && { interpolation: "slerp" }
        })
      ), w.push(D);
      for (const Y of d) this.lastValues.set(`${Y}|${$}`, L);
    }
    const x = gd({ text: l, scrambleText: c }, d[0], p);
    if (x) {
      const $ = n?.text ?? n?.scrambleText, P = $ !== void 0 ? Gs($) : this.resolveStart(d[0], "text"), L = this.nextTrackId(`${d[0]}-text`), _ = {
        id: L,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof P == "string" ? P : String(P ?? ""), ...x },
        delay: f + g,
        keyframes: this.keyframesFor(0, 1, p, y, o.ease)
      };
      this.timeline.addTrack(_), w.push(L);
      for (const R of d) this.lastValues.set(`${R}|text`, x.to);
    }
    if (a !== void 0) {
      const { config: $, start: P, end: L } = ad(a), _ = this.nextTrackId(`${d[0]}-motionPath`), R = {
        id: _,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: $,
        delay: f + g,
        keyframes: this.keyframesFor(P, L, p, y, o.ease)
      };
      this.timeline.addTrack(R), w.push(_);
    }
    if (h !== void 0)
      for (const [$, P] of Object.entries(h)) {
        const L = this.resolveStart(d[0], $);
        if (typeof L != "number") {
          this.warn(`inertia on "${$}" needs a numeric start value; skipped`);
          continue;
        }
        const _ = md(L, P), R = this.nextTrackId(`${d[0]}-${$}-inertia`), D = {
          id: R,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: $,
          kind: "inertia",
          inertia: _,
          delay: f + g
        };
        this.timeline.addTrack(D), w.push(R), v = Math.max(v, Pn(_));
        for (const Y of d) this.lastValues.set(`${Y}|${$}`, $n(_));
      }
    const k = ((h !== void 0 || b !== void 0) && !M && !x && a === void 0 ? v : Math.max(p, v)) + (m && d.length > 1 ? Ts(d.length, m) : 0), O = f + g + k;
    return this.previousStart = f + g, this.previousEnd = O, this.cursor = Math.max(this.cursor, O), {
      trackIds: w,
      start: f + g,
      end: O,
      kill: () => {
        for (const $ of w) this.timeline.removeTrack($);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(e, n, s, i, o) {
    const r = { time: 0, value: e };
    if (s <= 0)
      return [{ time: 0, value: n }];
    const a = typeof o == "string" ? ls(o) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && ss(i)) {
      const c = a?.fn ?? $t(i);
      return [r, ...kl(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [r, { time: s, value: n, ...i && { easing: i } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(e, n) {
    const s = this.lastValues.get(`${e}|${n}`);
    if (s !== void 0) return s;
    const i = this.options.startValue?.(e, n);
    if (i !== void 0) return i;
    const o = this.options.defaults?.[n];
    if (o !== void 0) return o;
    if (n === "text") return "";
    if (n === "quaternion") return [0, 0, 0, 1];
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${e}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const r = Hl(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return ls(e).easing;
      if (typeof e == "function")
        throw new Error(
          'gsap-compat: function eases cannot be serialized. Use a named ease, or a cubic-bezier via { type: "cubic-bezier", points: [...] }.'
        );
      return e;
    }
  }
  targetsOf(e) {
    return Array.isArray(e) ? e : [e];
  }
  context() {
    return {
      cursor: this.cursor,
      previousStart: this.previousStart,
      previousEnd: this.previousEnd,
      labels: this.labels,
      // Position literals are GSAP seconds; everything stored is milliseconds.
      scale: 1e3
    };
  }
  nextTrackId(e) {
    return this.trackCounter += 1, `${e}-${this.trackCounter}`;
  }
  warn(e) {
    this.options.onWarning?.(`gsap-compat: ${e}`);
  }
}
function Gs(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function wd(t) {
  return new Be(t);
}
function on(t) {
  return fd(cd(t));
}
function kd(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${Yt(le(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const vd = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Md = "#ffffff", Sd = "rgba(0, 0, 0, 0.5)";
function Td(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Md})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, i = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${i}px ${t.shadowColor ?? Sd})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function xd(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Ed(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const br = /* @__PURE__ */ new Set([
  "width",
  "height",
  "top",
  "right",
  "bottom",
  "left",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "borderRadius",
  "borderWidth",
  "fontSize",
  "lineHeight",
  "letterSpacing",
  "outlineWidth",
  "gap",
  "rowGap",
  "columnGap"
]), Ad = /* @__PURE__ */ new Set([
  "x",
  "y",
  "z",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "skewX",
  "skewY",
  // A rotation as an [x, y, z, w] quaternion (a track with `interpolation: 'slerp'`)
  "quaternion",
  // Motion path properties
  "motionPathX",
  "motionPathY",
  "motionPathRotate"
]), $d = [
  "x",
  "motionPathX",
  "y",
  "motionPathY",
  "z",
  "rotate",
  "rotateZ",
  "motionPathRotate",
  "rotateX",
  "rotateY",
  "quaternion",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "skewX",
  "skewY"
], Pd = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), _d = /* @__PURE__ */ new Set(["originX", "originY"]), Od = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Id = /* @__PURE__ */ new Set(["drawOn"]), Hd = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, wr = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Cd = "http://www.w3.org/2000/svg";
class xe {
  targets = /* @__PURE__ */ new Map();
  /**
   * Register an HTML element as an animation target.
   */
  registerTarget(e, n) {
    this.targets.set(e, n);
  }
  /**
   * Unregister a target by its ID.
   */
  unregisterTarget(e) {
    this.targets.delete(e);
  }
  /**
   * Get a registered target element.
   */
  getTarget(e) {
    return this.targets.get(e);
  }
  /**
   * Clear all registered targets.
   */
  clearTargets() {
    this.targets.clear();
  }
  /**
   * Apply animation state to all registered targets.
   */
  applyState(e) {
    for (const [n, s] of e.values) {
      const i = this.targets.get(n);
      i && this.applyProperties(i, s);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(e, n) {
    let s = null, i = null, o = null, r = null, a = null;
    const l = n.has("motionPathX"), c = n.has("motionPathY"), h = n.has("motionPathRotate");
    for (const [g, p] of n)
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !Id.has(g)) {
        if (Ad.has(g))
          (s ??= {})[g] = p;
        else if (Pd.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (_d.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (Od.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (vd.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            xd(e, p);
          else if (g === "d" && typeof p == "string") {
            const m = e;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(e, g, p);
        }
      }
    const u = n.get("shine");
    typeof u == "number" && this.applyShine(e, u);
    const d = [], f = n.get("perspective");
    if (typeof f == "number" && f > 0 && d.push(`perspective(${f}px)`), s)
      for (const g of $d) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && d.push(m);
      }
    if (d.length > 0 && (e.style.transform = d.join(" "), Ed(e)), i && (i.childPerspective !== void 0 && (e.style.perspective = `${i.childPerspective}px`), (i.perspectiveOriginX !== void 0 || i.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${i.perspectiveOriginX ?? 50}% ${i.perspectiveOriginY ?? 50}%`)), o) {
      const g = o.originX ?? 50, p = o.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, y = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${y}%)`;
    }
    if (a) {
      const g = Td(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return kd(n);
    if (typeof n != "number") return null;
    switch (e) {
      case "x":
      case "motionPathX":
        return `translateX(${n}px)`;
      case "y":
      case "motionPathY":
        return `translateY(${n}px)`;
      case "z":
        return `translateZ(${n}px)`;
      case "rotate":
      case "rotateZ":
      case "motionPathRotate":
        return `rotate(${n}deg)`;
      case "rotateX":
        return `rotateX(${n}deg)`;
      case "rotateY":
        return `rotateY(${n}deg)`;
      case "scale":
        return `scale(${n})`;
      case "scaleX":
        return `scaleX(${n})`;
      case "scaleY":
        return `scaleY(${n})`;
      case "scaleZ":
        return `scaleZ(${n})`;
      case "skewX":
        return `skewX(${n}deg)`;
      case "skewY":
        return `skewY(${n}deg)`;
      default:
        return null;
    }
  }
  /**
   * Apply a shine sweep to a (text) element.
   *
   * `progress` runs 0..1 as the highlight travels from just off the left edge to
   * just off the right. Two layered, text-clipped gradients are used: a moving
   * white highlight band on top of a solid layer of the element's base colour,
   * so the text stays visible while the sheen passes over the glyphs.
   */
  applyShine(e, n) {
    e.dataset.shineBase || (e.dataset.shineBase = e.style.color || "currentColor");
    const s = e.dataset.shineBase, i = -20 + n * 140, o = e.style;
    o.color = "transparent", o.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, o.backgroundSize = "250% 100%, 100% 100%", o.backgroundPosition = `${i}% 0, 0 0`, o.backgroundRepeat = "no-repeat", o.webkitBackgroundClip = "text", o.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(e, n, s) {
    let i;
    if (e.namespaceURI === Cd && n in wr) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[wr[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? i = "color" : i = Hd[n] ?? n;
    let r;
    typeof s == "number" ? br.has(n) || br.has(i) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[i] = r;
  }
}
const Rd = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Ld {
  adapter = new xe();
  scheduler;
  rootOption;
  /** Where live timelines on this stage report warnings, unless they have their own `onWarning` */
  onWarning;
  /** Element → engine target name. The engine only ever sees names. */
  names = /* @__PURE__ */ new WeakMap();
  elements = /* @__PURE__ */ new Map();
  nameCounter = 0;
  /** Plain-object targets, named like elements but written directly. */
  objectNames = /* @__PURE__ */ new WeakMap();
  objects = /* @__PURE__ */ new Map();
  /** Things created for this stage that outlive a timeline (scroll triggers, pins). */
  owned = /* @__PURE__ */ new Set();
  currentCollector;
  tickerCallbacks = /* @__PURE__ */ new Set();
  tickerTime = 0;
  tickerFrame = 0;
  /**
   * Live timelines that may still move something — playing, paused or scroll
   * driven — for `live.killTweensOf`. Finished one-off timelines leave it.
   */
  liveTimelines = /* @__PURE__ */ new Set();
  /** GSAP-style utilities, with this stage's seeded random sequence (`live.utils`). */
  utils = Qu();
  /** Playing timelines, in activation order. */
  active = /* @__PURE__ */ new Map();
  /** Last applied value per target name and property. */
  applied = /* @__PURE__ */ new Map();
  /** Targets written since the last apply. */
  dirty = /* @__PURE__ */ new Set();
  frameId = null;
  lastTimestamp = null;
  destroyed = !1;
  constructor(e = {}) {
    this.scheduler = e.scheduler ?? Rd, this.rootOption = e.root, this.onWarning = e.onWarning;
  }
  // --- targets ------------------------------------------------------------
  /**
   * Where selector targets are resolved: the given root, or the document.
   * Read lazily so a stage can be created where there is no document (Node, a
   * Worker) as long as nothing is resolved there.
   */
  get root() {
    return this.rootOption ?? document;
  }
  /**
   * Resolve selectors, elements, plain objects and lists of them to engine
   * target names, registering each element with the adapter (and each object
   * with the stage) the first time it is seen.
   * Returns an empty array when nothing matches.
   */
  resolveTargets(e) {
    const n = [];
    for (const s of this.targetsOf(e)) {
      const i = this.nameFor(s);
      Js(s) && this.currentCollector?.touch(s, i), n.push(i);
    }
    return n;
  }
  /** Find one element the way selector targets are found: within the stage's root (or the collecting context's scope). */
  query(e) {
    return this.selectorRoot.querySelector(e);
  }
  // --- contexts -----------------------------------------------------------
  /** The context collecting what is created right now, if any (see live-context.ts). */
  get collector() {
    return this.currentCollector;
  }
  setCollector(e) {
    this.currentCollector = e;
  }
  /** Drop the values applied to a target, so the next animation starts from its natural state. */
  forget(e) {
    this.applied.delete(e), this.dirty.delete(e);
  }
  get selectorRoot() {
    return this.currentCollector?.scope ?? this.root;
  }
  /** The element registered under a target name. */
  elementFor(e) {
    return this.elements.get(e);
  }
  /** The plain object registered under a target name. */
  objectFor(e) {
    return this.objects.get(e);
  }
  /** Last value the stage applied to a target's property, if any. */
  appliedValue(e, n) {
    return this.applied.get(e)?.get(n);
  }
  /**
   * How fast a property is changing right now, in units per second, taken from
   * the most recently played timeline that animates it — so a spring started
   * mid-motion carries the momentum. A finite difference over a few milliseconds
   * of that timeline's own (deterministic) state; undefined when nothing playing
   * animates the property.
   */
  velocityOf(e, n) {
    for (const i of [...this.active.keys()].reverse()) {
      if (i.getTracks({ target: e, property: n }).length === 0) continue;
      const o = i.currentTime;
      if (o < 4) return 0;
      const r = i.getStateAtTime(o).values.get(e)?.get(n), a = i.getStateAtTime(o - 4).values.get(e)?.get(n);
      if (typeof r != "number" || typeof a != "number") return;
      const l = (r - a) / 4;
      return (i.direction === "reverse" ? -l : l) * 1e3;
    }
  }
  /**
   * Run a callback every frame, after animations are applied. The frame loop
   * keeps going while any callback is registered, even with nothing playing.
   */
  ticker = {
    add: (e) => {
      this.destroyed || (this.tickerCallbacks.size === 0 && (this.tickerTime = 0, this.tickerFrame = 0), this.tickerCallbacks.add(e), this.currentCollector?.track({ revert: () => this.ticker.remove(e) }), this.startLoop());
    },
    remove: (e) => {
      this.tickerCallbacks.delete(e), this.running || this.stopLoop();
    }
  };
  // --- playback -----------------------------------------------------------
  /**
   * Add a timeline to the running set and make sure the loop is going. The
   * timeline must already be playing; activating an already active timeline
   * moves it to the end of the order, so it wins merges.
   */
  activate(e, n = {}) {
    this.destroyed || (e.onUpdate = (s) => this.write(s), this.active.delete(e), this.active.set(e, n), this.startLoop());
  }
  /** Remove a timeline from the running set. Its applied values remain. */
  deactivate(e) {
    this.active.delete(e), this.running || this.stopLoop();
  }
  /** Destroy `resource` along with the stage. Returns it. */
  own(e) {
    return this.destroyed ? e.destroy() : this.owned.add(e), e;
  }
  /**
   * Stop everything on this stage and release its elements. Animations that
   * are still running stop where they are; elements keep the styles last
   * applied. A destroyed stage ignores later playback, so a timeline whose
   * autoplay was already queued cannot restart the loop.
   */
  destroy() {
    this.destroyed = !0;
    for (const e of this.owned) e.destroy();
    this.owned.clear();
    for (const e of this.active.keys()) e.stop();
    this.active.clear(), this.stopLoop(), this.adapter.clearTargets(), this.elements.clear(), this.names = /* @__PURE__ */ new WeakMap(), this.objects.clear(), this.objectNames = /* @__PURE__ */ new WeakMap(), this.tickerCallbacks.clear(), this.liveTimelines.clear(), this.applied.clear(), this.dirty.clear();
  }
  /**
   * Write values for one target straight away, without a timeline — for direct
   * manipulation such as dragging, where every pointer move sets a position.
   * The values join the applied state, so later tweens start from them.
   */
  apply(e, n) {
    if (this.destroyed) return;
    const s = new Map(Object.entries(n));
    this.write({ values: /* @__PURE__ */ new Map([[e, s]]), currentTime: 0, playbackState: "idle", direction: "forward", loopIteration: 0 }), this.flush();
  }
  /** Apply a timeline's state at its current time, immediately. */
  render(e) {
    this.destroyed || (this.write(e.getStateAtTime(e.currentTime)), this.flush());
  }
  /**
   * Advance every active timeline by `deltaMs` and apply the merged result.
   * The frame loop calls this; it is public so hosts that own their own loop
   * (or tests) can drive the stage directly.
   */
  tick(e) {
    const n = [...this.active];
    for (const [s] of n)
      s.duration <= 0 ? (this.write(s.getStateAtTime(0)), s.stop()) : s.tick(e);
    this.flush();
    for (const [s, i] of n)
      i.onUpdate?.(), s.playbackState !== "playing" && this.active.get(s) === i && this.active.delete(s);
    this.flush(), this.runTicker(e), this.running || this.stopLoop();
  }
  // --- internals ----------------------------------------------------------
  /** Whether the frame loop has work: something playing, or a ticker callback. */
  get running() {
    return this.active.size > 0 || this.tickerCallbacks.size > 0;
  }
  runTicker(e) {
    if (this.tickerCallbacks.size !== 0) {
      this.tickerTime += e, this.tickerFrame += 1;
      for (const n of [...this.tickerCallbacks])
        n(this.tickerTime / 1e3, e, this.tickerFrame);
    }
  }
  write(e) {
    for (const [n, s] of e.values) {
      let i = this.applied.get(n);
      i || (i = /* @__PURE__ */ new Map(), this.applied.set(n, i));
      for (const [o, r] of s) i.set(o, r);
      this.dirty.add(n);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const e = /* @__PURE__ */ new Map();
    for (const n of this.dirty) {
      const s = this.applied.get(n), i = this.objects.get(n);
      if (i)
        for (const [o, r] of s) i[o] = r;
      else
        e.set(n, s);
    }
    this.dirty.clear(), e.size !== 0 && this.adapter.applyState({
      values: e,
      currentTime: 0,
      playbackState: "playing",
      direction: "forward",
      loopIteration: 0
    });
  }
  frame = (e) => {
    this.frameId = null;
    const n = this.lastTimestamp === null ? 0 : e - this.lastTimestamp;
    this.lastTimestamp = e, n > 0 && this.tick(n), this.running && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
  };
  startLoop() {
    this.frameId === null && (this.lastTimestamp = null, this.frameId = this.scheduler.request(this.frame));
  }
  stopLoop() {
    this.frameId !== null && this.scheduler.cancel(this.frameId), this.frameId = null, this.lastTimestamp = null;
  }
  targetsOf(e) {
    if (typeof e == "string")
      return Array.from(this.selectorRoot.querySelectorAll(e));
    if (Js(e)) return [e];
    if (!Fd(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return Js(e) ? this.elementName(e) : this.objectName(e);
  }
  objectName(e) {
    const n = this.objectNames.get(e);
    if (n) return n;
    let s;
    do
      this.nameCounter += 1, s = `obj-${this.nameCounter}`;
    while (this.objects.has(s) || this.elements.has(s));
    return this.objectNames.set(e, s), this.objects.set(s, e), s;
  }
  elementName(e) {
    const n = this.names.get(e);
    if (n) return n;
    let s = e.id ? `#${e.id}` : "";
    if (!s || this.elements.has(s))
      do
        this.nameCounter += 1, s = `el-${this.nameCounter}`;
      while (this.elements.has(s));
    return this.names.set(e, s), this.elements.set(s, e), this.adapter.registerTarget(s, e), s;
  }
}
function Js(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Fd(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function hs(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const kr = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Dd(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Nd(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Wd(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || kr(t) ? { path: t } : t, { align: s, alignOrigin: i, path: o, ...r } = n, a = (x) => {
    const T = kr(x) ? x : e.query(x);
    return T || e.warn(`gsap-compat: motionPath could not find "${String(x)}"`), T;
  };
  let l = null, c = "";
  if (Array.isArray(o) || typeof o == "string" && _n(o))
    c = o;
  else {
    l = a(o);
    const x = l && fo({ tag: l.localName, attributes: Dd(l) });
    l && !x && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = x ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const d = e.targets[0];
  if (!d) return h;
  const [f, g, p, m, y, w] = Nd(u), b = hs(d), [v, M] = i ?? [0.5, 0.5];
  for (const x of e.targets.slice(1)) {
    const T = hs(x);
    if (Math.abs(T.left - b.left) > 0.5 || Math.abs(T.top - b.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [f, g, p, m, y - b.left - v * b.width, w - b.top - M * b.height], h;
}
const Rl = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Ll(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Fl(t) {
  if (!t) return null;
  const e = fo({ tag: t.localName, attributes: Ll(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function jd(t, e, n) {
  const s = Cl(t);
  if (typeof s == "string" && _n(s)) return s;
  const i = Rl(s) ? s : typeof s == "string" ? e(s) : null, o = Fl(i);
  return o || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const Bd = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function qd(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : Rl(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const i = fo({ tag: s.localName, attributes: Ll(s) });
    if (!i || !s.parentNode) return s;
    const o = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      Bd.has(r.name) || o.setAttribute(r.name, r.value);
    return o.setAttribute("d", i), s.parentNode.replaceChild(o, s), o;
  });
}
const vr = 0.3;
class Yd {
  options;
  target;
  running = !1;
  dragging = !1;
  passedTolerance = !1;
  lastX = 0;
  lastY = 0;
  startX = 0;
  startY = 0;
  velocityX = 0;
  velocityY = 0;
  lastTime = 0;
  constructor(e) {
    this.options = e, this.target = e.target;
  }
  start() {
    if (this.running) return;
    this.running = !0;
    const e = this.options.type ?? ["pointer", "touch"];
    e.includes("pointer") && (this.target.addEventListener("pointerdown", this.onPointerDown), this.target.addEventListener("pointermove", this.onPointerMove), this.target.addEventListener("pointerup", this.onPointerUp), this.target.addEventListener("pointercancel", this.onPointerUp)), e.includes("touch") && (this.target.addEventListener("touchstart", this.onTouchStart, { passive: !1 }), this.target.addEventListener("touchmove", this.onTouchMove, { passive: !1 }), this.target.addEventListener("touchend", this.onTouchEnd)), e.includes("wheel") && this.target.addEventListener("wheel", this.onWheel, { passive: !1 });
  }
  stop() {
    this.running && (this.running = !1, this.target.removeEventListener("pointerdown", this.onPointerDown), this.target.removeEventListener("pointermove", this.onPointerMove), this.target.removeEventListener("pointerup", this.onPointerUp), this.target.removeEventListener("pointercancel", this.onPointerUp), this.target.removeEventListener("touchstart", this.onTouchStart), this.target.removeEventListener("touchmove", this.onTouchMove), this.target.removeEventListener("touchend", this.onTouchEnd), this.target.removeEventListener("wheel", this.onWheel));
  }
  destroy() {
    this.stop();
  }
  /** Current velocity, in pixels per second. Read it on release for inertia. */
  get velocity() {
    return { x: this.velocityX, y: this.velocityY };
  }
  // --- gesture lifecycle --------------------------------------------------
  begin(e, n, s) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = Mr(), this.options.onPress?.(this.stateFrom(0, 0, s));
  }
  move(e, n, s) {
    if (!this.dragging) return;
    const i = e - this.lastX, o = n - this.lastY;
    this.lastX = e, this.lastY = n;
    const r = e - this.startX, a = n - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(r, a) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(i, o), this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.options.onMove?.(this.stateFrom(i, o, s));
  }
  end(e) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, e)));
  }
  updateVelocity(e, n) {
    const s = Mr(), i = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const o = e / i * 1e3, r = n / i * 1e3;
    this.velocityX += (o - this.velocityX) * vr, this.velocityY += (r - this.velocityY) * vr;
  }
  stateFrom(e, n, s) {
    return {
      deltaX: e,
      deltaY: n,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: this.lastX - this.startX,
      totalY: this.lastY - this.startY,
      isDragging: this.dragging,
      event: s
    };
  }
  // --- listeners ----------------------------------------------------------
  onPointerDown = (e) => {
    const n = e, s = this.target;
    if (typeof n.pointerId == "number" && typeof s.setPointerCapture == "function")
      try {
        s.setPointerCapture(n.pointerId);
      } catch {
      }
    this.begin(n.clientX, n.clientY, e);
  };
  onPointerMove = (e) => {
    const n = e;
    this.move(n.clientX, n.clientY, e);
  };
  onPointerUp = (e) => this.end(e);
  onTouchStart = (e) => {
    const n = e.touches[0];
    n && this.begin(n.clientX, n.clientY, e);
  };
  onTouchMove = (e) => {
    const n = e.touches[0];
    n && this.move(n.clientX, n.clientY, e);
  };
  onTouchEnd = (e) => this.end(e);
  onWheel = (e) => {
    const n = e;
    this.options.preventDefault !== !1 && n.cancelable && n.preventDefault(), this.updateVelocity(n.deltaX, n.deltaY), this.options.onMove?.({
      deltaX: n.deltaX,
      deltaY: n.deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: 0,
      totalY: 0,
      isDragging: !1,
      event: e
    });
  };
}
function Mr() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Kd(t, e, n) {
  let s = { delta: 0, line: null }, i = n;
  for (const o of t)
    for (const r of e) {
      const a = Math.abs(r - o);
      a <= i && (i = a, s = { delta: r - o, line: r });
    }
  return s;
}
function zd(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class Dl {
  options;
  observer;
  x;
  y;
  /** Position when the current gesture began */
  originX = 0;
  originY = 0;
  /** Lines that caught on the last constraint pass, for guide drawing */
  snappedX = null;
  snappedY = null;
  constructor(e) {
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new Yd({
      target: e.target,
      onPress: (n) => {
        const s = e.getPosition?.();
        s && (this.x = s.x, this.y = s.y), this.originX = this.x, this.originY = this.y, e.onPress?.(n);
      },
      onMove: (n) => this.handleMove(n),
      onRelease: (n) => e.onRelease?.(n)
    });
  }
  start() {
    this.observer.start();
  }
  stop() {
    this.observer.stop();
  }
  destroy() {
    this.observer.destroy();
  }
  /** Current dragged position. */
  get position() {
    return { x: this.x, y: this.y };
  }
  /** Velocity at the last movement, in pixels per second. */
  get velocity() {
    return this.observer.velocity;
  }
  /** Move the target programmatically, applying bounds and snapping. */
  setPosition(e, n) {
    const s = this.options.axis ?? "both";
    this.x = s === "y" ? this.x : this.applyConstraints(e, "x"), this.y = s === "x" ? this.y : this.applyConstraints(n, "y");
  }
  /** The snap lines that caught on the last move, for drawing guides. */
  get snapLines() {
    return { x: this.snappedX, y: this.snappedY };
  }
  /** See `snapThreshold` in the options. */
  snapThreshold() {
    if (this.options.snapThreshold !== void 0) return this.options.snapThreshold;
    const e = this.options.snap ?? 0;
    return e > 0 ? e / 2 : 8;
  }
  handleMove(e) {
    this.setPosition(this.originX + e.totalX, this.originY + e.totalY), this.options.mode === "scrub" && this.scrub(), this.options.onDrag?.(this.position, e), this.options.onSnap?.(this.snapLines);
  }
  /** Map the dragged distance onto the timeline's playhead. */
  scrub() {
    const e = this.options.timeline;
    if (!e) return;
    const n = e.duration;
    if (n <= 0) return;
    const s = this.options.scrubDistance ?? 500;
    if (s === 0) return;
    const i = (this.options.axis ?? "both") === "y" ? this.y : this.x, o = Xd(i / s);
    e.pause(), e.seek(o * n);
  }
  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  applyConstraints(e, n) {
    let s = e;
    const i = [
      ...zd([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], o = Kd([s], i, this.snapThreshold());
    s += o.delta, n === "x" ? this.snappedX = o.line : this.snappedY = o.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function Xd(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function Bb(t) {
  const e = new Dl(t);
  return e.start(), e;
}
const Ud = { x: "x", y: "y", "x,y": "both" }, Hi = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Sr(t, e) {
  const n = hs(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function Tr(t) {
  return Array.isArray(t) ? [...t] : t;
}
function Vd(t, e, n, s = {}) {
  const [i] = e.resolveTargets(n), o = i ? e.elementFor(i) : void 0;
  if (!i || !o)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return Gd(t, e, i, o, s);
  const r = Ud[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(i, "x"), m = e.appliedValue(i, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Hi(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Hi(s.bounds) ? s.bounds : void 0) ?? (l ? Sr(o, l) : void 0) };
  let u = null;
  const d = () => {
    u?.kill(), u = null;
  }, f = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, y = m.friction ?? (m.resistance !== void 0 ? wo(m.resistance) : 4), w = a(), b = h.bounds ?? {};
    let v, M;
    const x = m.end;
    if (Array.isArray(x)) {
      const A = is({ from: w.x, velocity: r === "y" ? 0 : p.x, friction: y }), k = is({ from: w.y, velocity: r === "x" ? 0 : p.y, friction: y });
      let O = x[0];
      for (const $ of x)
        Math.hypot($.x - A, $.y - k) < Math.hypot(O.x - A, O.y - k) && (O = $);
      O && (v = [O.x], M = [O.y]);
    } else typeof x == "number" ? (v = x, M = x) : x && (v = Tr(x.x), M = Tr(x.y));
    const T = {};
    r !== "y" && (T.x = { velocity: p.x, friction: y, min: b.minX, max: b.maxX, end: v }), r !== "x" && (T.y = { velocity: p.y, friction: y, min: b.minY, max: b.maxY, end: M }), u = t.to(o, { inertia: T, onComplete: () => s.onThrowComplete?.() });
  }, g = new Dl({
    target: o,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      d(), l && (h.bounds = Sr(o, l)), s.onPress?.();
    },
    onDrag: (p) => {
      e.apply(i, r === "x" ? { x: p.x } : r === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
    },
    onRelease: () => {
      const p = g.velocity;
      s.onRelease?.(p), s.inertia && f(p);
    }
  });
  return g.start(), {
    draggable: g,
    get position() {
      return a();
    },
    get rotation() {
      const p = e.appliedValue(i, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      d(), g.destroy();
    }
  };
}
function Gd(t, e, n, s, i) {
  const o = typeof i.bounds == "object" && i.bounds !== null && !Hi(i.bounds) ? i.bounds : {}, r = () => {
    const b = e.appliedValue(n, "rotate");
    return typeof b == "number" ? b : 0;
  }, a = (b) => Math.min(o.maxRotation ?? 1 / 0, Math.max(o.minRotation ?? -1 / 0, b));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, d = 0, f = 0, g = [];
  const p = (b) => Math.atan2(b.clientY - u.y, b.clientX - u.x) * 180 / Math.PI, m = (b) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = b.pointerId, s.setPointerCapture?.(b.pointerId);
    const v = s.getBoundingClientRect();
    u = { x: v.left + v.width / 2, y: v.top + v.height / 2 }, d = p(b), f = r(), g = [{ time: performance.now(), rotation: f }], i.onPress?.();
  }, y = (b) => {
    if (!c || b.pointerId !== h) return;
    const v = p(b);
    let M = v - d;
    M > 180 && (M -= 360), M < -180 && (M += 360), d = v, f += M;
    let x = a(f);
    i.snap && (x = a(Math.round(x / i.snap) * i.snap)), e.apply(n, { rotate: x });
    const T = performance.now();
    for (g.push({ time: T, rotation: x }); g.length > 2 && T - g[0].time > 100; ) g.shift();
    const A = { x: 0, y: 0 };
    i.onDrag?.(A);
  }, w = (b) => {
    if (!c || b.pointerId !== h) return;
    c = !1;
    const v = g[0], M = g[g.length - 1], x = v && M ? (M.time - v.time) / 1e3 : 0, T = x > 0 ? (M.rotation - v.rotation) / x : 0;
    if (i.onRelease?.({ x: T, y: 0 }), !i.inertia) return;
    const A = i.inertia === !0 ? {} : i.inertia, k = A.friction ?? (A.resistance !== void 0 ? wo(A.resistance) : 4), O = typeof A.end == "number" || Array.isArray(A.end) ? A.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: T,
          friction: k,
          min: o.minRotation,
          max: o.maxRotation,
          end: Array.isArray(O) ? O.filter(($) => typeof $ == "number") : O
        }
      },
      onComplete: () => i.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", y), s.addEventListener("pointerup", w), s.addEventListener("pointercancel", w), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", y), s.removeEventListener("pointerup", w), s.removeEventListener("pointercancel", w);
    }
  };
}
const Jd = { opacity: 0, scale: 0.6 };
function Zd(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function xr(t) {
  const e = hs(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Ci(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = Zd(r);
    i.set(r, a);
    const l = Nl(r);
    a && l !== void 0 && !o.has(l) && o.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: i, ids: o };
}
const Zs = /* @__PURE__ */ new WeakMap();
function Ri(t, e, n, s = {}) {
  const i = s.duration ?? 0.6, o = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Jd : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const f of t.resolveTargets(s.targets)) {
      const g = t.elementFor(f);
      g && c.add(g);
    }
  const h = [...c].sort(
    (f, g) => f === g ? 0 : f.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), u = e({ onComplete: s.onComplete });
  let d = 0;
  for (const f of h) {
    const g = xr(f);
    if (!g) continue;
    let p = n.boxes.get(f) ?? null, m;
    const y = Nl(f), w = !p && y !== void 0 ? n.ids.get(y) : void 0;
    w && w.element !== f && (p = w.box, m = w.element);
    const [b] = t.resolveTargets(f);
    Zs.get(f)?.timeline.removeTracks({ target: b });
    const v = d * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(f, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Wl(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: i, ease: o, delay: v }, 0), Zs.set(f, u), d++;
      continue;
    }
    const M = p.cx - g.cx, x = p.cy - g.cy, T = a ? p.width / g.width : 1, A = a ? p.height / g.height : 1;
    if (!(Math.abs(M) > 0.5 || Math.abs(x) > 0.5 || Math.abs(T - 1) > 1e-3 || Math.abs(A - 1) > 1e-3)) {
      const $ = (P, L) => {
        const _ = t.appliedValue(b, P);
        return typeof _ == "number" && Math.abs(_ - L) > 1e-6;
      };
      ($("x", 0) || $("y", 0) || $("scaleX", 1) || $("scaleY", 1)) && u.set(f, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const O = s.fade === !0 && m !== void 0;
    u.fromTo(
      f,
      { x: M, y: x, scaleX: T, scaleY: A, ...O && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...O && { opacity: 1 }, duration: i, ease: o, delay: v },
      0
    ), O && m && xr(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: i, ease: o, delay: v }, 0), Zs.set(f, u), d++;
  }
  return u;
}
function Nl(t) {
  return t.dataset?.flipId;
}
function Wl(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function Qd(t, e = {}) {
  const n = new Set((e.type ?? "chars,words,lines").split(",").map((p) => p.trim())), s = {
    chars: e.charsClass ?? "char",
    words: e.wordsClass ?? "word",
    lines: e.linesClass ?? "line"
  }, i = e.aria !== !1, o = t.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let r = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const h = () => {
    for (const { element: p, html: m, ariaLabel: y } of o)
      p.innerHTML = m, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, u = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, d = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of o) {
      const y = (m.textContent ?? "").replace(/\s+/g, " ").trim(), w = tf(m, s.words), b = n.has("chars") ? w.flatMap((x) => ef(x, s.chars)) : [], v = n.has("lines") ? sf(m, w, s.lines) : [];
      if (i) {
        !m.hasAttribute("aria-label") && y && m.setAttribute("aria-label", y);
        for (const x of w) x.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...w);
      else for (const x of w) x.removeAttribute("class");
      p.chars.push(...b), p.lines.push(...v);
      const M = e.mask === "lines" ? v : e.mask === "words" ? w : e.mask === "chars" ? b : [];
      for (const x of M) p.masks.push(of(x, `${s[e.mask]}-mask`));
    }
    r = p;
  }, f = {
    elements: t,
    get chars() {
      return r.chars;
    },
    get words() {
      return r.words;
    },
    get lines() {
      return r.lines;
    },
    get masks() {
      return r.masks;
    },
    split() {
      c || (u(), h(), d(), a = e.onSplit?.(f));
    },
    revert() {
      c = !0, l?.disconnect(), u(), h();
    }
  };
  d(), a = e.onSplit?.(f), e.autoSplit && g();
  function g() {
    const p = /* @__PURE__ */ new Map();
    let m = !1;
    const y = () => {
      if (m) return;
      m = !0;
      const b = () => {
        m = !1, f.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(b) : setTimeout(b, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((b) => {
        let v = !1;
        for (const M of b) {
          const x = Math.round(M.contentRect.width), T = p.get(M.target);
          p.set(M.target, x), T !== void 0 && T !== x && (v = !0);
        }
        v && y();
      });
      for (const b of t) l.observe(b);
    }
    const w = t[0]?.ownerDocument?.fonts;
    w && w.status !== "loaded" && w.ready.then(() => y());
  }
  return f;
}
function tf(t, e) {
  const n = t.ownerDocument, s = [], i = n.createTreeWalker(
    t,
    4
    /* NodeFilter.SHOW_TEXT */
  ), o = [];
  for (let r = i.nextNode(); r; r = i.nextNode()) o.push(r);
  for (const r of o) {
    const a = r.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const l = n.createDocumentFragment();
    for (const c of a) {
      if (/^\s/.test(c)) {
        l.appendChild(n.createTextNode(c));
        continue;
      }
      const h = n.createElement("span");
      h.className = e, h.style.display = "inline-block", h.textContent = c, l.appendChild(h), s.push(h);
    }
    r.replaceWith(l);
  }
  return s;
}
function ef(t, e) {
  const n = t.ownerDocument, s = nf(t.textContent ?? "").map((i) => {
    const o = n.createElement("span");
    return o.className = e, o.style.display = "inline-block", o.textContent = i, o;
  });
  return t.replaceChildren(...s), s;
}
function nf(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function sf(t, e, n) {
  const s = t.ownerDocument, i = new Map(e.map((g) => [g, g.getBoundingClientRect()])), o = [], r = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || i.has(p) || p.tagName === "BR" ? o.push(p) : r(p);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, u = !1, d = [];
  const f = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), d = [];
  };
  for (const g of o) {
    if (g.tagName === "BR") {
      u = !0;
      continue;
    }
    const p = i.get(g);
    if (p && (!l || u || p.top > c + h) && (f(), c = p.top, h = p.height / 2, u = !1), !l) continue;
    const m = [];
    for (let b = g.parentNode; b && b !== t; b = b.parentNode) m.unshift(b);
    let y = 0;
    for (; y < d.length && y < m.length && d[y].original === m[y]; ) y++;
    d.length = y;
    let w = y === 0 ? l : d[y - 1].clone;
    for (const b of m.slice(y)) {
      const v = b.cloneNode(!1);
      w.appendChild(v), d.push({ original: b, clone: v }), w = v;
    }
    w.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function of(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const Er = {
  top: 0,
  left: 0,
  start: 0,
  center: 0.5,
  centre: 0.5,
  middle: 0.5,
  bottom: 1,
  right: 1,
  end: 1
};
function Ar(t) {
  const e = t.trim().toLowerCase();
  if (e in Er) return Er[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function jl(t) {
  if (typeof t == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: t };
  let e = 0;
  const s = t.replace(/([+-])=\s*(-?[\d.]+)/g, (r, a, l) => (e += (a === "-" ? -1 : 1) * Number.parseFloat(l), "")).trim().split(/\s+/).filter(Boolean);
  if (s.length === 1 && /^-?[\d.]+$/.test(s[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(s[0]) + e
    };
  const i = s[0] !== void 0 ? Ar(s[0]) : void 0, o = s[1] !== void 0 ? Ar(s[1]) : void 0;
  return {
    elementFraction: i ?? 0,
    viewportFraction: o ?? 0,
    offsetPx: e
  };
}
function vn(t, e, n) {
  const s = jl(n), i = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, o = e * s.viewportFraction;
  return i - o + s.offsetPx;
}
function qb(t, e, n, s) {
  const i = vn(t, e, n), r = vn(t, e, s) - i;
  return r <= 0 ? i <= 0 ? 1 : 0 : Bl(-i / r);
}
function Bl(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function rf(t, e, n, s) {
  if (n <= 0) return e;
  const i = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * i;
}
function $r(t, e, n, s, i) {
  const o = (h) => vn({ top: t + i(h), bottom: t + i(h) + e, height: e }, n, s), r = o(0), a = o(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(o(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class af {
  timeline;
  trigger;
  behaviour;
  options;
  observer = null;
  hasPlayed = !1;
  running = !1;
  constructor(e) {
    this.timeline = e.timeline, this.trigger = e.trigger, this.behaviour = e.behaviour ?? "once", this.options = e;
  }
  start() {
    if (!this.running) {
      if (this.running = !0, typeof IntersectionObserver > "u") {
        this.enter();
        return;
      }
      this.observer = new IntersectionObserver(
        (e) => {
          for (const n of e)
            n.isIntersecting ? this.enter() : this.leave();
        },
        {
          threshold: this.options.threshold ?? 0.15,
          rootMargin: this.options.rootMargin,
          root: this.options.root ?? null
        }
      ), this.observer.observe(this.trigger);
    }
  }
  stop() {
    this.running = !1, this.observer?.disconnect(), this.observer = null;
  }
  destroy() {
    this.stop();
  }
  /** Forget that the animation has played, so 'once' can fire again. */
  reset() {
    this.hasPlayed = !1, this.timeline.stop();
  }
  enter() {
    this.options.onEnter?.(), !(this.behaviour === "once" && this.hasPlayed) && (this.hasPlayed = !0, this.behaviour !== "once" && this.timeline.seek(0), this.timeline.play());
  }
  leave() {
    this.options.onLeave?.(), this.behaviour === "reset" && this.timeline.stop();
  }
}
function Yb(t) {
  const e = new af(t);
  return e.start(), e;
}
class lf {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(e, n = {}) {
    this.element = e, this.axis = n.axis ?? "y", this.spacing = n.spacing ?? !0;
    const s = e.ownerDocument;
    this.spacer = s.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: e.style.position, top: e.style.top, left: e.style.left }, this.axis === "x" && (this.spacer.style.flexShrink = "0"), e.replaceWith(this.spacer), this.spacer.appendChild(e);
  }
  /**
   * Put the element back in the flow for measuring: unstuck, at the top of its
   * spacer, which is where it sits without pinning. The spacer keeps its height,
   * so the page does not change length and the scroll position is not clamped.
   */
  release() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left;
  }
  /** Stick at `topPx` from the scroller's top for `distancePx` of scrolling. */
  apply(e, n) {
    const s = Math.max(0, n);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + s}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${s}px`, this.element.style.left = `${e}px`) : (this.spacer.style.height = `${this.element.offsetHeight + s}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${s}px`, this.element.style.top = `${e}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const cf = 0.15;
function hf(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function uf(t, e, n) {
  const s = Fn(t + e * cf);
  if (typeof n == "function") return Fn(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : Fn(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let i = n[0];
  for (const o of n)
    Math.abs(o - s) < Math.abs(i - s) && (i = o);
  return Fn(i);
}
function df(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const i = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * i;
}
class ff {
  rafId = null;
  cancelEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  onInterrupt = () => this.cancel();
  write;
  eventTarget;
  constructor(e, n) {
    this.write = e, this.eventTarget = n;
  }
  get active() {
    return this.rafId !== null;
  }
  animate(e, n, s, i = As, o) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || s <= 0) {
      this.write(n), o?.();
      return;
    }
    for (const l of this.cancelEvents) this.eventTarget?.addEventListener(l, this.onInterrupt, { passive: !0 });
    let r = null;
    const a = (l) => {
      r ??= l;
      const c = Math.min(1, (l - r) / (s * 1e3));
      this.write(e + (n - e) * i(c)), c < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), o?.());
    };
    this.rafId = requestAnimationFrame(a);
  }
  cancel() {
    this.rafId !== null && typeof cancelAnimationFrame < "u" && cancelAnimationFrame(this.rafId), this.rafId = null, this.detach();
  }
  detach() {
    for (const e of this.cancelEvents) this.eventTarget?.removeEventListener(e, this.onInterrupt);
  }
}
function Fn(t) {
  return Math.max(0, Math.min(1, t));
}
class pf {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(e, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: i = "#3ecf7a", endColor: o = "#ff5a5a", id: r } = this.options, a = r ? `${r} ` : "", l = (c, h, u) => {
      const d = e.createElement("div");
      return d.textContent = `${a}${c}`, d.setAttribute("aria-hidden", "true"), d.className = "scroll-marker", Object.assign(d.style, {
        position: u ? "fixed" : "absolute",
        right: `${this.options.indent ?? 0}px`,
        zIndex: "2147483646",
        pointerEvents: "none",
        borderTop: `1px solid ${h}`,
        color: h,
        font: `${this.options.fontSize ?? "11px"} ui-monospace, monospace`,
        padding: "2px 6px",
        whiteSpace: "nowrap",
        background: "rgba(0, 0, 0, 0.35)"
      }), (n ?? e.body).appendChild(d), this.nodes.push(d), d;
    };
    this.scrollerStart = l("scroller-start", i, !n), this.scrollerEnd = l("scroller-end", o, !n), this.start = l("start", i, !1), this.end = l("end", o, !1), n && getComputedStyle(n).position === "static" && (n.style.position = "relative");
  }
  /** Place the markers for the latest measurement. */
  place(e, n) {
    this.start.style.top = `${e.startPage}px`, this.end.style.top = `${e.endPage}px`;
    const s = this.scroller ? n : 0;
    this.scrollerStart.style.top = `${s + e.startViewport}px`, this.scrollerEnd.style.top = `${s + e.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(e, n) {
    this.scroller && this.place(e, n);
  }
  destroy() {
    for (const e of this.nodes.splice(0)) e.remove();
  }
}
const gf = 120, We = [], Ge = /* @__PURE__ */ new Set();
let Qs = !1;
const mf = () => {
  Qs || Ge.size === 0 || (Qs = !0, queueMicrotask(() => {
    Qs = !1;
    for (const t of Ge) t.afterRefresh();
  }));
}, ql = () => {
  for (const t of Ge) t.beforeRefresh();
  for (const t of We) t.refresh();
  for (const t of Ge) t.afterRefresh();
};
let je = { width: 0, height: 0 };
const Pr = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === je.width && e !== je.height, s = Math.abs(e - je.height) < je.height * 0.25, i = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && i || (je = { width: t, height: e }, ql());
};
class _s {
  timeline;
  options;
  running = !1;
  pin = null;
  /** The range, as absolute scroll offsets. */
  startPx = 0;
  endPx = 0;
  /** Progress the page is actually at */
  targetProgress = 0;
  /** Progress the playhead is showing (differs from target only while smoothing) */
  displayProgress = 0;
  zone = "before";
  /** Until the first measurement, smoothing starts at the page's position rather than easing from 0. */
  measured = !1;
  lastScroll = null;
  lastScrollTime = 0;
  velocityPxPerSecond = 0;
  idleTimer = null;
  lastEmitted = null;
  rafId = null;
  lastFrameTime = null;
  onScroll = () => this.update();
  /** Speed when scrolling last stopped, for choosing a snap point */
  releaseVelocity = 0;
  snapper;
  snapTimer = null;
  markers = null;
  markerGeometry = null;
  constructor(e) {
    this.timeline = e.timeline, this.options = e, this.snapper = new ff((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new lf(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new pf(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), We.length === 0 && typeof window < "u" && (je = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Pr, { passive: !0 })), We.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), We.splice(We.indexOf(this), 1), We.length === 0 && typeof window < "u" && window.removeEventListener("resize", Pr), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
  }
  /** Stop, and remove any pin spacer. */
  destroy() {
    this.stop(), this.pin?.destroy(), this.pin = null, this.markers?.destroy(), this.markers = null;
  }
  /** The range's start and end, as scroll offsets. */
  get startOffset() {
    return this.startPx;
  }
  get endOffset() {
    return this.endPx;
  }
  /**
   * Re-measure every started driver, in the order they started. Call after a
   * layout change a resize would not catch (images or fonts loading).
   */
  static refreshAll() {
    ql();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return Ge.add(e), () => Ge.delete(e);
  }
  /** Current scroll progress, 0..1. */
  get progress() {
    return this.targetProgress;
  }
  /** Scroll speed in pixels per second (0 once scrolling has stopped). */
  get velocity() {
    return this.velocityPxPerSecond;
  }
  /**
   * Measure the page again and update. Resizes do this automatically (for every
   * driver, in the order they started, so a pin above pushes the ones below);
   * call it after changing layout yourself — images or fonts loading, content
   * added above the trigger.
   */
  refresh() {
    if (!this.running) return;
    this.measured && this.options.onRefresh?.();
    const e = this.scrollPosition();
    this.pin?.release();
    const n = this.triggerRect();
    if (n && this.options.container)
      this.measureInContainer(this.options.container);
    else if (n) {
      const s = this.viewportHeight();
      if (this.startPx = e + vn(n, s, rn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const i = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(i.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, mf();
  }
  /** Same as `refresh()`. */
  sample() {
    this.refresh();
  }
  /**
   * Update from the current scroll position, or from `scrollPosition` when a
   * smooth-scrolling library (or anything else) owns the scroll value. Costs no
   * layout reads.
   */
  update(e) {
    this.running && this.updateFrom(e ?? this.scrollPosition(), !1);
  }
  // --- internals ----------------------------------------------------------
  updateFrom(e, n) {
    this.trackVelocity(e), this.markers && this.markerGeometry && this.markers.follow(this.markerGeometry, e);
    const s = this.endPx - this.startPx, i = this.zone;
    this.targetProgress = s > 0 ? Bl((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(i, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const i = rn(this.options.end) ?? "bottom top", o = typeof i == "string" ? i.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (o) {
      const r = Number.parseFloat(o[1]);
      return this.startPx + (o[2] === "%" ? n * r / 100 : r);
    }
    return s + vn(e, n, i);
  }
  applyProgress() {
    const e = this.timeline?.duration ?? 0;
    this.timeline && e > 0 && this.timeline.seek(this.displayProgress * e), this.emitUpdate();
  }
  emitUpdate() {
    if (!this.options.onUpdate) return;
    const e = [this.displayProgress, this.velocityPxPerSecond];
    this.lastEmitted && this.lastEmitted[0] === e[0] && this.lastEmitted[1] === e[1] || (this.lastEmitted = e, this.options.onUpdate(e[0], e[1]));
  }
  trackVelocity(e) {
    const n = typeof performance < "u" ? performance.now() : Date.now();
    this.lastScroll !== null && n > this.lastScrollTime && e !== this.lastScroll && (this.velocityPxPerSecond = (e - this.lastScroll) / (n - this.lastScrollTime) * 1e3), (this.lastScroll === null || e !== this.lastScroll) && (this.lastScroll = e, this.lastScrollTime = n), !(this.velocityPxPerSecond === 0 || typeof setTimeout > "u") && (this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = setTimeout(() => {
      this.idleTimer = null, this.releaseVelocity = this.velocityPxPerSecond, this.velocityPxPerSecond = 0, this.emitUpdate(), this.scheduleSnap();
    }, gf));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(e, n) {
    if (e === n) return;
    const { onEnter: s, onLeave: i, onEnterBack: o, onLeaveBack: r } = this.options;
    e === "before" ? (s?.(), n === "after" && i?.()) : e === "after" ? (o?.(), n === "before" && r?.()) : n === "after" ? i?.() : r?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const e = this.options.snap;
    if (e === void 0 || this.snapper.active) return;
    const n = hf(e), s = () => {
      this.snapTimer = null;
      const i = this.endPx - this.startPx, o = this.scrollPosition();
      if (!this.running || i <= 0 || o <= this.startPx || o >= this.endPx) return;
      const r = (o - this.startPx) / i, a = this.startPx + uf(r, this.releaseVelocity / i, n.snapTo) * i;
      Math.abs(a - o) < 1 || this.snapper.animate(o, a, df(n, a - o, this.viewportHeight()), n.ease);
    };
    n.delay ? this.snapTimer = setTimeout(s, n.delay * 1e3) : s();
  }
  scrollTo(e) {
    const n = this.options.scroller, s = this.options.horizontal ? { left: e } : { top: e };
    n ? typeof n.scrollTo == "function" ? n.scrollTo({ ...s, behavior: "instant" }) : this.options.horizontal ? n.scrollLeft = e : n.scrollTop = e : typeof window < "u" && window.scrollTo({ ...s, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(e) {
    const n = this.options.trigger;
    if (typeof n?.getBoundingClientRect != "function") return;
    const s = n.getBoundingClientRect(), i = this.options.scroller?.getBoundingClientRect?.().left ?? 0, o = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - i - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (f) => a + f * (l - a), h = $r(r, s.width, o, rn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = rn(this.options.end) ?? "right left", d = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = d ? this.startPx + Number.parseFloat(d[1]) : c($r(r, s.width, o, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (o, r) => {
      const a = rn(o) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = jl(a);
      return e * l.viewportFraction - l.offsetPx;
    }, s = n(this.options.start, "top bottom") ?? 0, i = n(this.options.end, "bottom top") ?? s;
    return {
      startViewport: s,
      endViewport: i,
      startPage: this.startPx + s,
      endPage: this.endPx + i
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const e = (n) => {
      if (this.rafId = null, !this.running) return;
      const s = this.lastFrameTime === null ? 16.67 : n - this.lastFrameTime;
      this.lastFrameTime = n, this.displayProgress = rf(this.displayProgress, this.targetProgress, this.smoothing(), s);
      const i = Math.abs(this.targetProgress - this.displayProgress) < 1e-4;
      i && (this.displayProgress = this.targetProgress), this.applyProgress(), i ? this.lastFrameTime = null : this.rafId = requestAnimationFrame(e);
    };
    this.rafId = requestAnimationFrame(e);
  }
  stopSmoothing() {
    this.rafId !== null && typeof cancelAnimationFrame < "u" && cancelAnimationFrame(this.rafId), this.rafId = null, this.lastFrameTime = null;
  }
  scrollTarget() {
    return this.options.scroller ?? (typeof window < "u" ? window : null);
  }
  scrollPosition() {
    const e = this.options.scroller, n = this.options.horizontal;
    return e ? (n ? e.scrollLeft : e.scrollTop) ?? 0 : typeof window < "u" ? (n ? window.scrollX : window.scrollY) ?? 0 : 0;
  }
  triggerRect() {
    const e = this.options.trigger;
    return typeof e?.getBoundingClientRect != "function" ? null : this.relativeRect(e.getBoundingClientRect());
  }
  /**
   * A viewport rect along the scroll axis, relative to the scroll container when
   * there is one. Horizontal scrolling reports left / right / width as top / bottom / height.
   */
  relativeRect(e) {
    const n = this.options.horizontal, s = n ? e.left ?? 0 : e.top, i = n ? e.right ?? 0 : e.bottom, o = n ? e.width ?? 0 : e.height, r = this.options.scroller;
    if (r && typeof r.getBoundingClientRect == "function") {
      const a = r.getBoundingClientRect(), l = n ? a.left : a.top;
      return { top: s - l, bottom: i - l, height: o };
    }
    return { top: s, bottom: i, height: o };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const e = this.options.scroller, n = this.options.horizontal;
    return e ? n ? e.clientWidth : e.clientHeight : typeof window < "u" ? n ? window.innerWidth : window.innerHeight : 0;
  }
}
function rn(t) {
  return typeof t == "function" ? t() : t;
}
function Kb(t) {
  const e = new _s(t);
  return e.start(), e;
}
const ti = /* @__PURE__ */ new Set(), yf = 16, _r = 0.5, bf = 2;
class Or {
  options;
  frames;
  running = !1;
  reduced = !1;
  current = 0;
  target = 0;
  written = null;
  velocityPxPerSecond = 0;
  frameId = null;
  lastTime = null;
  journey = null;
  pausedState = !1;
  effects = [];
  onWheel = (e) => this.wheel(e);
  onScroll = () => this.nativeScroll();
  onResize = () => this.refresh();
  onLoad = () => this.refresh();
  /** Scroll triggers measure with effect layers at rest, and effects measure after pins. */
  stopListening = null;
  constructor(e = {}) {
    this.options = e, this.frames = e.frames ?? {
      request: (n) => requestAnimationFrame(n),
      cancel: (n) => cancelAnimationFrame(n)
    };
  }
  start() {
    if (this.running || typeof window > "u") return this;
    this.running = !0, this.reduced = this.options.reducedMotion ?? (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches), this.current = this.target = this.position();
    const e = this.options.scroller ?? window;
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), ti.add(this), this.stopListening = _s.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of ti) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), ti.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) ei(e.element, e.saved);
    this.effects = [];
  }
  /** GSAP's name for `destroy()`. */
  kill() {
    this.destroy();
  }
  get state() {
    const e = this.limit();
    return { scroll: this.current, target: this.target, progress: e > 0 ? this.current / e : 0, velocity: this.velocityPxPerSecond };
  }
  /** Stop responding to the wheel (e.g. while a modal is open); `paused(false)` resumes. */
  paused(e) {
    return e !== void 0 && (this.pausedState = e, e && (this.target = this.current, this.journey = null)), this.pausedState;
  }
  /**
   * Scroll to an offset, an element or a selector, eased. Wheel input during the
   * trip takes over from wherever it has got to.
   */
  scrollTo(e, n = {}) {
    if (!this.running) return;
    const s = this.clamp(this.resolve(e) + (n.offset ?? 0)), i = Math.abs(s - this.current), o = this.reduced ? 0 : n.duration ?? Math.min(1.2, Math.max(0.4, i / 2500));
    if (o <= 0) {
      this.journey = null, this.current = this.target = s, this.write(s), this.applyEffects(0);
      return;
    }
    this.target = s, this.journey = { from: this.current, to: s, ms: o * 1e3, ease: n.ease ?? As, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const e = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (e && !this.reduced) {
      const n = this.options.scroller ?? document, s = this.position(), i = this.viewportHeight(), o = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const r of n.querySelectorAll(e)) {
        const a = Number.parseFloat(r.dataset.speed ?? ""), l = Number.parseFloat(r.dataset.lag ?? ""), c = r.getBoundingClientRect(), h = c.top - o + s;
        this.effects.push({
          element: r,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(l) && l > 0 ? l : void 0,
          centre: h + c.height / 2 - i / 2,
          lagged: s,
          shift: 0,
          saved: r.style.getPropertyValue("translate")
        });
      }
    }
    this.current = this.target = this.clamp(this.position()), this.applyEffects(0);
  }
  /** Put effect elements at their natural place, for measuring. */
  rest() {
    for (const e of this.effects) ei(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? yf : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), i = this.clamp(this.target + s);
    i === this.target && i === this.current || (e.preventDefault(), this.journey = null, this.target = i, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= bf || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
  }
  nestedScrollerTakes(e) {
    const n = this.options.scroller ?? document.documentElement;
    for (let s = e.target; s && s !== n && s !== document.body; s = s.parentElement) {
      if (s.hasAttribute?.("data-smooth-ignore")) return !0;
      const i = getComputedStyle(s);
      if (!/(auto|scroll)/.test(i.overflowY) || s.scrollHeight <= s.clientHeight) continue;
      if (e.deltaY < 0 ? s.scrollTop > 0 : s.scrollTop + s.clientHeight < s.scrollHeight - 1) return !0;
    }
    return !1;
  }
  // --- frames ---------------------------------------------------------------
  requestFrame() {
    this.frameId !== null || !this.running || (this.frameId = this.frames.request((e) => this.frame(e)));
  }
  cancelFrame() {
    this.frameId !== null && this.frames.cancel(this.frameId), this.frameId = null, this.lastTime = null;
  }
  frame(e) {
    this.frameId = null;
    const n = this.lastTime === null ? 1e3 / 60 : Math.min(100, e - this.lastTime);
    this.lastTime = e;
    const s = this.current;
    if (this.journey) {
      const o = this.journey;
      o.elapsed += n;
      const r = Math.min(1, o.elapsed / o.ms);
      this.current = o.from + (o.to - o.from) * o.ease(r), r >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const o = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-n / o)), Math.abs(this.target - this.current) < _r && (this.current = this.target);
    }
    this.current !== s && this.write(this.current), this.velocityPxPerSecond = n > 0 ? (this.current - s) * 1e3 / n : 0;
    const i = this.applyEffects(n);
    this.current !== s && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || i ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(e) {
    let n = !1;
    const s = this.current;
    for (const i of this.effects) {
      let o = 0;
      if (i.speed !== void 0 && (o += (s - i.centre) * (1 - i.speed)), i.lag !== void 0) {
        const r = i.lag * 1e3 / 3;
        i.lagged = e === 0 ? s : i.lagged + (s - i.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - i.lagged) < _r ? i.lagged = s : n = !0, o += s - i.lagged;
      }
      ei(i.element, o === 0 ? i.saved : `0 ${wf(o)}px`), i.shift = o;
    }
    return n;
  }
  // --- geometry -------------------------------------------------------------
  write(e) {
    const n = Math.round(e);
    this.written = n;
    const s = this.options.scroller;
    s ? s.scrollTop = n : window.scrollTo({ top: n, behavior: "instant" });
  }
  position() {
    const e = this.options.scroller;
    return e ? e.scrollTop : window.scrollY;
  }
  viewportHeight() {
    const e = this.options.scroller;
    return e ? e.clientHeight : window.innerHeight;
  }
  limit() {
    const e = this.options.scroller ?? document.documentElement;
    return Math.max(0, e.scrollHeight - this.viewportHeight());
  }
  clamp(e) {
    return Math.max(0, Math.min(this.limit(), e));
  }
  resolve(e) {
    if (typeof e == "number") return e;
    const n = this.options.scroller ?? document, s = typeof e == "string" ? n.querySelector(e) : e;
    if (!s) return this.current;
    const i = this.options.scroller?.getBoundingClientRect().top ?? 0, o = this.effects.find((r) => r.element === s)?.shift ?? 0;
    return s.getBoundingClientRect().top - i + this.position() - o;
  }
}
function ei(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function wf(t) {
  return Math.round(t * 100) / 100;
}
function kf(t, e) {
  switch (e) {
    // Play forward from wherever it is; reverse() flips a reversed timeline and plays.
    // Neither restarts an animation that is already at that end.
    case "play":
      if (t.progress() >= 1) break;
      t.reversed() ? t.reverse() : t.play();
      break;
    case "reverse":
      if (t.progress() <= 0) break;
      t.reversed() ? t.play() : t.reverse();
      break;
    case "pause":
      t.pause();
      break;
    case "resume":
      t.resume();
      break;
    case "restart":
      t.restart();
      break;
    case "reset":
      t.pause(), t.progress(0);
      break;
    case "complete":
      t.pause(), t.progress(1);
      break;
  }
}
function ko(t, e, n, s, i = () => {
}) {
  const o = (f) => typeof f == "string" ? t.query(f) ?? void 0 : f, r = o(e.trigger) ?? s;
  if (!r) {
    i(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (f, g) => () => {
    g?.(), n && !a && kf(n, l[f] ?? "none"), e.once && f === 0 && queueMicrotask(() => h.destroy());
  }, d = e.containerAnimation ? Sf(t, e.containerAnimation, r, i) : void 0;
  return h = new _s({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : o(e.pin),
    scroller: o(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : vf(e.snap, n),
    markers: e.markers,
    container: d,
    onUpdate: (f, g) => {
      if (n && a !== !1 && n.progress(f), e.onUpdate) {
        const p = f < c || g < 0 ? -1 : 1;
        e.onUpdate({ progress: f, velocity: g, direction: p });
      }
      c = f;
    },
    onEnter: u(0, e.onEnter),
    onLeave: u(1, e.onLeave),
    onEnterBack: u(2, e.onEnterBack),
    onLeaveBack: u(3, e.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), t.own(h);
}
function vf(t, e) {
  const n = (i) => i === "labels" ? (o) => Mf(o, e?.labelProgresses?.() ?? []) : i;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? ls(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? $t(s.easing) : void 0
  };
}
function Mf(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Sf(t, e, n, s) {
  const i = () => e.timeline.getTracks({ property: "x" }).map((o) => o.target).filter((o) => {
    const r = t.elementFor(o);
    return !!r && r !== n && r.contains(n);
  });
  return i().length === 0 && s("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const o = e.scrollTrigger;
      return o || s("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: o?.startOffset ?? 0, end: o?.endOffset ?? 0 };
    },
    progress: () => e.progress(),
    shiftAt: (o) => {
      const r = e.timeline.getStateAtTime(o * e.timeline.duration);
      let a = 0;
      for (const l of i()) {
        const c = r.values.get(l)?.get("x");
        typeof c == "number" && (a += c);
      }
      return a;
    }
  };
}
class Yl {
  /** For contexts made by matchMedia: which named queries match */
  conditions = {};
  scope;
  host;
  items = [];
  snapshots = /* @__PURE__ */ new Map();
  constructor(e, n) {
    this.host = e, this.scope = n;
  }
  /**
   * Run `fn` with this context collecting, and return what it returns. A function
   * it returns is kept as cleanup and called on `revert()`.
   */
  add(e) {
    const n = this.host.collector;
    this.host.setCollector(this);
    try {
      const s = e();
      return typeof s == "function" && this.items.push({ revert: s }), s;
    } finally {
      this.host.setCollector(n);
    }
  }
  track(e) {
    this.items.push(e);
  }
  touch(e, n) {
    this.snapshots.has(e) || this.snapshots.set(e, { name: n, style: e.getAttribute("style"), d: e.getAttribute("d") });
  }
  /** Undo everything, newest first, and restore the elements this context animated. */
  revert() {
    for (const e of this.items.splice(0).reverse())
      e.revert ? e.revert() : e.kill ? e.kill() : e.destroy?.();
    for (const [e, { name: n, style: s, d: i }] of this.snapshots)
      s === null ? e.removeAttribute("style") : e.setAttribute("style", s), i !== null && e.setAttribute("d", i), this.host.forget(n);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class Tf {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(e, n) {
    this.host = e, this.scope = n;
  }
  add(e, n) {
    const s = { conditions: e, setup: n, queries: /* @__PURE__ */ new Map() }, i = typeof e == "string" ? { matches: e } : e;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [o, r] of Object.entries(i)) {
        const a = window.matchMedia(r);
        s.queries.set(o, a);
        const l = () => this.scheduleUpdate();
        a.addEventListener("change", l), this.listeners.push(() => a.removeEventListener("change", l));
      }
    return this.entries.push(s), this.update(s), this;
  }
  /** Revert every active setup and stop listening. */
  revert() {
    for (const e of this.listeners.splice(0)) e();
    for (const e of this.entries.splice(0)) e.context?.revert();
  }
  kill() {
    this.revert();
  }
  /** Several queries change on one resize; handle them together. */
  scheduleUpdate() {
    this.scheduled || (this.scheduled = !0, queueMicrotask(() => {
      this.scheduled = !1;
      for (const e of this.entries) this.update(e);
    }));
  }
  update(e) {
    const n = {};
    for (const [r, a] of e.queries) n[r] = a.matches;
    const s = Object.values(n).some(Boolean), i = s ? JSON.stringify(n) : void 0;
    if (i === e.key || (e.context?.revert(), e.context = void 0, e.key = i, !s)) return;
    const o = new Yl(this.host, this.scope);
    o.conditions = n, o.add(() => e.setup(o)), e.context = o;
  }
}
class xf {
  frames;
  canvas;
  context;
  options;
  images;
  ready;
  current = 0;
  drawn = -1;
  loadedCount = 0;
  inFlight = 0;
  destroyed = !1;
  onResize = () => this.resize();
  constructor(e, n) {
    this.canvas = e, this.context = e.getContext("2d"), this.options = n, this.frames = Math.max(1, Math.floor(n.frames)), this.images = new Array(this.frames), this.ready = new Array(this.frames).fill(!1), typeof window < "u" && window.addEventListener("resize", this.onResize, { passive: !0 }), this.resize(), this.pump();
  }
  /** The frame on screen (fractional values show the nearest frame) */
  get frame() {
    return this.current;
  }
  set frame(e) {
    this.current = Math.max(0, Math.min(this.frames - 1, e)), this.draw();
  }
  /** How many frames have loaded */
  get loaded() {
    return this.loadedCount;
  }
  /** Stop loading, forget the images, and stop listening for resizes. */
  destroy() {
    this.destroyed = !0, typeof window < "u" && window.removeEventListener("resize", this.onResize);
    for (const e of this.images) e && (e.src = "");
  }
  /** Match the canvas's pixels to its size on screen, then redraw. */
  resize() {
    const e = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, n = Math.round(this.canvas.clientWidth * e), s = Math.round(this.canvas.clientHeight * e);
    n > 0 && s > 0 && (this.canvas.width !== n || this.canvas.height !== s) && (this.canvas.width = n, this.canvas.height = s), this.drawn = -1, this.draw();
  }
  draw() {
    const e = Math.round(this.current), n = this.nearestReady(e);
    if (n === -1 || n === this.drawn || !this.context) return;
    const s = this.images[n], { width: i, height: o } = this.canvas, r = (this.options.fit ?? "cover") === "cover" ? Math.max(i / s.naturalWidth, o / s.naturalHeight) : Math.min(i / s.naturalWidth, o / s.naturalHeight), a = s.naturalWidth * r, l = s.naturalHeight * r;
    this.context.clearRect(0, 0, i, o), this.context.drawImage(s, (i - a) / 2, (o - l) / 2, a, l), this.drawn = n, this.pump();
  }
  /** The loaded frame closest to `index`, or -1. */
  nearestReady(e) {
    for (let n = 0; n < this.frames; n++) {
      if (e - n >= 0 && this.ready[e - n]) return e - n;
      if (e + n < this.frames && this.ready[e + n]) return e + n;
    }
    return -1;
  }
  /** Start loads, nearest to the current frame first, up to the concurrency. */
  pump() {
    const e = this.options.concurrency ?? 6, n = Math.round(this.current);
    for (let s = 0; s < this.frames && this.inFlight < e; s++)
      for (const i of s === 0 ? [n] : [n + s, n - s])
        i < 0 || i >= this.frames || this.images[i] || this.inFlight >= e || this.load(i);
  }
  load(e) {
    const n = new Image();
    n.decoding = "async", this.images[e] = n, this.inFlight++;
    const s = (i) => {
      if (!this.destroyed) {
        if (this.inFlight--, i) {
          this.ready[e] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const o = Math.round(this.current);
          (Math.abs(e - o) < Math.abs(this.drawn - o) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    n.onload = () => s(!0), n.onerror = () => s(!1), n.src = this.options.url(e);
  }
}
const Ef = { opacity: 0, y: -16 }, Af = { opacity: 0, y: 16 };
async function $f(t, e, n, s) {
  const i = e.collector?.scope ?? e.root, o = i.ownerDocument ?? i, r = () => s.shared ? [...i.querySelectorAll(s.shared)] : [];
  if (s.native && typeof o.startViewTransition == "function")
    return Pf(o, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((y) => {
    m(y) || y();
  }), h = r(), u = h.length ? Ci(e, h) : void 0, d = s.from !== void 0 ? Ir(e, s.from, s.shared) : [];
  if (d.length && s.leave !== !1) {
    const m = s.leave ?? Ef;
    await c((y) => t.to(d, { ...m, duration: a, ease: l, onComplete: y }));
  }
  await s.update();
  const f = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? Ir(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? Af;
    f.push(c((y) => t.fromTo(p, m, { ...Wl(m), duration: a, ease: l, onComplete: y })));
  }
  if (u) {
    const m = r().filter((y) => !h.includes(y));
    m.length && f.push(
      c(
        (y) => Ri(e, n, u, {
          targets: m,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(f);
}
function Ir(t, e, n) {
  const s = t.resolveTargets(e).map((i) => t.elementFor(i)).filter((i) => !!i);
  return n ? s.flatMap((i) => !i.querySelector(n) && !i.matches(n) ? [i] : [...i.children].filter((o) => !o.matches(n) && !o.querySelector(n))) : s;
}
async function Pf(t, e, n) {
  const s = (a, l) => {
    const c = a.dataset?.flipId;
    c && a.style.setProperty("view-transition-name", l ? `tf-${c.replace(/[^\w-]/g, "-")}` : "");
  }, i = n();
  i.forEach((a) => s(a, !0));
  let o = [];
  await t.startViewTransition(async () => {
    i.forEach((a) => s(a, !1)), await e.update(), o = n(), o.forEach((a) => s(a, !0));
  }).finished, o.forEach((a) => s(a, !1));
}
const _f = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => yo(t, _u(e))
}, Of = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => yo(t, { fn: Ou(e) })
}, If = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => yo(t, { fn: Iu(e) })
}, Hf = /* @__PURE__ */ new Set([
  "keyframes",
  "duration",
  "delay",
  "ease",
  "easeEach",
  "stagger",
  "repeat",
  "repeatDelay",
  "yoyo",
  "repeatRefresh",
  "paused",
  "id",
  "onStart",
  "onUpdate",
  "onComplete",
  "onRepeat",
  "onReverseComplete",
  "scrollTrigger"
]), Hr = 0.5, Cf = "power1.inOut";
function Rf(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function Lf(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) Hf.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? Hr
    }));
  const s = Object.entries(e), i = t.duration ?? Hr, o = e.easeEach ?? t.easeEach ?? Cf;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([d]) => d !== "easeEach").map(([d, f]) => ({ at: Number.parseFloat(d) / 100, step: f })).sort((d, f) => d.at - f.at), h = [];
    let u = 0;
    for (const { at: d, step: f } of c) {
      const g = Math.max(0, d - u);
      h.push({ ...n, ease: o, ...f, duration: g * i }), u = d;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: o, duration: i / a };
    for (const [u, d] of r)
      c < d.length && (h[u] = d[c]);
    l.push(h);
  }
  return l;
}
function Cr(t, e, n, s = {}) {
  const i = e.collector?.scope ?? e.root, o = typeof s.scroller == "string" ? i.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: o ? o.scrollLeft : window.scrollX,
    y: o ? o.scrollTop : window.scrollY
  }, a = {
    x: o ? o.scrollWidth - o.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: o ? o.scrollHeight - o.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (w, b) => {
    if (b === void 0) return r[w];
    if (typeof b == "number") return b;
    if (b === "max") return a[w];
    const v = typeof b == "string" ? i.querySelector(b) : b;
    if (!v) return r[w];
    const M = v.getBoundingClientRect(), x = o?.getBoundingClientRect(), T = (w === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return w === "x" ? M.left - (x?.left ?? 0) + r.x - T : M.top - (x?.top ?? 0) + r.y - T;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, d = () => {
    o ? (o.scrollLeft = u.x, o.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, f = ["wheel", "touchstart", "keydown"], g = o ?? window, p = () => {
    y.kill(), m();
  }, m = () => {
    for (const w of f) g.removeEventListener(w, p);
  }, y = t.to(u, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      d(), s.onUpdate?.();
    },
    onComplete: () => {
      m(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const w of f) g.addEventListener(w, p, { passive: !0 });
  return y;
}
function Ff(t, e, n) {
  const s = t.collector?.scope ?? t.root, i = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: o = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, d = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, f = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (y) => {
    g[y] !== void 0 && clearTimeout(g[y]), g[y] = void 0;
    const w = f[y].splice(0);
    w.length > 0 && d[y]?.(w);
  }, m = (y, w) => {
    if (d[y]) {
      if (f[y].push(w), r !== void 0 && f[y].length >= r) return p(y);
      g[y] === void 0 && (g[y] = setTimeout(() => p(y), o * 1e3));
    }
  };
  return i.map(
    (y) => ko(t, {
      ...u,
      trigger: y,
      onEnter: () => m("onEnter", y),
      onLeave: () => m("onLeave", y),
      onEnterBack: () => m("onEnterBack", y),
      onLeaveBack: () => m("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class ee {
  /** The compiled compat timeline. */
  compat;
  stage;
  options;
  /** Cleared once playback has been started or explicitly controlled. */
  autoplayPending;
  started = !1;
  killed = !1;
  /** The building calls, in order, so `invalidate()` can replay them. */
  recipe = [];
  /** The first element any tween targeted: a scroll trigger's default trigger. */
  firstElement;
  scrollDriver;
  /** Callbacks and pauses placed on the timeline (`call`, `addPause`, tween onStart / onComplete) */
  events = [];
  ranges = [];
  /** Where the playhead was when callbacks were last worked out */
  playhead = { time: 0, iteration: 0, direction: "forward", fresh: !0 };
  /** A plain repeat is waiting out its delay; the next loop starts fresh from 0 */
  waitingToWrap = !1;
  /** The engine finished during this frame; completion callbacks run after the frame's events */
  finishedThisFrame = !1;
  /** Set by `reverse()`: arriving at the start is a reverse completion */
  backwards = !1;
  constructor(e, n = {}) {
    this.stage = e;
    const s = { ...n, onWarning: n.onWarning ?? e.onWarning };
    if (this.options = s, this.compat = new Be({
      ...s,
      startValue: (i, o) => {
        const r = e.objectFor(i);
        if (r) return jf(r[o]);
        const a = e.appliedValue(i, o);
        if (a !== void 0) return a;
        if (o === "d") return Fl(e.elementFor(i)) ?? void 0;
        if (o === "text") return e.elementFor(i)?.textContent ?? void 0;
        if (o === "strokeDasharray" || o === "strokeDashoffset") {
          const l = Fr(e.elementFor(i));
          if (l !== void 0) return o === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (i, o) => e.velocityOf(i, o),
      layoutColumns: (i) => Lr(i.map((o) => e.elementFor(o))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ko(e, i, this, this.firstElement, (o) => s.onWarning?.(o)));
      });
    }
    this.autoplayPending && queueMicrotask(() => {
      this.autoplayPending && this.play();
    });
  }
  /** The engine timeline. */
  get timeline() {
    return this.compat.timeline;
  }
  /** The scroll driver behind `scrollTrigger`, once attached (after a microtask). */
  get scrollTrigger() {
    return this.scrollDriver;
  }
  // --- building -----------------------------------------------------------
  to(e, n, s) {
    return Rf(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.to(o, i, r)));
  }
  from(e, n, s) {
    return this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.from(o, i, r)));
  }
  fromTo(e, n, s, i) {
    return this.record(
      () => this.tween(e, [n, s], i, ([o, r], a, l) => this.compat.fromTo(a, o, r, l))
    );
  }
  set(e, n, s) {
    return this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.set(o, i, r)));
  }
  addLabel(e, n) {
    return this.record(() => this.compat.addLabel(e, n));
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(e, n) {
    return this.record(() => {
      e.autoplayPending = !1, e.timeline.stop(), e.stage.deactivate(e.timeline), this.compat.add(e.compat, n);
    });
  }
  /**
   * Build the timeline again from the same calls: rewind to the start (so start
   * values are read from what elements show before it ran), rebuild every tween —
   * re-running function values — and return to the same progress. Use after a
   * layout change; `scrollTrigger: { invalidateOnRefresh: true }` does it on refresh.
   */
  invalidate() {
    const e = this.compat.progress();
    this.compat.progress(0), this.stage.render(this.timeline), this.compat.reset(), this.events = [], this.ranges = [];
    for (const n of this.recipe) n();
    return this.syncDuration(), this.compat.progress(e), this.stage.render(this.timeline), this;
  }
  /**
   * Run `callback` when the playhead crosses `position` (default: the end so far),
   * in either direction (GSAP's `call`). It takes no time, but a call after the
   * last tween makes the timeline that long.
   */
  call(e, n = [], s) {
    return this.record(() => {
      const i = this.compat.addEvent(s);
      this.events.push({ time: i, run: () => e(...n) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(e, n, s = []) {
    return this.record(() => {
      const i = this.compat.addEvent(e);
      this.events.push({ time: i, pause: !0, run: () => n?.(...s) });
    });
  }
  /**
   * Pause, and animate the playhead from where it is to `position` (seconds or a
   * label), firing callbacks on the way. Returns the tween that moves it.
   */
  tweenTo(e, n = {}) {
    return this.tweenFromTo(this.timeline.currentTime / 1e3, e, n);
  }
  /** Jump to `from`, then animate the playhead to `to` (seconds or labels). */
  tweenFromTo(e, n, s = {}) {
    this.pause(), this.seek(e);
    const i = this.timeline.currentTime, o = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: i }, a = s.duration ?? Math.abs(o - i) / 1e3 / (this.timeScale() || 1), l = new ee(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
    return l.to(r, {
      time: o,
      duration: a,
      ease: s.ease ?? "none",
      onUpdate: () => {
        this.moveTo(r.time), s.onUpdate?.();
      }
    }), l;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const e = this.timeline.playbackState === "playing", n = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !e) {
      const s = this.timeline, i = s.direction === "forward" ? s.currentTime === 0 : s.currentTime === s.duration;
      this.playhead = { ...this.readPlayhead(), fresh: i && !n }, this.waitingToWrap = !1;
    }
    return this.stage.liveTimelines.add(this), this.stage.render(this.timeline), this.stage.activate(this.timeline, { onUpdate: () => this.afterFrame() }), this;
  }
  pause() {
    return this.autoplayPending = !1, this.timeline.pause(), this.stage.deactivate(this.timeline), this;
  }
  /** Continue from the current position (GSAP's `resume`). */
  resume() {
    return this.play();
  }
  /** Play from the start. */
  restart() {
    return this.timeline.stop(), this.backwards = !1, this.play();
  }
  /** Flip direction and keep playing (from the end, if already finished). */
  reverse() {
    this.backwards = !this.backwards;
    const e = this.timeline.playbackState === "idle" && this.timeline.direction === "forward";
    return this.timeline.reverse(), e && this.timeline.currentTime === 0 && this.timeline.seek(this.timeline.duration), this.play();
  }
  /** Label times as progress (0..1), in order. */
  labelProgresses() {
    const e = this.timeline.duration;
    return e > 0 ? this.compat.labelTimes().map((n) => n / e) : [];
  }
  /** Whether the timeline is set to play backwards. */
  reversed() {
    return this.timeline.direction === "reverse";
  }
  /** Jump to a time in seconds, or to a label, and apply it immediately. */
  seek(e) {
    return this.autoplayPending = !1, this.compat.seek(e), this.stage.render(this.timeline), this.playhead = this.readPlayhead(), this.waitingToWrap = !1, this.options.onUpdate?.(), this;
  }
  /**
   * Read or set progress, 0..1. Setting applies immediately and fires the
   * callbacks crossed on the way, so a scroll scrub runs them.
   */
  progress(e) {
    return e === void 0 ? this.compat.progress() : (this.autoplayPending = !1, this.moveTo(Math.max(0, Math.min(1, e)) * this.timeline.duration), this.compat.progress());
  }
  timeScale(e) {
    return this.compat.timeScale(e);
  }
  /** Total duration in seconds. */
  duration() {
    return this.compat.duration();
  }
  isActive() {
    return this.timeline.playbackState === "playing";
  }
  /** Stop and remove every tween, and any scroll trigger (and its pin). Elements keep the values last applied. */
  kill() {
    return this.killed = !0, this.stage.liveTimelines.delete(this), this.scrollDriver?.destroy(), this.scrollDriver = void 0, this.autoplayPending = !1, this.timeline.stop(), this.stage.deactivate(this.timeline), this.compat.kill(), this;
  }
  /** The compiled animation, as plain JSON. */
  toDefinition() {
    return this.compat.toDefinition();
  }
  /**
   * Remove the tweens on these targets (and only these properties, if given)
   * from this timeline — `live.killTweensOf` asks every live timeline. A tween on
   * several elements shares one track, so it stops for all of them.
   */
  killTweensOf(e, n) {
    for (const s of e)
      for (const i of n ?? [void 0])
        this.timeline.removeTracks({ target: s, ...i !== void 0 && { property: i } });
    this.timeline.tracks.length === 0 && this.events.length === 0 && this.kill();
  }
  /** Run a building step now, and keep it so `invalidate()` can run it again. */
  record(e) {
    return this.recipe.push(e), e(), this.syncDuration(), this;
  }
  /** A call or pause after the last tween extends the timeline to reach it. */
  syncDuration() {
    if (this.events.length === 0) return;
    this.timeline.setDuration(void 0);
    const e = Math.max(...this.events.map((n) => n.time));
    e > this.timeline.duration && this.timeline.setDuration(e);
  }
  readPlayhead() {
    const e = this.timeline;
    return { time: e.currentTime, iteration: e.loopIteration, direction: e.direction };
  }
  /** Set the playhead to a time (ms) within the current loop, firing what it crosses. */
  moveTo(e) {
    const n = this.playhead;
    this.timeline.seek(e), this.stage.render(this.timeline);
    const s = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: e >= n.time ? "forward" : "reverse" }, i = { ...n, iteration: s.iteration, direction: s.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(i, s, !1), this.options.onUpdate?.();
  }
  /**
   * Rebuild for a new loop, keeping the playhead where the engine put it. Unlike
   * `invalidate()`, start values are not re-read from a rewound render: the
   * rebuilt tweens start where the recorded calls say, with fresh function values.
   */
  refreshForRepeat() {
    const e = this.timeline.currentTime;
    this.compat.reset(), this.events = [], this.ranges = [];
    for (const n of this.recipe) n();
    this.syncDuration(), this.timeline.seek(Math.min(e, this.timeline.duration));
  }
  /** After each frame this timeline played: callbacks crossed, repeats, completion. */
  afterFrame() {
    const e = this.timeline, n = e.repeatDelayRemaining > 0;
    if (this.waitingToWrap && n) {
      this.options.onUpdate?.();
      return;
    }
    this.waitingToWrap = !1;
    const s = this.playhead, i = this.readPlayhead();
    this.playhead = i;
    const o = this.options.yoyo === !0;
    n && !o && i.iteration > s.iteration && (this.playhead = { time: 0, iteration: i.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const r = this.runCrossings(s, i, n);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !r) {
      this.finishedThisFrame = !1;
      const a = e.currentTime === 0 && e.direction === "reverse";
      !this.scrollDriver && !o && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(e, n, s) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const i = this.events, { crossings: o, passes: r } = Ml(
      i.map((a) => a.time),
      e,
      n,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: s }
    );
    for (const a of o) {
      if (this.killed) return !0;
      if (a.kind === "repeat") {
        this.options.repeatRefresh && this.refreshForRepeat(), this.options.onRepeat?.();
        continue;
      }
      const l = i[a.index];
      if (!(l.direction && l.direction !== a.direction)) {
        if (l.pause)
          return this.timeline.seek(l.time), this.stage.render(this.timeline), this.pause(), this.playhead = this.readPlayhead(), this.waitingToWrap = !1, l.run(), !0;
        l.run();
      }
    }
    for (const a of this.ranges)
      r.some(([c, h]) => c !== h && Math.max(c, h) >= a.start && Math.min(c, h) <= a.end) && a.run();
    return !1;
  }
  /**
   * Compile one tween call. A track has one start value and one set of values,
   * but some tweens differ per element — each element's own shape, text or stroke
   * length, each plain object's own current values, or function values called per
   * element — so those build one tween per element at the same position, with any
   * stagger turned into delays. `varsList` is `[vars]`, or `[fromVars, toVars]`.
   */
  tween(e, n, s, i) {
    const o = this.resolve(e);
    if (!o) return;
    const { onStart: r, onUpdate: a, onComplete: l } = n[n.length - 1];
    if (r || a || l) {
      let c = 1 / 0, h = -1 / 0;
      const u = (d, f, g) => {
        i(d, f, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(o, n, s, u), c === 1 / 0) return;
      r && this.events.push({ time: c, direction: "forward", run: r }), a && this.ranges.push({ start: c, end: h, run: a }), l && this.events.push({ time: h, direction: "forward", run: l });
      return;
    }
    this.buildTween(o, n, s, i);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(e, n, s) {
    const i = this.resolve(e);
    if (!i) return;
    const o = Lf(n);
    if (o.length === 0) return;
    const r = i.length > 1 ? Ii(n.stagger, this.staggerContext(i)) : void 0, a = i.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? xi(i.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + cs(n.delay, 0) / 1e3;
    let u = 1 / 0, d = -1 / 0;
    if (l.forEach((m, y) => {
      o.forEach((w, b) => {
        const v = b === 0 ? h + c[y] : ">";
        this.tween(m, [w], v, ([M], x, T) => this.compat.to(x, M, T)), u = Math.min(u, this.compat.lastStart), d = Math.max(d, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: f, onUpdate: g, onComplete: p } = n;
    f && this.events.push({ time: u, direction: "forward", run: f }), g && this.ranges.push({ start: u, end: d, run: g }), p && this.events.push({ time: d, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => Lr(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, i) {
    const o = e.map((d) => this.targetFor(d));
    if (!(e.length > 1 && (n.some(Wf) || e.some((d) => this.stage.objectFor(d) !== void 0)))) {
      const d = this.targetFor(e[0]);
      i(n.map((f) => this.prepare(Rr(f, 0, d, this.stage.utils, o), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Ii(l, this.staggerContext(e)), u = h ? xi(e.length, h).map((d) => d / 1e3) : e.map(() => 0);
    e.forEach((d, f) => {
      const g = f === 0 ? cs(c.delay, 0) / 1e3 + u[0] : 0, p = f === 0 ? 0 : u[f] - u[f - 1], m = f === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, w = n.map((b, v) => v === a ? { ...c, delay: g } : b).map((b) => this.prepare(Rr(b, f, this.targetFor(d), this.stage.utils, o), [d]));
      i(w, [d], m);
    });
  }
  /** The element or plain object behind a target name. */
  targetFor(e) {
    return this.stage.elementFor(e) ?? this.stage.objectFor(e);
  }
  /**
   * Resolve the parts of vars that refer to the page — today, a motion path
   * given as a selector or element, and its `align` — into plain data.
   */
  prepare(e, n) {
    const s = (r) => this.options.onWarning?.(r), i = (r) => this.stage.query(r);
    let o = e;
    if (e.motionPath !== void 0) {
      const r = Wd(e.motionPath, {
        query: i,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      o = { ...o, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = jd(e.morphSVG, i, s), { morphSVG: a, ...l } = o;
      o = r ? { ...o, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = Fr(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = o;
        o = l;
      } else
        o = dd(o, r);
    }
    return o;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Bf(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Df(t = new Ld()) {
  const e = (o) => {
    const { config: r } = Zn(o);
    return new ee(t, {
      repeat: r.repeat,
      yoyo: r.yoyo,
      repeatDelay: r.repeatDelay,
      paused: r.paused,
      onStart: r.onStart,
      onUpdate: r.onUpdate,
      onComplete: r.onComplete,
      onRepeat: r.onRepeat,
      onReverseComplete: r.onReverseComplete,
      repeatRefresh: r.repeatRefresh,
      scrollTrigger: r.scrollTrigger
    });
  }, n = (o) => {
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: u, ...d } = o;
    return d;
  }, s = (o) => (o && t.collector?.track(o), o), i = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (o, r) => {
      const [a] = t.resolveTargets(o);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? Hl(r);
    },
    scrollTrigger: (o) => s(ko(t, o)),
    scrollBatch: (o, r) => Ff(t, o, r).map((a) => s(a)),
    scrollTo: (o, r) => Cr(i, t, o, r),
    refreshScroll: () => {
      _s.refreshAll(), Or.refreshAll();
    },
    smoothScroll: (o = {}) => {
      const r = typeof o.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(o.scroller) : o.scroller;
      return s(new Or({ ...o, scroller: r }).start());
    },
    context: (o, r) => {
      const a = new Yl(t, r);
      return o && a.add(() => o(a)), a;
    },
    matchMedia: (o) => new Tf(t, o),
    customEase: _f.create,
    customBounce: Of.create,
    customWiggle: If.create,
    pageTransition: (o) => $f(i, t, (r) => new ee(t, r), o),
    imageSequence: (o, r) => {
      const a = typeof o == "string" ? (t.collector?.scope ?? t.root).querySelector(o) : o;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(o)}`);
      return s(new xf(a, r));
    },
    quickTo: (o, r, a = {}) => {
      const l = new ee(t, { paused: !0 }), [c] = t.resolveTargets(o);
      return Object.assign((u) => {
        if (!c) return;
        const d = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Nf(a.spring, r, d) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (o) => new ee(t, o),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (o, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof o != "string" && o !== window && o.nodeType === 1;
        return Cr(i, t, a, {
          ...l,
          offsetX: c.offsetX,
          offsetY: c.offsetY,
          scroller: h ? o : void 0
        });
      }
      return e(r).to(o, n(r));
    },
    from: (o, r) => e(r).from(o, n(r)),
    fromTo: (o, r, a) => e(a).fromTo(o, r, n(a)),
    set: (o, r) => e(r).set(o, n(r)),
    delayedCall: (o, r, a) => new ee(t).call(r, a, o),
    killTweensOf: (o, r) => {
      const a = t.resolveTargets(o), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (o) => qd(o, t.root),
    splitText: (o, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof o == "string" ? Array.from(a.querySelectorAll(o)) : "nodeType" in o ? [o] : Array.from(o);
      return s(Qd(l, r));
    },
    draggable: (o, r) => s(Vd(i, t, o, r)),
    getFlipState: (o) => Ci(t, o),
    flipFrom: (o, r) => Ri(t, (a) => new ee(t, a), o, r),
    flip: (o, r, a) => {
      const l = Ci(t, o);
      return r(), Ri(t, (c) => new ee(t, c), l, { targets: o, ...a });
    }
  };
  return i;
}
const Wt = /* @__PURE__ */ Df();
function Nf(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function Wf(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || Kl(t);
}
function Kl(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || Il(n)) && !bo.has(e));
}
function Rr(t, e, n, s, i) {
  if (!Kl(t)) return t;
  const o = {};
  for (const [r, a] of Object.entries(t))
    bo.has(r) ? o[r] = a : typeof a == "function" ? o[r] = a(e, n, i) : Il(a) ? o[r] = s.resolveRandomString(a) : o[r] = a;
  return o;
}
function Lr(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function Fr(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function jf(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function Bf(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class Dr {
  media;
  offset;
  driftTolerance;
  constructor(e, n = {}) {
    this.media = e, this.offset = n.offset ?? 0, this.driftTolerance = Math.max(0, n.driftTolerance ?? 0.15);
  }
  /** Map a timeline time (ms) to the media's time (seconds), never negative. */
  targetTime(e) {
    return Math.max(0, e / 1e3 + this.offset);
  }
  /**
   * Reconcile the media with the timeline for the current frame.
   *
   * @param timelineTimeMs current timeline time in milliseconds
   * @param isPlaying whether the timeline is playing
   */
  update(e, n) {
    const s = this.targetTime(e);
    n ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - s) > this.driftTolerance && (this.media.currentTime = s)) : (this.media.paused || this.media.pause(), this.media.currentTime !== s && (this.media.currentTime = s));
  }
  /** Hard-align the media to a timeline time (used on explicit seeks). */
  seek(e) {
    this.media.currentTime = this.targetTime(e);
  }
  /** Mirror the timeline playback rate onto the media. */
  setRate(e) {
    this.media.playbackRate = e;
  }
  /** Pause the media and release it. */
  dispose() {
    this.media.paused || this.media.pause();
  }
  safePlay() {
    const e = this.media.play();
    e && typeof e.catch == "function" && e.catch(() => {
    });
  }
}
function qf(t, e, n, s, i) {
  const o = n - i;
  if (o < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(o, s);
}
class vo {
  container;
  timeline = null;
  adapter;
  animationFrameId;
  lastTime;
  options;
  targets = {};
  isDestroyed = !1;
  mediaSync;
  mediaTargets = [];
  symbolInstances = [];
  scenarioList = [];
  scenarioId;
  authored = /* @__PURE__ */ new Map();
  markerList = [];
  listeners = /* @__PURE__ */ new Set();
  /** Where the playhead was when marker crossings were last worked out */
  playhead = { time: 0, iteration: 0, direction: "forward" };
  /** Stop at the next marker crossed (step mode, or `next()`) */
  stepping = !1;
  lastMarkerId = null;
  reducedQuery;
  onReducedChange = () => this.applyReducedMotion();
  visibilityObserver;
  onScreen = !0;
  /** Playback was paused by leaving the screen, and resumes on return */
  pausedByVisibility = !1;
  /** `autoplay` waits for the first time the container is seen */
  autoplayWhenSeen = !1;
  onDocumentVisibility = () => this.updateVisibility();
  constructor(e, n = {}) {
    if (typeof e == "string") {
      const s = document.querySelector(e);
      if (!s)
        throw new Error(`Container not found: ${e}`);
      this.container = s;
    } else
      this.container = e;
    this.options = n, this.adapter = new xe();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(e) {
    this.scenarioList = [], this.scenarioId = void 0, await this.loadSource(e);
  }
  async loadSource(e) {
    let n;
    if (typeof e == "string") {
      const s = await fetch(e);
      if (!s.ok)
        throw new Error(`Failed to load animation: ${s.statusText}`);
      n = await s.json();
    } else
      n = e;
    this.useDefinition(n), this.showInitialFrame(), this.watchReducedMotion(), this.watchVisibility(), this.options.autoplay && !this.reducedMotion && (this.options.playWhenVisible && !this.onScreen ? this.autoplayWhenSeen = !0 : this.play());
  }
  /**
   * Make a definition the current timeline: targets, symbols and media bound, no
   * frame drawn and nothing played. The definition itself is not modified, so a
   * scenario's timeline can be used again.
   */
  useDefinition(e) {
    const n = { ...e.config };
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = kn({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
  }
  // --- scenarios: the reader chooses which timeline plays --------------------
  /**
   * Load several timelines for the same markup, and show one. The reader switches
   * with `setScenario`; the embed's controls and `data-tinyfly-choose` hotspots
   * call it.
   */
  async loadScenarios(e, n = {}) {
    if (e.length === 0) throw new Error("tinyfly: loadScenarios needs at least one scenario");
    const s = /* @__PURE__ */ new Set();
    for (const o of e) {
      if (s.has(o.id)) throw new Error(`tinyfly: scenario id "${o.id}" is used more than once`);
      s.add(o.id);
    }
    const i = n.initial === void 0 ? e[0] : e.find((o) => o.id === n.initial);
    if (!i) throw new Error(`tinyfly: there is no scenario "${n.initial}"`);
    this.scenarioList = [...e], this.scenarioId = i.id, await this.loadSource(i.timeline);
  }
  /** The scenarios to choose from (empty for a single timeline). */
  get scenarios() {
    return this.scenarioList.map((e) => ({ id: e.id, label: e.label ?? e.id }));
  }
  /** The id of the scenario showing, if scenarios were loaded. */
  get scenario() {
    return this.scenarioId;
  }
  /**
   * Switch to another scenario. Whatever the previous one drew is undone first.
   * The reader stays at the same step when the new scenario has a marker with the
   * same id, stays at the end if they were at the end, and otherwise starts from
   * the beginning. Playback continues if it was playing. Under reduced motion the
   * new scenario's final frame shows. Returns false for an unknown id.
   */
  setScenario(e) {
    const n = this.scenarioList.find((a) => a.id === e);
    if (!n || !this.timeline) return !1;
    if (e === this.scenarioId) return !0;
    const s = this.isPlaying, i = this.currentTime >= this.duration - 0.5, o = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = e, this.useDefinition(n.timeline), this.lastMarkerId = null;
    let r = 0;
    return this.reducedMotion || i ? r = this.duration : o !== void 0 && (r = this.markers.find((a) => a.id === o)?.time ?? 0), this.seek(r), s && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
  }
  /** Remember how an element was authored, the first time it becomes a target. */
  rememberAuthored(e) {
    if (this.authored.has(e)) return;
    const n = { style: e.getAttribute("style") };
    e.children.length === 0 && (n.text = e.textContent ?? "");
    const s = e.tagName.toLowerCase() === "path" ? e : e.querySelector("path");
    s && (n.path = { element: s, d: s.getAttribute("d") }), this.authored.set(e, n);
  }
  /** Put every target back the way it was authored. */
  restoreAuthored() {
    for (const [e, n] of this.authored) {
      n.style === null ? e.removeAttribute("style") : e.setAttribute("style", n.style), n.text !== void 0 && e.textContent !== n.text && (e.textContent = n.text), n.path && (n.path.d === null ? n.path.element.removeAttribute("d") : n.path.element.setAttribute("d", n.path.d));
      const s = e.dataset;
      s && delete s.shineBase;
    }
  }
  // --- teaching: frames, markers, reduced motion, visibility -----------------
  /**
   * Be told whenever the time, play state or current marker may have changed —
   * for controls and captions. Returns a function that stops it.
   */
  subscribe(e) {
    return this.listeners.add(e), () => this.listeners.delete(e);
  }
  notify() {
    for (const e of this.listeners) e();
  }
  /** Whether the reader asked for reduced motion (and the player respects it). */
  get reducedMotion() {
    return this.reducedQuery?.matches === !0;
  }
  /** The timeline's markers, in time order. */
  get markers() {
    return this.markerList;
  }
  /** The last marker at or before the playhead. */
  get currentMarker() {
    const e = this.currentTime;
    let n;
    for (const s of this.markers)
      if (s.time <= e + 0.5) n = s;
      else break;
    return n;
  }
  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(e, n) {
    const s = e ? this.markers.find((r) => r.id === e) : this.currentMarker;
    if (!s) return;
    const i = n ?? this.language(), o = (r) => r?.[i]?.[s.id] ?? r?.[i.split("-")[0]]?.[s.id];
    return o(this.options.captions) ?? o(this.timeline?.captions) ?? s.label;
  }
  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next() {
    if (!this.timeline) return;
    const e = this.currentTime, n = this.markers.find((s) => s.time > e + 0.5);
    if (this.reducedMotion) {
      this.seek(n ? n.time : this.duration);
      return;
    }
    e >= this.duration - 0.5 || (this.stepping = n !== void 0, this.startPlaying());
  }
  /** Jump back to the previous marker (or the start). */
  prev() {
    if (!this.timeline) return;
    const e = this.currentTime, n = [...this.markers].reverse().find((s) => s.time < e - 0.5);
    this.pause(), this.seek(n ? n.time : 0);
  }
  /** Jump to a marker by id, paused there. */
  goToMarker(e) {
    const n = this.markers.find((s) => s.id === e);
    n && (this.pause(), this.seek(n.time));
  }
  language() {
    return this.container.closest("[lang]")?.getAttribute("lang") || (typeof document < "u" ? document.documentElement.lang : "") || "en";
  }
  showInitialFrame() {
    if (!this.timeline) return;
    const e = this.options.initialFrame ?? "start";
    if (e === "none") return;
    const n = e === "end" ? this.timeline.duration : e === "start" ? 0 : e;
    this.timeline.seek(Math.max(0, Math.min(this.timeline.duration, n))), this.applyState();
  }
  watchReducedMotion() {
    this.options.respectReducedMotion === !1 || typeof window > "u" || typeof window.matchMedia != "function" || (this.reducedQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)"), this.reducedQuery.addEventListener?.("change", this.onReducedChange), this.reducedQuery.matches && this.applyReducedMotion());
  }
  /** Under reduced motion: stop, and show the finished state. */
  applyReducedMotion() {
    !this.reducedMotion || !this.timeline || (this.autoplayWhenSeen = !1, this.pause(), this.seek(this.timeline.duration));
  }
  watchVisibility() {
    if (!(!this.options.playWhenVisible || typeof window > "u")) {
      if (typeof IntersectionObserver == "function") {
        this.visibilityObserver?.disconnect(), this.visibilityObserver = new IntersectionObserver((n) => {
          for (const s of n) this.onScreen = s.isIntersecting;
          this.updateVisibility();
        }), this.visibilityObserver.observe(this.container);
        const e = this.container.getBoundingClientRect?.();
        e && (e.width > 0 || e.height > 0) && (this.onScreen = e.bottom > 0 && e.top < window.innerHeight && e.right > 0 && e.left < window.innerWidth);
      }
      document.addEventListener("visibilitychange", this.onDocumentVisibility);
    }
  }
  updateVisibility() {
    const e = this.onScreen && document.visibilityState !== "hidden";
    !e && this.isPlaying ? (this.pausedByVisibility = !0, this.pause()) : e && (this.pausedByVisibility || this.autoplayWhenSeen) && !this.reducedMotion && (this.pausedByVisibility = !1, this.autoplayWhenSeen = !1, this.startPlaying());
  }
  /** Report the current marker if it changed since the last frame. */
  announceMarker() {
    if (!this.options.onMarker) return;
    const e = this.currentMarker, n = e?.id;
    n !== this.lastMarkerId && (this.lastMarkerId = n, this.options.onMarker(e));
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((n) => {
      const s = n, i = Number(s.getAttribute("data-tinyfly-start") ?? "0") || 0, o = s.getAttribute("data-volume");
      o !== null && (s.volume = Math.max(0, Math.min(1, Number(o) || 0))), this.mediaTargets.push({ el: s, startTime: i, sync: new Dr(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      qf(s.sync, s.el, e, n, s.startTime);
  }
  /**
   * Load animation from inline JSON string.
   */
  loadFromString(e) {
    const n = JSON.parse(e);
    this.load(n);
  }
  /**
   * Register a target element by name.
   */
  registerTarget(e, n) {
    if (typeof n == "string") {
      const s = this.container.querySelector(n);
      s && (this.rememberAuthored(s), this.targets[e] = s, this.adapter.registerTarget(e, s));
    } else
      this.rememberAuthored(n), this.targets[e] = n, this.adapter.registerTarget(e, n);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((n) => {
      const s = n.closest("[data-tinyfly-symbol]");
      if (s && s !== n) return;
      const i = n.getAttribute("data-tinyfly");
      i && this.registerTarget(i, n);
    }), this.timeline && new Set(this.timeline.tracks.map((s) => s.target)).forEach((s) => {
      if (!this.targets[s]) {
        const i = this.container.querySelector(`[data-tinyfly="${s}"]`) || this.container.querySelector(`.${s}`) || this.container.querySelector(`#${s}`);
        i && this.registerTarget(s, i);
      }
    });
  }
  /**
   * Bind each embedded symbol instance (`[data-tinyfly-symbol="id"]`) to its
   * symbol's nested timeline: a private adapter drives the instance's inner
   * elements, looped over the symbol's duration and synced to the main playhead.
   */
  setupSymbolInstances() {
    this.symbolInstances = [];
    const e = this.options.symbols;
    if (!e || e.length === 0) return;
    const n = new Map(e.map((s) => [s.id, s]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const i = s.getAttribute("data-tinyfly-symbol");
      if (!i) return;
      const o = n.get(i);
      if (!o || !o.timeline.tracks?.length) return;
      const r = new xe();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: kn(o.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new Dr(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
  }
  /** Detach and pause the currently synced media, if any. */
  detachMedia() {
    this.mediaSync?.dispose(), this.mediaSync = void 0;
  }
  /**
   * Start or resume playback.
   */
  play() {
    !this.timeline || this.isDestroyed || (this.autoplayWhenSeen = !1, this.stepping = this.options.stepMode === !0, this.startPlaying());
  }
  startPlaying() {
    if (!this.timeline || this.isDestroyed) return;
    const e = this.timeline.playbackState === "idle";
    this.timeline.play(), e && this.timeline.currentTime === 0 && this.applyState(), this.playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: this.timeline.direction }, this.mediaSync?.update(this.timeline.currentTime, !0), this.syncAllMedia(this.timeline.currentTime, !0), this.startAnimationLoop(), this.notify();
  }
  /**
   * Pause playback.
   */
  pause() {
    this.timeline && (this.stepping = !1, this.timeline.pause(), this.notify(), this.mediaSync?.update(this.timeline.currentTime, !1), this.syncAllMedia(this.timeline.currentTime, !1), this.stopAnimationLoop());
  }
  /**
   * Stop playback and reset to beginning.
   */
  stop() {
    this.timeline && (this.timeline.stop(), this.stopAnimationLoop(), this.applyState(), this.mediaSync?.update(this.timeline.currentTime, !1), this.syncAllMedia(this.timeline.currentTime, !1));
  }
  /**
   * Seek to a specific time (in milliseconds).
   */
  seek(e) {
    this.timeline && (this.timeline.seek(e), this.applyState(), this.playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: this.timeline.direction }, this.mediaSync?.seek(this.timeline.currentTime), this.syncAllMedia(this.timeline.currentTime, this.isPlaying));
  }
  /**
   * Set playback speed.
   */
  setSpeed(e) {
    this.timeline && (this.timeline.speed = e, this.mediaSync?.setRate(e));
  }
  /**
   * Reverse playback direction.
   */
  reverse() {
    this.timeline && this.timeline.reverse();
  }
  /**
   * Get current playback time.
   */
  get currentTime() {
    return this.timeline?.currentTime ?? 0;
  }
  /**
   * Get total duration.
   */
  get duration() {
    return this.timeline?.duration ?? 0;
  }
  /**
   * Check if currently playing.
   */
  get isPlaying() {
    return this.timeline?.playbackState === "playing";
  }
  /**
   * Clean up resources.
   */
  destroy() {
    this.isDestroyed = !0, this.stopAnimationLoop(), this.reducedQuery?.removeEventListener?.("change", this.onReducedChange), this.visibilityObserver?.disconnect(), typeof document < "u" && document.removeEventListener("visibilitychange", this.onDocumentVisibility), this.mediaSync?.dispose(), this.mediaSync = void 0;
    for (const e of this.mediaTargets)
      e.el.paused || e.el.pause();
    this.mediaTargets = [], this.adapter.clearTargets();
    for (const e of this.symbolInstances) e.adapter.clearTargets();
    this.symbolInstances = [], this.authored.clear(), this.timeline = null;
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const e = (n) => {
      if (this.isDestroyed || !this.timeline) return;
      const s = n - (this.lastTime ?? n);
      this.lastTime = n;
      const i = this.playhead;
      this.timeline.tick(s), this.stopAtMarker(i), this.applyState();
      const o = this.timeline.playbackState === "playing";
      this.mediaSync?.update(this.timeline.currentTime, o), this.syncAllMedia(this.timeline.currentTime, o), this.timeline.playbackState === "playing" ? this.animationFrameId = requestAnimationFrame(e) : (this.animationFrameId = void 0, this.notify());
    };
    this.animationFrameId = requestAnimationFrame(e);
  }
  /**
   * If this frame crossed a marker it should stop at — the next one while
   * stepping, or any marker with `pause` — put the playhead exactly there and pause.
   */
  stopAtMarker(e) {
    const n = this.timeline, s = { time: n.currentTime, iteration: n.loopIteration, direction: n.direction };
    this.playhead = s;
    const i = this.markers;
    if (i.length === 0) return;
    const { crossings: o } = Ml(
      i.map((r) => r.time),
      e,
      s,
      { duration: n.duration, alternate: n.config.alternate === !0, holding: n.repeatDelayRemaining > 0 }
    );
    for (const r of o) {
      if (r.kind !== "event") continue;
      const a = i[r.index];
      if (this.stepping || a.pause) {
        this.stepping = !1, n.pause(), n.seek(a.time), this.playhead = { time: a.time, iteration: n.loopIteration, direction: n.direction };
        return;
      }
    }
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
  applyState() {
    if (!this.timeline) return;
    const e = this.timeline.currentTime;
    this.adapter.applyState(this.timeline.getStateAtTime(e)), this.announceMarker(), this.notify();
    for (const n of this.symbolInstances) {
      const s = n.timeline.duration;
      n.adapter.applyState(n.timeline.getStateAtTime(s > 0 ? e % s : e));
    }
  }
}
async function zb(t, e, n = {}) {
  const s = new vo(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function Xb(t, e = {}) {
  return new vo(t, e);
}
const Yf = {
  play: "Play",
  pause: "Pause",
  prev: "Previous step",
  next: "Next step",
  restart: "Restart",
  scrub: "Position",
  speed: "Speed",
  reveal: "Reveal",
  step: "Step",
  of: "of",
  stepFormat: "{index} / {total}",
  scenario: "Scenario",
  fullscreen: "Full screen",
  exitFullscreen: "Exit full screen"
}, Nr = "tinyfly-controls-style", Kf = `
.tf-ctl { --tf-ctl-fg: #1d1d1f; --tf-ctl-bg: #f4f2ee; --tf-ctl-accent: #c2410c; --tf-ctl-radius: 8px;
  font: 14px/1.4 var(--tf-ctl-font, system-ui, sans-serif); color: var(--tf-ctl-fg); margin-top: 8px; }
.tf-ctl-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 6px; border-radius: var(--tf-ctl-radius); background: var(--tf-ctl-bg); }
.tf-ctl-btn { min-width: 36px; height: 36px; padding: 0 10px; border: 0; border-radius: calc(var(--tf-ctl-radius) - 2px); background: transparent; color: inherit; font: inherit; cursor: pointer; }
.tf-ctl-btn:hover { background: color-mix(in srgb, var(--tf-ctl-fg) 8%, transparent); }
.tf-ctl-btn:focus-visible, .tf-ctl-scrub:focus-visible, .tf-ctl-speed:focus-visible { outline: 2px solid var(--tf-ctl-accent); outline-offset: 2px; }
.tf-ctl-btn[disabled] { opacity: 0.4; cursor: default; }
.tf-ctl-primary { background: var(--tf-ctl-accent); color: #fff; }
.tf-ctl-primary:hover { background: var(--tf-ctl-accent); filter: brightness(1.08); }
.tf-ctl-scrub { flex: 1 1 120px; min-width: 80px; accent-color: var(--tf-ctl-accent); }
.tf-ctl-speed { height: 32px; border: 0; border-radius: 6px; background: transparent; color: inherit; font: inherit; }
.tf-ctl-step { font-variant-numeric: tabular-nums; opacity: 0.75; padding: 0 4px; }
.tf-ctl-caption { margin: 6px 2px 0; min-height: 1.4em; }
.tf-ctl-question { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 6px 2px 0; font-weight: 600; }
.tf-ctl-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The hidden attribute only hides through the browser's default stylesheet; any rule
   above that sets display would override it, so enforce it for everything here. */
.tf-ctl [hidden] { display: none !important; }
.tf-ctl-choices { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 8px 0 0; padding: 0; border: 0; }
.tf-ctl-choices legend { float: left; margin-right: 4px; padding: 0; font-weight: 600; }
.tf-ctl-choice { position: relative; display: inline-flex; }
.tf-ctl-choice input { position: absolute; opacity: 0; width: 1px; height: 1px; }
.tf-ctl-choice span { display: inline-block; padding: 6px 12px; border-radius: var(--tf-ctl-radius); background: var(--tf-ctl-bg); cursor: pointer; }
.tf-ctl-choice input:checked + span { background: var(--tf-ctl-accent); color: #fff; }
.tf-ctl-choice input:focus-visible + span { outline: 2px solid var(--tf-ctl-accent); outline-offset: 2px; }
.tf-ctl-choice-slider { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 8px 0 0; }
.tf-ctl-choice-slider span { font-weight: 600; }
.tf-ctl-choice-slider input { flex: 1 1 140px; accent-color: var(--tf-ctl-accent); }
.tf-ctl-choice-slider input:focus-visible { outline: 2px solid var(--tf-ctl-accent); outline-offset: 2px; }
.tf-ctl-choice-slider output { font-variant-numeric: tabular-nums; min-width: 4em; }
.tf-ctl-fullscreen { margin-left: auto; display: inline-flex; align-items: center; justify-content: center; }
.tf-ctl-fullscreen svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
/* Full screen, by either route. The figure becomes a column: the drawing takes the room
   that's left after the controls and captions. !important because the host page's own
   figure rules (a max-width, a min-width that makes a diagram scroll on phones) would
   otherwise keep the drawing at its in-page size. */
.tf-fullscreen { box-sizing: border-box !important; display: flex !important; flex-direction: column; width: 100% !important; max-width: none !important; height: 100vh; height: 100dvh; margin: 0 !important; padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left)) !important; overflow: auto !important; background: var(--tf-fullscreen-bg, #fff); }
.tf-fullscreen > * { flex: none; }
.tf-fullscreen > svg, .tf-fullscreen > canvas { flex: 1 1 0; min-height: 0; width: 100% !important; min-width: 0 !important; height: 100% !important; }
.tf-fullscreen-overlay { position: fixed !important; inset: 0; z-index: 2147483000; }
/* A short landscape screen (a phone on its side): stacking the controls under the drawing
   leaves the drawing a thin strip, so put them in a column beside it instead. */
@media (orientation: landscape) and (max-height: 520px) {
  .tf-fullscreen { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(200px, 34%); grid-auto-rows: min-content; column-gap: 12px; align-content: start; }
  .tf-fullscreen > svg, .tf-fullscreen > canvas { grid-column: 1; grid-row: 1 / span 12; height: calc(100vh - 24px) !important; height: calc(100dvh - 24px) !important; }
  .tf-fullscreen > :not(svg):not(canvas) { grid-column: 2; }
}
`;
let zf = 0;
function Xf(t) {
  if (t.getElementById(Nr)) return;
  const e = t.createElement("style");
  e.id = Nr, e.textContent = Kf, t.head.appendChild(e);
}
function Uf(t, e, n = {}) {
  const s = e.ownerDocument;
  Xf(s);
  const i = { ...Yf, ...n.labels }, o = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((R) => R.label !== void 0 || t.caption(R.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (R, D, Y, j = "") => {
    const U = s.createElement("button");
    return U.type = "button", U.className = `tf-ctl-btn ${j}`.trim(), U.setAttribute("aria-label", R), U.title = R, U.textContent = D, U.addEventListener("click", Y), U;
  }, u = h(i.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), d = h(i.prev, "|◀", () => t.prev()), f = h(i.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(i.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", i.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const y = s.createElement("span");
  y.className = "tf-ctl-step";
  const w = s.createElement("select");
  w.className = "tf-ctl-speed", w.setAttribute("aria-label", i.speed);
  for (const R of o) {
    const D = s.createElement("option");
    D.value = String(R), D.textContent = `${R}×`, R === 1 && (D.selected = !0), w.appendChild(D);
  }
  w.addEventListener("change", () => t.setSpeed(Number(w.value))), c.append(u, d, f, g, m, y), o.length > 0 && c.append(w), l.append(c);
  const b = n.fullscreen ? Zf(e, s, i) : void 0;
  b && c.append(b.button);
  const v = s.createElement("p");
  v.className = "tf-ctl-caption", v.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(v);
  const M = s.createElement("div");
  M.className = "tf-ctl-question", M.hidden = !0;
  const x = s.createElement("span"), T = h(i.reveal, i.reveal, () => t.play(), "tf-ctl-primary");
  M.append(x, T), l.append(M);
  const A = Vf(t, s, i.scenario, n.scenarioControl ?? "buttons");
  A && l.append(A.element);
  const k = n.mount;
  k ? k.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const O = () => {
    const R = t.isPlaying;
    f.textContent = R ? "❚❚" : "▶", f.setAttribute("aria-label", R ? i.pause : i.play), f.title = R ? i.pause : i.play;
    const D = t.duration;
    s.activeElement !== m && (m.value = String(D > 0 ? Math.round(t.currentTime / D * 1e3) : 0));
    const Y = t.markers;
    if (d.hidden = g.hidden = y.hidden = Y.length === 0, Y.length > 0) {
      const j = t.currentMarker, U = j ? Y.indexOf(j) + 1 : 0;
      y.textContent = i.stepFormat.replace("{index}", String(U)).replace("{total}", String(Y.length)), y.setAttribute("aria-label", `${i.step} ${U} ${i.of} ${Y.length}`), d.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= D - 0.5;
      const G = t.caption() ?? "";
      v.textContent !== G && (v.textContent = G), v.hidden = !a();
      const E = !R && j?.question !== void 0 && Math.abs(t.currentTime - j.time) < 1;
      M.hidden = !E, E && x.textContent !== j.question && (x.textContent = j.question);
    } else
      M.hidden = !0, v.hidden = !0;
    A?.update();
  }, $ = t.subscribe(O);
  O();
  const P = n.keyboardScope ?? e;
  !P.hasAttribute("tabindex") && P.tabIndex < 0 && (P.tabIndex = 0);
  const L = /* @__PURE__ */ new WeakSet(), _ = (R) => {
    if (L.has(R) || (L.add(R), R.defaultPrevented || R.altKey || R.ctrlKey || R.metaKey)) return;
    const D = R.target;
    if (!(D.tagName === "INPUT" || D.tagName === "SELECT") && !(R.key === " " && D.tagName === "BUTTON"))
      switch (R.key) {
        case " ":
          R.preventDefault(), t.isPlaying ? t.pause() : p();
          break;
        case "ArrowRight":
          if (!r()) return;
          R.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          R.preventDefault(), t.prev();
          break;
        case "Home":
          R.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!b) return;
          R.preventDefault(), b.active ? b.exit() : b.enter();
          break;
      }
  };
  return P.addEventListener("keydown", _), l.addEventListener("keydown", _), {
    element: l,
    fullscreen: b && {
      get active() {
        return b.active;
      },
      enter: b.enter,
      exit: b.exit
    },
    destroy() {
      b?.destroy(), $(), P.removeEventListener("keydown", _), l.removeEventListener("keydown", _), l.remove();
    }
  };
}
function Vf(t, e, n, s) {
  const i = t.scenarios;
  if (i.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const u = e.createElement("span");
    u.textContent = n, u.setAttribute("aria-hidden", "true");
    const d = e.createElement("input");
    d.type = "range", d.min = "0", d.max = String(i.length - 1), d.step = "1", d.setAttribute("aria-label", n);
    const f = e.createElement("output");
    return f.setAttribute("aria-hidden", "true"), d.addEventListener("input", () => {
      const p = i[Number(d.value)];
      p && t.setScenario(p.id);
    }), h.append(u, d, f), { element: h, update: () => {
      const p = Math.max(0, i.findIndex((y) => y.id === t.scenario));
      e.activeElement !== d && (d.value = String(p));
      const m = i[p].label;
      f.textContent !== m && (f.textContent = m), d.setAttribute("aria-valuetext", m);
    } };
  }
  const o = e.createElement("fieldset");
  o.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, o.append(r);
  const a = `tf-ctl-scenario-${++zf}`, l = i.map((h) => {
    const u = e.createElement("label");
    u.className = "tf-ctl-choice";
    const d = e.createElement("input");
    d.type = "radio", d.name = a, d.value = h.id, d.addEventListener("change", () => {
      d.checked && t.setScenario(h.id);
    });
    const f = e.createElement("span");
    return f.textContent = h.label, u.append(d, f), o.append(u), d;
  });
  return { element: o, update: () => {
    for (const h of l) {
      const u = h.value === t.scenario;
      h.checked !== u && (h.checked = u);
    }
  } };
}
const Gf = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Jf = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Zf(t, e, n) {
  const s = e, i = t, o = e.createElement("button");
  o.type = "button", o.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    o.innerHTML = p ? Jf : Gf;
    const m = p ? n.exitFullscreen : n.fullscreen;
    o.setAttribute("aria-label", m), o.title = m, o.setAttribute("aria-pressed", String(p)), t.classList.toggle("tf-fullscreen", p), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, u = (p) => {
    p.key === "Escape" && g();
  }, d = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", u), l();
  };
  async function f() {
    if (r) return;
    const p = i.requestFullscreen?.bind(i) ?? i.webkitRequestFullscreen?.bind(i), m = s.fullscreenEnabled ?? s.webkitFullscreenEnabled ?? !1;
    if (p && m)
      try {
        if (await p(), c() === t) {
          r = "native", l();
          return;
        }
      } catch {
      }
    d();
  }
  async function g() {
    if (r === "overlay")
      e.removeEventListener("keydown", u), e.documentElement.style.overflow = a, r = void 0, l();
    else if (r === "native") {
      r = void 0, l();
      const p = s.exitFullscreen?.bind(s) ?? s.webkitExitFullscreen?.bind(s);
      c() === t && p && await p();
    }
  }
  return o.addEventListener("click", () => {
    r ? g() : f();
  }), e.addEventListener("fullscreenchange", h), e.addEventListener("webkitfullscreenchange", h), l(), {
    button: o,
    get active() {
      return r !== void 0;
    },
    enter: f,
    exit: g,
    destroy() {
      g(), e.removeEventListener("fullscreenchange", h), e.removeEventListener("webkitfullscreenchange", h), o.remove();
    }
  };
}
const Wr = "tinyfly-choices-style", Qf = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function t0(t) {
  if (t.getElementById(Wr)) return;
  const e = t.createElement("style");
  e.id = Wr, e.textContent = Qf, t.head.appendChild(e);
}
function e0(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  t0(e.ownerDocument);
  const s = [], i = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (g, p) => {
      a.hasAttribute(g) || (a.setAttribute(g, p), c.push(g));
    };
    h("role", "button"), h("tabindex", "0");
    const u = t.scenarios.find((g) => g.id === l)?.label;
    u !== void 0 && h("aria-label", u), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const d = () => t.setScenario(l), f = (g) => {
      const p = g.key;
      p !== "Enter" && p !== " " || (g.preventDefault(), d());
    };
    a.addEventListener("click", d), a.addEventListener("keydown", f), i.push(() => {
      a.removeEventListener("click", d), a.removeEventListener("keydown", f);
    });
  }
  const o = () => {
    for (const { element: a } of s)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === t.scenario));
  }, r = t.subscribe(o);
  return o(), () => {
    r();
    for (const a of i) a();
    for (const { element: a, attributes: l } of s) for (const c of l) a.removeAttribute(c);
  };
}
const us = /* @__PURE__ */ new WeakMap(), Li = /* @__PURE__ */ new WeakMap();
let n0 = 0;
function pn(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function s0(t, e = {}) {
  const n = us.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), i = s[0], o = t.getAttribute("data-src"), r = o0(t.getAttribute("data-markers")), a = s.length > 1 || i?.hasAttribute("data-scenario") ? i0(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = i && !a ? pn(i.textContent, "timeline", t) : void 0;
  if (!l && o && r) {
    const f = await fetch(o);
    f.ok && (l = await f.json());
  }
  if (l && r && (l = zl(l, r)), !l && !o && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = pn(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...pn(t.getAttribute("data-options"), "data-options", t)
  };
  a0(t);
  const u = new vo(t, h), d = { element: t, player: u };
  if (us.set(t, d), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const f = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === f) ? f : void 0 }), Li.set(t, e0(u, t));
  } else
    await u.load(l ?? o);
  if (t.getAttribute("data-controls") !== "false") {
    const f = pn(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    d.controls = Uf(u, t, {
      ...e.controls,
      ...t.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...m === "slider" || m === "buttons" ? { scenarioControl: m } : {},
      labels: { ...e.controls?.labels, ...f, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), g ? t.insertBefore(d.controls.element, g) : t.appendChild(d.controls.element);
  }
  return d;
}
function i0(t, e, n) {
  const s = [];
  return t.forEach((i, o) => {
    const r = pn(i.textContent, "timeline", n);
    if (!r) return;
    const a = i.getAttribute("data-scenario") || `scenario-${o + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = i.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? zl(r, e) : r });
  }), s;
}
function zl(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function o0(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function r0(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((i) => s0(i, e)))).filter((i) => i !== void 0);
}
function Ub(t) {
  const e = us.get(t);
  e && (Li.get(t)?.(), Li.delete(t), e.controls?.destroy(), e.player.destroy(), us.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function a0(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++n0}`, e.setAttribute("aria-labelledby", s.id));
}
function l0() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    r0();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class c0 {
  container;
  containerA;
  containerB;
  adapterA;
  adapterB;
  timelineA = null;
  timelineB = null;
  /** Symbol nested timelines by id (from the sequence). */
  symbolDefs = /* @__PURE__ */ new Map();
  /** Per-scene-slot symbol instances (nested adapter + timeline), keyed by the
   *  slot's scene adapter. */
  nestedByAdapter = /* @__PURE__ */ new Map();
  sequence = null;
  options;
  _currentSceneIndex = 0;
  _state = "idle";
  _isPlaying = !1;
  _isDestroyed = !1;
  loopIteration = 0;
  animationFrameId;
  lastTime;
  transitionTimer;
  constructor(e, n = {}) {
    if (typeof e == "string") {
      const s = document.querySelector(e);
      if (!s) throw new Error(`Container not found: ${e}`);
      this.container = s;
    } else
      this.container = e;
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new xe(), this.adapterB = new xe();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(e) {
    let n;
    if (typeof e == "string") {
      const s = await fetch(e);
      if (!s.ok)
        throw new Error(`Failed to load sequence: ${s.statusText}`);
      n = await s.json();
    } else
      n = e;
    this.sequence = n, this.symbolDefs.clear();
    for (const s of n.symbols ?? [])
      s.timeline?.tracks?.length && this.symbolDefs.set(s.id, s.timeline);
    this.container.style.width = `${n.canvas.width}px`, this.container.style.height = `${n.canvas.height}px`, n.scenes.length > 0 && (this.renderScene(n.scenes[0], this.containerA, this.adapterA), this.timelineA = this.createTimeline(n.scenes[0])), this.options.autoplay && this.play();
  }
  /**
   * Start or resume playback.
   */
  play() {
    if (!(!this.sequence || this._isDestroyed) && this.sequence.scenes.length !== 0) {
      if (this._isPlaying = !0, this._state === "idle") {
        if (this._state = "playing-scene", this._currentSceneIndex = 0, this.timelineA)
          this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play();
        else {
          this.onSceneComplete();
          return;
        }
        this.options.onSceneChange?.(0);
      } else this._state === "playing-scene" && this.timelineA && this.timelineA.play();
      this.startAnimationLoop();
    }
  }
  /**
   * Pause playback.
   */
  pause() {
    this._isPlaying && (this._isPlaying = !1, this.timelineA && this.timelineA.pause(), this.timelineB && this.timelineB.pause(), this.stopAnimationLoop());
  }
  /**
   * Stop playback and reset to beginning.
   */
  stop() {
    if (this._isPlaying = !1, this._state = "idle", this._currentSceneIndex = 0, this.loopIteration = 0, this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this.stopAnimationLoop(), this.sequence && this.sequence.scenes.length > 0 && (this.clearContainer(this.containerA), this.clearContainer(this.containerB), this.adapterA.clearTargets(), this.adapterB.clearTargets(), this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this.renderScene(this.sequence.scenes[0], this.containerA, this.adapterA), this.timelineA = this.createTimeline(this.sequence.scenes[0]), this.timelineA)) {
      const e = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(e), this.applyNested(this.adapterA, 0);
    }
  }
  /**
   * Jump to a specific scene by index.
   */
  goToScene(e) {
    if (!this.sequence || e < 0 || e >= this.sequence.scenes.length) return;
    const n = this._isPlaying;
    this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this._currentSceneIndex = e, this._state = n ? "playing-scene" : "idle", this.clearContainer(this.containerA), this.clearContainer(this.containerB), this.adapterA.clearTargets(), this.adapterB.clearTargets(), this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB);
    const s = this.sequence.scenes[e];
    if (this.renderScene(s, this.containerA, this.adapterA), this.timelineA = this.createTimeline(s), this.options.onSceneChange?.(e), n)
      this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play(), this.startAnimationLoop()) : this.onSceneComplete();
    else if (this.timelineA) {
      const i = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(i), this.applyNested(this.adapterA, 0);
    }
  }
  /**
   * Clean up all resources.
   */
  destroy() {
    this._isDestroyed = !0, this._isPlaying = !1, this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.adapterA.clearTargets(), this.adapterB.clearTargets();
    for (const e of this.nestedByAdapter.values())
      for (const n of e) n.adapter.clearTargets();
    this.nestedByAdapter.clear(), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this.timelineA = null, this.timelineB = null, this.containerA.parentNode && this.containerA.remove(), this.containerB.parentNode && this.containerB.remove(), this.sequence = null;
  }
  get currentSceneIndex() {
    return this._currentSceneIndex;
  }
  get sceneCount() {
    return this.sequence?.scenes.length ?? 0;
  }
  get isPlaying() {
    return this._isPlaying;
  }
  get state() {
    return this._state;
  }
  // --- Private methods ---
  createSceneContainer() {
    const e = document.createElement("div");
    return e.style.position = "absolute", e.style.top = "0", e.style.left = "0", e.style.width = "100%", e.style.height = "100%", e;
  }
  renderScene(e, n, s) {
    n.innerHTML = "", s.clearTargets();
    const i = document.createElement("div");
    i.style.cssText = "position:absolute;inset:0;transform-origin:center center", i.setAttribute("data-tinyfly", "Camera"), n.appendChild(i), s.registerTarget("Camera", i);
    for (const o of e.elements) {
      if (!o.html) continue;
      const r = document.createElement("div");
      r.innerHTML = o.html.trim();
      const a = r.firstElementChild;
      if (a) {
        i.appendChild(a);
        const l = a.getAttribute("data-tinyfly");
        l && s.registerTarget(l, a);
      }
    }
    this.setupNested(i, s);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(e, n) {
    const s = [];
    e.querySelectorAll("[data-tinyfly-symbol]").forEach((i) => {
      const o = i.getAttribute("data-tinyfly-symbol");
      if (!o) return;
      const r = this.symbolDefs.get(o);
      if (!r) return;
      const a = new xe();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: kn(r) });
    }), s.length ? this.nestedByAdapter.set(n, s) : this.nestedByAdapter.delete(n);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(e, n) {
    const s = this.nestedByAdapter.get(e);
    if (s)
      for (const i of s) {
        const o = i.timeline.duration;
        i.adapter.applyState(i.timeline.getStateAtTime(o > 0 ? n % o : n));
      }
  }
  clearContainer(e) {
    e.innerHTML = "";
  }
  createTimeline(e) {
    return e.timeline ? kn(e.timeline) : null;
  }
  onSceneComplete() {
    if (this._isDestroyed || !this.sequence) return;
    const e = this._currentSceneIndex + 1;
    if (e >= this.sequence.scenes.length) {
      const n = this.options.loop ?? this.sequence.loop ?? 0;
      n === -1 || n > 0 && this.loopIteration < n - 1 ? (this.loopIteration++, this.beginTransitionTo(0)) : (this._isPlaying = !1, this._state = "idle", this.stopAnimationLoop(), this.options.onComplete?.());
    } else
      this.beginTransitionTo(e);
  }
  beginTransitionTo(e) {
    if (!this.sequence || this._isDestroyed) return;
    const n = this.sequence.scenes[e], s = n.transition;
    if (s.type === "none" || s.duration <= 0) {
      this.switchToScene(e);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(n, this.containerB, this.adapterB), this.timelineB = this.createTimeline(n), this.timelineB && this.timelineB.play(), this.applyTransition(s.type, s.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(e);
    }, s.duration);
  }
  applyTransition(e, n) {
    const s = `${n}ms`, i = "ease-in-out";
    switch (this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), e) {
      case "fade":
        this.containerB.style.opacity = "0";
        break;
      case "slide-left":
        this.containerB.style.transform = "translateX(100%)";
        break;
      case "slide-right":
        this.containerB.style.transform = "translateX(-100%)";
        break;
      case "slide-up":
        this.containerB.style.transform = "translateY(100%)";
        break;
      case "slide-down":
        this.containerB.style.transform = "translateY(-100%)";
        break;
    }
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${s} ${i}, transform ${s} ${i}`, this.containerB.style.transition = `opacity ${s} ${i}, transform ${s} ${i}`, e) {
      case "fade":
        this.containerA.style.opacity = "0", this.containerB.style.opacity = "1";
        break;
      case "slide-left":
        this.containerA.style.transform = "translateX(-100%)", this.containerB.style.transform = "translateX(0)";
        break;
      case "slide-right":
        this.containerA.style.transform = "translateX(100%)", this.containerB.style.transform = "translateX(0)";
        break;
      case "slide-up":
        this.containerA.style.transform = "translateY(-100%)", this.containerB.style.transform = "translateY(0)";
        break;
      case "slide-down":
        this.containerA.style.transform = "translateY(100%)", this.containerB.style.transform = "translateY(0)";
        break;
    }
  }
  resetTransitionStyles(e) {
    e.style.transition = "", e.style.opacity = "1", e.style.transform = "";
  }
  finishTransition(e) {
    this.transitionTimer = void 0, this.timelineA && (this.timelineA.stop(), this.timelineA = null), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const n = this.containerA;
    this.containerA = this.containerB, this.containerB = n;
    const s = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = s, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = e, this._state = "playing-scene", this.options.onSceneChange?.(e), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
  }
  switchToScene(e) {
    if (!this.sequence || this._isDestroyed) return;
    this.timelineA && this.timelineA.stop(), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const n = this.sequence.scenes[e];
    this.renderScene(n, this.containerA, this.adapterA), this.timelineA = this.createTimeline(n), this._currentSceneIndex = e, this._state = "playing-scene", this.options.onSceneChange?.(e), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play()) : this.onSceneComplete();
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const e = (n) => {
      if (this._isDestroyed || !this._isPlaying) return;
      const s = n - (this.lastTime ?? n);
      if (this.lastTime = n, this.timelineA && this.timelineA.playbackState === "playing") {
        this.timelineA.tick(s);
        const i = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(i), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(s);
        const i = this.timelineB.getStateAtTime(this.timelineB.currentTime);
        this.adapterB.applyState(i), this.applyNested(this.adapterB, this.timelineB.currentTime);
      }
      this._isPlaying ? this.animationFrameId = requestAnimationFrame(e) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(e);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
}
async function Vb(t, e, n = {}) {
  const s = new c0(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const Gb = { type: "none", duration: 0 }, yt = (t) => ({ description: t, unit: "degrees" }), ft = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), Xl = {
  lean: yt("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: yt("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: yt("Head tilt"),
  leftShoulder: yt("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: yt("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: yt("Left elbow bend, added to the upper arm"),
  rightElbow: yt("Right elbow bend, added to the upper arm"),
  leftHip: yt("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: yt("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: yt("Left knee bend (negative folds the shin back)"),
  rightKnee: yt("Right knee bend (positive folds the shin back)"),
  leftWrist: yt("Left wrist bend, added to the forearm"),
  rightWrist: yt("Right wrist bend, added to the forearm"),
  leftAnkle: yt("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: yt("Right ankle: + points the toe down (tiptoe), − onto the heel"),
  leftFootOut: ft("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: ft("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: ft("Mouth open: 0 closed, 1 wide open"),
  smile: ft("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: ft("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: ft("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: ft("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: ft("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: ft("Eyes look across: + the way it faces", -1, 1),
  lookY: ft("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: ft("0 front-on, 1 in profile, turned the way it faces"),
  sit: ft("0 standing, 1 seated"),
  spin: yt("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, Ul = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: ft("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: ft("How much the mouth chatters"),
  rubber: ft("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: ft("How much of the dance is applied")
}, Vl = {
  "thumb.curl": ft("Thumb curled in"),
  "thumb.across": ft("Thumb across the palm"),
  "index.curl": ft("Index finger curled"),
  "middle.curl": ft("Middle finger curled"),
  "ring.curl": ft("Ring finger curled"),
  "pinky.curl": ft("Little finger curled"),
  spread: ft("Fingers spread apart"),
  turn: yt("Hand turned about the forearm"),
  bend: yt("Hand bent at the wrist, palm-ward"),
  tilt: yt("Hand tilted sideways"),
  roll: yt("Hand rolled to show the back or the palm")
};
let Gl;
function h0(t) {
  Gl = t;
}
function u0(t) {
  return Gl?.(t) ?? {};
}
function d0(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function Mn(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = d0(t) * n;
  const i = [t[0]];
  for (let o = 1; o < t.length; o++) {
    const r = t[o - 1], a = t[o], l = Math.hypot(a.x - r.x, a.y - r.y);
    if (l >= s) {
      const c = l === 0 ? 0 : s / l;
      return i.push({ x: r.x + (a.x - r.x) * c, y: r.y + (a.y - r.y) * c }), i;
    }
    i.push(a), s -= l;
  }
  return i;
}
function Mo(t, e) {
  const n = Mn(t, e);
  return n[n.length - 1];
}
function Jl(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Fi(t, e, n) {
  const s = e.roughness ?? 2, i = Math.max(1, Math.round(e.passes ?? 2)), o = Jl(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const d = r++;
    return (f) => On(Vt(`${e.seed ?? 1}:${o}:${d}:${f}`));
  }, l = (d, f) => (d.next() * 2 - 1) * f, c = (d) => {
    const f = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < i; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, d(f(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (d, f = 1) => {
    if (d.length < 2) return;
    const g = d.slice(1).map((m, y) => Math.hypot(m.x - d[y].x, m.y - d[y].y)), p = g.reduce((m, y) => m + y, 0) * Math.min(1, Math.max(0, f));
    c((m) => {
      const y = [], w = [];
      if (d.forEach((v, M) => {
        y.push({ x: v.x + l(m, s * 0.5), y: v.y + l(m, s * 0.5) }), M > 0 && w.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(y[0].x, y[0].y);
      let b = 0;
      for (let v = 1; v < y.length; v++) {
        const M = f0(y[v - 1], y[v], s, w[v - 1]), x = g[v - 1];
        if (b + x <= p) {
          t.bezierCurveTo(M[1].x, M[1].y, M[2].x, M[2].y, M[3].x, M[3].y), b += x;
          continue;
        }
        const T = p0(M, x === 0 ? 1 : (p - b) / x);
        t.bezierCurveTo(T[1].x, T[1].y, T[2].x, T[2].y, T[3].x, T[3].y);
        break;
      }
      t.stroke();
    });
  }, u = (d, f, g, p, m = 1) => {
    c((y) => {
      const b = y.next() * Math.PI * 2, v = Math.PI * 2 + 0.15 + y.next() * 0.3, M = [];
      for (let T = 0; T <= 14; T++) {
        const A = b + v * T / 14, k = l(y, s * 0.6);
        M.push({ x: d + Math.cos(A) * (g + k), y: f + Math.sin(A) * (p + k) });
      }
      const x = Mn(M, m);
      x.length < 2 || (jr(t, x), t.stroke());
    });
  };
  return {
    line: h,
    curve(d, f = 1) {
      if (d.length < 2) return;
      const g = d[0], p = d[d.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, y = -(p.y - g.y) / m, w = (p.x - g.x) / m;
      c((b) => {
        const v = { x: l(b, s * 0.5), y: l(b, s * 0.5) }, M = { x: l(b, s * 0.5), y: l(b, s * 0.5) }, x = l(b, s * Math.min(1.5, Math.max(0.3, m / 80))), T = d.map((k, O) => {
          const $ = O / (d.length - 1), P = Math.sin(Math.PI * $) * x;
          return {
            x: k.x + v.x + (M.x - v.x) * $ + y * P,
            y: k.y + v.y + (M.y - v.y) * $ + w * P
          };
        }), A = Mn(T, f);
        A.length < 2 || (jr(t, A), t.stroke());
      });
    },
    circle(d, f, g, p = 1) {
      u(d, f, g, g, p);
    },
    ellipse: u,
    nudge(d = 0.5) {
      const f = a()(0);
      return { x: l(f, s * d), y: l(f, s * d) };
    }
  };
}
function f0(t, e, n, s) {
  const i = e.x - t.x, o = e.y - t.y, r = Math.hypot(i, o) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -o / r, c = i / r;
  return [
    t,
    { x: t.x + i / 3 + l * s[0] * a, y: t.y + o / 3 + c * s[0] * a },
    { x: t.x + 2 * i / 3 + l * s[1] * a, y: t.y + 2 * o / 3 + c * s[1] * a },
    e
  ];
}
function p0([t, e, n, s], i) {
  const o = (u, d) => ({ x: u.x + (d.x - u.x) * i, y: u.y + (d.y - u.y) * i }), r = o(t, e), a = o(e, n), l = o(n, s), c = o(r, a), h = o(a, l);
  return [t, r, c, o(c, h)];
}
function jr(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const i = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, i.x, i.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function Qn(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const i = [], o = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, d = r(l) / 2, f = -(h.y - c.y) / u * d, g = (h.x - c.x) / u * d;
    i.push({ x: a.x + f, y: a.y + g }), o.push({ x: a.x - f, y: a.y - g });
  }), [...i, ...o.reverse()];
}
function So(t, e, n, s) {
  const i = e.length;
  if (i < 2) return;
  const o = Qn(e, n, s), r = (a) => n + (s - n) * a / (i - 1);
  t.beginPath(), t.moveTo(o[0].x, o[0].y);
  for (const a of o.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== i - 1 && i > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function Je(t, e, n, s, i = 16) {
  const o = { x: 2 * e.x - (t.x + n.x) / 2, y: 2 * e.y - (t.y + n.y) / 2 }, r = [];
  for (let a = 0; a <= i; a++) {
    const l = a / i, c = l < 0.5 ? { x: t.x + (e.x - t.x) * 2 * l, y: t.y + (e.y - t.y) * 2 * l } : { x: e.x + (n.x - e.x) * (2 * l - 1), y: e.y + (n.y - e.y) * (2 * l - 1) }, h = 1 - l, u = {
      x: h * h * t.x + 2 * h * l * o.x + l * l * n.x,
      y: h * h * t.y + 2 * h * l * o.y + l * l * n.y
    };
    r.push({ x: c.x + (u.x - c.x) * s, y: c.y + (u.y - c.y) * s });
  }
  return r;
}
function Br(t, e, n, s, i, o = 0, r = 1, a = 40) {
  const l = Math.cos(i), c = Math.sin(i);
  return Array.from({ length: a + 1 }, (h, u) => {
    const d = o + Math.PI * 2 * r * u / a, f = Math.cos(d) * n, g = Math.sin(d) * s;
    return { x: t + f * l - g * c, y: e + f * c + g * l };
  });
}
function Os(t, e) {
  return e.look === "pencil" ? b0(t, e) : g0(t, e.ink, e.look);
}
function ds(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function g0(t, e, n) {
  const s = n === "silhouette", i = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(o, r, a) {
      t.fillStyle = e, So(t, o, r * i, a * i);
    },
    line(o, r) {
      o.length < 2 || (t.strokeStyle = e, t.lineWidth = r * i, t.lineCap = "round", t.lineJoin = "round", ds(t, o), t.stroke());
    },
    shape(o, r, a) {
      ds(t, o, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * i, t.lineJoin = "round", t.stroke());
    },
    ellipse(o, r, a, l, c, h, u) {
      t.beginPath(), t.ellipse(o, r, a, l, c, 0, Math.PI * 2), (h !== null || s) && (t.fillStyle = s ? e : h, t.fill()), !(u <= 0) && (t.strokeStyle = e, t.lineWidth = u * i, t.stroke());
    },
    dot(o, r, a) {
      t.fillStyle = e, t.beginPath(), t.arc(o, r, a * i, 0, Math.PI * 2), t.fill();
    },
    guide() {
    },
    guideEllipse() {
    }
  };
}
function m0(t, e) {
  const n = [t[0]];
  let s = 0;
  for (let r = 1; r < t.length; r++) {
    const a = t[r - 1], l = t[r], c = Math.hypot(l.x - a.x, l.y - a.y);
    let h = e - s;
    for (; h < c; ) {
      const u = h / c;
      n.push({ x: a.x + (l.x - a.x) * u, y: a.y + (l.y - a.y) * u }), h += e;
    }
    s = c - (h - e);
  }
  const i = t[t.length - 1], o = n[n.length - 1];
  return Math.hypot(i.x - o.x, i.y - o.y) > e * 0.25 ? n.push(i) : n[n.length - 1] = i, n;
}
function y0(t, e) {
  const n = t.length;
  return t.map((s, i) => {
    const o = t[Math.max(0, i - 1)], r = t[Math.min(n - 1, i + 1)], a = Math.hypot(r.x - o.x, r.y - o.y) || 1, l = e(n === 1 ? 0 : i / (n - 1));
    return { x: s.x - (r.y - o.y) / a * l, y: s.y + (r.x - o.x) / a * l };
  });
}
function qr(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, i) => s + i.amount, 0);
  return (s) => e.reduce((i, o) => i + o.amount * Math.sin(Math.PI * 2 * o.frequency * s + o.phase), 0) / n;
}
function b0(t, e) {
  const n = e.pencil ?? {}, s = e.ink, i = n.roughness ?? Math.max(1, e.lineWidth * 0.12), o = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = Jl(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => On(Vt(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, y, w, b = 0) => {
    if (g.length < 2) return;
    const v = g.slice(1).reduce(($, P, L) => $ + Math.hypot(P.x - g[L].x, P.y - g[L].y), 0);
    let M = m0(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, v / 24)));
    if (b > 0 && M.length >= 2) {
      const [$, P] = [M[M.length - 2], M[M.length - 1]], L = Math.hypot(P.x - $.x, P.y - $.y) || 1;
      M = [...M, { x: P.x + (P.x - $.x) / L * b, y: P.y + (P.y - $.y) / L * b }];
    }
    const x = qr(m), T = qr(m), A = M.length, k = [], O = [];
    M.forEach(($, P) => {
      const L = A === 1 ? 0 : P / (A - 1), _ = M[Math.max(0, P - 1)], R = M[Math.min(A - 1, P + 1)], D = Math.hypot(R.x - _.x, R.y - _.y) || 1, Y = -(R.y - _.y) / D, j = (R.x - _.x) / D, U = x(L) * w, G = Math.min(1, L / 0.08, (1 - L) / 0.08), E = (0.55 + 0.45 * Math.sqrt(Math.max(0, G))) * (1 + r * T(L)), H = Math.max(0.3, p(L) * E / 2), S = $.x + Y * U, I = $.y + j * U;
      k.push({ x: S + Y * H, y: I + j * H }), O.push({ x: S - Y * H, y: I - j * H });
    }), t.save(), t.globalAlpha *= y, t.fillStyle = s, ds(t, [...k, ...O.reverse()], !0), t.fill(), t.restore();
  }, d = (g, p) => {
    const m = c++, y = h(m, 99, !0);
    if (y.next() < a) {
      const M = (y.next() * 2 - 1) * e.lineWidth * 1.4, x = (y.next() * 2 - 1) * e.lineWidth * 1.4, T = g.map((A) => ({ x: A.x + M, y: A.y + x }));
      u(T, (A) => p(A) * 1.8, h(m, 98, !0), 0.035, i), u(T, (A) => p(A) * 0.45, h(m, 97, !0), 0.12, i * 1.5);
    }
    const w = g.slice(1).reduce((M, x, T) => M + Math.hypot(x.x - g[T].x, x.y - g[T].y), 0), b = p(0.5) > 4 && w > p(0.5) * 6, v = b ? [-0.3, 0.3, 0] : [0];
    for (let M = 0; M < o; M++) {
      const x = M === 0;
      v.forEach((T, A) => {
        const k = h(m, M * 10 + A), O = T === 0 ? g : y0(g, (P) => p(P) * T * Math.sqrt(Math.sin(Math.PI * P))), $ = !x && T === 0 ? e.lineWidth * (0.3 + k.next() * 0.8) : 0;
        u(O, (P) => p(P) * (b ? 0.5 : 1) * (x ? 1 : 0.6), k, x ? 0.85 : 0.45, i * (x ? 0.6 : 1), $);
      });
    }
  }, f = (g, p, m, y, w, b) => {
    const M = h(c, 50).next() * Math.PI * 2;
    d(Br(g, p, m, y, w, M, 1.08, 48), () => b);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, p, m) {
      d(g, (y) => p + (m - p) * y);
    },
    line(g, p) {
      d(g, () => p);
    },
    shape(g, p, m) {
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, ds(t, g, !0), t.fill(), t.restore()), m > 0 && d([...g, g[0]], () => m);
    },
    ellipse(g, p, m, y, w, b, v) {
      b !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = b, t.beginPath(), t.ellipse(g, p, m, y, w, 0, Math.PI * 2), t.fill(), t.restore()), f(g, p, m, y, w, v);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      u(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, i * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, y, w) {
      if (n.construction === !1) return;
      const b = c++, v = h(b, 0), M = Br(g, p, m, y, w, v.next() * Math.PI * 2, 1.12, 48);
      u(M, () => Math.max(0.6, e.lineWidth * 0.18), v, 0.28, i * 1.5);
    }
  };
}
const w0 = ["thumb", "index", "middle", "ring", "pinky"], Mt = {
  "thumb.curl": 0.15,
  "thumb.across": 0.15,
  "index.curl": 0.12,
  "middle.curl": 0.16,
  "ring.curl": 0.2,
  "pinky.curl": 0.25,
  spread: 0.25,
  turn: 0,
  bend: 0,
  tilt: 0,
  roll: 0
};
function vt(t = {}) {
  return { ...Mt, ...t };
}
const Ot = (t, e, n, s, i) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": i
}), Et = {
  relaxed: Mt,
  open: vt({ ...Ot(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: vt({ ...Ot(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: vt({ ...Ot(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: vt({ ...Ot(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: vt({ ...Ot(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: vt({ ...Ot(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: vt({ ...Ot(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: vt({ ...Ot(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: vt({ ...Ot(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: vt({ ...Ot(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: vt({ ...Ot(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: vt({ ...Ot(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: vt({ ...Ot(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function Sn(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
const k0 = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, v0 = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, Gt = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, M0 = [82, 100, 62], S0 = [48, 72], T0 = 3, x0 = 13, E0 = 0.035, A0 = -0.075, $0 = [
  [-0.17, 0],
  [-0.215, 0.12],
  [-0.235, 0.26],
  [-0.225, 0.4],
  [-0.185, 0.49],
  [-0.075, 0.525],
  [0.05, 0.51],
  [0.16, 0.465],
  [0.215, 0.4],
  [0.225, 0.26],
  [0.2, 0.1],
  [0.16, 0]
], ae = (t) => t * Math.PI / 180, Di = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], ts = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Ni = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], an = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Ee(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = Ni(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + o[0] * i + e[0] * r * (1 - s),
    t[1] * s + o[1] * i + e[1] * r * (1 - s),
    t[2] * s + o[2] * i + e[2] * r * (1 - s)
  ];
}
const Yr = [1, 0, 0], Kr = [0, 1, 0], yn = [0, 0, 1];
function P0(t, e, n) {
  const s = ae(t.fan * (T0 + x0 * n)), i = [Math.sin(s), Math.cos(s), 0], o = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += ae(M0[u] * e), r.push(Di(r[u], ts(Ee(i, o, -a), h)));
  });
  const l = Ee(yn, o, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function _0(t, e, n = 1, s = 1) {
  const i = Math.min(1, Math.max(0, e)), o = an(Di(ts(an(Gt.out), 1 - i), ts(an(Gt.across), i))), r = an(Ni(yn, o)), a = an(Ni(o, r)), l = [[Gt.base[0] * s, Gt.base[1], Gt.base[2]]];
  let c = 0;
  Gt.bones.forEach((d, f) => {
    f > 0 && (c += ae(S0[f - 1] * t)), l.push(Di(l[f], ts(Ee(o, r, c), d)));
  });
  const h = Ee(a, r, c), u = [...Gt.widths, Gt.widths[Gt.widths.length - 1] * 0.92].map((d) => d * n);
  return { joints: l, back: h, widths: u };
}
function Wi(t, e = {}) {
  const n = { ...Mt, ...t }, s = e.size ?? 100, i = e.side ?? "right", o = i === "left" ? -1 : 1, r = ae(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (P) => ({
    ...P,
    knuckle: [P.knuckle[0] * c, P.knuckle[1], P.knuckle[2]],
    width: P.width * l
  }), u = ae(n.bend ?? 0), d = ae(n.tilt ?? 0), f = ae(90 * (n.turn ?? 0)), g = (P) => Ee(Ee(Ee(P, Yr, -u), yn, -d), Kr, f), p = Math.cos(r), m = Math.sin(r), y = ae(n.roll ?? 0), w = Math.cos(y), b = Math.sin(y), v = (P) => {
    const L = P[0] * s, _ = -P[1] * s, R = (L * w - _ * b) * o, D = L * b + _ * w;
    return { x: R * p - D * m, y: R * m + D * p };
  }, M = (P) => {
    const L = v(P), _ = Math.hypot(L.x, L.y);
    return _ > 1e-6 * s ? { x: L.x / _, y: L.y / _ } : { x: 0, y: 0 };
  }, x = {
    thumb: _0(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, T = a ? v0 : k0;
  for (const P of w0) {
    const L = T[P];
    L && (x[P] = P0(h(L), n[`${P}.curl`] ?? 0, n.spread ?? 0));
  }
  const A = {};
  for (const [P, L] of Object.entries(x)) {
    const _ = L.joints.map(g), R = g(L.back);
    A[P] = {
      points: _.map(v),
      depths: _.map((D) => D[2] * s),
      widths: L.widths.map((D) => D * s),
      nail: R[2],
      back: M(R)
    };
  }
  const k = $0.flatMap(([P, L]) => [g([P * c, L, E0]), g([P * c, L, A0])]), O = I0(k.map(v)), $ = k.reduce((P, L) => P + L[2], 0) / k.length * s;
  return {
    size: s,
    side: i,
    wrist: { x: 0, y: 0 },
    palm: O,
    palmDepth: $,
    palmFacing: -g(yn)[2],
    fingers: A,
    axes: { up: M(g(Kr)), across: M(g(Yr)), out: M(g(yn)) },
    curls: Object.fromEntries(Object.keys(A).map((P) => [P, n[`${P}.curl`] ?? 0]))
  };
}
function O0(t, e) {
  const n = (i) => ({ x: i.x + e.x - t.wrist.x, y: i.y + e.y - t.wrist.y }), s = {};
  for (const [i, o] of Object.entries(t.fingers))
    s[i] = { ...o, points: o.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function I0(t) {
  const e = [...t].sort((o, r) => o.x - r.x || o.y - r.y);
  if (e.length < 3) return e;
  const n = (o, r, a) => (r.x - o.x) * (a.y - o.y) - (r.y - o.y) * (a.x - o.x), s = [];
  for (const o of e) {
    for (; s.length >= 2 && n(s[s.length - 2], s[s.length - 1], o) <= 0; ) s.pop();
    s.push(o);
  }
  const i = [];
  for (const o of [...e].reverse()) {
    for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], o) <= 0; ) i.pop();
    i.push(o);
  }
  return [...s.slice(0, -1), ...i.slice(0, -1)];
}
const H0 = "#f1c9a5", C0 = "#2f2f33";
function To(t, e, n, s = {}, i = 0) {
  const o = O0(Wi(n, s), e), r = s.ink ?? C0, a = s.lineWidth ?? o.size * 0.035, l = s.pen ?? Os(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: i,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? H0, h = s.nails ?? !0, u = [
    {
      depth: o.palmDepth,
      draw: () => R0(l, o, c, a)
    }
  ];
  for (const d of Object.values(o.fingers)) {
    const f = d.depths.reduce((g, p) => g + p, 0) / d.depths.length;
    u.push({
      depth: f,
      draw: () => L0(t, l, d, c, a, h)
    });
  }
  if (s.prop) {
    const d = s.prop;
    u.push({ depth: d.depth, draw: () => d.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const d of [...u].sort((f, g) => f.depth - g.depth)) d.draw();
  return t.restore(), o;
}
function R0(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: i } = e.axes;
    for (const [o, r] of Object.entries(e.fingers)) {
      const a = e.curls[o] ?? 0;
      if (o === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - i.x * c * 0.2, y: l.y - i.y * c * 0.2 }, u = Math.atan2(i.y, i.x), d = Array.from({ length: 7 }, (f, g) => {
        const p = u - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      t.line(d, s * 0.6);
    }
  }
  if (e.palmFacing > 0.45 && t.look !== "silhouette") {
    const { up: i, across: o } = e.axes, r = e.size, a = e.wrist, l = (h, u) => ({
      x: a.x + (o.x * h + i.x * u) * r,
      y: a.y + (o.y * h + i.y * u) * r
    }), c = e.side === "left" ? -1 : 1;
    t.line([l(-0.15 * c, 0.36), l(-0.04 * c, 0.3), l(0.1 * c, 0.33)], s * 0.5);
  }
}
function L0(t, e, n, s, i, o) {
  const { widths: r } = n, a = F0(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + i * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * i, u + 2 * i), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, So(t, a, h, u)), e.look === "silhouette" || !o || n.nail < 0.25) return;
  const d = a[a.length - 2], f = D0({ x: c.x - d.x, y: c.y - d.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - f.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - f.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(f.y, f.x), "#f8e3d3", i * 0.45);
}
function F0(t, e) {
  let n = t;
  for (let s = 0; s < e; s++) {
    if (n.length < 3) return n;
    const i = [n[0]];
    for (let o = 0; o < n.length - 1; o++) {
      const r = n[o], a = n[o + 1];
      o > 0 && i.push({ x: r.x * 0.75 + a.x * 0.25, y: r.y * 0.75 + a.y * 0.25 }), o < n.length - 2 && i.push({ x: r.x * 0.25 + a.x * 0.75, y: r.y * 0.25 + a.y * 0.75 });
    }
    i.push(n[n.length - 1]), n = i;
  }
  return n;
}
const D0 = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Ct = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, N0 = 40;
function Is(t) {
  return t === void 0 ? Ct.walk : typeof t == "string" ? Ct[t] ?? Ct.walk : t;
}
function W0(t, e, n = rt, s = 1) {
  const i = Is(t);
  if (i === Ct.walk) return B0(e, n, s);
  const o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (y) => Math.abs(y) <= N0, c = i.shoulder ?? 0, h = (y, w) => l(y) ? w * c + i.arm * r : y, u = i.forearm ?? 0, d = l(n.leftShoulder) ? n.leftElbow - u - i.elbow * Math.max(0, -r) : n.leftElbow, f = l(n.rightShoulder) ? n.rightElbow + u + i.elbow * Math.max(0, r) : n.rightElbow, g = i.bounces ?? 1, p = (1 + Math.cos(o * 2 * g)) / 2, m = i.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + i.lean * s + (i.sway ?? 0) * Math.sin(o) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (i.bend ?? 0),
    headTilt: n.headTilt - i.lean * 0.5 * s + (i.headTilt ?? 0),
    leftElbow: d,
    rightElbow: f,
    // A crouch brings both thighs forward and folds both shins back.
    leftHip: -i.swing * r - m * 0.5,
    rightHip: -i.swing * r + m * 0.5,
    // The leg swinging forward lifts its knee; a crouch keeps both bent. A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -i.knee * Math.max(0, a) - m,
    rightKnee: i.knee * Math.max(0, -a) + m,
    leftAnkle: (n.leftAnkle ?? 0) + (i.tiptoe ?? 0),
    rightAnkle: (n.rightAnkle ?? 0) + (i.tiptoe ?? 0),
    leftShoulder: h(n.leftShoulder, -1),
    rightShoulder: h(n.rightShoulder, 1),
    rise: (n.rise ?? 0) + (i.bounce ?? 0) * s * p,
    stretch: n.stretch * (1 + (i.squash ?? 0) * (p - 0.5))
  };
}
function zr(t, e, n = 1) {
  const s = Is(t), i = Ct.walk.swing, o = (r) => Math.sin(r * Math.PI / 180);
  return q0(e, n) * o(s.swing * n) / o(i * n);
}
const rt = {
  lean: 0,
  bend: 0,
  headTilt: 0,
  leftShoulder: 18,
  rightShoulder: 18,
  leftElbow: -6,
  rightElbow: -6,
  leftHip: 8,
  rightHip: 8,
  leftKnee: 0,
  rightKnee: 0,
  leftWrist: 0,
  rightWrist: 0,
  leftAnkle: 0,
  rightAnkle: 0,
  leftFootOut: 0,
  rightFootOut: 0,
  mouth: 0,
  smile: 0.6,
  mouthWidth: 1,
  blink: 0,
  leftEye: 1,
  rightEye: 1,
  leftBrow: 0,
  rightBrow: 0,
  browTilt: 0,
  lookX: 0,
  lookY: 0,
  stretch: 1,
  turn: 0,
  sit: 0,
  spin: 0,
  rise: 0
};
function xt(t) {
  return { ...rt, ...t };
}
const Zl = {
  mouth: 0,
  smile: 0,
  mouthWidth: 1,
  leftEye: 1,
  rightEye: 1,
  leftBrow: 0,
  rightBrow: 0,
  browTilt: 0,
  lookX: 0,
  lookY: 0
}, Tt = (t) => ({ ...Zl, ...t }), ut = {
  neutral: Zl,
  happy: Tt({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: Tt({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: Tt({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: Tt({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: Tt({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: Tt({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: Tt({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: Tt({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: Tt({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: Tt({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: Tt({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: Tt({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: Tt({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: Tt({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: Tt({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: Tt({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: Tt({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function we(t, e) {
  return { ...t, ...typeof e == "string" ? ut[e] : e };
}
const Nt = {
  rest: rt,
  wave: xt({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...ut.happy }),
  cheer: xt({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...ut.joyful }),
  shrug: xt({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...ut.confused, lookX: 0, lookY: 0 }),
  point: xt({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: xt({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...ut.thinking }),
  handsOnHips: xt({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: xt({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...ut.sad }),
  surprised: xt({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...ut.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: xt({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: xt({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: xt({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...ut.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: xt({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...ut.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: xt({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...ut.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: xt({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...ut.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: xt({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...ut.happy })
}, Ql = Object.keys(rt);
function Tn(t, e, n) {
  const s = { ...t };
  for (const i of Ql) s[i] = t[i] + (e[i] - t[i]) * n;
  return s;
}
const ji = 24, Xr = 4, Ur = 28, j0 = 40;
function B0(t, e = rt, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, i = Math.cos(t * Math.PI * 2) * n, o = (c) => Math.abs(c) <= j0, r = (c) => o(c) ? 22 * s : c, a = o(e.leftShoulder) ? e.leftElbow - Ur * Math.max(0, -s) : e.leftElbow, l = o(e.rightShoulder) ? e.rightElbow + Ur * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + Xr * n,
    headTilt: e.headTilt - Xr * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -ji * s,
    rightHip: -ji * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, i),
    rightKnee: 30 * Math.max(0, -i),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function q0(t, e = 1) {
  return 4 * ((Bi + fs) * t) * Math.sin(ji * e * Math.PI / 180);
}
function Y0(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const tc = 0.12, Vr = 0.46, K0 = 1 - 2 * tc, z0 = 0.1, X0 = 0.21, U0 = 0.19, Bi = 0.24, fs = 0.22, ec = 0.12, V0 = 0.14, nc = 0.33, Gr = 0.7, Jr = 0.3, G0 = 0.35, J0 = [1.7, 1.05], Z0 = [1.3, 0.75], Zr = [1.45, 0.85], Q0 = [1.15, 0.75], Qr = 0.06, tp = 0.7, ep = 0.65, sc = 0.075, np = 0.3, sp = 0.02, ip = 0.012, op = 12, rp = 0.25, Dn = 90, ap = 0.25, lp = 0.04, ic = 0.01, ke = (t) => Math.min(1, Math.max(0, t ?? 0));
function Jb(t, e = 1) {
  return fs * t * e;
}
const qi = -0.12, oc = 0.4, Ft = (t) => t * Math.PI / 180, cp = (t, e) => ({ x: e * Math.sin(Ft(t)), y: Math.cos(Ft(t)) }), rc = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), ac = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function hp(t, e, n, s, i, o) {
  const r = Math.max(1, Math.min(o * 0.6, V0 * n)), a = ke(e.turn), l = (ec + nc * a) * n, c = s + qi * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, d = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Gr * a), squeeze: 1 - Gr * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Jr * a), squeeze: 1 - Jr * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = i, t.strokeStyle = i, t.lineWidth = r;
  for (const y of d) {
    const w = rc(y.open, e.blink);
    if (w < 0.2) {
      const x = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(y.x + l - 0.12 * n, c), t.quadraticCurveTo(y.x + l, c + x, y.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (w > 1.2) {
        const T = 0.13 * n * w;
        t.beginPath(), t.ellipse(y.x + l, c, T * 0.85, T, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = i;
      }
      const x = w > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(y.x + h, c + u, x, x * 1.1 * Math.min(w, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const b = ac(c, n, y.brow, w), v = y.x + l - y.side * 0.13 * n * y.squeeze, M = y.x + l + y.side * 0.13 * n * y.squeeze;
    t.beginPath(), t.moveTo(M, b), t.lineTo(v, b - e.browTilt * 0.1 * n), t.stroke();
  }
  const f = s + oc * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - G0 * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, f), t.quadraticCurveTo(l, f + e.smile * 0.25 * n, l + g, f), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, f - 0.05 * n), t.lineTo(l + g, f - 0.05 * n), t.quadraticCurveTo(l, f + m * 2, l - g, f - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, f + m * 0.6), t.lineTo(l + g, f + m * 0.6), t.quadraticCurveTo(l, f - m * 1.4, l - g, f + m * 0.6)) : t.ellipse(l, f, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function lc(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), i = Math.sqrt(s), o = (e.headSize ?? 2 * tc) / 2, r = e.headSize === void 0 ? K0 : 1 - 2 * o, a = o * n, l = ke(t.sit), c = t.leftHip + (-Dn - t.leftHip) * l, h = t.leftKnee + (-Dn - t.leftKnee) * l, u = t.rightHip + (Dn - t.rightHip) * l, d = t.rightKnee + (Dn - t.rightKnee) * l, f = e.classic === !0, g = ke(t.turn), p = (j, U, G, E, H) => {
    const S = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Ft(U - G) / 2) + Ft(E))), I = Math.max(-1, Math.min(1, tp + H)), F = g + (1 - g) * j * I;
    return f ? { x: 0, y: 0 } : { x: Math.cos(S) * Qr * F, y: Math.sin(S) * Qr };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, y = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let w = 0;
  if (l > 0 || !f) {
    const j = (H, S, I, F, B) => Bi * Math.cos(Ft(S)) + fs * Math.cos(Ft(S - I)) + Math.max(0, p(H, S, I, F, B).y), U = Math.max(
      j(-1, c, h, m.left, y.left),
      j(1, u, d, m.right, y.right)
    ), G = 1 - ke((t.rise ?? 0) / lp), E = (f ? Math.min(1, l / ap) : 1) * G;
    w = (Vr - U) * E * n * s;
  }
  const b = -Vr * n * s + w, v = -r * n * s + w, M = f ? 0 : (sp * ke(t.turn) + ip * l) * n * s, x = Ft(t.bend ?? 0), T = { end: ea(b, v, x, 1), bend: x };
  let A;
  if (x !== 0) {
    A = [];
    for (let j = 0; j <= ta; j++) {
      const U = j / ta, G = ea(b, v, x, U);
      A.push({ x: G.x - M * Math.sin(Math.PI * U), y: G.y });
    }
  } else
    A = M === 0 ? [{ x: 0, y: b }, { x: 0, y: v }] : Je({ x: 0, y: b }, { x: -M, y: (b + v) / 2 }, { x: 0, y: v }, 1, 8);
  const k = v + z0 * n * s, O = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), $ = (j, U, G, E, H) => {
    const S = cp(G, E);
    return { x: j + S.x * H * n, y: U + S.y * H * n };
  }, P = (j, U, G) => {
    const E = $(0, b, U, j, Bi * s);
    return { root: { x: 0, y: b }, joint: E, end: $(E.x, E.y, U - G, j, fs * s) };
  }, L = (j, U, G) => {
    const E = { x: j * O, y: k }, H = $(E.x, E.y, U, j, X0 * i);
    return { root: E, joint: H, end: $(H.x, H.y, U + G, j, U0 * i) };
  }, _ = { left: P(-1, c, h), right: P(1, u, d) }, R = (j, U, G, E, H, S) => {
    const I = p(j, G, E, H, S);
    return { x: U.end.x + I.x * n * s, y: U.end.y + I.y * n * s };
  }, D = (j, U, G, E, H) => $(U.end.x, U.end.y, G + E + H, j, sc * i), Y = {
    left: L(-1, t.leftShoulder, t.leftElbow),
    right: L(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(f ? 0 : np, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: b,
    neckY: v,
    drop: w,
    lean: f ? t.lean : t.lean + op * Math.sin(Math.PI * l),
    classic: f,
    legs: _,
    toes: {
      left: R(-1, _.left, c, h, m.left, y.left),
      right: R(1, _.right, u, d, m.right, y.right)
    },
    spine: A,
    chest: T,
    arms: Y,
    handTips: {
      left: D(-1, Y.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: D(1, Y.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const ta = 10;
function ea(t, e, n, s) {
  const i = t - e, o = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - i * s };
  const r = i / n;
  return { x: r * (1 - Math.cos(o)), y: t - r * Math.sin(o) };
}
function up(t, e) {
  if (t.chest.bend === 0) return e;
  const n = xn(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const gn = (t, e) => e === 0 ? [t.root, t.joint, t.end] : Je(t.root, t.joint, t.end, e);
function xn(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = t.x - e.x, r = t.y - e.y;
  return { x: e.x + o * s - r * i, y: e.y + o * i + r * s };
}
function cc(t, e, n = !0) {
  const s = fp(t, e), i = e.spin ?? 0, o = e.rise ?? 0;
  return n && (i !== 0 || o !== 0) ? dp(s, t, i, o) : s;
}
function hc(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Ft(e), lift: n * t.height };
}
function dp(t, e, n, s) {
  const { pivot: i, angle: o, lift: r } = hc(e, n, s), a = (d) => {
    const f = xn(d, i, o);
    return { x: f.x, y: f.y - r };
  }, l = (d) => ({ left: a(d.left), right: a(d.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = ic * e.height;
  return {
    ...t,
    hip: a(t.hip),
    neck: a(t.neck),
    shoulders: l(t.shoulders),
    elbows: l(t.elbows),
    hands: l(t.hands),
    fingertips: l(t.fingertips),
    knees: l(t.knees),
    feet: l(t.feet),
    toes: l(t.toes),
    feetY: h,
    grounded: { left: c.left >= h - u, right: c.right >= h - u },
    handAngle: { left: t.handAngle.left + o, right: t.handAngle.right + o },
    limbs: {
      leftArm: t.limbs.leftArm.map(a),
      rightArm: t.limbs.rightArm.map(a),
      leftLeg: t.limbs.leftLeg.map(a),
      rightLeg: t.limbs.rightLeg.map(a),
      spine: t.limbs.spine.map(a)
    },
    head: { ...t.head, center: a(t.head.center), angle: t.head.angle + o }
  };
}
function fp(t, e) {
  const n = Ft(t.lean), s = Ft(e.headTilt), i = { x: 0, y: t.hipY }, o = (v) => ({ x: t.facing * v.x, y: v.y }), r = (v) => o(xn(v, i, n)), a = (v) => r(up(t, v)), l = (v) => a(xn({ x: v.x, y: v.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = gn(t.arms.left, t.rubber).map(a), h = gn(t.arms.right, t.rubber).map(a), u = (v, M) => Math.atan2(M.y - v.y, M.x - v.x), d = { left: a(t.handTips.left), right: a(t.handTips.right) }, f = (v, M) => {
    const [x, T] = v.slice(-2), A = t.arms[M], k = u(a(A.end), d[M]) - u(a(A.joint), a(A.end));
    return u(x, T) + k;
  };
  let g = 1 / 0;
  for (const [v, M] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const x = ac(qi, 1, v, rc(M, e.blink));
    g = Math.min(g, x, x - e.browTilt * 0.1);
  }
  const p = { left: o(t.legs.left.end), right: o(t.legs.right.end) }, m = { left: o(t.toes.left), right: o(t.toes.right) }, y = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, w = Math.max(y.left, y.right), b = ic * t.height;
  return {
    facing: t.facing,
    height: t.height,
    stretch: t.stretch,
    lineWidth: t.lineWidth,
    hip: i,
    neck: a({ x: 0, y: t.neckY }),
    shoulders: { left: a(t.arms.left.root), right: a(t.arms.right.root) },
    elbows: { left: a(t.arms.left.joint), right: a(t.arms.right.joint) },
    hands: { left: a(t.arms.left.end), right: a(t.arms.right.end) },
    knees: { left: o(t.legs.left.joint), right: o(t.legs.right.joint) },
    feet: p,
    toes: m,
    feetY: w,
    grounded: { left: y.left >= w - b, right: y.right >= w - b },
    fingertips: d,
    handAngle: { left: f(c, "left"), right: f(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: gn(t.legs.left, t.rubber).map(o),
      rightLeg: gn(t.legs.right, t.rubber).map(o),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: qi,
      browTopY: g,
      mouthY: oc,
      faceX: t.facing * (ec + nc * ke(e.turn))
    }
  };
}
function ge(t, e = {}) {
  return cc(lc(t, e), t);
}
function Zb(t, e, n) {
  return xn({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function pp(t, e, n) {
  const s = (o) => ({ x: o.x + e, y: o.y + n }), i = (o) => ({ left: s(o.left), right: s(o.right) });
  return {
    ...t,
    hip: s(t.hip),
    neck: s(t.neck),
    shoulders: i(t.shoulders),
    elbows: i(t.elbows),
    hands: i(t.hands),
    fingertips: i(t.fingertips),
    knees: i(t.knees),
    feet: i(t.feet),
    toes: i(t.toes),
    feetY: t.feetY + n,
    grounded: { ...t.grounded },
    handAngle: { ...t.handAngle },
    limbs: {
      leftArm: t.limbs.leftArm.map(s),
      rightArm: t.limbs.rightArm.map(s),
      leftLeg: t.limbs.leftLeg.map(s),
      rightLeg: t.limbs.rightLeg.map(s),
      spine: t.limbs.spine.map(s)
    },
    head: { ...t.head, center: s(t.head.center) }
  };
}
function gp(t, e, n = {}, s = 0) {
  const i = lc(e, n), o = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? cc(i, e, !1) : void 0, l = n.sketch ? Fi(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Fi(t, n.sketch, s) : void 0, h = (T) => {
    t.save(), T(), t.restore();
  }, u = (T) => {
    T && a && h(() => T(t, a, s, c));
  }, d = () => t.scale(i.facing, 1), f = () => {
    d(), t.translate(0, i.hipY), t.rotate(Ft(i.lean)), t.translate(0, -i.hipY);
  }, g = () => {
    f(), i.chest.bend !== 0 && (t.translate(i.chest.end.x, i.chest.end.y), t.rotate(i.chest.bend), t.translate(0, -i.neckY));
  }, p = (T, A, k) => {
    if (l) return A ? l.curve(T) : l.line(T);
    if (i.classic) {
      t.beginPath(), t.moveTo(T[0].x, T[0].y);
      for (const O of T.slice(1)) t.lineTo(O.x, O.y);
      t.stroke();
      return;
    }
    So(t, T, k[0] * i.lineWidth, k[1] * i.lineWidth);
  }, m = (T, A) => p(gn(T, i.rubber), i.rubber > 0, A), y = (T) => {
    i.classic || p([i.legs[T].end, i.toes[T]], !1, Q0);
  }, w = (T) => {
    if (n.hands && !i.classic) return v(T);
    if (i.classic || l) return;
    const A = i.arms[T].end;
    t.beginPath(), t.arc(A.x, A.y, ep * i.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = o, t.fillStyle = o, t.lineWidth = i.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const b = hc(i, e.spin ?? 0, e.rise ?? 0);
  (b.angle !== 0 || b.lift !== 0) && (t.translate(0, -b.lift), t.translate(b.pivot.x, b.pivot.y), t.rotate(b.angle), t.translate(-b.pivot.x, -b.pivot.y));
  function v(T) {
    const A = n.hands ?? {}, k = i.arms[T].end, O = i.handTips[T], $ = n.headFill ?? "#ffffff";
    To(t, k, A[T] ?? Mt, {
      side: T,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(O.x - k.x, k.y - O.y) * 180 / Math.PI,
      size: (A.size ?? sc) * i.height * Math.sqrt(i.stretch),
      skin: A.skin ?? ($ === "none" ? void 0 : $),
      ink: o,
      lineWidth: i.lineWidth * 0.45,
      fingers: A.fingers,
      plump: A.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const M = (T) => {
    h(() => {
      g(), m(i.arms[T], Z0), w(T);
    });
    const A = r.sleeve;
    A && a && h(() => A(t, a, T, s, c));
  }, x = ke(e.turn) > rp;
  u(r.behind), h(() => {
    d(), m(i.legs.left, Zr), y("left"), m(i.legs.right, Zr), y("right");
  }), x && M("left"), h(() => {
    f(), p(i.spine, i.spine.length > 2, J0);
  }), h(() => {
    g();
    const { left: T, right: A } = { left: i.arms.left.root, right: i.arms.right.root };
    if (T.x !== A.x)
      if (i.classic) p([T, A], !1, [1, 1]);
      else {
        const k = { x: (T.x + A.x) / 2, y: T.y - 0.3 * Math.abs(A.x - T.x) };
        p(Je(T, k, A, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), x || M("left"), M("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, i.neckY), t.rotate(Ft(e.headTilt));
    const T = -i.headRy;
    t.beginPath(), t.ellipse(0, T, i.headRx, i.headRy, 0, 0, Math.PI * 2);
    const A = n.headFill ?? "#ffffff";
    if (A !== "none" && (t.fillStyle = A, t.fill()), l) {
      l.ellipse(0, T, i.headRx, i.headRy);
      const k = l.nudge();
      t.translate(k.x, k.y);
    } else
      t.stroke();
    t.translate(0, T), t.scale(i.headRx / i.r, i.headRy / i.r), hp(t, e, i.r, 0, o, i.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = o, t.font = n.labelFont ?? `700 ${Math.round(i.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -i.height * i.stretch - 0.04 * i.height + i.drop), t.restore());
}
function uc(t, e, n, s) {
  const i = { ...t }, o = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? Tn(i, W0(o, t.walk, i), t.walking) : i, a = yp(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = Tn(r, c.pose, l), c.hands) {
      const h = (u, d) => d ? Sn(u ?? Mt, d, l) : u;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * Y0(e)) }), { pose: r, hands: a };
}
function mp(t, e, n, s) {
  return uc(t, e, n, s).pose;
}
const dc = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, ps = (t, e) => `hand.${t}.${e}`;
function yp(t) {
  const e = (i) => {
    if (typeof t[ps(i, "spread")] == "number")
      return Object.fromEntries(Object.keys(Mt).map((o) => [o, t[ps(i, o)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function bp(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function fc(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, i = { ...xt(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, o = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? Mt;
      for (const l of Object.keys(Mt)) o[ps(r, l)] = a[l] ?? Mt[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...i, ...o },
    about: wp(Object.keys(o), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = uc(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), gp(r, h.pose, bp({ ...e, rubber: c.rubber, facing: dc(c, e) }, h.hands), l);
    }
  };
}
function wp(t, e) {
  const n = { ...Xl, ...Ul };
  for (const s of t) {
    const [, i, ...o] = s.split("."), r = Vl[o.join(".")];
    r && (n[s] = { ...r, description: `${i === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return u0(e);
    }
  };
}
function pc(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (i.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? o = h : c === "y" || c === "motionPathY" ? r = h : c in i && (i[c] = h));
  const a = mp(i, e.time, t.figureDance, t.figureGaits), l = ge(a, { ...s, rubber: i.rubber, facing: dc(i, s) });
  return { pose: a, joints: pp(l, t.x + o + t.width / 2, t.y + r + t.height) };
}
function gc(t) {
  const e = [];
  return t.forEach((n, s) => {
    const i = s === 0 ? rt : e[s - 1], o = typeof n.pose == "string" ? Nt[n.pose] : { ...i, ...n.pose };
    e.push(n.expression ? we(o, n.expression) : o);
  }), e;
}
function Qb(t, e) {
  const n = gc(e);
  return Ql.filter((s) => n.some((i) => i[s] !== rt[s])).map((s) => ({
    id: `${t}-${s}`,
    target: t,
    property: s,
    keyframes: e.map((i, o) => ({
      time: i.time,
      value: n[o][s],
      ...i.easing ? { easing: i.easing } : {}
    }))
  }));
}
const ni = 0.5, Yi = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: vt({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: vt({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: vt({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: Et.fist,
  /** Fist, thumb up */
  shikhara: Et.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: vt({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: vt({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function gs(t) {
  return typeof t != "string" ? t : t in Yi ? Yi[t] : Et[t];
}
function mc(t, e, n) {
  const s = [];
  for (const i of t.keys) {
    const o = s[s.length - 1], r = !o || i.reset ? { pose: e, ...n } : o;
    s.push({
      beat: i.beat,
      pose: { ...r.pose, ...i.pose },
      left: i.hands?.left ? gs(i.hands.left) : r.left,
      right: i.hands?.right ? gs(i.hands.right) : r.right,
      easing: i.easing ?? t.easing
    });
  }
  return s;
}
const xo = (t, e) => (t % e + e) % e;
function kp(t, e, n, s) {
  const i = mc(t, n, s);
  if (i.length === 0) return { pose: n, hands: s };
  const o = xo(e, t.beats);
  let r = i.length - 1;
  for (let f = 0; f < i.length; f++) i[f].beat <= o && (r = f);
  const a = i[r], l = i[(r + 1) % i.length], c = a.beat <= o ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (o - c) / (h - c) : 0, d = $t(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: Tn(a.pose, l.pose, d),
    hands: { left: Sn(a.left, l.left, d), right: Sn(a.right, l.right, d) }
  };
}
const vp = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], Mp = ["lean", "headTilt", "lookX", "spin"], Sp = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function Tp(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, i] of vp) {
    const o = n && Sp.has(s) ? -1 : 1;
    e[s] = o * t[i], e[i] = o * t[s];
  }
  if (!n) for (const s of Mp) e[s] = -t[s];
  return e;
}
const xp = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function Ep(t, e, n) {
  const s = xo(n, 1), i = (1 + Math.cos(2 * Math.PI * s)) / 2, o = e.bounce * (e.accent === "up" ? 1 - i : i), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = xp(r);
  return {
    ...t,
    leftHip: t.leftHip + a * o / 2,
    rightHip: t.rightHip + o / 2,
    leftKnee: t.leftKnee + a * o,
    rightKnee: t.rightKnee + o,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function Ki(t) {
  const e = { ...rt, ...t.stance };
  return t.expression ? we(e, t.expression) : e;
}
function yc(t) {
  return {
    left: t.hands?.left ? gs(t.hands.left) : Mt,
    right: t.hands?.right ? gs(t.hands.right) : Mt
  };
}
function si(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const i = kp(s, n, Ki(t), yc(t));
  return e.mirror ? { pose: Tp(i.pose), hands: { left: i.hands?.right, right: i.hands?.left } } : i;
}
function Eo(t, e, n = {}) {
  const s = typeof t == "string" ? Oe[t] : t;
  let i;
  if (n.move)
    i = si(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const o = s.routine, r = o.reduce((u, d) => u + d.beats, 0), a = xo(e, r);
    let l = 0, c = 0;
    for (; c < o.length - 1 && a >= l + o[c].beats; ) l += o[c++].beats;
    const h = a - l;
    if (i = si(s, o[c], h), h < ni && o.length > 1 && e >= ni) {
      const u = o[(c - 1 + o.length) % o.length], d = si(s, u, u.beats + h), f = $t("ease-in-out")(h / ni);
      i = {
        pose: Tn(d.pose, i.pose, f),
        hands: { left: Sn(d.hands.left, i.hands.left, f), right: Sn(d.hands.right, i.hands.right, f) }
      };
    }
  }
  return { ...i, pose: Ep(i.pose, s.groove, e) };
}
function tw(t, e, n = {}) {
  return Eo(t, e, n).pose;
}
function Ao(t) {
  return (typeof t == "string" ? Oe[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const Ap = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function na(t, e, n, s, i, o, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < o || h >= r))
        for (const u of l.taps ?? []) i.push({ beat: h, tap: s ? Ap[u] : u });
    }
}
function ew(t, e, n, s = {}) {
  const i = typeof t == "string" ? Oe[t] : t, o = [];
  if (n <= e) return o;
  if (s.move) {
    const r = i.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    na(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, o, e, n);
  } else {
    const r = Ao(i);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of i.routine)
        na(i.moves[c.move], l, c.beats, c.mirror, o, e, n), l += c.beats;
    }
  }
  return o.sort((r, a) => r.beat - a.beat);
}
function sa(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (mc(n, Ki(t), yc(t))[0]?.pose.turn ?? Ki(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function bc(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function ii(t, e, n = {}) {
  const s = typeof t == "string" ? Oe[t] : t, i = bc(s, n), o = i.reduce((h, u) => h + u.beats, 0), r = i.reduce((h, u) => h + sa(s, u) * u.beats, 0), a = Math.floor(e / o);
  let l = a * r, c = e - a * o;
  for (const h of i) {
    const u = Math.min(h.beats, c);
    if (l += sa(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function $p(t, e, n) {
  const s = bc(t, n), i = [0];
  let o = 0;
  for (let r = 0; o < e; r = (r + 1) % s.length)
    o += s[r].beats, i.push(Math.min(o, e));
  return i;
}
const Pp = 8;
function _p(t, e, n) {
  const s = typeof e == "string" ? Oe[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Ao(s)), r = $p(s, o, n);
  if (r.every((y) => ii(s, y, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, o / 2), l = $t("ease-in-out"), c = (y) => a <= 0 ? 1 : Math.min(l(Math.min(1, y / a)), l(Math.min(1, (o - y) / a))), h = Math.ceil(a * Pp), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (y, w) => [w / h * a, o - w / h * a]).flat(), d = [.../* @__PURE__ */ new Set([...r, ...u])].sort((y, w) => y - w);
  let f = 0;
  const g = d.map((y, w) => {
    if (w > 0) {
      const b = d[w - 1], v = Math.max(1, Math.ceil((y - b) * 16));
      for (let M = 0; M < v; M++) {
        const x = b + (y - b) * M / v, T = b + (y - b) * (M + 1) / v;
        f += (ii(s, T, n) - ii(s, x, n)) * c((x + T) / 2);
      }
    }
    return { beat: y, travel: f };
  }), p = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((y) => ({ time: p + y.beat * 6e4 / i, value: m + n.height * y.travel, easing: "linear" }))
  };
}
function nw(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function sw(t, e = {}) {
  return (n) => Eo(t, n, e);
}
function iw(t, e) {
  const n = e.start ?? 0, s = 6e4 / e.bpm, i = n + e.beats * s, o = Math.min((e.fade ?? 1) * s, (i - n) / 2);
  return [
    {
      id: `${t}-beat`,
      target: t,
      property: "beat",
      keyframes: [
        { time: n, value: 0 },
        { time: i, value: e.beats, easing: "linear" }
      ]
    },
    {
      id: `${t}-dancing`,
      target: t,
      property: "dancing",
      keyframes: [
        { time: n, value: 0 },
        { time: n + o, value: 1, easing: "ease-in-out" },
        { time: i - o, value: 1 },
        { time: i, value: 0, easing: "ease-in-out" }
      ]
    }
  ];
}
function ow(t, e, n = {}) {
  const s = typeof e == "string" ? Oe[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Ao(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(o * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const y = m / r;
    return { time: a + y * 6e4 / i, frame: Eo(s, y, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((y) => ({ time: y.time, value: m(y.frame) }))
  }), d = Object.keys(rt).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== rt[p]).map((p) => h(p, (m) => m.pose[p])), f = n.height === void 0 ? void 0 : _p(t, s, { ...n, bpm: i, beats: o, start: a, height: n.height, fade: 0 });
  if (f && d.push(f), n.hands === !1) return d;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys(Mt)) {
      const y = (w) => w.hands?.[p]?.[m] ?? Mt[m];
      c.some((w) => y(w.frame) !== Mt[m]) && g.push(h(ps(p, m), y));
    }
  return [...d, ...g];
}
const bn = { type: "back", mode: "out", overshoot: 1.1 }, _t = "ease-out-cubic", Op = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: _t,
      keys: [
        {
          beat: 0,
          pose: { rightShoulder: 150, rightElbow: 0, rightWrist: 0, leftShoulder: 40, leftElbow: -105, leftWrist: -20, lean: -5, headTilt: 8, rightHip: 18, leftHip: 6, lookX: 0.6, lookY: -0.7 },
          hands: { right: "point", left: "fist" }
        },
        { beat: 1, pose: { rightShoulder: -30, rightWrist: 10, lean: 5, headTilt: -6, rightHip: 6, leftHip: 18, lookX: -0.4, lookY: 0.6 } }
      ]
    },
    roll: {
      label: "Roll the arms",
      beats: 2,
      easing: "linear",
      keys: [
        { beat: 0, pose: { leftShoulder: 42, leftElbow: -128, rightShoulder: 26, rightElbow: -100, rightHip: 18, leftHip: 6, lean: -3 }, hands: { left: "fist", right: "fist" } },
        { beat: 0.5, pose: { leftShoulder: 26, leftElbow: -100, rightShoulder: 42, rightElbow: -128 } },
        { beat: 1, pose: { leftShoulder: 42, leftElbow: -128, rightShoulder: 26, rightElbow: -100, rightHip: 6, leftHip: 18, lean: 3 } },
        { beat: 1.5, pose: { leftShoulder: 26, leftElbow: -100, rightShoulder: 42, rightElbow: -128 } }
      ]
    },
    bump: {
      label: "Bump and clap",
      beats: 4,
      keys: [
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: _t },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: _t },
        { beat: 3, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } }
      ]
    }
  },
  routine: [
    { move: "point", beats: 8 },
    { move: "roll", beats: 4 },
    { move: "point", beats: 8, mirror: !0 },
    { move: "bump", beats: 8 }
  ]
}, Ip = {
  label: "Hip hop",
  bpm: 95,
  stance: { leftHip: 14, rightHip: 14, leftKnee: 20, rightKnee: 20, leftShoulder: 22, rightShoulder: 22, leftElbow: -30, rightElbow: -30, leftFootOut: 0.15, rightFootOut: 0.15 },
  expression: "smug",
  hands: { left: "relaxed", right: "relaxed" },
  groove: { bounce: 18, accent: "down" },
  moves: {
    bounce: {
      label: "Bounce",
      beats: 2,
      keys: [
        { beat: 0, pose: { leftShoulder: 30, rightShoulder: 30, leftElbow: -50, rightElbow: -50, lean: -3, headTilt: -5, leftWrist: -20, rightWrist: -20 } },
        { beat: 1, pose: { leftShoulder: 14, rightShoulder: 14, leftElbow: -18, rightElbow: -18, lean: 3, headTilt: 5, leftWrist: 0, rightWrist: 0 } }
      ]
    },
    runningMan: {
      label: "Running man",
      beats: 2,
      keys: [
        {
          beat: 0,
          reset: !0,
          pose: { turn: 0.85, leftHip: -84, leftKnee: -112, leftAnkle: 25, rightHip: -26, rightKnee: 8, leftShoulder: 35, leftElbow: -50, rightShoulder: 45, rightElbow: 75, lean: 6 },
          hands: { left: "fist", right: "fist" }
        },
        { beat: 0.5, pose: { leftHip: -4, leftKnee: -18, leftAnkle: 0, rightHip: 4, rightKnee: 18, leftShoulder: 5, leftElbow: -40, rightShoulder: 5, rightElbow: 40 } },
        { beat: 1, pose: { rightHip: 84, rightKnee: 112, rightAnkle: 25, leftHip: 26, leftKnee: -8, rightShoulder: -35, rightElbow: 50, leftShoulder: -45, leftElbow: -75 } },
        { beat: 1.5, pose: { rightHip: 4, rightKnee: 18, rightAnkle: 0, leftHip: -4, leftKnee: -18, rightShoulder: -5, rightElbow: 40, leftShoulder: -5, leftElbow: -40 } }
      ]
    },
    armWave: {
      label: "Arm wave",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 0.5, pose: { leftWrist: 45, leftElbow: -15 } },
        { beat: 1, pose: { leftWrist: -35, leftElbow: 40, leftShoulder: 84 } },
        { beat: 1.5, pose: { leftWrist: 0, leftElbow: -10, leftShoulder: 102, headTilt: -8 } },
        { beat: 2, pose: { leftElbow: 0, leftShoulder: 90, rightShoulder: 102, headTilt: 8 } },
        { beat: 2.5, pose: { rightShoulder: 84, rightElbow: 40, headTilt: 0 } },
        { beat: 3, pose: { rightElbow: -15, rightWrist: 45 } },
        { beat: 3.5, pose: { rightElbow: 0, rightWrist: -35 } }
      ]
    }
  },
  routine: [
    { move: "bounce", beats: 8 },
    { move: "runningMan", beats: 8 },
    { move: "armWave", beats: 8 },
    { move: "bounce", beats: 4 }
  ]
}, Hp = {
  label: "Breaking (toprock)",
  bpm: 110,
  stance: { leftHip: 14, rightHip: 14, leftKnee: 14, rightKnee: 14, leftShoulder: 35, rightShoulder: 35, leftElbow: -90, rightElbow: -90 },
  expression: { smile: 0.3, leftBrow: -0.3, rightBrow: -0.3, browTilt: -0.3 },
  hands: { left: "fist", right: "fist" },
  groove: { bounce: 8, accent: "down" },
  moves: {
    toprock: {
      label: "Toprock (Indian step)",
      beats: 4,
      keys: [
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: _t },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: _t },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: _t },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: bn },
        { beat: 2, pose: { headTilt: 14, lean: -6 } }
      ]
    }
  },
  routine: [
    { move: "toprock", beats: 8 },
    { move: "kick", beats: 4 },
    { move: "toprock", beats: 8 },
    { move: "kick", beats: 4, mirror: !0 },
    { move: "freeze", beats: 4 }
  ]
}, Cp = {
  label: "Jazz",
  bpm: 130,
  stance: { leftHip: 10, rightHip: 10 },
  expression: { mouth: 0.55, smile: 1, mouthWidth: 1.2, leftBrow: 0.6, rightBrow: 0.6 },
  hands: { left: "spread", right: "spread" },
  groove: { bounce: 6, accent: "up" },
  moves: {
    jazzHands: {
      label: "Jazz hands",
      beats: 2,
      easing: "linear",
      keys: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((t, e) => ({
        beat: t,
        // The hands shimmer: the wrists flick a little each quarter beat.
        pose: { leftShoulder: 128, rightShoulder: 128, leftElbow: 8, rightElbow: 8, leftWrist: e % 2 ? 4 : 26, rightWrist: e % 2 ? 26 : 4, leftHip: 16, rightHip: 16, leftKnee: t < 1 ? 26 : 8, rightKnee: t < 1 ? 26 : 8 },
        hands: e === 0 ? { left: { ...Et.spread, turn: 2 }, right: { ...Et.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: _t },
        { beat: 1, reset: !0, pose: { rightHip: 10, rightKnee: 24, rightAnkle: 45, leftShoulder: 60, rightShoulder: 60, leftElbow: -20, rightElbow: -20 } },
        { beat: 1.5, pose: { rightAnkle: 0, rightKnee: 6, leftAnkle: 45, leftKnee: 20 } }
      ]
    },
    splitDrop: {
      label: "Drop into the splits",
      beats: 8,
      keys: [
        { beat: 0, reset: !0 },
        // Slide down into a full side split, arms up…
        { beat: 2, reset: !0, pose: { leftHip: 90, rightHip: 90, leftKnee: 0, rightKnee: 0, leftAnkle: -45, rightAnkle: -45, leftShoulder: 125, rightShoulder: 125, leftElbow: 10, rightElbow: 10 }, easing: "ease-in-out-cubic" },
        // …hold and sell it…
        { beat: 4, pose: { leftShoulder: 95, rightShoulder: 95, leftElbow: 0, rightElbow: 0, leftWrist: 50, rightWrist: 50, headTilt: 8 } },
        // …then gather up through a crouch and stand.
        { beat: 6, reset: !0, pose: { leftHip: 30, rightHip: 30, leftKnee: 60, rightKnee: 60, leftShoulder: 40, rightShoulder: 40 }, easing: "ease-in-out-cubic" },
        { beat: 7.5, reset: !0 }
      ]
    },
    jazzSquare: {
      label: "Jazz square",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: -18, leftHip: 8, leftShoulder: 38, rightShoulder: 46, leftElbow: 100, rightElbow: 96, lean: 4 }, hands: { left: "pinch", right: "pinch" } },
        { beat: 1, pose: { leftHip: 18, rightHip: 6, leftShoulder: 46, rightShoulder: 38, lean: -4 } },
        { beat: 2, pose: { rightHip: 22, leftHip: 6, leftShoulder: 38, rightShoulder: 46, lean: 4 } },
        { beat: 3, pose: { leftHip: 10, rightHip: 10, leftShoulder: 46, rightShoulder: 38, lean: 0 } }
      ]
    }
  },
  routine: [
    { move: "jazzHands", beats: 4 },
    { move: "kickBallChange", beats: 4 },
    { move: "kickBallChange", beats: 4, mirror: !0 },
    { move: "jazzSquare", beats: 8 },
    { move: "jazzHands", beats: 4 },
    { move: "splitDrop", beats: 8 }
  ]
}, Rp = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: bn,
      keys: [
        { beat: 0, reset: !0, pose: { rightShoulder: 142, rightElbow: 0, leftShoulder: 25, leftElbow: -125, headTilt: 6, lean: -3, lookX: 0.6, lookY: -0.6 }, hands: { right: "point", left: "flat" } },
        { beat: 1, pose: { rightShoulder: -38, headTilt: -6, lean: 3, lookX: -0.3, lookY: 0.5, rightHip: 18 } },
        { beat: 2, reset: !0, pose: { leftShoulder: 36, leftElbow: -96, rightShoulder: 36, rightElbow: -96, leftWrist: 20, rightWrist: 20 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, reset: !0, pose: { leftShoulder: 96, rightShoulder: 96, leftElbow: 0, rightElbow: 0, leftWrist: 50, rightWrist: 50, headTilt: 8, leftHip: 18, rightHip: 18 }, hands: { left: "flat", right: "flat" } }
      ]
    },
    heart: {
      label: "Big heart, finger heart",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: bn },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: bn },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: _t,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -9, headTilt: 11, leftShoulder: 55, leftElbow: -112, rightShoulder: 55, rightElbow: -112, rightHip: 18 }, hands: { left: "fist", right: "fist" } },
        { beat: 0.5, pose: { lean: 0, headTilt: 0, rightHip: 9 } },
        { beat: 1, pose: { lean: 9, headTilt: -11, leftHip: 18 } },
        { beat: 1.5, pose: { lean: 0, headTilt: 0, leftHip: 9 } }
      ]
    }
  },
  routine: [
    { move: "pointCombo", beats: 8 },
    { move: "isolations", beats: 4 },
    { move: "heart", beats: 8 },
    { move: "pointCombo", beats: 8, mirror: !0 },
    { move: "isolations", beats: 4 }
  ]
}, Lp = {
  label: "Bollywood",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10 },
  expression: { smile: 1, mouth: 0.3, leftBrow: 0.4, rightBrow: 0.4 },
  groove: { bounce: 8, accent: "down", sway: 3 },
  moves: {
    lightBulb: {
      label: "Screw the bulb, pat the dog",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...Et.cupped, roll: -30 }, left: { ...Et.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Et.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...Et.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Et.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Et.open, turn: 2 } }, easing: _t },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: _t },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: _t },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: _t }
      ]
    }
  },
  routine: [
    { move: "thumka", beats: 4 },
    { move: "lightBulb", beats: 8 },
    { move: "flick", beats: 8 },
    { move: "thumka", beats: 4, mirror: !0 },
    { move: "lightBulb", beats: 8, mirror: !0 }
  ]
}, Fp = {
  label: "Bhangra",
  bpm: 100,
  stance: { leftShoulder: 150, rightShoulder: 150, leftElbow: 18, rightElbow: 18, leftHip: 10, rightHip: 10 },
  expression: { mouth: 0.6, smile: 1, mouthWidth: 1.2, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: "open", right: "open" },
  groove: { bounce: 12, accent: "down" },
  moves: {
    basic: {
      label: "Bhangra step",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 58, rightKnee: 104, rightAnkle: 30, leftShoulder: 162, rightShoulder: 140, headTilt: 7 } },
        { beat: 0.5, reset: !0, pose: { stretch: 0.98 } },
        { beat: 1, reset: !0, pose: { leftHip: 58, leftKnee: 104, leftAnkle: 30, rightShoulder: 162, leftShoulder: 140, headTilt: -7 } },
        { beat: 1.5, reset: !0, pose: { stretch: 0.98 } }
      ]
    },
    dhamaal: {
      label: "Dhamaal (jump, arms up)",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { leftHip: 20, rightHip: 20, leftKnee: 40, rightKnee: 40, stretch: 0.94 } },
        { beat: 0.5, reset: !0, pose: { rise: 0.07, stretch: 1.06, leftHip: 6, rightHip: 6, leftAnkle: 45, rightAnkle: 45, leftShoulder: 172, rightShoulder: 172, leftElbow: 0, rightElbow: 0 }, hands: { left: "point", right: "point" }, easing: "ease-out-quad" },
        { beat: 1, reset: !0, pose: { leftHip: 20, rightHip: 20, leftKnee: 40, rightKnee: 40, stretch: 0.94 }, hands: { left: "open", right: "open" }, easing: "ease-in-quad" },
        { beat: 1.5, reset: !0, pose: { rise: 0.07, stretch: 1.06, leftHip: 6, rightHip: 6, leftAnkle: 45, rightAnkle: 45, leftShoulder: 172, rightShoulder: 172, leftElbow: 0, rightElbow: 0 }, hands: { left: "point", right: "point" }, easing: "ease-out-quad" }
      ]
    }
  },
  routine: [
    { move: "basic", beats: 8 },
    { move: "dhamaal", beats: 4 },
    { move: "basic", beats: 8 },
    { move: "dhamaal", beats: 4 }
  ]
}, Dp = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Np = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Dp, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
  expression: { smile: 0.5, leftEye: 1.2, rightEye: 1.2, leftBrow: 0.3, rightBrow: 0.3 },
  hands: { left: "pataka", right: "pataka" },
  groove: { bounce: 0 },
  moves: {
    tatta: {
      label: "Tatta adavu (stamps)",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 104, rightAnkle: -18 } },
        { beat: 0.3, reset: !0, easing: "ease-in-quad", taps: ["rightToe", "rightHeel"] },
        { beat: 1, reset: !0, pose: { leftHip: 48, leftKnee: 104, leftAnkle: -18 } },
        { beat: 1.3, reset: !0, easing: "ease-in-quad", taps: ["leftToe", "leftHeel"] }
      ]
    },
    natta: {
      label: "Natta adavu (stretch and look)",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 52, rightKnee: 0, rightAnkle: -40, rightShoulder: 125, rightWrist: 60, leftShoulder: 25, leftElbow: -125, leftWrist: 0, headTilt: 8, lookX: 0.9, lookY: -0.4, lean: -6 } },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 52, leftKnee: 0, leftAnkle: -40, leftShoulder: 125, leftWrist: 60, rightShoulder: 25, rightElbow: -125, rightWrist: 0, headTilt: -8, lookX: -0.9, lookY: -0.4, lean: 6 } },
        { beat: 3, reset: !0 }
      ]
    },
    alapadma: {
      label: "Alapadma (lotus) to the sky",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightShoulder: 145, rightElbow: 20, rightWrist: 30, leftShoulder: 28, leftElbow: -125, leftWrist: 0, lookX: 0.7, lookY: -0.9, headTilt: 6 }, hands: { right: "alapadma", left: "pataka" } },
        { beat: 1, pose: { rightWrist: 55, headTilt: 9 } },
        { beat: 2, reset: !0, pose: { leftShoulder: 145, leftElbow: 20, leftWrist: 30, rightShoulder: 28, rightElbow: -125, rightWrist: 0, lookX: -0.7, lookY: -0.9, headTilt: -6 }, hands: { left: "alapadma", right: "pataka" } },
        { beat: 3, pose: { leftWrist: 55, headTilt: -9 } }
      ]
    }
  },
  routine: [
    { move: "tatta", beats: 8 },
    { move: "natta", beats: 8 },
    { move: "alapadma", beats: 8 },
    { move: "tatta", beats: 4 }
  ]
}, Wp = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...Et.spread, turn: 2 }, right: { ...Et.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: _t },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: _t },
        { beat: 3, reset: !0 }
      ]
    },
    twist: {
      label: "Swivel (heels in, heels out)",
      beats: 2,
      keys: [
        // Toes in, knees in: the heels swivel out.
        { beat: 0, reset: !0, pose: { leftFootOut: -0.9, rightFootOut: -0.9, leftHip: 4, rightHip: 4, leftKnee: 4, rightKnee: 4, leftAnkle: -10, rightAnkle: -10, leftShoulder: 18, rightShoulder: 48, leftElbow: -10, rightElbow: 50 } },
        // Toes out, knees out: the heels swivel in.
        { beat: 0.5, pose: { leftFootOut: 0.6, rightFootOut: 0.6, leftHip: 16, rightHip: 16, leftKnee: 22, rightKnee: 22, leftAnkle: 10, rightAnkle: 10, leftShoulder: 48, rightShoulder: 18, leftElbow: 50, rightElbow: -10 } },
        { beat: 1, pose: { leftFootOut: -0.9, rightFootOut: -0.9, leftHip: 4, rightHip: 4, leftKnee: 4, rightKnee: 4, leftAnkle: -10, rightAnkle: -10, leftShoulder: 18, rightShoulder: 48, leftElbow: -10, rightElbow: 50 } },
        { beat: 1.5, pose: { leftFootOut: 0.6, rightFootOut: 0.6, leftHip: 16, rightHip: 16, leftKnee: 22, rightKnee: 22, leftAnkle: 10, rightAnkle: 10, leftShoulder: 48, rightShoulder: 18, leftElbow: 50, rightElbow: -10 } }
      ]
    },
    kneeCross: {
      label: "Crossing knees",
      beats: 2,
      keys: [
        // Knees knock together while the hands cross over them…
        { beat: 0, reset: !0, pose: { leftHip: -6, rightHip: -6, leftKnee: -16, rightKnee: -16, leftFootOut: -0.4, rightFootOut: -0.4, leftShoulder: -12, rightShoulder: -12, leftElbow: 0, rightElbow: 0, lean: 0, lookY: 0.6 } },
        // …then swing apart, hands open.
        { beat: 0.5, pose: { leftHip: 18, rightHip: 18, leftKnee: 28, rightKnee: 28, leftFootOut: 0.3, rightFootOut: 0.3, leftShoulder: 16, rightShoulder: 16, lookY: 0 } },
        { beat: 1, pose: { leftHip: -6, rightHip: -6, leftKnee: -16, rightKnee: -16, leftFootOut: -0.4, rightFootOut: -0.4, leftShoulder: -12, rightShoulder: -12, lookY: 0.6 } },
        { beat: 1.5, pose: { leftHip: 18, rightHip: 18, leftKnee: 28, rightKnee: 28, leftFootOut: 0.3, rightFootOut: 0.3, leftShoulder: 16, rightShoulder: 16, lookY: 0 } }
      ]
    }
  },
  routine: [
    { move: "basic", beats: 8 },
    { move: "twist", beats: 8 },
    { move: "kneeCross", beats: 8 },
    { move: "basic", beats: 8, mirror: !0 },
    { move: "twist", beats: 4 }
  ]
}, jp = {
  label: "Tap",
  bpm: 120,
  // Three-quarters to side-on, so shuffles read as brushes forward and back. Side-on,
  // forward is a positive angle for the right limbs and a negative one for the left.
  stance: {
    turn: 0.8,
    leftHip: -3,
    rightHip: 3,
    leftKnee: -10,
    rightKnee: 10,
    leftShoulder: 12,
    rightShoulder: 12,
    leftElbow: -40,
    rightElbow: 40,
    leftWrist: -15,
    rightWrist: 15,
    lean: 4
  },
  expression: { smile: 0.9, mouth: 0.2, leftBrow: 0.3, rightBrow: 0.3, lookY: 0.3 },
  hands: { left: "relaxed", right: "relaxed" },
  groove: { bounce: 6, accent: "down" },
  moves: {
    shuffleBallChange: {
      label: "Shuffle ball change",
      beats: 2,
      easing: "ease-out-quad",
      keys: [
        // Knee up, the foot brushes forward (toe strikes)…
        { beat: 0, reset: !0, pose: { rightHip: 34, rightKnee: 8, rightAnkle: 30, leftShoulder: 30, rightShoulder: -10 }, taps: ["rightToe"] },
        // …and back from the knee (toe strikes again)…
        { beat: 0.25, pose: { rightHip: 24, rightKnee: 62, rightAnkle: 40 }, taps: ["rightToe"] },
        // …step on the ball behind, then change weight to the other foot.
        { beat: 0.5, pose: { rightHip: -8, rightKnee: 14, rightAnkle: 50, leftAnkle: 15, leftShoulder: 12, rightShoulder: 12 }, taps: ["rightToe"] },
        { beat: 0.75, pose: { rightHip: 3, rightKnee: 10, rightAnkle: 0, leftAnkle: 0 }, taps: ["leftHeel"] },
        { beat: 1, reset: !0, pose: { leftHip: -34, leftKnee: -8, leftAnkle: 30, rightShoulder: -30, leftShoulder: 10 }, taps: ["leftToe"] },
        { beat: 1.25, pose: { leftHip: -24, leftKnee: -62, leftAnkle: 40 }, taps: ["leftToe"] },
        { beat: 1.5, pose: { leftHip: 8, leftKnee: -14, leftAnkle: 50, rightAnkle: 15, leftShoulder: 12, rightShoulder: 12 }, taps: ["leftToe"] },
        { beat: 1.75, pose: { leftHip: -3, leftKnee: -10, leftAnkle: 0, rightAnkle: 0 }, taps: ["rightHeel"] }
      ]
    },
    timeStep: {
      label: "Single time step",
      beats: 4,
      easing: "ease-out-quad",
      keys: [
        // Stamp the right foot flat…
        { beat: 0, reset: !0, pose: { rightHip: 8, rightKnee: 4, rightAnkle: 0, leftShoulder: 25, rightShoulder: -20 }, taps: ["rightToe", "rightHeel"] },
        // …shuffle (brush forward, brush back)…
        { beat: 0.5, pose: { rightHip: 34, rightKnee: 8, rightAnkle: 30 }, taps: ["rightToe"] },
        { beat: 0.75, pose: { rightHip: 22, rightKnee: 62, rightAnkle: 40 }, taps: ["rightToe"] },
        // …hop on the left (up, then land)…
        { beat: 1, pose: { rise: 0.05, leftAnkle: 45, leftKnee: -4, leftHip: -2, rightHip: 26, rightKnee: 70, stretch: 1.03 } },
        { beat: 1.25, pose: { rise: 0, leftAnkle: 0, leftKnee: -14, stretch: 1 }, taps: ["leftToe"] },
        // …step right, flap left (brush forward and step), step right.
        { beat: 1.5, pose: { rightHip: 4, rightKnee: 12, rightAnkle: 0, rightShoulder: 25, leftShoulder: -20 }, taps: ["rightToe"] },
        { beat: 2, pose: { leftHip: -30, leftKnee: -6, leftAnkle: 35 }, taps: ["leftToe"] },
        { beat: 2.25, pose: { leftHip: -4, leftKnee: -12, leftAnkle: 0 }, taps: ["leftToe"] },
        { beat: 3, pose: { rightHip: 10, rightAnkle: 35, rightKnee: 18, leftShoulder: 12, rightShoulder: 12 }, taps: ["rightToe"] },
        { beat: 3.5, pose: { rightHip: 3, rightKnee: 10, rightAnkle: 0 } }
      ]
    },
    heelToe: {
      label: "Heel toe",
      beats: 2,
      easing: "ease-out-quad",
      keys: [
        // Dig the heel in front (toe up), then the toe behind (heel up); the arms swing against the feet.
        { beat: 0, reset: !0, pose: { rightHip: 26, rightKnee: 0, rightAnkle: -35, leftShoulder: 30, rightShoulder: -20 }, taps: ["rightHeel"] },
        { beat: 0.5, pose: { rightHip: -16, rightKnee: 24, rightAnkle: 55, leftShoulder: -15, rightShoulder: 25 }, taps: ["rightToe"] },
        { beat: 1, reset: !0, pose: { leftHip: -26, leftKnee: 0, leftAnkle: -35, rightShoulder: -30, leftShoulder: 20 }, taps: ["leftHeel"] },
        { beat: 1.5, pose: { leftHip: 16, leftKnee: -24, leftAnkle: 55, rightShoulder: 15, leftShoulder: -25 }, taps: ["leftToe"] }
      ]
    },
    crampRoll: {
      label: "Cramp roll",
      beats: 2,
      easing: "ease-out-quad",
      keys: [
        // Up on both balls, right then left, then the heels drop, right then left: four quick sounds.
        { beat: 0, reset: !0, pose: { rightHip: 12, rightKnee: 26, leftHip: -12, leftKnee: -26 } },
        { beat: 0.5, pose: { rightAnkle: 40, rise: 0.02 }, taps: ["rightToe"] },
        { beat: 0.625, pose: { leftAnkle: 40 }, taps: ["leftToe"] },
        { beat: 0.75, pose: { rightAnkle: 0, rise: 0 }, taps: ["rightHeel"] },
        { beat: 0.875, pose: { leftAnkle: 0 }, taps: ["leftHeel"] },
        // Arms flare on the finish: one up in front, one up behind.
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...Et.spread, turn: 2 }, right: { ...Et.spread, turn: 2 } } },
        { beat: 1.75, reset: !0 }
      ]
    }
  },
  routine: [
    { move: "shuffleBallChange", beats: 8 },
    { move: "timeStep", beats: 4 },
    { move: "timeStep", beats: 4, mirror: !0 },
    { move: "heelToe", beats: 8 },
    { move: "crampRoll", beats: 4 }
  ]
}, Bp = {
  label: "Popping (glides, moonwalk)",
  bpm: 100,
  stance: { leftHip: 9, rightHip: 9, leftShoulder: 16, rightShoulder: 16, leftElbow: -24, rightElbow: -24 },
  expression: { smile: 0.35, leftEye: 0.85, rightEye: 0.85, leftBrow: -0.2, rightBrow: -0.2 },
  hands: { left: "relaxed", right: "relaxed" },
  groove: { bounce: 0 },
  moves: {
    sideGlide: {
      label: "Side glide",
      beats: 2,
      easing: "linear",
      travel: 0.2,
      keys: [
        {
          beat: 0,
          reset: !0,
          pose: { leftHip: 11, leftKnee: 0, leftAnkle: 0, rightHip: 36, rightKnee: 45, rightAnkle: 45, rightShoulder: 80, rightElbow: -10, rightWrist: 10, leftShoulder: 28, leftElbow: 18, lean: -2, headTilt: 4, lookX: 0.7 },
          hands: { right: "flat", left: "relaxed" }
        },
        { beat: 1, pose: { leftHip: 27, leftKnee: 54, leftAnkle: 45, rightHip: -1, rightKnee: 0, rightAnkle: 0, rightShoulder: 74, rightWrist: -10, lean: 2 } }
      ]
    },
    moonwalk: {
      label: "Moonwalk",
      beats: 2,
      easing: "linear",
      travel: -0.29,
      keys: [
        {
          beat: 0,
          reset: !0,
          pose: { turn: 0.9, lean: 4, headTilt: -4, leftHip: -12, leftKnee: 0, leftAnkle: 0, rightHip: 23, rightKnee: 57, rightAnkle: 45, leftShoulder: -10, leftElbow: -45, rightShoulder: 14, rightElbow: 50 }
        },
        { beat: 1, pose: { leftHip: -23, leftKnee: -57, leftAnkle: 45, rightHip: 12, rightKnee: 0, rightAnkle: 0, leftShoulder: -14, leftElbow: -50, rightShoulder: 10, rightElbow: 45 } }
      ]
    },
    forwardGlide: {
      label: "Forward glide",
      beats: 2,
      easing: "linear",
      travel: 0.29,
      keys: [
        {
          beat: 0,
          reset: !0,
          pose: { turn: 0.9, lean: 2, leftHip: 16, leftKnee: 0, leftAnkle: 0, rightHip: 33, rightKnee: 59, rightAnkle: 45, leftShoulder: 12, leftElbow: -40, rightShoulder: -12, rightElbow: 40 }
        },
        { beat: 1, pose: { leftHip: -33, leftKnee: -59, leftAnkle: 45, rightHip: -16, rightKnee: 0, rightAnkle: 0, leftShoulder: -12, leftElbow: -40, rightShoulder: 12, rightElbow: 40 } }
      ]
    },
    toeStand: {
      label: "Toe stand",
      beats: 4,
      keys: [
        {
          beat: 0,
          reset: !0,
          pose: { leftHip: 6, rightHip: 6, leftKnee: 0, rightKnee: 0, leftAnkle: 65, rightAnkle: 65, rightShoulder: 150, rightElbow: 75, leftShoulder: 30, leftElbow: 20, headTilt: -10, lookY: 0.4 },
          hands: { right: "fist", left: "fist" },
          easing: bn
        },
        { beat: 2, pose: { headTilt: -14, lean: -2 } }
      ]
    }
  },
  routine: [
    { move: "sideGlide", beats: 4 },
    { move: "sideGlide", beats: 4, mirror: !0 },
    { move: "moonwalk", beats: 8 },
    { move: "forwardGlide", beats: 8 },
    { move: "toeStand", beats: 4 }
  ]
}, Oe = {
  disco: Op,
  hipHop: Ip,
  breaking: Hp,
  jazz: Cp,
  kpop: Rp,
  bollywood: Lp,
  bhangra: Fp,
  bharatanatyam: Np,
  charleston: Wp,
  tap: jp,
  popping: Bp
}, ms = (t) => Math.min(1, Math.max(0, t));
function qp(t) {
  const e = { ...rt, turn: t.view }, n = [];
  for (const s of t.keys) {
    const i = n[n.length - 1], o = !i || s.reset ? e : i.pose;
    n.push({ at: s.at, pose: { ...o, ...s.pose }, easing: s.easing });
  }
  return n;
}
function Yp(t) {
  return t - Kp * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const Kp = 0.5;
function zp(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function Xp(t, e) {
  const n = typeof t == "string" ? Hs[t] : t, s = qp(n), i = ms(e);
  let o = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= i && (o = u);
  const r = s[o], a = s[Math.min(o + 1, s.length - 1)], l = a.at > r.at ? (i - r.at) / (a.at - r.at) : 0, c = Tn(r.pose, a.pose, $t(a.easing ?? "ease-in-out")(ms(l))), h = zp(n, i);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * Yp(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function Up(t, e, n) {
  const s = typeof t == "string" ? Hs[t] : t, i = ms(e), o = ms((i - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * o;
}
function rw(t, e, n = {}) {
  const s = typeof e == "string" ? Hs[e] : e, i = n.start ?? 0, o = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const d = u / r;
    return { time: i + d * o, progress: d, pose: Xp(s, d) };
  }), c = Object.keys(rt).filter((h) => a.some((u) => u.pose[h] !== rt[h])).map((h) => ({
    id: `${t}-${h}`,
    target: t,
    property: h,
    keyframes: a.map((u) => ({ time: u.time, value: u.pose[h] }))
  }));
  if (n.height !== void 0 && s.travel !== 0) {
    const h = (n.facing ?? 1) < 0 ? -1 : 1;
    c.push({
      id: `${t}-x`,
      target: t,
      property: "x",
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * Up(s, u.progress, n.height) }))
    });
  }
  return c;
}
const Vp = {
  leftHip: -55,
  leftKnee: -95,
  rightHip: 55,
  rightKnee: 95,
  leftShoulder: 45,
  rightShoulder: -45,
  leftElbow: 10,
  rightElbow: -10,
  lean: 22,
  stretch: 0.94,
  headTilt: 6
}, Gp = {
  leftHip: 0,
  leftKnee: 0,
  rightHip: 0,
  rightKnee: 0,
  leftAnkle: 55,
  rightAnkle: 55,
  leftShoulder: -172,
  rightShoulder: 172,
  leftElbow: 0,
  rightElbow: 0,
  lean: 0,
  stretch: 1.08,
  headTilt: 0
}, Nn = {
  leftHip: -128,
  leftKnee: -152,
  rightHip: 128,
  rightKnee: 152,
  leftAnkle: 30,
  rightAnkle: 30,
  leftShoulder: -78,
  rightShoulder: 78,
  leftElbow: -48,
  rightElbow: 48,
  lean: 26,
  stretch: 1,
  headTilt: 14
}, Jp = {
  leftHip: -22,
  leftKnee: -30,
  rightHip: 22,
  rightKnee: 30,
  leftAnkle: 10,
  rightAnkle: 10,
  leftShoulder: -125,
  rightShoulder: 125,
  leftElbow: 0,
  rightElbow: 0,
  lean: 8,
  headTilt: 0
}, Zp = {
  leftHip: -58,
  leftKnee: -100,
  rightHip: 58,
  rightKnee: 100,
  leftAnkle: 0,
  rightAnkle: 0,
  leftShoulder: -80,
  rightShoulder: 80,
  leftElbow: -10,
  rightElbow: 10,
  lean: 20,
  stretch: 0.93
};
function He(t, e, n, s, i, o = 1300) {
  return {
    label: t,
    view: 1,
    spin: e,
    height: n,
    travel: s,
    takeoff: 0.27,
    landing: 0.8,
    duration: o,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: Vp },
      { at: 0.27, pose: Gp, easing: "ease-out-quad" },
      ...i,
      { at: 0.76, pose: Jp },
      { at: 0.86, pose: Zp, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const Hs = {
  frontFlip: He("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: Nn, easing: "ease-out-cubic" },
    { at: 0.64, pose: Nn }
  ]),
  backFlip: He("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...Nn, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...Nn, lean: 18 } }
  ]),
  layout: He("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: He("Scissor flip", 360, 0.6, 0.45, [
    // The legs scissor through the turn: left kicks high, then they switch.
    { at: 0.36, pose: { leftHip: -105, leftKnee: 0, rightHip: -40, rightKnee: -20, leftAnkle: 50, rightAnkle: 50, leftShoulder: -150, rightShoulder: 150, leftElbow: 0, rightElbow: 0, lean: 12 }, easing: "ease-out-cubic" },
    { at: 0.52, pose: { leftHip: 40, leftKnee: 20, rightHip: 105, rightKnee: 0, leftShoulder: -140, rightShoulder: 140 } },
    { at: 0.66, pose: { leftHip: -30, leftKnee: -20, rightHip: 30, rightKnee: 20, leftShoulder: -110, rightShoulder: 110, lean: 6 } }
  ]),
  sideFlip: {
    label: "Side flip (tuck)",
    view: 0,
    spin: 360,
    height: 0.55,
    travel: 0.4,
    takeoff: 0.27,
    landing: 0.8,
    duration: 1300,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: { leftHip: 22, rightHip: 22, leftKnee: 44, rightKnee: 44, leftShoulder: 20, rightShoulder: 20, lean: -10, stretch: 0.94 } },
      { at: 0.27, pose: { leftHip: 4, rightHip: 4, leftKnee: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55, leftShoulder: 165, rightShoulder: 165, lean: 6, stretch: 1.08 }, easing: "ease-out-quad" },
      { at: 0.38, pose: { leftHip: 105, rightHip: 105, leftKnee: 135, rightKnee: 135, leftShoulder: 40, rightShoulder: 40, leftElbow: -95, rightElbow: -95, lean: 0, stretch: 1, headTilt: 10 }, easing: "ease-out-cubic" },
      { at: 0.64, pose: {} },
      { at: 0.76, pose: { leftHip: 20, rightHip: 20, leftKnee: 20, rightKnee: 20, leftAnkle: 10, rightAnkle: 10, leftShoulder: 100, rightShoulder: 100, leftElbow: 0, rightElbow: 0, headTilt: 0 } },
      { at: 0.86, pose: { leftHip: 24, rightHip: 24, leftKnee: 48, rightKnee: 48, leftAnkle: 0, rightAnkle: 0, leftShoulder: 70, rightShoulder: 70, stretch: 0.93 }, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  },
  cartwheel: {
    label: "Cartwheel",
    view: 0,
    spin: 360,
    // Upside down half way round, the hands (arms overhead) just reach the ground.
    height: 0.155,
    travel: 0.9,
    takeoff: 0.2,
    landing: 0.86,
    duration: 1600,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.12, pose: { leftShoulder: 165, rightShoulder: 165, rightHip: 30, rightKnee: 0, lean: -6 } },
      { at: 0.24, pose: { leftShoulder: 172, rightShoulder: 172, leftHip: 55, rightHip: 55, leftKnee: 0, rightKnee: 0, leftAnkle: 40, rightAnkle: 40, lean: 0 } },
      { at: 0.75, pose: {} },
      { at: 0.9, pose: { leftHip: 30, rightHip: 12, leftAnkle: 0, rightAnkle: 0, leftShoulder: 150, rightShoulder: 150 } },
      { at: 1, reset: !0 }
    ]
  },
  // Leaps: no turn, the shape is the trick.
  splitLeap: He("Split leap (grand jeté)", 0, 0.36, 0.9, [
    // A front split in the air: front leg reaching, back leg long, arms open.
    { at: 0.4, pose: { leftHip: -96, rightHip: -84, leftKnee: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55, leftShoulder: -130, rightShoulder: -105, leftElbow: 0, rightElbow: 0, lean: 4, headTilt: -6 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { lean: 2 } }
  ]),
  toeTouch: {
    label: "Toe touch (straddle jump)",
    view: 0,
    spin: 0,
    height: 0.36,
    travel: 0,
    takeoff: 0.27,
    landing: 0.8,
    duration: 1200,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: { leftHip: 22, rightHip: 22, leftKnee: 44, rightKnee: 44, leftShoulder: -20, rightShoulder: -20, stretch: 0.94 } },
      { at: 0.27, pose: { leftHip: 4, rightHip: 4, leftKnee: 0, rightKnee: 0, leftAnkle: 55, rightAnkle: 55, leftShoulder: 170, rightShoulder: 170, stretch: 1.06 }, easing: "ease-out-quad" },
      // Legs straddled up past level, hands reaching out toward the toes.
      { at: 0.42, pose: { leftHip: 104, rightHip: 104, leftShoulder: 96, rightShoulder: 96, leftElbow: 0, rightElbow: 0, stretch: 1, headTilt: 0 }, easing: "ease-out-cubic" },
      { at: 0.62, pose: {} },
      { at: 0.76, pose: { leftHip: 12, rightHip: 12, leftAnkle: 10, rightAnkle: 10, leftShoulder: 120, rightShoulder: 120 } },
      { at: 0.86, pose: { leftHip: 22, rightHip: 22, leftKnee: 44, rightKnee: 44, leftAnkle: 0, rightAnkle: 0, leftShoulder: 60, rightShoulder: 60, stretch: 0.94 }, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  },
  backHandspring: He("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, oi = 0.215, ri = 0.205, Qp = 0.065, ia = 0.035, tg = 0.165, eg = 0.155, ng = 12, sg = 0.3, ig = 0.7, og = 0.35, rg = (t) => t * Math.PI / 180, mt = {
  turn: 0,
  lean: 0,
  bend: 0,
  side: 0,
  "head.turn": 0,
  "head.nod": 0,
  "head.tilt": 0,
  "arm.left.swing": 0,
  "arm.left.spread": 12,
  "arm.left.elbow": 8,
  "arm.left.bend": 0,
  "arm.right.swing": 0,
  "arm.right.spread": 12,
  "arm.right.elbow": 8,
  "arm.right.bend": 0,
  "leg.left.swing": 0,
  "leg.left.spread": 3,
  "leg.left.knee": 0,
  "leg.left.ankle": 0,
  "leg.left.toeOut": 0,
  "leg.left.rotate": 0,
  "leg.right.swing": 0,
  "leg.right.spread": 3,
  "leg.right.knee": 0,
  "leg.right.ankle": 0,
  "leg.right.toeOut": 0,
  "leg.right.rotate": 0,
  stretch: 1,
  lift: 0,
  roll: 0,
  mouth: 0,
  smile: 0.5,
  mouthWidth: 1,
  blink: 0,
  "eye.left": 1,
  "eye.right": 1,
  "brow.left": 0,
  "brow.right": 0,
  browTilt: 0,
  lookX: 0,
  lookY: 0
};
function Lt(t = {}) {
  return { ...mt, ...t };
}
const ag = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function aw(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const i = n.replace(/(^|\.)(left|right)(\.|$)/, (o, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[i] = ag.has(n) ? -s : s;
  }
  return e;
}
function Rt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}
const Ze = {
  rest: mt,
  wave: Lt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: Lt({ ...Rt("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: Lt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: Lt({ ...Rt("arm", { spread: 50, bend: -105, elbow: 0 }), ...Rt("leg", { spread: 9 }), smile: 0.8 }),
  think: Lt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: Lt({ ...Rt("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: Lt({ ...Rt("leg", { swing: 90, knee: 90, spread: 4 }), ...Rt("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: Lt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...Rt("arm", { swing: 20, elbow: 30 })
  }),
  crouch: Lt({ ...Rt("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...Rt("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: Lt({ lean: 82, "head.nod": -35, ...Rt("arm", { swing: 80, elbow: 0, spread: 4 }), ...Rt("leg", { knee: 92, ankle: -88 }) }),
  lieDown: Lt({ roll: 90, ...Rt("arm", { spread: 8 }), "head.nod": 0 })
};
function lg(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, i = Math.max(0.12, 1 - e - ia - (oi + ri)), o = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: tg, width: [1.25, 0.9] },
      { length: eg, width: [0.9, 0.75] }
    ]
  }), r = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: oi, width: [1.45, 1.05] },
      { length: ri, width: [1.05, 0.85] },
      { length: Qp, width: [0.95, 0.7] }
    ]
  }), a = (l, c) => l[c] ?? mt[c] ?? 0;
  return {
    id: "human",
    hipHeight: oi + ri,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      r("left"),
      r("right"),
      {
        id: "spine",
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: i / 2, width: [1.7, 1.4] },
          { length: i / 2, width: [1.4, 1.1] }
        ]
      },
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: ia, width: [1, 0.9] }] },
      o("left"),
      o("right")
    ],
    head: { on: "neck", size: e },
    contacts: [
      ...["left", "right"].flatMap((l) => [
        { chain: `leg.${l}`, joint: 1 },
        { chain: `leg.${l}`, joint: 2 },
        { chain: `leg.${l}`, joint: 3 },
        { chain: `arm.${l}`, joint: 1 },
        { chain: `arm.${l}`, joint: 2 }
      ]),
      { chain: "spine", joint: 0 },
      { chain: "spine", joint: 1 },
      { chain: "spine", joint: 2 },
      { head: "top" }
    ],
    angles(l, c) {
      if (c.id === "spine") {
        const p = -a(l, "lean") / 2, m = a(l, "side") / 2, y = -a(l, "bend");
        return [
          { swing: p + y * sg, spread: m },
          { swing: p + y * ig, spread: m }
        ];
      }
      if (c.id === "neck") return [{ swing: -a(l, "bend") * og, spread: 0 }];
      const [h, u] = c.id.split("."), d = (p) => a(l, `${h}.${u}.${p}`);
      if (h === "arm")
        return [
          { swing: d("swing"), spread: d("spread") },
          { swing: d("elbow"), spread: d("bend") }
        ];
      const f = (c.side ?? 1) * d("rotate"), g = 1 - Math.cos(rg(d("rotate")));
      return [
        { swing: d("swing"), spread: d("spread"), yaw: f },
        { swing: -d("knee"), spread: 0, yaw: f },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + d("ankle") - g * (d("swing") - d("knee")), spread: 0, yaw: (ng + d("toeOut")) * (c.side ?? 1) }
      ];
    },
    withAngles(l, c, h) {
      const [u, d] = c.id.split("."), f = (g) => `${u}.${d}.${g}`;
      return u === "arm" ? {
        ...l,
        [f("swing")]: h[0].swing,
        [f("spread")]: h[0].spread,
        [f("elbow")]: h[1].swing,
        [f("bend")]: h[1].spread
      } : u === "leg" ? { ...l, [f("swing")]: h[0].swing, [f("spread")]: h[0].spread, [f("knee")]: -h[1].swing } : l;
    },
    boneScale(l, c) {
      const h = Math.min(3, Math.max(0.3, a(l, "stretch")));
      return c?.id.startsWith("arm.") ? Math.sqrt(h) : h;
    },
    headPose(l) {
      const c = Math.min(3, Math.max(0.3, a(l, "stretch")));
      return {
        yaw: a(l, "head.turn"),
        nod: a(l, "head.nod"),
        tilt: a(l, "head.tilt"),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(c),
        sy: Math.sqrt(c)
      };
    },
    landmarks: {
      neck: ["neck", 0],
      "shoulder.left": ["arm.left", 0],
      "elbow.left": ["arm.left", 1],
      "hand.left": ["arm.left", 2],
      "shoulder.right": ["arm.right", 0],
      "elbow.right": ["arm.right", 1],
      "hand.right": ["arm.right", 2],
      "hip.left": ["leg.left", 0],
      "knee.left": ["leg.left", 1],
      "ankle.left": ["leg.left", 2],
      "toe.left": ["leg.left", 3],
      "hip.right": ["leg.right", 0],
      "knee.right": ["leg.right", 1],
      "ankle.right": ["leg.right", 2],
      "toe.right": ["leg.right", 3]
    }
  };
}
function lw(t) {
  const e = t.split(".");
  if (e[0] === "hand" && e.length >= 3) {
    const s = `${e[1] === "left" ? "Left" : "Right"} hand`, i = { spread: "finger spread", turn: "wrist turn", bend: "wrist bend", tilt: "wrist tilt", roll: "roll" }, o = e.slice(2).join(".");
    return `${s} · ${i[o] ?? o.replace(".curl", " curl").replace(".across", " across")}`;
  }
  if (e.length === 3) {
    const [s, i, o] = e;
    return `${`${i === "left" ? "Left" : "Right"} ${s}`} · ${{
      swing: "forward / back",
      spread: "out / in",
      elbow: "elbow bend",
      bend: "forearm out / in",
      knee: "knee bend",
      ankle: "foot tilt",
      toeOut: "toes out / in",
      rotate: "turn out at the hip"
    }[o] ?? o}`;
  }
  return {
    turn: "View (front → side → back)",
    lean: "Lean forward / back",
    bend: "Back curve (line of action)",
    side: "Lean sideways",
    "head.turn": "Head · turn",
    "head.nod": "Head · nod",
    "head.tilt": "Head · tilt",
    stretch: "Squash / stretch",
    lift: "Lift off the ground",
    roll: "Roll (whole figure)",
    mouth: "Mouth open",
    smile: "Smile",
    mouthWidth: "Mouth width",
    blink: "Blink",
    "eye.left": "Left eye open",
    "eye.right": "Right eye open",
    "brow.left": "Left brow",
    "brow.right": "Right brow",
    browTilt: "Brow slant",
    lookX: "Look left / right",
    lookY: "Look up / down"
  }[t] ?? t;
}
const cg = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, wc = Object.fromEntries(
  Object.entries(ut).map(([t, e]) => [
    t,
    Object.fromEntries(Object.entries(e).map(([n, s]) => [cg[n] ?? n, s]))
  ])
);
function cw(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, i = { ...mt, turn: n }, o = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of o) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    i[`arm.${l}.spread`] = h * s, i[`arm.${l}.swing`] = c * h * n, i[`arm.${l}.bend`] = u * s, i[`arm.${l}.elbow`] = c * u * n;
    const d = t[`${a}Hip`], f = t[`${a}Knee`], g = s + c * n;
    i[`leg.${l}.rotate`] = 90 * s, i[`leg.${l}.spread`] = 0, i[`leg.${l}.swing`] = d * g, i[`leg.${l}.knee`] = f * g, i[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), i[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * hg, i[`eye.${l}`] = t[`${a}Eye`], i[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(i, ug(l, e[a] ?? Mt, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  i.lean = t.lean * n, i.bend = r * n, i.side = (t.lean + r * 0.5) * s, i["head.tilt"] = (t.headTilt + r * 0.5) * s, i["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) i[a] = t[a];
  return i.lift = t.rise ?? 0, i.roll = t.spin ?? 0, i;
}
const hg = 70;
function ug(t, e, n, s) {
  const i = t === "right" ? 1 - s : 1 + s, o = {};
  for (const r of Object.keys(Mt)) o[`hand.${t}.${r}`] = e[r] ?? Mt[r];
  return o[`hand.${t}.turn`] = (e.turn ?? 0) - i, o[`hand.${t}.roll`] = (e.roll ?? 0) + n, o;
}
const qt = (t) => t * Math.PI / 180;
function $o([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t, e * i + n * o, -e * o + n * i];
}
function Po([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i - e * o, t * o + e * i, n];
}
function ue([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i + n * o, e, -t * o + n * i];
}
const he = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], ys = (t, e) => [t[0] * e, t[1] * e, t[2] * e], es = (t, e) => Po($o(t, e.swing), e.spread);
function ai(t, e) {
  const n = ue(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function _o(t, e, n) {
  const s = n, o = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const y = p.at ?? (m ? m.joints3.length - 1 : 0), w = m ? m.joints3[y] : o, b = m ? m.frames[Math.max(0, y - 1)] : { swing: 0, spread: 0 }, v = p.offset ? he(w, es(ys(p.offset, s), b)) : w, M = p.side ?? 1, x = t.boneScale?.(e, p) ?? 1, T = t.angles(e, p), A = [v], k = [];
    let O = b.swing, $ = b.spread;
    p.bones.forEach((P, L) => {
      const _ = T[L] ?? { swing: 0, spread: 0 };
      O += qt(_.swing), $ += qt(_.spread) * M, k.push({ swing: O, spread: $ });
      const R = ue(es(p.rest, { swing: O, spread: $ }), qt(_.yaw ?? 0));
      A.push(he(A[L], ys(R, P.length * s * x)));
    }), r[p.id] = { joints3: A, frames: k };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, d = h * l.sy, f = (p) => es(ue($o(Po(p, -qt(l.tilt)), -qt(l.nod)), qt(l.yaw)), c), g = he(a.joints3[a.joints3.length - 1], f([0, d, 0]));
  return { height: s, root: o, chains: r, head: { center: g, rx: u, ry: d, toBody: f } };
}
function Oo(t, e, n) {
  const s = n.height, i = qt(90 * (e.turn ?? 0)), o = _o(t, e, s), { root: r } = o, a = o.chains, { rx: l, ry: c } = o.head, h = o.head.toBody, u = o.head.center, d = {};
  for (const k of t.chains) {
    const { joints3: O, frames: $ } = a[k.id], P = O.map((L) => ai(L, i));
    d[k.id] = {
      id: k.id,
      joints3: O,
      frames: $,
      points: P.map((L) => L.point),
      depths: P.map((L) => L.depth)
    };
  }
  const f = ai(u, i), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((k) => ue(h(k), i)), p = ai(r, i).point, m = qt(e.roll ?? 0), y = (k) => {
    const O = k.x - p.x, $ = k.y - p.y;
    return { x: p.x + O * Math.cos(m) - $ * Math.sin(m), y: p.y + O * Math.sin(m) + $ * Math.cos(m) };
  }, w = ([k, O, $]) => [k * Math.cos(m) + O * Math.sin(m), -k * Math.sin(m) + O * Math.cos(m), $];
  for (const k of Object.values(d)) k.points = k.points.map(y);
  const b = {
    center: y(f.point),
    depth: f.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(w)
  }, v = b.axes[1];
  b.angle = Math.atan2(v[0], v[1]);
  const M = (k) => {
    if ("head" in k) return { x: b.center.x + v[0] * c, y: b.center.y - v[1] * c };
    const O = d[k.chain];
    return O.points[Math.min(k.joint, O.points.length - 1)];
  };
  let x = 0;
  (n.contact ?? "ground") === "ground" && (x = -Math.max(...t.contacts.map((k) => M(k).y))), x -= (e.lift ?? 0) * s;
  const T = (k) => ({ x: k.x, y: k.y + x });
  for (const k of Object.values(d)) k.points = k.points.map(T);
  b.center = T(b.center);
  const A = t.contacts.map((k) => ({ spec: k, point: M(k) }));
  return {
    height: s,
    view: i,
    chains: d,
    head: b,
    hip: T(y(p)),
    contacts: A,
    groundY: Math.max(...A.map((k) => k.point.y))
  };
}
const zi = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], kc = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Io(t, e, n) {
  const s = n.height, i = qt(90 * (e.turn ?? 0)), o = qt(e.roll ?? 0), r = _o(t, e, s), a = ue(r.root, i), l = (m) => he(Po(zi(ue(m, i), a), -o), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => kc(zi(l(he(r.head.center, r.head.toBody(m))), h)), d = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], f = (m) => {
    if ("head" in m) return he(h, ys(d[1], r.head.ry));
    const y = c[m.chain];
    return y[Math.min(m.joint, y.length - 1)];
  };
  let g = 0;
  (n.contact ?? "ground") === "ground" && (g = -Math.min(...t.contacts.map((m) => f(m)[1]))), g += (e.lift ?? 0) * s;
  const p = (m) => [m[0], m[1] + g, m[2]];
  return {
    height: s,
    hip: p(a),
    chains: Object.fromEntries(Object.entries(c).map(([m, y]) => [m, y.map(p)])),
    head: { center: p(h), rx: r.head.rx, ry: r.head.ry, axes: d }
  };
}
function Ho(t, e, n, s) {
  const i = n.height, o = qt(90 * (e.turn ?? 0)), r = _o(t, e, i), a = Io(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (k) => {
    if ("head" in k) return he(h, ys(a.head.axes[1], a.head.ry));
    const O = c[k.chain];
    return O[Math.min(k.joint, O.length - 1)];
  }, d = s.toView(l), f = s.toScreen(d), g = s.toScreen([d[0] + 1, d[1], d[2]]), p = Math.hypot(g.x - f.x, g.y - f.y), m = (k) => {
    const O = s.toView(k);
    return { point: s.toScreen(O), depth: O[2] * p };
  }, y = {};
  for (const k of t.chains) {
    const O = c[k.id].map(m);
    y[k.id] = {
      id: k.id,
      joints3: r.chains[k.id].joints3,
      frames: r.chains[k.id].frames,
      points: O.map(($) => $.point),
      depths: O.map(($) => $.depth)
    };
  }
  const w = s.toView(h), b = s.toScreen(w), v = s.toScreen([w[0] + 1, w[1], w[2]]), M = Math.hypot(v.x - b.x, v.y - b.y), x = a.head.axes.map((k) => kc(zi(s.toView(he(h, k)), w))), T = {
    center: b,
    depth: w[2] * p,
    rx: r.head.rx * M,
    ry: r.head.ry * M,
    angle: Math.atan2(x[1][0], x[1][1]),
    axes: x
  }, A = t.contacts.map((k) => ({ spec: k, point: m(u(k)).point }));
  return {
    height: i * p,
    view: o,
    chains: y,
    head: T,
    hip: f,
    contacts: A,
    groundY: Math.max(...A.map((k) => k.point.y))
  };
}
function vc(t, [e, n, s]) {
  const [i, o, r] = t.axes, a = [
    i[0] * e * t.rx + o[0] * n * t.ry + r[0] * s * t.rx,
    i[1] * e * t.rx + o[1] * n * t.ry + r[1] * s * t.rx,
    i[2] * e * t.rx + o[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (i[2] * e + o[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class Mc {
  positions = [];
  normals = [];
  indices = [];
  /** Add a vertex; returns its index. */
  vertex(e, n, s, i, o, r) {
    const a = Math.hypot(i, o, r) || 1;
    return this.positions.push(e, n, s), this.normals.push(i / a, o / a, r / a), this.positions.length / 3 - 1;
  }
  /** Add a triangle, counter-clockwise seen from its front. */
  triangle(e, n, s) {
    this.indices.push(e, n, s);
  }
  /** Add a quad a-b-c-d (counter-clockwise) as two triangles. */
  quad(e, n, s, i) {
    this.indices.push(e, n, s, e, s, i);
  }
  build() {
    return { positions: this.positions, normals: this.normals, indices: this.indices };
  }
}
function dg(t) {
  const e = /* @__PURE__ */ new Map(), n = [];
  for (let i = 0; i < t.positions.length / 3; i++) {
    const o = [0, 1, 2].map((r) => Math.round(t.positions[i * 3 + r] * 1e6)).join(",");
    e.has(o) || e.set(o, i), n.push(e.get(o));
  }
  const s = /* @__PURE__ */ new Map();
  for (let i = 0; i < t.indices.length / 3; i++)
    for (let o = 0; o < 3; o++) {
      const r = n[t.indices[i * 3 + o]], a = n[t.indices[i * 3 + (o + 1) % 3]];
      if (r === a) continue;
      const l = r < a ? `${r}-${a}` : `${a}-${r}`, c = s.get(l);
      c ? c.faces.push(i) : s.set(l, { a: Math.min(r, a), b: Math.max(r, a), faces: [i] });
    }
  return [...s.values()];
}
const Co = Math.PI * 2;
function fg(t, e = 16) {
  const n = new Mc(), s = Math.max(6, Math.round(e)), i = Math.max(3, Math.round(s / 2)), o = [];
  for (let r = 0; r <= i; r++) {
    const a = r / i * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * Co, u = Math.sin(a) * Math.sin(h), d = Math.cos(a), f = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(u * t, d * t, f * t, u, d, f));
    }
    o.push(l);
  }
  for (let r = 0; r < i; r++)
    for (let a = 0; a < s; a++) {
      const l = o[r][a], c = o[r + 1][a], h = o[r + 1][a + 1], u = o[r][a + 1];
      r > 0 && n.triangle(l, c, u), r < i - 1 && n.triangle(c, h, u);
    }
  return n.build();
}
function oa(t, e, n, s, i) {
  const o = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: i }, (a, l) => {
    const c = l / i * Co;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < i; a++) {
    const l = r[a], c = r[(a + 1) % i];
    s === 1 ? t.triangle(o, l, c) : t.triangle(o, c, l);
  }
}
function Sc(t, e, n = 24) {
  const s = new Mc(), i = Math.max(6, Math.round(n)), o = e / 2, r = -e / 2, a = (h) => Array.from({ length: i + 1 }, (u, d) => {
    const f = d / i * Co;
    return s.vertex(Math.sin(f) * t, h, Math.cos(f) * t, Math.sin(f), 0, Math.cos(f));
  }), l = a(r), c = a(o);
  for (let h = 0; h < i; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return oa(s, t, o, 1, i), oa(s, t, r, -1, i), s.build();
}
function bs(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of dg(t))
    for (const s of n.faces) {
      const i = n.faces.find((o) => o !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: i });
    }
  return { ...t, faceEdges: e };
}
const Wn = (t) => t * 180 / Math.PI, Ce = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], li = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], mn = (t) => Math.hypot(t[0], t[1], t[2]), Xi = (t) => {
  const e = mn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, jn = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function ra(t) {
  const [e, n, s] = Xi(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function pg(t, e, n, s, i) {
  const o = t.chains.find((O) => O.id === n);
  if (!o) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (o.bones.length < 2 || o.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = Oo(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: i.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = mn(Ce(a.joints3[1], a.joints3[0])), h = mn(Ce(a.joints3[2], a.joints3[1])), u = o.parent ? r.chains[o.parent].frames[Math.max(0, (o.at ?? r.chains[o.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, d = Ce(s, l), f = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, mn(d))), g = Xi(d), p = o.parent !== null, m = es(o.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), u);
  let y = Ce(m, [g[0] * li(m, g), g[1] * li(m, g), g[2] * li(m, g)]);
  mn(y) < 1e-6 && (y = ue([1, 0, 0], 0)), y = Xi(y);
  const w = (c * c + f * f - h * h) / (2 * c * f), b = Math.sqrt(Math.max(0, 1 - w * w)), v = [
    l[0] + c * (w * g[0] + b * y[0]),
    l[1] + c * (w * g[1] + b * y[1]),
    l[2] + c * (w * g[2] + b * y[2])
  ], M = [l[0] + g[0] * f, l[1] + g[1] * f, l[2] + g[2] * f], x = o.side ?? 1, T = ra(Ce(v, l)), A = ra(Ce(M, v)), k = [
    { swing: Wn(jn(T.swing - u.swing)), spread: Wn(jn(T.spread - u.spread)) * x },
    { swing: Wn(jn(A.swing - T.swing)), spread: Wn(jn(A.spread - T.spread)) * x }
  ];
  return t.withAngles(e, o, k);
}
const gg = 0.34, ne = 0.12, Xt = -0.4, Jt = (t, e, n) => t[e] ?? n, mg = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), yg = 0.45, bg = 0.35, wg = 0.7;
function ws(t, e, n) {
  const s = (f) => Math.sqrt(Math.max(0, 1 - f.x * f.x - f.y * f.y)), i = vc(t, [n.x, n.y, s(n)]).facing, o = t.axes[2], r = Math.atan2(o[0], o[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(bg, Math.abs(a)), h = l * Math.max(wg, Math.abs(a)), u = Math.cos(t.angle), d = Math.sin(t.angle);
  return {
    facing: i,
    points: e.map((f) => {
      const g = yg * Math.sin(r) + n.x * c + (f.x - n.x) * h, p = f.y + o[1] * s(f), m = g * t.rx, y = p * t.ry;
      return { x: t.center.x + m * u + y * d, y: t.center.y + m * d - y * u };
    })
  };
}
const Bn = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (i, o) => {
  const r = o / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), ci = (t, e, n, s, i = 16) => Array.from({ length: i }, (o, r) => {
  const a = Math.PI * 2 * r / i;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), aa = 0.05;
function kg(t, e, n, s) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), o = (y, w) => ws(e, y, w).points, r = (y, w) => ws(e, [], { x: y, y: w }).facing, a = Jt(n, "smile", 0), l = Jt(n, "blink", 0), c = Jt(n, "lookX", 0), h = Jt(n, "lookY", 0), u = Jt(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const w = y === 1 ? "left" : "right", b = gg * y;
    if (r(b, ne) < aa) continue;
    const v = { x: b, y: ne }, M = mg(Jt(n, `eye.${w}`, 1), l);
    if (M < 0.2) {
      const k = a > 0.5 ? 0.12 : -0.06;
      t.line(o(Bn({ x: b - 0.12, y: ne }, { x: b, y: ne + k }, { x: b + 0.12, y: ne }), v), i);
    } else {
      if (M > 1.2) {
        const P = 0.13 * M;
        t.shape(o(ci(b, ne, P * 0.85, P), v), "#ffffff", i);
      }
      const k = M > 1.2 ? 0.075 : 0.1, O = b + c * 0.08, $ = ne - h * 0.07;
      t.shape(o(ci(O, $, k, k * 1.1 * Math.min(M, 1)), v), t.ink, 0);
    }
    const x = ne + 0.3 + Jt(n, `brow.${w}`, 0) * 0.14 + Math.max(0, M - 1) * 0.12, T = { x: b + y * 0.13, y: x }, A = { x: b - y * 0.13, y: x + u * 0.1 };
    t.line(o([T, { x: (T.x + A.x) / 2, y: (T.y + A.y) / 2 }, A], { x: b, y: x }), i);
  }
  const d = { x: 0, y: Xt };
  if (r(0, Xt) < -aa) return;
  const f = 0.25 * Math.max(0.3, Jt(n, "mouthWidth", 1)), g = Math.min(1, Math.max(0, Jt(n, "mouth", 0)));
  if (g <= 0.05) {
    t.line(o(Bn({ x: -f, y: Xt }, { x: 0, y: Xt - a * 0.25 }, { x: f, y: Xt }), d), i);
    return;
  }
  const p = 0.3 * g;
  let m;
  if (a > 0.3) {
    const y = Xt + 0.05;
    m = [...Bn({ x: f, y }, { x: 0, y: Xt - p * 2 }, { x: -f, y })];
  } else if (a < -0.3) {
    const y = Xt - p * 0.6;
    m = [...Bn({ x: f, y }, { x: 0, y: Xt + p * 1.4 }, { x: -f, y })];
  } else
    m = ci(0, Xt, f * 0.8, p);
  t.shape(o(m, d), t.ink, 0);
}
function Tc(t = {}) {
  const e = (t.proportions ?? "bold") === "bold", n = t.figure ?? "fluid", s = t.look ?? "clean", i = t.height ?? 300, o = n === "stick";
  return {
    plan: t.plan ?? lg({
      headSize: t.headSize ?? (e ? 0.3 : 0.24),
      shoulderWidth: o ? 0 : t.shoulderWidth ?? 0.06,
      hipWidth: o ? 0 : t.hipWidth ?? 0.022
    }),
    figure: n,
    look: s,
    height: i,
    lineWidth: t.lineWidth ?? i * (e ? 0.045 : 0.022),
    ink: t.ink ?? (s === "pencil" ? "#2f2f33" : "#1e293b"),
    skin: t.skin ?? (s === "pencil" ? "none" : "#ffffff"),
    seed: t.seed ?? 1,
    pencil: t.pencil ?? {},
    layers: t.layers ?? {},
    contact: t.contact ?? "ground",
    hands: t.hands ?? "dot",
    handStyle: t.handStyle ?? "glove",
    handSize: t.handSize ?? (t.handStyle === "natural" ? 0.14 : 0.17)
  };
}
function hw(t, e, n, s) {
  const { point: i, facing: o } = vc(t, [e, n, s]);
  return { point: i, facing: o };
}
const Ui = (t) => t.rest[1] < -0.5, vg = 0.3;
function Mg(t, e, n) {
  return t.figure === "stick" ? Ui(e) ? n.slice(0, 3) : n : Ui(e) && n.length >= 3 ? Je(n[0], n[1], n[2], vg) : n.length === 3 ? Je(n[0], n[1], n[2], 1) : n;
}
function Ro(t, e) {
  const n = t.plan.id === "human" ? { ...mt, ...e } : e;
  return Cs(t, n, Oo(t.plan, n, { height: t.height, contact: t.contact }));
}
function Cs(t, e, n) {
  const s = {}, i = {}, o = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((d) => {
    const f = n.chains[d.id];
    s[d.id] = f.points;
    const g = f.depths.reduce((w, b) => w + b, 0) / f.depths.length, p = d.parent ? n.chains[d.parent] : void 0, m = p ? p.depths[d.at ?? p.depths.length - 1] : 0, y = g - m;
    o[d.id] = Math.abs(y) < r ? 0 : y, i[d.id] = { points: Mg(t, d, f.points), depth: g };
  }), i.head = { points: [n.head.center], depth: n.head.depth }, o.head = 0;
  const a = [...t.plan.chains.map((d) => d.id), "head"], l = [...a].sort((d, f) => o[d] - o[f] || a.indexOf(d) - a.indexOf(f)), c = { hip: n.hip };
  for (const [d, [f, g]] of Object.entries(t.plan.landmarks ?? {})) {
    const p = n.chains[f]?.points;
    p && (c[d] = p[Math.min(g, p.length - 1)]);
  }
  const h = {};
  for (const [d, f] of Object.entries(c)) h[d] = f.y >= n.groundY - 0.01 * t.height;
  const u = {
    height: t.height,
    lineWidth: t.lineWidth,
    turn: e.turn ?? 0,
    points: c,
    chains: s,
    parts: i,
    head: n.head,
    groundY: n.groundY,
    grounded: h
  };
  return { skeleton: n, joints: u, order: l };
}
function Sg(t, e) {
  return Ro(t, e).joints;
}
function xc(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const i = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), o = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = ws(s, i, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide(ws(s, o, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function Ec(t, e, n, s, i, o) {
  const r = n.lineWidth;
  if (i === "head") {
    const { head: f } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(f.center.x, f.center.y, f.rx, f.ry, f.angle, g, r), e.look !== "silhouette" && kg(e, f, o, r);
    return;
  }
  const a = n.plan.chains.find((f) => f.id === i), l = s.chains[i], c = s.parts[i].points;
  if (n.figure === "stick") {
    if (i === "neck") return;
    const f = i === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(f, r);
    return;
  }
  const h = (f, g) => [a.bones[f].width[0] * r, a.bones[g].width[1] * r];
  if (Ui(a)) {
    const [f, g] = h(0, 1);
    if (e.limb(c, f, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && i.startsWith("arm."))
      xg(t, e, n, l, i.endsWith(".left") ? "left" : "right", o);
    else {
      const p = l[l.length - 1];
      e.dot(p.x, p.y, r * 0.62);
    }
    return;
  }
  if (i === "spine") {
    const f = s.points["hip.left"], g = s.points["hip.right"];
    f && g && Math.hypot(f.x - g.x, f.y - g.y) > 0.5 && e.limb([f, g], r * 1.3, r * 1.3);
    const [p, m] = h(0, a.bones.length - 1);
    e.limb(c, p, m);
    const y = s.points["shoulder.left"], w = s.points["shoulder.right"];
    y && w && Math.hypot(y.x - w.x, y.y - w.y) > 0.5 && e.limb(Je(y, l[l.length - 1], w, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, d] = h(0, a.bones.length - 1);
  e.limb(c, u, d);
}
function Tg(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const i = t.turn ?? 0, o = e === "right" ? 1 - i : 1 + i;
  return { ...Mt, ...s, turn: o + (s.turn ?? 0) };
}
function xg(t, e, n, s, i, o) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  To(t, r, Tg(o, i), {
    size: n.handSize * n.height,
    side: i,
    angle: l,
    pen: e,
    skin: n.skin === "none" ? "#ffffff" : n.skin,
    // A cartoon glove: three fingers and a thumb, plump enough to match the limbs.
    // Natural: five fingers, a little fuller than a real hand so they hold up against the limbs.
    fingers: n.handStyle === "natural" ? 5 : 4,
    plump: n.handStyle === "natural" ? 1.15 : 1.6,
    lineWidth: n.lineWidth * 0.3
  });
}
function Eg(t, e, n, s = 0) {
  const i = e.plan.id === "human" ? { ...mt, ...n } : n;
  Ac(t, e, i, Ro(e, i), s);
}
function Lo(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function uw(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...mt, ...e } : e, o = Ho(t.plan, i, { height: s.height, contact: t.contact }, n);
  return Cs(Lo(t, o.height), i, o).joints;
}
function dw(t, e, n, s, i) {
  const o = e.plan.id === "human" ? { ...mt, ...n } : n, r = Ho(e.plan, o, { height: i.height, contact: e.contact }, s), a = Lo(e, r.height);
  Ac(t, a, o, Cs(a, o, r), i.time ?? 0);
}
function Ag(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...mt, ...e } : e, o = Ho(t.plan, i, { height: s.height, contact: t.contact }, n), r = Lo(t, o.height), { joints: a, order: l } = Cs(r, i, o), c = o.height / s.height;
  return l.map((h, u) => ({
    part: h,
    depth: (a.parts[h]?.depth ?? 0) / c,
    draw(d, f = 0) {
      const g = Os(d, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: Vt(`${r.seed}:${h}`), time: f, pencil: r.pencil }), p = (y) => {
        y && (d.save(), y(d, a, g, f), d.restore());
      };
      d.save(), d.lineCap = "round", d.lineJoin = "round", u === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && xc(g, r, a), p(r.layers.behind));
      const m = r.layers.parts?.[h];
      p(m?.under), Ec(d, g, r, a, h, i), p(m?.over), u === l.length - 1 && p(r.layers.front), d.restore();
    }
  }));
}
function Ac(t, e, n, s, i) {
  const { joints: o, order: r } = s, a = Os(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: i,
    pencil: e.pencil
  }), l = (c) => {
    c && (t.save(), c(t, o, a, i), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", e.look === "pencil" && e.pencil.construction !== !1 && xc(a, e, o), l(e.layers.behind);
  for (const c of r) {
    const h = e.layers.parts?.[c];
    l(h?.under), Ec(t, a, e, o, c, n), l(h?.over);
  }
  l(e.layers.front), t.restore();
}
function fw(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
function pw(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...mt, ...e } : e;
  let o;
  if (Array.isArray(s))
    o = s;
  else {
    const { skeleton: r } = Ro(t, i), a = Oo(t.plan, { ...i, roll: 0 }, { height: t.height, contact: "none" }), l = (i.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), d = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), f = Math.PI / 2 * (i.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(f), m = Math.sin(f);
    o = [u * p - g * m, -d, u * m + g * p];
  }
  return pg(t.plan, i, n, o, { height: t.height });
}
function gw(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, i = e.plan.id === "human" ? mt : {};
  return {
    type: "custom",
    x: t.x - n / 2,
    y: t.y - s,
    width: n,
    height: s,
    props: { ...i, ...t.pose },
    character: e,
    draw(o, r, a) {
      o.translate(n / 2, s), Eg(o, e, r.props, a);
    }
  };
}
function $g(t, e, n) {
  const s = (o) => ({ x: o.x + e, y: o.y + n }), i = (o) => Object.fromEntries(Object.entries(o).map(([r, a]) => [r, a.map(s)]));
  return {
    ...t,
    points: Object.fromEntries(Object.entries(t.points).map(([o, r]) => [o, s(r)])),
    chains: i(t.chains),
    parts: Object.fromEntries(Object.entries(t.parts).map(([o, r]) => [o, { ...r, points: r.points.map(s) }])),
    head: { ...t.head, center: s(t.head.center) },
    groundY: t.groundY + n
  };
}
function mw(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" || l === "motionPathX" ? o = c : l === "y" || l === "motionPathY" ? r = c : l in i && (i[l] = c));
  const a = Sg(s, i);
  return { pose: i, joints: $g(a, t.x + o + t.width / 2, t.y + r + t.height) };
}
function $c(t, e = mt) {
  const n = [];
  return t.forEach((s, i) => {
    const o = i === 0 ? e : n[i - 1], r = typeof s.pose == "string" ? Ze[s.pose] : void 0;
    n.push(r ? { ...r, turn: o.turn ?? 0 } : { ...o, ...s.pose });
  }), n;
}
function yw(t, e, n = mt) {
  const s = $c(e, n);
  return Object.keys(n).filter((o) => s.some((r) => (r[o] ?? n[o]) !== n[o])).map((o) => ({
    id: `${t}-${o}`,
    target: t,
    property: o,
    keyframes: e.map((r, a) => ({
      time: r.time,
      value: s[a][o] ?? n[o],
      ...r.easing ? { easing: r.easing } : {}
    }))
  }));
}
const hi = /* @__PURE__ */ new Map();
function Pg(t) {
  const e = hi.get(t);
  if (e) return e;
  let n = [1, 1, 1];
  const s = t.trim().replace("#", "");
  if (t.trim().startsWith("#") && (s.length === 3 || s.length === 6)) {
    const i = s.length === 3 ? s.split("").map((o) => o + o).join("") : s;
    n = [0, 2, 4].map((o) => Number.parseInt(i.slice(o, o + 2), 16) / 255);
  } else {
    const i = t.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    i && (n = [Number(i[1]) / 255, Number(i[2]) / 255, Number(i[3]) / 255]);
  }
  return hi.size < 512 && hi.set(t, n), n;
}
Pe([-3, -5, -4]);
const _g = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function Pc(t, e, n) {
  const s = [0, 0, 0];
  for (const i of n) {
    const o = Pg(i.color);
    let r;
    if (i.light === "ambient")
      r = i.intensity;
    else if (i.light === "directional")
      r = i.intensity * Math.max(0, -ce(e, i.direction));
    else {
      const a = tn(i.position, t), l = $s(a), c = l > 0 ? qe(a, 1 / l) : e, h = i.range ? Math.max(0, 1 - l / i.range) ** 2 : 1;
      if (r = i.intensity * Math.max(0, ce(e, c)) * h, i.light === "spot") {
        const u = Math.cos(i.angle * Math.PI / 180), d = Math.cos(i.angle * 0.8 * Math.PI / 180);
        r *= _g(u, d, -ce(c, i.direction));
      }
    }
    s[0] += o[0] * r, s[1] += o[1] * r, s[2] += o[2] * r;
  }
  return s;
}
function _c(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function Oc(t, e, n = {}) {
  t.save(), Og(t, e, n), t.restore();
}
function Og(t, e, n) {
  const s = Ic(e, n);
  n.shadow !== !1 && Hc(t, e, n);
  for (const i of e.under) Vi(t, i, s, n);
  if (n.rider) {
    if (t.save(), e.openings.length > 0) {
      t.beginPath();
      for (const i of e.openings) {
        t.moveTo(i[0].x, i[0].y);
        for (const o of i.slice(1)) t.lineTo(o.x, o.y);
        t.closePath();
      }
      t.clip("nonzero");
    }
    n.rider(t), t.restore();
  }
  for (const i of e.over) Vi(t, i, s, n);
}
function Ic(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function Hc(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, Rs(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function bw(t, e, n, s = {}) {
  t.save(), Vi(t, e, n, s), t.restore();
}
function Ig(t, e, n, s = {}) {
  const i = s.style === "stick", o = e.flatMap((h) => {
    if (i && h.part.solidOnly) return [];
    const u = h.part.layer ?? 0;
    return i && h.spine ? [{ depth: h.depth, layer: u, part: h }] : h.faces.map((d) => ({ depth: d.depth, layer: u, part: h, face: d }));
  }), r = /* @__PURE__ */ new Map();
  for (const h of o) {
    const u = h.face?.normal;
    if (!h.face?.center || !u) continue;
    const d = Math.abs(u[0]) >= Math.abs(u[1]) && Math.abs(u[0]) >= Math.abs(u[2]) ? 0 : Math.abs(u[1]) >= Math.abs(u[2]) ? 1 : 2, f = d * 2 + (u[d] < 0 ? 1 : 0);
    r.set(f, [...r.get(f) ?? [], h]);
  }
  for (const h of r.values())
    for (const u of h) {
      const { center: d, normal: f } = u.face;
      for (const g of h) {
        if (g.part.part.id === u.part.part.id) continue;
        const p = g.face;
        if (p.normal[0] * f[0] + p.normal[1] * f[1] + p.normal[2] * f[2] <= 0.8) continue;
        const y = p.normal[0] * (d[0] - p.center[0]) + p.normal[1] * (d[1] - p.center[1]) + p.normal[2] * (d[2] - p.center[2]);
        y > -la / 5 && y < la && (u.layer = Math.max(u.layer, g.layer), u.depth = Math.max(u.depth, g.depth + 1e-6));
      }
    }
  o.sort((h, u) => h.layer - u.layer || h.depth - u.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let u = a.get(h.part.id);
    return u || a.set(h.part.id, u = Fo(t, h, n, s)), u;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: u } of o) {
    t.globalAlpha = c * h.opacity;
    const d = l(h);
    if (!u) d.line(h.spine, n * 1.15);
    else {
      const f = i ? Cc(h, s) : u.light ? Hg(h, u, s) : Do(h);
      f && (!i && s.look === "silhouette" ? d.shape(u.points, f, 0) : Rs(t, u.points, i || u.light ? f : Wo(f, u.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of u.edges ?? []) p.length > 1 && d.line(p, g);
      for (const p of u.marks ?? []) d.line(p, n * 0.7);
    }
  }
  t.restore();
}
const la = 0.05;
function Fo(t, e, n, s) {
  return Os(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: Vt(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function Do(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? Lc(e.fill, e.glow.color, t.glow) : e.fill;
}
function Hg(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const i = Rc(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? Lc(i, s.glow.color, t.glow) : i;
}
function Cc(t, e) {
  const n = Do(t);
  return n && (Rg(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function Vi(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, ca(t, e, n, s), t.restore()) : ca(t, e, n, s);
}
function ca(t, e, n, s) {
  if (s.style === "stick") return Cg(t, e, n, s);
  const { part: i } = e, o = Fo(t, e, n, s), r = Do(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? o.shape(c.points, r, 0) : Rs(t, c.points, Wo(r, c.tone)));
  const l = (i.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && o.line(c, l);
  for (const c of e.marks) o.line(c, n * 0.7);
}
function Cg(t, e, n, s) {
  const { part: i } = e;
  if (i.solidOnly) return;
  const o = Fo(t, e, n, s);
  if (e.spine) {
    o.line(e.spine, n * 1.15);
    return;
  }
  const r = Cc(e, s);
  for (const l of e.faces) Rs(t, l.points, r);
  const a = (i.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && o.line(l, a);
  for (const l of e.marks) o.line(l, n * 0.7);
}
function Rg(t) {
  const e = Qe(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function Rs(t, e, n, s = !0, i = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let o = 1; o < e.length; o++) t.lineTo(e[o].x, e[o].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = i, t.lineJoin = "round", t.stroke());
}
function Qe(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const No = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function Wo(t, e) {
  const n = Qe(t);
  return n ? No(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function Rc(t, e, n, s) {
  const i = Qe(t);
  if (!i) return t;
  let o = i.map((a, l) => a * e[l]);
  const r = s ? Qe(s) : void 0;
  return r && n > 0 && (o = o.map((a, l) => a + (r[l] - a) * n)), No(o);
}
function Lc(t, e, n) {
  const s = Qe(t), i = Qe(e);
  return !s || !i ? n < 0.5 ? t : e : No(s.map((o, r) => o + (i[r] - o) * n));
}
const ha = 40, Lg = 0.215 + 0.205, It = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}, at = (t, e) => t[e] ?? mt[e] ?? 0;
function Fg(t, e, n = mt, s = 1) {
  const i = Is(t), o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (1 + Math.cos(o * 2 * (i.bounces ?? 1))) / 2, c = i.crouch ?? 0, h = i.shoulder ?? 0, u = i.forearm ?? 0, d = { ...mt, ...n };
  d["leg.left.swing"] = i.swing * r + c * 0.6, d["leg.right.swing"] = -i.swing * r + c * 0.6, d["leg.left.knee"] = i.knee * Math.max(0, a) + c * 1.2, d["leg.right.knee"] = i.knee * Math.max(0, -a) + c * 1.2, d["leg.left.ankle"] = at(n, "leg.left.ankle") - (i.tiptoe ?? 0), d["leg.right.ankle"] = at(n, "leg.right.ankle") - (i.tiptoe ?? 0);
  for (const [f, g] of [["left", -1], ["right", 1]])
    at(n, `arm.${f}.spread`) > ha || at(n, `arm.${f}.swing`) > ha || (d[`arm.${f}.swing`] = h + g * i.arm * r, d[`arm.${f}.elbow`] = at(n, `arm.${f}.elbow`) + u + i.elbow * Math.max(0, g * r));
  return d.lean = at(n, "lean") + i.lean * s, d.bend = at(n, "bend") + (i.bend ?? 0), d["head.nod"] = at(n, "head.nod") - i.lean * 0.5 * s + (i.headTilt ?? 0), d.side = at(n, "side") + (i.sway ?? 0) * Math.sin(o), d.lift = at(n, "lift") + (i.bounce ?? 0) * s * l, d.stretch = at(n, "stretch") * (1 + (i.squash ?? 0) * (l - 0.5)), d;
}
function Dg(t, e, n = 1) {
  const s = Is(t);
  return 4 * Lg * e * Math.sin(s.swing * n * Math.PI / 180);
}
const Re = (t) => wc[t], jo = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: at(t, "lean") - 4, ...It("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...It("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...It("leg", { swing: 25, knee: 60 }), ...Re("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...It("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...It("arm", { spread: 70, bend: 0 }), ...It("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...It("arm", { spread: 60 }),
        "leg.left.swing": at(t, "leg.left.swing"),
        "leg.right.swing": at(t, "leg.right.swing"),
        "leg.left.knee": at(t, "leg.left.knee"),
        "leg.right.knee": at(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: at(t, "stretch"), bend: at(t, "bend"), ...Re("surprised"), ...It("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": at(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": at(t, "head.nod") - 10, bend: at(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...Re("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { lift: 0, stretch: 0.88, "head.nod": at(t, "head.nod") - 4, bend: at(t, "bend") + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: at(t, "stretch"), "head.nod": at(t, "head.nod"), bend: at(t, "bend") }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, a knee up, arms cocked; hold; pitch forward ready to run. */
  windUp: () => [
    {
      after: 220,
      pose: {
        lean: -18,
        bend: -16,
        "head.nod": -6,
        "arm.left.swing": 60,
        "arm.left.elbow": 100,
        "arm.right.swing": -40,
        "arm.right.elbow": 90,
        "leg.left.swing": 55,
        "leg.left.knee": 95,
        stretch: 0.92,
        ...Re("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...It("arm", { spread: 75 }), ...It("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": at(t, "arm.left.spread"), "arm.right.spread": at(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: at(t, "stretch"), bend: at(t, "bend"), ...It("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...Re("scared"), ...It("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: at(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: at(t, "side") + 2.5 * s, "head.tilt": at(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: at(t, "side"), "head.tilt": at(t, "head.tilt"), bend: at(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": at(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Re("sad"), bend: 18, stretch: 0.92, lean: at(t, "lean") + 5, "head.nod": 14, ...It("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function Ng(t, e) {
  const n = Lt(e.from ?? {}), s = e.speed ?? 1;
  let i = n;
  return [
    { time: e.at, pose: n },
    ...jo[t](n).map((o) => (i = { ...i, ...o.pose }, { time: e.at + o.after * s, pose: i, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
const Wg = /* @__PURE__ */ new Set([
  "x",
  "y",
  "z",
  "position",
  "rotateX",
  "rotateY",
  "rotateZ",
  "quaternion",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "visible",
  "opacity",
  "color"
]), jg = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), ua = (t) => typeof t == "number" ? t : void 0, Bg = 1.7;
function qg(t, e, n) {
  const s = Array.from({ length: 24 }, (i, o) => {
    const r = o / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((i) => i === null) || (t.beginPath(), s.forEach((i, o) => o === 0 ? t.moveTo(i.x, i.y) : t.lineTo(i.x, i.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function Yg(t) {
  const e = ce([0, 1, 0], t);
  if (e > 0.999999) return Ps();
  if (e < -0.999999) return Yt(Dt([1, 0, 0], 180));
  const n = as([0, 1, 0], t);
  return Yt(Dt(n, Math.acos(e) * 180 / Math.PI));
}
function Kg(t, e, n, s, i) {
  const o = t.solid ?? {}, r = o.outline === !1 ? void 0 : o.outline ?? { width: 2, color: "#0f172a" }, a = { color: o.color ?? "#475569", shading: o.shading ?? "toon", outline: r }, l = { color: o.skin ?? "#f2c49b", shading: o.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], d = (b, v, M) => u.push({ mesh: b, world: bt(i, v), material: M }), f = (b, v, M) => d(e.sphere, go(b, [0, 0, 0, 1], [v, v, v]), M);
  for (const b of n.chains) {
    const v = s.chains[b.id], M = b.id === "spine" ? 1.9 : 1;
    b.bones.forEach((x, T) => {
      const A = v[T], k = v[T + 1], O = po(A, k), [$, P] = x.width ?? [1, 1], L = h * M * ($ + P) / 2;
      if (O > 1e-6) {
        const _ = Pl(A, k, 0.5), R = Yg(Pe(tn(k, A)));
        d(e.cylinder, bt(be(_), bt(R, Te([L, O, L]))), a);
      }
      f(A, h * M * $, a), f(k, h * M * P, a);
    }), b.id.startsWith("arm.") && f(v[v.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: y } = s.head, w = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...g, 1];
  d(e.sphere, bt(w, Te([p, m, p])), l);
  for (const b of [-1, 1]) {
    const v = Pe([b * 0.36, 0.15, 0.92]), M = Jn(g, Jn(Jn(qe(y[0], v[0] * p * 1.04), qe(y[1], v[1] * m * 1.04)), qe(y[2], v[2] * p * 1.04))), x = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...M, 1];
    d(e.sphere, bt(x, Te([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const ww = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: Tc({ ...t.character, height: 1 }),
      cylinder: bs(Sc(1, 1, 16)),
      sphere: bs(fg(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: i, lights: o = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let u = { ...mt, ...l.pose };
    for (const [A, k] of n)
      typeof k == "number" && !Wg.has(A) && !jg.has(A) && (u[A] = k);
    const d = Math.max(0, Math.min(1, ua(n.get("walking")) ?? l.walking ?? 0));
    if (d > 0) {
      const A = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, k = Fg(A, ua(n.get("walk")) ?? 0, u);
      u = Object.fromEntries(Object.keys({ ...u, ...k }).map((O) => [O, (u[O] ?? 0) + ((k[O] ?? 0) - (u[O] ?? 0)) * d]));
    }
    const f = l.height ?? Bg, g = bt(i.view, s), p = {
      toView: (A) => Ht(g, A),
      toScreen: (A) => a(A)
    }, y = -p.toView([0, f / 2, 0])[2];
    if (y <= i.near) return null;
    const w = l.shadow === !1 ? [] : [{ depth: y + f, draw: (A) => qg(A, p, f * 0.18) }];
    if (l.look === "solid") {
      const A = Io(h.plan, u, { height: f, contact: h.contact });
      return { meshes: Kg(l, c, h.plan, A, s), drawables: w };
    }
    const b = Ht(s, [0, f * 0.6, 0]), v = Pe(tn(i.position, b)), M = Pc(b, v, o).map((A) => Math.min(1, A)), x = o.length > 0 && h.skin !== "none" ? { ...h, skin: Rc(h.skin, M, _c(r, po(b, i.position)), r?.color) } : h, T = Ag(x, u, p, { height: f });
    return {
      drawables: [
        ...w,
        // Ties keep the character's own order.
        ...T.map((A, k) => ({ depth: -A.depth - k * 1e-6, draw: (O, $) => A.draw(O, $.time) }))
      ]
    };
  }
}, wn = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function zg([t, e, n]) {
  const [s, i, o] = [t / 2, e / 2, n / 2];
  return {
    vertices: [
      [-s, -i, -o],
      [s, -i, -o],
      [s, i, -o],
      [-s, i, -o],
      [-s, -i, o],
      [s, -i, o],
      [s, i, o],
      [-s, i, o]
    ],
    faces: [
      { corners: [4, 5, 6, 7], normal: [0, 0, 1] },
      { corners: [1, 0, 3, 2], normal: [0, 0, -1] },
      { corners: [5, 1, 2, 6], normal: [1, 0, 0] },
      { corners: [0, 4, 7, 3], normal: [-1, 0, 0] },
      { corners: [7, 6, 2, 3], normal: [0, 1, 0] },
      { corners: [0, 1, 5, 4], normal: [0, -1, 0] }
    ]
  };
}
const Le = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function Xg(t, e, n = "x", s = 20, i = 0) {
  const o = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const u = Math.PI * 2 * h / s;
      o.push(Le(n, [Math.cos(u) * t, Math.sin(u) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: Le(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: Le(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, u = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: Le(n, [Math.cos(u), Math.sin(u), 0]) });
  }
  const l = [];
  if (i > 0)
    for (const c of [-r, r]) {
      const h = o.push(Le(n, [0, 0, c * 1.01])) - 1;
      for (let u = 0; u < i; u++) {
        const d = Math.PI * 2 * u / i, f = o.push(Le(n, [Math.cos(d) * t * 0.82, Math.sin(d) * t * 0.82, c * 1.01])) - 1;
        l.push([h, f]);
      }
    }
  return { vertices: o, faces: a, marks: l, creases: !0 };
}
function Ug([t, e, n], s = 16) {
  const i = Math.max(4, Math.round(s / 2)), o = [[0, e, 0]];
  for (let h = 1; h < i; h++) {
    const u = Math.PI * h / i;
    for (let d = 0; d < s; d++) {
      const f = Math.PI * 2 * d / s;
      o.push([Math.sin(u) * Math.cos(f) * t, Math.cos(u) * e, Math.sin(u) * Math.sin(f) * n]);
    }
  }
  const r = o.push([0, -e, 0]) - 1, a = (h, u) => 1 + (h - 1) * s + u % s, l = (h) => {
    const u = h.reduce((d, f) => [d[0] + o[f][0], d[1] + o[f][1], d[2] + o[f][2]], [0, 0, 0]);
    return wn([u[0] / (t * t), u[1] / (e * e), u[2] / (n * n)]);
  }, c = [];
  for (let h = 0; h < s; h++) {
    const u = [0, a(1, h + 1), a(1, h)];
    c.push({ corners: u, normal: l(u) });
    for (let f = 1; f < i - 1; f++) {
      const g = [a(f, h), a(f, h + 1), a(f + 1, h + 1), a(f + 1, h)];
      c.push({ corners: g, normal: l(g) });
    }
    const d = [a(i - 1, h), a(i - 1, h + 1), r];
    c.push({ corners: d, normal: l(d) });
  }
  return { vertices: o, faces: c, creases: !1 };
}
const Vg = (t) => t.reduce((e, [n, s], i) => {
  const [o, r] = t[(i + 1) % t.length];
  return e + n * r - o * s;
}, 0) / 2;
function Gg(t, e) {
  const n = Vg(t) < 0 ? [...t].reverse() : t, s = n.length, i = e / 2, o = [...n.map(([a, l]) => [i, l, a]), ...n.map(([a, l]) => [-i, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: wn([0, -c, h]) });
  }
  return { vertices: o, faces: r, creases: !0 };
}
function Jg(t, e) {
  const n = {
    left: ([i, o]) => [0, o, i],
    right: ([i, o]) => [0, o, i],
    front: ([i, o]) => [i, o, 0],
    back: ([i, o]) => [i, o, 0],
    up: ([i, o]) => [i, 0, o]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((i, o) => o), normal: s[e] }] };
}
function Zg(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, i = [], o = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = wn([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), u = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d = wn(da(h, u)), f = da(d, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), y = Math.sin(p) * s(a);
      i.push([r[0] + d[0] * m + f[0] * y, r[1] + d[1] * m + f[1] * y, r[2] + d[2] * m + f[2] * y]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((d, f) => [d[0] + i[f][0] / 4, d[1] + i[f][1] / 4, d[2] + i[f][2] / 4], [0, 0, 0]), u = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      o.push({ corners: c, normal: wn([h[0] - u[0], h[1] - u[1], h[2] - u[2]]) });
    }
  return { vertices: i, faces: o, creases: !1 };
}
function da(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Qg(t) {
  switch (t.type) {
    case "box":
      return zg(t.size);
    case "cylinder":
      return Xg(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return Ug(t.radii, t.segments);
    case "extrude":
      return Gg(t.profile, t.width);
    case "panel":
      return Jg(t.points, t.facing);
    case "tube":
      return { ...Zg(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function Fc(t, e) {
  if (t.length < 2) return t;
  const n = (i) => t[Math.max(0, Math.min(t.length - 1, i))], s = (i) => {
    const o = i * (t.length - 1), r = Math.min(t.length - 2, Math.floor(o)), a = o - r, [l, c, h, u] = [n(r - 1), n(r), n(r + 1), n(r + 2)];
    return [0, 1, 2].map((d) => {
      const f = l[d], g = c[d], p = h[d], m = u[d];
      return 0.5 * (2 * g + (-f + p) * a + (2 * f - 5 * g + 4 * p - m) * a * a + (-f + 3 * g - 3 * p + m) * a * a * a);
    });
  };
  return Array.from({ length: e }, (i, o) => s(o / (e - 1)));
}
const ve = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function ks(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function Dc(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function Ye(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function Nc(t) {
  const e = t.filter((i, o) => o === 0 || Math.hypot(i[0] - t[o - 1][0], i[1] - t[o - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : Fc(e.map(([i, o]) => [i, 0, o]), (e.length - 1) * 12).map(([i, , o]) => [i, o]);
  let s = 0;
  return n.map((i, o) => (o > 0 && (s += Math.hypot(i[0] - n[o - 1][0], i[1] - n[o - 1][1])), { point: i, at: s }));
}
function Wc(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], i = t[n], o = i.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (i.at - s.at))) : 0;
  return {
    point: [s.point[0] + (i.point[0] - s.point[0]) * o, s.point[1] + (i.point[1] - s.point[1]) * o],
    direction: [i.point[0] - s.point[0], i.point[1] - s.point[1]]
  };
}
function jc(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let i = 0; i < 40; i++) {
    const o = (n + s) / 2;
    t(o) < e ? n = o : s = o;
  }
  return (n + s) / 2;
}
const fa = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag"], tm = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, Gi = Object.keys(Ct), ui = Object.keys(Ze), di = Object.keys(jo), em = 0.25, nm = 700 / 180, sm = 200, im = 300;
function om(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...Gi, "face", "hold", "pose", "gag", "place"], n = [];
  return t.forEach((s, i) => {
    const o = (c) => n.push({ beat: i, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return o("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) fa.includes(c) || o(pt("beat field", c, fa, a[c]));
    const l = typeof r.do == "string" ? ui.includes(r.do) ? "pose" : di.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return o(pt("character 3D beat", r.do, e, l));
    Gi.includes(r.do) && (r.to === void 0 && r.through === void 0 && o(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !ve(r.to) && o(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(ve)) && o("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !ve(r.to) && o("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(ve(r.toward) || typeof r.toward == "number") && o("`face` needs `toward`: a point [x, z] or a heading in degrees."), r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !ui.includes(r.pose) && o(pt("pose", r.pose, ui)), r.do === "gag" && !di.includes(r.gag) && o(pt("gag", r.gag, di));
  }), n;
}
function kw(t, e, n) {
  const s = om(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((v) => `  beat ${v.beat}: ${v.message}`).join(`
`)}`);
  const i = n.height ?? 1.7, o = { ...mt, ...n.pose };
  let [r, a] = n.position ?? [0, 0], l = n.heading ?? 0, c = 0;
  const h = /* @__PURE__ */ new Map(), u = [], d = (v, M, x, T = "linear") => {
    const A = h.get(v) ?? [];
    A.push({ time: M, value: x, easing: T }), h.set(v, A);
  };
  d("x", 0, r), d("z", 0, a), d("rotateY", 0, l);
  const f = (v, M) => {
    const x = ks(l, M);
    if (Math.abs(x) < 1) return v;
    const T = Math.max(sm, Math.abs(x) * nm);
    return d("rotateY", v, l), l += x, d("rotateY", v + T, l, "ease-in-out"), v + T;
  }, g = (v, M, x, T = "ease-in-out") => {
    for (const [A, k] of Object.entries(x))
      o[A] !== k && (d(A, v, o[A] ?? 0), d(A, M, k, T), o[A] = k);
  }, p = (v, M, x) => {
    const T = Nc([[r, a], ...M.through ?? [M.to]]);
    if (T.length < 2) return x;
    const A = f(x, Ye(T[0].point, T[1].point)), k = T[T.length - 1].at, O = M.speed ?? tm[v] * Math.sqrt(i / 1.7), $ = M.for ?? k / O * 1e3, P = Dg(v, i), L = $t("ease-in-out"), _ = Math.min(im, $ / 4);
    u.push({ time: A, value: v }), d("walking", A, 0), d("walking", A + _, 1, "ease-out"), d("walking", A + $ - _, 1), d("walking", A + $, 0, "ease-in");
    const R = c;
    let D = l;
    for (let Y = 0; ; Y = Math.min(k, Y + em)) {
      const j = A + jc(L, Y / k) * $, { point: U, direction: G } = Wc(T, Y);
      if (D += ks(D, Ye([0, 0], G)), d("x", j, U[0]), d("z", j, U[1]), d("rotateY", j, D), d("walk", j, R + Y / P), Y >= k) break;
    }
    return c = R + k / P, [r, a] = T[T.length - 1].point, l = D, A + $;
  }, m = [];
  let y = 0;
  for (const v of e) {
    const M = v.at ?? y;
    let x = M;
    if (Gi.includes(v.do)) x = p(v.do, v, M);
    else if (v.do === "face") x = f(M, typeof v.toward == "number" ? v.toward : Ye([r, a], v.toward));
    else if (v.do === "hold") x = M + (v.for ?? 1e3);
    else if (v.do === "place")
      d("x", M, r), d("z", M, a), [r, a] = v.to, d("x", M + 1, r), d("z", M + 1, a), typeof v.toward == "number" && (d("rotateY", M, l), l = v.toward, d("rotateY", M + 1, l)), x = M + 1;
    else if (v.do === "pose") {
      x = M + (v.for ?? 500);
      const T = typeof v.pose == "string" ? Ze[v.pose] : v.pose;
      g(M, x, T);
    } else if (v.do === "gag") {
      const T = Ng(v.gag, { at: M, from: { ...o } });
      let A = T[0];
      for (const k of T.slice(1))
        g(A.time, k.time, Object.fromEntries(Object.entries(k.pose).filter(([O, $]) => o[O] !== $)), k.easing ?? "ease-in-out"), A = k;
      x = A.time;
    }
    m.push({ do: v.do, start: M, end: x }), y = x;
  }
  const w = `${n.scene}/${t}`, b = [...h].map(([v, M]) => ({ id: `${t}-${v}`, target: w, property: v, keyframes: Dc(M) }));
  return u.length > 0 && b.push({ id: `${t}-gait`, target: w, property: "gait", keyframes: u }), { tracks: b, duration: y, beats: m, end: { position: [r, a], heading: l, pose: { ...o } } };
}
const rm = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function vw(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : rm[n];
  };
  return {
    x: e("x"),
    y: e("y"),
    scale: e("scale"),
    rotate: e("rotate"),
    shakeX: e("shakeX"),
    shakeY: e("shakeY"),
    shakeRotate: e("shakeRotate")
  };
}
function Mw(t, e, n) {
  const s = n.width / 2, i = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, i + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -i);
}
function Sw(t, e, n) {
  const s = e.width / 2, i = e.height / 2, o = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - i) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(o) - a * Math.sin(o),
    y: i + t.y + t.shakeY + r * Math.sin(o) + a * Math.cos(o)
  };
}
function am(t, e, n = {}, s) {
  const i = n.length ?? 240, o = 9, r = 28, a = i - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -o, a - r, 2 * o), t.fillStyle = "#e8b4a0", t.fillRect(a, -o, i - a, 2 * o), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -o), t.lineTo(r, o), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -o * 0.35), t.lineTo(r * 0.35, o * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -o }, { x: i, y: -o }, { x: i, y: o }, { x: r, y: o }, { x: 0, y: 0 }],
    [{ x: r, y: -o }, { x: r, y: o }],
    [{ x: a, y: -o }, { x: a, y: o }]
  ];
  for (const c of l) Kc(t, c, s);
  t.restore();
}
function Bc(t, e, n = {}, s) {
  const i = n.length ?? 90, o = n.thickness ?? 34;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -35) * Math.PI / 180);
  const r = -o / 2;
  t.fillStyle = n.color ?? "#f4a7b9", t.fillRect(0, r, i, o), t.fillStyle = "#e9edf2", t.fillRect(i * 0.45, r, i * 0.55, o), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round";
  const a = [
    { x: 0, y: r },
    { x: i, y: r },
    { x: i, y: -r },
    { x: 0, y: -r },
    { x: 0, y: r }
  ], l = [{ x: i * 0.45, y: r }, { x: i * 0.45, y: -r }];
  if (s)
    s.line(a), s.line(l);
  else
    for (const c of [a, l]) {
      t.beginPath(), t.moveTo(c[0].x, c[0].y);
      for (const h of c.slice(1)) t.lineTo(h.x, h.y);
      t.stroke();
    }
  t.restore();
}
const qc = 150, lm = { pencil: 44, eraser: 30 };
function Yc(t, e, n = {}, s) {
  const i = n.tool ?? "pencil", o = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = qc * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const d = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, f = Et.pencilGrip, g = (T) => {
    const A = T.fingers.thumb, k = T.fingers.index, O = T.fingers.middle, $ = pa([A.points[3], k.points[3], O.points[3]]), P = pa([A.points[1], k.points[0]]), L = (A.depths[3] + k.depths[3] + O.depths[3]) / 3;
    return { pinch: $, direction: Math.atan2(P.y - $.y, P.x - $.x), depth: L };
  }, p = Wi(f, { size: u }), m = c - g(p).direction, y = Wi(f, { size: u, angle: m * 180 / Math.PI }), w = g(y), b = lm[i] * a, v = { x: w.pinch.x - Math.cos(c) * b, y: w.pinch.y - Math.sin(c) * b }, M = { x: d.x - v.x, y: d.y - v.y }, x = y.axes.up;
  cm(t, M, { x: -x.x, y: -x.y }, u, n.arm ?? 300 * a, o, n.sleeve ?? "#5b7db1", r), To(t, M, f, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: o,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: w.depth,
      draw: () => {
        t.save(), t.translate(d.x, d.y), t.scale(a, a), i === "eraser" ? Bc(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : am(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const pa = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function cm(t, e, n, s, i, o, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, y) => ({
    x: e.x + n.x * p + l.x * m * y,
    y: e.y + n.y * p + l.y * m * y
  }), u = h(i, 0, 0), d = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, hm(p)), m;
  }, f = Math.min(s * 0.55, i * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / qc), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(f + 4, -1, c * 1.1).x, h(f + 4, -1, c * 1.1).y), t.lineTo(h(f + 4, 1, c * 1.1).x, h(f + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = o, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(f, -1, c * 1.1).x, h(f, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(f, 1, c * 1.1).x, h(f, 1, c * 1.1).y), t.stroke();
  const g = [h(f, -1, c * 1.3), h(i, -1, c * 1.5), h(i, 1, c * 1.5), h(f, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = d(r), t.fill(), t.strokeStyle = d(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function Tw(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, i = n.enter ?? 450, o = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, y) => ({ x: p.x + (m.x - p.x) * y, y: p.y + (m.y - p.y) * y }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: Mo(u.path, m), tool: l(u), lift: 0, drawing: !0 };
  }
  const d = [...a].reverse().find((p) => p.end < e), f = a.find((p) => p.start > e), g = (p) => p.path[p.path.length - 1];
  if (d && f && f.start - d.end <= r) {
    const p = (e - d.end) / (f.start - d.end), m = p < 0.5 ? l(d) : l(f);
    return { at: h(g(d), f.path[0], c(p)), tool: m, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (f && f.start - e <= i) {
    const p = 1 - (f.start - e) / i;
    return { at: h(s, f.path[0], c(p)), tool: l(f), lift: 1 - c(p), drawing: !1 };
  }
  if (d && e - d.end <= o) {
    const p = (e - d.end) / o;
    return { at: h(g(d), s, c(p)), tool: l(d), lift: c(p), drawing: !1 };
  }
  return null;
}
function xw(t, e, n, s = 0.08, i = 32) {
  const o = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= i; a++) {
    const l = -Math.PI / 2 + o * a / i;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function Ew(t) {
  const { path: e } = t, n = e.map((a) => a.x), s = e.map((a) => a.y), i = Math.min(...n), o = Math.min(...s), r = t.hand === !1 ? void 0 : t.hand === !0 || t.hand === void 0 ? {} : t.hand;
  return {
    type: "custom",
    x: i,
    y: o,
    width: Math.max(1, Math.max(...n) - i),
    height: Math.max(1, Math.max(...s) - o),
    props: { draw: 0 },
    draw(a, l, c) {
      const h = Math.min(1, Math.max(0, Number(l.props?.draw ?? 0)));
      a.translate(-i, -o), a.strokeStyle = t.color ?? "#2f2f33", a.lineWidth = t.lineWidth ?? 5, a.lineCap = "round", a.lineJoin = "round";
      const u = t.sketch ? Fi(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : Kc(a, Mn(e, h))), r && h > 0 && h < 1 && Yc(a, Mo(e, h), r, u);
    }
  };
}
function hm(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, i, o] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${i}, ${o}, 0)`;
}
function Kc(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const qn = 1e5;
function Aw(t, e, n, s, i = 6) {
  const o = [], r = Math.max(1, Math.round(i));
  for (let a = 0; a <= r; a++)
    o.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return o;
}
function zc(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const i = Mn(e, s), o = n / 2, r = (a) => {
    t.beginPath(), t.rect(-qn, -qn, 2 * qn, 2 * qn), a(), t.clip("evenodd");
  };
  for (const a of i)
    r(() => {
      t.moveTo(a.x + o, a.y), t.arc(a.x, a.y, o, 0, Math.PI * 2);
    });
  for (let a = 1; a < i.length; a++) {
    const l = i[a - 1], c = i[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const u = -(c.y - l.y) / h * o, d = (c.x - l.x) / h * o;
    r(() => {
      t.moveTo(l.x + u, l.y + d), t.lineTo(c.x + u, c.y + d), t.lineTo(c.x - u, c.y - d), t.lineTo(l.x - u, l.y - d), t.closePath();
    });
  }
}
function $w(t, e, n, s, i) {
  t.save(), zc(t, e, n, s), i(), t.restore();
}
function Pw(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, i = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(o, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (o.save(), zc(o, e.path, n, l), t.draw(o, r, a), o.restore(), !i || l <= 0 || l >= 1) return;
      const c = Mo(e.path, l);
      s ? Yc(o, c, { ...s, tool: "eraser" }) : Bc(o, c, i);
    }
  };
}
const um = {
  background: "#1e1e2e",
  gutter: "#6c7086",
  text: "#cdd6f4",
  keyword: "#cba6f7",
  string: "#a6e3a1",
  number: "#fab387",
  comment: "#7f849c",
  highlight: "rgba(249, 226, 175, 0.22)",
  strike: "#f38ba8",
  font: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
}, Ji = ["wipe", "fly", "blur"], dm = 16e-4, fm = 0.6, ln = 33, pm = 0.9, gm = 8;
function _w(t) {
  const e = { ...um, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, i = (t.lineHeight ?? 1.6) * s, o = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * o, l = Math.max(1, ...n.map((E) => E.length)), c = t.width ?? r * 2 + a + l * o, h = r * 2 + n.length * i, u = t.x + r + a, d = new Set(t.hidden ?? []), f = t.language ?? "plain";
  if (!Zi.includes(f)) throw new Error(`codePanel: ${pt("language", f, Zi)}`);
  const g = n.map((E) => km(E, f).flatMap((H) => Array.from(H.text, () => e[H.kind]))), p = /* @__PURE__ */ new Map(), m = [], y = /* @__PURE__ */ new Map(), w = [], b = [], v = (E) => {
    if (!Number.isInteger(E) || E < 1 || E > n.length) throw new Error(`codePanel: no line ${E} (it has ${n.length})`);
  }, M = (E, ...H) => p.set(E, [...p.get(E) ?? [], ...H]), x = (E, H, S, I, F = 300) => M(E, { time: I.at, value: H }, { time: I.at + (I.duration ?? F), value: S, ...I.easing ? { easing: I.easing } : {} }), T = (E, H, S, I, F, B = 300) => {
    v(E), x(`line.${E}.${H}`, S, I, F, B);
  }, A = (E, H) => m.filter((S) => S.line < E && S.closed <= H).length, k = (E, H, S, I) => ({
    x: E + S / 2,
    y: H + I / 2,
    left: E,
    right: E + S,
    top: H,
    bottom: H + I,
    width: S,
    height: I
  }), O = (E) => t.y + r + (E - 1) * i, $ = (E) => Array.isArray(E) ? E : [E], P = (E, H) => {
    const S = p.get(E);
    return S ? [...S].sort((I, F) => I.time - F.time)[S.length - 1].value : H;
  }, L = (E, H, S) => {
    let I = -1;
    for (let F = 0; F < S; F++)
      if (I = n[E - 1].indexOf(H, I + 1), I < 0) throw new Error(`codePanel: line ${E} has no ${S > 1 ? `${S}th ` : ""}"${H}"`);
    return I;
  }, _ = {};
  n.forEach((E, H) => {
    const S = H + 1;
    _[`line.${S}.highlight`] = 0, _[`line.${S}.strike`] = 0, _[`line.${S}.wipe`] = 0, _[`line.${S}.reveal`] = d.has(S) ? 0 : 1, _[`line.${S}.shift`] = 0;
  });
  const R = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: _,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${f} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return ym(Object.keys(_));
      },
      actions: Xc
    },
    draw(E, H) {
      const S = H.props ?? {}, I = (q) => Number(S[q] ?? _[q]), F = r + a, B = (q) => r + (q - 1) * i - I(`line.${q}.shift`) * i;
      E.fillStyle = e.background, ga(E, 0, 0, c, h, 8), E.fill(), E.font = `${s}px ${e.font}`, E.textBaseline = "middle", E.textAlign = "left";
      const nt = (q, Q, C, N, W) => {
        const J = n[q - 1];
        for (let X = Q; X < C; X++)
          J[X] !== " " && (E.fillStyle = g[q - 1][X], E.fillText(J[X], N + (X - Q) * o, W));
      };
      E.save(), ga(E, 0, 0, c, h, 8), E.clip(), n.forEach((q, Q) => {
        const C = Q + 1, N = I(`line.${C}.wipe`);
        if (N >= 1) return;
        const W = B(C), J = W + i / 2, X = Math.max(1, q.length) * o, tt = Math.round(I(`line.${C}.reveal`) * q.length), st = y.get(C) ?? { style: "wipe", from: "left" };
        E.save(), N > 0 && mm(E, st, N, { left: F - a, top: W, width: a + X + o, height: i }, c);
        const ht = I(`line.${C}.highlight`);
        ht > 0 && (E.globalAlpha *= Math.min(1, ht), E.fillStyle = e.highlight, E.fillRect(F - o / 2, W, X + o, i), E.globalAlpha /= Math.min(1, ht)), a > 0 && tt > 0 && (E.fillStyle = e.gutter, E.textAlign = "right", E.fillText(String(C), F - o, J), E.textAlign = "left");
        const dt = [
          ...w.filter((V) => V.line === C).map((V) => ({ column: V.column, length: V.text.length, piece: V, insert: void 0 })),
          ...b.filter((V) => V.line === C).map((V) => ({ column: V.column, length: 0, piece: void 0, insert: V }))
        ].sort((V, it) => V.column - it.column || V.length - it.length);
        let lt = 0, Z = F;
        for (const V of dt) {
          nt(C, lt, Math.min(V.column, tt), Z, J), Z += (V.column - lt) * o;
          let it = V.length, K = "";
          if (V.piece) {
            const z = V.piece.written ?? "", ot = I(`piece.${V.piece.id}.write`);
            z && ot > 0 ? (K = z.slice(0, Math.round(ot * z.length)), it = V.length + (z.length - V.length) * Math.min(1, ot * 2)) : it = V.length * (1 - I(`piece.${V.piece.id}.away`));
          } else V.insert && (it = V.insert.chars * I(`insert.${V.insert.id}.open`), V.insert.text && (K = V.insert.text.slice(0, Math.round(I(`insert.${V.insert.id}.type`) * V.insert.text.length))));
          E.fillStyle = e.text;
          for (let z = 0; z < K.length; z++) K[z] !== " " && E.fillText(K[z], Z + z * o, J);
          Z += it * o, lt = V.column + V.length;
        }
        nt(C, lt, Math.max(lt, tt), Z, J);
        const et = I(`line.${C}.strike`);
        et > 0 && (E.strokeStyle = e.strike, E.lineWidth = Math.max(1.5, s / 10), E.beginPath(), E.moveTo(F, J), E.lineTo(F + X * Math.min(1, et), J), E.stroke()), E.restore();
      });
      for (const q of w) {
        const Q = I(`piece.${q.id}.opacity`);
        if (Q <= 0 || I(`line.${q.line}.wipe`) >= 1) continue;
        const C = F + (q.column + q.text.length / 2) * o + I(`piece.${q.id}.x`), N = B(q.line) + i / 2 + I(`piece.${q.id}.y`);
        E.save(), E.globalAlpha = Math.min(1, Q), E.translate(C, N), E.rotate(I(`piece.${q.id}.rotate`) * Math.PI / 180), nt(q.line, q.column, q.column + q.text.length, -q.text.length * o / 2, 0), E.restore();
      }
      E.restore();
    }
  }, D = (E, H) => ({
    x: E.home.x + cn(p.get(`piece.${E.id}.x`), H),
    y: E.home.y + cn(p.get(`piece.${E.id}.y`), H)
  }), Y = (E, H) => {
    for (const S of ["x", "y", "rotate"]) {
      const I = `piece.${E.id}.${S}`, F = (p.get(I) ?? []).filter((B) => B.time <= H);
      p.set(I, F);
    }
  }, j = {
    target: R,
    lines: n,
    box: k(t.x, t.y, c, h),
    line(E, H = 1 / 0) {
      return v(E), k(u, O(E) - A(E, H) * i, Math.max(1, n[E - 1].length) * o, i);
    },
    token(E, H, S = 1, I = 1 / 0) {
      v(E);
      const F = L(E, H, S);
      return k(u + F * o, O(E) - A(E, I) * i, H.length * o, i);
    },
    highlight(E, H) {
      for (const S of $(E)) {
        const I = P(`line.${S}.highlight`, 0);
        T(S, "highlight", I, H.on === !1 ? 0 : 1, H, 200);
      }
      return j;
    },
    strike(E, H) {
      for (const S of $(E)) T(S, "strike", P(`line.${S}.strike`, 0), 1, H);
      return j;
    },
    remove(E, H) {
      const S = $(E), I = H.style ?? "wipe";
      if (!Ji.includes(I)) throw new Error(`codePanel.remove: ${pt("style", I, Ji)}`);
      const F = I === "wipe" ? 300 : 450, B = H.at + (H.duration ?? F), nt = H.close ?? 250;
      for (const q of S)
        T(q, "wipe", 0, 1, { ...H, easing: H.easing ?? (I === "fly" ? "ease-in" : void 0) }, F), y.set(q, { style: I, from: H.from ?? "left" }), m.push({ line: q, closed: B + nt });
      for (let q = 1; q <= n.length; q++) {
        if (S.includes(q)) continue;
        const Q = S.filter((N) => N < q).length;
        if (Q === 0) continue;
        const C = P(`line.${q}.shift`, 0);
        T(q, "shift", C, C + Q, { at: B, duration: nt, easing: "ease-in-out" });
      }
      return j;
    },
    type(E, H) {
      return T(E, "reveal", 0, 1, { duration: n[E - 1].length * 45, ...H }), j;
    },
    piece(E, H, S = 1) {
      v(E);
      const I = L(E, H, S), F = w.find((nt) => nt.line === E && nt.column === I && nt.text === H);
      if (F) return F;
      if (w.some((nt) => nt.line === E && I < nt.column + nt.text.length && nt.column < I + H.length))
        throw new Error(`codePanel: "${H}" on line ${E} overlaps another piece`);
      const B = { id: w.length + 1, line: E, column: I, text: H, home: j.token(E, H, S, 0) };
      w.push(B);
      for (const nt of ["x", "y", "rotate", "write", "away"]) _[`piece.${B.id}.${nt}`] = 0;
      return _[`piece.${B.id}.opacity`] = 1, B;
    },
    follow(E, H) {
      for (const S of H)
        M(`piece.${E.id}.x`, { time: S.time, value: S.x - E.home.x }), M(`piece.${E.id}.y`, { time: S.time, value: S.y - E.home.y });
      return j;
    },
    fling(E, H) {
      const S = D(E, H.at), I = H.velocity ?? G(E, H.at) ?? { x: 0.5, y: -0.6 }, F = H.gravity ?? dm, B = H.duration ?? 900, nt = (H.spin ?? fm) * (I.x < 0 ? -1 : 1), q = cn(p.get(`piece.${E.id}.rotate`), H.at);
      Y(E, H.at);
      for (let Q = 0; Q <= B; Q += ln) {
        const C = S.x + I.x * Q, N = S.y + I.y * Q + 0.5 * F * Q * Q;
        M(`piece.${E.id}.x`, { time: H.at + Q, value: C - E.home.x }), M(`piece.${E.id}.y`, { time: H.at + Q, value: N - E.home.y }), M(`piece.${E.id}.rotate`, { time: H.at + Q, value: q + nt * Q });
      }
      return x(`piece.${E.id}.opacity`, 1, 0, { at: H.at + B * 0.6, duration: B * 0.4 }), j;
    },
    move(E, H) {
      const S = D(E, H.at);
      return x(`piece.${E.id}.x`, S.x - E.home.x, H.to.x - E.home.x, H, 400), x(`piece.${E.id}.y`, S.y - E.home.y, H.to.y - E.home.y, H, 400), j;
    },
    write(E, H, S) {
      return E.written = H, x(`piece.${E.id}.write`, 0, 1, { duration: Math.max(1, H.length) * 70, ...S }), j;
    },
    spot(E, H, S = 1, I = 1 / 0) {
      v(E);
      const F = b.filter((B) => B.line === E && B.column <= H && B.at <= I).reduce((B, nt) => B + nt.chars, 0);
      return k(u + (H + F) * o, O(E) - A(E, I) * i, S * o, i);
    },
    insert(E, H, S, I) {
      v(E);
      const F = { id: b.length + 1, line: E, column: H, chars: S.length, text: S, at: I.at };
      b.push(F), _[`insert.${F.id}.open`] = 0, _[`insert.${F.id}.type`] = 0;
      const B = I.duration ?? S.length * 70;
      return x(`insert.${F.id}.open`, 0, 1, { at: I.at, duration: B * 0.6, easing: "ease-out" }), x(`insert.${F.id}.type`, 0, 1, { at: I.at, duration: B }), j;
    },
    drop(E, H, S, I) {
      v(H);
      const F = I.duration ?? 250, B = H === E.line, nt = I.easing ?? (B ? "linear" : "ease-out"), q = j.landing(E, H, S, I.at), Q = { id: b.length + 1, line: H, column: S, chars: E.text.length, at: I.at };
      return b.push(Q), _[`insert.${Q.id}.open`] = 0, x(`insert.${Q.id}.open`, 0, 1, { at: I.at, duration: F, easing: B ? nt : "ease-out" }), x(`piece.${E.id}.away`, P(`piece.${E.id}.away`, 0), 1, { at: I.at, duration: F, easing: B ? nt : "ease-in-out" }), Y(E, I.at), j.move(E, { at: I.at, duration: F, easing: nt, to: { x: q.x, y: q.y } }), x(`piece.${E.id}.rotate`, cn(p.get(`piece.${E.id}.rotate`), I.at), 0, { at: I.at, duration: F }), j;
    },
    landing(E, H, S, I = 1 / 0) {
      const F = j.spot(H, S, E.text.length, I), B = H === E.line && S > E.column ? E.text.length * o : 0;
      return k(F.left - B, F.top, F.width, F.height);
    },
    ride(E, H, S) {
      return U(E, H, S.ground, S.every ?? ln);
    },
    tracks(E) {
      return [...p].filter(([, H]) => H.length > 0).map(([H, S]) => ({
        id: `${E}-${H}`,
        target: E,
        property: H,
        keyframes: bm(S)
      }));
    }
  };
  function U(E, H, S, I) {
    const F = n.map((Z, et) => p.get(`line.${et + 1}.shift`) ?? []);
    if (F.every((Z) => Z.length === 0)) return E;
    const B = E.find((Z) => Z.target === H && Z.property === "y"), nt = new Kt({ id: `${H}-ride`, tracks: B ? [B] : [] }), q = (Z) => B ? Number(nt.getStateAtTime(Z).values.get(H)?.get("y") ?? 0) : 0, Q = (Z) => {
      const et = S + q(Z);
      return n.findIndex((V, it) => Math.abs(O(it + 1) - et) < 0.5);
    }, C = (B?.keyframes ?? []).map((Z) => Z.time), N = (Z) => {
      const et = (ot) => ot < 0 ? 0 : -cn(F[ot], Z) * i, V = Q(Z);
      if (V >= 0) return et(V);
      if (Math.abs(q(Z)) < 0.5) return 0;
      const it = (ot) => Q(ot) >= 0 || Math.abs(q(ot)) < 0.5, K = [...C].reverse().find((ot) => ot <= Z && it(ot)), z = C.find((ot) => ot >= Z && it(ot));
      return K === void 0 && z === void 0 ? 0 : K === void 0 ? et(Q(z)) : z === void 0 || z === K ? et(Q(K)) : et(Q(K)) + (et(Q(z)) - et(Q(K))) * (Z - K) / (z - K);
    }, W = F.flatMap((Z) => {
      const et = [...Z].sort((V, it) => V.time - it.time);
      return et.slice(1).flatMap((V, it) => V.value !== et[it].value ? [{ start: et[it].time, end: V.time }] : []);
    }), J = (Z, et) => W.some((V) => V.start < et && V.end > Z) || N(Z) !== N(et), X = B ? [...B.keyframes] : [{ time: 0, value: 0 }], tt = [{ ...X[0], value: X[0].value + N(X[0].time) }], st = (Z, et) => {
      const V = /* @__PURE__ */ new Set([et]);
      for (let it = Z + I; it < et; it += I) V.add(it);
      for (const it of W) for (const K of [it.start, it.end]) K > Z && K < et && V.add(K);
      for (const it of [...V].sort((K, z) => K - z)) tt.push({ time: it, value: q(it) + N(it) });
    };
    for (let Z = 1; Z < X.length; Z++) {
      const et = X[Z - 1].time, V = X[Z].time;
      J(et, V) ? st(et, V) : tt.push({ ...X[Z], value: X[Z].value + N(V) });
    }
    const ht = X[X.length - 1].time, dt = Math.max(ht, ...W.map((Z) => Z.end));
    dt > ht && st(ht, dt);
    const lt = { id: B?.id ?? `${H}-y`, target: H, property: "y", keyframes: tt };
    return B ? E.map((Z) => Z === B ? lt : Z) : [...E, lt];
  }
  function G(E, H) {
    const S = p.get(`piece.${E.id}.x`);
    if (!S || S.length < 2) return;
    const I = D(E, H - ln), F = D(E, H);
    return { x: (F.x - I.x) / ln, y: (F.y - I.y) / ln };
  }
  return j;
}
function mm(t, e, n, s, i) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const o = gm * n;
  if (o > 0.2 && "filter" in t && (t.filter = `blur(${o.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * pm * i, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
function cn(t, e) {
  if (!t || t.length === 0) return 0;
  const n = [...t].sort((s, i) => s.time - i.time);
  if (e <= n[0].time) return n[0].value;
  for (let s = 1; s < n.length; s++)
    if (e <= n[s].time) {
      const i = n[s - 1], o = n[s];
      return o.time === i.time ? o.value : i.value + (o.value - i.value) * (e - i.time) / (o.time - i.time);
    }
  return n[n.length - 1].value;
}
const Xc = {
  highlight: "highlight(n | n[], { at, duration?, on? }): tint lines (on: false clears)",
  strike: "strike(n | n[], { at, duration? }): strike lines through, left to right",
  remove: "remove(n | n[], { at, duration?, style?: wipe | fly | blur, from?: left | right, close? }): take lines away; the lines below close the gap",
  type: "type(n, { at, duration? }): type in a line given in `hidden`",
  piece: "piece(n, text, occurrence?): make a word a piece that can come loose (returns it, with its home box)",
  follow: "follow(piece, path): carry a piece along timed points (handPath() gives a hand’s)",
  fling: "fling(piece, { at, velocity?, spin?, gravity?, duration? }): throw or kick a piece away on a spinning arc",
  move: "move(piece, { at, to: { x, y }, duration?, easing? }): move a piece’s centre to a point",
  write: "write(piece, text, { at, duration? }): type new text into a piece’s place",
  insert: "insert(n, column, text, { at, duration? }): type new text into a line; the line makes room",
  drop: "drop(piece, n, column, { at, duration? }): put a piece into a line (into its own line it slides, the text closing behind it)",
  ride: "ride(tracks, figureId, { ground }): a figure’s tracks with it carried by the line it stands on"
};
function ym(t) {
  const e = [
    [/^line\.\d+\.highlight$/, { description: "How much the line is tinted", unit: "0..1", min: 0, max: 1 }],
    [/^line\.\d+\.strike$/, { description: "How far the strike-through has drawn", unit: "0..1", min: 0, max: 1 }],
    [/^line\.\d+\.wipe$/, { description: "How far the line has gone (wiped, flown off or blurred)", unit: "0..1", min: 0, max: 1 }],
    [/^line\.\d+\.reveal$/, { description: "How much of the line is typed in", unit: "0..1", min: 0, max: 1 }],
    [/^line\.\d+\.shift$/, { description: "How many rows the line has moved up", unit: "rows" }],
    [/^piece\.\d+\.(x|y)$/, { description: "The piece moved from its home", unit: "px" }],
    [/^piece\.\d+\.rotate$/, { description: "The piece turned", unit: "degrees" }],
    [/^piece\.\d+\.opacity$/, { description: "How opaque the piece is", unit: "0..1", min: 0, max: 1 }],
    [/^piece\.\d+\.write$/, { description: "How much of the text written into its place is typed", unit: "0..1", min: 0, max: 1 }],
    [/^piece\.\d+\.away$/, { description: "How far its old place has closed", unit: "0..1", min: 0, max: 1 }],
    [/^insert\.\d+\.open$/, { description: "How much room the insert has opened", unit: "0..1", min: 0, max: 1 }],
    [/^insert\.\d+\.type$/, { description: "How much of the inserted text is typed", unit: "0..1", min: 0, max: 1 }]
  ], n = {};
  for (const s of t) {
    const i = e.find(([o]) => o.test(s));
    i && (n[s] = i[1]);
  }
  return n;
}
function bm(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
function ga(t, e, n, s, i, o) {
  t.beginPath(), t.moveTo(e + o, n), t.arcTo(e + s, n, e + s, n + i, o), t.arcTo(e + s, n + i, e, n + i, o), t.arcTo(e, n + i, e, n, o), t.arcTo(e, n, e + s, n, o), t.closePath();
}
const vs = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
vs.typescript = [...vs.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const Zi = Object.keys(vs), wm = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function km(t, e) {
  const n = new Set(vs[e]), s = wm[e], i = [], o = (a, l) => {
    const c = i[i.length - 1];
    c && c.kind === l ? c.text += a : i.push({ text: a, kind: l });
  };
  let r = 0;
  for (; r < t.length; ) {
    const a = t[r];
    if (e !== "plain" && s && t.startsWith(s, r)) {
      o(t.slice(r), "comment");
      break;
    }
    if (e !== "plain" && (a === '"' || a === "'" || a === "`")) {
      let h = r + 1;
      for (; h < t.length && t[h] !== a; ) h += t[h] === "\\" ? 2 : 1;
      o(t.slice(r, h + 1), "string"), r = h + 1;
      continue;
    }
    const l = /^[A-Za-z_][A-Za-z0-9_]*/.exec(t.slice(r));
    if (l) {
      o(l[0], n.has(l[0]) ? "keyword" : "text"), r += l[0].length;
      continue;
    }
    const c = /^\d[\d_.]*/.exec(t.slice(r));
    if (c && e !== "plain") {
      o(c[0], "number"), r += c[0].length;
      continue;
    }
    o(a, "text"), r++;
  }
  return i;
}
const vm = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1);
function Ow(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = (a) => a.lineWidth * 0.45, i = (a, l, c) => {
    const h = a.parts[`leg.${c}`].points;
    l.shape(Qn(h, a.height * 0.08, a.height * 0.05), n, s(a));
  }, o = (a, l) => {
    const c = a.chains.spine, h = c[0], u = c[c.length - 1], d = { x: h.x - (u.x - h.x) * 0.25, y: h.y - (u.y - h.y) * 0.25 };
    l.shape(Qn([d, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), e, s(a));
  }, r = (a, l, c) => {
    const h = a.parts[`arm.${c}`].points, u = h[0], d = a.chains.spine[a.chains.spine.length - 1], g = [{ x: u.x + (d.x - u.x) * 0.45, y: u.y + (d.y - u.y) * 0.45 }, ...vm(h, 0, 0.45)], p = Qn(g, a.height * 0.085, a.height * 0.06), m = g.length, y = p.slice(0, m), w = p.slice(m).reverse();
    l.shape(p, e, 0);
    const b = (x) => Math.hypot(x[1].x - d.x, x[1].y - d.y), [v, M] = b(y) > b(w) ? [y, w] : [w, y];
    l.line(v.slice(1), s(a)), l.line(M.slice(Math.ceil(m * 0.45)), s(a)), l.line([y[m - 1], w[m - 1]], s(a));
  };
  return {
    parts: {
      "leg.left": { over: (a, l, c) => i(l, c, "left") },
      "leg.right": { over: (a, l, c) => i(l, c, "right") },
      spine: { over: (a, l, c) => o(l, c) },
      "arm.left": { over: (a, l, c) => r(l, c, "left") },
      "arm.right": { over: (a, l, c) => r(l, c, "right") }
    }
  };
}
const Ke = {
  full: {
    anticipation: 0.12,
    anticipationTime: 0.3,
    hold: 0,
    overshoot: 0.08,
    settle: 220,
    settleEase: "ease-in-out",
    actionEase: "ease-in-out-cubic",
    overlap: 45,
    eyeLead: 120,
    eyeDart: 160,
    drift: 0.12,
    blinks: !0,
    jumpSquash: 1
  },
  snappy: {
    anticipation: 0.2,
    anticipationTime: 0.35,
    hold: 0.12,
    overshoot: 0.12,
    settle: 320,
    settleEase: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 },
    actionEase: "ease-out-cubic",
    overlap: 35,
    eyeLead: 100,
    eyeDart: 100,
    drift: 0.1,
    blinks: !0,
    jumpSquash: 1.3
  },
  limited: {
    anticipation: 0.06,
    anticipationTime: 0.25,
    hold: 0,
    overshoot: 0,
    settle: 0,
    settleEase: "ease-out",
    actionEase: "ease-in-out",
    overlap: 30,
    eyeLead: 80,
    eyeDart: 120,
    drift: 0,
    blinks: !0,
    jumpSquash: 0.6
  },
  none: {
    anticipation: 0,
    anticipationTime: 0,
    hold: 0,
    overshoot: 0,
    settle: 0,
    settleEase: "linear",
    actionEase: "linear",
    overlap: 0,
    eyeLead: 0,
    eyeDart: 0,
    drift: 0,
    blinks: !1,
    jumpSquash: 0
  }
};
function Uc(t) {
  if (t === void 0) return Ke.full;
  if (typeof t == "string") return Ke[t];
  const { base: e, ...n } = t;
  return { ...Ke[e ?? "full"], ...n };
}
const Qi = 160, Mm = 120, Sm = 700, fi = 60, Tm = 90, Yn = 3200, ze = 1, Me = 1e-6;
function Bo(t, e, n = {}) {
  const s = Uc(n.style), i = n.seed ?? 1, o = {};
  if (t.length === 0) return o;
  const r = Object.keys(t[0].pose).filter((u) => t.some((d) => Math.abs(d.pose[u] - t[0].pose[u]) > Me));
  for (const u of r) o[u] = xm(u, t, e, s, i);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = Em(t, e, s, i, t[0].pose[a]);
    u.length > 0 && (o[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = Am(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (o[h] = u);
  }
  return o;
}
function xm(t, e, n, s, i) {
  const o = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = o ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (f) => {
    const g = (e[f].time - e[f - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (f, g, p) => {
    const m = h[h.length - 1];
    if (f <= m.time + ze) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: f, value: g, ...p ? { easing: p } : {} });
  };
  let d = e[0].pose[t];
  for (let f = 1; f < e.length; f++) {
    const g = e[f], p = e[f - 1].pose[t], m = g.pose[t], y = m - p, w = h[h.length - 1].time, b = g.act !== !1;
    if (Math.abs(y) <= Me) {
      const $ = g.time + (b ? c(f) : 0);
      if (f === e.length - 1)
        Math.abs(d - m) > Me && u(Math.max($, w + Qi), m, "ease-in-out"), d = m;
      else if (b && a && s.drift > 0 && n.drift.includes(t) && $ - w >= Sm) {
        const P = Vt(`${i}:${t}:${f}`) % 2 === 0 ? 1 : -1;
        d = m + P * s.drift * r, u($, d, "ease-in-out");
      }
      continue;
    }
    if (!b) {
      u(e[f - 1].time, d), u(g.time, m, g.easing), d = m;
      continue;
    }
    const v = c(f), M = Math.max(e[f - 1].time + v, w);
    let x = g.time + v;
    o && s.eyeDart > 0 && (x = Math.min(x, M + s.eyeDart));
    const T = x - M;
    if (T <= ze) {
      u(g.time, m, g.easing), d = m;
      continue;
    }
    u(M, d);
    const A = Math.sign(y);
    if (a && s.anticipation > 0 && r > 0 && T >= Qi) {
      const $ = d - A * Math.min(Math.abs(y) * s.anticipation, r), P = M + T * s.anticipationTime;
      u(P, $, "ease-in-out"), s.hold > 0 && u(P + T * s.hold, $);
    }
    const k = f + 1 < e.length ? e[f + 1].time - g.time : 1 / 0, O = Math.min(s.settle, k / 2);
    if (a && s.overshoot > 0 && r > 0 && T >= Mm && O > ze) {
      const $ = Math.min(Math.abs(y) * s.overshoot, r);
      u(x, m + A * $, g.easing ?? s.actionEase), u(x + O, m, s.settleEase);
    } else
      u(x, m, g.easing ?? s.actionEase);
    d = m;
  }
  return h;
}
function Em(t, e, n, s, i) {
  const o = [], r = fi + Tm;
  for (let f = 1; f < t.length; f++) {
    const g = t[f - 1].pose, p = t[f].pose;
    Object.entries(e.headTurns).some(([y, w]) => Math.abs((p[y] ?? 0) - (g[y] ?? 0)) > w) && t[f].act !== !1 && o.push(Math.max(t[0].time, t[f - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...o];
  let h = a + Yn * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Yn / 2) || o.push(h);
    const g = (Vt(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (Yn * 0.66);
    h += Yn + g;
  }
  o.sort((f, g) => f - g);
  const d = [{ time: a, value: i }];
  for (const f of o) {
    const g = d[d.length - 1].time;
    f + fi <= g + ze || (f > g + ze && d.push({ time: f, value: i }), d.push({ time: f + fi, value: 1, easing: "ease-in" }), d.push({ time: f + r, value: i, easing: "ease-out" }));
  }
  return d.length > 1 ? d : [];
}
function Am(t, e, n, s) {
  const i = n * (1 - 0.18 * s), o = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + ze || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, d = t[l].time, f = d - u;
    if (!(f < Qi || t[l].act === !1)) {
      if (c <= Me && h > Me)
        a(u, n), a(u + f * 0.2, i, "ease-out"), a(u + f * 0.45, o, "ease-out"), a(d, n, "ease-in-out");
      else if (c > Me && h <= Me) {
        const g = l + 1 < t.length ? t[l + 1].time - d : 400;
        a(u + f * 0.5, n), a(d - Math.min(60, f * 0.15), o, "ease-in"), a(d, i, "ease-out"), a(d + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const $m = {
  depth: {
    lean: 0,
    bend: 0,
    rise: 0,
    sit: 0,
    spin: 0,
    stretch: 0,
    turn: 0,
    leftHip: 0,
    rightHip: 0,
    headTilt: 1,
    leftShoulder: 1,
    rightShoulder: 1,
    leftKnee: 1,
    rightKnee: 1,
    leftBrow: 1,
    rightBrow: 1,
    browTilt: 1,
    leftEye: 1,
    rightEye: 1,
    leftElbow: 2,
    rightElbow: 2,
    leftAnkle: 2,
    rightAnkle: 2,
    leftFootOut: 2,
    rightFootOut: 2,
    mouth: 2,
    smile: 2,
    mouthWidth: 2,
    leftWrist: 3,
    rightWrist: 3
  },
  limits: {
    lean: 10,
    bend: 10,
    headTilt: 12,
    spin: 25,
    turn: 0.06,
    sit: 0.06,
    stretch: 0.08,
    rise: 0,
    leftShoulder: 20,
    rightShoulder: 20,
    leftElbow: 18,
    rightElbow: 18,
    leftWrist: 15,
    rightWrist: 15,
    leftHip: 12,
    rightHip: 12,
    leftKnee: 15,
    rightKnee: 15,
    leftAnkle: 10,
    rightAnkle: 10,
    leftBrow: 0.25,
    rightBrow: 0.25,
    leftEye: 0.15,
    rightEye: 0.15
  },
  eyes: ["lookX", "lookY"],
  blink: "blink",
  headTurns: { turn: 0.15, headTilt: 8, lookX: 0.5, spin: 45 },
  drift: ["lean", "bend", "headTilt", "leftShoulder", "rightShoulder", "leftElbow", "rightElbow"],
  lift: "rise",
  stretch: "stretch"
};
function Pm(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function _m() {
  const t = {}, e = {};
  for (const n of Object.keys(mt)) {
    const s = Pm(n);
    t[n] = s.depth, s.limit !== void 0 && (e[n] = s.limit);
  }
  return {
    depth: t,
    limits: e,
    eyes: ["lookX", "lookY"],
    blink: "blink",
    headTurns: { turn: 0.15, "head.turn": 15, "head.nod": 12, lookX: 0.5, roll: 45 },
    drift: ["lean", "bend", "head.tilt", "head.nod", "arm.left.spread", "arm.right.spread", "arm.left.elbow", "arm.right.elbow"],
    lift: "lift",
    stretch: "stretch"
  };
}
const Om = _m();
function Vc(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function Im(t, e, n = {}) {
  const s = gc(e), i = e.map((o, r) => ({ time: o.time, pose: { ...s[r] }, easing: o.easing, act: o.act }));
  return Vc(t, Bo(i, n.rig ?? $m, n));
}
function Iw(t, e, n = {}) {
  const s = n.rest ?? mt, i = $c(e, s), o = e.map((r, a) => ({ time: r.time, pose: { ...s, ...i[a] }, easing: r.easing, act: r.act }));
  return Vc(t, Bo(o, n.rig ?? Om, n));
}
const ma = ut.shocked, Hm = ut.scared, _e = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...ma, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...ut.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...ma, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...ut.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: t.leftShoulder, rightShoulder: t.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: rt.leftHip, rightHip: rt.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...Hm, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Nt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function ya(t, e) {
  const n = typeof e.from == "string" ? Nt[e.from] : e.from ?? rt;
  return Gc(_e[t](n), { ...e, from: n });
}
function Gc(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((i) => (s = { ...s, ...i.pose }, { time: e.at + i.after * n, pose: s, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function Ms(t, e = 1) {
  const n = _e[t](rt);
  return n[n.length - 1].after * e;
}
function Cm(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), i = n.spacing ?? 5, o = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * i, c = Math.floor(Math.abs(l) / Math.max(i, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], d = e[h], f = d.x - u.x, g = d.y - u.y, p = Math.hypot(f, g) || 1, m = -g / p, y = f / p, w = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - w), t.lineWidth = o * (1 - w * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + y * l), t.lineTo(d.x + m * l, d.y + y * l), t.stroke();
    }
  }
  t.restore();
}
const Rm = {
  hands: [
    { name: "left hand", at: (t) => t.hands.left },
    { name: "right hand", at: (t) => t.hands.right }
  ],
  toes: [
    { name: "left toe", at: (t) => t.toes.left },
    { name: "right toe", at: (t) => t.toes.right }
  ],
  head: [{ name: "head", at: (t) => t.head.center }],
  body: [
    { name: "hip", at: (t) => t.hip },
    { name: "neck", at: (t) => t.neck }
  ]
};
function Hw(t, e, n, s, i = {}) {
  const o = n.stateAt;
  if (!o) return;
  const r = i.length ?? 120, a = Math.max(2, Math.round(i.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let f = 0; f < a; f++) {
    const g = l + (n.time - l) * f / (a - 1);
    c.push(pc(e, { time: g, state: o(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (i.threshold ?? 1.2) * h, d = (i.parts ?? ["hands", "toes", "head"]).flatMap((f) => Rm[f]);
  for (const f of d) {
    const g = c.map(f.at);
    let p = 0;
    for (let w = 1; w < g.length; w++) p += Math.hypot(g[w].x - g[w - 1].x, g[w].y - g[w - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const y = Math.min(1, (m - u) / (u * 0.5));
    Cm(t, g, { ...i, opacity: (i.opacity ?? 0.7) * y, spacing: i.spacing ?? h * 0.02 });
  }
}
function Lm(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, i * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = Vt(`${o}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * i * 0.3 * r, u = e.y - i * (0.06 + 0.12 * l) * r + Math.abs(c) * i * 0.03, d = i * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, d, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function Cw(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, i * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < o; a++) {
    const l = -Math.PI / 2 + (a - (o - 1) / 2) * Math.PI / (o + 1), c = i * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    Fm(t, h, u, i * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function Fm(t, e, n, s, i) {
  t.beginPath();
  for (let o = 0; o < 10; o++) {
    const r = o % 2 === 0 ? s : s * 0.45, a = i + o * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    o === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const me = {
  /** Closed and relaxed */
  rest: { mouth: 0, mouthWidth: 1 },
  /** "ah": open wide */
  a: { mouth: 0.75, mouthWidth: 1.1 },
  /** "eh": open, wide */
  e: { mouth: 0.45, mouthWidth: 1.3 },
  /** "ee": a little open, stretched wide */
  i: { mouth: 0.28, mouthWidth: 1.45 },
  /** "oh": round */
  o: { mouth: 0.6, mouthWidth: 0.7 },
  /** "oo": small and pursed */
  u: { mouth: 0.32, mouthWidth: 0.55 },
  /** m, b, p: lips pressed */
  m: { mouth: 0, mouthWidth: 0.9 },
  /** f, v: lip under the teeth */
  f: { mouth: 0.1, mouthWidth: 1.05 },
  /** l, th, n, d, t: tongue up, a little open */
  l: { mouth: 0.3, mouthWidth: 1 },
  /** Other consonants: slightly open */
  c: { mouth: 0.2, mouthWidth: 1 }
}, hn = 1, Kn = 0.55, ba = 0.35, Dm = 1.6, wa = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, ka = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, va = {
  अ: "a",
  आ: "a",
  इ: "i",
  ई: "i",
  उ: "u",
  ऊ: "u",
  ऋ: "i",
  ए: "e",
  ऐ: "e",
  ओ: "o",
  औ: "o",
  ऍ: "e",
  ऑ: "o"
}, Ma = {
  "ा": "a",
  "ि": "i",
  "ी": "i",
  "ु": "u",
  "ू": "u",
  "ृ": "i",
  "े": "e",
  "ै": "e",
  "ो": "o",
  "ौ": "o",
  "ॅ": "e",
  "ॉ": "o"
}, Nm = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, Wm = "्", Sa = "़", jm = (t) => t >= "क" && t <= "ह", Ta = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function Bm(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (i, o) => {
    const r = e[e.length - 1];
    r && r.viseme === i ? r.weight += o * 0.5 : e.push({ viseme: i, weight: o });
  };
  for (let i = 0; i < n.length; i++) {
    const o = n[i], r = n[i + 1];
    if (Ta.has(o)) s("rest", Dm);
    else if (/\s/.test(o)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: ba });
    } else if ((o === "o" || o === "e") && r === o)
      s(o === "o" ? "u" : "i", hn), i++;
    else if (o in wa) s(wa[o], hn);
    else if (o in ka) s(ka[o], Kn);
    else {
      if (o === "h") continue;
      if (/[a-z]/.test(o)) s("c", Kn);
      else if (o in va) s(va[o], hn);
      else if (jm(o)) {
        const a = r === Sa ? o === "फ" ? "f" : void 0 : Nm[o];
        s(a ?? "c", Kn);
        let l = i + 1;
        n[l] === Sa && l++;
        const c = n[l];
        c === Wm ? i = l : c && c in Ma ? (s(Ma[c], hn), i = l) : (!c || /\s/.test(c) || Ta.has(c) || s("a", hn * 0.6), i = l - 1);
      } else (o === "ं" || o === "ँ") && s("l", Kn * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === ba); ) e.pop();
  return e;
}
function Jc(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", i = e.energy ?? 1, o = Bm(t.text), r = [{ time: t.start, value: me.rest.mouth }], a = [{ time: t.start, value: me.rest.mouthWidth }], l = o.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of o) {
      const d = c * u.weight / l, f = h + Math.min(d * 0.4, 60);
      if (f > r[r.length - 1].time) {
        const g = me[u.viseme];
        r.push({ time: f, value: g.mouth * i, easing: "ease-out" }), a.push({ time: f, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, i), easing: "ease-out" });
      }
      h += d;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: me.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: me.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function Rw(t, e, n = {}) {
  const s = {};
  for (const i of [...e].sort((o, r) => o.start - r.start))
    for (const [o, r] of Object.entries(Jc(i, n))) {
      const a = s[o] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([i, o]) => ({ id: `${t}-${i}`, target: t, property: i, keyframes: o }));
}
function qm(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const i = s.fields?.mouth ?? "mouth", o = s.fields?.mouthWidth ?? "mouthWidth", r = { [i]: me.rest.mouth, [o]: me.rest.mouthWidth, ...s.rest }, a = new Kt({ id: "before-speech", tracks: e }), l = (u, d) => a.getStateAtTime(d).values.get(t)?.get(u) ?? r[u], c = [i, o], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const d = e.find((g) => g.target === t && g.property === u);
    let f = d ? [...d.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = Jc(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, f = [...f.filter((m) => m.time < g.start || m.time > g.end), ...p], f.sort((m, y) => m.time - y.time);
    }
    h.push({ id: d?.id ?? `${t}-${u}`, target: t, property: u, keyframes: f });
  }
  return h;
}
const Ls = {
  look: { summary: "Turns the head and eyes toward a scene x, `viewer`, `ahead` or `back`.", uses: ["toward"] },
  face: { summary: "Turns the whole figure toward a scene x (turning round if needed), `viewer`, `ahead` or `back`.", uses: ["toward"] },
  say: { summary: "Lip-syncs the `say` line with small nods; the beat lasts as long as the line.", needs: ["say"] },
  hold: { summary: "Holds the pose (the acting pass drifts long holds)." },
  stand: { summary: "Back to its resting stance (a character’s own, else the rest pose), keeping the way it is turned." },
  go: { summary: "Walks to `to` in its own gait (a character’s, else walk).", needs: ["to"] },
  zip: { summary: "The cartoon exit: winds up, wheels its legs in place, then shoots off to `to`, leaving dust.", needs: ["to"] },
  leap: { summary: "Crouches, springs, arcs and lands squashed at `to`, on the floor `onto` (a scene y).", uses: ["to", "onto"] },
  swipe: { summary: "Winds an arm up, then slides along the target with the arm out so the hand crosses it edge to edge.", uses: ["target"] },
  grab: { summary: "Steps to where its arm reaches the target (crouching for low things), takes it and lifts it overhead.", needs: ["target"] },
  throw: { summary: "Winds the arm back and throws forward and up toward `to` (or the target); `release` is when it lets go.", uses: ["to", "target"] },
  kick: { summary: "Steps to a leg’s length from the target, draws the leg back and kicks through it.", needs: ["target"] },
  put: { summary: "Steps to where its arm reaches the spot and sets the thing down there.", needs: ["target"] },
  write: { summary: "Reaches a pen to the spot and writes along it left to right (moving along when it is wide).", needs: ["target"] },
  push: { summary: "Sets both hands on the target’s near side and walks it along until its centre is at `to`.", needs: ["target", "to"] }
};
function Zc(t = {}) {
  return [
    ...Object.keys(Ct),
    ...Object.keys(Nt),
    ...Object.keys(_e),
    ...Object.keys(Ls),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function Qc(t = {}) {
  const e = new Set(Zc()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function th(t = {}) {
  const e = {};
  for (const n of Object.keys(Ct)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(Nt)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(_e)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(Ls)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const to = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], Ym = {
  action: "do",
  type: "do",
  verb: "do",
  time: "at",
  start: "at",
  delay: "at",
  duration: "for",
  length: "for",
  ms: "for",
  x: "to",
  position: "to",
  destination: "to",
  expression: "mood",
  emotion: "mood",
  face: "mood",
  feeling: "mood",
  text: "say",
  line: "say",
  speech: "say",
  dialogue: "say",
  joints: "pose",
  y: "onto",
  floor: "onto",
  ground: "onto",
  object: "target",
  at_target: "target"
}, zn = ["viewer", "ahead", "back"], pe = (t) => typeof t == "number" && Number.isFinite(t);
function eh(t, e = {}) {
  const n = Qc(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = Zc(e), i = (l) => l in Ct || l in (e.gaits ?? {}), o = Object.keys(ut), r = Object.keys(rt);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), u = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const d = l;
    for (const p of Object.keys(d))
      to.includes(p) || h(pt("beat field", p, to, Ym[p.toLowerCase()]));
    const f = d.do;
    if (f === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof f != "string" || !s.includes(f)) {
      h(pt("action", f, s));
      return;
    }
    const g = Ls[f] ?? e.actions?.[f];
    for (const p of g?.needs ?? [])
      d[p] === void 0 && h(`\`${f}\` needs \`${p}\`.`);
    if (i(f) && d.to === void 0 && u(`\`${f}\` without \`to\` walks nowhere.`), f === "leap" && d.to === void 0 && d.onto === void 0 && u("`leap` without `to` or `onto` jumps on the spot."), d.mood !== void 0 && (typeof d.mood != "string" || !o.includes(d.mood)) && h(pt("mood", d.mood, o)), d.pose !== void 0)
      if (!d.pose || typeof d.pose != "object" || Array.isArray(d.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(d.pose))
          r.includes(p) ? pe(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(pt("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = d[p];
      m !== void 0 && !(pe(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    pe(d.at) && (d.at < a && u(`\`at\` ${d.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = d.at);
    for (const p of ["to", "onto"]) {
      const m = d[p];
      m !== void 0 && !pe(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (d.toward !== void 0 && !pe(d.toward) && !zn.includes(d.toward) && h(`\`toward\` is a scene x or one of ${zn.join(", ")}${typeof d.toward == "string" && rs(d.toward, zn) ? ` (did you mean "${rs(d.toward, zn)}"?)` : ""} (got ${JSON.stringify(d.toward)}).`), d.say !== void 0 && typeof d.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(d.say)}).`), d.target !== void 0) {
      const p = d.target;
      (!p || typeof p != "object" || !pe(p.x) || !pe(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function xa(t, e = {}, n = "scriptTracks") {
  const s = eh(t, e).filter((i) => i.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((i) => `  ${i.beat >= 0 ? `beat ${i.beat}: ` : ""}${i.message}`).join(`
`)}`);
}
h0(th);
function Lw(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function Fw(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const Ea = 8;
function nh(t, e = {}, n = 0) {
  if (n > Ea) throw new Error(`scriptTracks: custom actions nest more than ${Ea} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const i = e[s.do];
    if (!i || !("beats" in i)) return [s];
    const o = i.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return nh(o, e, n + 1);
  });
}
function Km(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const Aa = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, zm = 450, Xm = 2.4, Um = 160, $a = 2.5, Vm = 200, Gm = 340, Jm = 1.1, Pa = [380, 900], Zm = 0.35, Xn = 300, pi = 150, Qm = 260, t1 = 1.2, gi = 160, _a = 400, un = 300, e1 = 450, Oa = 500, mi = 350, Ia = 150, n1 = 120, yi = 180, Ha = 420, s1 = 300, Ca = 300, i1 = 140, bi = 150, Ra = 450, o1 = 450, wi = 150, La = 350, Fa = 400, r1 = 12, a1 = 600, Da = 90, Na = 400, l1 = 200, c1 = 0.09, Wa = 350, Zt = 450, ki = 1200, h1 = 700, Fe = 320, Qt = 220, u1 = 65, d1 = 700, ja = (t) => t in _e, f1 = (t) => t in Nt;
function p1(t) {
  return Math.max(d1, Array.from(t).length * u1);
}
function g1(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  xa(e, s);
  const i = n.gait ?? "walk", o = nh(e, n.actions).map((S) => S.do === "go" ? { ...S, do: i } : S);
  xa(o, s, "scriptTracks (after expanding custom actions)");
  const r = (S) => Ct[S] ?? n.gaits?.[S], a = (S) => Aa[S] ?? n.gaits?.[S]?.cycle ?? 1e3, l = (S) => {
    const I = n.actions?.[S];
    return I && "steps" in I ? I : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, u = n.height ?? 300;
  let d = c, f = h, g = n.facing ?? 1, p = n.start ?? rt, m = 0, y = 0;
  const w = [{ time: 0, pose: p }], b = [{ time: 0, value: 0 }], v = [{ time: 0, value: 0 }], M = [{ time: 0, value: 0 }], x = [{ time: 0, value: 0 }], T = [{ time: 0, value: "walk" }], A = [{ time: 0, value: g }], k = [], O = [], $ = [], P = (S, I, F, B) => {
    p = { ...p, ...I }, F && (p = we(p, F)), w.push({ time: S, pose: p, ...B === !1 ? { act: B } : {} });
  }, L = (S, I, F) => (P(S + Fe / 2, { turn: 0 }, F), A.push({ time: S + Fe / 2, value: g }, { time: S + Fe / 2 + 1, value: I }), g = I, P(S + Fe, { turn: 1 }), S + Fe), _ = (S) => S < d ? -1 : 1, R = (S, I, F) => _(I) !== g ? L(S, _(I), F) : S, D = (S, I, F, B = "arm") => {
    const nt = B === "arm", q = ge({ ...S, ...nt ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: u, facing: g }), Q = nt ? q.shoulders.right : q.hip, C = nt ? q.elbows.right : q.knees.right, N = (X, tt) => Math.atan2(g * X, tt) * 180 / Math.PI, J = ((N(I - (d + Q.x), F - (f + Q.y)) - N(C.x - Q.x, C.y - Q.y)) % 360 + 360) % 360;
    return J > 270 ? J - 360 : J;
  }, Y = (S, I, F, B) => {
    const nt = B === "arm", q = ge({ ...S, ...nt ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: u, facing: g }), Q = nt ? q.shoulders.right : q.hip, C = nt ? { x: (q.hands.right.x + q.fingertips.right.x) / 2, y: (q.hands.right.y + q.fingertips.right.y) / 2 } : q.feet.right, N = Math.hypot(C.x - Q.x, C.y - Q.y), W = F - (f + Q.y), J = Math.abs(W) < N ? Math.sqrt(N * N - W * W) : N * 0.1;
    return I - Q.x - g * J;
  }, j = (S) => {
    const I = ge(S, { height: u, facing: g });
    return { x: d + (I.hands.right.x + I.fingertips.right.x) / 2, y: f + (I.hands.right.y + I.fingertips.right.y) / 2 };
  }, U = (S, I, F) => {
    const B = { ...S, rightWrist: 0, rightElbow: 0, rightShoulder: D(S, I, F) }, nt = ge(B, { height: u, facing: g }), q = { x: d + nt.shoulders.right.x, y: f + nt.shoulders.right.y }, Q = { x: d + nt.elbows.right.x, y: f + nt.elbows.right.y }, C = j(B), N = Math.hypot(Q.x - q.x, Q.y - q.y), W = Math.hypot(C.x - Q.x, C.y - Q.y), J = Math.min(N + W - 0.01, Math.max(Math.abs(N - W) + 0.01, Math.hypot(I - q.x, F - q.y))), X = (lt) => lt * 180 / Math.PI, tt = X(Math.acos((N * N + J * J - W * W) / (2 * N * J))), st = 180 - X(Math.acos((N * N + W * W - J * J) / (2 * N * W)));
    let ht = { rightShoulder: B.rightShoulder, rightElbow: 0 }, dt = 1 / 0;
    for (const lt of [1, -1])
      for (const Z of [1, -1]) {
        const et = { rightShoulder: B.rightShoulder + lt * tt, rightElbow: Z * st }, V = { ...S, rightWrist: 0, ...et }, it = j(V), z = Math.hypot(it.x - I, it.y - F) - ge(V, { height: u, facing: g }).elbows.right.y * 1e-3;
        z < dt && (dt = z, ht = et);
      }
    return ht;
  }, G = (S, I, F) => Math.abs(I - d) < 2 ? S : (b.push({ time: S, value: d - c }, { time: S + F, value: I - c, easing: "ease-in-out" }), d = I, S + F);
  for (const S of o) {
    const I = Math.max(S.at ?? y, y === 0 ? 0 : w[w.length - 1].time);
    let F = I, B, nt;
    const q = S.pose ?? {}, Q = l(S.do);
    if (r(S.do)) {
      const C = S.to ?? d, N = C === d ? g : _(C);
      let W = I;
      N !== g ? W = L(I, N, S.mood) : p.turn < 1 ? (W = I + Qt, P(W, { turn: 1, ...q }, S.mood)) : (S.mood || S.pose) && P(I + Qt, q, S.mood);
      const X = Math.abs(C - d) / zr(r(S.do), u), tt = S.for ?? Math.max(Qt * 2, X * a(S.do)), st = W + tt;
      T.push({ time: W, value: S.do }), x.push({ time: W, value: 0 }, { time: W + Qt, value: 1, easing: "ease-out" }), x.push({ time: st - Qt, value: 1 }, { time: st, value: 0, easing: "ease-in" }), M.push({ time: W, value: m }, { time: st, value: m + X }), b.push({ time: W, value: d - c }, { time: st, value: C - c }), m += X, d = C, P(st, {}), F = st;
    } else if (S.do === "zip") {
      const C = S.to ?? d, N = C === d ? g : _(C);
      let W = I;
      N !== g ? W = L(I, N, S.mood) : p.turn < 1 && (W = I + Qt, P(W, { turn: 1 }, S.mood));
      const J = ya("windUp", { at: W, from: S.mood ? we(p, S.mood) : p });
      w.push(...J), p = J[J.length - 1].pose;
      const X = W + Ms("windUp"), tt = X + zm, st = tt + Math.max(Um, Math.abs(C - d) / Xm);
      T.push({ time: X, value: "run" }), x.push({ time: X, value: 0 }, { time: X + 80, value: 1, easing: "ease-out" }, { time: st, value: 1 }, { time: st + 120, value: 0 }), M.push({ time: X, value: m }, { time: tt, value: m + $a, easing: "ease-in" }), m += $a + (st - tt) / Aa.run * 1.5, M.push({ time: st, value: m }), b.push({ time: tt, value: d - c }, { time: st, value: C - c, easing: "ease-in" }), $.push({ kind: "dust", time: tt, x: d, y: f, length: 900 }), d = C, P(st, {}), F = st;
    } else if (S.do === "leap") {
      const C = S.to ?? d, N = S.onto ?? f;
      let W = C === d ? I : R(I, C, S.mood);
      p.turn < 1 && (W += Qt, P(W, { turn: 1 }, S.mood));
      const J = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      P(W + Vm, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...J }, S.mood, !1);
      const X = W + Gm;
      P(X - 40, { stretch: 0.72 }, void 0, !1), P(X, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const tt = Math.hypot(C - d, N - f), st = S.for ?? Math.min(Pa[1], Math.max(Pa[0], 300 + tt * Jm)), ht = Math.min(f, N) - Zm * u, dt = Math.sqrt(f - ht), lt = Math.sqrt(N - ht), Z = X + st * dt / (dt + lt), et = X + st;
      P(Z, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), P(et, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), P(et + 180, { stretch: 1.05, bend: -3 }, void 0, !1), P(et + 340, { stretch: 1, bend: 0, leftHip: rt.leftHip, rightHip: rt.rightHip, leftShoulder: rt.leftShoulder, rightShoulder: rt.rightShoulder, leftElbow: rt.leftElbow, rightElbow: rt.rightElbow }, void 0, !1), b.push({ time: X, value: d - c }, { time: et, value: C - c }), v.push(
        { time: X, value: f - h },
        { time: Z, value: ht - h, easing: "ease-out-quad" },
        { time: et, value: N - h, easing: "ease-in-quad" }
      ), d = C, f = N, $.push({ kind: "dust", time: et, x: d, y: f, length: 500 }), F = et + 340, B = et;
    } else if (S.do === "point" && S.target) {
      const C = S.target, N = R(I, C.x, S.mood), W = { ...p, ...S.mood ? ut[S.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...q }, J = ge(W, { height: u, facing: g }).head.center, X = Math.abs(C.x - (d + J.x)), tt = C.y - (f + J.y), st = N + Zt;
      P(st, { ...W, rightShoulder: D(W, C.x, C.y), lookX: 1, lookY: m1(tt / Math.max(1, Math.hypot(X, tt))) * 0.8 }), F = st + (S.for ?? ki), B = st, nt = F;
    } else if (S.do === "swipe") {
      const C = S.target ?? { x: d + g * u * 0.5, y: f - u * 0.6 }, N = _(C.x), W = R(I, C.x, S.mood), J = N === 1 ? C.left ?? C.x : C.right ?? C.x, X = N === 1 ? C.right ?? C.x : C.left ?? C.x, tt = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...q };
      P(W + Xn, { ...tt, rightShoulder: D(tt, d - g * u * 0.3, f - u * 1.1) }, S.mood, !1);
      const st = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, ht = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      G(W, Y(st, J, C.y, "arm"), Xn + pi), P(W + Xn + pi, { lean: -12 }, void 0, !1);
      const dt = W + Xn + pi + 80;
      P(dt, { ...st, rightShoulder: D(st, J, C.y) }, void 0, !1);
      const lt = dt + (S.for ?? Math.max(Qm, Math.abs(X - J) / t1));
      b.push({ time: dt, value: d - c }), d = Y(ht, X, C.y, "arm"), b.push({ time: lt, value: d - c }), P(lt, { ...ht, rightShoulder: D(ht, X, C.y) }, void 0, !1), P(lt + gi, { lean: 16, bend: 14, rightShoulder: D(p, X + N * u * 0.4, C.y + u * 0.25) }, void 0, !1), P(lt + gi + _a, { lean: 0, bend: 0, rightShoulder: rt.rightShoulder, rightElbow: rt.rightElbow }), F = lt + gi + _a, B = dt, nt = lt;
    } else if (S.do === "grab" && S.target) {
      const C = S.target, N = R(I, C.x, S.mood), W = C.y > f - u * 0.5, J = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: W ? 35 : 0,
        lean: W ? 12 : 0,
        stretch: W ? 0.75 : 1,
        lookX: 1,
        lookY: W ? 0.8 : 0,
        ...q
      }, tt = G(N, Y(J, C.x, C.y, "arm"), un) + e1;
      P(tt, { ...J, rightShoulder: D(J, C.x, C.y) }, S.mood, !1), P(tt + 120, {}, void 0, !1), P(tt + Oa, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), F = tt + Oa + 150, B = tt;
    } else if (S.do === "throw") {
      const C = S.target?.x ?? S.to ?? d + g * u, N = R(I, C, S.mood), W = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...q };
      P(N + mi, { ...W, rightShoulder: D(W, d - g * u * 0.4, f - u * 1.05) }, S.mood, !1), P(N + mi + Ia, { lean: -14 }, void 0, !1);
      const J = N + mi + Ia + n1, X = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      w.push({ time: J, pose: p = { ...X, rightShoulder: D(X, d + g * u, f - u * 1.1) }, easing: "ease-in", act: !1 }), P(J + yi, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), P(J + yi + Ha, { lean: 0, bend: 0, rightShoulder: rt.rightShoulder, rightElbow: rt.rightElbow, lookY: 0 }), F = J + yi + Ha, B = J, nt = J;
    } else if (S.do === "kick" && S.target) {
      const C = S.target, N = R(I, C.x, S.mood), W = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, J = G(N, Y(W, C.x, C.y, "leg"), s1), X = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      P(J + Ca, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...X, ...q }, S.mood, !1);
      const tt = J + Ca + i1, st = D(W, C.x, C.y, "leg");
      w.push({ time: tt, pose: p = { ...p, ...W, rightHip: st }, easing: "ease-in", act: !1 }), P(tt + bi, { lean: -15, rightHip: st + 20 }, void 0, !1), P(tt + bi + Ra, {
        lean: 0,
        bend: 0,
        rightHip: rt.rightHip,
        rightKnee: 0,
        leftShoulder: rt.leftShoulder,
        rightShoulder: rt.rightShoulder,
        leftElbow: rt.leftElbow,
        rightElbow: rt.rightElbow,
        lookY: 0
      }), F = tt + bi + Ra, B = tt;
    } else if (S.do === "put" && S.target) {
      const C = S.target, N = R(I, C.x, S.mood), W = C.y > f - u * 0.5, J = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: W ? 35 : 0, lean: W ? 12 : 0, stretch: W ? 0.75 : 1, lookX: 1, lookY: W ? 0.8 : 0, ...q }, tt = G(N, Y(J, C.x, C.y, "arm"), un) + o1;
      P(tt, { ...J, rightShoulder: D(J, C.x, C.y) }, S.mood, !1), P(tt + wi, {}, void 0, !1), P(tt + wi + La, { bend: 0, lean: 0, stretch: 1, rightShoulder: rt.rightShoulder, rightElbow: rt.rightElbow, lookY: 0 }), F = tt + wi + La, B = tt;
    } else if (S.do === "write" && S.target) {
      const C = S.target, N = C.left ?? C.x, W = C.right ?? C.x, J = R(I, (N + W) / 2, S.mood), X = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...ut.thinking, lookX: 1, lookY: 0, ...q }, tt = (it) => Y(X, it, C.y, "arm") + g * u * 0.08, st = (it) => {
        const K = j({ ...X, ...U(X, it, C.y), rightWrist: 0 });
        return Math.hypot(K.x - it, K.y - C.y) < 2;
      }, ht = g === 1 ? N : W, dt = G(J, tt((N + W) / 2), un), lt = !st(N) || !st(W), Z = lt ? G(dt, tt(N), un) + Fa : dt + Fa;
      P(Z, { ...X, ...U(X, lt ? N : ht, C.y) }, S.mood, !1);
      const et = S.for ?? Math.max(a1, Math.abs(W - N) * r1);
      lt && b.push({ time: Z, value: d - c });
      for (let it = Da, K = 0; it <= et; it += Da, K++) {
        const z = N + (W - N) * Math.min(it, et) / et;
        lt && (d = tt(z), b.push({ time: Z + it, value: d - c }));
        const ot = (K % 2 === 0 ? -1 : 1) * u * 0.02;
        P(Z + it, U(X, z, C.y + ot), void 0, !1);
      }
      const V = Z + et;
      P(V, U(X, W, C.y), void 0, !1), P(V + Na, { rightShoulder: rt.rightShoulder, rightElbow: rt.rightElbow, ...ut.happy }), F = V + Na, B = Z, nt = V;
    } else if (S.do === "push" && S.target) {
      const C = S.target, N = S.to ?? C.x, W = R(I, d + (N >= C.x ? 1 : -1), S.mood), J = g === 1 ? C.left ?? C.x : C.right ?? C.x, X = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...q }, tt = Y(X, J, C.y, "arm"), st = G(W, tt + g * u * 0.06, un), ht = U(X, J, C.y), dt = { ...X, ...ht, leftShoulder: -ht.rightShoulder, leftElbow: -ht.rightElbow }, lt = st + l1;
      P(lt, dt, S.mood, !1);
      const Z = Math.abs(N - C.x), et = lt + (S.for ?? Math.max(600, Z / c1)), V = Z / zr("shove", u);
      T.push({ time: lt, value: "shove" }), x.push({ time: lt, value: 0 }, { time: lt + Qt, value: 1, easing: "ease-out" }, { time: et - Qt, value: 1 }, { time: et, value: 0, easing: "ease-in" }), M.push({ time: lt, value: m }, { time: et, value: m + V }), m += V, b.push({ time: lt, value: d - c }, { time: et, value: d + (N - C.x) - c }), d += N - C.x, P(et, {}, void 0, !1), P(et + Wa, { lean: 0, bend: 0, rightShoulder: rt.rightShoulder, leftShoulder: rt.leftShoulder, rightElbow: rt.rightElbow, leftElbow: rt.leftElbow }), F = et + Wa, B = lt, nt = et;
    } else if (Q) {
      const C = S.mood ? we(p, S.mood) : p, N = Q.steps(C, S), W = Gc(N, { at: I, from: C });
      w.push(...W), p = W[W.length - 1].pose, F = I + Math.max(Km(N), S.for ?? 0);
    } else if (ja(S.do)) {
      const C = ya(S.do, { at: I, from: S.mood ? we(p, S.mood) : p });
      w.push(...C), p = C[C.length - 1].pose, F = I + Ms(S.do), S.do === "take" && $.push({ kind: "dust", time: I + 900, x: d, y: f, length: 500 }), S.do === "land" && $.push({ kind: "dust", time: I + 120, x: d, y: f, length: 500 });
    } else if (S.do === "look" || S.do === "face") {
      const C = S.toward ?? "viewer", N = S.for ?? h1;
      if (C === "viewer") P(I + Zt, { turn: 0, lookX: 0, lookY: 0, ...q }, S.mood);
      else if (C === "ahead") P(I + Zt, { turn: S.do === "face" ? 1 : 0.6, lookX: 1, ...q }, S.mood);
      else if (C === "back") P(I + Zt, { turn: 0.2, lookX: -1, ...q }, S.mood);
      else {
        const W = _(C);
        W !== g && S.do === "face" ? (L(I, W, S.mood), P(I + Fe + 1, { lookX: 1, ...q })) : W !== g ? P(I + Zt, { turn: 0.25, lookX: -1, ...q }, S.mood) : P(I + Zt, { turn: S.do === "face" ? 1 : 0.6, lookX: 1, ...q }, S.mood);
      }
      F = I + Math.max(N, Zt);
    } else if (f1(S.do) || S.do === "stand") {
      const C = S.do === "stand" ? n.rest ?? rt : Nt[S.do], N = C.turn !== rt.turn ? C.turn : p.turn, W = S.mood ? ut[S.mood] : { lookX: p.lookX, lookY: p.lookY };
      P(I + Zt, { ...C, turn: N, ...W, ...q }), F = I + (S.for ?? ki);
    } else {
      const C = S.for ?? (S.say ? p1(S.say) : ki);
      (S.mood || S.pose) && P(I + Math.min(Zt, C / 2), q, S.mood), F = I + C;
    }
    if (S.say) {
      const C = r(S.do) || ja(S.do) || Q ? I : I + Math.min(150, (F - I) / 4), N = r(S.do) ? F : Math.max(C + 200, F - 100);
      k.push({ text: S.say, start: C, end: N }), S.do === "say" && w1(w, p, C, N);
    }
    S.onto !== void 0 && S.do !== "leap" && S.onto !== f && (v.push({ time: I, value: f - h }, { time: F, value: S.onto - h, easing: "ease-in-out" }), f = S.onto), F > w[w.length - 1].time && w.push({ time: F, pose: p }), O.push({ start: I, end: F, ...B !== void 0 ? { contact: B } : {}, ...nt !== void 0 ? { release: nt } : {} }), y = F;
  }
  const E = Im(t, b1(w), n), H = [
    { id: `${t}-x`, target: t, property: "x", keyframes: b },
    { id: `${t}-y`, target: t, property: "y", keyframes: v },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: M },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: x },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: T },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: A }
  ].filter((S) => S.keyframes.length > 1 || S.property === "x");
  return {
    tracks: [...qm(t, E, k, { energy: n.energy }), ...H],
    duration: y,
    lines: k,
    keys: w,
    beats: O,
    effects: $
  };
}
const m1 = (t) => Math.max(-1, Math.min(1, t)), y1 = 30;
function b1(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < y1 ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function w1(t, e, n, s) {
  const o = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !o.some((c) => Math.abs(c.time - l.time) < 60)), ...o), t.sort((l, c) => l.time - c.time);
}
function k1(t, e, n) {
  const s = new Kt({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), i = fc({ x: n.x, y: n.y, style: n.style, cast: n.cast }), o = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = pc(i, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[o], u = c.fingertips[o];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
function Dw(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = Qc(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(Ct), ...Object.keys(t.gaits ?? {})], i = t.gait ?? "walk";
  if (!s.includes(i)) throw new Error(`persona "${t.name}": ${pt("gait", i, s)}`);
  if (t.mood && !(t.mood in ut)) throw new Error(`persona "${t.name}": ${pt("mood", t.mood, Object.keys(ut))}`);
  const o = t.acting ?? "snappy";
  if (typeof o == "string" && !(o in Ke)) throw new Error(`persona "${t.name}": ${pt("acting style", o, Object.keys(Ke))}`);
  if (typeof t.stance == "string" && !(t.stance in Nt)) throw new Error(`persona "${t.name}": ${pt("stance", t.stance, Object.keys(Nt))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? Nt[t.stance] : xt(t.stance ?? {}), l = t.mood ? we(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (u) => fc({ x: u.x, y: u.y, pose: l, style: { ...c, ...u.facing ? { facing: u.facing } : {} }, cast: e }),
    script: (u, d, f = {}) => g1(u, d, {
      ...e,
      from: f.from,
      ground: f.ground,
      facing: f.facing,
      height: r,
      style: o,
      gait: i,
      start: l,
      rest: l,
      energy: t.energy
    }),
    check: (u) => eh(u, e),
    handPath: (u, d, f) => k1(u, d, { ...f, style: c, cast: e }),
    describe: () => ({
      name: t.name,
      summary: h,
      habits: {
        height: r,
        acting: typeof o == "string" ? o : "custom",
        gait: i,
        ...t.mood ? { mood: t.mood } : {},
        stance: typeof t.stance == "string" ? t.stance : t.stance ? "custom" : "rest"
      },
      actions: th(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const ct = ["rect", "circle", "text", "line", "path", "image", "custom"], v1 = ["rect", "circle", "line", "path"], qo = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: ct },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: ct },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: ct },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: ct },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: ct },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: ct },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: ct },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: ct },
  scale: { description: "Size, both ways", unit: "factor", types: ct },
  scaleX: { description: "Width factor", unit: "factor", types: ct },
  scaleY: { description: "Height factor", unit: "factor", types: ct },
  skewX: { description: "Slants it sideways", unit: "degrees", types: ct },
  skewY: { description: "Slants it up and down", unit: "degrees", types: ct },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: ct },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: ct },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: ct },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: ct },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: ct },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: ct },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: ct },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: ct },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: ct },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: ct },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: ct },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: ct },
  glowColor: { description: "Colour of the glow", kind: "color", types: ct },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: ct },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: ct },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: ct },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: ct },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: ct },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: v1 },
  width: { description: "Box width", unit: "px", min: 0, types: ["rect", "image"] },
  height: { description: "Box height", unit: "px", min: 0, types: ["rect", "image"] },
  borderRadius: { description: "Rounded corners", unit: "px", min: 0, types: ["rect", "image"] },
  radius: { description: "Circle radius", unit: "px", min: 0, types: ["circle"] },
  x2: { description: "Line end, x", unit: "px", types: ["line"] },
  y2: { description: "Line end, y", unit: "px", types: ["line"] },
  d: { description: "SVG path data; tween between paths to morph", kind: "string", types: ["path"] },
  text: { description: "The text shown (a text track types or scrambles it)", kind: "string", types: ["text"] },
  fontSize: { description: "Font size", unit: "px", min: 0, types: ["text"] },
  fontWeight: { description: "Font weight", unit: "100..900", min: 100, max: 900, types: ["text"] },
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: ct },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: ct }
}, eo = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, M1 = {
  rotation: "rotate",
  angle: "rotate",
  alpha: "opacity",
  fade: "opacity",
  color: "fill",
  colour: "fill",
  background: "fill",
  size: "scale",
  left: "x",
  top: "y",
  translateX: "x",
  translateY: "y",
  r: "radius",
  path: "d",
  content: "text"
};
function S1(t) {
  const e = t, n = Object.entries(qo).filter(([, i]) => i.types.includes(t.type)).map(([i, { types: o, ...r }]) => ({ name: i, ...r, ...e[i] !== void 0 && typeof e[i] != "object" ? { value: e[i] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [i, o] of Object.entries(t.props ?? {}))
    n.push({ name: i, description: s?.props?.[i]?.description ?? "", ...s?.props?.[i], value: o });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function T1(t) {
  const e = S1(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(eo).filter((n) => e.includes(eo[n]))];
}
function Nw(t, e) {
  const n = [], s = Object.keys(e);
  for (const i of t) {
    const o = (d) => n.push({ level: "error", track: i.id, message: d }), r = e[i.target];
    if (!r) {
      o(pt("target", i.target, s));
      continue;
    }
    const a = T1(r), l = r.type === "custom" && r.acceptsProp?.(i.property);
    if (!a.includes(i.property) && !l) {
      o(`${i.target}: ${pt("property", i.property, a, M1[i.property])}`);
      continue;
    }
    const c = i.keyframes ?? [];
    for (let d = 1; d < c.length; d++)
      c[d].time < c[d - 1].time && o(`${i.target}.${i.property}: keyframes out of time order (${c[d - 1].time} ms, then ${c[d].time} ms).`);
    const h = qo[eo[i.property] ?? i.property] ?? r.about?.props?.[i.property], u = h && (h.kind ?? "number") === "number";
    for (const d of c) {
      if (u && typeof d.value != "number") {
        o(`${i.target}.${i.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(d.value)} at ${d.time} ms).`);
        break;
      }
      if (u && typeof d.value == "number" && (h.min !== void 0 && d.value < h.min || h.max !== void 0 && d.value > h.max)) {
        n.push({ level: "warning", track: i.id, message: `${i.target}.${i.property}: ${d.value} at ${d.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const Xe = (t, e) => t[2] <= -e;
function no(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function Ba(t, e) {
  if (t.every((s) => Xe(s, e))) return t;
  const n = [];
  return t.forEach((s, i) => {
    const o = t[(i + t.length - 1) % t.length], r = Xe(s, e), a = Xe(o, e);
    r !== a && n.push(no(o, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function x1(t, e) {
  if (t.every((i) => Xe(i, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((i, o) => {
    const r = Xe(i, e);
    if (o > 0) {
      const a = t[o - 1], l = Xe(a, e);
      l && !r ? (s.push(no(a, i, e)), n.push(s), s = []) : !l && r && s.push(no(a, i, e));
    }
    r && s.push(i);
  }), s.length > 0 && n.push(s), n.filter((i) => i.length >= 2);
}
function qa(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const i = Math.round(s / n);
  return Array.from({ length: i + 1 }, (o, r) => t + s * r / i);
}
function E1(t, e, n) {
  const s = (i, o) => Math.max(0, Math.min(i.length - 2, i.findIndex((r, a) => a > 0 && o <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function A1(t, e) {
  const n = (s) => {
    const i = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], o = Math.hypot(...i) || 1;
    return [i[0] / o, i[1] / o, i[2] / o];
  };
  return { ...t, vertices: t.vertices.map((s) => Ht(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function Un(t, e, n, s) {
  const i = (r) => (r[e] - n) * s >= 0;
  if (t.every(i)) return t;
  const o = [];
  return t.forEach((r, a) => {
    const l = t[(a + t.length - 1) % t.length];
    if (i(r) !== i(l)) {
      const c = (n - l[e]) / (r[e] - l[e]);
      o.push([0, 1, 2].map((h) => h === e ? n : l[h] + (r[h] - l[h]) * c));
    }
    i(r) && o.push(r);
  }), o.length >= 3 ? o : [];
}
function $1(t, e, n) {
  const s = t.faces.map((r) => ({ points: r.corners.map((a) => t.vertices[a]), normal: r.normal })), i = [], o = { x: e.slice(1, -1), z: n.slice(1, -1) };
  for (let r = 0; r + 1 < e.length; r++)
    for (let a = 0; a + 1 < n.length; a++) {
      const l = [], c = /* @__PURE__ */ new Map(), h = (g) => {
        const p = g.map((y) => Math.round(y * 1e6)).join(",");
        let m = c.get(p);
        return m === void 0 && (m = l.length, l.push(g), c.set(p, m)), m;
      }, u = [], d = (g) => g === 0, f = (g, p) => g + 2 === p.length;
      for (const g of s) {
        let p = g.points;
        d(r) || (p = Un(p, 0, e[r], 1)), p.length && !f(r, e) && (p = Un(p, 0, e[r + 1], -1)), p.length && !d(a) && (p = Un(p, 2, n[a], 1)), p.length && !f(a, n) && (p = Un(p, 2, n[a + 1], -1)), p.length >= 3 && u.push({ corners: p.map(h), normal: g.normal });
      }
      u.length > 0 && i.push({ cell: [r, a], mesh: { vertices: l, faces: u, creases: t.creases, joined: t.joined, walls: o } });
    }
  return i;
}
const P1 = /* @__PURE__ */ new WeakMap(), _1 = /* @__PURE__ */ new WeakMap(), O1 = 48, sh = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function ih(t, e, n, s) {
  let i = t.get(e);
  i || t.set(e, i = /* @__PURE__ */ new Map());
  let o = i.get(n);
  return o === void 0 && (i.size >= O1 && i.clear(), i.set(n, o = s())), o;
}
function Yo(t, e) {
  const n = sh(e);
  return ih(P1, t, n, () => {
    const s = A1(t, e), i = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      i[a] = Math.min(i[a], r[a]), o[a] = Math.max(o[a], r[a]);
    return { key: n, inSpace: s, low: i, high: o };
  });
}
function I1(t, e) {
  const n = t.map((h) => ({ ...h, ...Yo(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const u of [0, 1, 2])
    s[u] = Math.min(s[u], h.low[u]), i[u] = Math.max(i[u], h.high[u]);
  const o = qa(s[0], i[0], e), r = qa(s[2], i[2], e), a = `${o.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const d = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: E1(o, r, d) }];
    }
    return ih(_1, h.inSpace, a, () => $1(h.inSpace, o, r)).map((d) => ({ part: h.part, mesh: d.mesh, cut: !0, cell: d.cell }));
  }), c = (s[1] + i[1]) / 2;
  return { pieces: l, middle: ([h, u]) => [(o[h] + o[h + 1]) / 2, c, (r[u] + r[u + 1]) / 2] };
}
const Ya = 4e-3, vi = 0.05, Ka = /* @__PURE__ */ new WeakMap();
function H1(t) {
  let e = Ka.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((i) => n.normal[0] * (i[0] - s[0]) + n.normal[1] * (i[1] - s[1]) + n.normal[2] * (i[2] - s[2]) <= 1e-6);
  }), Ka.set(t, e)), e;
}
const za = /* @__PURE__ */ new WeakMap();
function oh(t) {
  return t.filter(({ mesh: e }) => H1(e)).map(({ part: e, key: n, inSpace: s, low: i, high: o }) => {
    let r = za.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), za.set(s, r)), { part: e, key: n, planes: r, low: i, high: o };
  });
}
function C1(t, e, n, s) {
  const i = e.reduce((o, r) => [o[0] + r[0] / e.length, o[1] + r[1] / e.length, o[2] + r[2] / e.length], [0, 0, 0]);
  for (const o of s) {
    if (o.part === t || [0, 1, 2].some((a) => i[a] < o.low[a] - vi || i[a] > o.high[a] + vi)) continue;
    if (o.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((u) => a.normal[0] * u[0] + a.normal[1] * u[1] + a.normal[2] * u[2] - a.offset);
      if (c.every((u) => Math.abs(u) <= Ya)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? vi : Ya;
      return c.every((u) => u <= h);
    })) return !0;
  }
  return !1;
}
const Xa = /* @__PURE__ */ new WeakMap();
function rh(t, e, n, s, i) {
  const o = `${s}|${i.map((l) => l.key).join(";")}`;
  let r = Xa.get(e);
  r || Xa.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(o);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const u = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], d = Math.hypot(...u) || 1;
      return [u[0] / d, u[1] / d, u[2] / d];
    }, c = e.vertices.map((h) => Ht(n, h));
    a = e.faces.map((h) => C1(t, h.corners.map((u) => c[u]), l(h.normal), i)), r.set(o, a);
  }
  return a;
}
const In = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, so = Math.PI / 180;
function R1(t, e, n) {
  return {
    toView: (s) => $o(ue(s, t * 90 * so), -e * so),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const Ua = /* @__PURE__ */ new WeakMap(), Ss = (t) => ns(t), ns = (t) => {
  let e = Ua.get(t);
  return e || Ua.set(t, e = Qg(t)), e;
};
function gt(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? In[n]?.default ?? 0;
}
function En(t, e) {
  const n = Math.max(0.05, gt(t, e, "squash")), s = 1 / Math.sqrt(n), o = [1, 0, 0, 0, 0, 1, gt(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    be([0, gt(t, e, "lift"), 0]),
    Yt(Dt([1, 0, 0], -gt(t, e, "pitch"))),
    Yt(Dt([0, 0, 1], gt(t, e, "roll"))),
    o,
    Te([s, n, s]),
    Te(Array(3).fill(Math.max(0, gt(t, e, "size"))))
  ].reduce((r, a) => bt(r, a));
}
function Ko(t, e) {
  const n = En(t, e), s = /* @__PURE__ */ new Map(), i = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: gt(t, e, r), bind: l }))), o = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = bt(l ? o(l) : n, be(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, u, d] = r.rotate;
      h && (c = bt(c, Yt(Dt([1, 0, 0], h)))), u && (c = bt(c, Yt(Dt([0, 1, 0], u)))), d && (c = bt(c, Yt(Dt([0, 0, 1], d))));
    }
    for (const { value: h, bind: u } of i)
      if (!(!u.parts.includes(r.id) || h === 0)) {
        if (u.translate && (c = bt(c, be([u.translate[0] * h, u.translate[1] * h, u.translate[2] * h]))), u.rotate) {
          const d = u.rotate.pivot ?? [0, 0, 0], f = u.rotate.axis === "x" ? [1, 0, 0] : u.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, be(d), Yt(Dt(f, u.rotate.degrees * h)), be([-d[0], -d[1], -d[2]])].reduce((g, p) => bt(g, p));
        }
        u.scale && (c = bt(c, Te([1 + (u.scale[0] - 1) * h, 1 + (u.scale[1] - 1) * h, 1 + (u.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) o(r);
  return s;
}
const Mi = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), L1 = Math.cos(35 * so);
function ah(t, e, n, s, i = {}) {
  const o = t.derive ? { ...e, ...t.derive(e) } : e, r = Ko(t, o), a = n.toView([0, 0, 0]), l = (_) => (R) => [_[0] * R[0] + _[4] * R[1] + _[8] * R[2], _[1] * R[0] + _[5] * R[1] + _[9] * R[2], _[2] * R[0] + _[6] * R[1] + _[10] * R[2]], c = En(t, o), h = i.slice === void 0 ? null : mo(c), u = h ? t.parts.map((_) => ({ part: _, mesh: ns(_.shape), local: bt(h, r.get(_.id)), whole: _.shape.type === "tube" })) : void 0, d = u ? I1(u, i.slice) : void 0, f = u ? oh(u.map((_) => ({ part: _.part.id, mesh: _.mesh, ...Yo(_.mesh, _.local) }))) : void 0, g = (_, R, D, Y) => {
    const j = (K) => n.toView(Ht(D, K)), U = R.vertices.map(j), G = U.map((K) => n.toScreen(K)), E = i.perspective ? i.near : void 0, H = (K) => K.map((z) => n.toScreen(z)), S = (K) => E === void 0 ? K : Ba(K, E), I = (K) => E === void 0 ? [K] : x1(K, E), F = l(D), B = R.faces.map((K) => {
      const z = n.toView(F(K.normal)), ot = [z[0] - a[0], z[1] - a[1], z[2] - a[2]], wt = Math.hypot(...ot) || 1;
      return [ot[0] / wt, ot[1] / wt, ot[2] / wt];
    }), nt = f && Y ? rh(_.id, R, Y, sh(Y), f) : void 0, q = (K) => nt?.[K] ?? !1, Q = B.map((K, z) => {
      if (q(z)) return !1;
      if (!i.perspective) return K[2] > 1e-6;
      const wt = R.faces[z].corners.reduce((Pt, kt) => [Pt[0] + U[kt][0], Pt[1] + U[kt][1], Pt[2] + U[kt][2]], [0, 0, 0]);
      return -(K[0] * wt[0] + K[1] * wt[1] + K[2] * wt[2]) > 1e-9;
    }), C = (K) => R.faces[K].corners.reduce((z, ot) => z + U[ot][2], 0) / R.faces[K].corners.length, N = R.faces.map((K, z) => ({ face: K, i: z })).filter(({ i: K }) => Q[K]).map(({ face: K, i: z }) => ({
      i: z,
      solved: {
        points: E === void 0 ? K.corners.map((ot) => G[ot]) : H(S(K.corners.map((ot) => U[ot]))),
        depth: C(z),
        tone: 0.72 + 0.33 * Math.max(0, B[z][0] * Mi[0] + B[z][1] * Mi[1] + B[z][2] * Mi[2])
      }
    })).filter((K) => K.solved.points.length >= 3).sort((K, z) => K.solved.depth - z.solved.depth);
    if (i.light) {
      const K = l(D);
      for (const { i: z, solved: ot } of N) {
        const wt = R.faces[z].corners, Pt = wt.reduce((Ws, gh) => {
          const js = Ht(D, R.vertices[gh]);
          return [Ws[0] + js[0] / wt.length, Ws[1] + js[1] / wt.length, Ws[2] + js[2] / wt.length];
        }, [0, 0, 0]), kt = K(R.faces[z].normal), fe = Math.hypot(...kt) || 1, Go = i.light(Pt, [kt[0] / fe, kt[1] / fe, kt[2] / fe]);
        ot.light = Go.light, ot.fog = Go.fog;
      }
    }
    const W = N.map((K) => K.solved), J = F1(R), X = [], tt = [];
    for (const [K, z] of J) {
      const ot = z.filter((Pt) => Q[Pt]).length;
      if (ot === 0) continue;
      const wt = z.length === 2 && ot === 2 && R.creases !== !1 && B[z[0]][0] * B[z[1]][0] + B[z[0]][1] * B[z[1]][1] + B[z[0]][2] * B[z[1]][2] < L1;
      z.length === 1 && (R.joined || W1(R, K)) || (z.length === 1 || ot === 1 || wt) && (X.push(K.split("-").map(Number)), tt.push(z.filter((Pt) => Q[Pt]).reduce((Pt, kt) => C(kt) > C(Pt) ? kt : Pt)));
    }
    const st = (K) => R.faces.findIndex((z) => z.corners.length > 4 && Math.sign(B1(R.vertices[K], z.normal)) > 0), ht = (R.marks ?? []).filter(([K]) => st(K) < 0 || Q[st(K)]), dt = ([K, z]) => E === void 0 ? [[G[K], G[z]]] : I([U[K], U[z]]).map(H), lt = ht.flatMap(dt), Z = (K) => E === void 0 ? [K.map((z) => G[z])] : I(K.map((z) => U[z])).map(H);
    if (i.slice !== void 0) {
      const K = /* @__PURE__ */ new Map();
      X.forEach((z, ot) => K.set(tt[ot], [...K.get(tt[ot]) ?? [], z]));
      for (const { i: z, solved: ot } of N) {
        ot.edges = Ga(K.get(z) ?? []).flatMap(Z);
        const wt = R.faces[z].corners;
        ot.center = wt.reduce((kt, fe) => [kt[0] + U[fe][0] / wt.length, kt[1] + U[fe][1] / wt.length, kt[2] + U[fe][2] / wt.length], [0, 0, 0]), ot.normal = B[z];
        const Pt = N[N.length - 1].i;
        ot.marks = ht.filter(([kt]) => (st(kt) >= 0 ? st(kt) : Pt) === z).flatMap(dt);
      }
    }
    const et = _.glow ? Math.max(0, Math.min(1, gt(t, o, _.glow.control))) : 0, V = _.fade ? Math.max(0, Math.min(1, gt(t, o, _.fade.control))) : 0, it = _.fade ? Math.max(0, Math.min(1, _.fade.from + (_.fade.to - _.fade.from) * V)) : 1;
    return {
      part: _,
      depth: U.reduce((K, z) => K + z[2], 0) / Math.max(1, U.length),
      faces: W,
      edges: Ga(X).flatMap(Z),
      marks: lt,
      glow: et,
      opacity: it,
      ..._.shape.type === "tube" ? { spine: j1(I(_.shape.points.map(j)).map(H)) } : {},
      ...R.walls ? { cut: !0 } : {}
    };
  }, p = new Map(u?.map((_) => [_.part.id, _.local])), y = (d ? d.pieces.map((_) => ({
    part: _.part,
    mesh: _.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: _.cut ? c : r.get(_.part.id),
    local: _.cut ? Ps() : p.get(_.part.id),
    cell: _.cell
  })) : t.parts.map((_) => ({ part: _, mesh: ns(_.shape), m: r.get(_.id), local: void 0, cell: void 0 }))).map((_) => ({ cell: _.cell, solved: g(_.part, _.mesh, _.m, _.local) })), w = y.map((_) => _.solved), b = (_) => _.filter((R) => R.faces.length > 0 && R.opacity > 0.01).sort((R, D) => R.depth - D.depth);
  let v;
  if (d) {
    const _ = new Map(t.parts.map((D) => {
      const Y = r.get(D.id), j = ns(D.shape).vertices;
      return [D.id, j.reduce((U, G) => U + n.toView(Ht(Y, G))[2], 0) / Math.max(1, j.length)];
    })), R = /* @__PURE__ */ new Map();
    for (const D of y) {
      const Y = D.cell.join(",");
      R.has(Y) || R.set(Y, { cell: D.cell, parts: [] }), R.get(Y).parts.push(D.solved), D.solved.depth = _.get(D.solved.part.id);
    }
    v = [...R.values()].map(({ cell: D, parts: Y }) => ({ depth: n.toView(Ht(c, d.middle(D)))[2], parts: b(Y) })).filter((D) => D.parts.length > 0);
  }
  const M = {};
  for (const [_, R] of Object.entries(t.anchors ?? {})) {
    const D = R.part ? r.get(R.part) : En(t, o);
    if (!D) throw new Error(`prop rig: anchor "${_}" is on "${R.part}", which is not a part`);
    const Y = n.toView(Ht(D, R.at));
    M[_] = { point: n.toScreen(Y), depth: Y[2] };
  }
  const [x, T] = t.footprint ?? [t.length * 0.45, t.length], A = Math.max(0, gt(t, o, "lift")), k = Math.max(0, gt(t, o, "size")) / (1 + A * 0.8), O = Array.from({ length: 24 }, (_, R) => {
    const D = Math.PI * 2 * R / 24;
    return n.toView([Math.cos(D) * x * 0.55 * k, 0, Math.sin(D) * T * 0.55 * k]);
  }), $ = i.perspective ? i.near : void 0, P = {
    points: ($ === void 0 ? O : Ba(O, $)).map((_) => n.toScreen(_)),
    opacity: 0.16 * k
  }, L = w.filter((_) => _.part.seeThrough && _.opacity > 0.01).flatMap((_) => _.faces.map((R) => R.points));
  return { under: b(w.filter((_) => !_.part.overRider)), over: b(w.filter((_) => _.part.overRider)), ...v ? { cells: v } : {}, anchors: M, openings: L, shadow: P, pxPerUnit: s, sizePx: t.height * s };
}
const Va = /* @__PURE__ */ new WeakMap();
function F1(t) {
  let e = Va.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let i = 0; i < s.length; i++) {
        const o = s[i], r = s[(i + 1) % s.length], a = o < r ? `${o}-${r}` : `${r}-${o}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    Va.set(t, e);
  }
  return e;
}
function D1(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = Ko(t, n), i = mo(En(t, n)) ?? Ps(), o = (r) => Math.max(0, Math.min(1, r));
  return t.parts.map((r) => {
    const a = r.fade ? o(gt(t, n, r.fade.control)) : 0;
    return {
      part: r,
      matrix: s.get(r.id),
      local: bt(i, s.get(r.id)),
      glow: r.glow ? o(gt(t, n, r.glow.control)) : 0,
      opacity: r.fade ? o(r.fade.from + (r.fade.to - r.fade.from) * a) : 1
    };
  });
}
function N1(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = Ko(t, n), i = En(t, n), o = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : i;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    o[r] = Ht(l, a.at);
  }
  return o;
}
function W1(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((o) => t.vertices[Number(o)]), i = (o, r) => r.some((a) => Math.abs(n[o] - a) < 1e-6 && Math.abs(s[o] - a) < 1e-6);
  return i(0, t.walls.x) || i(2, t.walls.z);
}
function j1(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const B1 = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function Ga(t) {
  const e = t.map((s) => [...s]), n = [];
  for (; e.length > 0; ) {
    const s = [...e.shift()];
    let i = !0;
    for (; i; ) {
      i = !1;
      for (let o = 0; o < e.length; o++) {
        const [r, a] = e[o], l = s[s.length - 1], c = s[0];
        if (r === l) s.push(a);
        else if (a === l) s.push(r);
        else if (a === c) s.unshift(r);
        else if (r === c) s.unshift(a);
        else continue;
        e.splice(o, 1), i = !0;
        break;
      }
    }
    n.push(s);
  }
  return n;
}
const q1 = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function de(t) {
  const e = { ...q1, ...t.colors }, n = [], { forwardMost: s, backMost: i, top: o } = lh(t);
  t.body && n.push({ id: "body", shape: { type: "extrude", profile: t.body, width: t.width }, fill: e.body });
  for (const [h, u] of (t.frame ?? []).entries())
    n.push({ id: `frame-${h}`, shape: { type: "tube", points: u.points, radius: u.radius ?? 0.035, segments: 6 }, fill: u.color ?? e.body, outline: 0.7 });
  for (const [h, u] of (t.windows ?? []).entries())
    for (const d of [1, -1])
      n.push({
        id: `window-${h}-${d > 0 ? "left" : "right"}`,
        shape: { type: "panel", points: [[u.from, u.low], [u.to, u.low], [u.to, u.high], [u.from, u.high]], facing: d > 0 ? "left" : "right" },
        at: [d * (t.width / 2 + 0.01), 0, 0],
        fill: e.glass,
        outline: 0.7,
        seeThrough: !0,
        glow: t.lights ? { control: "lights", color: "#ffe9a3" } : void 0
      });
  for (const h of t.extras ?? []) n.push(h);
  if (t.cabin) {
    const h = t.cabin.width ?? t.width * 0.85;
    n.push({ id: "cabin", shape: { type: "extrude", profile: t.cabin.profile, width: h }, fill: e.glass, outline: 0.9, seeThrough: !0, layer: 1 });
    const u = Math.min(...t.cabin.profile.map(([, f]) => f)), d = Math.max(...t.cabin.profile.map(([, f]) => f));
    for (const [f, g] of (t.cabin.pillars ?? []).entries())
      n.push({ id: `pillar-${f}`, shape: { type: "box", size: [h + 0.02, d - u, 0.1] }, at: [0, (u + d) / 2, g], fill: e.body, outline: 0.8, layer: 1 });
  }
  const r = t.wheels[0]?.radius ?? 0.4, a = [];
  t.wheels.forEach((h, u) => {
    const d = h.side === 0 ? [0] : [1, -1], f = h.thickness ?? (h.style === "spoked" ? 0.05 : 0.26);
    for (const g of d) {
      const p = `wheel-${u}-${g > 0 ? "left" : g < 0 ? "right" : "middle"}`;
      if (a.push({ parts: [p], rotate: { axis: "x", degrees: r / h.radius } }), n.push({
        id: p,
        shape: { type: "cylinder", radius: h.radius, length: f, axis: "x", segments: 20, spokes: h.style === "spoked" ? 8 : 0 },
        at: [g * h.side, h.radius, h.forward],
        fill: h.style === "spoked" ? void 0 : e.tyre,
        ink: h.style === "spoked" ? e.tyre : void 0,
        outline: h.style === "spoked" ? 1.3 : 1
      }), h.style !== "spoked")
        for (const m of g === 0 ? [1, -1] : [g])
          n.push({
            id: `${p}-hub${g === 0 ? m > 0 ? "-left" : "-right" : ""}`,
            parent: p,
            shape: { type: "cylinder", radius: h.radius * 0.55, length: 0.02, axis: "x", segments: 14, spokes: 5 },
            at: [m * (f / 2 + 0.012), 0, 0],
            fill: e.hub,
            outline: 0.6
          });
    }
  });
  const l = {
    wheelSpin: {
      description: "How far the wheels have turned (keyed exactly with the distance driven, so they never skate)",
      unit: "degrees",
      bind: a
    }
  };
  if (t.door) {
    const { from: h, to: u, low: d, high: f } = t.door, g = [[h, d], [u, d], [u, f], [h, f]];
    for (const p of [1, -1]) {
      const m = p > 0 ? "left" : "right";
      n.push({
        id: `doorway-${m}`,
        shape: { type: "panel", points: g, facing: p > 0 ? "left" : "right" },
        at: [p * (t.width / 2 + 4e-3), 0, 0],
        fill: e.inside,
        outline: 0.5,
        seeThrough: !0
      });
      const y = h + (u - h) * 0.15, w = h + (u - h) * 0.55;
      n.push({
        id: `seat-back-${m}`,
        shape: { type: "panel", points: [[y, d + 0.05], [w, d + 0.05], [w - 0.08, f - 0.06], [y + 0.06, f - 0.04]], facing: p > 0 ? "left" : "right" },
        at: [p * (t.width / 2 + 6e-3), 0, 0],
        fill: e.seat,
        outline: 0.4
      }), n.push({
        id: `door-${m}`,
        shape: { type: "panel", points: g.map(([b, v]) => [b - u, v]), facing: p > 0 ? "left" : "right" },
        // The panel's origin is at its hinge (its front edge), just outside the body.
        at: [p * (t.width / 2 + 0.01), 0, u],
        fill: e.body,
        outline: 0.7,
        overRider: !0
      });
    }
    l.door = {
      description: "Doors open: 0 shut, 1 open (hinged at the front)",
      unit: "0..1",
      min: 0,
      max: 1,
      bind: [
        // Each swings outward: its back edge (behind the hinge, −z) moves away from the middle.
        { parts: ["door-left"], rotate: { axis: "y", degrees: -70 } },
        { parts: ["door-right"], rotate: { axis: "y", degrees: 70 } }
      ]
    };
  }
  if (t.lights) {
    const { across: h, low: u, high: d, front: f, back: g } = t.lights, p = (t.lights.size ?? 0.32) / 2, m = [[-p, u], [p, u], [p, d], [-p, d]];
    for (const y of [1, -1])
      n.push({ id: `headlight-${y}`, shape: { type: "panel", points: m, facing: "front" }, at: [y * h, 0, f], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${y}`, shape: { type: "panel", points: m, facing: "back" }, at: [y * h, 0, g], fill: Wo(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
    l.lights = { description: "Lights on: 0 off, 1 on", unit: "0..1", min: 0, max: 1 };
  }
  t.antenna && (n.push({ id: "antenna", shape: { type: "tube", points: [[0, 0, 0], [0, 0.75, 0]], radius: 0.018, segments: 5 }, at: t.antenna, fill: e.trim, outline: 0.6 }), n.push({ id: "antenna-tip", parent: "antenna", shape: { type: "ellipsoid", radii: [0.05, 0.05, 0.05], segments: 8 }, at: [0, 0.77, 0], fill: e.tail, outline: 0.6 }), l.antenna = {
    description: "Antenna bend (follow-through: it trails the motion on a spring)",
    unit: "degrees",
    bind: [{ parts: ["antenna"], rotate: { axis: "x", degrees: 1 } }]
  });
  const c = {
    parts: n,
    controls: l,
    length: s - i,
    height: o,
    footprint: [t.width, s - i],
    anchors: {
      ...t.seat ? { seat: { at: t.seat } } : {},
      front: { at: [0, o * 0.45, s] },
      back: { at: [0, o * 0.45, i] },
      roof: { at: [0, o, 0] },
      // The door on its right side: the side seen when it faces screen-right.
      ...t.door ? { door: { at: [-t.width / 2, (t.door.low + t.door.high) / 2, (t.door.from + t.door.to) / 2] } } : {},
      ...t.anchors
    }
  };
  return {
    kind: t.kind ?? "vehicle",
    family: "vehicle",
    summary: t.summary ?? "A wheeled vehicle",
    rig: c,
    actions: K1(t),
    acting: Y1,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function lh(t) {
  const e = [
    ...(t.body ?? []).map(([s]) => s),
    ...(t.frame ?? []).flatMap((s) => s.points.map((i) => i[2])),
    ...t.wheels.flatMap((s) => [s.forward + s.radius, s.forward - s.radius])
  ], n = [
    ...(t.body ?? []).map(([, s]) => s),
    ...(t.cabin?.profile ?? []).map(([, s]) => s),
    ...(t.frame ?? []).flatMap((s) => s.points.map((i) => i[1])),
    ...t.wheels.map((s) => s.radius * 2)
  ];
  return { forwardMost: Math.max(...e), backMost: Math.min(...e), top: Math.max(...n) };
}
const Y1 = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Vn(t, e, n, s, i, o, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: i }), t.set("wheelSpin", n, r ? l : l + c / o * (180 / Math.PI), i);
}
const Ja = 0.4;
function K1(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = lh(t), i = (n - s) / 2, o = (a, l, c) => {
    const h = a.exaggeration;
    let u = l;
    return a.facing() !== c && (u = a.turnTo(u, c > 0 ? "right" : "left")), a.key(u + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), Vn(a, u, u + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: u + 150, x: a.x - c * i * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), u + 260;
  }, r = (a, l, c) => {
    const h = a.exaggeration * (c ? 1.8 : 1);
    a.key(l, { pitch: -5 * h, lean: -0.08 * h, squash: 0.95 }, { act: !1, easing: "ease-out" }), a.key(l + 380, { pitch: 0, lean: 0, squash: 1 });
  };
  return {
    drive: {
      summary: "Drives to `to`: rocks back and squats, lunges forward stretched, and stops with a nose-dive that settles; wheels roll exactly the distance.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = o(a, c, h), d = a.exaggeration, f = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, f / (l.speed ?? Ja));
        return a.effect({ kind: "dust", time: u, x: a.x - h * i * a.scale, y: a.floor, length: 600, direction: -h }), a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.05 * d, lean: 0.12 * d }, { act: !1, easing: "ease-out" }), a.key(u + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * d, squash: 1.02 }, { act: !1 }), Vn(a, u, u + g, l.to, "ease-in-out", e), r(a, u + g, !1), { end: u + g + 380, contact: u, release: u + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = o(a, c, h), d = a.exaggeration, f = a.x, g = Math.abs(l.to - f), p = l.for ?? Math.max(600, g / (l.speed ?? Ja * 1.2)), m = u + p * 0.55, y = f + (l.to - f) * 0.65;
        return a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.06 * d, lean: 0.14 * d }, { act: !1, easing: "ease-out" }), Vn(a, u, m, y, "ease-in", e), a.key(m + 80, { pitch: -7 * d, lean: -0.12 * d, squash: 0.94 }, { act: !1, easing: "ease-out" }), Vn(a, m, u + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: y, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: u + p, x: l.to + h * i * a.scale, y: a.floor, length: 600, direction: h }), r(a, u + p, !0), { end: u + p + 380, contact: m, release: u + p };
      }
    },
    bump: {
      summary: "Hits a bump: squashes, hops up stretched, lands squashed with dust, and springs back.",
      uses: ["for"],
      run(a, l, c) {
        const h = a.exaggeration;
        return a.key(c + 90, { squash: 1 - 0.16 * h, pitch: 3 * h }, { act: !1, easing: "ease-out" }), a.key(c + 300, { lift: 0.35 * h, squash: 1 + 0.12 * h, pitch: -3 * h }, { act: !1, easing: "ease-out" }), a.key(c + 540, { lift: 0, squash: 1 - 0.2 * h, pitch: 0 }, { act: !1, easing: "ease-in" }), a.key(c + 820, { squash: 1 }), a.effect({ kind: "dust", time: c + 540, x: a.x, y: a.floor, length: 500 }), { end: c + 820, contact: c + 540 };
      }
    },
    honk: {
      summary: "Honks: a stretch and squash pulse, with honk lines from the front.",
      run(a, l, c) {
        const h = a.exaggeration;
        a.key(c + 110, { squash: 1 + 0.12 * h, lean: 0.04 * h }, { act: !1, easing: "ease-out" }), a.key(c + 240, { squash: 1 - 0.06 * h, lean: 0 }, { act: !1 }), a.key(c + 520, { squash: 1 });
        const u = a.facing();
        return a.effect({ kind: "honk", time: c + 60, x: a.x + (u || 1) * i * a.scale, y: a.floor - 0.7 * a.scale, length: 700, direction: u || 1 }), { end: c + 520, contact: c + 60 };
      }
    },
    ...t.door ? {
      door: {
        summary: "Opens the doors (`open: true`) or shuts them (`open: false`).",
        needs: ["open"],
        run(a, l, c) {
          return a.key(c + 450, { door: l.open ? 1 : 0 }), { end: c + 600, contact: c + 450 };
        }
      }
    } : {},
    ...t.lights ? {
      lights: {
        summary: "Switches the lights on (`on: true`) or off.",
        needs: ["on"],
        run(a, l, c) {
          return a.key(c + 120, { lights: l.on ? 1 : 0 }, { act: !1 }), { end: c + 300, contact: c + 120 };
        }
      }
    } : {}
  };
}
function z1(t = {}) {
  return de({
    kind: "car",
    summary: "A cartoon car: drives, brakes, bumps, honks, opens its doors, lights up, and turns toward the camera.",
    body: [[-2, 0.32], [2, 0.32], [2.08, 0.52], [1.98, 0.82], [1.05, 0.95], [-1.72, 0.98], [-2.02, 0.86], [-2.08, 0.5]],
    width: 1.8,
    cabin: { profile: [[-1.5, 0.94], [0.92, 0.94], [0.3, 1.52], [-1.22, 1.54]], width: 1.56, pillars: [-0.42] },
    wheels: [
      { forward: 1.28, side: 0.8, radius: 0.4 },
      { forward: -1.28, side: 0.8, radius: 0.4 }
    ],
    door: { from: -0.4, to: 0.88, low: 0.36, high: 0.92 },
    lights: { across: 0.58, low: 0.55, high: 0.72, front: 2.05, back: -2.06 },
    antenna: t.antenna === !1 ? void 0 : [0.5, 1.5, -1.05],
    seat: [0, 0.3, -0.15],
    colors: t.colors
  });
}
function X1(t = {}) {
  return de({
    kind: "truck",
    summary: "A box truck: drives, brakes, bumps, honks, opens its cab doors, lights up, turns toward the camera.",
    body: [[-3.2, 0.5], [3.1, 0.5], [3.15, 0.95], [3, 1.85], [2.3, 2.25], [1.2, 2.25], [1.2, 1], [-3.2, 1]],
    width: 2,
    cabin: { profile: [[1.6, 1.35], [2.95, 1.35], [2.85, 1.85], [2.3, 2.15], [1.6, 2.15]], width: 2.04 },
    extras: [{ id: "cargo", shape: { type: "box", size: [2.1, 1.75, 4.2] }, at: [0, 1.9, -1.05], fill: t.cargo ?? "#f1f1ee" }],
    wheels: [
      { forward: 2.2, side: 0.85, radius: 0.48, thickness: 0.32 },
      { forward: -1.4, side: 0.85, radius: 0.48, thickness: 0.32 },
      { forward: -2.45, side: 0.85, radius: 0.48, thickness: 0.32 }
    ],
    door: { from: 1.4, to: 2.25, low: 0.6, high: 1.9 },
    lights: { across: 0.7, low: 0.62, high: 0.82, front: 3.13, back: -3.22, size: 0.28 },
    seat: [0, 1.15, 1.9],
    colors: { body: "#2f6fb7", ...t.colors }
  });
}
function U1(t = {}) {
  return de({
    kind: "bus",
    summary: "A bus: drives, brakes, bumps, honks, opens its front doors, lights its windows, turns toward the camera.",
    body: [[-4.5, 0.45], [4.5, 0.45], [4.6, 0.9], [4.55, 2.9], [4.3, 3], [-4.4, 3], [-4.55, 2.75], [-4.55, 0.6]],
    width: 2.4,
    windows: Array.from({ length: 6 }, (e, n) => ({ from: -4 + n * 1.18, to: -4 + n * 1.18 + 1, low: 1.55, high: 2.6 })),
    extras: [{ id: "windscreen", shape: { type: "panel", points: [[-1.05, 1.35], [1.05, 1.35], [1.05, 2.75], [-1.05, 2.75]], facing: "front" }, at: [0, 0, 4.58], fill: "#bfe3f2", outline: 0.8, seeThrough: !0 }],
    wheels: [
      { forward: 3, side: 1, radius: 0.5, thickness: 0.34 },
      { forward: -2.8, side: 1, radius: 0.5, thickness: 0.34 }
    ],
    door: { from: 3.2, to: 4.2, low: 0.5, high: 2.6 },
    lights: { across: 0.85, low: 0.65, high: 0.85, front: 4.6, back: -4.56, size: 0.3 },
    seat: [0, 1.2, 3.6],
    colors: { body: "#f2c230", ...t.colors }
  });
}
function V1(t = {}) {
  return de({
    kind: "tractor",
    summary: "A tractor: big rear wheels and small front ones turning at their own rates; drives, brakes, bumps, honks.",
    body: [[-0.5, 0.75], [2, 0.75], [2.12, 1.25], [1.9, 1.52], [-0.5, 1.52]],
    width: 1,
    cabin: { profile: [[-1.35, 1], [-0.25, 1], [-0.25, 2.55], [-1.35, 2.55]], width: 1.35 },
    extras: [
      { id: "roof", shape: { type: "box", size: [1.55, 0.1, 1.35] }, at: [0, 2.62, -0.8], fill: "#3f9b47" },
      { id: "exhaust", shape: { type: "tube", points: [[0.28, 1.5, 1.25], [0.28, 2.35, 1.25]], radius: 0.06, segments: 6 }, fill: "#3b3b44", outline: 0.7 }
    ],
    wheels: [
      { forward: -0.85, side: 0.85, radius: 0.78, thickness: 0.45 },
      { forward: 1.55, side: 0.7, radius: 0.42, thickness: 0.26 }
    ],
    lights: { across: 0.3, low: 1, high: 1.18, front: 2.1, back: -0.52, size: 0.2 },
    seat: [0, 1.25, -0.8],
    colors: { body: "#3f9b47", hub: "#e9c64a", ...t.colors }
  });
}
function G1(t = {}) {
  const e = t.colors?.body ?? "#a8743f";
  return de({
    kind: "cart",
    summary: "A wooden cart on spoked wheels with shafts: rolls when pulled (drive), bumps, tips.",
    body: [[-1.25, 0.78], [1.25, 0.78], [1.35, 1.18], [-1.35, 1.18]],
    width: 1.4,
    frame: [
      { points: [[0.5, 0.9, 1], [0.5, 0.95, 2.7]], radius: 0.05, color: e },
      { points: [[-0.5, 0.9, 1], [-0.5, 0.95, 2.7]], radius: 0.05, color: e }
    ],
    wheels: [{ forward: 0, side: 0.82, radius: 0.66, style: "spoked" }],
    seat: [0, 1.2, 0],
    anchors: { shafts: { at: [0, 0.95, 2.7] } },
    colors: { body: e, tyre: "#5a3a1f", ...t.colors }
  });
}
function J1(t = {}) {
  return de({
    kind: "train carriage",
    summary: "A railway carriage: rolls along (drive), brakes, lights its windows, turns toward the camera.",
    body: [[-4, 0.72], [4, 0.72], [4, 2.8], [3.6, 3.12], [-3.6, 3.12], [-4, 2.8]],
    width: 2.6,
    windows: Array.from({ length: 5 }, (e, n) => ({ from: -3.3 + n * 1.4, to: -3.3 + n * 1.4 + 1, low: 1.7, high: 2.5 })),
    wheels: [
      { forward: 3, side: 1, radius: 0.36, thickness: 0.16 },
      { forward: 2.2, side: 1, radius: 0.36, thickness: 0.16 },
      { forward: -2.2, side: 1, radius: 0.36, thickness: 0.16 },
      { forward: -3, side: 1, radius: 0.36, thickness: 0.16 }
    ],
    lights: { across: 0.9, low: 1, high: 1.2, front: 4.01, back: -4.01, size: 0.22 },
    seat: [0, 1, 1.5],
    colors: { body: "#2f7d6d", ...t.colors }
  });
}
function Z1(t = {}) {
  const e = t.colors?.body ?? "#e0473b", n = [0, 0.32, -0.05], s = [0, 0.86, -0.22], i = [0, 0.9, 0.42], o = [0, 0.34, 0.56], r = [0, 0.34, -0.56];
  return de({
    kind: "bike",
    summary: "A bicycle: rides (drive) with its wire wheels turning, brakes, bumps, rings its bell (honk).",
    width: 0.5,
    frame: [
      { points: [r, n] },
      { points: [n, s] },
      { points: [s, r] },
      { points: [s, i] },
      { points: [n, i] },
      { points: [i, o] },
      { points: [[0.24, 0.98, 0.44], [-0.24, 0.98, 0.44]], radius: 0.025, color: "#3b3b44" },
      { points: [i, [0, 0.98, 0.44]], radius: 0.025, color: "#3b3b44" }
    ],
    extras: [{ id: "saddle", shape: { type: "ellipsoid", radii: [0.08, 0.035, 0.15], segments: 10 }, at: [0, 0.89, -0.22], fill: "#3b3b44", outline: 0.7 }],
    wheels: [
      { forward: 0.56, side: 0, radius: 0.34, style: "spoked" },
      { forward: -0.56, side: 0, radius: 0.34, style: "spoked" }
    ],
    seat: [0, 0.9, -0.22],
    colors: { body: e, tyre: "#2c2c33", ...t.colors }
  });
}
function Q1(t = {}) {
  return de({
    kind: "motorbike",
    summary: "A motorbike: rides (drive) with a lunge, brakes into a skid, bumps, honks, lights up.",
    body: [[-0.62, 0.62], [0.42, 0.62], [0.55, 0.95], [0.3, 1.02], [-0.1, 0.92], [-0.8, 0.88], [-0.86, 0.72]],
    width: 0.4,
    frame: [
      { points: [[0, 0.33, 0.78], [0, 1.05, 0.5]], radius: 0.04, color: "#8c8f98" },
      { points: [[0.3, 1.08, 0.48], [-0.3, 1.08, 0.48]], radius: 0.025, color: "#3b3b44" },
      { points: [[0.12, 0.42, -0.2], [0.12, 0.5, -0.95]], radius: 0.04, color: "#8c8f98" }
    ],
    extras: [{ id: "engine", shape: { type: "box", size: [0.38, 0.34, 0.5] }, at: [0, 0.45, 0.05], fill: "#5b5f6a", outline: 0.8 }],
    wheels: [
      { forward: 0.78, side: 0, radius: 0.33, thickness: 0.14 },
      { forward: -0.72, side: 0, radius: 0.33, thickness: 0.14 }
    ],
    lights: { across: 0, low: 0.9, high: 1.04, front: 0.62, back: -0.87, size: 0.14 },
    seat: [0, 0.92, -0.3],
    colors: { body: "#1f1f26", hub: "#c9ccd3", ...t.colors }
  });
}
function ty(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, i = t.canopy?.shape === "tall", o = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = On(t.canopy?.seed ?? 7), a = [
    { id: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.06, e * 0.5, 0], [-0.02, e, 0]], radius: n, segments: 8 }, fill: o.trunk },
    { id: "branch", parent: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.45, 0.4, 0.1]], radius: n * 0.45, segments: 6 }, at: [0.04, e * 0.62, 0], fill: o.trunk },
    { id: "canopy", parent: "trunk", shape: { type: "ellipsoid", radii: [s, s * (i ? 1.35 : 0.88), s], segments: 14 }, at: [-0.02, e + s * 0.55, 0], fill: o.leaves }
  ], l = t.canopy?.lobes ?? 7;
  for (let h = 0; h < l; h++) {
    const u = Math.PI * 2 * h / l + r.next() * 0.6, d = (r.next() - 0.25) * s * (i ? 1.1 : 0.7), f = s * (0.48 + r.next() * 0.22), g = [Math.cos(u) * s * 0.78, d, Math.sin(u) * s * 0.6];
    a.push({ id: `lobe-${h}`, parent: "canopy", shape: { type: "ellipsoid", radii: [f, f * 0.86, f], segments: 12 }, at: g, fill: o.leaves });
  }
  const c = {
    parts: a,
    controls: {
      sway: { description: "The whole tree bending in the wind, about its base", unit: "degrees", bind: [{ parts: ["trunk"], rotate: { axis: "z", degrees: 1 } }] },
      canopySway: { description: "The canopy bending further than the trunk (it trails the sway)", unit: "degrees", bind: [{ parts: ["canopy"], rotate: { axis: "z", degrees: 1, pivot: [0, -s * 0.8, 0] } }] }
    },
    length: s * 2.2,
    height: e + s * 2,
    footprint: [s * 1.6, s * 1.6],
    anchors: {
      canopy: { part: "canopy", at: [0, 0, 0] },
      top: { part: "canopy", at: [0, s * 0.9, 0] },
      base: { at: [0, 0, 0] },
      branch: { part: "branch", at: [0.45, 0.4, 0.1] }
    }
  };
  return {
    kind: t.kind ?? "tree",
    family: "plant",
    summary: t.summary ?? "A tree: sways in the wind with its canopy trailing, shakes, sheds leaves, pops up.",
    rig: c,
    actions: ny(),
    acting: ey,
    colors: { body: o.leaves }
  };
}
const ey = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function ny() {
  const t = (e, n, s, i) => {
    const o = e.anchor("canopy");
    e.effect({ kind: "leaves", time: n, x: o.x, y: o.y, length: s, direction: i, toY: e.floor });
  };
  return {
    sway: {
      summary: "Sways in gusts of `wind` (0..1, default 0.5) for `for` ms (default 3000); the canopy trails the trunk, and a strong wind sheds leaves.",
      uses: ["wind", "for"],
      run(e, n, s) {
        const i = n.wind ?? 0.5, o = n.for ?? 3e3, r = e.exaggeration, a = 260;
        let l = 0;
        for (let c = a; c < o; c += a) {
          const h = 0.55 + 0.45 * Math.sin(c / o * Math.PI * 2.3), u = Math.sin(c / 170) * 0.35, d = -i * 9 * r * (h + u * i);
          e.key(s + c, { sway: d, canopySway: l * 1.3 }, { act: !1, easing: "ease-in-out" }), l = d;
        }
        if (e.key(s + o, { sway: 0, canopySway: 0 }), i > 0.45) for (let c = 0; c < o; c += 700) t(e, s + c, 2200, 1);
        return { end: s + o };
      }
    },
    shake: {
      summary: "Shakes (something hit it): a quick wobble that dies away, shedding leaves.",
      uses: ["for"],
      run(e, n, s) {
        const i = n.for ?? 900, o = e.exaggeration, r = 6;
        for (let a = 1; a <= r; a++) {
          const l = 1 - a / (r + 1), c = a % 2 === 0 ? 1 : -1;
          e.key(s + i * a / (r + 1), { sway: c * 5 * o * l, canopySway: -c * 6 * o * l }, { act: !1, easing: "ease-in-out" });
        }
        return e.key(s + i, { sway: 0, canopySway: 0 }), t(e, s + 60, 1800, 1), t(e, s + 260, 1800, -1), { end: s + i, contact: s };
      }
    },
    shedLeaves: {
      summary: "Leaves fall from the canopy for `for` ms (default 2000).",
      uses: ["for"],
      run(e, n, s) {
        const i = n.for ?? 2e3;
        for (let o = 0; o < i; o += 500) t(e, s + o, 2e3, o % 1e3 === 0 ? 1 : -1);
        return { end: s + i };
      }
    }
  };
}
function sy(t = {}) {
  const e = t.width ?? 4, n = t.depth ?? 3.2, s = t.wallHeight ?? 2.5, i = t.roofHeight ?? 1.5, o = t.overhang ?? 0.25, r = { walls: "#f1d9a8", roof: "#b8433a", door: "#7a4b2a", doorway: "#3a2a22", glass: "#bfe3f2", lit: "#ffd66b", chimney: "#9b5a45", ...t.colors }, a = n / 2 + 0.01, l = t.door?.width ?? 0.9, c = t.door?.height ?? 1.9, h = t.door?.at ?? 0, u = t.windows ?? [
    { at: -1.25, low: 1, width: 0.8, height: 0.8 },
    { at: 1.25, low: 1, width: 0.8, height: 0.8 }
  ], d = [
    { id: "walls", shape: { type: "box", size: [e, s, n] }, at: [0, s / 2, 0], fill: r.walls },
    {
      id: "roof",
      shape: { type: "extrude", profile: [[-n / 2 - o, s], [n / 2 + o, s], [0, s + i]], width: e + o * 2 },
      fill: r.roof,
      // It sits down on the walls: in a 3D scene it is drawn over their tops, and the chimney sorts with it.
      layer: 1
    },
    // The doorway behind the door shows when it opens.
    { id: "doorway", shape: { type: "panel", points: [[0, 0], [l, 0], [l, c], [0, c]], facing: "front" }, at: [h - l / 2, 0, a - 5e-3], fill: r.doorway, outline: 0.6, seeThrough: !0 },
    // The door, hinged on its left edge (the panel's origin); drawn over a rider, so a figure in the doorway shows only when it opens.
    { id: "door", shape: { type: "panel", points: [[0, 0], [l, 0], [l, c], [0, c]], facing: "front" }, at: [h - l / 2, 0, a + 5e-3], fill: r.door, outline: 0.8, overRider: !0 }
  ];
  u.forEach((p, m) => {
    d.push({
      id: `window-${m}`,
      shape: { type: "panel", points: [[-p.width / 2, p.low], [p.width / 2, p.low], [p.width / 2, p.low + p.height], [-p.width / 2, p.low + p.height]], facing: "front" },
      // A centimetre out from the wall, as the side windows are: never in its very plane (a depth buffer can't
      // tell which is in front).
      at: [p.at, 0, a + 0.01],
      fill: r.glass,
      outline: 0.8,
      glow: { control: "lights", color: r.lit }
    });
  });
  for (const p of [1, -1])
    d.push({
      id: `side-window-${p > 0 ? "left" : "right"}`,
      shape: { type: "panel", points: [[-0.4, 1], [0.4, 1], [0.4, 1.8], [-0.4, 1.8]], facing: p > 0 ? "left" : "right" },
      at: [p * (e / 2 + 0.01), 0, 0],
      fill: r.glass,
      outline: 0.8,
      glow: { control: "lights", color: r.lit }
    });
  const f = t.chimney === !1 ? void 0 : { at: t.chimney?.at ?? e * 0.28, back: t.chimney?.back ?? -n * 0.18 };
  if (f) {
    const p = s + i * (1 - Math.abs(f.back) / (n / 2 + o)), m = s + i + 0.45;
    d.push({ id: "chimney", shape: { type: "box", size: [0.42, m - p + 0.3, 0.42] }, at: [f.at, (m + p - 0.3) / 2, f.back], fill: r.chimney, layer: 1 });
  }
  const g = {
    parts: d,
    controls: {
      door: { description: "The front door open: 0 shut, 1 open", unit: "0..1", min: 0, max: 1, bind: [{ parts: ["door"], rotate: { axis: "y", degrees: -80 } }] },
      lights: { description: "The windows lit: 0 dark, 1 lit", unit: "0..1", min: 0, max: 1 }
    },
    length: n + o * 2,
    height: s + i + 0.6,
    footprint: [e + 0.6, n + 0.6],
    anchors: {
      door: { at: [h, c / 2, a] },
      doorstep: { at: [h, 0, a + 0.4] },
      ridge: { at: [0, s + i, 0] },
      ...f ? { chimney: { at: [f.at, s + i + 0.5, f.back] } } : {}
    }
  };
  return {
    kind: t.kind ?? "house",
    family: "building",
    summary: t.summary ?? "A house: opens its door, lights its windows, puffs chimney smoke, shakes, pops up.",
    rig: g,
    actions: oy(!!f),
    acting: iy,
    colors: { body: r.walls }
  };
}
const iy = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function oy(t) {
  return {
    door: {
      summary: "Opens the front door (`open: true`) or shuts it (`open: false`).",
      needs: ["open"],
      run(e, n, s) {
        return e.key(s + 500, { door: n.open ? 1 : 0 }), { end: s + 650, contact: s + 500 };
      }
    },
    lights: {
      summary: "Lights the windows (`on: true`) or puts them out.",
      needs: ["on"],
      run(e, n, s) {
        return e.key(s + 150, { lights: n.on ? 1 : 0 }, { act: !1 }), { end: s + 300, contact: s + 150 };
      }
    },
    shake: {
      summary: "Shakes, as when a door slams or something lands on it: a squash and a wobble that dies away, with dust.",
      uses: ["for"],
      run(e, n, s) {
        const i = n.for ?? 700, o = e.exaggeration;
        e.key(s + 80, { squash: 1 - 0.06 * o }, { act: !1, easing: "ease-out" });
        for (let r = 1; r <= 5; r++) {
          const a = 1 - r / 6;
          e.key(s + 80 + i * r / 6, { roll: (r % 2 === 0 ? 1 : -1) * 2.2 * o * a, squash: 1 + 0.02 * a }, { act: !1, easing: "ease-in-out" });
        }
        return e.key(s + i + 80, { roll: 0, squash: 1 }), e.effect({ kind: "dust", time: s + 80, x: e.x, y: e.floor, length: 600 }), { end: s + i + 80, contact: s + 80 };
      }
    },
    ...t ? {
      smoke: {
        summary: "Starts smoke puffing from the chimney for `for` ms (default 3000), drifting with the wind; the next beat starts at once (the smoke carries on).",
        uses: ["for", "wind"],
        run(e, n, s) {
          const i = n.for ?? 3e3, o = e.anchor("chimney");
          return e.effect({ kind: "smoke", time: s, x: o.x, y: o.y, length: i + 1500, direction: (n.wind ?? 0.4) >= 0 ? 1 : -1 }), { end: s + 50, release: s + i };
        }
      }
    } : {}
  };
}
function ry(t = {}) {
  const e = { body: "#3f86c8", glass: "#cfeaf5", trim: "#2c2c33", rotor: "#3b3b44", ...t.colors }, n = 2.15, i = {
    parts: [
      {
        id: "cabin",
        shape: { type: "extrude", profile: [[-1.2, 0.6], [0.9, 0.55], [1.6, 0.85], [1.65, 1.25], [1.2, 1.75], [-0.6, 1.85], [-1.3, 1.45]], width: 1.5 },
        fill: e.body
      },
      {
        id: "window",
        shape: { type: "extrude", profile: [[0.75, 1], [1.6, 0.95], [1.6, 1.3], [1.15, 1.72], [0.6, 1.72]], width: 1.54 },
        fill: e.glass,
        outline: 0.8
      },
      { id: "boom", shape: { type: "tube", points: [[0, 1.4, -1.2], [0, 1.55, -3.4]], radius: 0.16, segments: 8 }, fill: e.body },
      { id: "fin", shape: { type: "extrude", profile: [[-3.55, 1.45], [-3.2, 1.5], [-3.35, 2.25], [-3.6, 2.25]], width: 0.12 }, fill: e.body },
      { id: "mast", shape: { type: "tube", points: [[0, 1.82, 0.1], [0, n, 0.1]], radius: 0.07, segments: 6 }, fill: e.trim },
      // The main rotor: a disc that is all but invisible until it spins up, and its two blades.
      { id: "rotor-disc", shape: { type: "cylinder", radius: 2.4, length: 0.01, axis: "y", segments: 28 }, at: [0, n + 0.02, 0.1], fill: "#c9d4dd", outline: 0.4, fade: { control: "blur", from: 0, to: 0.45 } },
      { id: "blades", shape: { type: "box", size: [0.16, 0.03, 4.8] }, at: [0, n + 0.05, 0.1], fill: e.rotor, outline: 0.7, fade: { control: "blur", from: 1, to: 0.3 } },
      { id: "tail-rotor", shape: { type: "box", size: [0.04, 0.9, 0.12] }, at: [0.12, 1.85, -3.45], fill: e.rotor, outline: 0.6 },
      { id: "skid-left", shape: { type: "tube", points: [[0, 0.08, -1.1], [0, 0.08, 1.2], [0, 0.22, 1.45]], radius: 0.05, segments: 6 }, at: [0.7, 0, 0], fill: e.trim },
      { id: "skid-right", shape: { type: "tube", points: [[0, 0.08, -1.1], [0, 0.08, 1.2], [0, 0.22, 1.45]], radius: 0.05, segments: 6 }, at: [-0.7, 0, 0], fill: e.trim },
      { id: "strut-left", shape: { type: "tube", points: [[0.7, 0.08, 0.6], [0.55, 0.62, 0.5]], radius: 0.04, segments: 5 }, fill: e.trim },
      { id: "strut-right", shape: { type: "tube", points: [[-0.7, 0.08, 0.6], [-0.55, 0.62, 0.5]], radius: 0.04, segments: 5 }, fill: e.trim }
    ],
    controls: {
      rotor: {
        description: "How far the rotors have turned (keyed exactly, not acted; the blades blur into a disc when they spin fast)",
        unit: "degrees",
        bind: [
          { parts: ["blades"], rotate: { axis: "y", degrees: 1 } },
          { parts: ["tail-rotor"], rotate: { axis: "x", degrees: 3, pivot: [0, 0, 0] } }
        ]
      },
      blur: { description: "How blurred the main rotor is: 0 still blades, 1 a spinning disc", unit: "0..1", min: 0, max: 1 }
    },
    length: 5.2,
    height: 2.4,
    footprint: [1.8, 3.4],
    anchors: {
      seat: { at: [0, 0.75, 0.7] },
      door: { at: [-0.76, 1, 0.2] },
      rotor: { at: [0, n, 0.1] },
      skids: { at: [0, 0, 0.2] },
      hook: { at: [0, 0.4, 0] }
    }
  };
  return {
    kind: t.kind ?? "helicopter",
    family: "aircraft",
    summary: t.summary ?? "A cartoon helicopter: spools up and takes off, flies nose-down banking into its moves, hovers with a bob, and lands with a squash.",
    rig: i,
    actions: ay(),
    acting: ch,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: re * 1e3 } } }
  };
}
const ch = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, re = 2.6;
function ay() {
  const t = (n, s, i, o, r) => {
    const a = n.values.rotor ?? 0;
    n.set("rotor", s, a);
    const l = r ? o * (i - s) * 0.5 : o * (i - s);
    n.set("rotor", i, a + l, r);
  }, e = (n) => n.values.lift > 0.05;
  return {
    takeOff: {
      summary: "Spools the rotor up (the skids squash as it bites), then lifts off nose-down to `height` metres (default 3).",
      uses: ["height"],
      run(n, s, i) {
        const o = n.exaggeration, r = s.height ?? 3;
        t(n, i, i + 900, re, "ease-in"), n.key(i + 900, { blur: 1 }, { act: !1, easing: "ease-in" }), n.key(i + 700, { squash: 1 - 0.08 * o }, { act: !1, easing: "ease-in" });
        const a = i + 1e3;
        return n.key(a + 150, { squash: 1 + 0.06 * o, lift: 0.3 }, { act: !1, easing: "ease-out" }), n.key(a + 1300, { squash: 1, lift: r, pitch: -4 * o }, { act: !1, easing: "ease-in-out" }), n.key(a + 1700, { pitch: 0 }), t(n, i + 900, a + 1700, re), n.effect({ kind: "dust", time: a, x: n.x, y: n.floor, length: 900 }), { end: a + 1700, contact: a };
      }
    },
    fly: {
      summary: "Flies to `to` (and to `height`, if given): nose down and banked into the move, nose up and leveling as it stops.",
      needs: ["to"],
      uses: ["height", "speed", "for"],
      run(n, s, i) {
        const o = n.exaggeration, r = Math.sign(s.to - n.x);
        let a = i;
        r !== 0 && n.facing() !== r && (a = n.turnTo(a, r > 0 ? "right" : "left"));
        const l = Math.abs(s.to - n.x), c = s.for ?? Math.max(700, l / (s.speed ?? 0.3)), h = s.height ?? n.values.lift;
        return n.key(a + 300, { pitch: -9 * o, roll: 6 * o }, { act: !1, easing: "ease-out" }), n.key(a + c - 250, { pitch: -4 * o, roll: 3 * o, lift: h }, { act: !1 }), n.key(a + c, { pitch: 7 * o, roll: 0 }, { act: !1, easing: "ease-out" }), n.key(a + c + 450, { pitch: 0 }), n.move(a, a + c, s.to, { easing: "ease-in-out" }), t(n, i, a + c + 450, re), { end: a + c + 450, contact: a, release: a + c };
      }
    },
    hover: {
      summary: "Hovers in place for `for` ms (default 2000), bobbing gently.",
      uses: ["for"],
      run(n, s, i) {
        const o = s.for ?? 2e3, r = n.values.lift, a = n.exaggeration;
        for (let l = 350, c = 0; l < o; l += 350, c++)
          n.key(i + l, { lift: r + (c % 2 === 0 ? 0.12 : -0.06) * a, roll: (c % 2 === 0 ? 1.5 : -1.5) * a }, { act: !1, easing: "ease-in-out" });
        return n.key(i + o, { lift: r, roll: 0 }, { act: !1, easing: "ease-in-out" }), (e(n) || r > 0) && t(n, i, i + o, re), { end: i + o };
      }
    },
    land: {
      summary: "Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.",
      run(n, s, i) {
        const o = n.exaggeration, r = i + Math.max(900, n.values.lift * 450);
        return n.key(i + 400, { pitch: 3 * o }, { act: !1, easing: "ease-out" }), n.key(r, { lift: 0, pitch: 0, squash: 1 - 0.14 * o }, { act: !1, easing: "ease-in" }), n.key(r + 280, { squash: 1 }), t(n, i, r, re), t(n, r, r + 1600, re, "ease-out"), n.key(r + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: r, x: n.x, y: n.floor, length: 800 }), { end: r + 1600, contact: r };
      }
    }
  };
}
function ly(t = {}) {
  const e = { body: "#e9e4d8", wings: "#d9483b", glass: "#cfeaf5", trim: "#2c2c33", ...t.colors }, n = 3.15, i = {
    parts: [
      { id: "fuselage", shape: { type: "extrude", profile: [[-3.7, 1.55], [-2.6, 1.05], [2.4, 0.85], [3, 1], [3.1, 1.4], [2.7, 1.75], [1.4, 1.9], [-2.9, 1.85]], width: 1 }, fill: e.body },
      { id: "canopy", shape: { type: "extrude", profile: [[0.4, 1.85], [1.6, 1.85], [1.1, 2.3], [0.5, 2.3]], width: 0.7 }, fill: e.glass, outline: 0.8 },
      // Each wing (and each half of the tailplane) is its own part, so the near one draws in front of the fuselage
      // and the far one behind it.
      { id: "wing-left", shape: { type: "box", size: [3.6, 0.1, 1.35] }, at: [2.05, 1.15, 0.55], fill: e.wings },
      { id: "wing-right", shape: { type: "box", size: [3.6, 0.1, 1.35] }, at: [-2.05, 1.15, 0.55], fill: e.wings },
      { id: "tailplane-left", shape: { type: "box", size: [1.1, 0.07, 0.65] }, at: [0.6, 1.7, -3.35], fill: e.wings },
      { id: "tailplane-right", shape: { type: "box", size: [1.1, 0.07, 0.65] }, at: [-0.6, 1.7, -3.35], fill: e.wings },
      { id: "fin", shape: { type: "extrude", profile: [[-3.75, 1.75], [-3, 1.82], [-3.45, 2.75], [-3.8, 2.75]], width: 0.1 }, fill: e.wings },
      { id: "gear-left", shape: { type: "tube", points: [[0.55, 0.95, 1.2], [0.75, 0.28, 1.3]], radius: 0.04, segments: 5 }, fill: e.trim },
      { id: "gear-right", shape: { type: "tube", points: [[-0.55, 0.95, 1.2], [-0.75, 0.28, 1.3]], radius: 0.04, segments: 5 }, fill: e.trim },
      { id: "wheel-left", shape: { type: "cylinder", radius: 0.26, length: 0.14, axis: "x", segments: 14 }, at: [0.78, 0.26, 1.3], fill: e.trim },
      { id: "wheel-right", shape: { type: "cylinder", radius: 0.26, length: 0.14, axis: "x", segments: 14 }, at: [-0.78, 0.26, 1.3], fill: e.trim },
      { id: "tail-wheel", shape: { type: "cylinder", radius: 0.12, length: 0.08, axis: "x", segments: 10 }, at: [0, 0.12, -3], fill: e.trim },
      { id: "tail-strut", shape: { type: "tube", points: [[0, 0.12, -3], [0, 1.2, -2.9]], radius: 0.03, segments: 5 }, fill: e.trim },
      { id: "spinner", shape: { type: "ellipsoid", radii: [0.18, 0.18, 0.22], segments: 10 }, at: [0, 1.22, n], fill: e.wings, outline: 0.7 },
      { id: "prop-disc", shape: { type: "cylinder", radius: 0.95, length: 0.01, axis: "z", segments: 24 }, at: [0, 1.22, n + 0.08], fill: "#c9d4dd", outline: 0.4, fade: { control: "blur", from: 0, to: 0.45 } },
      { id: "propeller", shape: { type: "box", size: [0.12, 1.85, 0.04] }, at: [0, 1.22, n + 0.1], fill: e.trim, outline: 0.6, fade: { control: "blur", from: 1, to: 0.3 } }
    ],
    controls: {
      rotor: { description: "How far the propeller has turned (keyed exactly; it blurs into a disc at speed)", unit: "degrees", bind: [{ parts: ["propeller"], rotate: { axis: "z", degrees: 1 } }] },
      blur: { description: "How blurred the propeller is: 0 still, 1 a spinning disc", unit: "0..1", min: 0, max: 1 }
    },
    length: 7,
    height: 2.8,
    footprint: [7.2, 6.5],
    anchors: {
      seat: { at: [0, 1.55, 1] },
      nose: { at: [0, 1.22, n + 0.2] },
      tail: { at: [0, 1.6, -3.7] },
      wingtip: { at: [3.6, 1.15, 0.55] }
    }
  };
  return {
    kind: t.kind ?? "airplane",
    family: "aircraft",
    summary: t.summary ?? "A propeller plane: takes off from a run, flies banked, loops the loop, and lands with a flare and a squash.",
    rig: i,
    actions: hy(),
    acting: ch,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: re * 1e3 } } }
  };
}
const cy = 3.2;
function hy() {
  const t = (n, s, i, o) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", i, r + cy * (i - s) * (o ? 0.5 : 1), o);
  }, e = (n, s, i) => {
    const o = Math.sign(i - n.x);
    return o !== 0 && n.facing() !== o ? n.turnTo(s, o > 0 ? "right" : "left") : s;
  };
  return {
    takeOff: {
      summary: "Spins the propeller up, runs along the ground toward `to`, lifts its nose and climbs to `height` metres (default 4).",
      needs: ["to"],
      uses: ["height", "for"],
      run(n, s, i) {
        const o = n.exaggeration, r = e(n, i, s.to);
        t(n, r, r + 700, "ease-in"), n.key(r + 700, { blur: 1 }, { act: !1, easing: "ease-in" });
        const a = s.for ?? 2600, l = n.x, c = r + 700 + a * 0.55, h = l + (s.to - l) * 0.45;
        return n.move(r + 700, c, h, { easing: "ease-in" }), n.key(c, { pitch: 8 * o, squash: 1 + 0.04 * o }, { act: !1, easing: "ease-out" }), n.key(r + 700 + a, { lift: s.height ?? 4, pitch: 10 * o, squash: 1 }, { act: !1, easing: "ease-in-out" }), n.move(c, r + 700 + a, s.to), n.key(r + 700 + a + 500, { pitch: 0 }), t(n, r + 700, r + 700 + a + 500), n.effect({ kind: "dust", time: c, x: h, y: n.floor, length: 700 }), { end: r + 700 + a + 500, contact: c };
      }
    },
    fly: {
      summary: "Flies to `to` (and `height`), banking into the move and leveling out.",
      needs: ["to"],
      uses: ["height", "speed", "for"],
      run(n, s, i) {
        const o = n.exaggeration, r = e(n, i, s.to), a = s.for ?? Math.max(800, Math.abs(s.to - n.x) / (s.speed ?? 0.45)), l = s.height ?? n.values.lift;
        return n.key(r + 350, { roll: 10 * o, pitch: l > n.values.lift ? 6 * o : -3 * o }, { act: !1, easing: "ease-out" }), n.key(r + a - 300, { roll: 4 * o, lift: l }, { act: !1 }), n.key(r + a, { roll: 0, pitch: 0 }), n.move(r, r + a, s.to, { easing: "ease-in-out" }), t(n, i, r + a), { end: r + a, contact: r, release: r + a };
      }
    },
    loop: {
      summary: "Loops the loop: pulls up and over in a full circle (`for` ms, default 2400), carrying on the way it was going.",
      uses: ["for"],
      run(n, s, i) {
        const o = s.for ?? 2400, r = 2.2 * n.exaggeration, a = n.facing() || 1, l = 16, c = n.x, h = n.values.lift, u = n.values.pitch;
        for (let d = 1; d <= l; d++) {
          const f = Math.PI * 2 * d / l, g = i + o * d / l;
          n.key(g, { lift: h + r * (1 - Math.cos(f)), pitch: u + 360 * d / l }, { act: !1 }), n.move(i + o * (d - 1) / l, g, c + a * (r * Math.sin(f) + d / l * r * 1.2) * n.scale);
        }
        return n.key(i + o + 1, { pitch: u }, { act: !1 }), t(n, i, i + o), { end: i + o + 1 };
      }
    },
    land: {
      summary: "Comes down toward `to`: descends, flares nose-up, touches down with a squash and dust, rolls to a stop and the propeller spools down.",
      needs: ["to"],
      uses: ["for"],
      run(n, s, i) {
        const o = n.exaggeration, r = e(n, i, s.to), a = n.x, l = s.for ?? 2200, c = r + l, h = a + (s.to - a) * 0.7;
        return n.key(r + l * 0.4, { pitch: -4 * o }, { act: !1, easing: "ease-out" }), n.key(c - 250, { pitch: 6 * o, lift: 0.15 }, { act: !1, easing: "ease-in-out" }), n.key(c, { lift: 0, pitch: 0, squash: 1 - 0.12 * o }, { act: !1, easing: "ease-in" }), n.key(c + 260, { squash: 1 }), n.move(r, c, h), n.move(c, c + 1200, s.to, { easing: "ease-out" }), t(n, i, c), t(n, c, c + 1600, "ease-out"), n.key(c + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: c, x: h, y: n.floor, length: 700 }), { end: c + 1600, contact: c };
      }
    }
  };
}
const Hn = ["walk", "trot", "canter", "gallop"], Ww = Hn, hh = ["fl", "fr", "hl", "hr"], Fs = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, Se = Math.PI / 180;
function zo(t, e) {
  return 4 * t * Math.sin(Fs[e].swing * Se);
}
function Ds(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, i = s + t.body.rise, o = (u, d) => [d * u[0], u[1], u[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, i, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((u, d, f) => t.neck.radius * (1.25 - 0.4 * d / Math.max(1, f.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...dy(t, n, i)
  ];
  t.mane && r.push({ id: "mane", parent: "neck", shape: { type: "tube", points: t.mane.points, radius: t.mane.radius, segments: 6 }, fill: n.dark, outline: 0.7 }), t.muzzle && r.push({ id: "muzzle", parent: "head", shape: { type: "ellipsoid", radii: t.muzzle.radii, segments: 10 }, at: t.muzzle.at, fill: n.muzzle, outline: 0.8 });
  for (const u of [1, -1]) {
    const d = u > 0 ? "left" : "right", f = t.ears.rotate ? o(t.ears.rotate, 1).map((g, p) => p === 2 ? u * g : g) : void 0;
    r.push(
      { id: `ear-${d}`, parent: "head", shape: { type: "ellipsoid", radii: t.ears.radii, segments: 8 }, at: o(t.ears.at, u), rotate: f, fill: n.coat, outline: 0.7 },
      { id: `eye-${d}`, parent: "head", shape: { type: "ellipsoid", radii: [t.eyes.size * 0.8, t.eyes.size, t.eyes.size * 0.9], segments: 8 }, at: o(t.eyes.at, u), fill: "#1d1d22", outline: 0.4 }
    );
  }
  r.push(...t.extras?.(n) ?? []);
  const a = {
    walk: { description: "Phase of the stride, in full cycles (keyed in step with the distance covered)", unit: "cycles" },
    walking: { description: "How much of the gait is applied: 0 standing, 1 moving", unit: "0..1", min: 0, max: 1 },
    gait: { description: `Which gait: ${t.gaits.map((u) => `${Hn.indexOf(u)} ${u}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: jt, rotate: { axis: "x", degrees: 1 / jt.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: jt, rotate: { axis: "y", degrees: 1 / jt.length } }] }
  };
  for (const u of hh) {
    const d = u[0] === "f", f = u[1] === "l" ? 1 : -1, g = d ? e.thickness[0] : e.thickness[1];
    r.push(
      // Tapered from the hip down, a rounded knee, a tapered lower leg and a rounded paw or hoof.
      { id: `${u}-upper`, shape: { type: "tube", points: [[0, e.upper * 0.2, 0], [0, -e.upper * 0.5, 0], [0, -e.upper, 0]], radius: [g, g * 0.85, e.lowerThickness * 1.15], segments: 10 }, at: [f * e.across, s, d ? e.front : e.hind], fill: n.coat },
      { id: `${u}-knee`, parent: `${u}-upper`, shape: { type: "ellipsoid", radii: Array(3).fill(e.lowerThickness * 1.08), segments: 10 }, at: [0, -e.upper, 0], fill: n.coat, solidOnly: !0 },
      { id: `${u}-lower`, parent: `${u}-upper`, shape: { type: "tube", points: [[0, 0, 0], [0, -e.lower, 0]], radius: [e.lowerThickness * 1.1, e.lowerThickness * 0.85], segments: 10 }, at: [0, -e.upper, 0], fill: n.coat },
      { id: `${u}-foot`, parent: `${u}-lower`, shape: { type: "ellipsoid", radii: [e.footSize[0] / 2, e.foot / 2 + 4e-3, e.footSize[1] / 2], segments: 12 }, at: [0, -e.lower - e.foot / 2, e.footSize[1] * 0.12], fill: n.foot, outline: 0.8 }
    );
    const p = `${d ? "Front" : "Hind"} ${f > 0 ? "left" : "right"} leg`;
    a[`${u}.swing`] = { description: `${p}: forward (+) or back (−) from the hip`, unit: "degrees", bind: [{ parts: [`${u}-upper`], rotate: { axis: "x", degrees: -1 } }] }, a[`${u}.knee`] = { description: `${p}: knee (hock) folded`, unit: "degrees", bind: [{ parts: [`${u}-lower`], rotate: { axis: "x", degrees: d ? 1 : -1 } }] }, a[`${u}.ankle`] = { description: `${p}: foot turned at the ankle (+ toe forward)`, unit: "degrees", bind: [{ parts: [`${u}-foot`], rotate: { axis: "x", degrees: -1, pivot: [0, e.foot / 2, -e.footSize[1] * 0.12] } }] };
  }
  const l = t.neck.points[t.neck.points.length - 1], c = {
    parts: r,
    controls: a,
    length: t.body.radii[2] * 2 + Math.max(0, t.neck.at[2] + l[2] + t.head.radii[2] - t.body.radii[2]) + 0.3,
    height: t.neck.at[1] + l[1] + t.head.radii[1] * 2,
    footprint: [e.across * 2 + t.body.radii[0], (e.front - e.hind) * 1.4],
    anchors: {
      back: { at: [0, i + t.body.radii[1], -t.body.radii[2] * 0.05] },
      head: { part: "head", at: [0, 0, 0] },
      mouth: { part: t.muzzle ? "muzzle" : "head", at: t.muzzle ? [0, 0, t.muzzle.radii[2]] : [0, 0, t.head.radii[2]] },
      front: { at: [0, i, t.body.radii[2]] },
      ...t.anchors
    },
    derive: (u) => fy(u, t, s)
  }, h = {
    legLength: s,
    upper: e.upper,
    lower: e.lower,
    foot: e.foot,
    tailHangs: t.tail.points[t.tail.points.length - 1][1] < 0,
    front: e.front,
    hind: e.hind,
    call(u, d) {
      const f = u.anchor("mouth");
      u.effect({ kind: "honk", time: d, x: f.x, y: f.y, length: 800, direction: u.facing() || 1 });
    }
  };
  return {
    kind: t.kind,
    family: "animal",
    summary: t.summary,
    rig: c,
    actions: { ...gy(t, h), ...t.actions?.(h) },
    acting: uh,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [{ control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 }],
    moves: uy(t, s)
  };
}
function uy(t, e) {
  const n = (i) => {
    const o = zo(e, i);
    return {
      speed: o / (Fs[i].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: Hn.indexOf(i) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / o }
    };
  }, s = Object.fromEntries(t.gaits.map((i) => [i === "gallop" && !t.gaits.includes("canter") ? "run" : i, n(i)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const jt = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function dy(t, e, n) {
  const s = Fc(t.tail.points, jt.length + 1), [, i, o] = t.body.radii, r = (t.tail.at[1] - n) / i, a = Math.abs(r) < 1 ? -o * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, o * 0.08)], c = (f) => t.tail.radius * (1 - 0.5 * f / jt.length), h = jt.map((f, g) => {
    const p = s[g], m = s[g + 1], y = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], w = g === 0 ? void 0 : s[g - 1];
    return {
      id: f,
      ...g > 0 ? { parent: jt[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], y], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - w[0], p[1] - w[1], p[2] - w[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), u = s[s.length - 1], d = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: jt[jt.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(jt.length) * 1.05), segments: 8 },
    at: [u[0] - d[0], u[1] - d[1], u[2] - d[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function fy(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const i = Hn[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], o = Fs[e.gaits.includes(i) ? i : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of hh) {
    const h = Math.PI * 2 * (r + o.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * o.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * o.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * o.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * o.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (o.rock > 0 ? -o.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function py(t) {
  const n = Math.sin(32 * Se), s = t.legLength - (t.front - t.hind) * n, i = 72, r = (s - t.upper * Math.cos(i * Se) - t.foot) / t.lower, a = r >= 1 ? 0 : r <= -1 ? 180 : Math.acos(r) / Se, l = {
    pitch: 32,
    // The front hips stay at standing height: tipping up raises them by front · sin, and swinging them round the
    // middle lowers them by leg · (1 − cos); the front legs are held upright, so both are taken back.
    lift: t.legLength * (1 - Math.cos(32 * Se)) - t.front * n,
    neck: -10,
    // A hanging tail lifts clear of the ground behind the lowered rump; one that curls up tips back to lie behind.
    tail: t.tailHangs ? 35 : -40,
    "fl.swing": -32,
    "fr.swing": -32
  };
  for (const c of ["hl", "hr"])
    l[`${c}.swing`] = i - 32, l[`${c}.knee`] = -(i + a), l[`${c}.ankle`] = a;
  return l;
}
const uh = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, jw = uh;
function gy(t, e) {
  const n = t.cycleScale ?? 1, s = (r) => ({
    summary: {
      walk: "Walks to `to` (four beats), its head bobbing.",
      trot: "Trots to `to`: legs in diagonal pairs, the body bouncing.",
      canter: "Canters to `to`: three beats, the body rocking.",
      gallop: "Gallops (runs) to `to`: legs reaching, the body rocking hard, kicking up dust."
    }[r],
    needs: ["to"],
    uses: ["for"],
    run(a, l, c) {
      const h = Math.sign(l.to - a.x);
      if (h === 0) return { end: c };
      let u = c;
      a.facing() !== h && (u = a.turnTo(u, h > 0 ? "right" : "left"));
      const d = a.exaggeration;
      a.key(u + 180, { neck: -12 * d }, { act: !1, easing: "ease-out" });
      const g = Math.abs(l.to - a.x) / a.scale / zo(e.legLength, r), p = l.for ?? Math.max(500, g * Fs[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", u, a.values.gait ?? 0), a.set("gait", u + 1, Hn.indexOf(r)), a.set("walking", u, 0), a.set("walking", u + 240, 1, "ease-out"), a.set("walking", u + p - 240, 1), a.set("walking", u + p, 0, "ease-in"), a.set("walk", u, m), a.move(u, u + p, l.to, { easing: "ease-in-out" }), a.set("walk", u + p, m + g, "ease-in-out"), a.key(u + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: u + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: u + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: u + p + 300, contact: u, release: u + p };
    }
  }), i = Object.fromEntries(t.gaits.map((r) => [r === "gallop" && !t.gaits.includes("canter") ? "run" : r, s(r)]));
  t.gaits.includes("gallop") && !i.gallop && (i.gallop = s("gallop"));
  const o = {
    ...i,
    [t.call]: {
      summary: `Throws its head up and ${t.call}s.`,
      run(r, a, l) {
        const c = r.exaggeration;
        return r.key(l + 150, { neck: 10 * c }, { act: !1, easing: "ease-out" }), r.key(l + 380, { neck: -28 * c, squash: 1.05 }, { act: !1, easing: "ease-out" }), r.key(l + 680, { neck: -20 * c }, { act: !1 }), r.key(l + 980, { neck: 0, squash: 1 }), e.call(r, l + 380), { end: l + 980, contact: l + 380 };
      }
    },
    sit: {
      summary: "Sits on its haunches for `for` ms (default 1500): the rump goes down onto folded hind legs, paws flat on the ground, the front legs stay planted; then it gets up.",
      uses: ["for"],
      run(r, a, l) {
        const c = py(e), h = l + 450;
        r.key(h, c, { act: !1, easing: "ease-in-out" }), r.key(h + (a.for ?? 1500), c, { act: !1 });
        const u = h + (a.for ?? 1500) + 450, d = {};
        for (const f of Object.keys(c)) d[f] = 0;
        return r.key(u, d), { end: u, contact: h, release: u - 450 };
      }
    },
    jump: {
      summary: "Crouches and jumps (forward to `to`, or up on the spot), legs tucked in the air, landing with a squash and dust.",
      uses: ["to"],
      run(r, a, l) {
        const c = r.exaggeration, h = e.legLength * 0.8 * c, u = l + 260, d = u + 90, f = d + 520;
        if (r.key(u, { squash: 0.86, "hl.knee": 40, "hr.knee": 40, "fl.knee": 25, "fr.knee": 25, neck: 8 }, { act: !1, easing: "ease-out" }), r.key(d, { squash: 1.12, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, pitch: 8, "fl.swing": 35, "fr.swing": 35, "hl.swing": -35, "hr.swing": -35 }, { act: !1, easing: "ease-out" }), r.key((d + f) / 2, { lift: h, squash: 1, pitch: 0, "fl.knee": 60, "fr.knee": 60, "hl.knee": 60, "hr.knee": 60, "fl.swing": 25, "fr.swing": 25, "hl.swing": -20, "hr.swing": -20 }, { act: !1, easing: "ease-out" }), r.key(f, { lift: 0, squash: 0.85, pitch: -4, "fl.knee": 0, "fr.knee": 0, "hl.knee": 0, "hr.knee": 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0 }, { act: !1, easing: "ease-in" }), r.key(f + 280, { squash: 1, pitch: 0, neck: 0 }), a.to !== void 0) {
          const g = Math.sign(a.to - r.x);
          g !== 0 && r.facing() !== g && r.turnTo(l, g > 0 ? "right" : "left"), r.move(d, f, a.to);
        }
        return r.effect({ kind: "dust", time: f, x: r.x, y: r.floor, length: 550 }), { end: f + 280, contact: f };
      }
    },
    nod: {
      summary: "Nods its head twice.",
      run(r, a, l) {
        return r.key(l + 200, { neck: 20 }, { act: !1, easing: "ease-out" }), r.key(l + 400, { neck: -5 }, { act: !1, easing: "ease-in-out" }), r.key(l + 600, { neck: 18 }, { act: !1, easing: "ease-in-out" }), r.key(l + 900, { neck: 0 }), { end: l + 900 };
      }
    },
    swish: {
      summary: "Swishes its tail a few times.",
      uses: ["for"],
      run(r, a, l) {
        const c = a.for ?? 900;
        for (let h = 1; h <= 4; h++) r.key(l + c * h / 5, { tail: h % 2 === 0 ? 10 : 35 }, { act: !1, easing: "ease-in-out" });
        return r.key(l + c, { tail: 0 }), { end: l + c };
      }
    }
  };
  return t.grazes && (o.graze = {
    summary: "Lowers its head to graze for `for` ms (default 1800), nibbling, then looks up.",
    uses: ["for"],
    run(r, a, l) {
      const c = a.for ?? 1800;
      r.key(l + 600, { neck: 75 }, { act: !1, easing: "ease-in-out" });
      for (let h = 900; h < 600 + c; h += 400) r.key(l + h, { neck: h % 800 === 100 ? 70 : 78 }, { act: !1, easing: "ease-in-out" });
      return r.key(l + 600 + c + 500, { neck: 0 }), { end: l + 600 + c + 500 };
    }
  }), o;
}
function my(t = {}) {
  return Ds({
    kind: t.kind ?? "horse",
    summary: t.summary ?? "A cartoon horse: walks, trots, canters and gallops with its hooves in step with the ground, rears, bucks, neighs, grazes and swishes its tail.",
    legs: { upper: 0.5, lower: 0.42, foot: 0.08, footSize: [0.12, 0.16], front: 0.62, hind: -0.62, across: 0.2, thickness: [0.075, 0.09], lowerThickness: 0.05 },
    body: { radii: [0.32, 0.36, 0.95], rise: 0.25 },
    neck: { at: [0, 1.42, 0.7], points: [[0, 0, 0], [0, 0.5, 0.3]], radius: 0.15 },
    head: { at: [0, 0.48, 0.5], radii: [0.13, 0.14, 0.3], rotate: [38, 0, 0] },
    muzzle: { at: [0, -0.02, 0.24], radii: [0.11, 0.1, 0.1] },
    ears: { at: [0.07, 0.16, -0.17], radii: [0.035, 0.1, 0.05] },
    eyes: { at: [0.115, 0.05, -0.04], size: 0.04 },
    tail: { at: [0, 1.4, -0.9], points: [[0, 0, 0], [0, -0.22, -0.2], [0, -0.62, -0.24]], radius: 0.08 },
    mane: { points: [[0, 0.1, -0.12], [0, 0.55, 0.17]], radius: 0.07 },
    colors: { coat: "#b5763a", dark: "#4a2e1a", foot: "#3a2a22", muzzle: "#8d5a2c", accent: "#e8c9a0", ...t.colors },
    gaits: ["walk", "trot", "canter", "gallop"],
    call: "neigh",
    grazes: !0,
    // Where a cart's shaft tips meet it: along its sides, about the middle of its body.
    anchors: { hitch: { at: [0, 0.95, -0.15] }, saddle: { at: [0, 1.6, -0.05] } },
    actions: (e) => ({
      rear: {
        summary: "Rears up on its hind legs, front legs tucked and pawing, neighs, and drops back down with dust.",
        uses: ["for"],
        run(n, s, i) {
          const o = n.exaggeration, r = Math.min(55, 32 * o), a = -e.hind * Math.sin(r * Se), l = s.for ?? 700;
          n.key(i + 200, { pitch: -4, neck: 6, "hl.knee": 12, "hr.knee": 12 }, { act: !1, easing: "ease-out" }), n.key(i + 520, { pitch: r, lift: a, neck: -25, "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-out" }), n.key(i + 520 + l * 0.5, { "fl.swing": 35, "fl.knee": 70, "fr.swing": 58, "fr.knee": 100 }, { act: !1, easing: "ease-in-out" }), n.key(i + 520 + l, { "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80 }, { act: !1, easing: "ease-in-out" });
          const c = i + 520 + l + 380;
          return n.key(c, { pitch: 0, lift: 0, neck: 8, squash: 0.94, "fl.swing": 0, "fl.knee": 0, "fr.swing": 0, "fr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(c + 320, { neck: 0, squash: 1 }), e.call(n, i + 520), n.effect({ kind: "dust", time: c, x: n.x + (n.facing() || 1) * e.front * n.scale, y: n.floor, length: 600 }), { end: c + 320, contact: c };
        }
      },
      buck: {
        summary: "Bucks: drops its head and kicks both hind legs up and back.",
        run(n, s, i) {
          const o = n.exaggeration, r = Math.min(35, 18 * o), a = e.front * Math.sin(r * Se);
          return n.key(i + 220, { pitch: 3, squash: 0.95 }, { act: !1, easing: "ease-out" }), n.key(i + 480, { pitch: -r, lift: a, neck: 30, "hl.swing": -65, "hr.swing": -60, "hl.knee": 10, "hr.knee": 10 }, { act: !1, easing: "ease-out" }), n.key(i + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, "hl.swing": 0, "hr.swing": 0, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(i + 1150, { squash: 1 }), n.effect({ kind: "dust", time: i + 900, x: n.x - (n.facing() || 1) * 0.6 * n.scale, y: n.floor, length: 600 }), { end: i + 1150, contact: i + 480 };
        }
      }
    })
  });
}
function yy(t = {}) {
  return Ds({
    kind: t.kind ?? "dog",
    summary: t.summary ?? "A cartoon dog: walks, trots and runs, barks, wags its tail, sits, jumps, sniffs the ground.",
    legs: { upper: 0.19, lower: 0.16, foot: 0.05, footSize: [0.07, 0.1], front: 0.24, hind: -0.24, across: 0.09, thickness: [0.04, 0.05], lowerThickness: 0.032 },
    body: { radii: [0.14, 0.15, 0.36], rise: 0.1 },
    neck: { at: [0, 0.56, 0.27], points: [[0, 0, 0], [0, 0.14, 0.06]], radius: 0.075 },
    head: { at: [0, 0.15, 0.08], radii: [0.12, 0.11, 0.13] },
    muzzle: { at: [0, -0.03, 0.13], radii: [0.065, 0.055, 0.08] },
    // Floppy ears hanging down the sides of the head.
    ears: { at: [0.11, 0, -0.02], radii: [0.025, 0.09, 0.05], rotate: [0, 0, 18] },
    eyes: { at: [0.08, 0.04, 0.08], size: 0.025 },
    tail: { at: [0, 0.58, -0.34], points: [[0, 0, 0], [0, 0.1, -0.08], [0, 0.2, -0.1]], radius: 0.03 },
    extras: (e) => [{ id: "nose", parent: "muzzle", shape: { type: "ellipsoid", radii: [0.025, 0.02, 0.02], segments: 8 }, at: [0, 0.03, 0.08], fill: "#1d1d22", outline: 0.4 }, { id: "patch", parent: "body", shape: { type: "ellipsoid", radii: [0.012, 0.09, 0.11], segments: 10 }, at: [0.135, 0.04, -0.06], fill: e.accent, outline: 0.5 }],
    colors: { coat: "#d9a066", dark: "#a8703a", foot: "#a8703a", muzzle: "#f0d2a8", accent: "#f6ead8", ...t.colors },
    gaits: ["walk", "trot", "gallop"],
    cycleScale: 0.55,
    call: "bark",
    anchors: { leash: { part: "neck", at: [0, 0.06, 0] } },
    actions: () => ({
      wag: {
        summary: "Wags its tail fast for `for` ms (default 1200).",
        uses: ["for"],
        run(e, n, s) {
          const i = n.for ?? 1200;
          for (let o = 80, r = 0; o < i; o += 80, r++) e.key(s + o, { wag: r % 2 === 0 ? 35 : -35, tail: 25 }, { act: !1, easing: "ease-in-out" });
          return e.key(s + i, { wag: 0, tail: 0 }), { end: s + i };
        }
      },
      sniff: {
        summary: "Puts its nose to the ground and sniffs (`for` ms, default 1400).",
        uses: ["for"],
        run(e, n, s) {
          const i = n.for ?? 1400;
          e.key(s + 350, { neck: 70, pitch: -6 }, { act: !1, easing: "ease-in-out" });
          for (let o = 500, r = 0; o < i; o += 140, r++) e.key(s + o, { neck: r % 2 === 0 ? 74 : 66 }, { act: !1 });
          return e.key(s + i + 300, { neck: 0, pitch: 0 }), { end: s + i + 300 };
        }
      }
    })
  });
}
function by(t = {}) {
  return Ds({
    kind: t.kind ?? "cat",
    summary: t.summary ?? "A cartoon cat: walks, trots and runs, meows, arches its back, pounces, sits and swishes its tail.",
    legs: { upper: 0.13, lower: 0.11, foot: 0.035, footSize: [0.05, 0.07], front: 0.17, hind: -0.18, across: 0.06, thickness: [0.028, 0.035], lowerThickness: 0.022 },
    body: { radii: [0.1, 0.105, 0.27], rise: 0.07 },
    neck: { at: [0, 0.39, 0.2], points: [[0, 0, 0], [0, 0.08, 0.04]], radius: 0.05 },
    head: { at: [0, 0.1, 0.05], radii: [0.095, 0.085, 0.085] },
    muzzle: { at: [0, -0.03, 0.07], radii: [0.04, 0.03, 0.03] },
    // Pointed ears standing up.
    ears: { at: [0.055, 0.085, -0.01], radii: [0.03, 0.055, 0.02], rotate: [0, 0, -12] },
    eyes: { at: [0.045, 0.02, 0.07], size: 0.022 },
    // A long tail curving up behind.
    tail: { at: [0, 0.42, -0.26], points: [[0, 0, 0], [0, 0.08, -0.12], [0, 0.24, -0.16], [0, 0.34, -0.1]], radius: 0.022 },
    extras: () => [{ id: "nose", parent: "muzzle", shape: { type: "ellipsoid", radii: [0.014, 0.01, 0.01], segments: 8 }, at: [0, 0.015, 0.03], fill: "#e48a9a", outline: 0.4 }],
    colors: { coat: "#8f8a86", dark: "#5f5a57", foot: "#f2efe9", muzzle: "#f2efe9", accent: "#f2efe9", ...t.colors },
    gaits: ["walk", "trot", "gallop"],
    cycleScale: 0.5,
    call: "meow",
    actions: (e) => ({
      arch: {
        summary: "Arches its back, fur up and tail high, for `for` ms (default 1200): a startled cat.",
        uses: ["for"],
        run(n, s, i) {
          const o = n.exaggeration, r = s.for ?? 1200, a = { squash: 1 + 0.25 * o, neck: 25, tail: -45, "fl.swing": -8, "fr.swing": -8, "hl.swing": 8, "hr.swing": 8 };
          return n.key(i + 180, a, { act: !1, easing: "ease-out" }), n.key(i + 180 + r, a, { act: !1 }), n.key(i + r + 520, { squash: 1, neck: 0, tail: 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0 }), { end: i + r + 520, contact: i + 180 };
        }
      },
      pounce: {
        summary: "Crouches low, wiggles, and pounces to `to`, landing with a squash.",
        needs: ["to"],
        run(n, s, i) {
          const o = n.exaggeration, r = Math.sign(s.to - n.x);
          let a = i;
          r !== 0 && n.facing() !== r && (a = n.turnTo(a, r > 0 ? "right" : "left"));
          const l = { squash: 0.75, "hl.knee": 60, "hr.knee": 60, "fl.knee": 45, "fr.knee": 45, neck: 10, tail: -15 };
          n.key(a + 300, l, { act: !1, easing: "ease-out" });
          for (let u = 1; u <= 4; u++) n.key(a + 300 + u * 110, { roll: u % 2 === 0 ? 3 : -3 }, { act: !1 });
          const c = a + 300 + 550, h = c + 480;
          return n.key(c, { roll: 0, squash: 1.2, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, "fl.swing": 45, "fr.swing": 45, "hl.swing": -45, "hr.swing": -45, tail: 20 }, { act: !1, easing: "ease-out" }), n.key((c + h) / 2, { lift: e.legLength * 0.9 * o, squash: 1.1, pitch: -6 }, { act: !1, easing: "ease-out" }), n.key(h, { lift: 0, squash: 0.8, pitch: 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0, neck: 0, tail: 0 }, { act: !1, easing: "ease-in" }), n.key(h + 260, { squash: 1 }), n.move(c, h, s.to), n.effect({ kind: "dust", time: h, x: s.to, y: n.floor, length: 450 }), { end: h + 260, contact: h };
        }
      }
    })
  });
}
function wy(t = {}) {
  return Ds({
    kind: t.kind ?? "cow",
    summary: t.summary ?? "A cartoon cow: walks and trots, moos, grazes, sits and swishes its tail.",
    legs: { upper: 0.42, lower: 0.36, foot: 0.08, footSize: [0.13, 0.15], front: 0.68, hind: -0.66, across: 0.24, thickness: [0.085, 0.1], lowerThickness: 0.06 },
    body: { radii: [0.4, 0.42, 1], rise: 0.32 },
    neck: { at: [0, 1.3, 0.85], points: [[0, 0, 0], [0, 0.22, 0.25]], radius: 0.19 },
    head: { at: [0, 0.18, 0.4], radii: [0.17, 0.19, 0.27], rotate: [30, 0, 0] },
    muzzle: { at: [0, -0.06, 0.22], radii: [0.15, 0.11, 0.1] },
    ears: { at: [0.17, 0.06, -0.12], radii: [0.11, 0.035, 0.05], rotate: [0, 0, -15] },
    eyes: { at: [0.13, 0.06, 0.02], size: 0.04 },
    tail: { at: [0, 1.48, -1], points: [[0, 0, 0], [0, -0.25, -0.12], [0, -0.7, -0.14]], radius: 0.035 },
    extras: (e) => [
      { id: "horn-left", parent: "head", shape: { type: "tube", points: [[0, 0, 0], [0.08, 0.12, 0.02]], radius: 0.025, segments: 6 }, at: [0.1, 0.16, -0.14], fill: "#efe6d2", outline: 0.6 },
      { id: "horn-right", parent: "head", shape: { type: "tube", points: [[0, 0, 0], [-0.08, 0.12, 0.02]], radius: 0.025, segments: 6 }, at: [-0.1, 0.16, -0.14], fill: "#efe6d2", outline: 0.6 },
      { id: "udder", shape: { type: "ellipsoid", radii: [0.16, 0.12, 0.18], segments: 10 }, at: [0, 0.98, -0.45], fill: "#f0a6b6", outline: 0.6 },
      { id: "spot-1", parent: "body", shape: { type: "ellipsoid", radii: [0.02, 0.2, 0.26], segments: 10 }, at: [0.39, 0.06, 0.2], fill: e.accent, outline: 0.4 },
      { id: "spot-2", parent: "body", shape: { type: "ellipsoid", radii: [0.02, 0.16, 0.22], segments: 10 }, at: [-0.39, 0.1, -0.35], fill: e.accent, outline: 0.4 },
      { id: "spot-3", parent: "body", shape: { type: "ellipsoid", radii: [0.2, 0.02, 0.24], segments: 10 }, at: [0, 0.41, -0.2], fill: e.accent, outline: 0.4 }
    ],
    colors: { coat: "#f4f1ea", dark: "#2e2b2a", foot: "#3a3330", muzzle: "#f0b8c4", accent: "#2e2b2a", ...t.colors },
    gaits: ["walk", "trot"],
    cycleScale: 1.15,
    call: "moo",
    grazes: !0
  });
}
function Bw(t) {
  return zo(1, t);
}
const se = 0.6, dh = 75, Si = 80;
function Xo(t) {
  const { colors: e } = t, [n, s, i] = t.body.radii, o = (t.tail.raised ?? 15) * Math.PI / 180, r = t.tail.length * 0.4, a = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 16 }, at: [0, t.body.height, 0], fill: e.body },
    // The head hangs from a neck joint at the front of the body, so it can peck.
    { id: "neck", shape: { type: "ellipsoid", radii: [n * 0.55, s * 0.55, i * 0.3], segments: 10 }, at: [0, t.body.height + s * 0.45, i * 0.65], fill: e.body, outline: 0.5, solidOnly: !0 },
    {
      id: "head",
      parent: "neck",
      shape: { type: "ellipsoid", radii: [t.head.radius, t.head.radius * 1.02, t.head.radius * 1.05], segments: 14 },
      at: [t.head.at[0], t.head.at[1] - (t.body.height + s * 0.45), t.head.at[2] - i * 0.65],
      fill: e.body
    },
    {
      id: "beak",
      parent: "head",
      shape: { type: "tube", points: [[0, 0, 0], [0, -t.beak.thickness * 0.4, t.beak.length]], radius: [t.beak.thickness, t.beak.thickness * 0.08], segments: 8 },
      at: [0, -t.head.radius * 0.1, t.head.radius * 0.8],
      fill: e.beak,
      outline: 0.8
    },
    // The tail fans back from its root, its tip raised: its middle lies along that line, a little way out.
    { id: "tail", shape: { type: "ellipsoid", radii: [t.tail.width / 2, 0.012 * (i / 0.08), t.tail.length / 2], segments: 10 }, at: [t.tail.at[0], t.tail.at[1] + r * Math.sin(o), t.tail.at[2] - r * Math.cos(o)], rotate: [t.tail.raised ?? 15, 0, 0], fill: e.wing, outline: 0.8 }
  ];
  if (e.belly && a.push({ id: "belly", parent: "body", shape: { type: "ellipsoid", radii: [n * 0.82, s * 0.7, i * 0.75], segments: 12 }, at: [0, -s * 0.25, i * 0.12], fill: e.belly, outline: 0.4 }), t.comb) {
    const h = t.head.radius;
    a.push(
      { id: "comb", parent: "head", shape: { type: "extrude", profile: [[-h * 0.5, h * 0.6], [h * 0.6, h * 0.6], [h * 0.5, h * 1.3], [h * 0.15, h * 1.05], [-h * 0.05, h * 1.4], [-h * 0.3, h * 1.05], [-h * 0.6, h * 1.25]], width: h * 0.25 }, fill: e.comb ?? "#d9372e", outline: 0.7 },
      { id: "wattle", parent: "head", shape: { type: "ellipsoid", radii: [h * 0.15, h * 0.35, h * 0.2], segments: 8 }, at: [0, -h * 0.7, h * 0.6], fill: e.comb ?? "#d9372e", outline: 0.6 }
    );
  }
  for (const h of [1, -1]) {
    const u = h > 0 ? "left" : "right", d = t.head.radius;
    a.push({ id: `eye-${u}`, parent: "head", shape: { type: "ellipsoid", radii: [d * 0.16, d * 0.2, d * 0.18], segments: 8 }, at: [h * d * 0.72, d * 0.18, d * 0.42], fill: "#1d1d22", outline: 0.3 }), a.push({
      id: `wing-${u}`,
      shape: { type: "ellipsoid", radii: [4e-3, 4e-3, 4e-3], segments: 4 },
      at: [h * t.wing.shoulder[0], t.wing.shoulder[1], t.wing.shoulder[2]],
      rotate: [-8, h * 90, 0],
      outline: 0
    }), a.push({
      id: `wing-${u}-blade`,
      parent: `wing-${u}`,
      shape: { type: "ellipsoid", radii: [t.wing.span * se / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * se / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-Si, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${u}-tip`,
      parent: `wing-${u}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * se / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * se / 4, 0, -t.wing.chord * 0.3],
      rotate: [0, h * 14, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({ id: `leg-${u}`, shape: { type: "tube", points: [[0, 0, 0], [0, -t.legs.length, 0]], radius: Math.max(4e-3, t.legs.length * 0.05), segments: 5 }, at: [h * t.legs.across, t.legs.length, 0], fill: e.legs, outline: 0.6 }), a.push({ id: `toes-${u}`, parent: `leg-${u}`, shape: { type: "tube", points: [[0, 0, -t.legs.length * 0.15], [0, 0, t.legs.length * 0.35]], radius: Math.max(3e-3, t.legs.length * 0.04), segments: 5 }, at: [0, -t.legs.length, 0], fill: e.legs, outline: 0.6 });
  }
  const l = {
    spread: {
      description: "Wings: 0 folded back along the body, 1 spread out",
      unit: "0..1",
      min: 0,
      max: 1,
      bind: [
        { parts: ["wing-left"], rotate: { axis: "y", degrees: -90 } },
        { parts: ["wing-right"], rotate: { axis: "y", degrees: 90 } },
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - se) / 2, 0, 0], rotate: { axis: "x", degrees: Si }, scale: [1 / se, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - se) / 2, 0, 0], rotate: { axis: "x", degrees: Si }, scale: [1 / se, 1, 1] }
      ]
    },
    flap: {
      description: "Wings raised (+) or lowered (−) at the shoulders",
      unit: "degrees",
      bind: [
        { parts: ["wing-left"], rotate: { axis: "z", degrees: 1 } },
        { parts: ["wing-right"], rotate: { axis: "z", degrees: -1 } }
      ]
    },
    wingbeat: { description: "Phase of the wingbeat, in beats (keyed steadily while flapping)", unit: "beats" },
    flapping: { description: "How hard the wings beat: 0 still, 1 full beats", unit: "0..1", min: 0, max: 1 },
    peck: {
      description: "Head bobbed down and forward (+, pecking) or up (−)",
      unit: "degrees",
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / dh, 0] }]
    },
    step: { description: "Phase of a walk, in steps (a chicken’s legs)", unit: "steps" },
    stepping: { description: "How much of the walk is applied", unit: "0..1", min: 0, max: 1 },
    "leg.left": { description: "Left leg swung forward (+)", unit: "degrees", bind: [{ parts: ["leg-left"], rotate: { axis: "x", degrees: -1 } }] },
    "leg.right": { description: "Right leg swung forward (+)", unit: "degrees", bind: [{ parts: ["leg-right"], rotate: { axis: "x", degrees: -1 } }] }
  }, c = {
    parts: a,
    controls: l,
    length: i * 2 + t.tail.length + t.beak.length,
    height: t.head.at[1] + t.head.radius,
    footprint: [n * 2.2, i * 2.4],
    anchors: {
      beak: { part: "beak", at: [0, 0, t.beak.length] },
      head: { part: "head", at: [0, 0, 0] },
      back: { at: [0, t.body.height + s, 0] },
      feet: { at: [0, 0, 0] }
    },
    derive: (h) => {
      const u = {}, d = Math.max(0, Math.min(1, h.flapping ?? 0));
      d > 0 && (u.flap = (h.flap ?? 0) + d * 48 * Math.sin(Math.PI * 2 * (h.wingbeat ?? 0)));
      const f = Math.max(0, Math.min(1, h.stepping ?? 0));
      if (f > 0) {
        const g = Math.sin(Math.PI * 2 * (h.step ?? 0));
        u["leg.left"] = (h["leg.left"] ?? 0) + f * 28 * g, u["leg.right"] = (h["leg.right"] ?? 0) - f * 28 * g, u.peck = (h.peck ?? 0) + f * 12 * Math.sin(Math.PI * 4 * (h.step ?? 0));
      }
      return u;
    }
  };
  return {
    kind: t.kind,
    family: "bird",
    summary: t.summary,
    rig: c,
    actions: My(t),
    acting: vy,
    colors: { body: e.body, ink: "#26262b" },
    moves: ky(t)
  };
}
function ky(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const vy = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function My(t) {
  const e = (t.beatsPerSecond ?? 4) / 1e3, n = (r, a, l) => {
    const c = r.values.wingbeat ?? 0;
    r.set("wingbeat", a, c), r.set("wingbeat", l, c + (l - a) * e);
  }, s = (r, a, l) => {
    const c = Math.sign(l - r.x);
    return c !== 0 && r.facing() !== c ? r.turnTo(a, c > 0 ? "right" : "left") : a;
  }, i = (r, a) => {
    const l = r.anchor("beak");
    r.effect({ kind: "honk", time: a, x: l.x, y: l.y, length: 600, direction: r.facing() || 1 });
  }, o = {
    hop: {
      summary: "Hops to `to` in little bounces, wings twitching.",
      needs: ["to"],
      run(r, a, l) {
        const c = s(r, l, a.to), h = r.x, u = Math.abs(a.to - h), d = Math.max(1, Math.round(u / (t.body.radii[2] * 3 * r.scale))), f = 260;
        for (let g = 0; g < d; g++) {
          const p = c + g * f;
          r.key(p + 60, { squash: 0.85 }, { act: !1, easing: "ease-out" }), r.key(p + 150, { squash: 1.1, lift: t.legs.length * 1.4, spread: 0.15 }, { act: !1, easing: "ease-out" }), r.key(p + f, { squash: 0.9, lift: 0, spread: 0 }, { act: !1, easing: "ease-in" }), r.move(p + 60, p + f, h + (a.to - h) * (g + 1) / d, { easing: "ease-in-out" });
        }
        return r.key(c + d * f + 120, { squash: 1 }), { end: c + d * f + 120 };
      }
    },
    walk: {
      summary: "Walks to `to` on its two legs, its head bobbing with each step.",
      needs: ["to"],
      uses: ["for"],
      run(r, a, l) {
        const c = s(r, l, a.to), h = Math.abs(a.to - r.x) / r.scale, u = t.legs.length * 1.2, d = h / u, f = a.for ?? Math.max(400, d * 420), g = r.values.step ?? 0;
        return r.set("stepping", c, 0), r.set("stepping", c + 150, 1, "ease-out"), r.set("stepping", c + f - 150, 1), r.set("stepping", c + f, 0, "ease-in"), r.set("step", c, g), r.move(c, c + f, a.to, { easing: "ease-in-out" }), r.set("step", c + f, g + d / 2, "ease-in-out"), { end: c + f, contact: c, release: c + f };
      }
    },
    peck: {
      summary: "Pecks at the ground (`for` ms, default 900): quick jabs of the head.",
      uses: ["for"],
      run(r, a, l) {
        const c = a.for ?? 900, h = Math.max(1, Math.round(c / 300));
        r.key(l + 120, { pitch: -(t.stoop ?? 12) }, { act: !1, easing: "ease-out" });
        for (let u = 0; u < h; u++)
          r.key(l + 120 + u * 300 + 90, { peck: dh }, { act: !1, easing: "ease-in" }), r.key(l + 120 + u * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
        return r.key(l + 120 + h * 300 + 200, { peck: 0, pitch: 0 }), { end: l + 120 + h * 300 + 200, contact: l + 210 };
      }
    },
    flap: {
      summary: "Flaps its wings on the spot (`for` ms, default 900), lifting a little.",
      uses: ["for"],
      run(r, a, l) {
        const c = a.for ?? 900;
        return r.key(l + 120, { spread: 1 }, { act: !1, easing: "ease-out" }), r.set("flapping", l, 0), r.set("flapping", l + 150, 1, "ease-out"), r.set("flapping", l + c - 150, 1), r.set("flapping", l + c, 0, "ease-in"), n(r, l, l + c), r.key(l + c * 0.5, { lift: t.legs.length * 0.6 }, { act: !1, easing: "ease-out" }), r.key(l + c, { lift: 0, spread: 0 }, { act: !1, easing: "ease-in" }), { end: l + c + 80 };
      }
    },
    [t.call]: {
      summary: `${t.call[0].toUpperCase()}${t.call.slice(1)}s: its head comes up and its beak opens to call.`,
      run(r, a, l) {
        return r.key(l + 120, { peck: -25, squash: 1.06 }, { act: !1, easing: "ease-out" }), r.key(l + 500, { peck: -20 }, { act: !1 }), r.key(l + 760, { peck: 0, squash: 1 }), i(r, l + 150), { end: l + 760, contact: l + 150 };
      }
    }
  };
  return t.flies !== !1 ? (o.fly = {
    summary: "Takes off (a crouch and a leap, wings beating) and flies to `to` at `height` metres (default 2); `land` brings it down.",
    needs: ["to"],
    uses: ["height", "for"],
    run(r, a, l) {
      const c = r.exaggeration, h = s(r, l, a.to), u = a.height ?? 2, d = a.for ?? Math.max(700, Math.abs(a.to - r.x) / 0.35), f = r.values.lift > t.legs.length, g = f ? h : h + 200;
      return f || (r.key(h + 160, { squash: 1 - 0.18 * c, spread: 0.6 }, { act: !1, easing: "ease-out" }), r.effect({ kind: "dust", time: g, x: r.x, y: r.floor, length: 400 })), r.key(g + 100, { spread: 1, squash: 1.08, pitch: 10 }, { act: !1, easing: "ease-out" }), r.set("flapping", g, r.values.flapping ?? 0), r.set("flapping", g + 100, 1, "ease-out"), r.set("flapping", g + d, 0.6), n(r, g, g + d), r.key(g + d * 0.4, { lift: u, pitch: -5, squash: 1 }, { act: !1, easing: "ease-out" }), r.key(g + d, { lift: u, pitch: 0 }, { act: !1, easing: "ease-in-out" }), r.move(g, g + d, a.to, { easing: "ease-in-out" }), { end: g + d, contact: g, release: g + d };
    }
  }, o.land = {
    summary: "Comes down to the floor it is over (or to `height` metres above it, a branch or a roof): wings braking, a squash on touchdown.",
    uses: ["height", "to"],
    run(r, a, l) {
      const h = a.height ?? 0;
      return r.set("flapping", l, r.values.flapping ?? 1), r.set("flapping", l + 700 - 120, 1), r.set("flapping", l + 700, 0, "ease-in"), n(r, l, l + 700), r.key(l + 700 * 0.6, { pitch: 14 }, { act: !1, easing: "ease-out" }), r.key(l + 700, { lift: h, pitch: 0, squash: 0.85 }, { act: !1, easing: "ease-in" }), a.to !== void 0 && r.move(l, l + 700, a.to, { easing: "ease-out" }), r.key(l + 700 + 160, { squash: 1, spread: 0 }), { end: l + 700 + 200, contact: l + 700 };
    }
  }) : o.flutter = {
    summary: "Flutters up a little way and back down, wings beating hard (a chicken’s flight).",
    run(r, a, l) {
      return r.key(l + 100, { spread: 1, squash: 0.9 }, { act: !1, easing: "ease-out" }), r.set("flapping", l + 80, 0), r.set("flapping", l + 160, 1, "ease-out"), r.set("flapping", l + 900 - 100, 1), r.set("flapping", l + 900, 0, "ease-in"), n(r, l + 80, l + 900), r.key(l + 900 * 0.5, { lift: t.legs.length * 2.5, squash: 1.08 }, { act: !1, easing: "ease-out" }), r.key(l + 900, { lift: 0, squash: 0.85, spread: 0 }, { act: !1, easing: "ease-in" }), r.key(l + 900 + 160, { squash: 1 }), { end: l + 900 + 160, contact: l + 900 };
    }
  }, o;
}
function Sy(t = {}) {
  return Xo({
    kind: "songbird",
    summary: "A small songbird: hops, pecks, tweets, flaps, flies and lands (on the ground, a branch or a roof).",
    body: { radii: [0.05, 0.05, 0.075], height: 0.085 },
    head: { at: [0, 0.145, 0.065], radius: 0.036 },
    beak: { length: 0.03, thickness: 0.01 },
    wing: { shoulder: [0.04, 0.1, 0.03], span: 0.11, chord: 0.06 },
    tail: { at: [0, 0.095, -0.07], length: 0.07, width: 0.045 },
    legs: { length: 0.04, across: 0.018 },
    colors: { body: "#7b6a58", wing: "#5c4c3d", beak: "#e7a43a", legs: "#c47a35", belly: "#e9c8a3", ...t.colors },
    call: "tweet",
    beatsPerSecond: 9
  });
}
function Ty(t = {}) {
  return Xo({
    kind: "crow",
    summary: "A crow: walks and hops, pecks, caws, flaps, flies and lands (on the ground, a branch or a roof).",
    body: { radii: [0.09, 0.09, 0.17], height: 0.2 },
    head: { at: [0, 0.32, 0.15], radius: 0.065 },
    beak: { length: 0.08, thickness: 0.022 },
    wing: { shoulder: [0.07, 0.24, 0.06], span: 0.32, chord: 0.14 },
    tail: { at: [0, 0.2, -0.15], length: 0.16, width: 0.09 },
    legs: { length: 0.1, across: 0.035 },
    colors: { body: "#2b2b33", wing: "#1e1e25", beak: "#3b3b44", legs: "#3b3b44", ...t.colors },
    call: "caw",
    beatsPerSecond: 4
  });
}
function xy(t = {}) {
  return Xo({
    kind: "chicken",
    summary: "A chicken: walks with a bobbing head, pecks, clucks, and flutters up and down (it cannot really fly).",
    body: { radii: [0.13, 0.14, 0.19], height: 0.3 },
    head: { at: [0, 0.5, 0.16], radius: 0.07 },
    beak: { length: 0.05, thickness: 0.02 },
    wing: { shoulder: [0.11, 0.34, 0.04], span: 0.24, chord: 0.15 },
    tail: { at: [0, 0.38, -0.15], length: 0.16, width: 0.13, raised: 50 },
    legs: { length: 0.17, across: 0.05 },
    comb: !0,
    stoop: 20,
    neckReach: 0.12,
    colors: { body: "#f4ede0", wing: "#e6dccb", beak: "#e7a43a", legs: "#e7a43a", comb: "#d9372e", ...t.colors },
    call: "cluck",
    flies: !1
  });
}
const An = { car: z1, truck: X1, bus: U1, tractor: V1, cart: G1, trainCar: J1, bike: Z1, motorbike: Q1, tree: ty, house: sy, helicopter: ry, airplane: ly, horse: my, dog: yy, cat: by, cow: wy, songbird: Sy, crow: Ty, chicken: xy };
function Ey(t, e = {}) {
  const n = An[t];
  if (!n) throw new Error(pt("prop preset", t, Object.keys(An)));
  return n(e);
}
function Ay(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...In, ...t.rig.controls })) {
    const { bind: i, ...o } = s;
    e[n] = o;
  }
  return e;
}
function qw(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, i = e.rig.height * n * 1.6, o = Ay(e), r = {};
  for (const [l, c] of Object.entries(o)) r[l] = t.values?.[l] ?? c.default ?? 0;
  const a = { look: t.look, ink: t.ink, lineWidth: t.lineWidth, pencil: t.pencil, seed: t.seed, style: t.style, paper: t.paper };
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - i,
    width: s,
    height: i,
    props: r,
    prop: e,
    propScale: n,
    propDraw: a,
    about: {
      kind: e.kind,
      summary: e.summary,
      props: o,
      actions: Object.fromEntries(Object.entries(e.actions).map(([l, c]) => [l, c.summary]))
    },
    draw(l, c, h) {
      const u = c.props ?? {};
      l.translate(s / 2, i), Oc(l, Ns(e, u, n), { ...a, time: h });
    }
  };
}
function Ns(t, e, n) {
  const s = R1(gt(t.rig, e, "turn"), gt(t.rig, e, "tilt"), n);
  return ah(t.rig, e, s, n);
}
function Uo(t, e, n) {
  const s = { ...t.props };
  let i = 0, o = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? i = c : l === "y" ? o = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + i, y: t.y + t.height + o }, a = Ns(t.prop, s, t.propScale);
  return {
    values: s,
    origin: r,
    solved: a,
    anchor(l) {
      const c = a.anchors[l];
      if (!c) throw new Error(`${t.prop.kind}: no anchor "${l}" (it has ${Object.keys(a.anchors).join(", ") || "none"})`);
      return { x: r.x + c.point.x, y: r.y + c.point.y, depth: c.depth };
    }
  };
}
function Yw(t, e, n, s, i = {}) {
  const o = Uo(e, n, s);
  return t.save(), t.translate(o.origin.x, o.origin.y), Oc(t, o.solved, {
    ...e.propDraw,
    time: n.time,
    // The rider is drawn in scene px.
    rider: i.rider ? (r) => {
      r.save(), r.translate(-o.origin.x, -o.origin.y), i.rider(r), r.restore();
    } : void 0
  }), t.restore(), o;
}
const io = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], oo = { viewer: 0, right: 1, away: 2, left: 3 }, $y = 420, fh = {
  hold: {
    summary: "Holds still (`for` ms, default 1000).",
    run: (t, e, n) => ({ end: n + (e.for ?? 1e3) })
  },
  turn: {
    summary: "Turns to face `toward`: viewer, right, away, left, or a quarter-turn value (it turns in 3D, through the nearer way).",
    needs: ["toward"],
    run: (t, e, n) => ({ end: t.turnTo(n, e.toward) })
  },
  pop: {
    summary: "Pops into being: grows from nothing, stretched, overshoots and settles (`for` ms, default 500).",
    uses: ["for"],
    run(t, e, n) {
      const s = e.for ?? 500, i = t.exaggeration;
      return t.key(n, { size: 0, squash: 1 }, { act: !1 }), t.key(n + s * 0.6, { size: 1 + 0.15 * i, squash: 1 + 0.15 * i }, { act: !1, easing: "ease-out" }), t.key(n + s, { size: 1, squash: 1 }), { end: n + s, contact: n };
    }
  },
  vanish: {
    summary: "Shrinks away to nothing, with a little stretch first (`for` ms, default 400).",
    uses: ["for"],
    run(t, e, n) {
      const s = e.for ?? 400, i = t.exaggeration;
      return t.key(n + s * 0.3, { size: 1 + 0.08 * i, squash: 1 + 0.12 * i }, { act: !1, easing: "ease-out" }), t.key(n + s, { size: 0, squash: 1 }, { act: !1, easing: "ease-in" }), { end: n + s, release: n + s };
    }
  }
};
function Vo(t) {
  return { ...fh, ...t.actions };
}
const Ti = (t) => typeof t == "number" && Number.isFinite(t);
function Py(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Vo(e), s = Object.keys(n), i = [];
  return t.forEach((o, r) => {
    const a = (c) => i.push({ level: "error", beat: r, message: c });
    if (!o || typeof o != "object" || Array.isArray(o)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = o;
    for (const c of Object.keys(l))
      io.includes(c) || a(pt("beat field", c, io, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(pt(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(Ti(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !Ti(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !Ti(l.toward) && !(typeof l.toward == "string" && l.toward in oo)) {
      const c = typeof l.toward == "string" ? rs(l.toward, Object.keys(oo)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), i;
}
function _y(t, e, n, s = {}) {
  const i = Py(n, e).filter((k) => k.level === "error");
  if (i.length > 0) throw new Error(`propScript (${e.kind}): ${i.length} problem(s) in the beats:
${i.map((k) => `  beat ${k.beat}: ${k.message}`).join(`
`)}`);
  const o = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = Vo(e), h = {};
  for (const k of [...Object.keys(In), ...Object.keys(e.rig.controls)]) h[k] = s.start?.[k] ?? gt(e.rig, {}, k);
  const u = [{ time: 0, pose: { ...h } }], d = /* @__PURE__ */ new Map(), f = [];
  let g = o, p = r;
  const m = (k, O, $, P) => {
    const L = d.get(k) ?? [{ time: 0, value: k === "x" || k === "y" ? 0 : h[k] }];
    L.push({ time: O, value: $, ...P ? { easing: P } : {} }), d.set(k, L), k !== "x" && k !== "y" && (h[k] = $);
  }, y = (k, O) => {
    const $ = k === "x" ? g - o : k === "y" ? p - r : h[k], P = d.get(k);
    (!P || P[P.length - 1].time < O) && m(k, O, $);
  }, w = {
    prop: e,
    scale: a,
    exaggeration: l,
    get x() {
      return g;
    },
    get floor() {
      return p;
    },
    values: h,
    facing() {
      const k = Math.sin(h.turn * Math.PI / 2);
      return Math.abs(k) < 0.5 ? 0 : k > 0 ? 1 : -1;
    },
    key(k, O, $ = {}) {
      Object.assign(h, O), u.push({ time: k, pose: { ...h }, ...$.act === !1 ? { act: !1 } : {}, ...$.easing ? { easing: $.easing } : {} });
    },
    move(k, O, $, P = {}) {
      y("x", k), m("x", O, $ - o, P.easing), g = $, P.floor !== void 0 && (y("y", k), m("y", O, P.floor - r, P.easing), p = P.floor);
    },
    set(k, O, $, P) {
      m(k, O, $, P);
    },
    turnTo(k, O) {
      const $ = typeof O == "number" ? O : oo[O], P = h.turn, _ = [$ - 4, $, $ + 4].map((D) => ({ t: D, d: Math.abs(D - P) })).sort((D, Y) => D.d - Y.d || Math.abs(D.t) - Math.abs(Y.t))[0];
      if (_.d < 1e-3) return k;
      const R = k + $y * Math.max(1, _.d);
      return w.key(R, { turn: _.t }), R;
    },
    effect(k) {
      f.push(k);
    },
    anchor(k) {
      const $ = Ns(e, h, a).anchors[k];
      if (!$) throw new Error(`${e.kind}: no anchor "${k}"`);
      return { x: g + $.point.x, y: p + $.point.y };
    }
  }, b = [];
  let v = 0;
  for (const k of n) {
    const O = Math.max(k.at ?? v, u[u.length - 1].time), $ = c[k.do].run(w, k, O);
    $.end > u[u.length - 1].time && u.push({ time: $.end, pose: { ...h } }), b.push({ start: O, end: $.end, ...$.contact !== void 0 ? { contact: $.contact } : {}, ...$.release !== void 0 ? { release: $.release } : {} }), v = $.end;
  }
  const M = Uc(s.style ?? "snappy"), x = { ...M, anticipation: M.anticipation * l, overshoot: M.overshoot * l }, T = Bo(Cy(u), e.acting, { style: x }), A = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(T).filter(([k]) => !d.has(k)).map(([k, O]) => ({ id: `${t}-${k}`, target: t, property: k, keyframes: O })),
    ...[...d].map(([k, O]) => ({ id: `${t}-${k}`, target: t, property: k, keyframes: Ry(O) }))
  ];
  for (const k of Iy(t, e, A, v, u[0].pose)) {
    const O = A.findIndex((L) => L.property === k.property);
    if (O < 0) {
      A.push(k);
      continue;
    }
    const $ = new Kt({ id: `${t}-own`, tracks: [A[O]] }), P = (L) => Number($.getStateAtTime(L).values.get(t)?.get(k.property) ?? 0);
    A[O] = { ...k, keyframes: k.keyframes.map((L) => ({ time: L.time, value: Number(L.value) + P(L.time) })) };
  }
  return { tracks: A, duration: v, beats: b, effects: f };
}
const Oy = 1500;
function Iy(t, e, n, s, i) {
  if (!e.follow?.length) return [];
  const o = new Kt({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = o.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : i[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + Oy, c = ju((d) => r(d, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, u = c.map(({ time: d, value: f }) => {
      const g = Math.sin(r(d, "turn") * Math.PI / 2), p = (f - r(d, a.of)) * g;
      return { time: d, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: u };
  });
}
const Hy = 20;
function Cy(t) {
  const e = [...t].sort((s, i) => s.time - i.time), n = [];
  for (const s of e) {
    const i = n[n.length - 1];
    i && s.time - i.time < Hy ? n[n.length - 1] = { ...s, time: i.time } : n.push(s);
  }
  return n;
}
function Ry(t) {
  const e = t.map((s, i) => ({ k: s, i })).sort((s, i) => s.k.time - i.k.time || s.i - i.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const Ly = {
  linear: !0,
  "ease-in": !0,
  "ease-out": !0,
  "ease-in-out": !0,
  "ease-in-quad": !0,
  "ease-out-quad": !0,
  "ease-in-out-quad": !0,
  "ease-in-cubic": !0,
  "ease-out-cubic": !0,
  "ease-in-out-cubic": !0
};
function Fy(t, e = {}) {
  const n = {};
  for (const s of Object.keys(Ct)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(Nt)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(_e)) n[s] = { summary: `The ${s} gag (${Ms(s)} ms).` };
  for (const [s, i] of Object.entries(Ls)) n[s] = { ...i };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(Ly),
      parametric: {
        "cubic-bezier": '{ type: "cubic-bezier", points: [x1, y1, x2, y2] }',
        steps: '{ type: "steps", count, position?: start | end | none | both }',
        elastic: '{ type: "elastic", mode?: in | out | in-out, amplitude?, period? }',
        bounce: '{ type: "bounce", mode?: in | out | in-out }',
        back: '{ type: "back", mode?: in | out | in-out, overshoot? }'
      }
    },
    trackKinds: {
      keyframe: "{ id, target, property, keyframes: [{ time, value, easing? }] }: values between keys are interpolated (numbers, colours, paths)",
      spring: '{ id, target, property, kind: "spring", spring: { from, to, stiffness?, damping?, mass?, velocity? }, delay? }: physics settle',
      inertia: '{ id, target, property, kind: "inertia", inertia: { from, velocity, friction?, min?, max?, end? }, delay? }: a flick that slows (end snaps to a value or the nearest of a list)',
      motionPath: '{ property: "motionPath", path, align? }: moves along an SVG path',
      text: '{ property: "text", … }: types or scrambles text'
    },
    canvasProperties: qo,
    stickFigure: {
      poseFields: Xl,
      props: Ul,
      handFields: Vl,
      poses: Object.keys(Nt),
      expressions: Object.keys(ut),
      gags: Object.fromEntries(Object.keys(_e).map((s) => [s, Ms(s)])),
      gaits: Object.keys(Ct),
      actingStyles: Object.keys(Ke),
      beatFields: to,
      actions: n,
      dances: Object.fromEntries(Object.entries(Oe).map(([s, i]) => [s, Object.keys(i.moves)])),
      flips: Object.fromEntries(Object.entries(Hs).map(([s, i]) => [s, i.label])),
      handShapes: Object.keys(Et),
      mudras: Object.keys(Yi)
    },
    props: {
      api: {
        "car() · truck() · bus() · tractor() · cart() · trainCar() · bike() · motorbike()": "wheeled vehicles (vehicle(spec) makes your own)",
        "tree() · house()": "environment (tree(spec), house(spec))",
        "helicopter() · airplane()": "aircraft",
        "horse() · dog() · cat() · cow()": "animals (quadruped(spec) makes your own): gaits with footfall patterns keyed in step with the distance, sit, jump, their calls, species actions",
        "songbird() · crow() · chicken()": "birds (bird(spec) makes your own): hop, walk, peck, flap, fly and land (a chicken flutters), their calls; wings fold and beat in rhythm",
        "{ kind: 'prop', prop: 'car', position, rotation, values } with loadScene3D(scene, { kinds: [characterObjects, propObjects] })": "props in 3D scenes, by preset name, seen in perspective by the scene camera; controls are tracks on the object",
        "characterScript3D(id, beats, { scene, position?, heading?, height?, pose? })": "a v2 character in a 3D scene in world metres: gaits to [x, z] or through points (its walk phase keyed with the distance), face, hold, pose, gag; checkCharacterBeats3D checks the beats",
        "propRide3D({ prop, propId, propTracks, scene, placement, anchor, riderId, pose, start, end, mount?, dismount? })": "a character riding a prop in a 3D scene: hips on a seat anchor (saddle, seat) as it moves, hopping on and off; RIDING_POSES.astride / .seated",
        "propScript3D(id, prop, beats, { scene, position?, heading?, values? })": "props scripted in world metres for 3D scenes: moves to [x, z] or through points (wheels and strides keyed with the distance), face, hold, and their actions; checkPropBeats3D checks the beats",
        "propPreset(name, options?)": "a prop preset by name (did-you-mean on a wrong one)",
        "propTarget({ …, style: 'stick' })": "line art to go with stick figures: tubes as single strokes, shapes outlined over paper",
        "propTow({ leader, leaderId, leaderTracks, hitch, towed, towedId, anchor, start, end })": "a prop towed by another (a cart behind a horse): turns with it, its wheels roll exactly",
        "propTarget({ x, y, prop, scale?, values?, look?, ink? })": "a canvas target that draws a prop (x, y: its middle on the ground; scale px per metre, default 60)",
        "propScript(id, prop, beats, { from, ground, scale, style?, exaggeration?, start? })": "beats → acted tracks, with contact times and effect cues; checkPropBeats(beats, prop) checks them",
        "drawProp(ctx, target, frame, id, { rider? })": "draw it as it is in a frame (a rider is drawn between its far and near parts)",
        "propAt(target, frame, id).anchor(name)": "where an anchor (seat, door, chimney…) is, in scene px",
        "propRide({ prop, propId, propTracks, anchor, figure, figureId, start, end, offset? })": "a figure carried at an anchor, turning with the prop; spliceTracks() puts it into the figure’s tracks",
        "drawPropEffects(ctx, effects, time)": "dust, exhaust, skid marks, honk lines, leaves, smoke"
      },
      beatFields: io,
      commonControls: Object.fromEntries(Object.entries(In).map(([s, i]) => [s, `${i.description}${i.unit ? ` (${i.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(fh).map(([s, i]) => [s, i.summary])),
      presets: Object.fromEntries(
        Object.entries(An).map(([s, i]) => {
          const o = i();
          return [
            s,
            {
              family: o.family,
              summary: o.summary,
              actions: Object.fromEntries(Object.entries(o.actions).map(([r, a]) => [r, { summary: a.summary, ...a.needs ? { needs: a.needs } : {} }])),
              controls: Object.keys(o.rig.controls),
              anchors: Object.keys(o.rig.anchors ?? {})
            }
          ];
        })
      )
    },
    custom: {
      api: {
        "defineAction({ summary, needs?, steps: (from, beat) => [{ after, pose, easing? }] })": "a new action written as timed pose steps from the current pose, like a gag",
        "defineAction({ summary, needs?, beats: (beat) => [beats] })": "a new action built from other beats (which may be custom too)",
        "defineGait({ swing, knee, arm, elbow, lean, cycle?, … })": "a new gait (the Gait fields in degrees; cycle is ms per two steps)",
        "scriptTracks(id, beats, { actions, gaits })": "beats may then use those names; checkBeats(beats, { actions, gaits }) knows them",
        "stickFigureTarget({ …, cast: { actions, gaits } })": "a figure that draws the gaits and lists the actions in describeTarget",
        "persona({ name, summary?, height?, look?, acting?, gait?, mood?, stance?, energy?, actions?, gaits? })": "a character’s look, acting style and habits: .figure({ x, y }), .script(id, beats, { from, ground }), .check(beats), .handPath(…), .describe(); `go` walks in its gait, `stand` returns to its stance and face"
      },
      actions: Object.fromEntries(Object.entries(e.actions ?? {}).map(([s, i]) => [s, { summary: i.summary, ...i.needs ? { needs: i.needs } : {} }])),
      gaits: Object.fromEntries(Object.entries(e.gaits ?? {}).map(([s, i]) => [s, i.summary ?? "custom gait"]))
    },
    character: { poses: Object.keys(Ze), expressions: Object.keys(wc), gags: Object.keys(jo) },
    codePanel: {
      languages: Zi,
      removeStyles: Ji,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: Xc
    },
    cameraShots: {
      frame: "{ at, duration?, easing?, frame: { focus?: { x, y }, scale?, rotate? } }: push in, pull out, or cut (duration 0)",
      shake: "{ at, duration, shake: { strength?, frequency?, roll?, seed? } }",
      follow: "{ at, until, follow: { x: <the subject’s x keyframes>, lead?, y?, lag?, scale? } }: keeps a subject centred"
    },
    teach: {
      "lesson({ id })": "steps as timeline JSON: to, set, together, wait, marker (with pause, question, captions)",
      "cells, pointer, stack, queue, table, pipeline": "diagram primitives (SVG markup + step helpers)",
      "figure({ width, height, children })": "the SVG holding the pieces"
    },
    cli: {
      "tinyfly capabilities [--json]": "this catalog",
      "tinyfly check <beats.json>": "check a beat script (names, fields) with suggestions",
      "tinyfly validate <timeline.json> [--markup file]": "check a timeline against its markup",
      "tinyfly render <timeline.json> <markup> [--at …]": "a frame as static markup",
      "tinyfly video <scene.mjs> [--stills dir --times …]": "MP4, or PNG stills to look at"
    }
  };
}
const At = (t) => t.map((e) => `\`${e}\``).join(", "), Za = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function Kw(t, e = {}) {
  const n = Fy(t, e), s = n.stickFigure;
  return [
    `# tinyfly capabilities${n.version ? ` (v${n.version})` : ""}`,
    "",
    "Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).",
    "",
    `**Timing.** ${n.timing}`,
    "",
    "## Easings",
    "",
    `Named: ${At(n.easings.named)}.`,
    "",
    ...Object.entries(n.easings.parametric).map(([o, r]) => `- ${o}: \`${r}\``),
    "",
    "## Track kinds",
    "",
    ...Object.entries(n.trackKinds).map(([o, r]) => `- **${o}**: ${r}`),
    "",
    "## Canvas targets",
    "",
    "Types: `rect`, `circle`, `text`, `line`, `path`, `image`, `custom`. `describeTarget(target)` lists what one can animate with its values; `checkTracks(tracks, targets)` checks tracks before playing them.",
    "",
    "| Property | Unit | What it does | Types |",
    "|---|---|---|---|",
    ...Object.entries(n.canvasProperties).map(
      ([o, r]) => `| \`${o}\` | ${r.unit ?? r.kind ?? ""} | ${r.description} | ${r.types.length === 7 ? "all" : r.types.join(", ")} |`
    ),
    "",
    "## Stick figure (`@algorisys/tinyfly/characters`)",
    "",
    "`stickFigureTarget({ x, y, style })` is a custom canvas target; its props are the pose fields and the props below. Pose it with tracks (`poseTracks`), or write beats (`scriptTracks`).",
    "",
    "### Pose fields",
    "",
    "| Field | Unit | What it does |",
    "|---|---|---|",
    Za(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Za(s.props),
    "",
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${At(Object.keys(s.handFields))}.`,
    "",
    `**Poses** (a beat's \`do\`, or a pose key): ${At(s.poses)}.`,
    "",
    `**Expressions** (a beat's \`mood\`): ${At(s.expressions)}.`,
    "",
    `**Gags** (ms): ${Object.entries(s.gags).map(([o, r]) => `\`${o}\` (${r})`).join(", ")}.`,
    "",
    `**Gaits**: ${At(s.gaits)}. **Acting styles** (\`style\`): ${At(s.actingStyles)}.`,
    "",
    "### Beat scripts",
    "",
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${At(s.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
    "",
    "| `do` | Needs | What happens |",
    "|---|---|---|",
    ...Object.entries(s.actions).map(([o, r]) => `| \`${o}\` | ${(r.needs ?? []).map((a) => `\`${a}\``).join(", ")} | ${r.summary} |`),
    "",
    "Beats that touch something report `contact` (and `release`) times in `result.beats[i]`; key the thing they touch to those.",
    "",
    `**Dances** (\`dancer(style, { move })\`): ${Object.entries(s.dances).map(([o, r]) => `\`${o}\` (${r.join(", ")})`).join("; ")}.`,
    "",
    `**Flips**: ${Object.entries(s.flips).map(([o, r]) => `\`${o}\` (${r})`).join(", ")}.`,
    "",
    `**Hand shapes**: ${At(s.handShapes)}. **Mudras**: ${At(s.mudras)}.`,
    "",
    "### Your own actions, gaits and personas",
    "",
    "Nothing is registered globally: pass your definitions where they are used.",
    "",
    ...Object.entries(n.custom.api).map(([o, r]) => `- \`${o}\`: ${r}`),
    "",
    ...Object.keys(n.custom.actions).length || Object.keys(n.custom.gaits).length ? [
      "**This cast’s own:**",
      "",
      ...Object.entries(n.custom.actions).map(([o, r]) => `- \`${o}\`${r.needs?.length ? ` (needs ${r.needs.map((a) => `\`${a}\``).join(", ")})` : ""}: ${r.summary}`),
      ...Object.entries(n.custom.gaits).map(([o, r]) => `- \`${o}\` (gait): ${r}`),
      ""
    ] : [],
    "## Props (everyday objects with behaviours)",
    "",
    "A prop is a 3D rig of simple parts drawn with the characters’ pens (clean, pencil, silhouette), so it turns toward the camera (`turn`), and its beats go through the same acting pass (anticipation, overshoot, overlap; `exaggeration` scales them).",
    "",
    ...Object.entries(n.props.api).map(([o, r]) => `- \`${o}\`: ${r}`),
    "",
    `Prop beat fields: ${At(n.props.beatFields)}. Every prop has the controls ${Object.keys(n.props.commonControls).map((o) => `\`${o}\``).join(", ")} and the actions ${Object.keys(n.props.commonActions).map((o) => `\`${o}\``).join(", ")}.`,
    "",
    "| Preset | Family | Actions (needs) | Controls | Anchors |",
    "|---|---|---|---|---|",
    ...Object.entries(n.props.presets).map(
      ([o, r]) => `| \`${o}()\` | ${r.family} | ${Object.entries(r.actions).map(([a, l]) => `\`${a}\`${l.needs?.length ? ` (${l.needs.join(", ")})` : ""}`).join(", ")} | ${r.controls.map((a) => `\`${a}\``).join(", ")} | ${r.anchors.join(", ")} |`
    ),
    "",
    "## Character (v2 human)",
    "",
    `Poses: ${At(n.character.poses)}. Expressions: ${At(n.character.expressions)}. Gags: ${At(n.character.gags)}.`,
    "",
    "## Code panel",
    "",
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${At(n.codePanel.languages)}. Remove styles: ${At(n.codePanel.removeStyles)}.`,
    "",
    ...Object.entries(n.codePanel.anchors).map(([o, r]) => `- \`${o}\`: ${r}`),
    "",
    ...Object.values(n.codePanel.edits).map((o) => `- \`${o.split(":")[0]}\`:${o.split(":").slice(1).join(":")}`),
    "",
    "## Camera shots (`cameraTracks(shots, { stage })`)",
    "",
    ...Object.entries(n.cameraShots).map(([o, r]) => `- **${o}**: \`${r}\``),
    "",
    "## Teaching (`@algorisys/tinyfly/teach`)",
    "",
    ...Object.entries(n.teach).map(([o, r]) => `- \`${o}\`: ${r}`),
    "",
    "## Command line",
    "",
    ...Object.entries(n.cli).map(([o, r]) => `- \`${o}\`: ${r}`),
    ""
  ].join(`
`);
}
function zw(t, e, n, s = {}) {
  const i = s.color ?? "#555", o = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = Vt(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? Lm(t, { x: r.x, y: r.y }, a, { size: o, color: i, seed: l }) : r.kind === "exhaust" ? Wy(t, r, a, o, i, l) : r.kind === "skid" ? jy(t, r, a, n, i) : r.kind === "honk" ? By(t, r, a, o, i) : r.kind === "smoke" ? Dy(t, r, n, o, i) : r.kind === "leaves" && Ny(t, r, a, o, s.leafColor ?? "#5cae5a", i, l);
  }
}
function Dy(t, e, n, s, i, o) {
  const r = e.direction ?? 1, a = 380, l = 1500;
  t.save(), t.strokeStyle = i, t.lineWidth = Math.max(1, s * 0.025);
  for (let c = e.time; c <= e.time + e.length - l; c += a) {
    const h = (n - c) / l;
    if (h <= 0 || h >= 1) continue;
    const u = Math.sin(c / 97 + h * 4) * s * 0.06, d = e.x + r * h * s * 0.7 + u, f = e.y - h * s * 1.6;
    t.globalAlpha = Math.min(1, h * 6) * (1 - h) * 0.85, t.beginPath(), t.arc(d, f, s * (0.07 + h * 0.2), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function Ny(t, e, n, s, i, o, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = o, t.fillStyle = i;
  for (let c = 0; c < 4; c++) {
    const h = Vt(`${r}:${c}`) % 1e3 / 1e3, u = Math.min(1, n * (1.1 + h * 0.4)), d = e.x + (h - 0.5) * s * 1.2, f = e.y + (h - 0.3) * s * 0.4, g = u * u * 0.4 + u * 0.6, p = d + a * u * s * (0.6 + h) + Math.sin(u * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, f + (l - f) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(u * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function Wy(t, e, n, s, i, o) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = i, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (Vt(`${o}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, u = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, u, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function jy(t, e, n, s, i) {
  const o = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (o - e.x) * r;
  t.save(), t.strokeStyle = i, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function By(t, e, n, s, i) {
  const o = e.direction ?? 1;
  t.save(), t.strokeStyle = i, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + o * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, o > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, o > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function Xw(t) {
  const e = new Kt({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], i = [], o = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const u = Uo(t.prop, { state: e.getStateAtTime(h) }, t.propId), d = u.anchor(t.anchor);
    s.push({ time: h, value: d.x + (t.offset?.x ?? 0) - t.figure.x }), i.push({ time: h, value: d.y + (t.offset?.y ?? 0) - t.figure.y });
    const f = Math.sin(u.values.turn * Math.PI / 2);
    if (Math.abs(f) > 0.15 && (a = f > 0 ? 1 : -1), o.push({ time: h, value: Math.abs(f) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: i }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: o }, { id: `${l}-facing`, target: l, property: "facing", keyframes: qy(r) }), c;
}
function qy(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function Uw(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, i = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = i.get(s(r));
    if (!a) return r;
    i.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, u) => h.time - u.time);
    return { ...r, keyframes: c };
  }), ...i.values()];
}
function Vw(t) {
  const e = new Kt({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((f) => f.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, i = s.x + s.width / 2, o = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = o.wheelSpin ?? 0, u;
  for (let f = t.start; ; f = Math.min(t.end, f + n)) {
    const g = Uo(t.leader, { state: e.getStateAtTime(f) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, y = Ns(s.prop, { ...o, turn: m }, s.propScale).anchors[t.anchor];
    if (!y) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const w = p.x - y.point.x;
    if (u !== void 0 && r) {
      const b = Math.sin(m * Math.PI / 2);
      h += (w - u) * (b || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (u = w, a.push({ time: f, value: w - i }), l.push({ time: f, value: m }), c.push({ time: f, value: h }), f >= t.end) break;
  }
  const d = t.towedId;
  return [
    { id: `${d}-x`, target: d, property: "x", keyframes: a },
    { id: `${d}-turn`, target: d, property: "turn", keyframes: l },
    ...r ? [{ id: `${d}-wheelSpin`, target: d, property: "wheelSpin", keyframes: c }] : []
  ];
}
const Qa = /* @__PURE__ */ new WeakMap();
function Yy(t, e) {
  const n = e?.some(Boolean) ? e.map((d) => d ? 1 : 0).join("") : "";
  let s = Qa.get(t);
  s || Qa.set(t, s = /* @__PURE__ */ new Map());
  const i = s.get(n);
  if (i) return i;
  const o = Ss(t), r = { vertices: o.vertices, faces: o.faces.filter((d, f) => !e?.[f]) }, a = r.vertices.flatMap((d) => [d[0], d[1], d[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((d) => {
    for (const p of d.corners) for (const m of [0, 1, 2]) l[p][m] += d.normal[m];
    const [f, ...g] = d.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, y, w] = [f, g[p], g[p + 1]], [b, v, M] = [r.vertices[m], r.vertices[y], r.vertices[w]], x = [v[0] - b[0], v[1] - b[1], v[2] - b[2]], T = [M[0] - b[0], M[1] - b[1], M[2] - b[2]], A = [x[1] * T[2] - x[2] * T[1], x[2] * T[0] - x[0] * T[2], x[0] * T[1] - x[1] * T[0]], k = A[0] * d.normal[0] + A[1] * d.normal[1] + A[2] * d.normal[2];
      c.push(...k >= 0 ? [m, y, w] : [m, w, y]);
    }
  });
  const h = l.flatMap((d) => {
    const f = Math.hypot(...d) || 1;
    return [d[0] / f, d[1] / f, d[2] / f];
  }), u = bs({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, u), u;
}
function Ky(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", i = (n.outline ?? 2) * (t.outline ?? 1), o = t.glow && e.glow > 0 ? zy(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: Ss(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...i > 0 ? { outline: { width: i, color: s } } : {},
    ...o ? { emissive: o } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function zy(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((i) => Math.round(parseInt(n[1].slice(i, i + 2), 16) * Math.max(0, Math.min(1, e)))).map((i) => i.toString(16).padStart(2, "0")).join("")}` : t;
}
const Xy = bs(Sc(1, 2e-3, 28));
function Uy(t, e, n) {
  const s = t.rig, [i, o] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, gt(s, e, "lift")), a = Math.max(0, gt(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: Xy,
    world: bt(n, go([0, 4e-3, 0], [0, 0, 0, 1], [i * 0.55 * a || 1e-4, 1, o * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const Vy = /* @__PURE__ */ new Set([
  "x",
  "y",
  "z",
  "position",
  "rotateX",
  "rotateY",
  "rotateZ",
  "quaternion",
  "scale",
  "scaleX",
  "scaleY",
  "scaleZ",
  "visible",
  "opacity",
  "color"
]), Gy = 1, Gw = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in An ? [] : [pt("prop preset", e.prop, Object.keys(An))];
    for (const [s, i] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      i in e && n.push(`${i} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((o) => o === s ? e[i] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return Ey(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: i, lights: o = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [T, A] of n)
      typeof A == "number" && !Vy.has(T) && (h[T] = A);
    h.turn = 0, h.tilt = 0;
    const u = bt(i.view, s), d = {
      toView: (T) => Ht(u, T),
      toScreen: (T) => a(T)
    }, f = d.toView([0, c.rig.height / 2, 0]);
    if (-f[2] <= i.near) return null;
    if (l.look === "mesh") {
      const T = D1(c.rig, h), A = T.map(({ part: $, local: P }) => ({ part: $.id, mesh: Ss($.shape), ...Yo(Ss($.shape), P) })), k = oh(A), O = T.map(($, P) => ({ ...$, hidden: rh($.part.id, A[P].mesh, $.local, A[P].key, k) })).filter(({ opacity: $ }) => $ > 0.01).map(({ part: $, matrix: P, glow: L, opacity: _, hidden: R }) => ({
        mesh: Yy($.shape, R),
        world: bt(s, P),
        material: Ky($, { glow: L, opacity: _ }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? O : [Uy(c, h, s), ...O] };
    }
    const g = a(f), p = a(d.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), y = o.length === 0 ? void 0 : (T, A) => {
      const k = Ht(s, T), O = [s[0] * A[0] + s[4] * A[1] + s[8] * A[2], s[1] * A[0] + s[5] * A[1] + s[9] * A[2], s[2] * A[0] + s[6] * A[1] + s[10] * A[2]], $ = Math.hypot(...O) || 1;
      return { light: Pc(k, [O[0] / $, O[1] / $, O[2] / $], o), fog: _c(r, Math.hypot(k[0] - i.position[0], k[1] - i.position[1], k[2] - i.position[2])) };
    }, w = ah(c.rig, h, d, m, { perspective: !0, near: i.near, slice: Gy, light: y }), b = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, v = Ic(w), M = w.cells ?? [], x = Math.max(...M.map((T) => -T.depth), -f[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: x + c.rig.length, draw: (T) => Hc(T, w, b) }],
        ...M.map((T) => ({
          depth: -T.depth,
          draw(A, k) {
            A.lineCap = "round", A.lineJoin = "round", Ig(A, T.parts, v, { ...b, time: k.time });
          }
        }))
      ]
    };
  }
}, tl = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], Jy = 0.25, Zy = 800 / 180, Qy = 220, tb = 300, eb = ["turn"];
function nb(t) {
  const e = Vo(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !eb.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function sb(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = nb(e), i = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], o = [];
  return t.forEach((r, a) => {
    const l = (u) => o.push({ beat: a, message: u });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${i[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const u of Object.keys(c)) tl.includes(u) || l(pt("beat field", u, tl, h[u]));
    if (typeof c.do != "string" || !i.includes(c.do)) {
      const u = c.do === "turn" ? "face" : void 0;
      return l(pt(`${e.kind} 3D beat`, c.do, i, u));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !ve(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(ve)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(ve(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), o;
}
function Jw(t, e, n, s) {
  const i = sb(n, e);
  if (i.length > 0) throw new Error(`propScript3D (${e.kind}): ${i.length} problem(s) in the beats:
${i.map((b) => `  beat ${b.beat}: ${b.message}`).join(`
`)}`);
  const o = {};
  for (const b of [...Object.keys(In), ...Object.keys(e.rig.controls)]) o[b] = s.values?.[b] ?? gt(e.rig, {}, b);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (b, v, M, x = "linear") => {
    const T = c.get(b) ?? [];
    T.push({ time: v, value: M, easing: x }), c.set(b, T);
  }, u = (b, v, M) => h(b, v, M);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const d = (b, v) => {
    const M = ks(l, v);
    if (Math.abs(M) < 1) return b;
    const x = Math.max(Qy, Math.abs(M) * Zy);
    return u("rotateY", b, l), l += M, h("rotateY", b + x, l, "ease-in-out"), b + x;
  }, f = (b, v, M) => {
    const x = Nc([[r, a], ...v.through ?? [v.to]]);
    if (x.length < 2) return M;
    const T = d(M, Ye(x[0].point, x[1].point)), A = x[x.length - 1].at, k = v.for ?? A / (v.speed ?? b.speed) * 1e3, O = $t("ease-in-out"), $ = Math.min(tb, k / 4);
    for (const [Y, j] of Object.entries(b.set ?? {}))
      u(Y, T, o[Y]), h(Y, T + 1, j), o[Y] = j;
    const P = b.flies ? v.height ?? (o.lift > 0.05 ? o.lift : 2) : void 0, L = P !== void 0 && P > 0.05;
    for (const [Y, j] of Object.entries(b.hold ?? {}))
      u(Y, T, o[Y]), h(Y, T + $, j, "ease-out"), L || (h(Y, T + k - $, j), h(Y, T + k, 0, "ease-in")), o[Y] = L ? j : 0;
    P !== void 0 && (u("lift", T, o.lift), h("lift", T + Math.min(k * 0.35, 1400), P, "ease-out"), h("lift", T + k, P), o.lift = P);
    const _ = { ...o };
    let R = l;
    for (let Y = 0; ; Y = Math.min(A, Y + Jy)) {
      const j = T + jc(O, Y / A) * k, { point: U, direction: G } = Wc(x, Y);
      R += ks(R, Ye([0, 0], G)), h("x", j, U[0]), h("z", j, U[1]), h("rotateY", j, R);
      for (const [E, H] of Object.entries(b.perMetre ?? {})) h(E, j, _[E] + Y * H);
      for (const [E, H] of Object.entries(b.perSecond ?? {})) h(E, j, _[E] + (j - T) / 1e3 * H);
      if (Y >= A) break;
    }
    for (const [Y, j] of Object.entries(b.perMetre ?? {})) o[Y] = _[Y] + A * j;
    for (const [Y, j] of Object.entries(b.perSecond ?? {})) o[Y] = _[Y] + k / 1e3 * j;
    return [r, a] = x[x.length - 1].point, l = R, T + k;
  }, g = (b, v) => {
    const M = Object.fromEntries(Object.entries(b).filter(([T]) => !["at", "to", "through", "toward"].includes(T))), x = _y(t, e, [M], { start: { ...o, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const T of x.tracks) {
      if (ib.includes(T.property)) continue;
      const A = T.keyframes ?? [], k = o[T.property];
      if (!A.every((O) => O.value === k)) {
        u(T.property, v, k);
        for (const O of A) O.time > 0 && c.get(T.property).push({ ...O, time: v + O.time });
        o[T.property] = A[A.length - 1].value;
      }
    }
    return v + x.duration;
  }, p = [];
  let m = 0;
  for (const b of n) {
    const v = b.at ?? m;
    let M = v;
    const x = e.moves?.[b.do];
    x ? M = f(x, b, v) : b.do === "face" ? M = d(v, typeof b.toward == "number" ? b.toward : Ye([r, a], b.toward)) : b.do === "hold" ? M = v + (b.for ?? 1e3) : M = g(b, v), p.push({ do: b.do, start: v, end: M }), m = M;
  }
  const y = `${s.scene}/${t}`;
  return { tracks: [...c].map(([b, v]) => ({
    id: `${t}-${b}`,
    target: y,
    property: b,
    keyframes: Dc(v)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...o } } };
}
const ib = ["x", "y", "turn", "facing", "tilt"], ob = 0.35, rb = {
  seated: Ze.sit,
  astride: { ...Ze.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 }
}, el = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function Zw(t) {
  const e = `${t.scene}/${t.propId}`, n = new Kt({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [i, o, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = Tc({ ...t.character, height: 1 }), c = { ...mt, ...t.pose ?? rb.seated }, h = Io(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, u = t.facing ?? 0, d = t.every ?? 33, f = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + d)) {
    const y = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), w = (_, R) => {
      const D = y.get(_);
      return typeof D == "number" ? D : R;
    }, b = { ...s.values };
    for (const _ of Object.keys(a.controls)) b[_] = w(_, s.values?.[_] ?? gt(a, {}, _));
    for (const _ of ["pitch", "roll", "squash", "lift", "lean", "size"]) b[_] = w(_, s.values?.[_] ?? gt(a, {}, _));
    const v = N1(a, b)[t.anchor];
    if (!v) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const M = w("rotateY", s.heading ?? 0), x = el(v, M), T = [w("x", i) + x[0], w("y", o) + x[1], w("z", r) + x[2]], A = M + u, k = el(h, A);
    let O = [T[0] - k[0], T[1] - k[1], T[2] - k[2]];
    const $ = (_, R) => {
      const D = R * R * (3 - 2 * R);
      return [_[0] + (O[0] - _[0]) * D, O[1] * D + ob * Math.sin(Math.PI * R), _[1] + (O[2] - _[1]) * D];
    }, P = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, L = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + P ? O = $(t.mount.from, (m - t.start) / P) : t.dismount && m > t.end - L && (O = $(t.dismount.to, (t.end - m) / L)), f.x.push({ time: m, value: O[0] }), f.y.push({ time: m, value: O[1] }), f.z.push({ time: m, value: O[2] }), f.rotateY.push({ time: m, value: A }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(f).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: f[m] }));
}
function Qw(t) {
  const { timeline: e } = t, n = new xe();
  for (const [c, h] of Object.entries(t.targets)) {
    const u = typeof h == "string" ? document.querySelector(h) : h;
    if (!u)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, u);
  }
  e.onUpdate = (c) => {
    n.applyState(c), t.onUpdate?.(c);
  }, t.onComplete && (e.onComplete = t.onComplete);
  let s = null, i = null, o = !1;
  const r = (c) => {
    if (o) return;
    const h = i === null ? 0 : c - i;
    i = c, h > 0 && e.tick(h), s = requestAnimationFrame(r);
  }, a = () => {
    s !== null || o || (i = null, s = requestAnimationFrame(r));
  }, l = () => {
    s !== null && cancelAnimationFrame(s), s = null, i = null;
  };
  return n.applyState(e.getStateAtTime(e.currentTime)), t.autoplay !== !1 && (e.play(), a()), {
    timeline: e,
    adapter: n,
    play() {
      e.play(), a();
    },
    pause() {
      e.pause(), l();
    },
    restart() {
      e.stop(), e.play(), a();
    },
    seek(c) {
      e.seek(c * 1e3), n.applyState(e.getStateAtTime(e.currentTime));
    },
    destroy() {
      o = !0, l(), e.stop(), n.clearTargets();
    }
  };
}
const tk = {
  timeline: wd,
  to(t, e, n) {
    const s = new Be(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new Be(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const i = new Be(s);
    return i.fromTo(t, e, n), i;
  },
  set(t, e, n) {
    const s = new Be(n);
    return s.set(t, e), s;
  }
};
function ph(t, e, n) {
  if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(e, n);
  const s = t.canvas;
  if (s?.ownerDocument) {
    const i = s.ownerDocument.createElement("canvas");
    return i.width = e, i.height = n, i;
  }
  try {
    return s?.constructor ? new s.constructor(e, n) : null;
  } catch {
    return null;
  }
}
function ab(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), i = Math.min(0.999, Math.max(0, e));
  for (let o = 0; o < n; o++) {
    const r = t[o * 4] / 255, a = t[o * 4 + 1] / 255, l = t[o * 4 + 2] / 255, c = t[o * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= i) continue;
    const u = (h - i) / (1 - i) * c / h;
    s[o * 3] = r * u, s[o * 3 + 1] = a * u, s[o * 3 + 2] = l * u;
  }
  return s;
}
function nl(t, e, n, s, i) {
  const o = new Float32Array(t.length), r = i ? n : e, a = i ? e : n, l = (h, u) => (i ? h * e + u : u * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let u = 0; u < 3; u++) {
      let d = 0;
      for (let f = -s; f <= s; f++) d += t[l(h, Math.min(a - 1, Math.max(0, f))) + u];
      for (let f = 0; f < a; f++) {
        o[l(h, f) + u] = d / c;
        const g = t[l(h, Math.max(0, f - s)) + u], p = t[l(h, Math.min(a - 1, f + s + 1)) + u];
        d += p - g;
      }
    }
  return o;
}
function sl(t, e, n, s) {
  const i = Math.max(1, Math.round(s / Math.sqrt(3)));
  let o = t;
  for (let r = 0; r < 3; r++)
    o = nl(o, e, n, i, !0), o = nl(o, e, n, i, !1);
  return o;
}
function ek(t, e = {}) {
  const n = t.canvas, s = n.width, i = n.height;
  if (!(s > 0 && i > 0)) return;
  const o = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / o)), a = Math.max(1, Math.ceil(i / o)), l = ph(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = ab(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, i) * 0.02) / o, d = sl(h, r, a, u), f = sl(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let y = 0; y < 3; y++) p.data[m * 4 + y] = Math.round(Math.min(1, d[m * 3 + y] + f[m * 3 + y] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, i), t.restore();
}
function nk(t, e, n) {
  const s = n.width ?? 6, i = n.taper ?? 1, o = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = cb(e, s, i, o, r);
    a ? (t.globalCompositeOperation = "lighter", ro(t, c, n.color)) : hb(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, lb(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function lb(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const i = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return i ? `rgba(${i[1]}, ${i[2]}, ${i[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function cb(t, e, n, s, i) {
  const o = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = Ku(o), a = zu(o) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = i * (1 - s * h);
    if (u <= 0) continue;
    const d = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...d && a && { cap: a } });
  }
  return l;
}
function ro(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [i, o, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(i.x, i.y), t.lineTo(o.x, o.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function hb(t, e, n) {
  const s = typeof t.getTransform == "function" ? t.getTransform() : null, i = (p) => s ? { x: s.a * p.x + s.c * p.y + s.e, y: s.b * p.x + s.d * p.y + s.f } : p, o = s ? Math.sqrt(Math.abs(s.a * s.d - s.b * s.c)) : 1, r = e.map((p) => ({
    ...p,
    corners: p.corners.map(i),
    ...p.cap && { cap: { ...p.cap, ...i(p.cap), radius: p.cap.radius * o, start: p.cap.start + (s ? Math.atan2(s.b, s.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, c = -1 / 0, h = -1 / 0;
  for (const p of r) {
    const m = p.cap ? [{ x: p.cap.x - p.cap.radius, y: p.cap.y - p.cap.radius }, { x: p.cap.x + p.cap.radius, y: p.cap.y + p.cap.radius }] : [];
    for (const y of [...p.corners, ...m])
      a = Math.min(a, y.x), l = Math.min(l, y.y), c = Math.max(c, y.x), h = Math.max(h, y.y);
  }
  if (!(c > a && h > l)) return;
  const u = Math.floor(a) - 1, d = Math.floor(l) - 1, f = s ? ph(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - d) : null, g = f?.getContext("2d");
  if (!f || !g) {
    ro(t, e, n);
    return;
  }
  g.translate(-u, -d), g.globalCompositeOperation = "lighter", ro(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(f, u, d), t.restore();
}
const sk = Wt.to, ik = Wt.from, ok = Wt.fromTo, rk = Wt.set, ak = Wt.timeline, lk = Wt.ticker, ck = Wt.splitText, hk = Wt.context, uk = Wt.matchMedia, dk = Wt.quickTo, fk = Wt.imageSequence, pk = Wt.pageTransition;
l0();
export {
  Ke as ACTING_STYLES,
  ch as AIRCRAFT_ACTING,
  Hn as ANIMAL_GAITS,
  to as BEAT_FIELDS,
  vy as BIRD_ACTING,
  qo as CANVAS_PROPERTIES,
  fa as CHARACTER_BEAT_3D_FIELDS,
  tm as CHARACTER_GAIT_SPEEDS,
  Zi as CODE_LANGUAGES,
  Xc as CODE_PANEL_EDITS,
  um as CODE_THEME,
  fb as Clock,
  Be as CompatTimeline,
  Of as CustomBounce,
  _f as CustomEase,
  If as CustomWiggle,
  Oe as DANCE_STYLES,
  ml as DEFAULT_BAKE_INTERVAL_MS,
  Zo as DEFAULT_INERTIA_FRICTION,
  Yf as DEFAULT_LABELS,
  Bt as DEFAULT_SPRING,
  Gb as DEFAULT_TRANSITION,
  Dl as Draggable,
  ut as EXPRESSIONS,
  w0 as FINGERS,
  Hs as FLIPS,
  Jo as FORMAT_VERSION,
  _e as GAGS,
  Ct as GAITS,
  Aa as GAIT_CYCLE_MS,
  Mt as HAND_REST,
  Et as HAND_SHAPES,
  jw as HORSE_ACTING,
  Ww as HORSE_GAITS,
  iy as HOUSE_ACTING,
  Om as HUMAN_ACTING_RIG,
  wc as HUMAN_EXPRESSIONS,
  jo as HUMAN_GAGS,
  Ze as HUMAN_POSES,
  mt as HUMAN_REST,
  rm as IDENTITY_CAMERA,
  Mh as INERTIA_MAX_DURATION_MS,
  bu as InertiaTrackPlayer,
  ee as LiveTimeline,
  kb as MORPH_SAMPLES,
  Yi as MUDRAS,
  db as ManualClock,
  Dr as MediaSync,
  Yd as Observer,
  Nt as POSES,
  tl as PROP_BEAT_3D_FIELDS,
  io as PROP_BEAT_FIELDS,
  fh as PROP_COMMON_ACTIONS,
  In as PROP_COMMON_CONTROLS,
  An as PROP_PRESETS,
  uh as QUADRUPED_ACTING,
  Ji as REMOVE_STYLES,
  rt as REST_POSE,
  rb as RIDING_POSES,
  Ls as SCRIPT_ACTIONS,
  ll as SPRING_MAX_DURATION_MS,
  Bs as SPRING_PRESETS,
  dn as SPRING_STEP_MS,
  $m as STICK_ACTING_RIG,
  ff as ScrollAnimator,
  _s as ScrollDriver,
  pf as ScrollMarkers,
  lf as ScrollPin,
  Or as SmoothScroll,
  xs as SpringSampler,
  yu as SpringTrackPlayer,
  Ld as Stage,
  ey as TREE_ACTING,
  Kt as Timeline,
  vo as TinyflyPlayer,
  c0 as TinyflySequencer,
  Xs as TrackPlayer,
  Y1 as VEHICLE_ACTING,
  me as VISEMES,
  _b as ValueResolver,
  af as VisibilityDriver,
  Iw as actCharacterTracks,
  Bo as actKeyframes,
  Im as actTracks,
  Zc as actionNames,
  ly as airplane,
  zo as animalStrideLength,
  T1 as animatableProperties,
  ek as applyBloom,
  Mw as applyCamera,
  Ep as applyGroove,
  xa as assertBeats,
  Ch as backOut,
  ow as bakeDanceTracks,
  kl as bakeEasing,
  bl as bakeInertiaTrack,
  yl as bakeSpringTrack,
  Ow as basicOutfit,
  nw as beatAt,
  uo as beatAtTime,
  $l as beatLength,
  ho as beatTime,
  Lb as beatsBetween,
  Z1 as bike,
  e0 as bindChoiceHotspots,
  Xo as bird,
  Tn as blendPose,
  Jl as boilFrame,
  Hh as bounceOut,
  zg as boxMesh,
  U1 as bus,
  vw as cameraFromValues,
  Sw as cameraPoint,
  Db as cameraTracks,
  Fy as capabilities,
  Kw as capabilitiesMarkdown,
  z1 as car,
  G1 as cart,
  by as cat,
  Tc as character,
  mw as characterAt,
  Tg as characterHandPose,
  Sg as characterJoints,
  uw as characterJointsInView,
  ww as characterObjects,
  Ag as characterPartsInView,
  yw as characterPoseTracks,
  kw as characterScript3D,
  gw as characterTarget,
  ku as charactersFor,
  eh as checkBeats,
  Qc as checkCast,
  om as checkCharacterBeats3D,
  Py as checkPropBeats,
  sb as checkPropBeats3D,
  Nw as checkTracks,
  xy as chicken,
  xw as circlePath,
  Bl as clamp01,
  vb as clearMorphCache,
  bb as clearPathCache,
  zc as clipErased,
  rs as closestName,
  _w as codePanel,
  km as codeTokens,
  $r as containerProgressAt,
  hk as context,
  gt as controlValue,
  wy as cow,
  Xb as create,
  Uf as createControls,
  Oh as createCubicBezier,
  Df as createLive,
  Os as createPen,
  On as createRandom,
  _i as createTrack,
  mb as criticalDamping,
  Ty as crow,
  Ou as customBounce,
  _u as customEase,
  Iu as customWiggle,
  Xg as cylinderMesh,
  Eo as danceFrame,
  tw as dancePose,
  Ki as danceStance,
  ew as danceTaps,
  iw as danceTracks,
  ii as danceTravel,
  _p as danceTravelTrack,
  sw as dancer,
  Lw as defineAction,
  Fw as defineGait,
  S1 as describeTarget,
  kn as deserializeTimeline,
  xu as deserializeTrack,
  Fb as detectTempo,
  yy as dog,
  Bb as draggable,
  To as drawCartoonHand,
  Eg as drawCharacter,
  dw as drawCharacterInView,
  Lm as drawDustPuff,
  Bc as drawEraser,
  Yc as drawHand,
  Cw as drawImpactStars,
  am as drawPencil,
  Yw as drawProp,
  zw as drawPropEffects,
  Hc as drawPropShadow,
  Ig as drawSolvedFaces,
  bw as drawSolvedPart,
  Oc as drawSolvedProp,
  Cm as drawSpeedLines,
  gp as drawStickFigure,
  Hw as drawStickSmear,
  nk as drawTrail,
  Ew as drawnPathTarget,
  Ah as easeIn,
  cl as easeInCubic,
  Ph as easeInOut,
  As as easeInOutCubic,
  Eh as easeInOutQuad,
  Th as easeInQuad,
  $h as easeOut,
  hl as easeOutCubic,
  xh as easeOutQuad,
  Wu as editDistance,
  Ih as elasticOut,
  Br as ellipsePoints,
  Ug as ellipsoidMesh,
  Pw as erasable,
  nh as expandBeats,
  gu as expandParametricEasings,
  Gg as extrudeMesh,
  Xp as flipPose,
  rw as flipTracks,
  Up as flipTravel,
  il as formatVersionFor,
  ik as from,
  Ab as fromJSON,
  ok as fromTo,
  ya as gag,
  Ms as gagDuration,
  W0 as gaitPose,
  zr as gaitStrideLength,
  $t as getEasingFunction,
  os as getInterpolator,
  vl as getMotionPathPoint,
  wb as getPathLength,
  Kh as getPointAtProgress,
  zd as gridLinesFor,
  Tw as handAt,
  Wi as handJoints,
  O0 as handJointsAt,
  k1 as handPath,
  vt as handPose,
  ps as handProp,
  yh as hasKeyframes,
  Vt as hashSeed,
  Zb as headPoint,
  bh as heldTime,
  ry as helicopter,
  my as horse,
  Bw as horseStrideLength,
  sy as house,
  lw as humanFieldLabel,
  Ng as humanGag,
  Fg as humanGaitPose,
  Dg as humanGaitStrideLength,
  lg as humanPlan,
  Lt as humanPose,
  fk as imageSequence,
  Pn as inertiaDuration,
  $n as inertiaRest,
  Ei as inertiaValueAt,
  yb as inertiaVelocityAt,
  du as interpolateArray,
  uu as interpolateColor,
  xb as interpolateMotionPath,
  te as interpolateNumber,
  pu as interpolatePathString,
  fu as interpolateQuaternion,
  dr as interpolateString,
  mh as isCubicBezierEasing,
  Ae as isInertiaTrack,
  ub as isMotionPathPoint,
  ol as isMotionPathTrack,
  ss as isParametricEasing,
  _n as isPathData,
  $e as isSpringTrack,
  ao as isTextTrack,
  gb as isUnderdamped,
  Pb as isUnresolved,
  $g as jointsInScene,
  pp as jointsToScene,
  Ai as linear,
  Jc as lipSyncKeyframes,
  qm as lipSyncOver,
  Rw as lipSyncTracks,
  Rc as lit,
  Wt as live,
  ls as mapEase,
  jb as mat4,
  uk as matchMedia,
  al as maxStaggerDistance,
  aw as mirrorHumanPose,
  Tp as mirrorPose,
  Lc as mixColors,
  Sn as mixHandPoses,
  fw as mixPoses,
  su as morphPath,
  Q1 as motorbike,
  s0 as mount,
  r0 as mountAll,
  Ib as narrationMarkers,
  Hb as narrationSceneAt,
  is as naturalRest,
  Cb as nearestBeat,
  Rb as nextBeat,
  pk as pageTransition,
  Jg as panelMesh,
  Lh as parametricEasing,
  Ar as parseEdge,
  Ue as parsePath,
  jl as parseTrigger,
  Mn as partialPath,
  d0 as pathLength,
  Dw as persona,
  Ob as planNarration,
  zb as play,
  Vb as playSequence,
  Yb as playWhenVisible,
  Ml as playheadCrossings,
  Mo as pointAlong,
  ul as pointAtDistance,
  hw as pointOnHead,
  Bu as pointsToPath,
  xt as pose,
  Qb as poseTracks,
  Vo as propActions,
  N1 as propAnchors3D,
  Uo as propAt,
  Ay as propControls,
  Ic as propLineWidth,
  Gw as propObjects,
  D1 as propPartsInSpace,
  Ey as propPreset,
  Xw as propRide,
  Zw as propRide3D,
  _y as propScript,
  Jw as propScript3D,
  Ss as propShapeMesh,
  qw as propTarget,
  Vw as propTow,
  R1 as propView,
  Ds as quadruped,
  Mb as quat,
  Qw as quickPlay,
  dk as quickTo,
  Tl as randomBetween,
  $b as randomChoice,
  Au as randomSnapped,
  pw as reachCharacter,
  Uc as resolveActingStyle,
  $c as resolveCharacterPoseKeys,
  Is as resolveGait,
  gc as resolvePoseKeys,
  $u as resolveSequence,
  uc as resolveStickFrame,
  mp as resolveStickPose,
  Al as resolveValue,
  Ku as ribbon,
  zu as ribbonHeadCap,
  Ee as rotateAbout,
  Ao as routineBeats,
  Je as rubberLimb,
  th as scriptActionSummaries,
  g1 as scriptTracks,
  qb as scrollProgress,
  Kb as scrubOnScroll,
  Aw as scrubPath,
  Jb as seatHeight,
  Eu as serializeTimeline,
  Tu as serializeTrack,
  rk as set,
  Wo as shade,
  Qg as shapeMesh,
  fo as shapeToPathData,
  mu as simplifyKeyframes,
  py as sittingPose,
  Ho as skeletonInView,
  Fi as sketchPen,
  Fc as smoothPath,
  rf as smoothToward,
  Kd as snapAxis,
  hf as snapConfig,
  df as snapDuration,
  uf as snapProgress,
  Ns as solveAt,
  _o as solvePlanSpace,
  ah as solveProp,
  Sy as songbird,
  Bm as soundsOf,
  p1 as speechDuration,
  Uw as spliceTracks,
  ck as splitText,
  wh as springDuration,
  ju as springFollow,
  pb as springValueAt,
  Io as stagePlanSpace,
  rl as staggerDistance,
  lo as staggerOffset,
  xi as staggerOffsets,
  Ts as staggerSpan,
  Km as stepsDuration,
  Rh as stepsEasing,
  Gc as stepsToKeys,
  pc as stickFigureAt,
  ge as stickFigureJoints,
  fc as stickFigureTarget,
  cw as stickToHuman,
  q0 as strideLength,
  qf as syncMediaElement,
  Y0 as talkingMouth,
  So as taperedLine,
  Qn as taperedOutline,
  Mu as textAt,
  tk as tf,
  lk as ticker,
  ak as timeline,
  sk as to,
  Eb as toJSON,
  Sb as toKeyframedTrack,
  Tb as toKeyframedTracks,
  ye as trackTargets,
  V1 as tractor,
  Nb as trailSamples,
  J1 as trainCar,
  ty as tree,
  vn as triggerDistance,
  X1 as truck,
  Zg as tubeMesh,
  pt as unknownName,
  Ub as unmount,
  Wb as vec3,
  de as vehicle,
  B0 as walkPose,
  $w as withErased,
  we as withExpression
};
