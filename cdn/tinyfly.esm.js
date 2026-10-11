function Bd(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function js(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const ga = 2;
function Zc(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function gr(t) {
  return t.property === "text" && "textConfig" in t;
}
function je(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function Xe(t) {
  return t.kind === "spring" && "spring" in t;
}
function Qc(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function Y5(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function qd(t) {
  return "keyframes" in t;
}
class K5 {
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
class j5 {
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
function zd(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function th(t, e, n = "start") {
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
function eh(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, th(s, t, e));
  return n;
}
function mr(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", o = th(t, e, s);
  if (n.amount !== void 0) {
    const i = eh(e, s);
    return i === 0 ? 0 : n.amount * o / i;
  }
  return n.each !== void 0 ? n.each * o : 0;
}
function Ei(t, e) {
  return Array.from({ length: t }, (n, s) => mr(s, t, e));
}
function yo(t, e) {
  return t <= 1 ? 0 : Math.max(...Ei(t, e));
}
const Dn = 1, nh = 6e4, bs = nh / Dn, te = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Wo = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class bo {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? te.stiffness, this.damping = e.damping ?? te.damping, this.mass = e.mass ?? te.mass, this.restDelta = e.restDelta ?? te.restDelta, this.restSpeed = e.restSpeed ?? te.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? te.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / Dn);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], o = this.samples[Math.min(n + 1, this.samples.length - 1)], i = e / Dn - n;
    return s + (o - s) * i;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(bs + 1), this.settledStep !== null ? this.settledStep * Dn : nh;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, bs + 1), s = Dn / 1e3;
    for (; this.samples.length < n; ) {
      const o = this.samples[this.samples.length - 1], i = o - this.to, r = -this.stiffness * i, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = o + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > bs && (this.settledStep = bs);
  }
}
function X5(t, e) {
  return new bo(t).valueAt(e);
}
function Yd(t) {
  return new bo(t).settleTime();
}
function U5(t) {
  const e = t.stiffness ?? te.stiffness, n = t.damping ?? te.damping, s = t.mass ?? te.mass;
  return n < 2 * Math.sqrt(e * s);
}
function G5(t) {
  const e = t.stiffness ?? te.stiffness, n = t.mass ?? te.mass;
  return 2 * Math.sqrt(e * n);
}
const ma = 4, Kd = 2e-3, jd = 1e-4, Xd = 6e4;
function wo(t) {
  const e = t.friction ?? ma;
  return e > 0 ? e : ma;
}
function Xs(t) {
  return t.from + t.velocity / wo(t);
}
function Ud(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function hs(t) {
  let e = Ud(Xs(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function ds(t) {
  const e = Math.abs(hs(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(jd, e * Kd);
  if (n >= e) return 0;
  const s = Math.log(e / n) / wo(t);
  return Math.min(Xd, s * 1e3);
}
function Ai(t, e) {
  if (e <= 0) return t.from;
  const n = hs(t);
  if (e >= ds(t)) return n;
  const s = wo(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function V5(t, e) {
  const n = wo(t), s = hs(t);
  return e >= ds(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const $i = (t) => t, Gd = (t) => t * t, Vd = (t) => 1 - (1 - t) * (1 - t), Jd = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, sh = (t) => t * t * t, oh = (t) => 1 - Math.pow(1 - t, 3), ko = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Zd = sh, Qd = oh, tu = ko, eu = {
  linear: $i,
  "ease-in": Zd,
  "ease-out": Qd,
  "ease-in-out": tu,
  "ease-in-quad": Gd,
  "ease-out-quad": Vd,
  "ease-in-out-quad": Jd,
  "ease-in-cubic": sh,
  "ease-out-cubic": oh,
  "ease-in-out-cubic": ko
};
function nu(t) {
  const [e, n, s, o] = t, i = 3 * e, r = 3 * (s - e) - i, a = 1 - i - r, l = 3 * n, c = 3 * (o - n) - l, h = 1 - l - c, d = (p) => ((a * p + r) * p + i) * p, u = (p) => ((h * p + c) * p + l) * p, f = (p) => (3 * a * p + 2 * r) * p + i, g = (p) => {
    let m = p;
    for (let w = 0; w < 8; w++) {
      const y = d(m) - p;
      if (Math.abs(y) < 1e-7)
        return m;
      const S = f(m);
      if (Math.abs(S) < 1e-7)
        break;
      m -= y / S;
    }
    let b = 0, M = 1;
    for (m = p; b < M; ) {
      const w = d(m);
      if (Math.abs(w - p) < 1e-7)
        return m;
      p > w ? b = m : M = m, m = (b + M) / 2;
    }
    return m;
  };
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const m = g(p);
    return u(m);
  };
}
function Fo(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function su(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (o) => o <= 0 ? 0 : o >= 1 ? 1 : n * Math.pow(2, -10 * o) * Math.sin((o - s) * (2 * Math.PI) / e) + 1;
}
const ou = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) {
    const o = t - 0.5454545454545454;
    return 7.5625 * o * o + 0.75;
  }
  if (t < 2.5 / 2.75) {
    const o = t - 0.8181818181818182;
    return 7.5625 * o * o + 0.9375;
  }
  const s = t - 2.625 / 2.75;
  return 7.5625 * s * s + 0.984375;
};
function iu(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function ru(t, e = "end") {
  const n = Math.max(1, Math.floor(t));
  return (s) => {
    if (s >= 1) return 1;
    if (s <= 0) return e === "start" || e === "both" ? e === "start" ? 1 / n : 1 / (n + 1) : 0;
    const o = Math.floor(s * n);
    switch (e) {
      case "start":
        return Math.min(1, (o + 1) / n);
      case "both":
        return (o + 1) / (n + 1);
      case "none":
        return n === 1 ? 0 : Math.min(1, o / (n - 1));
      default:
        return o / n;
    }
  };
}
function au(t) {
  switch (t.type) {
    case "steps":
      return ru(t.count, t.position);
    case "elastic":
      return Fo(su(t.amplitude, t.period), t.mode);
    case "bounce":
      return Fo(ou, t.mode);
    case "back":
      return Fo(iu(t.overshoot), t.mode);
  }
}
function Rt(t) {
  return t === void 0 ? $i : Bd(t) ? nu(t.points) : js(t) ? au(t) : eu[t] ?? $i;
}
const ya = 32, lu = 256, hn = /* @__PURE__ */ new Map(), cu = /[MmLlHhVvCcSsQqTtAaZz]/, hu = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, du = {
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
function uu(t) {
  const e = [];
  let n = 0, s = null;
  const o = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (o(), !(n >= t.length)); ) {
    const i = t[n];
    if (cu.test(i)) {
      s = { type: i, args: [] }, e.push(s), n++;
      continue;
    }
    if (!s) break;
    const r = s.type === "A" || s.type === "a", a = s.args.length % 7;
    if (r && (a === 3 || a === 4)) {
      if (i !== "0" && i !== "1") break;
      s.args.push(i === "1" ? 1 : 0), n++;
      continue;
    }
    const l = hu.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function fu(t, e, n, s, o, i, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const d = o * Math.PI / 180, u = Math.cos(d), f = Math.sin(d), g = (t - a) / 2, p = (e - l) / 2, m = u * g + f * p, b = -f * g + u * p, M = m * m / (c * c) + b * b / (h * h);
  if (M > 1) {
    const T = Math.sqrt(M);
    c *= T, h *= T;
  }
  const w = i === r ? -1 : 1, y = c * c * h * h - c * c * b * b - h * h * m * m, S = c * c * b * b + h * h * m * m, E = w * Math.sqrt(Math.max(0, y / S)), A = E * c * b / h, v = -E * h * m / c, k = u * A - f * v + (t + a) / 2, x = f * A + u * v + (e + l) / 2, P = (T, C, L, $) => {
    const R = T * L + C * $, N = Math.sqrt((T * T + C * C) * (L * L + $ * $)), q = Math.acos(Math.max(-1, Math.min(1, R / N)));
    return T * $ - C * L < 0 ? -q : q;
  }, I = P(1, 0, (m - A) / c, (b - v) / h);
  let O = P((m - A) / c, (b - v) / h, (-m - A) / c, (-b - v) / h);
  !r && O > 0 && (O -= 2 * Math.PI), r && O < 0 && (O += 2 * Math.PI);
  const _ = Math.max(1, Math.ceil(Math.abs(O) / (Math.PI / 2))), W = O / _, B = 4 / 3 * Math.tan(W / 4), j = (T) => {
    const C = c * Math.cos(T), L = h * Math.sin(T);
    return [u * C - f * L + k, f * C + u * L + x];
  }, V = (T) => {
    const C = -c * Math.sin(T), L = h * Math.cos(T);
    return [u * C - f * L, f * C + u * L];
  }, K = [];
  for (let T = 0; T < _; T++) {
    const C = I + T * W, L = C + W, [$, R] = j(C), [N, q] = T === _ - 1 ? [a, l] : j(L), [D, z] = V(C), [G, F] = V(L);
    K.push([$ + B * D, R + B * z, N - B * G, q - B * F, N, q]);
  }
  return K;
}
function ve(t, e, n, s, o) {
  const i = 1 - o;
  return i * i * i * t + 3 * i * i * o * e + 3 * i * o * o * n + o * o * o * s;
}
function ba(t, e, n, s, o) {
  const i = 1 - o;
  return 3 * i * i * (e - t) + 6 * i * o * (n - e) + 3 * o * o * (s - n);
}
function In(t, e, n, s) {
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
function ws(t, e, n) {
  const [s, o, i, r, a, l] = n, c = [0];
  let h = t, d = e, u = 0;
  for (let f = 1; f <= ya; f++) {
    const g = f / ya, p = ve(t, s, i, a, g), m = ve(e, o, r, l, g);
    u += Math.hypot(p - h, m - d), c.push(u), h = p, d = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, o, i, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: u,
    lengths: c
  };
}
function Mn(t) {
  const e = hn.get(t);
  if (e) return e;
  const n = [];
  let s = 0, o = 0, i = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), d = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of uu(t)) {
    const b = p.toUpperCase(), M = p !== b, w = du[b];
    if (b === "Z") {
      (s !== i || o !== r) && d(In(s, o, i, r)), c >= 0 && h.add(c), s = i, o = r, a = l = null;
      continue;
    }
    for (let y = 0; y + w <= m.length; y += w) {
      const S = m.slice(y, y + w), E = M ? s : 0, A = M ? o : 0;
      let v = null, k = null;
      switch (b) {
        case "M":
          y === 0 ? (s = S[0] + E, o = S[1] + A, i = s, r = o, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (d(In(s, o, S[0] + E, S[1] + A)), s = S[0] + E, o = S[1] + A);
          break;
        case "L":
          d(In(s, o, S[0] + E, S[1] + A)), s = S[0] + E, o = S[1] + A;
          break;
        case "H":
          d(In(s, o, S[0] + E, o)), s = S[0] + E;
          break;
        case "V":
          d(In(s, o, s, S[0] + A)), o = S[0] + A;
          break;
        case "C": {
          const x = [S[0] + E, S[1] + A, S[2] + E, S[3] + A, S[4] + E, S[5] + A];
          d(ws(s, o, x)), v = [x[2], x[3]], s = x[4], o = x[5];
          break;
        }
        case "S": {
          const [x, P] = a ? [2 * s - a[0], 2 * o - a[1]] : [s, o], I = [x, P, S[0] + E, S[1] + A, S[2] + E, S[3] + A];
          d(ws(s, o, I)), v = [I[2], I[3]], s = I[4], o = I[5];
          break;
        }
        case "Q":
        case "T": {
          let x = s, P = o;
          b === "Q" ? (x = S[0] + E, P = S[1] + A) : l && (x = 2 * s - l[0], P = 2 * o - l[1]);
          const I = b === "Q" ? S[2] + E : S[0] + E, O = b === "Q" ? S[3] + A : S[1] + A;
          d(
            ws(s, o, [
              s + 2 / 3 * (x - s),
              o + 2 / 3 * (P - o),
              I + 2 / 3 * (x - I),
              O + 2 / 3 * (P - O),
              I,
              O
            ])
          ), k = [x, P], s = I, o = O;
          break;
        }
        case "A": {
          const x = S[5] + E, P = S[6] + A;
          let I = s, O = o;
          for (const _ of fu(s, o, S[0], S[1], S[2], S[3], S[4], x, P))
            d(ws(I, O, _)), I = _[4], O = _[5];
          s = x, o = P;
          break;
        }
      }
      a = v, l = k;
    }
  }
  const u = n.reduce((p, m) => p + m.length, 0), f = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let b = p, M = 0;
    for (; b < n.length && n[b].subpath === m; ) M += n[b++].length;
    const w = n[p], y = n[b - 1], S = h.has(m) || Math.abs(y.endX - w.startX) < 1e-9 && Math.abs(y.endY - w.startY) < 1e-9;
    f.push({ start: p, end: b, length: M, closed: S }), p = b;
  }
  const g = { segments: n, totalLength: u, subpaths: f };
  return hn.size >= lu && hn.delete(hn.keys().next().value), hn.set(t, g), g;
}
function pu(t, e) {
  const n = t.lengths;
  if (e <= 0) return 0;
  if (e >= t.length) return 1;
  let s = 0, o = n.length - 1;
  for (; s < o - 1; ) {
    const a = s + o >> 1;
    n[a] < e ? s = a : o = a;
  }
  const i = n[o] - n[s], r = i > 0 ? (e - n[s]) / i : 0;
  return (s + r) / (n.length - 1);
}
function gu(t, e) {
  if (t.type === "L") {
    const d = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * d,
      y: t.startY + (t.endY - t.startY) * d,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, o, i, r, a] = t.points, l = pu(t, e);
  let c = ba(t.startX, n, o, r, l), h = ba(t.startY, s, i, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const d = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), u = ve(t.startX, n, o, r, d), f = ve(t.startY, s, i, a, d), g = ve(t.startX, n, o, r, l), p = ve(t.startY, s, i, a, l);
    c = l < 0.5 ? u - g : g - u, h = l < 0.5 ? f - p : p - f;
  }
  return {
    x: ve(t.startX, n, o, r, l),
    y: ve(t.startY, s, i, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function ih(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let o = 0;
  for (let i = n; i < s; i++) {
    const r = t[i];
    if (o + r.length >= e || i === s - 1)
      return gu(r, e - o);
    o += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function mu(t, e) {
  const { segments: n, totalLength: s } = Mn(t);
  return ih(n, Math.max(0, Math.min(1, e)) * s);
}
function J5() {
  hn.clear();
}
function Z5(t) {
  return Mn(t).totalLength;
}
const yu = 24, bu = 320, wu = 2.5, On = 72, Q5 = 64, ku = 0.2, vu = 128, Bn = /* @__PURE__ */ new Map();
let Rs = 0, we;
const wa = (t) => Math.round(t * 100) / 100;
function ka(t, e) {
  const { segments: n, subpaths: s, totalLength: o } = Mn(t);
  if (n.length === 0) return [];
  if (e) {
    const i = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: o, closed: i }];
  }
  return s.filter((i) => i.length > 0).map((i) => ({ segments: n, start: i.start, end: i.end, length: i.length, closed: i.closed }));
}
function Pi(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = ih(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function va(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function Ma(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Pi(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function xa(t) {
  let e = 0, n = 0;
  for (const [s, o] of t)
    e += s, n += o;
  return e /= t.length, n /= t.length, t.map(([s, o]) => [s - e, o - n]);
}
function Mu(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % On / On : 0, reversed: n < 0 };
  const o = xa(Ma(t, On)), i = xa(Ma(e, On)), r = On;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let d = 0; d < h; d++) {
      let u = 0;
      for (let f = 0; f < r && u < l; f++) {
        const g = s ? c ? (d - f + r) % r : (f + d) % r : c ? r - 1 - f : f, p = o[f][0] - i[g][0], m = o[f][1] - i[g][1];
        u += p * p + m * m;
      }
      u < l && (l = u, a = { offset: s ? d / r : 0, reversed: c });
    }
  }
  return a;
}
function xu(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Su(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Tu(t, e, n) {
  const s = t.closed && e.closed, o = Mu(t, e, n.shapeIndex), i = Math.max(
    yu,
    Math.min(bu, Math.ceil(Math.max(t.length, e.length) / wu))
  ), r = /* @__PURE__ */ new Set(), a = (d) => r.add(Math.round(d * 1e7) / 1e7);
  for (let d = 0; d <= i; d++) a(d / i);
  for (const d of va(t)) a(d);
  for (const d of va(e)) a(Su(d, o, s));
  let l = [...r].sort((d, u) => d - u);
  s && (l = l.filter((d) => d < 1));
  const c = [], h = [];
  for (const d of l)
    c.push(...Pi(t, d)), h.push(...Pi(e, xu(d, o, s)));
  return Eu({ from: c, to: h, closed: s });
}
function Eu(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = ku;
    for (let h = r + 1; h < a; h++) {
      const d = Math.max(Sa(t.from, r, a, h), Sa(t.to, r, a, h));
      d > c && (c = d, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const o = [], i = [];
  for (let r = 0; r < e; r++)
    n[r] && (o.push(t.from[r * 2], t.from[r * 2 + 1]), i.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: o, to: i, closed: t.closed };
}
function Sa(t, e, n, s) {
  const o = t[e * 2], i = t[e * 2 + 1], r = t[n * 2] - o, a = t[n * 2 + 1] - i, l = t[s * 2] - o, c = t[s * 2 + 1] - i, h = r * r + a * a, d = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - d * r, c - d * a);
}
function Au(t, e, n) {
  const s = n.shapeIndex;
  if (we && we.from === t && we.to === e && we.shapeIndex === s) return we.plan;
  const i = Bn.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (i)
    return we = { from: t, to: e, shapeIndex: s, plan: i }, i;
  const r = Mn(t).subpaths.filter((f) => f.length > 0).length === Mn(e).subpaths.filter((f) => f.length > 0).length, a = ka(t, !r), l = ka(e, !r), c = {
    pairs: a.map((f, g) => Tu(f, l[g], n))
  };
  Rs >= vu && (Bn.clear(), Rs = 0);
  const h = String(s ?? "auto"), d = Bn.get(h) ?? /* @__PURE__ */ new Map();
  Bn.set(h, d);
  const u = d.get(t) ?? /* @__PURE__ */ new Map();
  return d.set(t, u), u.set(e, c), Rs++, we = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function $u(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const o = Math.max(0, Math.min(1, n));
  if (o === 0) return t;
  if (o === 1) return e;
  const i = Au(t, e, s);
  if (i.pairs.length === 0) return o < 0.5 ? t : e;
  let r = "";
  for (const a of i.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = wa(a.from[l] + (a.to[l] - a.from[l]) * o), h = wa(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * o);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function tv() {
  Bn.clear(), Rs = 0, we = void 0;
}
function us(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const dn = Math.PI / 180, Pu = 0.9995;
function yr() {
  return [0, 0, 0, 1];
}
function Gt(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return yr();
  const s = e * dn / 2, o = Math.sin(s) / n;
  return [t[0] * o, t[1] * o, t[2] * o, Math.cos(s)];
}
function Iu(t, e, n) {
  return Ii(Ii(Gt([0, 1, 0], e), Gt([1, 0, 0], t)), Gt([0, 0, 1], n));
}
function Ou(t) {
  const [e, n, s, o] = Te(t), i = 2 * (e * s + n * o), r = 2 * (e * n + s * o), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * o), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * o), d = 1 - 2 * (e * e + n * n), u = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [u / dn, Math.atan2(i, d) / dn, Math.atan2(r, a) / dn] : [u / dn, Math.atan2(-h, c) / dn, 0];
}
function Ii(t, e) {
  const [n, s, o, i] = t, [r, a, l, c] = e;
  return [
    i * r + n * c + s * l - o * a,
    i * a - n * l + s * c + o * r,
    i * l + n * a - s * r + o * c,
    i * c - n * r - s * a - o * l
  ];
}
function rh(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function ah(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function Te(t) {
  const e = ah(t);
  return e === 0 ? yr() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function _u(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function lh(t, e, n) {
  const s = Te(t);
  let o = Te(e), i = rh(s, o);
  if (i < 0 && (o = [-o[0], -o[1], -o[2], -o[3]], i = -i), i > Pu)
    return Te([
      s[0] + (o[0] - s[0]) * n,
      s[1] + (o[1] - s[1]) * n,
      s[2] + (o[2] - s[2]) * n,
      s[3] + (o[3] - s[3]) * n
    ]);
  const r = Math.acos(i), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return Te([
    s[0] * l + o[0] * c,
    s[1] * l + o[1] * c,
    s[2] * l + o[2] * c,
    s[3] * l + o[3] * c
  ]);
}
function Hu(t, e) {
  const [n, s, o, i] = Te(t), r = 2 * (s * e[2] - o * e[1]), a = 2 * (o * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + i * r + (s * l - o * a), e[1] + i * a + (o * r - n * l), e[2] + i * l + (n * a - s * r)];
}
const ev = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: _u,
  dot: rh,
  fromAxisAngle: Gt,
  fromEuler: Iu,
  identity: yr,
  length: ah,
  multiply: Ii,
  normalize: Te,
  rotateVec3: Hu,
  slerp: lh,
  toEuler: Ou
}, Symbol.toStringTag, { value: "Module" })), pe = (t, e, n) => t + (e - t) * n, ch = 512, No = /* @__PURE__ */ new Map(), Do = /* @__PURE__ */ new Map();
function Ta(t) {
  const e = No.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return No.size < ch && No.set(t, s), s;
}
const Ea = (t) => t.charCodeAt(0) === 35, Aa = (t) => t.startsWith("rgb"), $a = (t) => t.startsWith("rgba"), Cu = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Bo = (t) => Math.round(t).toString(16).padStart(2, "0");
function Ru(t, e, n) {
  return `#${Bo(t)}${Bo(e)}${Bo(n)}`;
}
function Pa(t) {
  const e = Do.get(t);
  if (e) return e;
  const n = t.match(Cu);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), o = parseInt(n[2], 10), i = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, o, i, parseFloat(n[4])] : [s, o, i];
  return Do.size < ch && Do.set(t, r), r;
}
const Lu = (t, e, n) => {
  if (Ea(t) && Ea(e)) {
    const [s, o, i] = Ta(t), [r, a, l] = Ta(e), c = pe(s, r, n), h = pe(o, a, n), d = pe(i, l, n);
    return Ru(c, h, d);
  }
  if ((Aa(t) || $a(t)) && (Aa(e) || $a(e))) {
    const s = Pa(t), o = Pa(e), i = Math.round(pe(s[0], o[0], n)), r = Math.round(pe(s[1], o[1], n)), a = Math.round(pe(s[2], o[2], n));
    if (s.length === 4 || o.length === 4) {
      const l = s[3] ?? 1, c = o[3] ?? 1, h = pe(l, c, n);
      return `rgba(${i}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${i}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, Wu = (t, e, n) => {
  const s = Math.min(t.length, e.length), o = [];
  for (let i = 0; i < s; i++)
    o.push(pe(t[i], e[i], n));
  return o;
}, Fu = (t, e, n) => lh(t, e, n), Ia = (t, e, n) => n < 1 ? t : e, Nu = (t, e, n) => $u(t, e, n);
function Us(t, e) {
  return e === "slerp" ? Fu : typeof t == "number" ? pe : Array.isArray(t) ? Wu : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? Lu : us(t) ? Nu : Ia : Ia;
}
const hh = 1e3 / 60;
function dh(t, e = {}) {
  if (!Xe(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new bo(t.spring);
  return fh(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function uh(t, e = {}) {
  if (!je(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return fh(
    t,
    (s) => Ai(n, s),
    ds(n),
    n.from,
    hs(n),
    e
  );
}
function fh(t, e, n, s, o, i) {
  const r = i.intervalMs ?? hh, a = i.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let d = 0; d <= n; d += r)
    c.push({ time: d + l, value: e(d), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: o, easing: "linear" }) : h.value = o, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? Bu(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function ph(t, e, n, s = {}) {
  const o = s.intervalMs ?? hh, i = typeof n == "function" ? n : Rt(n), r = Us(t.value, s.interpolation), a = e.time - t.time;
  if (a <= 0) return [e];
  const l = [];
  for (let h = o; h < a; h += o) {
    const d = h / a;
    l.push({
      time: t.time + h,
      value: r(t.value, e.value, i(d)),
      easing: "linear"
    });
  }
  const c = i(1);
  return l.push({ ...e, ...c !== 1 && { value: r(t.value, e.value, c) }, easing: "linear" }), l;
}
function nv(t, e) {
  return Xe(t) ? dh(t, e) : je(t) ? uh(t, e) : t;
}
function Du(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((i) => js(i.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], o = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let i = 1; i < n.length; i++) {
    const r = n[i];
    js(r.easing) ? s.push(...ph(n[i - 1], r, r.easing, o)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function sv(t, e) {
  return t.filter(qd).map((n) => Du(n, e)).concat(
    t.filter(Xe).map((n) => dh(n, e)),
    t.filter(je).map((n) => uh(n, e))
  );
}
function Bu(t, e) {
  if (t.length <= 2) return t;
  const n = [t[0]];
  for (let s = 1; s < t.length - 1; s++) {
    const o = n[n.length - 1], i = t[s], r = t[s + 1], a = r.time - o.time;
    if (a <= 0) continue;
    const l = (i.time - o.time) / a, c = o.value + (r.value - o.value) * l;
    Math.abs(i.value - c) > e && n.push(i);
  }
  return n.push(t[t.length - 1]), n;
}
function Oi(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function Ce(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function xn(t, e, n, s) {
  const o = n ?? 0;
  return !s || e <= 1 ? o : o + mr(t, e, s);
}
class qo {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = Ce(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - xn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = xn(o, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - i);
      r !== void 0 && s.push({ target: this.targets[o], value: r, start: i + this.track.keyframes[0].time });
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
    const n = e[e.length - 1].time, s = this.track.stagger ? yo(this.targets.length, this.track.stagger) : 0;
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
    const { from: s, to: o } = this.findSurroundingKeyframes(e);
    if (!s || !o)
      return;
    if (s.time === e)
      return s.value;
    const i = o.time - s.time, r = (e - s.time) / i, l = Rt(o.easing)(r);
    return Us(s.value, this.track.interpolation)(s.value, o.value, l);
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
class qu {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = Ce(e), this.sampler = new bo(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - xn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = xn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: this.sampler.valueAt(e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? yo(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class zu {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = Ce(e), this.duration = ds(e.inertia);
  }
  getValueAtTime(e) {
    return Ai(this.track.inertia, e - xn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = xn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: Ai(this.track.inertia, e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? yo(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function gh(t, e) {
  const n = { ...mu(t.pathData, e) };
  if (t.matrix) {
    const [s, o, i, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + i * h + a, n.y = o * c + r * h + l;
    const d = n.angle * Math.PI / 180, u = Math.cos(d), f = Math.sin(d);
    n.angle = Math.atan2(o * u + r * f, s * u + i * f) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function ov(t, e, n, s) {
  const o = e + (n - e) * s;
  return gh(t, o);
}
const zo = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Yu = 20;
function Ku(t) {
  const e = zo[t ?? "upperCase"] ?? t ?? zo.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(zo.upperCase);
}
function ju(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Xu(t, e, n = 0) {
  const s = t.from ?? "", o = t.to, i = Math.max(0, Math.min(1, e));
  if (i <= 0) return s;
  if (i >= 1) return o;
  const r = Array.from(s), a = Array.from(o), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const M = Math.round(i * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - M)).join("") + a.slice(Math.max(0, a.length - M)).join("") : a.slice(0, M).join("") + r.slice(M).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (i - c) / (1 - c)), d = Math.floor(h * a.length), u = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * i), f = Ku(t.chars), g = t.refreshRate ?? Yu, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let b = "";
  for (let M = 0; M < u; M++) {
    const w = l ? M >= u - d : M < d, y = l ? a[a.length - (u - M)] : a[M];
    w && y !== void 0 || y === " " || y === `
` ? b += y : b += f[ju(m, M, p) % f.length];
  }
  return b;
}
class Ct {
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
    let o = e * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const a = Math.min(this._repeatDelayRemaining, o);
      if (this._repeatDelayRemaining -= a, o -= a, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const i = 1e3;
    for (let a = 0; a < i && o > 0 && this._playbackState === "playing"; a++)
      if (this._direction === "forward") {
        const l = n - this._currentTime;
        if (o >= l) {
          if (o -= l, this._currentTime = n, !this._handleEndReached())
            break;
        } else
          this._currentTime += o, o = 0;
      } else {
        const l = this._currentTime;
        if (o >= l) {
          if (o -= l, this._currentTime = 0, !this._handleStartReached())
            break;
        } else
          this._currentTime -= o, o = 0;
      }
    const r = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(r);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(e) {
    const n = /* @__PURE__ */ new Map();
    if (e = zd(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
      this._resolveShared(e, n);
    else
      for (const [s, o] of this._trackPlayers) {
        const i = o.getTrack().property;
        for (const { target: r, value: a, start: l } of o.getTargetValues(e))
          this._write(n, s, r, i, a, e - l);
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
    for (const [o, i] of this._trackPlayers) {
      const r = i.getTrack().property;
      for (const { target: a, value: l, start: c } of i.getTargetValues(e)) {
        const h = `${a}\0${r}`, d = c <= e, u = s.get(h);
        (!u || (d !== u.started ? d : d ? c >= u.start : c <= u.start)) && s.set(h, { trackId: o, target: a, property: r, value: l, start: c, started: d });
      }
    }
    for (const { trackId: o, target: i, property: r, value: a, start: l } of s.values())
      this._write(n, o, i, r, a, e - l);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(e, n, s, o, i, r) {
    if (i === void 0) return;
    let a = e.get(s);
    a || (a = /* @__PURE__ */ new Map(), e.set(s, a));
    const l = this._textTracks.get(n);
    if (l && typeof i == "number") {
      a.set("text", Xu(l.textConfig, i, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof i == "number") {
      const h = gh(c.motionPathConfig, i);
      a.set("motionPathX", h.x), a.set("motionPathY", h.y), c.motionPathConfig.autoRotate && a.set("motionPathRotate", h.angle);
    } else
      a.set(o, i);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const e = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const s of Ce(n)) {
          const o = `${s}\0${n.property}`;
          if (e.has(o)) {
            this._sharedWrites = !0;
            break t;
          }
          e.add(o);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(e) {
    if (this._tracks.push(e), this._sharedWrites = null, je(e)) {
      this._trackPlayers.set(e.id, new zu(e));
      return;
    }
    if (Xe(e)) {
      this._trackPlayers.set(e.id, new qu(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (gr(e))
      this._trackPlayers.set(e.id, new qo(e)), this._textTracks.set(e.id, e);
    else if (Qc(e)) {
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
      this._trackPlayers.set(e.id, new qo(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new qo(e));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(e, n) {
    const s = this._tracks.findIndex((i) => i.id === e);
    if (s < 0) return;
    const o = this._tracks.slice(s + 1);
    this.removeTrack(e);
    for (const i of o) this.removeTrack(i.id);
    this.addTrack(n);
    for (const i of o) this.addTrack(i);
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
    const s = n.getTrack(), o = s.delay ?? 0;
    if (Xe(s) || je(s))
      return { from: o, to: n.getDuration() };
    const i = s.keyframes;
    if (!(!i || i.length === 0))
      return { from: i[0].time + o, to: n.getDuration() };
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
      const s = this._tracks[n], o = this.getTrackSpan(s.id);
      if (o)
        for (let i = 0; i < n; i++) {
          const r = this._tracks[i];
          if (r.property !== s.property) continue;
          const a = Ce(r).filter((d) => Ce(s).includes(d));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(r.id);
          if (!l || !(l.from <= o.to && o.from <= l.to)) continue;
          const h = o.from >= l.from;
          for (const d of a)
            e.push({
              target: d,
              property: s.property,
              losingTrackId: h ? r.id : s.id,
              winningTrackId: h ? s.id : r.id
            });
        }
    }
    return e;
  }
  _matches(e, n) {
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !Ce(e).includes(n.target)) return !1;
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
      formatVersion: Zc(this._tracks),
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
    const n = e && e.length > 0 ? [...e].sort((o, i) => o.time - i.time).map((o) => ({ ...o })) : void 0, s = { ...this._config };
    n ? s.markers = n : delete s.markers, this._config = s;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(e) {
    const n = {};
    for (const [s, o] of Object.entries(e ?? {})) n[s] = { ...o };
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
const Uu = 100;
function mh(t, e, n, s) {
  const o = [], i = [], { duration: r, alternate: a } = s, l = (f, g, p, m) => {
    i.push([f, g]);
    const b = [];
    t.forEach((M, w) => {
      (p === "forward" ? (m ? M >= f : M > f) && M <= g : (m ? M <= f : M < f) && M >= g) && b.push(w);
    }), b.sort((M, w) => (p === "forward" ? t[M] - t[w] : t[w] - t[M]) || M - w);
    for (const M of b) o.push({ kind: "event", index: M, direction: p });
  };
  let c = e.time, h = e.direction, d = e.fresh === !0;
  const u = Math.min(Uu, Math.max(0, n.iteration - e.iteration));
  for (let f = 0; f < u; f++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, d), o.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, d = !1) : (c = h === "forward" ? 0 : r, d = !0);
  }
  return u > 0 && s.holding && !a ? { crossings: o, passes: i } : (l(c, n.time, h, d), { crossings: o, passes: i });
}
function Gu(t) {
  return je(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: yh(t.inertia),
    ...le(t)
  } : Xe(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...le(t)
  } : gr(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(Yo),
    ...le(t)
  } : Qc(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(Yo),
    ...le(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(Yo),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...le(t)
  };
}
function yh(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function Yo(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function le(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function Vu(t) {
  if (je(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: yh(e.inertia),
      ...le(e)
    };
  }
  if (Xe(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...le(e)
    };
  }
  if (gr(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...le(e)
    };
  }
  if (t.property === "motionPath" && "motionPathConfig" in t) {
    const e = t, n = [...e.keyframes].sort((s, o) => s.time - o.time);
    return {
      id: e.id,
      target: e.target,
      property: "motionPath",
      motionPathConfig: { ...e.motionPathConfig },
      keyframes: n,
      ...le(e)
    };
  }
  return Oi({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...le(t)
  });
}
function Ju(t) {
  const e = t._config.markers;
  return {
    formatVersion: Zc(t.tracks),
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
    tracks: t.tracks.map(Gu),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function Qn(t) {
  const e = t.formatVersion ?? 1;
  if (e > ga)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${ga}. Update tinyfly to play it.`
    );
  return new Ct({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(Vu),
    captions: t.captions
  });
}
function iv(t) {
  return JSON.stringify(Ju(t));
}
function rv(t) {
  const e = JSON.parse(t);
  return Qn(e);
}
function oe(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function Ve(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function bh(t, e, n) {
  return e + t.next() * (n - e);
}
function Zu(t, e, n, s) {
  if (s <= 0) return bh(t, e, n);
  const o = Math.floor((n - e) / s), i = Math.round(t.next() * o);
  return e + i * s;
}
function av(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const wh = /^([+\-*/])=\s*(-?[\d.]+)$/, kh = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function lv(t) {
  return typeof t != "string" ? !1 : wh.test(t.trim()) || kh.test(t.trim());
}
function vh(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = wh.exec(n);
  if (s) {
    const [, i, r] = s, a = e.base ?? 0, l = Number.parseFloat(r);
    switch (i) {
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
  const o = kh.exec(n);
  if (o) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const i = Number.parseFloat(o[1]), r = Number.parseFloat(o[2]), a = o[3] !== void 0 ? Number.parseFloat(o[3]) : void 0;
    return a !== void 0 ? Zu(e.random, i, r, a) : bh(e.random, i, r);
  }
  return t;
}
function Qu(t, e = 0, n) {
  const s = [];
  let o = e;
  for (const i of t) {
    const r = vh(i, { base: o, random: n });
    s.push(r), typeof r == "number" && (o = r);
  }
  return s;
}
class cv {
  random;
  constructor(e) {
    this.random = Ve(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return vh(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return Qu(e, n, this.random);
  }
}
const tf = 600;
function ef(t) {
  if (Array.isArray(t)) {
    const [u, f, g, p] = t;
    return { fn: Oa(u, f, g, p), bezier: [u, f, g, p] };
  }
  const { segments: e } = Mn(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, o = e[e.length - 1], i = o.endX - n, r = o.endY - s;
  if (i === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (u) => (u - n) / i, l = (u) => (u - s) / r;
  if (e.length === 1 && o.type === "C") {
    const [u, f, g, p] = o.points, m = [a(u), l(f), a(g), l(p)];
    return { fn: Oa(...m), bezier: m };
  }
  const c = [], h = [], d = Math.max(8, Math.ceil(tf / e.length));
  for (const u of e)
    for (let f = c.length === 0 ? 0 : 1; f <= d; f++) {
      const [g, p] = of(u, f / d);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: rf(c, h) };
}
function nf(t = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, t.strength ?? 0.7)) * 0.7, s = [1];
  for (let i = n; i > 2e-3; i *= n) s.push(2 * Math.sqrt(i));
  const o = s.reduce((i, r) => i + r, 0);
  return (i) => {
    if (i <= 0) return 0;
    if (i >= 1) return 1;
    let r = i * o;
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
function sf(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (o) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * o) : (1 - o) ** 2;
  return (o) => o <= 0 || o >= 1 ? 0 : Math.sin(o * e * Math.PI * 2) * s(o);
}
function of(t, e) {
  if (t.type === "L") {
    const [c, h] = t.points;
    return [t.startX + (c - t.startX) * e, t.startY + (h - t.startY) * e];
  }
  const [n, s, o, i, r, a] = t.points, l = 1 - e;
  return [
    l * l * l * t.startX + 3 * l * l * e * n + 3 * l * e * e * o + e * e * e * r,
    l * l * l * t.startY + 3 * l * l * e * s + 3 * l * e * e * i + e * e * e * a
  ];
}
function rf(t, e) {
  return (n) => {
    if (n <= t[0]) return e[0];
    if (n >= t[t.length - 1]) return e[e.length - 1];
    let s = 0, o = t.length - 1;
    for (; o - s > 1; ) {
      const r = s + o >> 1;
      t[r] <= n ? s = r : o = r;
    }
    const i = t[o] - t[s];
    return i === 0 ? e[o] : e[s] + (n - t[s]) / i * (e[o] - e[s]);
  };
}
function Oa(t, e, n, s) {
  const o = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, i = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const d = o(a, t, n) - r, u = i(a, t, n);
      if (Math.abs(d) < 1e-6) return o(a, e, s);
      if (Math.abs(u) < 1e-6) break;
      a -= d / u;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      o(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return o(a, e, s);
  };
}
const af = 350, lf = 300, cf = 550;
function hv(t, e = {}) {
  const n = e.lead ?? af, s = e.gap ?? lf, o = e.tail ?? cf, i = [];
  let r = 0;
  return t.forEach((a, l) => {
    const c = [];
    let h = r + n;
    a.lines.forEach((u, f) => {
      if (!(u.duration >= 0))
        throw new Error(`narration: scene ${l} line ${f} has an invalid duration (${u.duration})`);
      f > 0 && (h += s), c.push({
        id: u.id ?? `s${l}-l${f}`,
        scene: l,
        line: f,
        start: h,
        end: h + u.duration,
        text: u.text
      }), h += u.duration;
    });
    const d = h + o + (a.tail ?? 0);
    i.push({ id: a.id ?? `s${l}`, start: r, duration: d - r, cues: c }), r = d;
  }), { duration: r, scenes: i, cues: i.flatMap((a) => a.cues) };
}
function dv(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function uv(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const Mh = (t) => 6e4 / t.bpm;
function br(t, e) {
  return t.offset + e * Mh(t);
}
function wr(t, e) {
  return (e - t.offset) / Mh(t);
}
function fv(t, e) {
  return br(t, Math.round(wr(t, e)));
}
function pv(t, e) {
  return br(t, Math.ceil(wr(t, e) - 1e-9));
}
function gv(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), o = [];
  if (!(t.bpm > 0) || n < e) return o;
  for (let i = Math.ceil(wr(t, e) - 1e-9); ; i++) {
    const r = br(t, i);
    if (r > n + 1e-9) break;
    o.push({ time: r, bar: (i % s + s) % s === 0, n: i });
  }
  return o;
}
const tn = 100;
function mv(t, e, n = {}) {
  const s = n.minBpm ?? 70, o = n.maxBpm ?? 180, i = Math.max(1, Math.round(e / tn)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / i);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let k = 0; k < a; k++) {
    let x = 0;
    for (let P = k * i; P < (k + 1) * i; P++) x += t[P] * t[P];
    l[k] = Math.log(1e-6 + x / i);
  }
  const c = new Float64Array(a);
  for (let k = 1; k < a; k++) c[k] = Math.max(0, l[k] - l[k - 1]);
  const h = c.reduce((k, x) => k + x, 0) / a;
  for (let k = 0; k < a; k++) c[k] = Math.max(0, c[k] - h);
  const d = Math.max(1, Math.floor(60 * tn / o)), u = Math.min(a - 1, Math.ceil(60 * tn / s)), f = (k) => {
    let x = 0;
    for (let P = k; P < a; P++) x += c[P] * c[P - k];
    return x / (a - k);
  };
  let g = 0;
  for (let k = 0; k < a; k++) g += c[k] * c[k];
  g /= a;
  let p = d, m = -1 / 0;
  for (let k = d; k <= u; k++) {
    const x = 60 * tn / k, P = Math.exp(-0.5 * (Math.log2(x / 120) / 0.9) ** 2), I = f(k) * P;
    I > m && (m = I, p = k);
  }
  const b = (k) => {
    const x = Math.floor(k);
    return x < 0 || x + 1 >= a ? 0 : c[x] + (c[x + 1] - c[x]) * (k - x);
  }, M = (k, x) => {
    let P = 0;
    for (let I = x; I < a; I += k) P += b(I);
    return P;
  };
  let w = p, y = 0, S = -1 / 0;
  for (let k = p - 0.6; k <= p + 0.6 + 1e-9; k += 0.02) {
    if (k < 1) continue;
    const x = Math.max(1, Math.round(k * 4));
    for (let P = 0; P < x; P++) {
      const I = P / x * k, O = M(k, I);
      O > S && (S = O, y = I, w = k);
    }
  }
  const E = 60 * tn / w, A = g > 0 ? Math.max(0, Math.min(1, f(p) / g)) : 0, v = (y + 0.5) * 1e3 / tn;
  return { bpm: Math.round(E * 100) / 100, offset: Math.round(v % (6e4 / E)), confidence: A };
}
const hf = 600, df = 250, _a = 1;
function yv(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, o = {}, i = (d, u, f, g) => {
    const p = o[d] ??= [];
    for (; p.length > 0 && p[p.length - 1].time >= u; ) p.pop();
    p.push({ time: u, value: f, ...g ? { easing: g } : {} });
  }, r = (d) => {
    const u = d.rotate * Math.PI / 180, f = (d.focusX - s.x) * d.scale, g = (d.focusY - s.y) * d.scale;
    return {
      x: -(f * Math.cos(u) - g * Math.sin(u)),
      y: -(f * Math.sin(u) + g * Math.cos(u)),
      scale: d.scale,
      rotate: d.rotate
    };
  }, a = (d, u, f) => {
    const g = r(u);
    for (const p of ["x", "y", "scale", "rotate"]) i(p, d, g[p], f);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((d, u) => d.at - u.at), h = c.filter((d) => !("shake" in d));
  h.length > 0 && a(0, l);
  for (const d of h)
    if ("frame" in d) {
      const u = Math.max(_a, d.duration ?? hf);
      a(d.at, l), l = {
        focusX: d.frame.focus?.x ?? s.x,
        focusY: d.frame.focus?.y ?? s.y,
        scale: d.frame.scale ?? 1,
        rotate: d.frame.rotate ?? 0
      }, a(d.at + u, l, d.easing ?? (u > _a ? "ease-in-out" : void 0));
    } else {
      const { follow: u } = d, f = u.lag ?? df, g = new Ct({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: u.x }] }), p = (M) => g.getStateAtTime(M).values.get("s")?.get("x") ?? l.focusX, m = [d.at, ...u.x.map((M) => M.time).filter((M) => M > d.at && M < d.until), d.until];
      a(d.at, l);
      const b = (M) => ({
        focusX: p(M) + (u.lead ?? 0),
        focusY: u.y ?? l.focusY,
        scale: u.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const M of m) {
        const w = u.x.find((y) => y.time === M)?.easing;
        a(M + f, b(M), M === d.at ? "ease-in-out" : w);
      }
      l = b(d.until);
    }
  for (const d of c.filter((u) => "shake" in u)) {
    const u = d.shake.strength ?? 12, f = d.shake.roll ?? 1.5, g = 1e3 / (d.shake.frequency ?? 24), p = Ve(d.shake.seed ?? Math.round(d.at) + 1), m = () => p.next() * 2 - 1;
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, d.at, 0);
    for (let b = d.at + g; b < d.at + d.duration; b += g) {
      const M = 1 - (b - d.at) / d.duration;
      i("shakeX", b, m() * u * M), i("shakeY", b, m() * u * M), i("shakeRotate", b, m() * f * M);
    }
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, d.at + d.duration, 0, "ease-out");
  }
  return Object.entries(o).map(([d, u]) => ({ id: `${n}-${d}`, target: n, property: d, keyframes: u }));
}
function uf(t, e) {
  const n = t.toLowerCase(), s = e.toLowerCase();
  let o = Array.from({ length: s.length + 1 }, (i, r) => r);
  for (let i = 1; i <= n.length; i++) {
    const r = [i];
    for (let a = 1; a <= s.length; a++)
      r[a] = Math.min(o[a] + 1, r[a - 1] + 1, o[a - 1] + (n[i - 1] === s[a - 1] ? 0 : 1));
    o = r;
  }
  return o[s.length];
}
function Gs(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let o, i = 1 / 0;
  for (const r of e) {
    const a = uf(t, r);
    a < i && (i = a, o = r);
  }
  return o !== void 0 && i <= Math.max(2, Math.floor(t.length / 3)) ? o : void 0;
}
function ut(t, e, n, s) {
  const o = typeof e == "string" ? s ?? Gs(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${o ? `: did you mean "${o}"?` : "."} Known: ${n.join(", ")}`;
}
function Ls(t, e) {
  const n = e.step ?? 33, s = e.stiffness ?? 120, o = e.damping ?? 9, i = e.mass ?? 1;
  let r = t(e.start), a = 0;
  const l = [{ time: e.start, value: r }];
  let c = e.start + n;
  for (let h = e.start + 1; h <= e.end; h++) {
    const u = s * (t(h) - r) - o * a;
    a += u / i * 1e-3, r += a * 1e-3, (h >= c || h === e.end) && (l.push({ time: h, value: r }), c += n);
  }
  return l;
}
const ie = (t) => Math.round(t * 1e3) / 1e3;
function ff(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, o = t.length;
  let i = `M${ie(t[0].x)} ${ie(t[0].y)}`;
  if (o === 1) return i;
  const r = (l) => s ? t[(l % o + o) % o] : t[Math.max(0, Math.min(o - 1, l))], a = s ? o : o - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), d = r(l + 1), u = r(l + 2);
    if (n === 0) {
      i += ` L${ie(d.x)} ${ie(d.y)}`;
      continue;
    }
    const f = n / 6, g = h.x + (d.x - c.x) * f, p = h.y + (d.y - c.y) * f, m = d.x - (u.x - h.x) * f, b = d.y - (u.y - h.y) * f;
    i += ` C${ie(g)} ${ie(p)} ${ie(m)} ${ie(b)} ${ie(d.x)} ${ie(d.y)}`;
  }
  return s ? `${i} Z` : i;
}
const It = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function pf(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function kr(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = It(e.cx), s = It(e.cy), o = t.tag.toLowerCase() === "circle" ? It(e.r) : It(e.rx), i = t.tag.toLowerCase() === "circle" ? It(e.r) : It(e.ry);
      return `M${n + o} ${s} A${o} ${i} 0 1 1 ${n - o} ${s} A${o} ${i} 0 1 1 ${n + o} ${s} Z`;
    }
    case "rect": {
      const n = It(e.x), s = It(e.y), o = It(e.width), i = It(e.height);
      let r = e.rx != null ? It(e.rx) : e.ry != null ? It(e.ry) : 0, a = e.ry != null ? It(e.ry) : r;
      return r = Math.min(r, o / 2), a = Math.min(a, i / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + o} V${s + i} H${n} Z` : `M${n + r} ${s} H${n + o - r} A${r} ${a} 0 0 1 ${n + o} ${s + a} V${s + i - a} A${r} ${a} 0 0 1 ${n + o - r} ${s + i} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + i - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${It(e.x1)} ${It(e.y1)} L${It(e.x2)} ${It(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = pf(e.points);
      if (n.length === 0) return null;
      const s = n.map((o, i) => `${i === 0 ? "M" : "L"}${o.x} ${o.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function bv(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), o = Math.max(0, n.length), i = n.since !== void 0 ? Math.max(e - o, n.since) : e - o;
  if (i >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = i + (e - i) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: o > 0 ? (e - c) / o : 0 });
  }
  return a;
}
const gf = 2.5;
function mf(t) {
  const e = [], n = [], s = t.length, o = (i, r) => {
    for (let a = i + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[i].x) * r, c = (t[a].y - t[i].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let i = 0; i < s; i++) {
    const r = t[i], a = o(i, -1), l = o(i, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let d = c[0] + h[0], u = c[1] + h[1];
    const f = Math.hypot(d, u);
    f < 1e-9 ? (d = c[0], u = c[1]) : (d /= f, u /= f);
    const g = d * c[0] + u * c[1], p = Math.min(gf, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - u * m, y: r.y + d * m }), n.push({ x: r.x + u * m, y: r.y - d * m });
  }
  return { left: e, right: n };
}
function yf(t) {
  const e = t.length;
  if (e < 2) return null;
  const n = t[e - 1];
  for (let s = e - 2; s >= 0; s--) {
    const o = n.x - t[s].x, i = n.y - t[s].y, r = Math.hypot(o, i);
    if (r > 1e-9)
      return { x: n.x, y: n.y, radius: n.width / 2, start: Math.atan2(o / r, -i / r) };
  }
  return null;
}
function Ws(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function $n(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function yn(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function Ae(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Vs(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function vo(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function vr(t, e) {
  return vo($n(t, e));
}
function Ue(t) {
  const e = vo(t);
  return e === 0 ? [0, 0, 0] : yn(t, 1 / e);
}
function xh(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const wv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ws,
  cross: Vs,
  distance: vr,
  dot: Ae,
  length: vo,
  lerp: xh,
  normalize: Ue,
  scale: yn,
  subtract: $n
}, Symbol.toStringTag, { value: "Module" })), bf = Math.PI / 180;
function Mo() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function At(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let o = 0; o < 4; o++) {
      let i = 0;
      for (let r = 0; r < 4; r++) i += t[r * 4 + o] * e[s * 4 + r];
      n[s * 4 + o] = i;
    }
  return n;
}
function Re(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function qe(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function ne(t) {
  const [e, n, s, o] = t;
  return [
    1 - 2 * (n * n + s * s),
    2 * (e * n + s * o),
    2 * (e * s - n * o),
    0,
    2 * (e * n - s * o),
    1 - 2 * (e * e + s * s),
    2 * (n * s + e * o),
    0,
    2 * (e * s + n * o),
    2 * (n * s - e * o),
    1 - 2 * (e * e + n * n),
    0,
    0,
    0,
    0,
    1
  ];
}
function Mr(t, e, n) {
  const s = ne(e);
  for (let o = 0; o < 3; o++)
    s[o] *= n[0], s[4 + o] *= n[1], s[8 + o] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function wf(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function xr(t) {
  const [e, n, s, o, i, r, a, l, c, h, d, u, f, g, p, m] = t, b = e * r - n * i, M = e * a - s * i, w = e * l - o * i, y = n * a - s * r, S = n * l - o * r, E = s * l - o * a, A = c * g - h * f, v = c * p - d * f, k = c * m - u * f, x = h * p - d * g, P = h * m - u * g, I = d * m - u * p, O = b * I - M * P + w * x + y * k - S * v + E * A;
  if (Math.abs(O) < 1e-12) return null;
  const _ = 1 / O;
  return [
    (r * I - a * P + l * x) * _,
    (s * P - n * I - o * x) * _,
    (g * E - p * S + m * y) * _,
    (d * S - h * E - u * y) * _,
    (a * k - i * I - l * v) * _,
    (e * I - s * k + o * v) * _,
    (p * w - f * E - m * M) * _,
    (c * E - d * w + u * M) * _,
    (i * P - r * k + l * A) * _,
    (n * k - e * P - o * A) * _,
    (f * S - g * w + m * b) * _,
    (h * w - c * S - u * b) * _,
    (r * v - i * x - a * A) * _,
    (e * x - n * v + s * A) * _,
    (g * M - f * y - p * b) * _,
    (c * y - h * M + d * b) * _
  ];
}
function kf(t, e, n, s) {
  const o = 1 / Math.tan(t * bf / 2), i = 1 / (n - s);
  return [o / e, 0, 0, 0, 0, o, 0, 0, 0, 0, (s + n) * i, -1, 0, 0, 2 * s * n * i, 0];
}
function vf(t, e, n, s, o, i) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (i - o);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(i + o) * l, 1];
}
function Mf(t, e, n = [0, 1, 0]) {
  const s = Ue($n(t, e)), o = Ue(Vs(n, s)), i = Vs(s, o);
  return [
    o[0],
    i[0],
    s[0],
    0,
    o[1],
    i[1],
    s[1],
    0,
    o[2],
    i[2],
    s[2],
    0,
    -Ae(o, t),
    -Ae(i, t),
    -Ae(s, t),
    1
  ];
}
function qt(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], o = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], i = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return i === 1 || i === 0 ? [n, s, o] : [n / i, s / i, o / i];
}
const kv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: Mr,
  fromQuat: ne,
  identity: Mo,
  invert: xr,
  lookAt: Mf,
  multiply: At,
  orthographic: vf,
  perspective: kf,
  scaling: qe,
  transformPoint: qt,
  translation: Re,
  transpose: wf
}, Symbol.toStringTag, { value: "Module" })), ks = {
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
}, Ha = {
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
function xf(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Rt({ type: "bounce", mode: "in" });
Rt({ type: "bounce", mode: "in-out" });
function Js(t) {
  const e = Sh.get(t.trim().toLowerCase());
  if (e) return e;
  const n = xf(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Rt(r) };
  }
  const o = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (o) {
    const [, i, r, a] = o, l = (a ?? "").split(",").map((d) => Number.parseFloat(d)).filter((d) => Number.isFinite(d)), c = r === "inout" ? "in-out" : r;
    if (i === "back" && l.length === 0 && n in ks)
      return { easing: { type: "cubic-bezier", points: ks[n] } };
    const h = i === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : i === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Rt(h) };
  }
  return n in Ha ? { easing: Ha[n] } : n in ks ? { easing: { type: "cubic-bezier", points: ks[n] } } : { easing: "ease-out" };
}
const Sh = /* @__PURE__ */ new Map();
function Sr(t, e) {
  return Sh.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function _i(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const Th = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Eh(t) {
  return typeof t == "string" && Th.test(t);
}
function Sf(t = 1) {
  let e = _i(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (d) => c(...h, d)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), o = (l, c, h, d, u) => c === l ? h : h + (u - l) / (c - l) * (d - h), i = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return Ca(l, c, 1 / 0);
    if ("values" in l) return Ca(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, r = (l, c, h) => {
    const d = l + e() * (c - l);
    return h ? Math.round(d / h) * h : d;
  };
  return {
    clamp: n(3, s),
    mapRange: n(5, o),
    normalize: n(3, (l, c, h) => o(l, c, 0, 1, h)),
    interpolate: n(3, (l, c, h) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const d = {};
        for (const u of Object.keys(l))
          d[u] = Us(l[u])(l[u], c[u], h);
        return d;
      }
      return Us(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, m = (b) => p[(Math.round(b) % p.length + p.length) % p.length];
        return c === void 0 ? m : m(c);
      }
      const d = l, f = c - d, g = (p) => f === 0 ? d : ((p - d) % f + f) % f + d;
      return h === void 0 ? g : g(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const d = c - l;
      if (d === 0) return l;
      const u = ((h - l) % (d * 2) + d * 2) % (d * 2);
      return l + (u > d ? d * 2 - u : u);
    }),
    snap: n(2, i),
    random: ((l, c, h, d) => {
      if (Array.isArray(l)) {
        const f = () => l[Math.floor(e() * l.length)];
        return c === !0 ? f : f();
      }
      const u = () => r(l, c, h);
      return d ? u : u();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(e() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: d = "start", ease: u }) => (f, g, p) => {
      const m = p.length, M = mr(f, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: d }), w = c !== void 0 ? c : (h ?? 1) * eh(m, d), y = u && w > 0 ? u(M / w) * w : M;
      return l + y;
    },
    pipe: (...l) => (c) => l.reduce((h, d) => d(h), c),
    splitColor: (l) => Tf(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = _i(l);
    },
    resolveRandomString: (l) => {
      const c = Th.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, d, u] = c.split(",").map((f) => Number.parseFloat(f));
      return r(h, d, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Ca(t, e, n) {
  let s = e, o = 1 / 0;
  for (const i of t) {
    const r = Math.abs(i - e);
    r < o && (o = r, s = i);
  }
  return o <= n ? s : e;
}
function Tf(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const i = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return i.length >= 4 ? [i[0], i[1], i[2], Math.round(i[3] / 255 * 1e3) / 1e3] : [i[0], i[1], i[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((o) => Number.parseFloat(o));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const Ef = /^([+-])=\s*(-?[\d.]+)$/, Af = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function _n(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const o = t.trim();
  if (o === "") return e.cursor;
  const i = Ef.exec(o);
  if (i) {
    const c = s(i[2]);
    return e.cursor + (i[1] === "-" ? -c : c);
  }
  const r = Af.exec(o);
  if (r) {
    const c = r[1] === "<" ? e.previousStart : e.previousEnd;
    if (r[3] === void 0) return c;
    const h = s(r[3]);
    return c + (r[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(o);
  if (a) {
    const c = e.labels.get(a[1].trim());
    if (c !== void 0) {
      const h = s(a[3]);
      return c + (a[2] === "-" ? -h : h);
    }
  }
  const l = e.labels.get(o);
  return l !== void 0 ? l : /^-?[\d.]+$/.test(o) ? s(o) : e.cursor;
}
function $f(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function Pf(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, o = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), i = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (o - 1) } : typeof r == "number" ? i(Math.max(0, Math.min(t - 1, r))) : r === "end" ? i(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (o - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = i(g), b = Math.abs(p - a.x), M = Math.abs(m - a.y);
    return e.axis === "x" ? b : e.axis === "y" ? M : Math.hypot(b, M);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const d = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, u = e.ease ? Js(e.ease) : void 0, f = u ? u.fn ?? Rt(u.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (f ? f(p) : p) * d;
  });
}
const Tr = /* @__PURE__ */ new Set([
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
]), If = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Fs(t) {
  const e = {}, n = {};
  for (const [s, o] of Object.entries(t))
    Tr.has(s) ? e[s] = o : n[If[s] ?? s] = o;
  return { config: e, properties: n };
}
function Zs(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function Hi(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : $f(t) ? { offsets: Pf(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const Of = {
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
function Ah(t) {
  return Of[t];
}
function _f(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = ff(e.path, { curviness: e.curviness });
  else if (us(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function Hf(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function $h(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function Cf(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = $h(e);
  if (typeof s != "string" || !us(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Rf(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, Ra(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return Ra(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const o = s(n[0]), i = s(n[1]);
  return o <= i ? [o, i] : [i, o];
}
function Lf(t, e) {
  const [n, s] = Rf(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function Wf(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...Lf(n, e) };
}
function Ff(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function Ra(t, e) {
  return Math.max(0, Math.min(e, t));
}
function Nf(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function Df(t, e, n) {
  if (t.scrambleText !== void 0) {
    const s = t.scrambleText, o = typeof s == "string" ? { text: s } : s;
    if (typeof o?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const i = o.revealDelay && n > 0 ? o.revealDelay * 1e3 / n : void 0;
    return {
      to: o.text,
      mode: "scramble",
      ...o.chars !== void 0 && { chars: o.chars },
      ...o.speed !== void 0 && { refreshRate: 20 * o.speed },
      ...i !== void 0 && { revealDelay: Math.min(i, 0.999) },
      ...o.tweenLength !== void 0 && { tweenLength: o.tweenLength },
      ...o.rightToLeft !== void 0 && { rightToLeft: o.rightToLeft },
      seed: o.seed ?? Nf(`${e}|${o.text}`)
    };
  }
  if (t.text !== void 0) {
    const s = t.text, o = typeof s == "string" ? { value: s } : s;
    if (typeof o?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: o.value,
      mode: "type",
      ...o.rightToLeft !== void 0 && { rightToLeft: o.rightToLeft }
    };
  }
}
function Er(t) {
  return Math.max(0.1, t / 25);
}
function Bf(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? Er(n.resistance) : void 0), o = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? o.end = [n.end(Xs(o))] : n.end !== void 0 && (o.end = Array.isArray(n.end) ? [...n.end] : n.end), o;
}
function qf(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in Wo))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(Wo).join(", ")}`
    );
  return {
    ...e.preset ? Wo[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function zf(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class mn {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = _i(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new Ct({
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
    return this.build(e, void 0, Hn(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: o, properties: i } = Fs(Hn(n)), { motionPath: r, text: a, scrambleText: l, ...c } = i, h = this.targetsOf(e)[0], d = { ...o };
    for (const g of Object.keys(c))
      d[g] = this.resolveStart(h, g);
    r !== void 0 && (d.motionPath = Hf(r));
    const u = {}, f = String(this.resolveStart(h, "text"));
    return a !== void 0 && (u.text = Ko(a), d.text = typeof a == "object" ? { ...a, value: f } : f), l !== void 0 && (u.text = Ko(l), d.scrambleText = typeof l == "object" ? { ...l, text: f } : f), this.build(e, { ...c, ...u }, d, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, o) {
    const { properties: i } = Fs(Hn(n));
    return this.build(e, i, Hn(s), o);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Hn(n), duration: 0 }, s);
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
    const n = Math.max(0, _n(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return _n(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, _n(n, this.context())), this;
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
    const s = _n(n, this.context());
    for (const i of e.timeline.tracks) {
      if (!("keyframes" in i)) continue;
      const r = Oi({
        ...i,
        id: this.nextTrackId(`nested-${i.id}`),
        keyframes: i.keyframes.map((a) => ({ ...a, time: a.time + s }))
      });
      this.timeline.addTrack(r);
    }
    const o = s + e.timeline.duration;
    return this.previousStart = s, this.previousEnd = o, this.cursor = Math.max(this.cursor, o), this;
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
  build(e, n, s, o) {
    const { config: i, properties: r } = Fs(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...d } = r, u = this.targetsOf(e), f = _n(o, this.context()), g = Zs(i.delay, 0), p = Zs(i.duration, 500), m = Hi(i.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), b = this.easingFor(i.ease), M = [], w = i.spring;
    let y = 0, S = !1;
    for (const [P, I] of Object.entries(d)) {
      const O = I;
      let _ = n?.[P] !== void 0 ? n[P] : this.resolveStart(u[0], P);
      if (typeof _ != typeof O && (this.warn(
        `no usable start value for "${P}" on "${u[0]}" — it will snap to ${String(O)}. Use fromTo() to animate it.`
      ), _ = O), w !== void 0 && (typeof _ != "number" || typeof O != "number") && this.warn(`spring works on numbers, so "${P}" on "${u[0]}" eases instead`), w !== void 0 && typeof _ == "number" && typeof O == "number") {
        const j = {
          ...qf(w),
          from: _,
          to: O,
          velocity: zf(w, P) ?? this.options.startVelocity?.(u[0], P) ?? 0
        }, V = this.nextTrackId(`${u[0]}-${P}-spring`), K = {
          id: V,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...m && u.length > 1 && { stagger: m },
          property: P,
          kind: "spring",
          spring: j,
          delay: f + g
        };
        this.timeline.addTrack(K), M.push(V), y = Math.max(y, Yd(j));
        for (const T of u) this.lastValues.set(`${T}|${P}`, O);
        continue;
      }
      S = !0;
      const W = this.keyframesFor(_, O, p, b, i.ease), B = this.nextTrackId(`${u[0]}-${P}`);
      this.timeline.addTrack(
        Oi({
          id: B,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...m && u.length > 1 && { stagger: m },
          property: P,
          delay: f + g,
          keyframes: W,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...P === "quaternion" && { interpolation: "slerp" }
        })
      ), M.push(B);
      for (const j of u) this.lastValues.set(`${j}|${P}`, O);
    }
    const E = Df({ text: l, scrambleText: c }, u[0], p);
    if (E) {
      const P = n?.text ?? n?.scrambleText, I = P !== void 0 ? Ko(P) : this.resolveStart(u[0], "text"), O = this.nextTrackId(`${u[0]}-text`), _ = {
        id: O,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...m && u.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof I == "string" ? I : String(I ?? ""), ...E },
        delay: f + g,
        keyframes: this.keyframesFor(0, 1, p, b, i.ease)
      };
      this.timeline.addTrack(_), M.push(O);
      for (const W of u) this.lastValues.set(`${W}|text`, E.to);
    }
    if (a !== void 0) {
      const { config: P, start: I, end: O } = _f(a), _ = this.nextTrackId(`${u[0]}-motionPath`), W = {
        id: _,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...m && u.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: P,
        delay: f + g,
        keyframes: this.keyframesFor(I, O, p, b, i.ease)
      };
      this.timeline.addTrack(W), M.push(_);
    }
    if (h !== void 0)
      for (const [P, I] of Object.entries(h)) {
        const O = this.resolveStart(u[0], P);
        if (typeof O != "number") {
          this.warn(`inertia on "${P}" needs a numeric start value; skipped`);
          continue;
        }
        const _ = Bf(O, I), W = this.nextTrackId(`${u[0]}-${P}-inertia`), B = {
          id: W,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...m && u.length > 1 && { stagger: m },
          property: P,
          kind: "inertia",
          inertia: _,
          delay: f + g
        };
        this.timeline.addTrack(B), M.push(W), y = Math.max(y, ds(_));
        for (const j of u) this.lastValues.set(`${j}|${P}`, hs(_));
      }
    const k = ((h !== void 0 || w !== void 0) && !S && !E && a === void 0 ? y : Math.max(p, y)) + (m && u.length > 1 ? yo(u.length, m) : 0), x = f + g + k;
    return this.previousStart = f + g, this.previousEnd = x, this.cursor = Math.max(this.cursor, x), {
      trackIds: M,
      start: f + g,
      end: x,
      kill: () => {
        for (const P of M) this.timeline.removeTrack(P);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(e, n, s, o, i) {
    const r = { time: 0, value: e };
    if (s <= 0)
      return [{ time: 0, value: n }];
    const a = typeof i == "string" ? Js(i) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && js(o)) {
      const c = a?.fn ?? Rt(o);
      return [r, ...ph(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [r, { time: s, value: n, ...o && { easing: o } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(e, n) {
    const s = this.lastValues.get(`${e}|${n}`);
    if (s !== void 0) return s;
    const o = this.options.startValue?.(e, n);
    if (o !== void 0) return o;
    const i = this.options.defaults?.[n];
    if (i !== void 0) return i;
    if (n === "text") return "";
    if (n === "quaternion") return [0, 0, 0, 1];
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${e}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const r = Ah(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return Js(e).easing;
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
function Ko(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function Yf(t) {
  return new mn(t);
}
function Hn(t) {
  return Ff(Cf(t));
}
function Kf(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${ne(Te(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const jf = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Xf = "#ffffff", Uf = "rgba(0, 0, 0, 0.5)";
function Gf(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Xf})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, o = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${o}px ${t.shadowColor ?? Uf})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function Vf(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Jf(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const La = /* @__PURE__ */ new Set([
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
]), Zf = /* @__PURE__ */ new Set([
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
]), Qf = [
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
], tp = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), ep = /* @__PURE__ */ new Set(["originX", "originY"]), np = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), sp = /* @__PURE__ */ new Set(["drawOn"]), op = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Wa = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, ip = "http://www.w3.org/2000/svg";
class ze {
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
      const o = this.targets.get(n);
      o && this.applyProperties(o, s);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(e, n) {
    let s = null, o = null, i = null, r = null, a = null;
    const l = n.has("motionPathX"), c = n.has("motionPathY"), h = n.has("motionPathRotate");
    for (const [g, p] of n)
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !sp.has(g)) {
        if (Zf.has(g))
          (s ??= {})[g] = p;
        else if (tp.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (ep.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (np.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (jf.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            Vf(e, p);
          else if (g === "d" && typeof p == "string") {
            const m = e;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(e, g, p);
        }
      }
    const d = n.get("shine");
    typeof d == "number" && this.applyShine(e, d);
    const u = [], f = n.get("perspective");
    if (typeof f == "number" && f > 0 && u.push(`perspective(${f}px)`), s)
      for (const g of Qf) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && u.push(m);
      }
    if (u.length > 0 && (e.style.transform = u.join(" "), Jf(e)), o && (o.childPerspective !== void 0 && (e.style.perspective = `${o.childPerspective}px`), (o.perspectiveOriginX !== void 0 || o.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${o.perspectiveOriginX ?? 50}% ${o.perspectiveOriginY ?? 50}%`)), i) {
      const g = i.originX ?? 50, p = i.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, b = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${b}%)`;
    }
    if (a) {
      const g = Gf(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return Kf(n);
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
    const s = e.dataset.shineBase, o = -20 + n * 140, i = e.style;
    i.color = "transparent", i.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, i.backgroundSize = "250% 100%, 100% 100%", i.backgroundPosition = `${o}% 0, 0 0`, i.backgroundRepeat = "no-repeat", i.webkitBackgroundClip = "text", i.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(e, n, s) {
    let o;
    if (e.namespaceURI === ip && n in Wa) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[Wa[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? o = "color" : o = op[n] ?? n;
    let r;
    typeof s == "number" ? La.has(n) || La.has(o) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[o] = r;
  }
}
const rp = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class ap {
  adapter = new ze();
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
  utils = Sf();
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
    this.scheduler = e.scheduler ?? rp, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      const o = this.nameFor(s);
      jo(s) && this.currentCollector?.touch(s, o), n.push(o);
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
    for (const o of [...this.active.keys()].reverse()) {
      if (o.getTracks({ target: e, property: n }).length === 0) continue;
      const i = o.currentTime;
      if (i < 4) return 0;
      const r = o.getStateAtTime(i).values.get(e)?.get(n), a = o.getStateAtTime(i - 4).values.get(e)?.get(n);
      if (typeof r != "number" || typeof a != "number") return;
      const l = (r - a) / 4;
      return (o.direction === "reverse" ? -l : l) * 1e3;
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
    for (const [s, o] of n)
      o.onUpdate?.(), s.playbackState !== "playing" && this.active.get(s) === o && this.active.delete(s);
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
      let o = this.applied.get(n);
      o || (o = /* @__PURE__ */ new Map(), this.applied.set(n, o));
      for (const [i, r] of s) o.set(i, r);
      this.dirty.add(n);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const e = /* @__PURE__ */ new Map();
    for (const n of this.dirty) {
      const s = this.applied.get(n), o = this.objects.get(n);
      if (o)
        for (const [i, r] of s) o[i] = r;
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
    if (jo(e)) return [e];
    if (!lp(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return jo(e) ? this.elementName(e) : this.objectName(e);
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
function jo(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function lp(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function Qs(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const Fa = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function cp(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function hp(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function dp(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || Fa(t) ? { path: t } : t, { align: s, alignOrigin: o, path: i, ...r } = n, a = (E) => {
    const A = Fa(E) ? E : e.query(E);
    return A || e.warn(`gsap-compat: motionPath could not find "${String(E)}"`), A;
  };
  let l = null, c = "";
  if (Array.isArray(i) || typeof i == "string" && us(i))
    c = i;
  else {
    l = a(i);
    const E = l && kr({ tag: l.localName, attributes: cp(l) });
    l && !E && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = E ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const d = s === !0 ? l : a(s);
  if (!d)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = e.targets[0];
  if (!u) return h;
  const [f, g, p, m, b, M] = hp(d), w = Qs(u), [y, S] = o ?? [0.5, 0.5];
  for (const E of e.targets.slice(1)) {
    const A = Qs(E);
    if (Math.abs(A.left - w.left) > 0.5 || Math.abs(A.top - w.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [f, g, p, m, b - w.left - y * w.width, M - w.top - S * w.height], h;
}
const Ph = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Ih(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Oh(t) {
  if (!t) return null;
  const e = kr({ tag: t.localName, attributes: Ih(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function up(t, e, n) {
  const s = $h(t);
  if (typeof s == "string" && us(s)) return s;
  const o = Ph(s) ? s : typeof s == "string" ? e(s) : null, i = Oh(o);
  return i || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const fp = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function pp(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : Ph(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const o = kr({ tag: s.localName, attributes: Ih(s) });
    if (!o || !s.parentNode) return s;
    const i = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      fp.has(r.name) || i.setAttribute(r.name, r.value);
    return i.setAttribute("d", o), s.parentNode.replaceChild(i, s), i;
  });
}
const Na = 0.3;
class gp {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = Da(), this.options.onPress?.(this.stateFrom(0, 0, s));
  }
  move(e, n, s) {
    if (!this.dragging) return;
    const o = e - this.lastX, i = n - this.lastY;
    this.lastX = e, this.lastY = n;
    const r = e - this.startX, a = n - this.startY, l = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(r, a) < l) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(o, i), this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.options.onMove?.(this.stateFrom(o, i, s));
  }
  end(e) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, e)));
  }
  updateVelocity(e, n) {
    const s = Da(), o = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const i = e / o * 1e3, r = n / o * 1e3;
    this.velocityX += (i - this.velocityX) * Na, this.velocityY += (r - this.velocityY) * Na;
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
function Da() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function mp(t, e, n) {
  let s = { delta: 0, line: null }, o = n;
  for (const i of t)
    for (const r of e) {
      const a = Math.abs(r - i);
      a <= o && (o = a, s = { delta: r - i, line: r });
    }
  return s;
}
function yp(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class _h {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new gp({
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
    const o = (this.options.axis ?? "both") === "y" ? this.y : this.x, i = bp(o / s);
    e.pause(), e.seek(i * n);
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
    const o = [
      ...yp([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], i = mp([s], o, this.snapThreshold());
    s += i.delta, n === "x" ? this.snappedX = i.line : this.snappedY = i.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function bp(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function vv(t) {
  const e = new _h(t);
  return e.start(), e;
}
const wp = { x: "x", y: "y", "x,y": "both" }, Ci = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Ba(t, e) {
  const n = Qs(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function qa(t) {
  return Array.isArray(t) ? [...t] : t;
}
function kp(t, e, n, s = {}) {
  const [o] = e.resolveTargets(n), i = o ? e.elementFor(o) : void 0;
  if (!o || !i)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return vp(t, e, o, i, s);
  const r = wp[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(o, "x"), m = e.appliedValue(o, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Ci(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Ci(s.bounds) ? s.bounds : void 0) ?? (l ? Ba(i, l) : void 0) };
  let d = null;
  const u = () => {
    d?.kill(), d = null;
  }, f = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, b = m.friction ?? (m.resistance !== void 0 ? Er(m.resistance) : 4), M = a(), w = h.bounds ?? {};
    let y, S;
    const E = m.end;
    if (Array.isArray(E)) {
      const v = Xs({ from: M.x, velocity: r === "y" ? 0 : p.x, friction: b }), k = Xs({ from: M.y, velocity: r === "x" ? 0 : p.y, friction: b });
      let x = E[0];
      for (const P of E)
        Math.hypot(P.x - v, P.y - k) < Math.hypot(x.x - v, x.y - k) && (x = P);
      x && (y = [x.x], S = [x.y]);
    } else typeof E == "number" ? (y = E, S = E) : E && (y = qa(E.x), S = qa(E.y));
    const A = {};
    r !== "y" && (A.x = { velocity: p.x, friction: b, min: w.minX, max: w.maxX, end: y }), r !== "x" && (A.y = { velocity: p.y, friction: b, min: w.minY, max: w.maxY, end: S }), d = t.to(i, { inertia: A, onComplete: () => s.onThrowComplete?.() });
  }, g = new _h({
    target: i,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), l && (h.bounds = Ba(i, l)), s.onPress?.();
    },
    onDrag: (p) => {
      e.apply(o, r === "x" ? { x: p.x } : r === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
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
      const p = e.appliedValue(o, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      u(), g.destroy();
    }
  };
}
function vp(t, e, n, s, o) {
  const i = typeof o.bounds == "object" && o.bounds !== null && !Ci(o.bounds) ? o.bounds : {}, r = () => {
    const w = e.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(i.maxRotation ?? 1 / 0, Math.max(i.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, d = { x: 0, y: 0 }, u = 0, f = 0, g = [];
  const p = (w) => Math.atan2(w.clientY - d.y, w.clientX - d.x) * 180 / Math.PI, m = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const y = s.getBoundingClientRect();
    d = { x: y.left + y.width / 2, y: y.top + y.height / 2 }, u = p(w), f = r(), g = [{ time: performance.now(), rotation: f }], o.onPress?.();
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    const y = p(w);
    let S = y - u;
    S > 180 && (S -= 360), S < -180 && (S += 360), u = y, f += S;
    let E = a(f);
    o.snap && (E = a(Math.round(E / o.snap) * o.snap)), e.apply(n, { rotate: E });
    const A = performance.now();
    for (g.push({ time: A, rotation: E }); g.length > 2 && A - g[0].time > 100; ) g.shift();
    const v = { x: 0, y: 0 };
    o.onDrag?.(v);
  }, M = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const y = g[0], S = g[g.length - 1], E = y && S ? (S.time - y.time) / 1e3 : 0, A = E > 0 ? (S.rotation - y.rotation) / E : 0;
    if (o.onRelease?.({ x: A, y: 0 }), !o.inertia) return;
    const v = o.inertia === !0 ? {} : o.inertia, k = v.friction ?? (v.resistance !== void 0 ? Er(v.resistance) : 4), x = typeof v.end == "number" || Array.isArray(v.end) ? v.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: A,
          friction: k,
          min: i.minRotation,
          max: i.maxRotation,
          end: Array.isArray(x) ? x.filter((P) => typeof P == "number") : x
        }
      },
      onComplete: () => o.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", b), s.addEventListener("pointerup", M), s.addEventListener("pointercancel", M), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", b), s.removeEventListener("pointerup", M), s.removeEventListener("pointercancel", M);
    }
  };
}
const Mp = { opacity: 0, scale: 0.6 };
function xp(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function za(t) {
  const e = Qs(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Ri(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = xp(r);
    o.set(r, a);
    const l = Hh(r);
    a && l !== void 0 && !i.has(l) && i.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: o, ids: i };
}
const Xo = /* @__PURE__ */ new WeakMap();
function Li(t, e, n, s = {}) {
  const o = s.duration ?? 0.6, i = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Mp : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const f of t.resolveTargets(s.targets)) {
      const g = t.elementFor(f);
      g && c.add(g);
    }
  const h = [...c].sort(
    (f, g) => f === g ? 0 : f.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), d = e({ onComplete: s.onComplete });
  let u = 0;
  for (const f of h) {
    const g = za(f);
    if (!g) continue;
    let p = n.boxes.get(f) ?? null, m;
    const b = Hh(f), M = !p && b !== void 0 ? n.ids.get(b) : void 0;
    M && M.element !== f && (p = M.box, m = M.element);
    const [w] = t.resolveTargets(f);
    Xo.get(f)?.timeline.removeTracks({ target: w });
    const y = u * r;
    if (!p) {
      if (l === !1) continue;
      d.fromTo(f, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Ch(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: o, ease: i, delay: y }, 0), Xo.set(f, d), u++;
      continue;
    }
    const S = p.cx - g.cx, E = p.cy - g.cy, A = a ? p.width / g.width : 1, v = a ? p.height / g.height : 1;
    if (!(Math.abs(S) > 0.5 || Math.abs(E) > 0.5 || Math.abs(A - 1) > 1e-3 || Math.abs(v - 1) > 1e-3)) {
      const P = (I, O) => {
        const _ = t.appliedValue(w, I);
        return typeof _ == "number" && Math.abs(_ - O) > 1e-6;
      };
      (P("x", 0) || P("y", 0) || P("scaleX", 1) || P("scaleY", 1)) && d.set(f, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const x = s.fade === !0 && m !== void 0;
    d.fromTo(
      f,
      { x: S, y: E, scaleX: A, scaleY: v, ...x && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...x && { opacity: 1 }, duration: o, ease: i, delay: y },
      0
    ), x && m && za(m) && d.fromTo(m, { opacity: 1 }, { opacity: 0, duration: o, ease: i, delay: y }, 0), Xo.set(f, d), u++;
  }
  return d;
}
function Hh(t) {
  return t.dataset?.flipId;
}
function Ch(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function Sp(t, e = {}) {
  const n = new Set((e.type ?? "chars,words,lines").split(",").map((p) => p.trim())), s = {
    chars: e.charsClass ?? "char",
    words: e.wordsClass ?? "word",
    lines: e.linesClass ?? "line"
  }, o = e.aria !== !1, i = t.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let r = { chars: [], words: [], lines: [], masks: [] }, a, l, c = !1;
  const h = () => {
    for (const { element: p, html: m, ariaLabel: b } of i)
      p.innerHTML = m, b === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", b);
  }, d = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, u = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of i) {
      const b = (m.textContent ?? "").replace(/\s+/g, " ").trim(), M = Tp(m, s.words), w = n.has("chars") ? M.flatMap((E) => Ep(E, s.chars)) : [], y = n.has("lines") ? $p(m, M, s.lines) : [];
      if (o) {
        !m.hasAttribute("aria-label") && b && m.setAttribute("aria-label", b);
        for (const E of M) E.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...M);
      else for (const E of M) E.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...y);
      const S = e.mask === "lines" ? y : e.mask === "words" ? M : e.mask === "chars" ? w : [];
      for (const E of S) p.masks.push(Pp(E, `${s[e.mask]}-mask`));
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
      c || (d(), h(), u(), a = e.onSplit?.(f));
    },
    revert() {
      c = !0, l?.disconnect(), d(), h();
    }
  };
  u(), a = e.onSplit?.(f), e.autoSplit && g();
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
        for (const S of w) {
          const E = Math.round(S.contentRect.width), A = p.get(S.target);
          p.set(S.target, E), A !== void 0 && A !== E && (y = !0);
        }
        y && b();
      });
      for (const w of t) l.observe(w);
    }
    const M = t[0]?.ownerDocument?.fonts;
    M && M.status !== "loaded" && M.ready.then(() => b());
  }
  return f;
}
function Tp(t, e) {
  const n = t.ownerDocument, s = [], o = n.createTreeWalker(
    t,
    4
    /* NodeFilter.SHOW_TEXT */
  ), i = [];
  for (let r = o.nextNode(); r; r = o.nextNode()) i.push(r);
  for (const r of i) {
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
function Ep(t, e) {
  const n = t.ownerDocument, s = Ap(t.textContent ?? "").map((o) => {
    const i = n.createElement("span");
    return i.className = e, i.style.display = "inline-block", i.textContent = o, i;
  });
  return t.replaceChildren(...s), s;
}
function Ap(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function $p(t, e, n) {
  const s = t.ownerDocument, o = new Map(e.map((g) => [g, g.getBoundingClientRect()])), i = [], r = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || o.has(p) || p.tagName === "BR" ? i.push(p) : r(p);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, d = !1, u = [];
  const f = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), u = [];
  };
  for (const g of i) {
    if (g.tagName === "BR") {
      d = !0;
      continue;
    }
    const p = o.get(g);
    if (p && (!l || d || p.top > c + h) && (f(), c = p.top, h = p.height / 2, d = !1), !l) continue;
    const m = [];
    for (let w = g.parentNode; w && w !== t; w = w.parentNode) m.unshift(w);
    let b = 0;
    for (; b < u.length && b < m.length && u[b].original === m[b]; ) b++;
    u.length = b;
    let M = b === 0 ? l : u[b - 1].clone;
    for (const w of m.slice(b)) {
      const y = w.cloneNode(!1);
      M.appendChild(y), u.push({ original: w, clone: y }), M = y;
    }
    M.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function Pp(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const Ya = {
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
function Ka(t) {
  const e = t.trim().toLowerCase();
  if (e in Ya) return Ya[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function Rh(t) {
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
  const o = s[0] !== void 0 ? Ka(s[0]) : void 0, i = s[1] !== void 0 ? Ka(s[1]) : void 0;
  return {
    elementFraction: o ?? 0,
    viewportFraction: i ?? 0,
    offsetPx: e
  };
}
function ts(t, e, n) {
  const s = Rh(n), o = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, i = e * s.viewportFraction;
  return o - i + s.offsetPx;
}
function Mv(t, e, n, s) {
  const o = ts(t, e, n), r = ts(t, e, s) - o;
  return r <= 0 ? o <= 0 ? 1 : 0 : Lh(-o / r);
}
function Lh(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function Ip(t, e, n, s) {
  if (n <= 0) return e;
  const o = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * o;
}
function ja(t, e, n, s, o) {
  const i = (h) => ts({ top: t + o(h), bottom: t + o(h) + e, height: e }, n, s), r = i(0), a = i(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const d = (l + c) / 2;
    Math.sign(i(d)) === Math.sign(r) ? l = d : c = d;
  }
  return (l + c) / 2;
}
class Op {
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
function xv(t) {
  const e = new Op(t);
  return e.start(), e;
}
class _p {
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
const Hp = 0.15;
function Cp(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function Rp(t, e, n) {
  const s = vs(t + e * Hp);
  if (typeof n == "function") return vs(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : vs(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let o = n[0];
  for (const i of n)
    Math.abs(i - s) < Math.abs(o - s) && (o = i);
  return vs(o);
}
function Lp(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const o = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * o;
}
class Wp {
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
  animate(e, n, s, o = ko, i) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || s <= 0) {
      this.write(n), i?.();
      return;
    }
    for (const l of this.cancelEvents) this.eventTarget?.addEventListener(l, this.onInterrupt, { passive: !0 });
    let r = null;
    const a = (l) => {
      r ??= l;
      const c = Math.min(1, (l - r) / (s * 1e3));
      this.write(e + (n - e) * o(c)), c < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), i?.());
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
function vs(t) {
  return Math.max(0, Math.min(1, t));
}
class Fp {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(e, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: o = "#3ecf7a", endColor: i = "#ff5a5a", id: r } = this.options, a = r ? `${r} ` : "", l = (c, h, d) => {
      const u = e.createElement("div");
      return u.textContent = `${a}${c}`, u.setAttribute("aria-hidden", "true"), u.className = "scroll-marker", Object.assign(u.style, {
        position: d ? "fixed" : "absolute",
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
    this.scrollerStart = l("scroller-start", o, !n), this.scrollerEnd = l("scroller-end", i, !n), this.start = l("start", o, !1), this.end = l("end", i, !1), n && getComputedStyle(n).position === "static" && (n.style.position = "relative");
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
const Np = 120, un = [], Sn = /* @__PURE__ */ new Set();
let Uo = !1;
const Dp = () => {
  Uo || Sn.size === 0 || (Uo = !0, queueMicrotask(() => {
    Uo = !1;
    for (const t of Sn) t.afterRefresh();
  }));
}, Wh = () => {
  for (const t of Sn) t.beforeRefresh();
  for (const t of un) t.refresh();
  for (const t of Sn) t.afterRefresh();
};
let fn = { width: 0, height: 0 };
const Xa = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === fn.width && e !== fn.height, s = Math.abs(e - fn.height) < fn.height * 0.25, o = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && o || (fn = { width: t, height: e }, Wh());
};
class xo {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new Wp((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new _p(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new Fp(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), un.length === 0 && typeof window < "u" && (fn = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Xa, { passive: !0 })), un.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), un.splice(un.indexOf(this), 1), un.length === 0 && typeof window < "u" && window.removeEventListener("resize", Xa), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Wh();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return Sn.add(e), () => Sn.delete(e);
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
      if (this.startPx = e + ts(n, s, Cn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const o = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(o.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, Dp();
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
    const s = this.endPx - this.startPx, o = this.zone;
    this.targetProgress = s > 0 ? Lh((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(o, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const o = Cn(this.options.end) ?? "bottom top", i = typeof o == "string" ? o.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (i) {
      const r = Number.parseFloat(i[1]);
      return this.startPx + (i[2] === "%" ? n * r / 100 : r);
    }
    return s + ts(e, n, o);
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
    }, Np));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(e, n) {
    if (e === n) return;
    const { onEnter: s, onLeave: o, onEnterBack: i, onLeaveBack: r } = this.options;
    e === "before" ? (s?.(), n === "after" && o?.()) : e === "after" ? (i?.(), n === "before" && r?.()) : n === "after" ? o?.() : r?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const e = this.options.snap;
    if (e === void 0 || this.snapper.active) return;
    const n = Cp(e), s = () => {
      this.snapTimer = null;
      const o = this.endPx - this.startPx, i = this.scrollPosition();
      if (!this.running || o <= 0 || i <= this.startPx || i >= this.endPx) return;
      const r = (i - this.startPx) / o, a = this.startPx + Rp(r, this.releaseVelocity / o, n.snapTo) * o;
      Math.abs(a - i) < 1 || this.snapper.animate(i, a, Lp(n, a - i, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), o = this.options.scroller?.getBoundingClientRect?.().left ?? 0, i = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - o - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (f) => a + f * (l - a), h = ja(r, s.width, i, Cn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const d = Cn(this.options.end) ?? "right left", u = typeof d == "string" ? d.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : c(ja(r, s.width, i, d, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (i, r) => {
      const a = Cn(i) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = Rh(a);
      return e * l.viewportFraction - l.offsetPx;
    }, s = n(this.options.start, "top bottom") ?? 0, o = n(this.options.end, "bottom top") ?? s;
    return {
      startViewport: s,
      endViewport: o,
      startPage: this.startPx + s,
      endPage: this.endPx + o
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const e = (n) => {
      if (this.rafId = null, !this.running) return;
      const s = this.lastFrameTime === null ? 16.67 : n - this.lastFrameTime;
      this.lastFrameTime = n, this.displayProgress = Ip(this.displayProgress, this.targetProgress, this.smoothing(), s);
      const o = Math.abs(this.targetProgress - this.displayProgress) < 1e-4;
      o && (this.displayProgress = this.targetProgress), this.applyProgress(), o ? this.lastFrameTime = null : this.rafId = requestAnimationFrame(e);
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
    const n = this.options.horizontal, s = n ? e.left ?? 0 : e.top, o = n ? e.right ?? 0 : e.bottom, i = n ? e.width ?? 0 : e.height, r = this.options.scroller;
    if (r && typeof r.getBoundingClientRect == "function") {
      const a = r.getBoundingClientRect(), l = n ? a.left : a.top;
      return { top: s - l, bottom: o - l, height: i };
    }
    return { top: s, bottom: o, height: i };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const e = this.options.scroller, n = this.options.horizontal;
    return e ? n ? e.clientWidth : e.clientHeight : typeof window < "u" ? n ? window.innerWidth : window.innerHeight : 0;
  }
}
function Cn(t) {
  return typeof t == "function" ? t() : t;
}
function Sv(t) {
  const e = new xo(t);
  return e.start(), e;
}
const Go = /* @__PURE__ */ new Set(), Bp = 16, Ua = 0.5, qp = 2;
class Ga {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), Go.add(this), this.stopListening = xo.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of Go) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), Go.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) Vo(e.element, e.saved);
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
    const s = this.clamp(this.resolve(e) + (n.offset ?? 0)), o = Math.abs(s - this.current), i = this.reduced ? 0 : n.duration ?? Math.min(1.2, Math.max(0.4, o / 2500));
    if (i <= 0) {
      this.journey = null, this.current = this.target = s, this.write(s), this.applyEffects(0);
      return;
    }
    this.target = s, this.journey = { from: this.current, to: s, ms: i * 1e3, ease: n.ease ?? ko, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const e = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (e && !this.reduced) {
      const n = this.options.scroller ?? document, s = this.position(), o = this.viewportHeight(), i = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const r of n.querySelectorAll(e)) {
        const a = Number.parseFloat(r.dataset.speed ?? ""), l = Number.parseFloat(r.dataset.lag ?? ""), c = r.getBoundingClientRect(), h = c.top - i + s;
        this.effects.push({
          element: r,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(l) && l > 0 ? l : void 0,
          centre: h + c.height / 2 - o / 2,
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
    for (const e of this.effects) Vo(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? Bp : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), o = this.clamp(this.target + s);
    o === this.target && o === this.current || (e.preventDefault(), this.journey = null, this.target = o, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= qp || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
  }
  nestedScrollerTakes(e) {
    const n = this.options.scroller ?? document.documentElement;
    for (let s = e.target; s && s !== n && s !== document.body; s = s.parentElement) {
      if (s.hasAttribute?.("data-smooth-ignore")) return !0;
      const o = getComputedStyle(s);
      if (!/(auto|scroll)/.test(o.overflowY) || s.scrollHeight <= s.clientHeight) continue;
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
      const i = this.journey;
      i.elapsed += n;
      const r = Math.min(1, i.elapsed / i.ms);
      this.current = i.from + (i.to - i.from) * i.ease(r), r >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const i = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-n / i)), Math.abs(this.target - this.current) < Ua && (this.current = this.target);
    }
    this.current !== s && this.write(this.current), this.velocityPxPerSecond = n > 0 ? (this.current - s) * 1e3 / n : 0;
    const o = this.applyEffects(n);
    this.current !== s && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || o ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(e) {
    let n = !1;
    const s = this.current;
    for (const o of this.effects) {
      let i = 0;
      if (o.speed !== void 0 && (i += (s - o.centre) * (1 - o.speed)), o.lag !== void 0) {
        const r = o.lag * 1e3 / 3;
        o.lagged = e === 0 ? s : o.lagged + (s - o.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - o.lagged) < Ua ? o.lagged = s : n = !0, i += s - o.lagged;
      }
      Vo(o.element, i === 0 ? o.saved : `0 ${zp(i)}px`), o.shift = i;
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
    const o = this.options.scroller?.getBoundingClientRect().top ?? 0, i = this.effects.find((r) => r.element === s)?.shift ?? 0;
    return s.getBoundingClientRect().top - o + this.position() - i;
  }
}
function Vo(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function zp(t) {
  return Math.round(t * 100) / 100;
}
function Yp(t, e) {
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
function Ar(t, e, n, s, o = () => {
}) {
  const i = (f) => typeof f == "string" ? t.query(f) ?? void 0 : f, r = i(e.trigger) ?? s;
  if (!r) {
    o(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const d = (f, g) => () => {
    g?.(), n && !a && Yp(n, l[f] ?? "none"), e.once && f === 0 && queueMicrotask(() => h.destroy());
  }, u = e.containerAnimation ? Xp(t, e.containerAnimation, r, o) : void 0;
  return h = new xo({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : i(e.pin),
    scroller: i(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : Kp(e.snap, n),
    markers: e.markers,
    container: u,
    onUpdate: (f, g) => {
      if (n && a !== !1 && n.progress(f), e.onUpdate) {
        const p = f < c || g < 0 ? -1 : 1;
        e.onUpdate({ progress: f, velocity: g, direction: p });
      }
      c = f;
    },
    onEnter: d(0, e.onEnter),
    onLeave: d(1, e.onLeave),
    onEnterBack: d(2, e.onEnterBack),
    onLeaveBack: d(3, e.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), t.own(h);
}
function Kp(t, e) {
  const n = (o) => o === "labels" ? (i) => jp(i, e?.labelProgresses?.() ?? []) : o;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? Js(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Rt(s.easing) : void 0
  };
}
function jp(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Xp(t, e, n, s) {
  const o = () => e.timeline.getTracks({ property: "x" }).map((i) => i.target).filter((i) => {
    const r = t.elementFor(i);
    return !!r && r !== n && r.contains(n);
  });
  return o().length === 0 && s("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const i = e.scrollTrigger;
      return i || s("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: i?.startOffset ?? 0, end: i?.endOffset ?? 0 };
    },
    progress: () => e.progress(),
    shiftAt: (i) => {
      const r = e.timeline.getStateAtTime(i * e.timeline.duration);
      let a = 0;
      for (const l of o()) {
        const c = r.values.get(l)?.get("x");
        typeof c == "number" && (a += c);
      }
      return a;
    }
  };
}
class Fh {
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
    for (const [e, { name: n, style: s, d: o }] of this.snapshots)
      s === null ? e.removeAttribute("style") : e.setAttribute("style", s), o !== null && e.setAttribute("d", o), this.host.forget(n);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class Up {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(e, n) {
    this.host = e, this.scope = n;
  }
  add(e, n) {
    const s = { conditions: e, setup: n, queries: /* @__PURE__ */ new Map() }, o = typeof e == "string" ? { matches: e } : e;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [i, r] of Object.entries(o)) {
        const a = window.matchMedia(r);
        s.queries.set(i, a);
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
    const s = Object.values(n).some(Boolean), o = s ? JSON.stringify(n) : void 0;
    if (o === e.key || (e.context?.revert(), e.context = void 0, e.key = o, !s)) return;
    const i = new Fh(this.host, this.scope);
    i.conditions = n, i.add(() => e.setup(i)), e.context = i;
  }
}
class Gp {
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
    const s = this.images[n], { width: o, height: i } = this.canvas, r = (this.options.fit ?? "cover") === "cover" ? Math.max(o / s.naturalWidth, i / s.naturalHeight) : Math.min(o / s.naturalWidth, i / s.naturalHeight), a = s.naturalWidth * r, l = s.naturalHeight * r;
    this.context.clearRect(0, 0, o, i), this.context.drawImage(s, (o - a) / 2, (i - l) / 2, a, l), this.drawn = n, this.pump();
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
      for (const o of s === 0 ? [n] : [n + s, n - s])
        o < 0 || o >= this.frames || this.images[o] || this.inFlight >= e || this.load(o);
  }
  load(e) {
    const n = new Image();
    n.decoding = "async", this.images[e] = n, this.inFlight++;
    const s = (o) => {
      if (!this.destroyed) {
        if (this.inFlight--, o) {
          this.ready[e] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const i = Math.round(this.current);
          (Math.abs(e - i) < Math.abs(this.drawn - i) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    n.onload = () => s(!0), n.onerror = () => s(!1), n.src = this.options.url(e);
  }
}
const Vp = { opacity: 0, y: -16 }, Jp = { opacity: 0, y: 16 };
async function Zp(t, e, n, s) {
  const o = e.collector?.scope ?? e.root, i = o.ownerDocument ?? o, r = () => s.shared ? [...o.querySelectorAll(s.shared)] : [];
  if (s.native && typeof i.startViewTransition == "function")
    return Qp(i, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((b) => {
    m(b) || b();
  }), h = r(), d = h.length ? Ri(e, h) : void 0, u = s.from !== void 0 ? Va(e, s.from, s.shared) : [];
  if (u.length && s.leave !== !1) {
    const m = s.leave ?? Vp;
    await c((b) => t.to(u, { ...m, duration: a, ease: l, onComplete: b }));
  }
  await s.update();
  const f = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? Va(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? Jp;
    f.push(c((b) => t.fromTo(p, m, { ...Ch(m), duration: a, ease: l, onComplete: b })));
  }
  if (d) {
    const m = r().filter((b) => !h.includes(b));
    m.length && f.push(
      c(
        (b) => Li(e, n, d, {
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
function Va(t, e, n) {
  const s = t.resolveTargets(e).map((o) => t.elementFor(o)).filter((o) => !!o);
  return n ? s.flatMap((o) => !o.querySelector(n) && !o.matches(n) ? [o] : [...o.children].filter((i) => !i.matches(n) && !i.querySelector(n))) : s;
}
async function Qp(t, e, n) {
  const s = (a, l) => {
    const c = a.dataset?.flipId;
    c && a.style.setProperty("view-transition-name", l ? `tf-${c.replace(/[^\w-]/g, "-")}` : "");
  }, o = n();
  o.forEach((a) => s(a, !0));
  let i = [];
  await t.startViewTransition(async () => {
    o.forEach((a) => s(a, !1)), await e.update(), i = n(), i.forEach((a) => s(a, !0));
  }).finished, i.forEach((a) => s(a, !1));
}
const tg = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => Sr(t, ef(e))
}, eg = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => Sr(t, { fn: nf(e) })
}, ng = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => Sr(t, { fn: sf(e) })
}, sg = /* @__PURE__ */ new Set([
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
]), Ja = 0.5, og = "power1.inOut";
function ig(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function rg(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) sg.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? Ja
    }));
  const s = Object.entries(e), o = t.duration ?? Ja, i = e.easeEach ?? t.easeEach ?? og;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([u]) => u !== "easeEach").map(([u, f]) => ({ at: Number.parseFloat(u) / 100, step: f })).sort((u, f) => u.at - f.at), h = [];
    let d = 0;
    for (const { at: u, step: f } of c) {
      const g = Math.max(0, u - d);
      h.push({ ...n, ease: i, ...f, duration: g * o }), d = u;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: i, duration: o / a };
    for (const [d, u] of r)
      c < u.length && (h[d] = u[c]);
    l.push(h);
  }
  return l;
}
function Za(t, e, n, s = {}) {
  const o = e.collector?.scope ?? e.root, i = typeof s.scroller == "string" ? o.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: i ? i.scrollLeft : window.scrollX,
    y: i ? i.scrollTop : window.scrollY
  }, a = {
    x: i ? i.scrollWidth - i.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: i ? i.scrollHeight - i.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (M, w) => {
    if (w === void 0) return r[M];
    if (typeof w == "number") return w;
    if (w === "max") return a[M];
    const y = typeof w == "string" ? o.querySelector(w) : w;
    if (!y) return r[M];
    const S = y.getBoundingClientRect(), E = i?.getBoundingClientRect(), A = (M === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return M === "x" ? S.left - (E?.left ?? 0) + r.x - A : S.top - (E?.top ?? 0) + r.y - A;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, d = { ...r }, u = () => {
    i ? (i.scrollLeft = d.x, i.scrollTop = d.y) : window.scrollTo({ left: d.x, top: d.y, behavior: "instant" });
  }, f = ["wheel", "touchstart", "keydown"], g = i ?? window, p = () => {
    b.kill(), m();
  }, m = () => {
    for (const M of f) g.removeEventListener(M, p);
  }, b = t.to(d, {
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
  if (s.autoKill !== !1) for (const M of f) g.addEventListener(M, p, { passive: !0 });
  return b;
}
function ag(t, e, n) {
  const s = t.collector?.scope ?? t.root, o = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: i = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...d } = n, u = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, f = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (b) => {
    g[b] !== void 0 && clearTimeout(g[b]), g[b] = void 0;
    const M = f[b].splice(0);
    M.length > 0 && u[b]?.(M);
  }, m = (b, M) => {
    if (u[b]) {
      if (f[b].push(M), r !== void 0 && f[b].length >= r) return p(b);
      g[b] === void 0 && (g[b] = setTimeout(() => p(b), i * 1e3));
    }
  };
  return o.map(
    (b) => Ar(t, {
      ...d,
      trigger: b,
      onEnter: () => m("onEnter", b),
      onLeave: () => m("onLeave", b),
      onEnterBack: () => m("onEnterBack", b),
      onLeaveBack: () => m("onLeaveBack", b)
    })
  ).filter((b) => b !== void 0);
}
class ge {
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
    if (this.options = s, this.compat = new mn({
      ...s,
      startValue: (o, i) => {
        const r = e.objectFor(o);
        if (r) return dg(r[i]);
        const a = e.appliedValue(o, i);
        if (a !== void 0) return a;
        if (i === "d") return Oh(e.elementFor(o)) ?? void 0;
        if (i === "text") return e.elementFor(o)?.textContent ?? void 0;
        if (i === "strokeDasharray" || i === "strokeDashoffset") {
          const l = el(e.elementFor(o));
          if (l !== void 0) return i === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (o, i) => e.velocityOf(o, i),
      layoutColumns: (o) => tl(o.map((i) => e.elementFor(i))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const o = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = Ar(e, o, this, this.firstElement, (i) => s.onWarning?.(i)));
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
    return ig(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.to(i, o, r)));
  }
  from(e, n, s) {
    return this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.from(i, o, r)));
  }
  fromTo(e, n, s, o) {
    return this.record(
      () => this.tween(e, [n, s], o, ([i, r], a, l) => this.compat.fromTo(a, i, r, l))
    );
  }
  set(e, n, s) {
    return this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.set(i, o, r)));
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
      const o = this.compat.addEvent(s);
      this.events.push({ time: o, run: () => e(...n) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(e, n, s = []) {
    return this.record(() => {
      const o = this.compat.addEvent(e);
      this.events.push({ time: o, pause: !0, run: () => n?.(...s) });
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
    const o = this.timeline.currentTime, i = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: o }, a = s.duration ?? Math.abs(i - o) / 1e3 / (this.timeScale() || 1), l = new ge(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
    return l.to(r, {
      time: i,
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
      const s = this.timeline, o = s.direction === "forward" ? s.currentTime === 0 : s.currentTime === s.duration;
      this.playhead = { ...this.readPlayhead(), fresh: o && !n }, this.waitingToWrap = !1;
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
      for (const o of n ?? [void 0])
        this.timeline.removeTracks({ target: s, ...o !== void 0 && { property: o } });
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
    const s = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: e >= n.time ? "forward" : "reverse" }, o = { ...n, iteration: s.iteration, direction: s.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(o, s, !1), this.options.onUpdate?.();
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
    const s = this.playhead, o = this.readPlayhead();
    this.playhead = o;
    const i = this.options.yoyo === !0;
    n && !i && o.iteration > s.iteration && (this.playhead = { time: 0, iteration: o.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const r = this.runCrossings(s, o, n);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !r) {
      this.finishedThisFrame = !1;
      const a = e.currentTime === 0 && e.direction === "reverse";
      !this.scrollDriver && !i && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(e, n, s) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const o = this.events, { crossings: i, passes: r } = mh(
      o.map((a) => a.time),
      e,
      n,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: s }
    );
    for (const a of i) {
      if (this.killed) return !0;
      if (a.kind === "repeat") {
        this.options.repeatRefresh && this.refreshForRepeat(), this.options.onRepeat?.();
        continue;
      }
      const l = o[a.index];
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
  tween(e, n, s, o) {
    const i = this.resolve(e);
    if (!i) return;
    const { onStart: r, onUpdate: a, onComplete: l } = n[n.length - 1];
    if (r || a || l) {
      let c = 1 / 0, h = -1 / 0;
      const d = (u, f, g) => {
        o(u, f, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(i, n, s, d), c === 1 / 0) return;
      r && this.events.push({ time: c, direction: "forward", run: r }), a && this.ranges.push({ start: c, end: h, run: a }), l && this.events.push({ time: h, direction: "forward", run: l });
      return;
    }
    this.buildTween(i, n, s, o);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(e, n, s) {
    const o = this.resolve(e);
    if (!o) return;
    const i = rg(n);
    if (i.length === 0) return;
    const r = o.length > 1 ? Hi(n.stagger, this.staggerContext(o)) : void 0, a = o.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? Ei(o.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + Zs(n.delay, 0) / 1e3;
    let d = 1 / 0, u = -1 / 0;
    if (l.forEach((m, b) => {
      i.forEach((M, w) => {
        const y = w === 0 ? h + c[b] : ">";
        this.tween(m, [M], y, ([S], E, A) => this.compat.to(E, S, A)), d = Math.min(d, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), d === 1 / 0) return;
    const { onStart: f, onUpdate: g, onComplete: p } = n;
    f && this.events.push({ time: d, direction: "forward", run: f }), g && this.ranges.push({ start: d, end: u, run: g }), p && this.events.push({ time: u, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => tl(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, o) {
    const i = e.map((u) => this.targetFor(u));
    if (!(e.length > 1 && (n.some(hg) || e.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(e[0]);
      o(n.map((f) => this.prepare(Qa(f, 0, u, this.stage.utils, i), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Hi(l, this.staggerContext(e)), d = h ? Ei(e.length, h).map((u) => u / 1e3) : e.map(() => 0);
    e.forEach((u, f) => {
      const g = f === 0 ? Zs(c.delay, 0) / 1e3 + d[0] : 0, p = f === 0 ? 0 : d[f] - d[f - 1], m = f === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, M = n.map((w, y) => y === a ? { ...c, delay: g } : w).map((w) => this.prepare(Qa(w, f, this.targetFor(u), this.stage.utils, i), [u]));
      o(M, [u], m);
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
    const s = (r) => this.options.onWarning?.(r), o = (r) => this.stage.query(r);
    let i = e;
    if (e.motionPath !== void 0) {
      const r = dp(e.motionPath, {
        query: o,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      i = { ...i, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = up(e.morphSVG, o, s), { morphSVG: a, ...l } = i;
      i = r ? { ...i, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = el(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = i;
        i = l;
      } else
        i = Wf(i, r);
    }
    return i;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${ug(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function lg(t = new ap()) {
  const e = (i) => {
    const { config: r } = Fs(i);
    return new ge(t, {
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
  }, n = (i) => {
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: d, ...u } = i;
    return u;
  }, s = (i) => (i && t.collector?.track(i), i), o = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (i, r) => {
      const [a] = t.resolveTargets(i);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? Ah(r);
    },
    scrollTrigger: (i) => s(Ar(t, i)),
    scrollBatch: (i, r) => ag(t, i, r).map((a) => s(a)),
    scrollTo: (i, r) => Za(o, t, i, r),
    refreshScroll: () => {
      xo.refreshAll(), Ga.refreshAll();
    },
    smoothScroll: (i = {}) => {
      const r = typeof i.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(i.scroller) : i.scroller;
      return s(new Ga({ ...i, scroller: r }).start());
    },
    context: (i, r) => {
      const a = new Fh(t, r);
      return i && a.add(() => i(a)), a;
    },
    matchMedia: (i) => new Up(t, i),
    customEase: tg.create,
    customBounce: eg.create,
    customWiggle: ng.create,
    pageTransition: (i) => Zp(o, t, (r) => new ge(t, r), i),
    imageSequence: (i, r) => {
      const a = typeof i == "string" ? (t.collector?.scope ?? t.root).querySelector(i) : i;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(i)}`);
      return s(new Gp(a, r));
    },
    quickTo: (i, r, a = {}) => {
      const l = new ge(t, { paused: !0 }), [c] = t.resolveTargets(i);
      return Object.assign((d) => {
        if (!c) return;
        const u = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: d,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: cg(a.spring, r, u) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (i) => new ge(t, i),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (i, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof i != "string" && i !== window && i.nodeType === 1;
        return Za(o, t, a, {
          ...l,
          offsetX: c.offsetX,
          offsetY: c.offsetY,
          scroller: h ? i : void 0
        });
      }
      return e(r).to(i, n(r));
    },
    from: (i, r) => e(r).from(i, n(r)),
    fromTo: (i, r, a) => e(a).fromTo(i, r, n(a)),
    set: (i, r) => e(r).set(i, n(r)),
    delayedCall: (i, r, a) => new ge(t).call(r, a, i),
    killTweensOf: (i, r) => {
      const a = t.resolveTargets(i), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (i) => pp(i, t.root),
    splitText: (i, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof i == "string" ? Array.from(a.querySelectorAll(i)) : "nodeType" in i ? [i] : Array.from(i);
      return s(Sp(l, r));
    },
    draggable: (i, r) => s(kp(o, t, i, r)),
    getFlipState: (i) => Ri(t, i),
    flipFrom: (i, r) => Li(t, (a) => new ge(t, a), i, r),
    flip: (i, r, a) => {
      const l = Ri(t, i);
      return r(), Li(t, (c) => new ge(t, c), l, { targets: i, ...a });
    }
  };
  return o;
}
const Jt = /* @__PURE__ */ lg();
function cg(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function hg(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || Nh(t);
}
function Nh(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || Eh(n)) && !Tr.has(e));
}
function Qa(t, e, n, s, o) {
  if (!Nh(t)) return t;
  const i = {};
  for (const [r, a] of Object.entries(t))
    Tr.has(r) ? i[r] = a : typeof a == "function" ? i[r] = a(e, n, o) : Eh(a) ? i[r] = s.resolveRandomString(a) : i[r] = a;
  return i;
}
function tl(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function el(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function dg(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function ug(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class nl {
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
function fg(t, e, n, s, o) {
  const i = n - o;
  if (i < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(i, s);
}
class $r {
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
    this.options = n, this.adapter = new ze();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = Qn({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
    for (const i of e) {
      if (s.has(i.id)) throw new Error(`tinyfly: scenario id "${i.id}" is used more than once`);
      s.add(i.id);
    }
    const o = n.initial === void 0 ? e[0] : e.find((i) => i.id === n.initial);
    if (!o) throw new Error(`tinyfly: there is no scenario "${n.initial}"`);
    this.scenarioList = [...e], this.scenarioId = o.id, await this.loadSource(o.timeline);
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
    const s = this.isPlaying, o = this.currentTime >= this.duration - 0.5, i = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = e, this.useDefinition(n.timeline), this.lastMarkerId = null;
    let r = 0;
    return this.reducedMotion || o ? r = this.duration : i !== void 0 && (r = this.markers.find((a) => a.id === i)?.time ?? 0), this.seek(r), s && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
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
    const o = n ?? this.language(), i = (r) => r?.[o]?.[s.id] ?? r?.[o.split("-")[0]]?.[s.id];
    return i(this.options.captions) ?? i(this.timeline?.captions) ?? s.label;
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
      const s = n, o = Number(s.getAttribute("data-tinyfly-start") ?? "0") || 0, i = s.getAttribute("data-volume");
      i !== null && (s.volume = Math.max(0, Math.min(1, Number(i) || 0))), this.mediaTargets.push({ el: s, startTime: o, sync: new nl(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      fg(s.sync, s.el, e, n, s.startTime);
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
      const o = n.getAttribute("data-tinyfly");
      o && this.registerTarget(o, n);
    }), this.timeline && new Set(this.timeline.tracks.map((s) => s.target)).forEach((s) => {
      if (!this.targets[s]) {
        const o = this.container.querySelector(`[data-tinyfly="${s}"]`) || this.container.querySelector(`.${s}`) || this.container.querySelector(`#${s}`);
        o && this.registerTarget(s, o);
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
      const o = s.getAttribute("data-tinyfly-symbol");
      if (!o) return;
      const i = n.get(o);
      if (!i || !i.timeline.tracks?.length) return;
      const r = new ze();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: Qn(i.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new nl(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
      const o = this.playhead;
      this.timeline.tick(s), this.stopAtMarker(o), this.applyState();
      const i = this.timeline.playbackState === "playing";
      this.mediaSync?.update(this.timeline.currentTime, i), this.syncAllMedia(this.timeline.currentTime, i), this.timeline.playbackState === "playing" ? this.animationFrameId = requestAnimationFrame(e) : (this.animationFrameId = void 0, this.notify());
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
    const o = this.markers;
    if (o.length === 0) return;
    const { crossings: i } = mh(
      o.map((r) => r.time),
      e,
      s,
      { duration: n.duration, alternate: n.config.alternate === !0, holding: n.repeatDelayRemaining > 0 }
    );
    for (const r of i) {
      if (r.kind !== "event") continue;
      const a = o[r.index];
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
async function Tv(t, e, n = {}) {
  const s = new $r(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function Ev(t, e = {}) {
  return new $r(t, e);
}
const pg = {
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
}, sl = "tinyfly-controls-style", gg = `
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
let mg = 0;
function yg(t) {
  if (t.getElementById(sl)) return;
  const e = t.createElement("style");
  e.id = sl, e.textContent = gg, t.head.appendChild(e);
}
function bg(t, e, n = {}) {
  const s = e.ownerDocument;
  yg(s);
  const o = { ...pg, ...n.labels }, i = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((W) => W.label !== void 0 || t.caption(W.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (W, B, j, V = "") => {
    const K = s.createElement("button");
    return K.type = "button", K.className = `tf-ctl-btn ${V}`.trim(), K.setAttribute("aria-label", W), K.title = W, K.textContent = B, K.addEventListener("click", j), K;
  }, d = h(o.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), u = h(o.prev, "|◀", () => t.prev()), f = h(o.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(o.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", o.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const b = s.createElement("span");
  b.className = "tf-ctl-step";
  const M = s.createElement("select");
  M.className = "tf-ctl-speed", M.setAttribute("aria-label", o.speed);
  for (const W of i) {
    const B = s.createElement("option");
    B.value = String(W), B.textContent = `${W}×`, W === 1 && (B.selected = !0), M.appendChild(B);
  }
  M.addEventListener("change", () => t.setSpeed(Number(M.value))), c.append(d, u, f, g, m, b), i.length > 0 && c.append(M), l.append(c);
  const w = n.fullscreen ? Mg(e, s, o) : void 0;
  w && c.append(w.button);
  const y = s.createElement("p");
  y.className = "tf-ctl-caption", y.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(y);
  const S = s.createElement("div");
  S.className = "tf-ctl-question", S.hidden = !0;
  const E = s.createElement("span"), A = h(o.reveal, o.reveal, () => t.play(), "tf-ctl-primary");
  S.append(E, A), l.append(S);
  const v = wg(t, s, o.scenario, n.scenarioControl ?? "buttons");
  v && l.append(v.element);
  const k = n.mount;
  k ? k.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const x = () => {
    const W = t.isPlaying;
    f.textContent = W ? "❚❚" : "▶", f.setAttribute("aria-label", W ? o.pause : o.play), f.title = W ? o.pause : o.play;
    const B = t.duration;
    s.activeElement !== m && (m.value = String(B > 0 ? Math.round(t.currentTime / B * 1e3) : 0));
    const j = t.markers;
    if (u.hidden = g.hidden = b.hidden = j.length === 0, j.length > 0) {
      const V = t.currentMarker, K = V ? j.indexOf(V) + 1 : 0;
      b.textContent = o.stepFormat.replace("{index}", String(K)).replace("{total}", String(j.length)), b.setAttribute("aria-label", `${o.step} ${K} ${o.of} ${j.length}`), u.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= B - 0.5;
      const T = t.caption() ?? "";
      y.textContent !== T && (y.textContent = T), y.hidden = !a();
      const C = !W && V?.question !== void 0 && Math.abs(t.currentTime - V.time) < 1;
      S.hidden = !C, C && E.textContent !== V.question && (E.textContent = V.question);
    } else
      S.hidden = !0, y.hidden = !0;
    v?.update();
  }, P = t.subscribe(x);
  x();
  const I = n.keyboardScope ?? e;
  !I.hasAttribute("tabindex") && I.tabIndex < 0 && (I.tabIndex = 0);
  const O = /* @__PURE__ */ new WeakSet(), _ = (W) => {
    if (O.has(W) || (O.add(W), W.defaultPrevented || W.altKey || W.ctrlKey || W.metaKey)) return;
    const B = W.target;
    if (!(B.tagName === "INPUT" || B.tagName === "SELECT") && !(W.key === " " && B.tagName === "BUTTON"))
      switch (W.key) {
        case " ":
          W.preventDefault(), t.isPlaying ? t.pause() : p();
          break;
        case "ArrowRight":
          if (!r()) return;
          W.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          W.preventDefault(), t.prev();
          break;
        case "Home":
          W.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          W.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return I.addEventListener("keydown", _), l.addEventListener("keydown", _), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), P(), I.removeEventListener("keydown", _), l.removeEventListener("keydown", _), l.remove();
    }
  };
}
function wg(t, e, n, s) {
  const o = t.scenarios;
  if (o.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const d = e.createElement("span");
    d.textContent = n, d.setAttribute("aria-hidden", "true");
    const u = e.createElement("input");
    u.type = "range", u.min = "0", u.max = String(o.length - 1), u.step = "1", u.setAttribute("aria-label", n);
    const f = e.createElement("output");
    return f.setAttribute("aria-hidden", "true"), u.addEventListener("input", () => {
      const p = o[Number(u.value)];
      p && t.setScenario(p.id);
    }), h.append(d, u, f), { element: h, update: () => {
      const p = Math.max(0, o.findIndex((b) => b.id === t.scenario));
      e.activeElement !== u && (u.value = String(p));
      const m = o[p].label;
      f.textContent !== m && (f.textContent = m), u.setAttribute("aria-valuetext", m);
    } };
  }
  const i = e.createElement("fieldset");
  i.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, i.append(r);
  const a = `tf-ctl-scenario-${++mg}`, l = o.map((h) => {
    const d = e.createElement("label");
    d.className = "tf-ctl-choice";
    const u = e.createElement("input");
    u.type = "radio", u.name = a, u.value = h.id, u.addEventListener("change", () => {
      u.checked && t.setScenario(h.id);
    });
    const f = e.createElement("span");
    return f.textContent = h.label, d.append(u, f), i.append(d), u;
  });
  return { element: i, update: () => {
    for (const h of l) {
      const d = h.value === t.scenario;
      h.checked !== d && (h.checked = d);
    }
  } };
}
const kg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', vg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Mg(t, e, n) {
  const s = e, o = t, i = e.createElement("button");
  i.type = "button", i.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    i.innerHTML = p ? vg : kg;
    const m = p ? n.exitFullscreen : n.fullscreen;
    i.setAttribute("aria-label", m), i.title = m, i.setAttribute("aria-pressed", String(p)), t.classList.toggle("tf-fullscreen", p), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, d = (p) => {
    p.key === "Escape" && g();
  }, u = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", d), l();
  };
  async function f() {
    if (r) return;
    const p = o.requestFullscreen?.bind(o) ?? o.webkitRequestFullscreen?.bind(o), m = s.fullscreenEnabled ?? s.webkitFullscreenEnabled ?? !1;
    if (p && m)
      try {
        if (await p(), c() === t) {
          r = "native", l();
          return;
        }
      } catch {
      }
    u();
  }
  async function g() {
    if (r === "overlay")
      e.removeEventListener("keydown", d), e.documentElement.style.overflow = a, r = void 0, l();
    else if (r === "native") {
      r = void 0, l();
      const p = s.exitFullscreen?.bind(s) ?? s.webkitExitFullscreen?.bind(s);
      c() === t && p && await p();
    }
  }
  return i.addEventListener("click", () => {
    r ? g() : f();
  }), e.addEventListener("fullscreenchange", h), e.addEventListener("webkitfullscreenchange", h), l(), {
    button: i,
    get active() {
      return r !== void 0;
    },
    enter: f,
    exit: g,
    destroy() {
      g(), e.removeEventListener("fullscreenchange", h), e.removeEventListener("webkitfullscreenchange", h), i.remove();
    }
  };
}
const ol = "tinyfly-choices-style", xg = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function Sg(t) {
  if (t.getElementById(ol)) return;
  const e = t.createElement("style");
  e.id = ol, e.textContent = xg, t.head.appendChild(e);
}
function Tg(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  Sg(e.ownerDocument);
  const s = [], o = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (g, p) => {
      a.hasAttribute(g) || (a.setAttribute(g, p), c.push(g));
    };
    h("role", "button"), h("tabindex", "0");
    const d = t.scenarios.find((g) => g.id === l)?.label;
    d !== void 0 && h("aria-label", d), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const u = () => t.setScenario(l), f = (g) => {
      const p = g.key;
      p !== "Enter" && p !== " " || (g.preventDefault(), u());
    };
    a.addEventListener("click", u), a.addEventListener("keydown", f), o.push(() => {
      a.removeEventListener("click", u), a.removeEventListener("keydown", f);
    });
  }
  const i = () => {
    for (const { element: a } of s)
      a.setAttribute("aria-pressed", String(a.getAttribute("data-tinyfly-choose") === t.scenario));
  }, r = t.subscribe(i);
  return i(), () => {
    r();
    for (const a of o) a();
    for (const { element: a, attributes: l } of s) for (const c of l) a.removeAttribute(c);
  };
}
const to = /* @__PURE__ */ new WeakMap(), Wi = /* @__PURE__ */ new WeakMap();
let Eg = 0;
function qn(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function Ag(t, e = {}) {
  const n = to.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), o = s[0], i = t.getAttribute("data-src"), r = Pg(t.getAttribute("data-markers")), a = s.length > 1 || o?.hasAttribute("data-scenario") ? $g(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = o && !a ? qn(o.textContent, "timeline", t) : void 0;
  if (!l && i && r) {
    const f = await fetch(i);
    f.ok && (l = await f.json());
  }
  if (l && r && (l = Dh(l, r)), !l && !i && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = qn(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...qn(t.getAttribute("data-options"), "data-options", t)
  };
  Og(t);
  const d = new $r(t, h), u = { element: t, player: d };
  if (to.set(t, u), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const f = t.getAttribute("data-scenario") ?? void 0;
    await d.loadScenarios(a, { initial: a.some((g) => g.id === f) ? f : void 0 }), Wi.set(t, Tg(d, t));
  } else
    await d.load(l ?? i);
  if (t.getAttribute("data-controls") !== "false") {
    const f = qn(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    u.controls = bg(d, t, {
      ...e.controls,
      ...t.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...m === "slider" || m === "buttons" ? { scenarioControl: m } : {},
      labels: { ...e.controls?.labels, ...f, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), g ? t.insertBefore(u.controls.element, g) : t.appendChild(u.controls.element);
  }
  return u;
}
function $g(t, e, n) {
  const s = [];
  return t.forEach((o, i) => {
    const r = qn(o.textContent, "timeline", n);
    if (!r) return;
    const a = o.getAttribute("data-scenario") || `scenario-${i + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = o.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? Dh(r, e) : r });
  }), s;
}
function Dh(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function Pg(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function Ig(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((o) => Ag(o, e)))).filter((o) => o !== void 0);
}
function Av(t) {
  const e = to.get(t);
  e && (Wi.get(t)?.(), Wi.delete(t), e.controls?.destroy(), e.player.destroy(), to.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function Og(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++Eg}`, e.setAttribute("aria-labelledby", s.id));
}
function _g() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    Ig();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class Hg {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new ze(), this.adapterB = new ze();
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
      const o = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(o), this.applyNested(this.adapterA, 0);
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
    const o = document.createElement("div");
    o.style.cssText = "position:absolute;inset:0;transform-origin:center center", o.setAttribute("data-tinyfly", "Camera"), n.appendChild(o), s.registerTarget("Camera", o);
    for (const i of e.elements) {
      if (!i.html) continue;
      const r = document.createElement("div");
      r.innerHTML = i.html.trim();
      const a = r.firstElementChild;
      if (a) {
        o.appendChild(a);
        const l = a.getAttribute("data-tinyfly");
        l && s.registerTarget(l, a);
      }
    }
    this.setupNested(o, s);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(e, n) {
    const s = [];
    e.querySelectorAll("[data-tinyfly-symbol]").forEach((o) => {
      const i = o.getAttribute("data-tinyfly-symbol");
      if (!i) return;
      const r = this.symbolDefs.get(i);
      if (!r) return;
      const a = new ze();
      o.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: Qn(r) });
    }), s.length ? this.nestedByAdapter.set(n, s) : this.nestedByAdapter.delete(n);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(e, n) {
    const s = this.nestedByAdapter.get(e);
    if (s)
      for (const o of s) {
        const i = o.timeline.duration;
        o.adapter.applyState(o.timeline.getStateAtTime(i > 0 ? n % i : n));
      }
  }
  clearContainer(e) {
    e.innerHTML = "";
  }
  createTimeline(e) {
    return e.timeline ? Qn(e.timeline) : null;
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
    const s = `${n}ms`, o = "ease-in-out";
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${s} ${o}, transform ${s} ${o}`, this.containerB.style.transition = `opacity ${s} ${o}, transform ${s} ${o}`, e) {
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
        const o = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(o), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(s);
        const o = this.timelineB.getStateAtTime(this.timelineB.currentTime);
        this.adapterB.applyState(o), this.applyNested(this.adapterB, this.timelineB.currentTime);
      }
      this._isPlaying ? this.animationFrameId = requestAnimationFrame(e) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(e);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
}
async function $v(t, e, n = {}) {
  const s = new Hg(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const Pv = { type: "none", duration: 0 }, Tt = (t) => ({ description: t, unit: "degrees" }), xt = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), Bh = {
  lean: Tt("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: Tt("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: Tt("Head tilt"),
  leftShoulder: Tt("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: Tt("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: Tt("Left elbow bend, added to the upper arm"),
  rightElbow: Tt("Right elbow bend, added to the upper arm"),
  leftHip: Tt("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: Tt("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: Tt("Left knee bend (negative folds the shin back)"),
  rightKnee: Tt("Right knee bend (positive folds the shin back)"),
  leftWrist: Tt("Left wrist bend, added to the forearm"),
  rightWrist: Tt("Right wrist bend, added to the forearm"),
  leftAnkle: Tt("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: Tt("Right ankle: + points the toe down (tiptoe), − onto the heel"),
  leftFootOut: xt("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: xt("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: xt("Mouth open: 0 closed, 1 wide open"),
  smile: xt("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: xt("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: xt("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: xt("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: xt("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: xt("Eyes look across: + the way it faces", -1, 1),
  lookY: xt("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: xt("0 front-on, 1 in profile, turned the way it faces"),
  sit: xt("0 standing, 1 seated"),
  spin: Tt("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, qh = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: xt("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: xt("How much the mouth chatters"),
  rubber: xt("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: xt("How much of the dance is applied")
}, zh = {
  "thumb.curl": xt("Thumb curled in"),
  "thumb.across": xt("Thumb across the palm"),
  "index.curl": xt("Index finger curled"),
  "middle.curl": xt("Middle finger curled"),
  "ring.curl": xt("Ring finger curled"),
  "pinky.curl": xt("Little finger curled"),
  spread: xt("Fingers spread apart"),
  turn: Tt("Hand turned about the forearm"),
  bend: Tt("Hand bent at the wrist, palm-ward"),
  tilt: Tt("Hand tilted sideways"),
  roll: Tt("Hand rolled to show the back or the palm")
};
let Yh;
function Cg(t) {
  Yh = t;
}
function Rg(t) {
  return Yh?.(t) ?? {};
}
function Lg(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function es(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = Lg(t) * n;
  const o = [t[0]];
  for (let i = 1; i < t.length; i++) {
    const r = t[i - 1], a = t[i], l = Math.hypot(a.x - r.x, a.y - r.y);
    if (l >= s) {
      const c = l === 0 ? 0 : s / l;
      return o.push({ x: r.x + (a.x - r.x) * c, y: r.y + (a.y - r.y) * c }), o;
    }
    o.push(a), s -= l;
  }
  return o;
}
function Pr(t, e) {
  const n = es(t, e);
  return n[n.length - 1];
}
function Kh(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Fi(t, e, n) {
  const s = e.roughness ?? 2, o = Math.max(1, Math.round(e.passes ?? 2)), i = Kh(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const u = r++;
    return (f) => Ve(oe(`${e.seed ?? 1}:${i}:${u}:${f}`));
  }, l = (u, f) => (u.next() * 2 - 1) * f, c = (u) => {
    const f = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < o; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, u(f(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (u, f = 1) => {
    if (u.length < 2) return;
    const g = u.slice(1).map((m, b) => Math.hypot(m.x - u[b].x, m.y - u[b].y)), p = g.reduce((m, b) => m + b, 0) * Math.min(1, Math.max(0, f));
    c((m) => {
      const b = [], M = [];
      if (u.forEach((y, S) => {
        b.push({ x: y.x + l(m, s * 0.5), y: y.y + l(m, s * 0.5) }), S > 0 && M.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(b[0].x, b[0].y);
      let w = 0;
      for (let y = 1; y < b.length; y++) {
        const S = Wg(b[y - 1], b[y], s, M[y - 1]), E = g[y - 1];
        if (w + E <= p) {
          t.bezierCurveTo(S[1].x, S[1].y, S[2].x, S[2].y, S[3].x, S[3].y), w += E;
          continue;
        }
        const A = Fg(S, E === 0 ? 1 : (p - w) / E);
        t.bezierCurveTo(A[1].x, A[1].y, A[2].x, A[2].y, A[3].x, A[3].y);
        break;
      }
      t.stroke();
    });
  }, d = (u, f, g, p, m = 1) => {
    c((b) => {
      const w = b.next() * Math.PI * 2, y = Math.PI * 2 + 0.15 + b.next() * 0.3, S = [];
      for (let A = 0; A <= 14; A++) {
        const v = w + y * A / 14, k = l(b, s * 0.6);
        S.push({ x: u + Math.cos(v) * (g + k), y: f + Math.sin(v) * (p + k) });
      }
      const E = es(S, m);
      E.length < 2 || (il(t, E), t.stroke());
    });
  };
  return {
    line: h,
    curve(u, f = 1) {
      if (u.length < 2) return;
      const g = u[0], p = u[u.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, b = -(p.y - g.y) / m, M = (p.x - g.x) / m;
      c((w) => {
        const y = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, S = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, E = l(w, s * Math.min(1.5, Math.max(0.3, m / 80))), A = u.map((k, x) => {
          const P = x / (u.length - 1), I = Math.sin(Math.PI * P) * E;
          return {
            x: k.x + y.x + (S.x - y.x) * P + b * I,
            y: k.y + y.y + (S.y - y.y) * P + M * I
          };
        }), v = es(A, f);
        v.length < 2 || (il(t, v), t.stroke());
      });
    },
    circle(u, f, g, p = 1) {
      d(u, f, g, g, p);
    },
    ellipse: d,
    nudge(u = 0.5) {
      const f = a()(0);
      return { x: l(f, s * u), y: l(f, s * u) };
    }
  };
}
function Wg(t, e, n, s) {
  const o = e.x - t.x, i = e.y - t.y, r = Math.hypot(o, i) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -i / r, c = o / r;
  return [
    t,
    { x: t.x + o / 3 + l * s[0] * a, y: t.y + i / 3 + c * s[0] * a },
    { x: t.x + 2 * o / 3 + l * s[1] * a, y: t.y + 2 * i / 3 + c * s[1] * a },
    e
  ];
}
function Fg([t, e, n, s], o) {
  const i = (d, u) => ({ x: d.x + (u.x - d.x) * o, y: d.y + (u.y - d.y) * o }), r = i(t, e), a = i(e, n), l = i(n, s), c = i(r, a), h = i(a, l);
  return [t, r, c, i(c, h)];
}
function il(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const o = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, o.x, o.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function Lt(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const o = [], i = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], d = Math.hypot(h.x - c.x, h.y - c.y) || 1, u = r(l) / 2, f = -(h.y - c.y) / d * u, g = (h.x - c.x) / d * u;
    o.push({ x: a.x + f, y: a.y + g }), i.push({ x: a.x - f, y: a.y - g });
  }), [...o, ...i.reverse()];
}
function Ir(t, e, n, s) {
  const o = e.length;
  if (o < 2) return;
  const i = Lt(e, n, s), r = (a) => n + (s - n) * a / (o - 1);
  t.beginPath(), t.moveTo(i[0].x, i[0].y);
  for (const a of i.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== o - 1 && o > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function Tn(t, e, n, s, o = 16) {
  const i = { x: 2 * e.x - (t.x + n.x) / 2, y: 2 * e.y - (t.y + n.y) / 2 }, r = [];
  for (let a = 0; a <= o; a++) {
    const l = a / o, c = l < 0.5 ? { x: t.x + (e.x - t.x) * 2 * l, y: t.y + (e.y - t.y) * 2 * l } : { x: e.x + (n.x - e.x) * (2 * l - 1), y: e.y + (n.y - e.y) * (2 * l - 1) }, h = 1 - l, d = {
      x: h * h * t.x + 2 * h * l * i.x + l * l * n.x,
      y: h * h * t.y + 2 * h * l * i.y + l * l * n.y
    };
    r.push({ x: c.x + (d.x - c.x) * s, y: c.y + (d.y - c.y) * s });
  }
  return r;
}
function rl(t, e, n, s, o, i = 0, r = 1, a = 40) {
  const l = Math.cos(o), c = Math.sin(o);
  return Array.from({ length: a + 1 }, (h, d) => {
    const u = i + Math.PI * 2 * r * d / a, f = Math.cos(u) * n, g = Math.sin(u) * s;
    return { x: t + f * l - g * c, y: e + f * c + g * l };
  });
}
function So(t, e) {
  return e.look === "pencil" ? qg(t, e) : Ng(t, e.ink, e.look);
}
function eo(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function Ng(t, e, n) {
  const s = n === "silhouette", o = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(i, r, a) {
      t.fillStyle = e, Ir(t, i, r * o, a * o);
    },
    line(i, r) {
      i.length < 2 || (t.strokeStyle = e, t.lineWidth = r * o, t.lineCap = "round", t.lineJoin = "round", eo(t, i), t.stroke());
    },
    shape(i, r, a) {
      eo(t, i, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * o, t.lineJoin = "round", t.stroke());
    },
    ellipse(i, r, a, l, c, h, d) {
      t.beginPath(), t.ellipse(i, r, a, l, c, 0, Math.PI * 2), (h !== null || s) && (t.fillStyle = s ? e : h, t.fill()), !(d <= 0) && (t.strokeStyle = e, t.lineWidth = d * o, t.stroke());
    },
    dot(i, r, a) {
      t.fillStyle = e, t.beginPath(), t.arc(i, r, a * o, 0, Math.PI * 2), t.fill();
    },
    guide() {
    },
    guideEllipse() {
    }
  };
}
function Dg(t, e) {
  const n = [t[0]];
  let s = 0;
  for (let r = 1; r < t.length; r++) {
    const a = t[r - 1], l = t[r], c = Math.hypot(l.x - a.x, l.y - a.y);
    let h = e - s;
    for (; h < c; ) {
      const d = h / c;
      n.push({ x: a.x + (l.x - a.x) * d, y: a.y + (l.y - a.y) * d }), h += e;
    }
    s = c - (h - e);
  }
  const o = t[t.length - 1], i = n[n.length - 1];
  return Math.hypot(o.x - i.x, o.y - i.y) > e * 0.25 ? n.push(o) : n[n.length - 1] = o, n;
}
function Bg(t, e) {
  const n = t.length;
  return t.map((s, o) => {
    const i = t[Math.max(0, o - 1)], r = t[Math.min(n - 1, o + 1)], a = Math.hypot(r.x - i.x, r.y - i.y) || 1, l = e(n === 1 ? 0 : o / (n - 1));
    return { x: s.x - (r.y - i.y) / a * l, y: s.y + (r.x - i.x) / a * l };
  });
}
function al(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, o) => s + o.amount, 0);
  return (s) => e.reduce((o, i) => o + i.amount * Math.sin(Math.PI * 2 * i.frequency * s + i.phase), 0) / n;
}
function qg(t, e) {
  const n = e.pencil ?? {}, s = e.ink, o = n.roughness ?? Math.max(1, e.lineWidth * 0.12), i = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = Kh(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => Ve(oe(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), d = (g, p, m, b, M, w = 0) => {
    if (g.length < 2) return;
    const y = g.slice(1).reduce((P, I, O) => P + Math.hypot(I.x - g[O].x, I.y - g[O].y), 0);
    let S = Dg(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, y / 24)));
    if (w > 0 && S.length >= 2) {
      const [P, I] = [S[S.length - 2], S[S.length - 1]], O = Math.hypot(I.x - P.x, I.y - P.y) || 1;
      S = [...S, { x: I.x + (I.x - P.x) / O * w, y: I.y + (I.y - P.y) / O * w }];
    }
    const E = al(m), A = al(m), v = S.length, k = [], x = [];
    S.forEach((P, I) => {
      const O = v === 1 ? 0 : I / (v - 1), _ = S[Math.max(0, I - 1)], W = S[Math.min(v - 1, I + 1)], B = Math.hypot(W.x - _.x, W.y - _.y) || 1, j = -(W.y - _.y) / B, V = (W.x - _.x) / B, K = E(O) * M, T = Math.min(1, O / 0.08, (1 - O) / 0.08), C = (0.55 + 0.45 * Math.sqrt(Math.max(0, T))) * (1 + r * A(O)), L = Math.max(0.3, p(O) * C / 2), $ = P.x + j * K, R = P.y + V * K;
      k.push({ x: $ + j * L, y: R + V * L }), x.push({ x: $ - j * L, y: R - V * L });
    }), t.save(), t.globalAlpha *= b, t.fillStyle = s, eo(t, [...k, ...x.reverse()], !0), t.fill(), t.restore();
  }, u = (g, p) => {
    const m = c++, b = h(m, 99, !0);
    if (b.next() < a) {
      const S = (b.next() * 2 - 1) * e.lineWidth * 1.4, E = (b.next() * 2 - 1) * e.lineWidth * 1.4, A = g.map((v) => ({ x: v.x + S, y: v.y + E }));
      d(A, (v) => p(v) * 1.8, h(m, 98, !0), 0.035, o), d(A, (v) => p(v) * 0.45, h(m, 97, !0), 0.12, o * 1.5);
    }
    const M = g.slice(1).reduce((S, E, A) => S + Math.hypot(E.x - g[A].x, E.y - g[A].y), 0), w = p(0.5) > 4 && M > p(0.5) * 6, y = w ? [-0.3, 0.3, 0] : [0];
    for (let S = 0; S < i; S++) {
      const E = S === 0;
      y.forEach((A, v) => {
        const k = h(m, S * 10 + v), x = A === 0 ? g : Bg(g, (I) => p(I) * A * Math.sqrt(Math.sin(Math.PI * I))), P = !E && A === 0 ? e.lineWidth * (0.3 + k.next() * 0.8) : 0;
        d(x, (I) => p(I) * (w ? 0.5 : 1) * (E ? 1 : 0.6), k, E ? 0.85 : 0.45, o * (E ? 0.6 : 1), P);
      });
    }
  }, f = (g, p, m, b, M, w) => {
    const S = h(c, 50).next() * Math.PI * 2;
    u(rl(g, p, m, b, M, S, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, p, m) {
      u(g, (b) => p + (m - p) * b);
    },
    line(g, p) {
      u(g, () => p);
    },
    shape(g, p, m) {
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, eo(t, g, !0), t.fill(), t.restore()), m > 0 && u([...g, g[0]], () => m);
    },
    ellipse(g, p, m, b, M, w, y) {
      w !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = w, t.beginPath(), t.ellipse(g, p, m, b, M, 0, Math.PI * 2), t.fill(), t.restore()), f(g, p, m, b, M, y);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      d(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, o * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, b, M) {
      if (n.construction === !1) return;
      const w = c++, y = h(w, 0), S = rl(g, p, m, b, M, y.next() * Math.PI * 2, 1.12, 48);
      d(S, () => Math.max(0.6, e.lineWidth * 0.18), y, 0.28, o * 1.5);
    }
  };
}
const zg = ["thumb", "index", "middle", "ring", "pinky"], Pt = {
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
function $t(t = {}) {
  return { ...Pt, ...t };
}
const Dt = (t, e, n, s, o) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": o
}), Ht = {
  relaxed: Pt,
  open: $t({ ...Dt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: $t({ ...Dt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: $t({ ...Dt(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: $t({ ...Dt(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: $t({ ...Dt(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: $t({ ...Dt(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: $t({ ...Dt(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: $t({ ...Dt(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: $t({ ...Dt(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: $t({ ...Dt(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: $t({ ...Dt(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: $t({ ...Dt(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: $t({ ...Dt(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function ns(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
const Yg = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, Kg = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, he = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, jg = [82, 100, 62], Xg = [48, 72], Ug = 3, Gg = 13, Vg = 0.035, Jg = -0.075, Zg = [
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
], Se = (t) => t * Math.PI / 180, Ni = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Ns = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Di = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], Rn = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Ye(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = Di(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + i[0] * o + e[0] * r * (1 - s),
    t[1] * s + i[1] * o + e[1] * r * (1 - s),
    t[2] * s + i[2] * o + e[2] * r * (1 - s)
  ];
}
const ll = [1, 0, 0], cl = [0, 1, 0], jn = [0, 0, 1];
function Qg(t, e, n) {
  const s = Se(t.fan * (Ug + Gg * n)), o = [Math.sin(s), Math.cos(s), 0], i = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, d) => {
    a += Se(jg[d] * e), r.push(Ni(r[d], Ns(Ye(o, i, -a), h)));
  });
  const l = Ye(jn, i, -a), c = r.map((h, d) => t.width * (1 - 0.14 * (d / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function tm(t, e, n = 1, s = 1) {
  const o = Math.min(1, Math.max(0, e)), i = Rn(Ni(Ns(Rn(he.out), 1 - o), Ns(Rn(he.across), o))), r = Rn(Di(jn, i)), a = Rn(Di(i, r)), l = [[he.base[0] * s, he.base[1], he.base[2]]];
  let c = 0;
  he.bones.forEach((u, f) => {
    f > 0 && (c += Se(Xg[f - 1] * t)), l.push(Ni(l[f], Ns(Ye(i, r, c), u)));
  });
  const h = Ye(a, r, c), d = [...he.widths, he.widths[he.widths.length - 1] * 0.92].map((u) => u * n);
  return { joints: l, back: h, widths: d };
}
function Bi(t, e = {}) {
  const n = { ...Pt, ...t }, s = e.size ?? 100, o = e.side ?? "right", i = o === "left" ? -1 : 1, r = Se(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (I) => ({
    ...I,
    knuckle: [I.knuckle[0] * c, I.knuckle[1], I.knuckle[2]],
    width: I.width * l
  }), d = Se(n.bend ?? 0), u = Se(n.tilt ?? 0), f = Se(90 * (n.turn ?? 0)), g = (I) => Ye(Ye(Ye(I, ll, -d), jn, -u), cl, f), p = Math.cos(r), m = Math.sin(r), b = Se(n.roll ?? 0), M = Math.cos(b), w = Math.sin(b), y = (I) => {
    const O = I[0] * s, _ = -I[1] * s, W = (O * M - _ * w) * i, B = O * w + _ * M;
    return { x: W * p - B * m, y: W * m + B * p };
  }, S = (I) => {
    const O = y(I), _ = Math.hypot(O.x, O.y);
    return _ > 1e-6 * s ? { x: O.x / _, y: O.y / _ } : { x: 0, y: 0 };
  }, E = {
    thumb: tm(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, A = a ? Kg : Yg;
  for (const I of zg) {
    const O = A[I];
    O && (E[I] = Qg(h(O), n[`${I}.curl`] ?? 0, n.spread ?? 0));
  }
  const v = {};
  for (const [I, O] of Object.entries(E)) {
    const _ = O.joints.map(g), W = g(O.back);
    v[I] = {
      points: _.map(y),
      depths: _.map((B) => B[2] * s),
      widths: O.widths.map((B) => B * s),
      nail: W[2],
      back: S(W)
    };
  }
  const k = Zg.flatMap(([I, O]) => [g([I * c, O, Vg]), g([I * c, O, Jg])]), x = nm(k.map(y)), P = k.reduce((I, O) => I + O[2], 0) / k.length * s;
  return {
    size: s,
    side: o,
    wrist: { x: 0, y: 0 },
    palm: x,
    palmDepth: P,
    palmFacing: -g(jn)[2],
    fingers: v,
    axes: { up: S(g(cl)), across: S(g(ll)), out: S(g(jn)) },
    curls: Object.fromEntries(Object.keys(v).map((I) => [I, n[`${I}.curl`] ?? 0]))
  };
}
function em(t, e) {
  const n = (o) => ({ x: o.x + e.x - t.wrist.x, y: o.y + e.y - t.wrist.y }), s = {};
  for (const [o, i] of Object.entries(t.fingers))
    s[o] = { ...i, points: i.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function nm(t) {
  const e = [...t].sort((i, r) => i.x - r.x || i.y - r.y);
  if (e.length < 3) return e;
  const n = (i, r, a) => (r.x - i.x) * (a.y - i.y) - (r.y - i.y) * (a.x - i.x), s = [];
  for (const i of e) {
    for (; s.length >= 2 && n(s[s.length - 2], s[s.length - 1], i) <= 0; ) s.pop();
    s.push(i);
  }
  const o = [];
  for (const i of [...e].reverse()) {
    for (; o.length >= 2 && n(o[o.length - 2], o[o.length - 1], i) <= 0; ) o.pop();
    o.push(i);
  }
  return [...s.slice(0, -1), ...o.slice(0, -1)];
}
const sm = "#f1c9a5", om = "#2f2f33";
function Or(t, e, n, s = {}, o = 0) {
  const i = em(Bi(n, s), e), r = s.ink ?? om, a = s.lineWidth ?? i.size * 0.035, l = s.pen ?? So(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: o,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? sm, h = s.nails ?? !0, d = [
    {
      depth: i.palmDepth,
      draw: () => im(l, i, c, a)
    }
  ];
  for (const u of Object.values(i.fingers)) {
    const f = u.depths.reduce((g, p) => g + p, 0) / u.depths.length;
    d.push({
      depth: f,
      draw: () => rm(t, l, u, c, a, h)
    });
  }
  if (s.prop) {
    const u = s.prop;
    d.push({ depth: u.depth, draw: () => u.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const u of [...d].sort((f, g) => f.depth - g.depth)) u.draw();
  return t.restore(), i;
}
function im(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: o } = e.axes;
    for (const [i, r] of Object.entries(e.fingers)) {
      const a = e.curls[i] ?? 0;
      if (i === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - o.x * c * 0.2, y: l.y - o.y * c * 0.2 }, d = Math.atan2(o.y, o.x), u = Array.from({ length: 7 }, (f, g) => {
        const p = d - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      t.line(u, s * 0.6);
    }
  }
  if (e.palmFacing > 0.45 && t.look !== "silhouette") {
    const { up: o, across: i } = e.axes, r = e.size, a = e.wrist, l = (h, d) => ({
      x: a.x + (i.x * h + o.x * d) * r,
      y: a.y + (i.y * h + o.y * d) * r
    }), c = e.side === "left" ? -1 : 1;
    t.line([l(-0.15 * c, 0.36), l(-0.04 * c, 0.3), l(0.1 * c, 0.33)], s * 0.5);
  }
}
function rm(t, e, n, s, o, i) {
  const { widths: r } = n, a = am(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], d = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + o * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * o, d + 2 * o), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, Ir(t, a, h, d)), e.look === "silhouette" || !i || n.nail < 0.25) return;
  const u = a[a.length - 2], f = lm({ x: c.x - u.x, y: c.y - u.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - f.x * d * 0.22 + n.back.x * d * 0.1,
    y: c.y - f.y * d * 0.22 + n.back.y * d * 0.1
  };
  e.ellipse(g.x, g.y, d * 0.24 * Math.max(0.35, n.nail), d * 0.19, Math.atan2(f.y, f.x), "#f8e3d3", o * 0.45);
}
function am(t, e) {
  let n = t;
  for (let s = 0; s < e; s++) {
    if (n.length < 3) return n;
    const o = [n[0]];
    for (let i = 0; i < n.length - 1; i++) {
      const r = n[i], a = n[i + 1];
      i > 0 && o.push({ x: r.x * 0.75 + a.x * 0.25, y: r.y * 0.75 + a.y * 0.25 }), i < n.length - 2 && o.push({ x: r.x * 0.25 + a.x * 0.75, y: r.y * 0.25 + a.y * 0.75 });
    }
    o.push(n[n.length - 1]), n = o;
  }
  return n;
}
const lm = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Ft = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, cm = 40;
function To(t) {
  return t === void 0 ? Ft.walk : typeof t == "string" ? Ft[t] ?? Ft.walk : t;
}
function hm(t, e, n = lt, s = 1) {
  const o = To(t);
  if (o === Ft.walk) return um(e, n, s);
  const i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (b) => Math.abs(b) <= cm, c = o.shoulder ?? 0, h = (b, M) => l(b) ? M * c + o.arm * r : b, d = o.forearm ?? 0, u = l(n.leftShoulder) ? n.leftElbow - d - o.elbow * Math.max(0, -r) : n.leftElbow, f = l(n.rightShoulder) ? n.rightElbow + d + o.elbow * Math.max(0, r) : n.rightElbow, g = o.bounces ?? 1, p = (1 + Math.cos(i * 2 * g)) / 2, m = o.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + o.lean * s + (o.sway ?? 0) * Math.sin(i) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (o.bend ?? 0),
    headTilt: n.headTilt - o.lean * 0.5 * s + (o.headTilt ?? 0),
    leftElbow: u,
    rightElbow: f,
    // A crouch brings both thighs forward and folds both shins back.
    leftHip: -o.swing * r - m * 0.5,
    rightHip: -o.swing * r + m * 0.5,
    // The leg swinging forward lifts its knee; a crouch keeps both bent. A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -o.knee * Math.max(0, a) - m,
    rightKnee: o.knee * Math.max(0, -a) + m,
    leftAnkle: (n.leftAnkle ?? 0) + (o.tiptoe ?? 0),
    rightAnkle: (n.rightAnkle ?? 0) + (o.tiptoe ?? 0),
    leftShoulder: h(n.leftShoulder, -1),
    rightShoulder: h(n.rightShoulder, 1),
    rise: (n.rise ?? 0) + (o.bounce ?? 0) * s * p,
    stretch: n.stretch * (1 + (o.squash ?? 0) * (p - 0.5))
  };
}
function qi(t, e, n = 1) {
  const s = To(t), o = Ft.walk.swing, i = (r) => Math.sin(r * Math.PI / 180);
  return fm(e, n) * i(s.swing * n) / i(o * n);
}
const lt = {
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
function _t(t) {
  return { ...lt, ...t };
}
const jh = {
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
}, Ot = (t) => ({ ...jh, ...t }), kt = {
  neutral: jh,
  happy: Ot({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: Ot({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: Ot({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: Ot({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: Ot({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: Ot({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: Ot({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: Ot({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: Ot({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: Ot({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: Ot({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: Ot({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: Ot({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: Ot({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: Ot({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: Ot({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: Ot({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function Le(t, e) {
  return { ...t, ...typeof e == "string" ? kt[e] : e };
}
const Vt = {
  rest: lt,
  wave: _t({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...kt.happy }),
  cheer: _t({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...kt.joyful }),
  shrug: _t({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...kt.confused, lookX: 0, lookY: 0 }),
  point: _t({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: _t({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...kt.thinking }),
  handsOnHips: _t({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: _t({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...kt.sad }),
  surprised: _t({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...kt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: _t({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: _t({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: _t({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...kt.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: _t({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...kt.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: _t({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...kt.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: _t({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...kt.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: _t({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...kt.happy })
}, Xh = Object.keys(lt);
function ss(t, e, n) {
  const s = { ...t };
  for (const o of Xh) s[o] = t[o] + (e[o] - t[o]) * n;
  return s;
}
const zi = 24, hl = 4, dl = 28, dm = 40;
function um(t, e = lt, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, o = Math.cos(t * Math.PI * 2) * n, i = (c) => Math.abs(c) <= dm, r = (c) => i(c) ? 22 * s : c, a = i(e.leftShoulder) ? e.leftElbow - dl * Math.max(0, -s) : e.leftElbow, l = i(e.rightShoulder) ? e.rightElbow + dl * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + hl * n,
    headTilt: e.headTilt - hl * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -zi * s,
    rightHip: -zi * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, o),
    rightKnee: 30 * Math.max(0, -o),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function fm(t, e = 1) {
  return 4 * ((Yi + no) * t) * Math.sin(zi * e * Math.PI / 180);
}
function pm(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const Uh = 0.12, ul = 0.46, gm = 1 - 2 * Uh, mm = 0.1, ym = 0.21, bm = 0.19, Yi = 0.24, no = 0.22, Gh = 0.12, wm = 0.14, Vh = 0.33, fl = 0.7, pl = 0.3, km = 0.35, vm = [1.7, 1.05], Mm = [1.3, 0.75], gl = [1.45, 0.85], xm = [1.15, 0.75], ml = 0.06, Sm = 0.7, Tm = 0.65, Jh = 0.075, Em = 0.3, Am = 0.02, $m = 0.012, Pm = 12, Im = 0.25, Ms = 90, Om = 0.25, _m = 0.04, Zh = 0.01, We = (t) => Math.min(1, Math.max(0, t ?? 0));
function Iv(t, e = 1) {
  return no * t * e;
}
const Ki = -0.12, Qh = 0.4, Ut = (t) => t * Math.PI / 180, Hm = (t, e) => ({ x: e * Math.sin(Ut(t)), y: Math.cos(Ut(t)) }), t0 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), e0 = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function Cm(t, e, n, s, o, i) {
  const r = Math.max(1, Math.min(i * 0.6, wm * n)), a = We(e.turn), l = (Gh + Vh * a) * n, c = s + Ki * n, h = l + e.lookX * 0.08 * n, d = e.lookY * 0.07 * n, u = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - fl * a), squeeze: 1 - fl * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - pl * a), squeeze: 1 - pl * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = o, t.strokeStyle = o, t.lineWidth = r;
  for (const b of u) {
    const M = t0(b.open, e.blink);
    if (M < 0.2) {
      const E = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(b.x + l - 0.12 * n, c), t.quadraticCurveTo(b.x + l, c + E, b.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (M > 1.2) {
        const A = 0.13 * n * M;
        t.beginPath(), t.ellipse(b.x + l, c, A * 0.85, A, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = o;
      }
      const E = M > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(b.x + h, c + d, E, E * 1.1 * Math.min(M, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const w = e0(c, n, b.brow, M), y = b.x + l - b.side * 0.13 * n * b.squeeze, S = b.x + l + b.side * 0.13 * n * b.squeeze;
    t.beginPath(), t.moveTo(S, w), t.lineTo(y, w - e.browTilt * 0.1 * n), t.stroke();
  }
  const f = s + Qh * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - km * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, f), t.quadraticCurveTo(l, f + e.smile * 0.25 * n, l + g, f), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, f - 0.05 * n), t.lineTo(l + g, f - 0.05 * n), t.quadraticCurveTo(l, f + m * 2, l - g, f - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, f + m * 0.6), t.lineTo(l + g, f + m * 0.6), t.quadraticCurveTo(l, f - m * 1.4, l - g, f + m * 0.6)) : t.ellipse(l, f, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function n0(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), o = Math.sqrt(s), i = (e.headSize ?? 2 * Uh) / 2, r = e.headSize === void 0 ? gm : 1 - 2 * i, a = i * n, l = We(t.sit), c = t.leftHip + (-Ms - t.leftHip) * l, h = t.leftKnee + (-Ms - t.leftKnee) * l, d = t.rightHip + (Ms - t.rightHip) * l, u = t.rightKnee + (Ms - t.rightKnee) * l, f = e.classic === !0, g = We(t.turn), p = (V, K, T, C, L) => {
    const $ = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Ut(K - T) / 2) + Ut(C))), R = Math.max(-1, Math.min(1, Sm + L)), N = g + (1 - g) * V * R;
    return f ? { x: 0, y: 0 } : { x: Math.cos($) * ml * N, y: Math.sin($) * ml };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, b = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let M = 0;
  if (l > 0 || !f) {
    const V = (L, $, R, N, q) => Yi * Math.cos(Ut($)) + no * Math.cos(Ut($ - R)) + Math.max(0, p(L, $, R, N, q).y), K = Math.max(
      V(-1, c, h, m.left, b.left),
      V(1, d, u, m.right, b.right)
    ), T = 1 - We((t.rise ?? 0) / _m), C = (f ? Math.min(1, l / Om) : 1) * T;
    M = (ul - K) * C * n * s;
  }
  const w = -ul * n * s + M, y = -r * n * s + M, S = f ? 0 : (Am * We(t.turn) + $m * l) * n * s, E = Ut(t.bend ?? 0), A = { end: bl(w, y, E, 1), bend: E };
  let v;
  if (E !== 0) {
    v = [];
    for (let V = 0; V <= yl; V++) {
      const K = V / yl, T = bl(w, y, E, K);
      v.push({ x: T.x - S * Math.sin(Math.PI * K), y: T.y });
    }
  } else
    v = S === 0 ? [{ x: 0, y: w }, { x: 0, y }] : Tn({ x: 0, y: w }, { x: -S, y: (w + y) / 2 }, { x: 0, y }, 1, 8);
  const k = y + mm * n * s, x = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), P = (V, K, T, C, L) => {
    const $ = Hm(T, C);
    return { x: V + $.x * L * n, y: K + $.y * L * n };
  }, I = (V, K, T) => {
    const C = P(0, w, K, V, Yi * s);
    return { root: { x: 0, y: w }, joint: C, end: P(C.x, C.y, K - T, V, no * s) };
  }, O = (V, K, T) => {
    const C = { x: V * x, y: k }, L = P(C.x, C.y, K, V, ym * o);
    return { root: C, joint: L, end: P(L.x, L.y, K + T, V, bm * o) };
  }, _ = { left: I(-1, c, h), right: I(1, d, u) }, W = (V, K, T, C, L, $) => {
    const R = p(V, T, C, L, $);
    return { x: K.end.x + R.x * n * s, y: K.end.y + R.y * n * s };
  }, B = (V, K, T, C, L) => P(K.end.x, K.end.y, T + C + L, V, Jh * o), j = {
    left: O(-1, t.leftShoulder, t.leftElbow),
    right: O(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(f ? 0 : Em, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: w,
    neckY: y,
    drop: M,
    lean: f ? t.lean : t.lean + Pm * Math.sin(Math.PI * l),
    classic: f,
    legs: _,
    toes: {
      left: W(-1, _.left, c, h, m.left, b.left),
      right: W(1, _.right, d, u, m.right, b.right)
    },
    spine: v,
    chest: A,
    arms: j,
    handTips: {
      left: B(-1, j.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: B(1, j.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const yl = 10;
function bl(t, e, n, s) {
  const o = t - e, i = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - o * s };
  const r = o / n;
  return { x: r * (1 - Math.cos(i)), y: t - r * Math.sin(i) };
}
function Rm(t, e) {
  if (t.chest.bend === 0) return e;
  const n = os(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const zn = (t, e) => e === 0 ? [t.root, t.joint, t.end] : Tn(t.root, t.joint, t.end, e);
function os(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = t.x - e.x, r = t.y - e.y;
  return { x: e.x + i * s - r * o, y: e.y + i * o + r * s };
}
function s0(t, e, n = !0) {
  const s = Wm(t, e), o = e.spin ?? 0, i = e.rise ?? 0;
  return n && (o !== 0 || i !== 0) ? Lm(s, t, o, i) : s;
}
function o0(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Ut(e), lift: n * t.height };
}
function Lm(t, e, n, s) {
  const { pivot: o, angle: i, lift: r } = o0(e, n, s), a = (u) => {
    const f = os(u, o, i);
    return { x: f.x, y: f.y - r };
  }, l = (u) => ({ left: a(u.left), right: a(u.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), d = Zh * e.height;
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
    grounded: { left: c.left >= h - d, right: c.right >= h - d },
    handAngle: { left: t.handAngle.left + i, right: t.handAngle.right + i },
    limbs: {
      leftArm: t.limbs.leftArm.map(a),
      rightArm: t.limbs.rightArm.map(a),
      leftLeg: t.limbs.leftLeg.map(a),
      rightLeg: t.limbs.rightLeg.map(a),
      spine: t.limbs.spine.map(a)
    },
    head: { ...t.head, center: a(t.head.center), angle: t.head.angle + i }
  };
}
function Wm(t, e) {
  const n = Ut(t.lean), s = Ut(e.headTilt), o = { x: 0, y: t.hipY }, i = (y) => ({ x: t.facing * y.x, y: y.y }), r = (y) => i(os(y, o, n)), a = (y) => r(Rm(t, y)), l = (y) => a(os({ x: y.x, y: y.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = zn(t.arms.left, t.rubber).map(a), h = zn(t.arms.right, t.rubber).map(a), d = (y, S) => Math.atan2(S.y - y.y, S.x - y.x), u = { left: a(t.handTips.left), right: a(t.handTips.right) }, f = (y, S) => {
    const [E, A] = y.slice(-2), v = t.arms[S], k = d(a(v.end), u[S]) - d(a(v.joint), a(v.end));
    return d(E, A) + k;
  };
  let g = 1 / 0;
  for (const [y, S] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const E = e0(Ki, 1, y, t0(S, e.blink));
    g = Math.min(g, E, E - e.browTilt * 0.1);
  }
  const p = { left: i(t.legs.left.end), right: i(t.legs.right.end) }, m = { left: i(t.toes.left), right: i(t.toes.right) }, b = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, M = Math.max(b.left, b.right), w = Zh * t.height;
  return {
    facing: t.facing,
    height: t.height,
    stretch: t.stretch,
    lineWidth: t.lineWidth,
    hip: o,
    neck: a({ x: 0, y: t.neckY }),
    shoulders: { left: a(t.arms.left.root), right: a(t.arms.right.root) },
    elbows: { left: a(t.arms.left.joint), right: a(t.arms.right.joint) },
    hands: { left: a(t.arms.left.end), right: a(t.arms.right.end) },
    knees: { left: i(t.legs.left.joint), right: i(t.legs.right.joint) },
    feet: p,
    toes: m,
    feetY: M,
    grounded: { left: b.left >= M - w, right: b.right >= M - w },
    fingertips: u,
    handAngle: { left: f(c, "left"), right: f(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: zn(t.legs.left, t.rubber).map(i),
      rightLeg: zn(t.legs.right, t.rubber).map(i),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: Ki,
      browTopY: g,
      mouthY: Qh,
      faceX: t.facing * (Gh + Vh * We(e.turn))
    }
  };
}
function ae(t, e = {}) {
  return s0(n0(t, e), t);
}
function Ov(t, e, n) {
  return os({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function Fm(t, e, n) {
  const s = (i) => ({ x: i.x + e, y: i.y + n }), o = (i) => ({ left: s(i.left), right: s(i.right) });
  return {
    ...t,
    hip: s(t.hip),
    neck: s(t.neck),
    shoulders: o(t.shoulders),
    elbows: o(t.elbows),
    hands: o(t.hands),
    fingertips: o(t.fingertips),
    knees: o(t.knees),
    feet: o(t.feet),
    toes: o(t.toes),
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
function Nm(t, e, n = {}, s = 0) {
  const o = n0(e, n), i = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? s0(o, e, !1) : void 0, l = n.sketch ? Fi(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Fi(t, n.sketch, s) : void 0, h = (A) => {
    t.save(), A(), t.restore();
  }, d = (A) => {
    A && a && h(() => A(t, a, s, c));
  }, u = () => t.scale(o.facing, 1), f = () => {
    u(), t.translate(0, o.hipY), t.rotate(Ut(o.lean)), t.translate(0, -o.hipY);
  }, g = () => {
    f(), o.chest.bend !== 0 && (t.translate(o.chest.end.x, o.chest.end.y), t.rotate(o.chest.bend), t.translate(0, -o.neckY));
  }, p = (A, v, k) => {
    if (l) return v ? l.curve(A) : l.line(A);
    if (o.classic) {
      t.beginPath(), t.moveTo(A[0].x, A[0].y);
      for (const x of A.slice(1)) t.lineTo(x.x, x.y);
      t.stroke();
      return;
    }
    Ir(t, A, k[0] * o.lineWidth, k[1] * o.lineWidth);
  }, m = (A, v) => p(zn(A, o.rubber), o.rubber > 0, v), b = (A) => {
    o.classic || p([o.legs[A].end, o.toes[A]], !1, xm);
  }, M = (A) => {
    if (n.hands && !o.classic) return y(A);
    if (o.classic || l) return;
    const v = o.arms[A].end;
    t.beginPath(), t.arc(v.x, v.y, Tm * o.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = i, t.fillStyle = i, t.lineWidth = o.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const w = o0(o, e.spin ?? 0, e.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (t.translate(0, -w.lift), t.translate(w.pivot.x, w.pivot.y), t.rotate(w.angle), t.translate(-w.pivot.x, -w.pivot.y));
  function y(A) {
    const v = n.hands ?? {}, k = o.arms[A].end, x = o.handTips[A], P = n.headFill ?? "#ffffff";
    Or(t, k, v[A] ?? Pt, {
      side: A,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(x.x - k.x, k.y - x.y) * 180 / Math.PI,
      size: (v.size ?? Jh) * o.height * Math.sqrt(o.stretch),
      skin: v.skin ?? (P === "none" ? void 0 : P),
      ink: i,
      lineWidth: o.lineWidth * 0.45,
      fingers: v.fingers,
      plump: v.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const S = (A) => {
    h(() => {
      g(), m(o.arms[A], Mm), M(A);
    });
    const v = r.sleeve;
    v && a && h(() => v(t, a, A, s, c));
  }, E = We(e.turn) > Im;
  d(r.behind), h(() => {
    u(), m(o.legs.left, gl), b("left"), m(o.legs.right, gl), b("right");
  }), E && S("left"), h(() => {
    f(), p(o.spine, o.spine.length > 2, vm);
  }), h(() => {
    g();
    const { left: A, right: v } = { left: o.arms.left.root, right: o.arms.right.root };
    if (A.x !== v.x)
      if (o.classic) p([A, v], !1, [1, 1]);
      else {
        const k = { x: (A.x + v.x) / 2, y: A.y - 0.3 * Math.abs(v.x - A.x) };
        p(Tn(A, k, v, 1, 8), !0, [1.1, 1.1]);
      }
  }), d(r.body), E || S("left"), S("right"), d(r.behindHead), h(() => {
    g(), t.translate(0, o.neckY), t.rotate(Ut(e.headTilt));
    const A = -o.headRy;
    t.beginPath(), t.ellipse(0, A, o.headRx, o.headRy, 0, 0, Math.PI * 2);
    const v = n.headFill ?? "#ffffff";
    if (v !== "none" && (t.fillStyle = v, t.fill()), l) {
      l.ellipse(0, A, o.headRx, o.headRy);
      const k = l.nudge();
      t.translate(k.x, k.y);
    } else
      t.stroke();
    t.translate(0, A), t.scale(o.headRx / o.r, o.headRy / o.r), Cm(t, e, o.r, 0, i, o.lineWidth);
  }), d(r.overHead), d(r.front), t.restore(), n.label && (t.save(), t.fillStyle = i, t.font = n.labelFont ?? `700 ${Math.round(o.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -o.height * o.stretch - 0.04 * o.height + o.drop), t.restore());
}
function i0(t, e, n, s) {
  const o = { ...t }, i = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? ss(o, hm(i, t.walk, o), t.walking) : o, a = Bm(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = ss(r, c.pose, l), c.hands) {
      const h = (d, u) => u ? ns(d ?? Pt, u, l) : d;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * pm(e)) }), { pose: r, hands: a };
}
function Dm(t, e, n, s) {
  return i0(t, e, n, s).pose;
}
const r0 = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, so = (t, e) => `hand.${t}.${e}`;
function Bm(t) {
  const e = (o) => {
    if (typeof t[so(o, "spread")] == "number")
      return Object.fromEntries(Object.keys(Pt).map((i) => [i, t[so(o, i)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function qm(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function a0(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, o = { ..._t(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, i = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? Pt;
      for (const l of Object.keys(Pt)) i[so(r, l)] = a[l] ?? Pt[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...o, ...i },
    about: zm(Object.keys(i), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = i0(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), Nm(r, h.pose, qm({ ...e, rubber: c.rubber, facing: r0(c, e) }, h.hands), l);
    }
  };
}
function zm(t, e) {
  const n = { ...Bh, ...qh };
  for (const s of t) {
    const [, o, ...i] = s.split("."), r = zh[i.join(".")];
    r && (n[s] = { ...r, description: `${o === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return Rg(e);
    }
  };
}
function l0(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (o.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? i = h : c === "y" || c === "motionPathY" ? r = h : c in o && (o[c] = h));
  const a = Dm(o, e.time, t.figureDance, t.figureGaits), l = ae(a, { ...s, rubber: o.rubber, facing: r0(o, s) });
  return { pose: a, joints: Fm(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function _r(t) {
  const e = [];
  return t.forEach((n, s) => {
    const o = s === 0 ? lt : e[s - 1], i = typeof n.pose == "string" ? Vt[n.pose] : { ...o, ...n.pose };
    e.push(n.expression ? Le(i, n.expression) : i);
  }), e;
}
function _v(t, e) {
  const n = _r(e);
  return Xh.filter((s) => n.some((o) => o[s] !== lt[s])).map((s) => ({
    id: `${t}-${s}`,
    target: t,
    property: s,
    keyframes: e.map((o, i) => ({
      time: o.time,
      value: n[i][s],
      ...o.easing ? { easing: o.easing } : {}
    }))
  }));
}
const Jo = 0.5, ji = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: $t({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: $t({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: $t({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: Ht.fist,
  /** Fist, thumb up */
  shikhara: Ht.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: $t({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: $t({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function oo(t) {
  return typeof t != "string" ? t : t in ji ? ji[t] : Ht[t];
}
function c0(t, e, n) {
  const s = [];
  for (const o of t.keys) {
    const i = s[s.length - 1], r = !i || o.reset ? { pose: e, ...n } : i;
    s.push({
      beat: o.beat,
      pose: { ...r.pose, ...o.pose },
      left: o.hands?.left ? oo(o.hands.left) : r.left,
      right: o.hands?.right ? oo(o.hands.right) : r.right,
      easing: o.easing ?? t.easing
    });
  }
  return s;
}
const Hr = (t, e) => (t % e + e) % e;
function Ym(t, e, n, s) {
  const o = c0(t, n, s);
  if (o.length === 0) return { pose: n, hands: s };
  const i = Hr(e, t.beats);
  let r = o.length - 1;
  for (let f = 0; f < o.length; f++) o[f].beat <= i && (r = f);
  const a = o[r], l = o[(r + 1) % o.length], c = a.beat <= i ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, d = h > c ? (i - c) / (h - c) : 0, u = Rt(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, d)));
  return {
    pose: ss(a.pose, l.pose, u),
    hands: { left: ns(a.left, l.left, u), right: ns(a.right, l.right, u) }
  };
}
const Km = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], jm = ["lean", "headTilt", "lookX", "spin"], Xm = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function Um(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, o] of Km) {
    const i = n && Xm.has(s) ? -1 : 1;
    e[s] = i * t[o], e[o] = i * t[s];
  }
  if (!n) for (const s of jm) e[s] = -t[s];
  return e;
}
const Gm = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function Vm(t, e, n) {
  const s = Hr(n, 1), o = (1 + Math.cos(2 * Math.PI * s)) / 2, i = e.bounce * (e.accent === "up" ? 1 - o : o), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = Gm(r);
  return {
    ...t,
    leftHip: t.leftHip + a * i / 2,
    rightHip: t.rightHip + i / 2,
    leftKnee: t.leftKnee + a * i,
    rightKnee: t.rightKnee + i,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function Xi(t) {
  const e = { ...lt, ...t.stance };
  return t.expression ? Le(e, t.expression) : e;
}
function h0(t) {
  return {
    left: t.hands?.left ? oo(t.hands.left) : Pt,
    right: t.hands?.right ? oo(t.hands.right) : Pt
  };
}
function Zo(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const o = Ym(s, n, Xi(t), h0(t));
  return e.mirror ? { pose: Um(o.pose), hands: { left: o.hands?.right, right: o.hands?.left } } : o;
}
function Cr(t, e, n = {}) {
  const s = typeof t == "string" ? Je[t] : t;
  let o;
  if (n.move)
    o = Zo(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const i = s.routine, r = i.reduce((d, u) => d + u.beats, 0), a = Hr(e, r);
    let l = 0, c = 0;
    for (; c < i.length - 1 && a >= l + i[c].beats; ) l += i[c++].beats;
    const h = a - l;
    if (o = Zo(s, i[c], h), h < Jo && i.length > 1 && e >= Jo) {
      const d = i[(c - 1 + i.length) % i.length], u = Zo(s, d, d.beats + h), f = Rt("ease-in-out")(h / Jo);
      o = {
        pose: ss(u.pose, o.pose, f),
        hands: { left: ns(u.hands.left, o.hands.left, f), right: ns(u.hands.right, o.hands.right, f) }
      };
    }
  }
  return { ...o, pose: Vm(o.pose, s.groove, e) };
}
function Hv(t, e, n = {}) {
  return Cr(t, e, n).pose;
}
function Rr(t) {
  return (typeof t == "string" ? Je[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const Jm = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function wl(t, e, n, s, o, i, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < i || h >= r))
        for (const d of l.taps ?? []) o.push({ beat: h, tap: s ? Jm[d] : d });
    }
}
function Cv(t, e, n, s = {}) {
  const o = typeof t == "string" ? Je[t] : t, i = [];
  if (n <= e) return i;
  if (s.move) {
    const r = o.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    wl(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, i, e, n);
  } else {
    const r = Rr(o);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of o.routine)
        wl(o.moves[c.move], l, c.beats, c.mirror, i, e, n), l += c.beats;
    }
  }
  return i.sort((r, a) => r.beat - a.beat);
}
function kl(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (c0(n, Xi(t), h0(t))[0]?.pose.turn ?? Xi(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function d0(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function Qo(t, e, n = {}) {
  const s = typeof t == "string" ? Je[t] : t, o = d0(s, n), i = o.reduce((h, d) => h + d.beats, 0), r = o.reduce((h, d) => h + kl(s, d) * d.beats, 0), a = Math.floor(e / i);
  let l = a * r, c = e - a * i;
  for (const h of o) {
    const d = Math.min(h.beats, c);
    if (l += kl(s, h) * d, c -= d, c <= 0) break;
  }
  return l;
}
function Zm(t, e, n) {
  const s = d0(t, n), o = [0];
  let i = 0;
  for (let r = 0; i < e; r = (r + 1) % s.length)
    i += s[r].beats, o.push(Math.min(i, e));
  return o;
}
const Qm = 8;
function t1(t, e, n) {
  const s = typeof e == "string" ? Je[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : Rr(s)), r = Zm(s, i, n);
  if (r.every((b) => Qo(s, b, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, i / 2), l = Rt("ease-in-out"), c = (b) => a <= 0 ? 1 : Math.min(l(Math.min(1, b / a)), l(Math.min(1, (i - b) / a))), h = Math.ceil(a * Qm), d = a <= 0 ? [] : Array.from({ length: h + 1 }, (b, M) => [M / h * a, i - M / h * a]).flat(), u = [.../* @__PURE__ */ new Set([...r, ...d])].sort((b, M) => b - M);
  let f = 0;
  const g = u.map((b, M) => {
    if (M > 0) {
      const w = u[M - 1], y = Math.max(1, Math.ceil((b - w) * 16));
      for (let S = 0; S < y; S++) {
        const E = w + (b - w) * S / y, A = w + (b - w) * (S + 1) / y;
        f += (Qo(s, A, n) - Qo(s, E, n)) * c((E + A) / 2);
      }
    }
    return { beat: b, travel: f };
  }), p = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((b) => ({ time: p + b.beat * 6e4 / o, value: m + n.height * b.travel, easing: "linear" }))
  };
}
function Rv(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function Lv(t, e = {}) {
  return (n) => Cr(t, n, e);
}
function Wv(t, e) {
  const n = e.start ?? 0, s = 6e4 / e.bpm, o = n + e.beats * s, i = Math.min((e.fade ?? 1) * s, (o - n) / 2);
  return [
    {
      id: `${t}-beat`,
      target: t,
      property: "beat",
      keyframes: [
        { time: n, value: 0 },
        { time: o, value: e.beats, easing: "linear" }
      ]
    },
    {
      id: `${t}-dancing`,
      target: t,
      property: "dancing",
      keyframes: [
        { time: n, value: 0 },
        { time: n + i, value: 1, easing: "ease-in-out" },
        { time: o - i, value: 1 },
        { time: o, value: 0, easing: "ease-in-out" }
      ]
    }
  ];
}
function Fv(t, e, n = {}) {
  const s = typeof e == "string" ? Je[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : Rr(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(i * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const b = m / r;
    return { time: a + b * 6e4 / o, frame: Cr(s, b, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((b) => ({ time: b.time, value: m(b.frame) }))
  }), u = Object.keys(lt).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== lt[p]).map((p) => h(p, (m) => m.pose[p])), f = n.height === void 0 ? void 0 : t1(t, s, { ...n, bpm: o, beats: i, start: a, height: n.height, fade: 0 });
  if (f && u.push(f), n.hands === !1) return u;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys(Pt)) {
      const b = (M) => M.hands?.[p]?.[m] ?? Pt[m];
      c.some((M) => b(M.frame) !== Pt[m]) && g.push(h(so(p, m), b));
    }
  return [...u, ...g];
}
const Xn = { type: "back", mode: "out", overshoot: 1.1 }, Wt = "ease-out-cubic", e1 = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: Wt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Wt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Wt },
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
}, n1 = {
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
}, s1 = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: Wt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: Wt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: Wt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: Xn },
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
}, o1 = {
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
        hands: e === 0 ? { left: { ...Ht.spread, turn: 2 }, right: { ...Ht.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: Wt },
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
}, i1 = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: Xn,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: Xn },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: Xn },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: Wt,
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
}, r1 = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...Ht.cupped, roll: -30 }, left: { ...Ht.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Ht.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...Ht.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Ht.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Ht.open, turn: 2 } }, easing: Wt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: Wt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: Wt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: Wt }
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
}, a1 = {
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
}, l1 = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, c1 = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...l1, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, h1 = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...Ht.spread, turn: 2 }, right: { ...Ht.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: Wt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: Wt },
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
}, d1 = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...Ht.spread, turn: 2 }, right: { ...Ht.spread, turn: 2 } } },
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
}, u1 = {
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
          easing: Xn
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
}, Je = {
  disco: e1,
  hipHop: n1,
  breaking: s1,
  jazz: o1,
  kpop: i1,
  bollywood: r1,
  bhangra: a1,
  bharatanatyam: c1,
  charleston: h1,
  tap: d1,
  popping: u1
}, io = (t) => Math.min(1, Math.max(0, t));
function f1(t) {
  const e = { ...lt, turn: t.view }, n = [];
  for (const s of t.keys) {
    const o = n[n.length - 1], i = !o || s.reset ? e : o.pose;
    n.push({ at: s.at, pose: { ...i, ...s.pose }, easing: s.easing });
  }
  return n;
}
function p1(t) {
  return t - g1 * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const g1 = 0.5;
function m1(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function y1(t, e) {
  const n = typeof t == "string" ? Eo[t] : t, s = f1(n), o = io(e);
  let i = 0;
  for (let d = 0; d < s.length; d++) s[d].at <= o && (i = d);
  const r = s[i], a = s[Math.min(i + 1, s.length - 1)], l = a.at > r.at ? (o - r.at) / (a.at - r.at) : 0, c = ss(r.pose, a.pose, Rt(a.easing ?? "ease-in-out")(io(l))), h = m1(n, o);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * p1(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function b1(t, e, n) {
  const s = typeof t == "string" ? Eo[t] : t, o = io(e), i = io((o - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * i;
}
function Nv(t, e, n = {}) {
  const s = typeof e == "string" ? Eo[e] : e, o = n.start ?? 0, i = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, d) => {
    const u = d / r;
    return { time: o + u * i, progress: u, pose: y1(s, u) };
  }), c = Object.keys(lt).filter((h) => a.some((d) => d.pose[h] !== lt[h])).map((h) => ({
    id: `${t}-${h}`,
    target: t,
    property: h,
    keyframes: a.map((d) => ({ time: d.time, value: d.pose[h] }))
  }));
  if (n.height !== void 0 && s.travel !== 0) {
    const h = (n.facing ?? 1) < 0 ? -1 : 1;
    c.push({
      id: `${t}-x`,
      target: t,
      property: "x",
      keyframes: a.map((d) => ({ time: d.time, value: (n.x ?? 0) + h * b1(s, d.progress, n.height) }))
    });
  }
  return c;
}
const w1 = {
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
}, k1 = {
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
}, xs = {
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
}, v1 = {
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
}, M1 = {
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
function en(t, e, n, s, o, i = 1300) {
  return {
    label: t,
    view: 1,
    spin: e,
    height: n,
    travel: s,
    takeoff: 0.27,
    landing: 0.8,
    duration: i,
    keys: [
      { at: 0, reset: !0 },
      { at: 0.16, pose: w1 },
      { at: 0.27, pose: k1, easing: "ease-out-quad" },
      ...o,
      { at: 0.76, pose: v1 },
      { at: 0.86, pose: M1, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const Eo = {
  frontFlip: en("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: xs, easing: "ease-out-cubic" },
    { at: 0.64, pose: xs }
  ]),
  backFlip: en("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...xs, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...xs, lean: 18 } }
  ]),
  layout: en("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: en("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: en("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: en("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, Ui = {
  standard: {},
  slim: { headSize: 0.24, shoulderWidth: 0.05, hipWidth: 0.02 },
  tall: { headSize: 0.25, legLength: 1.1, armLength: 1.05 },
  short: { headSize: 0.33, legLength: 0.92, shoulderWidth: 0.065, hipWidth: 0.03 },
  broad: { shoulderWidth: 0.11, hipWidth: 0.04 },
  curvy: { shoulderWidth: 0.055, hipWidth: 0.065 },
  stocky: { headSize: 0.34, shoulderWidth: 0.1, hipWidth: 0.06 },
  kid: { headSize: 0.42 },
  child: { headSize: 0.4, legLength: 0.88, armLength: 0.9, shoulderWidth: 0.05, hipWidth: 0.02 },
  toddler: { headSize: 0.46, legLength: 0.78, armLength: 0.82, shoulderWidth: 0.05, hipWidth: 0.025 }
}, ti = 0.215, ei = 0.205, x1 = 0.065, vl = 0.035, S1 = 0.165, T1 = 0.155, E1 = 12, A1 = 0.3, $1 = 0.7, P1 = 0.35, I1 = (t) => t * Math.PI / 180, pt = {
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
  lookY: 0,
  blush: 0,
  tears: 0,
  sweat: 0,
  "hair.swing": 0,
  "hair.trail": 0,
  "hair.lift": 0,
  "held.left": 1,
  "held.right": 1,
  "held.both": 1
};
function bt(t = {}) {
  return { ...pt, ...t };
}
const O1 = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX", "hair.swing"]);
function _1(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const o = n.replace(/(^|\.)(left|right)(\.|$)/, (i, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[o] = O1.has(n) ? -s : s;
  }
  return e;
}
function Mt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}
const ce = {
  rest: pt,
  wave: bt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: bt({ ...Mt("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: bt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: bt({ ...Mt("arm", { spread: 50, bend: -105, elbow: 0 }), ...Mt("leg", { spread: 9 }), smile: 0.8 }),
  think: bt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: bt({ ...Mt("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: bt({ ...Mt("leg", { swing: 90, knee: 90, spread: 4 }), ...Mt("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: bt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...Mt("arm", { swing: 20, elbow: 30 })
  }),
  crouch: bt({ ...Mt("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...Mt("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: bt({ lean: 82, "head.nod": -35, ...Mt("arm", { swing: 80, elbow: 0, spread: 4 }), ...Mt("leg", { knee: 92, ankle: -88 }) }),
  lieDown: bt({ roll: 90, ...Mt("arm", { spread: 8 }), "head.nod": 0 }),
  // Everyday actions (the motion and everyday-life reference sheets). Hands that hold
  // something are where its grip goes: see `holding` and `handGrip`.
  sleep: bt({ roll: 90, ...Mt("arm", { spread: 8, swing: 20, elbow: 40 }), "leg.left.knee": 20, "leg.left.swing": 15, blink: 1, smile: 0.2 }),
  stretch: bt({ side: -16, "arm.left.spread": 165, "arm.left.bend": 35, "arm.left.elbow": 0, "arm.right.spread": 40, "arm.right.bend": -110, "arm.right.elbow": 0, "head.tilt": -10, "eye.left": 0, "eye.right": 0, smile: 0.4 }),
  sitFloor: bt({ ...Mt("leg", { swing: 80, spread: 22, rotate: 75, knee: 145 }), ...Mt("arm", { swing: 25, spread: 18, elbow: 30 }), lean: 5, smile: 0.5 }),
  carry: bt({ ...Mt("arm", { spread: 16, elbow: 4 }), lean: -3, smile: 0.4 }),
  cane: bt({ "arm.right.swing": 16, "arm.right.spread": 10, "arm.right.elbow": 0, "arm.right.bend": 0, "arm.left.swing": 2, side: -3, lean: 4, "leg.right.swing": 4, smile: 0.3 }),
  lift: bt({ ...Mt("arm", { swing: 28, spread: 24, elbow: 85, bend: -45 }), ...Mt("leg", { swing: 12, knee: 22, spread: 6 }), lean: -4, smile: 0.2 }),
  push: bt({ lean: 28, ...Mt("arm", { swing: 82, spread: 12, elbow: 18 }), "leg.left.swing": 28, "leg.left.knee": 30, "leg.right.swing": -28, "leg.right.knee": 6, "head.nod": -20, browTilt: -0.6, smile: -0.2 }),
  pull: bt({ lean: -22, ...Mt("arm", { swing: 70, spread: 6, elbow: 0 }), "leg.left.swing": 32, "leg.left.knee": 8, "leg.right.swing": -8, "leg.right.knee": 34, "head.nod": 12, browTilt: -0.6, smile: -0.2 }),
  drink: bt({ "arm.right.swing": 85, "arm.right.spread": 8, "arm.right.elbow": 120, "arm.right.bend": 0, "head.nod": -14, "eye.left": 0.5, "eye.right": 0.5, smile: 0 }),
  phone: bt({ "arm.right.swing": 80, "arm.right.spread": 8, "arm.right.elbow": 80, "arm.right.bend": -10, "head.nod": 18, lookY: 0.7, lookX: -0.3, smile: 0.4 }),
  read: bt({ ...Mt("arm", { swing: 32, spread: 10, elbow: 82, bend: -28 }), "head.nod": 22, lookY: 0.8, smile: 0.2 }),
  type: bt({ ...Mt("leg", { swing: 90, knee: 90, spread: 4 }), ...Mt("arm", { swing: 40, spread: 10, elbow: 55, bend: -20 }), lean: 8, "head.nod": 10, lookY: 0.5, smile: 0 })
}, H1 = ["round", "flat", "pointed", "big"], C1 = {
  round: { length: 1, width: [0.95, 0.7] },
  flat: { length: 1.12, width: [0.85, 0.85] },
  pointed: { length: 1.25, width: [1, 0.3] },
  big: { length: 1.5, width: [1.25, 1.1] }
};
function R1(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, o = t.legLength ?? 1, i = t.armLength ?? 1, r = C1[t.feet ?? "round"], a = Math.max(0.12, 1 - e - vl - (ti + ei) * o), l = (d) => ({
    id: `arm.${d}`,
    parent: "spine",
    offset: [(d === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: d === "left" ? 1 : -1,
    bones: [
      { length: S1 * i, width: [1.25, 0.9] },
      { length: T1 * i, width: [0.9, 0.75] }
    ]
  }), c = (d) => ({
    id: `leg.${d}`,
    parent: null,
    offset: [(d === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: d === "left" ? 1 : -1,
    bones: [
      { length: ti * o, width: [1.45, 1.05] },
      { length: ei * o, width: [1.05, 0.85] },
      { length: x1 * Math.sqrt(o) * r.length, width: r.width }
    ]
  }), h = (d, u) => d[u] ?? pt[u] ?? 0;
  return {
    id: "human",
    hipHeight: (ti + ei) * o,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      c("left"),
      c("right"),
      {
        id: "spine",
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: a / 2, width: [1.7, 1.4] },
          { length: a / 2, width: [1.4, 1.1] }
        ]
      },
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: vl, width: [1, 0.9] }] },
      l("left"),
      l("right")
    ],
    head: { on: "neck", size: e },
    contacts: [
      ...["left", "right"].flatMap((d) => [
        { chain: `leg.${d}`, joint: 1 },
        { chain: `leg.${d}`, joint: 2 },
        { chain: `leg.${d}`, joint: 3 },
        { chain: `arm.${d}`, joint: 1 },
        { chain: `arm.${d}`, joint: 2 }
      ]),
      { chain: "spine", joint: 0 },
      { chain: "spine", joint: 1 },
      { chain: "spine", joint: 2 },
      { head: "top" }
    ],
    angles(d, u) {
      if (u.id === "spine") {
        const M = -h(d, "lean") / 2, w = h(d, "side") / 2, y = -h(d, "bend");
        return [
          { swing: M + y * A1, spread: w },
          { swing: M + y * $1, spread: w }
        ];
      }
      if (u.id === "neck") return [{ swing: -h(d, "bend") * P1, spread: 0 }];
      const [f, g] = u.id.split("."), p = (M) => h(d, `${f}.${g}.${M}`);
      if (f === "arm")
        return [
          { swing: p("swing"), spread: p("spread") },
          { swing: p("elbow"), spread: p("bend") }
        ];
      const m = (u.side ?? 1) * p("rotate"), b = 1 - Math.cos(I1(p("rotate")));
      return [
        { swing: p("swing"), spread: p("spread"), yaw: m },
        { swing: -p("knee"), spread: 0, yaw: m },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + p("ankle") - b * (p("swing") - p("knee")), spread: 0, yaw: (E1 + p("toeOut")) * (u.side ?? 1) }
      ];
    },
    withAngles(d, u, f) {
      const [g, p] = u.id.split("."), m = (b) => `${g}.${p}.${b}`;
      return g === "arm" ? {
        ...d,
        [m("swing")]: f[0].swing,
        [m("spread")]: f[0].spread,
        [m("elbow")]: f[1].swing,
        [m("bend")]: f[1].spread
      } : g === "leg" ? { ...d, [m("swing")]: f[0].swing, [m("spread")]: f[0].spread, [m("knee")]: -f[1].swing } : d;
    },
    boneScale(d, u) {
      const f = Math.min(3, Math.max(0.3, h(d, "stretch")));
      return u?.id.startsWith("arm.") ? Math.sqrt(f) : f;
    },
    headPose(d) {
      const u = Math.min(3, Math.max(0.3, h(d, "stretch")));
      return {
        yaw: h(d, "head.turn"),
        nod: h(d, "head.nod"),
        tilt: h(d, "head.tilt"),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(u),
        sy: Math.sqrt(u)
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
function Dv(t) {
  const e = t.split(".");
  if (e[0] === "hand" && e.length >= 3) {
    const s = `${e[1] === "left" ? "Left" : "Right"} hand`, o = { spread: "finger spread", turn: "wrist turn", bend: "wrist bend", tilt: "wrist tilt", roll: "roll" }, i = e.slice(2).join(".");
    return `${s} · ${o[i] ?? i.replace(".curl", " curl").replace(".across", " across")}`;
  }
  if (e.length === 3) {
    const [s, o, i] = e;
    return `${`${o === "left" ? "Left" : "Right"} ${s}`} · ${{
      swing: "forward / back",
      spread: "out / in",
      elbow: "elbow bend",
      bend: "forearm out / in",
      knee: "knee bend",
      ankle: "foot tilt",
      toeOut: "toes out / in",
      rotate: "turn out at the hip"
    }[i] ?? i}`;
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
    lookY: "Look up / down",
    blush: "Blush",
    tears: "Tears",
    sweat: "Sweat",
    "hair.swing": "Hair · swing",
    "hair.trail": "Hair · trail",
    "hair.lift": "Hair · lift",
    "held.left": "Left hand · holding",
    "held.right": "Right hand · holding",
    "held.both": "Both hands · holding"
  }[t] ?? t;
}
const L1 = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, W1 = { blush: 0, tears: 0, sweat: 0 }, fs = Object.fromEntries(
  Object.entries(kt).map(([t, e]) => [
    t,
    { ...Object.fromEntries(Object.entries(e).map(([n, s]) => [L1[n] ?? n, s])), ...W1 }
  ])
);
fs.crying.tears = 1;
fs.scared.sweat = 0.8;
fs.worried.sweat = 0.6;
const Yt = (t) => ({ ...fs.neutral, ...t }), u0 = {
  ...fs,
  laughing: Yt({ mouth: 0.75, smile: 1, mouthWidth: 1.25, "eye.left": 0, "eye.right": 0, "brow.left": 0.5, "brow.right": 0.5 }),
  afraid: Yt({ mouth: 0.4, smile: -0.6, mouthWidth: 0.9, "eye.left": 1.3, "eye.right": 1.3, "brow.left": 0.6, "brow.right": 0.6, browTilt: 1, sweat: 1 }),
  bored: Yt({ smile: -0.05, mouthWidth: 0.6, "eye.left": 0.45, "eye.right": 0.45, "brow.left": -0.4, "brow.right": -0.4, lookX: 0.5 }),
  tired: Yt({ mouth: 0.2, smile: -0.3, mouthWidth: 0.7, "eye.left": 0.3, "eye.right": 0.3, "brow.left": -0.1, "brow.right": -0.1, browTilt: 0.6, lookY: 0.6 }),
  embarrassed: Yt({ smile: 0.4, mouthWidth: 0.7, "eye.left": 0.9, "eye.right": 0.9, browTilt: 0.7, "brow.left": 0.2, "brow.right": 0.2, lookX: -0.6, lookY: 0.5, blush: 1 }),
  proud: Yt({ smile: 0.75, mouthWidth: 1, "eye.left": 0.75, "eye.right": 0.75, "brow.left": 0.5, "brow.right": 0.5, lookY: -0.2 }),
  determined: Yt({ smile: 0.35, mouthWidth: 0.8, "eye.left": 0.85, "eye.right": 0.85, "brow.left": -0.5, "brow.right": -0.5, browTilt: -0.9 }),
  affectionate: Yt({ smile: 0.85, "eye.left": 0, "eye.right": 0, "brow.left": 0.3, "brow.right": 0.3, blush: 0.8 }),
  hurt: Yt({ smile: -0.7, mouthWidth: 0.8, "eye.left": 1.1, "eye.right": 1.1, "brow.left": 0.2, "brow.right": 0.2, browTilt: 1, lookY: 0.3, tears: 0.35 }),
  suspicious: Yt({ smile: -0.25, mouthWidth: 0.7, "eye.left": 0.5, "eye.right": 0.85, "brow.left": -0.6, "brow.right": 0.4, browTilt: -0.3, lookX: 0.8 }),
  relieved: Yt({ smile: 0.7, "eye.left": 0, "eye.right": 0, "brow.left": 0.4, "brow.right": 0.4, browTilt: 0.4 }),
  excited: Yt({ mouth: 0.6, smile: 1, mouthWidth: 1.1, "eye.left": 1.4, "eye.right": 1.4, "brow.left": 0.9, "brow.right": 0.9, blush: 0.4 })
};
function F1(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, o = { ...pt, turn: n }, i = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of i) {
    const h = t[`${a}Shoulder`], d = t[`${a}Elbow`];
    o[`arm.${l}.spread`] = h * s, o[`arm.${l}.swing`] = c * h * n, o[`arm.${l}.bend`] = d * s, o[`arm.${l}.elbow`] = c * d * n;
    const u = t[`${a}Hip`], f = t[`${a}Knee`], g = s + c * n;
    o[`leg.${l}.rotate`] = 90 * s, o[`leg.${l}.spread`] = 0, o[`leg.${l}.swing`] = u * g, o[`leg.${l}.knee`] = f * g, o[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), o[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * N1, o[`eye.${l}`] = t[`${a}Eye`], o[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(o, D1(l, e[a] ?? Pt, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  o.lean = t.lean * n, o.bend = r * n, o.side = (t.lean + r * 0.5) * s, o["head.tilt"] = (t.headTilt + r * 0.5) * s, o["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) o[a] = t[a];
  return o.lift = t.rise ?? 0, o.roll = t.spin ?? 0, o;
}
const N1 = 70;
function D1(t, e, n, s) {
  const o = t === "right" ? 1 - s : 1 + s, i = {};
  for (const r of Object.keys(Pt)) i[`hand.${t}.${r}`] = e[r] ?? Pt[r];
  return i[`hand.${t}.turn`] = (e.turn ?? 0) - o, i[`hand.${t}.roll`] = (e.roll ?? 0) + n, i;
}
const ee = (t) => t * Math.PI / 180;
function Lr([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t, e * o + n * i, -e * i + n * o];
}
function Wr([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - e * i, t * i + e * o, n];
}
function Ie([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o + n * i, e, -t * i + n * o];
}
const $e = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], ro = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Ds = (t, e) => Wr(Lr(t, e.swing), e.spread);
function ni(t, e) {
  const n = Ie(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Fr(t, e, n) {
  const s = n, i = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const b = p.at ?? (m ? m.joints3.length - 1 : 0), M = m ? m.joints3[b] : i, w = m ? m.frames[Math.max(0, b - 1)] : { swing: 0, spread: 0 }, y = p.offset ? $e(M, Ds(ro(p.offset, s), w)) : M, S = p.side ?? 1, E = t.boneScale?.(e, p) ?? 1, A = t.angles(e, p), v = [y], k = [];
    let x = w.swing, P = w.spread;
    p.bones.forEach((I, O) => {
      const _ = A[O] ?? { swing: 0, spread: 0 };
      x += ee(_.swing), P += ee(_.spread) * S, k.push({ swing: x, spread: P });
      const W = Ie(Ds(p.rest, { swing: x, spread: P }), ee(_.yaw ?? 0));
      v.push($e(v[O], ro(W, I.length * s * E)));
    }), r[p.id] = { joints3: v, frames: k };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, d = h * l.sx, u = h * l.sy, f = (p) => Ds(Ie(Lr(Wr(p, -ee(l.tilt)), -ee(l.nod)), ee(l.yaw)), c), g = $e(a.joints3[a.joints3.length - 1], f([0, u, 0]));
  return { height: s, root: i, chains: r, head: { center: g, rx: d, ry: u, toBody: f } };
}
function Nr(t, e, n) {
  const s = n.height, o = ee(90 * (e.turn ?? 0)), i = Fr(t, e, s), { root: r } = i, a = i.chains, { rx: l, ry: c } = i.head, h = i.head.toBody, d = i.head.center, u = {};
  for (const k of t.chains) {
    const { joints3: x, frames: P } = a[k.id], I = x.map((O) => ni(O, o));
    u[k.id] = {
      id: k.id,
      joints3: x,
      frames: P,
      points: I.map((O) => O.point),
      depths: I.map((O) => O.depth)
    };
  }
  const f = ni(d, o), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((k) => Ie(h(k), o)), p = ni(r, o).point, m = ee(e.roll ?? 0), b = (k) => {
    const x = k.x - p.x, P = k.y - p.y;
    return { x: p.x + x * Math.cos(m) - P * Math.sin(m), y: p.y + x * Math.sin(m) + P * Math.cos(m) };
  }, M = ([k, x, P]) => [k * Math.cos(m) + x * Math.sin(m), -k * Math.sin(m) + x * Math.cos(m), P];
  for (const k of Object.values(u)) k.points = k.points.map(b);
  const w = {
    center: b(f.point),
    depth: f.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(M)
  }, y = w.axes[1];
  w.angle = Math.atan2(y[0], y[1]);
  const S = (k) => {
    if ("head" in k) return { x: w.center.x + y[0] * c, y: w.center.y - y[1] * c };
    const x = u[k.chain];
    return x.points[Math.min(k.joint, x.points.length - 1)];
  };
  let E = 0;
  (n.contact ?? "ground") === "ground" && (E = -Math.max(...t.contacts.map((k) => S(k).y))), E -= (e.lift ?? 0) * s;
  const A = (k) => ({ x: k.x, y: k.y + E });
  for (const k of Object.values(u)) k.points = k.points.map(A);
  w.center = A(w.center);
  const v = t.contacts.map((k) => ({ spec: k, point: S(k) }));
  return {
    height: s,
    view: o,
    chains: u,
    head: w,
    hip: A(b(p)),
    contacts: v,
    groundY: Math.max(...v.map((k) => k.point.y))
  };
}
const Gi = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], f0 = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Dr(t, e, n) {
  const s = n.height, o = ee(90 * (e.turn ?? 0)), i = ee(e.roll ?? 0), r = Fr(t, e, s), a = Ie(r.root, o), l = (m) => $e(Wr(Gi(Ie(m, o), a), -i), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), d = (m) => f0(Gi(l($e(r.head.center, r.head.toBody(m))), h)), u = [d([1, 0, 0]), d([0, 1, 0]), d([0, 0, 1])], f = (m) => {
    if ("head" in m) return $e(h, ro(u[1], r.head.ry));
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
    head: { center: p(h), rx: r.head.rx, ry: r.head.ry, axes: u }
  };
}
function Br(t, e, n, s) {
  const o = n.height, i = ee(90 * (e.turn ?? 0)), r = Fr(t, e, o), a = Dr(t, e, n), l = a.hip, c = a.chains, h = a.head.center, d = (k) => {
    if ("head" in k) return $e(h, ro(a.head.axes[1], a.head.ry));
    const x = c[k.chain];
    return x[Math.min(k.joint, x.length - 1)];
  }, u = s.toView(l), f = s.toScreen(u), g = s.toScreen([u[0] + 1, u[1], u[2]]), p = Math.hypot(g.x - f.x, g.y - f.y), m = (k) => {
    const x = s.toView(k);
    return { point: s.toScreen(x), depth: x[2] * p };
  }, b = {};
  for (const k of t.chains) {
    const x = c[k.id].map(m);
    b[k.id] = {
      id: k.id,
      joints3: r.chains[k.id].joints3,
      frames: r.chains[k.id].frames,
      points: x.map((P) => P.point),
      depths: x.map((P) => P.depth)
    };
  }
  const M = s.toView(h), w = s.toScreen(M), y = s.toScreen([M[0] + 1, M[1], M[2]]), S = Math.hypot(y.x - w.x, y.y - w.y), E = a.head.axes.map((k) => f0(Gi(s.toView($e(h, k)), M))), A = {
    center: w,
    depth: M[2] * p,
    rx: r.head.rx * S,
    ry: r.head.ry * S,
    angle: Math.atan2(E[1][0], E[1][1]),
    axes: E
  }, v = t.contacts.map((k) => ({ spec: k, point: m(d(k)).point }));
  return {
    height: o * p,
    view: i,
    chains: b,
    head: A,
    hip: f,
    contacts: v,
    groundY: Math.max(...v.map((k) => k.point.y))
  };
}
function qr(t, [e, n, s]) {
  const [o, i, r] = t.axes, a = [
    o[0] * e * t.rx + i[0] * n * t.ry + r[0] * s * t.rx,
    o[1] * e * t.rx + i[1] * n * t.ry + r[1] * s * t.rx,
    o[2] * e * t.rx + i[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (o[2] * e + i[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class p0 {
  positions = [];
  normals = [];
  indices = [];
  /** Add a vertex; returns its index. */
  vertex(e, n, s, o, i, r) {
    const a = Math.hypot(o, i, r) || 1;
    return this.positions.push(e, n, s), this.normals.push(o / a, i / a, r / a), this.positions.length / 3 - 1;
  }
  /** Add a triangle, counter-clockwise seen from its front. */
  triangle(e, n, s) {
    this.indices.push(e, n, s);
  }
  /** Add a quad a-b-c-d (counter-clockwise) as two triangles. */
  quad(e, n, s, o) {
    this.indices.push(e, n, s, e, s, o);
  }
  build() {
    return { positions: this.positions, normals: this.normals, indices: this.indices };
  }
}
function B1(t) {
  const e = /* @__PURE__ */ new Map(), n = [];
  for (let o = 0; o < t.positions.length / 3; o++) {
    const i = [0, 1, 2].map((r) => Math.round(t.positions[o * 3 + r] * 1e6)).join(",");
    e.has(i) || e.set(i, o), n.push(e.get(i));
  }
  const s = /* @__PURE__ */ new Map();
  for (let o = 0; o < t.indices.length / 3; o++)
    for (let i = 0; i < 3; i++) {
      const r = n[t.indices[o * 3 + i]], a = n[t.indices[o * 3 + (i + 1) % 3]];
      if (r === a) continue;
      const l = r < a ? `${r}-${a}` : `${a}-${r}`, c = s.get(l);
      c ? c.faces.push(o) : s.set(l, { a: Math.min(r, a), b: Math.max(r, a), faces: [o] });
    }
  return [...s.values()];
}
const zr = Math.PI * 2;
function q1(t, e = 16) {
  const n = new p0(), s = Math.max(6, Math.round(e)), o = Math.max(3, Math.round(s / 2)), i = [];
  for (let r = 0; r <= o; r++) {
    const a = r / o * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * zr, d = Math.sin(a) * Math.sin(h), u = Math.cos(a), f = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(d * t, u * t, f * t, d, u, f));
    }
    i.push(l);
  }
  for (let r = 0; r < o; r++)
    for (let a = 0; a < s; a++) {
      const l = i[r][a], c = i[r + 1][a], h = i[r + 1][a + 1], d = i[r][a + 1];
      r > 0 && n.triangle(l, c, d), r < o - 1 && n.triangle(c, h, d);
    }
  return n.build();
}
function Ml(t, e, n, s, o) {
  const i = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: o }, (a, l) => {
    const c = l / o * zr;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < o; a++) {
    const l = r[a], c = r[(a + 1) % o];
    s === 1 ? t.triangle(i, l, c) : t.triangle(i, c, l);
  }
}
function g0(t, e, n = 24) {
  const s = new p0(), o = Math.max(6, Math.round(n)), i = e / 2, r = -e / 2, a = (h) => Array.from({ length: o + 1 }, (d, u) => {
    const f = u / o * zr;
    return s.vertex(Math.sin(f) * t, h, Math.cos(f) * t, Math.sin(f), 0, Math.cos(f));
  }), l = a(r), c = a(i);
  for (let h = 0; h < o; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return Ml(s, t, i, 1, o), Ml(s, t, r, -1, o), s.build();
}
function ao(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of B1(t))
    for (const s of n.faces) {
      const o = n.faces.find((i) => i !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: o });
    }
  return { ...t, faceEdges: e };
}
const Ss = (t) => t * 180 / Math.PI, nn = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], si = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], Yn = (t) => Math.hypot(t[0], t[1], t[2]), Vi = (t) => {
  const e = Yn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, Ts = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function xl(t) {
  const [e, n, s] = Vi(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function z1(t, e, n, s, o) {
  const i = t.chains.find((x) => x.id === n);
  if (!i) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (i.bones.length < 2 || i.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = Nr(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: o.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = Yn(nn(a.joints3[1], a.joints3[0])), h = Yn(nn(a.joints3[2], a.joints3[1])), d = i.parent ? r.chains[i.parent].frames[Math.max(0, (i.at ?? r.chains[i.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, u = nn(s, l), f = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, Yn(u))), g = Vi(u), p = i.parent !== null, m = Ds(i.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), d);
  let b = nn(m, [g[0] * si(m, g), g[1] * si(m, g), g[2] * si(m, g)]);
  Yn(b) < 1e-6 && (b = Ie([1, 0, 0], 0)), b = Vi(b);
  const M = (c * c + f * f - h * h) / (2 * c * f), w = Math.sqrt(Math.max(0, 1 - M * M)), y = [
    l[0] + c * (M * g[0] + w * b[0]),
    l[1] + c * (M * g[1] + w * b[1]),
    l[2] + c * (M * g[2] + w * b[2])
  ], S = [l[0] + g[0] * f, l[1] + g[1] * f, l[2] + g[2] * f], E = i.side ?? 1, A = xl(nn(y, l)), v = xl(nn(S, y)), k = [
    { swing: Ss(Ts(A.swing - d.swing)), spread: Ss(Ts(A.spread - d.spread)) * E },
    { swing: Ss(Ts(v.swing - A.swing)), spread: Ss(Ts(v.spread - A.spread)) * E }
  ];
  return t.withAngles(e, i, k);
}
const m0 = 0.34, Zt = 0.12, Kt = -0.4, Xt = (t, e, n) => t[e] ?? n, Y1 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), K1 = 0.45, j1 = 0.35, X1 = 0.7;
function Et(t, e, n) {
  const s = (f) => Math.sqrt(Math.max(0, 1 - f.x * f.x - f.y * f.y)), o = qr(t, [n.x, n.y, s(n)]).facing, i = t.axes[2], r = Math.atan2(i[0], i[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(j1, Math.abs(a)), h = l * Math.max(X1, Math.abs(a)), d = Math.cos(t.angle), u = Math.sin(t.angle);
  return {
    facing: o,
    points: e.map((f) => {
      const g = K1 * Math.sin(r) + n.x * c + (f.x - n.x) * h, p = f.y + i[1] * s(f), m = g * t.rx, b = p * t.ry;
      return { x: t.center.x + m * d + b * u, y: t.center.y + m * u - b * d };
    })
  };
}
const Ln = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (o, i) => {
  const r = i / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), Sl = (t, e, n, s) => {
  const o = Math.min(1, Math.max(0, (s - t.x) / (n.x - t.x))), i = 1 - o;
  return i * i * t.y + 2 * i * o * e.y + o * o * n.y;
}, Bs = (t, e, n, s, o = 16) => Array.from({ length: o }, (i, r) => {
  const a = Math.PI * 2 * r / o;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), Un = 0.05, U1 = 0.3, G1 = "#e06b7d";
function V1(t, e, n, s, o = {}) {
  const i = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), r = (v, k) => Et(e, v, k).points, a = (v, k) => Et(e, [], { x: v, y: k }).facing, l = Xt(n, "smile", 0), c = Xt(n, "blink", 0), h = Xt(n, "lookX", 0), d = Xt(n, "lookY", 0), u = Xt(n, "browTilt", 0);
  for (const v of [1, -1]) {
    const k = v === 1 ? "left" : "right", x = m0 * v;
    if (a(x, Zt) < Un) continue;
    const P = { x, y: Zt }, I = Y1(Xt(n, `eye.${k}`, 1), c);
    if (I < 0.2) {
      const B = l > 0.5 ? 0.12 : -0.06;
      t.line(r(Ln({ x: x - 0.12, y: Zt }, { x, y: Zt + B }, { x: x + 0.12, y: Zt }), P), i);
    } else {
      if (I > 1.2) {
        const K = 0.13 * I;
        t.shape(r(Bs(x, Zt, K * 0.85, K), P), "#ffffff", i);
      }
      const B = I > 1.2 ? 0.075 : 0.1, j = x + h * 0.08, V = Zt - d * 0.07;
      t.shape(r(Bs(j, V, B, B * 1.1 * Math.min(I, 1)), P), t.ink, 0);
    }
    const O = Zt + 0.3 + Xt(n, `brow.${k}`, 0) * 0.14 + Math.max(0, I - 1) * 0.12, _ = { x: x + v * 0.13, y: O }, W = { x: x - v * 0.13, y: O + u * 0.1 };
    t.line(r([_, { x: (_.x + W.x) / 2, y: (_.y + W.y) / 2 }, W], { x, y: O }), i);
  }
  J1(t, e, n, i);
  const f = { x: 0, y: Kt };
  if (a(0, Kt) < -Un) return;
  const g = 0.25 * Math.max(0.3, Xt(n, "mouthWidth", 1)), p = Math.min(1, Math.max(0, Xt(n, "mouth", 0)));
  if (p <= 0.05) {
    t.line(r(Ln({ x: -g, y: Kt }, { x: 0, y: Kt - l * 0.25 }, { x: g, y: Kt }), f), i);
    return;
  }
  const m = 0.3 * p;
  let b, M, w, y;
  if (l > 0.3) {
    const v = Kt + 0.05, k = { x: 0, y: Kt - m * 2 };
    b = [...Ln({ x: g, y: v }, k, { x: -g, y: v })], M = () => v, w = (x) => Sl({ x: g, y: v }, k, { x: -g, y: v }, x), y = 0.85;
  } else if (l < -0.3) {
    const v = Kt - m * 0.6, k = { x: 0, y: Kt + m * 1.4 };
    b = [...Ln({ x: g, y: v }, k, { x: -g, y: v })], M = (x) => Sl({ x: g, y: v }, k, { x: -g, y: v }, x), w = () => v, y = 0.5;
  } else {
    const v = g * 0.8;
    b = Bs(0, Kt, v, m);
    const k = (x) => m * Math.sqrt(Math.max(0, 1 - (x / v) ** 2));
    M = (x) => Kt + k(x), w = (x) => Kt - k(x), y = 0.5;
  }
  if (t.shape(r(b, f), t.ink, 0), p < U1) return;
  const S = M(0) - w(0), E = g * y, A = (v, k, x = 8) => Array.from({ length: x + 1 }, (P, I) => v + (k - v) * I / x);
  if (o.tongue) {
    const v = E * 0.55, k = A(v, -v).map((P) => ({ x: P, y: w(P) })), x = Ln({ x: -v, y: w(-v) }, { x: 0, y: w(0) + S * 0.8 }, { x: v, y: w(v) }, 8);
    t.shape(r([...k, ...x.slice(1, -1)], f), G1, 0);
  }
  if (o.teeth) {
    const v = Math.min(0.06, S * 0.4), k = A(-E, E).map((P) => ({ x: P, y: M(P) })), x = k.map(({ x: P, y: I }) => ({ x: P * 0.92, y: I - v })).reverse();
    t.shape(r([...k, ...x], f), "#ffffff", 0);
    for (const P of [-0.5, 0, 0.5]) {
      const I = E * P;
      t.line(r([{ x: I, y: M(I) }, { x: I * 0.92, y: M(I) - v }], f), i * 0.6);
    }
  }
}
const Tl = "#8fd0f5", El = (t, e, n) => Array.from({ length: 18 }, (s, o) => {
  const i = Math.PI * 2 * o / 18, r = Math.sin(i / 2);
  return { x: t + Math.sin(i) * n * r, y: e - n * 0.9 + Math.cos(i) * n * 1.6 * (0.55 + 0.45 * r) - n * 0.4 };
});
function J1(t, e, n, s) {
  const o = Math.min(1, Math.max(0, Xt(n, "blush", 0))), i = Math.min(1, Math.max(0, Xt(n, "tears", 0))), r = Math.min(1, Math.max(0, Xt(n, "sweat", 0)));
  if (!(o + i + r <= 0.01)) {
    for (const a of [1, -1]) {
      const l = { x: 0.5 * a, y: -0.16 }, c = Et(e, [], l).facing >= Un;
      if (o > 0.01 && c) {
        const { points: d } = Et(e, Bs(l.x, l.y, 0.17, 0.1), l);
        if (t.shape(d, `rgba(240, 120, 140, ${(0.75 * o).toFixed(3)})`, 0), o > 0.5)
          for (const u of [-0.07, 0, 0.07]) {
            const f = [{ x: l.x + u - 0.018, y: l.y - 0.03 }, { x: l.x + u + 0.018, y: l.y + 0.03 }];
            t.line(Et(e, f, l).points, s * 0.3);
          }
      }
      const h = { x: m0 * a, y: Zt };
      if (i > 0.01 && Et(e, [], h).facing >= Un) {
        const d = 0.05 + 0.04 * i, u = { x: h.x + 0.06 * a, y: Zt - 0.2 - 0.12 * i };
        if (t.shape(Et(e, El(u.x, u.y, d), u).points, Tl, s * 0.35), i > 0.6) {
          const f = [{ x: h.x + 0.05 * a, y: Zt - 0.1 }, { x: u.x, y: u.y + d * 0.8 }];
          t.line(Et(e, f, u).points, s * 0.3);
        }
      }
    }
    if (r > 0.01) {
      const a = { x: 0.64, y: 0.42 };
      Et(e, [], a).facing >= Un && t.shape(Et(e, El(a.x, a.y, 0.05 + 0.05 * r), a).points, Tl, s * 0.35);
    }
  }
}
const Z1 = 15;
function me(t, e) {
  const n = Math.sqrt(Math.max(0, 1 - e * e));
  return [n * Math.sin(t), e, n * Math.cos(t)];
}
const Q1 = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function ye(t, [e, n, s]) {
  const [o, i, r] = t.axes;
  return o[2] * e + i[2] * n + r[2] * s;
}
function Nt(t, e) {
  return qr(t, e).point;
}
function lo(t, e) {
  const n = Math.abs(t - e) % (Math.PI * 2);
  return n > Math.PI ? Math.PI * 2 - n : n;
}
function Ao(t, e, n = 64) {
  const s = e.top ?? 1, o = e.bottom ?? -1, i = Math.max(8, Math.ceil((s - o) * Z1)), r = (g) => Math.min(s, Math.max(o, s - (s - o) * (g - 1) / i)), a = (g) => -Math.PI + Math.PI * 2 * g / n, l = (g, p) => e.normal ? e.normal(g, p) : Q1(e.position(g, p)), c = i + 3, h = new Float64Array(n * c), d = new Float64Array(n * c);
  for (let g = 0; g < c; g++) {
    const p = g === 0 || g === c - 1, m = r(g);
    for (let b = 0; b < n; b++) {
      const M = g * n + b;
      if (p) {
        h[M] = -1;
        continue;
      }
      const w = a(b);
      h[M] = e.inside(w, m), d[M] = h[M] > -0.35 ? ye(t, l(w, m)) : 0;
    }
  }
  const u = (g) => (g % n + n) % n, f = (g) => {
    const p = n + 1, m = new Float64Array(p * c);
    for (let I = 0; I < c; I++)
      for (let O = 0; O <= n; O++) {
        const _ = I * n + (O === n ? 0 : O);
        m[I * p + O] = Math.min(h[_], g * d[_]);
      }
    const b = (I, O) => m[O * p + I], M = (I, O, _, W) => {
      const B = b(I, O), j = b(_, W), V = B === j ? 0.5 : Math.min(1, Math.max(0, B / (B - j)));
      return Nt(t, e.position(a(I + (_ - I) * V), r(O + (W - O) * V)));
    }, w = n * c * 2, y = new Int32Array(w).fill(-1), S = new Int32Array(w).fill(-1), E = /* @__PURE__ */ new Map(), A = (I, O, _) => {
      const W = (_ * n + u(O)) * 2 + (I ? 1 : 0);
      return E.has(W) || E.set(W, I ? M(u(O), _, u(O), _ + 1) : M(O, _, O + 1, _)), W;
    }, v = (I, O) => {
      y[I] === -1 ? y[I] = O : S[I] = O;
    }, k = (I, O) => {
      v(I, O), v(O, I);
    };
    for (let I = 0; I < c - 1; I++)
      for (let O = 0; O < n; O++) {
        const _ = I * p + O, W = (m[_] > 0 ? 8 : 0) | (m[_ + 1] > 0 ? 4 : 0) | (m[_ + p + 1] > 0 ? 2 : 0) | (m[_ + p] > 0 ? 1 : 0);
        if (W === 0 || W === 15) continue;
        const B = () => A(!1, O, I), j = () => A(!1, O, I + 1), V = () => A(!0, O, I), K = () => A(!0, O + 1, I);
        switch (W) {
          case 1:
          case 14:
            k(V(), j());
            break;
          case 2:
          case 13:
            k(j(), K());
            break;
          case 3:
          case 12:
            k(V(), K());
            break;
          case 4:
          case 11:
            k(B(), K());
            break;
          case 6:
          case 9:
            k(B(), j());
            break;
          case 7:
          case 8:
            k(V(), B());
            break;
          case 5:
          case 10: {
            const T = (b(O, I) + b(O + 1, I) + b(O + 1, I + 1) + b(O, I + 1)) / 4 > 0;
            W === 5 === T ? (k(V(), B()), k(j(), K())) : (k(V(), j()), k(B(), K()));
            break;
          }
        }
      }
    const x = [], P = new Uint8Array(w);
    for (const I of E.keys()) {
      if (P[I]) continue;
      const O = [];
      let _ = -1, W = I;
      for (; W !== -1 && !P[W]; ) {
        P[W] = 1, O.push(E.get(W));
        const B = y[W], j = S[W], V = B !== -1 && B !== _ && !P[B] ? B : j !== -1 && j !== _ && !P[j] ? j : -1;
        _ = W, W = V;
      }
      O.length >= 3 && x.push(O);
    }
    return x;
  };
  return { near: f(1), far: f(-1) };
}
const Al = /* @__PURE__ */ new WeakMap();
function Yr(t, e, n) {
  let s = Al.get(t);
  s || Al.set(t, s = /* @__PURE__ */ new Map());
  let o = s.get(e);
  return o || s.set(e, o = n()), o;
}
function Kr(t, e, n) {
  t.save(), t.beginPath(), t.rect(-1e5, -1e5, 2e5, 2e5), t.ellipse(e.center.x, e.center.y, e.rx, e.ry, e.angle, 0, Math.PI * 2), t.clip("evenodd"), n(), t.restore();
}
function y0(t, e, n, s = 0.04) {
  const o = [];
  let i = [];
  return e.forEach((r, a) => {
    ye(t, n[a]) > s ? i.push(Nt(t, r)) : (i.length >= 2 && o.push(i), i = []);
  }), i.length >= 2 && o.push(i), o;
}
const is = { swing: 0, trail: 0, lift: 0 };
function jr(t) {
  if (!t) return is;
  const e = t["hair.swing"] ?? 0, n = t["hair.trail"] ?? 0, s = t["hair.lift"] ?? 0;
  return e === 0 && n === 0 && s === 0 ? is : { swing: e, trail: n, lift: s };
}
const b0 = (t) => t.swing === 0 && t.trail === 0 && t.lift === 0;
function ty(t) {
  return t.length > 0 || t.ties.some((e) => e.kind !== "bun");
}
function Ji([t, e, n], s) {
  if (s === 0) return [t, e, n];
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - n * i, e, n * o + t * i];
}
const $l = {
  color: "#6b4630",
  volume: 0.1,
  hairline: { front: 0.5, side: 0.12, back: -0.82 },
  sweep: 0,
  recede: 0,
  length: 0,
  opening: 84,
  texture: "smooth",
  textureAmount: 0,
  quiff: 0,
  flat: 0,
  part: null,
  strands: "none",
  fill: "solid",
  ties: [],
  coversEars: !1
}, Pl = 1.75, w0 = {
  // Short hair and hairlines
  bald: { volume: 0, hairline: { front: 2, side: 2, back: 2 } },
  buzzCut: { volume: 0, fill: "stipple", hairline: { front: 0.52, side: 0.1, back: -0.8 } },
  crewCut: { volume: 0.1, texture: "spiky", textureAmount: 0.07, hairline: { front: 0.55, side: 0.1, back: -0.8 } },
  short: { volume: 0.12, texture: "spiky", textureAmount: 0.1, hairline: { front: 0.42, side: 0.1, back: -0.82 }, sweep: 0.12 },
  sidePart: { volume: 0.14, part: 35, strands: "sweep", sweep: -0.22, hairline: { front: 0.5, side: 0.08, back: -0.82 } },
  sideSwept: { volume: 0.15, part: 45, strands: "sweep", sweep: -0.38, hairline: { front: 0.42, side: 0.05, back: -0.82 } },
  slickBack: { volume: 0.12, strands: "combed", hairline: { front: 0.62, side: 0.15, back: -0.8 } },
  quiff: { volume: 0.12, quiff: 0.42, strands: "combed", hairline: { front: 0.6, side: 0.15, back: -0.8 } },
  spiky: { volume: 0.12, texture: "spiky", textureAmount: 0.34, hairline: { front: 0.5, side: 0.12, back: -0.8 } },
  undercut: { volume: 0.16, quiff: 0.18, part: 40, strands: "sweep", sweep: -0.15, hairline: { front: 0.55, side: 0.42, back: -0.3 } },
  curlyCrop: { volume: 0.14, texture: "curly", textureAmount: 0.12, hairline: { front: 0.5, side: 0.1, back: -0.8 } },
  afro: { volume: 0.5, texture: "curly", textureAmount: 0.12, hairline: { front: 0.5, side: -0.1, back: -0.85 }, coversEars: !0 },
  wavyCrop: { volume: 0.16, texture: "wavy", textureAmount: 0.08, part: 30, hairline: { front: 0.45, side: 0.05, back: -0.82 } },
  shortLocs: { volume: 0.16, texture: "locs", textureAmount: 0.1, hairline: { front: 0.38, side: -0.25, back: -0.85 }, strands: "hanging", coversEars: !0 },
  flatTop: { volume: 0.1, flat: 0.42, hairline: { front: 0.5, side: 0.15, back: -0.78 } },
  receding: { volume: 0.14, recede: 0.28, strands: "thin", hairline: { front: 0.74, side: 0.1, back: -0.8 } },
  thinning: { volume: 0.05, strands: "thin", hairline: { front: 0.72, side: 0.05, back: -0.78 } },
  // Medium and long hair
  pixie: { volume: 0.16, texture: "spiky", textureAmount: 0.07, sweep: 0.3, hairline: { front: 0.32, side: -0.1, back: -0.82 } },
  bob: { volume: 0.2, length: 1.05, opening: 84, sweep: 0.2, part: -25, hairline: { front: 0.34, side: 0.05, back: -0.85 }, coversEars: !0 },
  longBob: { volume: 0.18, length: 1.35, opening: 84, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  wavyBob: { volume: 0.22, length: 1.2, opening: 84, part: 18, texture: "wavy", textureAmount: 0.1, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
  shoulderStraight: { volume: 0.16, length: Pl, opening: 84, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  shoulderWaves: { volume: 0.22, length: Pl, opening: 84, part: 22, texture: "wavy", textureAmount: 0.12, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
  longStraight: { volume: 0.14, length: 2.6, opening: 84, part: 0, strands: "hanging", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  longWaves: { volume: 0.2, length: 2.5, opening: 84, part: 20, texture: "wavy", textureAmount: 0.14, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
  longCurls: { volume: 0.26, length: 2.5, opening: 84, texture: "curly", textureAmount: 0.13, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
  longLocs: { volume: 0.2, length: 2.6, opening: 84, texture: "locs", textureAmount: 0.12, strands: "hanging", part: 0, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
  lowPonytail: { volume: 0.12, part: 0, strands: "combed", hairline: { front: 0.5, side: 0.1, back: -0.82 }, ties: [{ kind: "ponytail", at: "low", length: 1.5 }] },
  highPonytail: { volume: 0.12, part: 18, strands: "combed", hairline: { front: 0.45, side: 0.1, back: -0.78 }, ties: [{ kind: "ponytail", at: "high", length: 2 }] },
  ponytail: { volume: 0.12, sweep: 0.2, hairline: { front: 0.42, side: 0.1, back: -0.78 }, ties: [{ kind: "ponytail", at: "high", length: 1.8 }] },
  sidePonytail: { volume: 0.12, part: -20, strands: "combed", hairline: { front: 0.45, side: 0.1, back: -0.82 }, ties: [{ kind: "ponytail", at: "left", length: 1.5 }] },
  topBun: { volume: 0.12, part: 0, strands: "combed", hairline: { front: 0.5, side: 0.1, back: -0.8 }, ties: [{ kind: "bun", at: "top", size: 0.32 }] },
  lowBun: { volume: 0.12, part: 0, strands: "combed", hairline: { front: 0.5, side: 0.1, back: -0.8 }, ties: [{ kind: "bun", at: "low", size: 0.34 }] },
  singleBraid: { volume: 0.12, part: 0, strands: "combed", hairline: { front: 0.5, side: 0.1, back: -0.82 }, ties: [{ kind: "braid", at: "low", length: 2.2 }] },
  twinBraids: { volume: 0.12, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.82 }, ties: [{ kind: "braid", at: "left", length: 1.9 }, { kind: "braid", at: "right", length: 1.9 }], coversEars: !0 },
  braids: { volume: 0.12, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.82 }, ties: [{ kind: "braid", at: "left", length: 1.6 }, { kind: "braid", at: "right", length: 1.6 }], coversEars: !0 }
}, fe = {
  black: "#22201f",
  brown: "#6b4630",
  chestnut: "#7b4a2b",
  auburn: "#9a4426",
  blond: "#d9b55a",
  ginger: "#c8662f",
  gray: "#a7a29c",
  white: "#ecebe7"
};
function ey(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ? w0[e.style] : {};
  if (e.style && !n) throw new Error(`hair: unknown style '${e.style}'`);
  const { style: s, hairline: o, ...i } = e;
  return {
    ...$l,
    ...n,
    ...i,
    hairline: { ...$l.hairline, ...n.hairline, ...o },
    ties: (i.ties ?? n.ties ?? []).map((r) => ({ ...r }))
  };
}
const $o = (t) => t * Math.PI / 180, Gn = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, Zi = (t) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1);
function co(t, e) {
  const { front: n, side: s, back: o } = t.hairline, i = (n - o) / 2, r = (n + o) / 2, a = (r + s) / 2, l = (r - s) / 2, c = Math.max(0, Math.cos(e));
  let h = a + i * Math.cos(e) + l * Math.cos(2 * e);
  return h -= t.sweep * Math.sin(e) * c, h += t.recede * Math.exp(-(((Math.abs(e) - 0.75) / 0.32) ** 2)), (t.texture === "spiky" || t.texture === "curly") && (h -= t.textureAmount * 0.6 * Zi(e * 11 / (Math.PI * 2)) * c), h;
}
function Il(t, e, n) {
  const s = t.textureAmount;
  switch (t.texture) {
    case "spiky":
      return s * (Zi(e * 11 / (Math.PI * 2)) * Zi(n * 2.6 + 0.5)) ** 1.2 * Gn(-0.3, 0.4, n);
    case "curly":
      return s * Math.sqrt(Math.abs(Math.sin(e * 7)) * Math.abs(Math.sin(n * Math.PI * 2.6)));
    case "wavy":
      return s * (0.5 + 0.5 * Math.sin(e * 6 + n * 6));
    case "locs":
      return s * Math.abs(Math.sin(e * 10)) ** 0.6;
    default:
      return 0;
  }
}
function k0(t, e, n = is) {
  const s = t.length > 0, o = /* @__PURE__ */ new Map(), i = (h) => {
    let d = o.get(h);
    return d === void 0 && o.set(h, d = co(t, h)), d;
  }, r = $o(t.opening), a = (h) => t.length + (t.texture === "wavy" || t.texture === "curly" || t.texture === "locs" ? 0.12 * Math.sin(h * 9) : 0), l = (h, d, u) => {
    if (t.flat <= 0 || d < 0.45) return null;
    const f = (d - 0.45) / 0.55, g = Math.sqrt(1 - 0.45 * 0.45) * u * (1 - f ** 5), p = 0.45 + (1 + t.flat - 0.45) * Math.min(1, f * 1.8);
    return [g * Math.sin(h), p * (1 + e), g * Math.cos(h)];
  }, c = {
    top: 1,
    bottom: s ? -(t.length + 0.25) : -1,
    inside(h, d) {
      const u = d - i(h);
      if (!s) return u;
      const f = Math.min(d + a(h), lo(h, 0) - r);
      return Math.max(u, f);
    },
    position(h, d) {
      if (s && d < 0) {
        const w = t.length < 1.5 ? 0.14 * Gn(-t.length + 0.45, -t.length - 0.1, d) : 0, y = 1 + e + t.volume * (1 - w * 2.5) + Il(t, h, d) - w;
        return [y * Math.sin(h), d, y * Math.cos(h)];
      }
      const u = 0.4 + 0.6 * Gn(0, 0.3, d - co(t, h)), f = 1 + e + (t.volume + Il(t, h, d)) * u, g = l(h, d, f);
      if (g) return g;
      const [p, m, b] = me(h, d), M = [p * f, m * f, b * f];
      if (t.quiff > 0) {
        const w = t.quiff * Math.exp(-((h / 0.7) ** 2)) * Gn(0.15, 0.85, d);
        M[1] += w * 0.7, M[2] += w * 0.45;
      }
      return M;
    },
    normal(h, d) {
      return s && d < 0 ? [Math.sin(h), 0, Math.cos(h)] : me(h, d);
    }
  };
  return s && !b0(n) ? ny(c, t, n) : c;
}
function ny(t, e, n) {
  const s = (i) => i < 0 ? Gn(-0.15, -Math.max(0.7, e.length), i) : 0, o = (i) => $o(n.swing) * s(i);
  return {
    top: t.top,
    bottom: t.bottom,
    inside: (i, r) => t.inside(i + o(r), r),
    position(i, r) {
      const a = s(r);
      if (a === 0) return t.position(i, r);
      const l = o(r), [c, h, d] = Ji(t.position(i + l, r), l);
      return [c, h + n.lift * a, d - n.trail * a];
    },
    normal: (i, r) => Ji(t.normal(i + o(r), r), o(r))
  };
}
const sy = (t) => t.texture === "spiky" || t.texture === "curly" || t.texture === "locs" ? 104 : t.texture === "wavy" ? 80 : 64;
function v0(t, e, n, s) {
  return Yr(t, iy(e, s), () => Ao(t, n, sy(e)));
}
const Ol = /* @__PURE__ */ new WeakMap();
let oy = 1;
function iy(t, e) {
  if (b0(e)) return t;
  let n = Ol.get(t);
  return n || Ol.set(t, n = oy++), `${n}:${e.swing}:${e.trail}:${e.lift}`;
}
function M0(t) {
  switch (t) {
    case "top":
      return { point: [0, 1.02, -0.12], out: [0, 1, -0.15] };
    case "high":
      return { point: [0, 0.72, -0.78], out: [0, 0.55, -0.85] };
    case "low":
      return { point: [0, -0.2, -1.02], out: [0, -0.1, -1] };
    case "left":
      return { point: [0.82, -0.32, -0.45], out: [0.8, -0.2, -0.5] };
    case "right":
      return { point: [-0.82, -0.32, -0.45], out: [-0.8, -0.2, -0.5] };
  }
}
function oi(t, [e, n, s]) {
  const o = Nt(t, [e, n, s]);
  return { x: o.x - t.center.x, y: o.y - t.center.y };
}
function ry(t, e, n, s = 16) {
  return Array.from({ length: s + 1 }, (o, i) => {
    const r = i / s, a = 1 - r;
    return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
  });
}
function ay(t, e, n, s, o) {
  const i = t.ry, r = (e.length ?? 1.8) * i, a = oi(t, Ji(s, $o(o.swing))), l = oi(t, [0, o.lift, -o.trail]), c = Math.hypot(a.x, a.y) || 1, h = e.at === "high" || e.at === "low" || e.at === "top" ? oi(t, [0.95, 0, 0]) : { x: 0 }, d = e.kind === "braid" ? 0.15 : 0.5, u = {
    x: n.x + a.x / c * i * d + h.x * 0.9 + l.x * 0.5,
    y: n.y + a.y / c * i * d * 0.6 + l.y * 0.5
  }, f = { x: n.x + a.x / c * i * d * 0.6 + h.x * 1.3 + l.x, y: n.y + r + l.y };
  return ry(n, u, f);
}
const Xr = (t) => Math.max(1, t * 0.5), x0 = (t, e) => Math.max(0.8, Math.min(t * 0.4, 0.1 * e.rx));
function S0(t, e, n, s, o, i) {
  const { point: r, out: a } = M0(s.at), l = 1 + n.volume, c = Nt(e, [r[0] * l, r[1] * l, r[2] * l]), h = Xr(o), d = x0(o, e);
  if (s.kind === "bun") {
    const p = s.size ?? 0.32, m = Nt(e, [r[0] * l + a[0] * p, r[1] * l + a[1] * p, r[2] * l + a[2] * p]);
    t.ellipse(m.x, m.y, p * e.rx, p * e.ry, e.angle, n.color, h);
    const b = p * e.rx * 0.55;
    t.line(
      Array.from({ length: 9 }, (M, w) => {
        const y = -0.4 + w / 8 * Math.PI * 1.3;
        return { x: m.x + Math.cos(y) * b, y: m.y + Math.sin(y) * b * 0.8 };
      }),
      d
    );
    return;
  }
  const u = ay(e, s, c, a, i), f = (s.size ?? (s.kind === "braid" ? 0.2 : 0.34)) * e.rx * 2;
  if (s.kind === "ponytail")
    t.shape(Lt(u, f, f * 0.15), n.color, h), t.line(u.slice(3, u.length - 3), d);
  else {
    const m = u.slice(0, u.length - 3);
    for (let w = 0; w < 7; w++) {
      const y = m[Math.floor(w / 7 * (m.length - 1))], S = m[Math.floor((w + 1) / 7 * (m.length - 1))], E = Math.atan2(S.y - y.y, S.x - y.x), A = Math.hypot(S.x - y.x, S.y - y.y), v = f * (1 - w / (7 * 2.2)), k = (w % 2 === 0 ? 1 : -1) * 0.35, x = { x: (y.x + S.x) / 2, y: (y.y + S.y) / 2 };
      t.ellipse(x.x, x.y, A * 0.62, v * 0.5, E + k, n.color, h * 0.8);
    }
    const b = m[m.length - 1], M = u[u.length - 1];
    t.shape(Lt([b, M], f * 0.7, f * 0.2), n.color, h * 0.8);
  }
  const g = u[s.kind === "braid" ? u.length - 4 : 2];
  t.ellipse(g.x, g.y, f * 0.32, f * 0.22, e.angle, n.color, h);
}
function T0(t, e) {
  return ye(t, M0(e.at).out) < -0.2;
}
function ly(t) {
  const e = (o, i, r = 0, a = 14) => Array.from({ length: a + 1 }, (l, c) => {
    const h = c / a;
    return [o[0] + (i[0] - o[0]) * h + r * Math.sin(Math.PI * h), o[1] + (i[1] - o[1]) * h];
  }), n = $o(t.part ?? 0), s = (o) => co(t, o) + 0.04;
  switch (t.strands) {
    case "part":
      return [e([n, s(n)], [n, 0.97])];
    case "sweep": {
      const o = Math.sign(t.sweep || -1), i = [0.9, 0.72, 0.55].map((r, a) => {
        const l = n + o * (0.6 + a * 0.35);
        return e([n, r], [l, Math.max(s(l) + 0.05, r - 0.35)], 0.05 * o);
      });
      return [e([n, s(n)], [n, 0.97]), ...i];
    }
    case "combed":
      return [-0.75, -0.35, 0.35, 0.75].map((o) => e([o, s(o) + 0.02], [o * 0.3, 0.86]));
    case "thin":
      return [-0.5, 0.05, 0.6].map((o) => e([o, s(o) + 0.02], [o * 0.5, 0.95], 0.12));
    case "hanging": {
      const o = t.length > 0 ? -t.length + 0.25 : -0.4, i = [-2.6, -2, -1.4, 1.4, 2, 2.6, 3.05].map((r) => e([r, co(t, r) < 0.9 ? 0.6 : 0.9], [r, o], 0));
      return t.part !== null && i.push(e([n, s(n)], [n, 0.97])), i;
    }
    default:
      return [];
  }
}
function cy(t, e, n, s, o) {
  if (s.fill === "stipple" || s.hairline.front > 1.5) return;
  const i = o.motion ?? is, r = o.lineWidth * 0.45 / n.rx, { far: a } = v0(n, s, k0(s, r, i), i);
  Kr(e, n, () => {
    for (const l of s.ties) T0(n, l) && S0(t, n, s, l, o.lineWidth, i);
    for (const l of a) t.shape(l, s.color, Xr(o.lineWidth));
  });
}
function E0(t, e, n, s) {
  if (n.hairline.front > 1.5) return;
  const o = s.motion ?? is, i = s.lineWidth * 0.45 / e.rx, r = k0(n, i, o), a = x0(s.lineWidth, e);
  if (n.fill === "stipple") {
    for (let h = 0.97; h > -1; h -= 0.17)
      for (let d = -Math.PI; d < Math.PI; d += 0.27) {
        const u = Math.round(h * 100) % 2 * 0.13;
        if (r.inside(d + u, h) < 0.02) continue;
        const f = me(d + u, h);
        if (ye(e, f) < 0.12) continue;
        const g = Nt(e, f);
        t.dot(g.x, g.y, a * 0.4);
      }
    return;
  }
  const { near: l } = v0(e, n, r, o), c = Xr(s.lineWidth);
  for (const h of l) t.shape(h, n.color, c);
  for (const h of ly(n)) {
    const d = h.map(([f, g]) => {
      const [p, m, b] = r.position(f, g);
      return [p * 0.985, m * 0.985, b * 0.985];
    }), u = h.map(([f, g]) => r.normal(f, g));
    for (const f of y0(e, d, u, 0.12)) t.line(f, a);
  }
  for (const h of n.ties) T0(e, h) || S0(t, e, n, h, s.lineWidth, o);
}
const A0 = 0.35, Ur = (t) => ({ centre: [t * 0.98, -0.02, -0.08], out: [t, 0, -0.12] });
function $0(t, e, n, s, o) {
  const { centre: i, out: r } = Ur(n), a = ye(e, r), l = Math.max(1, s.lineWidth * 0.55), c = s.skin === "none" ? null : s.skin, h = e.ry * 0.27;
  if (!o) {
    const m = Nt(e, [i[0] * 1.06, i[1], i[2]]);
    t.ellipse(m.x, m.y, e.rx * 0.17, h, e.angle, c, l);
    return;
  }
  const d = Nt(e, i), u = e.rx * (0.12 + 0.08 * a);
  t.ellipse(d.x, d.y, u, h, e.angle, c, l);
  const f = Math.cos(e.angle), g = Math.sin(e.angle), p = Array.from({ length: 9 }, (m, b) => {
    const M = -Math.PI * 0.55 + b / 8 * Math.PI * 1.1, w = Math.cos(M) * u * 0.45 * -n, y = Math.sin(M) * h * 0.55;
    return { x: d.x + w * f - y * g, y: d.y + w * g + y * f };
  });
  t.line(p, Math.max(0.8, l * 0.7));
}
function hy(t, e, n, s) {
  Kr(e, n, () => {
    for (const o of [1, -1]) ye(n, Ur(o).out) < A0 && $0(t, n, o, s, !1);
  });
}
function dy(t, e, n) {
  for (const s of [1, -1]) ye(e, Ur(s).out) >= A0 && $0(t, e, s, n, !0);
}
const P0 = {
  cleanShaven: { moustache: "none", beard: "none" },
  stubble: { moustache: "none", beard: "stubble" },
  pencilMoustache: { moustache: "pencil", beard: "none" },
  shortMoustache: { moustache: "short", beard: "none" },
  chevron: { moustache: "chevron", beard: "none" },
  handlebar: { moustache: "handlebar", beard: "none" },
  walrus: { moustache: "walrus", beard: "none" },
  goatee: { moustache: "none", beard: "goatee" },
  vanDyke: { moustache: "chevron", beard: "goatee" },
  circleBeard: { moustache: "short", beard: "circle" },
  shortBoxed: { moustache: "short", beard: "boxed" },
  fullBeard: { moustache: "chevron", beard: "full" },
  longBeard: { moustache: "walrus", beard: "long" },
  roundedBeard: { moustache: "chevron", beard: "rounded" },
  pointedBeard: { moustache: "chevron", beard: "pointed" },
  chinStrap: { moustache: "none", beard: "chinStrap" },
  soulPatch: { moustache: "none", beard: "soulPatch" },
  sideburns: { moustache: "none", beard: "sideburns" },
  muttonChops: { moustache: "none", beard: "muttonChops" },
  moustacheStubble: { moustache: "short", beard: "stubble" }
};
function uy(t, e) {
  const n = typeof t == "string" ? { style: t } : t, s = n.style ? P0[n.style] : void 0;
  if (n.style && !s) throw new Error(`facialHair: unknown style '${n.style}'`);
  return {
    color: n.color ?? e ?? "#6b4630",
    moustache: n.moustache ?? s?.moustache ?? "none",
    beard: n.beard ?? s?.beard ?? "none"
  };
}
const Me = (t) => t * Math.PI / 180, qs = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, I0 = {
  goatee: { top: [-0.55, -0.55], reach: 22, band: 0, length: 0.22, shape: "point", volume: 0.06, aroundMouth: !1 },
  circle: { top: [-0.24, -0.3], reach: 42, band: 0, length: 0.08, shape: "round", volume: 0.06, aroundMouth: !0 },
  boxed: { top: [-0.38, 0.02], reach: 100, band: 0, length: 0.18, shape: "square", volume: 0.08, aroundMouth: !0 },
  full: { top: [-0.36, 0.05], reach: 100, band: 0, length: 0.32, shape: "round", volume: 0.12, aroundMouth: !0 },
  rounded: { top: [-0.36, 0.05], reach: 100, band: 0, length: 0.55, shape: "round", volume: 0.14, aroundMouth: !0 },
  pointed: { top: [-0.36, 0.05], reach: 100, band: 0, length: 0.8, shape: "point", volume: 0.12, aroundMouth: !0 },
  long: { top: [-0.36, 0.05], reach: 100, band: 0, length: 1.4, shape: "round", volume: 0.14, aroundMouth: !0 },
  chinStrap: { top: [-0.68, 0.05], reach: 100, band: 0.18, length: 0, shape: "round", volume: 0.04, aroundMouth: !1 },
  sideburns: { top: [0.08, 0.08], reach: 100, band: 0.42, length: 0, shape: "round", volume: 0.05, aroundMouth: !1 },
  muttonChops: { top: [0.08, 0.08], reach: 100, band: 0.75, length: 0, shape: "round", volume: 0.08, aroundMouth: !1 }
}, fy = (t, e) => {
  const n = qs(Me(48), Me(100), lo(e, 0));
  return t.top[0] + (t.top[1] - t.top[0]) * n;
}, py = (t) => t === "sideburns" || t === "muttonChops";
function Qi(t, e) {
  const n = I0[t];
  if (!n) return null;
  const s = Me(n.reach), o = (i) => {
    const r = lo(i, 0);
    return n.shape === "point" ? Math.exp(-((r / 0.42) ** 2)) : n.shape === "square" ? 1 - qs(Me(45), Me(85), r) : Math.cos(Math.min(r, Math.PI / 2)) ** 0.7;
  };
  return {
    top: Math.max(n.top[0], n.top[1]) + 0.05,
    bottom: -1,
    inside(i, r) {
      const a = lo(i, 0), l = fy(n, i);
      let c = Math.min(l - r, s - a);
      if (n.band > 0 && (c = Math.min(c, r - (l - n.band))), py(t)) {
        const h = t === "muttonChops" ? Me(70) - Me(22) * qs(0.08, -0.6, r) : Me(72);
        c = Math.min(c, a - h);
      }
      return c;
    },
    position(i, r) {
      const [a, l, c] = me(i, r), h = 1 + e + n.volume, d = n.length * o(i) * qs(-0.45, -1, r);
      return [a * h, l * h - d, c * h + d * 0.25];
    },
    normal: (i, r) => me(i, r)
  };
}
function gy(t) {
  const n = (s) => s.map(([o, i]) => ({ x: o, y: -0.24 + i }));
  switch (t) {
    case "short":
      return n([[-0.17, -0.02], [-0.1, 0.04], [0, 0.03], [0.1, 0.04], [0.17, -0.02], [0.08, -0.05], [0, -0.03], [-0.08, -0.05]]);
    case "chevron":
      return n([[-0.28, -0.1], [-0.16, 0.05], [0, 0.07], [0.16, 0.05], [0.28, -0.1], [0.12, -0.08], [0, -0.06], [-0.12, -0.08]]);
    case "walrus":
      return n([[-0.38, -0.2], [-0.3, 0.02], [-0.12, 0.09], [0, 0.07], [0.12, 0.09], [0.3, 0.02], [0.38, -0.2], [0.2, -0.13], [0, -0.11], [-0.2, -0.13]]);
    case "handlebar":
      return n([[-0.24, -0.03], [-0.12, 0.04], [0, 0.03], [0.12, 0.04], [0.24, -0.03], [0.1, -0.05], [0, -0.03], [-0.1, -0.05]]);
    default:
      return null;
  }
}
const rs = (t) => Math.max(1, t * 0.45);
function my(t, e, n, s) {
  for (let o = 0.1; o > -1; o -= 0.13)
    for (let i = -Math.PI / 1.7; i < Math.PI / 1.7; i += 0.2) {
      const r = Math.round(o * 100) % 2 * 0.1;
      if (n.inside(i + r, o) < 0.02) continue;
      const a = me(i + r, o);
      if (ye(e, a) < 0.15) continue;
      const l = Nt(e, a);
      t.dot(l.x, l.y, s);
    }
}
function yy(t, e, n, s, o) {
  const i = s.beard === "stubble" ? null : Qi(s.beard, o.lineWidth * 0.45 / n.rx);
  if (!i) return;
  const { far: r } = Yr(n, s, () => Ao(n, i));
  Kr(e, n, () => {
    for (const a of r) t.shape(a, s.color, rs(o.lineWidth));
  });
}
function by(t, e, n, s, o) {
  if (n.beard === "none") return;
  const i = s.lineWidth * 0.45 / e.rx;
  if (n.beard === "stubble") {
    my(t, e, Qi("full", i), Math.max(0.5, s.lineWidth * 0.09));
    return;
  }
  if (n.beard === "soulPatch") {
    const l = [{ x: -0.05, y: -0.55 }, { x: 0.05, y: -0.55 }, { x: 0, y: -0.68 }], { points: c, facing: h } = Et(e, l, { x: 0, y: -0.6 });
    h > -0.05 && t.shape(c, n.color, rs(s.lineWidth) * 0.7);
    return;
  }
  const r = Qi(n.beard, i);
  if (!r) return;
  const { near: a } = Yr(e, n, () => Ao(e, r));
  for (const l of a) t.shape(l, n.color, rs(s.lineWidth));
  if (I0[n.beard]?.aroundMouth) {
    const l = 0.27 * Math.max(0.3, o), c = Array.from({ length: 20 }, (u, f) => {
      const g = Math.PI * 2 * f / 20;
      return { x: Math.cos(g) * l, y: -0.42 + Math.sin(g) * 0.13 };
    }), { points: h, facing: d } = Et(e, c, { x: 0, y: -0.42 });
    d > -0.05 && t.shape(h, s.skin === "none" ? "#ffffff" : s.skin, 0);
  }
}
function wy(t, e, n, s) {
  if (n.moustache === "none") return;
  const o = { x: 0, y: -0.24 };
  if (n.moustache === "pencil") {
    const l = [-0.2, -0.1, 0, 0.1, 0.2].map((d) => ({ x: d, y: -0.25 + 0.03 * Math.cos(d / 0.2 * Math.PI) })), { points: c, facing: h } = Et(e, l, o);
    h > -0.05 && t.line(c, Math.max(1, s.lineWidth * 0.32));
    return;
  }
  const i = gy(n.moustache);
  if (!i) return;
  const { points: r, facing: a } = Et(e, i, o);
  if (!(a <= -0.05) && (t.shape(r, n.color, rs(s.lineWidth) * 0.8), n.moustache === "handlebar"))
    for (const l of [1, -1]) {
      const c = Array.from({ length: 10 }, (h, d) => {
        const u = -Math.PI / 2 + d / 9 * Math.PI * 1.4;
        return { x: l * (0.27 + 0.05 * Math.cos(u)), y: -0.21 + 0.05 * (1 + Math.sin(u)) };
      });
      c.unshift({ x: l * 0.22, y: -0.27 }), t.line(Et(e, c, o).points, rs(s.lineWidth) * 0.8);
    }
}
const O0 = { round: !0, square: !0, sunglasses: !0 };
function ky(t) {
  const n = (typeof t == "string" ? { style: t } : t).style ?? "round";
  if (!(n in O0)) throw new Error(`glasses: unknown style '${n}'`);
  return { style: n };
}
const _l = 0.34, re = 0.12, vy = 0.05;
function My(t, e) {
  return Array.from({ length: 28 }, (s, o) => {
    const i = Math.PI * 2 * o / 28;
    if (t === "round") return { x: e + Math.cos(i) * 0.2, y: re + Math.sin(i) * 0.19 };
    const r = Math.cos(i), a = Math.sin(i), l = t === "sunglasses" ? 0.22 : 0.21, c = t === "sunglasses" ? 0.17 : 0.16;
    return { x: e + Math.sign(r) * Math.abs(r) ** 0.45 * l, y: re - 0.01 + Math.sign(a) * Math.abs(a) ** 0.45 * c };
  });
}
function xy(t, e, n, s) {
  const o = Math.max(1, Math.min(s.lineWidth * 0.5, 0.11 * e.rx)), i = [];
  for (const r of [1, -1]) {
    const a = _l * r, { points: l, facing: c } = Et(e, My(n.style, a), { x: a, y: re });
    if (c < vy) continue;
    i.push(r), t.shape(l, n.style === "sunglasses" ? "#1f2328" : null, o);
    const h = [r * 0.97, re + 0.02, -0.1];
    if (ye(e, [r, 0, 0]) > 0.15) {
      const d = Et(e, [{ x: a + r * 0.21, y: re + 0.02 }], { x: a, y: re }).points[0];
      t.line([d, Nt(e, h)], o * 0.9);
    }
  }
  if (i.length === 2) {
    const r = [
      { x: _l - 0.2, y: re + 0.02 },
      { x: 0, y: re + 0.07 },
      { x: -0.14, y: re + 0.02 }
    ];
    t.line(Et(e, r, { x: 0, y: re }).points, o);
  }
}
const Gr = {
  cap: { color: "#d64535", brim: [0.36, 0.16], height: 1, peak: 0.7, detail: "seams" },
  beanie: { color: "#3a6ea5", brim: [0.3, 0.12], height: 1.08, detail: "fold" },
  hardHat: { color: "#f2c230", brim: [0.34, 0.22], height: 1.12, ring: 0.16, detail: "ridge" },
  sunHat: { color: "#e3c98f", brim: [0.36, 0.3], height: 1.02, ring: 0.62, detail: "band" },
  bowler: { color: "#2f2b2a", brim: [0.36, 0.28], height: 1.15, ring: 0.2, detail: "band" }
};
function Sy(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ?? "cap", s = Gr[n];
  if (!s) throw new Error(`hat: unknown style '${n}'`);
  return { style: n, color: e.color ?? s.color };
}
const Ke = (t, e) => t.brim[1] + (t.brim[0] - t.brim[1]) * (1 + Math.cos(e)) / 2;
function Ty(t, e) {
  return {
    top: 1,
    bottom: Math.min(...t.brim) - 0.05,
    inside: (n, s) => s - Ke(t, n),
    position(n, s) {
      const [o, i, r] = me(n, s), a = Ke(t, n), l = s > a ? (i - a) * (t.height - 1) : 0;
      return [o * e, i * e + l, r * e];
    },
    normal: (n, s) => me(n, s)
  };
}
function Ey(t, e, n) {
  const o = (i, r, a) => {
    const l = Ke(e, i) * n - a;
    return [Math.sin(i) * r, l, Math.cos(i) * r];
  };
  if (e.peak) {
    const i = [], r = [];
    for (let a = 0; a <= 24; a++) {
      const l = (-80 + 160 * a / 24) * (Math.PI / 180), c = e.peak * Math.cos(l) ** 0.6;
      i.push(Nt(t, [Math.sin(l) * (n + c * 0.25), Ke(e, l) * n - 0.07 * Math.cos(l), Math.cos(l) * (n + c)])), r.push(Nt(t, o(l, n, 0)));
    }
    return [...i, ...r.reverse()];
  }
  return e.ring ? Array.from({ length: 48 }, (i, r) => Nt(t, o(Math.PI * 2 * r / 48, n + e.ring, 0.07))) : null;
}
function Ay(t) {
  const e = (s) => Array.from({ length: 13 }, (o, i) => [s, Ke(t, s) + (0.97 - Ke(t, s)) * i / 12]), n = (s) => Array.from({ length: 49 }, (o, i) => {
    const r = -Math.PI + Math.PI * 2 * i / 48;
    return [r, Ke(t, r) + s];
  });
  switch (t.detail) {
    case "seams":
      return [e(0.55), e(-0.55)];
    case "fold":
      return [n(0.2)];
    case "ridge":
      return [e(0), e(Math.PI)];
    case "band":
      return [n(0.12)];
  }
}
function _0(t, e, n, s) {
  const o = Gr[n.style], r = 1 + s.lineWidth * 0.45 / e.rx + Math.max(0.05, Math.min(0.3, s.hairVolume) + 0.04), a = Math.max(1, s.lineWidth * 0.5), l = Ey(e, o, r);
  l && t.shape(l, n.color, a);
  const c = Ty(o, r), { near: h, far: d } = Ao(e, c);
  for (const f of [...d, ...h]) t.shape(f, n.color, a);
  const u = Math.max(0.8, a * 0.7);
  for (const f of Ay(o)) {
    const g = f.map(([m, b]) => {
      const [M, w, y] = c.position(m, b);
      return [M * 0.99, w * 0.99, y * 0.99];
    }), p = f.map(([m, b]) => me(m, b));
    for (const m of y0(e, g, p, 0.1)) t.line(m, u);
  }
  if (o.detail === "seams") {
    const f = Nt(e, [0, r * 1.01, 0]);
    t.dot(f.x, f.y, a * 0.9);
  }
}
function $y(t) {
  const e = t.hair ? ey(t.hair) : null;
  return {
    hair: e,
    facialHair: t.facialHair ? uy(t.facialHair, e?.color) : null,
    glasses: t.glasses ? ky(t.glasses) : null,
    hat: t.hat ? Sy(t.hat) : null,
    ears: t.ears ?? !1
  };
}
const H0 = (t) => !t.hair && !t.facialHair && !t.glasses && !t.hat && !t.ears, C0 = (t) => t.axes[2][2] < -0.3, R0 = (t) => t.ears && !t.hair?.coversEars;
function L0(t, e, n, s, o, i) {
  H0(n) || (n.hair && cy(e, t, s, n.hair, { ...i, motion: jr(o) }), n.facialHair && yy(e, t, s, n.facialHair, i), R0(n) && hy(e, t, s, i));
}
function Py(t, e, n, s, o, i, r) {
  if (H0(n)) {
    r();
    return;
  }
  const a = C0(s);
  R0(n) && dy(e, s, i), n.hair && !a && E0(e, s, n.hair, { ...i, motion: jr(o) }), n.facialHair && by(e, s, n.facialHair, i, o.mouthWidth ?? 1), r(), n.facialHair && wy(e, s, n.facialHair, i), n.glasses && xy(e, s, n.glasses, i), n.hat && !a && _0(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 });
}
function W0(t, e, n, s, o, i) {
  C0(s) && (n.hair && E0(e, s, n.hair, { ...i, motion: jr(o) }), n.hat && _0(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 }));
}
const Hl = 40, Iy = 0.215 + 0.205, Bt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}, dt = (t, e) => t[e] ?? pt[e] ?? 0;
function F0(t, e, n = pt, s = 1) {
  const o = To(t), i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (1 + Math.cos(i * 2 * (o.bounces ?? 1))) / 2, c = o.crouch ?? 0, h = o.shoulder ?? 0, d = o.forearm ?? 0, u = { ...pt, ...n };
  u["leg.left.swing"] = o.swing * r + c * 0.6, u["leg.right.swing"] = -o.swing * r + c * 0.6, u["leg.left.knee"] = o.knee * Math.max(0, a) + c * 1.2, u["leg.right.knee"] = o.knee * Math.max(0, -a) + c * 1.2, u["leg.left.ankle"] = dt(n, "leg.left.ankle") - (o.tiptoe ?? 0), u["leg.right.ankle"] = dt(n, "leg.right.ankle") - (o.tiptoe ?? 0);
  for (const [f, g] of [["left", -1], ["right", 1]])
    dt(n, `arm.${f}.spread`) > Hl || dt(n, `arm.${f}.swing`) > Hl || (u[`arm.${f}.swing`] = h + g * o.arm * r, u[`arm.${f}.elbow`] = dt(n, `arm.${f}.elbow`) + d + o.elbow * Math.max(0, g * r));
  return u.lean = dt(n, "lean") + o.lean * s, u.bend = dt(n, "bend") + (o.bend ?? 0), u["head.nod"] = dt(n, "head.nod") - o.lean * 0.5 * s + (o.headTilt ?? 0), u.side = dt(n, "side") + (o.sway ?? 0) * Math.sin(i), u.lift = dt(n, "lift") + (o.bounce ?? 0) * s * l, u.stretch = dt(n, "stretch") * (1 + (o.squash ?? 0) * (l - 0.5)), u;
}
function N0(t, e, n = 1, s = 1) {
  const o = To(t);
  return 4 * Iy * s * e * Math.sin(o.swing * n * Math.PI / 180);
}
const sn = (t) => u0[t], Vr = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: dt(t, "lean") - 4, ...Bt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Bt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Bt("leg", { swing: 25, knee: 60 }), ...sn("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Bt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Bt("arm", { spread: 70, bend: 0 }), ...Bt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Bt("arm", { spread: 60 }),
        "leg.left.swing": dt(t, "leg.left.swing"),
        "leg.right.swing": dt(t, "leg.right.swing"),
        "leg.left.knee": dt(t, "leg.left.knee"),
        "leg.right.knee": dt(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: dt(t, "stretch"), bend: dt(t, "bend"), ...sn("surprised"), ...Bt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": dt(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": dt(t, "head.nod") - 10, bend: dt(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...sn("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { lift: 0, stretch: 0.88, "head.nod": dt(t, "head.nod") - 4, bend: dt(t, "bend") + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: dt(t, "stretch"), "head.nod": dt(t, "head.nod"), bend: dt(t, "bend") }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
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
        ...sn("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Bt("arm", { spread: 75 }), ...Bt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": dt(t, "arm.left.spread"), "arm.right.spread": dt(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: dt(t, "stretch"), bend: dt(t, "bend"), ...Bt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...sn("scared"), ...Bt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: dt(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: dt(t, "side") + 2.5 * s, "head.tilt": dt(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: dt(t, "side"), "head.tilt": dt(t, "head.tilt"), bend: dt(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": dt(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...sn("sad"), bend: 18, stretch: 0.92, lean: dt(t, "lean") + 5, "head.nod": 14, ...Bt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function Oy(t, e) {
  const n = bt(e.from ?? {}), s = e.speed ?? 1;
  let o = n;
  return [
    { time: e.at, pose: n },
    ...Vr[t](n).map((i) => (o = { ...o, ...i.pose }, { time: e.at + i.after * s, pose: o, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function _y(t, e = pt) {
  const n = t * Math.PI * 2, s = Math.sin(n);
  return {
    ...e,
    lean: (e.lean ?? 0) + 14,
    bend: (e.bend ?? 0) + 8,
    side: 5 * s,
    "head.nod": 22,
    "arm.right.swing": 38 + 22 * s,
    "arm.right.spread": 6,
    "arm.right.elbow": 20 + 10 * Math.max(0, -s),
    "arm.right.bend": -10,
    "arm.left.swing": 52 + 22 * s,
    "arm.left.spread": 14,
    "arm.left.elbow": 35 + 10 * Math.max(0, s),
    "arm.left.bend": -20,
    "leg.left.swing": 10,
    "leg.right.swing": -10,
    "leg.left.knee": 8,
    "leg.right.knee": 4,
    "leg.left.spread": 8,
    "leg.right.spread": 8
  };
}
function Hy(t, e = pt) {
  const n = t * Math.PI * 2, s = Math.sin(n), o = Math.cos(n);
  return {
    ...e,
    lean: (e.lean ?? 0) + 4,
    side: 2 * s,
    "head.nod": 6,
    "arm.right.swing": 62,
    "arm.right.spread": 18 + 16 * s,
    "arm.right.elbow": 48 - 18 * Math.abs(s),
    "arm.right.bend": -30 + 8 * o,
    "arm.left.swing": 12,
    "arm.left.spread": 14,
    "arm.left.elbow": 12,
    "leg.left.spread": 6,
    "leg.right.spread": 6
  };
}
const Cl = { sweeping: _y, brushing: Hy };
function Bv(t, e, n = pt) {
  const s = Cl[t];
  if (!s) throw new Error(`humanCyclePose: ${ut("cycle", t, Object.keys(Cl))}`);
  return s(e, n);
}
const Cy = { apron: "#d8b48a", labCoat: "#f4f6f8", hoodie: "#6b7280", cardigan: "#6b8e4e", overalls: "", sari: "#16a34a" }, ii = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1), mt = (t, e, n) => ({ x: t.x + (e.x - t.x) * n, y: t.y + (e.y - t.y) * n });
function Ry(t) {
  return tr(t, t.parts["leg.left"].depth) > tr(t, t.parts["leg.right"].depth) ? "left" : "right";
}
const tr = (t, e) => Math.abs(e) < 0.01 * t.height ? 0 : e, Rl = (t) => tr(t, Math.max(t.parts["leg.left"].depth, t.parts["leg.right"].depth)) > 0, jt = (t) => Math.cos(t.turn * Math.PI / 2);
function Ly(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = t.sleeves ?? "short", o = t.bottom ?? "trousers", i = t.over === "labCoat", r = t.over === "hoodie", a = t.over === "cardigan", l = t.over === "overalls", c = t.over === "sari", h = t.overColor ?? (t.over && t.over !== "overalls" ? Cy[t.over] : n), d = t.shoes === "boots", u = t.shoeColor ?? "#3b2a1e", f = (T) => T.lineWidth * 0.45, g = (T, C, L) => {
    const $ = T.parts[`leg.${L}`].points;
    if (!(o === "skirt" && !l)) {
      if (o === "shorts" && !l) {
        const R = ii($, 0, 0.5);
        C.shape(Lt(R, T.height * 0.085, T.height * 0.07), n, f(T));
        return;
      }
      C.shape(Lt($, T.height * 0.08, T.height * 0.05), n, f(T));
    }
  }, p = (T, C, L) => {
    const $ = T.parts[`leg.${L}`].points, R = ii($, 0.7, 1);
    if (R.length < 2) return;
    C.shape(Lt(R, T.height * 0.075, T.height * 0.07), u, f(T));
    const N = R[0], q = R[1], D = q.x - N.x, z = q.y - N.y, G = Math.hypot(D, z) || 1, F = T.height * 0.04;
    C.line([{ x: N.x - z / G * F, y: N.y + D / G * F }, { x: N.x + z / G * F, y: N.y - D / G * F }], f(T) * 0.9);
  }, m = (T) => {
    const C = T.chains.spine, L = C[0], $ = C[C.length - 1], R = { x: L.x - ($.x - L.x) * 0.25, y: L.y - ($.y - L.y) * 0.25 };
    return { hip: L, top: $, below: R, line: [R, ...T.parts.spine.points] };
  }, b = (T, C) => {
    const L = r ? h : e, $ = r ? 1.14 : 1;
    C.shape(Lt(m(T).line, T.height * 0.15 * $, T.height * 0.14 * $), L, f(T));
  }, M = (T, C) => {
    const L = jt(T), { top: $, hip: R } = m(T), N = T.height * 0.07, q = { x: ($.x - R.x) * 0.16, y: ($.y - R.y) * 0.16 };
    if (L >= 0) {
      C.shape(
        [
          { x: $.x - N, y: $.y + q.y * 0.25 },
          { x: $.x - N * 0.8 + q.x, y: $.y + q.y },
          { x: $.x + q.x * 1.2, y: $.y + q.y * 1.35 },
          { x: $.x + N * 0.8 + q.x, y: $.y + q.y },
          { x: $.x + N, y: $.y + q.y * 0.25 }
        ],
        h,
        f(T)
      );
      return;
    }
    const D = mt($, R, 0.42);
    C.shape(
      [
        { x: $.x - N * 0.9, y: $.y },
        { x: $.x + N * 0.9, y: $.y },
        { x: D.x + N * 0.7, y: D.y },
        { x: D.x, y: D.y + T.height * 0.02 },
        { x: D.x - N * 0.7, y: D.y }
      ],
      h,
      f(T)
    );
  }, w = (T, C) => {
    const L = jt(T);
    if (L < 0.2) return;
    const { top: $, hip: R } = m(T), N = Math.sin(T.turn * Math.PI / 2) * T.height * 0.03, q = T.height * 0.06 * L, D = mt($, R, 0.62), z = mt($, R, 0.9);
    C.line([{ x: D.x + N - q, y: D.y }, { x: z.x + N - q * 1.1, y: z.y }], f(T) * 0.7), C.line([{ x: D.x + N + q, y: D.y }, { x: z.x + N + q * 1.1, y: z.y }], f(T) * 0.7);
    const G = mt($, R, 0.1);
    for (const F of [-1, 1]) C.line([{ x: G.x + N + F * q * 0.2, y: G.y }, { x: G.x + N + F * q * 0.35, y: G.y + T.height * 0.07 }], f(T) * 0.6);
  }, y = (T, C) => {
    const { top: L, hip: $ } = m(T), R = jt(T);
    if (C.shape(Lt([L, mt(L, $, 0.5), mt(L, $, 1.08)], T.height * 0.155, T.height * 0.15), h, f(T)), R < 0.2) return;
    const N = Math.sin(T.turn * Math.PI / 2) * T.height * 0.03, q = T.height * 0.02 * R, D = mt(L, $, 0.12), z = mt(L, $, 1.05);
    C.shape([{ x: D.x + N - q, y: D.y }, { x: D.x + N + q, y: D.y }, { x: z.x + N + q * 1.3, y: z.y }, { x: z.x + N - q * 1.3, y: z.y }], e, f(T) * 0.7);
    for (const G of [0.35, 0.55, 0.75]) {
      const F = mt(L, $, G);
      C.dot(F.x + N + q * 1.6, F.y, f(T) * 1.2);
    }
  }, S = (T, C) => {
    const L = jt(T), { top: $, hip: R } = m(T), N = Math.sin(T.turn * Math.PI / 2) * T.height * 0.04, q = mt(R, $, 0.12), D = mt(R, $, 0.74);
    if (L < 0.15) {
      if (L < -0.3) {
        const U = T.points["shoulder.left"], Y = T.points["shoulder.right"];
        C.line([U, { x: q.x + T.height * 0.03, y: q.y }], f(T) * 0.8), C.line([Y, { x: q.x - T.height * 0.03, y: q.y }], f(T) * 0.8);
      }
      return;
    }
    const z = T.height * 0.07 * L;
    C.shape(
      [
        { x: D.x + N - z * 0.75, y: D.y },
        { x: D.x + N + z * 0.75, y: D.y },
        { x: q.x + N + z * 1.1, y: q.y },
        { x: q.x + N - z * 1.1, y: q.y }
      ],
      n,
      f(T)
    );
    for (const U of ["left", "right"]) {
      const Y = T.points[`shoulder.${U}`], nt = { x: D.x + N + (Y.x > D.x + N ? 1 : -1) * z * 0.55, y: D.y };
      C.line([nt, { x: Y.x + (nt.x - Y.x) * 0.15, y: Y.y + (nt.y - Y.y) * 0.15 }], f(T) * 1.6);
    }
    const G = mt(D, q, 0.3), F = z * 0.4;
    C.line([{ x: G.x + N - F, y: G.y }, { x: G.x + N - F, y: G.y + F * 1.4 }, { x: G.x + N + F, y: G.y + F * 1.4 }, { x: G.x + N + F, y: G.y }], f(T) * 0.6);
  }, E = (T, C) => {
    const { hip: L, top: $ } = m(T), R = mt(L, $, 0.2), N = [T.points["ankle.left"], T.points["ankle.right"]], q = mt(L, { x: (N[0].x + N[1].x) / 2, y: (N[0].y + N[1].y) / 2 }, 0.98), D = T.height * 0.075, z = Math.max(T.height * 0.12, Math.abs(N[0].x - N[1].x) / 2 + T.height * 0.07), G = q.x - R.x, F = q.y - R.y, U = Math.hypot(G, F) || 1, Y = { x: -F / U, y: G / U };
    if (C.shape(
      [
        { x: R.x + Y.x * D, y: R.y + Y.y * D },
        { x: q.x + Y.x * z, y: q.y + Y.y * z },
        { x: q.x - Y.x * z, y: q.y - Y.y * z },
        { x: R.x - Y.x * D, y: R.y - Y.y * D }
      ],
      h,
      f(T)
    ), jt(T) > 0.2) {
      const ot = Math.sin(T.turn * Math.PI / 2) * T.height * 0.03;
      for (const it of [-0.35, 0, 0.35]) {
        const rt = D * 0.5 * it, H = z * 0.45 * it;
        C.line([{ x: R.x + ot + Y.x * rt, y: R.y + Y.y * rt + T.height * 0.02 }, { x: q.x + ot + Y.x * H, y: q.y + Y.y * H }], f(T) * 0.5);
      }
    }
  }, A = (T, C) => {
    const L = jt(T), { top: $, hip: R } = m(T), N = Math.sin(T.turn * Math.PI / 2), q = N >= 0 ? "left" : "right", D = q === "left" ? "right" : "left", z = T.points[`shoulder.${q}`], G = T.height * 0.035;
    if (L < 0.15) {
      const Y = mt($, R, 0.9);
      C.shape(Lt([z, { x: Y.x + (z.x - $.x) * 0.5, y: Y.y }], G * 2.2, G * 2.6), h, f(T));
      return;
    }
    const F = { x: R.x + (T.points[`hip.${D}`].x - R.x) * 1.2, y: mt(R, $, 0.08).y };
    C.shape(Lt([F, mt(F, z, 0.5), z], G * 2.4, G * 2), h, f(T));
    const U = { x: z.x - (R.x - z.x) * 0.05 - N * T.height * 0.03, y: z.y + T.height * 0.16 };
    C.shape(Lt([z, U], G * 2, G * 1.6), h, f(T));
  }, v = (T, C) => {
    const { hip: L, top: $ } = m(T), R = mt(L, $, 0.18), N = [T.points["knee.left"], T.points["knee.right"]], q = mt(L, { x: (N[0].x + N[1].x) / 2, y: (N[0].y + N[1].y) / 2 }, 1.05), D = T.height * 0.075, z = Math.max(T.height * 0.13, Math.abs(N[0].x - N[1].x) / 2 + T.height * 0.08), G = q.x - R.x, F = q.y - R.y, U = Math.hypot(G, F) || 1, Y = { x: -F / U, y: G / U };
    C.shape(
      [
        { x: R.x + Y.x * D, y: R.y + Y.y * D },
        { x: q.x + Y.x * z, y: q.y + Y.y * z },
        { x: q.x - Y.x * z, y: q.y - Y.y * z },
        { x: R.x - Y.x * D, y: R.y - Y.y * D }
      ],
      n,
      f(T)
    );
  }, k = (T, C) => {
    const L = jt(T);
    if (L < 0.2) return;
    const { top: $, hip: R } = m(T), N = { x: (R.x - $.x) * 0.12, y: (R.y - $.y) * 0.12 }, q = T.height * 0.045 * L;
    for (const D of [-1, 1])
      C.shape(
        [
          { x: $.x + D * q * 0.2, y: $.y + N.y * 0.1 },
          { x: $.x + D * q * 1.3, y: $.y - N.y * 0.1 },
          { x: $.x + D * q * 0.6 + N.x, y: $.y + N.y }
        ],
        e,
        f(T) * 0.8
      );
  }, x = (T, C, L) => {
    const $ = jt(T);
    if ($ < 0.25) return;
    const { top: R, hip: N } = m(T), q = Math.sin(T.turn * Math.PI / 2) * T.height * 0.03, D = (U) => ({ x: mt(R, N, U).x + q, y: mt(R, N, U).y }), z = T.height * 0.022 * $, G = D(0.08), F = D(0.62);
    C.shape([{ x: G.x - z, y: G.y - z }, { x: G.x + z, y: G.y - z }, { x: G.x + z * 0.6, y: G.y + z }, { x: G.x - z * 0.6, y: G.y + z }], L, f(T) * 0.7), C.shape([{ x: G.x - z * 0.6, y: G.y + z }, { x: G.x + z * 0.6, y: G.y + z }, { x: F.x + z * 1.4, y: F.y - z * 2 }, F, { x: F.x - z * 1.4, y: F.y - z * 2 }], L, f(T) * 0.7);
  }, P = (T, C) => {
    const L = jt(T), { top: $, hip: R } = m(T), N = mt(R, $, 0.72), q = [T.points["knee.left"], T.points["knee.right"]], D = mt(R, { x: (q[0].x + q[1].x) / 2, y: (q[0].y + q[1].y) / 2 }, 0.9), z = Math.sin(T.turn * Math.PI / 2) * T.height * 0.04;
    if (L < 0.15) {
      const U = mt(R, $, 0.2);
      L < -0.3 && C.line([{ x: U.x - T.height * 0.05, y: U.y }, { x: U.x + T.height * 0.05, y: U.y }], f(T));
      return;
    }
    const G = T.height * 0.075 * L, F = mt(R, $, 0.2);
    C.shape(
      [
        { x: N.x + z - G * 0.7, y: N.y },
        { x: N.x + z + G * 0.7, y: N.y },
        { x: F.x + z + G, y: F.y },
        { x: D.x + z + G * 1.15, y: D.y },
        { x: D.x + z - G * 1.15, y: D.y },
        { x: F.x + z - G, y: F.y }
      ],
      h,
      f(T)
    ), C.line([{ x: N.x + z - G * 0.6, y: N.y }, { x: $.x - G * 0.2, y: $.y }, { x: N.x + z + G * 0.6, y: N.y }], f(T) * 0.8);
  }, I = (T, C, L) => {
    const { top: $, hip: R } = m(T), N = [T.points["knee.left"], T.points["knee.right"]], q = mt(R, { x: (N[0].x + N[1].x) / 2, y: (N[0].y + N[1].y) / 2 }, 0.95);
    L ? C.shape(Lt([mt($, R, 0.8), R, q], T.height * 0.145, T.height * 0.17), h, f(T)) : C.shape(Lt([$, mt($, R, 0.5), R], T.height * 0.14, T.height * 0.15), h, f(T));
    const D = jt(T);
    if (D > 0.2) {
      const z = Math.sin(T.turn * Math.PI / 2) * T.height * 0.03, [G, F] = L ? [R, q] : [$, R];
      if (C.line([{ x: G.x + z, y: G.y }, { x: F.x + z, y: F.y }], f(T) * 0.8), !L) {
        const U = mt($, R, 0.35), Y = T.height * 0.025 * D;
        C.shape([{ x: U.x + z - Y * 2.4, y: U.y }, { x: U.x + z - Y * 0.6, y: U.y }, { x: U.x + z - Y * 0.6, y: U.y + Y * 1.6 }, { x: U.x + z - Y * 2.4, y: U.y + Y * 1.6 }], h, f(T) * 0.6);
      }
    }
  }, O = (T, C, L, $, R) => {
    const N = T.parts[`arm.${L}`].points, q = N[0], D = T.chains.spine[T.chains.spine.length - 1], G = [{ x: q.x + (D.x - q.x) * 0.45, y: q.y + (D.y - q.y) * 0.45 }, ...ii(N, 0, R)], F = Lt(G, T.height * 0.085, T.height * (R > 0.6 ? 0.045 : 0.06)), U = G.length, Y = F.slice(0, U), nt = F.slice(U).reverse();
    C.shape(F, $, 0);
    const ot = (H) => Math.hypot(H[1].x - D.x, H[1].y - D.y), [it, rt] = ot(Y) > ot(nt) ? [Y, nt] : [nt, Y];
    C.line(it.slice(1), f(T)), C.line(rt.slice(Math.ceil(U * 0.45)), f(T)), C.line([Y[U - 1], nt[U - 1]], f(T));
  }, _ = i || r || a, W = _ ? h : e, B = _ || s === "long" ? 0.95 : 0.45, j = _ || s !== "none", V = (T, C) => {
    o === "skirt" && !l && !c && v(T, C), c && E(T, C), i && I(T, C, !0), t.over === "apron" && P(T, C);
  }, K = (T) => (C, L, $) => {
    g(L, $, T), d && p(L, $, T), Ry(L) === T && Rl(L) && V(L, $);
  };
  return {
    parts: {
      "leg.left": { over: K("left") },
      "leg.right": { over: K("right") },
      spine: {
        over: (T, C, L) => {
          r && jt(C) >= 0 && M(C, L), b(C, L), t.collar && !r && k(C, L), t.tie && !r && x(C, L, t.tie), i && I(C, L, !1), a && y(C, L), r && (jt(C) < 0 && M(C, L), w(C, L)), l && S(C, L), c && A(C, L), Rl(C) || V(C, L);
        }
      },
      "arm.left": { over: j ? (T, C, L) => O(C, L, "left", W, B) : void 0 },
      "arm.right": { over: j ? (T, C, L) => O(C, L, "right", W, B) : void 0 }
    }
  };
}
const D0 = {
  mug: { color: "#e2493b", hands: "one" },
  phone: { color: "#2b2f36", hands: "one" },
  book: { color: "#3a6ea5", hands: "either" },
  bag: { color: "#e9d8b4", hands: "one" },
  briefcase: { color: "#6b4630", hands: "one" },
  umbrella: { color: "#3c9a6e", hands: "one" },
  broom: { color: "#c8963e", hands: "one" },
  cane: { color: "#6b4630", hands: "one" },
  parcel: { color: "#c9a06a", hands: "both" }
};
function Wy(t) {
  const e = {};
  for (const n of ["left", "right", "both"]) {
    const s = t[n];
    if (!s) continue;
    const o = typeof s == "string" ? s : s.item, i = D0[o];
    if (!i) throw new Error(`holding: unknown item '${o}'`);
    if (n === "both" && i.hands === "one") throw new Error(`holding: a ${o} is held in one hand ('left' or 'right'), not 'both'`);
    if (n !== "both" && i.hands === "both") throw new Error(`holding: a ${o} is held in both hands ('both')`);
    e[n] = { item: o, color: (typeof s == "object" ? s.color : void 0) ?? i.color };
  }
  return e;
}
function ri(t, e) {
  const n = t.chains[`arm.${e}`], s = n[n.length - 1], o = n[n.length - 2], i = Math.hypot(s.x - o.x, s.y - o.y) || 1, r = { x: (s.x - o.x) / i, y: (s.y - o.y) / i }, a = t.lineWidth * 0.5;
  return { point: { x: s.x + r.x * a, y: s.y + r.y * a }, along: r, depth: t.parts[`arm.${e}`]?.depth ?? 0 };
}
function on(t, e, n, s = 0) {
  const o = Math.cos(s), i = Math.sin(s);
  return [
    [-e / 2, -n / 2],
    [e / 2, -n / 2],
    [e / 2, n / 2],
    [-e / 2, n / 2]
  ].map(([r, a]) => ({ x: t.x + r * o - a * i, y: t.y + r * i + a * o }));
}
const rn = (t, e, n, s, o = 12) => Array.from({ length: o + 1 }, (i, r) => {
  const a = n + (s - n) * r / o;
  return { x: t.x + Math.cos(a) * e, y: t.y + Math.sin(a) * e };
});
function Ll(t, e, n, s, o, i = 1, r) {
  const { point: a, along: l } = n, c = s / 300;
  switch (e.item) {
    case "mug": {
      const h = on({ x: a.x, y: a.y - 4 * c }, 20 * c, 24 * c);
      t.line(rn({ x: a.x + 10 * c * Math.sign(i || 1), y: a.y - 4 * c }, 7 * c, -Math.PI / 2, Math.PI / 2).map((d) => ({ x: a.x + (d.x - a.x) * Math.sign(i || 1), y: d.y })), o), t.shape(h, e.color, o);
      return;
    }
    case "phone": {
      const h = Math.atan2(l.y, l.x) - Math.PI / 2;
      t.shape(on(a, 13 * c, 24 * c, h), e.color, o), t.shape(on(a, 9 * c, 17 * c, h), "#8fd0f5", 0);
      return;
    }
    case "book": {
      const h = 26 * c, d = 34 * c;
      t.shape([{ x: a.x, y: a.y - d / 2 }, { x: a.x - h, y: a.y - d / 2 - 3 * c }, { x: a.x - h, y: a.y + d / 2 - 3 * c }, { x: a.x, y: a.y + d / 2 }], e.color, o), t.shape([{ x: a.x, y: a.y - d / 2 }, { x: a.x + h, y: a.y - d / 2 - 3 * c }, { x: a.x + h, y: a.y + d / 2 - 3 * c }, { x: a.x, y: a.y + d / 2 }], e.color, o);
      for (const u of [-1, 1])
        for (const f of [0.3, 0.5, 0.7]) {
          const g = a.y - d / 2 + d * f;
          t.line([{ x: a.x + u * 5 * c, y: g }, { x: a.x + u * (h - 5 * c), y: g - 2 * c }], Math.max(0.8, o * 0.5));
        }
      return;
    }
    case "bag": {
      const h = a.y + 10 * c;
      t.line([{ x: a.x - 9 * c, y: h }, { x: a.x - 5 * c, y: a.y - 2 * c }, { x: a.x + 5 * c, y: a.y - 2 * c }, { x: a.x + 9 * c, y: h }], o), t.shape([{ x: a.x - 17 * c, y: h }, { x: a.x + 17 * c, y: h }, { x: a.x + 20 * c, y: h + 40 * c }, { x: a.x - 20 * c, y: h + 40 * c }], e.color, o);
      return;
    }
    case "briefcase": {
      t.line(rn({ x: a.x, y: a.y + 6 * c }, 7 * c, Math.PI, Math.PI * 2), o), t.shape(on({ x: a.x, y: a.y + 22 * c }, 46 * c, 32 * c), e.color, o), t.line([{ x: a.x - 23 * c, y: a.y + 14 * c }, { x: a.x + 23 * c, y: a.y + 14 * c }], Math.max(0.8, o * 0.6));
      return;
    }
    case "umbrella": {
      const h = 78 * c, d = (r ?? a.y - 120 * c) - 14 * c, u = { x: a.x, y: Math.min(a.y - 60 * c, d - h * 0.55) };
      t.line([{ x: a.x, y: a.y + 10 * c }, u], o), t.line(rn({ x: a.x + 5 * c, y: a.y + 10 * c }, 5 * c, Math.PI, 0, 8), o);
      const f = [...rn({ x: u.x, y: u.y + h * 0.55 }, h, Math.PI, Math.PI * 2, 24)], g = [];
      for (let p = 4; p >= 0; p--) {
        const m = u.x - h + 2 * h * p / 5;
        g.push(...rn({ x: m + h / 5, y: u.y + h * 0.55 }, h / 5, 0, -Math.PI, 6).reverse());
      }
      t.shape([...f, ...g], e.color, o);
      return;
    }
    case "broom": {
      const h = { x: l.x * 0.4 + 0.25 * Math.sign(i || 1), y: Math.max(0.6, l.y) }, d = Math.hypot(h.x, h.y), u = { x: h.x / d, y: h.y / d }, f = { x: a.x - u.x * 40 * c, y: a.y - u.y * 40 * c }, g = { x: a.x + u.x * 120 * c, y: a.y + u.y * 120 * c };
      t.line([f, g], o * 1.1);
      const p = { x: -u.y, y: u.x }, m = [
        { x: g.x + p.x * 6 * c, y: g.y + p.y * 6 * c },
        { x: g.x - p.x * 6 * c, y: g.y - p.y * 6 * c },
        { x: g.x - p.x * 16 * c + u.x * 34 * c, y: g.y - p.y * 16 * c + u.y * 34 * c },
        { x: g.x + p.x * 16 * c + u.x * 34 * c, y: g.y + p.y * 16 * c + u.y * 34 * c }
      ];
      t.shape(m, e.color, o);
      return;
    }
    case "cane": {
      const h = Math.min(0.56 * s, Math.max(0.3 * s, -a.y)), d = 0.12 * Math.sign(i || 1), u = { x: d / Math.hypot(d, 1), y: 1 / Math.hypot(d, 1) }, f = { x: a.x + u.x * h, y: a.y + u.y * h }, g = rn({ x: a.x + 7 * c * Math.sign(i || 1), y: a.y - 2 * c }, 7 * c, Math.PI, Math.PI * 2, 8).map((p) => ({ x: a.x + (p.x - a.x) * Math.sign(i || 1), y: p.y }));
      t.line([...g, { x: a.x, y: a.y + 2 * c }, f], o * 1.2), t.shape(on({ x: f.x, y: f.y - 3 * c }, 9 * c, 7 * c), e.color, 0);
      return;
    }
    case "parcel": {
      const h = { x: a.x, y: a.y - 6 * c };
      t.shape(on(h, 50 * c, 40 * c), e.color, o), t.line([{ x: h.x - 25 * c, y: h.y - 6 * c }, { x: h.x + 25 * c, y: h.y - 6 * c }], Math.max(0.8, o * 0.7)), t.line([{ x: h.x, y: h.y - 20 * c }, { x: h.x, y: h.y + 20 * c }], Math.max(0.8, o * 0.7));
      return;
    }
  }
}
const Wl = (t, e) => (t[`held.${e}`] ?? 1) >= 0.5, Fl = (t) => Math.sin(t * Math.PI / 2);
function Fy(t) {
  const e = (i) => Math.max(1, i.lineWidth * 0.45), n = (i) => (r, a, l, c, h) => {
    const d = t[i];
    d && Wl(h ?? {}, i) && Ll(l, d, ri(a, i), a.height, e(a), Fl(a.turn), a.head.center.y - a.head.ry);
  }, s = (i, r, a, l, c) => {
    const h = t.both;
    if (!h || !Wl(c ?? {}, "both")) return;
    const d = ri(r, "left"), u = ri(r, "right"), f = {
      point: { x: (d.point.x + u.point.x) / 2, y: (d.point.y + u.point.y) / 2 },
      along: { x: (d.along.x + u.along.x) / 2, y: (d.along.y + u.along.y) / 2 },
      depth: (d.depth + u.depth) / 2
    };
    Ll(a, h, f, r.height, e(r), Fl(r.turn), r.head.center.y - r.head.ry);
  }, o = { parts: {} };
  if (t.left && (o.parts["arm.left"] = { over: n("left") }), t.right && (o.parts["arm.right"] = { over: n("right") }), t.both) {
    const i = (r) => (a, l, c, h, d) => {
      const u = r === "left" ? "right" : "left";
      (r === "left" ? l.parts["arm.left"].depth >= l.parts["arm.right"].depth : l.parts["arm.right"].depth > l.parts[`arm.${u}`].depth) && s(a, l, c, h, d);
    };
    for (const r of ["left", "right"]) o.parts[`arm.${r}`] = { ...o.parts[`arm.${r}`], over: Ny(o.parts[`arm.${r}`]?.over, i(r)) };
  }
  return o;
}
function Ny(t, e) {
  return t ? (n, s, o, i, r) => {
    t(n, s, o, i, r), e(n, s, o, i, r);
  } : e;
}
function Nl(t, e) {
  const n = (o, i) => o && i ? (r, a, l, c, h) => {
    o(r, a, l, c, h), i(r, a, l, c, h);
  } : o ?? i, s = {};
  for (const o of /* @__PURE__ */ new Set([...Object.keys(t.parts ?? {}), ...Object.keys(e.parts ?? {})])) {
    const i = t.parts?.[o], r = e.parts?.[o];
    s[o] = { under: n(i?.under, r?.under), over: n(i?.over, r?.over) };
  }
  return { behind: n(t.behind, e.behind), parts: s, front: n(t.front, e.front) };
}
function B0(t = {}) {
  if (t.build && !(t.build in Ui)) throw new Error(`character: unknown build '${t.build}'`);
  const e = t.build ? Ui[t.build] : {}, n = (t.proportions ?? "bold") === "bold", s = t.figure ?? "fluid", o = t.look ?? "clean", i = t.height ?? 300, r = s === "stick", a = t.outfit ? Ly(t.outfit) : null, l = t.holding ? Wy(t.holding) : {};
  let c = a ? Nl(a, t.layers ?? {}) : t.layers ?? {};
  return Object.keys(l).length > 0 && (c = Nl(c, Fy(l))), {
    plan: t.plan ?? R1({
      headSize: t.headSize ?? e.headSize ?? (n ? 0.3 : 0.24),
      shoulderWidth: r ? 0 : t.shoulderWidth ?? e.shoulderWidth ?? 0.06,
      hipWidth: r ? 0 : t.hipWidth ?? e.hipWidth ?? 0.022,
      legLength: t.legLength ?? e.legLength ?? 1,
      armLength: t.armLength ?? e.armLength ?? 1,
      feet: t.feet ?? e.feet
    }),
    figure: s,
    look: o,
    height: i,
    lineWidth: t.lineWidth ?? i * (n ? 0.045 : 0.022),
    ink: t.ink ?? (o === "pencil" ? "#2f2f33" : "#1e293b"),
    skin: t.skin ?? (o === "pencil" ? "none" : "#ffffff"),
    seed: t.seed ?? 1,
    pencil: t.pencil ?? {},
    layers: c,
    holding: l,
    contact: t.contact ?? "ground",
    hands: t.hands ?? "dot",
    handStyle: t.handStyle ?? "glove",
    handSize: t.handSize ?? (t.handStyle === "natural" ? 0.14 : 0.17),
    head: $y(t),
    face: { teeth: t.face?.teeth ?? !1, tongue: t.face?.tongue ?? !1 }
  };
}
function qv(t, e, n, s) {
  const { point: o, facing: i } = qr(t, [e, n, s]);
  return { point: o, facing: i };
}
const er = (t) => t.rest[1] < -0.5, Dy = 0.3;
function By(t, e, n) {
  return t.figure === "stick" ? er(e) ? n.slice(0, 3) : n : er(e) && n.length >= 3 ? Tn(n[0], n[1], n[2], Dy) : n.length === 3 ? Tn(n[0], n[1], n[2], 1) : n;
}
function Jr(t, e) {
  const n = t.plan.id === "human" ? { ...pt, ...e } : e;
  return Po(t, n, Nr(t.plan, n, { height: t.height, contact: t.contact }));
}
function Po(t, e, n) {
  const s = {}, o = {}, i = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((u) => {
    const f = n.chains[u.id];
    s[u.id] = f.points;
    const g = f.depths.reduce((M, w) => M + w, 0) / f.depths.length, p = u.parent ? n.chains[u.parent] : void 0, m = p ? p.depths[u.at ?? p.depths.length - 1] : 0, b = g - m;
    i[u.id] = Math.abs(b) < r ? 0 : b, o[u.id] = { points: By(t, u, f.points), depth: g };
  }), o.head = { points: [n.head.center], depth: n.head.depth }, i.head = 0;
  const a = [...t.plan.chains.map((u) => u.id), "head"], l = [...a].sort((u, f) => i[u] - i[f] || a.indexOf(u) - a.indexOf(f)), c = { hip: n.hip };
  for (const [u, [f, g]] of Object.entries(t.plan.landmarks ?? {})) {
    const p = n.chains[f]?.points;
    p && (c[u] = p[Math.min(g, p.length - 1)]);
  }
  const h = {};
  for (const [u, f] of Object.entries(c)) h[u] = f.y >= n.groundY - 0.01 * t.height;
  const d = {
    height: t.height,
    lineWidth: t.lineWidth,
    turn: e.turn ?? 0,
    points: c,
    chains: s,
    parts: o,
    head: n.head,
    groundY: n.groundY,
    grounded: h
  };
  return { skeleton: n, joints: d, order: l };
}
function se(t, e) {
  return Jr(t, e).joints;
}
function q0(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const o = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), i = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = Et(s, o, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide(Et(s, i, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function z0(t, e, n, s, o, i) {
  const r = n.lineWidth;
  if (o === "head") {
    const { head: f } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(f.center.x, f.center.y, f.rx, f.ry, f.angle, g, r), Py(t, e, n.head, f, i, { lineWidth: r, skin: n.skin }, () => {
      e.look !== "silhouette" && V1(e, f, i, r, n.face);
    });
    return;
  }
  const a = n.plan.chains.find((f) => f.id === o), l = s.chains[o], c = s.parts[o].points;
  if (n.figure === "stick") {
    if (o === "neck") return;
    const f = o === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(f, r);
    return;
  }
  const h = (f, g) => [a.bones[f].width[0] * r, a.bones[g].width[1] * r];
  if (er(a)) {
    const [f, g] = h(0, 1);
    if (e.limb(c, f, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && o.startsWith("arm."))
      zy(t, e, n, l, o.endsWith(".left") ? "left" : "right", i);
    else {
      const p = l[l.length - 1];
      e.dot(p.x, p.y, r * 0.62);
    }
    return;
  }
  if (o === "spine") {
    const f = s.points["hip.left"], g = s.points["hip.right"];
    f && g && Math.hypot(f.x - g.x, f.y - g.y) > 0.5 && e.limb([f, g], r * 1.3, r * 1.3);
    const [p, m] = h(0, a.bones.length - 1);
    e.limb(c, p, m);
    const b = s.points["shoulder.left"], M = s.points["shoulder.right"];
    b && M && Math.hypot(b.x - M.x, b.y - M.y) > 0.5 && e.limb(Tn(b, l[l.length - 1], M, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [d, u] = h(0, a.bones.length - 1);
  e.limb(c, d, u);
}
function qy(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const o = t.turn ?? 0, i = e === "right" ? 1 - o : 1 + o;
  return { ...Pt, ...s, turn: i + (s.turn ?? 0) };
}
function zy(t, e, n, s, o, i) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  Or(t, r, qy(i, o), {
    size: n.handSize * n.height,
    side: o,
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
function Yy(t, e, n, s = 0) {
  const o = e.plan.id === "human" ? { ...pt, ...n } : n;
  Y0(t, e, o, Jr(e, o), s);
}
function Zr(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function zv(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...pt, ...e } : e, i = Br(t.plan, o, { height: s.height, contact: t.contact }, n);
  return Po(Zr(t, i.height), o, i).joints;
}
function Yv(t, e, n, s, o) {
  const i = e.plan.id === "human" ? { ...pt, ...n } : n, r = Br(e.plan, i, { height: o.height, contact: e.contact }, s), a = Zr(e, r.height);
  Y0(t, a, i, Po(a, i, r), o.time ?? 0);
}
function Ky(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...pt, ...e } : e, i = Br(t.plan, o, { height: s.height, contact: t.contact }, n), r = Zr(t, i.height), { joints: a, order: l } = Po(r, o, i), c = i.height / s.height;
  return l.map((h, d) => ({
    part: h,
    depth: (a.parts[h]?.depth ?? 0) / c,
    draw(u, f = 0) {
      const g = So(u, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: oe(`${r.seed}:${h}`), time: f, pencil: r.pencil }), p = (b) => {
        b && (u.save(), b(u, a, g, f, o), u.restore());
      };
      u.save(), u.lineCap = "round", u.lineJoin = "round", d === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && q0(g, r, a), p(r.layers.behind), L0(u, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }));
      const m = r.layers.parts?.[h];
      p(m?.under), z0(u, g, r, a, h, o), p(m?.over), d === l.length - 1 && (W0(u, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }), p(r.layers.front)), u.restore();
    }
  }));
}
function Y0(t, e, n, s, o) {
  const { joints: i, order: r } = s, a = So(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: o,
    pencil: e.pencil
  }), l = (c) => {
    c && (t.save(), c(t, i, a, o, n), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", e.look === "pencil" && e.pencil.construction !== !1 && q0(a, e, i), l(e.layers.behind), L0(t, a, e.head, i.head, n, { lineWidth: e.lineWidth, skin: e.skin });
  for (const c of r) {
    const h = e.layers.parts?.[c];
    l(h?.under), z0(t, a, e, i, c, n), l(h?.over);
  }
  W0(t, a, e.head, i.head, n, { lineWidth: e.lineWidth, skin: e.skin }), l(e.layers.front), t.restore();
}
function jy(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
function Pe(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...pt, ...e } : e;
  let i;
  if (Array.isArray(s))
    i = s;
  else {
    const { skeleton: r } = Jr(t, o), a = Nr(t.plan, { ...o, roll: 0 }, { height: t.height, contact: "none" }), l = (o.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, d = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), u = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), f = Math.PI / 2 * (o.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(f), m = Math.sin(f);
    i = [d * p - g * m, -u, d * m + g * p];
  }
  return z1(t.plan, o, n, i, { height: t.height });
}
const K0 = /* @__PURE__ */ new Set(["walk", "walking", "gait"]);
function Qr(t, e = pt, n) {
  let s = { ...e };
  for (const [i, r] of Object.entries(t))
    typeof r == "number" && !K0.has(i) && (s[i] = r);
  const o = Math.max(0, Math.min(1, typeof t.walking == "number" ? t.walking : 0));
  if (o > 0) {
    const i = typeof t.gait == "string" ? t.gait : void 0, r = i ? n?.[i] ?? i : void 0, a = F0(r, typeof t.walk == "number" ? t.walk : 0, s);
    s = Object.fromEntries(Object.keys({ ...s, ...a }).map((l) => [l, (s[l] ?? 0) + ((a[l] ?? 0) - (s[l] ?? 0)) * o]));
  }
  return s;
}
function Kv(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, o = e.plan.id === "human" ? pt : {};
  return {
    type: "custom",
    x: t.x - n / 2,
    y: t.y - s,
    width: n,
    height: s,
    props: { ...o, ...t.pose },
    character: e,
    ...t.gaits ? { gaits: t.gaits } : {},
    draw(i, r, a) {
      i.translate(n / 2, s), Yy(i, e, Qr(r.props ?? {}, o, t.gaits), a);
    }
  };
}
function Xy(t, e, n) {
  const s = (i) => ({ x: i.x + e, y: i.y + n }), o = (i) => Object.fromEntries(Object.entries(i).map(([r, a]) => [r, a.map(s)]));
  return {
    ...t,
    points: Object.fromEntries(Object.entries(t.points).map(([i, r]) => [i, s(r)])),
    chains: o(t.chains),
    parts: Object.fromEntries(Object.entries(t.parts).map(([i, r]) => [i, { ...r, points: r.points.map(s) }])),
    head: { ...t.head, center: s(t.head.center) },
    groundY: t.groundY + n
  };
}
function jv(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "x" || c === "motionPathX" ? i = typeof h == "number" ? h : i : c === "y" || c === "motionPathY" ? r = typeof h == "number" ? h : r : (typeof h == "number" || K0.has(c)) && (o[c] = h);
  const a = Qr(o, s.plan.id === "human" ? pt : {}, t.gaits), l = se(s, a);
  return { pose: a, joints: Xy(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function j0(t, e = pt) {
  const n = [];
  return t.forEach((s, o) => {
    const i = o === 0 ? e : n[o - 1], r = typeof s.pose == "string" ? ce[s.pose] : void 0;
    n.push(r ? { ...r, turn: i.turn ?? 0 } : { ...i, ...s.pose });
  }), n;
}
function Xv(t, e, n = pt) {
  const s = j0(e, n);
  return Object.keys(n).filter((i) => s.some((r) => (r[i] ?? n[i]) !== n[i])).map((i) => ({
    id: `${t}-${i}`,
    target: t,
    property: i,
    keyframes: e.map((r, a) => ({
      time: r.time,
      value: s[a][i] ?? n[i],
      ...r.easing ? { easing: r.easing } : {}
    }))
  }));
}
const ai = /* @__PURE__ */ new Map();
function Uy(t) {
  const e = ai.get(t);
  if (e) return e;
  let n = [1, 1, 1];
  const s = t.trim().replace("#", "");
  if (t.trim().startsWith("#") && (s.length === 3 || s.length === 6)) {
    const o = s.length === 3 ? s.split("").map((i) => i + i).join("") : s;
    n = [0, 2, 4].map((i) => Number.parseInt(o.slice(i, i + 2), 16) / 255);
  } else {
    const o = t.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    o && (n = [Number(o[1]) / 255, Number(o[2]) / 255, Number(o[3]) / 255]);
  }
  return ai.size < 512 && ai.set(t, n), n;
}
Ue([-3, -5, -4]);
const Gy = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function X0(t, e, n) {
  const s = [0, 0, 0];
  for (const o of n) {
    const i = Uy(o.color);
    let r;
    if (o.light === "ambient")
      r = o.intensity;
    else if (o.light === "directional")
      r = o.intensity * Math.max(0, -Ae(e, o.direction));
    else {
      const a = $n(o.position, t), l = vo(a), c = l > 0 ? yn(a, 1 / l) : e, h = o.range ? Math.max(0, 1 - l / o.range) ** 2 : 1;
      if (r = o.intensity * Math.max(0, Ae(e, c)) * h, o.light === "spot") {
        const d = Math.cos(o.angle * Math.PI / 180), u = Math.cos(o.angle * 0.8 * Math.PI / 180);
        r *= Gy(d, u, -Ae(c, o.direction));
      }
    }
    s[0] += i[0] * r, s[1] += i[1] * r, s[2] += i[2] * r;
  }
  return s;
}
function U0(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function G0(t, e, n = {}) {
  t.save(), Vy(t, e, n), t.restore();
}
function Vy(t, e, n) {
  const s = V0(e, n);
  n.shadow !== !1 && J0(t, e, n);
  for (const o of e.under) Dl(t, o, s, n);
  if (n.rider) {
    if (t.save(), e.openings.length > 0) {
      t.beginPath();
      for (const o of e.openings) {
        t.moveTo(o[0].x, o[0].y);
        for (const i of o.slice(1)) t.lineTo(i.x, i.y);
        t.closePath();
      }
      t.clip("nonzero");
    }
    n.rider(t), t.restore();
  }
  for (const o of e.over) Dl(t, o, s, n);
}
function Dl(t, e, n, s) {
  const o = s.loose?.[e.part.id];
  if (!o) {
    nr(t, e, n, s);
    return;
  }
  if (o.opacity <= 0) return;
  const i = e.faces.flatMap((c) => c.points);
  if (i.length === 0) return;
  const r = i.map((c) => c.x), a = i.map((c) => c.y), l = { x: (Math.min(...r) + Math.max(...r)) / 2, y: (Math.min(...a) + Math.max(...a)) / 2 };
  t.save(), t.globalAlpha *= Math.min(1, o.opacity), t.translate(l.x + o.x, l.y + o.y), t.rotate(o.rotate * Math.PI / 180), t.translate(-l.x, -l.y), nr(t, e, n, s), t.restore();
}
function V0(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function J0(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, Io(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function Uv(t, e, n, s = {}) {
  t.save(), nr(t, e, n, s), t.restore();
}
function Jy(t, e, n, s = {}) {
  const o = s.style === "stick", i = e.flatMap((h) => {
    if (o && h.part.solidOnly) return [];
    const d = h.part.layer ?? 0;
    return o && h.spine ? [{ depth: h.depth, layer: d, part: h }] : h.faces.map((u) => ({ depth: u.depth, layer: d, part: h, face: u }));
  }), r = /* @__PURE__ */ new Map();
  for (const h of i) {
    const d = h.face?.normal;
    if (!h.face?.center || !d) continue;
    const u = Math.abs(d[0]) >= Math.abs(d[1]) && Math.abs(d[0]) >= Math.abs(d[2]) ? 0 : Math.abs(d[1]) >= Math.abs(d[2]) ? 1 : 2, f = u * 2 + (d[u] < 0 ? 1 : 0);
    r.set(f, [...r.get(f) ?? [], h]);
  }
  for (const h of r.values())
    for (const d of h) {
      const { center: u, normal: f } = d.face;
      for (const g of h) {
        if (g.part.part.id === d.part.part.id) continue;
        const p = g.face;
        if (p.normal[0] * f[0] + p.normal[1] * f[1] + p.normal[2] * f[2] <= 0.8) continue;
        const b = p.normal[0] * (u[0] - p.center[0]) + p.normal[1] * (u[1] - p.center[1]) + p.normal[2] * (u[2] - p.center[2]);
        b > -Bl / 5 && b < Bl && (d.layer = Math.max(d.layer, g.layer), d.depth = Math.max(d.depth, g.depth + 1e-6));
      }
    }
  i.sort((h, d) => h.layer - d.layer || h.depth - d.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let d = a.get(h.part.id);
    return d || a.set(h.part.id, d = ta(t, h, n, s)), d;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: d } of i) {
    t.globalAlpha = c * h.opacity;
    const u = l(h);
    if (!d) u.line(h.spine, n * 1.15);
    else {
      const f = o ? Z0(h, s) : d.light ? Zy(h, d, s) : ea(h);
      f && (!o && s.look === "silhouette" ? u.shape(d.points, f, 0) : Io(t, d.points, o || d.light ? f : sa(f, d.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of d.edges ?? []) p.length > 1 && u.line(p, g);
      for (const p of d.marks ?? []) u.line(p, n * 0.7);
    }
  }
  t.restore();
}
const Bl = 0.05;
function ta(t, e, n, s) {
  return So(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: oe(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function ea(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? td(e.fill, e.glow.color, t.glow) : e.fill;
}
function Zy(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const o = Q0(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? td(o, s.glow.color, t.glow) : o;
}
function Z0(t, e) {
  const n = ea(t);
  return n && (tb(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function nr(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, ql(t, e, n, s), t.restore()) : ql(t, e, n, s);
}
function ql(t, e, n, s) {
  if (s.style === "stick") return Qy(t, e, n, s);
  const { part: o } = e, i = ta(t, e, n, s), r = ea(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? i.shape(c.points, r, 0) : Io(t, c.points, sa(r, c.tone)));
  const l = (o.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && i.line(c, l);
  for (const c of e.marks) i.line(c, n * 0.7);
}
function Qy(t, e, n, s) {
  const { part: o } = e;
  if (o.solidOnly) return;
  const i = ta(t, e, n, s);
  if (e.spine) {
    i.line(e.spine, n * 1.15);
    return;
  }
  const r = Z0(e, s);
  for (const l of e.faces) Io(t, l.points, r);
  const a = (o.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && i.line(l, a);
  for (const l of e.marks) i.line(l, n * 0.7);
}
function tb(t) {
  const e = En(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function Io(t, e, n, s = !0, o = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let i = 1; i < e.length; i++) t.lineTo(e[i].x, e[i].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = o, t.lineJoin = "round", t.stroke());
}
function En(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const na = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function sa(t, e) {
  const n = En(t);
  return n ? na(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function Q0(t, e, n, s) {
  const o = En(t);
  if (!o) return t;
  let i = o.map((a, l) => a * e[l]);
  const r = s ? En(s) : void 0;
  return r && n > 0 && (i = i.map((a, l) => a + (r[l] - a) * n)), na(i);
}
function td(t, e, n) {
  const s = En(t), o = En(e);
  return !s || !o ? n < 0.5 ? t : e : na(s.map((i, r) => i + (o[r] - i) * n));
}
const eb = /* @__PURE__ */ new Set([
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
]), nb = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), zl = (t) => typeof t == "number" ? t : void 0, sb = 1.7;
function ob(t, e, n) {
  const s = Array.from({ length: 24 }, (o, i) => {
    const r = i / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((o) => o === null) || (t.beginPath(), s.forEach((o, i) => i === 0 ? t.moveTo(o.x, o.y) : t.lineTo(o.x, o.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function ib(t) {
  const e = Ae([0, 1, 0], t);
  if (e > 0.999999) return Mo();
  if (e < -0.999999) return ne(Gt([1, 0, 0], 180));
  const n = Vs([0, 1, 0], t);
  return ne(Gt(n, Math.acos(e) * 180 / Math.PI));
}
function rb(t, e, n, s, o) {
  const i = t.solid ?? {}, r = i.outline === !1 ? void 0 : i.outline ?? { width: 2, color: "#0f172a" }, a = { color: i.color ?? "#475569", shading: i.shading ?? "toon", outline: r }, l = { color: i.skin ?? "#f2c49b", shading: i.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, d = [], u = (w, y, S) => d.push({ mesh: w, world: At(o, y), material: S }), f = (w, y, S) => u(e.sphere, Mr(w, [0, 0, 0, 1], [y, y, y]), S);
  for (const w of n.chains) {
    const y = s.chains[w.id], S = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach((E, A) => {
      const v = y[A], k = y[A + 1], x = vr(v, k), [P, I] = E.width ?? [1, 1], O = h * S * (P + I) / 2;
      if (x > 1e-6) {
        const _ = xh(v, k, 0.5), W = ib(Ue($n(k, v)));
        u(e.cylinder, At(Re(_), At(W, qe([O, x, O]))), a);
      }
      f(v, h * S * P, a), f(k, h * S * I, a);
    }), w.id.startsWith("arm.") && f(y[y.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: b } = s.head, M = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...g, 1];
  u(e.sphere, At(M, qe([p, m, p])), l);
  for (const w of [-1, 1]) {
    const y = Ue([w * 0.36, 0.15, 0.92]), S = Ws(g, Ws(Ws(yn(b[0], y[0] * p * 1.04), yn(b[1], y[1] * m * 1.04)), yn(b[2], y[2] * p * 1.04))), E = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...S, 1];
    u(e.sphere, At(E, qe([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return d;
}
const Gv = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: B0({ ...t.character, height: 1 }),
      cylinder: ao(g0(1, 1, 16)),
      sphere: ao(q1(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let d = { ...pt, ...l.pose };
    for (const [v, k] of n)
      typeof k == "number" && !eb.has(v) && !nb.has(v) && (d[v] = k);
    const u = Math.max(0, Math.min(1, zl(n.get("walking")) ?? l.walking ?? 0));
    if (u > 0) {
      const v = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, k = F0(v, zl(n.get("walk")) ?? 0, d);
      d = Object.fromEntries(Object.keys({ ...d, ...k }).map((x) => [x, (d[x] ?? 0) + ((k[x] ?? 0) - (d[x] ?? 0)) * u]));
    }
    const f = l.height ?? sb, g = At(o.view, s), p = {
      toView: (v) => qt(g, v),
      toScreen: (v) => a(v)
    }, b = -p.toView([0, f / 2, 0])[2];
    if (b <= o.near) return null;
    const M = l.shadow === !1 ? [] : [{ depth: b + f, draw: (v) => ob(v, p, f * 0.18) }];
    if (l.look === "solid") {
      const v = Dr(h.plan, d, { height: f, contact: h.contact });
      return { meshes: rb(l, c, h.plan, v, s), drawables: M };
    }
    const w = qt(s, [0, f * 0.6, 0]), y = Ue($n(o.position, w)), S = X0(w, y, i).map((v) => Math.min(1, v)), E = i.length > 0 && h.skin !== "none" ? { ...h, skin: Q0(h.skin, S, U0(r, vr(w, o.position)), r?.color) } : h, A = Ky(E, d, p, { height: f });
    return {
      drawables: [
        ...M,
        // Ties keep the character's own order.
        ...A.map((v, k) => ({ depth: -v.depth - k * 1e-6, draw: (x, P) => v.draw(x, P.time) }))
      ]
    };
  }
}, Vn = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function ab([t, e, n]) {
  const [s, o, i] = [t / 2, e / 2, n / 2];
  return {
    vertices: [
      [-s, -o, -i],
      [s, -o, -i],
      [s, o, -i],
      [-s, o, -i],
      [-s, -o, i],
      [s, -o, i],
      [s, o, i],
      [-s, o, i]
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
const an = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function lb(t, e, n = "x", s = 20, o = 0) {
  const i = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const d = Math.PI * 2 * h / s;
      i.push(an(n, [Math.cos(d) * t, Math.sin(d) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: an(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: an(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, d = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: an(n, [Math.cos(d), Math.sin(d), 0]) });
  }
  const l = [];
  if (o > 0)
    for (const c of [-r, r]) {
      const h = i.push(an(n, [0, 0, c * 1.01])) - 1;
      for (let d = 0; d < o; d++) {
        const u = Math.PI * 2 * d / o, f = i.push(an(n, [Math.cos(u) * t * 0.82, Math.sin(u) * t * 0.82, c * 1.01])) - 1;
        l.push([h, f]);
      }
    }
  return { vertices: i, faces: a, marks: l, creases: !0 };
}
function cb([t, e, n], s = 16) {
  const o = Math.max(4, Math.round(s / 2)), i = [[0, e, 0]];
  for (let h = 1; h < o; h++) {
    const d = Math.PI * h / o;
    for (let u = 0; u < s; u++) {
      const f = Math.PI * 2 * u / s;
      i.push([Math.sin(d) * Math.cos(f) * t, Math.cos(d) * e, Math.sin(d) * Math.sin(f) * n]);
    }
  }
  const r = i.push([0, -e, 0]) - 1, a = (h, d) => 1 + (h - 1) * s + d % s, l = (h) => {
    const d = h.reduce((u, f) => [u[0] + i[f][0], u[1] + i[f][1], u[2] + i[f][2]], [0, 0, 0]);
    return Vn([d[0] / (t * t), d[1] / (e * e), d[2] / (n * n)]);
  }, c = [];
  for (let h = 0; h < s; h++) {
    const d = [0, a(1, h + 1), a(1, h)];
    c.push({ corners: d, normal: l(d) });
    for (let f = 1; f < o - 1; f++) {
      const g = [a(f, h), a(f, h + 1), a(f + 1, h + 1), a(f + 1, h)];
      c.push({ corners: g, normal: l(g) });
    }
    const u = [a(o - 1, h), a(o - 1, h + 1), r];
    c.push({ corners: u, normal: l(u) });
  }
  return { vertices: i, faces: c, creases: !1 };
}
const hb = (t) => t.reduce((e, [n, s], o) => {
  const [i, r] = t[(o + 1) % t.length];
  return e + n * r - i * s;
}, 0) / 2;
function db(t, e) {
  const n = hb(t) < 0 ? [...t].reverse() : t, s = n.length, o = e / 2, i = [...n.map(([a, l]) => [o, l, a]), ...n.map(([a, l]) => [-o, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: Vn([0, -c, h]) });
  }
  return { vertices: i, faces: r, creases: !0 };
}
function ub(t, e) {
  const n = {
    left: ([o, i]) => [0, i, o],
    right: ([o, i]) => [0, i, o],
    front: ([o, i]) => [o, i, 0],
    back: ([o, i]) => [o, i, 0],
    up: ([o, i]) => [o, 0, i]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((o, i) => i), normal: s[e] }] };
}
function fb(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, o = [], i = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = Vn([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), d = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], u = Vn(Yl(h, d)), f = Yl(u, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), b = Math.sin(p) * s(a);
      o.push([r[0] + u[0] * m + f[0] * b, r[1] + u[1] * m + f[1] * b, r[2] + u[2] * m + f[2] * b]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((u, f) => [u[0] + o[f][0] / 4, u[1] + o[f][1] / 4, u[2] + o[f][2] / 4], [0, 0, 0]), d = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      i.push({ corners: c, normal: Vn([h[0] - d[0], h[1] - d[1], h[2] - d[2]]) });
    }
  return { vertices: o, faces: i, creases: !1 };
}
function Yl(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function pb(t) {
  switch (t.type) {
    case "box":
      return ab(t.size);
    case "cylinder":
      return lb(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return cb(t.radii, t.segments);
    case "extrude":
      return db(t.profile, t.width);
    case "panel":
      return ub(t.points, t.facing);
    case "tube":
      return { ...fb(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function ed(t, e) {
  if (t.length < 2) return t;
  const n = (o) => t[Math.max(0, Math.min(t.length - 1, o))], s = (o) => {
    const i = o * (t.length - 1), r = Math.min(t.length - 2, Math.floor(i)), a = i - r, [l, c, h, d] = [n(r - 1), n(r), n(r + 1), n(r + 2)];
    return [0, 1, 2].map((u) => {
      const f = l[u], g = c[u], p = h[u], m = d[u];
      return 0.5 * (2 * g + (-f + p) * a + (2 * f - 5 * g + 4 * p - m) * a * a + (-f + 3 * g - 3 * p + m) * a * a * a);
    });
  };
  return Array.from({ length: e }, (o, i) => s(i / (e - 1)));
}
const Fe = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function ho(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function nd(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function bn(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function sd(t) {
  const e = t.filter((o, i) => i === 0 || Math.hypot(o[0] - t[i - 1][0], o[1] - t[i - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : ed(e.map(([o, i]) => [o, 0, i]), (e.length - 1) * 12).map(([o, , i]) => [o, i]);
  let s = 0;
  return n.map((o, i) => (i > 0 && (s += Math.hypot(o[0] - n[i - 1][0], o[1] - n[i - 1][1])), { point: o, at: s }));
}
function od(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], o = t[n], i = o.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (o.at - s.at))) : 0;
  return {
    point: [s.point[0] + (o.point[0] - s.point[0]) * i, s.point[1] + (o.point[1] - s.point[1]) * i],
    direction: [o.point[0] - s.point[0], o.point[1] - s.point[1]]
  };
}
function id(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let o = 0; o < 40; o++) {
    const i = (n + s) / 2;
    t(i) < e ? n = i : s = i;
  }
  return (n + s) / 2;
}
const Kl = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag"], gb = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, sr = Object.keys(Ft), li = Object.keys(ce), ci = Object.keys(Vr), mb = 0.25, yb = 700 / 180, bb = 200, wb = 300;
function kb(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...sr, "face", "hold", "pose", "gag", "place"], n = [];
  return t.forEach((s, o) => {
    const i = (c) => n.push({ beat: o, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return i("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) Kl.includes(c) || i(ut("beat field", c, Kl, a[c]));
    const l = typeof r.do == "string" ? li.includes(r.do) ? "pose" : ci.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return i(ut("character 3D beat", r.do, e, l));
    sr.includes(r.do) && (r.to === void 0 && r.through === void 0 && i(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !Fe(r.to) && i(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(Fe)) && i("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !Fe(r.to) && i("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(Fe(r.toward) || typeof r.toward == "number") && i("`face` needs `toward`: a point [x, z] or a heading in degrees."), r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !li.includes(r.pose) && i(ut("pose", r.pose, li)), r.do === "gag" && !ci.includes(r.gag) && i(ut("gag", r.gag, ci));
  }), n;
}
function Vv(t, e, n) {
  const s = kb(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((y) => `  beat ${y.beat}: ${y.message}`).join(`
`)}`);
  const o = n.height ?? 1.7, i = { ...pt, ...n.pose };
  let [r, a] = n.position ?? [0, 0], l = n.heading ?? 0, c = 0;
  const h = /* @__PURE__ */ new Map(), d = [], u = (y, S, E, A = "linear") => {
    const v = h.get(y) ?? [];
    v.push({ time: S, value: E, easing: A }), h.set(y, v);
  };
  u("x", 0, r), u("z", 0, a), u("rotateY", 0, l);
  const f = (y, S) => {
    const E = ho(l, S);
    if (Math.abs(E) < 1) return y;
    const A = Math.max(bb, Math.abs(E) * yb);
    return u("rotateY", y, l), l += E, u("rotateY", y + A, l, "ease-in-out"), y + A;
  }, g = (y, S, E, A = "ease-in-out") => {
    for (const [v, k] of Object.entries(E))
      i[v] !== k && (u(v, y, i[v] ?? 0), u(v, S, k, A), i[v] = k);
  }, p = (y, S, E) => {
    const A = sd([[r, a], ...S.through ?? [S.to]]);
    if (A.length < 2) return E;
    const v = f(E, bn(A[0].point, A[1].point)), k = A[A.length - 1].at, x = S.speed ?? gb[y] * Math.sqrt(o / 1.7), P = S.for ?? k / x * 1e3, I = N0(y, o), O = Rt("ease-in-out"), _ = Math.min(wb, P / 4);
    d.push({ time: v, value: y }), u("walking", v, 0), u("walking", v + _, 1, "ease-out"), u("walking", v + P - _, 1), u("walking", v + P, 0, "ease-in");
    const W = c;
    let B = l;
    for (let j = 0; ; j = Math.min(k, j + mb)) {
      const V = v + id(O, j / k) * P, { point: K, direction: T } = od(A, j);
      if (B += ho(B, bn([0, 0], T)), u("x", V, K[0]), u("z", V, K[1]), u("rotateY", V, B), u("walk", V, W + j / I), j >= k) break;
    }
    return c = W + k / I, [r, a] = A[A.length - 1].point, l = B, v + P;
  }, m = [];
  let b = 0;
  for (const y of e) {
    const S = y.at ?? b;
    let E = S;
    if (sr.includes(y.do)) E = p(y.do, y, S);
    else if (y.do === "face") E = f(S, typeof y.toward == "number" ? y.toward : bn([r, a], y.toward));
    else if (y.do === "hold") E = S + (y.for ?? 1e3);
    else if (y.do === "place")
      u("x", S, r), u("z", S, a), [r, a] = y.to, u("x", S + 1, r), u("z", S + 1, a), typeof y.toward == "number" && (u("rotateY", S, l), l = y.toward, u("rotateY", S + 1, l)), E = S + 1;
    else if (y.do === "pose") {
      E = S + (y.for ?? 500);
      const A = typeof y.pose == "string" ? ce[y.pose] : y.pose;
      g(S, E, A);
    } else if (y.do === "gag") {
      const A = Oy(y.gag, { at: S, from: { ...i } });
      let v = A[0];
      for (const k of A.slice(1))
        g(v.time, k.time, Object.fromEntries(Object.entries(k.pose).filter(([x, P]) => i[x] !== P)), k.easing ?? "ease-in-out"), v = k;
      E = v.time;
    }
    m.push({ do: y.do, start: S, end: E }), b = E;
  }
  const M = `${n.scene}/${t}`, w = [...h].map(([y, S]) => ({ id: `${t}-${y}`, target: M, property: y, keyframes: nd(S) }));
  return d.length > 0 && w.push({ id: `${t}-gait`, target: M, property: "gait", keyframes: d }), { tracks: w, duration: b, beats: m, end: { position: [r, a], heading: l, pose: { ...i } } };
}
const vb = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function Jv(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : vb[n];
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
function Zv(t, e, n) {
  const s = n.width / 2, o = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, o + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -o);
}
function Qv(t, e, n) {
  const s = e.width / 2, o = e.height / 2, i = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - o) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(i) - a * Math.sin(i),
    y: o + t.y + t.shakeY + r * Math.sin(i) + a * Math.cos(i)
  };
}
function Mb(t, e, n = {}, s) {
  const o = n.length ?? 240, i = 9, r = 28, a = o - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -i, a - r, 2 * i), t.fillStyle = "#e8b4a0", t.fillRect(a, -i, o - a, 2 * i), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -i), t.lineTo(r, i), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -i * 0.35), t.lineTo(r * 0.35, i * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -i }, { x: o, y: -i }, { x: o, y: i }, { x: r, y: i }, { x: 0, y: 0 }],
    [{ x: r, y: -i }, { x: r, y: i }],
    [{ x: a, y: -i }, { x: a, y: i }]
  ];
  for (const c of l) cd(t, c, s);
  t.restore();
}
function rd(t, e, n = {}, s) {
  const o = n.length ?? 90, i = n.thickness ?? 34;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -35) * Math.PI / 180);
  const r = -i / 2;
  t.fillStyle = n.color ?? "#f4a7b9", t.fillRect(0, r, o, i), t.fillStyle = "#e9edf2", t.fillRect(o * 0.45, r, o * 0.55, i), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round";
  const a = [
    { x: 0, y: r },
    { x: o, y: r },
    { x: o, y: -r },
    { x: 0, y: -r },
    { x: 0, y: r }
  ], l = [{ x: o * 0.45, y: r }, { x: o * 0.45, y: -r }];
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
const ad = 150, xb = { pencil: 44, eraser: 30 };
function ld(t, e, n = {}, s) {
  const o = n.tool ?? "pencil", i = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, d = ad * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const u = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, f = Ht.pencilGrip, g = (A) => {
    const v = A.fingers.thumb, k = A.fingers.index, x = A.fingers.middle, P = jl([v.points[3], k.points[3], x.points[3]]), I = jl([v.points[1], k.points[0]]), O = (v.depths[3] + k.depths[3] + x.depths[3]) / 3;
    return { pinch: P, direction: Math.atan2(I.y - P.y, I.x - P.x), depth: O };
  }, p = Bi(f, { size: d }), m = c - g(p).direction, b = Bi(f, { size: d, angle: m * 180 / Math.PI }), M = g(b), w = xb[o] * a, y = { x: M.pinch.x - Math.cos(c) * w, y: M.pinch.y - Math.sin(c) * w }, S = { x: u.x - y.x, y: u.y - y.y }, E = b.axes.up;
  Sb(t, S, { x: -E.x, y: -E.y }, d, n.arm ?? 300 * a, i, n.sleeve ?? "#5b7db1", r), Or(t, S, f, {
    size: d,
    angle: m * 180 / Math.PI,
    skin: i,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: M.depth,
      draw: () => {
        t.save(), t.translate(u.x, u.y), t.scale(a, a), o === "eraser" ? rd(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : Mb(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const jl = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function Sb(t, e, n, s, o, i, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, b) => ({
    x: e.x + n.x * p + l.x * m * b,
    y: e.y + n.y * p + l.y * m * b
  }), d = h(o, 0, 0), u = (p) => {
    const m = t.createLinearGradient(e.x, e.y, d.x, d.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, Tb(p)), m;
  }, f = Math.min(s * 0.55, o * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / ad), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(f + 4, -1, c * 1.1).x, h(f + 4, -1, c * 1.1).y), t.lineTo(h(f + 4, 1, c * 1.1).x, h(f + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = i, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(f, -1, c * 1.1).x, h(f, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(f, 1, c * 1.1).x, h(f, 1, c * 1.1).y), t.stroke();
  const g = [h(f, -1, c * 1.3), h(o, -1, c * 1.5), h(o, 1, c * 1.5), h(f, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = u(r), t.fill(), t.strokeStyle = u(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function tM(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, o = n.enter ?? 450, i = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, b) => ({ x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b }), d = a.find((p) => e >= p.start && e <= p.end);
  if (d) {
    const p = d.end - d.start, m = p > 0 ? (e - d.start) / p : 1;
    return { at: Pr(d.path, m), tool: l(d), lift: 0, drawing: !0 };
  }
  const u = [...a].reverse().find((p) => p.end < e), f = a.find((p) => p.start > e), g = (p) => p.path[p.path.length - 1];
  if (u && f && f.start - u.end <= r) {
    const p = (e - u.end) / (f.start - u.end), m = p < 0.5 ? l(u) : l(f);
    return { at: h(g(u), f.path[0], c(p)), tool: m, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (f && f.start - e <= o) {
    const p = 1 - (f.start - e) / o;
    return { at: h(s, f.path[0], c(p)), tool: l(f), lift: 1 - c(p), drawing: !1 };
  }
  if (u && e - u.end <= i) {
    const p = (e - u.end) / i;
    return { at: h(g(u), s, c(p)), tool: l(u), lift: c(p), drawing: !1 };
  }
  return null;
}
function eM(t, e, n, s = 0.08, o = 32) {
  const i = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= o; a++) {
    const l = -Math.PI / 2 + i * a / o;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function nM(t) {
  const { path: e } = t, n = e.map((a) => a.x), s = e.map((a) => a.y), o = Math.min(...n), i = Math.min(...s), r = t.hand === !1 ? void 0 : t.hand === !0 || t.hand === void 0 ? {} : t.hand;
  return {
    type: "custom",
    x: o,
    y: i,
    width: Math.max(1, Math.max(...n) - o),
    height: Math.max(1, Math.max(...s) - i),
    props: { draw: 0 },
    draw(a, l, c) {
      const h = Math.min(1, Math.max(0, Number(l.props?.draw ?? 0)));
      a.translate(-o, -i), a.strokeStyle = t.color ?? "#2f2f33", a.lineWidth = t.lineWidth ?? 5, a.lineCap = "round", a.lineJoin = "round";
      const d = t.sketch ? Fi(a, t.sketch, c) : void 0;
      h > 0 && (d ? t.smooth ? d.curve(e, h) : d.line(e, h) : cd(a, es(e, h))), r && h > 0 && h < 1 && ld(a, Pr(e, h), r, d);
    }
  };
}
function Tb(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, o, i] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${o}, ${i}, 0)`;
}
function cd(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const Es = 1e5;
function sM(t, e, n, s, o = 6) {
  const i = [], r = Math.max(1, Math.round(o));
  for (let a = 0; a <= r; a++)
    i.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return i;
}
function hd(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const o = es(e, s), i = n / 2, r = (a) => {
    t.beginPath(), t.rect(-Es, -Es, 2 * Es, 2 * Es), a(), t.clip("evenodd");
  };
  for (const a of o)
    r(() => {
      t.moveTo(a.x + i, a.y), t.arc(a.x, a.y, i, 0, Math.PI * 2);
    });
  for (let a = 1; a < o.length; a++) {
    const l = o[a - 1], c = o[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const d = -(c.y - l.y) / h * i, u = (c.x - l.x) / h * i;
    r(() => {
      t.moveTo(l.x + d, l.y + u), t.lineTo(c.x + d, c.y + u), t.lineTo(c.x - d, c.y - u), t.lineTo(l.x - d, l.y - u), t.closePath();
    });
  }
}
function oM(t, e, n, s, o) {
  t.save(), hd(t, e, n, s), o(), t.restore();
}
function iM(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, o = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(i, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (i.save(), hd(i, e.path, n, l), t.draw(i, r, a), i.restore(), !o || l <= 0 || l >= 1) return;
      const c = Pr(e.path, l);
      s ? ld(i, c, { ...s, tool: "eraser" }) : rd(i, c, o);
    }
  };
}
function ps() {
  const t = /* @__PURE__ */ new Map(), e = (n, ...s) => t.set(n, [...t.get(n) ?? [], ...s]);
  return {
    keys: (n) => t.get(n),
    push: e,
    tween(n, s, o, i, r = 300) {
      e(n, { time: i.at, value: s }, { time: i.at + (i.duration ?? r), value: o, ...i.easing ? { easing: i.easing } : {} });
    },
    last(n, s) {
      const o = t.get(n);
      return o ? [...o].sort((i, r) => i.time - r.time)[o.length - 1].value : s;
    },
    valueAt: (n, s) => oa(t.get(n), s),
    cutAfter(n, s) {
      for (const o of n) t.set(o, (t.get(o) ?? []).filter((i) => i.time <= s));
    },
    tracks(n) {
      return [...t].filter(([, s]) => s.length > 0).map(([s, o]) => ({
        id: `${n}-${s}`,
        target: n,
        property: s,
        keyframes: Eb(o)
      }));
    }
  };
}
function oa(t, e) {
  if (!t || t.length === 0) return 0;
  const n = [...t].sort((s, o) => s.time - o.time);
  if (e <= n[0].time) return n[0].value;
  for (let s = 1; s < n.length; s++)
    if (e <= n[s].time) {
      const o = n[s - 1], i = n[s];
      return i.time === o.time ? i.value : o.value + (i.value - o.value) * (e - o.time) / (i.time - o.time);
    }
  return n[n.length - 1].value;
}
function as(t) {
  const e = [...t ?? []].sort((n, s) => n.time - s.time);
  return e.slice(1).flatMap((n, s) => n.value !== e[s].value ? [{ start: e[s].time, end: n.time }] : []);
}
function Eb(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
const Ab = 16e-4, $b = 0.6, Ne = 33;
function Oo(t) {
  const e = (i, r) => `piece.${i.id}.${r}`, n = (i, r) => ({
    x: i.home.x + t.valueAt(e(i, "x"), r),
    y: i.home.y + t.valueAt(e(i, "y"), r)
  }), s = (i, r) => {
    const a = t.keys(e(i, "x"));
    if (!a || a.length < 2) return;
    const l = n(i, r - Ne), c = n(i, r);
    return { x: (c.x - l.x) / Ne, y: (c.y - l.y) / Ne };
  }, o = (i, r) => t.cutAfter(["x", "y", "rotate"].map((a) => e(i, a)), r);
  return {
    at: n,
    cutAfter: o,
    follow(i, r) {
      for (const a of r)
        t.push(e(i, "x"), { time: a.time, value: a.x - i.home.x }), t.push(e(i, "y"), { time: a.time, value: a.y - i.home.y });
    },
    fling(i, r) {
      const a = n(i, r.at), l = r.velocity ?? s(i, r.at) ?? { x: 0.5, y: -0.6 }, c = r.gravity ?? Ab, h = r.duration ?? 900, d = (r.spin ?? $b) * (l.x < 0 ? -1 : 1), u = t.valueAt(e(i, "rotate"), r.at);
      o(i, r.at);
      for (let f = 0; f <= h; f += Ne) {
        const g = a.x + l.x * f, p = a.y + l.y * f + 0.5 * c * f * f;
        t.push(e(i, "x"), { time: r.at + f, value: g - i.home.x }), t.push(e(i, "y"), { time: r.at + f, value: p - i.home.y }), t.push(e(i, "rotate"), { time: r.at + f, value: u + d * f });
      }
      t.tween(e(i, "opacity"), 1, 0, { at: r.at + h * 0.6, duration: h * 0.4 });
    },
    move(i, r) {
      const a = n(i, r.at);
      t.tween(e(i, "x"), a.x - i.home.x, r.to.x - i.home.x, r, 400), t.tween(e(i, "y"), a.y - i.home.y, r.to.y - i.home.y, r, 400);
    }
  };
}
function ia(t, e, { ground: n, every: s, floors: o }) {
  if (o.every((w) => w.windows.length === 0)) return t;
  const i = t.find((w) => w.target === e && w.property === "y"), r = new Ct({ id: `${e}-ride`, tracks: i ? [i] : [] }), a = (w) => i ? Number(r.getStateAtTime(w).values.get(e)?.get("y") ?? 0) : 0, l = (w) => {
    const y = n + a(w);
    return o.findIndex((S) => Math.abs(S.top - y) < 0.5);
  }, c = (i?.keyframes ?? []).map((w) => w.time), h = (w) => {
    const y = (k) => k < 0 ? 0 : o[k].offset(w), S = l(w);
    if (S >= 0) return y(S);
    if (Math.abs(a(w)) < 0.5) return 0;
    const E = (k) => l(k) >= 0 || Math.abs(a(k)) < 0.5, A = [...c].reverse().find((k) => k <= w && E(k)), v = c.find((k) => k >= w && E(k));
    return A === void 0 && v === void 0 ? 0 : A === void 0 ? y(l(v)) : v === void 0 || v === A ? y(l(A)) : y(l(A)) + (y(l(v)) - y(l(A))) * (w - A) / (v - A);
  }, d = o.flatMap((w) => w.windows), u = (w, y) => d.some((S) => S.start < y && S.end > w) || h(w) !== h(y), f = i ? [...i.keyframes] : [{ time: 0, value: 0 }], g = [{ ...f[0], value: f[0].value + h(f[0].time) }], p = (w, y) => {
    const S = /* @__PURE__ */ new Set([y]);
    for (let E = w + s; E < y; E += s) S.add(E);
    for (const E of d) for (const A of [E.start, E.end]) A > w && A < y && S.add(A);
    for (const E of [...S].sort((A, v) => A - v)) g.push({ time: E, value: a(E) + h(E) });
  };
  for (let w = 1; w < f.length; w++) {
    const y = f[w - 1].time, S = f[w].time;
    u(y, S) ? p(y, S) : g.push({ ...f[w], value: f[w].value + h(S) });
  }
  const m = f[f.length - 1].time, b = Math.max(m, ...d.map((w) => w.end));
  b > m && p(m, b);
  const M = { id: i?.id ?? `${e}-y`, target: e, property: "y", keyframes: g };
  return i ? t.map((w) => w === i ? M : w) : [...t, M];
}
function An(t) {
  const e = t.indexOf(":");
  return e < 0 ? { kind: t, rest: "" } : { kind: t.slice(0, e), rest: t.slice(e + 1) };
}
function De(t, e, n, s) {
  const o = Object.keys(n.anchors).map((r) => An(r).kind), { kind: i } = An(e);
  return o.includes(i) ? new Error(`${t}: no anchor "${e}"${s ? `: ${s}` : ""} (anchors: ${Object.keys(n.anchors).join(", ")})`) : new Error(`${t}: ${ut("anchor", i, o)} (anchors: ${Object.keys(n.anchors).join(", ")})`);
}
function _o(t, e, n) {
  return new Error(`${t}.edit: ${ut("edit", e, Object.keys(n.edits))}`);
}
function wt(t, e, n, s) {
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
const Pb = {
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
}, or = ["wipe", "fly", "blur"], zs = {
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
}, Ib = 0.9, Ob = 8;
function rM(t) {
  const e = { ...Pb, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, o = (t.lineHeight ?? 1.6) * s, i = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * i, l = Math.max(1, ...n.map((T) => T.length)), c = t.width ?? r * 2 + a + l * i, h = r * 2 + n.length * o, d = t.x + r + a, u = new Set(t.hidden ?? []), f = t.language ?? "plain";
  if (!ir.includes(f)) throw new Error(`codePanel: ${ut("language", f, ir)}`);
  const g = n.map((T) => Rb(T, f).flatMap((C) => Array.from(C.text, () => e[C.kind]))), p = ps(), m = Oo(p), b = [], M = /* @__PURE__ */ new Map(), w = [], y = [], S = (T) => {
    if (!Number.isInteger(T) || T < 1 || T > n.length) throw new Error(`codePanel: no line ${T} (it has ${n.length})`);
  }, E = p.tween, A = p.last, v = (T, C, L, $, R, N = 300) => {
    S(T), E(`line.${T}.${C}`, L, $, R, N);
  }, k = (T, C) => b.filter((L) => L.line < T && L.closed <= C).length, x = wt, P = (T) => t.y + r + (T - 1) * o, I = (T) => Array.isArray(T) ? T : [T], O = (T, C, L) => {
    let $ = -1;
    for (let R = 0; R < L; R++)
      if ($ = n[T - 1].indexOf(C, $ + 1), $ < 0) throw new Error(`codePanel: line ${T} has no ${L > 1 ? `${L}th ` : ""}"${C}"`);
    return $;
  }, _ = {};
  n.forEach((T, C) => {
    const L = C + 1;
    _[`line.${L}.highlight`] = 0, _[`line.${L}.strike`] = 0, _[`line.${L}.wipe`] = 0, _[`line.${L}.reveal`] = u.has(L) ? 0 : 1, _[`line.${L}.shift`] = 0;
  });
  const W = {
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
        return Hb(Object.keys(_));
      },
      actions: dd
    },
    draw(T, C) {
      const L = C.props ?? {}, $ = (D) => Number(L[D] ?? _[D]), R = r + a, N = (D) => r + (D - 1) * o - $(`line.${D}.shift`) * o;
      T.fillStyle = e.background, Xl(T, 0, 0, c, h, 8), T.fill(), T.font = `${s}px ${e.font}`, T.textBaseline = "middle", T.textAlign = "left";
      const q = (D, z, G, F, U) => {
        const Y = n[D - 1];
        for (let nt = z; nt < G; nt++)
          Y[nt] !== " " && (T.fillStyle = g[D - 1][nt], T.fillText(Y[nt], F + (nt - z) * i, U));
      };
      T.save(), Xl(T, 0, 0, c, h, 8), T.clip(), n.forEach((D, z) => {
        const G = z + 1, F = $(`line.${G}.wipe`);
        if (F >= 1) return;
        const U = N(G), Y = U + o / 2, nt = Math.max(1, D.length) * i, ot = Math.round($(`line.${G}.reveal`) * D.length), it = M.get(G) ?? { style: "wipe", from: "left" };
        T.save(), F > 0 && _b(T, it, F, { left: R - a, top: U, width: a + nt + i, height: o }, c);
        const rt = $(`line.${G}.highlight`);
        rt > 0 && (T.globalAlpha *= Math.min(1, rt), T.fillStyle = e.highlight, T.fillRect(R - i / 2, U, nt + i, o), T.globalAlpha /= Math.min(1, rt)), a > 0 && ot > 0 && (T.fillStyle = e.gutter, T.textAlign = "right", T.fillText(String(G), R - i, Y), T.textAlign = "left");
        const H = [
          ...w.filter((Q) => Q.line === G).map((Q) => ({ column: Q.column, length: Q.text.length, piece: Q, insert: void 0 })),
          ...y.filter((Q) => Q.line === G).map((Q) => ({ column: Q.column, length: 0, piece: void 0, insert: Q }))
        ].sort((Q, at) => Q.column - at.column || Q.length - at.length);
        let J = 0, tt = R;
        for (const Q of H) {
          q(G, J, Math.min(Q.column, ot), tt, Y), tt += (Q.column - J) * i;
          let at = Q.length, Z = "";
          if (Q.piece) {
            const X = Q.piece.written ?? "", et = $(`piece.${Q.piece.id}.write`);
            X && et > 0 ? (Z = X.slice(0, Math.round(et * X.length)), at = Q.length + (X.length - Q.length) * Math.min(1, et * 2)) : at = Q.length * (1 - $(`piece.${Q.piece.id}.away`));
          } else Q.insert && (at = Q.insert.chars * $(`insert.${Q.insert.id}.open`), Q.insert.text && (Z = Q.insert.text.slice(0, Math.round($(`insert.${Q.insert.id}.type`) * Q.insert.text.length))));
          T.fillStyle = e.text;
          for (let X = 0; X < Z.length; X++) Z[X] !== " " && T.fillText(Z[X], tt + X * i, Y);
          tt += at * i, J = Q.column + Q.length;
        }
        q(G, J, Math.max(J, ot), tt, Y);
        const st = $(`line.${G}.strike`);
        st > 0 && (T.strokeStyle = e.strike, T.lineWidth = Math.max(1.5, s / 10), T.beginPath(), T.moveTo(R, Y), T.lineTo(R + nt * Math.min(1, st), Y), T.stroke()), T.restore();
      });
      for (const D of w) {
        const z = $(`piece.${D.id}.opacity`);
        if (z <= 0 || $(`line.${D.line}.wipe`) >= 1) continue;
        const G = R + (D.column + D.text.length / 2) * i + $(`piece.${D.id}.x`), F = N(D.line) + o / 2 + $(`piece.${D.id}.y`);
        T.save(), T.globalAlpha = Math.min(1, z), T.translate(G, F), T.rotate($(`piece.${D.id}.rotate`) * Math.PI / 180), q(D.line, D.column, D.column + D.text.length, -D.text.length * i / 2, 0), T.restore();
      }
      T.restore();
    }
  }, B = (T) => {
    const { kind: C, rest: L } = An(T), $ = (R) => De("codePanel", T, zs, R);
    if (C === "box") {
      if (L) throw $("box takes no arguments");
      return { kind: C };
    }
    if (C === "line") {
      if (!/^\d+$/.test(L)) throw $("write it line:N");
      return { kind: C, n: Number(L) };
    }
    if (C === "token") {
      const R = /^(\d+)(?:#(\d+))?:(.+)$/.exec(L);
      if (!R) throw $("write it token:N:TEXT, or token:N#K:TEXT for the Kth");
      return { kind: C, n: Number(R[1]), occurrence: R[2] ? Number(R[2]) : 1, text: R[3] };
    }
    if (C === "spot") {
      const R = /^(\d+):(\d+)(?::(\d+))?$/.exec(L);
      if (!R) throw $("write it spot:N:C, or spot:N:C:W for W characters");
      return { kind: C, n: Number(R[1]), column: Number(R[2]), width: R[3] ? Number(R[3]) : 1 };
    }
    throw $();
  }, j = (T, C, L, $ = !1) => {
    const R = Array.isArray(C) ? C : [C];
    if (R.length === 0 || $ && R.length > 1) throw new Error(`codePanel.edit: ${T} takes ${$ ? "one" : "at least one"} ${L} anchor`);
    return R.map((N) => {
      const q = B(N);
      if (q.kind !== L) throw new Error(`codePanel.edit: ${T} takes ${L} anchors (${L}:…), not "${N}"`);
      return q;
    });
  }, V = (T, C) => {
    if (typeof C.text != "string") throw new Error(`codePanel.edit: ${T} needs \`text\` (the text to write)`);
    return C.text;
  }, K = {
    kind: "code",
    about: zs,
    target: W,
    lines: n,
    box: x(t.x, t.y, c, h),
    line(T, C = 1 / 0) {
      return S(T), x(d, P(T) - k(T, C) * o, Math.max(1, n[T - 1].length) * i, o);
    },
    token(T, C, L = 1, $ = 1 / 0) {
      S(T);
      const R = O(T, C, L);
      return x(d + R * i, P(T) - k(T, $) * o, C.length * i, o);
    },
    highlight(T, C) {
      for (const L of I(T)) {
        const $ = A(`line.${L}.highlight`, 0);
        v(L, "highlight", $, C.on === !1 ? 0 : 1, C, 200);
      }
      return K;
    },
    strike(T, C) {
      for (const L of I(T)) v(L, "strike", A(`line.${L}.strike`, 0), 1, C);
      return K;
    },
    remove(T, C) {
      const L = I(T), $ = C.style ?? "wipe";
      if (!or.includes($)) throw new Error(`codePanel.remove: ${ut("style", $, or)}`);
      const R = $ === "wipe" ? 300 : 450, N = C.at + (C.duration ?? R), q = C.close ?? 250;
      for (const D of L)
        v(D, "wipe", 0, 1, { ...C, easing: C.easing ?? ($ === "fly" ? "ease-in" : void 0) }, R), M.set(D, { style: $, from: C.from ?? "left" }), b.push({ line: D, closed: N + q });
      for (let D = 1; D <= n.length; D++) {
        if (L.includes(D)) continue;
        const z = L.filter((F) => F < D).length;
        if (z === 0) continue;
        const G = A(`line.${D}.shift`, 0);
        v(D, "shift", G, G + z, { at: N, duration: q, easing: "ease-in-out" });
      }
      return K;
    },
    type(T, C) {
      return v(T, "reveal", 0, 1, { duration: n[T - 1].length * 45, ...C }), K;
    },
    piece(T, C, L = 1) {
      if (typeof T == "string") {
        const D = B(T);
        if (D.kind !== "token") throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${T}"`);
        return K.piece(D.n, D.text, D.occurrence);
      }
      const $ = T;
      if (C === void 0) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")');
      S($);
      const R = O($, C, L), N = w.find((D) => D.line === $ && D.column === R && D.text === C);
      if (N) return N;
      if (w.some((D) => D.line === $ && R < D.column + D.text.length && D.column < R + C.length))
        throw new Error(`codePanel: "${C}" on line ${$} overlaps another piece`);
      const q = { id: w.length + 1, line: $, column: R, text: C, home: K.token($, C, L, 0) };
      w.push(q);
      for (const D of ["x", "y", "rotate", "write", "away"]) _[`piece.${q.id}.${D}`] = 0;
      return _[`piece.${q.id}.opacity`] = 1, q;
    },
    follow(T, C) {
      return m.follow(T, C), K;
    },
    fling(T, C) {
      return m.fling(T, C), K;
    },
    move(T, C) {
      return m.move(T, C), K;
    },
    write(T, C, L) {
      return T.written = C, E(`piece.${T.id}.write`, 0, 1, { duration: Math.max(1, C.length) * 70, ...L }), K;
    },
    spot(T, C, L = 1, $ = 1 / 0) {
      S(T);
      const R = y.filter((N) => N.line === T && N.column <= C && N.at <= $).reduce((N, q) => N + q.chars, 0);
      return x(d + (C + R) * i, P(T) - k(T, $) * o, L * i, o);
    },
    insert(T, C, L, $) {
      S(T);
      const R = { id: y.length + 1, line: T, column: C, chars: L.length, text: L, at: $.at };
      y.push(R), _[`insert.${R.id}.open`] = 0, _[`insert.${R.id}.type`] = 0;
      const N = $.duration ?? L.length * 70;
      return E(`insert.${R.id}.open`, 0, 1, { at: $.at, duration: N * 0.6, easing: "ease-out" }), E(`insert.${R.id}.type`, 0, 1, { at: $.at, duration: N }), K;
    },
    drop(T, C, L, $) {
      S(C);
      const R = $.duration ?? 250, N = C === T.line, q = $.easing ?? (N ? "linear" : "ease-out"), D = K.landing(T, C, L, $.at), z = { id: y.length + 1, line: C, column: L, chars: T.text.length, at: $.at };
      return y.push(z), _[`insert.${z.id}.open`] = 0, E(`insert.${z.id}.open`, 0, 1, { at: $.at, duration: R, easing: N ? q : "ease-out" }), E(`piece.${T.id}.away`, A(`piece.${T.id}.away`, 0), 1, { at: $.at, duration: R, easing: N ? q : "ease-in-out" }), m.cutAfter(T, $.at), K.move(T, { at: $.at, duration: R, easing: q, to: { x: D.x, y: D.y } }), E(`piece.${T.id}.rotate`, p.valueAt(`piece.${T.id}.rotate`, $.at), 0, { at: $.at, duration: R }), K;
    },
    landing(T, C, L, $ = 1 / 0) {
      const R = K.spot(C, L, T.text.length, $), N = C === T.line && L > T.column ? T.text.length * i : 0;
      return x(R.left - N, R.top, R.width, R.height);
    },
    ride(T, C, L) {
      const $ = n.map((R, N) => {
        const q = p.keys(`line.${N + 1}.shift`) ?? [];
        return { top: P(N + 1), offset: (D) => -oa(q, D) * o, windows: as(q) };
      });
      return ia(T, C, { ground: L.ground, every: L.every ?? Ne, floors: $ });
    },
    tracks: p.tracks,
    anchor(T, C = 1 / 0) {
      const L = B(T);
      return L.kind === "box" ? K.box : L.kind === "line" ? K.line(L.n, C) : L.kind === "token" ? K.token(L.n, L.text, L.occurrence, C) : K.spot(L.n, L.column, L.width, C);
    },
    edit(T, C, L) {
      const $ = () => j(T, C, "line").map((R) => R.n);
      if (T === "highlight") return K.highlight($(), L);
      if (T === "strike") return K.strike($(), L);
      if (T === "remove") return K.remove($(), L);
      if (T === "type") {
        for (const R of $()) K.type(R, L);
        return K;
      }
      if (T === "insert") {
        const [R] = j(T, C, "spot", !0);
        return K.insert(R.n, R.column, V(T, L), L);
      }
      if (T === "write" || T === "drop" || T === "move" || T === "fling") {
        const [R] = j(T, C, "token", !0), N = K.piece(R.n, R.text, R.occurrence);
        if (T === "write") return K.write(N, V(T, L), L);
        if (T === "fling") return K.fling(N, L);
        if (T === "drop") {
          const D = typeof L.into == "string" ? B(L.into) : void 0;
          if (D?.kind !== "spot") throw new Error("codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)");
          return K.drop(N, D.n, D.column, L);
        }
        const q = typeof L.to == "string" ? K.anchor(L.to, L.at) : L.to;
        if (!q || typeof q.x != "number" || typeof q.y != "number") throw new Error("codePanel.edit: move needs `to`, an anchor name or { x, y }");
        return K.move(N, { ...L, to: q });
      }
      throw _o("codePanel", T, zs);
    }
  };
  return K;
}
function _b(t, e, n, s, o) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const i = Ob * n;
  if (i > 0.2 && "filter" in t && (t.filter = `blur(${i.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * Ib * o, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
const dd = {
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
function Hb(t) {
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
    const o = e.find(([i]) => i.test(s));
    o && (n[s] = o[1]);
  }
  return n;
}
function Xl(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
const uo = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
uo.typescript = [...uo.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const ir = Object.keys(uo), Cb = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function Rb(t, e) {
  const n = new Set(uo[e]), s = Cb[e], o = [], i = (a, l) => {
    const c = o[o.length - 1];
    c && c.kind === l ? c.text += a : o.push({ text: a, kind: l });
  };
  let r = 0;
  for (; r < t.length; ) {
    const a = t[r];
    if (e !== "plain" && s && t.startsWith(s, r)) {
      i(t.slice(r), "comment");
      break;
    }
    if (e !== "plain" && (a === '"' || a === "'" || a === "`")) {
      let h = r + 1;
      for (; h < t.length && t[h] !== a; ) h += t[h] === "\\" ? 2 : 1;
      i(t.slice(r, h + 1), "string"), r = h + 1;
      continue;
    }
    const l = /^[A-Za-z_][A-Za-z0-9_]*/.exec(t.slice(r));
    if (l) {
      i(l[0], n.has(l[0]) ? "keyword" : "text"), r += l[0].length;
      continue;
    }
    const c = /^\d[\d_.]*/.exec(t.slice(r));
    if (c && e !== "plain") {
      i(c[0], "number"), r += c[0].length;
      continue;
    }
    i(a, "text"), r++;
  }
  return o;
}
const hi = '"Patrick Hand", "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', As = {
  whiteboard: {
    background: "#f7f7f2",
    frame: "#b8bcc4",
    ink: "#1f2a44",
    colors: { ink: "#1f2a44", red: "#d03b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a" },
    font: hi,
    stroke: 0.09,
    opacity: 1
  },
  chalkboard: {
    background: "#2f4a3a",
    frame: "#7a5a3a",
    ink: "#f1f1e8",
    colors: { ink: "#f1f1e8", red: "#f2a3a3", blue: "#a8c8f0", green: "#b7e4a8", orange: "#f5c98a", yellow: "#f6ef9a" },
    font: hi,
    stroke: 0.1,
    opacity: 0.9
  },
  lines: {
    background: "#fffdf5",
    frame: "#d9d3c0",
    ink: "#24315c",
    colors: { ink: "#24315c", red: "#c73b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a", pencil: "#6b6b6b" },
    font: hi,
    stroke: 0.08,
    opacity: 1,
    rule: { color: "#c9d6ec", spacing: 1.55, margin: "#f0a3a3" }
  }
}, Ul = ["circle", "box", "underline", "arrow"], ke = {
  kind: "board",
  create: "whiteboard({ x, y, width, height, theme?: whiteboard | chalkboard | lines, fontSize?, items: [{ id, text, at: [x, y], size?, color?, hidden? } | { id, mark: circle | box | underline | arrow, around? | from?, to?, bend?, color?, hidden? }] })",
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
}, Gl = 90, Vl = 300, Lb = 0.3;
function aM(t) {
  const e = typeof t.theme == "string" ? t.theme : "whiteboard";
  if (!(e in As)) throw new Error(`whiteboard: ${ut("theme", e, Object.keys(As))}`);
  const n = typeof t.theme == "object" ? { ...As.whiteboard, ...t.theme } : As[e], s = t.fontSize ?? 28, o = t.charWidth ?? 0.55, i = (y) => y === void 0 ? n.ink : n.colors[y] ?? y, r = (y) => wt(t.x + y.left, t.y + y.top, y.width, y.height), a = ps(), l = Oo(a), c = {}, h = /* @__PURE__ */ new Map(), d = [], u = [], f = (y, S, E, A) => {
    const v = h.get(y);
    if (!v || v.kind !== "text") throw De("whiteboard", A, ke, `there is no text "${y}" (texts: ${g().join(", ") || "none"})`);
    let k = -1;
    for (let P = 0; P < E; P++)
      if (k = v.item.text.indexOf(S, k + 1), k < 0) throw De("whiteboard", A, ke, `text "${y}" has no ${E > 1 ? `${E}th ` : ""}"${S}"`);
    const x = v.size * o;
    return { column: k, box: wt(v.box.left + k * x, v.box.top, S.length * x, v.box.height) };
  }, g = () => [...h.values()].filter((y) => y.kind === "text").map((y) => y.item.id), p = (y) => {
    const { kind: S, rest: E } = An(y), A = (v) => De("whiteboard", y, ke, v);
    if (S === "box") {
      if (E) throw A("box takes no arguments");
      return { kind: S };
    }
    if (S === "text" || S === "mark") {
      if (!E) throw A(`write it ${S}:ID`);
      return { kind: S, id: E };
    }
    if (S === "term") {
      const v = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec(E);
      if (!v) throw A("write it term:ID:TEXT, or term:ID#K:TEXT for the Kth");
      return { kind: S, id: v[1], occurrence: v[2] ? Number(v[2]) : 1, text: v[3] };
    }
    throw A();
  }, m = (y) => {
    const S = p(y);
    if (S.kind === "box") return wt(0, 0, t.width, t.height);
    if (S.kind === "term") return f(S.id, S.text, S.occurrence, y).box;
    const E = h.get(S.id);
    if (!E || E.kind !== S.kind) {
      const A = [...h.values()].filter((v) => v.kind === S.kind).map((v) => v.item.id);
      throw De("whiteboard", y, ke, `there is no ${S.kind} "${S.id}" (${S.kind}s: ${A.join(", ") || "none"})`);
    }
    return E.box;
  };
  for (const y of t.items ?? []) {
    if (!y || typeof y.id != "string" || !y.id || /[:#]/.test(y.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(y?.id)})`);
    if (h.has(y.id)) throw new Error(`whiteboard: two items are called "${y.id}"`);
    if ("text" in y) {
      if (!Array.isArray(y.at) || y.at.length !== 2 || !y.at.every((P) => typeof P == "number")) throw new Error(`whiteboard: text "${y.id}" needs \`at\`, [x, y] from the board's top-left`);
      const k = y.size ?? s, x = wt(y.at[0], y.at[1], Math.max(1, y.text.length) * k * o, k * 1.3);
      h.set(y.id, { kind: "text", item: y, size: k, color: i(y.color), box: x }), c[`text.${y.id}.write`] = y.hidden ? 0 : 1, c[`text.${y.id}.erase`] = 0;
      continue;
    }
    if (!Ul.includes(y.mark)) throw new Error(`whiteboard: mark "${y.id}": ${ut("mark", y.mark, Ul)}`);
    const S = y.mark === "arrow" ? ["from", "to"] : ["around"];
    for (const k of S) if (typeof y[k] != "string") throw new Error(`whiteboard: ${y.mark} "${y.id}" needs \`${k}\`, a place on the board (an item before it)`);
    const E = new Set([y.from, y.to].filter((k) => typeof k == "string").map((k) => k.split(":")[1])), A = y.mark === "arrow" ? [...h.values()].filter((k) => k.kind === "text" && !E.has(k.item.id)).map((k) => k.box) : [], v = Wb(y, m, s, A);
    h.set(y.id, { kind: "mark", item: y, color: i(y.color), points: v, box: Db(v) }), c[`mark.${y.id}.draw`] = y.hidden ? 0 : 1, c[`mark.${y.id}.erase`] = 0;
  }
  const b = (y) => d.filter((S) => S.item === y), M = {
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
        return Bb(Object.keys(c));
      },
      actions: ke.edits
    },
    draw(y, S) {
      const E = S.props ?? {}, A = (v) => Number(E[v] ?? c[v] ?? 0);
      if (y.save(), y.fillStyle = n.background, Ql(y, 0, 0, t.width, t.height, 10), y.fill(), y.lineWidth = Math.max(4, t.width * 0.012), y.strokeStyle = n.frame, y.stroke(), n.rule) {
        y.save(), y.beginPath(), Ql(y, 0, 0, t.width, t.height, 10), y.clip(), y.lineWidth = 1, y.strokeStyle = n.rule.color;
        const v = s * (n.rule.spacing ?? 1.55);
        for (let k = v; k < t.height; k += v)
          y.beginPath(), y.moveTo(0, k), y.lineTo(t.width, k), y.stroke();
        n.rule.margin && (y.strokeStyle = n.rule.margin, y.beginPath(), y.moveTo(s * 2.2, 0), y.lineTo(s * 2.2, t.height), y.stroke()), y.restore();
      }
      y.textAlign = "center", y.textBaseline = "middle", y.lineCap = "round", y.lineJoin = "round", y.globalAlpha = n.opacity;
      for (const v of h.values()) {
        if (y.save(), di(y, v.box, A(`${v.kind}.${v.item.id}.erase`)), v.kind === "text") {
          const k = b(v.item.id), x = A(`text.${v.item.id}.write`) * v.item.text.length;
          y.font = `${v.size}px ${n.font}`, y.fillStyle = v.color;
          for (let P = 0; P < Math.ceil(x); P++)
            v.item.text[P] === " " || k.some((I) => P >= I.column && P < I.column + I.text.length) || (y.globalAlpha = n.opacity * Math.min(1, x - P), y.fillText(v.item.text[P], v.box.left + (P + 0.5) * v.size * o, v.box.y));
        } else
          Zl(y, v.points, A(`mark.${v.item.id}.draw`), v.color, s * n.stroke, v.item.mark === "arrow");
        y.restore();
      }
      for (const v of u) {
        const k = A(`strike.${v.id}.draw`);
        if (k <= 0) continue;
        const { box: x } = v, P = x.height * 0.15;
        Zl(y, [{ x: x.left - 3, y: x.y + P }, { x: x.right + 3, y: x.y - P }], k, n.colors.red ?? n.ink, s * n.stroke * 0.8, !1);
      }
      for (const v of d) {
        const k = h.get(v.item), x = k.size * o;
        y.font = `${k.size}px ${n.font}`, y.fillStyle = k.color;
        const P = v.written;
        if (P) {
          const W = A(`piece.${v.id}.write`) * P.length, B = v.home.x - t.x - P.length * x / 2;
          for (let j = 0; j < Math.ceil(W); j++)
            P[j] !== " " && (y.globalAlpha = n.opacity * Math.min(1, W - j), y.fillText(P[j], B + (j + 0.5) * x, v.home.y - t.y));
        }
        const I = A(`piece.${v.id}.opacity`) * Math.min(1, A(`text.${v.item}.write`) * k.item.text.length - v.column);
        if (I <= 0) continue;
        y.save();
        const O = { x: v.home.x - t.x, y: v.home.y - t.y }, _ = { x: A(`piece.${v.id}.x`), y: A(`piece.${v.id}.y`) };
        di(y, wt(O.x + _.x - v.home.width / 2, O.y + _.y - v.home.height / 2, v.home.width, v.home.height), A(`piece.${v.id}.erase`)), Math.hypot(_.x, _.y) < 1 && di(y, k.box, A(`text.${v.item}.erase`)), y.globalAlpha = n.opacity * Math.min(1, I), y.translate(O.x + _.x, O.y + _.y), y.rotate(A(`piece.${v.id}.rotate`) * Math.PI / 180);
        for (let W = 0; W < v.text.length; W++) v.text[W] !== " " && y.fillText(v.text[W], (W + 0.5 - v.text.length / 2) * x, 0);
        y.restore();
      }
      y.restore();
    }
  }, w = {
    kind: "board",
    about: ke,
    target: M,
    box: wt(t.x, t.y, t.width, t.height),
    anchor(y) {
      return r(m(y));
    },
    piece(y) {
      const S = p(y);
      if (S.kind !== "term") throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${y}"`);
      const { column: E, box: A } = f(S.id, S.text, S.occurrence, y), v = d.find((x) => x.item === S.id && x.column === E && x.text === S.text);
      if (v) return v;
      if (d.some((x) => x.item === S.id && E < x.column + x.text.length && x.column < E + S.text.length))
        throw new Error(`whiteboard: "${S.text}" in "${S.id}" overlaps another piece`);
      const k = { id: d.length + 1, item: S.id, column: E, text: S.text, home: r(A) };
      d.push(k);
      for (const x of ["x", "y", "rotate", "erase", "write"]) c[`piece.${k.id}.${x}`] = 0;
      return c[`piece.${k.id}.opacity`] = 1, k;
    },
    edit(y, S, E) {
      const A = Array.isArray(S) ? S : [S];
      if (A.length === 0) throw new Error(`whiteboard.edit: ${y} takes at least one anchor`);
      const v = A.map((P) => ({ name: P, anchor: p(P) }));
      for (const { name: P } of v) m(P);
      const k = (P, I = !1) => {
        const O = v.find((_) => !P.includes(_.anchor.kind));
        if (O) throw new Error(`whiteboard.edit: ${y} takes ${P.join(" or ")} anchors, not "${O.name}"`);
        if (I && v.length > 1) throw new Error(`whiteboard.edit: ${y} takes one ${P.join(" or ")} anchor`);
      }, x = () => w.piece(v[0].name);
      if (y === "write") {
        if (v.some((P) => P.anchor.kind === "term")) {
          if (k(["term"], !0), typeof E.text != "string") throw new Error("whiteboard.edit: write into a term needs `text` (the new text)");
          const P = x();
          return P.written = E.text, a.tween(`piece.${P.id}.write`, 0, 1, { duration: Math.max(Vl, E.text.length * Gl), ...E }), w;
        }
        k(["text"]);
        for (const { anchor: P } of v) {
          const I = P.id, O = h.get(I).item.text;
          a.tween(`text.${I}.write`, 0, 1, { duration: Math.max(Vl, O.length * Gl), ...E });
        }
        return w;
      }
      if (y === "draw") {
        k(["mark"]);
        for (const { anchor: P } of v) a.tween(`mark.${P.id}.draw`, 0, 1, { duration: 500, ...E });
        return w;
      }
      if (y === "erase") {
        k(["text", "term", "mark"]);
        for (const P of v) {
          const I = P.anchor.kind === "term" ? `piece.${w.piece(P.name).id}.erase` : `${P.anchor.kind}.${P.anchor.id}.erase`;
          a.tween(I, 0, 1, { duration: 400, ...E });
        }
        return w;
      }
      if (y === "strike") {
        k(["text", "term"]);
        for (const P of v) {
          const I = { id: u.length + 1, box: m(P.name) };
          u.push(I), c[`strike.${I.id}.draw`] = 0, a.tween(`strike.${I.id}.draw`, 0, 1, { duration: 250, ...E });
        }
        return w;
      }
      if (y === "move") {
        k(["term"], !0);
        const P = typeof E.to == "string" ? w.anchor(E.to) : E.to;
        if (!P || typeof P.x != "number" || typeof P.y != "number") throw new Error("whiteboard.edit: move needs `to`, an anchor name or { x, y }");
        return w.move(x(), { ...E, to: P });
      }
      if (y === "fling")
        return k(["term"], !0), w.fling(x(), E);
      throw _o("whiteboard", y, ke);
    },
    follow(y, S) {
      return l.follow(y, S), w;
    },
    fling(y, S) {
      return l.fling(y, S), w;
    },
    move(y, S) {
      return l.move(y, S), w;
    },
    ride(y) {
      return y;
    },
    tracks: a.tracks
  };
  return w;
}
function Wb(t, e, n, s = []) {
  const o = Ve(oe(t.id)), i = (p) => (o.next() * 2 - 1) * p, r = n * Lb;
  if (t.mark === "arrow") {
    const p = e(t.from), m = e(t.to), b = Jl(p, m, r * 0.6), M = Jl(m, p, r * 0.6), w = Math.hypot(M.x - b.x, M.y - b.y), y = Nb(b, M);
    let S = w * (0.06 + i(0.04));
    if (t.bend !== void 0) S = w * t.bend;
    else {
      const v = Fb(b, M, y, s, r);
      v !== 0 && (S = v);
    }
    const E = { x: (b.x + M.x) / 2 + y.x * S, y: (b.y + M.y) / 2 + y.y * S }, A = [];
    for (let v = 0; v <= 24; v++) {
      const k = v / 24;
      A.push({ x: (1 - k) ** 2 * b.x + 2 * (1 - k) * k * E.x + k * k * M.x, y: (1 - k) ** 2 * b.y + 2 * (1 - k) * k * E.y + k * k * M.y });
    }
    return A;
  }
  const a = e(t.around);
  if (t.mark === "underline") {
    const p = a.bottom + r * 0.4;
    return [
      { x: a.left - r * 0.3, y: p + i(2) },
      { x: a.x, y: p + 2 + i(2) },
      { x: a.right + r * 0.5, y: p - 1 + i(3) }
    ];
  }
  if (t.mark === "box") {
    const p = a.left - r, m = a.right + r, b = a.top - r * 0.6, M = a.bottom + r * 0.6, w = (S, E) => ({ x: S + i(r * 0.2), y: E + i(r * 0.2) }), y = w(p, b);
    return [y, w(m, b), w(m, M), w(p, M), y, { x: y.x + r * 0.8, y: y.y + i(2) }];
  }
  const l = a.width / 2 + r, c = a.height / 2 + r * 0.6, h = -2.2 + i(0.3), d = o.next() * Math.PI * 2, u = 1.12, f = 64, g = [];
  for (let p = 0; p <= f * u; p++) {
    const m = p / f, b = h + m * Math.PI * 2, M = 1 + 0.035 * Math.sin(m * Math.PI * 4 + d) + 0.06 * m;
    g.push({ x: a.x + Math.cos(b) * l * M, y: a.y + Math.sin(b) * c * M });
  }
  return g;
}
function Fb(t, e, n, s, o) {
  const i = Math.hypot(e.x - t.x, e.y - t.y);
  if (i < 1e-6) return 0;
  const r = { x: (e.x - t.x) / i, y: (e.y - t.y) / i };
  let a = 0, l = 0;
  for (const c of s) {
    const d = [
      { x: c.left, y: c.top },
      { x: c.right, y: c.top },
      { x: c.right, y: c.bottom },
      { x: c.left, y: c.bottom }
    ].map((g) => ({ t: (g.x - t.x) * r.x + (g.y - t.y) * r.y, n: (g.x - t.x) * n.x + (g.y - t.y) * n.y })), u = d.some((g) => g.t > 0 && g.t < i), f = d.some((g) => g.n > 0) && d.some((g) => g.n < 0);
    !u || !f || (a = Math.max(a, ...d.map((g) => g.n)), l = Math.min(l, ...d.map((g) => g.n)));
  }
  return a === 0 && l === 0 ? 0 : a <= -l ? 2 * (a + o) : 2 * (l - o);
}
function Jl(t, e, n) {
  const s = e.x - t.x, o = e.y - t.y;
  if (s === 0 && o === 0) return { x: t.x, y: t.y };
  const i = Math.min(s === 0 ? 1 / 0 : (t.width / 2 + n) / Math.abs(s), o === 0 ? 1 / 0 : (t.height / 2 + n) / Math.abs(o));
  return { x: t.x + s * i, y: t.y + o * i };
}
function Nb(t, e) {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: -(e.y - t.y) / n, y: (e.x - t.x) / n };
}
function Db(t) {
  const e = t.map((i) => i.x), n = t.map((i) => i.y), s = Math.min(...e), o = Math.min(...n);
  return wt(s, o, Math.max(...e) - s, Math.max(...n) - o);
}
function Zl(t, e, n, s, o, i) {
  if (n <= 0 || e.length < 2) return;
  const r = [0];
  for (let g = 1; g < e.length; g++) r.push(r[g - 1] + Math.hypot(e[g].x - e[g - 1].x, e[g].y - e[g - 1].y));
  const l = r[r.length - 1] * Math.min(1, n / (i ? 0.85 : 1));
  t.strokeStyle = s, t.lineWidth = o, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let g = 1; g < e.length; g++) {
    if (r[g] <= l) {
      t.lineTo(e[g].x, e[g].y);
      continue;
    }
    const p = (l - r[g - 1]) / (r[g] - r[g - 1] || 1);
    t.lineTo(e[g - 1].x + (e[g].x - e[g - 1].x) * p, e[g - 1].y + (e[g].y - e[g - 1].y) * p);
    break;
  }
  if (t.stroke(), !i || n <= 0.85) return;
  const c = (n - 0.85) / 0.15, h = e[e.length - 1], d = e[e.length - 3] ?? e[0], u = Math.atan2(h.y - d.y, h.x - d.x), f = o * 4.5 * c;
  t.beginPath();
  for (const g of [-1, 1])
    t.moveTo(h.x, h.y), t.lineTo(h.x - Math.cos(u + g * 0.45) * f, h.y - Math.sin(u + g * 0.45) * f);
  t.stroke();
}
function di(t, e, n) {
  if (n <= 0) return;
  const s = 8;
  t.beginPath(), t.rect(e.left - s + n * (e.width + s * 2), e.top - s * 4, (1 - n) * (e.width + s * 2), e.height + s * 8), t.clip();
}
function Ql(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function Bb(t) {
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
    const o = e.find(([i]) => i.test(s));
    o && (n[s] = o[1]);
  }
  return n;
}
const tc = ["bar", "line", "pie", "donut"], ec = 'system-ui, -apple-system, "Segoe UI", sans-serif', $s = {
  light: {
    background: "#ffffff",
    text: "#3b4252",
    grid: "#d8dee9",
    color: "#4c7bd9",
    highlight: "#e8833a",
    palette: ["#4c7bd9", "#3fa66b", "#b05cc9", "#d9c04c", "#4cb8c4", "#d95c6f", "#8a7a5a", "#6b7a99"],
    font: ec
  },
  dark: {
    background: "#1e2230",
    text: "#cdd6f4",
    grid: "#3a4055",
    color: "#89b4fa",
    highlight: "#fab387",
    palette: ["#89b4fa", "#a6e3a1", "#cba6f7", "#f9e2af", "#94e2d5", "#f38ba8", "#b4a58a", "#9399b2"],
    font: ec
  }
}, pn = {
  kind: "chart",
  create: "chart({ x, y, width, height, kind: bar | line | pie | donut, data: [{ id, label?, value | values: { SERIES: value }, hidden? }], series?: [{ id, label?, color? }], max?, title?, axis?: { x?, y? }, legend?, theme?: light | dark, decimals?, prefix?, suffix?, values? })",
  anchors: {
    box: "the whole chart",
    "bar:ID": "a bar (bar charts; bar:ID:SERIES with several series), as it stands at the time: stand on its top (it carries a figure as it grows), point at it",
    "point:ID": "a point on the line (line charts; point:ID:SERIES with several series), as it stands at the time",
    "slice:ID": "a slice of a pie or donut, as it stands at the time (its middle; pulled out, it moves): point at it, make it a piece",
    "label:ID": "its label: under the axis, or beside the slice",
    "value:ID": "its value label: above the bar or point (value:ID:SERIES), or on the slice",
    "legend:SERIES": "a series in the legend (several series)"
  },
  edits: {
    set: "bar, point or slice anchors; { at, value, duration? }: animate to a new value; its value label counts along (a pie re-shares the circle)",
    show: "bar, point or slice anchors given `hidden`; { at, duration?, on? }: grow a bar in from the axis, draw the line out to a point, or open a slice (on: false takes it back)",
    highlight: "bar, point or slice anchors; { at, duration?, on? }: colour it out (on: false clears)",
    pull: "slice anchors; { at, duration?, on? }: pull the slice out from the centre (on: false puts it back)"
  }
}, qb = 600, zb = 500, Yb = 200, Kb = 400, jb = 0.14, Xb = Math.PI * 2;
function lM(t) {
  if (!tc.includes(t.kind)) throw new Error(`chart: ${ut("kind", t.kind, tc)}`);
  const e = typeof t.theme == "string" ? t.theme : "light";
  if (!(e in $s)) throw new Error(`chart: ${ut("theme", e, Object.keys($s))}`);
  const n = typeof t.theme == "object" ? { ...$s.light, ...t.theme } : $s[e];
  if (!Array.isArray(t.data) || t.data.length === 0) throw new Error("chart: `data` needs at least one { id, value }");
  const s = t.kind, o = s === "pie" || s === "donut", i = Array.isArray(t.series) && t.series.length > 1, r = Array.isArray(t.series) && t.series.length > 0 ? t.series : [{ id: "value" }];
  if (o && i) throw new Error(`chart: a ${s} shows one series (got ${r.length}); make a chart per series`);
  const a = /* @__PURE__ */ new Set();
  for (const H of r) {
    if (typeof H?.id != "string" || !H.id || /[:.]/.test(H.id)) throw new Error(`chart: every series needs an \`id\` without ":" or "." (got ${JSON.stringify(H?.id)})`);
    if (a.has(H.id)) throw new Error(`chart: two series are called "${H.id}"`);
    a.add(H.id);
  }
  const l = new Map(r.map((H, J) => [H.id, J])), c = (H) => r[l.get(H)].color ?? (l.get(H) === 0 ? n.color : n.palette[l.get(H) % n.palette.length]), h = /* @__PURE__ */ new Set(), d = (H, J) => {
    const tt = H.values?.[J.id] ?? (t.series ? void 0 : H.value) ?? H.value;
    if (typeof tt != "number" || !Number.isFinite(tt))
      throw new Error(i ? `chart: "${H.id}" needs a value for series "${J.id}" (\`values: { ${J.id}: … }\`)` : `chart: "${H.id}" needs a \`value\`, a number`);
    return tt;
  };
  for (const H of t.data) {
    if (typeof H?.id != "string" || !H.id || /[:.]/.test(H.id)) throw new Error(`chart: every datum needs an \`id\` without ":" or "." (got ${JSON.stringify(H?.id)})`);
    if (h.has(H.id)) throw new Error(`chart: two data are called "${H.id}"`);
    for (const J of r) d(H, J);
    h.add(H.id);
  }
  const u = s === "bar" ? "bar" : s === "line" ? "point" : "slice", f = Math.max(...t.data.flatMap((H) => r.map((J) => d(H, J)))), g = o ? t.data.reduce((H, J) => H + d(J, r[0]), 0) : t.max ?? Ub(f * 1.1);
  if (!o && !(g > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${g})`);
  const p = Math.max(10, Math.min(16, t.height / 20)), m = i && t.legend !== !1, b = o ? void 0 : t.axis?.x, M = o ? void 0 : t.axis?.y, w = t.title ? p * 2.3 : p * 0.5, y = {
    left: p * 3.6 + (M ? p * 1.5 : 0),
    right: t.width - p,
    top: (t.title ? p * 3 : p * 1.6) + (m ? p * 1.6 : 0),
    bottom: t.height - p * 2.4 - (b ? p * 1.4 : 0)
  }, S = y.bottom - y.top, E = (y.right - y.left) / t.data.length, A = i ? E * 0.72 / r.length : E * 0.6, v = i ? A * 0.86 : A, k = Math.max(4, p * 0.35), x = S / g, P = new Map(t.data.map((H, J) => [H.id, J])), I = (H) => y.left + E * (P.get(H) + 0.5), O = (H, J) => i ? I(H) - E * 0.36 + A * l.get(J) + (A - v) / 2 : I(H) - v / 2, _ = (H, J) => O(H, J) + v / 2, W = t.height - p * 1.2, B = {
    cx: t.width / 2,
    cy: (y.top + W) / 2,
    r: Math.max(10, Math.min(t.width / 2, (W - y.top) / 2) - p * 2.6)
  }, j = s === "donut" ? B.r * 0.55 : 0, V = s === "donut" ? (j + B.r) / 2 : B.r * 0.62, K = /* @__PURE__ */ new Map();
  if (m) {
    let H = y.right;
    for (const J of [...r].reverse()) {
      const tt = J.label ?? J.id, st = p * 0.62 * tt.length + p * 1.9;
      K.set(J.id, wt(H - st, w, st, p * 1.4)), H -= st + p * 0.6;
    }
  }
  const T = ps(), C = Oo(T), L = {}, $ = (H, J, tt) => i ? `${u}.${H}.${J}.${tt}` : `${u}.${H}.${tt}`;
  for (const H of t.data)
    for (const J of r)
      L[$(H.id, J.id, "value")] = d(H, J), L[$(H.id, J.id, "show")] = H.hidden ? 0 : 1, L[$(H.id, J.id, "highlight")] = 0, o && (L[$(H.id, J.id, "pull")] = 0);
  const R = (H, J) => T.keys(H)?.length ? oa(T.keys(H), J) : L[H], N = (H, J, tt) => R($(H, J, "value"), tt) * (s === "bar" ? R($(H, J, "show"), tt) : 1) * x, q = (H) => {
    const J = r[0].id, tt = t.data.map((Z) => Math.max(0, H($(Z.id, J, "value"))) * Math.max(0, Math.min(1, H($(Z.id, J, "show"))))), st = tt.reduce((Z, X) => Z + X, 0), Q = /* @__PURE__ */ new Map();
    let at = -Math.PI / 2;
    return t.data.forEach((Z, X) => {
      const et = st > 0 ? Xb * tt[X] / st : 0, ct = at + et / 2, ht = Math.max(0, Math.min(1, H($(Z.id, J, "pull")))) * B.r * jb;
      Q.set(Z.id, {
        start: at,
        sweep: et,
        mid: ct,
        out: ht,
        centre: { x: B.cx + Math.cos(ct) * (V + ht), y: B.cy + Math.sin(ct) * (V + ht) }
      }), at += et;
    }), Q;
  }, D = (H) => q((J) => R(J, H)), z = (H) => {
    const { kind: J, rest: tt } = An(H), st = (Q) => De("chart", H, pn, Q);
    if (J === "box") {
      if (tt) throw st("box takes no arguments");
      return { kind: "box" };
    }
    if (J === "legend") {
      if (!K.has(tt)) throw st(m ? `there is no series "${tt}" (series: ${r.map((Q) => Q.id).join(", ")})` : "only a chart with several series has a legend");
      return { kind: "legend", series: tt };
    }
    if (J === "bar" || J === "point" || J === "slice" || J === "label" || J === "value") {
      if (!tt) throw st(`write it ${J}:ID`);
      const Q = tt.indexOf(":"), at = Q < 0 ? tt : tt.slice(0, Q), Z = Q < 0 ? r[0].id : tt.slice(Q + 1);
      if (!P.has(at)) throw st(`there is no "${at}" (data: ${[...P.keys()].join(", ")})`);
      if (!a.has(Z)) throw st(`there is no series "${Z}" (series: ${r.map((X) => X.id).join(", ")})`);
      if (J === "label" && Q >= 0) throw st("a label is one per datum: label:ID");
      if ((J === "bar" || J === "point" || J === "slice") && J !== u) throw st(`a ${s} chart has ${u}s, not ${J}s: ${u}:${at}`);
      return { kind: J, id: at, series: Z };
    }
    throw st();
  }, G = (H, J) => {
    if (H.kind === "box") return wt(0, 0, t.width, t.height);
    if (H.kind === "legend") return K.get(H.series);
    if (o) {
      const Z = D(J).get(H.id), X = Math.max(p * 1.5, B.r * 0.42);
      if (H.kind === "slice") return wt(Z.centre.x - X / 2, Z.centre.y - X / 2, X, X);
      const et = F(Z);
      return H.kind === "label" ? et : Z.sweep >= 0.3 ? wt(Z.centre.x - p * 1.6, Z.centre.y - p * 0.65, p * 3.2, p * 1.3) : wt(et.left, et.bottom, et.width, p * 1.3);
    }
    const tt = H.kind === "label" ? I(H.id) : _(H.id, H.series), st = y.bottom - N(H.id, H.series, J);
    if (H.kind === "bar") return wt(tt - v / 2, st, v, y.bottom - st);
    if (H.kind === "point") return wt(I(H.id) - k, st - k, k * 2, k * 2);
    if (H.kind === "label") return wt(tt - E / 2, y.bottom + p * 0.4, E, p * 1.4);
    const Q = st - (s === "line" ? k : 0) - p * 0.3, at = i && s === "bar" ? A : E;
    return wt((s === "line" ? I(H.id) : tt) - at / 2, Q - p * 1.3, at, p * 1.3);
  }, F = (H) => {
    const J = B.r + H.out + p * 0.9, tt = { x: B.cx + Math.cos(H.mid) * J, y: B.cy + Math.sin(H.mid) * J }, st = p * 4.2, Q = Math.cos(H.mid), at = Q > 0.2 ? tt.x : Q < -0.2 ? tt.x - st : tt.x - st / 2;
    return wt(at, tt.y - p * 0.7, st, p * 1.4);
  }, U = (H) => wt(t.x + H.left, t.y + H.top, H.width, H.height), Y = (H) => `${t.prefix ?? ""}${H.toFixed(t.decimals ?? 0)}${t.suffix ?? ""}`, nt = /* @__PURE__ */ new Map(), ot = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: L,
    about: {
      kind: `${s} chart`,
      summary: `A ${s} chart of ${t.data.length} values (${t.data.map((H) => H.id).join(", ")})${i ? ` in ${r.length} series (${r.map((H) => H.id).join(", ")})` : ""}${o ? "" : `, scaled to ${g}`}. Its ${u}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(L).map((H) => [H, Jb(H)])),
      actions: pn.edits
    },
    draw(H, J) {
      const tt = J.props ?? {}, st = (Z) => Number(tt[Z] ?? L[Z] ?? 0);
      if (H.save(), H.fillStyle = n.background, nc(H, 0, 0, t.width, t.height, 8), H.fill(), H.font = `${p}px ${n.font}`, H.textBaseline = "middle", t.title && (H.fillStyle = n.text, H.textAlign = "left", H.font = `600 ${p * 1.2}px ${n.font}`, H.fillText(t.title, o ? p : y.left, p * 1.5), H.font = `${p}px ${n.font}`), m) {
        H.textAlign = "left";
        for (const Z of r) {
          const X = K.get(Z.id);
          H.fillStyle = c(Z.id), nc(H, X.left, X.top + p * 0.25, p * 0.9, p * 0.9, 2), H.fill(), H.fillStyle = n.text, H.fillText(Z.label ?? Z.id, X.left + p * 1.3, X.top + X.height / 2);
        }
      }
      if (o) {
        it(H, st), H.restore();
        return;
      }
      H.lineWidth = 1, H.textAlign = "right";
      for (let Z = 0; Z <= 4; Z++) {
        const X = y.bottom - S * Z / 4;
        H.strokeStyle = n.grid, H.beginPath(), H.moveTo(y.left, X), H.lineTo(y.right, X), H.stroke(), H.fillStyle = n.text, H.globalAlpha = 0.7, H.fillText(Gb(g * Z / 4), y.left - p * 0.5, X), H.globalAlpha = 1;
      }
      (M || b) && (H.fillStyle = n.text, H.textAlign = "center", H.globalAlpha = 0.85, M && (H.save(), H.translate(p * 0.9, (y.top + y.bottom) / 2), H.rotate(-Math.PI / 2), H.fillText(M, 0, 0), H.restore()), b && H.fillText(b, (y.left + y.right) / 2, y.bottom + p * 2.3), H.globalAlpha = 1);
      const Q = (Z, X) => st($(Z, X, "value")) * (s === "bar" ? st($(Z, X, "show")) : 1) * x, at = (Z, X) => ui(c(X), n.highlight, st($(Z, X, "highlight")));
      if (s === "line") {
        H.lineWidth = Math.max(2, p * 0.2), H.lineJoin = "round", H.lineCap = "round";
        for (const Z of r)
          H.strokeStyle = c(Z.id), H.beginPath(), t.data.forEach((X, et) => {
            const ct = { x: I(X.id), y: y.bottom - Q(X.id, Z.id) }, ht = st($(X.id, Z.id, "show"));
            if (et === 0) {
              ht > 0 && H.moveTo(ct.x, ct.y);
              return;
            }
            const yt = t.data[et - 1];
            if (st($(yt.id, Z.id, "show")) < 1 || ht <= 0) return;
            const gt = { x: I(yt.id), y: y.bottom - Q(yt.id, Z.id) };
            H.lineTo(gt.x + (ct.x - gt.x) * ht, gt.y + (ct.y - gt.y) * ht);
          }), H.stroke();
      }
      H.textAlign = "center";
      for (const Z of t.data) {
        for (const X of r) {
          const et = s === "bar" ? _(Z.id, X.id) : I(Z.id), ct = Q(Z.id, X.id), ht = st($(Z.id, X.id, "show"));
          if (H.fillStyle = at(Z.id, X.id), s === "bar" ? ct > 0.5 && (Vb(H, et - v / 2, y.bottom - ct, v, ct, Math.min(6, v / 4)), H.fill()) : ht > 0 && (H.beginPath(), H.arc(et, y.bottom - ct, k * Math.min(1, ht * 1.5) * (1 + 0.3 * st($(Z.id, X.id, "highlight"))), 0, Math.PI * 2), H.fill()), t.values !== !1 && ht > 0) {
            H.globalAlpha = Math.min(1, ht * 2), H.font = `600 ${i ? p * 0.85 : p}px ${n.font}`, H.fillStyle = ui(n.text, n.highlight, st($(Z.id, X.id, "highlight")));
            const yt = y.bottom - ct - (s === "line" ? k : 0) - p * 0.95;
            H.fillText(Y(st($(Z.id, X.id, "value"))), et, yt), H.font = `${p}px ${n.font}`, H.globalAlpha = 1;
          }
        }
        H.fillStyle = n.text, H.fillText(Z.label ?? Z.id, I(Z.id), y.bottom + p * 1.1);
      }
      H.strokeStyle = n.text, H.lineWidth = 1.5, H.beginPath(), H.moveTo(y.left, y.bottom), H.lineTo(y.right, y.bottom), H.stroke(), H.restore();
    }
  };
  function it(H, J) {
    const tt = r[0].id, st = q(J);
    t.data.forEach((Q, at) => {
      const Z = st.get(Q.id);
      if (Z.sweep <= 1e-4) return;
      const X = nt.get(Q.id), et = X ? { x: J(`piece.${X.id}.x`), y: J(`piece.${X.id}.y`) } : { x: 0, y: 0 }, ct = X ? J(`piece.${X.id}.rotate`) * Math.PI / 180 : 0, ht = X ? J(`piece.${X.id}.opacity`) : 1;
      if (ht <= 0) return;
      H.save(), H.globalAlpha = ht;
      const yt = { x: B.cx + Math.cos(Z.mid) * Z.out, y: B.cy + Math.sin(Z.mid) * Z.out };
      H.translate(Z.centre.x + et.x, Z.centre.y + et.y), H.rotate(ct), H.translate(-Z.centre.x, -Z.centre.y), H.beginPath(), H.arc(yt.x, yt.y, B.r, Z.start, Z.start + Z.sweep), j > 0 ? H.arc(yt.x, yt.y, j, Z.start + Z.sweep, Z.start, !0) : H.lineTo(yt.x, yt.y), H.closePath(), H.fillStyle = ui(n.palette[at % n.palette.length], n.highlight, J($(Q.id, tt, "highlight"))), H.fill(), H.strokeStyle = n.background, H.lineWidth = Math.max(1.5, p * 0.15), H.stroke(), t.values !== !1 && Z.sweep >= 0.3 && (H.fillStyle = n.background, H.font = `600 ${p}px ${n.font}`, H.textAlign = "center", H.fillText(Y(J($(Q.id, tt, "value"))), Z.centre.x, Z.centre.y), H.font = `${p}px ${n.font}`), H.restore();
      const gt = F(Z), zt = Math.cos(Z.mid);
      H.globalAlpha = ht, H.fillStyle = n.text, H.textAlign = zt > 0.2 ? "left" : zt < -0.2 ? "right" : "center";
      const Pn = zt > 0.2 ? gt.left : zt < -0.2 ? gt.right : gt.left + gt.width / 2;
      H.fillText(Q.label ?? Q.id, Pn, gt.top + gt.height / 2), t.values !== !1 && Z.sweep < 0.3 && (H.globalAlpha = ht * 0.8, H.fillText(Y(J($(Q.id, tt, "value"))), Pn, gt.bottom + p * 0.65)), H.globalAlpha = 1;
    });
  }
  const rt = {
    kind: "chart",
    chartKind: s,
    about: pn,
    target: ot,
    max: g,
    box: wt(t.x, t.y, t.width, t.height),
    anchor(H, J = 1 / 0) {
      return U(G(z(H), J));
    },
    piece(H) {
      const J = z(H);
      if (J.kind !== "slice")
        throw new Error(o ? `chart: a piece is a slice, slice:ID, not "${H}"` : `chart: a ${u} is not a piece; slices of a pie or donut are (slice:ID). Change a ${u} with edit('set' | 'show' | 'highlight', …)`);
      const tt = nt.get(J.id);
      if (tt) return tt;
      const st = { id: nt.size + 1, datum: J.id, home: U(G(J, 0)) };
      nt.set(J.id, st);
      for (const Q of ["x", "y", "rotate"]) L[`piece.${st.id}.${Q}`] = 0;
      return L[`piece.${st.id}.opacity`] = 1, st;
    },
    edit(H, J, tt) {
      const st = Array.isArray(J) ? J : [J];
      if (st.length === 0) throw new Error(`chart.edit: ${H} takes at least one anchor`);
      if (!(H in pn.edits)) throw _o("chart", H, pn);
      if (H === "pull" && !o) throw new Error(`chart.edit: pull takes slice anchors of a pie or donut; a ${s} chart has ${u}s`);
      const Q = st.map((at) => {
        const Z = z(at);
        if (Z.kind !== u) throw new Error(`chart.edit: ${H} takes ${u} anchors (${u}:ID), not "${at}"`);
        return Z;
      });
      for (const { id: at, series: Z } of Q) {
        const X = (et) => $(at, Z, et);
        if (H === "set") {
          if (typeof tt.value != "number" || !Number.isFinite(tt.value)) throw new Error("chart.edit: set needs `value`, a number");
          T.tween(X("value"), R(X("value"), tt.at), tt.value, tt, qb);
        } else H === "show" ? T.tween(X("show"), R(X("show"), tt.at), tt.on === !1 ? 0 : 1, tt, zb) : H === "pull" ? T.tween(X("pull"), R(X("pull"), tt.at), tt.on === !1 ? 0 : 1, tt, Kb) : T.tween(X("highlight"), R(X("highlight"), tt.at), tt.on === !1 ? 0 : 1, tt, Yb);
      }
      return rt;
    },
    follow(H, J) {
      return C.follow(H, J), rt;
    },
    fling(H, J) {
      return C.fling(H, J), rt;
    },
    move(H, J) {
      return C.move(H, J), rt;
    },
    ride(H, J, tt) {
      if (s !== "bar") return H;
      const st = t.data.flatMap(
        (Q) => r.map((at) => {
          const Z = N(Q.id, at.id, 0), X = [...as(T.keys($(Q.id, at.id, "value"))), ...as(T.keys($(Q.id, at.id, "show")))];
          return { top: t.y + y.bottom - Z, offset: (et) => Z - N(Q.id, at.id, et), windows: X };
        })
      );
      return ia(H, J, { ground: tt.ground, every: tt.every ?? Ne, floors: st });
    },
    tracks: T.tracks
  };
  return rt;
}
function Ub(t) {
  if (!(t > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(t));
  for (const n of [1, 2, 2.5, 5, 10]) if (n * e >= t - 1e-9) return n * e;
  return 10 * e;
}
function Gb(t) {
  return Number.isInteger(t) ? String(t) : String(Number(t.toFixed(2)));
}
function ui(t, e, n) {
  if (n <= 0) return t;
  if (n >= 1) return e;
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(t) || !/^#[0-9a-f]{6}$/i.test(e)) return n < 0.5 ? t : e;
  const [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}
function nc(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function Vb(t, e, n, s, o, i) {
  const r = Math.min(i, o);
  t.beginPath(), t.moveTo(e, n + o), t.lineTo(e, n + r), t.arcTo(e, n, e + r, n, r), t.lineTo(e + s - r, n), t.arcTo(e + s, n, e + s, n + r, r), t.lineTo(e + s, n + o), t.closePath();
}
function Jb(t) {
  return t.endsWith(".value") ? { description: "Its value (the bar’s height, the point’s, or the slice’s share, and its value label)", unit: "value" } : t.endsWith(".show") ? { description: "How much of it is shown: a bar grown in from the axis, the line drawn out to the point, a slice opened", unit: "0..1", min: 0, max: 1 } : t.endsWith(".pull") ? { description: "How far the slice is pulled out from the centre", unit: "0..1", min: 0, max: 1 } : t.startsWith("piece.") ? { description: t.endsWith(".opacity") ? "The loose slice’s opacity" : t.endsWith(".rotate") ? "The loose slice’s turn, degrees" : "The loose slice’s offset from home, px", unit: t.endsWith(".rotate") ? "degrees" : t.endsWith(".opacity") ? "0..1" : "px" } : { description: "How much it is coloured out", unit: "0..1", min: 0, max: 1 };
}
const ud = {
  boy: {
    label: "Boy",
    group: "family",
    scale: 0.66,
    options: { build: "child", hair: "short", ears: !0, outfit: { shirt: "#4f8fd6", trousers: "#2f4d6b", bottom: "shorts" } }
  },
  girl: {
    label: "Girl",
    group: "family",
    scale: 0.66,
    options: { build: "child", hair: { style: "bob", color: fe.chestnut }, ears: !0, outfit: { shirt: "#e86a92", trousers: "#4a5b8c", bottom: "skirt" } }
  },
  youngMan: {
    label: "Young man",
    group: "family",
    scale: 1,
    options: { build: "tall", hair: "spiky", ears: !0, outfit: { shirt: "#3c9a6e", trousers: "#2d3a4f" } }
  },
  youngWoman: {
    label: "Young woman",
    group: "family",
    scale: 0.96,
    options: { build: "slim", hair: { style: "highPonytail", color: fe.auburn }, ears: !0, outfit: { shirt: "#f0b43c", trousers: "#36507a" } }
  },
  man: {
    label: "Man",
    group: "family",
    scale: 1,
    options: { build: "broad", hair: "sidePart", facialHair: "chevron", ears: !0, outfit: { shirt: "#7a8fa6", trousers: "#3b3f46", sleeves: "long", collar: !0, tie: "#2b4f8c" } }
  },
  woman: {
    label: "Woman",
    group: "family",
    scale: 0.95,
    options: { build: "curvy", hair: { style: "shoulderWaves", color: fe.black }, ears: !0, outfit: { shirt: "#9b5fc0", trousers: "#2f2f3a", sleeves: "long" } }
  },
  grandpa: {
    label: "Grandpa",
    group: "family",
    scale: 0.96,
    options: {
      build: "stocky",
      hair: { style: "receding", color: fe.gray },
      facialHair: { style: "shortBoxed", color: fe.white },
      glasses: "square",
      ears: !0,
      outfit: { shirt: "#b98a5a", trousers: "#4b4440", sleeves: "long", collar: !0 }
    }
  },
  grandma: {
    label: "Grandma",
    group: "family",
    scale: 0.9,
    options: { build: "short", hair: { style: "topBun", color: fe.white }, glasses: "round", ears: !0, outfit: { shirt: "#5d9fa8", trousers: "#5a4a5e", sleeves: "long", bottom: "skirt" } }
  },
  doctor: {
    label: "Doctor",
    group: "work",
    scale: 0.97,
    options: { build: "slim", hair: { style: "lowPonytail", color: fe.black }, ears: !0, outfit: { shirt: "#8fb8d8", trousers: "#36507a", over: "labCoat", collar: !0 } }
  },
  cook: {
    label: "Cook",
    group: "work",
    scale: 1,
    options: { build: "stocky", hair: "crewCut", facialHair: "shortMoustache", ears: !0, outfit: { shirt: "#f4f6f8", trousers: "#3b3f46", sleeves: "long", over: "apron", overColor: "#e2493b" } }
  },
  builder: {
    label: "Builder",
    group: "work",
    scale: 1,
    options: { build: "broad", hair: "short", facialHair: "stubble", hat: "hardHat", ears: !0, outfit: { shirt: "#f08a3c", trousers: "#4a5b8c" } }
  },
  courier: {
    label: "Courier",
    group: "work",
    scale: 0.98,
    options: { build: "standard", hair: "short", hat: { style: "cap", color: "#d64535" }, ears: !0, outfit: { shirt: "#c94a3b", trousers: "#2f2f3a", bottom: "shorts" } }
  },
  teacher: {
    label: "Teacher",
    group: "work",
    scale: 1,
    options: { build: "tall", hair: "slickBack", glasses: "square", ears: !0, outfit: { shirt: "#f4f6f8", trousers: "#3b3f46", sleeves: "long", collar: !0, tie: "#9a4426" } }
  },
  farmer: {
    label: "Farmer",
    group: "work",
    scale: 0.97,
    options: { build: "stocky", hair: { style: "shoulderStraight", color: fe.blond }, hat: "sunHat", ears: !0, outfit: { shirt: "#d64535", trousers: "#4f6b3a", sleeves: "long" } }
  }
};
function cM(t, e = 300, n = {}) {
  const s = ud[t];
  if (!s) throw new Error(`castMember: unknown cast member '${t}'`);
  return { ...s.options, height: Math.round(e * s.scale), ...n };
}
const fo = {
  handshake: { height: 0.47, spacing: 0.42, lean: 6 },
  highFive: { height: 0.9, spacing: 0.4, lean: 4 },
  fistBump: { height: 0.55, spacing: 0.44, lean: 6 },
  handOver: { height: 0.52, spacing: 0.46, lean: 8 }
};
function hM(t, e, n) {
  return fo[t].spacing * Math.min(e.height, n.height);
}
const sc = 0.075;
function dM(t, e, n, s = {}) {
  const o = fo[t];
  if (!o) throw new Error(`meetHands: unknown meeting '${t}' (one of ${Object.keys(fo).join(", ")})`);
  const [i, r] = e.x <= n.x ? [e, n] : [n, e], a = s.view === "side", l = Math.min(i.character.height, r.character.height), c = { x: (i.x + r.x) / 2, y: -(s.height ?? o.height) * l }, h = (m, b) => {
    const M = b ? a ? 1 : 0.62 : a ? 3 : 3.38;
    let w = { ...pt, ...m.pose, turn: M, lean: (m.pose?.lean ?? 0) + o.lean };
    const y = b ? 1 : -1, S = (E, A, v) => {
      w = Pe(m.character, w, E, { x: c.x + A - m.x, y: c.y, depth: v });
    };
    if (t === "handOver") {
      const E = sc * l;
      S("arm.left", -y * E * 0.9, E), S("arm.right", -y * E * 0.9, -E);
    } else
      S("arm.right", 0, 0);
    return t === "fistBump" && (w = { ...w, "hand.right.index.curl": 1, "hand.right.middle.curl": 1, "hand.right.ring.curl": 1, "hand.right.pinky.curl": 1 }), w;
  }, d = h(i, !0), u = h(r, !1), f = 0.03 * l, g = (m, b) => {
    const M = se(m.character, b), w = t === "handOver" ? ["hand.left", "hand.right"] : ["hand.right"], y = t === "handOver" ? sc * l + f : f;
    return w.every((S) => Math.abs(M.points[S].y - c.y) < f && Math.abs(M.points[S].x + m.x - c.x) < y);
  }, p = g(i, d) && g(r, u);
  return e.x <= n.x ? { a: d, b: u, point: c, reached: p } : { a: u, b: d, point: c, reached: p };
}
const rr = { spacing: 0.3, lean: 10, tilt: 8 };
function uM(t, e) {
  return rr.spacing * Math.min(t.height, e.height);
}
function fM(t, e, n = {}) {
  const [s, o] = t.x <= e.x ? [t, e] : [e, t], i = n.view === "side", r = Math.min(s.character.height, o.character.height), a = (g, p, m) => ({
    over: { x: p.x - m * 0.02 * r - g.x, y: -0.72 * r, depth: -0.08 * r },
    round: { x: p.x - m * 0.04 * r - g.x, y: -0.5 * r, depth: 0.06 * r }
  }), l = (g, p, m) => {
    const b = m ? i ? 1 : 0.62 : i ? 3 : 3.38, M = m ? 1 : -1;
    let w = { ...pt, ...g.pose, turn: b, lean: (g.pose?.lean ?? 0) + rr.lean, "head.tilt": (g.pose?.["head.tilt"] ?? 0) + M * rr.tilt };
    const { over: y, round: S } = a(g, p, M);
    return w = Pe(g.character, w, "arm.right", y), w = Pe(g.character, w, "arm.left", S), w;
  }, c = l(s, o, !0), h = l(o, s, !1), d = 0.05 * r, u = (g, p, m, b) => {
    const M = se(g.character, b).points, { over: w, round: y } = a(g, p, m);
    return Math.hypot(M["hand.right"].x - w.x, M["hand.right"].y - w.y) < d && Math.hypot(M["hand.left"].x - y.x, M["hand.left"].y - y.y) < d;
  }, f = u(s, o, 1, c) && u(o, s, -1, h);
  return t.x <= e.x ? { a: c, b: h, reached: f } : { a: h, b: c, reached: f };
}
const gn = { spacing: 0.32, low: 0.3, high: 0.5, helperLean: 40, helperBend: 16 };
function pM(t, e) {
  return gn.spacing * Math.min(t.height, e.height);
}
function gM(t, e, n, s = {}) {
  const o = Math.max(0, Math.min(1, n)), i = s.view === "side", r = t.x <= e.x, a = Math.min(t.character.height, e.character.height), l = { x: (t.x + e.x) / 2, y: -(gn.low + (gn.high - gn.low) * o) * a }, c = (m) => m ? i ? 1 : 0.62 : i ? 3 : 3.38;
  let h = { ...pt, ...t.pose, turn: c(r), lean: (t.pose?.lean ?? 0) + gn.helperLean * (1 - o) + 4, bend: (t.pose?.bend ?? 0) + gn.helperBend * (1 - o), "head.nod": 18 * (1 - o) };
  h = Pe(t.character, h, "arm.right", { x: l.x - t.x, y: l.y });
  const d = { ...ce.sitFloor, ...e.pose, turn: c(!r) }, u = { ...pt, ...e.pose, turn: c(!r) };
  let f = jy(d, u, o);
  f = Pe(e.character, f, "arm.right", { x: l.x - e.x, y: l.y });
  const g = 0.04 * a, p = (m, b) => {
    const M = se(m.character, b).points["hand.right"];
    return Math.hypot(M.x + m.x - l.x, M.y - l.y) < g;
  };
  return { helper: h, sitter: f, point: l, reached: p(t, h) && p(e, f) };
}
const Zb = 0.7, Qb = 50, tw = 1.2, ew = 0.8, nw = 3, sw = 30, ow = 0.8, iw = 0.6, fi = (t, e) => Math.max(-e, Math.min(e, t)), rw = ["hair.swing", "hair.trail", "hair.lift"];
function aw(t, e) {
  const n = e.start ?? 0, s = e.amount ?? 1, o = Math.max(1e-6, e.headRadius);
  let i = NaN, r = { x: 0, y: 0, turn: 0 };
  const a = (f) => (f !== i && (r = t(f), i = f), r), l = (f) => {
    const g = a(f);
    return g.turn * 90 + (g.headTurn ?? 0);
  }, c = { start: n, end: e.end, step: e.step, stiffness: e.stiffness ?? 70, damping: e.damping ?? 6 }, h = Ls(l, c), d = Ls((f) => a(f).x, c), u = Ls((f) => a(f).y, c);
  return h.map((f, g) => {
    const p = a(f.time), m = f.value - l(f.time), b = d[g].value - p.x - (e.wind ?? 0) * Zb * o, M = u[g].value - p.y, w = Math.sin(p.turn * Math.PI / 2), y = Math.cos(p.turn * Math.PI / 2), S = m * nw + b * y / o * sw, E = -b * w / o * ow, A = -M / o * iw;
    return {
      time: f.time,
      swing: fi(S * s, Qb),
      trail: fi(E * s, tw),
      lift: fi(A * s, ew)
    };
  });
}
function mM(t, e) {
  if (t.length === 0) return { "hair.swing": 0, "hair.trail": 0, "hair.lift": 0 };
  if (e <= t[0].time) return oc(t[0]);
  if (e >= t[t.length - 1].time) return oc(t[t.length - 1]);
  let n = 0, s = t.length - 1;
  for (; s - n > 1; ) {
    const a = n + s >> 1;
    t[a].time <= e ? n = a : s = a;
  }
  const o = t[n], i = t[s], r = i.time === o.time ? 0 : (e - o.time) / (i.time - o.time);
  return {
    "hair.swing": o.swing + (i.swing - o.swing) * r,
    "hair.trail": o.trail + (i.trail - o.trail) * r,
    "hair.lift": o.lift + (i.lift - o.lift) * r
  };
}
const oc = (t) => ({ "hair.swing": t.swing, "hair.trail": t.trail, "hair.lift": t.lift }), ln = 16, lw = 1500;
function yM(t, e, n, s = {}) {
  const o = n.head.hair;
  if (!o || !ty(o)) return [];
  const i = e.filter((M) => M.target === t), r = i.reduce((M, w) => w.keyframes.reduce((y, S) => Math.max(y, S.time), M), 0), a = pt, l = /* @__PURE__ */ new Set(["x", "y", "turn", "head.turn"]), c = new Ct({ id: `${t}-hair-follow`, tracks: i.filter((M) => l.has(M.property)) }), h = (M, w, y) => {
    const S = c.getStateAtTime(M).values.get(t)?.get(w);
    return typeof S == "number" ? S : y;
  }, d = new Ct({ id: `${t}-hair-pose`, tracks: i }), u = (M) => d.getStateAtTime(M).values.get(t), f = /* @__PURE__ */ new Map(), g = (M) => {
    const w = Math.round(M / ln);
    let y = f.get(w);
    if (!y) {
      const S = {};
      for (const [A, v] of u(w * ln) ?? []) S[A] = v;
      const E = se(n, Qr(S, a, s.gaits)).head.center;
      f.set(w, y = { x: E.x, y: E.y });
    }
    return y;
  }, p = (M) => {
    const w = Math.floor(M / ln), y = M / ln - w, S = g(w * ln), E = g((w + 1) * ln);
    return { x: S.x + (E.x - S.x) * y, y: S.y + (E.y - S.y) * y };
  }, m = aw(
    (M) => {
      const w = p(M);
      return {
        x: h(M, "x", 0) + w.x,
        y: h(M, "y", 0) + w.y,
        turn: h(M, "turn", a.turn ?? 0),
        headTurn: h(M, "head.turn", a["head.turn"] ?? 0)
      };
    },
    {
      start: 0,
      end: r + (s.settle ?? lw),
      headRadius: se(n, pt).head.rx,
      step: s.step,
      stiffness: s.stiffness,
      damping: s.damping,
      amount: s.amount,
      wind: s.wind
    }
  ), b = [];
  for (const M of rw) {
    const w = M.slice(5);
    let y = m.map((E) => ({ time: E.time, value: E[w] }));
    if (y.every((E) => Math.abs(E.value) < 1e-3)) continue;
    const S = i.find((E) => E.property === M);
    if (S) {
      const E = new Ct({ id: `${t}-${M}-own`, tracks: [S] }), A = (v) => Number(E.getStateAtTime(v).values.get(t)?.get(M) ?? 0);
      y = y.map((v) => ({ time: v.time, value: v.value + A(v.time) }));
    }
    b.push({ id: `${t}-${M}`, target: t, property: M, keyframes: y });
  }
  return b;
}
const wn = {
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
function fd(t) {
  if (t === void 0) return wn.full;
  if (typeof t == "string") return wn[t];
  const { base: e, ...n } = t;
  return { ...wn[e ?? "full"], ...n };
}
const ar = 160, cw = 120, hw = 700, pi = 60, dw = 90, Ps = 3200, kn = 1, Be = 1e-6;
function ra(t, e, n = {}) {
  const s = fd(n.style), o = n.seed ?? 1, i = {};
  if (t.length === 0) return i;
  const r = Object.keys(t[0].pose).filter((d) => t.some((u) => Math.abs(u.pose[d] - t[0].pose[d]) > Be));
  for (const d of r) i[d] = uw(d, t, e, s, o);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const d = fw(t, e, s, o, t[0].pose[a]);
    d.length > 0 && (i[a] = d);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const d = pw(t, c, t[0].pose[h], s.jumpSquash);
    d.length > 0 && (i[h] = d);
  }
  return i;
}
function uw(t, e, n, s, o) {
  const i = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = i ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (f) => {
    const g = (e[f].time - e[f - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], d = (f, g, p) => {
    const m = h[h.length - 1];
    if (f <= m.time + kn) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: f, value: g, ...p ? { easing: p } : {} });
  };
  let u = e[0].pose[t];
  for (let f = 1; f < e.length; f++) {
    const g = e[f], p = e[f - 1].pose[t], m = g.pose[t], b = m - p, M = h[h.length - 1].time, w = g.act !== !1;
    if (Math.abs(b) <= Be) {
      const P = g.time + (w ? c(f) : 0);
      if (f === e.length - 1)
        Math.abs(u - m) > Be && d(Math.max(P, M + ar), m, "ease-in-out"), u = m;
      else if (w && a && s.drift > 0 && n.drift.includes(t) && P - M >= hw) {
        const I = oe(`${o}:${t}:${f}`) % 2 === 0 ? 1 : -1;
        u = m + I * s.drift * r, d(P, u, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      d(e[f - 1].time, u), d(g.time, m, g.easing), u = m;
      continue;
    }
    const y = c(f), S = Math.max(e[f - 1].time + y, M);
    let E = g.time + y;
    i && s.eyeDart > 0 && (E = Math.min(E, S + s.eyeDart));
    const A = E - S;
    if (A <= kn) {
      d(g.time, m, g.easing), u = m;
      continue;
    }
    d(S, u);
    const v = Math.sign(b);
    if (a && s.anticipation > 0 && r > 0 && A >= ar) {
      const P = u - v * Math.min(Math.abs(b) * s.anticipation, r), I = S + A * s.anticipationTime;
      d(I, P, "ease-in-out"), s.hold > 0 && d(I + A * s.hold, P);
    }
    const k = f + 1 < e.length ? e[f + 1].time - g.time : 1 / 0, x = Math.min(s.settle, k / 2);
    if (a && s.overshoot > 0 && r > 0 && A >= cw && x > kn) {
      const P = Math.min(Math.abs(b) * s.overshoot, r);
      d(E, m + v * P, g.easing ?? s.actionEase), d(E + x, m, s.settleEase);
    } else
      d(E, m, g.easing ?? s.actionEase);
    u = m;
  }
  return h;
}
function fw(t, e, n, s, o) {
  const i = [], r = pi + dw;
  for (let f = 1; f < t.length; f++) {
    const g = t[f - 1].pose, p = t[f].pose;
    Object.entries(e.headTurns).some(([b, M]) => Math.abs((p[b] ?? 0) - (g[b] ?? 0)) > M) && t[f].act !== !1 && i.push(Math.max(t[0].time, t[f - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...i];
  let h = a + Ps * 0.6, d = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Ps / 2) || i.push(h);
    const g = (oe(`${s}:blink:${d++}`) % 1e3 / 1e3 - 0.5) * (Ps * 0.66);
    h += Ps + g;
  }
  i.sort((f, g) => f - g);
  const u = [{ time: a, value: o }];
  for (const f of i) {
    const g = u[u.length - 1].time;
    f + pi <= g + kn || (f > g + kn && u.push({ time: f, value: o }), u.push({ time: f + pi, value: 1, easing: "ease-in" }), u.push({ time: f + r, value: o, easing: "ease-out" }));
  }
  return u.length > 1 ? u : [];
}
function pw(t, e, n, s) {
  const o = n * (1 - 0.18 * s), i = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const d = r[r.length - 1];
    l <= d.time + kn || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], d = t[l - 1].time, u = t[l].time, f = u - d;
    if (!(f < ar || t[l].act === !1)) {
      if (c <= Be && h > Be)
        a(d, n), a(d + f * 0.2, o, "ease-out"), a(d + f * 0.45, i, "ease-out"), a(u, n, "ease-in-out");
      else if (c > Be && h <= Be) {
        const g = l + 1 < t.length ? t[l + 1].time - u : 400;
        a(d + f * 0.5, n), a(u - Math.min(60, f * 0.15), i, "ease-in"), a(u, o, "ease-out"), a(u + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const gw = {
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
function mw(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function yw() {
  const t = {}, e = {};
  for (const n of Object.keys(pt)) {
    const s = mw(n);
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
const bw = yw();
function pd(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function ww(t, e, n = {}) {
  const s = _r(e), o = e.map((i, r) => ({ time: i.time, pose: { ...s[r] }, easing: i.easing, act: i.act }));
  return pd(t, ra(o, n.rig ?? gw, n));
}
function kw(t, e, n = {}) {
  const s = n.rest ?? pt, o = j0(e, s), i = e.map((r, a) => ({ time: r.time, pose: { ...s, ...o[a] }, easing: r.easing, act: r.act }));
  return pd(t, ra(i, n.rig ?? bw, n));
}
const ic = kt.shocked, vw = kt.scared, Ge = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...ic, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...kt.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...ic, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...kt.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: t.leftShoulder, rightShoulder: t.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: lt.leftHip, rightHip: lt.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...vw, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Vt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function rc(t, e) {
  const n = typeof e.from == "string" ? Vt[e.from] : e.from ?? lt;
  return gd(Ge[t](n), { ...e, from: n });
}
function gd(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((o) => (s = { ...s, ...o.pose }, { time: e.at + o.after * n, pose: s, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
function po(t, e = 1) {
  const n = Ge[t](lt);
  return n[n.length - 1].after * e;
}
function Mw(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), o = n.spacing ?? 5, i = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * o, c = Math.floor(Math.abs(l) / Math.max(o, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const d = e[h - 1], u = e[h], f = u.x - d.x, g = u.y - d.y, p = Math.hypot(f, g) || 1, m = -g / p, b = f / p, M = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - M), t.lineWidth = i * (1 - M * 0.7), t.beginPath(), t.moveTo(d.x + m * l, d.y + b * l), t.lineTo(u.x + m * l, u.y + b * l), t.stroke();
    }
  }
  t.restore();
}
const xw = {
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
function bM(t, e, n, s, o = {}) {
  const i = n.stateAt;
  if (!i) return;
  const r = o.length ?? 120, a = Math.max(2, Math.round(o.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let f = 0; f < a; f++) {
    const g = l + (n.time - l) * f / (a - 1);
    c.push(l0(e, { time: g, state: i(g) }, s).joints);
  }
  const h = c[c.length - 1].height, d = (o.threshold ?? 1.2) * h, u = (o.parts ?? ["hands", "toes", "head"]).flatMap((f) => xw[f]);
  for (const f of u) {
    const g = c.map(f.at);
    let p = 0;
    for (let M = 1; M < g.length; M++) p += Math.hypot(g[M].x - g[M - 1].x, g[M].y - g[M - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= d) continue;
    const b = Math.min(1, (m - d) / (d * 0.5));
    Mw(t, g, { ...o, opacity: (o.opacity ?? 0.7) * b, spacing: o.spacing ?? h * 0.02 });
  }
}
function Sw(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, o * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = oe(`${i}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * o * 0.3 * r, d = e.y - o * (0.06 + 0.12 * l) * r + Math.abs(c) * o * 0.03, u = o * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, d, u, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function wM(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, o * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < i; a++) {
    const l = -Math.PI / 2 + (a - (i - 1) / 2) * Math.PI / (i + 1), c = o * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, d = e.y + Math.sin(l) * c;
    Tw(t, h, d, o * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function Tw(t, e, n, s, o) {
  t.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.45, a = o + i * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    i === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const He = {
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
}, Wn = 1, Is = 0.55, ac = 0.35, Ew = 1.6, lc = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, cc = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, hc = {
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
}, dc = {
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
}, Aw = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, $w = "्", uc = "़", Pw = (t) => t >= "क" && t <= "ह", fc = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function Iw(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (o, i) => {
    const r = e[e.length - 1];
    r && r.viseme === o ? r.weight += i * 0.5 : e.push({ viseme: o, weight: i });
  };
  for (let o = 0; o < n.length; o++) {
    const i = n[o], r = n[o + 1];
    if (fc.has(i)) s("rest", Ew);
    else if (/\s/.test(i)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: ac });
    } else if ((i === "o" || i === "e") && r === i)
      s(i === "o" ? "u" : "i", Wn), o++;
    else if (i in lc) s(lc[i], Wn);
    else if (i in cc) s(cc[i], Is);
    else {
      if (i === "h") continue;
      if (/[a-z]/.test(i)) s("c", Is);
      else if (i in hc) s(hc[i], Wn);
      else if (Pw(i)) {
        const a = r === uc ? i === "फ" ? "f" : void 0 : Aw[i];
        s(a ?? "c", Is);
        let l = o + 1;
        n[l] === uc && l++;
        const c = n[l];
        c === $w ? o = l : c && c in dc ? (s(dc[c], Wn), o = l) : (!c || /\s/.test(c) || fc.has(c) || s("a", Wn * 0.6), o = l - 1);
      } else (i === "ं" || i === "ँ") && s("l", Is * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === ac); ) e.pop();
  return e;
}
function md(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", o = e.energy ?? 1, i = Iw(t.text), r = [{ time: t.start, value: He.rest.mouth }], a = [{ time: t.start, value: He.rest.mouthWidth }], l = i.reduce((h, d) => h + d.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const d of i) {
      const u = c * d.weight / l, f = h + Math.min(u * 0.4, 60);
      if (f > r[r.length - 1].time) {
        const g = He[d.viseme];
        r.push({ time: f, value: g.mouth * o, easing: "ease-out" }), a.push({ time: f, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, o), easing: "ease-out" });
      }
      h += u;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: He.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: He.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function kM(t, e, n = {}) {
  const s = {};
  for (const o of [...e].sort((i, r) => i.start - r.start))
    for (const [i, r] of Object.entries(md(o, n))) {
      const a = s[i] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([o, i]) => ({ id: `${t}-${o}`, target: t, property: o, keyframes: i }));
}
function yd(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const o = s.fields?.mouth ?? "mouth", i = s.fields?.mouthWidth ?? "mouthWidth", r = { [o]: He.rest.mouth, [i]: He.rest.mouthWidth, ...s.rest }, a = new Ct({ id: "before-speech", tracks: e }), l = (d, u) => a.getStateAtTime(u).values.get(t)?.get(d) ?? r[d], c = [o, i], h = e.filter((d) => d.target !== t || !c.includes(d.property));
  for (const d of c) {
    const u = e.find((g) => g.target === t && g.property === d);
    let f = u ? [...u.keyframes] : [{ time: 0, value: l(d, 0) }];
    for (const g of n) {
      const p = md(g, s)[d];
      p[0] = { ...p[0], value: l(d, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(d, g.end) }, f = [...f.filter((m) => m.time < g.start || m.time > g.end), ...p], f.sort((m, b) => m.time - b.time);
    }
    h.push({ id: u?.id ?? `${t}-${d}`, target: t, property: d, keyframes: f });
  }
  return h;
}
const Ho = {
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
function bd(t = {}) {
  return [
    ...Object.keys(Ft),
    ...Object.keys(Vt),
    ...Object.keys(Ge),
    ...Object.keys(Ho),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function wd(t = {}) {
  const e = new Set(bd()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function kd(t = {}) {
  const e = {};
  for (const n of Object.keys(Ft)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(Vt)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(Ge)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(Ho)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const lr = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], Ow = {
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
}, Os = ["viewer", "ahead", "back"], _e = (t) => typeof t == "number" && Number.isFinite(t);
function go(t, e = {}) {
  const n = wd(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = bd(e), o = (l) => l in Ft || l in (e.gaits ?? {}), i = Object.keys(kt), r = Object.keys(lt);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), d = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const u = l;
    for (const p of Object.keys(u))
      lr.includes(p) || h(ut("beat field", p, lr, Ow[p.toLowerCase()]));
    const f = u.do;
    if (f === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof f != "string" || !s.includes(f)) {
      h(ut("action", f, s));
      return;
    }
    const g = Ho[f] ?? e.actions?.[f];
    for (const p of g?.needs ?? [])
      u[p] === void 0 && h(`\`${f}\` needs \`${p}\`.`);
    if (o(f) && u.to === void 0 && d(`\`${f}\` without \`to\` walks nowhere.`), f === "leap" && u.to === void 0 && u.onto === void 0 && d("`leap` without `to` or `onto` jumps on the spot."), u.mood !== void 0 && (typeof u.mood != "string" || !i.includes(u.mood)) && h(ut("mood", u.mood, i)), u.pose !== void 0)
      if (!u.pose || typeof u.pose != "object" || Array.isArray(u.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(u.pose))
          r.includes(p) ? _e(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(ut("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = u[p];
      m !== void 0 && !(_e(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    _e(u.at) && (u.at < a && d(`\`at\` ${u.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = u.at);
    for (const p of ["to", "onto"]) {
      const m = u[p];
      m !== void 0 && !_e(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (u.toward !== void 0 && !_e(u.toward) && !Os.includes(u.toward) && h(`\`toward\` is a scene x or one of ${Os.join(", ")}${typeof u.toward == "string" && Gs(u.toward, Os) ? ` (did you mean "${Gs(u.toward, Os)}"?)` : ""} (got ${JSON.stringify(u.toward)}).`), u.say !== void 0 && typeof u.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(u.say)}).`), u.target !== void 0) {
      const p = u.target;
      (!p || typeof p != "object" || !_e(p.x) || !_e(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function pc(t, e = {}, n = "scriptTracks") {
  const s = go(t, e).filter((o) => o.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((o) => `  ${o.beat >= 0 ? `beat ${o.beat}: ` : ""}${o.message}`).join(`
`)}`);
}
Cg(kd);
function vM(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function MM(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const gc = 8;
function aa(t, e = {}, n = 0) {
  if (n > gc) throw new Error(`scriptTracks: custom actions nest more than ${gc} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const o = e[s.do];
    if (!o || !("beats" in o)) return [s];
    const i = o.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return aa(i, e, n + 1);
  });
}
function _w(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const mc = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, Hw = 450, Cw = 2.4, Rw = 160, yc = 2.5, Lw = 200, Ww = 340, Fw = 1.1, bc = [380, 900], Nw = 0.35, _s = 300, gi = 150, Dw = 260, Bw = 1.2, mi = 160, wc = 400, Fn = 300, qw = 450, kc = 500, yi = 350, vc = 150, zw = 120, bi = 180, Mc = 420, Yw = 300, xc = 300, Kw = 140, wi = 150, Sc = 450, jw = 450, ki = 150, Tc = 350, Ec = 400, Xw = 12, Uw = 600, Ac = 90, $c = 400, Gw = 200, Vw = 0.09, Pc = 350, de = 450, vi = 1200, Jw = 700, cn = 320, ue = 220, Zw = 65, Qw = 700, Ic = (t) => t in Ge, t2 = (t) => t in Vt;
function e2(t) {
  return Math.max(Qw, Array.from(t).length * Zw);
}
function la(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  pc(e, s);
  const o = n.gait ?? "walk", i = aa(e, n.actions).map(($) => $.do === "go" ? { ...$, do: o } : $);
  pc(i, s, "scriptTracks (after expanding custom actions)");
  const r = ($) => Ft[$] ?? n.gaits?.[$], a = ($) => mc[$] ?? n.gaits?.[$]?.cycle ?? 1e3, l = ($) => {
    const R = n.actions?.[$];
    return R && "steps" in R ? R : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, d = n.height ?? 300;
  let u = c, f = h, g = n.facing ?? 1, p = n.start ?? lt, m = 0, b = 0;
  const M = [{ time: 0, pose: p }], w = [{ time: 0, value: 0 }], y = [{ time: 0, value: 0 }], S = [{ time: 0, value: 0 }], E = [{ time: 0, value: 0 }], A = [{ time: 0, value: "walk" }], v = [{ time: 0, value: g }], k = [], x = [], P = [], I = ($, R, N, q) => {
    p = { ...p, ...R }, N && (p = Le(p, N)), M.push({ time: $, pose: p, ...q === !1 ? { act: q } : {} });
  }, O = ($, R, N) => (I($ + cn / 2, { turn: 0 }, N), v.push({ time: $ + cn / 2, value: g }, { time: $ + cn / 2 + 1, value: R }), g = R, I($ + cn, { turn: 1 }), $ + cn), _ = ($) => $ < u ? -1 : 1, W = ($, R, N) => _(R) !== g ? O($, _(R), N) : $, B = ($, R, N, q = "arm") => {
    const D = q === "arm", z = ae({ ...$, ...D ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: d, facing: g }), G = D ? z.shoulders.right : z.hip, F = D ? z.elbows.right : z.knees.right, U = (ot, it) => Math.atan2(g * ot, it) * 180 / Math.PI, nt = ((U(R - (u + G.x), N - (f + G.y)) - U(F.x - G.x, F.y - G.y)) % 360 + 360) % 360;
    return nt > 270 ? nt - 360 : nt;
  }, j = ($, R, N, q) => {
    const D = q === "arm", z = ae({ ...$, ...D ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: d, facing: g }), G = D ? z.shoulders.right : z.hip, F = D ? { x: (z.hands.right.x + z.fingertips.right.x) / 2, y: (z.hands.right.y + z.fingertips.right.y) / 2 } : z.feet.right, U = Math.hypot(F.x - G.x, F.y - G.y) * ((D ? n.reach?.arm : n.reach?.leg) ?? 1), Y = N - (f + G.y), nt = Math.abs(Y) < U ? Math.sqrt(U * U - Y * Y) : U * 0.1;
    return R - G.x - g * nt;
  }, V = ($) => {
    const R = ae($, { height: d, facing: g });
    return { x: u + (R.hands.right.x + R.fingertips.right.x) / 2, y: f + (R.hands.right.y + R.fingertips.right.y) / 2 };
  }, K = ($, R, N) => {
    const q = { ...$, rightWrist: 0, rightElbow: 0, rightShoulder: B($, R, N) }, D = ae(q, { height: d, facing: g }), z = { x: u + D.shoulders.right.x, y: f + D.shoulders.right.y }, G = { x: u + D.elbows.right.x, y: f + D.elbows.right.y }, F = V(q), U = Math.hypot(G.x - z.x, G.y - z.y), Y = Math.hypot(F.x - G.x, F.y - G.y), nt = Math.min(U + Y - 0.01, Math.max(Math.abs(U - Y) + 0.01, Math.hypot(R - z.x, N - z.y))), ot = (tt) => tt * 180 / Math.PI, it = ot(Math.acos((U * U + nt * nt - Y * Y) / (2 * U * nt))), rt = 180 - ot(Math.acos((U * U + Y * Y - nt * nt) / (2 * U * Y)));
    let H = { rightShoulder: q.rightShoulder, rightElbow: 0 }, J = 1 / 0;
    for (const tt of [1, -1])
      for (const st of [1, -1]) {
        const Q = { rightShoulder: q.rightShoulder + tt * it, rightElbow: st * rt }, at = { ...$, rightWrist: 0, ...Q }, Z = V(at), et = Math.hypot(Z.x - R, Z.y - N) - ae(at, { height: d, facing: g }).elbows.right.y * 1e-3;
        et < J && (J = et, H = Q);
      }
    return H;
  }, T = ($, R, N) => Math.abs(R - u) < 2 ? $ : (w.push({ time: $, value: u - c }, { time: $ + N, value: R - c, easing: "ease-in-out" }), u = R, $ + N);
  for (const $ of i) {
    const R = Math.max($.at ?? b, b === 0 ? 0 : M[M.length - 1].time);
    let N = R, q, D;
    const z = $.pose ?? {}, G = l($.do);
    if (r($.do)) {
      const F = $.to ?? u, U = F === u ? g : _(F);
      let Y = R;
      U !== g ? Y = O(R, U, $.mood) : p.turn < 1 ? (Y = R + ue, I(Y, { turn: 1, ...z }, $.mood)) : ($.mood || $.pose) && I(R + ue, z, $.mood);
      const ot = Math.abs(F - u) / qi(r($.do), d), it = $.for ?? Math.max(ue * 2, ot * a($.do)), rt = Y + it;
      A.push({ time: Y, value: $.do }), E.push({ time: Y, value: 0 }, { time: Y + ue, value: 1, easing: "ease-out" }), E.push({ time: rt - ue, value: 1 }, { time: rt, value: 0, easing: "ease-in" }), S.push({ time: Y, value: m }, { time: rt, value: m + ot }), w.push({ time: Y, value: u - c }, { time: rt, value: F - c }), m += ot, u = F, I(rt, {}), N = rt;
    } else if ($.do === "zip") {
      const F = $.to ?? u, U = F === u ? g : _(F);
      let Y = R;
      U !== g ? Y = O(R, U, $.mood) : p.turn < 1 && (Y = R + ue, I(Y, { turn: 1 }, $.mood));
      const nt = rc("windUp", { at: Y, from: $.mood ? Le(p, $.mood) : p });
      M.push(...nt), p = nt[nt.length - 1].pose;
      const ot = Y + po("windUp"), it = ot + Hw, rt = it + Math.max(Rw, Math.abs(F - u) / Cw);
      A.push({ time: ot, value: "run" }), E.push({ time: ot, value: 0 }, { time: ot + 80, value: 1, easing: "ease-out" }, { time: rt, value: 1 }, { time: rt + 120, value: 0 }), S.push({ time: ot, value: m }, { time: it, value: m + yc, easing: "ease-in" }), m += yc + (rt - it) / mc.run * 1.5, S.push({ time: rt, value: m }), w.push({ time: it, value: u - c }, { time: rt, value: F - c, easing: "ease-in" }), P.push({ kind: "dust", time: it, x: u, y: f, length: 900 }), u = F, I(rt, {}), N = rt;
    } else if ($.do === "leap") {
      const F = $.to ?? u, U = $.onto ?? f;
      let Y = F === u ? R : W(R, F, $.mood);
      p.turn < 1 && (Y += ue, I(Y, { turn: 1 }, $.mood));
      const nt = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      I(Y + Lw, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...nt }, $.mood, !1);
      const ot = Y + Ww;
      I(ot - 40, { stretch: 0.72 }, void 0, !1), I(ot, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const it = Math.hypot(F - u, U - f), rt = $.for ?? Math.min(bc[1], Math.max(bc[0], 300 + it * Fw)), H = Math.min(f, U) - Nw * d, J = Math.sqrt(f - H), tt = Math.sqrt(U - H), st = ot + rt * J / (J + tt), Q = ot + rt;
      I(st, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), I(Q, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), I(Q + 180, { stretch: 1.05, bend: -3 }, void 0, !1), I(Q + 340, { stretch: 1, bend: 0, leftHip: lt.leftHip, rightHip: lt.rightHip, leftShoulder: lt.leftShoulder, rightShoulder: lt.rightShoulder, leftElbow: lt.leftElbow, rightElbow: lt.rightElbow }, void 0, !1), w.push({ time: ot, value: u - c }, { time: Q, value: F - c }), y.push(
        { time: ot, value: f - h },
        { time: st, value: H - h, easing: "ease-out-quad" },
        { time: Q, value: U - h, easing: "ease-in-quad" }
      ), u = F, f = U, P.push({ kind: "dust", time: Q, x: u, y: f, length: 500 }), N = Q + 340, q = Q;
    } else if ($.do === "point" && $.target) {
      const F = $.target, U = W(R, F.x, $.mood), Y = { ...p, ...$.mood ? kt[$.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...z }, nt = ae(Y, { height: d, facing: g }).head.center, ot = Math.abs(F.x - (u + nt.x)), it = F.y - (f + nt.y), rt = U + de;
      I(rt, { ...Y, rightShoulder: B(Y, F.x, F.y), lookX: 1, lookY: n2(it / Math.max(1, Math.hypot(ot, it))) * 0.8 }), N = rt + ($.for ?? vi), q = rt, D = N;
    } else if ($.do === "swipe") {
      const F = $.target ?? { x: u + g * d * 0.5, y: f - d * 0.6 }, U = _(F.x), Y = W(R, F.x, $.mood), nt = U === 1 ? F.left ?? F.x : F.right ?? F.x, ot = U === 1 ? F.right ?? F.x : F.left ?? F.x, it = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...z };
      I(Y + _s, { ...it, rightShoulder: B(it, u - g * d * 0.3, f - d * 1.1) }, $.mood, !1);
      const rt = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, H = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      T(Y, j(rt, nt, F.y, "arm"), _s + gi), I(Y + _s + gi, { lean: -12 }, void 0, !1);
      const J = Y + _s + gi + 80;
      I(J, { ...rt, rightShoulder: B(rt, nt, F.y) }, void 0, !1);
      const tt = J + ($.for ?? Math.max(Dw, Math.abs(ot - nt) / Bw));
      w.push({ time: J, value: u - c }), u = j(H, ot, F.y, "arm"), w.push({ time: tt, value: u - c }), I(tt, { ...H, rightShoulder: B(H, ot, F.y) }, void 0, !1), I(tt + mi, { lean: 16, bend: 14, rightShoulder: B(p, ot + U * d * 0.4, F.y + d * 0.25) }, void 0, !1), I(tt + mi + wc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow }), N = tt + mi + wc, q = J, D = tt;
    } else if ($.do === "grab" && $.target) {
      const F = $.target, U = W(R, F.x, $.mood), Y = F.y > f - d * 0.5, nt = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: Y ? 35 : 0,
        lean: Y ? 12 : 0,
        stretch: Y ? 0.75 : 1,
        lookX: 1,
        lookY: Y ? 0.8 : 0,
        ...z
      }, it = T(U, j(nt, F.x, F.y, "arm"), Fn) + qw;
      I(it, { ...nt, rightShoulder: B(nt, F.x, F.y) }, $.mood, !1), I(it + 120, {}, void 0, !1), I(it + kc, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), N = it + kc + 150, q = it;
    } else if ($.do === "throw") {
      const F = $.target?.x ?? $.to ?? u + g * d, U = W(R, F, $.mood), Y = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...z };
      I(U + yi, { ...Y, rightShoulder: B(Y, u - g * d * 0.4, f - d * 1.05) }, $.mood, !1), I(U + yi + vc, { lean: -14 }, void 0, !1);
      const nt = U + yi + vc + zw, ot = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      M.push({ time: nt, pose: p = { ...ot, rightShoulder: B(ot, u + g * d, f - d * 1.1) }, easing: "ease-in", act: !1 }), I(nt + bi, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), I(nt + bi + Mc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, lookY: 0 }), N = nt + bi + Mc, q = nt, D = nt;
    } else if ($.do === "kick" && $.target) {
      const F = $.target, U = W(R, F.x, $.mood), Y = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, nt = T(U, j(Y, F.x, F.y, "leg"), Yw), ot = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      I(nt + xc, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...ot, ...z }, $.mood, !1);
      const it = nt + xc + Kw, rt = B(Y, F.x, F.y, "leg");
      M.push({ time: it, pose: p = { ...p, ...Y, rightHip: rt }, easing: "ease-in", act: !1 }), I(it + wi, { lean: -15, rightHip: rt + 20 }, void 0, !1), I(it + wi + Sc, {
        lean: 0,
        bend: 0,
        rightHip: lt.rightHip,
        rightKnee: 0,
        leftShoulder: lt.leftShoulder,
        rightShoulder: lt.rightShoulder,
        leftElbow: lt.leftElbow,
        rightElbow: lt.rightElbow,
        lookY: 0
      }), N = it + wi + Sc, q = it;
    } else if ($.do === "put" && $.target) {
      const F = $.target, U = W(R, F.x, $.mood), Y = F.y > f - d * 0.5, nt = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: Y ? 35 : 0, lean: Y ? 12 : 0, stretch: Y ? 0.75 : 1, lookX: 1, lookY: Y ? 0.8 : 0, ...z }, it = T(U, j(nt, F.x, F.y, "arm"), Fn) + jw;
      I(it, { ...nt, rightShoulder: B(nt, F.x, F.y) }, $.mood, !1), I(it + ki, {}, void 0, !1), I(it + ki + Tc, { bend: 0, lean: 0, stretch: 1, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, lookY: 0 }), N = it + ki + Tc, q = it;
    } else if ($.do === "write" && $.target) {
      const F = $.target, U = F.left ?? F.x, Y = F.right ?? F.x, nt = W(R, (U + Y) / 2, $.mood), ot = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...kt.thinking, lookX: 1, lookY: 0, ...z }, it = (Z) => j(ot, Z, F.y, "arm") + g * d * 0.08, rt = (Z) => {
        const X = V({ ...ot, ...K(ot, Z, F.y), rightWrist: 0 });
        return Math.hypot(X.x - Z, X.y - F.y) < 2;
      }, H = g === 1 ? U : Y, J = T(nt, it((U + Y) / 2), Fn), tt = !rt(U) || !rt(Y), st = tt ? T(J, it(U), Fn) + Ec : J + Ec;
      I(st, { ...ot, ...K(ot, tt ? U : H, F.y) }, $.mood, !1);
      const Q = $.for ?? Math.max(Uw, Math.abs(Y - U) * Xw);
      tt && w.push({ time: st, value: u - c });
      for (let Z = Ac, X = 0; Z <= Q; Z += Ac, X++) {
        const et = U + (Y - U) * Math.min(Z, Q) / Q;
        tt && (u = it(et), w.push({ time: st + Z, value: u - c }));
        const ct = (X % 2 === 0 ? -1 : 1) * d * 0.02;
        I(st + Z, K(ot, et, F.y + ct), void 0, !1);
      }
      const at = st + Q;
      I(at, K(ot, Y, F.y), void 0, !1), I(at + $c, { rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, ...kt.happy }), N = at + $c, q = st, D = at;
    } else if ($.do === "push" && $.target) {
      const F = $.target, U = $.to ?? F.x, Y = W(R, u + (U >= F.x ? 1 : -1), $.mood), nt = g === 1 ? F.left ?? F.x : F.right ?? F.x, ot = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...z }, it = j(ot, nt, F.y, "arm"), rt = T(Y, it + g * d * 0.06, Fn), H = K(ot, nt, F.y), J = { ...ot, ...H, leftShoulder: -H.rightShoulder, leftElbow: -H.rightElbow }, tt = rt + Gw;
      I(tt, J, $.mood, !1);
      const st = Math.abs(U - F.x), Q = tt + ($.for ?? Math.max(600, st / Vw)), at = st / qi("shove", d);
      A.push({ time: tt, value: "shove" }), E.push({ time: tt, value: 0 }, { time: tt + ue, value: 1, easing: "ease-out" }, { time: Q - ue, value: 1 }, { time: Q, value: 0, easing: "ease-in" }), S.push({ time: tt, value: m }, { time: Q, value: m + at }), m += at, w.push({ time: tt, value: u - c }, { time: Q, value: u + (U - F.x) - c }), u += U - F.x, I(Q, {}, void 0, !1), I(Q + Pc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, leftShoulder: lt.leftShoulder, rightElbow: lt.rightElbow, leftElbow: lt.leftElbow }), N = Q + Pc, q = tt, D = Q;
    } else if (G) {
      const F = $.mood ? Le(p, $.mood) : p, U = G.steps(F, $), Y = gd(U, { at: R, from: F });
      M.push(...Y), p = Y[Y.length - 1].pose, N = R + Math.max(_w(U), $.for ?? 0);
    } else if (Ic($.do)) {
      const F = rc($.do, { at: R, from: $.mood ? Le(p, $.mood) : p });
      M.push(...F), p = F[F.length - 1].pose, N = R + po($.do), $.do === "take" && P.push({ kind: "dust", time: R + 900, x: u, y: f, length: 500 }), $.do === "land" && P.push({ kind: "dust", time: R + 120, x: u, y: f, length: 500 });
    } else if ($.do === "look" || $.do === "face") {
      const F = $.toward ?? "viewer", U = $.for ?? Jw;
      if (F === "viewer") I(R + de, { turn: 0, lookX: 0, lookY: 0, ...z }, $.mood);
      else if (F === "ahead") I(R + de, { turn: $.do === "face" ? 1 : 0.6, lookX: 1, ...z }, $.mood);
      else if (F === "back") I(R + de, { turn: 0.2, lookX: -1, ...z }, $.mood);
      else {
        const Y = _(F);
        Y !== g && $.do === "face" ? (O(R, Y, $.mood), I(R + cn + 1, { lookX: 1, ...z })) : Y !== g ? I(R + de, { turn: 0.25, lookX: -1, ...z }, $.mood) : I(R + de, { turn: $.do === "face" ? 1 : 0.6, lookX: 1, ...z }, $.mood);
      }
      N = R + Math.max(U, de);
    } else if (t2($.do) || $.do === "stand") {
      const F = $.do === "stand" ? n.rest ?? lt : Vt[$.do], U = F.turn !== lt.turn ? F.turn : p.turn, Y = $.mood ? kt[$.mood] : { lookX: p.lookX, lookY: p.lookY };
      I(R + de, { ...F, turn: U, ...Y, ...z }), N = R + ($.for ?? vi);
    } else {
      const F = $.for ?? ($.say ? e2($.say) : vi);
      ($.mood || $.pose) && I(R + Math.min(de, F / 2), z, $.mood), N = R + F;
    }
    if ($.say) {
      const F = r($.do) || Ic($.do) || G ? R : R + Math.min(150, (N - R) / 4), U = r($.do) ? N : Math.max(F + 200, N - 100);
      k.push({ text: $.say, start: F, end: U }), $.do === "say" && i2(M, p, F, U);
    }
    $.onto !== void 0 && $.do !== "leap" && $.onto !== f && (y.push({ time: R, value: f - h }, { time: N, value: $.onto - h, easing: "ease-in-out" }), f = $.onto), N > M[M.length - 1].time && M.push({ time: N, pose: p }), x.push({ start: R, end: N, ...q !== void 0 ? { contact: q } : {}, ...D !== void 0 ? { release: D } : {} }), b = N;
  }
  const C = ww(t, o2(M), n), L = [
    { id: `${t}-x`, target: t, property: "x", keyframes: w },
    { id: `${t}-y`, target: t, property: "y", keyframes: y },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: S },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: E },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: A },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: v }
  ].filter(
    ($) => $.keyframes.length > 1 || $.property === "x" || // Starting left is kept even if it never turns: a figure target faces right unless told.
    $.property === "facing" && $.keyframes[0].value === -1
  );
  return {
    tracks: [...yd(t, C, k, { energy: n.energy }), ...L],
    duration: b,
    lines: k,
    keys: M,
    beats: x,
    effects: P
  };
}
const n2 = (t) => Math.max(-1, Math.min(1, t)), s2 = 30;
function o2(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < s2 ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function i2(t, e, n, s) {
  const i = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !i.some((c) => Math.abs(c.time - l.time) < 60)), ...i), t.sort((l, c) => l.time - c.time);
}
function vd(t, e, n) {
  const s = new Ct({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), o = a0({ x: n.x, y: n.y, style: n.style, cast: n.cast }), i = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = l0(o, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[i], d = c.fingertips[i];
    if (a.push({ time: l, x: (h.x + d.x) / 2, y: (h.y + d.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const Jn = ["start", "contact", "release", "end"], r2 = ["surface", "edit", "anchor", "at", "until"], a2 = ["carry"], Ys = (t) => !!t && typeof t == "object" && !Array.isArray(t) && "surface" in t && "anchor" in t, l2 = (t) => t.then === void 0 ? [] : Array.isArray(t.then) ? t.then : [t.then];
function xM(t, e, n, s = {}) {
  const o = c2(n, e, s).filter((u) => u.level === "error");
  if (o.length > 0)
    throw new Error(`surfaceScript: ${o.length} problem(s) in the beats:
${o.map((u) => `  ${u.beat >= 0 ? `beat ${u.beat}: ` : ""}${u.message}`).join(`
`)}`);
  const i = n.map((u) => Md(u, e)), r = la(t, i, s), a = h2(i, r.beats, s), l = s.ground ?? 0, c = (u) => s.ride === !1 ? u : Object.values(e).reduce((f, g) => g.ride(f, t, { ground: l }), u);
  n.forEach((u, f) => {
    for (const g of l2(u)) {
      const p = (y) => new Error(`surfaceScript: beat ${f} (${u.do}), ${g.edit} on ${g.surface}: ${y}`), m = (y, S) => {
        const E = typeof y == "object" ? y.beat : f, A = (typeof y == "object" ? y.at : y) ?? S ?? "start", v = a[E][A];
        if (v === void 0) {
          const k = Jn.filter((x) => a[E][x] !== void 0).join(", ");
          throw p(`beat ${E} (${n[E].do}) has no ${A} (it has ${k})`);
        }
        return v;
      }, b = e[g.surface], M = m(g.at ?? (a[f].contact !== void 0 ? "contact" : "start")), w = g.until === void 0 ? void 0 : m(g.until, "end");
      if (w !== void 0 && w < M) throw p(`it ends (${w} ms) before it starts (${M} ms)`);
      try {
        if (g.edit === "carry") {
          const S = b.piece(g.anchor), E = vd(t, c(r.tracks), {
            x: s.from ?? 0,
            y: l,
            style: s.figureStyle ?? (s.height ? { height: s.height } : void 0),
            cast: s,
            start: M,
            end: w
          });
          b.follow(S, E);
          continue;
        }
        const y = Object.fromEntries(Object.entries(g).filter(([S]) => !r2.includes(S)));
        b.edit(g.edit, g.anchor, { ...y, at: M, ...w !== void 0 ? { duration: w - M } : {} });
      } catch (y) {
        throw p(y.message);
      }
    }
  });
  const h = c(r.tracks), d = Object.entries(e).flatMap(([u, f]) => f.tracks(u));
  return { ...r, tracks: [...h, ...d], figureTracks: h };
}
function c2(t, e, n = {}) {
  if (!Array.isArray(t)) return go(t, n);
  const s = [], o = Object.keys(e), i = (c, h, d) => {
    const u = typeof h == "string" ? e[h] : void 0;
    return u || s.push({ level: "error", beat: c, message: `${d}: ${ut("surface", h, o)}` }), u;
  }, r = (c, h, d, u) => {
    if (typeof d != "string") {
      s.push({ level: "error", beat: c, message: `${u}: \`anchor\` is a place name such as ${Object.keys(h.about.anchors).join(", ")} (got ${JSON.stringify(d)}).` });
      return;
    }
    try {
      h.anchor(d, 0);
    } catch (f) {
      s.push({ level: "error", beat: c, message: `${u}: ${f.message}` });
    }
  }, a = (c, h, d) => {
    const u = typeof h == "object" && h !== null ? h.at : h;
    if (typeof h == "object" && h !== null) {
      const f = h.beat;
      if ((typeof f != "number" || !Number.isInteger(f) || f < c || f >= t.length) && s.push({ level: "error", beat: c, message: `${d}: \`beat\` is the index of this beat or a later one, ${c} to ${t.length - 1} (got ${JSON.stringify(f)}).` }), u === void 0) return;
    }
    typeof u == "number" ? s.push({ level: "error", beat: c, message: `${d}: a cue starts at a moment of its beat (${Jn.join(", ")}), not at ms; set the beat's own \`at\` to move it.` }) : (typeof u != "string" || !Jn.includes(u)) && s.push({ level: "error", beat: c, message: `${d}: ${ut("moment", u, Jn)}` });
  };
  t.forEach((c, h) => {
    if (!c || typeof c != "object" || Array.isArray(c)) return;
    const d = c;
    for (const f of ["target", "to", "onto"]) {
      if (!Ys(d[f])) continue;
      const g = d[f], p = i(h, g.surface, `\`${f}\``);
      p && r(h, p, g.anchor, `\`${f}\``);
    }
    if (d.then === void 0) return;
    (Array.isArray(d.then) ? d.then : [d.then]).forEach((f) => {
      if (!f || typeof f != "object" || Array.isArray(f)) {
        s.push({ level: "error", beat: h, message: "`then` is a cue, { surface, edit, anchor, at?, until? }, or a list of them." });
        return;
      }
      const g = f, p = i(h, g.surface, "`then`");
      if (!p) return;
      const m = `\`then\` (${String(g.edit)} on ${String(g.surface)})`, b = [...Object.keys(p.about.edits), ...a2];
      if (typeof g.edit != "string" || !b.includes(g.edit)) {
        s.push({ level: "error", beat: h, message: `\`then\`: ${ut("edit", g.edit, b)}` });
        return;
      }
      for (const M of Array.isArray(g.anchor) ? g.anchor : [g.anchor]) r(h, p, M, m);
      g.edit === "carry" && typeof g.anchor != "string" && s.push({ level: "error", beat: h, message: `${m}: \`carry\` takes one anchor, the piece it carries.` }), g.edit === "carry" && g.until === void 0 && s.push({ level: "error", beat: h, message: `${m}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${h + 1}, at: 'release' }).` }), g.at !== void 0 && a(h, g.at, `${m} \`at\``), g.until !== void 0 && a(h, g.until, `${m} \`until\``), g.until !== void 0 && g.duration !== void 0 && s.push({ level: "error", beat: h, message: `${m}: give \`until\` or \`duration\`, not both.` });
    });
  });
  const l = t.map((c) => c && typeof c == "object" && !Array.isArray(c) ? Md(c, e, !0) : c);
  return [...go(l, n), ...s];
}
function Md(t, e, n = !1) {
  const { then: s, ...o } = t, i = (a) => {
    try {
      return e[a.surface].anchor(a.anchor, 0);
    } catch (l) {
      if (n) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      throw l;
    }
  }, r = { ...o };
  return Ys(t.target) && (r.target = i(t.target)), Ys(t.to) && (r.to = i(t.to).x), Ys(t.onto) && (r.onto = i(t.onto).top), r;
}
function h2(t, e, n) {
  let s = 0;
  return t.map((o) => {
    const i = aa([o], n.actions).length, r = e.slice(s, s + i);
    s += i;
    const a = r.find((c) => c.contact !== void 0)?.contact, l = [...r].reverse().find((c) => c.release !== void 0)?.release;
    return {
      start: r[0]?.start,
      end: r[r.length - 1]?.end,
      ...a !== void 0 ? { contact: a } : {},
      ...l !== void 0 ? { release: l } : {}
    };
  });
}
function SM(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = wd(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(Ft), ...Object.keys(t.gaits ?? {})], o = t.gait ?? "walk";
  if (!s.includes(o)) throw new Error(`persona "${t.name}": ${ut("gait", o, s)}`);
  if (t.mood && !(t.mood in kt)) throw new Error(`persona "${t.name}": ${ut("mood", t.mood, Object.keys(kt))}`);
  const i = t.acting ?? "snappy";
  if (typeof i == "string" && !(i in wn)) throw new Error(`persona "${t.name}": ${ut("acting style", i, Object.keys(wn))}`);
  if (typeof t.stance == "string" && !(t.stance in Vt)) throw new Error(`persona "${t.name}": ${ut("stance", t.stance, Object.keys(Vt))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? Vt[t.stance] : _t(t.stance ?? {}), l = t.mood ? Le(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (d) => a0({ x: d.x, y: d.y, pose: l, style: { ...c, ...d.facing ? { facing: d.facing } : {} }, cast: e }),
    script: (d, u, f = {}) => la(d, u, {
      ...e,
      from: f.from,
      ground: f.ground,
      facing: f.facing,
      height: r,
      style: i,
      gait: o,
      start: l,
      rest: l,
      energy: t.energy
    }),
    check: (d) => go(d, e),
    handPath: (d, u, f) => vd(d, u, { ...f, style: c, cast: e }),
    describe: () => ({
      name: t.name,
      summary: h,
      habits: {
        height: r,
        acting: typeof i == "string" ? i : "custom",
        gait: o,
        ...t.mood ? { mood: t.mood } : {},
        stance: typeof t.stance == "string" ? t.stance : t.stance ? "custom" : "rest"
      },
      actions: kd(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const d2 = /* @__PURE__ */ new Set(["x", "y", "walking", "gait"]), Oc = 0.215 + 0.205;
function u2(t, e, n = 1) {
  const { points: s } = se(t, pt), o = s["hip.left"], i = s["knee.left"], r = s["ankle.left"], a = o && i && r ? Math.hypot(i.x - o.x, i.y - o.y) + Math.hypot(r.x - i.x, r.y - i.y) : Oc * t.height;
  return N0(e, a / Oc, n);
}
function TM(t, e, n, s = {}) {
  const o = la(t, n, { ...s, height: e.height, reach: s.reach ?? f2(e) }), i = o.tracks.find((b) => b.property === "facing")?.keyframes ?? [], r = (b) => {
    let M = s.facing ?? 1;
    for (const w of i) w.time <= b && (M = w.value);
    return M;
  }, a = _r(o.keys), l = o.keys.map((b, M) => {
    const w = F1(a[M]);
    return {
      time: b.time,
      pose: r(b.time) < 0 ? _1(w) : w,
      ...b.easing ? { easing: b.easing } : {},
      ...b.act === !1 ? { act: !1 } : {}
    };
  }), { rest: c, start: h, ...d } = s;
  m2(l, a, n, o, e, r, s);
  const u = kw(t, l, d), f = yd(t, u, o.lines, { energy: s.energy }), g = o.tracks.filter((b) => d2.has(b.property)), p = o.tracks.find((b) => b.property === "walk");
  return { tracks: p ? [...f, ...g, M2(t, p, o.tracks, e, s)] : [...f, ...g], duration: o.duration, lines: o.lines, keys: l, beats: o.beats, effects: o.effects };
}
function f2(t) {
  const e = bt({ "arm.left.spread": 90, "arm.left.elbow": 0, "arm.left.bend": 0, "leg.left.knee": 0 }), n = se(t, e).points, s = Math.hypot(n["hand.left"].x - n["shoulder.left"].x, n["hand.left"].y - n["shoulder.left"].y), o = Math.hypot(n["toe.left"].x - n["hip.left"].x, n["toe.left"].y - n["hip.left"].y), i = ae({ ...lt, rightShoulder: 90, rightElbow: 0, rightWrist: 0 }, { height: t.height, facing: 1 }), r = ae({ ...lt, rightHip: 90, rightKnee: 0 }, { height: t.height, facing: 1 }), a = { x: (i.hands.right.x + i.fingertips.right.x) / 2, y: (i.hands.right.y + i.fingertips.right.y) / 2 }, l = Math.hypot(a.x - i.shoulders.right.x, a.y - i.shoulders.right.y), c = Math.hypot(r.feet.right.x - r.hip.x, r.feet.right.y - r.hip.y);
  return { arm: l > 0 ? s / l : 1, leg: c > 0 ? o / c : 1 };
}
const p2 = { point: "arm", grab: "arm", put: "arm", write: "arm", swipe: "arm", push: "arm", kick: "leg" }, g2 = /* @__PURE__ */ new Set(["point", "grab", "put", "kick"]);
function m2(t, e, n, s, o, i, r) {
  const a = s.beats;
  if (n.length !== a.length) return;
  const l = new Ct({ id: "placed", tracks: s.tracks.filter((h) => h.property === "x" || h.property === "y") }), c = (h) => {
    const d = l.getStateAtTime(h).values.get(s.tracks[0]?.target ?? "");
    return { x: (r.from ?? 0) + Number(d?.get("x") ?? 0), y: (r.ground ?? 0) + Number(d?.get("y") ?? 0) };
  };
  n.forEach((h, d) => {
    const u = p2[h.do], f = a[d];
    if (!u || f.contact === void 0 || h.do !== "swipe" && !h.target) return;
    const g = f.contact, p = f.release ?? f.contact;
    t.forEach((m, b) => {
      if (m.time < g - 1 || m.time > p + 1) return;
      const M = i(m.time), w = ae(e[b], { height: o.height, facing: M < 0 ? -1 : 1 }), y = c(m.time), S = g2.has(h.do) && h.target ? { x: h.target.x - y.x, y: h.target.y - y.y } : void 0, E = { x: (w.hands.right.x + w.fingertips.right.x) / 2, y: (w.hands.right.y + w.fingertips.right.y) / 2 }, A = S ?? (u === "arm" ? E : w.toes.right), v = M < 0 ? "right" : "left", k = `${u}.${v}`;
      let x = m.pose;
      if (h.do === "point")
        x = Pe(o, x, k, A);
      else if (u === "arm")
        x = Pe(o, v2(o, x, v, A), k, A);
      else
        for (let P = 0; P < 3; P++) {
          const I = se(o, x).points, O = I[`ankle.${v}`], _ = I[`toe.${v}`];
          x = Pe(o, x, k, { x: A.x - (_.x - O.x), y: A.y - (_.y - O.y) });
        }
      t[b] = { ...m, pose: x };
    });
  });
}
function y2(t, e) {
  const n = bt({ [`arm.${e}.spread`]: 90, [`arm.${e}.elbow`]: 0, [`arm.${e}.bend`]: 0 }), s = se(t, n).points;
  return Math.hypot(s[`hand.${e}`].x - s[`shoulder.${e}`].x, s[`hand.${e}`].y - s[`shoulder.${e}`].y);
}
const b2 = 5, w2 = 4, k2 = 8;
function v2(t, e, n, s) {
  const o = y2(t, n) * 0.9, i = (a) => {
    const l = se(t, a).points[`shoulder.${n}`];
    return Math.hypot(s.x - l.x, s.y - l.y) <= o;
  };
  if (i(e)) return e;
  let r = e;
  for (let a = 1; a <= k2; a++)
    if (r = { ...e, lean: (e.lean ?? 0) + b2 * a, bend: (e.bend ?? 0) + w2 * a }, i(r)) return r;
  return r;
}
function M2(t, e, n, s, o) {
  const i = n.find((d) => d.property === "gait"), r = i ? new Ct({ id: `${t}-gait-of`, tracks: [i] }) : void 0, a = (d) => {
    const u = r?.getStateAtTime(d).values.get(t)?.get("gait");
    if (typeof u == "string")
      return Ft[u] ?? o.gaits?.[u] ?? u;
  }, l = e.keyframes, c = [];
  let h = l[0]?.value ?? 0;
  return l.forEach((d, u) => {
    if (u > 0) {
      const f = l[u - 1], g = a((f.time + d.time) / 2), p = qi(g, s.height), m = u2(s, g);
      h += (d.value - f.value) * (m > 0 ? p / m : 1);
    } else
      h = d.value;
    c.push({ ...d, value: h });
  }), { ...e, keyframes: c };
}
const ft = ["rect", "circle", "text", "line", "path", "image", "custom"], x2 = ["rect", "circle", "line", "path"], ca = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: ft },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: ft },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: ft },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: ft },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: ft },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: ft },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: ft },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: ft },
  scale: { description: "Size, both ways", unit: "factor", types: ft },
  scaleX: { description: "Width factor", unit: "factor", types: ft },
  scaleY: { description: "Height factor", unit: "factor", types: ft },
  skewX: { description: "Slants it sideways", unit: "degrees", types: ft },
  skewY: { description: "Slants it up and down", unit: "degrees", types: ft },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: ft },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: ft },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: ft },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: ft },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: ft },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: ft },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: ft },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: ft },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: ft },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: ft },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: ft },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: ft },
  glowColor: { description: "Colour of the glow", kind: "color", types: ft },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: ft },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: ft },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: ft },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: ft },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: ft },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: x2 },
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
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: ft },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: ft }
}, cr = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, S2 = {
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
function T2(t) {
  const e = t, n = Object.entries(ca).filter(([, o]) => o.types.includes(t.type)).map(([o, { types: i, ...r }]) => ({ name: o, ...r, ...e[o] !== void 0 && typeof e[o] != "object" ? { value: e[o] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [o, i] of Object.entries(t.props ?? {}))
    n.push({ name: o, description: s?.props?.[o]?.description ?? "", ...s?.props?.[o], value: i });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function E2(t) {
  const e = T2(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(cr).filter((n) => e.includes(cr[n]))];
}
function EM(t, e) {
  const n = [], s = Object.keys(e);
  for (const o of t) {
    const i = (u) => n.push({ level: "error", track: o.id, message: u }), r = e[o.target];
    if (!r) {
      i(ut("target", o.target, s));
      continue;
    }
    const a = E2(r), l = r.type === "custom" && r.acceptsProp?.(o.property);
    if (!a.includes(o.property) && !l) {
      i(`${o.target}: ${ut("property", o.property, a, S2[o.property])}`);
      continue;
    }
    const c = o.keyframes ?? [];
    for (let u = 1; u < c.length; u++)
      c[u].time < c[u - 1].time && i(`${o.target}.${o.property}: keyframes out of time order (${c[u - 1].time} ms, then ${c[u].time} ms).`);
    const h = ca[cr[o.property] ?? o.property] ?? r.about?.props?.[o.property], d = h && (h.kind ?? "number") === "number";
    for (const u of c) {
      if (d && typeof u.value != "number") {
        i(`${o.target}.${o.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(u.value)} at ${u.time} ms).`);
        break;
      }
      if (d && typeof u.value == "number" && (h.min !== void 0 && u.value < h.min || h.max !== void 0 && u.value > h.max)) {
        n.push({ level: "warning", track: o.id, message: `${o.target}.${o.property}: ${u.value} at ${u.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const vn = (t, e) => t[2] <= -e;
function hr(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function _c(t, e) {
  if (t.every((s) => vn(s, e))) return t;
  const n = [];
  return t.forEach((s, o) => {
    const i = t[(o + t.length - 1) % t.length], r = vn(s, e), a = vn(i, e);
    r !== a && n.push(hr(i, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function A2(t, e) {
  if (t.every((o) => vn(o, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((o, i) => {
    const r = vn(o, e);
    if (i > 0) {
      const a = t[i - 1], l = vn(a, e);
      l && !r ? (s.push(hr(a, o, e)), n.push(s), s = []) : !l && r && s.push(hr(a, o, e));
    }
    r && s.push(o);
  }), s.length > 0 && n.push(s), n.filter((o) => o.length >= 2);
}
function Hc(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const o = Math.round(s / n);
  return Array.from({ length: o + 1 }, (i, r) => t + s * r / o);
}
function $2(t, e, n) {
  const s = (o, i) => Math.max(0, Math.min(o.length - 2, o.findIndex((r, a) => a > 0 && i <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function P2(t, e) {
  const n = (s) => {
    const o = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], i = Math.hypot(...o) || 1;
    return [o[0] / i, o[1] / i, o[2] / i];
  };
  return { ...t, vertices: t.vertices.map((s) => qt(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function Hs(t, e, n, s) {
  const o = (r) => (r[e] - n) * s >= 0;
  if (t.every(o)) return t;
  const i = [];
  return t.forEach((r, a) => {
    const l = t[(a + t.length - 1) % t.length];
    if (o(r) !== o(l)) {
      const c = (n - l[e]) / (r[e] - l[e]);
      i.push([0, 1, 2].map((h) => h === e ? n : l[h] + (r[h] - l[h]) * c));
    }
    o(r) && i.push(r);
  }), i.length >= 3 ? i : [];
}
function I2(t, e, n) {
  const s = t.faces.map((r) => ({ points: r.corners.map((a) => t.vertices[a]), normal: r.normal })), o = [], i = { x: e.slice(1, -1), z: n.slice(1, -1) };
  for (let r = 0; r + 1 < e.length; r++)
    for (let a = 0; a + 1 < n.length; a++) {
      const l = [], c = /* @__PURE__ */ new Map(), h = (g) => {
        const p = g.map((b) => Math.round(b * 1e6)).join(",");
        let m = c.get(p);
        return m === void 0 && (m = l.length, l.push(g), c.set(p, m)), m;
      }, d = [], u = (g) => g === 0, f = (g, p) => g + 2 === p.length;
      for (const g of s) {
        let p = g.points;
        u(r) || (p = Hs(p, 0, e[r], 1)), p.length && !f(r, e) && (p = Hs(p, 0, e[r + 1], -1)), p.length && !u(a) && (p = Hs(p, 2, n[a], 1)), p.length && !f(a, n) && (p = Hs(p, 2, n[a + 1], -1)), p.length >= 3 && d.push({ corners: p.map(h), normal: g.normal });
      }
      d.length > 0 && o.push({ cell: [r, a], mesh: { vertices: l, faces: d, creases: t.creases, joined: t.joined, walls: i } });
    }
  return o;
}
const O2 = /* @__PURE__ */ new WeakMap(), _2 = /* @__PURE__ */ new WeakMap(), H2 = 48, xd = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function Sd(t, e, n, s) {
  let o = t.get(e);
  o || t.set(e, o = /* @__PURE__ */ new Map());
  let i = o.get(n);
  return i === void 0 && (o.size >= H2 && o.clear(), o.set(n, i = s())), i;
}
function ha(t, e) {
  const n = xd(e);
  return Sd(O2, t, n, () => {
    const s = P2(t, e), o = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      o[a] = Math.min(o[a], r[a]), i[a] = Math.max(i[a], r[a]);
    return { key: n, inSpace: s, low: o, high: i };
  });
}
function C2(t, e) {
  const n = t.map((h) => ({ ...h, ...ha(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const d of [0, 1, 2])
    s[d] = Math.min(s[d], h.low[d]), o[d] = Math.max(o[d], h.high[d]);
  const i = Hc(s[0], o[0], e), r = Hc(s[2], o[2], e), a = `${i.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const u = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: $2(i, r, u) }];
    }
    return Sd(_2, h.inSpace, a, () => I2(h.inSpace, i, r)).map((u) => ({ part: h.part, mesh: u.mesh, cut: !0, cell: u.cell }));
  }), c = (s[1] + o[1]) / 2;
  return { pieces: l, middle: ([h, d]) => [(i[h] + i[h + 1]) / 2, c, (r[d] + r[d + 1]) / 2] };
}
const Cc = 4e-3, Mi = 0.05, Rc = /* @__PURE__ */ new WeakMap();
function R2(t) {
  let e = Rc.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((o) => n.normal[0] * (o[0] - s[0]) + n.normal[1] * (o[1] - s[1]) + n.normal[2] * (o[2] - s[2]) <= 1e-6);
  }), Rc.set(t, e)), e;
}
const Lc = /* @__PURE__ */ new WeakMap();
function Td(t) {
  return t.filter(({ mesh: e }) => R2(e)).map(({ part: e, key: n, inSpace: s, low: o, high: i }) => {
    let r = Lc.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), Lc.set(s, r)), { part: e, key: n, planes: r, low: o, high: i };
  });
}
function L2(t, e, n, s) {
  const o = e.reduce((i, r) => [i[0] + r[0] / e.length, i[1] + r[1] / e.length, i[2] + r[2] / e.length], [0, 0, 0]);
  for (const i of s) {
    if (i.part === t || [0, 1, 2].some((a) => o[a] < i.low[a] - Mi || o[a] > i.high[a] + Mi)) continue;
    if (i.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((d) => a.normal[0] * d[0] + a.normal[1] * d[1] + a.normal[2] * d[2] - a.offset);
      if (c.every((d) => Math.abs(d) <= Cc)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? Mi : Cc;
      return c.every((d) => d <= h);
    })) return !0;
  }
  return !1;
}
const Wc = /* @__PURE__ */ new WeakMap();
function Ed(t, e, n, s, o) {
  const i = `${s}|${o.map((l) => l.key).join(";")}`;
  let r = Wc.get(e);
  r || Wc.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(i);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const d = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], u = Math.hypot(...d) || 1;
      return [d[0] / u, d[1] / u, d[2] / u];
    }, c = e.vertices.map((h) => qt(n, h));
    a = e.faces.map((h) => L2(t, h.corners.map((d) => c[d]), l(h.normal), o)), r.set(i, a);
  }
  return a;
}
const gs = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, dr = Math.PI / 180;
function W2(t, e, n) {
  return {
    toView: (s) => Lr(Ie(s, t * 90 * dr), -e * dr),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const Fc = /* @__PURE__ */ new WeakMap(), mo = (t) => Ks(t), Ks = (t) => {
  let e = Fc.get(t);
  return e || Fc.set(t, e = pb(t)), e;
};
function St(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? gs[n]?.default ?? 0;
}
function ls(t, e) {
  const n = Math.max(0.05, St(t, e, "squash")), s = 1 / Math.sqrt(n), i = [1, 0, 0, 0, 0, 1, St(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    Re([0, St(t, e, "lift"), 0]),
    ne(Gt([1, 0, 0], -St(t, e, "pitch"))),
    ne(Gt([0, 0, 1], St(t, e, "roll"))),
    i,
    qe([s, n, s]),
    qe(Array(3).fill(Math.max(0, St(t, e, "size"))))
  ].reduce((r, a) => At(r, a));
}
function da(t, e) {
  const n = ls(t, e), s = /* @__PURE__ */ new Map(), o = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: St(t, e, r), bind: l }))), i = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = At(l ? i(l) : n, Re(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, d, u] = r.rotate;
      h && (c = At(c, ne(Gt([1, 0, 0], h)))), d && (c = At(c, ne(Gt([0, 1, 0], d)))), u && (c = At(c, ne(Gt([0, 0, 1], u))));
    }
    for (const { value: h, bind: d } of o)
      if (!(!d.parts.includes(r.id) || h === 0)) {
        if (d.translate && (c = At(c, Re([d.translate[0] * h, d.translate[1] * h, d.translate[2] * h]))), d.rotate) {
          const u = d.rotate.pivot ?? [0, 0, 0], f = d.rotate.axis === "x" ? [1, 0, 0] : d.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, Re(u), ne(Gt(f, d.rotate.degrees * h)), Re([-u[0], -u[1], -u[2]])].reduce((g, p) => At(g, p));
        }
        d.scale && (c = At(c, qe([1 + (d.scale[0] - 1) * h, 1 + (d.scale[1] - 1) * h, 1 + (d.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) i(r);
  return s;
}
const xi = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), F2 = Math.cos(35 * dr);
function Ad(t, e, n, s, o = {}) {
  const i = t.derive ? { ...e, ...t.derive(e) } : e, r = da(t, i), a = n.toView([0, 0, 0]), l = (_) => (W) => [_[0] * W[0] + _[4] * W[1] + _[8] * W[2], _[1] * W[0] + _[5] * W[1] + _[9] * W[2], _[2] * W[0] + _[6] * W[1] + _[10] * W[2]], c = ls(t, i), h = o.slice === void 0 ? null : xr(c), d = h ? t.parts.map((_) => ({ part: _, mesh: Ks(_.shape), local: At(h, r.get(_.id)), whole: _.shape.type === "tube" })) : void 0, u = d ? C2(d, o.slice) : void 0, f = d ? Td(d.map((_) => ({ part: _.part.id, mesh: _.mesh, ...ha(_.mesh, _.local) }))) : void 0, g = (_, W, B, j) => {
    const V = (X) => n.toView(qt(B, X)), K = W.vertices.map(V), T = K.map((X) => n.toScreen(X)), C = o.perspective ? o.near : void 0, L = (X) => X.map((et) => n.toScreen(et)), $ = (X) => C === void 0 ? X : _c(X, C), R = (X) => C === void 0 ? [X] : A2(X, C), N = l(B), q = W.faces.map((X) => {
      const et = n.toView(N(X.normal)), ct = [et[0] - a[0], et[1] - a[1], et[2] - a[2]], ht = Math.hypot(...ct) || 1;
      return [ct[0] / ht, ct[1] / ht, ct[2] / ht];
    }), D = f && j ? Ed(_.id, W, j, xd(j), f) : void 0, z = (X) => D?.[X] ?? !1, G = q.map((X, et) => {
      if (z(et)) return !1;
      if (!o.perspective) return X[2] > 1e-6;
      const ht = W.faces[et].corners.reduce((yt, gt) => [yt[0] + K[gt][0], yt[1] + K[gt][1], yt[2] + K[gt][2]], [0, 0, 0]);
      return -(X[0] * ht[0] + X[1] * ht[1] + X[2] * ht[2]) > 1e-9;
    }), F = (X) => W.faces[X].corners.reduce((et, ct) => et + K[ct][2], 0) / W.faces[X].corners.length, U = W.faces.map((X, et) => ({ face: X, i: et })).filter(({ i: X }) => G[X]).map(({ face: X, i: et }) => ({
      i: et,
      solved: {
        points: C === void 0 ? X.corners.map((ct) => T[ct]) : L($(X.corners.map((ct) => K[ct]))),
        depth: F(et),
        tone: 0.72 + 0.33 * Math.max(0, q[et][0] * xi[0] + q[et][1] * xi[1] + q[et][2] * xi[2])
      }
    })).filter((X) => X.solved.points.length >= 3).sort((X, et) => X.solved.depth - et.solved.depth);
    if (o.light) {
      const X = l(B);
      for (const { i: et, solved: ct } of U) {
        const ht = W.faces[et].corners, yt = ht.reduce((Ro, Dd) => {
          const Lo = qt(B, W.vertices[Dd]);
          return [Ro[0] + Lo[0] / ht.length, Ro[1] + Lo[1] / ht.length, Ro[2] + Lo[2] / ht.length];
        }, [0, 0, 0]), gt = X(W.faces[et].normal), zt = Math.hypot(...gt) || 1, Pn = o.light(yt, [gt[0] / zt, gt[1] / zt, gt[2] / zt]);
        ct.light = Pn.light, ct.fog = Pn.fog;
      }
    }
    const Y = U.map((X) => X.solved), nt = N2(W), ot = [], it = [];
    for (const [X, et] of nt) {
      const ct = et.filter((yt) => G[yt]).length;
      if (ct === 0) continue;
      const ht = et.length === 2 && ct === 2 && W.creases !== !1 && q[et[0]][0] * q[et[1]][0] + q[et[0]][1] * q[et[1]][1] + q[et[0]][2] * q[et[1]][2] < F2;
      et.length === 1 && (W.joined || q2(W, X)) || (et.length === 1 || ct === 1 || ht) && (ot.push(X.split("-").map(Number)), it.push(et.filter((yt) => G[yt]).reduce((yt, gt) => F(gt) > F(yt) ? gt : yt)));
    }
    const rt = (X) => W.faces.findIndex((et) => et.corners.length > 4 && Math.sign(Y2(W.vertices[X], et.normal)) > 0), H = (W.marks ?? []).filter(([X]) => rt(X) < 0 || G[rt(X)]), J = ([X, et]) => C === void 0 ? [[T[X], T[et]]] : R([K[X], K[et]]).map(L), tt = H.flatMap(J), st = (X) => C === void 0 ? [X.map((et) => T[et])] : R(X.map((et) => K[et])).map(L);
    if (o.slice !== void 0) {
      const X = /* @__PURE__ */ new Map();
      ot.forEach((et, ct) => X.set(it[ct], [...X.get(it[ct]) ?? [], et]));
      for (const { i: et, solved: ct } of U) {
        ct.edges = Dc(X.get(et) ?? []).flatMap(st);
        const ht = W.faces[et].corners;
        ct.center = ht.reduce((gt, zt) => [gt[0] + K[zt][0] / ht.length, gt[1] + K[zt][1] / ht.length, gt[2] + K[zt][2] / ht.length], [0, 0, 0]), ct.normal = q[et];
        const yt = U[U.length - 1].i;
        ct.marks = H.filter(([gt]) => (rt(gt) >= 0 ? rt(gt) : yt) === et).flatMap(J);
      }
    }
    const Q = _.glow ? Math.max(0, Math.min(1, St(t, i, _.glow.control))) : 0, at = _.fade ? Math.max(0, Math.min(1, St(t, i, _.fade.control))) : 0, Z = _.fade ? Math.max(0, Math.min(1, _.fade.from + (_.fade.to - _.fade.from) * at)) : 1;
    return {
      part: _,
      depth: K.reduce((X, et) => X + et[2], 0) / Math.max(1, K.length),
      faces: Y,
      edges: Dc(ot).flatMap(st),
      marks: tt,
      glow: Q,
      opacity: Z,
      ..._.shape.type === "tube" ? { spine: z2(R(_.shape.points.map(V)).map(L)) } : {},
      ...W.walls ? { cut: !0 } : {}
    };
  }, p = new Map(d?.map((_) => [_.part.id, _.local])), b = (u ? u.pieces.map((_) => ({
    part: _.part,
    mesh: _.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: _.cut ? c : r.get(_.part.id),
    local: _.cut ? Mo() : p.get(_.part.id),
    cell: _.cell
  })) : t.parts.map((_) => ({ part: _, mesh: Ks(_.shape), m: r.get(_.id), local: void 0, cell: void 0 }))).map((_) => ({ cell: _.cell, solved: g(_.part, _.mesh, _.m, _.local) })), M = b.map((_) => _.solved), w = (_) => _.filter((W) => W.faces.length > 0 && W.opacity > 0.01).sort((W, B) => W.depth - B.depth);
  let y;
  if (u) {
    const _ = new Map(t.parts.map((B) => {
      const j = r.get(B.id), V = Ks(B.shape).vertices;
      return [B.id, V.reduce((K, T) => K + n.toView(qt(j, T))[2], 0) / Math.max(1, V.length)];
    })), W = /* @__PURE__ */ new Map();
    for (const B of b) {
      const j = B.cell.join(",");
      W.has(j) || W.set(j, { cell: B.cell, parts: [] }), W.get(j).parts.push(B.solved), B.solved.depth = _.get(B.solved.part.id);
    }
    y = [...W.values()].map(({ cell: B, parts: j }) => ({ depth: n.toView(qt(c, u.middle(B)))[2], parts: w(j) })).filter((B) => B.parts.length > 0);
  }
  const S = {};
  for (const [_, W] of Object.entries(t.anchors ?? {})) {
    const B = W.part ? r.get(W.part) : ls(t, i);
    if (!B) throw new Error(`prop rig: anchor "${_}" is on "${W.part}", which is not a part`);
    const j = n.toView(qt(B, W.at));
    S[_] = { point: n.toScreen(j), depth: j[2] };
  }
  const [E, A] = t.footprint ?? [t.length * 0.45, t.length], v = Math.max(0, St(t, i, "lift")), k = Math.max(0, St(t, i, "size")) / (1 + v * 0.8), x = Array.from({ length: 24 }, (_, W) => {
    const B = Math.PI * 2 * W / 24;
    return n.toView([Math.cos(B) * E * 0.55 * k, 0, Math.sin(B) * A * 0.55 * k]);
  }), P = o.perspective ? o.near : void 0, I = {
    points: (P === void 0 ? x : _c(x, P)).map((_) => n.toScreen(_)),
    opacity: 0.16 * k
  }, O = M.filter((_) => _.part.seeThrough && _.opacity > 0.01).flatMap((_) => _.faces.map((W) => W.points));
  return { under: w(M.filter((_) => !_.part.overRider)), over: w(M.filter((_) => _.part.overRider)), ...y ? { cells: y } : {}, anchors: S, openings: O, shadow: I, pxPerUnit: s, sizePx: t.height * s };
}
const Nc = /* @__PURE__ */ new WeakMap();
function N2(t) {
  let e = Nc.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let o = 0; o < s.length; o++) {
        const i = s[o], r = s[(o + 1) % s.length], a = i < r ? `${i}-${r}` : `${r}-${i}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    Nc.set(t, e);
  }
  return e;
}
function D2(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = da(t, n), o = xr(ls(t, n)) ?? Mo(), i = (r) => Math.max(0, Math.min(1, r));
  return t.parts.map((r) => {
    const a = r.fade ? i(St(t, n, r.fade.control)) : 0;
    return {
      part: r,
      matrix: s.get(r.id),
      local: At(o, s.get(r.id)),
      glow: r.glow ? i(St(t, n, r.glow.control)) : 0,
      opacity: r.fade ? i(r.fade.from + (r.fade.to - r.fade.from) * a) : 1
    };
  });
}
function B2(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = da(t, n), o = ls(t, n), i = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : o;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    i[r] = qt(l, a.at);
  }
  return i;
}
function q2(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((i) => t.vertices[Number(i)]), o = (i, r) => r.some((a) => Math.abs(n[i] - a) < 1e-6 && Math.abs(s[i] - a) < 1e-6);
  return o(0, t.walls.x) || o(2, t.walls.z);
}
function z2(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const Y2 = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function Dc(t) {
  const e = t.map((s) => [...s]), n = [];
  for (; e.length > 0; ) {
    const s = [...e.shift()];
    let o = !0;
    for (; o; ) {
      o = !1;
      for (let i = 0; i < e.length; i++) {
        const [r, a] = e[i], l = s[s.length - 1], c = s[0];
        if (r === l) s.push(a);
        else if (a === l) s.push(r);
        else if (a === c) s.unshift(r);
        else if (r === c) s.unshift(a);
        else continue;
        e.splice(i, 1), o = !0;
        break;
      }
    }
    n.push(s);
  }
  return n;
}
function $d(t, e) {
  if (!t.loose?.size) return;
  const n = {};
  for (const [s, o] of t.loose)
    n[s] = { x: e[`piece.${o}.x`] ?? 0, y: e[`piece.${o}.y`] ?? 0, rotate: e[`piece.${o}.rotate`] ?? 0, opacity: e[`piece.${o}.opacity`] ?? 1 };
  return n;
}
function Pd(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...gs, ...t.rig.controls })) {
    const { bind: o, ...i } = s;
    e[n] = i;
  }
  return e;
}
function K2(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, o = e.rig.height * n * 1.6, i = Pd(e), r = {};
  for (const [l, c] of Object.entries(i)) r[l] = t.values?.[l] ?? c.default ?? 0;
  const a = { look: t.look, ink: t.ink, lineWidth: t.lineWidth, pencil: t.pencil, seed: t.seed, style: t.style, paper: t.paper };
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - o,
    width: s,
    height: o,
    props: r,
    prop: e,
    propScale: n,
    propDraw: a,
    about: {
      kind: e.kind,
      summary: e.summary,
      props: i,
      actions: Object.fromEntries(Object.entries(e.actions).map(([l, c]) => [l, c.summary]))
    },
    draw(l, c, h) {
      const d = c.props ?? {};
      l.translate(s / 2, o), G0(l, ms(e, d, n), { ...a, time: h, loose: $d(c, d) });
    }
  };
}
function ms(t, e, n) {
  const s = W2(St(t.rig, e, "turn"), St(t.rig, e, "tilt"), n);
  return Ad(t.rig, e, s, n);
}
function ua(t, e, n) {
  const s = { ...t.props };
  let o = 0, i = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? o = c : l === "y" ? i = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + o, y: t.y + t.height + i }, a = ms(t.prop, s, t.propScale);
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
function AM(t, e, n, s, o = {}) {
  const i = ua(e, n, s);
  return t.save(), t.translate(i.origin.x, i.origin.y), G0(t, i.solved, {
    ...e.propDraw,
    time: n.time,
    loose: $d(e, i.values),
    // The rider is drawn in scene px.
    rider: o.rider ? (r) => {
      r.save(), r.translate(-i.origin.x, -i.origin.y), o.rider(r), r.restore();
    } : void 0
  }), t.restore(), i;
}
const Kn = {
  kind: "prop",
  create: "propSurface(propTarget({ x, y, prop }), { tracks? }): its controls and anchors are those the catalog lists for its preset",
  anchors: {
    box: "the prop’s whole box",
    "anchor:NAME": "one of its rig’s anchors (door, seat, branch, ridge…), as posed at the time",
    "part:ID": "one of its parts as seen at the time (window-1, door-left, wheel-0-left…); it can come loose as a piece",
    "control:NAME": "where the parts a control moves or lights are (control:door is the doors, control:lights the lamps; a control of the whole prop, like lift, is its box)"
  },
  edits: {
    set: "control anchors; { at, value, duration? }: move a control to a value",
    switch: "control anchors; { at, on?, duration? }: a control to its full value (open, on), or back to its rest value with on: false",
    move: "a part; { at, to: an anchor name or { x, y }, duration? }: carry the part there, loose",
    fling: "a part; { at, velocity?, spin?, gravity?, duration? }: knock the part off on a spinning arc"
  }
}, j2 = 400, X2 = 0.2;
function $M(t, e = {}) {
  const { prop: n } = t, s = Pd(n), o = Object.keys(s), i = Object.keys(n.rig.anchors ?? {}), r = n.rig.parts.map((E) => E.id), a = ps(), l = Oo(a), c = e.tracks?.length ? new Ct({ id: `${n.kind}-surface`, tracks: e.tracks }) : void 0, h = Math.max(0, ...(e.tracks ?? []).flatMap((E) => E.keyframes.map((A) => A.time))), d = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  t.loose = u;
  const f = t.props, g = (E) => {
    const A = { ...t.props };
    let v = 0, k = 0;
    if (c) {
      const x = c.getStateAtTime(Math.min(E, h));
      for (const P of x.values.values())
        for (const [I, O] of P)
          typeof O == "number" && (I === "x" ? v = O : I === "y" ? k = O : I in A && (A[I] = O));
    }
    for (const x of o) a.keys(x)?.length && (A[x] = a.valueAt(x, E));
    return { values: A, origin: { x: t.x + t.width / 2 + v, y: t.y + t.height + k } };
  }, p = (E) => {
    const { kind: A, rest: v } = An(E), k = (x) => De(n.kind, E, Kn, x);
    if (A === "box") {
      if (v) throw k("box takes no arguments");
      return { kind: A };
    }
    if (A === "anchor") {
      if (!i.includes(v)) throw k(ut(`${n.kind} anchor`, v, i));
      return { kind: A, name: v };
    }
    if (A === "part") {
      if (!r.includes(v)) throw k(ut(`${n.kind} part`, v, r));
      return { kind: A, name: v };
    }
    if (A === "control") {
      if (!o.includes(v)) throw k(ut(`${n.kind} control`, v, o));
      return { kind: A, name: v };
    }
    throw k();
  }, m = (E) => {
    const A = (n.rig.controls[E]?.bind ?? []).flatMap((k) => k.parts), v = n.rig.parts.filter((k) => k.glow?.control === E).map((k) => k.id);
    return /* @__PURE__ */ new Set([...A, ...v]);
  }, b = /* @__PURE__ */ new Map(), M = (E) => {
    let A = b.get(E);
    if (!A) {
      const v = g(E);
      b.set(E, A = { ...v, solved: ms(n, v.values, t.propScale) });
    }
    return A;
  }, w = (E, A) => {
    const v = p(E), { values: k, origin: x, solved: P } = M(A);
    if (v.kind === "box") return wt(x.x - t.width / 2, x.y - t.height, t.width, t.height);
    if (v.kind === "anchor") {
      const _ = P.anchors[v.name].point, W = X2 * t.propScale;
      return wt(x.x + _.x - W / 2, x.y + _.y - W / 2, W, W);
    }
    if (v.kind === "part") return O(/* @__PURE__ */ new Set([v.name]), `part "${v.name}" is`);
    const I = m(v.name);
    if (I.size === 0) return wt(x.x - t.width / 2, x.y - t.height, t.width, t.height);
    return O(I, `the parts control "${v.name}" moves are`);
    function O(_, W) {
      const B = [...P.under, ...P.over].filter((C) => _.has(C.part.id)).flatMap((C) => C.faces.flatMap((L) => L.points));
      if (B.length === 0) {
        const C = Number.isFinite(A) ? `at ${A} ms` : "after its edits";
        throw new Error(`${n.kind}: ${W} turned away from the viewer ${C}; aim at an anchor (${i.map((L) => `anchor:${L}`).join(", ") || "none"}) or box`);
      }
      const j = B.map((C) => C.x), V = B.map((C) => C.y), K = Math.min(...j), T = Math.min(...V);
      return wt(x.x + K, x.y + T, Math.max(...j) - K, Math.max(...V) - T);
    }
  }, y = (E, A) => {
    try {
      return w(E, A);
    } catch {
      return;
    }
  }, S = {
    kind: "prop",
    prop: t,
    about: Kn,
    target: t,
    box: wt(t.x, t.y, t.width, t.height),
    anchor(E, A = 1 / 0) {
      return w(E, A);
    },
    piece(E) {
      const A = p(E);
      if (A.kind !== "part") throw new Error(`${n.kind}: a piece is a part, part:ID (${r.slice(0, 6).map((P) => `part:${P}`).join(", ")}…), not "${E}"`);
      const v = d.get(A.name);
      if (v) return v;
      const k = [A.name];
      for (let P = 0; P < k.length; P++) for (const I of n.rig.parts) I.parent === k[P] && !k.includes(I.id) && k.push(I.id);
      const x = { id: d.size + 1, part: A.name, home: w(E, 0) };
      d.set(A.name, x);
      for (const P of k) u.set(P, x.id);
      for (const P of ["x", "y", "rotate"]) f[`piece.${x.id}.${P}`] = 0;
      return f[`piece.${x.id}.opacity`] = 1, x;
    },
    edit(E, A, v) {
      if (!(E in Kn.edits)) throw _o(n.kind, E, Kn);
      const k = Array.isArray(A) ? A : [A];
      if (k.length === 0) throw new Error(`${n.kind}.edit: ${E} takes at least one anchor`);
      if (b.clear(), E === "move" || E === "fling") {
        if (k.length > 1) throw new Error(`${n.kind}.edit: ${E} takes one part anchor`);
        const x = S.piece(k[0]);
        if (E === "fling") return S.fling(x, v);
        const P = v.to;
        if (!P) throw new Error(`${n.kind}.edit: move needs \`to\`, an anchor name or { x, y }`);
        const I = typeof P == "string" ? w(P, v.at) : void 0;
        return S.move(x, { ...v, to: I ? { x: I.left + I.width / 2, y: I.top + I.height / 2 } : P });
      }
      for (const x of k) {
        const P = p(x);
        if (P.kind !== "control") throw new Error(`${n.kind}.edit: ${E} takes control anchors (control:${o.join(", control:")}), not "${x}"`);
        const I = s[P.name];
        let O;
        if (E === "set") {
          if (typeof v.value != "number" || !Number.isFinite(v.value)) throw new Error(`${n.kind}.edit: set needs \`value\`, a number (${P.name}: ${I.description})`);
          O = v.value;
        } else
          O = v.on === !1 ? I.default ?? I.min ?? 0 : I.max ?? 1;
        a.tween(P.name, g(v.at).values[P.name], O, v, j2);
      }
      return S;
    },
    follow(E, A) {
      return b.clear(), l.follow(E, A), S;
    },
    fling(E, A) {
      return b.clear(), l.fling(E, A), S;
    },
    move(E, A) {
      return b.clear(), l.move(E, A), S;
    },
    ride(E, A, v) {
      const k = [
        ...o.flatMap((P) => as(a.keys(P))),
        ...(e.tracks ?? []).flatMap((P) => as(P.keyframes.filter((I) => typeof I.value == "number")))
      ];
      if (k.length === 0) return E;
      const x = [...i.map((P) => `anchor:${P}`), ...r.map((P) => `part:${P}`)].flatMap((P) => {
        const I = y(P, 0);
        return I ? [{ top: I.top, offset: (O) => (y(P, O)?.top ?? I.top) - I.top, windows: k }] : [];
      });
      return ia(E, A, { ground: v.ground, every: v.every ?? Ne, floors: x });
    },
    tracks: a.tracks
  };
  return S;
}
const U2 = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function Oe(t) {
  const e = { ...U2, ...t.colors }, n = [], { forwardMost: s, backMost: o, top: i } = Id(t);
  t.body && n.push({ id: "body", shape: { type: "extrude", profile: t.body, width: t.width }, fill: e.body });
  for (const [h, d] of (t.frame ?? []).entries())
    n.push({ id: `frame-${h}`, shape: { type: "tube", points: d.points, radius: d.radius ?? 0.035, segments: 6 }, fill: d.color ?? e.body, outline: 0.7 });
  for (const [h, d] of (t.windows ?? []).entries())
    for (const u of [1, -1])
      n.push({
        id: `window-${h}-${u > 0 ? "left" : "right"}`,
        shape: { type: "panel", points: [[d.from, d.low], [d.to, d.low], [d.to, d.high], [d.from, d.high]], facing: u > 0 ? "left" : "right" },
        at: [u * (t.width / 2 + 0.01), 0, 0],
        fill: e.glass,
        outline: 0.7,
        seeThrough: !0,
        glow: t.lights ? { control: "lights", color: "#ffe9a3" } : void 0
      });
  for (const h of t.extras ?? []) n.push(h);
  if (t.cabin) {
    const h = t.cabin.width ?? t.width * 0.85;
    n.push({ id: "cabin", shape: { type: "extrude", profile: t.cabin.profile, width: h }, fill: e.glass, outline: 0.9, seeThrough: !0, layer: 1 });
    const d = Math.min(...t.cabin.profile.map(([, f]) => f)), u = Math.max(...t.cabin.profile.map(([, f]) => f));
    for (const [f, g] of (t.cabin.pillars ?? []).entries())
      n.push({ id: `pillar-${f}`, shape: { type: "box", size: [h + 0.02, u - d, 0.1] }, at: [0, (d + u) / 2, g], fill: e.body, outline: 0.8, layer: 1 });
  }
  const r = t.wheels[0]?.radius ?? 0.4, a = [];
  t.wheels.forEach((h, d) => {
    const u = h.side === 0 ? [0] : [1, -1], f = h.thickness ?? (h.style === "spoked" ? 0.05 : 0.26);
    for (const g of u) {
      const p = `wheel-${d}-${g > 0 ? "left" : g < 0 ? "right" : "middle"}`;
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
    const { from: h, to: d, low: u, high: f } = t.door, g = [[h, u], [d, u], [d, f], [h, f]];
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
      const b = h + (d - h) * 0.15, M = h + (d - h) * 0.55;
      n.push({
        id: `seat-back-${m}`,
        shape: { type: "panel", points: [[b, u + 0.05], [M, u + 0.05], [M - 0.08, f - 0.06], [b + 0.06, f - 0.04]], facing: p > 0 ? "left" : "right" },
        at: [p * (t.width / 2 + 6e-3), 0, 0],
        fill: e.seat,
        outline: 0.4
      }), n.push({
        id: `door-${m}`,
        shape: { type: "panel", points: g.map(([w, y]) => [w - d, y]), facing: p > 0 ? "left" : "right" },
        // The panel's origin is at its hinge (its front edge), just outside the body.
        at: [p * (t.width / 2 + 0.01), 0, d],
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
    const { across: h, low: d, high: u, front: f, back: g } = t.lights, p = (t.lights.size ?? 0.32) / 2, m = [[-p, d], [p, d], [p, u], [-p, u]];
    for (const b of [1, -1])
      n.push({ id: `headlight-${b}`, shape: { type: "panel", points: m, facing: "front" }, at: [b * h, 0, f], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${b}`, shape: { type: "panel", points: m, facing: "back" }, at: [b * h, 0, g], fill: sa(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
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
    length: s - o,
    height: i,
    footprint: [t.width, s - o],
    anchors: {
      ...t.seat ? { seat: { at: t.seat } } : {},
      front: { at: [0, i * 0.45, s] },
      back: { at: [0, i * 0.45, o] },
      roof: { at: [0, i, 0] },
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
    actions: V2(t),
    acting: G2,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function Id(t) {
  const e = [
    ...(t.body ?? []).map(([s]) => s),
    ...(t.frame ?? []).flatMap((s) => s.points.map((o) => o[2])),
    ...t.wheels.flatMap((s) => [s.forward + s.radius, s.forward - s.radius])
  ], n = [
    ...(t.body ?? []).map(([, s]) => s),
    ...(t.cabin?.profile ?? []).map(([, s]) => s),
    ...(t.frame ?? []).flatMap((s) => s.points.map((o) => o[1])),
    ...t.wheels.map((s) => s.radius * 2)
  ];
  return { forwardMost: Math.max(...e), backMost: Math.min(...e), top: Math.max(...n) };
}
const G2 = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Cs(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
const Bc = 0.4;
function V2(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = Id(t), o = (n - s) / 2, i = (a, l, c) => {
    const h = a.exaggeration;
    let d = l;
    return a.facing() !== c && (d = a.turnTo(d, c > 0 ? "right" : "left")), a.key(d + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), Cs(a, d, d + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: d + 150, x: a.x - c * o * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), d + 260;
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
        const d = i(a, c, h), u = a.exaggeration, f = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, f / (l.speed ?? Bc));
        return a.effect({ kind: "dust", time: d, x: a.x - h * o * a.scale, y: a.floor, length: 600, direction: -h }), a.key(d + 140, { pitch: -1.5 * u, squash: 1 + 0.05 * u, lean: 0.12 * u }, { act: !1, easing: "ease-out" }), a.key(d + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * u, squash: 1.02 }, { act: !1 }), Cs(a, d, d + g, l.to, "ease-in-out", e), r(a, d + g, !1), { end: d + g + 380, contact: d, release: d + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const d = i(a, c, h), u = a.exaggeration, f = a.x, g = Math.abs(l.to - f), p = l.for ?? Math.max(600, g / (l.speed ?? Bc * 1.2)), m = d + p * 0.55, b = f + (l.to - f) * 0.65;
        return a.key(d + 140, { pitch: -1.5 * u, squash: 1 + 0.06 * u, lean: 0.14 * u }, { act: !1, easing: "ease-out" }), Cs(a, d, m, b, "ease-in", e), a.key(m + 80, { pitch: -7 * u, lean: -0.12 * u, squash: 0.94 }, { act: !1, easing: "ease-out" }), Cs(a, m, d + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: b, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: d + p, x: l.to + h * o * a.scale, y: a.floor, length: 600, direction: h }), r(a, d + p, !0), { end: d + p + 380, contact: m, release: d + p };
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
        const d = a.facing();
        return a.effect({ kind: "honk", time: c + 60, x: a.x + (d || 1) * o * a.scale, y: a.floor - 0.7 * a.scale, length: 700, direction: d || 1 }), { end: c + 520, contact: c + 60 };
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
function J2(t = {}) {
  return Oe({
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
function Z2(t = {}) {
  return Oe({
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
function Q2(t = {}) {
  return Oe({
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
function tk(t = {}) {
  return Oe({
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
function ek(t = {}) {
  const e = t.colors?.body ?? "#a8743f";
  return Oe({
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
function nk(t = {}) {
  return Oe({
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
function sk(t = {}) {
  const e = t.colors?.body ?? "#e0473b", n = [0, 0.32, -0.05], s = [0, 0.86, -0.22], o = [0, 0.9, 0.42], i = [0, 0.34, 0.56], r = [0, 0.34, -0.56];
  return Oe({
    kind: "bike",
    summary: "A bicycle: rides (drive) with its wire wheels turning, brakes, bumps, rings its bell (honk).",
    width: 0.5,
    frame: [
      { points: [r, n] },
      { points: [n, s] },
      { points: [s, r] },
      { points: [s, o] },
      { points: [n, o] },
      { points: [o, i] },
      { points: [[0.24, 0.98, 0.44], [-0.24, 0.98, 0.44]], radius: 0.025, color: "#3b3b44" },
      { points: [o, [0, 0.98, 0.44]], radius: 0.025, color: "#3b3b44" }
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
function ok(t = {}) {
  return Oe({
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
function ik(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, o = t.canopy?.shape === "tall", i = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = Ve(t.canopy?.seed ?? 7), a = [
    { id: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.06, e * 0.5, 0], [-0.02, e, 0]], radius: n, segments: 8 }, fill: i.trunk },
    { id: "branch", parent: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.45, 0.4, 0.1]], radius: n * 0.45, segments: 6 }, at: [0.04, e * 0.62, 0], fill: i.trunk },
    { id: "canopy", parent: "trunk", shape: { type: "ellipsoid", radii: [s, s * (o ? 1.35 : 0.88), s], segments: 14 }, at: [-0.02, e + s * 0.55, 0], fill: i.leaves }
  ], l = t.canopy?.lobes ?? 7;
  for (let h = 0; h < l; h++) {
    const d = Math.PI * 2 * h / l + r.next() * 0.6, u = (r.next() - 0.25) * s * (o ? 1.1 : 0.7), f = s * (0.48 + r.next() * 0.22), g = [Math.cos(d) * s * 0.78, u, Math.sin(d) * s * 0.6];
    a.push({ id: `lobe-${h}`, parent: "canopy", shape: { type: "ellipsoid", radii: [f, f * 0.86, f], segments: 12 }, at: g, fill: i.leaves });
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
    actions: ak(),
    acting: rk,
    colors: { body: i.leaves }
  };
}
const rk = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function ak() {
  const t = (e, n, s, o) => {
    const i = e.anchor("canopy");
    e.effect({ kind: "leaves", time: n, x: i.x, y: i.y, length: s, direction: o, toY: e.floor });
  };
  return {
    sway: {
      summary: "Sways in gusts of `wind` (0..1, default 0.5) for `for` ms (default 3000); the canopy trails the trunk, and a strong wind sheds leaves.",
      uses: ["wind", "for"],
      run(e, n, s) {
        const o = n.wind ?? 0.5, i = n.for ?? 3e3, r = e.exaggeration, a = 260;
        let l = 0;
        for (let c = a; c < i; c += a) {
          const h = 0.55 + 0.45 * Math.sin(c / i * Math.PI * 2.3), d = Math.sin(c / 170) * 0.35, u = -o * 9 * r * (h + d * o);
          e.key(s + c, { sway: u, canopySway: l * 1.3 }, { act: !1, easing: "ease-in-out" }), l = u;
        }
        if (e.key(s + i, { sway: 0, canopySway: 0 }), o > 0.45) for (let c = 0; c < i; c += 700) t(e, s + c, 2200, 1);
        return { end: s + i };
      }
    },
    shake: {
      summary: "Shakes (something hit it): a quick wobble that dies away, shedding leaves.",
      uses: ["for"],
      run(e, n, s) {
        const o = n.for ?? 900, i = e.exaggeration, r = 6;
        for (let a = 1; a <= r; a++) {
          const l = 1 - a / (r + 1), c = a % 2 === 0 ? 1 : -1;
          e.key(s + o * a / (r + 1), { sway: c * 5 * i * l, canopySway: -c * 6 * i * l }, { act: !1, easing: "ease-in-out" });
        }
        return e.key(s + o, { sway: 0, canopySway: 0 }), t(e, s + 60, 1800, 1), t(e, s + 260, 1800, -1), { end: s + o, contact: s };
      }
    },
    shedLeaves: {
      summary: "Leaves fall from the canopy for `for` ms (default 2000).",
      uses: ["for"],
      run(e, n, s) {
        const o = n.for ?? 2e3;
        for (let i = 0; i < o; i += 500) t(e, s + i, 2e3, i % 1e3 === 0 ? 1 : -1);
        return { end: s + o };
      }
    }
  };
}
function lk(t = {}) {
  const e = t.width ?? 4, n = t.depth ?? 3.2, s = t.wallHeight ?? 2.5, o = t.roofHeight ?? 1.5, i = t.overhang ?? 0.25, r = { walls: "#f1d9a8", roof: "#b8433a", door: "#7a4b2a", doorway: "#3a2a22", glass: "#bfe3f2", lit: "#ffd66b", chimney: "#9b5a45", ...t.colors }, a = n / 2 + 0.01, l = t.door?.width ?? 0.9, c = t.door?.height ?? 1.9, h = t.door?.at ?? 0, d = t.windows ?? [
    { at: -1.25, low: 1, width: 0.8, height: 0.8 },
    { at: 1.25, low: 1, width: 0.8, height: 0.8 }
  ], u = [
    { id: "walls", shape: { type: "box", size: [e, s, n] }, at: [0, s / 2, 0], fill: r.walls },
    {
      id: "roof",
      shape: { type: "extrude", profile: [[-n / 2 - i, s], [n / 2 + i, s], [0, s + o]], width: e + i * 2 },
      fill: r.roof,
      // It sits down on the walls: in a 3D scene it is drawn over their tops, and the chimney sorts with it.
      layer: 1
    },
    // The doorway behind the door shows when it opens.
    { id: "doorway", shape: { type: "panel", points: [[0, 0], [l, 0], [l, c], [0, c]], facing: "front" }, at: [h - l / 2, 0, a - 5e-3], fill: r.doorway, outline: 0.6, seeThrough: !0 },
    // The door, hinged on its left edge (the panel's origin); drawn over a rider, so a figure in the doorway shows only when it opens.
    { id: "door", shape: { type: "panel", points: [[0, 0], [l, 0], [l, c], [0, c]], facing: "front" }, at: [h - l / 2, 0, a + 5e-3], fill: r.door, outline: 0.8, overRider: !0 }
  ];
  d.forEach((p, m) => {
    u.push({
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
    u.push({
      id: `side-window-${p > 0 ? "left" : "right"}`,
      shape: { type: "panel", points: [[-0.4, 1], [0.4, 1], [0.4, 1.8], [-0.4, 1.8]], facing: p > 0 ? "left" : "right" },
      at: [p * (e / 2 + 0.01), 0, 0],
      fill: r.glass,
      outline: 0.8,
      glow: { control: "lights", color: r.lit }
    });
  const f = t.chimney === !1 ? void 0 : { at: t.chimney?.at ?? e * 0.28, back: t.chimney?.back ?? -n * 0.18 };
  if (f) {
    const p = s + o * (1 - Math.abs(f.back) / (n / 2 + i)), m = s + o + 0.45;
    u.push({ id: "chimney", shape: { type: "box", size: [0.42, m - p + 0.3, 0.42] }, at: [f.at, (m + p - 0.3) / 2, f.back], fill: r.chimney, layer: 1 });
  }
  const g = {
    parts: u,
    controls: {
      door: { description: "The front door open: 0 shut, 1 open", unit: "0..1", min: 0, max: 1, bind: [{ parts: ["door"], rotate: { axis: "y", degrees: -80 } }] },
      lights: { description: "The windows lit: 0 dark, 1 lit", unit: "0..1", min: 0, max: 1 }
    },
    length: n + i * 2,
    height: s + o + 0.6,
    footprint: [e + 0.6, n + 0.6],
    anchors: {
      door: { at: [h, c / 2, a] },
      doorstep: { at: [h, 0, a + 0.4] },
      ridge: { at: [0, s + o, 0] },
      ...f ? { chimney: { at: [f.at, s + o + 0.5, f.back] } } : {}
    }
  };
  return {
    kind: t.kind ?? "house",
    family: "building",
    summary: t.summary ?? "A house: opens its door, lights its windows, puffs chimney smoke, shakes, pops up.",
    rig: g,
    actions: hk(!!f),
    acting: ck,
    colors: { body: r.walls }
  };
}
const ck = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function hk(t) {
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
        const o = n.for ?? 700, i = e.exaggeration;
        e.key(s + 80, { squash: 1 - 0.06 * i }, { act: !1, easing: "ease-out" });
        for (let r = 1; r <= 5; r++) {
          const a = 1 - r / 6;
          e.key(s + 80 + o * r / 6, { roll: (r % 2 === 0 ? 1 : -1) * 2.2 * i * a, squash: 1 + 0.02 * a }, { act: !1, easing: "ease-in-out" });
        }
        return e.key(s + o + 80, { roll: 0, squash: 1 }), e.effect({ kind: "dust", time: s + 80, x: e.x, y: e.floor, length: 600 }), { end: s + o + 80, contact: s + 80 };
      }
    },
    ...t ? {
      smoke: {
        summary: "Starts smoke puffing from the chimney for `for` ms (default 3000), drifting with the wind; the next beat starts at once (the smoke carries on).",
        uses: ["for", "wind"],
        run(e, n, s) {
          const o = n.for ?? 3e3, i = e.anchor("chimney");
          return e.effect({ kind: "smoke", time: s, x: i.x, y: i.y, length: o + 1500, direction: (n.wind ?? 0.4) >= 0 ? 1 : -1 }), { end: s + 50, release: s + o };
        }
      }
    } : {}
  };
}
function dk(t = {}) {
  const e = t.width ?? 0.46, n = t.depth ?? 0.46, s = t.seatHeight ?? 0.46, o = t.backHeight ?? 0.95, i = { wood: "#8a5a3b", seat: "#c48a4a", ...t.colors }, r = 0.05, a = 0.025, l = [
    { id: "seat", shape: { type: "box", size: [e, r, n] }, at: [0, s - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, o - s, r] }, at: [0, (o + s) / 2, -n / 2 + r / 2], fill: i.wood }
  ];
  for (const [h, d, u] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    l.push({ id: `leg-${u}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - r, 0]], radius: a, segments: 6 }, at: [h * (e / 2 - a * 1.5), 0, d * (n / 2 - a * 1.5)], fill: i.wood });
  const c = {
    parts: l,
    controls: {
      tip: { description: "Tipped back on its rear legs (+), degrees", unit: "degrees", min: 0, max: 60, bind: [{ parts: l.map((h) => h.id), rotate: { axis: "x", degrees: 1, pivot: [0, 0, -n / 2 + a * 1.5] } }] }
    },
    length: n,
    height: o,
    footprint: [e, n],
    anchors: {
      seat: { at: [0, s, 0] },
      back: { at: [0, o, -n / 2] },
      front: { at: [0, 0, n / 2 + 0.3] }
    }
  };
  return {
    kind: t.kind ?? "chair",
    family: "furniture",
    summary: t.summary ?? "A chair: a seat to sit on (`seat`), tips back on its rear legs and settles, or falls over.",
    rig: c,
    actions: fk(),
    acting: uk,
    colors: { body: i.seat }
  };
}
const uk = {
  depth: { tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function fk() {
  return {
    tip: {
      summary: "Tips back on its rear legs for `for` ms (default 1200), rocking a little, then settles down.",
      uses: ["for"],
      run(t, e, n) {
        const s = 18 * t.exaggeration, o = e.for ?? 1200;
        return t.key(n + 350, { tip: s }, { easing: "ease-out" }), t.key(n + 350 + o * 0.4, { tip: s * 0.85 }, { act: !1, easing: "ease-in-out" }), t.key(n + 350 + o * 0.7, { tip: s }, { act: !1, easing: "ease-in-out" }), t.key(n + 350 + o, { tip: 0 }, { easing: "ease-in" }), { end: n + 350 + o, contact: n + 350 };
      }
    },
    fall: {
      summary: "Falls over backwards onto its back and bounces, with dust.",
      uses: ["for"],
      run(t, e, n) {
        const s = e.for ?? 700;
        return t.key(n + s * 0.6, { tip: 90 }, { act: !1, easing: "ease-in" }), t.key(n + s * 0.75, { tip: 82 }, { act: !1, easing: "ease-out" }), t.key(n + s, { tip: 90 }, { act: !1, easing: "ease-in" }), t.effect({ kind: "dust", time: n + s * 0.6, x: t.x, y: t.floor, length: 600 }), { end: n + s, contact: n + s * 0.6 };
      }
    }
  };
}
function pk(t = {}) {
  const e = t.width ?? 1.4, n = t.depth ?? 0.7, s = t.height ?? 0.75, o = { wood: "#8a5a3b", top: "#a9754a", knob: "#2b2b2b", ...t.colors }, i = 0.04, r = 0.03, a = 0.14, l = e * 0.4, c = [
    { id: "top", shape: { type: "box", size: [e, i, n] }, at: [0, s - i / 2, 0], fill: o.top },
    // The drawer: a box under the top on the left, sliding forward on its control.
    { id: "drawer", shape: { type: "box", size: [l, a, n * 0.8] }, at: [-e / 2 + l / 2 + 0.05, s - i - a / 2, 0], fill: o.wood },
    { id: "knob", parent: "drawer", shape: { type: "ellipsoid", radii: [0.02, 0.02, 0.015], segments: 8 }, at: [0, 0, n * 0.4 + 0.012], fill: o.knob, outline: 0.6 }
  ];
  for (const [d, u, f] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    c.push({ id: `leg-${f}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - i, 0]], radius: r, segments: 6 }, at: [d * (e / 2 - r * 2), 0, u * (n / 2 - r * 2)], fill: o.wood });
  const h = {
    parts: c,
    controls: {
      drawer: { description: "The drawer out: 0 shut, 1 open", unit: "0..1", min: 0, max: 1, bind: [{ parts: ["drawer"], translate: [0, 0, n * 0.5] }] }
    },
    length: n,
    height: s,
    footprint: [e, n],
    anchors: {
      top: { at: [0, s, 0] },
      edge: { at: [0, s, n / 2] },
      drawer: { part: "drawer", at: [0, 0, n * 0.4] },
      chair: { at: [0, 0, n / 2 + 0.35] }
    }
  };
  return {
    kind: t.kind ?? "desk",
    family: "furniture",
    summary: t.summary ?? "A desk: a top to work at (`top`, `edge`), a drawer that opens (`drawer`), a place for a chair in front (`chair`).",
    rig: h,
    actions: {
      drawer: {
        summary: "Opens the drawer (`open: true`) or shuts it (`open: false`).",
        needs: ["open"],
        run(d, u, f) {
          return d.key(f + 400, { drawer: u.open ? 1 : 0 }, { easing: u.open ? "ease-out" : "ease-in" }), { end: f + 500, contact: f + 400 };
        }
      }
    },
    acting: gk,
    colors: { body: o.top }
  };
}
const gk = {
  depth: { drawer: 1, roll: 1, squash: 1, size: 0 },
  limits: { drawer: 0.08, roll: 1, squash: 0.04 },
  eyes: [],
  headTurns: {},
  drift: []
};
function mk(t = {}) {
  const e = t.length ?? 2, n = t.width ?? 1, s = t.height ?? 0.55, o = t.headboard ?? 0.95, i = { wood: "#8a5a3b", mattress: "#f1ece2", blanket: "#5b7fb0", pillow: "#fbf8f2", ...t.colors }, r = 0.3, a = s - r, c = {
    parts: [
      { id: "frame", shape: { type: "box", size: [n, r, e] }, at: [0, r / 2, 0], fill: i.wood },
      { id: "headboard", shape: { type: "box", size: [n + 0.06, o - r, 0.06] }, at: [0, (o + r) / 2, -e / 2 - 0.03], fill: i.wood },
      { id: "mattress", shape: { type: "box", size: [n - 0.04, a, e - 0.04] }, at: [0, r + a / 2, 0], fill: i.mattress },
      { id: "blanket", parent: "mattress", shape: { type: "box", size: [n - 0.02, 0.04, e * 0.62] }, at: [0, a / 2 + 0.02, e * 0.19], fill: i.blanket, outline: 0.7 },
      { id: "pillow", parent: "mattress", shape: { type: "ellipsoid", radii: [n * 0.32, 0.07, 0.22], segments: 12 }, at: [0, a / 2 + 0.06, -e / 2 + 0.32], fill: i.pillow, outline: 0.7 }
    ],
    controls: {
      give: { description: "The mattress pressed down: 1 as made, below squashed (someone landed on it)", unit: "factor", default: 1, min: 0.5, max: 1.2, bind: [{ parts: ["mattress"], scale: [1, 1, 1] }] }
    },
    length: e,
    height: o,
    footprint: [n, e],
    anchors: {
      mattress: { part: "mattress", at: [0, a / 2, 0] },
      pillow: { part: "mattress", at: [0, a / 2 + 0.1, -e / 2 + 0.32] },
      foot: { at: [0, s, e / 2] },
      side: { at: [n / 2 + 0.25, 0, 0] }
    }
  };
  return {
    kind: t.kind ?? "bed",
    family: "furniture",
    summary: t.summary ?? "A bed: a mattress to lie on (`mattress`, `pillow`) that gives and springs back when someone lands on it (`bounce`), a side to sit on (`side`).",
    rig: c,
    actions: {
      bounce: {
        summary: "The mattress gives (someone landed on it) and springs back over `for` ms (default 700).",
        uses: ["for"],
        run(h, d, u) {
          const f = d.for ?? 700, g = h.exaggeration;
          return h.key(u + 90, { give: 1 - 0.18 * g }, { act: !1, easing: "ease-out" }), h.key(u + f * 0.45, { give: 1 + 0.05 * g }, { act: !1, easing: "ease-in-out" }), h.key(u + f * 0.7, { give: 1 - 0.04 * g }, { act: !1, easing: "ease-in-out" }), h.key(u + f, { give: 1 }), { end: u + f, contact: u + 90 };
        }
      }
    },
    acting: yk,
    colors: { body: i.blanket }
  };
}
const yk = {
  depth: { give: 1, roll: 1, squash: 1, size: 0 },
  limits: { give: 0.03, roll: 0.5, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function bk(t = {}) {
  const e = t.width ?? 0.9, n = t.height ?? 2.05, s = t.hinge ?? "left", o = { frame: "#d9d2c3", door: "#7a4b2a", handle: "#c9a227", beyond: "#2a2f3a", ...t.colors }, i = 0.1, r = s === "left" ? 1 : -1, a = r > 0 ? [[0, 0], [-e, 0], [-e, n], [0, n]] : [[0, 0], [e, 0], [e, n], [0, n]], c = {
    parts: [
      { id: "post-left", shape: { type: "box", size: [i, n + i, i] }, at: [e / 2 + i / 2, (n + i) / 2, 0], fill: o.frame },
      { id: "post-right", shape: { type: "box", size: [i, n + i, i] }, at: [-e / 2 - i / 2, (n + i) / 2, 0], fill: o.frame },
      { id: "lintel", shape: { type: "box", size: [e + i * 2, i, i] }, at: [0, n + i / 2, 0], fill: o.frame },
      { id: "beyond", shape: { type: "panel", points: [[-e / 2, 0], [e / 2, 0], [e / 2, n], [-e / 2, n]], facing: "front" }, at: [0, 0, -0.03], fill: o.beyond, outline: 0.4, seeThrough: !0 },
      { id: "door", shape: { type: "panel", points: a, facing: "front" }, at: [r * e / 2, 0, 5e-3], fill: o.door, outline: 0.9, overRider: !0 },
      { id: "handle", parent: "door", shape: { type: "ellipsoid", radii: [0.03, 0.03, 0.03], segments: 8 }, at: [-r * (e - 0.1), n * 0.47, 0.03], fill: o.handle, outline: 0.5 }
    ],
    controls: {
      open: { description: "How far the door is open: 0 shut, 1 open wide", unit: "0..1", min: 0, max: 1, bind: [{ parts: ["door"], rotate: { axis: "y", degrees: r * -95 } }] }
    },
    length: 0.3,
    height: n + i,
    footprint: [e + i * 2, 0.3],
    anchors: {
      handle: { part: "door", at: [-r * (e - 0.1), n * 0.47, 0.03] },
      doorway: { at: [0, 0, 0] },
      front: { at: [0, 0, 0.5] },
      beyond: { at: [0, 0, -0.5] }
    }
  };
  return {
    kind: t.kind ?? "door",
    family: "furniture",
    summary: t.summary ?? "A door in its frame: opens and shuts on its hinge (`open`), slams, rattles when knocked; a figure goes through the `doorway` from `front` to `beyond`.",
    rig: c,
    actions: kk(),
    acting: wk,
    colors: { body: o.door }
  };
}
const wk = {
  depth: { open: 1, roll: 1, squash: 1, size: 0 },
  limits: { open: 0.08, roll: 0.6, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function kk() {
  return {
    open: {
      summary: "Opens the door (`open: true`, default) or shuts it (`open: false`), over `for` ms (default 600).",
      uses: ["open", "for"],
      run(t, e, n) {
        const s = e.for ?? 600;
        return t.key(n + s, { open: e.open === !1 ? 0 : 1 }, { easing: "ease-in-out" }), { end: n + s + 80, contact: n + s };
      }
    },
    slam: {
      summary: "Slams shut: a fast swing, a shudder in the frame, dust.",
      run(t, e, n) {
        const s = t.exaggeration;
        t.key(n + 180, { open: 0 }, { act: !1, easing: "ease-in" });
        for (let o = 1; o <= 4; o++) t.key(n + 180 + o * 70, { roll: (o % 2 === 0 ? 1 : -1) * 1.2 * s * (1 - o / 5) }, { act: !1 });
        return t.key(n + 180 + 350, { roll: 0 }), t.effect({ kind: "dust", time: n + 180, x: t.x, y: t.floor, length: 500 }), { end: n + 180 + 350, contact: n + 180 };
      }
    },
    knock: {
      summary: "Someone knocks three times: the door rattles over `for` ms (default 700).",
      uses: ["for"],
      run(t, e, n) {
        const o = e.for ?? 700, i = t.exaggeration;
        for (let r = 0; r < 3; r++) {
          const a = n + o * (r + 0.5) / 3;
          t.key(a, { open: 0.03 * i }, { act: !1, easing: "ease-out" }), t.key(a + 60, { open: 0 }, { act: !1, easing: "ease-in" });
        }
        return { end: n + o, contact: n + o / 6 };
      }
    }
  };
}
const Od = 1.4;
function vk(t = {}) {
  const e = t.width ?? 0.5, n = t.seatHeight ?? 0.5, s = t.wheelRadius ?? 0.3, o = 0.08, i = { frame: "#2b2f36", seat: "#3c6ea5", tyre: "#1f2328", ...t.colors }, r = 0.04, a = 0.018, l = 0.44, c = n + 0.5, h = -0.08, d = e / 2 + 0.06, u = [
    { id: "seat", shape: { type: "box", size: [e, r, l] }, at: [0, n - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, c - n - 0.02, r] }, at: [0, (c + n) / 2, -l / 2 + r / 2], fill: i.seat },
    // Footrests: a bar in front, low, with two plates.
    { id: "footrest", shape: { type: "box", size: [e * 0.8, 0.02, 0.14] }, at: [0, 0.12, l / 2 + 0.22], fill: i.frame }
  ];
  for (const [p, m] of [[-1, "left"], [1, "right"]]) {
    const b = p * d, M = (w, y, S = a) => {
      u.push({ id: w, shape: { type: "tube", points: y, radius: S, segments: 6 }, fill: i.frame, outline: 0.7 });
    };
    M(`post-${m}`, [[b, n - 0.1, -l / 2], [b, c + 0.04, -l / 2], [b, c + 0.04, -l / 2 - 0.14]]), M(`rail-${m}`, [[b, n - 0.03, -l / 2], [b, n - 0.03, l / 2]]), M(`leg-${m}`, [[b, n - 0.03, l / 2], [b * 0.85, o, l / 2 + 0.06]]), M(`strut-${m}`, [[b * 0.85, o + 0.08, l / 2 + 0.04], [b * 0.8, 0.13, l / 2 + 0.22]]), M(`armrest-${m}`, [[b, n + 0.22, -l / 2 + 0.02], [b, n + 0.22, l / 2 - 0.08]], a * 1.3), u.push({
      id: `wheel-${m}`,
      shape: { type: "cylinder", radius: s, length: 0.04, axis: "x", segments: 20, spokes: 8 },
      at: [b + p * 0.03, s, h],
      ink: i.tyre,
      outline: 1.3
    }), u.push({ id: `rim-${m}`, shape: { type: "cylinder", radius: s * 0.9, length: 0.012, axis: "x", segments: 20 }, at: [p * 0.045, 0, 0], parent: `wheel-${m}`, ink: i.frame, outline: 0.8 }), u.push({
      id: `castor-${m}`,
      shape: { type: "cylinder", radius: o, length: 0.03, axis: "x", segments: 12, spokes: 3 },
      at: [b * 0.85, o, l / 2 + 0.06],
      fill: i.tyre
    });
  }
  const f = u.map((p) => p.id).filter((p) => !p.startsWith("rim-")), g = {
    parts: u,
    controls: {
      wheelSpin: {
        description: "How far the big wheels have turned, degrees (keyed with the distance rolled, so they never skate); the castors turn faster",
        unit: "degrees",
        bind: [
          { parts: ["wheel-left", "wheel-right"], rotate: { axis: "x", degrees: 1 } },
          { parts: ["castor-left", "castor-right"], rotate: { axis: "x", degrees: s / o } }
        ]
      },
      tip: {
        description: "Tipped back on its big wheels (+), degrees: a wheelie, or a helper tipping it up a kerb",
        unit: "degrees",
        min: 0,
        max: 45,
        bind: [{ parts: f, rotate: { axis: "x", degrees: 1, pivot: [0, s, h] } }]
      }
    },
    length: l + 0.4,
    height: c + 0.04,
    footprint: [d * 2 + 0.1, l + 0.4],
    anchors: {
      seat: { at: [0, n, 0.02] },
      handles: { at: [0, 0, -l / 2 - 0.5] },
      front: { at: [0, 0, l / 2 + 0.6] },
      footrest: { at: [0, 0.13, l / 2 + 0.22] }
    }
  };
  return {
    kind: t.kind ?? "wheelchair",
    family: "furniture",
    summary: t.summary ?? "A wheelchair: rolls to `to` with its wheels turning the distance (roll), brakes, tips back on its big wheels (wheelie); its `seat` is ridden in the `wheeling` pose and a pusher stands at `handles`.",
    rig: g,
    actions: xk(s),
    acting: Mk,
    colors: { body: i.seat, ink: i.frame },
    wheelRadius: s,
    moves: { roll: { speed: Od, perMetre: { wheelSpin: 180 / (Math.PI * s) } } }
  };
}
const Mk = {
  depth: { wheelSpin: 0, tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function qc(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
function xk(t) {
  return {
    roll: {
      summary: "Rolls to `to` at `speed` px/ms (or over `for` ms): a small push-off, the wheels turning exactly the distance, and a gentle stop.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(e, n, s) {
        const o = Math.sign(n.to - e.x);
        if (o === 0) return { end: s };
        let i = s;
        e.facing() !== o && (i = e.turnTo(i, o > 0 ? "right" : "left"));
        const r = Math.abs(n.to - e.x), a = n.for ?? Math.max(300, r / (n.speed ?? Od * e.scale / 1e3));
        return e.key(i + 150, { tip: 1.5 * e.exaggeration }, { act: !1, easing: "ease-out" }), qc(e, i, i + a, n.to, "ease-in-out", t), e.key(i + a, { tip: 0 }, { easing: "ease-out" }), { end: i + a };
      }
    },
    brake: {
      summary: "Stops short at `to`: the wheels lock and it skids the last bit, tipping forward a touch.",
      needs: ["to"],
      uses: ["for"],
      run(e, n, s) {
        if (Math.sign(n.to - e.x) === 0) return { end: s };
        const i = n.for ?? 500;
        return qc(e, s, s + i, n.to, "ease-out", t, !0), e.key(s + i, { tip: 0 }, { easing: "ease-out" }), e.effect({ kind: "dust", time: s + i * 0.5, x: n.to, y: e.floor, length: 500 }), { end: s + i, contact: s + i };
      }
    },
    wheelie: {
      summary: "Tips back onto its big wheels, balances there for `for` ms (default 1200), and drops down.",
      uses: ["for"],
      run(e, n, s) {
        const o = 24 * e.exaggeration, i = n.for ?? 1200;
        return e.key(s + 300, { tip: o }, { easing: "ease-out" }), e.key(s + 300 + i * 0.5, { tip: o * 0.9 }, { act: !1, easing: "ease-in-out" }), e.key(s + 300 + i, { tip: o }, { act: !1, easing: "ease-in-out" }), e.key(s + 300 + i + 250, { tip: 0 }, { easing: "ease-in" }), e.effect({ kind: "dust", time: s + 300 + i + 250, x: e.x, y: e.floor, length: 400 }), { end: s + 300 + i + 250, contact: s + 300 + i + 250 };
      }
    }
  };
}
function Sk(t = {}) {
  const e = { body: "#3f86c8", glass: "#cfeaf5", trim: "#2c2c33", rotor: "#3b3b44", ...t.colors }, n = 2.15, o = {
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
    rig: o,
    actions: Tk(),
    acting: _d,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: xe * 1e3 } } }
  };
}
const _d = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, xe = 2.6;
function Tk() {
  const t = (n, s, o, i, r) => {
    const a = n.values.rotor ?? 0;
    n.set("rotor", s, a);
    const l = r ? i * (o - s) * 0.5 : i * (o - s);
    n.set("rotor", o, a + l, r);
  }, e = (n) => n.values.lift > 0.05;
  return {
    takeOff: {
      summary: "Spools the rotor up (the skids squash as it bites), then lifts off nose-down to `height` metres (default 3).",
      uses: ["height"],
      run(n, s, o) {
        const i = n.exaggeration, r = s.height ?? 3;
        t(n, o, o + 900, xe, "ease-in"), n.key(o + 900, { blur: 1 }, { act: !1, easing: "ease-in" }), n.key(o + 700, { squash: 1 - 0.08 * i }, { act: !1, easing: "ease-in" });
        const a = o + 1e3;
        return n.key(a + 150, { squash: 1 + 0.06 * i, lift: 0.3 }, { act: !1, easing: "ease-out" }), n.key(a + 1300, { squash: 1, lift: r, pitch: -4 * i }, { act: !1, easing: "ease-in-out" }), n.key(a + 1700, { pitch: 0 }), t(n, o + 900, a + 1700, xe), n.effect({ kind: "dust", time: a, x: n.x, y: n.floor, length: 900 }), { end: a + 1700, contact: a };
      }
    },
    fly: {
      summary: "Flies to `to` (and to `height`, if given): nose down and banked into the move, nose up and leveling as it stops.",
      needs: ["to"],
      uses: ["height", "speed", "for"],
      run(n, s, o) {
        const i = n.exaggeration, r = Math.sign(s.to - n.x);
        let a = o;
        r !== 0 && n.facing() !== r && (a = n.turnTo(a, r > 0 ? "right" : "left"));
        const l = Math.abs(s.to - n.x), c = s.for ?? Math.max(700, l / (s.speed ?? 0.3)), h = s.height ?? n.values.lift;
        return n.key(a + 300, { pitch: -9 * i, roll: 6 * i }, { act: !1, easing: "ease-out" }), n.key(a + c - 250, { pitch: -4 * i, roll: 3 * i, lift: h }, { act: !1 }), n.key(a + c, { pitch: 7 * i, roll: 0 }, { act: !1, easing: "ease-out" }), n.key(a + c + 450, { pitch: 0 }), n.move(a, a + c, s.to, { easing: "ease-in-out" }), t(n, o, a + c + 450, xe), { end: a + c + 450, contact: a, release: a + c };
      }
    },
    hover: {
      summary: "Hovers in place for `for` ms (default 2000), bobbing gently.",
      uses: ["for"],
      run(n, s, o) {
        const i = s.for ?? 2e3, r = n.values.lift, a = n.exaggeration;
        for (let l = 350, c = 0; l < i; l += 350, c++)
          n.key(o + l, { lift: r + (c % 2 === 0 ? 0.12 : -0.06) * a, roll: (c % 2 === 0 ? 1.5 : -1.5) * a }, { act: !1, easing: "ease-in-out" });
        return n.key(o + i, { lift: r, roll: 0 }, { act: !1, easing: "ease-in-out" }), (e(n) || r > 0) && t(n, o, o + i, xe), { end: o + i };
      }
    },
    land: {
      summary: "Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.",
      run(n, s, o) {
        const i = n.exaggeration, r = o + Math.max(900, n.values.lift * 450);
        return n.key(o + 400, { pitch: 3 * i }, { act: !1, easing: "ease-out" }), n.key(r, { lift: 0, pitch: 0, squash: 1 - 0.14 * i }, { act: !1, easing: "ease-in" }), n.key(r + 280, { squash: 1 }), t(n, o, r, xe), t(n, r, r + 1600, xe, "ease-out"), n.key(r + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: r, x: n.x, y: n.floor, length: 800 }), { end: r + 1600, contact: r };
      }
    }
  };
}
function Ek(t = {}) {
  const e = { body: "#e9e4d8", wings: "#d9483b", glass: "#cfeaf5", trim: "#2c2c33", ...t.colors }, n = 3.15, o = {
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
    rig: o,
    actions: $k(),
    acting: _d,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: xe * 1e3 } } }
  };
}
const Ak = 3.2;
function $k() {
  const t = (n, s, o, i) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", o, r + Ak * (o - s) * (i ? 0.5 : 1), i);
  }, e = (n, s, o) => {
    const i = Math.sign(o - n.x);
    return i !== 0 && n.facing() !== i ? n.turnTo(s, i > 0 ? "right" : "left") : s;
  };
  return {
    takeOff: {
      summary: "Spins the propeller up, runs along the ground toward `to`, lifts its nose and climbs to `height` metres (default 4).",
      needs: ["to"],
      uses: ["height", "for"],
      run(n, s, o) {
        const i = n.exaggeration, r = e(n, o, s.to);
        t(n, r, r + 700, "ease-in"), n.key(r + 700, { blur: 1 }, { act: !1, easing: "ease-in" });
        const a = s.for ?? 2600, l = n.x, c = r + 700 + a * 0.55, h = l + (s.to - l) * 0.45;
        return n.move(r + 700, c, h, { easing: "ease-in" }), n.key(c, { pitch: 8 * i, squash: 1 + 0.04 * i }, { act: !1, easing: "ease-out" }), n.key(r + 700 + a, { lift: s.height ?? 4, pitch: 10 * i, squash: 1 }, { act: !1, easing: "ease-in-out" }), n.move(c, r + 700 + a, s.to), n.key(r + 700 + a + 500, { pitch: 0 }), t(n, r + 700, r + 700 + a + 500), n.effect({ kind: "dust", time: c, x: h, y: n.floor, length: 700 }), { end: r + 700 + a + 500, contact: c };
      }
    },
    fly: {
      summary: "Flies to `to` (and `height`), banking into the move and leveling out.",
      needs: ["to"],
      uses: ["height", "speed", "for"],
      run(n, s, o) {
        const i = n.exaggeration, r = e(n, o, s.to), a = s.for ?? Math.max(800, Math.abs(s.to - n.x) / (s.speed ?? 0.45)), l = s.height ?? n.values.lift;
        return n.key(r + 350, { roll: 10 * i, pitch: l > n.values.lift ? 6 * i : -3 * i }, { act: !1, easing: "ease-out" }), n.key(r + a - 300, { roll: 4 * i, lift: l }, { act: !1 }), n.key(r + a, { roll: 0, pitch: 0 }), n.move(r, r + a, s.to, { easing: "ease-in-out" }), t(n, o, r + a), { end: r + a, contact: r, release: r + a };
      }
    },
    loop: {
      summary: "Loops the loop: pulls up and over in a full circle (`for` ms, default 2400), carrying on the way it was going.",
      uses: ["for"],
      run(n, s, o) {
        const i = s.for ?? 2400, r = 2.2 * n.exaggeration, a = n.facing() || 1, l = 16, c = n.x, h = n.values.lift, d = n.values.pitch;
        for (let u = 1; u <= l; u++) {
          const f = Math.PI * 2 * u / l, g = o + i * u / l;
          n.key(g, { lift: h + r * (1 - Math.cos(f)), pitch: d + 360 * u / l }, { act: !1 }), n.move(o + i * (u - 1) / l, g, c + a * (r * Math.sin(f) + u / l * r * 1.2) * n.scale);
        }
        return n.key(o + i + 1, { pitch: d }, { act: !1 }), t(n, o, o + i), { end: o + i + 1 };
      }
    },
    land: {
      summary: "Comes down toward `to`: descends, flares nose-up, touches down with a squash and dust, rolls to a stop and the propeller spools down.",
      needs: ["to"],
      uses: ["for"],
      run(n, s, o) {
        const i = n.exaggeration, r = e(n, o, s.to), a = n.x, l = s.for ?? 2200, c = r + l, h = a + (s.to - a) * 0.7;
        return n.key(r + l * 0.4, { pitch: -4 * i }, { act: !1, easing: "ease-out" }), n.key(c - 250, { pitch: 6 * i, lift: 0.15 }, { act: !1, easing: "ease-in-out" }), n.key(c, { lift: 0, pitch: 0, squash: 1 - 0.12 * i }, { act: !1, easing: "ease-in" }), n.key(c + 260, { squash: 1 }), n.move(r, c, h), n.move(c, c + 1200, s.to, { easing: "ease-out" }), t(n, o, c), t(n, c, c + 1600, "ease-out"), n.key(c + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: c, x: h, y: n.floor, length: 700 }), { end: c + 1600, contact: c };
      }
    }
  };
}
const ys = ["walk", "trot", "canter", "gallop"], PM = ys, Hd = ["fl", "fr", "hl", "hr"], Co = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, Ee = Math.PI / 180;
function fa(t, e) {
  return 4 * t * Math.sin(Co[e].swing * Ee);
}
function Ze(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, o = s + t.body.rise, i = (d, u) => [u * d[0], d[1], d[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, o, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((d, u, f) => t.neck.radius * (1.25 - 0.4 * u / Math.max(1, f.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...Ik(t, n, o)
  ];
  t.mane && r.push({ id: "mane", parent: "neck", shape: { type: "tube", points: t.mane.points, radius: t.mane.radius, segments: 6 }, fill: n.dark, outline: 0.7 }), t.muzzle && r.push({ id: "muzzle", parent: "head", shape: { type: "ellipsoid", radii: t.muzzle.radii, segments: 10 }, at: t.muzzle.at, fill: n.muzzle, outline: 0.8 });
  for (const d of [1, -1]) {
    const u = d > 0 ? "left" : "right", f = t.ears.rotate ? i(t.ears.rotate, 1).map((g, p) => p === 2 ? d * g : g) : void 0;
    r.push(
      { id: `ear-${u}`, parent: "head", shape: { type: "ellipsoid", radii: t.ears.radii, segments: 8 }, at: i(t.ears.at, d), rotate: f, fill: n.coat, outline: 0.7 },
      { id: `eye-${u}`, parent: "head", shape: { type: "ellipsoid", radii: [t.eyes.size * 0.8, t.eyes.size, t.eyes.size * 0.9], segments: 8 }, at: i(t.eyes.at, d), fill: "#1d1d22", outline: 0.4 }
    );
  }
  r.push(...t.extras?.(n) ?? []);
  const a = {
    walk: { description: "Phase of the stride, in full cycles (keyed in step with the distance covered)", unit: "cycles" },
    walking: { description: "How much of the gait is applied: 0 standing, 1 moving", unit: "0..1", min: 0, max: 1 },
    gait: { description: `Which gait: ${t.gaits.map((d) => `${ys.indexOf(d)} ${d}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: Qt, rotate: { axis: "x", degrees: 1 / Qt.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: Qt, rotate: { axis: "y", degrees: 1 / Qt.length } }] },
    // The ears hinge at their base: laid back on a run, on a spring behind the motion.
    ears: { description: "Ears pricked forward (+) or laid back (−), on a spring behind the motion", unit: "degrees", bind: [{ parts: ["ear-left", "ear-right"], rotate: { axis: "x", degrees: 1, pivot: [0, -t.ears.radii[1], 0] } }] }
  };
  for (const d of Hd) {
    const u = d[0] === "f", f = d[1] === "l" ? 1 : -1, g = u ? e.thickness[0] : e.thickness[1];
    r.push(
      // Tapered from the hip down, a rounded knee, a tapered lower leg and a rounded paw or hoof.
      { id: `${d}-upper`, shape: { type: "tube", points: [[0, e.upper * 0.2, 0], [0, -e.upper * 0.5, 0], [0, -e.upper, 0]], radius: [g, g * 0.85, e.lowerThickness * 1.15], segments: 10 }, at: [f * e.across, s, u ? e.front : e.hind], fill: n.coat },
      { id: `${d}-knee`, parent: `${d}-upper`, shape: { type: "ellipsoid", radii: Array(3).fill(e.lowerThickness * 1.08), segments: 10 }, at: [0, -e.upper, 0], fill: n.coat, solidOnly: !0 },
      { id: `${d}-lower`, parent: `${d}-upper`, shape: { type: "tube", points: [[0, 0, 0], [0, -e.lower, 0]], radius: [e.lowerThickness * 1.1, e.lowerThickness * 0.85], segments: 10 }, at: [0, -e.upper, 0], fill: n.coat },
      { id: `${d}-foot`, parent: `${d}-lower`, shape: { type: "ellipsoid", radii: [e.footSize[0] / 2, e.foot / 2 + 4e-3, e.footSize[1] / 2], segments: 12 }, at: [0, -e.lower - e.foot / 2, e.footSize[1] * 0.12], fill: n.foot, outline: 0.8 }
    );
    const p = `${u ? "Front" : "Hind"} ${f > 0 ? "left" : "right"} leg`;
    a[`${d}.swing`] = { description: `${p}: forward (+) or back (−) from the hip`, unit: "degrees", bind: [{ parts: [`${d}-upper`], rotate: { axis: "x", degrees: -1 } }] }, a[`${d}.knee`] = { description: `${p}: knee (hock) folded`, unit: "degrees", bind: [{ parts: [`${d}-lower`], rotate: { axis: "x", degrees: u ? 1 : -1 } }] }, a[`${d}.ankle`] = { description: `${p}: foot turned at the ankle (+ toe forward)`, unit: "degrees", bind: [{ parts: [`${d}-foot`], rotate: { axis: "x", degrees: -1, pivot: [0, e.foot / 2, -e.footSize[1] * 0.12] } }] };
  }
  const l = t.neck.points[t.neck.points.length - 1], c = {
    parts: r,
    controls: a,
    length: t.body.radii[2] * 2 + Math.max(0, t.neck.at[2] + l[2] + t.head.radii[2] - t.body.radii[2]) + 0.3,
    height: t.neck.at[1] + l[1] + t.head.radii[1] * 2,
    footprint: [e.across * 2 + t.body.radii[0], (e.front - e.hind) * 1.4],
    anchors: {
      back: { at: [0, o + t.body.radii[1], -t.body.radii[2] * 0.05] },
      head: { part: "head", at: [0, 0, 0] },
      mouth: { part: t.muzzle ? "muzzle" : "head", at: t.muzzle ? [0, 0, t.muzzle.radii[2]] : [0, 0, t.head.radii[2]] },
      front: { at: [0, o, t.body.radii[2]] },
      ...t.anchors
    },
    derive: (d) => Ok(d, t, s)
  }, h = {
    legLength: s,
    upper: e.upper,
    lower: e.lower,
    foot: e.foot,
    tailHangs: t.tail.points[t.tail.points.length - 1][1] < 0,
    front: e.front,
    hind: e.hind,
    call(d, u) {
      const f = d.anchor("mouth");
      d.effect({ kind: "honk", time: u, x: f.x, y: f.y, length: 800, direction: d.facing() || 1 });
    }
  };
  return {
    kind: t.kind,
    family: "animal",
    summary: t.summary,
    rig: c,
    actions: { ...Hk(t, h), ...t.actions?.(h) },
    acting: Cd,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [
      { control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 },
      { control: "ears", of: "x", per: 1.4, stiffness: 150, damping: 8, limit: 45 }
    ],
    moves: Pk(t, s)
  };
}
function Pk(t, e) {
  const n = (o) => {
    const i = fa(e, o);
    return {
      speed: i / (Co[o].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: ys.indexOf(o) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / i }
    };
  }, s = Object.fromEntries(t.gaits.map((o) => [o === "gallop" && !t.gaits.includes("canter") ? "run" : o, n(o)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const Qt = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function Ik(t, e, n) {
  const s = ed(t.tail.points, Qt.length + 1), [, o, i] = t.body.radii, r = (t.tail.at[1] - n) / o, a = Math.abs(r) < 1 ? -i * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, i * 0.08)], c = (f) => t.tail.radius * (1 - 0.5 * f / Qt.length), h = Qt.map((f, g) => {
    const p = s[g], m = s[g + 1], b = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], M = g === 0 ? void 0 : s[g - 1];
    return {
      id: f,
      ...g > 0 ? { parent: Qt[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], b], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - M[0], p[1] - M[1], p[2] - M[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), d = s[s.length - 1], u = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: Qt[Qt.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(Qt.length) * 1.05), segments: 8 },
    at: [d[0] - u[0], d[1] - u[1], d[2] - u[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function Ok(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const o = ys[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], i = Co[e.gaits.includes(o) ? o : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of Hd) {
    const h = Math.PI * 2 * (r + i.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * i.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * i.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * i.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * i.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (i.rock > 0 ? -i.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function zc(t) {
  const n = Math.sin(32 * Ee), s = t.legLength - (t.front - t.hind) * n, o = 72, r = (s - t.upper * Math.cos(o * Ee) - t.foot) / t.lower, a = r >= 1 ? 0 : r <= -1 ? 180 : Math.acos(r) / Ee, l = {
    pitch: 32,
    // The front hips stay at standing height: tipping up raises them by front · sin, and swinging them round the
    // middle lowers them by leg · (1 − cos); the front legs are held upright, so both are taken back.
    lift: t.legLength * (1 - Math.cos(32 * Ee)) - t.front * n,
    neck: -10,
    // A hanging tail lifts clear of the ground behind the lowered rump; one that curls up tips back to lie behind.
    tail: t.tailHangs ? 35 : -40,
    "fl.swing": -32,
    "fr.swing": -32
  };
  for (const c of ["hl", "hr"])
    l[`${c}.swing`] = o - 32, l[`${c}.knee`] = -(o + a), l[`${c}.ankle`] = a;
  return l;
}
const Cd = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, IM = Cd;
function _k(t) {
  const e = (t.upper + t.lower) * 0.32, n = Math.asin(Math.min(1, e / (t.upper + t.lower + t.foot))) / Ee, s = {
    pitch: 0,
    lift: e - t.legLength,
    neck: -14,
    tail: t.tailHangs ? 60 : -60,
    "fl.swing": 90 - n,
    "fr.swing": 90 - n,
    "fl.knee": 0,
    "fr.knee": 0,
    "fl.ankle": n,
    "fr.ankle": n
  };
  for (const o of ["hl", "hr"])
    s[`${o}.swing`] = 70, s[`${o}.knee`] = -155, s[`${o}.ankle`] = 85;
  return s;
}
function Hk(t, e) {
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
      let d = c;
      a.facing() !== h && (d = a.turnTo(d, h > 0 ? "right" : "left"));
      const u = a.exaggeration;
      a.key(d + 180, { neck: -12 * u }, { act: !1, easing: "ease-out" });
      const g = Math.abs(l.to - a.x) / a.scale / fa(e.legLength, r), p = l.for ?? Math.max(500, g * Co[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", d, a.values.gait ?? 0), a.set("gait", d + 1, ys.indexOf(r)), a.set("walking", d, 0), a.set("walking", d + 240, 1, "ease-out"), a.set("walking", d + p - 240, 1), a.set("walking", d + p, 0, "ease-in"), a.set("walk", d, m), a.move(d, d + p, l.to, { easing: "ease-in-out" }), a.set("walk", d + p, m + g, "ease-in-out"), a.key(d + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: d + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: d + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: d + p + 300, contact: d, release: d + p };
    }
  }), o = Object.fromEntries(t.gaits.map((r) => [r === "gallop" && !t.gaits.includes("canter") ? "run" : r, s(r)]));
  t.gaits.includes("gallop") && !o.gallop && (o.gallop = s("gallop"));
  const i = {
    ...o,
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
        const c = zc(e), h = l + 450;
        r.key(h, c, { act: !1, easing: "ease-in-out" }), r.key(h + (a.for ?? 1500), c, { act: !1 });
        const d = h + (a.for ?? 1500) + 450, u = {};
        for (const f of Object.keys(c)) u[f] = 0;
        return r.key(d, u), { end: d, contact: h, release: d - 450 };
      }
    },
    lie: {
      summary: "Lies down for `for` ms (default 2000), head up and front paws forward (sinking back onto its haunches first), then gets up.",
      uses: ["for"],
      run(r, a, l) {
        const c = _k(e), h = { ...zc(e) }, d = l + 400, u = d + 450;
        r.key(d, h, { act: !1, easing: "ease-in-out" }), r.key(u, c, { act: !1, easing: "ease-in-out" }), r.key(u + (a.for ?? 2e3), c, { act: !1 });
        const f = u + (a.for ?? 2e3) + 600, g = {};
        for (const p of /* @__PURE__ */ new Set([...Object.keys(c), ...Object.keys(h)])) g[p] = 0;
        return r.key(f, g), { end: f, contact: u, release: f - 600 };
      }
    },
    jump: {
      summary: "Crouches and jumps (forward to `to`, or up on the spot), legs tucked in the air, landing with a squash and dust.",
      uses: ["to"],
      run(r, a, l) {
        const c = r.exaggeration, h = e.legLength * 0.8 * c, d = l + 260, u = d + 90, f = u + 520;
        if (r.key(d, { squash: 0.86, "hl.knee": 40, "hr.knee": 40, "fl.knee": 25, "fr.knee": 25, neck: 8 }, { act: !1, easing: "ease-out" }), r.key(u, { squash: 1.12, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, pitch: 8, "fl.swing": 35, "fr.swing": 35, "hl.swing": -35, "hr.swing": -35 }, { act: !1, easing: "ease-out" }), r.key((u + f) / 2, { lift: h, squash: 1, pitch: 0, "fl.knee": 60, "fr.knee": 60, "hl.knee": 60, "hr.knee": 60, "fl.swing": 25, "fr.swing": 25, "hl.swing": -20, "hr.swing": -20 }, { act: !1, easing: "ease-out" }), r.key(f, { lift: 0, squash: 0.85, pitch: -4, "fl.knee": 0, "fr.knee": 0, "hl.knee": 0, "hr.knee": 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0 }, { act: !1, easing: "ease-in" }), r.key(f + 280, { squash: 1, pitch: 0, neck: 0 }), a.to !== void 0) {
          const g = Math.sign(a.to - r.x);
          g !== 0 && r.facing() !== g && r.turnTo(l, g > 0 ? "right" : "left"), r.move(u, f, a.to);
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
  return t.grazes && (i.graze = {
    summary: "Lowers its head to graze for `for` ms (default 1800), nibbling, then looks up.",
    uses: ["for"],
    run(r, a, l) {
      const c = a.for ?? 1800;
      r.key(l + 600, { neck: 75 }, { act: !1, easing: "ease-in-out" });
      for (let h = 900; h < 600 + c; h += 400) r.key(l + h, { neck: h % 800 === 100 ? 70 : 78 }, { act: !1, easing: "ease-in-out" });
      return r.key(l + 600 + c + 500, { neck: 0 }), { end: l + 600 + c + 500 };
    }
  }), i;
}
function Ck(t = {}) {
  return Ze({
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
        run(n, s, o) {
          const i = n.exaggeration, r = Math.min(55, 32 * i), a = -e.hind * Math.sin(r * Ee), l = s.for ?? 700;
          n.key(o + 200, { pitch: -4, neck: 6, "hl.knee": 12, "hr.knee": 12 }, { act: !1, easing: "ease-out" }), n.key(o + 520, { pitch: r, lift: a, neck: -25, "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-out" }), n.key(o + 520 + l * 0.5, { "fl.swing": 35, "fl.knee": 70, "fr.swing": 58, "fr.knee": 100 }, { act: !1, easing: "ease-in-out" }), n.key(o + 520 + l, { "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80 }, { act: !1, easing: "ease-in-out" });
          const c = o + 520 + l + 380;
          return n.key(c, { pitch: 0, lift: 0, neck: 8, squash: 0.94, "fl.swing": 0, "fl.knee": 0, "fr.swing": 0, "fr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(c + 320, { neck: 0, squash: 1 }), e.call(n, o + 520), n.effect({ kind: "dust", time: c, x: n.x + (n.facing() || 1) * e.front * n.scale, y: n.floor, length: 600 }), { end: c + 320, contact: c };
        }
      },
      buck: {
        summary: "Bucks: drops its head and kicks both hind legs up and back.",
        run(n, s, o) {
          const i = n.exaggeration, r = Math.min(35, 18 * i), a = e.front * Math.sin(r * Ee);
          return n.key(o + 220, { pitch: 3, squash: 0.95 }, { act: !1, easing: "ease-out" }), n.key(o + 480, { pitch: -r, lift: a, neck: 30, "hl.swing": -65, "hr.swing": -60, "hl.knee": 10, "hr.knee": 10 }, { act: !1, easing: "ease-out" }), n.key(o + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, "hl.swing": 0, "hr.swing": 0, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(o + 1150, { squash: 1 }), n.effect({ kind: "dust", time: o + 900, x: n.x - (n.facing() || 1) * 0.6 * n.scale, y: n.floor, length: 600 }), { end: o + 1150, contact: o + 480 };
        }
      }
    })
  });
}
function Rk(t = {}) {
  return Ze({
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
          const o = n.for ?? 1200;
          for (let i = 80, r = 0; i < o; i += 80, r++) e.key(s + i, { wag: r % 2 === 0 ? 35 : -35, tail: 25 }, { act: !1, easing: "ease-in-out" });
          return e.key(s + o, { wag: 0, tail: 0 }), { end: s + o };
        }
      },
      sniff: {
        summary: "Puts its nose to the ground and sniffs (`for` ms, default 1400).",
        uses: ["for"],
        run(e, n, s) {
          const o = n.for ?? 1400;
          e.key(s + 350, { neck: 70, pitch: -6 }, { act: !1, easing: "ease-in-out" });
          for (let i = 500, r = 0; i < o; i += 140, r++) e.key(s + i, { neck: r % 2 === 0 ? 74 : 66 }, { act: !1 });
          return e.key(s + o + 300, { neck: 0, pitch: 0 }), { end: s + o + 300 };
        }
      }
    })
  });
}
function Lk(t = {}) {
  return Ze({
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
        run(n, s, o) {
          const i = n.exaggeration, r = s.for ?? 1200, a = { squash: 1 + 0.25 * i, neck: 25, tail: -45, "fl.swing": -8, "fr.swing": -8, "hl.swing": 8, "hr.swing": 8 };
          return n.key(o + 180, a, { act: !1, easing: "ease-out" }), n.key(o + 180 + r, a, { act: !1 }), n.key(o + r + 520, { squash: 1, neck: 0, tail: 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0 }), { end: o + r + 520, contact: o + 180 };
        }
      },
      pounce: {
        summary: "Crouches low, wiggles, and pounces to `to`, landing with a squash.",
        needs: ["to"],
        run(n, s, o) {
          const i = n.exaggeration, r = Math.sign(s.to - n.x);
          let a = o;
          r !== 0 && n.facing() !== r && (a = n.turnTo(a, r > 0 ? "right" : "left"));
          const l = { squash: 0.75, "hl.knee": 60, "hr.knee": 60, "fl.knee": 45, "fr.knee": 45, neck: 10, tail: -15 };
          n.key(a + 300, l, { act: !1, easing: "ease-out" });
          for (let d = 1; d <= 4; d++) n.key(a + 300 + d * 110, { roll: d % 2 === 0 ? 3 : -3 }, { act: !1 });
          const c = a + 300 + 550, h = c + 480;
          return n.key(c, { roll: 0, squash: 1.2, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, "fl.swing": 45, "fr.swing": 45, "hl.swing": -45, "hr.swing": -45, tail: 20 }, { act: !1, easing: "ease-out" }), n.key((c + h) / 2, { lift: e.legLength * 0.9 * i, squash: 1.1, pitch: -6 }, { act: !1, easing: "ease-out" }), n.key(h, { lift: 0, squash: 0.8, pitch: 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0, neck: 0, tail: 0 }, { act: !1, easing: "ease-in" }), n.key(h + 260, { squash: 1 }), n.move(c, h, s.to), n.effect({ kind: "dust", time: h, x: s.to, y: n.floor, length: 450 }), { end: h + 260, contact: h };
        }
      }
    })
  });
}
function Wk(t = {}) {
  return Ze({
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
function OM(t) {
  return fa(1, t);
}
function Fk(t = {}) {
  return Ze({
    kind: t.kind ?? "goat",
    summary: t.summary ?? "A goat: walks, trots and gallops, bleats, grazes, sits, lies, jumps, and swishes its stubby tail.",
    legs: { upper: 0.22, lower: 0.2, foot: 0.05, footSize: [0.07, 0.09], front: 0.26, hind: -0.26, across: 0.1, thickness: [0.045, 0.05], lowerThickness: 0.03 },
    body: { radii: [0.15, 0.17, 0.38], rise: 0.1 },
    neck: { at: [0, 0.62, 0.3], points: [[0, 0, 0], [0, 0.16, 0.1]], radius: 0.07 },
    head: { at: [0, 0.16, 0.1], radii: [0.09, 0.1, 0.15], rotate: [-20, 0, 0] },
    muzzle: { at: [0, -0.05, 0.13], radii: [0.055, 0.05, 0.07] },
    // Ears out sideways, a little down.
    ears: { at: [0.1, 0.03, -0.02], radii: [0.06, 0.025, 0.03], rotate: [0, 0, -20] },
    eyes: { at: [0.065, 0.05, 0.09], size: 0.022 },
    tail: { at: [0, 0.64, -0.37], points: [[0, 0, 0], [0, 0.06, -0.05]], radius: 0.025 },
    extras: (e) => [
      // Two short horns curving back, and a beard under the chin.
      { id: "horn-left", parent: "head", shape: { type: "tube", points: [[0, 0, 0], [0.01, 0.07, -0.03], [0.015, 0.12, -0.08]], radius: 0.014, segments: 6 }, at: [0.045, 0.08, -0.02], fill: e.dark },
      { id: "horn-right", parent: "head", shape: { type: "tube", points: [[0, 0, 0], [-0.01, 0.07, -0.03], [-0.015, 0.12, -0.08]], radius: 0.014, segments: 6 }, at: [-0.045, 0.08, -0.02], fill: e.dark },
      { id: "beard", parent: "head", shape: { type: "ellipsoid", radii: [0.025, 0.05, 0.02], segments: 8 }, at: [0, -0.12, 0.06], fill: e.accent, outline: 0.5 }
    ],
    colors: { coat: "#e9e2d3", dark: "#8c7b66", foot: "#4f4339", muzzle: "#d8cdb8", accent: "#cfc4b0", ...t.colors },
    gaits: ["walk", "trot", "gallop"],
    cycleScale: 0.8,
    call: "bleat",
    grazes: !0
  });
}
function Nk(t = {}) {
  return Ze({
    kind: t.kind ?? "rabbit",
    summary: t.summary ?? "A rabbit: walks and hops (gallop), squeaks, nibbles the ground (graze), sits, lies and jumps; long ears and a puff of a tail.",
    legs: { upper: 0.07, lower: 0.07, foot: 0.03, footSize: [0.04, 0.07], front: 0.11, hind: -0.12, across: 0.06, thickness: [0.028, 0.04], lowerThickness: 0.02 },
    body: { radii: [0.1, 0.11, 0.19], rise: 0.05 },
    neck: { at: [0, 0.22, 0.14], points: [[0, 0, 0], [0, 0.06, 0.04]], radius: 0.05 },
    head: { at: [0, 0.07, 0.04], radii: [0.08, 0.075, 0.09] },
    muzzle: { at: [0, -0.02, 0.07], radii: [0.035, 0.028, 0.03] },
    // Tall ears standing up, tipped back a little.
    ears: { at: [0.035, 0.08, -0.02], radii: [0.022, 0.1, 0.03], rotate: [-15, 0, -8] },
    eyes: { at: [0.045, 0.015, 0.06], size: 0.02 },
    tail: { at: [0, 0.2, -0.18], points: [[0, 0, 0], [0, 0.03, -0.02]], radius: 0.03 },
    extras: () => [{ id: "nose", parent: "muzzle", shape: { type: "ellipsoid", radii: [0.012, 9e-3, 9e-3], segments: 8 }, at: [0, 0.012, 0.03], fill: "#e48a9a", outline: 0.4 }],
    colors: { coat: "#c9b8a6", dark: "#9a8574", foot: "#b5a493", muzzle: "#eadfd2", accent: "#f4ece2", ...t.colors },
    gaits: ["walk", "gallop"],
    cycleScale: 0.4,
    call: "squeak",
    grazes: !0
  });
}
function Dk(t = {}) {
  return Ze({
    kind: t.kind ?? "squirrel",
    summary: t.summary ?? "A squirrel: scampers (gallop) and walks, chatters, sits up, nibbles (graze), with a bushy tail curled over its back.",
    legs: { upper: 0.05, lower: 0.05, foot: 0.02, footSize: [0.025, 0.04], front: 0.08, hind: -0.08, across: 0.04, thickness: [0.02, 0.025], lowerThickness: 0.014 },
    body: { radii: [0.065, 0.07, 0.14], rise: 0.03 },
    neck: { at: [0, 0.16, 0.1], points: [[0, 0, 0], [0, 0.04, 0.03]], radius: 0.035 },
    head: { at: [0, 0.05, 0.03], radii: [0.055, 0.05, 0.06] },
    muzzle: { at: [0, -0.015, 0.05], radii: [0.025, 0.02, 0.02] },
    ears: { at: [0.03, 0.05, -0.01], radii: [0.015, 0.03, 0.012], rotate: [0, 0, -5] },
    eyes: { at: [0.035, 0.012, 0.04], size: 0.015 },
    // The tail sweeps up and over the back, thick and bushy.
    tail: { at: [0, 0.14, -0.13], points: [[0, 0, 0], [0, 0.08, -0.06], [0, 0.2, -0.04], [0, 0.26, 0.04]], radius: 0.045 },
    colors: { coat: "#a9663a", dark: "#7a4523", foot: "#7a4523", muzzle: "#e9c9a8", accent: "#f0dcc4", ...t.colors },
    gaits: ["walk", "gallop"],
    cycleScale: 0.3,
    call: "chatter",
    grazes: !0
  });
}
const be = 0.6, Rd = 75, Si = 80;
function Qe(t) {
  const { colors: e } = t, [n, s, o] = t.body.radii, i = (t.tail.raised ?? 15) * Math.PI / 180, r = t.tail.length * 0.4, a = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 16 }, at: [0, t.body.height, 0], fill: e.body },
    // The head hangs from a neck joint at the front of the body, so it can peck.
    { id: "neck", shape: { type: "ellipsoid", radii: [n * 0.55, s * 0.55, o * 0.3], segments: 10 }, at: [0, t.body.height + s * 0.45, o * 0.65], fill: e.body, outline: 0.5, solidOnly: !0 },
    {
      id: "head",
      parent: "neck",
      shape: { type: "ellipsoid", radii: [t.head.radius, t.head.radius * 1.02, t.head.radius * 1.05], segments: 14 },
      at: [t.head.at[0], t.head.at[1] - (t.body.height + s * 0.45), t.head.at[2] - o * 0.65],
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
    { id: "tail", shape: { type: "ellipsoid", radii: [t.tail.width / 2, 0.012 * (o / 0.08), t.tail.length / 2], segments: 10 }, at: [t.tail.at[0], t.tail.at[1] + r * Math.sin(i), t.tail.at[2] - r * Math.cos(i)], rotate: [t.tail.raised ?? 15, 0, 0], fill: e.wing, outline: 0.8 }
  ];
  if (e.belly && a.push({ id: "belly", parent: "body", shape: { type: "ellipsoid", radii: [n * 0.82, s * 0.7, o * 0.75], segments: 12 }, at: [0, -s * 0.25, o * 0.12], fill: e.belly, outline: 0.4 }), t.comb) {
    const h = t.head.radius;
    a.push(
      { id: "comb", parent: "head", shape: { type: "extrude", profile: [[-h * 0.5, h * 0.6], [h * 0.6, h * 0.6], [h * 0.5, h * 1.3], [h * 0.15, h * 1.05], [-h * 0.05, h * 1.4], [-h * 0.3, h * 1.05], [-h * 0.6, h * 1.25]], width: h * 0.25 }, fill: e.comb ?? "#d9372e", outline: 0.7 },
      { id: "wattle", parent: "head", shape: { type: "ellipsoid", radii: [h * 0.15, h * 0.35, h * 0.2], segments: 8 }, at: [0, -h * 0.7, h * 0.6], fill: e.comb ?? "#d9372e", outline: 0.6 }
    );
  }
  for (const h of [1, -1]) {
    const d = h > 0 ? "left" : "right", u = t.head.radius;
    a.push({ id: `eye-${d}`, parent: "head", shape: { type: "ellipsoid", radii: [u * 0.16, u * 0.2, u * 0.18], segments: 8 }, at: [h * u * 0.72, u * 0.18, u * 0.42], fill: "#1d1d22", outline: 0.3 }), a.push({
      id: `wing-${d}`,
      shape: { type: "ellipsoid", radii: [4e-3, 4e-3, 4e-3], segments: 4 },
      at: [h * t.wing.shoulder[0], t.wing.shoulder[1], t.wing.shoulder[2]],
      rotate: [-8, h * 90, 0],
      outline: 0
    }), a.push({
      id: `wing-${d}-blade`,
      parent: `wing-${d}`,
      shape: { type: "ellipsoid", radii: [t.wing.span * be / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * be / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-Si, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${d}-tip`,
      parent: `wing-${d}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * be / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * be / 4, 0, -t.wing.chord * 0.3],
      rotate: [0, h * 14, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({ id: `leg-${d}`, shape: { type: "tube", points: [[0, 0, 0], [0, -t.legs.length, 0]], radius: Math.max(4e-3, t.legs.length * 0.05), segments: 5 }, at: [h * t.legs.across, t.legs.length, 0], fill: e.legs, outline: 0.6 }), a.push({ id: `toes-${d}`, parent: `leg-${d}`, shape: { type: "tube", points: [[0, 0, -t.legs.length * 0.15], [0, 0, t.legs.length * 0.35]], radius: Math.max(3e-3, t.legs.length * 0.04), segments: 5 }, at: [0, -t.legs.length, 0], fill: e.legs, outline: 0.6 });
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
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - be) / 2, 0, 0], rotate: { axis: "x", degrees: Si }, scale: [1 / be, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - be) / 2, 0, 0], rotate: { axis: "x", degrees: Si }, scale: [1 / be, 1, 1] }
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
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / Rd, 0] }]
    },
    step: { description: "Phase of a walk, in steps (a chicken’s legs)", unit: "steps" },
    stepping: { description: "How much of the walk is applied", unit: "0..1", min: 0, max: 1 },
    "leg.left": { description: "Left leg swung forward (+)", unit: "degrees", bind: [{ parts: ["leg-left"], rotate: { axis: "x", degrees: -1 } }] },
    "leg.right": { description: "Right leg swung forward (+)", unit: "degrees", bind: [{ parts: ["leg-right"], rotate: { axis: "x", degrees: -1 } }] },
    // Perch contact: the toes curl down round a branch (set as it lands above the ground, cleared as it takes off).
    grip: { description: "The toes curled down round a perch: 0 flat on the ground, 1 gripping", unit: "0..1", min: 0, max: 1, bind: [{ parts: ["toes-left", "toes-right"], rotate: { axis: "x", degrees: 55 } }] }
  }, c = {
    parts: a,
    controls: l,
    length: o * 2 + t.tail.length + t.beak.length,
    height: t.head.at[1] + t.head.radius,
    footprint: [n * 2.2, o * 2.4],
    anchors: {
      beak: { part: "beak", at: [0, 0, t.beak.length] },
      head: { part: "head", at: [0, 0, 0] },
      back: { at: [0, t.body.height + s, 0] },
      feet: { at: [0, 0, 0] }
    },
    derive: (h) => {
      const d = {}, u = Math.max(0, Math.min(1, h.flapping ?? 0));
      u > 0 && (d.flap = (h.flap ?? 0) + u * 48 * Math.sin(Math.PI * 2 * (h.wingbeat ?? 0)));
      const f = Math.max(0, Math.min(1, h.stepping ?? 0));
      if (f > 0) {
        const g = Math.sin(Math.PI * 2 * (h.step ?? 0));
        d["leg.left"] = (h["leg.left"] ?? 0) + f * 28 * g, d["leg.right"] = (h["leg.right"] ?? 0) - f * 28 * g, d.peck = (h.peck ?? 0) + f * 12 * Math.sin(Math.PI * 4 * (h.step ?? 0));
      }
      return d;
    }
  };
  return {
    kind: t.kind,
    family: "bird",
    summary: t.summary,
    rig: c,
    actions: zk(t),
    acting: qk,
    colors: { body: e.body, ink: "#26262b" },
    moves: Bk(t)
  };
}
function Bk(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const qk = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function zk(t) {
  const e = (t.beatsPerSecond ?? 4) / 1e3, n = (r, a, l) => {
    const c = r.values.wingbeat ?? 0;
    r.set("wingbeat", a, c), r.set("wingbeat", l, c + (l - a) * e);
  }, s = (r, a, l) => {
    const c = Math.sign(l - r.x);
    return c !== 0 && r.facing() !== c ? r.turnTo(a, c > 0 ? "right" : "left") : a;
  }, o = (r, a) => {
    const l = r.anchor("beak");
    r.effect({ kind: "honk", time: a, x: l.x, y: l.y, length: 600, direction: r.facing() || 1 });
  }, i = {
    hop: {
      summary: "Hops to `to` in little bounces, wings twitching.",
      needs: ["to"],
      run(r, a, l) {
        const c = s(r, l, a.to), h = r.x, d = Math.abs(a.to - h), u = Math.max(1, Math.round(d / (t.body.radii[2] * 3 * r.scale))), f = 260;
        for (let g = 0; g < u; g++) {
          const p = c + g * f;
          r.key(p + 60, { squash: 0.85 }, { act: !1, easing: "ease-out" }), r.key(p + 150, { squash: 1.1, lift: t.legs.length * 1.4, spread: 0.15 }, { act: !1, easing: "ease-out" }), r.key(p + f, { squash: 0.9, lift: 0, spread: 0 }, { act: !1, easing: "ease-in" }), r.move(p + 60, p + f, h + (a.to - h) * (g + 1) / u, { easing: "ease-in-out" });
        }
        return r.key(c + u * f + 120, { squash: 1 }), { end: c + u * f + 120 };
      }
    },
    walk: {
      summary: "Walks to `to` on its two legs, its head bobbing with each step.",
      needs: ["to"],
      uses: ["for"],
      run(r, a, l) {
        const c = s(r, l, a.to), h = Math.abs(a.to - r.x) / r.scale, d = t.legs.length * 1.2, u = h / d, f = a.for ?? Math.max(400, u * 420), g = r.values.step ?? 0;
        return r.set("stepping", c, 0), r.set("stepping", c + 150, 1, "ease-out"), r.set("stepping", c + f - 150, 1), r.set("stepping", c + f, 0, "ease-in"), r.set("step", c, g), r.move(c, c + f, a.to, { easing: "ease-in-out" }), r.set("step", c + f, g + u / 2, "ease-in-out"), { end: c + f, contact: c, release: c + f };
      }
    },
    peck: {
      summary: "Pecks at the ground (`for` ms, default 900): quick jabs of the head.",
      uses: ["for"],
      run(r, a, l) {
        const c = a.for ?? 900, h = Math.max(1, Math.round(c / 300));
        r.key(l + 120, { pitch: -(t.stoop ?? 12) }, { act: !1, easing: "ease-out" });
        for (let d = 0; d < h; d++)
          r.key(l + 120 + d * 300 + 90, { peck: Rd }, { act: !1, easing: "ease-in" }), r.key(l + 120 + d * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
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
        return r.key(l + 120, { peck: -25, squash: 1.06 }, { act: !1, easing: "ease-out" }), r.key(l + 500, { peck: -20 }, { act: !1 }), r.key(l + 760, { peck: 0, squash: 1 }), o(r, l + 150), { end: l + 760, contact: l + 150 };
      }
    }
  };
  return t.flies !== !1 ? (i.fly = {
    summary: "Takes off (a crouch and a leap, wings beating) and flies to `to` at `height` metres (default 2); `land` brings it down.",
    needs: ["to"],
    uses: ["height", "for"],
    run(r, a, l) {
      const c = r.exaggeration;
      r.key(l + 60, { grip: 0 }, { act: !1 });
      const h = s(r, l, a.to), d = a.height ?? 2, u = a.for ?? Math.max(700, Math.abs(a.to - r.x) / 0.35), f = r.values.lift > t.legs.length, g = f ? h : h + 200;
      return f || (r.key(h + 160, { squash: 1 - 0.18 * c, spread: 0.6 }, { act: !1, easing: "ease-out" }), r.effect({ kind: "dust", time: g, x: r.x, y: r.floor, length: 400 })), r.key(g + 100, { spread: 1, squash: 1.08, pitch: 10 }, { act: !1, easing: "ease-out" }), r.set("flapping", g, r.values.flapping ?? 0), r.set("flapping", g + 100, 1, "ease-out"), r.set("flapping", g + u, 0.6), n(r, g, g + u), r.key(g + u * 0.4, { lift: d, pitch: -5, squash: 1 }, { act: !1, easing: "ease-out" }), r.key(g + u, { lift: d, pitch: 0 }, { act: !1, easing: "ease-in-out" }), r.move(g, g + u, a.to, { easing: "ease-in-out" }), { end: g + u, contact: g, release: g + u };
    }
  }, i.glide = {
    summary: "Glides to `to` on still, spread wings, sinking gently to `height` metres (default: a third lower than it is); from the ground it takes off first, flying the first stretch.",
    needs: ["to"],
    uses: ["height", "for"],
    run(r, a, l) {
      let c = l;
      if (r.values.lift <= t.legs.length) {
        const f = r.x + (a.to - r.x) / 3;
        c = i.fly.run(r, { do: "fly", to: f, height: (a.height ?? 1.5) * 1.3 }, l).end;
      }
      c = s(r, c, a.to);
      const h = r.values.lift, d = a.height ?? h * 0.67, u = a.for ?? Math.max(900, Math.abs(a.to - r.x) / 0.3);
      return r.set("flapping", c, r.values.flapping ?? 1), r.set("flapping", c + 250, 0, "ease-out"), n(r, c, c + 250), r.key(c + 300, { spread: 1, flap: 10, pitch: -6 }, { act: !1, easing: "ease-out" }), r.key(c + u, { lift: d, pitch: -3, flap: 10 }, { act: !1, easing: "ease-in-out" }), r.move(c, c + u, a.to, { easing: "ease-in-out" }), { end: c + u, contact: c, release: c + u };
    }
  }, i.land = {
    summary: "Comes down to the floor it is over (or to `height` metres above it, a branch or a roof): wings braking, a squash on touchdown.",
    uses: ["height", "to"],
    run(r, a, l) {
      const h = a.height ?? 0;
      return r.set("flapping", l, r.values.flapping ?? 1), r.set("flapping", l + 700 - 120, 1), r.set("flapping", l + 700, 0, "ease-in"), n(r, l, l + 700), r.key(l + 700 * 0.6, { pitch: 14 }, { act: !1, easing: "ease-out" }), r.key(l + 700, { lift: h, pitch: 0, squash: 0.85, grip: h > 0 ? 1 : 0 }, { act: !1, easing: "ease-in" }), a.to !== void 0 && r.move(l, l + 700, a.to, { easing: "ease-out" }), r.key(l + 700 + 160, { squash: 1, spread: 0, flap: 0 }), { end: l + 700 + 200, contact: l + 700 };
    }
  }) : i.flutter = {
    summary: "Flutters up a little way and back down, wings beating hard (a chicken’s flight).",
    run(r, a, l) {
      return r.key(l + 100, { spread: 1, squash: 0.9 }, { act: !1, easing: "ease-out" }), r.set("flapping", l + 80, 0), r.set("flapping", l + 160, 1, "ease-out"), r.set("flapping", l + 900 - 100, 1), r.set("flapping", l + 900, 0, "ease-in"), n(r, l + 80, l + 900), r.key(l + 900 * 0.5, { lift: t.legs.length * 2.5, squash: 1.08 }, { act: !1, easing: "ease-out" }), r.key(l + 900, { lift: 0, squash: 0.85, spread: 0 }, { act: !1, easing: "ease-in" }), r.key(l + 900 + 160, { squash: 1 }), { end: l + 900 + 160, contact: l + 900 };
    }
  }, i;
}
function Yk(t = {}) {
  return Qe({
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
function Kk(t = {}) {
  return Qe({
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
function jk(t = {}) {
  return Qe({
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
function Xk(t = {}) {
  return Qe({
    kind: "pigeon",
    summary: "A pigeon: walks with a bobbing head, pecks at crumbs, coos, flaps, flies and lands (on the ground, a ledge or a branch).",
    body: { radii: [0.08, 0.075, 0.14], height: 0.14 },
    head: { at: [0, 0.24, 0.12], radius: 0.045 },
    beak: { length: 0.035, thickness: 0.014 },
    wing: { shoulder: [0.065, 0.17, 0.05], span: 0.24, chord: 0.11 },
    tail: { at: [0, 0.13, -0.13], length: 0.12, width: 0.08, raised: 8 },
    legs: { length: 0.06, across: 0.03 },
    colors: { body: "#8d93a3", wing: "#6f7586", beak: "#5a5a66", legs: "#d9627a", belly: "#b9bdc8", ...t.colors },
    call: "coo",
    beatsPerSecond: 6,
    stoop: 16
  });
}
function Uk(t = {}) {
  return Qe({
    kind: "duck",
    summary: "A duck: waddles, dabbles with its bill (peck), quacks, flaps, flies and lands (on the ground or the water’s edge).",
    body: { radii: [0.11, 0.1, 0.2], height: 0.16 },
    head: { at: [0, 0.33, 0.15], radius: 0.055 },
    beak: { length: 0.075, thickness: 0.028 },
    wing: { shoulder: [0.09, 0.22, 0.06], span: 0.28, chord: 0.13 },
    tail: { at: [0, 0.17, -0.19], length: 0.1, width: 0.09, raised: 30 },
    legs: { length: 0.07, across: 0.045 },
    colors: { body: "#c9b48b", wing: "#8f7a55", beak: "#f2a71b", legs: "#f2a71b", belly: "#e8dcc0", ...t.colors },
    call: "quack",
    beatsPerSecond: 7,
    stoop: 22,
    neckReach: 0.04
  });
}
function Gk(t = {}) {
  return Qe({
    kind: "owl",
    summary: "An owl: a big round head, slow silent wingbeats; hoots, turns its head, flies and lands on a branch.",
    body: { radii: [0.1, 0.12, 0.13], height: 0.19 },
    head: { at: [0, 0.37, 0.07], radius: 0.085 },
    beak: { length: 0.025, thickness: 0.02 },
    wing: { shoulder: [0.085, 0.27, 0.03], span: 0.34, chord: 0.18 },
    tail: { at: [0, 0.14, -0.12], length: 0.1, width: 0.1, raised: -10 },
    legs: { length: 0.07, across: 0.04 },
    colors: { body: "#9c7a55", wing: "#6e5538", beak: "#3d3028", legs: "#c9a76a", belly: "#e3cda8", ...t.colors },
    call: "hoot",
    beatsPerSecond: 3,
    stoop: 6
  });
}
function Vk(t = {}) {
  return Qe({
    kind: "parrot",
    summary: "A parrot: bright, with a big hooked beak and a long tail; squawks, bobs, flies and lands on a perch, gripping it.",
    body: { radii: [0.07, 0.08, 0.13], height: 0.15 },
    head: { at: [0, 0.29, 0.1], radius: 0.055 },
    beak: { length: 0.045, thickness: 0.03 },
    wing: { shoulder: [0.06, 0.2, 0.05], span: 0.26, chord: 0.11 },
    tail: { at: [0, 0.12, -0.12], length: 0.22, width: 0.06, raised: -20 },
    legs: { length: 0.06, across: 0.03 },
    colors: { body: "#4caf50", wing: "#2e7d32", beak: "#5a5a66", legs: "#8d8d8d", belly: "#a5d66f", comb: "#d9372e", ...t.colors },
    call: "squawk",
    beatsPerSecond: 6,
    stoop: 10
  });
}
const cs = { car: J2, truck: Z2, bus: Q2, tractor: tk, cart: ek, trainCar: nk, bike: sk, motorbike: ok, tree: ik, house: lk, chair: dk, desk: pk, bed: mk, door: bk, wheelchair: vk, helicopter: Sk, airplane: Ek, horse: Ck, dog: Rk, cat: Lk, cow: Wk, goat: Fk, rabbit: Nk, squirrel: Dk, songbird: Yk, crow: Kk, chicken: jk, pigeon: Xk, duck: Uk, owl: Gk, parrot: Vk };
function Ld(t, e = {}) {
  const n = cs[t];
  if (!n) throw new Error(ut("prop preset", t, Object.keys(cs)));
  return n(e);
}
const ur = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], fr = { viewer: 0, right: 1, away: 2, left: 3 }, Jk = 420, Wd = {
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
      const s = e.for ?? 500, o = t.exaggeration;
      return t.key(n, { size: 0, squash: 1 }, { act: !1 }), t.key(n + s * 0.6, { size: 1 + 0.15 * o, squash: 1 + 0.15 * o }, { act: !1, easing: "ease-out" }), t.key(n + s, { size: 1, squash: 1 }), { end: n + s, contact: n };
    }
  },
  vanish: {
    summary: "Shrinks away to nothing, with a little stretch first (`for` ms, default 400).",
    uses: ["for"],
    run(t, e, n) {
      const s = e.for ?? 400, o = t.exaggeration;
      return t.key(n + s * 0.3, { size: 1 + 0.08 * o, squash: 1 + 0.12 * o }, { act: !1, easing: "ease-out" }), t.key(n + s, { size: 0, squash: 1 }, { act: !1, easing: "ease-in" }), { end: n + s, release: n + s };
    }
  }
};
function pa(t) {
  return { ...Wd, ...t.actions };
}
const Ti = (t) => typeof t == "number" && Number.isFinite(t);
function Zk(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = pa(e), s = Object.keys(n), o = [];
  return t.forEach((i, r) => {
    const a = (c) => o.push({ level: "error", beat: r, message: c });
    if (!i || typeof i != "object" || Array.isArray(i)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = i;
    for (const c of Object.keys(l))
      ur.includes(c) || a(ut("beat field", c, ur, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(ut(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(Ti(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !Ti(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !Ti(l.toward) && !(typeof l.toward == "string" && l.toward in fr)) {
      const c = typeof l.toward == "string" ? Gs(l.toward, Object.keys(fr)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), o;
}
function Qk(t, e, n, s = {}) {
  const o = Zk(n, e).filter((k) => k.level === "error");
  if (o.length > 0) throw new Error(`propScript (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((k) => `  beat ${k.beat}: ${k.message}`).join(`
`)}`);
  const i = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = pa(e), h = {};
  for (const k of [...Object.keys(gs), ...Object.keys(e.rig.controls)]) h[k] = s.start?.[k] ?? St(e.rig, {}, k);
  const d = [{ time: 0, pose: { ...h } }], u = /* @__PURE__ */ new Map(), f = [];
  let g = i, p = r;
  const m = (k, x, P, I) => {
    const O = u.get(k) ?? [{ time: 0, value: k === "x" || k === "y" ? 0 : h[k] }];
    O.push({ time: x, value: P, ...I ? { easing: I } : {} }), u.set(k, O), k !== "x" && k !== "y" && (h[k] = P);
  }, b = (k, x) => {
    const P = k === "x" ? g - i : k === "y" ? p - r : h[k], I = u.get(k);
    (!I || I[I.length - 1].time < x) && m(k, x, P);
  }, M = {
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
    key(k, x, P = {}) {
      Object.assign(h, x), d.push({ time: k, pose: { ...h }, ...P.act === !1 ? { act: !1 } : {}, ...P.easing ? { easing: P.easing } : {} });
    },
    move(k, x, P, I = {}) {
      b("x", k), m("x", x, P - i, I.easing), g = P, I.floor !== void 0 && (b("y", k), m("y", x, I.floor - r, I.easing), p = I.floor);
    },
    set(k, x, P, I) {
      m(k, x, P, I);
    },
    turnTo(k, x) {
      const P = typeof x == "number" ? x : fr[x], I = h.turn, _ = [P - 4, P, P + 4].map((B) => ({ t: B, d: Math.abs(B - I) })).sort((B, j) => B.d - j.d || Math.abs(B.t) - Math.abs(j.t))[0];
      if (_.d < 1e-3) return k;
      const W = k + Jk * Math.max(1, _.d);
      return M.key(W, { turn: _.t }), W;
    },
    effect(k) {
      f.push(k);
    },
    anchor(k) {
      const P = ms(e, h, a).anchors[k];
      if (!P) throw new Error(`${e.kind}: no anchor "${k}"`);
      return { x: g + P.point.x, y: p + P.point.y };
    }
  }, w = [];
  let y = 0;
  for (const k of n) {
    const x = Math.max(k.at ?? y, d[d.length - 1].time), P = c[k.do].run(M, k, x);
    P.end > d[d.length - 1].time && d.push({ time: P.end, pose: { ...h } }), w.push({ start: x, end: P.end, ...P.contact !== void 0 ? { contact: P.contact } : {}, ...P.release !== void 0 ? { release: P.release } : {} }), y = P.end;
  }
  const S = fd(s.style ?? "snappy"), E = { ...S, anticipation: S.anticipation * l, overshoot: S.overshoot * l }, A = ra(s5(d), e.acting, { style: E }), v = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(A).filter(([k]) => !u.has(k)).map(([k, x]) => ({ id: `${t}-${k}`, target: t, property: k, keyframes: x })),
    ...[...u].map(([k, x]) => ({ id: `${t}-${k}`, target: t, property: k, keyframes: o5(x) }))
  ];
  for (const k of e5(t, e, v, y, d[0].pose)) {
    const x = v.findIndex((O) => O.property === k.property);
    if (x < 0) {
      v.push(k);
      continue;
    }
    const P = new Ct({ id: `${t}-own`, tracks: [v[x]] }), I = (O) => Number(P.getStateAtTime(O).values.get(t)?.get(k.property) ?? 0);
    v[x] = { ...k, keyframes: k.keyframes.map((O) => ({ time: O.time, value: Number(O.value) + I(O.time) })) };
  }
  return { tracks: v, duration: y, beats: w, effects: f };
}
const t5 = 1500;
function e5(t, e, n, s, o) {
  if (!e.follow?.length) return [];
  const i = new Ct({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = i.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : o[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + t5, c = Ls((u) => r(u, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, d = c.map(({ time: u, value: f }) => {
      const g = Math.sin(r(u, "turn") * Math.PI / 2), p = (f - r(u, a.of)) * g;
      return { time: u, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: d };
  });
}
const n5 = 20;
function s5(t) {
  const e = [...t].sort((s, o) => s.time - o.time), n = [];
  for (const s of e) {
    const o = n[n.length - 1];
    o && s.time - o.time < n5 ? n[n.length - 1] = { ...s, time: o.time } : n.push(s);
  }
  return n;
}
function o5(t) {
  const e = t.map((s, o) => ({ k: s, i: o })).sort((s, o) => s.k.time - o.k.time || s.i - o.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const i5 = {
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
function r5(t, e = {}) {
  const n = {};
  for (const s of Object.keys(Ft)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(Vt)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(Ge)) n[s] = { summary: `The ${s} gag (${po(s)} ms).` };
  for (const [s, o] of Object.entries(Ho)) n[s] = { ...o };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(i5),
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
    canvasProperties: ca,
    stickFigure: {
      poseFields: Bh,
      props: qh,
      handFields: zh,
      poses: Object.keys(Vt),
      expressions: Object.keys(kt),
      gags: Object.fromEntries(Object.keys(Ge).map((s) => [s, po(s)])),
      gaits: Object.keys(Ft),
      actingStyles: Object.keys(wn),
      beatFields: lr,
      actions: n,
      dances: Object.fromEntries(Object.entries(Je).map(([s, o]) => [s, Object.keys(o.moves)])),
      flips: Object.fromEntries(Object.entries(Eo).map(([s, o]) => [s, o.label])),
      handShapes: Object.keys(Ht),
      mudras: Object.keys(ji)
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
        "propRide3D({ prop, propId, propTracks, scene, placement, anchor, riderId, pose, start, end, mount?, dismount? })": "a character riding a prop in a 3D scene: hips on a seat anchor (saddle, seat) as it moves, hopping on and off; RIDING_POSES.astride / .seated / .driving / .cycling / .wheeling (a wheelchair)",
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
      beatFields: ur,
      commonControls: Object.fromEntries(Object.entries(gs).map(([s, o]) => [s, `${o.description}${o.unit ? ` (${o.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(Wd).map(([s, o]) => [s, o.summary])),
      presets: Object.fromEntries(
        Object.entries(cs).map(([s, o]) => {
          const i = o();
          return [
            s,
            {
              family: i.family,
              summary: i.summary,
              actions: Object.fromEntries(Object.entries(i.actions).map(([r, a]) => [r, { summary: a.summary, ...a.needs ? { needs: a.needs } : {} }])),
              controls: Object.keys(i.rig.controls),
              anchors: Object.keys(i.rig.anchors ?? {})
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
      actions: Object.fromEntries(Object.entries(e.actions ?? {}).map(([s, o]) => [s, { summary: o.summary, ...o.needs ? { needs: o.needs } : {} }])),
      gaits: Object.fromEntries(Object.entries(e.gaits ?? {}).map(([s, o]) => [s, o.summary ?? "custom gait"]))
    },
    character: {
      poses: Object.keys(ce),
      expressions: Object.keys(u0),
      gags: Object.keys(Vr),
      builds: Object.keys(Ui),
      hair: Object.keys(w0),
      hairColors: { ...fe },
      facialHair: Object.keys(P0),
      glasses: Object.keys(O0),
      hats: Object.keys(Gr),
      feet: [...H1],
      cast: Object.keys(ud),
      heldItems: Object.fromEntries(Object.entries(D0).map(([s, o]) => [s, o.hands])),
      handMeetings: Object.keys(fo)
    },
    codePanel: {
      languages: ir,
      removeStyles: or,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: dd
    },
    surfaces: { code: zs, board: ke, chart: pn, prop: Kn },
    surfaceScript: {
      "surfaceScript(figureId, { name: surface }, beats, options)": "compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)",
      "checkSurfaceBeats(beats, surfaces, cast?)": "every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions",
      "{ surface, anchor }": "a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it",
      "then: { surface, edit, anchor, at?, until?, …options }": "what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options",
      at: `a moment of the beat: ${Jn.join(", ")} (default contact, or start when the beat has none); not ms`,
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
const vt = (t) => t.map((e) => `\`${e}\``).join(", "), Yc = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function _M(t, e = {}) {
  const n = r5(t, e), s = n.stickFigure;
  return [
    `# tinyfly capabilities${n.version ? ` (v${n.version})` : ""}`,
    "",
    "Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).",
    "",
    `**Timing.** ${n.timing}`,
    "",
    "## Easings",
    "",
    `Named: ${vt(n.easings.named)}.`,
    "",
    ...Object.entries(n.easings.parametric).map(([i, r]) => `- ${i}: \`${r}\``),
    "",
    "## Track kinds",
    "",
    ...Object.entries(n.trackKinds).map(([i, r]) => `- **${i}**: ${r}`),
    "",
    "## Canvas targets",
    "",
    "Types: `rect`, `circle`, `text`, `line`, `path`, `image`, `custom`. `describeTarget(target)` lists what one can animate with its values; `checkTracks(tracks, targets)` checks tracks before playing them.",
    "",
    "| Property | Unit | What it does | Types |",
    "|---|---|---|---|",
    ...Object.entries(n.canvasProperties).map(
      ([i, r]) => `| \`${i}\` | ${r.unit ?? r.kind ?? ""} | ${r.description} | ${r.types.length === 7 ? "all" : r.types.join(", ")} |`
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
    Yc(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Yc(s.props),
    "",
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${vt(Object.keys(s.handFields))}.`,
    "",
    `**Poses** (a beat's \`do\`, or a pose key): ${vt(s.poses)}.`,
    "",
    `**Expressions** (a beat's \`mood\`): ${vt(s.expressions)}.`,
    "",
    `**Gags** (ms): ${Object.entries(s.gags).map(([i, r]) => `\`${i}\` (${r})`).join(", ")}.`,
    "",
    `**Gaits**: ${vt(s.gaits)}. **Acting styles** (\`style\`): ${vt(s.actingStyles)}.`,
    "",
    "### Beat scripts",
    "",
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${vt(s.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
    "",
    "`characterScript(target, who, beats, options)` compiles the same beats for a v2 `character()` on a `characterTarget` (every option but `height`; the same result, its key poses on the human body; the walk phase keyed to that character's stride, and `walk` / `walking` / `gait` tracks that step the gait as the target draws). Add `hairFollowTracks(target, tracks, who)` after it so hanging hair swings.",
    "",
    "| `do` | Needs | What happens |",
    "|---|---|---|",
    ...Object.entries(s.actions).map(([i, r]) => `| \`${i}\` | ${(r.needs ?? []).map((a) => `\`${a}\``).join(", ")} | ${r.summary} |`),
    "",
    "Beats that touch something report `contact` (and `release`) times in `result.beats[i]`; key the thing they touch to those.",
    "",
    `**Dances** (\`dancer(style, { move })\`): ${Object.entries(s.dances).map(([i, r]) => `\`${i}\` (${r.join(", ")})`).join("; ")}.`,
    "",
    `**Flips**: ${Object.entries(s.flips).map(([i, r]) => `\`${i}\` (${r})`).join(", ")}.`,
    "",
    `**Hand shapes**: ${vt(s.handShapes)}. **Mudras**: ${vt(s.mudras)}.`,
    "",
    "### Your own actions, gaits and personas",
    "",
    "Nothing is registered globally: pass your definitions where they are used.",
    "",
    ...Object.entries(n.custom.api).map(([i, r]) => `- \`${i}\`: ${r}`),
    "",
    ...Object.keys(n.custom.actions).length || Object.keys(n.custom.gaits).length ? [
      "**This cast’s own:**",
      "",
      ...Object.entries(n.custom.actions).map(([i, r]) => `- \`${i}\`${r.needs?.length ? ` (needs ${r.needs.map((a) => `\`${a}\``).join(", ")})` : ""}: ${r.summary}`),
      ...Object.entries(n.custom.gaits).map(([i, r]) => `- \`${i}\` (gait): ${r}`),
      ""
    ] : [],
    "## Props (everyday objects with behaviours)",
    "",
    "A prop is a 3D rig of simple parts drawn with the characters’ pens (clean, pencil, silhouette), so it turns toward the camera (`turn`), and its beats go through the same acting pass (anticipation, overshoot, overlap; `exaggeration` scales them).",
    "",
    ...Object.entries(n.props.api).map(([i, r]) => `- \`${i}\`: ${r}`),
    "",
    `Prop beat fields: ${vt(n.props.beatFields)}. Every prop has the controls ${Object.keys(n.props.commonControls).map((i) => `\`${i}\``).join(", ")} and the actions ${Object.keys(n.props.commonActions).map((i) => `\`${i}\``).join(", ")}.`,
    "",
    "Scenery: `scenery({ x, y, width, height, kind: sky | room, hour, clouds, wind, rain, snow, horizon: hills | city | flat })` is a canvas target whose values `hour` (0–24), `clouds`, `rain`, `snow` (0–1) and `wind` (−1..1) are tracks (`set(prop, { at, value, duration })`, `tracks(id)`; `anchor('sun' | 'moon' | 'horizon' | 'ground', time)`); the same `wind` streams hair (`hairFollowTracks(…, { wind })`). `scenePreset('park' | 'street' | 'office' | 'home', { width, height })` lays out scenery and props as data; `buildScene` builds them into targets.",
    "",
    "| Preset | Family | Actions (needs) | Controls | Anchors |",
    "|---|---|---|---|---|",
    ...Object.entries(n.props.presets).map(
      ([i, r]) => `| \`${i}()\` | ${r.family} | ${Object.entries(r.actions).map(([a, l]) => `\`${a}\`${l.needs?.length ? ` (${l.needs.join(", ")})` : ""}`).join(", ")} | ${r.controls.map((a) => `\`${a}\``).join(", ")} | ${r.anchors.join(", ")} |`
    ),
    "",
    "## Character (v2 human)",
    "",
    `Poses: ${vt(n.character.poses)}. Expressions: ${vt(n.character.expressions)}. Gags: ${vt(n.character.gags)}.`,
    "",
    "Appearance options of `character({ … })`, all plain data that turns with the head (see docs/character-appearance.md):",
    "",
    `- \`build\`: ${vt(n.character.builds)}`,
    `- \`hair\`: ${vt(n.character.hair)} (colours: ${vt(Object.keys(n.character.hairColors))} in \`HAIR_COLORS\`)`,
    `- \`facialHair\`: ${vt(n.character.facialHair)}`,
    `- \`glasses\`: ${vt(n.character.glasses)}; \`hat\`: ${vt(n.character.hats)}; \`ears: true\`; \`face: { teeth, tongue }\` (shown when the mouth opens); \`feet\`: ${vt(n.character.feet)}`,
    "- `outfit`: `{ shirt, trousers, sleeves: short | long | none, bottom: trousers | shorts | skirt, collar, tie: colour, over: apron | labCoat | hoodie | cardigan | overalls | sari, overColor, shoes: boots, shoeColor }`",
    `- \`castMember(name, height)\`: ${vt(n.character.cast)}`,
    "- Face marks (pose fields, 0–1): `blush`, `tears`, `sweat`",
    "- Hair in motion (pose fields): `hair.swing` (degrees round the head, + toward its left), `hair.trail` (head radii back), `hair.lift` (head radii up); key them with `hairFollowTracks(target, tracks, who)` after the character's tracks, or `hairFollow` + `hairMotionAt` when posing per frame",
    `- \`holding\`: ${Object.entries(n.character.heldItems).map(([i, r]) => `\`${i}\` (${r === "both" ? "both" : r === "either" ? "one hand or both" : "left or right"})`).join(", ")}; pose fields \`held.left\`, \`held.right\`, \`held.both\` (below 0.5 lets go); \`handGrip(joints, side)\``,
    `- \`meetHands(kind, a, b)\` (stand them \`meetingSpacing(kind, a, b)\` apart): ${vt(n.character.handMeetings)}; \`embrace(a, b)\` (a hug, \`embraceSpacing\` apart); \`helpUp(helper, sitter, progress)\` (0 on the floor, hand taken; 1 standing; \`helpUpSpacing\` apart)`,
    "- Everyday cycles like a gait: `humanCyclePose('sweeping' | 'brushing', phase, base)` (0 → 1 is one stroke and back; sweeping with `holding: { right: 'broom' }`)",
    "",
    "## Code panel",
    "",
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${vt(n.codePanel.languages)}. Remove styles: ${vt(n.codePanel.removeStyles)}.`,
    "",
    ...Object.entries(n.codePanel.anchors).map(([i, r]) => `- \`${i}\`: ${r}`),
    "",
    ...Object.values(n.codePanel.edits).map((i) => `- \`${i.split(":")[0]}\`:${i.split(":").slice(1).join(":")}`),
    "",
    "## Surfaces",
    "",
    "Scene objects figures act on. Places are named `kind:args`: `surface.anchor(name)` gives the box there (stand on `top`, point at `x`, `y`; pass it as a beat `target`), `surface.piece(name)` makes the part there come loose, and `surface.edit(name, anchor, options)` changes the surface at a time (`at`, ms).",
    "",
    "Beats name places and say what surfaces do in answer (`surfaceScript`):",
    "",
    ...Object.entries(n.surfaceScript).map(([i, r]) => `- \`${i}\`: ${r}`),
    "",
    ...Object.entries(n.surfaces).flatMap(([i, r]) => [
      `### ${i}`,
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
    ...Object.entries(n.cameraShots).map(([i, r]) => `- **${i}**: \`${r}\``),
    "",
    "## Teaching (`@algorisys/tinyfly/teach`)",
    "",
    ...Object.entries(n.teach).map(([i, r]) => `- \`${i}\`: ${r}`),
    "",
    "## Command line",
    "",
    ...Object.entries(n.cli).map(([i, r]) => `- \`${i}\`: ${r}`),
    ""
  ].join(`
`);
}
function HM(t, e, n, s = {}) {
  const o = s.color ?? "#555", i = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = oe(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? Sw(t, { x: r.x, y: r.y }, a, { size: i, color: o, seed: l }) : r.kind === "exhaust" ? c5(t, r, a, i, o, l) : r.kind === "skid" ? h5(t, r, a, n, o) : r.kind === "honk" ? d5(t, r, a, i, o) : r.kind === "smoke" ? a5(t, r, n, i, o) : r.kind === "leaves" && l5(t, r, a, i, s.leafColor ?? "#5cae5a", o, l);
  }
}
function a5(t, e, n, s, o, i) {
  const r = e.direction ?? 1, a = 380, l = 1500;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let c = e.time; c <= e.time + e.length - l; c += a) {
    const h = (n - c) / l;
    if (h <= 0 || h >= 1) continue;
    const d = Math.sin(c / 97 + h * 4) * s * 0.06, u = e.x + r * h * s * 0.7 + d, f = e.y - h * s * 1.6;
    t.globalAlpha = Math.min(1, h * 6) * (1 - h) * 0.85, t.beginPath(), t.arc(u, f, s * (0.07 + h * 0.2), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function l5(t, e, n, s, o, i, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = i, t.fillStyle = o;
  for (let c = 0; c < 4; c++) {
    const h = oe(`${r}:${c}`) % 1e3 / 1e3, d = Math.min(1, n * (1.1 + h * 0.4)), u = e.x + (h - 0.5) * s * 1.2, f = e.y + (h - 0.3) * s * 0.4, g = d * d * 0.4 + d * 0.6, p = u + a * d * s * (0.6 + h) + Math.sin(d * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, f + (l - f) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(d * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function c5(t, e, n, s, o, i) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (oe(`${i}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, d = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, d, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function h5(t, e, n, s, o) {
  const i = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (i - e.x) * r;
  t.save(), t.strokeStyle = o, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function d5(t, e, n, s, o) {
  const i = e.direction ?? 1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + i * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, i > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, i > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function CM(t) {
  const e = new Ct({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], o = [], i = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const d = ua(t.prop, { state: e.getStateAtTime(h) }, t.propId), u = d.anchor(t.anchor);
    s.push({ time: h, value: u.x + (t.offset?.x ?? 0) - t.figure.x }), o.push({ time: h, value: u.y + (t.offset?.y ?? 0) - t.figure.y });
    const f = Math.sin(d.values.turn * Math.PI / 2);
    if (Math.abs(f) > 0.15 && (a = f > 0 ? 1 : -1), i.push({ time: h, value: Math.abs(f) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: o }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: i }, { id: `${l}-facing`, target: l, property: "facing", keyframes: u5(r) }), c;
}
function u5(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function RM(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, o = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = o.get(s(r));
    if (!a) return r;
    o.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, d) => h.time - d.time);
    return { ...r, keyframes: c };
  }), ...o.values()];
}
function LM(t) {
  const e = new Ct({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((f) => f.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, o = s.x + s.width / 2, i = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = i.wheelSpin ?? 0, d;
  for (let f = t.start; ; f = Math.min(t.end, f + n)) {
    const g = ua(t.leader, { state: e.getStateAtTime(f) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, b = ms(s.prop, { ...i, turn: m }, s.propScale).anchors[t.anchor];
    if (!b) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const M = p.x - b.point.x;
    if (d !== void 0 && r) {
      const w = Math.sin(m * Math.PI / 2);
      h += (M - d) * (w || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (d = M, a.push({ time: f, value: M - o }), l.push({ time: f, value: m }), c.push({ time: f, value: h }), f >= t.end) break;
  }
  const u = t.towedId;
  return [
    { id: `${u}-x`, target: u, property: "x", keyframes: a },
    { id: `${u}-turn`, target: u, property: "turn", keyframes: l },
    ...r ? [{ id: `${u}-wheelSpin`, target: u, property: "wheelSpin", keyframes: c }] : []
  ];
}
const Kc = /* @__PURE__ */ new WeakMap();
function f5(t, e) {
  const n = e?.some(Boolean) ? e.map((u) => u ? 1 : 0).join("") : "";
  let s = Kc.get(t);
  s || Kc.set(t, s = /* @__PURE__ */ new Map());
  const o = s.get(n);
  if (o) return o;
  const i = mo(t), r = { vertices: i.vertices, faces: i.faces.filter((u, f) => !e?.[f]) }, a = r.vertices.flatMap((u) => [u[0], u[1], u[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((u) => {
    for (const p of u.corners) for (const m of [0, 1, 2]) l[p][m] += u.normal[m];
    const [f, ...g] = u.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, b, M] = [f, g[p], g[p + 1]], [w, y, S] = [r.vertices[m], r.vertices[b], r.vertices[M]], E = [y[0] - w[0], y[1] - w[1], y[2] - w[2]], A = [S[0] - w[0], S[1] - w[1], S[2] - w[2]], v = [E[1] * A[2] - E[2] * A[1], E[2] * A[0] - E[0] * A[2], E[0] * A[1] - E[1] * A[0]], k = v[0] * u.normal[0] + v[1] * u.normal[1] + v[2] * u.normal[2];
      c.push(...k >= 0 ? [m, b, M] : [m, M, b]);
    }
  });
  const h = l.flatMap((u) => {
    const f = Math.hypot(...u) || 1;
    return [u[0] / f, u[1] / f, u[2] / f];
  }), d = ao({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, d), d;
}
function p5(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", o = (n.outline ?? 2) * (t.outline ?? 1), i = t.glow && e.glow > 0 ? g5(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: mo(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...o > 0 ? { outline: { width: o, color: s } } : {},
    ...i ? { emissive: i } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function g5(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((o) => Math.round(parseInt(n[1].slice(o, o + 2), 16) * Math.max(0, Math.min(1, e)))).map((o) => o.toString(16).padStart(2, "0")).join("")}` : t;
}
const m5 = ao(g0(1, 2e-3, 28));
function y5(t, e, n) {
  const s = t.rig, [o, i] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, St(s, e, "lift")), a = Math.max(0, St(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: m5,
    world: At(n, Mr([0, 4e-3, 0], [0, 0, 0, 1], [o * 0.55 * a || 1e-4, 1, i * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const b5 = /* @__PURE__ */ new Set([
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
]), w5 = 1, WM = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in cs ? [] : [ut("prop preset", e.prop, Object.keys(cs))];
    for (const [s, o] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      o in e && n.push(`${o} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((i) => i === s ? e[o] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return Ld(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [A, v] of n)
      typeof v == "number" && !b5.has(A) && (h[A] = v);
    h.turn = 0, h.tilt = 0;
    const d = At(o.view, s), u = {
      toView: (A) => qt(d, A),
      toScreen: (A) => a(A)
    }, f = u.toView([0, c.rig.height / 2, 0]);
    if (-f[2] <= o.near) return null;
    if (l.look === "mesh") {
      const A = D2(c.rig, h), v = A.map(({ part: P, local: I }) => ({ part: P.id, mesh: mo(P.shape), ...ha(mo(P.shape), I) })), k = Td(v), x = A.map((P, I) => ({ ...P, hidden: Ed(P.part.id, v[I].mesh, P.local, v[I].key, k) })).filter(({ opacity: P }) => P > 0.01).map(({ part: P, matrix: I, glow: O, opacity: _, hidden: W }) => ({
        mesh: f5(P.shape, W),
        world: At(s, I),
        material: p5(P, { glow: O, opacity: _ }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? x : [y5(c, h, s), ...x] };
    }
    const g = a(f), p = a(u.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), b = i.length === 0 ? void 0 : (A, v) => {
      const k = qt(s, A), x = [s[0] * v[0] + s[4] * v[1] + s[8] * v[2], s[1] * v[0] + s[5] * v[1] + s[9] * v[2], s[2] * v[0] + s[6] * v[1] + s[10] * v[2]], P = Math.hypot(...x) || 1;
      return { light: X0(k, [x[0] / P, x[1] / P, x[2] / P], i), fog: U0(r, Math.hypot(k[0] - o.position[0], k[1] - o.position[1], k[2] - o.position[2])) };
    }, M = Ad(c.rig, h, u, m, { perspective: !0, near: o.near, slice: w5, light: b }), w = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, y = V0(M), S = M.cells ?? [], E = Math.max(...S.map((A) => -A.depth), -f[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: E + c.rig.length, draw: (A) => J0(A, M, w) }],
        ...S.map((A) => ({
          depth: -A.depth,
          draw(v, k) {
            v.lineCap = "round", v.lineJoin = "round", Jy(v, A.parts, y, { ...w, time: k.time });
          }
        }))
      ]
    };
  }
}, jc = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], k5 = 0.25, v5 = 800 / 180, M5 = 220, x5 = 300, S5 = ["turn"];
function T5(t) {
  const e = pa(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !S5.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function E5(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = T5(e), o = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], i = [];
  return t.forEach((r, a) => {
    const l = (d) => i.push({ beat: a, message: d });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${o[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const d of Object.keys(c)) jc.includes(d) || l(ut("beat field", d, jc, h[d]));
    if (typeof c.do != "string" || !o.includes(c.do)) {
      const d = c.do === "turn" ? "face" : void 0;
      return l(ut(`${e.kind} 3D beat`, c.do, o, d));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !Fe(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(Fe)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(Fe(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), i;
}
function FM(t, e, n, s) {
  const o = E5(n, e);
  if (o.length > 0) throw new Error(`propScript3D (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((w) => `  beat ${w.beat}: ${w.message}`).join(`
`)}`);
  const i = {};
  for (const w of [...Object.keys(gs), ...Object.keys(e.rig.controls)]) i[w] = s.values?.[w] ?? St(e.rig, {}, w);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (w, y, S, E = "linear") => {
    const A = c.get(w) ?? [];
    A.push({ time: y, value: S, easing: E }), c.set(w, A);
  }, d = (w, y, S) => h(w, y, S);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const u = (w, y) => {
    const S = ho(l, y);
    if (Math.abs(S) < 1) return w;
    const E = Math.max(M5, Math.abs(S) * v5);
    return d("rotateY", w, l), l += S, h("rotateY", w + E, l, "ease-in-out"), w + E;
  }, f = (w, y, S) => {
    const E = sd([[r, a], ...y.through ?? [y.to]]);
    if (E.length < 2) return S;
    const A = u(S, bn(E[0].point, E[1].point)), v = E[E.length - 1].at, k = y.for ?? v / (y.speed ?? w.speed) * 1e3, x = Rt("ease-in-out"), P = Math.min(x5, k / 4);
    for (const [j, V] of Object.entries(w.set ?? {}))
      d(j, A, i[j]), h(j, A + 1, V), i[j] = V;
    const I = w.flies ? y.height ?? (i.lift > 0.05 ? i.lift : 2) : void 0, O = I !== void 0 && I > 0.05;
    for (const [j, V] of Object.entries(w.hold ?? {}))
      d(j, A, i[j]), h(j, A + P, V, "ease-out"), O || (h(j, A + k - P, V), h(j, A + k, 0, "ease-in")), i[j] = O ? V : 0;
    I !== void 0 && (d("lift", A, i.lift), h("lift", A + Math.min(k * 0.35, 1400), I, "ease-out"), h("lift", A + k, I), i.lift = I);
    const _ = { ...i };
    let W = l;
    for (let j = 0; ; j = Math.min(v, j + k5)) {
      const V = A + id(x, j / v) * k, { point: K, direction: T } = od(E, j);
      W += ho(W, bn([0, 0], T)), h("x", V, K[0]), h("z", V, K[1]), h("rotateY", V, W);
      for (const [C, L] of Object.entries(w.perMetre ?? {})) h(C, V, _[C] + j * L);
      for (const [C, L] of Object.entries(w.perSecond ?? {})) h(C, V, _[C] + (V - A) / 1e3 * L);
      if (j >= v) break;
    }
    for (const [j, V] of Object.entries(w.perMetre ?? {})) i[j] = _[j] + v * V;
    for (const [j, V] of Object.entries(w.perSecond ?? {})) i[j] = _[j] + k / 1e3 * V;
    return [r, a] = E[E.length - 1].point, l = W, A + k;
  }, g = (w, y) => {
    const S = Object.fromEntries(Object.entries(w).filter(([A]) => !["at", "to", "through", "toward"].includes(A))), E = Qk(t, e, [S], { start: { ...i, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const A of E.tracks) {
      if (A5.includes(A.property)) continue;
      const v = A.keyframes ?? [], k = i[A.property];
      if (!v.every((x) => x.value === k)) {
        d(A.property, y, k);
        for (const x of v) x.time > 0 && c.get(A.property).push({ ...x, time: y + x.time });
        i[A.property] = v[v.length - 1].value;
      }
    }
    return y + E.duration;
  }, p = [];
  let m = 0;
  for (const w of n) {
    const y = w.at ?? m;
    let S = y;
    const E = e.moves?.[w.do];
    E ? S = f(E, w, y) : w.do === "face" ? S = u(y, typeof w.toward == "number" ? w.toward : bn([r, a], w.toward)) : w.do === "hold" ? S = y + (w.for ?? 1e3) : S = g(w, y), p.push({ do: w.do, start: y, end: S }), m = S;
  }
  const b = `${s.scene}/${t}`;
  return { tracks: [...c].map(([w, y]) => ({
    id: `${t}-${w}`,
    target: b,
    property: w,
    keyframes: nd(y)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...i } } };
}
const A5 = ["x", "y", "turn", "facing", "tilt"], $5 = 0.35, Fd = {
  seated: ce.sit,
  astride: { ...ce.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 },
  driving: { ...ce.sit, "arm.left.swing": 52, "arm.right.swing": 52, "arm.left.spread": 8, "arm.right.spread": 8, "arm.left.elbow": 38, "arm.right.elbow": 38, lean: 4 },
  wheeling: { ...ce.sit, "arm.left.swing": -6, "arm.right.swing": -6, "arm.left.spread": 16, "arm.right.spread": 16, "arm.left.elbow": 28, "arm.right.elbow": 28, "leg.left.knee": 80, "leg.right.knee": 80 },
  cycling: { ...ce.sit, lean: 22, bend: 10, "head.nod": -14, "arm.left.swing": 58, "arm.right.swing": 58, "arm.left.spread": 10, "arm.right.spread": 10, "arm.left.elbow": 22, "arm.right.elbow": 22, "leg.left.spread": 6, "leg.right.spread": 6 }
}, P5 = 22, Xc = 38;
function Uc(t, e = Fd.cycling) {
  const n = t * Math.PI * 2, s = (r) => ({
    swing: (e["leg.left.swing"] ?? 40) + P5 * Math.cos(n + r),
    // The knee straightens as the foot pushes down and over the bottom of the stroke.
    knee: (e["leg.left.knee"] ?? 70) + Xc * (0.5 + 0.5 * Math.cos(n + r)) - Xc * 0.5,
    ankle: 12 * Math.sin(n + r)
  }), o = s(0), i = s(Math.PI);
  return {
    ...e,
    "leg.left.swing": o.swing,
    "leg.left.knee": o.knee,
    "leg.left.ankle": o.ankle,
    "leg.right.swing": i.swing,
    "leg.right.knee": i.knee,
    "leg.right.ankle": i.ankle
  };
}
function NM(t) {
  const e = t.cadence ?? 1.2, n = Math.max(2, t.samplesPerTurn ?? 8), s = 1e3 / e / n, o = [];
  for (let i = t.start, r = 0; i < t.end; i += s, r++)
    o.push({ time: Math.round(i), pose: Uc((i - t.start) / 1e3 * e, t.base), ...r > 0 ? { act: !1 } : {} });
  return o.push({ time: t.end, pose: Uc((t.end - t.start) / 1e3 * e, t.base), act: !1 }), o;
}
const Gc = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function DM(t) {
  const e = `${t.scene}/${t.propId}`, n = new Ct({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [o, i, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = B0({ ...t.character, height: 1 }), c = { ...pt, ...t.pose ?? Fd.seated }, h = Dr(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, d = t.facing ?? 0, u = t.every ?? 33, f = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + u)) {
    const b = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), M = (_, W) => {
      const B = b.get(_);
      return typeof B == "number" ? B : W;
    }, w = { ...s.values };
    for (const _ of Object.keys(a.controls)) w[_] = M(_, s.values?.[_] ?? St(a, {}, _));
    for (const _ of ["pitch", "roll", "squash", "lift", "lean", "size"]) w[_] = M(_, s.values?.[_] ?? St(a, {}, _));
    const y = B2(a, w)[t.anchor];
    if (!y) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const S = M("rotateY", s.heading ?? 0), E = Gc(y, S), A = [M("x", o) + E[0], M("y", i) + E[1], M("z", r) + E[2]], v = S + d, k = Gc(h, v);
    let x = [A[0] - k[0], A[1] - k[1], A[2] - k[2]];
    const P = (_, W) => {
      const B = W * W * (3 - 2 * W);
      return [_[0] + (x[0] - _[0]) * B, x[1] * B + $5 * Math.sin(Math.PI * W), _[1] + (x[2] - _[1]) * B];
    }, I = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, O = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + I ? x = P(t.mount.from, (m - t.start) / I) : t.dismount && m > t.end - O && (x = P(t.dismount.to, (t.end - m) / O)), f.x.push({ time: m, value: x[0] }), f.y.push({ time: m, value: x[1] }), f.z.push({ time: m, value: x[2] }), f.rotateY.push({ time: m, value: v }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(f).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: f[m] }));
}
const I5 = {
  ground: "#7fb56a",
  hills: "#5f9a58",
  city: "#4b5468",
  cloud: "#ffffff",
  sun: "#ffd45c",
  moon: "#f3f0e0",
  rain: "#9fc4e8",
  snow: "#ffffff",
  wall: "#e9e1cf",
  floor: "#b08a5e",
  skirting: "#8a6a44",
  frame: "#f7f3ea"
}, Nn = [
  [0, "#0b1530", "#1b2a4a"],
  [4.5, "#141a3e", "#2a2f5a"],
  [6, "#4a3f7a", "#f0a070"],
  [7.5, "#86c2ee", "#d8ecf8"],
  [12, "#5aaef2", "#c0e2f8"],
  [16.5, "#69b0e6", "#f5d79a"],
  [18.5, "#4c3f78", "#f08a5a"],
  [20.5, "#17203f", "#2d3660"],
  [24, "#0b1530", "#1b2a4a"]
], Zn = (t, e, n) => {
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16)), [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}, O5 = (t) => {
  const e = (t % 24 + 24) % 24;
  return e < 5 || e > 20 ? 0 : e < 7 ? (e - 5) / 2 : e > 18 ? (20 - e) / 2 : 1;
};
function _5(t) {
  const e = (t % 24 + 24) % 24;
  for (let n = 1; n < Nn.length; n++) {
    const [s, o, i] = Nn[n - 1], [r, a, l] = Nn[n];
    if (e <= r) {
      const c = (e - s) / (r - s);
      return { top: Zn(o, a, c), bottom: Zn(i, l, c) };
    }
  }
  return { top: Nn[0][1], bottom: Nn[0][2] };
}
const H5 = (t, e) => {
  const n = ((t - e) % 24 + 24) % 24;
  return n <= 12 ? n / 12 : -1;
}, C5 = 9, R5 = 55, L5 = 28;
function W5(t) {
  const { x: e, y: n, width: s, height: o } = t, i = t.kind ?? "sky", r = t.ground ?? n + o * 0.85, a = { ...I5, ...t.colors }, l = t.horizon ?? "hills", c = t.window !== !1, h = Ve(t.seed ?? 1), d = s * o / 1e5, u = Array.from({ length: Math.ceil(C5 * d) + 2 }, () => ({ u: h.next(), v: h.next(), size: 0.6 + h.next() * 0.8, puffs: 2 + Math.floor(h.next() * 3) })), f = Array.from({ length: Math.ceil(R5 * d) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.8 + h.next() * 0.5 })), g = Array.from({ length: Math.ceil(L5 * d) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.7 + h.next() * 0.6, sway: h.next() * Math.PI * 2, size: 1.5 + h.next() * 2 })), p = Array.from({ length: Math.ceil(30 * d) + 10 }, () => ({ u: h.next(), v: h.next() * 0.6, size: 0.6 + h.next() * 1.2 })), m = Array.from({ length: 6 }, () => ({ phase: h.next() * Math.PI * 2, amp: 0.5 + h.next() })), b = Array.from({ length: 24 }, () => ({ h: 0.35 + h.next() * 0.65, w: 0.6 + h.next() * 0.8, windows: h.next() > 0.3 })), M = {
    hour: t.hour ?? 12,
    clouds: t.clouds ?? 0.3,
    wind: t.wind ?? 0,
    rain: t.rain ?? 0,
    snow: t.snow ?? 0
  }, w = ps(), y = (x, P) => w.keys(x)?.length ? w.valueAt(x, P) : M[x], S = (x, P) => {
    const I = H5(x, P), O = I < 0 ? 0.5 : I, _ = r - n;
    return { x: 0.1 * s + 0.8 * s * O, y: I < 0 ? _ + o * 0.2 : _ - Math.sin(O * Math.PI) * _ * 0.8, up: I >= 0 };
  }, E = (x, P, I, O, _) => {
    const W = P("hour"), { top: B, bottom: j } = _5(W), V = x.createLinearGradient(0, O.y, 0, O.ground);
    V.addColorStop(0, B), V.addColorStop(1, j), x.fillStyle = V, x.fillRect(O.x, O.y, O.w, O.ground - O.y);
    const K = O5(W);
    if (K < 0.6) {
      x.fillStyle = "#ffffff", x.globalAlpha = (0.6 - K) / 0.6 * 0.9;
      for (const D of p)
        x.beginPath(), x.arc(O.x + D.u * O.w, O.y + D.v * (O.ground - O.y), D.size, 0, Math.PI * 2), x.fill();
      x.globalAlpha = 1;
    }
    const T = S(W, 6), C = S(W, 18), L = Math.min(O.w, O.h) * 0.06;
    if (T.up && (x.fillStyle = a.sun, x.beginPath(), x.arc(O.x + T.x / s * O.w, O.y + T.y / o * O.h, L, 0, Math.PI * 2), x.fill()), C.up) {
      const D = O.x + C.x / s * O.w, z = O.y + C.y / o * O.h;
      x.fillStyle = a.moon, x.beginPath(), x.arc(D, z, L * 0.8, 0, Math.PI * 2), x.fill(), x.fillStyle = B, x.beginPath(), x.arc(D - L * 0.35, z - L * 0.15, L * 0.7, 0, Math.PI * 2), x.fill();
    }
    const $ = Math.max(0, Math.min(1, P("clouds"))), R = Math.max(-1, Math.min(1, P("wind"))), N = Math.round($ * u.length);
    x.fillStyle = Zn("#ffffff", a.cloud === "#ffffff" ? "#ffffff" : a.cloud, 1), x.globalAlpha = 0.55 + 0.4 * K;
    for (let D = 0; D < N; D++) {
      const z = u[D], G = ((z.u * O.w + R * I * 0.012 * (0.6 + z.size * 0.5)) % (O.w * 1.4) + O.w * 1.4) % (O.w * 1.4) - O.w * 0.2, F = O.x + G, U = O.y + (0.08 + z.v * 0.42) * (O.ground - O.y), Y = Math.min(O.w, O.h) * 0.07 * z.size;
      for (let nt = 0; nt < z.puffs; nt++)
        x.beginPath(), x.ellipse(F + (nt - (z.puffs - 1) / 2) * Y * 0.9, U + nt % 2 * Y * 0.25, Y * (nt % 2 ? 0.8 : 1), Y * 0.62, 0, 0, Math.PI * 2), x.fill();
    }
    x.globalAlpha = 1;
    const q = (D) => Zn(Zn(D, "#0b1530", 0.65), D, K);
    if (l === "hills") {
      x.fillStyle = q(a.hills), x.beginPath(), x.moveTo(O.x, O.ground);
      const D = 40;
      for (let z = 0; z <= D; z++) {
        const G = z / D;
        let F = 0;
        m.forEach((U, Y) => F += Math.sin(G * Math.PI * (1.5 + Y * 0.7) + U.phase) * U.amp), x.lineTo(O.x + G * O.w, O.ground - Math.max(0, F) * O.h * 0.045 - O.h * 0.03);
      }
      x.lineTo(O.x + O.w, O.ground), x.closePath(), x.fill();
    } else if (l === "city") {
      x.fillStyle = q(a.city);
      let D = O.x;
      const z = O.w / 18;
      for (const G of b) {
        if (D > O.x + O.w) break;
        const F = z * G.w, U = O.h * 0.22 * G.h;
        if (x.fillRect(D, O.ground - U, F, U), G.windows && K < 0.5) {
          x.fillStyle = "#ffd66b", x.globalAlpha = 0.5 - K;
          for (let Y = O.ground - U + 6; Y < O.ground - 8; Y += 9) for (let nt = D + 4; nt < D + F - 4; nt += 8) x.fillRect(nt, Y, 3, 4);
          x.globalAlpha = 1, x.fillStyle = q(a.city);
        }
        D += F + z * 0.15;
      }
    }
    x.fillStyle = q(a.ground), x.fillRect(O.x, O.ground, O.w, O.y + O.h - O.ground);
  }, A = (x, P, I, O) => {
    const _ = Math.max(-1, Math.min(1, P("wind"))), W = Math.max(0, Math.min(1, P("rain"))), B = Math.max(0, Math.min(1, P("snow")));
    if (W > 0) {
      x.strokeStyle = a.rain, x.globalAlpha = 0.35 + 0.45 * W, x.lineWidth = 1.2, x.lineCap = "round";
      const j = O.h * 0.05, V = _ * 0.45, K = Math.round(W * f.length);
      x.beginPath();
      for (let T = 0; T < K; T++) {
        const C = f[T], L = ((C.v * O.h + I * C.speed * 0.9) % O.h + O.h) % O.h, $ = ((C.u * O.w + L * V) % O.w + O.w) % O.w;
        x.moveTo(O.x + $, O.y + L), x.lineTo(O.x + $ + V * j, O.y + L + j);
      }
      x.stroke(), x.globalAlpha = 1;
    }
    if (B > 0) {
      x.fillStyle = a.snow, x.globalAlpha = 0.85;
      const j = Math.round(B * g.length);
      for (let V = 0; V < j; V++) {
        const K = g[V], T = ((K.v * O.h + I * K.speed * 0.08) % O.h + O.h) % O.h, C = Math.sin(I * 2e-3 + K.sway) * O.w * 0.02, L = ((K.u * O.w + C + _ * T * 0.3) % O.w + O.w) % O.w;
        x.beginPath(), x.arc(O.x + L, O.y + T, K.size, 0, Math.PI * 2), x.fill();
      }
      x.globalAlpha = 1;
    }
  }, k = {
    kind: "scenery",
    target: {
      type: "custom",
      x: e,
      y: n,
      width: s,
      height: o,
      props: M,
      about: {
        kind: i === "room" ? "room" : "sky",
        summary: i === "room" ? "A room: a wall, a floor and a window on the sky. Its values are tracks: hour, clouds, wind, rain, snow (seen through the window)." : `A sky over ${l === "flat" ? "the ground" : l}: the sun and moon on their arcs, stars, clouds on the wind, rain and snow. Its values are tracks: hour (0–24), clouds, wind (−1..1), rain, snow (0..1).`,
        props: Object.fromEntries(Object.keys(M).map((x) => [x, F5(x)]))
      },
      draw(x, P, I) {
        const O = P.props ?? {}, _ = (B) => Number(O[B] ?? M[B] ?? 0);
        x.save();
        const W = { x: 0, y: 0, w: s, h: o, ground: r - n };
        if (i === "sky")
          E(x, _, I, W), A(x, _, I, W);
        else if (x.fillStyle = a.wall, x.fillRect(0, 0, s, W.ground), x.fillStyle = a.floor, x.fillRect(0, W.ground, s, o - W.ground), x.fillStyle = a.skirting, x.fillRect(0, W.ground - o * 0.012, s, o * 0.012), c) {
          const B = s * 0.26, j = W.ground * 0.5, V = s * 0.62, K = W.ground * 0.14;
          x.fillStyle = a.frame, x.fillRect(V - 6, K - 6, B + 12, j + 12), x.save(), x.beginPath(), x.rect(V, K, B, j), x.clip(), E(x, _, I, { x: V, y: K, w: B, h: j, ground: K + j * 0.8 }), A(x, _, I, { x: V, y: K, w: B, h: j }), x.restore(), x.strokeStyle = a.frame, x.lineWidth = 4, x.beginPath(), x.moveTo(V + B / 2, K), x.lineTo(V + B / 2, K + j), x.moveTo(V, K + j / 2), x.lineTo(V + B, K + j / 2), x.stroke();
        }
        x.restore();
      }
    },
    ground: r,
    anchor(x, P = 1 / 0) {
      const I = y("hour", P);
      if (x === "sun" || x === "moon") {
        const O = S(I, x === "sun" ? 6 : 18);
        return { x: e + O.x, y: n + O.y };
      }
      if (x === "horizon") return { x: e + s / 2, y: r - o * 0.03 };
      if (x === "ground") return { x: e + s / 2, y: r };
      throw new Error(`scenery: ${ut("place", x, ["sun", "moon", "horizon", "ground"])}`);
    },
    set(x, P) {
      if (!(x in M)) throw new Error(`scenery: ${ut("value", x, Object.keys(M))}`);
      if (typeof P.value != "number" || !Number.isFinite(P.value)) throw new Error("scenery.set needs `value`, a number");
      return w.tween(x, y(x, P.at), P.value, P, 1e3), k;
    },
    tracks: w.tracks
  };
  return k;
}
function F5(t) {
  switch (t) {
    case "hour":
      return { description: "The time of day, 0–24: the sky’s colours, the sun and the moon on their arcs, stars at night", unit: "hours", min: 0, max: 24 };
    case "clouds":
      return { description: "Cloud cover", unit: "0..1", min: 0, max: 1 };
    case "wind":
      return { description: "The wind, blowing left (−) or right (+): clouds drift, rain slants, snow drifts", unit: "-1..1", min: -1, max: 1 };
    case "rain":
      return { description: "How hard it rains", unit: "0..1", min: 0, max: 1 };
    default:
      return { description: "How hard it snows", unit: "0..1", min: 0, max: 1 };
  }
}
function N5(t, e) {
  const { width: n, height: s } = e, o = e.ground ?? s * 0.85, i = e.scale ?? s / 4.5, r = { x: 0, y: 0, width: n, height: s, ground: o }, a = (l, c, h = {}) => ({ preset: l, x: n * c, scale: i, ...h });
  switch (t) {
    case "park":
      return {
        scenery: { ...r, hour: 10.5, clouds: 0.35, horizon: "hills", ...e.scenery },
        props: [a("tree", 0.14, { scale: i * 1.1 }), a("chair", 0.5, { turn: 0 }), a("tree", 0.86, { scale: i * 0.9 })]
      };
    case "street":
      return {
        scenery: { ...r, hour: 16, clouds: 0.25, horizon: "city", colors: { ground: "#8a8f99" }, ...e.scenery },
        props: [a("house", 0.2, { scale: i * 0.75, turn: 0.1 }), a("car", 0.5, { turn: 1, scale: i * 0.9 }), a("house", 0.78, { scale: i * 0.7, turn: 0.1 }), a("tree", 0.95, { scale: i * 0.8 })]
      };
    case "office":
      return {
        scenery: { ...r, kind: "room", hour: 11, clouds: 0.3, colors: { wall: "#dfe5ec", floor: "#9aa3ad", skirting: "#6c757d" }, ...e.scenery },
        props: [a("door", 0.1, { turn: 0.15 }), a("chair", 0.46, { turn: 0 }), a("desk", 0.58, { turn: 0 })]
      };
    case "home":
      return {
        scenery: { ...r, kind: "room", hour: 20, clouds: 0.2, ...e.scenery },
        props: [a("door", 0.08, { turn: 0.15 }), a("chair", 0.35, { turn: 0.3 }), a("bed", 0.72, { turn: 0.25 })]
      };
    default:
      throw new Error(ut("scene preset", t, ["park", "street", "office", "home"]));
  }
}
function BM(t, e) {
  const n = N5(t, e), s = W5(n.scenery), o = n.props.map((i) => K2({ x: i.x, y: s.ground, prop: Ld(i.preset), scale: i.scale, values: { turn: i.turn ?? 0, ...i.values } }));
  return { scenery: s, props: o, ground: s.ground };
}
function qM(t) {
  const { timeline: e } = t, n = new ze();
  for (const [c, h] of Object.entries(t.targets)) {
    const d = typeof h == "string" ? document.querySelector(h) : h;
    if (!d)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, d);
  }
  e.onUpdate = (c) => {
    n.applyState(c), t.onUpdate?.(c);
  }, t.onComplete && (e.onComplete = t.onComplete);
  let s = null, o = null, i = !1;
  const r = (c) => {
    if (i) return;
    const h = o === null ? 0 : c - o;
    o = c, h > 0 && e.tick(h), s = requestAnimationFrame(r);
  }, a = () => {
    s !== null || i || (o = null, s = requestAnimationFrame(r));
  }, l = () => {
    s !== null && cancelAnimationFrame(s), s = null, o = null;
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
      i = !0, l(), e.stop(), n.clearTargets();
    }
  };
}
const zM = {
  timeline: Yf,
  to(t, e, n) {
    const s = new mn(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new mn(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const o = new mn(s);
    return o.fromTo(t, e, n), o;
  },
  set(t, e, n) {
    const s = new mn(n);
    return s.set(t, e), s;
  }
};
function Nd(t, e, n) {
  if (typeof OffscreenCanvas < "u") return new OffscreenCanvas(e, n);
  const s = t.canvas;
  if (s?.ownerDocument) {
    const o = s.ownerDocument.createElement("canvas");
    return o.width = e, o.height = n, o;
  }
  try {
    return s?.constructor ? new s.constructor(e, n) : null;
  } catch {
    return null;
  }
}
function D5(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), o = Math.min(0.999, Math.max(0, e));
  for (let i = 0; i < n; i++) {
    const r = t[i * 4] / 255, a = t[i * 4 + 1] / 255, l = t[i * 4 + 2] / 255, c = t[i * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= o) continue;
    const d = (h - o) / (1 - o) * c / h;
    s[i * 3] = r * d, s[i * 3 + 1] = a * d, s[i * 3 + 2] = l * d;
  }
  return s;
}
function Vc(t, e, n, s, o) {
  const i = new Float32Array(t.length), r = o ? n : e, a = o ? e : n, l = (h, d) => (o ? h * e + d : d * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let d = 0; d < 3; d++) {
      let u = 0;
      for (let f = -s; f <= s; f++) u += t[l(h, Math.min(a - 1, Math.max(0, f))) + d];
      for (let f = 0; f < a; f++) {
        i[l(h, f) + d] = u / c;
        const g = t[l(h, Math.max(0, f - s)) + d], p = t[l(h, Math.min(a - 1, f + s + 1)) + d];
        u += p - g;
      }
    }
  return i;
}
function Jc(t, e, n, s) {
  const o = Math.max(1, Math.round(s / Math.sqrt(3)));
  let i = t;
  for (let r = 0; r < 3; r++)
    i = Vc(i, e, n, o, !0), i = Vc(i, e, n, o, !1);
  return i;
}
function YM(t, e = {}) {
  const n = t.canvas, s = n.width, o = n.height;
  if (!(s > 0 && o > 0)) return;
  const i = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / i)), a = Math.max(1, Math.ceil(o / i)), l = Nd(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = D5(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), d = (e.radius ?? Math.max(s, o) * 0.02) / i, u = Jc(h, r, a, d), f = Jc(h, r, a, d * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let b = 0; b < 3; b++) p.data[m * 4 + b] = Math.round(Math.min(1, u[m * 3 + b] + f[m * 3 + b] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, o), t.restore();
}
function KM(t, e, n) {
  const s = n.width ?? 6, o = n.taper ?? 1, i = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = q5(e, s, o, i, r);
    a ? (t.globalCompositeOperation = "lighter", pr(t, c, n.color)) : z5(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, B5(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function B5(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const o = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return o ? `rgba(${o[1]}, ${o[2]}, ${o[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function q5(t, e, n, s, o) {
  const i = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = mf(i), a = yf(i) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, d = o * (1 - s * h);
    if (d <= 0) continue;
    const u = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: d, ...u && a && { cap: a } });
  }
  return l;
}
function pr(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [o, i, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(o.x, o.y), t.lineTo(i.x, i.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function z5(t, e, n) {
  const s = typeof t.getTransform == "function" ? t.getTransform() : null, o = (p) => s ? { x: s.a * p.x + s.c * p.y + s.e, y: s.b * p.x + s.d * p.y + s.f } : p, i = s ? Math.sqrt(Math.abs(s.a * s.d - s.b * s.c)) : 1, r = e.map((p) => ({
    ...p,
    corners: p.corners.map(o),
    ...p.cap && { cap: { ...p.cap, ...o(p.cap), radius: p.cap.radius * i, start: p.cap.start + (s ? Math.atan2(s.b, s.a) : 0) } }
  }));
  let a = 1 / 0, l = 1 / 0, c = -1 / 0, h = -1 / 0;
  for (const p of r) {
    const m = p.cap ? [{ x: p.cap.x - p.cap.radius, y: p.cap.y - p.cap.radius }, { x: p.cap.x + p.cap.radius, y: p.cap.y + p.cap.radius }] : [];
    for (const b of [...p.corners, ...m])
      a = Math.min(a, b.x), l = Math.min(l, b.y), c = Math.max(c, b.x), h = Math.max(h, b.y);
  }
  if (!(c > a && h > l)) return;
  const d = Math.floor(a) - 1, u = Math.floor(l) - 1, f = s ? Nd(t, Math.ceil(c) + 1 - d, Math.ceil(h) + 1 - u) : null, g = f?.getContext("2d");
  if (!f || !g) {
    pr(t, e, n);
    return;
  }
  g.translate(-d, -u), g.globalCompositeOperation = "lighter", pr(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(f, d, u), t.restore();
}
const jM = Jt.to, XM = Jt.from, UM = Jt.fromTo, GM = Jt.set, VM = Jt.timeline, JM = Jt.ticker, ZM = Jt.splitText, QM = Jt.context, tx = Jt.matchMedia, ex = Jt.quickTo, nx = Jt.imageSequence, sx = Jt.pageTransition;
_g();
export {
  wn as ACTING_STYLES,
  _d as AIRCRAFT_ACTING,
  ys as ANIMAL_GAITS,
  lr as BEAT_FIELDS,
  Jn as BEAT_MOMENTS,
  yk as BED_ACTING,
  qk as BIRD_ACTING,
  Ul as BOARD_MARKS,
  As as BOARD_THEMES,
  ca as CANVAS_PROPERTIES,
  uk as CHAIR_ACTING,
  Kl as CHARACTER_BEAT_3D_FIELDS,
  ud as CHARACTER_CAST,
  gb as CHARACTER_GAIT_SPEEDS,
  tc as CHART_KINDS,
  pn as CHART_SURFACE,
  $s as CHART_THEMES,
  ir as CODE_LANGUAGES,
  dd as CODE_PANEL_EDITS,
  zs as CODE_SURFACE,
  Pb as CODE_THEME,
  j5 as Clock,
  mn as CompatTimeline,
  eg as CustomBounce,
  tg as CustomEase,
  ng as CustomWiggle,
  Je as DANCE_STYLES,
  hh as DEFAULT_BAKE_INTERVAL_MS,
  ma as DEFAULT_INERTIA_FRICTION,
  pg as DEFAULT_LABELS,
  te as DEFAULT_SPRING,
  Pv as DEFAULT_TRANSITION,
  gk as DESK_ACTING,
  wk as DOOR_ACTING,
  _h as Draggable,
  rr as EMBRACE,
  kt as EXPRESSIONS,
  P0 as FACIAL_HAIR_STYLES,
  zg as FINGERS,
  Eo as FLIPS,
  H1 as FOOT_SHAPES,
  ga as FORMAT_VERSION,
  Ge as GAGS,
  Ft as GAITS,
  mc as GAIT_CYCLE_MS,
  O0 as GLASSES_STYLES,
  fe as HAIR_COLORS,
  is as HAIR_STILL,
  w0 as HAIR_STYLES,
  fo as HAND_MEETINGS,
  Pt as HAND_REST,
  Ht as HAND_SHAPES,
  Gr as HAT_STYLES,
  D0 as HELD_ITEMS,
  gn as HELP_UP,
  IM as HORSE_ACTING,
  PM as HORSE_GAITS,
  ck as HOUSE_ACTING,
  bw as HUMAN_ACTING_RIG,
  Ui as HUMAN_BUILDS,
  Cl as HUMAN_CYCLES,
  u0 as HUMAN_EXPRESSIONS,
  Vr as HUMAN_GAGS,
  ce as HUMAN_POSES,
  pt as HUMAN_REST,
  vb as IDENTITY_CAMERA,
  Xd as INERTIA_MAX_DURATION_MS,
  zu as InertiaTrackPlayer,
  ge as LiveTimeline,
  Q5 as MORPH_SAMPLES,
  ji as MUDRAS,
  K5 as ManualClock,
  nl as MediaSync,
  gp as Observer,
  Vt as POSES,
  jc as PROP_BEAT_3D_FIELDS,
  ur as PROP_BEAT_FIELDS,
  Wd as PROP_COMMON_ACTIONS,
  gs as PROP_COMMON_CONTROLS,
  cs as PROP_PRESETS,
  Kn as PROP_SURFACE,
  Cd as QUADRUPED_ACTING,
  or as REMOVE_STYLES,
  lt as REST_POSE,
  Fd as RIDING_POSES,
  Ne as SAMPLE_STEP,
  I5 as SCENERY_COLORS,
  Ho as SCRIPT_ACTIONS,
  nh as SPRING_MAX_DURATION_MS,
  Wo as SPRING_PRESETS,
  Dn as SPRING_STEP_MS,
  gw as STICK_ACTING_RIG,
  Wp as ScrollAnimator,
  xo as ScrollDriver,
  Fp as ScrollMarkers,
  _p as ScrollPin,
  Ga as SmoothScroll,
  bo as SpringSampler,
  qu as SpringTrackPlayer,
  ap as Stage,
  rk as TREE_ACTING,
  Ct as Timeline,
  $r as TinyflyPlayer,
  Hg as TinyflySequencer,
  qo as TrackPlayer,
  G2 as VEHICLE_ACTING,
  He as VISEMES,
  cv as ValueResolver,
  Op as VisibilityDriver,
  Mk as WHEELCHAIR_ACTING,
  ke as WHITEBOARD_SURFACE,
  kw as actCharacterTracks,
  ra as actKeyframes,
  ww as actTracks,
  bd as actionNames,
  Ek as airplane,
  De as anchorError,
  fa as animalStrideLength,
  E2 as animatableProperties,
  YM as applyBloom,
  Zv as applyCamera,
  Vm as applyGroove,
  pc as assertBeats,
  iu as backOut,
  Fv as bakeDanceTracks,
  ph as bakeEasing,
  uh as bakeInertiaTrack,
  dh as bakeSpringTrack,
  Ly as basicOutfit,
  Rv as beatAt,
  wr as beatAtTime,
  Mh as beatLength,
  br as beatTime,
  gv as beatsBetween,
  mk as bed,
  sk as bike,
  Tg as bindChoiceHotspots,
  Qe as bird,
  ss as blendPose,
  Kh as boilFrame,
  ou as bounceOut,
  ab as boxMesh,
  Hy as brushingPose,
  BM as buildScene,
  Q2 as bus,
  Jv as cameraFromValues,
  Qv as cameraPoint,
  yv as cameraTracks,
  r5 as capabilities,
  _M as capabilitiesMarkdown,
  J2 as car,
  ek as cart,
  cM as castMember,
  Lk as cat,
  dk as chair,
  as as changingWindows,
  B0 as character,
  jv as characterAt,
  qy as characterHandPose,
  se as characterJoints,
  zv as characterJointsInView,
  Gv as characterObjects,
  Ky as characterPartsInView,
  Qr as characterPoseOf,
  Xv as characterPoseTracks,
  TM as characterScript,
  Vv as characterScript3D,
  u2 as characterStrideLength,
  Kv as characterTarget,
  Ku as charactersFor,
  lM as chart,
  go as checkBeats,
  wd as checkCast,
  kb as checkCharacterBeats3D,
  Zk as checkPropBeats,
  E5 as checkPropBeats3D,
  c2 as checkSurfaceBeats,
  EM as checkTracks,
  jk as chicken,
  eM as circlePath,
  Lh as clamp01,
  tv as clearMorphCache,
  J5 as clearPathCache,
  hd as clipErased,
  Gs as closestName,
  rM as codePanel,
  Rb as codeTokens,
  ja as containerProgressAt,
  QM as context,
  St as controlValue,
  Wk as cow,
  Ev as create,
  bg as createControls,
  nu as createCubicBezier,
  lg as createLive,
  So as createPen,
  Ve as createRandom,
  Oi as createTrack,
  G5 as criticalDamping,
  Kk as crow,
  nf as customBounce,
  ef as customEase,
  sf as customWiggle,
  lb as cylinderMesh,
  Cr as danceFrame,
  Hv as dancePose,
  Xi as danceStance,
  Cv as danceTaps,
  Wv as danceTracks,
  Qo as danceTravel,
  t1 as danceTravelTrack,
  Lv as dancer,
  vM as defineAction,
  MM as defineGait,
  T2 as describeTarget,
  Qn as deserializeTimeline,
  Vu as deserializeTrack,
  pk as desk,
  mv as detectTempo,
  Rk as dog,
  bk as door,
  vv as draggable,
  Or as drawCartoonHand,
  Yy as drawCharacter,
  Yv as drawCharacterInView,
  Sw as drawDustPuff,
  rd as drawEraser,
  ld as drawHand,
  Ll as drawHeldItem,
  wM as drawImpactStars,
  Mb as drawPencil,
  AM as drawProp,
  HM as drawPropEffects,
  J0 as drawPropShadow,
  Jy as drawSolvedFaces,
  Uv as drawSolvedPart,
  G0 as drawSolvedProp,
  Mw as drawSpeedLines,
  Nm as drawStickFigure,
  bM as drawStickSmear,
  KM as drawTrail,
  nM as drawnPathTarget,
  Uk as duck,
  Zd as easeIn,
  sh as easeInCubic,
  tu as easeInOut,
  ko as easeInOutCubic,
  Jd as easeInOutQuad,
  Gd as easeInQuad,
  Qd as easeOut,
  oh as easeOutCubic,
  Vd as easeOutQuad,
  uf as editDistance,
  _o as editError,
  ps as editLog,
  su as elasticOut,
  rl as ellipsePoints,
  cb as ellipsoidMesh,
  fM as embrace,
  uM as embraceSpacing,
  iM as erasable,
  aa as expandBeats,
  Du as expandParametricEasings,
  db as extrudeMesh,
  y1 as flipPose,
  Nv as flipTracks,
  b1 as flipTravel,
  Zc as formatVersionFor,
  XM as from,
  rv as fromJSON,
  UM as fromTo,
  rc as gag,
  po as gagDuration,
  hm as gaitPose,
  qi as gaitStrideLength,
  Rt as getEasingFunction,
  Us as getInterpolator,
  gh as getMotionPathPoint,
  Z5 as getPathLength,
  mu as getPointAtProgress,
  Fk as goat,
  yp as gridLinesFor,
  aw as hairFollow,
  yM as hairFollowTracks,
  ty as hairHangs,
  mM as hairMotionAt,
  jr as hairMotionOf,
  co as hairlineAt,
  tM as handAt,
  ri as handGrip,
  Bi as handJoints,
  em as handJointsAt,
  vd as handPath,
  $t as handPose,
  so as handProp,
  qd as hasKeyframes,
  oe as hashSeed,
  Ov as headPoint,
  zd as heldTime,
  Sk as helicopter,
  gM as helpUp,
  pM as helpUpSpacing,
  Fy as holdingLayers,
  Ck as horse,
  OM as horseStrideLength,
  lk as house,
  Bv as humanCyclePose,
  Dv as humanFieldLabel,
  Oy as humanGag,
  F0 as humanGaitPose,
  N0 as humanGaitStrideLength,
  R1 as humanPlan,
  bt as humanPose,
  nx as imageSequence,
  ds as inertiaDuration,
  hs as inertiaRest,
  Ai as inertiaValueAt,
  V5 as inertiaVelocityAt,
  Wu as interpolateArray,
  Lu as interpolateColor,
  ov as interpolateMotionPath,
  pe as interpolateNumber,
  Nu as interpolatePathString,
  Fu as interpolateQuaternion,
  Ia as interpolateString,
  Bd as isCubicBezierEasing,
  Wl as isHeld,
  je as isInertiaTrack,
  Y5 as isMotionPathPoint,
  Qc as isMotionPathTrack,
  js as isParametricEasing,
  us as isPathData,
  Xe as isSpringTrack,
  gr as isTextTrack,
  U5 as isUnderdamped,
  lv as isUnresolved,
  Xy as jointsInScene,
  Fm as jointsToScene,
  $i as linear,
  md as lipSyncKeyframes,
  yd as lipSyncOver,
  kM as lipSyncTracks,
  Q0 as lit,
  Jt as live,
  $d as loosePartsOf,
  _k as lyingPose,
  Js as mapEase,
  kv as mat4,
  tx as matchMedia,
  eh as maxStaggerDistance,
  dM as meetHands,
  hM as meetingSpacing,
  _1 as mirrorHumanPose,
  Um as mirrorPose,
  td as mixColors,
  ns as mixHandPoses,
  jy as mixPoses,
  $u as morphPath,
  ok as motorbike,
  Ag as mount,
  Ig as mountAll,
  dv as narrationMarkers,
  uv as narrationSceneAt,
  Xs as naturalRest,
  fv as nearestBeat,
  pv as nextBeat,
  Ub as niceCeiling,
  Gk as owl,
  sx as pageTransition,
  ub as panelMesh,
  au as parametricEasing,
  Vk as parrot,
  An as parseAnchor,
  Ka as parseEdge,
  Mn as parsePath,
  Rh as parseTrigger,
  es as partialPath,
  Lg as pathLength,
  NM as pedallingKeys,
  Uc as pedallingPose,
  SM as persona,
  Oo as pieceMotion,
  Xk as pigeon,
  hv as planNarration,
  Tv as play,
  $v as playSequence,
  xv as playWhenVisible,
  mh as playheadCrossings,
  Pr as pointAlong,
  ih as pointAtDistance,
  qv as pointOnHead,
  ff as pointsToPath,
  _t as pose,
  _v as poseTracks,
  pa as propActions,
  B2 as propAnchors3D,
  ua as propAt,
  Pd as propControls,
  V0 as propLineWidth,
  WM as propObjects,
  D2 as propPartsInSpace,
  Ld as propPreset,
  CM as propRide,
  DM as propRide3D,
  Qk as propScript,
  FM as propScript3D,
  mo as propShapeMesh,
  $M as propSurface,
  K2 as propTarget,
  LM as propTow,
  W2 as propView,
  Ze as quadruped,
  ev as quat,
  qM as quickPlay,
  ex as quickTo,
  Nk as rabbit,
  bh as randomBetween,
  av as randomChoice,
  Zu as randomSnapped,
  Pe as reachCharacter,
  f2 as reachOf,
  fd as resolveActingStyle,
  j0 as resolveCharacterPoseKeys,
  uy as resolveFacialHair,
  To as resolveGait,
  ky as resolveGlasses,
  ey as resolveHair,
  Sy as resolveHat,
  $y as resolveHeadLook,
  Wy as resolveHolding,
  _r as resolvePoseKeys,
  Qu as resolveSequence,
  i0 as resolveStickFrame,
  Dm as resolveStickPose,
  vh as resolveValue,
  mf as ribbon,
  yf as ribbonHeadCap,
  ia as rideFloors,
  Ye as rotateAbout,
  Rr as routineBeats,
  Tn as rubberLimb,
  N5 as scenePreset,
  W5 as scenery,
  kd as scriptActionSummaries,
  la as scriptTracks,
  Mv as scrollProgress,
  Sv as scrubOnScroll,
  sM as scrubPath,
  Iv as seatHeight,
  Ju as serializeTimeline,
  Gu as serializeTrack,
  GM as set,
  sa as shade,
  pb as shapeMesh,
  kr as shapeToPathData,
  Bu as simplifyKeyframes,
  zc as sittingPose,
  Br as skeletonInView,
  Fi as sketchPen,
  _5 as skyColors,
  ed as smoothPath,
  Ip as smoothToward,
  mp as snapAxis,
  Cp as snapConfig,
  Lp as snapDuration,
  Rp as snapProgress,
  ms as solveAt,
  Fr as solvePlanSpace,
  Ad as solveProp,
  Yk as songbird,
  Iw as soundsOf,
  e2 as speechDuration,
  RM as spliceTracks,
  ZM as splitText,
  Yd as springDuration,
  Ls as springFollow,
  X5 as springValueAt,
  Dk as squirrel,
  Dr as stagePlanSpace,
  th as staggerDistance,
  mr as staggerOffset,
  Ei as staggerOffsets,
  yo as staggerSpan,
  _w as stepsDuration,
  ru as stepsEasing,
  gd as stepsToKeys,
  l0 as stickFigureAt,
  ae as stickFigureJoints,
  a0 as stickFigureTarget,
  F1 as stickToHuman,
  fm as strideLength,
  wt as surfaceBox,
  xM as surfaceScript,
  _y as sweepingPose,
  fg as syncMediaElement,
  pm as talkingMouth,
  Ir as taperedLine,
  Lt as taperedOutline,
  Xu as textAt,
  zM as tf,
  JM as ticker,
  VM as timeline,
  jM as to,
  iv as toJSON,
  nv as toKeyframedTrack,
  sv as toKeyframedTracks,
  Ce as trackTargets,
  tk as tractor,
  bv as trailSamples,
  nk as trainCar,
  ik as tree,
  ts as triggerDistance,
  Z2 as truck,
  fb as tubeMesh,
  ut as unknownName,
  Av as unmount,
  oa as valueAt,
  wv as vec3,
  Oe as vehicle,
  um as walkPose,
  vk as wheelchair,
  aM as whiteboard,
  oM as withErased,
  Le as withExpression
};
