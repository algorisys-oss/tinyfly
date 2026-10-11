function Zu(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function Gs(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const ka = 2;
function oh(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function vr(t) {
  return t.property === "text" && "textConfig" in t;
}
function Ke(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function Xe(t) {
  return t.kind === "spring" && "spring" in t;
}
function ih(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function av(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function Qu(t) {
  return "keyframes" in t;
}
class lv {
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
class cv {
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
function td(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function rh(t, e, n = "start") {
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
function ah(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, rh(s, t, e));
  return n;
}
function Mr(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", o = rh(t, e, s);
  if (n.amount !== void 0) {
    const i = ah(e, s);
    return i === 0 ? 0 : n.amount * o / i;
  }
  return n.each !== void 0 ? n.each * o : 0;
}
function _i(t, e) {
  return Array.from({ length: t }, (n, s) => Mr(s, t, e));
}
function ko(t, e) {
  return t <= 1 ? 0 : Math.max(..._i(t, e));
}
const qn = 1, lh = 6e4, ks = lh / qn, ee = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Yo = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class vo {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? ee.stiffness, this.damping = e.damping ?? ee.damping, this.mass = e.mass ?? ee.mass, this.restDelta = e.restDelta ?? ee.restDelta, this.restSpeed = e.restSpeed ?? ee.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? ee.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / qn);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], o = this.samples[Math.min(n + 1, this.samples.length - 1)], i = e / qn - n;
    return s + (o - s) * i;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(ks + 1), this.settledStep !== null ? this.settledStep * qn : lh;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, ks + 1), s = qn / 1e3;
    for (; this.samples.length < n; ) {
      const o = this.samples[this.samples.length - 1], i = o - this.to, r = -this.stiffness * i, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = o + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > ks && (this.settledStep = ks);
  }
}
function hv(t, e) {
  return new vo(t).valueAt(e);
}
function ed(t) {
  return new vo(t).settleTime();
}
function uv(t) {
  const e = t.stiffness ?? ee.stiffness, n = t.damping ?? ee.damping, s = t.mass ?? ee.mass;
  return n < 2 * Math.sqrt(e * s);
}
function dv(t) {
  const e = t.stiffness ?? ee.stiffness, n = t.mass ?? ee.mass;
  return 2 * Math.sqrt(e * n);
}
const va = 4, nd = 2e-3, sd = 1e-4, od = 6e4;
function Mo(t) {
  const e = t.friction ?? va;
  return e > 0 ? e : va;
}
function Vs(t) {
  return t.from + t.velocity / Mo(t);
}
function id(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function fs(t) {
  let e = id(Vs(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function ps(t) {
  const e = Math.abs(fs(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(sd, e * nd);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Mo(t);
  return Math.min(od, s * 1e3);
}
function Hi(t, e) {
  if (e <= 0) return t.from;
  const n = fs(t);
  if (e >= ps(t)) return n;
  const s = Mo(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function fv(t, e) {
  const n = Mo(t), s = fs(t);
  return e >= ps(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const Ci = (t) => t, rd = (t) => t * t, ad = (t) => 1 - (1 - t) * (1 - t), ld = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, ch = (t) => t * t * t, hh = (t) => 1 - Math.pow(1 - t, 3), xo = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, cd = ch, hd = hh, ud = xo, dd = {
  linear: Ci,
  "ease-in": cd,
  "ease-out": hd,
  "ease-in-out": ud,
  "ease-in-quad": rd,
  "ease-out-quad": ad,
  "ease-in-out-quad": ld,
  "ease-in-cubic": ch,
  "ease-out-cubic": hh,
  "ease-in-out-cubic": xo
};
function fd(t) {
  const [e, n, s, o] = t, i = 3 * e, r = 3 * (s - e) - i, a = 1 - i - r, l = 3 * n, c = 3 * (o - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + i) * p, d = (p) => ((h * p + c) * p + l) * p, f = (p) => (3 * a * p + 2 * r) * p + i, g = (p) => {
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
    let b = 0, k = 1;
    for (m = p; b < k; ) {
      const w = u(m);
      if (Math.abs(w - p) < 1e-7)
        return m;
      p > w ? b = m : k = m, m = (b + k) / 2;
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
function jo(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function pd(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (o) => o <= 0 ? 0 : o >= 1 ? 1 : n * Math.pow(2, -10 * o) * Math.sin((o - s) * (2 * Math.PI) / e) + 1;
}
const gd = (t) => {
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
function md(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function yd(t, e = "end") {
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
function bd(t) {
  switch (t.type) {
    case "steps":
      return yd(t.count, t.position);
    case "elastic":
      return jo(pd(t.amplitude, t.period), t.mode);
    case "bounce":
      return jo(gd, t.mode);
    case "back":
      return jo(md(t.overshoot), t.mode);
  }
}
function Rt(t) {
  return t === void 0 ? Ci : Zu(t) ? fd(t.points) : Gs(t) ? bd(t) : dd[t] ?? Ci;
}
const Ma = 32, wd = 256, un = /* @__PURE__ */ new Map(), kd = /[MmLlHhVvCcSsQqTtAaZz]/, vd = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Md = {
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
function xd(t) {
  const e = [];
  let n = 0, s = null;
  const o = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (o(), !(n >= t.length)); ) {
    const i = t[n];
    if (kd.test(i)) {
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
    const l = vd.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function Sd(t, e, n, s, o, i, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = o * Math.PI / 180, d = Math.cos(u), f = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = d * g + f * p, b = -f * g + d * p, k = m * m / (c * c) + b * b / (h * h);
  if (k > 1) {
    const S = Math.sqrt(k);
    c *= S, h *= S;
  }
  const w = i === r ? -1 : 1, y = c * c * h * h - c * c * b * b - h * h * m * m, v = c * c * b * b + h * h * m * m, E = w * Math.sqrt(Math.max(0, y / v)), T = E * c * b / h, x = -E * h * m / c, M = d * T - f * x + (t + a) / 2, A = f * T + d * x + (e + l) / 2, I = (S, C, L, $) => {
    const R = S * L + C * $, N = Math.sqrt((S * S + C * C) * (L * L + $ * $)), z = Math.acos(Math.max(-1, Math.min(1, R / N)));
    return S * $ - C * L < 0 ? -z : z;
  }, P = I(1, 0, (m - T) / c, (b - x) / h);
  let O = I((m - T) / c, (b - x) / h, (-m - T) / c, (-b - x) / h);
  !r && O > 0 && (O -= 2 * Math.PI), r && O < 0 && (O += 2 * Math.PI);
  const _ = Math.max(1, Math.ceil(Math.abs(O) / (Math.PI / 2))), W = O / _, B = 4 / 3 * Math.tan(W / 4), K = (S) => {
    const C = c * Math.cos(S), L = h * Math.sin(S);
    return [d * C - f * L + M, f * C + d * L + A];
  }, V = (S) => {
    const C = -c * Math.sin(S), L = h * Math.cos(S);
    return [d * C - f * L, f * C + d * L];
  }, j = [];
  for (let S = 0; S < _; S++) {
    const C = P + S * W, L = C + W, [$, R] = K(C), [N, z] = S === _ - 1 ? [a, l] : K(L), [D, q] = V(C), [U, F] = V(L);
    j.push([$ + B * D, R + B * q, N - B * U, z - B * F, N, z]);
  }
  return j;
}
function ve(t, e, n, s, o) {
  const i = 1 - o;
  return i * i * i * t + 3 * i * i * o * e + 3 * i * o * o * n + o * o * o * s;
}
function xa(t, e, n, s, o) {
  const i = 1 - o;
  return 3 * i * i * (e - t) + 6 * i * o * (n - e) + 3 * o * o * (s - n);
}
function Hn(t, e, n, s) {
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
function vs(t, e, n) {
  const [s, o, i, r, a, l] = n, c = [0];
  let h = t, u = e, d = 0;
  for (let f = 1; f <= Ma; f++) {
    const g = f / Ma, p = ve(t, s, i, a, g), m = ve(e, o, r, l, g);
    d += Math.hypot(p - h, m - u), c.push(d), h = p, u = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, o, i, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: d,
    lengths: c
  };
}
function Sn(t) {
  const e = un.get(t);
  if (e) return e;
  const n = [];
  let s = 0, o = 0, i = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of xd(t)) {
    const b = p.toUpperCase(), k = p !== b, w = Md[b];
    if (b === "Z") {
      (s !== i || o !== r) && u(Hn(s, o, i, r)), c >= 0 && h.add(c), s = i, o = r, a = l = null;
      continue;
    }
    for (let y = 0; y + w <= m.length; y += w) {
      const v = m.slice(y, y + w), E = k ? s : 0, T = k ? o : 0;
      let x = null, M = null;
      switch (b) {
        case "M":
          y === 0 ? (s = v[0] + E, o = v[1] + T, i = s, r = o, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(Hn(s, o, v[0] + E, v[1] + T)), s = v[0] + E, o = v[1] + T);
          break;
        case "L":
          u(Hn(s, o, v[0] + E, v[1] + T)), s = v[0] + E, o = v[1] + T;
          break;
        case "H":
          u(Hn(s, o, v[0] + E, o)), s = v[0] + E;
          break;
        case "V":
          u(Hn(s, o, s, v[0] + T)), o = v[0] + T;
          break;
        case "C": {
          const A = [v[0] + E, v[1] + T, v[2] + E, v[3] + T, v[4] + E, v[5] + T];
          u(vs(s, o, A)), x = [A[2], A[3]], s = A[4], o = A[5];
          break;
        }
        case "S": {
          const [A, I] = a ? [2 * s - a[0], 2 * o - a[1]] : [s, o], P = [A, I, v[0] + E, v[1] + T, v[2] + E, v[3] + T];
          u(vs(s, o, P)), x = [P[2], P[3]], s = P[4], o = P[5];
          break;
        }
        case "Q":
        case "T": {
          let A = s, I = o;
          b === "Q" ? (A = v[0] + E, I = v[1] + T) : l && (A = 2 * s - l[0], I = 2 * o - l[1]);
          const P = b === "Q" ? v[2] + E : v[0] + E, O = b === "Q" ? v[3] + T : v[1] + T;
          u(
            vs(s, o, [
              s + 2 / 3 * (A - s),
              o + 2 / 3 * (I - o),
              P + 2 / 3 * (A - P),
              O + 2 / 3 * (I - O),
              P,
              O
            ])
          ), M = [A, I], s = P, o = O;
          break;
        }
        case "A": {
          const A = v[5] + E, I = v[6] + T;
          let P = s, O = o;
          for (const _ of Sd(s, o, v[0], v[1], v[2], v[3], v[4], A, I))
            u(vs(P, O, _)), P = _[4], O = _[5];
          s = A, o = I;
          break;
        }
      }
      a = x, l = M;
    }
  }
  const d = n.reduce((p, m) => p + m.length, 0), f = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let b = p, k = 0;
    for (; b < n.length && n[b].subpath === m; ) k += n[b++].length;
    const w = n[p], y = n[b - 1], v = h.has(m) || Math.abs(y.endX - w.startX) < 1e-9 && Math.abs(y.endY - w.startY) < 1e-9;
    f.push({ start: p, end: b, length: k, closed: v }), p = b;
  }
  const g = { segments: n, totalLength: d, subpaths: f };
  return un.size >= wd && un.delete(un.keys().next().value), un.set(t, g), g;
}
function Td(t, e) {
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
function Ed(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, o, i, r, a] = t.points, l = Td(t, e);
  let c = xa(t.startX, n, o, r, l), h = xa(t.startY, s, i, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), d = ve(t.startX, n, o, r, u), f = ve(t.startY, s, i, a, u), g = ve(t.startX, n, o, r, l), p = ve(t.startY, s, i, a, l);
    c = l < 0.5 ? d - g : g - d, h = l < 0.5 ? f - p : p - f;
  }
  return {
    x: ve(t.startX, n, o, r, l),
    y: ve(t.startY, s, i, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function uh(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let o = 0;
  for (let i = n; i < s; i++) {
    const r = t[i];
    if (o + r.length >= e || i === s - 1)
      return Ed(r, e - o);
    o += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Ad(t, e) {
  const { segments: n, totalLength: s } = Sn(t);
  return uh(n, Math.max(0, Math.min(1, e)) * s);
}
function pv() {
  un.clear();
}
function gv(t) {
  return Sn(t).totalLength;
}
const $d = 24, Pd = 320, Id = 2.5, Cn = 72, mv = 64, Od = 0.2, _d = 128, Yn = /* @__PURE__ */ new Map();
let Ws = 0, we;
const Sa = (t) => Math.round(t * 100) / 100;
function Ta(t, e) {
  const { segments: n, subpaths: s, totalLength: o } = Sn(t);
  if (n.length === 0) return [];
  if (e) {
    const i = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: o, closed: i }];
  }
  return s.filter((i) => i.length > 0).map((i) => ({ segments: n, start: i.start, end: i.end, length: i.length, closed: i.closed }));
}
function Ri(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = uh(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function Ea(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function Aa(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Ri(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function $a(t) {
  let e = 0, n = 0;
  for (const [s, o] of t)
    e += s, n += o;
  return e /= t.length, n /= t.length, t.map(([s, o]) => [s - e, o - n]);
}
function Hd(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % Cn / Cn : 0, reversed: n < 0 };
  const o = $a(Aa(t, Cn)), i = $a(Aa(e, Cn)), r = Cn;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let u = 0; u < h; u++) {
      let d = 0;
      for (let f = 0; f < r && d < l; f++) {
        const g = s ? c ? (u - f + r) % r : (f + u) % r : c ? r - 1 - f : f, p = o[f][0] - i[g][0], m = o[f][1] - i[g][1];
        d += p * p + m * m;
      }
      d < l && (l = d, a = { offset: s ? u / r : 0, reversed: c });
    }
  }
  return a;
}
function Cd(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Rd(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Ld(t, e, n) {
  const s = t.closed && e.closed, o = Hd(t, e, n.shapeIndex), i = Math.max(
    $d,
    Math.min(Pd, Math.ceil(Math.max(t.length, e.length) / Id))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= i; u++) a(u / i);
  for (const u of Ea(t)) a(u);
  for (const u of Ea(e)) a(Rd(u, o, s));
  let l = [...r].sort((u, d) => u - d);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...Ri(t, u)), h.push(...Ri(e, Cd(u, o, s)));
  return Wd({ from: c, to: h, closed: s });
}
function Wd(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = Od;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(Pa(t.from, r, a, h), Pa(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const o = [], i = [];
  for (let r = 0; r < e; r++)
    n[r] && (o.push(t.from[r * 2], t.from[r * 2 + 1]), i.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: o, to: i, closed: t.closed };
}
function Pa(t, e, n, s) {
  const o = t[e * 2], i = t[e * 2 + 1], r = t[n * 2] - o, a = t[n * 2 + 1] - i, l = t[s * 2] - o, c = t[s * 2 + 1] - i, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function Fd(t, e, n) {
  const s = n.shapeIndex;
  if (we && we.from === t && we.to === e && we.shapeIndex === s) return we.plan;
  const i = Yn.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (i)
    return we = { from: t, to: e, shapeIndex: s, plan: i }, i;
  const r = Sn(t).subpaths.filter((f) => f.length > 0).length === Sn(e).subpaths.filter((f) => f.length > 0).length, a = Ta(t, !r), l = Ta(e, !r), c = {
    pairs: a.map((f, g) => Ld(f, l[g], n))
  };
  Ws >= _d && (Yn.clear(), Ws = 0);
  const h = String(s ?? "auto"), u = Yn.get(h) ?? /* @__PURE__ */ new Map();
  Yn.set(h, u);
  const d = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, d), d.set(e, c), Ws++, we = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function Nd(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const o = Math.max(0, Math.min(1, n));
  if (o === 0) return t;
  if (o === 1) return e;
  const i = Fd(t, e, s);
  if (i.pairs.length === 0) return o < 0.5 ? t : e;
  let r = "";
  for (const a of i.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = Sa(a.from[l] + (a.to[l] - a.from[l]) * o), h = Sa(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * o);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function yv() {
  Yn.clear(), Ws = 0, we = void 0;
}
function gs(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const dn = Math.PI / 180, Dd = 0.9995;
function xr() {
  return [0, 0, 0, 1];
}
function Vt(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return xr();
  const s = e * dn / 2, o = Math.sin(s) / n;
  return [t[0] * o, t[1] * o, t[2] * o, Math.cos(s)];
}
function Bd(t, e, n) {
  return Li(Li(Vt([0, 1, 0], e), Vt([1, 0, 0], t)), Vt([0, 0, 1], n));
}
function zd(t) {
  const [e, n, s, o] = Te(t), i = 2 * (e * s + n * o), r = 2 * (e * n + s * o), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * o), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * o), u = 1 - 2 * (e * e + n * n), d = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [d / dn, Math.atan2(i, u) / dn, Math.atan2(r, a) / dn] : [d / dn, Math.atan2(-h, c) / dn, 0];
}
function Li(t, e) {
  const [n, s, o, i] = t, [r, a, l, c] = e;
  return [
    i * r + n * c + s * l - o * a,
    i * a - n * l + s * c + o * r,
    i * l + n * a - s * r + o * c,
    i * c - n * r - s * a - o * l
  ];
}
function dh(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function fh(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function Te(t) {
  const e = fh(t);
  return e === 0 ? xr() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function qd(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function ph(t, e, n) {
  const s = Te(t);
  let o = Te(e), i = dh(s, o);
  if (i < 0 && (o = [-o[0], -o[1], -o[2], -o[3]], i = -i), i > Dd)
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
function Yd(t, e) {
  const [n, s, o, i] = Te(t), r = 2 * (s * e[2] - o * e[1]), a = 2 * (o * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + i * r + (s * l - o * a), e[1] + i * a + (o * r - n * l), e[2] + i * l + (n * a - s * r)];
}
const bv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: qd,
  dot: dh,
  fromAxisAngle: Vt,
  fromEuler: Bd,
  identity: xr,
  length: fh,
  multiply: Li,
  normalize: Te,
  rotateVec3: Yd,
  slerp: ph,
  toEuler: zd
}, Symbol.toStringTag, { value: "Module" })), pe = (t, e, n) => t + (e - t) * n, gh = 512, Ko = /* @__PURE__ */ new Map(), Xo = /* @__PURE__ */ new Map();
function Ia(t) {
  const e = Ko.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return Ko.size < gh && Ko.set(t, s), s;
}
const Oa = (t) => t.charCodeAt(0) === 35, _a = (t) => t.startsWith("rgb"), Ha = (t) => t.startsWith("rgba"), jd = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Uo = (t) => Math.round(t).toString(16).padStart(2, "0");
function Kd(t, e, n) {
  return `#${Uo(t)}${Uo(e)}${Uo(n)}`;
}
function Ca(t) {
  const e = Xo.get(t);
  if (e) return e;
  const n = t.match(jd);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), o = parseInt(n[2], 10), i = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, o, i, parseFloat(n[4])] : [s, o, i];
  return Xo.size < gh && Xo.set(t, r), r;
}
const Xd = (t, e, n) => {
  if (Oa(t) && Oa(e)) {
    const [s, o, i] = Ia(t), [r, a, l] = Ia(e), c = pe(s, r, n), h = pe(o, a, n), u = pe(i, l, n);
    return Kd(c, h, u);
  }
  if ((_a(t) || Ha(t)) && (_a(e) || Ha(e))) {
    const s = Ca(t), o = Ca(e), i = Math.round(pe(s[0], o[0], n)), r = Math.round(pe(s[1], o[1], n)), a = Math.round(pe(s[2], o[2], n));
    if (s.length === 4 || o.length === 4) {
      const l = s[3] ?? 1, c = o[3] ?? 1, h = pe(l, c, n);
      return `rgba(${i}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${i}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, Ud = (t, e, n) => {
  const s = Math.min(t.length, e.length), o = [];
  for (let i = 0; i < s; i++)
    o.push(pe(t[i], e[i], n));
  return o;
}, Gd = (t, e, n) => ph(t, e, n), Ra = (t, e, n) => n < 1 ? t : e, Vd = (t, e, n) => Nd(t, e, n);
function Js(t, e) {
  return e === "slerp" ? Gd : typeof t == "number" ? pe : Array.isArray(t) ? Ud : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? Xd : gs(t) ? Vd : Ra : Ra;
}
const mh = 1e3 / 60;
function yh(t, e = {}) {
  if (!Xe(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new vo(t.spring);
  return wh(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function bh(t, e = {}) {
  if (!Ke(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return wh(
    t,
    (s) => Hi(n, s),
    ps(n),
    n.from,
    fs(n),
    e
  );
}
function wh(t, e, n, s, o, i) {
  const r = i.intervalMs ?? mh, a = i.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: o, easing: "linear" }) : h.value = o, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? Zd(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function kh(t, e, n, s = {}) {
  const o = s.intervalMs ?? mh, i = typeof n == "function" ? n : Rt(n), r = Js(t.value, s.interpolation), a = e.time - t.time;
  if (a <= 0) return [e];
  const l = [];
  for (let h = o; h < a; h += o) {
    const u = h / a;
    l.push({
      time: t.time + h,
      value: r(t.value, e.value, i(u)),
      easing: "linear"
    });
  }
  const c = i(1);
  return l.push({ ...e, ...c !== 1 && { value: r(t.value, e.value, c) }, easing: "linear" }), l;
}
function wv(t, e) {
  return Xe(t) ? yh(t, e) : Ke(t) ? bh(t, e) : t;
}
function Jd(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((i) => Gs(i.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], o = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let i = 1; i < n.length; i++) {
    const r = n[i];
    Gs(r.easing) ? s.push(...kh(n[i - 1], r, r.easing, o)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function kv(t, e) {
  return t.filter(Qu).map((n) => Jd(n, e)).concat(
    t.filter(Xe).map((n) => yh(n, e)),
    t.filter(Ke).map((n) => bh(n, e))
  );
}
function Zd(t, e) {
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
function Wi(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function Ce(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function Tn(t, e, n, s) {
  const o = n ?? 0;
  return !s || e <= 1 ? o : o + Mr(t, e, s);
}
class Fs {
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
    return this.valueForOffset(e - Tn(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const i = Tn(o, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - i);
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
    const n = e[e.length - 1].time, s = this.track.stagger ? ko(this.targets.length, this.track.stagger) : 0;
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
    return Js(s.value, this.track.interpolation)(s.value, o.value, l);
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
class Qd {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = Ce(e), this.sampler = new vo(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - Tn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = Tn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: this.sampler.valueAt(e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? ko(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class tf {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = Ce(e), this.duration = ps(e.inertia);
  }
  getValueAtTime(e) {
    return Hi(this.track.inertia, e - Tn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = Tn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: Hi(this.track.inertia, e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? ko(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function vh(t, e) {
  const n = { ...Ad(t.pathData, e) };
  if (t.matrix) {
    const [s, o, i, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + i * h + a, n.y = o * c + r * h + l;
    const u = n.angle * Math.PI / 180, d = Math.cos(u), f = Math.sin(u);
    n.angle = Math.atan2(o * d + r * f, s * d + i * f) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function vv(t, e, n, s) {
  const o = e + (n - e) * s;
  return vh(t, o);
}
const Go = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, ef = 20;
function nf(t) {
  const e = Go[t ?? "upperCase"] ?? t ?? Go.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(Go.upperCase);
}
function sf(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function of(t, e, n = 0) {
  const s = t.from ?? "", o = t.to, i = Math.max(0, Math.min(1, e));
  if (i <= 0) return s;
  if (i >= 1) return o;
  const r = Array.from(s), a = Array.from(o), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const k = Math.round(i * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - k)).join("") + a.slice(Math.max(0, a.length - k)).join("") : a.slice(0, k).join("") + r.slice(k).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (i - c) / (1 - c)), u = Math.floor(h * a.length), d = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * i), f = nf(t.chars), g = t.refreshRate ?? ef, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let b = "";
  for (let k = 0; k < d; k++) {
    const w = l ? k >= d - u : k < u, y = l ? a[a.length - (d - k)] : a[k];
    w && y !== void 0 || y === " " || y === `
` ? b += y : b += f[sf(m, k, p) % f.length];
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
    if (e = td(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
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
        const h = `${a}\0${r}`, u = c <= e, d = s.get(h);
        (!d || (u !== d.started ? u : u ? c >= d.start : c <= d.start)) && s.set(h, { trackId: o, target: a, property: r, value: l, start: c, started: u });
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
      a.set("text", of(l.textConfig, i, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof i == "number") {
      const h = vh(c.motionPathConfig, i);
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
    if (this._tracks.push(e), this._sharedWrites = null, Ke(e)) {
      this._trackPlayers.set(e.id, new tf(e));
      return;
    }
    if (Xe(e)) {
      this._trackPlayers.set(e.id, new Qd(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (vr(e))
      this._trackPlayers.set(e.id, new Fs(e)), this._textTracks.set(e.id, e);
    else if (ih(e)) {
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
      this._trackPlayers.set(e.id, new Fs(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new Fs(e));
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
    if (Xe(s) || Ke(s))
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
          const a = Ce(r).filter((u) => Ce(s).includes(u));
          if (a.length === 0) continue;
          const l = this.getTrackSpan(r.id);
          if (!l || !(l.from <= o.to && o.from <= l.to)) continue;
          const h = o.from >= l.from;
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
      formatVersion: oh(this._tracks),
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
const rf = 100;
function Mh(t, e, n, s) {
  const o = [], i = [], { duration: r, alternate: a } = s, l = (f, g, p, m) => {
    i.push([f, g]);
    const b = [];
    t.forEach((k, w) => {
      (p === "forward" ? (m ? k >= f : k > f) && k <= g : (m ? k <= f : k < f) && k >= g) && b.push(w);
    }), b.sort((k, w) => (p === "forward" ? t[k] - t[w] : t[w] - t[k]) || k - w);
    for (const k of b) o.push({ kind: "event", index: k, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const d = Math.min(rf, Math.max(0, n.iteration - e.iteration));
  for (let f = 0; f < d; f++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), o.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return d > 0 && s.holding && !a ? { crossings: o, passes: i } : (l(c, n.time, h, u), { crossings: o, passes: i });
}
function af(t) {
  return Ke(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: xh(t.inertia),
    ...le(t)
  } : Xe(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...le(t)
  } : vr(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(Vo),
    ...le(t)
  } : ih(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(Vo),
    ...le(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(Vo),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...le(t)
  };
}
function xh(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function Vo(t) {
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
function lf(t) {
  if (Ke(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: xh(e.inertia),
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
  if (vr(t)) {
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
  return Wi({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...le(t)
  });
}
function cf(t) {
  const e = t._config.markers;
  return {
    formatVersion: oh(t.tracks),
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
    tracks: t.tracks.map(af),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function es(t) {
  const e = t.formatVersion ?? 1;
  if (e > ka)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${ka}. Update tinyfly to play it.`
    );
  return new Ct({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(lf),
    captions: t.captions
  });
}
function Mv(t) {
  return JSON.stringify(cf(t));
}
function xv(t) {
  const e = JSON.parse(t);
  return es(e);
}
function Zt(t) {
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
function Sh(t, e, n) {
  return e + t.next() * (n - e);
}
function hf(t, e, n, s) {
  if (s <= 0) return Sh(t, e, n);
  const o = Math.floor((n - e) / s), i = Math.round(t.next() * o);
  return e + i * s;
}
function Sv(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const Th = /^([+\-*/])=\s*(-?[\d.]+)$/, Eh = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Tv(t) {
  return typeof t != "string" ? !1 : Th.test(t.trim()) || Eh.test(t.trim());
}
function Ah(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = Th.exec(n);
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
  const o = Eh.exec(n);
  if (o) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const i = Number.parseFloat(o[1]), r = Number.parseFloat(o[2]), a = o[3] !== void 0 ? Number.parseFloat(o[3]) : void 0;
    return a !== void 0 ? hf(e.random, i, r, a) : Sh(e.random, i, r);
  }
  return t;
}
function uf(t, e = 0, n) {
  const s = [];
  let o = e;
  for (const i of t) {
    const r = Ah(i, { base: o, random: n });
    s.push(r), typeof r == "number" && (o = r);
  }
  return s;
}
class Ev {
  random;
  constructor(e) {
    this.random = Ve(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return Ah(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return uf(e, n, this.random);
  }
}
const df = 600;
function ff(t) {
  if (Array.isArray(t)) {
    const [d, f, g, p] = t;
    return { fn: La(d, f, g, p), bezier: [d, f, g, p] };
  }
  const { segments: e } = Sn(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, o = e[e.length - 1], i = o.endX - n, r = o.endY - s;
  if (i === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (d) => (d - n) / i, l = (d) => (d - s) / r;
  if (e.length === 1 && o.type === "C") {
    const [d, f, g, p] = o.points, m = [a(d), l(f), a(g), l(p)];
    return { fn: La(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(df / e.length));
  for (const d of e)
    for (let f = c.length === 0 ? 0 : 1; f <= u; f++) {
      const [g, p] = mf(d, f / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: yf(c, h) };
}
function pf(t = {}) {
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
function gf(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (o) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * o) : (1 - o) ** 2;
  return (o) => o <= 0 || o >= 1 ? 0 : Math.sin(o * e * Math.PI * 2) * s(o);
}
function mf(t, e) {
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
function yf(t, e) {
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
function La(t, e, n, s) {
  const o = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, i = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const u = o(a, t, n) - r, d = i(a, t, n);
      if (Math.abs(u) < 1e-6) return o(a, e, s);
      if (Math.abs(d) < 1e-6) break;
      a -= u / d;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      o(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return o(a, e, s);
  };
}
const bf = 350, wf = 300, kf = 550;
function Av(t, e = {}) {
  const n = e.lead ?? bf, s = e.gap ?? wf, o = e.tail ?? kf, i = [];
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
    const u = h + o + (a.tail ?? 0);
    i.push({ id: a.id ?? `s${l}`, start: r, duration: u - r, cues: c }), r = u;
  }), { duration: r, scenes: i, cues: i.flatMap((a) => a.cues) };
}
function $v(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function Pv(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const So = (t) => 6e4 / t.bpm;
function Sr(t, e) {
  return t.offset + e * So(t);
}
function To(t, e) {
  return (e - t.offset) / So(t);
}
function Iv(t, e) {
  return Sr(t, Math.round(To(t, e)));
}
function Ov(t, e) {
  return Sr(t, Math.ceil(To(t, e) - 1e-9));
}
function _v(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), o = [];
  if (!(t.bpm > 0) || n < e) return o;
  for (let i = Math.ceil(To(t, e) - 1e-9); ; i++) {
    const r = Sr(t, i);
    if (r > n + 1e-9) break;
    o.push({ time: r, bar: (i % s + s) % s === 0, n: i });
  }
  return o;
}
const en = 100;
function Hv(t, e, n = {}) {
  const s = n.minBpm ?? 70, o = n.maxBpm ?? 180, i = Math.max(1, Math.round(e / en)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / i);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let M = 0; M < a; M++) {
    let A = 0;
    for (let I = M * i; I < (M + 1) * i; I++) A += t[I] * t[I];
    l[M] = Math.log(1e-6 + A / i);
  }
  const c = new Float64Array(a);
  for (let M = 1; M < a; M++) c[M] = Math.max(0, l[M] - l[M - 1]);
  const h = c.reduce((M, A) => M + A, 0) / a;
  for (let M = 0; M < a; M++) c[M] = Math.max(0, c[M] - h);
  const u = Math.max(1, Math.floor(60 * en / o)), d = Math.min(a - 1, Math.ceil(60 * en / s)), f = (M) => {
    let A = 0;
    for (let I = M; I < a; I++) A += c[I] * c[I - M];
    return A / (a - M);
  };
  let g = 0;
  for (let M = 0; M < a; M++) g += c[M] * c[M];
  g /= a;
  let p = u, m = -1 / 0;
  for (let M = u; M <= d; M++) {
    const A = 60 * en / M, I = Math.exp(-0.5 * (Math.log2(A / 120) / 0.9) ** 2), P = f(M) * I;
    P > m && (m = P, p = M);
  }
  const b = (M) => {
    const A = Math.floor(M);
    return A < 0 || A + 1 >= a ? 0 : c[A] + (c[A + 1] - c[A]) * (M - A);
  }, k = (M, A) => {
    let I = 0;
    for (let P = A; P < a; P += M) I += b(P);
    return I;
  };
  let w = p, y = 0, v = -1 / 0;
  for (let M = p - 0.6; M <= p + 0.6 + 1e-9; M += 0.02) {
    if (M < 1) continue;
    const A = Math.max(1, Math.round(M * 4));
    for (let I = 0; I < A; I++) {
      const P = I / A * M, O = k(M, P);
      O > v && (v = O, y = P, w = M);
    }
  }
  const E = 60 * en / w, T = g > 0 ? Math.max(0, Math.min(1, f(p) / g)) : 0, x = (y + 0.5) * 1e3 / en;
  return { bpm: Math.round(E * 100) / 100, offset: Math.round(x % (6e4 / E)), confidence: T };
}
const vf = 600, Mf = 250, Wa = 1;
function Cv(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, o = {}, i = (u, d, f, g) => {
    const p = o[u] ??= [];
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
    for (const p of ["x", "y", "scale", "rotate"]) i(p, u, g[p], f);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((u, d) => u.at - d.at), h = c.filter((u) => !("shake" in u));
  h.length > 0 && a(0, l);
  for (const u of h)
    if ("frame" in u) {
      const d = Math.max(Wa, u.duration ?? vf);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + d, l, u.easing ?? (d > Wa ? "ease-in-out" : void 0));
    } else {
      const { follow: d } = u, f = d.lag ?? Mf, g = new Ct({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: d.x }] }), p = (k) => g.getStateAtTime(k).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...d.x.map((k) => k.time).filter((k) => k > u.at && k < u.until), u.until];
      a(u.at, l);
      const b = (k) => ({
        focusX: p(k) + (d.lead ?? 0),
        focusY: d.y ?? l.focusY,
        scale: d.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const k of m) {
        const w = d.x.find((y) => y.time === k)?.easing;
        a(k + f, b(k), k === u.at ? "ease-in-out" : w);
      }
      l = b(u.until);
    }
  for (const u of c.filter((d) => "shake" in d)) {
    const d = u.shake.strength ?? 12, f = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = Ve(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at, 0);
    for (let b = u.at + g; b < u.at + u.duration; b += g) {
      const k = 1 - (b - u.at) / u.duration;
      i("shakeX", b, m() * d * k), i("shakeY", b, m() * d * k), i("shakeRotate", b, m() * f * k);
    }
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(o).map(([u, d]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: d }));
}
function xf(t, e) {
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
function Zs(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let o, i = 1 / 0;
  for (const r of e) {
    const a = xf(t, r);
    a < i && (i = a, o = r);
  }
  return o !== void 0 && i <= Math.max(2, Math.floor(t.length / 3)) ? o : void 0;
}
function dt(t, e, n, s) {
  const o = typeof e == "string" ? s ?? Zs(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${o ? `: did you mean "${o}"?` : "."} Known: ${n.join(", ")}`;
}
function Ns(t, e) {
  const n = e.step ?? 33, s = e.stiffness ?? 120, o = e.damping ?? 9, i = e.mass ?? 1;
  let r = t(e.start), a = 0;
  const l = [{ time: e.start, value: r }];
  let c = e.start + n;
  for (let h = e.start + 1; h <= e.end; h++) {
    const d = s * (t(h) - r) - o * a;
    a += d / i * 1e-3, r += a * 1e-3, (h >= c || h === e.end) && (l.push({ time: h, value: r }), c += n);
  }
  return l;
}
function En(t, e, n = 1) {
  if (!(e > 0)) return 0;
  const s = t * n / e;
  return s - Math.floor(s);
}
function $h(t) {
  const e = t - Math.floor(t);
  return 1 - Math.abs(e * 2 - 1);
}
function Rv(t, e) {
  const n = Math.max(1, Math.round(e.cycles ?? 1)), s = e.amplitude ?? 1, o = En(t, e.period, n) + (e.phase ?? 0), i = o - Math.floor(o);
  switch (e.shape ?? "sine") {
    case "triangle":
      return s * ($h(i + 0.25) * 2 - 1);
    case "square":
      return i < 0.5 ? s : -s;
    default:
      return s * Math.sin(i * Math.PI * 2);
  }
}
function Lv(t, e) {
  const n = Math.max(1, Math.round(e.cycles ?? 1)), s = typeof e.easing == "function" ? e.easing : Rt(e.easing ?? "ease-in-out"), o = En(t, e.period, n) + (e.phase ?? 0);
  return s($h(o));
}
function Wv(t, e) {
  const n = Ph(e.seed), s = Math.max(1, Math.round(e.cycles ?? 1)), o = (En(t, e.period, 1) + (e.phase ?? 0)) * Math.PI * 2, i = s / Math.PI;
  return Ih([Math.cos(o) * i + 7.31, Math.sin(o) * i + 3.17], n, e.octaves ?? 1);
}
function Fv(t, e, n) {
  const s = Ph(n.seed), o = Math.max(1, Math.round(n.cycles ?? 1)), i = Math.max(1, Math.round(n.cyclesAlong ?? 1)), r = En(t, n.period, 1) * Math.PI * 2, a = En(e, n.periodAlong, 1) * Math.PI * 2, l = o / Math.PI, c = i / Math.PI;
  return Ih([Math.cos(r) * l + 5.13, Math.sin(r) * l + 9.47, Math.cos(a) * c + 2.71, Math.sin(a) * c + 6.29], s, n.octaves ?? 1);
}
const Ph = (t) => typeof t == "string" ? Zt(t) : (t ?? 0) >>> 0;
function Ih(t, e, n) {
  const s = Math.max(1, Math.min(6, Math.round(n)));
  let o = 0, i = 1, r = 0;
  for (let a = 0; a < s; a++) {
    const l = 2 ** a;
    o += i * Sf(t.map((c) => c * l), e + a * 1013), r += i, i *= 0.5;
  }
  return o / r;
}
function Sf(t, e) {
  const n = t.length, s = t.map(Math.floor), i = t.map((a, l) => a - s[l]).map((a) => a * a * (3 - 2 * a));
  let r = 0;
  for (let a = 0; a < 1 << n; a++) {
    let l = 1;
    const c = [];
    for (let h = 0; h < n; h++) {
      const u = a >> h & 1;
      l *= u ? i[h] : 1 - i[h], c.push(s[h] + u);
    }
    l !== 0 && (r += l * Tf(c, e));
  }
  return r;
}
function Tf(t, e) {
  let n = (e ^ 2654435769) >>> 0;
  for (const s of t)
    n = Math.imul(n ^ (s | 0), 2246822507) >>> 0, n = (n ^ n >>> 13) >>> 0, n = Math.imul(n, 3266489909) >>> 0, n = (n ^ n >>> 16) >>> 0;
  return n / 4294967296 * 2 - 1;
}
function Nv(t, e = {}) {
  if (t.length === 0) throw new Error("curve: needs at least one key");
  const s = { id: "curve", target: "curve", property: "value", keyframes: t.map((i) => ({ time: i.at, value: i.value, easing: i.easing })).sort((i, r) => i.time - r.time), interpolation: e.interpolation }, o = new Fs(s);
  return (i) => o.getValueAtTime(i);
}
function Dv(t, e) {
  return e * So({ bpm: t.bpm });
}
function Bv(t, e) {
  const n = Math.max(1, Math.round(t / So(e)));
  return { beats: n, grid: { ...e, bpm: n * 6e4 / t } };
}
function zv(t, e, n = {}) {
  const s = Math.max(1e-6, n.attack ?? 0.05), o = Math.max(1e-6, n.decay ?? 0.4), i = To(e, t), r = i - Math.floor(i), a = r < s ? r / s : Math.max(0, 1 - (r - s) / o), l = n.barAccent ?? 0;
  if (l <= 0) return a;
  const c = Math.max(1, Math.round(e.beatsPerBar ?? 4)), u = (Math.floor(i) % c + c) % c === 0;
  return a * (u ? 1 + l : 1) / (1 + l);
}
function qv(t, e, n = {}) {
  const s = n.fps ?? 30, o = Math.max(1, Math.round(e / s)), i = Math.max(1, Math.ceil(t.length / o)), r = new Float32Array(i), a = Math.min(0.99, Math.max(0, n.smoothing ?? 0.5));
  let l = 0, c = 0;
  for (let h = 0; h < i; h++) {
    let u = 0;
    const d = h * o, f = Math.min(t.length, d + o);
    for (let p = d; p < f; p++) u += t[p] * t[p];
    const g = f > d ? Math.sqrt(u / (f - d)) : 0;
    l = g > l ? g : l * a + g * (1 - a), r[h] = l, c = Math.max(c, l);
  }
  if (n.normalize !== !1 && c > 0) for (let h = 0; h < i; h++) r[h] /= c;
  return r;
}
function Yv(t, e, n = 30, s) {
  if (t.length === 0) return 0;
  const i = (s ? En(e, s) * s : e) * n / 1e3, r = Math.floor(i), a = t[Math.min(t.length - 1, Math.max(0, r))], l = t[Math.min(t.length - 1, Math.max(0, r + 1))];
  return a + (l - a) * (i - r);
}
const ie = (t) => Math.round(t * 1e3) / 1e3;
function Ef(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, o = t.length;
  let i = `M${ie(t[0].x)} ${ie(t[0].y)}`;
  if (o === 1) return i;
  const r = (l) => s ? t[(l % o + o) % o] : t[Math.max(0, Math.min(o - 1, l))], a = s ? o : o - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), d = r(l + 2);
    if (n === 0) {
      i += ` L${ie(u.x)} ${ie(u.y)}`;
      continue;
    }
    const f = n / 6, g = h.x + (u.x - c.x) * f, p = h.y + (u.y - c.y) * f, m = u.x - (d.x - h.x) * f, b = u.y - (d.y - h.y) * f;
    i += ` C${ie(g)} ${ie(p)} ${ie(m)} ${ie(b)} ${ie(u.x)} ${ie(u.y)}`;
  }
  return s ? `${i} Z` : i;
}
const It = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function Af(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function Tr(t) {
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
      const n = Af(e.points);
      if (n.length === 0) return null;
      const s = n.map((o, i) => `${i === 0 ? "M" : "L"}${o.x} ${o.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function jv(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), o = Math.max(0, n.length), i = n.since !== void 0 ? Math.max(e - o, n.since) : e - o;
  if (i >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = i + (e - i) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: o > 0 ? (e - c) / o : 0 });
  }
  return a;
}
const $f = 2.5;
function Pf(t) {
  const e = [], n = [], s = t.length, o = (i, r) => {
    for (let a = i + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[i].x) * r, c = (t[a].y - t[i].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let i = 0; i < s; i++) {
    const r = t[i], a = o(i, -1), l = o(i, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let u = c[0] + h[0], d = c[1] + h[1];
    const f = Math.hypot(u, d);
    f < 1e-9 ? (u = c[0], d = c[1]) : (u /= f, d /= f);
    const g = u * c[0] + d * c[1], p = Math.min($f, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - d * m, y: r.y + u * m }), n.push({ x: r.x + d * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function If(t) {
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
const Kv = { scale: 1, turn: 0, x: 0, y: 0 };
function Xv(t = {}) {
  return { scale: t.scale ?? 1, turn: t.turn ?? 0, x: t.x ?? 0, y: t.y ?? 0 };
}
function Of(t, e, n) {
  const { ax: s, ay: o } = Eo(t, e);
  return { scale: t, turn: e, x: n.x - (s * n.x - o * n.y), y: n.y - (o * n.x + s * n.y) };
}
function Oh(t, e) {
  const { ax: n, ay: s } = Eo(t.scale, t.turn);
  return { x: n * e.x - s * e.y + t.x, y: s * e.x + n * e.y + t.y };
}
function Uv(t, e) {
  const n = Oh(e, { x: t.x, y: t.y });
  return { scale: t.scale * e.scale, turn: t.turn + e.turn, x: n.x, y: n.y };
}
function Gv(t) {
  if (t.scale === 0) throw new Error("invertSimilarity: a scale of 0 cannot be undone");
  const e = { scale: 1 / t.scale, turn: -t.turn, x: 0, y: 0 }, n = Oh(e, { x: t.x, y: t.y });
  return { ...e, x: -n.x, y: -n.y };
}
function _f(t) {
  const { ax: e, ay: n } = Eo(t.scale, t.turn), s = 1 - e, o = -n, i = s * s + o * o;
  return i < 1e-18 ? null : { x: (t.x * s + t.y * o) / i, y: (t.y * s - t.x * o) / i };
}
function Vv(t, e) {
  if (t.scale <= 0) throw new Error("powSimilarity: the scale must be positive");
  const n = Math.pow(t.scale, e), s = t.turn * e, o = _f(t);
  return o ? Of(n, s, o) : { scale: n, turn: s, x: t.x * e, y: t.y * e };
}
function Jv(t) {
  const { ax: e, ay: n } = Eo(t.scale, t.turn);
  return [e, n, -n, e, t.x, t.y];
}
const Eo = (t, e) => {
  const n = e * Math.PI / 180;
  return { ax: t * Math.cos(n), ay: t * Math.sin(n) };
};
function Er([t, e, n], s = {}) {
  const o = s.scale ?? 1, i = s.centre ?? { x: 0, y: 0 }, r = Math.sqrt(3) / 2;
  return { x: i.x + (t - e) * r * o, y: i.y + ((t + e) * 0.5 - n) * o };
}
const _h = ([t, e, n]) => t + e + n;
function Hh(t, e = {}) {
  const [n, s, o] = t.min, [i, r, a] = t.max, l = (d) => Er(d, e), c = [(n + i) / 2, (s + r) / 2, (o + a) / 2], h = _h(c), u = [
    { side: "top", depth: h, tag: t.tag, points: [l([n, s, a]), l([i, s, a]), l([i, r, a]), l([n, r, a])] },
    { side: "left", depth: h, tag: t.tag, points: [l([n, r, o]), l([i, r, o]), l([i, r, a]), l([n, r, a])] },
    { side: "right", depth: h, tag: t.tag, points: [l([i, s, o]), l([i, r, o]), l([i, r, a]), l([i, s, a])] }
  ];
  return t.hide ? u.filter((d) => !t.hide.includes(d.side)) : u;
}
function Ch(t, e = {}) {
  return t.map((n) => ({ box: n, depth: _h([(n.min[0] + n.max[0]) / 2, (n.min[1] + n.max[1]) / 2, (n.min[2] + n.max[2]) / 2]) })).sort((n, s) => n.depth - s.depth).flatMap(({ box: n }) => Hh(n, e));
}
function Zv(t = {}) {
  const e = t.size ?? 10, s = (t.thickness ?? 2) / 2, o = [
    { tag: 0, min: [-s, -s, -s], max: [e - s, s, s] },
    { tag: 1, min: [e - s, -s, -s], max: [e + s, e - s, s] },
    { tag: 2, min: [e - s, e - s, -s], max: [e + s, e + s, e] }
  ], i = t.centre ?? { x: 0, y: 0 }, r = Er([2 * e / 3, e / 3, e / 3], { scale: t.scale }), a = { centre: { x: i.x - r.x, y: i.y - r.y }, scale: t.scale };
  return { boxes: o, faces: [...Ch(o, a), ...Hh({ ...o[0], hide: ["right"] }, a)] };
}
function Qv(t = {}) {
  const e = Math.max(2, Math.round(t.steps ?? 8)), n = t.tread ?? 1.5, s = t.rise ?? 0.25, o = t.width ?? 3, i = t.base ?? 1.5, r = Math.max(1, Math.round(e * (n - 2 * s) / (n + 2 * s))), a = 2 * (e + r), l = n * (e - r) / a, c = [
    { dir: [1, 0, 0], across: [0, 1, 0], count: e },
    { dir: [0, 1, 0], across: [-1, 0, 0], count: e },
    { dir: [-1, 0, 0], across: [0, -1, 0], count: r },
    { dir: [0, -1, 0], across: [1, 0, 0], count: r }
  ], h = [];
  let u = [0, 0, 0], d = 0;
  for (const b of c) {
    for (let k = 0; k < b.count; k++) {
      const w = d * l, y = [u[0] + b.dir[0] * k * n, u[1] + b.dir[1] * k * n, 0], v = [y[0] + b.dir[0] * n + b.across[0] * o, y[1] + b.dir[1] * n + b.across[1] * o, 0];
      h.push({
        tag: d,
        min: [Math.min(y[0], v[0]), Math.min(y[1], v[1]), 0],
        max: [Math.max(y[0], v[0]), Math.max(y[1], v[1]), w + i]
      }), d++;
    }
    u = [u[0] + b.dir[0] * b.count * n, u[1] + b.dir[1] * b.count * n, 0];
  }
  const f = a * l, g = t.centre ?? { x: 0, y: 0 }, p = Er([e * n / 2, e * n / 2, f / 2 + i], { scale: t.scale }), m = { centre: { x: g.x - p.x, y: g.y - p.y }, scale: t.scale };
  return { boxes: h, faces: Ch(h, m), rise: l };
}
function Hf(t, e, n) {
  let s = 0;
  for (const o of t) {
    const i = (e - o.x) ** 2 + (n - o.y) ** 2;
    s += i > 1e-9 ? o.r * o.r / i : 1e9;
  }
  return s;
}
function tM(t, e = {}) {
  if (t.length === 0) return [];
  const n = e.threshold ?? 1, s = Math.max(0.5, e.cell ?? 4), o = Math.sqrt(1 / n) * 1.6, i = e.bounds ?? {
    x: Math.min(...t.map((f) => f.x - f.r * o)),
    y: Math.min(...t.map((f) => f.y - f.r * o)),
    width: Math.max(...t.map((f) => f.x + f.r * o)) - Math.min(...t.map((f) => f.x - f.r * o)),
    height: Math.max(...t.map((f) => f.y + f.r * o)) - Math.min(...t.map((f) => f.y - f.r * o))
  }, r = Math.max(2, Math.ceil(i.width / s) + 1), a = Math.max(2, Math.ceil(i.height / s) + 1), l = new Float64Array(r * a);
  for (let f = 0; f < a; f++) for (let g = 0; g < r; g++) l[f * r + g] = Hf(t, i.x + g * s, i.y + f * s) - n;
  const c = (f, g) => l[g * r + f], h = (f, g, p, m, b, k) => {
    const w = p === k ? 0.5 : p / (p - k);
    return { x: f + (m - f) * w, y: g + (b - g) * w };
  }, u = [];
  for (let f = 0; f + 1 < a; f++)
    for (let g = 0; g + 1 < r; g++) {
      const p = i.x + g * s, m = i.y + f * s, b = p + s, k = m + s, w = [c(g, f), c(g + 1, f), c(g + 1, f + 1), c(g, f + 1)], y = (w[0] > 0 ? 1 : 0) | (w[1] > 0 ? 2 : 0) | (w[2] > 0 ? 4 : 0) | (w[3] > 0 ? 8 : 0);
      if (y === 0 || y === 15) continue;
      const v = () => h(p, m, w[0], b, m, w[1]), E = () => h(b, m, w[1], b, k, w[2]), T = () => h(p, k, w[3], b, k, w[2]), x = () => h(p, m, w[0], p, k, w[3]), M = (w[0] + w[1] + w[2] + w[3]) / 4 > 0;
      switch (y) {
        case 1:
        case 14:
          u.push([x(), v()]);
          break;
        case 2:
        case 13:
          u.push([v(), E()]);
          break;
        case 3:
        case 12:
          u.push([x(), E()]);
          break;
        case 4:
        case 11:
          u.push([E(), T()]);
          break;
        case 6:
        case 9:
          u.push([v(), T()]);
          break;
        case 7:
        case 8:
          u.push([x(), T()]);
          break;
        case 5:
          M ? u.push([x(), T()], [v(), E()]) : u.push([x(), v()], [E(), T()]);
          break;
        case 10:
          M ? u.push([x(), v()], [E(), T()]) : u.push([x(), T()], [v(), E()]);
          break;
      }
    }
  const d = Cf(u);
  return e.smooth === !1 ? d : d.map((f) => Fa(Fa(f)));
}
function Cf(t) {
  const e = (i) => `${Math.round(i.x * 1e3)},${Math.round(i.y * 1e3)}`, n = /* @__PURE__ */ new Map();
  t.forEach(([i, r], a) => {
    for (const l of [i, r]) {
      const c = e(l);
      n.has(c) || n.set(c, []), n.get(c).push(a);
    }
  });
  const s = new Array(t.length).fill(!1), o = [];
  for (let i = 0; i < t.length; i++) {
    if (s[i]) continue;
    s[i] = !0;
    const r = [t[i][0], t[i][1]];
    let a = t[i][1];
    for (; ; ) {
      const l = (n.get(e(a)) ?? []).find((u) => !s[u]);
      if (l === void 0) break;
      s[l] = !0;
      const [c, h] = t[l];
      if (a = e(c) === e(a) ? h : c, e(a) === e(r[0])) break;
      r.push(a);
    }
    r.length >= 3 && o.push(r);
  }
  return o;
}
function Fa(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const s = t[n], o = t[(n + 1) % t.length];
    e.push({ x: s.x * 0.75 + o.x * 0.25, y: s.y * 0.75 + o.y * 0.25 }, { x: s.x * 0.25 + o.x * 0.75, y: s.y * 0.25 + o.y * 0.75 });
  }
  return e;
}
function eM(t) {
  const e = Math.min(1, Math.max(0, t.progress));
  if (e <= 0) return [];
  const n = t.width / 2, s = n * (0.55 + 0.75 * e), o = Math.max(t.length * e, s * 1.2), i = t.x, r = t.y + o - s, a = Math.max(0.1, n * (0.35 - 0.3 * e)), l = r - Math.sqrt(Math.max(0, s * s - a * a)), c = Math.max(0, l - t.y), h = 8, u = [], d = [];
  for (let k = 0; k <= h; k++) {
    const w = k / h, y = a + (n - a) * Math.pow(1 - w, 1.6 + 1.4 * e);
    u.push({ x: i - y, y: t.y + c * w }), d.push({ x: i + y, y: t.y + c * w });
  }
  const f = Math.max(8, Math.round(t.segments ?? 12)), g = Math.acos(Math.min(1, a / s)), p = -g, m = Math.PI + g, b = [];
  for (let k = 1; k < f; k++) {
    const w = p + (m - p) * k / f;
    b.push({ x: i + Math.cos(w) * s, y: r + Math.sin(w) * s });
  }
  return [...d, ...b, ...u.reverse()];
}
function nM(t) {
  const e = Math.min(1, Math.max(0, t.grow ?? 1)), n = e >= 1 ? 1 : 1 - Math.pow(1 - e, 3) + 0.08 * Math.sin(e * Math.PI) * e, s = t.r * Math.max(0, n);
  if (s <= 0) return [];
  const o = Math.max(12, Math.round(t.segments ?? 48)), i = t.wobble ?? 0.05, r = t.time ?? 0, a = t.period ? r / t.period : r / 2500, l = (a - Math.floor(a)) * Math.PI * 2, c = t.seed ?? 0, h = [];
  for (let u = 0; u < o; u++) {
    const d = u / o * Math.PI * 2, f = 1 + i * (Math.sin(2 * d + l + c) * 0.6 + Math.sin(3 * d - 2 * l + c * 1.7) * 0.4);
    h.push({ x: t.x + Math.cos(d) * s * f, y: t.y + Math.sin(d) * s * f });
  }
  return h;
}
function sM(t) {
  const e = t.progress;
  if (e <= 0 || e >= 1) return [];
  const n = Math.max(3, Math.round(t.pieces ?? 8)), s = [], o = t.r * (1 + 1.2 * e), i = Math.PI * 2 / n * 0.6 * (1 - e);
  for (let r = 0; r < n; r++) {
    const a = r / n * Math.PI * 2 + 0.3, l = [];
    for (let c = 0; c <= 4; c++) {
      const h = a - i / 2 + i * c / 4;
      l.push({ x: t.x + Math.cos(h) * o, y: t.y + Math.sin(h) * o });
    }
    s.push(l);
  }
  return s;
}
function oM(t, e = {}) {
  const n = Math.max(0.05, 1 + t);
  return { sx: e.keep === "volume" ? 1 / Math.sqrt(n) : 1 / n, sy: n };
}
function iM(t, e, n = { x: 0, y: 0 }) {
  return t.map((s) => ({ x: n.x + (s.x - n.x) * e.sx, y: n.y + (s.y - n.y) * e.sy }));
}
function Ds(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function On(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function bn(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function Ae(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Qs(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Ao(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function Ar(t, e) {
  return Ao(On(t, e));
}
function Ue(t) {
  const e = Ao(t);
  return e === 0 ? [0, 0, 0] : bn(t, 1 / e);
}
function Rh(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const rM = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: Ds,
  cross: Qs,
  distance: Ar,
  dot: Ae,
  length: Ao,
  lerp: Rh,
  normalize: Ue,
  scale: bn,
  subtract: On
}, Symbol.toStringTag, { value: "Module" })), Rf = Math.PI / 180;
function $o() {
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
function ze(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function se(t) {
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
function $r(t, e, n) {
  const s = se(e);
  for (let o = 0; o < 3; o++)
    s[o] *= n[0], s[4 + o] *= n[1], s[8 + o] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function Lf(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function Pr(t) {
  const [e, n, s, o, i, r, a, l, c, h, u, d, f, g, p, m] = t, b = e * r - n * i, k = e * a - s * i, w = e * l - o * i, y = n * a - s * r, v = n * l - o * r, E = s * l - o * a, T = c * g - h * f, x = c * p - u * f, M = c * m - d * f, A = h * p - u * g, I = h * m - d * g, P = u * m - d * p, O = b * P - k * I + w * A + y * M - v * x + E * T;
  if (Math.abs(O) < 1e-12) return null;
  const _ = 1 / O;
  return [
    (r * P - a * I + l * A) * _,
    (s * I - n * P - o * A) * _,
    (g * E - p * v + m * y) * _,
    (u * v - h * E - d * y) * _,
    (a * M - i * P - l * x) * _,
    (e * P - s * M + o * x) * _,
    (p * w - f * E - m * k) * _,
    (c * E - u * w + d * k) * _,
    (i * I - r * M + l * T) * _,
    (n * M - e * I - o * T) * _,
    (f * v - g * w + m * b) * _,
    (h * w - c * v - d * b) * _,
    (r * x - i * A - a * T) * _,
    (e * A - n * x + s * T) * _,
    (g * k - f * y - p * b) * _,
    (c * y - h * k + u * b) * _
  ];
}
function Wf(t, e, n, s) {
  const o = 1 / Math.tan(t * Rf / 2), i = 1 / (n - s);
  return [o / e, 0, 0, 0, 0, o, 0, 0, 0, 0, (s + n) * i, -1, 0, 0, 2 * s * n * i, 0];
}
function Ff(t, e, n, s, o, i) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (i - o);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(i + o) * l, 1];
}
function Nf(t, e, n = [0, 1, 0]) {
  const s = Ue(On(t, e)), o = Ue(Qs(n, s)), i = Qs(s, o);
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
function jt(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], o = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], i = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return i === 1 || i === 0 ? [n, s, o] : [n / i, s / i, o / i];
}
const aM = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: $r,
  fromQuat: se,
  identity: $o,
  invert: Pr,
  lookAt: Nf,
  multiply: At,
  orthographic: Ff,
  perspective: Wf,
  scaling: ze,
  transformPoint: jt,
  translation: Re,
  transpose: Lf
}, Symbol.toStringTag, { value: "Module" })), Ms = {
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
}, Na = {
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
function Df(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Rt({ type: "bounce", mode: "in" });
Rt({ type: "bounce", mode: "in-out" });
function to(t) {
  const e = Lh.get(t.trim().toLowerCase());
  if (e) return e;
  const n = Df(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Rt(r) };
  }
  const o = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (o) {
    const [, i, r, a] = o, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (i === "back" && l.length === 0 && n in Ms)
      return { easing: { type: "cubic-bezier", points: Ms[n] } };
    const h = i === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : i === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Rt(h) };
  }
  return n in Na ? { easing: Na[n] } : n in Ms ? { easing: { type: "cubic-bezier", points: Ms[n] } } : { easing: "ease-out" };
}
const Lh = /* @__PURE__ */ new Map();
function Ir(t, e) {
  return Lh.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function Fi(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const Wh = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Fh(t) {
  return typeof t == "string" && Wh.test(t);
}
function Bf(t = 1) {
  let e = Fi(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), o = (l, c, h, u, d) => c === l ? h : h + (d - l) / (c - l) * (u - h), i = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return Da(l, c, 1 / 0);
    if ("values" in l) return Da(l.values, c, l.radius ?? 1 / 0);
    const h = Math.round(c / l.increment) * l.increment;
    return Math.abs(h - c) <= (l.radius ?? 1 / 0) ? h : c;
  }, r = (l, c, h) => {
    const u = l + e() * (c - l);
    return h ? Math.round(u / h) * h : u;
  };
  return {
    clamp: n(3, s),
    mapRange: n(5, o),
    normalize: n(3, (l, c, h) => o(l, c, 0, 1, h)),
    interpolate: n(3, (l, c, h) => {
      if (typeof l == "object" && !Array.isArray(l)) {
        const u = {};
        for (const d of Object.keys(l))
          u[d] = Js(l[d])(l[d], c[d], h);
        return u;
      }
      return Js(l)(l, c, h);
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
    snap: n(2, i),
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
      const m = p.length, k = Mr(f, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), w = c !== void 0 ? c : (h ?? 1) * ah(m, u), y = d && w > 0 ? d(k / w) * w : k;
      return l + y;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => zf(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = Fi(l);
    },
    resolveRandomString: (l) => {
      const c = Wh.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, d] = c.split(",").map((f) => Number.parseFloat(f));
      return r(h, u, Number.isFinite(d) ? d : void 0);
    }
  };
}
function Da(t, e, n) {
  let s = e, o = 1 / 0;
  for (const i of t) {
    const r = Math.abs(i - e);
    r < o && (o = r, s = i);
  }
  return o <= n ? s : e;
}
function zf(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const i = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return i.length >= 4 ? [i[0], i[1], i[2], Math.round(i[3] / 255 * 1e3) / 1e3] : [i[0], i[1], i[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((o) => Number.parseFloat(o));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const qf = /^([+-])=\s*(-?[\d.]+)$/, Yf = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Rn(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const o = t.trim();
  if (o === "") return e.cursor;
  const i = qf.exec(o);
  if (i) {
    const c = s(i[2]);
    return e.cursor + (i[1] === "-" ? -c : c);
  }
  const r = Yf.exec(o);
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
function jf(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function Kf(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, o = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), i = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (o - 1) } : typeof r == "number" ? i(Math.max(0, Math.min(t - 1, r))) : r === "end" ? i(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (o - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = i(g), b = Math.abs(p - a.x), k = Math.abs(m - a.y);
    return e.axis === "x" ? b : e.axis === "y" ? k : Math.hypot(b, k);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, d = e.ease ? to(e.ease) : void 0, f = d ? d.fn ?? Rt(d.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (f ? f(p) : p) * u;
  });
}
const Or = /* @__PURE__ */ new Set([
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
]), Xf = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Bs(t) {
  const e = {}, n = {};
  for (const [s, o] of Object.entries(t))
    Or.has(s) ? e[s] = o : n[Xf[s] ?? s] = o;
  return { config: e, properties: n };
}
function eo(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function Ni(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : jf(t) ? { offsets: Kf(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const Uf = {
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
function Nh(t) {
  return Uf[t];
}
function Gf(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = Ef(e.path, { curviness: e.curviness });
  else if (gs(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function Vf(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function Dh(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function Jf(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = Dh(e);
  if (typeof s != "string" || !gs(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Zf(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, Ba(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return Ba(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const o = s(n[0]), i = s(n[1]);
  return o <= i ? [o, i] : [i, o];
}
function Qf(t, e) {
  const [n, s] = Zf(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function tp(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...Qf(n, e) };
}
function ep(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function Ba(t, e) {
  return Math.max(0, Math.min(e, t));
}
function np(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function sp(t, e, n) {
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
      seed: o.seed ?? np(`${e}|${o.text}`)
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
function _r(t) {
  return Math.max(0.1, t / 25);
}
function op(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? _r(n.resistance) : void 0), o = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? o.end = [n.end(Vs(o))] : n.end !== void 0 && (o.end = Array.isArray(n.end) ? [...n.end] : n.end), o;
}
function ip(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in Yo))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(Yo).join(", ")}`
    );
  return {
    ...e.preset ? Yo[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function rp(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class yn {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Fi(1);
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
    return this.build(e, void 0, Ln(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: o, properties: i } = Bs(Ln(n)), { motionPath: r, text: a, scrambleText: l, ...c } = i, h = this.targetsOf(e)[0], u = { ...o };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = Vf(r));
    const d = {}, f = String(this.resolveStart(h, "text"));
    return a !== void 0 && (d.text = Jo(a), u.text = typeof a == "object" ? { ...a, value: f } : f), l !== void 0 && (d.text = Jo(l), u.scrambleText = typeof l == "object" ? { ...l, text: f } : f), this.build(e, { ...c, ...d }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, o) {
    const { properties: i } = Bs(Ln(n));
    return this.build(e, i, Ln(s), o);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Ln(n), duration: 0 }, s);
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
    const n = Math.max(0, Rn(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return Rn(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, Rn(n, this.context())), this;
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
    const s = Rn(n, this.context());
    for (const i of e.timeline.tracks) {
      if (!("keyframes" in i)) continue;
      const r = Wi({
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
    const { config: i, properties: r } = Bs(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, d = this.targetsOf(e), f = Rn(o, this.context()), g = eo(i.delay, 0), p = eo(i.duration, 500), m = Ni(i.stagger, {
      count: d.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(d) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), b = this.easingFor(i.ease), k = [], w = i.spring;
    let y = 0, v = !1;
    for (const [I, P] of Object.entries(u)) {
      const O = P;
      let _ = n?.[I] !== void 0 ? n[I] : this.resolveStart(d[0], I);
      if (typeof _ != typeof O && (this.warn(
        `no usable start value for "${I}" on "${d[0]}" — it will snap to ${String(O)}. Use fromTo() to animate it.`
      ), _ = O), w !== void 0 && (typeof _ != "number" || typeof O != "number") && this.warn(`spring works on numbers, so "${I}" on "${d[0]}" eases instead`), w !== void 0 && typeof _ == "number" && typeof O == "number") {
        const K = {
          ...ip(w),
          from: _,
          to: O,
          velocity: rp(w, I) ?? this.options.startVelocity?.(d[0], I) ?? 0
        }, V = this.nextTrackId(`${d[0]}-${I}-spring`), j = {
          id: V,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: I,
          kind: "spring",
          spring: K,
          delay: f + g
        };
        this.timeline.addTrack(j), k.push(V), y = Math.max(y, ed(K));
        for (const S of d) this.lastValues.set(`${S}|${I}`, O);
        continue;
      }
      v = !0;
      const W = this.keyframesFor(_, O, p, b, i.ease), B = this.nextTrackId(`${d[0]}-${I}`);
      this.timeline.addTrack(
        Wi({
          id: B,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: I,
          delay: f + g,
          keyframes: W,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...I === "quaternion" && { interpolation: "slerp" }
        })
      ), k.push(B);
      for (const K of d) this.lastValues.set(`${K}|${I}`, O);
    }
    const E = sp({ text: l, scrambleText: c }, d[0], p);
    if (E) {
      const I = n?.text ?? n?.scrambleText, P = I !== void 0 ? Jo(I) : this.resolveStart(d[0], "text"), O = this.nextTrackId(`${d[0]}-text`), _ = {
        id: O,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof P == "string" ? P : String(P ?? ""), ...E },
        delay: f + g,
        keyframes: this.keyframesFor(0, 1, p, b, i.ease)
      };
      this.timeline.addTrack(_), k.push(O);
      for (const W of d) this.lastValues.set(`${W}|text`, E.to);
    }
    if (a !== void 0) {
      const { config: I, start: P, end: O } = Gf(a), _ = this.nextTrackId(`${d[0]}-motionPath`), W = {
        id: _,
        target: d[0],
        ...d.length > 1 && { targets: d },
        ...m && d.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: I,
        delay: f + g,
        keyframes: this.keyframesFor(P, O, p, b, i.ease)
      };
      this.timeline.addTrack(W), k.push(_);
    }
    if (h !== void 0)
      for (const [I, P] of Object.entries(h)) {
        const O = this.resolveStart(d[0], I);
        if (typeof O != "number") {
          this.warn(`inertia on "${I}" needs a numeric start value; skipped`);
          continue;
        }
        const _ = op(O, P), W = this.nextTrackId(`${d[0]}-${I}-inertia`), B = {
          id: W,
          target: d[0],
          ...d.length > 1 && { targets: d },
          ...m && d.length > 1 && { stagger: m },
          property: I,
          kind: "inertia",
          inertia: _,
          delay: f + g
        };
        this.timeline.addTrack(B), k.push(W), y = Math.max(y, ps(_));
        for (const K of d) this.lastValues.set(`${K}|${I}`, fs(_));
      }
    const M = ((h !== void 0 || w !== void 0) && !v && !E && a === void 0 ? y : Math.max(p, y)) + (m && d.length > 1 ? ko(d.length, m) : 0), A = f + g + M;
    return this.previousStart = f + g, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: k,
      start: f + g,
      end: A,
      kill: () => {
        for (const I of k) this.timeline.removeTrack(I);
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
    const a = typeof i == "string" ? to(i) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Gs(o)) {
      const c = a?.fn ?? Rt(o);
      return [r, ...kh(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    const r = Nh(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return to(e).easing;
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
function Jo(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function ap(t) {
  return new yn(t);
}
function Ln(t) {
  return ep(Jf(t));
}
function lp(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${se(Te(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const cp = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), hp = "#ffffff", up = "rgba(0, 0, 0, 0.5)";
function dp(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? hp})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, o = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${o}px ${t.shadowColor ?? up})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function fp(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function pp(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const za = /* @__PURE__ */ new Set([
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
]), gp = /* @__PURE__ */ new Set([
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
]), mp = [
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
], yp = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), bp = /* @__PURE__ */ new Set(["originX", "originY"]), wp = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), kp = /* @__PURE__ */ new Set(["drawOn"]), vp = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, qa = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Mp = "http://www.w3.org/2000/svg";
class qe {
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
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !kp.has(g)) {
        if (gp.has(g))
          (s ??= {})[g] = p;
        else if (yp.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (bp.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (wp.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (cp.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            fp(e, p);
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
      for (const g of mp) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && d.push(m);
      }
    if (d.length > 0 && (e.style.transform = d.join(" "), pp(e)), o && (o.childPerspective !== void 0 && (e.style.perspective = `${o.childPerspective}px`), (o.perspectiveOriginX !== void 0 || o.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${o.perspectiveOriginX ?? 50}% ${o.perspectiveOriginY ?? 50}%`)), i) {
      const g = i.originX ?? 50, p = i.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, b = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${b}%)`;
    }
    if (a) {
      const g = dp(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return lp(n);
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
    if (e.namespaceURI === Mp && n in qa) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[qa[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? o = "color" : o = vp[n] ?? n;
    let r;
    typeof s == "number" ? za.has(n) || za.has(o) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[o] = r;
  }
}
const xp = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Sp {
  adapter = new qe();
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
  utils = Bf();
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
    this.scheduler = e.scheduler ?? xp, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      Zo(s) && this.currentCollector?.touch(s, o), n.push(o);
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
    if (Zo(e)) return [e];
    if (!Tp(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return Zo(e) ? this.elementName(e) : this.objectName(e);
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
function Zo(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Tp(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function no(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const Ya = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Ep(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Ap(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function $p(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || Ya(t) ? { path: t } : t, { align: s, alignOrigin: o, path: i, ...r } = n, a = (E) => {
    const T = Ya(E) ? E : e.query(E);
    return T || e.warn(`gsap-compat: motionPath could not find "${String(E)}"`), T;
  };
  let l = null, c = "";
  if (Array.isArray(i) || typeof i == "string" && gs(i))
    c = i;
  else {
    l = a(i);
    const E = l && Tr({ tag: l.localName, attributes: Ep(l) });
    l && !E && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = E ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const d = e.targets[0];
  if (!d) return h;
  const [f, g, p, m, b, k] = Ap(u), w = no(d), [y, v] = o ?? [0.5, 0.5];
  for (const E of e.targets.slice(1)) {
    const T = no(E);
    if (Math.abs(T.left - w.left) > 0.5 || Math.abs(T.top - w.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [f, g, p, m, b - w.left - y * w.width, k - w.top - v * w.height], h;
}
const Bh = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function zh(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function qh(t) {
  if (!t) return null;
  const e = Tr({ tag: t.localName, attributes: zh(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function Pp(t, e, n) {
  const s = Dh(t);
  if (typeof s == "string" && gs(s)) return s;
  const o = Bh(s) ? s : typeof s == "string" ? e(s) : null, i = qh(o);
  return i || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const Ip = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Op(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : Bh(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const o = Tr({ tag: s.localName, attributes: zh(s) });
    if (!o || !s.parentNode) return s;
    const i = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      Ip.has(r.name) || i.setAttribute(r.name, r.value);
    return i.setAttribute("d", o), s.parentNode.replaceChild(i, s), i;
  });
}
const ja = 0.3;
class _p {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = Ka(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = Ka(), o = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const i = e / o * 1e3, r = n / o * 1e3;
    this.velocityX += (i - this.velocityX) * ja, this.velocityY += (r - this.velocityY) * ja;
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
function Ka() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Hp(t, e, n) {
  let s = { delta: 0, line: null }, o = n;
  for (const i of t)
    for (const r of e) {
      const a = Math.abs(r - i);
      a <= o && (o = a, s = { delta: r - i, line: r });
    }
  return s;
}
function Cp(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class Yh {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new _p({
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
    const o = (this.options.axis ?? "both") === "y" ? this.y : this.x, i = Rp(o / s);
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
      ...Cp([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], i = Hp([s], o, this.snapThreshold());
    s += i.delta, n === "x" ? this.snappedX = i.line : this.snappedY = i.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function Rp(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function lM(t) {
  const e = new Yh(t);
  return e.start(), e;
}
const Lp = { x: "x", y: "y", "x,y": "both" }, Di = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Xa(t, e) {
  const n = no(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function Ua(t) {
  return Array.isArray(t) ? [...t] : t;
}
function Wp(t, e, n, s = {}) {
  const [o] = e.resolveTargets(n), i = o ? e.elementFor(o) : void 0;
  if (!o || !i)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return Fp(t, e, o, i, s);
  const r = Lp[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(o, "x"), m = e.appliedValue(o, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Di(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Di(s.bounds) ? s.bounds : void 0) ?? (l ? Xa(i, l) : void 0) };
  let u = null;
  const d = () => {
    u?.kill(), u = null;
  }, f = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, b = m.friction ?? (m.resistance !== void 0 ? _r(m.resistance) : 4), k = a(), w = h.bounds ?? {};
    let y, v;
    const E = m.end;
    if (Array.isArray(E)) {
      const x = Vs({ from: k.x, velocity: r === "y" ? 0 : p.x, friction: b }), M = Vs({ from: k.y, velocity: r === "x" ? 0 : p.y, friction: b });
      let A = E[0];
      for (const I of E)
        Math.hypot(I.x - x, I.y - M) < Math.hypot(A.x - x, A.y - M) && (A = I);
      A && (y = [A.x], v = [A.y]);
    } else typeof E == "number" ? (y = E, v = E) : E && (y = Ua(E.x), v = Ua(E.y));
    const T = {};
    r !== "y" && (T.x = { velocity: p.x, friction: b, min: w.minX, max: w.maxX, end: y }), r !== "x" && (T.y = { velocity: p.y, friction: b, min: w.minY, max: w.maxY, end: v }), u = t.to(i, { inertia: T, onComplete: () => s.onThrowComplete?.() });
  }, g = new Yh({
    target: i,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      d(), l && (h.bounds = Xa(i, l)), s.onPress?.();
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
      d(), g.destroy();
    }
  };
}
function Fp(t, e, n, s, o) {
  const i = typeof o.bounds == "object" && o.bounds !== null && !Di(o.bounds) ? o.bounds : {}, r = () => {
    const w = e.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(i.maxRotation ?? 1 / 0, Math.max(i.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, d = 0, f = 0, g = [];
  const p = (w) => Math.atan2(w.clientY - u.y, w.clientX - u.x) * 180 / Math.PI, m = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const y = s.getBoundingClientRect();
    u = { x: y.left + y.width / 2, y: y.top + y.height / 2 }, d = p(w), f = r(), g = [{ time: performance.now(), rotation: f }], o.onPress?.();
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    const y = p(w);
    let v = y - d;
    v > 180 && (v -= 360), v < -180 && (v += 360), d = y, f += v;
    let E = a(f);
    o.snap && (E = a(Math.round(E / o.snap) * o.snap)), e.apply(n, { rotate: E });
    const T = performance.now();
    for (g.push({ time: T, rotation: E }); g.length > 2 && T - g[0].time > 100; ) g.shift();
    const x = { x: 0, y: 0 };
    o.onDrag?.(x);
  }, k = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const y = g[0], v = g[g.length - 1], E = y && v ? (v.time - y.time) / 1e3 : 0, T = E > 0 ? (v.rotation - y.rotation) / E : 0;
    if (o.onRelease?.({ x: T, y: 0 }), !o.inertia) return;
    const x = o.inertia === !0 ? {} : o.inertia, M = x.friction ?? (x.resistance !== void 0 ? _r(x.resistance) : 4), A = typeof x.end == "number" || Array.isArray(x.end) ? x.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: T,
          friction: M,
          min: i.minRotation,
          max: i.maxRotation,
          end: Array.isArray(A) ? A.filter((I) => typeof I == "number") : A
        }
      },
      onComplete: () => o.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", b), s.addEventListener("pointerup", k), s.addEventListener("pointercancel", k), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", b), s.removeEventListener("pointerup", k), s.removeEventListener("pointercancel", k);
    }
  };
}
const Np = { opacity: 0, scale: 0.6 };
function Dp(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Ga(t) {
  const e = no(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Bi(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = Dp(r);
    o.set(r, a);
    const l = jh(r);
    a && l !== void 0 && !i.has(l) && i.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: o, ids: i };
}
const Qo = /* @__PURE__ */ new WeakMap();
function zi(t, e, n, s = {}) {
  const o = s.duration ?? 0.6, i = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Np : s.enter, c = new Set(n.elements);
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
    const g = Ga(f);
    if (!g) continue;
    let p = n.boxes.get(f) ?? null, m;
    const b = jh(f), k = !p && b !== void 0 ? n.ids.get(b) : void 0;
    k && k.element !== f && (p = k.box, m = k.element);
    const [w] = t.resolveTargets(f);
    Qo.get(f)?.timeline.removeTracks({ target: w });
    const y = d * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(f, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Kh(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: o, ease: i, delay: y }, 0), Qo.set(f, u), d++;
      continue;
    }
    const v = p.cx - g.cx, E = p.cy - g.cy, T = a ? p.width / g.width : 1, x = a ? p.height / g.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(E) > 0.5 || Math.abs(T - 1) > 1e-3 || Math.abs(x - 1) > 1e-3)) {
      const I = (P, O) => {
        const _ = t.appliedValue(w, P);
        return typeof _ == "number" && Math.abs(_ - O) > 1e-6;
      };
      (I("x", 0) || I("y", 0) || I("scaleX", 1) || I("scaleY", 1)) && u.set(f, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = s.fade === !0 && m !== void 0;
    u.fromTo(
      f,
      { x: v, y: E, scaleX: T, scaleY: x, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: o, ease: i, delay: y },
      0
    ), A && m && Ga(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: o, ease: i, delay: y }, 0), Qo.set(f, u), d++;
  }
  return u;
}
function jh(t) {
  return t.dataset?.flipId;
}
function Kh(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function Bp(t, e = {}) {
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
  }, u = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, d = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of i) {
      const b = (m.textContent ?? "").replace(/\s+/g, " ").trim(), k = zp(m, s.words), w = n.has("chars") ? k.flatMap((E) => qp(E, s.chars)) : [], y = n.has("lines") ? jp(m, k, s.lines) : [];
      if (o) {
        !m.hasAttribute("aria-label") && b && m.setAttribute("aria-label", b);
        for (const E of k) E.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...k);
      else for (const E of k) E.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...y);
      const v = e.mask === "lines" ? y : e.mask === "words" ? k : e.mask === "chars" ? w : [];
      for (const E of v) p.masks.push(Kp(E, `${s[e.mask]}-mask`));
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
    const k = t[0]?.ownerDocument?.fonts;
    k && k.status !== "loaded" && k.ready.then(() => b());
  }
  return f;
}
function zp(t, e) {
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
function qp(t, e) {
  const n = t.ownerDocument, s = Yp(t.textContent ?? "").map((o) => {
    const i = n.createElement("span");
    return i.className = e, i.style.display = "inline-block", i.textContent = o, i;
  });
  return t.replaceChildren(...s), s;
}
function Yp(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function jp(t, e, n) {
  const s = t.ownerDocument, o = new Map(e.map((g) => [g, g.getBoundingClientRect()])), i = [], r = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || o.has(p) || p.tagName === "BR" ? i.push(p) : r(p);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, u = !1, d = [];
  const f = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), d = [];
  };
  for (const g of i) {
    if (g.tagName === "BR") {
      u = !0;
      continue;
    }
    const p = o.get(g);
    if (p && (!l || u || p.top > c + h) && (f(), c = p.top, h = p.height / 2, u = !1), !l) continue;
    const m = [];
    for (let w = g.parentNode; w && w !== t; w = w.parentNode) m.unshift(w);
    let b = 0;
    for (; b < d.length && b < m.length && d[b].original === m[b]; ) b++;
    d.length = b;
    let k = b === 0 ? l : d[b - 1].clone;
    for (const w of m.slice(b)) {
      const y = w.cloneNode(!1);
      k.appendChild(y), d.push({ original: w, clone: y }), k = y;
    }
    k.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function Kp(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const Va = {
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
function Ja(t) {
  const e = t.trim().toLowerCase();
  if (e in Va) return Va[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function Xh(t) {
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
  const o = s[0] !== void 0 ? Ja(s[0]) : void 0, i = s[1] !== void 0 ? Ja(s[1]) : void 0;
  return {
    elementFraction: o ?? 0,
    viewportFraction: i ?? 0,
    offsetPx: e
  };
}
function ns(t, e, n) {
  const s = Xh(n), o = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, i = e * s.viewportFraction;
  return o - i + s.offsetPx;
}
function cM(t, e, n, s) {
  const o = ns(t, e, n), r = ns(t, e, s) - o;
  return r <= 0 ? o <= 0 ? 1 : 0 : Uh(-o / r);
}
function Uh(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function Xp(t, e, n, s) {
  if (n <= 0) return e;
  const o = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * o;
}
function Za(t, e, n, s, o) {
  const i = (h) => ns({ top: t + o(h), bottom: t + o(h) + e, height: e }, n, s), r = i(0), a = i(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(i(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class Up {
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
function hM(t) {
  const e = new Up(t);
  return e.start(), e;
}
class Gp {
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
const Vp = 0.15;
function Jp(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function Zp(t, e, n) {
  const s = xs(t + e * Vp);
  if (typeof n == "function") return xs(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : xs(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let o = n[0];
  for (const i of n)
    Math.abs(i - s) < Math.abs(o - s) && (o = i);
  return xs(o);
}
function Qp(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const o = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * o;
}
class tg {
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
  animate(e, n, s, o = xo, i) {
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
function xs(t) {
  return Math.max(0, Math.min(1, t));
}
class eg {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(e, n, s) {
    this.options = s === !0 ? {} : s, this.scroller = n;
    const { startColor: o = "#3ecf7a", endColor: i = "#ff5a5a", id: r } = this.options, a = r ? `${r} ` : "", l = (c, h, u) => {
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
const ng = 120, fn = [], An = /* @__PURE__ */ new Set();
let ti = !1;
const sg = () => {
  ti || An.size === 0 || (ti = !0, queueMicrotask(() => {
    ti = !1;
    for (const t of An) t.afterRefresh();
  }));
}, Gh = () => {
  for (const t of An) t.beforeRefresh();
  for (const t of fn) t.refresh();
  for (const t of An) t.afterRefresh();
};
let pn = { width: 0, height: 0 };
const Qa = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === pn.width && e !== pn.height, s = Math.abs(e - pn.height) < pn.height * 0.25, o = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && o || (pn = { width: t, height: e }, Gh());
};
class Po {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new tg((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new Gp(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new eg(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), fn.length === 0 && typeof window < "u" && (pn = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Qa, { passive: !0 })), fn.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), fn.splice(fn.indexOf(this), 1), fn.length === 0 && typeof window < "u" && window.removeEventListener("resize", Qa), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Gh();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return An.add(e), () => An.delete(e);
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
      if (this.startPx = e + ns(n, s, Wn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const o = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(o.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, sg();
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
    this.targetProgress = s > 0 ? Uh((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(o, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const o = Wn(this.options.end) ?? "bottom top", i = typeof o == "string" ? o.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (i) {
      const r = Number.parseFloat(i[1]);
      return this.startPx + (i[2] === "%" ? n * r / 100 : r);
    }
    return s + ns(e, n, o);
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
    }, ng));
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
    const n = Jp(e), s = () => {
      this.snapTimer = null;
      const o = this.endPx - this.startPx, i = this.scrollPosition();
      if (!this.running || o <= 0 || i <= this.startPx || i >= this.endPx) return;
      const r = (i - this.startPx) / o, a = this.startPx + Zp(r, this.releaseVelocity / o, n.snapTo) * o;
      Math.abs(a - i) < 1 || this.snapper.animate(i, a, Qp(n, a - i, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), o = this.options.scroller?.getBoundingClientRect?.().left ?? 0, i = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - o - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (f) => a + f * (l - a), h = Za(r, s.width, i, Wn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = Wn(this.options.end) ?? "right left", d = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = d ? this.startPx + Number.parseFloat(d[1]) : c(Za(r, s.width, i, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (i, r) => {
      const a = Wn(i) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = Xh(a);
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
      this.lastFrameTime = n, this.displayProgress = Xp(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function Wn(t) {
  return typeof t == "function" ? t() : t;
}
function uM(t) {
  const e = new Po(t);
  return e.start(), e;
}
const ei = /* @__PURE__ */ new Set(), og = 16, tl = 0.5, ig = 2;
class el {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), ei.add(this), this.stopListening = Po.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of ei) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), ei.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) ni(e.element, e.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: i * 1e3, ease: n.ease ?? xo, elapsed: 0 }, this.requestFrame();
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
    for (const e of this.effects) ni(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? og : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), o = this.clamp(this.target + s);
    o === this.target && o === this.current || (e.preventDefault(), this.journey = null, this.target = o, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= ig || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / i)), Math.abs(this.target - this.current) < tl && (this.current = this.target);
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
        o.lagged = e === 0 ? s : o.lagged + (s - o.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - o.lagged) < tl ? o.lagged = s : n = !0, i += s - o.lagged;
      }
      ni(o.element, i === 0 ? o.saved : `0 ${rg(i)}px`), o.shift = i;
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
function ni(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function rg(t) {
  return Math.round(t * 100) / 100;
}
function ag(t, e) {
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
function Hr(t, e, n, s, o = () => {
}) {
  const i = (f) => typeof f == "string" ? t.query(f) ?? void 0 : f, r = i(e.trigger) ?? s;
  if (!r) {
    o(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (f, g) => () => {
    g?.(), n && !a && ag(n, l[f] ?? "none"), e.once && f === 0 && queueMicrotask(() => h.destroy());
  }, d = e.containerAnimation ? hg(t, e.containerAnimation, r, o) : void 0;
  return h = new Po({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : i(e.pin),
    scroller: i(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : lg(e.snap, n),
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
function lg(t, e) {
  const n = (o) => o === "labels" ? (i) => cg(i, e?.labelProgresses?.() ?? []) : o;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? to(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Rt(s.easing) : void 0
  };
}
function cg(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function hg(t, e, n, s) {
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
class Vh {
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
class ug {
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
    const i = new Vh(this.host, this.scope);
    i.conditions = n, i.add(() => e.setup(i)), e.context = i;
  }
}
class dg {
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
const fg = { opacity: 0, y: -16 }, pg = { opacity: 0, y: 16 };
async function gg(t, e, n, s) {
  const o = e.collector?.scope ?? e.root, i = o.ownerDocument ?? o, r = () => s.shared ? [...o.querySelectorAll(s.shared)] : [];
  if (s.native && typeof i.startViewTransition == "function")
    return mg(i, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((b) => {
    m(b) || b();
  }), h = r(), u = h.length ? Bi(e, h) : void 0, d = s.from !== void 0 ? nl(e, s.from, s.shared) : [];
  if (d.length && s.leave !== !1) {
    const m = s.leave ?? fg;
    await c((b) => t.to(d, { ...m, duration: a, ease: l, onComplete: b }));
  }
  await s.update();
  const f = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? nl(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? pg;
    f.push(c((b) => t.fromTo(p, m, { ...Kh(m), duration: a, ease: l, onComplete: b })));
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
function nl(t, e, n) {
  const s = t.resolveTargets(e).map((o) => t.elementFor(o)).filter((o) => !!o);
  return n ? s.flatMap((o) => !o.querySelector(n) && !o.matches(n) ? [o] : [...o.children].filter((i) => !i.matches(n) && !i.querySelector(n))) : s;
}
async function mg(t, e, n) {
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
const yg = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => Ir(t, ff(e))
}, bg = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => Ir(t, { fn: pf(e) })
}, wg = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => Ir(t, { fn: gf(e) })
}, kg = /* @__PURE__ */ new Set([
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
]), sl = 0.5, vg = "power1.inOut";
function Mg(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function xg(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) kg.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? sl
    }));
  const s = Object.entries(e), o = t.duration ?? sl, i = e.easeEach ?? t.easeEach ?? vg;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([d]) => d !== "easeEach").map(([d, f]) => ({ at: Number.parseFloat(d) / 100, step: f })).sort((d, f) => d.at - f.at), h = [];
    let u = 0;
    for (const { at: d, step: f } of c) {
      const g = Math.max(0, d - u);
      h.push({ ...n, ease: i, ...f, duration: g * o }), u = d;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: i, duration: o / a };
    for (const [u, d] of r)
      c < d.length && (h[u] = d[c]);
    l.push(h);
  }
  return l;
}
function ol(t, e, n, s = {}) {
  const o = e.collector?.scope ?? e.root, i = typeof s.scroller == "string" ? o.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: i ? i.scrollLeft : window.scrollX,
    y: i ? i.scrollTop : window.scrollY
  }, a = {
    x: i ? i.scrollWidth - i.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: i ? i.scrollHeight - i.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (k, w) => {
    if (w === void 0) return r[k];
    if (typeof w == "number") return w;
    if (w === "max") return a[k];
    const y = typeof w == "string" ? o.querySelector(w) : w;
    if (!y) return r[k];
    const v = y.getBoundingClientRect(), E = i?.getBoundingClientRect(), T = (k === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return k === "x" ? v.left - (E?.left ?? 0) + r.x - T : v.top - (E?.top ?? 0) + r.y - T;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, d = () => {
    i ? (i.scrollLeft = u.x, i.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, f = ["wheel", "touchstart", "keydown"], g = i ?? window, p = () => {
    b.kill(), m();
  }, m = () => {
    for (const k of f) g.removeEventListener(k, p);
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
  if (s.autoKill !== !1) for (const k of f) g.addEventListener(k, p, { passive: !0 });
  return b;
}
function Sg(t, e, n) {
  const s = t.collector?.scope ?? t.root, o = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: i = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, d = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, f = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (b) => {
    g[b] !== void 0 && clearTimeout(g[b]), g[b] = void 0;
    const k = f[b].splice(0);
    k.length > 0 && d[b]?.(k);
  }, m = (b, k) => {
    if (d[b]) {
      if (f[b].push(k), r !== void 0 && f[b].length >= r) return p(b);
      g[b] === void 0 && (g[b] = setTimeout(() => p(b), i * 1e3));
    }
  };
  return o.map(
    (b) => Hr(t, {
      ...u,
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
    if (this.options = s, this.compat = new yn({
      ...s,
      startValue: (o, i) => {
        const r = e.objectFor(o);
        if (r) return $g(r[i]);
        const a = e.appliedValue(o, i);
        if (a !== void 0) return a;
        if (i === "d") return qh(e.elementFor(o)) ?? void 0;
        if (i === "text") return e.elementFor(o)?.textContent ?? void 0;
        if (i === "strokeDasharray" || i === "strokeDashoffset") {
          const l = al(e.elementFor(o));
          if (l !== void 0) return i === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (o, i) => e.velocityOf(o, i),
      layoutColumns: (o) => rl(o.map((i) => e.elementFor(i))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const o = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = Hr(e, o, this, this.firstElement, (i) => s.onWarning?.(i)));
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
    return Mg(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.to(i, o, r)));
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
    const o = this.events, { crossings: i, passes: r } = Mh(
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
      const u = (d, f, g) => {
        o(d, f, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(i, n, s, u), c === 1 / 0) return;
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
    const i = xg(n);
    if (i.length === 0) return;
    const r = o.length > 1 ? Ni(n.stagger, this.staggerContext(o)) : void 0, a = o.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? _i(o.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + eo(n.delay, 0) / 1e3;
    let u = 1 / 0, d = -1 / 0;
    if (l.forEach((m, b) => {
      i.forEach((k, w) => {
        const y = w === 0 ? h + c[b] : ">";
        this.tween(m, [k], y, ([v], E, T) => this.compat.to(E, v, T)), u = Math.min(u, this.compat.lastStart), d = Math.max(d, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: f, onUpdate: g, onComplete: p } = n;
    f && this.events.push({ time: u, direction: "forward", run: f }), g && this.ranges.push({ start: u, end: d, run: g }), p && this.events.push({ time: d, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => rl(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, o) {
    const i = e.map((d) => this.targetFor(d));
    if (!(e.length > 1 && (n.some(Ag) || e.some((d) => this.stage.objectFor(d) !== void 0)))) {
      const d = this.targetFor(e[0]);
      o(n.map((f) => this.prepare(il(f, 0, d, this.stage.utils, i), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Ni(l, this.staggerContext(e)), u = h ? _i(e.length, h).map((d) => d / 1e3) : e.map(() => 0);
    e.forEach((d, f) => {
      const g = f === 0 ? eo(c.delay, 0) / 1e3 + u[0] : 0, p = f === 0 ? 0 : u[f] - u[f - 1], m = f === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, k = n.map((w, y) => y === a ? { ...c, delay: g } : w).map((w) => this.prepare(il(w, f, this.targetFor(d), this.stage.utils, i), [d]));
      o(k, [d], m);
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
      const r = $p(e.motionPath, {
        query: o,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      i = { ...i, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = Pp(e.morphSVG, o, s), { morphSVG: a, ...l } = i;
      i = r ? { ...i, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = al(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = i;
        i = l;
      } else
        i = tp(i, r);
    }
    return i;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Pg(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Tg(t = new Sp()) {
  const e = (i) => {
    const { config: r } = Bs(i);
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
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: u, ...d } = i;
    return d;
  }, s = (i) => (i && t.collector?.track(i), i), o = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (i, r) => {
      const [a] = t.resolveTargets(i);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? Nh(r);
    },
    scrollTrigger: (i) => s(Hr(t, i)),
    scrollBatch: (i, r) => Sg(t, i, r).map((a) => s(a)),
    scrollTo: (i, r) => ol(o, t, i, r),
    refreshScroll: () => {
      Po.refreshAll(), el.refreshAll();
    },
    smoothScroll: (i = {}) => {
      const r = typeof i.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(i.scroller) : i.scroller;
      return s(new el({ ...i, scroller: r }).start());
    },
    context: (i, r) => {
      const a = new Vh(t, r);
      return i && a.add(() => i(a)), a;
    },
    matchMedia: (i) => new ug(t, i),
    customEase: yg.create,
    customBounce: bg.create,
    customWiggle: wg.create,
    pageTransition: (i) => gg(o, t, (r) => new ge(t, r), i),
    imageSequence: (i, r) => {
      const a = typeof i == "string" ? (t.collector?.scope ?? t.root).querySelector(i) : i;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(i)}`);
      return s(new dg(a, r));
    },
    quickTo: (i, r, a = {}) => {
      const l = new ge(t, { paused: !0 }), [c] = t.resolveTargets(i);
      return Object.assign((u) => {
        if (!c) return;
        const d = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Eg(a.spring, r, d) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (i) => new ge(t, i),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (i, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof i != "string" && i !== window && i.nodeType === 1;
        return ol(o, t, a, {
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
    convertToPath: (i) => Op(i, t.root),
    splitText: (i, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof i == "string" ? Array.from(a.querySelectorAll(i)) : "nodeType" in i ? [i] : Array.from(i);
      return s(Bp(l, r));
    },
    draggable: (i, r) => s(Wp(o, t, i, r)),
    getFlipState: (i) => Bi(t, i),
    flipFrom: (i, r) => zi(t, (a) => new ge(t, a), i, r),
    flip: (i, r, a) => {
      const l = Bi(t, i);
      return r(), zi(t, (c) => new ge(t, c), l, { targets: i, ...a });
    }
  };
  return o;
}
const Qt = /* @__PURE__ */ Tg();
function Eg(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function Ag(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || Jh(t);
}
function Jh(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || Fh(n)) && !Or.has(e));
}
function il(t, e, n, s, o) {
  if (!Jh(t)) return t;
  const i = {};
  for (const [r, a] of Object.entries(t))
    Or.has(r) ? i[r] = a : typeof a == "function" ? i[r] = a(e, n, o) : Fh(a) ? i[r] = s.resolveRandomString(a) : i[r] = a;
  return i;
}
function rl(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function al(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function $g(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function Pg(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class ll {
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
function Ig(t, e, n, s, o) {
  const i = n - o;
  if (i < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(i, s);
}
class Cr {
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
    this.options = n, this.adapter = new qe();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = es({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      i !== null && (s.volume = Math.max(0, Math.min(1, Number(i) || 0))), this.mediaTargets.push({ el: s, startTime: o, sync: new ll(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      Ig(s.sync, s.el, e, n, s.startTime);
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
      const r = new qe();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: es(i.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new ll(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: i } = Mh(
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
async function dM(t, e, n = {}) {
  const s = new Cr(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function fM(t, e = {}) {
  return new Cr(t, e);
}
const Og = {
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
}, cl = "tinyfly-controls-style", _g = `
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
let Hg = 0;
function Cg(t) {
  if (t.getElementById(cl)) return;
  const e = t.createElement("style");
  e.id = cl, e.textContent = _g, t.head.appendChild(e);
}
function Rg(t, e, n = {}) {
  const s = e.ownerDocument;
  Cg(s);
  const o = { ...Og, ...n.labels }, i = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((W) => W.label !== void 0 || t.caption(W.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (W, B, K, V = "") => {
    const j = s.createElement("button");
    return j.type = "button", j.className = `tf-ctl-btn ${V}`.trim(), j.setAttribute("aria-label", W), j.title = W, j.textContent = B, j.addEventListener("click", K), j;
  }, u = h(o.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), d = h(o.prev, "|◀", () => t.prev()), f = h(o.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(o.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", o.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const b = s.createElement("span");
  b.className = "tf-ctl-step";
  const k = s.createElement("select");
  k.className = "tf-ctl-speed", k.setAttribute("aria-label", o.speed);
  for (const W of i) {
    const B = s.createElement("option");
    B.value = String(W), B.textContent = `${W}×`, W === 1 && (B.selected = !0), k.appendChild(B);
  }
  k.addEventListener("change", () => t.setSpeed(Number(k.value))), c.append(u, d, f, g, m, b), i.length > 0 && c.append(k), l.append(c);
  const w = n.fullscreen ? Ng(e, s, o) : void 0;
  w && c.append(w.button);
  const y = s.createElement("p");
  y.className = "tf-ctl-caption", y.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(y);
  const v = s.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const E = s.createElement("span"), T = h(o.reveal, o.reveal, () => t.play(), "tf-ctl-primary");
  v.append(E, T), l.append(v);
  const x = Lg(t, s, o.scenario, n.scenarioControl ?? "buttons");
  x && l.append(x.element);
  const M = n.mount;
  M ? M.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const A = () => {
    const W = t.isPlaying;
    f.textContent = W ? "❚❚" : "▶", f.setAttribute("aria-label", W ? o.pause : o.play), f.title = W ? o.pause : o.play;
    const B = t.duration;
    s.activeElement !== m && (m.value = String(B > 0 ? Math.round(t.currentTime / B * 1e3) : 0));
    const K = t.markers;
    if (d.hidden = g.hidden = b.hidden = K.length === 0, K.length > 0) {
      const V = t.currentMarker, j = V ? K.indexOf(V) + 1 : 0;
      b.textContent = o.stepFormat.replace("{index}", String(j)).replace("{total}", String(K.length)), b.setAttribute("aria-label", `${o.step} ${j} ${o.of} ${K.length}`), d.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= B - 0.5;
      const S = t.caption() ?? "";
      y.textContent !== S && (y.textContent = S), y.hidden = !a();
      const C = !W && V?.question !== void 0 && Math.abs(t.currentTime - V.time) < 1;
      v.hidden = !C, C && E.textContent !== V.question && (E.textContent = V.question);
    } else
      v.hidden = !0, y.hidden = !0;
    x?.update();
  }, I = t.subscribe(A);
  A();
  const P = n.keyboardScope ?? e;
  !P.hasAttribute("tabindex") && P.tabIndex < 0 && (P.tabIndex = 0);
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
  return P.addEventListener("keydown", _), l.addEventListener("keydown", _), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), I(), P.removeEventListener("keydown", _), l.removeEventListener("keydown", _), l.remove();
    }
  };
}
function Lg(t, e, n, s) {
  const o = t.scenarios;
  if (o.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const u = e.createElement("span");
    u.textContent = n, u.setAttribute("aria-hidden", "true");
    const d = e.createElement("input");
    d.type = "range", d.min = "0", d.max = String(o.length - 1), d.step = "1", d.setAttribute("aria-label", n);
    const f = e.createElement("output");
    return f.setAttribute("aria-hidden", "true"), d.addEventListener("input", () => {
      const p = o[Number(d.value)];
      p && t.setScenario(p.id);
    }), h.append(u, d, f), { element: h, update: () => {
      const p = Math.max(0, o.findIndex((b) => b.id === t.scenario));
      e.activeElement !== d && (d.value = String(p));
      const m = o[p].label;
      f.textContent !== m && (f.textContent = m), d.setAttribute("aria-valuetext", m);
    } };
  }
  const i = e.createElement("fieldset");
  i.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, i.append(r);
  const a = `tf-ctl-scenario-${++Hg}`, l = o.map((h) => {
    const u = e.createElement("label");
    u.className = "tf-ctl-choice";
    const d = e.createElement("input");
    d.type = "radio", d.name = a, d.value = h.id, d.addEventListener("change", () => {
      d.checked && t.setScenario(h.id);
    });
    const f = e.createElement("span");
    return f.textContent = h.label, u.append(d, f), i.append(u), d;
  });
  return { element: i, update: () => {
    for (const h of l) {
      const u = h.value === t.scenario;
      h.checked !== u && (h.checked = u);
    }
  } };
}
const Wg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Fg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Ng(t, e, n) {
  const s = e, o = t, i = e.createElement("button");
  i.type = "button", i.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    i.innerHTML = p ? Fg : Wg;
    const m = p ? n.exitFullscreen : n.fullscreen;
    i.setAttribute("aria-label", m), i.title = m, i.setAttribute("aria-pressed", String(p)), t.classList.toggle("tf-fullscreen", p), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, u = (p) => {
    p.key === "Escape" && g();
  }, d = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", u), l();
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
const hl = "tinyfly-choices-style", Dg = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function Bg(t) {
  if (t.getElementById(hl)) return;
  const e = t.createElement("style");
  e.id = hl, e.textContent = Dg, t.head.appendChild(e);
}
function zg(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  Bg(e.ownerDocument);
  const s = [], o = [];
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
    a.addEventListener("click", d), a.addEventListener("keydown", f), o.push(() => {
      a.removeEventListener("click", d), a.removeEventListener("keydown", f);
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
const so = /* @__PURE__ */ new WeakMap(), qi = /* @__PURE__ */ new WeakMap();
let qg = 0;
function jn(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function Yg(t, e = {}) {
  const n = so.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), o = s[0], i = t.getAttribute("data-src"), r = Kg(t.getAttribute("data-markers")), a = s.length > 1 || o?.hasAttribute("data-scenario") ? jg(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = o && !a ? jn(o.textContent, "timeline", t) : void 0;
  if (!l && i && r) {
    const f = await fetch(i);
    f.ok && (l = await f.json());
  }
  if (l && r && (l = Zh(l, r)), !l && !i && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = jn(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...jn(t.getAttribute("data-options"), "data-options", t)
  };
  Ug(t);
  const u = new Cr(t, h), d = { element: t, player: u };
  if (so.set(t, d), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const f = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === f) ? f : void 0 }), qi.set(t, zg(u, t));
  } else
    await u.load(l ?? i);
  if (t.getAttribute("data-controls") !== "false") {
    const f = jn(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    d.controls = Rg(u, t, {
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
function jg(t, e, n) {
  const s = [];
  return t.forEach((o, i) => {
    const r = jn(o.textContent, "timeline", n);
    if (!r) return;
    const a = o.getAttribute("data-scenario") || `scenario-${i + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = o.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? Zh(r, e) : r });
  }), s;
}
function Zh(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function Kg(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function Xg(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((o) => Yg(o, e)))).filter((o) => o !== void 0);
}
function pM(t) {
  const e = so.get(t);
  e && (qi.get(t)?.(), qi.delete(t), e.controls?.destroy(), e.player.destroy(), so.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function Ug(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++qg}`, e.setAttribute("aria-labelledby", s.id));
}
function Gg() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    Xg();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class Vg {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new qe(), this.adapterB = new qe();
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
      const a = new qe();
      o.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: es(r) });
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
    return e.timeline ? es(e.timeline) : null;
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
async function gM(t, e, n = {}) {
  const s = new Vg(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const mM = { type: "none", duration: 0 }, Tt = (t) => ({ description: t, unit: "degrees" }), xt = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), Qh = {
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
}, t0 = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: xt("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: xt("How much the mouth chatters"),
  rubber: xt("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: xt("How much of the dance is applied")
}, e0 = {
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
let n0;
function Jg(t) {
  n0 = t;
}
function Zg(t) {
  return n0?.(t) ?? {};
}
function Qg(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function ss(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = Qg(t) * n;
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
function Rr(t, e) {
  const n = ss(t, e);
  return n[n.length - 1];
}
function s0(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Yi(t, e, n) {
  const s = e.roughness ?? 2, o = Math.max(1, Math.round(e.passes ?? 2)), i = s0(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const d = r++;
    return (f) => Ve(Zt(`${e.seed ?? 1}:${i}:${d}:${f}`));
  }, l = (d, f) => (d.next() * 2 - 1) * f, c = (d) => {
    const f = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < o; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, d(f(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (d, f = 1) => {
    if (d.length < 2) return;
    const g = d.slice(1).map((m, b) => Math.hypot(m.x - d[b].x, m.y - d[b].y)), p = g.reduce((m, b) => m + b, 0) * Math.min(1, Math.max(0, f));
    c((m) => {
      const b = [], k = [];
      if (d.forEach((y, v) => {
        b.push({ x: y.x + l(m, s * 0.5), y: y.y + l(m, s * 0.5) }), v > 0 && k.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(b[0].x, b[0].y);
      let w = 0;
      for (let y = 1; y < b.length; y++) {
        const v = tm(b[y - 1], b[y], s, k[y - 1]), E = g[y - 1];
        if (w + E <= p) {
          t.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), w += E;
          continue;
        }
        const T = em(v, E === 0 ? 1 : (p - w) / E);
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
      const E = ss(v, m);
      E.length < 2 || (ul(t, E), t.stroke());
    });
  };
  return {
    line: h,
    curve(d, f = 1) {
      if (d.length < 2) return;
      const g = d[0], p = d[d.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, b = -(p.y - g.y) / m, k = (p.x - g.x) / m;
      c((w) => {
        const y = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, v = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, E = l(w, s * Math.min(1.5, Math.max(0.3, m / 80))), T = d.map((M, A) => {
          const I = A / (d.length - 1), P = Math.sin(Math.PI * I) * E;
          return {
            x: M.x + y.x + (v.x - y.x) * I + b * P,
            y: M.y + y.y + (v.y - y.y) * I + k * P
          };
        }), x = ss(T, f);
        x.length < 2 || (ul(t, x), t.stroke());
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
function tm(t, e, n, s) {
  const o = e.x - t.x, i = e.y - t.y, r = Math.hypot(o, i) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -i / r, c = o / r;
  return [
    t,
    { x: t.x + o / 3 + l * s[0] * a, y: t.y + i / 3 + c * s[0] * a },
    { x: t.x + 2 * o / 3 + l * s[1] * a, y: t.y + 2 * i / 3 + c * s[1] * a },
    e
  ];
}
function em([t, e, n, s], o) {
  const i = (u, d) => ({ x: u.x + (d.x - u.x) * o, y: u.y + (d.y - u.y) * o }), r = i(t, e), a = i(e, n), l = i(n, s), c = i(r, a), h = i(a, l);
  return [t, r, c, i(c, h)];
}
function ul(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const o = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, o.x, o.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function Ft(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const o = [], i = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, d = r(l) / 2, f = -(h.y - c.y) / u * d, g = (h.x - c.x) / u * d;
    o.push({ x: a.x + f, y: a.y + g }), i.push({ x: a.x - f, y: a.y - g });
  }), [...o, ...i.reverse()];
}
function Lr(t, e, n, s) {
  const o = e.length;
  if (o < 2) return;
  const i = Ft(e, n, s), r = (a) => n + (s - n) * a / (o - 1);
  t.beginPath(), t.moveTo(i[0].x, i[0].y);
  for (const a of i.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== o - 1 && o > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function $n(t, e, n, s, o = 16) {
  const i = { x: 2 * e.x - (t.x + n.x) / 2, y: 2 * e.y - (t.y + n.y) / 2 }, r = [];
  for (let a = 0; a <= o; a++) {
    const l = a / o, c = l < 0.5 ? { x: t.x + (e.x - t.x) * 2 * l, y: t.y + (e.y - t.y) * 2 * l } : { x: e.x + (n.x - e.x) * (2 * l - 1), y: e.y + (n.y - e.y) * (2 * l - 1) }, h = 1 - l, u = {
      x: h * h * t.x + 2 * h * l * i.x + l * l * n.x,
      y: h * h * t.y + 2 * h * l * i.y + l * l * n.y
    };
    r.push({ x: c.x + (u.x - c.x) * s, y: c.y + (u.y - c.y) * s });
  }
  return r;
}
function dl(t, e, n, s, o, i = 0, r = 1, a = 40) {
  const l = Math.cos(o), c = Math.sin(o);
  return Array.from({ length: a + 1 }, (h, u) => {
    const d = i + Math.PI * 2 * r * u / a, f = Math.cos(d) * n, g = Math.sin(d) * s;
    return { x: t + f * l - g * c, y: e + f * c + g * l };
  });
}
function Io(t, e) {
  return e.look === "pencil" ? im(t, e) : nm(t, e.ink, e.look);
}
function oo(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function nm(t, e, n) {
  const s = n === "silhouette", o = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(i, r, a) {
      t.fillStyle = e, Lr(t, i, r * o, a * o);
    },
    line(i, r) {
      i.length < 2 || (t.strokeStyle = e, t.lineWidth = r * o, t.lineCap = "round", t.lineJoin = "round", oo(t, i), t.stroke());
    },
    shape(i, r, a) {
      oo(t, i, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * o, t.lineJoin = "round", t.stroke());
    },
    ellipse(i, r, a, l, c, h, u) {
      t.beginPath(), t.ellipse(i, r, a, l, c, 0, Math.PI * 2), (h !== null || s) && (t.fillStyle = s ? e : h, t.fill()), !(u <= 0) && (t.strokeStyle = e, t.lineWidth = u * o, t.stroke());
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
function sm(t, e) {
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
  const o = t[t.length - 1], i = n[n.length - 1];
  return Math.hypot(o.x - i.x, o.y - i.y) > e * 0.25 ? n.push(o) : n[n.length - 1] = o, n;
}
function om(t, e) {
  const n = t.length;
  return t.map((s, o) => {
    const i = t[Math.max(0, o - 1)], r = t[Math.min(n - 1, o + 1)], a = Math.hypot(r.x - i.x, r.y - i.y) || 1, l = e(n === 1 ? 0 : o / (n - 1));
    return { x: s.x - (r.y - i.y) / a * l, y: s.y + (r.x - i.x) / a * l };
  });
}
function fl(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, o) => s + o.amount, 0);
  return (s) => e.reduce((o, i) => o + i.amount * Math.sin(Math.PI * 2 * i.frequency * s + i.phase), 0) / n;
}
function im(t, e) {
  const n = e.pencil ?? {}, s = e.ink, o = n.roughness ?? Math.max(1, e.lineWidth * 0.12), i = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = s0(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => Ve(Zt(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, b, k, w = 0) => {
    if (g.length < 2) return;
    const y = g.slice(1).reduce((I, P, O) => I + Math.hypot(P.x - g[O].x, P.y - g[O].y), 0);
    let v = sm(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, y / 24)));
    if (w > 0 && v.length >= 2) {
      const [I, P] = [v[v.length - 2], v[v.length - 1]], O = Math.hypot(P.x - I.x, P.y - I.y) || 1;
      v = [...v, { x: P.x + (P.x - I.x) / O * w, y: P.y + (P.y - I.y) / O * w }];
    }
    const E = fl(m), T = fl(m), x = v.length, M = [], A = [];
    v.forEach((I, P) => {
      const O = x === 1 ? 0 : P / (x - 1), _ = v[Math.max(0, P - 1)], W = v[Math.min(x - 1, P + 1)], B = Math.hypot(W.x - _.x, W.y - _.y) || 1, K = -(W.y - _.y) / B, V = (W.x - _.x) / B, j = E(O) * k, S = Math.min(1, O / 0.08, (1 - O) / 0.08), C = (0.55 + 0.45 * Math.sqrt(Math.max(0, S))) * (1 + r * T(O)), L = Math.max(0.3, p(O) * C / 2), $ = I.x + K * j, R = I.y + V * j;
      M.push({ x: $ + K * L, y: R + V * L }), A.push({ x: $ - K * L, y: R - V * L });
    }), t.save(), t.globalAlpha *= b, t.fillStyle = s, oo(t, [...M, ...A.reverse()], !0), t.fill(), t.restore();
  }, d = (g, p) => {
    const m = c++, b = h(m, 99, !0);
    if (b.next() < a) {
      const v = (b.next() * 2 - 1) * e.lineWidth * 1.4, E = (b.next() * 2 - 1) * e.lineWidth * 1.4, T = g.map((x) => ({ x: x.x + v, y: x.y + E }));
      u(T, (x) => p(x) * 1.8, h(m, 98, !0), 0.035, o), u(T, (x) => p(x) * 0.45, h(m, 97, !0), 0.12, o * 1.5);
    }
    const k = g.slice(1).reduce((v, E, T) => v + Math.hypot(E.x - g[T].x, E.y - g[T].y), 0), w = p(0.5) > 4 && k > p(0.5) * 6, y = w ? [-0.3, 0.3, 0] : [0];
    for (let v = 0; v < i; v++) {
      const E = v === 0;
      y.forEach((T, x) => {
        const M = h(m, v * 10 + x), A = T === 0 ? g : om(g, (P) => p(P) * T * Math.sqrt(Math.sin(Math.PI * P))), I = !E && T === 0 ? e.lineWidth * (0.3 + M.next() * 0.8) : 0;
        u(A, (P) => p(P) * (w ? 0.5 : 1) * (E ? 1 : 0.6), M, E ? 0.85 : 0.45, o * (E ? 0.6 : 1), I);
      });
    }
  }, f = (g, p, m, b, k, w) => {
    const v = h(c, 50).next() * Math.PI * 2;
    d(dl(g, p, m, b, k, v, 1.08, 48), () => w);
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
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, oo(t, g, !0), t.fill(), t.restore()), m > 0 && d([...g, g[0]], () => m);
    },
    ellipse(g, p, m, b, k, w, y) {
      w !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = w, t.beginPath(), t.ellipse(g, p, m, b, k, 0, Math.PI * 2), t.fill(), t.restore()), f(g, p, m, b, k, y);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      u(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, o * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, b, k) {
      if (n.construction === !1) return;
      const w = c++, y = h(w, 0), v = dl(g, p, m, b, k, y.next() * Math.PI * 2, 1.12, 48);
      u(v, () => Math.max(0.6, e.lineWidth * 0.18), y, 0.28, o * 1.5);
    }
  };
}
const rm = ["thumb", "index", "middle", "ring", "pinky"], Pt = {
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
const qt = (t, e, n, s, o) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": o
}), Ht = {
  relaxed: Pt,
  open: $t({ ...qt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: $t({ ...qt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: $t({ ...qt(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: $t({ ...qt(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: $t({ ...qt(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: $t({ ...qt(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: $t({ ...qt(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: $t({ ...qt(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: $t({ ...qt(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: $t({ ...qt(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: $t({ ...qt(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: $t({ ...qt(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: $t({ ...qt(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function os(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
const am = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, lm = {
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
}, cm = [82, 100, 62], hm = [48, 72], um = 3, dm = 13, fm = 0.035, pm = -0.075, gm = [
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
], Se = (t) => t * Math.PI / 180, ji = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], zs = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Ki = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], Fn = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Ye(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = Ki(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + i[0] * o + e[0] * r * (1 - s),
    t[1] * s + i[1] * o + e[1] * r * (1 - s),
    t[2] * s + i[2] * o + e[2] * r * (1 - s)
  ];
}
const pl = [1, 0, 0], gl = [0, 1, 0], Gn = [0, 0, 1];
function mm(t, e, n) {
  const s = Se(t.fan * (um + dm * n)), o = [Math.sin(s), Math.cos(s), 0], i = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += Se(cm[u] * e), r.push(ji(r[u], zs(Ye(o, i, -a), h)));
  });
  const l = Ye(Gn, i, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function ym(t, e, n = 1, s = 1) {
  const o = Math.min(1, Math.max(0, e)), i = Fn(ji(zs(Fn(he.out), 1 - o), zs(Fn(he.across), o))), r = Fn(Ki(Gn, i)), a = Fn(Ki(i, r)), l = [[he.base[0] * s, he.base[1], he.base[2]]];
  let c = 0;
  he.bones.forEach((d, f) => {
    f > 0 && (c += Se(hm[f - 1] * t)), l.push(ji(l[f], zs(Ye(i, r, c), d)));
  });
  const h = Ye(a, r, c), u = [...he.widths, he.widths[he.widths.length - 1] * 0.92].map((d) => d * n);
  return { joints: l, back: h, widths: u };
}
function Xi(t, e = {}) {
  const n = { ...Pt, ...t }, s = e.size ?? 100, o = e.side ?? "right", i = o === "left" ? -1 : 1, r = Se(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (P) => ({
    ...P,
    knuckle: [P.knuckle[0] * c, P.knuckle[1], P.knuckle[2]],
    width: P.width * l
  }), u = Se(n.bend ?? 0), d = Se(n.tilt ?? 0), f = Se(90 * (n.turn ?? 0)), g = (P) => Ye(Ye(Ye(P, pl, -u), Gn, -d), gl, f), p = Math.cos(r), m = Math.sin(r), b = Se(n.roll ?? 0), k = Math.cos(b), w = Math.sin(b), y = (P) => {
    const O = P[0] * s, _ = -P[1] * s, W = (O * k - _ * w) * i, B = O * w + _ * k;
    return { x: W * p - B * m, y: W * m + B * p };
  }, v = (P) => {
    const O = y(P), _ = Math.hypot(O.x, O.y);
    return _ > 1e-6 * s ? { x: O.x / _, y: O.y / _ } : { x: 0, y: 0 };
  }, E = {
    thumb: ym(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, T = a ? lm : am;
  for (const P of rm) {
    const O = T[P];
    O && (E[P] = mm(h(O), n[`${P}.curl`] ?? 0, n.spread ?? 0));
  }
  const x = {};
  for (const [P, O] of Object.entries(E)) {
    const _ = O.joints.map(g), W = g(O.back);
    x[P] = {
      points: _.map(y),
      depths: _.map((B) => B[2] * s),
      widths: O.widths.map((B) => B * s),
      nail: W[2],
      back: v(W)
    };
  }
  const M = gm.flatMap(([P, O]) => [g([P * c, O, fm]), g([P * c, O, pm])]), A = wm(M.map(y)), I = M.reduce((P, O) => P + O[2], 0) / M.length * s;
  return {
    size: s,
    side: o,
    wrist: { x: 0, y: 0 },
    palm: A,
    palmDepth: I,
    palmFacing: -g(Gn)[2],
    fingers: x,
    axes: { up: v(g(gl)), across: v(g(pl)), out: v(g(Gn)) },
    curls: Object.fromEntries(Object.keys(x).map((P) => [P, n[`${P}.curl`] ?? 0]))
  };
}
function bm(t, e) {
  const n = (o) => ({ x: o.x + e.x - t.wrist.x, y: o.y + e.y - t.wrist.y }), s = {};
  for (const [o, i] of Object.entries(t.fingers))
    s[o] = { ...i, points: i.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function wm(t) {
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
const km = "#f1c9a5", vm = "#2f2f33";
function Wr(t, e, n, s = {}, o = 0) {
  const i = bm(Xi(n, s), e), r = s.ink ?? vm, a = s.lineWidth ?? i.size * 0.035, l = s.pen ?? Io(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: o,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? km, h = s.nails ?? !0, u = [
    {
      depth: i.palmDepth,
      draw: () => Mm(l, i, c, a)
    }
  ];
  for (const d of Object.values(i.fingers)) {
    const f = d.depths.reduce((g, p) => g + p, 0) / d.depths.length;
    u.push({
      depth: f,
      draw: () => xm(t, l, d, c, a, h)
    });
  }
  if (s.prop) {
    const d = s.prop;
    u.push({ depth: d.depth, draw: () => d.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const d of [...u].sort((f, g) => f.depth - g.depth)) d.draw();
  return t.restore(), i;
}
function Mm(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: o } = e.axes;
    for (const [i, r] of Object.entries(e.fingers)) {
      const a = e.curls[i] ?? 0;
      if (i === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - o.x * c * 0.2, y: l.y - o.y * c * 0.2 }, u = Math.atan2(o.y, o.x), d = Array.from({ length: 7 }, (f, g) => {
        const p = u - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      t.line(d, s * 0.6);
    }
  }
  if (e.palmFacing > 0.45 && t.look !== "silhouette") {
    const { up: o, across: i } = e.axes, r = e.size, a = e.wrist, l = (h, u) => ({
      x: a.x + (i.x * h + o.x * u) * r,
      y: a.y + (i.y * h + o.y * u) * r
    }), c = e.side === "left" ? -1 : 1;
    t.line([l(-0.15 * c, 0.36), l(-0.04 * c, 0.3), l(0.1 * c, 0.33)], s * 0.5);
  }
}
function xm(t, e, n, s, o, i) {
  const { widths: r } = n, a = Sm(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + o * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * o, u + 2 * o), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, Lr(t, a, h, u)), e.look === "silhouette" || !i || n.nail < 0.25) return;
  const d = a[a.length - 2], f = Tm({ x: c.x - d.x, y: c.y - d.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - f.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - f.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(f.y, f.x), "#f8e3d3", o * 0.45);
}
function Sm(t, e) {
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
const Tm = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Bt = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, Em = 40;
function Oo(t) {
  return t === void 0 ? Bt.walk : typeof t == "string" ? Bt[t] ?? Bt.walk : t;
}
function Am(t, e, n = lt, s = 1) {
  const o = Oo(t);
  if (o === Bt.walk) return Pm(e, n, s);
  const i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (b) => Math.abs(b) <= Em, c = o.shoulder ?? 0, h = (b, k) => l(b) ? k * c + o.arm * r : b, u = o.forearm ?? 0, d = l(n.leftShoulder) ? n.leftElbow - u - o.elbow * Math.max(0, -r) : n.leftElbow, f = l(n.rightShoulder) ? n.rightElbow + u + o.elbow * Math.max(0, r) : n.rightElbow, g = o.bounces ?? 1, p = (1 + Math.cos(i * 2 * g)) / 2, m = o.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + o.lean * s + (o.sway ?? 0) * Math.sin(i) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (o.bend ?? 0),
    headTilt: n.headTilt - o.lean * 0.5 * s + (o.headTilt ?? 0),
    leftElbow: d,
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
function Ui(t, e, n = 1) {
  const s = Oo(t), o = Bt.walk.swing, i = (r) => Math.sin(r * Math.PI / 180);
  return Im(e, n) * i(s.swing * n) / i(o * n);
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
const o0 = {
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
}, Ot = (t) => ({ ...o0, ...t }), kt = {
  neutral: o0,
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
const Jt = {
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
}, i0 = Object.keys(lt);
function is(t, e, n) {
  const s = { ...t };
  for (const o of i0) s[o] = t[o] + (e[o] - t[o]) * n;
  return s;
}
const Gi = 24, ml = 4, yl = 28, $m = 40;
function Pm(t, e = lt, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, o = Math.cos(t * Math.PI * 2) * n, i = (c) => Math.abs(c) <= $m, r = (c) => i(c) ? 22 * s : c, a = i(e.leftShoulder) ? e.leftElbow - yl * Math.max(0, -s) : e.leftElbow, l = i(e.rightShoulder) ? e.rightElbow + yl * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + ml * n,
    headTilt: e.headTilt - ml * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Gi * s,
    rightHip: -Gi * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, o),
    rightKnee: 30 * Math.max(0, -o),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function Im(t, e = 1) {
  return 4 * ((Vi + io) * t) * Math.sin(Gi * e * Math.PI / 180);
}
function Om(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const r0 = 0.12, bl = 0.46, _m = 1 - 2 * r0, Hm = 0.1, Cm = 0.21, Rm = 0.19, Vi = 0.24, io = 0.22, a0 = 0.12, Lm = 0.14, l0 = 0.33, wl = 0.7, kl = 0.3, Wm = 0.35, Fm = [1.7, 1.05], Nm = [1.3, 0.75], vl = [1.45, 0.85], Dm = [1.15, 0.75], Ml = 0.06, Bm = 0.7, zm = 0.65, c0 = 0.075, qm = 0.3, Ym = 0.02, jm = 0.012, Km = 12, Xm = 0.25, Ss = 90, Um = 0.25, Gm = 0.04, h0 = 0.01, We = (t) => Math.min(1, Math.max(0, t ?? 0));
function yM(t, e = 1) {
  return io * t * e;
}
const Ji = -0.12, u0 = 0.4, Gt = (t) => t * Math.PI / 180, Vm = (t, e) => ({ x: e * Math.sin(Gt(t)), y: Math.cos(Gt(t)) }), d0 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), f0 = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function Jm(t, e, n, s, o, i) {
  const r = Math.max(1, Math.min(i * 0.6, Lm * n)), a = We(e.turn), l = (a0 + l0 * a) * n, c = s + Ji * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, d = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - wl * a), squeeze: 1 - wl * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - kl * a), squeeze: 1 - kl * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = o, t.strokeStyle = o, t.lineWidth = r;
  for (const b of d) {
    const k = d0(b.open, e.blink);
    if (k < 0.2) {
      const E = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(b.x + l - 0.12 * n, c), t.quadraticCurveTo(b.x + l, c + E, b.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (k > 1.2) {
        const T = 0.13 * n * k;
        t.beginPath(), t.ellipse(b.x + l, c, T * 0.85, T, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = o;
      }
      const E = k > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(b.x + h, c + u, E, E * 1.1 * Math.min(k, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const w = f0(c, n, b.brow, k), y = b.x + l - b.side * 0.13 * n * b.squeeze, v = b.x + l + b.side * 0.13 * n * b.squeeze;
    t.beginPath(), t.moveTo(v, w), t.lineTo(y, w - e.browTilt * 0.1 * n), t.stroke();
  }
  const f = s + u0 * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - Wm * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, f), t.quadraticCurveTo(l, f + e.smile * 0.25 * n, l + g, f), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, f - 0.05 * n), t.lineTo(l + g, f - 0.05 * n), t.quadraticCurveTo(l, f + m * 2, l - g, f - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, f + m * 0.6), t.lineTo(l + g, f + m * 0.6), t.quadraticCurveTo(l, f - m * 1.4, l - g, f + m * 0.6)) : t.ellipse(l, f, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function p0(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), o = Math.sqrt(s), i = (e.headSize ?? 2 * r0) / 2, r = e.headSize === void 0 ? _m : 1 - 2 * i, a = i * n, l = We(t.sit), c = t.leftHip + (-Ss - t.leftHip) * l, h = t.leftKnee + (-Ss - t.leftKnee) * l, u = t.rightHip + (Ss - t.rightHip) * l, d = t.rightKnee + (Ss - t.rightKnee) * l, f = e.classic === !0, g = We(t.turn), p = (V, j, S, C, L) => {
    const $ = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Gt(j - S) / 2) + Gt(C))), R = Math.max(-1, Math.min(1, Bm + L)), N = g + (1 - g) * V * R;
    return f ? { x: 0, y: 0 } : { x: Math.cos($) * Ml * N, y: Math.sin($) * Ml };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, b = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let k = 0;
  if (l > 0 || !f) {
    const V = (L, $, R, N, z) => Vi * Math.cos(Gt($)) + io * Math.cos(Gt($ - R)) + Math.max(0, p(L, $, R, N, z).y), j = Math.max(
      V(-1, c, h, m.left, b.left),
      V(1, u, d, m.right, b.right)
    ), S = 1 - We((t.rise ?? 0) / Gm), C = (f ? Math.min(1, l / Um) : 1) * S;
    k = (bl - j) * C * n * s;
  }
  const w = -bl * n * s + k, y = -r * n * s + k, v = f ? 0 : (Ym * We(t.turn) + jm * l) * n * s, E = Gt(t.bend ?? 0), T = { end: Sl(w, y, E, 1), bend: E };
  let x;
  if (E !== 0) {
    x = [];
    for (let V = 0; V <= xl; V++) {
      const j = V / xl, S = Sl(w, y, E, j);
      x.push({ x: S.x - v * Math.sin(Math.PI * j), y: S.y });
    }
  } else
    x = v === 0 ? [{ x: 0, y: w }, { x: 0, y }] : $n({ x: 0, y: w }, { x: -v, y: (w + y) / 2 }, { x: 0, y }, 1, 8);
  const M = y + Hm * n * s, A = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), I = (V, j, S, C, L) => {
    const $ = Vm(S, C);
    return { x: V + $.x * L * n, y: j + $.y * L * n };
  }, P = (V, j, S) => {
    const C = I(0, w, j, V, Vi * s);
    return { root: { x: 0, y: w }, joint: C, end: I(C.x, C.y, j - S, V, io * s) };
  }, O = (V, j, S) => {
    const C = { x: V * A, y: M }, L = I(C.x, C.y, j, V, Cm * o);
    return { root: C, joint: L, end: I(L.x, L.y, j + S, V, Rm * o) };
  }, _ = { left: P(-1, c, h), right: P(1, u, d) }, W = (V, j, S, C, L, $) => {
    const R = p(V, S, C, L, $);
    return { x: j.end.x + R.x * n * s, y: j.end.y + R.y * n * s };
  }, B = (V, j, S, C, L) => I(j.end.x, j.end.y, S + C + L, V, c0 * o), K = {
    left: O(-1, t.leftShoulder, t.leftElbow),
    right: O(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(f ? 0 : qm, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: w,
    neckY: y,
    drop: k,
    lean: f ? t.lean : t.lean + Km * Math.sin(Math.PI * l),
    classic: f,
    legs: _,
    toes: {
      left: W(-1, _.left, c, h, m.left, b.left),
      right: W(1, _.right, u, d, m.right, b.right)
    },
    spine: x,
    chest: T,
    arms: K,
    handTips: {
      left: B(-1, K.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: B(1, K.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const xl = 10;
function Sl(t, e, n, s) {
  const o = t - e, i = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - o * s };
  const r = o / n;
  return { x: r * (1 - Math.cos(i)), y: t - r * Math.sin(i) };
}
function Zm(t, e) {
  if (t.chest.bend === 0) return e;
  const n = rs(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const Kn = (t, e) => e === 0 ? [t.root, t.joint, t.end] : $n(t.root, t.joint, t.end, e);
function rs(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = t.x - e.x, r = t.y - e.y;
  return { x: e.x + i * s - r * o, y: e.y + i * o + r * s };
}
function g0(t, e, n = !0) {
  const s = t1(t, e), o = e.spin ?? 0, i = e.rise ?? 0;
  return n && (o !== 0 || i !== 0) ? Qm(s, t, o, i) : s;
}
function m0(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Gt(e), lift: n * t.height };
}
function Qm(t, e, n, s) {
  const { pivot: o, angle: i, lift: r } = m0(e, n, s), a = (d) => {
    const f = rs(d, o, i);
    return { x: f.x, y: f.y - r };
  }, l = (d) => ({ left: a(d.left), right: a(d.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = h0 * e.height;
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
function t1(t, e) {
  const n = Gt(t.lean), s = Gt(e.headTilt), o = { x: 0, y: t.hipY }, i = (y) => ({ x: t.facing * y.x, y: y.y }), r = (y) => i(rs(y, o, n)), a = (y) => r(Zm(t, y)), l = (y) => a(rs({ x: y.x, y: y.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = Kn(t.arms.left, t.rubber).map(a), h = Kn(t.arms.right, t.rubber).map(a), u = (y, v) => Math.atan2(v.y - y.y, v.x - y.x), d = { left: a(t.handTips.left), right: a(t.handTips.right) }, f = (y, v) => {
    const [E, T] = y.slice(-2), x = t.arms[v], M = u(a(x.end), d[v]) - u(a(x.joint), a(x.end));
    return u(E, T) + M;
  };
  let g = 1 / 0;
  for (const [y, v] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const E = f0(Ji, 1, y, d0(v, e.blink));
    g = Math.min(g, E, E - e.browTilt * 0.1);
  }
  const p = { left: i(t.legs.left.end), right: i(t.legs.right.end) }, m = { left: i(t.toes.left), right: i(t.toes.right) }, b = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, k = Math.max(b.left, b.right), w = h0 * t.height;
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
    feetY: k,
    grounded: { left: b.left >= k - w, right: b.right >= k - w },
    fingertips: d,
    handAngle: { left: f(c, "left"), right: f(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: Kn(t.legs.left, t.rubber).map(i),
      rightLeg: Kn(t.legs.right, t.rubber).map(i),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: Ji,
      browTopY: g,
      mouthY: u0,
      faceX: t.facing * (a0 + l0 * We(e.turn))
    }
  };
}
function ae(t, e = {}) {
  return g0(p0(t, e), t);
}
function bM(t, e, n) {
  return rs({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function e1(t, e, n) {
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
function n1(t, e, n = {}, s = 0) {
  const o = p0(e, n), i = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? g0(o, e, !1) : void 0, l = n.sketch ? Yi(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Yi(t, n.sketch, s) : void 0, h = (T) => {
    t.save(), T(), t.restore();
  }, u = (T) => {
    T && a && h(() => T(t, a, s, c));
  }, d = () => t.scale(o.facing, 1), f = () => {
    d(), t.translate(0, o.hipY), t.rotate(Gt(o.lean)), t.translate(0, -o.hipY);
  }, g = () => {
    f(), o.chest.bend !== 0 && (t.translate(o.chest.end.x, o.chest.end.y), t.rotate(o.chest.bend), t.translate(0, -o.neckY));
  }, p = (T, x, M) => {
    if (l) return x ? l.curve(T) : l.line(T);
    if (o.classic) {
      t.beginPath(), t.moveTo(T[0].x, T[0].y);
      for (const A of T.slice(1)) t.lineTo(A.x, A.y);
      t.stroke();
      return;
    }
    Lr(t, T, M[0] * o.lineWidth, M[1] * o.lineWidth);
  }, m = (T, x) => p(Kn(T, o.rubber), o.rubber > 0, x), b = (T) => {
    o.classic || p([o.legs[T].end, o.toes[T]], !1, Dm);
  }, k = (T) => {
    if (n.hands && !o.classic) return y(T);
    if (o.classic || l) return;
    const x = o.arms[T].end;
    t.beginPath(), t.arc(x.x, x.y, zm * o.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = i, t.fillStyle = i, t.lineWidth = o.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const w = m0(o, e.spin ?? 0, e.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (t.translate(0, -w.lift), t.translate(w.pivot.x, w.pivot.y), t.rotate(w.angle), t.translate(-w.pivot.x, -w.pivot.y));
  function y(T) {
    const x = n.hands ?? {}, M = o.arms[T].end, A = o.handTips[T], I = n.headFill ?? "#ffffff";
    Wr(t, M, x[T] ?? Pt, {
      side: T,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(A.x - M.x, M.y - A.y) * 180 / Math.PI,
      size: (x.size ?? c0) * o.height * Math.sqrt(o.stretch),
      skin: x.skin ?? (I === "none" ? void 0 : I),
      ink: i,
      lineWidth: o.lineWidth * 0.45,
      fingers: x.fingers,
      plump: x.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const v = (T) => {
    h(() => {
      g(), m(o.arms[T], Nm), k(T);
    });
    const x = r.sleeve;
    x && a && h(() => x(t, a, T, s, c));
  }, E = We(e.turn) > Xm;
  u(r.behind), h(() => {
    d(), m(o.legs.left, vl), b("left"), m(o.legs.right, vl), b("right");
  }), E && v("left"), h(() => {
    f(), p(o.spine, o.spine.length > 2, Fm);
  }), h(() => {
    g();
    const { left: T, right: x } = { left: o.arms.left.root, right: o.arms.right.root };
    if (T.x !== x.x)
      if (o.classic) p([T, x], !1, [1, 1]);
      else {
        const M = { x: (T.x + x.x) / 2, y: T.y - 0.3 * Math.abs(x.x - T.x) };
        p($n(T, M, x, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), E || v("left"), v("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, o.neckY), t.rotate(Gt(e.headTilt));
    const T = -o.headRy;
    t.beginPath(), t.ellipse(0, T, o.headRx, o.headRy, 0, 0, Math.PI * 2);
    const x = n.headFill ?? "#ffffff";
    if (x !== "none" && (t.fillStyle = x, t.fill()), l) {
      l.ellipse(0, T, o.headRx, o.headRy);
      const M = l.nudge();
      t.translate(M.x, M.y);
    } else
      t.stroke();
    t.translate(0, T), t.scale(o.headRx / o.r, o.headRy / o.r), Jm(t, e, o.r, 0, i, o.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = i, t.font = n.labelFont ?? `700 ${Math.round(o.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -o.height * o.stretch - 0.04 * o.height + o.drop), t.restore());
}
function y0(t, e, n, s) {
  const o = { ...t }, i = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? is(o, Am(i, t.walk, o), t.walking) : o, a = o1(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = is(r, c.pose, l), c.hands) {
      const h = (u, d) => d ? os(u ?? Pt, d, l) : u;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * Om(e)) }), { pose: r, hands: a };
}
function s1(t, e, n, s) {
  return y0(t, e, n, s).pose;
}
const b0 = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, ro = (t, e) => `hand.${t}.${e}`;
function o1(t) {
  const e = (o) => {
    if (typeof t[ro(o, "spread")] == "number")
      return Object.fromEntries(Object.keys(Pt).map((i) => [i, t[ro(o, i)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function i1(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function w0(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, o = { ..._t(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, i = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? Pt;
      for (const l of Object.keys(Pt)) i[ro(r, l)] = a[l] ?? Pt[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...o, ...i },
    about: r1(Object.keys(i), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = y0(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), n1(r, h.pose, i1({ ...e, rubber: c.rubber, facing: b0(c, e) }, h.hands), l);
    }
  };
}
function r1(t, e) {
  const n = { ...Qh, ...t0 };
  for (const s of t) {
    const [, o, ...i] = s.split("."), r = e0[i.join(".")];
    r && (n[s] = { ...r, description: `${o === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return Zg(e);
    }
  };
}
function k0(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (o.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? i = h : c === "y" || c === "motionPathY" ? r = h : c in o && (o[c] = h));
  const a = s1(o, e.time, t.figureDance, t.figureGaits), l = ae(a, { ...s, rubber: o.rubber, facing: b0(o, s) });
  return { pose: a, joints: e1(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function Fr(t) {
  const e = [];
  return t.forEach((n, s) => {
    const o = s === 0 ? lt : e[s - 1], i = typeof n.pose == "string" ? Jt[n.pose] : { ...o, ...n.pose };
    e.push(n.expression ? Le(i, n.expression) : i);
  }), e;
}
function wM(t, e) {
  const n = Fr(e);
  return i0.filter((s) => n.some((o) => o[s] !== lt[s])).map((s) => ({
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
const si = 0.5, Zi = {
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
function ao(t) {
  return typeof t != "string" ? t : t in Zi ? Zi[t] : Ht[t];
}
function v0(t, e, n) {
  const s = [];
  for (const o of t.keys) {
    const i = s[s.length - 1], r = !i || o.reset ? { pose: e, ...n } : i;
    s.push({
      beat: o.beat,
      pose: { ...r.pose, ...o.pose },
      left: o.hands?.left ? ao(o.hands.left) : r.left,
      right: o.hands?.right ? ao(o.hands.right) : r.right,
      easing: o.easing ?? t.easing
    });
  }
  return s;
}
const Nr = (t, e) => (t % e + e) % e;
function a1(t, e, n, s) {
  const o = v0(t, n, s);
  if (o.length === 0) return { pose: n, hands: s };
  const i = Nr(e, t.beats);
  let r = o.length - 1;
  for (let f = 0; f < o.length; f++) o[f].beat <= i && (r = f);
  const a = o[r], l = o[(r + 1) % o.length], c = a.beat <= i ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (i - c) / (h - c) : 0, d = Rt(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: is(a.pose, l.pose, d),
    hands: { left: os(a.left, l.left, d), right: os(a.right, l.right, d) }
  };
}
const l1 = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], c1 = ["lean", "headTilt", "lookX", "spin"], h1 = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function u1(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, o] of l1) {
    const i = n && h1.has(s) ? -1 : 1;
    e[s] = i * t[o], e[o] = i * t[s];
  }
  if (!n) for (const s of c1) e[s] = -t[s];
  return e;
}
const d1 = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function f1(t, e, n) {
  const s = Nr(n, 1), o = (1 + Math.cos(2 * Math.PI * s)) / 2, i = e.bounce * (e.accent === "up" ? 1 - o : o), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = d1(r);
  return {
    ...t,
    leftHip: t.leftHip + a * i / 2,
    rightHip: t.rightHip + i / 2,
    leftKnee: t.leftKnee + a * i,
    rightKnee: t.rightKnee + i,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function Qi(t) {
  const e = { ...lt, ...t.stance };
  return t.expression ? Le(e, t.expression) : e;
}
function M0(t) {
  return {
    left: t.hands?.left ? ao(t.hands.left) : Pt,
    right: t.hands?.right ? ao(t.hands.right) : Pt
  };
}
function oi(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const o = a1(s, n, Qi(t), M0(t));
  return e.mirror ? { pose: u1(o.pose), hands: { left: o.hands?.right, right: o.hands?.left } } : o;
}
function Dr(t, e, n = {}) {
  const s = typeof t == "string" ? Je[t] : t;
  let o;
  if (n.move)
    o = oi(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const i = s.routine, r = i.reduce((u, d) => u + d.beats, 0), a = Nr(e, r);
    let l = 0, c = 0;
    for (; c < i.length - 1 && a >= l + i[c].beats; ) l += i[c++].beats;
    const h = a - l;
    if (o = oi(s, i[c], h), h < si && i.length > 1 && e >= si) {
      const u = i[(c - 1 + i.length) % i.length], d = oi(s, u, u.beats + h), f = Rt("ease-in-out")(h / si);
      o = {
        pose: is(d.pose, o.pose, f),
        hands: { left: os(d.hands.left, o.hands.left, f), right: os(d.hands.right, o.hands.right, f) }
      };
    }
  }
  return { ...o, pose: f1(o.pose, s.groove, e) };
}
function kM(t, e, n = {}) {
  return Dr(t, e, n).pose;
}
function Br(t) {
  return (typeof t == "string" ? Je[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const p1 = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function Tl(t, e, n, s, o, i, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < i || h >= r))
        for (const u of l.taps ?? []) o.push({ beat: h, tap: s ? p1[u] : u });
    }
}
function vM(t, e, n, s = {}) {
  const o = typeof t == "string" ? Je[t] : t, i = [];
  if (n <= e) return i;
  if (s.move) {
    const r = o.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    Tl(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, i, e, n);
  } else {
    const r = Br(o);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of o.routine)
        Tl(o.moves[c.move], l, c.beats, c.mirror, i, e, n), l += c.beats;
    }
  }
  return i.sort((r, a) => r.beat - a.beat);
}
function El(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (v0(n, Qi(t), M0(t))[0]?.pose.turn ?? Qi(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function x0(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function ii(t, e, n = {}) {
  const s = typeof t == "string" ? Je[t] : t, o = x0(s, n), i = o.reduce((h, u) => h + u.beats, 0), r = o.reduce((h, u) => h + El(s, u) * u.beats, 0), a = Math.floor(e / i);
  let l = a * r, c = e - a * i;
  for (const h of o) {
    const u = Math.min(h.beats, c);
    if (l += El(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function g1(t, e, n) {
  const s = x0(t, n), o = [0];
  let i = 0;
  for (let r = 0; i < e; r = (r + 1) % s.length)
    i += s[r].beats, o.push(Math.min(i, e));
  return o;
}
const m1 = 8;
function y1(t, e, n) {
  const s = typeof e == "string" ? Je[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : Br(s)), r = g1(s, i, n);
  if (r.every((b) => ii(s, b, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, i / 2), l = Rt("ease-in-out"), c = (b) => a <= 0 ? 1 : Math.min(l(Math.min(1, b / a)), l(Math.min(1, (i - b) / a))), h = Math.ceil(a * m1), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (b, k) => [k / h * a, i - k / h * a]).flat(), d = [.../* @__PURE__ */ new Set([...r, ...u])].sort((b, k) => b - k);
  let f = 0;
  const g = d.map((b, k) => {
    if (k > 0) {
      const w = d[k - 1], y = Math.max(1, Math.ceil((b - w) * 16));
      for (let v = 0; v < y; v++) {
        const E = w + (b - w) * v / y, T = w + (b - w) * (v + 1) / y;
        f += (ii(s, T, n) - ii(s, E, n)) * c((E + T) / 2);
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
function MM(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function xM(t, e = {}) {
  return (n) => Dr(t, n, e);
}
function SM(t, e) {
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
function TM(t, e, n = {}) {
  const s = typeof e == "string" ? Je[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : Br(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(i * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const b = m / r;
    return { time: a + b * 6e4 / o, frame: Dr(s, b, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((b) => ({ time: b.time, value: m(b.frame) }))
  }), d = Object.keys(lt).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== lt[p]).map((p) => h(p, (m) => m.pose[p])), f = n.height === void 0 ? void 0 : y1(t, s, { ...n, bpm: o, beats: i, start: a, height: n.height, fade: 0 });
  if (f && d.push(f), n.hands === !1) return d;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys(Pt)) {
      const b = (k) => k.hands?.[p]?.[m] ?? Pt[m];
      c.some((k) => b(k.frame) !== Pt[m]) && g.push(h(ro(p, m), b));
    }
  return [...d, ...g];
}
const Vn = { type: "back", mode: "out", overshoot: 1.1 }, Dt = "ease-out-cubic", b1 = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: Dt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Dt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Dt },
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
}, w1 = {
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
}, k1 = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: Dt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: Dt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: Dt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: Vn },
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
}, v1 = {
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
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: Dt },
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
}, M1 = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: Vn,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: Vn },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: Vn },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: Dt,
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
}, x1 = {
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
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Ht.open, turn: 2 } }, easing: Dt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: Dt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: Dt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: Dt }
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
}, S1 = {
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
}, T1 = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, E1 = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...T1, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, A1 = {
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
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: Dt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: Dt },
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
}, $1 = {
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
}, P1 = {
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
          easing: Vn
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
  disco: b1,
  hipHop: w1,
  breaking: k1,
  jazz: v1,
  kpop: M1,
  bollywood: x1,
  bhangra: S1,
  bharatanatyam: E1,
  charleston: A1,
  tap: $1,
  popping: P1
}, lo = (t) => Math.min(1, Math.max(0, t));
function I1(t) {
  const e = { ...lt, turn: t.view }, n = [];
  for (const s of t.keys) {
    const o = n[n.length - 1], i = !o || s.reset ? e : o.pose;
    n.push({ at: s.at, pose: { ...i, ...s.pose }, easing: s.easing });
  }
  return n;
}
function O1(t) {
  return t - _1 * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const _1 = 0.5;
function H1(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function C1(t, e) {
  const n = typeof t == "string" ? _o[t] : t, s = I1(n), o = lo(e);
  let i = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= o && (i = u);
  const r = s[i], a = s[Math.min(i + 1, s.length - 1)], l = a.at > r.at ? (o - r.at) / (a.at - r.at) : 0, c = is(r.pose, a.pose, Rt(a.easing ?? "ease-in-out")(lo(l))), h = H1(n, o);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * O1(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function R1(t, e, n) {
  const s = typeof t == "string" ? _o[t] : t, o = lo(e), i = lo((o - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * i;
}
function EM(t, e, n = {}) {
  const s = typeof e == "string" ? _o[e] : e, o = n.start ?? 0, i = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const d = u / r;
    return { time: o + d * i, progress: d, pose: C1(s, d) };
  }), c = Object.keys(lt).filter((h) => a.some((u) => u.pose[h] !== lt[h])).map((h) => ({
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
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * R1(s, u.progress, n.height) }))
    });
  }
  return c;
}
const L1 = {
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
}, W1 = {
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
}, Ts = {
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
}, F1 = {
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
}, N1 = {
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
function nn(t, e, n, s, o, i = 1300) {
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
      { at: 0.16, pose: L1 },
      { at: 0.27, pose: W1, easing: "ease-out-quad" },
      ...o,
      { at: 0.76, pose: F1 },
      { at: 0.86, pose: N1, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const _o = {
  frontFlip: nn("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: Ts, easing: "ease-out-cubic" },
    { at: 0.64, pose: Ts }
  ]),
  backFlip: nn("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...Ts, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...Ts, lean: 18 } }
  ]),
  layout: nn("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: nn("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: nn("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: nn("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, tr = {
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
}, ri = 0.215, ai = 0.205, D1 = 0.065, Al = 0.035, B1 = 0.165, z1 = 0.155, q1 = 12, Y1 = 0.3, j1 = 0.7, K1 = 0.35, X1 = (t) => t * Math.PI / 180, ft = {
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
  pupil: 1,
  lid: 0,
  bulge: 0,
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
  return { ...ft, ...t };
}
const U1 = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX", "hair.swing"]);
function G1(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const o = n.replace(/(^|\.)(left|right)(\.|$)/, (i, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[o] = U1.has(n) ? -s : s;
  }
  return e;
}
function Mt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}
const ce = {
  rest: ft,
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
}, V1 = ["round", "flat", "pointed", "big"], J1 = {
  round: { length: 1, width: [0.95, 0.7] },
  flat: { length: 1.12, width: [0.85, 0.85] },
  pointed: { length: 1.25, width: [1, 0.3] },
  big: { length: 1.5, width: [1.25, 1.1] }
};
function Z1(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, o = t.legLength ?? 1, i = t.armLength ?? 1, r = J1[t.feet ?? "round"], a = Math.max(0.12, 1 - e - Al - (ri + ai) * o), l = (u) => ({
    id: `arm.${u}`,
    parent: "spine",
    offset: [(u === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: u === "left" ? 1 : -1,
    bones: [
      { length: B1 * i, width: [1.25, 0.9] },
      { length: z1 * i, width: [0.9, 0.75] }
    ]
  }), c = (u) => ({
    id: `leg.${u}`,
    parent: null,
    offset: [(u === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: u === "left" ? 1 : -1,
    bones: [
      { length: ri * o, width: [1.45, 1.05] },
      { length: ai * o, width: [1.05, 0.85] },
      { length: D1 * Math.sqrt(o) * r.length, width: r.width }
    ]
  }), h = (u, d) => u[d] ?? ft[d] ?? 0;
  return {
    id: "human",
    hipHeight: (ri + ai) * o,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: Al, width: [1, 0.9] }] },
      l("left"),
      l("right")
    ],
    head: { on: "neck", size: e },
    contacts: [
      ...["left", "right"].flatMap((u) => [
        { chain: `leg.${u}`, joint: 1 },
        { chain: `leg.${u}`, joint: 2 },
        { chain: `leg.${u}`, joint: 3 },
        { chain: `arm.${u}`, joint: 1 },
        { chain: `arm.${u}`, joint: 2 }
      ]),
      { chain: "spine", joint: 0 },
      { chain: "spine", joint: 1 },
      { chain: "spine", joint: 2 },
      { head: "top" }
    ],
    angles(u, d) {
      if (d.id === "spine") {
        const k = -h(u, "lean") / 2, w = h(u, "side") / 2, y = -h(u, "bend");
        return [
          { swing: k + y * Y1, spread: w },
          { swing: k + y * j1, spread: w }
        ];
      }
      if (d.id === "neck") return [{ swing: -h(u, "bend") * K1, spread: 0 }];
      const [f, g] = d.id.split("."), p = (k) => h(u, `${f}.${g}.${k}`);
      if (f === "arm")
        return [
          { swing: p("swing"), spread: p("spread") },
          { swing: p("elbow"), spread: p("bend") }
        ];
      const m = (d.side ?? 1) * p("rotate"), b = 1 - Math.cos(X1(p("rotate")));
      return [
        { swing: p("swing"), spread: p("spread"), yaw: m },
        { swing: -p("knee"), spread: 0, yaw: m },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + p("ankle") - b * (p("swing") - p("knee")), spread: 0, yaw: (q1 + p("toeOut")) * (d.side ?? 1) }
      ];
    },
    withAngles(u, d, f) {
      const [g, p] = d.id.split("."), m = (b) => `${g}.${p}.${b}`;
      return g === "arm" ? {
        ...u,
        [m("swing")]: f[0].swing,
        [m("spread")]: f[0].spread,
        [m("elbow")]: f[1].swing,
        [m("bend")]: f[1].spread
      } : g === "leg" ? { ...u, [m("swing")]: f[0].swing, [m("spread")]: f[0].spread, [m("knee")]: -f[1].swing } : u;
    },
    boneScale(u, d) {
      const f = Math.min(3, Math.max(0.3, h(u, "stretch")));
      return d?.id.startsWith("arm.") ? Math.sqrt(f) : f;
    },
    headPose(u) {
      const d = Math.min(3, Math.max(0.3, h(u, "stretch")));
      return {
        yaw: h(u, "head.turn"),
        nod: h(u, "head.nod"),
        tilt: h(u, "head.tilt"),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(d),
        sy: Math.sqrt(d)
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
function AM(t) {
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
    pupil: "Pupil size",
    lid: "Eyelids lowered",
    bulge: "Eyes bulging",
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
const Q1 = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, ty = { blush: 0, tears: 0, sweat: 0, pupil: 1, lid: 0, bulge: 0 }, Ze = Object.fromEntries(
  Object.entries(kt).map(([t, e]) => [
    t,
    { ...Object.fromEntries(Object.entries(e).map(([n, s]) => [Q1[n] ?? n, s])), ...ty }
  ])
);
Ze.crying.tears = 1;
Ze.scared.sweat = 0.8;
Ze.scared.bulge = 0.4;
Ze.sleepy.lid = 0.5;
Ze.worried.sweat = 0.6;
const Xt = (t) => ({ ...Ze.neutral, ...t }), S0 = {
  ...Ze,
  laughing: Xt({ mouth: 0.75, smile: 1, mouthWidth: 1.25, "eye.left": 0, "eye.right": 0, "brow.left": 0.5, "brow.right": 0.5 }),
  afraid: Xt({ mouth: 0.4, smile: -0.6, mouthWidth: 0.9, "eye.left": 1.3, "eye.right": 1.3, "brow.left": 0.6, "brow.right": 0.6, browTilt: 1, sweat: 1, pupil: 0.8, bulge: 0.5 }),
  bored: Xt({ smile: -0.05, mouthWidth: 0.6, "eye.left": 0.45, "eye.right": 0.45, "brow.left": -0.4, "brow.right": -0.4, lookX: 0.5 }),
  tired: Xt({ mouth: 0.2, smile: -0.3, mouthWidth: 0.7, "eye.left": 0.3, "eye.right": 0.3, "brow.left": -0.1, "brow.right": -0.1, browTilt: 0.6, lookY: 0.6 }),
  embarrassed: Xt({ smile: 0.4, mouthWidth: 0.7, "eye.left": 0.9, "eye.right": 0.9, browTilt: 0.7, "brow.left": 0.2, "brow.right": 0.2, lookX: -0.6, lookY: 0.5, blush: 1 }),
  proud: Xt({ smile: 0.75, mouthWidth: 1, "eye.left": 0.75, "eye.right": 0.75, "brow.left": 0.5, "brow.right": 0.5, lookY: -0.2 }),
  determined: Xt({ smile: 0.35, mouthWidth: 0.8, "eye.left": 0.85, "eye.right": 0.85, "brow.left": -0.5, "brow.right": -0.5, browTilt: -0.9 }),
  affectionate: Xt({ smile: 0.85, "eye.left": 0, "eye.right": 0, "brow.left": 0.3, "brow.right": 0.3, blush: 0.8 }),
  hurt: Xt({ smile: -0.7, mouthWidth: 0.8, "eye.left": 1.1, "eye.right": 1.1, "brow.left": 0.2, "brow.right": 0.2, browTilt: 1, lookY: 0.3, tears: 0.35 }),
  suspicious: Xt({ smile: -0.25, mouthWidth: 0.7, "eye.left": 0.5, "eye.right": 0.85, "brow.left": -0.6, "brow.right": 0.4, browTilt: -0.3, lookX: 0.8, lid: 0.3 }),
  relieved: Xt({ smile: 0.7, "eye.left": 0, "eye.right": 0, "brow.left": 0.4, "brow.right": 0.4, browTilt: 0.4 }),
  excited: Xt({ mouth: 0.6, smile: 1, mouthWidth: 1.1, "eye.left": 1.4, "eye.right": 1.4, "brow.left": 0.9, "brow.right": 0.9, blush: 0.4, pupil: 1.3 })
};
function ey(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, o = { ...ft, turn: n }, i = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of i) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    o[`arm.${l}.spread`] = h * s, o[`arm.${l}.swing`] = c * h * n, o[`arm.${l}.bend`] = u * s, o[`arm.${l}.elbow`] = c * u * n;
    const d = t[`${a}Hip`], f = t[`${a}Knee`], g = s + c * n;
    o[`leg.${l}.rotate`] = 90 * s, o[`leg.${l}.spread`] = 0, o[`leg.${l}.swing`] = d * g, o[`leg.${l}.knee`] = f * g, o[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), o[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * ny, o[`eye.${l}`] = t[`${a}Eye`], o[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(o, sy(l, e[a] ?? Pt, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  o.lean = t.lean * n, o.bend = r * n, o.side = (t.lean + r * 0.5) * s, o["head.tilt"] = (t.headTilt + r * 0.5) * s, o["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) o[a] = t[a];
  return o.lift = t.rise ?? 0, o.roll = t.spin ?? 0, o;
}
const ny = 70;
function sy(t, e, n, s) {
  const o = t === "right" ? 1 - s : 1 + s, i = {};
  for (const r of Object.keys(Pt)) i[`hand.${t}.${r}`] = e[r] ?? Pt[r];
  return i[`hand.${t}.turn`] = (e.turn ?? 0) - o, i[`hand.${t}.roll`] = (e.roll ?? 0) + n, i;
}
const ne = (t) => t * Math.PI / 180;
function zr([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t, e * o + n * i, -e * i + n * o];
}
function qr([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - e * i, t * i + e * o, n];
}
function Ie([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o + n * i, e, -t * i + n * o];
}
const $e = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], co = (t, e) => [t[0] * e, t[1] * e, t[2] * e], qs = (t, e) => qr(zr(t, e.swing), e.spread);
function li(t, e) {
  const n = Ie(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Yr(t, e, n) {
  const s = n, i = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const b = p.at ?? (m ? m.joints3.length - 1 : 0), k = m ? m.joints3[b] : i, w = m ? m.frames[Math.max(0, b - 1)] : { swing: 0, spread: 0 }, y = p.offset ? $e(k, qs(co(p.offset, s), w)) : k, v = p.side ?? 1, E = t.boneScale?.(e, p) ?? 1, T = t.angles(e, p), x = [y], M = [];
    let A = w.swing, I = w.spread;
    p.bones.forEach((P, O) => {
      const _ = T[O] ?? { swing: 0, spread: 0 };
      A += ne(_.swing), I += ne(_.spread) * v, M.push({ swing: A, spread: I });
      const W = Ie(qs(p.rest, { swing: A, spread: I }), ne(_.yaw ?? 0));
      x.push($e(x[O], co(W, P.length * s * E)));
    }), r[p.id] = { joints3: x, frames: M };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, d = h * l.sy, f = (p) => qs(Ie(zr(qr(p, -ne(l.tilt)), -ne(l.nod)), ne(l.yaw)), c), g = $e(a.joints3[a.joints3.length - 1], f([0, d, 0]));
  return { height: s, root: i, chains: r, head: { center: g, rx: u, ry: d, toBody: f } };
}
function jr(t, e, n) {
  const s = n.height, o = ne(90 * (e.turn ?? 0)), i = Yr(t, e, s), { root: r } = i, a = i.chains, { rx: l, ry: c } = i.head, h = i.head.toBody, u = i.head.center, d = {};
  for (const M of t.chains) {
    const { joints3: A, frames: I } = a[M.id], P = A.map((O) => li(O, o));
    d[M.id] = {
      id: M.id,
      joints3: A,
      frames: I,
      points: P.map((O) => O.point),
      depths: P.map((O) => O.depth)
    };
  }
  const f = li(u, o), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => Ie(h(M), o)), p = li(r, o).point, m = ne(e.roll ?? 0), b = (M) => {
    const A = M.x - p.x, I = M.y - p.y;
    return { x: p.x + A * Math.cos(m) - I * Math.sin(m), y: p.y + A * Math.sin(m) + I * Math.cos(m) };
  }, k = ([M, A, I]) => [M * Math.cos(m) + A * Math.sin(m), -M * Math.sin(m) + A * Math.cos(m), I];
  for (const M of Object.values(d)) M.points = M.points.map(b);
  const w = {
    center: b(f.point),
    depth: f.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(k)
  }, y = w.axes[1];
  w.angle = Math.atan2(y[0], y[1]);
  const v = (M) => {
    if ("head" in M) return { x: w.center.x + y[0] * c, y: w.center.y - y[1] * c };
    const A = d[M.chain];
    return A.points[Math.min(M.joint, A.points.length - 1)];
  };
  let E = 0;
  (n.contact ?? "ground") === "ground" && (E = -Math.max(...t.contacts.map((M) => v(M).y))), E -= (e.lift ?? 0) * s;
  const T = (M) => ({ x: M.x, y: M.y + E });
  for (const M of Object.values(d)) M.points = M.points.map(T);
  w.center = T(w.center);
  const x = t.contacts.map((M) => ({ spec: M, point: v(M) }));
  return {
    height: s,
    view: o,
    chains: d,
    head: w,
    hip: T(b(p)),
    contacts: x,
    groundY: Math.max(...x.map((M) => M.point.y))
  };
}
const er = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], T0 = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Kr(t, e, n) {
  const s = n.height, o = ne(90 * (e.turn ?? 0)), i = ne(e.roll ?? 0), r = Yr(t, e, s), a = Ie(r.root, o), l = (m) => $e(qr(er(Ie(m, o), a), -i), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => T0(er(l($e(r.head.center, r.head.toBody(m))), h)), d = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], f = (m) => {
    if ("head" in m) return $e(h, co(d[1], r.head.ry));
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
function Xr(t, e, n, s) {
  const o = n.height, i = ne(90 * (e.turn ?? 0)), r = Yr(t, e, o), a = Kr(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (M) => {
    if ("head" in M) return $e(h, co(a.head.axes[1], a.head.ry));
    const A = c[M.chain];
    return A[Math.min(M.joint, A.length - 1)];
  }, d = s.toView(l), f = s.toScreen(d), g = s.toScreen([d[0] + 1, d[1], d[2]]), p = Math.hypot(g.x - f.x, g.y - f.y), m = (M) => {
    const A = s.toView(M);
    return { point: s.toScreen(A), depth: A[2] * p };
  }, b = {};
  for (const M of t.chains) {
    const A = c[M.id].map(m);
    b[M.id] = {
      id: M.id,
      joints3: r.chains[M.id].joints3,
      frames: r.chains[M.id].frames,
      points: A.map((I) => I.point),
      depths: A.map((I) => I.depth)
    };
  }
  const k = s.toView(h), w = s.toScreen(k), y = s.toScreen([k[0] + 1, k[1], k[2]]), v = Math.hypot(y.x - w.x, y.y - w.y), E = a.head.axes.map((M) => T0(er(s.toView($e(h, M)), k))), T = {
    center: w,
    depth: k[2] * p,
    rx: r.head.rx * v,
    ry: r.head.ry * v,
    angle: Math.atan2(E[1][0], E[1][1]),
    axes: E
  }, x = t.contacts.map((M) => ({ spec: M, point: m(u(M)).point }));
  return {
    height: o * p,
    view: i,
    chains: b,
    head: T,
    hip: f,
    contacts: x,
    groundY: Math.max(...x.map((M) => M.point.y))
  };
}
function Ur(t, [e, n, s]) {
  const [o, i, r] = t.axes, a = [
    o[0] * e * t.rx + i[0] * n * t.ry + r[0] * s * t.rx,
    o[1] * e * t.rx + i[1] * n * t.ry + r[1] * s * t.rx,
    o[2] * e * t.rx + i[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (o[2] * e + i[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class E0 {
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
function oy(t) {
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
const Gr = Math.PI * 2;
function iy(t, e = 16) {
  const n = new E0(), s = Math.max(6, Math.round(e)), o = Math.max(3, Math.round(s / 2)), i = [];
  for (let r = 0; r <= o; r++) {
    const a = r / o * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * Gr, u = Math.sin(a) * Math.sin(h), d = Math.cos(a), f = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(u * t, d * t, f * t, u, d, f));
    }
    i.push(l);
  }
  for (let r = 0; r < o; r++)
    for (let a = 0; a < s; a++) {
      const l = i[r][a], c = i[r + 1][a], h = i[r + 1][a + 1], u = i[r][a + 1];
      r > 0 && n.triangle(l, c, u), r < o - 1 && n.triangle(c, h, u);
    }
  return n.build();
}
function $l(t, e, n, s, o) {
  const i = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: o }, (a, l) => {
    const c = l / o * Gr;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < o; a++) {
    const l = r[a], c = r[(a + 1) % o];
    s === 1 ? t.triangle(i, l, c) : t.triangle(i, c, l);
  }
}
function A0(t, e, n = 24) {
  const s = new E0(), o = Math.max(6, Math.round(n)), i = e / 2, r = -e / 2, a = (h) => Array.from({ length: o + 1 }, (u, d) => {
    const f = d / o * Gr;
    return s.vertex(Math.sin(f) * t, h, Math.cos(f) * t, Math.sin(f), 0, Math.cos(f));
  }), l = a(r), c = a(i);
  for (let h = 0; h < o; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return $l(s, t, i, 1, o), $l(s, t, r, -1, o), s.build();
}
function ho(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of oy(t))
    for (const s of n.faces) {
      const o = n.faces.find((i) => i !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: o });
    }
  return { ...t, faceEdges: e };
}
const Es = (t) => t * 180 / Math.PI, sn = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], ci = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], Xn = (t) => Math.hypot(t[0], t[1], t[2]), nr = (t) => {
  const e = Xn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, As = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function Pl(t) {
  const [e, n, s] = nr(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function ry(t, e, n, s, o) {
  const i = t.chains.find((A) => A.id === n);
  if (!i) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (i.bones.length < 2 || i.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = jr(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: o.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = Xn(sn(a.joints3[1], a.joints3[0])), h = Xn(sn(a.joints3[2], a.joints3[1])), u = i.parent ? r.chains[i.parent].frames[Math.max(0, (i.at ?? r.chains[i.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, d = sn(s, l), f = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, Xn(d))), g = nr(d), p = i.parent !== null, m = qs(i.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), u);
  let b = sn(m, [g[0] * ci(m, g), g[1] * ci(m, g), g[2] * ci(m, g)]);
  Xn(b) < 1e-6 && (b = Ie([1, 0, 0], 0)), b = nr(b);
  const k = (c * c + f * f - h * h) / (2 * c * f), w = Math.sqrt(Math.max(0, 1 - k * k)), y = [
    l[0] + c * (k * g[0] + w * b[0]),
    l[1] + c * (k * g[1] + w * b[1]),
    l[2] + c * (k * g[2] + w * b[2])
  ], v = [l[0] + g[0] * f, l[1] + g[1] * f, l[2] + g[2] * f], E = i.side ?? 1, T = Pl(sn(y, l)), x = Pl(sn(v, y)), M = [
    { swing: Es(As(T.swing - u.swing)), spread: Es(As(T.spread - u.spread)) * E },
    { swing: Es(As(x.swing - T.swing)), spread: Es(As(x.spread - T.spread)) * E }
  ];
  return t.withAngles(e, i, M);
}
const $0 = 0.34, Nt = 0.12, Lt = -0.4, Wt = (t, e, n) => t[e] ?? n, ay = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), ly = 0.45, cy = 0.35, hy = 0.7;
function Et(t, e, n) {
  const s = (f) => Math.sqrt(Math.max(0, 1 - f.x * f.x - f.y * f.y)), o = Ur(t, [n.x, n.y, s(n)]).facing, i = t.axes[2], r = Math.atan2(i[0], i[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(cy, Math.abs(a)), h = l * Math.max(hy, Math.abs(a)), u = Math.cos(t.angle), d = Math.sin(t.angle);
  return {
    facing: o,
    points: e.map((f) => {
      const g = ly * Math.sin(r) + n.x * c + (f.x - n.x) * h, p = f.y + i[1] * s(f), m = g * t.rx, b = p * t.ry;
      return { x: t.center.x + m * u + b * d, y: t.center.y + m * d - b * u };
    })
  };
}
const Nn = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (o, i) => {
  const r = i / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), Il = (t, e, n, s) => {
  const o = Math.min(1, Math.max(0, (s - t.x) / (n.x - t.x))), i = 1 - o;
  return i * i * t.y + 2 * i * o * e.y + o * o * n.y;
}, Ys = (t, e, n, s, o = 16) => Array.from({ length: o }, (i, r) => {
  const a = Math.PI * 2 * r / o;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), wn = 0.05, uy = 0.3, dy = "#e06b7d";
function fy(t, e, n, s, o = {}, i) {
  const r = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), a = (P, O) => Et(e, P, O).points, l = (P, O) => Et(e, [], { x: P, y: O }).facing, c = Wt(n, "smile", 0), h = Wt(n, "blink", 0), u = Wt(n, "lookX", 0), d = Wt(n, "lookY", 0), f = Wt(n, "browTilt", 0), g = Math.max(0.2, Wt(n, "pupil", 1)), p = Math.min(1, Math.max(0, Wt(n, "lid", 0))), m = Math.min(1, Math.max(0, Wt(n, "bulge", 0)));
  for (const P of [1, -1]) {
    const O = P === 1 ? "left" : "right", _ = $0 * P;
    if (l(_, Nt) < wn) continue;
    const W = { x: _, y: Nt }, B = ay(Wt(n, `eye.${O}`, 1), h);
    if (B < 0.2) {
      const S = c > 0.5 ? 0.12 : -0.06;
      t.line(a(Nn({ x: _ - 0.12, y: Nt }, { x: _, y: Nt + S }, { x: _ + 0.12, y: Nt }), W), r);
    } else {
      const S = B > 1.2 || m > 0.02, C = 0.13 * Math.max(B, 1) * (1 + m * 0.7);
      S && t.shape(a(Ys(_, Nt, C * 0.85, C), W), "#ffffff", r);
      const L = (B > 1.2 ? 0.075 : 0.1) * g * (1 + m * 0.3), $ = _ + u * 0.08, R = Nt - d * 0.07, N = Ys($, R, L, L * 1.1 * Math.min(B, 1));
      if (t.shape(a(N, W), t.ink, 0), o.inPupil && i) {
        const [z] = a([{ x: $, y: R }], W), D = a(N, W), q = Math.min(...D.map((U) => Math.hypot(U.x - z.x, U.y - z.y)));
        q > 0.5 && (i.save(), i.beginPath(), i.arc(z.x, z.y, q, 0, Math.PI * 2), i.clip(), o.inPupil(i, { x: z.x, y: z.y, r: q, side: O }), i.restore());
      }
      if (p > 0.02) {
        const z = S ? C * 1.15 : L * 1.4, D = Nt + z, q = D - z * 2 * p, U = z * 1.1;
        t.shape(a([{ x: _ - U, y: D + 0.02 }, { x: _ + U, y: D + 0.02 }, { x: _ + U, y: q }, { x: _ - U, y: q }], W), o.skin ?? "#ffffff", 0), t.line(a([{ x: _ - U, y: q }, { x: _ + U, y: q }], W), r);
      }
    }
    const K = Nt + 0.3 + Wt(n, `brow.${O}`, 0) * 0.14 + Math.max(0, B - 1) * 0.12, V = { x: _ + P * 0.13, y: K }, j = { x: _ - P * 0.13, y: K + f * 0.1 };
    t.line(a([V, { x: (V.x + j.x) / 2, y: (V.y + j.y) / 2 }, j], { x: _, y: K }), r);
  }
  py(t, e, n, r);
  const b = { x: 0, y: Lt };
  if (l(0, Lt) < -wn) return;
  o.nose && l(0, Nt - 0.15) >= wn && t.line(a([{ x: 0.01, y: Nt - 0.1 }, { x: 0.03, y: Lt + 0.2 }, { x: -0.05, y: Lt + 0.17 }], { x: 0, y: Lt + 0.22 }), r);
  const k = 0.25 * Math.max(0.3, Wt(n, "mouthWidth", 1)), w = Math.min(1, Math.max(0, Wt(n, "mouth", 0)));
  if (w <= 0.05) {
    t.line(a(Nn({ x: -k, y: Lt }, { x: 0, y: Lt - c * 0.25 }, { x: k, y: Lt }), b), r);
    return;
  }
  const y = 0.3 * w;
  let v, E, T, x;
  if (c > 0.3) {
    const P = Lt + 0.05, O = { x: 0, y: Lt - y * 2 };
    v = [...Nn({ x: k, y: P }, O, { x: -k, y: P })], E = () => P, T = (_) => Il({ x: k, y: P }, O, { x: -k, y: P }, _), x = 0.85;
  } else if (c < -0.3) {
    const P = Lt - y * 0.6, O = { x: 0, y: Lt + y * 1.4 };
    v = [...Nn({ x: k, y: P }, O, { x: -k, y: P })], E = (_) => Il({ x: k, y: P }, O, { x: -k, y: P }, _), T = () => P, x = 0.5;
  } else {
    const P = k * 0.8;
    v = Ys(0, Lt, P, y);
    const O = (_) => y * Math.sqrt(Math.max(0, 1 - (_ / P) ** 2));
    E = (_) => Lt + O(_), T = (_) => Lt - O(_), x = 0.5;
  }
  if (t.shape(a(v, b), t.ink, 0), w < uy) return;
  const M = E(0) - T(0), A = k * x, I = (P, O, _ = 8) => Array.from({ length: _ + 1 }, (W, B) => P + (O - P) * B / _);
  if (o.tongue) {
    const P = A * 0.55, O = I(P, -P).map((W) => ({ x: W, y: T(W) })), _ = Nn({ x: -P, y: T(-P) }, { x: 0, y: T(0) + M * 0.8 }, { x: P, y: T(P) }, 8);
    t.shape(a([...O, ..._.slice(1, -1)], b), dy, 0);
  }
  if (o.teeth) {
    const P = Math.min(0.06, M * 0.4), O = I(-A, A).map((W) => ({ x: W, y: E(W) })), _ = O.map(({ x: W, y: B }) => ({ x: W * 0.92, y: B - P })).reverse();
    t.shape(a([...O, ..._], b), "#ffffff", 0);
    for (const W of [-0.5, 0, 0.5]) {
      const B = A * W;
      t.line(a([{ x: B, y: E(B) }, { x: B * 0.92, y: E(B) - P }], b), r * 0.6);
    }
  }
}
const Ol = "#8fd0f5", _l = (t, e, n) => Array.from({ length: 18 }, (s, o) => {
  const i = Math.PI * 2 * o / 18, r = Math.sin(i / 2);
  return { x: t + Math.sin(i) * n * r, y: e - n * 0.9 + Math.cos(i) * n * 1.6 * (0.55 + 0.45 * r) - n * 0.4 };
});
function py(t, e, n, s) {
  const o = Math.min(1, Math.max(0, Wt(n, "blush", 0))), i = Math.min(1, Math.max(0, Wt(n, "tears", 0))), r = Math.min(1, Math.max(0, Wt(n, "sweat", 0)));
  if (!(o + i + r <= 0.01)) {
    for (const a of [1, -1]) {
      const l = { x: 0.5 * a, y: -0.16 }, c = Et(e, [], l).facing >= wn;
      if (o > 0.01 && c) {
        const { points: u } = Et(e, Ys(l.x, l.y, 0.17, 0.1), l);
        if (t.shape(u, `rgba(240, 120, 140, ${(0.75 * o).toFixed(3)})`, 0), o > 0.5)
          for (const d of [-0.07, 0, 0.07]) {
            const f = [{ x: l.x + d - 0.018, y: l.y - 0.03 }, { x: l.x + d + 0.018, y: l.y + 0.03 }];
            t.line(Et(e, f, l).points, s * 0.3);
          }
      }
      const h = { x: $0 * a, y: Nt };
      if (i > 0.01 && Et(e, [], h).facing >= wn) {
        const u = 0.05 + 0.04 * i, d = { x: h.x + 0.06 * a, y: Nt - 0.2 - 0.12 * i };
        if (t.shape(Et(e, _l(d.x, d.y, u), d).points, Ol, s * 0.35), i > 0.6) {
          const f = [{ x: h.x + 0.05 * a, y: Nt - 0.1 }, { x: d.x, y: d.y + u * 0.8 }];
          t.line(Et(e, f, d).points, s * 0.3);
        }
      }
    }
    if (r > 0.01) {
      const a = { x: 0.64, y: 0.42 };
      Et(e, [], a).facing >= wn && t.shape(Et(e, _l(a.x, a.y, 0.05 + 0.05 * r), a).points, Ol, s * 0.35);
    }
  }
}
const gy = 15;
function me(t, e) {
  const n = Math.sqrt(Math.max(0, 1 - e * e));
  return [n * Math.sin(t), e, n * Math.cos(t)];
}
const my = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function ye(t, [e, n, s]) {
  const [o, i, r] = t.axes;
  return o[2] * e + i[2] * n + r[2] * s;
}
function zt(t, e) {
  return Ur(t, e).point;
}
function uo(t, e) {
  const n = Math.abs(t - e) % (Math.PI * 2);
  return n > Math.PI ? Math.PI * 2 - n : n;
}
function Ho(t, e, n = 64) {
  const s = e.top ?? 1, o = e.bottom ?? -1, i = Math.max(8, Math.ceil((s - o) * gy)), r = (g) => Math.min(s, Math.max(o, s - (s - o) * (g - 1) / i)), a = (g) => -Math.PI + Math.PI * 2 * g / n, l = (g, p) => e.normal ? e.normal(g, p) : my(e.position(g, p)), c = i + 3, h = new Float64Array(n * c), u = new Float64Array(n * c);
  for (let g = 0; g < c; g++) {
    const p = g === 0 || g === c - 1, m = r(g);
    for (let b = 0; b < n; b++) {
      const k = g * n + b;
      if (p) {
        h[k] = -1;
        continue;
      }
      const w = a(b);
      h[k] = e.inside(w, m), u[k] = h[k] > -0.35 ? ye(t, l(w, m)) : 0;
    }
  }
  const d = (g) => (g % n + n) % n, f = (g) => {
    const p = n + 1, m = new Float64Array(p * c);
    for (let P = 0; P < c; P++)
      for (let O = 0; O <= n; O++) {
        const _ = P * n + (O === n ? 0 : O);
        m[P * p + O] = Math.min(h[_], g * u[_]);
      }
    const b = (P, O) => m[O * p + P], k = (P, O, _, W) => {
      const B = b(P, O), K = b(_, W), V = B === K ? 0.5 : Math.min(1, Math.max(0, B / (B - K)));
      return zt(t, e.position(a(P + (_ - P) * V), r(O + (W - O) * V)));
    }, w = n * c * 2, y = new Int32Array(w).fill(-1), v = new Int32Array(w).fill(-1), E = /* @__PURE__ */ new Map(), T = (P, O, _) => {
      const W = (_ * n + d(O)) * 2 + (P ? 1 : 0);
      return E.has(W) || E.set(W, P ? k(d(O), _, d(O), _ + 1) : k(O, _, O + 1, _)), W;
    }, x = (P, O) => {
      y[P] === -1 ? y[P] = O : v[P] = O;
    }, M = (P, O) => {
      x(P, O), x(O, P);
    };
    for (let P = 0; P < c - 1; P++)
      for (let O = 0; O < n; O++) {
        const _ = P * p + O, W = (m[_] > 0 ? 8 : 0) | (m[_ + 1] > 0 ? 4 : 0) | (m[_ + p + 1] > 0 ? 2 : 0) | (m[_ + p] > 0 ? 1 : 0);
        if (W === 0 || W === 15) continue;
        const B = () => T(!1, O, P), K = () => T(!1, O, P + 1), V = () => T(!0, O, P), j = () => T(!0, O + 1, P);
        switch (W) {
          case 1:
          case 14:
            M(V(), K());
            break;
          case 2:
          case 13:
            M(K(), j());
            break;
          case 3:
          case 12:
            M(V(), j());
            break;
          case 4:
          case 11:
            M(B(), j());
            break;
          case 6:
          case 9:
            M(B(), K());
            break;
          case 7:
          case 8:
            M(V(), B());
            break;
          case 5:
          case 10: {
            const S = (b(O, P) + b(O + 1, P) + b(O + 1, P + 1) + b(O, P + 1)) / 4 > 0;
            W === 5 === S ? (M(V(), B()), M(K(), j())) : (M(V(), K()), M(B(), j()));
            break;
          }
        }
      }
    const A = [], I = new Uint8Array(w);
    for (const P of E.keys()) {
      if (I[P]) continue;
      const O = [];
      let _ = -1, W = P;
      for (; W !== -1 && !I[W]; ) {
        I[W] = 1, O.push(E.get(W));
        const B = y[W], K = v[W], V = B !== -1 && B !== _ && !I[B] ? B : K !== -1 && K !== _ && !I[K] ? K : -1;
        _ = W, W = V;
      }
      O.length >= 3 && A.push(O);
    }
    return A;
  };
  return { near: f(1), far: f(-1) };
}
const Hl = /* @__PURE__ */ new WeakMap();
function Vr(t, e, n) {
  let s = Hl.get(t);
  s || Hl.set(t, s = /* @__PURE__ */ new Map());
  let o = s.get(e);
  return o || s.set(e, o = n()), o;
}
function Jr(t, e, n) {
  t.save(), t.beginPath(), t.rect(-1e5, -1e5, 2e5, 2e5), t.ellipse(e.center.x, e.center.y, e.rx, e.ry, e.angle, 0, Math.PI * 2), t.clip("evenodd"), n(), t.restore();
}
function P0(t, e, n, s = 0.04) {
  const o = [];
  let i = [];
  return e.forEach((r, a) => {
    ye(t, n[a]) > s ? i.push(zt(t, r)) : (i.length >= 2 && o.push(i), i = []);
  }), i.length >= 2 && o.push(i), o;
}
const as = { swing: 0, trail: 0, lift: 0 };
function Zr(t) {
  if (!t) return as;
  const e = t["hair.swing"] ?? 0, n = t["hair.trail"] ?? 0, s = t["hair.lift"] ?? 0;
  return e === 0 && n === 0 && s === 0 ? as : { swing: e, trail: n, lift: s };
}
const I0 = (t) => t.swing === 0 && t.trail === 0 && t.lift === 0;
function yy(t) {
  return t.length > 0 || t.ties.some((e) => e.kind !== "bun");
}
function sr([t, e, n], s) {
  if (s === 0) return [t, e, n];
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - n * i, e, n * o + t * i];
}
const Cl = {
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
}, Rl = 1.75, O0 = {
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
  shoulderStraight: { volume: 0.16, length: Rl, opening: 84, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  shoulderWaves: { volume: 0.22, length: Rl, opening: 84, part: 22, texture: "wavy", textureAmount: 0.12, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
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
function by(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ? O0[e.style] : {};
  if (e.style && !n) throw new Error(`hair: unknown style '${e.style}'`);
  const { style: s, hairline: o, ...i } = e;
  return {
    ...Cl,
    ...n,
    ...i,
    hairline: { ...Cl.hairline, ...n.hairline, ...o },
    ties: (i.ties ?? n.ties ?? []).map((r) => ({ ...r }))
  };
}
const Co = (t) => t * Math.PI / 180, Jn = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, or = (t) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1);
function fo(t, e) {
  const { front: n, side: s, back: o } = t.hairline, i = (n - o) / 2, r = (n + o) / 2, a = (r + s) / 2, l = (r - s) / 2, c = Math.max(0, Math.cos(e));
  let h = a + i * Math.cos(e) + l * Math.cos(2 * e);
  return h -= t.sweep * Math.sin(e) * c, h += t.recede * Math.exp(-(((Math.abs(e) - 0.75) / 0.32) ** 2)), (t.texture === "spiky" || t.texture === "curly") && (h -= t.textureAmount * 0.6 * or(e * 11 / (Math.PI * 2)) * c), h;
}
function Ll(t, e, n) {
  const s = t.textureAmount;
  switch (t.texture) {
    case "spiky":
      return s * (or(e * 11 / (Math.PI * 2)) * or(n * 2.6 + 0.5)) ** 1.2 * Jn(-0.3, 0.4, n);
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
function _0(t, e, n = as) {
  const s = t.length > 0, o = /* @__PURE__ */ new Map(), i = (h) => {
    let u = o.get(h);
    return u === void 0 && o.set(h, u = fo(t, h)), u;
  }, r = Co(t.opening), a = (h) => t.length + (t.texture === "wavy" || t.texture === "curly" || t.texture === "locs" ? 0.12 * Math.sin(h * 9) : 0), l = (h, u, d) => {
    if (t.flat <= 0 || u < 0.45) return null;
    const f = (u - 0.45) / 0.55, g = Math.sqrt(1 - 0.45 * 0.45) * d * (1 - f ** 5), p = 0.45 + (1 + t.flat - 0.45) * Math.min(1, f * 1.8);
    return [g * Math.sin(h), p * (1 + e), g * Math.cos(h)];
  }, c = {
    top: 1,
    bottom: s ? -(t.length + 0.25) : -1,
    inside(h, u) {
      const d = u - i(h);
      if (!s) return d;
      const f = Math.min(u + a(h), uo(h, 0) - r);
      return Math.max(d, f);
    },
    position(h, u) {
      if (s && u < 0) {
        const w = t.length < 1.5 ? 0.14 * Jn(-t.length + 0.45, -t.length - 0.1, u) : 0, y = 1 + e + t.volume * (1 - w * 2.5) + Ll(t, h, u) - w;
        return [y * Math.sin(h), u, y * Math.cos(h)];
      }
      const d = 0.4 + 0.6 * Jn(0, 0.3, u - fo(t, h)), f = 1 + e + (t.volume + Ll(t, h, u)) * d, g = l(h, u, f);
      if (g) return g;
      const [p, m, b] = me(h, u), k = [p * f, m * f, b * f];
      if (t.quiff > 0) {
        const w = t.quiff * Math.exp(-((h / 0.7) ** 2)) * Jn(0.15, 0.85, u);
        k[1] += w * 0.7, k[2] += w * 0.45;
      }
      return k;
    },
    normal(h, u) {
      return s && u < 0 ? [Math.sin(h), 0, Math.cos(h)] : me(h, u);
    }
  };
  return s && !I0(n) ? wy(c, t, n) : c;
}
function wy(t, e, n) {
  const s = (i) => i < 0 ? Jn(-0.15, -Math.max(0.7, e.length), i) : 0, o = (i) => Co(n.swing) * s(i);
  return {
    top: t.top,
    bottom: t.bottom,
    inside: (i, r) => t.inside(i + o(r), r),
    position(i, r) {
      const a = s(r);
      if (a === 0) return t.position(i, r);
      const l = o(r), [c, h, u] = sr(t.position(i + l, r), l);
      return [c, h + n.lift * a, u - n.trail * a];
    },
    normal: (i, r) => sr(t.normal(i + o(r), r), o(r))
  };
}
const ky = (t) => t.texture === "spiky" || t.texture === "curly" || t.texture === "locs" ? 104 : t.texture === "wavy" ? 80 : 64;
function H0(t, e, n, s) {
  return Vr(t, My(e, s), () => Ho(t, n, ky(e)));
}
const Wl = /* @__PURE__ */ new WeakMap();
let vy = 1;
function My(t, e) {
  if (I0(e)) return t;
  let n = Wl.get(t);
  return n || Wl.set(t, n = vy++), `${n}:${e.swing}:${e.trail}:${e.lift}`;
}
function C0(t) {
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
function hi(t, [e, n, s]) {
  const o = zt(t, [e, n, s]);
  return { x: o.x - t.center.x, y: o.y - t.center.y };
}
function xy(t, e, n, s = 16) {
  return Array.from({ length: s + 1 }, (o, i) => {
    const r = i / s, a = 1 - r;
    return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
  });
}
function Sy(t, e, n, s, o) {
  const i = t.ry, r = (e.length ?? 1.8) * i, a = hi(t, sr(s, Co(o.swing))), l = hi(t, [0, o.lift, -o.trail]), c = Math.hypot(a.x, a.y) || 1, h = e.at === "high" || e.at === "low" || e.at === "top" ? hi(t, [0.95, 0, 0]) : { x: 0 }, u = e.kind === "braid" ? 0.15 : 0.5, d = {
    x: n.x + a.x / c * i * u + h.x * 0.9 + l.x * 0.5,
    y: n.y + a.y / c * i * u * 0.6 + l.y * 0.5
  }, f = { x: n.x + a.x / c * i * u * 0.6 + h.x * 1.3 + l.x, y: n.y + r + l.y };
  return xy(n, d, f);
}
const Qr = (t) => Math.max(1, t * 0.5), R0 = (t, e) => Math.max(0.8, Math.min(t * 0.4, 0.1 * e.rx));
function L0(t, e, n, s, o, i) {
  const { point: r, out: a } = C0(s.at), l = 1 + n.volume, c = zt(e, [r[0] * l, r[1] * l, r[2] * l]), h = Qr(o), u = R0(o, e);
  if (s.kind === "bun") {
    const p = s.size ?? 0.32, m = zt(e, [r[0] * l + a[0] * p, r[1] * l + a[1] * p, r[2] * l + a[2] * p]);
    t.ellipse(m.x, m.y, p * e.rx, p * e.ry, e.angle, n.color, h);
    const b = p * e.rx * 0.55;
    t.line(
      Array.from({ length: 9 }, (k, w) => {
        const y = -0.4 + w / 8 * Math.PI * 1.3;
        return { x: m.x + Math.cos(y) * b, y: m.y + Math.sin(y) * b * 0.8 };
      }),
      u
    );
    return;
  }
  const d = Sy(e, s, c, a, i), f = (s.size ?? (s.kind === "braid" ? 0.2 : 0.34)) * e.rx * 2;
  if (s.kind === "ponytail")
    t.shape(Ft(d, f, f * 0.15), n.color, h), t.line(d.slice(3, d.length - 3), u);
  else {
    const m = d.slice(0, d.length - 3);
    for (let w = 0; w < 7; w++) {
      const y = m[Math.floor(w / 7 * (m.length - 1))], v = m[Math.floor((w + 1) / 7 * (m.length - 1))], E = Math.atan2(v.y - y.y, v.x - y.x), T = Math.hypot(v.x - y.x, v.y - y.y), x = f * (1 - w / (7 * 2.2)), M = (w % 2 === 0 ? 1 : -1) * 0.35, A = { x: (y.x + v.x) / 2, y: (y.y + v.y) / 2 };
      t.ellipse(A.x, A.y, T * 0.62, x * 0.5, E + M, n.color, h * 0.8);
    }
    const b = m[m.length - 1], k = d[d.length - 1];
    t.shape(Ft([b, k], f * 0.7, f * 0.2), n.color, h * 0.8);
  }
  const g = d[s.kind === "braid" ? d.length - 4 : 2];
  t.ellipse(g.x, g.y, f * 0.32, f * 0.22, e.angle, n.color, h);
}
function W0(t, e) {
  return ye(t, C0(e.at).out) < -0.2;
}
function Ty(t) {
  const e = (o, i, r = 0, a = 14) => Array.from({ length: a + 1 }, (l, c) => {
    const h = c / a;
    return [o[0] + (i[0] - o[0]) * h + r * Math.sin(Math.PI * h), o[1] + (i[1] - o[1]) * h];
  }), n = Co(t.part ?? 0), s = (o) => fo(t, o) + 0.04;
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
      const o = t.length > 0 ? -t.length + 0.25 : -0.4, i = [-2.6, -2, -1.4, 1.4, 2, 2.6, 3.05].map((r) => e([r, fo(t, r) < 0.9 ? 0.6 : 0.9], [r, o], 0));
      return t.part !== null && i.push(e([n, s(n)], [n, 0.97])), i;
    }
    default:
      return [];
  }
}
function Ey(t, e, n, s, o) {
  if (s.fill === "stipple" || s.hairline.front > 1.5) return;
  const i = o.motion ?? as, r = o.lineWidth * 0.45 / n.rx, { far: a } = H0(n, s, _0(s, r, i), i);
  Jr(e, n, () => {
    for (const l of s.ties) W0(n, l) && L0(t, n, s, l, o.lineWidth, i);
    for (const l of a) t.shape(l, s.color, Qr(o.lineWidth));
  });
}
function F0(t, e, n, s) {
  if (n.hairline.front > 1.5) return;
  const o = s.motion ?? as, i = s.lineWidth * 0.45 / e.rx, r = _0(n, i, o), a = R0(s.lineWidth, e);
  if (n.fill === "stipple") {
    for (let h = 0.97; h > -1; h -= 0.17)
      for (let u = -Math.PI; u < Math.PI; u += 0.27) {
        const d = Math.round(h * 100) % 2 * 0.13;
        if (r.inside(u + d, h) < 0.02) continue;
        const f = me(u + d, h);
        if (ye(e, f) < 0.12) continue;
        const g = zt(e, f);
        t.dot(g.x, g.y, a * 0.4);
      }
    return;
  }
  const { near: l } = H0(e, n, r, o), c = Qr(s.lineWidth);
  for (const h of l) t.shape(h, n.color, c);
  for (const h of Ty(n)) {
    const u = h.map(([f, g]) => {
      const [p, m, b] = r.position(f, g);
      return [p * 0.985, m * 0.985, b * 0.985];
    }), d = h.map(([f, g]) => r.normal(f, g));
    for (const f of P0(e, u, d, 0.12)) t.line(f, a);
  }
  for (const h of n.ties) W0(e, h) || L0(t, e, n, h, s.lineWidth, o);
}
const N0 = 0.35, ta = (t) => ({ centre: [t * 0.98, -0.02, -0.08], out: [t, 0, -0.12] });
function D0(t, e, n, s, o) {
  const { centre: i, out: r } = ta(n), a = ye(e, r), l = Math.max(1, s.lineWidth * 0.55), c = s.skin === "none" ? null : s.skin, h = e.ry * 0.27;
  if (!o) {
    const m = zt(e, [i[0] * 1.06, i[1], i[2]]);
    t.ellipse(m.x, m.y, e.rx * 0.17, h, e.angle, c, l);
    return;
  }
  const u = zt(e, i), d = e.rx * (0.12 + 0.08 * a);
  t.ellipse(u.x, u.y, d, h, e.angle, c, l);
  const f = Math.cos(e.angle), g = Math.sin(e.angle), p = Array.from({ length: 9 }, (m, b) => {
    const k = -Math.PI * 0.55 + b / 8 * Math.PI * 1.1, w = Math.cos(k) * d * 0.45 * -n, y = Math.sin(k) * h * 0.55;
    return { x: u.x + w * f - y * g, y: u.y + w * g + y * f };
  });
  t.line(p, Math.max(0.8, l * 0.7));
}
function Ay(t, e, n, s) {
  Jr(e, n, () => {
    for (const o of [1, -1]) ye(n, ta(o).out) < N0 && D0(t, n, o, s, !1);
  });
}
function $y(t, e, n) {
  for (const s of [1, -1]) ye(e, ta(s).out) >= N0 && D0(t, e, s, n, !0);
}
const B0 = {
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
function Py(t, e) {
  const n = typeof t == "string" ? { style: t } : t, s = n.style ? B0[n.style] : void 0;
  if (n.style && !s) throw new Error(`facialHair: unknown style '${n.style}'`);
  return {
    color: n.color ?? e ?? "#6b4630",
    moustache: n.moustache ?? s?.moustache ?? "none",
    beard: n.beard ?? s?.beard ?? "none"
  };
}
const Me = (t) => t * Math.PI / 180, js = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, z0 = {
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
}, Iy = (t, e) => {
  const n = js(Me(48), Me(100), uo(e, 0));
  return t.top[0] + (t.top[1] - t.top[0]) * n;
}, Oy = (t) => t === "sideburns" || t === "muttonChops";
function ir(t, e) {
  const n = z0[t];
  if (!n) return null;
  const s = Me(n.reach), o = (i) => {
    const r = uo(i, 0);
    return n.shape === "point" ? Math.exp(-((r / 0.42) ** 2)) : n.shape === "square" ? 1 - js(Me(45), Me(85), r) : Math.cos(Math.min(r, Math.PI / 2)) ** 0.7;
  };
  return {
    top: Math.max(n.top[0], n.top[1]) + 0.05,
    bottom: -1,
    inside(i, r) {
      const a = uo(i, 0), l = Iy(n, i);
      let c = Math.min(l - r, s - a);
      if (n.band > 0 && (c = Math.min(c, r - (l - n.band))), Oy(t)) {
        const h = t === "muttonChops" ? Me(70) - Me(22) * js(0.08, -0.6, r) : Me(72);
        c = Math.min(c, a - h);
      }
      return c;
    },
    position(i, r) {
      const [a, l, c] = me(i, r), h = 1 + e + n.volume, u = n.length * o(i) * js(-0.45, -1, r);
      return [a * h, l * h - u, c * h + u * 0.25];
    },
    normal: (i, r) => me(i, r)
  };
}
function _y(t) {
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
const ls = (t) => Math.max(1, t * 0.45);
function Hy(t, e, n, s) {
  for (let o = 0.1; o > -1; o -= 0.13)
    for (let i = -Math.PI / 1.7; i < Math.PI / 1.7; i += 0.2) {
      const r = Math.round(o * 100) % 2 * 0.1;
      if (n.inside(i + r, o) < 0.02) continue;
      const a = me(i + r, o);
      if (ye(e, a) < 0.15) continue;
      const l = zt(e, a);
      t.dot(l.x, l.y, s);
    }
}
function Cy(t, e, n, s, o) {
  const i = s.beard === "stubble" ? null : ir(s.beard, o.lineWidth * 0.45 / n.rx);
  if (!i) return;
  const { far: r } = Vr(n, s, () => Ho(n, i));
  Jr(e, n, () => {
    for (const a of r) t.shape(a, s.color, ls(o.lineWidth));
  });
}
function Ry(t, e, n, s, o) {
  if (n.beard === "none") return;
  const i = s.lineWidth * 0.45 / e.rx;
  if (n.beard === "stubble") {
    Hy(t, e, ir("full", i), Math.max(0.5, s.lineWidth * 0.09));
    return;
  }
  if (n.beard === "soulPatch") {
    const l = [{ x: -0.05, y: -0.55 }, { x: 0.05, y: -0.55 }, { x: 0, y: -0.68 }], { points: c, facing: h } = Et(e, l, { x: 0, y: -0.6 });
    h > -0.05 && t.shape(c, n.color, ls(s.lineWidth) * 0.7);
    return;
  }
  const r = ir(n.beard, i);
  if (!r) return;
  const { near: a } = Vr(e, n, () => Ho(e, r));
  for (const l of a) t.shape(l, n.color, ls(s.lineWidth));
  if (z0[n.beard]?.aroundMouth) {
    const l = 0.27 * Math.max(0.3, o), c = Array.from({ length: 20 }, (d, f) => {
      const g = Math.PI * 2 * f / 20;
      return { x: Math.cos(g) * l, y: -0.42 + Math.sin(g) * 0.13 };
    }), { points: h, facing: u } = Et(e, c, { x: 0, y: -0.42 });
    u > -0.05 && t.shape(h, s.skin === "none" ? "#ffffff" : s.skin, 0);
  }
}
function Ly(t, e, n, s) {
  if (n.moustache === "none") return;
  const o = { x: 0, y: -0.24 };
  if (n.moustache === "pencil") {
    const l = [-0.2, -0.1, 0, 0.1, 0.2].map((u) => ({ x: u, y: -0.25 + 0.03 * Math.cos(u / 0.2 * Math.PI) })), { points: c, facing: h } = Et(e, l, o);
    h > -0.05 && t.line(c, Math.max(1, s.lineWidth * 0.32));
    return;
  }
  const i = _y(n.moustache);
  if (!i) return;
  const { points: r, facing: a } = Et(e, i, o);
  if (!(a <= -0.05) && (t.shape(r, n.color, ls(s.lineWidth) * 0.8), n.moustache === "handlebar"))
    for (const l of [1, -1]) {
      const c = Array.from({ length: 10 }, (h, u) => {
        const d = -Math.PI / 2 + u / 9 * Math.PI * 1.4;
        return { x: l * (0.27 + 0.05 * Math.cos(d)), y: -0.21 + 0.05 * (1 + Math.sin(d)) };
      });
      c.unshift({ x: l * 0.22, y: -0.27 }), t.line(Et(e, c, o).points, ls(s.lineWidth) * 0.8);
    }
}
const q0 = { round: !0, square: !0, sunglasses: !0 };
function Wy(t) {
  const n = (typeof t == "string" ? { style: t } : t).style ?? "round";
  if (!(n in q0)) throw new Error(`glasses: unknown style '${n}'`);
  return { style: n };
}
const Fl = 0.34, re = 0.12, Fy = 0.05;
function Ny(t, e) {
  return Array.from({ length: 28 }, (s, o) => {
    const i = Math.PI * 2 * o / 28;
    if (t === "round") return { x: e + Math.cos(i) * 0.2, y: re + Math.sin(i) * 0.19 };
    const r = Math.cos(i), a = Math.sin(i), l = t === "sunglasses" ? 0.22 : 0.21, c = t === "sunglasses" ? 0.17 : 0.16;
    return { x: e + Math.sign(r) * Math.abs(r) ** 0.45 * l, y: re - 0.01 + Math.sign(a) * Math.abs(a) ** 0.45 * c };
  });
}
function Dy(t, e, n, s) {
  const o = Math.max(1, Math.min(s.lineWidth * 0.5, 0.11 * e.rx)), i = [];
  for (const r of [1, -1]) {
    const a = Fl * r, { points: l, facing: c } = Et(e, Ny(n.style, a), { x: a, y: re });
    if (c < Fy) continue;
    i.push(r), t.shape(l, n.style === "sunglasses" ? "#1f2328" : null, o);
    const h = [r * 0.97, re + 0.02, -0.1];
    if (ye(e, [r, 0, 0]) > 0.15) {
      const u = Et(e, [{ x: a + r * 0.21, y: re + 0.02 }], { x: a, y: re }).points[0];
      t.line([u, zt(e, h)], o * 0.9);
    }
  }
  if (i.length === 2) {
    const r = [
      { x: Fl - 0.2, y: re + 0.02 },
      { x: 0, y: re + 0.07 },
      { x: -0.14, y: re + 0.02 }
    ];
    t.line(Et(e, r, { x: 0, y: re }).points, o);
  }
}
const ea = {
  cap: { color: "#d64535", brim: [0.36, 0.16], height: 1, peak: 0.7, detail: "seams" },
  beanie: { color: "#3a6ea5", brim: [0.3, 0.12], height: 1.08, detail: "fold" },
  hardHat: { color: "#f2c230", brim: [0.34, 0.22], height: 1.12, ring: 0.16, detail: "ridge" },
  sunHat: { color: "#e3c98f", brim: [0.36, 0.3], height: 1.02, ring: 0.62, detail: "band" },
  bowler: { color: "#2f2b2a", brim: [0.36, 0.28], height: 1.15, ring: 0.2, detail: "band" }
};
function By(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ?? "cap", s = ea[n];
  if (!s) throw new Error(`hat: unknown style '${n}'`);
  return { style: n, color: e.color ?? s.color };
}
const je = (t, e) => t.brim[1] + (t.brim[0] - t.brim[1]) * (1 + Math.cos(e)) / 2;
function zy(t, e) {
  return {
    top: 1,
    bottom: Math.min(...t.brim) - 0.05,
    inside: (n, s) => s - je(t, n),
    position(n, s) {
      const [o, i, r] = me(n, s), a = je(t, n), l = s > a ? (i - a) * (t.height - 1) : 0;
      return [o * e, i * e + l, r * e];
    },
    normal: (n, s) => me(n, s)
  };
}
function qy(t, e, n) {
  const o = (i, r, a) => {
    const l = je(e, i) * n - a;
    return [Math.sin(i) * r, l, Math.cos(i) * r];
  };
  if (e.peak) {
    const i = [], r = [];
    for (let a = 0; a <= 24; a++) {
      const l = (-80 + 160 * a / 24) * (Math.PI / 180), c = e.peak * Math.cos(l) ** 0.6;
      i.push(zt(t, [Math.sin(l) * (n + c * 0.25), je(e, l) * n - 0.07 * Math.cos(l), Math.cos(l) * (n + c)])), r.push(zt(t, o(l, n, 0)));
    }
    return [...i, ...r.reverse()];
  }
  return e.ring ? Array.from({ length: 48 }, (i, r) => zt(t, o(Math.PI * 2 * r / 48, n + e.ring, 0.07))) : null;
}
function Yy(t) {
  const e = (s) => Array.from({ length: 13 }, (o, i) => [s, je(t, s) + (0.97 - je(t, s)) * i / 12]), n = (s) => Array.from({ length: 49 }, (o, i) => {
    const r = -Math.PI + Math.PI * 2 * i / 48;
    return [r, je(t, r) + s];
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
function Y0(t, e, n, s) {
  const o = ea[n.style], r = 1 + s.lineWidth * 0.45 / e.rx + Math.max(0.05, Math.min(0.3, s.hairVolume) + 0.04), a = Math.max(1, s.lineWidth * 0.5), l = qy(e, o, r);
  l && t.shape(l, n.color, a);
  const c = zy(o, r), { near: h, far: u } = Ho(e, c);
  for (const f of [...u, ...h]) t.shape(f, n.color, a);
  const d = Math.max(0.8, a * 0.7);
  for (const f of Yy(o)) {
    const g = f.map(([m, b]) => {
      const [k, w, y] = c.position(m, b);
      return [k * 0.99, w * 0.99, y * 0.99];
    }), p = f.map(([m, b]) => me(m, b));
    for (const m of P0(e, g, p, 0.1)) t.line(m, d);
  }
  if (o.detail === "seams") {
    const f = zt(e, [0, r * 1.01, 0]);
    t.dot(f.x, f.y, a * 0.9);
  }
}
function jy(t) {
  const e = t.hair ? by(t.hair) : null;
  return {
    hair: e,
    facialHair: t.facialHair ? Py(t.facialHair, e?.color) : null,
    glasses: t.glasses ? Wy(t.glasses) : null,
    hat: t.hat ? By(t.hat) : null,
    ears: t.ears ?? !1
  };
}
const j0 = (t) => !t.hair && !t.facialHair && !t.glasses && !t.hat && !t.ears, K0 = (t) => t.axes[2][2] < -0.3, X0 = (t) => t.ears && !t.hair?.coversEars;
function U0(t, e, n, s, o, i) {
  j0(n) || (n.hair && Ey(e, t, s, n.hair, { ...i, motion: Zr(o) }), n.facialHair && Cy(e, t, s, n.facialHair, i), X0(n) && Ay(e, t, s, i));
}
function Ky(t, e, n, s, o, i, r) {
  if (j0(n)) {
    r();
    return;
  }
  const a = K0(s);
  X0(n) && $y(e, s, i), n.hair && !a && F0(e, s, n.hair, { ...i, motion: Zr(o) }), n.facialHair && Ry(e, s, n.facialHair, i, o.mouthWidth ?? 1), r(), n.facialHair && Ly(e, s, n.facialHair, i), n.glasses && Dy(e, s, n.glasses, i), n.hat && !a && Y0(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 });
}
function G0(t, e, n, s, o, i) {
  K0(s) && (n.hair && F0(e, s, n.hair, { ...i, motion: Zr(o) }), n.hat && Y0(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 }));
}
const Nl = 40, Xy = 0.215 + 0.205, Yt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}, ut = (t, e) => t[e] ?? ft[e] ?? 0;
function V0(t, e, n = ft, s = 1) {
  const o = Oo(t), i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (1 + Math.cos(i * 2 * (o.bounces ?? 1))) / 2, c = o.crouch ?? 0, h = o.shoulder ?? 0, u = o.forearm ?? 0, d = { ...ft, ...n };
  d["leg.left.swing"] = o.swing * r + c * 0.6, d["leg.right.swing"] = -o.swing * r + c * 0.6, d["leg.left.knee"] = o.knee * Math.max(0, a) + c * 1.2, d["leg.right.knee"] = o.knee * Math.max(0, -a) + c * 1.2, d["leg.left.ankle"] = ut(n, "leg.left.ankle") - (o.tiptoe ?? 0), d["leg.right.ankle"] = ut(n, "leg.right.ankle") - (o.tiptoe ?? 0);
  for (const [f, g] of [["left", -1], ["right", 1]])
    ut(n, `arm.${f}.spread`) > Nl || ut(n, `arm.${f}.swing`) > Nl || (d[`arm.${f}.swing`] = h + g * o.arm * r, d[`arm.${f}.elbow`] = ut(n, `arm.${f}.elbow`) + u + o.elbow * Math.max(0, g * r));
  return d.lean = ut(n, "lean") + o.lean * s, d.bend = ut(n, "bend") + (o.bend ?? 0), d["head.nod"] = ut(n, "head.nod") - o.lean * 0.5 * s + (o.headTilt ?? 0), d.side = ut(n, "side") + (o.sway ?? 0) * Math.sin(i), d.lift = ut(n, "lift") + (o.bounce ?? 0) * s * l, d.stretch = ut(n, "stretch") * (1 + (o.squash ?? 0) * (l - 0.5)), d;
}
function J0(t, e, n = 1, s = 1) {
  const o = Oo(t);
  return 4 * Xy * s * e * Math.sin(o.swing * n * Math.PI / 180);
}
const on = (t) => S0[t], na = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: ut(t, "lean") - 4, ...Yt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Yt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Yt("leg", { swing: 25, knee: 60 }), ...on("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Yt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Yt("arm", { spread: 70, bend: 0 }), ...Yt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Yt("arm", { spread: 60 }),
        "leg.left.swing": ut(t, "leg.left.swing"),
        "leg.right.swing": ut(t, "leg.right.swing"),
        "leg.left.knee": ut(t, "leg.left.knee"),
        "leg.right.knee": ut(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: ut(t, "stretch"), bend: ut(t, "bend"), ...on("surprised"), ...Yt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": ut(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": ut(t, "head.nod") - 10, bend: ut(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...on("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { lift: 0, stretch: 0.88, "head.nod": ut(t, "head.nod") - 4, bend: ut(t, "bend") + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: ut(t, "stretch"), "head.nod": ut(t, "head.nod"), bend: ut(t, "bend") }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
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
        ...on("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Yt("arm", { spread: 75 }), ...Yt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": ut(t, "arm.left.spread"), "arm.right.spread": ut(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: ut(t, "stretch"), bend: ut(t, "bend"), ...Yt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...on("scared"), ...Yt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: ut(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: ut(t, "side") + 2.5 * s, "head.tilt": ut(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: ut(t, "side"), "head.tilt": ut(t, "head.tilt"), bend: ut(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": ut(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...on("sad"), bend: 18, stretch: 0.92, lean: ut(t, "lean") + 5, "head.nod": 14, ...Yt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function Uy(t, e) {
  const n = bt(e.from ?? {}), s = e.speed ?? 1;
  let o = n;
  return [
    { time: e.at, pose: n },
    ...na[t](n).map((i) => (o = { ...o, ...i.pose }, { time: e.at + i.after * s, pose: o, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function Gy(t, e = ft) {
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
function Vy(t, e = ft) {
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
const Dl = { sweeping: Gy, brushing: Vy };
function $M(t, e, n = ft) {
  const s = Dl[t];
  if (!s) throw new Error(`humanCyclePose: ${dt("cycle", t, Object.keys(Dl))}`);
  return s(e, n);
}
const Jy = { apron: "#d8b48a", labCoat: "#f4f6f8", hoodie: "#6b7280", cardigan: "#6b8e4e", overalls: "", sari: "#16a34a" }, ui = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1), mt = (t, e, n) => ({ x: t.x + (e.x - t.x) * n, y: t.y + (e.y - t.y) * n });
function Zy(t) {
  return rr(t, t.parts["leg.left"].depth) > rr(t, t.parts["leg.right"].depth) ? "left" : "right";
}
const rr = (t, e) => Math.abs(e) < 0.01 * t.height ? 0 : e, Bl = (t) => rr(t, Math.max(t.parts["leg.left"].depth, t.parts["leg.right"].depth)) > 0, Ut = (t) => Math.cos(t.turn * Math.PI / 2);
function Qy(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = t.sleeves ?? "short", o = t.bottom ?? "trousers", i = t.over === "labCoat", r = t.over === "hoodie", a = t.over === "cardigan", l = t.over === "overalls", c = t.over === "sari", h = t.overColor ?? (t.over && t.over !== "overalls" ? Jy[t.over] : n), u = t.shoes === "boots", d = t.shoeColor ?? "#3b2a1e", f = (S) => S.lineWidth * 0.45, g = (S, C, L) => {
    const $ = S.parts[`leg.${L}`].points;
    if (!(o === "skirt" && !l)) {
      if (o === "shorts" && !l) {
        const R = ui($, 0, 0.5);
        C.shape(Ft(R, S.height * 0.085, S.height * 0.07), n, f(S));
        return;
      }
      C.shape(Ft($, S.height * 0.08, S.height * 0.05), n, f(S));
    }
  }, p = (S, C, L) => {
    const $ = S.parts[`leg.${L}`].points, R = ui($, 0.7, 1);
    if (R.length < 2) return;
    C.shape(Ft(R, S.height * 0.075, S.height * 0.07), d, f(S));
    const N = R[0], z = R[1], D = z.x - N.x, q = z.y - N.y, U = Math.hypot(D, q) || 1, F = S.height * 0.04;
    C.line([{ x: N.x - q / U * F, y: N.y + D / U * F }, { x: N.x + q / U * F, y: N.y - D / U * F }], f(S) * 0.9);
  }, m = (S) => {
    const C = S.chains.spine, L = C[0], $ = C[C.length - 1], R = { x: L.x - ($.x - L.x) * 0.25, y: L.y - ($.y - L.y) * 0.25 };
    return { hip: L, top: $, below: R, line: [R, ...S.parts.spine.points] };
  }, b = (S, C) => {
    const L = r ? h : e, $ = r ? 1.14 : 1;
    C.shape(Ft(m(S).line, S.height * 0.15 * $, S.height * 0.14 * $), L, f(S));
  }, k = (S, C) => {
    const L = Ut(S), { top: $, hip: R } = m(S), N = S.height * 0.07, z = { x: ($.x - R.x) * 0.16, y: ($.y - R.y) * 0.16 };
    if (L >= 0) {
      C.shape(
        [
          { x: $.x - N, y: $.y + z.y * 0.25 },
          { x: $.x - N * 0.8 + z.x, y: $.y + z.y },
          { x: $.x + z.x * 1.2, y: $.y + z.y * 1.35 },
          { x: $.x + N * 0.8 + z.x, y: $.y + z.y },
          { x: $.x + N, y: $.y + z.y * 0.25 }
        ],
        h,
        f(S)
      );
      return;
    }
    const D = mt($, R, 0.42);
    C.shape(
      [
        { x: $.x - N * 0.9, y: $.y },
        { x: $.x + N * 0.9, y: $.y },
        { x: D.x + N * 0.7, y: D.y },
        { x: D.x, y: D.y + S.height * 0.02 },
        { x: D.x - N * 0.7, y: D.y }
      ],
      h,
      f(S)
    );
  }, w = (S, C) => {
    const L = Ut(S);
    if (L < 0.2) return;
    const { top: $, hip: R } = m(S), N = Math.sin(S.turn * Math.PI / 2) * S.height * 0.03, z = S.height * 0.06 * L, D = mt($, R, 0.62), q = mt($, R, 0.9);
    C.line([{ x: D.x + N - z, y: D.y }, { x: q.x + N - z * 1.1, y: q.y }], f(S) * 0.7), C.line([{ x: D.x + N + z, y: D.y }, { x: q.x + N + z * 1.1, y: q.y }], f(S) * 0.7);
    const U = mt($, R, 0.1);
    for (const F of [-1, 1]) C.line([{ x: U.x + N + F * z * 0.2, y: U.y }, { x: U.x + N + F * z * 0.35, y: U.y + S.height * 0.07 }], f(S) * 0.6);
  }, y = (S, C) => {
    const { top: L, hip: $ } = m(S), R = Ut(S);
    if (C.shape(Ft([L, mt(L, $, 0.5), mt(L, $, 1.08)], S.height * 0.155, S.height * 0.15), h, f(S)), R < 0.2) return;
    const N = Math.sin(S.turn * Math.PI / 2) * S.height * 0.03, z = S.height * 0.02 * R, D = mt(L, $, 0.12), q = mt(L, $, 1.05);
    C.shape([{ x: D.x + N - z, y: D.y }, { x: D.x + N + z, y: D.y }, { x: q.x + N + z * 1.3, y: q.y }, { x: q.x + N - z * 1.3, y: q.y }], e, f(S) * 0.7);
    for (const U of [0.35, 0.55, 0.75]) {
      const F = mt(L, $, U);
      C.dot(F.x + N + z * 1.6, F.y, f(S) * 1.2);
    }
  }, v = (S, C) => {
    const L = Ut(S), { top: $, hip: R } = m(S), N = Math.sin(S.turn * Math.PI / 2) * S.height * 0.04, z = mt(R, $, 0.12), D = mt(R, $, 0.74);
    if (L < 0.15) {
      if (L < -0.3) {
        const G = S.points["shoulder.left"], Y = S.points["shoulder.right"];
        C.line([G, { x: z.x + S.height * 0.03, y: z.y }], f(S) * 0.8), C.line([Y, { x: z.x - S.height * 0.03, y: z.y }], f(S) * 0.8);
      }
      return;
    }
    const q = S.height * 0.07 * L;
    C.shape(
      [
        { x: D.x + N - q * 0.75, y: D.y },
        { x: D.x + N + q * 0.75, y: D.y },
        { x: z.x + N + q * 1.1, y: z.y },
        { x: z.x + N - q * 1.1, y: z.y }
      ],
      n,
      f(S)
    );
    for (const G of ["left", "right"]) {
      const Y = S.points[`shoulder.${G}`], nt = { x: D.x + N + (Y.x > D.x + N ? 1 : -1) * q * 0.55, y: D.y };
      C.line([nt, { x: Y.x + (nt.x - Y.x) * 0.15, y: Y.y + (nt.y - Y.y) * 0.15 }], f(S) * 1.6);
    }
    const U = mt(D, z, 0.3), F = q * 0.4;
    C.line([{ x: U.x + N - F, y: U.y }, { x: U.x + N - F, y: U.y + F * 1.4 }, { x: U.x + N + F, y: U.y + F * 1.4 }, { x: U.x + N + F, y: U.y }], f(S) * 0.6);
  }, E = (S, C) => {
    const { hip: L, top: $ } = m(S), R = mt(L, $, 0.2), N = [S.points["ankle.left"], S.points["ankle.right"]], z = mt(L, { x: (N[0].x + N[1].x) / 2, y: (N[0].y + N[1].y) / 2 }, 0.98), D = S.height * 0.075, q = Math.max(S.height * 0.12, Math.abs(N[0].x - N[1].x) / 2 + S.height * 0.07), U = z.x - R.x, F = z.y - R.y, G = Math.hypot(U, F) || 1, Y = { x: -F / G, y: U / G };
    if (C.shape(
      [
        { x: R.x + Y.x * D, y: R.y + Y.y * D },
        { x: z.x + Y.x * q, y: z.y + Y.y * q },
        { x: z.x - Y.x * q, y: z.y - Y.y * q },
        { x: R.x - Y.x * D, y: R.y - Y.y * D }
      ],
      h,
      f(S)
    ), Ut(S) > 0.2) {
      const ot = Math.sin(S.turn * Math.PI / 2) * S.height * 0.03;
      for (const it of [-0.35, 0, 0.35]) {
        const rt = D * 0.5 * it, H = q * 0.45 * it;
        C.line([{ x: R.x + ot + Y.x * rt, y: R.y + Y.y * rt + S.height * 0.02 }, { x: z.x + ot + Y.x * H, y: z.y + Y.y * H }], f(S) * 0.5);
      }
    }
  }, T = (S, C) => {
    const L = Ut(S), { top: $, hip: R } = m(S), N = Math.sin(S.turn * Math.PI / 2), z = N >= 0 ? "left" : "right", D = z === "left" ? "right" : "left", q = S.points[`shoulder.${z}`], U = S.height * 0.035;
    if (L < 0.15) {
      const Y = mt($, R, 0.9);
      C.shape(Ft([q, { x: Y.x + (q.x - $.x) * 0.5, y: Y.y }], U * 2.2, U * 2.6), h, f(S));
      return;
    }
    const F = { x: R.x + (S.points[`hip.${D}`].x - R.x) * 1.2, y: mt(R, $, 0.08).y };
    C.shape(Ft([F, mt(F, q, 0.5), q], U * 2.4, U * 2), h, f(S));
    const G = { x: q.x - (R.x - q.x) * 0.05 - N * S.height * 0.03, y: q.y + S.height * 0.16 };
    C.shape(Ft([q, G], U * 2, U * 1.6), h, f(S));
  }, x = (S, C) => {
    const { hip: L, top: $ } = m(S), R = mt(L, $, 0.18), N = [S.points["knee.left"], S.points["knee.right"]], z = mt(L, { x: (N[0].x + N[1].x) / 2, y: (N[0].y + N[1].y) / 2 }, 1.05), D = S.height * 0.075, q = Math.max(S.height * 0.13, Math.abs(N[0].x - N[1].x) / 2 + S.height * 0.08), U = z.x - R.x, F = z.y - R.y, G = Math.hypot(U, F) || 1, Y = { x: -F / G, y: U / G };
    C.shape(
      [
        { x: R.x + Y.x * D, y: R.y + Y.y * D },
        { x: z.x + Y.x * q, y: z.y + Y.y * q },
        { x: z.x - Y.x * q, y: z.y - Y.y * q },
        { x: R.x - Y.x * D, y: R.y - Y.y * D }
      ],
      n,
      f(S)
    );
  }, M = (S, C) => {
    const L = Ut(S);
    if (L < 0.2) return;
    const { top: $, hip: R } = m(S), N = { x: (R.x - $.x) * 0.12, y: (R.y - $.y) * 0.12 }, z = S.height * 0.045 * L;
    for (const D of [-1, 1])
      C.shape(
        [
          { x: $.x + D * z * 0.2, y: $.y + N.y * 0.1 },
          { x: $.x + D * z * 1.3, y: $.y - N.y * 0.1 },
          { x: $.x + D * z * 0.6 + N.x, y: $.y + N.y }
        ],
        e,
        f(S) * 0.8
      );
  }, A = (S, C, L) => {
    const $ = Ut(S);
    if ($ < 0.25) return;
    const { top: R, hip: N } = m(S), z = Math.sin(S.turn * Math.PI / 2) * S.height * 0.03, D = (G) => ({ x: mt(R, N, G).x + z, y: mt(R, N, G).y }), q = S.height * 0.022 * $, U = D(0.08), F = D(0.62);
    C.shape([{ x: U.x - q, y: U.y - q }, { x: U.x + q, y: U.y - q }, { x: U.x + q * 0.6, y: U.y + q }, { x: U.x - q * 0.6, y: U.y + q }], L, f(S) * 0.7), C.shape([{ x: U.x - q * 0.6, y: U.y + q }, { x: U.x + q * 0.6, y: U.y + q }, { x: F.x + q * 1.4, y: F.y - q * 2 }, F, { x: F.x - q * 1.4, y: F.y - q * 2 }], L, f(S) * 0.7);
  }, I = (S, C) => {
    const L = Ut(S), { top: $, hip: R } = m(S), N = mt(R, $, 0.72), z = [S.points["knee.left"], S.points["knee.right"]], D = mt(R, { x: (z[0].x + z[1].x) / 2, y: (z[0].y + z[1].y) / 2 }, 0.9), q = Math.sin(S.turn * Math.PI / 2) * S.height * 0.04;
    if (L < 0.15) {
      const G = mt(R, $, 0.2);
      L < -0.3 && C.line([{ x: G.x - S.height * 0.05, y: G.y }, { x: G.x + S.height * 0.05, y: G.y }], f(S));
      return;
    }
    const U = S.height * 0.075 * L, F = mt(R, $, 0.2);
    C.shape(
      [
        { x: N.x + q - U * 0.7, y: N.y },
        { x: N.x + q + U * 0.7, y: N.y },
        { x: F.x + q + U, y: F.y },
        { x: D.x + q + U * 1.15, y: D.y },
        { x: D.x + q - U * 1.15, y: D.y },
        { x: F.x + q - U, y: F.y }
      ],
      h,
      f(S)
    ), C.line([{ x: N.x + q - U * 0.6, y: N.y }, { x: $.x - U * 0.2, y: $.y }, { x: N.x + q + U * 0.6, y: N.y }], f(S) * 0.8);
  }, P = (S, C, L) => {
    const { top: $, hip: R } = m(S), N = [S.points["knee.left"], S.points["knee.right"]], z = mt(R, { x: (N[0].x + N[1].x) / 2, y: (N[0].y + N[1].y) / 2 }, 0.95);
    L ? C.shape(Ft([mt($, R, 0.8), R, z], S.height * 0.145, S.height * 0.17), h, f(S)) : C.shape(Ft([$, mt($, R, 0.5), R], S.height * 0.14, S.height * 0.15), h, f(S));
    const D = Ut(S);
    if (D > 0.2) {
      const q = Math.sin(S.turn * Math.PI / 2) * S.height * 0.03, [U, F] = L ? [R, z] : [$, R];
      if (C.line([{ x: U.x + q, y: U.y }, { x: F.x + q, y: F.y }], f(S) * 0.8), !L) {
        const G = mt($, R, 0.35), Y = S.height * 0.025 * D;
        C.shape([{ x: G.x + q - Y * 2.4, y: G.y }, { x: G.x + q - Y * 0.6, y: G.y }, { x: G.x + q - Y * 0.6, y: G.y + Y * 1.6 }, { x: G.x + q - Y * 2.4, y: G.y + Y * 1.6 }], h, f(S) * 0.6);
      }
    }
  }, O = (S, C, L, $, R) => {
    const N = S.parts[`arm.${L}`].points, z = N[0], D = S.chains.spine[S.chains.spine.length - 1], U = [{ x: z.x + (D.x - z.x) * 0.45, y: z.y + (D.y - z.y) * 0.45 }, ...ui(N, 0, R)], F = Ft(U, S.height * 0.085, S.height * (R > 0.6 ? 0.045 : 0.06)), G = U.length, Y = F.slice(0, G), nt = F.slice(G).reverse();
    C.shape(F, $, 0);
    const ot = (H) => Math.hypot(H[1].x - D.x, H[1].y - D.y), [it, rt] = ot(Y) > ot(nt) ? [Y, nt] : [nt, Y];
    C.line(it.slice(1), f(S)), C.line(rt.slice(Math.ceil(G * 0.45)), f(S)), C.line([Y[G - 1], nt[G - 1]], f(S));
  }, _ = i || r || a, W = _ ? h : e, B = _ || s === "long" ? 0.95 : 0.45, K = _ || s !== "none", V = (S, C) => {
    o === "skirt" && !l && !c && x(S, C), c && E(S, C), i && P(S, C, !0), t.over === "apron" && I(S, C);
  }, j = (S) => (C, L, $) => {
    g(L, $, S), u && p(L, $, S), Zy(L) === S && Bl(L) && V(L, $);
  };
  return {
    parts: {
      "leg.left": { over: j("left") },
      "leg.right": { over: j("right") },
      spine: {
        over: (S, C, L) => {
          r && Ut(C) >= 0 && k(C, L), b(C, L), t.collar && !r && M(C, L), t.tie && !r && A(C, L, t.tie), i && P(C, L, !1), a && y(C, L), r && (Ut(C) < 0 && k(C, L), w(C, L)), l && v(C, L), c && T(C, L), Bl(C) || V(C, L);
        }
      },
      "arm.left": { over: K ? (S, C, L) => O(C, L, "left", W, B) : void 0 },
      "arm.right": { over: K ? (S, C, L) => O(C, L, "right", W, B) : void 0 }
    }
  };
}
const Z0 = {
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
function tb(t) {
  const e = {};
  for (const n of ["left", "right", "both"]) {
    const s = t[n];
    if (!s) continue;
    const o = typeof s == "string" ? s : s.item, i = Z0[o];
    if (!i) throw new Error(`holding: unknown item '${o}'`);
    if (n === "both" && i.hands === "one") throw new Error(`holding: a ${o} is held in one hand ('left' or 'right'), not 'both'`);
    if (n !== "both" && i.hands === "both") throw new Error(`holding: a ${o} is held in both hands ('both')`);
    e[n] = { item: o, color: (typeof s == "object" ? s.color : void 0) ?? i.color };
  }
  return e;
}
function di(t, e) {
  const n = t.chains[`arm.${e}`], s = n[n.length - 1], o = n[n.length - 2], i = Math.hypot(s.x - o.x, s.y - o.y) || 1, r = { x: (s.x - o.x) / i, y: (s.y - o.y) / i }, a = t.lineWidth * 0.5;
  return { point: { x: s.x + r.x * a, y: s.y + r.y * a }, along: r, depth: t.parts[`arm.${e}`]?.depth ?? 0 };
}
function rn(t, e, n, s = 0) {
  const o = Math.cos(s), i = Math.sin(s);
  return [
    [-e / 2, -n / 2],
    [e / 2, -n / 2],
    [e / 2, n / 2],
    [-e / 2, n / 2]
  ].map(([r, a]) => ({ x: t.x + r * o - a * i, y: t.y + r * i + a * o }));
}
const an = (t, e, n, s, o = 12) => Array.from({ length: o + 1 }, (i, r) => {
  const a = n + (s - n) * r / o;
  return { x: t.x + Math.cos(a) * e, y: t.y + Math.sin(a) * e };
});
function zl(t, e, n, s, o, i = 1, r) {
  const { point: a, along: l } = n, c = s / 300;
  switch (e.item) {
    case "mug": {
      const h = rn({ x: a.x, y: a.y - 4 * c }, 20 * c, 24 * c);
      t.line(an({ x: a.x + 10 * c * Math.sign(i || 1), y: a.y - 4 * c }, 7 * c, -Math.PI / 2, Math.PI / 2).map((u) => ({ x: a.x + (u.x - a.x) * Math.sign(i || 1), y: u.y })), o), t.shape(h, e.color, o);
      return;
    }
    case "phone": {
      const h = Math.atan2(l.y, l.x) - Math.PI / 2;
      t.shape(rn(a, 13 * c, 24 * c, h), e.color, o), t.shape(rn(a, 9 * c, 17 * c, h), "#8fd0f5", 0);
      return;
    }
    case "book": {
      const h = 26 * c, u = 34 * c;
      t.shape([{ x: a.x, y: a.y - u / 2 }, { x: a.x - h, y: a.y - u / 2 - 3 * c }, { x: a.x - h, y: a.y + u / 2 - 3 * c }, { x: a.x, y: a.y + u / 2 }], e.color, o), t.shape([{ x: a.x, y: a.y - u / 2 }, { x: a.x + h, y: a.y - u / 2 - 3 * c }, { x: a.x + h, y: a.y + u / 2 - 3 * c }, { x: a.x, y: a.y + u / 2 }], e.color, o);
      for (const d of [-1, 1])
        for (const f of [0.3, 0.5, 0.7]) {
          const g = a.y - u / 2 + u * f;
          t.line([{ x: a.x + d * 5 * c, y: g }, { x: a.x + d * (h - 5 * c), y: g - 2 * c }], Math.max(0.8, o * 0.5));
        }
      return;
    }
    case "bag": {
      const h = a.y + 10 * c;
      t.line([{ x: a.x - 9 * c, y: h }, { x: a.x - 5 * c, y: a.y - 2 * c }, { x: a.x + 5 * c, y: a.y - 2 * c }, { x: a.x + 9 * c, y: h }], o), t.shape([{ x: a.x - 17 * c, y: h }, { x: a.x + 17 * c, y: h }, { x: a.x + 20 * c, y: h + 40 * c }, { x: a.x - 20 * c, y: h + 40 * c }], e.color, o);
      return;
    }
    case "briefcase": {
      t.line(an({ x: a.x, y: a.y + 6 * c }, 7 * c, Math.PI, Math.PI * 2), o), t.shape(rn({ x: a.x, y: a.y + 22 * c }, 46 * c, 32 * c), e.color, o), t.line([{ x: a.x - 23 * c, y: a.y + 14 * c }, { x: a.x + 23 * c, y: a.y + 14 * c }], Math.max(0.8, o * 0.6));
      return;
    }
    case "umbrella": {
      const h = 78 * c, u = (r ?? a.y - 120 * c) - 14 * c, d = { x: a.x, y: Math.min(a.y - 60 * c, u - h * 0.55) };
      t.line([{ x: a.x, y: a.y + 10 * c }, d], o), t.line(an({ x: a.x + 5 * c, y: a.y + 10 * c }, 5 * c, Math.PI, 0, 8), o);
      const f = [...an({ x: d.x, y: d.y + h * 0.55 }, h, Math.PI, Math.PI * 2, 24)], g = [];
      for (let p = 4; p >= 0; p--) {
        const m = d.x - h + 2 * h * p / 5;
        g.push(...an({ x: m + h / 5, y: d.y + h * 0.55 }, h / 5, 0, -Math.PI, 6).reverse());
      }
      t.shape([...f, ...g], e.color, o);
      return;
    }
    case "broom": {
      const h = { x: l.x * 0.4 + 0.25 * Math.sign(i || 1), y: Math.max(0.6, l.y) }, u = Math.hypot(h.x, h.y), d = { x: h.x / u, y: h.y / u }, f = { x: a.x - d.x * 40 * c, y: a.y - d.y * 40 * c }, g = { x: a.x + d.x * 120 * c, y: a.y + d.y * 120 * c };
      t.line([f, g], o * 1.1);
      const p = { x: -d.y, y: d.x }, m = [
        { x: g.x + p.x * 6 * c, y: g.y + p.y * 6 * c },
        { x: g.x - p.x * 6 * c, y: g.y - p.y * 6 * c },
        { x: g.x - p.x * 16 * c + d.x * 34 * c, y: g.y - p.y * 16 * c + d.y * 34 * c },
        { x: g.x + p.x * 16 * c + d.x * 34 * c, y: g.y + p.y * 16 * c + d.y * 34 * c }
      ];
      t.shape(m, e.color, o);
      return;
    }
    case "cane": {
      const h = Math.min(0.56 * s, Math.max(0.3 * s, -a.y)), u = 0.12 * Math.sign(i || 1), d = { x: u / Math.hypot(u, 1), y: 1 / Math.hypot(u, 1) }, f = { x: a.x + d.x * h, y: a.y + d.y * h }, g = an({ x: a.x + 7 * c * Math.sign(i || 1), y: a.y - 2 * c }, 7 * c, Math.PI, Math.PI * 2, 8).map((p) => ({ x: a.x + (p.x - a.x) * Math.sign(i || 1), y: p.y }));
      t.line([...g, { x: a.x, y: a.y + 2 * c }, f], o * 1.2), t.shape(rn({ x: f.x, y: f.y - 3 * c }, 9 * c, 7 * c), e.color, 0);
      return;
    }
    case "parcel": {
      const h = { x: a.x, y: a.y - 6 * c };
      t.shape(rn(h, 50 * c, 40 * c), e.color, o), t.line([{ x: h.x - 25 * c, y: h.y - 6 * c }, { x: h.x + 25 * c, y: h.y - 6 * c }], Math.max(0.8, o * 0.7)), t.line([{ x: h.x, y: h.y - 20 * c }, { x: h.x, y: h.y + 20 * c }], Math.max(0.8, o * 0.7));
      return;
    }
  }
}
const ql = (t, e) => (t[`held.${e}`] ?? 1) >= 0.5, Yl = (t) => Math.sin(t * Math.PI / 2);
function eb(t) {
  const e = (i) => Math.max(1, i.lineWidth * 0.45), n = (i) => (r, a, l, c, h) => {
    const u = t[i];
    u && ql(h ?? {}, i) && zl(l, u, di(a, i), a.height, e(a), Yl(a.turn), a.head.center.y - a.head.ry);
  }, s = (i, r, a, l, c) => {
    const h = t.both;
    if (!h || !ql(c ?? {}, "both")) return;
    const u = di(r, "left"), d = di(r, "right"), f = {
      point: { x: (u.point.x + d.point.x) / 2, y: (u.point.y + d.point.y) / 2 },
      along: { x: (u.along.x + d.along.x) / 2, y: (u.along.y + d.along.y) / 2 },
      depth: (u.depth + d.depth) / 2
    };
    zl(a, h, f, r.height, e(r), Yl(r.turn), r.head.center.y - r.head.ry);
  }, o = { parts: {} };
  if (t.left && (o.parts["arm.left"] = { over: n("left") }), t.right && (o.parts["arm.right"] = { over: n("right") }), t.both) {
    const i = (r) => (a, l, c, h, u) => {
      const d = r === "left" ? "right" : "left";
      (r === "left" ? l.parts["arm.left"].depth >= l.parts["arm.right"].depth : l.parts["arm.right"].depth > l.parts[`arm.${d}`].depth) && s(a, l, c, h, u);
    };
    for (const r of ["left", "right"]) o.parts[`arm.${r}`] = { ...o.parts[`arm.${r}`], over: nb(o.parts[`arm.${r}`]?.over, i(r)) };
  }
  return o;
}
function nb(t, e) {
  return t ? (n, s, o, i, r) => {
    t(n, s, o, i, r), e(n, s, o, i, r);
  } : e;
}
function jl(t, e) {
  const n = (o, i) => o && i ? (r, a, l, c, h) => {
    o(r, a, l, c, h), i(r, a, l, c, h);
  } : o ?? i, s = {};
  for (const o of /* @__PURE__ */ new Set([...Object.keys(t.parts ?? {}), ...Object.keys(e.parts ?? {})])) {
    const i = t.parts?.[o], r = e.parts?.[o];
    s[o] = { under: n(i?.under, r?.under), over: n(i?.over, r?.over) };
  }
  return { behind: n(t.behind, e.behind), parts: s, front: n(t.front, e.front) };
}
function Q0(t = {}) {
  if (t.build && !(t.build in tr)) throw new Error(`character: unknown build '${t.build}'`);
  const e = t.build ? tr[t.build] : {}, n = (t.proportions ?? "bold") === "bold", s = t.figure ?? "fluid", o = t.look ?? "clean", i = t.height ?? 300, r = s === "stick", a = t.outfit ? Qy(t.outfit) : null, l = t.holding ? tb(t.holding) : {};
  let c = a ? jl(a, t.layers ?? {}) : t.layers ?? {};
  return Object.keys(l).length > 0 && (c = jl(c, eb(l))), {
    plan: t.plan ?? Z1({
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
    head: jy(t),
    face: { ...t.face, teeth: t.face?.teeth ?? !1, tongue: t.face?.tongue ?? !1 }
  };
}
function PM(t, e, n, s) {
  const { point: o, facing: i } = Ur(t, [e, n, s]);
  return { point: o, facing: i };
}
const ar = (t) => t.rest[1] < -0.5, sb = 0.3;
function ob(t, e, n) {
  return t.figure === "stick" ? ar(e) ? n.slice(0, 3) : n : ar(e) && n.length >= 3 ? $n(n[0], n[1], n[2], sb) : n.length === 3 ? $n(n[0], n[1], n[2], 1) : n;
}
function cs(t, e) {
  const n = t.plan.id === "human" ? { ...ft, ...e } : e;
  return Ro(t, n, jr(t.plan, n, { height: t.height, contact: t.contact }));
}
function Ro(t, e, n) {
  const s = {}, o = {}, i = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((d) => {
    const f = n.chains[d.id];
    s[d.id] = f.points;
    const g = f.depths.reduce((k, w) => k + w, 0) / f.depths.length, p = d.parent ? n.chains[d.parent] : void 0, m = p ? p.depths[d.at ?? p.depths.length - 1] : 0, b = g - m;
    i[d.id] = Math.abs(b) < r ? 0 : b, o[d.id] = { points: ob(t, d, f.points), depth: g };
  }), o.head = { points: [n.head.center], depth: n.head.depth }, i.head = 0;
  const a = [...t.plan.chains.map((d) => d.id), "head"], l = [...a].sort((d, f) => i[d] - i[f] || a.indexOf(d) - a.indexOf(f)), c = { hip: n.hip };
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
    parts: o,
    head: n.head,
    groundY: n.groundY,
    grounded: h
  };
  return { skeleton: n, joints: u, order: l };
}
function oe(t, e) {
  return cs(t, e).joints;
}
function tu(t, e, n) {
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
function eu(t, e, n, s, o, i) {
  const r = n.lineWidth;
  if (o === "head") {
    const { head: f } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(f.center.x, f.center.y, f.rx, f.ry, f.angle, g, r), Ky(t, e, n.head, f, i, { lineWidth: r, skin: n.skin }, () => {
      e.look !== "silhouette" && fy(e, f, i, r, { ...n.face, skin: n.skin === "none" ? "#ffffff" : n.skin }, t);
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
  if (ar(a)) {
    const [f, g] = h(0, 1);
    if (e.limb(c, f, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && o.startsWith("arm."))
      rb(t, e, n, l, o.endsWith(".left") ? "left" : "right", i);
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
    const b = s.points["shoulder.left"], k = s.points["shoulder.right"];
    b && k && Math.hypot(b.x - k.x, b.y - k.y) > 0.5 && e.limb($n(b, l[l.length - 1], k, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, d] = h(0, a.bones.length - 1);
  e.limb(c, u, d);
}
function ib(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const o = t.turn ?? 0, i = e === "right" ? 1 - o : 1 + o;
  return { ...Pt, ...s, turn: i + (s.turn ?? 0) };
}
function rb(t, e, n, s, o, i) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  Wr(t, r, ib(i, o), {
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
function ab(t, e, n, s = 0) {
  const o = e.plan.id === "human" ? { ...ft, ...n } : n;
  sa(t, e, o, cs(e, o), s);
}
function Lo(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function IM(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ft, ...e } : e, i = Xr(t.plan, o, { height: s.height, contact: t.contact }, n);
  return Ro(Lo(t, i.height), o, i).joints;
}
function OM(t, e, n, s, o) {
  const i = e.plan.id === "human" ? { ...ft, ...n } : n, r = Xr(e.plan, i, { height: o.height, contact: e.contact }, s), a = Lo(e, r.height);
  sa(t, a, i, Ro(a, i, r), o.time ?? 0);
}
function lb(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ft, ...e } : e, i = Xr(t.plan, o, { height: s.height, contact: t.contact }, n), r = Lo(t, i.height), { joints: a, order: l } = Ro(r, o, i), c = i.height / s.height;
  return l.map((h, u) => ({
    part: h,
    depth: (a.parts[h]?.depth ?? 0) / c,
    draw(d, f = 0) {
      const g = Io(d, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: Zt(`${r.seed}:${h}`), time: f, pencil: r.pencil }), p = (b) => {
        b && (d.save(), b(d, a, g, f, o), d.restore());
      };
      d.save(), d.lineCap = "round", d.lineJoin = "round", u === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && tu(g, r, a), p(r.layers.behind), U0(d, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }));
      const m = r.layers.parts?.[h];
      p(m?.under), eu(d, g, r, a, h, o), p(m?.over), u === l.length - 1 && (G0(d, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }), p(r.layers.front)), d.restore();
    }
  }));
}
function sa(t, e, n, s, o, i) {
  const { joints: r } = s, a = i ? s.order.filter((h) => i.has(h)) : s.order, l = Io(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: o,
    pencil: e.pencil
  }), c = (h) => {
    h && (t.save(), h(t, r, l, o, n), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", !i && e.look === "pencil" && e.pencil.construction !== !1 && tu(l, e, r), i || c(e.layers.behind), U0(t, l, e.head, r.head, n, { lineWidth: e.lineWidth, skin: e.skin });
  for (const h of a) {
    const u = e.layers.parts?.[h];
    c(u?.under), eu(t, l, e, r, h, n), c(u?.over);
  }
  G0(t, l, e.head, r.head, n, { lineWidth: e.lineWidth, skin: e.skin }), i || c(e.layers.front), t.restore();
}
function _M(t, e, n, s) {
  const o = e.plan.id === "human" ? { ...ft, ...n } : n, i = cs(e, o).joints.head.rx, r = Lo(e, e.height * s.radius / Math.max(1e-6, i)), a = cs(r, o);
  t.save(), t.translate(s.x - a.joints.head.center.x, s.y - a.joints.head.center.y), sa(t, r, o, a, s.time ?? 0, /* @__PURE__ */ new Set(["head"])), t.restore();
}
function cb(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
function Pe(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ft, ...e } : e;
  let i;
  if (Array.isArray(s))
    i = s;
  else {
    const { skeleton: r } = cs(t, o), a = jr(t.plan, { ...o, roll: 0 }, { height: t.height, contact: "none" }), l = (o.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), d = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), f = Math.PI / 2 * (o.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(f), m = Math.sin(f);
    i = [u * p - g * m, -d, u * m + g * p];
  }
  return ry(t.plan, o, n, i, { height: t.height });
}
const nu = /* @__PURE__ */ new Set(["walk", "walking", "gait"]);
function oa(t, e = ft, n) {
  let s = { ...e };
  for (const [i, r] of Object.entries(t))
    typeof r == "number" && !nu.has(i) && (s[i] = r);
  const o = Math.max(0, Math.min(1, typeof t.walking == "number" ? t.walking : 0));
  if (o > 0) {
    const i = typeof t.gait == "string" ? t.gait : void 0, r = i ? n?.[i] ?? i : void 0, a = V0(r, typeof t.walk == "number" ? t.walk : 0, s);
    s = Object.fromEntries(Object.keys({ ...s, ...a }).map((l) => [l, (s[l] ?? 0) + ((a[l] ?? 0) - (s[l] ?? 0)) * o]));
  }
  return s;
}
function HM(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, o = e.plan.id === "human" ? ft : {};
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
      i.translate(n / 2, s), ab(i, e, oa(r.props ?? {}, o, t.gaits), a);
    }
  };
}
function hb(t, e, n) {
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
function CM(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "x" || c === "motionPathX" ? i = typeof h == "number" ? h : i : c === "y" || c === "motionPathY" ? r = typeof h == "number" ? h : r : (typeof h == "number" || nu.has(c)) && (o[c] = h);
  const a = oa(o, s.plan.id === "human" ? ft : {}, t.gaits), l = oe(s, a);
  return { pose: a, joints: hb(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function su(t, e = ft) {
  const n = [];
  return t.forEach((s, o) => {
    const i = o === 0 ? e : n[o - 1], r = typeof s.pose == "string" ? ce[s.pose] : void 0;
    n.push(r ? { ...r, turn: i.turn ?? 0 } : { ...i, ...s.pose });
  }), n;
}
function RM(t, e, n = ft) {
  const s = su(e, n);
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
const fi = /* @__PURE__ */ new Map();
function ub(t) {
  const e = fi.get(t);
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
  return fi.size < 512 && fi.set(t, n), n;
}
Ue([-3, -5, -4]);
const db = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function ou(t, e, n) {
  const s = [0, 0, 0];
  for (const o of n) {
    const i = ub(o.color);
    let r;
    if (o.light === "ambient")
      r = o.intensity;
    else if (o.light === "directional")
      r = o.intensity * Math.max(0, -Ae(e, o.direction));
    else {
      const a = On(o.position, t), l = Ao(a), c = l > 0 ? bn(a, 1 / l) : e, h = o.range ? Math.max(0, 1 - l / o.range) ** 2 : 1;
      if (r = o.intensity * Math.max(0, Ae(e, c)) * h, o.light === "spot") {
        const u = Math.cos(o.angle * Math.PI / 180), d = Math.cos(o.angle * 0.8 * Math.PI / 180);
        r *= db(u, d, -Ae(c, o.direction));
      }
    }
    s[0] += i[0] * r, s[1] += i[1] * r, s[2] += i[2] * r;
  }
  return s;
}
function iu(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function ru(t, e, n = {}) {
  t.save(), fb(t, e, n), t.restore();
}
function fb(t, e, n) {
  const s = au(e, n);
  n.shadow !== !1 && lu(t, e, n);
  for (const o of e.under) Kl(t, o, s, n);
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
  for (const o of e.over) Kl(t, o, s, n);
}
function Kl(t, e, n, s) {
  const o = s.loose?.[e.part.id];
  if (!o) {
    lr(t, e, n, s);
    return;
  }
  if (o.opacity <= 0) return;
  const i = e.faces.flatMap((c) => c.points);
  if (i.length === 0) return;
  const r = i.map((c) => c.x), a = i.map((c) => c.y), l = { x: (Math.min(...r) + Math.max(...r)) / 2, y: (Math.min(...a) + Math.max(...a)) / 2 };
  t.save(), t.globalAlpha *= Math.min(1, o.opacity), t.translate(l.x + o.x, l.y + o.y), t.rotate(o.rotate * Math.PI / 180), t.translate(-l.x, -l.y), lr(t, e, n, s), t.restore();
}
function au(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function lu(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, Wo(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function LM(t, e, n, s = {}) {
  t.save(), lr(t, e, n, s), t.restore();
}
function pb(t, e, n, s = {}) {
  const o = s.style === "stick", i = e.flatMap((h) => {
    if (o && h.part.solidOnly) return [];
    const u = h.part.layer ?? 0;
    return o && h.spine ? [{ depth: h.depth, layer: u, part: h }] : h.faces.map((d) => ({ depth: d.depth, layer: u, part: h, face: d }));
  }), r = /* @__PURE__ */ new Map();
  for (const h of i) {
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
        b > -Xl / 5 && b < Xl && (u.layer = Math.max(u.layer, g.layer), u.depth = Math.max(u.depth, g.depth + 1e-6));
      }
    }
  i.sort((h, u) => h.layer - u.layer || h.depth - u.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let u = a.get(h.part.id);
    return u || a.set(h.part.id, u = ia(t, h, n, s)), u;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: u } of i) {
    t.globalAlpha = c * h.opacity;
    const d = l(h);
    if (!u) d.line(h.spine, n * 1.15);
    else {
      const f = o ? cu(h, s) : u.light ? gb(h, u, s) : ra(h);
      f && (!o && s.look === "silhouette" ? d.shape(u.points, f, 0) : Wo(t, u.points, o || u.light ? f : la(f, u.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of u.edges ?? []) p.length > 1 && d.line(p, g);
      for (const p of u.marks ?? []) d.line(p, n * 0.7);
    }
  }
  t.restore();
}
const Xl = 0.05;
function ia(t, e, n, s) {
  return Io(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: Zt(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function ra(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? uu(e.fill, e.glow.color, t.glow) : e.fill;
}
function gb(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const o = hu(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? uu(o, s.glow.color, t.glow) : o;
}
function cu(t, e) {
  const n = ra(t);
  return n && (yb(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function lr(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, Ul(t, e, n, s), t.restore()) : Ul(t, e, n, s);
}
function Ul(t, e, n, s) {
  if (s.style === "stick") return mb(t, e, n, s);
  const { part: o } = e, i = ia(t, e, n, s), r = ra(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? i.shape(c.points, r, 0) : Wo(t, c.points, la(r, c.tone)));
  const l = (o.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && i.line(c, l);
  for (const c of e.marks) i.line(c, n * 0.7);
}
function mb(t, e, n, s) {
  const { part: o } = e;
  if (o.solidOnly) return;
  const i = ia(t, e, n, s);
  if (e.spine) {
    i.line(e.spine, n * 1.15);
    return;
  }
  const r = cu(e, s);
  for (const l of e.faces) Wo(t, l.points, r);
  const a = (o.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && i.line(l, a);
  for (const l of e.marks) i.line(l, n * 0.7);
}
function yb(t) {
  const e = Pn(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function Wo(t, e, n, s = !0, o = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let i = 1; i < e.length; i++) t.lineTo(e[i].x, e[i].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = o, t.lineJoin = "round", t.stroke());
}
function Pn(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const aa = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function la(t, e) {
  const n = Pn(t);
  return n ? aa(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function hu(t, e, n, s) {
  const o = Pn(t);
  if (!o) return t;
  let i = o.map((a, l) => a * e[l]);
  const r = s ? Pn(s) : void 0;
  return r && n > 0 && (i = i.map((a, l) => a + (r[l] - a) * n)), aa(i);
}
function uu(t, e, n) {
  const s = Pn(t), o = Pn(e);
  return !s || !o ? n < 0.5 ? t : e : aa(s.map((i, r) => i + (o[r] - i) * n));
}
const bb = /* @__PURE__ */ new Set([
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
]), wb = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), Gl = (t) => typeof t == "number" ? t : void 0, kb = 1.7;
function vb(t, e, n) {
  const s = Array.from({ length: 24 }, (o, i) => {
    const r = i / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((o) => o === null) || (t.beginPath(), s.forEach((o, i) => i === 0 ? t.moveTo(o.x, o.y) : t.lineTo(o.x, o.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function Mb(t) {
  const e = Ae([0, 1, 0], t);
  if (e > 0.999999) return $o();
  if (e < -0.999999) return se(Vt([1, 0, 0], 180));
  const n = Qs([0, 1, 0], t);
  return se(Vt(n, Math.acos(e) * 180 / Math.PI));
}
function xb(t, e, n, s, o) {
  const i = t.solid ?? {}, r = i.outline === !1 ? void 0 : i.outline ?? { width: 2, color: "#0f172a" }, a = { color: i.color ?? "#475569", shading: i.shading ?? "toon", outline: r }, l = { color: i.skin ?? "#f2c49b", shading: i.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], d = (w, y, v) => u.push({ mesh: w, world: At(o, y), material: v }), f = (w, y, v) => d(e.sphere, $r(w, [0, 0, 0, 1], [y, y, y]), v);
  for (const w of n.chains) {
    const y = s.chains[w.id], v = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach((E, T) => {
      const x = y[T], M = y[T + 1], A = Ar(x, M), [I, P] = E.width ?? [1, 1], O = h * v * (I + P) / 2;
      if (A > 1e-6) {
        const _ = Rh(x, M, 0.5), W = Mb(Ue(On(M, x)));
        d(e.cylinder, At(Re(_), At(W, ze([O, A, O]))), a);
      }
      f(x, h * v * I, a), f(M, h * v * P, a);
    }), w.id.startsWith("arm.") && f(y[y.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: b } = s.head, k = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...g, 1];
  d(e.sphere, At(k, ze([p, m, p])), l);
  for (const w of [-1, 1]) {
    const y = Ue([w * 0.36, 0.15, 0.92]), v = Ds(g, Ds(Ds(bn(b[0], y[0] * p * 1.04), bn(b[1], y[1] * m * 1.04)), bn(b[2], y[2] * p * 1.04))), E = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...v, 1];
    d(e.sphere, At(E, ze([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const WM = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: Q0({ ...t.character, height: 1 }),
      cylinder: ho(A0(1, 1, 16)),
      sphere: ho(iy(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let u = { ...ft, ...l.pose };
    for (const [x, M] of n)
      typeof M == "number" && !bb.has(x) && !wb.has(x) && (u[x] = M);
    const d = Math.max(0, Math.min(1, Gl(n.get("walking")) ?? l.walking ?? 0));
    if (d > 0) {
      const x = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, M = V0(x, Gl(n.get("walk")) ?? 0, u);
      u = Object.fromEntries(Object.keys({ ...u, ...M }).map((A) => [A, (u[A] ?? 0) + ((M[A] ?? 0) - (u[A] ?? 0)) * d]));
    }
    const f = l.height ?? kb, g = At(o.view, s), p = {
      toView: (x) => jt(g, x),
      toScreen: (x) => a(x)
    }, b = -p.toView([0, f / 2, 0])[2];
    if (b <= o.near) return null;
    const k = l.shadow === !1 ? [] : [{ depth: b + f, draw: (x) => vb(x, p, f * 0.18) }];
    if (l.look === "solid") {
      const x = Kr(h.plan, u, { height: f, contact: h.contact });
      return { meshes: xb(l, c, h.plan, x, s), drawables: k };
    }
    const w = jt(s, [0, f * 0.6, 0]), y = Ue(On(o.position, w)), v = ou(w, y, i).map((x) => Math.min(1, x)), E = i.length > 0 && h.skin !== "none" ? { ...h, skin: hu(h.skin, v, iu(r, Ar(w, o.position)), r?.color) } : h, T = lb(E, u, p, { height: f });
    return {
      drawables: [
        ...k,
        // Ties keep the character's own order.
        ...T.map((x, M) => ({ depth: -x.depth - M * 1e-6, draw: (A, I) => x.draw(A, I.time) }))
      ]
    };
  }
}, Zn = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function Sb([t, e, n]) {
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
const ln = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function Tb(t, e, n = "x", s = 20, o = 0) {
  const i = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const u = Math.PI * 2 * h / s;
      i.push(ln(n, [Math.cos(u) * t, Math.sin(u) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: ln(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: ln(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, u = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: ln(n, [Math.cos(u), Math.sin(u), 0]) });
  }
  const l = [];
  if (o > 0)
    for (const c of [-r, r]) {
      const h = i.push(ln(n, [0, 0, c * 1.01])) - 1;
      for (let u = 0; u < o; u++) {
        const d = Math.PI * 2 * u / o, f = i.push(ln(n, [Math.cos(d) * t * 0.82, Math.sin(d) * t * 0.82, c * 1.01])) - 1;
        l.push([h, f]);
      }
    }
  return { vertices: i, faces: a, marks: l, creases: !0 };
}
function Eb([t, e, n], s = 16) {
  const o = Math.max(4, Math.round(s / 2)), i = [[0, e, 0]];
  for (let h = 1; h < o; h++) {
    const u = Math.PI * h / o;
    for (let d = 0; d < s; d++) {
      const f = Math.PI * 2 * d / s;
      i.push([Math.sin(u) * Math.cos(f) * t, Math.cos(u) * e, Math.sin(u) * Math.sin(f) * n]);
    }
  }
  const r = i.push([0, -e, 0]) - 1, a = (h, u) => 1 + (h - 1) * s + u % s, l = (h) => {
    const u = h.reduce((d, f) => [d[0] + i[f][0], d[1] + i[f][1], d[2] + i[f][2]], [0, 0, 0]);
    return Zn([u[0] / (t * t), u[1] / (e * e), u[2] / (n * n)]);
  }, c = [];
  for (let h = 0; h < s; h++) {
    const u = [0, a(1, h + 1), a(1, h)];
    c.push({ corners: u, normal: l(u) });
    for (let f = 1; f < o - 1; f++) {
      const g = [a(f, h), a(f, h + 1), a(f + 1, h + 1), a(f + 1, h)];
      c.push({ corners: g, normal: l(g) });
    }
    const d = [a(o - 1, h), a(o - 1, h + 1), r];
    c.push({ corners: d, normal: l(d) });
  }
  return { vertices: i, faces: c, creases: !1 };
}
const Ab = (t) => t.reduce((e, [n, s], o) => {
  const [i, r] = t[(o + 1) % t.length];
  return e + n * r - i * s;
}, 0) / 2;
function $b(t, e) {
  const n = Ab(t) < 0 ? [...t].reverse() : t, s = n.length, o = e / 2, i = [...n.map(([a, l]) => [o, l, a]), ...n.map(([a, l]) => [-o, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: Zn([0, -c, h]) });
  }
  return { vertices: i, faces: r, creases: !0 };
}
function Pb(t, e) {
  const n = {
    left: ([o, i]) => [0, i, o],
    right: ([o, i]) => [0, i, o],
    front: ([o, i]) => [o, i, 0],
    back: ([o, i]) => [o, i, 0],
    up: ([o, i]) => [o, 0, i]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((o, i) => i), normal: s[e] }] };
}
function Ib(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, o = [], i = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = Zn([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), u = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], d = Zn(Vl(h, u)), f = Vl(d, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), b = Math.sin(p) * s(a);
      o.push([r[0] + d[0] * m + f[0] * b, r[1] + d[1] * m + f[1] * b, r[2] + d[2] * m + f[2] * b]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((d, f) => [d[0] + o[f][0] / 4, d[1] + o[f][1] / 4, d[2] + o[f][2] / 4], [0, 0, 0]), u = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      i.push({ corners: c, normal: Zn([h[0] - u[0], h[1] - u[1], h[2] - u[2]]) });
    }
  return { vertices: o, faces: i, creases: !1 };
}
function Vl(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Ob(t) {
  switch (t.type) {
    case "box":
      return Sb(t.size);
    case "cylinder":
      return Tb(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return Eb(t.radii, t.segments);
    case "extrude":
      return $b(t.profile, t.width);
    case "panel":
      return Pb(t.points, t.facing);
    case "tube":
      return { ...Ib(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function du(t, e) {
  if (t.length < 2) return t;
  const n = (o) => t[Math.max(0, Math.min(t.length - 1, o))], s = (o) => {
    const i = o * (t.length - 1), r = Math.min(t.length - 2, Math.floor(i)), a = i - r, [l, c, h, u] = [n(r - 1), n(r), n(r + 1), n(r + 2)];
    return [0, 1, 2].map((d) => {
      const f = l[d], g = c[d], p = h[d], m = u[d];
      return 0.5 * (2 * g + (-f + p) * a + (2 * f - 5 * g + 4 * p - m) * a * a + (-f + 3 * g - 3 * p + m) * a * a * a);
    });
  };
  return Array.from({ length: e }, (o, i) => s(i / (e - 1)));
}
const Fe = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function po(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function fu(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function kn(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function pu(t) {
  const e = t.filter((o, i) => i === 0 || Math.hypot(o[0] - t[i - 1][0], o[1] - t[i - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : du(e.map(([o, i]) => [o, 0, i]), (e.length - 1) * 12).map(([o, , i]) => [o, i]);
  let s = 0;
  return n.map((o, i) => (i > 0 && (s += Math.hypot(o[0] - n[i - 1][0], o[1] - n[i - 1][1])), { point: o, at: s }));
}
function gu(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], o = t[n], i = o.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (o.at - s.at))) : 0;
  return {
    point: [s.point[0] + (o.point[0] - s.point[0]) * i, s.point[1] + (o.point[1] - s.point[1]) * i],
    direction: [o.point[0] - s.point[0], o.point[1] - s.point[1]]
  };
}
function mu(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let o = 0; o < 40; o++) {
    const i = (n + s) / 2;
    t(i) < e ? n = i : s = i;
  }
  return (n + s) / 2;
}
const Jl = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag"], _b = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, cr = Object.keys(Bt), pi = Object.keys(ce), gi = Object.keys(na), Hb = 0.25, Cb = 700 / 180, Rb = 200, Lb = 300;
function Wb(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...cr, "face", "hold", "pose", "gag", "place"], n = [];
  return t.forEach((s, o) => {
    const i = (c) => n.push({ beat: o, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return i("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) Jl.includes(c) || i(dt("beat field", c, Jl, a[c]));
    const l = typeof r.do == "string" ? pi.includes(r.do) ? "pose" : gi.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return i(dt("character 3D beat", r.do, e, l));
    cr.includes(r.do) && (r.to === void 0 && r.through === void 0 && i(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !Fe(r.to) && i(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(Fe)) && i("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !Fe(r.to) && i("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(Fe(r.toward) || typeof r.toward == "number") && i("`face` needs `toward`: a point [x, z] or a heading in degrees."), r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !pi.includes(r.pose) && i(dt("pose", r.pose, pi)), r.do === "gag" && !gi.includes(r.gag) && i(dt("gag", r.gag, gi));
  }), n;
}
function FM(t, e, n) {
  const s = Wb(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((y) => `  beat ${y.beat}: ${y.message}`).join(`
`)}`);
  const o = n.height ?? 1.7, i = { ...ft, ...n.pose };
  let [r, a] = n.position ?? [0, 0], l = n.heading ?? 0, c = 0;
  const h = /* @__PURE__ */ new Map(), u = [], d = (y, v, E, T = "linear") => {
    const x = h.get(y) ?? [];
    x.push({ time: v, value: E, easing: T }), h.set(y, x);
  };
  d("x", 0, r), d("z", 0, a), d("rotateY", 0, l);
  const f = (y, v) => {
    const E = po(l, v);
    if (Math.abs(E) < 1) return y;
    const T = Math.max(Rb, Math.abs(E) * Cb);
    return d("rotateY", y, l), l += E, d("rotateY", y + T, l, "ease-in-out"), y + T;
  }, g = (y, v, E, T = "ease-in-out") => {
    for (const [x, M] of Object.entries(E))
      i[x] !== M && (d(x, y, i[x] ?? 0), d(x, v, M, T), i[x] = M);
  }, p = (y, v, E) => {
    const T = pu([[r, a], ...v.through ?? [v.to]]);
    if (T.length < 2) return E;
    const x = f(E, kn(T[0].point, T[1].point)), M = T[T.length - 1].at, A = v.speed ?? _b[y] * Math.sqrt(o / 1.7), I = v.for ?? M / A * 1e3, P = J0(y, o), O = Rt("ease-in-out"), _ = Math.min(Lb, I / 4);
    u.push({ time: x, value: y }), d("walking", x, 0), d("walking", x + _, 1, "ease-out"), d("walking", x + I - _, 1), d("walking", x + I, 0, "ease-in");
    const W = c;
    let B = l;
    for (let K = 0; ; K = Math.min(M, K + Hb)) {
      const V = x + mu(O, K / M) * I, { point: j, direction: S } = gu(T, K);
      if (B += po(B, kn([0, 0], S)), d("x", V, j[0]), d("z", V, j[1]), d("rotateY", V, B), d("walk", V, W + K / P), K >= M) break;
    }
    return c = W + M / P, [r, a] = T[T.length - 1].point, l = B, x + I;
  }, m = [];
  let b = 0;
  for (const y of e) {
    const v = y.at ?? b;
    let E = v;
    if (cr.includes(y.do)) E = p(y.do, y, v);
    else if (y.do === "face") E = f(v, typeof y.toward == "number" ? y.toward : kn([r, a], y.toward));
    else if (y.do === "hold") E = v + (y.for ?? 1e3);
    else if (y.do === "place")
      d("x", v, r), d("z", v, a), [r, a] = y.to, d("x", v + 1, r), d("z", v + 1, a), typeof y.toward == "number" && (d("rotateY", v, l), l = y.toward, d("rotateY", v + 1, l)), E = v + 1;
    else if (y.do === "pose") {
      E = v + (y.for ?? 500);
      const T = typeof y.pose == "string" ? ce[y.pose] : y.pose;
      g(v, E, T);
    } else if (y.do === "gag") {
      const T = Uy(y.gag, { at: v, from: { ...i } });
      let x = T[0];
      for (const M of T.slice(1))
        g(x.time, M.time, Object.fromEntries(Object.entries(M.pose).filter(([A, I]) => i[A] !== I)), M.easing ?? "ease-in-out"), x = M;
      E = x.time;
    }
    m.push({ do: y.do, start: v, end: E }), b = E;
  }
  const k = `${n.scene}/${t}`, w = [...h].map(([y, v]) => ({ id: `${t}-${y}`, target: k, property: y, keyframes: fu(v) }));
  return u.length > 0 && w.push({ id: `${t}-gait`, target: k, property: "gait", keyframes: u }), { tracks: w, duration: b, beats: m, end: { position: [r, a], heading: l, pose: { ...i } } };
}
const Fb = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function NM(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : Fb[n];
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
function DM(t, e, n) {
  const s = n.width / 2, o = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, o + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -o);
}
function BM(t, e, n) {
  const s = e.width / 2, o = e.height / 2, i = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - o) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(i) - a * Math.sin(i),
    y: o + t.y + t.shakeY + r * Math.sin(i) + a * Math.cos(i)
  };
}
function Nb(t, e, n = {}, s) {
  const o = n.length ?? 240, i = 9, r = 28, a = o - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -i, a - r, 2 * i), t.fillStyle = "#e8b4a0", t.fillRect(a, -i, o - a, 2 * i), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -i), t.lineTo(r, i), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -i * 0.35), t.lineTo(r * 0.35, i * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -i }, { x: o, y: -i }, { x: o, y: i }, { x: r, y: i }, { x: 0, y: 0 }],
    [{ x: r, y: -i }, { x: r, y: i }],
    [{ x: a, y: -i }, { x: a, y: i }]
  ];
  for (const c of l) ku(t, c, s);
  t.restore();
}
function yu(t, e, n = {}, s) {
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
const bu = 150, Db = { pencil: 44, eraser: 30 };
function wu(t, e, n = {}, s) {
  const o = n.tool ?? "pencil", i = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = bu * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const d = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, f = Ht.pencilGrip, g = (T) => {
    const x = T.fingers.thumb, M = T.fingers.index, A = T.fingers.middle, I = Zl([x.points[3], M.points[3], A.points[3]]), P = Zl([x.points[1], M.points[0]]), O = (x.depths[3] + M.depths[3] + A.depths[3]) / 3;
    return { pinch: I, direction: Math.atan2(P.y - I.y, P.x - I.x), depth: O };
  }, p = Xi(f, { size: u }), m = c - g(p).direction, b = Xi(f, { size: u, angle: m * 180 / Math.PI }), k = g(b), w = Db[o] * a, y = { x: k.pinch.x - Math.cos(c) * w, y: k.pinch.y - Math.sin(c) * w }, v = { x: d.x - y.x, y: d.y - y.y }, E = b.axes.up;
  Bb(t, v, { x: -E.x, y: -E.y }, u, n.arm ?? 300 * a, i, n.sleeve ?? "#5b7db1", r), Wr(t, v, f, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: i,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: k.depth,
      draw: () => {
        t.save(), t.translate(d.x, d.y), t.scale(a, a), o === "eraser" ? yu(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : Nb(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const Zl = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function Bb(t, e, n, s, o, i, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, b) => ({
    x: e.x + n.x * p + l.x * m * b,
    y: e.y + n.y * p + l.y * m * b
  }), u = h(o, 0, 0), d = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, zb(p)), m;
  }, f = Math.min(s * 0.55, o * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / bu), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(f + 4, -1, c * 1.1).x, h(f + 4, -1, c * 1.1).y), t.lineTo(h(f + 4, 1, c * 1.1).x, h(f + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = i, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(f, -1, c * 1.1).x, h(f, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(f, 1, c * 1.1).x, h(f, 1, c * 1.1).y), t.stroke();
  const g = [h(f, -1, c * 1.3), h(o, -1, c * 1.5), h(o, 1, c * 1.5), h(f, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = d(r), t.fill(), t.strokeStyle = d(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function zM(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, o = n.enter ?? 450, i = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, b) => ({ x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: Rr(u.path, m), tool: l(u), lift: 0, drawing: !0 };
  }
  const d = [...a].reverse().find((p) => p.end < e), f = a.find((p) => p.start > e), g = (p) => p.path[p.path.length - 1];
  if (d && f && f.start - d.end <= r) {
    const p = (e - d.end) / (f.start - d.end), m = p < 0.5 ? l(d) : l(f);
    return { at: h(g(d), f.path[0], c(p)), tool: m, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (f && f.start - e <= o) {
    const p = 1 - (f.start - e) / o;
    return { at: h(s, f.path[0], c(p)), tool: l(f), lift: 1 - c(p), drawing: !1 };
  }
  if (d && e - d.end <= i) {
    const p = (e - d.end) / i;
    return { at: h(g(d), s, c(p)), tool: l(d), lift: c(p), drawing: !1 };
  }
  return null;
}
function qM(t, e, n, s = 0.08, o = 32) {
  const i = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= o; a++) {
    const l = -Math.PI / 2 + i * a / o;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function YM(t) {
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
      const u = t.sketch ? Yi(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : ku(a, ss(e, h))), r && h > 0 && h < 1 && wu(a, Rr(e, h), r, u);
    }
  };
}
function zb(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, o, i] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${o}, ${i}, 0)`;
}
function ku(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const $s = 1e5;
function jM(t, e, n, s, o = 6) {
  const i = [], r = Math.max(1, Math.round(o));
  for (let a = 0; a <= r; a++)
    i.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return i;
}
function vu(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const o = ss(e, s), i = n / 2, r = (a) => {
    t.beginPath(), t.rect(-$s, -$s, 2 * $s, 2 * $s), a(), t.clip("evenodd");
  };
  for (const a of o)
    r(() => {
      t.moveTo(a.x + i, a.y), t.arc(a.x, a.y, i, 0, Math.PI * 2);
    });
  for (let a = 1; a < o.length; a++) {
    const l = o[a - 1], c = o[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const u = -(c.y - l.y) / h * i, d = (c.x - l.x) / h * i;
    r(() => {
      t.moveTo(l.x + u, l.y + d), t.lineTo(c.x + u, c.y + d), t.lineTo(c.x - u, c.y - d), t.lineTo(l.x - u, l.y - d), t.closePath();
    });
  }
}
function KM(t, e, n, s, o) {
  t.save(), vu(t, e, n, s), o(), t.restore();
}
function XM(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, o = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(i, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (i.save(), vu(i, e.path, n, l), t.draw(i, r, a), i.restore(), !o || l <= 0 || l >= 1) return;
      const c = Rr(e.path, l);
      s ? wu(i, c, { ...s, tool: "eraser" }) : yu(i, c, o);
    }
  };
}
function ms() {
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
    valueAt: (n, s) => ca(t.get(n), s),
    cutAfter(n, s) {
      for (const o of n) t.set(o, (t.get(o) ?? []).filter((i) => i.time <= s));
    },
    tracks(n) {
      return [...t].filter(([, s]) => s.length > 0).map(([s, o]) => ({
        id: `${n}-${s}`,
        target: n,
        property: s,
        keyframes: qb(o)
      }));
    }
  };
}
function ca(t, e) {
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
function hs(t) {
  const e = [...t ?? []].sort((n, s) => n.time - s.time);
  return e.slice(1).flatMap((n, s) => n.value !== e[s].value ? [{ start: e[s].time, end: n.time }] : []);
}
function qb(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
const Yb = 16e-4, jb = 0.6, Ne = 33;
function Fo(t) {
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
      const a = n(i, r.at), l = r.velocity ?? s(i, r.at) ?? { x: 0.5, y: -0.6 }, c = r.gravity ?? Yb, h = r.duration ?? 900, u = (r.spin ?? jb) * (l.x < 0 ? -1 : 1), d = t.valueAt(e(i, "rotate"), r.at);
      o(i, r.at);
      for (let f = 0; f <= h; f += Ne) {
        const g = a.x + l.x * f, p = a.y + l.y * f + 0.5 * c * f * f;
        t.push(e(i, "x"), { time: r.at + f, value: g - i.home.x }), t.push(e(i, "y"), { time: r.at + f, value: p - i.home.y }), t.push(e(i, "rotate"), { time: r.at + f, value: d + u * f });
      }
      t.tween(e(i, "opacity"), 1, 0, { at: r.at + h * 0.6, duration: h * 0.4 });
    },
    move(i, r) {
      const a = n(i, r.at);
      t.tween(e(i, "x"), a.x - i.home.x, r.to.x - i.home.x, r, 400), t.tween(e(i, "y"), a.y - i.home.y, r.to.y - i.home.y, r, 400);
    }
  };
}
function ha(t, e, { ground: n, every: s, floors: o }) {
  if (o.every((w) => w.windows.length === 0)) return t;
  const i = t.find((w) => w.target === e && w.property === "y"), r = new Ct({ id: `${e}-ride`, tracks: i ? [i] : [] }), a = (w) => i ? Number(r.getStateAtTime(w).values.get(e)?.get("y") ?? 0) : 0, l = (w) => {
    const y = n + a(w);
    return o.findIndex((v) => Math.abs(v.top - y) < 0.5);
  }, c = (i?.keyframes ?? []).map((w) => w.time), h = (w) => {
    const y = (M) => M < 0 ? 0 : o[M].offset(w), v = l(w);
    if (v >= 0) return y(v);
    if (Math.abs(a(w)) < 0.5) return 0;
    const E = (M) => l(M) >= 0 || Math.abs(a(M)) < 0.5, T = [...c].reverse().find((M) => M <= w && E(M)), x = c.find((M) => M >= w && E(M));
    return T === void 0 && x === void 0 ? 0 : T === void 0 ? y(l(x)) : x === void 0 || x === T ? y(l(T)) : y(l(T)) + (y(l(x)) - y(l(T))) * (w - T) / (x - T);
  }, u = o.flatMap((w) => w.windows), d = (w, y) => u.some((v) => v.start < y && v.end > w) || h(w) !== h(y), f = i ? [...i.keyframes] : [{ time: 0, value: 0 }], g = [{ ...f[0], value: f[0].value + h(f[0].time) }], p = (w, y) => {
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
  const k = { id: i?.id ?? `${e}-y`, target: e, property: "y", keyframes: g };
  return i ? t.map((w) => w === i ? k : w) : [...t, k];
}
function In(t) {
  const e = t.indexOf(":");
  return e < 0 ? { kind: t, rest: "" } : { kind: t.slice(0, e), rest: t.slice(e + 1) };
}
function De(t, e, n, s) {
  const o = Object.keys(n.anchors).map((r) => In(r).kind), { kind: i } = In(e);
  return o.includes(i) ? new Error(`${t}: no anchor "${e}"${s ? `: ${s}` : ""} (anchors: ${Object.keys(n.anchors).join(", ")})`) : new Error(`${t}: ${dt("anchor", i, o)} (anchors: ${Object.keys(n.anchors).join(", ")})`);
}
function No(t, e, n) {
  return new Error(`${t}.edit: ${dt("edit", e, Object.keys(n.edits))}`);
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
const Kb = {
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
}, hr = ["wipe", "fly", "blur"], Ks = {
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
}, Xb = 0.9, Ub = 8;
function UM(t) {
  const e = { ...Kb, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, o = (t.lineHeight ?? 1.6) * s, i = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * i, l = Math.max(1, ...n.map((S) => S.length)), c = t.width ?? r * 2 + a + l * i, h = r * 2 + n.length * o, u = t.x + r + a, d = new Set(t.hidden ?? []), f = t.language ?? "plain";
  if (!ur.includes(f)) throw new Error(`codePanel: ${dt("language", f, ur)}`);
  const g = n.map((S) => Zb(S, f).flatMap((C) => Array.from(C.text, () => e[C.kind]))), p = ms(), m = Fo(p), b = [], k = /* @__PURE__ */ new Map(), w = [], y = [], v = (S) => {
    if (!Number.isInteger(S) || S < 1 || S > n.length) throw new Error(`codePanel: no line ${S} (it has ${n.length})`);
  }, E = p.tween, T = p.last, x = (S, C, L, $, R, N = 300) => {
    v(S), E(`line.${S}.${C}`, L, $, R, N);
  }, M = (S, C) => b.filter((L) => L.line < S && L.closed <= C).length, A = wt, I = (S) => t.y + r + (S - 1) * o, P = (S) => Array.isArray(S) ? S : [S], O = (S, C, L) => {
    let $ = -1;
    for (let R = 0; R < L; R++)
      if ($ = n[S - 1].indexOf(C, $ + 1), $ < 0) throw new Error(`codePanel: line ${S} has no ${L > 1 ? `${L}th ` : ""}"${C}"`);
    return $;
  }, _ = {};
  n.forEach((S, C) => {
    const L = C + 1;
    _[`line.${L}.highlight`] = 0, _[`line.${L}.strike`] = 0, _[`line.${L}.wipe`] = 0, _[`line.${L}.reveal`] = d.has(L) ? 0 : 1, _[`line.${L}.shift`] = 0;
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
        return Vb(Object.keys(_));
      },
      actions: Mu
    },
    draw(S, C) {
      const L = C.props ?? {}, $ = (D) => Number(L[D] ?? _[D]), R = r + a, N = (D) => r + (D - 1) * o - $(`line.${D}.shift`) * o;
      S.fillStyle = e.background, Ql(S, 0, 0, c, h, 8), S.fill(), S.font = `${s}px ${e.font}`, S.textBaseline = "middle", S.textAlign = "left";
      const z = (D, q, U, F, G) => {
        const Y = n[D - 1];
        for (let nt = q; nt < U; nt++)
          Y[nt] !== " " && (S.fillStyle = g[D - 1][nt], S.fillText(Y[nt], F + (nt - q) * i, G));
      };
      S.save(), Ql(S, 0, 0, c, h, 8), S.clip(), n.forEach((D, q) => {
        const U = q + 1, F = $(`line.${U}.wipe`);
        if (F >= 1) return;
        const G = N(U), Y = G + o / 2, nt = Math.max(1, D.length) * i, ot = Math.round($(`line.${U}.reveal`) * D.length), it = k.get(U) ?? { style: "wipe", from: "left" };
        S.save(), F > 0 && Gb(S, it, F, { left: R - a, top: G, width: a + nt + i, height: o }, c);
        const rt = $(`line.${U}.highlight`);
        rt > 0 && (S.globalAlpha *= Math.min(1, rt), S.fillStyle = e.highlight, S.fillRect(R - i / 2, G, nt + i, o), S.globalAlpha /= Math.min(1, rt)), a > 0 && ot > 0 && (S.fillStyle = e.gutter, S.textAlign = "right", S.fillText(String(U), R - i, Y), S.textAlign = "left");
        const H = [
          ...w.filter((Q) => Q.line === U).map((Q) => ({ column: Q.column, length: Q.text.length, piece: Q, insert: void 0 })),
          ...y.filter((Q) => Q.line === U).map((Q) => ({ column: Q.column, length: 0, piece: void 0, insert: Q }))
        ].sort((Q, at) => Q.column - at.column || Q.length - at.length);
        let J = 0, tt = R;
        for (const Q of H) {
          z(U, J, Math.min(Q.column, ot), tt, Y), tt += (Q.column - J) * i;
          let at = Q.length, Z = "";
          if (Q.piece) {
            const X = Q.piece.written ?? "", et = $(`piece.${Q.piece.id}.write`);
            X && et > 0 ? (Z = X.slice(0, Math.round(et * X.length)), at = Q.length + (X.length - Q.length) * Math.min(1, et * 2)) : at = Q.length * (1 - $(`piece.${Q.piece.id}.away`));
          } else Q.insert && (at = Q.insert.chars * $(`insert.${Q.insert.id}.open`), Q.insert.text && (Z = Q.insert.text.slice(0, Math.round($(`insert.${Q.insert.id}.type`) * Q.insert.text.length))));
          S.fillStyle = e.text;
          for (let X = 0; X < Z.length; X++) Z[X] !== " " && S.fillText(Z[X], tt + X * i, Y);
          tt += at * i, J = Q.column + Q.length;
        }
        z(U, J, Math.max(J, ot), tt, Y);
        const st = $(`line.${U}.strike`);
        st > 0 && (S.strokeStyle = e.strike, S.lineWidth = Math.max(1.5, s / 10), S.beginPath(), S.moveTo(R, Y), S.lineTo(R + nt * Math.min(1, st), Y), S.stroke()), S.restore();
      });
      for (const D of w) {
        const q = $(`piece.${D.id}.opacity`);
        if (q <= 0 || $(`line.${D.line}.wipe`) >= 1) continue;
        const U = R + (D.column + D.text.length / 2) * i + $(`piece.${D.id}.x`), F = N(D.line) + o / 2 + $(`piece.${D.id}.y`);
        S.save(), S.globalAlpha = Math.min(1, q), S.translate(U, F), S.rotate($(`piece.${D.id}.rotate`) * Math.PI / 180), z(D.line, D.column, D.column + D.text.length, -D.text.length * i / 2, 0), S.restore();
      }
      S.restore();
    }
  }, B = (S) => {
    const { kind: C, rest: L } = In(S), $ = (R) => De("codePanel", S, Ks, R);
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
  }, K = (S, C, L, $ = !1) => {
    const R = Array.isArray(C) ? C : [C];
    if (R.length === 0 || $ && R.length > 1) throw new Error(`codePanel.edit: ${S} takes ${$ ? "one" : "at least one"} ${L} anchor`);
    return R.map((N) => {
      const z = B(N);
      if (z.kind !== L) throw new Error(`codePanel.edit: ${S} takes ${L} anchors (${L}:…), not "${N}"`);
      return z;
    });
  }, V = (S, C) => {
    if (typeof C.text != "string") throw new Error(`codePanel.edit: ${S} needs \`text\` (the text to write)`);
    return C.text;
  }, j = {
    kind: "code",
    about: Ks,
    target: W,
    lines: n,
    box: A(t.x, t.y, c, h),
    line(S, C = 1 / 0) {
      return v(S), A(u, I(S) - M(S, C) * o, Math.max(1, n[S - 1].length) * i, o);
    },
    token(S, C, L = 1, $ = 1 / 0) {
      v(S);
      const R = O(S, C, L);
      return A(u + R * i, I(S) - M(S, $) * o, C.length * i, o);
    },
    highlight(S, C) {
      for (const L of P(S)) {
        const $ = T(`line.${L}.highlight`, 0);
        x(L, "highlight", $, C.on === !1 ? 0 : 1, C, 200);
      }
      return j;
    },
    strike(S, C) {
      for (const L of P(S)) x(L, "strike", T(`line.${L}.strike`, 0), 1, C);
      return j;
    },
    remove(S, C) {
      const L = P(S), $ = C.style ?? "wipe";
      if (!hr.includes($)) throw new Error(`codePanel.remove: ${dt("style", $, hr)}`);
      const R = $ === "wipe" ? 300 : 450, N = C.at + (C.duration ?? R), z = C.close ?? 250;
      for (const D of L)
        x(D, "wipe", 0, 1, { ...C, easing: C.easing ?? ($ === "fly" ? "ease-in" : void 0) }, R), k.set(D, { style: $, from: C.from ?? "left" }), b.push({ line: D, closed: N + z });
      for (let D = 1; D <= n.length; D++) {
        if (L.includes(D)) continue;
        const q = L.filter((F) => F < D).length;
        if (q === 0) continue;
        const U = T(`line.${D}.shift`, 0);
        x(D, "shift", U, U + q, { at: N, duration: z, easing: "ease-in-out" });
      }
      return j;
    },
    type(S, C) {
      return x(S, "reveal", 0, 1, { duration: n[S - 1].length * 45, ...C }), j;
    },
    piece(S, C, L = 1) {
      if (typeof S == "string") {
        const D = B(S);
        if (D.kind !== "token") throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${S}"`);
        return j.piece(D.n, D.text, D.occurrence);
      }
      const $ = S;
      if (C === void 0) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")');
      v($);
      const R = O($, C, L), N = w.find((D) => D.line === $ && D.column === R && D.text === C);
      if (N) return N;
      if (w.some((D) => D.line === $ && R < D.column + D.text.length && D.column < R + C.length))
        throw new Error(`codePanel: "${C}" on line ${$} overlaps another piece`);
      const z = { id: w.length + 1, line: $, column: R, text: C, home: j.token($, C, L, 0) };
      w.push(z);
      for (const D of ["x", "y", "rotate", "write", "away"]) _[`piece.${z.id}.${D}`] = 0;
      return _[`piece.${z.id}.opacity`] = 1, z;
    },
    follow(S, C) {
      return m.follow(S, C), j;
    },
    fling(S, C) {
      return m.fling(S, C), j;
    },
    move(S, C) {
      return m.move(S, C), j;
    },
    write(S, C, L) {
      return S.written = C, E(`piece.${S.id}.write`, 0, 1, { duration: Math.max(1, C.length) * 70, ...L }), j;
    },
    spot(S, C, L = 1, $ = 1 / 0) {
      v(S);
      const R = y.filter((N) => N.line === S && N.column <= C && N.at <= $).reduce((N, z) => N + z.chars, 0);
      return A(u + (C + R) * i, I(S) - M(S, $) * o, L * i, o);
    },
    insert(S, C, L, $) {
      v(S);
      const R = { id: y.length + 1, line: S, column: C, chars: L.length, text: L, at: $.at };
      y.push(R), _[`insert.${R.id}.open`] = 0, _[`insert.${R.id}.type`] = 0;
      const N = $.duration ?? L.length * 70;
      return E(`insert.${R.id}.open`, 0, 1, { at: $.at, duration: N * 0.6, easing: "ease-out" }), E(`insert.${R.id}.type`, 0, 1, { at: $.at, duration: N }), j;
    },
    drop(S, C, L, $) {
      v(C);
      const R = $.duration ?? 250, N = C === S.line, z = $.easing ?? (N ? "linear" : "ease-out"), D = j.landing(S, C, L, $.at), q = { id: y.length + 1, line: C, column: L, chars: S.text.length, at: $.at };
      return y.push(q), _[`insert.${q.id}.open`] = 0, E(`insert.${q.id}.open`, 0, 1, { at: $.at, duration: R, easing: N ? z : "ease-out" }), E(`piece.${S.id}.away`, T(`piece.${S.id}.away`, 0), 1, { at: $.at, duration: R, easing: N ? z : "ease-in-out" }), m.cutAfter(S, $.at), j.move(S, { at: $.at, duration: R, easing: z, to: { x: D.x, y: D.y } }), E(`piece.${S.id}.rotate`, p.valueAt(`piece.${S.id}.rotate`, $.at), 0, { at: $.at, duration: R }), j;
    },
    landing(S, C, L, $ = 1 / 0) {
      const R = j.spot(C, L, S.text.length, $), N = C === S.line && L > S.column ? S.text.length * i : 0;
      return A(R.left - N, R.top, R.width, R.height);
    },
    ride(S, C, L) {
      const $ = n.map((R, N) => {
        const z = p.keys(`line.${N + 1}.shift`) ?? [];
        return { top: I(N + 1), offset: (D) => -ca(z, D) * o, windows: hs(z) };
      });
      return ha(S, C, { ground: L.ground, every: L.every ?? Ne, floors: $ });
    },
    tracks: p.tracks,
    anchor(S, C = 1 / 0) {
      const L = B(S);
      return L.kind === "box" ? j.box : L.kind === "line" ? j.line(L.n, C) : L.kind === "token" ? j.token(L.n, L.text, L.occurrence, C) : j.spot(L.n, L.column, L.width, C);
    },
    edit(S, C, L) {
      const $ = () => K(S, C, "line").map((R) => R.n);
      if (S === "highlight") return j.highlight($(), L);
      if (S === "strike") return j.strike($(), L);
      if (S === "remove") return j.remove($(), L);
      if (S === "type") {
        for (const R of $()) j.type(R, L);
        return j;
      }
      if (S === "insert") {
        const [R] = K(S, C, "spot", !0);
        return j.insert(R.n, R.column, V(S, L), L);
      }
      if (S === "write" || S === "drop" || S === "move" || S === "fling") {
        const [R] = K(S, C, "token", !0), N = j.piece(R.n, R.text, R.occurrence);
        if (S === "write") return j.write(N, V(S, L), L);
        if (S === "fling") return j.fling(N, L);
        if (S === "drop") {
          const D = typeof L.into == "string" ? B(L.into) : void 0;
          if (D?.kind !== "spot") throw new Error("codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)");
          return j.drop(N, D.n, D.column, L);
        }
        const z = typeof L.to == "string" ? j.anchor(L.to, L.at) : L.to;
        if (!z || typeof z.x != "number" || typeof z.y != "number") throw new Error("codePanel.edit: move needs `to`, an anchor name or { x, y }");
        return j.move(N, { ...L, to: z });
      }
      throw No("codePanel", S, Ks);
    }
  };
  return j;
}
function Gb(t, e, n, s, o) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const i = Ub * n;
  if (i > 0.2 && "filter" in t && (t.filter = `blur(${i.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * Xb * o, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
const Mu = {
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
function Vb(t) {
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
function Ql(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
const go = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
go.typescript = [...go.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const ur = Object.keys(go), Jb = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function Zb(t, e) {
  const n = new Set(go[e]), s = Jb[e], o = [], i = (a, l) => {
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
const mi = '"Patrick Hand", "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', Ps = {
  whiteboard: {
    background: "#f7f7f2",
    frame: "#b8bcc4",
    ink: "#1f2a44",
    colors: { ink: "#1f2a44", red: "#d03b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a" },
    font: mi,
    stroke: 0.09,
    opacity: 1
  },
  chalkboard: {
    background: "#2f4a3a",
    frame: "#7a5a3a",
    ink: "#f1f1e8",
    colors: { ink: "#f1f1e8", red: "#f2a3a3", blue: "#a8c8f0", green: "#b7e4a8", orange: "#f5c98a", yellow: "#f6ef9a" },
    font: mi,
    stroke: 0.1,
    opacity: 0.9
  },
  lines: {
    background: "#fffdf5",
    frame: "#d9d3c0",
    ink: "#24315c",
    colors: { ink: "#24315c", red: "#c73b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a", pencil: "#6b6b6b" },
    font: mi,
    stroke: 0.08,
    opacity: 1,
    rule: { color: "#c9d6ec", spacing: 1.55, margin: "#f0a3a3" }
  }
}, tc = ["circle", "box", "underline", "arrow"], ke = {
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
}, ec = 90, nc = 300, Qb = 0.3;
function GM(t) {
  const e = typeof t.theme == "string" ? t.theme : "whiteboard";
  if (!(e in Ps)) throw new Error(`whiteboard: ${dt("theme", e, Object.keys(Ps))}`);
  const n = typeof t.theme == "object" ? { ...Ps.whiteboard, ...t.theme } : Ps[e], s = t.fontSize ?? 28, o = t.charWidth ?? 0.55, i = (y) => y === void 0 ? n.ink : n.colors[y] ?? y, r = (y) => wt(t.x + y.left, t.y + y.top, y.width, y.height), a = ms(), l = Fo(a), c = {}, h = /* @__PURE__ */ new Map(), u = [], d = [], f = (y, v, E, T) => {
    const x = h.get(y);
    if (!x || x.kind !== "text") throw De("whiteboard", T, ke, `there is no text "${y}" (texts: ${g().join(", ") || "none"})`);
    let M = -1;
    for (let I = 0; I < E; I++)
      if (M = x.item.text.indexOf(v, M + 1), M < 0) throw De("whiteboard", T, ke, `text "${y}" has no ${E > 1 ? `${E}th ` : ""}"${v}"`);
    const A = x.size * o;
    return { column: M, box: wt(x.box.left + M * A, x.box.top, v.length * A, x.box.height) };
  }, g = () => [...h.values()].filter((y) => y.kind === "text").map((y) => y.item.id), p = (y) => {
    const { kind: v, rest: E } = In(y), T = (x) => De("whiteboard", y, ke, x);
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
    if (v.kind === "box") return wt(0, 0, t.width, t.height);
    if (v.kind === "term") return f(v.id, v.text, v.occurrence, y).box;
    const E = h.get(v.id);
    if (!E || E.kind !== v.kind) {
      const T = [...h.values()].filter((x) => x.kind === v.kind).map((x) => x.item.id);
      throw De("whiteboard", y, ke, `there is no ${v.kind} "${v.id}" (${v.kind}s: ${T.join(", ") || "none"})`);
    }
    return E.box;
  };
  for (const y of t.items ?? []) {
    if (!y || typeof y.id != "string" || !y.id || /[:#]/.test(y.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(y?.id)})`);
    if (h.has(y.id)) throw new Error(`whiteboard: two items are called "${y.id}"`);
    if ("text" in y) {
      if (!Array.isArray(y.at) || y.at.length !== 2 || !y.at.every((I) => typeof I == "number")) throw new Error(`whiteboard: text "${y.id}" needs \`at\`, [x, y] from the board's top-left`);
      const M = y.size ?? s, A = wt(y.at[0], y.at[1], Math.max(1, y.text.length) * M * o, M * 1.3);
      h.set(y.id, { kind: "text", item: y, size: M, color: i(y.color), box: A }), c[`text.${y.id}.write`] = y.hidden ? 0 : 1, c[`text.${y.id}.erase`] = 0;
      continue;
    }
    if (!tc.includes(y.mark)) throw new Error(`whiteboard: mark "${y.id}": ${dt("mark", y.mark, tc)}`);
    const v = y.mark === "arrow" ? ["from", "to"] : ["around"];
    for (const M of v) if (typeof y[M] != "string") throw new Error(`whiteboard: ${y.mark} "${y.id}" needs \`${M}\`, a place on the board (an item before it)`);
    const E = new Set([y.from, y.to].filter((M) => typeof M == "string").map((M) => M.split(":")[1])), T = y.mark === "arrow" ? [...h.values()].filter((M) => M.kind === "text" && !E.has(M.item.id)).map((M) => M.box) : [], x = tw(y, m, s, T);
    h.set(y.id, { kind: "mark", item: y, color: i(y.color), points: x, box: sw(x) }), c[`mark.${y.id}.draw`] = y.hidden ? 0 : 1, c[`mark.${y.id}.erase`] = 0;
  }
  const b = (y) => u.filter((v) => v.item === y), k = {
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
        return ow(Object.keys(c));
      },
      actions: ke.edits
    },
    draw(y, v) {
      const E = v.props ?? {}, T = (x) => Number(E[x] ?? c[x] ?? 0);
      if (y.save(), y.fillStyle = n.background, ic(y, 0, 0, t.width, t.height, 10), y.fill(), y.lineWidth = Math.max(4, t.width * 0.012), y.strokeStyle = n.frame, y.stroke(), n.rule) {
        y.save(), y.beginPath(), ic(y, 0, 0, t.width, t.height, 10), y.clip(), y.lineWidth = 1, y.strokeStyle = n.rule.color;
        const x = s * (n.rule.spacing ?? 1.55);
        for (let M = x; M < t.height; M += x)
          y.beginPath(), y.moveTo(0, M), y.lineTo(t.width, M), y.stroke();
        n.rule.margin && (y.strokeStyle = n.rule.margin, y.beginPath(), y.moveTo(s * 2.2, 0), y.lineTo(s * 2.2, t.height), y.stroke()), y.restore();
      }
      y.textAlign = "center", y.textBaseline = "middle", y.lineCap = "round", y.lineJoin = "round", y.globalAlpha = n.opacity;
      for (const x of h.values()) {
        if (y.save(), yi(y, x.box, T(`${x.kind}.${x.item.id}.erase`)), x.kind === "text") {
          const M = b(x.item.id), A = T(`text.${x.item.id}.write`) * x.item.text.length;
          y.font = `${x.size}px ${n.font}`, y.fillStyle = x.color;
          for (let I = 0; I < Math.ceil(A); I++)
            x.item.text[I] === " " || M.some((P) => I >= P.column && I < P.column + P.text.length) || (y.globalAlpha = n.opacity * Math.min(1, A - I), y.fillText(x.item.text[I], x.box.left + (I + 0.5) * x.size * o, x.box.y));
        } else
          oc(y, x.points, T(`mark.${x.item.id}.draw`), x.color, s * n.stroke, x.item.mark === "arrow");
        y.restore();
      }
      for (const x of d) {
        const M = T(`strike.${x.id}.draw`);
        if (M <= 0) continue;
        const { box: A } = x, I = A.height * 0.15;
        oc(y, [{ x: A.left - 3, y: A.y + I }, { x: A.right + 3, y: A.y - I }], M, n.colors.red ?? n.ink, s * n.stroke * 0.8, !1);
      }
      for (const x of u) {
        const M = h.get(x.item), A = M.size * o;
        y.font = `${M.size}px ${n.font}`, y.fillStyle = M.color;
        const I = x.written;
        if (I) {
          const W = T(`piece.${x.id}.write`) * I.length, B = x.home.x - t.x - I.length * A / 2;
          for (let K = 0; K < Math.ceil(W); K++)
            I[K] !== " " && (y.globalAlpha = n.opacity * Math.min(1, W - K), y.fillText(I[K], B + (K + 0.5) * A, x.home.y - t.y));
        }
        const P = T(`piece.${x.id}.opacity`) * Math.min(1, T(`text.${x.item}.write`) * M.item.text.length - x.column);
        if (P <= 0) continue;
        y.save();
        const O = { x: x.home.x - t.x, y: x.home.y - t.y }, _ = { x: T(`piece.${x.id}.x`), y: T(`piece.${x.id}.y`) };
        yi(y, wt(O.x + _.x - x.home.width / 2, O.y + _.y - x.home.height / 2, x.home.width, x.home.height), T(`piece.${x.id}.erase`)), Math.hypot(_.x, _.y) < 1 && yi(y, M.box, T(`text.${x.item}.erase`)), y.globalAlpha = n.opacity * Math.min(1, P), y.translate(O.x + _.x, O.y + _.y), y.rotate(T(`piece.${x.id}.rotate`) * Math.PI / 180);
        for (let W = 0; W < x.text.length; W++) x.text[W] !== " " && y.fillText(x.text[W], (W + 0.5 - x.text.length / 2) * A, 0);
        y.restore();
      }
      y.restore();
    }
  }, w = {
    kind: "board",
    about: ke,
    target: k,
    box: wt(t.x, t.y, t.width, t.height),
    anchor(y) {
      return r(m(y));
    },
    piece(y) {
      const v = p(y);
      if (v.kind !== "term") throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${y}"`);
      const { column: E, box: T } = f(v.id, v.text, v.occurrence, y), x = u.find((A) => A.item === v.id && A.column === E && A.text === v.text);
      if (x) return x;
      if (u.some((A) => A.item === v.id && E < A.column + A.text.length && A.column < E + v.text.length))
        throw new Error(`whiteboard: "${v.text}" in "${v.id}" overlaps another piece`);
      const M = { id: u.length + 1, item: v.id, column: E, text: v.text, home: r(T) };
      u.push(M);
      for (const A of ["x", "y", "rotate", "erase", "write"]) c[`piece.${M.id}.${A}`] = 0;
      return c[`piece.${M.id}.opacity`] = 1, M;
    },
    edit(y, v, E) {
      const T = Array.isArray(v) ? v : [v];
      if (T.length === 0) throw new Error(`whiteboard.edit: ${y} takes at least one anchor`);
      const x = T.map((I) => ({ name: I, anchor: p(I) }));
      for (const { name: I } of x) m(I);
      const M = (I, P = !1) => {
        const O = x.find((_) => !I.includes(_.anchor.kind));
        if (O) throw new Error(`whiteboard.edit: ${y} takes ${I.join(" or ")} anchors, not "${O.name}"`);
        if (P && x.length > 1) throw new Error(`whiteboard.edit: ${y} takes one ${I.join(" or ")} anchor`);
      }, A = () => w.piece(x[0].name);
      if (y === "write") {
        if (x.some((I) => I.anchor.kind === "term")) {
          if (M(["term"], !0), typeof E.text != "string") throw new Error("whiteboard.edit: write into a term needs `text` (the new text)");
          const I = A();
          return I.written = E.text, a.tween(`piece.${I.id}.write`, 0, 1, { duration: Math.max(nc, E.text.length * ec), ...E }), w;
        }
        M(["text"]);
        for (const { anchor: I } of x) {
          const P = I.id, O = h.get(P).item.text;
          a.tween(`text.${P}.write`, 0, 1, { duration: Math.max(nc, O.length * ec), ...E });
        }
        return w;
      }
      if (y === "draw") {
        M(["mark"]);
        for (const { anchor: I } of x) a.tween(`mark.${I.id}.draw`, 0, 1, { duration: 500, ...E });
        return w;
      }
      if (y === "erase") {
        M(["text", "term", "mark"]);
        for (const I of x) {
          const P = I.anchor.kind === "term" ? `piece.${w.piece(I.name).id}.erase` : `${I.anchor.kind}.${I.anchor.id}.erase`;
          a.tween(P, 0, 1, { duration: 400, ...E });
        }
        return w;
      }
      if (y === "strike") {
        M(["text", "term"]);
        for (const I of x) {
          const P = { id: d.length + 1, box: m(I.name) };
          d.push(P), c[`strike.${P.id}.draw`] = 0, a.tween(`strike.${P.id}.draw`, 0, 1, { duration: 250, ...E });
        }
        return w;
      }
      if (y === "move") {
        M(["term"], !0);
        const I = typeof E.to == "string" ? w.anchor(E.to) : E.to;
        if (!I || typeof I.x != "number" || typeof I.y != "number") throw new Error("whiteboard.edit: move needs `to`, an anchor name or { x, y }");
        return w.move(A(), { ...E, to: I });
      }
      if (y === "fling")
        return M(["term"], !0), w.fling(A(), E);
      throw No("whiteboard", y, ke);
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
function tw(t, e, n, s = []) {
  const o = Ve(Zt(t.id)), i = (p) => (o.next() * 2 - 1) * p, r = n * Qb;
  if (t.mark === "arrow") {
    const p = e(t.from), m = e(t.to), b = sc(p, m, r * 0.6), k = sc(m, p, r * 0.6), w = Math.hypot(k.x - b.x, k.y - b.y), y = nw(b, k);
    let v = w * (0.06 + i(0.04));
    if (t.bend !== void 0) v = w * t.bend;
    else {
      const x = ew(b, k, y, s, r);
      x !== 0 && (v = x);
    }
    const E = { x: (b.x + k.x) / 2 + y.x * v, y: (b.y + k.y) / 2 + y.y * v }, T = [];
    for (let x = 0; x <= 24; x++) {
      const M = x / 24;
      T.push({ x: (1 - M) ** 2 * b.x + 2 * (1 - M) * M * E.x + M * M * k.x, y: (1 - M) ** 2 * b.y + 2 * (1 - M) * M * E.y + M * M * k.y });
    }
    return T;
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
    const p = a.left - r, m = a.right + r, b = a.top - r * 0.6, k = a.bottom + r * 0.6, w = (v, E) => ({ x: v + i(r * 0.2), y: E + i(r * 0.2) }), y = w(p, b);
    return [y, w(m, b), w(m, k), w(p, k), y, { x: y.x + r * 0.8, y: y.y + i(2) }];
  }
  const l = a.width / 2 + r, c = a.height / 2 + r * 0.6, h = -2.2 + i(0.3), u = o.next() * Math.PI * 2, d = 1.12, f = 64, g = [];
  for (let p = 0; p <= f * d; p++) {
    const m = p / f, b = h + m * Math.PI * 2, k = 1 + 0.035 * Math.sin(m * Math.PI * 4 + u) + 0.06 * m;
    g.push({ x: a.x + Math.cos(b) * l * k, y: a.y + Math.sin(b) * c * k });
  }
  return g;
}
function ew(t, e, n, s, o) {
  const i = Math.hypot(e.x - t.x, e.y - t.y);
  if (i < 1e-6) return 0;
  const r = { x: (e.x - t.x) / i, y: (e.y - t.y) / i };
  let a = 0, l = 0;
  for (const c of s) {
    const u = [
      { x: c.left, y: c.top },
      { x: c.right, y: c.top },
      { x: c.right, y: c.bottom },
      { x: c.left, y: c.bottom }
    ].map((g) => ({ t: (g.x - t.x) * r.x + (g.y - t.y) * r.y, n: (g.x - t.x) * n.x + (g.y - t.y) * n.y })), d = u.some((g) => g.t > 0 && g.t < i), f = u.some((g) => g.n > 0) && u.some((g) => g.n < 0);
    !d || !f || (a = Math.max(a, ...u.map((g) => g.n)), l = Math.min(l, ...u.map((g) => g.n)));
  }
  return a === 0 && l === 0 ? 0 : a <= -l ? 2 * (a + o) : 2 * (l - o);
}
function sc(t, e, n) {
  const s = e.x - t.x, o = e.y - t.y;
  if (s === 0 && o === 0) return { x: t.x, y: t.y };
  const i = Math.min(s === 0 ? 1 / 0 : (t.width / 2 + n) / Math.abs(s), o === 0 ? 1 / 0 : (t.height / 2 + n) / Math.abs(o));
  return { x: t.x + s * i, y: t.y + o * i };
}
function nw(t, e) {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: -(e.y - t.y) / n, y: (e.x - t.x) / n };
}
function sw(t) {
  const e = t.map((i) => i.x), n = t.map((i) => i.y), s = Math.min(...e), o = Math.min(...n);
  return wt(s, o, Math.max(...e) - s, Math.max(...n) - o);
}
function oc(t, e, n, s, o, i) {
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
  const c = (n - 0.85) / 0.15, h = e[e.length - 1], u = e[e.length - 3] ?? e[0], d = Math.atan2(h.y - u.y, h.x - u.x), f = o * 4.5 * c;
  t.beginPath();
  for (const g of [-1, 1])
    t.moveTo(h.x, h.y), t.lineTo(h.x - Math.cos(d + g * 0.45) * f, h.y - Math.sin(d + g * 0.45) * f);
  t.stroke();
}
function yi(t, e, n) {
  if (n <= 0) return;
  const s = 8;
  t.beginPath(), t.rect(e.left - s + n * (e.width + s * 2), e.top - s * 4, (1 - n) * (e.width + s * 2), e.height + s * 8), t.clip();
}
function ic(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function ow(t) {
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
const rc = ["bar", "line", "pie", "donut"], ac = 'system-ui, -apple-system, "Segoe UI", sans-serif', Is = {
  light: {
    background: "#ffffff",
    text: "#3b4252",
    grid: "#d8dee9",
    color: "#4c7bd9",
    highlight: "#e8833a",
    palette: ["#4c7bd9", "#3fa66b", "#b05cc9", "#d9c04c", "#4cb8c4", "#d95c6f", "#8a7a5a", "#6b7a99"],
    font: ac
  },
  dark: {
    background: "#1e2230",
    text: "#cdd6f4",
    grid: "#3a4055",
    color: "#89b4fa",
    highlight: "#fab387",
    palette: ["#89b4fa", "#a6e3a1", "#cba6f7", "#f9e2af", "#94e2d5", "#f38ba8", "#b4a58a", "#9399b2"],
    font: ac
  }
}, gn = {
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
}, iw = 600, rw = 500, aw = 200, lw = 400, cw = 0.14, hw = Math.PI * 2;
function VM(t) {
  if (!rc.includes(t.kind)) throw new Error(`chart: ${dt("kind", t.kind, rc)}`);
  const e = typeof t.theme == "string" ? t.theme : "light";
  if (!(e in Is)) throw new Error(`chart: ${dt("theme", e, Object.keys(Is))}`);
  const n = typeof t.theme == "object" ? { ...Is.light, ...t.theme } : Is[e];
  if (!Array.isArray(t.data) || t.data.length === 0) throw new Error("chart: `data` needs at least one { id, value }");
  const s = t.kind, o = s === "pie" || s === "donut", i = Array.isArray(t.series) && t.series.length > 1, r = Array.isArray(t.series) && t.series.length > 0 ? t.series : [{ id: "value" }];
  if (o && i) throw new Error(`chart: a ${s} shows one series (got ${r.length}); make a chart per series`);
  const a = /* @__PURE__ */ new Set();
  for (const H of r) {
    if (typeof H?.id != "string" || !H.id || /[:.]/.test(H.id)) throw new Error(`chart: every series needs an \`id\` without ":" or "." (got ${JSON.stringify(H?.id)})`);
    if (a.has(H.id)) throw new Error(`chart: two series are called "${H.id}"`);
    a.add(H.id);
  }
  const l = new Map(r.map((H, J) => [H.id, J])), c = (H) => r[l.get(H)].color ?? (l.get(H) === 0 ? n.color : n.palette[l.get(H) % n.palette.length]), h = /* @__PURE__ */ new Set(), u = (H, J) => {
    const tt = H.values?.[J.id] ?? (t.series ? void 0 : H.value) ?? H.value;
    if (typeof tt != "number" || !Number.isFinite(tt))
      throw new Error(i ? `chart: "${H.id}" needs a value for series "${J.id}" (\`values: { ${J.id}: … }\`)` : `chart: "${H.id}" needs a \`value\`, a number`);
    return tt;
  };
  for (const H of t.data) {
    if (typeof H?.id != "string" || !H.id || /[:.]/.test(H.id)) throw new Error(`chart: every datum needs an \`id\` without ":" or "." (got ${JSON.stringify(H?.id)})`);
    if (h.has(H.id)) throw new Error(`chart: two data are called "${H.id}"`);
    for (const J of r) u(H, J);
    h.add(H.id);
  }
  const d = s === "bar" ? "bar" : s === "line" ? "point" : "slice", f = Math.max(...t.data.flatMap((H) => r.map((J) => u(H, J)))), g = o ? t.data.reduce((H, J) => H + u(J, r[0]), 0) : t.max ?? uw(f * 1.1);
  if (!o && !(g > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${g})`);
  const p = Math.max(10, Math.min(16, t.height / 20)), m = i && t.legend !== !1, b = o ? void 0 : t.axis?.x, k = o ? void 0 : t.axis?.y, w = t.title ? p * 2.3 : p * 0.5, y = {
    left: p * 3.6 + (k ? p * 1.5 : 0),
    right: t.width - p,
    top: (t.title ? p * 3 : p * 1.6) + (m ? p * 1.6 : 0),
    bottom: t.height - p * 2.4 - (b ? p * 1.4 : 0)
  }, v = y.bottom - y.top, E = (y.right - y.left) / t.data.length, T = i ? E * 0.72 / r.length : E * 0.6, x = i ? T * 0.86 : T, M = Math.max(4, p * 0.35), A = v / g, I = new Map(t.data.map((H, J) => [H.id, J])), P = (H) => y.left + E * (I.get(H) + 0.5), O = (H, J) => i ? P(H) - E * 0.36 + T * l.get(J) + (T - x) / 2 : P(H) - x / 2, _ = (H, J) => O(H, J) + x / 2, W = t.height - p * 1.2, B = {
    cx: t.width / 2,
    cy: (y.top + W) / 2,
    r: Math.max(10, Math.min(t.width / 2, (W - y.top) / 2) - p * 2.6)
  }, K = s === "donut" ? B.r * 0.55 : 0, V = s === "donut" ? (K + B.r) / 2 : B.r * 0.62, j = /* @__PURE__ */ new Map();
  if (m) {
    let H = y.right;
    for (const J of [...r].reverse()) {
      const tt = J.label ?? J.id, st = p * 0.62 * tt.length + p * 1.9;
      j.set(J.id, wt(H - st, w, st, p * 1.4)), H -= st + p * 0.6;
    }
  }
  const S = ms(), C = Fo(S), L = {}, $ = (H, J, tt) => i ? `${d}.${H}.${J}.${tt}` : `${d}.${H}.${tt}`;
  for (const H of t.data)
    for (const J of r)
      L[$(H.id, J.id, "value")] = u(H, J), L[$(H.id, J.id, "show")] = H.hidden ? 0 : 1, L[$(H.id, J.id, "highlight")] = 0, o && (L[$(H.id, J.id, "pull")] = 0);
  const R = (H, J) => S.keys(H)?.length ? ca(S.keys(H), J) : L[H], N = (H, J, tt) => R($(H, J, "value"), tt) * (s === "bar" ? R($(H, J, "show"), tt) : 1) * A, z = (H) => {
    const J = r[0].id, tt = t.data.map((Z) => Math.max(0, H($(Z.id, J, "value"))) * Math.max(0, Math.min(1, H($(Z.id, J, "show"))))), st = tt.reduce((Z, X) => Z + X, 0), Q = /* @__PURE__ */ new Map();
    let at = -Math.PI / 2;
    return t.data.forEach((Z, X) => {
      const et = st > 0 ? hw * tt[X] / st : 0, ct = at + et / 2, ht = Math.max(0, Math.min(1, H($(Z.id, J, "pull")))) * B.r * cw;
      Q.set(Z.id, {
        start: at,
        sweep: et,
        mid: ct,
        out: ht,
        centre: { x: B.cx + Math.cos(ct) * (V + ht), y: B.cy + Math.sin(ct) * (V + ht) }
      }), at += et;
    }), Q;
  }, D = (H) => z((J) => R(J, H)), q = (H) => {
    const { kind: J, rest: tt } = In(H), st = (Q) => De("chart", H, gn, Q);
    if (J === "box") {
      if (tt) throw st("box takes no arguments");
      return { kind: "box" };
    }
    if (J === "legend") {
      if (!j.has(tt)) throw st(m ? `there is no series "${tt}" (series: ${r.map((Q) => Q.id).join(", ")})` : "only a chart with several series has a legend");
      return { kind: "legend", series: tt };
    }
    if (J === "bar" || J === "point" || J === "slice" || J === "label" || J === "value") {
      if (!tt) throw st(`write it ${J}:ID`);
      const Q = tt.indexOf(":"), at = Q < 0 ? tt : tt.slice(0, Q), Z = Q < 0 ? r[0].id : tt.slice(Q + 1);
      if (!I.has(at)) throw st(`there is no "${at}" (data: ${[...I.keys()].join(", ")})`);
      if (!a.has(Z)) throw st(`there is no series "${Z}" (series: ${r.map((X) => X.id).join(", ")})`);
      if (J === "label" && Q >= 0) throw st("a label is one per datum: label:ID");
      if ((J === "bar" || J === "point" || J === "slice") && J !== d) throw st(`a ${s} chart has ${d}s, not ${J}s: ${d}:${at}`);
      return { kind: J, id: at, series: Z };
    }
    throw st();
  }, U = (H, J) => {
    if (H.kind === "box") return wt(0, 0, t.width, t.height);
    if (H.kind === "legend") return j.get(H.series);
    if (o) {
      const Z = D(J).get(H.id), X = Math.max(p * 1.5, B.r * 0.42);
      if (H.kind === "slice") return wt(Z.centre.x - X / 2, Z.centre.y - X / 2, X, X);
      const et = F(Z);
      return H.kind === "label" ? et : Z.sweep >= 0.3 ? wt(Z.centre.x - p * 1.6, Z.centre.y - p * 0.65, p * 3.2, p * 1.3) : wt(et.left, et.bottom, et.width, p * 1.3);
    }
    const tt = H.kind === "label" ? P(H.id) : _(H.id, H.series), st = y.bottom - N(H.id, H.series, J);
    if (H.kind === "bar") return wt(tt - x / 2, st, x, y.bottom - st);
    if (H.kind === "point") return wt(P(H.id) - M, st - M, M * 2, M * 2);
    if (H.kind === "label") return wt(tt - E / 2, y.bottom + p * 0.4, E, p * 1.4);
    const Q = st - (s === "line" ? M : 0) - p * 0.3, at = i && s === "bar" ? T : E;
    return wt((s === "line" ? P(H.id) : tt) - at / 2, Q - p * 1.3, at, p * 1.3);
  }, F = (H) => {
    const J = B.r + H.out + p * 0.9, tt = { x: B.cx + Math.cos(H.mid) * J, y: B.cy + Math.sin(H.mid) * J }, st = p * 4.2, Q = Math.cos(H.mid), at = Q > 0.2 ? tt.x : Q < -0.2 ? tt.x - st : tt.x - st / 2;
    return wt(at, tt.y - p * 0.7, st, p * 1.4);
  }, G = (H) => wt(t.x + H.left, t.y + H.top, H.width, H.height), Y = (H) => `${t.prefix ?? ""}${H.toFixed(t.decimals ?? 0)}${t.suffix ?? ""}`, nt = /* @__PURE__ */ new Map(), ot = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: L,
    about: {
      kind: `${s} chart`,
      summary: `A ${s} chart of ${t.data.length} values (${t.data.map((H) => H.id).join(", ")})${i ? ` in ${r.length} series (${r.map((H) => H.id).join(", ")})` : ""}${o ? "" : `, scaled to ${g}`}. Its ${d}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(L).map((H) => [H, pw(H)])),
      actions: gn.edits
    },
    draw(H, J) {
      const tt = J.props ?? {}, st = (Z) => Number(tt[Z] ?? L[Z] ?? 0);
      if (H.save(), H.fillStyle = n.background, lc(H, 0, 0, t.width, t.height, 8), H.fill(), H.font = `${p}px ${n.font}`, H.textBaseline = "middle", t.title && (H.fillStyle = n.text, H.textAlign = "left", H.font = `600 ${p * 1.2}px ${n.font}`, H.fillText(t.title, o ? p : y.left, p * 1.5), H.font = `${p}px ${n.font}`), m) {
        H.textAlign = "left";
        for (const Z of r) {
          const X = j.get(Z.id);
          H.fillStyle = c(Z.id), lc(H, X.left, X.top + p * 0.25, p * 0.9, p * 0.9, 2), H.fill(), H.fillStyle = n.text, H.fillText(Z.label ?? Z.id, X.left + p * 1.3, X.top + X.height / 2);
        }
      }
      if (o) {
        it(H, st), H.restore();
        return;
      }
      H.lineWidth = 1, H.textAlign = "right";
      for (let Z = 0; Z <= 4; Z++) {
        const X = y.bottom - v * Z / 4;
        H.strokeStyle = n.grid, H.beginPath(), H.moveTo(y.left, X), H.lineTo(y.right, X), H.stroke(), H.fillStyle = n.text, H.globalAlpha = 0.7, H.fillText(dw(g * Z / 4), y.left - p * 0.5, X), H.globalAlpha = 1;
      }
      (k || b) && (H.fillStyle = n.text, H.textAlign = "center", H.globalAlpha = 0.85, k && (H.save(), H.translate(p * 0.9, (y.top + y.bottom) / 2), H.rotate(-Math.PI / 2), H.fillText(k, 0, 0), H.restore()), b && H.fillText(b, (y.left + y.right) / 2, y.bottom + p * 2.3), H.globalAlpha = 1);
      const Q = (Z, X) => st($(Z, X, "value")) * (s === "bar" ? st($(Z, X, "show")) : 1) * A, at = (Z, X) => bi(c(X), n.highlight, st($(Z, X, "highlight")));
      if (s === "line") {
        H.lineWidth = Math.max(2, p * 0.2), H.lineJoin = "round", H.lineCap = "round";
        for (const Z of r)
          H.strokeStyle = c(Z.id), H.beginPath(), t.data.forEach((X, et) => {
            const ct = { x: P(X.id), y: y.bottom - Q(X.id, Z.id) }, ht = st($(X.id, Z.id, "show"));
            if (et === 0) {
              ht > 0 && H.moveTo(ct.x, ct.y);
              return;
            }
            const yt = t.data[et - 1];
            if (st($(yt.id, Z.id, "show")) < 1 || ht <= 0) return;
            const gt = { x: P(yt.id), y: y.bottom - Q(yt.id, Z.id) };
            H.lineTo(gt.x + (ct.x - gt.x) * ht, gt.y + (ct.y - gt.y) * ht);
          }), H.stroke();
      }
      H.textAlign = "center";
      for (const Z of t.data) {
        for (const X of r) {
          const et = s === "bar" ? _(Z.id, X.id) : P(Z.id), ct = Q(Z.id, X.id), ht = st($(Z.id, X.id, "show"));
          if (H.fillStyle = at(Z.id, X.id), s === "bar" ? ct > 0.5 && (fw(H, et - x / 2, y.bottom - ct, x, ct, Math.min(6, x / 4)), H.fill()) : ht > 0 && (H.beginPath(), H.arc(et, y.bottom - ct, M * Math.min(1, ht * 1.5) * (1 + 0.3 * st($(Z.id, X.id, "highlight"))), 0, Math.PI * 2), H.fill()), t.values !== !1 && ht > 0) {
            H.globalAlpha = Math.min(1, ht * 2), H.font = `600 ${i ? p * 0.85 : p}px ${n.font}`, H.fillStyle = bi(n.text, n.highlight, st($(Z.id, X.id, "highlight")));
            const yt = y.bottom - ct - (s === "line" ? M : 0) - p * 0.95;
            H.fillText(Y(st($(Z.id, X.id, "value"))), et, yt), H.font = `${p}px ${n.font}`, H.globalAlpha = 1;
          }
        }
        H.fillStyle = n.text, H.fillText(Z.label ?? Z.id, P(Z.id), y.bottom + p * 1.1);
      }
      H.strokeStyle = n.text, H.lineWidth = 1.5, H.beginPath(), H.moveTo(y.left, y.bottom), H.lineTo(y.right, y.bottom), H.stroke(), H.restore();
    }
  };
  function it(H, J) {
    const tt = r[0].id, st = z(J);
    t.data.forEach((Q, at) => {
      const Z = st.get(Q.id);
      if (Z.sweep <= 1e-4) return;
      const X = nt.get(Q.id), et = X ? { x: J(`piece.${X.id}.x`), y: J(`piece.${X.id}.y`) } : { x: 0, y: 0 }, ct = X ? J(`piece.${X.id}.rotate`) * Math.PI / 180 : 0, ht = X ? J(`piece.${X.id}.opacity`) : 1;
      if (ht <= 0) return;
      H.save(), H.globalAlpha = ht;
      const yt = { x: B.cx + Math.cos(Z.mid) * Z.out, y: B.cy + Math.sin(Z.mid) * Z.out };
      H.translate(Z.centre.x + et.x, Z.centre.y + et.y), H.rotate(ct), H.translate(-Z.centre.x, -Z.centre.y), H.beginPath(), H.arc(yt.x, yt.y, B.r, Z.start, Z.start + Z.sweep), K > 0 ? H.arc(yt.x, yt.y, K, Z.start + Z.sweep, Z.start, !0) : H.lineTo(yt.x, yt.y), H.closePath(), H.fillStyle = bi(n.palette[at % n.palette.length], n.highlight, J($(Q.id, tt, "highlight"))), H.fill(), H.strokeStyle = n.background, H.lineWidth = Math.max(1.5, p * 0.15), H.stroke(), t.values !== !1 && Z.sweep >= 0.3 && (H.fillStyle = n.background, H.font = `600 ${p}px ${n.font}`, H.textAlign = "center", H.fillText(Y(J($(Q.id, tt, "value"))), Z.centre.x, Z.centre.y), H.font = `${p}px ${n.font}`), H.restore();
      const gt = F(Z), Kt = Math.cos(Z.mid);
      H.globalAlpha = ht, H.fillStyle = n.text, H.textAlign = Kt > 0.2 ? "left" : Kt < -0.2 ? "right" : "center";
      const _n = Kt > 0.2 ? gt.left : Kt < -0.2 ? gt.right : gt.left + gt.width / 2;
      H.fillText(Q.label ?? Q.id, _n, gt.top + gt.height / 2), t.values !== !1 && Z.sweep < 0.3 && (H.globalAlpha = ht * 0.8, H.fillText(Y(J($(Q.id, tt, "value"))), _n, gt.bottom + p * 0.65)), H.globalAlpha = 1;
    });
  }
  const rt = {
    kind: "chart",
    chartKind: s,
    about: gn,
    target: ot,
    max: g,
    box: wt(t.x, t.y, t.width, t.height),
    anchor(H, J = 1 / 0) {
      return G(U(q(H), J));
    },
    piece(H) {
      const J = q(H);
      if (J.kind !== "slice")
        throw new Error(o ? `chart: a piece is a slice, slice:ID, not "${H}"` : `chart: a ${d} is not a piece; slices of a pie or donut are (slice:ID). Change a ${d} with edit('set' | 'show' | 'highlight', …)`);
      const tt = nt.get(J.id);
      if (tt) return tt;
      const st = { id: nt.size + 1, datum: J.id, home: G(U(J, 0)) };
      nt.set(J.id, st);
      for (const Q of ["x", "y", "rotate"]) L[`piece.${st.id}.${Q}`] = 0;
      return L[`piece.${st.id}.opacity`] = 1, st;
    },
    edit(H, J, tt) {
      const st = Array.isArray(J) ? J : [J];
      if (st.length === 0) throw new Error(`chart.edit: ${H} takes at least one anchor`);
      if (!(H in gn.edits)) throw No("chart", H, gn);
      if (H === "pull" && !o) throw new Error(`chart.edit: pull takes slice anchors of a pie or donut; a ${s} chart has ${d}s`);
      const Q = st.map((at) => {
        const Z = q(at);
        if (Z.kind !== d) throw new Error(`chart.edit: ${H} takes ${d} anchors (${d}:ID), not "${at}"`);
        return Z;
      });
      for (const { id: at, series: Z } of Q) {
        const X = (et) => $(at, Z, et);
        if (H === "set") {
          if (typeof tt.value != "number" || !Number.isFinite(tt.value)) throw new Error("chart.edit: set needs `value`, a number");
          S.tween(X("value"), R(X("value"), tt.at), tt.value, tt, iw);
        } else H === "show" ? S.tween(X("show"), R(X("show"), tt.at), tt.on === !1 ? 0 : 1, tt, rw) : H === "pull" ? S.tween(X("pull"), R(X("pull"), tt.at), tt.on === !1 ? 0 : 1, tt, lw) : S.tween(X("highlight"), R(X("highlight"), tt.at), tt.on === !1 ? 0 : 1, tt, aw);
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
          const Z = N(Q.id, at.id, 0), X = [...hs(S.keys($(Q.id, at.id, "value"))), ...hs(S.keys($(Q.id, at.id, "show")))];
          return { top: t.y + y.bottom - Z, offset: (et) => Z - N(Q.id, at.id, et), windows: X };
        })
      );
      return ha(H, J, { ground: tt.ground, every: tt.every ?? Ne, floors: st });
    },
    tracks: S.tracks
  };
  return rt;
}
function uw(t) {
  if (!(t > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(t));
  for (const n of [1, 2, 2.5, 5, 10]) if (n * e >= t - 1e-9) return n * e;
  return 10 * e;
}
function dw(t) {
  return Number.isInteger(t) ? String(t) : String(Number(t.toFixed(2)));
}
function bi(t, e, n) {
  if (n <= 0) return t;
  if (n >= 1) return e;
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(t) || !/^#[0-9a-f]{6}$/i.test(e)) return n < 0.5 ? t : e;
  const [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}
function lc(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function fw(t, e, n, s, o, i) {
  const r = Math.min(i, o);
  t.beginPath(), t.moveTo(e, n + o), t.lineTo(e, n + r), t.arcTo(e, n, e + r, n, r), t.lineTo(e + s - r, n), t.arcTo(e + s, n, e + s, n + r, r), t.lineTo(e + s, n + o), t.closePath();
}
function pw(t) {
  return t.endsWith(".value") ? { description: "Its value (the bar’s height, the point’s, or the slice’s share, and its value label)", unit: "value" } : t.endsWith(".show") ? { description: "How much of it is shown: a bar grown in from the axis, the line drawn out to the point, a slice opened", unit: "0..1", min: 0, max: 1 } : t.endsWith(".pull") ? { description: "How far the slice is pulled out from the centre", unit: "0..1", min: 0, max: 1 } : t.startsWith("piece.") ? { description: t.endsWith(".opacity") ? "The loose slice’s opacity" : t.endsWith(".rotate") ? "The loose slice’s turn, degrees" : "The loose slice’s offset from home, px", unit: t.endsWith(".rotate") ? "degrees" : t.endsWith(".opacity") ? "0..1" : "px" } : { description: "How much it is coloured out", unit: "0..1", min: 0, max: 1 };
}
const xu = {
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
function JM(t, e = 300, n = {}) {
  const s = xu[t];
  if (!s) throw new Error(`castMember: unknown cast member '${t}'`);
  return { ...s.options, height: Math.round(e * s.scale), ...n };
}
const mo = {
  handshake: { height: 0.47, spacing: 0.42, lean: 6 },
  highFive: { height: 0.9, spacing: 0.4, lean: 4 },
  fistBump: { height: 0.55, spacing: 0.44, lean: 6 },
  handOver: { height: 0.52, spacing: 0.46, lean: 8 }
};
function ZM(t, e, n) {
  return mo[t].spacing * Math.min(e.height, n.height);
}
const cc = 0.075;
function QM(t, e, n, s = {}) {
  const o = mo[t];
  if (!o) throw new Error(`meetHands: unknown meeting '${t}' (one of ${Object.keys(mo).join(", ")})`);
  const [i, r] = e.x <= n.x ? [e, n] : [n, e], a = s.view === "side", l = Math.min(i.character.height, r.character.height), c = { x: (i.x + r.x) / 2, y: -(s.height ?? o.height) * l }, h = (m, b) => {
    const k = b ? a ? 1 : 0.62 : a ? 3 : 3.38;
    let w = { ...ft, ...m.pose, turn: k, lean: (m.pose?.lean ?? 0) + o.lean };
    const y = b ? 1 : -1, v = (E, T, x) => {
      w = Pe(m.character, w, E, { x: c.x + T - m.x, y: c.y, depth: x });
    };
    if (t === "handOver") {
      const E = cc * l;
      v("arm.left", -y * E * 0.9, E), v("arm.right", -y * E * 0.9, -E);
    } else
      v("arm.right", 0, 0);
    return t === "fistBump" && (w = { ...w, "hand.right.index.curl": 1, "hand.right.middle.curl": 1, "hand.right.ring.curl": 1, "hand.right.pinky.curl": 1 }), w;
  }, u = h(i, !0), d = h(r, !1), f = 0.03 * l, g = (m, b) => {
    const k = oe(m.character, b), w = t === "handOver" ? ["hand.left", "hand.right"] : ["hand.right"], y = t === "handOver" ? cc * l + f : f;
    return w.every((v) => Math.abs(k.points[v].y - c.y) < f && Math.abs(k.points[v].x + m.x - c.x) < y);
  }, p = g(i, u) && g(r, d);
  return e.x <= n.x ? { a: u, b: d, point: c, reached: p } : { a: d, b: u, point: c, reached: p };
}
const dr = { spacing: 0.3, lean: 10, tilt: 8 };
function tx(t, e) {
  return dr.spacing * Math.min(t.height, e.height);
}
function ex(t, e, n = {}) {
  const [s, o] = t.x <= e.x ? [t, e] : [e, t], i = n.view === "side", r = Math.min(s.character.height, o.character.height), a = (g, p, m) => ({
    over: { x: p.x - m * 0.02 * r - g.x, y: -0.72 * r, depth: -0.08 * r },
    round: { x: p.x - m * 0.04 * r - g.x, y: -0.5 * r, depth: 0.06 * r }
  }), l = (g, p, m) => {
    const b = m ? i ? 1 : 0.62 : i ? 3 : 3.38, k = m ? 1 : -1;
    let w = { ...ft, ...g.pose, turn: b, lean: (g.pose?.lean ?? 0) + dr.lean, "head.tilt": (g.pose?.["head.tilt"] ?? 0) + k * dr.tilt };
    const { over: y, round: v } = a(g, p, k);
    return w = Pe(g.character, w, "arm.right", y), w = Pe(g.character, w, "arm.left", v), w;
  }, c = l(s, o, !0), h = l(o, s, !1), u = 0.05 * r, d = (g, p, m, b) => {
    const k = oe(g.character, b).points, { over: w, round: y } = a(g, p, m);
    return Math.hypot(k["hand.right"].x - w.x, k["hand.right"].y - w.y) < u && Math.hypot(k["hand.left"].x - y.x, k["hand.left"].y - y.y) < u;
  }, f = d(s, o, 1, c) && d(o, s, -1, h);
  return t.x <= e.x ? { a: c, b: h, reached: f } : { a: h, b: c, reached: f };
}
const mn = { spacing: 0.32, low: 0.3, high: 0.5, helperLean: 40, helperBend: 16 };
function nx(t, e) {
  return mn.spacing * Math.min(t.height, e.height);
}
function sx(t, e, n, s = {}) {
  const o = Math.max(0, Math.min(1, n)), i = s.view === "side", r = t.x <= e.x, a = Math.min(t.character.height, e.character.height), l = { x: (t.x + e.x) / 2, y: -(mn.low + (mn.high - mn.low) * o) * a }, c = (m) => m ? i ? 1 : 0.62 : i ? 3 : 3.38;
  let h = { ...ft, ...t.pose, turn: c(r), lean: (t.pose?.lean ?? 0) + mn.helperLean * (1 - o) + 4, bend: (t.pose?.bend ?? 0) + mn.helperBend * (1 - o), "head.nod": 18 * (1 - o) };
  h = Pe(t.character, h, "arm.right", { x: l.x - t.x, y: l.y });
  const u = { ...ce.sitFloor, ...e.pose, turn: c(!r) }, d = { ...ft, ...e.pose, turn: c(!r) };
  let f = cb(u, d, o);
  f = Pe(e.character, f, "arm.right", { x: l.x - e.x, y: l.y });
  const g = 0.04 * a, p = (m, b) => {
    const k = oe(m.character, b).points["hand.right"];
    return Math.hypot(k.x + m.x - l.x, k.y - l.y) < g;
  };
  return { helper: h, sitter: f, point: l, reached: p(t, h) && p(e, f) };
}
const gw = 0.7, mw = 50, yw = 1.2, bw = 0.8, ww = 3, kw = 30, vw = 0.8, Mw = 0.6, wi = (t, e) => Math.max(-e, Math.min(e, t)), xw = ["hair.swing", "hair.trail", "hair.lift"];
function Sw(t, e) {
  const n = e.start ?? 0, s = e.amount ?? 1, o = Math.max(1e-6, e.headRadius);
  let i = NaN, r = { x: 0, y: 0, turn: 0 };
  const a = (f) => (f !== i && (r = t(f), i = f), r), l = (f) => {
    const g = a(f);
    return g.turn * 90 + (g.headTurn ?? 0);
  }, c = { start: n, end: e.end, step: e.step, stiffness: e.stiffness ?? 70, damping: e.damping ?? 6 }, h = Ns(l, c), u = Ns((f) => a(f).x, c), d = Ns((f) => a(f).y, c);
  return h.map((f, g) => {
    const p = a(f.time), m = f.value - l(f.time), b = u[g].value - p.x - (e.wind ?? 0) * gw * o, k = d[g].value - p.y, w = Math.sin(p.turn * Math.PI / 2), y = Math.cos(p.turn * Math.PI / 2), v = m * ww + b * y / o * kw, E = -b * w / o * vw, T = -k / o * Mw;
    return {
      time: f.time,
      swing: wi(v * s, mw),
      trail: wi(E * s, yw),
      lift: wi(T * s, bw)
    };
  });
}
function ox(t, e) {
  if (t.length === 0) return { "hair.swing": 0, "hair.trail": 0, "hair.lift": 0 };
  if (e <= t[0].time) return hc(t[0]);
  if (e >= t[t.length - 1].time) return hc(t[t.length - 1]);
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
const hc = (t) => ({ "hair.swing": t.swing, "hair.trail": t.trail, "hair.lift": t.lift }), cn = 16, Tw = 1500;
function ix(t, e, n, s = {}) {
  const o = n.head.hair;
  if (!o || !yy(o)) return [];
  const i = e.filter((k) => k.target === t), r = i.reduce((k, w) => w.keyframes.reduce((y, v) => Math.max(y, v.time), k), 0), a = ft, l = /* @__PURE__ */ new Set(["x", "y", "turn", "head.turn"]), c = new Ct({ id: `${t}-hair-follow`, tracks: i.filter((k) => l.has(k.property)) }), h = (k, w, y) => {
    const v = c.getStateAtTime(k).values.get(t)?.get(w);
    return typeof v == "number" ? v : y;
  }, u = new Ct({ id: `${t}-hair-pose`, tracks: i }), d = (k) => u.getStateAtTime(k).values.get(t), f = /* @__PURE__ */ new Map(), g = (k) => {
    const w = Math.round(k / cn);
    let y = f.get(w);
    if (!y) {
      const v = {};
      for (const [T, x] of d(w * cn) ?? []) v[T] = x;
      const E = oe(n, oa(v, a, s.gaits)).head.center;
      f.set(w, y = { x: E.x, y: E.y });
    }
    return y;
  }, p = (k) => {
    const w = Math.floor(k / cn), y = k / cn - w, v = g(w * cn), E = g((w + 1) * cn);
    return { x: v.x + (E.x - v.x) * y, y: v.y + (E.y - v.y) * y };
  }, m = Sw(
    (k) => {
      const w = p(k);
      return {
        x: h(k, "x", 0) + w.x,
        y: h(k, "y", 0) + w.y,
        turn: h(k, "turn", a.turn ?? 0),
        headTurn: h(k, "head.turn", a["head.turn"] ?? 0)
      };
    },
    {
      start: 0,
      end: r + (s.settle ?? Tw),
      headRadius: oe(n, ft).head.rx,
      step: s.step,
      stiffness: s.stiffness,
      damping: s.damping,
      amount: s.amount,
      wind: s.wind
    }
  ), b = [];
  for (const k of xw) {
    const w = k.slice(5);
    let y = m.map((E) => ({ time: E.time, value: E[w] }));
    if (y.every((E) => Math.abs(E.value) < 1e-3)) continue;
    const v = i.find((E) => E.property === k);
    if (v) {
      const E = new Ct({ id: `${t}-${k}-own`, tracks: [v] }), T = (x) => Number(E.getStateAtTime(x).values.get(t)?.get(k) ?? 0);
      y = y.map((x) => ({ time: x.time, value: x.value + T(x.time) }));
    }
    b.push({ id: `${t}-${k}`, target: t, property: k, keyframes: y });
  }
  return b;
}
const vn = {
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
function Su(t) {
  if (t === void 0) return vn.full;
  if (typeof t == "string") return vn[t];
  const { base: e, ...n } = t;
  return { ...vn[e ?? "full"], ...n };
}
const fr = 160, Ew = 120, Aw = 700, ki = 60, $w = 90, Os = 3200, Mn = 1, Be = 1e-6;
function ua(t, e, n = {}) {
  const s = Su(n.style), o = n.seed ?? 1, i = {};
  if (t.length === 0) return i;
  const r = Object.keys(t[0].pose).filter((u) => t.some((d) => Math.abs(d.pose[u] - t[0].pose[u]) > Be));
  for (const u of r) i[u] = Pw(u, t, e, s, o);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = Iw(t, e, s, o, t[0].pose[a]);
    u.length > 0 && (i[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = Ow(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (i[h] = u);
  }
  return i;
}
function Pw(t, e, n, s, o) {
  const i = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = i ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (f) => {
    const g = (e[f].time - e[f - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (f, g, p) => {
    const m = h[h.length - 1];
    if (f <= m.time + Mn) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: f, value: g, ...p ? { easing: p } : {} });
  };
  let d = e[0].pose[t];
  for (let f = 1; f < e.length; f++) {
    const g = e[f], p = e[f - 1].pose[t], m = g.pose[t], b = m - p, k = h[h.length - 1].time, w = g.act !== !1;
    if (Math.abs(b) <= Be) {
      const I = g.time + (w ? c(f) : 0);
      if (f === e.length - 1)
        Math.abs(d - m) > Be && u(Math.max(I, k + fr), m, "ease-in-out"), d = m;
      else if (w && a && s.drift > 0 && n.drift.includes(t) && I - k >= Aw) {
        const P = Zt(`${o}:${t}:${f}`) % 2 === 0 ? 1 : -1;
        d = m + P * s.drift * r, u(I, d, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      u(e[f - 1].time, d), u(g.time, m, g.easing), d = m;
      continue;
    }
    const y = c(f), v = Math.max(e[f - 1].time + y, k);
    let E = g.time + y;
    i && s.eyeDart > 0 && (E = Math.min(E, v + s.eyeDart));
    const T = E - v;
    if (T <= Mn) {
      u(g.time, m, g.easing), d = m;
      continue;
    }
    u(v, d);
    const x = Math.sign(b);
    if (a && s.anticipation > 0 && r > 0 && T >= fr) {
      const I = d - x * Math.min(Math.abs(b) * s.anticipation, r), P = v + T * s.anticipationTime;
      u(P, I, "ease-in-out"), s.hold > 0 && u(P + T * s.hold, I);
    }
    const M = f + 1 < e.length ? e[f + 1].time - g.time : 1 / 0, A = Math.min(s.settle, M / 2);
    if (a && s.overshoot > 0 && r > 0 && T >= Ew && A > Mn) {
      const I = Math.min(Math.abs(b) * s.overshoot, r);
      u(E, m + x * I, g.easing ?? s.actionEase), u(E + A, m, s.settleEase);
    } else
      u(E, m, g.easing ?? s.actionEase);
    d = m;
  }
  return h;
}
function Iw(t, e, n, s, o) {
  const i = [], r = ki + $w;
  for (let f = 1; f < t.length; f++) {
    const g = t[f - 1].pose, p = t[f].pose;
    Object.entries(e.headTurns).some(([b, k]) => Math.abs((p[b] ?? 0) - (g[b] ?? 0)) > k) && t[f].act !== !1 && i.push(Math.max(t[0].time, t[f - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...i];
  let h = a + Os * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Os / 2) || i.push(h);
    const g = (Zt(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (Os * 0.66);
    h += Os + g;
  }
  i.sort((f, g) => f - g);
  const d = [{ time: a, value: o }];
  for (const f of i) {
    const g = d[d.length - 1].time;
    f + ki <= g + Mn || (f > g + Mn && d.push({ time: f, value: o }), d.push({ time: f + ki, value: 1, easing: "ease-in" }), d.push({ time: f + r, value: o, easing: "ease-out" }));
  }
  return d.length > 1 ? d : [];
}
function Ow(t, e, n, s) {
  const o = n * (1 - 0.18 * s), i = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + Mn || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, d = t[l].time, f = d - u;
    if (!(f < fr || t[l].act === !1)) {
      if (c <= Be && h > Be)
        a(u, n), a(u + f * 0.2, o, "ease-out"), a(u + f * 0.45, i, "ease-out"), a(d, n, "ease-in-out");
      else if (c > Be && h <= Be) {
        const g = l + 1 < t.length ? t[l + 1].time - d : 400;
        a(u + f * 0.5, n), a(d - Math.min(60, f * 0.15), i, "ease-in"), a(d, o, "ease-out"), a(d + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const _w = {
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
function Hw(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function Cw() {
  const t = {}, e = {};
  for (const n of Object.keys(ft)) {
    const s = Hw(n);
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
const Rw = Cw();
function Tu(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function Lw(t, e, n = {}) {
  const s = Fr(e), o = e.map((i, r) => ({ time: i.time, pose: { ...s[r] }, easing: i.easing, act: i.act }));
  return Tu(t, ua(o, n.rig ?? _w, n));
}
function Ww(t, e, n = {}) {
  const s = n.rest ?? ft, o = su(e, s), i = e.map((r, a) => ({ time: r.time, pose: { ...s, ...o[a] }, easing: r.easing, act: r.act }));
  return Tu(t, ua(i, n.rig ?? Rw, n));
}
const uc = kt.shocked, Fw = kt.scared, Ge = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...uc, headTilt: 0 }, easing: "ease-out-cubic" },
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
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...uc, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
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
    const e = [{ after: 80, pose: { ...Fw, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Jt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function dc(t, e) {
  const n = typeof e.from == "string" ? Jt[e.from] : e.from ?? lt;
  return Eu(Ge[t](n), { ...e, from: n });
}
function Eu(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((o) => (s = { ...s, ...o.pose }, { time: e.at + o.after * n, pose: s, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
function yo(t, e = 1) {
  const n = Ge[t](lt);
  return n[n.length - 1].after * e;
}
function Nw(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), o = n.spacing ?? 5, i = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * o, c = Math.floor(Math.abs(l) / Math.max(o, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], d = e[h], f = d.x - u.x, g = d.y - u.y, p = Math.hypot(f, g) || 1, m = -g / p, b = f / p, k = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - k), t.lineWidth = i * (1 - k * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + b * l), t.lineTo(d.x + m * l, d.y + b * l), t.stroke();
    }
  }
  t.restore();
}
const Dw = {
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
function rx(t, e, n, s, o = {}) {
  const i = n.stateAt;
  if (!i) return;
  const r = o.length ?? 120, a = Math.max(2, Math.round(o.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let f = 0; f < a; f++) {
    const g = l + (n.time - l) * f / (a - 1);
    c.push(k0(e, { time: g, state: i(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (o.threshold ?? 1.2) * h, d = (o.parts ?? ["hands", "toes", "head"]).flatMap((f) => Dw[f]);
  for (const f of d) {
    const g = c.map(f.at);
    let p = 0;
    for (let k = 1; k < g.length; k++) p += Math.hypot(g[k].x - g[k - 1].x, g[k].y - g[k - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const b = Math.min(1, (m - u) / (u * 0.5));
    Nw(t, g, { ...o, opacity: (o.opacity ?? 0.7) * b, spacing: o.spacing ?? h * 0.02 });
  }
}
function Bw(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, o * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = Zt(`${i}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * o * 0.3 * r, u = e.y - o * (0.06 + 0.12 * l) * r + Math.abs(c) * o * 0.03, d = o * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, d, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function ax(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, o * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < i; a++) {
    const l = -Math.PI / 2 + (a - (i - 1) / 2) * Math.PI / (i + 1), c = o * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    zw(t, h, u, o * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function zw(t, e, n, s, o) {
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
}, Dn = 1, _s = 0.55, fc = 0.35, qw = 1.6, pc = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, gc = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, mc = {
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
}, yc = {
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
}, Yw = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, jw = "्", bc = "़", Kw = (t) => t >= "क" && t <= "ह", wc = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function Xw(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (o, i) => {
    const r = e[e.length - 1];
    r && r.viseme === o ? r.weight += i * 0.5 : e.push({ viseme: o, weight: i });
  };
  for (let o = 0; o < n.length; o++) {
    const i = n[o], r = n[o + 1];
    if (wc.has(i)) s("rest", qw);
    else if (/\s/.test(i)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: fc });
    } else if ((i === "o" || i === "e") && r === i)
      s(i === "o" ? "u" : "i", Dn), o++;
    else if (i in pc) s(pc[i], Dn);
    else if (i in gc) s(gc[i], _s);
    else {
      if (i === "h") continue;
      if (/[a-z]/.test(i)) s("c", _s);
      else if (i in mc) s(mc[i], Dn);
      else if (Kw(i)) {
        const a = r === bc ? i === "फ" ? "f" : void 0 : Yw[i];
        s(a ?? "c", _s);
        let l = o + 1;
        n[l] === bc && l++;
        const c = n[l];
        c === jw ? o = l : c && c in yc ? (s(yc[c], Dn), o = l) : (!c || /\s/.test(c) || wc.has(c) || s("a", Dn * 0.6), o = l - 1);
      } else (i === "ं" || i === "ँ") && s("l", _s * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === fc); ) e.pop();
  return e;
}
function Au(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", o = e.energy ?? 1, i = Xw(t.text), r = [{ time: t.start, value: He.rest.mouth }], a = [{ time: t.start, value: He.rest.mouthWidth }], l = i.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of i) {
      const d = c * u.weight / l, f = h + Math.min(d * 0.4, 60);
      if (f > r[r.length - 1].time) {
        const g = He[u.viseme];
        r.push({ time: f, value: g.mouth * o, easing: "ease-out" }), a.push({ time: f, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, o), easing: "ease-out" });
      }
      h += d;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: He.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: He.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function lx(t, e, n = {}) {
  const s = {};
  for (const o of [...e].sort((i, r) => i.start - r.start))
    for (const [i, r] of Object.entries(Au(o, n))) {
      const a = s[i] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([o, i]) => ({ id: `${t}-${o}`, target: t, property: o, keyframes: i }));
}
function $u(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const o = s.fields?.mouth ?? "mouth", i = s.fields?.mouthWidth ?? "mouthWidth", r = { [o]: He.rest.mouth, [i]: He.rest.mouthWidth, ...s.rest }, a = new Ct({ id: "before-speech", tracks: e }), l = (u, d) => a.getStateAtTime(d).values.get(t)?.get(u) ?? r[u], c = [o, i], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const d = e.find((g) => g.target === t && g.property === u);
    let f = d ? [...d.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = Au(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, f = [...f.filter((m) => m.time < g.start || m.time > g.end), ...p], f.sort((m, b) => m.time - b.time);
    }
    h.push({ id: d?.id ?? `${t}-${u}`, target: t, property: u, keyframes: f });
  }
  return h;
}
const Do = {
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
function Pu(t = {}) {
  return [
    ...Object.keys(Bt),
    ...Object.keys(Jt),
    ...Object.keys(Ge),
    ...Object.keys(Do),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function Iu(t = {}) {
  const e = new Set(Pu()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function Ou(t = {}) {
  const e = {};
  for (const n of Object.keys(Bt)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(Jt)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(Ge)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(Do)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const pr = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], Uw = {
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
}, Hs = ["viewer", "ahead", "back"], _e = (t) => typeof t == "number" && Number.isFinite(t);
function bo(t, e = {}) {
  const n = Iu(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = Pu(e), o = (l) => l in Bt || l in (e.gaits ?? {}), i = Object.keys(kt), r = Object.keys(lt);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), u = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const d = l;
    for (const p of Object.keys(d))
      pr.includes(p) || h(dt("beat field", p, pr, Uw[p.toLowerCase()]));
    const f = d.do;
    if (f === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof f != "string" || !s.includes(f)) {
      h(dt("action", f, s));
      return;
    }
    const g = Do[f] ?? e.actions?.[f];
    for (const p of g?.needs ?? [])
      d[p] === void 0 && h(`\`${f}\` needs \`${p}\`.`);
    if (o(f) && d.to === void 0 && u(`\`${f}\` without \`to\` walks nowhere.`), f === "leap" && d.to === void 0 && d.onto === void 0 && u("`leap` without `to` or `onto` jumps on the spot."), d.mood !== void 0 && (typeof d.mood != "string" || !i.includes(d.mood)) && h(dt("mood", d.mood, i)), d.pose !== void 0)
      if (!d.pose || typeof d.pose != "object" || Array.isArray(d.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(d.pose))
          r.includes(p) ? _e(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(dt("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = d[p];
      m !== void 0 && !(_e(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    _e(d.at) && (d.at < a && u(`\`at\` ${d.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = d.at);
    for (const p of ["to", "onto"]) {
      const m = d[p];
      m !== void 0 && !_e(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (d.toward !== void 0 && !_e(d.toward) && !Hs.includes(d.toward) && h(`\`toward\` is a scene x or one of ${Hs.join(", ")}${typeof d.toward == "string" && Zs(d.toward, Hs) ? ` (did you mean "${Zs(d.toward, Hs)}"?)` : ""} (got ${JSON.stringify(d.toward)}).`), d.say !== void 0 && typeof d.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(d.say)}).`), d.target !== void 0) {
      const p = d.target;
      (!p || typeof p != "object" || !_e(p.x) || !_e(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function kc(t, e = {}, n = "scriptTracks") {
  const s = bo(t, e).filter((o) => o.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((o) => `  ${o.beat >= 0 ? `beat ${o.beat}: ` : ""}${o.message}`).join(`
`)}`);
}
Jg(Ou);
function cx(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function hx(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const vc = 8;
function da(t, e = {}, n = 0) {
  if (n > vc) throw new Error(`scriptTracks: custom actions nest more than ${vc} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const o = e[s.do];
    if (!o || !("beats" in o)) return [s];
    const i = o.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return da(i, e, n + 1);
  });
}
function Gw(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const Mc = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, Vw = 450, Jw = 2.4, Zw = 160, xc = 2.5, Qw = 200, t2 = 340, e2 = 1.1, Sc = [380, 900], n2 = 0.35, Cs = 300, vi = 150, s2 = 260, o2 = 1.2, Mi = 160, Tc = 400, Bn = 300, i2 = 450, Ec = 500, xi = 350, Ac = 150, r2 = 120, Si = 180, $c = 420, a2 = 300, Pc = 300, l2 = 140, Ti = 150, Ic = 450, c2 = 450, Ei = 150, Oc = 350, _c = 400, h2 = 12, u2 = 600, Hc = 90, Cc = 400, d2 = 200, f2 = 0.09, Rc = 350, ue = 450, Ai = 1200, p2 = 700, hn = 320, de = 220, g2 = 65, m2 = 700, Lc = (t) => t in Ge, y2 = (t) => t in Jt;
function b2(t) {
  return Math.max(m2, Array.from(t).length * g2);
}
function fa(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  kc(e, s);
  const o = n.gait ?? "walk", i = da(e, n.actions).map(($) => $.do === "go" ? { ...$, do: o } : $);
  kc(i, s, "scriptTracks (after expanding custom actions)");
  const r = ($) => Bt[$] ?? n.gaits?.[$], a = ($) => Mc[$] ?? n.gaits?.[$]?.cycle ?? 1e3, l = ($) => {
    const R = n.actions?.[$];
    return R && "steps" in R ? R : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, u = n.height ?? 300;
  let d = c, f = h, g = n.facing ?? 1, p = n.start ?? lt, m = 0, b = 0;
  const k = [{ time: 0, pose: p }], w = [{ time: 0, value: 0 }], y = [{ time: 0, value: 0 }], v = [{ time: 0, value: 0 }], E = [{ time: 0, value: 0 }], T = [{ time: 0, value: "walk" }], x = [{ time: 0, value: g }], M = [], A = [], I = [], P = ($, R, N, z) => {
    p = { ...p, ...R }, N && (p = Le(p, N)), k.push({ time: $, pose: p, ...z === !1 ? { act: z } : {} });
  }, O = ($, R, N) => (P($ + hn / 2, { turn: 0 }, N), x.push({ time: $ + hn / 2, value: g }, { time: $ + hn / 2 + 1, value: R }), g = R, P($ + hn, { turn: 1 }), $ + hn), _ = ($) => $ < d ? -1 : 1, W = ($, R, N) => _(R) !== g ? O($, _(R), N) : $, B = ($, R, N, z = "arm") => {
    const D = z === "arm", q = ae({ ...$, ...D ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: u, facing: g }), U = D ? q.shoulders.right : q.hip, F = D ? q.elbows.right : q.knees.right, G = (ot, it) => Math.atan2(g * ot, it) * 180 / Math.PI, nt = ((G(R - (d + U.x), N - (f + U.y)) - G(F.x - U.x, F.y - U.y)) % 360 + 360) % 360;
    return nt > 270 ? nt - 360 : nt;
  }, K = ($, R, N, z) => {
    const D = z === "arm", q = ae({ ...$, ...D ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: u, facing: g }), U = D ? q.shoulders.right : q.hip, F = D ? { x: (q.hands.right.x + q.fingertips.right.x) / 2, y: (q.hands.right.y + q.fingertips.right.y) / 2 } : q.feet.right, G = Math.hypot(F.x - U.x, F.y - U.y) * ((D ? n.reach?.arm : n.reach?.leg) ?? 1), Y = N - (f + U.y), nt = Math.abs(Y) < G ? Math.sqrt(G * G - Y * Y) : G * 0.1;
    return R - U.x - g * nt;
  }, V = ($) => {
    const R = ae($, { height: u, facing: g });
    return { x: d + (R.hands.right.x + R.fingertips.right.x) / 2, y: f + (R.hands.right.y + R.fingertips.right.y) / 2 };
  }, j = ($, R, N) => {
    const z = { ...$, rightWrist: 0, rightElbow: 0, rightShoulder: B($, R, N) }, D = ae(z, { height: u, facing: g }), q = { x: d + D.shoulders.right.x, y: f + D.shoulders.right.y }, U = { x: d + D.elbows.right.x, y: f + D.elbows.right.y }, F = V(z), G = Math.hypot(U.x - q.x, U.y - q.y), Y = Math.hypot(F.x - U.x, F.y - U.y), nt = Math.min(G + Y - 0.01, Math.max(Math.abs(G - Y) + 0.01, Math.hypot(R - q.x, N - q.y))), ot = (tt) => tt * 180 / Math.PI, it = ot(Math.acos((G * G + nt * nt - Y * Y) / (2 * G * nt))), rt = 180 - ot(Math.acos((G * G + Y * Y - nt * nt) / (2 * G * Y)));
    let H = { rightShoulder: z.rightShoulder, rightElbow: 0 }, J = 1 / 0;
    for (const tt of [1, -1])
      for (const st of [1, -1]) {
        const Q = { rightShoulder: z.rightShoulder + tt * it, rightElbow: st * rt }, at = { ...$, rightWrist: 0, ...Q }, Z = V(at), et = Math.hypot(Z.x - R, Z.y - N) - ae(at, { height: u, facing: g }).elbows.right.y * 1e-3;
        et < J && (J = et, H = Q);
      }
    return H;
  }, S = ($, R, N) => Math.abs(R - d) < 2 ? $ : (w.push({ time: $, value: d - c }, { time: $ + N, value: R - c, easing: "ease-in-out" }), d = R, $ + N);
  for (const $ of i) {
    const R = Math.max($.at ?? b, b === 0 ? 0 : k[k.length - 1].time);
    let N = R, z, D;
    const q = $.pose ?? {}, U = l($.do);
    if (r($.do)) {
      const F = $.to ?? d, G = F === d ? g : _(F);
      let Y = R;
      G !== g ? Y = O(R, G, $.mood) : p.turn < 1 ? (Y = R + de, P(Y, { turn: 1, ...q }, $.mood)) : ($.mood || $.pose) && P(R + de, q, $.mood);
      const ot = Math.abs(F - d) / Ui(r($.do), u), it = $.for ?? Math.max(de * 2, ot * a($.do)), rt = Y + it;
      T.push({ time: Y, value: $.do }), E.push({ time: Y, value: 0 }, { time: Y + de, value: 1, easing: "ease-out" }), E.push({ time: rt - de, value: 1 }, { time: rt, value: 0, easing: "ease-in" }), v.push({ time: Y, value: m }, { time: rt, value: m + ot }), w.push({ time: Y, value: d - c }, { time: rt, value: F - c }), m += ot, d = F, P(rt, {}), N = rt;
    } else if ($.do === "zip") {
      const F = $.to ?? d, G = F === d ? g : _(F);
      let Y = R;
      G !== g ? Y = O(R, G, $.mood) : p.turn < 1 && (Y = R + de, P(Y, { turn: 1 }, $.mood));
      const nt = dc("windUp", { at: Y, from: $.mood ? Le(p, $.mood) : p });
      k.push(...nt), p = nt[nt.length - 1].pose;
      const ot = Y + yo("windUp"), it = ot + Vw, rt = it + Math.max(Zw, Math.abs(F - d) / Jw);
      T.push({ time: ot, value: "run" }), E.push({ time: ot, value: 0 }, { time: ot + 80, value: 1, easing: "ease-out" }, { time: rt, value: 1 }, { time: rt + 120, value: 0 }), v.push({ time: ot, value: m }, { time: it, value: m + xc, easing: "ease-in" }), m += xc + (rt - it) / Mc.run * 1.5, v.push({ time: rt, value: m }), w.push({ time: it, value: d - c }, { time: rt, value: F - c, easing: "ease-in" }), I.push({ kind: "dust", time: it, x: d, y: f, length: 900 }), d = F, P(rt, {}), N = rt;
    } else if ($.do === "leap") {
      const F = $.to ?? d, G = $.onto ?? f;
      let Y = F === d ? R : W(R, F, $.mood);
      p.turn < 1 && (Y += de, P(Y, { turn: 1 }, $.mood));
      const nt = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      P(Y + Qw, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...nt }, $.mood, !1);
      const ot = Y + t2;
      P(ot - 40, { stretch: 0.72 }, void 0, !1), P(ot, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const it = Math.hypot(F - d, G - f), rt = $.for ?? Math.min(Sc[1], Math.max(Sc[0], 300 + it * e2)), H = Math.min(f, G) - n2 * u, J = Math.sqrt(f - H), tt = Math.sqrt(G - H), st = ot + rt * J / (J + tt), Q = ot + rt;
      P(st, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), P(Q, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), P(Q + 180, { stretch: 1.05, bend: -3 }, void 0, !1), P(Q + 340, { stretch: 1, bend: 0, leftHip: lt.leftHip, rightHip: lt.rightHip, leftShoulder: lt.leftShoulder, rightShoulder: lt.rightShoulder, leftElbow: lt.leftElbow, rightElbow: lt.rightElbow }, void 0, !1), w.push({ time: ot, value: d - c }, { time: Q, value: F - c }), y.push(
        { time: ot, value: f - h },
        { time: st, value: H - h, easing: "ease-out-quad" },
        { time: Q, value: G - h, easing: "ease-in-quad" }
      ), d = F, f = G, I.push({ kind: "dust", time: Q, x: d, y: f, length: 500 }), N = Q + 340, z = Q;
    } else if ($.do === "point" && $.target) {
      const F = $.target, G = W(R, F.x, $.mood), Y = { ...p, ...$.mood ? kt[$.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...q }, nt = ae(Y, { height: u, facing: g }).head.center, ot = Math.abs(F.x - (d + nt.x)), it = F.y - (f + nt.y), rt = G + ue;
      P(rt, { ...Y, rightShoulder: B(Y, F.x, F.y), lookX: 1, lookY: w2(it / Math.max(1, Math.hypot(ot, it))) * 0.8 }), N = rt + ($.for ?? Ai), z = rt, D = N;
    } else if ($.do === "swipe") {
      const F = $.target ?? { x: d + g * u * 0.5, y: f - u * 0.6 }, G = _(F.x), Y = W(R, F.x, $.mood), nt = G === 1 ? F.left ?? F.x : F.right ?? F.x, ot = G === 1 ? F.right ?? F.x : F.left ?? F.x, it = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...q };
      P(Y + Cs, { ...it, rightShoulder: B(it, d - g * u * 0.3, f - u * 1.1) }, $.mood, !1);
      const rt = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, H = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      S(Y, K(rt, nt, F.y, "arm"), Cs + vi), P(Y + Cs + vi, { lean: -12 }, void 0, !1);
      const J = Y + Cs + vi + 80;
      P(J, { ...rt, rightShoulder: B(rt, nt, F.y) }, void 0, !1);
      const tt = J + ($.for ?? Math.max(s2, Math.abs(ot - nt) / o2));
      w.push({ time: J, value: d - c }), d = K(H, ot, F.y, "arm"), w.push({ time: tt, value: d - c }), P(tt, { ...H, rightShoulder: B(H, ot, F.y) }, void 0, !1), P(tt + Mi, { lean: 16, bend: 14, rightShoulder: B(p, ot + G * u * 0.4, F.y + u * 0.25) }, void 0, !1), P(tt + Mi + Tc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow }), N = tt + Mi + Tc, z = J, D = tt;
    } else if ($.do === "grab" && $.target) {
      const F = $.target, G = W(R, F.x, $.mood), Y = F.y > f - u * 0.5, nt = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: Y ? 35 : 0,
        lean: Y ? 12 : 0,
        stretch: Y ? 0.75 : 1,
        lookX: 1,
        lookY: Y ? 0.8 : 0,
        ...q
      }, it = S(G, K(nt, F.x, F.y, "arm"), Bn) + i2;
      P(it, { ...nt, rightShoulder: B(nt, F.x, F.y) }, $.mood, !1), P(it + 120, {}, void 0, !1), P(it + Ec, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), N = it + Ec + 150, z = it;
    } else if ($.do === "throw") {
      const F = $.target?.x ?? $.to ?? d + g * u, G = W(R, F, $.mood), Y = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...q };
      P(G + xi, { ...Y, rightShoulder: B(Y, d - g * u * 0.4, f - u * 1.05) }, $.mood, !1), P(G + xi + Ac, { lean: -14 }, void 0, !1);
      const nt = G + xi + Ac + r2, ot = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      k.push({ time: nt, pose: p = { ...ot, rightShoulder: B(ot, d + g * u, f - u * 1.1) }, easing: "ease-in", act: !1 }), P(nt + Si, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), P(nt + Si + $c, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, lookY: 0 }), N = nt + Si + $c, z = nt, D = nt;
    } else if ($.do === "kick" && $.target) {
      const F = $.target, G = W(R, F.x, $.mood), Y = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, nt = S(G, K(Y, F.x, F.y, "leg"), a2), ot = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      P(nt + Pc, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...ot, ...q }, $.mood, !1);
      const it = nt + Pc + l2, rt = B(Y, F.x, F.y, "leg");
      k.push({ time: it, pose: p = { ...p, ...Y, rightHip: rt }, easing: "ease-in", act: !1 }), P(it + Ti, { lean: -15, rightHip: rt + 20 }, void 0, !1), P(it + Ti + Ic, {
        lean: 0,
        bend: 0,
        rightHip: lt.rightHip,
        rightKnee: 0,
        leftShoulder: lt.leftShoulder,
        rightShoulder: lt.rightShoulder,
        leftElbow: lt.leftElbow,
        rightElbow: lt.rightElbow,
        lookY: 0
      }), N = it + Ti + Ic, z = it;
    } else if ($.do === "put" && $.target) {
      const F = $.target, G = W(R, F.x, $.mood), Y = F.y > f - u * 0.5, nt = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: Y ? 35 : 0, lean: Y ? 12 : 0, stretch: Y ? 0.75 : 1, lookX: 1, lookY: Y ? 0.8 : 0, ...q }, it = S(G, K(nt, F.x, F.y, "arm"), Bn) + c2;
      P(it, { ...nt, rightShoulder: B(nt, F.x, F.y) }, $.mood, !1), P(it + Ei, {}, void 0, !1), P(it + Ei + Oc, { bend: 0, lean: 0, stretch: 1, rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, lookY: 0 }), N = it + Ei + Oc, z = it;
    } else if ($.do === "write" && $.target) {
      const F = $.target, G = F.left ?? F.x, Y = F.right ?? F.x, nt = W(R, (G + Y) / 2, $.mood), ot = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...kt.thinking, lookX: 1, lookY: 0, ...q }, it = (Z) => K(ot, Z, F.y, "arm") + g * u * 0.08, rt = (Z) => {
        const X = V({ ...ot, ...j(ot, Z, F.y), rightWrist: 0 });
        return Math.hypot(X.x - Z, X.y - F.y) < 2;
      }, H = g === 1 ? G : Y, J = S(nt, it((G + Y) / 2), Bn), tt = !rt(G) || !rt(Y), st = tt ? S(J, it(G), Bn) + _c : J + _c;
      P(st, { ...ot, ...j(ot, tt ? G : H, F.y) }, $.mood, !1);
      const Q = $.for ?? Math.max(u2, Math.abs(Y - G) * h2);
      tt && w.push({ time: st, value: d - c });
      for (let Z = Hc, X = 0; Z <= Q; Z += Hc, X++) {
        const et = G + (Y - G) * Math.min(Z, Q) / Q;
        tt && (d = it(et), w.push({ time: st + Z, value: d - c }));
        const ct = (X % 2 === 0 ? -1 : 1) * u * 0.02;
        P(st + Z, j(ot, et, F.y + ct), void 0, !1);
      }
      const at = st + Q;
      P(at, j(ot, Y, F.y), void 0, !1), P(at + Cc, { rightShoulder: lt.rightShoulder, rightElbow: lt.rightElbow, ...kt.happy }), N = at + Cc, z = st, D = at;
    } else if ($.do === "push" && $.target) {
      const F = $.target, G = $.to ?? F.x, Y = W(R, d + (G >= F.x ? 1 : -1), $.mood), nt = g === 1 ? F.left ?? F.x : F.right ?? F.x, ot = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...q }, it = K(ot, nt, F.y, "arm"), rt = S(Y, it + g * u * 0.06, Bn), H = j(ot, nt, F.y), J = { ...ot, ...H, leftShoulder: -H.rightShoulder, leftElbow: -H.rightElbow }, tt = rt + d2;
      P(tt, J, $.mood, !1);
      const st = Math.abs(G - F.x), Q = tt + ($.for ?? Math.max(600, st / f2)), at = st / Ui("shove", u);
      T.push({ time: tt, value: "shove" }), E.push({ time: tt, value: 0 }, { time: tt + de, value: 1, easing: "ease-out" }, { time: Q - de, value: 1 }, { time: Q, value: 0, easing: "ease-in" }), v.push({ time: tt, value: m }, { time: Q, value: m + at }), m += at, w.push({ time: tt, value: d - c }, { time: Q, value: d + (G - F.x) - c }), d += G - F.x, P(Q, {}, void 0, !1), P(Q + Rc, { lean: 0, bend: 0, rightShoulder: lt.rightShoulder, leftShoulder: lt.leftShoulder, rightElbow: lt.rightElbow, leftElbow: lt.leftElbow }), N = Q + Rc, z = tt, D = Q;
    } else if (U) {
      const F = $.mood ? Le(p, $.mood) : p, G = U.steps(F, $), Y = Eu(G, { at: R, from: F });
      k.push(...Y), p = Y[Y.length - 1].pose, N = R + Math.max(Gw(G), $.for ?? 0);
    } else if (Lc($.do)) {
      const F = dc($.do, { at: R, from: $.mood ? Le(p, $.mood) : p });
      k.push(...F), p = F[F.length - 1].pose, N = R + yo($.do), $.do === "take" && I.push({ kind: "dust", time: R + 900, x: d, y: f, length: 500 }), $.do === "land" && I.push({ kind: "dust", time: R + 120, x: d, y: f, length: 500 });
    } else if ($.do === "look" || $.do === "face") {
      const F = $.toward ?? "viewer", G = $.for ?? p2;
      if (F === "viewer") P(R + ue, { turn: 0, lookX: 0, lookY: 0, ...q }, $.mood);
      else if (F === "ahead") P(R + ue, { turn: $.do === "face" ? 1 : 0.6, lookX: 1, ...q }, $.mood);
      else if (F === "back") P(R + ue, { turn: 0.2, lookX: -1, ...q }, $.mood);
      else {
        const Y = _(F);
        Y !== g && $.do === "face" ? (O(R, Y, $.mood), P(R + hn + 1, { lookX: 1, ...q })) : Y !== g ? P(R + ue, { turn: 0.25, lookX: -1, ...q }, $.mood) : P(R + ue, { turn: $.do === "face" ? 1 : 0.6, lookX: 1, ...q }, $.mood);
      }
      N = R + Math.max(G, ue);
    } else if (y2($.do) || $.do === "stand") {
      const F = $.do === "stand" ? n.rest ?? lt : Jt[$.do], G = F.turn !== lt.turn ? F.turn : p.turn, Y = $.mood ? kt[$.mood] : { lookX: p.lookX, lookY: p.lookY };
      P(R + ue, { ...F, turn: G, ...Y, ...q }), N = R + ($.for ?? Ai);
    } else {
      const F = $.for ?? ($.say ? b2($.say) : Ai);
      ($.mood || $.pose) && P(R + Math.min(ue, F / 2), q, $.mood), N = R + F;
    }
    if ($.say) {
      const F = r($.do) || Lc($.do) || U ? R : R + Math.min(150, (N - R) / 4), G = r($.do) ? N : Math.max(F + 200, N - 100);
      M.push({ text: $.say, start: F, end: G }), $.do === "say" && M2(k, p, F, G);
    }
    $.onto !== void 0 && $.do !== "leap" && $.onto !== f && (y.push({ time: R, value: f - h }, { time: N, value: $.onto - h, easing: "ease-in-out" }), f = $.onto), N > k[k.length - 1].time && k.push({ time: N, pose: p }), A.push({ start: R, end: N, ...z !== void 0 ? { contact: z } : {}, ...D !== void 0 ? { release: D } : {} }), b = N;
  }
  const C = Lw(t, v2(k), n), L = [
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
    tracks: [...$u(t, C, M, { energy: n.energy }), ...L],
    duration: b,
    lines: M,
    keys: k,
    beats: A,
    effects: I
  };
}
const w2 = (t) => Math.max(-1, Math.min(1, t)), k2 = 30;
function v2(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < k2 ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function M2(t, e, n, s) {
  const i = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !i.some((c) => Math.abs(c.time - l.time) < 60)), ...i), t.sort((l, c) => l.time - c.time);
}
function _u(t, e, n) {
  const s = new Ct({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), o = w0({ x: n.x, y: n.y, style: n.style, cast: n.cast }), i = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = k0(o, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[i], u = c.fingertips[i];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const Qn = ["start", "contact", "release", "end"], x2 = ["surface", "edit", "anchor", "at", "until"], S2 = ["carry"], Xs = (t) => !!t && typeof t == "object" && !Array.isArray(t) && "surface" in t && "anchor" in t, T2 = (t) => t.then === void 0 ? [] : Array.isArray(t.then) ? t.then : [t.then];
function ux(t, e, n, s = {}) {
  const o = E2(n, e, s).filter((d) => d.level === "error");
  if (o.length > 0)
    throw new Error(`surfaceScript: ${o.length} problem(s) in the beats:
${o.map((d) => `  ${d.beat >= 0 ? `beat ${d.beat}: ` : ""}${d.message}`).join(`
`)}`);
  const i = n.map((d) => Hu(d, e)), r = fa(t, i, s), a = A2(i, r.beats, s), l = s.ground ?? 0, c = (d) => s.ride === !1 ? d : Object.values(e).reduce((f, g) => g.ride(f, t, { ground: l }), d);
  n.forEach((d, f) => {
    for (const g of T2(d)) {
      const p = (y) => new Error(`surfaceScript: beat ${f} (${d.do}), ${g.edit} on ${g.surface}: ${y}`), m = (y, v) => {
        const E = typeof y == "object" ? y.beat : f, T = (typeof y == "object" ? y.at : y) ?? v ?? "start", x = a[E][T];
        if (x === void 0) {
          const M = Qn.filter((A) => a[E][A] !== void 0).join(", ");
          throw p(`beat ${E} (${n[E].do}) has no ${T} (it has ${M})`);
        }
        return x;
      }, b = e[g.surface], k = m(g.at ?? (a[f].contact !== void 0 ? "contact" : "start")), w = g.until === void 0 ? void 0 : m(g.until, "end");
      if (w !== void 0 && w < k) throw p(`it ends (${w} ms) before it starts (${k} ms)`);
      try {
        if (g.edit === "carry") {
          const v = b.piece(g.anchor), E = _u(t, c(r.tracks), {
            x: s.from ?? 0,
            y: l,
            style: s.figureStyle ?? (s.height ? { height: s.height } : void 0),
            cast: s,
            start: k,
            end: w
          });
          b.follow(v, E);
          continue;
        }
        const y = Object.fromEntries(Object.entries(g).filter(([v]) => !x2.includes(v)));
        b.edit(g.edit, g.anchor, { ...y, at: k, ...w !== void 0 ? { duration: w - k } : {} });
      } catch (y) {
        throw p(y.message);
      }
    }
  });
  const h = c(r.tracks), u = Object.entries(e).flatMap(([d, f]) => f.tracks(d));
  return { ...r, tracks: [...h, ...u], figureTracks: h };
}
function E2(t, e, n = {}) {
  if (!Array.isArray(t)) return bo(t, n);
  const s = [], o = Object.keys(e), i = (c, h, u) => {
    const d = typeof h == "string" ? e[h] : void 0;
    return d || s.push({ level: "error", beat: c, message: `${u}: ${dt("surface", h, o)}` }), d;
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
    typeof d == "number" ? s.push({ level: "error", beat: c, message: `${u}: a cue starts at a moment of its beat (${Qn.join(", ")}), not at ms; set the beat's own \`at\` to move it.` }) : (typeof d != "string" || !Qn.includes(d)) && s.push({ level: "error", beat: c, message: `${u}: ${dt("moment", d, Qn)}` });
  };
  t.forEach((c, h) => {
    if (!c || typeof c != "object" || Array.isArray(c)) return;
    const u = c;
    for (const f of ["target", "to", "onto"]) {
      if (!Xs(u[f])) continue;
      const g = u[f], p = i(h, g.surface, `\`${f}\``);
      p && r(h, p, g.anchor, `\`${f}\``);
    }
    if (u.then === void 0) return;
    (Array.isArray(u.then) ? u.then : [u.then]).forEach((f) => {
      if (!f || typeof f != "object" || Array.isArray(f)) {
        s.push({ level: "error", beat: h, message: "`then` is a cue, { surface, edit, anchor, at?, until? }, or a list of them." });
        return;
      }
      const g = f, p = i(h, g.surface, "`then`");
      if (!p) return;
      const m = `\`then\` (${String(g.edit)} on ${String(g.surface)})`, b = [...Object.keys(p.about.edits), ...S2];
      if (typeof g.edit != "string" || !b.includes(g.edit)) {
        s.push({ level: "error", beat: h, message: `\`then\`: ${dt("edit", g.edit, b)}` });
        return;
      }
      for (const k of Array.isArray(g.anchor) ? g.anchor : [g.anchor]) r(h, p, k, m);
      g.edit === "carry" && typeof g.anchor != "string" && s.push({ level: "error", beat: h, message: `${m}: \`carry\` takes one anchor, the piece it carries.` }), g.edit === "carry" && g.until === void 0 && s.push({ level: "error", beat: h, message: `${m}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${h + 1}, at: 'release' }).` }), g.at !== void 0 && a(h, g.at, `${m} \`at\``), g.until !== void 0 && a(h, g.until, `${m} \`until\``), g.until !== void 0 && g.duration !== void 0 && s.push({ level: "error", beat: h, message: `${m}: give \`until\` or \`duration\`, not both.` });
    });
  });
  const l = t.map((c) => c && typeof c == "object" && !Array.isArray(c) ? Hu(c, e, !0) : c);
  return [...bo(l, n), ...s];
}
function Hu(t, e, n = !1) {
  const { then: s, ...o } = t, i = (a) => {
    try {
      return e[a.surface].anchor(a.anchor, 0);
    } catch (l) {
      if (n) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      throw l;
    }
  }, r = { ...o };
  return Xs(t.target) && (r.target = i(t.target)), Xs(t.to) && (r.to = i(t.to).x), Xs(t.onto) && (r.onto = i(t.onto).top), r;
}
function A2(t, e, n) {
  let s = 0;
  return t.map((o) => {
    const i = da([o], n.actions).length, r = e.slice(s, s + i);
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
function dx(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = Iu(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(Bt), ...Object.keys(t.gaits ?? {})], o = t.gait ?? "walk";
  if (!s.includes(o)) throw new Error(`persona "${t.name}": ${dt("gait", o, s)}`);
  if (t.mood && !(t.mood in kt)) throw new Error(`persona "${t.name}": ${dt("mood", t.mood, Object.keys(kt))}`);
  const i = t.acting ?? "snappy";
  if (typeof i == "string" && !(i in vn)) throw new Error(`persona "${t.name}": ${dt("acting style", i, Object.keys(vn))}`);
  if (typeof t.stance == "string" && !(t.stance in Jt)) throw new Error(`persona "${t.name}": ${dt("stance", t.stance, Object.keys(Jt))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? Jt[t.stance] : _t(t.stance ?? {}), l = t.mood ? Le(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (u) => w0({ x: u.x, y: u.y, pose: l, style: { ...c, ...u.facing ? { facing: u.facing } : {} }, cast: e }),
    script: (u, d, f = {}) => fa(u, d, {
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
    check: (u) => bo(u, e),
    handPath: (u, d, f) => _u(u, d, { ...f, style: c, cast: e }),
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
      actions: Ou(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const $2 = /* @__PURE__ */ new Set(["x", "y", "walking", "gait"]), Wc = 0.215 + 0.205;
function P2(t, e, n = 1) {
  const { points: s } = oe(t, ft), o = s["hip.left"], i = s["knee.left"], r = s["ankle.left"], a = o && i && r ? Math.hypot(i.x - o.x, i.y - o.y) + Math.hypot(r.x - i.x, r.y - i.y) : Wc * t.height;
  return J0(e, a / Wc, n);
}
function fx(t, e, n, s = {}) {
  const o = fa(t, n, { ...s, height: e.height, reach: s.reach ?? I2(e) }), i = o.tracks.find((b) => b.property === "facing")?.keyframes ?? [], r = (b) => {
    let k = s.facing ?? 1;
    for (const w of i) w.time <= b && (k = w.value);
    return k;
  }, a = Fr(o.keys), l = o.keys.map((b, k) => {
    const w = ey(a[k]);
    return {
      time: b.time,
      pose: r(b.time) < 0 ? G1(w) : w,
      ...b.easing ? { easing: b.easing } : {},
      ...b.act === !1 ? { act: !1 } : {}
    };
  }), { rest: c, start: h, ...u } = s;
  H2(l, a, n, o, e, r, s);
  const d = Ww(t, l, u), f = $u(t, d, o.lines, { energy: s.energy }), g = o.tracks.filter((b) => $2.has(b.property)), p = o.tracks.find((b) => b.property === "walk");
  return { tracks: p ? [...f, ...g, N2(t, p, o.tracks, e, s)] : [...f, ...g], duration: o.duration, lines: o.lines, keys: l, beats: o.beats, effects: o.effects };
}
function I2(t) {
  const e = bt({ "arm.left.spread": 90, "arm.left.elbow": 0, "arm.left.bend": 0, "leg.left.knee": 0 }), n = oe(t, e).points, s = Math.hypot(n["hand.left"].x - n["shoulder.left"].x, n["hand.left"].y - n["shoulder.left"].y), o = Math.hypot(n["toe.left"].x - n["hip.left"].x, n["toe.left"].y - n["hip.left"].y), i = ae({ ...lt, rightShoulder: 90, rightElbow: 0, rightWrist: 0 }, { height: t.height, facing: 1 }), r = ae({ ...lt, rightHip: 90, rightKnee: 0 }, { height: t.height, facing: 1 }), a = { x: (i.hands.right.x + i.fingertips.right.x) / 2, y: (i.hands.right.y + i.fingertips.right.y) / 2 }, l = Math.hypot(a.x - i.shoulders.right.x, a.y - i.shoulders.right.y), c = Math.hypot(r.feet.right.x - r.hip.x, r.feet.right.y - r.hip.y);
  return { arm: l > 0 ? s / l : 1, leg: c > 0 ? o / c : 1 };
}
const O2 = { point: "arm", grab: "arm", put: "arm", write: "arm", swipe: "arm", push: "arm", kick: "leg" }, _2 = /* @__PURE__ */ new Set(["point", "grab", "put", "kick"]);
function H2(t, e, n, s, o, i, r) {
  const a = s.beats;
  if (n.length !== a.length) return;
  const l = new Ct({ id: "placed", tracks: s.tracks.filter((h) => h.property === "x" || h.property === "y") }), c = (h) => {
    const u = l.getStateAtTime(h).values.get(s.tracks[0]?.target ?? "");
    return { x: (r.from ?? 0) + Number(u?.get("x") ?? 0), y: (r.ground ?? 0) + Number(u?.get("y") ?? 0) };
  };
  n.forEach((h, u) => {
    const d = O2[h.do], f = a[u];
    if (!d || f.contact === void 0 || h.do !== "swipe" && !h.target) return;
    const g = f.contact, p = f.release ?? f.contact;
    t.forEach((m, b) => {
      if (m.time < g - 1 || m.time > p + 1) return;
      const k = i(m.time), w = ae(e[b], { height: o.height, facing: k < 0 ? -1 : 1 }), y = c(m.time), v = _2.has(h.do) && h.target ? { x: h.target.x - y.x, y: h.target.y - y.y } : void 0, E = { x: (w.hands.right.x + w.fingertips.right.x) / 2, y: (w.hands.right.y + w.fingertips.right.y) / 2 }, T = v ?? (d === "arm" ? E : w.toes.right), x = k < 0 ? "right" : "left", M = `${d}.${x}`;
      let A = m.pose;
      if (h.do === "point")
        A = Pe(o, A, M, T);
      else if (d === "arm")
        A = Pe(o, F2(o, A, x, T), M, T);
      else
        for (let I = 0; I < 3; I++) {
          const P = oe(o, A).points, O = P[`ankle.${x}`], _ = P[`toe.${x}`];
          A = Pe(o, A, M, { x: T.x - (_.x - O.x), y: T.y - (_.y - O.y) });
        }
      t[b] = { ...m, pose: A };
    });
  });
}
function C2(t, e) {
  const n = bt({ [`arm.${e}.spread`]: 90, [`arm.${e}.elbow`]: 0, [`arm.${e}.bend`]: 0 }), s = oe(t, n).points;
  return Math.hypot(s[`hand.${e}`].x - s[`shoulder.${e}`].x, s[`hand.${e}`].y - s[`shoulder.${e}`].y);
}
const R2 = 5, L2 = 4, W2 = 8;
function F2(t, e, n, s) {
  const o = C2(t, n) * 0.9, i = (a) => {
    const l = oe(t, a).points[`shoulder.${n}`];
    return Math.hypot(s.x - l.x, s.y - l.y) <= o;
  };
  if (i(e)) return e;
  let r = e;
  for (let a = 1; a <= W2; a++)
    if (r = { ...e, lean: (e.lean ?? 0) + R2 * a, bend: (e.bend ?? 0) + L2 * a }, i(r)) return r;
  return r;
}
function N2(t, e, n, s, o) {
  const i = n.find((u) => u.property === "gait"), r = i ? new Ct({ id: `${t}-gait-of`, tracks: [i] }) : void 0, a = (u) => {
    const d = r?.getStateAtTime(u).values.get(t)?.get("gait");
    if (typeof d == "string")
      return Bt[d] ?? o.gaits?.[d] ?? d;
  }, l = e.keyframes, c = [];
  let h = l[0]?.value ?? 0;
  return l.forEach((u, d) => {
    if (d > 0) {
      const f = l[d - 1], g = a((f.time + u.time) / 2), p = Ui(g, s.height), m = P2(s, g);
      h += (u.value - f.value) * (m > 0 ? p / m : 1);
    } else
      h = u.value;
    c.push({ ...u, value: h });
  }), { ...e, keyframes: c };
}
const pt = ["rect", "circle", "text", "line", "path", "image", "custom"], D2 = ["rect", "circle", "line", "path"], pa = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: pt },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: pt },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: pt },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: pt },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: pt },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: pt },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: pt },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: pt },
  scale: { description: "Size, both ways", unit: "factor", types: pt },
  scaleX: { description: "Width factor", unit: "factor", types: pt },
  scaleY: { description: "Height factor", unit: "factor", types: pt },
  skewX: { description: "Slants it sideways", unit: "degrees", types: pt },
  skewY: { description: "Slants it up and down", unit: "degrees", types: pt },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: pt },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: pt },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: pt },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: pt },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: pt },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: pt },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: pt },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: pt },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: pt },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: pt },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: pt },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: pt },
  glowColor: { description: "Colour of the glow", kind: "color", types: pt },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: pt },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: pt },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: pt },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: pt },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: pt },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: D2 },
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
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: pt },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: pt }
}, gr = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, B2 = {
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
function z2(t) {
  const e = t, n = Object.entries(pa).filter(([, o]) => o.types.includes(t.type)).map(([o, { types: i, ...r }]) => ({ name: o, ...r, ...e[o] !== void 0 && typeof e[o] != "object" ? { value: e[o] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [o, i] of Object.entries(t.props ?? {}))
    n.push({ name: o, description: s?.props?.[o]?.description ?? "", ...s?.props?.[o], value: i });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function q2(t) {
  const e = z2(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(gr).filter((n) => e.includes(gr[n]))];
}
function px(t, e) {
  const n = [], s = Object.keys(e);
  for (const o of t) {
    const i = (d) => n.push({ level: "error", track: o.id, message: d }), r = e[o.target];
    if (!r) {
      i(dt("target", o.target, s));
      continue;
    }
    const a = q2(r), l = r.type === "custom" && r.acceptsProp?.(o.property);
    if (!a.includes(o.property) && !l) {
      i(`${o.target}: ${dt("property", o.property, a, B2[o.property])}`);
      continue;
    }
    const c = o.keyframes ?? [];
    for (let d = 1; d < c.length; d++)
      c[d].time < c[d - 1].time && i(`${o.target}.${o.property}: keyframes out of time order (${c[d - 1].time} ms, then ${c[d].time} ms).`);
    const h = pa[gr[o.property] ?? o.property] ?? r.about?.props?.[o.property], u = h && (h.kind ?? "number") === "number";
    for (const d of c) {
      if (u && typeof d.value != "number") {
        i(`${o.target}.${o.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(d.value)} at ${d.time} ms).`);
        break;
      }
      if (u && typeof d.value == "number" && (h.min !== void 0 && d.value < h.min || h.max !== void 0 && d.value > h.max)) {
        n.push({ level: "warning", track: o.id, message: `${o.target}.${o.property}: ${d.value} at ${d.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const xn = (t, e) => t[2] <= -e;
function mr(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function Fc(t, e) {
  if (t.every((s) => xn(s, e))) return t;
  const n = [];
  return t.forEach((s, o) => {
    const i = t[(o + t.length - 1) % t.length], r = xn(s, e), a = xn(i, e);
    r !== a && n.push(mr(i, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function Y2(t, e) {
  if (t.every((o) => xn(o, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((o, i) => {
    const r = xn(o, e);
    if (i > 0) {
      const a = t[i - 1], l = xn(a, e);
      l && !r ? (s.push(mr(a, o, e)), n.push(s), s = []) : !l && r && s.push(mr(a, o, e));
    }
    r && s.push(o);
  }), s.length > 0 && n.push(s), n.filter((o) => o.length >= 2);
}
function Nc(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const o = Math.round(s / n);
  return Array.from({ length: o + 1 }, (i, r) => t + s * r / o);
}
function j2(t, e, n) {
  const s = (o, i) => Math.max(0, Math.min(o.length - 2, o.findIndex((r, a) => a > 0 && i <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function K2(t, e) {
  const n = (s) => {
    const o = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], i = Math.hypot(...o) || 1;
    return [o[0] / i, o[1] / i, o[2] / i];
  };
  return { ...t, vertices: t.vertices.map((s) => jt(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function Rs(t, e, n, s) {
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
function X2(t, e, n) {
  const s = t.faces.map((r) => ({ points: r.corners.map((a) => t.vertices[a]), normal: r.normal })), o = [], i = { x: e.slice(1, -1), z: n.slice(1, -1) };
  for (let r = 0; r + 1 < e.length; r++)
    for (let a = 0; a + 1 < n.length; a++) {
      const l = [], c = /* @__PURE__ */ new Map(), h = (g) => {
        const p = g.map((b) => Math.round(b * 1e6)).join(",");
        let m = c.get(p);
        return m === void 0 && (m = l.length, l.push(g), c.set(p, m)), m;
      }, u = [], d = (g) => g === 0, f = (g, p) => g + 2 === p.length;
      for (const g of s) {
        let p = g.points;
        d(r) || (p = Rs(p, 0, e[r], 1)), p.length && !f(r, e) && (p = Rs(p, 0, e[r + 1], -1)), p.length && !d(a) && (p = Rs(p, 2, n[a], 1)), p.length && !f(a, n) && (p = Rs(p, 2, n[a + 1], -1)), p.length >= 3 && u.push({ corners: p.map(h), normal: g.normal });
      }
      u.length > 0 && o.push({ cell: [r, a], mesh: { vertices: l, faces: u, creases: t.creases, joined: t.joined, walls: i } });
    }
  return o;
}
const U2 = /* @__PURE__ */ new WeakMap(), G2 = /* @__PURE__ */ new WeakMap(), V2 = 48, Cu = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function Ru(t, e, n, s) {
  let o = t.get(e);
  o || t.set(e, o = /* @__PURE__ */ new Map());
  let i = o.get(n);
  return i === void 0 && (o.size >= V2 && o.clear(), o.set(n, i = s())), i;
}
function ga(t, e) {
  const n = Cu(e);
  return Ru(U2, t, n, () => {
    const s = K2(t, e), o = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      o[a] = Math.min(o[a], r[a]), i[a] = Math.max(i[a], r[a]);
    return { key: n, inSpace: s, low: o, high: i };
  });
}
function J2(t, e) {
  const n = t.map((h) => ({ ...h, ...ga(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const u of [0, 1, 2])
    s[u] = Math.min(s[u], h.low[u]), o[u] = Math.max(o[u], h.high[u]);
  const i = Nc(s[0], o[0], e), r = Nc(s[2], o[2], e), a = `${i.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const d = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: j2(i, r, d) }];
    }
    return Ru(G2, h.inSpace, a, () => X2(h.inSpace, i, r)).map((d) => ({ part: h.part, mesh: d.mesh, cut: !0, cell: d.cell }));
  }), c = (s[1] + o[1]) / 2;
  return { pieces: l, middle: ([h, u]) => [(i[h] + i[h + 1]) / 2, c, (r[u] + r[u + 1]) / 2] };
}
const Dc = 4e-3, $i = 0.05, Bc = /* @__PURE__ */ new WeakMap();
function Z2(t) {
  let e = Bc.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((o) => n.normal[0] * (o[0] - s[0]) + n.normal[1] * (o[1] - s[1]) + n.normal[2] * (o[2] - s[2]) <= 1e-6);
  }), Bc.set(t, e)), e;
}
const zc = /* @__PURE__ */ new WeakMap();
function Lu(t) {
  return t.filter(({ mesh: e }) => Z2(e)).map(({ part: e, key: n, inSpace: s, low: o, high: i }) => {
    let r = zc.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), zc.set(s, r)), { part: e, key: n, planes: r, low: o, high: i };
  });
}
function Q2(t, e, n, s) {
  const o = e.reduce((i, r) => [i[0] + r[0] / e.length, i[1] + r[1] / e.length, i[2] + r[2] / e.length], [0, 0, 0]);
  for (const i of s) {
    if (i.part === t || [0, 1, 2].some((a) => o[a] < i.low[a] - $i || o[a] > i.high[a] + $i)) continue;
    if (i.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((u) => a.normal[0] * u[0] + a.normal[1] * u[1] + a.normal[2] * u[2] - a.offset);
      if (c.every((u) => Math.abs(u) <= Dc)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? $i : Dc;
      return c.every((u) => u <= h);
    })) return !0;
  }
  return !1;
}
const qc = /* @__PURE__ */ new WeakMap();
function Wu(t, e, n, s, o) {
  const i = `${s}|${o.map((l) => l.key).join(";")}`;
  let r = qc.get(e);
  r || qc.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(i);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const u = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], d = Math.hypot(...u) || 1;
      return [u[0] / d, u[1] / d, u[2] / d];
    }, c = e.vertices.map((h) => jt(n, h));
    a = e.faces.map((h) => Q2(t, h.corners.map((u) => c[u]), l(h.normal), o)), r.set(i, a);
  }
  return a;
}
const ys = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, yr = Math.PI / 180;
function tk(t, e, n) {
  return {
    toView: (s) => zr(Ie(s, t * 90 * yr), -e * yr),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const Yc = /* @__PURE__ */ new WeakMap(), wo = (t) => Us(t), Us = (t) => {
  let e = Yc.get(t);
  return e || Yc.set(t, e = Ob(t)), e;
};
function St(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? ys[n]?.default ?? 0;
}
function us(t, e) {
  const n = Math.max(0.05, St(t, e, "squash")), s = 1 / Math.sqrt(n), i = [1, 0, 0, 0, 0, 1, St(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    Re([0, St(t, e, "lift"), 0]),
    se(Vt([1, 0, 0], -St(t, e, "pitch"))),
    se(Vt([0, 0, 1], St(t, e, "roll"))),
    i,
    ze([s, n, s]),
    ze(Array(3).fill(Math.max(0, St(t, e, "size"))))
  ].reduce((r, a) => At(r, a));
}
function ma(t, e) {
  const n = us(t, e), s = /* @__PURE__ */ new Map(), o = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: St(t, e, r), bind: l }))), i = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = At(l ? i(l) : n, Re(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, u, d] = r.rotate;
      h && (c = At(c, se(Vt([1, 0, 0], h)))), u && (c = At(c, se(Vt([0, 1, 0], u)))), d && (c = At(c, se(Vt([0, 0, 1], d))));
    }
    for (const { value: h, bind: u } of o)
      if (!(!u.parts.includes(r.id) || h === 0)) {
        if (u.translate && (c = At(c, Re([u.translate[0] * h, u.translate[1] * h, u.translate[2] * h]))), u.rotate) {
          const d = u.rotate.pivot ?? [0, 0, 0], f = u.rotate.axis === "x" ? [1, 0, 0] : u.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, Re(d), se(Vt(f, u.rotate.degrees * h)), Re([-d[0], -d[1], -d[2]])].reduce((g, p) => At(g, p));
        }
        u.scale && (c = At(c, ze([1 + (u.scale[0] - 1) * h, 1 + (u.scale[1] - 1) * h, 1 + (u.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) i(r);
  return s;
}
const Pi = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), ek = Math.cos(35 * yr);
function Fu(t, e, n, s, o = {}) {
  const i = t.derive ? { ...e, ...t.derive(e) } : e, r = ma(t, i), a = n.toView([0, 0, 0]), l = (_) => (W) => [_[0] * W[0] + _[4] * W[1] + _[8] * W[2], _[1] * W[0] + _[5] * W[1] + _[9] * W[2], _[2] * W[0] + _[6] * W[1] + _[10] * W[2]], c = us(t, i), h = o.slice === void 0 ? null : Pr(c), u = h ? t.parts.map((_) => ({ part: _, mesh: Us(_.shape), local: At(h, r.get(_.id)), whole: _.shape.type === "tube" })) : void 0, d = u ? J2(u, o.slice) : void 0, f = u ? Lu(u.map((_) => ({ part: _.part.id, mesh: _.mesh, ...ga(_.mesh, _.local) }))) : void 0, g = (_, W, B, K) => {
    const V = (X) => n.toView(jt(B, X)), j = W.vertices.map(V), S = j.map((X) => n.toScreen(X)), C = o.perspective ? o.near : void 0, L = (X) => X.map((et) => n.toScreen(et)), $ = (X) => C === void 0 ? X : Fc(X, C), R = (X) => C === void 0 ? [X] : Y2(X, C), N = l(B), z = W.faces.map((X) => {
      const et = n.toView(N(X.normal)), ct = [et[0] - a[0], et[1] - a[1], et[2] - a[2]], ht = Math.hypot(...ct) || 1;
      return [ct[0] / ht, ct[1] / ht, ct[2] / ht];
    }), D = f && K ? Wu(_.id, W, K, Cu(K), f) : void 0, q = (X) => D?.[X] ?? !1, U = z.map((X, et) => {
      if (q(et)) return !1;
      if (!o.perspective) return X[2] > 1e-6;
      const ht = W.faces[et].corners.reduce((yt, gt) => [yt[0] + j[gt][0], yt[1] + j[gt][1], yt[2] + j[gt][2]], [0, 0, 0]);
      return -(X[0] * ht[0] + X[1] * ht[1] + X[2] * ht[2]) > 1e-9;
    }), F = (X) => W.faces[X].corners.reduce((et, ct) => et + j[ct][2], 0) / W.faces[X].corners.length, G = W.faces.map((X, et) => ({ face: X, i: et })).filter(({ i: X }) => U[X]).map(({ face: X, i: et }) => ({
      i: et,
      solved: {
        points: C === void 0 ? X.corners.map((ct) => S[ct]) : L($(X.corners.map((ct) => j[ct]))),
        depth: F(et),
        tone: 0.72 + 0.33 * Math.max(0, z[et][0] * Pi[0] + z[et][1] * Pi[1] + z[et][2] * Pi[2])
      }
    })).filter((X) => X.solved.points.length >= 3).sort((X, et) => X.solved.depth - et.solved.depth);
    if (o.light) {
      const X = l(B);
      for (const { i: et, solved: ct } of G) {
        const ht = W.faces[et].corners, yt = ht.reduce((zo, Ju) => {
          const qo = jt(B, W.vertices[Ju]);
          return [zo[0] + qo[0] / ht.length, zo[1] + qo[1] / ht.length, zo[2] + qo[2] / ht.length];
        }, [0, 0, 0]), gt = X(W.faces[et].normal), Kt = Math.hypot(...gt) || 1, _n = o.light(yt, [gt[0] / Kt, gt[1] / Kt, gt[2] / Kt]);
        ct.light = _n.light, ct.fog = _n.fog;
      }
    }
    const Y = G.map((X) => X.solved), nt = nk(W), ot = [], it = [];
    for (const [X, et] of nt) {
      const ct = et.filter((yt) => U[yt]).length;
      if (ct === 0) continue;
      const ht = et.length === 2 && ct === 2 && W.creases !== !1 && z[et[0]][0] * z[et[1]][0] + z[et[0]][1] * z[et[1]][1] + z[et[0]][2] * z[et[1]][2] < ek;
      et.length === 1 && (W.joined || ik(W, X)) || (et.length === 1 || ct === 1 || ht) && (ot.push(X.split("-").map(Number)), it.push(et.filter((yt) => U[yt]).reduce((yt, gt) => F(gt) > F(yt) ? gt : yt)));
    }
    const rt = (X) => W.faces.findIndex((et) => et.corners.length > 4 && Math.sign(ak(W.vertices[X], et.normal)) > 0), H = (W.marks ?? []).filter(([X]) => rt(X) < 0 || U[rt(X)]), J = ([X, et]) => C === void 0 ? [[S[X], S[et]]] : R([j[X], j[et]]).map(L), tt = H.flatMap(J), st = (X) => C === void 0 ? [X.map((et) => S[et])] : R(X.map((et) => j[et])).map(L);
    if (o.slice !== void 0) {
      const X = /* @__PURE__ */ new Map();
      ot.forEach((et, ct) => X.set(it[ct], [...X.get(it[ct]) ?? [], et]));
      for (const { i: et, solved: ct } of G) {
        ct.edges = Kc(X.get(et) ?? []).flatMap(st);
        const ht = W.faces[et].corners;
        ct.center = ht.reduce((gt, Kt) => [gt[0] + j[Kt][0] / ht.length, gt[1] + j[Kt][1] / ht.length, gt[2] + j[Kt][2] / ht.length], [0, 0, 0]), ct.normal = z[et];
        const yt = G[G.length - 1].i;
        ct.marks = H.filter(([gt]) => (rt(gt) >= 0 ? rt(gt) : yt) === et).flatMap(J);
      }
    }
    const Q = _.glow ? Math.max(0, Math.min(1, St(t, i, _.glow.control))) : 0, at = _.fade ? Math.max(0, Math.min(1, St(t, i, _.fade.control))) : 0, Z = _.fade ? Math.max(0, Math.min(1, _.fade.from + (_.fade.to - _.fade.from) * at)) : 1;
    return {
      part: _,
      depth: j.reduce((X, et) => X + et[2], 0) / Math.max(1, j.length),
      faces: Y,
      edges: Kc(ot).flatMap(st),
      marks: tt,
      glow: Q,
      opacity: Z,
      ..._.shape.type === "tube" ? { spine: rk(R(_.shape.points.map(V)).map(L)) } : {},
      ...W.walls ? { cut: !0 } : {}
    };
  }, p = new Map(u?.map((_) => [_.part.id, _.local])), b = (d ? d.pieces.map((_) => ({
    part: _.part,
    mesh: _.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: _.cut ? c : r.get(_.part.id),
    local: _.cut ? $o() : p.get(_.part.id),
    cell: _.cell
  })) : t.parts.map((_) => ({ part: _, mesh: Us(_.shape), m: r.get(_.id), local: void 0, cell: void 0 }))).map((_) => ({ cell: _.cell, solved: g(_.part, _.mesh, _.m, _.local) })), k = b.map((_) => _.solved), w = (_) => _.filter((W) => W.faces.length > 0 && W.opacity > 0.01).sort((W, B) => W.depth - B.depth);
  let y;
  if (d) {
    const _ = new Map(t.parts.map((B) => {
      const K = r.get(B.id), V = Us(B.shape).vertices;
      return [B.id, V.reduce((j, S) => j + n.toView(jt(K, S))[2], 0) / Math.max(1, V.length)];
    })), W = /* @__PURE__ */ new Map();
    for (const B of b) {
      const K = B.cell.join(",");
      W.has(K) || W.set(K, { cell: B.cell, parts: [] }), W.get(K).parts.push(B.solved), B.solved.depth = _.get(B.solved.part.id);
    }
    y = [...W.values()].map(({ cell: B, parts: K }) => ({ depth: n.toView(jt(c, d.middle(B)))[2], parts: w(K) })).filter((B) => B.parts.length > 0);
  }
  const v = {};
  for (const [_, W] of Object.entries(t.anchors ?? {})) {
    const B = W.part ? r.get(W.part) : us(t, i);
    if (!B) throw new Error(`prop rig: anchor "${_}" is on "${W.part}", which is not a part`);
    const K = n.toView(jt(B, W.at));
    v[_] = { point: n.toScreen(K), depth: K[2] };
  }
  const [E, T] = t.footprint ?? [t.length * 0.45, t.length], x = Math.max(0, St(t, i, "lift")), M = Math.max(0, St(t, i, "size")) / (1 + x * 0.8), A = Array.from({ length: 24 }, (_, W) => {
    const B = Math.PI * 2 * W / 24;
    return n.toView([Math.cos(B) * E * 0.55 * M, 0, Math.sin(B) * T * 0.55 * M]);
  }), I = o.perspective ? o.near : void 0, P = {
    points: (I === void 0 ? A : Fc(A, I)).map((_) => n.toScreen(_)),
    opacity: 0.16 * M
  }, O = k.filter((_) => _.part.seeThrough && _.opacity > 0.01).flatMap((_) => _.faces.map((W) => W.points));
  return { under: w(k.filter((_) => !_.part.overRider)), over: w(k.filter((_) => _.part.overRider)), ...y ? { cells: y } : {}, anchors: v, openings: O, shadow: P, pxPerUnit: s, sizePx: t.height * s };
}
const jc = /* @__PURE__ */ new WeakMap();
function nk(t) {
  let e = jc.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let o = 0; o < s.length; o++) {
        const i = s[o], r = s[(o + 1) % s.length], a = i < r ? `${i}-${r}` : `${r}-${i}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    jc.set(t, e);
  }
  return e;
}
function sk(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = ma(t, n), o = Pr(us(t, n)) ?? $o(), i = (r) => Math.max(0, Math.min(1, r));
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
function ok(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = ma(t, n), o = us(t, n), i = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : o;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    i[r] = jt(l, a.at);
  }
  return i;
}
function ik(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((i) => t.vertices[Number(i)]), o = (i, r) => r.some((a) => Math.abs(n[i] - a) < 1e-6 && Math.abs(s[i] - a) < 1e-6);
  return o(0, t.walls.x) || o(2, t.walls.z);
}
function rk(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const ak = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function Kc(t) {
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
function Nu(t, e) {
  if (!t.loose?.size) return;
  const n = {};
  for (const [s, o] of t.loose)
    n[s] = { x: e[`piece.${o}.x`] ?? 0, y: e[`piece.${o}.y`] ?? 0, rotate: e[`piece.${o}.rotate`] ?? 0, opacity: e[`piece.${o}.opacity`] ?? 1 };
  return n;
}
function Du(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...ys, ...t.rig.controls })) {
    const { bind: o, ...i } = s;
    e[n] = i;
  }
  return e;
}
function lk(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, o = e.rig.height * n * 1.6, i = Du(e), r = {};
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
      const u = c.props ?? {};
      l.translate(s / 2, o), ru(l, bs(e, u, n), { ...a, time: h, loose: Nu(c, u) });
    }
  };
}
function bs(t, e, n) {
  const s = tk(St(t.rig, e, "turn"), St(t.rig, e, "tilt"), n);
  return Fu(t.rig, e, s, n);
}
function ya(t, e, n) {
  const s = { ...t.props };
  let o = 0, i = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? o = c : l === "y" ? i = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + o, y: t.y + t.height + i }, a = bs(t.prop, s, t.propScale);
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
function gx(t, e, n, s, o = {}) {
  const i = ya(e, n, s);
  return t.save(), t.translate(i.origin.x, i.origin.y), ru(t, i.solved, {
    ...e.propDraw,
    time: n.time,
    loose: Nu(e, i.values),
    // The rider is drawn in scene px.
    rider: o.rider ? (r) => {
      r.save(), r.translate(-i.origin.x, -i.origin.y), o.rider(r), r.restore();
    } : void 0
  }), t.restore(), i;
}
const Un = {
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
}, ck = 400, hk = 0.2;
function mx(t, e = {}) {
  const { prop: n } = t, s = Du(n), o = Object.keys(s), i = Object.keys(n.rig.anchors ?? {}), r = n.rig.parts.map((E) => E.id), a = ms(), l = Fo(a), c = e.tracks?.length ? new Ct({ id: `${n.kind}-surface`, tracks: e.tracks }) : void 0, h = Math.max(0, ...(e.tracks ?? []).flatMap((E) => E.keyframes.map((T) => T.time))), u = /* @__PURE__ */ new Map(), d = /* @__PURE__ */ new Map();
  t.loose = d;
  const f = t.props, g = (E) => {
    const T = { ...t.props };
    let x = 0, M = 0;
    if (c) {
      const A = c.getStateAtTime(Math.min(E, h));
      for (const I of A.values.values())
        for (const [P, O] of I)
          typeof O == "number" && (P === "x" ? x = O : P === "y" ? M = O : P in T && (T[P] = O));
    }
    for (const A of o) a.keys(A)?.length && (T[A] = a.valueAt(A, E));
    return { values: T, origin: { x: t.x + t.width / 2 + x, y: t.y + t.height + M } };
  }, p = (E) => {
    const { kind: T, rest: x } = In(E), M = (A) => De(n.kind, E, Un, A);
    if (T === "box") {
      if (x) throw M("box takes no arguments");
      return { kind: T };
    }
    if (T === "anchor") {
      if (!i.includes(x)) throw M(dt(`${n.kind} anchor`, x, i));
      return { kind: T, name: x };
    }
    if (T === "part") {
      if (!r.includes(x)) throw M(dt(`${n.kind} part`, x, r));
      return { kind: T, name: x };
    }
    if (T === "control") {
      if (!o.includes(x)) throw M(dt(`${n.kind} control`, x, o));
      return { kind: T, name: x };
    }
    throw M();
  }, m = (E) => {
    const T = (n.rig.controls[E]?.bind ?? []).flatMap((M) => M.parts), x = n.rig.parts.filter((M) => M.glow?.control === E).map((M) => M.id);
    return /* @__PURE__ */ new Set([...T, ...x]);
  }, b = /* @__PURE__ */ new Map(), k = (E) => {
    let T = b.get(E);
    if (!T) {
      const x = g(E);
      b.set(E, T = { ...x, solved: bs(n, x.values, t.propScale) });
    }
    return T;
  }, w = (E, T) => {
    const x = p(E), { values: M, origin: A, solved: I } = k(T);
    if (x.kind === "box") return wt(A.x - t.width / 2, A.y - t.height, t.width, t.height);
    if (x.kind === "anchor") {
      const _ = I.anchors[x.name].point, W = hk * t.propScale;
      return wt(A.x + _.x - W / 2, A.y + _.y - W / 2, W, W);
    }
    if (x.kind === "part") return O(/* @__PURE__ */ new Set([x.name]), `part "${x.name}" is`);
    const P = m(x.name);
    if (P.size === 0) return wt(A.x - t.width / 2, A.y - t.height, t.width, t.height);
    return O(P, `the parts control "${x.name}" moves are`);
    function O(_, W) {
      const B = [...I.under, ...I.over].filter((C) => _.has(C.part.id)).flatMap((C) => C.faces.flatMap((L) => L.points));
      if (B.length === 0) {
        const C = Number.isFinite(T) ? `at ${T} ms` : "after its edits";
        throw new Error(`${n.kind}: ${W} turned away from the viewer ${C}; aim at an anchor (${i.map((L) => `anchor:${L}`).join(", ") || "none"}) or box`);
      }
      const K = B.map((C) => C.x), V = B.map((C) => C.y), j = Math.min(...K), S = Math.min(...V);
      return wt(A.x + j, A.y + S, Math.max(...K) - j, Math.max(...V) - S);
    }
  }, y = (E, T) => {
    try {
      return w(E, T);
    } catch {
      return;
    }
  }, v = {
    kind: "prop",
    prop: t,
    about: Un,
    target: t,
    box: wt(t.x, t.y, t.width, t.height),
    anchor(E, T = 1 / 0) {
      return w(E, T);
    },
    piece(E) {
      const T = p(E);
      if (T.kind !== "part") throw new Error(`${n.kind}: a piece is a part, part:ID (${r.slice(0, 6).map((I) => `part:${I}`).join(", ")}…), not "${E}"`);
      const x = u.get(T.name);
      if (x) return x;
      const M = [T.name];
      for (let I = 0; I < M.length; I++) for (const P of n.rig.parts) P.parent === M[I] && !M.includes(P.id) && M.push(P.id);
      const A = { id: u.size + 1, part: T.name, home: w(E, 0) };
      u.set(T.name, A);
      for (const I of M) d.set(I, A.id);
      for (const I of ["x", "y", "rotate"]) f[`piece.${A.id}.${I}`] = 0;
      return f[`piece.${A.id}.opacity`] = 1, A;
    },
    edit(E, T, x) {
      if (!(E in Un.edits)) throw No(n.kind, E, Un);
      const M = Array.isArray(T) ? T : [T];
      if (M.length === 0) throw new Error(`${n.kind}.edit: ${E} takes at least one anchor`);
      if (b.clear(), E === "move" || E === "fling") {
        if (M.length > 1) throw new Error(`${n.kind}.edit: ${E} takes one part anchor`);
        const A = v.piece(M[0]);
        if (E === "fling") return v.fling(A, x);
        const I = x.to;
        if (!I) throw new Error(`${n.kind}.edit: move needs \`to\`, an anchor name or { x, y }`);
        const P = typeof I == "string" ? w(I, x.at) : void 0;
        return v.move(A, { ...x, to: P ? { x: P.left + P.width / 2, y: P.top + P.height / 2 } : I });
      }
      for (const A of M) {
        const I = p(A);
        if (I.kind !== "control") throw new Error(`${n.kind}.edit: ${E} takes control anchors (control:${o.join(", control:")}), not "${A}"`);
        const P = s[I.name];
        let O;
        if (E === "set") {
          if (typeof x.value != "number" || !Number.isFinite(x.value)) throw new Error(`${n.kind}.edit: set needs \`value\`, a number (${I.name}: ${P.description})`);
          O = x.value;
        } else
          O = x.on === !1 ? P.default ?? P.min ?? 0 : P.max ?? 1;
        a.tween(I.name, g(x.at).values[I.name], O, x, ck);
      }
      return v;
    },
    follow(E, T) {
      return b.clear(), l.follow(E, T), v;
    },
    fling(E, T) {
      return b.clear(), l.fling(E, T), v;
    },
    move(E, T) {
      return b.clear(), l.move(E, T), v;
    },
    ride(E, T, x) {
      const M = [
        ...o.flatMap((I) => hs(a.keys(I))),
        ...(e.tracks ?? []).flatMap((I) => hs(I.keyframes.filter((P) => typeof P.value == "number")))
      ];
      if (M.length === 0) return E;
      const A = [...i.map((I) => `anchor:${I}`), ...r.map((I) => `part:${I}`)].flatMap((I) => {
        const P = y(I, 0);
        return P ? [{ top: P.top, offset: (O) => (y(I, O)?.top ?? P.top) - P.top, windows: M }] : [];
      });
      return ha(E, T, { ground: x.ground, every: x.every ?? Ne, floors: A });
    },
    tracks: a.tracks
  };
  return v;
}
const uk = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function Oe(t) {
  const e = { ...uk, ...t.colors }, n = [], { forwardMost: s, backMost: o, top: i } = Bu(t);
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
      const b = h + (u - h) * 0.15, k = h + (u - h) * 0.55;
      n.push({
        id: `seat-back-${m}`,
        shape: { type: "panel", points: [[b, d + 0.05], [k, d + 0.05], [k - 0.08, f - 0.06], [b + 0.06, f - 0.04]], facing: p > 0 ? "left" : "right" },
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
      n.push({ id: `headlight-${b}`, shape: { type: "panel", points: m, facing: "front" }, at: [b * h, 0, f], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${b}`, shape: { type: "panel", points: m, facing: "back" }, at: [b * h, 0, g], fill: la(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
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
    actions: fk(t),
    acting: dk,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function Bu(t) {
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
const dk = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Ls(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
const Xc = 0.4;
function fk(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = Bu(t), o = (n - s) / 2, i = (a, l, c) => {
    const h = a.exaggeration;
    let u = l;
    return a.facing() !== c && (u = a.turnTo(u, c > 0 ? "right" : "left")), a.key(u + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), Ls(a, u, u + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: u + 150, x: a.x - c * o * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), u + 260;
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
        const u = i(a, c, h), d = a.exaggeration, f = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, f / (l.speed ?? Xc));
        return a.effect({ kind: "dust", time: u, x: a.x - h * o * a.scale, y: a.floor, length: 600, direction: -h }), a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.05 * d, lean: 0.12 * d }, { act: !1, easing: "ease-out" }), a.key(u + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * d, squash: 1.02 }, { act: !1 }), Ls(a, u, u + g, l.to, "ease-in-out", e), r(a, u + g, !1), { end: u + g + 380, contact: u, release: u + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = i(a, c, h), d = a.exaggeration, f = a.x, g = Math.abs(l.to - f), p = l.for ?? Math.max(600, g / (l.speed ?? Xc * 1.2)), m = u + p * 0.55, b = f + (l.to - f) * 0.65;
        return a.key(u + 140, { pitch: -1.5 * d, squash: 1 + 0.06 * d, lean: 0.14 * d }, { act: !1, easing: "ease-out" }), Ls(a, u, m, b, "ease-in", e), a.key(m + 80, { pitch: -7 * d, lean: -0.12 * d, squash: 0.94 }, { act: !1, easing: "ease-out" }), Ls(a, m, u + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: b, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: u + p, x: l.to + h * o * a.scale, y: a.floor, length: 600, direction: h }), r(a, u + p, !0), { end: u + p + 380, contact: m, release: u + p };
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
        return a.effect({ kind: "honk", time: c + 60, x: a.x + (u || 1) * o * a.scale, y: a.floor - 0.7 * a.scale, length: 700, direction: u || 1 }), { end: c + 520, contact: c + 60 };
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
function pk(t = {}) {
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
function gk(t = {}) {
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
function mk(t = {}) {
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
function yk(t = {}) {
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
function bk(t = {}) {
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
function wk(t = {}) {
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
function kk(t = {}) {
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
function vk(t = {}) {
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
function Mk(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, o = t.canopy?.shape === "tall", i = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = Ve(t.canopy?.seed ?? 7), a = [
    { id: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.06, e * 0.5, 0], [-0.02, e, 0]], radius: n, segments: 8 }, fill: i.trunk },
    { id: "branch", parent: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.45, 0.4, 0.1]], radius: n * 0.45, segments: 6 }, at: [0.04, e * 0.62, 0], fill: i.trunk },
    { id: "canopy", parent: "trunk", shape: { type: "ellipsoid", radii: [s, s * (o ? 1.35 : 0.88), s], segments: 14 }, at: [-0.02, e + s * 0.55, 0], fill: i.leaves }
  ], l = t.canopy?.lobes ?? 7;
  for (let h = 0; h < l; h++) {
    const u = Math.PI * 2 * h / l + r.next() * 0.6, d = (r.next() - 0.25) * s * (o ? 1.1 : 0.7), f = s * (0.48 + r.next() * 0.22), g = [Math.cos(u) * s * 0.78, d, Math.sin(u) * s * 0.6];
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
    actions: Sk(),
    acting: xk,
    colors: { body: i.leaves }
  };
}
const xk = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Sk() {
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
          const h = 0.55 + 0.45 * Math.sin(c / i * Math.PI * 2.3), u = Math.sin(c / 170) * 0.35, d = -o * 9 * r * (h + u * o);
          e.key(s + c, { sway: d, canopySway: l * 1.3 }, { act: !1, easing: "ease-in-out" }), l = d;
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
function Tk(t = {}) {
  const e = t.width ?? 4, n = t.depth ?? 3.2, s = t.wallHeight ?? 2.5, o = t.roofHeight ?? 1.5, i = t.overhang ?? 0.25, r = { walls: "#f1d9a8", roof: "#b8433a", door: "#7a4b2a", doorway: "#3a2a22", glass: "#bfe3f2", lit: "#ffd66b", chimney: "#9b5a45", ...t.colors }, a = n / 2 + 0.01, l = t.door?.width ?? 0.9, c = t.door?.height ?? 1.9, h = t.door?.at ?? 0, u = t.windows ?? [
    { at: -1.25, low: 1, width: 0.8, height: 0.8 },
    { at: 1.25, low: 1, width: 0.8, height: 0.8 }
  ], d = [
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
    const p = s + o * (1 - Math.abs(f.back) / (n / 2 + i)), m = s + o + 0.45;
    d.push({ id: "chimney", shape: { type: "box", size: [0.42, m - p + 0.3, 0.42] }, at: [f.at, (m + p - 0.3) / 2, f.back], fill: r.chimney, layer: 1 });
  }
  const g = {
    parts: d,
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
    actions: Ak(!!f),
    acting: Ek,
    colors: { body: r.walls }
  };
}
const Ek = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Ak(t) {
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
function $k(t = {}) {
  const e = t.width ?? 0.46, n = t.depth ?? 0.46, s = t.seatHeight ?? 0.46, o = t.backHeight ?? 0.95, i = { wood: "#8a5a3b", seat: "#c48a4a", ...t.colors }, r = 0.05, a = 0.025, l = [
    { id: "seat", shape: { type: "box", size: [e, r, n] }, at: [0, s - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, o - s, r] }, at: [0, (o + s) / 2, -n / 2 + r / 2], fill: i.wood }
  ];
  for (const [h, u, d] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    l.push({ id: `leg-${d}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - r, 0]], radius: a, segments: 6 }, at: [h * (e / 2 - a * 1.5), 0, u * (n / 2 - a * 1.5)], fill: i.wood });
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
    actions: Ik(),
    acting: Pk,
    colors: { body: i.seat }
  };
}
const Pk = {
  depth: { tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Ik() {
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
function Ok(t = {}) {
  const e = t.width ?? 1.4, n = t.depth ?? 0.7, s = t.height ?? 0.75, o = { wood: "#8a5a3b", top: "#a9754a", knob: "#2b2b2b", ...t.colors }, i = 0.04, r = 0.03, a = 0.14, l = e * 0.4, c = [
    { id: "top", shape: { type: "box", size: [e, i, n] }, at: [0, s - i / 2, 0], fill: o.top },
    // The drawer: a box under the top on the left, sliding forward on its control.
    { id: "drawer", shape: { type: "box", size: [l, a, n * 0.8] }, at: [-e / 2 + l / 2 + 0.05, s - i - a / 2, 0], fill: o.wood },
    { id: "knob", parent: "drawer", shape: { type: "ellipsoid", radii: [0.02, 0.02, 0.015], segments: 8 }, at: [0, 0, n * 0.4 + 0.012], fill: o.knob, outline: 0.6 }
  ];
  for (const [u, d, f] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    c.push({ id: `leg-${f}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - i, 0]], radius: r, segments: 6 }, at: [u * (e / 2 - r * 2), 0, d * (n / 2 - r * 2)], fill: o.wood });
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
        run(u, d, f) {
          return u.key(f + 400, { drawer: d.open ? 1 : 0 }, { easing: d.open ? "ease-out" : "ease-in" }), { end: f + 500, contact: f + 400 };
        }
      }
    },
    acting: _k,
    colors: { body: o.top }
  };
}
const _k = {
  depth: { drawer: 1, roll: 1, squash: 1, size: 0 },
  limits: { drawer: 0.08, roll: 1, squash: 0.04 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Hk(t = {}) {
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
        run(h, u, d) {
          const f = u.for ?? 700, g = h.exaggeration;
          return h.key(d + 90, { give: 1 - 0.18 * g }, { act: !1, easing: "ease-out" }), h.key(d + f * 0.45, { give: 1 + 0.05 * g }, { act: !1, easing: "ease-in-out" }), h.key(d + f * 0.7, { give: 1 - 0.04 * g }, { act: !1, easing: "ease-in-out" }), h.key(d + f, { give: 1 }), { end: d + f, contact: d + 90 };
        }
      }
    },
    acting: Ck,
    colors: { body: i.blanket }
  };
}
const Ck = {
  depth: { give: 1, roll: 1, squash: 1, size: 0 },
  limits: { give: 0.03, roll: 0.5, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Rk(t = {}) {
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
    actions: Wk(),
    acting: Lk,
    colors: { body: o.door }
  };
}
const Lk = {
  depth: { open: 1, roll: 1, squash: 1, size: 0 },
  limits: { open: 0.08, roll: 0.6, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Wk() {
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
const zu = 1.4;
function Fk(t = {}) {
  const e = t.width ?? 0.5, n = t.seatHeight ?? 0.5, s = t.wheelRadius ?? 0.3, o = 0.08, i = { frame: "#2b2f36", seat: "#3c6ea5", tyre: "#1f2328", ...t.colors }, r = 0.04, a = 0.018, l = 0.44, c = n + 0.5, h = -0.08, u = e / 2 + 0.06, d = [
    { id: "seat", shape: { type: "box", size: [e, r, l] }, at: [0, n - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, c - n - 0.02, r] }, at: [0, (c + n) / 2, -l / 2 + r / 2], fill: i.seat },
    // Footrests: a bar in front, low, with two plates.
    { id: "footrest", shape: { type: "box", size: [e * 0.8, 0.02, 0.14] }, at: [0, 0.12, l / 2 + 0.22], fill: i.frame }
  ];
  for (const [p, m] of [[-1, "left"], [1, "right"]]) {
    const b = p * u, k = (w, y, v = a) => {
      d.push({ id: w, shape: { type: "tube", points: y, radius: v, segments: 6 }, fill: i.frame, outline: 0.7 });
    };
    k(`post-${m}`, [[b, n - 0.1, -l / 2], [b, c + 0.04, -l / 2], [b, c + 0.04, -l / 2 - 0.14]]), k(`rail-${m}`, [[b, n - 0.03, -l / 2], [b, n - 0.03, l / 2]]), k(`leg-${m}`, [[b, n - 0.03, l / 2], [b * 0.85, o, l / 2 + 0.06]]), k(`strut-${m}`, [[b * 0.85, o + 0.08, l / 2 + 0.04], [b * 0.8, 0.13, l / 2 + 0.22]]), k(`armrest-${m}`, [[b, n + 0.22, -l / 2 + 0.02], [b, n + 0.22, l / 2 - 0.08]], a * 1.3), d.push({
      id: `wheel-${m}`,
      shape: { type: "cylinder", radius: s, length: 0.04, axis: "x", segments: 20, spokes: 8 },
      at: [b + p * 0.03, s, h],
      ink: i.tyre,
      outline: 1.3
    }), d.push({ id: `rim-${m}`, shape: { type: "cylinder", radius: s * 0.9, length: 0.012, axis: "x", segments: 20 }, at: [p * 0.045, 0, 0], parent: `wheel-${m}`, ink: i.frame, outline: 0.8 }), d.push({
      id: `castor-${m}`,
      shape: { type: "cylinder", radius: o, length: 0.03, axis: "x", segments: 12, spokes: 3 },
      at: [b * 0.85, o, l / 2 + 0.06],
      fill: i.tyre
    });
  }
  const f = d.map((p) => p.id).filter((p) => !p.startsWith("rim-")), g = {
    parts: d,
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
    footprint: [u * 2 + 0.1, l + 0.4],
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
    actions: Dk(s),
    acting: Nk,
    colors: { body: i.seat, ink: i.frame },
    wheelRadius: s,
    moves: { roll: { speed: zu, perMetre: { wheelSpin: 180 / (Math.PI * s) } } }
  };
}
const Nk = {
  depth: { wheelSpin: 0, tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Uc(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
function Dk(t) {
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
        const r = Math.abs(n.to - e.x), a = n.for ?? Math.max(300, r / (n.speed ?? zu * e.scale / 1e3));
        return e.key(i + 150, { tip: 1.5 * e.exaggeration }, { act: !1, easing: "ease-out" }), Uc(e, i, i + a, n.to, "ease-in-out", t), e.key(i + a, { tip: 0 }, { easing: "ease-out" }), { end: i + a };
      }
    },
    brake: {
      summary: "Stops short at `to`: the wheels lock and it skids the last bit, tipping forward a touch.",
      needs: ["to"],
      uses: ["for"],
      run(e, n, s) {
        if (Math.sign(n.to - e.x) === 0) return { end: s };
        const i = n.for ?? 500;
        return Uc(e, s, s + i, n.to, "ease-out", t, !0), e.key(s + i, { tip: 0 }, { easing: "ease-out" }), e.effect({ kind: "dust", time: s + i * 0.5, x: n.to, y: e.floor, length: 500 }), { end: s + i, contact: s + i };
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
function Bk(t = {}) {
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
    actions: zk(),
    acting: qu,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: xe * 1e3 } } }
  };
}
const qu = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, xe = 2.6;
function zk() {
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
function qk(t = {}) {
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
    actions: jk(),
    acting: qu,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: xe * 1e3 } } }
  };
}
const Yk = 3.2;
function jk() {
  const t = (n, s, o, i) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", o, r + Yk * (o - s) * (i ? 0.5 : 1), i);
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
        const i = s.for ?? 2400, r = 2.2 * n.exaggeration, a = n.facing() || 1, l = 16, c = n.x, h = n.values.lift, u = n.values.pitch;
        for (let d = 1; d <= l; d++) {
          const f = Math.PI * 2 * d / l, g = o + i * d / l;
          n.key(g, { lift: h + r * (1 - Math.cos(f)), pitch: u + 360 * d / l }, { act: !1 }), n.move(o + i * (d - 1) / l, g, c + a * (r * Math.sin(f) + d / l * r * 1.2) * n.scale);
        }
        return n.key(o + i + 1, { pitch: u }, { act: !1 }), t(n, o, o + i), { end: o + i + 1 };
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
const ws = ["walk", "trot", "canter", "gallop"], yx = ws, Yu = ["fl", "fr", "hl", "hr"], Bo = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, Ee = Math.PI / 180;
function ba(t, e) {
  return 4 * t * Math.sin(Bo[e].swing * Ee);
}
function Qe(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, o = s + t.body.rise, i = (u, d) => [d * u[0], u[1], u[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, o, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((u, d, f) => t.neck.radius * (1.25 - 0.4 * d / Math.max(1, f.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...Xk(t, n, o)
  ];
  t.mane && r.push({ id: "mane", parent: "neck", shape: { type: "tube", points: t.mane.points, radius: t.mane.radius, segments: 6 }, fill: n.dark, outline: 0.7 }), t.muzzle && r.push({ id: "muzzle", parent: "head", shape: { type: "ellipsoid", radii: t.muzzle.radii, segments: 10 }, at: t.muzzle.at, fill: n.muzzle, outline: 0.8 });
  for (const u of [1, -1]) {
    const d = u > 0 ? "left" : "right", f = t.ears.rotate ? i(t.ears.rotate, 1).map((g, p) => p === 2 ? u * g : g) : void 0;
    r.push(
      { id: `ear-${d}`, parent: "head", shape: { type: "ellipsoid", radii: t.ears.radii, segments: 8 }, at: i(t.ears.at, u), rotate: f, fill: n.coat, outline: 0.7 },
      { id: `eye-${d}`, parent: "head", shape: { type: "ellipsoid", radii: [t.eyes.size * 0.8, t.eyes.size, t.eyes.size * 0.9], segments: 8 }, at: i(t.eyes.at, u), fill: "#1d1d22", outline: 0.4 }
    );
  }
  r.push(...t.extras?.(n) ?? []);
  const a = {
    walk: { description: "Phase of the stride, in full cycles (keyed in step with the distance covered)", unit: "cycles" },
    walking: { description: "How much of the gait is applied: 0 standing, 1 moving", unit: "0..1", min: 0, max: 1 },
    gait: { description: `Which gait: ${t.gaits.map((u) => `${ws.indexOf(u)} ${u}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: te, rotate: { axis: "x", degrees: 1 / te.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: te, rotate: { axis: "y", degrees: 1 / te.length } }] },
    // The ears hinge at their base: laid back on a run, on a spring behind the motion.
    ears: { description: "Ears pricked forward (+) or laid back (−), on a spring behind the motion", unit: "degrees", bind: [{ parts: ["ear-left", "ear-right"], rotate: { axis: "x", degrees: 1, pivot: [0, -t.ears.radii[1], 0] } }] }
  };
  for (const u of Yu) {
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
      back: { at: [0, o + t.body.radii[1], -t.body.radii[2] * 0.05] },
      head: { part: "head", at: [0, 0, 0] },
      mouth: { part: t.muzzle ? "muzzle" : "head", at: t.muzzle ? [0, 0, t.muzzle.radii[2]] : [0, 0, t.head.radii[2]] },
      front: { at: [0, o, t.body.radii[2]] },
      ...t.anchors
    },
    derive: (u) => Uk(u, t, s)
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
    actions: { ...Vk(t, h), ...t.actions?.(h) },
    acting: ju,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [
      { control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 },
      { control: "ears", of: "x", per: 1.4, stiffness: 150, damping: 8, limit: 45 }
    ],
    moves: Kk(t, s)
  };
}
function Kk(t, e) {
  const n = (o) => {
    const i = ba(e, o);
    return {
      speed: i / (Bo[o].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: ws.indexOf(o) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / i }
    };
  }, s = Object.fromEntries(t.gaits.map((o) => [o === "gallop" && !t.gaits.includes("canter") ? "run" : o, n(o)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const te = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function Xk(t, e, n) {
  const s = du(t.tail.points, te.length + 1), [, o, i] = t.body.radii, r = (t.tail.at[1] - n) / o, a = Math.abs(r) < 1 ? -i * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, i * 0.08)], c = (f) => t.tail.radius * (1 - 0.5 * f / te.length), h = te.map((f, g) => {
    const p = s[g], m = s[g + 1], b = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], k = g === 0 ? void 0 : s[g - 1];
    return {
      id: f,
      ...g > 0 ? { parent: te[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], b], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - k[0], p[1] - k[1], p[2] - k[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), u = s[s.length - 1], d = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: te[te.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(te.length) * 1.05), segments: 8 },
    at: [u[0] - d[0], u[1] - d[1], u[2] - d[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function Uk(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const o = ws[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], i = Bo[e.gaits.includes(o) ? o : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of Yu) {
    const h = Math.PI * 2 * (r + i.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * i.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * i.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * i.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * i.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (i.rock > 0 ? -i.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function Gc(t) {
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
const ju = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, bx = ju;
function Gk(t) {
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
function Vk(t, e) {
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
      const g = Math.abs(l.to - a.x) / a.scale / ba(e.legLength, r), p = l.for ?? Math.max(500, g * Bo[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", u, a.values.gait ?? 0), a.set("gait", u + 1, ws.indexOf(r)), a.set("walking", u, 0), a.set("walking", u + 240, 1, "ease-out"), a.set("walking", u + p - 240, 1), a.set("walking", u + p, 0, "ease-in"), a.set("walk", u, m), a.move(u, u + p, l.to, { easing: "ease-in-out" }), a.set("walk", u + p, m + g, "ease-in-out"), a.key(u + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: u + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: u + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: u + p + 300, contact: u, release: u + p };
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
        const c = Gc(e), h = l + 450;
        r.key(h, c, { act: !1, easing: "ease-in-out" }), r.key(h + (a.for ?? 1500), c, { act: !1 });
        const u = h + (a.for ?? 1500) + 450, d = {};
        for (const f of Object.keys(c)) d[f] = 0;
        return r.key(u, d), { end: u, contact: h, release: u - 450 };
      }
    },
    lie: {
      summary: "Lies down for `for` ms (default 2000), head up and front paws forward (sinking back onto its haunches first), then gets up.",
      uses: ["for"],
      run(r, a, l) {
        const c = Gk(e), h = { ...Gc(e) }, u = l + 400, d = u + 450;
        r.key(u, h, { act: !1, easing: "ease-in-out" }), r.key(d, c, { act: !1, easing: "ease-in-out" }), r.key(d + (a.for ?? 2e3), c, { act: !1 });
        const f = d + (a.for ?? 2e3) + 600, g = {};
        for (const p of /* @__PURE__ */ new Set([...Object.keys(c), ...Object.keys(h)])) g[p] = 0;
        return r.key(f, g), { end: f, contact: d, release: f - 600 };
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
function Jk(t = {}) {
  return Qe({
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
function Zk(t = {}) {
  return Qe({
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
function Qk(t = {}) {
  return Qe({
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
          for (let u = 1; u <= 4; u++) n.key(a + 300 + u * 110, { roll: u % 2 === 0 ? 3 : -3 }, { act: !1 });
          const c = a + 300 + 550, h = c + 480;
          return n.key(c, { roll: 0, squash: 1.2, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, "fl.swing": 45, "fr.swing": 45, "hl.swing": -45, "hr.swing": -45, tail: 20 }, { act: !1, easing: "ease-out" }), n.key((c + h) / 2, { lift: e.legLength * 0.9 * i, squash: 1.1, pitch: -6 }, { act: !1, easing: "ease-out" }), n.key(h, { lift: 0, squash: 0.8, pitch: 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0, neck: 0, tail: 0 }, { act: !1, easing: "ease-in" }), n.key(h + 260, { squash: 1 }), n.move(c, h, s.to), n.effect({ kind: "dust", time: h, x: s.to, y: n.floor, length: 450 }), { end: h + 260, contact: h };
        }
      }
    })
  });
}
function t5(t = {}) {
  return Qe({
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
function wx(t) {
  return ba(1, t);
}
function e5(t = {}) {
  return Qe({
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
function n5(t = {}) {
  return Qe({
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
function s5(t = {}) {
  return Qe({
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
const be = 0.6, Ku = 75, Ii = 80;
function tn(t) {
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
      shape: { type: "ellipsoid", radii: [t.wing.span * be / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * be / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-Ii, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${u}-tip`,
      parent: `wing-${u}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * be / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * be / 4, 0, -t.wing.chord * 0.3],
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
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - be) / 2, 0, 0], rotate: { axis: "x", degrees: Ii }, scale: [1 / be, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - be) / 2, 0, 0], rotate: { axis: "x", degrees: Ii }, scale: [1 / be, 1, 1] }
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
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / Ku, 0] }]
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
    actions: r5(t),
    acting: i5,
    colors: { body: e.body, ink: "#26262b" },
    moves: o5(t)
  };
}
function o5(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const i5 = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function r5(t) {
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
          r.key(l + 120 + u * 300 + 90, { peck: Ku }, { act: !1, easing: "ease-in" }), r.key(l + 120 + u * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
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
      const h = s(r, l, a.to), u = a.height ?? 2, d = a.for ?? Math.max(700, Math.abs(a.to - r.x) / 0.35), f = r.values.lift > t.legs.length, g = f ? h : h + 200;
      return f || (r.key(h + 160, { squash: 1 - 0.18 * c, spread: 0.6 }, { act: !1, easing: "ease-out" }), r.effect({ kind: "dust", time: g, x: r.x, y: r.floor, length: 400 })), r.key(g + 100, { spread: 1, squash: 1.08, pitch: 10 }, { act: !1, easing: "ease-out" }), r.set("flapping", g, r.values.flapping ?? 0), r.set("flapping", g + 100, 1, "ease-out"), r.set("flapping", g + d, 0.6), n(r, g, g + d), r.key(g + d * 0.4, { lift: u, pitch: -5, squash: 1 }, { act: !1, easing: "ease-out" }), r.key(g + d, { lift: u, pitch: 0 }, { act: !1, easing: "ease-in-out" }), r.move(g, g + d, a.to, { easing: "ease-in-out" }), { end: g + d, contact: g, release: g + d };
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
      const h = r.values.lift, u = a.height ?? h * 0.67, d = a.for ?? Math.max(900, Math.abs(a.to - r.x) / 0.3);
      return r.set("flapping", c, r.values.flapping ?? 1), r.set("flapping", c + 250, 0, "ease-out"), n(r, c, c + 250), r.key(c + 300, { spread: 1, flap: 10, pitch: -6 }, { act: !1, easing: "ease-out" }), r.key(c + d, { lift: u, pitch: -3, flap: 10 }, { act: !1, easing: "ease-in-out" }), r.move(c, c + d, a.to, { easing: "ease-in-out" }), { end: c + d, contact: c, release: c + d };
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
function a5(t = {}) {
  return tn({
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
function l5(t = {}) {
  return tn({
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
function c5(t = {}) {
  return tn({
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
function h5(t = {}) {
  return tn({
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
function u5(t = {}) {
  return tn({
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
function d5(t = {}) {
  return tn({
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
function f5(t = {}) {
  return tn({
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
const ds = { car: pk, truck: gk, bus: mk, tractor: yk, cart: bk, trainCar: wk, bike: kk, motorbike: vk, tree: Mk, house: Tk, chair: $k, desk: Ok, bed: Hk, door: Rk, wheelchair: Fk, helicopter: Bk, airplane: qk, horse: Jk, dog: Zk, cat: Qk, cow: t5, goat: e5, rabbit: n5, squirrel: s5, songbird: a5, crow: l5, chicken: c5, pigeon: h5, duck: u5, owl: d5, parrot: f5 };
function Xu(t, e = {}) {
  const n = ds[t];
  if (!n) throw new Error(dt("prop preset", t, Object.keys(ds)));
  return n(e);
}
const br = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], wr = { viewer: 0, right: 1, away: 2, left: 3 }, p5 = 420, Uu = {
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
function wa(t) {
  return { ...Uu, ...t.actions };
}
const Oi = (t) => typeof t == "number" && Number.isFinite(t);
function g5(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = wa(e), s = Object.keys(n), o = [];
  return t.forEach((i, r) => {
    const a = (c) => o.push({ level: "error", beat: r, message: c });
    if (!i || typeof i != "object" || Array.isArray(i)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = i;
    for (const c of Object.keys(l))
      br.includes(c) || a(dt("beat field", c, br, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(dt(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(Oi(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !Oi(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !Oi(l.toward) && !(typeof l.toward == "string" && l.toward in wr)) {
      const c = typeof l.toward == "string" ? Zs(l.toward, Object.keys(wr)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), o;
}
function m5(t, e, n, s = {}) {
  const o = g5(n, e).filter((M) => M.level === "error");
  if (o.length > 0) throw new Error(`propScript (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((M) => `  beat ${M.beat}: ${M.message}`).join(`
`)}`);
  const i = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = wa(e), h = {};
  for (const M of [...Object.keys(ys), ...Object.keys(e.rig.controls)]) h[M] = s.start?.[M] ?? St(e.rig, {}, M);
  const u = [{ time: 0, pose: { ...h } }], d = /* @__PURE__ */ new Map(), f = [];
  let g = i, p = r;
  const m = (M, A, I, P) => {
    const O = d.get(M) ?? [{ time: 0, value: M === "x" || M === "y" ? 0 : h[M] }];
    O.push({ time: A, value: I, ...P ? { easing: P } : {} }), d.set(M, O), M !== "x" && M !== "y" && (h[M] = I);
  }, b = (M, A) => {
    const I = M === "x" ? g - i : M === "y" ? p - r : h[M], P = d.get(M);
    (!P || P[P.length - 1].time < A) && m(M, A, I);
  }, k = {
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
    key(M, A, I = {}) {
      Object.assign(h, A), u.push({ time: M, pose: { ...h }, ...I.act === !1 ? { act: !1 } : {}, ...I.easing ? { easing: I.easing } : {} });
    },
    move(M, A, I, P = {}) {
      b("x", M), m("x", A, I - i, P.easing), g = I, P.floor !== void 0 && (b("y", M), m("y", A, P.floor - r, P.easing), p = P.floor);
    },
    set(M, A, I, P) {
      m(M, A, I, P);
    },
    turnTo(M, A) {
      const I = typeof A == "number" ? A : wr[A], P = h.turn, _ = [I - 4, I, I + 4].map((B) => ({ t: B, d: Math.abs(B - P) })).sort((B, K) => B.d - K.d || Math.abs(B.t) - Math.abs(K.t))[0];
      if (_.d < 1e-3) return M;
      const W = M + p5 * Math.max(1, _.d);
      return k.key(W, { turn: _.t }), W;
    },
    effect(M) {
      f.push(M);
    },
    anchor(M) {
      const I = bs(e, h, a).anchors[M];
      if (!I) throw new Error(`${e.kind}: no anchor "${M}"`);
      return { x: g + I.point.x, y: p + I.point.y };
    }
  }, w = [];
  let y = 0;
  for (const M of n) {
    const A = Math.max(M.at ?? y, u[u.length - 1].time), I = c[M.do].run(k, M, A);
    I.end > u[u.length - 1].time && u.push({ time: I.end, pose: { ...h } }), w.push({ start: A, end: I.end, ...I.contact !== void 0 ? { contact: I.contact } : {}, ...I.release !== void 0 ? { release: I.release } : {} }), y = I.end;
  }
  const v = Su(s.style ?? "snappy"), E = { ...v, anticipation: v.anticipation * l, overshoot: v.overshoot * l }, T = ua(k5(u), e.acting, { style: E }), x = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(T).filter(([M]) => !d.has(M)).map(([M, A]) => ({ id: `${t}-${M}`, target: t, property: M, keyframes: A })),
    ...[...d].map(([M, A]) => ({ id: `${t}-${M}`, target: t, property: M, keyframes: v5(A) }))
  ];
  for (const M of b5(t, e, x, y, u[0].pose)) {
    const A = x.findIndex((O) => O.property === M.property);
    if (A < 0) {
      x.push(M);
      continue;
    }
    const I = new Ct({ id: `${t}-own`, tracks: [x[A]] }), P = (O) => Number(I.getStateAtTime(O).values.get(t)?.get(M.property) ?? 0);
    x[A] = { ...M, keyframes: M.keyframes.map((O) => ({ time: O.time, value: Number(O.value) + P(O.time) })) };
  }
  return { tracks: x, duration: y, beats: w, effects: f };
}
const y5 = 1500;
function b5(t, e, n, s, o) {
  if (!e.follow?.length) return [];
  const i = new Ct({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = i.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : o[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + y5, c = Ns((d) => r(d, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, u = c.map(({ time: d, value: f }) => {
      const g = Math.sin(r(d, "turn") * Math.PI / 2), p = (f - r(d, a.of)) * g;
      return { time: d, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: u };
  });
}
const w5 = 20;
function k5(t) {
  const e = [...t].sort((s, o) => s.time - o.time), n = [];
  for (const s of e) {
    const o = n[n.length - 1];
    o && s.time - o.time < w5 ? n[n.length - 1] = { ...s, time: o.time } : n.push(s);
  }
  return n;
}
function v5(t) {
  const e = t.map((s, o) => ({ k: s, i: o })).sort((s, o) => s.k.time - o.k.time || s.i - o.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const M5 = {
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
function x5(t, e = {}) {
  const n = {};
  for (const s of Object.keys(Bt)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(Jt)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(Ge)) n[s] = { summary: `The ${s} gag (${yo(s)} ms).` };
  for (const [s, o] of Object.entries(Do)) n[s] = { ...o };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(M5),
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
    canvasProperties: pa,
    stickFigure: {
      poseFields: Qh,
      props: t0,
      handFields: e0,
      poses: Object.keys(Jt),
      expressions: Object.keys(kt),
      gags: Object.fromEntries(Object.keys(Ge).map((s) => [s, yo(s)])),
      gaits: Object.keys(Bt),
      actingStyles: Object.keys(vn),
      beatFields: pr,
      actions: n,
      dances: Object.fromEntries(Object.entries(Je).map(([s, o]) => [s, Object.keys(o.moves)])),
      flips: Object.fromEntries(Object.entries(_o).map(([s, o]) => [s, o.label])),
      handShapes: Object.keys(Ht),
      mudras: Object.keys(Zi)
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
      beatFields: br,
      commonControls: Object.fromEntries(Object.entries(ys).map(([s, o]) => [s, `${o.description}${o.unit ? ` (${o.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(Uu).map(([s, o]) => [s, o.summary])),
      presets: Object.fromEntries(
        Object.entries(ds).map(([s, o]) => {
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
      expressions: Object.keys(S0),
      gags: Object.keys(na),
      builds: Object.keys(tr),
      hair: Object.keys(O0),
      hairColors: { ...fe },
      facialHair: Object.keys(B0),
      glasses: Object.keys(q0),
      hats: Object.keys(ea),
      feet: [...V1],
      cast: Object.keys(xu),
      heldItems: Object.fromEntries(Object.entries(Z0).map(([s, o]) => [s, o.hands])),
      handMeetings: Object.keys(mo)
    },
    codePanel: {
      languages: ur,
      removeStyles: hr,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: Mu
    },
    surfaces: { code: Ks, board: ke, chart: gn, prop: Un },
    surfaceScript: {
      "surfaceScript(figureId, { name: surface }, beats, options)": "compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)",
      "checkSurfaceBeats(beats, surfaces, cast?)": "every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions",
      "{ surface, anchor }": "a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it",
      "then: { surface, edit, anchor, at?, until?, …options }": "what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options",
      at: `a moment of the beat: ${Qn.join(", ")} (default contact, or start when the beat has none); not ms`,
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
const vt = (t) => t.map((e) => `\`${e}\``).join(", "), Vc = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function kx(t, e = {}) {
  const n = x5(t, e), s = n.stickFigure;
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
    Vc(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Vc(s.props),
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
    "- Face marks (pose fields, 0–1): `blush`, `tears`, `sweat`; close-up fields `pupil` (size, 1 usual), `lid` (upper lids lowered, 0–1), `bulge` (eyes out of the head, 0–1); `face: { nose: true, inPupil(ctx, pupil) }`; `drawCharacterHead(ctx, who, pose, { x, y, radius })` draws just the head big",
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
function vx(t, e, n, s = {}) {
  const o = s.color ?? "#555", i = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = Zt(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? Bw(t, { x: r.x, y: r.y }, a, { size: i, color: o, seed: l }) : r.kind === "exhaust" ? E5(t, r, a, i, o, l) : r.kind === "skid" ? A5(t, r, a, n, o) : r.kind === "honk" ? $5(t, r, a, i, o) : r.kind === "smoke" ? S5(t, r, n, i, o) : r.kind === "leaves" && T5(t, r, a, i, s.leafColor ?? "#5cae5a", o, l);
  }
}
function S5(t, e, n, s, o, i) {
  const r = e.direction ?? 1, a = 380, l = 1500;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let c = e.time; c <= e.time + e.length - l; c += a) {
    const h = (n - c) / l;
    if (h <= 0 || h >= 1) continue;
    const u = Math.sin(c / 97 + h * 4) * s * 0.06, d = e.x + r * h * s * 0.7 + u, f = e.y - h * s * 1.6;
    t.globalAlpha = Math.min(1, h * 6) * (1 - h) * 0.85, t.beginPath(), t.arc(d, f, s * (0.07 + h * 0.2), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function T5(t, e, n, s, o, i, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = i, t.fillStyle = o;
  for (let c = 0; c < 4; c++) {
    const h = Zt(`${r}:${c}`) % 1e3 / 1e3, u = Math.min(1, n * (1.1 + h * 0.4)), d = e.x + (h - 0.5) * s * 1.2, f = e.y + (h - 0.3) * s * 0.4, g = u * u * 0.4 + u * 0.6, p = d + a * u * s * (0.6 + h) + Math.sin(u * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, f + (l - f) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(u * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function E5(t, e, n, s, o, i) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (Zt(`${i}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, u = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, u, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function A5(t, e, n, s, o) {
  const i = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (i - e.x) * r;
  t.save(), t.strokeStyle = o, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function $5(t, e, n, s, o) {
  const i = e.direction ?? 1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + i * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, i > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, i > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function Mx(t) {
  const e = new Ct({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], o = [], i = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const u = ya(t.prop, { state: e.getStateAtTime(h) }, t.propId), d = u.anchor(t.anchor);
    s.push({ time: h, value: d.x + (t.offset?.x ?? 0) - t.figure.x }), o.push({ time: h, value: d.y + (t.offset?.y ?? 0) - t.figure.y });
    const f = Math.sin(u.values.turn * Math.PI / 2);
    if (Math.abs(f) > 0.15 && (a = f > 0 ? 1 : -1), i.push({ time: h, value: Math.abs(f) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: o }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: i }, { id: `${l}-facing`, target: l, property: "facing", keyframes: P5(r) }), c;
}
function P5(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function xx(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, o = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = o.get(s(r));
    if (!a) return r;
    o.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, u) => h.time - u.time);
    return { ...r, keyframes: c };
  }), ...o.values()];
}
function Sx(t) {
  const e = new Ct({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((f) => f.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, o = s.x + s.width / 2, i = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = i.wheelSpin ?? 0, u;
  for (let f = t.start; ; f = Math.min(t.end, f + n)) {
    const g = ya(t.leader, { state: e.getStateAtTime(f) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, b = bs(s.prop, { ...i, turn: m }, s.propScale).anchors[t.anchor];
    if (!b) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const k = p.x - b.point.x;
    if (u !== void 0 && r) {
      const w = Math.sin(m * Math.PI / 2);
      h += (k - u) * (w || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (u = k, a.push({ time: f, value: k - o }), l.push({ time: f, value: m }), c.push({ time: f, value: h }), f >= t.end) break;
  }
  const d = t.towedId;
  return [
    { id: `${d}-x`, target: d, property: "x", keyframes: a },
    { id: `${d}-turn`, target: d, property: "turn", keyframes: l },
    ...r ? [{ id: `${d}-wheelSpin`, target: d, property: "wheelSpin", keyframes: c }] : []
  ];
}
const Jc = /* @__PURE__ */ new WeakMap();
function I5(t, e) {
  const n = e?.some(Boolean) ? e.map((d) => d ? 1 : 0).join("") : "";
  let s = Jc.get(t);
  s || Jc.set(t, s = /* @__PURE__ */ new Map());
  const o = s.get(n);
  if (o) return o;
  const i = wo(t), r = { vertices: i.vertices, faces: i.faces.filter((d, f) => !e?.[f]) }, a = r.vertices.flatMap((d) => [d[0], d[1], d[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((d) => {
    for (const p of d.corners) for (const m of [0, 1, 2]) l[p][m] += d.normal[m];
    const [f, ...g] = d.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, b, k] = [f, g[p], g[p + 1]], [w, y, v] = [r.vertices[m], r.vertices[b], r.vertices[k]], E = [y[0] - w[0], y[1] - w[1], y[2] - w[2]], T = [v[0] - w[0], v[1] - w[1], v[2] - w[2]], x = [E[1] * T[2] - E[2] * T[1], E[2] * T[0] - E[0] * T[2], E[0] * T[1] - E[1] * T[0]], M = x[0] * d.normal[0] + x[1] * d.normal[1] + x[2] * d.normal[2];
      c.push(...M >= 0 ? [m, b, k] : [m, k, b]);
    }
  });
  const h = l.flatMap((d) => {
    const f = Math.hypot(...d) || 1;
    return [d[0] / f, d[1] / f, d[2] / f];
  }), u = ho({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, u), u;
}
function O5(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", o = (n.outline ?? 2) * (t.outline ?? 1), i = t.glow && e.glow > 0 ? _5(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: wo(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...o > 0 ? { outline: { width: o, color: s } } : {},
    ...i ? { emissive: i } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function _5(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((o) => Math.round(parseInt(n[1].slice(o, o + 2), 16) * Math.max(0, Math.min(1, e)))).map((o) => o.toString(16).padStart(2, "0")).join("")}` : t;
}
const H5 = ho(A0(1, 2e-3, 28));
function C5(t, e, n) {
  const s = t.rig, [o, i] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, St(s, e, "lift")), a = Math.max(0, St(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: H5,
    world: At(n, $r([0, 4e-3, 0], [0, 0, 0, 1], [o * 0.55 * a || 1e-4, 1, i * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const R5 = /* @__PURE__ */ new Set([
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
]), L5 = 1, Tx = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in ds ? [] : [dt("prop preset", e.prop, Object.keys(ds))];
    for (const [s, o] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      o in e && n.push(`${o} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((i) => i === s ? e[o] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return Xu(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [T, x] of n)
      typeof x == "number" && !R5.has(T) && (h[T] = x);
    h.turn = 0, h.tilt = 0;
    const u = At(o.view, s), d = {
      toView: (T) => jt(u, T),
      toScreen: (T) => a(T)
    }, f = d.toView([0, c.rig.height / 2, 0]);
    if (-f[2] <= o.near) return null;
    if (l.look === "mesh") {
      const T = sk(c.rig, h), x = T.map(({ part: I, local: P }) => ({ part: I.id, mesh: wo(I.shape), ...ga(wo(I.shape), P) })), M = Lu(x), A = T.map((I, P) => ({ ...I, hidden: Wu(I.part.id, x[P].mesh, I.local, x[P].key, M) })).filter(({ opacity: I }) => I > 0.01).map(({ part: I, matrix: P, glow: O, opacity: _, hidden: W }) => ({
        mesh: I5(I.shape, W),
        world: At(s, P),
        material: O5(I, { glow: O, opacity: _ }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? A : [C5(c, h, s), ...A] };
    }
    const g = a(f), p = a(d.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), b = i.length === 0 ? void 0 : (T, x) => {
      const M = jt(s, T), A = [s[0] * x[0] + s[4] * x[1] + s[8] * x[2], s[1] * x[0] + s[5] * x[1] + s[9] * x[2], s[2] * x[0] + s[6] * x[1] + s[10] * x[2]], I = Math.hypot(...A) || 1;
      return { light: ou(M, [A[0] / I, A[1] / I, A[2] / I], i), fog: iu(r, Math.hypot(M[0] - o.position[0], M[1] - o.position[1], M[2] - o.position[2])) };
    }, k = Fu(c.rig, h, d, m, { perspective: !0, near: o.near, slice: L5, light: b }), w = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, y = au(k), v = k.cells ?? [], E = Math.max(...v.map((T) => -T.depth), -f[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: E + c.rig.length, draw: (T) => lu(T, k, w) }],
        ...v.map((T) => ({
          depth: -T.depth,
          draw(x, M) {
            x.lineCap = "round", x.lineJoin = "round", pb(x, T.parts, y, { ...w, time: M.time });
          }
        }))
      ]
    };
  }
}, Zc = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], W5 = 0.25, F5 = 800 / 180, N5 = 220, D5 = 300, B5 = ["turn"];
function z5(t) {
  const e = wa(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !B5.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function q5(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = z5(e), o = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], i = [];
  return t.forEach((r, a) => {
    const l = (u) => i.push({ beat: a, message: u });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${o[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const u of Object.keys(c)) Zc.includes(u) || l(dt("beat field", u, Zc, h[u]));
    if (typeof c.do != "string" || !o.includes(c.do)) {
      const u = c.do === "turn" ? "face" : void 0;
      return l(dt(`${e.kind} 3D beat`, c.do, o, u));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !Fe(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(Fe)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(Fe(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), i;
}
function Ex(t, e, n, s) {
  const o = q5(n, e);
  if (o.length > 0) throw new Error(`propScript3D (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((w) => `  beat ${w.beat}: ${w.message}`).join(`
`)}`);
  const i = {};
  for (const w of [...Object.keys(ys), ...Object.keys(e.rig.controls)]) i[w] = s.values?.[w] ?? St(e.rig, {}, w);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (w, y, v, E = "linear") => {
    const T = c.get(w) ?? [];
    T.push({ time: y, value: v, easing: E }), c.set(w, T);
  }, u = (w, y, v) => h(w, y, v);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const d = (w, y) => {
    const v = po(l, y);
    if (Math.abs(v) < 1) return w;
    const E = Math.max(N5, Math.abs(v) * F5);
    return u("rotateY", w, l), l += v, h("rotateY", w + E, l, "ease-in-out"), w + E;
  }, f = (w, y, v) => {
    const E = pu([[r, a], ...y.through ?? [y.to]]);
    if (E.length < 2) return v;
    const T = d(v, kn(E[0].point, E[1].point)), x = E[E.length - 1].at, M = y.for ?? x / (y.speed ?? w.speed) * 1e3, A = Rt("ease-in-out"), I = Math.min(D5, M / 4);
    for (const [K, V] of Object.entries(w.set ?? {}))
      u(K, T, i[K]), h(K, T + 1, V), i[K] = V;
    const P = w.flies ? y.height ?? (i.lift > 0.05 ? i.lift : 2) : void 0, O = P !== void 0 && P > 0.05;
    for (const [K, V] of Object.entries(w.hold ?? {}))
      u(K, T, i[K]), h(K, T + I, V, "ease-out"), O || (h(K, T + M - I, V), h(K, T + M, 0, "ease-in")), i[K] = O ? V : 0;
    P !== void 0 && (u("lift", T, i.lift), h("lift", T + Math.min(M * 0.35, 1400), P, "ease-out"), h("lift", T + M, P), i.lift = P);
    const _ = { ...i };
    let W = l;
    for (let K = 0; ; K = Math.min(x, K + W5)) {
      const V = T + mu(A, K / x) * M, { point: j, direction: S } = gu(E, K);
      W += po(W, kn([0, 0], S)), h("x", V, j[0]), h("z", V, j[1]), h("rotateY", V, W);
      for (const [C, L] of Object.entries(w.perMetre ?? {})) h(C, V, _[C] + K * L);
      for (const [C, L] of Object.entries(w.perSecond ?? {})) h(C, V, _[C] + (V - T) / 1e3 * L);
      if (K >= x) break;
    }
    for (const [K, V] of Object.entries(w.perMetre ?? {})) i[K] = _[K] + x * V;
    for (const [K, V] of Object.entries(w.perSecond ?? {})) i[K] = _[K] + M / 1e3 * V;
    return [r, a] = E[E.length - 1].point, l = W, T + M;
  }, g = (w, y) => {
    const v = Object.fromEntries(Object.entries(w).filter(([T]) => !["at", "to", "through", "toward"].includes(T))), E = m5(t, e, [v], { start: { ...i, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const T of E.tracks) {
      if (Y5.includes(T.property)) continue;
      const x = T.keyframes ?? [], M = i[T.property];
      if (!x.every((A) => A.value === M)) {
        u(T.property, y, M);
        for (const A of x) A.time > 0 && c.get(T.property).push({ ...A, time: y + A.time });
        i[T.property] = x[x.length - 1].value;
      }
    }
    return y + E.duration;
  }, p = [];
  let m = 0;
  for (const w of n) {
    const y = w.at ?? m;
    let v = y;
    const E = e.moves?.[w.do];
    E ? v = f(E, w, y) : w.do === "face" ? v = d(y, typeof w.toward == "number" ? w.toward : kn([r, a], w.toward)) : w.do === "hold" ? v = y + (w.for ?? 1e3) : v = g(w, y), p.push({ do: w.do, start: y, end: v }), m = v;
  }
  const b = `${s.scene}/${t}`;
  return { tracks: [...c].map(([w, y]) => ({
    id: `${t}-${w}`,
    target: b,
    property: w,
    keyframes: fu(y)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...i } } };
}
const Y5 = ["x", "y", "turn", "facing", "tilt"], j5 = 0.35, Gu = {
  seated: ce.sit,
  astride: { ...ce.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 },
  driving: { ...ce.sit, "arm.left.swing": 52, "arm.right.swing": 52, "arm.left.spread": 8, "arm.right.spread": 8, "arm.left.elbow": 38, "arm.right.elbow": 38, lean: 4 },
  wheeling: { ...ce.sit, "arm.left.swing": -6, "arm.right.swing": -6, "arm.left.spread": 16, "arm.right.spread": 16, "arm.left.elbow": 28, "arm.right.elbow": 28, "leg.left.knee": 80, "leg.right.knee": 80 },
  cycling: { ...ce.sit, lean: 22, bend: 10, "head.nod": -14, "arm.left.swing": 58, "arm.right.swing": 58, "arm.left.spread": 10, "arm.right.spread": 10, "arm.left.elbow": 22, "arm.right.elbow": 22, "leg.left.spread": 6, "leg.right.spread": 6 }
}, K5 = 22, Qc = 38;
function th(t, e = Gu.cycling) {
  const n = t * Math.PI * 2, s = (r) => ({
    swing: (e["leg.left.swing"] ?? 40) + K5 * Math.cos(n + r),
    // The knee straightens as the foot pushes down and over the bottom of the stroke.
    knee: (e["leg.left.knee"] ?? 70) + Qc * (0.5 + 0.5 * Math.cos(n + r)) - Qc * 0.5,
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
function Ax(t) {
  const e = t.cadence ?? 1.2, n = Math.max(2, t.samplesPerTurn ?? 8), s = 1e3 / e / n, o = [];
  for (let i = t.start, r = 0; i < t.end; i += s, r++)
    o.push({ time: Math.round(i), pose: th((i - t.start) / 1e3 * e, t.base), ...r > 0 ? { act: !1 } : {} });
  return o.push({ time: t.end, pose: th((t.end - t.start) / 1e3 * e, t.base), act: !1 }), o;
}
const eh = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function $x(t) {
  const e = `${t.scene}/${t.propId}`, n = new Ct({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [o, i, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = Q0({ ...t.character, height: 1 }), c = { ...ft, ...t.pose ?? Gu.seated }, h = Kr(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, u = t.facing ?? 0, d = t.every ?? 33, f = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + d)) {
    const b = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), k = (_, W) => {
      const B = b.get(_);
      return typeof B == "number" ? B : W;
    }, w = { ...s.values };
    for (const _ of Object.keys(a.controls)) w[_] = k(_, s.values?.[_] ?? St(a, {}, _));
    for (const _ of ["pitch", "roll", "squash", "lift", "lean", "size"]) w[_] = k(_, s.values?.[_] ?? St(a, {}, _));
    const y = ok(a, w)[t.anchor];
    if (!y) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const v = k("rotateY", s.heading ?? 0), E = eh(y, v), T = [k("x", o) + E[0], k("y", i) + E[1], k("z", r) + E[2]], x = v + u, M = eh(h, x);
    let A = [T[0] - M[0], T[1] - M[1], T[2] - M[2]];
    const I = (_, W) => {
      const B = W * W * (3 - 2 * W);
      return [_[0] + (A[0] - _[0]) * B, A[1] * B + j5 * Math.sin(Math.PI * W), _[1] + (A[2] - _[1]) * B];
    }, P = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, O = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + P ? A = I(t.mount.from, (m - t.start) / P) : t.dismount && m > t.end - O && (A = I(t.dismount.to, (t.end - m) / O)), f.x.push({ time: m, value: A[0] }), f.y.push({ time: m, value: A[1] }), f.z.push({ time: m, value: A[2] }), f.rotateY.push({ time: m, value: x }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(f).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: f[m] }));
}
const X5 = {
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
}, zn = [
  [0, "#0b1530", "#1b2a4a"],
  [4.5, "#141a3e", "#2a2f5a"],
  [6, "#4a3f7a", "#f0a070"],
  [7.5, "#86c2ee", "#d8ecf8"],
  [12, "#5aaef2", "#c0e2f8"],
  [16.5, "#69b0e6", "#f5d79a"],
  [18.5, "#4c3f78", "#f08a5a"],
  [20.5, "#17203f", "#2d3660"],
  [24, "#0b1530", "#1b2a4a"]
], ts = (t, e, n) => {
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16)), [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}, U5 = (t) => {
  const e = (t % 24 + 24) % 24;
  return e < 5 || e > 20 ? 0 : e < 7 ? (e - 5) / 2 : e > 18 ? (20 - e) / 2 : 1;
};
function G5(t) {
  const e = (t % 24 + 24) % 24;
  for (let n = 1; n < zn.length; n++) {
    const [s, o, i] = zn[n - 1], [r, a, l] = zn[n];
    if (e <= r) {
      const c = (e - s) / (r - s);
      return { top: ts(o, a, c), bottom: ts(i, l, c) };
    }
  }
  return { top: zn[0][1], bottom: zn[0][2] };
}
const V5 = (t, e) => {
  const n = ((t - e) % 24 + 24) % 24;
  return n <= 12 ? n / 12 : -1;
}, J5 = 9, Z5 = 55, Q5 = 28;
function tv(t) {
  const { x: e, y: n, width: s, height: o } = t, i = t.kind ?? "sky", r = t.ground ?? n + o * 0.85, a = { ...X5, ...t.colors }, l = t.horizon ?? "hills", c = t.window !== !1, h = Ve(t.seed ?? 1), u = s * o / 1e5, d = Array.from({ length: Math.ceil(J5 * u) + 2 }, () => ({ u: h.next(), v: h.next(), size: 0.6 + h.next() * 0.8, puffs: 2 + Math.floor(h.next() * 3) })), f = Array.from({ length: Math.ceil(Z5 * u) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.8 + h.next() * 0.5 })), g = Array.from({ length: Math.ceil(Q5 * u) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.7 + h.next() * 0.6, sway: h.next() * Math.PI * 2, size: 1.5 + h.next() * 2 })), p = Array.from({ length: Math.ceil(30 * u) + 10 }, () => ({ u: h.next(), v: h.next() * 0.6, size: 0.6 + h.next() * 1.2 })), m = Array.from({ length: 6 }, () => ({ phase: h.next() * Math.PI * 2, amp: 0.5 + h.next() })), b = Array.from({ length: 24 }, () => ({ h: 0.35 + h.next() * 0.65, w: 0.6 + h.next() * 0.8, windows: h.next() > 0.3 })), k = {
    hour: t.hour ?? 12,
    clouds: t.clouds ?? 0.3,
    wind: t.wind ?? 0,
    rain: t.rain ?? 0,
    snow: t.snow ?? 0
  }, w = ms(), y = (A, I) => w.keys(A)?.length ? w.valueAt(A, I) : k[A], v = (A, I) => {
    const P = V5(A, I), O = P < 0 ? 0.5 : P, _ = r - n;
    return { x: 0.1 * s + 0.8 * s * O, y: P < 0 ? _ + o * 0.2 : _ - Math.sin(O * Math.PI) * _ * 0.8, up: P >= 0 };
  }, E = (A, I, P, O, _) => {
    const W = I("hour"), { top: B, bottom: K } = G5(W), V = A.createLinearGradient(0, O.y, 0, O.ground);
    V.addColorStop(0, B), V.addColorStop(1, K), A.fillStyle = V, A.fillRect(O.x, O.y, O.w, O.ground - O.y);
    const j = U5(W);
    if (j < 0.6) {
      A.fillStyle = "#ffffff", A.globalAlpha = (0.6 - j) / 0.6 * 0.9;
      for (const D of p)
        A.beginPath(), A.arc(O.x + D.u * O.w, O.y + D.v * (O.ground - O.y), D.size, 0, Math.PI * 2), A.fill();
      A.globalAlpha = 1;
    }
    const S = v(W, 6), C = v(W, 18), L = Math.min(O.w, O.h) * 0.06;
    if (S.up && (A.fillStyle = a.sun, A.beginPath(), A.arc(O.x + S.x / s * O.w, O.y + S.y / o * O.h, L, 0, Math.PI * 2), A.fill()), C.up) {
      const D = O.x + C.x / s * O.w, q = O.y + C.y / o * O.h;
      A.fillStyle = a.moon, A.beginPath(), A.arc(D, q, L * 0.8, 0, Math.PI * 2), A.fill(), A.fillStyle = B, A.beginPath(), A.arc(D - L * 0.35, q - L * 0.15, L * 0.7, 0, Math.PI * 2), A.fill();
    }
    const $ = Math.max(0, Math.min(1, I("clouds"))), R = Math.max(-1, Math.min(1, I("wind"))), N = Math.round($ * d.length);
    A.fillStyle = ts("#ffffff", a.cloud === "#ffffff" ? "#ffffff" : a.cloud, 1), A.globalAlpha = 0.55 + 0.4 * j;
    for (let D = 0; D < N; D++) {
      const q = d[D], U = ((q.u * O.w + R * P * 0.012 * (0.6 + q.size * 0.5)) % (O.w * 1.4) + O.w * 1.4) % (O.w * 1.4) - O.w * 0.2, F = O.x + U, G = O.y + (0.08 + q.v * 0.42) * (O.ground - O.y), Y = Math.min(O.w, O.h) * 0.07 * q.size;
      for (let nt = 0; nt < q.puffs; nt++)
        A.beginPath(), A.ellipse(F + (nt - (q.puffs - 1) / 2) * Y * 0.9, G + nt % 2 * Y * 0.25, Y * (nt % 2 ? 0.8 : 1), Y * 0.62, 0, 0, Math.PI * 2), A.fill();
    }
    A.globalAlpha = 1;
    const z = (D) => ts(ts(D, "#0b1530", 0.65), D, j);
    if (l === "hills") {
      A.fillStyle = z(a.hills), A.beginPath(), A.moveTo(O.x, O.ground);
      const D = 40;
      for (let q = 0; q <= D; q++) {
        const U = q / D;
        let F = 0;
        m.forEach((G, Y) => F += Math.sin(U * Math.PI * (1.5 + Y * 0.7) + G.phase) * G.amp), A.lineTo(O.x + U * O.w, O.ground - Math.max(0, F) * O.h * 0.045 - O.h * 0.03);
      }
      A.lineTo(O.x + O.w, O.ground), A.closePath(), A.fill();
    } else if (l === "city") {
      A.fillStyle = z(a.city);
      let D = O.x;
      const q = O.w / 18;
      for (const U of b) {
        if (D > O.x + O.w) break;
        const F = q * U.w, G = O.h * 0.22 * U.h;
        if (A.fillRect(D, O.ground - G, F, G), U.windows && j < 0.5) {
          A.fillStyle = "#ffd66b", A.globalAlpha = 0.5 - j;
          for (let Y = O.ground - G + 6; Y < O.ground - 8; Y += 9) for (let nt = D + 4; nt < D + F - 4; nt += 8) A.fillRect(nt, Y, 3, 4);
          A.globalAlpha = 1, A.fillStyle = z(a.city);
        }
        D += F + q * 0.15;
      }
    }
    A.fillStyle = z(a.ground), A.fillRect(O.x, O.ground, O.w, O.y + O.h - O.ground);
  }, T = (A, I, P, O) => {
    const _ = Math.max(-1, Math.min(1, I("wind"))), W = Math.max(0, Math.min(1, I("rain"))), B = Math.max(0, Math.min(1, I("snow")));
    if (W > 0) {
      A.strokeStyle = a.rain, A.globalAlpha = 0.35 + 0.45 * W, A.lineWidth = 1.2, A.lineCap = "round";
      const K = O.h * 0.05, V = _ * 0.45, j = Math.round(W * f.length);
      A.beginPath();
      for (let S = 0; S < j; S++) {
        const C = f[S], L = ((C.v * O.h + P * C.speed * 0.9) % O.h + O.h) % O.h, $ = ((C.u * O.w + L * V) % O.w + O.w) % O.w;
        A.moveTo(O.x + $, O.y + L), A.lineTo(O.x + $ + V * K, O.y + L + K);
      }
      A.stroke(), A.globalAlpha = 1;
    }
    if (B > 0) {
      A.fillStyle = a.snow, A.globalAlpha = 0.85;
      const K = Math.round(B * g.length);
      for (let V = 0; V < K; V++) {
        const j = g[V], S = ((j.v * O.h + P * j.speed * 0.08) % O.h + O.h) % O.h, C = Math.sin(P * 2e-3 + j.sway) * O.w * 0.02, L = ((j.u * O.w + C + _ * S * 0.3) % O.w + O.w) % O.w;
        A.beginPath(), A.arc(O.x + L, O.y + S, j.size, 0, Math.PI * 2), A.fill();
      }
      A.globalAlpha = 1;
    }
  }, M = {
    kind: "scenery",
    target: {
      type: "custom",
      x: e,
      y: n,
      width: s,
      height: o,
      props: k,
      about: {
        kind: i === "room" ? "room" : "sky",
        summary: i === "room" ? "A room: a wall, a floor and a window on the sky. Its values are tracks: hour, clouds, wind, rain, snow (seen through the window)." : `A sky over ${l === "flat" ? "the ground" : l}: the sun and moon on their arcs, stars, clouds on the wind, rain and snow. Its values are tracks: hour (0–24), clouds, wind (−1..1), rain, snow (0..1).`,
        props: Object.fromEntries(Object.keys(k).map((A) => [A, ev(A)]))
      },
      draw(A, I, P) {
        const O = I.props ?? {}, _ = (B) => Number(O[B] ?? k[B] ?? 0);
        A.save();
        const W = { x: 0, y: 0, w: s, h: o, ground: r - n };
        if (i === "sky")
          E(A, _, P, W), T(A, _, P, W);
        else if (A.fillStyle = a.wall, A.fillRect(0, 0, s, W.ground), A.fillStyle = a.floor, A.fillRect(0, W.ground, s, o - W.ground), A.fillStyle = a.skirting, A.fillRect(0, W.ground - o * 0.012, s, o * 0.012), c) {
          const B = s * 0.26, K = W.ground * 0.5, V = s * 0.62, j = W.ground * 0.14;
          A.fillStyle = a.frame, A.fillRect(V - 6, j - 6, B + 12, K + 12), A.save(), A.beginPath(), A.rect(V, j, B, K), A.clip(), E(A, _, P, { x: V, y: j, w: B, h: K, ground: j + K * 0.8 }), T(A, _, P, { x: V, y: j, w: B, h: K }), A.restore(), A.strokeStyle = a.frame, A.lineWidth = 4, A.beginPath(), A.moveTo(V + B / 2, j), A.lineTo(V + B / 2, j + K), A.moveTo(V, j + K / 2), A.lineTo(V + B, j + K / 2), A.stroke();
        }
        A.restore();
      }
    },
    ground: r,
    anchor(A, I = 1 / 0) {
      const P = y("hour", I);
      if (A === "sun" || A === "moon") {
        const O = v(P, A === "sun" ? 6 : 18);
        return { x: e + O.x, y: n + O.y };
      }
      if (A === "horizon") return { x: e + s / 2, y: r - o * 0.03 };
      if (A === "ground") return { x: e + s / 2, y: r };
      throw new Error(`scenery: ${dt("place", A, ["sun", "moon", "horizon", "ground"])}`);
    },
    set(A, I) {
      if (!(A in k)) throw new Error(`scenery: ${dt("value", A, Object.keys(k))}`);
      if (typeof I.value != "number" || !Number.isFinite(I.value)) throw new Error("scenery.set needs `value`, a number");
      return w.tween(A, y(A, I.at), I.value, I, 1e3), M;
    },
    tracks: w.tracks
  };
  return M;
}
function ev(t) {
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
function nv(t, e) {
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
      throw new Error(dt("scene preset", t, ["park", "street", "office", "home"]));
  }
}
function Px(t, e) {
  const n = nv(t, e), s = tv(n.scenery), o = n.props.map((i) => lk({ x: i.x, y: s.ground, prop: Xu(i.preset), scale: i.scale, values: { turn: i.turn ?? 0, ...i.values } }));
  return { scenery: s, props: o, ground: s.ground };
}
function Ix(t) {
  const { timeline: e } = t, n = new qe();
  for (const [c, h] of Object.entries(t.targets)) {
    const u = typeof h == "string" ? document.querySelector(h) : h;
    if (!u)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, u);
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
const Ox = {
  timeline: ap,
  to(t, e, n) {
    const s = new yn(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new yn(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const o = new yn(s);
    return o.fromTo(t, e, n), o;
  },
  set(t, e, n) {
    const s = new yn(n);
    return s.set(t, e), s;
  }
};
function Vu(t, e, n) {
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
function sv(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), o = Math.min(0.999, Math.max(0, e));
  for (let i = 0; i < n; i++) {
    const r = t[i * 4] / 255, a = t[i * 4 + 1] / 255, l = t[i * 4 + 2] / 255, c = t[i * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= o) continue;
    const u = (h - o) / (1 - o) * c / h;
    s[i * 3] = r * u, s[i * 3 + 1] = a * u, s[i * 3 + 2] = l * u;
  }
  return s;
}
function nh(t, e, n, s, o) {
  const i = new Float32Array(t.length), r = o ? n : e, a = o ? e : n, l = (h, u) => (o ? h * e + u : u * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let u = 0; u < 3; u++) {
      let d = 0;
      for (let f = -s; f <= s; f++) d += t[l(h, Math.min(a - 1, Math.max(0, f))) + u];
      for (let f = 0; f < a; f++) {
        i[l(h, f) + u] = d / c;
        const g = t[l(h, Math.max(0, f - s)) + u], p = t[l(h, Math.min(a - 1, f + s + 1)) + u];
        d += p - g;
      }
    }
  return i;
}
function sh(t, e, n, s) {
  const o = Math.max(1, Math.round(s / Math.sqrt(3)));
  let i = t;
  for (let r = 0; r < 3; r++)
    i = nh(i, e, n, o, !0), i = nh(i, e, n, o, !1);
  return i;
}
function _x(t, e = {}) {
  const n = t.canvas, s = n.width, o = n.height;
  if (!(s > 0 && o > 0)) return;
  const i = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / i)), a = Math.max(1, Math.ceil(o / i)), l = Vu(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = sv(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, o) * 0.02) / i, d = sh(h, r, a, u), f = sh(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let b = 0; b < 3; b++) p.data[m * 4 + b] = Math.round(Math.min(1, d[m * 3 + b] + f[m * 3 + b] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, o), t.restore();
}
function Hx(t, e, n) {
  const s = n.width ?? 6, o = n.taper ?? 1, i = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = iv(e, s, o, i, r);
    a ? (t.globalCompositeOperation = "lighter", kr(t, c, n.color)) : rv(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, ov(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function ov(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const o = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return o ? `rgba(${o[1]}, ${o[2]}, ${o[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function iv(t, e, n, s, o) {
  const i = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = Pf(i), a = If(i) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = o * (1 - s * h);
    if (u <= 0) continue;
    const d = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...d && a && { cap: a } });
  }
  return l;
}
function kr(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [o, i, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(o.x, o.y), t.lineTo(i.x, i.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function rv(t, e, n) {
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
  const u = Math.floor(a) - 1, d = Math.floor(l) - 1, f = s ? Vu(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - d) : null, g = f?.getContext("2d");
  if (!f || !g) {
    kr(t, e, n);
    return;
  }
  g.translate(-u, -d), g.globalCompositeOperation = "lighter", kr(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(f, u, d), t.restore();
}
const Cx = Qt.to, Rx = Qt.from, Lx = Qt.fromTo, Wx = Qt.set, Fx = Qt.timeline, Nx = Qt.ticker, Dx = Qt.splitText, Bx = Qt.context, zx = Qt.matchMedia, qx = Qt.quickTo, Yx = Qt.imageSequence, jx = Qt.pageTransition;
Gg();
export {
  vn as ACTING_STYLES,
  qu as AIRCRAFT_ACTING,
  ws as ANIMAL_GAITS,
  pr as BEAT_FIELDS,
  Qn as BEAT_MOMENTS,
  Ck as BED_ACTING,
  i5 as BIRD_ACTING,
  tc as BOARD_MARKS,
  Ps as BOARD_THEMES,
  pa as CANVAS_PROPERTIES,
  Pk as CHAIR_ACTING,
  Jl as CHARACTER_BEAT_3D_FIELDS,
  xu as CHARACTER_CAST,
  _b as CHARACTER_GAIT_SPEEDS,
  rc as CHART_KINDS,
  gn as CHART_SURFACE,
  Is as CHART_THEMES,
  ur as CODE_LANGUAGES,
  Mu as CODE_PANEL_EDITS,
  Ks as CODE_SURFACE,
  Kb as CODE_THEME,
  cv as Clock,
  yn as CompatTimeline,
  bg as CustomBounce,
  yg as CustomEase,
  wg as CustomWiggle,
  Je as DANCE_STYLES,
  mh as DEFAULT_BAKE_INTERVAL_MS,
  va as DEFAULT_INERTIA_FRICTION,
  Og as DEFAULT_LABELS,
  ee as DEFAULT_SPRING,
  mM as DEFAULT_TRANSITION,
  _k as DESK_ACTING,
  Lk as DOOR_ACTING,
  Yh as Draggable,
  dr as EMBRACE,
  kt as EXPRESSIONS,
  B0 as FACIAL_HAIR_STYLES,
  rm as FINGERS,
  _o as FLIPS,
  V1 as FOOT_SHAPES,
  ka as FORMAT_VERSION,
  Ge as GAGS,
  Bt as GAITS,
  Mc as GAIT_CYCLE_MS,
  q0 as GLASSES_STYLES,
  fe as HAIR_COLORS,
  as as HAIR_STILL,
  O0 as HAIR_STYLES,
  mo as HAND_MEETINGS,
  Pt as HAND_REST,
  Ht as HAND_SHAPES,
  ea as HAT_STYLES,
  Z0 as HELD_ITEMS,
  mn as HELP_UP,
  bx as HORSE_ACTING,
  yx as HORSE_GAITS,
  Ek as HOUSE_ACTING,
  Rw as HUMAN_ACTING_RIG,
  tr as HUMAN_BUILDS,
  Dl as HUMAN_CYCLES,
  S0 as HUMAN_EXPRESSIONS,
  na as HUMAN_GAGS,
  ce as HUMAN_POSES,
  ft as HUMAN_REST,
  Fb as IDENTITY_CAMERA,
  Kv as IDENTITY_SIMILARITY,
  od as INERTIA_MAX_DURATION_MS,
  tf as InertiaTrackPlayer,
  ge as LiveTimeline,
  mv as MORPH_SAMPLES,
  Zi as MUDRAS,
  lv as ManualClock,
  ll as MediaSync,
  _p as Observer,
  Jt as POSES,
  Zc as PROP_BEAT_3D_FIELDS,
  br as PROP_BEAT_FIELDS,
  Uu as PROP_COMMON_ACTIONS,
  ys as PROP_COMMON_CONTROLS,
  ds as PROP_PRESETS,
  Un as PROP_SURFACE,
  ju as QUADRUPED_ACTING,
  hr as REMOVE_STYLES,
  lt as REST_POSE,
  Gu as RIDING_POSES,
  Ne as SAMPLE_STEP,
  X5 as SCENERY_COLORS,
  Do as SCRIPT_ACTIONS,
  lh as SPRING_MAX_DURATION_MS,
  Yo as SPRING_PRESETS,
  qn as SPRING_STEP_MS,
  _w as STICK_ACTING_RIG,
  tg as ScrollAnimator,
  Po as ScrollDriver,
  eg as ScrollMarkers,
  Gp as ScrollPin,
  el as SmoothScroll,
  vo as SpringSampler,
  Qd as SpringTrackPlayer,
  Sp as Stage,
  xk as TREE_ACTING,
  Ct as Timeline,
  Cr as TinyflyPlayer,
  Vg as TinyflySequencer,
  Fs as TrackPlayer,
  dk as VEHICLE_ACTING,
  He as VISEMES,
  Ev as ValueResolver,
  Up as VisibilityDriver,
  Nk as WHEELCHAIR_ACTING,
  ke as WHITEBOARD_SURFACE,
  Ww as actCharacterTracks,
  ua as actKeyframes,
  Lw as actTracks,
  Pu as actionNames,
  qk as airplane,
  De as anchorError,
  ba as animalStrideLength,
  q2 as animatableProperties,
  _x as applyBloom,
  DM as applyCamera,
  f1 as applyGroove,
  Oh as applySimilarity,
  kc as assertBeats,
  qv as audioEnvelope,
  md as backOut,
  TM as bakeDanceTracks,
  kh as bakeEasing,
  bh as bakeInertiaTrack,
  yh as bakeSpringTrack,
  Qy as basicOutfit,
  MM as beatAt,
  To as beatAtTime,
  So as beatLength,
  Dv as beatPeriod,
  zv as beatPulse,
  Sr as beatTime,
  _v as beatsBetween,
  Hk as bed,
  kk as bike,
  zg as bindChoiceHotspots,
  tn as bird,
  is as blendPose,
  s0 as boilFrame,
  gd as bounceOut,
  Sb as boxMesh,
  Vy as brushingPose,
  nM as bubblePath,
  sM as bubblePop,
  Px as buildScene,
  mk as bus,
  NM as cameraFromValues,
  BM as cameraPoint,
  Cv as cameraTracks,
  x5 as capabilities,
  kx as capabilitiesMarkdown,
  pk as car,
  bk as cart,
  JM as castMember,
  Qk as cat,
  $k as chair,
  hs as changingWindows,
  Q0 as character,
  CM as characterAt,
  ib as characterHandPose,
  oe as characterJoints,
  IM as characterJointsInView,
  WM as characterObjects,
  lb as characterPartsInView,
  oa as characterPoseOf,
  RM as characterPoseTracks,
  fx as characterScript,
  FM as characterScript3D,
  P2 as characterStrideLength,
  HM as characterTarget,
  nf as charactersFor,
  VM as chart,
  bo as checkBeats,
  Iu as checkCast,
  Wb as checkCharacterBeats3D,
  g5 as checkPropBeats,
  q5 as checkPropBeats3D,
  E2 as checkSurfaceBeats,
  px as checkTracks,
  c5 as chicken,
  qM as circlePath,
  Uh as clamp01,
  yv as clearMorphCache,
  pv as clearPathCache,
  vu as clipErased,
  Zs as closestName,
  UM as codePanel,
  Zb as codeTokens,
  Uv as composeSimilarity,
  Za as containerProgressAt,
  Bx as context,
  St as controlValue,
  t5 as cow,
  fM as create,
  Rg as createControls,
  fd as createCubicBezier,
  Tg as createLive,
  Io as createPen,
  Ve as createRandom,
  Wi as createTrack,
  dv as criticalDamping,
  l5 as crow,
  Nv as curve,
  pf as customBounce,
  ff as customEase,
  gf as customWiggle,
  Tb as cylinderMesh,
  Dr as danceFrame,
  kM as dancePose,
  Qi as danceStance,
  vM as danceTaps,
  SM as danceTracks,
  ii as danceTravel,
  y1 as danceTravelTrack,
  xM as dancer,
  cx as defineAction,
  hx as defineGait,
  z2 as describeTarget,
  es as deserializeTimeline,
  lf as deserializeTrack,
  Ok as desk,
  Hv as detectTempo,
  Zk as dog,
  Rk as door,
  lM as draggable,
  Wr as drawCartoonHand,
  ab as drawCharacter,
  _M as drawCharacterHead,
  OM as drawCharacterInView,
  Bw as drawDustPuff,
  yu as drawEraser,
  wu as drawHand,
  zl as drawHeldItem,
  ax as drawImpactStars,
  Nb as drawPencil,
  gx as drawProp,
  vx as drawPropEffects,
  lu as drawPropShadow,
  pb as drawSolvedFaces,
  LM as drawSolvedPart,
  ru as drawSolvedProp,
  Nw as drawSpeedLines,
  n1 as drawStickFigure,
  rx as drawStickSmear,
  Hx as drawTrail,
  YM as drawnPathTarget,
  eM as dripPath,
  u5 as duck,
  cd as easeIn,
  ch as easeInCubic,
  ud as easeInOut,
  xo as easeInOutCubic,
  ld as easeInOutQuad,
  rd as easeInQuad,
  hd as easeOut,
  hh as easeOutCubic,
  ad as easeOutQuad,
  xf as editDistance,
  No as editError,
  ms as editLog,
  pd as elasticOut,
  dl as ellipsePoints,
  Eb as ellipsoidMesh,
  ex as embrace,
  tx as embraceSpacing,
  Yv as envelopeAt,
  XM as erasable,
  da as expandBeats,
  Jd as expandParametricEasings,
  $b as extrudeMesh,
  C1 as flipPose,
  EM as flipTracks,
  R1 as flipTravel,
  oh as formatVersionFor,
  Rx as from,
  xv as fromJSON,
  Lx as fromTo,
  dc as gag,
  yo as gagDuration,
  Am as gaitPose,
  Ui as gaitStrideLength,
  Rt as getEasingFunction,
  Js as getInterpolator,
  vh as getMotionPathPoint,
  gv as getPathLength,
  Ad as getPointAtProgress,
  e5 as goat,
  Cp as gridLinesFor,
  Sw as hairFollow,
  ix as hairFollowTracks,
  yy as hairHangs,
  ox as hairMotionAt,
  Zr as hairMotionOf,
  fo as hairlineAt,
  zM as handAt,
  di as handGrip,
  Xi as handJoints,
  bm as handJointsAt,
  _u as handPath,
  $t as handPose,
  ro as handProp,
  Qu as hasKeyframes,
  Zt as hashSeed,
  bM as headPoint,
  td as heldTime,
  Bk as helicopter,
  sx as helpUp,
  nx as helpUpSpacing,
  eb as holdingLayers,
  Jk as horse,
  wx as horseStrideLength,
  Tk as house,
  $M as humanCyclePose,
  AM as humanFieldLabel,
  Uy as humanGag,
  V0 as humanGaitPose,
  J0 as humanGaitStrideLength,
  Z1 as humanPlan,
  bt as humanPose,
  Yx as imageSequence,
  ps as inertiaDuration,
  fs as inertiaRest,
  Hi as inertiaValueAt,
  fv as inertiaVelocityAt,
  Ud as interpolateArray,
  Xd as interpolateColor,
  vv as interpolateMotionPath,
  pe as interpolateNumber,
  Vd as interpolatePathString,
  Gd as interpolateQuaternion,
  Ra as interpolateString,
  Gv as invertSimilarity,
  Zu as isCubicBezierEasing,
  ql as isHeld,
  Ke as isInertiaTrack,
  av as isMotionPathPoint,
  ih as isMotionPathTrack,
  Gs as isParametricEasing,
  gs as isPathData,
  Xe as isSpringTrack,
  vr as isTextTrack,
  uv as isUnderdamped,
  Tv as isUnresolved,
  _h as isoDepth,
  Hh as isometricBoxFaces,
  Ch as isometricFaces,
  hb as jointsInScene,
  e1 as jointsToScene,
  Ci as linear,
  Au as lipSyncKeyframes,
  $u as lipSyncOver,
  lx as lipSyncTracks,
  hu as lit,
  Qt as live,
  Bv as loopBeats,
  Lv as loopEase,
  Wv as loopNoise,
  Nu as loosePartsOf,
  Gk as lyingPose,
  to as mapEase,
  aM as mat4,
  zx as matchMedia,
  ah as maxStaggerDistance,
  QM as meetHands,
  ZM as meetingSpacing,
  tM as metaballContours,
  Hf as metaballField,
  G1 as mirrorHumanPose,
  u1 as mirrorPose,
  uu as mixColors,
  os as mixHandPoses,
  cb as mixPoses,
  Nd as morphPath,
  vk as motorbike,
  Yg as mount,
  Xg as mountAll,
  $v as narrationMarkers,
  Pv as narrationSceneAt,
  Vs as naturalRest,
  Iv as nearestBeat,
  Ov as nextBeat,
  uw as niceCeiling,
  d5 as owl,
  jx as pageTransition,
  Pb as panelMesh,
  bd as parametricEasing,
  f5 as parrot,
  In as parseAnchor,
  Ja as parseEdge,
  Sn as parsePath,
  Xh as parseTrigger,
  ss as partialPath,
  Qg as pathLength,
  Ax as pedallingKeys,
  th as pedallingPose,
  Qv as penroseStairs,
  Zv as penroseTriangle,
  dx as persona,
  En as phaseOf,
  Fo as pieceMotion,
  h5 as pigeon,
  $h as pingPong,
  Av as planNarration,
  dM as play,
  gM as playSequence,
  hM as playWhenVisible,
  Mh as playheadCrossings,
  Rr as pointAlong,
  uh as pointAtDistance,
  PM as pointOnHead,
  Ef as pointsToPath,
  _t as pose,
  wM as poseTracks,
  Vv as powSimilarity,
  Er as projectIsometric,
  wa as propActions,
  ok as propAnchors3D,
  ya as propAt,
  Du as propControls,
  au as propLineWidth,
  Tx as propObjects,
  sk as propPartsInSpace,
  Xu as propPreset,
  Mx as propRide,
  $x as propRide3D,
  m5 as propScript,
  Ex as propScript3D,
  wo as propShapeMesh,
  mx as propSurface,
  lk as propTarget,
  Sx as propTow,
  tk as propView,
  Qe as quadruped,
  bv as quat,
  Ix as quickPlay,
  qx as quickTo,
  n5 as rabbit,
  Sh as randomBetween,
  Sv as randomChoice,
  hf as randomSnapped,
  Pe as reachCharacter,
  I2 as reachOf,
  Su as resolveActingStyle,
  su as resolveCharacterPoseKeys,
  Py as resolveFacialHair,
  Oo as resolveGait,
  Wy as resolveGlasses,
  by as resolveHair,
  By as resolveHat,
  jy as resolveHeadLook,
  tb as resolveHolding,
  Fr as resolvePoseKeys,
  uf as resolveSequence,
  y0 as resolveStickFrame,
  s1 as resolveStickPose,
  Ah as resolveValue,
  Pf as ribbon,
  If as ribbonHeadCap,
  ha as rideFloors,
  Ye as rotateAbout,
  Br as routineBeats,
  $n as rubberLimb,
  iM as scalePoints,
  nv as scenePreset,
  tv as scenery,
  Ou as scriptActionSummaries,
  fa as scriptTracks,
  cM as scrollProgress,
  uM as scrubOnScroll,
  jM as scrubPath,
  yM as seatHeight,
  cf as serializeTimeline,
  af as serializeTrack,
  Wx as set,
  la as shade,
  Ob as shapeMesh,
  Tr as shapeToPathData,
  Xv as similarity,
  Of as similarityAbout,
  _f as similarityFixedPoint,
  Jv as similarityMatrix,
  Zd as simplifyKeyframes,
  Gc as sittingPose,
  Xr as skeletonInView,
  Yi as sketchPen,
  G5 as skyColors,
  du as smoothPath,
  Xp as smoothToward,
  Hp as snapAxis,
  Jp as snapConfig,
  Qp as snapDuration,
  Zp as snapProgress,
  bs as solveAt,
  Yr as solvePlanSpace,
  Fu as solveProp,
  a5 as songbird,
  Xw as soundsOf,
  b2 as speechDuration,
  xx as spliceTracks,
  Dx as splitText,
  ed as springDuration,
  Ns as springFollow,
  hv as springValueAt,
  oM as squashStretch,
  s5 as squirrel,
  Kr as stagePlanSpace,
  rh as staggerDistance,
  Mr as staggerOffset,
  _i as staggerOffsets,
  ko as staggerSpan,
  Gw as stepsDuration,
  yd as stepsEasing,
  Eu as stepsToKeys,
  k0 as stickFigureAt,
  ae as stickFigureJoints,
  w0 as stickFigureTarget,
  ey as stickToHuman,
  Im as strideLength,
  wt as surfaceBox,
  ux as surfaceScript,
  Gy as sweepingPose,
  Ig as syncMediaElement,
  Om as talkingMouth,
  Lr as taperedLine,
  Ft as taperedOutline,
  of as textAt,
  Ox as tf,
  Nx as ticker,
  Fx as timeline,
  Cx as to,
  Mv as toJSON,
  wv as toKeyframedTrack,
  kv as toKeyframedTracks,
  Fv as torusNoise,
  Ce as trackTargets,
  yk as tractor,
  jv as trailSamples,
  wk as trainCar,
  Mk as tree,
  ns as triggerDistance,
  gk as truck,
  Ib as tubeMesh,
  dt as unknownName,
  pM as unmount,
  ca as valueAt,
  rM as vec3,
  Oe as vehicle,
  Pm as walkPose,
  Fk as wheelchair,
  GM as whiteboard,
  KM as withErased,
  Le as withExpression,
  Rv as wobble
};
