function Ys(s) {
  return typeof s == "object" && s !== null && s.type === "cubic-bezier";
}
function Pt(s) {
  return typeof s == "object" && s !== null && s.type !== "cubic-bezier";
}
function le(s) {
  return s.property === "text" && "textConfig" in s;
}
function G(s) {
  return s.kind === "inertia" && "inertia" in s;
}
function Z(s) {
  return s.kind === "spring" && "spring" in s;
}
function es(s) {
  return s.property === "motionPath" && "motionPathConfig" in s;
}
function Ur(s) {
  return typeof s == "object" && s !== null && "x" in s && "y" in s && "angle" in s;
}
function Vs(s) {
  return "keyframes" in s;
}
class Wr {
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
  tick(t) {
    this._currentTime += t, this.onTick?.(t, this._currentTime);
  }
  reset() {
    this._currentTime = 0;
  }
  seek(t) {
    this._currentTime = t;
  }
}
class zr {
  _currentTime = 0;
  _isRunning = !1;
  _lastFrameTime = null;
  _rafId = null;
  _speed;
  onTick = null;
  constructor(t = {}) {
    this._speed = t.speed ?? 1;
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
  set speed(t) {
    this._speed = t;
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
  seek(t) {
    this._currentTime = t;
  }
  _scheduleFrame() {
    this._rafId = requestAnimationFrame(this._onFrame.bind(this));
  }
  _onFrame(t) {
    if (this._isRunning) {
      if (this._lastFrameTime !== null) {
        const i = (t - this._lastFrameTime) * this._speed;
        this._currentTime += i, this.onTick?.(i, this._currentTime);
      }
      this._lastFrameTime = t, this._scheduleFrame();
    }
  }
}
function ss(s, t, e = "start") {
  if (t <= 1) return 0;
  if (typeof e == "number") {
    const i = Math.max(0, Math.min(t - 1, e));
    return Math.abs(s - i);
  }
  switch (e) {
    case "end":
      return t - 1 - s;
    case "center":
      return Math.abs(s - (t - 1) / 2);
    case "edges":
      return (t - 1) / 2 - Math.abs(s - (t - 1) / 2);
    default:
      return s;
  }
}
function is(s, t = "start") {
  if (s <= 1) return 0;
  let e = 0;
  for (let i = 0; i < s; i++)
    e = Math.max(e, ss(i, s, t));
  return e;
}
function he(s, t, e) {
  if (e.offsets) return e.offsets[s] ?? 0;
  const i = e.from ?? "start", n = ss(s, t, i);
  if (e.amount !== void 0) {
    const r = is(t, i);
    return r === 0 ? 0 : e.amount * n / r;
  }
  return e.each !== void 0 ? e.each * n : 0;
}
function Jt(s, t) {
  return Array.from({ length: s }, (e, i) => he(i, s, t));
}
function It(s, t) {
  return s <= 1 ? 0 : Math.max(...Jt(s, t));
}
const ft = 1, ns = 6e4, Tt = ns / ft, B = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Nt = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Ft {
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
  constructor(t) {
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? B.stiffness, this.damping = t.damping ?? B.damping, this.mass = t.mass ?? B.mass, this.restDelta = t.restDelta ?? B.restDelta, this.restSpeed = t.restSpeed ?? B.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? B.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
  }
  /**
   * Whether a position/velocity pair counts as settled.
   *
   * Both thresholds are fractions of the spring's travel distance:
   * `restDelta` as a fraction of the distance, and `restSpeed` as a fraction
   * of the distance per second. That keeps settling scale-invariant.
   */
  isAtRest(t) {
    return Math.abs(t - this.to) < this.restDelta * this.distance && Math.abs(this.velocity) < this.restSpeed * this.distance;
  }
  /**
   * Position at `timeMs`. Times before 0 clamp to the start value; times past
   * settling return the target exactly.
   */
  valueAt(t) {
    if (t <= 0) return this.from;
    const e = Math.floor(t / ft);
    if (this.simulateTo(e + 1), this.settledStep !== null && e >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(e, this.samples.length - 1)], n = this.samples[Math.min(e + 1, this.samples.length - 1)], r = t / ft - e;
    return i + (n - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Tt + 1), this.settledStep !== null ? this.settledStep * ft : ns;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const e = Math.min(t, Tt + 1), i = ft / 1e3;
    for (; this.samples.length < e; ) {
      const n = this.samples[this.samples.length - 1], r = n - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, c = (o + a) / this.mass;
      this.velocity += c * i;
      const l = n + this.velocity * i;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Tt && (this.settledStep = Tt);
  }
}
function Hr(s, t) {
  return new Ft(s).valueAt(t);
}
function js(s) {
  return new Ft(s).settleTime();
}
function Gr(s) {
  const t = s.stiffness ?? B.stiffness, e = s.damping ?? B.damping, i = s.mass ?? B.mass;
  return e < 2 * Math.sqrt(t * i);
}
function Zr(s) {
  const t = s.stiffness ?? B.stiffness, e = s.mass ?? B.mass;
  return 2 * Math.sqrt(t * e);
}
const ge = 4, Us = 2e-3, Ws = 1e-4, zs = 6e4;
function Lt(s) {
  const t = s.friction ?? ge;
  return t > 0 ? t : ge;
}
function _t(s) {
  return s.from + s.velocity / Lt(s);
}
function Hs(s, t) {
  if (t === void 0) return s;
  if (typeof t == "number")
    return t > 0 ? Math.round(s / t) * t : s;
  if (t.length === 0) return s;
  let e = t[0];
  for (const i of t)
    Math.abs(i - s) < Math.abs(e - s) && (e = i);
  return e;
}
function gt(s) {
  let t = Hs(_t(s), s.end);
  return s.min !== void 0 && (t = Math.max(s.min, t)), s.max !== void 0 && (t = Math.min(s.max, t)), t;
}
function yt(s) {
  const t = Math.abs(gt(s) - s.from);
  if (t === 0) return 0;
  const e = s.restDelta ?? Math.max(Ws, t * Us);
  if (e >= t) return 0;
  const i = Math.log(t / e) / Lt(s);
  return Math.min(zs, i * 1e3);
}
function te(s, t) {
  if (t <= 0) return s.from;
  const e = gt(s);
  if (t >= yt(s)) return e;
  const i = Lt(s);
  return s.from + (e - s.from) * (1 - Math.exp(-i * t / 1e3));
}
function Kr(s, t) {
  const e = Lt(s), i = gt(s);
  return t >= yt(s) ? 0 : (i - s.from) * e * Math.exp(-e * Math.max(0, t) / 1e3);
}
const ee = (s) => s, Gs = (s) => s * s, Zs = (s) => 1 - (1 - s) * (1 - s), Ks = (s) => s < 0.5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2, rs = (s) => s * s * s, os = (s) => 1 - Math.pow(1 - s, 3), Dt = (s) => s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2, Qs = rs, Js = os, ti = Dt, ei = {
  linear: ee,
  "ease-in": Qs,
  "ease-out": Js,
  "ease-in-out": ti,
  "ease-in-quad": Gs,
  "ease-out-quad": Zs,
  "ease-in-out-quad": Ks,
  "ease-in-cubic": rs,
  "ease-out-cubic": os,
  "ease-in-out-cubic": Dt
};
function si(s) {
  const [t, e, i, n] = s, r = 3 * t, o = 3 * (i - t) - r, a = 1 - r - o, c = 3 * e, l = 3 * (n - e) - c, h = 1 - c - l, f = (p) => ((a * p + o) * p + r) * p, u = (p) => ((h * p + l) * p + c) * p, d = (p) => (3 * a * p + 2 * o) * p + r, m = (p) => {
    let g = p;
    for (let w = 0; w < 8; w++) {
      const x = f(g) - p;
      if (Math.abs(x) < 1e-7)
        return g;
      const v = d(g);
      if (Math.abs(v) < 1e-7)
        break;
      g -= x / v;
    }
    let y = 0, b = 1;
    for (g = p; y < b; ) {
      const w = f(g);
      if (Math.abs(w - p) < 1e-7)
        return g;
      p > w ? y = g : b = g, g = (y + b) / 2;
    }
    return g;
  };
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const g = m(p);
    return u(g);
  };
}
function Xt(s, t = "out") {
  if (t === "out") return s;
  const e = (i) => 1 - s(1 - i);
  return t === "in" ? e : (i) => i < 0.5 ? e(i * 2) / 2 : s(i * 2 - 1) / 2 + 0.5;
}
function ii(s = 1, t = 0.3) {
  const e = Math.max(1, s), i = t / (2 * Math.PI) * Math.asin(1 / e);
  return (n) => n <= 0 ? 0 : n >= 1 ? 1 : e * Math.pow(2, -10 * n) * Math.sin((n - i) * (2 * Math.PI) / t) + 1;
}
const ni = (s) => {
  if (s <= 0) return 0;
  if (s >= 1) return 1;
  if (s < 1 / 2.75) return 7.5625 * s * s;
  if (s < 2 / 2.75) {
    const n = s - 0.5454545454545454;
    return 7.5625 * n * n + 0.75;
  }
  if (s < 2.5 / 2.75) {
    const n = s - 0.8181818181818182;
    return 7.5625 * n * n + 0.9375;
  }
  const i = s - 2.625 / 2.75;
  return 7.5625 * i * i + 0.984375;
};
function ri(s = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const e = t - 1;
    return e * e * ((s + 1) * e + s) + 1;
  };
}
function oi(s, t = "end") {
  const e = Math.max(1, Math.floor(s));
  return (i) => {
    if (i >= 1) return 1;
    if (i <= 0) return t === "start" || t === "both" ? t === "start" ? 1 / e : 1 / (e + 1) : 0;
    const n = Math.floor(i * e);
    switch (t) {
      case "start":
        return Math.min(1, (n + 1) / e);
      case "both":
        return (n + 1) / (e + 1);
      case "none":
        return e === 1 ? 0 : Math.min(1, n / (e - 1));
      default:
        return n / e;
    }
  };
}
function ai(s) {
  switch (s.type) {
    case "steps":
      return oi(s.count, s.position);
    case "elastic":
      return Xt(ii(s.amplitude, s.period), s.mode);
    case "bounce":
      return Xt(ni, s.mode);
    case "back":
      return Xt(ri(s.overshoot), s.mode);
  }
}
function j(s) {
  return s === void 0 ? ee : Ys(s) ? si(s.points) : Pt(s) ? ai(s) : ei[s] ?? ee;
}
const ye = 32, ci = 256, Q = /* @__PURE__ */ new Map(), li = /[MmLlHhVvCcSsQqTtAaZz]/, hi = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, ui = {
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
function fi(s) {
  const t = [];
  let e = 0, i = null;
  const n = () => {
    for (; e < s.length && /[\s,]/.test(s[e]); ) e++;
  };
  for (; e < s.length && (n(), !(e >= s.length)); ) {
    const r = s[e];
    if (li.test(r)) {
      i = { type: r, args: [] }, t.push(i), e++;
      continue;
    }
    if (!i) break;
    const o = i.type === "A" || i.type === "a", a = i.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      i.args.push(r === "1" ? 1 : 0), e++;
      continue;
    }
    const c = hi.exec(s.slice(e));
    if (!c) break;
    i.args.push(parseFloat(c[0])), e += c[0].length;
  }
  return t;
}
function di(s, t, e, i, n, r, o, a, c) {
  if (s === a && t === c) return [];
  let l = Math.abs(e), h = Math.abs(i);
  if (l === 0 || h === 0) return [[s, t, a, c, a, c]];
  const f = n * Math.PI / 180, u = Math.cos(f), d = Math.sin(f), m = (s - a) / 2, p = (t - c) / 2, g = u * m + d * p, y = -d * m + u * p, b = g * g / (l * l) + y * y / (h * h);
  if (b > 1) {
    const C = Math.sqrt(b);
    l *= C, h *= C;
  }
  const w = r === o ? -1 : 1, x = l * l * h * h - l * l * y * y - h * h * g * g, v = l * l * y * y + h * h * g * g, T = w * Math.sqrt(Math.max(0, x / v)), S = T * l * y / h, _ = -T * h * g / l, F = u * S - d * _ + (s + a) / 2, k = d * S + u * _ + (t + c) / 2, M = (C, $, I, K) => {
    const Ot = C * I + $ * K, vt = Math.sqrt((C * C + $ * $) * (I * I + K * K)), ot = Math.acos(Math.max(-1, Math.min(1, Ot / vt)));
    return C * K - $ * I < 0 ? -ot : ot;
  }, P = M(1, 0, (g - S) / l, (y - _) / h);
  let A = M((g - S) / l, (y - _) / h, (-g - S) / l, (-y - _) / h);
  !o && A > 0 && (A -= 2 * Math.PI), o && A < 0 && (A += 2 * Math.PI);
  const E = Math.max(1, Math.ceil(Math.abs(A) / (Math.PI / 2))), L = A / E, X = 4 / 3 * Math.tan(L / 4), q = (C) => {
    const $ = l * Math.cos(C), I = h * Math.sin(C);
    return [u * $ - d * I + F, d * $ + u * I + k];
  }, rt = (C) => {
    const $ = -l * Math.sin(C), I = h * Math.cos(C);
    return [u * $ - d * I, d * $ + u * I];
  }, wt = [];
  for (let C = 0; C < E; C++) {
    const $ = P + C * L, I = $ + L, [K, Ot] = q($), [vt, ot] = C === E - 1 ? [a, c] : q(I), [Os, Ns] = rt($), [Xs, qs] = rt(I);
    wt.push([K + X * Os, Ot + X * Ns, vt - X * Xs, ot - X * qs, vt, ot]);
  }
  return wt;
}
function W(s, t, e, i, n) {
  const r = 1 - n;
  return r * r * r * s + 3 * r * r * n * t + 3 * r * n * n * e + n * n * n * i;
}
function be(s, t, e, i, n) {
  const r = 1 - n;
  return 3 * r * r * (t - s) + 6 * r * n * (e - t) + 3 * n * n * (i - e);
}
function at(s, t, e, i) {
  return {
    subpath: 0,
    type: "L",
    points: [e, i],
    startX: s,
    startY: t,
    endX: e,
    endY: i,
    length: Math.hypot(e - s, i - t)
  };
}
function xt(s, t, e) {
  const [i, n, r, o, a, c] = e, l = [0];
  let h = s, f = t, u = 0;
  for (let d = 1; d <= ye; d++) {
    const m = d / ye, p = W(s, i, r, a, m), g = W(t, n, o, c, m);
    u += Math.hypot(p - h, g - f), l.push(u), h = p, f = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [i, n, r, o, a, c],
    startX: s,
    startY: t,
    endX: a,
    endY: c,
    length: u,
    lengths: l
  };
}
function st(s) {
  const t = Q.get(s);
  if (t) return t;
  const e = [];
  let i = 0, n = 0, r = 0, o = 0, a = null, c = null, l = -1;
  const h = /* @__PURE__ */ new Set(), f = (p) => {
    l < 0 && (l = 0), p.subpath = l, e.push(p);
  };
  for (const { type: p, args: g } of fi(s)) {
    const y = p.toUpperCase(), b = p !== y, w = ui[y];
    if (y === "Z") {
      (i !== r || n !== o) && f(at(i, n, r, o)), l >= 0 && h.add(l), i = r, n = o, a = c = null;
      continue;
    }
    for (let x = 0; x + w <= g.length; x += w) {
      const v = g.slice(x, x + w), T = b ? i : 0, S = b ? n : 0;
      let _ = null, F = null;
      switch (y) {
        case "M":
          x === 0 ? (i = v[0] + T, n = v[1] + S, r = i, o = n, (l < 0 || e[e.length - 1]?.subpath === l) && l++) : (f(at(i, n, v[0] + T, v[1] + S)), i = v[0] + T, n = v[1] + S);
          break;
        case "L":
          f(at(i, n, v[0] + T, v[1] + S)), i = v[0] + T, n = v[1] + S;
          break;
        case "H":
          f(at(i, n, v[0] + T, n)), i = v[0] + T;
          break;
        case "V":
          f(at(i, n, i, v[0] + S)), n = v[0] + S;
          break;
        case "C": {
          const k = [v[0] + T, v[1] + S, v[2] + T, v[3] + S, v[4] + T, v[5] + S];
          f(xt(i, n, k)), _ = [k[2], k[3]], i = k[4], n = k[5];
          break;
        }
        case "S": {
          const [k, M] = a ? [2 * i - a[0], 2 * n - a[1]] : [i, n], P = [k, M, v[0] + T, v[1] + S, v[2] + T, v[3] + S];
          f(xt(i, n, P)), _ = [P[2], P[3]], i = P[4], n = P[5];
          break;
        }
        case "Q":
        case "T": {
          let k = i, M = n;
          y === "Q" ? (k = v[0] + T, M = v[1] + S) : c && (k = 2 * i - c[0], M = 2 * n - c[1]);
          const P = y === "Q" ? v[2] + T : v[0] + T, A = y === "Q" ? v[3] + S : v[1] + S;
          f(
            xt(i, n, [
              i + 2 / 3 * (k - i),
              n + 2 / 3 * (M - n),
              P + 2 / 3 * (k - P),
              A + 2 / 3 * (M - A),
              P,
              A
            ])
          ), F = [k, M], i = P, n = A;
          break;
        }
        case "A": {
          const k = v[5] + T, M = v[6] + S;
          let P = i, A = n;
          for (const E of di(i, n, v[0], v[1], v[2], v[3], v[4], k, M))
            f(xt(P, A, E)), P = E[4], A = E[5];
          i = k, n = M;
          break;
        }
      }
      a = _, c = F;
    }
  }
  const u = e.reduce((p, g) => p + g.length, 0), d = [];
  for (let p = 0; p < e.length; ) {
    const g = e[p].subpath;
    let y = p, b = 0;
    for (; y < e.length && e[y].subpath === g; ) b += e[y++].length;
    const w = e[p], x = e[y - 1], v = h.has(g) || Math.abs(x.endX - w.startX) < 1e-9 && Math.abs(x.endY - w.startY) < 1e-9;
    d.push({ start: p, end: y, length: b, closed: v }), p = y;
  }
  const m = { segments: e, totalLength: u, subpaths: d };
  return Q.size >= ci && Q.delete(Q.keys().next().value), Q.set(s, m), m;
}
function pi(s, t) {
  const e = s.lengths;
  if (t <= 0) return 0;
  if (t >= s.length) return 1;
  let i = 0, n = e.length - 1;
  for (; i < n - 1; ) {
    const a = i + n >> 1;
    e[a] < t ? i = a : n = a;
  }
  const r = e[n] - e[i], o = r > 0 ? (t - e[i]) / r : 0;
  return (i + o) / (e.length - 1);
}
function mi(s, t) {
  if (s.type === "L") {
    const f = s.length > 0 ? Math.max(0, Math.min(1, t / s.length)) : 0;
    return {
      x: s.startX + (s.endX - s.startX) * f,
      y: s.startY + (s.endY - s.startY) * f,
      angle: Math.atan2(s.endY - s.startY, s.endX - s.startX) * 180 / Math.PI
    };
  }
  const [e, i, n, r, o, a] = s.points, c = pi(s, t);
  let l = be(s.startX, e, n, o, c), h = be(s.startY, i, r, a, c);
  if (Math.hypot(l, h) < 1e-9) {
    const f = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), u = W(s.startX, e, n, o, f), d = W(s.startY, i, r, a, f), m = W(s.startX, e, n, o, c), p = W(s.startY, i, r, a, c);
    l = c < 0.5 ? u - m : m - u, h = c < 0.5 ? d - p : p - d;
  }
  return {
    x: W(s.startX, e, n, o, c),
    y: W(s.startY, i, r, a, c),
    angle: Math.atan2(h, l) * 180 / Math.PI
  };
}
function as(s, t, e = 0, i = s.length) {
  if (i <= e) return { x: 0, y: 0, angle: 0 };
  let n = 0;
  for (let r = e; r < i; r++) {
    const o = s[r];
    if (n + o.length >= t || r === i - 1)
      return mi(o, t - n);
    n += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function gi(s, t) {
  const { segments: e, totalLength: i } = st(s);
  return as(e, Math.max(0, Math.min(1, t)) * i);
}
function Qr() {
  Q.clear();
}
function Jr(s) {
  return st(s).totalLength;
}
const yi = 24, bi = 320, wi = 2.5, ct = 72, to = 64, vi = 0.2, Ti = 128, dt = /* @__PURE__ */ new Map();
let kt = 0, U;
const we = (s) => Math.round(s * 100) / 100;
function ve(s, t) {
  const { segments: e, subpaths: i, totalLength: n } = st(s);
  if (e.length === 0) return [];
  if (t) {
    const r = i.every((o) => o.closed);
    return [{ segments: e, start: 0, end: e.length, length: n, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: e, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function se(s, t) {
  const e = s.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = as(s.segments, e * s.length, s.start, s.end);
  return [i.x, i.y];
}
function Te(s) {
  const t = [];
  let e = 0;
  for (let i = s.start; i < s.end; i++)
    e += s.segments[i].length, s.length > 0 && t.push(e / s.length);
  return t;
}
function xe(s, t) {
  const e = [];
  for (let i = 0; i < t; i++)
    e.push(se(s, s.closed ? i / t : i / (t - 1)));
  return e;
}
function Se(s) {
  let t = 0, e = 0;
  for (const [i, n] of s)
    t += i, e += n;
  return t /= s.length, e /= s.length, s.map(([i, n]) => [i - t, n - e]);
}
function xi(s, t, e) {
  const i = s.closed && t.closed;
  if (e !== void 0)
    return { offset: i ? Math.abs(e) % ct / ct : 0, reversed: e < 0 };
  const n = Se(xe(s, ct)), r = Se(xe(t, ct)), o = ct;
  let a = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const h = i ? o : 1;
    for (let f = 0; f < h; f++) {
      let u = 0;
      for (let d = 0; d < o && u < c; d++) {
        const m = i ? l ? (f - d + o) % o : (d + f) % o : l ? o - 1 - d : d, p = n[d][0] - r[m][0], g = n[d][1] - r[m][1];
        u += p * p + g * g;
      }
      u < c && (c = u, a = { offset: i ? f / o : 0, reversed: l });
    }
  }
  return a;
}
function Si(s, t, e) {
  return e ? ((t.reversed ? t.offset - s : s + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - s : s;
}
function Mi(s, t, e) {
  return e ? ((t.reversed ? t.offset - s : s - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - s : s;
}
function ki(s, t, e) {
  const i = s.closed && t.closed, n = xi(s, t, e.shapeIndex), r = Math.max(
    yi,
    Math.min(bi, Math.ceil(Math.max(s.length, t.length) / wi))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of Te(s)) a(f);
  for (const f of Te(t)) a(Mi(f, n, i));
  let c = [...o].sort((f, u) => f - u);
  i && (c = c.filter((f) => f < 1));
  const l = [], h = [];
  for (const f of c)
    l.push(...se(s, f)), h.push(...se(t, Si(f, n, i)));
  return Ai({ from: l, to: h, closed: i });
}
function Ai(s) {
  const t = s.from.length / 2;
  if (t <= 3) return s;
  const e = new Uint8Array(t);
  e[0] = 1, e[t - 1] = 1;
  const i = [[0, t - 1]];
  for (; i.length > 0; ) {
    const [o, a] = i.pop();
    let c = -1, l = vi;
    for (let h = o + 1; h < a; h++) {
      const f = Math.max(Me(s.from, o, a, h), Me(s.to, o, a, h));
      f > l && (l = f, c = h);
    }
    c !== -1 && (e[c] = 1, i.push([o, c], [c, a]));
  }
  const n = [], r = [];
  for (let o = 0; o < t; o++)
    e[o] && (n.push(s.from[o * 2], s.from[o * 2 + 1]), r.push(s.to[o * 2], s.to[o * 2 + 1]));
  return { from: n, to: r, closed: s.closed };
}
function Me(s, t, e, i) {
  const n = s[t * 2], r = s[t * 2 + 1], o = s[e * 2] - n, a = s[e * 2 + 1] - r, c = s[i * 2] - n, l = s[i * 2 + 1] - r, h = o * o + a * a, f = h === 0 ? 0 : Math.max(0, Math.min(1, (c * o + l * a) / h));
  return Math.hypot(c - f * o, l - f * a);
}
function Pi(s, t, e) {
  const i = e.shapeIndex;
  if (U && U.from === s && U.to === t && U.shapeIndex === i) return U.plan;
  const r = dt.get(String(i ?? "auto"))?.get(s)?.get(t);
  if (r)
    return U = { from: s, to: t, shapeIndex: i, plan: r }, r;
  const o = st(s).subpaths.filter((d) => d.length > 0).length === st(t).subpaths.filter((d) => d.length > 0).length, a = ve(s, !o), c = ve(t, !o), l = {
    pairs: a.map((d, m) => ki(d, c[m], e))
  };
  kt >= Ti && (dt.clear(), kt = 0);
  const h = String(i ?? "auto"), f = dt.get(h) ?? /* @__PURE__ */ new Map();
  dt.set(h, f);
  const u = f.get(s) ?? /* @__PURE__ */ new Map();
  return f.set(s, u), u.set(t, l), kt++, U = { from: s, to: t, shapeIndex: i, plan: l }, l;
}
function _i(s, t, e, i = {}) {
  if (!s) return t;
  if (!t) return s;
  const n = Math.max(0, Math.min(1, e));
  if (n === 0) return s;
  if (n === 1) return t;
  const r = Pi(s, t, i);
  if (r.pairs.length === 0) return n < 0.5 ? s : t;
  let o = "";
  for (const a of r.pairs) {
    for (let c = 0; c < a.from.length; c += 2) {
      const l = we(a.from[c] + (a.to[c] - a.from[c]) * n), h = we(a.from[c + 1] + (a.to[c + 1] - a.from[c + 1]) * n);
      o += `${c === 0 ? o ? " M" : "M" : " L"}${l} ${h}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function eo() {
  dt.clear(), kt = 0, U = void 0;
}
function bt(s) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(s);
}
const Y = (s, t, e) => s + (t - s) * e, cs = 512, qt = /* @__PURE__ */ new Map(), Yt = /* @__PURE__ */ new Map();
function ke(s) {
  const t = qt.get(s);
  if (t) return t;
  const e = s.replace("#", ""), i = [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16)
  ];
  return qt.size < cs && qt.set(s, i), i;
}
const Ae = (s) => s.charCodeAt(0) === 35, Pe = (s) => s.startsWith("rgb"), _e = (s) => s.startsWith("rgba"), Ei = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Vt = (s) => Math.round(s).toString(16).padStart(2, "0");
function Ci(s, t, e) {
  return `#${Vt(s)}${Vt(t)}${Vt(e)}`;
}
function Ee(s) {
  const t = Yt.get(s);
  if (t) return t;
  const e = s.match(Ei);
  if (!e)
    throw new Error(`Invalid rgb color: ${s}`);
  const i = parseInt(e[1], 10), n = parseInt(e[2], 10), r = parseInt(e[3], 10), o = e[4] !== void 0 ? [i, n, r, parseFloat(e[4])] : [i, n, r];
  return Yt.size < cs && Yt.set(s, o), o;
}
const Ri = (s, t, e) => {
  if (Ae(s) && Ae(t)) {
    const [i, n, r] = ke(s), [o, a, c] = ke(t), l = Y(i, o, e), h = Y(n, a, e), f = Y(r, c, e);
    return Ci(l, h, f);
  }
  if ((Pe(s) || _e(s)) && (Pe(t) || _e(t))) {
    const i = Ee(s), n = Ee(t), r = Math.round(Y(i[0], n[0], e)), o = Math.round(Y(i[1], n[1], e)), a = Math.round(Y(i[2], n[2], e));
    if (i.length === 4 || n.length === 4) {
      const c = i[3] ?? 1, l = n[3] ?? 1, h = Y(c, l, e);
      return `rgba(${r}, ${o}, ${a}, ${h})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return e < 1 ? s : t;
}, $i = (s, t, e) => {
  const i = Math.min(s.length, t.length), n = [];
  for (let r = 0; r < i; r++)
    n.push(Y(s[r], t[r], e));
  return n;
}, Ce = (s, t, e) => e < 1 ? s : t, Ii = (s, t, e) => _i(s, t, e);
function Et(s) {
  return typeof s == "number" ? Y : Array.isArray(s) ? $i : typeof s == "string" ? s.startsWith("#") || s.startsWith("rgb") ? Ri : bt(s) ? Ii : Ce : Ce;
}
const ls = 1e3 / 60;
function hs(s, t = {}) {
  if (!Z(s))
    throw new Error(`bakeSpringTrack: track "${s.id}" is not a spring track`);
  const e = new Ft(s.spring);
  return fs(s, (i) => e.valueAt(i), e.settleTime(), s.spring.from, s.spring.to, t);
}
function us(s, t = {}) {
  if (!G(s))
    throw new Error(`bakeInertiaTrack: track "${s.id}" is not an inertia track`);
  const e = s.inertia;
  return fs(
    s,
    (i) => te(e, i),
    yt(e),
    e.from,
    gt(e),
    t
  );
}
function fs(s, t, e, i, n, r) {
  const o = r.intervalMs ?? ls, a = r.tolerance ?? 0.01, c = s.delay ?? 0, l = [];
  for (let f = 0; f <= e; f += o)
    l.push({ time: f + c, value: t(f), easing: "linear" });
  const h = l[l.length - 1];
  return !h || h.time < e + c ? l.push({ time: e + c, value: n, easing: "linear" }) : h.value = n, c > 0 && l.unshift({ time: 0, value: i, easing: "linear" }), {
    id: s.id,
    target: s.target,
    property: s.property,
    keyframes: a > 0 ? Li(l, a) : l,
    ...s.targets && { targets: [...s.targets] },
    ...s.stagger && { stagger: { ...s.stagger } }
  };
}
function ds(s, t, e, i = {}) {
  const n = i.intervalMs ?? ls, r = typeof e == "function" ? e : j(e), o = Et(s.value), a = t.time - s.time;
  if (a <= 0) return [t];
  const c = [];
  for (let h = n; h < a; h += n) {
    const f = h / a;
    c.push({
      time: s.time + h,
      value: o(s.value, t.value, r(f)),
      easing: "linear"
    });
  }
  const l = r(1);
  return c.push({ ...t, ...l !== 1 && { value: o(s.value, t.value, l) }, easing: "linear" }), c;
}
function so(s, t) {
  return Z(s) ? hs(s, t) : G(s) ? us(s, t) : s;
}
function Fi(s, t = {}) {
  const e = s.keyframes;
  if (!e.some((n) => Pt(n.easing))) return s;
  const i = e.length > 0 ? [e[0]] : [];
  for (let n = 1; n < e.length; n++) {
    const r = e[n];
    Pt(r.easing) ? i.push(...ds(e[n - 1], r, r.easing, t)) : i.push(r);
  }
  return { ...s, keyframes: i };
}
function io(s, t) {
  return s.filter(Vs).map((e) => Fi(e, t)).concat(
    s.filter(Z).map((e) => hs(e, t)),
    s.filter(G).map((e) => us(e, t))
  );
}
function Li(s, t) {
  if (s.length <= 2) return s;
  const e = [s[0]];
  for (let i = 1; i < s.length - 1; i++) {
    const n = e[e.length - 1], r = s[i], o = s[i + 1], a = o.time - n.time;
    if (a <= 0) continue;
    const c = (r.time - n.time) / a, l = n.value + (o.value - n.value) * c;
    Math.abs(r.value - l) > t && e.push(r);
  }
  return e.push(s[s.length - 1]), e;
}
function ie(s) {
  const t = [...s.keyframes].sort((e, i) => e.time - i.time);
  return {
    ...s,
    keyframes: t
  };
}
function z(s) {
  return s.targets && s.targets.length > 0 ? s.targets : [s.target];
}
function it(s, t, e, i) {
  const n = e ?? 0;
  return !i || t <= 1 ? n : n + he(s, t, i);
}
class jt {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = z(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - it(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const e = this.targets.length, i = [];
    for (let n = 0; n < e; n++) {
      const r = it(n, e, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
      o !== void 0 && i.push({ target: this.targets[n], value: o, start: r + this.track.keyframes[0].time });
    }
    return i;
  }
  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration() {
    const { keyframes: t } = this.track;
    if (t.length === 0)
      return 0;
    const e = t[t.length - 1].time, i = this.track.stagger ? It(this.targets.length, this.track.stagger) : 0;
    return e + (this.track.delay ?? 0) + i + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(t) {
    const { keyframes: e } = this.track;
    if (e.length === 0)
      return;
    if (e.length === 1 || t <= e[0].time)
      return e[0].value;
    if (t >= e[e.length - 1].time)
      return e[e.length - 1].value;
    const { from: i, to: n } = this.findSurroundingKeyframes(t);
    if (!i || !n)
      return;
    if (i.time === t)
      return i.value;
    const r = n.time - i.time, o = (t - i.time) / r, c = j(n.easing)(o);
    return Et(i.value)(i.value, n.value, c);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: e } = this.track;
    for (let i = 0; i < e.length - 1; i++)
      if (t >= e[i].time && t <= e[i + 1].time)
        return { from: e[i], to: e[i + 1] };
    return { from: null, to: null };
  }
}
class Di {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = z(t), this.sampler = new Ft(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - it(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, i = [];
    for (let n = 0; n < e; n++) {
      const r = it(n, e, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[n], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? It(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class Bi {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = z(t), this.duration = yt(t.inertia);
  }
  getValueAtTime(t) {
    return te(this.track.inertia, t - it(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, i = [];
    for (let n = 0; n < e; n++) {
      const r = it(n, e, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[n], value: te(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? It(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function ps(s, t) {
  const e = { ...gi(s.pathData, t) };
  if (s.matrix) {
    const [i, n, r, o, a, c] = s.matrix, { x: l, y: h } = e;
    e.x = i * l + r * h + a, e.y = n * l + o * h + c;
    const f = e.angle * Math.PI / 180, u = Math.cos(f), d = Math.sin(f);
    e.angle = Math.atan2(n * u + o * d, i * u + r * d) * 180 / Math.PI;
  }
  return s.autoRotate && s.rotateOffset && (e.angle += s.rotateOffset), e;
}
function no(s, t, e, i) {
  const n = t + (e - t) * i;
  return ps(s, n);
}
const Ut = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Oi = 20;
function Ni(s) {
  const t = Ut[s ?? "upperCase"] ?? s ?? Ut.upperCase, e = Array.from(t);
  return e.length > 0 ? e : Array.from(Ut.upperCase);
}
function Xi(s, t, e) {
  let i = (s | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(e + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function qi(s, t, e = 0) {
  const i = s.from ?? "", n = s.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return n;
  const o = Array.from(i), a = Array.from(n), c = s.rightToLeft ?? !1;
  if (s.mode === "type") {
    const b = Math.round(r * Math.max(o.length, a.length));
    return c ? o.slice(0, Math.max(0, o.length - b)).join("") + a.slice(Math.max(0, a.length - b)).join("") : a.slice(0, b).join("") + o.slice(b).join("");
  }
  const l = Math.max(0, Math.min(0.999, s.revealDelay ?? 0)), h = Math.max(0, (r - l) / (1 - l)), f = Math.floor(h * a.length), u = s.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), d = Ni(s.chars), m = s.refreshRate ?? Oi, p = m > 0 ? Math.floor(e * m / 1e3) : 0, g = s.seed ?? 1;
  let y = "";
  for (let b = 0; b < u; b++) {
    const w = c ? b >= u - f : b < f, x = c ? a[a.length - (u - b)] : a[b];
    w && x !== void 0 || x === " " || x === `
` ? y += x : y += d[Xi(g, b, p) % d.length];
  }
  return y;
}
class ms {
  id;
  name;
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
  constructor(t) {
    if (this.id = t.id, this.name = t.name, this._config = t.config ?? {}, this._explicitDuration = t.config?.duration, t.tracks)
      for (const e of t.tracks)
        this.addTrack(e);
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
  setDuration(t) {
    if (this._explicitDuration = t, t !== void 0)
      this._config = { ...this._config, duration: t };
    else if (this._config.duration !== void 0) {
      const e = { ...this._config };
      delete e.duration, this._config = e;
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
  set speed(t) {
    this._config.speed = t;
  }
  /**
   * Start or resume playback.
   * If at the end and direction is forward, reset to beginning.
   * If at the beginning and direction is reverse, reset to end.
   */
  play() {
    const t = this.duration;
    this._direction === "forward" && this._currentTime >= t && t > 0 ? (this._currentTime = 0, this._loopIteration = 0) : this._direction === "reverse" && this._currentTime <= 0 && t > 0 && (this._currentTime = t, this._loopIteration = 0), this._playbackState = "playing";
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
  seek(t) {
    const e = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(t, e)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
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
  tick(t) {
    if (this._playbackState !== "playing")
      return;
    const e = this.duration;
    if (e <= 0)
      return;
    let n = t * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const a = Math.min(this._repeatDelayRemaining, n);
      if (this._repeatDelayRemaining -= a, n -= a, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const r = 1e3;
    for (let a = 0; a < r && n > 0 && this._playbackState === "playing"; a++)
      if (this._direction === "forward") {
        const c = e - this._currentTime;
        if (n >= c) {
          if (n -= c, this._currentTime = e, !this._handleEndReached())
            break;
        } else
          this._currentTime += n, n = 0;
      } else {
        const c = this._currentTime;
        if (n >= c) {
          if (n -= c, this._currentTime = 0, !this._handleStartReached())
            break;
        } else
          this._currentTime -= n, n = 0;
      }
    const o = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(o);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(t) {
    const e = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, e);
    else
      for (const [i, n] of this._trackPlayers) {
        const r = n.getTrack().property;
        for (const { target: o, value: a, start: c } of n.getTargetValues(t))
          this._write(e, i, o, r, a, t - c);
      }
    return {
      values: e,
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
  _resolveShared(t, e) {
    const i = /* @__PURE__ */ new Map();
    for (const [n, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: c, start: l } of r.getTargetValues(t)) {
        const h = `${a}\0${o}`, f = l <= t, u = i.get(h);
        (!u || (f !== u.started ? f : f ? l >= u.start : l <= u.start)) && i.set(h, { trackId: n, target: a, property: o, value: c, start: l, started: f });
      }
    }
    for (const { trackId: n, target: r, property: o, value: a, start: c } of i.values())
      this._write(e, n, r, o, a, t - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, e, i, n, r, o) {
    if (r === void 0) return;
    let a = t.get(i);
    a || (a = /* @__PURE__ */ new Map(), t.set(i, a));
    const c = this._textTracks.get(e);
    if (c && typeof r == "number") {
      a.set("text", qi(c.textConfig, r, Math.max(0, o)));
      return;
    }
    const l = this._motionPathTracks.get(e);
    if (l && typeof r == "number") {
      const h = ps(l.motionPathConfig, r);
      a.set("motionPathX", h.x), a.set("motionPathY", h.y), l.motionPathConfig.autoRotate && a.set("motionPathRotate", h.angle);
    } else
      a.set(n, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const e of this._tracks)
        for (const i of z(e)) {
          const n = `${i}\0${e.property}`;
          if (t.has(n)) {
            this._sharedWrites = !0;
            break t;
          }
          t.add(n);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(t) {
    if (this._tracks.push(t), this._sharedWrites = null, G(t)) {
      this._trackPlayers.set(t.id, new Bi(t));
      return;
    }
    if (Z(t)) {
      this._trackPlayers.set(t.id, new Di(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (le(t))
      this._trackPlayers.set(t.id, new jt(t)), this._textTracks.set(t.id, t);
    else if (es(t)) {
      const e = {
        id: t.id,
        target: t.target,
        property: t.property,
        keyframes: t.keyframes,
        delay: t.delay,
        endDelay: t.endDelay,
        targets: t.targets,
        stagger: t.stagger
      };
      this._trackPlayers.set(t.id, new jt(e)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new jt(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, e) {
    const i = this._tracks.findIndex((r) => r.id === t);
    if (i < 0) return;
    const n = this._tracks.slice(i + 1);
    this.removeTrack(t);
    for (const r of n) this.removeTrack(r.id);
    this.addTrack(e);
    for (const r of n) this.addTrack(r);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(t) {
    this._tracks = this._tracks.filter((e) => e.id !== t), this._sharedWrites = null, this._trackPlayers.delete(t), this._motionPathTracks.delete(t), this._springTracks.delete(t), this._textTracks.delete(t);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(t = {}) {
    return this._tracks.filter((e) => this._matches(e, t));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(t = {}) {
    const e = this.getTracks(t).map((i) => i.id);
    for (const i of e)
      this.removeTrack(i);
    return e;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const e = this._trackPlayers.get(t);
    if (!e) return;
    const i = e.getTrack(), n = i.delay ?? 0;
    if (Z(i) || G(i))
      return { from: n, to: e.getDuration() };
    const r = i.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + n, to: e.getDuration() };
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
    const t = [];
    for (let e = 0; e < this._tracks.length; e++) {
      const i = this._tracks[e], n = this.getTrackSpan(i.id);
      if (n)
        for (let r = 0; r < e; r++) {
          const o = this._tracks[r];
          if (o.property !== i.property) continue;
          const a = z(o).filter((f) => z(i).includes(f));
          if (a.length === 0) continue;
          const c = this.getTrackSpan(o.id);
          if (!c || !(c.from <= n.to && n.from <= c.to)) continue;
          const h = n.from >= c.from;
          for (const f of a)
            t.push({
              target: f,
              property: i.property,
              losingTrackId: h ? o.id : i.id,
              winningTrackId: h ? i.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, e) {
    if (e.id !== void 0 && t.id !== e.id || e.property !== void 0 && t.property !== e.property || e.target !== void 0 && !z(t).includes(e.target)) return !1;
    if (e.timeRange) {
      const i = this.getTrackSpan(t.id);
      if (!i || i.to < e.timeRange.from || i.from > e.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      id: this.id,
      name: this.name,
      config: { ...this._config },
      tracks: [...this._tracks]
    };
  }
  /** Start the between-iterations pause, if the timeline configures one. */
  _armRepeatDelay() {
    this._repeatDelayRemaining = this._config.repeatDelay ?? 0;
  }
  _calculateDuration() {
    let t = 0;
    for (const [, e] of this._trackPlayers)
      t = Math.max(t, e.getDuration());
    return t;
  }
  /**
   * Handle reaching the end of the timeline.
   * Returns true if we looped and should continue, false if we stopped.
   */
  _handleEndReached() {
    const t = this._config.loop ?? 0;
    return t === -1 || this._loopIteration < t ? (this._loopIteration++, this._armRepeatDelay(), this._config.alternate ? this._direction = "reverse" : this._repeatDelayRemaining > 0 ? this._wrapAfterDelay = !0 : this._currentTime = 0, this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
  }
  /**
   * Handle reaching the start of the timeline (in reverse).
   * Returns true if we looped and should continue, false if we stopped.
   */
  _handleStartReached() {
    const t = this._config.loop ?? 0;
    return this._config.alternate && (t === -1 || this._loopIteration < t) ? (this._loopIteration++, this._armRepeatDelay(), this._direction = "forward", this._repeatDelayRemaining === 0) : (this._playbackState = "idle", this.onComplete?.(), !1);
  }
}
function Yi(s) {
  return G(s) ? {
    id: s.id,
    target: s.target,
    property: s.property,
    kind: "inertia",
    inertia: gs(s.inertia),
    ...N(s)
  } : Z(s) ? {
    id: s.id,
    target: s.target,
    property: s.property,
    kind: "spring",
    spring: { ...s.spring },
    ...N(s)
  } : le(s) ? {
    id: s.id,
    target: s.target,
    property: "text",
    textConfig: { ...s.textConfig },
    keyframes: s.keyframes.map(Wt),
    ...N(s)
  } : es(s) ? {
    id: s.id,
    target: s.target,
    property: "motionPath",
    motionPathConfig: { ...s.motionPathConfig },
    keyframes: s.keyframes.map(Wt),
    ...N(s)
  } : {
    id: s.id,
    target: s.target,
    property: s.property,
    keyframes: s.keyframes.map(Wt),
    ...N(s)
  };
}
function gs(s) {
  return { ...s, ...Array.isArray(s.end) && { end: [...s.end] } };
}
function Wt(s) {
  return {
    time: s.time,
    value: s.value,
    ...s.easing && { easing: s.easing }
  };
}
function N(s) {
  const t = s.endDelay;
  return {
    ...s.delay !== void 0 && { delay: s.delay },
    ...t !== void 0 && { endDelay: t },
    ...s.targets !== void 0 && { targets: [...s.targets] },
    ...s.stagger !== void 0 && { stagger: { ...s.stagger } }
  };
}
function Vi(s) {
  if (G(s)) {
    const t = s;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: gs(t.inertia),
      ...N(t)
    };
  }
  if (Z(s)) {
    const t = s;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...N(t)
    };
  }
  if (le(s)) {
    const t = s;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((e, i) => e.time - i.time),
      ...N(t)
    };
  }
  if (s.property === "motionPath" && "motionPathConfig" in s) {
    const t = s, e = [...t.keyframes].sort((i, n) => i.time - n.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: e,
      ...N(t)
    };
  }
  return ie({
    id: s.id,
    target: s.target,
    property: s.property,
    keyframes: s.keyframes,
    ...N(s)
  });
}
function ji(s) {
  return {
    id: s.id,
    name: s.name,
    config: {
      duration: s.duration > 0 ? s.duration : void 0,
      loop: s._config.loop,
      speed: s._config.speed,
      alternate: s._config.alternate,
      repeatDelay: s._config.repeatDelay
    },
    tracks: s.tracks.map(Yi)
  };
}
function pt(s) {
  return new ms({
    id: s.id,
    name: s.name,
    config: s.config,
    tracks: s.tracks.map(Vi)
  });
}
function ro(s) {
  return JSON.stringify(ji(s));
}
function oo(s) {
  const t = JSON.parse(s);
  return pt(t);
}
function ao(s) {
  let t = 2166136261;
  for (let e = 0; e < s.length; e++)
    t ^= s.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Ui(s) {
  let t = s >>> 0 || 2654435769;
  return {
    seed: s >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function ys(s, t, e) {
  return t + s.next() * (e - t);
}
function Wi(s, t, e, i) {
  if (i <= 0) return ys(s, t, e);
  const n = Math.floor((e - t) / i), r = Math.round(s.next() * n);
  return t + r * i;
}
function co(s, t) {
  if (t.length !== 0)
    return t[Math.floor(s.next() * t.length)];
}
const bs = /^([+\-*/])=\s*(-?[\d.]+)$/, ws = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function lo(s) {
  return typeof s != "string" ? !1 : bs.test(s.trim()) || ws.test(s.trim());
}
function vs(s, t = {}) {
  if (typeof s != "string") return s;
  const e = s.trim(), i = bs.exec(e);
  if (i) {
    const [, r, o] = i, a = t.base ?? 0, c = Number.parseFloat(o);
    switch (r) {
      case "+":
        return a + c;
      case "-":
        return a - c;
      case "*":
        return a * c;
      case "/":
        return c === 0 ? a : a / c;
    }
  }
  const n = ws.exec(e);
  if (n) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${e}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(n[1]), o = Number.parseFloat(n[2]), a = n[3] !== void 0 ? Number.parseFloat(n[3]) : void 0;
    return a !== void 0 ? Wi(t.random, r, o, a) : ys(t.random, r, o);
  }
  return s;
}
function zi(s, t = 0, e) {
  const i = [];
  let n = t;
  for (const r of s) {
    const o = vs(r, { base: n, random: e });
    i.push(o), typeof o == "number" && (n = o);
  }
  return i;
}
class ho {
  random;
  constructor(t) {
    this.random = Ui(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, e = 0) {
    return vs(t, { base: e, random: this.random });
  }
  resolveSequence(t, e = 0) {
    return zi(t, e, this.random);
  }
}
const Hi = 600;
function Gi(s) {
  if (Array.isArray(s)) {
    const [u, d, m, p] = s;
    return { fn: Re(u, d, m, p), bezier: [u, d, m, p] };
  }
  const { segments: t } = st(s);
  if (t.length === 0) throw new Error(`customEase: no curve in "${s}"`);
  const e = t[0].startX, i = t[0].startY, n = t[t.length - 1], r = n.endX - e, o = n.endY - i;
  if (r === 0 || o === 0) throw new Error(`customEase: "${s}" must move along both axes`);
  const a = (u) => (u - e) / r, c = (u) => (u - i) / o;
  if (t.length === 1 && n.type === "C") {
    const [u, d, m, p] = n.points, g = [a(u), c(d), a(m), c(p)];
    return { fn: Re(...g), bezier: g };
  }
  const l = [], h = [], f = Math.max(8, Math.ceil(Hi / t.length));
  for (const u of t)
    for (let d = l.length === 0 ? 0 : 1; d <= f; d++) {
      const [m, p] = Qi(u, d / f);
      l.push(a(m)), h.push(c(p));
    }
  return { fn: Ji(l, h) };
}
function Zi(s = {}) {
  const e = 0.1 + Math.max(0, Math.min(1, s.strength ?? 0.7)) * 0.7, i = [1];
  for (let r = e; r > 2e-3; r *= e) i.push(2 * Math.sqrt(r));
  const n = i.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * n;
    for (let a = 0; a < i.length; a++) {
      if (o <= i[a]) {
        if (a === 0) return (o / i[0]) ** 2;
        const c = i[a] / 2, l = c * c, h = o - c;
        return 1 - (l - h * h);
      }
      o -= i[a];
    }
    return 1;
  };
}
function Ki(s = {}) {
  const t = Math.max(1, s.wiggles ?? 10), e = s.type ?? "easeOut", i = (n) => e === "uniform" ? 1 : e === "easeInOut" ? Math.sin(Math.PI * n) : (1 - n) ** 2;
  return (n) => n <= 0 || n >= 1 ? 0 : Math.sin(n * t * Math.PI * 2) * i(n);
}
function Qi(s, t) {
  if (s.type === "L") {
    const [l, h] = s.points;
    return [s.startX + (l - s.startX) * t, s.startY + (h - s.startY) * t];
  }
  const [e, i, n, r, o, a] = s.points, c = 1 - t;
  return [
    c * c * c * s.startX + 3 * c * c * t * e + 3 * c * t * t * n + t * t * t * o,
    c * c * c * s.startY + 3 * c * c * t * i + 3 * c * t * t * r + t * t * t * a
  ];
}
function Ji(s, t) {
  return (e) => {
    if (e <= s[0]) return t[0];
    if (e >= s[s.length - 1]) return t[t.length - 1];
    let i = 0, n = s.length - 1;
    for (; n - i > 1; ) {
      const o = i + n >> 1;
      s[o] <= e ? i = o : n = o;
    }
    const r = s[n] - s[i];
    return r === 0 ? t[n] : t[i] + (e - s[i]) / r * (t[n] - t[i]);
  };
}
function Re(s, t, e, i) {
  const n = (o, a, c) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * c + o * o * o, r = (o, a, c) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (c - a) + 3 * o * o * (1 - c);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let h = 0; h < 8; h++) {
      const f = n(a, s, e) - o, u = r(a, s, e);
      if (Math.abs(f) < 1e-6) return n(a, t, i);
      if (Math.abs(u) < 1e-6) break;
      a -= f / u;
    }
    let c = 0, l = 1;
    a = o;
    for (let h = 0; h < 40; h++)
      n(a, s, e) < o ? c = a : l = a, a = (c + l) / 2;
    return n(a, t, i);
  };
}
const O = (s) => Math.round(s * 1e3) / 1e3;
function tn(s, t = {}) {
  if (s.length === 0) return "";
  const e = t.curviness ?? 1, i = t.closed ?? !1, n = s.length;
  let r = `M${O(s[0].x)} ${O(s[0].y)}`;
  if (n === 1) return r;
  const o = (c) => i ? s[(c % n + n) % n] : s[Math.max(0, Math.min(n - 1, c))], a = i ? n : n - 1;
  for (let c = 0; c < a; c++) {
    const l = o(c - 1), h = o(c), f = o(c + 1), u = o(c + 2);
    if (e === 0) {
      r += ` L${O(f.x)} ${O(f.y)}`;
      continue;
    }
    const d = e / 6, m = h.x + (f.x - l.x) * d, p = h.y + (f.y - l.y) * d, g = f.x - (u.x - h.x) * d, y = f.y - (u.y - h.y) * d;
    r += ` C${O(m)} ${O(p)} ${O(g)} ${O(y)} ${O(f.x)} ${O(f.y)}`;
  }
  return i ? `${r} Z` : r;
}
const R = (s, t = 0) => {
  const e = parseFloat(s ?? "");
  return Number.isFinite(e) ? e : t;
};
function en(s) {
  const t = (s ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), e = [];
  for (let i = 0; i + 1 < t.length; i += 2) e.push({ x: t[i], y: t[i + 1] });
  return e;
}
function ue(s) {
  const t = s.attributes;
  switch (s.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const e = R(t.cx), i = R(t.cy), n = s.tag.toLowerCase() === "circle" ? R(t.r) : R(t.rx), r = s.tag.toLowerCase() === "circle" ? R(t.r) : R(t.ry);
      return `M${e + n} ${i} A${n} ${r} 0 1 1 ${e - n} ${i} A${n} ${r} 0 1 1 ${e + n} ${i} Z`;
    }
    case "rect": {
      const e = R(t.x), i = R(t.y), n = R(t.width), r = R(t.height);
      let o = t.rx != null ? R(t.rx) : t.ry != null ? R(t.ry) : 0, a = t.ry != null ? R(t.ry) : o;
      return o = Math.min(o, n / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${e} ${i} H${e + n} V${i + r} H${e} Z` : `M${e + o} ${i} H${e + n - o} A${o} ${a} 0 0 1 ${e + n} ${i + a} V${i + r - a} A${o} ${a} 0 0 1 ${e + n - o} ${i + r} H${e + o} A${o} ${a} 0 0 1 ${e} ${i + r - a} V${i + a} A${o} ${a} 0 0 1 ${e + o} ${i} Z`;
    }
    case "line":
      return `M${R(t.x1)} ${R(t.y1)} L${R(t.x2)} ${R(t.y2)}`;
    case "polyline":
    case "polygon": {
      const e = en(t.points);
      if (e.length === 0) return null;
      const i = e.map((n, r) => `${r === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");
      return s.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
const St = {
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
}, $e = {
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
function sn(s) {
  let t = s.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const e = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return e && e[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${e[1]}.out${e[2] ?? ""}`), t;
}
j({ type: "bounce", mode: "in" });
j({ type: "bounce", mode: "in-out" });
function Ct(s) {
  const t = Ts.get(s.trim().toLowerCase());
  if (t) return t;
  const e = sn(s), i = /^steps\(\s*(\d+)\s*\)$/.exec(e);
  if (i) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(i[1], 10)) + 1, position: "none" };
    return { easing: o, fn: j(o) };
  }
  const n = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(e);
  if (n) {
    const [, r, o, a] = n, c = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), l = o === "inout" ? "in-out" : o;
    if (r === "back" && c.length === 0 && e in St)
      return { easing: { type: "cubic-bezier", points: St[e] } };
    const h = r === "elastic" ? { type: "elastic", mode: l, ...c[0] !== void 0 && { amplitude: c[0] }, ...c[1] !== void 0 && { period: c[1] } } : r === "bounce" ? { type: "bounce", mode: l } : { type: "back", mode: l, ...c[0] !== void 0 && { overshoot: c[0] } };
    return { easing: h, fn: j(h) };
  }
  return e in $e ? { easing: $e[e] } : e in St ? { easing: { type: "cubic-bezier", points: St[e] } } : { easing: "ease-out" };
}
const Ts = /* @__PURE__ */ new Map();
function fe(s, t) {
  return Ts.set(
    s.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), s;
}
function ne(s) {
  let t = s >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let e = t;
    return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
const xs = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Ss(s) {
  return typeof s == "string" && xs.test(s);
}
function nn(s = 1) {
  let t = ne(s);
  const e = (c, l) => ((...h) => h.length >= c ? l(...h) : (f) => l(...h, f)), i = (c, l, h) => Math.min(Math.max(h, Math.min(c, l)), Math.max(c, l)), n = (c, l, h, f, u) => l === c ? h : h + (u - c) / (l - c) * (f - h), r = (c, l) => {
    if (typeof c == "number") return c === 0 ? l : Math.round(l / c) * c;
    if (Array.isArray(c)) return Ie(c, l, 1 / 0);
    if ("values" in c) return Ie(c.values, l, c.radius ?? 1 / 0);
    const h = Math.round(l / c.increment) * c.increment;
    return Math.abs(h - l) <= (c.radius ?? 1 / 0) ? h : l;
  }, o = (c, l, h) => {
    const f = c + t() * (l - c);
    return h ? Math.round(f / h) * h : f;
  };
  return {
    clamp: e(3, i),
    mapRange: e(5, n),
    normalize: e(3, (c, l, h) => n(c, l, 0, 1, h)),
    interpolate: e(3, (c, l, h) => {
      if (typeof c == "object" && !Array.isArray(c)) {
        const f = {};
        for (const u of Object.keys(c))
          f[u] = Et(c[u])(c[u], l[u], h);
        return f;
      }
      return Et(c)(c, l, h);
    }),
    wrap: ((c, l, h) => {
      if (Array.isArray(c)) {
        const p = c, g = (y) => p[(Math.round(y) % p.length + p.length) % p.length];
        return l === void 0 ? g : g(l);
      }
      const f = c, d = l - f, m = (p) => d === 0 ? f : ((p - f) % d + d) % d + f;
      return h === void 0 ? m : m(h);
    }),
    wrapYoyo: e(3, (c, l, h) => {
      const f = l - c;
      if (f === 0) return c;
      const u = ((h - c) % (f * 2) + f * 2) % (f * 2);
      return c + (u > f ? f * 2 - u : u);
    }),
    snap: e(2, r),
    random: ((c, l, h, f) => {
      if (Array.isArray(c)) {
        const d = () => c[Math.floor(t() * c.length)];
        return l === !0 ? d : d();
      }
      const u = () => o(c, l, h);
      return f ? u : u();
    }),
    shuffle: (c) => {
      for (let l = c.length - 1; l > 0; l--) {
        const h = Math.floor(t() * (l + 1));
        [c[l], c[h]] = [c[h], c[l]];
      }
      return c;
    },
    distribute: ({ base: c = 0, amount: l, each: h, from: f = "start", ease: u }) => (d, m, p) => {
      const g = p.length, b = he(d, g, { ...l !== void 0 ? { amount: l } : { each: h ?? 1 }, from: f }), w = l !== void 0 ? l : (h ?? 1) * is(g, f), x = u && w > 0 ? u(b / w) * w : b;
      return c + x;
    },
    pipe: (...c) => (l) => c.reduce((h, f) => f(h), l),
    splitColor: (c) => rn(c),
    getUnit: (c) => typeof c == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(c.trim())?.[1] ?? "",
    seed: (c) => {
      t = ne(c);
    },
    resolveRandomString: (c) => {
      const l = xs.exec(c)?.[1] ?? "";
      if (l.startsWith("[")) {
        const m = l.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [h, f, u] = l.split(",").map((d) => Number.parseFloat(d));
      return o(h, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Ie(s, t, e) {
  let i = t, n = 1 / 0;
  for (const r of s) {
    const o = Math.abs(r - t);
    o < n && (n = o, i = r);
  }
  return n <= e ? i : t;
}
function rn(s) {
  const t = s.trim(), e = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (e) {
    const r = (e.length <= 4 ? [...e].map((o) => o + o).join("") : e).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const i = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((n) => Number.parseFloat(n));
  return i.length >= 4 ? [i[0], i[1], i[2], i[3]] : [i[0] ?? 0, i[1] ?? 0, i[2] ?? 0];
}
const on = /^([+-])=\s*(-?[\d.]+)$/, an = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function lt(s, t) {
  const e = t.scale ?? 1, i = (l) => Number.parseFloat(l) * e;
  if (s === void 0) return t.cursor;
  if (typeof s == "number") return s * e;
  const n = s.trim();
  if (n === "") return t.cursor;
  const r = on.exec(n);
  if (r) {
    const l = i(r[2]);
    return t.cursor + (r[1] === "-" ? -l : l);
  }
  const o = an.exec(n);
  if (o) {
    const l = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return l;
    const h = i(o[3]);
    return l + (o[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(n);
  if (a) {
    const l = t.labels.get(a[1].trim());
    if (l !== void 0) {
      const h = i(a[3]);
      return l + (a[2] === "-" ? -h : h);
    }
  }
  const c = t.labels.get(n);
  return c !== void 0 ? c : /^-?[\d.]+$/.test(n) ? i(n) : t.cursor;
}
function cn(s) {
  if (typeof s != "object" || s === null) return !1;
  const t = s;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function ln(s, t, e = {}) {
  if (s === 0) return [];
  const i = t.grid === "auto" ? Math.max(1, Math.min(s, e.columnsFromLayout?.() ?? s)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : s, n = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(s / i), r = (m) => ({ x: m % i, y: Math.floor(m / i) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (i - 1), y: o[1] * (n - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(s - 1, o))) : o === "end" ? r(s - 1) : o === "center" || o === "edges" ? { x: (i - 1) / 2, y: (n - 1) / 2 } : { x: 0, y: 0 }, c = (m) => {
    const { x: p, y: g } = r(m), y = Math.abs(p - a.x), b = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? b : Math.hypot(y, b);
  };
  let l = Array.from({ length: s }, (m, p) => c(p));
  const h = Math.max(...l);
  if (o === "edges" && (l = l.map((m) => h - m)), o === "random") {
    const m = e.random ?? Math.random;
    l = l.map(() => m() * h);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * h, u = t.ease ? Ct(t.ease) : void 0, d = u ? u.fn ?? j(u.easing) : void 0;
  return l.map((m) => {
    const p = h === 0 ? 0 : m / h;
    return (d ? d(p) : p) * f;
  });
}
const de = /* @__PURE__ */ new Set([
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
]);
function At(s) {
  const t = {}, e = {};
  for (const [i, n] of Object.entries(s))
    de.has(i) ? t[i] = n : e[i] = n;
  return { config: t, properties: e };
}
function Rt(s, t) {
  return s === void 0 ? t : s * 1e3;
}
function re(s, t) {
  if (s !== void 0)
    return typeof s == "number" ? { each: s * 1e3 } : cn(s) ? { offsets: ln(t?.count ?? 0, s, t ?? {}).map((i) => i * 1e3) } : {
      ...s.each !== void 0 && { each: s.each * 1e3 },
      ...s.amount !== void 0 && { amount: s.amount * 1e3 },
      ...s.from !== void 0 && { from: s.from }
    };
}
const hn = {
  opacity: 1,
  x: 0,
  y: 0,
  z: 0,
  rotate: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  rotation: 0,
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
function Ms(s) {
  return hn[s];
}
function un(s) {
  const t = typeof s == "string" || Array.isArray(s) ? { path: s } : s;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let e;
  if (Array.isArray(t.path))
    e = tn(t.path, { curviness: t.curviness });
  else if (bt(t.path))
    e = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: e };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function fn(s) {
  const t = typeof s == "string" || Array.isArray(s) ? { path: s } : { ...s };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function ks(s) {
  return typeof s == "object" && s !== null && "shape" in s ? s.shape : s;
}
function dn(s) {
  if (s.morphSVG === void 0) return s;
  const { morphSVG: t, ...e } = s, i = ks(t);
  if (typeof i != "string" || !bt(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...e, d: i };
}
function pn(s, t) {
  if (s === !0) return [0, t];
  if (s === !1) return [0, 0];
  if (typeof s == "number") return [0, Fe(s, t)];
  const e = s.trim().split(/[\s,]+/).filter(Boolean), i = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${s}" is not a length or percentage`);
    return Fe(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (e.length === 0) return [0, t];
  if (e.length === 1) return [0, i(e[0])];
  const n = i(e[0]), r = i(e[1]);
  return n <= r ? [n, r] : [r, n];
}
function mn(s, t) {
  const [e, i] = pn(s, t);
  return { strokeDasharray: [i - e, t], strokeDashoffset: -e };
}
function gn(s, t) {
  if (s.drawSVG === void 0) return s;
  const { drawSVG: e, ...i } = s;
  return { ...i, ...mn(e, t) };
}
function yn(s) {
  if (s.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return s;
}
function Fe(s, t) {
  return Math.max(0, Math.min(t, s));
}
function bn(s) {
  let t = 2166136261;
  for (let e = 0; e < s.length; e++) t = Math.imul(t ^ s.charCodeAt(e), 16777619);
  return t >>> 0;
}
function wn(s, t, e) {
  if (s.scrambleText !== void 0) {
    const i = s.scrambleText, n = typeof i == "string" ? { text: i } : i;
    if (typeof n?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = n.revealDelay && e > 0 ? n.revealDelay * 1e3 / e : void 0;
    return {
      to: n.text,
      mode: "scramble",
      ...n.chars !== void 0 && { chars: n.chars },
      ...n.speed !== void 0 && { refreshRate: 20 * n.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...n.tweenLength !== void 0 && { tweenLength: n.tweenLength },
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft },
      seed: n.seed ?? bn(`${t}|${n.text}`)
    };
  }
  if (s.text !== void 0) {
    const i = s.text, n = typeof i == "string" ? { value: i } : i;
    if (typeof n?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: n.value,
      mode: "type",
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft }
    };
  }
}
function pe(s) {
  return Math.max(0.1, s / 25);
}
function vn(s, t) {
  const e = typeof t == "number" ? { velocity: t } : t;
  if (typeof e?.velocity != "number" || !Number.isFinite(e.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = e.friction ?? (e.resistance !== void 0 ? pe(e.resistance) : void 0), n = {
    from: s,
    velocity: e.velocity,
    ...i !== void 0 && { friction: i },
    ...e.min !== void 0 && { min: e.min },
    ...e.max !== void 0 && { max: e.max }
  };
  return typeof e.end == "function" ? n.end = [e.end(_t(n))] : e.end !== void 0 && (n.end = Array.isArray(e.end) ? [...e.end] : e.end), n;
}
function Tn(s) {
  const t = s === !0 ? {} : typeof s == "string" ? { preset: s } : s;
  if (t.preset !== void 0 && !(t.preset in Nt))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(Nt).join(", ")}`
    );
  return {
    ...t.preset ? Nt[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function xn(s, t) {
  if (s === !0 || typeof s == "string") return;
  const e = s.velocity;
  return typeof e == "number" ? e : e?.[t];
}
class et {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = ne(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new ms({
      // A timestamped default would make the same script compile to different
      // JSON on every run, which breaks the determinism contract. Callers that
      // need distinct ids pass one.
      id: t.id ?? "gsap-compat",
      name: t.name,
      config: {
        ...t.repeat !== void 0 && { loop: t.repeat },
        ...t.yoyo !== void 0 && { alternate: t.yoyo },
        ...t.repeatDelay !== void 0 && { repeatDelay: t.repeatDelay * 1e3 },
        ...t.timeScale !== void 0 && { speed: t.timeScale }
      }
    });
  }
  // --- tween creation -----------------------------------------------------
  /** Animate to the given values. */
  to(t, e, i) {
    return this.build(t, void 0, ht(e), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, e, i) {
    const { config: n, properties: r } = At(ht(e)), { motionPath: o, text: a, scrambleText: c, ...l } = r, h = this.targetsOf(t)[0], f = { ...n };
    for (const m of Object.keys(l))
      f[m] = this.resolveStart(h, m);
    o !== void 0 && (f.motionPath = fn(o));
    const u = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (u.text = zt(a), f.text = typeof a == "object" ? { ...a, value: d } : d), c !== void 0 && (u.text = zt(c), f.scrambleText = typeof c == "object" ? { ...c, text: d } : d), this.build(t, { ...l, ...u }, f, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, e, i, n) {
    const { properties: r } = At(ht(e));
    return this.build(t, r, ht(i), n);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, e, i) {
    return this.build(t, void 0, { ...ht(e), duration: 0 }, i);
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
  addEvent(t) {
    const e = Math.max(0, lt(t, this.context()));
    return this.previousStart = e, this.previousEnd = e, this.cursor = Math.max(this.cursor, e), e;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return lt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, e) {
    return this.labels.set(t, lt(e, this.context())), this;
  }
  /** Time of a label, in milliseconds. */
  /** Every label's time in milliseconds, in time order. */
  labelTimes() {
    return [...this.labels.values()].sort((t, e) => t - e);
  }
  labelTime(t) {
    return this.labels.get(t);
  }
  /**
   * Merge another compat timeline in at a position.
   *
   * Nested timelines are flattened at compile time — every keyframe is offset
   * and copied in — so there is no nested-timeline runtime and the output is
   * one flat, serializable track list.
   */
  add(t, e) {
    const i = lt(e, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = ie({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((a) => ({ ...a, time: a.time + i }))
      });
      this.timeline.addTrack(o);
    }
    const n = i + t.timeline.duration;
    return this.previousStart = i, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), this;
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
  seek(t) {
    if (typeof t == "string") {
      const e = this.labels.get(t);
      return e !== void 0 && this.timeline.seek(e), this;
    }
    return this.timeline.seek(t * 1e3), this;
  }
  /** Progress through the timeline, 0..1. */
  progress(t) {
    const e = this.timeline.duration;
    return t !== void 0 && e > 0 && this.timeline.seek(t * e), e > 0 ? this.timeline.currentTime / e : 0;
  }
  /** Playback rate. */
  timeScale(t) {
    return t !== void 0 && (this.timeline.speed = t), this.timeline.speed;
  }
  /** Total duration in seconds (GSAP's unit). */
  duration() {
    return this.timeline.duration / 1e3;
  }
  /** Advance by `deltaMs` — the host still owns the animation loop. */
  tick(t) {
    return this.timeline.tick(t), this;
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
  build(t, e, i, n) {
    const { config: r, properties: o } = At(i), { motionPath: a, text: c, scrambleText: l, inertia: h, ...f } = o, u = this.targetsOf(t), d = lt(n, this.context()), m = Rt(r.delay, 0), p = Rt(r.duration, 500), g = re(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), b = [], w = r.spring;
    let x = 0, v = !1;
    for (const [M, P] of Object.entries(f)) {
      const A = P;
      let E = e?.[M] !== void 0 ? e[M] : this.resolveStart(u[0], M);
      if (typeof E != typeof A && (this.warn(
        `no usable start value for "${M}" on "${u[0]}" — it will snap to ${String(A)}. Use fromTo() to animate it.`
      ), E = A), w !== void 0 && typeof E == "number" && typeof A == "number") {
        const q = {
          ...Tn(w),
          from: E,
          to: A,
          velocity: xn(w, M) ?? this.options.startVelocity?.(u[0], M) ?? 0
        }, rt = this.nextTrackId(`${u[0]}-${M}-spring`), wt = {
          id: rt,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: M,
          kind: "spring",
          spring: q,
          delay: d + m
        };
        this.timeline.addTrack(wt), b.push(rt), x = Math.max(x, js(q));
        for (const C of u) this.lastValues.set(`${C}|${M}`, A);
        continue;
      }
      v = !0;
      const L = this.keyframesFor(E, A, p, y, r.ease), X = this.nextTrackId(`${u[0]}-${M}`);
      this.timeline.addTrack(
        ie({
          id: X,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: M,
          delay: d + m,
          keyframes: L
        })
      ), b.push(X);
      for (const q of u) this.lastValues.set(`${q}|${M}`, A);
    }
    const T = wn({ text: c, scrambleText: l }, u[0], p);
    if (T) {
      const M = e?.text ?? e?.scrambleText, P = M !== void 0 ? zt(M) : this.resolveStart(u[0], "text"), A = this.nextTrackId(`${u[0]}-text`), E = {
        id: A,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof P == "string" ? P : String(P ?? ""), ...T },
        delay: d + m,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(E), b.push(A);
      for (const L of u) this.lastValues.set(`${L}|text`, T.to);
    }
    if (a !== void 0) {
      const { config: M, start: P, end: A } = un(a), E = this.nextTrackId(`${u[0]}-motionPath`), L = {
        id: E,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: M,
        delay: d + m,
        keyframes: this.keyframesFor(P, A, p, y, r.ease)
      };
      this.timeline.addTrack(L), b.push(E);
    }
    if (h !== void 0)
      for (const [M, P] of Object.entries(h)) {
        const A = this.resolveStart(u[0], M);
        if (typeof A != "number") {
          this.warn(`inertia on "${M}" needs a numeric start value; skipped`);
          continue;
        }
        const E = vn(A, P), L = this.nextTrackId(`${u[0]}-${M}-inertia`), X = {
          id: L,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: M,
          kind: "inertia",
          inertia: E,
          delay: d + m
        };
        this.timeline.addTrack(X), b.push(L), x = Math.max(x, yt(E));
        for (const q of u) this.lastValues.set(`${q}|${M}`, gt(E));
      }
    const F = ((h !== void 0 || w !== void 0) && !v && !T && a === void 0 ? x : Math.max(p, x)) + (g && u.length > 1 ? It(u.length, g) : 0), k = d + m + F;
    return this.previousStart = d + m, this.previousEnd = k, this.cursor = Math.max(this.cursor, k), {
      trackIds: b,
      start: d + m,
      end: k,
      kill: () => {
        for (const M of b) this.timeline.removeTrack(M);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, e, i, n, r) {
    const o = { time: 0, value: t };
    if (i <= 0)
      return [{ time: 0, value: e }];
    const a = typeof r == "string" ? Ct(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Pt(n)) {
      const l = a?.fn ?? j(n);
      return [o, ...ds(o, { time: i, value: e }, l, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [o, { time: i, value: e, ...n && { easing: n } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, e) {
    const i = this.lastValues.get(`${t}|${e}`);
    if (i !== void 0) return i;
    const n = this.options.startValue?.(t, e);
    if (n !== void 0) return n;
    const r = this.options.defaults?.[e];
    if (r !== void 0) return r;
    if (e === "text") return "";
    if (e === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Ms(e);
    return o !== void 0 ? (this.warn(
      `no start value for "${e}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${e}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Ct(t).easing;
      if (typeof t == "function")
        throw new Error(
          'gsap-compat: function eases cannot be serialized. Use a named ease, or a cubic-bezier via { type: "cubic-bezier", points: [...] }.'
        );
      return t;
    }
  }
  targetsOf(t) {
    return Array.isArray(t) ? t : [t];
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
  nextTrackId(t) {
    return this.trackCounter += 1, `${t}-${this.trackCounter}`;
  }
  warn(t) {
    this.options.onWarning?.(`gsap-compat: ${t}`);
  }
}
function zt(s) {
  if (typeof s == "string") return s;
  if (s && typeof s == "object") {
    const t = s;
    return String(t.value ?? t.text ?? "");
  }
  return String(s ?? "");
}
function Sn(s) {
  return new et(s);
}
function ht(s) {
  return yn(dn(s));
}
const Mn = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), kn = "#ffffff", An = "rgba(0, 0, 0, 0.5)";
function Pn(s) {
  const t = [];
  if (s.blur !== void 0 && t.push(`blur(${Math.max(0, s.blur)}px)`), s.brightness !== void 0 && t.push(`brightness(${Math.max(0, s.brightness)})`), s.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, s.glow)}px ${s.glowColor ?? kn})`), s.shadowX !== void 0 || s.shadowY !== void 0 || s.shadowBlur !== void 0) {
    const e = s.shadowX ?? 0, i = s.shadowY ?? 0, n = Math.max(0, s.shadowBlur ?? 0);
    t.push(`drop-shadow(${e}px ${i}px ${n}px ${s.shadowColor ?? An})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function _n(s, t) {
  const e = s.childNodes.length === 1 ? s.firstChild : null;
  if (e && e.nodeType === 3) {
    const i = e;
    i.data !== t && (i.data = t);
    return;
  }
  s.textContent !== t && (s.textContent = t);
}
function En(s) {
  if (!("ownerSVGElement" in s)) return;
  const t = s.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const Le = /* @__PURE__ */ new Set([
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
]), Cn = /* @__PURE__ */ new Set([
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
  // Motion path properties
  "motionPathX",
  "motionPathY",
  "motionPathRotate"
]), Rn = /* @__PURE__ */ new Set(["originX", "originY"]), $n = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), In = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
};
class H {
  targets = /* @__PURE__ */ new Map();
  /**
   * Register an HTML element as an animation target.
   */
  registerTarget(t, e) {
    this.targets.set(t, e);
  }
  /**
   * Unregister a target by its ID.
   */
  unregisterTarget(t) {
    this.targets.delete(t);
  }
  /**
   * Get a registered target element.
   */
  getTarget(t) {
    return this.targets.get(t);
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
  applyState(t) {
    for (const [e, i] of t.values) {
      const n = this.targets.get(e);
      n && this.applyProperties(n, i);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, e) {
    const i = [];
    let n = null, r = null, o = null;
    const a = e.has("motionPathX"), c = e.has("motionPathY"), l = e.has("motionPathRotate");
    for (const [u, d] of e)
      if (!(u === "x" && a) && !(u === "y" && c) && !((u === "rotate" || u === "rotateZ") && l)) {
        if (Cn.has(u)) {
          const m = this.buildTransformPart(u, d);
          m && i.push(m);
        } else if (Rn.has(u))
          typeof d == "number" && ((n ??= {})[u] = d);
        else if ($n.has(u))
          typeof d == "number" && ((r ??= {})[u] = d);
        else if (Mn.has(u))
          (o ??= {})[u] = d;
        else if (u !== "perspective") {
          if (u !== "shine") if (u === "text" && typeof d == "string")
            _n(t, d);
          else if (u === "d" && typeof d == "string") {
            const m = t;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(t, u, d);
        }
      }
    const h = e.get("shine");
    typeof h == "number" && this.applyShine(t, h);
    const f = e.get("perspective");
    if (typeof f == "number" && i.unshift(`perspective(${f}px)`), i.length > 0 && (t.style.transform = i.join(" "), En(t)), n) {
      const u = n.originX ?? 50, d = n.originY ?? 50;
      t.style.transformOrigin = `${u}% ${d}%`;
    }
    if (r) {
      const u = r.clipTop ?? 0, d = r.clipRight ?? 0, m = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${u}% ${d}% ${m}% ${p}%)`;
    }
    if (o) {
      const u = Pn(o);
      u && (t.style.filter = u);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, e) {
    if (typeof e != "number") return null;
    switch (t) {
      case "x":
      case "motionPathX":
        return `translateX(${e}px)`;
      case "y":
      case "motionPathY":
        return `translateY(${e}px)`;
      case "z":
        return `translateZ(${e}px)`;
      case "rotate":
      case "rotateZ":
      case "motionPathRotate":
        return `rotate(${e}deg)`;
      case "rotateX":
        return `rotateX(${e}deg)`;
      case "rotateY":
        return `rotateY(${e}deg)`;
      case "scale":
        return `scale(${e})`;
      case "scaleX":
        return `scaleX(${e})`;
      case "scaleY":
        return `scaleY(${e})`;
      case "scaleZ":
        return `scaleZ(${e})`;
      case "skewX":
        return `skewX(${e}deg)`;
      case "skewY":
        return `skewY(${e}deg)`;
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
  applyShine(t, e) {
    t.dataset.shineBase || (t.dataset.shineBase = t.style.color || "currentColor");
    const i = t.dataset.shineBase, n = -20 + e * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${i}, ${i})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${n}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, e, i) {
    let n;
    e === "fill" && t.dataset.elementType === "text" ? n = "color" : n = In[e] ?? e;
    let r;
    typeof i == "number" ? Le.has(e) || Le.has(n) ? r = `${i}px` : r = String(i) : Array.isArray(i) ? r = i.join(", ") : r = i, t.style[n] = r;
  }
}
const Fn = {
  request: (s) => requestAnimationFrame(s),
  cancel: (s) => cancelAnimationFrame(s)
};
class Ln {
  adapter = new H();
  scheduler;
  rootOption;
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
  utils = nn();
  /** Playing timelines, in activation order. */
  active = /* @__PURE__ */ new Map();
  /** Last applied value per target name and property. */
  applied = /* @__PURE__ */ new Map();
  /** Targets written since the last apply. */
  dirty = /* @__PURE__ */ new Set();
  frameId = null;
  lastTimestamp = null;
  destroyed = !1;
  constructor(t = {}) {
    this.scheduler = t.scheduler ?? Fn, this.rootOption = t.root;
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
  resolveTargets(t) {
    const e = [];
    for (const i of this.targetsOf(t)) {
      const n = this.nameFor(i);
      Ht(i) && this.currentCollector?.touch(i, n), e.push(n);
    }
    return e;
  }
  /** Find one element the way selector targets are found: within the stage's root (or the collecting context's scope). */
  query(t) {
    return this.selectorRoot.querySelector(t);
  }
  // --- contexts -----------------------------------------------------------
  /** The context collecting what is created right now, if any (see live-context.ts). */
  get collector() {
    return this.currentCollector;
  }
  setCollector(t) {
    this.currentCollector = t;
  }
  /** Drop the values applied to a target, so the next animation starts from its natural state. */
  forget(t) {
    this.applied.delete(t), this.dirty.delete(t);
  }
  get selectorRoot() {
    return this.currentCollector?.scope ?? this.root;
  }
  /** The element registered under a target name. */
  elementFor(t) {
    return this.elements.get(t);
  }
  /** The plain object registered under a target name. */
  objectFor(t) {
    return this.objects.get(t);
  }
  /** Last value the stage applied to a target's property, if any. */
  appliedValue(t, e) {
    return this.applied.get(t)?.get(e);
  }
  /**
   * How fast a property is changing right now, in units per second, taken from
   * the most recently played timeline that animates it — so a spring started
   * mid-motion carries the momentum. A finite difference over a few milliseconds
   * of that timeline's own (deterministic) state; undefined when nothing playing
   * animates the property.
   */
  velocityOf(t, e) {
    for (const n of [...this.active.keys()].reverse()) {
      if (n.getTracks({ target: t, property: e }).length === 0) continue;
      const r = n.currentTime;
      if (r < 4) return 0;
      const o = n.getStateAtTime(r).values.get(t)?.get(e), a = n.getStateAtTime(r - 4).values.get(t)?.get(e);
      if (typeof o != "number" || typeof a != "number") return;
      const c = (o - a) / 4;
      return (n.direction === "reverse" ? -c : c) * 1e3;
    }
  }
  /**
   * Run a callback every frame, after animations are applied. The frame loop
   * keeps going while any callback is registered, even with nothing playing.
   */
  ticker = {
    add: (t) => {
      this.destroyed || (this.tickerCallbacks.size === 0 && (this.tickerTime = 0, this.tickerFrame = 0), this.tickerCallbacks.add(t), this.currentCollector?.track({ revert: () => this.ticker.remove(t) }), this.startLoop());
    },
    remove: (t) => {
      this.tickerCallbacks.delete(t), this.running || this.stopLoop();
    }
  };
  // --- playback -----------------------------------------------------------
  /**
   * Add a timeline to the running set and make sure the loop is going. The
   * timeline must already be playing; activating an already active timeline
   * moves it to the end of the order, so it wins merges.
   */
  activate(t, e = {}) {
    this.destroyed || (t.onUpdate = (i) => this.write(i), this.active.delete(t), this.active.set(t, e), this.startLoop());
  }
  /** Remove a timeline from the running set. Its applied values remain. */
  deactivate(t) {
    this.active.delete(t), this.running || this.stopLoop();
  }
  /** Destroy `resource` along with the stage. Returns it. */
  own(t) {
    return this.destroyed ? t.destroy() : this.owned.add(t), t;
  }
  /**
   * Stop everything on this stage and release its elements. Animations that
   * are still running stop where they are; elements keep the styles last
   * applied. A destroyed stage ignores later playback, so a timeline whose
   * autoplay was already queued cannot restart the loop.
   */
  destroy() {
    this.destroyed = !0;
    for (const t of this.owned) t.destroy();
    this.owned.clear();
    for (const t of this.active.keys()) t.stop();
    this.active.clear(), this.stopLoop(), this.adapter.clearTargets(), this.elements.clear(), this.names = /* @__PURE__ */ new WeakMap(), this.objects.clear(), this.objectNames = /* @__PURE__ */ new WeakMap(), this.tickerCallbacks.clear(), this.liveTimelines.clear(), this.applied.clear(), this.dirty.clear();
  }
  /**
   * Write values for one target straight away, without a timeline — for direct
   * manipulation such as dragging, where every pointer move sets a position.
   * The values join the applied state, so later tweens start from them.
   */
  apply(t, e) {
    if (this.destroyed) return;
    const i = new Map(Object.entries(e));
    this.write({ values: /* @__PURE__ */ new Map([[t, i]]), currentTime: 0, playbackState: "idle", direction: "forward", loopIteration: 0 }), this.flush();
  }
  /** Apply a timeline's state at its current time, immediately. */
  render(t) {
    this.destroyed || (this.write(t.getStateAtTime(t.currentTime)), this.flush());
  }
  /**
   * Advance every active timeline by `deltaMs` and apply the merged result.
   * The frame loop calls this; it is public so hosts that own their own loop
   * (or tests) can drive the stage directly.
   */
  tick(t) {
    const e = [...this.active];
    for (const [i] of e)
      i.duration <= 0 ? (this.write(i.getStateAtTime(0)), i.stop()) : i.tick(t);
    this.flush();
    for (const [i, n] of e)
      n.onUpdate?.(), i.playbackState !== "playing" && this.active.get(i) === n && this.active.delete(i);
    this.flush(), this.runTicker(t), this.running || this.stopLoop();
  }
  // --- internals ----------------------------------------------------------
  /** Whether the frame loop has work: something playing, or a ticker callback. */
  get running() {
    return this.active.size > 0 || this.tickerCallbacks.size > 0;
  }
  runTicker(t) {
    if (this.tickerCallbacks.size !== 0) {
      this.tickerTime += t, this.tickerFrame += 1;
      for (const e of [...this.tickerCallbacks])
        e(this.tickerTime / 1e3, t, this.tickerFrame);
    }
  }
  write(t) {
    for (const [e, i] of t.values) {
      let n = this.applied.get(e);
      n || (n = /* @__PURE__ */ new Map(), this.applied.set(e, n));
      for (const [r, o] of i) n.set(r, o);
      this.dirty.add(e);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const e of this.dirty) {
      const i = this.applied.get(e), n = this.objects.get(e);
      if (n)
        for (const [r, o] of i) n[r] = o;
      else
        t.set(e, i);
    }
    this.dirty.clear(), t.size !== 0 && this.adapter.applyState({
      values: t,
      currentTime: 0,
      playbackState: "playing",
      direction: "forward",
      loopIteration: 0
    });
  }
  frame = (t) => {
    this.frameId = null;
    const e = this.lastTimestamp === null ? 0 : t - this.lastTimestamp;
    this.lastTimestamp = t, e > 0 && this.tick(e), this.running && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
  };
  startLoop() {
    this.frameId === null && (this.lastTimestamp = null, this.frameId = this.scheduler.request(this.frame));
  }
  stopLoop() {
    this.frameId !== null && this.scheduler.cancel(this.frameId), this.frameId = null, this.lastTimestamp = null;
  }
  targetsOf(t) {
    if (typeof t == "string")
      return Array.from(this.selectorRoot.querySelectorAll(t));
    if (Ht(t)) return [t];
    if (!Dn(t)) return [t];
    const e = [];
    for (const i of Array.from(t))
      e.push(...this.targetsOf(i));
    return e;
  }
  nameFor(t) {
    return Ht(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const e = this.objectNames.get(t);
    if (e) return e;
    let i;
    do
      this.nameCounter += 1, i = `obj-${this.nameCounter}`;
    while (this.objects.has(i) || this.elements.has(i));
    return this.objectNames.set(t, i), this.objects.set(i, t), i;
  }
  elementName(t) {
    const e = this.names.get(t);
    if (e) return e;
    let i = t.id ? `#${t.id}` : "";
    if (!i || this.elements.has(i))
      do
        this.nameCounter += 1, i = `el-${this.nameCounter}`;
      while (this.elements.has(i));
    return this.names.set(t, i), this.elements.set(i, t), this.adapter.registerTarget(i, t), i;
  }
}
function Ht(s) {
  return typeof s == "object" && s !== null && s.nodeType === 1;
}
function Dn(s) {
  if (Array.isArray(s)) return !0;
  const t = s;
  return typeof t.length == "number" && typeof t.item == "function";
}
function $t(s) {
  const t = s.style;
  if (!t) return s.getBoundingClientRect();
  const e = t.transform;
  t.transform = "none";
  const i = s.getBoundingClientRect();
  return t.transform = e, i;
}
const De = (s) => typeof s == "object" && s !== null && s.nodeType === 1;
function Bn(s) {
  const t = {};
  for (const e of Array.from(s.attributes)) t[e.name] = e.value;
  return t;
}
function On(s) {
  const t = s.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const e = s.getBoundingClientRect();
  return [1, 0, 0, 1, e.left, e.top];
}
function Nn(s, t) {
  const e = typeof s == "string" || Array.isArray(s) || De(s) ? { path: s } : s, { align: i, alignOrigin: n, path: r, ...o } = e, a = (T) => {
    const S = De(T) ? T : t.query(T);
    return S || t.warn(`gsap-compat: motionPath could not find "${String(T)}"`), S;
  };
  let c = null, l = "";
  if (Array.isArray(r) || typeof r == "string" && bt(r))
    l = r;
  else {
    c = a(r);
    const T = c && ue({ tag: c.localName, attributes: Bn(c) });
    c && !T && t.warn(`gsap-compat: motionPath element <${c.localName}> has no path geometry`), l = T ?? "";
  }
  const h = { ...o, path: l };
  if (i === void 0 || i === !1) return h;
  const f = i === !0 ? c : a(i);
  if (!f)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = t.targets[0];
  if (!u) return h;
  const [d, m, p, g, y, b] = On(f), w = $t(u), [x, v] = n ?? [0.5, 0.5];
  for (const T of t.targets.slice(1)) {
    const S = $t(T);
    if (Math.abs(S.left - w.left) > 0.5 || Math.abs(S.top - w.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, m, p, g, y - w.left - x * w.width, b - w.top - v * w.height], h;
}
const As = (s) => typeof s == "object" && s !== null && s.nodeType === 1;
function Ps(s) {
  const t = {};
  for (const e of Array.from(s.attributes)) t[e.name] = e.value;
  return t;
}
function _s(s) {
  if (!s) return null;
  const t = ue({ tag: s.localName, attributes: Ps(s) });
  return t || (s.querySelector("path")?.getAttribute("d") ?? null);
}
function Xn(s, t, e) {
  const i = ks(s);
  if (typeof i == "string" && bt(i)) return i;
  const n = As(i) ? i : typeof i == "string" ? t(i) : null, r = _s(n);
  return r || (e(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const qn = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Yn(s, t = document) {
  return (typeof s == "string" ? Array.from(t.querySelectorAll(s)) : As(s) ? [s] : Array.from(s)).map((i) => {
    if (i.localName === "path") return i;
    const n = ue({ tag: i.localName, attributes: Ps(i) });
    if (!n || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(i.attributes))
      qn.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", n), i.parentNode.replaceChild(r, i), r;
  });
}
const Be = 0.3;
class Vn {
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
  constructor(t) {
    this.options = t, this.target = t.target;
  }
  start() {
    if (this.running) return;
    this.running = !0;
    const t = this.options.type ?? ["pointer", "touch"];
    t.includes("pointer") && (this.target.addEventListener("pointerdown", this.onPointerDown), this.target.addEventListener("pointermove", this.onPointerMove), this.target.addEventListener("pointerup", this.onPointerUp), this.target.addEventListener("pointercancel", this.onPointerUp)), t.includes("touch") && (this.target.addEventListener("touchstart", this.onTouchStart, { passive: !1 }), this.target.addEventListener("touchmove", this.onTouchMove, { passive: !1 }), this.target.addEventListener("touchend", this.onTouchEnd)), t.includes("wheel") && this.target.addEventListener("wheel", this.onWheel, { passive: !1 });
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
  begin(t, e, i) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = e, this.lastX = t, this.lastY = e, this.velocityX = 0, this.velocityY = 0, this.lastTime = Oe(), this.options.onPress?.(this.stateFrom(0, 0, i));
  }
  move(t, e, i) {
    if (!this.dragging) return;
    const n = t - this.lastX, r = e - this.lastY;
    this.lastX = t, this.lastY = e;
    const o = t - this.startX, a = e - this.startY, c = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < c) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(n, r), this.options.preventDefault !== !1 && i.cancelable && i.preventDefault(), this.options.onMove?.(this.stateFrom(n, r, i));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, e) {
    const i = Oe(), n = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / n * 1e3, o = e / n * 1e3;
    this.velocityX += (r - this.velocityX) * Be, this.velocityY += (o - this.velocityY) * Be;
  }
  stateFrom(t, e, i) {
    return {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: this.lastX - this.startX,
      totalY: this.lastY - this.startY,
      isDragging: this.dragging,
      event: i
    };
  }
  // --- listeners ----------------------------------------------------------
  onPointerDown = (t) => {
    const e = t, i = this.target;
    if (typeof e.pointerId == "number" && typeof i.setPointerCapture == "function")
      try {
        i.setPointerCapture(e.pointerId);
      } catch {
      }
    this.begin(e.clientX, e.clientY, t);
  };
  onPointerMove = (t) => {
    const e = t;
    this.move(e.clientX, e.clientY, t);
  };
  onPointerUp = (t) => this.end(t);
  onTouchStart = (t) => {
    const e = t.touches[0];
    e && this.begin(e.clientX, e.clientY, t);
  };
  onTouchMove = (t) => {
    const e = t.touches[0];
    e && this.move(e.clientX, e.clientY, t);
  };
  onTouchEnd = (t) => this.end(t);
  onWheel = (t) => {
    const e = t;
    this.options.preventDefault !== !1 && e.cancelable && e.preventDefault(), this.updateVelocity(e.deltaX, e.deltaY), this.options.onMove?.({
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: 0,
      totalY: 0,
      isDragging: !1,
      event: t
    });
  };
}
function Oe() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function jn(s, t, e) {
  let i = { delta: 0, line: null }, n = e;
  for (const r of s)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= n && (n = a, i = { delta: o - r, line: o });
    }
  return i;
}
function Un(s, t) {
  return t <= 0 ? [] : s.map((e) => Math.round(e / t) * t);
}
class Es {
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
  constructor(t) {
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Vn({
      target: t.target,
      onPress: (e) => {
        const i = t.getPosition?.();
        i && (this.x = i.x, this.y = i.y), this.originX = this.x, this.originY = this.y, t.onPress?.(e);
      },
      onMove: (e) => this.handleMove(e),
      onRelease: (e) => t.onRelease?.(e)
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
  setPosition(t, e) {
    const i = this.options.axis ?? "both";
    this.x = i === "y" ? this.x : this.applyConstraints(t, "x"), this.y = i === "x" ? this.y : this.applyConstraints(e, "y");
  }
  /** The snap lines that caught on the last move, for drawing guides. */
  get snapLines() {
    return { x: this.snappedX, y: this.snappedY };
  }
  /** See `snapThreshold` in the options. */
  snapThreshold() {
    if (this.options.snapThreshold !== void 0) return this.options.snapThreshold;
    const t = this.options.snap ?? 0;
    return t > 0 ? t / 2 : 8;
  }
  handleMove(t) {
    this.setPosition(this.originX + t.totalX, this.originY + t.totalY), this.options.mode === "scrub" && this.scrub(), this.options.onDrag?.(this.position, t), this.options.onSnap?.(this.snapLines);
  }
  /** Map the dragged distance onto the timeline's playhead. */
  scrub() {
    const t = this.options.timeline;
    if (!t) return;
    const e = t.duration;
    if (e <= 0) return;
    const i = this.options.scrubDistance ?? 500;
    if (i === 0) return;
    const n = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Wn(n / i);
    t.pause(), t.seek(r * e);
  }
  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  applyConstraints(t, e) {
    let i = t;
    const n = [
      ...Un([i], this.options.snap ?? 0),
      ...(e === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = jn([i], n, this.snapThreshold());
    i += r.delta, e === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = e === "x" ? o.minX : o.minY, c = e === "x" ? o.maxX : o.maxY;
      a !== void 0 && (i = Math.max(a, i)), c !== void 0 && (i = Math.min(c, i));
    }
    return i;
  }
}
function Wn(s) {
  return s < 0 ? 0 : s > 1 ? 1 : s;
}
function uo(s) {
  const t = new Es(s);
  return t.start(), t;
}
const zn = { x: "x", y: "y", "x,y": "both" }, oe = (s) => typeof s == "object" && s !== null && s.nodeType === 1;
function Ne(s, t) {
  const e = $t(s), i = t.getBoundingClientRect();
  return {
    minX: i.left - e.left,
    maxX: i.right - e.right,
    minY: i.top - e.top,
    maxY: i.bottom - e.bottom
  };
}
function Xe(s) {
  return Array.isArray(s) ? [...s] : s;
}
function Hn(s, t, e, i = {}) {
  const [n] = t.resolveTargets(e), r = n ? t.elementFor(n) : void 0;
  if (!n || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(e)}`);
  if (i.type === "rotation") return Gn(s, t, n, r, i);
  const o = zn[i.type ?? "x,y"], a = () => {
    const p = t.appliedValue(n, "x"), g = t.appliedValue(n, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof g == "number" ? g : 0 };
  }, c = typeof i.bounds == "string" ? t.query(i.bounds) : oe(i.bounds) ? i.bounds : null, h = { bounds: (!c && i.bounds && !oe(i.bounds) ? i.bounds : void 0) ?? (c ? Ne(r, c) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const g = i.inertia === !0 ? {} : i.inertia, y = g.friction ?? (g.resistance !== void 0 ? pe(g.resistance) : 4), b = a(), w = h.bounds ?? {};
    let x, v;
    const T = g.end;
    if (Array.isArray(T)) {
      const _ = _t({ from: b.x, velocity: o === "y" ? 0 : p.x, friction: y }), F = _t({ from: b.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let k = T[0];
      for (const M of T)
        Math.hypot(M.x - _, M.y - F) < Math.hypot(k.x - _, k.y - F) && (k = M);
      k && (x = [k.x], v = [k.y]);
    } else typeof T == "number" ? (x = T, v = T) : T && (x = Xe(T.x), v = Xe(T.y));
    const S = {};
    o !== "y" && (S.x = { velocity: p.x, friction: y, min: w.minX, max: w.maxX, end: x }), o !== "x" && (S.y = { velocity: p.y, friction: y, min: w.minY, max: w.maxY, end: v }), f = s.to(r, { inertia: S, onComplete: () => i.onThrowComplete?.() });
  }, m = new Es({
    target: r,
    axis: o,
    snap: i.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), c && (h.bounds = Ne(r, c)), i.onPress?.();
    },
    onDrag: (p) => {
      t.apply(n, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), i.onDrag?.(p);
    },
    onRelease: () => {
      const p = m.velocity;
      i.onRelease?.(p), i.inertia && d(p);
    }
  });
  return m.start(), {
    draggable: m,
    get position() {
      return a();
    },
    get rotation() {
      const p = t.appliedValue(n, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      u(), m.destroy();
    }
  };
}
function Gn(s, t, e, i, n) {
  const r = typeof n.bounds == "object" && n.bounds !== null && !oe(n.bounds) ? n.bounds : {}, o = () => {
    const w = t.appliedValue(e, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, w));
  let c = null, l = !1, h, f = { x: 0, y: 0 }, u = 0, d = 0, m = [];
  const p = (w) => Math.atan2(w.clientY - f.y, w.clientX - f.x) * 180 / Math.PI, g = (w) => {
    if (l) return;
    c?.kill(), c = null, l = !0, h = w.pointerId, i.setPointerCapture?.(w.pointerId);
    const x = i.getBoundingClientRect();
    f = { x: x.left + x.width / 2, y: x.top + x.height / 2 }, u = p(w), d = o(), m = [{ time: performance.now(), rotation: d }], n.onPress?.();
  }, y = (w) => {
    if (!l || w.pointerId !== h) return;
    const x = p(w);
    let v = x - u;
    v > 180 && (v -= 360), v < -180 && (v += 360), u = x, d += v;
    let T = a(d);
    n.snap && (T = a(Math.round(T / n.snap) * n.snap)), t.apply(e, { rotate: T });
    const S = performance.now();
    for (m.push({ time: S, rotation: T }); m.length > 2 && S - m[0].time > 100; ) m.shift();
    const _ = { x: 0, y: 0 };
    n.onDrag?.(_);
  }, b = (w) => {
    if (!l || w.pointerId !== h) return;
    l = !1;
    const x = m[0], v = m[m.length - 1], T = x && v ? (v.time - x.time) / 1e3 : 0, S = T > 0 ? (v.rotation - x.rotation) / T : 0;
    if (n.onRelease?.({ x: S, y: 0 }), !n.inertia) return;
    const _ = n.inertia === !0 ? {} : n.inertia, F = _.friction ?? (_.resistance !== void 0 ? pe(_.resistance) : 4), k = typeof _.end == "number" || Array.isArray(_.end) ? _.end : void 0;
    c = s.to(i, {
      inertia: {
        rotate: {
          velocity: S,
          friction: F,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(k) ? k.filter((M) => typeof M == "number") : k
        }
      },
      onComplete: () => n.onThrowComplete?.()
    });
  };
  return i.addEventListener("pointerdown", g), i.addEventListener("pointermove", y), i.addEventListener("pointerup", b), i.addEventListener("pointercancel", b), i.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      c?.kill(), i.removeEventListener("pointerdown", g), i.removeEventListener("pointermove", y), i.removeEventListener("pointerup", b), i.removeEventListener("pointercancel", b);
    }
  };
}
const Zn = { opacity: 0, scale: 0.6 };
function Kn(s) {
  const t = s.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function qe(s) {
  const t = $t(s);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function ae(s, t) {
  const i = s.resolveTargets(t).map((o) => s.elementFor(o)).filter((o) => !!o), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of i) {
    const a = Kn(o);
    n.set(o, a);
    const c = Cs(o);
    a && c !== void 0 && !r.has(c) && r.set(c, { element: o, box: a });
  }
  return { elements: i, boxes: n, ids: r };
}
const Gt = /* @__PURE__ */ new WeakMap();
function ce(s, t, e, i = {}) {
  const n = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", o = i.stagger ?? 0, a = i.scale !== !1, c = i.enter === void 0 ? Zn : i.enter, l = new Set(e.elements);
  if (i.targets !== void 0)
    for (const d of s.resolveTargets(i.targets)) {
      const m = s.elementFor(d);
      m && l.add(m);
    }
  const h = [...l].sort(
    (d, m) => d === m ? 0 : d.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: i.onComplete });
  let u = 0;
  for (const d of h) {
    const m = qe(d);
    if (!m) continue;
    let p = e.boxes.get(d) ?? null, g;
    const y = Cs(d), b = !p && y !== void 0 ? e.ids.get(y) : void 0;
    b && b.element !== d && (p = b.box, g = b.element);
    const [w] = s.resolveTargets(d);
    Gt.get(d)?.timeline.removeTracks({ target: w });
    const x = u * o;
    if (!p) {
      if (c === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...c }, { ...Rs(c), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: n, ease: r, delay: x }, 0), Gt.set(d, f), u++;
      continue;
    }
    const v = p.cx - m.cx, T = p.cy - m.cy, S = a ? p.width / m.width : 1, _ = a ? p.height / m.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(T) > 0.5 || Math.abs(S - 1) > 1e-3 || Math.abs(_ - 1) > 1e-3)) {
      const M = (P, A) => {
        const E = s.appliedValue(w, P);
        return typeof E == "number" && Math.abs(E - A) > 1e-6;
      };
      (M("x", 0) || M("y", 0) || M("scaleX", 1) || M("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const k = i.fade === !0 && g !== void 0;
    f.fromTo(
      d,
      { x: v, y: T, scaleX: S, scaleY: _, ...k && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...k && { opacity: 1 }, duration: n, ease: r, delay: x },
      0
    ), k && g && qe(g) && f.fromTo(g, { opacity: 1 }, { opacity: 0, duration: n, ease: r, delay: x }, 0), Gt.set(d, f), u++;
  }
  return f;
}
function Cs(s) {
  return s.dataset?.flipId;
}
function Rs(s) {
  const t = {};
  for (const e of Object.keys(s))
    t[e] = e === "opacity" || e.startsWith("scale") ? 1 : 0;
  return t;
}
function Qn(s, t = {}) {
  const e = new Set((t.type ?? "chars,words,lines").split(",").map((p) => p.trim())), i = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, n = t.aria !== !1, r = s.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, a, c, l = !1;
  const h = () => {
    for (const { element: p, html: g, ariaLabel: y } of r)
      p.innerHTML = g, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, f = () => {
    a && (a.revert ? a.revert() : a.kill?.(), a = void 0);
  }, u = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: g } of r) {
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), b = Jn(g, i.words), w = e.has("chars") ? b.flatMap((T) => tr(T, i.chars)) : [], x = e.has("lines") ? sr(g, b, i.lines) : [];
      if (n) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const T of b) T.setAttribute("aria-hidden", "true");
      }
      if (e.has("words")) p.words.push(...b);
      else for (const T of b) T.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...x);
      const v = t.mask === "lines" ? x : t.mask === "words" ? b : t.mask === "chars" ? w : [];
      for (const T of v) p.masks.push(ir(T, `${i[t.mask]}-mask`));
    }
    o = p;
  }, d = {
    elements: s,
    get chars() {
      return o.chars;
    },
    get words() {
      return o.words;
    },
    get lines() {
      return o.lines;
    },
    get masks() {
      return o.masks;
    },
    split() {
      l || (f(), h(), u(), a = t.onSplit?.(d));
    },
    revert() {
      l = !0, c?.disconnect(), f(), h();
    }
  };
  u(), a = t.onSplit?.(d), t.autoSplit && m();
  function m() {
    const p = /* @__PURE__ */ new Map();
    let g = !1;
    const y = () => {
      if (g) return;
      g = !0;
      const w = () => {
        g = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      c = new ResizeObserver((w) => {
        let x = !1;
        for (const v of w) {
          const T = Math.round(v.contentRect.width), S = p.get(v.target);
          p.set(v.target, T), S !== void 0 && S !== T && (x = !0);
        }
        x && y();
      });
      for (const w of s) c.observe(w);
    }
    const b = s[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return d;
}
function Jn(s, t) {
  const e = s.ownerDocument, i = [], n = e.createTreeWalker(
    s,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = n.nextNode(); o; o = n.nextNode()) r.push(o);
  for (const o of r) {
    const a = o.data.match(/\s+|\S+/g) ?? [];
    if (a.length === 0) continue;
    const c = e.createDocumentFragment();
    for (const l of a) {
      if (/^\s/.test(l)) {
        c.appendChild(e.createTextNode(l));
        continue;
      }
      const h = e.createElement("span");
      h.className = t, h.style.display = "inline-block", h.textContent = l, c.appendChild(h), i.push(h);
    }
    o.replaceWith(c);
  }
  return i;
}
function tr(s, t) {
  const e = s.ownerDocument, i = er(s.textContent ?? "").map((n) => {
    const r = e.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = n, r;
  });
  return s.replaceChildren(...i), i;
}
function er(s) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(s), (e) => e.segment) : Array.from(s);
}
function sr(s, t, e) {
  const i = s.ownerDocument, n = new Map(t.map((m) => [m, m.getBoundingClientRect()])), r = [], o = (m) => {
    for (const p of Array.from(m.childNodes))
      p.nodeType === 3 || n.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(s);
  const a = [];
  let c = null, l = 0, h = 0, f = !1, u = [];
  const d = () => {
    c = i.createElement("span"), c.className = e, c.style.display = "block", a.push(c), u = [];
  };
  for (const m of r) {
    if (m.tagName === "BR") {
      f = !0;
      continue;
    }
    const p = n.get(m);
    if (p && (!c || f || p.top > l + h) && (d(), l = p.top, h = p.height / 2, f = !1), !c) continue;
    const g = [];
    for (let w = m.parentNode; w && w !== s; w = w.parentNode) g.unshift(w);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let b = y === 0 ? c : u[y - 1].clone;
    for (const w of g.slice(y)) {
      const x = w.cloneNode(!1);
      b.appendChild(x), u.push({ original: w, clone: x }), b = x;
    }
    b.appendChild(m);
  }
  return s.replaceChildren(...a), a;
}
function ir(s, t) {
  const e = s.ownerDocument.createElement("span");
  return e.className = t, e.style.display = s.style.display === "block" ? "block" : "inline-block", e.style.overflow = "clip", e.style.paddingBottom = "0.12em", e.style.marginBottom = "-0.12em", s.replaceWith(e), e.appendChild(s), e;
}
const Ye = {
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
function Ve(s) {
  const t = s.trim().toLowerCase();
  if (t in Ye) return Ye[t];
  if (t.endsWith("%")) {
    const e = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(e) ? void 0 : e / 100;
  }
}
function $s(s) {
  if (typeof s == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: s };
  let t = 0;
  const i = s.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, c) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(c), "")).trim().split(/\s+/).filter(Boolean);
  if (i.length === 1 && /^-?[\d.]+$/.test(i[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(i[0]) + t
    };
  const n = i[0] !== void 0 ? Ve(i[0]) : void 0, r = i[1] !== void 0 ? Ve(i[1]) : void 0;
  return {
    elementFraction: n ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function mt(s, t, e) {
  const i = $s(e), n = i.absolutePx !== void 0 ? s.top + i.absolutePx : s.top + s.height * i.elementFraction, r = t * i.viewportFraction;
  return n - r + i.offsetPx;
}
function fo(s, t, e, i) {
  const n = mt(s, t, e), o = mt(s, t, i) - n;
  return o <= 0 ? n <= 0 ? 1 : 0 : Is(-n / o);
}
function Is(s) {
  return s < 0 ? 0 : s > 1 ? 1 : s === 0 ? 0 : s;
}
function nr(s, t, e, i) {
  if (e <= 0) return t;
  const n = 1 - Math.exp(-(i / 1e3) / e);
  return s + (t - s) * n;
}
function je(s, t, e, i, n) {
  const r = (h) => mt({ top: s + n(h), bottom: s + n(h) + t, height: t }, e, i), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let c = 0, l = 1;
  for (let h = 0; h < 40; h++) {
    const f = (c + l) / 2;
    Math.sign(r(f)) === Math.sign(o) ? c = f : l = f;
  }
  return (c + l) / 2;
}
class rr {
  timeline;
  trigger;
  behaviour;
  options;
  observer = null;
  hasPlayed = !1;
  running = !1;
  constructor(t) {
    this.timeline = t.timeline, this.trigger = t.trigger, this.behaviour = t.behaviour ?? "once", this.options = t;
  }
  start() {
    if (!this.running) {
      if (this.running = !0, typeof IntersectionObserver > "u") {
        this.enter();
        return;
      }
      this.observer = new IntersectionObserver(
        (t) => {
          for (const e of t)
            e.isIntersecting ? this.enter() : this.leave();
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
function po(s) {
  const t = new rr(s);
  return t.start(), t;
}
class or {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(t, e = {}) {
    this.element = t, this.axis = e.axis ?? "y", this.spacing = e.spacing ?? !0;
    const i = t.ownerDocument;
    this.spacer = i.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: t.style.position, top: t.style.top, left: t.style.left }, this.axis === "x" && (this.spacer.style.flexShrink = "0"), t.replaceWith(this.spacer), this.spacer.appendChild(t);
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
  apply(t, e) {
    const i = Math.max(0, e);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + i}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${i}px`, this.element.style.left = `${t}px`) : (this.spacer.style.height = `${this.element.offsetHeight + i}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${i}px`, this.element.style.top = `${t}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const ar = 0.15;
function cr(s) {
  return typeof s == "object" && !Array.isArray(s) ? s : { snapTo: s };
}
function lr(s, t, e) {
  const i = Mt(s + t * ar);
  if (typeof e == "function") return Mt(e(i));
  if (typeof e == "number")
    return e <= 0 ? s : Mt(Math.round(i / e) * e);
  if (e.length === 0) return s;
  let n = e[0];
  for (const r of e)
    Math.abs(r - i) < Math.abs(n - i) && (n = r);
  return Mt(n);
}
function hr(s, t, e) {
  const i = s.duration ?? { min: 0.2, max: 0.8 };
  if (typeof i == "number") return i;
  const n = Math.min(1, Math.abs(t) / Math.max(1, e));
  return i.min + (i.max - i.min) * n;
}
class ur {
  rafId = null;
  cancelEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  onInterrupt = () => this.cancel();
  write;
  eventTarget;
  constructor(t, e) {
    this.write = t, this.eventTarget = e;
  }
  get active() {
    return this.rafId !== null;
  }
  animate(t, e, i, n = Dt, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || i <= 0) {
      this.write(e), r?.();
      return;
    }
    for (const c of this.cancelEvents) this.eventTarget?.addEventListener(c, this.onInterrupt, { passive: !0 });
    let o = null;
    const a = (c) => {
      o ??= c;
      const l = Math.min(1, (c - o) / (i * 1e3));
      this.write(t + (e - t) * n(l)), l < 1 ? this.rafId = requestAnimationFrame(a) : (this.rafId = null, this.detach(), r?.());
    };
    this.rafId = requestAnimationFrame(a);
  }
  cancel() {
    this.rafId !== null && typeof cancelAnimationFrame < "u" && cancelAnimationFrame(this.rafId), this.rafId = null, this.detach();
  }
  detach() {
    for (const t of this.cancelEvents) this.eventTarget?.removeEventListener(t, this.onInterrupt);
  }
}
function Mt(s) {
  return Math.max(0, Math.min(1, s));
}
class fr {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, e, i) {
    this.options = i === !0 ? {} : i, this.scroller = e;
    const { startColor: n = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, a = o ? `${o} ` : "", c = (l, h, f) => {
      const u = t.createElement("div");
      return u.textContent = `${a}${l}`, u.setAttribute("aria-hidden", "true"), u.className = "scroll-marker", Object.assign(u.style, {
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
      }), (e ?? t.body).appendChild(u), this.nodes.push(u), u;
    };
    this.scrollerStart = c("scroller-start", n, !e), this.scrollerEnd = c("scroller-end", r, !e), this.start = c("start", n, !1), this.end = c("end", r, !1), e && getComputedStyle(e).position === "static" && (e.style.position = "relative");
  }
  /** Place the markers for the latest measurement. */
  place(t, e) {
    this.start.style.top = `${t.startPage}px`, this.end.style.top = `${t.endPage}px`;
    const i = this.scroller ? e : 0;
    this.scrollerStart.style.top = `${i + t.startViewport}px`, this.scrollerEnd.style.top = `${i + t.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(t, e) {
    this.scroller && this.place(t, e);
  }
  destroy() {
    for (const t of this.nodes.splice(0)) t.remove();
  }
}
const dr = 120, J = [], nt = /* @__PURE__ */ new Set();
let Zt = !1;
const pr = () => {
  Zt || nt.size === 0 || (Zt = !0, queueMicrotask(() => {
    Zt = !1;
    for (const s of nt) s.afterRefresh();
  }));
}, Fs = () => {
  for (const s of nt) s.beforeRefresh();
  for (const s of J) s.refresh();
  for (const s of nt) s.afterRefresh();
};
let tt = { width: 0, height: 0 };
const Ue = () => {
  const s = window.innerWidth, t = window.innerHeight, e = s === tt.width && t !== tt.height, i = Math.abs(t - tt.height) < tt.height * 0.25, n = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  e && i && n || (tt = { width: s, height: t }, Fs());
};
class Bt {
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
  constructor(t) {
    this.timeline = t.timeline, this.options = t, this.snapper = new ur((e) => this.scrollTo(e), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new or(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new fr(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), J.length === 0 && typeof window < "u" && (tt = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Ue, { passive: !0 })), J.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), J.splice(J.indexOf(this), 1), J.length === 0 && typeof window < "u" && window.removeEventListener("resize", Ue), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Fs();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return nt.add(t), () => nt.delete(t);
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
    const t = this.scrollPosition();
    this.pin?.release();
    const e = this.triggerRect();
    if (e && this.options.container)
      this.measureInContainer(this.options.container);
    else if (e) {
      const i = this.viewportHeight();
      if (this.startPx = t + mt(e, i, ut(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(e, i, t), this.pin) {
        const n = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(n.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(i) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, pr();
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
  update(t) {
    this.running && this.updateFrom(t ?? this.scrollPosition(), !1);
  }
  // --- internals ----------------------------------------------------------
  updateFrom(t, e) {
    this.trackVelocity(t), this.markers && this.markerGeometry && this.markers.follow(this.markerGeometry, t);
    const i = this.endPx - this.startPx, n = this.zone;
    this.targetProgress = i > 0 ? Is((t - this.startPx) / i) : t >= this.startPx ? 1 : 0, this.zone = i > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(n, this.zone), e || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, e, i) {
    const n = ut(this.options.end) ?? "bottom top", r = typeof n == "string" ? n.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? e * o / 100 : o);
    }
    return i + mt(t, e, n);
  }
  applyProgress() {
    const t = this.timeline?.duration ?? 0;
    this.timeline && t > 0 && this.timeline.seek(this.displayProgress * t), this.emitUpdate();
  }
  emitUpdate() {
    if (!this.options.onUpdate) return;
    const t = [this.displayProgress, this.velocityPxPerSecond];
    this.lastEmitted && this.lastEmitted[0] === t[0] && this.lastEmitted[1] === t[1] || (this.lastEmitted = t, this.options.onUpdate(t[0], t[1]));
  }
  trackVelocity(t) {
    const e = typeof performance < "u" ? performance.now() : Date.now();
    this.lastScroll !== null && e > this.lastScrollTime && t !== this.lastScroll && (this.velocityPxPerSecond = (t - this.lastScroll) / (e - this.lastScrollTime) * 1e3), (this.lastScroll === null || t !== this.lastScroll) && (this.lastScroll = t, this.lastScrollTime = e), !(this.velocityPxPerSecond === 0 || typeof setTimeout > "u") && (this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = setTimeout(() => {
      this.idleTimer = null, this.releaseVelocity = this.velocityPxPerSecond, this.velocityPxPerSecond = 0, this.emitUpdate(), this.scheduleSnap();
    }, dr));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, e) {
    if (t === e) return;
    const { onEnter: i, onLeave: n, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (i?.(), e === "after" && n?.()) : t === "after" ? (r?.(), e === "before" && o?.()) : e === "after" ? n?.() : o?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const t = this.options.snap;
    if (t === void 0 || this.snapper.active) return;
    const e = cr(t), i = () => {
      this.snapTimer = null;
      const n = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || n <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / n, a = this.startPx + lr(o, this.releaseVelocity / n, e.snapTo) * n;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, hr(e, a - r, this.viewportHeight()), e.ease);
    };
    e.delay ? this.snapTimer = setTimeout(i, e.delay * 1e3) : i();
  }
  scrollTo(t) {
    const e = this.options.scroller, i = this.options.horizontal ? { left: t } : { top: t };
    e ? typeof e.scrollTo == "function" ? e.scrollTo({ ...i, behavior: "instant" }) : this.options.horizontal ? e.scrollLeft = t : e.scrollTop = t : typeof window < "u" && window.scrollTo({ ...i, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const e = this.options.trigger;
    if (typeof e?.getBoundingClientRect != "function") return;
    const i = e.getBoundingClientRect(), n = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = i.left - n - t.shiftAt(t.progress()), { start: a, end: c } = t.range(), l = (d) => a + d * (c - a), h = je(o, i.width, r, ut(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = l(h);
    const f = ut(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : l(je(o, i.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const e = (r, o) => {
      const a = ut(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const c = $s(a);
      return t * c.viewportFraction - c.offsetPx;
    }, i = e(this.options.start, "top bottom") ?? 0, n = e(this.options.end, "bottom top") ?? i;
    return {
      startViewport: i,
      endViewport: n,
      startPage: this.startPx + i,
      endPage: this.endPx + n
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (e) => {
      if (this.rafId = null, !this.running) return;
      const i = this.lastFrameTime === null ? 16.67 : e - this.lastFrameTime;
      this.lastFrameTime = e, this.displayProgress = nr(this.displayProgress, this.targetProgress, this.smoothing(), i);
      const n = Math.abs(this.targetProgress - this.displayProgress) < 1e-4;
      n && (this.displayProgress = this.targetProgress), this.applyProgress(), n ? this.lastFrameTime = null : this.rafId = requestAnimationFrame(t);
    };
    this.rafId = requestAnimationFrame(t);
  }
  stopSmoothing() {
    this.rafId !== null && typeof cancelAnimationFrame < "u" && cancelAnimationFrame(this.rafId), this.rafId = null, this.lastFrameTime = null;
  }
  scrollTarget() {
    return this.options.scroller ?? (typeof window < "u" ? window : null);
  }
  scrollPosition() {
    const t = this.options.scroller, e = this.options.horizontal;
    return t ? (e ? t.scrollLeft : t.scrollTop) ?? 0 : typeof window < "u" ? (e ? window.scrollX : window.scrollY) ?? 0 : 0;
  }
  triggerRect() {
    const t = this.options.trigger;
    return typeof t?.getBoundingClientRect != "function" ? null : this.relativeRect(t.getBoundingClientRect());
  }
  /**
   * A viewport rect along the scroll axis, relative to the scroll container when
   * there is one. Horizontal scrolling reports left / right / width as top / bottom / height.
   */
  relativeRect(t) {
    const e = this.options.horizontal, i = e ? t.left ?? 0 : t.top, n = e ? t.right ?? 0 : t.bottom, r = e ? t.width ?? 0 : t.height, o = this.options.scroller;
    if (o && typeof o.getBoundingClientRect == "function") {
      const a = o.getBoundingClientRect(), c = e ? a.left : a.top;
      return { top: i - c, bottom: n - c, height: r };
    }
    return { top: i, bottom: n, height: r };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const t = this.options.scroller, e = this.options.horizontal;
    return t ? e ? t.clientWidth : t.clientHeight : typeof window < "u" ? e ? window.innerWidth : window.innerHeight : 0;
  }
}
function ut(s) {
  return typeof s == "function" ? s() : s;
}
function mo(s) {
  const t = new Bt(s);
  return t.start(), t;
}
const Kt = /* @__PURE__ */ new Set(), mr = 16, We = 0.5, gr = 2;
class ze {
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
  onWheel = (t) => this.wheel(t);
  onScroll = () => this.nativeScroll();
  onResize = () => this.refresh();
  onLoad = () => this.refresh();
  /** Scroll triggers measure with effect layers at rest, and effects measure after pins. */
  stopListening = null;
  constructor(t = {}) {
    this.options = t, this.frames = t.frames ?? {
      request: (e) => requestAnimationFrame(e),
      cancel: (e) => cancelAnimationFrame(e)
    };
  }
  start() {
    if (this.running || typeof window > "u") return this;
    this.running = !0, this.reduced = this.options.reducedMotion ?? (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches), this.current = this.target = this.position();
    const t = this.options.scroller ?? window;
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), Kt.add(this), this.stopListening = Bt.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of Kt) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), Kt.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) Qt(t.element, t.saved);
    this.effects = [];
  }
  /** GSAP's name for `destroy()`. */
  kill() {
    this.destroy();
  }
  get state() {
    const t = this.limit();
    return { scroll: this.current, target: this.target, progress: t > 0 ? this.current / t : 0, velocity: this.velocityPxPerSecond };
  }
  /** Stop responding to the wheel (e.g. while a modal is open); `paused(false)` resumes. */
  paused(t) {
    return t !== void 0 && (this.pausedState = t, t && (this.target = this.current, this.journey = null)), this.pausedState;
  }
  /**
   * Scroll to an offset, an element or a selector, eased. Wheel input during the
   * trip takes over from wherever it has got to.
   */
  scrollTo(t, e = {}) {
    if (!this.running) return;
    const i = this.clamp(this.resolve(t) + (e.offset ?? 0)), n = Math.abs(i - this.current), r = this.reduced ? 0 : e.duration ?? Math.min(1.2, Math.max(0.4, n / 2500));
    if (r <= 0) {
      this.journey = null, this.current = this.target = i, this.write(i), this.applyEffects(0);
      return;
    }
    this.target = i, this.journey = { from: this.current, to: i, ms: r * 1e3, ease: e.ease ?? Dt, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const e = this.options.scroller ?? document, i = this.position(), n = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of e.querySelectorAll(t)) {
        const a = Number.parseFloat(o.dataset.speed ?? ""), c = Number.parseFloat(o.dataset.lag ?? ""), l = o.getBoundingClientRect(), h = l.top - r + i;
        this.effects.push({
          element: o,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(c) && c > 0 ? c : void 0,
          centre: h + l.height / 2 - n / 2,
          lagged: i,
          shift: 0,
          saved: o.style.getPropertyValue("translate")
        });
      }
    }
    this.current = this.target = this.clamp(this.position()), this.applyEffects(0);
  }
  /** Put effect elements at their natural place, for measuring. */
  rest() {
    for (const t of this.effects) Qt(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const e = t.deltaMode === 1 ? mr : t.deltaMode === 2 ? this.viewportHeight() : 1, i = t.deltaY * e * (this.options.wheelMultiplier ?? 1), n = this.clamp(this.target + i);
    n === this.target && n === this.current || (t.preventDefault(), this.journey = null, this.target = n, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= gr || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
  }
  nestedScrollerTakes(t) {
    const e = this.options.scroller ?? document.documentElement;
    for (let i = t.target; i && i !== e && i !== document.body; i = i.parentElement) {
      if (i.hasAttribute?.("data-smooth-ignore")) return !0;
      const n = getComputedStyle(i);
      if (!/(auto|scroll)/.test(n.overflowY) || i.scrollHeight <= i.clientHeight) continue;
      if (t.deltaY < 0 ? i.scrollTop > 0 : i.scrollTop + i.clientHeight < i.scrollHeight - 1) return !0;
    }
    return !1;
  }
  // --- frames ---------------------------------------------------------------
  requestFrame() {
    this.frameId !== null || !this.running || (this.frameId = this.frames.request((t) => this.frame(t)));
  }
  cancelFrame() {
    this.frameId !== null && this.frames.cancel(this.frameId), this.frameId = null, this.lastTime = null;
  }
  frame(t) {
    this.frameId = null;
    const e = this.lastTime === null ? 1e3 / 60 : Math.min(100, t - this.lastTime);
    this.lastTime = t;
    const i = this.current;
    if (this.journey) {
      const r = this.journey;
      r.elapsed += e;
      const o = Math.min(1, r.elapsed / r.ms);
      this.current = r.from + (r.to - r.from) * r.ease(o), o >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const r = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-e / r)), Math.abs(this.target - this.current) < We && (this.current = this.target);
    }
    this.current !== i && this.write(this.current), this.velocityPxPerSecond = e > 0 ? (this.current - i) * 1e3 / e : 0;
    const n = this.applyEffects(e);
    this.current !== i && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || n ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(t) {
    let e = !1;
    const i = this.current;
    for (const n of this.effects) {
      let r = 0;
      if (n.speed !== void 0 && (r += (i - n.centre) * (1 - n.speed)), n.lag !== void 0) {
        const o = n.lag * 1e3 / 3;
        n.lagged = t === 0 ? i : n.lagged + (i - n.lagged) * (1 - Math.exp(-t / o)), Math.abs(i - n.lagged) < We ? n.lagged = i : e = !0, r += i - n.lagged;
      }
      Qt(n.element, r === 0 ? n.saved : `0 ${yr(r)}px`), n.shift = r;
    }
    return e;
  }
  // --- geometry -------------------------------------------------------------
  write(t) {
    const e = Math.round(t);
    this.written = e;
    const i = this.options.scroller;
    i ? i.scrollTop = e : window.scrollTo({ top: e, behavior: "instant" });
  }
  position() {
    const t = this.options.scroller;
    return t ? t.scrollTop : window.scrollY;
  }
  viewportHeight() {
    const t = this.options.scroller;
    return t ? t.clientHeight : window.innerHeight;
  }
  limit() {
    const t = this.options.scroller ?? document.documentElement;
    return Math.max(0, t.scrollHeight - this.viewportHeight());
  }
  clamp(t) {
    return Math.max(0, Math.min(this.limit(), t));
  }
  resolve(t) {
    if (typeof t == "number") return t;
    const e = this.options.scroller ?? document, i = typeof t == "string" ? e.querySelector(t) : t;
    if (!i) return this.current;
    const n = this.options.scroller?.getBoundingClientRect().top ?? 0, r = this.effects.find((o) => o.element === i)?.shift ?? 0;
    return i.getBoundingClientRect().top - n + this.position() - r;
  }
}
function Qt(s, t) {
  t ? s.style.setProperty("translate", t) : s.style.removeProperty("translate");
}
function yr(s) {
  return Math.round(s * 100) / 100;
}
function br(s, t) {
  switch (t) {
    // Play forward from wherever it is; reverse() flips a reversed timeline and plays.
    // Neither restarts an animation that is already at that end.
    case "play":
      if (s.progress() >= 1) break;
      s.reversed() ? s.reverse() : s.play();
      break;
    case "reverse":
      if (s.progress() <= 0) break;
      s.reversed() ? s.play() : s.reverse();
      break;
    case "pause":
      s.pause();
      break;
    case "resume":
      s.resume();
      break;
    case "restart":
      s.restart();
      break;
    case "reset":
      s.pause(), s.progress(0);
      break;
    case "complete":
      s.pause(), s.progress(1);
      break;
  }
}
function me(s, t, e, i, n = () => {
}) {
  const r = (d) => typeof d == "string" ? s.query(d) ?? void 0 : d, o = r(t.trigger) ?? i;
  if (!o) {
    n(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, c = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let l = 0, h;
  const f = (d, m) => () => {
    m?.(), e && !a && br(e, c[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => h.destroy());
  }, u = t.containerAnimation ? Tr(s, t.containerAnimation, o, n) : void 0;
  return h = new Bt({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && e?.invalidate ? () => e.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : wr(t.snap, e),
    markers: t.markers,
    container: u,
    onUpdate: (d, m) => {
      if (e && a !== !1 && e.progress(d), t.onUpdate) {
        const p = d < l || m < 0 ? -1 : 1;
        t.onUpdate({ progress: d, velocity: m, direction: p });
      }
      l = d;
    },
    onEnter: f(0, t.onEnter),
    onLeave: f(1, t.onLeave),
    onEnterBack: f(2, t.onEnterBack),
    onLeaveBack: f(3, t.onLeaveBack)
  }), e && a === !1 && e.progress(0), h.start(), s.own(h);
}
function wr(s, t) {
  const e = (n) => n === "labels" ? (r) => vr(r, t?.labelProgresses?.() ?? []) : n;
  if (typeof s != "object" || Array.isArray(s)) return e(s);
  const i = s.ease ? Ct(s.ease) : void 0;
  return {
    snapTo: e(s.snapTo),
    duration: s.duration,
    delay: s.delay,
    ease: i ? i.fn ?? j(i.easing) : void 0
  };
}
function vr(s, t) {
  return t.reduce((e, i) => Math.abs(i - s) < Math.abs(e - s) ? i : e, t[0] ?? s);
}
function Tr(s, t, e, i) {
  const n = () => t.timeline.getTracks({ property: "x" }).map((r) => r.target).filter((r) => {
    const o = s.elementFor(r);
    return !!o && o !== e && o.contains(e);
  });
  return n().length === 0 && i("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const r = t.scrollTrigger;
      return r || i("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: r?.startOffset ?? 0, end: r?.endOffset ?? 0 };
    },
    progress: () => t.progress(),
    shiftAt: (r) => {
      const o = t.timeline.getStateAtTime(r * t.timeline.duration);
      let a = 0;
      for (const c of n()) {
        const l = o.values.get(c)?.get("x");
        typeof l == "number" && (a += l);
      }
      return a;
    }
  };
}
class Ls {
  /** For contexts made by matchMedia: which named queries match */
  conditions = {};
  scope;
  host;
  items = [];
  snapshots = /* @__PURE__ */ new Map();
  constructor(t, e) {
    this.host = t, this.scope = e;
  }
  /**
   * Run `fn` with this context collecting, and return what it returns. A function
   * it returns is kept as cleanup and called on `revert()`.
   */
  add(t) {
    const e = this.host.collector;
    this.host.setCollector(this);
    try {
      const i = t();
      return typeof i == "function" && this.items.push({ revert: i }), i;
    } finally {
      this.host.setCollector(e);
    }
  }
  track(t) {
    this.items.push(t);
  }
  touch(t, e) {
    this.snapshots.has(t) || this.snapshots.set(t, { name: e, style: t.getAttribute("style"), d: t.getAttribute("d") });
  }
  /** Undo everything, newest first, and restore the elements this context animated. */
  revert() {
    for (const t of this.items.splice(0).reverse())
      t.revert ? t.revert() : t.kill ? t.kill() : t.destroy?.();
    for (const [t, { name: e, style: i, d: n }] of this.snapshots)
      i === null ? t.removeAttribute("style") : t.setAttribute("style", i), n !== null && t.setAttribute("d", n), this.host.forget(e);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class xr {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, e) {
    this.host = t, this.scope = e;
  }
  add(t, e) {
    const i = { conditions: t, setup: e, queries: /* @__PURE__ */ new Map() }, n = typeof t == "string" ? { matches: t } : t;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [r, o] of Object.entries(n)) {
        const a = window.matchMedia(o);
        i.queries.set(r, a);
        const c = () => this.scheduleUpdate();
        a.addEventListener("change", c), this.listeners.push(() => a.removeEventListener("change", c));
      }
    return this.entries.push(i), this.update(i), this;
  }
  /** Revert every active setup and stop listening. */
  revert() {
    for (const t of this.listeners.splice(0)) t();
    for (const t of this.entries.splice(0)) t.context?.revert();
  }
  kill() {
    this.revert();
  }
  /** Several queries change on one resize; handle them together. */
  scheduleUpdate() {
    this.scheduled || (this.scheduled = !0, queueMicrotask(() => {
      this.scheduled = !1;
      for (const t of this.entries) this.update(t);
    }));
  }
  update(t) {
    const e = {};
    for (const [o, a] of t.queries) e[o] = a.matches;
    const i = Object.values(e).some(Boolean), n = i ? JSON.stringify(e) : void 0;
    if (n === t.key || (t.context?.revert(), t.context = void 0, t.key = n, !i)) return;
    const r = new Ls(this.host, this.scope);
    r.conditions = e, r.add(() => t.setup(r)), t.context = r;
  }
}
class Sr {
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
  constructor(t, e) {
    this.canvas = t, this.context = t.getContext("2d"), this.options = e, this.frames = Math.max(1, Math.floor(e.frames)), this.images = new Array(this.frames), this.ready = new Array(this.frames).fill(!1), typeof window < "u" && window.addEventListener("resize", this.onResize, { passive: !0 }), this.resize(), this.pump();
  }
  /** The frame on screen (fractional values show the nearest frame) */
  get frame() {
    return this.current;
  }
  set frame(t) {
    this.current = Math.max(0, Math.min(this.frames - 1, t)), this.draw();
  }
  /** How many frames have loaded */
  get loaded() {
    return this.loadedCount;
  }
  /** Stop loading, forget the images, and stop listening for resizes. */
  destroy() {
    this.destroyed = !0, typeof window < "u" && window.removeEventListener("resize", this.onResize);
    for (const t of this.images) t && (t.src = "");
  }
  /** Match the canvas's pixels to its size on screen, then redraw. */
  resize() {
    const t = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, e = Math.round(this.canvas.clientWidth * t), i = Math.round(this.canvas.clientHeight * t);
    e > 0 && i > 0 && (this.canvas.width !== e || this.canvas.height !== i) && (this.canvas.width = e, this.canvas.height = i), this.drawn = -1, this.draw();
  }
  draw() {
    const t = Math.round(this.current), e = this.nearestReady(t);
    if (e === -1 || e === this.drawn || !this.context) return;
    const i = this.images[e], { width: n, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(n / i.naturalWidth, r / i.naturalHeight) : Math.min(n / i.naturalWidth, r / i.naturalHeight), a = i.naturalWidth * o, c = i.naturalHeight * o;
    this.context.clearRect(0, 0, n, r), this.context.drawImage(i, (n - a) / 2, (r - c) / 2, a, c), this.drawn = e, this.pump();
  }
  /** The loaded frame closest to `index`, or -1. */
  nearestReady(t) {
    for (let e = 0; e < this.frames; e++) {
      if (t - e >= 0 && this.ready[t - e]) return t - e;
      if (t + e < this.frames && this.ready[t + e]) return t + e;
    }
    return -1;
  }
  /** Start loads, nearest to the current frame first, up to the concurrency. */
  pump() {
    const t = this.options.concurrency ?? 6, e = Math.round(this.current);
    for (let i = 0; i < this.frames && this.inFlight < t; i++)
      for (const n of i === 0 ? [e] : [e + i, e - i])
        n < 0 || n >= this.frames || this.images[n] || this.inFlight >= t || this.load(n);
  }
  load(t) {
    const e = new Image();
    e.decoding = "async", this.images[t] = e, this.inFlight++;
    const i = (n) => {
      if (!this.destroyed) {
        if (this.inFlight--, n) {
          this.ready[t] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const r = Math.round(this.current);
          (Math.abs(t - r) < Math.abs(this.drawn - r) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    e.onload = () => i(!0), e.onerror = () => i(!1), e.src = this.options.url(t);
  }
}
const Mr = { opacity: 0, y: -16 }, kr = { opacity: 0, y: 16 };
async function Ar(s, t, e, i) {
  const n = t.collector?.scope ?? t.root, r = n.ownerDocument ?? n, o = () => i.shared ? [...n.querySelectorAll(i.shared)] : [];
  if (i.native && typeof r.startViewTransition == "function")
    return Pr(r, i, o);
  const a = i.duration ?? 0.35, c = i.ease ?? "power2.inOut", l = (g) => new Promise((y) => {
    g(y) || y();
  }), h = o(), f = h.length ? ae(t, h) : void 0, u = i.from !== void 0 ? He(t, i.from, i.shared) : [];
  if (u.length && i.leave !== !1) {
    const g = i.leave ?? Mr;
    await l((y) => s.to(u, { ...g, duration: a, ease: c, onComplete: y }));
  }
  await i.update();
  const d = [], m = typeof i.to == "function" ? i.to() : i.to, p = m !== void 0 ? He(t, m, i.shared) : [];
  if (p.length && i.enter !== !1) {
    const g = i.enter ?? kr;
    d.push(l((y) => s.fromTo(p, g, { ...Rs(g), duration: a, ease: c, onComplete: y })));
  }
  if (f) {
    const g = o().filter((y) => !h.includes(y));
    g.length && d.push(
      l(
        (y) => ce(t, e, f, {
          targets: g,
          duration: a * 1.4,
          ease: c,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(d);
}
function He(s, t, e) {
  const i = s.resolveTargets(t).map((n) => s.elementFor(n)).filter((n) => !!n);
  return e ? i.flatMap((n) => !n.querySelector(e) && !n.matches(e) ? [n] : [...n.children].filter((r) => !r.matches(e) && !r.querySelector(e))) : i;
}
async function Pr(s, t, e) {
  const i = (a, c) => {
    const l = a.dataset?.flipId;
    l && a.style.setProperty("view-transition-name", c ? `tf-${l.replace(/[^\w-]/g, "-")}` : "");
  }, n = e();
  n.forEach((a) => i(a, !0));
  let r = [];
  await s.startViewTransition(async () => {
    n.forEach((a) => i(a, !1)), await t.update(), r = e(), r.forEach((a) => i(a, !0));
  }).finished, r.forEach((a) => i(a, !1));
}
const _r = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (s, t) => fe(s, Gi(t))
}, Er = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (s, t) => fe(s, { fn: Zi(t) })
}, Cr = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (s, t) => fe(s, { fn: Ki(t) })
}, Rr = 100;
function $r(s, t, e, i) {
  const n = [], r = [], { duration: o, alternate: a } = i, c = (d, m, p, g) => {
    r.push([d, m]);
    const y = [];
    s.forEach((b, w) => {
      (p === "forward" ? (g ? b >= d : b > d) && b <= m : (g ? b <= d : b < d) && b >= m) && y.push(w);
    }), y.sort((b, w) => (p === "forward" ? s[b] - s[w] : s[w] - s[b]) || b - w);
    for (const b of y) n.push({ kind: "event", index: b, direction: p });
  };
  let l = t.time, h = t.direction, f = t.fresh === !0;
  const u = Math.min(Rr, Math.max(0, e.iteration - t.iteration));
  for (let d = 0; d < u; d++) {
    const m = h === "forward" ? o : 0;
    c(l, m, h, f), n.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", l = m, f = !1) : (l = h === "forward" ? 0 : o, f = !0);
  }
  return u > 0 && i.holding && !a ? { crossings: n, passes: r } : (c(l, e.time, h, f), { crossings: n, passes: r });
}
const Ir = /* @__PURE__ */ new Set([
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
]), Ge = 0.5, Fr = "power1.inOut";
function Lr(s) {
  return s.keyframes !== void 0 && s.keyframes !== null;
}
function Dr(s) {
  const t = s.keyframes, e = {};
  for (const [l, h] of Object.entries(s)) Ir.has(l) || (e[l] = h);
  if (Array.isArray(t))
    return t.map((l) => ({
      ...e,
      ...l,
      duration: l.duration ?? s.duration ?? Ge
    }));
  const i = Object.entries(t), n = s.duration ?? Ge, r = t.easeEach ?? s.easeEach ?? Fr;
  if (i.length > 0 && i.every(([l]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(l) || l === "easeEach")) {
    const l = i.filter(([u]) => u !== "easeEach").map(([u, d]) => ({ at: Number.parseFloat(u) / 100, step: d })).sort((u, d) => u.at - d.at), h = [];
    let f = 0;
    for (const { at: u, step: d } of l) {
      const m = Math.max(0, u - f);
      h.push({ ...e, ease: r, ...d, duration: m * n }), f = u;
    }
    return h;
  }
  const o = i.filter(([l, h]) => l !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...o.map(([, l]) => l.length)), c = [];
  for (let l = 0; l < a; l++) {
    const h = { ...e, ease: r, duration: n / a };
    for (const [f, u] of o)
      l < u.length && (h[f] = u[l]);
    c.push(h);
  }
  return c;
}
function Ze(s, t, e, i = {}) {
  const n = t.collector?.scope ?? t.root, r = typeof i.scroller == "string" ? n.querySelector(i.scroller) : i.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, c = (b, w) => {
    if (w === void 0) return o[b];
    if (typeof w == "number") return w;
    if (w === "max") return a[b];
    const x = typeof w == "string" ? n.querySelector(w) : w;
    if (!x) return o[b];
    const v = x.getBoundingClientRect(), T = r?.getBoundingClientRect(), S = (b === "x" ? i.offsetX : i.offsetY) ?? i.offset ?? 0;
    return b === "x" ? v.left - (T?.left ?? 0) + o.x - S : v.top - (T?.top ?? 0) + o.y - S;
  }, l = typeof e == "object" && e !== null && !("nodeType" in e) ? { x: c("x", e.x), y: c("y", e.y) } : { x: o.x, y: c("y", e) }, h = { x: Math.max(0, Math.min(a.x, l.x)), y: Math.max(0, Math.min(a.y, l.y)) }, f = { ...o }, u = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], m = r ?? window, p = () => {
    y.kill(), g();
  }, g = () => {
    for (const b of d) m.removeEventListener(b, p);
  }, y = s.to(f, {
    x: h.x,
    y: h.y,
    duration: i.duration ?? 1,
    ease: i.ease ?? "power2.inOut",
    onStart: i.onStart,
    onUpdate: () => {
      u(), i.onUpdate?.();
    },
    onComplete: () => {
      g(), i.onComplete?.();
    }
  });
  if (i.autoKill !== !1) for (const b of d) m.addEventListener(b, p, { passive: !0 });
  return y;
}
function Br(s, t, e) {
  const i = s.collector?.scope ?? s.root, n = typeof t == "string" ? [...i.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: c, onEnterBack: l, onLeaveBack: h, ...f } = e, u = { onEnter: a, onLeave: c, onEnterBack: l, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, p = (y) => {
    m[y] !== void 0 && clearTimeout(m[y]), m[y] = void 0;
    const b = d[y].splice(0);
    b.length > 0 && u[y]?.(b);
  }, g = (y, b) => {
    if (u[y]) {
      if (d[y].push(b), o !== void 0 && d[y].length >= o) return p(y);
      m[y] === void 0 && (m[y] = setTimeout(() => p(y), r * 1e3));
    }
  };
  return n.map(
    (y) => me(s, {
      ...f,
      trigger: y,
      onEnter: () => g("onEnter", y),
      onLeave: () => g("onLeave", y),
      onEnterBack: () => g("onEnterBack", y),
      onLeaveBack: () => g("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class V {
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
  constructor(t, e = {}) {
    if (this.stage = t, this.options = e, this.compat = new et({
      ...e,
      startValue: (i, n) => {
        const r = t.objectFor(i);
        if (r) return qr(r[n]);
        const o = t.appliedValue(i, n);
        if (o !== void 0) return o;
        if (n === "d") return _s(t.elementFor(i)) ?? void 0;
        if (n === "text") return t.elementFor(i)?.textContent ?? void 0;
        if (n === "strokeDasharray" || n === "strokeDashoffset") {
          const a = Je(t.elementFor(i));
          if (a !== void 0) return n === "strokeDasharray" ? [a, a] : 0;
        }
      },
      startVelocity: (i, n) => t.velocityOf(i, n),
      layoutColumns: (i) => Qe(i.map((n) => t.elementFor(n))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !e.paused && !e.scrollTrigger, e.scrollTrigger) {
      const i = e.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = me(t, i, this, this.firstElement, (n) => e.onWarning?.(n)));
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
  to(t, e, i) {
    return Lr(e) ? this.record(() => this.keyframed(t, e, i)) : this.record(() => this.tween(t, [e], i, ([n], r, o) => this.compat.to(r, n, o)));
  }
  from(t, e, i) {
    return this.record(() => this.tween(t, [e], i, ([n], r, o) => this.compat.from(r, n, o)));
  }
  fromTo(t, e, i, n) {
    return this.record(
      () => this.tween(t, [e, i], n, ([r, o], a, c) => this.compat.fromTo(a, r, o, c))
    );
  }
  set(t, e, i) {
    return this.record(() => this.tween(t, [e], i, ([n], r, o) => this.compat.set(r, n, o)));
  }
  addLabel(t, e) {
    return this.record(() => this.compat.addLabel(t, e));
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, e) {
    return this.record(() => {
      t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, e);
    });
  }
  /**
   * Build the timeline again from the same calls: rewind to the start (so start
   * values are read from what elements show before it ran), rebuild every tween —
   * re-running function values — and return to the same progress. Use after a
   * layout change; `scrollTrigger: { invalidateOnRefresh: true }` does it on refresh.
   */
  invalidate() {
    const t = this.compat.progress();
    this.compat.progress(0), this.stage.render(this.timeline), this.compat.reset(), this.events = [], this.ranges = [];
    for (const e of this.recipe) e();
    return this.syncDuration(), this.compat.progress(t), this.stage.render(this.timeline), this;
  }
  /**
   * Run `callback` when the playhead crosses `position` (default: the end so far),
   * in either direction (GSAP's `call`). It takes no time, but a call after the
   * last tween makes the timeline that long.
   */
  call(t, e = [], i) {
    return this.record(() => {
      const n = this.compat.addEvent(i);
      this.events.push({ time: n, run: () => t(...e) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(t, e, i = []) {
    return this.record(() => {
      const n = this.compat.addEvent(t);
      this.events.push({ time: n, pause: !0, run: () => e?.(...i) });
    });
  }
  /**
   * Pause, and animate the playhead from where it is to `position` (seconds or a
   * label), firing callbacks on the way. Returns the tween that moves it.
   */
  tweenTo(t, e = {}) {
    return this.tweenFromTo(this.timeline.currentTime / 1e3, t, e);
  }
  /** Jump to `from`, then animate the playhead to `to` (seconds or labels). */
  tweenFromTo(t, e, i = {}) {
    this.pause(), this.seek(t);
    const n = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(e))), o = { time: n }, a = i.duration ?? Math.abs(r - n) / 1e3 / (this.timeScale() || 1), c = new V(this.stage, { onStart: i.onStart, onComplete: i.onComplete });
    return c.to(o, {
      time: r,
      duration: a,
      ease: i.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), i.onUpdate?.();
      }
    }), c;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const t = this.timeline.playbackState === "playing", e = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !t) {
      const i = this.timeline, n = i.direction === "forward" ? i.currentTime === 0 : i.currentTime === i.duration;
      this.playhead = { ...this.readPlayhead(), fresh: n && !e }, this.waitingToWrap = !1;
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
    const t = this.timeline.playbackState === "idle" && this.timeline.direction === "forward";
    return this.timeline.reverse(), t && this.timeline.currentTime === 0 && this.timeline.seek(this.timeline.duration), this.play();
  }
  /** Label times as progress (0..1), in order. */
  labelProgresses() {
    const t = this.timeline.duration;
    return t > 0 ? this.compat.labelTimes().map((e) => e / t) : [];
  }
  /** Whether the timeline is set to play backwards. */
  reversed() {
    return this.timeline.direction === "reverse";
  }
  /** Jump to a time in seconds, or to a label, and apply it immediately. */
  seek(t) {
    return this.autoplayPending = !1, this.compat.seek(t), this.stage.render(this.timeline), this.playhead = this.readPlayhead(), this.waitingToWrap = !1, this.options.onUpdate?.(), this;
  }
  /**
   * Read or set progress, 0..1. Setting applies immediately and fires the
   * callbacks crossed on the way, so a scroll scrub runs them.
   */
  progress(t) {
    return t === void 0 ? this.compat.progress() : (this.autoplayPending = !1, this.moveTo(Math.max(0, Math.min(1, t)) * this.timeline.duration), this.compat.progress());
  }
  timeScale(t) {
    return this.compat.timeScale(t);
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
  killTweensOf(t, e) {
    for (const i of t)
      for (const n of e ?? [void 0])
        this.timeline.removeTracks({ target: i, ...n !== void 0 && { property: n } });
    this.timeline.tracks.length === 0 && this.events.length === 0 && this.kill();
  }
  /** Run a building step now, and keep it so `invalidate()` can run it again. */
  record(t) {
    return this.recipe.push(t), t(), this.syncDuration(), this;
  }
  /** A call or pause after the last tween extends the timeline to reach it. */
  syncDuration() {
    if (this.events.length === 0) return;
    this.timeline.setDuration(void 0);
    const t = Math.max(...this.events.map((e) => e.time));
    t > this.timeline.duration && this.timeline.setDuration(t);
  }
  readPlayhead() {
    const t = this.timeline;
    return { time: t.currentTime, iteration: t.loopIteration, direction: t.direction };
  }
  /** Set the playhead to a time (ms) within the current loop, firing what it crosses. */
  moveTo(t) {
    const e = this.playhead;
    this.timeline.seek(t), this.stage.render(this.timeline);
    const i = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: t >= e.time ? "forward" : "reverse" }, n = { ...e, iteration: i.iteration, direction: i.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(n, i, !1), this.options.onUpdate?.();
  }
  /**
   * Rebuild for a new loop, keeping the playhead where the engine put it. Unlike
   * `invalidate()`, start values are not re-read from a rewound render: the
   * rebuilt tweens start where the recorded calls say, with fresh function values.
   */
  refreshForRepeat() {
    const t = this.timeline.currentTime;
    this.compat.reset(), this.events = [], this.ranges = [];
    for (const e of this.recipe) e();
    this.syncDuration(), this.timeline.seek(Math.min(t, this.timeline.duration));
  }
  /** After each frame this timeline played: callbacks crossed, repeats, completion. */
  afterFrame() {
    const t = this.timeline, e = t.repeatDelayRemaining > 0;
    if (this.waitingToWrap && e) {
      this.options.onUpdate?.();
      return;
    }
    this.waitingToWrap = !1;
    const i = this.playhead, n = this.readPlayhead();
    this.playhead = n;
    const r = this.options.yoyo === !0;
    e && !r && n.iteration > i.iteration && (this.playhead = { time: 0, iteration: n.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const o = this.runCrossings(i, n, e);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !o) {
      this.finishedThisFrame = !1;
      const a = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, e, i) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const n = this.events, { crossings: r, passes: o } = $r(
      n.map((a) => a.time),
      t,
      e,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: i }
    );
    for (const a of r) {
      if (this.killed) return !0;
      if (a.kind === "repeat") {
        this.options.repeatRefresh && this.refreshForRepeat(), this.options.onRepeat?.();
        continue;
      }
      const c = n[a.index];
      if (!(c.direction && c.direction !== a.direction)) {
        if (c.pause)
          return this.timeline.seek(c.time), this.stage.render(this.timeline), this.pause(), this.playhead = this.readPlayhead(), this.waitingToWrap = !1, c.run(), !0;
        c.run();
      }
    }
    for (const a of this.ranges)
      o.some(([l, h]) => l !== h && Math.max(l, h) >= a.start && Math.min(l, h) <= a.end) && a.run();
    return !1;
  }
  /**
   * Compile one tween call. A track has one start value and one set of values,
   * but some tweens differ per element — each element's own shape, text or stroke
   * length, each plain object's own current values, or function values called per
   * element — so those build one tween per element at the same position, with any
   * stagger turned into delays. `varsList` is `[vars]`, or `[fromVars, toVars]`.
   */
  tween(t, e, i, n) {
    const r = this.resolve(t);
    if (!r) return;
    const { onStart: o, onUpdate: a, onComplete: c } = e[e.length - 1];
    if (o || a || c) {
      let l = 1 / 0, h = -1 / 0;
      const f = (u, d, m) => {
        n(u, d, m), l = Math.min(l, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(r, e, i, f), l === 1 / 0) return;
      o && this.events.push({ time: l, direction: "forward", run: o }), a && this.ranges.push({ start: l, end: h, run: a }), c && this.events.push({ time: h, direction: "forward", run: c });
      return;
    }
    this.buildTween(r, e, i, n);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(t, e, i) {
    const n = this.resolve(t);
    if (!n) return;
    const r = Dr(e);
    if (r.length === 0) return;
    const o = n.length > 1 ? re(e.stagger, this.staggerContext(n)) : void 0, a = n.map((g) => this.targetFor(g)).filter((g) => g !== void 0), c = o ? a.map((g) => [g]) : [a], l = o ? Jt(n.length, o).map((g) => g / 1e3) : [0], h = this.compat.timeOf(i) / 1e3 + Rt(e.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (c.forEach((g, y) => {
      r.forEach((b, w) => {
        const x = w === 0 ? h + l[y] : ">";
        this.tween(g, [b], x, ([v], T, S) => this.compat.to(T, v, S)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: d, onUpdate: m, onComplete: p } = e;
    d && this.events.push({ time: f, direction: "forward", run: d }), m && this.ranges.push({ start: f, end: u, run: m }), p && this.events.push({ time: u, direction: "forward", run: p });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => Qe(t.map((e) => this.stage.elementFor(e))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, e, i, n) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (e.some(Xr) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      n(e.map((d) => this.prepare(Ke(d, 0, u, this.stage.utils, r), t)), t, i);
      return;
    }
    const a = e.length - 1, { stagger: c, ...l } = e[a], h = re(c, this.staggerContext(t)), f = h ? Jt(t.length, h).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, d) => {
      const m = d === 0 ? Rt(l.delay, 0) / 1e3 + f[0] : 0, p = d === 0 ? 0 : f[d] - f[d - 1], g = d === 0 ? i : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, b = e.map((w, x) => x === a ? { ...l, delay: m } : w).map((w) => this.prepare(Ke(w, d, this.targetFor(u), this.stage.utils, r), [u]));
      n(b, [u], g);
    });
  }
  /** The element or plain object behind a target name. */
  targetFor(t) {
    return this.stage.elementFor(t) ?? this.stage.objectFor(t);
  }
  /**
   * Resolve the parts of vars that refer to the page — today, a motion path
   * given as a selector or element, and its `align` — into plain data.
   */
  prepare(t, e) {
    const i = (o) => this.options.onWarning?.(o), n = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = Nn(t.motionPath, {
        query: n,
        targets: e.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: i
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Xn(t.morphSVG, n, i), { morphSVG: a, ...c } = r;
      r = o ? { ...r, morphSVG: o } : c;
    }
    if (t.drawSVG !== void 0) {
      const o = Je(this.stage.elementFor(e[0]));
      if (o === void 0) {
        i("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...c } = r;
        r = c;
      } else
        r = gn(r, o);
    }
    return r;
  }
  resolve(t) {
    const e = this.stage.resolveTargets(t);
    if (e.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Yr(t)}`);
      return;
    }
    return this.firstElement ??= e.map((i) => this.stage.elementFor(i)).find((i) => i !== void 0), e;
  }
}
function Or(s = new Ln()) {
  const t = (r) => {
    const { config: o } = At(r);
    return new V(s, {
      repeat: o.repeat,
      yoyo: o.yoyo,
      repeatDelay: o.repeatDelay,
      paused: o.paused,
      onStart: o.onStart,
      onUpdate: o.onUpdate,
      onComplete: o.onComplete,
      onRepeat: o.onRepeat,
      onReverseComplete: o.onReverseComplete,
      repeatRefresh: o.repeatRefresh,
      scrollTrigger: o.scrollTrigger
    });
  }, e = (r) => {
    const { onStart: o, onUpdate: a, onComplete: c, onRepeat: l, onReverseComplete: h, repeatRefresh: f, ...u } = r;
    return u;
  }, i = (r) => (r && s.collector?.track(r), r), n = {
    stage: s,
    ticker: s.ticker,
    utils: s.utils,
    getProperty: (r, o) => {
      const [a] = s.resolveTargets(r);
      if (a === void 0) return;
      const c = s.objectFor(a);
      return c ? c[o] : s.appliedValue(a, o) ?? Ms(o);
    },
    scrollTrigger: (r) => i(me(s, r)),
    scrollBatch: (r, o) => Br(s, r, o).map((a) => i(a)),
    scrollTo: (r, o) => Ze(n, s, r, o),
    refreshScroll: () => {
      Bt.refreshAll(), ze.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (s.collector?.scope ?? s.root).querySelector(r.scroller) : r.scroller;
      return i(new ze({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new Ls(s, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new xr(s, r),
    customEase: _r.create,
    customBounce: Er.create,
    customWiggle: Cr.create,
    pageTransition: (r) => Ar(n, s, (o) => new V(s, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (s.collector?.scope ?? s.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return i(new Sr(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const c = new V(s, { paused: !0 }), [l] = s.resolveTargets(r);
      return Object.assign((f) => {
        if (!l) return;
        const u = a.spring !== void 0 ? s.velocityOf(l, o) ?? 0 : 0;
        c.compat.reset(), c.compat.to(l, {
          [o]: f,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Nr(a.spring, o, u) }
        }), c.timeline.stop(), c.timeline.play(), s.activate(c.timeline);
      }, { tween: c, kill: () => c.kill() });
    },
    timeline: (r) => new V(s, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...c } = o, l = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof r != "string" && r !== window && r.nodeType === 1;
        return Ze(n, s, a, {
          ...c,
          offsetX: l.offsetX,
          offsetY: l.offsetY,
          scroller: h ? r : void 0
        });
      }
      return t(o).to(r, e(o));
    },
    from: (r, o) => t(o).from(r, e(o)),
    fromTo: (r, o, a) => t(a).fromTo(r, o, e(a)),
    set: (r, o) => t(o).set(r, e(o)),
    delayedCall: (r, o, a) => new V(s).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = s.resolveTargets(r), c = typeof o == "string" ? o.split(",").map((l) => l.trim()).filter(Boolean) : o;
      for (const l of [...s.liveTimelines]) l.killTweensOf(a, c);
    },
    convertToPath: (r) => Yn(r, s.root),
    splitText: (r, o) => {
      const a = s.collector?.scope ?? s.root, c = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return i(Qn(c, o));
    },
    draggable: (r, o) => i(Hn(n, s, r, o)),
    getFlipState: (r) => ae(s, r),
    flipFrom: (r, o) => ce(s, (a) => new V(s, a), r, o),
    flip: (r, o, a) => {
      const c = ae(s, r);
      return o(), ce(s, (l) => new V(s, l), c, { targets: r, ...a });
    }
  };
  return n;
}
const D = /* @__PURE__ */ Or();
function Nr(s, t, e) {
  return s === !0 ? { velocity: { [t]: e } } : typeof s == "string" ? { preset: s, velocity: { [t]: e } } : { ...s, velocity: { [t]: e } };
}
function Xr(s) {
  return s.morphSVG !== void 0 || s.drawSVG !== void 0 || s.text !== void 0 || s.scrambleText !== void 0 || Ds(s);
}
function Ds(s) {
  return Object.entries(s).some(([t, e]) => (typeof e == "function" || Ss(e)) && !de.has(t));
}
function Ke(s, t, e, i, n) {
  if (!Ds(s)) return s;
  const r = {};
  for (const [o, a] of Object.entries(s))
    de.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, e, n) : Ss(a) ? r[o] = i.resolveRandomString(a) : r[o] = a;
  return r;
}
function Qe(s) {
  const t = s.map((i) => i?.getBoundingClientRect().top);
  if (t[0] === void 0) return s.length;
  let e = 0;
  for (const i of t) {
    if (i === void 0 || Math.abs(i - t[0]) > 1) break;
    e++;
  }
  return Math.max(1, e);
}
function Je(s) {
  const t = s;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function qr(s) {
  if (typeof s == "number" || typeof s == "string" || Array.isArray(s) && s.every((t) => typeof t == "number")) return s;
}
function Yr(s) {
  return typeof s == "string" ? `"${s}"` : String(s);
}
class ts {
  media;
  offset;
  driftTolerance;
  constructor(t, e = {}) {
    this.media = t, this.offset = e.offset ?? 0, this.driftTolerance = Math.max(0, e.driftTolerance ?? 0.15);
  }
  /** Map a timeline time (ms) to the media's time (seconds), never negative. */
  targetTime(t) {
    return Math.max(0, t / 1e3 + this.offset);
  }
  /**
   * Reconcile the media with the timeline for the current frame.
   *
   * @param timelineTimeMs current timeline time in milliseconds
   * @param isPlaying whether the timeline is playing
   */
  update(t, e) {
    const i = this.targetTime(t);
    e ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - i) > this.driftTolerance && (this.media.currentTime = i)) : (this.media.paused || this.media.pause(), this.media.currentTime !== i && (this.media.currentTime = i));
  }
  /** Hard-align the media to a timeline time (used on explicit seeks). */
  seek(t) {
    this.media.currentTime = this.targetTime(t);
  }
  /** Mirror the timeline playback rate onto the media. */
  setRate(t) {
    this.media.playbackRate = t;
  }
  /** Pause the media and release it. */
  dispose() {
    this.media.paused || this.media.pause();
  }
  safePlay() {
    const t = this.media.play();
    t && typeof t.catch == "function" && t.catch(() => {
    });
  }
}
function Vr(s, t, e, i, n) {
  const r = e - n;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  s.update(r, i);
}
class Bs {
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
  constructor(t, e = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i)
        throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = e, this.adapter = new H();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    let e;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load animation: ${i.statusText}`);
      e = await i.json();
    } else
      e = t;
    this.options.speed !== void 0 && (e.config = { ...e.config, speed: this.options.speed }), this.options.loop !== void 0 && (e.config = { ...e.config, loop: this.options.loop }), this.options.alternate !== void 0 && (e.config = { ...e.config, alternate: this.options.alternate }), this.timeline = pt(e), this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.options.autoplay && this.play();
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((e) => {
      const i = e, n = Number(i.getAttribute("data-tinyfly-start") ?? "0") || 0, r = i.getAttribute("data-volume");
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: n, sync: new ts(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, e) {
    for (const i of this.mediaTargets)
      Vr(i.sync, i.el, t, e, i.startTime);
  }
  /**
   * Load animation from inline JSON string.
   */
  loadFromString(t) {
    const e = JSON.parse(t);
    this.load(e);
  }
  /**
   * Register a target element by name.
   */
  registerTarget(t, e) {
    if (typeof e == "string") {
      const i = this.container.querySelector(e);
      i && (this.targets[t] = i, this.adapter.registerTarget(t, i));
    } else
      this.targets[t] = e, this.adapter.registerTarget(t, e);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((e) => {
      const i = e.closest("[data-tinyfly-symbol]");
      if (i && i !== e) return;
      const n = e.getAttribute("data-tinyfly");
      n && this.registerTarget(n, e);
    }), this.timeline && new Set(this.timeline.tracks.map((i) => i.target)).forEach((i) => {
      if (!this.targets[i]) {
        const n = this.container.querySelector(`[data-tinyfly="${i}"]`) || this.container.querySelector(`.${i}`) || this.container.querySelector(`#${i}`);
        n && this.registerTarget(i, n);
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
    const t = this.options.symbols;
    if (!t || t.length === 0) return;
    const e = new Map(t.map((i) => [i.id, i]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((i) => {
      const n = i.getAttribute("data-tinyfly-symbol");
      if (!n) return;
      const r = e.get(n);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new H();
      i.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && o.registerTarget(c, a);
      }), this.symbolInstances.push({ adapter: o, timeline: pt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, e) {
    this.mediaSync = new ts(t, e), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
  }
  /** Detach and pause the currently synced media, if any. */
  detachMedia() {
    this.mediaSync?.dispose(), this.mediaSync = void 0;
  }
  /**
   * Start or resume playback.
   */
  play() {
    !this.timeline || this.isDestroyed || (this.timeline.play(), this.mediaSync?.update(this.timeline.currentTime, !0), this.syncAllMedia(this.timeline.currentTime, !0), this.startAnimationLoop());
  }
  /**
   * Pause playback.
   */
  pause() {
    this.timeline && (this.timeline.pause(), this.mediaSync?.update(this.timeline.currentTime, !1), this.syncAllMedia(this.timeline.currentTime, !1), this.stopAnimationLoop());
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
  seek(t) {
    this.timeline && (this.timeline.seek(t), this.applyState(), this.mediaSync?.seek(this.timeline.currentTime), this.syncAllMedia(this.timeline.currentTime, this.isPlaying));
  }
  /**
   * Set playback speed.
   */
  setSpeed(t) {
    this.timeline && (this.timeline.speed = t, this.mediaSync?.setRate(t));
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
    this.isDestroyed = !0, this.stopAnimationLoop(), this.mediaSync?.dispose(), this.mediaSync = void 0;
    for (const t of this.mediaTargets)
      t.el.paused || t.el.pause();
    this.mediaTargets = [], this.adapter.clearTargets();
    for (const t of this.symbolInstances) t.adapter.clearTargets();
    this.symbolInstances = [], this.timeline = null;
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const t = (e) => {
      if (this.isDestroyed || !this.timeline) return;
      const i = e - (this.lastTime ?? e);
      this.lastTime = e, this.timeline.tick(i), this.applyState();
      const n = this.timeline.playbackState === "playing";
      this.mediaSync?.update(this.timeline.currentTime, n), this.syncAllMedia(this.timeline.currentTime, n), this.timeline.playbackState === "playing" ? this.animationFrameId = requestAnimationFrame(t) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(t);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
  applyState() {
    if (!this.timeline) return;
    const t = this.timeline.currentTime;
    this.adapter.applyState(this.timeline.getStateAtTime(t));
    for (const e of this.symbolInstances) {
      const i = e.timeline.duration;
      e.adapter.applyState(e.timeline.getStateAtTime(i > 0 ? t % i : t));
    }
  }
}
async function go(s, t, e = {}) {
  const i = new Bs(s, { ...e, autoplay: !0 });
  return await i.load(t), i;
}
function yo(s, t = {}) {
  return new Bs(s, t);
}
class jr {
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
  constructor(t, e = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i) throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = e, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new H(), this.adapterB = new H();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let e;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load sequence: ${i.statusText}`);
      e = await i.json();
    } else
      e = t;
    this.sequence = e, this.symbolDefs.clear();
    for (const i of e.symbols ?? [])
      i.timeline?.tracks?.length && this.symbolDefs.set(i.id, i.timeline);
    this.container.style.width = `${e.canvas.width}px`, this.container.style.height = `${e.canvas.height}px`, e.scenes.length > 0 && (this.renderScene(e.scenes[0], this.containerA, this.adapterA), this.timelineA = this.createTimeline(e.scenes[0])), this.options.autoplay && this.play();
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
      const t = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(t), this.applyNested(this.adapterA, 0);
    }
  }
  /**
   * Jump to a specific scene by index.
   */
  goToScene(t) {
    if (!this.sequence || t < 0 || t >= this.sequence.scenes.length) return;
    const e = this._isPlaying;
    this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this._currentSceneIndex = t, this._state = e ? "playing-scene" : "idle", this.clearContainer(this.containerA), this.clearContainer(this.containerB), this.adapterA.clearTargets(), this.adapterB.clearTargets(), this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB);
    const i = this.sequence.scenes[t];
    if (this.renderScene(i, this.containerA, this.adapterA), this.timelineA = this.createTimeline(i), this.options.onSceneChange?.(t), e)
      this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play(), this.startAnimationLoop()) : this.onSceneComplete();
    else if (this.timelineA) {
      const n = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(n), this.applyNested(this.adapterA, 0);
    }
  }
  /**
   * Clean up all resources.
   */
  destroy() {
    this._isDestroyed = !0, this._isPlaying = !1, this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.adapterA.clearTargets(), this.adapterB.clearTargets();
    for (const t of this.nestedByAdapter.values())
      for (const e of t) e.adapter.clearTargets();
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
    const t = document.createElement("div");
    return t.style.position = "absolute", t.style.top = "0", t.style.left = "0", t.style.width = "100%", t.style.height = "100%", t;
  }
  renderScene(t, e, i) {
    e.innerHTML = "", i.clearTargets();
    const n = document.createElement("div");
    n.style.cssText = "position:absolute;inset:0;transform-origin:center center", n.setAttribute("data-tinyfly", "Camera"), e.appendChild(n), i.registerTarget("Camera", n);
    for (const r of t.elements) {
      if (!r.html) continue;
      const o = document.createElement("div");
      o.innerHTML = r.html.trim();
      const a = o.firstElementChild;
      if (a) {
        n.appendChild(a);
        const c = a.getAttribute("data-tinyfly");
        c && i.registerTarget(c, a);
      }
    }
    this.setupNested(n, i);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(t, e) {
    const i = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const r = n.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new H();
      n.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), i.push({ adapter: a, timeline: pt(o) });
    }), i.length ? this.nestedByAdapter.set(e, i) : this.nestedByAdapter.delete(e);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, e) {
    const i = this.nestedByAdapter.get(t);
    if (i)
      for (const n of i) {
        const r = n.timeline.duration;
        n.adapter.applyState(n.timeline.getStateAtTime(r > 0 ? e % r : e));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? pt(t.timeline) : null;
  }
  onSceneComplete() {
    if (this._isDestroyed || !this.sequence) return;
    const t = this._currentSceneIndex + 1;
    if (t >= this.sequence.scenes.length) {
      const e = this.options.loop ?? this.sequence.loop ?? 0;
      e === -1 || e > 0 && this.loopIteration < e - 1 ? (this.loopIteration++, this.beginTransitionTo(0)) : (this._isPlaying = !1, this._state = "idle", this.stopAnimationLoop(), this.options.onComplete?.());
    } else
      this.beginTransitionTo(t);
  }
  beginTransitionTo(t) {
    if (!this.sequence || this._isDestroyed) return;
    const e = this.sequence.scenes[t], i = e.transition;
    if (i.type === "none" || i.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(e, this.containerB, this.adapterB), this.timelineB = this.createTimeline(e), this.timelineB && this.timelineB.play(), this.applyTransition(i.type, i.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, i.duration);
  }
  applyTransition(t, e) {
    const i = `${e}ms`, n = "ease-in-out";
    switch (this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), t) {
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${i} ${n}, transform ${i} ${n}`, this.containerB.style.transition = `opacity ${i} ${n}, transform ${i} ${n}`, t) {
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
  resetTransitionStyles(t) {
    t.style.transition = "", t.style.opacity = "1", t.style.transform = "";
  }
  finishTransition(t) {
    this.transitionTimer = void 0, this.timelineA && (this.timelineA.stop(), this.timelineA = null), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const e = this.containerA;
    this.containerA = this.containerB, this.containerB = e;
    const i = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = i, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
  }
  switchToScene(t) {
    if (!this.sequence || this._isDestroyed) return;
    this.timelineA && this.timelineA.stop(), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const e = this.sequence.scenes[t];
    this.renderScene(e, this.containerA, this.adapterA), this.timelineA = this.createTimeline(e), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play()) : this.onSceneComplete();
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const t = (e) => {
      if (this._isDestroyed || !this._isPlaying) return;
      const i = e - (this.lastTime ?? e);
      if (this.lastTime = e, this.timelineA && this.timelineA.playbackState === "playing") {
        this.timelineA.tick(i);
        const n = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(n), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(i);
        const n = this.timelineB.getStateAtTime(this.timelineB.currentTime);
        this.adapterB.applyState(n), this.applyNested(this.adapterB, this.timelineB.currentTime);
      }
      this._isPlaying ? this.animationFrameId = requestAnimationFrame(t) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(t);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
}
async function bo(s, t, e = {}) {
  const i = new jr(s, { ...e, autoplay: !0 });
  return await i.load(t), i;
}
const wo = { type: "none", duration: 0 };
function vo(s) {
  const { timeline: t } = s, e = new H();
  for (const [l, h] of Object.entries(s.targets)) {
    const f = typeof h == "string" ? document.querySelector(h) : h;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${l}" (${String(h)})`);
    e.registerTarget(l, f);
  }
  t.onUpdate = (l) => {
    e.applyState(l), s.onUpdate?.(l);
  }, s.onComplete && (t.onComplete = s.onComplete);
  let i = null, n = null, r = !1;
  const o = (l) => {
    if (r) return;
    const h = n === null ? 0 : l - n;
    n = l, h > 0 && t.tick(h), i = requestAnimationFrame(o);
  }, a = () => {
    i !== null || r || (n = null, i = requestAnimationFrame(o));
  }, c = () => {
    i !== null && cancelAnimationFrame(i), i = null, n = null;
  };
  return e.applyState(t.getStateAtTime(t.currentTime)), s.autoplay !== !1 && (t.play(), a()), {
    timeline: t,
    adapter: e,
    play() {
      t.play(), a();
    },
    pause() {
      t.pause(), c();
    },
    restart() {
      t.stop(), t.play(), a();
    },
    seek(l) {
      t.seek(l * 1e3), e.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, c(), t.stop(), e.clearTargets();
    }
  };
}
const To = {
  timeline: Sn,
  to(s, t, e) {
    const i = new et(e);
    return i.to(s, t), i;
  },
  from(s, t, e) {
    const i = new et(e);
    return i.from(s, t), i;
  },
  fromTo(s, t, e, i) {
    const n = new et(i);
    return n.fromTo(s, t, e), n;
  },
  set(s, t, e) {
    const i = new et(e);
    return i.set(s, t), i;
  }
}, xo = D.to, So = D.from, Mo = D.fromTo, ko = D.set, Ao = D.timeline, Po = D.ticker, _o = D.splitText, Eo = D.context, Co = D.matchMedia, Ro = D.quickTo, $o = D.imageSequence, Io = D.pageTransition;
export {
  zr as Clock,
  et as CompatTimeline,
  Er as CustomBounce,
  _r as CustomEase,
  Cr as CustomWiggle,
  ls as DEFAULT_BAKE_INTERVAL_MS,
  ge as DEFAULT_INERTIA_FRICTION,
  B as DEFAULT_SPRING,
  wo as DEFAULT_TRANSITION,
  Es as Draggable,
  zs as INERTIA_MAX_DURATION_MS,
  Bi as InertiaTrackPlayer,
  V as LiveTimeline,
  to as MORPH_SAMPLES,
  Wr as ManualClock,
  ts as MediaSync,
  Vn as Observer,
  ns as SPRING_MAX_DURATION_MS,
  Nt as SPRING_PRESETS,
  ft as SPRING_STEP_MS,
  ur as ScrollAnimator,
  Bt as ScrollDriver,
  fr as ScrollMarkers,
  or as ScrollPin,
  ze as SmoothScroll,
  Ft as SpringSampler,
  Di as SpringTrackPlayer,
  Ln as Stage,
  ms as Timeline,
  Bs as TinyflyPlayer,
  jr as TinyflySequencer,
  jt as TrackPlayer,
  ho as ValueResolver,
  rr as VisibilityDriver,
  ri as backOut,
  ds as bakeEasing,
  us as bakeInertiaTrack,
  hs as bakeSpringTrack,
  ni as bounceOut,
  Ni as charactersFor,
  Is as clamp01,
  eo as clearMorphCache,
  Qr as clearPathCache,
  je as containerProgressAt,
  Eo as context,
  yo as create,
  si as createCubicBezier,
  Or as createLive,
  Ui as createRandom,
  ie as createTrack,
  Zr as criticalDamping,
  Zi as customBounce,
  Gi as customEase,
  Ki as customWiggle,
  pt as deserializeTimeline,
  Vi as deserializeTrack,
  uo as draggable,
  Qs as easeIn,
  rs as easeInCubic,
  ti as easeInOut,
  Dt as easeInOutCubic,
  Ks as easeInOutQuad,
  Gs as easeInQuad,
  Js as easeOut,
  os as easeOutCubic,
  Zs as easeOutQuad,
  ii as elasticOut,
  Fi as expandParametricEasings,
  So as from,
  oo as fromJSON,
  Mo as fromTo,
  j as getEasingFunction,
  Et as getInterpolator,
  ps as getMotionPathPoint,
  Jr as getPathLength,
  gi as getPointAtProgress,
  Un as gridLinesFor,
  Vs as hasKeyframes,
  ao as hashSeed,
  $o as imageSequence,
  yt as inertiaDuration,
  gt as inertiaRest,
  te as inertiaValueAt,
  Kr as inertiaVelocityAt,
  $i as interpolateArray,
  Ri as interpolateColor,
  no as interpolateMotionPath,
  Y as interpolateNumber,
  Ii as interpolatePathString,
  Ce as interpolateString,
  Ys as isCubicBezierEasing,
  G as isInertiaTrack,
  Ur as isMotionPathPoint,
  es as isMotionPathTrack,
  Pt as isParametricEasing,
  bt as isPathData,
  Z as isSpringTrack,
  le as isTextTrack,
  Gr as isUnderdamped,
  lo as isUnresolved,
  ee as linear,
  D as live,
  Ct as mapEase,
  Co as matchMedia,
  is as maxStaggerDistance,
  _i as morphPath,
  _t as naturalRest,
  Io as pageTransition,
  ai as parametricEasing,
  Ve as parseEdge,
  st as parsePath,
  $s as parseTrigger,
  go as play,
  bo as playSequence,
  po as playWhenVisible,
  as as pointAtDistance,
  tn as pointsToPath,
  vo as quickPlay,
  Ro as quickTo,
  ys as randomBetween,
  co as randomChoice,
  Wi as randomSnapped,
  zi as resolveSequence,
  vs as resolveValue,
  fo as scrollProgress,
  mo as scrubOnScroll,
  ji as serializeTimeline,
  Yi as serializeTrack,
  ko as set,
  ue as shapeToPathData,
  Li as simplifyKeyframes,
  nr as smoothToward,
  jn as snapAxis,
  cr as snapConfig,
  hr as snapDuration,
  lr as snapProgress,
  _o as splitText,
  js as springDuration,
  Hr as springValueAt,
  ss as staggerDistance,
  he as staggerOffset,
  Jt as staggerOffsets,
  It as staggerSpan,
  oi as stepsEasing,
  Vr as syncMediaElement,
  qi as textAt,
  To as tf,
  Po as ticker,
  Ao as timeline,
  xo as to,
  ro as toJSON,
  so as toKeyframedTrack,
  io as toKeyframedTracks,
  z as trackTargets,
  mt as triggerDistance
};
