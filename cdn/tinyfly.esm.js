function kl(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function $n(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const Ci = 2;
function Tr(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function ci(t) {
  return t.property === "text" && "textConfig" in t;
}
function ae(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function le(t) {
  return t.kind === "spring" && "spring" in t;
}
function Er(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function pg(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function vl(t) {
  return "keyframes" in t;
}
class gg {
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
class mg {
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
function Sl(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function Ar(t, e, n = "start") {
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
function Pr(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, Ar(s, t, e));
  return n;
}
function hi(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", i = Ar(t, e, s);
  if (n.amount !== void 0) {
    const o = Pr(e, s);
    return o === 0 ? 0 : n.amount * i / o;
  }
  return n.each !== void 0 ? n.each * i : 0;
}
function Hs(t, e) {
  return Array.from({ length: t }, (n, s) => hi(s, t, e));
}
function qn(t, e) {
  return t <= 1 ? 0 : Math.max(...Hs(t, e));
}
const De = 1, $r = 6e4, ln = $r / De, Ct = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, ns = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Un {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? Ct.stiffness, this.damping = e.damping ?? Ct.damping, this.mass = e.mass ?? Ct.mass, this.restDelta = e.restDelta ?? Ct.restDelta, this.restSpeed = e.restSpeed ?? Ct.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? Ct.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / De);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], i = this.samples[Math.min(n + 1, this.samples.length - 1)], o = e / De - n;
    return s + (i - s) * o;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(ln + 1), this.settledStep !== null ? this.settledStep * De : $r;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, ln + 1), s = De / 1e3;
    for (; this.samples.length < n; ) {
      const i = this.samples[this.samples.length - 1], o = i - this.to, r = -this.stiffness * o, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = i + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > ln && (this.settledStep = ln);
  }
}
function yg(t, e) {
  return new Un(t).valueAt(e);
}
function xl(t) {
  return new Un(t).settleTime();
}
function bg(t) {
  const e = t.stiffness ?? Ct.stiffness, n = t.damping ?? Ct.damping, s = t.mass ?? Ct.mass;
  return n < 2 * Math.sqrt(e * s);
}
function wg(t) {
  const e = t.stiffness ?? Ct.stiffness, n = t.mass ?? Ct.mass;
  return 2 * Math.sqrt(e * n);
}
const Ri = 4, Ml = 2e-3, Tl = 1e-4, El = 6e4;
function Vn(t) {
  const e = t.friction ?? Ri;
  return e > 0 ? e : Ri;
}
function _n(t) {
  return t.from + t.velocity / Vn(t);
}
function Al(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function sn(t) {
  let e = Al(_n(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function on(t) {
  const e = Math.abs(sn(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(Tl, e * Ml);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Vn(t);
  return Math.min(El, s * 1e3);
}
function Os(t, e) {
  if (e <= 0) return t.from;
  const n = sn(t);
  if (e >= on(t)) return n;
  const s = Vn(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function kg(t, e) {
  const n = Vn(t), s = sn(t);
  return e >= on(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Cs = (t) => t, Pl = (t) => t * t, $l = (t) => 1 - (1 - t) * (1 - t), _l = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, _r = (t) => t * t * t, Ir = (t) => 1 - Math.pow(1 - t, 3), zn = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Il = _r, Hl = Ir, Ol = zn, Cl = {
  linear: Cs,
  "ease-in": Il,
  "ease-out": Hl,
  "ease-in-out": Ol,
  "ease-in-quad": Pl,
  "ease-out-quad": $l,
  "ease-in-out-quad": _l,
  "ease-in-cubic": _r,
  "ease-out-cubic": Ir,
  "ease-in-out-cubic": zn
};
function Rl(t) {
  const [e, n, s, i] = t, o = 3 * e, r = 3 * (s - e) - o, a = 1 - o - r, l = 3 * n, c = 3 * (i - n) - l, h = 1 - l - c, f = (d) => ((a * d + r) * d + o) * d, u = (d) => ((h * d + c) * d + l) * d, p = (d) => (3 * a * d + 2 * r) * d + o, g = (d) => {
    let m = d;
    for (let k = 0; k < 8; k++) {
      const x = f(m) - d;
      if (Math.abs(x) < 1e-7)
        return m;
      const v = p(m);
      if (Math.abs(v) < 1e-7)
        break;
      m -= x / v;
    }
    let y = 0, b = 1;
    for (m = d; y < b; ) {
      const k = f(m);
      if (Math.abs(k - d) < 1e-7)
        return m;
      d > k ? y = m : b = m, m = (y + b) / 2;
    }
    return m;
  };
  return (d) => {
    if (d <= 0) return 0;
    if (d >= 1) return 1;
    const m = g(d);
    return u(m);
  };
}
function ss(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function Ll(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (i) => i <= 0 ? 0 : i >= 1 ? 1 : n * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / e) + 1;
}
const Fl = (t) => {
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
function Wl(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function Bl(t, e = "end") {
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
function Dl(t) {
  switch (t.type) {
    case "steps":
      return Bl(t.count, t.position);
    case "elastic":
      return ss(Ll(t.amplitude, t.period), t.mode);
    case "bounce":
      return ss(Fl, t.mode);
    case "back":
      return ss(Wl(t.overshoot), t.mode);
  }
}
function Et(t) {
  return t === void 0 ? Cs : kl(t) ? Rl(t.points) : $n(t) ? Dl(t) : Cl[t] ?? Cs;
}
const Li = 32, Nl = 256, ye = /* @__PURE__ */ new Map(), Kl = /[MmLlHhVvCcSsQqTtAaZz]/, Yl = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, jl = {
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
function Xl(t) {
  const e = [];
  let n = 0, s = null;
  const i = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (i(), !(n >= t.length)); ) {
    const o = t[n];
    if (Kl.test(o)) {
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
    const l = Yl.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function ql(t, e, n, s, i, o, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const f = i * Math.PI / 180, u = Math.cos(f), p = Math.sin(f), g = (t - a) / 2, d = (e - l) / 2, m = u * g + p * d, y = -p * g + u * d, b = m * m / (c * c) + y * y / (h * h);
  if (b > 1) {
    const G = Math.sqrt(b);
    c *= G, h *= G;
  }
  const k = o === r ? -1 : 1, x = c * c * h * h - c * c * y * y - h * h * m * m, v = c * c * y * y + h * h * m * m, T = k * Math.sqrt(Math.max(0, x / v)), E = T * c * y / h, O = -T * h * m / c, M = u * E - p * O + (t + a) / 2, H = p * E + u * O + (e + l) / 2, $ = (G, S, _, w) => {
    const P = G * _ + S * w, C = Math.sqrt((G * G + S * S) * (_ * _ + w * w)), D = Math.acos(Math.max(-1, Math.min(1, P / C)));
    return G * w - S * _ < 0 ? -D : D;
  }, A = $(1, 0, (m - E) / c, (y - O) / h);
  let R = $((m - E) / c, (y - O) / h, (-m - E) / c, (-y - O) / h);
  !r && R > 0 && (R -= 2 * Math.PI), r && R < 0 && (R += 2 * Math.PI);
  const L = Math.max(1, Math.ceil(Math.abs(R) / (Math.PI / 2))), N = R / L, U = 4 / 3 * Math.tan(N / 4), it = (G) => {
    const S = c * Math.cos(G), _ = h * Math.sin(G);
    return [u * S - p * _ + M, p * S + u * _ + H];
  }, j = (G) => {
    const S = -c * Math.sin(G), _ = h * Math.cos(G);
    return [u * S - p * _, p * S + u * _];
  }, Q = [];
  for (let G = 0; G < L; G++) {
    const S = A + G * N, _ = S + N, [w, P] = it(S), [C, D] = G === L - 1 ? [a, l] : it(_), [Z, B] = j(S), [V, I] = j(_);
    Q.push([w + U * Z, P + U * B, C - U * V, D - U * I, C, D]);
  }
  return Q;
}
function Ut(t, e, n, s, i) {
  const o = 1 - i;
  return o * o * o * t + 3 * o * o * i * e + 3 * o * i * i * n + i * i * i * s;
}
function Fi(t, e, n, s, i) {
  const o = 1 - i;
  return 3 * o * o * (e - t) + 6 * o * i * (n - e) + 3 * i * i * (s - n);
}
function _e(t, e, n, s) {
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
function cn(t, e, n) {
  const [s, i, o, r, a, l] = n, c = [0];
  let h = t, f = e, u = 0;
  for (let p = 1; p <= Li; p++) {
    const g = p / Li, d = Ut(t, s, o, a, g), m = Ut(e, i, r, l, g);
    u += Math.hypot(d - h, m - f), c.push(u), h = d, f = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, i, o, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: u,
    lengths: c
  };
}
function Te(t) {
  const e = ye.get(t);
  if (e) return e;
  const n = [];
  let s = 0, i = 0, o = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), f = (d) => {
    c < 0 && (c = 0), d.subpath = c, n.push(d);
  };
  for (const { type: d, args: m } of Xl(t)) {
    const y = d.toUpperCase(), b = d !== y, k = jl[y];
    if (y === "Z") {
      (s !== o || i !== r) && f(_e(s, i, o, r)), c >= 0 && h.add(c), s = o, i = r, a = l = null;
      continue;
    }
    for (let x = 0; x + k <= m.length; x += k) {
      const v = m.slice(x, x + k), T = b ? s : 0, E = b ? i : 0;
      let O = null, M = null;
      switch (y) {
        case "M":
          x === 0 ? (s = v[0] + T, i = v[1] + E, o = s, r = i, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (f(_e(s, i, v[0] + T, v[1] + E)), s = v[0] + T, i = v[1] + E);
          break;
        case "L":
          f(_e(s, i, v[0] + T, v[1] + E)), s = v[0] + T, i = v[1] + E;
          break;
        case "H":
          f(_e(s, i, v[0] + T, i)), s = v[0] + T;
          break;
        case "V":
          f(_e(s, i, s, v[0] + E)), i = v[0] + E;
          break;
        case "C": {
          const H = [v[0] + T, v[1] + E, v[2] + T, v[3] + E, v[4] + T, v[5] + E];
          f(cn(s, i, H)), O = [H[2], H[3]], s = H[4], i = H[5];
          break;
        }
        case "S": {
          const [H, $] = a ? [2 * s - a[0], 2 * i - a[1]] : [s, i], A = [H, $, v[0] + T, v[1] + E, v[2] + T, v[3] + E];
          f(cn(s, i, A)), O = [A[2], A[3]], s = A[4], i = A[5];
          break;
        }
        case "Q":
        case "T": {
          let H = s, $ = i;
          y === "Q" ? (H = v[0] + T, $ = v[1] + E) : l && (H = 2 * s - l[0], $ = 2 * i - l[1]);
          const A = y === "Q" ? v[2] + T : v[0] + T, R = y === "Q" ? v[3] + E : v[1] + E;
          f(
            cn(s, i, [
              s + 2 / 3 * (H - s),
              i + 2 / 3 * ($ - i),
              A + 2 / 3 * (H - A),
              R + 2 / 3 * ($ - R),
              A,
              R
            ])
          ), M = [H, $], s = A, i = R;
          break;
        }
        case "A": {
          const H = v[5] + T, $ = v[6] + E;
          let A = s, R = i;
          for (const L of ql(s, i, v[0], v[1], v[2], v[3], v[4], H, $))
            f(cn(A, R, L)), A = L[4], R = L[5];
          s = H, i = $;
          break;
        }
      }
      a = O, l = M;
    }
  }
  const u = n.reduce((d, m) => d + m.length, 0), p = [];
  for (let d = 0; d < n.length; ) {
    const m = n[d].subpath;
    let y = d, b = 0;
    for (; y < n.length && n[y].subpath === m; ) b += n[y++].length;
    const k = n[d], x = n[y - 1], v = h.has(m) || Math.abs(x.endX - k.startX) < 1e-9 && Math.abs(x.endY - k.startY) < 1e-9;
    p.push({ start: d, end: y, length: b, closed: v }), d = y;
  }
  const g = { segments: n, totalLength: u, subpaths: p };
  return ye.size >= Nl && ye.delete(ye.keys().next().value), ye.set(t, g), g;
}
function Ul(t, e) {
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
function Vl(t, e) {
  if (t.type === "L") {
    const f = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * f,
      y: t.startY + (t.endY - t.startY) * f,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, i, o, r, a] = t.points, l = Ul(t, e);
  let c = Fi(t.startX, n, i, r, l), h = Fi(t.startY, s, o, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const f = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), u = Ut(t.startX, n, i, r, f), p = Ut(t.startY, s, o, a, f), g = Ut(t.startX, n, i, r, l), d = Ut(t.startY, s, o, a, l);
    c = l < 0.5 ? u - g : g - u, h = l < 0.5 ? p - d : d - p;
  }
  return {
    x: Ut(t.startX, n, i, r, l),
    y: Ut(t.startY, s, o, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function Hr(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let i = 0;
  for (let o = n; o < s; o++) {
    const r = t[o];
    if (i + r.length >= e || o === s - 1)
      return Vl(r, e - i);
    i += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function zl(t, e) {
  const { segments: n, totalLength: s } = Te(t);
  return Hr(n, Math.max(0, Math.min(1, e)) * s);
}
function vg() {
  ye.clear();
}
function Sg(t) {
  return Te(t).totalLength;
}
const Gl = 24, Jl = 320, Zl = 2.5, Ie = 72, xg = 64, Ql = 0.2, tc = 128, Ne = /* @__PURE__ */ new Map();
let Sn = 0, qt;
const Wi = (t) => Math.round(t * 100) / 100;
function Bi(t, e) {
  const { segments: n, subpaths: s, totalLength: i } = Te(t);
  if (n.length === 0) return [];
  if (e) {
    const o = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: i, closed: o }];
  }
  return s.filter((o) => o.length > 0).map((o) => ({ segments: n, start: o.start, end: o.end, length: o.length, closed: o.closed }));
}
function Rs(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = Hr(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function Di(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function Ni(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Rs(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function Ki(t) {
  let e = 0, n = 0;
  for (const [s, i] of t)
    e += s, n += i;
  return e /= t.length, n /= t.length, t.map(([s, i]) => [s - e, i - n]);
}
function ec(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % Ie / Ie : 0, reversed: n < 0 };
  const i = Ki(Ni(t, Ie)), o = Ki(Ni(e, Ie)), r = Ie;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let f = 0; f < h; f++) {
      let u = 0;
      for (let p = 0; p < r && u < l; p++) {
        const g = s ? c ? (f - p + r) % r : (p + f) % r : c ? r - 1 - p : p, d = i[p][0] - o[g][0], m = i[p][1] - o[g][1];
        u += d * d + m * m;
      }
      u < l && (l = u, a = { offset: s ? f / r : 0, reversed: c });
    }
  }
  return a;
}
function nc(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function sc(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function ic(t, e, n) {
  const s = t.closed && e.closed, i = ec(t, e, n.shapeIndex), o = Math.max(
    Gl,
    Math.min(Jl, Math.ceil(Math.max(t.length, e.length) / Zl))
  ), r = /* @__PURE__ */ new Set(), a = (f) => r.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= o; f++) a(f / o);
  for (const f of Di(t)) a(f);
  for (const f of Di(e)) a(sc(f, i, s));
  let l = [...r].sort((f, u) => f - u);
  s && (l = l.filter((f) => f < 1));
  const c = [], h = [];
  for (const f of l)
    c.push(...Rs(t, f)), h.push(...Rs(e, nc(f, i, s)));
  return oc({ from: c, to: h, closed: s });
}
function oc(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = Ql;
    for (let h = r + 1; h < a; h++) {
      const f = Math.max(Yi(t.from, r, a, h), Yi(t.to, r, a, h));
      f > c && (c = f, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const i = [], o = [];
  for (let r = 0; r < e; r++)
    n[r] && (i.push(t.from[r * 2], t.from[r * 2 + 1]), o.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: i, to: o, closed: t.closed };
}
function Yi(t, e, n, s) {
  const i = t[e * 2], o = t[e * 2 + 1], r = t[n * 2] - i, a = t[n * 2 + 1] - o, l = t[s * 2] - i, c = t[s * 2 + 1] - o, h = r * r + a * a, f = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - f * r, c - f * a);
}
function rc(t, e, n) {
  const s = n.shapeIndex;
  if (qt && qt.from === t && qt.to === e && qt.shapeIndex === s) return qt.plan;
  const o = Ne.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (o)
    return qt = { from: t, to: e, shapeIndex: s, plan: o }, o;
  const r = Te(t).subpaths.filter((p) => p.length > 0).length === Te(e).subpaths.filter((p) => p.length > 0).length, a = Bi(t, !r), l = Bi(e, !r), c = {
    pairs: a.map((p, g) => ic(p, l[g], n))
  };
  Sn >= tc && (Ne.clear(), Sn = 0);
  const h = String(s ?? "auto"), f = Ne.get(h) ?? /* @__PURE__ */ new Map();
  Ne.set(h, f);
  const u = f.get(t) ?? /* @__PURE__ */ new Map();
  return f.set(t, u), u.set(e, c), Sn++, qt = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function ac(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const i = Math.max(0, Math.min(1, n));
  if (i === 0) return t;
  if (i === 1) return e;
  const o = rc(t, e, s);
  if (o.pairs.length === 0) return i < 0.5 ? t : e;
  let r = "";
  for (const a of o.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = Wi(a.from[l] + (a.to[l] - a.from[l]) * i), h = Wi(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * i);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function Mg() {
  Ne.clear(), Sn = 0, qt = void 0;
}
function rn(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const be = Math.PI / 180, lc = 0.9995;
function ui() {
  return [0, 0, 0, 1];
}
function Se(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return ui();
  const s = e * be / 2, i = Math.sin(s) / n;
  return [t[0] * i, t[1] * i, t[2] * i, Math.cos(s)];
}
function cc(t, e, n) {
  return Ls(Ls(Se([0, 1, 0], e), Se([1, 0, 0], t)), Se([0, 0, 1], n));
}
function hc(t) {
  const [e, n, s, i] = zt(t), o = 2 * (e * s + n * i), r = 2 * (e * n + s * i), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * i), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * i), f = 1 - 2 * (e * e + n * n), u = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [u / be, Math.atan2(o, f) / be, Math.atan2(r, a) / be] : [u / be, Math.atan2(-h, c) / be, 0];
}
function Ls(t, e) {
  const [n, s, i, o] = t, [r, a, l, c] = e;
  return [
    o * r + n * c + s * l - i * a,
    o * a - n * l + s * c + i * r,
    o * l + n * a - s * r + i * c,
    o * c - n * r - s * a - i * l
  ];
}
function Or(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Cr(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function zt(t) {
  const e = Cr(t);
  return e === 0 ? ui() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function uc(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function Rr(t, e, n) {
  const s = zt(t);
  let i = zt(e), o = Or(s, i);
  if (o < 0 && (i = [-i[0], -i[1], -i[2], -i[3]], o = -o), o > lc)
    return zt([
      s[0] + (i[0] - s[0]) * n,
      s[1] + (i[1] - s[1]) * n,
      s[2] + (i[2] - s[2]) * n,
      s[3] + (i[3] - s[3]) * n
    ]);
  const r = Math.acos(o), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return zt([
    s[0] * l + i[0] * c,
    s[1] * l + i[1] * c,
    s[2] * l + i[2] * c,
    s[3] * l + i[3] * c
  ]);
}
function fc(t, e) {
  const [n, s, i, o] = zt(t), r = 2 * (s * e[2] - i * e[1]), a = 2 * (i * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + o * r + (s * l - i * a), e[1] + o * a + (i * r - n * l), e[2] + o * l + (n * a - s * r)];
}
const Tg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: uc,
  dot: Or,
  fromAxisAngle: Se,
  fromEuler: cc,
  identity: ui,
  length: Cr,
  multiply: Ls,
  normalize: zt,
  rotateVec3: fc,
  slerp: Rr,
  toEuler: hc
}, Symbol.toStringTag, { value: "Module" })), Yt = (t, e, n) => t + (e - t) * n, Lr = 512, is = /* @__PURE__ */ new Map(), os = /* @__PURE__ */ new Map();
function ji(t) {
  const e = is.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return is.size < Lr && is.set(t, s), s;
}
const Xi = (t) => t.charCodeAt(0) === 35, qi = (t) => t.startsWith("rgb"), Ui = (t) => t.startsWith("rgba"), dc = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, rs = (t) => Math.round(t).toString(16).padStart(2, "0");
function pc(t, e, n) {
  return `#${rs(t)}${rs(e)}${rs(n)}`;
}
function Vi(t) {
  const e = os.get(t);
  if (e) return e;
  const n = t.match(dc);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), i = parseInt(n[2], 10), o = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, i, o, parseFloat(n[4])] : [s, i, o];
  return os.size < Lr && os.set(t, r), r;
}
const gc = (t, e, n) => {
  if (Xi(t) && Xi(e)) {
    const [s, i, o] = ji(t), [r, a, l] = ji(e), c = Yt(s, r, n), h = Yt(i, a, n), f = Yt(o, l, n);
    return pc(c, h, f);
  }
  if ((qi(t) || Ui(t)) && (qi(e) || Ui(e))) {
    const s = Vi(t), i = Vi(e), o = Math.round(Yt(s[0], i[0], n)), r = Math.round(Yt(s[1], i[1], n)), a = Math.round(Yt(s[2], i[2], n));
    if (s.length === 4 || i.length === 4) {
      const l = s[3] ?? 1, c = i[3] ?? 1, h = Yt(l, c, n);
      return `rgba(${o}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${o}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, mc = (t, e, n) => {
  const s = Math.min(t.length, e.length), i = [];
  for (let o = 0; o < s; o++)
    i.push(Yt(t[o], e[o], n));
  return i;
}, yc = (t, e, n) => Rr(t, e, n), zi = (t, e, n) => n < 1 ? t : e, bc = (t, e, n) => ac(t, e, n);
function In(t, e) {
  return e === "slerp" ? yc : typeof t == "number" ? Yt : Array.isArray(t) ? mc : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? gc : rn(t) ? bc : zi : zi;
}
const Fr = 1e3 / 60;
function Wr(t, e = {}) {
  if (!le(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new Un(t.spring);
  return Dr(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function Br(t, e = {}) {
  if (!ae(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return Dr(
    t,
    (s) => Os(n, s),
    on(n),
    n.from,
    sn(n),
    e
  );
}
function Dr(t, e, n, s, i, o) {
  const r = o.intervalMs ?? Fr, a = o.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let f = 0; f <= n; f += r)
    c.push({ time: f + l, value: e(f), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: i, easing: "linear" }) : h.value = i, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? kc(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function Nr(t, e, n, s = {}) {
  const i = s.intervalMs ?? Fr, o = typeof n == "function" ? n : Et(n), r = In(t.value, s.interpolation), a = e.time - t.time;
  if (a <= 0) return [e];
  const l = [];
  for (let h = i; h < a; h += i) {
    const f = h / a;
    l.push({
      time: t.time + h,
      value: r(t.value, e.value, o(f)),
      easing: "linear"
    });
  }
  const c = o(1);
  return l.push({ ...e, ...c !== 1 && { value: r(t.value, e.value, c) }, easing: "linear" }), l;
}
function Eg(t, e) {
  return le(t) ? Wr(t, e) : ae(t) ? Br(t, e) : t;
}
function wc(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((o) => $n(o.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], i = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let o = 1; o < n.length; o++) {
    const r = n[o];
    $n(r.easing) ? s.push(...Nr(n[o - 1], r, r.easing, i)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function Ag(t, e) {
  return t.filter(vl).map((n) => wc(n, e)).concat(
    t.filter(le).map((n) => Wr(n, e)),
    t.filter(ae).map((n) => Br(n, e))
  );
}
function kc(t, e) {
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
function Fs(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function ee(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function Ee(t, e, n, s) {
  const i = n ?? 0;
  return !s || e <= 1 ? i : i + hi(t, e, s);
}
class as {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = ee(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - Ee(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const o = Ee(i, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - o);
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
    const n = e[e.length - 1].time, s = this.track.stagger ? qn(this.targets.length, this.track.stagger) : 0;
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
    const o = i.time - s.time, r = (e - s.time) / o, l = Et(i.easing)(r);
    return In(s.value, this.track.interpolation)(s.value, i.value, l);
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
class vc {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = ee(e), this.sampler = new Un(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - Ee(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Ee(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: this.sampler.valueAt(e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? qn(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class Sc {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = ee(e), this.duration = on(e.inertia);
  }
  getValueAtTime(e) {
    return Os(this.track.inertia, e - Ee(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = Ee(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: Os(this.track.inertia, e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? qn(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function Kr(t, e) {
  const n = { ...zl(t.pathData, e) };
  if (t.matrix) {
    const [s, i, o, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + o * h + a, n.y = i * c + r * h + l;
    const f = n.angle * Math.PI / 180, u = Math.cos(f), p = Math.sin(f);
    n.angle = Math.atan2(i * u + r * p, s * u + o * p) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function Pg(t, e, n, s) {
  const i = e + (n - e) * s;
  return Kr(t, i);
}
const ls = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, xc = 20;
function Mc(t) {
  const e = ls[t ?? "upperCase"] ?? t ?? ls.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(ls.upperCase);
}
function Tc(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Ec(t, e, n = 0) {
  const s = t.from ?? "", i = t.to, o = Math.max(0, Math.min(1, e));
  if (o <= 0) return s;
  if (o >= 1) return i;
  const r = Array.from(s), a = Array.from(i), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const b = Math.round(o * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - b)).join("") + a.slice(Math.max(0, a.length - b)).join("") : a.slice(0, b).join("") + r.slice(b).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (o - c) / (1 - c)), f = Math.floor(h * a.length), u = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * o), p = Mc(t.chars), g = t.refreshRate ?? xc, d = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let y = "";
  for (let b = 0; b < u; b++) {
    const k = l ? b >= u - f : b < f, x = l ? a[a.length - (u - b)] : a[b];
    k && x !== void 0 || x === " " || x === `
` ? y += x : y += p[Tc(m, b, d) % p.length];
  }
  return y;
}
class $e {
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
    if (e = Sl(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
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
        const h = `${a}\0${r}`, f = c <= e, u = s.get(h);
        (!u || (f !== u.started ? f : f ? c >= u.start : c <= u.start)) && s.set(h, { trackId: i, target: a, property: r, value: l, start: c, started: f });
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
      a.set("text", Ec(l.textConfig, o, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof o == "number") {
      const h = Kr(c.motionPathConfig, o);
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
        for (const s of ee(n)) {
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
    if (this._tracks.push(e), this._sharedWrites = null, ae(e)) {
      this._trackPlayers.set(e.id, new Sc(e));
      return;
    }
    if (le(e)) {
      this._trackPlayers.set(e.id, new vc(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (ci(e))
      this._trackPlayers.set(e.id, new as(e)), this._textTracks.set(e.id, e);
    else if (Er(e)) {
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
      this._trackPlayers.set(e.id, new as(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new as(e));
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
    if (le(s) || ae(s))
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
          const a = ee(r).filter((f) => ee(s).includes(f));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(r.id);
          if (!l || !(l.from <= i.to && i.from <= l.to)) continue;
          const h = i.from >= l.from;
          for (const f of a)
            e.push({
              target: f,
              property: s.property,
              losingTrackId: h ? r.id : s.id,
              winningTrackId: h ? s.id : r.id
            });
        }
    }
    return e;
  }
  _matches(e, n) {
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !ee(e).includes(n.target)) return !1;
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
      formatVersion: Tr(this._tracks),
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
const Ac = 100;
function Yr(t, e, n, s) {
  const i = [], o = [], { duration: r, alternate: a } = s, l = (p, g, d, m) => {
    o.push([p, g]);
    const y = [];
    t.forEach((b, k) => {
      (d === "forward" ? (m ? b >= p : b > p) && b <= g : (m ? b <= p : b < p) && b >= g) && y.push(k);
    }), y.sort((b, k) => (d === "forward" ? t[b] - t[k] : t[k] - t[b]) || b - k);
    for (const b of y) i.push({ kind: "event", index: b, direction: d });
  };
  let c = e.time, h = e.direction, f = e.fresh === !0;
  const u = Math.min(Ac, Math.max(0, n.iteration - e.iteration));
  for (let p = 0; p < u; p++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, f), i.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, f = !1) : (c = h === "forward" ? 0 : r, f = !0);
  }
  return u > 0 && s.holding && !a ? { crossings: i, passes: o } : (l(c, n.time, h, f), { crossings: i, passes: o });
}
function Pc(t) {
  return ae(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: jr(t.inertia),
    ...Wt(t)
  } : le(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...Wt(t)
  } : ci(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(cs),
    ...Wt(t)
  } : Er(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(cs),
    ...Wt(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(cs),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Wt(t)
  };
}
function jr(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function cs(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function Wt(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function $c(t) {
  if (ae(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: jr(e.inertia),
      ...Wt(e)
    };
  }
  if (le(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...Wt(e)
    };
  }
  if (ci(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...Wt(e)
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
      ...Wt(e)
    };
  }
  return Fs({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Wt(t)
  });
}
function _c(t) {
  const e = t._config.markers;
  return {
    formatVersion: Tr(t.tracks),
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
    tracks: t.tracks.map(Pc),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function ze(t) {
  const e = t.formatVersion ?? 1;
  if (e > Ci)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${Ci}. Update tinyfly to play it.`
    );
  return new $e({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map($c),
    captions: t.captions
  });
}
function $g(t) {
  return JSON.stringify(_c(t));
}
function _g(t) {
  const e = JSON.parse(t);
  return ze(e);
}
function an(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function Gn(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function Xr(t, e, n) {
  return e + t.next() * (n - e);
}
function Ic(t, e, n, s) {
  if (s <= 0) return Xr(t, e, n);
  const i = Math.floor((n - e) / s), o = Math.round(t.next() * i);
  return e + o * s;
}
function Ig(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const qr = /^([+\-*/])=\s*(-?[\d.]+)$/, Ur = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Hg(t) {
  return typeof t != "string" ? !1 : qr.test(t.trim()) || Ur.test(t.trim());
}
function Vr(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = qr.exec(n);
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
  const i = Ur.exec(n);
  if (i) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const o = Number.parseFloat(i[1]), r = Number.parseFloat(i[2]), a = i[3] !== void 0 ? Number.parseFloat(i[3]) : void 0;
    return a !== void 0 ? Ic(e.random, o, r, a) : Xr(e.random, o, r);
  }
  return t;
}
function Hc(t, e = 0, n) {
  const s = [];
  let i = e;
  for (const o of t) {
    const r = Vr(o, { base: i, random: n });
    s.push(r), typeof r == "number" && (i = r);
  }
  return s;
}
class Og {
  random;
  constructor(e) {
    this.random = Gn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return Vr(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return Hc(e, n, this.random);
  }
}
const Oc = 600;
function Cc(t) {
  if (Array.isArray(t)) {
    const [u, p, g, d] = t;
    return { fn: Gi(u, p, g, d), bezier: [u, p, g, d] };
  }
  const { segments: e } = Te(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, i = e[e.length - 1], o = i.endX - n, r = i.endY - s;
  if (o === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (u) => (u - n) / o, l = (u) => (u - s) / r;
  if (e.length === 1 && i.type === "C") {
    const [u, p, g, d] = i.points, m = [a(u), l(p), a(g), l(d)];
    return { fn: Gi(...m), bezier: m };
  }
  const c = [], h = [], f = Math.max(8, Math.ceil(Oc / e.length));
  for (const u of e)
    for (let p = c.length === 0 ? 0 : 1; p <= f; p++) {
      const [g, d] = Fc(u, p / f);
      c.push(a(g)), h.push(l(d));
    }
  return { fn: Wc(c, h) };
}
function Rc(t = {}) {
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
function Lc(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (i) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * i) : (1 - i) ** 2;
  return (i) => i <= 0 || i >= 1 ? 0 : Math.sin(i * e * Math.PI * 2) * s(i);
}
function Fc(t, e) {
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
function Wc(t, e) {
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
function Gi(t, e, n, s) {
  const i = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, o = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const f = i(a, t, n) - r, u = o(a, t, n);
      if (Math.abs(f) < 1e-6) return i(a, e, s);
      if (Math.abs(u) < 1e-6) break;
      a -= f / u;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      i(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return i(a, e, s);
  };
}
const Bc = 350, Dc = 300, Nc = 550;
function Cg(t, e = {}) {
  const n = e.lead ?? Bc, s = e.gap ?? Dc, i = e.tail ?? Nc, o = [];
  let r = 0;
  return t.forEach((a, l) => {
    const c = [];
    let h = r + n;
    a.lines.forEach((u, p) => {
      if (!(u.duration >= 0))
        throw new Error(`narration: scene ${l} line ${p} has an invalid duration (${u.duration})`);
      p > 0 && (h += s), c.push({
        id: u.id ?? `s${l}-l${p}`,
        scene: l,
        line: p,
        start: h,
        end: h + u.duration,
        text: u.text
      }), h += u.duration;
    });
    const f = h + i + (a.tail ?? 0);
    o.push({ id: a.id ?? `s${l}`, start: r, duration: f - r, cues: c }), r = f;
  }), { duration: r, scenes: o, cues: o.flatMap((a) => a.cues) };
}
function Rg(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function Lg(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const zr = (t) => 6e4 / t.bpm;
function fi(t, e) {
  return t.offset + e * zr(t);
}
function di(t, e) {
  return (e - t.offset) / zr(t);
}
function Fg(t, e) {
  return fi(t, Math.round(di(t, e)));
}
function Wg(t, e) {
  return fi(t, Math.ceil(di(t, e) - 1e-9));
}
function Bg(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), i = [];
  if (!(t.bpm > 0) || n < e) return i;
  for (let o = Math.ceil(di(t, e) - 1e-9); ; o++) {
    const r = fi(t, o);
    if (r > n + 1e-9) break;
    i.push({ time: r, bar: (o % s + s) % s === 0, n: o });
  }
  return i;
}
const fe = 100;
function Dg(t, e, n = {}) {
  const s = n.minBpm ?? 70, i = n.maxBpm ?? 180, o = Math.max(1, Math.round(e / fe)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / o);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let M = 0; M < a; M++) {
    let H = 0;
    for (let $ = M * o; $ < (M + 1) * o; $++) H += t[$] * t[$];
    l[M] = Math.log(1e-6 + H / o);
  }
  const c = new Float64Array(a);
  for (let M = 1; M < a; M++) c[M] = Math.max(0, l[M] - l[M - 1]);
  const h = c.reduce((M, H) => M + H, 0) / a;
  for (let M = 0; M < a; M++) c[M] = Math.max(0, c[M] - h);
  const f = Math.max(1, Math.floor(60 * fe / i)), u = Math.min(a - 1, Math.ceil(60 * fe / s)), p = (M) => {
    let H = 0;
    for (let $ = M; $ < a; $++) H += c[$] * c[$ - M];
    return H / (a - M);
  };
  let g = 0;
  for (let M = 0; M < a; M++) g += c[M] * c[M];
  g /= a;
  let d = f, m = -1 / 0;
  for (let M = f; M <= u; M++) {
    const H = 60 * fe / M, $ = Math.exp(-0.5 * (Math.log2(H / 120) / 0.9) ** 2), A = p(M) * $;
    A > m && (m = A, d = M);
  }
  const y = (M) => {
    const H = Math.floor(M);
    return H < 0 || H + 1 >= a ? 0 : c[H] + (c[H + 1] - c[H]) * (M - H);
  }, b = (M, H) => {
    let $ = 0;
    for (let A = H; A < a; A += M) $ += y(A);
    return $;
  };
  let k = d, x = 0, v = -1 / 0;
  for (let M = d - 0.6; M <= d + 0.6 + 1e-9; M += 0.02) {
    if (M < 1) continue;
    const H = Math.max(1, Math.round(M * 4));
    for (let $ = 0; $ < H; $++) {
      const A = $ / H * M, R = b(M, A);
      R > v && (v = R, x = A, k = M);
    }
  }
  const T = 60 * fe / k, E = g > 0 ? Math.max(0, Math.min(1, p(d) / g)) : 0, O = (x + 0.5) * 1e3 / fe;
  return { bpm: Math.round(T * 100) / 100, offset: Math.round(O % (6e4 / T)), confidence: E };
}
const Kc = 600, Yc = 250, Ji = 1;
function Ng(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, i = {}, o = (f, u, p, g) => {
    const d = i[f] ??= [];
    for (; d.length > 0 && d[d.length - 1].time >= u; ) d.pop();
    d.push({ time: u, value: p, ...g ? { easing: g } : {} });
  }, r = (f) => {
    const u = f.rotate * Math.PI / 180, p = (f.focusX - s.x) * f.scale, g = (f.focusY - s.y) * f.scale;
    return {
      x: -(p * Math.cos(u) - g * Math.sin(u)),
      y: -(p * Math.sin(u) + g * Math.cos(u)),
      scale: f.scale,
      rotate: f.rotate
    };
  }, a = (f, u, p) => {
    const g = r(u);
    for (const d of ["x", "y", "scale", "rotate"]) o(d, f, g[d], p);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((f, u) => f.at - u.at), h = c.filter((f) => !("shake" in f));
  h.length > 0 && a(0, l);
  for (const f of h)
    if ("frame" in f) {
      const u = Math.max(Ji, f.duration ?? Kc);
      a(f.at, l), l = {
        focusX: f.frame.focus?.x ?? s.x,
        focusY: f.frame.focus?.y ?? s.y,
        scale: f.frame.scale ?? 1,
        rotate: f.frame.rotate ?? 0
      }, a(f.at + u, l, f.easing ?? (u > Ji ? "ease-in-out" : void 0));
    } else {
      const { follow: u } = f, p = u.lag ?? Yc, g = new $e({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: u.x }] }), d = (b) => g.getStateAtTime(b).values.get("s")?.get("x") ?? l.focusX, m = [f.at, ...u.x.map((b) => b.time).filter((b) => b > f.at && b < f.until), f.until];
      a(f.at, l);
      const y = (b) => ({
        focusX: d(b) + (u.lead ?? 0),
        focusY: u.y ?? l.focusY,
        scale: u.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const b of m) {
        const k = u.x.find((x) => x.time === b)?.easing;
        a(b + p, y(b), b === f.at ? "ease-in-out" : k);
      }
      l = y(f.until);
    }
  for (const f of c.filter((u) => "shake" in u)) {
    const u = f.shake.strength ?? 12, p = f.shake.roll ?? 1.5, g = 1e3 / (f.shake.frequency ?? 24), d = Gn(f.shake.seed ?? Math.round(f.at) + 1), m = () => d.next() * 2 - 1;
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) o(y, f.at, 0);
    for (let y = f.at + g; y < f.at + f.duration; y += g) {
      const b = 1 - (y - f.at) / f.duration;
      o("shakeX", y, m() * u * b), o("shakeY", y, m() * u * b), o("shakeRotate", y, m() * p * b);
    }
    for (const y of ["shakeX", "shakeY", "shakeRotate"]) o(y, f.at + f.duration, 0, "ease-out");
  }
  return Object.entries(i).map(([f, u]) => ({ id: `${n}-${f}`, target: n, property: f, keyframes: u }));
}
function jc(t, e) {
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
function Ws(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let i, o = 1 / 0;
  for (const r of e) {
    const a = jc(t, r);
    a < o && (o = a, i = r);
  }
  return i !== void 0 && o <= Math.max(2, Math.floor(t.length / 3)) ? i : void 0;
}
function _t(t, e, n, s) {
  const i = typeof e == "string" ? s ?? Ws(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${i ? `: did you mean "${i}"?` : "."} Known: ${n.join(", ")}`;
}
const Lt = (t) => Math.round(t * 1e3) / 1e3;
function Xc(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, i = t.length;
  let o = `M${Lt(t[0].x)} ${Lt(t[0].y)}`;
  if (i === 1) return o;
  const r = (l) => s ? t[(l % i + i) % i] : t[Math.max(0, Math.min(i - 1, l))], a = s ? i : i - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), f = r(l + 1), u = r(l + 2);
    if (n === 0) {
      o += ` L${Lt(f.x)} ${Lt(f.y)}`;
      continue;
    }
    const p = n / 6, g = h.x + (f.x - c.x) * p, d = h.y + (f.y - c.y) * p, m = f.x - (u.x - h.x) * p, y = f.y - (u.y - h.y) * p;
    o += ` C${Lt(g)} ${Lt(d)} ${Lt(m)} ${Lt(y)} ${Lt(f.x)} ${Lt(f.y)}`;
  }
  return s ? `${o} Z` : o;
}
const bt = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function qc(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function pi(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = bt(e.cx), s = bt(e.cy), i = t.tag.toLowerCase() === "circle" ? bt(e.r) : bt(e.rx), o = t.tag.toLowerCase() === "circle" ? bt(e.r) : bt(e.ry);
      return `M${n + i} ${s} A${i} ${o} 0 1 1 ${n - i} ${s} A${i} ${o} 0 1 1 ${n + i} ${s} Z`;
    }
    case "rect": {
      const n = bt(e.x), s = bt(e.y), i = bt(e.width), o = bt(e.height);
      let r = e.rx != null ? bt(e.rx) : e.ry != null ? bt(e.ry) : 0, a = e.ry != null ? bt(e.ry) : r;
      return r = Math.min(r, i / 2), a = Math.min(a, o / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + i} V${s + o} H${n} Z` : `M${n + r} ${s} H${n + i - r} A${r} ${a} 0 0 1 ${n + i} ${s + a} V${s + o - a} A${r} ${a} 0 0 1 ${n + i - r} ${s + o} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + o - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${bt(e.x1)} ${bt(e.y1)} L${bt(e.x2)} ${bt(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = qc(e.points);
      if (n.length === 0) return null;
      const s = n.map((i, o) => `${o === 0 ? "M" : "L"}${i.x} ${i.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function Kg(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), i = Math.max(0, n.length), o = n.since !== void 0 ? Math.max(e - i, n.since) : e - i;
  if (o >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = o + (e - o) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: i > 0 ? (e - c) / i : 0 });
  }
  return a;
}
const Uc = 2.5;
function Vc(t) {
  const e = [], n = [], s = t.length, i = (o, r) => {
    for (let a = o + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[o].x) * r, c = (t[a].y - t[o].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let o = 0; o < s; o++) {
    const r = t[o], a = i(o, -1), l = i(o, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let f = c[0] + h[0], u = c[1] + h[1];
    const p = Math.hypot(f, u);
    p < 1e-9 ? (f = c[0], u = c[1]) : (f /= p, u /= p);
    const g = f * c[0] + u * c[1], d = Math.min(Uc, 1 / Math.max(g, 1e-6)), m = r.width / 2 * d;
    e.push({ x: r.x - u * m, y: r.y + f * m }), n.push({ x: r.x + u * m, y: r.y - f * m });
  }
  return { left: e, right: n };
}
function zc(t) {
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
function xn(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function Jn(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function Xe(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function qe(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Hn(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function gi(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function Gr(t, e) {
  return gi(Jn(t, e));
}
function Ge(t) {
  const e = gi(t);
  return e === 0 ? [0, 0, 0] : Xe(t, 1 / e);
}
function Jr(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const Yg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: xn,
  cross: Hn,
  distance: Gr,
  dot: qe,
  length: gi,
  lerp: Jr,
  normalize: Ge,
  scale: Xe,
  subtract: Jn
}, Symbol.toStringTag, { value: "Module" })), Gc = Math.PI / 180;
function Zr() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function Qt(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let i = 0; i < 4; i++) {
      let o = 0;
      for (let r = 0; r < 4; r++) o += t[r * 4 + i] * e[s * 4 + r];
      n[s * 4 + i] = o;
    }
  return n;
}
function Qr(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function Mn(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function Je(t) {
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
function ta(t, e, n) {
  const s = Je(e);
  for (let i = 0; i < 3; i++)
    s[i] *= n[0], s[4 + i] *= n[1], s[8 + i] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function Jc(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function Zc(t) {
  const [e, n, s, i, o, r, a, l, c, h, f, u, p, g, d, m] = t, y = e * r - n * o, b = e * a - s * o, k = e * l - i * o, x = n * a - s * r, v = n * l - i * r, T = s * l - i * a, E = c * g - h * p, O = c * d - f * p, M = c * m - u * p, H = h * d - f * g, $ = h * m - u * g, A = f * m - u * d, R = y * A - b * $ + k * H + x * M - v * O + T * E;
  if (Math.abs(R) < 1e-12) return null;
  const L = 1 / R;
  return [
    (r * A - a * $ + l * H) * L,
    (s * $ - n * A - i * H) * L,
    (g * T - d * v + m * x) * L,
    (f * v - h * T - u * x) * L,
    (a * M - o * A - l * O) * L,
    (e * A - s * M + i * O) * L,
    (d * k - p * T - m * b) * L,
    (c * T - f * k + u * b) * L,
    (o * $ - r * M + l * E) * L,
    (n * M - e * $ - i * E) * L,
    (p * v - g * k + m * y) * L,
    (h * k - c * v - u * y) * L,
    (r * O - o * H - a * E) * L,
    (e * H - n * O + s * E) * L,
    (g * b - p * x - d * y) * L,
    (c * x - h * b + f * y) * L
  ];
}
function Qc(t, e, n, s) {
  const i = 1 / Math.tan(t * Gc / 2), o = 1 / (n - s);
  return [i / e, 0, 0, 0, 0, i, 0, 0, 0, 0, (s + n) * o, -1, 0, 0, 2 * s * n * o, 0];
}
function th(t, e, n, s, i, o) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (o - i);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(o + i) * l, 1];
}
function eh(t, e, n = [0, 1, 0]) {
  const s = Ge(Jn(t, e)), i = Ge(Hn(n, s)), o = Hn(s, i);
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
    -qe(i, t),
    -qe(o, t),
    -qe(s, t),
    1
  ];
}
function ea(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], i = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], o = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return o === 1 || o === 0 ? [n, s, i] : [n / o, s / o, i / o];
}
const jg = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: ta,
  fromQuat: Je,
  identity: Zr,
  invert: Zc,
  lookAt: eh,
  multiply: Qt,
  orthographic: th,
  perspective: Qc,
  scaling: Mn,
  transformPoint: ea,
  translation: Qr,
  transpose: Jc
}, Symbol.toStringTag, { value: "Module" })), hn = {
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
}, Zi = {
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
function nh(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Et({ type: "bounce", mode: "in" });
Et({ type: "bounce", mode: "in-out" });
function On(t) {
  const e = na.get(t.trim().toLowerCase());
  if (e) return e;
  const n = nh(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Et(r) };
  }
  const i = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (i) {
    const [, o, r, a] = i, l = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), c = r === "inout" ? "in-out" : r;
    if (o === "back" && l.length === 0 && n in hn)
      return { easing: { type: "cubic-bezier", points: hn[n] } };
    const h = o === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : o === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Et(h) };
  }
  return n in Zi ? { easing: Zi[n] } : n in hn ? { easing: { type: "cubic-bezier", points: hn[n] } } : { easing: "ease-out" };
}
const na = /* @__PURE__ */ new Map();
function mi(t, e) {
  return na.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function Bs(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const sa = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function ia(t) {
  return typeof t == "string" && sa.test(t);
}
function sh(t = 1) {
  let e = Bs(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (f) => c(...h, f)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), i = (l, c, h, f, u) => c === l ? h : h + (u - l) / (c - l) * (f - h), o = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return Qi(l, c, 1 / 0);
    if ("values" in l) return Qi(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, r = (l, c, h) => {
    const f = l + e() * (c - l);
    return h ? Math.round(f / h) * h : f;
  };
  return {
    clamp: n(3, s),
    mapRange: n(5, i),
    normalize: n(3, (l, c, h) => i(l, c, 0, 1, h)),
    interpolate: n(3, (l, c, h) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const f = {};
        for (const u of Object.keys(l))
          f[u] = In(l[u])(l[u], c[u], h);
        return f;
      }
      return In(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const d = l, m = (y) => d[(Math.round(y) % d.length + d.length) % d.length];
        return c === void 0 ? m : m(c);
      }
      const f = l, p = c - f, g = (d) => p === 0 ? f : ((d - f) % p + p) % p + f;
      return h === void 0 ? g : g(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const f = c - l;
      if (f === 0) return l;
      const u = ((h - l) % (f * 2) + f * 2) % (f * 2);
      return l + (u > f ? f * 2 - u : u);
    }),
    snap: n(2, o),
    random: ((l, c, h, f) => {
      if (Array.isArray(l)) {
        const p = () => l[Math.floor(e() * l.length)];
        return c === !0 ? p : p();
      }
      const u = () => r(l, c, h);
      return f ? u : u();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(e() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: f = "start", ease: u }) => (p, g, d) => {
      const m = d.length, b = hi(p, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: f }), k = c !== void 0 ? c : (h ?? 1) * Pr(m, f), x = u && k > 0 ? u(b / k) * k : b;
      return l + x;
    },
    pipe: (...l) => (c) => l.reduce((h, f) => f(h), c),
    splitColor: (l) => ih(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = Bs(l);
    },
    resolveRandomString: (l) => {
      const c = sa.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((d) => d.trim()).filter(Boolean).map((d) => Number.isFinite(Number(d)) ? Number(d) : d.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, f, u] = c.split(",").map((p) => Number.parseFloat(p));
      return r(h, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Qi(t, e, n) {
  let s = e, i = 1 / 0;
  for (const o of t) {
    const r = Math.abs(o - e);
    r < i && (i = r, s = o);
  }
  return i <= n ? s : e;
}
function ih(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const o = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return o.length >= 4 ? [o[0], o[1], o[2], Math.round(o[3] / 255 * 1e3) / 1e3] : [o[0], o[1], o[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((i) => Number.parseFloat(i));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const oh = /^([+-])=\s*(-?[\d.]+)$/, rh = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function He(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const i = t.trim();
  if (i === "") return e.cursor;
  const o = oh.exec(i);
  if (o) {
    const c = s(o[2]);
    return e.cursor + (o[1] === "-" ? -c : c);
  }
  const r = rh.exec(i);
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
function ah(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function lh(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, i = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), o = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (i - 1) } : typeof r == "number" ? o(Math.max(0, Math.min(t - 1, r))) : r === "end" ? o(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (i - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: d, y: m } = o(g), y = Math.abs(d - a.x), b = Math.abs(m - a.y);
    return e.axis === "x" ? y : e.axis === "y" ? b : Math.hypot(y, b);
  };
  let c = Array.from({ length: t }, (g, d) => l(d));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const f = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, u = e.ease ? On(e.ease) : void 0, p = u ? u.fn ?? Et(u.easing) : void 0;
  return c.map((g) => {
    const d = h === 0 ? 0 : g / h;
    return (p ? p(d) : d) * f;
  });
}
const yi = /* @__PURE__ */ new Set([
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
]), ch = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Tn(t) {
  const e = {}, n = {};
  for (const [s, i] of Object.entries(t))
    yi.has(s) ? e[s] = i : n[ch[s] ?? s] = i;
  return { config: e, properties: n };
}
function Cn(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function Ds(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : ah(t) ? { offsets: lh(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const hh = {
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
function oa(t) {
  return hh[t];
}
function uh(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = Xc(e.path, { curviness: e.curviness });
  else if (rn(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function fh(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function ra(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function dh(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = ra(e);
  if (typeof s != "string" || !rn(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function ph(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, to(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return to(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const i = s(n[0]), o = s(n[1]);
  return i <= o ? [i, o] : [o, i];
}
function gh(t, e) {
  const [n, s] = ph(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function mh(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...gh(n, e) };
}
function yh(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function to(t, e) {
  return Math.max(0, Math.min(e, t));
}
function bh(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function wh(t, e, n) {
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
      seed: i.seed ?? bh(`${e}|${i.text}`)
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
function bi(t) {
  return Math.max(0.1, t / 25);
}
function kh(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? bi(n.resistance) : void 0), i = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? i.end = [n.end(_n(i))] : n.end !== void 0 && (i.end = Array.isArray(n.end) ? [...n.end] : n.end), i;
}
function vh(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in ns))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(ns).join(", ")}`
    );
  return {
    ...e.preset ? ns[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function Sh(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class ve {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Bs(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new $e({
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
    return this.build(e, void 0, Oe(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: i, properties: o } = Tn(Oe(n)), { motionPath: r, text: a, scrambleText: l, ...c } = o, h = this.targetsOf(e)[0], f = { ...i };
    for (const g of Object.keys(c))
      f[g] = this.resolveStart(h, g);
    r !== void 0 && (f.motionPath = fh(r));
    const u = {}, p = String(this.resolveStart(h, "text"));
    return a !== void 0 && (u.text = hs(a), f.text = typeof a == "object" ? { ...a, value: p } : p), l !== void 0 && (u.text = hs(l), f.scrambleText = typeof l == "object" ? { ...l, text: p } : p), this.build(e, { ...c, ...u }, f, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, i) {
    const { properties: o } = Tn(Oe(n));
    return this.build(e, o, Oe(s), i);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Oe(n), duration: 0 }, s);
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
    const n = Math.max(0, He(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return He(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, He(n, this.context())), this;
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
    const s = He(n, this.context());
    for (const o of e.timeline.tracks) {
      if (!("keyframes" in o)) continue;
      const r = Fs({
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
    const { config: o, properties: r } = Tn(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...f } = r, u = this.targetsOf(e), p = He(i, this.context()), g = Cn(o.delay, 0), d = Cn(o.duration, 500), m = Ds(o.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(o.ease), b = [], k = o.spring;
    let x = 0, v = !1;
    for (const [$, A] of Object.entries(f)) {
      const R = A;
      let L = n?.[$] !== void 0 ? n[$] : this.resolveStart(u[0], $);
      if (typeof L != typeof R && (this.warn(
        `no usable start value for "${$}" on "${u[0]}" — it will snap to ${String(R)}. Use fromTo() to animate it.`
      ), L = R), k !== void 0 && (typeof L != "number" || typeof R != "number") && this.warn(`spring works on numbers, so "${$}" on "${u[0]}" eases instead`), k !== void 0 && typeof L == "number" && typeof R == "number") {
        const it = {
          ...vh(k),
          from: L,
          to: R,
          velocity: Sh(k, $) ?? this.options.startVelocity?.(u[0], $) ?? 0
        }, j = this.nextTrackId(`${u[0]}-${$}-spring`), Q = {
          id: j,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...m && u.length > 1 && { stagger: m },
          property: $,
          kind: "spring",
          spring: it,
          delay: p + g
        };
        this.timeline.addTrack(Q), b.push(j), x = Math.max(x, xl(it));
        for (const G of u) this.lastValues.set(`${G}|${$}`, R);
        continue;
      }
      v = !0;
      const N = this.keyframesFor(L, R, d, y, o.ease), U = this.nextTrackId(`${u[0]}-${$}`);
      this.timeline.addTrack(
        Fs({
          id: U,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...m && u.length > 1 && { stagger: m },
          property: $,
          delay: p + g,
          keyframes: N,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...$ === "quaternion" && { interpolation: "slerp" }
        })
      ), b.push(U);
      for (const it of u) this.lastValues.set(`${it}|${$}`, R);
    }
    const T = wh({ text: l, scrambleText: c }, u[0], d);
    if (T) {
      const $ = n?.text ?? n?.scrambleText, A = $ !== void 0 ? hs($) : this.resolveStart(u[0], "text"), R = this.nextTrackId(`${u[0]}-text`), L = {
        id: R,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...m && u.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof A == "string" ? A : String(A ?? ""), ...T },
        delay: p + g,
        keyframes: this.keyframesFor(0, 1, d, y, o.ease)
      };
      this.timeline.addTrack(L), b.push(R);
      for (const N of u) this.lastValues.set(`${N}|text`, T.to);
    }
    if (a !== void 0) {
      const { config: $, start: A, end: R } = uh(a), L = this.nextTrackId(`${u[0]}-motionPath`), N = {
        id: L,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...m && u.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: $,
        delay: p + g,
        keyframes: this.keyframesFor(A, R, d, y, o.ease)
      };
      this.timeline.addTrack(N), b.push(L);
    }
    if (h !== void 0)
      for (const [$, A] of Object.entries(h)) {
        const R = this.resolveStart(u[0], $);
        if (typeof R != "number") {
          this.warn(`inertia on "${$}" needs a numeric start value; skipped`);
          continue;
        }
        const L = kh(R, A), N = this.nextTrackId(`${u[0]}-${$}-inertia`), U = {
          id: N,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...m && u.length > 1 && { stagger: m },
          property: $,
          kind: "inertia",
          inertia: L,
          delay: p + g
        };
        this.timeline.addTrack(U), b.push(N), x = Math.max(x, on(L));
        for (const it of u) this.lastValues.set(`${it}|${$}`, sn(L));
      }
    const M = ((h !== void 0 || k !== void 0) && !v && !T && a === void 0 ? x : Math.max(d, x)) + (m && u.length > 1 ? qn(u.length, m) : 0), H = p + g + M;
    return this.previousStart = p + g, this.previousEnd = H, this.cursor = Math.max(this.cursor, H), {
      trackIds: b,
      start: p + g,
      end: H,
      kill: () => {
        for (const $ of b) this.timeline.removeTrack($);
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
    const a = typeof o == "string" ? On(o) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && $n(i)) {
      const c = a?.fn ?? Et(i);
      return [r, ...Nr(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    const r = oa(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return On(e).easing;
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
function hs(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function xh(t) {
  return new ve(t);
}
function Oe(t) {
  return yh(dh(t));
}
function Mh(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${Je(zt(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const Th = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Eh = "#ffffff", Ah = "rgba(0, 0, 0, 0.5)";
function Ph(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Eh})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, i = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${i}px ${t.shadowColor ?? Ah})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function $h(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function _h(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const eo = /* @__PURE__ */ new Set([
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
]), Ih = /* @__PURE__ */ new Set([
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
]), Hh = [
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
], Oh = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), Ch = /* @__PURE__ */ new Set(["originX", "originY"]), Rh = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Lh = /* @__PURE__ */ new Set(["drawOn"]), Fh = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, no = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Wh = "http://www.w3.org/2000/svg";
class oe {
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
    for (const [g, d] of n)
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !Lh.has(g)) {
        if (Ih.has(g))
          (s ??= {})[g] = d;
        else if (Oh.has(g))
          typeof d == "number" && ((i ??= {})[g] = d);
        else if (Ch.has(g))
          typeof d == "number" && ((o ??= {})[g] = d);
        else if (Rh.has(g))
          typeof d == "number" && ((r ??= {})[g] = d);
        else if (Th.has(g))
          (a ??= {})[g] = d;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof d == "string")
            $h(e, d);
          else if (g === "d" && typeof d == "string") {
            const m = e;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(e, g, d);
        }
      }
    const f = n.get("shine");
    typeof f == "number" && this.applyShine(e, f);
    const u = [], p = n.get("perspective");
    if (typeof p == "number" && p > 0 && u.push(`perspective(${p}px)`), s)
      for (const g of Hh) {
        const d = s[g];
        if (d === void 0) continue;
        const m = this.buildTransformPart(g, d);
        m && u.push(m);
      }
    if (u.length > 0 && (e.style.transform = u.join(" "), _h(e)), i && (i.childPerspective !== void 0 && (e.style.perspective = `${i.childPerspective}px`), (i.perspectiveOriginX !== void 0 || i.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${i.perspectiveOriginX ?? 50}% ${i.perspectiveOriginY ?? 50}%`)), o) {
      const g = o.originX ?? 50, d = o.originY ?? 50;
      e.style.transformOrigin = `${g}% ${d}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, d = r.clipRight ?? 0, m = r.clipBottom ?? 0, y = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${d}% ${m}% ${y}%)`;
    }
    if (a) {
      const g = Ph(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return Mh(n);
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
    if (e.namespaceURI === Wh && n in no) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[no[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? i = "color" : i = Fh[n] ?? n;
    let r;
    typeof s == "number" ? eo.has(n) || eo.has(i) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[i] = r;
  }
}
const Bh = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Dh {
  adapter = new oe();
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
  utils = sh();
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
    this.scheduler = e.scheduler ?? Bh, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      us(s) && this.currentCollector?.touch(s, i), n.push(i);
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
    if (us(e)) return [e];
    if (!Nh(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return us(e) ? this.elementName(e) : this.objectName(e);
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
function us(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Nh(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function Rn(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const so = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Kh(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Yh(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function jh(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || so(t) ? { path: t } : t, { align: s, alignOrigin: i, path: o, ...r } = n, a = (T) => {
    const E = so(T) ? T : e.query(T);
    return E || e.warn(`gsap-compat: motionPath could not find "${String(T)}"`), E;
  };
  let l = null, c = "";
  if (Array.isArray(o) || typeof o == "string" && rn(o))
    c = o;
  else {
    l = a(o);
    const T = l && pi({ tag: l.localName, attributes: Kh(l) });
    l && !T && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = T ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const f = s === !0 ? l : a(s);
  if (!f)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = e.targets[0];
  if (!u) return h;
  const [p, g, d, m, y, b] = Yh(f), k = Rn(u), [x, v] = i ?? [0.5, 0.5];
  for (const T of e.targets.slice(1)) {
    const E = Rn(T);
    if (Math.abs(E.left - k.left) > 0.5 || Math.abs(E.top - k.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [p, g, d, m, y - k.left - x * k.width, b - k.top - v * k.height], h;
}
const aa = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function la(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function ca(t) {
  if (!t) return null;
  const e = pi({ tag: t.localName, attributes: la(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function Xh(t, e, n) {
  const s = ra(t);
  if (typeof s == "string" && rn(s)) return s;
  const i = aa(s) ? s : typeof s == "string" ? e(s) : null, o = ca(i);
  return o || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const qh = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Uh(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : aa(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const i = pi({ tag: s.localName, attributes: la(s) });
    if (!i || !s.parentNode) return s;
    const o = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      qh.has(r.name) || o.setAttribute(r.name, r.value);
    return o.setAttribute("d", i), s.parentNode.replaceChild(o, s), o;
  });
}
const io = 0.3;
class Vh {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = oo(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = oo(), i = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const o = e / i * 1e3, r = n / i * 1e3;
    this.velocityX += (o - this.velocityX) * io, this.velocityY += (r - this.velocityY) * io;
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
function oo() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function zh(t, e, n) {
  let s = { delta: 0, line: null }, i = n;
  for (const o of t)
    for (const r of e) {
      const a = Math.abs(r - o);
      a <= i && (i = a, s = { delta: r - o, line: r });
    }
  return s;
}
function Gh(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class ha {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new Vh({
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
    const i = (this.options.axis ?? "both") === "y" ? this.y : this.x, o = Jh(i / s);
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
      ...Gh([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], o = zh([s], i, this.snapThreshold());
    s += o.delta, n === "x" ? this.snappedX = o.line : this.snappedY = o.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function Jh(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function Xg(t) {
  const e = new ha(t);
  return e.start(), e;
}
const Zh = { x: "x", y: "y", "x,y": "both" }, Ns = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function ro(t, e) {
  const n = Rn(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function ao(t) {
  return Array.isArray(t) ? [...t] : t;
}
function Qh(t, e, n, s = {}) {
  const [i] = e.resolveTargets(n), o = i ? e.elementFor(i) : void 0;
  if (!i || !o)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return tu(t, e, i, o, s);
  const r = Zh[s.type ?? "x,y"], a = () => {
    const d = e.appliedValue(i, "x"), m = e.appliedValue(i, "y");
    return { x: typeof d == "number" ? d : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Ns(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Ns(s.bounds) ? s.bounds : void 0) ?? (l ? ro(o, l) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, p = (d) => {
    const m = s.inertia === !0 ? {} : s.inertia, y = m.friction ?? (m.resistance !== void 0 ? bi(m.resistance) : 4), b = a(), k = h.bounds ?? {};
    let x, v;
    const T = m.end;
    if (Array.isArray(T)) {
      const O = _n({ from: b.x, velocity: r === "y" ? 0 : d.x, friction: y }), M = _n({ from: b.y, velocity: r === "x" ? 0 : d.y, friction: y });
      let H = T[0];
      for (const $ of T)
        Math.hypot($.x - O, $.y - M) < Math.hypot(H.x - O, H.y - M) && (H = $);
      H && (x = [H.x], v = [H.y]);
    } else typeof T == "number" ? (x = T, v = T) : T && (x = ao(T.x), v = ao(T.y));
    const E = {};
    r !== "y" && (E.x = { velocity: d.x, friction: y, min: k.minX, max: k.maxX, end: x }), r !== "x" && (E.y = { velocity: d.y, friction: y, min: k.minY, max: k.maxY, end: v }), f = t.to(o, { inertia: E, onComplete: () => s.onThrowComplete?.() });
  }, g = new ha({
    target: o,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), l && (h.bounds = ro(o, l)), s.onPress?.();
    },
    onDrag: (d) => {
      e.apply(i, r === "x" ? { x: d.x } : r === "y" ? { y: d.y } : { x: d.x, y: d.y }), s.onDrag?.(d);
    },
    onRelease: () => {
      const d = g.velocity;
      s.onRelease?.(d), s.inertia && p(d);
    }
  });
  return g.start(), {
    draggable: g,
    get position() {
      return a();
    },
    get rotation() {
      const d = e.appliedValue(i, "rotate");
      return typeof d == "number" ? d : 0;
    },
    destroy() {
      u(), g.destroy();
    }
  };
}
function tu(t, e, n, s, i) {
  const o = typeof i.bounds == "object" && i.bounds !== null && !Ns(i.bounds) ? i.bounds : {}, r = () => {
    const k = e.appliedValue(n, "rotate");
    return typeof k == "number" ? k : 0;
  }, a = (k) => Math.min(o.maxRotation ?? 1 / 0, Math.max(o.minRotation ?? -1 / 0, k));
  let l = null, c = !1, h, f = { x: 0, y: 0 }, u = 0, p = 0, g = [];
  const d = (k) => Math.atan2(k.clientY - f.y, k.clientX - f.x) * 180 / Math.PI, m = (k) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = k.pointerId, s.setPointerCapture?.(k.pointerId);
    const x = s.getBoundingClientRect();
    f = { x: x.left + x.width / 2, y: x.top + x.height / 2 }, u = d(k), p = r(), g = [{ time: performance.now(), rotation: p }], i.onPress?.();
  }, y = (k) => {
    if (!c || k.pointerId !== h) return;
    const x = d(k);
    let v = x - u;
    v > 180 && (v -= 360), v < -180 && (v += 360), u = x, p += v;
    let T = a(p);
    i.snap && (T = a(Math.round(T / i.snap) * i.snap)), e.apply(n, { rotate: T });
    const E = performance.now();
    for (g.push({ time: E, rotation: T }); g.length > 2 && E - g[0].time > 100; ) g.shift();
    const O = { x: 0, y: 0 };
    i.onDrag?.(O);
  }, b = (k) => {
    if (!c || k.pointerId !== h) return;
    c = !1;
    const x = g[0], v = g[g.length - 1], T = x && v ? (v.time - x.time) / 1e3 : 0, E = T > 0 ? (v.rotation - x.rotation) / T : 0;
    if (i.onRelease?.({ x: E, y: 0 }), !i.inertia) return;
    const O = i.inertia === !0 ? {} : i.inertia, M = O.friction ?? (O.resistance !== void 0 ? bi(O.resistance) : 4), H = typeof O.end == "number" || Array.isArray(O.end) ? O.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: E,
          friction: M,
          min: o.minRotation,
          max: o.maxRotation,
          end: Array.isArray(H) ? H.filter(($) => typeof $ == "number") : H
        }
      },
      onComplete: () => i.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", y), s.addEventListener("pointerup", b), s.addEventListener("pointercancel", b), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", y), s.removeEventListener("pointerup", b), s.removeEventListener("pointercancel", b);
    }
  };
}
const eu = { opacity: 0, scale: 0.6 };
function nu(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function lo(t) {
  const e = Rn(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Ks(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = nu(r);
    i.set(r, a);
    const l = ua(r);
    a && l !== void 0 && !o.has(l) && o.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: i, ids: o };
}
const fs = /* @__PURE__ */ new WeakMap();
function Ys(t, e, n, s = {}) {
  const i = s.duration ?? 0.6, o = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? eu : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const p of t.resolveTargets(s.targets)) {
      const g = t.elementFor(p);
      g && c.add(g);
    }
  const h = [...c].sort(
    (p, g) => p === g ? 0 : p.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = e({ onComplete: s.onComplete });
  let u = 0;
  for (const p of h) {
    const g = lo(p);
    if (!g) continue;
    let d = n.boxes.get(p) ?? null, m;
    const y = ua(p), b = !d && y !== void 0 ? n.ids.get(y) : void 0;
    b && b.element !== p && (d = b.box, m = b.element);
    const [k] = t.resolveTargets(p);
    fs.get(p)?.timeline.removeTracks({ target: k });
    const x = u * r;
    if (!d) {
      if (l === !1) continue;
      f.fromTo(p, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...fa(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: i, ease: o, delay: x }, 0), fs.set(p, f), u++;
      continue;
    }
    const v = d.cx - g.cx, T = d.cy - g.cy, E = a ? d.width / g.width : 1, O = a ? d.height / g.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(T) > 0.5 || Math.abs(E - 1) > 1e-3 || Math.abs(O - 1) > 1e-3)) {
      const $ = (A, R) => {
        const L = t.appliedValue(k, A);
        return typeof L == "number" && Math.abs(L - R) > 1e-6;
      };
      ($("x", 0) || $("y", 0) || $("scaleX", 1) || $("scaleY", 1)) && f.set(p, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const H = s.fade === !0 && m !== void 0;
    f.fromTo(
      p,
      { x: v, y: T, scaleX: E, scaleY: O, ...H && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...H && { opacity: 1 }, duration: i, ease: o, delay: x },
      0
    ), H && m && lo(m) && f.fromTo(m, { opacity: 1 }, { opacity: 0, duration: i, ease: o, delay: x }, 0), fs.set(p, f), u++;
  }
  return f;
}
function ua(t) {
  return t.dataset?.flipId;
}
function fa(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function su(t, e = {}) {
  const n = new Set((e.type ?? "chars,words,lines").split(",").map((d) => d.trim())), s = {
    chars: e.charsClass ?? "char",
    words: e.wordsClass ?? "word",
    lines: e.linesClass ?? "line"
  }, i = e.aria !== !1, o = t.map((d) => ({
    element: d,
    html: d.innerHTML,
    ariaLabel: d.getAttribute("aria-label")
  }));
  let r = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const h = () => {
    for (const { element: d, html: m, ariaLabel: y } of o)
      d.innerHTML = m, y === null ? d.removeAttribute("aria-label") : d.setAttribute("aria-label", y);
  }, f = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, u = () => {
    const d = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of o) {
      const y = (m.textContent ?? "").replace(/\s+/g, " ").trim(), b = iu(m, s.words), k = n.has("chars") ? b.flatMap((T) => ou(T, s.chars)) : [], x = n.has("lines") ? au(m, b, s.lines) : [];
      if (i) {
        !m.hasAttribute("aria-label") && y && m.setAttribute("aria-label", y);
        for (const T of b) T.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) d.words.push(...b);
      else for (const T of b) T.removeAttribute("class");
      d.chars.push(...k), d.lines.push(...x);
      const v = e.mask === "lines" ? x : e.mask === "words" ? b : e.mask === "chars" ? k : [];
      for (const T of v) d.masks.push(lu(T, `${s[e.mask]}-mask`));
    }
    r = d;
  }, p = {
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
      c || (f(), h(), u(), a = e.onSplit?.(p));
    },
    revert() {
      c = !0, l?.disconnect(), f(), h();
    }
  };
  u(), a = e.onSplit?.(p), e.autoSplit && g();
  function g() {
    const d = /* @__PURE__ */ new Map();
    let m = !1;
    const y = () => {
      if (m) return;
      m = !0;
      const k = () => {
        m = !1, p.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(k) : setTimeout(k, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((k) => {
        let x = !1;
        for (const v of k) {
          const T = Math.round(v.contentRect.width), E = d.get(v.target);
          d.set(v.target, T), E !== void 0 && E !== T && (x = !0);
        }
        x && y();
      });
      for (const k of t) l.observe(k);
    }
    const b = t[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return p;
}
function iu(t, e) {
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
function ou(t, e) {
  const n = t.ownerDocument, s = ru(t.textContent ?? "").map((i) => {
    const o = n.createElement("span");
    return o.className = e, o.style.display = "inline-block", o.textContent = i, o;
  });
  return t.replaceChildren(...s), s;
}
function ru(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function au(t, e, n) {
  const s = t.ownerDocument, i = new Map(e.map((g) => [g, g.getBoundingClientRect()])), o = [], r = (g) => {
    for (const d of Array.from(g.childNodes))
      d.nodeType === 3 || i.has(d) || d.tagName === "BR" ? o.push(d) : r(d);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, f = !1, u = [];
  const p = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), u = [];
  };
  for (const g of o) {
    if (g.tagName === "BR") {
      f = !0;
      continue;
    }
    const d = i.get(g);
    if (d && (!l || f || d.top > c + h) && (p(), c = d.top, h = d.height / 2, f = !1), !l) continue;
    const m = [];
    for (let k = g.parentNode; k && k !== t; k = k.parentNode) m.unshift(k);
    let y = 0;
    for (; y < u.length && y < m.length && u[y].original === m[y]; ) y++;
    u.length = y;
    let b = y === 0 ? l : u[y - 1].clone;
    for (const k of m.slice(y)) {
      const x = k.cloneNode(!1);
      b.appendChild(x), u.push({ original: k, clone: x }), b = x;
    }
    b.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function lu(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const co = {
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
function ho(t) {
  const e = t.trim().toLowerCase();
  if (e in co) return co[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function da(t) {
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
  const i = s[0] !== void 0 ? ho(s[0]) : void 0, o = s[1] !== void 0 ? ho(s[1]) : void 0;
  return {
    elementFraction: i ?? 0,
    viewportFraction: o ?? 0,
    offsetPx: e
  };
}
function Ze(t, e, n) {
  const s = da(n), i = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, o = e * s.viewportFraction;
  return i - o + s.offsetPx;
}
function qg(t, e, n, s) {
  const i = Ze(t, e, n), r = Ze(t, e, s) - i;
  return r <= 0 ? i <= 0 ? 1 : 0 : pa(-i / r);
}
function pa(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function cu(t, e, n, s) {
  if (n <= 0) return e;
  const i = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * i;
}
function uo(t, e, n, s, i) {
  const o = (h) => Ze({ top: t + i(h), bottom: t + i(h) + e, height: e }, n, s), r = o(0), a = o(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const f = (l + c) / 2;
    Math.sign(o(f)) === Math.sign(r) ? l = f : c = f;
  }
  return (l + c) / 2;
}
class hu {
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
function Ug(t) {
  const e = new hu(t);
  return e.start(), e;
}
class uu {
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
const fu = 0.15;
function du(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function pu(t, e, n) {
  const s = un(t + e * fu);
  if (typeof n == "function") return un(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : un(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let i = n[0];
  for (const o of n)
    Math.abs(o - s) < Math.abs(i - s) && (i = o);
  return un(i);
}
function gu(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const i = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * i;
}
class mu {
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
  animate(e, n, s, i = zn, o) {
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
function un(t) {
  return Math.max(0, Math.min(1, t));
}
class yu {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(e, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: i = "#3ecf7a", endColor: o = "#ff5a5a", id: r } = this.options, a = r ? `${r} ` : "", l = (c, h, f) => {
      const u = e.createElement("div");
      return u.textContent = `${a}${c}`, u.setAttribute("aria-hidden", "true"), u.className = "scroll-marker", Object.assign(u.style, {
        position: f ? "fixed" : "absolute",
        right: `${this.options.indent ?? 0}px`,
        zIndex: "2147483646",
        pointerEvents: "none",
        borderTop: `1px solid ${h}`,
        color: h,
        font: `${this.options.fontSize ?? "11px"} ui-monospace, monospace`,
        padding: "2px 6px",
        whiteSpace: "nowrap",
        background: "rgba(0, 0, 0, 0.35)"
      }), (n ?? e.body).appendChild(u), this.nodes.push(u), u;
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
const bu = 120, we = [], Ae = /* @__PURE__ */ new Set();
let ds = !1;
const wu = () => {
  ds || Ae.size === 0 || (ds = !0, queueMicrotask(() => {
    ds = !1;
    for (const t of Ae) t.afterRefresh();
  }));
}, ga = () => {
  for (const t of Ae) t.beforeRefresh();
  for (const t of we) t.refresh();
  for (const t of Ae) t.afterRefresh();
};
let ke = { width: 0, height: 0 };
const fo = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === ke.width && e !== ke.height, s = Math.abs(e - ke.height) < ke.height * 0.25, i = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && i || (ke = { width: t, height: e }, ga());
};
class Zn {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new mu((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new uu(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new yu(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), we.length === 0 && typeof window < "u" && (ke = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", fo, { passive: !0 })), we.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), we.splice(we.indexOf(this), 1), we.length === 0 && typeof window < "u" && window.removeEventListener("resize", fo), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    ga();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return Ae.add(e), () => Ae.delete(e);
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
      if (this.startPx = e + Ze(n, s, Ce(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const i = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(i.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, wu();
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
    this.targetProgress = s > 0 ? pa((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(i, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const i = Ce(this.options.end) ?? "bottom top", o = typeof i == "string" ? i.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (o) {
      const r = Number.parseFloat(o[1]);
      return this.startPx + (o[2] === "%" ? n * r / 100 : r);
    }
    return s + Ze(e, n, i);
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
    }, bu));
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
    const n = du(e), s = () => {
      this.snapTimer = null;
      const i = this.endPx - this.startPx, o = this.scrollPosition();
      if (!this.running || i <= 0 || o <= this.startPx || o >= this.endPx) return;
      const r = (o - this.startPx) / i, a = this.startPx + pu(r, this.releaseVelocity / i, n.snapTo) * i;
      Math.abs(a - o) < 1 || this.snapper.animate(o, a, gu(n, a - o, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), i = this.options.scroller?.getBoundingClientRect?.().left ?? 0, o = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - i - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (p) => a + p * (l - a), h = uo(r, s.width, o, Ce(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const f = Ce(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : c(uo(r, s.width, o, f, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (o, r) => {
      const a = Ce(o) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = da(a);
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
      this.lastFrameTime = n, this.displayProgress = cu(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function Ce(t) {
  return typeof t == "function" ? t() : t;
}
function Vg(t) {
  const e = new Zn(t);
  return e.start(), e;
}
const ps = /* @__PURE__ */ new Set(), ku = 16, po = 0.5, vu = 2;
class go {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), ps.add(this), this.stopListening = Zn.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of ps) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), ps.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) gs(e.element, e.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: o * 1e3, ease: n.ease ?? zn, elapsed: 0 }, this.requestFrame();
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
    for (const e of this.effects) gs(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? ku : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), i = this.clamp(this.target + s);
    i === this.target && i === this.current || (e.preventDefault(), this.journey = null, this.target = i, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= vu || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / o)), Math.abs(this.target - this.current) < po && (this.current = this.target);
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
        i.lagged = e === 0 ? s : i.lagged + (s - i.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - i.lagged) < po ? i.lagged = s : n = !0, o += s - i.lagged;
      }
      gs(i.element, o === 0 ? i.saved : `0 ${Su(o)}px`), i.shift = o;
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
function gs(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function Su(t) {
  return Math.round(t * 100) / 100;
}
function xu(t, e) {
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
function wi(t, e, n, s, i = () => {
}) {
  const o = (p) => typeof p == "string" ? t.query(p) ?? void 0 : p, r = o(e.trigger) ?? s;
  if (!r) {
    i(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const f = (p, g) => () => {
    g?.(), n && !a && xu(n, l[p] ?? "none"), e.once && p === 0 && queueMicrotask(() => h.destroy());
  }, u = e.containerAnimation ? Eu(t, e.containerAnimation, r, i) : void 0;
  return h = new Zn({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : o(e.pin),
    scroller: o(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : Mu(e.snap, n),
    markers: e.markers,
    container: u,
    onUpdate: (p, g) => {
      if (n && a !== !1 && n.progress(p), e.onUpdate) {
        const d = p < c || g < 0 ? -1 : 1;
        e.onUpdate({ progress: p, velocity: g, direction: d });
      }
      c = p;
    },
    onEnter: f(0, e.onEnter),
    onLeave: f(1, e.onLeave),
    onEnterBack: f(2, e.onEnterBack),
    onLeaveBack: f(3, e.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), t.own(h);
}
function Mu(t, e) {
  const n = (i) => i === "labels" ? (o) => Tu(o, e?.labelProgresses?.() ?? []) : i;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? On(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Et(s.easing) : void 0
  };
}
function Tu(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Eu(t, e, n, s) {
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
class ma {
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
class Au {
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
    const o = new ma(this.host, this.scope);
    o.conditions = n, o.add(() => e.setup(o)), e.context = o;
  }
}
class Pu {
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
const $u = { opacity: 0, y: -16 }, _u = { opacity: 0, y: 16 };
async function Iu(t, e, n, s) {
  const i = e.collector?.scope ?? e.root, o = i.ownerDocument ?? i, r = () => s.shared ? [...i.querySelectorAll(s.shared)] : [];
  if (s.native && typeof o.startViewTransition == "function")
    return Hu(o, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((y) => {
    m(y) || y();
  }), h = r(), f = h.length ? Ks(e, h) : void 0, u = s.from !== void 0 ? mo(e, s.from, s.shared) : [];
  if (u.length && s.leave !== !1) {
    const m = s.leave ?? $u;
    await c((y) => t.to(u, { ...m, duration: a, ease: l, onComplete: y }));
  }
  await s.update();
  const p = [], g = typeof s.to == "function" ? s.to() : s.to, d = g !== void 0 ? mo(e, g, s.shared) : [];
  if (d.length && s.enter !== !1) {
    const m = s.enter ?? _u;
    p.push(c((y) => t.fromTo(d, m, { ...fa(m), duration: a, ease: l, onComplete: y })));
  }
  if (f) {
    const m = r().filter((y) => !h.includes(y));
    m.length && p.push(
      c(
        (y) => Ys(e, n, f, {
          targets: m,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(p);
}
function mo(t, e, n) {
  const s = t.resolveTargets(e).map((i) => t.elementFor(i)).filter((i) => !!i);
  return n ? s.flatMap((i) => !i.querySelector(n) && !i.matches(n) ? [i] : [...i.children].filter((o) => !o.matches(n) && !o.querySelector(n))) : s;
}
async function Hu(t, e, n) {
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
const Ou = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => mi(t, Cc(e))
}, Cu = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => mi(t, { fn: Rc(e) })
}, Ru = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => mi(t, { fn: Lc(e) })
}, Lu = /* @__PURE__ */ new Set([
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
]), yo = 0.5, Fu = "power1.inOut";
function Wu(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function Bu(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) Lu.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? yo
    }));
  const s = Object.entries(e), i = t.duration ?? yo, o = e.easeEach ?? t.easeEach ?? Fu;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([u]) => u !== "easeEach").map(([u, p]) => ({ at: Number.parseFloat(u) / 100, step: p })).sort((u, p) => u.at - p.at), h = [];
    let f = 0;
    for (const { at: u, step: p } of c) {
      const g = Math.max(0, u - f);
      h.push({ ...n, ease: o, ...p, duration: g * i }), f = u;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: o, duration: i / a };
    for (const [f, u] of r)
      c < u.length && (h[f] = u[c]);
    l.push(h);
  }
  return l;
}
function bo(t, e, n, s = {}) {
  const i = e.collector?.scope ?? e.root, o = typeof s.scroller == "string" ? i.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: o ? o.scrollLeft : window.scrollX,
    y: o ? o.scrollTop : window.scrollY
  }, a = {
    x: o ? o.scrollWidth - o.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: o ? o.scrollHeight - o.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (b, k) => {
    if (k === void 0) return r[b];
    if (typeof k == "number") return k;
    if (k === "max") return a[b];
    const x = typeof k == "string" ? i.querySelector(k) : k;
    if (!x) return r[b];
    const v = x.getBoundingClientRect(), T = o?.getBoundingClientRect(), E = (b === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return b === "x" ? v.left - (T?.left ?? 0) + r.x - E : v.top - (T?.top ?? 0) + r.y - E;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, f = { ...r }, u = () => {
    o ? (o.scrollLeft = f.x, o.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, p = ["wheel", "touchstart", "keydown"], g = o ?? window, d = () => {
    y.kill(), m();
  }, m = () => {
    for (const b of p) g.removeEventListener(b, d);
  }, y = t.to(f, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      u(), s.onUpdate?.();
    },
    onComplete: () => {
      m(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const b of p) g.addEventListener(b, d, { passive: !0 });
  return y;
}
function Du(t, e, n) {
  const s = t.collector?.scope ?? t.root, i = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: o = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...f } = n, u = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, p = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, d = (y) => {
    g[y] !== void 0 && clearTimeout(g[y]), g[y] = void 0;
    const b = p[y].splice(0);
    b.length > 0 && u[y]?.(b);
  }, m = (y, b) => {
    if (u[y]) {
      if (p[y].push(b), r !== void 0 && p[y].length >= r) return d(y);
      g[y] === void 0 && (g[y] = setTimeout(() => d(y), o * 1e3));
    }
  };
  return i.map(
    (y) => wi(t, {
      ...f,
      trigger: y,
      onEnter: () => m("onEnter", y),
      onLeave: () => m("onLeave", y),
      onEnterBack: () => m("onEnterBack", y),
      onLeaveBack: () => m("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class jt {
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
    if (this.options = s, this.compat = new ve({
      ...s,
      startValue: (i, o) => {
        const r = e.objectFor(i);
        if (r) return ju(r[o]);
        const a = e.appliedValue(i, o);
        if (a !== void 0) return a;
        if (o === "d") return ca(e.elementFor(i)) ?? void 0;
        if (o === "text") return e.elementFor(i)?.textContent ?? void 0;
        if (o === "strokeDasharray" || o === "strokeDashoffset") {
          const l = vo(e.elementFor(i));
          if (l !== void 0) return o === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (i, o) => e.velocityOf(i, o),
      layoutColumns: (i) => ko(i.map((o) => e.elementFor(o))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = wi(e, i, this, this.firstElement, (o) => s.onWarning?.(o)));
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
    return Wu(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.to(o, i, r)));
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
    const i = this.timeline.currentTime, o = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: i }, a = s.duration ?? Math.abs(o - i) / 1e3 / (this.timeScale() || 1), l = new jt(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
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
    const i = this.events, { crossings: o, passes: r } = Yr(
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
      const f = (u, p, g) => {
        i(u, p, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(o, n, s, f), c === 1 / 0) return;
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
    const o = Bu(n);
    if (o.length === 0) return;
    const r = i.length > 1 ? Ds(n.stagger, this.staggerContext(i)) : void 0, a = i.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? Hs(i.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + Cn(n.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (l.forEach((m, y) => {
      o.forEach((b, k) => {
        const x = k === 0 ? h + c[y] : ">";
        this.tween(m, [b], x, ([v], T, E) => this.compat.to(T, v, E)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: p, onUpdate: g, onComplete: d } = n;
    p && this.events.push({ time: f, direction: "forward", run: p }), g && this.ranges.push({ start: f, end: u, run: g }), d && this.events.push({ time: u, direction: "forward", run: d });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => ko(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, i) {
    const o = e.map((u) => this.targetFor(u));
    if (!(e.length > 1 && (n.some(Yu) || e.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(e[0]);
      i(n.map((p) => this.prepare(wo(p, 0, u, this.stage.utils, o), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Ds(l, this.staggerContext(e)), f = h ? Hs(e.length, h).map((u) => u / 1e3) : e.map(() => 0);
    e.forEach((u, p) => {
      const g = p === 0 ? Cn(c.delay, 0) / 1e3 + f[0] : 0, d = p === 0 ? 0 : f[p] - f[p - 1], m = p === 0 ? s : `<${d < 0 ? "-" : "+"}${Math.abs(d).toFixed(6)}`, b = n.map((k, x) => x === a ? { ...c, delay: g } : k).map((k) => this.prepare(wo(k, p, this.targetFor(u), this.stage.utils, o), [u]));
      i(b, [u], m);
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
      const r = jh(e.motionPath, {
        query: i,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      o = { ...o, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = Xh(e.morphSVG, i, s), { morphSVG: a, ...l } = o;
      o = r ? { ...o, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = vo(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = o;
        o = l;
      } else
        o = mh(o, r);
    }
    return o;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Xu(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Nu(t = new Dh()) {
  const e = (o) => {
    const { config: r } = Tn(o);
    return new jt(t, {
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
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: f, ...u } = o;
    return u;
  }, s = (o) => (o && t.collector?.track(o), o), i = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (o, r) => {
      const [a] = t.resolveTargets(o);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? oa(r);
    },
    scrollTrigger: (o) => s(wi(t, o)),
    scrollBatch: (o, r) => Du(t, o, r).map((a) => s(a)),
    scrollTo: (o, r) => bo(i, t, o, r),
    refreshScroll: () => {
      Zn.refreshAll(), go.refreshAll();
    },
    smoothScroll: (o = {}) => {
      const r = typeof o.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(o.scroller) : o.scroller;
      return s(new go({ ...o, scroller: r }).start());
    },
    context: (o, r) => {
      const a = new ma(t, r);
      return o && a.add(() => o(a)), a;
    },
    matchMedia: (o) => new Au(t, o),
    customEase: Ou.create,
    customBounce: Cu.create,
    customWiggle: Ru.create,
    pageTransition: (o) => Iu(i, t, (r) => new jt(t, r), o),
    imageSequence: (o, r) => {
      const a = typeof o == "string" ? (t.collector?.scope ?? t.root).querySelector(o) : o;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(o)}`);
      return s(new Pu(a, r));
    },
    quickTo: (o, r, a = {}) => {
      const l = new jt(t, { paused: !0 }), [c] = t.resolveTargets(o);
      return Object.assign((f) => {
        if (!c) return;
        const u = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: f,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Ku(a.spring, r, u) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (o) => new jt(t, o),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (o, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof o != "string" && o !== window && o.nodeType === 1;
        return bo(i, t, a, {
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
    delayedCall: (o, r, a) => new jt(t).call(r, a, o),
    killTweensOf: (o, r) => {
      const a = t.resolveTargets(o), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (o) => Uh(o, t.root),
    splitText: (o, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof o == "string" ? Array.from(a.querySelectorAll(o)) : "nodeType" in o ? [o] : Array.from(o);
      return s(su(l, r));
    },
    draggable: (o, r) => s(Qh(i, t, o, r)),
    getFlipState: (o) => Ks(t, o),
    flipFrom: (o, r) => Ys(t, (a) => new jt(t, a), o, r),
    flip: (o, r, a) => {
      const l = Ks(t, o);
      return r(), Ys(t, (c) => new jt(t, c), l, { targets: o, ...a });
    }
  };
  return i;
}
const Ot = /* @__PURE__ */ Nu();
function Ku(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function Yu(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || ya(t);
}
function ya(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || ia(n)) && !yi.has(e));
}
function wo(t, e, n, s, i) {
  if (!ya(t)) return t;
  const o = {};
  for (const [r, a] of Object.entries(t))
    yi.has(r) ? o[r] = a : typeof a == "function" ? o[r] = a(e, n, i) : ia(a) ? o[r] = s.resolveRandomString(a) : o[r] = a;
  return o;
}
function ko(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function vo(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function ju(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function Xu(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class So {
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
function qu(t, e, n, s, i) {
  const o = n - i;
  if (o < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(o, s);
}
class ki {
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
    this.options = n, this.adapter = new oe();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = ze({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      o !== null && (s.volume = Math.max(0, Math.min(1, Number(o) || 0))), this.mediaTargets.push({ el: s, startTime: i, sync: new So(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      qu(s.sync, s.el, e, n, s.startTime);
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
      const r = new oe();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: ze(o.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new So(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: o } = Yr(
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
async function zg(t, e, n = {}) {
  const s = new ki(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function Gg(t, e = {}) {
  return new ki(t, e);
}
const Uu = {
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
}, xo = "tinyfly-controls-style", Vu = `
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
let zu = 0;
function Gu(t) {
  if (t.getElementById(xo)) return;
  const e = t.createElement("style");
  e.id = xo, e.textContent = Vu, t.head.appendChild(e);
}
function Ju(t, e, n = {}) {
  const s = e.ownerDocument;
  Gu(s);
  const i = { ...Uu, ...n.labels }, o = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((N) => N.label !== void 0 || t.caption(N.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (N, U, it, j = "") => {
    const Q = s.createElement("button");
    return Q.type = "button", Q.className = `tf-ctl-btn ${j}`.trim(), Q.setAttribute("aria-label", N), Q.title = N, Q.textContent = U, Q.addEventListener("click", it), Q;
  }, f = h(i.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), u = h(i.prev, "|◀", () => t.prev()), p = h(i.play, "▶", () => t.isPlaying ? t.pause() : d(), "tf-ctl-primary"), g = h(i.next, "▶|", () => t.next()), d = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", i.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const y = s.createElement("span");
  y.className = "tf-ctl-step";
  const b = s.createElement("select");
  b.className = "tf-ctl-speed", b.setAttribute("aria-label", i.speed);
  for (const N of o) {
    const U = s.createElement("option");
    U.value = String(N), U.textContent = `${N}×`, N === 1 && (U.selected = !0), b.appendChild(U);
  }
  b.addEventListener("change", () => t.setSpeed(Number(b.value))), c.append(f, u, p, g, m, y), o.length > 0 && c.append(b), l.append(c);
  const k = n.fullscreen ? ef(e, s, i) : void 0;
  k && c.append(k.button);
  const x = s.createElement("p");
  x.className = "tf-ctl-caption", x.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(x);
  const v = s.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const T = s.createElement("span"), E = h(i.reveal, i.reveal, () => t.play(), "tf-ctl-primary");
  v.append(T, E), l.append(v);
  const O = Zu(t, s, i.scenario, n.scenarioControl ?? "buttons");
  O && l.append(O.element);
  const M = n.mount;
  M ? M.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const H = () => {
    const N = t.isPlaying;
    p.textContent = N ? "❚❚" : "▶", p.setAttribute("aria-label", N ? i.pause : i.play), p.title = N ? i.pause : i.play;
    const U = t.duration;
    s.activeElement !== m && (m.value = String(U > 0 ? Math.round(t.currentTime / U * 1e3) : 0));
    const it = t.markers;
    if (u.hidden = g.hidden = y.hidden = it.length === 0, it.length > 0) {
      const j = t.currentMarker, Q = j ? it.indexOf(j) + 1 : 0;
      y.textContent = i.stepFormat.replace("{index}", String(Q)).replace("{total}", String(it.length)), y.setAttribute("aria-label", `${i.step} ${Q} ${i.of} ${it.length}`), u.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= U - 0.5;
      const G = t.caption() ?? "";
      x.textContent !== G && (x.textContent = G), x.hidden = !a();
      const S = !N && j?.question !== void 0 && Math.abs(t.currentTime - j.time) < 1;
      v.hidden = !S, S && T.textContent !== j.question && (T.textContent = j.question);
    } else
      v.hidden = !0, x.hidden = !0;
    O?.update();
  }, $ = t.subscribe(H);
  H();
  const A = n.keyboardScope ?? e;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const R = /* @__PURE__ */ new WeakSet(), L = (N) => {
    if (R.has(N) || (R.add(N), N.defaultPrevented || N.altKey || N.ctrlKey || N.metaKey)) return;
    const U = N.target;
    if (!(U.tagName === "INPUT" || U.tagName === "SELECT") && !(N.key === " " && U.tagName === "BUTTON"))
      switch (N.key) {
        case " ":
          N.preventDefault(), t.isPlaying ? t.pause() : d();
          break;
        case "ArrowRight":
          if (!r()) return;
          N.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          N.preventDefault(), t.prev();
          break;
        case "Home":
          N.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!k) return;
          N.preventDefault(), k.active ? k.exit() : k.enter();
          break;
      }
  };
  return A.addEventListener("keydown", L), l.addEventListener("keydown", L), {
    element: l,
    fullscreen: k && {
      get active() {
        return k.active;
      },
      enter: k.enter,
      exit: k.exit
    },
    destroy() {
      k?.destroy(), $(), A.removeEventListener("keydown", L), l.removeEventListener("keydown", L), l.remove();
    }
  };
}
function Zu(t, e, n, s) {
  const i = t.scenarios;
  if (i.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const f = e.createElement("span");
    f.textContent = n, f.setAttribute("aria-hidden", "true");
    const u = e.createElement("input");
    u.type = "range", u.min = "0", u.max = String(i.length - 1), u.step = "1", u.setAttribute("aria-label", n);
    const p = e.createElement("output");
    return p.setAttribute("aria-hidden", "true"), u.addEventListener("input", () => {
      const d = i[Number(u.value)];
      d && t.setScenario(d.id);
    }), h.append(f, u, p), { element: h, update: () => {
      const d = Math.max(0, i.findIndex((y) => y.id === t.scenario));
      e.activeElement !== u && (u.value = String(d));
      const m = i[d].label;
      p.textContent !== m && (p.textContent = m), u.setAttribute("aria-valuetext", m);
    } };
  }
  const o = e.createElement("fieldset");
  o.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, o.append(r);
  const a = `tf-ctl-scenario-${++zu}`, l = i.map((h) => {
    const f = e.createElement("label");
    f.className = "tf-ctl-choice";
    const u = e.createElement("input");
    u.type = "radio", u.name = a, u.value = h.id, u.addEventListener("change", () => {
      u.checked && t.setScenario(h.id);
    });
    const p = e.createElement("span");
    return p.textContent = h.label, f.append(u, p), o.append(f), u;
  });
  return { element: o, update: () => {
    for (const h of l) {
      const f = h.value === t.scenario;
      h.checked !== f && (h.checked = f);
    }
  } };
}
const Qu = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', tf = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function ef(t, e, n) {
  const s = e, i = t, o = e.createElement("button");
  o.type = "button", o.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const d = r !== void 0;
    o.innerHTML = d ? tf : Qu;
    const m = d ? n.exitFullscreen : n.fullscreen;
    o.setAttribute("aria-label", m), o.title = m, o.setAttribute("aria-pressed", String(d)), t.classList.toggle("tf-fullscreen", d), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, f = (d) => {
    d.key === "Escape" && g();
  }, u = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", f), l();
  };
  async function p() {
    if (r) return;
    const d = i.requestFullscreen?.bind(i) ?? i.webkitRequestFullscreen?.bind(i), m = s.fullscreenEnabled ?? s.webkitFullscreenEnabled ?? !1;
    if (d && m)
      try {
        if (await d(), c() === t) {
          r = "native", l();
          return;
        }
      } catch {
      }
    u();
  }
  async function g() {
    if (r === "overlay")
      e.removeEventListener("keydown", f), e.documentElement.style.overflow = a, r = void 0, l();
    else if (r === "native") {
      r = void 0, l();
      const d = s.exitFullscreen?.bind(s) ?? s.webkitExitFullscreen?.bind(s);
      c() === t && d && await d();
    }
  }
  return o.addEventListener("click", () => {
    r ? g() : p();
  }), e.addEventListener("fullscreenchange", h), e.addEventListener("webkitfullscreenchange", h), l(), {
    button: o,
    get active() {
      return r !== void 0;
    },
    enter: p,
    exit: g,
    destroy() {
      g(), e.removeEventListener("fullscreenchange", h), e.removeEventListener("webkitfullscreenchange", h), o.remove();
    }
  };
}
const Mo = "tinyfly-choices-style", nf = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function sf(t) {
  if (t.getElementById(Mo)) return;
  const e = t.createElement("style");
  e.id = Mo, e.textContent = nf, t.head.appendChild(e);
}
function of(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  sf(e.ownerDocument);
  const s = [], i = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (g, d) => {
      a.hasAttribute(g) || (a.setAttribute(g, d), c.push(g));
    };
    h("role", "button"), h("tabindex", "0");
    const f = t.scenarios.find((g) => g.id === l)?.label;
    f !== void 0 && h("aria-label", f), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const u = () => t.setScenario(l), p = (g) => {
      const d = g.key;
      d !== "Enter" && d !== " " || (g.preventDefault(), u());
    };
    a.addEventListener("click", u), a.addEventListener("keydown", p), i.push(() => {
      a.removeEventListener("click", u), a.removeEventListener("keydown", p);
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
const Ln = /* @__PURE__ */ new WeakMap(), js = /* @__PURE__ */ new WeakMap();
let rf = 0;
function Ke(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function af(t, e = {}) {
  const n = Ln.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), i = s[0], o = t.getAttribute("data-src"), r = cf(t.getAttribute("data-markers")), a = s.length > 1 || i?.hasAttribute("data-scenario") ? lf(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = i && !a ? Ke(i.textContent, "timeline", t) : void 0;
  if (!l && o && r) {
    const p = await fetch(o);
    p.ok && (l = await p.json());
  }
  if (l && r && (l = ba(l, r)), !l && !o && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = Ke(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...Ke(t.getAttribute("data-options"), "data-options", t)
  };
  uf(t);
  const f = new ki(t, h), u = { element: t, player: f };
  if (Ln.set(t, u), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const p = t.getAttribute("data-scenario") ?? void 0;
    await f.loadScenarios(a, { initial: a.some((g) => g.id === p) ? p : void 0 }), js.set(t, of(f, t));
  } else
    await f.load(l ?? o);
  if (t.getAttribute("data-controls") !== "false") {
    const p = Ke(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), d = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    u.controls = Ju(f, t, {
      ...e.controls,
      ...t.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...m === "slider" || m === "buttons" ? { scenarioControl: m } : {},
      labels: { ...e.controls?.labels, ...p, ...d ? { scenario: d } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), g ? t.insertBefore(u.controls.element, g) : t.appendChild(u.controls.element);
  }
  return u;
}
function lf(t, e, n) {
  const s = [];
  return t.forEach((i, o) => {
    const r = Ke(i.textContent, "timeline", n);
    if (!r) return;
    const a = i.getAttribute("data-scenario") || `scenario-${o + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = i.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? ba(r, e) : r });
  }), s;
}
function ba(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function cf(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function hf(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((i) => af(i, e)))).filter((i) => i !== void 0);
}
function Jg(t) {
  const e = Ln.get(t);
  e && (js.get(t)?.(), js.delete(t), e.controls?.destroy(), e.player.destroy(), Ln.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function uf(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++rf}`, e.setAttribute("aria-labelledby", s.id));
}
function ff() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    hf();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class df {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new oe(), this.adapterB = new oe();
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
      const a = new oe();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: ze(r) });
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
    return e.timeline ? ze(e.timeline) : null;
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
async function Zg(t, e, n = {}) {
  const s = new df(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const Qg = { type: "none", duration: 0 }, dt = (t) => ({ description: t, unit: "degrees" }), ut = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), wa = {
  lean: dt("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: dt("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: dt("Head tilt"),
  leftShoulder: dt("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: dt("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: dt("Left elbow bend, added to the upper arm"),
  rightElbow: dt("Right elbow bend, added to the upper arm"),
  leftHip: dt("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: dt("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: dt("Left knee bend (negative folds the shin back)"),
  rightKnee: dt("Right knee bend (positive folds the shin back)"),
  leftWrist: dt("Left wrist bend, added to the forearm"),
  rightWrist: dt("Right wrist bend, added to the forearm"),
  leftAnkle: dt("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: dt("Right ankle: + points the toe down (tiptoe), − onto the heel"),
  leftFootOut: ut("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: ut("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: ut("Mouth open: 0 closed, 1 wide open"),
  smile: ut("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: ut("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: ut("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: ut("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: ut("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: ut("Eyes look across: + the way it faces", -1, 1),
  lookY: ut("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: ut("0 front-on, 1 in profile, turned the way it faces"),
  sit: ut("0 standing, 1 seated"),
  spin: dt("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, ka = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: ut("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: ut("How much the mouth chatters"),
  rubber: ut("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: ut("How much of the dance is applied")
}, va = {
  "thumb.curl": ut("Thumb curled in"),
  "thumb.across": ut("Thumb across the palm"),
  "index.curl": ut("Index finger curled"),
  "middle.curl": ut("Middle finger curled"),
  "ring.curl": ut("Ring finger curled"),
  "pinky.curl": ut("Little finger curled"),
  spread: ut("Fingers spread apart"),
  turn: dt("Hand turned about the forearm"),
  bend: dt("Hand bent at the wrist, palm-ward"),
  tilt: dt("Hand tilted sideways"),
  roll: dt("Hand rolled to show the back or the palm")
};
let Sa;
function pf(t) {
  Sa = t;
}
function gf(t) {
  return Sa?.(t) ?? {};
}
function mf(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function Qe(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = mf(t) * n;
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
function vi(t, e) {
  const n = Qe(t, e);
  return n[n.length - 1];
}
function xa(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Xs(t, e, n) {
  const s = e.roughness ?? 2, i = Math.max(1, Math.round(e.passes ?? 2)), o = xa(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const u = r++;
    return (p) => Gn(an(`${e.seed ?? 1}:${o}:${u}:${p}`));
  }, l = (u, p) => (u.next() * 2 - 1) * p, c = (u) => {
    const p = a(), g = t.lineWidth, d = t.globalAlpha;
    for (let m = 0; m < i; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? d : d * 0.6, u(p(m));
    t.lineWidth = g, t.globalAlpha = d;
  }, h = (u, p = 1) => {
    if (u.length < 2) return;
    const g = u.slice(1).map((m, y) => Math.hypot(m.x - u[y].x, m.y - u[y].y)), d = g.reduce((m, y) => m + y, 0) * Math.min(1, Math.max(0, p));
    c((m) => {
      const y = [], b = [];
      if (u.forEach((x, v) => {
        y.push({ x: x.x + l(m, s * 0.5), y: x.y + l(m, s * 0.5) }), v > 0 && b.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), d <= 0) return;
      t.beginPath(), t.moveTo(y[0].x, y[0].y);
      let k = 0;
      for (let x = 1; x < y.length; x++) {
        const v = yf(y[x - 1], y[x], s, b[x - 1]), T = g[x - 1];
        if (k + T <= d) {
          t.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), k += T;
          continue;
        }
        const E = bf(v, T === 0 ? 1 : (d - k) / T);
        t.bezierCurveTo(E[1].x, E[1].y, E[2].x, E[2].y, E[3].x, E[3].y);
        break;
      }
      t.stroke();
    });
  }, f = (u, p, g, d, m = 1) => {
    c((y) => {
      const k = y.next() * Math.PI * 2, x = Math.PI * 2 + 0.15 + y.next() * 0.3, v = [];
      for (let E = 0; E <= 14; E++) {
        const O = k + x * E / 14, M = l(y, s * 0.6);
        v.push({ x: u + Math.cos(O) * (g + M), y: p + Math.sin(O) * (d + M) });
      }
      const T = Qe(v, m);
      T.length < 2 || (To(t, T), t.stroke());
    });
  };
  return {
    line: h,
    curve(u, p = 1) {
      if (u.length < 2) return;
      const g = u[0], d = u[u.length - 1], m = Math.hypot(d.x - g.x, d.y - g.y) || 1, y = -(d.y - g.y) / m, b = (d.x - g.x) / m;
      c((k) => {
        const x = { x: l(k, s * 0.5), y: l(k, s * 0.5) }, v = { x: l(k, s * 0.5), y: l(k, s * 0.5) }, T = l(k, s * Math.min(1.5, Math.max(0.3, m / 80))), E = u.map((M, H) => {
          const $ = H / (u.length - 1), A = Math.sin(Math.PI * $) * T;
          return {
            x: M.x + x.x + (v.x - x.x) * $ + y * A,
            y: M.y + x.y + (v.y - x.y) * $ + b * A
          };
        }), O = Qe(E, p);
        O.length < 2 || (To(t, O), t.stroke());
      });
    },
    circle(u, p, g, d = 1) {
      f(u, p, g, g, d);
    },
    ellipse: f,
    nudge(u = 0.5) {
      const p = a()(0);
      return { x: l(p, s * u), y: l(p, s * u) };
    }
  };
}
function yf(t, e, n, s) {
  const i = e.x - t.x, o = e.y - t.y, r = Math.hypot(i, o) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -o / r, c = i / r;
  return [
    t,
    { x: t.x + i / 3 + l * s[0] * a, y: t.y + o / 3 + c * s[0] * a },
    { x: t.x + 2 * i / 3 + l * s[1] * a, y: t.y + 2 * o / 3 + c * s[1] * a },
    e
  ];
}
function bf([t, e, n, s], i) {
  const o = (f, u) => ({ x: f.x + (u.x - f.x) * i, y: f.y + (u.y - f.y) * i }), r = o(t, e), a = o(e, n), l = o(n, s), c = o(r, a), h = o(a, l);
  return [t, r, c, o(c, h)];
}
function To(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const i = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, i.x, i.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function En(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const i = [], o = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], f = Math.hypot(h.x - c.x, h.y - c.y) || 1, u = r(l) / 2, p = -(h.y - c.y) / f * u, g = (h.x - c.x) / f * u;
    i.push({ x: a.x + p, y: a.y + g }), o.push({ x: a.x - p, y: a.y - g });
  }), [...i, ...o.reverse()];
}
function Si(t, e, n, s) {
  const i = e.length;
  if (i < 2) return;
  const o = En(e, n, s), r = (a) => n + (s - n) * a / (i - 1);
  t.beginPath(), t.moveTo(o[0].x, o[0].y);
  for (const a of o.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== i - 1 && i > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function Pe(t, e, n, s, i = 16) {
  const o = { x: 2 * e.x - (t.x + n.x) / 2, y: 2 * e.y - (t.y + n.y) / 2 }, r = [];
  for (let a = 0; a <= i; a++) {
    const l = a / i, c = l < 0.5 ? { x: t.x + (e.x - t.x) * 2 * l, y: t.y + (e.y - t.y) * 2 * l } : { x: e.x + (n.x - e.x) * (2 * l - 1), y: e.y + (n.y - e.y) * (2 * l - 1) }, h = 1 - l, f = {
      x: h * h * t.x + 2 * h * l * o.x + l * l * n.x,
      y: h * h * t.y + 2 * h * l * o.y + l * l * n.y
    };
    r.push({ x: c.x + (f.x - c.x) * s, y: c.y + (f.y - c.y) * s });
  }
  return r;
}
function Eo(t, e, n, s, i, o = 0, r = 1, a = 40) {
  const l = Math.cos(i), c = Math.sin(i);
  return Array.from({ length: a + 1 }, (h, f) => {
    const u = o + Math.PI * 2 * r * f / a, p = Math.cos(u) * n, g = Math.sin(u) * s;
    return { x: t + p * l - g * c, y: e + p * c + g * l };
  });
}
function Ma(t, e) {
  return e.look === "pencil" ? Sf(t, e) : wf(t, e.ink, e.look);
}
function Fn(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function wf(t, e, n) {
  const s = n === "silhouette", i = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(o, r, a) {
      t.fillStyle = e, Si(t, o, r * i, a * i);
    },
    line(o, r) {
      o.length < 2 || (t.strokeStyle = e, t.lineWidth = r * i, t.lineCap = "round", t.lineJoin = "round", Fn(t, o), t.stroke());
    },
    shape(o, r, a) {
      Fn(t, o, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * i, t.lineJoin = "round", t.stroke());
    },
    ellipse(o, r, a, l, c, h, f) {
      t.beginPath(), t.ellipse(o, r, a, l, c, 0, Math.PI * 2), (h !== null || s) && (t.fillStyle = s ? e : h, t.fill()), !(f <= 0) && (t.strokeStyle = e, t.lineWidth = f * i, t.stroke());
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
function kf(t, e) {
  const n = [t[0]];
  let s = 0;
  for (let r = 1; r < t.length; r++) {
    const a = t[r - 1], l = t[r], c = Math.hypot(l.x - a.x, l.y - a.y);
    let h = e - s;
    for (; h < c; ) {
      const f = h / c;
      n.push({ x: a.x + (l.x - a.x) * f, y: a.y + (l.y - a.y) * f }), h += e;
    }
    s = c - (h - e);
  }
  const i = t[t.length - 1], o = n[n.length - 1];
  return Math.hypot(i.x - o.x, i.y - o.y) > e * 0.25 ? n.push(i) : n[n.length - 1] = i, n;
}
function vf(t, e) {
  const n = t.length;
  return t.map((s, i) => {
    const o = t[Math.max(0, i - 1)], r = t[Math.min(n - 1, i + 1)], a = Math.hypot(r.x - o.x, r.y - o.y) || 1, l = e(n === 1 ? 0 : i / (n - 1));
    return { x: s.x - (r.y - o.y) / a * l, y: s.y + (r.x - o.x) / a * l };
  });
}
function Ao(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, i) => s + i.amount, 0);
  return (s) => e.reduce((i, o) => i + o.amount * Math.sin(Math.PI * 2 * o.frequency * s + o.phase), 0) / n;
}
function Sf(t, e) {
  const n = e.pencil ?? {}, s = e.ink, i = n.roughness ?? Math.max(1, e.lineWidth * 0.12), o = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = xa(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, d, m = !1) => Gn(an(`${e.seed}:${m ? "paper" : l}:${g}:${d}`)), f = (g, d, m, y, b, k = 0) => {
    if (g.length < 2) return;
    const x = g.slice(1).reduce(($, A, R) => $ + Math.hypot(A.x - g[R].x, A.y - g[R].y), 0);
    let v = kf(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, x / 24)));
    if (k > 0 && v.length >= 2) {
      const [$, A] = [v[v.length - 2], v[v.length - 1]], R = Math.hypot(A.x - $.x, A.y - $.y) || 1;
      v = [...v, { x: A.x + (A.x - $.x) / R * k, y: A.y + (A.y - $.y) / R * k }];
    }
    const T = Ao(m), E = Ao(m), O = v.length, M = [], H = [];
    v.forEach(($, A) => {
      const R = O === 1 ? 0 : A / (O - 1), L = v[Math.max(0, A - 1)], N = v[Math.min(O - 1, A + 1)], U = Math.hypot(N.x - L.x, N.y - L.y) || 1, it = -(N.y - L.y) / U, j = (N.x - L.x) / U, Q = T(R) * b, G = Math.min(1, R / 0.08, (1 - R) / 0.08), S = (0.55 + 0.45 * Math.sqrt(Math.max(0, G))) * (1 + r * E(R)), _ = Math.max(0.3, d(R) * S / 2), w = $.x + it * Q, P = $.y + j * Q;
      M.push({ x: w + it * _, y: P + j * _ }), H.push({ x: w - it * _, y: P - j * _ });
    }), t.save(), t.globalAlpha *= y, t.fillStyle = s, Fn(t, [...M, ...H.reverse()], !0), t.fill(), t.restore();
  }, u = (g, d) => {
    const m = c++, y = h(m, 99, !0);
    if (y.next() < a) {
      const v = (y.next() * 2 - 1) * e.lineWidth * 1.4, T = (y.next() * 2 - 1) * e.lineWidth * 1.4, E = g.map((O) => ({ x: O.x + v, y: O.y + T }));
      f(E, (O) => d(O) * 1.8, h(m, 98, !0), 0.035, i), f(E, (O) => d(O) * 0.45, h(m, 97, !0), 0.12, i * 1.5);
    }
    const b = g.slice(1).reduce((v, T, E) => v + Math.hypot(T.x - g[E].x, T.y - g[E].y), 0), k = d(0.5) > 4 && b > d(0.5) * 6, x = k ? [-0.3, 0.3, 0] : [0];
    for (let v = 0; v < o; v++) {
      const T = v === 0;
      x.forEach((E, O) => {
        const M = h(m, v * 10 + O), H = E === 0 ? g : vf(g, (A) => d(A) * E * Math.sqrt(Math.sin(Math.PI * A))), $ = !T && E === 0 ? e.lineWidth * (0.3 + M.next() * 0.8) : 0;
        f(H, (A) => d(A) * (k ? 0.5 : 1) * (T ? 1 : 0.6), M, T ? 0.85 : 0.45, i * (T ? 0.6 : 1), $);
      });
    }
  }, p = (g, d, m, y, b, k) => {
    const v = h(c, 50).next() * Math.PI * 2;
    u(Eo(g, d, m, y, b, v, 1.08, 48), () => k);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, d, m) {
      u(g, (y) => d + (m - d) * y);
    },
    line(g, d) {
      u(g, () => d);
    },
    shape(g, d, m) {
      d !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = d, Fn(t, g, !0), t.fill(), t.restore()), m > 0 && u([...g, g[0]], () => m);
    },
    ellipse(g, d, m, y, b, k, x) {
      k !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = k, t.beginPath(), t.ellipse(g, d, m, y, b, 0, Math.PI * 2), t.fill(), t.restore()), p(g, d, m, y, b, x);
    },
    dot(g, d, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, d, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const d = c++;
      f(g, () => Math.max(0.6, e.lineWidth * 0.18), h(d, 0), 0.28, i * 1.2, e.lineWidth);
    },
    guideEllipse(g, d, m, y, b) {
      if (n.construction === !1) return;
      const k = c++, x = h(k, 0), v = Eo(g, d, m, y, b, x.next() * Math.PI * 2, 1.12, 48);
      f(v, () => Math.max(0.6, e.lineWidth * 0.18), x, 0.28, i * 1.5);
    }
  };
}
const xf = ["thumb", "index", "middle", "ring", "pinky"], gt = {
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
function pt(t = {}) {
  return { ...gt, ...t };
}
const Mt = (t, e, n, s, i) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": i
}), vt = {
  relaxed: gt,
  open: pt({ ...Mt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: pt({ ...Mt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: pt({ ...Mt(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: pt({ ...Mt(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: pt({ ...Mt(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: pt({ ...Mt(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: pt({ ...Mt(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: pt({ ...Mt(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: pt({ ...Mt(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: pt({ ...Mt(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: pt({ ...Mt(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: pt({ ...Mt(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: pt({ ...Mt(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function tn(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
const Mf = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, Tf = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, Bt = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, Ef = [82, 100, 62], Af = [48, 72], Pf = 3, $f = 13, _f = 0.035, If = -0.075, Hf = [
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
], Vt = (t) => t * Math.PI / 180, qs = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], An = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Us = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], Re = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function re(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = Us(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + o[0] * i + e[0] * r * (1 - s),
    t[1] * s + o[1] * i + e[1] * r * (1 - s),
    t[2] * s + o[2] * i + e[2] * r * (1 - s)
  ];
}
const Po = [1, 0, 0], $o = [0, 1, 0], Ue = [0, 0, 1];
function Of(t, e, n) {
  const s = Vt(t.fan * (Pf + $f * n)), i = [Math.sin(s), Math.cos(s), 0], o = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, f) => {
    a += Vt(Ef[f] * e), r.push(qs(r[f], An(re(i, o, -a), h)));
  });
  const l = re(Ue, o, -a), c = r.map((h, f) => t.width * (1 - 0.14 * (f / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function Cf(t, e, n = 1, s = 1) {
  const i = Math.min(1, Math.max(0, e)), o = Re(qs(An(Re(Bt.out), 1 - i), An(Re(Bt.across), i))), r = Re(Us(Ue, o)), a = Re(Us(o, r)), l = [[Bt.base[0] * s, Bt.base[1], Bt.base[2]]];
  let c = 0;
  Bt.bones.forEach((u, p) => {
    p > 0 && (c += Vt(Af[p - 1] * t)), l.push(qs(l[p], An(re(o, r, c), u)));
  });
  const h = re(a, r, c), f = [...Bt.widths, Bt.widths[Bt.widths.length - 1] * 0.92].map((u) => u * n);
  return { joints: l, back: h, widths: f };
}
function Vs(t, e = {}) {
  const n = { ...gt, ...t }, s = e.size ?? 100, i = e.side ?? "right", o = i === "left" ? -1 : 1, r = Vt(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (A) => ({
    ...A,
    knuckle: [A.knuckle[0] * c, A.knuckle[1], A.knuckle[2]],
    width: A.width * l
  }), f = Vt(n.bend ?? 0), u = Vt(n.tilt ?? 0), p = Vt(90 * (n.turn ?? 0)), g = (A) => re(re(re(A, Po, -f), Ue, -u), $o, p), d = Math.cos(r), m = Math.sin(r), y = Vt(n.roll ?? 0), b = Math.cos(y), k = Math.sin(y), x = (A) => {
    const R = A[0] * s, L = -A[1] * s, N = (R * b - L * k) * o, U = R * k + L * b;
    return { x: N * d - U * m, y: N * m + U * d };
  }, v = (A) => {
    const R = x(A), L = Math.hypot(R.x, R.y);
    return L > 1e-6 * s ? { x: R.x / L, y: R.y / L } : { x: 0, y: 0 };
  }, T = {
    thumb: Cf(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, E = a ? Tf : Mf;
  for (const A of xf) {
    const R = E[A];
    R && (T[A] = Of(h(R), n[`${A}.curl`] ?? 0, n.spread ?? 0));
  }
  const O = {};
  for (const [A, R] of Object.entries(T)) {
    const L = R.joints.map(g), N = g(R.back);
    O[A] = {
      points: L.map(x),
      depths: L.map((U) => U[2] * s),
      widths: R.widths.map((U) => U * s),
      nail: N[2],
      back: v(N)
    };
  }
  const M = Hf.flatMap(([A, R]) => [g([A * c, R, _f]), g([A * c, R, If])]), H = Lf(M.map(x)), $ = M.reduce((A, R) => A + R[2], 0) / M.length * s;
  return {
    size: s,
    side: i,
    wrist: { x: 0, y: 0 },
    palm: H,
    palmDepth: $,
    palmFacing: -g(Ue)[2],
    fingers: O,
    axes: { up: v(g($o)), across: v(g(Po)), out: v(g(Ue)) },
    curls: Object.fromEntries(Object.keys(O).map((A) => [A, n[`${A}.curl`] ?? 0]))
  };
}
function Rf(t, e) {
  const n = (i) => ({ x: i.x + e.x - t.wrist.x, y: i.y + e.y - t.wrist.y }), s = {};
  for (const [i, o] of Object.entries(t.fingers))
    s[i] = { ...o, points: o.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function Lf(t) {
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
const Ff = "#f1c9a5", Wf = "#2f2f33";
function xi(t, e, n, s = {}, i = 0) {
  const o = Rf(Vs(n, s), e), r = s.ink ?? Wf, a = s.lineWidth ?? o.size * 0.035, l = s.pen ?? Ma(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: i,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? Ff, h = s.nails ?? !0, f = [
    {
      depth: o.palmDepth,
      draw: () => Bf(l, o, c, a)
    }
  ];
  for (const u of Object.values(o.fingers)) {
    const p = u.depths.reduce((g, d) => g + d, 0) / u.depths.length;
    f.push({
      depth: p,
      draw: () => Df(t, l, u, c, a, h)
    });
  }
  if (s.prop) {
    const u = s.prop;
    f.push({ depth: u.depth, draw: () => u.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const u of [...f].sort((p, g) => p.depth - g.depth)) u.draw();
  return t.restore(), o;
}
function Bf(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: i } = e.axes;
    for (const [o, r] of Object.entries(e.fingers)) {
      const a = e.curls[o] ?? 0;
      if (o === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - i.x * c * 0.2, y: l.y - i.y * c * 0.2 }, f = Math.atan2(i.y, i.x), u = Array.from({ length: 7 }, (p, g) => {
        const d = f - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(d) * c, y: h.y + Math.sin(d) * c };
      });
      t.line(u, s * 0.6);
    }
  }
  if (e.palmFacing > 0.45 && t.look !== "silhouette") {
    const { up: i, across: o } = e.axes, r = e.size, a = e.wrist, l = (h, f) => ({
      x: a.x + (o.x * h + i.x * f) * r,
      y: a.y + (o.y * h + i.y * f) * r
    }), c = e.side === "left" ? -1 : 1;
    t.line([l(-0.15 * c, 0.36), l(-0.04 * c, 0.3), l(0.1 * c, 0.33)], s * 0.5);
  }
}
function Df(t, e, n, s, i, o) {
  const { widths: r } = n, a = Nf(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], f = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const d = h / 2 + i * 1.6;
    t.moveTo(l.x + d, l.y), t.arc(l.x, l.y, d, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * i, f + 2 * i), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, Si(t, a, h, f)), e.look === "silhouette" || !o || n.nail < 0.25) return;
  const u = a[a.length - 2], p = Kf({ x: c.x - u.x, y: c.y - u.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - p.x * f * 0.22 + n.back.x * f * 0.1,
    y: c.y - p.y * f * 0.22 + n.back.y * f * 0.1
  };
  e.ellipse(g.x, g.y, f * 0.24 * Math.max(0.35, n.nail), f * 0.19, Math.atan2(p.y, p.x), "#f8e3d3", i * 0.45);
}
function Nf(t, e) {
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
const Kf = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, It = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, Yf = 40;
function Qn(t) {
  return t === void 0 ? It.walk : typeof t == "string" ? It[t] ?? It.walk : t;
}
function jf(t, e, n = tt, s = 1) {
  const i = Qn(t);
  if (i === It.walk) return qf(e, n, s);
  const o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (y) => Math.abs(y) <= Yf, c = i.shoulder ?? 0, h = (y, b) => l(y) ? b * c + i.arm * r : y, f = i.forearm ?? 0, u = l(n.leftShoulder) ? n.leftElbow - f - i.elbow * Math.max(0, -r) : n.leftElbow, p = l(n.rightShoulder) ? n.rightElbow + f + i.elbow * Math.max(0, r) : n.rightElbow, g = i.bounces ?? 1, d = (1 + Math.cos(o * 2 * g)) / 2, m = i.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + i.lean * s + (i.sway ?? 0) * Math.sin(o) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (i.bend ?? 0),
    headTilt: n.headTilt - i.lean * 0.5 * s + (i.headTilt ?? 0),
    leftElbow: u,
    rightElbow: p,
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
    rise: (n.rise ?? 0) + (i.bounce ?? 0) * s * d,
    stretch: n.stretch * (1 + (i.squash ?? 0) * (d - 0.5))
  };
}
function _o(t, e, n = 1) {
  const s = Qn(t), i = It.walk.swing, o = (r) => Math.sin(r * Math.PI / 180);
  return Uf(e, n) * o(s.swing * n) / o(i * n);
}
const tt = {
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
function kt(t) {
  return { ...tt, ...t };
}
const Ta = {
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
}, wt = (t) => ({ ...Ta, ...t }), ct = {
  neutral: Ta,
  happy: wt({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: wt({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: wt({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: wt({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: wt({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: wt({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: wt({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: wt({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: wt({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: wt({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: wt({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: wt({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: wt({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: wt({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: wt({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: wt({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: wt({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function ne(t, e) {
  return { ...t, ...typeof e == "string" ? ct[e] : e };
}
const Ht = {
  rest: tt,
  wave: kt({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...ct.happy }),
  cheer: kt({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...ct.joyful }),
  shrug: kt({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...ct.confused, lookX: 0, lookY: 0 }),
  point: kt({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: kt({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...ct.thinking }),
  handsOnHips: kt({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: kt({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...ct.sad }),
  surprised: kt({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...ct.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: kt({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: kt({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: kt({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...ct.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: kt({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...ct.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: kt({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...ct.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: kt({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...ct.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: kt({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...ct.happy })
}, Ea = Object.keys(tt);
function en(t, e, n) {
  const s = { ...t };
  for (const i of Ea) s[i] = t[i] + (e[i] - t[i]) * n;
  return s;
}
const zs = 24, Io = 4, Ho = 28, Xf = 40;
function qf(t, e = tt, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, i = Math.cos(t * Math.PI * 2) * n, o = (c) => Math.abs(c) <= Xf, r = (c) => o(c) ? 22 * s : c, a = o(e.leftShoulder) ? e.leftElbow - Ho * Math.max(0, -s) : e.leftElbow, l = o(e.rightShoulder) ? e.rightElbow + Ho * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + Io * n,
    headTilt: e.headTilt - Io * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -zs * s,
    rightHip: -zs * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, i),
    rightKnee: 30 * Math.max(0, -i),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function Uf(t, e = 1) {
  return 4 * ((Gs + Wn) * t) * Math.sin(zs * e * Math.PI / 180);
}
function Vf(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const Aa = 0.12, Oo = 0.46, zf = 1 - 2 * Aa, Gf = 0.1, Jf = 0.21, Zf = 0.19, Gs = 0.24, Wn = 0.22, Pa = 0.12, Qf = 0.14, $a = 0.33, Co = 0.7, Ro = 0.3, td = 0.35, ed = [1.7, 1.05], nd = [1.3, 0.75], Lo = [1.45, 0.85], sd = [1.15, 0.75], Fo = 0.06, id = 0.7, od = 0.65, _a = 0.075, rd = 0.3, ad = 0.02, ld = 0.012, cd = 12, hd = 0.25, fn = 90, ud = 0.25, fd = 0.04, Ia = 0.01, se = (t) => Math.min(1, Math.max(0, t ?? 0));
function tm(t, e = 1) {
  return Wn * t * e;
}
const Js = -0.12, Ha = 0.4, $t = (t) => t * Math.PI / 180, dd = (t, e) => ({ x: e * Math.sin($t(t)), y: Math.cos($t(t)) }), Oa = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), Ca = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function pd(t, e, n, s, i, o) {
  const r = Math.max(1, Math.min(o * 0.6, Qf * n)), a = se(e.turn), l = (Pa + $a * a) * n, c = s + Js * n, h = l + e.lookX * 0.08 * n, f = e.lookY * 0.07 * n, u = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Co * a), squeeze: 1 - Co * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Ro * a), squeeze: 1 - Ro * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = i, t.strokeStyle = i, t.lineWidth = r;
  for (const y of u) {
    const b = Oa(y.open, e.blink);
    if (b < 0.2) {
      const T = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(y.x + l - 0.12 * n, c), t.quadraticCurveTo(y.x + l, c + T, y.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (b > 1.2) {
        const E = 0.13 * n * b;
        t.beginPath(), t.ellipse(y.x + l, c, E * 0.85, E, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = i;
      }
      const T = b > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(y.x + h, c + f, T, T * 1.1 * Math.min(b, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const k = Ca(c, n, y.brow, b), x = y.x + l - y.side * 0.13 * n * y.squeeze, v = y.x + l + y.side * 0.13 * n * y.squeeze;
    t.beginPath(), t.moveTo(v, k), t.lineTo(x, k - e.browTilt * 0.1 * n), t.stroke();
  }
  const p = s + Ha * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - td * a), d = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), d <= 0.05) {
    t.moveTo(l - g, p), t.quadraticCurveTo(l, p + e.smile * 0.25 * n, l + g, p), t.stroke();
    return;
  }
  const m = 0.3 * n * d;
  e.smile > 0.3 ? (t.moveTo(l - g, p - 0.05 * n), t.lineTo(l + g, p - 0.05 * n), t.quadraticCurveTo(l, p + m * 2, l - g, p - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, p + m * 0.6), t.lineTo(l + g, p + m * 0.6), t.quadraticCurveTo(l, p - m * 1.4, l - g, p + m * 0.6)) : t.ellipse(l, p, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function Ra(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), i = Math.sqrt(s), o = (e.headSize ?? 2 * Aa) / 2, r = e.headSize === void 0 ? zf : 1 - 2 * o, a = o * n, l = se(t.sit), c = t.leftHip + (-fn - t.leftHip) * l, h = t.leftKnee + (-fn - t.leftKnee) * l, f = t.rightHip + (fn - t.rightHip) * l, u = t.rightKnee + (fn - t.rightKnee) * l, p = e.classic === !0, g = se(t.turn), d = (j, Q, G, S, _) => {
    const w = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs($t(Q - G) / 2) + $t(S))), P = Math.max(-1, Math.min(1, id + _)), C = g + (1 - g) * j * P;
    return p ? { x: 0, y: 0 } : { x: Math.cos(w) * Fo * C, y: Math.sin(w) * Fo };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, y = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let b = 0;
  if (l > 0 || !p) {
    const j = (_, w, P, C, D) => Gs * Math.cos($t(w)) + Wn * Math.cos($t(w - P)) + Math.max(0, d(_, w, P, C, D).y), Q = Math.max(
      j(-1, c, h, m.left, y.left),
      j(1, f, u, m.right, y.right)
    ), G = 1 - se((t.rise ?? 0) / fd), S = (p ? Math.min(1, l / ud) : 1) * G;
    b = (Oo - Q) * S * n * s;
  }
  const k = -Oo * n * s + b, x = -r * n * s + b, v = p ? 0 : (ad * se(t.turn) + ld * l) * n * s, T = $t(t.bend ?? 0), E = { end: Bo(k, x, T, 1), bend: T };
  let O;
  if (T !== 0) {
    O = [];
    for (let j = 0; j <= Wo; j++) {
      const Q = j / Wo, G = Bo(k, x, T, Q);
      O.push({ x: G.x - v * Math.sin(Math.PI * Q), y: G.y });
    }
  } else
    O = v === 0 ? [{ x: 0, y: k }, { x: 0, y: x }] : Pe({ x: 0, y: k }, { x: -v, y: (k + x) / 2 }, { x: 0, y: x }, 1, 8);
  const M = x + Gf * n * s, H = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), $ = (j, Q, G, S, _) => {
    const w = dd(G, S);
    return { x: j + w.x * _ * n, y: Q + w.y * _ * n };
  }, A = (j, Q, G) => {
    const S = $(0, k, Q, j, Gs * s);
    return { root: { x: 0, y: k }, joint: S, end: $(S.x, S.y, Q - G, j, Wn * s) };
  }, R = (j, Q, G) => {
    const S = { x: j * H, y: M }, _ = $(S.x, S.y, Q, j, Jf * i);
    return { root: S, joint: _, end: $(_.x, _.y, Q + G, j, Zf * i) };
  }, L = { left: A(-1, c, h), right: A(1, f, u) }, N = (j, Q, G, S, _, w) => {
    const P = d(j, G, S, _, w);
    return { x: Q.end.x + P.x * n * s, y: Q.end.y + P.y * n * s };
  }, U = (j, Q, G, S, _) => $(Q.end.x, Q.end.y, G + S + _, j, _a * i), it = {
    left: R(-1, t.leftShoulder, t.leftElbow),
    right: R(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(p ? 0 : rd, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: k,
    neckY: x,
    drop: b,
    lean: p ? t.lean : t.lean + cd * Math.sin(Math.PI * l),
    classic: p,
    legs: L,
    toes: {
      left: N(-1, L.left, c, h, m.left, y.left),
      right: N(1, L.right, f, u, m.right, y.right)
    },
    spine: O,
    chest: E,
    arms: it,
    handTips: {
      left: U(-1, it.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: U(1, it.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const Wo = 10;
function Bo(t, e, n, s) {
  const i = t - e, o = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - i * s };
  const r = i / n;
  return { x: r * (1 - Math.cos(o)), y: t - r * Math.sin(o) };
}
function gd(t, e) {
  if (t.chest.bend === 0) return e;
  const n = nn(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const Ye = (t, e) => e === 0 ? [t.root, t.joint, t.end] : Pe(t.root, t.joint, t.end, e);
function nn(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = t.x - e.x, r = t.y - e.y;
  return { x: e.x + o * s - r * i, y: e.y + o * i + r * s };
}
function La(t, e, n = !0) {
  const s = yd(t, e), i = e.spin ?? 0, o = e.rise ?? 0;
  return n && (i !== 0 || o !== 0) ? md(s, t, i, o) : s;
}
function Fa(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * $t(e), lift: n * t.height };
}
function md(t, e, n, s) {
  const { pivot: i, angle: o, lift: r } = Fa(e, n, s), a = (u) => {
    const p = nn(u, i, o);
    return { x: p.x, y: p.y - r };
  }, l = (u) => ({ left: a(u.left), right: a(u.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), f = Ia * e.height;
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
    grounded: { left: c.left >= h - f, right: c.right >= h - f },
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
function yd(t, e) {
  const n = $t(t.lean), s = $t(e.headTilt), i = { x: 0, y: t.hipY }, o = (x) => ({ x: t.facing * x.x, y: x.y }), r = (x) => o(nn(x, i, n)), a = (x) => r(gd(t, x)), l = (x) => a(nn({ x: x.x, y: x.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = Ye(t.arms.left, t.rubber).map(a), h = Ye(t.arms.right, t.rubber).map(a), f = (x, v) => Math.atan2(v.y - x.y, v.x - x.x), u = { left: a(t.handTips.left), right: a(t.handTips.right) }, p = (x, v) => {
    const [T, E] = x.slice(-2), O = t.arms[v], M = f(a(O.end), u[v]) - f(a(O.joint), a(O.end));
    return f(T, E) + M;
  };
  let g = 1 / 0;
  for (const [x, v] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const T = Ca(Js, 1, x, Oa(v, e.blink));
    g = Math.min(g, T, T - e.browTilt * 0.1);
  }
  const d = { left: o(t.legs.left.end), right: o(t.legs.right.end) }, m = { left: o(t.toes.left), right: o(t.toes.right) }, y = { left: Math.max(d.left.y, m.left.y), right: Math.max(d.right.y, m.right.y) }, b = Math.max(y.left, y.right), k = Ia * t.height;
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
    feet: d,
    toes: m,
    feetY: b,
    grounded: { left: y.left >= b - k, right: y.right >= b - k },
    fingertips: u,
    handAngle: { left: p(c, "left"), right: p(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: Ye(t.legs.left, t.rubber).map(o),
      rightLeg: Ye(t.legs.right, t.rubber).map(o),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: Js,
      browTopY: g,
      mouthY: Ha,
      faceX: t.facing * (Pa + $a * se(e.turn))
    }
  };
}
function Zt(t, e = {}) {
  return La(Ra(t, e), t);
}
function em(t, e, n) {
  return nn({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function bd(t, e, n) {
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
function wd(t, e, n = {}, s = 0) {
  const i = Ra(e, n), o = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? La(i, e, !1) : void 0, l = n.sketch ? Xs(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Xs(t, n.sketch, s) : void 0, h = (E) => {
    t.save(), E(), t.restore();
  }, f = (E) => {
    E && a && h(() => E(t, a, s, c));
  }, u = () => t.scale(i.facing, 1), p = () => {
    u(), t.translate(0, i.hipY), t.rotate($t(i.lean)), t.translate(0, -i.hipY);
  }, g = () => {
    p(), i.chest.bend !== 0 && (t.translate(i.chest.end.x, i.chest.end.y), t.rotate(i.chest.bend), t.translate(0, -i.neckY));
  }, d = (E, O, M) => {
    if (l) return O ? l.curve(E) : l.line(E);
    if (i.classic) {
      t.beginPath(), t.moveTo(E[0].x, E[0].y);
      for (const H of E.slice(1)) t.lineTo(H.x, H.y);
      t.stroke();
      return;
    }
    Si(t, E, M[0] * i.lineWidth, M[1] * i.lineWidth);
  }, m = (E, O) => d(Ye(E, i.rubber), i.rubber > 0, O), y = (E) => {
    i.classic || d([i.legs[E].end, i.toes[E]], !1, sd);
  }, b = (E) => {
    if (n.hands && !i.classic) return x(E);
    if (i.classic || l) return;
    const O = i.arms[E].end;
    t.beginPath(), t.arc(O.x, O.y, od * i.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = o, t.fillStyle = o, t.lineWidth = i.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const k = Fa(i, e.spin ?? 0, e.rise ?? 0);
  (k.angle !== 0 || k.lift !== 0) && (t.translate(0, -k.lift), t.translate(k.pivot.x, k.pivot.y), t.rotate(k.angle), t.translate(-k.pivot.x, -k.pivot.y));
  function x(E) {
    const O = n.hands ?? {}, M = i.arms[E].end, H = i.handTips[E], $ = n.headFill ?? "#ffffff";
    xi(t, M, O[E] ?? gt, {
      side: E,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(H.x - M.x, M.y - H.y) * 180 / Math.PI,
      size: (O.size ?? _a) * i.height * Math.sqrt(i.stretch),
      skin: O.skin ?? ($ === "none" ? void 0 : $),
      ink: o,
      lineWidth: i.lineWidth * 0.45,
      fingers: O.fingers,
      plump: O.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const v = (E) => {
    h(() => {
      g(), m(i.arms[E], nd), b(E);
    });
    const O = r.sleeve;
    O && a && h(() => O(t, a, E, s, c));
  }, T = se(e.turn) > hd;
  f(r.behind), h(() => {
    u(), m(i.legs.left, Lo), y("left"), m(i.legs.right, Lo), y("right");
  }), T && v("left"), h(() => {
    p(), d(i.spine, i.spine.length > 2, ed);
  }), h(() => {
    g();
    const { left: E, right: O } = { left: i.arms.left.root, right: i.arms.right.root };
    if (E.x !== O.x)
      if (i.classic) d([E, O], !1, [1, 1]);
      else {
        const M = { x: (E.x + O.x) / 2, y: E.y - 0.3 * Math.abs(O.x - E.x) };
        d(Pe(E, M, O, 1, 8), !0, [1.1, 1.1]);
      }
  }), f(r.body), T || v("left"), v("right"), f(r.behindHead), h(() => {
    g(), t.translate(0, i.neckY), t.rotate($t(e.headTilt));
    const E = -i.headRy;
    t.beginPath(), t.ellipse(0, E, i.headRx, i.headRy, 0, 0, Math.PI * 2);
    const O = n.headFill ?? "#ffffff";
    if (O !== "none" && (t.fillStyle = O, t.fill()), l) {
      l.ellipse(0, E, i.headRx, i.headRy);
      const M = l.nudge();
      t.translate(M.x, M.y);
    } else
      t.stroke();
    t.translate(0, E), t.scale(i.headRx / i.r, i.headRy / i.r), pd(t, e, i.r, 0, o, i.lineWidth);
  }), f(r.overHead), f(r.front), t.restore(), n.label && (t.save(), t.fillStyle = o, t.font = n.labelFont ?? `700 ${Math.round(i.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -i.height * i.stretch - 0.04 * i.height + i.drop), t.restore());
}
function Wa(t, e, n, s) {
  const i = { ...t }, o = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? en(i, jf(o, t.walk, i), t.walking) : i, a = vd(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = en(r, c.pose, l), c.hands) {
      const h = (f, u) => u ? tn(f ?? gt, u, l) : f;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * Vf(e)) }), { pose: r, hands: a };
}
function kd(t, e, n, s) {
  return Wa(t, e, n, s).pose;
}
const Ba = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, Bn = (t, e) => `hand.${t}.${e}`;
function vd(t) {
  const e = (i) => {
    if (typeof t[Bn(i, "spread")] == "number")
      return Object.fromEntries(Object.keys(gt).map((o) => [o, t[Bn(i, o)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function Sd(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function Da(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, i = { ...kt(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, o = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? gt;
      for (const l of Object.keys(gt)) o[Bn(r, l)] = a[l] ?? gt[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...i, ...o },
    about: xd(Object.keys(o), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = Wa(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), wd(r, h.pose, Sd({ ...e, rubber: c.rubber, facing: Ba(c, e) }, h.hands), l);
    }
  };
}
function xd(t, e) {
  const n = { ...wa, ...ka };
  for (const s of t) {
    const [, i, ...o] = s.split("."), r = va[o.join(".")];
    r && (n[s] = { ...r, description: `${i === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return gf(e);
    }
  };
}
function Na(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (i.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? o = h : c === "y" || c === "motionPathY" ? r = h : c in i && (i[c] = h));
  const a = kd(i, e.time, t.figureDance, t.figureGaits), l = Zt(a, { ...s, rubber: i.rubber, facing: Ba(i, s) });
  return { pose: a, joints: bd(l, t.x + o + t.width / 2, t.y + r + t.height) };
}
function Ka(t) {
  const e = [];
  return t.forEach((n, s) => {
    const i = s === 0 ? tt : e[s - 1], o = typeof n.pose == "string" ? Ht[n.pose] : { ...i, ...n.pose };
    e.push(n.expression ? ne(o, n.expression) : o);
  }), e;
}
function nm(t, e) {
  const n = Ka(e);
  return Ea.filter((s) => n.some((i) => i[s] !== tt[s])).map((s) => ({
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
const ms = 0.5, Zs = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: pt({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: pt({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: pt({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: vt.fist,
  /** Fist, thumb up */
  shikhara: vt.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: pt({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: pt({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function Dn(t) {
  return typeof t != "string" ? t : t in Zs ? Zs[t] : vt[t];
}
function Ya(t, e, n) {
  const s = [];
  for (const i of t.keys) {
    const o = s[s.length - 1], r = !o || i.reset ? { pose: e, ...n } : o;
    s.push({
      beat: i.beat,
      pose: { ...r.pose, ...i.pose },
      left: i.hands?.left ? Dn(i.hands.left) : r.left,
      right: i.hands?.right ? Dn(i.hands.right) : r.right,
      easing: i.easing ?? t.easing
    });
  }
  return s;
}
const Mi = (t, e) => (t % e + e) % e;
function Md(t, e, n, s) {
  const i = Ya(t, n, s);
  if (i.length === 0) return { pose: n, hands: s };
  const o = Mi(e, t.beats);
  let r = i.length - 1;
  for (let p = 0; p < i.length; p++) i[p].beat <= o && (r = p);
  const a = i[r], l = i[(r + 1) % i.length], c = a.beat <= o ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, f = h > c ? (o - c) / (h - c) : 0, u = Et(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, f)));
  return {
    pose: en(a.pose, l.pose, u),
    hands: { left: tn(a.left, l.left, u), right: tn(a.right, l.right, u) }
  };
}
const Td = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], Ed = ["lean", "headTilt", "lookX", "spin"], Ad = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function Pd(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, i] of Td) {
    const o = n && Ad.has(s) ? -1 : 1;
    e[s] = o * t[i], e[i] = o * t[s];
  }
  if (!n) for (const s of Ed) e[s] = -t[s];
  return e;
}
const $d = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function _d(t, e, n) {
  const s = Mi(n, 1), i = (1 + Math.cos(2 * Math.PI * s)) / 2, o = e.bounce * (e.accent === "up" ? 1 - i : i), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = $d(r);
  return {
    ...t,
    leftHip: t.leftHip + a * o / 2,
    rightHip: t.rightHip + o / 2,
    leftKnee: t.leftKnee + a * o,
    rightKnee: t.rightKnee + o,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function Qs(t) {
  const e = { ...tt, ...t.stance };
  return t.expression ? ne(e, t.expression) : e;
}
function ja(t) {
  return {
    left: t.hands?.left ? Dn(t.hands.left) : gt,
    right: t.hands?.right ? Dn(t.hands.right) : gt
  };
}
function ys(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const i = Md(s, n, Qs(t), ja(t));
  return e.mirror ? { pose: Pd(i.pose), hands: { left: i.hands?.right, right: i.hands?.left } } : i;
}
function Ti(t, e, n = {}) {
  const s = typeof t == "string" ? ue[t] : t;
  let i;
  if (n.move)
    i = ys(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const o = s.routine, r = o.reduce((f, u) => f + u.beats, 0), a = Mi(e, r);
    let l = 0, c = 0;
    for (; c < o.length - 1 && a >= l + o[c].beats; ) l += o[c++].beats;
    const h = a - l;
    if (i = ys(s, o[c], h), h < ms && o.length > 1 && e >= ms) {
      const f = o[(c - 1 + o.length) % o.length], u = ys(s, f, f.beats + h), p = Et("ease-in-out")(h / ms);
      i = {
        pose: en(u.pose, i.pose, p),
        hands: { left: tn(u.hands.left, i.hands.left, p), right: tn(u.hands.right, i.hands.right, p) }
      };
    }
  }
  return { ...i, pose: _d(i.pose, s.groove, e) };
}
function sm(t, e, n = {}) {
  return Ti(t, e, n).pose;
}
function Ei(t) {
  return (typeof t == "string" ? ue[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const Id = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function Do(t, e, n, s, i, o, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < o || h >= r))
        for (const f of l.taps ?? []) i.push({ beat: h, tap: s ? Id[f] : f });
    }
}
function im(t, e, n, s = {}) {
  const i = typeof t == "string" ? ue[t] : t, o = [];
  if (n <= e) return o;
  if (s.move) {
    const r = i.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    Do(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, o, e, n);
  } else {
    const r = Ei(i);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of i.routine)
        Do(i.moves[c.move], l, c.beats, c.mirror, o, e, n), l += c.beats;
    }
  }
  return o.sort((r, a) => r.beat - a.beat);
}
function No(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (Ya(n, Qs(t), ja(t))[0]?.pose.turn ?? Qs(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function Xa(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function bs(t, e, n = {}) {
  const s = typeof t == "string" ? ue[t] : t, i = Xa(s, n), o = i.reduce((h, f) => h + f.beats, 0), r = i.reduce((h, f) => h + No(s, f) * f.beats, 0), a = Math.floor(e / o);
  let l = a * r, c = e - a * o;
  for (const h of i) {
    const f = Math.min(h.beats, c);
    if (l += No(s, h) * f, c -= f, c <= 0) break;
  }
  return l;
}
function Hd(t, e, n) {
  const s = Xa(t, n), i = [0];
  let o = 0;
  for (let r = 0; o < e; r = (r + 1) % s.length)
    o += s[r].beats, i.push(Math.min(o, e));
  return i;
}
const Od = 8;
function Cd(t, e, n) {
  const s = typeof e == "string" ? ue[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Ei(s)), r = Hd(s, o, n);
  if (r.every((y) => bs(s, y, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, o / 2), l = Et("ease-in-out"), c = (y) => a <= 0 ? 1 : Math.min(l(Math.min(1, y / a)), l(Math.min(1, (o - y) / a))), h = Math.ceil(a * Od), f = a <= 0 ? [] : Array.from({ length: h + 1 }, (y, b) => [b / h * a, o - b / h * a]).flat(), u = [.../* @__PURE__ */ new Set([...r, ...f])].sort((y, b) => y - b);
  let p = 0;
  const g = u.map((y, b) => {
    if (b > 0) {
      const k = u[b - 1], x = Math.max(1, Math.ceil((y - k) * 16));
      for (let v = 0; v < x; v++) {
        const T = k + (y - k) * v / x, E = k + (y - k) * (v + 1) / x;
        p += (bs(s, E, n) - bs(s, T, n)) * c((T + E) / 2);
      }
    }
    return { beat: y, travel: p };
  }), d = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((y) => ({ time: d + y.beat * 6e4 / i, value: m + n.height * y.travel, easing: "linear" }))
  };
}
function om(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function rm(t, e = {}) {
  return (n) => Ti(t, n, e);
}
function am(t, e) {
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
function lm(t, e, n = {}) {
  const s = typeof e == "string" ? ue[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Ei(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(o * r), c = Array.from({ length: l + 1 }, (d, m) => {
    const y = m / r;
    return { time: a + y * 6e4 / i, frame: Ti(s, y, n) };
  }), h = (d, m) => ({
    id: `${t}-${d}`,
    target: t,
    property: d,
    keyframes: c.map((y) => ({ time: y.time, value: m(y.frame) }))
  }), u = Object.keys(tt).filter((d) => c.some((m) => m.frame.pose[d] !== c[0].frame.pose[d]) || c[0].frame.pose[d] !== tt[d]).map((d) => h(d, (m) => m.pose[d])), p = n.height === void 0 ? void 0 : Cd(t, s, { ...n, bpm: i, beats: o, start: a, height: n.height, fade: 0 });
  if (p && u.push(p), n.hands === !1) return u;
  const g = [];
  for (const d of ["left", "right"])
    for (const m of Object.keys(gt)) {
      const y = (b) => b.hands?.[d]?.[m] ?? gt[m];
      c.some((b) => y(b.frame) !== gt[m]) && g.push(h(Bn(d, m), y));
    }
  return [...u, ...g];
}
const Ve = { type: "back", mode: "out", overshoot: 1.1 }, xt = "ease-out-cubic", Rd = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: xt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: xt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: xt },
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
}, Ld = {
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
}, Fd = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: xt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: xt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: xt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: Ve },
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
}, Wd = {
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
        hands: e === 0 ? { left: { ...vt.spread, turn: 2 }, right: { ...vt.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: xt },
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
}, Bd = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: Ve,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: Ve },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: Ve },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: xt,
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
}, Dd = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...vt.cupped, roll: -30 }, left: { ...vt.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...vt.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...vt.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...vt.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...vt.open, turn: 2 } }, easing: xt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: xt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: xt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: xt }
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
}, Nd = {
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
}, Kd = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Yd = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Kd, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, jd = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...vt.spread, turn: 2 }, right: { ...vt.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: xt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: xt },
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
}, Xd = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...vt.spread, turn: 2 }, right: { ...vt.spread, turn: 2 } } },
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
}, qd = {
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
          easing: Ve
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
}, ue = {
  disco: Rd,
  hipHop: Ld,
  breaking: Fd,
  jazz: Wd,
  kpop: Bd,
  bollywood: Dd,
  bhangra: Nd,
  bharatanatyam: Yd,
  charleston: jd,
  tap: Xd,
  popping: qd
}, Nn = (t) => Math.min(1, Math.max(0, t));
function Ud(t) {
  const e = { ...tt, turn: t.view }, n = [];
  for (const s of t.keys) {
    const i = n[n.length - 1], o = !i || s.reset ? e : i.pose;
    n.push({ at: s.at, pose: { ...o, ...s.pose }, easing: s.easing });
  }
  return n;
}
function Vd(t) {
  return t - zd * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const zd = 0.5;
function Gd(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function Jd(t, e) {
  const n = typeof t == "string" ? ts[t] : t, s = Ud(n), i = Nn(e);
  let o = 0;
  for (let f = 0; f < s.length; f++) s[f].at <= i && (o = f);
  const r = s[o], a = s[Math.min(o + 1, s.length - 1)], l = a.at > r.at ? (i - r.at) / (a.at - r.at) : 0, c = en(r.pose, a.pose, Et(a.easing ?? "ease-in-out")(Nn(l))), h = Gd(n, i);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * Vd(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function Zd(t, e, n) {
  const s = typeof t == "string" ? ts[t] : t, i = Nn(e), o = Nn((i - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * o;
}
function cm(t, e, n = {}) {
  const s = typeof e == "string" ? ts[e] : e, i = n.start ?? 0, o = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, f) => {
    const u = f / r;
    return { time: i + u * o, progress: u, pose: Jd(s, u) };
  }), c = Object.keys(tt).filter((h) => a.some((f) => f.pose[h] !== tt[h])).map((h) => ({
    id: `${t}-${h}`,
    target: t,
    property: h,
    keyframes: a.map((f) => ({ time: f.time, value: f.pose[h] }))
  }));
  if (n.height !== void 0 && s.travel !== 0) {
    const h = (n.facing ?? 1) < 0 ? -1 : 1;
    c.push({
      id: `${t}-x`,
      target: t,
      property: "x",
      keyframes: a.map((f) => ({ time: f.time, value: (n.x ?? 0) + h * Zd(s, f.progress, n.height) }))
    });
  }
  return c;
}
const Qd = {
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
}, t0 = {
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
}, dn = {
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
}, e0 = {
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
}, n0 = {
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
function de(t, e, n, s, i, o = 1300) {
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
      { at: 0.16, pose: Qd },
      { at: 0.27, pose: t0, easing: "ease-out-quad" },
      ...i,
      { at: 0.76, pose: e0 },
      { at: 0.86, pose: n0, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const ts = {
  frontFlip: de("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: dn, easing: "ease-out-cubic" },
    { at: 0.64, pose: dn }
  ]),
  backFlip: de("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...dn, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...dn, lean: 18 } }
  ]),
  layout: de("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: de("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: de("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: de("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, ws = 0.215, ks = 0.205, s0 = 0.065, Ko = 0.035, i0 = 0.165, o0 = 0.155, r0 = 12, a0 = 0.3, l0 = 0.7, c0 = 0.35, h0 = (t) => t * Math.PI / 180, mt = {
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
function Pt(t = {}) {
  return { ...mt, ...t };
}
const u0 = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function hm(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const i = n.replace(/(^|\.)(left|right)(\.|$)/, (o, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[i] = u0.has(n) ? -s : s;
  }
  return e;
}
function At(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}
const qa = {
  rest: mt,
  wave: Pt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: Pt({ ...At("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: Pt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: Pt({ ...At("arm", { spread: 50, bend: -105, elbow: 0 }), ...At("leg", { spread: 9 }), smile: 0.8 }),
  think: Pt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: Pt({ ...At("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: Pt({ ...At("leg", { swing: 90, knee: 90, spread: 4 }), ...At("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: Pt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...At("arm", { swing: 20, elbow: 30 })
  }),
  crouch: Pt({ ...At("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...At("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: Pt({ lean: 82, "head.nod": -35, ...At("arm", { swing: 80, elbow: 0, spread: 4 }), ...At("leg", { knee: 92, ankle: -88 }) }),
  lieDown: Pt({ roll: 90, ...At("arm", { spread: 8 }), "head.nod": 0 })
};
function f0(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, i = Math.max(0.12, 1 - e - Ko - (ws + ks)), o = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: i0, width: [1.25, 0.9] },
      { length: o0, width: [0.9, 0.75] }
    ]
  }), r = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: ws, width: [1.45, 1.05] },
      { length: ks, width: [1.05, 0.85] },
      { length: s0, width: [0.95, 0.7] }
    ]
  }), a = (l, c) => l[c] ?? mt[c] ?? 0;
  return {
    id: "human",
    hipHeight: ws + ks,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: Ko, width: [1, 0.9] }] },
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
        const d = -a(l, "lean") / 2, m = a(l, "side") / 2, y = -a(l, "bend");
        return [
          { swing: d + y * a0, spread: m },
          { swing: d + y * l0, spread: m }
        ];
      }
      if (c.id === "neck") return [{ swing: -a(l, "bend") * c0, spread: 0 }];
      const [h, f] = c.id.split("."), u = (d) => a(l, `${h}.${f}.${d}`);
      if (h === "arm")
        return [
          { swing: u("swing"), spread: u("spread") },
          { swing: u("elbow"), spread: u("bend") }
        ];
      const p = (c.side ?? 1) * u("rotate"), g = 1 - Math.cos(h0(u("rotate")));
      return [
        { swing: u("swing"), spread: u("spread"), yaw: p },
        { swing: -u("knee"), spread: 0, yaw: p },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + u("ankle") - g * (u("swing") - u("knee")), spread: 0, yaw: (r0 + u("toeOut")) * (c.side ?? 1) }
      ];
    },
    withAngles(l, c, h) {
      const [f, u] = c.id.split("."), p = (g) => `${f}.${u}.${g}`;
      return f === "arm" ? {
        ...l,
        [p("swing")]: h[0].swing,
        [p("spread")]: h[0].spread,
        [p("elbow")]: h[1].swing,
        [p("bend")]: h[1].spread
      } : f === "leg" ? { ...l, [p("swing")]: h[0].swing, [p("spread")]: h[0].spread, [p("knee")]: -h[1].swing } : l;
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
function um(t) {
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
const d0 = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, Ua = Object.fromEntries(
  Object.entries(ct).map(([t, e]) => [
    t,
    Object.fromEntries(Object.entries(e).map(([n, s]) => [d0[n] ?? n, s]))
  ])
);
function fm(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, i = { ...mt, turn: n }, o = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of o) {
    const h = t[`${a}Shoulder`], f = t[`${a}Elbow`];
    i[`arm.${l}.spread`] = h * s, i[`arm.${l}.swing`] = c * h * n, i[`arm.${l}.bend`] = f * s, i[`arm.${l}.elbow`] = c * f * n;
    const u = t[`${a}Hip`], p = t[`${a}Knee`], g = s + c * n;
    i[`leg.${l}.rotate`] = 90 * s, i[`leg.${l}.spread`] = 0, i[`leg.${l}.swing`] = u * g, i[`leg.${l}.knee`] = p * g, i[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), i[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * p0, i[`eye.${l}`] = t[`${a}Eye`], i[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(i, g0(l, e[a] ?? gt, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  i.lean = t.lean * n, i.bend = r * n, i.side = (t.lean + r * 0.5) * s, i["head.tilt"] = (t.headTilt + r * 0.5) * s, i["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) i[a] = t[a];
  return i.lift = t.rise ?? 0, i.roll = t.spin ?? 0, i;
}
const p0 = 70;
function g0(t, e, n, s) {
  const i = t === "right" ? 1 - s : 1 + s, o = {};
  for (const r of Object.keys(gt)) o[`hand.${t}.${r}`] = e[r] ?? gt[r];
  return o[`hand.${t}.turn`] = (e.turn ?? 0) - i, o[`hand.${t}.roll`] = (e.roll ?? 0) + n, o;
}
const Rt = (t) => t * Math.PI / 180;
function Va([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t, e * i + n * o, -e * o + n * i];
}
function Ai([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i - e * o, t * o + e * i, n];
}
function ce([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i + n * o, e, -t * o + n * i];
}
const Gt = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Kn = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Pn = (t, e) => Ai(Va(t, e.swing), e.spread);
function vs(t, e) {
  const n = ce(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Pi(t, e, n) {
  const s = n, o = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const d of t.chains) {
    const m = d.parent ? r[d.parent] : void 0;
    if (d.parent && !m) throw new Error(`body plan ${t.id}: chain ${d.id} comes before its parent ${d.parent}`);
    const y = d.at ?? (m ? m.joints3.length - 1 : 0), b = m ? m.joints3[y] : o, k = m ? m.frames[Math.max(0, y - 1)] : { swing: 0, spread: 0 }, x = d.offset ? Gt(b, Pn(Kn(d.offset, s), k)) : b, v = d.side ?? 1, T = t.boneScale?.(e, d) ?? 1, E = t.angles(e, d), O = [x], M = [];
    let H = k.swing, $ = k.spread;
    d.bones.forEach((A, R) => {
      const L = E[R] ?? { swing: 0, spread: 0 };
      H += Rt(L.swing), $ += Rt(L.spread) * v, M.push({ swing: H, spread: $ });
      const N = ce(Pn(d.rest, { swing: H, spread: $ }), Rt(L.yaw ?? 0));
      O.push(Gt(O[R], Kn(N, A.length * s * T)));
    }), r[d.id] = { joints3: O, frames: M };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, f = h * l.sx, u = h * l.sy, p = (d) => Pn(ce(Va(Ai(d, -Rt(l.tilt)), -Rt(l.nod)), Rt(l.yaw)), c), g = Gt(a.joints3[a.joints3.length - 1], p([0, u, 0]));
  return { height: s, root: o, chains: r, head: { center: g, rx: f, ry: u, toBody: p } };
}
function $i(t, e, n) {
  const s = n.height, i = Rt(90 * (e.turn ?? 0)), o = Pi(t, e, s), { root: r } = o, a = o.chains, { rx: l, ry: c } = o.head, h = o.head.toBody, f = o.head.center, u = {};
  for (const M of t.chains) {
    const { joints3: H, frames: $ } = a[M.id], A = H.map((R) => vs(R, i));
    u[M.id] = {
      id: M.id,
      joints3: H,
      frames: $,
      points: A.map((R) => R.point),
      depths: A.map((R) => R.depth)
    };
  }
  const p = vs(f, i), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => ce(h(M), i)), d = vs(r, i).point, m = Rt(e.roll ?? 0), y = (M) => {
    const H = M.x - d.x, $ = M.y - d.y;
    return { x: d.x + H * Math.cos(m) - $ * Math.sin(m), y: d.y + H * Math.sin(m) + $ * Math.cos(m) };
  }, b = ([M, H, $]) => [M * Math.cos(m) + H * Math.sin(m), -M * Math.sin(m) + H * Math.cos(m), $];
  for (const M of Object.values(u)) M.points = M.points.map(y);
  const k = {
    center: y(p.point),
    depth: p.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(b)
  }, x = k.axes[1];
  k.angle = Math.atan2(x[0], x[1]);
  const v = (M) => {
    if ("head" in M) return { x: k.center.x + x[0] * c, y: k.center.y - x[1] * c };
    const H = u[M.chain];
    return H.points[Math.min(M.joint, H.points.length - 1)];
  };
  let T = 0;
  (n.contact ?? "ground") === "ground" && (T = -Math.max(...t.contacts.map((M) => v(M).y))), T -= (e.lift ?? 0) * s;
  const E = (M) => ({ x: M.x, y: M.y + T });
  for (const M of Object.values(u)) M.points = M.points.map(E);
  k.center = E(k.center);
  const O = t.contacts.map((M) => ({ spec: M, point: v(M) }));
  return {
    height: s,
    view: i,
    chains: u,
    head: k,
    hip: E(y(d)),
    contacts: O,
    groundY: Math.max(...O.map((M) => M.point.y))
  };
}
const ti = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], za = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Ga(t, e, n) {
  const s = n.height, i = Rt(90 * (e.turn ?? 0)), o = Rt(e.roll ?? 0), r = Pi(t, e, s), a = ce(r.root, i), l = (m) => Gt(Ai(ti(ce(m, i), a), -o), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), f = (m) => za(ti(l(Gt(r.head.center, r.head.toBody(m))), h)), u = [f([1, 0, 0]), f([0, 1, 0]), f([0, 0, 1])], p = (m) => {
    if ("head" in m) return Gt(h, Kn(u[1], r.head.ry));
    const y = c[m.chain];
    return y[Math.min(m.joint, y.length - 1)];
  };
  let g = 0;
  (n.contact ?? "ground") === "ground" && (g = -Math.min(...t.contacts.map((m) => p(m)[1]))), g += (e.lift ?? 0) * s;
  const d = (m) => [m[0], m[1] + g, m[2]];
  return {
    height: s,
    hip: d(a),
    chains: Object.fromEntries(Object.entries(c).map(([m, y]) => [m, y.map(d)])),
    head: { center: d(h), rx: r.head.rx, ry: r.head.ry, axes: u }
  };
}
function Ja(t, e, n, s) {
  const i = n.height, o = Rt(90 * (e.turn ?? 0)), r = Pi(t, e, i), a = Ga(t, e, n), l = a.hip, c = a.chains, h = a.head.center, f = (M) => {
    if ("head" in M) return Gt(h, Kn(a.head.axes[1], a.head.ry));
    const H = c[M.chain];
    return H[Math.min(M.joint, H.length - 1)];
  }, u = s.toView(l), p = s.toScreen(u), g = s.toScreen([u[0] + 1, u[1], u[2]]), d = Math.hypot(g.x - p.x, g.y - p.y), m = (M) => {
    const H = s.toView(M);
    return { point: s.toScreen(H), depth: H[2] * d };
  }, y = {};
  for (const M of t.chains) {
    const H = c[M.id].map(m);
    y[M.id] = {
      id: M.id,
      joints3: r.chains[M.id].joints3,
      frames: r.chains[M.id].frames,
      points: H.map(($) => $.point),
      depths: H.map(($) => $.depth)
    };
  }
  const b = s.toView(h), k = s.toScreen(b), x = s.toScreen([b[0] + 1, b[1], b[2]]), v = Math.hypot(x.x - k.x, x.y - k.y), T = a.head.axes.map((M) => za(ti(s.toView(Gt(h, M)), b))), E = {
    center: k,
    depth: b[2] * d,
    rx: r.head.rx * v,
    ry: r.head.ry * v,
    angle: Math.atan2(T[1][0], T[1][1]),
    axes: T
  }, O = t.contacts.map((M) => ({ spec: M, point: m(f(M)).point }));
  return {
    height: i * d,
    view: o,
    chains: y,
    head: E,
    hip: p,
    contacts: O,
    groundY: Math.max(...O.map((M) => M.point.y))
  };
}
function Za(t, [e, n, s]) {
  const [i, o, r] = t.axes, a = [
    i[0] * e * t.rx + o[0] * n * t.ry + r[0] * s * t.rx,
    i[1] * e * t.rx + o[1] * n * t.ry + r[1] * s * t.rx,
    i[2] * e * t.rx + o[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (i[2] * e + o[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class Qa {
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
function m0(t) {
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
const _i = Math.PI * 2;
function y0(t, e = 16) {
  const n = new Qa(), s = Math.max(6, Math.round(e)), i = Math.max(3, Math.round(s / 2)), o = [];
  for (let r = 0; r <= i; r++) {
    const a = r / i * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * _i, f = Math.sin(a) * Math.sin(h), u = Math.cos(a), p = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(f * t, u * t, p * t, f, u, p));
    }
    o.push(l);
  }
  for (let r = 0; r < i; r++)
    for (let a = 0; a < s; a++) {
      const l = o[r][a], c = o[r + 1][a], h = o[r + 1][a + 1], f = o[r][a + 1];
      r > 0 && n.triangle(l, c, f), r < i - 1 && n.triangle(c, h, f);
    }
  return n.build();
}
function Yo(t, e, n, s, i) {
  const o = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: i }, (a, l) => {
    const c = l / i * _i;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < i; a++) {
    const l = r[a], c = r[(a + 1) % i];
    s === 1 ? t.triangle(o, l, c) : t.triangle(o, c, l);
  }
}
function b0(t, e, n = 24) {
  const s = new Qa(), i = Math.max(6, Math.round(n)), o = e / 2, r = -e / 2, a = (h) => Array.from({ length: i + 1 }, (f, u) => {
    const p = u / i * _i;
    return s.vertex(Math.sin(p) * t, h, Math.cos(p) * t, Math.sin(p), 0, Math.cos(p));
  }), l = a(r), c = a(o);
  for (let h = 0; h < i; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return Yo(s, t, o, 1, i), Yo(s, t, r, -1, i), s.build();
}
function jo(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of m0(t))
    for (const s of n.faces) {
      const i = n.faces.find((o) => o !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: i });
    }
  return { ...t, faceEdges: e };
}
const pn = (t) => t * 180 / Math.PI, pe = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Ss = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], je = (t) => Math.hypot(t[0], t[1], t[2]), ei = (t) => {
  const e = je(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, gn = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function Xo(t) {
  const [e, n, s] = ei(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function w0(t, e, n, s, i) {
  const o = t.chains.find((H) => H.id === n);
  if (!o) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (o.bones.length < 2 || o.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = $i(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: i.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = je(pe(a.joints3[1], a.joints3[0])), h = je(pe(a.joints3[2], a.joints3[1])), f = o.parent ? r.chains[o.parent].frames[Math.max(0, (o.at ?? r.chains[o.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, u = pe(s, l), p = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, je(u))), g = ei(u), d = o.parent !== null, m = Pn(o.pole ?? (d ? [0, -0.35, -1] : [0, 0, 1]), f);
  let y = pe(m, [g[0] * Ss(m, g), g[1] * Ss(m, g), g[2] * Ss(m, g)]);
  je(y) < 1e-6 && (y = ce([1, 0, 0], 0)), y = ei(y);
  const b = (c * c + p * p - h * h) / (2 * c * p), k = Math.sqrt(Math.max(0, 1 - b * b)), x = [
    l[0] + c * (b * g[0] + k * y[0]),
    l[1] + c * (b * g[1] + k * y[1]),
    l[2] + c * (b * g[2] + k * y[2])
  ], v = [l[0] + g[0] * p, l[1] + g[1] * p, l[2] + g[2] * p], T = o.side ?? 1, E = Xo(pe(x, l)), O = Xo(pe(v, x)), M = [
    { swing: pn(gn(E.swing - f.swing)), spread: pn(gn(E.spread - f.spread)) * T },
    { swing: pn(gn(O.swing - E.swing)), spread: pn(gn(O.spread - E.spread)) * T }
  ];
  return t.withAngles(e, o, M);
}
const k0 = 0.34, Xt = 0.12, Ft = -0.4, Dt = (t, e, n) => t[e] ?? n, v0 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), S0 = 0.45, x0 = 0.35, M0 = 0.7;
function Yn(t, e, n) {
  const s = (p) => Math.sqrt(Math.max(0, 1 - p.x * p.x - p.y * p.y)), i = Za(t, [n.x, n.y, s(n)]).facing, o = t.axes[2], r = Math.atan2(o[0], o[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(x0, Math.abs(a)), h = l * Math.max(M0, Math.abs(a)), f = Math.cos(t.angle), u = Math.sin(t.angle);
  return {
    facing: i,
    points: e.map((p) => {
      const g = S0 * Math.sin(r) + n.x * c + (p.x - n.x) * h, d = p.y + o[1] * s(p), m = g * t.rx, y = d * t.ry;
      return { x: t.center.x + m * f + y * u, y: t.center.y + m * u - y * f };
    })
  };
}
const mn = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (i, o) => {
  const r = o / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), xs = (t, e, n, s, i = 16) => Array.from({ length: i }, (o, r) => {
  const a = Math.PI * 2 * r / i;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), qo = 0.05;
function T0(t, e, n, s) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), o = (y, b) => Yn(e, y, b).points, r = (y, b) => Yn(e, [], { x: y, y: b }).facing, a = Dt(n, "smile", 0), l = Dt(n, "blink", 0), c = Dt(n, "lookX", 0), h = Dt(n, "lookY", 0), f = Dt(n, "browTilt", 0);
  for (const y of [1, -1]) {
    const b = y === 1 ? "left" : "right", k = k0 * y;
    if (r(k, Xt) < qo) continue;
    const x = { x: k, y: Xt }, v = v0(Dt(n, `eye.${b}`, 1), l);
    if (v < 0.2) {
      const M = a > 0.5 ? 0.12 : -0.06;
      t.line(o(mn({ x: k - 0.12, y: Xt }, { x: k, y: Xt + M }, { x: k + 0.12, y: Xt }), x), i);
    } else {
      if (v > 1.2) {
        const A = 0.13 * v;
        t.shape(o(xs(k, Xt, A * 0.85, A), x), "#ffffff", i);
      }
      const M = v > 1.2 ? 0.075 : 0.1, H = k + c * 0.08, $ = Xt - h * 0.07;
      t.shape(o(xs(H, $, M, M * 1.1 * Math.min(v, 1)), x), t.ink, 0);
    }
    const T = Xt + 0.3 + Dt(n, `brow.${b}`, 0) * 0.14 + Math.max(0, v - 1) * 0.12, E = { x: k + y * 0.13, y: T }, O = { x: k - y * 0.13, y: T + f * 0.1 };
    t.line(o([E, { x: (E.x + O.x) / 2, y: (E.y + O.y) / 2 }, O], { x: k, y: T }), i);
  }
  const u = { x: 0, y: Ft };
  if (r(0, Ft) < -qo) return;
  const p = 0.25 * Math.max(0.3, Dt(n, "mouthWidth", 1)), g = Math.min(1, Math.max(0, Dt(n, "mouth", 0)));
  if (g <= 0.05) {
    t.line(o(mn({ x: -p, y: Ft }, { x: 0, y: Ft - a * 0.25 }, { x: p, y: Ft }), u), i);
    return;
  }
  const d = 0.3 * g;
  let m;
  if (a > 0.3) {
    const y = Ft + 0.05;
    m = [...mn({ x: p, y }, { x: 0, y: Ft - d * 2 }, { x: -p, y })];
  } else if (a < -0.3) {
    const y = Ft - d * 0.6;
    m = [...mn({ x: p, y }, { x: 0, y: Ft + d * 1.4 }, { x: -p, y })];
  } else
    m = xs(0, Ft, p * 0.8, d);
  t.shape(o(m, u), t.ink, 0);
}
function E0(t = {}) {
  const e = (t.proportions ?? "bold") === "bold", n = t.figure ?? "fluid", s = t.look ?? "clean", i = t.height ?? 300, o = n === "stick";
  return {
    plan: t.plan ?? f0({
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
function dm(t, e, n, s) {
  const { point: i, facing: o } = Za(t, [e, n, s]);
  return { point: i, facing: o };
}
const ni = (t) => t.rest[1] < -0.5, A0 = 0.3;
function P0(t, e, n) {
  return t.figure === "stick" ? ni(e) ? n.slice(0, 3) : n : ni(e) && n.length >= 3 ? Pe(n[0], n[1], n[2], A0) : n.length === 3 ? Pe(n[0], n[1], n[2], 1) : n;
}
function Ii(t, e) {
  const n = t.plan.id === "human" ? { ...mt, ...e } : e;
  return Hi(t, n, $i(t.plan, n, { height: t.height, contact: t.contact }));
}
function Hi(t, e, n) {
  const s = {}, i = {}, o = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((u) => {
    const p = n.chains[u.id];
    s[u.id] = p.points;
    const g = p.depths.reduce((b, k) => b + k, 0) / p.depths.length, d = u.parent ? n.chains[u.parent] : void 0, m = d ? d.depths[u.at ?? d.depths.length - 1] : 0, y = g - m;
    o[u.id] = Math.abs(y) < r ? 0 : y, i[u.id] = { points: P0(t, u, p.points), depth: g };
  }), i.head = { points: [n.head.center], depth: n.head.depth }, o.head = 0;
  const a = [...t.plan.chains.map((u) => u.id), "head"], l = [...a].sort((u, p) => o[u] - o[p] || a.indexOf(u) - a.indexOf(p)), c = { hip: n.hip };
  for (const [u, [p, g]] of Object.entries(t.plan.landmarks ?? {})) {
    const d = n.chains[p]?.points;
    d && (c[u] = d[Math.min(g, d.length - 1)]);
  }
  const h = {};
  for (const [u, p] of Object.entries(c)) h[u] = p.y >= n.groundY - 0.01 * t.height;
  const f = {
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
  return { skeleton: n, joints: f, order: l };
}
function $0(t, e) {
  return Ii(t, e).joints;
}
function _0(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const i = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), o = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = Yn(s, i, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide(Yn(s, o, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function I0(t, e, n, s, i, o) {
  const r = n.lineWidth;
  if (i === "head") {
    const { head: p } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(p.center.x, p.center.y, p.rx, p.ry, p.angle, g, r), e.look !== "silhouette" && T0(e, p, o, r);
    return;
  }
  const a = n.plan.chains.find((p) => p.id === i), l = s.chains[i], c = s.parts[i].points;
  if (n.figure === "stick") {
    if (i === "neck") return;
    const p = i === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(p, r);
    return;
  }
  const h = (p, g) => [a.bones[p].width[0] * r, a.bones[g].width[1] * r];
  if (ni(a)) {
    const [p, g] = h(0, 1);
    if (e.limb(c, p, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && i.startsWith("arm."))
      O0(t, e, n, l, i.endsWith(".left") ? "left" : "right", o);
    else {
      const d = l[l.length - 1];
      e.dot(d.x, d.y, r * 0.62);
    }
    return;
  }
  if (i === "spine") {
    const p = s.points["hip.left"], g = s.points["hip.right"];
    p && g && Math.hypot(p.x - g.x, p.y - g.y) > 0.5 && e.limb([p, g], r * 1.3, r * 1.3);
    const [d, m] = h(0, a.bones.length - 1);
    e.limb(c, d, m);
    const y = s.points["shoulder.left"], b = s.points["shoulder.right"];
    y && b && Math.hypot(y.x - b.x, y.y - b.y) > 0.5 && e.limb(Pe(y, l[l.length - 1], b, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [f, u] = h(0, a.bones.length - 1);
  e.limb(c, f, u);
}
function H0(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const i = t.turn ?? 0, o = e === "right" ? 1 - i : 1 + i;
  return { ...gt, ...s, turn: o + (s.turn ?? 0) };
}
function O0(t, e, n, s, i, o) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  xi(t, r, H0(o, i), {
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
function C0(t, e, n, s = 0) {
  const i = e.plan.id === "human" ? { ...mt, ...n } : n;
  el(t, e, i, Ii(e, i), s);
}
function tl(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function pm(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...mt, ...e } : e, o = Ja(t.plan, i, { height: s.height, contact: t.contact }, n);
  return Hi(tl(t, o.height), i, o).joints;
}
function R0(t, e, n, s, i) {
  const o = e.plan.id === "human" ? { ...mt, ...n } : n, r = Ja(e.plan, o, { height: i.height, contact: e.contact }, s), a = tl(e, r.height);
  el(t, a, o, Hi(a, o, r), i.time ?? 0);
}
function el(t, e, n, s, i) {
  const { joints: o, order: r } = s, a = Ma(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: i,
    pencil: e.pencil
  }), l = (c) => {
    c && (t.save(), c(t, o, a, i), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", e.look === "pencil" && e.pencil.construction !== !1 && _0(a, e, o), l(e.layers.behind);
  for (const c of r) {
    const h = e.layers.parts?.[c];
    l(h?.under), I0(t, a, e, o, c, n), l(h?.over);
  }
  l(e.layers.front), t.restore();
}
function gm(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
function mm(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...mt, ...e } : e;
  let o;
  if (Array.isArray(s))
    o = s;
  else {
    const { skeleton: r } = Ii(t, i), a = $i(t.plan, { ...i, roll: 0 }, { height: t.height, contact: "none" }), l = (i.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, f = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), u = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), p = Math.PI / 2 * (i.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], d = Math.cos(p), m = Math.sin(p);
    o = [f * d - g * m, -u, f * m + g * d];
  }
  return w0(t.plan, i, n, o, { height: t.height });
}
function ym(t) {
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
      o.translate(n / 2, s), C0(o, e, r.props, a);
    }
  };
}
function L0(t, e, n) {
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
function bm(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" || l === "motionPathX" ? o = c : l === "y" || l === "motionPathY" ? r = c : l in i && (i[l] = c));
  const a = $0(s, i);
  return { pose: i, joints: L0(a, t.x + o + t.width / 2, t.y + r + t.height) };
}
function nl(t, e = mt) {
  const n = [];
  return t.forEach((s, i) => {
    const o = i === 0 ? e : n[i - 1], r = typeof s.pose == "string" ? qa[s.pose] : void 0;
    n.push(r ? { ...r, turn: o.turn ?? 0 } : { ...o, ...s.pose });
  }), n;
}
function wm(t, e, n = mt) {
  const s = nl(e, n);
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
const F0 = /* @__PURE__ */ new Set([
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
]), W0 = 1.7;
function B0(t, e, n) {
  const s = Array.from({ length: 24 }, (i, o) => {
    const r = o / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((i) => i === null) || (t.beginPath(), s.forEach((i, o) => o === 0 ? t.moveTo(i.x, i.y) : t.lineTo(i.x, i.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function D0(t) {
  const e = qe([0, 1, 0], t);
  if (e > 0.999999) return Zr();
  if (e < -0.999999) return Je(Se([1, 0, 0], 180));
  const n = Hn([0, 1, 0], t);
  return Je(Se(n, Math.acos(e) * 180 / Math.PI));
}
function N0(t, e, n, s, i) {
  const o = t.solid ?? {}, r = o.outline === !1 ? void 0 : o.outline ?? { width: 2, color: "#0f172a" }, a = { color: o.color ?? "#475569", shading: o.shading ?? "toon", outline: r }, l = { color: o.skin ?? "#f2c49b", shading: o.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, f = [], u = (k, x, v) => f.push({ mesh: k, world: Qt(i, x), material: v }), p = (k, x, v) => u(e.sphere, ta(k, [0, 0, 0, 1], [x, x, x]), v);
  for (const k of n.chains) {
    const x = s.chains[k.id], v = k.id === "spine" ? 1.9 : 1;
    k.bones.forEach((T, E) => {
      const O = x[E], M = x[E + 1], H = Gr(O, M), [$, A] = T.width ?? [1, 1], R = h * v * ($ + A) / 2;
      if (H > 1e-6) {
        const L = Jr(O, M, 0.5), N = D0(Ge(Jn(M, O)));
        u(e.cylinder, Qt(Qr(L), Qt(N, Mn([R, H, R]))), a);
      }
      p(O, h * v * $, a), p(M, h * v * A, a);
    }), k.id.startsWith("arm.") && p(x[x.length - 1], h * 1.5, l);
  }
  const { center: g, rx: d, ry: m, axes: y } = s.head, b = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...g, 1];
  u(e.sphere, Qt(b, Mn([d, m, d])), l);
  for (const k of [-1, 1]) {
    const x = Ge([k * 0.36, 0.15, 0.92]), v = xn(g, xn(xn(Xe(y[0], x[0] * d * 1.04), Xe(y[1], x[1] * m * 1.04)), Xe(y[2], x[2] * d * 1.04))), T = [...y[0], 0, ...y[1], 0, ...y[2], 0, ...v, 1];
    u(e.sphere, Qt(T, Mn([d * 0.11, m * 0.14, d * 0.03])), c);
  }
  return f;
}
const km = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: E0({ ...t.character, height: 1 }),
      cylinder: jo(b0(1, 1, 16)),
      sphere: jo(y0(1, 20))
    };
  },
  resolve({ object: t, prepared: e, values: n, world: s, camera: i, toScreen: o }) {
    const r = t, a = e, l = a.who, c = { ...mt, ...r.pose };
    for (const [m, y] of n)
      typeof y == "number" && !F0.has(m) && (c[m] = y);
    const h = r.height ?? W0, f = Qt(i.view, s), u = {
      toView: (m) => ea(f, m),
      toScreen: (m) => o(m)
    }, g = -u.toView([0, h / 2, 0])[2];
    if (g <= i.near) return null;
    const d = r.shadow === !1 ? [] : [{ depth: g + h, draw: (m) => B0(m, u, h * 0.18) }];
    if (r.look === "solid") {
      const m = Ga(l.plan, c, { height: h, contact: l.contact });
      return { meshes: N0(r, a, l.plan, m, s), drawables: d };
    }
    return {
      drawables: [
        ...d,
        {
          depth: g,
          draw(m, y) {
            m.lineCap = "round", m.lineJoin = "round", R0(m, l, c, u, { height: h, time: y.time });
          }
        }
      ]
    };
  }
}, K0 = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function vm(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : K0[n];
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
function Sm(t, e, n) {
  const s = n.width / 2, i = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, i + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -i);
}
function xm(t, e, n) {
  const s = e.width / 2, i = e.height / 2, o = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - i) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(o) - a * Math.sin(o),
    y: i + t.y + t.shakeY + r * Math.sin(o) + a * Math.cos(o)
  };
}
function Y0(t, e, n = {}, s) {
  const i = n.length ?? 240, o = 9, r = 28, a = i - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -o, a - r, 2 * o), t.fillStyle = "#e8b4a0", t.fillRect(a, -o, i - a, 2 * o), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -o), t.lineTo(r, o), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -o * 0.35), t.lineTo(r * 0.35, o * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -o }, { x: i, y: -o }, { x: i, y: o }, { x: r, y: o }, { x: 0, y: 0 }],
    [{ x: r, y: -o }, { x: r, y: o }],
    [{ x: a, y: -o }, { x: a, y: o }]
  ];
  for (const c of l) rl(t, c, s);
  t.restore();
}
function sl(t, e, n = {}, s) {
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
const il = 150, j0 = { pencil: 44, eraser: 30 };
function ol(t, e, n = {}, s) {
  const i = n.tool ?? "pencil", o = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, f = il * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const u = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, p = vt.pencilGrip, g = (E) => {
    const O = E.fingers.thumb, M = E.fingers.index, H = E.fingers.middle, $ = Uo([O.points[3], M.points[3], H.points[3]]), A = Uo([O.points[1], M.points[0]]), R = (O.depths[3] + M.depths[3] + H.depths[3]) / 3;
    return { pinch: $, direction: Math.atan2(A.y - $.y, A.x - $.x), depth: R };
  }, d = Vs(p, { size: f }), m = c - g(d).direction, y = Vs(p, { size: f, angle: m * 180 / Math.PI }), b = g(y), k = j0[i] * a, x = { x: b.pinch.x - Math.cos(c) * k, y: b.pinch.y - Math.sin(c) * k }, v = { x: u.x - x.x, y: u.y - x.y }, T = y.axes.up;
  X0(t, v, { x: -T.x, y: -T.y }, f, n.arm ?? 300 * a, o, n.sleeve ?? "#5b7db1", r), xi(t, v, p, {
    size: f,
    angle: m * 180 / Math.PI,
    skin: o,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: b.depth,
      draw: () => {
        t.save(), t.translate(u.x, u.y), t.scale(a, a), i === "eraser" ? sl(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : Y0(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const Uo = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function X0(t, e, n, s, i, o, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (d, m, y) => ({
    x: e.x + n.x * d + l.x * m * y,
    y: e.y + n.y * d + l.y * m * y
  }), f = h(i, 0, 0), u = (d) => {
    const m = t.createLinearGradient(e.x, e.y, f.x, f.y);
    return m.addColorStop(0, d), m.addColorStop(0.6, d), m.addColorStop(1, q0(d)), m;
  }, p = Math.min(s * 0.55, i * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / il), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(p + 4, -1, c * 1.1).x, h(p + 4, -1, c * 1.1).y), t.lineTo(h(p + 4, 1, c * 1.1).x, h(p + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = o, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(p, -1, c * 1.1).x, h(p, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(p, 1, c * 1.1).x, h(p, 1, c * 1.1).y), t.stroke();
  const g = [h(p, -1, c * 1.3), h(i, -1, c * 1.5), h(i, 1, c * 1.5), h(p, 1, c * 1.3)];
  t.beginPath(), g.forEach((d, m) => m ? t.lineTo(d.x, d.y) : t.moveTo(d.x, d.y)), t.closePath(), t.fillStyle = u(r), t.fill(), t.strokeStyle = u(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function Mm(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, i = n.enter ?? 450, o = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((d) => d.path.length > 0).sort((d, m) => d.start - m.start), l = (d) => d.tool ?? "pencil", c = (d) => {
    const m = Math.min(1, Math.max(0, d));
    return m * m * (3 - 2 * m);
  }, h = (d, m, y) => ({ x: d.x + (m.x - d.x) * y, y: d.y + (m.y - d.y) * y }), f = a.find((d) => e >= d.start && e <= d.end);
  if (f) {
    const d = f.end - f.start, m = d > 0 ? (e - f.start) / d : 1;
    return { at: vi(f.path, m), tool: l(f), lift: 0, drawing: !0 };
  }
  const u = [...a].reverse().find((d) => d.end < e), p = a.find((d) => d.start > e), g = (d) => d.path[d.path.length - 1];
  if (u && p && p.start - u.end <= r) {
    const d = (e - u.end) / (p.start - u.end), m = d < 0.5 ? l(u) : l(p);
    return { at: h(g(u), p.path[0], c(d)), tool: m, lift: Math.sin(Math.PI * d), drawing: !1 };
  }
  if (p && p.start - e <= i) {
    const d = 1 - (p.start - e) / i;
    return { at: h(s, p.path[0], c(d)), tool: l(p), lift: 1 - c(d), drawing: !1 };
  }
  if (u && e - u.end <= o) {
    const d = (e - u.end) / o;
    return { at: h(g(u), s, c(d)), tool: l(u), lift: c(d), drawing: !1 };
  }
  return null;
}
function Tm(t, e, n, s = 0.08, i = 32) {
  const o = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= i; a++) {
    const l = -Math.PI / 2 + o * a / i;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function Em(t) {
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
      const f = t.sketch ? Xs(a, t.sketch, c) : void 0;
      h > 0 && (f ? t.smooth ? f.curve(e, h) : f.line(e, h) : rl(a, Qe(e, h))), r && h > 0 && h < 1 && ol(a, vi(e, h), r, f);
    }
  };
}
function q0(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, i, o] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${i}, ${o}, 0)`;
}
function rl(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const yn = 1e5;
function Am(t, e, n, s, i = 6) {
  const o = [], r = Math.max(1, Math.round(i));
  for (let a = 0; a <= r; a++)
    o.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return o;
}
function al(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const i = Qe(e, s), o = n / 2, r = (a) => {
    t.beginPath(), t.rect(-yn, -yn, 2 * yn, 2 * yn), a(), t.clip("evenodd");
  };
  for (const a of i)
    r(() => {
      t.moveTo(a.x + o, a.y), t.arc(a.x, a.y, o, 0, Math.PI * 2);
    });
  for (let a = 1; a < i.length; a++) {
    const l = i[a - 1], c = i[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const f = -(c.y - l.y) / h * o, u = (c.x - l.x) / h * o;
    r(() => {
      t.moveTo(l.x + f, l.y + u), t.lineTo(c.x + f, c.y + u), t.lineTo(c.x - f, c.y - u), t.lineTo(l.x - f, l.y - u), t.closePath();
    });
  }
}
function Pm(t, e, n, s, i) {
  t.save(), al(t, e, n, s), i(), t.restore();
}
function $m(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, i = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(o, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (o.save(), al(o, e.path, n, l), t.draw(o, r, a), o.restore(), !i || l <= 0 || l >= 1) return;
      const c = vi(e.path, l);
      s ? ol(o, c, { ...s, tool: "eraser" }) : sl(o, c, i);
    }
  };
}
const U0 = {
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
}, si = ["wipe", "fly", "blur"], V0 = 16e-4, z0 = 0.6, Le = 33, G0 = 0.9, J0 = 8;
function _m(t) {
  const e = { ...U0, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, i = (t.lineHeight ?? 1.6) * s, o = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * o, l = Math.max(1, ...n.map((S) => S.length)), c = t.width ?? r * 2 + a + l * o, h = r * 2 + n.length * i, f = t.x + r + a, u = new Set(t.hidden ?? []), p = t.language ?? "plain";
  if (!ii.includes(p)) throw new Error(`codePanel: ${_t("language", p, ii)}`);
  const g = n.map((S) => np(S, p).flatMap((_) => Array.from(_.text, () => e[_.kind]))), d = /* @__PURE__ */ new Map(), m = [], y = /* @__PURE__ */ new Map(), b = [], k = [], x = (S) => {
    if (!Number.isInteger(S) || S < 1 || S > n.length) throw new Error(`codePanel: no line ${S} (it has ${n.length})`);
  }, v = (S, ..._) => d.set(S, [...d.get(S) ?? [], ..._]), T = (S, _, w, P, C = 300) => v(S, { time: P.at, value: _ }, { time: P.at + (P.duration ?? C), value: w, ...P.easing ? { easing: P.easing } : {} }), E = (S, _, w, P, C, D = 300) => {
    x(S), T(`line.${S}.${_}`, w, P, C, D);
  }, O = (S, _) => m.filter((w) => w.line < S && w.closed <= _).length, M = (S, _, w, P) => ({
    x: S + w / 2,
    y: _ + P / 2,
    left: S,
    right: S + w,
    top: _,
    bottom: _ + P,
    width: w,
    height: P
  }), H = (S) => t.y + r + (S - 1) * i, $ = (S) => Array.isArray(S) ? S : [S], A = (S, _) => {
    const w = d.get(S);
    return w ? [...w].sort((P, C) => P.time - C.time)[w.length - 1].value : _;
  }, R = (S, _, w) => {
    let P = -1;
    for (let C = 0; C < w; C++)
      if (P = n[S - 1].indexOf(_, P + 1), P < 0) throw new Error(`codePanel: line ${S} has no ${w > 1 ? `${w}th ` : ""}"${_}"`);
    return P;
  }, L = {};
  n.forEach((S, _) => {
    const w = _ + 1;
    L[`line.${w}.highlight`] = 0, L[`line.${w}.strike`] = 0, L[`line.${w}.wipe`] = 0, L[`line.${w}.reveal`] = u.has(w) ? 0 : 1, L[`line.${w}.shift`] = 0;
  });
  const N = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: L,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${p} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return Q0(Object.keys(L));
      },
      actions: ll
    },
    draw(S, _) {
      const w = _.props ?? {}, P = (B) => Number(w[B] ?? L[B]), C = r + a, D = (B) => r + (B - 1) * i - P(`line.${B}.shift`) * i;
      S.fillStyle = e.background, Vo(S, 0, 0, c, h, 8), S.fill(), S.font = `${s}px ${e.font}`, S.textBaseline = "middle", S.textAlign = "left";
      const Z = (B, V, I, W, F) => {
        const X = n[B - 1];
        for (let K = V; K < I; K++)
          X[K] !== " " && (S.fillStyle = g[B - 1][K], S.fillText(X[K], W + (K - V) * o, F));
      };
      S.save(), Vo(S, 0, 0, c, h, 8), S.clip(), n.forEach((B, V) => {
        const I = V + 1, W = P(`line.${I}.wipe`);
        if (W >= 1) return;
        const F = D(I), X = F + i / 2, K = Math.max(1, B.length) * o, J = Math.round(P(`line.${I}.reveal`) * B.length), nt = y.get(I) ?? { style: "wipe", from: "left" };
        S.save(), W > 0 && Z0(S, nt, W, { left: C - a, top: F, width: a + K + o, height: i }, c);
        const ht = P(`line.${I}.highlight`);
        ht > 0 && (S.globalAlpha *= Math.min(1, ht), S.fillStyle = e.highlight, S.fillRect(C - o / 2, F, K + o, i), S.globalAlpha /= Math.min(1, ht)), a > 0 && J > 0 && (S.fillStyle = e.gutter, S.textAlign = "right", S.fillText(String(I), C - o, X), S.textAlign = "left");
        const ft = [
          ...b.filter((Y) => Y.line === I).map((Y) => ({ column: Y.column, length: Y.text.length, piece: Y, insert: void 0 })),
          ...k.filter((Y) => Y.line === I).map((Y) => ({ column: Y.column, length: 0, piece: void 0, insert: Y }))
        ].sort((Y, et) => Y.column - et.column || Y.length - et.length);
        let ot = 0, q = C;
        for (const Y of ft) {
          Z(I, ot, Math.min(Y.column, J), q, X), q += (Y.column - ot) * o;
          let et = Y.length, at = "";
          if (Y.piece) {
            const lt = Y.piece.written ?? "", yt = P(`piece.${Y.piece.id}.write`);
            lt && yt > 0 ? (at = lt.slice(0, Math.round(yt * lt.length)), et = Y.length + (lt.length - Y.length) * Math.min(1, yt * 2)) : et = Y.length * (1 - P(`piece.${Y.piece.id}.away`));
          } else Y.insert && (et = Y.insert.chars * P(`insert.${Y.insert.id}.open`), Y.insert.text && (at = Y.insert.text.slice(0, Math.round(P(`insert.${Y.insert.id}.type`) * Y.insert.text.length))));
          S.fillStyle = e.text;
          for (let lt = 0; lt < at.length; lt++) at[lt] !== " " && S.fillText(at[lt], q + lt * o, X);
          q += et * o, ot = Y.column + Y.length;
        }
        Z(I, ot, Math.max(ot, J), q, X);
        const z = P(`line.${I}.strike`);
        z > 0 && (S.strokeStyle = e.strike, S.lineWidth = Math.max(1.5, s / 10), S.beginPath(), S.moveTo(C, X), S.lineTo(C + K * Math.min(1, z), X), S.stroke()), S.restore();
      });
      for (const B of b) {
        const V = P(`piece.${B.id}.opacity`);
        if (V <= 0 || P(`line.${B.line}.wipe`) >= 1) continue;
        const I = C + (B.column + B.text.length / 2) * o + P(`piece.${B.id}.x`), W = D(B.line) + i / 2 + P(`piece.${B.id}.y`);
        S.save(), S.globalAlpha = Math.min(1, V), S.translate(I, W), S.rotate(P(`piece.${B.id}.rotate`) * Math.PI / 180), Z(B.line, B.column, B.column + B.text.length, -B.text.length * o / 2, 0), S.restore();
      }
      S.restore();
    }
  }, U = (S, _) => ({
    x: S.home.x + Fe(d.get(`piece.${S.id}.x`), _),
    y: S.home.y + Fe(d.get(`piece.${S.id}.y`), _)
  }), it = (S, _) => {
    for (const w of ["x", "y", "rotate"]) {
      const P = `piece.${S.id}.${w}`, C = (d.get(P) ?? []).filter((D) => D.time <= _);
      d.set(P, C);
    }
  }, j = {
    target: N,
    lines: n,
    box: M(t.x, t.y, c, h),
    line(S, _ = 1 / 0) {
      return x(S), M(f, H(S) - O(S, _) * i, Math.max(1, n[S - 1].length) * o, i);
    },
    token(S, _, w = 1, P = 1 / 0) {
      x(S);
      const C = R(S, _, w);
      return M(f + C * o, H(S) - O(S, P) * i, _.length * o, i);
    },
    highlight(S, _) {
      for (const w of $(S)) {
        const P = A(`line.${w}.highlight`, 0);
        E(w, "highlight", P, _.on === !1 ? 0 : 1, _, 200);
      }
      return j;
    },
    strike(S, _) {
      for (const w of $(S)) E(w, "strike", A(`line.${w}.strike`, 0), 1, _);
      return j;
    },
    remove(S, _) {
      const w = $(S), P = _.style ?? "wipe";
      if (!si.includes(P)) throw new Error(`codePanel.remove: ${_t("style", P, si)}`);
      const C = P === "wipe" ? 300 : 450, D = _.at + (_.duration ?? C), Z = _.close ?? 250;
      for (const B of w)
        E(B, "wipe", 0, 1, { ..._, easing: _.easing ?? (P === "fly" ? "ease-in" : void 0) }, C), y.set(B, { style: P, from: _.from ?? "left" }), m.push({ line: B, closed: D + Z });
      for (let B = 1; B <= n.length; B++) {
        if (w.includes(B)) continue;
        const V = w.filter((W) => W < B).length;
        if (V === 0) continue;
        const I = A(`line.${B}.shift`, 0);
        E(B, "shift", I, I + V, { at: D, duration: Z, easing: "ease-in-out" });
      }
      return j;
    },
    type(S, _) {
      return E(S, "reveal", 0, 1, { duration: n[S - 1].length * 45, ..._ }), j;
    },
    piece(S, _, w = 1) {
      x(S);
      const P = R(S, _, w), C = b.find((Z) => Z.line === S && Z.column === P && Z.text === _);
      if (C) return C;
      if (b.some((Z) => Z.line === S && P < Z.column + Z.text.length && Z.column < P + _.length))
        throw new Error(`codePanel: "${_}" on line ${S} overlaps another piece`);
      const D = { id: b.length + 1, line: S, column: P, text: _, home: j.token(S, _, w, 0) };
      b.push(D);
      for (const Z of ["x", "y", "rotate", "write", "away"]) L[`piece.${D.id}.${Z}`] = 0;
      return L[`piece.${D.id}.opacity`] = 1, D;
    },
    follow(S, _) {
      for (const w of _)
        v(`piece.${S.id}.x`, { time: w.time, value: w.x - S.home.x }), v(`piece.${S.id}.y`, { time: w.time, value: w.y - S.home.y });
      return j;
    },
    fling(S, _) {
      const w = U(S, _.at), P = _.velocity ?? G(S, _.at) ?? { x: 0.5, y: -0.6 }, C = _.gravity ?? V0, D = _.duration ?? 900, Z = (_.spin ?? z0) * (P.x < 0 ? -1 : 1), B = Fe(d.get(`piece.${S.id}.rotate`), _.at);
      it(S, _.at);
      for (let V = 0; V <= D; V += Le) {
        const I = w.x + P.x * V, W = w.y + P.y * V + 0.5 * C * V * V;
        v(`piece.${S.id}.x`, { time: _.at + V, value: I - S.home.x }), v(`piece.${S.id}.y`, { time: _.at + V, value: W - S.home.y }), v(`piece.${S.id}.rotate`, { time: _.at + V, value: B + Z * V });
      }
      return T(`piece.${S.id}.opacity`, 1, 0, { at: _.at + D * 0.6, duration: D * 0.4 }), j;
    },
    move(S, _) {
      const w = U(S, _.at);
      return T(`piece.${S.id}.x`, w.x - S.home.x, _.to.x - S.home.x, _, 400), T(`piece.${S.id}.y`, w.y - S.home.y, _.to.y - S.home.y, _, 400), j;
    },
    write(S, _, w) {
      return S.written = _, T(`piece.${S.id}.write`, 0, 1, { duration: Math.max(1, _.length) * 70, ...w }), j;
    },
    spot(S, _, w = 1, P = 1 / 0) {
      x(S);
      const C = k.filter((D) => D.line === S && D.column <= _ && D.at <= P).reduce((D, Z) => D + Z.chars, 0);
      return M(f + (_ + C) * o, H(S) - O(S, P) * i, w * o, i);
    },
    insert(S, _, w, P) {
      x(S);
      const C = { id: k.length + 1, line: S, column: _, chars: w.length, text: w, at: P.at };
      k.push(C), L[`insert.${C.id}.open`] = 0, L[`insert.${C.id}.type`] = 0;
      const D = P.duration ?? w.length * 70;
      return T(`insert.${C.id}.open`, 0, 1, { at: P.at, duration: D * 0.6, easing: "ease-out" }), T(`insert.${C.id}.type`, 0, 1, { at: P.at, duration: D }), j;
    },
    drop(S, _, w, P) {
      x(_);
      const C = P.duration ?? 250, D = _ === S.line, Z = P.easing ?? (D ? "linear" : "ease-out"), B = j.landing(S, _, w, P.at), V = { id: k.length + 1, line: _, column: w, chars: S.text.length, at: P.at };
      return k.push(V), L[`insert.${V.id}.open`] = 0, T(`insert.${V.id}.open`, 0, 1, { at: P.at, duration: C, easing: D ? Z : "ease-out" }), T(`piece.${S.id}.away`, A(`piece.${S.id}.away`, 0), 1, { at: P.at, duration: C, easing: D ? Z : "ease-in-out" }), it(S, P.at), j.move(S, { at: P.at, duration: C, easing: Z, to: { x: B.x, y: B.y } }), T(`piece.${S.id}.rotate`, Fe(d.get(`piece.${S.id}.rotate`), P.at), 0, { at: P.at, duration: C }), j;
    },
    landing(S, _, w, P = 1 / 0) {
      const C = j.spot(_, w, S.text.length, P), D = _ === S.line && w > S.column ? S.text.length * o : 0;
      return M(C.left - D, C.top, C.width, C.height);
    },
    ride(S, _, w) {
      return Q(S, _, w.ground, w.every ?? Le);
    },
    tracks(S) {
      return [...d].filter(([, _]) => _.length > 0).map(([_, w]) => ({
        id: `${S}-${_}`,
        target: S,
        property: _,
        keyframes: tp(w)
      }));
    }
  };
  function Q(S, _, w, P) {
    const C = n.map((q, z) => d.get(`line.${z + 1}.shift`) ?? []);
    if (C.every((q) => q.length === 0)) return S;
    const D = S.find((q) => q.target === _ && q.property === "y"), Z = new $e({ id: `${_}-ride`, tracks: D ? [D] : [] }), B = (q) => D ? Number(Z.getStateAtTime(q).values.get(_)?.get("y") ?? 0) : 0, V = (q) => {
      const z = w + B(q);
      return n.findIndex((Y, et) => Math.abs(H(et + 1) - z) < 0.5);
    }, I = (D?.keyframes ?? []).map((q) => q.time), W = (q) => {
      const z = (yt) => yt < 0 ? 0 : -Fe(C[yt], q) * i, Y = V(q);
      if (Y >= 0) return z(Y);
      if (Math.abs(B(q)) < 0.5) return 0;
      const et = (yt) => V(yt) >= 0 || Math.abs(B(yt)) < 0.5, at = [...I].reverse().find((yt) => yt <= q && et(yt)), lt = I.find((yt) => yt >= q && et(yt));
      return at === void 0 && lt === void 0 ? 0 : at === void 0 ? z(V(lt)) : lt === void 0 || lt === at ? z(V(at)) : z(V(at)) + (z(V(lt)) - z(V(at))) * (q - at) / (lt - at);
    }, F = C.flatMap((q) => {
      const z = [...q].sort((Y, et) => Y.time - et.time);
      return z.slice(1).flatMap((Y, et) => Y.value !== z[et].value ? [{ start: z[et].time, end: Y.time }] : []);
    }), X = (q, z) => F.some((Y) => Y.start < z && Y.end > q) || W(q) !== W(z), K = D ? [...D.keyframes] : [{ time: 0, value: 0 }], J = [{ ...K[0], value: K[0].value + W(K[0].time) }], nt = (q, z) => {
      const Y = /* @__PURE__ */ new Set([z]);
      for (let et = q + P; et < z; et += P) Y.add(et);
      for (const et of F) for (const at of [et.start, et.end]) at > q && at < z && Y.add(at);
      for (const et of [...Y].sort((at, lt) => at - lt)) J.push({ time: et, value: B(et) + W(et) });
    };
    for (let q = 1; q < K.length; q++) {
      const z = K[q - 1].time, Y = K[q].time;
      X(z, Y) ? nt(z, Y) : J.push({ ...K[q], value: K[q].value + W(Y) });
    }
    const ht = K[K.length - 1].time, ft = Math.max(ht, ...F.map((q) => q.end));
    ft > ht && nt(ht, ft);
    const ot = { id: D?.id ?? `${_}-y`, target: _, property: "y", keyframes: J };
    return D ? S.map((q) => q === D ? ot : q) : [...S, ot];
  }
  function G(S, _) {
    const w = d.get(`piece.${S.id}.x`);
    if (!w || w.length < 2) return;
    const P = U(S, _ - Le), C = U(S, _);
    return { x: (C.x - P.x) / Le, y: (C.y - P.y) / Le };
  }
  return j;
}
function Z0(t, e, n, s, i) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const o = J0 * n;
  if (o > 0.2 && "filter" in t && (t.filter = `blur(${o.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * G0 * i, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
function Fe(t, e) {
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
const ll = {
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
function Q0(t) {
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
function tp(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
function Vo(t, e, n, s, i, o) {
  t.beginPath(), t.moveTo(e + o, n), t.arcTo(e + s, n, e + s, n + i, o), t.arcTo(e + s, n + i, e, n + i, o), t.arcTo(e, n + i, e, n, o), t.arcTo(e, n, e + s, n, o), t.closePath();
}
const jn = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
jn.typescript = [...jn.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const ii = Object.keys(jn), ep = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function np(t, e) {
  const n = new Set(jn[e]), s = ep[e], i = [], o = (a, l) => {
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
const zo = 40, sp = 0.215 + 0.205, Tt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}, st = (t, e) => t[e] ?? mt[e] ?? 0;
function Im(t, e, n = mt, s = 1) {
  const i = Qn(t), o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (1 + Math.cos(o * 2 * (i.bounces ?? 1))) / 2, c = i.crouch ?? 0, h = i.shoulder ?? 0, f = i.forearm ?? 0, u = { ...mt, ...n };
  u["leg.left.swing"] = i.swing * r + c * 0.6, u["leg.right.swing"] = -i.swing * r + c * 0.6, u["leg.left.knee"] = i.knee * Math.max(0, a) + c * 1.2, u["leg.right.knee"] = i.knee * Math.max(0, -a) + c * 1.2, u["leg.left.ankle"] = st(n, "leg.left.ankle") - (i.tiptoe ?? 0), u["leg.right.ankle"] = st(n, "leg.right.ankle") - (i.tiptoe ?? 0);
  for (const [p, g] of [["left", -1], ["right", 1]])
    st(n, `arm.${p}.spread`) > zo || st(n, `arm.${p}.swing`) > zo || (u[`arm.${p}.swing`] = h + g * i.arm * r, u[`arm.${p}.elbow`] = st(n, `arm.${p}.elbow`) + f + i.elbow * Math.max(0, g * r));
  return u.lean = st(n, "lean") + i.lean * s, u.bend = st(n, "bend") + (i.bend ?? 0), u["head.nod"] = st(n, "head.nod") - i.lean * 0.5 * s + (i.headTilt ?? 0), u.side = st(n, "side") + (i.sway ?? 0) * Math.sin(o), u.lift = st(n, "lift") + (i.bounce ?? 0) * s * l, u.stretch = st(n, "stretch") * (1 + (i.squash ?? 0) * (l - 0.5)), u;
}
function Hm(t, e, n = 1) {
  const s = Qn(t);
  return 4 * sp * e * Math.sin(s.swing * n * Math.PI / 180);
}
const ge = (t) => Ua[t], cl = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: st(t, "lean") - 4, ...Tt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Tt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Tt("leg", { swing: 25, knee: 60 }), ...ge("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Tt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Tt("arm", { spread: 70, bend: 0 }), ...Tt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Tt("arm", { spread: 60 }),
        "leg.left.swing": st(t, "leg.left.swing"),
        "leg.right.swing": st(t, "leg.right.swing"),
        "leg.left.knee": st(t, "leg.left.knee"),
        "leg.right.knee": st(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: st(t, "stretch"), bend: st(t, "bend"), ...ge("surprised"), ...Tt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": st(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": st(t, "head.nod") - 10, bend: st(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...ge("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { lift: 0, stretch: 0.88, "head.nod": st(t, "head.nod") - 4, bend: st(t, "bend") + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: st(t, "stretch"), "head.nod": st(t, "head.nod"), bend: st(t, "bend") }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
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
        ...ge("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Tt("arm", { spread: 75 }), ...Tt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": st(t, "arm.left.spread"), "arm.right.spread": st(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: st(t, "stretch"), bend: st(t, "bend"), ...Tt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...ge("scared"), ...Tt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: st(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: st(t, "side") + 2.5 * s, "head.tilt": st(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: st(t, "side"), "head.tilt": st(t, "head.tilt"), bend: st(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": st(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...ge("sad"), bend: 18, stretch: 0.92, lean: st(t, "lean") + 5, "head.nod": 14, ...Tt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function Om(t, e) {
  const n = Pt(e.from ?? {}), s = e.speed ?? 1;
  let i = n;
  return [
    { time: e.at, pose: n },
    ...cl[t](n).map((o) => (i = { ...i, ...o.pose }, { time: e.at + o.after * s, pose: i, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
const ip = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1);
function Cm(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = (a) => a.lineWidth * 0.45, i = (a, l, c) => {
    const h = a.parts[`leg.${c}`].points;
    l.shape(En(h, a.height * 0.08, a.height * 0.05), n, s(a));
  }, o = (a, l) => {
    const c = a.chains.spine, h = c[0], f = c[c.length - 1], u = { x: h.x - (f.x - h.x) * 0.25, y: h.y - (f.y - h.y) * 0.25 };
    l.shape(En([u, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), e, s(a));
  }, r = (a, l, c) => {
    const h = a.parts[`arm.${c}`].points, f = h[0], u = a.chains.spine[a.chains.spine.length - 1], g = [{ x: f.x + (u.x - f.x) * 0.45, y: f.y + (u.y - f.y) * 0.45 }, ...ip(h, 0, 0.45)], d = En(g, a.height * 0.085, a.height * 0.06), m = g.length, y = d.slice(0, m), b = d.slice(m).reverse();
    l.shape(d, e, 0);
    const k = (T) => Math.hypot(T[1].x - u.x, T[1].y - u.y), [x, v] = k(y) > k(b) ? [y, b] : [b, y];
    l.line(x.slice(1), s(a)), l.line(v.slice(Math.ceil(m * 0.45)), s(a)), l.line([y[m - 1], b[m - 1]], s(a));
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
const xe = {
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
function op(t) {
  if (t === void 0) return xe.full;
  if (typeof t == "string") return xe[t];
  const { base: e, ...n } = t;
  return { ...xe[e ?? "full"], ...n };
}
const oi = 160, rp = 120, ap = 700, Ms = 60, lp = 90, bn = 3200, Me = 1, ie = 1e-6;
function hl(t, e, n = {}) {
  const s = op(n.style), i = n.seed ?? 1, o = {};
  if (t.length === 0) return o;
  const r = Object.keys(t[0].pose).filter((f) => t.some((u) => Math.abs(u.pose[f] - t[0].pose[f]) > ie));
  for (const f of r) o[f] = cp(f, t, e, s, i);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const f = hp(t, e, s, i, t[0].pose[a]);
    f.length > 0 && (o[a] = f);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const f = up(t, c, t[0].pose[h], s.jumpSquash);
    f.length > 0 && (o[h] = f);
  }
  return o;
}
function cp(t, e, n, s, i) {
  const o = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = o ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (p) => {
    const g = (e[p].time - e[p - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], f = (p, g, d) => {
    const m = h[h.length - 1];
    if (p <= m.time + Me) {
      h[h.length - 1] = { ...m, value: g, ...d ? { easing: d } : {} };
      return;
    }
    h.push({ time: p, value: g, ...d ? { easing: d } : {} });
  };
  let u = e[0].pose[t];
  for (let p = 1; p < e.length; p++) {
    const g = e[p], d = e[p - 1].pose[t], m = g.pose[t], y = m - d, b = h[h.length - 1].time, k = g.act !== !1;
    if (Math.abs(y) <= ie) {
      const $ = g.time + (k ? c(p) : 0);
      if (p === e.length - 1)
        Math.abs(u - m) > ie && f(Math.max($, b + oi), m, "ease-in-out"), u = m;
      else if (k && a && s.drift > 0 && n.drift.includes(t) && $ - b >= ap) {
        const A = an(`${i}:${t}:${p}`) % 2 === 0 ? 1 : -1;
        u = m + A * s.drift * r, f($, u, "ease-in-out");
      }
      continue;
    }
    if (!k) {
      f(e[p - 1].time, u), f(g.time, m, g.easing), u = m;
      continue;
    }
    const x = c(p), v = Math.max(e[p - 1].time + x, b);
    let T = g.time + x;
    o && s.eyeDart > 0 && (T = Math.min(T, v + s.eyeDart));
    const E = T - v;
    if (E <= Me) {
      f(g.time, m, g.easing), u = m;
      continue;
    }
    f(v, u);
    const O = Math.sign(y);
    if (a && s.anticipation > 0 && r > 0 && E >= oi) {
      const $ = u - O * Math.min(Math.abs(y) * s.anticipation, r), A = v + E * s.anticipationTime;
      f(A, $, "ease-in-out"), s.hold > 0 && f(A + E * s.hold, $);
    }
    const M = p + 1 < e.length ? e[p + 1].time - g.time : 1 / 0, H = Math.min(s.settle, M / 2);
    if (a && s.overshoot > 0 && r > 0 && E >= rp && H > Me) {
      const $ = Math.min(Math.abs(y) * s.overshoot, r);
      f(T, m + O * $, g.easing ?? s.actionEase), f(T + H, m, s.settleEase);
    } else
      f(T, m, g.easing ?? s.actionEase);
    u = m;
  }
  return h;
}
function hp(t, e, n, s, i) {
  const o = [], r = Ms + lp;
  for (let p = 1; p < t.length; p++) {
    const g = t[p - 1].pose, d = t[p].pose;
    Object.entries(e.headTurns).some(([y, b]) => Math.abs((d[y] ?? 0) - (g[y] ?? 0)) > b) && t[p].act !== !1 && o.push(Math.max(t[0].time, t[p - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...o];
  let h = a + bn * 0.6, f = 0;
  for (; h < l; ) {
    c.some((d) => Math.abs(d - h) < bn / 2) || o.push(h);
    const g = (an(`${s}:blink:${f++}`) % 1e3 / 1e3 - 0.5) * (bn * 0.66);
    h += bn + g;
  }
  o.sort((p, g) => p - g);
  const u = [{ time: a, value: i }];
  for (const p of o) {
    const g = u[u.length - 1].time;
    p + Ms <= g + Me || (p > g + Me && u.push({ time: p, value: i }), u.push({ time: p + Ms, value: 1, easing: "ease-in" }), u.push({ time: p + r, value: i, easing: "ease-out" }));
  }
  return u.length > 1 ? u : [];
}
function up(t, e, n, s) {
  const i = n * (1 - 0.18 * s), o = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const f = r[r.length - 1];
    l <= f.time + Me || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], f = t[l - 1].time, u = t[l].time, p = u - f;
    if (!(p < oi || t[l].act === !1)) {
      if (c <= ie && h > ie)
        a(f, n), a(f + p * 0.2, i, "ease-out"), a(f + p * 0.45, o, "ease-out"), a(u, n, "ease-in-out");
      else if (c > ie && h <= ie) {
        const g = l + 1 < t.length ? t[l + 1].time - u : 400;
        a(f + p * 0.5, n), a(u - Math.min(60, p * 0.15), o, "ease-in"), a(u, i, "ease-out"), a(u + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const fp = {
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
function dp(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function pp() {
  const t = {}, e = {};
  for (const n of Object.keys(mt)) {
    const s = dp(n);
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
const gp = pp();
function ul(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function mp(t, e, n = {}) {
  const s = Ka(e), i = e.map((o, r) => ({ time: o.time, pose: { ...s[r] }, easing: o.easing, act: o.act }));
  return ul(t, hl(i, n.rig ?? fp, n));
}
function Rm(t, e, n = {}) {
  const s = n.rest ?? mt, i = nl(e, s), o = e.map((r, a) => ({ time: r.time, pose: { ...s, ...i[a] }, easing: r.easing, act: r.act }));
  return ul(t, hl(o, n.rig ?? gp, n));
}
const Go = ct.shocked, yp = ct.scared, he = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...Go, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...ct.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...Go, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...ct.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: t.leftShoulder, rightShoulder: t.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: tt.leftHip, rightHip: tt.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...yp, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Ht.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function Jo(t, e) {
  const n = typeof e.from == "string" ? Ht[e.from] : e.from ?? tt;
  return fl(he[t](n), { ...e, from: n });
}
function fl(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((i) => (s = { ...s, ...i.pose }, { time: e.at + i.after * n, pose: s, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function Xn(t, e = 1) {
  const n = he[t](tt);
  return n[n.length - 1].after * e;
}
function bp(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), i = n.spacing ?? 5, o = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * i, c = Math.floor(Math.abs(l) / Math.max(i, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const f = e[h - 1], u = e[h], p = u.x - f.x, g = u.y - f.y, d = Math.hypot(p, g) || 1, m = -g / d, y = p / d, b = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - b), t.lineWidth = o * (1 - b * 0.7), t.beginPath(), t.moveTo(f.x + m * l, f.y + y * l), t.lineTo(u.x + m * l, u.y + y * l), t.stroke();
    }
  }
  t.restore();
}
const wp = {
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
function Lm(t, e, n, s, i = {}) {
  const o = n.stateAt;
  if (!o) return;
  const r = i.length ?? 120, a = Math.max(2, Math.round(i.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let p = 0; p < a; p++) {
    const g = l + (n.time - l) * p / (a - 1);
    c.push(Na(e, { time: g, state: o(g) }, s).joints);
  }
  const h = c[c.length - 1].height, f = (i.threshold ?? 1.2) * h, u = (i.parts ?? ["hands", "toes", "head"]).flatMap((p) => wp[p]);
  for (const p of u) {
    const g = c.map(p.at);
    let d = 0;
    for (let b = 1; b < g.length; b++) d += Math.hypot(g[b].x - g[b - 1].x, g[b].y - g[b - 1].y);
    const m = d / ((n.time - l) / 1e3);
    if (m <= f) continue;
    const y = Math.min(1, (m - f) / (f * 0.5));
    bp(t, g, { ...i, opacity: (i.opacity ?? 0.7) * y, spacing: i.spacing ?? h * 0.02 });
  }
}
function Fm(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, i * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = an(`${o}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * i * 0.3 * r, f = e.y - i * (0.06 + 0.12 * l) * r + Math.abs(c) * i * 0.03, u = i * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, f, u, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function Wm(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, i * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < o; a++) {
    const l = -Math.PI / 2 + (a - (o - 1) / 2) * Math.PI / (o + 1), c = i * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, f = e.y + Math.sin(l) * c;
    kp(t, h, f, i * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function kp(t, e, n, s, i) {
  t.beginPath();
  for (let o = 0; o < 10; o++) {
    const r = o % 2 === 0 ? s : s * 0.45, a = i + o * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    o === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const te = {
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
}, We = 1, wn = 0.55, Zo = 0.35, vp = 1.6, Qo = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, tr = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, er = {
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
}, nr = {
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
}, Sp = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, xp = "्", sr = "़", Mp = (t) => t >= "क" && t <= "ह", ir = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function Tp(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (i, o) => {
    const r = e[e.length - 1];
    r && r.viseme === i ? r.weight += o * 0.5 : e.push({ viseme: i, weight: o });
  };
  for (let i = 0; i < n.length; i++) {
    const o = n[i], r = n[i + 1];
    if (ir.has(o)) s("rest", vp);
    else if (/\s/.test(o)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: Zo });
    } else if ((o === "o" || o === "e") && r === o)
      s(o === "o" ? "u" : "i", We), i++;
    else if (o in Qo) s(Qo[o], We);
    else if (o in tr) s(tr[o], wn);
    else {
      if (o === "h") continue;
      if (/[a-z]/.test(o)) s("c", wn);
      else if (o in er) s(er[o], We);
      else if (Mp(o)) {
        const a = r === sr ? o === "फ" ? "f" : void 0 : Sp[o];
        s(a ?? "c", wn);
        let l = i + 1;
        n[l] === sr && l++;
        const c = n[l];
        c === xp ? i = l : c && c in nr ? (s(nr[c], We), i = l) : (!c || /\s/.test(c) || ir.has(c) || s("a", We * 0.6), i = l - 1);
      } else (o === "ं" || o === "ँ") && s("l", wn * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === Zo); ) e.pop();
  return e;
}
function dl(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", i = e.energy ?? 1, o = Tp(t.text), r = [{ time: t.start, value: te.rest.mouth }], a = [{ time: t.start, value: te.rest.mouthWidth }], l = o.reduce((h, f) => h + f.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const f of o) {
      const u = c * f.weight / l, p = h + Math.min(u * 0.4, 60);
      if (p > r[r.length - 1].time) {
        const g = te[f.viseme];
        r.push({ time: p, value: g.mouth * i, easing: "ease-out" }), a.push({ time: p, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, i), easing: "ease-out" });
      }
      h += u;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: te.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: te.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function Bm(t, e, n = {}) {
  const s = {};
  for (const i of [...e].sort((o, r) => o.start - r.start))
    for (const [o, r] of Object.entries(dl(i, n))) {
      const a = s[o] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([i, o]) => ({ id: `${t}-${i}`, target: t, property: i, keyframes: o }));
}
function Ep(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const i = s.fields?.mouth ?? "mouth", o = s.fields?.mouthWidth ?? "mouthWidth", r = { [i]: te.rest.mouth, [o]: te.rest.mouthWidth, ...s.rest }, a = new $e({ id: "before-speech", tracks: e }), l = (f, u) => a.getStateAtTime(u).values.get(t)?.get(f) ?? r[f], c = [i, o], h = e.filter((f) => f.target !== t || !c.includes(f.property));
  for (const f of c) {
    const u = e.find((g) => g.target === t && g.property === f);
    let p = u ? [...u.keyframes] : [{ time: 0, value: l(f, 0) }];
    for (const g of n) {
      const d = dl(g, s)[f];
      d[0] = { ...d[0], value: l(f, g.start) }, d[d.length - 1] = { ...d[d.length - 1], value: l(f, g.end) }, p = [...p.filter((m) => m.time < g.start || m.time > g.end), ...d], p.sort((m, y) => m.time - y.time);
    }
    h.push({ id: u?.id ?? `${t}-${f}`, target: t, property: f, keyframes: p });
  }
  return h;
}
const es = {
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
function pl(t = {}) {
  return [
    ...Object.keys(It),
    ...Object.keys(Ht),
    ...Object.keys(he),
    ...Object.keys(es),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function gl(t = {}) {
  const e = new Set(pl()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function ml(t = {}) {
  const e = {};
  for (const n of Object.keys(It)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(Ht)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(he)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(es)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const ri = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], Ap = {
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
}, kn = ["viewer", "ahead", "back"], Jt = (t) => typeof t == "number" && Number.isFinite(t);
function yl(t, e = {}) {
  const n = gl(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = pl(e), i = (l) => l in It || l in (e.gaits ?? {}), o = Object.keys(ct), r = Object.keys(tt);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (d) => n.push({ level: "error", beat: c, message: d }), f = (d) => n.push({ level: "warning", beat: c, message: d });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const u = l;
    for (const d of Object.keys(u))
      ri.includes(d) || h(_t("beat field", d, ri, Ap[d.toLowerCase()]));
    const p = u.do;
    if (p === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof p != "string" || !s.includes(p)) {
      h(_t("action", p, s));
      return;
    }
    const g = es[p] ?? e.actions?.[p];
    for (const d of g?.needs ?? [])
      u[d] === void 0 && h(`\`${p}\` needs \`${d}\`.`);
    if (i(p) && u.to === void 0 && f(`\`${p}\` without \`to\` walks nowhere.`), p === "leap" && u.to === void 0 && u.onto === void 0 && f("`leap` without `to` or `onto` jumps on the spot."), u.mood !== void 0 && (typeof u.mood != "string" || !o.includes(u.mood)) && h(_t("mood", u.mood, o)), u.pose !== void 0)
      if (!u.pose || typeof u.pose != "object" || Array.isArray(u.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [d, m] of Object.entries(u.pose))
          r.includes(d) ? Jt(m) || h(`Pose joint \`${d}\` must be a number (got ${JSON.stringify(m)}).`) : h(_t("pose joint", d, r));
    for (const d of ["at", "for"]) {
      const m = u[d];
      m !== void 0 && !(Jt(m) && m >= 0) && h(`\`${d}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    Jt(u.at) && (u.at < a && f(`\`at\` ${u.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = u.at);
    for (const d of ["to", "onto"]) {
      const m = u[d];
      m !== void 0 && !Jt(m) && h(`\`${d}\` is a scene ${d === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (u.toward !== void 0 && !Jt(u.toward) && !kn.includes(u.toward) && h(`\`toward\` is a scene x or one of ${kn.join(", ")}${typeof u.toward == "string" && Ws(u.toward, kn) ? ` (did you mean "${Ws(u.toward, kn)}"?)` : ""} (got ${JSON.stringify(u.toward)}).`), u.say !== void 0 && typeof u.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(u.say)}).`), u.target !== void 0) {
      const d = u.target;
      (!d || typeof d != "object" || !Jt(d.x) || !Jt(d.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function or(t, e = {}, n = "scriptTracks") {
  const s = yl(t, e).filter((i) => i.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((i) => `  ${i.beat >= 0 ? `beat ${i.beat}: ` : ""}${i.message}`).join(`
`)}`);
}
pf(ml);
function Dm(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function Nm(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const rr = 8;
function bl(t, e = {}, n = 0) {
  if (n > rr) throw new Error(`scriptTracks: custom actions nest more than ${rr} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const i = e[s.do];
    if (!i || !("beats" in i)) return [s];
    const o = i.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return bl(o, e, n + 1);
  });
}
function Pp(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const ar = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, $p = 450, _p = 2.4, Ip = 160, lr = 2.5, Hp = 200, Op = 340, Cp = 1.1, cr = [380, 900], Rp = 0.35, vn = 300, Ts = 150, Lp = 260, Fp = 1.2, Es = 160, hr = 400, Be = 300, Wp = 450, ur = 500, As = 350, fr = 150, Bp = 120, Ps = 180, dr = 420, Dp = 300, pr = 300, Np = 140, $s = 150, gr = 450, Kp = 450, _s = 150, mr = 350, yr = 400, Yp = 12, jp = 600, br = 90, wr = 400, Xp = 200, qp = 0.09, kr = 350, Nt = 450, Is = 1200, Up = 700, me = 320, Kt = 220, Vp = 65, zp = 700, vr = (t) => t in he, Gp = (t) => t in Ht;
function Jp(t) {
  return Math.max(zp, Array.from(t).length * Vp);
}
function Zp(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  or(e, s);
  const i = n.gait ?? "walk", o = bl(e, n.actions).map((w) => w.do === "go" ? { ...w, do: i } : w);
  or(o, s, "scriptTracks (after expanding custom actions)");
  const r = (w) => It[w] ?? n.gaits?.[w], a = (w) => ar[w] ?? n.gaits?.[w]?.cycle ?? 1e3, l = (w) => {
    const P = n.actions?.[w];
    return P && "steps" in P ? P : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, f = n.height ?? 300;
  let u = c, p = h, g = n.facing ?? 1, d = n.start ?? tt, m = 0, y = 0;
  const b = [{ time: 0, pose: d }], k = [{ time: 0, value: 0 }], x = [{ time: 0, value: 0 }], v = [{ time: 0, value: 0 }], T = [{ time: 0, value: 0 }], E = [{ time: 0, value: "walk" }], O = [{ time: 0, value: g }], M = [], H = [], $ = [], A = (w, P, C, D) => {
    d = { ...d, ...P }, C && (d = ne(d, C)), b.push({ time: w, pose: d, ...D === !1 ? { act: D } : {} });
  }, R = (w, P, C) => (A(w + me / 2, { turn: 0 }, C), O.push({ time: w + me / 2, value: g }, { time: w + me / 2 + 1, value: P }), g = P, A(w + me, { turn: 1 }), w + me), L = (w) => w < u ? -1 : 1, N = (w, P, C) => L(P) !== g ? R(w, L(P), C) : w, U = (w, P, C, D = "arm") => {
    const Z = D === "arm", B = Zt({ ...w, ...Z ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: f, facing: g }), V = Z ? B.shoulders.right : B.hip, I = Z ? B.elbows.right : B.knees.right, W = (K, J) => Math.atan2(g * K, J) * 180 / Math.PI, X = ((W(P - (u + V.x), C - (p + V.y)) - W(I.x - V.x, I.y - V.y)) % 360 + 360) % 360;
    return X > 270 ? X - 360 : X;
  }, it = (w, P, C, D) => {
    const Z = D === "arm", B = Zt({ ...w, ...Z ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: f, facing: g }), V = Z ? B.shoulders.right : B.hip, I = Z ? { x: (B.hands.right.x + B.fingertips.right.x) / 2, y: (B.hands.right.y + B.fingertips.right.y) / 2 } : B.feet.right, W = Math.hypot(I.x - V.x, I.y - V.y), F = C - (p + V.y), X = Math.abs(F) < W ? Math.sqrt(W * W - F * F) : W * 0.1;
    return P - V.x - g * X;
  }, j = (w) => {
    const P = Zt(w, { height: f, facing: g });
    return { x: u + (P.hands.right.x + P.fingertips.right.x) / 2, y: p + (P.hands.right.y + P.fingertips.right.y) / 2 };
  }, Q = (w, P, C) => {
    const D = { ...w, rightWrist: 0, rightElbow: 0, rightShoulder: U(w, P, C) }, Z = Zt(D, { height: f, facing: g }), B = { x: u + Z.shoulders.right.x, y: p + Z.shoulders.right.y }, V = { x: u + Z.elbows.right.x, y: p + Z.elbows.right.y }, I = j(D), W = Math.hypot(V.x - B.x, V.y - B.y), F = Math.hypot(I.x - V.x, I.y - V.y), X = Math.min(W + F - 0.01, Math.max(Math.abs(W - F) + 0.01, Math.hypot(P - B.x, C - B.y))), K = (ot) => ot * 180 / Math.PI, J = K(Math.acos((W * W + X * X - F * F) / (2 * W * X))), nt = 180 - K(Math.acos((W * W + F * F - X * X) / (2 * W * F)));
    let ht = { rightShoulder: D.rightShoulder, rightElbow: 0 }, ft = 1 / 0;
    for (const ot of [1, -1])
      for (const q of [1, -1]) {
        const z = { rightShoulder: D.rightShoulder + ot * J, rightElbow: q * nt }, Y = { ...w, rightWrist: 0, ...z }, et = j(Y), lt = Math.hypot(et.x - P, et.y - C) - Zt(Y, { height: f, facing: g }).elbows.right.y * 1e-3;
        lt < ft && (ft = lt, ht = z);
      }
    return ht;
  }, G = (w, P, C) => Math.abs(P - u) < 2 ? w : (k.push({ time: w, value: u - c }, { time: w + C, value: P - c, easing: "ease-in-out" }), u = P, w + C);
  for (const w of o) {
    const P = Math.max(w.at ?? y, y === 0 ? 0 : b[b.length - 1].time);
    let C = P, D, Z;
    const B = w.pose ?? {}, V = l(w.do);
    if (r(w.do)) {
      const I = w.to ?? u, W = I === u ? g : L(I);
      let F = P;
      W !== g ? F = R(P, W, w.mood) : d.turn < 1 ? (F = P + Kt, A(F, { turn: 1, ...B }, w.mood)) : (w.mood || w.pose) && A(P + Kt, B, w.mood);
      const K = Math.abs(I - u) / _o(r(w.do), f), J = w.for ?? Math.max(Kt * 2, K * a(w.do)), nt = F + J;
      E.push({ time: F, value: w.do }), T.push({ time: F, value: 0 }, { time: F + Kt, value: 1, easing: "ease-out" }), T.push({ time: nt - Kt, value: 1 }, { time: nt, value: 0, easing: "ease-in" }), v.push({ time: F, value: m }, { time: nt, value: m + K }), k.push({ time: F, value: u - c }, { time: nt, value: I - c }), m += K, u = I, A(nt, {}), C = nt;
    } else if (w.do === "zip") {
      const I = w.to ?? u, W = I === u ? g : L(I);
      let F = P;
      W !== g ? F = R(P, W, w.mood) : d.turn < 1 && (F = P + Kt, A(F, { turn: 1 }, w.mood));
      const X = Jo("windUp", { at: F, from: w.mood ? ne(d, w.mood) : d });
      b.push(...X), d = X[X.length - 1].pose;
      const K = F + Xn("windUp"), J = K + $p, nt = J + Math.max(Ip, Math.abs(I - u) / _p);
      E.push({ time: K, value: "run" }), T.push({ time: K, value: 0 }, { time: K + 80, value: 1, easing: "ease-out" }, { time: nt, value: 1 }, { time: nt + 120, value: 0 }), v.push({ time: K, value: m }, { time: J, value: m + lr, easing: "ease-in" }), m += lr + (nt - J) / ar.run * 1.5, v.push({ time: nt, value: m }), k.push({ time: J, value: u - c }, { time: nt, value: I - c, easing: "ease-in" }), $.push({ kind: "dust", time: J, x: u, y: p, length: 900 }), u = I, A(nt, {}), C = nt;
    } else if (w.do === "leap") {
      const I = w.to ?? u, W = w.onto ?? p;
      let F = I === u ? P : N(P, I, w.mood);
      d.turn < 1 && (F += Kt, A(F, { turn: 1 }, w.mood));
      const X = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      A(F + Hp, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...X }, w.mood, !1);
      const K = F + Op;
      A(K - 40, { stretch: 0.72 }, void 0, !1), A(K, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const J = Math.hypot(I - u, W - p), nt = w.for ?? Math.min(cr[1], Math.max(cr[0], 300 + J * Cp)), ht = Math.min(p, W) - Rp * f, ft = Math.sqrt(p - ht), ot = Math.sqrt(W - ht), q = K + nt * ft / (ft + ot), z = K + nt;
      A(q, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), A(z, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), A(z + 180, { stretch: 1.05, bend: -3 }, void 0, !1), A(z + 340, { stretch: 1, bend: 0, leftHip: tt.leftHip, rightHip: tt.rightHip, leftShoulder: tt.leftShoulder, rightShoulder: tt.rightShoulder, leftElbow: tt.leftElbow, rightElbow: tt.rightElbow }, void 0, !1), k.push({ time: K, value: u - c }, { time: z, value: I - c }), x.push(
        { time: K, value: p - h },
        { time: q, value: ht - h, easing: "ease-out-quad" },
        { time: z, value: W - h, easing: "ease-in-quad" }
      ), u = I, p = W, $.push({ kind: "dust", time: z, x: u, y: p, length: 500 }), C = z + 340, D = z;
    } else if (w.do === "point" && w.target) {
      const I = w.target, W = N(P, I.x, w.mood), F = { ...d, ...w.mood ? ct[w.mood] : {}, turn: Math.max(d.turn, 0.6), rightElbow: 0, rightWrist: 0, ...B }, X = Zt(F, { height: f, facing: g }).head.center, K = Math.abs(I.x - (u + X.x)), J = I.y - (p + X.y), nt = W + Nt;
      A(nt, { ...F, rightShoulder: U(F, I.x, I.y), lookX: 1, lookY: Qp(J / Math.max(1, Math.hypot(K, J))) * 0.8 }), C = nt + (w.for ?? Is), D = nt, Z = C;
    } else if (w.do === "swipe") {
      const I = w.target ?? { x: u + g * f * 0.5, y: p - f * 0.6 }, W = L(I.x), F = N(P, I.x, w.mood), X = W === 1 ? I.left ?? I.x : I.right ?? I.x, K = W === 1 ? I.right ?? I.x : I.left ?? I.x, J = { ...d, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...B };
      A(F + vn, { ...J, rightShoulder: U(J, u - g * f * 0.3, p - f * 1.1) }, w.mood, !1);
      const nt = { ...d, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, ht = { ...d, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      G(F, it(nt, X, I.y, "arm"), vn + Ts), A(F + vn + Ts, { lean: -12 }, void 0, !1);
      const ft = F + vn + Ts + 80;
      A(ft, { ...nt, rightShoulder: U(nt, X, I.y) }, void 0, !1);
      const ot = ft + (w.for ?? Math.max(Lp, Math.abs(K - X) / Fp));
      k.push({ time: ft, value: u - c }), u = it(ht, K, I.y, "arm"), k.push({ time: ot, value: u - c }), A(ot, { ...ht, rightShoulder: U(ht, K, I.y) }, void 0, !1), A(ot + Es, { lean: 16, bend: 14, rightShoulder: U(d, K + W * f * 0.4, I.y + f * 0.25) }, void 0, !1), A(ot + Es + hr, { lean: 0, bend: 0, rightShoulder: tt.rightShoulder, rightElbow: tt.rightElbow }), C = ot + Es + hr, D = ft, Z = ot;
    } else if (w.do === "grab" && w.target) {
      const I = w.target, W = N(P, I.x, w.mood), F = I.y > p - f * 0.5, X = {
        ...d,
        turn: 1,
        rightElbow: 0,
        bend: F ? 35 : 0,
        lean: F ? 12 : 0,
        stretch: F ? 0.75 : 1,
        lookX: 1,
        lookY: F ? 0.8 : 0,
        ...B
      }, J = G(W, it(X, I.x, I.y, "arm"), Be) + Wp;
      A(J, { ...X, rightShoulder: U(X, I.x, I.y) }, w.mood, !1), A(J + 120, {}, void 0, !1), A(J + ur, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), C = J + ur + 150, D = J;
    } else if (w.do === "throw") {
      const I = w.target?.x ?? w.to ?? u + g * f, W = N(P, I, w.mood), F = { ...d, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...B };
      A(W + As, { ...F, rightShoulder: U(F, u - g * f * 0.4, p - f * 1.05) }, w.mood, !1), A(W + As + fr, { lean: -14 }, void 0, !1);
      const X = W + As + fr + Bp, K = { ...d, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      b.push({ time: X, pose: d = { ...K, rightShoulder: U(K, u + g * f, p - f * 1.1) }, easing: "ease-in", act: !1 }), A(X + Ps, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), A(X + Ps + dr, { lean: 0, bend: 0, rightShoulder: tt.rightShoulder, rightElbow: tt.rightElbow, lookY: 0 }), C = X + Ps + dr, D = X, Z = X;
    } else if (w.do === "kick" && w.target) {
      const I = w.target, W = N(P, I.x, w.mood), F = { ...d, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, X = G(W, it(F, I.x, I.y, "leg"), Dp), K = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      A(X + pr, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...K, ...B }, w.mood, !1);
      const J = X + pr + Np, nt = U(F, I.x, I.y, "leg");
      b.push({ time: J, pose: d = { ...d, ...F, rightHip: nt }, easing: "ease-in", act: !1 }), A(J + $s, { lean: -15, rightHip: nt + 20 }, void 0, !1), A(J + $s + gr, {
        lean: 0,
        bend: 0,
        rightHip: tt.rightHip,
        rightKnee: 0,
        leftShoulder: tt.leftShoulder,
        rightShoulder: tt.rightShoulder,
        leftElbow: tt.leftElbow,
        rightElbow: tt.rightElbow,
        lookY: 0
      }), C = J + $s + gr, D = J;
    } else if (w.do === "put" && w.target) {
      const I = w.target, W = N(P, I.x, w.mood), F = I.y > p - f * 0.5, X = { ...d, turn: 1, rightElbow: 0, rightWrist: 0, bend: F ? 35 : 0, lean: F ? 12 : 0, stretch: F ? 0.75 : 1, lookX: 1, lookY: F ? 0.8 : 0, ...B }, J = G(W, it(X, I.x, I.y, "arm"), Be) + Kp;
      A(J, { ...X, rightShoulder: U(X, I.x, I.y) }, w.mood, !1), A(J + _s, {}, void 0, !1), A(J + _s + mr, { bend: 0, lean: 0, stretch: 1, rightShoulder: tt.rightShoulder, rightElbow: tt.rightElbow, lookY: 0 }), C = J + _s + mr, D = J;
    } else if (w.do === "write" && w.target) {
      const I = w.target, W = I.left ?? I.x, F = I.right ?? I.x, X = N(P, (W + F) / 2, w.mood), K = { ...d, turn: 1, rightElbow: 0, rightWrist: 0, ...ct.thinking, lookX: 1, lookY: 0, ...B }, J = (et) => it(K, et, I.y, "arm") + g * f * 0.08, nt = (et) => {
        const at = j({ ...K, ...Q(K, et, I.y), rightWrist: 0 });
        return Math.hypot(at.x - et, at.y - I.y) < 2;
      }, ht = g === 1 ? W : F, ft = G(X, J((W + F) / 2), Be), ot = !nt(W) || !nt(F), q = ot ? G(ft, J(W), Be) + yr : ft + yr;
      A(q, { ...K, ...Q(K, ot ? W : ht, I.y) }, w.mood, !1);
      const z = w.for ?? Math.max(jp, Math.abs(F - W) * Yp);
      ot && k.push({ time: q, value: u - c });
      for (let et = br, at = 0; et <= z; et += br, at++) {
        const lt = W + (F - W) * Math.min(et, z) / z;
        ot && (u = J(lt), k.push({ time: q + et, value: u - c }));
        const yt = (at % 2 === 0 ? -1 : 1) * f * 0.02;
        A(q + et, Q(K, lt, I.y + yt), void 0, !1);
      }
      const Y = q + z;
      A(Y, Q(K, F, I.y), void 0, !1), A(Y + wr, { rightShoulder: tt.rightShoulder, rightElbow: tt.rightElbow, ...ct.happy }), C = Y + wr, D = q, Z = Y;
    } else if (w.do === "push" && w.target) {
      const I = w.target, W = w.to ?? I.x, F = N(P, u + (W >= I.x ? 1 : -1), w.mood), X = g === 1 ? I.left ?? I.x : I.right ?? I.x, K = { ...d, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...B }, J = it(K, X, I.y, "arm"), nt = G(F, J + g * f * 0.06, Be), ht = Q(K, X, I.y), ft = { ...K, ...ht, leftShoulder: -ht.rightShoulder, leftElbow: -ht.rightElbow }, ot = nt + Xp;
      A(ot, ft, w.mood, !1);
      const q = Math.abs(W - I.x), z = ot + (w.for ?? Math.max(600, q / qp)), Y = q / _o("shove", f);
      E.push({ time: ot, value: "shove" }), T.push({ time: ot, value: 0 }, { time: ot + Kt, value: 1, easing: "ease-out" }, { time: z - Kt, value: 1 }, { time: z, value: 0, easing: "ease-in" }), v.push({ time: ot, value: m }, { time: z, value: m + Y }), m += Y, k.push({ time: ot, value: u - c }, { time: z, value: u + (W - I.x) - c }), u += W - I.x, A(z, {}, void 0, !1), A(z + kr, { lean: 0, bend: 0, rightShoulder: tt.rightShoulder, leftShoulder: tt.leftShoulder, rightElbow: tt.rightElbow, leftElbow: tt.leftElbow }), C = z + kr, D = ot, Z = z;
    } else if (V) {
      const I = w.mood ? ne(d, w.mood) : d, W = V.steps(I, w), F = fl(W, { at: P, from: I });
      b.push(...F), d = F[F.length - 1].pose, C = P + Math.max(Pp(W), w.for ?? 0);
    } else if (vr(w.do)) {
      const I = Jo(w.do, { at: P, from: w.mood ? ne(d, w.mood) : d });
      b.push(...I), d = I[I.length - 1].pose, C = P + Xn(w.do), w.do === "take" && $.push({ kind: "dust", time: P + 900, x: u, y: p, length: 500 }), w.do === "land" && $.push({ kind: "dust", time: P + 120, x: u, y: p, length: 500 });
    } else if (w.do === "look" || w.do === "face") {
      const I = w.toward ?? "viewer", W = w.for ?? Up;
      if (I === "viewer") A(P + Nt, { turn: 0, lookX: 0, lookY: 0, ...B }, w.mood);
      else if (I === "ahead") A(P + Nt, { turn: w.do === "face" ? 1 : 0.6, lookX: 1, ...B }, w.mood);
      else if (I === "back") A(P + Nt, { turn: 0.2, lookX: -1, ...B }, w.mood);
      else {
        const F = L(I);
        F !== g && w.do === "face" ? (R(P, F, w.mood), A(P + me + 1, { lookX: 1, ...B })) : F !== g ? A(P + Nt, { turn: 0.25, lookX: -1, ...B }, w.mood) : A(P + Nt, { turn: w.do === "face" ? 1 : 0.6, lookX: 1, ...B }, w.mood);
      }
      C = P + Math.max(W, Nt);
    } else if (Gp(w.do) || w.do === "stand") {
      const I = w.do === "stand" ? n.rest ?? tt : Ht[w.do], W = I.turn !== tt.turn ? I.turn : d.turn, F = w.mood ? ct[w.mood] : { lookX: d.lookX, lookY: d.lookY };
      A(P + Nt, { ...I, turn: W, ...F, ...B }), C = P + (w.for ?? Is);
    } else {
      const I = w.for ?? (w.say ? Jp(w.say) : Is);
      (w.mood || w.pose) && A(P + Math.min(Nt, I / 2), B, w.mood), C = P + I;
    }
    if (w.say) {
      const I = r(w.do) || vr(w.do) || V ? P : P + Math.min(150, (C - P) / 4), W = r(w.do) ? C : Math.max(I + 200, C - 100);
      M.push({ text: w.say, start: I, end: W }), w.do === "say" && ng(b, d, I, W);
    }
    w.onto !== void 0 && w.do !== "leap" && w.onto !== p && (x.push({ time: P, value: p - h }, { time: C, value: w.onto - h, easing: "ease-in-out" }), p = w.onto), C > b[b.length - 1].time && b.push({ time: C, pose: d }), H.push({ start: P, end: C, ...D !== void 0 ? { contact: D } : {}, ...Z !== void 0 ? { release: Z } : {} }), y = C;
  }
  const S = mp(t, eg(b), n), _ = [
    { id: `${t}-x`, target: t, property: "x", keyframes: k },
    { id: `${t}-y`, target: t, property: "y", keyframes: x },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: v },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: T },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: E },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: O }
  ].filter((w) => w.keyframes.length > 1 || w.property === "x");
  return {
    tracks: [...Ep(t, S, M, { energy: n.energy }), ..._],
    duration: y,
    lines: M,
    keys: b,
    beats: H,
    effects: $
  };
}
const Qp = (t) => Math.max(-1, Math.min(1, t)), tg = 30;
function eg(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < tg ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function ng(t, e, n, s) {
  const o = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !o.some((c) => Math.abs(c.time - l.time) < 60)), ...o), t.sort((l, c) => l.time - c.time);
}
function sg(t, e, n) {
  const s = new $e({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), i = Da({ x: n.x, y: n.y, style: n.style, cast: n.cast }), o = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = Na(i, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[o], f = c.fingertips[o];
    if (a.push({ time: l, x: (h.x + f.x) / 2, y: (h.y + f.y) / 2 }), l >= n.end) break;
  }
  return a;
}
function Km(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = gl(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(It), ...Object.keys(t.gaits ?? {})], i = t.gait ?? "walk";
  if (!s.includes(i)) throw new Error(`persona "${t.name}": ${_t("gait", i, s)}`);
  if (t.mood && !(t.mood in ct)) throw new Error(`persona "${t.name}": ${_t("mood", t.mood, Object.keys(ct))}`);
  const o = t.acting ?? "snappy";
  if (typeof o == "string" && !(o in xe)) throw new Error(`persona "${t.name}": ${_t("acting style", o, Object.keys(xe))}`);
  if (typeof t.stance == "string" && !(t.stance in Ht)) throw new Error(`persona "${t.name}": ${_t("stance", t.stance, Object.keys(Ht))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? Ht[t.stance] : kt(t.stance ?? {}), l = t.mood ? ne(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (f) => Da({ x: f.x, y: f.y, pose: l, style: { ...c, ...f.facing ? { facing: f.facing } : {} }, cast: e }),
    script: (f, u, p = {}) => Zp(f, u, {
      ...e,
      from: p.from,
      ground: p.ground,
      facing: p.facing,
      height: r,
      style: o,
      gait: i,
      start: l,
      rest: l,
      energy: t.energy
    }),
    check: (f) => yl(f, e),
    handPath: (f, u, p) => sg(f, u, { ...p, style: c, cast: e }),
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
      actions: ml(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const rt = ["rect", "circle", "text", "line", "path", "image", "custom"], ig = ["rect", "circle", "line", "path"], Oi = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: rt },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: rt },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: rt },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: rt },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: rt },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: rt },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: rt },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: rt },
  scale: { description: "Size, both ways", unit: "factor", types: rt },
  scaleX: { description: "Width factor", unit: "factor", types: rt },
  scaleY: { description: "Height factor", unit: "factor", types: rt },
  skewX: { description: "Slants it sideways", unit: "degrees", types: rt },
  skewY: { description: "Slants it up and down", unit: "degrees", types: rt },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: rt },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: rt },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: rt },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: rt },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: rt },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: rt },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: rt },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: rt },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: rt },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: rt },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: rt },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: rt },
  glowColor: { description: "Colour of the glow", kind: "color", types: rt },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: rt },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: rt },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: rt },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: rt },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: rt },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: ig },
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
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: rt },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: rt }
}, ai = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, og = {
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
function rg(t) {
  const e = t, n = Object.entries(Oi).filter(([, i]) => i.types.includes(t.type)).map(([i, { types: o, ...r }]) => ({ name: i, ...r, ...e[i] !== void 0 && typeof e[i] != "object" ? { value: e[i] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [i, o] of Object.entries(t.props ?? {}))
    n.push({ name: i, description: s?.props?.[i]?.description ?? "", ...s?.props?.[i], value: o });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function ag(t) {
  const e = rg(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(ai).filter((n) => e.includes(ai[n]))];
}
function Ym(t, e) {
  const n = [], s = Object.keys(e);
  for (const i of t) {
    const o = (u) => n.push({ level: "error", track: i.id, message: u }), r = e[i.target];
    if (!r) {
      o(_t("target", i.target, s));
      continue;
    }
    const a = ag(r), l = r.type === "custom" && r.acceptsProp?.(i.property);
    if (!a.includes(i.property) && !l) {
      o(`${i.target}: ${_t("property", i.property, a, og[i.property])}`);
      continue;
    }
    const c = i.keyframes ?? [];
    for (let u = 1; u < c.length; u++)
      c[u].time < c[u - 1].time && o(`${i.target}.${i.property}: keyframes out of time order (${c[u - 1].time} ms, then ${c[u].time} ms).`);
    const h = Oi[ai[i.property] ?? i.property] ?? r.about?.props?.[i.property], f = h && (h.kind ?? "number") === "number";
    for (const u of c) {
      if (f && typeof u.value != "number") {
        o(`${i.target}.${i.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(u.value)} at ${u.time} ms).`);
        break;
      }
      if (f && typeof u.value == "number" && (h.min !== void 0 && u.value < h.min || h.max !== void 0 && u.value > h.max)) {
        n.push({ level: "warning", track: i.id, message: `${i.target}.${i.property}: ${u.value} at ${u.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const lg = {
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
function cg(t, e = {}) {
  const n = {};
  for (const s of Object.keys(It)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(Ht)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(he)) n[s] = { summary: `The ${s} gag (${Xn(s)} ms).` };
  for (const [s, i] of Object.entries(es)) n[s] = { ...i };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(lg),
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
    canvasProperties: Oi,
    stickFigure: {
      poseFields: wa,
      props: ka,
      handFields: va,
      poses: Object.keys(Ht),
      expressions: Object.keys(ct),
      gags: Object.fromEntries(Object.keys(he).map((s) => [s, Xn(s)])),
      gaits: Object.keys(It),
      actingStyles: Object.keys(xe),
      beatFields: ri,
      actions: n,
      dances: Object.fromEntries(Object.entries(ue).map(([s, i]) => [s, Object.keys(i.moves)])),
      flips: Object.fromEntries(Object.entries(ts).map(([s, i]) => [s, i.label])),
      handShapes: Object.keys(vt),
      mudras: Object.keys(Zs)
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
    character: { poses: Object.keys(qa), expressions: Object.keys(Ua), gags: Object.keys(cl) },
    codePanel: {
      languages: ii,
      removeStyles: si,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: ll
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
const St = (t) => t.map((e) => `\`${e}\``).join(", "), Sr = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function jm(t, e = {}) {
  const n = cg(t, e), s = n.stickFigure;
  return [
    `# tinyfly capabilities${n.version ? ` (v${n.version})` : ""}`,
    "",
    "Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).",
    "",
    `**Timing.** ${n.timing}`,
    "",
    "## Easings",
    "",
    `Named: ${St(n.easings.named)}.`,
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
    Sr(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Sr(s.props),
    "",
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${St(Object.keys(s.handFields))}.`,
    "",
    `**Poses** (a beat's \`do\`, or a pose key): ${St(s.poses)}.`,
    "",
    `**Expressions** (a beat's \`mood\`): ${St(s.expressions)}.`,
    "",
    `**Gags** (ms): ${Object.entries(s.gags).map(([o, r]) => `\`${o}\` (${r})`).join(", ")}.`,
    "",
    `**Gaits**: ${St(s.gaits)}. **Acting styles** (\`style\`): ${St(s.actingStyles)}.`,
    "",
    "### Beat scripts",
    "",
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${St(s.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
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
    `**Hand shapes**: ${St(s.handShapes)}. **Mudras**: ${St(s.mudras)}.`,
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
    "## Character (v2 human)",
    "",
    `Poses: ${St(n.character.poses)}. Expressions: ${St(n.character.expressions)}. Gags: ${St(n.character.gags)}.`,
    "",
    "## Code panel",
    "",
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${St(n.codePanel.languages)}. Remove styles: ${St(n.codePanel.removeStyles)}.`,
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
function Xm(t) {
  const { timeline: e } = t, n = new oe();
  for (const [c, h] of Object.entries(t.targets)) {
    const f = typeof h == "string" ? document.querySelector(h) : h;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, f);
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
const qm = {
  timeline: xh,
  to(t, e, n) {
    const s = new ve(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new ve(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const i = new ve(s);
    return i.fromTo(t, e, n), i;
  },
  set(t, e, n) {
    const s = new ve(n);
    return s.set(t, e), s;
  }
};
function wl(t, e, n) {
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
function hg(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), i = Math.min(0.999, Math.max(0, e));
  for (let o = 0; o < n; o++) {
    const r = t[o * 4] / 255, a = t[o * 4 + 1] / 255, l = t[o * 4 + 2] / 255, c = t[o * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= i) continue;
    const f = (h - i) / (1 - i) * c / h;
    s[o * 3] = r * f, s[o * 3 + 1] = a * f, s[o * 3 + 2] = l * f;
  }
  return s;
}
function xr(t, e, n, s, i) {
  const o = new Float32Array(t.length), r = i ? n : e, a = i ? e : n, l = (h, f) => (i ? h * e + f : f * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let f = 0; f < 3; f++) {
      let u = 0;
      for (let p = -s; p <= s; p++) u += t[l(h, Math.min(a - 1, Math.max(0, p))) + f];
      for (let p = 0; p < a; p++) {
        o[l(h, p) + f] = u / c;
        const g = t[l(h, Math.max(0, p - s)) + f], d = t[l(h, Math.min(a - 1, p + s + 1)) + f];
        u += d - g;
      }
    }
  return o;
}
function Mr(t, e, n, s) {
  const i = Math.max(1, Math.round(s / Math.sqrt(3)));
  let o = t;
  for (let r = 0; r < 3; r++)
    o = xr(o, e, n, i, !0), o = xr(o, e, n, i, !1);
  return o;
}
function Um(t, e = {}) {
  const n = t.canvas, s = n.width, i = n.height;
  if (!(s > 0 && i > 0)) return;
  const o = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / o)), a = Math.max(1, Math.ceil(i / o)), l = wl(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = hg(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), f = (e.radius ?? Math.max(s, i) * 0.02) / o, u = Mr(h, r, a, f), p = Mr(h, r, a, f * 3), g = e.halo ?? 0.6, d = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let y = 0; y < 3; y++) d.data[m * 4 + y] = Math.round(Math.min(1, u[m * 3 + y] + p[m * 3 + y] * g) * 255);
    d.data[m * 4 + 3] = 255;
  }
  c.putImageData(d, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, i), t.restore();
}
function Vm(t, e, n) {
  const s = n.width ?? 6, i = n.taper ?? 1, o = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = fg(e, s, i, o, r);
    a ? (t.globalCompositeOperation = "lighter", li(t, c, n.color)) : dg(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, ug(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function ug(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const i = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return i ? `rgba(${i[1]}, ${i[2]}, ${i[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function fg(t, e, n, s, i) {
  const o = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = Vc(o), a = zc(o) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, f = i * (1 - s * h);
    if (f <= 0) continue;
    const u = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: f, ...u && a && { cap: a } });
  }
  return l;
}
function li(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [i, o, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(i.x, i.y), t.lineTo(o.x, o.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function dg(t, e, n) {
  const s = typeof t.getTransform == "function" ? t.getTransform() : null, i = (d) => s ? { x: s.a * d.x + s.c * d.y + s.e, y: s.b * d.x + s.d * d.y + s.f } : d, o = s ? Math.sqrt(Math.abs(s.a * s.d - s.b * s.c)) : 1, r = e.map((d) => ({
    ...d,
    corners: d.corners.map(i),
    ...d.cap && { cap: { ...d.cap, ...i(d.cap), radius: d.cap.radius * o, start: d.cap.start + (s ? Math.atan2(s.b, s.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, c = -1 / 0, h = -1 / 0;
  for (const d of r) {
    const m = d.cap ? [{ x: d.cap.x - d.cap.radius, y: d.cap.y - d.cap.radius }, { x: d.cap.x + d.cap.radius, y: d.cap.y + d.cap.radius }] : [];
    for (const y of [...d.corners, ...m])
      a = Math.min(a, y.x), l = Math.min(l, y.y), c = Math.max(c, y.x), h = Math.max(h, y.y);
  }
  if (!(c > a && h > l)) return;
  const f = Math.floor(a) - 1, u = Math.floor(l) - 1, p = s ? wl(t, Math.ceil(c) + 1 - f, Math.ceil(h) + 1 - u) : null, g = p?.getContext("2d");
  if (!p || !g) {
    li(t, e, n);
    return;
  }
  g.translate(-f, -u), g.globalCompositeOperation = "lighter", li(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(p, f, u), t.restore();
}
const zm = Ot.to, Gm = Ot.from, Jm = Ot.fromTo, Zm = Ot.set, Qm = Ot.timeline, ty = Ot.ticker, ey = Ot.splitText, ny = Ot.context, sy = Ot.matchMedia, iy = Ot.quickTo, oy = Ot.imageSequence, ry = Ot.pageTransition;
ff();
export {
  xe as ACTING_STYLES,
  ri as BEAT_FIELDS,
  Oi as CANVAS_PROPERTIES,
  ii as CODE_LANGUAGES,
  ll as CODE_PANEL_EDITS,
  U0 as CODE_THEME,
  mg as Clock,
  ve as CompatTimeline,
  Cu as CustomBounce,
  Ou as CustomEase,
  Ru as CustomWiggle,
  ue as DANCE_STYLES,
  Fr as DEFAULT_BAKE_INTERVAL_MS,
  Ri as DEFAULT_INERTIA_FRICTION,
  Uu as DEFAULT_LABELS,
  Ct as DEFAULT_SPRING,
  Qg as DEFAULT_TRANSITION,
  ha as Draggable,
  ct as EXPRESSIONS,
  xf as FINGERS,
  ts as FLIPS,
  Ci as FORMAT_VERSION,
  he as GAGS,
  It as GAITS,
  ar as GAIT_CYCLE_MS,
  gt as HAND_REST,
  vt as HAND_SHAPES,
  gp as HUMAN_ACTING_RIG,
  Ua as HUMAN_EXPRESSIONS,
  cl as HUMAN_GAGS,
  qa as HUMAN_POSES,
  mt as HUMAN_REST,
  K0 as IDENTITY_CAMERA,
  El as INERTIA_MAX_DURATION_MS,
  Sc as InertiaTrackPlayer,
  jt as LiveTimeline,
  xg as MORPH_SAMPLES,
  Zs as MUDRAS,
  gg as ManualClock,
  So as MediaSync,
  Vh as Observer,
  Ht as POSES,
  si as REMOVE_STYLES,
  tt as REST_POSE,
  es as SCRIPT_ACTIONS,
  $r as SPRING_MAX_DURATION_MS,
  ns as SPRING_PRESETS,
  De as SPRING_STEP_MS,
  fp as STICK_ACTING_RIG,
  mu as ScrollAnimator,
  Zn as ScrollDriver,
  yu as ScrollMarkers,
  uu as ScrollPin,
  go as SmoothScroll,
  Un as SpringSampler,
  vc as SpringTrackPlayer,
  Dh as Stage,
  $e as Timeline,
  ki as TinyflyPlayer,
  df as TinyflySequencer,
  as as TrackPlayer,
  te as VISEMES,
  Og as ValueResolver,
  hu as VisibilityDriver,
  Rm as actCharacterTracks,
  hl as actKeyframes,
  mp as actTracks,
  pl as actionNames,
  ag as animatableProperties,
  Um as applyBloom,
  Sm as applyCamera,
  _d as applyGroove,
  or as assertBeats,
  Wl as backOut,
  lm as bakeDanceTracks,
  Nr as bakeEasing,
  Br as bakeInertiaTrack,
  Wr as bakeSpringTrack,
  Cm as basicOutfit,
  om as beatAt,
  di as beatAtTime,
  zr as beatLength,
  fi as beatTime,
  Bg as beatsBetween,
  of as bindChoiceHotspots,
  en as blendPose,
  xa as boilFrame,
  Fl as bounceOut,
  vm as cameraFromValues,
  xm as cameraPoint,
  Ng as cameraTracks,
  cg as capabilities,
  jm as capabilitiesMarkdown,
  E0 as character,
  bm as characterAt,
  H0 as characterHandPose,
  $0 as characterJoints,
  pm as characterJointsInView,
  km as characterObjects,
  wm as characterPoseTracks,
  ym as characterTarget,
  Mc as charactersFor,
  yl as checkBeats,
  gl as checkCast,
  Ym as checkTracks,
  Tm as circlePath,
  pa as clamp01,
  Mg as clearMorphCache,
  vg as clearPathCache,
  al as clipErased,
  Ws as closestName,
  _m as codePanel,
  np as codeTokens,
  uo as containerProgressAt,
  ny as context,
  Gg as create,
  Ju as createControls,
  Rl as createCubicBezier,
  Nu as createLive,
  Ma as createPen,
  Gn as createRandom,
  Fs as createTrack,
  wg as criticalDamping,
  Rc as customBounce,
  Cc as customEase,
  Lc as customWiggle,
  Ti as danceFrame,
  sm as dancePose,
  Qs as danceStance,
  im as danceTaps,
  am as danceTracks,
  bs as danceTravel,
  Cd as danceTravelTrack,
  rm as dancer,
  Dm as defineAction,
  Nm as defineGait,
  rg as describeTarget,
  ze as deserializeTimeline,
  $c as deserializeTrack,
  Dg as detectTempo,
  Xg as draggable,
  xi as drawCartoonHand,
  C0 as drawCharacter,
  R0 as drawCharacterInView,
  Fm as drawDustPuff,
  sl as drawEraser,
  ol as drawHand,
  Wm as drawImpactStars,
  Y0 as drawPencil,
  bp as drawSpeedLines,
  wd as drawStickFigure,
  Lm as drawStickSmear,
  Vm as drawTrail,
  Em as drawnPathTarget,
  Il as easeIn,
  _r as easeInCubic,
  Ol as easeInOut,
  zn as easeInOutCubic,
  _l as easeInOutQuad,
  Pl as easeInQuad,
  Hl as easeOut,
  Ir as easeOutCubic,
  $l as easeOutQuad,
  jc as editDistance,
  Ll as elasticOut,
  Eo as ellipsePoints,
  $m as erasable,
  bl as expandBeats,
  wc as expandParametricEasings,
  Jd as flipPose,
  cm as flipTracks,
  Zd as flipTravel,
  Tr as formatVersionFor,
  Gm as from,
  _g as fromJSON,
  Jm as fromTo,
  Jo as gag,
  Xn as gagDuration,
  jf as gaitPose,
  _o as gaitStrideLength,
  Et as getEasingFunction,
  In as getInterpolator,
  Kr as getMotionPathPoint,
  Sg as getPathLength,
  zl as getPointAtProgress,
  Gh as gridLinesFor,
  Mm as handAt,
  Vs as handJoints,
  Rf as handJointsAt,
  sg as handPath,
  pt as handPose,
  Bn as handProp,
  vl as hasKeyframes,
  an as hashSeed,
  em as headPoint,
  Sl as heldTime,
  um as humanFieldLabel,
  Om as humanGag,
  Im as humanGaitPose,
  Hm as humanGaitStrideLength,
  f0 as humanPlan,
  Pt as humanPose,
  oy as imageSequence,
  on as inertiaDuration,
  sn as inertiaRest,
  Os as inertiaValueAt,
  kg as inertiaVelocityAt,
  mc as interpolateArray,
  gc as interpolateColor,
  Pg as interpolateMotionPath,
  Yt as interpolateNumber,
  bc as interpolatePathString,
  yc as interpolateQuaternion,
  zi as interpolateString,
  kl as isCubicBezierEasing,
  ae as isInertiaTrack,
  pg as isMotionPathPoint,
  Er as isMotionPathTrack,
  $n as isParametricEasing,
  rn as isPathData,
  le as isSpringTrack,
  ci as isTextTrack,
  bg as isUnderdamped,
  Hg as isUnresolved,
  L0 as jointsInScene,
  bd as jointsToScene,
  Cs as linear,
  dl as lipSyncKeyframes,
  Ep as lipSyncOver,
  Bm as lipSyncTracks,
  Ot as live,
  On as mapEase,
  jg as mat4,
  sy as matchMedia,
  Pr as maxStaggerDistance,
  hm as mirrorHumanPose,
  Pd as mirrorPose,
  tn as mixHandPoses,
  gm as mixPoses,
  ac as morphPath,
  af as mount,
  hf as mountAll,
  Rg as narrationMarkers,
  Lg as narrationSceneAt,
  _n as naturalRest,
  Fg as nearestBeat,
  Wg as nextBeat,
  ry as pageTransition,
  Dl as parametricEasing,
  ho as parseEdge,
  Te as parsePath,
  da as parseTrigger,
  Qe as partialPath,
  mf as pathLength,
  Km as persona,
  Cg as planNarration,
  zg as play,
  Zg as playSequence,
  Ug as playWhenVisible,
  Yr as playheadCrossings,
  vi as pointAlong,
  Hr as pointAtDistance,
  dm as pointOnHead,
  Xc as pointsToPath,
  kt as pose,
  nm as poseTracks,
  Tg as quat,
  Xm as quickPlay,
  iy as quickTo,
  Xr as randomBetween,
  Ig as randomChoice,
  Ic as randomSnapped,
  mm as reachCharacter,
  op as resolveActingStyle,
  nl as resolveCharacterPoseKeys,
  Qn as resolveGait,
  Ka as resolvePoseKeys,
  Hc as resolveSequence,
  Wa as resolveStickFrame,
  kd as resolveStickPose,
  Vr as resolveValue,
  Vc as ribbon,
  zc as ribbonHeadCap,
  re as rotateAbout,
  Ei as routineBeats,
  Pe as rubberLimb,
  ml as scriptActionSummaries,
  Zp as scriptTracks,
  qg as scrollProgress,
  Vg as scrubOnScroll,
  Am as scrubPath,
  tm as seatHeight,
  _c as serializeTimeline,
  Pc as serializeTrack,
  Zm as set,
  pi as shapeToPathData,
  kc as simplifyKeyframes,
  Ja as skeletonInView,
  Xs as sketchPen,
  cu as smoothToward,
  zh as snapAxis,
  du as snapConfig,
  gu as snapDuration,
  pu as snapProgress,
  Pi as solvePlanSpace,
  Tp as soundsOf,
  Jp as speechDuration,
  ey as splitText,
  xl as springDuration,
  yg as springValueAt,
  Ga as stagePlanSpace,
  Ar as staggerDistance,
  hi as staggerOffset,
  Hs as staggerOffsets,
  qn as staggerSpan,
  Pp as stepsDuration,
  Bl as stepsEasing,
  fl as stepsToKeys,
  Na as stickFigureAt,
  Zt as stickFigureJoints,
  Da as stickFigureTarget,
  fm as stickToHuman,
  Uf as strideLength,
  qu as syncMediaElement,
  Vf as talkingMouth,
  Si as taperedLine,
  En as taperedOutline,
  Ec as textAt,
  qm as tf,
  ty as ticker,
  Qm as timeline,
  zm as to,
  $g as toJSON,
  Eg as toKeyframedTrack,
  Ag as toKeyframedTracks,
  ee as trackTargets,
  Kg as trailSamples,
  Ze as triggerDistance,
  _t as unknownName,
  Jg as unmount,
  Yg as vec3,
  qf as walkPose,
  Pm as withErased,
  ne as withExpression
};
