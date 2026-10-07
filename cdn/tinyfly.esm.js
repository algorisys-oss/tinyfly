function qh(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function ds(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const pr = 2;
function Pl(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function ko(t) {
  return t.property === "text" && "textConfig" in t;
}
function Pe(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function Oe(t) {
  return t.kind === "spring" && "spring" in t;
}
function Ol(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function ew(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function Kh(t) {
  return "keyframes" in t;
}
class nw {
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
class sw {
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
function Yh(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function Il(t, e, n = "start") {
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
function _l(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, Il(s, t, e));
  return n;
}
function vo(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", i = Il(t, e, s);
  if (n.amount !== void 0) {
    const o = _l(e, s);
    return o === 0 ? 0 : n.amount * i / o;
  }
  return n.each !== void 0 ? n.each * i : 0;
}
function Li(t, e) {
  return Array.from({ length: t }, (n, s) => vo(s, t, e));
}
function Cs(t, e) {
  return t <= 1 ? 0 : Math.max(...Li(t, e));
}
const mn = 1, Hl = 6e4, Dn = Hl / mn, qt = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Zs = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Rs {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? qt.stiffness, this.damping = e.damping ?? qt.damping, this.mass = e.mass ?? qt.mass, this.restDelta = e.restDelta ?? qt.restDelta, this.restSpeed = e.restSpeed ?? qt.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? qt.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / mn);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], i = this.samples[Math.min(n + 1, this.samples.length - 1)], o = e / mn - n;
    return s + (i - s) * o;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Dn + 1), this.settledStep !== null ? this.settledStep * mn : Hl;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, Dn + 1), s = mn / 1e3;
    for (; this.samples.length < n; ) {
      const i = this.samples[this.samples.length - 1], o = i - this.to, r = -this.stiffness * o, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = i + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Dn && (this.settledStep = Dn);
  }
}
function iw(t, e) {
  return new Rs(t).valueAt(e);
}
function zh(t) {
  return new Rs(t).settleTime();
}
function ow(t) {
  const e = t.stiffness ?? qt.stiffness, n = t.damping ?? qt.damping, s = t.mass ?? qt.mass;
  return n < 2 * Math.sqrt(e * s);
}
function rw(t) {
  const e = t.stiffness ?? qt.stiffness, n = t.mass ?? qt.mass;
  return 2 * Math.sqrt(e * n);
}
const gr = 4, Xh = 2e-3, Uh = 1e-4, Vh = 6e4;
function Ls(t) {
  const e = t.friction ?? gr;
  return e > 0 ? e : gr;
}
function fs(t) {
  return t.from + t.velocity / Ls(t);
}
function Gh(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function Cn(t) {
  let e = Gh(fs(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function Rn(t) {
  const e = Math.abs(Cn(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(Uh, e * Xh);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Ls(t);
  return Math.min(Vh, s * 1e3);
}
function Fi(t, e) {
  if (e <= 0) return t.from;
  const n = Cn(t);
  if (e >= Rn(t)) return n;
  const s = Ls(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function aw(t, e) {
  const n = Ls(t), s = Cn(t);
  return e >= Rn(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Ni = (t) => t, Jh = (t) => t * t, Zh = (t) => 1 - (1 - t) * (1 - t), Qh = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, Cl = (t) => t * t * t, Rl = (t) => 1 - Math.pow(1 - t, 3), Fs = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, tu = Cl, eu = Rl, nu = Fs, su = {
  linear: Ni,
  "ease-in": tu,
  "ease-out": eu,
  "ease-in-out": nu,
  "ease-in-quad": Jh,
  "ease-out-quad": Zh,
  "ease-in-out-quad": Qh,
  "ease-in-cubic": Cl,
  "ease-out-cubic": Rl,
  "ease-in-out-cubic": Fs
};
function iu(t) {
  const [e, n, s, i] = t, o = 3 * e, r = 3 * (s - e) - o, a = 1 - o - r, l = 3 * n, c = 3 * (i - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + o) * p, d = (p) => ((h * p + c) * p + l) * p, f = (p) => (3 * a * p + 2 * r) * p + o, g = (p) => {
    let m = p;
    for (let w = 0; w < 8; w++) {
      const y = u(m) - p;
      if (Math.abs(y) < 1e-7)
        return m;
      const v = f(m);
      if (Math.abs(v) < 1e-7)
        break;
      m -= y / v;
    }
    let b = 0, S = 1;
    for (m = p; b < S; ) {
      const w = u(m);
      if (Math.abs(w - p) < 1e-7)
        return m;
      p > w ? b = m : S = m, m = (b + S) / 2;
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
function Qs(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function ou(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (i) => i <= 0 ? 0 : i >= 1 ? 1 : n * Math.pow(2, -10 * i) * Math.sin((i - s) * (2 * Math.PI) / e) + 1;
}
const ru = (t) => {
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
function au(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function lu(t, e = "end") {
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
function cu(t) {
  switch (t.type) {
    case "steps":
      return lu(t.count, t.position);
    case "elastic":
      return Qs(ou(t.amplitude, t.period), t.mode);
    case "bounce":
      return Qs(ru, t.mode);
    case "back":
      return Qs(au(t.overshoot), t.mode);
  }
}
function Pt(t) {
  return t === void 0 ? Ni : qh(t) ? iu(t.points) : ds(t) ? cu(t) : su[t] ?? Ni;
}
const mr = 32, hu = 256, je = /* @__PURE__ */ new Map(), uu = /[MmLlHhVvCcSsQqTtAaZz]/, du = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, fu = {
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
function pu(t) {
  const e = [];
  let n = 0, s = null;
  const i = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (i(), !(n >= t.length)); ) {
    const o = t[n];
    if (uu.test(o)) {
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
    const l = du.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function gu(t, e, n, s, i, o, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = i * Math.PI / 180, d = Math.cos(u), f = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = d * g + f * p, b = -f * g + d * p, S = m * m / (c * c) + b * b / (h * h);
  if (S > 1) {
    const I = Math.sqrt(S);
    c *= I, h *= I;
  }
  const w = o === r ? -1 : 1, y = c * c * h * h - c * c * b * b - h * h * m * m, v = c * c * b * b + h * h * m * m, E = w * Math.sqrt(Math.max(0, y / v)), T = E * c * b / h, x = -E * h * m / c, M = d * T - f * x + (t + a) / 2, P = f * T + d * x + (e + l) / 2, k = (I, R, L, $) => {
    const C = I * L + R * $, B = Math.sqrt((I * I + R * R) * (L * L + $ * $)), X = Math.acos(Math.max(-1, Math.min(1, C / B)));
    return I * $ - R * L < 0 ? -X : X;
  }, A = k(1, 0, (m - T) / c, (b - x) / h);
  let H = k((m - T) / c, (b - x) / h, (-m - T) / c, (-b - x) / h);
  !r && H > 0 && (H -= 2 * Math.PI), r && H < 0 && (H += 2 * Math.PI);
  const O = Math.max(1, Math.ceil(Math.abs(H) / (Math.PI / 2))), _ = H / O, D = 4 / 3 * Math.tan(_ / 4), F = (I) => {
    const R = c * Math.cos(I), L = h * Math.sin(I);
    return [d * R - f * L + M, f * R + d * L + P];
  }, W = (I) => {
    const R = -c * Math.sin(I), L = h * Math.cos(I);
    return [d * R - f * L, f * R + d * L];
  }, j = [];
  for (let I = 0; I < O; I++) {
    const R = A + I * _, L = R + _, [$, C] = F(R), [B, X] = I === O - 1 ? [a, l] : F(L), [K, J] = W(R), [tt, N] = W(L);
    j.push([$ + D * K, C + D * J, B - D * tt, X - D * N, B, X]);
  }
  return j;
}
function ae(t, e, n, s, i) {
  const o = 1 - i;
  return o * o * o * t + 3 * o * o * i * e + 3 * o * i * i * n + i * i * i * s;
}
function yr(t, e, n, s, i) {
  const o = 1 - i;
  return 3 * o * o * (e - t) + 6 * o * i * (n - e) + 3 * i * i * (s - n);
}
function ln(t, e, n, s) {
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
function jn(t, e, n) {
  const [s, i, o, r, a, l] = n, c = [0];
  let h = t, u = e, d = 0;
  for (let f = 1; f <= mr; f++) {
    const g = f / mr, p = ae(t, s, o, a, g), m = ae(e, i, r, l, g);
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
function Qe(t) {
  const e = je.get(t);
  if (e) return e;
  const n = [];
  let s = 0, i = 0, o = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of pu(t)) {
    const b = p.toUpperCase(), S = p !== b, w = fu[b];
    if (b === "Z") {
      (s !== o || i !== r) && u(ln(s, i, o, r)), c >= 0 && h.add(c), s = o, i = r, a = l = null;
      continue;
    }
    for (let y = 0; y + w <= m.length; y += w) {
      const v = m.slice(y, y + w), E = S ? s : 0, T = S ? i : 0;
      let x = null, M = null;
      switch (b) {
        case "M":
          y === 0 ? (s = v[0] + E, i = v[1] + T, o = s, r = i, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(ln(s, i, v[0] + E, v[1] + T)), s = v[0] + E, i = v[1] + T);
          break;
        case "L":
          u(ln(s, i, v[0] + E, v[1] + T)), s = v[0] + E, i = v[1] + T;
          break;
        case "H":
          u(ln(s, i, v[0] + E, i)), s = v[0] + E;
          break;
        case "V":
          u(ln(s, i, s, v[0] + T)), i = v[0] + T;
          break;
        case "C": {
          const P = [v[0] + E, v[1] + T, v[2] + E, v[3] + T, v[4] + E, v[5] + T];
          u(jn(s, i, P)), x = [P[2], P[3]], s = P[4], i = P[5];
          break;
        }
        case "S": {
          const [P, k] = a ? [2 * s - a[0], 2 * i - a[1]] : [s, i], A = [P, k, v[0] + E, v[1] + T, v[2] + E, v[3] + T];
          u(jn(s, i, A)), x = [A[2], A[3]], s = A[4], i = A[5];
          break;
        }
        case "Q":
        case "T": {
          let P = s, k = i;
          b === "Q" ? (P = v[0] + E, k = v[1] + T) : l && (P = 2 * s - l[0], k = 2 * i - l[1]);
          const A = b === "Q" ? v[2] + E : v[0] + E, H = b === "Q" ? v[3] + T : v[1] + T;
          u(
            jn(s, i, [
              s + 2 / 3 * (P - s),
              i + 2 / 3 * (k - i),
              A + 2 / 3 * (P - A),
              H + 2 / 3 * (k - H),
              A,
              H
            ])
          ), M = [P, k], s = A, i = H;
          break;
        }
        case "A": {
          const P = v[5] + E, k = v[6] + T;
          let A = s, H = i;
          for (const O of gu(s, i, v[0], v[1], v[2], v[3], v[4], P, k))
            u(jn(A, H, O)), A = O[4], H = O[5];
          s = P, i = k;
          break;
        }
      }
      a = x, l = M;
    }
  }
  const d = n.reduce((p, m) => p + m.length, 0), f = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let b = p, S = 0;
    for (; b < n.length && n[b].subpath === m; ) S += n[b++].length;
    const w = n[p], y = n[b - 1], v = h.has(m) || Math.abs(y.endX - w.startX) < 1e-9 && Math.abs(y.endY - w.startY) < 1e-9;
    f.push({ start: p, end: b, length: S, closed: v }), p = b;
  }
  const g = { segments: n, totalLength: d, subpaths: f };
  return je.size >= hu && je.delete(je.keys().next().value), je.set(t, g), g;
}
function mu(t, e) {
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
function yu(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, i, o, r, a] = t.points, l = mu(t, e);
  let c = yr(t.startX, n, i, r, l), h = yr(t.startY, s, o, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), d = ae(t.startX, n, i, r, u), f = ae(t.startY, s, o, a, u), g = ae(t.startX, n, i, r, l), p = ae(t.startY, s, o, a, l);
    c = l < 0.5 ? d - g : g - d, h = l < 0.5 ? f - p : p - f;
  }
  return {
    x: ae(t.startX, n, i, r, l),
    y: ae(t.startY, s, o, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function Ll(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let i = 0;
  for (let o = n; o < s; o++) {
    const r = t[o];
    if (i + r.length >= e || o === s - 1)
      return yu(r, e - i);
    i += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function bu(t, e) {
  const { segments: n, totalLength: s } = Qe(t);
  return Ll(n, Math.max(0, Math.min(1, e)) * s);
}
function lw() {
  je.clear();
}
function cw(t) {
  return Qe(t).totalLength;
}
const wu = 24, ku = 320, vu = 2.5, cn = 72, hw = 64, Mu = 0.2, Su = 128, yn = /* @__PURE__ */ new Map();
let ss = 0, oe;
const br = (t) => Math.round(t * 100) / 100;
function wr(t, e) {
  const { segments: n, subpaths: s, totalLength: i } = Qe(t);
  if (n.length === 0) return [];
  if (e) {
    const o = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: i, closed: o }];
  }
  return s.filter((o) => o.length > 0).map((o) => ({ segments: n, start: o.start, end: o.end, length: o.length, closed: o.closed }));
}
function Di(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = Ll(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function kr(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function vr(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Di(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function Mr(t) {
  let e = 0, n = 0;
  for (const [s, i] of t)
    e += s, n += i;
  return e /= t.length, n /= t.length, t.map(([s, i]) => [s - e, i - n]);
}
function Tu(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % cn / cn : 0, reversed: n < 0 };
  const i = Mr(vr(t, cn)), o = Mr(vr(e, cn)), r = cn;
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
function xu(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Eu(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Au(t, e, n) {
  const s = t.closed && e.closed, i = Tu(t, e, n.shapeIndex), o = Math.max(
    wu,
    Math.min(ku, Math.ceil(Math.max(t.length, e.length) / vu))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= o; u++) a(u / o);
  for (const u of kr(t)) a(u);
  for (const u of kr(e)) a(Eu(u, i, s));
  let l = [...r].sort((u, d) => u - d);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...Di(t, u)), h.push(...Di(e, xu(u, i, s)));
  return $u({ from: c, to: h, closed: s });
}
function $u(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = Mu;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(Sr(t.from, r, a, h), Sr(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const i = [], o = [];
  for (let r = 0; r < e; r++)
    n[r] && (i.push(t.from[r * 2], t.from[r * 2 + 1]), o.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: i, to: o, closed: t.closed };
}
function Sr(t, e, n, s) {
  const i = t[e * 2], o = t[e * 2 + 1], r = t[n * 2] - i, a = t[n * 2 + 1] - o, l = t[s * 2] - i, c = t[s * 2 + 1] - o, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function Pu(t, e, n) {
  const s = n.shapeIndex;
  if (oe && oe.from === t && oe.to === e && oe.shapeIndex === s) return oe.plan;
  const o = yn.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (o)
    return oe = { from: t, to: e, shapeIndex: s, plan: o }, o;
  const r = Qe(t).subpaths.filter((f) => f.length > 0).length === Qe(e).subpaths.filter((f) => f.length > 0).length, a = wr(t, !r), l = wr(e, !r), c = {
    pairs: a.map((f, g) => Au(f, l[g], n))
  };
  ss >= Su && (yn.clear(), ss = 0);
  const h = String(s ?? "auto"), u = yn.get(h) ?? /* @__PURE__ */ new Map();
  yn.set(h, u);
  const d = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, d), d.set(e, c), ss++, oe = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function Ou(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const i = Math.max(0, Math.min(1, n));
  if (i === 0) return t;
  if (i === 1) return e;
  const o = Pu(t, e, s);
  if (o.pairs.length === 0) return i < 0.5 ? t : e;
  let r = "";
  for (const a of o.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = br(a.from[l] + (a.to[l] - a.from[l]) * i), h = br(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * i);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function uw() {
  yn.clear(), ss = 0, oe = void 0;
}
function Ln(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const We = Math.PI / 180, Iu = 0.9995;
function Mo() {
  return [0, 0, 0, 1];
}
function Dt(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return Mo();
  const s = e * We / 2, i = Math.sin(s) / n;
  return [t[0] * i, t[1] * i, t[2] * i, Math.cos(s)];
}
function _u(t, e, n) {
  return ji(ji(Dt([0, 1, 0], e), Dt([1, 0, 0], t)), Dt([0, 0, 1], n));
}
function Hu(t) {
  const [e, n, s, i] = he(t), o = 2 * (e * s + n * i), r = 2 * (e * n + s * i), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * i), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * i), u = 1 - 2 * (e * e + n * n), d = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [d / We, Math.atan2(o, u) / We, Math.atan2(r, a) / We] : [d / We, Math.atan2(-h, c) / We, 0];
}
function ji(t, e) {
  const [n, s, i, o] = t, [r, a, l, c] = e;
  return [
    o * r + n * c + s * l - i * a,
    o * a - n * l + s * c + i * r,
    o * l + n * a - s * r + i * c,
    o * c - n * r - s * a - i * l
  ];
}
function Fl(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Nl(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function he(t) {
  const e = Nl(t);
  return e === 0 ? Mo() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function Cu(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function Dl(t, e, n) {
  const s = he(t);
  let i = he(e), o = Fl(s, i);
  if (o < 0 && (i = [-i[0], -i[1], -i[2], -i[3]], o = -o), o > Iu)
    return he([
      s[0] + (i[0] - s[0]) * n,
      s[1] + (i[1] - s[1]) * n,
      s[2] + (i[2] - s[2]) * n,
      s[3] + (i[3] - s[3]) * n
    ]);
  const r = Math.acos(o), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return he([
    s[0] * l + i[0] * c,
    s[1] * l + i[1] * c,
    s[2] * l + i[2] * c,
    s[3] * l + i[3] * c
  ]);
}
function Ru(t, e) {
  const [n, s, i, o] = he(t), r = 2 * (s * e[2] - i * e[1]), a = 2 * (i * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + o * r + (s * l - i * a), e[1] + o * a + (i * r - n * l), e[2] + o * l + (n * a - s * r)];
}
const dw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: Cu,
  dot: Fl,
  fromAxisAngle: Dt,
  fromEuler: _u,
  identity: Mo,
  length: Nl,
  multiply: ji,
  normalize: he,
  rotateVec3: Ru,
  slerp: Dl,
  toEuler: Hu
}, Symbol.toStringTag, { value: "Module" })), ee = (t, e, n) => t + (e - t) * n, jl = 512, ti = /* @__PURE__ */ new Map(), ei = /* @__PURE__ */ new Map();
function Tr(t) {
  const e = ti.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return ti.size < jl && ti.set(t, s), s;
}
const xr = (t) => t.charCodeAt(0) === 35, Er = (t) => t.startsWith("rgb"), Ar = (t) => t.startsWith("rgba"), Lu = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, ni = (t) => Math.round(t).toString(16).padStart(2, "0");
function Fu(t, e, n) {
  return `#${ni(t)}${ni(e)}${ni(n)}`;
}
function $r(t) {
  const e = ei.get(t);
  if (e) return e;
  const n = t.match(Lu);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), i = parseInt(n[2], 10), o = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, i, o, parseFloat(n[4])] : [s, i, o];
  return ei.size < jl && ei.set(t, r), r;
}
const Nu = (t, e, n) => {
  if (xr(t) && xr(e)) {
    const [s, i, o] = Tr(t), [r, a, l] = Tr(e), c = ee(s, r, n), h = ee(i, a, n), u = ee(o, l, n);
    return Fu(c, h, u);
  }
  if ((Er(t) || Ar(t)) && (Er(e) || Ar(e))) {
    const s = $r(t), i = $r(e), o = Math.round(ee(s[0], i[0], n)), r = Math.round(ee(s[1], i[1], n)), a = Math.round(ee(s[2], i[2], n));
    if (s.length === 4 || i.length === 4) {
      const l = s[3] ?? 1, c = i[3] ?? 1, h = ee(l, c, n);
      return `rgba(${o}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${o}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, Du = (t, e, n) => {
  const s = Math.min(t.length, e.length), i = [];
  for (let o = 0; o < s; o++)
    i.push(ee(t[o], e[o], n));
  return i;
}, ju = (t, e, n) => Dl(t, e, n), Pr = (t, e, n) => n < 1 ? t : e, Wu = (t, e, n) => Ou(t, e, n);
function ps(t, e) {
  return e === "slerp" ? ju : typeof t == "number" ? ee : Array.isArray(t) ? Du : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? Nu : Ln(t) ? Wu : Pr : Pr;
}
const Wl = 1e3 / 60;
function Bl(t, e = {}) {
  if (!Oe(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new Rs(t.spring);
  return Kl(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function ql(t, e = {}) {
  if (!Pe(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return Kl(
    t,
    (s) => Fi(n, s),
    Rn(n),
    n.from,
    Cn(n),
    e
  );
}
function Kl(t, e, n, s, i, o) {
  const r = o.intervalMs ?? Wl, a = o.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: i, easing: "linear" }) : h.value = i, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? qu(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function Yl(t, e, n, s = {}) {
  const i = s.intervalMs ?? Wl, o = typeof n == "function" ? n : Pt(n), r = ps(t.value, s.interpolation), a = e.time - t.time;
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
function fw(t, e) {
  return Oe(t) ? Bl(t, e) : Pe(t) ? ql(t, e) : t;
}
function Bu(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((o) => ds(o.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], i = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let o = 1; o < n.length; o++) {
    const r = n[o];
    ds(r.easing) ? s.push(...Yl(n[o - 1], r, r.easing, i)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function pw(t, e) {
  return t.filter(Kh).map((n) => Bu(n, e)).concat(
    t.filter(Oe).map((n) => Bl(n, e)),
    t.filter(Pe).map((n) => ql(n, e))
  );
}
function qu(t, e) {
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
function Wi(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function we(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function tn(t, e, n, s) {
  const i = n ?? 0;
  return !s || e <= 1 ? i : i + vo(t, e, s);
}
class si {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = we(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - tn(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const o = tn(i, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - o);
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
    const n = e[e.length - 1].time, s = this.track.stagger ? Cs(this.targets.length, this.track.stagger) : 0;
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
    const o = i.time - s.time, r = (e - s.time) / o, l = Pt(i.easing)(r);
    return ps(s.value, this.track.interpolation)(s.value, i.value, l);
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
class Ku {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = we(e), this.sampler = new Rs(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - tn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = tn(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: this.sampler.valueAt(e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Cs(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class Yu {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = we(e), this.duration = Rn(e.inertia);
  }
  getValueAtTime(e) {
    return Fi(this.track.inertia, e - tn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let i = 0; i < n; i++) {
      const o = tn(i, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[i], value: Fi(this.track.inertia, e - o), start: o });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Cs(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function zl(t, e) {
  const n = { ...bu(t.pathData, e) };
  if (t.matrix) {
    const [s, i, o, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + o * h + a, n.y = i * c + r * h + l;
    const u = n.angle * Math.PI / 180, d = Math.cos(u), f = Math.sin(u);
    n.angle = Math.atan2(i * d + r * f, s * d + o * f) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function gw(t, e, n, s) {
  const i = e + (n - e) * s;
  return zl(t, i);
}
const ii = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, zu = 20;
function Xu(t) {
  const e = ii[t ?? "upperCase"] ?? t ?? ii.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(ii.upperCase);
}
function Uu(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Vu(t, e, n = 0) {
  const s = t.from ?? "", i = t.to, o = Math.max(0, Math.min(1, e));
  if (o <= 0) return s;
  if (o >= 1) return i;
  const r = Array.from(s), a = Array.from(i), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const S = Math.round(o * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - S)).join("") + a.slice(Math.max(0, a.length - S)).join("") : a.slice(0, S).join("") + r.slice(S).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (o - c) / (1 - c)), u = Math.floor(h * a.length), d = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * o), f = Xu(t.chars), g = t.refreshRate ?? zu, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let b = "";
  for (let S = 0; S < d; S++) {
    const w = l ? S >= d - u : S < u, y = l ? a[a.length - (d - S)] : a[S];
    w && y !== void 0 || y === " " || y === `
` ? b += y : b += f[Uu(m, S, p) % f.length];
  }
  return b;
}
class zt {
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
    if (e = Yh(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
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
      a.set("text", Vu(l.textConfig, o, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof o == "number") {
      const h = zl(c.motionPathConfig, o);
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
        for (const s of we(n)) {
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
    if (this._tracks.push(e), this._sharedWrites = null, Pe(e)) {
      this._trackPlayers.set(e.id, new Yu(e));
      return;
    }
    if (Oe(e)) {
      this._trackPlayers.set(e.id, new Ku(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (ko(e))
      this._trackPlayers.set(e.id, new si(e)), this._textTracks.set(e.id, e);
    else if (Ol(e)) {
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
      this._trackPlayers.set(e.id, new si(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new si(e));
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
    if (Oe(s) || Pe(s))
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
          const a = we(r).filter((u) => we(s).includes(u));
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
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !we(e).includes(n.target)) return !1;
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
      formatVersion: Pl(this._tracks),
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
const Gu = 100;
function Xl(t, e, n, s) {
  const i = [], o = [], { duration: r, alternate: a } = s, l = (f, g, p, m) => {
    o.push([f, g]);
    const b = [];
    t.forEach((S, w) => {
      (p === "forward" ? (m ? S >= f : S > f) && S <= g : (m ? S <= f : S < f) && S >= g) && b.push(w);
    }), b.sort((S, w) => (p === "forward" ? t[S] - t[w] : t[w] - t[S]) || S - w);
    for (const S of b) i.push({ kind: "event", index: S, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const d = Math.min(Gu, Math.max(0, n.iteration - e.iteration));
  for (let f = 0; f < d; f++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), i.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return d > 0 && s.holding && !a ? { crossings: i, passes: o } : (l(c, n.time, h, u), { crossings: i, passes: o });
}
function Ju(t) {
  return Pe(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: Ul(t.inertia),
    ...Gt(t)
  } : Oe(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...Gt(t)
  } : ko(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(oi),
    ...Gt(t)
  } : Ol(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(oi),
    ...Gt(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(oi),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Gt(t)
  };
}
function Ul(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function oi(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function Gt(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function Zu(t) {
  if (Pe(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: Ul(e.inertia),
      ...Gt(e)
    };
  }
  if (Oe(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...Gt(e)
    };
  }
  if (ko(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...Gt(e)
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
      ...Gt(e)
    };
  }
  return Wi({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...Gt(t)
  });
}
function Qu(t) {
  const e = t._config.markers;
  return {
    formatVersion: Pl(t.tracks),
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
    tracks: t.tracks.map(Ju),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function xn(t) {
  const e = t.formatVersion ?? 1;
  if (e > pr)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${pr}. Update tinyfly to play it.`
    );
  return new zt({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(Zu),
    captions: t.captions
  });
}
function mw(t) {
  return JSON.stringify(Qu(t));
}
function yw(t) {
  const e = JSON.parse(t);
  return xn(e);
}
function Xt(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function rn(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function Vl(t, e, n) {
  return e + t.next() * (n - e);
}
function td(t, e, n, s) {
  if (s <= 0) return Vl(t, e, n);
  const i = Math.floor((n - e) / s), o = Math.round(t.next() * i);
  return e + o * s;
}
function bw(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const Gl = /^([+\-*/])=\s*(-?[\d.]+)$/, Jl = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function ww(t) {
  return typeof t != "string" ? !1 : Gl.test(t.trim()) || Jl.test(t.trim());
}
function Zl(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = Gl.exec(n);
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
  const i = Jl.exec(n);
  if (i) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const o = Number.parseFloat(i[1]), r = Number.parseFloat(i[2]), a = i[3] !== void 0 ? Number.parseFloat(i[3]) : void 0;
    return a !== void 0 ? td(e.random, o, r, a) : Vl(e.random, o, r);
  }
  return t;
}
function ed(t, e = 0, n) {
  const s = [];
  let i = e;
  for (const o of t) {
    const r = Zl(o, { base: i, random: n });
    s.push(r), typeof r == "number" && (i = r);
  }
  return s;
}
class kw {
  random;
  constructor(e) {
    this.random = rn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return Zl(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return ed(e, n, this.random);
  }
}
const nd = 600;
function sd(t) {
  if (Array.isArray(t)) {
    const [d, f, g, p] = t;
    return { fn: Or(d, f, g, p), bezier: [d, f, g, p] };
  }
  const { segments: e } = Qe(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, i = e[e.length - 1], o = i.endX - n, r = i.endY - s;
  if (o === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (d) => (d - n) / o, l = (d) => (d - s) / r;
  if (e.length === 1 && i.type === "C") {
    const [d, f, g, p] = i.points, m = [a(d), l(f), a(g), l(p)];
    return { fn: Or(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(nd / e.length));
  for (const d of e)
    for (let f = c.length === 0 ? 0 : 1; f <= u; f++) {
      const [g, p] = rd(d, f / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: ad(c, h) };
}
function id(t = {}) {
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
function od(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (i) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * i) : (1 - i) ** 2;
  return (i) => i <= 0 || i >= 1 ? 0 : Math.sin(i * e * Math.PI * 2) * s(i);
}
function rd(t, e) {
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
function ad(t, e) {
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
function Or(t, e, n, s) {
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
const ld = 350, cd = 300, hd = 550;
function vw(t, e = {}) {
  const n = e.lead ?? ld, s = e.gap ?? cd, i = e.tail ?? hd, o = [];
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
function Mw(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function Sw(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const Ql = (t) => 6e4 / t.bpm;
function So(t, e) {
  return t.offset + e * Ql(t);
}
function To(t, e) {
  return (e - t.offset) / Ql(t);
}
function Tw(t, e) {
  return So(t, Math.round(To(t, e)));
}
function xw(t, e) {
  return So(t, Math.ceil(To(t, e) - 1e-9));
}
function Ew(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), i = [];
  if (!(t.bpm > 0) || n < e) return i;
  for (let o = Math.ceil(To(t, e) - 1e-9); ; o++) {
    const r = So(t, o);
    if (r > n + 1e-9) break;
    i.push({ time: r, bar: (o % s + s) % s === 0, n: o });
  }
  return i;
}
const Ce = 100;
function Aw(t, e, n = {}) {
  const s = n.minBpm ?? 70, i = n.maxBpm ?? 180, o = Math.max(1, Math.round(e / Ce)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / o);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let M = 0; M < a; M++) {
    let P = 0;
    for (let k = M * o; k < (M + 1) * o; k++) P += t[k] * t[k];
    l[M] = Math.log(1e-6 + P / o);
  }
  const c = new Float64Array(a);
  for (let M = 1; M < a; M++) c[M] = Math.max(0, l[M] - l[M - 1]);
  const h = c.reduce((M, P) => M + P, 0) / a;
  for (let M = 0; M < a; M++) c[M] = Math.max(0, c[M] - h);
  const u = Math.max(1, Math.floor(60 * Ce / i)), d = Math.min(a - 1, Math.ceil(60 * Ce / s)), f = (M) => {
    let P = 0;
    for (let k = M; k < a; k++) P += c[k] * c[k - M];
    return P / (a - M);
  };
  let g = 0;
  for (let M = 0; M < a; M++) g += c[M] * c[M];
  g /= a;
  let p = u, m = -1 / 0;
  for (let M = u; M <= d; M++) {
    const P = 60 * Ce / M, k = Math.exp(-0.5 * (Math.log2(P / 120) / 0.9) ** 2), A = f(M) * k;
    A > m && (m = A, p = M);
  }
  const b = (M) => {
    const P = Math.floor(M);
    return P < 0 || P + 1 >= a ? 0 : c[P] + (c[P + 1] - c[P]) * (M - P);
  }, S = (M, P) => {
    let k = 0;
    for (let A = P; A < a; A += M) k += b(A);
    return k;
  };
  let w = p, y = 0, v = -1 / 0;
  for (let M = p - 0.6; M <= p + 0.6 + 1e-9; M += 0.02) {
    if (M < 1) continue;
    const P = Math.max(1, Math.round(M * 4));
    for (let k = 0; k < P; k++) {
      const A = k / P * M, H = S(M, A);
      H > v && (v = H, y = A, w = M);
    }
  }
  const E = 60 * Ce / w, T = g > 0 ? Math.max(0, Math.min(1, f(p) / g)) : 0, x = (y + 0.5) * 1e3 / Ce;
  return { bpm: Math.round(E * 100) / 100, offset: Math.round(x % (6e4 / E)), confidence: T };
}
const ud = 600, dd = 250, Ir = 1;
function $w(t, e) {
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
      const d = Math.max(Ir, u.duration ?? ud);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + d, l, u.easing ?? (d > Ir ? "ease-in-out" : void 0));
    } else {
      const { follow: d } = u, f = d.lag ?? dd, g = new zt({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: d.x }] }), p = (S) => g.getStateAtTime(S).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...d.x.map((S) => S.time).filter((S) => S > u.at && S < u.until), u.until];
      a(u.at, l);
      const b = (S) => ({
        focusX: p(S) + (d.lead ?? 0),
        focusY: d.y ?? l.focusY,
        scale: d.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const S of m) {
        const w = d.x.find((y) => y.time === S)?.easing;
        a(S + f, b(S), S === u.at ? "ease-in-out" : w);
      }
      l = b(u.until);
    }
  for (const u of c.filter((d) => "shake" in d)) {
    const d = u.shake.strength ?? 12, f = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = rn(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) o(b, u.at, 0);
    for (let b = u.at + g; b < u.at + u.duration; b += g) {
      const S = 1 - (b - u.at) / u.duration;
      o("shakeX", b, m() * d * S), o("shakeY", b, m() * d * S), o("shakeRotate", b, m() * f * S);
    }
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) o(b, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(i).map(([u, d]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: d }));
}
function fd(t, e) {
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
function gs(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let i, o = 1 / 0;
  for (const r of e) {
    const a = fd(t, r);
    a < o && (o = a, i = r);
  }
  return i !== void 0 && o <= Math.max(2, Math.floor(t.length / 3)) ? i : void 0;
}
function rt(t, e, n, s) {
  const i = typeof e == "string" ? s ?? gs(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${i ? `: did you mean "${i}"?` : "."} Known: ${n.join(", ")}`;
}
function pd(t, e) {
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
const Ut = (t) => Math.round(t * 1e3) / 1e3;
function gd(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, i = t.length;
  let o = `M${Ut(t[0].x)} ${Ut(t[0].y)}`;
  if (i === 1) return o;
  const r = (l) => s ? t[(l % i + i) % i] : t[Math.max(0, Math.min(i - 1, l))], a = s ? i : i - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), d = r(l + 2);
    if (n === 0) {
      o += ` L${Ut(u.x)} ${Ut(u.y)}`;
      continue;
    }
    const f = n / 6, g = h.x + (u.x - c.x) * f, p = h.y + (u.y - c.y) * f, m = u.x - (d.x - h.x) * f, b = u.y - (d.y - h.y) * f;
    o += ` C${Ut(g)} ${Ut(p)} ${Ut(m)} ${Ut(b)} ${Ut(u.x)} ${Ut(u.y)}`;
  }
  return s ? `${o} Z` : o;
}
const St = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function md(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function xo(t) {
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
      const n = md(e.points);
      if (n.length === 0) return null;
      const s = n.map((i, o) => `${o === 0 ? "M" : "L"}${i.x} ${i.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function Pw(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), i = Math.max(0, n.length), o = n.since !== void 0 ? Math.max(e - i, n.since) : e - i;
  if (o >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = o + (e - o) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: i > 0 ? (e - c) / i : 0 });
  }
  return a;
}
const yd = 2.5;
function bd(t) {
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
    const g = u * c[0] + d * c[1], p = Math.min(yd, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - d * m, y: r.y + u * m }), n.push({ x: r.x + d * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function wd(t) {
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
function is(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function an(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function Ue(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function ue(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function ms(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Ns(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function Eo(t, e) {
  return Ns(an(t, e));
}
function Ie(t) {
  const e = Ns(t);
  return e === 0 ? [0, 0, 0] : Ue(t, 1 / e);
}
function tc(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const Ow = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: is,
  cross: ms,
  distance: Eo,
  dot: ue,
  length: Ns,
  lerp: tc,
  normalize: Ie,
  scale: Ue,
  subtract: an
}, Symbol.toStringTag, { value: "Module" })), kd = Math.PI / 180;
function Ds() {
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
function ke(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function Ee(t) {
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
function Ao(t, e, n) {
  const s = Yt(e);
  for (let i = 0; i < 3; i++)
    s[i] *= n[0], s[4 + i] *= n[1], s[8 + i] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function vd(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function $o(t) {
  const [e, n, s, i, o, r, a, l, c, h, u, d, f, g, p, m] = t, b = e * r - n * o, S = e * a - s * o, w = e * l - i * o, y = n * a - s * r, v = n * l - i * r, E = s * l - i * a, T = c * g - h * f, x = c * p - u * f, M = c * m - d * f, P = h * p - u * g, k = h * m - d * g, A = u * m - d * p, H = b * A - S * k + w * P + y * M - v * x + E * T;
  if (Math.abs(H) < 1e-12) return null;
  const O = 1 / H;
  return [
    (r * A - a * k + l * P) * O,
    (s * k - n * A - i * P) * O,
    (g * E - p * v + m * y) * O,
    (u * v - h * E - d * y) * O,
    (a * M - o * A - l * x) * O,
    (e * A - s * M + i * x) * O,
    (p * w - f * E - m * S) * O,
    (c * E - u * w + d * S) * O,
    (o * k - r * M + l * T) * O,
    (n * M - e * k - i * T) * O,
    (f * v - g * w + m * b) * O,
    (h * w - c * v - d * b) * O,
    (r * x - o * P - a * T) * O,
    (e * P - n * x + s * T) * O,
    (g * S - f * y - p * b) * O,
    (c * y - h * S + u * b) * O
  ];
}
function Md(t, e, n, s) {
  const i = 1 / Math.tan(t * kd / 2), o = 1 / (n - s);
  return [i / e, 0, 0, 0, 0, i, 0, 0, 0, 0, (s + n) * o, -1, 0, 0, 2 * s * n * o, 0];
}
function Sd(t, e, n, s, i, o) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (o - i);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(o + i) * l, 1];
}
function Td(t, e, n = [0, 1, 0]) {
  const s = Ie(an(t, e)), i = Ie(ms(n, s)), o = ms(s, i);
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
    -ue(i, t),
    -ue(o, t),
    -ue(s, t),
    1
  ];
}
function Ct(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], i = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], o = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return o === 1 || o === 0 ? [n, s, i] : [n / o, s / o, i / o];
}
const Iw = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: Ao,
  fromQuat: Yt,
  identity: Ds,
  invert: $o,
  lookAt: Td,
  multiply: bt,
  orthographic: Sd,
  perspective: Md,
  scaling: Ee,
  transformPoint: Ct,
  translation: ke,
  transpose: vd
}, Symbol.toStringTag, { value: "Module" })), Wn = {
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
}, _r = {
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
function xd(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Pt({ type: "bounce", mode: "in" });
Pt({ type: "bounce", mode: "in-out" });
function ys(t) {
  const e = ec.get(t.trim().toLowerCase());
  if (e) return e;
  const n = xd(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Pt(r) };
  }
  const i = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (i) {
    const [, o, r, a] = i, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (o === "back" && l.length === 0 && n in Wn)
      return { easing: { type: "cubic-bezier", points: Wn[n] } };
    const h = o === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : o === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Pt(h) };
  }
  return n in _r ? { easing: _r[n] } : n in Wn ? { easing: { type: "cubic-bezier", points: Wn[n] } } : { easing: "ease-out" };
}
const ec = /* @__PURE__ */ new Map();
function Po(t, e) {
  return ec.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function Bi(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const nc = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function sc(t) {
  return typeof t == "string" && nc.test(t);
}
function Ed(t = 1) {
  let e = Bi(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), i = (l, c, h, u, d) => c === l ? h : h + (d - l) / (c - l) * (u - h), o = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return Hr(l, c, 1 / 0);
    if ("values" in l) return Hr(l.values, c, l.radius ?? 1 / 0);
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
          u[d] = ps(l[d])(l[d], c[d], h);
        return u;
      }
      return ps(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, m = (b) => p[(Math.round(b) % p.length + p.length) % p.length];
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
      const m = p.length, S = vo(f, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), w = c !== void 0 ? c : (h ?? 1) * _l(m, u), y = d && w > 0 ? d(S / w) * w : S;
      return l + y;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => Ad(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = Bi(l);
    },
    resolveRandomString: (l) => {
      const c = nc.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, d] = c.split(",").map((f) => Number.parseFloat(f));
      return r(h, u, Number.isFinite(d) ? d : void 0);
    }
  };
}
function Hr(t, e, n) {
  let s = e, i = 1 / 0;
  for (const o of t) {
    const r = Math.abs(o - e);
    r < i && (i = r, s = o);
  }
  return i <= n ? s : e;
}
function Ad(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const o = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return o.length >= 4 ? [o[0], o[1], o[2], Math.round(o[3] / 255 * 1e3) / 1e3] : [o[0], o[1], o[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((i) => Number.parseFloat(i));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const $d = /^([+-])=\s*(-?[\d.]+)$/, Pd = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function hn(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const i = t.trim();
  if (i === "") return e.cursor;
  const o = $d.exec(i);
  if (o) {
    const c = s(o[2]);
    return e.cursor + (o[1] === "-" ? -c : c);
  }
  const r = Pd.exec(i);
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
function Od(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function Id(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, i = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), o = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (i - 1) } : typeof r == "number" ? o(Math.max(0, Math.min(t - 1, r))) : r === "end" ? o(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (i - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = o(g), b = Math.abs(p - a.x), S = Math.abs(m - a.y);
    return e.axis === "x" ? b : e.axis === "y" ? S : Math.hypot(b, S);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, d = e.ease ? ys(e.ease) : void 0, f = d ? d.fn ?? Pt(d.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (f ? f(p) : p) * u;
  });
}
const Oo = /* @__PURE__ */ new Set([
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
]), _d = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function os(t) {
  const e = {}, n = {};
  for (const [s, i] of Object.entries(t))
    Oo.has(s) ? e[s] = i : n[_d[s] ?? s] = i;
  return { config: e, properties: n };
}
function bs(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function qi(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : Od(t) ? { offsets: Id(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const Hd = {
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
function ic(t) {
  return Hd[t];
}
function Cd(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = gd(e.path, { curviness: e.curviness });
  else if (Ln(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function Rd(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function oc(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function Ld(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = oc(e);
  if (typeof s != "string" || !Ln(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Fd(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, Cr(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return Cr(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const i = s(n[0]), o = s(n[1]);
  return i <= o ? [i, o] : [o, i];
}
function Nd(t, e) {
  const [n, s] = Fd(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function Dd(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...Nd(n, e) };
}
function jd(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function Cr(t, e) {
  return Math.max(0, Math.min(e, t));
}
function Wd(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function Bd(t, e, n) {
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
      seed: i.seed ?? Wd(`${e}|${i.text}`)
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
function Io(t) {
  return Math.max(0.1, t / 25);
}
function qd(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? Io(n.resistance) : void 0), i = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? i.end = [n.end(fs(i))] : n.end !== void 0 && (i.end = Array.isArray(n.end) ? [...n.end] : n.end), i;
}
function Kd(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in Zs))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(Zs).join(", ")}`
    );
  return {
    ...e.preset ? Zs[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function Yd(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class Ye {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Bi(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new zt({
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
    return this.build(e, void 0, un(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: i, properties: o } = os(un(n)), { motionPath: r, text: a, scrambleText: l, ...c } = o, h = this.targetsOf(e)[0], u = { ...i };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = Rd(r));
    const d = {}, f = String(this.resolveStart(h, "text"));
    return a !== void 0 && (d.text = ri(a), u.text = typeof a == "object" ? { ...a, value: f } : f), l !== void 0 && (d.text = ri(l), u.scrambleText = typeof l == "object" ? { ...l, text: f } : f), this.build(e, { ...c, ...d }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, i) {
    const { properties: o } = os(un(n));
    return this.build(e, o, un(s), i);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...un(n), duration: 0 }, s);
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
    const n = Math.max(0, hn(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return hn(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, hn(n, this.context())), this;
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
    const s = hn(n, this.context());
    for (const o of e.timeline.tracks) {
      if (!("keyframes" in o)) continue;
      const r = Wi({
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
    const { config: o, properties: r } = os(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, d = this.targetsOf(e), f = hn(i, this.context()), g = bs(o.delay, 0), p = bs(o.duration, 500), m = qi(o.stagger, {
      count: d.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(d) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), b = this.easingFor(o.ease), S = [], w = o.spring;
    let y = 0, v = !1;
    for (const [k, A] of Object.entries(u)) {
      const H = A;
      let O = n?.[k] !== void 0 ? n[k] : this.resolveStart(d[0], k);
      if (typeof O != typeof H && (this.warn(
        `no usable start value for "${k}" on "${d[0]}" — it will snap to ${String(H)}. Use fromTo() to animate it.`
      ), O = H), w !== void 0 && (typeof O != "number" || typeof H != "number") && this.warn(`spring works on numbers, so "${k}" on "${d[0]}" eases instead`), w !== void 0 && typeof O == "number" && typeof H == "number") {
        const F = {
          ...Kd(w),
          from: O,
          to: H,
          velocity: Yd(w, k) ?? this.options.startVelocity?.(d[0], k) ?? 0
        }, W = this.nextTrackId(`${d[0]}-${k}-spring`), j = {
          id: W,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: k,
          kind: "spring",
          spring: F,
          delay: f + g
        };
        this.timeline.addTrack(j), S.push(W), y = Math.max(y, zh(F));
        for (const I of d) this.lastValues.set(`${I}|${k}`, H);
        continue;
      }
      v = !0;
      const _ = this.keyframesFor(O, H, p, b, o.ease), D = this.nextTrackId(`${d[0]}-${k}`);
      this.timeline.addTrack(
        Wi({
          id: D,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: k,
          delay: f + g,
          keyframes: _,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...k === "quaternion" && { interpolation: "slerp" }
        })
      ), S.push(D);
      for (const F of d) this.lastValues.set(`${F}|${k}`, H);
    }
    const E = Bd({ text: l, scrambleText: c }, d[0], p);
    if (E) {
      const k = n?.text ?? n?.scrambleText, A = k !== void 0 ? ri(k) : this.resolveStart(d[0], "text"), H = this.nextTrackId(`${d[0]}-text`), O = {
        id: H,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof A == "string" ? A : String(A ?? ""), ...E },
        delay: f + g,
        keyframes: this.keyframesFor(0, 1, p, b, o.ease)
      };
      this.timeline.addTrack(O), S.push(H);
      for (const _ of d) this.lastValues.set(`${_}|text`, E.to);
    }
    if (a !== void 0) {
      const { config: k, start: A, end: H } = Cd(a), O = this.nextTrackId(`${d[0]}-motionPath`), _ = {
        id: O,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: k,
        delay: f + g,
        keyframes: this.keyframesFor(A, H, p, b, o.ease)
      };
      this.timeline.addTrack(_), S.push(O);
    }
    if (h !== void 0)
      for (const [k, A] of Object.entries(h)) {
        const H = this.resolveStart(d[0], k);
        if (typeof H != "number") {
          this.warn(`inertia on "${k}" needs a numeric start value; skipped`);
          continue;
        }
        const O = qd(H, A), _ = this.nextTrackId(`${d[0]}-${k}-inertia`), D = {
          id: _,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: k,
          kind: "inertia",
          inertia: O,
          delay: f + g
        };
        this.timeline.addTrack(D), S.push(_), y = Math.max(y, Rn(O));
        for (const F of d) this.lastValues.set(`${F}|${k}`, Cn(O));
      }
    const M = ((h !== void 0 || w !== void 0) && !v && !E && a === void 0 ? y : Math.max(p, y)) + (m && d.length > 1 ? Cs(d.length, m) : 0), P = f + g + M;
    return this.previousStart = f + g, this.previousEnd = P, this.cursor = Math.max(this.cursor, P), {
      trackIds: S,
      start: f + g,
      end: P,
      kill: () => {
        for (const k of S) this.timeline.removeTrack(k);
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
    const a = typeof o == "string" ? ys(o) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && ds(i)) {
      const c = a?.fn ?? Pt(i);
      return [r, ...Yl(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    const r = ic(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return ys(e).easing;
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
function ri(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function zd(t) {
  return new Ye(t);
}
function un(t) {
  return jd(Ld(t));
}
function Xd(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${Yt(he(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const Ud = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Vd = "#ffffff", Gd = "rgba(0, 0, 0, 0.5)";
function Jd(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Vd})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, i = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${i}px ${t.shadowColor ?? Gd})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function Zd(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Qd(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const Rr = /* @__PURE__ */ new Set([
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
]), tf = /* @__PURE__ */ new Set([
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
]), ef = [
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
], nf = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), sf = /* @__PURE__ */ new Set(["originX", "originY"]), of = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), rf = /* @__PURE__ */ new Set(["drawOn"]), af = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Lr = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, lf = "http://www.w3.org/2000/svg";
class Ae {
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
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !rf.has(g)) {
        if (tf.has(g))
          (s ??= {})[g] = p;
        else if (nf.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (sf.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (of.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (Ud.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            Zd(e, p);
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
      for (const g of ef) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && d.push(m);
      }
    if (d.length > 0 && (e.style.transform = d.join(" "), Qd(e)), i && (i.childPerspective !== void 0 && (e.style.perspective = `${i.childPerspective}px`), (i.perspectiveOriginX !== void 0 || i.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${i.perspectiveOriginX ?? 50}% ${i.perspectiveOriginY ?? 50}%`)), o) {
      const g = o.originX ?? 50, p = o.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, b = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${b}%)`;
    }
    if (a) {
      const g = Jd(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return Xd(n);
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
    if (e.namespaceURI === lf && n in Lr) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[Lr[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? i = "color" : i = af[n] ?? n;
    let r;
    typeof s == "number" ? Rr.has(n) || Rr.has(i) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[i] = r;
  }
}
const cf = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class hf {
  adapter = new Ae();
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
  utils = Ed();
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
    this.scheduler = e.scheduler ?? cf, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      ai(s) && this.currentCollector?.touch(s, i), n.push(i);
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
    if (ai(e)) return [e];
    if (!uf(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return ai(e) ? this.elementName(e) : this.objectName(e);
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
function ai(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function uf(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function ws(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const Fr = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function df(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function ff(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function pf(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || Fr(t) ? { path: t } : t, { align: s, alignOrigin: i, path: o, ...r } = n, a = (E) => {
    const T = Fr(E) ? E : e.query(E);
    return T || e.warn(`gsap-compat: motionPath could not find "${String(E)}"`), T;
  };
  let l = null, c = "";
  if (Array.isArray(o) || typeof o == "string" && Ln(o))
    c = o;
  else {
    l = a(o);
    const E = l && xo({ tag: l.localName, attributes: df(l) });
    l && !E && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = E ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const d = e.targets[0];
  if (!d) return h;
  const [f, g, p, m, b, S] = ff(u), w = ws(d), [y, v] = i ?? [0.5, 0.5];
  for (const E of e.targets.slice(1)) {
    const T = ws(E);
    if (Math.abs(T.left - w.left) > 0.5 || Math.abs(T.top - w.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [f, g, p, m, b - w.left - y * w.width, S - w.top - v * w.height], h;
}
const rc = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function ac(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function lc(t) {
  if (!t) return null;
  const e = xo({ tag: t.localName, attributes: ac(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function gf(t, e, n) {
  const s = oc(t);
  if (typeof s == "string" && Ln(s)) return s;
  const i = rc(s) ? s : typeof s == "string" ? e(s) : null, o = lc(i);
  return o || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const mf = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function yf(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : rc(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const i = xo({ tag: s.localName, attributes: ac(s) });
    if (!i || !s.parentNode) return s;
    const o = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      mf.has(r.name) || o.setAttribute(r.name, r.value);
    return o.setAttribute("d", i), s.parentNode.replaceChild(o, s), o;
  });
}
const Nr = 0.3;
class bf {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = Dr(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = Dr(), i = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const o = e / i * 1e3, r = n / i * 1e3;
    this.velocityX += (o - this.velocityX) * Nr, this.velocityY += (r - this.velocityY) * Nr;
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
function Dr() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function wf(t, e, n) {
  let s = { delta: 0, line: null }, i = n;
  for (const o of t)
    for (const r of e) {
      const a = Math.abs(r - o);
      a <= i && (i = a, s = { delta: r - o, line: r });
    }
  return s;
}
function kf(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class cc {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new bf({
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
    const i = (this.options.axis ?? "both") === "y" ? this.y : this.x, o = vf(i / s);
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
      ...kf([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], o = wf([s], i, this.snapThreshold());
    s += o.delta, n === "x" ? this.snappedX = o.line : this.snappedY = o.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function vf(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function _w(t) {
  const e = new cc(t);
  return e.start(), e;
}
const Mf = { x: "x", y: "y", "x,y": "both" }, Ki = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function jr(t, e) {
  const n = ws(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function Wr(t) {
  return Array.isArray(t) ? [...t] : t;
}
function Sf(t, e, n, s = {}) {
  const [i] = e.resolveTargets(n), o = i ? e.elementFor(i) : void 0;
  if (!i || !o)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return Tf(t, e, i, o, s);
  const r = Mf[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(i, "x"), m = e.appliedValue(i, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Ki(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Ki(s.bounds) ? s.bounds : void 0) ?? (l ? jr(o, l) : void 0) };
  let u = null;
  const d = () => {
    u?.kill(), u = null;
  }, f = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, b = m.friction ?? (m.resistance !== void 0 ? Io(m.resistance) : 4), S = a(), w = h.bounds ?? {};
    let y, v;
    const E = m.end;
    if (Array.isArray(E)) {
      const x = fs({ from: S.x, velocity: r === "y" ? 0 : p.x, friction: b }), M = fs({ from: S.y, velocity: r === "x" ? 0 : p.y, friction: b });
      let P = E[0];
      for (const k of E)
        Math.hypot(k.x - x, k.y - M) < Math.hypot(P.x - x, P.y - M) && (P = k);
      P && (y = [P.x], v = [P.y]);
    } else typeof E == "number" ? (y = E, v = E) : E && (y = Wr(E.x), v = Wr(E.y));
    const T = {};
    r !== "y" && (T.x = { velocity: p.x, friction: b, min: w.minX, max: w.maxX, end: y }), r !== "x" && (T.y = { velocity: p.y, friction: b, min: w.minY, max: w.maxY, end: v }), u = t.to(o, { inertia: T, onComplete: () => s.onThrowComplete?.() });
  }, g = new cc({
    target: o,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      d(), l && (h.bounds = jr(o, l)), s.onPress?.();
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
function Tf(t, e, n, s, i) {
  const o = typeof i.bounds == "object" && i.bounds !== null && !Ki(i.bounds) ? i.bounds : {}, r = () => {
    const w = e.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(o.maxRotation ?? 1 / 0, Math.max(o.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, d = 0, f = 0, g = [];
  const p = (w) => Math.atan2(w.clientY - u.y, w.clientX - u.x) * 180 / Math.PI, m = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const y = s.getBoundingClientRect();
    u = { x: y.left + y.width / 2, y: y.top + y.height / 2 }, d = p(w), f = r(), g = [{ time: performance.now(), rotation: f }], i.onPress?.();
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    const y = p(w);
    let v = y - d;
    v > 180 && (v -= 360), v < -180 && (v += 360), d = y, f += v;
    let E = a(f);
    i.snap && (E = a(Math.round(E / i.snap) * i.snap)), e.apply(n, { rotate: E });
    const T = performance.now();
    for (g.push({ time: T, rotation: E }); g.length > 2 && T - g[0].time > 100; ) g.shift();
    const x = { x: 0, y: 0 };
    i.onDrag?.(x);
  }, S = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const y = g[0], v = g[g.length - 1], E = y && v ? (v.time - y.time) / 1e3 : 0, T = E > 0 ? (v.rotation - y.rotation) / E : 0;
    if (i.onRelease?.({ x: T, y: 0 }), !i.inertia) return;
    const x = i.inertia === !0 ? {} : i.inertia, M = x.friction ?? (x.resistance !== void 0 ? Io(x.resistance) : 4), P = typeof x.end == "number" || Array.isArray(x.end) ? x.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: T,
          friction: M,
          min: o.minRotation,
          max: o.maxRotation,
          end: Array.isArray(P) ? P.filter((k) => typeof k == "number") : P
        }
      },
      onComplete: () => i.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", b), s.addEventListener("pointerup", S), s.addEventListener("pointercancel", S), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", b), s.removeEventListener("pointerup", S), s.removeEventListener("pointercancel", S);
    }
  };
}
const xf = { opacity: 0, scale: 0.6 };
function Ef(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Br(t) {
  const e = ws(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Yi(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = Ef(r);
    i.set(r, a);
    const l = hc(r);
    a && l !== void 0 && !o.has(l) && o.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: i, ids: o };
}
const li = /* @__PURE__ */ new WeakMap();
function zi(t, e, n, s = {}) {
  const i = s.duration ?? 0.6, o = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? xf : s.enter, c = new Set(n.elements);
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
    const g = Br(f);
    if (!g) continue;
    let p = n.boxes.get(f) ?? null, m;
    const b = hc(f), S = !p && b !== void 0 ? n.ids.get(b) : void 0;
    S && S.element !== f && (p = S.box, m = S.element);
    const [w] = t.resolveTargets(f);
    li.get(f)?.timeline.removeTracks({ target: w });
    const y = d * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(f, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...uc(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: i, ease: o, delay: y }, 0), li.set(f, u), d++;
      continue;
    }
    const v = p.cx - g.cx, E = p.cy - g.cy, T = a ? p.width / g.width : 1, x = a ? p.height / g.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(E) > 0.5 || Math.abs(T - 1) > 1e-3 || Math.abs(x - 1) > 1e-3)) {
      const k = (A, H) => {
        const O = t.appliedValue(w, A);
        return typeof O == "number" && Math.abs(O - H) > 1e-6;
      };
      (k("x", 0) || k("y", 0) || k("scaleX", 1) || k("scaleY", 1)) && u.set(f, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const P = s.fade === !0 && m !== void 0;
    u.fromTo(
      f,
      { x: v, y: E, scaleX: T, scaleY: x, ...P && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...P && { opacity: 1 }, duration: i, ease: o, delay: y },
      0
    ), P && m && Br(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: i, ease: o, delay: y }, 0), li.set(f, u), d++;
  }
  return u;
}
function hc(t) {
  return t.dataset?.flipId;
}
function uc(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function Af(t, e = {}) {
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
    for (const { element: p, html: m, ariaLabel: b } of o)
      p.innerHTML = m, b === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", b);
  }, u = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, d = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of o) {
      const b = (m.textContent ?? "").replace(/\s+/g, " ").trim(), S = $f(m, s.words), w = n.has("chars") ? S.flatMap((E) => Pf(E, s.chars)) : [], y = n.has("lines") ? If(m, S, s.lines) : [];
      if (i) {
        !m.hasAttribute("aria-label") && b && m.setAttribute("aria-label", b);
        for (const E of S) E.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...S);
      else for (const E of S) E.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...y);
      const v = e.mask === "lines" ? y : e.mask === "words" ? S : e.mask === "chars" ? w : [];
      for (const E of v) p.masks.push(_f(E, `${s[e.mask]}-mask`));
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
    const b = () => {
      if (m) return;
      m = !0;
      const w = () => {
        m = !1, f.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((w) => {
        let y = !1;
        for (const v of w) {
          const E = Math.round(v.contentRect.width), T = p.get(v.target);
          p.set(v.target, E), T !== void 0 && T !== E && (y = !0);
        }
        y && b();
      });
      for (const w of t) l.observe(w);
    }
    const S = t[0]?.ownerDocument?.fonts;
    S && S.status !== "loaded" && S.ready.then(() => b());
  }
  return f;
}
function $f(t, e) {
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
function Pf(t, e) {
  const n = t.ownerDocument, s = Of(t.textContent ?? "").map((i) => {
    const o = n.createElement("span");
    return o.className = e, o.style.display = "inline-block", o.textContent = i, o;
  });
  return t.replaceChildren(...s), s;
}
function Of(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function If(t, e, n) {
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
    for (let w = g.parentNode; w && w !== t; w = w.parentNode) m.unshift(w);
    let b = 0;
    for (; b < d.length && b < m.length && d[b].original === m[b]; ) b++;
    d.length = b;
    let S = b === 0 ? l : d[b - 1].clone;
    for (const w of m.slice(b)) {
      const y = w.cloneNode(!1);
      S.appendChild(y), d.push({ original: w, clone: y }), S = y;
    }
    S.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function _f(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const qr = {
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
function Kr(t) {
  const e = t.trim().toLowerCase();
  if (e in qr) return qr[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function dc(t) {
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
  const i = s[0] !== void 0 ? Kr(s[0]) : void 0, o = s[1] !== void 0 ? Kr(s[1]) : void 0;
  return {
    elementFraction: i ?? 0,
    viewportFraction: o ?? 0,
    offsetPx: e
  };
}
function En(t, e, n) {
  const s = dc(n), i = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, o = e * s.viewportFraction;
  return i - o + s.offsetPx;
}
function Hw(t, e, n, s) {
  const i = En(t, e, n), r = En(t, e, s) - i;
  return r <= 0 ? i <= 0 ? 1 : 0 : fc(-i / r);
}
function fc(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function Hf(t, e, n, s) {
  if (n <= 0) return e;
  const i = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * i;
}
function Yr(t, e, n, s, i) {
  const o = (h) => En({ top: t + i(h), bottom: t + i(h) + e, height: e }, n, s), r = o(0), a = o(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(o(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class Cf {
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
function Cw(t) {
  const e = new Cf(t);
  return e.start(), e;
}
class Rf {
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
const Lf = 0.15;
function Ff(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function Nf(t, e, n) {
  const s = Bn(t + e * Lf);
  if (typeof n == "function") return Bn(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : Bn(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let i = n[0];
  for (const o of n)
    Math.abs(o - s) < Math.abs(i - s) && (i = o);
  return Bn(i);
}
function Df(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const i = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * i;
}
class jf {
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
  animate(e, n, s, i = Fs, o) {
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
function Bn(t) {
  return Math.max(0, Math.min(1, t));
}
class Wf {
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
const Bf = 120, Be = [], en = /* @__PURE__ */ new Set();
let ci = !1;
const qf = () => {
  ci || en.size === 0 || (ci = !0, queueMicrotask(() => {
    ci = !1;
    for (const t of en) t.afterRefresh();
  }));
}, pc = () => {
  for (const t of en) t.beforeRefresh();
  for (const t of Be) t.refresh();
  for (const t of en) t.afterRefresh();
};
let qe = { width: 0, height: 0 };
const zr = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === qe.width && e !== qe.height, s = Math.abs(e - qe.height) < qe.height * 0.25, i = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && i || (qe = { width: t, height: e }, pc());
};
class js {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new jf((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new Rf(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new Wf(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), Be.length === 0 && typeof window < "u" && (qe = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", zr, { passive: !0 })), Be.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), Be.splice(Be.indexOf(this), 1), Be.length === 0 && typeof window < "u" && window.removeEventListener("resize", zr), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    pc();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return en.add(e), () => en.delete(e);
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
      if (this.startPx = e + En(n, s, dn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const i = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(i.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, qf();
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
    this.targetProgress = s > 0 ? fc((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(i, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const i = dn(this.options.end) ?? "bottom top", o = typeof i == "string" ? i.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (o) {
      const r = Number.parseFloat(o[1]);
      return this.startPx + (o[2] === "%" ? n * r / 100 : r);
    }
    return s + En(e, n, i);
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
    }, Bf));
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
    const n = Ff(e), s = () => {
      this.snapTimer = null;
      const i = this.endPx - this.startPx, o = this.scrollPosition();
      if (!this.running || i <= 0 || o <= this.startPx || o >= this.endPx) return;
      const r = (o - this.startPx) / i, a = this.startPx + Nf(r, this.releaseVelocity / i, n.snapTo) * i;
      Math.abs(a - o) < 1 || this.snapper.animate(o, a, Df(n, a - o, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), i = this.options.scroller?.getBoundingClientRect?.().left ?? 0, o = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - i - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (f) => a + f * (l - a), h = Yr(r, s.width, o, dn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = dn(this.options.end) ?? "right left", d = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = d ? this.startPx + Number.parseFloat(d[1]) : c(Yr(r, s.width, o, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (o, r) => {
      const a = dn(o) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = dc(a);
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
      this.lastFrameTime = n, this.displayProgress = Hf(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function dn(t) {
  return typeof t == "function" ? t() : t;
}
function Rw(t) {
  const e = new js(t);
  return e.start(), e;
}
const hi = /* @__PURE__ */ new Set(), Kf = 16, Xr = 0.5, Yf = 2;
class Ur {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), hi.add(this), this.stopListening = js.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of hi) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), hi.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) ui(e.element, e.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: o * 1e3, ease: n.ease ?? Fs, elapsed: 0 }, this.requestFrame();
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
    for (const e of this.effects) ui(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? Kf : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), i = this.clamp(this.target + s);
    i === this.target && i === this.current || (e.preventDefault(), this.journey = null, this.target = i, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= Yf || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / o)), Math.abs(this.target - this.current) < Xr && (this.current = this.target);
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
        i.lagged = e === 0 ? s : i.lagged + (s - i.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - i.lagged) < Xr ? i.lagged = s : n = !0, o += s - i.lagged;
      }
      ui(i.element, o === 0 ? i.saved : `0 ${zf(o)}px`), i.shift = o;
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
function ui(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function zf(t) {
  return Math.round(t * 100) / 100;
}
function Xf(t, e) {
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
function _o(t, e, n, s, i = () => {
}) {
  const o = (f) => typeof f == "string" ? t.query(f) ?? void 0 : f, r = o(e.trigger) ?? s;
  if (!r) {
    i(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (f, g) => () => {
    g?.(), n && !a && Xf(n, l[f] ?? "none"), e.once && f === 0 && queueMicrotask(() => h.destroy());
  }, d = e.containerAnimation ? Gf(t, e.containerAnimation, r, i) : void 0;
  return h = new js({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : o(e.pin),
    scroller: o(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : Uf(e.snap, n),
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
function Uf(t, e) {
  const n = (i) => i === "labels" ? (o) => Vf(o, e?.labelProgresses?.() ?? []) : i;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? ys(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Pt(s.easing) : void 0
  };
}
function Vf(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Gf(t, e, n, s) {
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
class gc {
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
class Jf {
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
    const o = new gc(this.host, this.scope);
    o.conditions = n, o.add(() => e.setup(o)), e.context = o;
  }
}
class Zf {
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
const Qf = { opacity: 0, y: -16 }, t0 = { opacity: 0, y: 16 };
async function e0(t, e, n, s) {
  const i = e.collector?.scope ?? e.root, o = i.ownerDocument ?? i, r = () => s.shared ? [...i.querySelectorAll(s.shared)] : [];
  if (s.native && typeof o.startViewTransition == "function")
    return n0(o, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((b) => {
    m(b) || b();
  }), h = r(), u = h.length ? Yi(e, h) : void 0, d = s.from !== void 0 ? Vr(e, s.from, s.shared) : [];
  if (d.length && s.leave !== !1) {
    const m = s.leave ?? Qf;
    await c((b) => t.to(d, { ...m, duration: a, ease: l, onComplete: b }));
  }
  await s.update();
  const f = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? Vr(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? t0;
    f.push(c((b) => t.fromTo(p, m, { ...uc(m), duration: a, ease: l, onComplete: b })));
  }
  if (u) {
    const m = r().filter((b) => !h.includes(b));
    m.length && f.push(
      c(
        (b) => zi(e, n, u, {
          targets: m,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: b
        })
      )
    );
  }
  await Promise.all(f);
}
function Vr(t, e, n) {
  const s = t.resolveTargets(e).map((i) => t.elementFor(i)).filter((i) => !!i);
  return n ? s.flatMap((i) => !i.querySelector(n) && !i.matches(n) ? [i] : [...i.children].filter((o) => !o.matches(n) && !o.querySelector(n))) : s;
}
async function n0(t, e, n) {
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
const s0 = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => Po(t, sd(e))
}, i0 = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => Po(t, { fn: id(e) })
}, o0 = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => Po(t, { fn: od(e) })
}, r0 = /* @__PURE__ */ new Set([
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
]), Gr = 0.5, a0 = "power1.inOut";
function l0(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function c0(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) r0.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? Gr
    }));
  const s = Object.entries(e), i = t.duration ?? Gr, o = e.easeEach ?? t.easeEach ?? a0;
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
function Jr(t, e, n, s = {}) {
  const i = e.collector?.scope ?? e.root, o = typeof s.scroller == "string" ? i.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: o ? o.scrollLeft : window.scrollX,
    y: o ? o.scrollTop : window.scrollY
  }, a = {
    x: o ? o.scrollWidth - o.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: o ? o.scrollHeight - o.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (S, w) => {
    if (w === void 0) return r[S];
    if (typeof w == "number") return w;
    if (w === "max") return a[S];
    const y = typeof w == "string" ? i.querySelector(w) : w;
    if (!y) return r[S];
    const v = y.getBoundingClientRect(), E = o?.getBoundingClientRect(), T = (S === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return S === "x" ? v.left - (E?.left ?? 0) + r.x - T : v.top - (E?.top ?? 0) + r.y - T;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, d = () => {
    o ? (o.scrollLeft = u.x, o.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, f = ["wheel", "touchstart", "keydown"], g = o ?? window, p = () => {
    b.kill(), m();
  }, m = () => {
    for (const S of f) g.removeEventListener(S, p);
  }, b = t.to(u, {
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
  if (s.autoKill !== !1) for (const S of f) g.addEventListener(S, p, { passive: !0 });
  return b;
}
function h0(t, e, n) {
  const s = t.collector?.scope ?? t.root, i = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: o = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, d = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, f = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (b) => {
    g[b] !== void 0 && clearTimeout(g[b]), g[b] = void 0;
    const S = f[b].splice(0);
    S.length > 0 && d[b]?.(S);
  }, m = (b, S) => {
    if (d[b]) {
      if (f[b].push(S), r !== void 0 && f[b].length >= r) return p(b);
      g[b] === void 0 && (g[b] = setTimeout(() => p(b), o * 1e3));
    }
  };
  return i.map(
    (b) => _o(t, {
      ...u,
      trigger: b,
      onEnter: () => m("onEnter", b),
      onLeave: () => m("onLeave", b),
      onEnterBack: () => m("onEnterBack", b),
      onLeaveBack: () => m("onLeaveBack", b)
    })
  ).filter((b) => b !== void 0);
}
class ne {
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
    if (this.options = s, this.compat = new Ye({
      ...s,
      startValue: (i, o) => {
        const r = e.objectFor(i);
        if (r) return p0(r[o]);
        const a = e.appliedValue(i, o);
        if (a !== void 0) return a;
        if (o === "d") return lc(e.elementFor(i)) ?? void 0;
        if (o === "text") return e.elementFor(i)?.textContent ?? void 0;
        if (o === "strokeDasharray" || o === "strokeDashoffset") {
          const l = ta(e.elementFor(i));
          if (l !== void 0) return o === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (i, o) => e.velocityOf(i, o),
      layoutColumns: (i) => Qr(i.map((o) => e.elementFor(o))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const i = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = _o(e, i, this, this.firstElement, (o) => s.onWarning?.(o)));
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
    return l0(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([i], o, r) => this.compat.to(o, i, r)));
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
    const i = this.timeline.currentTime, o = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: i }, a = s.duration ?? Math.abs(o - i) / 1e3 / (this.timeScale() || 1), l = new ne(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
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
    const i = this.events, { crossings: o, passes: r } = Xl(
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
    const o = c0(n);
    if (o.length === 0) return;
    const r = i.length > 1 ? qi(n.stagger, this.staggerContext(i)) : void 0, a = i.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? Li(i.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + bs(n.delay, 0) / 1e3;
    let u = 1 / 0, d = -1 / 0;
    if (l.forEach((m, b) => {
      o.forEach((S, w) => {
        const y = w === 0 ? h + c[b] : ">";
        this.tween(m, [S], y, ([v], E, T) => this.compat.to(E, v, T)), u = Math.min(u, this.compat.lastStart), d = Math.max(d, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: f, onUpdate: g, onComplete: p } = n;
    f && this.events.push({ time: u, direction: "forward", run: f }), g && this.ranges.push({ start: u, end: d, run: g }), p && this.events.push({ time: d, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => Qr(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, i) {
    const o = e.map((d) => this.targetFor(d));
    if (!(e.length > 1 && (n.some(f0) || e.some((d) => this.stage.objectFor(d) !== void 0)))) {
      const d = this.targetFor(e[0]);
      i(n.map((f) => this.prepare(Zr(f, 0, d, this.stage.utils, o), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = qi(l, this.staggerContext(e)), u = h ? Li(e.length, h).map((d) => d / 1e3) : e.map(() => 0);
    e.forEach((d, f) => {
      const g = f === 0 ? bs(c.delay, 0) / 1e3 + u[0] : 0, p = f === 0 ? 0 : u[f] - u[f - 1], m = f === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, S = n.map((w, y) => y === a ? { ...c, delay: g } : w).map((w) => this.prepare(Zr(w, f, this.targetFor(d), this.stage.utils, o), [d]));
      i(S, [d], m);
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
      const r = pf(e.motionPath, {
        query: i,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      o = { ...o, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = gf(e.morphSVG, i, s), { morphSVG: a, ...l } = o;
      o = r ? { ...o, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = ta(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = o;
        o = l;
      } else
        o = Dd(o, r);
    }
    return o;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${g0(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function u0(t = new hf()) {
  const e = (o) => {
    const { config: r } = os(o);
    return new ne(t, {
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
      return l ? l[r] : t.appliedValue(a, r) ?? ic(r);
    },
    scrollTrigger: (o) => s(_o(t, o)),
    scrollBatch: (o, r) => h0(t, o, r).map((a) => s(a)),
    scrollTo: (o, r) => Jr(i, t, o, r),
    refreshScroll: () => {
      js.refreshAll(), Ur.refreshAll();
    },
    smoothScroll: (o = {}) => {
      const r = typeof o.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(o.scroller) : o.scroller;
      return s(new Ur({ ...o, scroller: r }).start());
    },
    context: (o, r) => {
      const a = new gc(t, r);
      return o && a.add(() => o(a)), a;
    },
    matchMedia: (o) => new Jf(t, o),
    customEase: s0.create,
    customBounce: i0.create,
    customWiggle: o0.create,
    pageTransition: (o) => e0(i, t, (r) => new ne(t, r), o),
    imageSequence: (o, r) => {
      const a = typeof o == "string" ? (t.collector?.scope ?? t.root).querySelector(o) : o;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(o)}`);
      return s(new Zf(a, r));
    },
    quickTo: (o, r, a = {}) => {
      const l = new ne(t, { paused: !0 }), [c] = t.resolveTargets(o);
      return Object.assign((u) => {
        if (!c) return;
        const d = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: d0(a.spring, r, d) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (o) => new ne(t, o),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (o, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof o != "string" && o !== window && o.nodeType === 1;
        return Jr(i, t, a, {
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
    delayedCall: (o, r, a) => new ne(t).call(r, a, o),
    killTweensOf: (o, r) => {
      const a = t.resolveTargets(o), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (o) => yf(o, t.root),
    splitText: (o, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof o == "string" ? Array.from(a.querySelectorAll(o)) : "nodeType" in o ? [o] : Array.from(o);
      return s(Af(l, r));
    },
    draggable: (o, r) => s(Sf(i, t, o, r)),
    getFlipState: (o) => Yi(t, o),
    flipFrom: (o, r) => zi(t, (a) => new ne(t, a), o, r),
    flip: (o, r, a) => {
      const l = Yi(t, o);
      return r(), zi(t, (c) => new ne(t, c), l, { targets: o, ...a });
    }
  };
  return i;
}
const Wt = /* @__PURE__ */ u0();
function d0(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function f0(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || mc(t);
}
function mc(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || sc(n)) && !Oo.has(e));
}
function Zr(t, e, n, s, i) {
  if (!mc(t)) return t;
  const o = {};
  for (const [r, a] of Object.entries(t))
    Oo.has(r) ? o[r] = a : typeof a == "function" ? o[r] = a(e, n, i) : sc(a) ? o[r] = s.resolveRandomString(a) : o[r] = a;
  return o;
}
function Qr(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function ta(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function p0(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function g0(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class ea {
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
function m0(t, e, n, s, i) {
  const o = n - i;
  if (o < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(o, s);
}
class Ho {
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
    this.options = n, this.adapter = new Ae();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = xn({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      o !== null && (s.volume = Math.max(0, Math.min(1, Number(o) || 0))), this.mediaTargets.push({ el: s, startTime: i, sync: new ea(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      m0(s.sync, s.el, e, n, s.startTime);
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
      const r = new Ae();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: xn(o.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new ea(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: o } = Xl(
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
async function Lw(t, e, n = {}) {
  const s = new Ho(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function Fw(t, e = {}) {
  return new Ho(t, e);
}
const y0 = {
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
}, na = "tinyfly-controls-style", b0 = `
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
let w0 = 0;
function k0(t) {
  if (t.getElementById(na)) return;
  const e = t.createElement("style");
  e.id = na, e.textContent = b0, t.head.appendChild(e);
}
function v0(t, e, n = {}) {
  const s = e.ownerDocument;
  k0(s);
  const i = { ...y0, ...n.labels }, o = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((_) => _.label !== void 0 || t.caption(_.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (_, D, F, W = "") => {
    const j = s.createElement("button");
    return j.type = "button", j.className = `tf-ctl-btn ${W}`.trim(), j.setAttribute("aria-label", _), j.title = _, j.textContent = D, j.addEventListener("click", F), j;
  }, u = h(i.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), d = h(i.prev, "|◀", () => t.prev()), f = h(i.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(i.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", i.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const b = s.createElement("span");
  b.className = "tf-ctl-step";
  const S = s.createElement("select");
  S.className = "tf-ctl-speed", S.setAttribute("aria-label", i.speed);
  for (const _ of o) {
    const D = s.createElement("option");
    D.value = String(_), D.textContent = `${_}×`, _ === 1 && (D.selected = !0), S.appendChild(D);
  }
  S.addEventListener("change", () => t.setSpeed(Number(S.value))), c.append(u, d, f, g, m, b), o.length > 0 && c.append(S), l.append(c);
  const w = n.fullscreen ? x0(e, s, i) : void 0;
  w && c.append(w.button);
  const y = s.createElement("p");
  y.className = "tf-ctl-caption", y.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(y);
  const v = s.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const E = s.createElement("span"), T = h(i.reveal, i.reveal, () => t.play(), "tf-ctl-primary");
  v.append(E, T), l.append(v);
  const x = M0(t, s, i.scenario, n.scenarioControl ?? "buttons");
  x && l.append(x.element);
  const M = n.mount;
  M ? M.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const P = () => {
    const _ = t.isPlaying;
    f.textContent = _ ? "❚❚" : "▶", f.setAttribute("aria-label", _ ? i.pause : i.play), f.title = _ ? i.pause : i.play;
    const D = t.duration;
    s.activeElement !== m && (m.value = String(D > 0 ? Math.round(t.currentTime / D * 1e3) : 0));
    const F = t.markers;
    if (d.hidden = g.hidden = b.hidden = F.length === 0, F.length > 0) {
      const W = t.currentMarker, j = W ? F.indexOf(W) + 1 : 0;
      b.textContent = i.stepFormat.replace("{index}", String(j)).replace("{total}", String(F.length)), b.setAttribute("aria-label", `${i.step} ${j} ${i.of} ${F.length}`), d.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= D - 0.5;
      const I = t.caption() ?? "";
      y.textContent !== I && (y.textContent = I), y.hidden = !a();
      const R = !_ && W?.question !== void 0 && Math.abs(t.currentTime - W.time) < 1;
      v.hidden = !R, R && E.textContent !== W.question && (E.textContent = W.question);
    } else
      v.hidden = !0, y.hidden = !0;
    x?.update();
  }, k = t.subscribe(P);
  P();
  const A = n.keyboardScope ?? e;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const H = /* @__PURE__ */ new WeakSet(), O = (_) => {
    if (H.has(_) || (H.add(_), _.defaultPrevented || _.altKey || _.ctrlKey || _.metaKey)) return;
    const D = _.target;
    if (!(D.tagName === "INPUT" || D.tagName === "SELECT") && !(_.key === " " && D.tagName === "BUTTON"))
      switch (_.key) {
        case " ":
          _.preventDefault(), t.isPlaying ? t.pause() : p();
          break;
        case "ArrowRight":
          if (!r()) return;
          _.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          _.preventDefault(), t.prev();
          break;
        case "Home":
          _.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          _.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return A.addEventListener("keydown", O), l.addEventListener("keydown", O), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), k(), A.removeEventListener("keydown", O), l.removeEventListener("keydown", O), l.remove();
    }
  };
}
function M0(t, e, n, s) {
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
      const p = Math.max(0, i.findIndex((b) => b.id === t.scenario));
      e.activeElement !== d && (d.value = String(p));
      const m = i[p].label;
      f.textContent !== m && (f.textContent = m), d.setAttribute("aria-valuetext", m);
    } };
  }
  const o = e.createElement("fieldset");
  o.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, o.append(r);
  const a = `tf-ctl-scenario-${++w0}`, l = i.map((h) => {
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
const S0 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', T0 = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function x0(t, e, n) {
  const s = e, i = t, o = e.createElement("button");
  o.type = "button", o.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    o.innerHTML = p ? T0 : S0;
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
const sa = "tinyfly-choices-style", E0 = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function A0(t) {
  if (t.getElementById(sa)) return;
  const e = t.createElement("style");
  e.id = sa, e.textContent = E0, t.head.appendChild(e);
}
function $0(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  A0(e.ownerDocument);
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
const ks = /* @__PURE__ */ new WeakMap(), Xi = /* @__PURE__ */ new WeakMap();
let P0 = 0;
function bn(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function O0(t, e = {}) {
  const n = ks.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), i = s[0], o = t.getAttribute("data-src"), r = _0(t.getAttribute("data-markers")), a = s.length > 1 || i?.hasAttribute("data-scenario") ? I0(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = i && !a ? bn(i.textContent, "timeline", t) : void 0;
  if (!l && o && r) {
    const f = await fetch(o);
    f.ok && (l = await f.json());
  }
  if (l && r && (l = yc(l, r)), !l && !o && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = bn(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...bn(t.getAttribute("data-options"), "data-options", t)
  };
  C0(t);
  const u = new Ho(t, h), d = { element: t, player: u };
  if (ks.set(t, d), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const f = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === f) ? f : void 0 }), Xi.set(t, $0(u, t));
  } else
    await u.load(l ?? o);
  if (t.getAttribute("data-controls") !== "false") {
    const f = bn(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    d.controls = v0(u, t, {
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
function I0(t, e, n) {
  const s = [];
  return t.forEach((i, o) => {
    const r = bn(i.textContent, "timeline", n);
    if (!r) return;
    const a = i.getAttribute("data-scenario") || `scenario-${o + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = i.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? yc(r, e) : r });
  }), s;
}
function yc(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function _0(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function H0(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((i) => O0(i, e)))).filter((i) => i !== void 0);
}
function Nw(t) {
  const e = ks.get(t);
  e && (Xi.get(t)?.(), Xi.delete(t), e.controls?.destroy(), e.player.destroy(), ks.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function C0(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++P0}`, e.setAttribute("aria-labelledby", s.id));
}
function R0() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    H0();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class L0 {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new Ae(), this.adapterB = new Ae();
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
      const a = new Ae();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: xn(r) });
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
    return e.timeline ? xn(e.timeline) : null;
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
async function Dw(t, e, n = {}) {
  const s = new L0(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const jw = { type: "none", duration: 0 }, yt = (t) => ({ description: t, unit: "degrees" }), ht = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), bc = {
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
  leftFootOut: ht("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: ht("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: ht("Mouth open: 0 closed, 1 wide open"),
  smile: ht("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: ht("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: ht("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: ht("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: ht("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: ht("Eyes look across: + the way it faces", -1, 1),
  lookY: ht("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: ht("0 front-on, 1 in profile, turned the way it faces"),
  sit: ht("0 standing, 1 seated"),
  spin: yt("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, wc = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: ht("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: ht("How much the mouth chatters"),
  rubber: ht("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: ht("How much of the dance is applied")
}, kc = {
  "thumb.curl": ht("Thumb curled in"),
  "thumb.across": ht("Thumb across the palm"),
  "index.curl": ht("Index finger curled"),
  "middle.curl": ht("Middle finger curled"),
  "ring.curl": ht("Ring finger curled"),
  "pinky.curl": ht("Little finger curled"),
  spread: ht("Fingers spread apart"),
  turn: yt("Hand turned about the forearm"),
  bend: yt("Hand bent at the wrist, palm-ward"),
  tilt: yt("Hand tilted sideways"),
  roll: yt("Hand rolled to show the back or the palm")
};
let vc;
function F0(t) {
  vc = t;
}
function N0(t) {
  return vc?.(t) ?? {};
}
function D0(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function An(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = D0(t) * n;
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
function Co(t, e) {
  const n = An(t, e);
  return n[n.length - 1];
}
function Mc(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Ui(t, e, n) {
  const s = e.roughness ?? 2, i = Math.max(1, Math.round(e.passes ?? 2)), o = Mc(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const d = r++;
    return (f) => rn(Xt(`${e.seed ?? 1}:${o}:${d}:${f}`));
  }, l = (d, f) => (d.next() * 2 - 1) * f, c = (d) => {
    const f = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < i; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, d(f(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (d, f = 1) => {
    if (d.length < 2) return;
    const g = d.slice(1).map((m, b) => Math.hypot(m.x - d[b].x, m.y - d[b].y)), p = g.reduce((m, b) => m + b, 0) * Math.min(1, Math.max(0, f));
    c((m) => {
      const b = [], S = [];
      if (d.forEach((y, v) => {
        b.push({ x: y.x + l(m, s * 0.5), y: y.y + l(m, s * 0.5) }), v > 0 && S.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(b[0].x, b[0].y);
      let w = 0;
      for (let y = 1; y < b.length; y++) {
        const v = j0(b[y - 1], b[y], s, S[y - 1]), E = g[y - 1];
        if (w + E <= p) {
          t.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), w += E;
          continue;
        }
        const T = W0(v, E === 0 ? 1 : (p - w) / E);
        t.bezierCurveTo(T[1].x, T[1].y, T[2].x, T[2].y, T[3].x, T[3].y);
        break;
      }
      t.stroke();
    });
  }, u = (d, f, g, p, m = 1) => {
    c((b) => {
      const w = b.next() * Math.PI * 2, y = Math.PI * 2 + 0.15 + b.next() * 0.3, v = [];
      for (let T = 0; T <= 14; T++) {
        const x = w + y * T / 14, M = l(b, s * 0.6);
        v.push({ x: d + Math.cos(x) * (g + M), y: f + Math.sin(x) * (p + M) });
      }
      const E = An(v, m);
      E.length < 2 || (ia(t, E), t.stroke());
    });
  };
  return {
    line: h,
    curve(d, f = 1) {
      if (d.length < 2) return;
      const g = d[0], p = d[d.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, b = -(p.y - g.y) / m, S = (p.x - g.x) / m;
      c((w) => {
        const y = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, v = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, E = l(w, s * Math.min(1.5, Math.max(0.3, m / 80))), T = d.map((M, P) => {
          const k = P / (d.length - 1), A = Math.sin(Math.PI * k) * E;
          return {
            x: M.x + y.x + (v.x - y.x) * k + b * A,
            y: M.y + y.y + (v.y - y.y) * k + S * A
          };
        }), x = An(T, f);
        x.length < 2 || (ia(t, x), t.stroke());
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
function j0(t, e, n, s) {
  const i = e.x - t.x, o = e.y - t.y, r = Math.hypot(i, o) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -o / r, c = i / r;
  return [
    t,
    { x: t.x + i / 3 + l * s[0] * a, y: t.y + o / 3 + c * s[0] * a },
    { x: t.x + 2 * i / 3 + l * s[1] * a, y: t.y + 2 * o / 3 + c * s[1] * a },
    e
  ];
}
function W0([t, e, n, s], i) {
  const o = (u, d) => ({ x: u.x + (d.x - u.x) * i, y: u.y + (d.y - u.y) * i }), r = o(t, e), a = o(e, n), l = o(n, s), c = o(r, a), h = o(a, l);
  return [t, r, c, o(c, h)];
}
function ia(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const i = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, i.x, i.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function rs(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const i = [], o = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, d = r(l) / 2, f = -(h.y - c.y) / u * d, g = (h.x - c.x) / u * d;
    i.push({ x: a.x + f, y: a.y + g }), o.push({ x: a.x - f, y: a.y - g });
  }), [...i, ...o.reverse()];
}
function Ro(t, e, n, s) {
  const i = e.length;
  if (i < 2) return;
  const o = rs(e, n, s), r = (a) => n + (s - n) * a / (i - 1);
  t.beginPath(), t.moveTo(o[0].x, o[0].y);
  for (const a of o.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== i - 1 && i > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function nn(t, e, n, s, i = 16) {
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
function oa(t, e, n, s, i, o = 0, r = 1, a = 40) {
  const l = Math.cos(i), c = Math.sin(i);
  return Array.from({ length: a + 1 }, (h, u) => {
    const d = o + Math.PI * 2 * r * u / a, f = Math.cos(d) * n, g = Math.sin(d) * s;
    return { x: t + f * l - g * c, y: e + f * c + g * l };
  });
}
function Ws(t, e) {
  return e.look === "pencil" ? Y0(t, e) : B0(t, e.ink, e.look);
}
function vs(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function B0(t, e, n) {
  const s = n === "silhouette", i = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(o, r, a) {
      t.fillStyle = e, Ro(t, o, r * i, a * i);
    },
    line(o, r) {
      o.length < 2 || (t.strokeStyle = e, t.lineWidth = r * i, t.lineCap = "round", t.lineJoin = "round", vs(t, o), t.stroke());
    },
    shape(o, r, a) {
      vs(t, o, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * i, t.lineJoin = "round", t.stroke());
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
function q0(t, e) {
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
function K0(t, e) {
  const n = t.length;
  return t.map((s, i) => {
    const o = t[Math.max(0, i - 1)], r = t[Math.min(n - 1, i + 1)], a = Math.hypot(r.x - o.x, r.y - o.y) || 1, l = e(n === 1 ? 0 : i / (n - 1));
    return { x: s.x - (r.y - o.y) / a * l, y: s.y + (r.x - o.x) / a * l };
  });
}
function ra(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, i) => s + i.amount, 0);
  return (s) => e.reduce((i, o) => i + o.amount * Math.sin(Math.PI * 2 * o.frequency * s + o.phase), 0) / n;
}
function Y0(t, e) {
  const n = e.pencil ?? {}, s = e.ink, i = n.roughness ?? Math.max(1, e.lineWidth * 0.12), o = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = Mc(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => rn(Xt(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, b, S, w = 0) => {
    if (g.length < 2) return;
    const y = g.slice(1).reduce((k, A, H) => k + Math.hypot(A.x - g[H].x, A.y - g[H].y), 0);
    let v = q0(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, y / 24)));
    if (w > 0 && v.length >= 2) {
      const [k, A] = [v[v.length - 2], v[v.length - 1]], H = Math.hypot(A.x - k.x, A.y - k.y) || 1;
      v = [...v, { x: A.x + (A.x - k.x) / H * w, y: A.y + (A.y - k.y) / H * w }];
    }
    const E = ra(m), T = ra(m), x = v.length, M = [], P = [];
    v.forEach((k, A) => {
      const H = x === 1 ? 0 : A / (x - 1), O = v[Math.max(0, A - 1)], _ = v[Math.min(x - 1, A + 1)], D = Math.hypot(_.x - O.x, _.y - O.y) || 1, F = -(_.y - O.y) / D, W = (_.x - O.x) / D, j = E(H) * S, I = Math.min(1, H / 0.08, (1 - H) / 0.08), R = (0.55 + 0.45 * Math.sqrt(Math.max(0, I))) * (1 + r * T(H)), L = Math.max(0.3, p(H) * R / 2), $ = k.x + F * j, C = k.y + W * j;
      M.push({ x: $ + F * L, y: C + W * L }), P.push({ x: $ - F * L, y: C - W * L });
    }), t.save(), t.globalAlpha *= b, t.fillStyle = s, vs(t, [...M, ...P.reverse()], !0), t.fill(), t.restore();
  }, d = (g, p) => {
    const m = c++, b = h(m, 99, !0);
    if (b.next() < a) {
      const v = (b.next() * 2 - 1) * e.lineWidth * 1.4, E = (b.next() * 2 - 1) * e.lineWidth * 1.4, T = g.map((x) => ({ x: x.x + v, y: x.y + E }));
      u(T, (x) => p(x) * 1.8, h(m, 98, !0), 0.035, i), u(T, (x) => p(x) * 0.45, h(m, 97, !0), 0.12, i * 1.5);
    }
    const S = g.slice(1).reduce((v, E, T) => v + Math.hypot(E.x - g[T].x, E.y - g[T].y), 0), w = p(0.5) > 4 && S > p(0.5) * 6, y = w ? [-0.3, 0.3, 0] : [0];
    for (let v = 0; v < o; v++) {
      const E = v === 0;
      y.forEach((T, x) => {
        const M = h(m, v * 10 + x), P = T === 0 ? g : K0(g, (A) => p(A) * T * Math.sqrt(Math.sin(Math.PI * A))), k = !E && T === 0 ? e.lineWidth * (0.3 + M.next() * 0.8) : 0;
        u(P, (A) => p(A) * (w ? 0.5 : 1) * (E ? 1 : 0.6), M, E ? 0.85 : 0.45, i * (E ? 0.6 : 1), k);
      });
    }
  }, f = (g, p, m, b, S, w) => {
    const v = h(c, 50).next() * Math.PI * 2;
    d(oa(g, p, m, b, S, v, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, p, m) {
      d(g, (b) => p + (m - p) * b);
    },
    line(g, p) {
      d(g, () => p);
    },
    shape(g, p, m) {
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, vs(t, g, !0), t.fill(), t.restore()), m > 0 && d([...g, g[0]], () => m);
    },
    ellipse(g, p, m, b, S, w, y) {
      w !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = w, t.beginPath(), t.ellipse(g, p, m, b, S, 0, Math.PI * 2), t.fill(), t.restore()), f(g, p, m, b, S, y);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      u(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, i * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, b, S) {
      if (n.construction === !1) return;
      const w = c++, y = h(w, 0), v = oa(g, p, m, b, S, y.next() * Math.PI * 2, 1.12, 48);
      u(v, () => Math.max(0.6, e.lineWidth * 0.18), y, 0.28, i * 1.5);
    }
  };
}
const z0 = ["thumb", "index", "middle", "ring", "pinky"], Mt = {
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
const _t = (t, e, n, s, i) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": i
}), Et = {
  relaxed: Mt,
  open: vt({ ..._t(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: vt({ ..._t(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: vt({ ..._t(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: vt({ ..._t(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: vt({ ..._t(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: vt({ ..._t(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: vt({ ..._t(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: vt({ ..._t(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: vt({ ..._t(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: vt({ ..._t(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: vt({ ..._t(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: vt({ ..._t(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: vt({ ..._t(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function $n(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
const X0 = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, U0 = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, Jt = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, V0 = [82, 100, 62], G0 = [48, 72], J0 = 3, Z0 = 13, Q0 = 0.035, tp = -0.075, ep = [
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
], ce = (t) => t * Math.PI / 180, Vi = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], as = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Gi = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], fn = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function $e(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = Gi(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + o[0] * i + e[0] * r * (1 - s),
    t[1] * s + o[1] * i + e[1] * r * (1 - s),
    t[2] * s + o[2] * i + e[2] * r * (1 - s)
  ];
}
const aa = [1, 0, 0], la = [0, 1, 0], vn = [0, 0, 1];
function np(t, e, n) {
  const s = ce(t.fan * (J0 + Z0 * n)), i = [Math.sin(s), Math.cos(s), 0], o = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += ce(V0[u] * e), r.push(Vi(r[u], as($e(i, o, -a), h)));
  });
  const l = $e(vn, o, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function sp(t, e, n = 1, s = 1) {
  const i = Math.min(1, Math.max(0, e)), o = fn(Vi(as(fn(Jt.out), 1 - i), as(fn(Jt.across), i))), r = fn(Gi(vn, o)), a = fn(Gi(o, r)), l = [[Jt.base[0] * s, Jt.base[1], Jt.base[2]]];
  let c = 0;
  Jt.bones.forEach((d, f) => {
    f > 0 && (c += ce(G0[f - 1] * t)), l.push(Vi(l[f], as($e(o, r, c), d)));
  });
  const h = $e(a, r, c), u = [...Jt.widths, Jt.widths[Jt.widths.length - 1] * 0.92].map((d) => d * n);
  return { joints: l, back: h, widths: u };
}
function Ji(t, e = {}) {
  const n = { ...Mt, ...t }, s = e.size ?? 100, i = e.side ?? "right", o = i === "left" ? -1 : 1, r = ce(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (A) => ({
    ...A,
    knuckle: [A.knuckle[0] * c, A.knuckle[1], A.knuckle[2]],
    width: A.width * l
  }), u = ce(n.bend ?? 0), d = ce(n.tilt ?? 0), f = ce(90 * (n.turn ?? 0)), g = (A) => $e($e($e(A, aa, -u), vn, -d), la, f), p = Math.cos(r), m = Math.sin(r), b = ce(n.roll ?? 0), S = Math.cos(b), w = Math.sin(b), y = (A) => {
    const H = A[0] * s, O = -A[1] * s, _ = (H * S - O * w) * o, D = H * w + O * S;
    return { x: _ * p - D * m, y: _ * m + D * p };
  }, v = (A) => {
    const H = y(A), O = Math.hypot(H.x, H.y);
    return O > 1e-6 * s ? { x: H.x / O, y: H.y / O } : { x: 0, y: 0 };
  }, E = {
    thumb: sp(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, T = a ? U0 : X0;
  for (const A of z0) {
    const H = T[A];
    H && (E[A] = np(h(H), n[`${A}.curl`] ?? 0, n.spread ?? 0));
  }
  const x = {};
  for (const [A, H] of Object.entries(E)) {
    const O = H.joints.map(g), _ = g(H.back);
    x[A] = {
      points: O.map(y),
      depths: O.map((D) => D[2] * s),
      widths: H.widths.map((D) => D * s),
      nail: _[2],
      back: v(_)
    };
  }
  const M = ep.flatMap(([A, H]) => [g([A * c, H, Q0]), g([A * c, H, tp])]), P = op(M.map(y)), k = M.reduce((A, H) => A + H[2], 0) / M.length * s;
  return {
    size: s,
    side: i,
    wrist: { x: 0, y: 0 },
    palm: P,
    palmDepth: k,
    palmFacing: -g(vn)[2],
    fingers: x,
    axes: { up: v(g(la)), across: v(g(aa)), out: v(g(vn)) },
    curls: Object.fromEntries(Object.keys(x).map((A) => [A, n[`${A}.curl`] ?? 0]))
  };
}
function ip(t, e) {
  const n = (i) => ({ x: i.x + e.x - t.wrist.x, y: i.y + e.y - t.wrist.y }), s = {};
  for (const [i, o] of Object.entries(t.fingers))
    s[i] = { ...o, points: o.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function op(t) {
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
const rp = "#f1c9a5", ap = "#2f2f33";
function Lo(t, e, n, s = {}, i = 0) {
  const o = ip(Ji(n, s), e), r = s.ink ?? ap, a = s.lineWidth ?? o.size * 0.035, l = s.pen ?? Ws(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: i,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? rp, h = s.nails ?? !0, u = [
    {
      depth: o.palmDepth,
      draw: () => lp(l, o, c, a)
    }
  ];
  for (const d of Object.values(o.fingers)) {
    const f = d.depths.reduce((g, p) => g + p, 0) / d.depths.length;
    u.push({
      depth: f,
      draw: () => cp(t, l, d, c, a, h)
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
function lp(t, e, n, s) {
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
function cp(t, e, n, s, i, o) {
  const { widths: r } = n, a = hp(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + i * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * i, u + 2 * i), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, Ro(t, a, h, u)), e.look === "silhouette" || !o || n.nail < 0.25) return;
  const d = a[a.length - 2], f = up({ x: c.x - d.x, y: c.y - d.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - f.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - f.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(f.y, f.x), "#f8e3d3", i * 0.45);
}
function hp(t, e) {
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
const up = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Rt = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, dp = 40;
function Bs(t) {
  return t === void 0 ? Rt.walk : typeof t == "string" ? Rt[t] ?? Rt.walk : t;
}
function fp(t, e, n = nt, s = 1) {
  const i = Bs(t);
  if (i === Rt.walk) return gp(e, n, s);
  const o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (b) => Math.abs(b) <= dp, c = i.shoulder ?? 0, h = (b, S) => l(b) ? S * c + i.arm * r : b, u = i.forearm ?? 0, d = l(n.leftShoulder) ? n.leftElbow - u - i.elbow * Math.max(0, -r) : n.leftElbow, f = l(n.rightShoulder) ? n.rightElbow + u + i.elbow * Math.max(0, r) : n.rightElbow, g = i.bounces ?? 1, p = (1 + Math.cos(o * 2 * g)) / 2, m = i.crouch ?? 0;
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
function ca(t, e, n = 1) {
  const s = Bs(t), i = Rt.walk.swing, o = (r) => Math.sin(r * Math.PI / 180);
  return mp(e, n) * o(s.swing * n) / o(i * n);
}
const nt = {
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
  return { ...nt, ...t };
}
const Sc = {
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
}, Tt = (t) => ({ ...Sc, ...t }), lt = {
  neutral: Sc,
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
function ve(t, e) {
  return { ...t, ...typeof e == "string" ? lt[e] : e };
}
const jt = {
  rest: nt,
  wave: xt({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...lt.happy }),
  cheer: xt({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...lt.joyful }),
  shrug: xt({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...lt.confused, lookX: 0, lookY: 0 }),
  point: xt({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: xt({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...lt.thinking }),
  handsOnHips: xt({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: xt({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...lt.sad }),
  surprised: xt({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...lt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: xt({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: xt({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: xt({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...lt.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: xt({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...lt.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: xt({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...lt.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: xt({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...lt.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: xt({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...lt.happy })
}, Tc = Object.keys(nt);
function Pn(t, e, n) {
  const s = { ...t };
  for (const i of Tc) s[i] = t[i] + (e[i] - t[i]) * n;
  return s;
}
const Zi = 24, ha = 4, ua = 28, pp = 40;
function gp(t, e = nt, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, i = Math.cos(t * Math.PI * 2) * n, o = (c) => Math.abs(c) <= pp, r = (c) => o(c) ? 22 * s : c, a = o(e.leftShoulder) ? e.leftElbow - ua * Math.max(0, -s) : e.leftElbow, l = o(e.rightShoulder) ? e.rightElbow + ua * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + ha * n,
    headTilt: e.headTilt - ha * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Zi * s,
    rightHip: -Zi * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, i),
    rightKnee: 30 * Math.max(0, -i),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function mp(t, e = 1) {
  return 4 * ((Qi + Ms) * t) * Math.sin(Zi * e * Math.PI / 180);
}
function yp(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const xc = 0.12, da = 0.46, bp = 1 - 2 * xc, wp = 0.1, kp = 0.21, vp = 0.19, Qi = 0.24, Ms = 0.22, Ec = 0.12, Mp = 0.14, Ac = 0.33, fa = 0.7, pa = 0.3, Sp = 0.35, Tp = [1.7, 1.05], xp = [1.3, 0.75], ga = [1.45, 0.85], Ep = [1.15, 0.75], ma = 0.06, Ap = 0.7, $p = 0.65, $c = 0.075, Pp = 0.3, Op = 0.02, Ip = 0.012, _p = 12, Hp = 0.25, qn = 90, Cp = 0.25, Rp = 0.04, Pc = 0.01, Me = (t) => Math.min(1, Math.max(0, t ?? 0));
function Ww(t, e = 1) {
  return Ms * t * e;
}
const to = -0.12, Oc = 0.4, Nt = (t) => t * Math.PI / 180, Lp = (t, e) => ({ x: e * Math.sin(Nt(t)), y: Math.cos(Nt(t)) }), Ic = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), _c = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function Fp(t, e, n, s, i, o) {
  const r = Math.max(1, Math.min(o * 0.6, Mp * n)), a = Me(e.turn), l = (Ec + Ac * a) * n, c = s + to * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, d = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - fa * a), squeeze: 1 - fa * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - pa * a), squeeze: 1 - pa * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = i, t.strokeStyle = i, t.lineWidth = r;
  for (const b of d) {
    const S = Ic(b.open, e.blink);
    if (S < 0.2) {
      const E = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(b.x + l - 0.12 * n, c), t.quadraticCurveTo(b.x + l, c + E, b.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (S > 1.2) {
        const T = 0.13 * n * S;
        t.beginPath(), t.ellipse(b.x + l, c, T * 0.85, T, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = i;
      }
      const E = S > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(b.x + h, c + u, E, E * 1.1 * Math.min(S, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const w = _c(c, n, b.brow, S), y = b.x + l - b.side * 0.13 * n * b.squeeze, v = b.x + l + b.side * 0.13 * n * b.squeeze;
    t.beginPath(), t.moveTo(v, w), t.lineTo(y, w - e.browTilt * 0.1 * n), t.stroke();
  }
  const f = s + Oc * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - Sp * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, f), t.quadraticCurveTo(l, f + e.smile * 0.25 * n, l + g, f), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, f - 0.05 * n), t.lineTo(l + g, f - 0.05 * n), t.quadraticCurveTo(l, f + m * 2, l - g, f - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, f + m * 0.6), t.lineTo(l + g, f + m * 0.6), t.quadraticCurveTo(l, f - m * 1.4, l - g, f + m * 0.6)) : t.ellipse(l, f, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function Hc(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), i = Math.sqrt(s), o = (e.headSize ?? 2 * xc) / 2, r = e.headSize === void 0 ? bp : 1 - 2 * o, a = o * n, l = Me(t.sit), c = t.leftHip + (-qn - t.leftHip) * l, h = t.leftKnee + (-qn - t.leftKnee) * l, u = t.rightHip + (qn - t.rightHip) * l, d = t.rightKnee + (qn - t.rightKnee) * l, f = e.classic === !0, g = Me(t.turn), p = (W, j, I, R, L) => {
    const $ = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Nt(j - I) / 2) + Nt(R))), C = Math.max(-1, Math.min(1, Ap + L)), B = g + (1 - g) * W * C;
    return f ? { x: 0, y: 0 } : { x: Math.cos($) * ma * B, y: Math.sin($) * ma };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, b = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let S = 0;
  if (l > 0 || !f) {
    const W = (L, $, C, B, X) => Qi * Math.cos(Nt($)) + Ms * Math.cos(Nt($ - C)) + Math.max(0, p(L, $, C, B, X).y), j = Math.max(
      W(-1, c, h, m.left, b.left),
      W(1, u, d, m.right, b.right)
    ), I = 1 - Me((t.rise ?? 0) / Rp), R = (f ? Math.min(1, l / Cp) : 1) * I;
    S = (da - j) * R * n * s;
  }
  const w = -da * n * s + S, y = -r * n * s + S, v = f ? 0 : (Op * Me(t.turn) + Ip * l) * n * s, E = Nt(t.bend ?? 0), T = { end: ba(w, y, E, 1), bend: E };
  let x;
  if (E !== 0) {
    x = [];
    for (let W = 0; W <= ya; W++) {
      const j = W / ya, I = ba(w, y, E, j);
      x.push({ x: I.x - v * Math.sin(Math.PI * j), y: I.y });
    }
  } else
    x = v === 0 ? [{ x: 0, y: w }, { x: 0, y }] : nn({ x: 0, y: w }, { x: -v, y: (w + y) / 2 }, { x: 0, y }, 1, 8);
  const M = y + wp * n * s, P = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), k = (W, j, I, R, L) => {
    const $ = Lp(I, R);
    return { x: W + $.x * L * n, y: j + $.y * L * n };
  }, A = (W, j, I) => {
    const R = k(0, w, j, W, Qi * s);
    return { root: { x: 0, y: w }, joint: R, end: k(R.x, R.y, j - I, W, Ms * s) };
  }, H = (W, j, I) => {
    const R = { x: W * P, y: M }, L = k(R.x, R.y, j, W, kp * i);
    return { root: R, joint: L, end: k(L.x, L.y, j + I, W, vp * i) };
  }, O = { left: A(-1, c, h), right: A(1, u, d) }, _ = (W, j, I, R, L, $) => {
    const C = p(W, I, R, L, $);
    return { x: j.end.x + C.x * n * s, y: j.end.y + C.y * n * s };
  }, D = (W, j, I, R, L) => k(j.end.x, j.end.y, I + R + L, W, $c * i), F = {
    left: H(-1, t.leftShoulder, t.leftElbow),
    right: H(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(f ? 0 : Pp, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: w,
    neckY: y,
    drop: S,
    lean: f ? t.lean : t.lean + _p * Math.sin(Math.PI * l),
    classic: f,
    legs: O,
    toes: {
      left: _(-1, O.left, c, h, m.left, b.left),
      right: _(1, O.right, u, d, m.right, b.right)
    },
    spine: x,
    chest: T,
    arms: F,
    handTips: {
      left: D(-1, F.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: D(1, F.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const ya = 10;
function ba(t, e, n, s) {
  const i = t - e, o = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - i * s };
  const r = i / n;
  return { x: r * (1 - Math.cos(o)), y: t - r * Math.sin(o) };
}
function Np(t, e) {
  if (t.chest.bend === 0) return e;
  const n = On(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const wn = (t, e) => e === 0 ? [t.root, t.joint, t.end] : nn(t.root, t.joint, t.end, e);
function On(t, e, n) {
  const s = Math.cos(n), i = Math.sin(n), o = t.x - e.x, r = t.y - e.y;
  return { x: e.x + o * s - r * i, y: e.y + o * i + r * s };
}
function Cc(t, e, n = !0) {
  const s = jp(t, e), i = e.spin ?? 0, o = e.rise ?? 0;
  return n && (i !== 0 || o !== 0) ? Dp(s, t, i, o) : s;
}
function Rc(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Nt(e), lift: n * t.height };
}
function Dp(t, e, n, s) {
  const { pivot: i, angle: o, lift: r } = Rc(e, n, s), a = (d) => {
    const f = On(d, i, o);
    return { x: f.x, y: f.y - r };
  }, l = (d) => ({ left: a(d.left), right: a(d.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = Pc * e.height;
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
function jp(t, e) {
  const n = Nt(t.lean), s = Nt(e.headTilt), i = { x: 0, y: t.hipY }, o = (y) => ({ x: t.facing * y.x, y: y.y }), r = (y) => o(On(y, i, n)), a = (y) => r(Np(t, y)), l = (y) => a(On({ x: y.x, y: y.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = wn(t.arms.left, t.rubber).map(a), h = wn(t.arms.right, t.rubber).map(a), u = (y, v) => Math.atan2(v.y - y.y, v.x - y.x), d = { left: a(t.handTips.left), right: a(t.handTips.right) }, f = (y, v) => {
    const [E, T] = y.slice(-2), x = t.arms[v], M = u(a(x.end), d[v]) - u(a(x.joint), a(x.end));
    return u(E, T) + M;
  };
  let g = 1 / 0;
  for (const [y, v] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const E = _c(to, 1, y, Ic(v, e.blink));
    g = Math.min(g, E, E - e.browTilt * 0.1);
  }
  const p = { left: o(t.legs.left.end), right: o(t.legs.right.end) }, m = { left: o(t.toes.left), right: o(t.toes.right) }, b = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, S = Math.max(b.left, b.right), w = Pc * t.height;
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
    feetY: S,
    grounded: { left: b.left >= S - w, right: b.right >= S - w },
    fingertips: d,
    handAngle: { left: f(c, "left"), right: f(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: wn(t.legs.left, t.rubber).map(o),
      rightLeg: wn(t.legs.right, t.rubber).map(o),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: to,
      browTopY: g,
      mouthY: Oc,
      faceX: t.facing * (Ec + Ac * Me(e.turn))
    }
  };
}
function ye(t, e = {}) {
  return Cc(Hc(t, e), t);
}
function Bw(t, e, n) {
  return On({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function Wp(t, e, n) {
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
function Bp(t, e, n = {}, s = 0) {
  const i = Hc(e, n), o = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? Cc(i, e, !1) : void 0, l = n.sketch ? Ui(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Ui(t, n.sketch, s) : void 0, h = (T) => {
    t.save(), T(), t.restore();
  }, u = (T) => {
    T && a && h(() => T(t, a, s, c));
  }, d = () => t.scale(i.facing, 1), f = () => {
    d(), t.translate(0, i.hipY), t.rotate(Nt(i.lean)), t.translate(0, -i.hipY);
  }, g = () => {
    f(), i.chest.bend !== 0 && (t.translate(i.chest.end.x, i.chest.end.y), t.rotate(i.chest.bend), t.translate(0, -i.neckY));
  }, p = (T, x, M) => {
    if (l) return x ? l.curve(T) : l.line(T);
    if (i.classic) {
      t.beginPath(), t.moveTo(T[0].x, T[0].y);
      for (const P of T.slice(1)) t.lineTo(P.x, P.y);
      t.stroke();
      return;
    }
    Ro(t, T, M[0] * i.lineWidth, M[1] * i.lineWidth);
  }, m = (T, x) => p(wn(T, i.rubber), i.rubber > 0, x), b = (T) => {
    i.classic || p([i.legs[T].end, i.toes[T]], !1, Ep);
  }, S = (T) => {
    if (n.hands && !i.classic) return y(T);
    if (i.classic || l) return;
    const x = i.arms[T].end;
    t.beginPath(), t.arc(x.x, x.y, $p * i.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = o, t.fillStyle = o, t.lineWidth = i.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const w = Rc(i, e.spin ?? 0, e.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (t.translate(0, -w.lift), t.translate(w.pivot.x, w.pivot.y), t.rotate(w.angle), t.translate(-w.pivot.x, -w.pivot.y));
  function y(T) {
    const x = n.hands ?? {}, M = i.arms[T].end, P = i.handTips[T], k = n.headFill ?? "#ffffff";
    Lo(t, M, x[T] ?? Mt, {
      side: T,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(P.x - M.x, M.y - P.y) * 180 / Math.PI,
      size: (x.size ?? $c) * i.height * Math.sqrt(i.stretch),
      skin: x.skin ?? (k === "none" ? void 0 : k),
      ink: o,
      lineWidth: i.lineWidth * 0.45,
      fingers: x.fingers,
      plump: x.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const v = (T) => {
    h(() => {
      g(), m(i.arms[T], xp), S(T);
    });
    const x = r.sleeve;
    x && a && h(() => x(t, a, T, s, c));
  }, E = Me(e.turn) > Hp;
  u(r.behind), h(() => {
    d(), m(i.legs.left, ga), b("left"), m(i.legs.right, ga), b("right");
  }), E && v("left"), h(() => {
    f(), p(i.spine, i.spine.length > 2, Tp);
  }), h(() => {
    g();
    const { left: T, right: x } = { left: i.arms.left.root, right: i.arms.right.root };
    if (T.x !== x.x)
      if (i.classic) p([T, x], !1, [1, 1]);
      else {
        const M = { x: (T.x + x.x) / 2, y: T.y - 0.3 * Math.abs(x.x - T.x) };
        p(nn(T, M, x, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), E || v("left"), v("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, i.neckY), t.rotate(Nt(e.headTilt));
    const T = -i.headRy;
    t.beginPath(), t.ellipse(0, T, i.headRx, i.headRy, 0, 0, Math.PI * 2);
    const x = n.headFill ?? "#ffffff";
    if (x !== "none" && (t.fillStyle = x, t.fill()), l) {
      l.ellipse(0, T, i.headRx, i.headRy);
      const M = l.nudge();
      t.translate(M.x, M.y);
    } else
      t.stroke();
    t.translate(0, T), t.scale(i.headRx / i.r, i.headRy / i.r), Fp(t, e, i.r, 0, o, i.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = o, t.font = n.labelFont ?? `700 ${Math.round(i.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -i.height * i.stretch - 0.04 * i.height + i.drop), t.restore());
}
function Lc(t, e, n, s) {
  const i = { ...t }, o = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? Pn(i, fp(o, t.walk, i), t.walking) : i, a = Kp(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = Pn(r, c.pose, l), c.hands) {
      const h = (u, d) => d ? $n(u ?? Mt, d, l) : u;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * yp(e)) }), { pose: r, hands: a };
}
function qp(t, e, n, s) {
  return Lc(t, e, n, s).pose;
}
const Fc = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, Ss = (t, e) => `hand.${t}.${e}`;
function Kp(t) {
  const e = (i) => {
    if (typeof t[Ss(i, "spread")] == "number")
      return Object.fromEntries(Object.keys(Mt).map((o) => [o, t[Ss(i, o)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function Yp(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function Nc(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, i = { ...xt(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, o = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? Mt;
      for (const l of Object.keys(Mt)) o[Ss(r, l)] = a[l] ?? Mt[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...i, ...o },
    about: zp(Object.keys(o), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = Lc(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), Bp(r, h.pose, Yp({ ...e, rubber: c.rubber, facing: Fc(c, e) }, h.hands), l);
    }
  };
}
function zp(t, e) {
  const n = { ...bc, ...wc };
  for (const s of t) {
    const [, i, ...o] = s.split("."), r = kc[o.join(".")];
    r && (n[s] = { ...r, description: `${i === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return N0(e);
    }
  };
}
function Dc(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (i.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? o = h : c === "y" || c === "motionPathY" ? r = h : c in i && (i[c] = h));
  const a = qp(i, e.time, t.figureDance, t.figureGaits), l = ye(a, { ...s, rubber: i.rubber, facing: Fc(i, s) });
  return { pose: a, joints: Wp(l, t.x + o + t.width / 2, t.y + r + t.height) };
}
function jc(t) {
  const e = [];
  return t.forEach((n, s) => {
    const i = s === 0 ? nt : e[s - 1], o = typeof n.pose == "string" ? jt[n.pose] : { ...i, ...n.pose };
    e.push(n.expression ? ve(o, n.expression) : o);
  }), e;
}
function qw(t, e) {
  const n = jc(e);
  return Tc.filter((s) => n.some((i) => i[s] !== nt[s])).map((s) => ({
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
const di = 0.5, eo = {
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
function Ts(t) {
  return typeof t != "string" ? t : t in eo ? eo[t] : Et[t];
}
function Wc(t, e, n) {
  const s = [];
  for (const i of t.keys) {
    const o = s[s.length - 1], r = !o || i.reset ? { pose: e, ...n } : o;
    s.push({
      beat: i.beat,
      pose: { ...r.pose, ...i.pose },
      left: i.hands?.left ? Ts(i.hands.left) : r.left,
      right: i.hands?.right ? Ts(i.hands.right) : r.right,
      easing: i.easing ?? t.easing
    });
  }
  return s;
}
const Fo = (t, e) => (t % e + e) % e;
function Xp(t, e, n, s) {
  const i = Wc(t, n, s);
  if (i.length === 0) return { pose: n, hands: s };
  const o = Fo(e, t.beats);
  let r = i.length - 1;
  for (let f = 0; f < i.length; f++) i[f].beat <= o && (r = f);
  const a = i[r], l = i[(r + 1) % i.length], c = a.beat <= o ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (o - c) / (h - c) : 0, d = Pt(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: Pn(a.pose, l.pose, d),
    hands: { left: $n(a.left, l.left, d), right: $n(a.right, l.right, d) }
  };
}
const Up = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], Vp = ["lean", "headTilt", "lookX", "spin"], Gp = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function Jp(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, i] of Up) {
    const o = n && Gp.has(s) ? -1 : 1;
    e[s] = o * t[i], e[i] = o * t[s];
  }
  if (!n) for (const s of Vp) e[s] = -t[s];
  return e;
}
const Zp = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function Qp(t, e, n) {
  const s = Fo(n, 1), i = (1 + Math.cos(2 * Math.PI * s)) / 2, o = e.bounce * (e.accent === "up" ? 1 - i : i), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = Zp(r);
  return {
    ...t,
    leftHip: t.leftHip + a * o / 2,
    rightHip: t.rightHip + o / 2,
    leftKnee: t.leftKnee + a * o,
    rightKnee: t.rightKnee + o,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function no(t) {
  const e = { ...nt, ...t.stance };
  return t.expression ? ve(e, t.expression) : e;
}
function Bc(t) {
  return {
    left: t.hands?.left ? Ts(t.hands.left) : Mt,
    right: t.hands?.right ? Ts(t.hands.right) : Mt
  };
}
function fi(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const i = Xp(s, n, no(t), Bc(t));
  return e.mirror ? { pose: Jp(i.pose), hands: { left: i.hands?.right, right: i.hands?.left } } : i;
}
function No(t, e, n = {}) {
  const s = typeof t == "string" ? He[t] : t;
  let i;
  if (n.move)
    i = fi(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const o = s.routine, r = o.reduce((u, d) => u + d.beats, 0), a = Fo(e, r);
    let l = 0, c = 0;
    for (; c < o.length - 1 && a >= l + o[c].beats; ) l += o[c++].beats;
    const h = a - l;
    if (i = fi(s, o[c], h), h < di && o.length > 1 && e >= di) {
      const u = o[(c - 1 + o.length) % o.length], d = fi(s, u, u.beats + h), f = Pt("ease-in-out")(h / di);
      i = {
        pose: Pn(d.pose, i.pose, f),
        hands: { left: $n(d.hands.left, i.hands.left, f), right: $n(d.hands.right, i.hands.right, f) }
      };
    }
  }
  return { ...i, pose: Qp(i.pose, s.groove, e) };
}
function Kw(t, e, n = {}) {
  return No(t, e, n).pose;
}
function Do(t) {
  return (typeof t == "string" ? He[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const tg = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function wa(t, e, n, s, i, o, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < o || h >= r))
        for (const u of l.taps ?? []) i.push({ beat: h, tap: s ? tg[u] : u });
    }
}
function Yw(t, e, n, s = {}) {
  const i = typeof t == "string" ? He[t] : t, o = [];
  if (n <= e) return o;
  if (s.move) {
    const r = i.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    wa(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, o, e, n);
  } else {
    const r = Do(i);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of i.routine)
        wa(i.moves[c.move], l, c.beats, c.mirror, o, e, n), l += c.beats;
    }
  }
  return o.sort((r, a) => r.beat - a.beat);
}
function ka(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (Wc(n, no(t), Bc(t))[0]?.pose.turn ?? no(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function qc(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function pi(t, e, n = {}) {
  const s = typeof t == "string" ? He[t] : t, i = qc(s, n), o = i.reduce((h, u) => h + u.beats, 0), r = i.reduce((h, u) => h + ka(s, u) * u.beats, 0), a = Math.floor(e / o);
  let l = a * r, c = e - a * o;
  for (const h of i) {
    const u = Math.min(h.beats, c);
    if (l += ka(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function eg(t, e, n) {
  const s = qc(t, n), i = [0];
  let o = 0;
  for (let r = 0; o < e; r = (r + 1) % s.length)
    o += s[r].beats, i.push(Math.min(o, e));
  return i;
}
const ng = 8;
function sg(t, e, n) {
  const s = typeof e == "string" ? He[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Do(s)), r = eg(s, o, n);
  if (r.every((b) => pi(s, b, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, o / 2), l = Pt("ease-in-out"), c = (b) => a <= 0 ? 1 : Math.min(l(Math.min(1, b / a)), l(Math.min(1, (o - b) / a))), h = Math.ceil(a * ng), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (b, S) => [S / h * a, o - S / h * a]).flat(), d = [.../* @__PURE__ */ new Set([...r, ...u])].sort((b, S) => b - S);
  let f = 0;
  const g = d.map((b, S) => {
    if (S > 0) {
      const w = d[S - 1], y = Math.max(1, Math.ceil((b - w) * 16));
      for (let v = 0; v < y; v++) {
        const E = w + (b - w) * v / y, T = w + (b - w) * (v + 1) / y;
        f += (pi(s, T, n) - pi(s, E, n)) * c((E + T) / 2);
      }
    }
    return { beat: b, travel: f };
  }), p = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((b) => ({ time: p + b.beat * 6e4 / i, value: m + n.height * b.travel, easing: "linear" }))
  };
}
function zw(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function Xw(t, e = {}) {
  return (n) => No(t, n, e);
}
function Uw(t, e) {
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
function Vw(t, e, n = {}) {
  const s = typeof e == "string" ? He[e] : e, i = n.bpm ?? s.bpm, o = n.beats ?? (n.move ? s.moves[n.move].beats : Do(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(o * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const b = m / r;
    return { time: a + b * 6e4 / i, frame: No(s, b, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((b) => ({ time: b.time, value: m(b.frame) }))
  }), d = Object.keys(nt).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== nt[p]).map((p) => h(p, (m) => m.pose[p])), f = n.height === void 0 ? void 0 : sg(t, s, { ...n, bpm: i, beats: o, start: a, height: n.height, fade: 0 });
  if (f && d.push(f), n.hands === !1) return d;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys(Mt)) {
      const b = (S) => S.hands?.[p]?.[m] ?? Mt[m];
      c.some((S) => b(S.frame) !== Mt[m]) && g.push(h(Ss(p, m), b));
    }
  return [...d, ...g];
}
const Mn = { type: "back", mode: "out", overshoot: 1.1 }, It = "ease-out-cubic", ig = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: It,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: It },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: It },
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
}, og = {
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
}, rg = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: It },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: It },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: It },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: Mn },
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
}, ag = {
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
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: It },
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
}, lg = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: Mn,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: Mn },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: Mn },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: It,
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
}, cg = {
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
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Et.open, turn: 2 } }, easing: It },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: It },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: It },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: It }
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
}, hg = {
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
}, ug = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, dg = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...ug, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, fg = {
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
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: It },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: It },
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
}, pg = {
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
}, gg = {
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
          easing: Mn
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
}, He = {
  disco: ig,
  hipHop: og,
  breaking: rg,
  jazz: ag,
  kpop: lg,
  bollywood: cg,
  bhangra: hg,
  bharatanatyam: dg,
  charleston: fg,
  tap: pg,
  popping: gg
}, xs = (t) => Math.min(1, Math.max(0, t));
function mg(t) {
  const e = { ...nt, turn: t.view }, n = [];
  for (const s of t.keys) {
    const i = n[n.length - 1], o = !i || s.reset ? e : i.pose;
    n.push({ at: s.at, pose: { ...o, ...s.pose }, easing: s.easing });
  }
  return n;
}
function yg(t) {
  return t - bg * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const bg = 0.5;
function wg(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function kg(t, e) {
  const n = typeof t == "string" ? qs[t] : t, s = mg(n), i = xs(e);
  let o = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= i && (o = u);
  const r = s[o], a = s[Math.min(o + 1, s.length - 1)], l = a.at > r.at ? (i - r.at) / (a.at - r.at) : 0, c = Pn(r.pose, a.pose, Pt(a.easing ?? "ease-in-out")(xs(l))), h = wg(n, i);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * yg(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function vg(t, e, n) {
  const s = typeof t == "string" ? qs[t] : t, i = xs(e), o = xs((i - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * o;
}
function Gw(t, e, n = {}) {
  const s = typeof e == "string" ? qs[e] : e, i = n.start ?? 0, o = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const d = u / r;
    return { time: i + d * o, progress: d, pose: kg(s, d) };
  }), c = Object.keys(nt).filter((h) => a.some((u) => u.pose[h] !== nt[h])).map((h) => ({
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
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * vg(s, u.progress, n.height) }))
    });
  }
  return c;
}
const Mg = {
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
}, Sg = {
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
}, Kn = {
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
}, Tg = {
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
}, xg = {
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
function Re(t, e, n, s, i, o = 1300) {
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
      { at: 0.16, pose: Mg },
      { at: 0.27, pose: Sg, easing: "ease-out-quad" },
      ...i,
      { at: 0.76, pose: Tg },
      { at: 0.86, pose: xg, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const qs = {
  frontFlip: Re("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: Kn, easing: "ease-out-cubic" },
    { at: 0.64, pose: Kn }
  ]),
  backFlip: Re("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...Kn, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...Kn, lean: 18 } }
  ]),
  layout: Re("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: Re("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: Re("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: Re("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, gi = 0.215, mi = 0.205, Eg = 0.065, va = 0.035, Ag = 0.165, $g = 0.155, Pg = 12, Og = 0.3, Ig = 0.7, _g = 0.35, Hg = (t) => t * Math.PI / 180, pt = {
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
function Ft(t = {}) {
  return { ...pt, ...t };
}
const Cg = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX"]);
function Jw(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const i = n.replace(/(^|\.)(left|right)(\.|$)/, (o, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[i] = Cg.has(n) ? -s : s;
  }
  return e;
}
function Lt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}
const sn = {
  rest: pt,
  wave: Ft({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: Ft({ ...Lt("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: Ft({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: Ft({ ...Lt("arm", { spread: 50, bend: -105, elbow: 0 }), ...Lt("leg", { spread: 9 }), smile: 0.8 }),
  think: Ft({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: Ft({ ...Lt("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: Ft({ ...Lt("leg", { swing: 90, knee: 90, spread: 4 }), ...Lt("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: Ft({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...Lt("arm", { swing: 20, elbow: 30 })
  }),
  crouch: Ft({ ...Lt("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...Lt("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: Ft({ lean: 82, "head.nod": -35, ...Lt("arm", { swing: 80, elbow: 0, spread: 4 }), ...Lt("leg", { knee: 92, ankle: -88 }) }),
  lieDown: Ft({ roll: 90, ...Lt("arm", { spread: 8 }), "head.nod": 0 })
};
function Rg(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, i = Math.max(0.12, 1 - e - va - (gi + mi)), o = (l) => ({
    id: `arm.${l}`,
    parent: "spine",
    offset: [(l === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: Ag, width: [1.25, 0.9] },
      { length: $g, width: [0.9, 0.75] }
    ]
  }), r = (l) => ({
    id: `leg.${l}`,
    parent: null,
    offset: [(l === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: l === "left" ? 1 : -1,
    bones: [
      { length: gi, width: [1.45, 1.05] },
      { length: mi, width: [1.05, 0.85] },
      { length: Eg, width: [0.95, 0.7] }
    ]
  }), a = (l, c) => l[c] ?? pt[c] ?? 0;
  return {
    id: "human",
    hipHeight: gi + mi,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: va, width: [1, 0.9] }] },
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
        const p = -a(l, "lean") / 2, m = a(l, "side") / 2, b = -a(l, "bend");
        return [
          { swing: p + b * Og, spread: m },
          { swing: p + b * Ig, spread: m }
        ];
      }
      if (c.id === "neck") return [{ swing: -a(l, "bend") * _g, spread: 0 }];
      const [h, u] = c.id.split("."), d = (p) => a(l, `${h}.${u}.${p}`);
      if (h === "arm")
        return [
          { swing: d("swing"), spread: d("spread") },
          { swing: d("elbow"), spread: d("bend") }
        ];
      const f = (c.side ?? 1) * d("rotate"), g = 1 - Math.cos(Hg(d("rotate")));
      return [
        { swing: d("swing"), spread: d("spread"), yaw: f },
        { swing: -d("knee"), spread: 0, yaw: f },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + d("ankle") - g * (d("swing") - d("knee")), spread: 0, yaw: (Pg + d("toeOut")) * (c.side ?? 1) }
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
function Zw(t) {
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
const Lg = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, Kc = Object.fromEntries(
  Object.entries(lt).map(([t, e]) => [
    t,
    Object.fromEntries(Object.entries(e).map(([n, s]) => [Lg[n] ?? n, s]))
  ])
);
function Qw(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, i = { ...pt, turn: n }, o = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of o) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    i[`arm.${l}.spread`] = h * s, i[`arm.${l}.swing`] = c * h * n, i[`arm.${l}.bend`] = u * s, i[`arm.${l}.elbow`] = c * u * n;
    const d = t[`${a}Hip`], f = t[`${a}Knee`], g = s + c * n;
    i[`leg.${l}.rotate`] = 90 * s, i[`leg.${l}.spread`] = 0, i[`leg.${l}.swing`] = d * g, i[`leg.${l}.knee`] = f * g, i[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), i[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * Fg, i[`eye.${l}`] = t[`${a}Eye`], i[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(i, Ng(l, e[a] ?? Mt, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  i.lean = t.lean * n, i.bend = r * n, i.side = (t.lean + r * 0.5) * s, i["head.tilt"] = (t.headTilt + r * 0.5) * s, i["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) i[a] = t[a];
  return i.lift = t.rise ?? 0, i.roll = t.spin ?? 0, i;
}
const Fg = 70;
function Ng(t, e, n, s) {
  const i = t === "right" ? 1 - s : 1 + s, o = {};
  for (const r of Object.keys(Mt)) o[`hand.${t}.${r}`] = e[r] ?? Mt[r];
  return o[`hand.${t}.turn`] = (e.turn ?? 0) - i, o[`hand.${t}.roll`] = (e.roll ?? 0) + n, o;
}
const Kt = (t) => t * Math.PI / 180;
function jo([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t, e * i + n * o, -e * o + n * i];
}
function Wo([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i - e * o, t * o + e * i, n];
}
function fe([t, e, n], s) {
  const i = Math.cos(s), o = Math.sin(s);
  return [t * i + n * o, e, -t * o + n * i];
}
const de = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Es = (t, e) => [t[0] * e, t[1] * e, t[2] * e], ls = (t, e) => Wo(jo(t, e.swing), e.spread);
function yi(t, e) {
  const n = fe(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Bo(t, e, n) {
  const s = n, o = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const b = p.at ?? (m ? m.joints3.length - 1 : 0), S = m ? m.joints3[b] : o, w = m ? m.frames[Math.max(0, b - 1)] : { swing: 0, spread: 0 }, y = p.offset ? de(S, ls(Es(p.offset, s), w)) : S, v = p.side ?? 1, E = t.boneScale?.(e, p) ?? 1, T = t.angles(e, p), x = [y], M = [];
    let P = w.swing, k = w.spread;
    p.bones.forEach((A, H) => {
      const O = T[H] ?? { swing: 0, spread: 0 };
      P += Kt(O.swing), k += Kt(O.spread) * v, M.push({ swing: P, spread: k });
      const _ = fe(ls(p.rest, { swing: P, spread: k }), Kt(O.yaw ?? 0));
      x.push(de(x[H], Es(_, A.length * s * E)));
    }), r[p.id] = { joints3: x, frames: M };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, d = h * l.sy, f = (p) => ls(fe(jo(Wo(p, -Kt(l.tilt)), -Kt(l.nod)), Kt(l.yaw)), c), g = de(a.joints3[a.joints3.length - 1], f([0, d, 0]));
  return { height: s, root: o, chains: r, head: { center: g, rx: u, ry: d, toBody: f } };
}
function qo(t, e, n) {
  const s = n.height, i = Kt(90 * (e.turn ?? 0)), o = Bo(t, e, s), { root: r } = o, a = o.chains, { rx: l, ry: c } = o.head, h = o.head.toBody, u = o.head.center, d = {};
  for (const M of t.chains) {
    const { joints3: P, frames: k } = a[M.id], A = P.map((H) => yi(H, i));
    d[M.id] = {
      id: M.id,
      joints3: P,
      frames: k,
      points: A.map((H) => H.point),
      depths: A.map((H) => H.depth)
    };
  }
  const f = yi(u, i), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => fe(h(M), i)), p = yi(r, i).point, m = Kt(e.roll ?? 0), b = (M) => {
    const P = M.x - p.x, k = M.y - p.y;
    return { x: p.x + P * Math.cos(m) - k * Math.sin(m), y: p.y + P * Math.sin(m) + k * Math.cos(m) };
  }, S = ([M, P, k]) => [M * Math.cos(m) + P * Math.sin(m), -M * Math.sin(m) + P * Math.cos(m), k];
  for (const M of Object.values(d)) M.points = M.points.map(b);
  const w = {
    center: b(f.point),
    depth: f.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(S)
  }, y = w.axes[1];
  w.angle = Math.atan2(y[0], y[1]);
  const v = (M) => {
    if ("head" in M) return { x: w.center.x + y[0] * c, y: w.center.y - y[1] * c };
    const P = d[M.chain];
    return P.points[Math.min(M.joint, P.points.length - 1)];
  };
  let E = 0;
  (n.contact ?? "ground") === "ground" && (E = -Math.max(...t.contacts.map((M) => v(M).y))), E -= (e.lift ?? 0) * s;
  const T = (M) => ({ x: M.x, y: M.y + E });
  for (const M of Object.values(d)) M.points = M.points.map(T);
  w.center = T(w.center);
  const x = t.contacts.map((M) => ({ spec: M, point: v(M) }));
  return {
    height: s,
    view: i,
    chains: d,
    head: w,
    hip: T(b(p)),
    contacts: x,
    groundY: Math.max(...x.map((M) => M.point.y))
  };
}
const so = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Yc = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Ko(t, e, n) {
  const s = n.height, i = Kt(90 * (e.turn ?? 0)), o = Kt(e.roll ?? 0), r = Bo(t, e, s), a = fe(r.root, i), l = (m) => de(Wo(so(fe(m, i), a), -o), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => Yc(so(l(de(r.head.center, r.head.toBody(m))), h)), d = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], f = (m) => {
    if ("head" in m) return de(h, Es(d[1], r.head.ry));
    const b = c[m.chain];
    return b[Math.min(m.joint, b.length - 1)];
  };
  let g = 0;
  (n.contact ?? "ground") === "ground" && (g = -Math.min(...t.contacts.map((m) => f(m)[1]))), g += (e.lift ?? 0) * s;
  const p = (m) => [m[0], m[1] + g, m[2]];
  return {
    height: s,
    hip: p(a),
    chains: Object.fromEntries(Object.entries(c).map(([m, b]) => [m, b.map(p)])),
    head: { center: p(h), rx: r.head.rx, ry: r.head.ry, axes: d }
  };
}
function Yo(t, e, n, s) {
  const i = n.height, o = Kt(90 * (e.turn ?? 0)), r = Bo(t, e, i), a = Ko(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (M) => {
    if ("head" in M) return de(h, Es(a.head.axes[1], a.head.ry));
    const P = c[M.chain];
    return P[Math.min(M.joint, P.length - 1)];
  }, d = s.toView(l), f = s.toScreen(d), g = s.toScreen([d[0] + 1, d[1], d[2]]), p = Math.hypot(g.x - f.x, g.y - f.y), m = (M) => {
    const P = s.toView(M);
    return { point: s.toScreen(P), depth: P[2] * p };
  }, b = {};
  for (const M of t.chains) {
    const P = c[M.id].map(m);
    b[M.id] = {
      id: M.id,
      joints3: r.chains[M.id].joints3,
      frames: r.chains[M.id].frames,
      points: P.map((k) => k.point),
      depths: P.map((k) => k.depth)
    };
  }
  const S = s.toView(h), w = s.toScreen(S), y = s.toScreen([S[0] + 1, S[1], S[2]]), v = Math.hypot(y.x - w.x, y.y - w.y), E = a.head.axes.map((M) => Yc(so(s.toView(de(h, M)), S))), T = {
    center: w,
    depth: S[2] * p,
    rx: r.head.rx * v,
    ry: r.head.ry * v,
    angle: Math.atan2(E[1][0], E[1][1]),
    axes: E
  }, x = t.contacts.map((M) => ({ spec: M, point: m(u(M)).point }));
  return {
    height: i * p,
    view: o,
    chains: b,
    head: T,
    hip: f,
    contacts: x,
    groundY: Math.max(...x.map((M) => M.point.y))
  };
}
function zc(t, [e, n, s]) {
  const [i, o, r] = t.axes, a = [
    i[0] * e * t.rx + o[0] * n * t.ry + r[0] * s * t.rx,
    i[1] * e * t.rx + o[1] * n * t.ry + r[1] * s * t.rx,
    i[2] * e * t.rx + o[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (i[2] * e + o[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class Xc {
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
function Dg(t) {
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
const zo = Math.PI * 2;
function jg(t, e = 16) {
  const n = new Xc(), s = Math.max(6, Math.round(e)), i = Math.max(3, Math.round(s / 2)), o = [];
  for (let r = 0; r <= i; r++) {
    const a = r / i * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * zo, u = Math.sin(a) * Math.sin(h), d = Math.cos(a), f = Math.sin(a) * Math.cos(h);
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
function Ma(t, e, n, s, i) {
  const o = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: i }, (a, l) => {
    const c = l / i * zo;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < i; a++) {
    const l = r[a], c = r[(a + 1) % i];
    s === 1 ? t.triangle(o, l, c) : t.triangle(o, c, l);
  }
}
function Uc(t, e, n = 24) {
  const s = new Xc(), i = Math.max(6, Math.round(n)), o = e / 2, r = -e / 2, a = (h) => Array.from({ length: i + 1 }, (u, d) => {
    const f = d / i * zo;
    return s.vertex(Math.sin(f) * t, h, Math.cos(f) * t, Math.sin(f), 0, Math.cos(f));
  }), l = a(r), c = a(o);
  for (let h = 0; h < i; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return Ma(s, t, o, 1, i), Ma(s, t, r, -1, i), s.build();
}
function As(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of Dg(t))
    for (const s of n.faces) {
      const i = n.faces.find((o) => o !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: i });
    }
  return { ...t, faceEdges: e };
}
const Yn = (t) => t * 180 / Math.PI, Le = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], bi = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], kn = (t) => Math.hypot(t[0], t[1], t[2]), io = (t) => {
  const e = kn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, zn = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function Sa(t) {
  const [e, n, s] = io(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function Wg(t, e, n, s, i) {
  const o = t.chains.find((P) => P.id === n);
  if (!o) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (o.bones.length < 2 || o.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = qo(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: i.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = kn(Le(a.joints3[1], a.joints3[0])), h = kn(Le(a.joints3[2], a.joints3[1])), u = o.parent ? r.chains[o.parent].frames[Math.max(0, (o.at ?? r.chains[o.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, d = Le(s, l), f = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, kn(d))), g = io(d), p = o.parent !== null, m = ls(o.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), u);
  let b = Le(m, [g[0] * bi(m, g), g[1] * bi(m, g), g[2] * bi(m, g)]);
  kn(b) < 1e-6 && (b = fe([1, 0, 0], 0)), b = io(b);
  const S = (c * c + f * f - h * h) / (2 * c * f), w = Math.sqrt(Math.max(0, 1 - S * S)), y = [
    l[0] + c * (S * g[0] + w * b[0]),
    l[1] + c * (S * g[1] + w * b[1]),
    l[2] + c * (S * g[2] + w * b[2])
  ], v = [l[0] + g[0] * f, l[1] + g[1] * f, l[2] + g[2] * f], E = o.side ?? 1, T = Sa(Le(y, l)), x = Sa(Le(v, y)), M = [
    { swing: Yn(zn(T.swing - u.swing)), spread: Yn(zn(T.spread - u.spread)) * E },
    { swing: Yn(zn(x.swing - T.swing)), spread: Yn(zn(x.spread - T.spread)) * E }
  ];
  return t.withAngles(e, o, M);
}
const Bg = 0.34, se = 0.12, Vt = -0.4, Zt = (t, e, n) => t[e] ?? n, qg = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), Kg = 0.45, Yg = 0.35, zg = 0.7;
function $s(t, e, n) {
  const s = (f) => Math.sqrt(Math.max(0, 1 - f.x * f.x - f.y * f.y)), i = zc(t, [n.x, n.y, s(n)]).facing, o = t.axes[2], r = Math.atan2(o[0], o[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(Yg, Math.abs(a)), h = l * Math.max(zg, Math.abs(a)), u = Math.cos(t.angle), d = Math.sin(t.angle);
  return {
    facing: i,
    points: e.map((f) => {
      const g = Kg * Math.sin(r) + n.x * c + (f.x - n.x) * h, p = f.y + o[1] * s(f), m = g * t.rx, b = p * t.ry;
      return { x: t.center.x + m * u + b * d, y: t.center.y + m * d - b * u };
    })
  };
}
const Xn = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (i, o) => {
  const r = o / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), wi = (t, e, n, s, i = 16) => Array.from({ length: i }, (o, r) => {
  const a = Math.PI * 2 * r / i;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), Ta = 0.05;
function Xg(t, e, n, s) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), o = (b, S) => $s(e, b, S).points, r = (b, S) => $s(e, [], { x: b, y: S }).facing, a = Zt(n, "smile", 0), l = Zt(n, "blink", 0), c = Zt(n, "lookX", 0), h = Zt(n, "lookY", 0), u = Zt(n, "browTilt", 0);
  for (const b of [1, -1]) {
    const S = b === 1 ? "left" : "right", w = Bg * b;
    if (r(w, se) < Ta) continue;
    const y = { x: w, y: se }, v = qg(Zt(n, `eye.${S}`, 1), l);
    if (v < 0.2) {
      const M = a > 0.5 ? 0.12 : -0.06;
      t.line(o(Xn({ x: w - 0.12, y: se }, { x: w, y: se + M }, { x: w + 0.12, y: se }), y), i);
    } else {
      if (v > 1.2) {
        const A = 0.13 * v;
        t.shape(o(wi(w, se, A * 0.85, A), y), "#ffffff", i);
      }
      const M = v > 1.2 ? 0.075 : 0.1, P = w + c * 0.08, k = se - h * 0.07;
      t.shape(o(wi(P, k, M, M * 1.1 * Math.min(v, 1)), y), t.ink, 0);
    }
    const E = se + 0.3 + Zt(n, `brow.${S}`, 0) * 0.14 + Math.max(0, v - 1) * 0.12, T = { x: w + b * 0.13, y: E }, x = { x: w - b * 0.13, y: E + u * 0.1 };
    t.line(o([T, { x: (T.x + x.x) / 2, y: (T.y + x.y) / 2 }, x], { x: w, y: E }), i);
  }
  const d = { x: 0, y: Vt };
  if (r(0, Vt) < -Ta) return;
  const f = 0.25 * Math.max(0.3, Zt(n, "mouthWidth", 1)), g = Math.min(1, Math.max(0, Zt(n, "mouth", 0)));
  if (g <= 0.05) {
    t.line(o(Xn({ x: -f, y: Vt }, { x: 0, y: Vt - a * 0.25 }, { x: f, y: Vt }), d), i);
    return;
  }
  const p = 0.3 * g;
  let m;
  if (a > 0.3) {
    const b = Vt + 0.05;
    m = [...Xn({ x: f, y: b }, { x: 0, y: Vt - p * 2 }, { x: -f, y: b })];
  } else if (a < -0.3) {
    const b = Vt - p * 0.6;
    m = [...Xn({ x: f, y: b }, { x: 0, y: Vt + p * 1.4 }, { x: -f, y: b })];
  } else
    m = wi(0, Vt, f * 0.8, p);
  t.shape(o(m, d), t.ink, 0);
}
function Vc(t = {}) {
  const e = (t.proportions ?? "bold") === "bold", n = t.figure ?? "fluid", s = t.look ?? "clean", i = t.height ?? 300, o = n === "stick";
  return {
    plan: t.plan ?? Rg({
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
function tk(t, e, n, s) {
  const { point: i, facing: o } = zc(t, [e, n, s]);
  return { point: i, facing: o };
}
const oo = (t) => t.rest[1] < -0.5, Ug = 0.3;
function Vg(t, e, n) {
  return t.figure === "stick" ? oo(e) ? n.slice(0, 3) : n : oo(e) && n.length >= 3 ? nn(n[0], n[1], n[2], Ug) : n.length === 3 ? nn(n[0], n[1], n[2], 1) : n;
}
function Xo(t, e) {
  const n = t.plan.id === "human" ? { ...pt, ...e } : e;
  return Ks(t, n, qo(t.plan, n, { height: t.height, contact: t.contact }));
}
function Ks(t, e, n) {
  const s = {}, i = {}, o = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((d) => {
    const f = n.chains[d.id];
    s[d.id] = f.points;
    const g = f.depths.reduce((S, w) => S + w, 0) / f.depths.length, p = d.parent ? n.chains[d.parent] : void 0, m = p ? p.depths[d.at ?? p.depths.length - 1] : 0, b = g - m;
    o[d.id] = Math.abs(b) < r ? 0 : b, i[d.id] = { points: Vg(t, d, f.points), depth: g };
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
function Gg(t, e) {
  return Xo(t, e).joints;
}
function Gc(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const i = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), o = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = $s(s, i, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide($s(s, o, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function Jc(t, e, n, s, i, o) {
  const r = n.lineWidth;
  if (i === "head") {
    const { head: f } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(f.center.x, f.center.y, f.rx, f.ry, f.angle, g, r), e.look !== "silhouette" && Xg(e, f, o, r);
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
  if (oo(a)) {
    const [f, g] = h(0, 1);
    if (e.limb(c, f, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && i.startsWith("arm."))
      Zg(t, e, n, l, i.endsWith(".left") ? "left" : "right", o);
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
    const b = s.points["shoulder.left"], S = s.points["shoulder.right"];
    b && S && Math.hypot(b.x - S.x, b.y - S.y) > 0.5 && e.limb(nn(b, l[l.length - 1], S, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, d] = h(0, a.bones.length - 1);
  e.limb(c, u, d);
}
function Jg(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const i = t.turn ?? 0, o = e === "right" ? 1 - i : 1 + i;
  return { ...Mt, ...s, turn: o + (s.turn ?? 0) };
}
function Zg(t, e, n, s, i, o) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  Lo(t, r, Jg(o, i), {
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
function Qg(t, e, n, s = 0) {
  const i = e.plan.id === "human" ? { ...pt, ...n } : n;
  Zc(t, e, i, Xo(e, i), s);
}
function Uo(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function ek(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...pt, ...e } : e, o = Yo(t.plan, i, { height: s.height, contact: t.contact }, n);
  return Ks(Uo(t, o.height), i, o).joints;
}
function nk(t, e, n, s, i) {
  const o = e.plan.id === "human" ? { ...pt, ...n } : n, r = Yo(e.plan, o, { height: i.height, contact: e.contact }, s), a = Uo(e, r.height);
  Zc(t, a, o, Ks(a, o, r), i.time ?? 0);
}
function tm(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...pt, ...e } : e, o = Yo(t.plan, i, { height: s.height, contact: t.contact }, n), r = Uo(t, o.height), { joints: a, order: l } = Ks(r, i, o), c = o.height / s.height;
  return l.map((h, u) => ({
    part: h,
    depth: (a.parts[h]?.depth ?? 0) / c,
    draw(d, f = 0) {
      const g = Ws(d, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: Xt(`${r.seed}:${h}`), time: f, pencil: r.pencil }), p = (b) => {
        b && (d.save(), b(d, a, g, f), d.restore());
      };
      d.save(), d.lineCap = "round", d.lineJoin = "round", u === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && Gc(g, r, a), p(r.layers.behind));
      const m = r.layers.parts?.[h];
      p(m?.under), Jc(d, g, r, a, h, i), p(m?.over), u === l.length - 1 && p(r.layers.front), d.restore();
    }
  }));
}
function Zc(t, e, n, s, i) {
  const { joints: o, order: r } = s, a = Ws(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: i,
    pencil: e.pencil
  }), l = (c) => {
    c && (t.save(), c(t, o, a, i), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", e.look === "pencil" && e.pencil.construction !== !1 && Gc(a, e, o), l(e.layers.behind);
  for (const c of r) {
    const h = e.layers.parts?.[c];
    l(h?.under), Jc(t, a, e, o, c, n), l(h?.over);
  }
  l(e.layers.front), t.restore();
}
function sk(t, e, n) {
  const s = { ...t };
  for (const [i, o] of Object.entries(e)) {
    const r = t[i] ?? o;
    s[i] = r + (o - r) * n;
  }
  return s;
}
function ik(t, e, n, s) {
  const i = t.plan.id === "human" ? { ...pt, ...e } : e;
  let o;
  if (Array.isArray(s))
    o = s;
  else {
    const { skeleton: r } = Xo(t, i), a = qo(t.plan, { ...i, roll: 0 }, { height: t.height, contact: "none" }), l = (i.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), d = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), f = Math.PI / 2 * (i.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(f), m = Math.sin(f);
    o = [u * p - g * m, -d, u * m + g * p];
  }
  return Wg(t.plan, i, n, o, { height: t.height });
}
function ok(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, i = e.plan.id === "human" ? pt : {};
  return {
    type: "custom",
    x: t.x - n / 2,
    y: t.y - s,
    width: n,
    height: s,
    props: { ...i, ...t.pose },
    character: e,
    draw(o, r, a) {
      o.translate(n / 2, s), Qg(o, e, r.props, a);
    }
  };
}
function em(t, e, n) {
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
function rk(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const i = { ...t.props };
  let o = 0, r = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" || l === "motionPathX" ? o = c : l === "y" || l === "motionPathY" ? r = c : l in i && (i[l] = c));
  const a = Gg(s, i);
  return { pose: i, joints: em(a, t.x + o + t.width / 2, t.y + r + t.height) };
}
function Qc(t, e = pt) {
  const n = [];
  return t.forEach((s, i) => {
    const o = i === 0 ? e : n[i - 1], r = typeof s.pose == "string" ? sn[s.pose] : void 0;
    n.push(r ? { ...r, turn: o.turn ?? 0 } : { ...o, ...s.pose });
  }), n;
}
function ak(t, e, n = pt) {
  const s = Qc(e, n);
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
const ki = /* @__PURE__ */ new Map();
function nm(t) {
  const e = ki.get(t);
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
  return ki.size < 512 && ki.set(t, n), n;
}
Ie([-3, -5, -4]);
const sm = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function th(t, e, n) {
  const s = [0, 0, 0];
  for (const i of n) {
    const o = nm(i.color);
    let r;
    if (i.light === "ambient")
      r = i.intensity;
    else if (i.light === "directional")
      r = i.intensity * Math.max(0, -ue(e, i.direction));
    else {
      const a = an(i.position, t), l = Ns(a), c = l > 0 ? Ue(a, 1 / l) : e, h = i.range ? Math.max(0, 1 - l / i.range) ** 2 : 1;
      if (r = i.intensity * Math.max(0, ue(e, c)) * h, i.light === "spot") {
        const u = Math.cos(i.angle * Math.PI / 180), d = Math.cos(i.angle * 0.8 * Math.PI / 180);
        r *= sm(u, d, -ue(c, i.direction));
      }
    }
    s[0] += o[0] * r, s[1] += o[1] * r, s[2] += o[2] * r;
  }
  return s;
}
function eh(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function nh(t, e, n = {}) {
  t.save(), im(t, e, n), t.restore();
}
function im(t, e, n) {
  const s = sh(e, n);
  n.shadow !== !1 && ih(t, e, n);
  for (const i of e.under) ro(t, i, s, n);
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
  for (const i of e.over) ro(t, i, s, n);
}
function sh(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function ih(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, Ys(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function lk(t, e, n, s = {}) {
  t.save(), ro(t, e, n, s), t.restore();
}
function om(t, e, n, s = {}) {
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
        const b = p.normal[0] * (d[0] - p.center[0]) + p.normal[1] * (d[1] - p.center[1]) + p.normal[2] * (d[2] - p.center[2]);
        b > -xa / 5 && b < xa && (u.layer = Math.max(u.layer, g.layer), u.depth = Math.max(u.depth, g.depth + 1e-6));
      }
    }
  o.sort((h, u) => h.layer - u.layer || h.depth - u.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let u = a.get(h.part.id);
    return u || a.set(h.part.id, u = Vo(t, h, n, s)), u;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: u } of o) {
    t.globalAlpha = c * h.opacity;
    const d = l(h);
    if (!u) d.line(h.spine, n * 1.15);
    else {
      const f = i ? oh(h, s) : u.light ? rm(h, u, s) : Go(h);
      f && (!i && s.look === "silhouette" ? d.shape(u.points, f, 0) : Ys(t, u.points, i || u.light ? f : Zo(f, u.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of u.edges ?? []) p.length > 1 && d.line(p, g);
      for (const p of u.marks ?? []) d.line(p, n * 0.7);
    }
  }
  t.restore();
}
const xa = 0.05;
function Vo(t, e, n, s) {
  return Ws(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: Xt(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function Go(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? ah(e.fill, e.glow.color, t.glow) : e.fill;
}
function rm(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const i = rh(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? ah(i, s.glow.color, t.glow) : i;
}
function oh(t, e) {
  const n = Go(t);
  return n && (lm(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function ro(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, Ea(t, e, n, s), t.restore()) : Ea(t, e, n, s);
}
function Ea(t, e, n, s) {
  if (s.style === "stick") return am(t, e, n, s);
  const { part: i } = e, o = Vo(t, e, n, s), r = Go(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? o.shape(c.points, r, 0) : Ys(t, c.points, Zo(r, c.tone)));
  const l = (i.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && o.line(c, l);
  for (const c of e.marks) o.line(c, n * 0.7);
}
function am(t, e, n, s) {
  const { part: i } = e;
  if (i.solidOnly) return;
  const o = Vo(t, e, n, s);
  if (e.spine) {
    o.line(e.spine, n * 1.15);
    return;
  }
  const r = oh(e, s);
  for (const l of e.faces) Ys(t, l.points, r);
  const a = (i.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && o.line(l, a);
  for (const l of e.marks) o.line(l, n * 0.7);
}
function lm(t) {
  const e = on(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function Ys(t, e, n, s = !0, i = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let o = 1; o < e.length; o++) t.lineTo(e[o].x, e[o].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = i, t.lineJoin = "round", t.stroke());
}
function on(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const Jo = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function Zo(t, e) {
  const n = on(t);
  return n ? Jo(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function rh(t, e, n, s) {
  const i = on(t);
  if (!i) return t;
  let o = i.map((a, l) => a * e[l]);
  const r = s ? on(s) : void 0;
  return r && n > 0 && (o = o.map((a, l) => a + (r[l] - a) * n)), Jo(o);
}
function ah(t, e, n) {
  const s = on(t), i = on(e);
  return !s || !i ? n < 0.5 ? t : e : Jo(s.map((o, r) => o + (i[r] - o) * n));
}
const Aa = 40, cm = 0.215 + 0.205, Ht = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [i, o] of Object.entries(e)) n[`${t}.${s}.${i}`] = o;
  return n;
}, st = (t, e) => t[e] ?? pt[e] ?? 0;
function hm(t, e, n = pt, s = 1) {
  const i = Bs(t), o = e * Math.PI * 2, r = Math.sin(o) * s, a = Math.cos(o) * s, l = (1 + Math.cos(o * 2 * (i.bounces ?? 1))) / 2, c = i.crouch ?? 0, h = i.shoulder ?? 0, u = i.forearm ?? 0, d = { ...pt, ...n };
  d["leg.left.swing"] = i.swing * r + c * 0.6, d["leg.right.swing"] = -i.swing * r + c * 0.6, d["leg.left.knee"] = i.knee * Math.max(0, a) + c * 1.2, d["leg.right.knee"] = i.knee * Math.max(0, -a) + c * 1.2, d["leg.left.ankle"] = st(n, "leg.left.ankle") - (i.tiptoe ?? 0), d["leg.right.ankle"] = st(n, "leg.right.ankle") - (i.tiptoe ?? 0);
  for (const [f, g] of [["left", -1], ["right", 1]])
    st(n, `arm.${f}.spread`) > Aa || st(n, `arm.${f}.swing`) > Aa || (d[`arm.${f}.swing`] = h + g * i.arm * r, d[`arm.${f}.elbow`] = st(n, `arm.${f}.elbow`) + u + i.elbow * Math.max(0, g * r));
  return d.lean = st(n, "lean") + i.lean * s, d.bend = st(n, "bend") + (i.bend ?? 0), d["head.nod"] = st(n, "head.nod") - i.lean * 0.5 * s + (i.headTilt ?? 0), d.side = st(n, "side") + (i.sway ?? 0) * Math.sin(o), d.lift = st(n, "lift") + (i.bounce ?? 0) * s * l, d.stretch = st(n, "stretch") * (1 + (i.squash ?? 0) * (l - 0.5)), d;
}
function um(t, e, n = 1) {
  const s = Bs(t);
  return 4 * cm * e * Math.sin(s.swing * n * Math.PI / 180);
}
const Fe = (t) => Kc[t], Qo = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: st(t, "lean") - 4, ...Ht("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Ht("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Ht("leg", { swing: 25, knee: 60 }), ...Fe("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Ht("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Ht("arm", { spread: 70, bend: 0 }), ...Ht("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Ht("arm", { spread: 60 }),
        "leg.left.swing": st(t, "leg.left.swing"),
        "leg.right.swing": st(t, "leg.right.swing"),
        "leg.left.knee": st(t, "leg.left.knee"),
        "leg.right.knee": st(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: st(t, "stretch"), bend: st(t, "bend"), ...Fe("surprised"), ...Ht("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": st(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": st(t, "head.nod") - 10, bend: st(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...Fe("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
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
        ...Fe("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Ht("arm", { spread: 75 }), ...Ht("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": st(t, "arm.left.spread"), "arm.right.spread": st(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: st(t, "stretch"), bend: st(t, "bend"), ...Ht("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...Fe("scared"), ...Ht("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: st(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: st(t, "side") + 2.5 * s, "head.tilt": st(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: st(t, "side"), "head.tilt": st(t, "head.tilt"), bend: st(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": st(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Fe("sad"), bend: 18, stretch: 0.92, lean: st(t, "lean") + 5, "head.nod": 14, ...Ht("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function dm(t, e) {
  const n = Ft(e.from ?? {}), s = e.speed ?? 1;
  let i = n;
  return [
    { time: e.at, pose: n },
    ...Qo[t](n).map((o) => (i = { ...i, ...o.pose }, { time: e.at + o.after * s, pose: i, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
const fm = /* @__PURE__ */ new Set([
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
]), pm = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), $a = (t) => typeof t == "number" ? t : void 0, gm = 1.7;
function mm(t, e, n) {
  const s = Array.from({ length: 24 }, (i, o) => {
    const r = o / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((i) => i === null) || (t.beginPath(), s.forEach((i, o) => o === 0 ? t.moveTo(i.x, i.y) : t.lineTo(i.x, i.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function ym(t) {
  const e = ue([0, 1, 0], t);
  if (e > 0.999999) return Ds();
  if (e < -0.999999) return Yt(Dt([1, 0, 0], 180));
  const n = ms([0, 1, 0], t);
  return Yt(Dt(n, Math.acos(e) * 180 / Math.PI));
}
function bm(t, e, n, s, i) {
  const o = t.solid ?? {}, r = o.outline === !1 ? void 0 : o.outline ?? { width: 2, color: "#0f172a" }, a = { color: o.color ?? "#475569", shading: o.shading ?? "toon", outline: r }, l = { color: o.skin ?? "#f2c49b", shading: o.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], d = (w, y, v) => u.push({ mesh: w, world: bt(i, y), material: v }), f = (w, y, v) => d(e.sphere, Ao(w, [0, 0, 0, 1], [y, y, y]), v);
  for (const w of n.chains) {
    const y = s.chains[w.id], v = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach((E, T) => {
      const x = y[T], M = y[T + 1], P = Eo(x, M), [k, A] = E.width ?? [1, 1], H = h * v * (k + A) / 2;
      if (P > 1e-6) {
        const O = tc(x, M, 0.5), _ = ym(Ie(an(M, x)));
        d(e.cylinder, bt(ke(O), bt(_, Ee([H, P, H]))), a);
      }
      f(x, h * v * k, a), f(M, h * v * A, a);
    }), w.id.startsWith("arm.") && f(y[y.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: b } = s.head, S = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...g, 1];
  d(e.sphere, bt(S, Ee([p, m, p])), l);
  for (const w of [-1, 1]) {
    const y = Ie([w * 0.36, 0.15, 0.92]), v = is(g, is(is(Ue(b[0], y[0] * p * 1.04), Ue(b[1], y[1] * m * 1.04)), Ue(b[2], y[2] * p * 1.04))), E = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...v, 1];
    d(e.sphere, bt(E, Ee([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const ck = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: Vc({ ...t.character, height: 1 }),
      cylinder: As(Uc(1, 1, 16)),
      sphere: As(jg(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: i, lights: o = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let u = { ...pt, ...l.pose };
    for (const [x, M] of n)
      typeof M == "number" && !fm.has(x) && !pm.has(x) && (u[x] = M);
    const d = Math.max(0, Math.min(1, $a(n.get("walking")) ?? l.walking ?? 0));
    if (d > 0) {
      const x = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, M = hm(x, $a(n.get("walk")) ?? 0, u);
      u = Object.fromEntries(Object.keys({ ...u, ...M }).map((P) => [P, (u[P] ?? 0) + ((M[P] ?? 0) - (u[P] ?? 0)) * d]));
    }
    const f = l.height ?? gm, g = bt(i.view, s), p = {
      toView: (x) => Ct(g, x),
      toScreen: (x) => a(x)
    }, b = -p.toView([0, f / 2, 0])[2];
    if (b <= i.near) return null;
    const S = l.shadow === !1 ? [] : [{ depth: b + f, draw: (x) => mm(x, p, f * 0.18) }];
    if (l.look === "solid") {
      const x = Ko(h.plan, u, { height: f, contact: h.contact });
      return { meshes: bm(l, c, h.plan, x, s), drawables: S };
    }
    const w = Ct(s, [0, f * 0.6, 0]), y = Ie(an(i.position, w)), v = th(w, y, o).map((x) => Math.min(1, x)), E = o.length > 0 && h.skin !== "none" ? { ...h, skin: rh(h.skin, v, eh(r, Eo(w, i.position)), r?.color) } : h, T = tm(E, u, p, { height: f });
    return {
      drawables: [
        ...S,
        // Ties keep the character's own order.
        ...T.map((x, M) => ({ depth: -x.depth - M * 1e-6, draw: (P, k) => x.draw(P, k.time) }))
      ]
    };
  }
}, Sn = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function wm([t, e, n]) {
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
const Ne = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function km(t, e, n = "x", s = 20, i = 0) {
  const o = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const u = Math.PI * 2 * h / s;
      o.push(Ne(n, [Math.cos(u) * t, Math.sin(u) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: Ne(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: Ne(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, u = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: Ne(n, [Math.cos(u), Math.sin(u), 0]) });
  }
  const l = [];
  if (i > 0)
    for (const c of [-r, r]) {
      const h = o.push(Ne(n, [0, 0, c * 1.01])) - 1;
      for (let u = 0; u < i; u++) {
        const d = Math.PI * 2 * u / i, f = o.push(Ne(n, [Math.cos(d) * t * 0.82, Math.sin(d) * t * 0.82, c * 1.01])) - 1;
        l.push([h, f]);
      }
    }
  return { vertices: o, faces: a, marks: l, creases: !0 };
}
function vm([t, e, n], s = 16) {
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
    return Sn([u[0] / (t * t), u[1] / (e * e), u[2] / (n * n)]);
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
const Mm = (t) => t.reduce((e, [n, s], i) => {
  const [o, r] = t[(i + 1) % t.length];
  return e + n * r - o * s;
}, 0) / 2;
function Sm(t, e) {
  const n = Mm(t) < 0 ? [...t].reverse() : t, s = n.length, i = e / 2, o = [...n.map(([a, l]) => [i, l, a]), ...n.map(([a, l]) => [-i, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: Sn([0, -c, h]) });
  }
  return { vertices: o, faces: r, creases: !0 };
}
function Tm(t, e) {
  const n = {
    left: ([i, o]) => [0, o, i],
    right: ([i, o]) => [0, o, i],
    front: ([i, o]) => [i, o, 0],
    back: ([i, o]) => [i, o, 0],
    up: ([i, o]) => [i, 0, o]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((i, o) => o), normal: s[e] }] };
}
function xm(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, i = [], o = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = Sn([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), u = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d = Sn(Pa(h, u)), f = Pa(d, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), b = Math.sin(p) * s(a);
      i.push([r[0] + d[0] * m + f[0] * b, r[1] + d[1] * m + f[1] * b, r[2] + d[2] * m + f[2] * b]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((d, f) => [d[0] + i[f][0] / 4, d[1] + i[f][1] / 4, d[2] + i[f][2] / 4], [0, 0, 0]), u = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      o.push({ corners: c, normal: Sn([h[0] - u[0], h[1] - u[1], h[2] - u[2]]) });
    }
  return { vertices: i, faces: o, creases: !1 };
}
function Pa(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Em(t) {
  switch (t.type) {
    case "box":
      return wm(t.size);
    case "cylinder":
      return km(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return vm(t.radii, t.segments);
    case "extrude":
      return Sm(t.profile, t.width);
    case "panel":
      return Tm(t.points, t.facing);
    case "tube":
      return { ...xm(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function lh(t, e) {
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
const Se = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function Ps(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function ch(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function Ve(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function hh(t) {
  const e = t.filter((i, o) => o === 0 || Math.hypot(i[0] - t[o - 1][0], i[1] - t[o - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : lh(e.map(([i, o]) => [i, 0, o]), (e.length - 1) * 12).map(([i, , o]) => [i, o]);
  let s = 0;
  return n.map((i, o) => (o > 0 && (s += Math.hypot(i[0] - n[o - 1][0], i[1] - n[o - 1][1])), { point: i, at: s }));
}
function uh(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], i = t[n], o = i.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (i.at - s.at))) : 0;
  return {
    point: [s.point[0] + (i.point[0] - s.point[0]) * o, s.point[1] + (i.point[1] - s.point[1]) * o],
    direction: [i.point[0] - s.point[0], i.point[1] - s.point[1]]
  };
}
function dh(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let i = 0; i < 40; i++) {
    const o = (n + s) / 2;
    t(o) < e ? n = o : s = o;
  }
  return (n + s) / 2;
}
const Oa = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag"], Am = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, ao = Object.keys(Rt), vi = Object.keys(sn), Mi = Object.keys(Qo), $m = 0.25, Pm = 700 / 180, Om = 200, Im = 300;
function _m(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...ao, "face", "hold", "pose", "gag", "place"], n = [];
  return t.forEach((s, i) => {
    const o = (c) => n.push({ beat: i, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return o("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) Oa.includes(c) || o(rt("beat field", c, Oa, a[c]));
    const l = typeof r.do == "string" ? vi.includes(r.do) ? "pose" : Mi.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return o(rt("character 3D beat", r.do, e, l));
    ao.includes(r.do) && (r.to === void 0 && r.through === void 0 && o(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !Se(r.to) && o(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(Se)) && o("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !Se(r.to) && o("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(Se(r.toward) || typeof r.toward == "number") && o("`face` needs `toward`: a point [x, z] or a heading in degrees."), r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !vi.includes(r.pose) && o(rt("pose", r.pose, vi)), r.do === "gag" && !Mi.includes(r.gag) && o(rt("gag", r.gag, Mi));
  }), n;
}
function hk(t, e, n) {
  const s = _m(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((y) => `  beat ${y.beat}: ${y.message}`).join(`
`)}`);
  const i = n.height ?? 1.7, o = { ...pt, ...n.pose };
  let [r, a] = n.position ?? [0, 0], l = n.heading ?? 0, c = 0;
  const h = /* @__PURE__ */ new Map(), u = [], d = (y, v, E, T = "linear") => {
    const x = h.get(y) ?? [];
    x.push({ time: v, value: E, easing: T }), h.set(y, x);
  };
  d("x", 0, r), d("z", 0, a), d("rotateY", 0, l);
  const f = (y, v) => {
    const E = Ps(l, v);
    if (Math.abs(E) < 1) return y;
    const T = Math.max(Om, Math.abs(E) * Pm);
    return d("rotateY", y, l), l += E, d("rotateY", y + T, l, "ease-in-out"), y + T;
  }, g = (y, v, E, T = "ease-in-out") => {
    for (const [x, M] of Object.entries(E))
      o[x] !== M && (d(x, y, o[x] ?? 0), d(x, v, M, T), o[x] = M);
  }, p = (y, v, E) => {
    const T = hh([[r, a], ...v.through ?? [v.to]]);
    if (T.length < 2) return E;
    const x = f(E, Ve(T[0].point, T[1].point)), M = T[T.length - 1].at, P = v.speed ?? Am[y] * Math.sqrt(i / 1.7), k = v.for ?? M / P * 1e3, A = um(y, i), H = Pt("ease-in-out"), O = Math.min(Im, k / 4);
    u.push({ time: x, value: y }), d("walking", x, 0), d("walking", x + O, 1, "ease-out"), d("walking", x + k - O, 1), d("walking", x + k, 0, "ease-in");
    const _ = c;
    let D = l;
    for (let F = 0; ; F = Math.min(M, F + $m)) {
      const W = x + dh(H, F / M) * k, { point: j, direction: I } = uh(T, F);
      if (D += Ps(D, Ve([0, 0], I)), d("x", W, j[0]), d("z", W, j[1]), d("rotateY", W, D), d("walk", W, _ + F / A), F >= M) break;
    }
    return c = _ + M / A, [r, a] = T[T.length - 1].point, l = D, x + k;
  }, m = [];
  let b = 0;
  for (const y of e) {
    const v = y.at ?? b;
    let E = v;
    if (ao.includes(y.do)) E = p(y.do, y, v);
    else if (y.do === "face") E = f(v, typeof y.toward == "number" ? y.toward : Ve([r, a], y.toward));
    else if (y.do === "hold") E = v + (y.for ?? 1e3);
    else if (y.do === "place")
      d("x", v, r), d("z", v, a), [r, a] = y.to, d("x", v + 1, r), d("z", v + 1, a), typeof y.toward == "number" && (d("rotateY", v, l), l = y.toward, d("rotateY", v + 1, l)), E = v + 1;
    else if (y.do === "pose") {
      E = v + (y.for ?? 500);
      const T = typeof y.pose == "string" ? sn[y.pose] : y.pose;
      g(v, E, T);
    } else if (y.do === "gag") {
      const T = dm(y.gag, { at: v, from: { ...o } });
      let x = T[0];
      for (const M of T.slice(1))
        g(x.time, M.time, Object.fromEntries(Object.entries(M.pose).filter(([P, k]) => o[P] !== k)), M.easing ?? "ease-in-out"), x = M;
      E = x.time;
    }
    m.push({ do: y.do, start: v, end: E }), b = E;
  }
  const S = `${n.scene}/${t}`, w = [...h].map(([y, v]) => ({ id: `${t}-${y}`, target: S, property: y, keyframes: ch(v) }));
  return u.length > 0 && w.push({ id: `${t}-gait`, target: S, property: "gait", keyframes: u }), { tracks: w, duration: b, beats: m, end: { position: [r, a], heading: l, pose: { ...o } } };
}
const Hm = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function uk(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : Hm[n];
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
function dk(t, e, n) {
  const s = n.width / 2, i = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, i + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -i);
}
function fk(t, e, n) {
  const s = e.width / 2, i = e.height / 2, o = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - i) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(o) - a * Math.sin(o),
    y: i + t.y + t.shakeY + r * Math.sin(o) + a * Math.cos(o)
  };
}
function Cm(t, e, n = {}, s) {
  const i = n.length ?? 240, o = 9, r = 28, a = i - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -o, a - r, 2 * o), t.fillStyle = "#e8b4a0", t.fillRect(a, -o, i - a, 2 * o), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -o), t.lineTo(r, o), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -o * 0.35), t.lineTo(r * 0.35, o * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -o }, { x: i, y: -o }, { x: i, y: o }, { x: r, y: o }, { x: 0, y: 0 }],
    [{ x: r, y: -o }, { x: r, y: o }],
    [{ x: a, y: -o }, { x: a, y: o }]
  ];
  for (const c of l) mh(t, c, s);
  t.restore();
}
function fh(t, e, n = {}, s) {
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
const ph = 150, Rm = { pencil: 44, eraser: 30 };
function gh(t, e, n = {}, s) {
  const i = n.tool ?? "pencil", o = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = ph * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const d = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, f = Et.pencilGrip, g = (T) => {
    const x = T.fingers.thumb, M = T.fingers.index, P = T.fingers.middle, k = Ia([x.points[3], M.points[3], P.points[3]]), A = Ia([x.points[1], M.points[0]]), H = (x.depths[3] + M.depths[3] + P.depths[3]) / 3;
    return { pinch: k, direction: Math.atan2(A.y - k.y, A.x - k.x), depth: H };
  }, p = Ji(f, { size: u }), m = c - g(p).direction, b = Ji(f, { size: u, angle: m * 180 / Math.PI }), S = g(b), w = Rm[i] * a, y = { x: S.pinch.x - Math.cos(c) * w, y: S.pinch.y - Math.sin(c) * w }, v = { x: d.x - y.x, y: d.y - y.y }, E = b.axes.up;
  Lm(t, v, { x: -E.x, y: -E.y }, u, n.arm ?? 300 * a, o, n.sleeve ?? "#5b7db1", r), Lo(t, v, f, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: o,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: S.depth,
      draw: () => {
        t.save(), t.translate(d.x, d.y), t.scale(a, a), i === "eraser" ? fh(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : Cm(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const Ia = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function Lm(t, e, n, s, i, o, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, b) => ({
    x: e.x + n.x * p + l.x * m * b,
    y: e.y + n.y * p + l.y * m * b
  }), u = h(i, 0, 0), d = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, Fm(p)), m;
  }, f = Math.min(s * 0.55, i * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / ph), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(f + 4, -1, c * 1.1).x, h(f + 4, -1, c * 1.1).y), t.lineTo(h(f + 4, 1, c * 1.1).x, h(f + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = o, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(f, -1, c * 1.1).x, h(f, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(f, 1, c * 1.1).x, h(f, 1, c * 1.1).y), t.stroke();
  const g = [h(f, -1, c * 1.3), h(i, -1, c * 1.5), h(i, 1, c * 1.5), h(f, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = d(r), t.fill(), t.strokeStyle = d(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function pk(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, i = n.enter ?? 450, o = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, b) => ({ x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: Co(u.path, m), tool: l(u), lift: 0, drawing: !0 };
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
function gk(t, e, n, s = 0.08, i = 32) {
  const o = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= i; a++) {
    const l = -Math.PI / 2 + o * a / i;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function mk(t) {
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
      const u = t.sketch ? Ui(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : mh(a, An(e, h))), r && h > 0 && h < 1 && gh(a, Co(e, h), r, u);
    }
  };
}
function Fm(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, i, o] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${i}, ${o}, 0)`;
}
function mh(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const Un = 1e5;
function yk(t, e, n, s, i = 6) {
  const o = [], r = Math.max(1, Math.round(i));
  for (let a = 0; a <= r; a++)
    o.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return o;
}
function yh(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const i = An(e, s), o = n / 2, r = (a) => {
    t.beginPath(), t.rect(-Un, -Un, 2 * Un, 2 * Un), a(), t.clip("evenodd");
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
function bk(t, e, n, s, i) {
  t.save(), yh(t, e, n, s), i(), t.restore();
}
function wk(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, i = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(o, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (o.save(), yh(o, e.path, n, l), t.draw(o, r, a), o.restore(), !i || l <= 0 || l >= 1) return;
      const c = Co(e.path, l);
      s ? gh(o, c, { ...s, tool: "eraser" }) : fh(o, c, i);
    }
  };
}
function tr() {
  const t = /* @__PURE__ */ new Map(), e = (n, ...s) => t.set(n, [...t.get(n) ?? [], ...s]);
  return {
    keys: (n) => t.get(n),
    push: e,
    tween(n, s, i, o, r = 300) {
      e(n, { time: o.at, value: s }, { time: o.at + (o.duration ?? r), value: i, ...o.easing ? { easing: o.easing } : {} });
    },
    last(n, s) {
      const i = t.get(n);
      return i ? [...i].sort((o, r) => o.time - r.time)[i.length - 1].value : s;
    },
    valueAt: (n, s) => er(t.get(n), s),
    cutAfter(n, s) {
      for (const i of n) t.set(i, (t.get(i) ?? []).filter((o) => o.time <= s));
    },
    tracks(n) {
      return [...t].filter(([, s]) => s.length > 0).map(([s, i]) => ({
        id: `${n}-${s}`,
        target: n,
        property: s,
        keyframes: Nm(i)
      }));
    }
  };
}
function er(t, e) {
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
function lo(t) {
  const e = [...t ?? []].sort((n, s) => n.time - s.time);
  return e.slice(1).flatMap((n, s) => n.value !== e[s].value ? [{ start: e[s].time, end: n.time }] : []);
}
function Nm(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
const Dm = 16e-4, jm = 0.6, ze = 33;
function nr(t) {
  const e = (o, r) => `piece.${o.id}.${r}`, n = (o, r) => ({
    x: o.home.x + t.valueAt(e(o, "x"), r),
    y: o.home.y + t.valueAt(e(o, "y"), r)
  }), s = (o, r) => {
    const a = t.keys(e(o, "x"));
    if (!a || a.length < 2) return;
    const l = n(o, r - ze), c = n(o, r);
    return { x: (c.x - l.x) / ze, y: (c.y - l.y) / ze };
  }, i = (o, r) => t.cutAfter(["x", "y", "rotate"].map((a) => e(o, a)), r);
  return {
    at: n,
    cutAfter: i,
    follow(o, r) {
      for (const a of r)
        t.push(e(o, "x"), { time: a.time, value: a.x - o.home.x }), t.push(e(o, "y"), { time: a.time, value: a.y - o.home.y });
    },
    fling(o, r) {
      const a = n(o, r.at), l = r.velocity ?? s(o, r.at) ?? { x: 0.5, y: -0.6 }, c = r.gravity ?? Dm, h = r.duration ?? 900, u = (r.spin ?? jm) * (l.x < 0 ? -1 : 1), d = t.valueAt(e(o, "rotate"), r.at);
      i(o, r.at);
      for (let f = 0; f <= h; f += ze) {
        const g = a.x + l.x * f, p = a.y + l.y * f + 0.5 * c * f * f;
        t.push(e(o, "x"), { time: r.at + f, value: g - o.home.x }), t.push(e(o, "y"), { time: r.at + f, value: p - o.home.y }), t.push(e(o, "rotate"), { time: r.at + f, value: d + u * f });
      }
      t.tween(e(o, "opacity"), 1, 0, { at: r.at + h * 0.6, duration: h * 0.4 });
    },
    move(o, r) {
      const a = n(o, r.at);
      t.tween(e(o, "x"), a.x - o.home.x, r.to.x - o.home.x, r, 400), t.tween(e(o, "y"), a.y - o.home.y, r.to.y - o.home.y, r, 400);
    }
  };
}
function bh(t, e, { ground: n, every: s, floors: i }) {
  if (i.every((w) => w.windows.length === 0)) return t;
  const o = t.find((w) => w.target === e && w.property === "y"), r = new zt({ id: `${e}-ride`, tracks: o ? [o] : [] }), a = (w) => o ? Number(r.getStateAtTime(w).values.get(e)?.get("y") ?? 0) : 0, l = (w) => {
    const y = n + a(w);
    return i.findIndex((v) => Math.abs(v.top - y) < 0.5);
  }, c = (o?.keyframes ?? []).map((w) => w.time), h = (w) => {
    const y = (M) => M < 0 ? 0 : i[M].offset(w), v = l(w);
    if (v >= 0) return y(v);
    if (Math.abs(a(w)) < 0.5) return 0;
    const E = (M) => l(M) >= 0 || Math.abs(a(M)) < 0.5, T = [...c].reverse().find((M) => M <= w && E(M)), x = c.find((M) => M >= w && E(M));
    return T === void 0 && x === void 0 ? 0 : T === void 0 ? y(l(x)) : x === void 0 || x === T ? y(l(T)) : y(l(T)) + (y(l(x)) - y(l(T))) * (w - T) / (x - T);
  }, u = i.flatMap((w) => w.windows), d = (w, y) => u.some((v) => v.start < y && v.end > w) || h(w) !== h(y), f = o ? [...o.keyframes] : [{ time: 0, value: 0 }], g = [{ ...f[0], value: f[0].value + h(f[0].time) }], p = (w, y) => {
    const v = /* @__PURE__ */ new Set([y]);
    for (let E = w + s; E < y; E += s) v.add(E);
    for (const E of u) for (const T of [E.start, E.end]) T > w && T < y && v.add(T);
    for (const E of [...v].sort((T, x) => T - x)) g.push({ time: E, value: a(E) + h(E) });
  };
  for (let w = 1; w < f.length; w++) {
    const y = f[w - 1].time, v = f[w].time;
    d(y, v) ? p(y, v) : g.push({ ...f[w], value: f[w].value + h(v) });
  }
  const m = f[f.length - 1].time, b = Math.max(m, ...u.map((w) => w.end));
  b > m && p(m, b);
  const S = { id: o?.id ?? `${e}-y`, target: e, property: "y", keyframes: g };
  return o ? t.map((w) => w === o ? S : w) : [...t, S];
}
function In(t) {
  const e = t.indexOf(":");
  return e < 0 ? { kind: t, rest: "" } : { kind: t.slice(0, e), rest: t.slice(e + 1) };
}
function Xe(t, e, n, s) {
  const i = Object.keys(n.anchors).map((r) => In(r).kind), { kind: o } = In(e);
  return i.includes(o) ? new Error(`${t}: no anchor "${e}"${s ? `: ${s}` : ""} (anchors: ${Object.keys(n.anchors).join(", ")})`) : new Error(`${t}: ${rt("anchor", o, i)} (anchors: ${Object.keys(n.anchors).join(", ")})`);
}
function sr(t, e, n) {
  return new Error(`${t}.edit: ${rt("edit", e, Object.keys(n.edits))}`);
}
function $t(t, e, n, s) {
  return {
    x: t + n / 2,
    y: e + s / 2,
    left: t,
    right: t + n,
    top: e,
    bottom: e + s,
    width: n,
    height: s
  };
}
const Wm = {
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
}, co = ["wipe", "fly", "blur"], cs = {
  kind: "code",
  create: "codePanel({ code, language?, x, y, fontSize?, lineHeight?, width?, hidden? })",
  anchors: {
    box: "the whole panel",
    "line:N": "line N’s text (lines count from 1): stand on top, point at x, y, swipe left to right",
    "token:N:TEXT": "the first TEXT on line N (token:N#K:TEXT for the Kth): a word, which can come loose as a piece",
    "spot:N:C": "a place in line N before column C (0 is before its first character); spot:N:C:W is W characters wide. Aim a put or a write here"
  },
  edits: {
    highlight: "line anchors; { at, duration?, on? }: tint lines (on: false clears)",
    strike: "line anchors; { at, duration? }: strike lines through, left to right",
    remove: "line anchors; { at, duration?, style?: wipe | fly | blur, from?: left | right, close? }: take lines away; the lines below close the gap",
    type: "line anchors given in `hidden`; { at, duration? }: type them in",
    insert: "a spot; { at, text, duration? }: type new text into the line there; the line makes room",
    write: "a token; { at, text, duration? }: write new text into the word’s place",
    drop: "a token; { at, into: a spot, duration? }: put the word into a line there",
    move: "a token; { at, to: an anchor name or { x, y }, duration? }: move the word there",
    fling: "a token; { at, velocity?, spin?, gravity?, duration? }: throw or kick the word away on a spinning arc"
  }
}, Bm = 0.9, qm = 8;
function kk(t) {
  const e = { ...Wm, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, i = (t.lineHeight ?? 1.6) * s, o = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * o, l = Math.max(1, ...n.map((I) => I.length)), c = t.width ?? r * 2 + a + l * o, h = r * 2 + n.length * i, u = t.x + r + a, d = new Set(t.hidden ?? []), f = t.language ?? "plain";
  if (!ho.includes(f)) throw new Error(`codePanel: ${rt("language", f, ho)}`);
  const g = n.map((I) => Xm(I, f).flatMap((R) => Array.from(R.text, () => e[R.kind]))), p = tr(), m = nr(p), b = [], S = /* @__PURE__ */ new Map(), w = [], y = [], v = (I) => {
    if (!Number.isInteger(I) || I < 1 || I > n.length) throw new Error(`codePanel: no line ${I} (it has ${n.length})`);
  }, E = p.tween, T = p.last, x = (I, R, L, $, C, B = 300) => {
    v(I), E(`line.${I}.${R}`, L, $, C, B);
  }, M = (I, R) => b.filter((L) => L.line < I && L.closed <= R).length, P = $t, k = (I) => t.y + r + (I - 1) * i, A = (I) => Array.isArray(I) ? I : [I], H = (I, R, L) => {
    let $ = -1;
    for (let C = 0; C < L; C++)
      if ($ = n[I - 1].indexOf(R, $ + 1), $ < 0) throw new Error(`codePanel: line ${I} has no ${L > 1 ? `${L}th ` : ""}"${R}"`);
    return $;
  }, O = {};
  n.forEach((I, R) => {
    const L = R + 1;
    O[`line.${L}.highlight`] = 0, O[`line.${L}.strike`] = 0, O[`line.${L}.wipe`] = 0, O[`line.${L}.reveal`] = d.has(L) ? 0 : 1, O[`line.${L}.shift`] = 0;
  });
  const _ = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: O,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${f} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return Ym(Object.keys(O));
      },
      actions: wh
    },
    draw(I, R) {
      const L = R.props ?? {}, $ = (K) => Number(L[K] ?? O[K]), C = r + a, B = (K) => r + (K - 1) * i - $(`line.${K}.shift`) * i;
      I.fillStyle = e.background, _a(I, 0, 0, c, h, 8), I.fill(), I.font = `${s}px ${e.font}`, I.textBaseline = "middle", I.textAlign = "left";
      const X = (K, J, tt, N, Y) => {
        const q = n[K - 1];
        for (let V = J; V < tt; V++)
          q[V] !== " " && (I.fillStyle = g[K - 1][V], I.fillText(q[V], N + (V - J) * o, Y));
      };
      I.save(), _a(I, 0, 0, c, h, 8), I.clip(), n.forEach((K, J) => {
        const tt = J + 1, N = $(`line.${tt}.wipe`);
        if (N >= 1) return;
        const Y = B(tt), q = Y + i / 2, V = Math.max(1, K.length) * o, Z = Math.round($(`line.${tt}.reveal`) * K.length), Q = S.get(tt) ?? { style: "wipe", from: "left" };
        I.save(), N > 0 && Km(I, Q, N, { left: C - a, top: Y, width: a + V + o, height: i }, c);
        const et = $(`line.${tt}.highlight`);
        et > 0 && (I.globalAlpha *= Math.min(1, et), I.fillStyle = e.highlight, I.fillRect(C - o / 2, Y, V + o, i), I.globalAlpha /= Math.min(1, et)), a > 0 && Z > 0 && (I.fillStyle = e.gutter, I.textAlign = "right", I.fillText(String(tt), C - o, q), I.textAlign = "left");
        const ut = [
          ...w.filter((G) => G.line === tt).map((G) => ({ column: G.column, length: G.text.length, piece: G, insert: void 0 })),
          ...y.filter((G) => G.line === tt).map((G) => ({ column: G.column, length: 0, piece: void 0, insert: G }))
        ].sort((G, mt) => G.column - mt.column || G.length - mt.length);
        let ct = 0, it = C;
        for (const G of ut) {
          X(tt, ct, Math.min(G.column, Z), it, q), it += (G.column - ct) * o;
          let mt = G.length, dt = "";
          if (G.piece) {
            const z = G.piece.written ?? "", U = $(`piece.${G.piece.id}.write`);
            z && U > 0 ? (dt = z.slice(0, Math.round(U * z.length)), mt = G.length + (z.length - G.length) * Math.min(1, U * 2)) : mt = G.length * (1 - $(`piece.${G.piece.id}.away`));
          } else G.insert && (mt = G.insert.chars * $(`insert.${G.insert.id}.open`), G.insert.text && (dt = G.insert.text.slice(0, Math.round($(`insert.${G.insert.id}.type`) * G.insert.text.length))));
          I.fillStyle = e.text;
          for (let z = 0; z < dt.length; z++) dt[z] !== " " && I.fillText(dt[z], it + z * o, q);
          it += mt * o, ct = G.column + G.length;
        }
        X(tt, ct, Math.max(ct, Z), it, q);
        const gt = $(`line.${tt}.strike`);
        gt > 0 && (I.strokeStyle = e.strike, I.lineWidth = Math.max(1.5, s / 10), I.beginPath(), I.moveTo(C, q), I.lineTo(C + V * Math.min(1, gt), q), I.stroke()), I.restore();
      });
      for (const K of w) {
        const J = $(`piece.${K.id}.opacity`);
        if (J <= 0 || $(`line.${K.line}.wipe`) >= 1) continue;
        const tt = C + (K.column + K.text.length / 2) * o + $(`piece.${K.id}.x`), N = B(K.line) + i / 2 + $(`piece.${K.id}.y`);
        I.save(), I.globalAlpha = Math.min(1, J), I.translate(tt, N), I.rotate($(`piece.${K.id}.rotate`) * Math.PI / 180), X(K.line, K.column, K.column + K.text.length, -K.text.length * o / 2, 0), I.restore();
      }
      I.restore();
    }
  }, D = (I) => {
    const { kind: R, rest: L } = In(I), $ = (C) => Xe("codePanel", I, cs, C);
    if (R === "box") {
      if (L) throw $("box takes no arguments");
      return { kind: R };
    }
    if (R === "line") {
      if (!/^\d+$/.test(L)) throw $("write it line:N");
      return { kind: R, n: Number(L) };
    }
    if (R === "token") {
      const C = /^(\d+)(?:#(\d+))?:(.+)$/.exec(L);
      if (!C) throw $("write it token:N:TEXT, or token:N#K:TEXT for the Kth");
      return { kind: R, n: Number(C[1]), occurrence: C[2] ? Number(C[2]) : 1, text: C[3] };
    }
    if (R === "spot") {
      const C = /^(\d+):(\d+)(?::(\d+))?$/.exec(L);
      if (!C) throw $("write it spot:N:C, or spot:N:C:W for W characters");
      return { kind: R, n: Number(C[1]), column: Number(C[2]), width: C[3] ? Number(C[3]) : 1 };
    }
    throw $();
  }, F = (I, R, L, $ = !1) => {
    const C = Array.isArray(R) ? R : [R];
    if (C.length === 0 || $ && C.length > 1) throw new Error(`codePanel.edit: ${I} takes ${$ ? "one" : "at least one"} ${L} anchor`);
    return C.map((B) => {
      const X = D(B);
      if (X.kind !== L) throw new Error(`codePanel.edit: ${I} takes ${L} anchors (${L}:…), not "${B}"`);
      return X;
    });
  }, W = (I, R) => {
    if (typeof R.text != "string") throw new Error(`codePanel.edit: ${I} needs \`text\` (the text to write)`);
    return R.text;
  }, j = {
    kind: "code",
    about: cs,
    target: _,
    lines: n,
    box: P(t.x, t.y, c, h),
    line(I, R = 1 / 0) {
      return v(I), P(u, k(I) - M(I, R) * i, Math.max(1, n[I - 1].length) * o, i);
    },
    token(I, R, L = 1, $ = 1 / 0) {
      v(I);
      const C = H(I, R, L);
      return P(u + C * o, k(I) - M(I, $) * i, R.length * o, i);
    },
    highlight(I, R) {
      for (const L of A(I)) {
        const $ = T(`line.${L}.highlight`, 0);
        x(L, "highlight", $, R.on === !1 ? 0 : 1, R, 200);
      }
      return j;
    },
    strike(I, R) {
      for (const L of A(I)) x(L, "strike", T(`line.${L}.strike`, 0), 1, R);
      return j;
    },
    remove(I, R) {
      const L = A(I), $ = R.style ?? "wipe";
      if (!co.includes($)) throw new Error(`codePanel.remove: ${rt("style", $, co)}`);
      const C = $ === "wipe" ? 300 : 450, B = R.at + (R.duration ?? C), X = R.close ?? 250;
      for (const K of L)
        x(K, "wipe", 0, 1, { ...R, easing: R.easing ?? ($ === "fly" ? "ease-in" : void 0) }, C), S.set(K, { style: $, from: R.from ?? "left" }), b.push({ line: K, closed: B + X });
      for (let K = 1; K <= n.length; K++) {
        if (L.includes(K)) continue;
        const J = L.filter((N) => N < K).length;
        if (J === 0) continue;
        const tt = T(`line.${K}.shift`, 0);
        x(K, "shift", tt, tt + J, { at: B, duration: X, easing: "ease-in-out" });
      }
      return j;
    },
    type(I, R) {
      return x(I, "reveal", 0, 1, { duration: n[I - 1].length * 45, ...R }), j;
    },
    piece(I, R, L = 1) {
      if (typeof I == "string") {
        const K = D(I);
        if (K.kind !== "token") throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${I}"`);
        return j.piece(K.n, K.text, K.occurrence);
      }
      const $ = I;
      if (R === void 0) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")');
      v($);
      const C = H($, R, L), B = w.find((K) => K.line === $ && K.column === C && K.text === R);
      if (B) return B;
      if (w.some((K) => K.line === $ && C < K.column + K.text.length && K.column < C + R.length))
        throw new Error(`codePanel: "${R}" on line ${$} overlaps another piece`);
      const X = { id: w.length + 1, line: $, column: C, text: R, home: j.token($, R, L, 0) };
      w.push(X);
      for (const K of ["x", "y", "rotate", "write", "away"]) O[`piece.${X.id}.${K}`] = 0;
      return O[`piece.${X.id}.opacity`] = 1, X;
    },
    follow(I, R) {
      return m.follow(I, R), j;
    },
    fling(I, R) {
      return m.fling(I, R), j;
    },
    move(I, R) {
      return m.move(I, R), j;
    },
    write(I, R, L) {
      return I.written = R, E(`piece.${I.id}.write`, 0, 1, { duration: Math.max(1, R.length) * 70, ...L }), j;
    },
    spot(I, R, L = 1, $ = 1 / 0) {
      v(I);
      const C = y.filter((B) => B.line === I && B.column <= R && B.at <= $).reduce((B, X) => B + X.chars, 0);
      return P(u + (R + C) * o, k(I) - M(I, $) * i, L * o, i);
    },
    insert(I, R, L, $) {
      v(I);
      const C = { id: y.length + 1, line: I, column: R, chars: L.length, text: L, at: $.at };
      y.push(C), O[`insert.${C.id}.open`] = 0, O[`insert.${C.id}.type`] = 0;
      const B = $.duration ?? L.length * 70;
      return E(`insert.${C.id}.open`, 0, 1, { at: $.at, duration: B * 0.6, easing: "ease-out" }), E(`insert.${C.id}.type`, 0, 1, { at: $.at, duration: B }), j;
    },
    drop(I, R, L, $) {
      v(R);
      const C = $.duration ?? 250, B = R === I.line, X = $.easing ?? (B ? "linear" : "ease-out"), K = j.landing(I, R, L, $.at), J = { id: y.length + 1, line: R, column: L, chars: I.text.length, at: $.at };
      return y.push(J), O[`insert.${J.id}.open`] = 0, E(`insert.${J.id}.open`, 0, 1, { at: $.at, duration: C, easing: B ? X : "ease-out" }), E(`piece.${I.id}.away`, T(`piece.${I.id}.away`, 0), 1, { at: $.at, duration: C, easing: B ? X : "ease-in-out" }), m.cutAfter(I, $.at), j.move(I, { at: $.at, duration: C, easing: X, to: { x: K.x, y: K.y } }), E(`piece.${I.id}.rotate`, p.valueAt(`piece.${I.id}.rotate`, $.at), 0, { at: $.at, duration: C }), j;
    },
    landing(I, R, L, $ = 1 / 0) {
      const C = j.spot(R, L, I.text.length, $), B = R === I.line && L > I.column ? I.text.length * o : 0;
      return P(C.left - B, C.top, C.width, C.height);
    },
    ride(I, R, L) {
      const $ = n.map((C, B) => {
        const X = p.keys(`line.${B + 1}.shift`) ?? [];
        return { top: k(B + 1), offset: (K) => -er(X, K) * i, windows: lo(X) };
      });
      return bh(I, R, { ground: L.ground, every: L.every ?? ze, floors: $ });
    },
    tracks: p.tracks,
    anchor(I, R = 1 / 0) {
      const L = D(I);
      return L.kind === "box" ? j.box : L.kind === "line" ? j.line(L.n, R) : L.kind === "token" ? j.token(L.n, L.text, L.occurrence, R) : j.spot(L.n, L.column, L.width, R);
    },
    edit(I, R, L) {
      const $ = () => F(I, R, "line").map((C) => C.n);
      if (I === "highlight") return j.highlight($(), L);
      if (I === "strike") return j.strike($(), L);
      if (I === "remove") return j.remove($(), L);
      if (I === "type") {
        for (const C of $()) j.type(C, L);
        return j;
      }
      if (I === "insert") {
        const [C] = F(I, R, "spot", !0);
        return j.insert(C.n, C.column, W(I, L), L);
      }
      if (I === "write" || I === "drop" || I === "move" || I === "fling") {
        const [C] = F(I, R, "token", !0), B = j.piece(C.n, C.text, C.occurrence);
        if (I === "write") return j.write(B, W(I, L), L);
        if (I === "fling") return j.fling(B, L);
        if (I === "drop") {
          const K = typeof L.into == "string" ? D(L.into) : void 0;
          if (K?.kind !== "spot") throw new Error("codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)");
          return j.drop(B, K.n, K.column, L);
        }
        const X = typeof L.to == "string" ? j.anchor(L.to, L.at) : L.to;
        if (!X || typeof X.x != "number" || typeof X.y != "number") throw new Error("codePanel.edit: move needs `to`, an anchor name or { x, y }");
        return j.move(B, { ...L, to: X });
      }
      throw sr("codePanel", I, cs);
    }
  };
  return j;
}
function Km(t, e, n, s, i) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const o = qm * n;
  if (o > 0.2 && "filter" in t && (t.filter = `blur(${o.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * Bm * i, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
const wh = {
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
function Ym(t) {
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
function _a(t, e, n, s, i, o) {
  t.beginPath(), t.moveTo(e + o, n), t.arcTo(e + s, n, e + s, n + i, o), t.arcTo(e + s, n + i, e, n + i, o), t.arcTo(e, n + i, e, n, o), t.arcTo(e, n, e + s, n, o), t.closePath();
}
const Os = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
Os.typescript = [...Os.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const ho = Object.keys(Os), zm = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function Xm(t, e) {
  const n = new Set(Os[e]), s = zm[e], i = [], o = (a, l) => {
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
const Ha = '"Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', Vn = {
  whiteboard: {
    background: "#f7f7f2",
    frame: "#b8bcc4",
    ink: "#1f2a44",
    colors: { ink: "#1f2a44", red: "#d03b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a" },
    font: Ha,
    stroke: 0.09,
    opacity: 1
  },
  chalkboard: {
    background: "#2f4a3a",
    frame: "#7a5a3a",
    ink: "#f1f1e8",
    colors: { ink: "#f1f1e8", red: "#f2a3a3", blue: "#a8c8f0", green: "#b7e4a8", orange: "#f5c98a", yellow: "#f6ef9a" },
    font: Ha,
    stroke: 0.1,
    opacity: 0.9
  }
}, Ca = ["circle", "box", "underline", "arrow"], re = {
  kind: "board",
  create: "whiteboard({ x, y, width, height, theme?: whiteboard | chalkboard, fontSize?, items: [{ id, text, at: [x, y], size?, color?, hidden? } | { id, mark: circle | box | underline | arrow, around? | from?, to?, color?, hidden? }] })",
  anchors: {
    box: "the whole board",
    "text:ID": "a text item: write along it from left to right, point at it",
    "term:ID:TEXT": "the first TEXT in text ID (term:ID#K:TEXT for the Kth): a term, which can come loose as a piece",
    "mark:ID": "a mark (circle, box, underline or arrow)"
  },
  edits: {
    write: "text anchors given `hidden`; { at, duration? }: write them in by hand. Or a term; { at, text, duration? }: write new text in its place (move or erase the term first)",
    draw: "mark anchors given `hidden`; { at, duration? }: draw them in",
    erase: "text, term or mark anchors; { at, duration? }: wipe them off",
    strike: "text or term anchors; { at, duration? }: cross them out",
    move: "a term; { at, to: an anchor name or { x, y }, duration? }: move the term there",
    fling: "a term; { at, velocity?, spin?, gravity?, duration? }: throw or knock the term off on a spinning arc"
  }
}, Ra = 90, La = 300, Um = 0.3;
function vk(t) {
  const e = typeof t.theme == "string" ? t.theme : "whiteboard";
  if (!(e in Vn)) throw new Error(`whiteboard: ${rt("theme", e, Object.keys(Vn))}`);
  const n = typeof t.theme == "object" ? { ...Vn.whiteboard, ...t.theme } : Vn[e], s = t.fontSize ?? 28, i = t.charWidth ?? 0.55, o = (y) => y === void 0 ? n.ink : n.colors[y] ?? y, r = (y) => $t(t.x + y.left, t.y + y.top, y.width, y.height), a = tr(), l = nr(a), c = {}, h = /* @__PURE__ */ new Map(), u = [], d = [], f = (y, v, E, T) => {
    const x = h.get(y);
    if (!x || x.kind !== "text") throw Xe("whiteboard", T, re, `there is no text "${y}" (texts: ${g().join(", ") || "none"})`);
    let M = -1;
    for (let k = 0; k < E; k++)
      if (M = x.item.text.indexOf(v, M + 1), M < 0) throw Xe("whiteboard", T, re, `text "${y}" has no ${E > 1 ? `${E}th ` : ""}"${v}"`);
    const P = x.size * i;
    return { column: M, box: $t(x.box.left + M * P, x.box.top, v.length * P, x.box.height) };
  }, g = () => [...h.values()].filter((y) => y.kind === "text").map((y) => y.item.id), p = (y) => {
    const { kind: v, rest: E } = In(y), T = (x) => Xe("whiteboard", y, re, x);
    if (v === "box") {
      if (E) throw T("box takes no arguments");
      return { kind: v };
    }
    if (v === "text" || v === "mark") {
      if (!E) throw T(`write it ${v}:ID`);
      return { kind: v, id: E };
    }
    if (v === "term") {
      const x = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec(E);
      if (!x) throw T("write it term:ID:TEXT, or term:ID#K:TEXT for the Kth");
      return { kind: v, id: x[1], occurrence: x[2] ? Number(x[2]) : 1, text: x[3] };
    }
    throw T();
  }, m = (y) => {
    const v = p(y);
    if (v.kind === "box") return $t(0, 0, t.width, t.height);
    if (v.kind === "term") return f(v.id, v.text, v.occurrence, y).box;
    const E = h.get(v.id);
    if (!E || E.kind !== v.kind) {
      const T = [...h.values()].filter((x) => x.kind === v.kind).map((x) => x.item.id);
      throw Xe("whiteboard", y, re, `there is no ${v.kind} "${v.id}" (${v.kind}s: ${T.join(", ") || "none"})`);
    }
    return E.box;
  };
  for (const y of t.items ?? []) {
    if (!y || typeof y.id != "string" || !y.id || /[:#]/.test(y.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(y?.id)})`);
    if (h.has(y.id)) throw new Error(`whiteboard: two items are called "${y.id}"`);
    if ("text" in y) {
      if (!Array.isArray(y.at) || y.at.length !== 2 || !y.at.every((M) => typeof M == "number")) throw new Error(`whiteboard: text "${y.id}" needs \`at\`, [x, y] from the board's top-left`);
      const T = y.size ?? s, x = $t(y.at[0], y.at[1], Math.max(1, y.text.length) * T * i, T * 1.3);
      h.set(y.id, { kind: "text", item: y, size: T, color: o(y.color), box: x }), c[`text.${y.id}.write`] = y.hidden ? 0 : 1, c[`text.${y.id}.erase`] = 0;
      continue;
    }
    if (!Ca.includes(y.mark)) throw new Error(`whiteboard: mark "${y.id}": ${rt("mark", y.mark, Ca)}`);
    const v = y.mark === "arrow" ? ["from", "to"] : ["around"];
    for (const T of v) if (typeof y[T] != "string") throw new Error(`whiteboard: ${y.mark} "${y.id}" needs \`${T}\`, a place on the board (an item before it)`);
    const E = Vm(y, m, s);
    h.set(y.id, { kind: "mark", item: y, color: o(y.color), points: E, box: Jm(E) }), c[`mark.${y.id}.draw`] = y.hidden ? 0 : 1, c[`mark.${y.id}.erase`] = 0;
  }
  const b = (y) => u.filter((v) => v.item === y), S = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: c,
    about: {
      kind: "whiteboard",
      summary: `A board with ${h.size} items. Its texts, terms and marks are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      get props() {
        return Qm(Object.keys(c));
      },
      actions: re.edits
    },
    draw(y, v) {
      const E = v.props ?? {}, T = (x) => Number(E[x] ?? c[x] ?? 0);
      y.save(), y.fillStyle = n.background, Zm(y, 0, 0, t.width, t.height, 10), y.fill(), y.lineWidth = Math.max(4, t.width * 0.012), y.strokeStyle = n.frame, y.stroke(), y.textAlign = "center", y.textBaseline = "middle", y.lineCap = "round", y.lineJoin = "round", y.globalAlpha = n.opacity;
      for (const x of h.values()) {
        if (y.save(), Si(y, x.box, T(`${x.kind}.${x.item.id}.erase`)), x.kind === "text") {
          const M = b(x.item.id), P = T(`text.${x.item.id}.write`) * x.item.text.length;
          y.font = `${x.size}px ${n.font}`, y.fillStyle = x.color;
          for (let k = 0; k < Math.ceil(P); k++)
            x.item.text[k] === " " || M.some((A) => k >= A.column && k < A.column + A.text.length) || (y.globalAlpha = n.opacity * Math.min(1, P - k), y.fillText(x.item.text[k], x.box.left + (k + 0.5) * x.size * i, x.box.y));
        } else
          Na(y, x.points, T(`mark.${x.item.id}.draw`), x.color, s * n.stroke, x.item.mark === "arrow");
        y.restore();
      }
      for (const x of d) {
        const M = T(`strike.${x.id}.draw`);
        if (M <= 0) continue;
        const { box: P } = x, k = P.height * 0.15;
        Na(y, [{ x: P.left - 3, y: P.y + k }, { x: P.right + 3, y: P.y - k }], M, n.colors.red ?? n.ink, s * n.stroke * 0.8, !1);
      }
      for (const x of u) {
        const M = h.get(x.item), P = M.size * i;
        y.font = `${M.size}px ${n.font}`, y.fillStyle = M.color;
        const k = x.written;
        if (k) {
          const _ = T(`piece.${x.id}.write`) * k.length, D = x.home.x - t.x - k.length * P / 2;
          for (let F = 0; F < Math.ceil(_); F++)
            k[F] !== " " && (y.globalAlpha = n.opacity * Math.min(1, _ - F), y.fillText(k[F], D + (F + 0.5) * P, x.home.y - t.y));
        }
        const A = T(`piece.${x.id}.opacity`) * Math.min(1, T(`text.${x.item}.write`) * M.item.text.length - x.column);
        if (A <= 0) continue;
        y.save();
        const H = { x: x.home.x - t.x, y: x.home.y - t.y }, O = { x: T(`piece.${x.id}.x`), y: T(`piece.${x.id}.y`) };
        Si(y, $t(H.x + O.x - x.home.width / 2, H.y + O.y - x.home.height / 2, x.home.width, x.home.height), T(`piece.${x.id}.erase`)), Math.hypot(O.x, O.y) < 1 && Si(y, M.box, T(`text.${x.item}.erase`)), y.globalAlpha = n.opacity * Math.min(1, A), y.translate(H.x + O.x, H.y + O.y), y.rotate(T(`piece.${x.id}.rotate`) * Math.PI / 180);
        for (let _ = 0; _ < x.text.length; _++) x.text[_] !== " " && y.fillText(x.text[_], (_ + 0.5 - x.text.length / 2) * P, 0);
        y.restore();
      }
      y.restore();
    }
  }, w = {
    kind: "board",
    about: re,
    target: S,
    box: $t(t.x, t.y, t.width, t.height),
    anchor(y) {
      return r(m(y));
    },
    piece(y) {
      const v = p(y);
      if (v.kind !== "term") throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${y}"`);
      const { column: E, box: T } = f(v.id, v.text, v.occurrence, y), x = u.find((P) => P.item === v.id && P.column === E && P.text === v.text);
      if (x) return x;
      if (u.some((P) => P.item === v.id && E < P.column + P.text.length && P.column < E + v.text.length))
        throw new Error(`whiteboard: "${v.text}" in "${v.id}" overlaps another piece`);
      const M = { id: u.length + 1, item: v.id, column: E, text: v.text, home: r(T) };
      u.push(M);
      for (const P of ["x", "y", "rotate", "erase", "write"]) c[`piece.${M.id}.${P}`] = 0;
      return c[`piece.${M.id}.opacity`] = 1, M;
    },
    edit(y, v, E) {
      const T = Array.isArray(v) ? v : [v];
      if (T.length === 0) throw new Error(`whiteboard.edit: ${y} takes at least one anchor`);
      const x = T.map((k) => ({ name: k, anchor: p(k) }));
      for (const { name: k } of x) m(k);
      const M = (k, A = !1) => {
        const H = x.find((O) => !k.includes(O.anchor.kind));
        if (H) throw new Error(`whiteboard.edit: ${y} takes ${k.join(" or ")} anchors, not "${H.name}"`);
        if (A && x.length > 1) throw new Error(`whiteboard.edit: ${y} takes one ${k.join(" or ")} anchor`);
      }, P = () => w.piece(x[0].name);
      if (y === "write") {
        if (x.some((k) => k.anchor.kind === "term")) {
          if (M(["term"], !0), typeof E.text != "string") throw new Error("whiteboard.edit: write into a term needs `text` (the new text)");
          const k = P();
          return k.written = E.text, a.tween(`piece.${k.id}.write`, 0, 1, { duration: Math.max(La, E.text.length * Ra), ...E }), w;
        }
        M(["text"]);
        for (const { anchor: k } of x) {
          const A = k.id, H = h.get(A).item.text;
          a.tween(`text.${A}.write`, 0, 1, { duration: Math.max(La, H.length * Ra), ...E });
        }
        return w;
      }
      if (y === "draw") {
        M(["mark"]);
        for (const { anchor: k } of x) a.tween(`mark.${k.id}.draw`, 0, 1, { duration: 500, ...E });
        return w;
      }
      if (y === "erase") {
        M(["text", "term", "mark"]);
        for (const k of x) {
          const A = k.anchor.kind === "term" ? `piece.${w.piece(k.name).id}.erase` : `${k.anchor.kind}.${k.anchor.id}.erase`;
          a.tween(A, 0, 1, { duration: 400, ...E });
        }
        return w;
      }
      if (y === "strike") {
        M(["text", "term"]);
        for (const k of x) {
          const A = { id: d.length + 1, box: m(k.name) };
          d.push(A), c[`strike.${A.id}.draw`] = 0, a.tween(`strike.${A.id}.draw`, 0, 1, { duration: 250, ...E });
        }
        return w;
      }
      if (y === "move") {
        M(["term"], !0);
        const k = typeof E.to == "string" ? w.anchor(E.to) : E.to;
        if (!k || typeof k.x != "number" || typeof k.y != "number") throw new Error("whiteboard.edit: move needs `to`, an anchor name or { x, y }");
        return w.move(P(), { ...E, to: k });
      }
      if (y === "fling")
        return M(["term"], !0), w.fling(P(), E);
      throw sr("whiteboard", y, re);
    },
    follow(y, v) {
      return l.follow(y, v), w;
    },
    fling(y, v) {
      return l.fling(y, v), w;
    },
    move(y, v) {
      return l.move(y, v), w;
    },
    ride(y) {
      return y;
    },
    tracks: a.tracks
  };
  return w;
}
function Vm(t, e, n) {
  const s = rn(Xt(t.id)), i = (g) => (s.next() * 2 - 1) * g, o = n * Um;
  if (t.mark === "arrow") {
    const g = e(t.from), p = e(t.to), m = Fa(g, p, o * 0.6), b = Fa(p, g, o * 0.6), S = Math.hypot(b.x - m.x, b.y - m.y) * (0.06 + i(0.04)), w = Gm(m, b), y = { x: (m.x + b.x) / 2 + w.x * S, y: (m.y + b.y) / 2 + w.y * S }, v = [];
    for (let E = 0; E <= 24; E++) {
      const T = E / 24;
      v.push({ x: (1 - T) ** 2 * m.x + 2 * (1 - T) * T * y.x + T * T * b.x, y: (1 - T) ** 2 * m.y + 2 * (1 - T) * T * y.y + T * T * b.y });
    }
    return v;
  }
  const r = e(t.around);
  if (t.mark === "underline") {
    const g = r.bottom + o * 0.4;
    return [
      { x: r.left - o * 0.3, y: g + i(2) },
      { x: r.x, y: g + 2 + i(2) },
      { x: r.right + o * 0.5, y: g - 1 + i(3) }
    ];
  }
  if (t.mark === "box") {
    const g = r.left - o, p = r.right + o, m = r.top - o * 0.6, b = r.bottom + o * 0.6, S = (y, v) => ({ x: y + i(o * 0.2), y: v + i(o * 0.2) }), w = S(g, m);
    return [w, S(p, m), S(p, b), S(g, b), w, { x: w.x + o * 0.8, y: w.y + i(2) }];
  }
  const a = r.width / 2 + o, l = r.height / 2 + o * 0.6, c = -2.2 + i(0.3), h = s.next() * Math.PI * 2, u = 1.12, d = 64, f = [];
  for (let g = 0; g <= d * u; g++) {
    const p = g / d, m = c + p * Math.PI * 2, b = 1 + 0.035 * Math.sin(p * Math.PI * 4 + h) + 0.06 * p;
    f.push({ x: r.x + Math.cos(m) * a * b, y: r.y + Math.sin(m) * l * b });
  }
  return f;
}
function Fa(t, e, n) {
  const s = e.x - t.x, i = e.y - t.y;
  if (s === 0 && i === 0) return { x: t.x, y: t.y };
  const o = Math.min(s === 0 ? 1 / 0 : (t.width / 2 + n) / Math.abs(s), i === 0 ? 1 / 0 : (t.height / 2 + n) / Math.abs(i));
  return { x: t.x + s * o, y: t.y + i * o };
}
function Gm(t, e) {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: -(e.y - t.y) / n, y: (e.x - t.x) / n };
}
function Jm(t) {
  const e = t.map((o) => o.x), n = t.map((o) => o.y), s = Math.min(...e), i = Math.min(...n);
  return $t(s, i, Math.max(...e) - s, Math.max(...n) - i);
}
function Na(t, e, n, s, i, o) {
  if (n <= 0 || e.length < 2) return;
  const r = [0];
  for (let g = 1; g < e.length; g++) r.push(r[g - 1] + Math.hypot(e[g].x - e[g - 1].x, e[g].y - e[g - 1].y));
  const l = r[r.length - 1] * Math.min(1, n / (o ? 0.85 : 1));
  t.strokeStyle = s, t.lineWidth = i, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let g = 1; g < e.length; g++) {
    if (r[g] <= l) {
      t.lineTo(e[g].x, e[g].y);
      continue;
    }
    const p = (l - r[g - 1]) / (r[g] - r[g - 1] || 1);
    t.lineTo(e[g - 1].x + (e[g].x - e[g - 1].x) * p, e[g - 1].y + (e[g].y - e[g - 1].y) * p);
    break;
  }
  if (t.stroke(), !o || n <= 0.85) return;
  const c = (n - 0.85) / 0.15, h = e[e.length - 1], u = e[e.length - 3] ?? e[0], d = Math.atan2(h.y - u.y, h.x - u.x), f = i * 4.5 * c;
  t.beginPath();
  for (const g of [-1, 1])
    t.moveTo(h.x, h.y), t.lineTo(h.x - Math.cos(d + g * 0.45) * f, h.y - Math.sin(d + g * 0.45) * f);
  t.stroke();
}
function Si(t, e, n) {
  if (n <= 0) return;
  const s = 8;
  t.beginPath(), t.rect(e.left - s + n * (e.width + s * 2), e.top - s * 4, (1 - n) * (e.width + s * 2), e.height + s * 8), t.clip();
}
function Zm(t, e, n, s, i, o) {
  t.beginPath(), t.moveTo(e + o, n), t.arcTo(e + s, n, e + s, n + i, o), t.arcTo(e + s, n + i, e, n + i, o), t.arcTo(e, n + i, e, n, o), t.arcTo(e, n, e + s, n, o), t.closePath();
}
function Qm(t) {
  const e = [
    [/^text\..+\.write$/, { description: "How much of the text is written", unit: "0..1", min: 0, max: 1 }],
    [/^(text|mark)\..+\.erase$/, { description: "How far it has been wiped off, left to right", unit: "0..1", min: 0, max: 1 }],
    [/^mark\..+\.draw$/, { description: "How much of the mark is drawn", unit: "0..1", min: 0, max: 1 }],
    [/^strike\.\d+\.draw$/, { description: "How far the strike-through has drawn", unit: "0..1", min: 0, max: 1 }],
    [/^piece\.\d+\.(x|y)$/, { description: "The term moved from its home", unit: "px" }],
    [/^piece\.\d+\.rotate$/, { description: "The term turned", unit: "degrees" }],
    [/^piece\.\d+\.opacity$/, { description: "How opaque the term is", unit: "0..1", min: 0, max: 1 }],
    [/^piece\.\d+\.erase$/, { description: "How far the term has been wiped off", unit: "0..1", min: 0, max: 1 }],
    [/^piece\.\d+\.write$/, { description: "How much of the text written into its place is written", unit: "0..1", min: 0, max: 1 }]
  ], n = {};
  for (const s of t) {
    const i = e.find(([o]) => o.test(s));
    i && (n[s] = i[1]);
  }
  return n;
}
const Da = ["bar", "line"], Gn = {
  light: { background: "#ffffff", text: "#3b4252", grid: "#d8dee9", color: "#4c7bd9", highlight: "#e8833a", font: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
  dark: { background: "#1e2230", text: "#cdd6f4", grid: "#3a4055", color: "#89b4fa", highlight: "#fab387", font: 'system-ui, -apple-system, "Segoe UI", sans-serif' }
}, Ke = {
  kind: "chart",
  create: "chart({ x, y, width, height, kind: bar | line, data: [{ id, label?, value, hidden? }], max?, title?, theme?: light | dark, decimals?, prefix?, suffix?, values? })",
  anchors: {
    box: "the whole chart",
    "bar:ID": "a bar (bar charts), as it stands at the time: stand on its top (it carries a figure as it grows), point at it",
    "point:ID": "a point on the line (line charts), as it stands at the time",
    "label:ID": "its label under the axis",
    "value:ID": "its value label, above it"
  },
  edits: {
    set: "bar or point anchors; { at, value, duration? }: animate to a new value; its value label counts along",
    show: "bar or point anchors given `hidden`; { at, duration?, on? }: grow a bar in from the axis, or draw the line out to a point (on: false takes it back)",
    highlight: "bar or point anchors; { at, duration?, on? }: colour it out (on: false clears)"
  }
}, t1 = 600, e1 = 500, n1 = 200;
function Mk(t) {
  if (!Da.includes(t.kind)) throw new Error(`chart: ${rt("kind", t.kind, Da)}`);
  const e = typeof t.theme == "string" ? t.theme : "light";
  if (!(e in Gn)) throw new Error(`chart: ${rt("theme", e, Object.keys(Gn))}`);
  const n = typeof t.theme == "object" ? { ...Gn.light, ...t.theme } : Gn[e];
  if (!Array.isArray(t.data) || t.data.length === 0) throw new Error("chart: `data` needs at least one { id, value }");
  const s = /* @__PURE__ */ new Set();
  for (const k of t.data) {
    if (typeof k?.id != "string" || !k.id || k.id.includes(":")) throw new Error(`chart: every datum needs an \`id\` without ":" (got ${JSON.stringify(k?.id)})`);
    if (s.has(k.id)) throw new Error(`chart: two data are called "${k.id}"`);
    if (typeof k.value != "number" || !Number.isFinite(k.value)) throw new Error(`chart: "${k.id}" needs a \`value\`, a number`);
    s.add(k.id);
  }
  const i = t.kind, o = i === "bar" ? "bar" : "point", r = t.max ?? s1(Math.max(...t.data.map((k) => k.value)) * 1.1);
  if (!(r > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${r})`);
  const a = Math.max(10, Math.min(16, t.height / 20)), l = {
    left: a * 3.6,
    right: t.width - a,
    top: t.title ? a * 3 : a * 1.6,
    bottom: t.height - a * 2.4
  }, c = l.bottom - l.top, h = (l.right - l.left) / t.data.length, u = h * 0.6, d = Math.max(4, a * 0.35), f = c / r, g = new Map(t.data.map((k, A) => [k.id, A])), p = (k) => l.left + h * (g.get(k) + 0.5), m = tr(), b = nr(m), S = {};
  for (const k of t.data)
    S[`${o}.${k.id}.value`] = k.value, S[`${o}.${k.id}.show`] = k.hidden ? 0 : 1, S[`${o}.${k.id}.highlight`] = 0;
  const w = (k, A) => m.keys(k)?.length ? er(m.keys(k), A) : S[k], y = (k, A) => w(`${o}.${k}.value`, A) * (i === "bar" ? w(`${o}.${k}.show`, A) : 1) * f, v = (k) => {
    const { kind: A, rest: H } = In(k), O = (_) => Xe("chart", k, Ke, _);
    if (A === "box") {
      if (H) throw O("box takes no arguments");
      return { kind: "box" };
    }
    if (A === "bar" || A === "point" || A === "label" || A === "value") {
      if (!H) throw O(`write it ${A}:ID`);
      if (!g.has(H)) throw O(`there is no "${H}" (data: ${[...g.keys()].join(", ")})`);
      if ((A === "bar" || A === "point") && A !== o) throw O(`a ${i} chart has ${o}s, not ${A}s: ${o}:${H}`);
      return { kind: A, id: H };
    }
    throw O();
  }, E = (k, A) => {
    if (k.kind === "box") return $t(0, 0, t.width, t.height);
    const H = p(k.id), O = l.bottom - y(k.id, A);
    if (k.kind === "bar") return $t(H - u / 2, O, u, l.bottom - O);
    if (k.kind === "point") return $t(H - d, O - d, d * 2, d * 2);
    if (k.kind === "label") return $t(H - h / 2, l.bottom + a * 0.4, h, a * 1.4);
    const _ = O - (i === "line" ? d : 0) - a * 0.3;
    return $t(H - h / 2, _ - a * 1.3, h, a * 1.3);
  }, T = (k) => $t(t.x + k.left, t.y + k.top, k.width, k.height), x = (k) => `${t.prefix ?? ""}${k.toFixed(t.decimals ?? 0)}${t.suffix ?? ""}`, M = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: S,
    about: {
      kind: `${i} chart`,
      summary: `A ${i} chart of ${t.data.length} values (${t.data.map((k) => k.id).join(", ")}), scaled to ${r}. Its ${o}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(S).map((k) => [k, a1(k)])),
      actions: Ke.edits
    },
    draw(k, A) {
      const H = A.props ?? {}, O = (F) => Number(H[F] ?? S[F] ?? 0);
      k.save(), k.fillStyle = n.background, o1(k, 0, 0, t.width, t.height, 8), k.fill(), k.font = `${a}px ${n.font}`, k.textBaseline = "middle", t.title && (k.fillStyle = n.text, k.textAlign = "left", k.font = `600 ${a * 1.2}px ${n.font}`, k.fillText(t.title, l.left, a * 1.5), k.font = `${a}px ${n.font}`), k.lineWidth = 1, k.textAlign = "right";
      for (let F = 0; F <= 4; F++) {
        const W = l.bottom - c * F / 4;
        k.strokeStyle = n.grid, k.beginPath(), k.moveTo(l.left, W), k.lineTo(l.right, W), k.stroke(), k.fillStyle = n.text, k.globalAlpha = 0.7, k.fillText(i1(r * F / 4), l.left - a * 0.5, W), k.globalAlpha = 1;
      }
      const _ = (F) => O(`${o}.${F}.value`) * (i === "bar" ? O(`${o}.${F}.show`) : 1) * f, D = (F) => ja(n.color, n.highlight, O(`${o}.${F}.highlight`));
      i === "line" && (k.lineWidth = Math.max(2, a * 0.2), k.lineJoin = "round", k.lineCap = "round", k.strokeStyle = n.color, k.beginPath(), t.data.forEach((F, W) => {
        const j = { x: p(F.id), y: l.bottom - _(F.id) }, I = O(`point.${F.id}.show`);
        if (W === 0) {
          I > 0 && k.moveTo(j.x, j.y);
          return;
        }
        const R = t.data[W - 1];
        if (O(`point.${R.id}.show`) < 1 || I <= 0) return;
        const L = { x: p(R.id), y: l.bottom - _(R.id) };
        k.lineTo(L.x + (j.x - L.x) * I, L.y + (j.y - L.y) * I);
      }), k.stroke()), k.textAlign = "center";
      for (const F of t.data) {
        const W = p(F.id), j = _(F.id), I = O(`${o}.${F.id}.show`);
        if (k.fillStyle = D(F.id), i === "bar" ? j > 0.5 && (r1(k, W - u / 2, l.bottom - j, u, j, Math.min(6, u / 4)), k.fill()) : I > 0 && (k.beginPath(), k.arc(W, l.bottom - j, d * Math.min(1, I * 1.5) * (1 + 0.3 * O(`point.${F.id}.highlight`)), 0, Math.PI * 2), k.fill()), k.fillStyle = n.text, k.fillText(F.label ?? F.id, W, l.bottom + a * 1.1), t.values !== !1 && I > 0) {
          k.globalAlpha = Math.min(1, I * 2), k.font = `600 ${a}px ${n.font}`, k.fillStyle = ja(n.text, n.highlight, O(`${o}.${F.id}.highlight`));
          const R = l.bottom - j - (i === "line" ? d : 0) - a * 0.95;
          k.fillText(x(O(`${o}.${F.id}.value`)), W, R), k.font = `${a}px ${n.font}`, k.globalAlpha = 1;
        }
      }
      k.strokeStyle = n.text, k.lineWidth = 1.5, k.beginPath(), k.moveTo(l.left, l.bottom), k.lineTo(l.right, l.bottom), k.stroke(), k.restore();
    }
  }, P = {
    kind: "chart",
    chartKind: i,
    about: Ke,
    target: M,
    max: r,
    box: $t(t.x, t.y, t.width, t.height),
    anchor(k, A = 1 / 0) {
      return T(E(v(k), A));
    },
    piece(k) {
      throw new Error(`chart: a chart has no pieces to come loose ("${k}"); change it with edit('set' | 'show' | 'highlight', …)`);
    },
    edit(k, A, H) {
      const O = Array.isArray(A) ? A : [A];
      if (O.length === 0) throw new Error(`chart.edit: ${k} takes at least one anchor`);
      if (!(k in Ke.edits)) throw sr("chart", k, Ke);
      const _ = O.map((D) => {
        const F = v(D);
        if (F.kind !== o) throw new Error(`chart.edit: ${k} takes ${o} anchors (${o}:ID), not "${D}"`);
        return F.id;
      });
      for (const D of _) {
        const F = (W) => `${o}.${D}.${W}`;
        if (k === "set") {
          if (typeof H.value != "number" || !Number.isFinite(H.value)) throw new Error("chart.edit: set needs `value`, a number");
          m.tween(F("value"), w(F("value"), H.at), H.value, H, t1);
        } else k === "show" ? m.tween(F("show"), w(F("show"), H.at), H.on === !1 ? 0 : 1, H, e1) : m.tween(F("highlight"), w(F("highlight"), H.at), H.on === !1 ? 0 : 1, H, n1);
      }
      return P;
    },
    follow(k, A) {
      return b.follow(k, A), P;
    },
    fling(k, A) {
      return b.fling(k, A), P;
    },
    move(k, A) {
      return b.move(k, A), P;
    },
    ride(k, A, H) {
      if (i !== "bar") return k;
      const O = t.data.map((_) => {
        const D = y(_.id, 0), F = [...lo(m.keys(`bar.${_.id}.value`)), ...lo(m.keys(`bar.${_.id}.show`))];
        return { top: t.y + l.bottom - D, offset: (W) => D - y(_.id, W), windows: F };
      });
      return bh(k, A, { ground: H.ground, every: H.every ?? ze, floors: O });
    },
    tracks: m.tracks
  };
  return P;
}
function s1(t) {
  if (!(t > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(t));
  for (const n of [1, 2, 2.5, 5, 10]) if (n * e >= t - 1e-9) return n * e;
  return 10 * e;
}
function i1(t) {
  return Number.isInteger(t) ? String(t) : String(Number(t.toFixed(2)));
}
function ja(t, e, n) {
  if (n <= 0) return t;
  if (n >= 1) return e;
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(t) || !/^#[0-9a-f]{6}$/i.test(e)) return n < 0.5 ? t : e;
  const [i, o] = [s(t), s(e)];
  return `#${i.map((r, a) => Math.round(r + (o[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}
function o1(t, e, n, s, i, o) {
  t.beginPath(), t.moveTo(e + o, n), t.arcTo(e + s, n, e + s, n + i, o), t.arcTo(e + s, n + i, e, n + i, o), t.arcTo(e, n + i, e, n, o), t.arcTo(e, n, e + s, n, o), t.closePath();
}
function r1(t, e, n, s, i, o) {
  const r = Math.min(o, i);
  t.beginPath(), t.moveTo(e, n + i), t.lineTo(e, n + r), t.arcTo(e, n, e + r, n, r), t.lineTo(e + s - r, n), t.arcTo(e + s, n, e + s, n + r, r), t.lineTo(e + s, n + i), t.closePath();
}
function a1(t) {
  return t.endsWith(".value") ? { description: "Its value (the bar’s height or the point’s, and its value label)", unit: "value" } : t.endsWith(".show") ? { description: "How much of it is shown: a bar grown in from the axis, the line drawn out to the point", unit: "0..1", min: 0, max: 1 } : { description: "How much it is coloured out", unit: "0..1", min: 0, max: 1 };
}
const l1 = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1);
function Sk(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = (a) => a.lineWidth * 0.45, i = (a, l, c) => {
    const h = a.parts[`leg.${c}`].points;
    l.shape(rs(h, a.height * 0.08, a.height * 0.05), n, s(a));
  }, o = (a, l) => {
    const c = a.chains.spine, h = c[0], u = c[c.length - 1], d = { x: h.x - (u.x - h.x) * 0.25, y: h.y - (u.y - h.y) * 0.25 };
    l.shape(rs([d, ...a.parts.spine.points], a.height * 0.15, a.height * 0.14), e, s(a));
  }, r = (a, l, c) => {
    const h = a.parts[`arm.${c}`].points, u = h[0], d = a.chains.spine[a.chains.spine.length - 1], g = [{ x: u.x + (d.x - u.x) * 0.45, y: u.y + (d.y - u.y) * 0.45 }, ...l1(h, 0, 0.45)], p = rs(g, a.height * 0.085, a.height * 0.06), m = g.length, b = p.slice(0, m), S = p.slice(m).reverse();
    l.shape(p, e, 0);
    const w = (E) => Math.hypot(E[1].x - d.x, E[1].y - d.y), [y, v] = w(b) > w(S) ? [b, S] : [S, b];
    l.line(y.slice(1), s(a)), l.line(v.slice(Math.ceil(m * 0.45)), s(a)), l.line([b[m - 1], S[m - 1]], s(a));
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
const Ge = {
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
function kh(t) {
  if (t === void 0) return Ge.full;
  if (typeof t == "string") return Ge[t];
  const { base: e, ...n } = t;
  return { ...Ge[e ?? "full"], ...n };
}
const uo = 160, c1 = 120, h1 = 700, Ti = 60, u1 = 90, Jn = 3200, Je = 1, Te = 1e-6;
function ir(t, e, n = {}) {
  const s = kh(n.style), i = n.seed ?? 1, o = {};
  if (t.length === 0) return o;
  const r = Object.keys(t[0].pose).filter((u) => t.some((d) => Math.abs(d.pose[u] - t[0].pose[u]) > Te));
  for (const u of r) o[u] = d1(u, t, e, s, i);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = f1(t, e, s, i, t[0].pose[a]);
    u.length > 0 && (o[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = p1(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (o[h] = u);
  }
  return o;
}
function d1(t, e, n, s, i) {
  const o = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = o ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (f) => {
    const g = (e[f].time - e[f - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (f, g, p) => {
    const m = h[h.length - 1];
    if (f <= m.time + Je) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: f, value: g, ...p ? { easing: p } : {} });
  };
  let d = e[0].pose[t];
  for (let f = 1; f < e.length; f++) {
    const g = e[f], p = e[f - 1].pose[t], m = g.pose[t], b = m - p, S = h[h.length - 1].time, w = g.act !== !1;
    if (Math.abs(b) <= Te) {
      const k = g.time + (w ? c(f) : 0);
      if (f === e.length - 1)
        Math.abs(d - m) > Te && u(Math.max(k, S + uo), m, "ease-in-out"), d = m;
      else if (w && a && s.drift > 0 && n.drift.includes(t) && k - S >= h1) {
        const A = Xt(`${i}:${t}:${f}`) % 2 === 0 ? 1 : -1;
        d = m + A * s.drift * r, u(k, d, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      u(e[f - 1].time, d), u(g.time, m, g.easing), d = m;
      continue;
    }
    const y = c(f), v = Math.max(e[f - 1].time + y, S);
    let E = g.time + y;
    o && s.eyeDart > 0 && (E = Math.min(E, v + s.eyeDart));
    const T = E - v;
    if (T <= Je) {
      u(g.time, m, g.easing), d = m;
      continue;
    }
    u(v, d);
    const x = Math.sign(b);
    if (a && s.anticipation > 0 && r > 0 && T >= uo) {
      const k = d - x * Math.min(Math.abs(b) * s.anticipation, r), A = v + T * s.anticipationTime;
      u(A, k, "ease-in-out"), s.hold > 0 && u(A + T * s.hold, k);
    }
    const M = f + 1 < e.length ? e[f + 1].time - g.time : 1 / 0, P = Math.min(s.settle, M / 2);
    if (a && s.overshoot > 0 && r > 0 && T >= c1 && P > Je) {
      const k = Math.min(Math.abs(b) * s.overshoot, r);
      u(E, m + x * k, g.easing ?? s.actionEase), u(E + P, m, s.settleEase);
    } else
      u(E, m, g.easing ?? s.actionEase);
    d = m;
  }
  return h;
}
function f1(t, e, n, s, i) {
  const o = [], r = Ti + u1;
  for (let f = 1; f < t.length; f++) {
    const g = t[f - 1].pose, p = t[f].pose;
    Object.entries(e.headTurns).some(([b, S]) => Math.abs((p[b] ?? 0) - (g[b] ?? 0)) > S) && t[f].act !== !1 && o.push(Math.max(t[0].time, t[f - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...o];
  let h = a + Jn * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Jn / 2) || o.push(h);
    const g = (Xt(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (Jn * 0.66);
    h += Jn + g;
  }
  o.sort((f, g) => f - g);
  const d = [{ time: a, value: i }];
  for (const f of o) {
    const g = d[d.length - 1].time;
    f + Ti <= g + Je || (f > g + Je && d.push({ time: f, value: i }), d.push({ time: f + Ti, value: 1, easing: "ease-in" }), d.push({ time: f + r, value: i, easing: "ease-out" }));
  }
  return d.length > 1 ? d : [];
}
function p1(t, e, n, s) {
  const i = n * (1 - 0.18 * s), o = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + Je || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, d = t[l].time, f = d - u;
    if (!(f < uo || t[l].act === !1)) {
      if (c <= Te && h > Te)
        a(u, n), a(u + f * 0.2, i, "ease-out"), a(u + f * 0.45, o, "ease-out"), a(d, n, "ease-in-out");
      else if (c > Te && h <= Te) {
        const g = l + 1 < t.length ? t[l + 1].time - d : 400;
        a(u + f * 0.5, n), a(d - Math.min(60, f * 0.15), o, "ease-in"), a(d, i, "ease-out"), a(d + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const g1 = {
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
function m1(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function y1() {
  const t = {}, e = {};
  for (const n of Object.keys(pt)) {
    const s = m1(n);
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
const b1 = y1();
function vh(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function w1(t, e, n = {}) {
  const s = jc(e), i = e.map((o, r) => ({ time: o.time, pose: { ...s[r] }, easing: o.easing, act: o.act }));
  return vh(t, ir(i, n.rig ?? g1, n));
}
function Tk(t, e, n = {}) {
  const s = n.rest ?? pt, i = Qc(e, s), o = e.map((r, a) => ({ time: r.time, pose: { ...s, ...i[a] }, easing: r.easing, act: r.act }));
  return vh(t, ir(o, n.rig ?? b1, n));
}
const Wa = lt.shocked, k1 = lt.scared, _e = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...Wa, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...lt.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...Wa, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...lt.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: t.leftShoulder, rightShoulder: t.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: nt.leftHip, rightHip: nt.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...k1, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...jt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function Ba(t, e) {
  const n = typeof e.from == "string" ? jt[e.from] : e.from ?? nt;
  return Mh(_e[t](n), { ...e, from: n });
}
function Mh(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((i) => (s = { ...s, ...i.pose }, { time: e.at + i.after * n, pose: s, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function Is(t, e = 1) {
  const n = _e[t](nt);
  return n[n.length - 1].after * e;
}
function v1(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), i = n.spacing ?? 5, o = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * i, c = Math.floor(Math.abs(l) / Math.max(i, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], d = e[h], f = d.x - u.x, g = d.y - u.y, p = Math.hypot(f, g) || 1, m = -g / p, b = f / p, S = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - S), t.lineWidth = o * (1 - S * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + b * l), t.lineTo(d.x + m * l, d.y + b * l), t.stroke();
    }
  }
  t.restore();
}
const M1 = {
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
function xk(t, e, n, s, i = {}) {
  const o = n.stateAt;
  if (!o) return;
  const r = i.length ?? 120, a = Math.max(2, Math.round(i.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let f = 0; f < a; f++) {
    const g = l + (n.time - l) * f / (a - 1);
    c.push(Dc(e, { time: g, state: o(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (i.threshold ?? 1.2) * h, d = (i.parts ?? ["hands", "toes", "head"]).flatMap((f) => M1[f]);
  for (const f of d) {
    const g = c.map(f.at);
    let p = 0;
    for (let S = 1; S < g.length; S++) p += Math.hypot(g[S].x - g[S - 1].x, g[S].y - g[S - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const b = Math.min(1, (m - u) / (u * 0.5));
    v1(t, g, { ...i, opacity: (i.opacity ?? 0.7) * b, spacing: i.spacing ?? h * 0.02 });
  }
}
function S1(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, i * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = Xt(`${o}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * i * 0.3 * r, u = e.y - i * (0.06 + 0.12 * l) * r + Math.abs(c) * i * 0.03, d = i * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, d, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function Ek(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const i = s.size ?? 40, o = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, i * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < o; a++) {
    const l = -Math.PI / 2 + (a - (o - 1) / 2) * Math.PI / (o + 1), c = i * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    T1(t, h, u, i * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function T1(t, e, n, s, i) {
  t.beginPath();
  for (let o = 0; o < 10; o++) {
    const r = o % 2 === 0 ? s : s * 0.45, a = i + o * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    o === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const be = {
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
}, pn = 1, Zn = 0.55, qa = 0.35, x1 = 1.6, Ka = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, Ya = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, za = {
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
}, Xa = {
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
}, E1 = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, A1 = "्", Ua = "़", $1 = (t) => t >= "क" && t <= "ह", Va = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function P1(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (i, o) => {
    const r = e[e.length - 1];
    r && r.viseme === i ? r.weight += o * 0.5 : e.push({ viseme: i, weight: o });
  };
  for (let i = 0; i < n.length; i++) {
    const o = n[i], r = n[i + 1];
    if (Va.has(o)) s("rest", x1);
    else if (/\s/.test(o)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: qa });
    } else if ((o === "o" || o === "e") && r === o)
      s(o === "o" ? "u" : "i", pn), i++;
    else if (o in Ka) s(Ka[o], pn);
    else if (o in Ya) s(Ya[o], Zn);
    else {
      if (o === "h") continue;
      if (/[a-z]/.test(o)) s("c", Zn);
      else if (o in za) s(za[o], pn);
      else if ($1(o)) {
        const a = r === Ua ? o === "फ" ? "f" : void 0 : E1[o];
        s(a ?? "c", Zn);
        let l = i + 1;
        n[l] === Ua && l++;
        const c = n[l];
        c === A1 ? i = l : c && c in Xa ? (s(Xa[c], pn), i = l) : (!c || /\s/.test(c) || Va.has(c) || s("a", pn * 0.6), i = l - 1);
      } else (o === "ं" || o === "ँ") && s("l", Zn * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === qa); ) e.pop();
  return e;
}
function Sh(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", i = e.energy ?? 1, o = P1(t.text), r = [{ time: t.start, value: be.rest.mouth }], a = [{ time: t.start, value: be.rest.mouthWidth }], l = o.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of o) {
      const d = c * u.weight / l, f = h + Math.min(d * 0.4, 60);
      if (f > r[r.length - 1].time) {
        const g = be[u.viseme];
        r.push({ time: f, value: g.mouth * i, easing: "ease-out" }), a.push({ time: f, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, i), easing: "ease-out" });
      }
      h += d;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: be.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: be.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function Ak(t, e, n = {}) {
  const s = {};
  for (const i of [...e].sort((o, r) => o.start - r.start))
    for (const [o, r] of Object.entries(Sh(i, n))) {
      const a = s[o] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([i, o]) => ({ id: `${t}-${i}`, target: t, property: i, keyframes: o }));
}
function O1(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const i = s.fields?.mouth ?? "mouth", o = s.fields?.mouthWidth ?? "mouthWidth", r = { [i]: be.rest.mouth, [o]: be.rest.mouthWidth, ...s.rest }, a = new zt({ id: "before-speech", tracks: e }), l = (u, d) => a.getStateAtTime(d).values.get(t)?.get(u) ?? r[u], c = [i, o], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const d = e.find((g) => g.target === t && g.property === u);
    let f = d ? [...d.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = Sh(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, f = [...f.filter((m) => m.time < g.start || m.time > g.end), ...p], f.sort((m, b) => m.time - b.time);
    }
    h.push({ id: d?.id ?? `${t}-${u}`, target: t, property: u, keyframes: f });
  }
  return h;
}
const zs = {
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
function Th(t = {}) {
  return [
    ...Object.keys(Rt),
    ...Object.keys(jt),
    ...Object.keys(_e),
    ...Object.keys(zs),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function xh(t = {}) {
  const e = new Set(Th()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function Eh(t = {}) {
  const e = {};
  for (const n of Object.keys(Rt)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(jt)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(_e)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(zs)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const fo = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], I1 = {
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
}, Qn = ["viewer", "ahead", "back"], me = (t) => typeof t == "number" && Number.isFinite(t);
function _s(t, e = {}) {
  const n = xh(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = Th(e), i = (l) => l in Rt || l in (e.gaits ?? {}), o = Object.keys(lt), r = Object.keys(nt);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), u = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const d = l;
    for (const p of Object.keys(d))
      fo.includes(p) || h(rt("beat field", p, fo, I1[p.toLowerCase()]));
    const f = d.do;
    if (f === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof f != "string" || !s.includes(f)) {
      h(rt("action", f, s));
      return;
    }
    const g = zs[f] ?? e.actions?.[f];
    for (const p of g?.needs ?? [])
      d[p] === void 0 && h(`\`${f}\` needs \`${p}\`.`);
    if (i(f) && d.to === void 0 && u(`\`${f}\` without \`to\` walks nowhere.`), f === "leap" && d.to === void 0 && d.onto === void 0 && u("`leap` without `to` or `onto` jumps on the spot."), d.mood !== void 0 && (typeof d.mood != "string" || !o.includes(d.mood)) && h(rt("mood", d.mood, o)), d.pose !== void 0)
      if (!d.pose || typeof d.pose != "object" || Array.isArray(d.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(d.pose))
          r.includes(p) ? me(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(rt("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = d[p];
      m !== void 0 && !(me(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    me(d.at) && (d.at < a && u(`\`at\` ${d.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = d.at);
    for (const p of ["to", "onto"]) {
      const m = d[p];
      m !== void 0 && !me(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (d.toward !== void 0 && !me(d.toward) && !Qn.includes(d.toward) && h(`\`toward\` is a scene x or one of ${Qn.join(", ")}${typeof d.toward == "string" && gs(d.toward, Qn) ? ` (did you mean "${gs(d.toward, Qn)}"?)` : ""} (got ${JSON.stringify(d.toward)}).`), d.say !== void 0 && typeof d.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(d.say)}).`), d.target !== void 0) {
      const p = d.target;
      (!p || typeof p != "object" || !me(p.x) || !me(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function Ga(t, e = {}, n = "scriptTracks") {
  const s = _s(t, e).filter((i) => i.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((i) => `  ${i.beat >= 0 ? `beat ${i.beat}: ` : ""}${i.message}`).join(`
`)}`);
}
F0(Eh);
function $k(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function Pk(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const Ja = 8;
function or(t, e = {}, n = 0) {
  if (n > Ja) throw new Error(`scriptTracks: custom actions nest more than ${Ja} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const i = e[s.do];
    if (!i || !("beats" in i)) return [s];
    const o = i.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return or(o, e, n + 1);
  });
}
function _1(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const Za = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, H1 = 450, C1 = 2.4, R1 = 160, Qa = 2.5, L1 = 200, F1 = 340, N1 = 1.1, tl = [380, 900], D1 = 0.35, ts = 300, xi = 150, j1 = 260, W1 = 1.2, Ei = 160, el = 400, gn = 300, B1 = 450, nl = 500, Ai = 350, sl = 150, q1 = 120, $i = 180, il = 420, K1 = 300, ol = 300, Y1 = 140, Pi = 150, rl = 450, z1 = 450, Oi = 150, al = 350, ll = 400, X1 = 12, U1 = 600, cl = 90, hl = 400, V1 = 200, G1 = 0.09, ul = 350, Qt = 450, Ii = 1200, J1 = 700, De = 320, te = 220, Z1 = 65, Q1 = 700, dl = (t) => t in _e, ty = (t) => t in jt;
function ey(t) {
  return Math.max(Q1, Array.from(t).length * Z1);
}
function Ah(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  Ga(e, s);
  const i = n.gait ?? "walk", o = or(e, n.actions).map(($) => $.do === "go" ? { ...$, do: i } : $);
  Ga(o, s, "scriptTracks (after expanding custom actions)");
  const r = ($) => Rt[$] ?? n.gaits?.[$], a = ($) => Za[$] ?? n.gaits?.[$]?.cycle ?? 1e3, l = ($) => {
    const C = n.actions?.[$];
    return C && "steps" in C ? C : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, u = n.height ?? 300;
  let d = c, f = h, g = n.facing ?? 1, p = n.start ?? nt, m = 0, b = 0;
  const S = [{ time: 0, pose: p }], w = [{ time: 0, value: 0 }], y = [{ time: 0, value: 0 }], v = [{ time: 0, value: 0 }], E = [{ time: 0, value: 0 }], T = [{ time: 0, value: "walk" }], x = [{ time: 0, value: g }], M = [], P = [], k = [], A = ($, C, B, X) => {
    p = { ...p, ...C }, B && (p = ve(p, B)), S.push({ time: $, pose: p, ...X === !1 ? { act: X } : {} });
  }, H = ($, C, B) => (A($ + De / 2, { turn: 0 }, B), x.push({ time: $ + De / 2, value: g }, { time: $ + De / 2 + 1, value: C }), g = C, A($ + De, { turn: 1 }), $ + De), O = ($) => $ < d ? -1 : 1, _ = ($, C, B) => O(C) !== g ? H($, O(C), B) : $, D = ($, C, B, X = "arm") => {
    const K = X === "arm", J = ye({ ...$, ...K ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: u, facing: g }), tt = K ? J.shoulders.right : J.hip, N = K ? J.elbows.right : J.knees.right, Y = (Z, Q) => Math.atan2(g * Z, Q) * 180 / Math.PI, V = ((Y(C - (d + tt.x), B - (f + tt.y)) - Y(N.x - tt.x, N.y - tt.y)) % 360 + 360) % 360;
    return V > 270 ? V - 360 : V;
  }, F = ($, C, B, X) => {
    const K = X === "arm", J = ye({ ...$, ...K ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: u, facing: g }), tt = K ? J.shoulders.right : J.hip, N = K ? { x: (J.hands.right.x + J.fingertips.right.x) / 2, y: (J.hands.right.y + J.fingertips.right.y) / 2 } : J.feet.right, Y = Math.hypot(N.x - tt.x, N.y - tt.y), q = B - (f + tt.y), V = Math.abs(q) < Y ? Math.sqrt(Y * Y - q * q) : Y * 0.1;
    return C - tt.x - g * V;
  }, W = ($) => {
    const C = ye($, { height: u, facing: g });
    return { x: d + (C.hands.right.x + C.fingertips.right.x) / 2, y: f + (C.hands.right.y + C.fingertips.right.y) / 2 };
  }, j = ($, C, B) => {
    const X = { ...$, rightWrist: 0, rightElbow: 0, rightShoulder: D($, C, B) }, K = ye(X, { height: u, facing: g }), J = { x: d + K.shoulders.right.x, y: f + K.shoulders.right.y }, tt = { x: d + K.elbows.right.x, y: f + K.elbows.right.y }, N = W(X), Y = Math.hypot(tt.x - J.x, tt.y - J.y), q = Math.hypot(N.x - tt.x, N.y - tt.y), V = Math.min(Y + q - 0.01, Math.max(Math.abs(Y - q) + 0.01, Math.hypot(C - J.x, B - J.y))), Z = (it) => it * 180 / Math.PI, Q = Z(Math.acos((Y * Y + V * V - q * q) / (2 * Y * V))), et = 180 - Z(Math.acos((Y * Y + q * q - V * V) / (2 * Y * q)));
    let ut = { rightShoulder: X.rightShoulder, rightElbow: 0 }, ct = 1 / 0;
    for (const it of [1, -1])
      for (const gt of [1, -1]) {
        const G = { rightShoulder: X.rightShoulder + it * Q, rightElbow: gt * et }, mt = { ...$, rightWrist: 0, ...G }, dt = W(mt), U = Math.hypot(dt.x - C, dt.y - B) - ye(mt, { height: u, facing: g }).elbows.right.y * 1e-3;
        U < ct && (ct = U, ut = G);
      }
    return ut;
  }, I = ($, C, B) => Math.abs(C - d) < 2 ? $ : (w.push({ time: $, value: d - c }, { time: $ + B, value: C - c, easing: "ease-in-out" }), d = C, $ + B);
  for (const $ of o) {
    const C = Math.max($.at ?? b, b === 0 ? 0 : S[S.length - 1].time);
    let B = C, X, K;
    const J = $.pose ?? {}, tt = l($.do);
    if (r($.do)) {
      const N = $.to ?? d, Y = N === d ? g : O(N);
      let q = C;
      Y !== g ? q = H(C, Y, $.mood) : p.turn < 1 ? (q = C + te, A(q, { turn: 1, ...J }, $.mood)) : ($.mood || $.pose) && A(C + te, J, $.mood);
      const Z = Math.abs(N - d) / ca(r($.do), u), Q = $.for ?? Math.max(te * 2, Z * a($.do)), et = q + Q;
      T.push({ time: q, value: $.do }), E.push({ time: q, value: 0 }, { time: q + te, value: 1, easing: "ease-out" }), E.push({ time: et - te, value: 1 }, { time: et, value: 0, easing: "ease-in" }), v.push({ time: q, value: m }, { time: et, value: m + Z }), w.push({ time: q, value: d - c }, { time: et, value: N - c }), m += Z, d = N, A(et, {}), B = et;
    } else if ($.do === "zip") {
      const N = $.to ?? d, Y = N === d ? g : O(N);
      let q = C;
      Y !== g ? q = H(C, Y, $.mood) : p.turn < 1 && (q = C + te, A(q, { turn: 1 }, $.mood));
      const V = Ba("windUp", { at: q, from: $.mood ? ve(p, $.mood) : p });
      S.push(...V), p = V[V.length - 1].pose;
      const Z = q + Is("windUp"), Q = Z + H1, et = Q + Math.max(R1, Math.abs(N - d) / C1);
      T.push({ time: Z, value: "run" }), E.push({ time: Z, value: 0 }, { time: Z + 80, value: 1, easing: "ease-out" }, { time: et, value: 1 }, { time: et + 120, value: 0 }), v.push({ time: Z, value: m }, { time: Q, value: m + Qa, easing: "ease-in" }), m += Qa + (et - Q) / Za.run * 1.5, v.push({ time: et, value: m }), w.push({ time: Q, value: d - c }, { time: et, value: N - c, easing: "ease-in" }), k.push({ kind: "dust", time: Q, x: d, y: f, length: 900 }), d = N, A(et, {}), B = et;
    } else if ($.do === "leap") {
      const N = $.to ?? d, Y = $.onto ?? f;
      let q = N === d ? C : _(C, N, $.mood);
      p.turn < 1 && (q += te, A(q, { turn: 1 }, $.mood));
      const V = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      A(q + L1, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...V }, $.mood, !1);
      const Z = q + F1;
      A(Z - 40, { stretch: 0.72 }, void 0, !1), A(Z, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const Q = Math.hypot(N - d, Y - f), et = $.for ?? Math.min(tl[1], Math.max(tl[0], 300 + Q * N1)), ut = Math.min(f, Y) - D1 * u, ct = Math.sqrt(f - ut), it = Math.sqrt(Y - ut), gt = Z + et * ct / (ct + it), G = Z + et;
      A(gt, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), A(G, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), A(G + 180, { stretch: 1.05, bend: -3 }, void 0, !1), A(G + 340, { stretch: 1, bend: 0, leftHip: nt.leftHip, rightHip: nt.rightHip, leftShoulder: nt.leftShoulder, rightShoulder: nt.rightShoulder, leftElbow: nt.leftElbow, rightElbow: nt.rightElbow }, void 0, !1), w.push({ time: Z, value: d - c }, { time: G, value: N - c }), y.push(
        { time: Z, value: f - h },
        { time: gt, value: ut - h, easing: "ease-out-quad" },
        { time: G, value: Y - h, easing: "ease-in-quad" }
      ), d = N, f = Y, k.push({ kind: "dust", time: G, x: d, y: f, length: 500 }), B = G + 340, X = G;
    } else if ($.do === "point" && $.target) {
      const N = $.target, Y = _(C, N.x, $.mood), q = { ...p, ...$.mood ? lt[$.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...J }, V = ye(q, { height: u, facing: g }).head.center, Z = Math.abs(N.x - (d + V.x)), Q = N.y - (f + V.y), et = Y + Qt;
      A(et, { ...q, rightShoulder: D(q, N.x, N.y), lookX: 1, lookY: ny(Q / Math.max(1, Math.hypot(Z, Q))) * 0.8 }), B = et + ($.for ?? Ii), X = et, K = B;
    } else if ($.do === "swipe") {
      const N = $.target ?? { x: d + g * u * 0.5, y: f - u * 0.6 }, Y = O(N.x), q = _(C, N.x, $.mood), V = Y === 1 ? N.left ?? N.x : N.right ?? N.x, Z = Y === 1 ? N.right ?? N.x : N.left ?? N.x, Q = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...J };
      A(q + ts, { ...Q, rightShoulder: D(Q, d - g * u * 0.3, f - u * 1.1) }, $.mood, !1);
      const et = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, ut = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      I(q, F(et, V, N.y, "arm"), ts + xi), A(q + ts + xi, { lean: -12 }, void 0, !1);
      const ct = q + ts + xi + 80;
      A(ct, { ...et, rightShoulder: D(et, V, N.y) }, void 0, !1);
      const it = ct + ($.for ?? Math.max(j1, Math.abs(Z - V) / W1));
      w.push({ time: ct, value: d - c }), d = F(ut, Z, N.y, "arm"), w.push({ time: it, value: d - c }), A(it, { ...ut, rightShoulder: D(ut, Z, N.y) }, void 0, !1), A(it + Ei, { lean: 16, bend: 14, rightShoulder: D(p, Z + Y * u * 0.4, N.y + u * 0.25) }, void 0, !1), A(it + Ei + el, { lean: 0, bend: 0, rightShoulder: nt.rightShoulder, rightElbow: nt.rightElbow }), B = it + Ei + el, X = ct, K = it;
    } else if ($.do === "grab" && $.target) {
      const N = $.target, Y = _(C, N.x, $.mood), q = N.y > f - u * 0.5, V = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: q ? 35 : 0,
        lean: q ? 12 : 0,
        stretch: q ? 0.75 : 1,
        lookX: 1,
        lookY: q ? 0.8 : 0,
        ...J
      }, Q = I(Y, F(V, N.x, N.y, "arm"), gn) + B1;
      A(Q, { ...V, rightShoulder: D(V, N.x, N.y) }, $.mood, !1), A(Q + 120, {}, void 0, !1), A(Q + nl, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), B = Q + nl + 150, X = Q;
    } else if ($.do === "throw") {
      const N = $.target?.x ?? $.to ?? d + g * u, Y = _(C, N, $.mood), q = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...J };
      A(Y + Ai, { ...q, rightShoulder: D(q, d - g * u * 0.4, f - u * 1.05) }, $.mood, !1), A(Y + Ai + sl, { lean: -14 }, void 0, !1);
      const V = Y + Ai + sl + q1, Z = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      S.push({ time: V, pose: p = { ...Z, rightShoulder: D(Z, d + g * u, f - u * 1.1) }, easing: "ease-in", act: !1 }), A(V + $i, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), A(V + $i + il, { lean: 0, bend: 0, rightShoulder: nt.rightShoulder, rightElbow: nt.rightElbow, lookY: 0 }), B = V + $i + il, X = V, K = V;
    } else if ($.do === "kick" && $.target) {
      const N = $.target, Y = _(C, N.x, $.mood), q = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, V = I(Y, F(q, N.x, N.y, "leg"), K1), Z = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      A(V + ol, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...Z, ...J }, $.mood, !1);
      const Q = V + ol + Y1, et = D(q, N.x, N.y, "leg");
      S.push({ time: Q, pose: p = { ...p, ...q, rightHip: et }, easing: "ease-in", act: !1 }), A(Q + Pi, { lean: -15, rightHip: et + 20 }, void 0, !1), A(Q + Pi + rl, {
        lean: 0,
        bend: 0,
        rightHip: nt.rightHip,
        rightKnee: 0,
        leftShoulder: nt.leftShoulder,
        rightShoulder: nt.rightShoulder,
        leftElbow: nt.leftElbow,
        rightElbow: nt.rightElbow,
        lookY: 0
      }), B = Q + Pi + rl, X = Q;
    } else if ($.do === "put" && $.target) {
      const N = $.target, Y = _(C, N.x, $.mood), q = N.y > f - u * 0.5, V = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: q ? 35 : 0, lean: q ? 12 : 0, stretch: q ? 0.75 : 1, lookX: 1, lookY: q ? 0.8 : 0, ...J }, Q = I(Y, F(V, N.x, N.y, "arm"), gn) + z1;
      A(Q, { ...V, rightShoulder: D(V, N.x, N.y) }, $.mood, !1), A(Q + Oi, {}, void 0, !1), A(Q + Oi + al, { bend: 0, lean: 0, stretch: 1, rightShoulder: nt.rightShoulder, rightElbow: nt.rightElbow, lookY: 0 }), B = Q + Oi + al, X = Q;
    } else if ($.do === "write" && $.target) {
      const N = $.target, Y = N.left ?? N.x, q = N.right ?? N.x, V = _(C, (Y + q) / 2, $.mood), Z = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...lt.thinking, lookX: 1, lookY: 0, ...J }, Q = (dt) => F(Z, dt, N.y, "arm") + g * u * 0.08, et = (dt) => {
        const z = W({ ...Z, ...j(Z, dt, N.y), rightWrist: 0 });
        return Math.hypot(z.x - dt, z.y - N.y) < 2;
      }, ut = g === 1 ? Y : q, ct = I(V, Q((Y + q) / 2), gn), it = !et(Y) || !et(q), gt = it ? I(ct, Q(Y), gn) + ll : ct + ll;
      A(gt, { ...Z, ...j(Z, it ? Y : ut, N.y) }, $.mood, !1);
      const G = $.for ?? Math.max(U1, Math.abs(q - Y) * X1);
      it && w.push({ time: gt, value: d - c });
      for (let dt = cl, z = 0; dt <= G; dt += cl, z++) {
        const U = Y + (q - Y) * Math.min(dt, G) / G;
        it && (d = Q(U), w.push({ time: gt + dt, value: d - c }));
        const at = (z % 2 === 0 ? -1 : 1) * u * 0.02;
        A(gt + dt, j(Z, U, N.y + at), void 0, !1);
      }
      const mt = gt + G;
      A(mt, j(Z, q, N.y), void 0, !1), A(mt + hl, { rightShoulder: nt.rightShoulder, rightElbow: nt.rightElbow, ...lt.happy }), B = mt + hl, X = gt, K = mt;
    } else if ($.do === "push" && $.target) {
      const N = $.target, Y = $.to ?? N.x, q = _(C, d + (Y >= N.x ? 1 : -1), $.mood), V = g === 1 ? N.left ?? N.x : N.right ?? N.x, Z = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...J }, Q = F(Z, V, N.y, "arm"), et = I(q, Q + g * u * 0.06, gn), ut = j(Z, V, N.y), ct = { ...Z, ...ut, leftShoulder: -ut.rightShoulder, leftElbow: -ut.rightElbow }, it = et + V1;
      A(it, ct, $.mood, !1);
      const gt = Math.abs(Y - N.x), G = it + ($.for ?? Math.max(600, gt / G1)), mt = gt / ca("shove", u);
      T.push({ time: it, value: "shove" }), E.push({ time: it, value: 0 }, { time: it + te, value: 1, easing: "ease-out" }, { time: G - te, value: 1 }, { time: G, value: 0, easing: "ease-in" }), v.push({ time: it, value: m }, { time: G, value: m + mt }), m += mt, w.push({ time: it, value: d - c }, { time: G, value: d + (Y - N.x) - c }), d += Y - N.x, A(G, {}, void 0, !1), A(G + ul, { lean: 0, bend: 0, rightShoulder: nt.rightShoulder, leftShoulder: nt.leftShoulder, rightElbow: nt.rightElbow, leftElbow: nt.leftElbow }), B = G + ul, X = it, K = G;
    } else if (tt) {
      const N = $.mood ? ve(p, $.mood) : p, Y = tt.steps(N, $), q = Mh(Y, { at: C, from: N });
      S.push(...q), p = q[q.length - 1].pose, B = C + Math.max(_1(Y), $.for ?? 0);
    } else if (dl($.do)) {
      const N = Ba($.do, { at: C, from: $.mood ? ve(p, $.mood) : p });
      S.push(...N), p = N[N.length - 1].pose, B = C + Is($.do), $.do === "take" && k.push({ kind: "dust", time: C + 900, x: d, y: f, length: 500 }), $.do === "land" && k.push({ kind: "dust", time: C + 120, x: d, y: f, length: 500 });
    } else if ($.do === "look" || $.do === "face") {
      const N = $.toward ?? "viewer", Y = $.for ?? J1;
      if (N === "viewer") A(C + Qt, { turn: 0, lookX: 0, lookY: 0, ...J }, $.mood);
      else if (N === "ahead") A(C + Qt, { turn: $.do === "face" ? 1 : 0.6, lookX: 1, ...J }, $.mood);
      else if (N === "back") A(C + Qt, { turn: 0.2, lookX: -1, ...J }, $.mood);
      else {
        const q = O(N);
        q !== g && $.do === "face" ? (H(C, q, $.mood), A(C + De + 1, { lookX: 1, ...J })) : q !== g ? A(C + Qt, { turn: 0.25, lookX: -1, ...J }, $.mood) : A(C + Qt, { turn: $.do === "face" ? 1 : 0.6, lookX: 1, ...J }, $.mood);
      }
      B = C + Math.max(Y, Qt);
    } else if (ty($.do) || $.do === "stand") {
      const N = $.do === "stand" ? n.rest ?? nt : jt[$.do], Y = N.turn !== nt.turn ? N.turn : p.turn, q = $.mood ? lt[$.mood] : { lookX: p.lookX, lookY: p.lookY };
      A(C + Qt, { ...N, turn: Y, ...q, ...J }), B = C + ($.for ?? Ii);
    } else {
      const N = $.for ?? ($.say ? ey($.say) : Ii);
      ($.mood || $.pose) && A(C + Math.min(Qt, N / 2), J, $.mood), B = C + N;
    }
    if ($.say) {
      const N = r($.do) || dl($.do) || tt ? C : C + Math.min(150, (B - C) / 4), Y = r($.do) ? B : Math.max(N + 200, B - 100);
      M.push({ text: $.say, start: N, end: Y }), $.do === "say" && oy(S, p, N, Y);
    }
    $.onto !== void 0 && $.do !== "leap" && $.onto !== f && (y.push({ time: C, value: f - h }, { time: B, value: $.onto - h, easing: "ease-in-out" }), f = $.onto), B > S[S.length - 1].time && S.push({ time: B, pose: p }), P.push({ start: C, end: B, ...X !== void 0 ? { contact: X } : {}, ...K !== void 0 ? { release: K } : {} }), b = B;
  }
  const R = w1(t, iy(S), n), L = [
    { id: `${t}-x`, target: t, property: "x", keyframes: w },
    { id: `${t}-y`, target: t, property: "y", keyframes: y },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: v },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: E },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: T },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: x }
  ].filter(
    ($) => $.keyframes.length > 1 || $.property === "x" || // Starting left is kept even if it never turns: a figure target faces right unless told.
    $.property === "facing" && $.keyframes[0].value === -1
  );
  return {
    tracks: [...O1(t, R, M, { energy: n.energy }), ...L],
    duration: b,
    lines: M,
    keys: S,
    beats: P,
    effects: k
  };
}
const ny = (t) => Math.max(-1, Math.min(1, t)), sy = 30;
function iy(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < sy ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function oy(t, e, n, s) {
  const o = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !o.some((c) => Math.abs(c.time - l.time) < 60)), ...o), t.sort((l, c) => l.time - c.time);
}
function $h(t, e, n) {
  const s = new zt({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), i = Nc({ x: n.x, y: n.y, style: n.style, cast: n.cast }), o = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = Dc(i, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[o], u = c.fingertips[o];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const Tn = ["start", "contact", "release", "end"], ry = ["surface", "edit", "anchor", "at", "until"], ay = ["carry"], hs = (t) => !!t && typeof t == "object" && !Array.isArray(t) && "surface" in t && "anchor" in t, ly = (t) => t.then === void 0 ? [] : Array.isArray(t.then) ? t.then : [t.then];
function Ok(t, e, n, s = {}) {
  const i = cy(n, e, s).filter((d) => d.level === "error");
  if (i.length > 0)
    throw new Error(`surfaceScript: ${i.length} problem(s) in the beats:
${i.map((d) => `  ${d.beat >= 0 ? `beat ${d.beat}: ` : ""}${d.message}`).join(`
`)}`);
  const o = n.map((d) => Ph(d, e)), r = Ah(t, o, s), a = hy(o, r.beats, s), l = s.ground ?? 0, c = (d) => s.ride === !1 ? d : Object.values(e).reduce((f, g) => g.ride(f, t, { ground: l }), d);
  n.forEach((d, f) => {
    for (const g of ly(d)) {
      const p = (y) => new Error(`surfaceScript: beat ${f} (${d.do}), ${g.edit} on ${g.surface}: ${y}`), m = (y, v) => {
        const E = typeof y == "object" ? y.beat : f, T = (typeof y == "object" ? y.at : y) ?? v ?? "start", x = a[E][T];
        if (x === void 0) {
          const M = Tn.filter((P) => a[E][P] !== void 0).join(", ");
          throw p(`beat ${E} (${n[E].do}) has no ${T} (it has ${M})`);
        }
        return x;
      }, b = e[g.surface], S = m(g.at ?? (a[f].contact !== void 0 ? "contact" : "start")), w = g.until === void 0 ? void 0 : m(g.until, "end");
      if (w !== void 0 && w < S) throw p(`it ends (${w} ms) before it starts (${S} ms)`);
      try {
        if (g.edit === "carry") {
          const v = b.piece(g.anchor), E = $h(t, c(r.tracks), {
            x: s.from ?? 0,
            y: l,
            style: s.figureStyle ?? (s.height ? { height: s.height } : void 0),
            cast: s,
            start: S,
            end: w
          });
          b.follow(v, E);
          continue;
        }
        const y = Object.fromEntries(Object.entries(g).filter(([v]) => !ry.includes(v)));
        b.edit(g.edit, g.anchor, { ...y, at: S, ...w !== void 0 ? { duration: w - S } : {} });
      } catch (y) {
        throw p(y.message);
      }
    }
  });
  const h = c(r.tracks), u = Object.entries(e).flatMap(([d, f]) => f.tracks(d));
  return { ...r, tracks: [...h, ...u], figureTracks: h };
}
function cy(t, e, n = {}) {
  if (!Array.isArray(t)) return _s(t, n);
  const s = [], i = Object.keys(e), o = (c, h, u) => {
    const d = typeof h == "string" ? e[h] : void 0;
    return d || s.push({ level: "error", beat: c, message: `${u}: ${rt("surface", h, i)}` }), d;
  }, r = (c, h, u, d) => {
    if (typeof u != "string") {
      s.push({ level: "error", beat: c, message: `${d}: \`anchor\` is a place name such as ${Object.keys(h.about.anchors).join(", ")} (got ${JSON.stringify(u)}).` });
      return;
    }
    try {
      h.anchor(u, 0);
    } catch (f) {
      s.push({ level: "error", beat: c, message: `${d}: ${f.message}` });
    }
  }, a = (c, h, u) => {
    const d = typeof h == "object" && h !== null ? h.at : h;
    if (typeof h == "object" && h !== null) {
      const f = h.beat;
      if ((typeof f != "number" || !Number.isInteger(f) || f < c || f >= t.length) && s.push({ level: "error", beat: c, message: `${u}: \`beat\` is the index of this beat or a later one, ${c} to ${t.length - 1} (got ${JSON.stringify(f)}).` }), d === void 0) return;
    }
    typeof d == "number" ? s.push({ level: "error", beat: c, message: `${u}: a cue starts at a moment of its beat (${Tn.join(", ")}), not at ms; set the beat's own \`at\` to move it.` }) : (typeof d != "string" || !Tn.includes(d)) && s.push({ level: "error", beat: c, message: `${u}: ${rt("moment", d, Tn)}` });
  };
  t.forEach((c, h) => {
    if (!c || typeof c != "object" || Array.isArray(c)) return;
    const u = c;
    for (const f of ["target", "to", "onto"]) {
      if (!hs(u[f])) continue;
      const g = u[f], p = o(h, g.surface, `\`${f}\``);
      p && r(h, p, g.anchor, `\`${f}\``);
    }
    if (u.then === void 0) return;
    (Array.isArray(u.then) ? u.then : [u.then]).forEach((f) => {
      if (!f || typeof f != "object" || Array.isArray(f)) {
        s.push({ level: "error", beat: h, message: "`then` is a cue, { surface, edit, anchor, at?, until? }, or a list of them." });
        return;
      }
      const g = f, p = o(h, g.surface, "`then`");
      if (!p) return;
      const m = `\`then\` (${String(g.edit)} on ${String(g.surface)})`, b = [...Object.keys(p.about.edits), ...ay];
      if (typeof g.edit != "string" || !b.includes(g.edit)) {
        s.push({ level: "error", beat: h, message: `\`then\`: ${rt("edit", g.edit, b)}` });
        return;
      }
      for (const S of Array.isArray(g.anchor) ? g.anchor : [g.anchor]) r(h, p, S, m);
      g.edit === "carry" && typeof g.anchor != "string" && s.push({ level: "error", beat: h, message: `${m}: \`carry\` takes one anchor, the piece it carries.` }), g.edit === "carry" && g.until === void 0 && s.push({ level: "error", beat: h, message: `${m}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${h + 1}, at: 'release' }).` }), g.at !== void 0 && a(h, g.at, `${m} \`at\``), g.until !== void 0 && a(h, g.until, `${m} \`until\``), g.until !== void 0 && g.duration !== void 0 && s.push({ level: "error", beat: h, message: `${m}: give \`until\` or \`duration\`, not both.` });
    });
  });
  const l = t.map((c) => c && typeof c == "object" && !Array.isArray(c) ? Ph(c, e, !0) : c);
  return [..._s(l, n), ...s];
}
function Ph(t, e, n = !1) {
  const { then: s, ...i } = t, o = (a) => {
    try {
      return e[a.surface].anchor(a.anchor, 0);
    } catch (l) {
      if (n) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      throw l;
    }
  }, r = { ...i };
  return hs(t.target) && (r.target = o(t.target)), hs(t.to) && (r.to = o(t.to).x), hs(t.onto) && (r.onto = o(t.onto).top), r;
}
function hy(t, e, n) {
  let s = 0;
  return t.map((i) => {
    const o = or([i], n.actions).length, r = e.slice(s, s + o);
    s += o;
    const a = r.find((c) => c.contact !== void 0)?.contact, l = [...r].reverse().find((c) => c.release !== void 0)?.release;
    return {
      start: r[0]?.start,
      end: r[r.length - 1]?.end,
      ...a !== void 0 ? { contact: a } : {},
      ...l !== void 0 ? { release: l } : {}
    };
  });
}
function Ik(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = xh(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(Rt), ...Object.keys(t.gaits ?? {})], i = t.gait ?? "walk";
  if (!s.includes(i)) throw new Error(`persona "${t.name}": ${rt("gait", i, s)}`);
  if (t.mood && !(t.mood in lt)) throw new Error(`persona "${t.name}": ${rt("mood", t.mood, Object.keys(lt))}`);
  const o = t.acting ?? "snappy";
  if (typeof o == "string" && !(o in Ge)) throw new Error(`persona "${t.name}": ${rt("acting style", o, Object.keys(Ge))}`);
  if (typeof t.stance == "string" && !(t.stance in jt)) throw new Error(`persona "${t.name}": ${rt("stance", t.stance, Object.keys(jt))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? jt[t.stance] : xt(t.stance ?? {}), l = t.mood ? ve(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (u) => Nc({ x: u.x, y: u.y, pose: l, style: { ...c, ...u.facing ? { facing: u.facing } : {} }, cast: e }),
    script: (u, d, f = {}) => Ah(u, d, {
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
    check: (u) => _s(u, e),
    handPath: (u, d, f) => $h(u, d, { ...f, style: c, cast: e }),
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
      actions: Eh(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const ot = ["rect", "circle", "text", "line", "path", "image", "custom"], uy = ["rect", "circle", "line", "path"], rr = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: ot },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: ot },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: ot },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: ot },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: ot },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: ot },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: ot },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: ot },
  scale: { description: "Size, both ways", unit: "factor", types: ot },
  scaleX: { description: "Width factor", unit: "factor", types: ot },
  scaleY: { description: "Height factor", unit: "factor", types: ot },
  skewX: { description: "Slants it sideways", unit: "degrees", types: ot },
  skewY: { description: "Slants it up and down", unit: "degrees", types: ot },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: ot },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: ot },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: ot },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: ot },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: ot },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: ot },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: ot },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: ot },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: ot },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: ot },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: ot },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: ot },
  glowColor: { description: "Colour of the glow", kind: "color", types: ot },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: ot },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: ot },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: ot },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: ot },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: ot },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: uy },
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
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: ot },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: ot }
}, po = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, dy = {
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
function fy(t) {
  const e = t, n = Object.entries(rr).filter(([, i]) => i.types.includes(t.type)).map(([i, { types: o, ...r }]) => ({ name: i, ...r, ...e[i] !== void 0 && typeof e[i] != "object" ? { value: e[i] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [i, o] of Object.entries(t.props ?? {}))
    n.push({ name: i, description: s?.props?.[i]?.description ?? "", ...s?.props?.[i], value: o });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function py(t) {
  const e = fy(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(po).filter((n) => e.includes(po[n]))];
}
function _k(t, e) {
  const n = [], s = Object.keys(e);
  for (const i of t) {
    const o = (d) => n.push({ level: "error", track: i.id, message: d }), r = e[i.target];
    if (!r) {
      o(rt("target", i.target, s));
      continue;
    }
    const a = py(r), l = r.type === "custom" && r.acceptsProp?.(i.property);
    if (!a.includes(i.property) && !l) {
      o(`${i.target}: ${rt("property", i.property, a, dy[i.property])}`);
      continue;
    }
    const c = i.keyframes ?? [];
    for (let d = 1; d < c.length; d++)
      c[d].time < c[d - 1].time && o(`${i.target}.${i.property}: keyframes out of time order (${c[d - 1].time} ms, then ${c[d].time} ms).`);
    const h = rr[po[i.property] ?? i.property] ?? r.about?.props?.[i.property], u = h && (h.kind ?? "number") === "number";
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
const Ze = (t, e) => t[2] <= -e;
function go(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function fl(t, e) {
  if (t.every((s) => Ze(s, e))) return t;
  const n = [];
  return t.forEach((s, i) => {
    const o = t[(i + t.length - 1) % t.length], r = Ze(s, e), a = Ze(o, e);
    r !== a && n.push(go(o, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function gy(t, e) {
  if (t.every((i) => Ze(i, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((i, o) => {
    const r = Ze(i, e);
    if (o > 0) {
      const a = t[o - 1], l = Ze(a, e);
      l && !r ? (s.push(go(a, i, e)), n.push(s), s = []) : !l && r && s.push(go(a, i, e));
    }
    r && s.push(i);
  }), s.length > 0 && n.push(s), n.filter((i) => i.length >= 2);
}
function pl(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const i = Math.round(s / n);
  return Array.from({ length: i + 1 }, (o, r) => t + s * r / i);
}
function my(t, e, n) {
  const s = (i, o) => Math.max(0, Math.min(i.length - 2, i.findIndex((r, a) => a > 0 && o <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function yy(t, e) {
  const n = (s) => {
    const i = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], o = Math.hypot(...i) || 1;
    return [i[0] / o, i[1] / o, i[2] / o];
  };
  return { ...t, vertices: t.vertices.map((s) => Ct(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function es(t, e, n, s) {
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
function by(t, e, n) {
  const s = t.faces.map((r) => ({ points: r.corners.map((a) => t.vertices[a]), normal: r.normal })), i = [], o = { x: e.slice(1, -1), z: n.slice(1, -1) };
  for (let r = 0; r + 1 < e.length; r++)
    for (let a = 0; a + 1 < n.length; a++) {
      const l = [], c = /* @__PURE__ */ new Map(), h = (g) => {
        const p = g.map((b) => Math.round(b * 1e6)).join(",");
        let m = c.get(p);
        return m === void 0 && (m = l.length, l.push(g), c.set(p, m)), m;
      }, u = [], d = (g) => g === 0, f = (g, p) => g + 2 === p.length;
      for (const g of s) {
        let p = g.points;
        d(r) || (p = es(p, 0, e[r], 1)), p.length && !f(r, e) && (p = es(p, 0, e[r + 1], -1)), p.length && !d(a) && (p = es(p, 2, n[a], 1)), p.length && !f(a, n) && (p = es(p, 2, n[a + 1], -1)), p.length >= 3 && u.push({ corners: p.map(h), normal: g.normal });
      }
      u.length > 0 && i.push({ cell: [r, a], mesh: { vertices: l, faces: u, creases: t.creases, joined: t.joined, walls: o } });
    }
  return i;
}
const wy = /* @__PURE__ */ new WeakMap(), ky = /* @__PURE__ */ new WeakMap(), vy = 48, Oh = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function Ih(t, e, n, s) {
  let i = t.get(e);
  i || t.set(e, i = /* @__PURE__ */ new Map());
  let o = i.get(n);
  return o === void 0 && (i.size >= vy && i.clear(), i.set(n, o = s())), o;
}
function ar(t, e) {
  const n = Oh(e);
  return Ih(wy, t, n, () => {
    const s = yy(t, e), i = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      i[a] = Math.min(i[a], r[a]), o[a] = Math.max(o[a], r[a]);
    return { key: n, inSpace: s, low: i, high: o };
  });
}
function My(t, e) {
  const n = t.map((h) => ({ ...h, ...ar(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const u of [0, 1, 2])
    s[u] = Math.min(s[u], h.low[u]), i[u] = Math.max(i[u], h.high[u]);
  const o = pl(s[0], i[0], e), r = pl(s[2], i[2], e), a = `${o.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const d = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: my(o, r, d) }];
    }
    return Ih(ky, h.inSpace, a, () => by(h.inSpace, o, r)).map((d) => ({ part: h.part, mesh: d.mesh, cut: !0, cell: d.cell }));
  }), c = (s[1] + i[1]) / 2;
  return { pieces: l, middle: ([h, u]) => [(o[h] + o[h + 1]) / 2, c, (r[u] + r[u + 1]) / 2] };
}
const gl = 4e-3, _i = 0.05, ml = /* @__PURE__ */ new WeakMap();
function Sy(t) {
  let e = ml.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((i) => n.normal[0] * (i[0] - s[0]) + n.normal[1] * (i[1] - s[1]) + n.normal[2] * (i[2] - s[2]) <= 1e-6);
  }), ml.set(t, e)), e;
}
const yl = /* @__PURE__ */ new WeakMap();
function _h(t) {
  return t.filter(({ mesh: e }) => Sy(e)).map(({ part: e, key: n, inSpace: s, low: i, high: o }) => {
    let r = yl.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), yl.set(s, r)), { part: e, key: n, planes: r, low: i, high: o };
  });
}
function Ty(t, e, n, s) {
  const i = e.reduce((o, r) => [o[0] + r[0] / e.length, o[1] + r[1] / e.length, o[2] + r[2] / e.length], [0, 0, 0]);
  for (const o of s) {
    if (o.part === t || [0, 1, 2].some((a) => i[a] < o.low[a] - _i || i[a] > o.high[a] + _i)) continue;
    if (o.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((u) => a.normal[0] * u[0] + a.normal[1] * u[1] + a.normal[2] * u[2] - a.offset);
      if (c.every((u) => Math.abs(u) <= gl)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? _i : gl;
      return c.every((u) => u <= h);
    })) return !0;
  }
  return !1;
}
const bl = /* @__PURE__ */ new WeakMap();
function Hh(t, e, n, s, i) {
  const o = `${s}|${i.map((l) => l.key).join(";")}`;
  let r = bl.get(e);
  r || bl.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(o);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const u = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], d = Math.hypot(...u) || 1;
      return [u[0] / d, u[1] / d, u[2] / d];
    }, c = e.vertices.map((h) => Ct(n, h));
    a = e.faces.map((h) => Ty(t, h.corners.map((u) => c[u]), l(h.normal), i)), r.set(o, a);
  }
  return a;
}
const Fn = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, mo = Math.PI / 180;
function xy(t, e, n) {
  return {
    toView: (s) => jo(fe(s, t * 90 * mo), -e * mo),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const wl = /* @__PURE__ */ new WeakMap(), Hs = (t) => us(t), us = (t) => {
  let e = wl.get(t);
  return e || wl.set(t, e = Em(t)), e;
};
function ft(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? Fn[n]?.default ?? 0;
}
function _n(t, e) {
  const n = Math.max(0.05, ft(t, e, "squash")), s = 1 / Math.sqrt(n), o = [1, 0, 0, 0, 0, 1, ft(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    ke([0, ft(t, e, "lift"), 0]),
    Yt(Dt([1, 0, 0], -ft(t, e, "pitch"))),
    Yt(Dt([0, 0, 1], ft(t, e, "roll"))),
    o,
    Ee([s, n, s]),
    Ee(Array(3).fill(Math.max(0, ft(t, e, "size"))))
  ].reduce((r, a) => bt(r, a));
}
function lr(t, e) {
  const n = _n(t, e), s = /* @__PURE__ */ new Map(), i = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: ft(t, e, r), bind: l }))), o = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = bt(l ? o(l) : n, ke(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, u, d] = r.rotate;
      h && (c = bt(c, Yt(Dt([1, 0, 0], h)))), u && (c = bt(c, Yt(Dt([0, 1, 0], u)))), d && (c = bt(c, Yt(Dt([0, 0, 1], d))));
    }
    for (const { value: h, bind: u } of i)
      if (!(!u.parts.includes(r.id) || h === 0)) {
        if (u.translate && (c = bt(c, ke([u.translate[0] * h, u.translate[1] * h, u.translate[2] * h]))), u.rotate) {
          const d = u.rotate.pivot ?? [0, 0, 0], f = u.rotate.axis === "x" ? [1, 0, 0] : u.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, ke(d), Yt(Dt(f, u.rotate.degrees * h)), ke([-d[0], -d[1], -d[2]])].reduce((g, p) => bt(g, p));
        }
        u.scale && (c = bt(c, Ee([1 + (u.scale[0] - 1) * h, 1 + (u.scale[1] - 1) * h, 1 + (u.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) o(r);
  return s;
}
const Hi = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), Ey = Math.cos(35 * mo);
function Ch(t, e, n, s, i = {}) {
  const o = t.derive ? { ...e, ...t.derive(e) } : e, r = lr(t, o), a = n.toView([0, 0, 0]), l = (O) => (_) => [O[0] * _[0] + O[4] * _[1] + O[8] * _[2], O[1] * _[0] + O[5] * _[1] + O[9] * _[2], O[2] * _[0] + O[6] * _[1] + O[10] * _[2]], c = _n(t, o), h = i.slice === void 0 ? null : $o(c), u = h ? t.parts.map((O) => ({ part: O, mesh: us(O.shape), local: bt(h, r.get(O.id)), whole: O.shape.type === "tube" })) : void 0, d = u ? My(u, i.slice) : void 0, f = u ? _h(u.map((O) => ({ part: O.part.id, mesh: O.mesh, ...ar(O.mesh, O.local) }))) : void 0, g = (O, _, D, F) => {
    const W = (z) => n.toView(Ct(D, z)), j = _.vertices.map(W), I = j.map((z) => n.toScreen(z)), R = i.perspective ? i.near : void 0, L = (z) => z.map((U) => n.toScreen(U)), $ = (z) => R === void 0 ? z : fl(z, R), C = (z) => R === void 0 ? [z] : gy(z, R), B = l(D), X = _.faces.map((z) => {
      const U = n.toView(B(z.normal)), at = [U[0] - a[0], U[1] - a[1], U[2] - a[2]], wt = Math.hypot(...at) || 1;
      return [at[0] / wt, at[1] / wt, at[2] / wt];
    }), K = f && F ? Hh(O.id, _, F, Oh(F), f) : void 0, J = (z) => K?.[z] ?? !1, tt = X.map((z, U) => {
      if (J(U)) return !1;
      if (!i.perspective) return z[2] > 1e-6;
      const wt = _.faces[U].corners.reduce((Ot, kt) => [Ot[0] + j[kt][0], Ot[1] + j[kt][1], Ot[2] + j[kt][2]], [0, 0, 0]);
      return -(z[0] * wt[0] + z[1] * wt[1] + z[2] * wt[2]) > 1e-9;
    }), N = (z) => _.faces[z].corners.reduce((U, at) => U + j[at][2], 0) / _.faces[z].corners.length, Y = _.faces.map((z, U) => ({ face: z, i: U })).filter(({ i: z }) => tt[z]).map(({ face: z, i: U }) => ({
      i: U,
      solved: {
        points: R === void 0 ? z.corners.map((at) => I[at]) : L($(z.corners.map((at) => j[at]))),
        depth: N(U),
        tone: 0.72 + 0.33 * Math.max(0, X[U][0] * Hi[0] + X[U][1] * Hi[1] + X[U][2] * Hi[2])
      }
    })).filter((z) => z.solved.points.length >= 3).sort((z, U) => z.solved.depth - U.solved.depth);
    if (i.light) {
      const z = l(D);
      for (const { i: U, solved: at } of Y) {
        const wt = _.faces[U].corners, Ot = wt.reduce((Gs, Bh) => {
          const Js = Ct(D, _.vertices[Bh]);
          return [Gs[0] + Js[0] / wt.length, Gs[1] + Js[1] / wt.length, Gs[2] + Js[2] / wt.length];
        }, [0, 0, 0]), kt = z(_.faces[U].normal), ge = Math.hypot(...kt) || 1, fr = i.light(Ot, [kt[0] / ge, kt[1] / ge, kt[2] / ge]);
        at.light = fr.light, at.fog = fr.fog;
      }
    }
    const q = Y.map((z) => z.solved), V = Ay(_), Z = [], Q = [];
    for (const [z, U] of V) {
      const at = U.filter((Ot) => tt[Ot]).length;
      if (at === 0) continue;
      const wt = U.length === 2 && at === 2 && _.creases !== !1 && X[U[0]][0] * X[U[1]][0] + X[U[0]][1] * X[U[1]][1] + X[U[0]][2] * X[U[1]][2] < Ey;
      U.length === 1 && (_.joined || Oy(_, z)) || (U.length === 1 || at === 1 || wt) && (Z.push(z.split("-").map(Number)), Q.push(U.filter((Ot) => tt[Ot]).reduce((Ot, kt) => N(kt) > N(Ot) ? kt : Ot)));
    }
    const et = (z) => _.faces.findIndex((U) => U.corners.length > 4 && Math.sign(_y(_.vertices[z], U.normal)) > 0), ut = (_.marks ?? []).filter(([z]) => et(z) < 0 || tt[et(z)]), ct = ([z, U]) => R === void 0 ? [[I[z], I[U]]] : C([j[z], j[U]]).map(L), it = ut.flatMap(ct), gt = (z) => R === void 0 ? [z.map((U) => I[U])] : C(z.map((U) => j[U])).map(L);
    if (i.slice !== void 0) {
      const z = /* @__PURE__ */ new Map();
      Z.forEach((U, at) => z.set(Q[at], [...z.get(Q[at]) ?? [], U]));
      for (const { i: U, solved: at } of Y) {
        at.edges = vl(z.get(U) ?? []).flatMap(gt);
        const wt = _.faces[U].corners;
        at.center = wt.reduce((kt, ge) => [kt[0] + j[ge][0] / wt.length, kt[1] + j[ge][1] / wt.length, kt[2] + j[ge][2] / wt.length], [0, 0, 0]), at.normal = X[U];
        const Ot = Y[Y.length - 1].i;
        at.marks = ut.filter(([kt]) => (et(kt) >= 0 ? et(kt) : Ot) === U).flatMap(ct);
      }
    }
    const G = O.glow ? Math.max(0, Math.min(1, ft(t, o, O.glow.control))) : 0, mt = O.fade ? Math.max(0, Math.min(1, ft(t, o, O.fade.control))) : 0, dt = O.fade ? Math.max(0, Math.min(1, O.fade.from + (O.fade.to - O.fade.from) * mt)) : 1;
    return {
      part: O,
      depth: j.reduce((z, U) => z + U[2], 0) / Math.max(1, j.length),
      faces: q,
      edges: vl(Z).flatMap(gt),
      marks: it,
      glow: G,
      opacity: dt,
      ...O.shape.type === "tube" ? { spine: Iy(C(O.shape.points.map(W)).map(L)) } : {},
      ..._.walls ? { cut: !0 } : {}
    };
  }, p = new Map(u?.map((O) => [O.part.id, O.local])), b = (d ? d.pieces.map((O) => ({
    part: O.part,
    mesh: O.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: O.cut ? c : r.get(O.part.id),
    local: O.cut ? Ds() : p.get(O.part.id),
    cell: O.cell
  })) : t.parts.map((O) => ({ part: O, mesh: us(O.shape), m: r.get(O.id), local: void 0, cell: void 0 }))).map((O) => ({ cell: O.cell, solved: g(O.part, O.mesh, O.m, O.local) })), S = b.map((O) => O.solved), w = (O) => O.filter((_) => _.faces.length > 0 && _.opacity > 0.01).sort((_, D) => _.depth - D.depth);
  let y;
  if (d) {
    const O = new Map(t.parts.map((D) => {
      const F = r.get(D.id), W = us(D.shape).vertices;
      return [D.id, W.reduce((j, I) => j + n.toView(Ct(F, I))[2], 0) / Math.max(1, W.length)];
    })), _ = /* @__PURE__ */ new Map();
    for (const D of b) {
      const F = D.cell.join(",");
      _.has(F) || _.set(F, { cell: D.cell, parts: [] }), _.get(F).parts.push(D.solved), D.solved.depth = O.get(D.solved.part.id);
    }
    y = [..._.values()].map(({ cell: D, parts: F }) => ({ depth: n.toView(Ct(c, d.middle(D)))[2], parts: w(F) })).filter((D) => D.parts.length > 0);
  }
  const v = {};
  for (const [O, _] of Object.entries(t.anchors ?? {})) {
    const D = _.part ? r.get(_.part) : _n(t, o);
    if (!D) throw new Error(`prop rig: anchor "${O}" is on "${_.part}", which is not a part`);
    const F = n.toView(Ct(D, _.at));
    v[O] = { point: n.toScreen(F), depth: F[2] };
  }
  const [E, T] = t.footprint ?? [t.length * 0.45, t.length], x = Math.max(0, ft(t, o, "lift")), M = Math.max(0, ft(t, o, "size")) / (1 + x * 0.8), P = Array.from({ length: 24 }, (O, _) => {
    const D = Math.PI * 2 * _ / 24;
    return n.toView([Math.cos(D) * E * 0.55 * M, 0, Math.sin(D) * T * 0.55 * M]);
  }), k = i.perspective ? i.near : void 0, A = {
    points: (k === void 0 ? P : fl(P, k)).map((O) => n.toScreen(O)),
    opacity: 0.16 * M
  }, H = S.filter((O) => O.part.seeThrough && O.opacity > 0.01).flatMap((O) => O.faces.map((_) => _.points));
  return { under: w(S.filter((O) => !O.part.overRider)), over: w(S.filter((O) => O.part.overRider)), ...y ? { cells: y } : {}, anchors: v, openings: H, shadow: A, pxPerUnit: s, sizePx: t.height * s };
}
const kl = /* @__PURE__ */ new WeakMap();
function Ay(t) {
  let e = kl.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let i = 0; i < s.length; i++) {
        const o = s[i], r = s[(i + 1) % s.length], a = o < r ? `${o}-${r}` : `${r}-${o}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    kl.set(t, e);
  }
  return e;
}
function $y(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = lr(t, n), i = $o(_n(t, n)) ?? Ds(), o = (r) => Math.max(0, Math.min(1, r));
  return t.parts.map((r) => {
    const a = r.fade ? o(ft(t, n, r.fade.control)) : 0;
    return {
      part: r,
      matrix: s.get(r.id),
      local: bt(i, s.get(r.id)),
      glow: r.glow ? o(ft(t, n, r.glow.control)) : 0,
      opacity: r.fade ? o(r.fade.from + (r.fade.to - r.fade.from) * a) : 1
    };
  });
}
function Py(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = lr(t, n), i = _n(t, n), o = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : i;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    o[r] = Ct(l, a.at);
  }
  return o;
}
function Oy(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((o) => t.vertices[Number(o)]), i = (o, r) => r.some((a) => Math.abs(n[o] - a) < 1e-6 && Math.abs(s[o] - a) < 1e-6);
  return i(0, t.walls.x) || i(2, t.walls.z);
}
function Iy(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const _y = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function vl(t) {
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
const Hy = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function pe(t) {
  const e = { ...Hy, ...t.colors }, n = [], { forwardMost: s, backMost: i, top: o } = Rh(t);
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
      const b = h + (u - h) * 0.15, S = h + (u - h) * 0.55;
      n.push({
        id: `seat-back-${m}`,
        shape: { type: "panel", points: [[b, d + 0.05], [S, d + 0.05], [S - 0.08, f - 0.06], [b + 0.06, f - 0.04]], facing: p > 0 ? "left" : "right" },
        at: [p * (t.width / 2 + 6e-3), 0, 0],
        fill: e.seat,
        outline: 0.4
      }), n.push({
        id: `door-${m}`,
        shape: { type: "panel", points: g.map(([w, y]) => [w - u, y]), facing: p > 0 ? "left" : "right" },
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
    for (const b of [1, -1])
      n.push({ id: `headlight-${b}`, shape: { type: "panel", points: m, facing: "front" }, at: [b * h, 0, f], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${b}`, shape: { type: "panel", points: m, facing: "back" }, at: [b * h, 0, g], fill: Zo(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
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
    actions: Ry(t),
    acting: Cy,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function Rh(t) {
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
const Cy = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function ns(t, e, n, s, i, o, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: i }), t.set("wheelSpin", n, r ? l : l + c / o * (180 / Math.PI), i);
}
const Ml = 0.4;
function Ry(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = Rh(t), i = (n - s) / 2, o = (a, l, c) => {
    const h = a.exaggeration;
    let u = l;
    return a.facing() !== c && (u = a.turnTo(u, c > 0 ? "right" : "left")), a.key(u + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), ns(a, u, u + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: u + 150, x: a.x - c * i * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), u + 260;
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
        const u = o(a, c, h), d = a.exaggeration, f = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, f / (l.speed ?? Ml));
        return a.effect({ kind: "dust", time: u, x: a.x - h * i * a.scale, y: a.floor, length: 600, direction: -h }), a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.05 * d, lean: 0.12 * d }, { act: !1, easing: "ease-out" }), a.key(u + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * d, squash: 1.02 }, { act: !1 }), ns(a, u, u + g, l.to, "ease-in-out", e), r(a, u + g, !1), { end: u + g + 380, contact: u, release: u + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = o(a, c, h), d = a.exaggeration, f = a.x, g = Math.abs(l.to - f), p = l.for ?? Math.max(600, g / (l.speed ?? Ml * 1.2)), m = u + p * 0.55, b = f + (l.to - f) * 0.65;
        return a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.06 * d, lean: 0.14 * d }, { act: !1, easing: "ease-out" }), ns(a, u, m, b, "ease-in", e), a.key(m + 80, { pitch: -7 * d, lean: -0.12 * d, squash: 0.94 }, { act: !1, easing: "ease-out" }), ns(a, m, u + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: b, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: u + p, x: l.to + h * i * a.scale, y: a.floor, length: 600, direction: h }), r(a, u + p, !0), { end: u + p + 380, contact: m, release: u + p };
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
function Ly(t = {}) {
  return pe({
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
function Fy(t = {}) {
  return pe({
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
function Ny(t = {}) {
  return pe({
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
function Dy(t = {}) {
  return pe({
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
function jy(t = {}) {
  const e = t.colors?.body ?? "#a8743f";
  return pe({
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
function Wy(t = {}) {
  return pe({
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
function By(t = {}) {
  const e = t.colors?.body ?? "#e0473b", n = [0, 0.32, -0.05], s = [0, 0.86, -0.22], i = [0, 0.9, 0.42], o = [0, 0.34, 0.56], r = [0, 0.34, -0.56];
  return pe({
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
function qy(t = {}) {
  return pe({
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
function Ky(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, i = t.canopy?.shape === "tall", o = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = rn(t.canopy?.seed ?? 7), a = [
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
    actions: zy(),
    acting: Yy,
    colors: { body: o.leaves }
  };
}
const Yy = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function zy() {
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
function Xy(t = {}) {
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
    actions: Vy(!!f),
    acting: Uy,
    colors: { body: r.walls }
  };
}
const Uy = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Vy(t) {
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
function Gy(t = {}) {
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
    actions: Jy(),
    acting: Lh,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: le * 1e3 } } }
  };
}
const Lh = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, le = 2.6;
function Jy() {
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
        t(n, i, i + 900, le, "ease-in"), n.key(i + 900, { blur: 1 }, { act: !1, easing: "ease-in" }), n.key(i + 700, { squash: 1 - 0.08 * o }, { act: !1, easing: "ease-in" });
        const a = i + 1e3;
        return n.key(a + 150, { squash: 1 + 0.06 * o, lift: 0.3 }, { act: !1, easing: "ease-out" }), n.key(a + 1300, { squash: 1, lift: r, pitch: -4 * o }, { act: !1, easing: "ease-in-out" }), n.key(a + 1700, { pitch: 0 }), t(n, i + 900, a + 1700, le), n.effect({ kind: "dust", time: a, x: n.x, y: n.floor, length: 900 }), { end: a + 1700, contact: a };
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
        return n.key(a + 300, { pitch: -9 * o, roll: 6 * o }, { act: !1, easing: "ease-out" }), n.key(a + c - 250, { pitch: -4 * o, roll: 3 * o, lift: h }, { act: !1 }), n.key(a + c, { pitch: 7 * o, roll: 0 }, { act: !1, easing: "ease-out" }), n.key(a + c + 450, { pitch: 0 }), n.move(a, a + c, s.to, { easing: "ease-in-out" }), t(n, i, a + c + 450, le), { end: a + c + 450, contact: a, release: a + c };
      }
    },
    hover: {
      summary: "Hovers in place for `for` ms (default 2000), bobbing gently.",
      uses: ["for"],
      run(n, s, i) {
        const o = s.for ?? 2e3, r = n.values.lift, a = n.exaggeration;
        for (let l = 350, c = 0; l < o; l += 350, c++)
          n.key(i + l, { lift: r + (c % 2 === 0 ? 0.12 : -0.06) * a, roll: (c % 2 === 0 ? 1.5 : -1.5) * a }, { act: !1, easing: "ease-in-out" });
        return n.key(i + o, { lift: r, roll: 0 }, { act: !1, easing: "ease-in-out" }), (e(n) || r > 0) && t(n, i, i + o, le), { end: i + o };
      }
    },
    land: {
      summary: "Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.",
      run(n, s, i) {
        const o = n.exaggeration, r = i + Math.max(900, n.values.lift * 450);
        return n.key(i + 400, { pitch: 3 * o }, { act: !1, easing: "ease-out" }), n.key(r, { lift: 0, pitch: 0, squash: 1 - 0.14 * o }, { act: !1, easing: "ease-in" }), n.key(r + 280, { squash: 1 }), t(n, i, r, le), t(n, r, r + 1600, le, "ease-out"), n.key(r + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: r, x: n.x, y: n.floor, length: 800 }), { end: r + 1600, contact: r };
      }
    }
  };
}
function Zy(t = {}) {
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
    actions: tb(),
    acting: Lh,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: le * 1e3 } } }
  };
}
const Qy = 3.2;
function tb() {
  const t = (n, s, i, o) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", i, r + Qy * (i - s) * (o ? 0.5 : 1), o);
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
const Nn = ["walk", "trot", "canter", "gallop"], Hk = Nn, Fh = ["fl", "fr", "hl", "hr"], Xs = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, xe = Math.PI / 180;
function cr(t, e) {
  return 4 * t * Math.sin(Xs[e].swing * xe);
}
function Us(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, i = s + t.body.rise, o = (u, d) => [d * u[0], u[1], u[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, i, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((u, d, f) => t.neck.radius * (1.25 - 0.4 * d / Math.max(1, f.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...nb(t, n, i)
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
    gait: { description: `Which gait: ${t.gaits.map((u) => `${Nn.indexOf(u)} ${u}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: Bt, rotate: { axis: "x", degrees: 1 / Bt.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: Bt, rotate: { axis: "y", degrees: 1 / Bt.length } }] }
  };
  for (const u of Fh) {
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
    derive: (u) => sb(u, t, s)
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
    actions: { ...ob(t, h), ...t.actions?.(h) },
    acting: Nh,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [{ control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 }],
    moves: eb(t, s)
  };
}
function eb(t, e) {
  const n = (i) => {
    const o = cr(e, i);
    return {
      speed: o / (Xs[i].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: Nn.indexOf(i) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / o }
    };
  }, s = Object.fromEntries(t.gaits.map((i) => [i === "gallop" && !t.gaits.includes("canter") ? "run" : i, n(i)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const Bt = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function nb(t, e, n) {
  const s = lh(t.tail.points, Bt.length + 1), [, i, o] = t.body.radii, r = (t.tail.at[1] - n) / i, a = Math.abs(r) < 1 ? -o * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, o * 0.08)], c = (f) => t.tail.radius * (1 - 0.5 * f / Bt.length), h = Bt.map((f, g) => {
    const p = s[g], m = s[g + 1], b = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], S = g === 0 ? void 0 : s[g - 1];
    return {
      id: f,
      ...g > 0 ? { parent: Bt[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], b], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - S[0], p[1] - S[1], p[2] - S[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), u = s[s.length - 1], d = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: Bt[Bt.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(Bt.length) * 1.05), segments: 8 },
    at: [u[0] - d[0], u[1] - d[1], u[2] - d[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function sb(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const i = Nn[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], o = Xs[e.gaits.includes(i) ? i : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of Fh) {
    const h = Math.PI * 2 * (r + o.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * o.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * o.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * o.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * o.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (o.rock > 0 ? -o.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function ib(t) {
  const n = Math.sin(32 * xe), s = t.legLength - (t.front - t.hind) * n, i = 72, r = (s - t.upper * Math.cos(i * xe) - t.foot) / t.lower, a = r >= 1 ? 0 : r <= -1 ? 180 : Math.acos(r) / xe, l = {
    pitch: 32,
    // The front hips stay at standing height: tipping up raises them by front · sin, and swinging them round the
    // middle lowers them by leg · (1 − cos); the front legs are held upright, so both are taken back.
    lift: t.legLength * (1 - Math.cos(32 * xe)) - t.front * n,
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
const Nh = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, Ck = Nh;
function ob(t, e) {
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
      const g = Math.abs(l.to - a.x) / a.scale / cr(e.legLength, r), p = l.for ?? Math.max(500, g * Xs[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", u, a.values.gait ?? 0), a.set("gait", u + 1, Nn.indexOf(r)), a.set("walking", u, 0), a.set("walking", u + 240, 1, "ease-out"), a.set("walking", u + p - 240, 1), a.set("walking", u + p, 0, "ease-in"), a.set("walk", u, m), a.move(u, u + p, l.to, { easing: "ease-in-out" }), a.set("walk", u + p, m + g, "ease-in-out"), a.key(u + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: u + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: u + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: u + p + 300, contact: u, release: u + p };
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
        const c = ib(e), h = l + 450;
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
function rb(t = {}) {
  return Us({
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
          const o = n.exaggeration, r = Math.min(55, 32 * o), a = -e.hind * Math.sin(r * xe), l = s.for ?? 700;
          n.key(i + 200, { pitch: -4, neck: 6, "hl.knee": 12, "hr.knee": 12 }, { act: !1, easing: "ease-out" }), n.key(i + 520, { pitch: r, lift: a, neck: -25, "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-out" }), n.key(i + 520 + l * 0.5, { "fl.swing": 35, "fl.knee": 70, "fr.swing": 58, "fr.knee": 100 }, { act: !1, easing: "ease-in-out" }), n.key(i + 520 + l, { "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80 }, { act: !1, easing: "ease-in-out" });
          const c = i + 520 + l + 380;
          return n.key(c, { pitch: 0, lift: 0, neck: 8, squash: 0.94, "fl.swing": 0, "fl.knee": 0, "fr.swing": 0, "fr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(c + 320, { neck: 0, squash: 1 }), e.call(n, i + 520), n.effect({ kind: "dust", time: c, x: n.x + (n.facing() || 1) * e.front * n.scale, y: n.floor, length: 600 }), { end: c + 320, contact: c };
        }
      },
      buck: {
        summary: "Bucks: drops its head and kicks both hind legs up and back.",
        run(n, s, i) {
          const o = n.exaggeration, r = Math.min(35, 18 * o), a = e.front * Math.sin(r * xe);
          return n.key(i + 220, { pitch: 3, squash: 0.95 }, { act: !1, easing: "ease-out" }), n.key(i + 480, { pitch: -r, lift: a, neck: 30, "hl.swing": -65, "hr.swing": -60, "hl.knee": 10, "hr.knee": 10 }, { act: !1, easing: "ease-out" }), n.key(i + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, "hl.swing": 0, "hr.swing": 0, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(i + 1150, { squash: 1 }), n.effect({ kind: "dust", time: i + 900, x: n.x - (n.facing() || 1) * 0.6 * n.scale, y: n.floor, length: 600 }), { end: i + 1150, contact: i + 480 };
        }
      }
    })
  });
}
function ab(t = {}) {
  return Us({
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
function lb(t = {}) {
  return Us({
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
function cb(t = {}) {
  return Us({
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
function Rk(t) {
  return cr(1, t);
}
const ie = 0.6, Dh = 75, Ci = 80;
function hr(t) {
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
      shape: { type: "ellipsoid", radii: [t.wing.span * ie / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * ie / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-Ci, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${u}-tip`,
      parent: `wing-${u}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * ie / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * ie / 4, 0, -t.wing.chord * 0.3],
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
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - ie) / 2, 0, 0], rotate: { axis: "x", degrees: Ci }, scale: [1 / ie, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - ie) / 2, 0, 0], rotate: { axis: "x", degrees: Ci }, scale: [1 / ie, 1, 1] }
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
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / Dh, 0] }]
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
    actions: db(t),
    acting: ub,
    colors: { body: e.body, ink: "#26262b" },
    moves: hb(t)
  };
}
function hb(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const ub = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function db(t) {
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
          r.key(l + 120 + u * 300 + 90, { peck: Dh }, { act: !1, easing: "ease-in" }), r.key(l + 120 + u * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
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
function fb(t = {}) {
  return hr({
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
function pb(t = {}) {
  return hr({
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
function gb(t = {}) {
  return hr({
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
const Hn = { car: Ly, truck: Fy, bus: Ny, tractor: Dy, cart: jy, trainCar: Wy, bike: By, motorbike: qy, tree: Ky, house: Xy, helicopter: Gy, airplane: Zy, horse: rb, dog: ab, cat: lb, cow: cb, songbird: fb, crow: pb, chicken: gb };
function mb(t, e = {}) {
  const n = Hn[t];
  if (!n) throw new Error(rt("prop preset", t, Object.keys(Hn)));
  return n(e);
}
function yb(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...Fn, ...t.rig.controls })) {
    const { bind: i, ...o } = s;
    e[n] = o;
  }
  return e;
}
function Lk(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, i = e.rig.height * n * 1.6, o = yb(e), r = {};
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
      l.translate(s / 2, i), nh(l, Vs(e, u, n), { ...a, time: h });
    }
  };
}
function Vs(t, e, n) {
  const s = xy(ft(t.rig, e, "turn"), ft(t.rig, e, "tilt"), n);
  return Ch(t.rig, e, s, n);
}
function ur(t, e, n) {
  const s = { ...t.props };
  let i = 0, o = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? i = c : l === "y" ? o = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + i, y: t.y + t.height + o }, a = Vs(t.prop, s, t.propScale);
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
function Fk(t, e, n, s, i = {}) {
  const o = ur(e, n, s);
  return t.save(), t.translate(o.origin.x, o.origin.y), nh(t, o.solved, {
    ...e.propDraw,
    time: n.time,
    // The rider is drawn in scene px.
    rider: i.rider ? (r) => {
      r.save(), r.translate(-o.origin.x, -o.origin.y), i.rider(r), r.restore();
    } : void 0
  }), t.restore(), o;
}
const yo = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], bo = { viewer: 0, right: 1, away: 2, left: 3 }, bb = 420, jh = {
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
function dr(t) {
  return { ...jh, ...t.actions };
}
const Ri = (t) => typeof t == "number" && Number.isFinite(t);
function wb(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = dr(e), s = Object.keys(n), i = [];
  return t.forEach((o, r) => {
    const a = (c) => i.push({ level: "error", beat: r, message: c });
    if (!o || typeof o != "object" || Array.isArray(o)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = o;
    for (const c of Object.keys(l))
      yo.includes(c) || a(rt("beat field", c, yo, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(rt(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(Ri(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !Ri(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !Ri(l.toward) && !(typeof l.toward == "string" && l.toward in bo)) {
      const c = typeof l.toward == "string" ? gs(l.toward, Object.keys(bo)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), i;
}
function kb(t, e, n, s = {}) {
  const i = wb(n, e).filter((M) => M.level === "error");
  if (i.length > 0) throw new Error(`propScript (${e.kind}): ${i.length} problem(s) in the beats:
${i.map((M) => `  beat ${M.beat}: ${M.message}`).join(`
`)}`);
  const o = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = dr(e), h = {};
  for (const M of [...Object.keys(Fn), ...Object.keys(e.rig.controls)]) h[M] = s.start?.[M] ?? ft(e.rig, {}, M);
  const u = [{ time: 0, pose: { ...h } }], d = /* @__PURE__ */ new Map(), f = [];
  let g = o, p = r;
  const m = (M, P, k, A) => {
    const H = d.get(M) ?? [{ time: 0, value: M === "x" || M === "y" ? 0 : h[M] }];
    H.push({ time: P, value: k, ...A ? { easing: A } : {} }), d.set(M, H), M !== "x" && M !== "y" && (h[M] = k);
  }, b = (M, P) => {
    const k = M === "x" ? g - o : M === "y" ? p - r : h[M], A = d.get(M);
    (!A || A[A.length - 1].time < P) && m(M, P, k);
  }, S = {
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
      const M = Math.sin(h.turn * Math.PI / 2);
      return Math.abs(M) < 0.5 ? 0 : M > 0 ? 1 : -1;
    },
    key(M, P, k = {}) {
      Object.assign(h, P), u.push({ time: M, pose: { ...h }, ...k.act === !1 ? { act: !1 } : {}, ...k.easing ? { easing: k.easing } : {} });
    },
    move(M, P, k, A = {}) {
      b("x", M), m("x", P, k - o, A.easing), g = k, A.floor !== void 0 && (b("y", M), m("y", P, A.floor - r, A.easing), p = A.floor);
    },
    set(M, P, k, A) {
      m(M, P, k, A);
    },
    turnTo(M, P) {
      const k = typeof P == "number" ? P : bo[P], A = h.turn, O = [k - 4, k, k + 4].map((D) => ({ t: D, d: Math.abs(D - A) })).sort((D, F) => D.d - F.d || Math.abs(D.t) - Math.abs(F.t))[0];
      if (O.d < 1e-3) return M;
      const _ = M + bb * Math.max(1, O.d);
      return S.key(_, { turn: O.t }), _;
    },
    effect(M) {
      f.push(M);
    },
    anchor(M) {
      const k = Vs(e, h, a).anchors[M];
      if (!k) throw new Error(`${e.kind}: no anchor "${M}"`);
      return { x: g + k.point.x, y: p + k.point.y };
    }
  }, w = [];
  let y = 0;
  for (const M of n) {
    const P = Math.max(M.at ?? y, u[u.length - 1].time), k = c[M.do].run(S, M, P);
    k.end > u[u.length - 1].time && u.push({ time: k.end, pose: { ...h } }), w.push({ start: P, end: k.end, ...k.contact !== void 0 ? { contact: k.contact } : {}, ...k.release !== void 0 ? { release: k.release } : {} }), y = k.end;
  }
  const v = kh(s.style ?? "snappy"), E = { ...v, anticipation: v.anticipation * l, overshoot: v.overshoot * l }, T = ir(Tb(u), e.acting, { style: E }), x = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(T).filter(([M]) => !d.has(M)).map(([M, P]) => ({ id: `${t}-${M}`, target: t, property: M, keyframes: P })),
    ...[...d].map(([M, P]) => ({ id: `${t}-${M}`, target: t, property: M, keyframes: xb(P) }))
  ];
  for (const M of Mb(t, e, x, y, u[0].pose)) {
    const P = x.findIndex((H) => H.property === M.property);
    if (P < 0) {
      x.push(M);
      continue;
    }
    const k = new zt({ id: `${t}-own`, tracks: [x[P]] }), A = (H) => Number(k.getStateAtTime(H).values.get(t)?.get(M.property) ?? 0);
    x[P] = { ...M, keyframes: M.keyframes.map((H) => ({ time: H.time, value: Number(H.value) + A(H.time) })) };
  }
  return { tracks: x, duration: y, beats: w, effects: f };
}
const vb = 1500;
function Mb(t, e, n, s, i) {
  if (!e.follow?.length) return [];
  const o = new zt({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = o.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : i[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + vb, c = pd((d) => r(d, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, u = c.map(({ time: d, value: f }) => {
      const g = Math.sin(r(d, "turn") * Math.PI / 2), p = (f - r(d, a.of)) * g;
      return { time: d, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: u };
  });
}
const Sb = 20;
function Tb(t) {
  const e = [...t].sort((s, i) => s.time - i.time), n = [];
  for (const s of e) {
    const i = n[n.length - 1];
    i && s.time - i.time < Sb ? n[n.length - 1] = { ...s, time: i.time } : n.push(s);
  }
  return n;
}
function xb(t) {
  const e = t.map((s, i) => ({ k: s, i })).sort((s, i) => s.k.time - i.k.time || s.i - i.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const Eb = {
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
function Ab(t, e = {}) {
  const n = {};
  for (const s of Object.keys(Rt)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(jt)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(_e)) n[s] = { summary: `The ${s} gag (${Is(s)} ms).` };
  for (const [s, i] of Object.entries(zs)) n[s] = { ...i };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(Eb),
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
    canvasProperties: rr,
    stickFigure: {
      poseFields: bc,
      props: wc,
      handFields: kc,
      poses: Object.keys(jt),
      expressions: Object.keys(lt),
      gags: Object.fromEntries(Object.keys(_e).map((s) => [s, Is(s)])),
      gaits: Object.keys(Rt),
      actingStyles: Object.keys(Ge),
      beatFields: fo,
      actions: n,
      dances: Object.fromEntries(Object.entries(He).map(([s, i]) => [s, Object.keys(i.moves)])),
      flips: Object.fromEntries(Object.entries(qs).map(([s, i]) => [s, i.label])),
      handShapes: Object.keys(Et),
      mudras: Object.keys(eo)
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
      beatFields: yo,
      commonControls: Object.fromEntries(Object.entries(Fn).map(([s, i]) => [s, `${i.description}${i.unit ? ` (${i.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(jh).map(([s, i]) => [s, i.summary])),
      presets: Object.fromEntries(
        Object.entries(Hn).map(([s, i]) => {
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
    character: { poses: Object.keys(sn), expressions: Object.keys(Kc), gags: Object.keys(Qo) },
    codePanel: {
      languages: ho,
      removeStyles: co,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: wh
    },
    surfaces: { code: cs, board: re, chart: Ke },
    surfaceScript: {
      "surfaceScript(figureId, { name: surface }, beats, options)": "compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)",
      "checkSurfaceBeats(beats, surfaces, cast?)": "every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions",
      "{ surface, anchor }": "a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it",
      "then: { surface, edit, anchor, at?, until?, …options }": "what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options",
      at: `a moment of the beat: ${Tn.join(", ")} (default contact, or start when the beat has none); not ms`,
      until: "a moment of this beat, or { beat: index, at? } of a later one; sets the edit’s duration (carry needs it)"
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
const At = (t) => t.map((e) => `\`${e}\``).join(", "), Sl = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function Nk(t, e = {}) {
  const n = Ab(t, e), s = n.stickFigure;
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
    Sl(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Sl(s.props),
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
    "## Surfaces",
    "",
    "Scene objects figures act on. Places are named `kind:args`: `surface.anchor(name)` gives the box there (stand on `top`, point at `x`, `y`; pass it as a beat `target`), `surface.piece(name)` makes the part there come loose, and `surface.edit(name, anchor, options)` changes the surface at a time (`at`, ms).",
    "",
    "Beats name places and say what surfaces do in answer (`surfaceScript`):",
    "",
    ...Object.entries(n.surfaceScript).map(([o, r]) => `- \`${o}\`: ${r}`),
    "",
    ...Object.entries(n.surfaces).flatMap(([o, r]) => [
      `### ${o}`,
      "",
      ...r.create ? [`\`${r.create}\``, ""] : [],
      "Anchors:",
      ...Object.entries(r.anchors).map(([a, l]) => `- \`${a}\`: ${l}`),
      "",
      "Edits:",
      ...Object.entries(r.edits).map(([a, l]) => `- \`${a}\`: ${l}`),
      ""
    ]),
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
function Dk(t, e, n, s = {}) {
  const i = s.color ?? "#555", o = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = Xt(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? S1(t, { x: r.x, y: r.y }, a, { size: o, color: i, seed: l }) : r.kind === "exhaust" ? Ob(t, r, a, o, i, l) : r.kind === "skid" ? Ib(t, r, a, n, i) : r.kind === "honk" ? _b(t, r, a, o, i) : r.kind === "smoke" ? $b(t, r, n, o, i) : r.kind === "leaves" && Pb(t, r, a, o, s.leafColor ?? "#5cae5a", i, l);
  }
}
function $b(t, e, n, s, i, o) {
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
function Pb(t, e, n, s, i, o, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = o, t.fillStyle = i;
  for (let c = 0; c < 4; c++) {
    const h = Xt(`${r}:${c}`) % 1e3 / 1e3, u = Math.min(1, n * (1.1 + h * 0.4)), d = e.x + (h - 0.5) * s * 1.2, f = e.y + (h - 0.3) * s * 0.4, g = u * u * 0.4 + u * 0.6, p = d + a * u * s * (0.6 + h) + Math.sin(u * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, f + (l - f) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(u * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function Ob(t, e, n, s, i, o) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = i, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (Xt(`${o}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, u = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, u, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function Ib(t, e, n, s, i) {
  const o = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (o - e.x) * r;
  t.save(), t.strokeStyle = i, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function _b(t, e, n, s, i) {
  const o = e.direction ?? 1;
  t.save(), t.strokeStyle = i, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + o * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, o > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, o > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function jk(t) {
  const e = new zt({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], i = [], o = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const u = ur(t.prop, { state: e.getStateAtTime(h) }, t.propId), d = u.anchor(t.anchor);
    s.push({ time: h, value: d.x + (t.offset?.x ?? 0) - t.figure.x }), i.push({ time: h, value: d.y + (t.offset?.y ?? 0) - t.figure.y });
    const f = Math.sin(u.values.turn * Math.PI / 2);
    if (Math.abs(f) > 0.15 && (a = f > 0 ? 1 : -1), o.push({ time: h, value: Math.abs(f) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: i }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: o }, { id: `${l}-facing`, target: l, property: "facing", keyframes: Hb(r) }), c;
}
function Hb(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function Wk(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, i = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = i.get(s(r));
    if (!a) return r;
    i.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, u) => h.time - u.time);
    return { ...r, keyframes: c };
  }), ...i.values()];
}
function Bk(t) {
  const e = new zt({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((f) => f.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, i = s.x + s.width / 2, o = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = o.wheelSpin ?? 0, u;
  for (let f = t.start; ; f = Math.min(t.end, f + n)) {
    const g = ur(t.leader, { state: e.getStateAtTime(f) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, b = Vs(s.prop, { ...o, turn: m }, s.propScale).anchors[t.anchor];
    if (!b) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const S = p.x - b.point.x;
    if (u !== void 0 && r) {
      const w = Math.sin(m * Math.PI / 2);
      h += (S - u) * (w || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (u = S, a.push({ time: f, value: S - i }), l.push({ time: f, value: m }), c.push({ time: f, value: h }), f >= t.end) break;
  }
  const d = t.towedId;
  return [
    { id: `${d}-x`, target: d, property: "x", keyframes: a },
    { id: `${d}-turn`, target: d, property: "turn", keyframes: l },
    ...r ? [{ id: `${d}-wheelSpin`, target: d, property: "wheelSpin", keyframes: c }] : []
  ];
}
const Tl = /* @__PURE__ */ new WeakMap();
function Cb(t, e) {
  const n = e?.some(Boolean) ? e.map((d) => d ? 1 : 0).join("") : "";
  let s = Tl.get(t);
  s || Tl.set(t, s = /* @__PURE__ */ new Map());
  const i = s.get(n);
  if (i) return i;
  const o = Hs(t), r = { vertices: o.vertices, faces: o.faces.filter((d, f) => !e?.[f]) }, a = r.vertices.flatMap((d) => [d[0], d[1], d[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((d) => {
    for (const p of d.corners) for (const m of [0, 1, 2]) l[p][m] += d.normal[m];
    const [f, ...g] = d.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, b, S] = [f, g[p], g[p + 1]], [w, y, v] = [r.vertices[m], r.vertices[b], r.vertices[S]], E = [y[0] - w[0], y[1] - w[1], y[2] - w[2]], T = [v[0] - w[0], v[1] - w[1], v[2] - w[2]], x = [E[1] * T[2] - E[2] * T[1], E[2] * T[0] - E[0] * T[2], E[0] * T[1] - E[1] * T[0]], M = x[0] * d.normal[0] + x[1] * d.normal[1] + x[2] * d.normal[2];
      c.push(...M >= 0 ? [m, b, S] : [m, S, b]);
    }
  });
  const h = l.flatMap((d) => {
    const f = Math.hypot(...d) || 1;
    return [d[0] / f, d[1] / f, d[2] / f];
  }), u = As({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, u), u;
}
function Rb(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", i = (n.outline ?? 2) * (t.outline ?? 1), o = t.glow && e.glow > 0 ? Lb(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: Hs(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...i > 0 ? { outline: { width: i, color: s } } : {},
    ...o ? { emissive: o } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function Lb(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((i) => Math.round(parseInt(n[1].slice(i, i + 2), 16) * Math.max(0, Math.min(1, e)))).map((i) => i.toString(16).padStart(2, "0")).join("")}` : t;
}
const Fb = As(Uc(1, 2e-3, 28));
function Nb(t, e, n) {
  const s = t.rig, [i, o] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, ft(s, e, "lift")), a = Math.max(0, ft(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: Fb,
    world: bt(n, Ao([0, 4e-3, 0], [0, 0, 0, 1], [i * 0.55 * a || 1e-4, 1, o * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const Db = /* @__PURE__ */ new Set([
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
]), jb = 1, qk = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in Hn ? [] : [rt("prop preset", e.prop, Object.keys(Hn))];
    for (const [s, i] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      i in e && n.push(`${i} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((o) => o === s ? e[i] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return mb(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: i, lights: o = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [T, x] of n)
      typeof x == "number" && !Db.has(T) && (h[T] = x);
    h.turn = 0, h.tilt = 0;
    const u = bt(i.view, s), d = {
      toView: (T) => Ct(u, T),
      toScreen: (T) => a(T)
    }, f = d.toView([0, c.rig.height / 2, 0]);
    if (-f[2] <= i.near) return null;
    if (l.look === "mesh") {
      const T = $y(c.rig, h), x = T.map(({ part: k, local: A }) => ({ part: k.id, mesh: Hs(k.shape), ...ar(Hs(k.shape), A) })), M = _h(x), P = T.map((k, A) => ({ ...k, hidden: Hh(k.part.id, x[A].mesh, k.local, x[A].key, M) })).filter(({ opacity: k }) => k > 0.01).map(({ part: k, matrix: A, glow: H, opacity: O, hidden: _ }) => ({
        mesh: Cb(k.shape, _),
        world: bt(s, A),
        material: Rb(k, { glow: H, opacity: O }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? P : [Nb(c, h, s), ...P] };
    }
    const g = a(f), p = a(d.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), b = o.length === 0 ? void 0 : (T, x) => {
      const M = Ct(s, T), P = [s[0] * x[0] + s[4] * x[1] + s[8] * x[2], s[1] * x[0] + s[5] * x[1] + s[9] * x[2], s[2] * x[0] + s[6] * x[1] + s[10] * x[2]], k = Math.hypot(...P) || 1;
      return { light: th(M, [P[0] / k, P[1] / k, P[2] / k], o), fog: eh(r, Math.hypot(M[0] - i.position[0], M[1] - i.position[1], M[2] - i.position[2])) };
    }, S = Ch(c.rig, h, d, m, { perspective: !0, near: i.near, slice: jb, light: b }), w = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, y = sh(S), v = S.cells ?? [], E = Math.max(...v.map((T) => -T.depth), -f[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: E + c.rig.length, draw: (T) => ih(T, S, w) }],
        ...v.map((T) => ({
          depth: -T.depth,
          draw(x, M) {
            x.lineCap = "round", x.lineJoin = "round", om(x, T.parts, y, { ...w, time: M.time });
          }
        }))
      ]
    };
  }
}, xl = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], Wb = 0.25, Bb = 800 / 180, qb = 220, Kb = 300, Yb = ["turn"];
function zb(t) {
  const e = dr(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !Yb.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function Xb(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = zb(e), i = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], o = [];
  return t.forEach((r, a) => {
    const l = (u) => o.push({ beat: a, message: u });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${i[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const u of Object.keys(c)) xl.includes(u) || l(rt("beat field", u, xl, h[u]));
    if (typeof c.do != "string" || !i.includes(c.do)) {
      const u = c.do === "turn" ? "face" : void 0;
      return l(rt(`${e.kind} 3D beat`, c.do, i, u));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !Se(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(Se)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(Se(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), o;
}
function Kk(t, e, n, s) {
  const i = Xb(n, e);
  if (i.length > 0) throw new Error(`propScript3D (${e.kind}): ${i.length} problem(s) in the beats:
${i.map((w) => `  beat ${w.beat}: ${w.message}`).join(`
`)}`);
  const o = {};
  for (const w of [...Object.keys(Fn), ...Object.keys(e.rig.controls)]) o[w] = s.values?.[w] ?? ft(e.rig, {}, w);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (w, y, v, E = "linear") => {
    const T = c.get(w) ?? [];
    T.push({ time: y, value: v, easing: E }), c.set(w, T);
  }, u = (w, y, v) => h(w, y, v);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const d = (w, y) => {
    const v = Ps(l, y);
    if (Math.abs(v) < 1) return w;
    const E = Math.max(qb, Math.abs(v) * Bb);
    return u("rotateY", w, l), l += v, h("rotateY", w + E, l, "ease-in-out"), w + E;
  }, f = (w, y, v) => {
    const E = hh([[r, a], ...y.through ?? [y.to]]);
    if (E.length < 2) return v;
    const T = d(v, Ve(E[0].point, E[1].point)), x = E[E.length - 1].at, M = y.for ?? x / (y.speed ?? w.speed) * 1e3, P = Pt("ease-in-out"), k = Math.min(Kb, M / 4);
    for (const [F, W] of Object.entries(w.set ?? {}))
      u(F, T, o[F]), h(F, T + 1, W), o[F] = W;
    const A = w.flies ? y.height ?? (o.lift > 0.05 ? o.lift : 2) : void 0, H = A !== void 0 && A > 0.05;
    for (const [F, W] of Object.entries(w.hold ?? {}))
      u(F, T, o[F]), h(F, T + k, W, "ease-out"), H || (h(F, T + M - k, W), h(F, T + M, 0, "ease-in")), o[F] = H ? W : 0;
    A !== void 0 && (u("lift", T, o.lift), h("lift", T + Math.min(M * 0.35, 1400), A, "ease-out"), h("lift", T + M, A), o.lift = A);
    const O = { ...o };
    let _ = l;
    for (let F = 0; ; F = Math.min(x, F + Wb)) {
      const W = T + dh(P, F / x) * M, { point: j, direction: I } = uh(E, F);
      _ += Ps(_, Ve([0, 0], I)), h("x", W, j[0]), h("z", W, j[1]), h("rotateY", W, _);
      for (const [R, L] of Object.entries(w.perMetre ?? {})) h(R, W, O[R] + F * L);
      for (const [R, L] of Object.entries(w.perSecond ?? {})) h(R, W, O[R] + (W - T) / 1e3 * L);
      if (F >= x) break;
    }
    for (const [F, W] of Object.entries(w.perMetre ?? {})) o[F] = O[F] + x * W;
    for (const [F, W] of Object.entries(w.perSecond ?? {})) o[F] = O[F] + M / 1e3 * W;
    return [r, a] = E[E.length - 1].point, l = _, T + M;
  }, g = (w, y) => {
    const v = Object.fromEntries(Object.entries(w).filter(([T]) => !["at", "to", "through", "toward"].includes(T))), E = kb(t, e, [v], { start: { ...o, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const T of E.tracks) {
      if (Ub.includes(T.property)) continue;
      const x = T.keyframes ?? [], M = o[T.property];
      if (!x.every((P) => P.value === M)) {
        u(T.property, y, M);
        for (const P of x) P.time > 0 && c.get(T.property).push({ ...P, time: y + P.time });
        o[T.property] = x[x.length - 1].value;
      }
    }
    return y + E.duration;
  }, p = [];
  let m = 0;
  for (const w of n) {
    const y = w.at ?? m;
    let v = y;
    const E = e.moves?.[w.do];
    E ? v = f(E, w, y) : w.do === "face" ? v = d(y, typeof w.toward == "number" ? w.toward : Ve([r, a], w.toward)) : w.do === "hold" ? v = y + (w.for ?? 1e3) : v = g(w, y), p.push({ do: w.do, start: y, end: v }), m = v;
  }
  const b = `${s.scene}/${t}`;
  return { tracks: [...c].map(([w, y]) => ({
    id: `${t}-${w}`,
    target: b,
    property: w,
    keyframes: ch(y)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...o } } };
}
const Ub = ["x", "y", "turn", "facing", "tilt"], Vb = 0.35, Gb = {
  seated: sn.sit,
  astride: { ...sn.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 }
}, El = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function Yk(t) {
  const e = `${t.scene}/${t.propId}`, n = new zt({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [i, o, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = Vc({ ...t.character, height: 1 }), c = { ...pt, ...t.pose ?? Gb.seated }, h = Ko(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, u = t.facing ?? 0, d = t.every ?? 33, f = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + d)) {
    const b = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), S = (O, _) => {
      const D = b.get(O);
      return typeof D == "number" ? D : _;
    }, w = { ...s.values };
    for (const O of Object.keys(a.controls)) w[O] = S(O, s.values?.[O] ?? ft(a, {}, O));
    for (const O of ["pitch", "roll", "squash", "lift", "lean", "size"]) w[O] = S(O, s.values?.[O] ?? ft(a, {}, O));
    const y = Py(a, w)[t.anchor];
    if (!y) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const v = S("rotateY", s.heading ?? 0), E = El(y, v), T = [S("x", i) + E[0], S("y", o) + E[1], S("z", r) + E[2]], x = v + u, M = El(h, x);
    let P = [T[0] - M[0], T[1] - M[1], T[2] - M[2]];
    const k = (O, _) => {
      const D = _ * _ * (3 - 2 * _);
      return [O[0] + (P[0] - O[0]) * D, P[1] * D + Vb * Math.sin(Math.PI * _), O[1] + (P[2] - O[1]) * D];
    }, A = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, H = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + A ? P = k(t.mount.from, (m - t.start) / A) : t.dismount && m > t.end - H && (P = k(t.dismount.to, (t.end - m) / H)), f.x.push({ time: m, value: P[0] }), f.y.push({ time: m, value: P[1] }), f.z.push({ time: m, value: P[2] }), f.rotateY.push({ time: m, value: x }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(f).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: f[m] }));
}
function zk(t) {
  const { timeline: e } = t, n = new Ae();
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
const Xk = {
  timeline: zd,
  to(t, e, n) {
    const s = new Ye(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new Ye(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const i = new Ye(s);
    return i.fromTo(t, e, n), i;
  },
  set(t, e, n) {
    const s = new Ye(n);
    return s.set(t, e), s;
  }
};
function Wh(t, e, n) {
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
function Jb(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), i = Math.min(0.999, Math.max(0, e));
  for (let o = 0; o < n; o++) {
    const r = t[o * 4] / 255, a = t[o * 4 + 1] / 255, l = t[o * 4 + 2] / 255, c = t[o * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= i) continue;
    const u = (h - i) / (1 - i) * c / h;
    s[o * 3] = r * u, s[o * 3 + 1] = a * u, s[o * 3 + 2] = l * u;
  }
  return s;
}
function Al(t, e, n, s, i) {
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
function $l(t, e, n, s) {
  const i = Math.max(1, Math.round(s / Math.sqrt(3)));
  let o = t;
  for (let r = 0; r < 3; r++)
    o = Al(o, e, n, i, !0), o = Al(o, e, n, i, !1);
  return o;
}
function Uk(t, e = {}) {
  const n = t.canvas, s = n.width, i = n.height;
  if (!(s > 0 && i > 0)) return;
  const o = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / o)), a = Math.max(1, Math.ceil(i / o)), l = Wh(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = Jb(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, i) * 0.02) / o, d = $l(h, r, a, u), f = $l(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let b = 0; b < 3; b++) p.data[m * 4 + b] = Math.round(Math.min(1, d[m * 3 + b] + f[m * 3 + b] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, i), t.restore();
}
function Vk(t, e, n) {
  const s = n.width ?? 6, i = n.taper ?? 1, o = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = Qb(e, s, i, o, r);
    a ? (t.globalCompositeOperation = "lighter", wo(t, c, n.color)) : tw(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, Zb(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function Zb(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const i = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return i ? `rgba(${i[1]}, ${i[2]}, ${i[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function Qb(t, e, n, s, i) {
  const o = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = bd(o), a = wd(o) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = i * (1 - s * h);
    if (u <= 0) continue;
    const d = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...d && a && { cap: a } });
  }
  return l;
}
function wo(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [i, o, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(i.x, i.y), t.lineTo(o.x, o.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function tw(t, e, n) {
  const s = typeof t.getTransform == "function" ? t.getTransform() : null, i = (p) => s ? { x: s.a * p.x + s.c * p.y + s.e, y: s.b * p.x + s.d * p.y + s.f } : p, o = s ? Math.sqrt(Math.abs(s.a * s.d - s.b * s.c)) : 1, r = e.map((p) => ({
    ...p,
    corners: p.corners.map(i),
    ...p.cap && { cap: { ...p.cap, ...i(p.cap), radius: p.cap.radius * o, start: p.cap.start + (s ? Math.atan2(s.b, s.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, c = -1 / 0, h = -1 / 0;
  for (const p of r) {
    const m = p.cap ? [{ x: p.cap.x - p.cap.radius, y: p.cap.y - p.cap.radius }, { x: p.cap.x + p.cap.radius, y: p.cap.y + p.cap.radius }] : [];
    for (const b of [...p.corners, ...m])
      a = Math.min(a, b.x), l = Math.min(l, b.y), c = Math.max(c, b.x), h = Math.max(h, b.y);
  }
  if (!(c > a && h > l)) return;
  const u = Math.floor(a) - 1, d = Math.floor(l) - 1, f = s ? Wh(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - d) : null, g = f?.getContext("2d");
  if (!f || !g) {
    wo(t, e, n);
    return;
  }
  g.translate(-u, -d), g.globalCompositeOperation = "lighter", wo(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(f, u, d), t.restore();
}
const Gk = Wt.to, Jk = Wt.from, Zk = Wt.fromTo, Qk = Wt.set, t2 = Wt.timeline, e2 = Wt.ticker, n2 = Wt.splitText, s2 = Wt.context, i2 = Wt.matchMedia, o2 = Wt.quickTo, r2 = Wt.imageSequence, a2 = Wt.pageTransition;
R0();
export {
  Ge as ACTING_STYLES,
  Lh as AIRCRAFT_ACTING,
  Nn as ANIMAL_GAITS,
  fo as BEAT_FIELDS,
  Tn as BEAT_MOMENTS,
  ub as BIRD_ACTING,
  Ca as BOARD_MARKS,
  Vn as BOARD_THEMES,
  rr as CANVAS_PROPERTIES,
  Oa as CHARACTER_BEAT_3D_FIELDS,
  Am as CHARACTER_GAIT_SPEEDS,
  Da as CHART_KINDS,
  Ke as CHART_SURFACE,
  Gn as CHART_THEMES,
  ho as CODE_LANGUAGES,
  wh as CODE_PANEL_EDITS,
  cs as CODE_SURFACE,
  Wm as CODE_THEME,
  sw as Clock,
  Ye as CompatTimeline,
  i0 as CustomBounce,
  s0 as CustomEase,
  o0 as CustomWiggle,
  He as DANCE_STYLES,
  Wl as DEFAULT_BAKE_INTERVAL_MS,
  gr as DEFAULT_INERTIA_FRICTION,
  y0 as DEFAULT_LABELS,
  qt as DEFAULT_SPRING,
  jw as DEFAULT_TRANSITION,
  cc as Draggable,
  lt as EXPRESSIONS,
  z0 as FINGERS,
  qs as FLIPS,
  pr as FORMAT_VERSION,
  _e as GAGS,
  Rt as GAITS,
  Za as GAIT_CYCLE_MS,
  Mt as HAND_REST,
  Et as HAND_SHAPES,
  Ck as HORSE_ACTING,
  Hk as HORSE_GAITS,
  Uy as HOUSE_ACTING,
  b1 as HUMAN_ACTING_RIG,
  Kc as HUMAN_EXPRESSIONS,
  Qo as HUMAN_GAGS,
  sn as HUMAN_POSES,
  pt as HUMAN_REST,
  Hm as IDENTITY_CAMERA,
  Vh as INERTIA_MAX_DURATION_MS,
  Yu as InertiaTrackPlayer,
  ne as LiveTimeline,
  hw as MORPH_SAMPLES,
  eo as MUDRAS,
  nw as ManualClock,
  ea as MediaSync,
  bf as Observer,
  jt as POSES,
  xl as PROP_BEAT_3D_FIELDS,
  yo as PROP_BEAT_FIELDS,
  jh as PROP_COMMON_ACTIONS,
  Fn as PROP_COMMON_CONTROLS,
  Hn as PROP_PRESETS,
  Nh as QUADRUPED_ACTING,
  co as REMOVE_STYLES,
  nt as REST_POSE,
  Gb as RIDING_POSES,
  ze as SAMPLE_STEP,
  zs as SCRIPT_ACTIONS,
  Hl as SPRING_MAX_DURATION_MS,
  Zs as SPRING_PRESETS,
  mn as SPRING_STEP_MS,
  g1 as STICK_ACTING_RIG,
  jf as ScrollAnimator,
  js as ScrollDriver,
  Wf as ScrollMarkers,
  Rf as ScrollPin,
  Ur as SmoothScroll,
  Rs as SpringSampler,
  Ku as SpringTrackPlayer,
  hf as Stage,
  Yy as TREE_ACTING,
  zt as Timeline,
  Ho as TinyflyPlayer,
  L0 as TinyflySequencer,
  si as TrackPlayer,
  Cy as VEHICLE_ACTING,
  be as VISEMES,
  kw as ValueResolver,
  Cf as VisibilityDriver,
  re as WHITEBOARD_SURFACE,
  Tk as actCharacterTracks,
  ir as actKeyframes,
  w1 as actTracks,
  Th as actionNames,
  Zy as airplane,
  Xe as anchorError,
  cr as animalStrideLength,
  py as animatableProperties,
  Uk as applyBloom,
  dk as applyCamera,
  Qp as applyGroove,
  Ga as assertBeats,
  au as backOut,
  Vw as bakeDanceTracks,
  Yl as bakeEasing,
  ql as bakeInertiaTrack,
  Bl as bakeSpringTrack,
  Sk as basicOutfit,
  zw as beatAt,
  To as beatAtTime,
  Ql as beatLength,
  So as beatTime,
  Ew as beatsBetween,
  By as bike,
  $0 as bindChoiceHotspots,
  hr as bird,
  Pn as blendPose,
  Mc as boilFrame,
  ru as bounceOut,
  wm as boxMesh,
  Ny as bus,
  uk as cameraFromValues,
  fk as cameraPoint,
  $w as cameraTracks,
  Ab as capabilities,
  Nk as capabilitiesMarkdown,
  Ly as car,
  jy as cart,
  lb as cat,
  lo as changingWindows,
  Vc as character,
  rk as characterAt,
  Jg as characterHandPose,
  Gg as characterJoints,
  ek as characterJointsInView,
  ck as characterObjects,
  tm as characterPartsInView,
  ak as characterPoseTracks,
  hk as characterScript3D,
  ok as characterTarget,
  Xu as charactersFor,
  Mk as chart,
  _s as checkBeats,
  xh as checkCast,
  _m as checkCharacterBeats3D,
  wb as checkPropBeats,
  Xb as checkPropBeats3D,
  cy as checkSurfaceBeats,
  _k as checkTracks,
  gb as chicken,
  gk as circlePath,
  fc as clamp01,
  uw as clearMorphCache,
  lw as clearPathCache,
  yh as clipErased,
  gs as closestName,
  kk as codePanel,
  Xm as codeTokens,
  Yr as containerProgressAt,
  s2 as context,
  ft as controlValue,
  cb as cow,
  Fw as create,
  v0 as createControls,
  iu as createCubicBezier,
  u0 as createLive,
  Ws as createPen,
  rn as createRandom,
  Wi as createTrack,
  rw as criticalDamping,
  pb as crow,
  id as customBounce,
  sd as customEase,
  od as customWiggle,
  km as cylinderMesh,
  No as danceFrame,
  Kw as dancePose,
  no as danceStance,
  Yw as danceTaps,
  Uw as danceTracks,
  pi as danceTravel,
  sg as danceTravelTrack,
  Xw as dancer,
  $k as defineAction,
  Pk as defineGait,
  fy as describeTarget,
  xn as deserializeTimeline,
  Zu as deserializeTrack,
  Aw as detectTempo,
  ab as dog,
  _w as draggable,
  Lo as drawCartoonHand,
  Qg as drawCharacter,
  nk as drawCharacterInView,
  S1 as drawDustPuff,
  fh as drawEraser,
  gh as drawHand,
  Ek as drawImpactStars,
  Cm as drawPencil,
  Fk as drawProp,
  Dk as drawPropEffects,
  ih as drawPropShadow,
  om as drawSolvedFaces,
  lk as drawSolvedPart,
  nh as drawSolvedProp,
  v1 as drawSpeedLines,
  Bp as drawStickFigure,
  xk as drawStickSmear,
  Vk as drawTrail,
  mk as drawnPathTarget,
  tu as easeIn,
  Cl as easeInCubic,
  nu as easeInOut,
  Fs as easeInOutCubic,
  Qh as easeInOutQuad,
  Jh as easeInQuad,
  eu as easeOut,
  Rl as easeOutCubic,
  Zh as easeOutQuad,
  fd as editDistance,
  sr as editError,
  tr as editLog,
  ou as elasticOut,
  oa as ellipsePoints,
  vm as ellipsoidMesh,
  wk as erasable,
  or as expandBeats,
  Bu as expandParametricEasings,
  Sm as extrudeMesh,
  kg as flipPose,
  Gw as flipTracks,
  vg as flipTravel,
  Pl as formatVersionFor,
  Jk as from,
  yw as fromJSON,
  Zk as fromTo,
  Ba as gag,
  Is as gagDuration,
  fp as gaitPose,
  ca as gaitStrideLength,
  Pt as getEasingFunction,
  ps as getInterpolator,
  zl as getMotionPathPoint,
  cw as getPathLength,
  bu as getPointAtProgress,
  kf as gridLinesFor,
  pk as handAt,
  Ji as handJoints,
  ip as handJointsAt,
  $h as handPath,
  vt as handPose,
  Ss as handProp,
  Kh as hasKeyframes,
  Xt as hashSeed,
  Bw as headPoint,
  Yh as heldTime,
  Gy as helicopter,
  rb as horse,
  Rk as horseStrideLength,
  Xy as house,
  Zw as humanFieldLabel,
  dm as humanGag,
  hm as humanGaitPose,
  um as humanGaitStrideLength,
  Rg as humanPlan,
  Ft as humanPose,
  r2 as imageSequence,
  Rn as inertiaDuration,
  Cn as inertiaRest,
  Fi as inertiaValueAt,
  aw as inertiaVelocityAt,
  Du as interpolateArray,
  Nu as interpolateColor,
  gw as interpolateMotionPath,
  ee as interpolateNumber,
  Wu as interpolatePathString,
  ju as interpolateQuaternion,
  Pr as interpolateString,
  qh as isCubicBezierEasing,
  Pe as isInertiaTrack,
  ew as isMotionPathPoint,
  Ol as isMotionPathTrack,
  ds as isParametricEasing,
  Ln as isPathData,
  Oe as isSpringTrack,
  ko as isTextTrack,
  ow as isUnderdamped,
  ww as isUnresolved,
  em as jointsInScene,
  Wp as jointsToScene,
  Ni as linear,
  Sh as lipSyncKeyframes,
  O1 as lipSyncOver,
  Ak as lipSyncTracks,
  rh as lit,
  Wt as live,
  ys as mapEase,
  Iw as mat4,
  i2 as matchMedia,
  _l as maxStaggerDistance,
  Jw as mirrorHumanPose,
  Jp as mirrorPose,
  ah as mixColors,
  $n as mixHandPoses,
  sk as mixPoses,
  Ou as morphPath,
  qy as motorbike,
  O0 as mount,
  H0 as mountAll,
  Mw as narrationMarkers,
  Sw as narrationSceneAt,
  fs as naturalRest,
  Tw as nearestBeat,
  xw as nextBeat,
  s1 as niceCeiling,
  a2 as pageTransition,
  Tm as panelMesh,
  cu as parametricEasing,
  In as parseAnchor,
  Kr as parseEdge,
  Qe as parsePath,
  dc as parseTrigger,
  An as partialPath,
  D0 as pathLength,
  Ik as persona,
  nr as pieceMotion,
  vw as planNarration,
  Lw as play,
  Dw as playSequence,
  Cw as playWhenVisible,
  Xl as playheadCrossings,
  Co as pointAlong,
  Ll as pointAtDistance,
  tk as pointOnHead,
  gd as pointsToPath,
  xt as pose,
  qw as poseTracks,
  dr as propActions,
  Py as propAnchors3D,
  ur as propAt,
  yb as propControls,
  sh as propLineWidth,
  qk as propObjects,
  $y as propPartsInSpace,
  mb as propPreset,
  jk as propRide,
  Yk as propRide3D,
  kb as propScript,
  Kk as propScript3D,
  Hs as propShapeMesh,
  Lk as propTarget,
  Bk as propTow,
  xy as propView,
  Us as quadruped,
  dw as quat,
  zk as quickPlay,
  o2 as quickTo,
  Vl as randomBetween,
  bw as randomChoice,
  td as randomSnapped,
  ik as reachCharacter,
  kh as resolveActingStyle,
  Qc as resolveCharacterPoseKeys,
  Bs as resolveGait,
  jc as resolvePoseKeys,
  ed as resolveSequence,
  Lc as resolveStickFrame,
  qp as resolveStickPose,
  Zl as resolveValue,
  bd as ribbon,
  wd as ribbonHeadCap,
  bh as rideFloors,
  $e as rotateAbout,
  Do as routineBeats,
  nn as rubberLimb,
  Eh as scriptActionSummaries,
  Ah as scriptTracks,
  Hw as scrollProgress,
  Rw as scrubOnScroll,
  yk as scrubPath,
  Ww as seatHeight,
  Qu as serializeTimeline,
  Ju as serializeTrack,
  Qk as set,
  Zo as shade,
  Em as shapeMesh,
  xo as shapeToPathData,
  qu as simplifyKeyframes,
  ib as sittingPose,
  Yo as skeletonInView,
  Ui as sketchPen,
  lh as smoothPath,
  Hf as smoothToward,
  wf as snapAxis,
  Ff as snapConfig,
  Df as snapDuration,
  Nf as snapProgress,
  Vs as solveAt,
  Bo as solvePlanSpace,
  Ch as solveProp,
  fb as songbird,
  P1 as soundsOf,
  ey as speechDuration,
  Wk as spliceTracks,
  n2 as splitText,
  zh as springDuration,
  pd as springFollow,
  iw as springValueAt,
  Ko as stagePlanSpace,
  Il as staggerDistance,
  vo as staggerOffset,
  Li as staggerOffsets,
  Cs as staggerSpan,
  _1 as stepsDuration,
  lu as stepsEasing,
  Mh as stepsToKeys,
  Dc as stickFigureAt,
  ye as stickFigureJoints,
  Nc as stickFigureTarget,
  Qw as stickToHuman,
  mp as strideLength,
  $t as surfaceBox,
  Ok as surfaceScript,
  m0 as syncMediaElement,
  yp as talkingMouth,
  Ro as taperedLine,
  rs as taperedOutline,
  Vu as textAt,
  Xk as tf,
  e2 as ticker,
  t2 as timeline,
  Gk as to,
  mw as toJSON,
  fw as toKeyframedTrack,
  pw as toKeyframedTracks,
  we as trackTargets,
  Dy as tractor,
  Pw as trailSamples,
  Wy as trainCar,
  Ky as tree,
  En as triggerDistance,
  Fy as truck,
  xm as tubeMesh,
  rt as unknownName,
  Nw as unmount,
  er as valueAt,
  Ow as vec3,
  pe as vehicle,
  gp as walkPose,
  vk as whiteboard,
  bk as withErased,
  ve as withExpression
};
