function hd(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function go(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const tl = 2;
function n0(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function sa(t) {
  return t.property === "text" && "textConfig" in t;
}
function en(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function nn(t) {
  return t.kind === "spring" && "spring" in t;
}
function s0(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function FM(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function ud(t) {
  return "keyframes" in t;
}
class NM {
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
class DM {
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
function fd(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function o0(t, e, n = "start") {
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
function i0(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, o0(s, t, e));
  return n;
}
function oa(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", o = o0(t, e, s);
  if (n.amount !== void 0) {
    const i = i0(e, s);
    return i === 0 ? 0 : n.amount * o / i;
  }
  return n.each !== void 0 ? n.each * o : 0;
}
function fr(t, e) {
  return Array.from({ length: t }, (n, s) => oa(s, t, e));
}
function Ko(t, e) {
  return t <= 1 ? 0 : Math.max(...fr(t, e));
}
const os = 1, r0 = 6e4, Ls = r0 / os, ie = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, ki = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class jo {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? ie.stiffness, this.damping = e.damping ?? ie.damping, this.mass = e.mass ?? ie.mass, this.restDelta = e.restDelta ?? ie.restDelta, this.restSpeed = e.restSpeed ?? ie.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? ie.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / os);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], o = this.samples[Math.min(n + 1, this.samples.length - 1)], i = e / os - n;
    return s + (o - s) * i;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Ls + 1), this.settledStep !== null ? this.settledStep * os : r0;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, Ls + 1), s = os / 1e3;
    for (; this.samples.length < n; ) {
      const o = this.samples[this.samples.length - 1], i = o - this.to, r = -this.stiffness * i, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = o + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Ls && (this.settledStep = Ls);
  }
}
function BM(t, e) {
  return new jo(t).valueAt(e);
}
function dd(t) {
  return new jo(t).settleTime();
}
function zM(t) {
  const e = t.stiffness ?? ie.stiffness, n = t.damping ?? ie.damping, s = t.mass ?? ie.mass;
  return n < 2 * Math.sqrt(e * s);
}
function qM(t) {
  const e = t.stiffness ?? ie.stiffness, n = t.mass ?? ie.mass;
  return 2 * Math.sqrt(e * n);
}
const el = 4, pd = 2e-3, gd = 1e-4, md = 6e4;
function Xo(t) {
  const e = t.friction ?? el;
  return e > 0 ? e : el;
}
function mo(t) {
  return t.from + t.velocity / Xo(t);
}
function yd(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function As(t) {
  let e = yd(mo(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function $s(t) {
  const e = Math.abs(As(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(gd, e * pd);
  if (n >= e) return 0;
  const s = Math.log(e / n) / Xo(t);
  return Math.min(md, s * 1e3);
}
function dr(t, e) {
  if (e <= 0) return t.from;
  const n = As(t);
  if (e >= $s(t)) return n;
  const s = Xo(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function YM(t, e) {
  const n = Xo(t), s = As(t);
  return e >= $s(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const pr = (t) => t, bd = (t) => t * t, wd = (t) => 1 - (1 - t) * (1 - t), kd = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, a0 = (t) => t * t * t, l0 = (t) => 1 - Math.pow(1 - t, 3), Uo = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, vd = a0, Md = l0, xd = Uo, Sd = {
  linear: pr,
  "ease-in": vd,
  "ease-out": Md,
  "ease-in-out": xd,
  "ease-in-quad": bd,
  "ease-out-quad": wd,
  "ease-in-out-quad": kd,
  "ease-in-cubic": a0,
  "ease-out-cubic": l0,
  "ease-in-out-cubic": Uo
};
function Td(t) {
  const [e, n, s, o] = t, i = 3 * e, r = 3 * (s - e) - i, a = 1 - i - r, l = 3 * n, c = 3 * (o - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + i) * p, f = (p) => ((h * p + c) * p + l) * p, d = (p) => (3 * a * p + 2 * r) * p + i, g = (p) => {
    let m = p;
    for (let w = 0; w < 8; w++) {
      const y = u(m) - p;
      if (Math.abs(y) < 1e-7)
        return m;
      const S = d(m);
      if (Math.abs(S) < 1e-7)
        break;
      m -= y / S;
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
    return f(m);
  };
}
function vi(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function Ed(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (o) => o <= 0 ? 0 : o >= 1 ? 1 : n * Math.pow(2, -10 * o) * Math.sin((o - s) * (2 * Math.PI) / e) + 1;
}
const Ad = (t) => {
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
function $d(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function Pd(t, e = "end") {
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
function Id(t) {
  switch (t.type) {
    case "steps":
      return Pd(t.count, t.position);
    case "elastic":
      return vi(Ed(t.amplitude, t.period), t.mode);
    case "bounce":
      return vi(Ad, t.mode);
    case "back":
      return vi($d(t.overshoot), t.mode);
  }
}
function Ft(t) {
  return t === void 0 ? pr : hd(t) ? Td(t.points) : go(t) ? Id(t) : Sd[t] ?? pr;
}
const nl = 32, Od = 256, wn = /* @__PURE__ */ new Map(), _d = /[MmLlHhVvCcSsQqTtAaZz]/, Hd = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, Cd = {
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
function Rd(t) {
  const e = [];
  let n = 0, s = null;
  const o = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (o(), !(n >= t.length)); ) {
    const i = t[n];
    if (_d.test(i)) {
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
    const l = Hd.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function Ld(t, e, n, s, o, i, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = o * Math.PI / 180, f = Math.cos(u), d = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = f * g + d * p, b = -d * g + f * p, k = m * m / (c * c) + b * b / (h * h);
  if (k > 1) {
    const C = Math.sqrt(k);
    c *= C, h *= C;
  }
  const w = i === r ? -1 : 1, y = c * c * h * h - c * c * b * b - h * h * m * m, S = c * c * b * b + h * h * m * m, $ = w * Math.sqrt(Math.max(0, y / S)), v = $ * c * b / h, x = -$ * h * m / c, M = f * v - d * x + (t + a) / 2, T = d * v + f * x + (e + l) / 2, A = (C, B, Y, I) => {
    const N = C * Y + B * I, nt = Math.sqrt((C * C + B * B) * (Y * Y + I * I)), H = Math.acos(Math.max(-1, Math.min(1, N / nt)));
    return C * I - B * Y < 0 ? -H : H;
  }, E = A(1, 0, (m - v) / c, (b - x) / h);
  let P = A((m - v) / c, (b - x) / h, (-m - v) / c, (-b - x) / h);
  !r && P > 0 && (P -= 2 * Math.PI), r && P < 0 && (P += 2 * Math.PI);
  const O = Math.max(1, Math.ceil(Math.abs(P) / (Math.PI / 2))), L = P / O, q = 4 / 3 * Math.tan(L / 4), G = (C) => {
    const B = c * Math.cos(C), Y = h * Math.sin(C);
    return [f * B - d * Y + M, d * B + f * Y + T];
  }, Q = (C) => {
    const B = -c * Math.sin(C), Y = h * Math.cos(C);
    return [f * B - d * Y, d * B + f * Y];
  }, j = [];
  for (let C = 0; C < O; C++) {
    const B = E + C * L, Y = B + L, [I, N] = G(B), [nt, H] = C === O - 1 ? [a, l] : G(Y), [R, z] = Q(B), [U, W] = Q(Y);
    j.push([I + q * R, N + q * z, nt - q * U, H - q * W, nt, H]);
  }
  return j;
}
function Ae(t, e, n, s, o) {
  const i = 1 - o;
  return i * i * i * t + 3 * i * i * o * e + 3 * i * o * o * n + o * o * o * s;
}
function sl(t, e, n, s, o) {
  const i = 1 - o;
  return 3 * i * i * (e - t) + 6 * i * o * (n - e) + 3 * o * o * (s - n);
}
function Un(t, e, n, s) {
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
function Ws(t, e, n) {
  const [s, o, i, r, a, l] = n, c = [0];
  let h = t, u = e, f = 0;
  for (let d = 1; d <= nl; d++) {
    const g = d / nl, p = Ae(t, s, i, a, g), m = Ae(e, o, r, l, g);
    f += Math.hypot(p - h, m - u), c.push(f), h = p, u = m;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, o, i, r, a, l],
    startX: t,
    startY: e,
    endX: a,
    endY: l,
    length: f,
    lengths: c
  };
}
function Ln(t) {
  const e = wn.get(t);
  if (e) return e;
  const n = [];
  let s = 0, o = 0, i = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of Rd(t)) {
    const b = p.toUpperCase(), k = p !== b, w = Cd[b];
    if (b === "Z") {
      (s !== i || o !== r) && u(Un(s, o, i, r)), c >= 0 && h.add(c), s = i, o = r, a = l = null;
      continue;
    }
    for (let y = 0; y + w <= m.length; y += w) {
      const S = m.slice(y, y + w), $ = k ? s : 0, v = k ? o : 0;
      let x = null, M = null;
      switch (b) {
        case "M":
          y === 0 ? (s = S[0] + $, o = S[1] + v, i = s, r = o, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(Un(s, o, S[0] + $, S[1] + v)), s = S[0] + $, o = S[1] + v);
          break;
        case "L":
          u(Un(s, o, S[0] + $, S[1] + v)), s = S[0] + $, o = S[1] + v;
          break;
        case "H":
          u(Un(s, o, S[0] + $, o)), s = S[0] + $;
          break;
        case "V":
          u(Un(s, o, s, S[0] + v)), o = S[0] + v;
          break;
        case "C": {
          const T = [S[0] + $, S[1] + v, S[2] + $, S[3] + v, S[4] + $, S[5] + v];
          u(Ws(s, o, T)), x = [T[2], T[3]], s = T[4], o = T[5];
          break;
        }
        case "S": {
          const [T, A] = a ? [2 * s - a[0], 2 * o - a[1]] : [s, o], E = [T, A, S[0] + $, S[1] + v, S[2] + $, S[3] + v];
          u(Ws(s, o, E)), x = [E[2], E[3]], s = E[4], o = E[5];
          break;
        }
        case "Q":
        case "T": {
          let T = s, A = o;
          b === "Q" ? (T = S[0] + $, A = S[1] + v) : l && (T = 2 * s - l[0], A = 2 * o - l[1]);
          const E = b === "Q" ? S[2] + $ : S[0] + $, P = b === "Q" ? S[3] + v : S[1] + v;
          u(
            Ws(s, o, [
              s + 2 / 3 * (T - s),
              o + 2 / 3 * (A - o),
              E + 2 / 3 * (T - E),
              P + 2 / 3 * (A - P),
              E,
              P
            ])
          ), M = [T, A], s = E, o = P;
          break;
        }
        case "A": {
          const T = S[5] + $, A = S[6] + v;
          let E = s, P = o;
          for (const O of Ld(s, o, S[0], S[1], S[2], S[3], S[4], T, A))
            u(Ws(E, P, O)), E = O[4], P = O[5];
          s = T, o = A;
          break;
        }
      }
      a = x, l = M;
    }
  }
  const f = n.reduce((p, m) => p + m.length, 0), d = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let b = p, k = 0;
    for (; b < n.length && n[b].subpath === m; ) k += n[b++].length;
    const w = n[p], y = n[b - 1], S = h.has(m) || Math.abs(y.endX - w.startX) < 1e-9 && Math.abs(y.endY - w.startY) < 1e-9;
    d.push({ start: p, end: b, length: k, closed: S }), p = b;
  }
  const g = { segments: n, totalLength: f, subpaths: d };
  return wn.size >= Od && wn.delete(wn.keys().next().value), wn.set(t, g), g;
}
function Wd(t, e) {
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
function Fd(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, o, i, r, a] = t.points, l = Wd(t, e);
  let c = sl(t.startX, n, o, r, l), h = sl(t.startY, s, i, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), f = Ae(t.startX, n, o, r, u), d = Ae(t.startY, s, i, a, u), g = Ae(t.startX, n, o, r, l), p = Ae(t.startY, s, i, a, l);
    c = l < 0.5 ? f - g : g - f, h = l < 0.5 ? d - p : p - d;
  }
  return {
    x: Ae(t.startX, n, o, r, l),
    y: Ae(t.startY, s, i, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function c0(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let o = 0;
  for (let i = n; i < s; i++) {
    const r = t[i];
    if (o + r.length >= e || i === s - 1)
      return Fd(r, e - o);
    o += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function Nd(t, e) {
  const { segments: n, totalLength: s } = Ln(t);
  return c0(n, Math.max(0, Math.min(1, e)) * s);
}
function KM() {
  wn.clear();
}
function jM(t) {
  return Ln(t).totalLength;
}
const Dd = 24, Bd = 320, zd = 2.5, Gn = 72, XM = 64, qd = 0.2, Yd = 128, is = /* @__PURE__ */ new Map();
let so = 0, Te;
const ol = (t) => Math.round(t * 100) / 100;
function il(t, e) {
  const { segments: n, subpaths: s, totalLength: o } = Ln(t);
  if (n.length === 0) return [];
  if (e) {
    const i = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: o, closed: i }];
  }
  return s.filter((i) => i.length > 0).map((i) => ({ segments: n, start: i.start, end: i.end, length: i.length, closed: i.closed }));
}
function gr(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = c0(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function rl(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function al(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(gr(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function ll(t) {
  let e = 0, n = 0;
  for (const [s, o] of t)
    e += s, n += o;
  return e /= t.length, n /= t.length, t.map(([s, o]) => [s - e, o - n]);
}
function Kd(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % Gn / Gn : 0, reversed: n < 0 };
  const o = ll(al(t, Gn)), i = ll(al(e, Gn)), r = Gn;
  let a = { offset: 0, reversed: !1 }, l = 1 / 0;
  for (const c of [!1, !0]) {
    const h = s ? r : 1;
    for (let u = 0; u < h; u++) {
      let f = 0;
      for (let d = 0; d < r && f < l; d++) {
        const g = s ? c ? (u - d + r) % r : (d + u) % r : c ? r - 1 - d : d, p = o[d][0] - i[g][0], m = o[d][1] - i[g][1];
        f += p * p + m * m;
      }
      f < l && (l = f, a = { offset: s ? u / r : 0, reversed: c });
    }
  }
  return a;
}
function jd(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Xd(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function Ud(t, e, n) {
  const s = t.closed && e.closed, o = Kd(t, e, n.shapeIndex), i = Math.max(
    Dd,
    Math.min(Bd, Math.ceil(Math.max(t.length, e.length) / zd))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= i; u++) a(u / i);
  for (const u of rl(t)) a(u);
  for (const u of rl(e)) a(Xd(u, o, s));
  let l = [...r].sort((u, f) => u - f);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...gr(t, u)), h.push(...gr(e, jd(u, o, s)));
  return Gd({ from: c, to: h, closed: s });
}
function Gd(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = qd;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(cl(t.from, r, a, h), cl(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const o = [], i = [];
  for (let r = 0; r < e; r++)
    n[r] && (o.push(t.from[r * 2], t.from[r * 2 + 1]), i.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: o, to: i, closed: t.closed };
}
function cl(t, e, n, s) {
  const o = t[e * 2], i = t[e * 2 + 1], r = t[n * 2] - o, a = t[n * 2 + 1] - i, l = t[s * 2] - o, c = t[s * 2 + 1] - i, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function Vd(t, e, n) {
  const s = n.shapeIndex;
  if (Te && Te.from === t && Te.to === e && Te.shapeIndex === s) return Te.plan;
  const i = is.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (i)
    return Te = { from: t, to: e, shapeIndex: s, plan: i }, i;
  const r = Ln(t).subpaths.filter((d) => d.length > 0).length === Ln(e).subpaths.filter((d) => d.length > 0).length, a = il(t, !r), l = il(e, !r), c = {
    pairs: a.map((d, g) => Ud(d, l[g], n))
  };
  so >= Yd && (is.clear(), so = 0);
  const h = String(s ?? "auto"), u = is.get(h) ?? /* @__PURE__ */ new Map();
  is.set(h, u);
  const f = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, f), f.set(e, c), so++, Te = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function Jd(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const o = Math.max(0, Math.min(1, n));
  if (o === 0) return t;
  if (o === 1) return e;
  const i = Vd(t, e, s);
  if (i.pairs.length === 0) return o < 0.5 ? t : e;
  let r = "";
  for (const a of i.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = ol(a.from[l] + (a.to[l] - a.from[l]) * o), h = ol(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * o);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function UM() {
  is.clear(), so = 0, Te = void 0;
}
function Ps(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const kn = Math.PI / 180, Zd = 0.9995;
function ia() {
  return [0, 0, 0, 1];
}
function te(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return ia();
  const s = e * kn / 2, o = Math.sin(s) / n;
  return [t[0] * o, t[1] * o, t[2] * o, Math.cos(s)];
}
function Qd(t, e, n) {
  return mr(mr(te([0, 1, 0], e), te([1, 0, 0], t)), te([0, 0, 1], n));
}
function tp(t) {
  const [e, n, s, o] = _e(t), i = 2 * (e * s + n * o), r = 2 * (e * n + s * o), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * o), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * o), u = 1 - 2 * (e * e + n * n), f = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [f / kn, Math.atan2(i, u) / kn, Math.atan2(r, a) / kn] : [f / kn, Math.atan2(-h, c) / kn, 0];
}
function mr(t, e) {
  const [n, s, o, i] = t, [r, a, l, c] = e;
  return [
    i * r + n * c + s * l - o * a,
    i * a - n * l + s * c + o * r,
    i * l + n * a - s * r + o * c,
    i * c - n * r - s * a - o * l
  ];
}
function h0(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function u0(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function _e(t) {
  const e = u0(t);
  return e === 0 ? ia() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function ep(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function f0(t, e, n) {
  const s = _e(t);
  let o = _e(e), i = h0(s, o);
  if (i < 0 && (o = [-o[0], -o[1], -o[2], -o[3]], i = -i), i > Zd)
    return _e([
      s[0] + (o[0] - s[0]) * n,
      s[1] + (o[1] - s[1]) * n,
      s[2] + (o[2] - s[2]) * n,
      s[3] + (o[3] - s[3]) * n
    ]);
  const r = Math.acos(i), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return _e([
    s[0] * l + o[0] * c,
    s[1] * l + o[1] * c,
    s[2] * l + o[2] * c,
    s[3] * l + o[3] * c
  ]);
}
function np(t, e) {
  const [n, s, o, i] = _e(t), r = 2 * (s * e[2] - o * e[1]), a = 2 * (o * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + i * r + (s * l - o * a), e[1] + i * a + (o * r - n * l), e[2] + i * l + (n * a - s * r)];
}
const GM = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: ep,
  dot: h0,
  fromAxisAngle: te,
  fromEuler: Qd,
  identity: ia,
  length: u0,
  multiply: mr,
  normalize: _e,
  rotateVec3: np,
  slerp: f0,
  toEuler: tp
}, Symbol.toStringTag, { value: "Module" })), ke = (t, e, n) => t + (e - t) * n, d0 = 512, Mi = /* @__PURE__ */ new Map(), xi = /* @__PURE__ */ new Map();
function hl(t) {
  const e = Mi.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return Mi.size < d0 && Mi.set(t, s), s;
}
const ul = (t) => t.charCodeAt(0) === 35, fl = (t) => t.startsWith("rgb"), dl = (t) => t.startsWith("rgba"), sp = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Si = (t) => Math.round(t).toString(16).padStart(2, "0");
function op(t, e, n) {
  return `#${Si(t)}${Si(e)}${Si(n)}`;
}
function pl(t) {
  const e = xi.get(t);
  if (e) return e;
  const n = t.match(sp);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), o = parseInt(n[2], 10), i = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, o, i, parseFloat(n[4])] : [s, o, i];
  return xi.size < d0 && xi.set(t, r), r;
}
const ip = (t, e, n) => {
  if (ul(t) && ul(e)) {
    const [s, o, i] = hl(t), [r, a, l] = hl(e), c = ke(s, r, n), h = ke(o, a, n), u = ke(i, l, n);
    return op(c, h, u);
  }
  if ((fl(t) || dl(t)) && (fl(e) || dl(e))) {
    const s = pl(t), o = pl(e), i = Math.round(ke(s[0], o[0], n)), r = Math.round(ke(s[1], o[1], n)), a = Math.round(ke(s[2], o[2], n));
    if (s.length === 4 || o.length === 4) {
      const l = s[3] ?? 1, c = o[3] ?? 1, h = ke(l, c, n);
      return `rgba(${i}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${i}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, rp = (t, e, n) => {
  const s = Math.min(t.length, e.length), o = [];
  for (let i = 0; i < s; i++)
    o.push(ke(t[i], e[i], n));
  return o;
}, ap = (t, e, n) => f0(t, e, n), gl = (t, e, n) => n < 1 ? t : e, lp = (t, e, n) => Jd(t, e, n);
function yo(t, e) {
  return e === "slerp" ? ap : typeof t == "number" ? ke : Array.isArray(t) ? rp : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? ip : Ps(t) ? lp : gl : gl;
}
const p0 = 1e3 / 60;
function g0(t, e = {}) {
  if (!nn(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new jo(t.spring);
  return y0(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function m0(t, e = {}) {
  if (!en(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return y0(
    t,
    (s) => dr(n, s),
    $s(n),
    n.from,
    As(n),
    e
  );
}
function y0(t, e, n, s, o, i) {
  const r = i.intervalMs ?? p0, a = i.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: o, easing: "linear" }) : h.value = o, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? hp(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function b0(t, e, n, s = {}) {
  const o = s.intervalMs ?? p0, i = typeof n == "function" ? n : Ft(n), r = yo(t.value, s.interpolation), a = e.time - t.time;
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
function VM(t, e) {
  return nn(t) ? g0(t, e) : en(t) ? m0(t, e) : t;
}
function cp(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((i) => go(i.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], o = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let i = 1; i < n.length; i++) {
    const r = n[i];
    go(r.easing) ? s.push(...b0(n[i - 1], r, r.easing, o)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function JM(t, e) {
  return t.filter(ud).map((n) => cp(n, e)).concat(
    t.filter(nn).map((n) => g0(n, e)),
    t.filter(en).map((n) => m0(n, e))
  );
}
function hp(t, e) {
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
function yr(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function Be(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function Wn(t, e, n, s) {
  const o = n ?? 0;
  return !s || e <= 1 ? o : o + oa(t, e, s);
}
class oo {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = Be(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - Wn(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const i = Wn(o, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - i);
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
    const n = e[e.length - 1].time, s = this.track.stagger ? Ko(this.targets.length, this.track.stagger) : 0;
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
    const i = o.time - s.time, r = (e - s.time) / i, l = Ft(o.easing)(r);
    return yo(s.value, this.track.interpolation)(s.value, o.value, l);
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
class up {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = Be(e), this.sampler = new jo(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - Wn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = Wn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: this.sampler.valueAt(e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Ko(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class fp {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = Be(e), this.duration = $s(e.inertia);
  }
  getValueAtTime(e) {
    return dr(this.track.inertia, e - Wn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = Wn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: dr(this.track.inertia, e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? Ko(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function w0(t, e) {
  const n = { ...Nd(t.pathData, e) };
  if (t.matrix) {
    const [s, o, i, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + i * h + a, n.y = o * c + r * h + l;
    const u = n.angle * Math.PI / 180, f = Math.cos(u), d = Math.sin(u);
    n.angle = Math.atan2(o * f + r * d, s * f + i * d) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function ZM(t, e, n, s) {
  const o = e + (n - e) * s;
  return w0(t, o);
}
const Ti = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, dp = 20;
function pp(t) {
  const e = Ti[t ?? "upperCase"] ?? t ?? Ti.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(Ti.upperCase);
}
function gp(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function mp(t, e, n = 0) {
  const s = t.from ?? "", o = t.to, i = Math.max(0, Math.min(1, e));
  if (i <= 0) return s;
  if (i >= 1) return o;
  const r = Array.from(s), a = Array.from(o), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const k = Math.round(i * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - k)).join("") + a.slice(Math.max(0, a.length - k)).join("") : a.slice(0, k).join("") + r.slice(k).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (i - c) / (1 - c)), u = Math.floor(h * a.length), f = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * i), d = pp(t.chars), g = t.refreshRate ?? dp, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let b = "";
  for (let k = 0; k < f; k++) {
    const w = l ? k >= f - u : k < u, y = l ? a[a.length - (f - k)] : a[k];
    w && y !== void 0 || y === " " || y === `
` ? b += y : b += d[gp(m, k, p) % d.length];
  }
  return b;
}
class _t {
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
    if (e = fd(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
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
        const h = `${a}\0${r}`, u = c <= e, f = s.get(h);
        (!f || (u !== f.started ? u : u ? c >= f.start : c <= f.start)) && s.set(h, { trackId: o, target: a, property: r, value: l, start: c, started: u });
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
      a.set("text", mp(l.textConfig, i, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof i == "number") {
      const h = w0(c.motionPathConfig, i);
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
        for (const s of Be(n)) {
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
    if (this._tracks.push(e), this._sharedWrites = null, en(e)) {
      this._trackPlayers.set(e.id, new fp(e));
      return;
    }
    if (nn(e)) {
      this._trackPlayers.set(e.id, new up(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (sa(e))
      this._trackPlayers.set(e.id, new oo(e)), this._textTracks.set(e.id, e);
    else if (s0(e)) {
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
      this._trackPlayers.set(e.id, new oo(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new oo(e));
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
    if (nn(s) || en(s))
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
          const a = Be(r).filter((u) => Be(s).includes(u));
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
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !Be(e).includes(n.target)) return !1;
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
      formatVersion: n0(this._tracks),
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
const yp = 100;
function k0(t, e, n, s) {
  const o = [], i = [], { duration: r, alternate: a } = s, l = (d, g, p, m) => {
    i.push([d, g]);
    const b = [];
    t.forEach((k, w) => {
      (p === "forward" ? (m ? k >= d : k > d) && k <= g : (m ? k <= d : k < d) && k >= g) && b.push(w);
    }), b.sort((k, w) => (p === "forward" ? t[k] - t[w] : t[w] - t[k]) || k - w);
    for (const k of b) o.push({ kind: "event", index: k, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const f = Math.min(yp, Math.max(0, n.iteration - e.iteration));
  for (let d = 0; d < f; d++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), o.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return f > 0 && s.holding && !a ? { crossings: o, passes: i } : (l(c, n.time, h, u), { crossings: o, passes: i });
}
function bp(t) {
  return en(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: v0(t.inertia),
    ...ue(t)
  } : nn(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...ue(t)
  } : sa(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(Ei),
    ...ue(t)
  } : s0(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(Ei),
    ...ue(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(Ei),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...ue(t)
  };
}
function v0(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function Ei(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function ue(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function wp(t) {
  if (en(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: v0(e.inertia),
      ...ue(e)
    };
  }
  if (nn(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...ue(e)
    };
  }
  if (sa(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...ue(e)
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
      ...ue(e)
    };
  }
  return yr({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...ue(t)
  });
}
function kp(t) {
  const e = t._config.markers;
  return {
    formatVersion: n0(t.tracks),
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
    tracks: t.tracks.map(bp),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function gs(t) {
  const e = t.formatVersion ?? 1;
  if (e > tl)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${tl}. Update tinyfly to play it.`
    );
  return new _t({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(wp),
    captions: t.captions
  });
}
function QM(t) {
  return JSON.stringify(kp(t));
}
function tx(t) {
  const e = JSON.parse(t);
  return gs(e);
}
function ne(t) {
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
function M0(t, e, n) {
  return e + t.next() * (n - e);
}
function vp(t, e, n, s) {
  if (s <= 0) return M0(t, e, n);
  const o = Math.floor((n - e) / s), i = Math.round(t.next() * o);
  return e + i * s;
}
function ex(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const x0 = /^([+\-*/])=\s*(-?[\d.]+)$/, S0 = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function nx(t) {
  return typeof t != "string" ? !1 : x0.test(t.trim()) || S0.test(t.trim());
}
function T0(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = x0.exec(n);
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
  const o = S0.exec(n);
  if (o) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const i = Number.parseFloat(o[1]), r = Number.parseFloat(o[2]), a = o[3] !== void 0 ? Number.parseFloat(o[3]) : void 0;
    return a !== void 0 ? vp(e.random, i, r, a) : M0(e.random, i, r);
  }
  return t;
}
function Mp(t, e = 0, n) {
  const s = [];
  let o = e;
  for (const i of t) {
    const r = T0(i, { base: o, random: n });
    s.push(r), typeof r == "number" && (o = r);
  }
  return s;
}
class sx {
  random;
  constructor(e) {
    this.random = rn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return T0(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return Mp(e, n, this.random);
  }
}
const xp = 600;
function Sp(t) {
  if (Array.isArray(t)) {
    const [f, d, g, p] = t;
    return { fn: ml(f, d, g, p), bezier: [f, d, g, p] };
  }
  const { segments: e } = Ln(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, o = e[e.length - 1], i = o.endX - n, r = o.endY - s;
  if (i === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (f) => (f - n) / i, l = (f) => (f - s) / r;
  if (e.length === 1 && o.type === "C") {
    const [f, d, g, p] = o.points, m = [a(f), l(d), a(g), l(p)];
    return { fn: ml(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(xp / e.length));
  for (const f of e)
    for (let d = c.length === 0 ? 0 : 1; d <= u; d++) {
      const [g, p] = Ap(f, d / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: $p(c, h) };
}
function Tp(t = {}) {
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
function Ep(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (o) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * o) : (1 - o) ** 2;
  return (o) => o <= 0 || o >= 1 ? 0 : Math.sin(o * e * Math.PI * 2) * s(o);
}
function Ap(t, e) {
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
function $p(t, e) {
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
function ml(t, e, n, s) {
  const o = (r, a, l) => 3 * (1 - r) * (1 - r) * r * a + 3 * (1 - r) * r * r * l + r * r * r, i = (r, a, l) => 3 * (1 - r) * (1 - r) * a + 6 * (1 - r) * r * (l - a) + 3 * r * r * (1 - l);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let a = r;
    for (let h = 0; h < 8; h++) {
      const u = o(a, t, n) - r, f = i(a, t, n);
      if (Math.abs(u) < 1e-6) return o(a, e, s);
      if (Math.abs(f) < 1e-6) break;
      a -= u / f;
    }
    let l = 0, c = 1;
    a = r;
    for (let h = 0; h < 40; h++)
      o(a, t, n) < r ? l = a : c = a, a = (l + c) / 2;
    return o(a, e, s);
  };
}
const Pp = 350, Ip = 300, Op = 550;
function ox(t, e = {}) {
  const n = e.lead ?? Pp, s = e.gap ?? Ip, o = e.tail ?? Op, i = [];
  let r = 0;
  return t.forEach((a, l) => {
    const c = [];
    let h = r + n;
    a.lines.forEach((f, d) => {
      if (!(f.duration >= 0))
        throw new Error(`narration: scene ${l} line ${d} has an invalid duration (${f.duration})`);
      d > 0 && (h += s), c.push({
        id: f.id ?? `s${l}-l${d}`,
        scene: l,
        line: d,
        start: h,
        end: h + f.duration,
        text: f.text
      }), h += f.duration;
    });
    const u = h + o + (a.tail ?? 0);
    i.push({ id: a.id ?? `s${l}`, start: r, duration: u - r, cues: c }), r = u;
  }), { duration: r, scenes: i, cues: i.flatMap((a) => a.cues) };
}
function ix(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function rx(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const Go = (t) => 6e4 / t.bpm;
function ra(t, e) {
  return t.offset + e * Go(t);
}
function Vo(t, e) {
  return (e - t.offset) / Go(t);
}
function ax(t, e) {
  return ra(t, Math.round(Vo(t, e)));
}
function lx(t, e) {
  return ra(t, Math.ceil(Vo(t, e) - 1e-9));
}
function cx(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), o = [];
  if (!(t.bpm > 0) || n < e) return o;
  for (let i = Math.ceil(Vo(t, e) - 1e-9); ; i++) {
    const r = ra(t, i);
    if (r > n + 1e-9) break;
    o.push({ time: r, bar: (i % s + s) % s === 0, n: i });
  }
  return o;
}
const un = 100;
function hx(t, e, n = {}) {
  const s = n.minBpm ?? 70, o = n.maxBpm ?? 180, i = Math.max(1, Math.round(e / un)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / i);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let M = 0; M < a; M++) {
    let T = 0;
    for (let A = M * i; A < (M + 1) * i; A++) T += t[A] * t[A];
    l[M] = Math.log(1e-6 + T / i);
  }
  const c = new Float64Array(a);
  for (let M = 1; M < a; M++) c[M] = Math.max(0, l[M] - l[M - 1]);
  const h = c.reduce((M, T) => M + T, 0) / a;
  for (let M = 0; M < a; M++) c[M] = Math.max(0, c[M] - h);
  const u = Math.max(1, Math.floor(60 * un / o)), f = Math.min(a - 1, Math.ceil(60 * un / s)), d = (M) => {
    let T = 0;
    for (let A = M; A < a; A++) T += c[A] * c[A - M];
    return T / (a - M);
  };
  let g = 0;
  for (let M = 0; M < a; M++) g += c[M] * c[M];
  g /= a;
  let p = u, m = -1 / 0;
  for (let M = u; M <= f; M++) {
    const T = 60 * un / M, A = Math.exp(-0.5 * (Math.log2(T / 120) / 0.9) ** 2), E = d(M) * A;
    E > m && (m = E, p = M);
  }
  const b = (M) => {
    const T = Math.floor(M);
    return T < 0 || T + 1 >= a ? 0 : c[T] + (c[T + 1] - c[T]) * (M - T);
  }, k = (M, T) => {
    let A = 0;
    for (let E = T; E < a; E += M) A += b(E);
    return A;
  };
  let w = p, y = 0, S = -1 / 0;
  for (let M = p - 0.6; M <= p + 0.6 + 1e-9; M += 0.02) {
    if (M < 1) continue;
    const T = Math.max(1, Math.round(M * 4));
    for (let A = 0; A < T; A++) {
      const E = A / T * M, P = k(M, E);
      P > S && (S = P, y = E, w = M);
    }
  }
  const $ = 60 * un / w, v = g > 0 ? Math.max(0, Math.min(1, d(p) / g)) : 0, x = (y + 0.5) * 1e3 / un;
  return { bpm: Math.round($ * 100) / 100, offset: Math.round(x % (6e4 / $)), confidence: v };
}
const _p = 600, Hp = 250, yl = 1;
function ux(t, e) {
  const n = e.target ?? "Camera", s = { x: e.stage.width / 2, y: e.stage.height / 2 }, o = {}, i = (u, f, d, g) => {
    const p = o[u] ??= [];
    for (; p.length > 0 && p[p.length - 1].time >= f; ) p.pop();
    p.push({ time: f, value: d, ...g ? { easing: g } : {} });
  }, r = (u) => {
    const f = u.rotate * Math.PI / 180, d = (u.focusX - s.x) * u.scale, g = (u.focusY - s.y) * u.scale;
    return {
      x: -(d * Math.cos(f) - g * Math.sin(f)),
      y: -(d * Math.sin(f) + g * Math.cos(f)),
      scale: u.scale,
      rotate: u.rotate
    };
  }, a = (u, f, d) => {
    const g = r(f);
    for (const p of ["x", "y", "scale", "rotate"]) i(p, u, g[p], d);
  };
  let l = { focusX: s.x, focusY: s.y, scale: 1, rotate: 0 };
  const c = [...t].sort((u, f) => u.at - f.at), h = c.filter((u) => !("shake" in u));
  h.length > 0 && a(0, l);
  for (const u of h)
    if ("frame" in u) {
      const f = Math.max(yl, u.duration ?? _p);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + f, l, u.easing ?? (f > yl ? "ease-in-out" : void 0));
    } else {
      const { follow: f } = u, d = f.lag ?? Hp, g = new _t({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: f.x }] }), p = (k) => g.getStateAtTime(k).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...f.x.map((k) => k.time).filter((k) => k > u.at && k < u.until), u.until];
      a(u.at, l);
      const b = (k) => ({
        focusX: p(k) + (f.lead ?? 0),
        focusY: f.y ?? l.focusY,
        scale: f.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const k of m) {
        const w = f.x.find((y) => y.time === k)?.easing;
        a(k + d, b(k), k === u.at ? "ease-in-out" : w);
      }
      l = b(u.until);
    }
  for (const u of c.filter((f) => "shake" in f)) {
    const f = u.shake.strength ?? 12, d = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = rn(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at, 0);
    for (let b = u.at + g; b < u.at + u.duration; b += g) {
      const k = 1 - (b - u.at) / u.duration;
      i("shakeX", b, m() * f * k), i("shakeY", b, m() * f * k), i("shakeRotate", b, m() * d * k);
    }
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(o).map(([u, f]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: f }));
}
function Cp(t, e) {
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
function bo(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let o, i = 1 / 0;
  for (const r of e) {
    const a = Cp(t, r);
    a < i && (i = a, o = r);
  }
  return o !== void 0 && i <= Math.max(2, Math.floor(t.length / 3)) ? o : void 0;
}
function ft(t, e, n, s) {
  const o = typeof e == "string" ? s ?? bo(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${o ? `: did you mean "${o}"?` : "."} Known: ${n.join(", ")}`;
}
function io(t, e) {
  const n = e.step ?? 33, s = e.stiffness ?? 120, o = e.damping ?? 9, i = e.mass ?? 1;
  let r = t(e.start), a = 0;
  const l = [{ time: e.start, value: r }];
  let c = e.start + n;
  for (let h = e.start + 1; h <= e.end; h++) {
    const f = s * (t(h) - r) - o * a;
    a += f / i * 1e-3, r += a * 1e-3, (h >= c || h === e.end) && (l.push({ time: h, value: r }), c += n);
  }
  return l;
}
function Fn(t, e, n = 1) {
  if (!(e > 0)) return 0;
  const s = t * n / e;
  return s - Math.floor(s);
}
function E0(t) {
  const e = t - Math.floor(t);
  return 1 - Math.abs(e * 2 - 1);
}
function fx(t, e) {
  const n = Math.max(1, Math.round(e.cycles ?? 1)), s = e.amplitude ?? 1, o = Fn(t, e.period, n) + (e.phase ?? 0), i = o - Math.floor(o);
  switch (e.shape ?? "sine") {
    case "triangle":
      return s * (E0(i + 0.25) * 2 - 1);
    case "square":
      return i < 0.5 ? s : -s;
    default:
      return s * Math.sin(i * Math.PI * 2);
  }
}
function dx(t, e) {
  const n = Math.max(1, Math.round(e.cycles ?? 1)), s = typeof e.easing == "function" ? e.easing : Ft(e.easing ?? "ease-in-out"), o = Fn(t, e.period, n) + (e.phase ?? 0);
  return s(E0(o));
}
function px(t, e) {
  const n = A0(e.seed), s = Math.max(1, Math.round(e.cycles ?? 1)), o = (Fn(t, e.period, 1) + (e.phase ?? 0)) * Math.PI * 2, i = s / Math.PI;
  return $0([Math.cos(o) * i + 7.31, Math.sin(o) * i + 3.17], n, e.octaves ?? 1);
}
function gx(t, e, n) {
  const s = A0(n.seed), o = Math.max(1, Math.round(n.cycles ?? 1)), i = Math.max(1, Math.round(n.cyclesAlong ?? 1)), r = Fn(t, n.period, 1) * Math.PI * 2, a = Fn(e, n.periodAlong, 1) * Math.PI * 2, l = o / Math.PI, c = i / Math.PI;
  return $0([Math.cos(r) * l + 5.13, Math.sin(r) * l + 9.47, Math.cos(a) * c + 2.71, Math.sin(a) * c + 6.29], s, n.octaves ?? 1);
}
const A0 = (t) => typeof t == "string" ? ne(t) : (t ?? 0) >>> 0;
function $0(t, e, n) {
  const s = Math.max(1, Math.min(6, Math.round(n)));
  let o = 0, i = 1, r = 0;
  for (let a = 0; a < s; a++) {
    const l = 2 ** a;
    o += i * Rp(t.map((c) => c * l), e + a * 1013), r += i, i *= 0.5;
  }
  return o / r;
}
function Rp(t, e) {
  const n = t.length, s = t.map(Math.floor), i = t.map((a, l) => a - s[l]).map((a) => a * a * (3 - 2 * a));
  let r = 0;
  for (let a = 0; a < 1 << n; a++) {
    let l = 1;
    const c = [];
    for (let h = 0; h < n; h++) {
      const u = a >> h & 1;
      l *= u ? i[h] : 1 - i[h], c.push(s[h] + u);
    }
    l !== 0 && (r += l * Lp(c, e));
  }
  return r;
}
function Lp(t, e) {
  let n = (e ^ 2654435769) >>> 0;
  for (const s of t)
    n = Math.imul(n ^ (s | 0), 2246822507) >>> 0, n = (n ^ n >>> 13) >>> 0, n = Math.imul(n, 3266489909) >>> 0, n = (n ^ n >>> 16) >>> 0;
  return n / 4294967296 * 2 - 1;
}
function mx(t, e = {}) {
  if (t.length === 0) throw new Error("curve: needs at least one key");
  const s = { id: "curve", target: "curve", property: "value", keyframes: t.map((i) => ({ time: i.at, value: i.value, easing: i.easing })).sort((i, r) => i.time - r.time), interpolation: e.interpolation }, o = new oo(s);
  return (i) => o.getValueAtTime(i);
}
function yx(t, e) {
  return e * Go({ bpm: t.bpm });
}
function bx(t, e) {
  const n = Math.max(1, Math.round(t / Go(e)));
  return { beats: n, grid: { ...e, bpm: n * 6e4 / t } };
}
function wx(t, e, n = {}) {
  const s = Math.max(1e-6, n.attack ?? 0.05), o = Math.max(1e-6, n.decay ?? 0.4), i = Vo(e, t), r = i - Math.floor(i), a = r < s ? r / s : Math.max(0, 1 - (r - s) / o), l = n.barAccent ?? 0;
  if (l <= 0) return a;
  const c = Math.max(1, Math.round(e.beatsPerBar ?? 4)), u = (Math.floor(i) % c + c) % c === 0;
  return a * (u ? 1 + l : 1) / (1 + l);
}
function kx(t, e, n = {}) {
  const s = n.fps ?? 30, o = Math.max(1, Math.round(e / s)), i = Math.max(1, Math.ceil(t.length / o)), r = new Float32Array(i), a = Math.min(0.99, Math.max(0, n.smoothing ?? 0.5));
  let l = 0, c = 0;
  for (let h = 0; h < i; h++) {
    let u = 0;
    const f = h * o, d = Math.min(t.length, f + o);
    for (let p = f; p < d; p++) u += t[p] * t[p];
    const g = d > f ? Math.sqrt(u / (d - f)) : 0;
    l = g > l ? g : l * a + g * (1 - a), r[h] = l, c = Math.max(c, l);
  }
  if (n.normalize !== !1 && c > 0) for (let h = 0; h < i; h++) r[h] /= c;
  return r;
}
function vx(t, e, n = 30, s) {
  if (t.length === 0) return 0;
  const i = (s ? Fn(e, s) * s : e) * n / 1e3, r = Math.floor(i), a = t[Math.min(t.length - 1, Math.max(0, r))], l = t[Math.min(t.length - 1, Math.max(0, r + 1))];
  return a + (l - a) * (i - r);
}
const Wp = {
  "16:9": 16 / 9,
  "2.39:1": 2.39,
  "4:3": 4 / 3,
  "1:1": 1,
  "9:16": 9 / 16,
  "4:5": 4 / 5
}, P0 = (t) => typeof t == "number" ? t : Wp[t];
function Mx(t, e) {
  const n = P0(e), s = t.width / t.height;
  if (n >= s) {
    const i = t.width / n;
    return { x: 0, y: (t.height - i) / 2, width: t.width, height: i };
  }
  const o = t.height * n;
  return { x: (t.width - o) / 2, y: 0, width: o, height: t.height };
}
function xx(t, e) {
  const n = P0(t), s = (o) => Math.max(2, Math.round(o / 2) * 2);
  return "width" in e ? { width: s(e.width), height: s(e.width / n) } : { width: s(e.height * n), height: s(e.height) };
}
function Sx(t, e = {}) {
  const n = (s) => ({
    x: t.x + t.width * (1 - s) / 2,
    y: t.y + t.height * (1 - s) / 2,
    width: t.width * s,
    height: t.height * s
  });
  return { action: n(e.action ?? 0.9), title: n(e.title ?? 0.8) };
}
const le = (t) => Math.round(t * 1e3) / 1e3;
function Fp(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, o = t.length;
  let i = `M${le(t[0].x)} ${le(t[0].y)}`;
  if (o === 1) return i;
  const r = (l) => s ? t[(l % o + o) % o] : t[Math.max(0, Math.min(o - 1, l))], a = s ? o : o - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), f = r(l + 2);
    if (n === 0) {
      i += ` L${le(u.x)} ${le(u.y)}`;
      continue;
    }
    const d = n / 6, g = h.x + (u.x - c.x) * d, p = h.y + (u.y - c.y) * d, m = u.x - (f.x - h.x) * d, b = u.y - (f.y - h.y) * d;
    i += ` C${le(g)} ${le(p)} ${le(m)} ${le(b)} ${le(u.x)} ${le(u.y)}`;
  }
  return s ? `${i} Z` : i;
}
const Ct = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function Np(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function aa(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = Ct(e.cx), s = Ct(e.cy), o = t.tag.toLowerCase() === "circle" ? Ct(e.r) : Ct(e.rx), i = t.tag.toLowerCase() === "circle" ? Ct(e.r) : Ct(e.ry);
      return `M${n + o} ${s} A${o} ${i} 0 1 1 ${n - o} ${s} A${o} ${i} 0 1 1 ${n + o} ${s} Z`;
    }
    case "rect": {
      const n = Ct(e.x), s = Ct(e.y), o = Ct(e.width), i = Ct(e.height);
      let r = e.rx != null ? Ct(e.rx) : e.ry != null ? Ct(e.ry) : 0, a = e.ry != null ? Ct(e.ry) : r;
      return r = Math.min(r, o / 2), a = Math.min(a, i / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + o} V${s + i} H${n} Z` : `M${n + r} ${s} H${n + o - r} A${r} ${a} 0 0 1 ${n + o} ${s + a} V${s + i - a} A${r} ${a} 0 0 1 ${n + o - r} ${s + i} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + i - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${Ct(e.x1)} ${Ct(e.y1)} L${Ct(e.x2)} ${Ct(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = Np(e.points);
      if (n.length === 0) return null;
      const s = n.map((o, i) => `${i === 0 ? "M" : "L"}${o.x} ${o.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function Tx(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), o = Math.max(0, n.length), i = n.since !== void 0 ? Math.max(e - o, n.since) : e - o;
  if (i >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = i + (e - i) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: o > 0 ? (e - c) / o : 0 });
  }
  return a;
}
const Dp = 2.5;
function Bp(t) {
  const e = [], n = [], s = t.length, o = (i, r) => {
    for (let a = i + r; a >= 0 && a < s; a += r) {
      const l = (t[a].x - t[i].x) * r, c = (t[a].y - t[i].y) * r, h = Math.hypot(l, c);
      if (h > 1e-9) return [l / h, c / h];
    }
    return null;
  };
  for (let i = 0; i < s; i++) {
    const r = t[i], a = o(i, -1), l = o(i, 1), c = a ?? l ?? [1, 0], h = l ?? a ?? [1, 0];
    let u = c[0] + h[0], f = c[1] + h[1];
    const d = Math.hypot(u, f);
    d < 1e-9 ? (u = c[0], f = c[1]) : (u /= d, f /= d);
    const g = u * c[0] + f * c[1], p = Math.min(Dp, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - f * m, y: r.y + u * m }), n.push({ x: r.x + f * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function zp(t) {
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
const Ex = { scale: 1, turn: 0, x: 0, y: 0 };
function Ax(t = {}) {
  return { scale: t.scale ?? 1, turn: t.turn ?? 0, x: t.x ?? 0, y: t.y ?? 0 };
}
function qp(t, e, n) {
  const { ax: s, ay: o } = Jo(t, e);
  return { scale: t, turn: e, x: n.x - (s * n.x - o * n.y), y: n.y - (o * n.x + s * n.y) };
}
function I0(t, e) {
  const { ax: n, ay: s } = Jo(t.scale, t.turn);
  return { x: n * e.x - s * e.y + t.x, y: s * e.x + n * e.y + t.y };
}
function $x(t, e) {
  const n = I0(e, { x: t.x, y: t.y });
  return { scale: t.scale * e.scale, turn: t.turn + e.turn, x: n.x, y: n.y };
}
function Px(t) {
  if (t.scale === 0) throw new Error("invertSimilarity: a scale of 0 cannot be undone");
  const e = { scale: 1 / t.scale, turn: -t.turn, x: 0, y: 0 }, n = I0(e, { x: t.x, y: t.y });
  return { ...e, x: -n.x, y: -n.y };
}
function Yp(t) {
  const { ax: e, ay: n } = Jo(t.scale, t.turn), s = 1 - e, o = -n, i = s * s + o * o;
  return i < 1e-18 ? null : { x: (t.x * s + t.y * o) / i, y: (t.y * s - t.x * o) / i };
}
function Ix(t, e) {
  if (t.scale <= 0) throw new Error("powSimilarity: the scale must be positive");
  const n = Math.pow(t.scale, e), s = t.turn * e, o = Yp(t);
  return o ? qp(n, s, o) : { scale: n, turn: s, x: t.x * e, y: t.y * e };
}
function Ox(t) {
  const { ax: e, ay: n } = Jo(t.scale, t.turn);
  return [e, n, -n, e, t.x, t.y];
}
const Jo = (t, e) => {
  const n = e * Math.PI / 180;
  return { ax: t * Math.cos(n), ay: t * Math.sin(n) };
};
function la([t, e, n], s = {}) {
  const o = s.scale ?? 1, i = s.centre ?? { x: 0, y: 0 }, r = Math.sqrt(3) / 2;
  return { x: i.x + (t - e) * r * o, y: i.y + ((t + e) * 0.5 - n) * o };
}
const O0 = ([t, e, n]) => t + e + n;
function _0(t, e = {}) {
  const [n, s, o] = t.min, [i, r, a] = t.max, l = (f) => la(f, e), c = [(n + i) / 2, (s + r) / 2, (o + a) / 2], h = O0(c), u = [
    { side: "top", depth: h, tag: t.tag, points: [l([n, s, a]), l([i, s, a]), l([i, r, a]), l([n, r, a])] },
    { side: "left", depth: h, tag: t.tag, points: [l([n, r, o]), l([i, r, o]), l([i, r, a]), l([n, r, a])] },
    { side: "right", depth: h, tag: t.tag, points: [l([i, s, o]), l([i, r, o]), l([i, r, a]), l([i, s, a])] }
  ];
  return t.hide ? u.filter((f) => !t.hide.includes(f.side)) : u;
}
function H0(t, e = {}) {
  return t.map((n) => ({ box: n, depth: O0([(n.min[0] + n.max[0]) / 2, (n.min[1] + n.max[1]) / 2, (n.min[2] + n.max[2]) / 2]) })).sort((n, s) => n.depth - s.depth).flatMap(({ box: n }) => _0(n, e));
}
function _x(t = {}) {
  const e = t.size ?? 10, s = (t.thickness ?? 2) / 2, o = [
    { tag: 0, min: [-s, -s, -s], max: [e - s, s, s] },
    { tag: 1, min: [e - s, -s, -s], max: [e + s, e - s, s] },
    { tag: 2, min: [e - s, e - s, -s], max: [e + s, e + s, e] }
  ], i = t.centre ?? { x: 0, y: 0 }, r = la([2 * e / 3, e / 3, e / 3], { scale: t.scale }), a = { centre: { x: i.x - r.x, y: i.y - r.y }, scale: t.scale };
  return { boxes: o, faces: [...H0(o, a), ..._0({ ...o[0], hide: ["right"] }, a)] };
}
function Hx(t = {}) {
  const e = Math.max(2, Math.round(t.steps ?? 8)), n = t.tread ?? 1.5, s = t.rise ?? 0.25, o = t.width ?? 3, i = t.base ?? 1.5, r = Math.max(1, Math.round(e * (n - 2 * s) / (n + 2 * s))), a = 2 * (e + r), l = n * (e - r) / a, c = [
    { dir: [1, 0, 0], across: [0, 1, 0], count: e },
    { dir: [0, 1, 0], across: [-1, 0, 0], count: e },
    { dir: [-1, 0, 0], across: [0, -1, 0], count: r },
    { dir: [0, -1, 0], across: [1, 0, 0], count: r }
  ], h = [];
  let u = [0, 0, 0], f = 0;
  for (const b of c) {
    for (let k = 0; k < b.count; k++) {
      const w = f * l, y = [u[0] + b.dir[0] * k * n, u[1] + b.dir[1] * k * n, 0], S = [y[0] + b.dir[0] * n + b.across[0] * o, y[1] + b.dir[1] * n + b.across[1] * o, 0];
      h.push({
        tag: f,
        min: [Math.min(y[0], S[0]), Math.min(y[1], S[1]), 0],
        max: [Math.max(y[0], S[0]), Math.max(y[1], S[1]), w + i]
      }), f++;
    }
    u = [u[0] + b.dir[0] * b.count * n, u[1] + b.dir[1] * b.count * n, 0];
  }
  const d = a * l, g = t.centre ?? { x: 0, y: 0 }, p = la([e * n / 2, e * n / 2, d / 2 + i], { scale: t.scale }), m = { centre: { x: g.x - p.x, y: g.y - p.y }, scale: t.scale };
  return { boxes: h, faces: H0(h, m), rise: l };
}
function Kp(t, e, n) {
  let s = 0;
  for (const o of t) {
    const i = (e - o.x) ** 2 + (n - o.y) ** 2;
    s += i > 1e-9 ? o.r * o.r / i : 1e9;
  }
  return s;
}
function Cx(t, e = {}) {
  if (t.length === 0) return [];
  const n = e.threshold ?? 1, s = Math.max(0.5, e.cell ?? 4), o = Math.sqrt(1 / n) * 1.6, i = e.bounds ?? {
    x: Math.min(...t.map((d) => d.x - d.r * o)),
    y: Math.min(...t.map((d) => d.y - d.r * o)),
    width: Math.max(...t.map((d) => d.x + d.r * o)) - Math.min(...t.map((d) => d.x - d.r * o)),
    height: Math.max(...t.map((d) => d.y + d.r * o)) - Math.min(...t.map((d) => d.y - d.r * o))
  }, r = Math.max(2, Math.ceil(i.width / s) + 1), a = Math.max(2, Math.ceil(i.height / s) + 1), l = new Float64Array(r * a);
  for (let d = 0; d < a; d++) for (let g = 0; g < r; g++) l[d * r + g] = Kp(t, i.x + g * s, i.y + d * s) - n;
  const c = (d, g) => l[g * r + d], h = (d, g, p, m, b, k) => {
    const w = p === k ? 0.5 : p / (p - k);
    return { x: d + (m - d) * w, y: g + (b - g) * w };
  }, u = [];
  for (let d = 0; d + 1 < a; d++)
    for (let g = 0; g + 1 < r; g++) {
      const p = i.x + g * s, m = i.y + d * s, b = p + s, k = m + s, w = [c(g, d), c(g + 1, d), c(g + 1, d + 1), c(g, d + 1)], y = (w[0] > 0 ? 1 : 0) | (w[1] > 0 ? 2 : 0) | (w[2] > 0 ? 4 : 0) | (w[3] > 0 ? 8 : 0);
      if (y === 0 || y === 15) continue;
      const S = () => h(p, m, w[0], b, m, w[1]), $ = () => h(b, m, w[1], b, k, w[2]), v = () => h(p, k, w[3], b, k, w[2]), x = () => h(p, m, w[0], p, k, w[3]), M = (w[0] + w[1] + w[2] + w[3]) / 4 > 0;
      switch (y) {
        case 1:
        case 14:
          u.push([x(), S()]);
          break;
        case 2:
        case 13:
          u.push([S(), $()]);
          break;
        case 3:
        case 12:
          u.push([x(), $()]);
          break;
        case 4:
        case 11:
          u.push([$(), v()]);
          break;
        case 6:
        case 9:
          u.push([S(), v()]);
          break;
        case 7:
        case 8:
          u.push([x(), v()]);
          break;
        case 5:
          M ? u.push([x(), v()], [S(), $()]) : u.push([x(), S()], [$(), v()]);
          break;
        case 10:
          M ? u.push([x(), S()], [$(), v()]) : u.push([x(), v()], [S(), $()]);
          break;
      }
    }
  const f = jp(u);
  return e.smooth === !1 ? f : f.map((d) => bl(bl(d)));
}
function jp(t) {
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
function bl(t) {
  const e = [];
  for (let n = 0; n < t.length; n++) {
    const s = t[n], o = t[(n + 1) % t.length];
    e.push({ x: s.x * 0.75 + o.x * 0.25, y: s.y * 0.75 + o.y * 0.25 }, { x: s.x * 0.25 + o.x * 0.75, y: s.y * 0.25 + o.y * 0.75 });
  }
  return e;
}
function Rx(t) {
  const e = Math.min(1, Math.max(0, t.progress));
  if (e <= 0) return [];
  const n = t.width / 2, s = n * (0.55 + 0.75 * e), o = Math.max(t.length * e, s * 1.2), i = t.x, r = t.y + o - s, a = Math.max(0.1, n * (0.35 - 0.3 * e)), l = r - Math.sqrt(Math.max(0, s * s - a * a)), c = Math.max(0, l - t.y), h = 8, u = [], f = [];
  for (let k = 0; k <= h; k++) {
    const w = k / h, y = a + (n - a) * Math.pow(1 - w, 1.6 + 1.4 * e);
    u.push({ x: i - y, y: t.y + c * w }), f.push({ x: i + y, y: t.y + c * w });
  }
  const d = Math.max(8, Math.round(t.segments ?? 12)), g = Math.acos(Math.min(1, a / s)), p = -g, m = Math.PI + g, b = [];
  for (let k = 1; k < d; k++) {
    const w = p + (m - p) * k / d;
    b.push({ x: i + Math.cos(w) * s, y: r + Math.sin(w) * s });
  }
  return [...f, ...b, ...u.reverse()];
}
function Lx(t) {
  const e = Math.min(1, Math.max(0, t.grow ?? 1)), n = e >= 1 ? 1 : 1 - Math.pow(1 - e, 3) + 0.08 * Math.sin(e * Math.PI) * e, s = t.r * Math.max(0, n);
  if (s <= 0) return [];
  const o = Math.max(12, Math.round(t.segments ?? 48)), i = t.wobble ?? 0.05, r = t.time ?? 0, a = t.period ? r / t.period : r / 2500, l = (a - Math.floor(a)) * Math.PI * 2, c = t.seed ?? 0, h = [];
  for (let u = 0; u < o; u++) {
    const f = u / o * Math.PI * 2, d = 1 + i * (Math.sin(2 * f + l + c) * 0.6 + Math.sin(3 * f - 2 * l + c * 1.7) * 0.4);
    h.push({ x: t.x + Math.cos(f) * s * d, y: t.y + Math.sin(f) * s * d });
  }
  return h;
}
function Wx(t) {
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
function Fx(t, e = {}) {
  const n = Math.max(0.05, 1 + t);
  return { sx: e.keep === "volume" ? 1 / Math.sqrt(n) : 1 / n, sy: n };
}
function Nx(t, e, n = { x: 0, y: 0 }) {
  return t.map((s) => ({ x: n.x + (s.x - n.x) * e.sx, y: n.y + (s.y - n.y) * e.sy }));
}
function ro(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function jn(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function On(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function Ce(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function wo(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Zo(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function ca(t, e) {
  return Zo(jn(t, e));
}
function sn(t) {
  const e = Zo(t);
  return e === 0 ? [0, 0, 0] : On(t, 1 / e);
}
function C0(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const Dx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: ro,
  cross: wo,
  distance: ca,
  dot: Ce,
  length: Zo,
  lerp: C0,
  normalize: sn,
  scale: On,
  subtract: jn
}, Symbol.toStringTag, { value: "Module" })), Xp = Math.PI / 180;
function Qo() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function Pt(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let o = 0; o < 4; o++) {
      let i = 0;
      for (let r = 0; r < 4; r++) i += t[r * 4 + o] * e[s * 4 + r];
      n[s * 4 + o] = i;
    }
  return n;
}
function ze(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function Ge(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function re(t) {
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
function ha(t, e, n) {
  const s = re(e);
  for (let o = 0; o < 3; o++)
    s[o] *= n[0], s[4 + o] *= n[1], s[8 + o] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function Up(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function ua(t) {
  const [e, n, s, o, i, r, a, l, c, h, u, f, d, g, p, m] = t, b = e * r - n * i, k = e * a - s * i, w = e * l - o * i, y = n * a - s * r, S = n * l - o * r, $ = s * l - o * a, v = c * g - h * d, x = c * p - u * d, M = c * m - f * d, T = h * p - u * g, A = h * m - f * g, E = u * m - f * p, P = b * E - k * A + w * T + y * M - S * x + $ * v;
  if (Math.abs(P) < 1e-12) return null;
  const O = 1 / P;
  return [
    (r * E - a * A + l * T) * O,
    (s * A - n * E - o * T) * O,
    (g * $ - p * S + m * y) * O,
    (u * S - h * $ - f * y) * O,
    (a * M - i * E - l * x) * O,
    (e * E - s * M + o * x) * O,
    (p * w - d * $ - m * k) * O,
    (c * $ - u * w + f * k) * O,
    (i * A - r * M + l * v) * O,
    (n * M - e * A - o * v) * O,
    (d * S - g * w + m * b) * O,
    (h * w - c * S - f * b) * O,
    (r * x - i * T - a * v) * O,
    (e * T - n * x + s * v) * O,
    (g * k - d * y - p * b) * O,
    (c * y - h * k + u * b) * O
  ];
}
function Gp(t, e, n, s) {
  const o = 1 / Math.tan(t * Xp / 2), i = 1 / (n - s);
  return [o / e, 0, 0, 0, 0, o, 0, 0, 0, 0, (s + n) * i, -1, 0, 0, 2 * s * n * i, 0];
}
function Vp(t, e, n, s, o, i) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (i - o);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(i + o) * l, 1];
}
function Jp(t, e, n = [0, 1, 0]) {
  const s = sn(jn(t, e)), o = sn(wo(n, s)), i = wo(s, o);
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
    -Ce(o, t),
    -Ce(i, t),
    -Ce(s, t),
    1
  ];
}
function Ut(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], o = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], i = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return i === 1 || i === 0 ? [n, s, o] : [n / i, s / i, o / i];
}
const Bx = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: ha,
  fromQuat: re,
  identity: Qo,
  invert: ua,
  lookAt: Jp,
  multiply: Pt,
  orthographic: Vp,
  perspective: Gp,
  scaling: Ge,
  transformPoint: Ut,
  translation: ze,
  transpose: Up
}, Symbol.toStringTag, { value: "Module" })), Fs = {
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
}, wl = {
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
function Zp(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Ft({ type: "bounce", mode: "in" });
Ft({ type: "bounce", mode: "in-out" });
function ko(t) {
  const e = R0.get(t.trim().toLowerCase());
  if (e) return e;
  const n = Zp(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Ft(r) };
  }
  const o = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (o) {
    const [, i, r, a] = o, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (i === "back" && l.length === 0 && n in Fs)
      return { easing: { type: "cubic-bezier", points: Fs[n] } };
    const h = i === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : i === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Ft(h) };
  }
  return n in wl ? { easing: wl[n] } : n in Fs ? { easing: { type: "cubic-bezier", points: Fs[n] } } : { easing: "ease-out" };
}
const R0 = /* @__PURE__ */ new Map();
function fa(t, e) {
  return R0.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function br(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const L0 = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function W0(t) {
  return typeof t == "string" && L0.test(t);
}
function Qp(t = 1) {
  let e = br(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), o = (l, c, h, u, f) => c === l ? h : h + (f - l) / (c - l) * (u - h), i = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return kl(l, c, 1 / 0);
    if ("values" in l) return kl(l.values, c, l.radius ?? 1 / 0);
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
        for (const f of Object.keys(l))
          u[f] = yo(l[f])(l[f], c[f], h);
        return u;
      }
      return yo(l)(l, c, h);
    }),
    wrap: ((l, c, h) => {
      if (Array.isArray(l)) {
        const p = l, m = (b) => p[(Math.round(b) % p.length + p.length) % p.length];
        return c === void 0 ? m : m(c);
      }
      const u = l, d = c - u, g = (p) => d === 0 ? u : ((p - u) % d + d) % d + u;
      return h === void 0 ? g : g(h);
    }),
    wrapYoyo: n(3, (l, c, h) => {
      const u = c - l;
      if (u === 0) return l;
      const f = ((h - l) % (u * 2) + u * 2) % (u * 2);
      return l + (f > u ? u * 2 - f : f);
    }),
    snap: n(2, i),
    random: ((l, c, h, u) => {
      if (Array.isArray(l)) {
        const d = () => l[Math.floor(e() * l.length)];
        return c === !0 ? d : d();
      }
      const f = () => r(l, c, h);
      return u ? f : f();
    }),
    shuffle: (l) => {
      for (let c = l.length - 1; c > 0; c--) {
        const h = Math.floor(e() * (c + 1));
        [l[c], l[h]] = [l[h], l[c]];
      }
      return l;
    },
    distribute: ({ base: l = 0, amount: c, each: h, from: u = "start", ease: f }) => (d, g, p) => {
      const m = p.length, k = oa(d, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), w = c !== void 0 ? c : (h ?? 1) * i0(m, u), y = f && w > 0 ? f(k / w) * w : k;
      return l + y;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => tg(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = br(l);
    },
    resolveRandomString: (l) => {
      const c = L0.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, f] = c.split(",").map((d) => Number.parseFloat(d));
      return r(h, u, Number.isFinite(f) ? f : void 0);
    }
  };
}
function kl(t, e, n) {
  let s = e, o = 1 / 0;
  for (const i of t) {
    const r = Math.abs(i - e);
    r < o && (o = r, s = i);
  }
  return o <= n ? s : e;
}
function tg(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const i = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return i.length >= 4 ? [i[0], i[1], i[2], Math.round(i[3] / 255 * 1e3) / 1e3] : [i[0], i[1], i[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((o) => Number.parseFloat(o));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const eg = /^([+-])=\s*(-?[\d.]+)$/, ng = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function Vn(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const o = t.trim();
  if (o === "") return e.cursor;
  const i = eg.exec(o);
  if (i) {
    const c = s(i[2]);
    return e.cursor + (i[1] === "-" ? -c : c);
  }
  const r = ng.exec(o);
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
function sg(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function og(t, e, n = {}) {
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
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, f = e.ease ? ko(e.ease) : void 0, d = f ? f.fn ?? Ft(f.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (d ? d(p) : p) * u;
  });
}
const da = /* @__PURE__ */ new Set([
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
]), ig = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function ao(t) {
  const e = {}, n = {};
  for (const [s, o] of Object.entries(t))
    da.has(s) ? e[s] = o : n[ig[s] ?? s] = o;
  return { config: e, properties: n };
}
function vo(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function wr(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : sg(t) ? { offsets: og(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const rg = {
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
function F0(t) {
  return rg[t];
}
function ag(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = Fp(e.path, { curviness: e.curviness });
  else if (Ps(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function lg(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function N0(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function cg(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = N0(e);
  if (typeof s != "string" || !Ps(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function hg(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, vl(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return vl(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const o = s(n[0]), i = s(n[1]);
  return o <= i ? [o, i] : [i, o];
}
function ug(t, e) {
  const [n, s] = hg(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function fg(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...ug(n, e) };
}
function dg(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function vl(t, e) {
  return Math.max(0, Math.min(e, t));
}
function pg(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function gg(t, e, n) {
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
      seed: o.seed ?? pg(`${e}|${o.text}`)
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
function pa(t) {
  return Math.max(0.1, t / 25);
}
function mg(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? pa(n.resistance) : void 0), o = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? o.end = [n.end(mo(o))] : n.end !== void 0 && (o.end = Array.isArray(n.end) ? [...n.end] : n.end), o;
}
function yg(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in ki))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(ki).join(", ")}`
    );
  return {
    ...e.preset ? ki[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function bg(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class En {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = br(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(e = {}) {
    this.options = e, this.timeline = new _t({
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
    return this.build(e, void 0, Jn(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: o, properties: i } = ao(Jn(n)), { motionPath: r, text: a, scrambleText: l, ...c } = i, h = this.targetsOf(e)[0], u = { ...o };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = lg(r));
    const f = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (f.text = Ai(a), u.text = typeof a == "object" ? { ...a, value: d } : d), l !== void 0 && (f.text = Ai(l), u.scrambleText = typeof l == "object" ? { ...l, text: d } : d), this.build(e, { ...c, ...f }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, o) {
    const { properties: i } = ao(Jn(n));
    return this.build(e, i, Jn(s), o);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Jn(n), duration: 0 }, s);
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
    const n = Math.max(0, Vn(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return Vn(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, Vn(n, this.context())), this;
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
    const s = Vn(n, this.context());
    for (const i of e.timeline.tracks) {
      if (!("keyframes" in i)) continue;
      const r = yr({
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
    const { config: i, properties: r } = ao(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, f = this.targetsOf(e), d = Vn(o, this.context()), g = vo(i.delay, 0), p = vo(i.duration, 500), m = wr(i.stagger, {
      count: f.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(f) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), b = this.easingFor(i.ease), k = [], w = i.spring;
    let y = 0, S = !1;
    for (const [A, E] of Object.entries(u)) {
      const P = E;
      let O = n?.[A] !== void 0 ? n[A] : this.resolveStart(f[0], A);
      if (typeof O != typeof P && (this.warn(
        `no usable start value for "${A}" on "${f[0]}" — it will snap to ${String(P)}. Use fromTo() to animate it.`
      ), O = P), w !== void 0 && (typeof O != "number" || typeof P != "number") && this.warn(`spring works on numbers, so "${A}" on "${f[0]}" eases instead`), w !== void 0 && typeof O == "number" && typeof P == "number") {
        const G = {
          ...yg(w),
          from: O,
          to: P,
          velocity: bg(w, A) ?? this.options.startVelocity?.(f[0], A) ?? 0
        }, Q = this.nextTrackId(`${f[0]}-${A}-spring`), j = {
          id: Q,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: A,
          kind: "spring",
          spring: G,
          delay: d + g
        };
        this.timeline.addTrack(j), k.push(Q), y = Math.max(y, dd(G));
        for (const C of f) this.lastValues.set(`${C}|${A}`, P);
        continue;
      }
      S = !0;
      const L = this.keyframesFor(O, P, p, b, i.ease), q = this.nextTrackId(`${f[0]}-${A}`);
      this.timeline.addTrack(
        yr({
          id: q,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: A,
          delay: d + g,
          keyframes: L,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...A === "quaternion" && { interpolation: "slerp" }
        })
      ), k.push(q);
      for (const G of f) this.lastValues.set(`${G}|${A}`, P);
    }
    const $ = gg({ text: l, scrambleText: c }, f[0], p);
    if ($) {
      const A = n?.text ?? n?.scrambleText, E = A !== void 0 ? Ai(A) : this.resolveStart(f[0], "text"), P = this.nextTrackId(`${f[0]}-text`), O = {
        id: P,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...m && f.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof E == "string" ? E : String(E ?? ""), ...$ },
        delay: d + g,
        keyframes: this.keyframesFor(0, 1, p, b, i.ease)
      };
      this.timeline.addTrack(O), k.push(P);
      for (const L of f) this.lastValues.set(`${L}|text`, $.to);
    }
    if (a !== void 0) {
      const { config: A, start: E, end: P } = ag(a), O = this.nextTrackId(`${f[0]}-motionPath`), L = {
        id: O,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...m && f.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: A,
        delay: d + g,
        keyframes: this.keyframesFor(E, P, p, b, i.ease)
      };
      this.timeline.addTrack(L), k.push(O);
    }
    if (h !== void 0)
      for (const [A, E] of Object.entries(h)) {
        const P = this.resolveStart(f[0], A);
        if (typeof P != "number") {
          this.warn(`inertia on "${A}" needs a numeric start value; skipped`);
          continue;
        }
        const O = mg(P, E), L = this.nextTrackId(`${f[0]}-${A}-inertia`), q = {
          id: L,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: A,
          kind: "inertia",
          inertia: O,
          delay: d + g
        };
        this.timeline.addTrack(q), k.push(L), y = Math.max(y, $s(O));
        for (const G of f) this.lastValues.set(`${G}|${A}`, As(O));
      }
    const M = ((h !== void 0 || w !== void 0) && !S && !$ && a === void 0 ? y : Math.max(p, y)) + (m && f.length > 1 ? Ko(f.length, m) : 0), T = d + g + M;
    return this.previousStart = d + g, this.previousEnd = T, this.cursor = Math.max(this.cursor, T), {
      trackIds: k,
      start: d + g,
      end: T,
      kill: () => {
        for (const A of k) this.timeline.removeTrack(A);
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
    const a = typeof i == "string" ? ko(i) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && go(o)) {
      const c = a?.fn ?? Ft(o);
      return [r, ...b0(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    const r = F0(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return ko(e).easing;
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
function Ai(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function wg(t) {
  return new En(t);
}
function Jn(t) {
  return dg(cg(t));
}
function kg(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${re(_e(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const vg = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Mg = "#ffffff", xg = "rgba(0, 0, 0, 0.5)";
function Sg(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Mg})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, o = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${o}px ${t.shadowColor ?? xg})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function Tg(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Eg(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const Ml = /* @__PURE__ */ new Set([
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
]), Ag = /* @__PURE__ */ new Set([
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
]), $g = [
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
], Pg = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), Ig = /* @__PURE__ */ new Set(["originX", "originY"]), Og = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), _g = /* @__PURE__ */ new Set(["drawOn"]), Hg = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, xl = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Cg = "http://www.w3.org/2000/svg";
class Ve {
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
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !_g.has(g)) {
        if (Ag.has(g))
          (s ??= {})[g] = p;
        else if (Pg.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (Ig.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (Og.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (vg.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            Tg(e, p);
          else if (g === "d" && typeof p == "string") {
            const m = e;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", p);
          } else
            this.applyStyleProperty(e, g, p);
        }
      }
    const u = n.get("shine");
    typeof u == "number" && this.applyShine(e, u);
    const f = [], d = n.get("perspective");
    if (typeof d == "number" && d > 0 && f.push(`perspective(${d}px)`), s)
      for (const g of $g) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && f.push(m);
      }
    if (f.length > 0 && (e.style.transform = f.join(" "), Eg(e)), o && (o.childPerspective !== void 0 && (e.style.perspective = `${o.childPerspective}px`), (o.perspectiveOriginX !== void 0 || o.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${o.perspectiveOriginX ?? 50}% ${o.perspectiveOriginY ?? 50}%`)), i) {
      const g = i.originX ?? 50, p = i.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, b = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${b}%)`;
    }
    if (a) {
      const g = Sg(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return kg(n);
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
    if (e.namespaceURI === Cg && n in xl) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[xl[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? o = "color" : o = Hg[n] ?? n;
    let r;
    typeof s == "number" ? Ml.has(n) || Ml.has(o) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[o] = r;
  }
}
const Rg = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Lg {
  adapter = new Ve();
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
  utils = Qp();
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
    this.scheduler = e.scheduler ?? Rg, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      $i(s) && this.currentCollector?.touch(s, o), n.push(o);
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
    if ($i(e)) return [e];
    if (!Wg(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return $i(e) ? this.elementName(e) : this.objectName(e);
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
function $i(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Wg(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function Mo(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const Sl = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Fg(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Ng(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Dg(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || Sl(t) ? { path: t } : t, { align: s, alignOrigin: o, path: i, ...r } = n, a = ($) => {
    const v = Sl($) ? $ : e.query($);
    return v || e.warn(`gsap-compat: motionPath could not find "${String($)}"`), v;
  };
  let l = null, c = "";
  if (Array.isArray(i) || typeof i == "string" && Ps(i))
    c = i;
  else {
    l = a(i);
    const $ = l && aa({ tag: l.localName, attributes: Fg(l) });
    l && !$ && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = $ ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const f = e.targets[0];
  if (!f) return h;
  const [d, g, p, m, b, k] = Ng(u), w = Mo(f), [y, S] = o ?? [0.5, 0.5];
  for (const $ of e.targets.slice(1)) {
    const v = Mo($);
    if (Math.abs(v.left - w.left) > 0.5 || Math.abs(v.top - w.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, g, p, m, b - w.left - y * w.width, k - w.top - S * w.height], h;
}
const D0 = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function B0(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function z0(t) {
  if (!t) return null;
  const e = aa({ tag: t.localName, attributes: B0(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function Bg(t, e, n) {
  const s = N0(t);
  if (typeof s == "string" && Ps(s)) return s;
  const o = D0(s) ? s : typeof s == "string" ? e(s) : null, i = z0(o);
  return i || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const zg = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function qg(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : D0(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const o = aa({ tag: s.localName, attributes: B0(s) });
    if (!o || !s.parentNode) return s;
    const i = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      zg.has(r.name) || i.setAttribute(r.name, r.value);
    return i.setAttribute("d", o), s.parentNode.replaceChild(i, s), i;
  });
}
const Tl = 0.3;
class Yg {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = El(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = El(), o = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const i = e / o * 1e3, r = n / o * 1e3;
    this.velocityX += (i - this.velocityX) * Tl, this.velocityY += (r - this.velocityY) * Tl;
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
function El() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Kg(t, e, n) {
  let s = { delta: 0, line: null }, o = n;
  for (const i of t)
    for (const r of e) {
      const a = Math.abs(r - i);
      a <= o && (o = a, s = { delta: r - i, line: r });
    }
  return s;
}
function jg(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class q0 {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new Yg({
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
    const o = (this.options.axis ?? "both") === "y" ? this.y : this.x, i = Xg(o / s);
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
      ...jg([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], i = Kg([s], o, this.snapThreshold());
    s += i.delta, n === "x" ? this.snappedX = i.line : this.snappedY = i.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function Xg(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function zx(t) {
  const e = new q0(t);
  return e.start(), e;
}
const Ug = { x: "x", y: "y", "x,y": "both" }, kr = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Al(t, e) {
  const n = Mo(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function $l(t) {
  return Array.isArray(t) ? [...t] : t;
}
function Gg(t, e, n, s = {}) {
  const [o] = e.resolveTargets(n), i = o ? e.elementFor(o) : void 0;
  if (!o || !i)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return Vg(t, e, o, i, s);
  const r = Ug[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(o, "x"), m = e.appliedValue(o, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : kr(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !kr(s.bounds) ? s.bounds : void 0) ?? (l ? Al(i, l) : void 0) };
  let u = null;
  const f = () => {
    u?.kill(), u = null;
  }, d = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, b = m.friction ?? (m.resistance !== void 0 ? pa(m.resistance) : 4), k = a(), w = h.bounds ?? {};
    let y, S;
    const $ = m.end;
    if (Array.isArray($)) {
      const x = mo({ from: k.x, velocity: r === "y" ? 0 : p.x, friction: b }), M = mo({ from: k.y, velocity: r === "x" ? 0 : p.y, friction: b });
      let T = $[0];
      for (const A of $)
        Math.hypot(A.x - x, A.y - M) < Math.hypot(T.x - x, T.y - M) && (T = A);
      T && (y = [T.x], S = [T.y]);
    } else typeof $ == "number" ? (y = $, S = $) : $ && (y = $l($.x), S = $l($.y));
    const v = {};
    r !== "y" && (v.x = { velocity: p.x, friction: b, min: w.minX, max: w.maxX, end: y }), r !== "x" && (v.y = { velocity: p.y, friction: b, min: w.minY, max: w.maxY, end: S }), u = t.to(i, { inertia: v, onComplete: () => s.onThrowComplete?.() });
  }, g = new q0({
    target: i,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      f(), l && (h.bounds = Al(i, l)), s.onPress?.();
    },
    onDrag: (p) => {
      e.apply(o, r === "x" ? { x: p.x } : r === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
    },
    onRelease: () => {
      const p = g.velocity;
      s.onRelease?.(p), s.inertia && d(p);
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
      f(), g.destroy();
    }
  };
}
function Vg(t, e, n, s, o) {
  const i = typeof o.bounds == "object" && o.bounds !== null && !kr(o.bounds) ? o.bounds : {}, r = () => {
    const w = e.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, a = (w) => Math.min(i.maxRotation ?? 1 / 0, Math.max(i.minRotation ?? -1 / 0, w));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, f = 0, d = 0, g = [];
  const p = (w) => Math.atan2(w.clientY - u.y, w.clientX - u.x) * 180 / Math.PI, m = (w) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = w.pointerId, s.setPointerCapture?.(w.pointerId);
    const y = s.getBoundingClientRect();
    u = { x: y.left + y.width / 2, y: y.top + y.height / 2 }, f = p(w), d = r(), g = [{ time: performance.now(), rotation: d }], o.onPress?.();
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    const y = p(w);
    let S = y - f;
    S > 180 && (S -= 360), S < -180 && (S += 360), f = y, d += S;
    let $ = a(d);
    o.snap && ($ = a(Math.round($ / o.snap) * o.snap)), e.apply(n, { rotate: $ });
    const v = performance.now();
    for (g.push({ time: v, rotation: $ }); g.length > 2 && v - g[0].time > 100; ) g.shift();
    const x = { x: 0, y: 0 };
    o.onDrag?.(x);
  }, k = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const y = g[0], S = g[g.length - 1], $ = y && S ? (S.time - y.time) / 1e3 : 0, v = $ > 0 ? (S.rotation - y.rotation) / $ : 0;
    if (o.onRelease?.({ x: v, y: 0 }), !o.inertia) return;
    const x = o.inertia === !0 ? {} : o.inertia, M = x.friction ?? (x.resistance !== void 0 ? pa(x.resistance) : 4), T = typeof x.end == "number" || Array.isArray(x.end) ? x.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: v,
          friction: M,
          min: i.minRotation,
          max: i.maxRotation,
          end: Array.isArray(T) ? T.filter((A) => typeof A == "number") : T
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
const Jg = { opacity: 0, scale: 0.6 };
function Zg(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Pl(t) {
  const e = Mo(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function vr(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = Zg(r);
    o.set(r, a);
    const l = Y0(r);
    a && l !== void 0 && !i.has(l) && i.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: o, ids: i };
}
const Pi = /* @__PURE__ */ new WeakMap();
function Mr(t, e, n, s = {}) {
  const o = s.duration ?? 0.6, i = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? Jg : s.enter, c = new Set(n.elements);
  if (s.targets !== void 0)
    for (const d of t.resolveTargets(s.targets)) {
      const g = t.elementFor(d);
      g && c.add(g);
    }
  const h = [...c].sort(
    (d, g) => d === g ? 0 : d.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), u = e({ onComplete: s.onComplete });
  let f = 0;
  for (const d of h) {
    const g = Pl(d);
    if (!g) continue;
    let p = n.boxes.get(d) ?? null, m;
    const b = Y0(d), k = !p && b !== void 0 ? n.ids.get(b) : void 0;
    k && k.element !== d && (p = k.box, m = k.element);
    const [w] = t.resolveTargets(d);
    Pi.get(d)?.timeline.removeTracks({ target: w });
    const y = f * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...K0(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: o, ease: i, delay: y }, 0), Pi.set(d, u), f++;
      continue;
    }
    const S = p.cx - g.cx, $ = p.cy - g.cy, v = a ? p.width / g.width : 1, x = a ? p.height / g.height : 1;
    if (!(Math.abs(S) > 0.5 || Math.abs($) > 0.5 || Math.abs(v - 1) > 1e-3 || Math.abs(x - 1) > 1e-3)) {
      const A = (E, P) => {
        const O = t.appliedValue(w, E);
        return typeof O == "number" && Math.abs(O - P) > 1e-6;
      };
      (A("x", 0) || A("y", 0) || A("scaleX", 1) || A("scaleY", 1)) && u.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const T = s.fade === !0 && m !== void 0;
    u.fromTo(
      d,
      { x: S, y: $, scaleX: v, scaleY: x, ...T && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...T && { opacity: 1 }, duration: o, ease: i, delay: y },
      0
    ), T && m && Pl(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: o, ease: i, delay: y }, 0), Pi.set(d, u), f++;
  }
  return u;
}
function Y0(t) {
  return t.dataset?.flipId;
}
function K0(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function Qg(t, e = {}) {
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
  }, f = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: m } of i) {
      const b = (m.textContent ?? "").replace(/\s+/g, " ").trim(), k = tm(m, s.words), w = n.has("chars") ? k.flatMap(($) => em($, s.chars)) : [], y = n.has("lines") ? sm(m, k, s.lines) : [];
      if (o) {
        !m.hasAttribute("aria-label") && b && m.setAttribute("aria-label", b);
        for (const $ of k) $.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...k);
      else for (const $ of k) $.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...y);
      const S = e.mask === "lines" ? y : e.mask === "words" ? k : e.mask === "chars" ? w : [];
      for (const $ of S) p.masks.push(om($, `${s[e.mask]}-mask`));
    }
    r = p;
  }, d = {
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
      c || (u(), h(), f(), a = e.onSplit?.(d));
    },
    revert() {
      c = !0, l?.disconnect(), u(), h();
    }
  };
  f(), a = e.onSplit?.(d), e.autoSplit && g();
  function g() {
    const p = /* @__PURE__ */ new Map();
    let m = !1;
    const b = () => {
      if (m) return;
      m = !0;
      const w = () => {
        m = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(w) : setTimeout(w, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((w) => {
        let y = !1;
        for (const S of w) {
          const $ = Math.round(S.contentRect.width), v = p.get(S.target);
          p.set(S.target, $), v !== void 0 && v !== $ && (y = !0);
        }
        y && b();
      });
      for (const w of t) l.observe(w);
    }
    const k = t[0]?.ownerDocument?.fonts;
    k && k.status !== "loaded" && k.ready.then(() => b());
  }
  return d;
}
function tm(t, e) {
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
function em(t, e) {
  const n = t.ownerDocument, s = nm(t.textContent ?? "").map((o) => {
    const i = n.createElement("span");
    return i.className = e, i.style.display = "inline-block", i.textContent = o, i;
  });
  return t.replaceChildren(...s), s;
}
function nm(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function sm(t, e, n) {
  const s = t.ownerDocument, o = new Map(e.map((g) => [g, g.getBoundingClientRect()])), i = [], r = (g) => {
    for (const p of Array.from(g.childNodes))
      p.nodeType === 3 || o.has(p) || p.tagName === "BR" ? i.push(p) : r(p);
  };
  r(t);
  const a = [];
  let l = null, c = 0, h = 0, u = !1, f = [];
  const d = () => {
    l = s.createElement("span"), l.className = n, l.style.display = "block", a.push(l), f = [];
  };
  for (const g of i) {
    if (g.tagName === "BR") {
      u = !0;
      continue;
    }
    const p = o.get(g);
    if (p && (!l || u || p.top > c + h) && (d(), c = p.top, h = p.height / 2, u = !1), !l) continue;
    const m = [];
    for (let w = g.parentNode; w && w !== t; w = w.parentNode) m.unshift(w);
    let b = 0;
    for (; b < f.length && b < m.length && f[b].original === m[b]; ) b++;
    f.length = b;
    let k = b === 0 ? l : f[b - 1].clone;
    for (const w of m.slice(b)) {
      const y = w.cloneNode(!1);
      k.appendChild(y), f.push({ original: w, clone: y }), k = y;
    }
    k.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function om(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const Il = {
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
function Ol(t) {
  const e = t.trim().toLowerCase();
  if (e in Il) return Il[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function j0(t) {
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
  const o = s[0] !== void 0 ? Ol(s[0]) : void 0, i = s[1] !== void 0 ? Ol(s[1]) : void 0;
  return {
    elementFraction: o ?? 0,
    viewportFraction: i ?? 0,
    offsetPx: e
  };
}
function ms(t, e, n) {
  const s = j0(n), o = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, i = e * s.viewportFraction;
  return o - i + s.offsetPx;
}
function qx(t, e, n, s) {
  const o = ms(t, e, n), r = ms(t, e, s) - o;
  return r <= 0 ? o <= 0 ? 1 : 0 : X0(-o / r);
}
function X0(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function im(t, e, n, s) {
  if (n <= 0) return e;
  const o = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * o;
}
function _l(t, e, n, s, o) {
  const i = (h) => ms({ top: t + o(h), bottom: t + o(h) + e, height: e }, n, s), r = i(0), a = i(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(i(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class rm {
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
function Yx(t) {
  const e = new rm(t);
  return e.start(), e;
}
class am {
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
const lm = 0.15;
function cm(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function hm(t, e, n) {
  const s = Ns(t + e * lm);
  if (typeof n == "function") return Ns(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : Ns(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let o = n[0];
  for (const i of n)
    Math.abs(i - s) < Math.abs(o - s) && (o = i);
  return Ns(o);
}
function um(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const o = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * o;
}
class fm {
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
  animate(e, n, s, o = Uo, i) {
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
function Ns(t) {
  return Math.max(0, Math.min(1, t));
}
class dm {
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
      const f = e.createElement("div");
      return f.textContent = `${a}${c}`, f.setAttribute("aria-hidden", "true"), f.className = "scroll-marker", Object.assign(f.style, {
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
      }), (n ?? e.body).appendChild(f), this.nodes.push(f), f;
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
const pm = 120, vn = [], Nn = /* @__PURE__ */ new Set();
let Ii = !1;
const gm = () => {
  Ii || Nn.size === 0 || (Ii = !0, queueMicrotask(() => {
    Ii = !1;
    for (const t of Nn) t.afterRefresh();
  }));
}, U0 = () => {
  for (const t of Nn) t.beforeRefresh();
  for (const t of vn) t.refresh();
  for (const t of Nn) t.afterRefresh();
};
let Mn = { width: 0, height: 0 };
const Hl = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === Mn.width && e !== Mn.height, s = Math.abs(e - Mn.height) < Mn.height * 0.25, o = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && o || (Mn = { width: t, height: e }, U0());
};
class ti {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new fm((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new am(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new dm(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), vn.length === 0 && typeof window < "u" && (Mn = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Hl, { passive: !0 })), vn.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), vn.splice(vn.indexOf(this), 1), vn.length === 0 && typeof window < "u" && window.removeEventListener("resize", Hl), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    U0();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return Nn.add(e), () => Nn.delete(e);
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
      if (this.startPx = e + ms(n, s, Zn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const o = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(o.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, gm();
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
    this.targetProgress = s > 0 ? X0((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(o, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const o = Zn(this.options.end) ?? "bottom top", i = typeof o == "string" ? o.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (i) {
      const r = Number.parseFloat(i[1]);
      return this.startPx + (i[2] === "%" ? n * r / 100 : r);
    }
    return s + ms(e, n, o);
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
    }, pm));
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
    const n = cm(e), s = () => {
      this.snapTimer = null;
      const o = this.endPx - this.startPx, i = this.scrollPosition();
      if (!this.running || o <= 0 || i <= this.startPx || i >= this.endPx) return;
      const r = (i - this.startPx) / o, a = this.startPx + hm(r, this.releaseVelocity / o, n.snapTo) * o;
      Math.abs(a - i) < 1 || this.snapper.animate(i, a, um(n, a - i, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), o = this.options.scroller?.getBoundingClientRect?.().left ?? 0, i = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - o - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (d) => a + d * (l - a), h = _l(r, s.width, i, Zn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = Zn(this.options.end) ?? "right left", f = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = f ? this.startPx + Number.parseFloat(f[1]) : c(_l(r, s.width, i, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (i, r) => {
      const a = Zn(i) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = j0(a);
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
      this.lastFrameTime = n, this.displayProgress = im(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function Zn(t) {
  return typeof t == "function" ? t() : t;
}
function Kx(t) {
  const e = new ti(t);
  return e.start(), e;
}
const Oi = /* @__PURE__ */ new Set(), mm = 16, Cl = 0.5, ym = 2;
class Rl {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), Oi.add(this), this.stopListening = ti.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of Oi) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), Oi.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) _i(e.element, e.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: i * 1e3, ease: n.ease ?? Uo, elapsed: 0 }, this.requestFrame();
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
    for (const e of this.effects) _i(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? mm : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), o = this.clamp(this.target + s);
    o === this.target && o === this.current || (e.preventDefault(), this.journey = null, this.target = o, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= ym || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / i)), Math.abs(this.target - this.current) < Cl && (this.current = this.target);
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
        o.lagged = e === 0 ? s : o.lagged + (s - o.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - o.lagged) < Cl ? o.lagged = s : n = !0, i += s - o.lagged;
      }
      _i(o.element, i === 0 ? o.saved : `0 ${bm(i)}px`), o.shift = i;
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
function _i(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function bm(t) {
  return Math.round(t * 100) / 100;
}
function wm(t, e) {
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
function ga(t, e, n, s, o = () => {
}) {
  const i = (d) => typeof d == "string" ? t.query(d) ?? void 0 : d, r = i(e.trigger) ?? s;
  if (!r) {
    o(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (d, g) => () => {
    g?.(), n && !a && wm(n, l[d] ?? "none"), e.once && d === 0 && queueMicrotask(() => h.destroy());
  }, f = e.containerAnimation ? Mm(t, e.containerAnimation, r, o) : void 0;
  return h = new ti({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : i(e.pin),
    scroller: i(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : km(e.snap, n),
    markers: e.markers,
    container: f,
    onUpdate: (d, g) => {
      if (n && a !== !1 && n.progress(d), e.onUpdate) {
        const p = d < c || g < 0 ? -1 : 1;
        e.onUpdate({ progress: d, velocity: g, direction: p });
      }
      c = d;
    },
    onEnter: u(0, e.onEnter),
    onLeave: u(1, e.onLeave),
    onEnterBack: u(2, e.onEnterBack),
    onLeaveBack: u(3, e.onLeaveBack)
  }), n && a === !1 && n.progress(0), h.start(), t.own(h);
}
function km(t, e) {
  const n = (o) => o === "labels" ? (i) => vm(i, e?.labelProgresses?.() ?? []) : o;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? ko(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Ft(s.easing) : void 0
  };
}
function vm(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Mm(t, e, n, s) {
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
class G0 {
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
class xm {
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
    const i = new G0(this.host, this.scope);
    i.conditions = n, i.add(() => e.setup(i)), e.context = i;
  }
}
class Sm {
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
const Tm = { opacity: 0, y: -16 }, Em = { opacity: 0, y: 16 };
async function Am(t, e, n, s) {
  const o = e.collector?.scope ?? e.root, i = o.ownerDocument ?? o, r = () => s.shared ? [...o.querySelectorAll(s.shared)] : [];
  if (s.native && typeof i.startViewTransition == "function")
    return $m(i, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((b) => {
    m(b) || b();
  }), h = r(), u = h.length ? vr(e, h) : void 0, f = s.from !== void 0 ? Ll(e, s.from, s.shared) : [];
  if (f.length && s.leave !== !1) {
    const m = s.leave ?? Tm;
    await c((b) => t.to(f, { ...m, duration: a, ease: l, onComplete: b }));
  }
  await s.update();
  const d = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? Ll(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? Em;
    d.push(c((b) => t.fromTo(p, m, { ...K0(m), duration: a, ease: l, onComplete: b })));
  }
  if (u) {
    const m = r().filter((b) => !h.includes(b));
    m.length && d.push(
      c(
        (b) => Mr(e, n, u, {
          targets: m,
          duration: a * 1.4,
          ease: l,
          enter: !1,
          onComplete: b
        })
      )
    );
  }
  await Promise.all(d);
}
function Ll(t, e, n) {
  const s = t.resolveTargets(e).map((o) => t.elementFor(o)).filter((o) => !!o);
  return n ? s.flatMap((o) => !o.querySelector(n) && !o.matches(n) ? [o] : [...o.children].filter((i) => !i.matches(n) && !i.querySelector(n))) : s;
}
async function $m(t, e, n) {
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
const Pm = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => fa(t, Sp(e))
}, Im = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => fa(t, { fn: Tp(e) })
}, Om = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => fa(t, { fn: Ep(e) })
}, _m = /* @__PURE__ */ new Set([
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
]), Wl = 0.5, Hm = "power1.inOut";
function Cm(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function Rm(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) _m.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? Wl
    }));
  const s = Object.entries(e), o = t.duration ?? Wl, i = e.easeEach ?? t.easeEach ?? Hm;
  if (s.length > 0 && s.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = s.filter(([f]) => f !== "easeEach").map(([f, d]) => ({ at: Number.parseFloat(f) / 100, step: d })).sort((f, d) => f.at - d.at), h = [];
    let u = 0;
    for (const { at: f, step: d } of c) {
      const g = Math.max(0, f - u);
      h.push({ ...n, ease: i, ...d, duration: g * o }), u = f;
    }
    return h;
  }
  const r = s.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...r.map(([, c]) => c.length)), l = [];
  for (let c = 0; c < a; c++) {
    const h = { ...n, ease: i, duration: o / a };
    for (const [u, f] of r)
      c < f.length && (h[u] = f[c]);
    l.push(h);
  }
  return l;
}
function Fl(t, e, n, s = {}) {
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
    const S = y.getBoundingClientRect(), $ = i?.getBoundingClientRect(), v = (k === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return k === "x" ? S.left - ($?.left ?? 0) + r.x - v : S.top - ($?.top ?? 0) + r.y - v;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, f = () => {
    i ? (i.scrollLeft = u.x, i.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], g = i ?? window, p = () => {
    b.kill(), m();
  }, m = () => {
    for (const k of d) g.removeEventListener(k, p);
  }, b = t.to(u, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      f(), s.onUpdate?.();
    },
    onComplete: () => {
      m(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const k of d) g.addEventListener(k, p, { passive: !0 });
  return b;
}
function Lm(t, e, n) {
  const s = t.collector?.scope ?? t.root, o = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: i = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, f = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (b) => {
    g[b] !== void 0 && clearTimeout(g[b]), g[b] = void 0;
    const k = d[b].splice(0);
    k.length > 0 && f[b]?.(k);
  }, m = (b, k) => {
    if (f[b]) {
      if (d[b].push(k), r !== void 0 && d[b].length >= r) return p(b);
      g[b] === void 0 && (g[b] = setTimeout(() => p(b), i * 1e3));
    }
  };
  return o.map(
    (b) => ga(t, {
      ...u,
      trigger: b,
      onEnter: () => m("onEnter", b),
      onLeave: () => m("onLeave", b),
      onEnterBack: () => m("onEnterBack", b),
      onLeaveBack: () => m("onLeaveBack", b)
    })
  ).filter((b) => b !== void 0);
}
class ve {
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
    if (this.options = s, this.compat = new En({
      ...s,
      startValue: (o, i) => {
        const r = e.objectFor(o);
        if (r) return Dm(r[i]);
        const a = e.appliedValue(o, i);
        if (a !== void 0) return a;
        if (i === "d") return z0(e.elementFor(o)) ?? void 0;
        if (i === "text") return e.elementFor(o)?.textContent ?? void 0;
        if (i === "strokeDasharray" || i === "strokeDashoffset") {
          const l = Bl(e.elementFor(o));
          if (l !== void 0) return i === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (o, i) => e.velocityOf(o, i),
      layoutColumns: (o) => Dl(o.map((i) => e.elementFor(i))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const o = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = ga(e, o, this, this.firstElement, (i) => s.onWarning?.(i)));
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
    return Cm(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.to(i, o, r)));
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
    const o = this.timeline.currentTime, i = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: o }, a = s.duration ?? Math.abs(i - o) / 1e3 / (this.timeScale() || 1), l = new ve(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
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
    const o = this.events, { crossings: i, passes: r } = k0(
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
      const u = (f, d, g) => {
        o(f, d, g), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
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
    const i = Rm(n);
    if (i.length === 0) return;
    const r = o.length > 1 ? wr(n.stagger, this.staggerContext(o)) : void 0, a = o.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? fr(o.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + vo(n.delay, 0) / 1e3;
    let u = 1 / 0, f = -1 / 0;
    if (l.forEach((m, b) => {
      i.forEach((k, w) => {
        const y = w === 0 ? h + c[b] : ">";
        this.tween(m, [k], y, ([S], $, v) => this.compat.to($, S, v)), u = Math.min(u, this.compat.lastStart), f = Math.max(f, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: d, onUpdate: g, onComplete: p } = n;
    d && this.events.push({ time: u, direction: "forward", run: d }), g && this.ranges.push({ start: u, end: f, run: g }), p && this.events.push({ time: f, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => Dl(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, o) {
    const i = e.map((f) => this.targetFor(f));
    if (!(e.length > 1 && (n.some(Nm) || e.some((f) => this.stage.objectFor(f) !== void 0)))) {
      const f = this.targetFor(e[0]);
      o(n.map((d) => this.prepare(Nl(d, 0, f, this.stage.utils, i), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = wr(l, this.staggerContext(e)), u = h ? fr(e.length, h).map((f) => f / 1e3) : e.map(() => 0);
    e.forEach((f, d) => {
      const g = d === 0 ? vo(c.delay, 0) / 1e3 + u[0] : 0, p = d === 0 ? 0 : u[d] - u[d - 1], m = d === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, k = n.map((w, y) => y === a ? { ...c, delay: g } : w).map((w) => this.prepare(Nl(w, d, this.targetFor(f), this.stage.utils, i), [f]));
      o(k, [f], m);
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
      const r = Dg(e.motionPath, {
        query: o,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      i = { ...i, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = Bg(e.morphSVG, o, s), { morphSVG: a, ...l } = i;
      i = r ? { ...i, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = Bl(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = i;
        i = l;
      } else
        i = fg(i, r);
    }
    return i;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Bm(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Wm(t = new Lg()) {
  const e = (i) => {
    const { config: r } = ao(i);
    return new ve(t, {
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
    const { onStart: r, onUpdate: a, onComplete: l, onRepeat: c, onReverseComplete: h, repeatRefresh: u, ...f } = i;
    return f;
  }, s = (i) => (i && t.collector?.track(i), i), o = {
    stage: t,
    ticker: t.ticker,
    utils: t.utils,
    getProperty: (i, r) => {
      const [a] = t.resolveTargets(i);
      if (a === void 0) return;
      const l = t.objectFor(a);
      return l ? l[r] : t.appliedValue(a, r) ?? F0(r);
    },
    scrollTrigger: (i) => s(ga(t, i)),
    scrollBatch: (i, r) => Lm(t, i, r).map((a) => s(a)),
    scrollTo: (i, r) => Fl(o, t, i, r),
    refreshScroll: () => {
      ti.refreshAll(), Rl.refreshAll();
    },
    smoothScroll: (i = {}) => {
      const r = typeof i.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(i.scroller) : i.scroller;
      return s(new Rl({ ...i, scroller: r }).start());
    },
    context: (i, r) => {
      const a = new G0(t, r);
      return i && a.add(() => i(a)), a;
    },
    matchMedia: (i) => new xm(t, i),
    customEase: Pm.create,
    customBounce: Im.create,
    customWiggle: Om.create,
    pageTransition: (i) => Am(o, t, (r) => new ve(t, r), i),
    imageSequence: (i, r) => {
      const a = typeof i == "string" ? (t.collector?.scope ?? t.root).querySelector(i) : i;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(i)}`);
      return s(new Sm(a, r));
    },
    quickTo: (i, r, a = {}) => {
      const l = new ve(t, { paused: !0 }), [c] = t.resolveTargets(i);
      return Object.assign((u) => {
        if (!c) return;
        const f = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Fm(a.spring, r, f) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (i) => new ve(t, i),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (i, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof i != "string" && i !== window && i.nodeType === 1;
        return Fl(o, t, a, {
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
    delayedCall: (i, r, a) => new ve(t).call(r, a, i),
    killTweensOf: (i, r) => {
      const a = t.resolveTargets(i), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (i) => qg(i, t.root),
    splitText: (i, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof i == "string" ? Array.from(a.querySelectorAll(i)) : "nodeType" in i ? [i] : Array.from(i);
      return s(Qg(l, r));
    },
    draggable: (i, r) => s(Gg(o, t, i, r)),
    getFlipState: (i) => vr(t, i),
    flipFrom: (i, r) => Mr(t, (a) => new ve(t, a), i, r),
    flip: (i, r, a) => {
      const l = vr(t, i);
      return r(), Mr(t, (c) => new ve(t, c), l, { targets: i, ...a });
    }
  };
  return o;
}
const se = /* @__PURE__ */ Wm();
function Fm(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function Nm(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || V0(t);
}
function V0(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || W0(n)) && !da.has(e));
}
function Nl(t, e, n, s, o) {
  if (!V0(t)) return t;
  const i = {};
  for (const [r, a] of Object.entries(t))
    da.has(r) ? i[r] = a : typeof a == "function" ? i[r] = a(e, n, o) : W0(a) ? i[r] = s.resolveRandomString(a) : i[r] = a;
  return i;
}
function Dl(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function Bl(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function Dm(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function Bm(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class zl {
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
function zm(t, e, n, s, o) {
  const i = n - o;
  if (i < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(i, s);
}
class ma {
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
    this.options = n, this.adapter = new Ve();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = gs({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      i !== null && (s.volume = Math.max(0, Math.min(1, Number(i) || 0))), this.mediaTargets.push({ el: s, startTime: o, sync: new zl(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      zm(s.sync, s.el, e, n, s.startTime);
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
      const r = new Ve();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: gs(i.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new zl(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: i } = k0(
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
async function jx(t, e, n = {}) {
  const s = new ma(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function Xx(t, e = {}) {
  return new ma(t, e);
}
const qm = {
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
}, ql = "tinyfly-controls-style", Ym = `
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
let Km = 0;
function jm(t) {
  if (t.getElementById(ql)) return;
  const e = t.createElement("style");
  e.id = ql, e.textContent = Ym, t.head.appendChild(e);
}
function Xm(t, e, n = {}) {
  const s = e.ownerDocument;
  jm(s);
  const o = { ...qm, ...n.labels }, i = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((L) => L.label !== void 0 || t.caption(L.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (L, q, G, Q = "") => {
    const j = s.createElement("button");
    return j.type = "button", j.className = `tf-ctl-btn ${Q}`.trim(), j.setAttribute("aria-label", L), j.title = L, j.textContent = q, j.addEventListener("click", G), j;
  }, u = h(o.restart, "⟲", () => {
    t.pause(), t.seek(0);
  }), f = h(o.prev, "|◀", () => t.prev()), d = h(o.play, "▶", () => t.isPlaying ? t.pause() : p(), "tf-ctl-primary"), g = h(o.next, "▶|", () => t.next()), p = () => {
    t.currentTime >= t.duration - 0.5 && t.seek(0), t.play();
  }, m = s.createElement("input");
  m.type = "range", m.className = "tf-ctl-scrub", m.min = "0", m.max = "1000", m.step = "1", m.setAttribute("aria-label", o.scrub), m.addEventListener("input", () => {
    t.pause(), t.seek(Number(m.value) / 1e3 * t.duration);
  });
  const b = s.createElement("span");
  b.className = "tf-ctl-step";
  const k = s.createElement("select");
  k.className = "tf-ctl-speed", k.setAttribute("aria-label", o.speed);
  for (const L of i) {
    const q = s.createElement("option");
    q.value = String(L), q.textContent = `${L}×`, L === 1 && (q.selected = !0), k.appendChild(q);
  }
  k.addEventListener("change", () => t.setSpeed(Number(k.value))), c.append(u, f, d, g, m, b), i.length > 0 && c.append(k), l.append(c);
  const w = n.fullscreen ? Jm(e, s, o) : void 0;
  w && c.append(w.button);
  const y = s.createElement("p");
  y.className = "tf-ctl-caption", y.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(y);
  const S = s.createElement("div");
  S.className = "tf-ctl-question", S.hidden = !0;
  const $ = s.createElement("span"), v = h(o.reveal, o.reveal, () => t.play(), "tf-ctl-primary");
  S.append($, v), l.append(S);
  const x = Um(t, s, o.scenario, n.scenarioControl ?? "buttons");
  x && l.append(x.element);
  const M = n.mount;
  M ? M.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const T = () => {
    const L = t.isPlaying;
    d.textContent = L ? "❚❚" : "▶", d.setAttribute("aria-label", L ? o.pause : o.play), d.title = L ? o.pause : o.play;
    const q = t.duration;
    s.activeElement !== m && (m.value = String(q > 0 ? Math.round(t.currentTime / q * 1e3) : 0));
    const G = t.markers;
    if (f.hidden = g.hidden = b.hidden = G.length === 0, G.length > 0) {
      const Q = t.currentMarker, j = Q ? G.indexOf(Q) + 1 : 0;
      b.textContent = o.stepFormat.replace("{index}", String(j)).replace("{total}", String(G.length)), b.setAttribute("aria-label", `${o.step} ${j} ${o.of} ${G.length}`), f.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= q - 0.5;
      const C = t.caption() ?? "";
      y.textContent !== C && (y.textContent = C), y.hidden = !a();
      const B = !L && Q?.question !== void 0 && Math.abs(t.currentTime - Q.time) < 1;
      S.hidden = !B, B && $.textContent !== Q.question && ($.textContent = Q.question);
    } else
      S.hidden = !0, y.hidden = !0;
    x?.update();
  }, A = t.subscribe(T);
  T();
  const E = n.keyboardScope ?? e;
  !E.hasAttribute("tabindex") && E.tabIndex < 0 && (E.tabIndex = 0);
  const P = /* @__PURE__ */ new WeakSet(), O = (L) => {
    if (P.has(L) || (P.add(L), L.defaultPrevented || L.altKey || L.ctrlKey || L.metaKey)) return;
    const q = L.target;
    if (!(q.tagName === "INPUT" || q.tagName === "SELECT") && !(L.key === " " && q.tagName === "BUTTON"))
      switch (L.key) {
        case " ":
          L.preventDefault(), t.isPlaying ? t.pause() : p();
          break;
        case "ArrowRight":
          if (!r()) return;
          L.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          L.preventDefault(), t.prev();
          break;
        case "Home":
          L.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          L.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return E.addEventListener("keydown", O), l.addEventListener("keydown", O), {
    element: l,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), A(), E.removeEventListener("keydown", O), l.removeEventListener("keydown", O), l.remove();
    }
  };
}
function Um(t, e, n, s) {
  const o = t.scenarios;
  if (o.length < 2) return;
  if (s === "slider") {
    const h = e.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const u = e.createElement("span");
    u.textContent = n, u.setAttribute("aria-hidden", "true");
    const f = e.createElement("input");
    f.type = "range", f.min = "0", f.max = String(o.length - 1), f.step = "1", f.setAttribute("aria-label", n);
    const d = e.createElement("output");
    return d.setAttribute("aria-hidden", "true"), f.addEventListener("input", () => {
      const p = o[Number(f.value)];
      p && t.setScenario(p.id);
    }), h.append(u, f, d), { element: h, update: () => {
      const p = Math.max(0, o.findIndex((b) => b.id === t.scenario));
      e.activeElement !== f && (f.value = String(p));
      const m = o[p].label;
      d.textContent !== m && (d.textContent = m), f.setAttribute("aria-valuetext", m);
    } };
  }
  const i = e.createElement("fieldset");
  i.className = "tf-ctl-choices";
  const r = e.createElement("legend");
  r.textContent = n, i.append(r);
  const a = `tf-ctl-scenario-${++Km}`, l = o.map((h) => {
    const u = e.createElement("label");
    u.className = "tf-ctl-choice";
    const f = e.createElement("input");
    f.type = "radio", f.name = a, f.value = h.id, f.addEventListener("change", () => {
      f.checked && t.setScenario(h.id);
    });
    const d = e.createElement("span");
    return d.textContent = h.label, u.append(f, d), i.append(u), f;
  });
  return { element: i, update: () => {
    for (const h of l) {
      const u = h.value === t.scenario;
      h.checked !== u && (h.checked = u);
    }
  } };
}
const Gm = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Vm = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function Jm(t, e, n) {
  const s = e, o = t, i = e.createElement("button");
  i.type = "button", i.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    i.innerHTML = p ? Vm : Gm;
    const m = p ? n.exitFullscreen : n.fullscreen;
    i.setAttribute("aria-label", m), i.title = m, i.setAttribute("aria-pressed", String(p)), t.classList.toggle("tf-fullscreen", p), t.classList.toggle("tf-fullscreen-overlay", r === "overlay");
  }, c = () => s.fullscreenElement ?? s.webkitFullscreenElement ?? null, h = () => {
    c() === t ? r = "native" : r === "native" && (r = void 0), l();
  }, u = (p) => {
    p.key === "Escape" && g();
  }, f = () => {
    r = "overlay", a = e.documentElement.style.overflow, e.documentElement.style.overflow = "hidden", e.addEventListener("keydown", u), l();
  };
  async function d() {
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
    f();
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
    r ? g() : d();
  }), e.addEventListener("fullscreenchange", h), e.addEventListener("webkitfullscreenchange", h), l(), {
    button: i,
    get active() {
      return r !== void 0;
    },
    enter: d,
    exit: g,
    destroy() {
      g(), e.removeEventListener("fullscreenchange", h), e.removeEventListener("webkitfullscreenchange", h), i.remove();
    }
  };
}
const Yl = "tinyfly-choices-style", Zm = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function Qm(t) {
  if (t.getElementById(Yl)) return;
  const e = t.createElement("style");
  e.id = Yl, e.textContent = Zm, t.head.appendChild(e);
}
function t1(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  Qm(e.ownerDocument);
  const s = [], o = [];
  for (const a of n) {
    const l = a.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (g, p) => {
      a.hasAttribute(g) || (a.setAttribute(g, p), c.push(g));
    };
    h("role", "button"), h("tabindex", "0");
    const u = t.scenarios.find((g) => g.id === l)?.label;
    u !== void 0 && h("aria-label", u), a.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), s.push({ element: a, attributes: c });
    const f = () => t.setScenario(l), d = (g) => {
      const p = g.key;
      p !== "Enter" && p !== " " || (g.preventDefault(), f());
    };
    a.addEventListener("click", f), a.addEventListener("keydown", d), o.push(() => {
      a.removeEventListener("click", f), a.removeEventListener("keydown", d);
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
const xo = /* @__PURE__ */ new WeakMap(), xr = /* @__PURE__ */ new WeakMap();
let e1 = 0;
function rs(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function n1(t, e = {}) {
  const n = xo.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), o = s[0], i = t.getAttribute("data-src"), r = o1(t.getAttribute("data-markers")), a = s.length > 1 || o?.hasAttribute("data-scenario") ? s1(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = o && !a ? rs(o.textContent, "timeline", t) : void 0;
  if (!l && i && r) {
    const d = await fetch(i);
    d.ok && (l = await d.json());
  }
  if (l && r && (l = J0(l, r)), !l && !i && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = rs(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...rs(t.getAttribute("data-options"), "data-options", t)
  };
  r1(t);
  const u = new ma(t, h), f = { element: t, player: u };
  if (xo.set(t, f), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const d = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === d) ? d : void 0 }), xr.set(t, t1(u, t));
  } else
    await u.load(l ?? i);
  if (t.getAttribute("data-controls") !== "false") {
    const d = rs(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    f.controls = Xm(u, t, {
      ...e.controls,
      ...t.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...m === "slider" || m === "buttons" ? { scenarioControl: m } : {},
      labels: { ...e.controls?.labels, ...d, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), g ? t.insertBefore(f.controls.element, g) : t.appendChild(f.controls.element);
  }
  return f;
}
function s1(t, e, n) {
  const s = [];
  return t.forEach((o, i) => {
    const r = rs(o.textContent, "timeline", n);
    if (!r) return;
    const a = o.getAttribute("data-scenario") || `scenario-${i + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = o.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? J0(r, e) : r });
  }), s;
}
function J0(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function o1(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function i1(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((o) => n1(o, e)))).filter((o) => o !== void 0);
}
function Ux(t) {
  const e = xo.get(t);
  e && (xr.get(t)?.(), xr.delete(t), e.controls?.destroy(), e.player.destroy(), xo.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function r1(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++e1}`, e.setAttribute("aria-labelledby", s.id));
}
function a1() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    i1();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class l1 {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new Ve(), this.adapterB = new Ve();
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
      const a = new Ve();
      o.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: gs(r) });
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
    return e.timeline ? gs(e.timeline) : null;
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
async function Gx(t, e, n = {}) {
  const s = new l1(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const Vx = { type: "none", duration: 0 }, $t = (t) => ({ description: t, unit: "degrees" }), St = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), Z0 = {
  lean: $t("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: $t("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: $t("Head tilt"),
  leftShoulder: $t("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: $t("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: $t("Left elbow bend, added to the upper arm"),
  rightElbow: $t("Right elbow bend, added to the upper arm"),
  leftHip: $t("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: $t("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: $t("Left knee bend (negative folds the shin back)"),
  rightKnee: $t("Right knee bend (positive folds the shin back)"),
  leftWrist: $t("Left wrist bend, added to the forearm"),
  rightWrist: $t("Right wrist bend, added to the forearm"),
  leftAnkle: $t("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: $t("Right ankle: + points the toe down (tiptoe), − onto the heel"),
  leftFootOut: St("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: St("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: St("Mouth open: 0 closed, 1 wide open"),
  smile: St("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: St("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: St("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: St("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: St("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: St("Eyes look across: + the way it faces", -1, 1),
  lookY: St("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: St("0 front-on, 1 in profile, turned the way it faces"),
  sit: St("0 standing, 1 seated"),
  spin: $t("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, Q0 = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: St("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: St("How much the mouth chatters"),
  rubber: St("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: St("How much of the dance is applied")
}, tu = {
  "thumb.curl": St("Thumb curled in"),
  "thumb.across": St("Thumb across the palm"),
  "index.curl": St("Index finger curled"),
  "middle.curl": St("Middle finger curled"),
  "ring.curl": St("Ring finger curled"),
  "pinky.curl": St("Little finger curled"),
  spread: St("Fingers spread apart"),
  turn: $t("Hand turned about the forearm"),
  bend: $t("Hand bent at the wrist, palm-ward"),
  tilt: $t("Hand tilted sideways"),
  roll: $t("Hand rolled to show the back or the palm")
};
let eu;
function c1(t) {
  eu = t;
}
function h1(t) {
  return eu?.(t) ?? {};
}
function u1(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function ys(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = u1(t) * n;
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
function ya(t, e) {
  const n = ys(t, e);
  return n[n.length - 1];
}
function nu(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Sr(t, e, n) {
  const s = e.roughness ?? 2, o = Math.max(1, Math.round(e.passes ?? 2)), i = nu(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const f = r++;
    return (d) => rn(ne(`${e.seed ?? 1}:${i}:${f}:${d}`));
  }, l = (f, d) => (f.next() * 2 - 1) * d, c = (f) => {
    const d = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < o; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, f(d(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (f, d = 1) => {
    if (f.length < 2) return;
    const g = f.slice(1).map((m, b) => Math.hypot(m.x - f[b].x, m.y - f[b].y)), p = g.reduce((m, b) => m + b, 0) * Math.min(1, Math.max(0, d));
    c((m) => {
      const b = [], k = [];
      if (f.forEach((y, S) => {
        b.push({ x: y.x + l(m, s * 0.5), y: y.y + l(m, s * 0.5) }), S > 0 && k.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(b[0].x, b[0].y);
      let w = 0;
      for (let y = 1; y < b.length; y++) {
        const S = f1(b[y - 1], b[y], s, k[y - 1]), $ = g[y - 1];
        if (w + $ <= p) {
          t.bezierCurveTo(S[1].x, S[1].y, S[2].x, S[2].y, S[3].x, S[3].y), w += $;
          continue;
        }
        const v = d1(S, $ === 0 ? 1 : (p - w) / $);
        t.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y);
        break;
      }
      t.stroke();
    });
  }, u = (f, d, g, p, m = 1) => {
    c((b) => {
      const w = b.next() * Math.PI * 2, y = Math.PI * 2 + 0.15 + b.next() * 0.3, S = [];
      for (let v = 0; v <= 14; v++) {
        const x = w + y * v / 14, M = l(b, s * 0.6);
        S.push({ x: f + Math.cos(x) * (g + M), y: d + Math.sin(x) * (p + M) });
      }
      const $ = ys(S, m);
      $.length < 2 || (Kl(t, $), t.stroke());
    });
  };
  return {
    line: h,
    curve(f, d = 1) {
      if (f.length < 2) return;
      const g = f[0], p = f[f.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, b = -(p.y - g.y) / m, k = (p.x - g.x) / m;
      c((w) => {
        const y = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, S = { x: l(w, s * 0.5), y: l(w, s * 0.5) }, $ = l(w, s * Math.min(1.5, Math.max(0.3, m / 80))), v = f.map((M, T) => {
          const A = T / (f.length - 1), E = Math.sin(Math.PI * A) * $;
          return {
            x: M.x + y.x + (S.x - y.x) * A + b * E,
            y: M.y + y.y + (S.y - y.y) * A + k * E
          };
        }), x = ys(v, d);
        x.length < 2 || (Kl(t, x), t.stroke());
      });
    },
    circle(f, d, g, p = 1) {
      u(f, d, g, g, p);
    },
    ellipse: u,
    nudge(f = 0.5) {
      const d = a()(0);
      return { x: l(d, s * f), y: l(d, s * f) };
    }
  };
}
function f1(t, e, n, s) {
  const o = e.x - t.x, i = e.y - t.y, r = Math.hypot(o, i) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -i / r, c = o / r;
  return [
    t,
    { x: t.x + o / 3 + l * s[0] * a, y: t.y + i / 3 + c * s[0] * a },
    { x: t.x + 2 * o / 3 + l * s[1] * a, y: t.y + 2 * i / 3 + c * s[1] * a },
    e
  ];
}
function d1([t, e, n, s], o) {
  const i = (u, f) => ({ x: u.x + (f.x - u.x) * o, y: u.y + (f.y - u.y) * o }), r = i(t, e), a = i(e, n), l = i(n, s), c = i(r, a), h = i(a, l);
  return [t, r, c, i(c, h)];
}
function Kl(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const o = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, o.x, o.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function Wt(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const o = [], i = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, f = r(l) / 2, d = -(h.y - c.y) / u * f, g = (h.x - c.x) / u * f;
    o.push({ x: a.x + d, y: a.y + g }), i.push({ x: a.x - d, y: a.y - g });
  }), [...o, ...i.reverse()];
}
function ba(t, e, n, s) {
  const o = e.length;
  if (o < 2) return;
  const i = Wt(e, n, s), r = (a) => n + (s - n) * a / (o - 1);
  t.beginPath(), t.moveTo(i[0].x, i[0].y);
  for (const a of i.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== o - 1 && o > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function Dn(t, e, n, s, o = 16) {
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
function Tr(t, e, n, s, o, i = 0, r = 1, a = 40) {
  const l = Math.cos(o), c = Math.sin(o);
  return Array.from({ length: a + 1 }, (h, u) => {
    const f = i + Math.PI * 2 * r * u / a, d = Math.cos(f) * n, g = Math.sin(f) * s;
    return { x: t + d * l - g * c, y: e + d * c + g * l };
  });
}
function ei(t, e) {
  return e.look === "pencil" ? m1(t, e) : su(t, e.ink, e.look);
}
function So(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function Is(t, e) {
  return e.look === "silhouette" ? su(t, e.ink, "silhouette", !1) : e;
}
function su(t, e, n, s = !0) {
  const o = n === "silhouette", i = o ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(r, a, l) {
      t.fillStyle = e, ba(t, r, a * i, l * i);
    },
    line(r, a) {
      r.length < 2 || (t.strokeStyle = e, t.lineWidth = a * i, t.lineCap = "round", t.lineJoin = "round", So(t, r), t.stroke());
    },
    shape(r, a, l) {
      So(t, r, !0), (a !== null || o && s) && (t.fillStyle = o ? e : a, t.fill()), !(l <= 0) && (t.strokeStyle = e, t.lineWidth = l * i, t.lineJoin = "round", t.stroke());
    },
    ellipse(r, a, l, c, h, u, f) {
      t.beginPath(), t.ellipse(r, a, l, c, h, 0, Math.PI * 2), (u !== null || o && s) && (t.fillStyle = o ? e : u, t.fill()), !(f <= 0) && (t.strokeStyle = e, t.lineWidth = f * i, t.stroke());
    },
    dot(r, a, l) {
      t.fillStyle = e, t.beginPath(), t.arc(r, a, l * i, 0, Math.PI * 2), t.fill();
    },
    guide() {
    },
    guideEllipse() {
    }
  };
}
function p1(t, e) {
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
function g1(t, e) {
  const n = t.length;
  return t.map((s, o) => {
    const i = t[Math.max(0, o - 1)], r = t[Math.min(n - 1, o + 1)], a = Math.hypot(r.x - i.x, r.y - i.y) || 1, l = e(n === 1 ? 0 : o / (n - 1));
    return { x: s.x - (r.y - i.y) / a * l, y: s.y + (r.x - i.x) / a * l };
  });
}
function jl(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, o) => s + o.amount, 0);
  return (s) => e.reduce((o, i) => o + i.amount * Math.sin(Math.PI * 2 * i.frequency * s + i.phase), 0) / n;
}
function m1(t, e) {
  const n = e.pencil ?? {}, s = e.ink, o = n.roughness ?? Math.max(1, e.lineWidth * 0.12), i = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = nu(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => rn(ne(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, b, k, w = 0) => {
    if (g.length < 2) return;
    const y = g.slice(1).reduce((A, E, P) => A + Math.hypot(E.x - g[P].x, E.y - g[P].y), 0);
    let S = p1(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, y / 24)));
    if (w > 0 && S.length >= 2) {
      const [A, E] = [S[S.length - 2], S[S.length - 1]], P = Math.hypot(E.x - A.x, E.y - A.y) || 1;
      S = [...S, { x: E.x + (E.x - A.x) / P * w, y: E.y + (E.y - A.y) / P * w }];
    }
    const $ = jl(m), v = jl(m), x = S.length, M = [], T = [];
    S.forEach((A, E) => {
      const P = x === 1 ? 0 : E / (x - 1), O = S[Math.max(0, E - 1)], L = S[Math.min(x - 1, E + 1)], q = Math.hypot(L.x - O.x, L.y - O.y) || 1, G = -(L.y - O.y) / q, Q = (L.x - O.x) / q, j = $(P) * k, C = Math.min(1, P / 0.08, (1 - P) / 0.08), B = (0.55 + 0.45 * Math.sqrt(Math.max(0, C))) * (1 + r * v(P)), Y = Math.max(0.3, p(P) * B / 2), I = A.x + G * j, N = A.y + Q * j;
      M.push({ x: I + G * Y, y: N + Q * Y }), T.push({ x: I - G * Y, y: N - Q * Y });
    }), t.save(), t.globalAlpha *= b, t.fillStyle = s, So(t, [...M, ...T.reverse()], !0), t.fill(), t.restore();
  }, f = (g, p) => {
    const m = c++, b = h(m, 99, !0);
    if (b.next() < a) {
      const S = (b.next() * 2 - 1) * e.lineWidth * 1.4, $ = (b.next() * 2 - 1) * e.lineWidth * 1.4, v = g.map((x) => ({ x: x.x + S, y: x.y + $ }));
      u(v, (x) => p(x) * 1.8, h(m, 98, !0), 0.035, o), u(v, (x) => p(x) * 0.45, h(m, 97, !0), 0.12, o * 1.5);
    }
    const k = g.slice(1).reduce((S, $, v) => S + Math.hypot($.x - g[v].x, $.y - g[v].y), 0), w = p(0.5) > 4 && k > p(0.5) * 6, y = w ? [-0.3, 0.3, 0] : [0];
    for (let S = 0; S < i; S++) {
      const $ = S === 0;
      y.forEach((v, x) => {
        const M = h(m, S * 10 + x), T = v === 0 ? g : g1(g, (E) => p(E) * v * Math.sqrt(Math.sin(Math.PI * E))), A = !$ && v === 0 ? e.lineWidth * (0.3 + M.next() * 0.8) : 0;
        u(T, (E) => p(E) * (w ? 0.5 : 1) * ($ ? 1 : 0.6), M, $ ? 0.85 : 0.45, o * ($ ? 0.6 : 1), A);
      });
    }
  }, d = (g, p, m, b, k, w) => {
    const S = h(c, 50).next() * Math.PI * 2;
    f(Tr(g, p, m, b, k, S, 1.08, 48), () => w);
  };
  return {
    look: "pencil",
    ink: s,
    limb(g, p, m) {
      f(g, (b) => p + (m - p) * b);
    },
    line(g, p) {
      f(g, () => p);
    },
    shape(g, p, m) {
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, So(t, g, !0), t.fill(), t.restore()), m > 0 && f([...g, g[0]], () => m);
    },
    ellipse(g, p, m, b, k, w, y) {
      w !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = w, t.beginPath(), t.ellipse(g, p, m, b, k, 0, Math.PI * 2), t.fill(), t.restore()), d(g, p, m, b, k, y);
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
      const w = c++, y = h(w, 0), S = Tr(g, p, m, b, k, y.next() * Math.PI * 2, 1.12, 48);
      u(S, () => Math.max(0.6, e.lineWidth * 0.18), y, 0.28, o * 1.5);
    }
  };
}
const y1 = ["thumb", "index", "middle", "ring", "pinky"], It = {
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
function Ht(t = {}) {
  return { ...It, ...t };
}
const jt = (t, e, n, s, o) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": o
}), Ot = {
  relaxed: It,
  open: Ht({ ...jt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: Ht({ ...jt(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: Ht({ ...jt(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: Ht({ ...jt(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: Ht({ ...jt(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: Ht({ ...jt(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: Ht({ ...jt(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: Ht({ ...jt(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: Ht({ ...jt(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: Ht({ ...jt(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: Ht({ ...jt(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: Ht({ ...jt(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: Ht({ ...jt(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function bs(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
const b1 = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, w1 = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, ge = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, k1 = [82, 100, 62], v1 = [48, 72], M1 = 3, x1 = 13, S1 = 0.035, T1 = -0.075, E1 = [
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
], Ie = (t) => t * Math.PI / 180, Er = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], lo = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Ar = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], Qn = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Je(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = Ar(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + i[0] * o + e[0] * r * (1 - s),
    t[1] * s + i[1] * o + e[1] * r * (1 - s),
    t[2] * s + i[2] * o + e[2] * r * (1 - s)
  ];
}
const Xl = [1, 0, 0], Ul = [0, 1, 0], cs = [0, 0, 1];
function A1(t, e, n) {
  const s = Ie(t.fan * (M1 + x1 * n)), o = [Math.sin(s), Math.cos(s), 0], i = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += Ie(k1[u] * e), r.push(Er(r[u], lo(Je(o, i, -a), h)));
  });
  const l = Je(cs, i, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function $1(t, e, n = 1, s = 1) {
  const o = Math.min(1, Math.max(0, e)), i = Qn(Er(lo(Qn(ge.out), 1 - o), lo(Qn(ge.across), o))), r = Qn(Ar(cs, i)), a = Qn(Ar(i, r)), l = [[ge.base[0] * s, ge.base[1], ge.base[2]]];
  let c = 0;
  ge.bones.forEach((f, d) => {
    d > 0 && (c += Ie(v1[d - 1] * t)), l.push(Er(l[d], lo(Je(i, r, c), f)));
  });
  const h = Je(a, r, c), u = [...ge.widths, ge.widths[ge.widths.length - 1] * 0.92].map((f) => f * n);
  return { joints: l, back: h, widths: u };
}
function $r(t, e = {}) {
  const n = { ...It, ...t }, s = e.size ?? 100, o = e.side ?? "right", i = o === "left" ? -1 : 1, r = Ie(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (E) => ({
    ...E,
    knuckle: [E.knuckle[0] * c, E.knuckle[1], E.knuckle[2]],
    width: E.width * l
  }), u = Ie(n.bend ?? 0), f = Ie(n.tilt ?? 0), d = Ie(90 * (n.turn ?? 0)), g = (E) => Je(Je(Je(E, Xl, -u), cs, -f), Ul, d), p = Math.cos(r), m = Math.sin(r), b = Ie(n.roll ?? 0), k = Math.cos(b), w = Math.sin(b), y = (E) => {
    const P = E[0] * s, O = -E[1] * s, L = (P * k - O * w) * i, q = P * w + O * k;
    return { x: L * p - q * m, y: L * m + q * p };
  }, S = (E) => {
    const P = y(E), O = Math.hypot(P.x, P.y);
    return O > 1e-6 * s ? { x: P.x / O, y: P.y / O } : { x: 0, y: 0 };
  }, $ = {
    thumb: $1(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, v = a ? w1 : b1;
  for (const E of y1) {
    const P = v[E];
    P && ($[E] = A1(h(P), n[`${E}.curl`] ?? 0, n.spread ?? 0));
  }
  const x = {};
  for (const [E, P] of Object.entries($)) {
    const O = P.joints.map(g), L = g(P.back);
    x[E] = {
      points: O.map(y),
      depths: O.map((q) => q[2] * s),
      widths: P.widths.map((q) => q * s),
      nail: L[2],
      back: S(L)
    };
  }
  const M = E1.flatMap(([E, P]) => [g([E * c, P, S1]), g([E * c, P, T1])]), T = I1(M.map(y)), A = M.reduce((E, P) => E + P[2], 0) / M.length * s;
  return {
    size: s,
    side: o,
    wrist: { x: 0, y: 0 },
    palm: T,
    palmDepth: A,
    palmFacing: -g(cs)[2],
    fingers: x,
    axes: { up: S(g(Ul)), across: S(g(Xl)), out: S(g(cs)) },
    curls: Object.fromEntries(Object.keys(x).map((E) => [E, n[`${E}.curl`] ?? 0]))
  };
}
function P1(t, e) {
  const n = (o) => ({ x: o.x + e.x - t.wrist.x, y: o.y + e.y - t.wrist.y }), s = {};
  for (const [o, i] of Object.entries(t.fingers))
    s[o] = { ...i, points: i.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function I1(t) {
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
function ou(t, e, n, s) {
  if (s.mode !== "cel" || e.length < 3) return;
  const o = Math.hypot(...s.light), i = e.map((a) => {
    const l = a.x - n.x, c = a.y - n.y, h = (l * s.light[0] + c * s.light[1]) / ((Math.hypot(l, c) || 1) * o), u = Math.max(0, -h) * 0.24;
    return { x: a.x - l * u, y: a.y - c * u };
  }), r = (a) => {
    t.beginPath(), t.moveTo(a[0].x, a[0].y);
    for (const l of a.slice(1)) t.lineTo(l.x, l.y);
    t.closePath();
  };
  t.save(), r(e), t.clip(), r([...e, ...i.reverse()]), t.globalAlpha *= s.opacity, t.fillStyle = s.shadow, t.fill(), t.restore();
}
const O1 = "#f1c9a5", _1 = "#2f2f33";
function wa(t, e, n, s = {}, o = 0) {
  const i = P1($r(n, s), e), r = s.ink ?? _1, a = s.lineWidth ?? i.size * 0.035;
  let l = s.pen ?? ei(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: o,
    pencil: { construction: !1, ...s.pencil }
  });
  const c = s.skin ?? O1;
  c === "none" && (l = Is(t, l));
  const h = s.nails ?? !0, u = [
    {
      depth: i.palmDepth,
      draw: () => H1(t, l, i, c, a, s)
    }
  ];
  for (const f of Object.values(i.fingers)) {
    const d = f.depths.reduce((g, p) => g + p, 0) / f.depths.length;
    u.push({
      depth: d,
      draw: () => C1(t, l, f, c, a, h)
    });
  }
  if (s.prop) {
    const f = s.prop;
    u.push({ depth: f.depth, draw: () => f.draw(l) });
  }
  t.save(), t.lineCap = "round", t.lineJoin = "round";
  for (const f of [...u].sort((d, g) => d.depth - g.depth)) f.draw();
  return t.restore(), i;
}
function H1(t, e, n, s, o, i) {
  if (e.shape(n.palm, s === "none" ? null : s, i.connected ? 0 : o), s !== "none" && i.shading && e.look === "clean") {
    const r = n.palm.reduce((a, l) => ({ x: a.x + l.x / n.palm.length, y: a.y + l.y / n.palm.length }), { x: 0, y: 0 });
    ou(t, n.palm, r, i.shading);
  }
  if (i.connected && o > 0 && (e.look !== "silhouette" || s === "none")) {
    const { up: r } = n.axes;
    let a = [];
    for (let l = 0; l <= n.palm.length; l++) {
      const c = n.palm[l % n.palm.length], h = n.palm[(l + 1) % n.palm.length];
      ((c.x + h.x) / 2 - n.wrist.x) * r.x + ((c.y + h.y) / 2 - n.wrist.y) * r.y < n.size * 0.08 ? (a.length > 1 && e.line(a, o), a = []) : (a.length === 0 && a.push(c), a.push(h));
    }
    a.length > 1 && e.line(a, o);
  }
  if (n.palmFacing < -0.3 && e.look !== "silhouette") {
    const { up: r } = n.axes;
    for (const [a, l] of Object.entries(n.fingers)) {
      const c = n.curls[a] ?? 0;
      if (a === "thumb" || c < 0.5) continue;
      const h = l.points[0], u = l.widths[0] * 0.42, f = { x: h.x - r.x * u * 0.2, y: h.y - r.y * u * 0.2 }, d = Math.atan2(r.y, r.x), g = Array.from({ length: 7 }, (p, m) => {
        const b = d - Math.PI / 2 + Math.PI * m / 6;
        return { x: f.x + Math.cos(b) * u, y: f.y + Math.sin(b) * u };
      });
      e.line(g, o * 0.6);
    }
  }
  if (n.palmFacing > 0.45 && e.look !== "silhouette") {
    const { up: r, across: a } = n.axes, l = n.size, c = n.wrist, h = (f, d) => ({
      x: c.x + (a.x * f + r.x * d) * l,
      y: c.y + (a.y * f + r.y * d) * l
    }), u = n.side === "left" ? -1 : 1;
    e.line([h(-0.15 * u, 0.36), h(-0.04 * u, 0.3), h(0.1 * u, 0.33)], o * 0.5);
  }
}
function C1(t, e, n, s, o, i) {
  const { widths: r } = n, a = R1(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette" || s === "none") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + o * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (s === "none") {
    const p = Wt(a, h, u), m = a[a.length - 2], b = Math.atan2(c.y - m.y, c.x - m.x), k = Array.from({ length: 13 }, (w, y) => {
      const S = b + Math.PI / 2 - y * Math.PI / 12;
      return { x: c.x + Math.cos(S) * u / 2, y: c.y + Math.sin(S) * u / 2 };
    });
    e.shape([...p.slice(0, a.length), ...k.slice(1), ...p.slice(a.length)], null, o);
  } else e.limb(a, h + 2 * o, u + 2 * o);
  if (t.restore(), s !== "none" && e.look !== "silhouette" && (t.fillStyle = s, ba(t, a, h, u)), s === "none" || e.look === "silhouette" || !i || n.nail < 0.25) return;
  const f = a[a.length - 2], d = L1({ x: c.x - f.x, y: c.y - f.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - d.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - d.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(d.y, d.x), "#f8e3d3", o * 0.45);
}
function R1(t, e) {
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
const L1 = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Yt = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, W1 = 40;
function ni(t) {
  return t === void 0 ? Yt.walk : typeof t == "string" ? Yt[t] ?? Yt.walk : t;
}
function F1(t, e, n = ct, s = 1) {
  const o = ni(t);
  if (o === Yt.walk) return D1(e, n, s);
  const i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (b) => Math.abs(b) <= W1, c = o.shoulder ?? 0, h = (b, k) => l(b) ? k * c + o.arm * r : b, u = o.forearm ?? 0, f = l(n.leftShoulder) ? n.leftElbow - u - o.elbow * Math.max(0, -r) : n.leftElbow, d = l(n.rightShoulder) ? n.rightElbow + u + o.elbow * Math.max(0, r) : n.rightElbow, g = o.bounces ?? 1, p = (1 + Math.cos(i * 2 * g)) / 2, m = o.crouch ?? 0;
  return {
    ...n,
    lean: n.lean + o.lean * s + (o.sway ?? 0) * Math.sin(i) * (1 - (n.turn ?? 0)),
    bend: (n.bend ?? 0) + (o.bend ?? 0),
    headTilt: n.headTilt - o.lean * 0.5 * s + (o.headTilt ?? 0),
    leftElbow: f,
    rightElbow: d,
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
function Pr(t, e, n = 1) {
  const s = ni(t), o = Yt.walk.swing, i = (r) => Math.sin(r * Math.PI / 180);
  return B1(e, n) * i(s.swing * n) / i(o * n);
}
const ct = {
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
function Lt(t) {
  return { ...ct, ...t };
}
const iu = {
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
}, Rt = (t) => ({ ...iu, ...t }), vt = {
  neutral: iu,
  happy: Rt({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: Rt({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: Rt({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: Rt({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: Rt({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: Rt({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: Rt({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: Rt({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: Rt({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: Rt({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: Rt({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: Rt({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: Rt({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: Rt({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: Rt({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: Rt({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: Rt({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function qe(t, e) {
  return { ...t, ...typeof e == "string" ? vt[e] : e };
}
const ee = {
  rest: ct,
  wave: Lt({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...vt.happy }),
  cheer: Lt({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...vt.joyful }),
  shrug: Lt({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...vt.confused, lookX: 0, lookY: 0 }),
  point: Lt({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: Lt({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...vt.thinking }),
  handsOnHips: Lt({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: Lt({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...vt.sad }),
  surprised: Lt({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...vt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: Lt({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: Lt({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: Lt({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...vt.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: Lt({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...vt.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: Lt({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...vt.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: Lt({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...vt.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: Lt({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...vt.happy })
}, ru = Object.keys(ct);
function ws(t, e, n) {
  const s = { ...t };
  for (const o of ru) s[o] = t[o] + (e[o] - t[o]) * n;
  return s;
}
const Ir = 24, Gl = 4, Vl = 28, N1 = 40;
function D1(t, e = ct, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, o = Math.cos(t * Math.PI * 2) * n, i = (c) => Math.abs(c) <= N1, r = (c) => i(c) ? 22 * s : c, a = i(e.leftShoulder) ? e.leftElbow - Vl * Math.max(0, -s) : e.leftElbow, l = i(e.rightShoulder) ? e.rightElbow + Vl * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + Gl * n,
    headTilt: e.headTilt - Gl * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Ir * s,
    rightHip: -Ir * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, o),
    rightKnee: 30 * Math.max(0, -o),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function B1(t, e = 1) {
  return 4 * ((Or + To) * t) * Math.sin(Ir * e * Math.PI / 180);
}
function z1(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const au = 0.12, Jl = 0.46, q1 = 1 - 2 * au, Y1 = 0.1, K1 = 0.21, j1 = 0.19, Or = 0.24, To = 0.22, lu = 0.12, X1 = 0.14, cu = 0.33, Zl = 0.7, Ql = 0.3, U1 = 0.35, G1 = [1.7, 1.05], V1 = [1.3, 0.75], tc = [1.45, 0.85], J1 = [1.15, 0.75], ec = 0.06, Z1 = 0.7, Q1 = 0.65, hu = 0.075, ty = 0.3, ey = 0.02, ny = 0.012, sy = 12, oy = 0.25, Ds = 90, iy = 0.25, ry = 0.04, uu = 0.01, Ye = (t) => Math.min(1, Math.max(0, t ?? 0));
function Jx(t, e = 1) {
  return To * t * e;
}
const _r = -0.12, fu = 0.4, Qt = (t) => t * Math.PI / 180, ay = (t, e) => ({ x: e * Math.sin(Qt(t)), y: Math.cos(Qt(t)) }), du = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), pu = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function ly(t, e, n, s, o, i) {
  const r = Math.max(1, Math.min(i * 0.6, X1 * n)), a = Ye(e.turn), l = (lu + cu * a) * n, c = s + _r * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, f = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - Zl * a), squeeze: 1 - Zl * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Ql * a), squeeze: 1 - Ql * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = o, t.strokeStyle = o, t.lineWidth = r;
  for (const b of f) {
    const k = du(b.open, e.blink);
    if (k < 0.2) {
      const $ = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(b.x + l - 0.12 * n, c), t.quadraticCurveTo(b.x + l, c + $, b.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (k > 1.2) {
        const v = 0.13 * n * k;
        t.beginPath(), t.ellipse(b.x + l, c, v * 0.85, v, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = o;
      }
      const $ = k > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(b.x + h, c + u, $, $ * 1.1 * Math.min(k, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const w = pu(c, n, b.brow, k), y = b.x + l - b.side * 0.13 * n * b.squeeze, S = b.x + l + b.side * 0.13 * n * b.squeeze;
    t.beginPath(), t.moveTo(S, w), t.lineTo(y, w - e.browTilt * 0.1 * n), t.stroke();
  }
  const d = s + fu * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - U1 * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, d), t.quadraticCurveTo(l, d + e.smile * 0.25 * n, l + g, d), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, d - 0.05 * n), t.lineTo(l + g, d - 0.05 * n), t.quadraticCurveTo(l, d + m * 2, l - g, d - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, d + m * 0.6), t.lineTo(l + g, d + m * 0.6), t.quadraticCurveTo(l, d - m * 1.4, l - g, d + m * 0.6)) : t.ellipse(l, d, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function gu(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), o = Math.sqrt(s), i = e.armLength ?? 1;
  if (!Number.isFinite(i) || i <= 0) throw new Error("stick figure: armLength must be a positive finite multiplier");
  const r = (e.headSize ?? 2 * au) / 2, a = e.headSize === void 0 ? q1 : 1 - 2 * r, l = r * n, c = Ye(t.sit), h = t.leftHip + (-Ds - t.leftHip) * c, u = t.leftKnee + (-Ds - t.leftKnee) * c, f = t.rightHip + (Ds - t.rightHip) * c, d = t.rightKnee + (Ds - t.rightKnee) * c, g = e.classic === !0, p = Ye(t.turn), m = (j, C, B, Y, I) => {
    const N = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Qt(C - B) / 2) + Qt(Y))), nt = Math.max(-1, Math.min(1, Z1 + I)), H = p + (1 - p) * j * nt;
    return g ? { x: 0, y: 0 } : { x: Math.cos(N) * ec * H, y: Math.sin(N) * ec };
  }, b = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, k = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let w = 0;
  if (c > 0 || !g) {
    const j = (I, N, nt, H, R) => Or * Math.cos(Qt(N)) + To * Math.cos(Qt(N - nt)) + Math.max(0, m(I, N, nt, H, R).y), C = Math.max(
      j(-1, h, u, b.left, k.left),
      j(1, f, d, b.right, k.right)
    ), B = 1 - Ye((t.rise ?? 0) / ry), Y = (g ? Math.min(1, c / iy) : 1) * B;
    w = (Jl - C) * Y * n * s;
  }
  const y = -Jl * n * s + w, S = -a * n * s + w, $ = g ? 0 : (ey * Ye(t.turn) + ny * c) * n * s, v = Qt(t.bend ?? 0), x = { end: sc(y, S, v, 1), bend: v };
  let M;
  if (v !== 0) {
    M = [];
    for (let j = 0; j <= nc; j++) {
      const C = j / nc, B = sc(y, S, v, C);
      M.push({ x: B.x - $ * Math.sin(Math.PI * C), y: B.y });
    }
  } else
    M = $ === 0 ? [{ x: 0, y }, { x: 0, y: S }] : Dn({ x: 0, y }, { x: -$, y: (y + S) / 2 }, { x: 0, y: S }, 1, 8);
  const T = S + Y1 * n * s, A = (e.shoulderWidth ?? 0) * n * Math.cos(p * Math.PI / 2), E = (j, C, B, Y, I) => {
    const N = ay(B, Y);
    return { x: j + N.x * I * n, y: C + N.y * I * n };
  }, P = (j, C, B) => {
    const Y = E(0, y, C, j, Or * s);
    return { root: { x: 0, y }, joint: Y, end: E(Y.x, Y.y, C - B, j, To * s) };
  }, O = (j, C, B) => {
    const Y = { x: j * A, y: T }, I = E(Y.x, Y.y, C, j, K1 * o * i);
    return { root: Y, joint: I, end: E(I.x, I.y, C + B, j, j1 * o * i) };
  }, L = { left: P(-1, h, u), right: P(1, f, d) }, q = (j, C, B, Y, I, N) => {
    const nt = m(j, B, Y, I, N);
    return { x: C.end.x + nt.x * n * s, y: C.end.y + nt.y * n * s };
  }, G = (j, C, B, Y, I) => E(C.end.x, C.end.y, B + Y + I, j, hu * o), Q = {
    left: O(-1, t.leftShoulder, t.leftElbow),
    right: O(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(g ? 0 : ty, e.rubber ?? 0)),
    r: l,
    // The head keeps its area: taller and narrower when stretched.
    headRx: l / Math.sqrt(s),
    headRy: l * Math.sqrt(s),
    hipY: y,
    neckY: S,
    drop: w,
    lean: g ? t.lean : t.lean + sy * Math.sin(Math.PI * c),
    classic: g,
    legs: L,
    toes: {
      left: q(-1, L.left, h, u, b.left, k.left),
      right: q(1, L.right, f, d, b.right, k.right)
    },
    spine: M,
    chest: x,
    arms: Q,
    handTips: {
      left: G(-1, Q.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: G(1, Q.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const nc = 10;
function sc(t, e, n, s) {
  const o = t - e, i = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - o * s };
  const r = o / n;
  return { x: r * (1 - Math.cos(i)), y: t - r * Math.sin(i) };
}
function cy(t, e) {
  if (t.chest.bend === 0) return e;
  const n = ks(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const as = (t, e) => e === 0 ? [t.root, t.joint, t.end] : Dn(t.root, t.joint, t.end, e);
function ks(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = t.x - e.x, r = t.y - e.y;
  return { x: e.x + i * s - r * o, y: e.y + i * o + r * s };
}
function mu(t, e, n = !0) {
  const s = uy(t, e), o = e.spin ?? 0, i = e.rise ?? 0;
  return n && (o !== 0 || i !== 0) ? hy(s, t, o, i) : s;
}
function yu(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Qt(e), lift: n * t.height };
}
function hy(t, e, n, s) {
  const { pivot: o, angle: i, lift: r } = yu(e, n, s), a = (f) => {
    const d = ks(f, o, i);
    return { x: d.x, y: d.y - r };
  }, l = (f) => ({ left: a(f.left), right: a(f.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = uu * e.height;
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
function uy(t, e) {
  const n = Qt(t.lean), s = Qt(e.headTilt), o = { x: 0, y: t.hipY }, i = (y) => ({ x: t.facing * y.x, y: y.y }), r = (y) => i(ks(y, o, n)), a = (y) => r(cy(t, y)), l = (y) => a(ks({ x: y.x, y: y.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = as(t.arms.left, t.rubber).map(a), h = as(t.arms.right, t.rubber).map(a), u = (y, S) => Math.atan2(S.y - y.y, S.x - y.x), f = { left: a(t.handTips.left), right: a(t.handTips.right) }, d = (y, S) => {
    const [$, v] = y.slice(-2), x = t.arms[S], M = u(a(x.end), f[S]) - u(a(x.joint), a(x.end));
    return u($, v) + M;
  };
  let g = 1 / 0;
  for (const [y, S] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const $ = pu(_r, 1, y, du(S, e.blink));
    g = Math.min(g, $, $ - e.browTilt * 0.1);
  }
  const p = { left: i(t.legs.left.end), right: i(t.legs.right.end) }, m = { left: i(t.toes.left), right: i(t.toes.right) }, b = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, k = Math.max(b.left, b.right), w = uu * t.height;
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
    fingertips: f,
    handAngle: { left: d(c, "left"), right: d(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: as(t.legs.left, t.rubber).map(i),
      rightLeg: as(t.legs.right, t.rubber).map(i),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: _r,
      browTopY: g,
      mouthY: fu,
      faceX: t.facing * (lu + cu * Ye(e.turn))
    }
  };
}
function he(t, e = {}) {
  return mu(gu(t, e), t);
}
function Zx(t, e, n) {
  return ks({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function fy(t, e, n) {
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
function dy(t, e, n = {}, s = 0) {
  const o = gu(e, n), i = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? mu(o, e, !1) : void 0, l = n.sketch ? Sr(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Sr(t, n.sketch, s) : void 0, h = (v) => {
    t.save(), v(), t.restore();
  }, u = (v) => {
    v && a && h(() => v(t, a, s, c));
  }, f = () => t.scale(o.facing, 1), d = () => {
    f(), t.translate(0, o.hipY), t.rotate(Qt(o.lean)), t.translate(0, -o.hipY);
  }, g = () => {
    d(), o.chest.bend !== 0 && (t.translate(o.chest.end.x, o.chest.end.y), t.rotate(o.chest.bend), t.translate(0, -o.neckY));
  }, p = (v, x, M) => {
    if (l) return x ? l.curve(v) : l.line(v);
    if (o.classic) {
      t.beginPath(), t.moveTo(v[0].x, v[0].y);
      for (const T of v.slice(1)) t.lineTo(T.x, T.y);
      t.stroke();
      return;
    }
    ba(t, v, M[0] * o.lineWidth, M[1] * o.lineWidth);
  }, m = (v, x) => p(as(v, o.rubber), o.rubber > 0, x), b = (v) => {
    o.classic || p([o.legs[v].end, o.toes[v]], !1, J1);
  }, k = (v) => {
    if (n.hands && !o.classic) return y(v);
    if (o.classic || l) return;
    const x = o.arms[v].end;
    t.beginPath(), t.arc(x.x, x.y, Q1 * o.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = i, t.fillStyle = i, t.lineWidth = o.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const w = yu(o, e.spin ?? 0, e.rise ?? 0);
  (w.angle !== 0 || w.lift !== 0) && (t.translate(0, -w.lift), t.translate(w.pivot.x, w.pivot.y), t.rotate(w.angle), t.translate(-w.pivot.x, -w.pivot.y));
  function y(v) {
    const x = n.hands ?? {}, M = o.arms[v].end, T = o.handTips[v], A = n.headFill ?? "#ffffff";
    wa(t, M, x[v] ?? It, {
      side: v,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2(T.x - M.x, M.y - T.y) * 180 / Math.PI,
      size: (x.size ?? hu) * o.height * Math.sqrt(o.stretch),
      skin: x.skin ?? (A === "none" ? void 0 : A),
      ink: i,
      lineWidth: o.lineWidth * 0.45,
      fingers: x.fingers,
      plump: x.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const S = (v) => {
    h(() => {
      g(), m(o.arms[v], V1), k(v);
    });
    const x = r.sleeve;
    x && a && h(() => x(t, a, v, s, c));
  }, $ = Ye(e.turn) > oy;
  u(r.behind), h(() => {
    f(), m(o.legs.left, tc), b("left"), m(o.legs.right, tc), b("right");
  }), $ && S("left"), h(() => {
    d(), p(o.spine, o.spine.length > 2, G1);
  }), h(() => {
    g();
    const { left: v, right: x } = { left: o.arms.left.root, right: o.arms.right.root };
    if (v.x !== x.x)
      if (o.classic) p([v, x], !1, [1, 1]);
      else {
        const M = { x: (v.x + x.x) / 2, y: v.y - 0.3 * Math.abs(x.x - v.x) };
        p(Dn(v, M, x, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), $ || S("left"), S("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, o.neckY), t.rotate(Qt(e.headTilt));
    const v = -o.headRy;
    t.beginPath(), t.ellipse(0, v, o.headRx, o.headRy, 0, 0, Math.PI * 2);
    const x = n.headFill ?? "#ffffff";
    if (x !== "none" && (t.fillStyle = x, t.fill()), l) {
      l.ellipse(0, v, o.headRx, o.headRy);
      const M = l.nudge();
      t.translate(M.x, M.y);
    } else
      t.stroke();
    t.translate(0, v), t.scale(o.headRx / o.r, o.headRy / o.r), ly(t, e, o.r, 0, i, o.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = i, t.font = n.labelFont ?? `700 ${Math.round(o.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -o.height * o.stretch - 0.04 * o.height + o.drop), t.restore());
}
function bu(t, e, n, s) {
  const o = { ...t }, i = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? ws(o, F1(i, t.walk, o), t.walking) : o, a = gy(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = ws(r, c.pose, l), c.hands) {
      const h = (u, f) => f ? bs(u ?? It, f, l) : u;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * z1(e)) }), { pose: r, hands: a };
}
function py(t, e, n, s) {
  return bu(t, e, n, s).pose;
}
const wu = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, Eo = (t, e) => `hand.${t}.${e}`;
function gy(t) {
  const e = (o) => {
    if (typeof t[Eo(o, "spread")] == "number")
      return Object.fromEntries(Object.keys(It).map((i) => [i, t[Eo(o, i)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function my(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function ku(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, o = { ...Lt(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, i = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? It;
      for (const l of Object.keys(It)) i[Eo(r, l)] = a[l] ?? It[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...o, ...i },
    about: yy(Object.keys(i), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = bu(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), dy(r, h.pose, my({ ...e, rubber: c.rubber, facing: wu(c, e) }, h.hands), l);
    }
  };
}
function yy(t, e) {
  const n = { ...Z0, ...Q0 };
  for (const s of t) {
    const [, o, ...i] = s.split("."), r = tu[i.join(".")];
    r && (n[s] = { ...r, description: `${o === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return h1(e);
    }
  };
}
function vu(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (o.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? i = h : c === "y" || c === "motionPathY" ? r = h : c in o && (o[c] = h));
  const a = py(o, e.time, t.figureDance, t.figureGaits), l = he(a, { ...s, rubber: o.rubber, facing: wu(o, s) });
  return { pose: a, joints: fy(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function ka(t) {
  const e = [];
  return t.forEach((n, s) => {
    const o = s === 0 ? ct : e[s - 1], i = typeof n.pose == "string" ? ee[n.pose] : { ...o, ...n.pose };
    e.push(n.expression ? qe(i, n.expression) : i);
  }), e;
}
function Qx(t, e) {
  const n = ka(e);
  return ru.filter((s) => n.some((o) => o[s] !== ct[s])).map((s) => ({
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
const Hi = 0.5, Hr = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: Ht({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: Ht({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: Ht({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: Ot.fist,
  /** Fist, thumb up */
  shikhara: Ot.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: Ht({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: Ht({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function Ao(t) {
  return typeof t != "string" ? t : t in Hr ? Hr[t] : Ot[t];
}
function Mu(t, e, n) {
  const s = [];
  for (const o of t.keys) {
    const i = s[s.length - 1], r = !i || o.reset ? { pose: e, ...n } : i;
    s.push({
      beat: o.beat,
      pose: { ...r.pose, ...o.pose },
      left: o.hands?.left ? Ao(o.hands.left) : r.left,
      right: o.hands?.right ? Ao(o.hands.right) : r.right,
      easing: o.easing ?? t.easing
    });
  }
  return s;
}
const va = (t, e) => (t % e + e) % e;
function by(t, e, n, s) {
  const o = Mu(t, n, s);
  if (o.length === 0) return { pose: n, hands: s };
  const i = va(e, t.beats);
  let r = o.length - 1;
  for (let d = 0; d < o.length; d++) o[d].beat <= i && (r = d);
  const a = o[r], l = o[(r + 1) % o.length], c = a.beat <= i ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (i - c) / (h - c) : 0, f = Ft(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: ws(a.pose, l.pose, f),
    hands: { left: bs(a.left, l.left, f), right: bs(a.right, l.right, f) }
  };
}
const wy = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], ky = ["lean", "headTilt", "lookX", "spin"], vy = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function My(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, o] of wy) {
    const i = n && vy.has(s) ? -1 : 1;
    e[s] = i * t[o], e[o] = i * t[s];
  }
  if (!n) for (const s of ky) e[s] = -t[s];
  return e;
}
const xy = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function Sy(t, e, n) {
  const s = va(n, 1), o = (1 + Math.cos(2 * Math.PI * s)) / 2, i = e.bounce * (e.accent === "up" ? 1 - o : o), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = xy(r);
  return {
    ...t,
    leftHip: t.leftHip + a * i / 2,
    rightHip: t.rightHip + i / 2,
    leftKnee: t.leftKnee + a * i,
    rightKnee: t.rightKnee + i,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function Cr(t) {
  const e = { ...ct, ...t.stance };
  return t.expression ? qe(e, t.expression) : e;
}
function xu(t) {
  return {
    left: t.hands?.left ? Ao(t.hands.left) : It,
    right: t.hands?.right ? Ao(t.hands.right) : It
  };
}
function Ci(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const o = by(s, n, Cr(t), xu(t));
  return e.mirror ? { pose: My(o.pose), hands: { left: o.hands?.right, right: o.hands?.left } } : o;
}
function Ma(t, e, n = {}) {
  const s = typeof t == "string" ? an[t] : t;
  let o;
  if (n.move)
    o = Ci(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const i = s.routine, r = i.reduce((u, f) => u + f.beats, 0), a = va(e, r);
    let l = 0, c = 0;
    for (; c < i.length - 1 && a >= l + i[c].beats; ) l += i[c++].beats;
    const h = a - l;
    if (o = Ci(s, i[c], h), h < Hi && i.length > 1 && e >= Hi) {
      const u = i[(c - 1 + i.length) % i.length], f = Ci(s, u, u.beats + h), d = Ft("ease-in-out")(h / Hi);
      o = {
        pose: ws(f.pose, o.pose, d),
        hands: { left: bs(f.hands.left, o.hands.left, d), right: bs(f.hands.right, o.hands.right, d) }
      };
    }
  }
  return { ...o, pose: Sy(o.pose, s.groove, e) };
}
function tS(t, e, n = {}) {
  return Ma(t, e, n).pose;
}
function xa(t) {
  return (typeof t == "string" ? an[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const Ty = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function oc(t, e, n, s, o, i, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < i || h >= r))
        for (const u of l.taps ?? []) o.push({ beat: h, tap: s ? Ty[u] : u });
    }
}
function eS(t, e, n, s = {}) {
  const o = typeof t == "string" ? an[t] : t, i = [];
  if (n <= e) return i;
  if (s.move) {
    const r = o.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    oc(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, i, e, n);
  } else {
    const r = xa(o);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of o.routine)
        oc(o.moves[c.move], l, c.beats, c.mirror, i, e, n), l += c.beats;
    }
  }
  return i.sort((r, a) => r.beat - a.beat);
}
function ic(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (Mu(n, Cr(t), xu(t))[0]?.pose.turn ?? Cr(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function Su(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function Ri(t, e, n = {}) {
  const s = typeof t == "string" ? an[t] : t, o = Su(s, n), i = o.reduce((h, u) => h + u.beats, 0), r = o.reduce((h, u) => h + ic(s, u) * u.beats, 0), a = Math.floor(e / i);
  let l = a * r, c = e - a * i;
  for (const h of o) {
    const u = Math.min(h.beats, c);
    if (l += ic(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function Ey(t, e, n) {
  const s = Su(t, n), o = [0];
  let i = 0;
  for (let r = 0; i < e; r = (r + 1) % s.length)
    i += s[r].beats, o.push(Math.min(i, e));
  return o;
}
const Ay = 8;
function $y(t, e, n) {
  const s = typeof e == "string" ? an[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : xa(s)), r = Ey(s, i, n);
  if (r.every((b) => Ri(s, b, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, i / 2), l = Ft("ease-in-out"), c = (b) => a <= 0 ? 1 : Math.min(l(Math.min(1, b / a)), l(Math.min(1, (i - b) / a))), h = Math.ceil(a * Ay), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (b, k) => [k / h * a, i - k / h * a]).flat(), f = [.../* @__PURE__ */ new Set([...r, ...u])].sort((b, k) => b - k);
  let d = 0;
  const g = f.map((b, k) => {
    if (k > 0) {
      const w = f[k - 1], y = Math.max(1, Math.ceil((b - w) * 16));
      for (let S = 0; S < y; S++) {
        const $ = w + (b - w) * S / y, v = w + (b - w) * (S + 1) / y;
        d += (Ri(s, v, n) - Ri(s, $, n)) * c(($ + v) / 2);
      }
    }
    return { beat: b, travel: d };
  }), p = n.start ?? 0, m = n.x ?? 0;
  return {
    id: `${t}-x`,
    target: t,
    property: "x",
    keyframes: g.map((b) => ({ time: p + b.beat * 6e4 / o, value: m + n.height * b.travel, easing: "linear" }))
  };
}
function nS(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function sS(t, e = {}) {
  return (n) => Ma(t, n, e);
}
function oS(t, e) {
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
function iS(t, e, n = {}) {
  const s = typeof e == "string" ? an[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : xa(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(i * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const b = m / r;
    return { time: a + b * 6e4 / o, frame: Ma(s, b, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((b) => ({ time: b.time, value: m(b.frame) }))
  }), f = Object.keys(ct).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== ct[p]).map((p) => h(p, (m) => m.pose[p])), d = n.height === void 0 ? void 0 : $y(t, s, { ...n, bpm: o, beats: i, start: a, height: n.height, fade: 0 });
  if (d && f.push(d), n.hands === !1) return f;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys(It)) {
      const b = (k) => k.hands?.[p]?.[m] ?? It[m];
      c.some((k) => b(k.frame) !== It[m]) && g.push(h(Eo(p, m), b));
    }
  return [...f, ...g];
}
const hs = { type: "back", mode: "out", overshoot: 1.1 }, qt = "ease-out-cubic", Py = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: qt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: qt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: qt },
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
}, Iy = {
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
}, Oy = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: qt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: qt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: qt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: hs },
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
}, _y = {
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
        hands: e === 0 ? { left: { ...Ot.spread, turn: 2 }, right: { ...Ot.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: qt },
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
}, Hy = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: hs,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: hs },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: hs },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: qt,
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
}, Cy = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ...Ot.cupped, roll: -30 }, left: { ...Ot.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Ot.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ...Ot.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ...Ot.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ...Ot.open, turn: 2 } }, easing: qt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: qt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: qt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: qt }
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
}, Ry = {
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
}, Ly = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Wy = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Ly, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, Fy = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ...Ot.spread, turn: 2 }, right: { ...Ot.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: qt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: qt },
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
}, Ny = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ...Ot.spread, turn: 2 }, right: { ...Ot.spread, turn: 2 } } },
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
}, Dy = {
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
          easing: hs
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
}, an = {
  disco: Py,
  hipHop: Iy,
  breaking: Oy,
  jazz: _y,
  kpop: Hy,
  bollywood: Cy,
  bhangra: Ry,
  bharatanatyam: Wy,
  charleston: Fy,
  tap: Ny,
  popping: Dy
}, Rr = {
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
}, Li = 0.215, Wi = 0.205, By = 0.065, rc = 0.035, zy = 0.165, qy = 0.155, Yy = 12, Ky = 0.3, jy = 0.7, Xy = 0.35, Uy = (t) => t * Math.PI / 180, ht = {
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
function wt(t = {}) {
  return { ...ht, ...t };
}
const Gy = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX", "hair.swing"]);
function Vy(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const o = n.replace(/(^|\.)(left|right)(\.|$)/, (i, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[o] = Gy.has(n) ? -s : s;
  }
  return e;
}
function xt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}
const fe = {
  rest: ht,
  wave: wt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: wt({ ...xt("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: wt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: wt({ ...xt("arm", { spread: 50, bend: -105, elbow: 0 }), ...xt("leg", { spread: 9 }), smile: 0.8 }),
  think: wt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: wt({ ...xt("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: wt({ ...xt("leg", { swing: 90, knee: 90, spread: 4 }), ...xt("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: wt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...xt("arm", { swing: 20, elbow: 30 })
  }),
  crouch: wt({ ...xt("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...xt("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: wt({ lean: 82, "head.nod": -35, ...xt("arm", { swing: 80, elbow: 0, spread: 4 }), ...xt("leg", { knee: 92, ankle: -88 }) }),
  lieDown: wt({ roll: 90, ...xt("arm", { spread: 8 }), "head.nod": 0 }),
  // Everyday actions (the motion and everyday-life reference sheets). Hands that hold
  // something are where its grip goes: see `holding` and `handGrip`.
  sleep: wt({ roll: 90, ...xt("arm", { spread: 8, swing: 20, elbow: 40 }), "leg.left.knee": 20, "leg.left.swing": 15, blink: 1, smile: 0.2 }),
  stretch: wt({ side: -16, "arm.left.spread": 165, "arm.left.bend": 35, "arm.left.elbow": 0, "arm.right.spread": 40, "arm.right.bend": -110, "arm.right.elbow": 0, "head.tilt": -10, "eye.left": 0, "eye.right": 0, smile: 0.4 }),
  sitFloor: wt({ ...xt("leg", { swing: 80, spread: 22, rotate: 75, knee: 145 }), ...xt("arm", { swing: 25, spread: 18, elbow: 30 }), lean: 5, smile: 0.5 }),
  carry: wt({ ...xt("arm", { spread: 16, elbow: 4 }), lean: -3, smile: 0.4 }),
  cane: wt({ "arm.right.swing": 16, "arm.right.spread": 10, "arm.right.elbow": 0, "arm.right.bend": 0, "arm.left.swing": 2, side: -3, lean: 4, "leg.right.swing": 4, smile: 0.3 }),
  lift: wt({ ...xt("arm", { swing: 28, spread: 24, elbow: 85, bend: -45 }), ...xt("leg", { swing: 12, knee: 22, spread: 6 }), lean: -4, smile: 0.2 }),
  push: wt({ lean: 28, ...xt("arm", { swing: 82, spread: 12, elbow: 18 }), "leg.left.swing": 28, "leg.left.knee": 30, "leg.right.swing": -28, "leg.right.knee": 6, "head.nod": -20, browTilt: -0.6, smile: -0.2 }),
  pull: wt({ lean: -22, ...xt("arm", { swing: 70, spread: 6, elbow: 0 }), "leg.left.swing": 32, "leg.left.knee": 8, "leg.right.swing": -8, "leg.right.knee": 34, "head.nod": 12, browTilt: -0.6, smile: -0.2 }),
  drink: wt({ "arm.right.swing": 85, "arm.right.spread": 8, "arm.right.elbow": 120, "arm.right.bend": 0, "head.nod": -14, "eye.left": 0.5, "eye.right": 0.5, smile: 0 }),
  phone: wt({ "arm.right.swing": 80, "arm.right.spread": 8, "arm.right.elbow": 80, "arm.right.bend": -10, "head.nod": 18, lookY: 0.7, lookX: -0.3, smile: 0.4 }),
  read: wt({ ...xt("arm", { swing: 32, spread: 10, elbow: 82, bend: -28 }), "head.nod": 22, lookY: 0.8, smile: 0.2 }),
  type: wt({ ...xt("leg", { swing: 90, knee: 90, spread: 4 }), ...xt("arm", { swing: 40, spread: 10, elbow: 55, bend: -20 }), lean: 8, "head.nod": 10, lookY: 0.5, smile: 0 })
}, Jy = ["round", "flat", "pointed", "big"], Zy = {
  round: { length: 1, width: [0.95, 0.7] },
  flat: { length: 1.12, width: [0.85, 0.85] },
  pointed: { length: 1.25, width: [1, 0.3] },
  big: { length: 1.5, width: [1.25, 1.1] }
};
function Tu(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, o = t.legLength ?? 1, i = t.armLength ?? 1, r = Zy[t.feet ?? "round"], a = Math.max(0.12, 1 - e - rc - (Li + Wi) * o), l = (u) => ({
    id: `arm.${u}`,
    parent: "spine",
    offset: [(u === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: u === "left" ? 1 : -1,
    bones: [
      { length: zy * i, width: [1.25, 0.9] },
      { length: qy * i, width: [0.9, 0.75] }
    ]
  }), c = (u) => ({
    id: `leg.${u}`,
    parent: null,
    offset: [(u === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: u === "left" ? 1 : -1,
    bones: [
      { length: Li * o, width: [1.45, 1.05] },
      { length: Wi * o, width: [1.05, 0.85] },
      { length: By * Math.sqrt(o) * r.length, width: r.width }
    ]
  }), h = (u, f) => u[f] ?? ht[f] ?? 0;
  return {
    id: "human",
    hipHeight: (Li + Wi) * o,
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
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: rc, width: [1, 0.9] }] },
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
    angles(u, f) {
      if (f.id === "spine") {
        const k = -h(u, "lean") / 2, w = h(u, "side") / 2, y = -h(u, "bend");
        return [
          { swing: k + y * Ky, spread: w },
          { swing: k + y * jy, spread: w }
        ];
      }
      if (f.id === "neck") return [{ swing: -h(u, "bend") * Xy, spread: 0 }];
      const [d, g] = f.id.split("."), p = (k) => h(u, `${d}.${g}.${k}`);
      if (d === "arm")
        return [
          { swing: p("swing"), spread: p("spread") },
          { swing: p("elbow"), spread: p("bend") }
        ];
      const m = (f.side ?? 1) * p("rotate"), b = 1 - Math.cos(Uy(p("rotate")));
      return [
        { swing: p("swing"), spread: p("spread"), yaw: m },
        { swing: -p("knee"), spread: 0, yaw: m },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + p("ankle") - b * (p("swing") - p("knee")), spread: 0, yaw: (Yy + p("toeOut")) * (f.side ?? 1) }
      ];
    },
    withAngles(u, f, d) {
      const [g, p] = f.id.split("."), m = (b) => `${g}.${p}.${b}`;
      return g === "arm" ? {
        ...u,
        [m("swing")]: d[0].swing,
        [m("spread")]: d[0].spread,
        [m("elbow")]: d[1].swing,
        [m("bend")]: d[1].spread
      } : g === "leg" ? { ...u, [m("swing")]: d[0].swing, [m("spread")]: d[0].spread, [m("knee")]: -d[1].swing } : u;
    },
    boneScale(u, f) {
      const d = Math.min(3, Math.max(0.3, h(u, "stretch")));
      return f?.id.startsWith("arm.") ? Math.sqrt(d) : d;
    },
    headPose(u) {
      const f = Math.min(3, Math.max(0.3, h(u, "stretch")));
      return {
        yaw: h(u, "head.turn"),
        nod: h(u, "head.nod"),
        tilt: h(u, "head.tilt"),
        // The head keeps its area: taller and narrower when stretched.
        sx: 1 / Math.sqrt(f),
        sy: Math.sqrt(f)
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
function rS(t) {
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
const Qy = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, tb = { blush: 0, tears: 0, sweat: 0, pupil: 1, lid: 0, bulge: 0 }, ln = Object.fromEntries(
  Object.entries(vt).map(([t, e]) => [
    t,
    { ...Object.fromEntries(Object.entries(e).map(([n, s]) => [Qy[n] ?? n, s])), ...tb }
  ])
);
ln.crying.tears = 1;
ln.scared.sweat = 0.8;
ln.scared.bulge = 0.4;
ln.sleepy.lid = 0.5;
ln.worried.sweat = 0.6;
const Jt = (t) => ({ ...ln.neutral, ...t }), Eu = {
  ...ln,
  laughing: Jt({ mouth: 0.75, smile: 1, mouthWidth: 1.25, "eye.left": 0, "eye.right": 0, "brow.left": 0.5, "brow.right": 0.5 }),
  afraid: Jt({ mouth: 0.4, smile: -0.6, mouthWidth: 0.9, "eye.left": 1.3, "eye.right": 1.3, "brow.left": 0.6, "brow.right": 0.6, browTilt: 1, sweat: 1, pupil: 0.8, bulge: 0.5 }),
  bored: Jt({ smile: -0.05, mouthWidth: 0.6, "eye.left": 0.45, "eye.right": 0.45, "brow.left": -0.4, "brow.right": -0.4, lookX: 0.5 }),
  tired: Jt({ mouth: 0.2, smile: -0.3, mouthWidth: 0.7, "eye.left": 0.3, "eye.right": 0.3, "brow.left": -0.1, "brow.right": -0.1, browTilt: 0.6, lookY: 0.6 }),
  embarrassed: Jt({ smile: 0.4, mouthWidth: 0.7, "eye.left": 0.9, "eye.right": 0.9, browTilt: 0.7, "brow.left": 0.2, "brow.right": 0.2, lookX: -0.6, lookY: 0.5, blush: 1 }),
  proud: Jt({ smile: 0.75, mouthWidth: 1, "eye.left": 0.75, "eye.right": 0.75, "brow.left": 0.5, "brow.right": 0.5, lookY: -0.2 }),
  determined: Jt({ smile: 0.35, mouthWidth: 0.8, "eye.left": 0.85, "eye.right": 0.85, "brow.left": -0.5, "brow.right": -0.5, browTilt: -0.9 }),
  affectionate: Jt({ smile: 0.85, "eye.left": 0, "eye.right": 0, "brow.left": 0.3, "brow.right": 0.3, blush: 0.8 }),
  hurt: Jt({ smile: -0.7, mouthWidth: 0.8, "eye.left": 1.1, "eye.right": 1.1, "brow.left": 0.2, "brow.right": 0.2, browTilt: 1, lookY: 0.3, tears: 0.35 }),
  suspicious: Jt({ smile: -0.25, mouthWidth: 0.7, "eye.left": 0.5, "eye.right": 0.85, "brow.left": -0.6, "brow.right": 0.4, browTilt: -0.3, lookX: 0.8, lid: 0.3 }),
  relieved: Jt({ smile: 0.7, "eye.left": 0, "eye.right": 0, "brow.left": 0.4, "brow.right": 0.4, browTilt: 0.4 }),
  excited: Jt({ mouth: 0.6, smile: 1, mouthWidth: 1.1, "eye.left": 1.4, "eye.right": 1.4, "brow.left": 0.9, "brow.right": 0.9, blush: 0.4, pupil: 1.3 })
}, Zt = (t) => t * Math.PI / 180;
function Sa([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t, e * o + n * i, -e * i + n * o];
}
function Os([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - e * i, t * i + e * o, n];
}
function Gt([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o + n * i, e, -t * i + n * o];
}
const xe = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], $o = (t, e) => [t[0] * e, t[1] * e, t[2] * e], co = (t, e) => Os(Sa(t, e.swing), e.spread);
function Bs(t, e) {
  const n = Gt(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function si(t, e, n) {
  const s = n, i = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const b = p.at ?? (m ? m.joints3.length - 1 : 0), k = m ? m.joints3[b] : i, w = m ? m.frames[Math.max(0, b - 1)] : { swing: 0, spread: 0 }, y = p.offset ? xe(k, co($o(p.offset, s), w)) : k, S = p.side ?? 1, $ = t.boneScale?.(e, p) ?? 1, v = t.angles(e, p), x = [y], M = [];
    let T = w.swing, A = w.spread;
    p.bones.forEach((E, P) => {
      const O = v[P] ?? { swing: 0, spread: 0 };
      T += Zt(O.swing), A += Zt(O.spread) * S, M.push({ swing: T, spread: A });
      const L = Gt(co(p.rest, { swing: T, spread: A }), Zt(O.yaw ?? 0));
      x.push(xe(x[P], $o(L, E.length * s * $)));
    }), r[p.id] = { joints3: x, frames: M };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, f = h * l.sy, d = (p) => co(Gt(Sa(Os(p, -Zt(l.tilt)), -Zt(l.nod)), Zt(l.yaw)), c), g = xe(a.joints3[a.joints3.length - 1], d([0, f, 0]));
  return { height: s, root: i, chains: r, head: { center: g, rx: u, ry: f, toBody: d } };
}
function Ta(t, e, n) {
  const s = n.height, o = Zt(90 * (e.turn ?? 0)), i = si(t, e, s), { root: r } = i, a = i.chains, { rx: l, ry: c } = i.head, h = i.head.toBody, u = i.head.center, f = {};
  for (const M of t.chains) {
    const { joints3: T, frames: A } = a[M.id], E = T.map((P) => Bs(P, o));
    f[M.id] = {
      id: M.id,
      joints3: T,
      frames: A,
      points: E.map((P) => P.point),
      depths: E.map((P) => P.depth)
    };
  }
  const d = Bs(u, o), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((M) => Gt(h(M), o)), p = Bs(r, o).point, m = Zt(e.roll ?? 0), b = (M) => {
    const T = M.x - p.x, A = M.y - p.y;
    return { x: p.x + T * Math.cos(m) - A * Math.sin(m), y: p.y + T * Math.sin(m) + A * Math.cos(m) };
  }, k = ([M, T, A]) => [M * Math.cos(m) + T * Math.sin(m), -M * Math.sin(m) + T * Math.cos(m), A];
  for (const M of Object.values(f)) M.points = M.points.map(b);
  const w = {
    center: b(d.point),
    depth: d.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(k)
  }, y = w.axes[1];
  w.angle = Math.atan2(y[0], y[1]);
  const S = (M) => {
    if ("head" in M) return { x: w.center.x + y[0] * c, y: w.center.y - y[1] * c };
    const T = f[M.chain];
    return T.points[Math.min(M.joint, T.points.length - 1)];
  };
  let $ = 0;
  (n.contact ?? "ground") === "ground" && ($ = -Math.max(...t.contacts.map((M) => S(M).y))), $ -= (e.lift ?? 0) * s;
  const v = (M) => ({ x: M.x, y: M.y + $ });
  for (const M of Object.values(f)) M.points = M.points.map(v);
  w.center = v(w.center);
  const x = t.contacts.map((M) => ({ spec: M, point: S(M) }));
  return {
    height: s,
    view: o,
    chains: f,
    head: w,
    hip: v(b(p)),
    hipDepth: Bs(r, o).depth,
    contacts: x,
    groundY: Math.max(...x.map((M) => M.point.y))
  };
}
const Po = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Lr = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function oi(t, e, n) {
  const s = n.height, o = Zt(90 * (e.turn ?? 0)), i = Zt(e.roll ?? 0), r = si(t, e, s), a = Gt(r.root, o), l = (m) => xe(Os(Po(Gt(m, o), a), -i), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => Lr(Po(l(xe(r.head.center, r.head.toBody(m))), h)), f = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], d = (m) => {
    if ("head" in m) return xe(h, $o(f[1], r.head.ry));
    const b = c[m.chain];
    return b[Math.min(m.joint, b.length - 1)];
  };
  let g = 0;
  (n.contact ?? "ground") === "ground" && (g = -Math.min(...t.contacts.map((m) => d(m)[1]))), g += (e.lift ?? 0) * s;
  const p = (m) => [m[0], m[1] + g, m[2]];
  return {
    height: s,
    hip: p(a),
    chains: Object.fromEntries(Object.entries(c).map(([m, b]) => [m, b.map(p)])),
    head: { center: p(h), rx: r.head.rx, ry: r.head.ry, axes: f }
  };
}
function Ea(t, e, n, s) {
  const o = n.height, i = Zt(90 * (e.turn ?? 0)), r = si(t, e, o), a = oi(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (A) => {
    if ("head" in A) return xe(h, $o(a.head.axes[1], a.head.ry));
    const E = c[A.chain];
    return E[Math.min(A.joint, E.length - 1)];
  }, f = s.toView(l), d = Os(Gt([0, 0, 1], i), -Zt(e.roll ?? 0)), g = Lr(Po(s.toView(xe(l, d)), f)), p = s.toScreen(f), m = s.toScreen([f[0] + 1, f[1], f[2]]), b = Math.hypot(m.x - p.x, m.y - p.y), k = (A) => {
    const E = s.toView(A);
    return { point: s.toScreen(E), depth: E[2] * b };
  }, w = {};
  for (const A of t.chains) {
    const E = c[A.id].map(k);
    w[A.id] = {
      id: A.id,
      joints3: r.chains[A.id].joints3,
      frames: r.chains[A.id].frames,
      points: E.map((P) => P.point),
      depths: E.map((P) => P.depth)
    };
  }
  const y = s.toView(h), S = s.toScreen(y), $ = s.toScreen([y[0] + 1, y[1], y[2]]), v = Math.hypot($.x - S.x, $.y - S.y), x = a.head.axes.map((A) => Lr(Po(s.toView(xe(h, A)), y))), M = {
    center: S,
    depth: y[2] * b,
    rx: r.head.rx * v,
    ry: r.head.ry * v,
    angle: Math.atan2(x[1][0], x[1][1]),
    axes: x
  }, T = t.contacts.map((A) => ({ spec: A, point: k(u(A)).point }));
  return {
    height: o * b,
    view: i,
    bodyForward: g,
    chains: w,
    head: M,
    hip: p,
    hipDepth: f[2] * b,
    contacts: T,
    groundY: Math.max(...T.map((A) => A.point.y))
  };
}
function Bn(t, [e, n, s]) {
  const [o, i, r] = t.axes, a = [
    o[0] * e * t.rx + i[0] * n * t.ry + r[0] * s * t.rx,
    o[1] * e * t.rx + i[1] * n * t.ry + r[1] * s * t.rx,
    o[2] * e * t.rx + i[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (o[2] * e + i[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
const zs = (t) => t * 180 / Math.PI, We = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Fi = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], xn = (t) => Math.hypot(t[0], t[1], t[2]), Wr = (t) => {
  const e = xn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, qs = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function ac(t) {
  const [e, n, s] = Wr(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function Io(t, e, n, s, o) {
  const i = t.chains.find((E) => E.id === n);
  if (!i) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (i.bones.length < 2 || i.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = Ta(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: o.height, contact: "none" }), a = r.chains[n];
  if (xn(We(s, a.joints3[2])) < o.height * 1e-12) return e;
  const l = a.joints3[0], c = xn(We(a.joints3[1], a.joints3[0])), h = xn(We(a.joints3[2], a.joints3[1])), u = i.parent ? r.chains[i.parent].frames[Math.max(0, (i.at ?? r.chains[i.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, f = We(s, l), d = t.angles(e, i), g = (E) => (d[E]?.yaw ?? 0) * Math.PI / 180, p = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, xn(f))), m = Wr(f), b = i.parent !== null, k = Gt(co(i.pole ?? (b ? [0, -0.35, -1] : [0, 0, 1]), u), g(0));
  let w = We(k, [m[0] * Fi(k, m), m[1] * Fi(k, m), m[2] * Fi(k, m)]);
  xn(w) < 1e-6 && (w = Gt([1, 0, 0], g(0))), w = Wr(w);
  const y = (c * c + p * p - h * h) / (2 * c * p), S = Math.sqrt(Math.max(0, 1 - y * y)), $ = [
    l[0] + c * (y * m[0] + S * w[0]),
    l[1] + c * (y * m[1] + S * w[1]),
    l[2] + c * (y * m[2] + S * w[2])
  ], v = [l[0] + m[0] * p, l[1] + m[1] * p, l[2] + m[2] * p], x = i.side ?? 1, M = ac(Gt(We($, l), -g(0))), T = ac(Gt(We(v, $), -g(1))), A = [
    { swing: zs(qs(M.swing - u.swing)), spread: zs(qs(M.spread - u.spread)) * x },
    { swing: zs(qs(T.swing - M.swing)), spread: zs(qs(T.spread - M.spread)) * x }
  ];
  return t.withAngles(e, i, A);
}
const An = (t, e) => (t % e + e) % e, lc = (t) => t * t * (3 - 2 * t), eb = (t) => Object.fromEntries(
  ["left", "right"].flatMap((e) => Object.entries(Ot[t]).map(([n, s]) => [`hand.${e}.${n}`, s]))
);
function Ni(t, e = !1) {
  const n = Tu(), s = Io(n, ht, "arm.left", [0.015, 0.68, 0.2], { height: 1 }), o = Io(n, s, "arm.right", [-0.015, 0.68, 0.2], { height: 1 });
  return Array.from({ length: 32 }, (i, r) => {
    const a = r / 4, l = Math.floor(a), c = a - l, h = l % 2 === 0, u = Math.sin(Math.PI * c), f = Math.max(0, ...t.map((g) => 1 - Math.min(An(a - g, 8), An(g - a, 8)) / 0.5)), d = {
      side: (h ? 1 : -1) * 5 * Math.sin(Math.PI * c),
      bend: 2 + 3 * u,
      "head.tilt": (h ? -1 : 1) * 3 * u,
      "head.nod": -2 * u,
      "leg.left.swing": h ? -4 * u : 17 * u,
      "leg.right.swing": h ? 17 * u : -4 * u,
      "leg.left.knee": h ? 5 * u : 36 * u,
      "leg.right.knee": h ? 36 * u : 5 * u,
      "leg.left.spread": 4,
      "leg.right.spread": 4,
      "arm.left.swing": 22 + f * (e ? 45 : 42),
      "arm.right.swing": 22 + f * (e ? 45 : 42),
      "arm.left.spread": 28 - 22 * f,
      "arm.right.spread": 28 - 22 * f,
      "arm.left.elbow": 48 + 22 * f,
      "arm.right.elbow": 48 + 22 * f,
      "arm.left.bend": -35 * f,
      "arm.right.bend": -35 * f,
      smile: 0.9,
      ...eb(e ? "hold" : "spread")
    };
    if (!e)
      for (const g of Object.keys(o)) g.startsWith("arm.") && (d[g] += (o[g] - d[g]) * f);
    return { beat: a, pose: d };
  });
}
const zn = {
  garba: { label: "Garba · two clap", bpm: 120, beats: 8, strikes: [2, 3, 6, 7], keys: Ni([2, 3, 6, 7]) },
  garbaThreeClap: { label: "Garba · three clap", bpm: 120, beats: 8, strikes: [1, 2, 3, 5, 6, 7], keys: Ni([1, 2, 3, 5, 6, 7]) },
  dandiya: { label: "Dandiya · partner strikes", bpm: 120, beats: 8, strikes: [1, 3, 5, 7], keys: Ni([1, 3, 5, 7], !0) }
};
function Au(t) {
  const e = typeof t == "string" && Object.hasOwn(zn, t) ? zn[t] : typeof t == "string" ? void 0 : t;
  if (!e || !Number.isFinite(e.beats) || e.beats <= 0 || !Array.isArray(e.keys) || !e.keys.length || !Array.isArray(e.strikes) || !e.keys.every((n, s) => Number.isFinite(n.beat) && n.beat >= 0 && n.beat < e.beats && (s === 0 || n.beat > e.keys[s - 1].beat) && n.pose && Object.values(n.pose).every(Number.isFinite)) || !e.strikes.every((n) => Number.isFinite(n) && n >= 0 && n < e.beats)) throw new Error("humanDanceFrame: a dance with positive finite beats, ordered pose keys and strike beats within its loop is required");
  return e;
}
function Oo(t, e, n = ht) {
  const s = Au(t);
  if (!Number.isFinite(e)) throw new Error("humanDanceFrame: beat must be finite");
  const o = An(e, s.beats);
  let i = s.keys.length - 1;
  for (let m = 0; m < s.keys.length; m++) s.keys[m].beat <= o && (i = m);
  const r = s.keys[i], a = s.keys[(i + 1) % s.keys.length], l = r.beat > o ? r.beat - s.beats : r.beat, c = a.beat <= r.beat ? a.beat + s.beats : a.beat, h = lc((o - l) / (c - r.beat)), u = { ...ht, ...n };
  for (const m of new Set(s.keys.flatMap((b) => Object.keys(b.pose)))) {
    if (m === "turn" || m === "roll") continue;
    const b = m.match(/^hand\.(?:left|right)\.(.+)$/)?.[1], k = n[m] ?? ht[m] ?? (b ? It[b] : void 0) ?? 0, w = r.pose[m] ?? k;
    u[m] = w + ((a.pose[m] ?? k) - w) * h;
  }
  const f = Math.floor(e), d = e - f, g = d <= 0.6 ? 1 : 1 - lc((d - 0.6) / 0.4), p = Math.max(0, ...s.strikes.map((m) => 1 - Math.min(An(o - m, s.beats), An(m - o, s.beats)) / 0.25));
  return { pose: u, contact: { side: An(f, 2) === 0 ? "left" : "right", start: f, weight: g }, strike: p };
}
function aS(t, e) {
  const n = Au(e.style), s = e.bpm ?? n.bpm, o = e.beats ?? n.beats, i = e.samplesPerBeat ?? 16;
  if (![s, o, i].every((l) => Number.isFinite(l) && l > 0)) throw new Error("humanDanceTracks: bpm, beats and samplesPerBeat must be positive and finite");
  if (!Number.isFinite(e.start ?? 0)) throw new Error("humanDanceTracks: start must be finite");
  const r = Math.max(1, Math.ceil(o * i)), a = Array.from({ length: r + 1 }, (l, c) => ({ time: (e.start ?? 0) + o * c / r * 6e4 / s, pose: Oo(n, o * c / r, e.pose).pose }));
  return Object.keys(a[0].pose).filter((l) => l !== "turn" && l !== "roll" && a.some((c) => c.pose[l] !== (e.pose?.[l] ?? ht[l]))).map((l) => ({
    id: `${t}-dance-${l}`,
    target: t,
    property: l,
    keyframes: a.map((c) => ({ time: c.time, value: c.pose[l], easing: "linear" }))
  }));
}
function $n(t, e, n, s) {
  if (!Number.isFinite(t) || t < n || t > s) throw new Error(`organic body: ${e} must be ${n}..${s}`);
  return t;
}
function Ys(t, e) {
  if (t.length < 2 || t[0].at !== 0 || t.at(-1).at !== 1) throw new Error(`organic body: ${e} must run from 0 to 1`);
  return t.map((n, s) => {
    if ($n(n.at, `${e}.at`, 0, 1), $n(n.width, `${e}.width`, 1e-3, 0.3), s > 0 && n.at <= t[s - 1].at) throw new Error(`organic body: ${e} positions must increase`);
    return { at: n.at, width: n.width };
  });
}
function nb(t, e) {
  const n = Math.max(0.095, e.shoulderWidth + 0.025), s = Math.max(0.085, e.hipWidth + 0.032), o = t.shading ?? {}, i = o.light ?? [-0.8, -0.6];
  if (i.length !== 2 || !i.every(Number.isFinite) || Math.hypot(...i) === 0) throw new Error("organic body: light must be a finite nonzero 2D vector");
  if (o.mode !== void 0 && o.mode !== "none" && o.mode !== "cel") throw new Error("organic body: unknown shading mode");
  return {
    torso: Ys(t.torso ?? [
      { at: 0, width: s },
      { at: 0.2, width: s },
      { at: 0.42, width: s * 0.72 },
      { at: 0.68, width: n * 0.9 },
      { at: 0.86, width: n },
      { at: 1, width: 0.024 }
    ], "torso"),
    arm: Ys(t.arm ?? [
      { at: 0, width: 0.028 },
      { at: 0.22, width: 0.027 },
      { at: 0.5, width: 0.019 },
      { at: 0.68, width: 0.023 },
      { at: 1, width: 0.012 }
    ], "arm"),
    leg: Ys(t.leg ?? [
      { at: 0, width: 0.04 },
      { at: 0.24, width: 0.042 },
      { at: 0.5, width: 0.027 },
      { at: 0.68, width: 0.032 },
      { at: 1, width: 0.016 }
    ], "leg"),
    neck: Ys(t.neck ?? [{ at: 0, width: 0.024 }, { at: 1, width: 0.023 }], "neck"),
    depth: $n(t.depth ?? 0.55, "depth", 0.2, 1),
    fill: t.fill ?? e.skin,
    outline: { color: t.outline?.color ?? e.ink, width: $n(t.outline?.width ?? e.lineWidth, "outline.width", 0, 100) },
    shading: {
      mode: o.mode ?? "cel",
      light: [...i],
      shadow: o.shadow ?? "#633923",
      opacity: $n(o.opacity ?? 0.17, "shading.opacity", 0, 1),
      highlight: $n(o.highlight ?? 0.12, "shading.highlight", 0, 1)
    }
  };
}
function sb(t, e) {
  const n = Math.min(1, Math.max(0, e)), s = t.findIndex((a) => a.at >= n);
  if (s <= 0) return t[0].width;
  const o = t[s - 1], i = t[s], r = (n - o.at) / (i.at - o.at);
  return o.width + (i.width - o.width) * r * r * (3 - 2 * r);
}
const cc = 8, ob = (t, e, n) => ({ x: t.x + (e.x - t.x) * n, y: t.y + (e.y - t.y) * n }), Ne = (t, e) => {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: (e.x - t.x) / n, y: (e.y - t.y) / n };
}, _o = (t, e, n) => ({ x: t.x + e.x * n, y: t.y + e.y * n });
function Ks(t, e = 12) {
  if (!Number.isInteger(e) || e < 1 || e > 128) throw new Error("organicCenterLine: steps must be an integer from 1 to 128");
  if (t.length < 2) return t.map((o) => ({ ...o }));
  const n = t.map((o, i) => {
    const r = Ne(t[Math.max(0, i - 1)], o), a = Ne(o, t[Math.min(t.length - 1, i + 1)]), l = Math.hypot(r.x + a.x, r.y + a.y);
    return l > 1e-6 ? { x: (r.x + a.x) / l, y: (r.y + a.y) / l } : a;
  }), s = [];
  for (let o = 0; o < t.length - 1; o++) {
    const i = t[o], r = t[o + 1], a = Math.hypot(r.x - i.x, r.y - i.y) * 0.28, l = _o(i, n[o], a), c = _o(r, n[o + 1], -a);
    for (let h = o === 0 ? 0 : 1; h <= e; h++) {
      const u = h / e, f = 1 - u;
      s.push({
        x: f ** 3 * i.x + 3 * f * f * u * l.x + 3 * f * u * u * c.x + u ** 3 * r.x,
        y: f ** 3 * i.y + 3 * f * f * u * l.y + 3 * f * u * u * c.y + u ** 3 * r.y
      });
    }
  }
  return s;
}
function js(t, e, n, s = 1, o = 1) {
  const i = t.map((h, u) => {
    const f = t[Math.max(0, u - 1)], d = t[Math.min(t.length - 1, u + 1)];
    let g = Ne(f, d);
    Math.hypot(g.x, g.y) < 1e-6 && (g = { x: 0, y: 1 });
    const p = { x: -g.y, y: g.x }, m = u / Math.max(1, t.length - 1), b = sb(e, m) * n * s, k = Ne(f, h), w = Ne(h, d), y = k.x * w.y - k.y * w.x, S = Math.acos(Math.min(1, Math.max(-1, k.x * w.x + k.y * w.y))), $ = (Math.hypot(h.x - f.x, h.y - f.y) + Math.hypot(d.x - h.x, d.y - h.y)) / (2 * Math.max(1e-6, S)), v = Math.min(b, Math.max(b * 0.2, $ * 0.8));
    return { center: h, width: b, at: m, left: _o(h, p, y > 0 ? v : b), right: _o(h, p, y < 0 ? -v : -b) };
  }), r = [], a = [], l = (h, u) => {
    r.push(h), a.push(u);
  };
  for (const h of i) l(h.left, h.at);
  const c = (h, u, f) => {
    const d = { x: -u.y, y: u.x };
    for (let g = 1; g < cc; g++) {
      const p = g * Math.PI / cc, m = (f ? 1 : -1) * Math.cos(p), b = (f ? 1 : -o) * Math.sin(p);
      l({
        x: h.center.x + h.width * (d.x * m + u.x * b),
        y: h.center.y + h.width * (d.y * m + u.y * b)
      }, h.at);
    }
  };
  c(i.at(-1), Ne(t[Math.max(0, t.length - 2)], t.at(-1)), !0);
  for (const h of [...i].reverse()) l(h.right, h.at);
  return c(i[0], Ne(t[0], t[Math.min(1, t.length - 1)]), !1), { outline: r, samples: i, positions: a };
}
function ib(t, e, n) {
  const s = {}, o = e.height, i = e.chains.spine;
  if (i?.length >= 2) {
    const r = e.points["shoulder.left"], a = e.points["shoulder.right"], l = n.chains.find((d) => d.id === "arm.left")?.offset?.[0] ?? 0.07, c = Math.max(1e-6, Math.abs(l) * o * 2), h = r && a ? Math.min(1, Math.hypot(r.x - a.x, r.y - a.y) / c) : Math.abs(Math.cos(e.turn * Math.PI / 2)), u = Math.sqrt(h * h + t.depth * t.depth * (1 - h * h)), f = [ob(i[0], i[1], -0.16), ...i.slice(1)];
    s.spine = js(Ks(f), t.torso, o, u, 0.25);
  }
  e.chains.neck?.length >= 2 && (s.neck = js(Ks(e.chains.neck), t.neck, o));
  for (const r of ["left", "right"])
    for (const a of ["arm", "leg"]) {
      const l = e.chains[`${a}.${r}`];
      !l || l.length < 3 || (s[`${a}.${r}`] = js(Ks(l.slice(0, 3)), t[a], o), a === "leg" && l.length > 3 && (s[`foot.${r}`] = js(Ks(l.slice(2)), [{ at: 0, width: 0.019 }, { at: 1, width: 0.014 }], o)));
    }
  return s;
}
function $u(t, e) {
  let n = !1;
  for (let s = 0, o = e.length - 1; s < e.length; o = s++) {
    const i = e[s], r = e[o];
    i.y > t.y != r.y > t.y && t.x < (r.x - i.x) * (t.y - i.y) / (r.y - i.y) + i.x && (n = !n);
  }
  return n;
}
function Di(t, e, n, s = 0) {
  const o = t.samples.filter((a) => a.at >= e && a.at <= n), i = (a, l) => {
    const c = a[l], h = a.center, u = Math.hypot(c.x - h.x, c.y - h.y) || 1;
    return { x: c.x + (c.x - h.x) * s / u, y: c.y + (c.y - h.y) * s / u };
  }, r = [...o.map((a) => i(a, "left")), ...[...o].reverse().map((a) => i(a, "right"))];
  {
    const a = t.samples[0].center;
    for (const l of t.outline.slice(-7)) {
      const c = Math.hypot(l.x - a.x, l.y - a.y) || 1;
      r.push({ x: l.x + (l.x - a.x) * s / c, y: l.y + (l.y - a.y) * s / c });
    }
  }
  return r;
}
function hc(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const n of e.slice(1)) t.lineTo(n.x, n.y);
  t.closePath();
}
function rb(t, e, n) {
  const s = n.shading;
  if (s.mode === "none" || n.fill === "none") return;
  const o = Math.hypot(...s.light), i = { x: s.light[0] / o, y: s.light[1] / o }, r = t.globalAlpha;
  t.save(), hc(t, e.outline), t.clip();
  for (const a of ["left", "right"]) {
    const l = e.samples.map((h) => h[a]), c = e.samples.map((h) => {
      const u = h[a], f = h.center, d = u.x - f.x, g = u.y - f.y, p = (d * i.x + g * i.y) / (Math.hypot(d, g) || 1), m = Math.max(0, -p) * 0.44;
      return { x: u.x + (f.x - u.x) * m, y: u.y + (f.y - u.y) * m };
    });
    if (hc(t, [...l, ...c.reverse()]), t.fillStyle = s.shadow, t.globalAlpha = r * s.opacity, t.fill(), s.highlight > 0) {
      const h = e.samples.map((d) => {
        const g = d[a], p = d.center;
        return { x: g.x + (p.x - g.x) * 0.2, y: g.y + (p.y - g.y) * 0.2 };
      }), u = e.samples[Math.floor(e.samples.length / 2)][a], f = e.samples[Math.floor(e.samples.length / 2)].center;
      if ((u.x - f.x) * i.x + (u.y - f.y) * i.y > 0) {
        t.globalAlpha = r * s.highlight, t.strokeStyle = "#ffffff", t.lineWidth = Math.max(1, e.samples[0].width * 0.16), t.beginPath(), t.moveTo(h[0].x, h[0].y);
        for (const d of h.slice(1)) t.lineTo(d.x, d.y);
        t.stroke();
      }
    }
  }
  t.restore();
}
function ab(t, e, n, s) {
  const o = s.bodyContours, i = (r) => o[r] && $u(t, o[r].outline);
  if (n.startsWith("arm.")) return e < 0.2 && i("spine");
  if (n.startsWith("leg.")) return e < 0.2 && i("spine") || e > 0.85 && i(n.replace("leg.", "foot."));
  if (n.startsWith("foot.")) return e < 0.25 && i(n.replace("foot.", "leg."));
  if (n === "neck") return e < 0.6 && i("spine");
  if (n === "spine") {
    if (e > 0.85 && i("neck")) return !0;
    for (const r of ["left", "right"]) {
      if (e > 0.6 && i(`arm.${r}`)) {
        const a = s.chains[`arm.${r}`]?.[0];
        if (a && Math.hypot(a.x - t.x, a.y - t.y) < s.height * 0.07) return !0;
      }
      if (e < 0.25 && i(`leg.${r}`)) return !0;
    }
  }
  return !1;
}
function uc(t, e, n, s, o) {
  const i = s.bodyContours?.[o];
  if (!i) return !1;
  if (n.fill === "none" && (e = Is(t, e)), e.shape(i.outline, n.fill === "none" ? null : n.fill, 0), e.look === "clean" && rb(t, i, n), (e.look !== "silhouette" || n.fill === "none") && s.lineWidth > 0) {
    let r = [];
    for (let a = 0; a <= i.outline.length; a++) {
      const l = a % i.outline.length, c = i.outline[l], h = i.outline[(l + 1) % i.outline.length], u = { x: (c.x + h.x) / 2, y: (c.y + h.y) / 2 };
      o.startsWith("arm.") && i.positions[l] === 1 || ab(u, i.positions[l], o, s) ? (r.length >= 2 && e.line(r, s.lineWidth), r = []) : (r.length === 0 && r.push(c), r.push(h));
    }
    r.length >= 2 && e.line(r, s.lineWidth);
  }
  return !0;
}
function Pu(t) {
  return [[0.01, -0.12, 0.8], [0, -0.25, 0.98], [-0.04, -0.31, 0.8]].map((e) => Bn(t, e).point);
}
function Iu(t, e) {
  const n = e.shape === "angular" ? lb(t, e) : e.projection === "volume" ? cb(t) : Tr(t.center.x, t.center.y, t.rx, t.ry, t.angle);
  if (e.projection !== "volume" || !e.nose) return n;
  const s = Math.cos(t.angle), o = Math.sin(t.angle), i = (u) => ({
    x: ((u.x - t.center.x) * s + (u.y - t.center.y) * o) / t.rx,
    y: ((u.x - t.center.x) * o - (u.y - t.center.y) * s) / t.ry
  }), r = i(Pu(t)[1]), a = Math.sign(r.x), l = r.y, c = n.flatMap((u, f) => {
    const d = i(u), g = i(n[(f + 1) % n.length]);
    if (d.y > l == g.y > l) return [];
    const p = (l - d.y) / (g.y - d.y);
    return [(d.x + (g.x - d.x) * p) * a];
  }), h = Math.max(0, r.x * a - Math.max(...c));
  return !Number.isFinite(h) || h === 0 ? n : n.flatMap((u, f) => {
    const d = n[(f + 1) % n.length], g = i(u), p = i(d), m = Math.max(1, Math.ceil(Math.hypot(p.x - g.x, p.y - g.y) / 0.025));
    return Array.from({ length: m }, (b, k) => {
      const w = k / m, y = { x: u.x + (d.x - u.x) * w, y: u.y + (d.y - u.y) * w }, S = i(y), $ = (S.y - l + 0.115) / 0.23;
      if (S.x * a < 0.5 || $ <= 0 || $ >= 1) return y;
      const v = Math.sin($ * Math.PI) ** 2 * h * t.rx * a;
      return { x: y.x + v * s, y: y.y + v * o };
    });
  });
}
function lb(t, e) {
  const n = Math.min(0.95, Math.max(0.55, e.jawWidth ?? 0.74)), s = Math.min(0.35, Math.max(0.03, e.chinWidth ?? 0.14)), o = [[-1, 0], [-0.92, s], [-0.5, n], [-0.12, Math.sqrt(1 - 0.12 ** 2)]];
  for (let i = 0; i <= 12; i++) {
    const r = i * Math.PI / 24;
    o.push([Math.sin(r), Math.cos(r)]);
  }
  return Ou(t, o, e.jawRoundness ?? 0, e.projection === "volume");
}
function cb(t) {
  const e = Array.from({ length: 41 }, (n, s) => {
    const o = -Math.PI / 2 + s * Math.PI / 40;
    return [Math.sin(o), Math.cos(o)];
  });
  return Ou(t, e, 0, !0);
}
function Ou(t, e, n, s) {
  const o = [];
  for (const [a, l] of e)
    for (let c = 0; c < 40; c++) {
      const h = c * Math.PI / 20, u = l * Math.sin(h);
      o.push(Bn(t, [l * Math.cos(h), a, s ? Math.min(u, 0.82) : u]).point);
    }
  let i = Aa(o);
  if (n = Math.min(1, Math.max(0, n)), n === 0) return i;
  const r = n * 0.25;
  for (let a = 0; a < 3; a++)
    i = i.flatMap((l, c) => {
      const h = i[(c + 1) % i.length];
      return [
        { x: l.x + (h.x - l.x) * r, y: l.y + (h.y - l.y) * r },
        { x: h.x + (l.x - h.x) * r, y: h.y + (l.y - h.y) * r }
      ];
    });
  return i;
}
function Aa(t) {
  const e = t.sort((o, i) => o.x - i.x || o.y - i.y), n = (o, i, r) => (i.x - o.x) * (r.y - o.y) - (i.y - o.y) * (r.x - o.x), s = (o) => {
    const i = [];
    for (const r of o) {
      for (; i.length >= 2 && n(i[i.length - 2], i[i.length - 1], r) <= 0; ) i.pop();
      i.push(r);
    }
    return i.slice(0, -1);
  };
  return [...s(e), ...s([...e].reverse())];
}
const _u = 0.34, Bt = 0.12, Nt = -0.4, Dt = (t, e, n) => t[e] ?? n, hb = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), ub = 0.45, fb = 0.35, db = 0.7, fc = 0.78;
function Mt(t, e, n, s = "cartoon") {
  const o = (d) => Math.sqrt(Math.max(0, 1 - d.x * d.x - d.y * d.y));
  let i = Bn(t, [n.x, n.y, o(n)]).facing;
  const r = t.axes[2];
  s === "volume" && n.x * r[0] > 0 && (i = Math.max(i, r[2]));
  const a = Math.atan2(r[0], r[2]), l = Math.cos(a), c = Math.max(fb, l), h = Math.max(db, l), u = Math.cos(t.angle), f = Math.sin(t.angle);
  if (s === "volume") {
    const d = Bn(t, [n.x, n.y, o(n) * fc]).point, g = Math.abs(n.x) > 0.1 ? Math.min(1, Math.max(0, i) / 0.25) : 1, p = Math.max(n.x * r[0] > 0 ? 0.2 : 0.5, l);
    return { facing: i, points: e.map((m) => {
      const b = (m.x - n.x) * p * t.rx * g, k = (m.y - n.y + r[1] * (o(m) - o(n)) * fc) * t.ry * g;
      return { x: d.x + b * u + k * f, y: d.y + b * f - k * u };
    }) };
  }
  return {
    facing: i,
    points: e.map((d) => {
      const g = ub * Math.sin(a) + n.x * c + (d.x - n.x) * h, p = d.y + r[1] * o(d), m = g * t.rx, b = p * t.ry;
      return { x: t.center.x + m * u + b * f, y: t.center.y + m * f - b * u };
    })
  };
}
const Oe = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (o, i) => {
  const r = i / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), us = (t, e, n, s) => {
  const o = Math.min(1, Math.max(0, (s - t.x) / (n.x - t.x))), i = 1 - o;
  return i * i * t.y + 2 * i * o * e.y + o * o * n.y;
}, Me = (t, e, n, s, o = 16) => Array.from({ length: o }, (i, r) => {
  const a = Math.PI * 2 * r / o;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), Ze = 0.05, pb = 0.3, gb = "#e06b7d";
function mb(t, e, n, s, o = {}, i) {
  const r = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), a = (E, P) => Mt(e, E, P, o.projection).points, l = (E, P) => Mt(e, [], { x: E, y: P }, o.projection).facing, c = Dt(n, "smile", 0), h = Dt(n, "blink", 0), u = Dt(n, "lookX", 0), f = Dt(n, "lookY", 0), d = Dt(n, "browTilt", 0), g = Math.max(0.2, Dt(n, "pupil", 1)), p = Math.min(1, Math.max(0, Dt(n, "lid", 0))), m = Math.min(1, Math.max(0, Dt(n, "bulge", 0)));
  for (const E of [1, -1]) {
    const P = E === 1 ? "left" : "right", O = _u * E;
    if (l(O, Bt) < Ze) continue;
    const L = { x: O, y: Bt }, q = hb(Dt(n, `eye.${P}`, 1), h);
    if (q < 0.2 || o.style === "anime" && p >= 0.98) {
      const C = c > 0.5 ? 0.12 : -0.06;
      t.line(a(Oe({ x: O - 0.12, y: Bt }, { x: O, y: Bt + C }, { x: O + 0.12, y: Bt }), L), r);
    } else if (o.style === "anime")
      yb(t, e, L, E, q, p, m, g, u, f, r, o, i);
    else {
      const C = q > 1.2 || m > 0.02, B = 0.13 * Math.max(q, 1) * (1 + m * 0.7);
      C && t.shape(a(Me(O, Bt, B * 0.85, B), L), "#ffffff", r);
      const Y = (q > 1.2 ? 0.075 : 0.1) * g * (1 + m * 0.3), I = O + u * 0.08, N = Bt - f * 0.07, nt = Me(I, N, Y, Y * 1.1 * Math.min(q, 1));
      if (t.shape(a(nt, L), t.ink, 0), o.inPupil && i) {
        const [H] = a([{ x: I, y: N }], L), R = a(nt, L), z = Math.min(...R.map((U) => Math.hypot(U.x - H.x, U.y - H.y)));
        z > 0.5 && (i.save(), i.beginPath(), i.arc(H.x, H.y, z, 0, Math.PI * 2), i.clip(), o.inPupil(i, { x: H.x, y: H.y, r: z, side: P }), i.restore());
      }
      if (p > 0.02) {
        const H = C ? B * 1.15 : Y * 1.4, R = Bt + H, z = R - H * 2 * p, U = H * 1.1;
        t.shape(a([{ x: O - U, y: R + 0.02 }, { x: O + U, y: R + 0.02 }, { x: O + U, y: z }, { x: O - U, y: z }], L), o.skin ?? "#ffffff", 0), t.line(a([{ x: O - U, y: z }, { x: O + U, y: z }], L), r);
      }
    }
    const G = Bt + (o.style === "anime" ? 0.38 : 0.3) + Dt(n, `brow.${P}`, 0) * 0.14 + Math.max(0, q - 1) * 0.12, Q = { x: O + E * 0.13, y: G }, j = { x: O - E * 0.13, y: G + d * 0.1 };
    t.line(a([Q, { x: (Q.x + j.x) / 2, y: (Q.y + j.y) / 2 }, j], { x: O, y: G }), r);
  }
  wb(t, e, n, r, o.projection), bb(t, e, o.ageLines ?? 0, r, o.projection);
  const b = { x: 0, y: Nt };
  if (l(0, Nt) < -Ze) return;
  o.nose && l(0, Bt - 0.15) >= Ze && (o.projection === "volume" ? t.line(Pu(e), r) : t.line(a([{ x: 0.01, y: Bt - 0.1 }, { x: 0.03, y: Nt + 0.2 }, { x: -0.05, y: Nt + 0.17 }], { x: 0, y: Nt + 0.22 }), r));
  const k = 0.25 * Math.max(0.3, Dt(n, "mouthWidth", 1)), w = Math.min(1, Math.max(0, Dt(n, "mouth", 0)));
  if (w <= 0.05) {
    t.line(a(Oe({ x: -k, y: Nt }, { x: 0, y: Nt - c * 0.25 }, { x: k, y: Nt }), b), r);
    return;
  }
  const y = 0.3 * w;
  let S, $, v, x;
  if (c > 0.3) {
    const E = Nt + 0.05, P = { x: 0, y: Nt - y * 2 };
    S = [...Oe({ x: k, y: E }, P, { x: -k, y: E })], $ = () => E, v = (O) => us({ x: k, y: E }, P, { x: -k, y: E }, O), x = 0.85;
  } else if (c < -0.3) {
    const E = Nt - y * 0.6, P = { x: 0, y: Nt + y * 1.4 };
    S = [...Oe({ x: k, y: E }, P, { x: -k, y: E })], $ = (O) => us({ x: k, y: E }, P, { x: -k, y: E }, O), v = () => E, x = 0.5;
  } else {
    const E = k * 0.8;
    S = Me(0, Nt, E, y);
    const P = (O) => y * Math.sqrt(Math.max(0, 1 - (O / E) ** 2));
    $ = (O) => Nt + P(O), v = (O) => Nt - P(O), x = 0.5;
  }
  if (t.shape(a(S, b), t.ink, 0), w < pb) return;
  const M = $(0) - v(0), T = k * x, A = (E, P, O = 8) => Array.from({ length: O + 1 }, (L, q) => E + (P - E) * q / O);
  if (o.tongue) {
    const E = T * 0.55, P = A(E, -E).map((L) => ({ x: L, y: v(L) })), O = Oe({ x: -E, y: v(-E) }, { x: 0, y: v(0) + M * 0.8 }, { x: E, y: v(E) }, 8);
    t.shape(a([...P, ...O.slice(1, -1)], b), gb, 0);
  }
  if (o.teeth) {
    const E = Math.min(0.06, M * 0.4), P = A(-T, T).map((L) => ({ x: L, y: $(L) })), O = P.map(({ x: L, y: q }) => ({ x: L * 0.92, y: q - E })).reverse();
    t.shape(a([...P, ...O], b), "#ffffff", 0);
    for (const L of [-0.5, 0, 0.5]) {
      const q = T * L;
      t.line(a([{ x: q, y: $(q) }, { x: q * 0.92, y: $(q) - E }], b), r * 0.6);
    }
  }
}
function yb(t, e, n, s, o, i, r, a, l, c, h, u, f) {
  const { x: d, y: g } = n, p = Math.min(1.2, Math.max(0.5, u.eyeScale ?? 1)), m = Math.min(1.2, Math.max(0.45, u.eyeAspect ?? 1)), b = 0.21 * p * (1 + r * 0.15), k = 0.25 * p * m * Math.min(o, 1.6) * (1 - i) * (1 + r * 0.3), w = { x: d - b, y: g }, y = { x: d + b, y: g }, S = { x: d, y: g + k * 1.9 }, $ = { x: d, y: g - k * 1.35 }, v = Oe(w, S, y), x = Oe(y, $, w), M = (G) => Mt(e, G, n, u.projection).points, T = (G) => G.map((Q) => {
    const j = Math.min(y.x, Math.max(w.x, Q.x));
    return { x: j, y: Math.min(us(w, S, y, j), Math.max(us(y, $, w, j), Q.y)) };
  });
  t.shape(M([...v, ...x.slice(1, -1)]), "#ffffff", h * 0.5);
  const A = d + Math.max(-1, Math.min(1, l)) * 0.07 * p, E = g - Math.max(-1, Math.min(1, c)) * 0.055 * p, P = 0.115 * p, O = 0.185 * p;
  t.shape(M(T(Me(A, E, P, O, 24))), u.iris ?? "#4b7fce", h * 0.4), t.shape(M(T(Me(A, E - 0.075 * p, P * 0.7, O * 0.35))), "rgba(255,255,255,0.25)", 0);
  const L = Math.min(0.085, 0.042 * a) * p, q = T(Me(A, E, L, L * 1.35));
  if (t.shape(M(q), t.ink, 0), u.inPupil && f) {
    const [G] = M([{ x: A, y: E }]), Q = Math.min(...M(q).map((j) => Math.hypot(j.x - G.x, j.y - G.y)));
    Q > 0.5 && (f.save(), f.beginPath(), f.arc(G.x, G.y, Q, 0, Math.PI * 2), f.clip(), u.inPupil(f, { ...G, r: Q, side: s === 1 ? "left" : "right" }), f.restore());
  }
  if (t.shape(M(T(Me(A - 0.038 * p, E + 0.075 * p, 0.035 * p, 0.045 * p))), "#ffffff", 0), t.shape(M(T(Me(A + 0.04 * p, E - 0.04 * p, 0.014 * p, 0.02 * p))), "#ffffff", 0), t.line(M(v), h * 1.1), u.lashes !== !1)
    for (const G of [0, 0.035]) {
      const Q = d + s * (b - G), j = us(w, S, y, Q);
      t.line(M([{ x: Q, y: j }, { x: Q + s * 0.055, y: j + 0.07 }]), h * 0.75);
    }
}
function bb(t, e, n, s, o) {
  const i = Math.min(1, Math.max(0, n));
  if (!(i <= 0))
    for (const r of [-1, 1]) {
      const a = { x: r * 0.59, y: Bt };
      if (Mt(e, [], a, o).facing < Ze) continue;
      for (const h of [-0.06, 0.035]) {
        const u = [{ x: a.x, y: a.y }, { x: a.x + r * 0.1, y: a.y + h }];
        t.line(Mt(e, u, a, o).points, s * 0.45 * i);
      }
      const l = { x: r * 0.3, y: -0.38 }, c = Oe({ x: l.x, y: -0.31 }, { x: l.x + r * 0.07, y: -0.4 }, { x: l.x + r * 0.035, y: -0.49 });
      t.line(Mt(e, c, l, o).points, s * 0.35 * i);
    }
}
const dc = "#8fd0f5", pc = (t, e, n) => Array.from({ length: 18 }, (s, o) => {
  const i = Math.PI * 2 * o / 18, r = Math.sin(i / 2);
  return { x: t + Math.sin(i) * n * r, y: e - n * 0.9 + Math.cos(i) * n * 1.6 * (0.55 + 0.45 * r) - n * 0.4 };
});
function wb(t, e, n, s, o) {
  const i = Math.min(1, Math.max(0, Dt(n, "blush", 0))), r = Math.min(1, Math.max(0, Dt(n, "tears", 0))), a = Math.min(1, Math.max(0, Dt(n, "sweat", 0)));
  if (!(i + r + a <= 0.01)) {
    for (const l of [1, -1]) {
      const c = { x: 0.5 * l, y: -0.16 }, h = Mt(e, [], c, o).facing >= Ze;
      if (i > 0.01 && h) {
        const { points: f } = Mt(e, Me(c.x, c.y, 0.17, 0.1), c, o);
        if (t.shape(f, `rgba(240, 120, 140, ${(0.75 * i).toFixed(3)})`, 0), i > 0.5)
          for (const d of [-0.07, 0, 0.07]) {
            const g = [{ x: c.x + d - 0.018, y: c.y - 0.03 }, { x: c.x + d + 0.018, y: c.y + 0.03 }];
            t.line(Mt(e, g, c, o).points, s * 0.3);
          }
      }
      const u = { x: _u * l, y: Bt };
      if (r > 0.01 && Mt(e, [], u, o).facing >= Ze) {
        const f = 0.05 + 0.04 * r, d = { x: u.x + 0.06 * l, y: Bt - 0.2 - 0.12 * r };
        if (t.shape(Mt(e, pc(d.x, d.y, f), d, o).points, dc, s * 0.35), r > 0.6) {
          const g = [{ x: u.x + 0.05 * l, y: Bt - 0.1 }, { x: d.x, y: d.y + f * 0.8 }];
          t.line(Mt(e, g, d, o).points, s * 0.3);
        }
      }
    }
    if (a > 0.01) {
      const l = { x: 0.64, y: 0.42 };
      Mt(e, [], l, o).facing >= Ze && t.shape(Mt(e, pc(l.x, l.y, 0.05 + 0.05 * a), l, o).points, dc, s * 0.35);
    }
  }
}
const kb = 15;
function pe(t, e) {
  const n = Math.sqrt(Math.max(0, 1 - e * e));
  return [n * Math.sin(t), e, n * Math.cos(t)];
}
const vb = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function Kt(t, [e, n, s]) {
  const [o, i, r] = t.axes;
  return o[2] * e + i[2] * n + r[2] * s;
}
function At(t, e) {
  return Bn(t, e).point;
}
function Ho(t, e) {
  const n = Math.abs(t - e) % (Math.PI * 2);
  return n > Math.PI ? Math.PI * 2 - n : n;
}
function ii(t, e, n = 64) {
  const s = e.top ?? 1, o = e.bottom ?? -1, i = Math.max(8, Math.ceil((s - o) * kb)), r = (g) => Math.min(s, Math.max(o, s - (s - o) * (g - 1) / i)), a = (g) => -Math.PI + Math.PI * 2 * g / n, l = (g, p) => e.normal ? e.normal(g, p) : vb(e.position(g, p)), c = i + 3, h = new Float64Array(n * c), u = new Float64Array(n * c);
  for (let g = 0; g < c; g++) {
    const p = g === 0 || g === c - 1, m = r(g);
    for (let b = 0; b < n; b++) {
      const k = g * n + b;
      if (p) {
        h[k] = -1;
        continue;
      }
      const w = a(b);
      h[k] = e.inside(w, m), u[k] = h[k] > -0.35 ? Kt(t, l(w, m)) : 0;
    }
  }
  const f = (g) => (g % n + n) % n, d = (g) => {
    const p = n + 1, m = new Float64Array(p * c);
    for (let E = 0; E < c; E++)
      for (let P = 0; P <= n; P++) {
        const O = E * n + (P === n ? 0 : P);
        m[E * p + P] = Math.min(h[O], g * u[O]);
      }
    const b = (E, P) => m[P * p + E], k = (E, P, O, L) => {
      const q = b(E, P), G = b(O, L), Q = q === G ? 0.5 : Math.min(1, Math.max(0, q / (q - G)));
      return At(t, e.position(a(E + (O - E) * Q), r(P + (L - P) * Q)));
    }, w = n * c * 2, y = new Int32Array(w).fill(-1), S = new Int32Array(w).fill(-1), $ = /* @__PURE__ */ new Map(), v = (E, P, O) => {
      const L = (O * n + f(P)) * 2 + (E ? 1 : 0);
      return $.has(L) || $.set(L, E ? k(f(P), O, f(P), O + 1) : k(P, O, P + 1, O)), L;
    }, x = (E, P) => {
      y[E] === -1 ? y[E] = P : S[E] = P;
    }, M = (E, P) => {
      x(E, P), x(P, E);
    };
    for (let E = 0; E < c - 1; E++)
      for (let P = 0; P < n; P++) {
        const O = E * p + P, L = (m[O] > 0 ? 8 : 0) | (m[O + 1] > 0 ? 4 : 0) | (m[O + p + 1] > 0 ? 2 : 0) | (m[O + p] > 0 ? 1 : 0);
        if (L === 0 || L === 15) continue;
        const q = () => v(!1, P, E), G = () => v(!1, P, E + 1), Q = () => v(!0, P, E), j = () => v(!0, P + 1, E);
        switch (L) {
          case 1:
          case 14:
            M(Q(), G());
            break;
          case 2:
          case 13:
            M(G(), j());
            break;
          case 3:
          case 12:
            M(Q(), j());
            break;
          case 4:
          case 11:
            M(q(), j());
            break;
          case 6:
          case 9:
            M(q(), G());
            break;
          case 7:
          case 8:
            M(Q(), q());
            break;
          case 5:
          case 10: {
            const C = (b(P, E) + b(P + 1, E) + b(P + 1, E + 1) + b(P, E + 1)) / 4 > 0;
            L === 5 === C ? (M(Q(), q()), M(G(), j())) : (M(Q(), G()), M(q(), j()));
            break;
          }
        }
      }
    const T = [], A = new Uint8Array(w);
    for (const E of $.keys()) {
      if (A[E]) continue;
      const P = [];
      let O = -1, L = E;
      for (; L !== -1 && !A[L]; ) {
        A[L] = 1, P.push($.get(L));
        const q = y[L], G = S[L], Q = q !== -1 && q !== O && !A[q] ? q : G !== -1 && G !== O && !A[G] ? G : -1;
        O = L, L = Q;
      }
      P.length >= 3 && T.push(P);
    }
    return T;
  };
  return { near: d(1), far: d(-1) };
}
const gc = /* @__PURE__ */ new WeakMap();
function $a(t, e, n) {
  let s = gc.get(t);
  s || gc.set(t, s = /* @__PURE__ */ new Map());
  let o = s.get(e);
  return o || s.set(e, o = n()), o;
}
function Pa(t, e, n, s) {
  if (t.save(), t.beginPath(), t.rect(-1e5, -1e5, 2e5, 2e5), s?.length) {
    t.moveTo(s[0].x, s[0].y);
    for (const o of s.slice(1)) t.lineTo(o.x, o.y);
    t.closePath();
  } else
    t.ellipse(e.center.x, e.center.y, e.rx, e.ry, e.angle, 0, Math.PI * 2);
  t.clip("evenodd"), n(), t.restore();
}
function Hu(t, e, n, s = 0.04) {
  const o = [];
  let i = [];
  return e.forEach((r, a) => {
    Kt(t, n[a]) > s ? i.push(At(t, r)) : (i.length >= 2 && o.push(i), i = []);
  }), i.length >= 2 && o.push(i), o;
}
const mc = (t) => t * Math.PI / 180, Fr = (t) => {
  const e = Math.hypot(...t) || 1;
  return t.map((n) => n / e);
}, Mb = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
function yc(t, e, n) {
  return t >= e + n ? t : t <= e - n ? e : e + (t - e + n) ** 2 / (4 * n);
}
function Bi(t, e, n) {
  const s = Fr(n), o = t.reduce((c, h, u) => c + h * s[u], 0), r = t.map((c, h) => c - o * s[h]).reduce((c, h) => c + h * h, 0), a = Math.sqrt(yc(1 - r, e * e, e * e)), l = yc(o, a, e) - o;
  return l === 0 ? t : t.map((c, h) => c + s[h] * l);
}
function xb(t) {
  if (t.path.length < 4 || (t.path.length - 1) % 3 !== 0) throw new Error("hair: a lock path needs a root and groups of three cubic points");
  if (!Number.isFinite(t.width) || t.width <= 0 || t.follow !== void 0 && (!Number.isFinite(t.follow) || t.follow < 0))
    throw new Error("hair: lock width must be positive and follow must be nonnegative");
  for (const n of t.path)
    if (!Number.isFinite(n.around) || !Number.isFinite(n.up) || n.up > 1 || n.lift !== void 0 && (!Number.isFinite(n.lift) || n.lift < 0))
      throw new Error("hair: lock points need finite around/up values, up <= 1 and nonnegative lift");
  const e = t.path[0];
  if (e.up < 0 || (e.lift ?? 0) !== 0) throw new Error("hair: a lock root must lie on the scalp (up 0..1, lift 0)");
  return { ...t, path: t.path.map((n) => ({ ...n })) };
}
function Sb(t, e, n, s) {
  const o = (t.path.length - 1) / 3, i = o * 20, r = [], a = [], l = s.trail !== 0 || s.lift !== 0, c = Math.max(0, e + n);
  for (let h = 0; h <= i; h++) {
    const u = h / i, f = Math.min(o - 1, Math.floor(u * o)), d = u * o - f, g = 1 - d, p = [g ** 3, 3 * g * g * d, 3 * g * d * d, d ** 3], m = t.path.slice(f * 3, f * 3 + 4), b = mc(m.reduce((O, L, q) => O + L.around * p[q], 0)), k = m.reduce((O, L, q) => O + L.up * p[q], 0), w = m.reduce((O, L, q) => O + (L.lift ?? 0) * p[q], 0), y = 1 + e + n + w, S = k >= 0 ? Math.sqrt(Math.max(0, 1 - k * k)) : 1, $ = u * u * (t.follow ?? 1), v = mc(s.swing) * $, x = b - v, M = [Math.sin(x) * S * y, k * (k >= 0 ? y : 1), Math.cos(x) * S * y], T = [M[0], M[1] + s.lift * $, M[2] - s.trail * $], A = [Math.sin(x) * S, Math.max(0, k), Math.cos(x) * S], E = Fr(M), P = l && $ > 0 ? Bi(T, c, E) : T;
    a.push(E), r.push({ center: P, normal: A, left: P, right: P, t: u });
  }
  return r.forEach((h, u) => {
    const f = r[Math.max(0, u - 1)].center, g = r[Math.min(i, u + 1)].center.map((b, k) => b - f[k]), p = Fr(Mb(h.normal, g)), m = t.width * Math.sin(Math.PI * h.t) ** 0.6 * 0.5;
    h.left = h.center.map((b, k) => b + p[k] * m), h.right = h.center.map((b, k) => b - p[k] * m), l && h.t > 0 && (t.follow ?? 1) > 0 && (h.left = Bi(h.left, c, a[u]), h.right = Bi(h.right, c, a[u]));
  }), r;
}
const Pn = (t, e, n) => t.map((s, o) => s + (e[o] - s) * n);
function Tb(t, e, n) {
  const s = n ? 1 : -1, o = [];
  let i = [];
  for (let r = 0; r < e.length; r++) {
    const a = e[r], l = s * Kt(t, a.normal) >= 0;
    if (r > 0) {
      const c = e[r - 1], h = s * Kt(t, c.normal), u = s * Kt(t, a.normal);
      if (h >= 0 !== l) {
        const f = h / (h - u), d = {
          center: Pn(c.center, a.center, f),
          left: Pn(c.left, a.left, f),
          right: Pn(c.right, a.right, f),
          normal: Pn(c.normal, a.normal, f),
          t: c.t + (a.t - c.t) * f
        };
        l ? i = [d] : (i.push(d), i.length >= 2 && o.push(i), i = []);
      }
    }
    l && i.push(a);
  }
  return i.length >= 2 && o.push(i), o;
}
function Cu(t, e, n, s, o, i, r) {
  const a = (n.locks ?? []).map((h) => Sb(h, n.volume, s, o)), l = (h) => h.reduce((u, f) => u + Kt(e, f.center), 0) / h.length;
  a.sort((h, u) => l(h) - l(u));
  const c = Math.max(0.7, i * 0.35);
  for (const h of a)
    for (const u of Tb(e, h, r)) {
      const f = u.map((p) => At(e, p.left)), d = u.map((p) => At(e, p.right));
      if (t.shape([...f, ...d.slice().reverse()], n.color, 0), t.look === "clean" && (n.shine ?? 0) > 0) {
        const p = u.filter((m) => m.t >= 0.2 && m.t <= 0.75);
        if (p.length >= 3) {
          const m = p.map((k, w) => {
            const y = 0.16 * Math.sin(Math.PI * w / (p.length - 1));
            return At(e, Pn(k.center, k.left, 0.16 + y));
          }), b = p.map((k) => At(e, Pn(k.center, k.left, 0.16)));
          t.shape([...m, ...b.reverse()], `rgba(255,255,255,${n.shine})`, 0);
        }
      }
      const g = u.filter((p) => p.t > 0.3);
      g.length >= 2 && t.line(g.map((p) => At(e, p.left)), c);
    }
}
const Tt = (t, e, n = 0) => ({ around: t, up: e, lift: n }), zi = () => [
  { width: 0.66, follow: 0.22, path: [Tt(-38, 0.88), Tt(-12, 0.94, 0.08), Tt(58, 0.76, 0.09), Tt(94, 0.16, 0.03)] },
  { width: 0.58, follow: 0.3, path: [Tt(-42, 0.8), Tt(-24, 0.7, 0.12), Tt(18, 0.57, 0.09), Tt(64, 0.3)] },
  { width: 0.36, follow: 0.18, path: [Tt(-58, 0.76), Tt(-76, 0.56, 0.07), Tt(-90, 0.12, 0.06), Tt(-102, -0.36)] }
];
function bc(t) {
  return [-100, -130, -160, -190, -220, -250, -280].map((e, n) => {
    const s = n % 2 === 0 ? 1 : -1, o = t ? -2.45 - n % 3 * 0.12 : -1.06 - n % 3 * 0.09;
    return {
      width: t ? 0.88 : 0.92,
      follow: t ? 0.8 + n % 3 * 0.12 : 0.38 + n % 3 * 0.08,
      path: t ? [
        Tt(e, 0.7),
        Tt(e + s * 9, 0.2, 0.12),
        Tt(e - s * 13, -0.5, 0.2),
        Tt(e - s * 8, -0.95, 0.16),
        Tt(e - s * 3, -1.4, 0.12),
        Tt(e + s * 18, o + 0.35, 0.22),
        Tt(e + s * 12, o, 0.03)
      ] : [
        Tt(e, 0.7),
        Tt(e + s * 7, 0.15, 0.2),
        Tt(e - s * 8, -0.75, 0.25),
        Tt(e + s * 5, o)
      ]
    };
  });
}
const Eb = {
  softSweep: {
    volume: 0.12,
    shine: 0.16,
    part: -38,
    strands: "part",
    sweep: -0.08,
    hairline: { front: 0.64, side: 0.12, back: -0.8 },
    locks: zi()
  },
  flowingBob: {
    volume: 0.15,
    shine: 0.16,
    length: 0.96,
    fall: { taper: 0.08, wave: 0.08 },
    part: -38,
    strands: "part",
    sweep: -0.08,
    hairline: { front: 0.64, side: 0.08, back: -0.8 },
    coversEars: !0,
    locks: [...bc(!1), ...zi()]
  },
  cascadingWaves: {
    volume: 0.16,
    shine: 0.16,
    length: 2.38,
    fall: { taper: 0.18, wave: 0.12 },
    part: -38,
    strands: "part",
    sweep: -0.08,
    hairline: { front: 0.64, side: 0.08, back: -0.8 },
    coversEars: !0,
    locks: [...bc(!0), ...zi()]
  }
}, vs = { swing: 0, trail: 0, lift: 0 };
function Co(t) {
  if (!t) return vs;
  const e = t["hair.swing"] ?? 0, n = t["hair.trail"] ?? 0, s = t["hair.lift"] ?? 0;
  return e === 0 && n === 0 && s === 0 ? vs : { swing: e, trail: n, lift: s };
}
const Ru = (t) => t.swing === 0 && t.trail === 0 && t.lift === 0;
function Ab(t) {
  return t.length > 0 || t.ties.some((e) => e.kind !== "bun") || (t.locks ?? []).some((e) => (e.follow ?? 1) > 0);
}
function Nr([t, e, n], s) {
  if (s === 0) return [t, e, n];
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - n * i, e, n * o + t * i];
}
const wc = {
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
}, kc = 1.75, Lu = {
  ...Eb,
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
  mangaSpikes: { volume: 0.12, texture: "spiky", textureAmount: 0.08, hairline: { front: 0.55, side: 0.12, back: -0.7 }, spikes: [
    { around: -100, up: 0.4, length: 0.55, width: 0.24 },
    { around: -65, up: 0.7, length: 0.6, width: 0.25 },
    { around: -25, up: 0.93, length: 0.6, width: 0.24 },
    { around: 40, up: 0.87, length: 0.7, width: 0.25 },
    { around: 85, up: 0.55, length: 0.55, width: 0.24 },
    { around: 160, up: 0.8, length: 0.5, width: 0.24 },
    { around: -160, up: 0.65, length: 0.55, width: 0.24 }
  ] },
  mangaSweep: { volume: 0.14, texture: "spiky", textureAmount: 0.1, sweep: -0.35, hairline: { front: 0.5, side: 0.08, back: -0.8 }, spikes: [
    { around: -95, up: 0.45, length: 0.35, width: 0.2 },
    { around: -60, up: 0.8, length: 0.4, width: 0.24 },
    { around: 75, up: 0.55, length: 0.4, width: 0.23 },
    { around: 150, up: 0.75, length: 0.35, width: 0.2 }
  ] },
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
  shoulderStraight: { volume: 0.16, length: kc, opening: 84, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  shoulderWaves: { volume: 0.22, length: kc, opening: 84, part: 22, texture: "wavy", textureAmount: 0.12, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
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
}, we = {
  black: "#22201f",
  brown: "#6b4630",
  chestnut: "#7b4a2b",
  auburn: "#9a4426",
  blond: "#d9b55a",
  ginger: "#c8662f",
  gray: "#a7a29c",
  white: "#ecebe7"
};
function $b(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ? Lu[e.style] : {};
  if (e.style && !n) throw new Error(`hair: unknown style '${e.style}'`);
  const { style: s, hairline: o, ...i } = e, r = {
    ...wc,
    ...n,
    ...i,
    hairline: { ...wc.hairline, ...n.hairline, ...o },
    ties: (i.ties ?? n.ties ?? []).map((a) => ({ ...a })),
    ...i.spikes ?? n.spikes ? { spikes: (i.spikes ?? n.spikes).map((a) => ({ ...a })) } : {},
    ...i.locks ?? n.locks ? { locks: (i.locks ?? n.locks).map(xb) } : {},
    ...i.fall ?? n.fall ? { fall: { ...i.fall ?? n.fall } } : {}
  };
  if (r.shine !== void 0 && (!Number.isFinite(r.shine) || r.shine < 0 || r.shine > 1)) throw new Error("hair: shine must be between 0 and 1");
  if (r.fall && (!Number.isFinite(r.fall.taper) || r.fall.taper < 0 || r.fall.taper > 1 || !Number.isFinite(r.fall.wave) || r.fall.wave < 0))
    throw new Error("hair: fall needs taper between 0 and 1 and nonnegative wave");
  return r;
}
const Qe = (t) => t * Math.PI / 180, In = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, Dr = (t) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1);
function Ro(t, e) {
  const { front: n, side: s, back: o } = t.hairline, i = (n - o) / 2, r = (n + o) / 2, a = (r + s) / 2, l = (r - s) / 2, c = Math.max(0, Math.cos(e));
  let h = a + i * Math.cos(e) + l * Math.cos(2 * e);
  return h -= t.sweep * Math.sin(e) * c, h += t.recede * Math.exp(-(((Math.abs(e) - 0.75) / 0.32) ** 2)), (t.texture === "spiky" || t.texture === "curly") && (h -= t.textureAmount * 0.6 * Dr(e * 11 / (Math.PI * 2)) * c), h;
}
function vc(t, e, n) {
  const s = t.textureAmount;
  switch (t.texture) {
    case "spiky":
      return s * (Dr(e * 11 / (Math.PI * 2)) * Dr(n * 2.6 + 0.5)) ** 1.2 * In(-0.3, 0.4, n);
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
function Wu(t, e, n = vs) {
  const s = t.length > 0, o = /* @__PURE__ */ new Map(), i = (h) => {
    let u = o.get(h);
    return u === void 0 && o.set(h, u = Ro(t, h)), u;
  }, r = Qe(t.opening), a = (h) => t.length + (t.texture === "wavy" || t.texture === "curly" || t.texture === "locs" ? 0.12 * Math.sin(h * 9) : 0) + (t.fall?.wave ?? 0) * Math.cos(h * 3 + 0.6), l = (h, u, f) => {
    if (t.flat <= 0 || u < 0.45) return null;
    const d = (u - 0.45) / 0.55, g = Math.sqrt(1 - 0.45 * 0.45) * f * (1 - d ** 5), p = 0.45 + (1 + t.flat - 0.45) * Math.min(1, d * 1.8);
    return [g * Math.sin(h), p * (1 + e), g * Math.cos(h)];
  }, c = {
    top: 1,
    bottom: s ? -(t.length + 0.25 + Math.abs(t.fall?.wave ?? 0)) : -1,
    inside(h, u) {
      const f = u - i(h);
      if (!s) return f;
      const d = Math.min(u + a(h), Ho(h, 0) - r);
      return Math.max(f, d);
    },
    position(h, u) {
      if (s && u < 0) {
        const w = t.length < 1.5 ? 0.14 * In(-t.length + 0.45, -t.length - 0.1, u) : 0, y = (t.fall?.taper ?? 0) * In(0, -Math.max(0.1, a(h)), u), S = 1 + e + t.volume * (1 - w * 2.5) + vc(t, h, u) - w - y;
        return [S * Math.sin(h), u, S * Math.cos(h)];
      }
      const f = 0.4 + 0.6 * In(0, 0.3, u - Ro(t, h)), d = 1 + e + (t.volume + vc(t, h, u)) * f, g = l(h, u, d);
      if (g) return g;
      const [p, m, b] = pe(h, u), k = [p * d, m * d, b * d];
      if (t.quiff > 0) {
        const w = t.quiff * Math.exp(-((h / 0.7) ** 2)) * In(0.15, 0.85, u);
        k[1] += w * 0.7, k[2] += w * 0.45;
      }
      return k;
    },
    normal(h, u) {
      return s && u < 0 ? [Math.sin(h), 0, Math.cos(h)] : pe(h, u);
    }
  };
  return s && !Ru(n) ? Pb(c, t, n) : c;
}
function Pb(t, e, n) {
  const s = (i) => i < 0 ? In(-0.15, -Math.max(0.7, e.length), i) : 0, o = (i) => Qe(n.swing) * s(i);
  return {
    top: t.top,
    bottom: t.bottom,
    inside: (i, r) => t.inside(i + o(r), r),
    position(i, r) {
      const a = s(r);
      if (a === 0) return t.position(i, r);
      const l = o(r), [c, h, u] = Nr(t.position(i + l, r), l);
      return [c, h + n.lift * a, u - n.trail * a];
    },
    normal: (i, r) => Nr(t.normal(i + o(r), r), o(r))
  };
}
const Ib = (t) => t.texture === "spiky" || t.texture === "curly" || t.texture === "locs" ? 104 : t.texture === "wavy" ? 80 : 64;
function Fu(t, e, n, s) {
  return $a(t, _b(e, s), () => ii(t, n, Ib(e)));
}
const Mc = /* @__PURE__ */ new WeakMap();
let Ob = 1;
function _b(t, e) {
  if (Ru(e)) return t;
  let n = Mc.get(t);
  return n || Mc.set(t, n = Ob++), `${n}:${e.swing}:${e.trail}:${e.lift}`;
}
function Nu(t) {
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
function qi(t, [e, n, s]) {
  const o = At(t, [e, n, s]);
  return { x: o.x - t.center.x, y: o.y - t.center.y };
}
function Hb(t, e, n, s = 16) {
  return Array.from({ length: s + 1 }, (o, i) => {
    const r = i / s, a = 1 - r;
    return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
  });
}
function Cb(t, e, n, s, o) {
  const i = t.ry, r = (e.length ?? 1.8) * i, a = qi(t, Nr(s, Qe(o.swing))), l = qi(t, [0, o.lift, -o.trail]), c = Math.hypot(a.x, a.y) || 1, h = e.at === "high" || e.at === "low" || e.at === "top" ? qi(t, [0.95, 0, 0]) : { x: 0 }, u = e.kind === "braid" ? 0.15 : 0.5, f = {
    x: n.x + a.x / c * i * u + h.x * 0.9 + l.x * 0.5,
    y: n.y + a.y / c * i * u * 0.6 + l.y * 0.5
  }, d = { x: n.x + a.x / c * i * u * 0.6 + h.x * 1.3 + l.x, y: n.y + r + l.y };
  return Hb(n, f, d);
}
const ri = (t) => Math.max(1, t * 0.5), Du = (t, e) => Math.max(0.8, Math.min(t * 0.4, 0.1 * e.rx));
function Bu(t, e, n, s, o, i) {
  const { point: r, out: a } = Nu(s.at), l = 1 + n.volume, c = At(e, [r[0] * l, r[1] * l, r[2] * l]), h = ri(o), u = Du(o, e);
  if (s.kind === "bun") {
    const p = s.size ?? 0.32, m = At(e, [r[0] * l + a[0] * p, r[1] * l + a[1] * p, r[2] * l + a[2] * p]);
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
  const f = Cb(e, s, c, a, i), d = (s.size ?? (s.kind === "braid" ? 0.2 : 0.34)) * e.rx * 2;
  if (s.kind === "ponytail")
    t.shape(Wt(f, d, d * 0.15), n.color, h), t.line(f.slice(3, f.length - 3), u);
  else {
    const m = f.slice(0, f.length - 3);
    for (let w = 0; w < 7; w++) {
      const y = m[Math.floor(w / 7 * (m.length - 1))], S = m[Math.floor((w + 1) / 7 * (m.length - 1))], $ = Math.atan2(S.y - y.y, S.x - y.x), v = Math.hypot(S.x - y.x, S.y - y.y), x = d * (1 - w / (7 * 2.2)), M = (w % 2 === 0 ? 1 : -1) * 0.35, T = { x: (y.x + S.x) / 2, y: (y.y + S.y) / 2 };
      t.ellipse(T.x, T.y, v * 0.62, x * 0.5, $ + M, n.color, h * 0.8);
    }
    const b = m[m.length - 1], k = f[f.length - 1];
    t.shape(Wt([b, k], d * 0.7, d * 0.2), n.color, h * 0.8);
  }
  const g = f[s.kind === "braid" ? f.length - 4 : 2];
  t.ellipse(g.x, g.y, d * 0.32, d * 0.22, e.angle, n.color, h);
}
function zu(t, e) {
  return Kt(t, Nu(e.at).out) < -0.2;
}
function Rb(t) {
  const e = (o, i, r = 0, a = 14) => Array.from({ length: a + 1 }, (l, c) => {
    const h = c / a;
    return [o[0] + (i[0] - o[0]) * h + r * Math.sin(Math.PI * h), o[1] + (i[1] - o[1]) * h];
  }), n = Qe(t.part ?? 0), s = (o) => Ro(t, o) + 0.04;
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
      const o = t.length > 0 ? -t.length + 0.25 : -0.4, i = [-2.6, -2, -1.4, 1.4, 2, 2.6, 3.05].map((r) => e([r, Ro(t, r) < 0.9 ? 0.6 : 0.9], [r, o], 0));
      return t.part !== null && i.push(e([n, s(n)], [n, 0.97])), i;
    }
    default:
      return [];
  }
}
function Lb(t, e, n, s, o) {
  if (s.fill === "stipple" || s.hairline.front > 1.5) return;
  const i = o.motion ?? vs, r = o.lineWidth * 0.45 / n.rx, { far: a } = Fu(n, s, Wu(s, r, i), i);
  Pa(e, n, () => {
    for (const l of s.ties) zu(n, l) && Bu(t, n, s, l, o.lineWidth, i);
    qu(t, n, s, o.lineWidth, r, !1);
    for (const l of a) t.shape(l, s.color, ri(o.lineWidth));
    Cu(t, n, s, r, i, o.lineWidth, !1);
  }, o.headOutline);
}
function Br(t, e, n, s) {
  if (n.hairline.front > 1.5) return;
  const o = s.motion ?? vs, i = s.lineWidth * 0.45 / e.rx, r = Wu(n, i, o), a = Du(s.lineWidth, e);
  if (n.fill === "stipple") {
    for (let h = 0.97; h > -1; h -= 0.17)
      for (let u = -Math.PI; u < Math.PI; u += 0.27) {
        const f = Math.round(h * 100) % 2 * 0.13;
        if (r.inside(u + f, h) < 0.02) continue;
        const d = pe(u + f, h);
        if (Kt(e, d) < 0.12) continue;
        const g = At(e, d);
        t.dot(g.x, g.y, a * 0.4);
      }
    return;
  }
  const { near: l } = Fu(e, n, r, o), c = ri(s.lineWidth);
  qu(t, e, n, s.lineWidth, i, !0);
  for (const h of l) t.shape(h, n.color, c);
  Cu(t, e, n, i, o, s.lineWidth, !0);
  for (const h of Rb(n)) {
    const u = h.map(([d, g]) => {
      const [p, m, b] = r.position(d, g);
      return [p * 0.985, m * 0.985, b * 0.985];
    }), f = h.map(([d, g]) => r.normal(d, g));
    for (const d of Hu(e, u, f, 0.12)) t.line(d, a);
  }
  for (const h of n.ties) zu(e, h) || Bu(t, e, n, h, s.lineWidth, o);
}
function qu(t, e, n, s, o, i) {
  for (const r of n.spikes ?? []) {
    const a = pe(Qe(r.around), Math.max(-1, Math.min(1, r.up)));
    if (Kt(e, a) >= 0 !== i) continue;
    const l = [Math.cos(Qe(r.around)), 0, -Math.sin(Qe(r.around))], c = [a[1] * l[2], a[2] * l[0] - a[0] * l[2], -a[1] * l[0]], h = 1 + n.volume + o, u = Math.max(0, r.width), f = Math.max(0, r.length), d = [At(e, a.map((g) => g * (h + f)))];
    for (let g = 0; g < 8; g++) {
      const p = g * Math.PI / 4, m = a.map((b, k) => b * h + u * (l[k] * Math.cos(p) + c[k] * Math.sin(p)));
      d.push(At(e, m));
    }
    t.shape(Aa(d), n.color, ri(s));
  }
}
const Yu = 0.35, Ia = (t) => ({ centre: [t * 0.98, -0.02, -0.08], out: [t, 0, -0.12] });
function Ku(t, e, n, s, o) {
  const { centre: i, out: r } = Ia(n), a = Kt(e, r), l = Math.max(1, s.lineWidth * 0.55), c = s.skin === "none" ? null : s.skin, h = e.ry * 0.27;
  if (!o) {
    const m = At(e, [i[0] * 1.06, i[1], i[2]]);
    t.ellipse(m.x, m.y, e.rx * 0.17, h, e.angle, c, l);
    return;
  }
  const u = At(e, i), f = e.rx * (0.12 + 0.08 * a);
  t.ellipse(u.x, u.y, f, h, e.angle, c, l);
  const d = Math.cos(e.angle), g = Math.sin(e.angle), p = Array.from({ length: 9 }, (m, b) => {
    const k = -Math.PI * 0.55 + b / 8 * Math.PI * 1.1, w = Math.cos(k) * f * 0.45 * -n, y = Math.sin(k) * h * 0.55;
    return { x: u.x + w * d - y * g, y: u.y + w * g + y * d };
  });
  t.line(p, Math.max(0.8, l * 0.7));
}
function Wb(t, e, n, s) {
  Pa(e, n, () => {
    for (const o of [1, -1]) Kt(n, Ia(o).out) < Yu && Ku(t, n, o, s, !1);
  }, s.headOutline);
}
function Fb(t, e, n) {
  for (const s of [1, -1]) Kt(e, Ia(s).out) >= Yu && Ku(t, e, s, n, !0);
}
const ju = {
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
function Nb(t, e) {
  const n = typeof t == "string" ? { style: t } : t, s = n.style ? ju[n.style] : void 0;
  if (n.style && !s) throw new Error(`facialHair: unknown style '${n.style}'`);
  return {
    color: n.color ?? e ?? "#6b4630",
    moustache: n.moustache ?? s?.moustache ?? "none",
    beard: n.beard ?? s?.beard ?? "none"
  };
}
const $e = (t) => t * Math.PI / 180, ho = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, Xu = {
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
}, Db = (t, e) => {
  const n = ho($e(48), $e(100), Ho(e, 0));
  return t.top[0] + (t.top[1] - t.top[0]) * n;
}, Bb = (t) => t === "sideburns" || t === "muttonChops";
function zr(t, e) {
  const n = Xu[t];
  if (!n) return null;
  const s = $e(n.reach), o = (i) => {
    const r = Ho(i, 0);
    return n.shape === "point" ? Math.exp(-((r / 0.42) ** 2)) : n.shape === "square" ? 1 - ho($e(45), $e(85), r) : Math.cos(Math.min(r, Math.PI / 2)) ** 0.7;
  };
  return {
    top: Math.max(n.top[0], n.top[1]) + 0.05,
    bottom: -1,
    inside(i, r) {
      const a = Ho(i, 0), l = Db(n, i);
      let c = Math.min(l - r, s - a);
      if (n.band > 0 && (c = Math.min(c, r - (l - n.band))), Bb(t)) {
        const h = t === "muttonChops" ? $e(70) - $e(22) * ho(0.08, -0.6, r) : $e(72);
        c = Math.min(c, a - h);
      }
      return c;
    },
    position(i, r) {
      const [a, l, c] = pe(i, r), h = 1 + e + n.volume, u = n.length * o(i) * ho(-0.45, -1, r);
      return [a * h, l * h - u, c * h + u * 0.25];
    },
    normal: (i, r) => pe(i, r)
  };
}
function zb(t) {
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
const Ms = (t) => Math.max(1, t * 0.45);
function qb(t, e, n, s) {
  for (let o = 0.1; o > -1; o -= 0.13)
    for (let i = -Math.PI / 1.7; i < Math.PI / 1.7; i += 0.2) {
      const r = Math.round(o * 100) % 2 * 0.1;
      if (n.inside(i + r, o) < 0.02) continue;
      const a = pe(i + r, o);
      if (Kt(e, a) < 0.15) continue;
      const l = At(e, a);
      t.dot(l.x, l.y, s);
    }
}
function Yb(t, e, n, s, o) {
  const i = s.beard === "stubble" ? null : zr(s.beard, o.lineWidth * 0.45 / n.rx);
  if (!i) return;
  const { far: r } = $a(n, s, () => ii(n, i));
  Pa(e, n, () => {
    for (const a of r) t.shape(a, s.color, Ms(o.lineWidth));
  }, o.headOutline);
}
function Kb(t, e, n, s, o) {
  if (n.beard === "none") return;
  const i = s.lineWidth * 0.45 / e.rx;
  if (n.beard === "stubble") {
    qb(t, e, zr("full", i), Math.max(0.5, s.lineWidth * 0.09));
    return;
  }
  if (n.beard === "soulPatch") {
    const l = [{ x: -0.05, y: -0.55 }, { x: 0.05, y: -0.55 }, { x: 0, y: -0.68 }], { points: c, facing: h } = Mt(e, l, { x: 0, y: -0.6 }, s.face?.projection);
    h > -0.05 && t.shape(c, n.color, Ms(s.lineWidth) * 0.7);
    return;
  }
  const r = zr(n.beard, i);
  if (!r) return;
  const { near: a } = $a(e, n, () => ii(e, r));
  for (const l of a) t.shape(l, n.color, Ms(s.lineWidth));
  if (Xu[n.beard]?.aroundMouth) {
    const l = 0.27 * Math.max(0.3, o), c = Array.from({ length: 20 }, (f, d) => {
      const g = Math.PI * 2 * d / 20;
      return { x: Math.cos(g) * l, y: -0.42 + Math.sin(g) * 0.13 };
    }), { points: h, facing: u } = Mt(e, c, { x: 0, y: -0.42 }, s.face?.projection);
    u > -0.05 && t.shape(h, s.skin === "none" ? "#ffffff" : s.skin, 0);
  }
}
function jb(t, e, n, s) {
  if (n.moustache === "none") return;
  const o = { x: 0, y: -0.24 };
  if (n.moustache === "pencil") {
    const l = [-0.2, -0.1, 0, 0.1, 0.2].map((u) => ({ x: u, y: -0.25 + 0.03 * Math.cos(u / 0.2 * Math.PI) })), { points: c, facing: h } = Mt(e, l, o, s.face?.projection);
    h > -0.05 && t.line(c, Math.max(1, s.lineWidth * 0.32));
    return;
  }
  const i = zb(n.moustache);
  if (!i) return;
  const { points: r, facing: a } = Mt(e, i, o, s.face?.projection);
  if (!(a <= -0.05) && (t.shape(r, n.color, Ms(s.lineWidth) * 0.8), n.moustache === "handlebar"))
    for (const l of [1, -1]) {
      const c = Array.from({ length: 10 }, (h, u) => {
        const f = -Math.PI / 2 + u / 9 * Math.PI * 1.4;
        return { x: l * (0.27 + 0.05 * Math.cos(f)), y: -0.21 + 0.05 * (1 + Math.sin(f)) };
      });
      c.unshift({ x: l * 0.22, y: -0.27 }), t.line(Mt(e, c, o, s.face?.projection).points, Ms(s.lineWidth) * 0.8);
    }
}
const Uu = { round: !0, square: !0, sunglasses: !0 };
function Xb(t) {
  const n = (typeof t == "string" ? { style: t } : t).style ?? "round";
  if (!(n in Uu)) throw new Error(`glasses: unknown style '${n}'`);
  return { style: n };
}
const xc = 0.34, ce = 0.12, Ub = 0.05;
function Gb(t, e) {
  return Array.from({ length: 28 }, (s, o) => {
    const i = Math.PI * 2 * o / 28;
    if (t === "round") return { x: e + Math.cos(i) * 0.2, y: ce + Math.sin(i) * 0.19 };
    const r = Math.cos(i), a = Math.sin(i), l = t === "sunglasses" ? 0.22 : 0.21, c = t === "sunglasses" ? 0.17 : 0.16;
    return { x: e + Math.sign(r) * Math.abs(r) ** 0.45 * l, y: ce - 0.01 + Math.sign(a) * Math.abs(a) ** 0.45 * c };
  });
}
function Vb(t, e, n, s) {
  const o = Math.max(1, Math.min(s.lineWidth * 0.5, 0.11 * e.rx)), i = [];
  for (const r of [1, -1]) {
    const a = xc * r, { points: l, facing: c } = Mt(e, Gb(n.style, a), { x: a, y: ce }, s.face?.projection);
    if (c < Ub) continue;
    i.push(r), t.shape(l, n.style === "sunglasses" ? "#1f2328" : null, o);
    const h = [r * 0.97, ce + 0.02, -0.1];
    if (Kt(e, [r, 0, 0]) > 0.15) {
      const u = Mt(e, [{ x: a + r * 0.21, y: ce + 0.02 }], { x: a, y: ce }, s.face?.projection).points[0];
      t.line([u, At(e, h)], o * 0.9);
    }
  }
  if (i.length === 2) {
    const r = [
      { x: xc - 0.2, y: ce + 0.02 },
      { x: 0, y: ce + 0.07 },
      { x: -0.14, y: ce + 0.02 }
    ];
    t.line(Mt(e, r, { x: 0, y: ce }, s.face?.projection).points, o);
  }
}
const Oa = {
  cap: { color: "#d64535", brim: [0.36, 0.16], height: 1, peak: 0.7, detail: "seams" },
  beanie: { color: "#3a6ea5", brim: [0.3, 0.12], height: 1.08, detail: "fold" },
  hardHat: { color: "#f2c230", brim: [0.34, 0.22], height: 1.12, ring: 0.16, detail: "ridge" },
  sunHat: { color: "#e3c98f", brim: [0.36, 0.3], height: 1.02, ring: 0.62, detail: "band" },
  bowler: { color: "#2f2b2a", brim: [0.36, 0.28], height: 1.15, ring: 0.2, detail: "band" }
};
function Jb(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ?? "cap", s = Oa[n];
  if (!s) throw new Error(`hat: unknown style '${n}'`);
  return { style: n, color: e.color ?? s.color };
}
const tn = (t, e) => t.brim[1] + (t.brim[0] - t.brim[1]) * (1 + Math.cos(e)) / 2;
function Zb(t, e) {
  return {
    top: 1,
    bottom: Math.min(...t.brim) - 0.05,
    inside: (n, s) => s - tn(t, n),
    position(n, s) {
      const [o, i, r] = pe(n, s), a = tn(t, n), l = s > a ? (i - a) * (t.height - 1) : 0;
      return [o * e, i * e + l, r * e];
    },
    normal: (n, s) => pe(n, s)
  };
}
function Qb(t, e, n) {
  const o = (i, r, a) => {
    const l = tn(e, i) * n - a;
    return [Math.sin(i) * r, l, Math.cos(i) * r];
  };
  if (e.peak) {
    const i = [], r = [];
    for (let a = 0; a <= 24; a++) {
      const l = (-80 + 160 * a / 24) * (Math.PI / 180), c = e.peak * Math.cos(l) ** 0.6;
      i.push(At(t, [Math.sin(l) * (n + c * 0.25), tn(e, l) * n - 0.07 * Math.cos(l), Math.cos(l) * (n + c)])), r.push(At(t, o(l, n, 0)));
    }
    return [...i, ...r.reverse()];
  }
  return e.ring ? Array.from({ length: 48 }, (i, r) => At(t, o(Math.PI * 2 * r / 48, n + e.ring, 0.07))) : null;
}
function tw(t) {
  const e = (s) => Array.from({ length: 13 }, (o, i) => [s, tn(t, s) + (0.97 - tn(t, s)) * i / 12]), n = (s) => Array.from({ length: 49 }, (o, i) => {
    const r = -Math.PI + Math.PI * 2 * i / 48;
    return [r, tn(t, r) + s];
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
function Gu(t, e, n, s) {
  const o = Oa[n.style], r = 1 + s.lineWidth * 0.45 / e.rx + Math.max(0.05, Math.min(0.3, s.hairVolume) + 0.04), a = Math.max(1, s.lineWidth * 0.5), l = Qb(e, o, r);
  l && t.shape(l, n.color, a);
  const c = Zb(o, r), { near: h, far: u } = ii(e, c);
  for (const d of [...u, ...h]) t.shape(d, n.color, a);
  const f = Math.max(0.8, a * 0.7);
  for (const d of tw(o)) {
    const g = d.map(([m, b]) => {
      const [k, w, y] = c.position(m, b);
      return [k * 0.99, w * 0.99, y * 0.99];
    }), p = d.map(([m, b]) => pe(m, b));
    for (const m of Hu(e, g, p, 0.1)) t.line(m, f);
  }
  if (o.detail === "seams") {
    const d = At(e, [0, r * 1.01, 0]);
    t.dot(d.x, d.y, a * 0.9);
  }
}
function ew(t) {
  const e = t.hair ? $b(t.hair) : null;
  return {
    hair: e,
    facialHair: t.facialHair ? Nb(t.facialHair, e?.color) : null,
    glasses: t.glasses ? Xb(t.glasses) : null,
    hat: t.hat ? Jb(t.hat) : null,
    ears: t.ears ?? !1
  };
}
const Vu = (t) => !t.hair && !t.facialHair && !t.glasses && !t.hat && !t.ears, Ju = (t) => t.axes[2][2] < -0.3, Zu = (t) => t.ears && !t.hair?.coversEars;
function Qu(t, e, n, s, o, i) {
  if (Vu(n)) return;
  const r = { ...i, headOutline: i.face && (i.face.shape === "angular" || i.face.projection === "volume") ? Iu(s, i.face) : void 0 };
  n.hair && Lb(e, t, s, n.hair, { ...r, motion: Co(o) }), n.facialHair && Yb(e, t, s, n.facialHair, r), Zu(n) && Wb(e, t, s, r);
}
function nw(t, e, n, s, o, i, r) {
  if (Vu(n)) {
    r();
    return;
  }
  const a = Ju(s);
  Zu(n) && Fb(e, s, i), n.hair && !a && !i.faceUnderHair && Br(e, s, n.hair, { ...i, motion: Co(o) }), n.facialHair && Kb(e, s, n.facialHair, i, o.mouthWidth ?? 1), r(), n.hair && !a && i.faceUnderHair && Br(e, s, n.hair, { ...i, motion: Co(o) }), n.facialHair && jb(e, s, n.facialHair, i), n.glasses && Vb(e, s, n.glasses, i), n.hat && !a && Gu(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 });
}
function tf(t, e, n, s, o, i) {
  Ju(s) && (n.hair && Br(e, s, n.hair, { ...i, motion: Co(o) }), n.hat && Gu(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 }));
}
const Sc = 40, sw = 0.215 + 0.205, Xt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}, dt = (t, e) => t[e] ?? ht[e] ?? 0;
function ef(t, e, n = ht, s = 1) {
  const o = ni(t), i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (1 + Math.cos(i * 2 * (o.bounces ?? 1))) / 2, c = o.crouch ?? 0, h = o.shoulder ?? 0, u = o.forearm ?? 0, f = { ...ht, ...n };
  f["leg.left.swing"] = o.swing * r + c * 0.6, f["leg.right.swing"] = -o.swing * r + c * 0.6, f["leg.left.knee"] = o.knee * Math.max(0, a) + c * 1.2, f["leg.right.knee"] = o.knee * Math.max(0, -a) + c * 1.2, f["leg.left.ankle"] = dt(n, "leg.left.ankle") - (o.tiptoe ?? 0), f["leg.right.ankle"] = dt(n, "leg.right.ankle") - (o.tiptoe ?? 0);
  for (const [d, g] of [["left", -1], ["right", 1]])
    dt(n, `arm.${d}.spread`) > Sc || dt(n, `arm.${d}.swing`) > Sc || (f[`arm.${d}.swing`] = h + g * o.arm * r, f[`arm.${d}.elbow`] = dt(n, `arm.${d}.elbow`) + u + o.elbow * Math.max(0, g * r));
  return f.lean = dt(n, "lean") + o.lean * s, f.bend = dt(n, "bend") + (o.bend ?? 0), f["head.nod"] = dt(n, "head.nod") - o.lean * 0.5 * s + (o.headTilt ?? 0), f.side = dt(n, "side") + (o.sway ?? 0) * Math.sin(i), f.lift = dt(n, "lift") + (o.bounce ?? 0) * s * l, f.stretch = dt(n, "stretch") * (1 + (o.squash ?? 0) * (l - 0.5)), f;
}
function nf(t, e, n = 1, s = 1) {
  const o = ni(t);
  return 4 * sw * s * e * Math.sin(o.swing * n * Math.PI / 180);
}
const fn = (t) => Eu[t], _a = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: dt(t, "lean") - 4, ...Xt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Xt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Xt("leg", { swing: 25, knee: 60 }), ...fn("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Xt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Xt("arm", { spread: 70, bend: 0 }), ...Xt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Xt("arm", { spread: 60 }),
        "leg.left.swing": dt(t, "leg.left.swing"),
        "leg.right.swing": dt(t, "leg.right.swing"),
        "leg.left.knee": dt(t, "leg.left.knee"),
        "leg.right.knee": dt(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: dt(t, "stretch"), bend: dt(t, "bend"), ...fn("surprised"), ...Xt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": dt(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": dt(t, "head.nod") - 10, bend: dt(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...fn("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
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
        ...fn("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Xt("arm", { spread: 75 }), ...Xt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": dt(t, "arm.left.spread"), "arm.right.spread": dt(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: dt(t, "stretch"), bend: dt(t, "bend"), ...Xt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...fn("scared"), ...Xt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: dt(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: dt(t, "side") + 2.5 * s, "head.tilt": dt(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: dt(t, "side"), "head.tilt": dt(t, "head.tilt"), bend: dt(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": dt(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...fn("sad"), bend: 18, stretch: 0.92, lean: dt(t, "lean") + 5, "head.nod": 14, ...Xt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function ow(t, e) {
  const n = wt(e.from ?? {}), s = e.speed ?? 1;
  let o = n;
  return [
    { time: e.at, pose: n },
    ..._a[t](n).map((i) => (o = { ...o, ...i.pose }, { time: e.at + i.after * s, pose: o, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
function iw(t, e = ht) {
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
function rw(t, e = ht) {
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
const Tc = { sweeping: iw, brushing: rw };
function lS(t, e, n = ht) {
  const s = Tc[t];
  if (!s) throw new Error(`humanCyclePose: ${ft("cycle", t, Object.keys(Tc))}`);
  return s(e, n);
}
function sf(t) {
  const e = t.top ?? !0, n = t.length ?? 0.32, s = t.color ?? "#638c39", o = t.accent ?? "#87ae4e";
  if (typeof e != "boolean") throw new Error("leafOutfit: top must be a boolean");
  if (!Number.isFinite(n) || n < 0.2 || n > 0.45) throw new Error("leafOutfit: length must be 0.2..0.45");
  if (typeof s != "string" || typeof o != "string") throw new Error("leafOutfit: color and accent must be strings");
  return { top: e, length: n, color: s, accent: o };
}
function Ec(t, e) {
  const n = t.flatMap((o) => Array.from({ length: 8 }, (i, r) => ({
    x: o.x + Math.cos(r * Math.PI / 4) * e,
    y: o.y + Math.sin(r * Math.PI / 4) * e
  })));
  let s = Aa(n);
  for (let o = 0; o < 2; o++) s = s.flatMap((i, r) => {
    const a = s[(r + 1) % s.length];
    return [{ x: i.x * 0.75 + a.x * 0.25, y: i.y * 0.75 + a.y * 0.25 }, { x: i.x * 0.25 + a.x * 0.75, y: i.y * 0.25 + a.y * 0.75 }];
  });
  return s;
}
const Ac = (t) => t.flatMap((e) => [e.left, e.right]);
function of(t, e = {}) {
  const { top: n, length: s } = sf(e), o = t.bodyContours;
  if (!o?.spine) throw new Error("leafOutfit requires organic body contours");
  const i = o.spine.samples.filter((a) => a.at <= 0.3), r = ["left", "right"].flatMap((a) => o[`leg.${a}`]?.samples.filter((l) => l.at <= s) ?? []);
  return {
    ...n ? { top: Ec(Ac(o.spine.samples.filter((a) => a.at >= 0.52 && a.at <= 0.91)), t.height * 0.01) } : {},
    skirt: Ec(Ac([...i, ...r]), t.height * 0.012)
  };
}
function aw(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const n of e.slice(1)) t.lineTo(n.x, n.y);
  t.closePath();
}
function lw(t, e, n) {
  const s = e.x - t.x, o = e.y - t.y, i = Math.hypot(s, o) || 1, r = -o / i, a = s / i, l = [];
  for (const c of [1, -1]) for (let h = 0; h <= 16; h++) {
    const u = c === 1 ? h / 16 : 1 - h / 16, d = 3 * (1 - u) * u * n * c;
    l.push({ x: t.x + s * u + r * d, y: t.y + o * u + a * d });
  }
  return l;
}
function $c(t, e, n, s, o, i) {
  const r = e.lineWidth * 0.7;
  if (n.shape(s, o, r), n.look === "silhouette") return;
  t.save(), aw(t, s), t.clip();
  const a = Math.min(...s.map((d) => d.x)), l = Math.max(...s.map((d) => d.x)), c = Math.min(...s.map((d) => d.y)), h = Math.max(...s.map((d) => d.y)), u = l - a, f = h - c;
  for (let d = 0; d < 2; d++) for (let g = 0; g < 5; g++) {
    const p = { x: a + u * (g / 4 + (d ? 0.07 : -0.04)), y: c + f * (d ? 0.38 : -0.1) }, m = { x: p.x + u * 0.09, y: p.y + f * 0.78 };
    n.shape(lw(p, m, u * 0.13), (g + d) % 2 ? o : i, r * 0.6), n.line([p, { x: p.x * 0.45 + m.x * 0.55, y: p.y * 0.45 + m.y * 0.55 }, m], r * 0.45);
    for (const b of [0.32, 0.52, 0.7]) {
      const k = { x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b };
      n.line([{ x: k.x - u * 0.045, y: k.y - f * 0.065 }, k, { x: k.x + u * 0.045, y: k.y - f * 0.05 }], r * 0.3);
    }
  }
  t.restore();
}
function cw(t = {}) {
  const e = sf(t), { color: n, accent: s } = e, o = (i) => (r, a, l) => {
    const c = of(a, e);
    i === "spine" && c.top && $c(r, a, l, c.top, n, s);
    const h = ["spine", "leg.left", "leg.right"].reduce((u, f) => a.parts[u].order > a.parts[f].order ? u : f);
    i === h && $c(r, a, l, c.skirt, n, s);
  };
  return { parts: { spine: { over: o("spine") }, "leg.left": { over: o("leg.left") }, "leg.right": { over: o("leg.right") } } };
}
const hw = { apron: "#d8b48a", labCoat: "#f4f6f8", hoodie: "#6b7280", cardigan: "#6b8e4e", overalls: "", sari: "#16a34a" }, Yi = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1), gt = (t, e, n) => ({ x: t.x + (e.x - t.x) * n, y: t.y + (e.y - t.y) * n });
function uw(t) {
  return t.parts["leg.left"].order > t.parts["leg.right"].order ? "left" : "right";
}
const Pc = (t) => Math.max(t.parts["leg.left"].order, t.parts["leg.right"].order) > t.parts.spine.order, zt = (t) => t.bodyForward?.[2] ?? Math.cos(t.turn * Math.PI / 2), me = (t) => t.bodyForward?.[0] ?? Math.sin(t.turn * Math.PI / 2);
function Ic(t, e, n) {
  t.save(), t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  t.closePath(), t.clip(), n(), t.restore();
}
function Oc(t, e, n = 0) {
  const s = e * (t.length - 1), o = Math.min(t.length - 2, Math.floor(s)), i = t[o], r = t[o + 1], a = gt(i, r, s - o), l = Math.hypot(r.x - i.x, r.y - i.y) || 1;
  return { x: a.x + (r.y - i.y) / l * n, y: a.y - (r.x - i.x) / l * n };
}
function fw(t = {}) {
  if (t = { ...t }, t.top !== void 0 && !["tshirt", "shirt", "blouse", "dress"].includes(t.top)) throw new Error(`basicOutfit: unknown top '${t.top}'`);
  if (t.trouserStyle !== void 0 && !["plain", "jeans", "cargo"].includes(t.trouserStyle)) throw new Error(`basicOutfit: unknown trouser style '${t.trouserStyle}'`);
  const e = t.top, n = t.trouserStyle ?? "plain", s = t.collar ?? e === "shirt", o = t.shirt ?? "#e2493b", i = e === "dress" ? o : t.trousers ?? "#24476b", r = t.sleeves ?? "short", a = e === "dress" ? "skirt" : t.bottom ?? "trousers", l = t.over === "labCoat", c = t.over === "hoodie", h = t.over === "cardigan", u = t.over === "overalls", f = t.over === "sari", d = t.overColor ?? (t.over && t.over !== "overalls" ? hw[t.over] : i), g = t.shoes === "boots", p = t.shoeColor ?? "#3b2a1e", m = (H) => H.lineWidth * 0.45, b = (H, R, z, U) => {
    const W = R.parts[`leg.${U}`].points;
    if (a === "skirt" && !u) return;
    const F = a === "shorts" && !u, D = R.bodyContours?.[`leg.${U}`], V = D ? Di(D, 0, F ? 0.5 : 1, R.height * 6e-3) : Wt(F ? Yi(W, 0, 0.5) : W, R.height * (F ? 0.085 : 0.08), R.height * (F ? 0.07 : 0.05));
    z.shape(V, i, m(R)), !(n === "plain" || zt(R) < 0.15) && Ic(H, V, () => {
      const K = (Z, tt = 0) => Oc(W, Z, tt * R.height);
      if (n === "jeans")
        z.line([K(0.07, -0.018), K(0.17, -0.02), K(0.23, 0), K(0.17, 0.02), K(0.07, 0.018)], m(R) * 0.65), z.line([K(0.27, 0.013), ...[0.4, 0.55, 0.7, 0.85, 0.96].filter((Z) => !F || Z < 0.5).map((Z) => K(Z, 0.013))], m(R) * 0.5);
      else {
        const Z = [K(0.25, -0.024), K(0.25, 0.024), K(0.43, 0.024), K(0.43, -0.024)];
        z.shape(Z, i, m(R) * 0.65), z.line([K(0.28, -0.024), K(0.32, 0), K(0.28, 0.024)], m(R) * 0.65);
        const tt = K(0.32);
        z.dot(tt.x, tt.y, m(R) * 0.8);
      }
    });
  }, k = (H, R, z) => {
    const U = H.parts[`leg.${z}`].points, W = Yi(U, 0.7, 1);
    if (W.length < 2) return;
    R.shape(Wt(W, H.height * 0.075, H.height * 0.07), p, m(H));
    const F = W[0], D = W[1], V = D.x - F.x, K = D.y - F.y, Z = Math.hypot(V, K) || 1, tt = H.height * 0.04;
    R.line([{ x: F.x - K / Z * tt, y: F.y + V / Z * tt }, { x: F.x + K / Z * tt, y: F.y - V / Z * tt }], m(H) * 0.9);
  }, w = (H) => {
    const R = H.chains.spine, z = R[0], U = R[R.length - 1], W = { x: z.x - (U.x - z.x) * 0.25, y: z.y - (U.y - z.y) * 0.25 };
    return { hip: z, top: U, below: W, line: [W, ...H.parts.spine.points] };
  }, y = (H) => {
    if (H.bodyContours?.spine) return Di(H.bodyContours.spine, 0, 0.97, H.height * (c ? 0.014 : 6e-3));
    const R = c ? 1.14 : 1, z = Math.hypot(H.points["hip.left"].x - H.points["hip.right"].x, H.points["hip.left"].y - H.points["hip.right"].y), U = Math.max(H.height * 0.15 * R, z + Math.max(H.height * 0.08, H.lineWidth * 1.45) + m(H));
    return Wt(w(H).line, U, H.height * 0.14 * R);
  }, S = (H, R) => {
    const z = [y(R)], { top: U, hip: W } = w(R);
    h && z.push(Wt([U, gt(U, W, 0.5), gt(U, W, 1.08)], R.height * 0.155, R.height * 0.15)), l && z.push(Wt([U, gt(U, W, 0.5), W], R.height * 0.14, R.height * 0.15));
    const F = Object.values(R.points), D = Math.min(...F.map((tt) => tt.x)) - R.height, V = Math.min(...F.map((tt) => tt.y)) - R.height, K = Math.max(...F.map((tt) => tt.x)) + R.height, Z = Math.max(...F.map((tt) => tt.y)) + R.height;
    for (const tt of z) {
      H.beginPath(), H.rect(D, V, K - D, Z - V), H.moveTo(tt[0].x, tt[0].y);
      for (const _ of tt.slice(1)) H.lineTo(_.x, _.y);
      H.closePath(), H.clip("evenodd");
    }
  }, $ = (H, R) => {
    const z = c ? d : o;
    R.shape(y(H), z, m(H));
  }, v = (H, R, z) => {
    const U = zt(R);
    if (!e || U < 0.2 || c) return;
    const { top: W, hip: F } = w(R), D = me(R) * R.height * 0.025, V = [W, F], K = (Z, tt = 0) => Oc(V, Z, D + tt * R.height * U);
    Ic(H, y(R), () => {
      if (e === "shirt") {
        z.line([K(0.12), K(0.92)], m(R) * 0.65);
        for (const Z of [0.24, 0.4, 0.56, 0.72, 0.88]) {
          const tt = K(Z, 8e-3);
          z.dot(tt.x, tt.y, m(R) * 0.9);
        }
      } else if (e === "blouse") {
        z.line([K(0.025, -0.04), K(0.24), K(0.025, 0.04)], m(R) * 0.75);
        const Z = K(0.31);
        z.dot(Z.x, Z.y, m(R));
      } else e === "dress" ? z.line([K(0.04, -0.035), K(0.17, -0.028), K(0.17, 0.028), K(0.04, 0.035)], m(R) * 0.75) : z.line([K(0.025, -0.035), K(0.1, -0.02), K(0.12), K(0.1, 0.02), K(0.025, 0.035)], m(R) * 0.65);
    });
  }, x = (H, R) => {
    const z = zt(H), { top: U, hip: W } = w(H), F = H.height * 0.07, D = { x: (U.x - W.x) * 0.16, y: (U.y - W.y) * 0.16 };
    if (z >= 0) {
      R.shape(
        [
          { x: U.x - F, y: U.y + D.y * 0.25 },
          { x: U.x - F * 0.8 + D.x, y: U.y + D.y },
          { x: U.x + D.x * 1.2, y: U.y + D.y * 1.35 },
          { x: U.x + F * 0.8 + D.x, y: U.y + D.y },
          { x: U.x + F, y: U.y + D.y * 0.25 }
        ],
        d,
        m(H)
      );
      return;
    }
    const V = gt(U, W, 0.42);
    R.shape(
      [
        { x: U.x - F * 0.9, y: U.y },
        { x: U.x + F * 0.9, y: U.y },
        { x: V.x + F * 0.7, y: V.y },
        { x: V.x, y: V.y + H.height * 0.02 },
        { x: V.x - F * 0.7, y: V.y }
      ],
      d,
      m(H)
    );
  }, M = (H, R) => {
    const z = zt(H);
    if (z < 0.2) return;
    const { top: U, hip: W } = w(H), F = me(H) * H.height * 0.03, D = H.height * 0.06 * z, V = gt(U, W, 0.62), K = gt(U, W, 0.9);
    R.line([{ x: V.x + F - D, y: V.y }, { x: K.x + F - D * 1.1, y: K.y }], m(H) * 0.7), R.line([{ x: V.x + F + D, y: V.y }, { x: K.x + F + D * 1.1, y: K.y }], m(H) * 0.7);
    const Z = gt(U, W, 0.1);
    for (const tt of [-1, 1]) R.line([{ x: Z.x + F + tt * D * 0.2, y: Z.y }, { x: Z.x + F + tt * D * 0.35, y: Z.y + H.height * 0.07 }], m(H) * 0.6);
  }, T = (H, R) => {
    const { top: z, hip: U } = w(H), W = zt(H);
    if (R.shape(Wt([z, gt(z, U, 0.5), gt(z, U, 1.08)], H.height * 0.155, H.height * 0.15), d, m(H)), W < 0.2) return;
    const F = me(H) * H.height * 0.03, D = H.height * 0.02 * W, V = gt(z, U, 0.12), K = gt(z, U, 1.05);
    R.shape([{ x: V.x + F - D, y: V.y }, { x: V.x + F + D, y: V.y }, { x: K.x + F + D * 1.3, y: K.y }, { x: K.x + F - D * 1.3, y: K.y }], o, m(H) * 0.7);
    for (const Z of [0.35, 0.55, 0.75]) {
      const tt = gt(z, U, Z);
      R.dot(tt.x + F + D * 1.6, tt.y, m(H) * 1.2);
    }
  }, A = (H, R) => {
    const z = zt(H), { top: U, hip: W } = w(H), F = me(H) * H.height * 0.04, D = gt(W, U, 0.12), V = gt(W, U, 0.74);
    if (z < 0.15) {
      if (z < -0.3) {
        const _ = H.points["shoulder.left"], X = H.points["shoulder.right"];
        R.line([_, { x: D.x + H.height * 0.03, y: D.y }], m(H) * 0.8), R.line([X, { x: D.x - H.height * 0.03, y: D.y }], m(H) * 0.8);
      }
      return;
    }
    const K = H.height * 0.07 * z;
    R.shape(
      [
        { x: V.x + F - K * 0.75, y: V.y },
        { x: V.x + F + K * 0.75, y: V.y },
        { x: D.x + F + K * 1.1, y: D.y },
        { x: D.x + F - K * 1.1, y: D.y }
      ],
      i,
      m(H)
    );
    for (const _ of ["left", "right"]) {
      const X = H.points[`shoulder.${_}`], ot = { x: V.x + F + (X.x > V.x + F ? 1 : -1) * K * 0.55, y: V.y };
      R.line([ot, { x: X.x + (ot.x - X.x) * 0.15, y: X.y + (ot.y - X.y) * 0.15 }], m(H) * 1.6);
    }
    const Z = gt(V, D, 0.3), tt = K * 0.4;
    R.line([{ x: Z.x + F - tt, y: Z.y }, { x: Z.x + F - tt, y: Z.y + tt * 1.4 }, { x: Z.x + F + tt, y: Z.y + tt * 1.4 }, { x: Z.x + F + tt, y: Z.y }], m(H) * 0.6);
  }, E = (H, R) => {
    const { hip: z, top: U } = w(H), W = gt(z, U, 0.2), F = [H.points["ankle.left"], H.points["ankle.right"]], D = gt(z, { x: (F[0].x + F[1].x) / 2, y: (F[0].y + F[1].y) / 2 }, 0.98), V = H.height * 0.075, K = Math.max(H.height * 0.12, Math.abs(F[0].x - F[1].x) / 2 + H.height * 0.07), Z = D.x - W.x, tt = D.y - W.y, _ = Math.hypot(Z, tt) || 1, X = { x: -tt / _, y: Z / _ };
    if (R.shape(
      [
        { x: W.x + X.x * V, y: W.y + X.y * V },
        { x: D.x + X.x * K, y: D.y + X.y * K },
        { x: D.x - X.x * K, y: D.y - X.y * K },
        { x: W.x - X.x * V, y: W.y - X.y * V }
      ],
      d,
      m(H)
    ), zt(H) > 0.2) {
      const rt = me(H) * H.height * 0.03;
      for (const st of [-0.35, 0, 0.35]) {
        const at = V * 0.5 * st, et = K * 0.45 * st;
        R.line([{ x: W.x + rt + X.x * at, y: W.y + X.y * at + H.height * 0.02 }, { x: D.x + rt + X.x * et, y: D.y + X.y * et }], m(H) * 0.5);
      }
    }
  }, P = (H, R) => {
    const z = zt(H), { top: U, hip: W } = w(H), F = me(H), D = F >= 0 ? "left" : "right", V = D === "left" ? "right" : "left", K = H.points[`shoulder.${D}`], Z = H.height * 0.035;
    if (z < 0.15) {
      const X = gt(U, W, 0.9);
      R.shape(Wt([K, { x: X.x + (K.x - U.x) * 0.5, y: X.y }], Z * 2.2, Z * 2.6), d, m(H));
      return;
    }
    const tt = { x: W.x + (H.points[`hip.${V}`].x - W.x) * 1.2, y: gt(W, U, 0.08).y };
    R.shape(Wt([tt, gt(tt, K, 0.5), K], Z * 2.4, Z * 2), d, m(H));
    const _ = { x: K.x - (W.x - K.x) * 0.05 - F * H.height * 0.03, y: K.y + H.height * 0.16 };
    R.shape(Wt([K, _], Z * 2, Z * 1.6), d, m(H));
  }, O = (H, R) => {
    if (H.bodyContours) {
      R.shape(of(H, { top: !1, length: 0.45 }).skirt, i, m(H));
      return;
    }
    const { hip: z, top: U } = w(H), W = gt(z, U, 0.18), F = [H.points["knee.left"], H.points["knee.right"]], D = gt(z, { x: (F[0].x + F[1].x) / 2, y: (F[0].y + F[1].y) / 2 }, 1.05), V = H.height * 0.075, K = Math.max(H.height * 0.13, Math.abs(F[0].x - F[1].x) / 2 + H.height * 0.08), Z = D.x - W.x, tt = D.y - W.y, _ = Math.hypot(Z, tt) || 1, X = { x: -tt / _, y: Z / _ };
    R.shape(
      [
        { x: W.x + X.x * V, y: W.y + X.y * V },
        { x: D.x + X.x * K, y: D.y + X.y * K },
        { x: D.x - X.x * K, y: D.y - X.y * K },
        { x: W.x - X.x * V, y: W.y - X.y * V }
      ],
      i,
      m(H)
    );
  }, L = (H, R) => {
    const z = zt(H);
    if (z < 0.2) return;
    const { top: U, hip: W } = w(H), F = { x: (W.x - U.x) * 0.12, y: (W.y - U.y) * 0.12 }, D = H.height * 0.045 * z;
    for (const V of [-1, 1])
      R.shape(
        [
          { x: U.x + V * D * 0.2, y: U.y + F.y * 0.1 },
          { x: U.x + V * D * 1.3, y: U.y - F.y * 0.1 },
          { x: U.x + V * D * 0.6 + F.x, y: U.y + F.y }
        ],
        o,
        m(H) * 0.8
      );
  }, q = (H, R, z) => {
    const U = zt(H);
    if (U < 0.25) return;
    const { top: W, hip: F } = w(H), D = me(H) * H.height * 0.03, V = (_) => ({ x: gt(W, F, _).x + D, y: gt(W, F, _).y }), K = H.height * 0.022 * U, Z = V(0.08), tt = V(0.62);
    R.shape([{ x: Z.x - K, y: Z.y - K }, { x: Z.x + K, y: Z.y - K }, { x: Z.x + K * 0.6, y: Z.y + K }, { x: Z.x - K * 0.6, y: Z.y + K }], z, m(H) * 0.7), R.shape([{ x: Z.x - K * 0.6, y: Z.y + K }, { x: Z.x + K * 0.6, y: Z.y + K }, { x: tt.x + K * 1.4, y: tt.y - K * 2 }, tt, { x: tt.x - K * 1.4, y: tt.y - K * 2 }], z, m(H) * 0.7);
  }, G = (H, R) => {
    const z = zt(H), { top: U, hip: W } = w(H), F = gt(W, U, 0.72), D = [H.points["knee.left"], H.points["knee.right"]], V = gt(W, { x: (D[0].x + D[1].x) / 2, y: (D[0].y + D[1].y) / 2 }, 0.9), K = me(H) * H.height * 0.04;
    if (z < 0.15) {
      const _ = gt(W, U, 0.2);
      z < -0.3 && R.line([{ x: _.x - H.height * 0.05, y: _.y }, { x: _.x + H.height * 0.05, y: _.y }], m(H));
      return;
    }
    const Z = H.height * 0.075 * z, tt = gt(W, U, 0.2);
    R.shape(
      [
        { x: F.x + K - Z * 0.7, y: F.y },
        { x: F.x + K + Z * 0.7, y: F.y },
        { x: tt.x + K + Z, y: tt.y },
        { x: V.x + K + Z * 1.15, y: V.y },
        { x: V.x + K - Z * 1.15, y: V.y },
        { x: tt.x + K - Z, y: tt.y }
      ],
      d,
      m(H)
    ), R.line([{ x: F.x + K - Z * 0.6, y: F.y }, { x: U.x - Z * 0.2, y: U.y }, { x: F.x + K + Z * 0.6, y: F.y }], m(H) * 0.8);
  }, Q = (H, R, z) => {
    const { top: U, hip: W } = w(H), F = [H.points["knee.left"], H.points["knee.right"]], D = gt(W, { x: (F[0].x + F[1].x) / 2, y: (F[0].y + F[1].y) / 2 }, 0.95);
    z ? R.shape(Wt([gt(U, W, 0.8), W, D], H.height * 0.145, H.height * 0.17), d, m(H)) : R.shape(Wt([U, gt(U, W, 0.5), W], H.height * 0.14, H.height * 0.15), d, m(H));
    const V = zt(H);
    if (V > 0.2) {
      const K = me(H) * H.height * 0.03, [Z, tt] = z ? [W, D] : [U, W];
      if (R.line([{ x: Z.x + K, y: Z.y }, { x: tt.x + K, y: tt.y }], m(H) * 0.8), !z) {
        const _ = gt(U, W, 0.35), X = H.height * 0.025 * V;
        R.shape([{ x: _.x + K - X * 2.4, y: _.y }, { x: _.x + K - X * 0.6, y: _.y }, { x: _.x + K - X * 0.6, y: _.y + X * 1.6 }, { x: _.x + K - X * 2.4, y: _.y + X * 1.6 }], d, m(H) * 0.6);
      }
    }
  }, j = (H, R, z, U, W) => {
    const F = H.bodyContours?.[`arm.${z}`];
    if (F) {
      const J = Di(F, 0, W, H.height * 6e-3);
      R.shape(J, U, 0);
      const it = y(H);
      for (let lt = 0; lt < J.length; lt++) {
        const ut = J[lt], mt = J[(lt + 1) % J.length];
        $u({ x: (ut.x + mt.x) / 2, y: (ut.y + mt.y) / 2 }, it) || R.line([ut, mt], m(H));
      }
      return;
    }
    const D = H.parts[`arm.${z}`].points, V = D[0], K = H.chains.spine[H.chains.spine.length - 1], tt = [{ x: V.x + (K.x - V.x) * 0.45, y: V.y + (K.y - V.y) * 0.45 }, ...Yi(D, 0, W)], _ = Wt(tt, H.height * 0.085, H.height * (W > 0.6 ? 0.045 : 0.06)), X = tt.length, ot = _.slice(0, X), rt = _.slice(X).reverse();
    R.shape(_, U, 0);
    const st = (J) => Math.hypot(J[1].x - K.x, J[1].y - K.y), [at, et] = st(ot) > st(rt) ? [ot, rt] : [rt, ot];
    R.line(at.slice(1), m(H)), R.line(et.slice(Math.ceil(X * 0.45)), m(H)), R.line([ot[X - 1], rt[X - 1]], m(H));
  }, C = l || c || h, B = C ? d : o, Y = C || r === "long" ? 0.95 : 0.45, I = C || r !== "none", N = (H, R) => {
    a === "skirt" && !u && !f && O(H, R), f && E(H, R), l && Q(H, R, !0), t.over === "apron" && G(H, R);
  }, nt = (H) => (R, z, U) => {
    R.save(), S(R, z), b(R, z, U, H), g && k(z, U, H), R.restore(), uw(z) === H && Pc(z) && N(z, U);
  };
  return {
    parts: {
      "leg.left": { clip: S, over: nt("left") },
      "leg.right": { clip: S, over: nt("right") },
      spine: {
        over: (H, R, z) => {
          c && zt(R) >= 0 && x(R, z), $(R, z), v(H, R, z), s && !c && L(R, z), t.tie && !c && q(R, z, t.tie), l && Q(R, z, !1), h && T(R, z), c && (zt(R) < 0 && x(R, z), M(R, z)), u && A(R, z), f && P(R, z), Pc(R) || N(R, z);
        }
      },
      "arm.left": { over: I ? (H, R, z) => j(R, z, "left", B, Y) : void 0 },
      "arm.right": { over: I ? (H, R, z) => j(R, z, "right", B, Y) : void 0 }
    }
  };
}
const rf = {
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
function dw(t) {
  const e = {};
  for (const n of ["left", "right", "both"]) {
    const s = t[n];
    if (!s) continue;
    const o = typeof s == "string" ? s : s.item, i = rf[o];
    if (!i) throw new Error(`holding: unknown item '${o}'`);
    if (n === "both" && i.hands === "one") throw new Error(`holding: a ${o} is held in one hand ('left' or 'right'), not 'both'`);
    if (n !== "both" && i.hands === "both") throw new Error(`holding: a ${o} is held in both hands ('both')`);
    e[n] = { item: o, color: (typeof s == "object" ? s.color : void 0) ?? i.color };
  }
  return e;
}
function Ki(t, e) {
  const n = t.chains[`arm.${e}`], s = n[n.length - 1], o = n[n.length - 2], i = Math.hypot(s.x - o.x, s.y - o.y) || 1, r = { x: (s.x - o.x) / i, y: (s.y - o.y) / i }, a = t.lineWidth * 0.5;
  return { point: { x: s.x + r.x * a, y: s.y + r.y * a }, along: r, depth: t.parts[`arm.${e}`]?.depth ?? 0 };
}
function dn(t, e, n, s = 0) {
  const o = Math.cos(s), i = Math.sin(s);
  return [
    [-e / 2, -n / 2],
    [e / 2, -n / 2],
    [e / 2, n / 2],
    [-e / 2, n / 2]
  ].map(([r, a]) => ({ x: t.x + r * o - a * i, y: t.y + r * i + a * o }));
}
const pn = (t, e, n, s, o = 12) => Array.from({ length: o + 1 }, (i, r) => {
  const a = n + (s - n) * r / o;
  return { x: t.x + Math.cos(a) * e, y: t.y + Math.sin(a) * e };
});
function _c(t, e, n, s, o, i = 1, r) {
  const { point: a, along: l } = n, c = s / 300;
  switch (e.item) {
    case "mug": {
      const h = dn({ x: a.x, y: a.y - 4 * c }, 20 * c, 24 * c);
      t.line(pn({ x: a.x + 10 * c * Math.sign(i || 1), y: a.y - 4 * c }, 7 * c, -Math.PI / 2, Math.PI / 2).map((u) => ({ x: a.x + (u.x - a.x) * Math.sign(i || 1), y: u.y })), o), t.shape(h, e.color, o);
      return;
    }
    case "phone": {
      const h = Math.atan2(l.y, l.x) - Math.PI / 2;
      t.shape(dn(a, 13 * c, 24 * c, h), e.color, o), t.shape(dn(a, 9 * c, 17 * c, h), "#8fd0f5", 0);
      return;
    }
    case "book": {
      const h = 26 * c, u = 34 * c;
      t.shape([{ x: a.x, y: a.y - u / 2 }, { x: a.x - h, y: a.y - u / 2 - 3 * c }, { x: a.x - h, y: a.y + u / 2 - 3 * c }, { x: a.x, y: a.y + u / 2 }], e.color, o), t.shape([{ x: a.x, y: a.y - u / 2 }, { x: a.x + h, y: a.y - u / 2 - 3 * c }, { x: a.x + h, y: a.y + u / 2 - 3 * c }, { x: a.x, y: a.y + u / 2 }], e.color, o);
      for (const f of [-1, 1])
        for (const d of [0.3, 0.5, 0.7]) {
          const g = a.y - u / 2 + u * d;
          t.line([{ x: a.x + f * 5 * c, y: g }, { x: a.x + f * (h - 5 * c), y: g - 2 * c }], Math.max(0.8, o * 0.5));
        }
      return;
    }
    case "bag": {
      const h = a.y + 10 * c;
      t.line([{ x: a.x - 9 * c, y: h }, { x: a.x - 5 * c, y: a.y - 2 * c }, { x: a.x + 5 * c, y: a.y - 2 * c }, { x: a.x + 9 * c, y: h }], o), t.shape([{ x: a.x - 17 * c, y: h }, { x: a.x + 17 * c, y: h }, { x: a.x + 20 * c, y: h + 40 * c }, { x: a.x - 20 * c, y: h + 40 * c }], e.color, o);
      return;
    }
    case "briefcase": {
      t.line(pn({ x: a.x, y: a.y + 6 * c }, 7 * c, Math.PI, Math.PI * 2), o), t.shape(dn({ x: a.x, y: a.y + 22 * c }, 46 * c, 32 * c), e.color, o), t.line([{ x: a.x - 23 * c, y: a.y + 14 * c }, { x: a.x + 23 * c, y: a.y + 14 * c }], Math.max(0.8, o * 0.6));
      return;
    }
    case "umbrella": {
      const h = 78 * c, u = (r ?? a.y - 120 * c) - 14 * c, f = { x: a.x, y: Math.min(a.y - 60 * c, u - h * 0.55) };
      t.line([{ x: a.x, y: a.y + 10 * c }, f], o), t.line(pn({ x: a.x + 5 * c, y: a.y + 10 * c }, 5 * c, Math.PI, 0, 8), o);
      const d = [...pn({ x: f.x, y: f.y + h * 0.55 }, h, Math.PI, Math.PI * 2, 24)], g = [];
      for (let p = 4; p >= 0; p--) {
        const m = f.x - h + 2 * h * p / 5;
        g.push(...pn({ x: m + h / 5, y: f.y + h * 0.55 }, h / 5, 0, -Math.PI, 6).reverse());
      }
      t.shape([...d, ...g], e.color, o);
      return;
    }
    case "broom": {
      const h = { x: l.x * 0.4 + 0.25 * Math.sign(i || 1), y: Math.max(0.6, l.y) }, u = Math.hypot(h.x, h.y), f = { x: h.x / u, y: h.y / u }, d = { x: a.x - f.x * 40 * c, y: a.y - f.y * 40 * c }, g = { x: a.x + f.x * 120 * c, y: a.y + f.y * 120 * c };
      t.line([d, g], o * 1.1);
      const p = { x: -f.y, y: f.x }, m = [
        { x: g.x + p.x * 6 * c, y: g.y + p.y * 6 * c },
        { x: g.x - p.x * 6 * c, y: g.y - p.y * 6 * c },
        { x: g.x - p.x * 16 * c + f.x * 34 * c, y: g.y - p.y * 16 * c + f.y * 34 * c },
        { x: g.x + p.x * 16 * c + f.x * 34 * c, y: g.y + p.y * 16 * c + f.y * 34 * c }
      ];
      t.shape(m, e.color, o);
      return;
    }
    case "cane": {
      const h = Math.min(0.56 * s, Math.max(0.3 * s, -a.y)), u = 0.12 * Math.sign(i || 1), f = { x: u / Math.hypot(u, 1), y: 1 / Math.hypot(u, 1) }, d = { x: a.x + f.x * h, y: a.y + f.y * h }, g = pn({ x: a.x + 7 * c * Math.sign(i || 1), y: a.y - 2 * c }, 7 * c, Math.PI, Math.PI * 2, 8).map((p) => ({ x: a.x + (p.x - a.x) * Math.sign(i || 1), y: p.y }));
      t.line([...g, { x: a.x, y: a.y + 2 * c }, d], o * 1.2), t.shape(dn({ x: d.x, y: d.y - 3 * c }, 9 * c, 7 * c), e.color, 0);
      return;
    }
    case "parcel": {
      const h = { x: a.x, y: a.y - 6 * c };
      t.shape(dn(h, 50 * c, 40 * c), e.color, o), t.line([{ x: h.x - 25 * c, y: h.y - 6 * c }, { x: h.x + 25 * c, y: h.y - 6 * c }], Math.max(0.8, o * 0.7)), t.line([{ x: h.x, y: h.y - 20 * c }, { x: h.x, y: h.y + 20 * c }], Math.max(0.8, o * 0.7));
      return;
    }
  }
}
const Hc = (t, e) => (t[`held.${e}`] ?? 1) >= 0.5, Cc = (t) => Math.sin(t * Math.PI / 2);
function pw(t) {
  const e = (i) => Math.max(1, i.lineWidth * 0.45), n = (i) => (r, a, l, c, h) => {
    const u = t[i];
    u && Hc(h ?? {}, i) && _c(l, u, Ki(a, i), a.height, e(a), Cc(a.turn), a.head.center.y - a.head.ry);
  }, s = (i, r, a, l, c) => {
    const h = t.both;
    if (!h || !Hc(c ?? {}, "both")) return;
    const u = Ki(r, "left"), f = Ki(r, "right"), d = {
      point: { x: (u.point.x + f.point.x) / 2, y: (u.point.y + f.point.y) / 2 },
      along: { x: (u.along.x + f.along.x) / 2, y: (u.along.y + f.along.y) / 2 },
      depth: (u.depth + f.depth) / 2
    };
    _c(a, h, d, r.height, e(r), Cc(r.turn), r.head.center.y - r.head.ry);
  }, o = { parts: {} };
  if (t.left && (o.parts["arm.left"] = { over: n("left") }), t.right && (o.parts["arm.right"] = { over: n("right") }), t.both) {
    const i = (r) => (a, l, c, h, u) => {
      const f = r === "left" ? "right" : "left";
      (r === "left" ? l.parts["arm.left"].depth >= l.parts["arm.right"].depth : l.parts["arm.right"].depth > l.parts[`arm.${f}`].depth) && s(a, l, c, h, u);
    };
    for (const r of ["left", "right"]) o.parts[`arm.${r}`] = { ...o.parts[`arm.${r}`], over: gw(o.parts[`arm.${r}`]?.over, i(r)) };
  }
  return o;
}
function gw(t, e) {
  return t ? (n, s, o, i, r) => {
    t(n, s, o, i, r), e(n, s, o, i, r);
  } : e;
}
function ji(t, e) {
  const n = (o, i) => o && i ? (r, a, l, c, h) => {
    o(r, a, l, c, h), i(r, a, l, c, h);
  } : o ?? i, s = {};
  for (const o of /* @__PURE__ */ new Set([...Object.keys(t.parts ?? {}), ...Object.keys(e.parts ?? {})])) {
    const i = t.parts?.[o], r = e.parts?.[o];
    s[o] = { under: n(i?.under, r?.under), clip: n(i?.clip, r?.clip), over: n(i?.over, r?.over) };
  }
  return { behind: n(t.behind, e.behind), parts: s, front: n(t.front, e.front) };
}
function ai(t = {}) {
  if (t.build && !(t.build in Rr)) throw new Error(`character: unknown build '${t.build}'`);
  const e = t.build ? Rr[t.build] : {}, n = (t.proportions ?? "bold") === "bold", s = t.figure ?? "fluid", o = t.look ?? "clean", i = t.height ?? 300, r = s === "stick", a = s === "organic", l = t.shoulderWidth ?? e.shoulderWidth ?? (a ? 0.07 : 0.06), c = t.hipWidth ?? e.hipWidth ?? (a ? 0.045 : 0.022), h = t.lineWidth ?? i * (a ? 5e-3 : n ? 0.045 : 0.022), u = t.ink ?? (a ? "#53362d" : o === "pencil" ? "#2f2f33" : "#1e293b"), f = t.skin ?? (a ? "#f1bf98" : o === "pencil" ? "none" : "#ffffff"), d = a ? nb(t.body ?? {}, { skin: f, ink: u, lineWidth: h, shoulderWidth: l, hipWidth: c }) : void 0;
  if (t.leafOutfit && !a) throw new Error("character: leafOutfit requires figure: 'organic'");
  const g = t.outfit ? fw(t.outfit) : null, p = t.holding ? dw(t.holding) : {};
  let m = g ? ji(g, t.layers ?? {}) : t.layers ?? {};
  return t.leafOutfit && (m = ji(cw(t.leafOutfit), m)), Object.keys(p).length > 0 && (m = ji(m, pw(p))), {
    plan: t.plan ?? Tu({
      headSize: t.headSize ?? e.headSize ?? (a ? 0.27 : n ? 0.3 : 0.24),
      shoulderWidth: r ? 0 : l,
      hipWidth: r ? 0 : c,
      legLength: t.legLength ?? e.legLength ?? 1,
      armLength: t.armLength ?? e.armLength ?? 1,
      feet: t.feet ?? e.feet
    }),
    figure: s,
    ...d ? { body: d } : {},
    look: o,
    height: i,
    lineWidth: d?.outline.width ?? h,
    ink: d?.outline.color ?? u,
    skin: d?.fill ?? f,
    seed: t.seed ?? 1,
    pencil: a ? { construction: !1, ...t.pencil } : t.pencil ?? {},
    layers: m,
    holding: p,
    contact: t.contact ?? "ground",
    hands: t.hands ?? (a ? "cartoon" : "dot"),
    handStyle: t.handStyle ?? (a ? "natural" : "glove"),
    handSize: t.handSize ?? (a ? 0.073 : t.handStyle === "natural" ? 0.14 : 0.17),
    head: ew(t),
    face: { ...a ? { style: "anime", projection: "volume", iris: "#66422e", nose: !0 } : {}, ...t.face, teeth: t.face?.teeth ?? !1, tongue: t.face?.tongue ?? !1 }
  };
}
function cS(t, e, n, s) {
  const { point: o, facing: i } = Bn(t, [e, n, s]);
  return { point: o, facing: i };
}
const qr = (t) => t.rest[1] < -0.5, mw = 0.3;
function yw(t, e, n) {
  return t.figure === "stick" ? qr(e) ? n.slice(0, 3) : n : qr(e) && n.length >= 3 ? Dn(n[0], n[1], n[2], mw) : n.length === 3 ? Dn(n[0], n[1], n[2], 1) : n;
}
function xs(t, e) {
  const n = t.plan.id === "human" ? { ...ht, ...e } : e;
  return li(t, n, Ta(t.plan, n, { height: t.height, contact: t.contact }));
}
function li(t, e, n) {
  const s = {}, o = {}, i = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((d) => {
    const g = n.chains[d.id];
    s[d.id] = g.points;
    const p = g.depths.reduce((w, y) => w + y, 0) / g.depths.length, m = d.parent ? n.chains[d.parent] : void 0, b = m ? m.depths[d.at ?? m.depths.length - 1] : n.hipDepth, k = p - b;
    i[d.id] = Math.abs(k) < r ? 0 : k, o[d.id] = { points: yw(t, d, g.points), depth: p, order: 0 };
  }), o.head = { points: [n.head.center], depth: n.head.depth, order: 0 }, i.head = 0;
  const a = [...t.plan.chains.map((d) => d.id), "head"], l = (d) => t.body && d.startsWith("arm.") && i[d] >= 0 ? 1 : 0, c = [...a].sort((d, g) => l(d) - l(g) || i[d] - i[g] || a.indexOf(d) - a.indexOf(g));
  c.forEach((d, g) => {
    o[d].order = g;
  });
  const h = { hip: n.hip };
  for (const [d, [g, p]] of Object.entries(t.plan.landmarks ?? {})) {
    const m = n.chains[g]?.points;
    m && (h[d] = m[Math.min(p, m.length - 1)]);
  }
  const u = {};
  for (const [d, g] of Object.entries(h)) u[d] = g.y >= n.groundY - 0.01 * t.height;
  const f = {
    height: t.height,
    lineWidth: t.lineWidth,
    turn: e.turn ?? 0,
    ...n.bodyForward ? { bodyForward: n.bodyForward } : {},
    points: h,
    chains: s,
    parts: o,
    head: n.head,
    groundY: n.groundY,
    grounded: u
  };
  return t.body && (f.bodyContours = ib(t.body, f, t.plan)), { skeleton: n, joints: f, order: c };
}
function ae(t, e) {
  return xs(t, e).joints;
}
function af(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const o = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), i = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = Mt(s, o, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide(Mt(s, i, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function lf(t, e, n, s, o, i) {
  const r = n.lineWidth;
  if (n.body && n.skin === "none" && (e = Is(t, e)), o === "head") {
    const { head: d } = s;
    let g;
    const p = () => g ??= Iu(d, n.face), m = n.skin === "none" ? null : n.skin;
    n.face.projection === "volume" || n.face.shape === "angular" ? e.shape(p(), m, r) : e.ellipse(d.center.x, d.center.y, d.rx, d.ry, d.angle, m, r), n.body && n.skin !== "none" && e.look === "clean" && ou(t, p(), d.center, n.body.shading), nw(t, e, n.head, d, i, { lineWidth: r, skin: n.skin, face: n.face, faceUnderHair: !!n.body }, () => {
      e.look !== "silhouette" && (t.save(), n.body && (t.beginPath(), p().forEach((b, k) => k ? t.lineTo(b.x, b.y) : t.moveTo(b.x, b.y)), t.closePath(), t.clip()), mb(e, d, i, r, { ...n.face, skin: n.skin === "none" ? "#ffffff" : n.skin }, t), t.restore());
    });
    return;
  }
  const a = n.plan.chains.find((d) => d.id === o), l = s.chains[o], c = s.parts[o].points;
  if (n.body && uc(t, e, n.body, s, o)) {
    if (o.startsWith("leg.") && uc(t, e, n.body, s, o.replace("leg.", "foot.")), o.startsWith("arm."))
      if (n.hands === "cartoon") Rc(t, e, n, l, o.endsWith(".left") ? "left" : "right", i);
      else {
        const d = l.at(-1);
        e.ellipse(d.x, d.y, n.height * 0.014, n.height * 0.014, 0, n.skin === "none" ? null : n.skin, r);
      }
    return;
  }
  if (n.figure === "stick") {
    if (o === "neck") return;
    const d = o === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(d, r);
    return;
  }
  const h = (d, g) => [a.bones[d].width[0] * r, a.bones[g].width[1] * r];
  if (qr(a)) {
    const [d, g] = h(0, 1);
    if (e.limb(c, d, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && o.startsWith("arm."))
      Rc(t, e, n, l, o.endsWith(".left") ? "left" : "right", i);
    else {
      const p = l[l.length - 1];
      e.dot(p.x, p.y, r * 0.62);
    }
    return;
  }
  if (o === "spine") {
    const d = s.points["hip.left"], g = s.points["hip.right"];
    d && g && Math.hypot(d.x - g.x, d.y - g.y) > 0.5 && e.limb([d, g], r * 1.3, r * 1.3);
    const [p, m] = h(0, a.bones.length - 1);
    e.limb(c, p, m);
    const b = s.points["shoulder.left"], k = s.points["shoulder.right"];
    b && k && Math.hypot(b.x - k.x, b.y - k.y) > 0.5 && e.limb(Dn(b, l[l.length - 1], k, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, f] = h(0, a.bones.length - 1);
  e.limb(c, u, f);
}
function bw(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const o = t.turn ?? 0, i = e === "right" ? 1 - o : 1 + o;
  return { ...It, ...s, turn: i + (s.turn ?? 0) };
}
function Rc(t, e, n, s, o, i) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  wa(t, r, bw(i, o), {
    size: n.handSize * n.height,
    side: o,
    angle: l,
    pen: e,
    skin: n.skin === "none" && !n.body ? "#ffffff" : n.skin,
    // A cartoon glove: three fingers and a thumb, plump enough to match the limbs.
    // Natural: five fingers, a little fuller than a real hand so they hold up against the limbs.
    fingers: n.handStyle === "natural" ? 5 : 4,
    plump: n.handStyle === "natural" ? 1.15 : 1.6,
    lineWidth: n.lineWidth * (n.body ? 0.65 : 0.3),
    connected: !!n.body,
    shading: n.body?.shading,
    nails: n.body ? !1 : void 0
  });
}
function ww(t, e, n, s = 0) {
  const o = e.plan.id === "human" ? { ...ht, ...n } : n;
  Ha(t, e, o, xs(e, o), s);
}
function ci(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function hS(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ht, ...e } : e, i = Ea(t.plan, o, { height: s.height, contact: t.contact }, n);
  return li(ci(t, i.height), o, i).joints;
}
function uS(t, e, n, s, o) {
  const i = e.plan.id === "human" ? { ...ht, ...n } : n, r = Ea(e.plan, i, { height: o.height, contact: e.contact }, s), a = ci(e, r.height);
  Ha(t, a, i, li(a, i, r), o.time ?? 0);
}
function kw(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ht, ...e } : e, i = Ea(t.plan, o, { height: s.height, contact: t.contact }, n), r = ci(t, i.height), { joints: a, order: l } = li(r, o, i), c = i.height / s.height, h = l.map((g) => (a.parts[g]?.depth ?? 0) / c), u = l.filter((g) => g === "spine" || g.startsWith("leg.")), f = Math.max(...u.map((g) => a.parts[g].depth / c)), d = Math.max(...u.map((g) => a.parts[g].order));
  return l.map((g, p) => ({
    part: g,
    depth: h[p],
    ...r.body ? { sortDepth: g.startsWith("arm.") && p > d ? Math.max(h[p], f) : h[p] } : {},
    draw(m, b = 0) {
      const k = ei(m, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: ne(`${r.seed}:${g}`), time: b, pencil: r.pencil }), w = (S) => {
        S && (m.save(), S(m, a, k, b, o), m.restore());
      };
      m.save(), m.lineCap = "round", m.lineJoin = "round", p === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && af(k, r, a), w(r.layers.behind), Qu(m, r.body && r.skin === "none" ? Is(m, k) : k, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin, face: r.face }));
      const y = r.layers.parts?.[g];
      w(y?.under), m.save(), y?.clip?.(m, a, k, b, o), lf(m, k, r, a, g, o), m.restore(), w(y?.over), p === l.length - 1 && (tf(m, k, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }), w(r.layers.front)), m.restore();
    }
  }));
}
function Ha(t, e, n, s, o, i) {
  const { joints: r } = s, a = i ? s.order.filter((h) => i.has(h)) : s.order, l = ei(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: o,
    pencil: e.pencil
  }), c = (h) => {
    h && (t.save(), h(t, r, l, o, n), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", !i && e.look === "pencil" && e.pencil.construction !== !1 && af(l, e, r), i || c(e.layers.behind), Qu(t, e.body && e.skin === "none" ? Is(t, l) : l, e.head, r.head, n, { lineWidth: e.lineWidth, skin: e.skin, face: e.face });
  for (const h of a) {
    const u = e.layers.parts?.[h];
    c(u?.under), t.save(), u?.clip?.(t, r, l, o, n), lf(t, l, e, r, h, n), t.restore(), c(u?.over);
  }
  tf(t, l, e.head, r.head, n, { lineWidth: e.lineWidth, skin: e.skin }), i || c(e.layers.front), t.restore();
}
function fS(t, e, n, s) {
  const o = e.plan.id === "human" ? { ...ht, ...n } : n, i = xs(e, o).joints.head.rx, r = ci(e, e.height * s.radius / Math.max(1e-6, i)), a = xs(r, o);
  t.save(), t.translate(s.x - a.joints.head.center.x, s.y - a.joints.head.center.y), Ha(t, r, o, a, s.time ?? 0, /* @__PURE__ */ new Set(["head"])), t.restore();
}
function cf(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
function Re(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...ht, ...e } : e;
  let i;
  if (Array.isArray(s))
    i = s;
  else {
    const { skeleton: r } = xs(t, o), a = Ta(t.plan, { ...o, roll: 0 }, { height: t.height, contact: "none" }), l = (o.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), f = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), d = Math.PI / 2 * (o.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(d), m = Math.sin(d);
    i = [u * p - g * m, -f, u * m + g * p];
  }
  return Io(t.plan, o, n, i, { height: t.height });
}
const hf = /* @__PURE__ */ new Set(["walk", "walking", "gait"]);
function Ca(t, e = ht, n) {
  let s = { ...e };
  for (const [i, r] of Object.entries(t))
    typeof r == "number" && !hf.has(i) && (s[i] = r);
  const o = Math.max(0, Math.min(1, typeof t.walking == "number" ? t.walking : 0));
  if (o > 0) {
    const i = typeof t.gait == "string" ? t.gait : void 0, r = i ? n?.[i] ?? i : void 0, a = ef(r, typeof t.walk == "number" ? t.walk : 0, s);
    s = Object.fromEntries(Object.keys({ ...s, ...a }).map((l) => [l, (s[l] ?? 0) + ((a[l] ?? 0) - (s[l] ?? 0)) * o]));
  }
  return s;
}
function dS(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, o = e.plan.id === "human" ? ht : {};
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
      i.translate(n / 2, s), ww(i, e, Ca(r.props ?? {}, o, t.gaits), a);
    }
  };
}
function vw(t, e, n) {
  const s = (i) => ({ x: i.x + e, y: i.y + n }), o = (i) => Object.fromEntries(Object.entries(i).map(([r, a]) => [r, a.map(s)]));
  return {
    ...t,
    ...t.bodyContours ? { bodyContours: Object.fromEntries(Object.entries(t.bodyContours).map(([i, r]) => [i, {
      ...r,
      outline: r.outline.map(s),
      samples: r.samples.map((a) => ({ ...a, center: s(a.center), left: s(a.left), right: s(a.right) }))
    }])) } : {},
    points: Object.fromEntries(Object.entries(t.points).map(([i, r]) => [i, s(r)])),
    chains: o(t.chains),
    parts: Object.fromEntries(Object.entries(t.parts).map(([i, r]) => [i, { ...r, points: r.points.map(s) }])),
    head: { ...t.head, center: s(t.head.center) },
    groundY: t.groundY + n
  };
}
function pS(t, e, n) {
  const s = t.character;
  if (!s) throw new Error("characterAt: the target was not made by characterTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "x" || c === "motionPathX" ? i = typeof h == "number" ? h : i : c === "y" || c === "motionPathY" ? r = typeof h == "number" ? h : r : (typeof h == "number" || hf.has(c)) && (o[c] = h);
  const a = Ca(o, s.plan.id === "human" ? ht : {}, t.gaits), l = ae(s, a);
  return { pose: a, joints: vw(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function uf(t, e = ht) {
  const n = [];
  return t.forEach((s, o) => {
    const i = o === 0 ? e : n[o - 1], r = typeof s.pose == "string" ? fe[s.pose] : void 0;
    n.push(r ? { ...r, turn: i.turn ?? 0 } : { ...i, ...s.pose });
  }), n;
}
function gS(t, e, n = ht) {
  const s = uf(e, n);
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
const hi = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], de = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Lo = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Ra = (t) => Math.hypot(...t), ff = (t) => Lo(t, 1 / (Ra(t) || 1)), ui = (t) => ({ ...ht, ...t }), La = (t) => oi(t.character.plan, ui(t.pose), { height: t.character.height, contact: t.character.contact });
function qn(t, e, n) {
  return hi(t.position, La(t).chains[e][n]);
}
function df(t, e, n) {
  const s = ui(t.pose), o = La(t).hip, i = si(t.character.plan, s, t.character.height), r = de(de(n, t.position), o), a = Os(r, (s.roll ?? 0) * Math.PI / 180), l = hi(i.root, Gt(a, -(s.turn ?? 0) * Math.PI / 2));
  return Io(t.character.plan, s, e, l, { height: t.character.height });
}
function Mw(t, e, n, s = "toe") {
  const o = `leg.${e}`, i = s === "toe" ? 3 : 2;
  let r = { ...t, pose: ui(t.pose), position: [...t.position] };
  for (let l = 0; l < 6; l++) {
    const c = La(r).chains[o], h = de(c[i], c[2]);
    r = { ...r, pose: df(r, o, de(n, h)) };
    const u = qn(r, o, i);
    r.position[1] += n[1] - u[1];
  }
  const a = Ra(de(qn(r, o, i), n));
  return { ...r, reached: a < t.character.height * 2e-3 };
}
function Lc(t, e) {
  const n = qn(t, `arm.${e}`, 2), s = qn(t, `arm.${e}`, 1);
  return hi(n, Lo(ff(de(n, s)), t.character.lineWidth * 0.5));
}
function mS(t, e, n = {}) {
  const s = Math.min(t.character.height, e.character.height), o = n.length ?? s * 0.22;
  if (!(o > 0) || !Number.isFinite(o)) throw new Error("meetDandiya: stick length must be positive and finite");
  const i = n.point ?? [(t.position[0] + e.position[0]) / 2, Math.max(t.position[1], e.position[1]) + s * 0.62, (t.position[2] + e.position[2]) / 2], r = (c, h) => {
    const u = ff([i[0] - c.position[0], s * 0.2, i[2] - c.position[2]]), f = de(i, Lo(u, o));
    let d = ui(c.pose);
    for (let p = 0; p < 6; p++) {
      const m = { ...c, pose: d }, b = qn(m, `arm.${h}`, 2);
      d = df(m, `arm.${h}`, de(f, de(Lc(m, h), b)));
    }
    for (const [p, m] of Object.entries(Ot.hold)) d[`hand.${h}.${p}`] = m;
    const g = Lc({ ...c, pose: d }, h);
    return { pose: d, stick: { grip: g, tip: hi(g, Lo(u, o)) } };
  }, a = r(t, n.sideA ?? "right"), l = r(e, n.sideB ?? "right");
  return {
    a: a.pose,
    b: l.pose,
    sticks: [a.stick, l.stick],
    point: i,
    reached: [a.stick, l.stick].every((c) => Ra(de(c.tip, i)) < s * 2e-3)
  };
}
function xw(t, e) {
  const n = e.count ?? 8, s = e.beatsPerTurn ?? 32;
  if (!Number.isFinite(t) || !Number.isFinite(e.radius) || e.radius <= 0 || !Number.isInteger(n) || n < 1 || !Number.isFinite(s) || s <= 0) throw new Error("danceCircleAt: finite beat, positive radius/beatsPerTurn and a positive integer count are required");
  const o = e.center ?? [0, 0], i = e.direction ?? 1;
  if (o.length !== 2 || !o.every(Number.isFinite) || !Number.isFinite(e.angle ?? 0) || !Number.isFinite(e.spins ?? 0) || ![1, -1].includes(i) || e.facing !== void 0 && !(typeof e.facing == "number" ? Number.isFinite(e.facing) : ["inward", "outward", "tangent"].includes(e.facing))) throw new Error("danceCircleAt: center, angle, spins and facing must be finite; direction is 1 or -1");
  const r = e.character ?? ai({ height: 1.7 }), a = e.style ?? "garba", l = (h, u) => {
    const f = (e.angle ?? 0) + 360 * u / n + i * 360 * h / s, d = f * Math.PI / 180, g = e.facing ?? "inward", p = (typeof g == "number" ? g : f + (g === "inward" ? 180 : g === "tangent" ? i * 90 : 0)) + (e.spins ?? 0) * 360 * h / s, m = Oo(a, h, { ...e.pose, turn: p / 90 });
    return { character: r, position: [o[0] + e.radius * Math.sin(d), 0, o[1] + e.radius * Math.cos(d)], pose: m.pose, heading: p, strike: m.strike };
  }, c = Oo(a, t).contact;
  return Array.from({ length: n }, (h, u) => {
    const f = l(t, u);
    if (e.plantFeet === !1) return { ...f, planted: !1 };
    const d = l(c.start, u), g = qn(d, `leg.${c.side}`, 3), p = Mw(f, c.side, g);
    return {
      ...f,
      pose: cf(f.pose, p.pose, c.weight),
      position: [f.position[0], p.position[1] * c.weight, f.position[2]],
      planted: p.reached && c.weight === 1
    };
  });
}
function yS(t, e) {
  if (e.count !== void 0 && e.count !== t.length) throw new Error("danceCircleTracks: count must match targets.length");
  const n = e.bpm ?? 120, s = e.samplesPerBeat ?? 16;
  if (!t.length || ![n, e.beats, s].every((l) => Number.isFinite(l) && l > 0)) throw new Error("danceCircleTracks: targets and positive finite bpm, beats and samplesPerBeat are required");
  if (!Number.isFinite(e.start ?? 0)) throw new Error("danceCircleTracks: start must be finite");
  const o = Math.max(1, Math.ceil(e.beats * s)), i = Array.from({ length: o + 1 }, (l, c) => ({ time: (e.start ?? 0) + e.beats * c / o * 6e4 / n, members: xw(e.beats * c / o, { ...e, count: t.length }) })), r = i.some((l) => l.members.some((c) => c.pose.roll !== 0)), a = /* @__PURE__ */ new Set(["x", "y", "z", "rotateY", ...r ? ["turn", "roll"] : []]);
  return t.flatMap((l, c) => {
    const h = i.map((u) => {
      const f = u.members[c], { turn: d, ...g } = f.pose;
      return { time: u.time, pose: { ...r ? f.pose : g, x: f.position[0], y: f.position[1], z: f.position[2], rotateY: r ? 0 : f.heading } };
    });
    return Object.keys(h[0].pose).filter((u) => a.has(u) || h.some((f) => f.pose[u] !== (e.pose?.[u] ?? ht[u]))).map((u) => ({
      id: `${l}-circle-${u}`,
      target: l,
      property: u,
      keyframes: h.map((f) => ({ time: f.time, value: f.pose[u], easing: "linear" }))
    }));
  });
}
const Wo = (t) => Math.min(1, Math.max(0, t));
function Sw(t) {
  const e = { ...ct, turn: t.view }, n = [];
  for (const s of t.keys) {
    const o = n[n.length - 1], i = !o || s.reset ? e : o.pose;
    n.push({ at: s.at, pose: { ...i, ...s.pose }, easing: s.easing });
  }
  return n;
}
function Tw(t) {
  return t - Ew * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const Ew = 0.5;
function Aw(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function $w(t, e) {
  const n = typeof t == "string" ? fi[t] : t, s = Sw(n), o = Wo(e);
  let i = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= o && (i = u);
  const r = s[i], a = s[Math.min(i + 1, s.length - 1)], l = a.at > r.at ? (o - r.at) / (a.at - r.at) : 0, c = ws(r.pose, a.pose, Ft(a.easing ?? "ease-in-out")(Wo(l))), h = Aw(n, o);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * Tw(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function Pw(t, e, n) {
  const s = typeof t == "string" ? fi[t] : t, o = Wo(e), i = Wo((o - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * i;
}
function bS(t, e, n = {}) {
  const s = typeof e == "string" ? fi[e] : e, o = n.start ?? 0, i = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const f = u / r;
    return { time: o + f * i, progress: f, pose: $w(s, f) };
  }), c = Object.keys(ct).filter((h) => a.some((u) => u.pose[h] !== ct[h])).map((h) => ({
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
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * Pw(s, u.progress, n.height) }))
    });
  }
  return c;
}
const Iw = {
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
}, Ow = {
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
}, Xs = {
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
}, _w = {
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
}, Hw = {
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
function gn(t, e, n, s, o, i = 1300) {
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
      { at: 0.16, pose: Iw },
      { at: 0.27, pose: Ow, easing: "ease-out-quad" },
      ...o,
      { at: 0.76, pose: _w },
      { at: 0.86, pose: Hw, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const fi = {
  frontFlip: gn("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: Xs, easing: "ease-out-cubic" },
    { at: 0.64, pose: Xs }
  ]),
  backFlip: gn("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...Xs, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...Xs, lean: 18 } }
  ]),
  layout: gn("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: gn("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: gn("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: gn("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
};
function Cw(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, o = { ...ht, turn: n }, i = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of i) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    o[`arm.${l}.spread`] = h * s, o[`arm.${l}.swing`] = c * h * n, o[`arm.${l}.bend`] = u * s, o[`arm.${l}.elbow`] = c * u * n;
    const f = t[`${a}Hip`], d = t[`${a}Knee`], g = s + c * n;
    o[`leg.${l}.rotate`] = 90 * s, o[`leg.${l}.spread`] = 0, o[`leg.${l}.swing`] = f * g, o[`leg.${l}.knee`] = d * g, o[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), o[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * Rw, o[`eye.${l}`] = t[`${a}Eye`], o[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(o, Lw(l, e[a] ?? It, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  o.lean = t.lean * n, o.bend = r * n, o.side = (t.lean + r * 0.5) * s, o["head.tilt"] = (t.headTilt + r * 0.5) * s, o["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) o[a] = t[a];
  return o.lift = t.rise ?? 0, o.roll = t.spin ?? 0, o;
}
const Rw = 70;
function Lw(t, e, n, s) {
  const o = t === "right" ? 1 - s : 1 + s, i = {};
  for (const r of Object.keys(It)) i[`hand.${t}.${r}`] = e[r] ?? It[r];
  return i[`hand.${t}.turn`] = (e.turn ?? 0) - o, i[`hand.${t}.roll`] = (e.roll ?? 0) + n, i;
}
class pf {
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
function Ww(t) {
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
const Wa = Math.PI * 2;
function Fw(t, e = 16) {
  const n = new pf(), s = Math.max(6, Math.round(e)), o = Math.max(3, Math.round(s / 2)), i = [];
  for (let r = 0; r <= o; r++) {
    const a = r / o * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * Wa, u = Math.sin(a) * Math.sin(h), f = Math.cos(a), d = Math.sin(a) * Math.cos(h);
      l.push(n.vertex(u * t, f * t, d * t, u, f, d));
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
function Wc(t, e, n, s, o) {
  const i = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: o }, (a, l) => {
    const c = l / o * Wa;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < o; a++) {
    const l = r[a], c = r[(a + 1) % o];
    s === 1 ? t.triangle(i, l, c) : t.triangle(i, c, l);
  }
}
function gf(t, e, n = 24) {
  const s = new pf(), o = Math.max(6, Math.round(n)), i = e / 2, r = -e / 2, a = (h) => Array.from({ length: o + 1 }, (u, f) => {
    const d = f / o * Wa;
    return s.vertex(Math.sin(d) * t, h, Math.cos(d) * t, Math.sin(d), 0, Math.cos(d));
  }), l = a(r), c = a(i);
  for (let h = 0; h < o; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return Wc(s, t, i, 1, o), Wc(s, t, r, -1, o), s.build();
}
function Fo(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of Ww(t))
    for (const s of n.faces) {
      const o = n.faces.find((i) => i !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: o });
    }
  return { ...t, faceEdges: e };
}
const Xi = /* @__PURE__ */ new Map();
function Nw(t) {
  const e = Xi.get(t);
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
  return Xi.size < 512 && Xi.set(t, n), n;
}
sn([-3, -5, -4]);
const Dw = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function mf(t, e, n) {
  const s = [0, 0, 0];
  for (const o of n) {
    const i = Nw(o.color);
    let r;
    if (o.light === "ambient")
      r = o.intensity;
    else if (o.light === "directional")
      r = o.intensity * Math.max(0, -Ce(e, o.direction));
    else {
      const a = jn(o.position, t), l = Zo(a), c = l > 0 ? On(a, 1 / l) : e, h = o.range ? Math.max(0, 1 - l / o.range) ** 2 : 1;
      if (r = o.intensity * Math.max(0, Ce(e, c)) * h, o.light === "spot") {
        const u = Math.cos(o.angle * Math.PI / 180), f = Math.cos(o.angle * 0.8 * Math.PI / 180);
        r *= Dw(u, f, -Ce(c, o.direction));
      }
    }
    s[0] += i[0] * r, s[1] += i[1] * r, s[2] += i[2] * r;
  }
  return s;
}
function yf(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function bf(t, e, n = {}) {
  t.save(), Bw(t, e, n), t.restore();
}
function Bw(t, e, n) {
  const s = wf(e, n);
  n.shadow !== !1 && kf(t, e, n);
  for (const o of e.under) Fc(t, o, s, n);
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
  for (const o of e.over) Fc(t, o, s, n);
}
function Fc(t, e, n, s) {
  const o = s.loose?.[e.part.id];
  if (!o) {
    Yr(t, e, n, s);
    return;
  }
  if (o.opacity <= 0) return;
  const i = e.faces.flatMap((c) => c.points);
  if (i.length === 0) return;
  const r = i.map((c) => c.x), a = i.map((c) => c.y), l = { x: (Math.min(...r) + Math.max(...r)) / 2, y: (Math.min(...a) + Math.max(...a)) / 2 };
  t.save(), t.globalAlpha *= Math.min(1, o.opacity), t.translate(l.x + o.x, l.y + o.y), t.rotate(o.rotate * Math.PI / 180), t.translate(-l.x, -l.y), Yr(t, e, n, s), t.restore();
}
function wf(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function kf(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, di(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function wS(t, e, n, s = {}) {
  t.save(), Yr(t, e, n, s), t.restore();
}
function zw(t, e, n, s = {}) {
  const o = s.style === "stick", i = e.flatMap((h) => {
    if (o && h.part.solidOnly) return [];
    const u = h.part.layer ?? 0;
    return o && h.spine ? [{ depth: h.depth, layer: u, part: h }] : h.faces.map((f) => ({ depth: f.depth, layer: u, part: h, face: f }));
  }), r = /* @__PURE__ */ new Map();
  for (const h of i) {
    const u = h.face?.normal;
    if (!h.face?.center || !u) continue;
    const f = Math.abs(u[0]) >= Math.abs(u[1]) && Math.abs(u[0]) >= Math.abs(u[2]) ? 0 : Math.abs(u[1]) >= Math.abs(u[2]) ? 1 : 2, d = f * 2 + (u[f] < 0 ? 1 : 0);
    r.set(d, [...r.get(d) ?? [], h]);
  }
  for (const h of r.values())
    for (const u of h) {
      const { center: f, normal: d } = u.face;
      for (const g of h) {
        if (g.part.part.id === u.part.part.id) continue;
        const p = g.face;
        if (p.normal[0] * d[0] + p.normal[1] * d[1] + p.normal[2] * d[2] <= 0.8) continue;
        const b = p.normal[0] * (f[0] - p.center[0]) + p.normal[1] * (f[1] - p.center[1]) + p.normal[2] * (f[2] - p.center[2]);
        b > -Nc / 5 && b < Nc && (u.layer = Math.max(u.layer, g.layer), u.depth = Math.max(u.depth, g.depth + 1e-6));
      }
    }
  i.sort((h, u) => h.layer - u.layer || h.depth - u.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let u = a.get(h.part.id);
    return u || a.set(h.part.id, u = Fa(t, h, n, s)), u;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: u } of i) {
    t.globalAlpha = c * h.opacity;
    const f = l(h);
    if (!u) f.line(h.spine, n * 1.15);
    else {
      const d = o ? vf(h, s) : u.light ? qw(h, u, s) : Na(h);
      d && (!o && s.look === "silhouette" ? f.shape(u.points, d, 0) : di(t, u.points, o || u.light ? d : Ba(d, u.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of u.edges ?? []) p.length > 1 && f.line(p, g);
      for (const p of u.marks ?? []) f.line(p, n * 0.7);
    }
  }
  t.restore();
}
const Nc = 0.05;
function Fa(t, e, n, s) {
  return ei(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: ne(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function Na(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? xf(e.fill, e.glow.color, t.glow) : e.fill;
}
function qw(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const o = Mf(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? xf(o, s.glow.color, t.glow) : o;
}
function vf(t, e) {
  const n = Na(t);
  return n && (Kw(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function Yr(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, Dc(t, e, n, s), t.restore()) : Dc(t, e, n, s);
}
function Dc(t, e, n, s) {
  if (s.style === "stick") return Yw(t, e, n, s);
  const { part: o } = e, i = Fa(t, e, n, s), r = Na(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? i.shape(c.points, r, 0) : di(t, c.points, Ba(r, c.tone)));
  const l = (o.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && i.line(c, l);
  for (const c of e.marks) i.line(c, n * 0.7);
}
function Yw(t, e, n, s) {
  const { part: o } = e;
  if (o.solidOnly) return;
  const i = Fa(t, e, n, s);
  if (e.spine) {
    i.line(e.spine, n * 1.15);
    return;
  }
  const r = vf(e, s);
  for (const l of e.faces) di(t, l.points, r);
  const a = (o.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && i.line(l, a);
  for (const l of e.marks) i.line(l, n * 0.7);
}
function Kw(t) {
  const e = Yn(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function di(t, e, n, s = !0, o = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let i = 1; i < e.length; i++) t.lineTo(e[i].x, e[i].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = o, t.lineJoin = "round", t.stroke());
}
function Yn(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const Da = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function Ba(t, e) {
  const n = Yn(t);
  return n ? Da(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function Mf(t, e, n, s) {
  const o = Yn(t);
  if (!o) return t;
  let i = o.map((a, l) => a * e[l]);
  const r = s ? Yn(s) : void 0;
  return r && n > 0 && (i = i.map((a, l) => a + (r[l] - a) * n)), Da(i);
}
function xf(t, e, n) {
  const s = Yn(t), o = Yn(e);
  return !s || !o ? n < 0.5 ? t : e : Da(s.map((i, r) => i + (o[r] - i) * n));
}
const jw = /* @__PURE__ */ new Set([
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
]), Xw = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), Bc = (t) => typeof t == "number" ? t : void 0, Uw = 1.7;
function Gw(t, e, n) {
  const s = Array.from({ length: 24 }, (o, i) => {
    const r = i / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((o) => o === null) || (t.beginPath(), s.forEach((o, i) => i === 0 ? t.moveTo(o.x, o.y) : t.lineTo(o.x, o.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function Vw(t) {
  const e = Ce([0, 1, 0], t);
  if (e > 0.999999) return Qo();
  if (e < -0.999999) return re(te([1, 0, 0], 180));
  const n = wo([0, 1, 0], t);
  return re(te(n, Math.acos(e) * 180 / Math.PI));
}
function Jw(t, e, n, s, o) {
  const i = t.solid ?? {}, r = i.outline === !1 ? void 0 : i.outline ?? { width: 2, color: "#0f172a" }, a = { color: i.color ?? "#475569", shading: i.shading ?? "toon", outline: r }, l = { color: i.skin ?? "#f2c49b", shading: i.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], f = (w, y, S) => u.push({ mesh: w, world: Pt(o, y), material: S }), d = (w, y, S) => f(e.sphere, ha(w, [0, 0, 0, 1], [y, y, y]), S);
  for (const w of n.chains) {
    const y = s.chains[w.id], S = w.id === "spine" ? 1.9 : 1;
    w.bones.forEach(($, v) => {
      const x = y[v], M = y[v + 1], T = ca(x, M), [A, E] = $.width ?? [1, 1], P = h * S * (A + E) / 2;
      if (T > 1e-6) {
        const O = C0(x, M, 0.5), L = Vw(sn(jn(M, x)));
        f(e.cylinder, Pt(ze(O), Pt(L, Ge([P, T, P]))), a);
      }
      d(x, h * S * A, a), d(M, h * S * E, a);
    }), w.id.startsWith("arm.") && d(y[y.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: b } = s.head, k = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...g, 1];
  f(e.sphere, Pt(k, Ge([p, m, p])), l);
  for (const w of [-1, 1]) {
    const y = sn([w * 0.36, 0.15, 0.92]), S = ro(g, ro(ro(On(b[0], y[0] * p * 1.04), On(b[1], y[1] * m * 1.04)), On(b[2], y[2] * p * 1.04))), $ = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...S, 1];
    f(e.sphere, Pt($, Ge([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const kS = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: ai({ ...t.character, height: 1 }),
      cylinder: Fo(gf(1, 1, 16)),
      sphere: Fo(Fw(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let u = { ...ht, ...l.pose };
    for (const [x, M] of n)
      typeof M == "number" && !jw.has(x) && !Xw.has(x) && (u[x] = M);
    const f = Math.max(0, Math.min(1, Bc(n.get("walking")) ?? l.walking ?? 0));
    if (f > 0) {
      const x = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, M = ef(x, Bc(n.get("walk")) ?? 0, u);
      u = Object.fromEntries(Object.keys({ ...u, ...M }).map((T) => [T, (u[T] ?? 0) + ((M[T] ?? 0) - (u[T] ?? 0)) * f]));
    }
    const d = l.height ?? Uw, g = Pt(o.view, s), p = {
      toView: (x) => Ut(g, x),
      toScreen: (x) => a(x)
    }, b = -p.toView([0, d / 2, 0])[2];
    if (b <= o.near) return null;
    const k = l.shadow === !1 ? [] : [{ depth: b + d, draw: (x) => Gw(x, p, d * 0.18) }];
    if (l.look === "solid") {
      const x = oi(h.plan, u, { height: d, contact: h.contact });
      return { meshes: Jw(l, c, h.plan, x, s), drawables: k };
    }
    const w = Ut(s, [0, d * 0.6, 0]), y = sn(jn(o.position, w)), S = mf(w, y, i).map((x) => Math.min(1, x));
    let $ = h;
    if (i.length > 0 && h.skin !== "none") {
      const x = Mf(h.skin, S, yf(r, ca(w, o.position)), r?.color);
      $ = { ...h, skin: x, ...h.body ? { body: { ...h.body, fill: x } } : {} };
    }
    const v = kw($, u, p, { height: d });
    return {
      drawables: [
        ...k,
        // Ties keep the character's own order.
        ...v.map((x, M) => ({ depth: -(x.sortDepth ?? x.depth) - M * 1e-6, draw: (T, A) => x.draw(T, A.time) }))
      ]
    };
  }
}, De = {
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
}, ts = 1, Us = 0.55, zc = 0.35, Zw = 1.6, qc = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, Yc = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, Kc = {
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
}, jc = {
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
}, Qw = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, t2 = "्", Xc = "़", e2 = (t) => t >= "क" && t <= "ह", Uc = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function n2(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (o, i) => {
    const r = e[e.length - 1];
    r && r.viseme === o ? r.weight += i * 0.5 : e.push({ viseme: o, weight: i });
  };
  for (let o = 0; o < n.length; o++) {
    const i = n[o], r = n[o + 1];
    if (Uc.has(i)) s("rest", Zw);
    else if (/\s/.test(i)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: zc });
    } else if ((i === "o" || i === "e") && r === i)
      s(i === "o" ? "u" : "i", ts), o++;
    else if (i in qc) s(qc[i], ts);
    else if (i in Yc) s(Yc[i], Us);
    else {
      if (i === "h") continue;
      if (/[a-z]/.test(i)) s("c", Us);
      else if (i in Kc) s(Kc[i], ts);
      else if (e2(i)) {
        const a = r === Xc ? i === "फ" ? "f" : void 0 : Qw[i];
        s(a ?? "c", Us);
        let l = o + 1;
        n[l] === Xc && l++;
        const c = n[l];
        c === t2 ? o = l : c && c in jc ? (s(jc[c], ts), o = l) : (!c || /\s/.test(c) || Uc.has(c) || s("a", ts * 0.6), o = l - 1);
      } else (i === "ं" || i === "ँ") && s("l", Us * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === zc); ) e.pop();
  return e;
}
function Sf(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", o = e.energy ?? 1, i = n2(t.text), r = [{ time: t.start, value: De.rest.mouth }], a = [{ time: t.start, value: De.rest.mouthWidth }], l = i.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of i) {
      const f = c * u.weight / l, d = h + Math.min(f * 0.4, 60);
      if (d > r[r.length - 1].time) {
        const g = De[u.viseme];
        r.push({ time: d, value: g.mouth * o, easing: "ease-out" }), a.push({ time: d, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, o), easing: "ease-out" });
      }
      h += f;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: De.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: De.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function vS(t, e, n = {}) {
  const s = {};
  for (const o of [...e].sort((i, r) => i.start - r.start))
    for (const [i, r] of Object.entries(Sf(o, n))) {
      const a = s[i] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([o, i]) => ({ id: `${t}-${o}`, target: t, property: o, keyframes: i }));
}
function za(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const o = s.fields?.mouth ?? "mouth", i = s.fields?.mouthWidth ?? "mouthWidth", r = { [o]: De.rest.mouth, [i]: De.rest.mouthWidth, ...s.rest }, a = new _t({ id: "before-speech", tracks: e }), l = (u, f) => a.getStateAtTime(f).values.get(t)?.get(u) ?? r[u], c = [o, i], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const f = e.find((g) => g.target === t && g.property === u);
    let d = f ? [...f.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = Sf(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, d = [...d.filter((m) => m.time < g.start || m.time > g.end), ...p], d.sort((m, b) => m.time - b.time);
    }
    h.push({ id: f?.id ?? `${t}-${u}`, target: t, property: u, keyframes: d });
  }
  return h;
}
const fs = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function s2([t, e, n]) {
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
const mn = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function o2(t, e, n = "x", s = 20, o = 0) {
  const i = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const u = Math.PI * 2 * h / s;
      i.push(mn(n, [Math.cos(u) * t, Math.sin(u) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: mn(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: mn(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, u = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: mn(n, [Math.cos(u), Math.sin(u), 0]) });
  }
  const l = [];
  if (o > 0)
    for (const c of [-r, r]) {
      const h = i.push(mn(n, [0, 0, c * 1.01])) - 1;
      for (let u = 0; u < o; u++) {
        const f = Math.PI * 2 * u / o, d = i.push(mn(n, [Math.cos(f) * t * 0.82, Math.sin(f) * t * 0.82, c * 1.01])) - 1;
        l.push([h, d]);
      }
    }
  return { vertices: i, faces: a, marks: l, creases: !0 };
}
function i2([t, e, n], s = 16) {
  const o = Math.max(4, Math.round(s / 2)), i = [[0, e, 0]];
  for (let h = 1; h < o; h++) {
    const u = Math.PI * h / o;
    for (let f = 0; f < s; f++) {
      const d = Math.PI * 2 * f / s;
      i.push([Math.sin(u) * Math.cos(d) * t, Math.cos(u) * e, Math.sin(u) * Math.sin(d) * n]);
    }
  }
  const r = i.push([0, -e, 0]) - 1, a = (h, u) => 1 + (h - 1) * s + u % s, l = (h) => {
    const u = h.reduce((f, d) => [f[0] + i[d][0], f[1] + i[d][1], f[2] + i[d][2]], [0, 0, 0]);
    return fs([u[0] / (t * t), u[1] / (e * e), u[2] / (n * n)]);
  }, c = [];
  for (let h = 0; h < s; h++) {
    const u = [0, a(1, h + 1), a(1, h)];
    c.push({ corners: u, normal: l(u) });
    for (let d = 1; d < o - 1; d++) {
      const g = [a(d, h), a(d, h + 1), a(d + 1, h + 1), a(d + 1, h)];
      c.push({ corners: g, normal: l(g) });
    }
    const f = [a(o - 1, h), a(o - 1, h + 1), r];
    c.push({ corners: f, normal: l(f) });
  }
  return { vertices: i, faces: c, creases: !1 };
}
const r2 = (t) => t.reduce((e, [n, s], o) => {
  const [i, r] = t[(o + 1) % t.length];
  return e + n * r - i * s;
}, 0) / 2;
function a2(t, e) {
  const n = r2(t) < 0 ? [...t].reverse() : t, s = n.length, o = e / 2, i = [...n.map(([a, l]) => [o, l, a]), ...n.map(([a, l]) => [-o, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: fs([0, -c, h]) });
  }
  return { vertices: i, faces: r, creases: !0 };
}
function l2(t, e) {
  const n = {
    left: ([o, i]) => [0, i, o],
    right: ([o, i]) => [0, i, o],
    front: ([o, i]) => [o, i, 0],
    back: ([o, i]) => [o, i, 0],
    up: ([o, i]) => [o, 0, i]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((o, i) => i), normal: s[e] }] };
}
function c2(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, o = [], i = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = fs([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), u = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], f = fs(Gc(h, u)), d = Gc(f, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), b = Math.sin(p) * s(a);
      o.push([r[0] + f[0] * m + d[0] * b, r[1] + f[1] * m + d[1] * b, r[2] + f[2] * m + d[2] * b]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((f, d) => [f[0] + o[d][0] / 4, f[1] + o[d][1] / 4, f[2] + o[d][2] / 4], [0, 0, 0]), u = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      i.push({ corners: c, normal: fs([h[0] - u[0], h[1] - u[1], h[2] - u[2]]) });
    }
  return { vertices: o, faces: i, creases: !1 };
}
function Gc(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function h2(t) {
  switch (t.type) {
    case "box":
      return s2(t.size);
    case "cylinder":
      return o2(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return i2(t.radii, t.segments);
    case "extrude":
      return a2(t.profile, t.width);
    case "panel":
      return l2(t.points, t.facing);
    case "tube":
      return { ...c2(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function Tf(t, e) {
  if (t.length < 2) return t;
  const n = (o) => t[Math.max(0, Math.min(t.length - 1, o))], s = (o) => {
    const i = o * (t.length - 1), r = Math.min(t.length - 2, Math.floor(i)), a = i - r, [l, c, h, u] = [n(r - 1), n(r), n(r + 1), n(r + 2)];
    return [0, 1, 2].map((f) => {
      const d = l[f], g = c[f], p = h[f], m = u[f];
      return 0.5 * (2 * g + (-d + p) * a + (2 * d - 5 * g + 4 * p - m) * a * a + (-d + 3 * g - 3 * p + m) * a * a * a);
    });
  };
  return Array.from({ length: e }, (o, i) => s(i / (e - 1)));
}
const Ke = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function No(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function Ef(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function _n(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function Af(t) {
  const e = t.filter((o, i) => i === 0 || Math.hypot(o[0] - t[i - 1][0], o[1] - t[i - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : Tf(e.map(([o, i]) => [o, 0, i]), (e.length - 1) * 12).map(([o, , i]) => [o, i]);
  let s = 0;
  return n.map((o, i) => (i > 0 && (s += Math.hypot(o[0] - n[i - 1][0], o[1] - n[i - 1][1])), { point: o, at: s }));
}
function $f(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], o = t[n], i = o.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (o.at - s.at))) : 0;
  return {
    point: [s.point[0] + (o.point[0] - s.point[0]) * i, s.point[1] + (o.point[1] - s.point[1]) * i],
    direction: [o.point[0] - s.point[0], o.point[1] - s.point[1]]
  };
}
function Pf(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let o = 0; o < 40; o++) {
    const i = (n + s) / 2;
    t(i) < e ? n = i : s = i;
  }
  return (n + s) / 2;
}
const es = 520, Vc = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag", "say", "look", "turns", "dance", "bpm", "beats"], u2 = (t) => Math.max(700, Array.from(t).length * 65), Jc = 70, Zc = 35;
function If(t, e) {
  const n = e[0] - t.x, s = e[1] - t.eyeHeight, o = e[2] - t.z, i = t.heading * Math.PI / 180, r = n * Math.cos(i) - o * Math.sin(i), a = n * Math.sin(i) + o * Math.cos(i), l = Math.atan2(r, a) * 180 / Math.PI, c = Math.hypot(r, a), h = -Math.atan2(s, c) * 180 / Math.PI, u = Math.max(-Jc, Math.min(Jc, l * 0.75)), f = Math.max(-Zc, Math.min(Zc, h * 0.7));
  return {
    "head.turn": u,
    "head.nod": f,
    lookX: Math.max(-1, Math.min(1, (l - u) / 45)),
    lookY: Math.max(-1, Math.min(1, (h - f) / 30))
  };
}
const f2 = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, Kr = Object.keys(Yt), Ui = Object.keys(fe), Gi = Object.keys(_a), d2 = 0.25, p2 = 700 / 180, g2 = 200, m2 = 300;
function y2(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...Kr, "face", "spin", "dance", "hold", "pose", "gag", "place", "say", "look"], n = [];
  return t.forEach((s, o) => {
    const i = (c) => n.push({ beat: o, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return i("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) Vc.includes(c) || i(ft("beat field", c, Vc, a[c]));
    const l = typeof r.do == "string" ? Ui.includes(r.do) ? "pose" : Gi.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return i(ft("character 3D beat", r.do, e, l));
    for (const c of ["at", "for", "turns", "bpm", "beats"]) {
      const h = r[c];
      h !== void 0 && (typeof h != "number" || !Number.isFinite(h) || (c === "at" ? h < 0 : c !== "turns" && h <= 0)) && i(`\`${c}\` must be finite${c === "turns" ? "" : c === "at" ? " and non-negative" : " and positive"}.`);
    }
    if (r.do === "dance" && !(typeof r.dance == "string" && Object.hasOwn(zn, r.dance)) && i(ft("native dance", r.dance, Object.keys(zn))), Kr.includes(r.do) && (r.to === void 0 && r.through === void 0 && i(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !Ke(r.to) && i(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(Ke)) && i("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !Ke(r.to) && i("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(Ke(r.toward) || typeof r.toward == "number" && Number.isFinite(r.toward)) && i("`face` needs `toward`: a point [x, z] or a finite heading in degrees."), r.do === "say" && !(typeof r.say == "string" && r.say.trim().length > 0) && i("`say` needs `say`: the line spoken."), r.do === "look") {
      const c = r.look ?? r.toward;
      Array.isArray(c) && (c.length === 2 || c.length === 3) && c.every((u) => typeof u == "number" && Number.isFinite(u)) || c === "camera" || i("`look` needs `look`: a point [x, z] or [x, y, z] to look at, or `camera`.");
    }
    r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !Ui.includes(r.pose) && i(ft("pose", r.pose, Ui)), r.do === "gag" && !Gi.includes(r.gag) && i(ft("gag", r.gag, Gi));
  }), n;
}
function MS(t, e, n) {
  const s = y2(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((v) => `  beat ${v.beat}: ${v.message}`).join(`
`)}`);
  const o = n.height ?? 1.7, i = { ...ht, ...n.pose }, r = (v, x = i) => {
    const M = v.match(/^hand\.(?:left|right)\.(.+)$/)?.[1];
    return x[v] ?? ht[v] ?? (M ? It[M] : void 0) ?? 0;
  };
  let [a, l] = n.position ?? [0, 0], c = n.heading ?? 0, h = 0;
  const u = /* @__PURE__ */ new Map(), f = [], d = (v, x, M, T = "linear") => {
    const A = u.get(v) ?? [];
    A.push({ time: x, value: M, easing: T }), u.set(v, A);
  }, g = (v, x, M) => {
    const T = u.get(v) ?? [];
    for (let A = T.length - 1; A >= 0; A--)
      if (T[A].time === x) {
        if (T[A].value === M) return;
        break;
      }
    d(v, x, M);
  };
  d("x", 0, a), d("z", 0, l), d("rotateY", 0, c);
  const p = (v, x, M) => {
    const T = No(c, x);
    if (Math.abs(T) < 1)
      return M !== void 0 && (g("rotateY", v, c), d("rotateY", v + M, c)), v + (M ?? 0);
    const A = M ?? Math.max(g2, Math.abs(T) * p2);
    return g("rotateY", v, c), c += T, d("rotateY", v + A, c, "ease-in-out"), v + A;
  }, m = (v, x, M, T = "ease-in-out") => {
    for (const [A, E] of Object.entries(M))
      r(A) !== E && (g(A, v, r(A)), d(A, x, E, T), i[A] = E);
  }, b = (v, x, M) => {
    const T = Af([[a, l], ...x.through ?? [x.to]]);
    if (T.length < 2) return M;
    const A = p(M, _n(T[0].point, T[1].point)), E = T[T.length - 1].at, P = x.speed ?? f2[v] * Math.sqrt(o / 1.7), O = x.for ?? E / P * 1e3, L = nf(v, o), q = Ft("ease-in-out"), G = Math.min(m2, O / 4);
    f.push({ time: A, value: v }), g("walking", A, 0), d("walking", A + G, 1, "ease-out"), d("walking", A + O - G, 1), d("walking", A + O, 0, "ease-in");
    const Q = h;
    let j = c;
    for (let C = 0; ; C = Math.min(E, C + d2)) {
      const B = A + Pf(q, C / E) * O, { point: Y, direction: I } = $f(T, C);
      j += No(j, _n([0, 0], I));
      const N = C === 0 ? g : d;
      if (N("x", B, Y[0]), N("z", B, Y[1]), N("rotateY", B, j), N("walk", B, Q + C / L), C >= E) break;
    }
    return h = Q + E / L, [a, l] = T[T.length - 1].point, c = j, A + O;
  }, k = [], w = [];
  let y = 0;
  for (const v of e) {
    const x = v.at ?? y;
    let M = x;
    if (Kr.includes(v.do)) M = b(v.do, v, x);
    else if (v.do === "face") M = p(x, typeof v.toward == "number" ? v.toward : _n([a, l], v.toward), v.for);
    else if (v.do === "spin")
      M = x + (v.for ?? 1e3), g("rotateY", x, c), c += (v.turns ?? 1) * 360, d("rotateY", M, c, "linear");
    else if (v.do === "dance") {
      const T = zn[v.dance], A = v.bpm ?? T.bpm, E = v.beats ?? (v.for !== void 0 ? v.for * A / 6e4 : T.beats);
      M = x + (v.for ?? E * 6e4 / A);
      const P = { ...i }, O = Math.max(1, Math.ceil(E * 16)), L = Array.from({ length: O + 1 }, (G, Q) => Oo(v.dance, E * Q / O, P).pose), q = Math.min(150, (M - x) / 4);
      for (const G of Object.keys(L[0])) {
        const Q = r(G, P);
        G === "turn" || G === "roll" || L.every((j) => j[G] === Q) || (g(G, x, Q), L.slice(1).forEach((j, C) => {
          const B = x + (M - x) * (C + 1) / O, Y = Math.min(1, (B - x) / q), I = Y * Y * (3 - 2 * Y);
          d(G, B, Q + (j[G] - Q) * I);
        }), i[G] = L[O][G]);
      }
    } else if (v.do === "hold") M = x + (v.for ?? 1e3);
    else if (v.do === "place")
      g("x", x, a), g("z", x, l), [a, l] = v.to, d("x", x + 1, a), d("z", x + 1, l), typeof v.toward == "number" && (g("rotateY", x, c), c = v.toward, d("rotateY", x + 1, c)), M = x + 1;
    else if (v.do === "pose") {
      M = x + (v.for ?? 500);
      const T = typeof v.pose == "string" ? fe[v.pose] : v.pose;
      m(x, M, T);
    } else if (v.do === "gag") {
      const T = ow(v.gag, { at: x, from: { ...i } });
      let A = T[0];
      for (const E of T.slice(1))
        m(A.time, E.time, Object.fromEntries(Object.entries(E.pose).filter(([P, O]) => i[P] !== O)), E.easing ?? "ease-in-out"), A = E;
      M = A.time;
    } else if (v.do === "say") {
      M = x + (v.for ?? u2(v.say)), w.push({ text: v.say, start: x, end: M });
      const T = { tilt: i["head.tilt"] ?? 0, left: i["brow.left"] ?? 0, right: i["brow.right"] ?? 0 };
      let A = 0;
      for (let E = x + es; E < M - es / 2; E += es, A++) {
        const P = A % 2 === 0;
        m(E - es / 2, E, { "head.tilt": T.tilt + (P ? 3 : -2), "brow.left": T.left + (P ? 0.25 : 0), "brow.right": T.right + (P ? 0.25 : 0) });
      }
      A > 0 && m(M - es / 2, M, { "head.tilt": T.tilt, "brow.left": T.left, "brow.right": T.right });
    } else if (v.do === "look") {
      const T = v.look ?? v.toward, A = o * 0.9, E = T === "camera" ? n.camera ?? [0, 1.6, 8] : T.length === 3 ? T : [T[0], A, T[1]];
      M = x + (v.for ?? 500), m(x, M, If({ x: a, z: l, heading: c, eyeHeight: A }, E), "ease-out");
    }
    k.push({ do: v.do, start: x, end: M }), y = M;
  }
  const S = `${n.scene}/${t}`;
  let $ = [...u].map(([v, x]) => ({ id: `${t}-${v}`, target: S, property: v, keyframes: Ef(x) }));
  return f.length > 0 && $.push({ id: `${t}-gait`, target: S, property: "gait", keyframes: f }), w.length > 0 && ($ = za(S, $, w, { rest: { mouth: n.pose?.mouth ?? ht.mouth ?? 0, mouthWidth: n.pose?.mouthWidth ?? ht.mouthWidth ?? 1 } })), { tracks: $, duration: y, beats: k, end: { position: [a, l], heading: c, pose: { ...i } } };
}
function Qc(t, e, n = [0, 0, 0]) {
  const s = t.filter((i) => i.target === e), o = new _t({ id: `${e}-position`, tracks: s });
  return (i) => {
    const r = o.getStateAtTime(i).values.get(e), a = r?.get("position");
    if (Array.isArray(a) && a.length === 3) return [a[0], a[1], a[2]];
    const l = (c, h) => {
      const u = r?.get(c);
      return typeof u == "number" ? u : h;
    };
    return [l("x", n[0]), l("y", n[1]), l("z", n[2])];
  };
}
function xS(t, e) {
  const n = `${e.scene}/${e.character}`, s = e.height ?? 1.7, o = Math.max(1, e.every ?? 66), i = e.objects?.[e.character] ?? [0, 0, 0], r = new _t({ id: `${n}-own`, tracks: t.filter((u) => u.target === n) }), a = e.at, l = typeof a == "function" ? a : Array.isArray(a) ? () => a : "camera" in a ? Qc(t, `${e.scene}/${a.camera}`, e.objects?.[a.camera] ?? [0, 1.6, 8]) : (() => {
    const u = Qc(t, `${e.scene}/${a.object}`, e.objects?.[a.object] ?? [0, 0, 0]), f = a.eyeHeight ?? s * 0.9;
    return (d) => {
      const g = u(d);
      return [g[0], g[1] + f, g[2]];
    };
  })(), c = ["head.turn", "head.nod", "lookX", "lookY"], h = { "head.turn": [], "head.nod": [], lookX: [], lookY: [] };
  for (let u = e.start; ; u = Math.min(e.end, u + o)) {
    const f = r.getStateAtTime(u).values.get(n), d = (p, m) => {
      const b = f?.get(p);
      return typeof b == "number" ? b : m;
    }, g = If({ x: d("x", i[0]), z: d("z", i[2]), heading: d("rotateY", 0), eyeHeight: d("y", i[1]) + s * 0.9 }, l(u));
    for (const p of c) h[p].push({ time: u, value: g[p] ?? 0 });
    if (u >= e.end) break;
  }
  return c.map((u) => ({ id: `${n}-lookAt-${u}`, target: n, property: u, keyframes: h[u] }));
}
function SS(t) {
  const e = Math.max(1, Math.round(t.count)), [n, s] = t.centre ?? [0, 0], o = t.spacing ?? 1.2, i = t.shape ?? "line", r = [];
  if (i === "circle") {
    const h = e < 2 ? 0 : Math.max(o, o * e / (Math.PI * 2));
    for (let u = 0; u < e; u++) {
      const f = u / e * Math.PI * 2, d = n + Math.sin(f) * h, g = s + Math.cos(f) * h;
      r.push({ position: [d, g], heading: (Math.atan2(n - d, s - g) * 180 / Math.PI + 360) % 360 });
    }
    return r;
  }
  if (i === "cluster") {
    let h = (t.seed ?? 1) >>> 0 || 7;
    const u = () => (h ^= h << 13, h >>>= 0, h ^= h >> 17, h ^= h << 5, h >>>= 0, h / 4294967296), f = [];
    for (let d = 0; d < e; d++) {
      let g = [n, s], p = -1 / 0;
      for (let m = 0; m < 24; m++) {
        const b = Math.sqrt(u()) * o * Math.max(1, Math.sqrt(e) * 0.9), k = u() * Math.PI * 2, w = [n + Math.cos(k) * b, s + Math.sin(k) * b], y = f.length === 0 ? 1 / 0 : Math.min(...f.map((S) => Math.hypot(S[0] - w[0], S[1] - w[1])));
        if (y > p && (p = y, g = w), y >= o) break;
      }
      f.push(g), r.push({ position: g, heading: 0 });
    }
    return r;
  }
  const a = (t.heading ?? 90) * Math.PI / 180, l = o * (e - 1), c = (t.bend ?? 60) * Math.PI / 180;
  for (let h = 0; h < e; h++) {
    const u = e === 1 ? 0 : h / (e - 1) - 0.5, f = u * l;
    let d = n + Math.sin(a) * f, g = s + Math.cos(a) * f, p = ((t.heading ?? 90) - 90 + 360) % 360;
    if (i === "arc") {
      const m = (1 - Math.cos(u * c)) * l * 0.5;
      d -= Math.cos(a) * m, g += Math.sin(a) * m, p = (p - u * (t.bend ?? 60) + 360) % 360;
    }
    r.push({ position: [d, g], heading: p });
  }
  return r;
}
const b2 = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function TS(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : b2[n];
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
function ES(t, e, n) {
  const s = n.width / 2, o = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, o + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -o);
}
function AS(t, e, n) {
  const s = e.width / 2, o = e.height / 2, i = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - o) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(i) - a * Math.sin(i),
    y: o + t.y + t.shakeY + r * Math.sin(i) + a * Math.cos(i)
  };
}
function w2(t, e, n = {}, s) {
  const o = n.length ?? 240, i = 9, r = 28, a = o - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -i, a - r, 2 * i), t.fillStyle = "#e8b4a0", t.fillRect(a, -i, o - a, 2 * i), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -i), t.lineTo(r, i), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -i * 0.35), t.lineTo(r * 0.35, i * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -i }, { x: o, y: -i }, { x: o, y: i }, { x: r, y: i }, { x: 0, y: 0 }],
    [{ x: r, y: -i }, { x: r, y: i }],
    [{ x: a, y: -i }, { x: a, y: i }]
  ];
  for (const c of l) Cf(t, c, s);
  t.restore();
}
function Of(t, e, n = {}, s) {
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
const _f = 150, k2 = { pencil: 44, eraser: 30 };
function Hf(t, e, n = {}, s) {
  const o = n.tool ?? "pencil", i = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = _f * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const f = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, d = Ot.pencilGrip, g = (v) => {
    const x = v.fingers.thumb, M = v.fingers.index, T = v.fingers.middle, A = th([x.points[3], M.points[3], T.points[3]]), E = th([x.points[1], M.points[0]]), P = (x.depths[3] + M.depths[3] + T.depths[3]) / 3;
    return { pinch: A, direction: Math.atan2(E.y - A.y, E.x - A.x), depth: P };
  }, p = $r(d, { size: u }), m = c - g(p).direction, b = $r(d, { size: u, angle: m * 180 / Math.PI }), k = g(b), w = k2[o] * a, y = { x: k.pinch.x - Math.cos(c) * w, y: k.pinch.y - Math.sin(c) * w }, S = { x: f.x - y.x, y: f.y - y.y }, $ = b.axes.up;
  v2(t, S, { x: -$.x, y: -$.y }, u, n.arm ?? 300 * a, i, n.sleeve ?? "#5b7db1", r), wa(t, S, d, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: i,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: k.depth,
      draw: () => {
        t.save(), t.translate(f.x, f.y), t.scale(a, a), o === "eraser" ? Of(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : w2(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const th = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function v2(t, e, n, s, o, i, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, b) => ({
    x: e.x + n.x * p + l.x * m * b,
    y: e.y + n.y * p + l.y * m * b
  }), u = h(o, 0, 0), f = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, M2(p)), m;
  }, d = Math.min(s * 0.55, o * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / _f), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(d + 4, -1, c * 1.1).x, h(d + 4, -1, c * 1.1).y), t.lineTo(h(d + 4, 1, c * 1.1).x, h(d + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = i, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(d, -1, c * 1.1).x, h(d, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(d, 1, c * 1.1).x, h(d, 1, c * 1.1).y), t.stroke();
  const g = [h(d, -1, c * 1.3), h(o, -1, c * 1.5), h(o, 1, c * 1.5), h(d, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = f(r), t.fill(), t.strokeStyle = f(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function $S(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, o = n.enter ?? 450, i = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, b) => ({ x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: ya(u.path, m), tool: l(u), lift: 0, drawing: !0 };
  }
  const f = [...a].reverse().find((p) => p.end < e), d = a.find((p) => p.start > e), g = (p) => p.path[p.path.length - 1];
  if (f && d && d.start - f.end <= r) {
    const p = (e - f.end) / (d.start - f.end), m = p < 0.5 ? l(f) : l(d);
    return { at: h(g(f), d.path[0], c(p)), tool: m, lift: Math.sin(Math.PI * p), drawing: !1 };
  }
  if (d && d.start - e <= o) {
    const p = 1 - (d.start - e) / o;
    return { at: h(s, d.path[0], c(p)), tool: l(d), lift: 1 - c(p), drawing: !1 };
  }
  if (f && e - f.end <= i) {
    const p = (e - f.end) / i;
    return { at: h(g(f), s, c(p)), tool: l(f), lift: c(p), drawing: !1 };
  }
  return null;
}
function PS(t, e, n, s = 0.08, o = 32) {
  const i = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= o; a++) {
    const l = -Math.PI / 2 + i * a / o;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function IS(t) {
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
      const u = t.sketch ? Sr(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : Cf(a, ys(e, h))), r && h > 0 && h < 1 && Hf(a, ya(e, h), r, u);
    }
  };
}
function M2(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, o, i] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${o}, ${i}, 0)`;
}
function Cf(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const Gs = 1e5;
function OS(t, e, n, s, o = 6) {
  const i = [], r = Math.max(1, Math.round(o));
  for (let a = 0; a <= r; a++)
    i.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return i;
}
function Rf(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const o = ys(e, s), i = n / 2, r = (a) => {
    t.beginPath(), t.rect(-Gs, -Gs, 2 * Gs, 2 * Gs), a(), t.clip("evenodd");
  };
  for (const a of o)
    r(() => {
      t.moveTo(a.x + i, a.y), t.arc(a.x, a.y, i, 0, Math.PI * 2);
    });
  for (let a = 1; a < o.length; a++) {
    const l = o[a - 1], c = o[a], h = Math.hypot(c.x - l.x, c.y - l.y);
    if (h === 0) continue;
    const u = -(c.y - l.y) / h * i, f = (c.x - l.x) / h * i;
    r(() => {
      t.moveTo(l.x + u, l.y + f), t.lineTo(c.x + u, c.y + f), t.lineTo(c.x - u, c.y - f), t.lineTo(l.x - u, l.y - f), t.closePath();
    });
  }
}
function _S(t, e, n, s, o) {
  t.save(), Rf(t, e, n, s), o(), t.restore();
}
function HS(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, o = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(i, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (i.save(), Rf(i, e.path, n, l), t.draw(i, r, a), i.restore(), !o || l <= 0 || l >= 1) return;
      const c = ya(e.path, l);
      s ? Hf(i, c, { ...s, tool: "eraser" }) : Of(i, c, o);
    }
  };
}
function _s() {
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
    valueAt: (n, s) => qa(t.get(n), s),
    cutAfter(n, s) {
      for (const o of n) t.set(o, (t.get(o) ?? []).filter((i) => i.time <= s));
    },
    tracks(n) {
      return [...t].filter(([, s]) => s.length > 0).map(([s, o]) => ({
        id: `${n}-${s}`,
        target: n,
        property: s,
        keyframes: x2(o)
      }));
    }
  };
}
function qa(t, e) {
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
function Ss(t) {
  const e = [...t ?? []].sort((n, s) => n.time - s.time);
  return e.slice(1).flatMap((n, s) => n.value !== e[s].value ? [{ start: e[s].time, end: n.time }] : []);
}
function x2(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
const S2 = 16e-4, T2 = 0.6, je = 33;
function pi(t) {
  const e = (i, r) => `piece.${i.id}.${r}`, n = (i, r) => ({
    x: i.home.x + t.valueAt(e(i, "x"), r),
    y: i.home.y + t.valueAt(e(i, "y"), r)
  }), s = (i, r) => {
    const a = t.keys(e(i, "x"));
    if (!a || a.length < 2) return;
    const l = n(i, r - je), c = n(i, r);
    return { x: (c.x - l.x) / je, y: (c.y - l.y) / je };
  }, o = (i, r) => t.cutAfter(["x", "y", "rotate"].map((a) => e(i, a)), r);
  return {
    at: n,
    cutAfter: o,
    follow(i, r) {
      for (const a of r)
        t.push(e(i, "x"), { time: a.time, value: a.x - i.home.x }), t.push(e(i, "y"), { time: a.time, value: a.y - i.home.y });
    },
    fling(i, r) {
      const a = n(i, r.at), l = r.velocity ?? s(i, r.at) ?? { x: 0.5, y: -0.6 }, c = r.gravity ?? S2, h = r.duration ?? 900, u = (r.spin ?? T2) * (l.x < 0 ? -1 : 1), f = t.valueAt(e(i, "rotate"), r.at);
      o(i, r.at);
      for (let d = 0; d <= h; d += je) {
        const g = a.x + l.x * d, p = a.y + l.y * d + 0.5 * c * d * d;
        t.push(e(i, "x"), { time: r.at + d, value: g - i.home.x }), t.push(e(i, "y"), { time: r.at + d, value: p - i.home.y }), t.push(e(i, "rotate"), { time: r.at + d, value: f + u * d });
      }
      t.tween(e(i, "opacity"), 1, 0, { at: r.at + h * 0.6, duration: h * 0.4 });
    },
    move(i, r) {
      const a = n(i, r.at);
      t.tween(e(i, "x"), a.x - i.home.x, r.to.x - i.home.x, r, 400), t.tween(e(i, "y"), a.y - i.home.y, r.to.y - i.home.y, r, 400);
    }
  };
}
function Ya(t, e, { ground: n, every: s, floors: o }) {
  if (o.every((w) => w.windows.length === 0)) return t;
  const i = t.find((w) => w.target === e && w.property === "y"), r = new _t({ id: `${e}-ride`, tracks: i ? [i] : [] }), a = (w) => i ? Number(r.getStateAtTime(w).values.get(e)?.get("y") ?? 0) : 0, l = (w) => {
    const y = n + a(w);
    return o.findIndex((S) => Math.abs(S.top - y) < 0.5);
  }, c = (i?.keyframes ?? []).map((w) => w.time), h = (w) => {
    const y = (M) => M < 0 ? 0 : o[M].offset(w), S = l(w);
    if (S >= 0) return y(S);
    if (Math.abs(a(w)) < 0.5) return 0;
    const $ = (M) => l(M) >= 0 || Math.abs(a(M)) < 0.5, v = [...c].reverse().find((M) => M <= w && $(M)), x = c.find((M) => M >= w && $(M));
    return v === void 0 && x === void 0 ? 0 : v === void 0 ? y(l(x)) : x === void 0 || x === v ? y(l(v)) : y(l(v)) + (y(l(x)) - y(l(v))) * (w - v) / (x - v);
  }, u = o.flatMap((w) => w.windows), f = (w, y) => u.some((S) => S.start < y && S.end > w) || h(w) !== h(y), d = i ? [...i.keyframes] : [{ time: 0, value: 0 }], g = [{ ...d[0], value: d[0].value + h(d[0].time) }], p = (w, y) => {
    const S = /* @__PURE__ */ new Set([y]);
    for (let $ = w + s; $ < y; $ += s) S.add($);
    for (const $ of u) for (const v of [$.start, $.end]) v > w && v < y && S.add(v);
    for (const $ of [...S].sort((v, x) => v - x)) g.push({ time: $, value: a($) + h($) });
  };
  for (let w = 1; w < d.length; w++) {
    const y = d[w - 1].time, S = d[w].time;
    f(y, S) ? p(y, S) : g.push({ ...d[w], value: d[w].value + h(S) });
  }
  const m = d[d.length - 1].time, b = Math.max(m, ...u.map((w) => w.end));
  b > m && p(m, b);
  const k = { id: i?.id ?? `${e}-y`, target: e, property: "y", keyframes: g };
  return i ? t.map((w) => w === i ? k : w) : [...t, k];
}
function Kn(t) {
  const e = t.indexOf(":");
  return e < 0 ? { kind: t, rest: "" } : { kind: t.slice(0, e), rest: t.slice(e + 1) };
}
function Xe(t, e, n, s) {
  const o = Object.keys(n.anchors).map((r) => Kn(r).kind), { kind: i } = Kn(e);
  return o.includes(i) ? new Error(`${t}: no anchor "${e}"${s ? `: ${s}` : ""} (anchors: ${Object.keys(n.anchors).join(", ")})`) : new Error(`${t}: ${ft("anchor", i, o)} (anchors: ${Object.keys(n.anchors).join(", ")})`);
}
function gi(t, e, n) {
  return new Error(`${t}.edit: ${ft("edit", e, Object.keys(n.edits))}`);
}
function kt(t, e, n, s) {
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
const E2 = {
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
}, jr = ["wipe", "fly", "blur"], uo = {
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
}, A2 = 0.9, $2 = 8;
function CS(t) {
  const e = { ...E2, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, o = (t.lineHeight ?? 1.6) * s, i = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * i, l = Math.max(1, ...n.map((C) => C.length)), c = t.width ?? r * 2 + a + l * i, h = r * 2 + n.length * o, u = t.x + r + a, f = new Set(t.hidden ?? []), d = t.language ?? "plain";
  if (!Xr.includes(d)) throw new Error(`codePanel: ${ft("language", d, Xr)}`);
  const g = n.map((C) => _2(C, d).flatMap((B) => Array.from(B.text, () => e[B.kind]))), p = _s(), m = pi(p), b = [], k = /* @__PURE__ */ new Map(), w = [], y = [], S = (C) => {
    if (!Number.isInteger(C) || C < 1 || C > n.length) throw new Error(`codePanel: no line ${C} (it has ${n.length})`);
  }, $ = p.tween, v = p.last, x = (C, B, Y, I, N, nt = 300) => {
    S(C), $(`line.${C}.${B}`, Y, I, N, nt);
  }, M = (C, B) => b.filter((Y) => Y.line < C && Y.closed <= B).length, T = kt, A = (C) => t.y + r + (C - 1) * o, E = (C) => Array.isArray(C) ? C : [C], P = (C, B, Y) => {
    let I = -1;
    for (let N = 0; N < Y; N++)
      if (I = n[C - 1].indexOf(B, I + 1), I < 0) throw new Error(`codePanel: line ${C} has no ${Y > 1 ? `${Y}th ` : ""}"${B}"`);
    return I;
  }, O = {};
  n.forEach((C, B) => {
    const Y = B + 1;
    O[`line.${Y}.highlight`] = 0, O[`line.${Y}.strike`] = 0, O[`line.${Y}.wipe`] = 0, O[`line.${Y}.reveal`] = f.has(Y) ? 0 : 1, O[`line.${Y}.shift`] = 0;
  });
  const L = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: O,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${d} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return I2(Object.keys(O));
      },
      actions: Lf
    },
    draw(C, B) {
      const Y = B.props ?? {}, I = (R) => Number(Y[R] ?? O[R]), N = r + a, nt = (R) => r + (R - 1) * o - I(`line.${R}.shift`) * o;
      C.fillStyle = e.background, eh(C, 0, 0, c, h, 8), C.fill(), C.font = `${s}px ${e.font}`, C.textBaseline = "middle", C.textAlign = "left";
      const H = (R, z, U, W, F) => {
        const D = n[R - 1];
        for (let V = z; V < U; V++)
          D[V] !== " " && (C.fillStyle = g[R - 1][V], C.fillText(D[V], W + (V - z) * i, F));
      };
      C.save(), eh(C, 0, 0, c, h, 8), C.clip(), n.forEach((R, z) => {
        const U = z + 1, W = I(`line.${U}.wipe`);
        if (W >= 1) return;
        const F = nt(U), D = F + o / 2, V = Math.max(1, R.length) * i, K = Math.round(I(`line.${U}.reveal`) * R.length), Z = k.get(U) ?? { style: "wipe", from: "left" };
        C.save(), W > 0 && P2(C, Z, W, { left: N - a, top: F, width: a + V + i, height: o }, c);
        const tt = I(`line.${U}.highlight`);
        tt > 0 && (C.globalAlpha *= Math.min(1, tt), C.fillStyle = e.highlight, C.fillRect(N - i / 2, F, V + i, o), C.globalAlpha /= Math.min(1, tt)), a > 0 && K > 0 && (C.fillStyle = e.gutter, C.textAlign = "right", C.fillText(String(U), N - i, D), C.textAlign = "left");
        const _ = [
          ...w.filter((st) => st.line === U).map((st) => ({ column: st.column, length: st.text.length, piece: st, insert: void 0 })),
          ...y.filter((st) => st.line === U).map((st) => ({ column: st.column, length: 0, piece: void 0, insert: st }))
        ].sort((st, at) => st.column - at.column || st.length - at.length);
        let X = 0, ot = N;
        for (const st of _) {
          H(U, X, Math.min(st.column, K), ot, D), ot += (st.column - X) * i;
          let at = st.length, et = "";
          if (st.piece) {
            const J = st.piece.written ?? "", it = I(`piece.${st.piece.id}.write`);
            J && it > 0 ? (et = J.slice(0, Math.round(it * J.length)), at = st.length + (J.length - st.length) * Math.min(1, it * 2)) : at = st.length * (1 - I(`piece.${st.piece.id}.away`));
          } else st.insert && (at = st.insert.chars * I(`insert.${st.insert.id}.open`), st.insert.text && (et = st.insert.text.slice(0, Math.round(I(`insert.${st.insert.id}.type`) * st.insert.text.length))));
          C.fillStyle = e.text;
          for (let J = 0; J < et.length; J++) et[J] !== " " && C.fillText(et[J], ot + J * i, D);
          ot += at * i, X = st.column + st.length;
        }
        H(U, X, Math.max(X, K), ot, D);
        const rt = I(`line.${U}.strike`);
        rt > 0 && (C.strokeStyle = e.strike, C.lineWidth = Math.max(1.5, s / 10), C.beginPath(), C.moveTo(N, D), C.lineTo(N + V * Math.min(1, rt), D), C.stroke()), C.restore();
      });
      for (const R of w) {
        const z = I(`piece.${R.id}.opacity`);
        if (z <= 0 || I(`line.${R.line}.wipe`) >= 1) continue;
        const U = N + (R.column + R.text.length / 2) * i + I(`piece.${R.id}.x`), W = nt(R.line) + o / 2 + I(`piece.${R.id}.y`);
        C.save(), C.globalAlpha = Math.min(1, z), C.translate(U, W), C.rotate(I(`piece.${R.id}.rotate`) * Math.PI / 180), H(R.line, R.column, R.column + R.text.length, -R.text.length * i / 2, 0), C.restore();
      }
      C.restore();
    }
  }, q = (C) => {
    const { kind: B, rest: Y } = Kn(C), I = (N) => Xe("codePanel", C, uo, N);
    if (B === "box") {
      if (Y) throw I("box takes no arguments");
      return { kind: B };
    }
    if (B === "line") {
      if (!/^\d+$/.test(Y)) throw I("write it line:N");
      return { kind: B, n: Number(Y) };
    }
    if (B === "token") {
      const N = /^(\d+)(?:#(\d+))?:(.+)$/.exec(Y);
      if (!N) throw I("write it token:N:TEXT, or token:N#K:TEXT for the Kth");
      return { kind: B, n: Number(N[1]), occurrence: N[2] ? Number(N[2]) : 1, text: N[3] };
    }
    if (B === "spot") {
      const N = /^(\d+):(\d+)(?::(\d+))?$/.exec(Y);
      if (!N) throw I("write it spot:N:C, or spot:N:C:W for W characters");
      return { kind: B, n: Number(N[1]), column: Number(N[2]), width: N[3] ? Number(N[3]) : 1 };
    }
    throw I();
  }, G = (C, B, Y, I = !1) => {
    const N = Array.isArray(B) ? B : [B];
    if (N.length === 0 || I && N.length > 1) throw new Error(`codePanel.edit: ${C} takes ${I ? "one" : "at least one"} ${Y} anchor`);
    return N.map((nt) => {
      const H = q(nt);
      if (H.kind !== Y) throw new Error(`codePanel.edit: ${C} takes ${Y} anchors (${Y}:…), not "${nt}"`);
      return H;
    });
  }, Q = (C, B) => {
    if (typeof B.text != "string") throw new Error(`codePanel.edit: ${C} needs \`text\` (the text to write)`);
    return B.text;
  }, j = {
    kind: "code",
    about: uo,
    target: L,
    lines: n,
    box: T(t.x, t.y, c, h),
    line(C, B = 1 / 0) {
      return S(C), T(u, A(C) - M(C, B) * o, Math.max(1, n[C - 1].length) * i, o);
    },
    token(C, B, Y = 1, I = 1 / 0) {
      S(C);
      const N = P(C, B, Y);
      return T(u + N * i, A(C) - M(C, I) * o, B.length * i, o);
    },
    highlight(C, B) {
      for (const Y of E(C)) {
        const I = v(`line.${Y}.highlight`, 0);
        x(Y, "highlight", I, B.on === !1 ? 0 : 1, B, 200);
      }
      return j;
    },
    strike(C, B) {
      for (const Y of E(C)) x(Y, "strike", v(`line.${Y}.strike`, 0), 1, B);
      return j;
    },
    remove(C, B) {
      const Y = E(C), I = B.style ?? "wipe";
      if (!jr.includes(I)) throw new Error(`codePanel.remove: ${ft("style", I, jr)}`);
      const N = I === "wipe" ? 300 : 450, nt = B.at + (B.duration ?? N), H = B.close ?? 250;
      for (const R of Y)
        x(R, "wipe", 0, 1, { ...B, easing: B.easing ?? (I === "fly" ? "ease-in" : void 0) }, N), k.set(R, { style: I, from: B.from ?? "left" }), b.push({ line: R, closed: nt + H });
      for (let R = 1; R <= n.length; R++) {
        if (Y.includes(R)) continue;
        const z = Y.filter((W) => W < R).length;
        if (z === 0) continue;
        const U = v(`line.${R}.shift`, 0);
        x(R, "shift", U, U + z, { at: nt, duration: H, easing: "ease-in-out" });
      }
      return j;
    },
    type(C, B) {
      return x(C, "reveal", 0, 1, { duration: n[C - 1].length * 45, ...B }), j;
    },
    piece(C, B, Y = 1) {
      if (typeof C == "string") {
        const R = q(C);
        if (R.kind !== "token") throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${C}"`);
        return j.piece(R.n, R.text, R.occurrence);
      }
      const I = C;
      if (B === void 0) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")');
      S(I);
      const N = P(I, B, Y), nt = w.find((R) => R.line === I && R.column === N && R.text === B);
      if (nt) return nt;
      if (w.some((R) => R.line === I && N < R.column + R.text.length && R.column < N + B.length))
        throw new Error(`codePanel: "${B}" on line ${I} overlaps another piece`);
      const H = { id: w.length + 1, line: I, column: N, text: B, home: j.token(I, B, Y, 0) };
      w.push(H);
      for (const R of ["x", "y", "rotate", "write", "away"]) O[`piece.${H.id}.${R}`] = 0;
      return O[`piece.${H.id}.opacity`] = 1, H;
    },
    follow(C, B) {
      return m.follow(C, B), j;
    },
    fling(C, B) {
      return m.fling(C, B), j;
    },
    move(C, B) {
      return m.move(C, B), j;
    },
    write(C, B, Y) {
      return C.written = B, $(`piece.${C.id}.write`, 0, 1, { duration: Math.max(1, B.length) * 70, ...Y }), j;
    },
    spot(C, B, Y = 1, I = 1 / 0) {
      S(C);
      const N = y.filter((nt) => nt.line === C && nt.column <= B && nt.at <= I).reduce((nt, H) => nt + H.chars, 0);
      return T(u + (B + N) * i, A(C) - M(C, I) * o, Y * i, o);
    },
    insert(C, B, Y, I) {
      S(C);
      const N = { id: y.length + 1, line: C, column: B, chars: Y.length, text: Y, at: I.at };
      y.push(N), O[`insert.${N.id}.open`] = 0, O[`insert.${N.id}.type`] = 0;
      const nt = I.duration ?? Y.length * 70;
      return $(`insert.${N.id}.open`, 0, 1, { at: I.at, duration: nt * 0.6, easing: "ease-out" }), $(`insert.${N.id}.type`, 0, 1, { at: I.at, duration: nt }), j;
    },
    drop(C, B, Y, I) {
      S(B);
      const N = I.duration ?? 250, nt = B === C.line, H = I.easing ?? (nt ? "linear" : "ease-out"), R = j.landing(C, B, Y, I.at), z = { id: y.length + 1, line: B, column: Y, chars: C.text.length, at: I.at };
      return y.push(z), O[`insert.${z.id}.open`] = 0, $(`insert.${z.id}.open`, 0, 1, { at: I.at, duration: N, easing: nt ? H : "ease-out" }), $(`piece.${C.id}.away`, v(`piece.${C.id}.away`, 0), 1, { at: I.at, duration: N, easing: nt ? H : "ease-in-out" }), m.cutAfter(C, I.at), j.move(C, { at: I.at, duration: N, easing: H, to: { x: R.x, y: R.y } }), $(`piece.${C.id}.rotate`, p.valueAt(`piece.${C.id}.rotate`, I.at), 0, { at: I.at, duration: N }), j;
    },
    landing(C, B, Y, I = 1 / 0) {
      const N = j.spot(B, Y, C.text.length, I), nt = B === C.line && Y > C.column ? C.text.length * i : 0;
      return T(N.left - nt, N.top, N.width, N.height);
    },
    ride(C, B, Y) {
      const I = n.map((N, nt) => {
        const H = p.keys(`line.${nt + 1}.shift`) ?? [];
        return { top: A(nt + 1), offset: (R) => -qa(H, R) * o, windows: Ss(H) };
      });
      return Ya(C, B, { ground: Y.ground, every: Y.every ?? je, floors: I });
    },
    tracks: p.tracks,
    anchor(C, B = 1 / 0) {
      const Y = q(C);
      return Y.kind === "box" ? j.box : Y.kind === "line" ? j.line(Y.n, B) : Y.kind === "token" ? j.token(Y.n, Y.text, Y.occurrence, B) : j.spot(Y.n, Y.column, Y.width, B);
    },
    edit(C, B, Y) {
      const I = () => G(C, B, "line").map((N) => N.n);
      if (C === "highlight") return j.highlight(I(), Y);
      if (C === "strike") return j.strike(I(), Y);
      if (C === "remove") return j.remove(I(), Y);
      if (C === "type") {
        for (const N of I()) j.type(N, Y);
        return j;
      }
      if (C === "insert") {
        const [N] = G(C, B, "spot", !0);
        return j.insert(N.n, N.column, Q(C, Y), Y);
      }
      if (C === "write" || C === "drop" || C === "move" || C === "fling") {
        const [N] = G(C, B, "token", !0), nt = j.piece(N.n, N.text, N.occurrence);
        if (C === "write") return j.write(nt, Q(C, Y), Y);
        if (C === "fling") return j.fling(nt, Y);
        if (C === "drop") {
          const R = typeof Y.into == "string" ? q(Y.into) : void 0;
          if (R?.kind !== "spot") throw new Error("codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)");
          return j.drop(nt, R.n, R.column, Y);
        }
        const H = typeof Y.to == "string" ? j.anchor(Y.to, Y.at) : Y.to;
        if (!H || typeof H.x != "number" || typeof H.y != "number") throw new Error("codePanel.edit: move needs `to`, an anchor name or { x, y }");
        return j.move(nt, { ...Y, to: H });
      }
      throw gi("codePanel", C, uo);
    }
  };
  return j;
}
function P2(t, e, n, s, o) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const i = $2 * n;
  if (i > 0.2 && "filter" in t && (t.filter = `blur(${i.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * A2 * o, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
const Lf = {
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
function I2(t) {
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
function eh(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
const Do = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
Do.typescript = [...Do.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const Xr = Object.keys(Do), O2 = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function _2(t, e) {
  const n = new Set(Do[e]), s = O2[e], o = [], i = (a, l) => {
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
const Vi = '"Patrick Hand", "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', Vs = {
  whiteboard: {
    background: "#f7f7f2",
    frame: "#b8bcc4",
    ink: "#1f2a44",
    colors: { ink: "#1f2a44", red: "#d03b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a" },
    font: Vi,
    stroke: 0.09,
    opacity: 1
  },
  chalkboard: {
    background: "#2f4a3a",
    frame: "#7a5a3a",
    ink: "#f1f1e8",
    colors: { ink: "#f1f1e8", red: "#f2a3a3", blue: "#a8c8f0", green: "#b7e4a8", orange: "#f5c98a", yellow: "#f6ef9a" },
    font: Vi,
    stroke: 0.1,
    opacity: 0.9
  },
  lines: {
    background: "#fffdf5",
    frame: "#d9d3c0",
    ink: "#24315c",
    colors: { ink: "#24315c", red: "#c73b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a", pencil: "#6b6b6b" },
    font: Vi,
    stroke: 0.08,
    opacity: 1,
    rule: { color: "#c9d6ec", spacing: 1.55, margin: "#f0a3a3" }
  }
}, nh = ["circle", "box", "underline", "arrow"], Ee = {
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
}, sh = 90, oh = 300, H2 = 0.3;
function RS(t) {
  const e = typeof t.theme == "string" ? t.theme : "whiteboard";
  if (!(e in Vs)) throw new Error(`whiteboard: ${ft("theme", e, Object.keys(Vs))}`);
  const n = typeof t.theme == "object" ? { ...Vs.whiteboard, ...t.theme } : Vs[e], s = t.fontSize ?? 28, o = t.charWidth ?? 0.55, i = (y) => y === void 0 ? n.ink : n.colors[y] ?? y, r = (y) => kt(t.x + y.left, t.y + y.top, y.width, y.height), a = _s(), l = pi(a), c = {}, h = /* @__PURE__ */ new Map(), u = [], f = [], d = (y, S, $, v) => {
    const x = h.get(y);
    if (!x || x.kind !== "text") throw Xe("whiteboard", v, Ee, `there is no text "${y}" (texts: ${g().join(", ") || "none"})`);
    let M = -1;
    for (let A = 0; A < $; A++)
      if (M = x.item.text.indexOf(S, M + 1), M < 0) throw Xe("whiteboard", v, Ee, `text "${y}" has no ${$ > 1 ? `${$}th ` : ""}"${S}"`);
    const T = x.size * o;
    return { column: M, box: kt(x.box.left + M * T, x.box.top, S.length * T, x.box.height) };
  }, g = () => [...h.values()].filter((y) => y.kind === "text").map((y) => y.item.id), p = (y) => {
    const { kind: S, rest: $ } = Kn(y), v = (x) => Xe("whiteboard", y, Ee, x);
    if (S === "box") {
      if ($) throw v("box takes no arguments");
      return { kind: S };
    }
    if (S === "text" || S === "mark") {
      if (!$) throw v(`write it ${S}:ID`);
      return { kind: S, id: $ };
    }
    if (S === "term") {
      const x = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec($);
      if (!x) throw v("write it term:ID:TEXT, or term:ID#K:TEXT for the Kth");
      return { kind: S, id: x[1], occurrence: x[2] ? Number(x[2]) : 1, text: x[3] };
    }
    throw v();
  }, m = (y) => {
    const S = p(y);
    if (S.kind === "box") return kt(0, 0, t.width, t.height);
    if (S.kind === "term") return d(S.id, S.text, S.occurrence, y).box;
    const $ = h.get(S.id);
    if (!$ || $.kind !== S.kind) {
      const v = [...h.values()].filter((x) => x.kind === S.kind).map((x) => x.item.id);
      throw Xe("whiteboard", y, Ee, `there is no ${S.kind} "${S.id}" (${S.kind}s: ${v.join(", ") || "none"})`);
    }
    return $.box;
  };
  for (const y of t.items ?? []) {
    if (!y || typeof y.id != "string" || !y.id || /[:#]/.test(y.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(y?.id)})`);
    if (h.has(y.id)) throw new Error(`whiteboard: two items are called "${y.id}"`);
    if ("text" in y) {
      if (!Array.isArray(y.at) || y.at.length !== 2 || !y.at.every((A) => typeof A == "number")) throw new Error(`whiteboard: text "${y.id}" needs \`at\`, [x, y] from the board's top-left`);
      const M = y.size ?? s, T = kt(y.at[0], y.at[1], Math.max(1, y.text.length) * M * o, M * 1.3);
      h.set(y.id, { kind: "text", item: y, size: M, color: i(y.color), box: T }), c[`text.${y.id}.write`] = y.hidden ? 0 : 1, c[`text.${y.id}.erase`] = 0;
      continue;
    }
    if (!nh.includes(y.mark)) throw new Error(`whiteboard: mark "${y.id}": ${ft("mark", y.mark, nh)}`);
    const S = y.mark === "arrow" ? ["from", "to"] : ["around"];
    for (const M of S) if (typeof y[M] != "string") throw new Error(`whiteboard: ${y.mark} "${y.id}" needs \`${M}\`, a place on the board (an item before it)`);
    const $ = new Set([y.from, y.to].filter((M) => typeof M == "string").map((M) => M.split(":")[1])), v = y.mark === "arrow" ? [...h.values()].filter((M) => M.kind === "text" && !$.has(M.item.id)).map((M) => M.box) : [], x = C2(y, m, s, v);
    h.set(y.id, { kind: "mark", item: y, color: i(y.color), points: x, box: W2(x) }), c[`mark.${y.id}.draw`] = y.hidden ? 0 : 1, c[`mark.${y.id}.erase`] = 0;
  }
  const b = (y) => u.filter((S) => S.item === y), k = {
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
        return F2(Object.keys(c));
      },
      actions: Ee.edits
    },
    draw(y, S) {
      const $ = S.props ?? {}, v = (x) => Number($[x] ?? c[x] ?? 0);
      if (y.save(), y.fillStyle = n.background, ah(y, 0, 0, t.width, t.height, 10), y.fill(), y.lineWidth = Math.max(4, t.width * 0.012), y.strokeStyle = n.frame, y.stroke(), n.rule) {
        y.save(), y.beginPath(), ah(y, 0, 0, t.width, t.height, 10), y.clip(), y.lineWidth = 1, y.strokeStyle = n.rule.color;
        const x = s * (n.rule.spacing ?? 1.55);
        for (let M = x; M < t.height; M += x)
          y.beginPath(), y.moveTo(0, M), y.lineTo(t.width, M), y.stroke();
        n.rule.margin && (y.strokeStyle = n.rule.margin, y.beginPath(), y.moveTo(s * 2.2, 0), y.lineTo(s * 2.2, t.height), y.stroke()), y.restore();
      }
      y.textAlign = "center", y.textBaseline = "middle", y.lineCap = "round", y.lineJoin = "round", y.globalAlpha = n.opacity;
      for (const x of h.values()) {
        if (y.save(), Ji(y, x.box, v(`${x.kind}.${x.item.id}.erase`)), x.kind === "text") {
          const M = b(x.item.id), T = v(`text.${x.item.id}.write`) * x.item.text.length;
          y.font = `${x.size}px ${n.font}`, y.fillStyle = x.color;
          for (let A = 0; A < Math.ceil(T); A++)
            x.item.text[A] === " " || M.some((E) => A >= E.column && A < E.column + E.text.length) || (y.globalAlpha = n.opacity * Math.min(1, T - A), y.fillText(x.item.text[A], x.box.left + (A + 0.5) * x.size * o, x.box.y));
        } else
          rh(y, x.points, v(`mark.${x.item.id}.draw`), x.color, s * n.stroke, x.item.mark === "arrow");
        y.restore();
      }
      for (const x of f) {
        const M = v(`strike.${x.id}.draw`);
        if (M <= 0) continue;
        const { box: T } = x, A = T.height * 0.15;
        rh(y, [{ x: T.left - 3, y: T.y + A }, { x: T.right + 3, y: T.y - A }], M, n.colors.red ?? n.ink, s * n.stroke * 0.8, !1);
      }
      for (const x of u) {
        const M = h.get(x.item), T = M.size * o;
        y.font = `${M.size}px ${n.font}`, y.fillStyle = M.color;
        const A = x.written;
        if (A) {
          const L = v(`piece.${x.id}.write`) * A.length, q = x.home.x - t.x - A.length * T / 2;
          for (let G = 0; G < Math.ceil(L); G++)
            A[G] !== " " && (y.globalAlpha = n.opacity * Math.min(1, L - G), y.fillText(A[G], q + (G + 0.5) * T, x.home.y - t.y));
        }
        const E = v(`piece.${x.id}.opacity`) * Math.min(1, v(`text.${x.item}.write`) * M.item.text.length - x.column);
        if (E <= 0) continue;
        y.save();
        const P = { x: x.home.x - t.x, y: x.home.y - t.y }, O = { x: v(`piece.${x.id}.x`), y: v(`piece.${x.id}.y`) };
        Ji(y, kt(P.x + O.x - x.home.width / 2, P.y + O.y - x.home.height / 2, x.home.width, x.home.height), v(`piece.${x.id}.erase`)), Math.hypot(O.x, O.y) < 1 && Ji(y, M.box, v(`text.${x.item}.erase`)), y.globalAlpha = n.opacity * Math.min(1, E), y.translate(P.x + O.x, P.y + O.y), y.rotate(v(`piece.${x.id}.rotate`) * Math.PI / 180);
        for (let L = 0; L < x.text.length; L++) x.text[L] !== " " && y.fillText(x.text[L], (L + 0.5 - x.text.length / 2) * T, 0);
        y.restore();
      }
      y.restore();
    }
  }, w = {
    kind: "board",
    about: Ee,
    target: k,
    box: kt(t.x, t.y, t.width, t.height),
    anchor(y) {
      return r(m(y));
    },
    piece(y) {
      const S = p(y);
      if (S.kind !== "term") throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${y}"`);
      const { column: $, box: v } = d(S.id, S.text, S.occurrence, y), x = u.find((T) => T.item === S.id && T.column === $ && T.text === S.text);
      if (x) return x;
      if (u.some((T) => T.item === S.id && $ < T.column + T.text.length && T.column < $ + S.text.length))
        throw new Error(`whiteboard: "${S.text}" in "${S.id}" overlaps another piece`);
      const M = { id: u.length + 1, item: S.id, column: $, text: S.text, home: r(v) };
      u.push(M);
      for (const T of ["x", "y", "rotate", "erase", "write"]) c[`piece.${M.id}.${T}`] = 0;
      return c[`piece.${M.id}.opacity`] = 1, M;
    },
    edit(y, S, $) {
      const v = Array.isArray(S) ? S : [S];
      if (v.length === 0) throw new Error(`whiteboard.edit: ${y} takes at least one anchor`);
      const x = v.map((A) => ({ name: A, anchor: p(A) }));
      for (const { name: A } of x) m(A);
      const M = (A, E = !1) => {
        const P = x.find((O) => !A.includes(O.anchor.kind));
        if (P) throw new Error(`whiteboard.edit: ${y} takes ${A.join(" or ")} anchors, not "${P.name}"`);
        if (E && x.length > 1) throw new Error(`whiteboard.edit: ${y} takes one ${A.join(" or ")} anchor`);
      }, T = () => w.piece(x[0].name);
      if (y === "write") {
        if (x.some((A) => A.anchor.kind === "term")) {
          if (M(["term"], !0), typeof $.text != "string") throw new Error("whiteboard.edit: write into a term needs `text` (the new text)");
          const A = T();
          return A.written = $.text, a.tween(`piece.${A.id}.write`, 0, 1, { duration: Math.max(oh, $.text.length * sh), ...$ }), w;
        }
        M(["text"]);
        for (const { anchor: A } of x) {
          const E = A.id, P = h.get(E).item.text;
          a.tween(`text.${E}.write`, 0, 1, { duration: Math.max(oh, P.length * sh), ...$ });
        }
        return w;
      }
      if (y === "draw") {
        M(["mark"]);
        for (const { anchor: A } of x) a.tween(`mark.${A.id}.draw`, 0, 1, { duration: 500, ...$ });
        return w;
      }
      if (y === "erase") {
        M(["text", "term", "mark"]);
        for (const A of x) {
          const E = A.anchor.kind === "term" ? `piece.${w.piece(A.name).id}.erase` : `${A.anchor.kind}.${A.anchor.id}.erase`;
          a.tween(E, 0, 1, { duration: 400, ...$ });
        }
        return w;
      }
      if (y === "strike") {
        M(["text", "term"]);
        for (const A of x) {
          const E = { id: f.length + 1, box: m(A.name) };
          f.push(E), c[`strike.${E.id}.draw`] = 0, a.tween(`strike.${E.id}.draw`, 0, 1, { duration: 250, ...$ });
        }
        return w;
      }
      if (y === "move") {
        M(["term"], !0);
        const A = typeof $.to == "string" ? w.anchor($.to) : $.to;
        if (!A || typeof A.x != "number" || typeof A.y != "number") throw new Error("whiteboard.edit: move needs `to`, an anchor name or { x, y }");
        return w.move(T(), { ...$, to: A });
      }
      if (y === "fling")
        return M(["term"], !0), w.fling(T(), $);
      throw gi("whiteboard", y, Ee);
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
function C2(t, e, n, s = []) {
  const o = rn(ne(t.id)), i = (p) => (o.next() * 2 - 1) * p, r = n * H2;
  if (t.mark === "arrow") {
    const p = e(t.from), m = e(t.to), b = ih(p, m, r * 0.6), k = ih(m, p, r * 0.6), w = Math.hypot(k.x - b.x, k.y - b.y), y = L2(b, k);
    let S = w * (0.06 + i(0.04));
    if (t.bend !== void 0) S = w * t.bend;
    else {
      const x = R2(b, k, y, s, r);
      x !== 0 && (S = x);
    }
    const $ = { x: (b.x + k.x) / 2 + y.x * S, y: (b.y + k.y) / 2 + y.y * S }, v = [];
    for (let x = 0; x <= 24; x++) {
      const M = x / 24;
      v.push({ x: (1 - M) ** 2 * b.x + 2 * (1 - M) * M * $.x + M * M * k.x, y: (1 - M) ** 2 * b.y + 2 * (1 - M) * M * $.y + M * M * k.y });
    }
    return v;
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
    const p = a.left - r, m = a.right + r, b = a.top - r * 0.6, k = a.bottom + r * 0.6, w = (S, $) => ({ x: S + i(r * 0.2), y: $ + i(r * 0.2) }), y = w(p, b);
    return [y, w(m, b), w(m, k), w(p, k), y, { x: y.x + r * 0.8, y: y.y + i(2) }];
  }
  const l = a.width / 2 + r, c = a.height / 2 + r * 0.6, h = -2.2 + i(0.3), u = o.next() * Math.PI * 2, f = 1.12, d = 64, g = [];
  for (let p = 0; p <= d * f; p++) {
    const m = p / d, b = h + m * Math.PI * 2, k = 1 + 0.035 * Math.sin(m * Math.PI * 4 + u) + 0.06 * m;
    g.push({ x: a.x + Math.cos(b) * l * k, y: a.y + Math.sin(b) * c * k });
  }
  return g;
}
function R2(t, e, n, s, o) {
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
    ].map((g) => ({ t: (g.x - t.x) * r.x + (g.y - t.y) * r.y, n: (g.x - t.x) * n.x + (g.y - t.y) * n.y })), f = u.some((g) => g.t > 0 && g.t < i), d = u.some((g) => g.n > 0) && u.some((g) => g.n < 0);
    !f || !d || (a = Math.max(a, ...u.map((g) => g.n)), l = Math.min(l, ...u.map((g) => g.n)));
  }
  return a === 0 && l === 0 ? 0 : a <= -l ? 2 * (a + o) : 2 * (l - o);
}
function ih(t, e, n) {
  const s = e.x - t.x, o = e.y - t.y;
  if (s === 0 && o === 0) return { x: t.x, y: t.y };
  const i = Math.min(s === 0 ? 1 / 0 : (t.width / 2 + n) / Math.abs(s), o === 0 ? 1 / 0 : (t.height / 2 + n) / Math.abs(o));
  return { x: t.x + s * i, y: t.y + o * i };
}
function L2(t, e) {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: -(e.y - t.y) / n, y: (e.x - t.x) / n };
}
function W2(t) {
  const e = t.map((i) => i.x), n = t.map((i) => i.y), s = Math.min(...e), o = Math.min(...n);
  return kt(s, o, Math.max(...e) - s, Math.max(...n) - o);
}
function rh(t, e, n, s, o, i) {
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
  const c = (n - 0.85) / 0.15, h = e[e.length - 1], u = e[e.length - 3] ?? e[0], f = Math.atan2(h.y - u.y, h.x - u.x), d = o * 4.5 * c;
  t.beginPath();
  for (const g of [-1, 1])
    t.moveTo(h.x, h.y), t.lineTo(h.x - Math.cos(f + g * 0.45) * d, h.y - Math.sin(f + g * 0.45) * d);
  t.stroke();
}
function Ji(t, e, n) {
  if (n <= 0) return;
  const s = 8;
  t.beginPath(), t.rect(e.left - s + n * (e.width + s * 2), e.top - s * 4, (1 - n) * (e.width + s * 2), e.height + s * 8), t.clip();
}
function ah(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function F2(t) {
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
const lh = ["bar", "line", "pie", "donut"], ch = 'system-ui, -apple-system, "Segoe UI", sans-serif', Js = {
  light: {
    background: "#ffffff",
    text: "#3b4252",
    grid: "#d8dee9",
    color: "#4c7bd9",
    highlight: "#e8833a",
    palette: ["#4c7bd9", "#3fa66b", "#b05cc9", "#d9c04c", "#4cb8c4", "#d95c6f", "#8a7a5a", "#6b7a99"],
    font: ch
  },
  dark: {
    background: "#1e2230",
    text: "#cdd6f4",
    grid: "#3a4055",
    color: "#89b4fa",
    highlight: "#fab387",
    palette: ["#89b4fa", "#a6e3a1", "#cba6f7", "#f9e2af", "#94e2d5", "#f38ba8", "#b4a58a", "#9399b2"],
    font: ch
  }
}, Sn = {
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
}, N2 = 600, D2 = 500, B2 = 200, z2 = 400, q2 = 0.14, Y2 = Math.PI * 2;
function LS(t) {
  if (!lh.includes(t.kind)) throw new Error(`chart: ${ft("kind", t.kind, lh)}`);
  const e = typeof t.theme == "string" ? t.theme : "light";
  if (!(e in Js)) throw new Error(`chart: ${ft("theme", e, Object.keys(Js))}`);
  const n = typeof t.theme == "object" ? { ...Js.light, ...t.theme } : Js[e];
  if (!Array.isArray(t.data) || t.data.length === 0) throw new Error("chart: `data` needs at least one { id, value }");
  const s = t.kind, o = s === "pie" || s === "donut", i = Array.isArray(t.series) && t.series.length > 1, r = Array.isArray(t.series) && t.series.length > 0 ? t.series : [{ id: "value" }];
  if (o && i) throw new Error(`chart: a ${s} shows one series (got ${r.length}); make a chart per series`);
  const a = /* @__PURE__ */ new Set();
  for (const _ of r) {
    if (typeof _?.id != "string" || !_.id || /[:.]/.test(_.id)) throw new Error(`chart: every series needs an \`id\` without ":" or "." (got ${JSON.stringify(_?.id)})`);
    if (a.has(_.id)) throw new Error(`chart: two series are called "${_.id}"`);
    a.add(_.id);
  }
  const l = new Map(r.map((_, X) => [_.id, X])), c = (_) => r[l.get(_)].color ?? (l.get(_) === 0 ? n.color : n.palette[l.get(_) % n.palette.length]), h = /* @__PURE__ */ new Set(), u = (_, X) => {
    const ot = _.values?.[X.id] ?? (t.series ? void 0 : _.value) ?? _.value;
    if (typeof ot != "number" || !Number.isFinite(ot))
      throw new Error(i ? `chart: "${_.id}" needs a value for series "${X.id}" (\`values: { ${X.id}: … }\`)` : `chart: "${_.id}" needs a \`value\`, a number`);
    return ot;
  };
  for (const _ of t.data) {
    if (typeof _?.id != "string" || !_.id || /[:.]/.test(_.id)) throw new Error(`chart: every datum needs an \`id\` without ":" or "." (got ${JSON.stringify(_?.id)})`);
    if (h.has(_.id)) throw new Error(`chart: two data are called "${_.id}"`);
    for (const X of r) u(_, X);
    h.add(_.id);
  }
  const f = s === "bar" ? "bar" : s === "line" ? "point" : "slice", d = Math.max(...t.data.flatMap((_) => r.map((X) => u(_, X)))), g = o ? t.data.reduce((_, X) => _ + u(X, r[0]), 0) : t.max ?? K2(d * 1.1);
  if (!o && !(g > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${g})`);
  const p = Math.max(10, Math.min(16, t.height / 20)), m = i && t.legend !== !1, b = o ? void 0 : t.axis?.x, k = o ? void 0 : t.axis?.y, w = t.title ? p * 2.3 : p * 0.5, y = {
    left: p * 3.6 + (k ? p * 1.5 : 0),
    right: t.width - p,
    top: (t.title ? p * 3 : p * 1.6) + (m ? p * 1.6 : 0),
    bottom: t.height - p * 2.4 - (b ? p * 1.4 : 0)
  }, S = y.bottom - y.top, $ = (y.right - y.left) / t.data.length, v = i ? $ * 0.72 / r.length : $ * 0.6, x = i ? v * 0.86 : v, M = Math.max(4, p * 0.35), T = S / g, A = new Map(t.data.map((_, X) => [_.id, X])), E = (_) => y.left + $ * (A.get(_) + 0.5), P = (_, X) => i ? E(_) - $ * 0.36 + v * l.get(X) + (v - x) / 2 : E(_) - x / 2, O = (_, X) => P(_, X) + x / 2, L = t.height - p * 1.2, q = {
    cx: t.width / 2,
    cy: (y.top + L) / 2,
    r: Math.max(10, Math.min(t.width / 2, (L - y.top) / 2) - p * 2.6)
  }, G = s === "donut" ? q.r * 0.55 : 0, Q = s === "donut" ? (G + q.r) / 2 : q.r * 0.62, j = /* @__PURE__ */ new Map();
  if (m) {
    let _ = y.right;
    for (const X of [...r].reverse()) {
      const ot = X.label ?? X.id, rt = p * 0.62 * ot.length + p * 1.9;
      j.set(X.id, kt(_ - rt, w, rt, p * 1.4)), _ -= rt + p * 0.6;
    }
  }
  const C = _s(), B = pi(C), Y = {}, I = (_, X, ot) => i ? `${f}.${_}.${X}.${ot}` : `${f}.${_}.${ot}`;
  for (const _ of t.data)
    for (const X of r)
      Y[I(_.id, X.id, "value")] = u(_, X), Y[I(_.id, X.id, "show")] = _.hidden ? 0 : 1, Y[I(_.id, X.id, "highlight")] = 0, o && (Y[I(_.id, X.id, "pull")] = 0);
  const N = (_, X) => C.keys(_)?.length ? qa(C.keys(_), X) : Y[_], nt = (_, X, ot) => N(I(_, X, "value"), ot) * (s === "bar" ? N(I(_, X, "show"), ot) : 1) * T, H = (_) => {
    const X = r[0].id, ot = t.data.map((et) => Math.max(0, _(I(et.id, X, "value"))) * Math.max(0, Math.min(1, _(I(et.id, X, "show"))))), rt = ot.reduce((et, J) => et + J, 0), st = /* @__PURE__ */ new Map();
    let at = -Math.PI / 2;
    return t.data.forEach((et, J) => {
      const it = rt > 0 ? Y2 * ot[J] / rt : 0, lt = at + it / 2, ut = Math.max(0, Math.min(1, _(I(et.id, X, "pull")))) * q.r * q2;
      st.set(et.id, {
        start: at,
        sweep: it,
        mid: lt,
        out: ut,
        centre: { x: q.cx + Math.cos(lt) * (Q + ut), y: q.cy + Math.sin(lt) * (Q + ut) }
      }), at += it;
    }), st;
  }, R = (_) => H((X) => N(X, _)), z = (_) => {
    const { kind: X, rest: ot } = Kn(_), rt = (st) => Xe("chart", _, Sn, st);
    if (X === "box") {
      if (ot) throw rt("box takes no arguments");
      return { kind: "box" };
    }
    if (X === "legend") {
      if (!j.has(ot)) throw rt(m ? `there is no series "${ot}" (series: ${r.map((st) => st.id).join(", ")})` : "only a chart with several series has a legend");
      return { kind: "legend", series: ot };
    }
    if (X === "bar" || X === "point" || X === "slice" || X === "label" || X === "value") {
      if (!ot) throw rt(`write it ${X}:ID`);
      const st = ot.indexOf(":"), at = st < 0 ? ot : ot.slice(0, st), et = st < 0 ? r[0].id : ot.slice(st + 1);
      if (!A.has(at)) throw rt(`there is no "${at}" (data: ${[...A.keys()].join(", ")})`);
      if (!a.has(et)) throw rt(`there is no series "${et}" (series: ${r.map((J) => J.id).join(", ")})`);
      if (X === "label" && st >= 0) throw rt("a label is one per datum: label:ID");
      if ((X === "bar" || X === "point" || X === "slice") && X !== f) throw rt(`a ${s} chart has ${f}s, not ${X}s: ${f}:${at}`);
      return { kind: X, id: at, series: et };
    }
    throw rt();
  }, U = (_, X) => {
    if (_.kind === "box") return kt(0, 0, t.width, t.height);
    if (_.kind === "legend") return j.get(_.series);
    if (o) {
      const et = R(X).get(_.id), J = Math.max(p * 1.5, q.r * 0.42);
      if (_.kind === "slice") return kt(et.centre.x - J / 2, et.centre.y - J / 2, J, J);
      const it = W(et);
      return _.kind === "label" ? it : et.sweep >= 0.3 ? kt(et.centre.x - p * 1.6, et.centre.y - p * 0.65, p * 3.2, p * 1.3) : kt(it.left, it.bottom, it.width, p * 1.3);
    }
    const ot = _.kind === "label" ? E(_.id) : O(_.id, _.series), rt = y.bottom - nt(_.id, _.series, X);
    if (_.kind === "bar") return kt(ot - x / 2, rt, x, y.bottom - rt);
    if (_.kind === "point") return kt(E(_.id) - M, rt - M, M * 2, M * 2);
    if (_.kind === "label") return kt(ot - $ / 2, y.bottom + p * 0.4, $, p * 1.4);
    const st = rt - (s === "line" ? M : 0) - p * 0.3, at = i && s === "bar" ? v : $;
    return kt((s === "line" ? E(_.id) : ot) - at / 2, st - p * 1.3, at, p * 1.3);
  }, W = (_) => {
    const X = q.r + _.out + p * 0.9, ot = { x: q.cx + Math.cos(_.mid) * X, y: q.cy + Math.sin(_.mid) * X }, rt = p * 4.2, st = Math.cos(_.mid), at = st > 0.2 ? ot.x : st < -0.2 ? ot.x - rt : ot.x - rt / 2;
    return kt(at, ot.y - p * 0.7, rt, p * 1.4);
  }, F = (_) => kt(t.x + _.left, t.y + _.top, _.width, _.height), D = (_) => `${t.prefix ?? ""}${_.toFixed(t.decimals ?? 0)}${t.suffix ?? ""}`, V = /* @__PURE__ */ new Map(), K = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: Y,
    about: {
      kind: `${s} chart`,
      summary: `A ${s} chart of ${t.data.length} values (${t.data.map((_) => _.id).join(", ")})${i ? ` in ${r.length} series (${r.map((_) => _.id).join(", ")})` : ""}${o ? "" : `, scaled to ${g}`}. Its ${f}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(Y).map((_) => [_, U2(_)])),
      actions: Sn.edits
    },
    draw(_, X) {
      const ot = X.props ?? {}, rt = (et) => Number(ot[et] ?? Y[et] ?? 0);
      if (_.save(), _.fillStyle = n.background, hh(_, 0, 0, t.width, t.height, 8), _.fill(), _.font = `${p}px ${n.font}`, _.textBaseline = "middle", t.title && (_.fillStyle = n.text, _.textAlign = "left", _.font = `600 ${p * 1.2}px ${n.font}`, _.fillText(t.title, o ? p : y.left, p * 1.5), _.font = `${p}px ${n.font}`), m) {
        _.textAlign = "left";
        for (const et of r) {
          const J = j.get(et.id);
          _.fillStyle = c(et.id), hh(_, J.left, J.top + p * 0.25, p * 0.9, p * 0.9, 2), _.fill(), _.fillStyle = n.text, _.fillText(et.label ?? et.id, J.left + p * 1.3, J.top + J.height / 2);
        }
      }
      if (o) {
        Z(_, rt), _.restore();
        return;
      }
      _.lineWidth = 1, _.textAlign = "right";
      for (let et = 0; et <= 4; et++) {
        const J = y.bottom - S * et / 4;
        _.strokeStyle = n.grid, _.beginPath(), _.moveTo(y.left, J), _.lineTo(y.right, J), _.stroke(), _.fillStyle = n.text, _.globalAlpha = 0.7, _.fillText(j2(g * et / 4), y.left - p * 0.5, J), _.globalAlpha = 1;
      }
      (k || b) && (_.fillStyle = n.text, _.textAlign = "center", _.globalAlpha = 0.85, k && (_.save(), _.translate(p * 0.9, (y.top + y.bottom) / 2), _.rotate(-Math.PI / 2), _.fillText(k, 0, 0), _.restore()), b && _.fillText(b, (y.left + y.right) / 2, y.bottom + p * 2.3), _.globalAlpha = 1);
      const st = (et, J) => rt(I(et, J, "value")) * (s === "bar" ? rt(I(et, J, "show")) : 1) * T, at = (et, J) => Zi(c(J), n.highlight, rt(I(et, J, "highlight")));
      if (s === "line") {
        _.lineWidth = Math.max(2, p * 0.2), _.lineJoin = "round", _.lineCap = "round";
        for (const et of r)
          _.strokeStyle = c(et.id), _.beginPath(), t.data.forEach((J, it) => {
            const lt = { x: E(J.id), y: y.bottom - st(J.id, et.id) }, ut = rt(I(J.id, et.id, "show"));
            if (it === 0) {
              ut > 0 && _.moveTo(lt.x, lt.y);
              return;
            }
            const mt = t.data[it - 1];
            if (rt(I(mt.id, et.id, "show")) < 1 || ut <= 0) return;
            const yt = { x: E(mt.id), y: y.bottom - st(mt.id, et.id) };
            _.lineTo(yt.x + (lt.x - yt.x) * ut, yt.y + (lt.y - yt.y) * ut);
          }), _.stroke();
      }
      _.textAlign = "center";
      for (const et of t.data) {
        for (const J of r) {
          const it = s === "bar" ? O(et.id, J.id) : E(et.id), lt = st(et.id, J.id), ut = rt(I(et.id, J.id, "show"));
          if (_.fillStyle = at(et.id, J.id), s === "bar" ? lt > 0.5 && (X2(_, it - x / 2, y.bottom - lt, x, lt, Math.min(6, x / 4)), _.fill()) : ut > 0 && (_.beginPath(), _.arc(it, y.bottom - lt, M * Math.min(1, ut * 1.5) * (1 + 0.3 * rt(I(et.id, J.id, "highlight"))), 0, Math.PI * 2), _.fill()), t.values !== !1 && ut > 0) {
            _.globalAlpha = Math.min(1, ut * 2), _.font = `600 ${i ? p * 0.85 : p}px ${n.font}`, _.fillStyle = Zi(n.text, n.highlight, rt(I(et.id, J.id, "highlight")));
            const mt = y.bottom - lt - (s === "line" ? M : 0) - p * 0.95;
            _.fillText(D(rt(I(et.id, J.id, "value"))), it, mt), _.font = `${p}px ${n.font}`, _.globalAlpha = 1;
          }
        }
        _.fillStyle = n.text, _.fillText(et.label ?? et.id, E(et.id), y.bottom + p * 1.1);
      }
      _.strokeStyle = n.text, _.lineWidth = 1.5, _.beginPath(), _.moveTo(y.left, y.bottom), _.lineTo(y.right, y.bottom), _.stroke(), _.restore();
    }
  };
  function Z(_, X) {
    const ot = r[0].id, rt = H(X);
    t.data.forEach((st, at) => {
      const et = rt.get(st.id);
      if (et.sweep <= 1e-4) return;
      const J = V.get(st.id), it = J ? { x: X(`piece.${J.id}.x`), y: X(`piece.${J.id}.y`) } : { x: 0, y: 0 }, lt = J ? X(`piece.${J.id}.rotate`) * Math.PI / 180 : 0, ut = J ? X(`piece.${J.id}.opacity`) : 1;
      if (ut <= 0) return;
      _.save(), _.globalAlpha = ut;
      const mt = { x: q.cx + Math.cos(et.mid) * et.out, y: q.cy + Math.sin(et.mid) * et.out };
      _.translate(et.centre.x + it.x, et.centre.y + it.y), _.rotate(lt), _.translate(-et.centre.x, -et.centre.y), _.beginPath(), _.arc(mt.x, mt.y, q.r, et.start, et.start + et.sweep), G > 0 ? _.arc(mt.x, mt.y, G, et.start + et.sweep, et.start, !0) : _.lineTo(mt.x, mt.y), _.closePath(), _.fillStyle = Zi(n.palette[at % n.palette.length], n.highlight, X(I(st.id, ot, "highlight"))), _.fill(), _.strokeStyle = n.background, _.lineWidth = Math.max(1.5, p * 0.15), _.stroke(), t.values !== !1 && et.sweep >= 0.3 && (_.fillStyle = n.background, _.font = `600 ${p}px ${n.font}`, _.textAlign = "center", _.fillText(D(X(I(st.id, ot, "value"))), et.centre.x, et.centre.y), _.font = `${p}px ${n.font}`), _.restore();
      const yt = W(et), Vt = Math.cos(et.mid);
      _.globalAlpha = ut, _.fillStyle = n.text, _.textAlign = Vt > 0.2 ? "left" : Vt < -0.2 ? "right" : "center";
      const Xn = Vt > 0.2 ? yt.left : Vt < -0.2 ? yt.right : yt.left + yt.width / 2;
      _.fillText(st.label ?? st.id, Xn, yt.top + yt.height / 2), t.values !== !1 && et.sweep < 0.3 && (_.globalAlpha = ut * 0.8, _.fillText(D(X(I(st.id, ot, "value"))), Xn, yt.bottom + p * 0.65)), _.globalAlpha = 1;
    });
  }
  const tt = {
    kind: "chart",
    chartKind: s,
    about: Sn,
    target: K,
    max: g,
    box: kt(t.x, t.y, t.width, t.height),
    anchor(_, X = 1 / 0) {
      return F(U(z(_), X));
    },
    piece(_) {
      const X = z(_);
      if (X.kind !== "slice")
        throw new Error(o ? `chart: a piece is a slice, slice:ID, not "${_}"` : `chart: a ${f} is not a piece; slices of a pie or donut are (slice:ID). Change a ${f} with edit('set' | 'show' | 'highlight', …)`);
      const ot = V.get(X.id);
      if (ot) return ot;
      const rt = { id: V.size + 1, datum: X.id, home: F(U(X, 0)) };
      V.set(X.id, rt);
      for (const st of ["x", "y", "rotate"]) Y[`piece.${rt.id}.${st}`] = 0;
      return Y[`piece.${rt.id}.opacity`] = 1, rt;
    },
    edit(_, X, ot) {
      const rt = Array.isArray(X) ? X : [X];
      if (rt.length === 0) throw new Error(`chart.edit: ${_} takes at least one anchor`);
      if (!(_ in Sn.edits)) throw gi("chart", _, Sn);
      if (_ === "pull" && !o) throw new Error(`chart.edit: pull takes slice anchors of a pie or donut; a ${s} chart has ${f}s`);
      const st = rt.map((at) => {
        const et = z(at);
        if (et.kind !== f) throw new Error(`chart.edit: ${_} takes ${f} anchors (${f}:ID), not "${at}"`);
        return et;
      });
      for (const { id: at, series: et } of st) {
        const J = (it) => I(at, et, it);
        if (_ === "set") {
          if (typeof ot.value != "number" || !Number.isFinite(ot.value)) throw new Error("chart.edit: set needs `value`, a number");
          C.tween(J("value"), N(J("value"), ot.at), ot.value, ot, N2);
        } else _ === "show" ? C.tween(J("show"), N(J("show"), ot.at), ot.on === !1 ? 0 : 1, ot, D2) : _ === "pull" ? C.tween(J("pull"), N(J("pull"), ot.at), ot.on === !1 ? 0 : 1, ot, z2) : C.tween(J("highlight"), N(J("highlight"), ot.at), ot.on === !1 ? 0 : 1, ot, B2);
      }
      return tt;
    },
    follow(_, X) {
      return B.follow(_, X), tt;
    },
    fling(_, X) {
      return B.fling(_, X), tt;
    },
    move(_, X) {
      return B.move(_, X), tt;
    },
    ride(_, X, ot) {
      if (s !== "bar") return _;
      const rt = t.data.flatMap(
        (st) => r.map((at) => {
          const et = nt(st.id, at.id, 0), J = [...Ss(C.keys(I(st.id, at.id, "value"))), ...Ss(C.keys(I(st.id, at.id, "show")))];
          return { top: t.y + y.bottom - et, offset: (it) => et - nt(st.id, at.id, it), windows: J };
        })
      );
      return Ya(_, X, { ground: ot.ground, every: ot.every ?? je, floors: rt });
    },
    tracks: C.tracks
  };
  return tt;
}
function K2(t) {
  if (!(t > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(t));
  for (const n of [1, 2, 2.5, 5, 10]) if (n * e >= t - 1e-9) return n * e;
  return 10 * e;
}
function j2(t) {
  return Number.isInteger(t) ? String(t) : String(Number(t.toFixed(2)));
}
function Zi(t, e, n) {
  if (n <= 0) return t;
  if (n >= 1) return e;
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(t) || !/^#[0-9a-f]{6}$/i.test(e)) return n < 0.5 ? t : e;
  const [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}
function hh(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function X2(t, e, n, s, o, i) {
  const r = Math.min(i, o);
  t.beginPath(), t.moveTo(e, n + o), t.lineTo(e, n + r), t.arcTo(e, n, e + r, n, r), t.lineTo(e + s - r, n), t.arcTo(e + s, n, e + s, n + r, r), t.lineTo(e + s, n + o), t.closePath();
}
function U2(t) {
  return t.endsWith(".value") ? { description: "Its value (the bar’s height, the point’s, or the slice’s share, and its value label)", unit: "value" } : t.endsWith(".show") ? { description: "How much of it is shown: a bar grown in from the axis, the line drawn out to the point, a slice opened", unit: "0..1", min: 0, max: 1 } : t.endsWith(".pull") ? { description: "How far the slice is pulled out from the centre", unit: "0..1", min: 0, max: 1 } : t.startsWith("piece.") ? { description: t.endsWith(".opacity") ? "The loose slice’s opacity" : t.endsWith(".rotate") ? "The loose slice’s turn, degrees" : "The loose slice’s offset from home, px", unit: t.endsWith(".rotate") ? "degrees" : t.endsWith(".opacity") ? "0..1" : "px" } : { description: "How much it is coloured out", unit: "0..1", min: 0, max: 1 };
}
function uh() {
  return {
    torso: [{ at: 0, width: 0.083 }, { at: 0.25, width: 0.08 }, { at: 0.5, width: 0.075 }, { at: 0.8, width: 0.085 }, { at: 1, width: 0.023 }],
    arm: [{ at: 0, width: 0.026 }, { at: 0.3, width: 0.024 }, { at: 0.5, width: 0.018 }, { at: 0.7, width: 0.021 }, { at: 1, width: 0.012 }],
    leg: [{ at: 0, width: 0.036 }, { at: 0.3, width: 0.037 }, { at: 0.5, width: 0.026 }, { at: 0.7, width: 0.029 }, { at: 1, width: 0.015 }]
  };
}
const fh = {
  youngMan: {
    figure: "organic",
    skin: "#edb98d",
    ink: "#53372d",
    headSize: 0.28,
    shoulderWidth: 0.074,
    hipWidth: 0.045,
    handSize: 0.078,
    hair: { style: "softSweep", color: "#38291f" },
    ears: !0,
    face: { style: "anime", shape: "angular", jawWidth: 0.83, chinWidth: 0.35, jawRoundness: 1, eyeScale: 0.95, eyeAspect: 1.1, nose: !0, iris: "#6a472d" },
    outfit: { shirt: "#bc7050", trousers: "#495a67", sleeves: "short" }
  },
  youngWoman: {
    figure: "organic",
    skin: "#f1c299",
    ink: "#53372d",
    headSize: 0.28,
    shoulderWidth: 0.065,
    hipWidth: 0.054,
    handSize: 0.075,
    body: { torso: [{ at: 0, width: 0.098 }, { at: 0.18, width: 0.097 }, { at: 0.44, width: 0.061 }, { at: 0.7, width: 0.087 }, { at: 0.85, width: 0.09 }, { at: 1, width: 0.024 }] },
    hair: { style: "flowingBob", color: "#38291f" },
    ears: !0,
    face: { style: "anime", shape: "angular", jawWidth: 0.78, chinWidth: 0.32, jawRoundness: 1, eyeScale: 0.95, eyeAspect: 1.1, nose: !0, iris: "#6a472d", lashes: !0 },
    outfit: { shirt: "#72958b", trousers: "#6b6888", sleeves: "short", bottom: "skirt" }
  },
  childBoy: {
    figure: "organic",
    height: 230,
    skin: "#edb98d",
    ink: "#53372d",
    headSize: 0.36,
    shoulderWidth: 0.052,
    hipWidth: 0.038,
    legLength: 0.82,
    armLength: 0.8,
    handSize: 0.074,
    body: uh(),
    hair: { style: "softSweep", color: "#38291f" },
    ears: !0,
    face: { style: "anime", shape: "round", eyeScale: 1, eyeAspect: 1.1, nose: !0, iris: "#6a472d" },
    outfit: { shirt: "#d99843", trousers: "#497b91", sleeves: "short", bottom: "shorts" }
  },
  childGirl: {
    figure: "organic",
    height: 225,
    skin: "#f1c299",
    ink: "#53372d",
    headSize: 0.36,
    shoulderWidth: 0.052,
    hipWidth: 0.038,
    legLength: 0.82,
    armLength: 0.8,
    handSize: 0.074,
    body: uh(),
    hair: { style: "flowingBob", color: "#38291f" },
    ears: !0,
    face: { style: "anime", shape: "round", eyeScale: 1, eyeAspect: 1.1, nose: !0, iris: "#6a472d", lashes: !0 },
    outfit: { shirt: "#ae7396", trousers: "#648769", sleeves: "short", bottom: "skirt" }
  }
};
function WS(t, e = {}) {
  if (!Object.prototype.hasOwnProperty.call(fh, t)) throw new Error(`softCartoonCharacter: unknown actor '${t}'`);
  const n = fh[t];
  return ai({ ...n, ...e, body: { ...n.body, ...e.body }, face: { ...n.face, ...e.face } });
}
const G2 = {
  animeBoy: {
    label: "Anime boy",
    group: "anime",
    scale: 0.68,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "child",
      headSize: 0.34,
      skin: "#f2c7a5",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "spiky", color: "#263c68" },
      face: { style: "anime", iris: "#318fa5", lashes: !1 },
      outfit: { shirt: "#efac45", trousers: "#375a91", bottom: "shorts", shoes: "boots" }
    }
  },
  animeGirl: {
    label: "Anime girl",
    group: "anime",
    scale: 0.68,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "child",
      headSize: 0.34,
      skin: "#e8ad8c",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "bob", color: "#4f304e" },
      face: { style: "anime", iris: "#9d5f32" },
      outfit: { shirt: "#e9779f", trousers: "#5c4c86", bottom: "shorts", shoes: "boots" }
    }
  },
  animeYoungMan: {
    label: "Anime young man",
    group: "anime",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "tall",
      headSize: 0.23,
      skin: "#efbf9c",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "spiky", color: "#243552" },
      face: { style: "anime", iris: "#507bcc", lashes: !1 },
      outfit: { shirt: "#57bbc0", trousers: "#334967", sleeves: "long", over: "hoodie", overColor: "#57bbc0", shoes: "boots" }
    }
  },
  animeYoungWoman: {
    label: "Anime young woman",
    group: "anime",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "slim",
      headSize: 0.23,
      skin: "#f3cbb4",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "highPonytail", color: "#773853" },
      face: { style: "anime", iris: "#9163c4" },
      outfit: { shirt: "#ae7cda", trousers: "#35456c", sleeves: "long", shoes: "boots" }
    }
  },
  animeMan: {
    label: "Anime man",
    group: "anime",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "broad",
      headSize: 0.23,
      skin: "#b67f62",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "sidePart", color: "#302839" },
      face: { style: "anime", iris: "#9b713b", lashes: !1 },
      outfit: { shirt: "#677aab", trousers: "#343848", sleeves: "long", collar: !0, shoes: "boots" }
    }
  },
  animeWoman: {
    label: "Anime woman",
    group: "anime",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "standard",
      headSize: 0.23,
      skin: "#d59a73",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "shoulderWaves", color: "#382c4c" },
      face: { style: "anime", iris: "#2b8f82" },
      outfit: { shirt: "#df6c79", trousers: "#46506c", sleeves: "long", bottom: "skirt", shoes: "boots" }
    }
  },
  animeOlderMan: {
    label: "Anime older man",
    group: "anime",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "stocky",
      headSize: 0.25,
      skin: "#e0b291",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "receding", color: "#b8c4d1" },
      facialHair: { style: "shortBoxed", color: "#dae0e8" },
      face: { style: "anime", iris: "#557c8b", lashes: !1, ageLines: 0.8 },
      outfit: { shirt: "#9c846c", trousers: "#46505c", sleeves: "long", collar: !0, shoes: "boots" }
    }
  },
  animeOlderWoman: {
    label: "Anime older woman",
    group: "anime",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "standard",
      headSize: 0.25,
      skin: "#c4947b",
      ink: "#302c48",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "topBun", color: "#d1d3df" },
      face: { style: "anime", iris: "#7a6998", ageLines: 0.8 },
      outfit: { shirt: "#6d9b93", trousers: "#66597a", sleeves: "long", over: "cardigan", overColor: "#6d9b93", shoes: "boots" }
    }
  }
}, V2 = {
  mangaYoungMan: {
    label: "Manga young man",
    group: "manga",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "tall",
      headSize: 0.21,
      lineWidth: 2.8,
      skin: "#edbf9b",
      ink: "#252536",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "mangaSpikes", color: "#27354c" },
      face: { style: "anime", shape: "angular", jawWidth: 0.78, chinWidth: 0.16, eyeScale: 0.8, eyeAspect: 0.63, iris: "#3a9baa", lashes: !1, nose: !0 },
      outfit: { shirt: "#c65a49", trousers: "#293c56", sleeves: "long", collar: !0, shoes: "boots" }
    }
  },
  mangaYoungWoman: {
    label: "Manga young woman",
    group: "manga",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "slim",
      headSize: 0.21,
      lineWidth: 2.8,
      skin: "#e2a482",
      ink: "#252536",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "mangaSweep", color: "#683e64" },
      face: { style: "anime", shape: "angular", jawWidth: 0.69, chinWidth: 0.1, eyeScale: 0.85, eyeAspect: 0.72, iris: "#8462b7", nose: !0 },
      outfit: { shirt: "#518c96", trousers: "#364361", sleeves: "long", shoes: "boots" }
    }
  },
  mangaRival: {
    label: "Manga rival",
    group: "manga",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "broad",
      headSize: 0.21,
      lineWidth: 2.8,
      skin: "#b77e5f",
      ink: "#252536",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "mangaSpikes", color: "#e6e0cc", volume: 0.16 },
      face: { style: "anime", shape: "angular", jawWidth: 0.9, chinWidth: 0.25, eyeScale: 0.75, eyeAspect: 0.55, iris: "#ba8445", lashes: !1, nose: !0 },
      outfit: { shirt: "#4c4b75", trousers: "#303348", sleeves: "long", over: "hoodie", shoes: "boots" }
    }
  },
  mangaHeroine: {
    label: "Manga heroine",
    group: "manga",
    scale: 1,
    options: {
      figure: "fluid",
      look: "clean",
      proportions: "thin",
      build: "tall",
      headSize: 0.21,
      lineWidth: 2.8,
      skin: "#f0c5aa",
      ink: "#252536",
      ears: !0,
      hands: "cartoon",
      handStyle: "natural",
      hair: { style: "highPonytail", color: "#263647", texture: "spiky", textureAmount: 0.35 },
      face: { style: "anime", shape: "angular", jawWidth: 0.73, chinWidth: 0.12, eyeScale: 0.83, eyeAspect: 0.65, iris: "#427e9b", nose: !0 },
      outfit: { shirt: "#b65e7c", trousers: "#31405b", sleeves: "long", collar: !0, shoes: "boots" }
    }
  }
}, Wf = {
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
    options: { build: "child", hair: { style: "bob", color: we.chestnut }, ears: !0, outfit: { shirt: "#e86a92", trousers: "#4a5b8c", bottom: "skirt" } }
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
    options: { build: "slim", hair: { style: "highPonytail", color: we.auburn }, ears: !0, outfit: { shirt: "#f0b43c", trousers: "#36507a" } }
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
    options: { build: "curvy", hair: { style: "shoulderWaves", color: we.black }, ears: !0, outfit: { shirt: "#9b5fc0", trousers: "#2f2f3a", sleeves: "long" } }
  },
  grandpa: {
    label: "Grandpa",
    group: "family",
    scale: 0.96,
    options: {
      build: "stocky",
      hair: { style: "receding", color: we.gray },
      facialHair: { style: "shortBoxed", color: we.white },
      glasses: "square",
      ears: !0,
      outfit: { shirt: "#b98a5a", trousers: "#4b4440", sleeves: "long", collar: !0 }
    }
  },
  grandma: {
    label: "Grandma",
    group: "family",
    scale: 0.9,
    options: { build: "short", hair: { style: "topBun", color: we.white }, glasses: "round", ears: !0, outfit: { shirt: "#5d9fa8", trousers: "#5a4a5e", sleeves: "long", bottom: "skirt" } }
  },
  doctor: {
    label: "Doctor",
    group: "work",
    scale: 0.97,
    options: { build: "slim", hair: { style: "lowPonytail", color: we.black }, ears: !0, outfit: { shirt: "#8fb8d8", trousers: "#36507a", over: "labCoat", collar: !0 } }
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
    options: { build: "stocky", hair: { style: "shoulderStraight", color: we.blond }, hat: "sunHat", ears: !0, outfit: { shirt: "#d64535", trousers: "#4f6b3a", sleeves: "long" } }
  },
  ...G2,
  ...V2
};
function FS(t, e = 300, n = {}) {
  const s = Wf[t];
  if (!s) throw new Error(`castMember: unknown cast member '${t}'`);
  return { ...s.options, height: Math.round(e * s.scale), ...n };
}
const Bo = {
  handshake: { height: 0.47, spacing: 0.42, lean: 6 },
  highFive: { height: 0.9, spacing: 0.4, lean: 4 },
  fistBump: { height: 0.55, spacing: 0.44, lean: 6 },
  handOver: { height: 0.52, spacing: 0.46, lean: 8 }
};
function NS(t, e, n) {
  return Bo[t].spacing * Math.min(e.height, n.height);
}
const dh = 0.075;
function DS(t, e, n, s = {}) {
  const o = Bo[t];
  if (!o) throw new Error(`meetHands: unknown meeting '${t}' (one of ${Object.keys(Bo).join(", ")})`);
  const [i, r] = e.x <= n.x ? [e, n] : [n, e], a = s.view === "side", l = Math.min(i.character.height, r.character.height), c = { x: (i.x + r.x) / 2, y: -(s.height ?? o.height) * l }, h = (m, b) => {
    const k = b ? a ? 1 : 0.62 : a ? 3 : 3.38;
    let w = { ...ht, ...m.pose, turn: k, lean: (m.pose?.lean ?? 0) + o.lean };
    const y = b ? 1 : -1, S = ($, v, x) => {
      w = Re(m.character, w, $, { x: c.x + v - m.x, y: c.y, depth: x });
    };
    if (t === "handOver") {
      const $ = dh * l;
      S("arm.left", -y * $ * 0.9, $), S("arm.right", -y * $ * 0.9, -$);
    } else
      S("arm.right", 0, 0);
    return t === "fistBump" && (w = { ...w, "hand.right.index.curl": 1, "hand.right.middle.curl": 1, "hand.right.ring.curl": 1, "hand.right.pinky.curl": 1 }), w;
  }, u = h(i, !0), f = h(r, !1), d = 0.03 * l, g = (m, b) => {
    const k = ae(m.character, b), w = t === "handOver" ? ["hand.left", "hand.right"] : ["hand.right"], y = t === "handOver" ? dh * l + d : d;
    return w.every((S) => Math.abs(k.points[S].y - c.y) < d && Math.abs(k.points[S].x + m.x - c.x) < y);
  }, p = g(i, u) && g(r, f);
  return e.x <= n.x ? { a: u, b: f, point: c, reached: p } : { a: f, b: u, point: c, reached: p };
}
const Ur = { spacing: 0.3, lean: 10, tilt: 8 };
function BS(t, e) {
  return Ur.spacing * Math.min(t.height, e.height);
}
function zS(t, e, n = {}) {
  const [s, o] = t.x <= e.x ? [t, e] : [e, t], i = n.view === "side", r = Math.min(s.character.height, o.character.height), a = (g, p, m) => ({
    over: { x: p.x - m * 0.02 * r - g.x, y: -0.72 * r, depth: -0.08 * r },
    round: { x: p.x - m * 0.04 * r - g.x, y: -0.5 * r, depth: 0.06 * r }
  }), l = (g, p, m) => {
    const b = m ? i ? 1 : 0.62 : i ? 3 : 3.38, k = m ? 1 : -1;
    let w = { ...ht, ...g.pose, turn: b, lean: (g.pose?.lean ?? 0) + Ur.lean, "head.tilt": (g.pose?.["head.tilt"] ?? 0) + k * Ur.tilt };
    const { over: y, round: S } = a(g, p, k);
    return w = Re(g.character, w, "arm.right", y), w = Re(g.character, w, "arm.left", S), w;
  }, c = l(s, o, !0), h = l(o, s, !1), u = 0.05 * r, f = (g, p, m, b) => {
    const k = ae(g.character, b).points, { over: w, round: y } = a(g, p, m);
    return Math.hypot(k["hand.right"].x - w.x, k["hand.right"].y - w.y) < u && Math.hypot(k["hand.left"].x - y.x, k["hand.left"].y - y.y) < u;
  }, d = f(s, o, 1, c) && f(o, s, -1, h);
  return t.x <= e.x ? { a: c, b: h, reached: d } : { a: h, b: c, reached: d };
}
const Tn = { spacing: 0.32, low: 0.3, high: 0.5, helperLean: 40, helperBend: 16 };
function qS(t, e) {
  return Tn.spacing * Math.min(t.height, e.height);
}
function YS(t, e, n, s = {}) {
  const o = Math.max(0, Math.min(1, n)), i = s.view === "side", r = t.x <= e.x, a = Math.min(t.character.height, e.character.height), l = { x: (t.x + e.x) / 2, y: -(Tn.low + (Tn.high - Tn.low) * o) * a }, c = (m) => m ? i ? 1 : 0.62 : i ? 3 : 3.38;
  let h = { ...ht, ...t.pose, turn: c(r), lean: (t.pose?.lean ?? 0) + Tn.helperLean * (1 - o) + 4, bend: (t.pose?.bend ?? 0) + Tn.helperBend * (1 - o), "head.nod": 18 * (1 - o) };
  h = Re(t.character, h, "arm.right", { x: l.x - t.x, y: l.y });
  const u = { ...fe.sitFloor, ...e.pose, turn: c(!r) }, f = { ...ht, ...e.pose, turn: c(!r) };
  let d = cf(u, f, o);
  d = Re(e.character, d, "arm.right", { x: l.x - e.x, y: l.y });
  const g = 0.04 * a, p = (m, b) => {
    const k = ae(m.character, b).points["hand.right"];
    return Math.hypot(k.x + m.x - l.x, k.y - l.y) < g;
  };
  return { helper: h, sitter: d, point: l, reached: p(t, h) && p(e, d) };
}
const ph = Object.freeze({
  everyday: Object.freeze({ shirt: "#bc7050", trousers: "#495a67", sleeves: "short", bottom: "trousers", collar: !1, tie: null }),
  formal: Object.freeze({ top: "shirt", shirt: "#f4ede2", trousers: "#394653", sleeves: "long", bottom: "trousers", trouserStyle: "plain", collar: !0, tie: "#804453" }),
  casual: Object.freeze({ top: "tshirt", shirt: "#648a83", trousers: "#426683", sleeves: "short", bottom: "trousers", trouserStyle: "jeans", collar: !1, tie: null })
});
function KS(t, e = {}) {
  if (!Object.prototype.hasOwnProperty.call(ph, t)) throw new Error(`outfitPreset: unknown category '${t}'`);
  const n = { ...ph[t], ...e };
  return e.top && e.top !== "shirt" && (n.collar = e.collar ?? !1, n.tie = e.tie ?? null), n.top === "dress" && (n.bottom = "skirt"), n;
}
const J2 = 0.7, Z2 = 50, Q2 = 1.2, tk = 0.8, ek = 3, nk = 30, sk = 0.8, ok = 0.6, Qi = (t, e) => Math.max(-e, Math.min(e, t)), ik = ["hair.swing", "hair.trail", "hair.lift"];
function rk(t, e) {
  const n = e.start ?? 0, s = e.amount ?? 1, o = Math.max(1e-6, e.headRadius);
  let i = NaN, r = { x: 0, y: 0, turn: 0 };
  const a = (d) => (d !== i && (r = t(d), i = d), r), l = (d) => {
    const g = a(d);
    return g.turn * 90 + (g.headTurn ?? 0);
  }, c = { start: n, end: e.end, step: e.step, stiffness: e.stiffness ?? 70, damping: e.damping ?? 6 }, h = io(l, c), u = io((d) => a(d).x, c), f = io((d) => a(d).y, c);
  return h.map((d, g) => {
    const p = a(d.time), m = d.value - l(d.time), b = u[g].value - p.x - (e.wind ?? 0) * J2 * o, k = f[g].value - p.y, w = Math.sin(p.turn * Math.PI / 2), y = Math.cos(p.turn * Math.PI / 2), S = m * ek + b * y / o * nk, $ = -b * w / o * sk, v = -k / o * ok;
    return {
      time: d.time,
      swing: Qi(S * s, Z2),
      trail: Qi($ * s, Q2),
      lift: Qi(v * s, tk)
    };
  });
}
function jS(t, e) {
  if (t.length === 0) return { "hair.swing": 0, "hair.trail": 0, "hair.lift": 0 };
  if (e <= t[0].time) return gh(t[0]);
  if (e >= t[t.length - 1].time) return gh(t[t.length - 1]);
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
const gh = (t) => ({ "hair.swing": t.swing, "hair.trail": t.trail, "hair.lift": t.lift }), yn = 16, ak = 1500;
function XS(t, e, n, s = {}) {
  const o = n.head.hair;
  if (!o || !Ab(o)) return [];
  const i = e.filter((k) => k.target === t), r = i.reduce((k, w) => w.keyframes.reduce((y, S) => Math.max(y, S.time), k), 0), a = ht, l = /* @__PURE__ */ new Set(["x", "y", "turn", "head.turn"]), c = new _t({ id: `${t}-hair-follow`, tracks: i.filter((k) => l.has(k.property)) }), h = (k, w, y) => {
    const S = c.getStateAtTime(k).values.get(t)?.get(w);
    return typeof S == "number" ? S : y;
  }, u = new _t({ id: `${t}-hair-pose`, tracks: i }), f = (k) => u.getStateAtTime(k).values.get(t), d = /* @__PURE__ */ new Map(), g = (k) => {
    const w = Math.round(k / yn);
    let y = d.get(w);
    if (!y) {
      const S = {};
      for (const [v, x] of f(w * yn) ?? []) S[v] = x;
      const $ = ae(n, Ca(S, a, s.gaits)).head.center;
      d.set(w, y = { x: $.x, y: $.y });
    }
    return y;
  }, p = (k) => {
    const w = Math.floor(k / yn), y = k / yn - w, S = g(w * yn), $ = g((w + 1) * yn);
    return { x: S.x + ($.x - S.x) * y, y: S.y + ($.y - S.y) * y };
  }, m = rk(
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
      end: r + (s.settle ?? ak),
      headRadius: ae(n, ht).head.rx,
      step: s.step,
      stiffness: s.stiffness,
      damping: s.damping,
      amount: s.amount,
      wind: s.wind
    }
  ), b = [];
  for (const k of ik) {
    const w = k.slice(5);
    let y = m.map(($) => ({ time: $.time, value: $[w] }));
    if (y.every(($) => Math.abs($.value) < 1e-3)) continue;
    const S = i.find(($) => $.property === k);
    if (S) {
      const $ = new _t({ id: `${t}-${k}-own`, tracks: [S] }), v = (x) => Number($.getStateAtTime(x).values.get(t)?.get(k) ?? 0);
      y = y.map((x) => ({ time: x.time, value: x.value + v(x.time) }));
    }
    b.push({ id: `${t}-${k}`, target: t, property: k, keyframes: y });
  }
  return b;
}
const Hn = {
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
function Ff(t) {
  if (t === void 0) return Hn.full;
  if (typeof t == "string") return Hn[t];
  const { base: e, ...n } = t;
  return { ...Hn[e ?? "full"], ...n };
}
const Gr = 160, lk = 120, ck = 700, tr = 60, hk = 90, Zs = 3200, Cn = 1, Ue = 1e-6;
function Ka(t, e, n = {}) {
  const s = Ff(n.style), o = n.seed ?? 1, i = {};
  if (t.length === 0) return i;
  const r = Object.keys(t[0].pose).filter((u) => t.some((f) => Math.abs(f.pose[u] - t[0].pose[u]) > Ue));
  for (const u of r) i[u] = uk(u, t, e, s, o);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = fk(t, e, s, o, t[0].pose[a]);
    u.length > 0 && (i[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = dk(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (i[h] = u);
  }
  return i;
}
function uk(t, e, n, s, o) {
  const i = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = i ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (d) => {
    const g = (e[d].time - e[d - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (d, g, p) => {
    const m = h[h.length - 1];
    if (d <= m.time + Cn) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: d, value: g, ...p ? { easing: p } : {} });
  };
  let f = e[0].pose[t];
  for (let d = 1; d < e.length; d++) {
    const g = e[d], p = e[d - 1].pose[t], m = g.pose[t], b = m - p, k = h[h.length - 1].time, w = g.act !== !1;
    if (Math.abs(b) <= Ue) {
      const A = g.time + (w ? c(d) : 0);
      if (d === e.length - 1)
        Math.abs(f - m) > Ue && u(Math.max(A, k + Gr), m, "ease-in-out"), f = m;
      else if (w && a && s.drift > 0 && n.drift.includes(t) && A - k >= ck) {
        const E = ne(`${o}:${t}:${d}`) % 2 === 0 ? 1 : -1;
        f = m + E * s.drift * r, u(A, f, "ease-in-out");
      }
      continue;
    }
    if (!w) {
      u(e[d - 1].time, f), u(g.time, m, g.easing), f = m;
      continue;
    }
    const y = c(d), S = Math.max(e[d - 1].time + y, k);
    let $ = g.time + y;
    i && s.eyeDart > 0 && ($ = Math.min($, S + s.eyeDart));
    const v = $ - S;
    if (v <= Cn) {
      u(g.time, m, g.easing), f = m;
      continue;
    }
    u(S, f);
    const x = Math.sign(b);
    if (a && s.anticipation > 0 && r > 0 && v >= Gr) {
      const A = f - x * Math.min(Math.abs(b) * s.anticipation, r), E = S + v * s.anticipationTime;
      u(E, A, "ease-in-out"), s.hold > 0 && u(E + v * s.hold, A);
    }
    const M = d + 1 < e.length ? e[d + 1].time - g.time : 1 / 0, T = Math.min(s.settle, M / 2);
    if (a && s.overshoot > 0 && r > 0 && v >= lk && T > Cn) {
      const A = Math.min(Math.abs(b) * s.overshoot, r);
      u($, m + x * A, g.easing ?? s.actionEase), u($ + T, m, s.settleEase);
    } else
      u($, m, g.easing ?? s.actionEase);
    f = m;
  }
  return h;
}
function fk(t, e, n, s, o) {
  const i = [], r = tr + hk;
  for (let d = 1; d < t.length; d++) {
    const g = t[d - 1].pose, p = t[d].pose;
    Object.entries(e.headTurns).some(([b, k]) => Math.abs((p[b] ?? 0) - (g[b] ?? 0)) > k) && t[d].act !== !1 && i.push(Math.max(t[0].time, t[d - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...i];
  let h = a + Zs * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < Zs / 2) || i.push(h);
    const g = (ne(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (Zs * 0.66);
    h += Zs + g;
  }
  i.sort((d, g) => d - g);
  const f = [{ time: a, value: o }];
  for (const d of i) {
    const g = f[f.length - 1].time;
    d + tr <= g + Cn || (d > g + Cn && f.push({ time: d, value: o }), f.push({ time: d + tr, value: 1, easing: "ease-in" }), f.push({ time: d + r, value: o, easing: "ease-out" }));
  }
  return f.length > 1 ? f : [];
}
function dk(t, e, n, s) {
  const o = n * (1 - 0.18 * s), i = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + Cn || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, f = t[l].time, d = f - u;
    if (!(d < Gr || t[l].act === !1)) {
      if (c <= Ue && h > Ue)
        a(u, n), a(u + d * 0.2, o, "ease-out"), a(u + d * 0.45, i, "ease-out"), a(f, n, "ease-in-out");
      else if (c > Ue && h <= Ue) {
        const g = l + 1 < t.length ? t[l + 1].time - f : 400;
        a(u + d * 0.5, n), a(f - Math.min(60, d * 0.15), i, "ease-in"), a(f, o, "ease-out"), a(f + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const pk = {
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
function gk(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function mk() {
  const t = {}, e = {};
  for (const n of Object.keys(ht)) {
    const s = gk(n);
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
const yk = mk();
function Nf(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function bk(t, e, n = {}) {
  const s = ka(e), o = e.map((i, r) => ({ time: i.time, pose: { ...s[r] }, easing: i.easing, act: i.act }));
  return Nf(t, Ka(o, n.rig ?? pk, n));
}
function wk(t, e, n = {}) {
  const s = n.rest ?? ht, o = uf(e, s), i = e.map((r, a) => ({ time: r.time, pose: { ...s, ...o[a] }, easing: r.easing, act: r.act }));
  return Nf(t, Ka(i, n.rig ?? yk, n));
}
const mh = vt.shocked, kk = vt.scared, on = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...mh, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...vt.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...mh, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...vt.angry, lookX: 1 }, easing: "ease-out" },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, headTilt: 6, leftShoulder: 30, rightShoulder: 60, leftHip: 30, leftKnee: -30, rightHip: -20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down to the ground: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { rise: 0, stretch: 0.7, bend: 14, leftShoulder: 75, rightShoulder: 75, leftHip: 20, rightHip: 20, leftKnee: 35, rightKnee: 35 }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, leftShoulder: t.leftShoulder, rightShoulder: t.rightShoulder }, easing: "ease-out" },
    { after: 460, pose: { rise: 0, stretch: t.stretch, bend: t.bend, leftHip: ct.leftHip, rightHip: ct.rightHip, leftKnee: 0, rightKnee: 0 }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: small, fast shakes with wide eyes, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...kk, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...ee.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function yh(t, e) {
  const n = typeof e.from == "string" ? ee[e.from] : e.from ?? ct;
  return Df(on[t](n), { ...e, from: n });
}
function Df(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((o) => (s = { ...s, ...o.pose }, { time: e.at + o.after * n, pose: s, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
function zo(t, e = 1) {
  const n = on[t](ct);
  return n[n.length - 1].after * e;
}
function vk(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), o = n.spacing ?? 5, i = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * o, c = Math.floor(Math.abs(l) / Math.max(o, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], f = e[h], d = f.x - u.x, g = f.y - u.y, p = Math.hypot(d, g) || 1, m = -g / p, b = d / p, k = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - k), t.lineWidth = i * (1 - k * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + b * l), t.lineTo(f.x + m * l, f.y + b * l), t.stroke();
    }
  }
  t.restore();
}
const Mk = {
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
function US(t, e, n, s, o = {}) {
  const i = n.stateAt;
  if (!i) return;
  const r = o.length ?? 120, a = Math.max(2, Math.round(o.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let d = 0; d < a; d++) {
    const g = l + (n.time - l) * d / (a - 1);
    c.push(vu(e, { time: g, state: i(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (o.threshold ?? 1.2) * h, f = (o.parts ?? ["hands", "toes", "head"]).flatMap((d) => Mk[d]);
  for (const d of f) {
    const g = c.map(d.at);
    let p = 0;
    for (let k = 1; k < g.length; k++) p += Math.hypot(g[k].x - g[k - 1].x, g[k].y - g[k - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const b = Math.min(1, (m - u) / (u * 0.5));
    vk(t, g, { ...o, opacity: (o.opacity ?? 0.7) * b, spacing: o.spacing ?? h * 0.02 });
  }
}
function xk(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, o * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = ne(`${i}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * o * 0.3 * r, u = e.y - o * (0.06 + 0.12 * l) * r + Math.abs(c) * o * 0.03, f = o * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, f, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function GS(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, o * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < i; a++) {
    const l = -Math.PI / 2 + (a - (i - 1) / 2) * Math.PI / (i + 1), c = o * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    Sk(t, h, u, o * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function Sk(t, e, n, s, o) {
  t.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.45, a = o + i * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    i === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const mi = {
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
function Bf(t = {}) {
  return [
    ...Object.keys(Yt),
    ...Object.keys(ee),
    ...Object.keys(on),
    ...Object.keys(mi),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function zf(t = {}) {
  const e = new Set(Bf()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function qf(t = {}) {
  const e = {};
  for (const n of Object.keys(Yt)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(ee)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(on)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(mi)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const Vr = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], Tk = {
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
}, Qs = ["viewer", "ahead", "back"], Fe = (t) => typeof t == "number" && Number.isFinite(t);
function qo(t, e = {}) {
  const n = zf(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = Bf(e), o = (l) => l in Yt || l in (e.gaits ?? {}), i = Object.keys(vt), r = Object.keys(ct);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), u = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const f = l;
    for (const p of Object.keys(f))
      Vr.includes(p) || h(ft("beat field", p, Vr, Tk[p.toLowerCase()]));
    const d = f.do;
    if (d === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof d != "string" || !s.includes(d)) {
      h(ft("action", d, s));
      return;
    }
    const g = mi[d] ?? e.actions?.[d];
    for (const p of g?.needs ?? [])
      f[p] === void 0 && h(`\`${d}\` needs \`${p}\`.`);
    if (o(d) && f.to === void 0 && u(`\`${d}\` without \`to\` walks nowhere.`), d === "leap" && f.to === void 0 && f.onto === void 0 && u("`leap` without `to` or `onto` jumps on the spot."), f.mood !== void 0 && (typeof f.mood != "string" || !i.includes(f.mood)) && h(ft("mood", f.mood, i)), f.pose !== void 0)
      if (!f.pose || typeof f.pose != "object" || Array.isArray(f.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(f.pose))
          r.includes(p) ? Fe(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(ft("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = f[p];
      m !== void 0 && !(Fe(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    Fe(f.at) && (f.at < a && u(`\`at\` ${f.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = f.at);
    for (const p of ["to", "onto"]) {
      const m = f[p];
      m !== void 0 && !Fe(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (f.toward !== void 0 && !Fe(f.toward) && !Qs.includes(f.toward) && h(`\`toward\` is a scene x or one of ${Qs.join(", ")}${typeof f.toward == "string" && bo(f.toward, Qs) ? ` (did you mean "${bo(f.toward, Qs)}"?)` : ""} (got ${JSON.stringify(f.toward)}).`), f.say !== void 0 && typeof f.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(f.say)}).`), f.target !== void 0) {
      const p = f.target;
      (!p || typeof p != "object" || !Fe(p.x) || !Fe(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function bh(t, e = {}, n = "scriptTracks") {
  const s = qo(t, e).filter((o) => o.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((o) => `  ${o.beat >= 0 ? `beat ${o.beat}: ` : ""}${o.message}`).join(`
`)}`);
}
c1(qf);
function VS(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function JS(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const wh = 8;
function ja(t, e = {}, n = 0) {
  if (n > wh) throw new Error(`scriptTracks: custom actions nest more than ${wh} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const o = e[s.do];
    if (!o || !("beats" in o)) return [s];
    const i = o.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return ja(i, e, n + 1);
  });
}
function Ek(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const kh = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, Ak = 450, $k = 2.4, Pk = 160, vh = 2.5, Ik = 200, Ok = 340, _k = 1.1, Mh = [380, 900], Hk = 0.35, to = 300, er = 150, Ck = 260, Rk = 1.2, nr = 160, xh = 400, ns = 300, Lk = 450, Sh = 500, sr = 350, Th = 150, Wk = 120, or = 180, Eh = 420, Fk = 300, Ah = 300, Nk = 140, ir = 150, $h = 450, Dk = 450, rr = 150, Ph = 350, Ih = 400, Bk = 12, zk = 600, Oh = 90, _h = 400, qk = 200, Yk = 0.09, Hh = 350, ye = 450, ar = 1200, Kk = 700, bn = 320, be = 220, jk = 65, Xk = 700, Ch = (t) => t in on, Uk = (t) => t in ee;
function Gk(t) {
  return Math.max(Xk, Array.from(t).length * jk);
}
function Xa(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  bh(e, s);
  const o = n.gait ?? "walk", i = ja(e, n.actions).map((I) => I.do === "go" ? { ...I, do: o } : I);
  bh(i, s, "scriptTracks (after expanding custom actions)");
  const r = (I) => Yt[I] ?? n.gaits?.[I], a = (I) => kh[I] ?? n.gaits?.[I]?.cycle ?? 1e3, l = (I) => {
    const N = n.actions?.[I];
    return N && "steps" in N ? N : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, u = n.height ?? 300;
  let f = c, d = h, g = n.facing ?? 1, p = n.start ?? ct, m = 0, b = 0;
  const k = [{ time: 0, pose: p }], w = [{ time: 0, value: 0 }], y = [{ time: 0, value: 0 }], S = [{ time: 0, value: 0 }], $ = [{ time: 0, value: 0 }], v = [{ time: 0, value: "walk" }], x = [{ time: 0, value: g }], M = [], T = [], A = [], E = (I, N, nt, H) => {
    p = { ...p, ...N }, nt && (p = qe(p, nt)), k.push({ time: I, pose: p, ...H === !1 ? { act: H } : {} });
  }, P = (I, N, nt) => (E(I + bn / 2, { turn: 0 }, nt), x.push({ time: I + bn / 2, value: g }, { time: I + bn / 2 + 1, value: N }), g = N, E(I + bn, { turn: 1 }), I + bn), O = (I) => I < f ? -1 : 1, L = (I, N, nt) => O(N) !== g ? P(I, O(N), nt) : I, q = (I, N, nt, H = "arm") => {
    const R = H === "arm", z = he({ ...I, ...R ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: u, facing: g }), U = R ? z.shoulders.right : z.hip, W = R ? z.elbows.right : z.knees.right, F = (K, Z) => Math.atan2(g * K, Z) * 180 / Math.PI, V = ((F(N - (f + U.x), nt - (d + U.y)) - F(W.x - U.x, W.y - U.y)) % 360 + 360) % 360;
    return V > 270 ? V - 360 : V;
  }, G = (I, N, nt, H) => {
    const R = H === "arm", z = he({ ...I, ...R ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: u, facing: g }), U = R ? z.shoulders.right : z.hip, W = R ? { x: (z.hands.right.x + z.fingertips.right.x) / 2, y: (z.hands.right.y + z.fingertips.right.y) / 2 } : z.feet.right, F = Math.hypot(W.x - U.x, W.y - U.y) * ((R ? n.reach?.arm : n.reach?.leg) ?? 1), D = nt - (d + U.y), V = Math.abs(D) < F ? Math.sqrt(F * F - D * D) : F * 0.1;
    return N - U.x - g * V;
  }, Q = (I) => {
    const N = he(I, { height: u, facing: g });
    return { x: f + (N.hands.right.x + N.fingertips.right.x) / 2, y: d + (N.hands.right.y + N.fingertips.right.y) / 2 };
  }, j = (I, N, nt) => {
    const H = { ...I, rightWrist: 0, rightElbow: 0, rightShoulder: q(I, N, nt) }, R = he(H, { height: u, facing: g }), z = { x: f + R.shoulders.right.x, y: d + R.shoulders.right.y }, U = { x: f + R.elbows.right.x, y: d + R.elbows.right.y }, W = Q(H), F = Math.hypot(U.x - z.x, U.y - z.y), D = Math.hypot(W.x - U.x, W.y - U.y), V = Math.min(F + D - 0.01, Math.max(Math.abs(F - D) + 0.01, Math.hypot(N - z.x, nt - z.y))), K = (ot) => ot * 180 / Math.PI, Z = K(Math.acos((F * F + V * V - D * D) / (2 * F * V))), tt = 180 - K(Math.acos((F * F + D * D - V * V) / (2 * F * D)));
    let _ = { rightShoulder: H.rightShoulder, rightElbow: 0 }, X = 1 / 0;
    for (const ot of [1, -1])
      for (const rt of [1, -1]) {
        const st = { rightShoulder: H.rightShoulder + ot * Z, rightElbow: rt * tt }, at = { ...I, rightWrist: 0, ...st }, et = Q(at), it = Math.hypot(et.x - N, et.y - nt) - he(at, { height: u, facing: g }).elbows.right.y * 1e-3;
        it < X && (X = it, _ = st);
      }
    return _;
  }, C = (I, N, nt) => Math.abs(N - f) < 2 ? I : (w.push({ time: I, value: f - c }, { time: I + nt, value: N - c, easing: "ease-in-out" }), f = N, I + nt);
  for (const I of i) {
    const N = Math.max(I.at ?? b, b === 0 ? 0 : k[k.length - 1].time);
    let nt = N, H, R;
    const z = I.pose ?? {}, U = l(I.do);
    if (r(I.do)) {
      const W = I.to ?? f, F = W === f ? g : O(W);
      let D = N;
      F !== g ? D = P(N, F, I.mood) : p.turn < 1 ? (D = N + be, E(D, { turn: 1, ...z }, I.mood)) : (I.mood || I.pose) && E(N + be, z, I.mood);
      const K = Math.abs(W - f) / Pr(r(I.do), u), Z = I.for ?? Math.max(be * 2, K * a(I.do)), tt = D + Z;
      v.push({ time: D, value: I.do }), $.push({ time: D, value: 0 }, { time: D + be, value: 1, easing: "ease-out" }), $.push({ time: tt - be, value: 1 }, { time: tt, value: 0, easing: "ease-in" }), S.push({ time: D, value: m }, { time: tt, value: m + K }), w.push({ time: D, value: f - c }, { time: tt, value: W - c }), m += K, f = W, E(tt, {}), nt = tt;
    } else if (I.do === "zip") {
      const W = I.to ?? f, F = W === f ? g : O(W);
      let D = N;
      F !== g ? D = P(N, F, I.mood) : p.turn < 1 && (D = N + be, E(D, { turn: 1 }, I.mood));
      const V = yh("windUp", { at: D, from: I.mood ? qe(p, I.mood) : p });
      k.push(...V), p = V[V.length - 1].pose;
      const K = D + zo("windUp"), Z = K + Ak, tt = Z + Math.max(Pk, Math.abs(W - f) / $k);
      v.push({ time: K, value: "run" }), $.push({ time: K, value: 0 }, { time: K + 80, value: 1, easing: "ease-out" }, { time: tt, value: 1 }, { time: tt + 120, value: 0 }), S.push({ time: K, value: m }, { time: Z, value: m + vh, easing: "ease-in" }), m += vh + (tt - Z) / kh.run * 1.5, S.push({ time: tt, value: m }), w.push({ time: Z, value: f - c }, { time: tt, value: W - c, easing: "ease-in" }), A.push({ kind: "dust", time: Z, x: f, y: d, length: 900 }), f = W, E(tt, {}), nt = tt;
    } else if (I.do === "leap") {
      const W = I.to ?? f, F = I.onto ?? d;
      let D = W === f ? N : L(N, W, I.mood);
      p.turn < 1 && (D += be, E(D, { turn: 1 }, I.mood));
      const V = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      E(D + Ik, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...V }, I.mood, !1);
      const K = D + Ok;
      E(K - 40, { stretch: 0.72 }, void 0, !1), E(K, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const Z = Math.hypot(W - f, F - d), tt = I.for ?? Math.min(Mh[1], Math.max(Mh[0], 300 + Z * _k)), _ = Math.min(d, F) - Hk * u, X = Math.sqrt(d - _), ot = Math.sqrt(F - _), rt = K + tt * X / (X + ot), st = K + tt;
      E(rt, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), E(st, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), E(st + 180, { stretch: 1.05, bend: -3 }, void 0, !1), E(st + 340, { stretch: 1, bend: 0, leftHip: ct.leftHip, rightHip: ct.rightHip, leftShoulder: ct.leftShoulder, rightShoulder: ct.rightShoulder, leftElbow: ct.leftElbow, rightElbow: ct.rightElbow }, void 0, !1), w.push({ time: K, value: f - c }, { time: st, value: W - c }), y.push(
        { time: K, value: d - h },
        { time: rt, value: _ - h, easing: "ease-out-quad" },
        { time: st, value: F - h, easing: "ease-in-quad" }
      ), f = W, d = F, A.push({ kind: "dust", time: st, x: f, y: d, length: 500 }), nt = st + 340, H = st;
    } else if (I.do === "point" && I.target) {
      const W = I.target, F = L(N, W.x, I.mood), D = { ...p, ...I.mood ? vt[I.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...z }, V = he(D, { height: u, facing: g }).head.center, K = Math.abs(W.x - (f + V.x)), Z = W.y - (d + V.y), tt = F + ye;
      E(tt, { ...D, rightShoulder: q(D, W.x, W.y), lookX: 1, lookY: Vk(Z / Math.max(1, Math.hypot(K, Z))) * 0.8 }), nt = tt + (I.for ?? ar), H = tt, R = nt;
    } else if (I.do === "swipe") {
      const W = I.target ?? { x: f + g * u * 0.5, y: d - u * 0.6 }, F = O(W.x), D = L(N, W.x, I.mood), V = F === 1 ? W.left ?? W.x : W.right ?? W.x, K = F === 1 ? W.right ?? W.x : W.left ?? W.x, Z = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...z };
      E(D + to, { ...Z, rightShoulder: q(Z, f - g * u * 0.3, d - u * 1.1) }, I.mood, !1);
      const tt = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, _ = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      C(D, G(tt, V, W.y, "arm"), to + er), E(D + to + er, { lean: -12 }, void 0, !1);
      const X = D + to + er + 80;
      E(X, { ...tt, rightShoulder: q(tt, V, W.y) }, void 0, !1);
      const ot = X + (I.for ?? Math.max(Ck, Math.abs(K - V) / Rk));
      w.push({ time: X, value: f - c }), f = G(_, K, W.y, "arm"), w.push({ time: ot, value: f - c }), E(ot, { ..._, rightShoulder: q(_, K, W.y) }, void 0, !1), E(ot + nr, { lean: 16, bend: 14, rightShoulder: q(p, K + F * u * 0.4, W.y + u * 0.25) }, void 0, !1), E(ot + nr + xh, { lean: 0, bend: 0, rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow }), nt = ot + nr + xh, H = X, R = ot;
    } else if (I.do === "grab" && I.target) {
      const W = I.target, F = L(N, W.x, I.mood), D = W.y > d - u * 0.5, V = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: D ? 35 : 0,
        lean: D ? 12 : 0,
        stretch: D ? 0.75 : 1,
        lookX: 1,
        lookY: D ? 0.8 : 0,
        ...z
      }, Z = C(F, G(V, W.x, W.y, "arm"), ns) + Lk;
      E(Z, { ...V, rightShoulder: q(V, W.x, W.y) }, I.mood, !1), E(Z + 120, {}, void 0, !1), E(Z + Sh, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), nt = Z + Sh + 150, H = Z;
    } else if (I.do === "throw") {
      const W = I.target?.x ?? I.to ?? f + g * u, F = L(N, W, I.mood), D = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...z };
      E(F + sr, { ...D, rightShoulder: q(D, f - g * u * 0.4, d - u * 1.05) }, I.mood, !1), E(F + sr + Th, { lean: -14 }, void 0, !1);
      const V = F + sr + Th + Wk, K = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      k.push({ time: V, pose: p = { ...K, rightShoulder: q(K, f + g * u, d - u * 1.1) }, easing: "ease-in", act: !1 }), E(V + or, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), E(V + or + Eh, { lean: 0, bend: 0, rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow, lookY: 0 }), nt = V + or + Eh, H = V, R = V;
    } else if (I.do === "kick" && I.target) {
      const W = I.target, F = L(N, W.x, I.mood), D = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, V = C(F, G(D, W.x, W.y, "leg"), Fk), K = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      E(V + Ah, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...K, ...z }, I.mood, !1);
      const Z = V + Ah + Nk, tt = q(D, W.x, W.y, "leg");
      k.push({ time: Z, pose: p = { ...p, ...D, rightHip: tt }, easing: "ease-in", act: !1 }), E(Z + ir, { lean: -15, rightHip: tt + 20 }, void 0, !1), E(Z + ir + $h, {
        lean: 0,
        bend: 0,
        rightHip: ct.rightHip,
        rightKnee: 0,
        leftShoulder: ct.leftShoulder,
        rightShoulder: ct.rightShoulder,
        leftElbow: ct.leftElbow,
        rightElbow: ct.rightElbow,
        lookY: 0
      }), nt = Z + ir + $h, H = Z;
    } else if (I.do === "put" && I.target) {
      const W = I.target, F = L(N, W.x, I.mood), D = W.y > d - u * 0.5, V = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: D ? 35 : 0, lean: D ? 12 : 0, stretch: D ? 0.75 : 1, lookX: 1, lookY: D ? 0.8 : 0, ...z }, Z = C(F, G(V, W.x, W.y, "arm"), ns) + Dk;
      E(Z, { ...V, rightShoulder: q(V, W.x, W.y) }, I.mood, !1), E(Z + rr, {}, void 0, !1), E(Z + rr + Ph, { bend: 0, lean: 0, stretch: 1, rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow, lookY: 0 }), nt = Z + rr + Ph, H = Z;
    } else if (I.do === "write" && I.target) {
      const W = I.target, F = W.left ?? W.x, D = W.right ?? W.x, V = L(N, (F + D) / 2, I.mood), K = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...vt.thinking, lookX: 1, lookY: 0, ...z }, Z = (et) => G(K, et, W.y, "arm") + g * u * 0.08, tt = (et) => {
        const J = Q({ ...K, ...j(K, et, W.y), rightWrist: 0 });
        return Math.hypot(J.x - et, J.y - W.y) < 2;
      }, _ = g === 1 ? F : D, X = C(V, Z((F + D) / 2), ns), ot = !tt(F) || !tt(D), rt = ot ? C(X, Z(F), ns) + Ih : X + Ih;
      E(rt, { ...K, ...j(K, ot ? F : _, W.y) }, I.mood, !1);
      const st = I.for ?? Math.max(zk, Math.abs(D - F) * Bk);
      ot && w.push({ time: rt, value: f - c });
      for (let et = Oh, J = 0; et <= st; et += Oh, J++) {
        const it = F + (D - F) * Math.min(et, st) / st;
        ot && (f = Z(it), w.push({ time: rt + et, value: f - c }));
        const lt = (J % 2 === 0 ? -1 : 1) * u * 0.02;
        E(rt + et, j(K, it, W.y + lt), void 0, !1);
      }
      const at = rt + st;
      E(at, j(K, D, W.y), void 0, !1), E(at + _h, { rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow, ...vt.happy }), nt = at + _h, H = rt, R = at;
    } else if (I.do === "push" && I.target) {
      const W = I.target, F = I.to ?? W.x, D = L(N, f + (F >= W.x ? 1 : -1), I.mood), V = g === 1 ? W.left ?? W.x : W.right ?? W.x, K = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...z }, Z = G(K, V, W.y, "arm"), tt = C(D, Z + g * u * 0.06, ns), _ = j(K, V, W.y), X = { ...K, ..._, leftShoulder: -_.rightShoulder, leftElbow: -_.rightElbow }, ot = tt + qk;
      E(ot, X, I.mood, !1);
      const rt = Math.abs(F - W.x), st = ot + (I.for ?? Math.max(600, rt / Yk)), at = rt / Pr("shove", u);
      v.push({ time: ot, value: "shove" }), $.push({ time: ot, value: 0 }, { time: ot + be, value: 1, easing: "ease-out" }, { time: st - be, value: 1 }, { time: st, value: 0, easing: "ease-in" }), S.push({ time: ot, value: m }, { time: st, value: m + at }), m += at, w.push({ time: ot, value: f - c }, { time: st, value: f + (F - W.x) - c }), f += F - W.x, E(st, {}, void 0, !1), E(st + Hh, { lean: 0, bend: 0, rightShoulder: ct.rightShoulder, leftShoulder: ct.leftShoulder, rightElbow: ct.rightElbow, leftElbow: ct.leftElbow }), nt = st + Hh, H = ot, R = st;
    } else if (U) {
      const W = I.mood ? qe(p, I.mood) : p, F = U.steps(W, I), D = Df(F, { at: N, from: W });
      k.push(...D), p = D[D.length - 1].pose, nt = N + Math.max(Ek(F), I.for ?? 0);
    } else if (Ch(I.do)) {
      const W = yh(I.do, { at: N, from: I.mood ? qe(p, I.mood) : p });
      k.push(...W), p = W[W.length - 1].pose, nt = N + zo(I.do), I.do === "take" && A.push({ kind: "dust", time: N + 900, x: f, y: d, length: 500 }), I.do === "land" && A.push({ kind: "dust", time: N + 120, x: f, y: d, length: 500 });
    } else if (I.do === "look" || I.do === "face") {
      const W = I.toward ?? "viewer", F = I.for ?? Kk;
      if (W === "viewer") E(N + ye, { turn: 0, lookX: 0, lookY: 0, ...z }, I.mood);
      else if (W === "ahead") E(N + ye, { turn: I.do === "face" ? 1 : 0.6, lookX: 1, ...z }, I.mood);
      else if (W === "back") E(N + ye, { turn: 0.2, lookX: -1, ...z }, I.mood);
      else {
        const D = O(W);
        D !== g && I.do === "face" ? (P(N, D, I.mood), E(N + bn + 1, { lookX: 1, ...z })) : D !== g ? E(N + ye, { turn: 0.25, lookX: -1, ...z }, I.mood) : E(N + ye, { turn: I.do === "face" ? 1 : 0.6, lookX: 1, ...z }, I.mood);
      }
      nt = N + Math.max(F, ye);
    } else if (Uk(I.do) || I.do === "stand") {
      const W = I.do === "stand" ? n.rest ?? ct : ee[I.do], F = W.turn !== ct.turn ? W.turn : p.turn, D = I.mood ? vt[I.mood] : { lookX: p.lookX, lookY: p.lookY };
      E(N + ye, { ...W, turn: F, ...D, ...z }), nt = N + (I.for ?? ar);
    } else {
      const W = I.for ?? (I.say ? Gk(I.say) : ar);
      (I.mood || I.pose) && E(N + Math.min(ye, W / 2), z, I.mood), nt = N + W;
    }
    if (I.say) {
      const W = r(I.do) || Ch(I.do) || U ? N : N + Math.min(150, (nt - N) / 4), F = r(I.do) ? nt : Math.max(W + 200, nt - 100);
      M.push({ text: I.say, start: W, end: F }), I.do === "say" && Qk(k, p, W, F);
    }
    I.onto !== void 0 && I.do !== "leap" && I.onto !== d && (y.push({ time: N, value: d - h }, { time: nt, value: I.onto - h, easing: "ease-in-out" }), d = I.onto), nt > k[k.length - 1].time && k.push({ time: nt, pose: p }), T.push({ start: N, end: nt, ...H !== void 0 ? { contact: H } : {}, ...R !== void 0 ? { release: R } : {} }), b = nt;
  }
  const B = bk(t, Zk(k), n), Y = [
    { id: `${t}-x`, target: t, property: "x", keyframes: w },
    { id: `${t}-y`, target: t, property: "y", keyframes: y },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: S },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: $ },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: v },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: x }
  ].filter(
    (I) => I.keyframes.length > 1 || I.property === "x" || // Starting left is kept even if it never turns: a figure target faces right unless told.
    I.property === "facing" && I.keyframes[0].value === -1
  );
  return {
    tracks: [...za(t, B, M, { energy: n.energy }), ...Y],
    duration: b,
    lines: M,
    keys: k,
    beats: T,
    effects: A
  };
}
const Vk = (t) => Math.max(-1, Math.min(1, t)), Jk = 30;
function Zk(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < Jk ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function Qk(t, e, n, s) {
  const i = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !i.some((c) => Math.abs(c.time - l.time) < 60)), ...i), t.sort((l, c) => l.time - c.time);
}
function Yf(t, e, n) {
  const s = new _t({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), o = ku({ x: n.x, y: n.y, style: n.style, cast: n.cast }), i = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = vu(o, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[i], u = c.fingertips[i];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const ds = ["start", "contact", "release", "end"], t5 = ["surface", "edit", "anchor", "at", "until"], e5 = ["carry"], fo = (t) => !!t && typeof t == "object" && !Array.isArray(t) && "surface" in t && "anchor" in t, n5 = (t) => t.then === void 0 ? [] : Array.isArray(t.then) ? t.then : [t.then];
function ZS(t, e, n, s = {}) {
  const o = s5(n, e, s).filter((f) => f.level === "error");
  if (o.length > 0)
    throw new Error(`surfaceScript: ${o.length} problem(s) in the beats:
${o.map((f) => `  ${f.beat >= 0 ? `beat ${f.beat}: ` : ""}${f.message}`).join(`
`)}`);
  const i = n.map((f) => Kf(f, e)), r = Xa(t, i, s), a = o5(i, r.beats, s), l = s.ground ?? 0, c = (f) => s.ride === !1 ? f : Object.values(e).reduce((d, g) => g.ride(d, t, { ground: l }), f);
  n.forEach((f, d) => {
    for (const g of n5(f)) {
      const p = (y) => new Error(`surfaceScript: beat ${d} (${f.do}), ${g.edit} on ${g.surface}: ${y}`), m = (y, S) => {
        const $ = typeof y == "object" ? y.beat : d, v = (typeof y == "object" ? y.at : y) ?? S ?? "start", x = a[$][v];
        if (x === void 0) {
          const M = ds.filter((T) => a[$][T] !== void 0).join(", ");
          throw p(`beat ${$} (${n[$].do}) has no ${v} (it has ${M})`);
        }
        return x;
      }, b = e[g.surface], k = m(g.at ?? (a[d].contact !== void 0 ? "contact" : "start")), w = g.until === void 0 ? void 0 : m(g.until, "end");
      if (w !== void 0 && w < k) throw p(`it ends (${w} ms) before it starts (${k} ms)`);
      try {
        if (g.edit === "carry") {
          const S = b.piece(g.anchor), $ = Yf(t, c(r.tracks), {
            x: s.from ?? 0,
            y: l,
            style: s.figureStyle ?? (s.height ? { height: s.height } : void 0),
            cast: s,
            start: k,
            end: w
          });
          b.follow(S, $);
          continue;
        }
        const y = Object.fromEntries(Object.entries(g).filter(([S]) => !t5.includes(S)));
        b.edit(g.edit, g.anchor, { ...y, at: k, ...w !== void 0 ? { duration: w - k } : {} });
      } catch (y) {
        throw p(y.message);
      }
    }
  });
  const h = c(r.tracks), u = Object.entries(e).flatMap(([f, d]) => d.tracks(f));
  return { ...r, tracks: [...h, ...u], figureTracks: h };
}
function s5(t, e, n = {}) {
  if (!Array.isArray(t)) return qo(t, n);
  const s = [], o = Object.keys(e), i = (c, h, u) => {
    const f = typeof h == "string" ? e[h] : void 0;
    return f || s.push({ level: "error", beat: c, message: `${u}: ${ft("surface", h, o)}` }), f;
  }, r = (c, h, u, f) => {
    if (typeof u != "string") {
      s.push({ level: "error", beat: c, message: `${f}: \`anchor\` is a place name such as ${Object.keys(h.about.anchors).join(", ")} (got ${JSON.stringify(u)}).` });
      return;
    }
    try {
      h.anchor(u, 0);
    } catch (d) {
      s.push({ level: "error", beat: c, message: `${f}: ${d.message}` });
    }
  }, a = (c, h, u) => {
    const f = typeof h == "object" && h !== null ? h.at : h;
    if (typeof h == "object" && h !== null) {
      const d = h.beat;
      if ((typeof d != "number" || !Number.isInteger(d) || d < c || d >= t.length) && s.push({ level: "error", beat: c, message: `${u}: \`beat\` is the index of this beat or a later one, ${c} to ${t.length - 1} (got ${JSON.stringify(d)}).` }), f === void 0) return;
    }
    typeof f == "number" ? s.push({ level: "error", beat: c, message: `${u}: a cue starts at a moment of its beat (${ds.join(", ")}), not at ms; set the beat's own \`at\` to move it.` }) : (typeof f != "string" || !ds.includes(f)) && s.push({ level: "error", beat: c, message: `${u}: ${ft("moment", f, ds)}` });
  };
  t.forEach((c, h) => {
    if (!c || typeof c != "object" || Array.isArray(c)) return;
    const u = c;
    for (const d of ["target", "to", "onto"]) {
      if (!fo(u[d])) continue;
      const g = u[d], p = i(h, g.surface, `\`${d}\``);
      p && r(h, p, g.anchor, `\`${d}\``);
    }
    if (u.then === void 0) return;
    (Array.isArray(u.then) ? u.then : [u.then]).forEach((d) => {
      if (!d || typeof d != "object" || Array.isArray(d)) {
        s.push({ level: "error", beat: h, message: "`then` is a cue, { surface, edit, anchor, at?, until? }, or a list of them." });
        return;
      }
      const g = d, p = i(h, g.surface, "`then`");
      if (!p) return;
      const m = `\`then\` (${String(g.edit)} on ${String(g.surface)})`, b = [...Object.keys(p.about.edits), ...e5];
      if (typeof g.edit != "string" || !b.includes(g.edit)) {
        s.push({ level: "error", beat: h, message: `\`then\`: ${ft("edit", g.edit, b)}` });
        return;
      }
      for (const k of Array.isArray(g.anchor) ? g.anchor : [g.anchor]) r(h, p, k, m);
      g.edit === "carry" && typeof g.anchor != "string" && s.push({ level: "error", beat: h, message: `${m}: \`carry\` takes one anchor, the piece it carries.` }), g.edit === "carry" && g.until === void 0 && s.push({ level: "error", beat: h, message: `${m}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${h + 1}, at: 'release' }).` }), g.at !== void 0 && a(h, g.at, `${m} \`at\``), g.until !== void 0 && a(h, g.until, `${m} \`until\``), g.until !== void 0 && g.duration !== void 0 && s.push({ level: "error", beat: h, message: `${m}: give \`until\` or \`duration\`, not both.` });
    });
  });
  const l = t.map((c) => c && typeof c == "object" && !Array.isArray(c) ? Kf(c, e, !0) : c);
  return [...qo(l, n), ...s];
}
function Kf(t, e, n = !1) {
  const { then: s, ...o } = t, i = (a) => {
    try {
      return e[a.surface].anchor(a.anchor, 0);
    } catch (l) {
      if (n) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      throw l;
    }
  }, r = { ...o };
  return fo(t.target) && (r.target = i(t.target)), fo(t.to) && (r.to = i(t.to).x), fo(t.onto) && (r.onto = i(t.onto).top), r;
}
function o5(t, e, n) {
  let s = 0;
  return t.map((o) => {
    const i = ja([o], n.actions).length, r = e.slice(s, s + i);
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
function QS(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = zf(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(Yt), ...Object.keys(t.gaits ?? {})], o = t.gait ?? "walk";
  if (!s.includes(o)) throw new Error(`persona "${t.name}": ${ft("gait", o, s)}`);
  if (t.mood && !(t.mood in vt)) throw new Error(`persona "${t.name}": ${ft("mood", t.mood, Object.keys(vt))}`);
  const i = t.acting ?? "snappy";
  if (typeof i == "string" && !(i in Hn)) throw new Error(`persona "${t.name}": ${ft("acting style", i, Object.keys(Hn))}`);
  if (typeof t.stance == "string" && !(t.stance in ee)) throw new Error(`persona "${t.name}": ${ft("stance", t.stance, Object.keys(ee))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? ee[t.stance] : Lt(t.stance ?? {}), l = t.mood ? qe(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (u) => ku({ x: u.x, y: u.y, pose: l, style: { ...c, ...u.facing ? { facing: u.facing } : {} }, cast: e }),
    script: (u, f, d = {}) => Xa(u, f, {
      ...e,
      from: d.from,
      ground: d.ground,
      facing: d.facing,
      height: r,
      style: i,
      gait: o,
      start: l,
      rest: l,
      energy: t.energy
    }),
    check: (u) => qo(u, e),
    handPath: (u, f, d) => Yf(u, f, { ...d, style: c, cast: e }),
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
      actions: qf(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const i5 = /* @__PURE__ */ new Set(["x", "y", "walking", "gait"]), Rh = 0.215 + 0.205;
function r5(t, e, n = 1) {
  const { points: s } = ae(t, ht), o = s["hip.left"], i = s["knee.left"], r = s["ankle.left"], a = o && i && r ? Math.hypot(i.x - o.x, i.y - o.y) + Math.hypot(r.x - i.x, r.y - i.y) : Rh * t.height;
  return nf(e, a / Rh, n);
}
function t3(t, e, n, s = {}) {
  const o = Xa(t, n, { ...s, height: e.height, reach: s.reach ?? a5(e) }), i = o.tracks.find((b) => b.property === "facing")?.keyframes ?? [], r = (b) => {
    let k = s.facing ?? 1;
    for (const w of i) w.time <= b && (k = w.value);
    return k;
  }, a = ka(o.keys), l = o.keys.map((b, k) => {
    const w = Cw(a[k]);
    return {
      time: b.time,
      pose: r(b.time) < 0 ? Vy(w) : w,
      ...b.easing ? { easing: b.easing } : {},
      ...b.act === !1 ? { act: !1 } : {}
    };
  }), { rest: c, start: h, ...u } = s;
  h5(l, a, n, o, e, r, s);
  const f = wk(t, l, u), d = za(t, f, o.lines, { energy: s.energy }), g = o.tracks.filter((b) => i5.has(b.property)), p = o.tracks.find((b) => b.property === "walk");
  return { tracks: p ? [...d, ...g, m5(t, p, o.tracks, e, s)] : [...d, ...g], duration: o.duration, lines: o.lines, keys: l, beats: o.beats, effects: o.effects };
}
function a5(t) {
  const e = wt({ "arm.left.spread": 90, "arm.left.elbow": 0, "arm.left.bend": 0, "leg.left.knee": 0 }), n = ae(t, e).points, s = Math.hypot(n["hand.left"].x - n["shoulder.left"].x, n["hand.left"].y - n["shoulder.left"].y), o = Math.hypot(n["toe.left"].x - n["hip.left"].x, n["toe.left"].y - n["hip.left"].y), i = he({ ...ct, rightShoulder: 90, rightElbow: 0, rightWrist: 0 }, { height: t.height, facing: 1 }), r = he({ ...ct, rightHip: 90, rightKnee: 0 }, { height: t.height, facing: 1 }), a = { x: (i.hands.right.x + i.fingertips.right.x) / 2, y: (i.hands.right.y + i.fingertips.right.y) / 2 }, l = Math.hypot(a.x - i.shoulders.right.x, a.y - i.shoulders.right.y), c = Math.hypot(r.feet.right.x - r.hip.x, r.feet.right.y - r.hip.y);
  return { arm: l > 0 ? s / l : 1, leg: c > 0 ? o / c : 1 };
}
const l5 = { point: "arm", grab: "arm", put: "arm", write: "arm", swipe: "arm", push: "arm", kick: "leg" }, c5 = /* @__PURE__ */ new Set(["point", "grab", "put", "kick"]);
function h5(t, e, n, s, o, i, r) {
  const a = s.beats;
  if (n.length !== a.length) return;
  const l = new _t({ id: "placed", tracks: s.tracks.filter((h) => h.property === "x" || h.property === "y") }), c = (h) => {
    const u = l.getStateAtTime(h).values.get(s.tracks[0]?.target ?? "");
    return { x: (r.from ?? 0) + Number(u?.get("x") ?? 0), y: (r.ground ?? 0) + Number(u?.get("y") ?? 0) };
  };
  n.forEach((h, u) => {
    const f = l5[h.do], d = a[u];
    if (!f || d.contact === void 0 || h.do !== "swipe" && !h.target) return;
    const g = d.contact, p = d.release ?? d.contact;
    t.forEach((m, b) => {
      if (m.time < g - 1 || m.time > p + 1) return;
      const k = i(m.time), w = he(e[b], { height: o.height, facing: k < 0 ? -1 : 1 }), y = c(m.time), S = c5.has(h.do) && h.target ? { x: h.target.x - y.x, y: h.target.y - y.y } : void 0, $ = { x: (w.hands.right.x + w.fingertips.right.x) / 2, y: (w.hands.right.y + w.fingertips.right.y) / 2 }, v = S ?? (f === "arm" ? $ : w.toes.right), x = k < 0 ? "right" : "left", M = `${f}.${x}`;
      let T = m.pose;
      if (h.do === "point")
        T = Re(o, T, M, v);
      else if (f === "arm")
        T = Re(o, g5(o, T, x, v), M, v);
      else
        for (let A = 0; A < 3; A++) {
          const E = ae(o, T).points, P = E[`ankle.${x}`], O = E[`toe.${x}`];
          T = Re(o, T, M, { x: v.x - (O.x - P.x), y: v.y - (O.y - P.y) });
        }
      t[b] = { ...m, pose: T };
    });
  });
}
function u5(t, e) {
  const n = wt({ [`arm.${e}.spread`]: 90, [`arm.${e}.elbow`]: 0, [`arm.${e}.bend`]: 0 }), s = ae(t, n).points;
  return Math.hypot(s[`hand.${e}`].x - s[`shoulder.${e}`].x, s[`hand.${e}`].y - s[`shoulder.${e}`].y);
}
const f5 = 5, d5 = 4, p5 = 8;
function g5(t, e, n, s) {
  const o = u5(t, n) * 0.9, i = (a) => {
    const l = ae(t, a).points[`shoulder.${n}`];
    return Math.hypot(s.x - l.x, s.y - l.y) <= o;
  };
  if (i(e)) return e;
  let r = e;
  for (let a = 1; a <= p5; a++)
    if (r = { ...e, lean: (e.lean ?? 0) + f5 * a, bend: (e.bend ?? 0) + d5 * a }, i(r)) return r;
  return r;
}
function m5(t, e, n, s, o) {
  const i = n.find((u) => u.property === "gait"), r = i ? new _t({ id: `${t}-gait-of`, tracks: [i] }) : void 0, a = (u) => {
    const f = r?.getStateAtTime(u).values.get(t)?.get("gait");
    if (typeof f == "string")
      return Yt[f] ?? o.gaits?.[f] ?? f;
  }, l = e.keyframes, c = [];
  let h = l[0]?.value ?? 0;
  return l.forEach((u, f) => {
    if (f > 0) {
      const d = l[f - 1], g = a((d.time + u.time) / 2), p = Pr(g, s.height), m = r5(s, g);
      h += (u.value - d.value) * (m > 0 ? p / m : 1);
    } else
      h = u.value;
    c.push({ ...u, value: h });
  }), { ...e, keyframes: c };
}
const pt = ["rect", "circle", "text", "line", "path", "image", "custom"], y5 = ["rect", "circle", "line", "path"], Ua = {
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
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: y5 },
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
}, Jr = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, b5 = {
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
function w5(t) {
  const e = t, n = Object.entries(Ua).filter(([, o]) => o.types.includes(t.type)).map(([o, { types: i, ...r }]) => ({ name: o, ...r, ...e[o] !== void 0 && typeof e[o] != "object" ? { value: e[o] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [o, i] of Object.entries(t.props ?? {}))
    n.push({ name: o, description: s?.props?.[o]?.description ?? "", ...s?.props?.[o], value: i });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function k5(t) {
  const e = w5(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(Jr).filter((n) => e.includes(Jr[n]))];
}
function e3(t, e) {
  const n = [], s = Object.keys(e);
  for (const o of t) {
    const i = (f) => n.push({ level: "error", track: o.id, message: f }), r = e[o.target];
    if (!r) {
      i(ft("target", o.target, s));
      continue;
    }
    const a = k5(r), l = r.type === "custom" && r.acceptsProp?.(o.property);
    if (!a.includes(o.property) && !l) {
      i(`${o.target}: ${ft("property", o.property, a, b5[o.property])}`);
      continue;
    }
    const c = o.keyframes ?? [];
    for (let f = 1; f < c.length; f++)
      c[f].time < c[f - 1].time && i(`${o.target}.${o.property}: keyframes out of time order (${c[f - 1].time} ms, then ${c[f].time} ms).`);
    const h = Ua[Jr[o.property] ?? o.property] ?? r.about?.props?.[o.property], u = h && (h.kind ?? "number") === "number";
    for (const f of c) {
      if (u && typeof f.value != "number") {
        i(`${o.target}.${o.property}: values are numbers${h.unit ? ` (${h.unit})` : ""} (got ${JSON.stringify(f.value)} at ${f.time} ms).`);
        break;
      }
      if (u && typeof f.value == "number" && (h.min !== void 0 && f.value < h.min || h.max !== void 0 && f.value > h.max)) {
        n.push({ level: "warning", track: o.id, message: `${o.target}.${o.property}: ${f.value} at ${f.time} ms is outside ${h.min ?? "−∞"}..${h.max ?? "∞"}${h.unit ? ` (${h.unit})` : ""}.` });
        break;
      }
    }
  }
  return n;
}
const Rn = (t, e) => t[2] <= -e;
function Zr(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function Lh(t, e) {
  if (t.every((s) => Rn(s, e))) return t;
  const n = [];
  return t.forEach((s, o) => {
    const i = t[(o + t.length - 1) % t.length], r = Rn(s, e), a = Rn(i, e);
    r !== a && n.push(Zr(i, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function v5(t, e) {
  if (t.every((o) => Rn(o, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((o, i) => {
    const r = Rn(o, e);
    if (i > 0) {
      const a = t[i - 1], l = Rn(a, e);
      l && !r ? (s.push(Zr(a, o, e)), n.push(s), s = []) : !l && r && s.push(Zr(a, o, e));
    }
    r && s.push(o);
  }), s.length > 0 && n.push(s), n.filter((o) => o.length >= 2);
}
function Wh(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const o = Math.round(s / n);
  return Array.from({ length: o + 1 }, (i, r) => t + s * r / o);
}
function M5(t, e, n) {
  const s = (o, i) => Math.max(0, Math.min(o.length - 2, o.findIndex((r, a) => a > 0 && i <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function x5(t, e) {
  const n = (s) => {
    const o = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], i = Math.hypot(...o) || 1;
    return [o[0] / i, o[1] / i, o[2] / i];
  };
  return { ...t, vertices: t.vertices.map((s) => Ut(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function eo(t, e, n, s) {
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
function S5(t, e, n) {
  const s = t.faces.map((r) => ({ points: r.corners.map((a) => t.vertices[a]), normal: r.normal })), o = [], i = { x: e.slice(1, -1), z: n.slice(1, -1) };
  for (let r = 0; r + 1 < e.length; r++)
    for (let a = 0; a + 1 < n.length; a++) {
      const l = [], c = /* @__PURE__ */ new Map(), h = (g) => {
        const p = g.map((b) => Math.round(b * 1e6)).join(",");
        let m = c.get(p);
        return m === void 0 && (m = l.length, l.push(g), c.set(p, m)), m;
      }, u = [], f = (g) => g === 0, d = (g, p) => g + 2 === p.length;
      for (const g of s) {
        let p = g.points;
        f(r) || (p = eo(p, 0, e[r], 1)), p.length && !d(r, e) && (p = eo(p, 0, e[r + 1], -1)), p.length && !f(a) && (p = eo(p, 2, n[a], 1)), p.length && !d(a, n) && (p = eo(p, 2, n[a + 1], -1)), p.length >= 3 && u.push({ corners: p.map(h), normal: g.normal });
      }
      u.length > 0 && o.push({ cell: [r, a], mesh: { vertices: l, faces: u, creases: t.creases, joined: t.joined, walls: i } });
    }
  return o;
}
const T5 = /* @__PURE__ */ new WeakMap(), E5 = /* @__PURE__ */ new WeakMap(), A5 = 48, jf = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function Xf(t, e, n, s) {
  let o = t.get(e);
  o || t.set(e, o = /* @__PURE__ */ new Map());
  let i = o.get(n);
  return i === void 0 && (o.size >= A5 && o.clear(), o.set(n, i = s())), i;
}
function Ga(t, e) {
  const n = jf(e);
  return Xf(T5, t, n, () => {
    const s = x5(t, e), o = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      o[a] = Math.min(o[a], r[a]), i[a] = Math.max(i[a], r[a]);
    return { key: n, inSpace: s, low: o, high: i };
  });
}
function $5(t, e) {
  const n = t.map((h) => ({ ...h, ...Ga(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const u of [0, 1, 2])
    s[u] = Math.min(s[u], h.low[u]), o[u] = Math.max(o[u], h.high[u]);
  const i = Wh(s[0], o[0], e), r = Wh(s[2], o[2], e), a = `${i.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const f = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: M5(i, r, f) }];
    }
    return Xf(E5, h.inSpace, a, () => S5(h.inSpace, i, r)).map((f) => ({ part: h.part, mesh: f.mesh, cut: !0, cell: f.cell }));
  }), c = (s[1] + o[1]) / 2;
  return { pieces: l, middle: ([h, u]) => [(i[h] + i[h + 1]) / 2, c, (r[u] + r[u + 1]) / 2] };
}
const Fh = 4e-3, lr = 0.05, Nh = /* @__PURE__ */ new WeakMap();
function P5(t) {
  let e = Nh.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((o) => n.normal[0] * (o[0] - s[0]) + n.normal[1] * (o[1] - s[1]) + n.normal[2] * (o[2] - s[2]) <= 1e-6);
  }), Nh.set(t, e)), e;
}
const Dh = /* @__PURE__ */ new WeakMap();
function Uf(t) {
  return t.filter(({ mesh: e }) => P5(e)).map(({ part: e, key: n, inSpace: s, low: o, high: i }) => {
    let r = Dh.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), Dh.set(s, r)), { part: e, key: n, planes: r, low: o, high: i };
  });
}
function I5(t, e, n, s) {
  const o = e.reduce((i, r) => [i[0] + r[0] / e.length, i[1] + r[1] / e.length, i[2] + r[2] / e.length], [0, 0, 0]);
  for (const i of s) {
    if (i.part === t || [0, 1, 2].some((a) => o[a] < i.low[a] - lr || o[a] > i.high[a] + lr)) continue;
    if (i.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((u) => a.normal[0] * u[0] + a.normal[1] * u[1] + a.normal[2] * u[2] - a.offset);
      if (c.every((u) => Math.abs(u) <= Fh)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? lr : Fh;
      return c.every((u) => u <= h);
    })) return !0;
  }
  return !1;
}
const Bh = /* @__PURE__ */ new WeakMap();
function Gf(t, e, n, s, o) {
  const i = `${s}|${o.map((l) => l.key).join(";")}`;
  let r = Bh.get(e);
  r || Bh.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(i);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const u = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], f = Math.hypot(...u) || 1;
      return [u[0] / f, u[1] / f, u[2] / f];
    }, c = e.vertices.map((h) => Ut(n, h));
    a = e.faces.map((h) => I5(t, h.corners.map((u) => c[u]), l(h.normal), o)), r.set(i, a);
  }
  return a;
}
const Hs = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, Qr = Math.PI / 180;
function O5(t, e, n) {
  return {
    toView: (s) => Sa(Gt(s, t * 90 * Qr), -e * Qr),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const zh = /* @__PURE__ */ new WeakMap(), Yo = (t) => po(t), po = (t) => {
  let e = zh.get(t);
  return e || zh.set(t, e = h2(t)), e;
};
function Et(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? Hs[n]?.default ?? 0;
}
function Ts(t, e) {
  const n = Math.max(0.05, Et(t, e, "squash")), s = 1 / Math.sqrt(n), i = [1, 0, 0, 0, 0, 1, Et(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    ze([0, Et(t, e, "lift"), 0]),
    re(te([1, 0, 0], -Et(t, e, "pitch"))),
    re(te([0, 0, 1], Et(t, e, "roll"))),
    i,
    Ge([s, n, s]),
    Ge(Array(3).fill(Math.max(0, Et(t, e, "size"))))
  ].reduce((r, a) => Pt(r, a));
}
function Va(t, e) {
  const n = Ts(t, e), s = /* @__PURE__ */ new Map(), o = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: Et(t, e, r), bind: l }))), i = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = Pt(l ? i(l) : n, ze(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, u, f] = r.rotate;
      h && (c = Pt(c, re(te([1, 0, 0], h)))), u && (c = Pt(c, re(te([0, 1, 0], u)))), f && (c = Pt(c, re(te([0, 0, 1], f))));
    }
    for (const { value: h, bind: u } of o)
      if (!(!u.parts.includes(r.id) || h === 0)) {
        if (u.translate && (c = Pt(c, ze([u.translate[0] * h, u.translate[1] * h, u.translate[2] * h]))), u.rotate) {
          const f = u.rotate.pivot ?? [0, 0, 0], d = u.rotate.axis === "x" ? [1, 0, 0] : u.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, ze(f), re(te(d, u.rotate.degrees * h)), ze([-f[0], -f[1], -f[2]])].reduce((g, p) => Pt(g, p));
        }
        u.scale && (c = Pt(c, Ge([1 + (u.scale[0] - 1) * h, 1 + (u.scale[1] - 1) * h, 1 + (u.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) i(r);
  return s;
}
const cr = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), _5 = Math.cos(35 * Qr);
function Vf(t, e, n, s, o = {}) {
  const i = t.derive ? { ...e, ...t.derive(e) } : e, r = Va(t, i), a = n.toView([0, 0, 0]), l = (O) => (L) => [O[0] * L[0] + O[4] * L[1] + O[8] * L[2], O[1] * L[0] + O[5] * L[1] + O[9] * L[2], O[2] * L[0] + O[6] * L[1] + O[10] * L[2]], c = Ts(t, i), h = o.slice === void 0 ? null : ua(c), u = h ? t.parts.map((O) => ({ part: O, mesh: po(O.shape), local: Pt(h, r.get(O.id)), whole: O.shape.type === "tube" })) : void 0, f = u ? $5(u, o.slice) : void 0, d = u ? Uf(u.map((O) => ({ part: O.part.id, mesh: O.mesh, ...Ga(O.mesh, O.local) }))) : void 0, g = (O, L, q, G) => {
    const Q = (J) => n.toView(Ut(q, J)), j = L.vertices.map(Q), C = j.map((J) => n.toScreen(J)), B = o.perspective ? o.near : void 0, Y = (J) => J.map((it) => n.toScreen(it)), I = (J) => B === void 0 ? J : Lh(J, B), N = (J) => B === void 0 ? [J] : v5(J, B), nt = l(q), H = L.faces.map((J) => {
      const it = n.toView(nt(J.normal)), lt = [it[0] - a[0], it[1] - a[1], it[2] - a[2]], ut = Math.hypot(...lt) || 1;
      return [lt[0] / ut, lt[1] / ut, lt[2] / ut];
    }), R = d && G ? Gf(O.id, L, G, jf(G), d) : void 0, z = (J) => R?.[J] ?? !1, U = H.map((J, it) => {
      if (z(it)) return !1;
      if (!o.perspective) return J[2] > 1e-6;
      const ut = L.faces[it].corners.reduce((mt, yt) => [mt[0] + j[yt][0], mt[1] + j[yt][1], mt[2] + j[yt][2]], [0, 0, 0]);
      return -(J[0] * ut[0] + J[1] * ut[1] + J[2] * ut[2]) > 1e-9;
    }), W = (J) => L.faces[J].corners.reduce((it, lt) => it + j[lt][2], 0) / L.faces[J].corners.length, F = L.faces.map((J, it) => ({ face: J, i: it })).filter(({ i: J }) => U[J]).map(({ face: J, i: it }) => ({
      i: it,
      solved: {
        points: B === void 0 ? J.corners.map((lt) => C[lt]) : Y(I(J.corners.map((lt) => j[lt]))),
        depth: W(it),
        tone: 0.72 + 0.33 * Math.max(0, H[it][0] * cr[0] + H[it][1] * cr[1] + H[it][2] * cr[2])
      }
    })).filter((J) => J.solved.points.length >= 3).sort((J, it) => J.solved.depth - it.solved.depth);
    if (o.light) {
      const J = l(q);
      for (const { i: it, solved: lt } of F) {
        const ut = L.faces[it].corners, mt = ut.reduce((bi, cd) => {
          const wi = Ut(q, L.vertices[cd]);
          return [bi[0] + wi[0] / ut.length, bi[1] + wi[1] / ut.length, bi[2] + wi[2] / ut.length];
        }, [0, 0, 0]), yt = J(L.faces[it].normal), Vt = Math.hypot(...yt) || 1, Xn = o.light(mt, [yt[0] / Vt, yt[1] / Vt, yt[2] / Vt]);
        lt.light = Xn.light, lt.fog = Xn.fog;
      }
    }
    const D = F.map((J) => J.solved), V = H5(L), K = [], Z = [];
    for (const [J, it] of V) {
      const lt = it.filter((mt) => U[mt]).length;
      if (lt === 0) continue;
      const ut = it.length === 2 && lt === 2 && L.creases !== !1 && H[it[0]][0] * H[it[1]][0] + H[it[0]][1] * H[it[1]][1] + H[it[0]][2] * H[it[1]][2] < _5;
      it.length === 1 && (L.joined || L5(L, J)) || (it.length === 1 || lt === 1 || ut) && (K.push(J.split("-").map(Number)), Z.push(it.filter((mt) => U[mt]).reduce((mt, yt) => W(yt) > W(mt) ? yt : mt)));
    }
    const tt = (J) => L.faces.findIndex((it) => it.corners.length > 4 && Math.sign(F5(L.vertices[J], it.normal)) > 0), _ = (L.marks ?? []).filter(([J]) => tt(J) < 0 || U[tt(J)]), X = ([J, it]) => B === void 0 ? [[C[J], C[it]]] : N([j[J], j[it]]).map(Y), ot = _.flatMap(X), rt = (J) => B === void 0 ? [J.map((it) => C[it])] : N(J.map((it) => j[it])).map(Y);
    if (o.slice !== void 0) {
      const J = /* @__PURE__ */ new Map();
      K.forEach((it, lt) => J.set(Z[lt], [...J.get(Z[lt]) ?? [], it]));
      for (const { i: it, solved: lt } of F) {
        lt.edges = Yh(J.get(it) ?? []).flatMap(rt);
        const ut = L.faces[it].corners;
        lt.center = ut.reduce((yt, Vt) => [yt[0] + j[Vt][0] / ut.length, yt[1] + j[Vt][1] / ut.length, yt[2] + j[Vt][2] / ut.length], [0, 0, 0]), lt.normal = H[it];
        const mt = F[F.length - 1].i;
        lt.marks = _.filter(([yt]) => (tt(yt) >= 0 ? tt(yt) : mt) === it).flatMap(X);
      }
    }
    const st = O.glow ? Math.max(0, Math.min(1, Et(t, i, O.glow.control))) : 0, at = O.fade ? Math.max(0, Math.min(1, Et(t, i, O.fade.control))) : 0, et = O.fade ? Math.max(0, Math.min(1, O.fade.from + (O.fade.to - O.fade.from) * at)) : 1;
    return {
      part: O,
      depth: j.reduce((J, it) => J + it[2], 0) / Math.max(1, j.length),
      faces: D,
      edges: Yh(K).flatMap(rt),
      marks: ot,
      glow: st,
      opacity: et,
      ...O.shape.type === "tube" ? { spine: W5(N(O.shape.points.map(Q)).map(Y)) } : {},
      ...L.walls ? { cut: !0 } : {}
    };
  }, p = new Map(u?.map((O) => [O.part.id, O.local])), b = (f ? f.pieces.map((O) => ({
    part: O.part,
    mesh: O.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: O.cut ? c : r.get(O.part.id),
    local: O.cut ? Qo() : p.get(O.part.id),
    cell: O.cell
  })) : t.parts.map((O) => ({ part: O, mesh: po(O.shape), m: r.get(O.id), local: void 0, cell: void 0 }))).map((O) => ({ cell: O.cell, solved: g(O.part, O.mesh, O.m, O.local) })), k = b.map((O) => O.solved), w = (O) => O.filter((L) => L.faces.length > 0 && L.opacity > 0.01).sort((L, q) => L.depth - q.depth);
  let y;
  if (f) {
    const O = new Map(t.parts.map((q) => {
      const G = r.get(q.id), Q = po(q.shape).vertices;
      return [q.id, Q.reduce((j, C) => j + n.toView(Ut(G, C))[2], 0) / Math.max(1, Q.length)];
    })), L = /* @__PURE__ */ new Map();
    for (const q of b) {
      const G = q.cell.join(",");
      L.has(G) || L.set(G, { cell: q.cell, parts: [] }), L.get(G).parts.push(q.solved), q.solved.depth = O.get(q.solved.part.id);
    }
    y = [...L.values()].map(({ cell: q, parts: G }) => ({ depth: n.toView(Ut(c, f.middle(q)))[2], parts: w(G) })).filter((q) => q.parts.length > 0);
  }
  const S = {};
  for (const [O, L] of Object.entries(t.anchors ?? {})) {
    const q = L.part ? r.get(L.part) : Ts(t, i);
    if (!q) throw new Error(`prop rig: anchor "${O}" is on "${L.part}", which is not a part`);
    const G = n.toView(Ut(q, L.at));
    S[O] = { point: n.toScreen(G), depth: G[2] };
  }
  const [$, v] = t.footprint ?? [t.length * 0.45, t.length], x = Math.max(0, Et(t, i, "lift")), M = Math.max(0, Et(t, i, "size")) / (1 + x * 0.8), T = Array.from({ length: 24 }, (O, L) => {
    const q = Math.PI * 2 * L / 24;
    return n.toView([Math.cos(q) * $ * 0.55 * M, 0, Math.sin(q) * v * 0.55 * M]);
  }), A = o.perspective ? o.near : void 0, E = {
    points: (A === void 0 ? T : Lh(T, A)).map((O) => n.toScreen(O)),
    opacity: 0.16 * M
  }, P = k.filter((O) => O.part.seeThrough && O.opacity > 0.01).flatMap((O) => O.faces.map((L) => L.points));
  return { under: w(k.filter((O) => !O.part.overRider)), over: w(k.filter((O) => O.part.overRider)), ...y ? { cells: y } : {}, anchors: S, openings: P, shadow: E, pxPerUnit: s, sizePx: t.height * s };
}
const qh = /* @__PURE__ */ new WeakMap();
function H5(t) {
  let e = qh.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let o = 0; o < s.length; o++) {
        const i = s[o], r = s[(o + 1) % s.length], a = i < r ? `${i}-${r}` : `${r}-${i}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    qh.set(t, e);
  }
  return e;
}
function C5(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = Va(t, n), o = ua(Ts(t, n)) ?? Qo(), i = (r) => Math.max(0, Math.min(1, r));
  return t.parts.map((r) => {
    const a = r.fade ? i(Et(t, n, r.fade.control)) : 0;
    return {
      part: r,
      matrix: s.get(r.id),
      local: Pt(o, s.get(r.id)),
      glow: r.glow ? i(Et(t, n, r.glow.control)) : 0,
      opacity: r.fade ? i(r.fade.from + (r.fade.to - r.fade.from) * a) : 1
    };
  });
}
function R5(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = Va(t, n), o = Ts(t, n), i = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : o;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    i[r] = Ut(l, a.at);
  }
  return i;
}
function L5(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((i) => t.vertices[Number(i)]), o = (i, r) => r.some((a) => Math.abs(n[i] - a) < 1e-6 && Math.abs(s[i] - a) < 1e-6);
  return o(0, t.walls.x) || o(2, t.walls.z);
}
function W5(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const F5 = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function Yh(t) {
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
function Jf(t, e) {
  if (!t.loose?.size) return;
  const n = {};
  for (const [s, o] of t.loose)
    n[s] = { x: e[`piece.${o}.x`] ?? 0, y: e[`piece.${o}.y`] ?? 0, rotate: e[`piece.${o}.rotate`] ?? 0, opacity: e[`piece.${o}.opacity`] ?? 1 };
  return n;
}
function Zf(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...Hs, ...t.rig.controls })) {
    const { bind: o, ...i } = s;
    e[n] = i;
  }
  return e;
}
function N5(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, o = e.rig.height * n * 1.6, i = Zf(e), r = {};
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
      l.translate(s / 2, o), bf(l, Cs(e, u, n), { ...a, time: h, loose: Jf(c, u) });
    }
  };
}
function Cs(t, e, n) {
  const s = O5(Et(t.rig, e, "turn"), Et(t.rig, e, "tilt"), n);
  return Vf(t.rig, e, s, n);
}
function Ja(t, e, n) {
  const s = { ...t.props };
  let o = 0, i = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? o = c : l === "y" ? i = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + o, y: t.y + t.height + i }, a = Cs(t.prop, s, t.propScale);
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
function n3(t, e, n, s, o = {}) {
  const i = Ja(e, n, s);
  return t.save(), t.translate(i.origin.x, i.origin.y), bf(t, i.solved, {
    ...e.propDraw,
    time: n.time,
    loose: Jf(e, i.values),
    // The rider is drawn in scene px.
    rider: o.rider ? (r) => {
      r.save(), r.translate(-i.origin.x, -i.origin.y), o.rider(r), r.restore();
    } : void 0
  }), t.restore(), i;
}
const ls = {
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
}, D5 = 400, B5 = 0.2;
function s3(t, e = {}) {
  const { prop: n } = t, s = Zf(n), o = Object.keys(s), i = Object.keys(n.rig.anchors ?? {}), r = n.rig.parts.map(($) => $.id), a = _s(), l = pi(a), c = e.tracks?.length ? new _t({ id: `${n.kind}-surface`, tracks: e.tracks }) : void 0, h = Math.max(0, ...(e.tracks ?? []).flatMap(($) => $.keyframes.map((v) => v.time))), u = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map();
  t.loose = f;
  const d = t.props, g = ($) => {
    const v = { ...t.props };
    let x = 0, M = 0;
    if (c) {
      const T = c.getStateAtTime(Math.min($, h));
      for (const A of T.values.values())
        for (const [E, P] of A)
          typeof P == "number" && (E === "x" ? x = P : E === "y" ? M = P : E in v && (v[E] = P));
    }
    for (const T of o) a.keys(T)?.length && (v[T] = a.valueAt(T, $));
    return { values: v, origin: { x: t.x + t.width / 2 + x, y: t.y + t.height + M } };
  }, p = ($) => {
    const { kind: v, rest: x } = Kn($), M = (T) => Xe(n.kind, $, ls, T);
    if (v === "box") {
      if (x) throw M("box takes no arguments");
      return { kind: v };
    }
    if (v === "anchor") {
      if (!i.includes(x)) throw M(ft(`${n.kind} anchor`, x, i));
      return { kind: v, name: x };
    }
    if (v === "part") {
      if (!r.includes(x)) throw M(ft(`${n.kind} part`, x, r));
      return { kind: v, name: x };
    }
    if (v === "control") {
      if (!o.includes(x)) throw M(ft(`${n.kind} control`, x, o));
      return { kind: v, name: x };
    }
    throw M();
  }, m = ($) => {
    const v = (n.rig.controls[$]?.bind ?? []).flatMap((M) => M.parts), x = n.rig.parts.filter((M) => M.glow?.control === $).map((M) => M.id);
    return /* @__PURE__ */ new Set([...v, ...x]);
  }, b = /* @__PURE__ */ new Map(), k = ($) => {
    let v = b.get($);
    if (!v) {
      const x = g($);
      b.set($, v = { ...x, solved: Cs(n, x.values, t.propScale) });
    }
    return v;
  }, w = ($, v) => {
    const x = p($), { values: M, origin: T, solved: A } = k(v);
    if (x.kind === "box") return kt(T.x - t.width / 2, T.y - t.height, t.width, t.height);
    if (x.kind === "anchor") {
      const O = A.anchors[x.name].point, L = B5 * t.propScale;
      return kt(T.x + O.x - L / 2, T.y + O.y - L / 2, L, L);
    }
    if (x.kind === "part") return P(/* @__PURE__ */ new Set([x.name]), `part "${x.name}" is`);
    const E = m(x.name);
    if (E.size === 0) return kt(T.x - t.width / 2, T.y - t.height, t.width, t.height);
    return P(E, `the parts control "${x.name}" moves are`);
    function P(O, L) {
      const q = [...A.under, ...A.over].filter((B) => O.has(B.part.id)).flatMap((B) => B.faces.flatMap((Y) => Y.points));
      if (q.length === 0) {
        const B = Number.isFinite(v) ? `at ${v} ms` : "after its edits";
        throw new Error(`${n.kind}: ${L} turned away from the viewer ${B}; aim at an anchor (${i.map((Y) => `anchor:${Y}`).join(", ") || "none"}) or box`);
      }
      const G = q.map((B) => B.x), Q = q.map((B) => B.y), j = Math.min(...G), C = Math.min(...Q);
      return kt(T.x + j, T.y + C, Math.max(...G) - j, Math.max(...Q) - C);
    }
  }, y = ($, v) => {
    try {
      return w($, v);
    } catch {
      return;
    }
  }, S = {
    kind: "prop",
    prop: t,
    about: ls,
    target: t,
    box: kt(t.x, t.y, t.width, t.height),
    anchor($, v = 1 / 0) {
      return w($, v);
    },
    piece($) {
      const v = p($);
      if (v.kind !== "part") throw new Error(`${n.kind}: a piece is a part, part:ID (${r.slice(0, 6).map((A) => `part:${A}`).join(", ")}…), not "${$}"`);
      const x = u.get(v.name);
      if (x) return x;
      const M = [v.name];
      for (let A = 0; A < M.length; A++) for (const E of n.rig.parts) E.parent === M[A] && !M.includes(E.id) && M.push(E.id);
      const T = { id: u.size + 1, part: v.name, home: w($, 0) };
      u.set(v.name, T);
      for (const A of M) f.set(A, T.id);
      for (const A of ["x", "y", "rotate"]) d[`piece.${T.id}.${A}`] = 0;
      return d[`piece.${T.id}.opacity`] = 1, T;
    },
    edit($, v, x) {
      if (!($ in ls.edits)) throw gi(n.kind, $, ls);
      const M = Array.isArray(v) ? v : [v];
      if (M.length === 0) throw new Error(`${n.kind}.edit: ${$} takes at least one anchor`);
      if (b.clear(), $ === "move" || $ === "fling") {
        if (M.length > 1) throw new Error(`${n.kind}.edit: ${$} takes one part anchor`);
        const T = S.piece(M[0]);
        if ($ === "fling") return S.fling(T, x);
        const A = x.to;
        if (!A) throw new Error(`${n.kind}.edit: move needs \`to\`, an anchor name or { x, y }`);
        const E = typeof A == "string" ? w(A, x.at) : void 0;
        return S.move(T, { ...x, to: E ? { x: E.left + E.width / 2, y: E.top + E.height / 2 } : A });
      }
      for (const T of M) {
        const A = p(T);
        if (A.kind !== "control") throw new Error(`${n.kind}.edit: ${$} takes control anchors (control:${o.join(", control:")}), not "${T}"`);
        const E = s[A.name];
        let P;
        if ($ === "set") {
          if (typeof x.value != "number" || !Number.isFinite(x.value)) throw new Error(`${n.kind}.edit: set needs \`value\`, a number (${A.name}: ${E.description})`);
          P = x.value;
        } else
          P = x.on === !1 ? E.default ?? E.min ?? 0 : E.max ?? 1;
        a.tween(A.name, g(x.at).values[A.name], P, x, D5);
      }
      return S;
    },
    follow($, v) {
      return b.clear(), l.follow($, v), S;
    },
    fling($, v) {
      return b.clear(), l.fling($, v), S;
    },
    move($, v) {
      return b.clear(), l.move($, v), S;
    },
    ride($, v, x) {
      const M = [
        ...o.flatMap((A) => Ss(a.keys(A))),
        ...(e.tracks ?? []).flatMap((A) => Ss(A.keyframes.filter((E) => typeof E.value == "number")))
      ];
      if (M.length === 0) return $;
      const T = [...i.map((A) => `anchor:${A}`), ...r.map((A) => `part:${A}`)].flatMap((A) => {
        const E = y(A, 0);
        return E ? [{ top: E.top, offset: (P) => (y(A, P)?.top ?? E.top) - E.top, windows: M }] : [];
      });
      return Ya($, v, { ground: x.ground, every: x.every ?? je, floors: T });
    },
    tracks: a.tracks
  };
  return S;
}
const z5 = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function Le(t) {
  const e = { ...z5, ...t.colors }, n = [], { forwardMost: s, backMost: o, top: i } = Qf(t);
  t.body && n.push({ id: "body", shape: { type: "extrude", profile: t.body, width: t.width }, fill: e.body });
  for (const [h, u] of (t.frame ?? []).entries())
    n.push({ id: `frame-${h}`, shape: { type: "tube", points: u.points, radius: u.radius ?? 0.035, segments: 6 }, fill: u.color ?? e.body, outline: 0.7 });
  for (const [h, u] of (t.windows ?? []).entries())
    for (const f of [1, -1])
      n.push({
        id: `window-${h}-${f > 0 ? "left" : "right"}`,
        shape: { type: "panel", points: [[u.from, u.low], [u.to, u.low], [u.to, u.high], [u.from, u.high]], facing: f > 0 ? "left" : "right" },
        at: [f * (t.width / 2 + 0.01), 0, 0],
        fill: e.glass,
        outline: 0.7,
        seeThrough: !0,
        glow: t.lights ? { control: "lights", color: "#ffe9a3" } : void 0
      });
  for (const h of t.extras ?? []) n.push(h);
  if (t.cabin) {
    const h = t.cabin.width ?? t.width * 0.85;
    n.push({ id: "cabin", shape: { type: "extrude", profile: t.cabin.profile, width: h }, fill: e.glass, outline: 0.9, seeThrough: !0, layer: 1 });
    const u = Math.min(...t.cabin.profile.map(([, d]) => d)), f = Math.max(...t.cabin.profile.map(([, d]) => d));
    for (const [d, g] of (t.cabin.pillars ?? []).entries())
      n.push({ id: `pillar-${d}`, shape: { type: "box", size: [h + 0.02, f - u, 0.1] }, at: [0, (u + f) / 2, g], fill: e.body, outline: 0.8, layer: 1 });
  }
  const r = t.wheels[0]?.radius ?? 0.4, a = [];
  t.wheels.forEach((h, u) => {
    const f = h.side === 0 ? [0] : [1, -1], d = h.thickness ?? (h.style === "spoked" ? 0.05 : 0.26);
    for (const g of f) {
      const p = `wheel-${u}-${g > 0 ? "left" : g < 0 ? "right" : "middle"}`;
      if (a.push({ parts: [p], rotate: { axis: "x", degrees: r / h.radius } }), n.push({
        id: p,
        shape: { type: "cylinder", radius: h.radius, length: d, axis: "x", segments: 20, spokes: h.style === "spoked" ? 8 : 0 },
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
            at: [m * (d / 2 + 0.012), 0, 0],
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
    const { from: h, to: u, low: f, high: d } = t.door, g = [[h, f], [u, f], [u, d], [h, d]];
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
        shape: { type: "panel", points: [[b, f + 0.05], [k, f + 0.05], [k - 0.08, d - 0.06], [b + 0.06, d - 0.04]], facing: p > 0 ? "left" : "right" },
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
    const { across: h, low: u, high: f, front: d, back: g } = t.lights, p = (t.lights.size ?? 0.32) / 2, m = [[-p, u], [p, u], [p, f], [-p, f]];
    for (const b of [1, -1])
      n.push({ id: `headlight-${b}`, shape: { type: "panel", points: m, facing: "front" }, at: [b * h, 0, d], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${b}`, shape: { type: "panel", points: m, facing: "back" }, at: [b * h, 0, g], fill: Ba(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
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
    actions: Y5(t),
    acting: q5,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function Qf(t) {
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
const q5 = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function no(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
const Kh = 0.4;
function Y5(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = Qf(t), o = (n - s) / 2, i = (a, l, c) => {
    const h = a.exaggeration;
    let u = l;
    return a.facing() !== c && (u = a.turnTo(u, c > 0 ? "right" : "left")), a.key(u + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), no(a, u, u + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: u + 150, x: a.x - c * o * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), u + 260;
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
        const u = i(a, c, h), f = a.exaggeration, d = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, d / (l.speed ?? Kh));
        return a.effect({ kind: "dust", time: u, x: a.x - h * o * a.scale, y: a.floor, length: 600, direction: -h }), a.key(u + 140, { pitch: -1.5 * f, squash: 1 + 0.05 * f, lean: 0.12 * f }, { act: !1, easing: "ease-out" }), a.key(u + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * f, squash: 1.02 }, { act: !1 }), no(a, u, u + g, l.to, "ease-in-out", e), r(a, u + g, !1), { end: u + g + 380, contact: u, release: u + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = i(a, c, h), f = a.exaggeration, d = a.x, g = Math.abs(l.to - d), p = l.for ?? Math.max(600, g / (l.speed ?? Kh * 1.2)), m = u + p * 0.55, b = d + (l.to - d) * 0.65;
        return a.key(u + 140, { pitch: -1.5 * f, squash: 1 + 0.06 * f, lean: 0.14 * f }, { act: !1, easing: "ease-out" }), no(a, u, m, b, "ease-in", e), a.key(m + 80, { pitch: -7 * f, lean: -0.12 * f, squash: 0.94 }, { act: !1, easing: "ease-out" }), no(a, m, u + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: b, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: u + p, x: l.to + h * o * a.scale, y: a.floor, length: 600, direction: h }), r(a, u + p, !0), { end: u + p + 380, contact: m, release: u + p };
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
function K5(t = {}) {
  return Le({
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
function j5(t = {}) {
  return Le({
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
function X5(t = {}) {
  return Le({
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
function U5(t = {}) {
  return Le({
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
function G5(t = {}) {
  const e = t.colors?.body ?? "#a8743f";
  return Le({
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
function V5(t = {}) {
  return Le({
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
function J5(t = {}) {
  const e = t.colors?.body ?? "#e0473b", n = [0, 0.32, -0.05], s = [0, 0.86, -0.22], o = [0, 0.9, 0.42], i = [0, 0.34, 0.56], r = [0, 0.34, -0.56];
  return Le({
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
function Z5(t = {}) {
  return Le({
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
function Q5(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, o = t.canopy?.shape === "tall", i = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = rn(t.canopy?.seed ?? 7), a = [
    { id: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.06, e * 0.5, 0], [-0.02, e, 0]], radius: n, segments: 8 }, fill: i.trunk },
    { id: "branch", parent: "trunk", shape: { type: "tube", points: [[0, 0, 0], [0.45, 0.4, 0.1]], radius: n * 0.45, segments: 6 }, at: [0.04, e * 0.62, 0], fill: i.trunk },
    { id: "canopy", parent: "trunk", shape: { type: "ellipsoid", radii: [s, s * (o ? 1.35 : 0.88), s], segments: 14 }, at: [-0.02, e + s * 0.55, 0], fill: i.leaves }
  ], l = t.canopy?.lobes ?? 7;
  for (let h = 0; h < l; h++) {
    const u = Math.PI * 2 * h / l + r.next() * 0.6, f = (r.next() - 0.25) * s * (o ? 1.1 : 0.7), d = s * (0.48 + r.next() * 0.22), g = [Math.cos(u) * s * 0.78, f, Math.sin(u) * s * 0.6];
    a.push({ id: `lobe-${h}`, parent: "canopy", shape: { type: "ellipsoid", radii: [d, d * 0.86, d], segments: 12 }, at: g, fill: i.leaves });
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
    actions: ev(),
    acting: tv,
    colors: { body: i.leaves }
  };
}
const tv = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function ev() {
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
          const h = 0.55 + 0.45 * Math.sin(c / i * Math.PI * 2.3), u = Math.sin(c / 170) * 0.35, f = -o * 9 * r * (h + u * o);
          e.key(s + c, { sway: f, canopySway: l * 1.3 }, { act: !1, easing: "ease-in-out" }), l = f;
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
function nv(t = {}) {
  const e = t.width ?? 4, n = t.depth ?? 3.2, s = t.wallHeight ?? 2.5, o = t.roofHeight ?? 1.5, i = t.overhang ?? 0.25, r = { walls: "#f1d9a8", roof: "#b8433a", door: "#7a4b2a", doorway: "#3a2a22", glass: "#bfe3f2", lit: "#ffd66b", chimney: "#9b5a45", ...t.colors }, a = n / 2 + 0.01, l = t.door?.width ?? 0.9, c = t.door?.height ?? 1.9, h = t.door?.at ?? 0, u = t.windows ?? [
    { at: -1.25, low: 1, width: 0.8, height: 0.8 },
    { at: 1.25, low: 1, width: 0.8, height: 0.8 }
  ], f = [
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
    f.push({
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
    f.push({
      id: `side-window-${p > 0 ? "left" : "right"}`,
      shape: { type: "panel", points: [[-0.4, 1], [0.4, 1], [0.4, 1.8], [-0.4, 1.8]], facing: p > 0 ? "left" : "right" },
      at: [p * (e / 2 + 0.01), 0, 0],
      fill: r.glass,
      outline: 0.8,
      glow: { control: "lights", color: r.lit }
    });
  const d = t.chimney === !1 ? void 0 : { at: t.chimney?.at ?? e * 0.28, back: t.chimney?.back ?? -n * 0.18 };
  if (d) {
    const p = s + o * (1 - Math.abs(d.back) / (n / 2 + i)), m = s + o + 0.45;
    f.push({ id: "chimney", shape: { type: "box", size: [0.42, m - p + 0.3, 0.42] }, at: [d.at, (m + p - 0.3) / 2, d.back], fill: r.chimney, layer: 1 });
  }
  const g = {
    parts: f,
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
      ...d ? { chimney: { at: [d.at, s + o + 0.5, d.back] } } : {}
    }
  };
  return {
    kind: t.kind ?? "house",
    family: "building",
    summary: t.summary ?? "A house: opens its door, lights its windows, puffs chimney smoke, shakes, pops up.",
    rig: g,
    actions: ov(!!d),
    acting: sv,
    colors: { body: r.walls }
  };
}
const sv = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function ov(t) {
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
function iv(t = {}) {
  const e = t.width ?? 0.46, n = t.depth ?? 0.46, s = t.seatHeight ?? 0.46, o = t.backHeight ?? 0.95, i = { wood: "#8a5a3b", seat: "#c48a4a", ...t.colors }, r = 0.05, a = 0.025, l = [
    { id: "seat", shape: { type: "box", size: [e, r, n] }, at: [0, s - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, o - s, r] }, at: [0, (o + s) / 2, -n / 2 + r / 2], fill: i.wood }
  ];
  for (const [h, u, f] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    l.push({ id: `leg-${f}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - r, 0]], radius: a, segments: 6 }, at: [h * (e / 2 - a * 1.5), 0, u * (n / 2 - a * 1.5)], fill: i.wood });
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
    actions: av(),
    acting: rv,
    colors: { body: i.seat }
  };
}
const rv = {
  depth: { tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function av() {
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
function lv(t = {}) {
  const e = t.width ?? 1.4, n = t.depth ?? 0.7, s = t.height ?? 0.75, o = { wood: "#8a5a3b", top: "#a9754a", knob: "#2b2b2b", ...t.colors }, i = 0.04, r = 0.03, a = 0.14, l = e * 0.4, c = [
    { id: "top", shape: { type: "box", size: [e, i, n] }, at: [0, s - i / 2, 0], fill: o.top },
    // The drawer: a box under the top on the left, sliding forward on its control.
    { id: "drawer", shape: { type: "box", size: [l, a, n * 0.8] }, at: [-e / 2 + l / 2 + 0.05, s - i - a / 2, 0], fill: o.wood },
    { id: "knob", parent: "drawer", shape: { type: "ellipsoid", radii: [0.02, 0.02, 0.015], segments: 8 }, at: [0, 0, n * 0.4 + 0.012], fill: o.knob, outline: 0.6 }
  ];
  for (const [u, f, d] of [[-1, 1, "front-left"], [1, 1, "front-right"], [-1, -1, "back-left"], [1, -1, "back-right"]])
    c.push({ id: `leg-${d}`, shape: { type: "tube", points: [[0, 0, 0], [0, s - i, 0]], radius: r, segments: 6 }, at: [u * (e / 2 - r * 2), 0, f * (n / 2 - r * 2)], fill: o.wood });
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
        run(u, f, d) {
          return u.key(d + 400, { drawer: f.open ? 1 : 0 }, { easing: f.open ? "ease-out" : "ease-in" }), { end: d + 500, contact: d + 400 };
        }
      }
    },
    acting: cv,
    colors: { body: o.top }
  };
}
const cv = {
  depth: { drawer: 1, roll: 1, squash: 1, size: 0 },
  limits: { drawer: 0.08, roll: 1, squash: 0.04 },
  eyes: [],
  headTurns: {},
  drift: []
};
function hv(t = {}) {
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
        run(h, u, f) {
          const d = u.for ?? 700, g = h.exaggeration;
          return h.key(f + 90, { give: 1 - 0.18 * g }, { act: !1, easing: "ease-out" }), h.key(f + d * 0.45, { give: 1 + 0.05 * g }, { act: !1, easing: "ease-in-out" }), h.key(f + d * 0.7, { give: 1 - 0.04 * g }, { act: !1, easing: "ease-in-out" }), h.key(f + d, { give: 1 }), { end: f + d, contact: f + 90 };
        }
      }
    },
    acting: uv,
    colors: { body: i.blanket }
  };
}
const uv = {
  depth: { give: 1, roll: 1, squash: 1, size: 0 },
  limits: { give: 0.03, roll: 0.5, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function fv(t = {}) {
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
    actions: pv(),
    acting: dv,
    colors: { body: o.door }
  };
}
const dv = {
  depth: { open: 1, roll: 1, squash: 1, size: 0 },
  limits: { open: 0.08, roll: 0.6, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function pv() {
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
const td = 1.4;
function gv(t = {}) {
  const e = t.width ?? 0.5, n = t.seatHeight ?? 0.5, s = t.wheelRadius ?? 0.3, o = 0.08, i = { frame: "#2b2f36", seat: "#3c6ea5", tyre: "#1f2328", ...t.colors }, r = 0.04, a = 0.018, l = 0.44, c = n + 0.5, h = -0.08, u = e / 2 + 0.06, f = [
    { id: "seat", shape: { type: "box", size: [e, r, l] }, at: [0, n - r / 2, 0], fill: i.seat },
    { id: "back", shape: { type: "box", size: [e, c - n - 0.02, r] }, at: [0, (c + n) / 2, -l / 2 + r / 2], fill: i.seat },
    // Footrests: a bar in front, low, with two plates.
    { id: "footrest", shape: { type: "box", size: [e * 0.8, 0.02, 0.14] }, at: [0, 0.12, l / 2 + 0.22], fill: i.frame }
  ];
  for (const [p, m] of [[-1, "left"], [1, "right"]]) {
    const b = p * u, k = (w, y, S = a) => {
      f.push({ id: w, shape: { type: "tube", points: y, radius: S, segments: 6 }, fill: i.frame, outline: 0.7 });
    };
    k(`post-${m}`, [[b, n - 0.1, -l / 2], [b, c + 0.04, -l / 2], [b, c + 0.04, -l / 2 - 0.14]]), k(`rail-${m}`, [[b, n - 0.03, -l / 2], [b, n - 0.03, l / 2]]), k(`leg-${m}`, [[b, n - 0.03, l / 2], [b * 0.85, o, l / 2 + 0.06]]), k(`strut-${m}`, [[b * 0.85, o + 0.08, l / 2 + 0.04], [b * 0.8, 0.13, l / 2 + 0.22]]), k(`armrest-${m}`, [[b, n + 0.22, -l / 2 + 0.02], [b, n + 0.22, l / 2 - 0.08]], a * 1.3), f.push({
      id: `wheel-${m}`,
      shape: { type: "cylinder", radius: s, length: 0.04, axis: "x", segments: 20, spokes: 8 },
      at: [b + p * 0.03, s, h],
      ink: i.tyre,
      outline: 1.3
    }), f.push({ id: `rim-${m}`, shape: { type: "cylinder", radius: s * 0.9, length: 0.012, axis: "x", segments: 20 }, at: [p * 0.045, 0, 0], parent: `wheel-${m}`, ink: i.frame, outline: 0.8 }), f.push({
      id: `castor-${m}`,
      shape: { type: "cylinder", radius: o, length: 0.03, axis: "x", segments: 12, spokes: 3 },
      at: [b * 0.85, o, l / 2 + 0.06],
      fill: i.tyre
    });
  }
  const d = f.map((p) => p.id).filter((p) => !p.startsWith("rim-")), g = {
    parts: f,
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
        bind: [{ parts: d, rotate: { axis: "x", degrees: 1, pivot: [0, s, h] } }]
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
    actions: yv(s),
    acting: mv,
    colors: { body: i.seat, ink: i.frame },
    wheelRadius: s,
    moves: { roll: { speed: td, perMetre: { wheelSpin: 180 / (Math.PI * s) } } }
  };
}
const mv = {
  depth: { wheelSpin: 0, tip: 1, roll: 1, squash: 1, size: 0 },
  limits: { tip: 2, roll: 1, squash: 0.03 },
  eyes: [],
  headTurns: {},
  drift: []
};
function jh(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
function yv(t) {
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
        const r = Math.abs(n.to - e.x), a = n.for ?? Math.max(300, r / (n.speed ?? td * e.scale / 1e3));
        return e.key(i + 150, { tip: 1.5 * e.exaggeration }, { act: !1, easing: "ease-out" }), jh(e, i, i + a, n.to, "ease-in-out", t), e.key(i + a, { tip: 0 }, { easing: "ease-out" }), { end: i + a };
      }
    },
    brake: {
      summary: "Stops short at `to`: the wheels lock and it skids the last bit, tipping forward a touch.",
      needs: ["to"],
      uses: ["for"],
      run(e, n, s) {
        if (Math.sign(n.to - e.x) === 0) return { end: s };
        const i = n.for ?? 500;
        return jh(e, s, s + i, n.to, "ease-out", t, !0), e.key(s + i, { tip: 0 }, { easing: "ease-out" }), e.effect({ kind: "dust", time: s + i * 0.5, x: n.to, y: e.floor, length: 500 }), { end: s + i, contact: s + i };
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
function bv(t = {}) {
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
    actions: wv(),
    acting: ed,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: Pe * 1e3 } } }
  };
}
const ed = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, Pe = 2.6;
function wv() {
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
        t(n, o, o + 900, Pe, "ease-in"), n.key(o + 900, { blur: 1 }, { act: !1, easing: "ease-in" }), n.key(o + 700, { squash: 1 - 0.08 * i }, { act: !1, easing: "ease-in" });
        const a = o + 1e3;
        return n.key(a + 150, { squash: 1 + 0.06 * i, lift: 0.3 }, { act: !1, easing: "ease-out" }), n.key(a + 1300, { squash: 1, lift: r, pitch: -4 * i }, { act: !1, easing: "ease-in-out" }), n.key(a + 1700, { pitch: 0 }), t(n, o + 900, a + 1700, Pe), n.effect({ kind: "dust", time: a, x: n.x, y: n.floor, length: 900 }), { end: a + 1700, contact: a };
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
        return n.key(a + 300, { pitch: -9 * i, roll: 6 * i }, { act: !1, easing: "ease-out" }), n.key(a + c - 250, { pitch: -4 * i, roll: 3 * i, lift: h }, { act: !1 }), n.key(a + c, { pitch: 7 * i, roll: 0 }, { act: !1, easing: "ease-out" }), n.key(a + c + 450, { pitch: 0 }), n.move(a, a + c, s.to, { easing: "ease-in-out" }), t(n, o, a + c + 450, Pe), { end: a + c + 450, contact: a, release: a + c };
      }
    },
    hover: {
      summary: "Hovers in place for `for` ms (default 2000), bobbing gently.",
      uses: ["for"],
      run(n, s, o) {
        const i = s.for ?? 2e3, r = n.values.lift, a = n.exaggeration;
        for (let l = 350, c = 0; l < i; l += 350, c++)
          n.key(o + l, { lift: r + (c % 2 === 0 ? 0.12 : -0.06) * a, roll: (c % 2 === 0 ? 1.5 : -1.5) * a }, { act: !1, easing: "ease-in-out" });
        return n.key(o + i, { lift: r, roll: 0 }, { act: !1, easing: "ease-in-out" }), (e(n) || r > 0) && t(n, o, o + i, Pe), { end: o + i };
      }
    },
    land: {
      summary: "Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.",
      run(n, s, o) {
        const i = n.exaggeration, r = o + Math.max(900, n.values.lift * 450);
        return n.key(o + 400, { pitch: 3 * i }, { act: !1, easing: "ease-out" }), n.key(r, { lift: 0, pitch: 0, squash: 1 - 0.14 * i }, { act: !1, easing: "ease-in" }), n.key(r + 280, { squash: 1 }), t(n, o, r, Pe), t(n, r, r + 1600, Pe, "ease-out"), n.key(r + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: r, x: n.x, y: n.floor, length: 800 }), { end: r + 1600, contact: r };
      }
    }
  };
}
function kv(t = {}) {
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
    actions: Mv(),
    acting: ed,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: Pe * 1e3 } } }
  };
}
const vv = 3.2;
function Mv() {
  const t = (n, s, o, i) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", o, r + vv * (o - s) * (i ? 0.5 : 1), i);
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
        for (let f = 1; f <= l; f++) {
          const d = Math.PI * 2 * f / l, g = o + i * f / l;
          n.key(g, { lift: h + r * (1 - Math.cos(d)), pitch: u + 360 * f / l }, { act: !1 }), n.move(o + i * (f - 1) / l, g, c + a * (r * Math.sin(d) + f / l * r * 1.2) * n.scale);
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
const Rs = ["walk", "trot", "canter", "gallop"], o3 = Rs, nd = ["fl", "fr", "hl", "hr"], yi = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, He = Math.PI / 180;
function Za(t, e) {
  return 4 * t * Math.sin(yi[e].swing * He);
}
function cn(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, o = s + t.body.rise, i = (u, f) => [f * u[0], u[1], u[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, o, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((u, f, d) => t.neck.radius * (1.25 - 0.4 * f / Math.max(1, d.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...Sv(t, n, o)
  ];
  t.mane && r.push({ id: "mane", parent: "neck", shape: { type: "tube", points: t.mane.points, radius: t.mane.radius, segments: 6 }, fill: n.dark, outline: 0.7 }), t.muzzle && r.push({ id: "muzzle", parent: "head", shape: { type: "ellipsoid", radii: t.muzzle.radii, segments: 10 }, at: t.muzzle.at, fill: n.muzzle, outline: 0.8 });
  for (const u of [1, -1]) {
    const f = u > 0 ? "left" : "right", d = t.ears.rotate ? i(t.ears.rotate, 1).map((g, p) => p === 2 ? u * g : g) : void 0;
    r.push(
      { id: `ear-${f}`, parent: "head", shape: { type: "ellipsoid", radii: t.ears.radii, segments: 8 }, at: i(t.ears.at, u), rotate: d, fill: n.coat, outline: 0.7 },
      { id: `eye-${f}`, parent: "head", shape: { type: "ellipsoid", radii: [t.eyes.size * 0.8, t.eyes.size, t.eyes.size * 0.9], segments: 8 }, at: i(t.eyes.at, u), fill: "#1d1d22", outline: 0.4 }
    );
  }
  r.push(...t.extras?.(n) ?? []);
  const a = {
    walk: { description: "Phase of the stride, in full cycles (keyed in step with the distance covered)", unit: "cycles" },
    walking: { description: "How much of the gait is applied: 0 standing, 1 moving", unit: "0..1", min: 0, max: 1 },
    gait: { description: `Which gait: ${t.gaits.map((u) => `${Rs.indexOf(u)} ${u}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: oe, rotate: { axis: "x", degrees: 1 / oe.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: oe, rotate: { axis: "y", degrees: 1 / oe.length } }] },
    // The ears hinge at their base: laid back on a run, on a spring behind the motion.
    ears: { description: "Ears pricked forward (+) or laid back (−), on a spring behind the motion", unit: "degrees", bind: [{ parts: ["ear-left", "ear-right"], rotate: { axis: "x", degrees: 1, pivot: [0, -t.ears.radii[1], 0] } }] }
  };
  for (const u of nd) {
    const f = u[0] === "f", d = u[1] === "l" ? 1 : -1, g = f ? e.thickness[0] : e.thickness[1];
    r.push(
      // Tapered from the hip down, a rounded knee, a tapered lower leg and a rounded paw or hoof.
      { id: `${u}-upper`, shape: { type: "tube", points: [[0, e.upper * 0.2, 0], [0, -e.upper * 0.5, 0], [0, -e.upper, 0]], radius: [g, g * 0.85, e.lowerThickness * 1.15], segments: 10 }, at: [d * e.across, s, f ? e.front : e.hind], fill: n.coat },
      { id: `${u}-knee`, parent: `${u}-upper`, shape: { type: "ellipsoid", radii: Array(3).fill(e.lowerThickness * 1.08), segments: 10 }, at: [0, -e.upper, 0], fill: n.coat, solidOnly: !0 },
      { id: `${u}-lower`, parent: `${u}-upper`, shape: { type: "tube", points: [[0, 0, 0], [0, -e.lower, 0]], radius: [e.lowerThickness * 1.1, e.lowerThickness * 0.85], segments: 10 }, at: [0, -e.upper, 0], fill: n.coat },
      { id: `${u}-foot`, parent: `${u}-lower`, shape: { type: "ellipsoid", radii: [e.footSize[0] / 2, e.foot / 2 + 4e-3, e.footSize[1] / 2], segments: 12 }, at: [0, -e.lower - e.foot / 2, e.footSize[1] * 0.12], fill: n.foot, outline: 0.8 }
    );
    const p = `${f ? "Front" : "Hind"} ${d > 0 ? "left" : "right"} leg`;
    a[`${u}.swing`] = { description: `${p}: forward (+) or back (−) from the hip`, unit: "degrees", bind: [{ parts: [`${u}-upper`], rotate: { axis: "x", degrees: -1 } }] }, a[`${u}.knee`] = { description: `${p}: knee (hock) folded`, unit: "degrees", bind: [{ parts: [`${u}-lower`], rotate: { axis: "x", degrees: f ? 1 : -1 } }] }, a[`${u}.ankle`] = { description: `${p}: foot turned at the ankle (+ toe forward)`, unit: "degrees", bind: [{ parts: [`${u}-foot`], rotate: { axis: "x", degrees: -1, pivot: [0, e.foot / 2, -e.footSize[1] * 0.12] } }] };
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
    derive: (u) => Tv(u, t, s)
  }, h = {
    legLength: s,
    upper: e.upper,
    lower: e.lower,
    foot: e.foot,
    tailHangs: t.tail.points[t.tail.points.length - 1][1] < 0,
    front: e.front,
    hind: e.hind,
    call(u, f) {
      const d = u.anchor("mouth");
      u.effect({ kind: "honk", time: f, x: d.x, y: d.y, length: 800, direction: u.facing() || 1 });
    }
  };
  return {
    kind: t.kind,
    family: "animal",
    summary: t.summary,
    rig: c,
    actions: { ...Av(t, h), ...t.actions?.(h) },
    acting: sd,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [
      { control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 },
      { control: "ears", of: "x", per: 1.4, stiffness: 150, damping: 8, limit: 45 }
    ],
    moves: xv(t, s)
  };
}
function xv(t, e) {
  const n = (o) => {
    const i = Za(e, o);
    return {
      speed: i / (yi[o].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: Rs.indexOf(o) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / i }
    };
  }, s = Object.fromEntries(t.gaits.map((o) => [o === "gallop" && !t.gaits.includes("canter") ? "run" : o, n(o)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const oe = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function Sv(t, e, n) {
  const s = Tf(t.tail.points, oe.length + 1), [, o, i] = t.body.radii, r = (t.tail.at[1] - n) / o, a = Math.abs(r) < 1 ? -i * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, i * 0.08)], c = (d) => t.tail.radius * (1 - 0.5 * d / oe.length), h = oe.map((d, g) => {
    const p = s[g], m = s[g + 1], b = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], k = g === 0 ? void 0 : s[g - 1];
    return {
      id: d,
      ...g > 0 ? { parent: oe[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], b], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - k[0], p[1] - k[1], p[2] - k[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), u = s[s.length - 1], f = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: oe[oe.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(oe.length) * 1.05), segments: 8 },
    at: [u[0] - f[0], u[1] - f[1], u[2] - f[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function Tv(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const o = Rs[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], i = yi[e.gaits.includes(o) ? o : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of nd) {
    const h = Math.PI * 2 * (r + i.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * i.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * i.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * i.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * i.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (i.rock > 0 ? -i.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function Xh(t) {
  const n = Math.sin(32 * He), s = t.legLength - (t.front - t.hind) * n, o = 72, r = (s - t.upper * Math.cos(o * He) - t.foot) / t.lower, a = r >= 1 ? 0 : r <= -1 ? 180 : Math.acos(r) / He, l = {
    pitch: 32,
    // The front hips stay at standing height: tipping up raises them by front · sin, and swinging them round the
    // middle lowers them by leg · (1 − cos); the front legs are held upright, so both are taken back.
    lift: t.legLength * (1 - Math.cos(32 * He)) - t.front * n,
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
const sd = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, i3 = sd;
function Ev(t) {
  const e = (t.upper + t.lower) * 0.32, n = Math.asin(Math.min(1, e / (t.upper + t.lower + t.foot))) / He, s = {
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
function Av(t, e) {
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
      const f = a.exaggeration;
      a.key(u + 180, { neck: -12 * f }, { act: !1, easing: "ease-out" });
      const g = Math.abs(l.to - a.x) / a.scale / Za(e.legLength, r), p = l.for ?? Math.max(500, g * yi[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", u, a.values.gait ?? 0), a.set("gait", u + 1, Rs.indexOf(r)), a.set("walking", u, 0), a.set("walking", u + 240, 1, "ease-out"), a.set("walking", u + p - 240, 1), a.set("walking", u + p, 0, "ease-in"), a.set("walk", u, m), a.move(u, u + p, l.to, { easing: "ease-in-out" }), a.set("walk", u + p, m + g, "ease-in-out"), a.key(u + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: u + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: u + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: u + p + 300, contact: u, release: u + p };
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
        const c = Xh(e), h = l + 450;
        r.key(h, c, { act: !1, easing: "ease-in-out" }), r.key(h + (a.for ?? 1500), c, { act: !1 });
        const u = h + (a.for ?? 1500) + 450, f = {};
        for (const d of Object.keys(c)) f[d] = 0;
        return r.key(u, f), { end: u, contact: h, release: u - 450 };
      }
    },
    lie: {
      summary: "Lies down for `for` ms (default 2000), head up and front paws forward (sinking back onto its haunches first), then gets up.",
      uses: ["for"],
      run(r, a, l) {
        const c = Ev(e), h = { ...Xh(e) }, u = l + 400, f = u + 450;
        r.key(u, h, { act: !1, easing: "ease-in-out" }), r.key(f, c, { act: !1, easing: "ease-in-out" }), r.key(f + (a.for ?? 2e3), c, { act: !1 });
        const d = f + (a.for ?? 2e3) + 600, g = {};
        for (const p of /* @__PURE__ */ new Set([...Object.keys(c), ...Object.keys(h)])) g[p] = 0;
        return r.key(d, g), { end: d, contact: f, release: d - 600 };
      }
    },
    jump: {
      summary: "Crouches and jumps (forward to `to`, or up on the spot), legs tucked in the air, landing with a squash and dust.",
      uses: ["to"],
      run(r, a, l) {
        const c = r.exaggeration, h = e.legLength * 0.8 * c, u = l + 260, f = u + 90, d = f + 520;
        if (r.key(u, { squash: 0.86, "hl.knee": 40, "hr.knee": 40, "fl.knee": 25, "fr.knee": 25, neck: 8 }, { act: !1, easing: "ease-out" }), r.key(f, { squash: 1.12, "hl.knee": 0, "hr.knee": 0, "fl.knee": 0, "fr.knee": 0, pitch: 8, "fl.swing": 35, "fr.swing": 35, "hl.swing": -35, "hr.swing": -35 }, { act: !1, easing: "ease-out" }), r.key((f + d) / 2, { lift: h, squash: 1, pitch: 0, "fl.knee": 60, "fr.knee": 60, "hl.knee": 60, "hr.knee": 60, "fl.swing": 25, "fr.swing": 25, "hl.swing": -20, "hr.swing": -20 }, { act: !1, easing: "ease-out" }), r.key(d, { lift: 0, squash: 0.85, pitch: -4, "fl.knee": 0, "fr.knee": 0, "hl.knee": 0, "hr.knee": 0, "fl.swing": 0, "fr.swing": 0, "hl.swing": 0, "hr.swing": 0 }, { act: !1, easing: "ease-in" }), r.key(d + 280, { squash: 1, pitch: 0, neck: 0 }), a.to !== void 0) {
          const g = Math.sign(a.to - r.x);
          g !== 0 && r.facing() !== g && r.turnTo(l, g > 0 ? "right" : "left"), r.move(f, d, a.to);
        }
        return r.effect({ kind: "dust", time: d, x: r.x, y: r.floor, length: 550 }), { end: d + 280, contact: d };
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
function $v(t = {}) {
  return cn({
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
          const i = n.exaggeration, r = Math.min(55, 32 * i), a = -e.hind * Math.sin(r * He), l = s.for ?? 700;
          n.key(o + 200, { pitch: -4, neck: 6, "hl.knee": 12, "hr.knee": 12 }, { act: !1, easing: "ease-out" }), n.key(o + 520, { pitch: r, lift: a, neck: -25, "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-out" }), n.key(o + 520 + l * 0.5, { "fl.swing": 35, "fl.knee": 70, "fr.swing": 58, "fr.knee": 100 }, { act: !1, easing: "ease-in-out" }), n.key(o + 520 + l, { "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80 }, { act: !1, easing: "ease-in-out" });
          const c = o + 520 + l + 380;
          return n.key(c, { pitch: 0, lift: 0, neck: 8, squash: 0.94, "fl.swing": 0, "fl.knee": 0, "fr.swing": 0, "fr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(c + 320, { neck: 0, squash: 1 }), e.call(n, o + 520), n.effect({ kind: "dust", time: c, x: n.x + (n.facing() || 1) * e.front * n.scale, y: n.floor, length: 600 }), { end: c + 320, contact: c };
        }
      },
      buck: {
        summary: "Bucks: drops its head and kicks both hind legs up and back.",
        run(n, s, o) {
          const i = n.exaggeration, r = Math.min(35, 18 * i), a = e.front * Math.sin(r * He);
          return n.key(o + 220, { pitch: 3, squash: 0.95 }, { act: !1, easing: "ease-out" }), n.key(o + 480, { pitch: -r, lift: a, neck: 30, "hl.swing": -65, "hr.swing": -60, "hl.knee": 10, "hr.knee": 10 }, { act: !1, easing: "ease-out" }), n.key(o + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, "hl.swing": 0, "hr.swing": 0, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(o + 1150, { squash: 1 }), n.effect({ kind: "dust", time: o + 900, x: n.x - (n.facing() || 1) * 0.6 * n.scale, y: n.floor, length: 600 }), { end: o + 1150, contact: o + 480 };
        }
      }
    })
  });
}
function Pv(t = {}) {
  return cn({
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
function Iv(t = {}) {
  return cn({
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
function Ov(t = {}) {
  return cn({
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
function r3(t) {
  return Za(1, t);
}
function _v(t = {}) {
  return cn({
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
function Hv(t = {}) {
  return cn({
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
function Cv(t = {}) {
  return cn({
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
const Se = 0.6, od = 75, hr = 80;
function hn(t) {
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
    const u = h > 0 ? "left" : "right", f = t.head.radius;
    a.push({ id: `eye-${u}`, parent: "head", shape: { type: "ellipsoid", radii: [f * 0.16, f * 0.2, f * 0.18], segments: 8 }, at: [h * f * 0.72, f * 0.18, f * 0.42], fill: "#1d1d22", outline: 0.3 }), a.push({
      id: `wing-${u}`,
      shape: { type: "ellipsoid", radii: [4e-3, 4e-3, 4e-3], segments: 4 },
      at: [h * t.wing.shoulder[0], t.wing.shoulder[1], t.wing.shoulder[2]],
      rotate: [-8, h * 90, 0],
      outline: 0
    }), a.push({
      id: `wing-${u}-blade`,
      parent: `wing-${u}`,
      shape: { type: "ellipsoid", radii: [t.wing.span * Se / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * Se / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-hr, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${u}-tip`,
      parent: `wing-${u}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * Se / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * Se / 4, 0, -t.wing.chord * 0.3],
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
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - Se) / 2, 0, 0], rotate: { axis: "x", degrees: hr }, scale: [1 / Se, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - Se) / 2, 0, 0], rotate: { axis: "x", degrees: hr }, scale: [1 / Se, 1, 1] }
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
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / od, 0] }]
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
      const u = {}, f = Math.max(0, Math.min(1, h.flapping ?? 0));
      f > 0 && (u.flap = (h.flap ?? 0) + f * 48 * Math.sin(Math.PI * 2 * (h.wingbeat ?? 0)));
      const d = Math.max(0, Math.min(1, h.stepping ?? 0));
      if (d > 0) {
        const g = Math.sin(Math.PI * 2 * (h.step ?? 0));
        u["leg.left"] = (h["leg.left"] ?? 0) + d * 28 * g, u["leg.right"] = (h["leg.right"] ?? 0) - d * 28 * g, u.peck = (h.peck ?? 0) + d * 12 * Math.sin(Math.PI * 4 * (h.step ?? 0));
      }
      return u;
    }
  };
  return {
    kind: t.kind,
    family: "bird",
    summary: t.summary,
    rig: c,
    actions: Wv(t),
    acting: Lv,
    colors: { body: e.body, ink: "#26262b" },
    moves: Rv(t)
  };
}
function Rv(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const Lv = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Wv(t) {
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
        const c = s(r, l, a.to), h = r.x, u = Math.abs(a.to - h), f = Math.max(1, Math.round(u / (t.body.radii[2] * 3 * r.scale))), d = 260;
        for (let g = 0; g < f; g++) {
          const p = c + g * d;
          r.key(p + 60, { squash: 0.85 }, { act: !1, easing: "ease-out" }), r.key(p + 150, { squash: 1.1, lift: t.legs.length * 1.4, spread: 0.15 }, { act: !1, easing: "ease-out" }), r.key(p + d, { squash: 0.9, lift: 0, spread: 0 }, { act: !1, easing: "ease-in" }), r.move(p + 60, p + d, h + (a.to - h) * (g + 1) / f, { easing: "ease-in-out" });
        }
        return r.key(c + f * d + 120, { squash: 1 }), { end: c + f * d + 120 };
      }
    },
    walk: {
      summary: "Walks to `to` on its two legs, its head bobbing with each step.",
      needs: ["to"],
      uses: ["for"],
      run(r, a, l) {
        const c = s(r, l, a.to), h = Math.abs(a.to - r.x) / r.scale, u = t.legs.length * 1.2, f = h / u, d = a.for ?? Math.max(400, f * 420), g = r.values.step ?? 0;
        return r.set("stepping", c, 0), r.set("stepping", c + 150, 1, "ease-out"), r.set("stepping", c + d - 150, 1), r.set("stepping", c + d, 0, "ease-in"), r.set("step", c, g), r.move(c, c + d, a.to, { easing: "ease-in-out" }), r.set("step", c + d, g + f / 2, "ease-in-out"), { end: c + d, contact: c, release: c + d };
      }
    },
    peck: {
      summary: "Pecks at the ground (`for` ms, default 900): quick jabs of the head.",
      uses: ["for"],
      run(r, a, l) {
        const c = a.for ?? 900, h = Math.max(1, Math.round(c / 300));
        r.key(l + 120, { pitch: -(t.stoop ?? 12) }, { act: !1, easing: "ease-out" });
        for (let u = 0; u < h; u++)
          r.key(l + 120 + u * 300 + 90, { peck: od }, { act: !1, easing: "ease-in" }), r.key(l + 120 + u * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
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
      const h = s(r, l, a.to), u = a.height ?? 2, f = a.for ?? Math.max(700, Math.abs(a.to - r.x) / 0.35), d = r.values.lift > t.legs.length, g = d ? h : h + 200;
      return d || (r.key(h + 160, { squash: 1 - 0.18 * c, spread: 0.6 }, { act: !1, easing: "ease-out" }), r.effect({ kind: "dust", time: g, x: r.x, y: r.floor, length: 400 })), r.key(g + 100, { spread: 1, squash: 1.08, pitch: 10 }, { act: !1, easing: "ease-out" }), r.set("flapping", g, r.values.flapping ?? 0), r.set("flapping", g + 100, 1, "ease-out"), r.set("flapping", g + f, 0.6), n(r, g, g + f), r.key(g + f * 0.4, { lift: u, pitch: -5, squash: 1 }, { act: !1, easing: "ease-out" }), r.key(g + f, { lift: u, pitch: 0 }, { act: !1, easing: "ease-in-out" }), r.move(g, g + f, a.to, { easing: "ease-in-out" }), { end: g + f, contact: g, release: g + f };
    }
  }, i.glide = {
    summary: "Glides to `to` on still, spread wings, sinking gently to `height` metres (default: a third lower than it is); from the ground it takes off first, flying the first stretch.",
    needs: ["to"],
    uses: ["height", "for"],
    run(r, a, l) {
      let c = l;
      if (r.values.lift <= t.legs.length) {
        const d = r.x + (a.to - r.x) / 3;
        c = i.fly.run(r, { do: "fly", to: d, height: (a.height ?? 1.5) * 1.3 }, l).end;
      }
      c = s(r, c, a.to);
      const h = r.values.lift, u = a.height ?? h * 0.67, f = a.for ?? Math.max(900, Math.abs(a.to - r.x) / 0.3);
      return r.set("flapping", c, r.values.flapping ?? 1), r.set("flapping", c + 250, 0, "ease-out"), n(r, c, c + 250), r.key(c + 300, { spread: 1, flap: 10, pitch: -6 }, { act: !1, easing: "ease-out" }), r.key(c + f, { lift: u, pitch: -3, flap: 10 }, { act: !1, easing: "ease-in-out" }), r.move(c, c + f, a.to, { easing: "ease-in-out" }), { end: c + f, contact: c, release: c + f };
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
function Fv(t = {}) {
  return hn({
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
function Nv(t = {}) {
  return hn({
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
function Dv(t = {}) {
  return hn({
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
function Bv(t = {}) {
  return hn({
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
function zv(t = {}) {
  return hn({
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
function qv(t = {}) {
  return hn({
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
function Yv(t = {}) {
  return hn({
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
const Es = { car: K5, truck: j5, bus: X5, tractor: U5, cart: G5, trainCar: V5, bike: J5, motorbike: Z5, tree: Q5, house: nv, chair: iv, desk: lv, bed: hv, door: fv, wheelchair: gv, helicopter: bv, airplane: kv, horse: $v, dog: Pv, cat: Iv, cow: Ov, goat: _v, rabbit: Hv, squirrel: Cv, songbird: Fv, crow: Nv, chicken: Dv, pigeon: Bv, duck: zv, owl: qv, parrot: Yv };
function id(t, e = {}) {
  const n = Es[t];
  if (!n) throw new Error(ft("prop preset", t, Object.keys(Es)));
  return n(e);
}
const ta = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], ea = { viewer: 0, right: 1, away: 2, left: 3 }, Kv = 420, rd = {
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
function Qa(t) {
  return { ...rd, ...t.actions };
}
const ur = (t) => typeof t == "number" && Number.isFinite(t);
function jv(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Qa(e), s = Object.keys(n), o = [];
  return t.forEach((i, r) => {
    const a = (c) => o.push({ level: "error", beat: r, message: c });
    if (!i || typeof i != "object" || Array.isArray(i)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = i;
    for (const c of Object.keys(l))
      ta.includes(c) || a(ft("beat field", c, ta, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(ft(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(ur(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !ur(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !ur(l.toward) && !(typeof l.toward == "string" && l.toward in ea)) {
      const c = typeof l.toward == "string" ? bo(l.toward, Object.keys(ea)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), o;
}
function Xv(t, e, n, s = {}) {
  const o = jv(n, e).filter((M) => M.level === "error");
  if (o.length > 0) throw new Error(`propScript (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((M) => `  beat ${M.beat}: ${M.message}`).join(`
`)}`);
  const i = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = Qa(e), h = {};
  for (const M of [...Object.keys(Hs), ...Object.keys(e.rig.controls)]) h[M] = s.start?.[M] ?? Et(e.rig, {}, M);
  const u = [{ time: 0, pose: { ...h } }], f = /* @__PURE__ */ new Map(), d = [];
  let g = i, p = r;
  const m = (M, T, A, E) => {
    const P = f.get(M) ?? [{ time: 0, value: M === "x" || M === "y" ? 0 : h[M] }];
    P.push({ time: T, value: A, ...E ? { easing: E } : {} }), f.set(M, P), M !== "x" && M !== "y" && (h[M] = A);
  }, b = (M, T) => {
    const A = M === "x" ? g - i : M === "y" ? p - r : h[M], E = f.get(M);
    (!E || E[E.length - 1].time < T) && m(M, T, A);
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
    key(M, T, A = {}) {
      Object.assign(h, T), u.push({ time: M, pose: { ...h }, ...A.act === !1 ? { act: !1 } : {}, ...A.easing ? { easing: A.easing } : {} });
    },
    move(M, T, A, E = {}) {
      b("x", M), m("x", T, A - i, E.easing), g = A, E.floor !== void 0 && (b("y", M), m("y", T, E.floor - r, E.easing), p = E.floor);
    },
    set(M, T, A, E) {
      m(M, T, A, E);
    },
    turnTo(M, T) {
      const A = typeof T == "number" ? T : ea[T], E = h.turn, O = [A - 4, A, A + 4].map((q) => ({ t: q, d: Math.abs(q - E) })).sort((q, G) => q.d - G.d || Math.abs(q.t) - Math.abs(G.t))[0];
      if (O.d < 1e-3) return M;
      const L = M + Kv * Math.max(1, O.d);
      return k.key(L, { turn: O.t }), L;
    },
    effect(M) {
      d.push(M);
    },
    anchor(M) {
      const A = Cs(e, h, a).anchors[M];
      if (!A) throw new Error(`${e.kind}: no anchor "${M}"`);
      return { x: g + A.point.x, y: p + A.point.y };
    }
  }, w = [];
  let y = 0;
  for (const M of n) {
    const T = Math.max(M.at ?? y, u[u.length - 1].time), A = c[M.do].run(k, M, T);
    A.end > u[u.length - 1].time && u.push({ time: A.end, pose: { ...h } }), w.push({ start: T, end: A.end, ...A.contact !== void 0 ? { contact: A.contact } : {}, ...A.release !== void 0 ? { release: A.release } : {} }), y = A.end;
  }
  const S = Ff(s.style ?? "snappy"), $ = { ...S, anticipation: S.anticipation * l, overshoot: S.overshoot * l }, v = Ka(Jv(u), e.acting, { style: $ }), x = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(v).filter(([M]) => !f.has(M)).map(([M, T]) => ({ id: `${t}-${M}`, target: t, property: M, keyframes: T })),
    ...[...f].map(([M, T]) => ({ id: `${t}-${M}`, target: t, property: M, keyframes: Zv(T) }))
  ];
  for (const M of Gv(t, e, x, y, u[0].pose)) {
    const T = x.findIndex((P) => P.property === M.property);
    if (T < 0) {
      x.push(M);
      continue;
    }
    const A = new _t({ id: `${t}-own`, tracks: [x[T]] }), E = (P) => Number(A.getStateAtTime(P).values.get(t)?.get(M.property) ?? 0);
    x[T] = { ...M, keyframes: M.keyframes.map((P) => ({ time: P.time, value: Number(P.value) + E(P.time) })) };
  }
  return { tracks: x, duration: y, beats: w, effects: d };
}
const Uv = 1500;
function Gv(t, e, n, s, o) {
  if (!e.follow?.length) return [];
  const i = new _t({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = i.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : o[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + Uv, c = io((f) => r(f, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, u = c.map(({ time: f, value: d }) => {
      const g = Math.sin(r(f, "turn") * Math.PI / 2), p = (d - r(f, a.of)) * g;
      return { time: f, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: u };
  });
}
const Vv = 20;
function Jv(t) {
  const e = [...t].sort((s, o) => s.time - o.time), n = [];
  for (const s of e) {
    const o = n[n.length - 1];
    o && s.time - o.time < Vv ? n[n.length - 1] = { ...s, time: o.time } : n.push(s);
  }
  return n;
}
function Zv(t) {
  const e = t.map((s, o) => ({ k: s, i: o })).sort((s, o) => s.k.time - o.k.time || s.i - o.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const Qv = {
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
function tM(t, e = {}) {
  const n = {};
  for (const s of Object.keys(Yt)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(ee)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(on)) n[s] = { summary: `The ${s} gag (${zo(s)} ms).` };
  for (const [s, o] of Object.entries(mi)) n[s] = { ...o };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(Qv),
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
    canvasProperties: Ua,
    stickFigure: {
      poseFields: Z0,
      props: Q0,
      handFields: tu,
      poses: Object.keys(ee),
      expressions: Object.keys(vt),
      gags: Object.fromEntries(Object.keys(on).map((s) => [s, zo(s)])),
      gaits: Object.keys(Yt),
      actingStyles: Object.keys(Hn),
      beatFields: Vr,
      actions: n,
      dances: Object.fromEntries(Object.entries(an).map(([s, o]) => [s, Object.keys(o.moves)])),
      flips: Object.fromEntries(Object.entries(fi).map(([s, o]) => [s, o.label])),
      handShapes: Object.keys(Ot),
      mudras: Object.keys(Hr)
    },
    props: {
      api: {
        "car() · truck() · bus() · tractor() · cart() · trainCar() · bike() · motorbike()": "wheeled vehicles (vehicle(spec) makes your own)",
        "tree() · house()": "environment (tree(spec), house(spec))",
        "helicopter() · airplane()": "aircraft",
        "horse() · dog() · cat() · cow()": "animals (quadruped(spec) makes your own): gaits with footfall patterns keyed in step with the distance, sit, jump, their calls, species actions",
        "songbird() · crow() · chicken()": "birds (bird(spec) makes your own): hop, walk, peck, flap, fly and land (a chicken flutters), their calls; wings fold and beat in rhythm",
        "{ kind: 'prop', prop: 'car', position, rotation, values } with loadScene3D(scene, { kinds: [characterObjects, propObjects] })": "props in 3D scenes, by preset name, seen in perspective by the scene camera; controls are tracks on the object",
        "characterScript3D(id, beats, { scene, position?, heading?, height?, pose? })": "a v2 character in world metres: gaits, face (shortest turn), spin (signed turns and duration), dance (native style, bpm, beats), hold, pose, gag; checkCharacterBeats3D checks the beats",
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
      beatFields: ta,
      commonControls: Object.fromEntries(Object.entries(Hs).map(([s, o]) => [s, `${o.description}${o.unit ? ` (${o.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(rd).map(([s, o]) => [s, o.summary])),
      presets: Object.fromEntries(
        Object.entries(Es).map(([s, o]) => {
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
      figureStyles: ["fluid", "stick", "organic"],
      body: {
        "body.torso · body.arm · body.leg · body.neck": "Organic half-width profiles: [{ at: 0..1, width: fractionOfHeight }], increasing from 0 to 1; independent of ink width.",
        "body.fill · body.outline · body.shading": "Shared skin fill, outline { color, width }, cel material { mode: cel | none, light: [x,y], shadow, opacity, highlight }.",
        "softCartoonCharacter(name, options?)": "Original youngMan / youngWoman / childBoy / childGirl story presets. Children have larger head proportions, shorter limbs and rounded torsos; every face, hair, build, hand, clothing and material option can be overridden.",
        "face.projection": "Organic default volume follows the head axes, keeps both eyes in three-quarter views and projects a small nose above the mouth; opaque hair covers features. cartoon keeps the classic face slide.",
        "outfitPreset(category, overrides?)": "Fresh JSON Everyday / Formal / Casual wardrobe defaults for every actor; top: tshirt | shirt | blouse | dress, trouserStyle: plain | jeans | cargo, colours, sleeves, bottoms, collar and tie are editable.",
        leafOutfit: "Organic-only JSON garment { top?, color?, accent?, length? }; curved leaves follow torso/thighs at native part depths. Everyday basicOutfit also follows organic contours."
      },
      poses: Object.keys(fe),
      dances: Object.keys(zn),
      expressions: Object.keys(Eu),
      faceStyles: ["simple", "anime"],
      faceShapes: ["round", "angular"],
      gags: Object.keys(_a),
      builds: Object.keys(Rr),
      hair: Object.keys(Lu),
      hairColors: { ...we },
      facialHair: Object.keys(ju),
      glasses: Object.keys(Uu),
      hats: Object.keys(Oa),
      feet: [...Jy],
      cast: Object.keys(Wf),
      heldItems: Object.fromEntries(Object.entries(rf).map(([s, o]) => [s, o.hands])),
      handMeetings: Object.keys(Bo)
    },
    codePanel: {
      languages: Xr,
      removeStyles: jr,
      anchors: {
        "line(n, time?)": "line n’s text box { x, y, left, right, top, bottom, width, height }: stand on top, point at x, y",
        "token(n, text, occurrence?, time?)": "a word on a line",
        "spot(n, column, width?, time?)": "a place in a line, for put and write",
        "landing(piece, n, column)": "where a dropped piece will land",
        box: "the whole panel"
      },
      edits: Lf
    },
    surfaces: { code: uo, board: Ee, chart: Sn, prop: ls },
    surfaceScript: {
      "surfaceScript(figureId, { name: surface }, beats, options)": "compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)",
      "checkSurfaceBeats(beats, surfaces, cast?)": "every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions",
      "{ surface, anchor }": "a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it",
      "then: { surface, edit, anchor, at?, until?, …options }": "what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options",
      at: `a moment of the beat: ${ds.join(", ")} (default contact, or start when the beat has none); not ms`,
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
const bt = (t) => t.map((e) => `\`${e}\``).join(", "), Uh = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function a3(t, e = {}) {
  const n = tM(t, e), s = n.stickFigure;
  return [
    `# tinyfly capabilities${n.version ? ` (v${n.version})` : ""}`,
    "",
    "Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).",
    "",
    `**Timing.** ${n.timing}`,
    "",
    "## Easings",
    "",
    `Named: ${bt(n.easings.named)}.`,
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
    "Style proportions: `headSize` is a fraction of height; `armLength` multiplies both upper arm and forearm lengths (default 1, positive finite). Hands, shoulders, torso and legs retain their sizes.",
    "",
    "### Pose fields",
    "",
    "| Field | Unit | What it does |",
    "|---|---|---|",
    Uh(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Uh(s.props),
    "",
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${bt(Object.keys(s.handFields))}.`,
    "",
    `**Poses** (a beat's \`do\`, or a pose key): ${bt(s.poses)}.`,
    "",
    `**Expressions** (a beat's \`mood\`): ${bt(s.expressions)}.`,
    "",
    `**Gags** (ms): ${Object.entries(s.gags).map(([i, r]) => `\`${i}\` (${r})`).join(", ")}.`,
    "",
    `**Gaits**: ${bt(s.gaits)}. **Acting styles** (\`style\`): ${bt(s.actingStyles)}.`,
    "",
    "### Beat scripts",
    "",
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${bt(s.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
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
    `**Hand shapes**: ${bt(s.handShapes)}. **Mudras**: ${bt(s.mudras)}.`,
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
    `Prop beat fields: ${bt(n.props.beatFields)}. Every prop has the controls ${Object.keys(n.props.commonControls).map((i) => `\`${i}\``).join(", ")} and the actions ${Object.keys(n.props.commonActions).map((i) => `\`${i}\``).join(", ")}.`,
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
    `Poses: ${bt(n.character.poses)}. Expressions: ${bt(n.character.expressions)}. Gags: ${bt(n.character.gags)}.`,
    `Native dances: ${bt(n.character.dances)}; \`humanDanceFrame(style, beat, base)\` keeps body heading independent; \`humanDanceTracks(target, options)\` bakes JSON pose tracks. \`danceCircleAt(beat, { radius, count, beatsPerTurn, facing, spins })\` gives a formation with planted toes; \`danceCircleTracks(targets, options)\` bakes scene tracks. \`plantDanceFoot(partner, side, worldPoint)\` returns pose AND position; \`meetDandiya(a, b)\` solves both stick tips to one shared world point and reports unreachable contacts.`,
    "",
    "Appearance options of `character({ … })`, all plain data that turns with the head (see docs/character-appearance.md):",
    "",
    `- \`build\`: ${bt(n.character.builds)}`,
    `- \`figure\`: ${bt(n.character.figureStyles)}`,
    ...Object.entries(n.character.body).map(([i, r]) => `- \`${i}\`: ${r}`),
    `- \`hair\`: ${bt(n.character.hair)} (colours: ${bt(Object.keys(n.character.hairColors))} in \`HAIR_COLORS\`)`,
    "- Flowing hair: `softSweep`, `flowingBob`, `cascadingWaves`; editable `locks: [{ path, width, follow? }]` with cubic `{ around, up, lift? }` points (around in degrees, dimensions in head radii), `fall: { taper, wave }` and `shine` (0–1). Roots stay attached; `hairFollowTracks` also drives flexible short locks.",
    `- \`facialHair\`: ${bt(n.character.facialHair)}`,
    `- \`glasses\`: ${bt(n.character.glasses)}; \`hat\`: ${bt(n.character.hats)}; \`ears: true\`; \`face: { teeth, tongue }\` (shown when the mouth opens); \`feet\`: ${bt(n.character.feet)}`,
    "- `outfit`: `{ top: tshirt | shirt | blouse | dress, trouserStyle: plain | jeans | cargo, shirt: top colour, trousers: bottom colour, sleeves: short | long | none, bottom: trousers | shorts | skirt, collar, tie: colour, over: apron | labCoat | hoodie | cardigan | overalls | sari, overColor, shoes: boots, shoeColor }`",
    `- \`castMember(name, height)\`: ${bt(n.character.cast)}`,
    "- Face marks (pose fields, 0–1): `blush`, `tears`, `sweat`; close-up fields `pupil` (size, 1 usual), `lid` (upper lids lowered, 0–1), `bulge` (eyes out of the head, 0–1); `face: { nose: true, inPupil(ctx, pupil) }`; `drawCharacterHead(ctx, who, pose, { x, y, radius })` draws just the head big",
    `- Face styles: ${bt(n.character.faceStyles)}; \`face: { style: 'anime', iris: '#4b7fce', lashes: true, ageLines: 0.8 }\` uses coloured eyes and the same expressions, blinks and gaze. \`ANIME_CAST\` contains eight age presets, also available through \`castMember\`.`,
    `- Face shapes: ${bt(n.character.faceShapes)}; \`face: { shape: 'angular', jawWidth: 0.74, chinWidth: 0.14, eyeScale: 0.8, eyeAspect: 0.65 }\` sets a tapered 3D jaw and narrower anime eyes; \`jawRoundness: 1\` softens the cheek/chin corners (default 0 keeps sharp jaws). \`MANGA_CAST\` contains four original young adult presets; hair styles \`mangaSpikes\` and \`mangaSweep\` remain editable.`,
    "- Hair in motion (pose fields): `hair.swing` (degrees round the head, + toward its left), `hair.trail` (head radii back), `hair.lift` (head radii up); key them with `hairFollowTracks(target, tracks, who)` after the character's tracks, or `hairFollow` + `hairMotionAt` when posing per frame",
    `- \`holding\`: ${Object.entries(n.character.heldItems).map(([i, r]) => `\`${i}\` (${r === "both" ? "both" : r === "either" ? "one hand or both" : "left or right"})`).join(", ")}; pose fields \`held.left\`, \`held.right\`, \`held.both\` (below 0.5 lets go); \`handGrip(joints, side)\``,
    `- \`meetHands(kind, a, b)\` (stand them \`meetingSpacing(kind, a, b)\` apart): ${bt(n.character.handMeetings)}; \`embrace(a, b)\` (a hug, \`embraceSpacing\` apart); \`helpUp(helper, sitter, progress)\` (0 on the floor, hand taken; 1 standing; \`helpUpSpacing\` apart)`,
    "- Everyday cycles like a gait: `humanCyclePose('sweeping' | 'brushing', phase, base)` (0 → 1 is one stroke and back; sweeping with `holding: { right: 'broom' }`)",
    "",
    "## Code panel",
    "",
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${bt(n.codePanel.languages)}. Remove styles: ${bt(n.codePanel.removeStyles)}.`,
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
function l3(t, e, n, s = {}) {
  const o = s.color ?? "#555", i = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = ne(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? xk(t, { x: r.x, y: r.y }, a, { size: i, color: o, seed: l }) : r.kind === "exhaust" ? sM(t, r, a, i, o, l) : r.kind === "skid" ? oM(t, r, a, n, o) : r.kind === "honk" ? iM(t, r, a, i, o) : r.kind === "smoke" ? eM(t, r, n, i, o) : r.kind === "leaves" && nM(t, r, a, i, s.leafColor ?? "#5cae5a", o, l);
  }
}
function eM(t, e, n, s, o, i) {
  const r = e.direction ?? 1, a = 380, l = 1500;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let c = e.time; c <= e.time + e.length - l; c += a) {
    const h = (n - c) / l;
    if (h <= 0 || h >= 1) continue;
    const u = Math.sin(c / 97 + h * 4) * s * 0.06, f = e.x + r * h * s * 0.7 + u, d = e.y - h * s * 1.6;
    t.globalAlpha = Math.min(1, h * 6) * (1 - h) * 0.85, t.beginPath(), t.arc(f, d, s * (0.07 + h * 0.2), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function nM(t, e, n, s, o, i, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = i, t.fillStyle = o;
  for (let c = 0; c < 4; c++) {
    const h = ne(`${r}:${c}`) % 1e3 / 1e3, u = Math.min(1, n * (1.1 + h * 0.4)), f = e.x + (h - 0.5) * s * 1.2, d = e.y + (h - 0.3) * s * 0.4, g = u * u * 0.4 + u * 0.6, p = f + a * u * s * (0.6 + h) + Math.sin(u * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, d + (l - d) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(u * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function sM(t, e, n, s, o, i) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (ne(`${i}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, u = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, u, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function oM(t, e, n, s, o) {
  const i = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (i - e.x) * r;
  t.save(), t.strokeStyle = o, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function iM(t, e, n, s, o) {
  const i = e.direction ?? 1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + i * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, i > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, i > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function c3(t) {
  const e = new _t({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], o = [], i = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const u = Ja(t.prop, { state: e.getStateAtTime(h) }, t.propId), f = u.anchor(t.anchor);
    s.push({ time: h, value: f.x + (t.offset?.x ?? 0) - t.figure.x }), o.push({ time: h, value: f.y + (t.offset?.y ?? 0) - t.figure.y });
    const d = Math.sin(u.values.turn * Math.PI / 2);
    if (Math.abs(d) > 0.15 && (a = d > 0 ? 1 : -1), i.push({ time: h, value: Math.abs(d) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: o }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: i }, { id: `${l}-facing`, target: l, property: "facing", keyframes: rM(r) }), c;
}
function rM(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function h3(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, o = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = o.get(s(r));
    if (!a) return r;
    o.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, u) => h.time - u.time);
    return { ...r, keyframes: c };
  }), ...o.values()];
}
function u3(t) {
  const e = new _t({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((d) => d.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, o = s.x + s.width / 2, i = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = i.wheelSpin ?? 0, u;
  for (let d = t.start; ; d = Math.min(t.end, d + n)) {
    const g = Ja(t.leader, { state: e.getStateAtTime(d) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, b = Cs(s.prop, { ...i, turn: m }, s.propScale).anchors[t.anchor];
    if (!b) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const k = p.x - b.point.x;
    if (u !== void 0 && r) {
      const w = Math.sin(m * Math.PI / 2);
      h += (k - u) * (w || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (u = k, a.push({ time: d, value: k - o }), l.push({ time: d, value: m }), c.push({ time: d, value: h }), d >= t.end) break;
  }
  const f = t.towedId;
  return [
    { id: `${f}-x`, target: f, property: "x", keyframes: a },
    { id: `${f}-turn`, target: f, property: "turn", keyframes: l },
    ...r ? [{ id: `${f}-wheelSpin`, target: f, property: "wheelSpin", keyframes: c }] : []
  ];
}
const Gh = /* @__PURE__ */ new WeakMap();
function aM(t, e) {
  const n = e?.some(Boolean) ? e.map((f) => f ? 1 : 0).join("") : "";
  let s = Gh.get(t);
  s || Gh.set(t, s = /* @__PURE__ */ new Map());
  const o = s.get(n);
  if (o) return o;
  const i = Yo(t), r = { vertices: i.vertices, faces: i.faces.filter((f, d) => !e?.[d]) }, a = r.vertices.flatMap((f) => [f[0], f[1], f[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((f) => {
    for (const p of f.corners) for (const m of [0, 1, 2]) l[p][m] += f.normal[m];
    const [d, ...g] = f.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, b, k] = [d, g[p], g[p + 1]], [w, y, S] = [r.vertices[m], r.vertices[b], r.vertices[k]], $ = [y[0] - w[0], y[1] - w[1], y[2] - w[2]], v = [S[0] - w[0], S[1] - w[1], S[2] - w[2]], x = [$[1] * v[2] - $[2] * v[1], $[2] * v[0] - $[0] * v[2], $[0] * v[1] - $[1] * v[0]], M = x[0] * f.normal[0] + x[1] * f.normal[1] + x[2] * f.normal[2];
      c.push(...M >= 0 ? [m, b, k] : [m, k, b]);
    }
  });
  const h = l.flatMap((f) => {
    const d = Math.hypot(...f) || 1;
    return [f[0] / d, f[1] / d, f[2] / d];
  }), u = Fo({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, u), u;
}
function lM(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", o = (n.outline ?? 2) * (t.outline ?? 1), i = t.glow && e.glow > 0 ? cM(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: Yo(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...o > 0 ? { outline: { width: o, color: s } } : {},
    ...i ? { emissive: i } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function cM(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((o) => Math.round(parseInt(n[1].slice(o, o + 2), 16) * Math.max(0, Math.min(1, e)))).map((o) => o.toString(16).padStart(2, "0")).join("")}` : t;
}
const hM = Fo(gf(1, 2e-3, 28));
function uM(t, e, n) {
  const s = t.rig, [o, i] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, Et(s, e, "lift")), a = Math.max(0, Et(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: hM,
    world: Pt(n, ha([0, 4e-3, 0], [0, 0, 0, 1], [o * 0.55 * a || 1e-4, 1, i * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const fM = /* @__PURE__ */ new Set([
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
]), dM = 1, f3 = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in Es ? [] : [ft("prop preset", e.prop, Object.keys(Es))];
    for (const [s, o] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      o in e && n.push(`${o} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((i) => i === s ? e[o] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return id(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [v, x] of n)
      typeof x == "number" && !fM.has(v) && (h[v] = x);
    h.turn = 0, h.tilt = 0;
    const u = Pt(o.view, s), f = {
      toView: (v) => Ut(u, v),
      toScreen: (v) => a(v)
    }, d = f.toView([0, c.rig.height / 2, 0]);
    if (-d[2] <= o.near) return null;
    if (l.look === "mesh") {
      const v = C5(c.rig, h), x = v.map(({ part: A, local: E }) => ({ part: A.id, mesh: Yo(A.shape), ...Ga(Yo(A.shape), E) })), M = Uf(x), T = v.map((A, E) => ({ ...A, hidden: Gf(A.part.id, x[E].mesh, A.local, x[E].key, M) })).filter(({ opacity: A }) => A > 0.01).map(({ part: A, matrix: E, glow: P, opacity: O, hidden: L }) => ({
        mesh: aM(A.shape, L),
        world: Pt(s, E),
        material: lM(A, { glow: P, opacity: O }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? T : [uM(c, h, s), ...T] };
    }
    const g = a(d), p = a(f.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), b = i.length === 0 ? void 0 : (v, x) => {
      const M = Ut(s, v), T = [s[0] * x[0] + s[4] * x[1] + s[8] * x[2], s[1] * x[0] + s[5] * x[1] + s[9] * x[2], s[2] * x[0] + s[6] * x[1] + s[10] * x[2]], A = Math.hypot(...T) || 1;
      return { light: mf(M, [T[0] / A, T[1] / A, T[2] / A], i), fog: yf(r, Math.hypot(M[0] - o.position[0], M[1] - o.position[1], M[2] - o.position[2])) };
    }, k = Vf(c.rig, h, f, m, { perspective: !0, near: o.near, slice: dM, light: b }), w = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, y = wf(k), S = k.cells ?? [], $ = Math.max(...S.map((v) => -v.depth), -d[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: $ + c.rig.length, draw: (v) => kf(v, k, w) }],
        ...S.map((v) => ({
          depth: -v.depth,
          draw(x, M) {
            x.lineCap = "round", x.lineJoin = "round", zw(x, v.parts, y, { ...w, time: M.time });
          }
        }))
      ]
    };
  }
}, Vh = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], pM = 0.25, gM = 800 / 180, mM = 220, yM = 300, bM = ["turn"];
function wM(t) {
  const e = Qa(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !bM.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function kM(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = wM(e), o = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], i = [];
  return t.forEach((r, a) => {
    const l = (u) => i.push({ beat: a, message: u });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${o[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const u of Object.keys(c)) Vh.includes(u) || l(ft("beat field", u, Vh, h[u]));
    if (typeof c.do != "string" || !o.includes(c.do)) {
      const u = c.do === "turn" ? "face" : void 0;
      return l(ft(`${e.kind} 3D beat`, c.do, o, u));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !Ke(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(Ke)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(Ke(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), i;
}
function d3(t, e, n, s) {
  const o = kM(n, e);
  if (o.length > 0) throw new Error(`propScript3D (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((w) => `  beat ${w.beat}: ${w.message}`).join(`
`)}`);
  const i = {};
  for (const w of [...Object.keys(Hs), ...Object.keys(e.rig.controls)]) i[w] = s.values?.[w] ?? Et(e.rig, {}, w);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (w, y, S, $ = "linear") => {
    const v = c.get(w) ?? [];
    v.push({ time: y, value: S, easing: $ }), c.set(w, v);
  }, u = (w, y, S) => h(w, y, S);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const f = (w, y) => {
    const S = No(l, y);
    if (Math.abs(S) < 1) return w;
    const $ = Math.max(mM, Math.abs(S) * gM);
    return u("rotateY", w, l), l += S, h("rotateY", w + $, l, "ease-in-out"), w + $;
  }, d = (w, y, S) => {
    const $ = Af([[r, a], ...y.through ?? [y.to]]);
    if ($.length < 2) return S;
    const v = f(S, _n($[0].point, $[1].point)), x = $[$.length - 1].at, M = y.for ?? x / (y.speed ?? w.speed) * 1e3, T = Ft("ease-in-out"), A = Math.min(yM, M / 4);
    for (const [G, Q] of Object.entries(w.set ?? {}))
      u(G, v, i[G]), h(G, v + 1, Q), i[G] = Q;
    const E = w.flies ? y.height ?? (i.lift > 0.05 ? i.lift : 2) : void 0, P = E !== void 0 && E > 0.05;
    for (const [G, Q] of Object.entries(w.hold ?? {}))
      u(G, v, i[G]), h(G, v + A, Q, "ease-out"), P || (h(G, v + M - A, Q), h(G, v + M, 0, "ease-in")), i[G] = P ? Q : 0;
    E !== void 0 && (u("lift", v, i.lift), h("lift", v + Math.min(M * 0.35, 1400), E, "ease-out"), h("lift", v + M, E), i.lift = E);
    const O = { ...i };
    let L = l;
    for (let G = 0; ; G = Math.min(x, G + pM)) {
      const Q = v + Pf(T, G / x) * M, { point: j, direction: C } = $f($, G);
      L += No(L, _n([0, 0], C)), h("x", Q, j[0]), h("z", Q, j[1]), h("rotateY", Q, L);
      for (const [B, Y] of Object.entries(w.perMetre ?? {})) h(B, Q, O[B] + G * Y);
      for (const [B, Y] of Object.entries(w.perSecond ?? {})) h(B, Q, O[B] + (Q - v) / 1e3 * Y);
      if (G >= x) break;
    }
    for (const [G, Q] of Object.entries(w.perMetre ?? {})) i[G] = O[G] + x * Q;
    for (const [G, Q] of Object.entries(w.perSecond ?? {})) i[G] = O[G] + M / 1e3 * Q;
    return [r, a] = $[$.length - 1].point, l = L, v + M;
  }, g = (w, y) => {
    const S = Object.fromEntries(Object.entries(w).filter(([v]) => !["at", "to", "through", "toward"].includes(v))), $ = Xv(t, e, [S], { start: { ...i, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const v of $.tracks) {
      if (vM.includes(v.property)) continue;
      const x = v.keyframes ?? [], M = i[v.property];
      if (!x.every((T) => T.value === M)) {
        u(v.property, y, M);
        for (const T of x) T.time > 0 && c.get(v.property).push({ ...T, time: y + T.time });
        i[v.property] = x[x.length - 1].value;
      }
    }
    return y + $.duration;
  }, p = [];
  let m = 0;
  for (const w of n) {
    const y = w.at ?? m;
    let S = y;
    const $ = e.moves?.[w.do];
    $ ? S = d($, w, y) : w.do === "face" ? S = f(y, typeof w.toward == "number" ? w.toward : _n([r, a], w.toward)) : w.do === "hold" ? S = y + (w.for ?? 1e3) : S = g(w, y), p.push({ do: w.do, start: y, end: S }), m = S;
  }
  const b = `${s.scene}/${t}`;
  return { tracks: [...c].map(([w, y]) => ({
    id: `${t}-${w}`,
    target: b,
    property: w,
    keyframes: Ef(y)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...i } } };
}
const vM = ["x", "y", "turn", "facing", "tilt"], MM = 0.35, ad = {
  seated: fe.sit,
  astride: { ...fe.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 },
  driving: { ...fe.sit, "arm.left.swing": 52, "arm.right.swing": 52, "arm.left.spread": 8, "arm.right.spread": 8, "arm.left.elbow": 38, "arm.right.elbow": 38, lean: 4 },
  wheeling: { ...fe.sit, "arm.left.swing": -6, "arm.right.swing": -6, "arm.left.spread": 16, "arm.right.spread": 16, "arm.left.elbow": 28, "arm.right.elbow": 28, "leg.left.knee": 80, "leg.right.knee": 80 },
  cycling: { ...fe.sit, lean: 22, bend: 10, "head.nod": -14, "arm.left.swing": 58, "arm.right.swing": 58, "arm.left.spread": 10, "arm.right.spread": 10, "arm.left.elbow": 22, "arm.right.elbow": 22, "leg.left.spread": 6, "leg.right.spread": 6 }
}, xM = 22, Jh = 38;
function Zh(t, e = ad.cycling) {
  const n = t * Math.PI * 2, s = (r) => ({
    swing: (e["leg.left.swing"] ?? 40) + xM * Math.cos(n + r),
    // The knee straightens as the foot pushes down and over the bottom of the stroke.
    knee: (e["leg.left.knee"] ?? 70) + Jh * (0.5 + 0.5 * Math.cos(n + r)) - Jh * 0.5,
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
function p3(t) {
  const e = t.cadence ?? 1.2, n = Math.max(2, t.samplesPerTurn ?? 8), s = 1e3 / e / n, o = [];
  for (let i = t.start, r = 0; i < t.end; i += s, r++)
    o.push({ time: Math.round(i), pose: Zh((i - t.start) / 1e3 * e, t.base), ...r > 0 ? { act: !1 } : {} });
  return o.push({ time: t.end, pose: Zh((t.end - t.start) / 1e3 * e, t.base), act: !1 }), o;
}
const Qh = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function g3(t) {
  const e = `${t.scene}/${t.propId}`, n = new _t({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [o, i, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = ai({ ...t.character, height: 1 }), c = { ...ht, ...t.pose ?? ad.seated }, h = oi(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, u = t.facing ?? 0, f = t.every ?? 33, d = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + f)) {
    const b = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), k = (O, L) => {
      const q = b.get(O);
      return typeof q == "number" ? q : L;
    }, w = { ...s.values };
    for (const O of Object.keys(a.controls)) w[O] = k(O, s.values?.[O] ?? Et(a, {}, O));
    for (const O of ["pitch", "roll", "squash", "lift", "lean", "size"]) w[O] = k(O, s.values?.[O] ?? Et(a, {}, O));
    const y = R5(a, w)[t.anchor];
    if (!y) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const S = k("rotateY", s.heading ?? 0), $ = Qh(y, S), v = [k("x", o) + $[0], k("y", i) + $[1], k("z", r) + $[2]], x = S + u, M = Qh(h, x);
    let T = [v[0] - M[0], v[1] - M[1], v[2] - M[2]];
    const A = (O, L) => {
      const q = L * L * (3 - 2 * L);
      return [O[0] + (T[0] - O[0]) * q, T[1] * q + MM * Math.sin(Math.PI * L), O[1] + (T[2] - O[1]) * q];
    }, E = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, P = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + E ? T = A(t.mount.from, (m - t.start) / E) : t.dismount && m > t.end - P && (T = A(t.dismount.to, (t.end - m) / P)), d.x.push({ time: m, value: T[0] }), d.y.push({ time: m, value: T[1] }), d.z.push({ time: m, value: T[2] }), d.rotateY.push({ time: m, value: x }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(d).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: d[m] }));
}
const SM = {
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
}, ss = [
  [0, "#0b1530", "#1b2a4a"],
  [4.5, "#141a3e", "#2a2f5a"],
  [6, "#4a3f7a", "#f0a070"],
  [7.5, "#86c2ee", "#d8ecf8"],
  [12, "#5aaef2", "#c0e2f8"],
  [16.5, "#69b0e6", "#f5d79a"],
  [18.5, "#4c3f78", "#f08a5a"],
  [20.5, "#17203f", "#2d3660"],
  [24, "#0b1530", "#1b2a4a"]
], ps = (t, e, n) => {
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16)), [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}, TM = (t) => {
  const e = (t % 24 + 24) % 24;
  return e < 5 || e > 20 ? 0 : e < 7 ? (e - 5) / 2 : e > 18 ? (20 - e) / 2 : 1;
};
function EM(t) {
  const e = (t % 24 + 24) % 24;
  for (let n = 1; n < ss.length; n++) {
    const [s, o, i] = ss[n - 1], [r, a, l] = ss[n];
    if (e <= r) {
      const c = (e - s) / (r - s);
      return { top: ps(o, a, c), bottom: ps(i, l, c) };
    }
  }
  return { top: ss[0][1], bottom: ss[0][2] };
}
const AM = (t, e) => {
  const n = ((t - e) % 24 + 24) % 24;
  return n <= 12 ? n / 12 : -1;
}, $M = 9, PM = 55, IM = 28;
function OM(t) {
  const { x: e, y: n, width: s, height: o } = t, i = t.kind ?? "sky", r = t.ground ?? n + o * 0.85, a = { ...SM, ...t.colors }, l = t.horizon ?? "hills", c = t.window !== !1, h = rn(t.seed ?? 1), u = s * o / 1e5, f = Array.from({ length: Math.ceil($M * u) + 2 }, () => ({ u: h.next(), v: h.next(), size: 0.6 + h.next() * 0.8, puffs: 2 + Math.floor(h.next() * 3) })), d = Array.from({ length: Math.ceil(PM * u) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.8 + h.next() * 0.5 })), g = Array.from({ length: Math.ceil(IM * u) + 4 }, () => ({ u: h.next(), v: h.next(), speed: 0.7 + h.next() * 0.6, sway: h.next() * Math.PI * 2, size: 1.5 + h.next() * 2 })), p = Array.from({ length: Math.ceil(30 * u) + 10 }, () => ({ u: h.next(), v: h.next() * 0.6, size: 0.6 + h.next() * 1.2 })), m = Array.from({ length: 6 }, () => ({ phase: h.next() * Math.PI * 2, amp: 0.5 + h.next() })), b = Array.from({ length: 24 }, () => ({ h: 0.35 + h.next() * 0.65, w: 0.6 + h.next() * 0.8, windows: h.next() > 0.3 })), k = {
    hour: t.hour ?? 12,
    clouds: t.clouds ?? 0.3,
    wind: t.wind ?? 0,
    rain: t.rain ?? 0,
    snow: t.snow ?? 0
  }, w = _s(), y = (T, A) => w.keys(T)?.length ? w.valueAt(T, A) : k[T], S = (T, A) => {
    const E = AM(T, A), P = E < 0 ? 0.5 : E, O = r - n;
    return { x: 0.1 * s + 0.8 * s * P, y: E < 0 ? O + o * 0.2 : O - Math.sin(P * Math.PI) * O * 0.8, up: E >= 0 };
  }, $ = (T, A, E, P, O) => {
    const L = A("hour"), { top: q, bottom: G } = EM(L), Q = T.createLinearGradient(0, P.y, 0, P.ground);
    Q.addColorStop(0, q), Q.addColorStop(1, G), T.fillStyle = Q, T.fillRect(P.x, P.y, P.w, P.ground - P.y);
    const j = TM(L);
    if (j < 0.6) {
      T.fillStyle = "#ffffff", T.globalAlpha = (0.6 - j) / 0.6 * 0.9;
      for (const R of p)
        T.beginPath(), T.arc(P.x + R.u * P.w, P.y + R.v * (P.ground - P.y), R.size, 0, Math.PI * 2), T.fill();
      T.globalAlpha = 1;
    }
    const C = S(L, 6), B = S(L, 18), Y = Math.min(P.w, P.h) * 0.06;
    if (C.up && (T.fillStyle = a.sun, T.beginPath(), T.arc(P.x + C.x / s * P.w, P.y + C.y / o * P.h, Y, 0, Math.PI * 2), T.fill()), B.up) {
      const R = P.x + B.x / s * P.w, z = P.y + B.y / o * P.h;
      T.fillStyle = a.moon, T.beginPath(), T.arc(R, z, Y * 0.8, 0, Math.PI * 2), T.fill(), T.fillStyle = q, T.beginPath(), T.arc(R - Y * 0.35, z - Y * 0.15, Y * 0.7, 0, Math.PI * 2), T.fill();
    }
    const I = Math.max(0, Math.min(1, A("clouds"))), N = Math.max(-1, Math.min(1, A("wind"))), nt = Math.round(I * f.length);
    T.fillStyle = ps("#ffffff", a.cloud === "#ffffff" ? "#ffffff" : a.cloud, 1), T.globalAlpha = 0.55 + 0.4 * j;
    for (let R = 0; R < nt; R++) {
      const z = f[R], U = ((z.u * P.w + N * E * 0.012 * (0.6 + z.size * 0.5)) % (P.w * 1.4) + P.w * 1.4) % (P.w * 1.4) - P.w * 0.2, W = P.x + U, F = P.y + (0.08 + z.v * 0.42) * (P.ground - P.y), D = Math.min(P.w, P.h) * 0.07 * z.size;
      for (let V = 0; V < z.puffs; V++)
        T.beginPath(), T.ellipse(W + (V - (z.puffs - 1) / 2) * D * 0.9, F + V % 2 * D * 0.25, D * (V % 2 ? 0.8 : 1), D * 0.62, 0, 0, Math.PI * 2), T.fill();
    }
    T.globalAlpha = 1;
    const H = (R) => ps(ps(R, "#0b1530", 0.65), R, j);
    if (l === "hills") {
      T.fillStyle = H(a.hills), T.beginPath(), T.moveTo(P.x, P.ground);
      const R = 40;
      for (let z = 0; z <= R; z++) {
        const U = z / R;
        let W = 0;
        m.forEach((F, D) => W += Math.sin(U * Math.PI * (1.5 + D * 0.7) + F.phase) * F.amp), T.lineTo(P.x + U * P.w, P.ground - Math.max(0, W) * P.h * 0.045 - P.h * 0.03);
      }
      T.lineTo(P.x + P.w, P.ground), T.closePath(), T.fill();
    } else if (l === "city") {
      T.fillStyle = H(a.city);
      let R = P.x;
      const z = P.w / 18;
      for (const U of b) {
        if (R > P.x + P.w) break;
        const W = z * U.w, F = P.h * 0.22 * U.h;
        if (T.fillRect(R, P.ground - F, W, F), U.windows && j < 0.5) {
          T.fillStyle = "#ffd66b", T.globalAlpha = 0.5 - j;
          for (let D = P.ground - F + 6; D < P.ground - 8; D += 9) for (let V = R + 4; V < R + W - 4; V += 8) T.fillRect(V, D, 3, 4);
          T.globalAlpha = 1, T.fillStyle = H(a.city);
        }
        R += W + z * 0.15;
      }
    }
    T.fillStyle = H(a.ground), T.fillRect(P.x, P.ground, P.w, P.y + P.h - P.ground);
  }, v = (T, A, E, P) => {
    const O = Math.max(-1, Math.min(1, A("wind"))), L = Math.max(0, Math.min(1, A("rain"))), q = Math.max(0, Math.min(1, A("snow")));
    if (L > 0) {
      T.strokeStyle = a.rain, T.globalAlpha = 0.35 + 0.45 * L, T.lineWidth = 1.2, T.lineCap = "round";
      const G = P.h * 0.05, Q = O * 0.45, j = Math.round(L * d.length);
      T.beginPath();
      for (let C = 0; C < j; C++) {
        const B = d[C], Y = ((B.v * P.h + E * B.speed * 0.9) % P.h + P.h) % P.h, I = ((B.u * P.w + Y * Q) % P.w + P.w) % P.w;
        T.moveTo(P.x + I, P.y + Y), T.lineTo(P.x + I + Q * G, P.y + Y + G);
      }
      T.stroke(), T.globalAlpha = 1;
    }
    if (q > 0) {
      T.fillStyle = a.snow, T.globalAlpha = 0.85;
      const G = Math.round(q * g.length);
      for (let Q = 0; Q < G; Q++) {
        const j = g[Q], C = ((j.v * P.h + E * j.speed * 0.08) % P.h + P.h) % P.h, B = Math.sin(E * 2e-3 + j.sway) * P.w * 0.02, Y = ((j.u * P.w + B + O * C * 0.3) % P.w + P.w) % P.w;
        T.beginPath(), T.arc(P.x + Y, P.y + C, j.size, 0, Math.PI * 2), T.fill();
      }
      T.globalAlpha = 1;
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
        props: Object.fromEntries(Object.keys(k).map((T) => [T, _M(T)]))
      },
      draw(T, A, E) {
        const P = A.props ?? {}, O = (q) => Number(P[q] ?? k[q] ?? 0);
        T.save();
        const L = { x: 0, y: 0, w: s, h: o, ground: r - n };
        if (i === "sky")
          $(T, O, E, L), v(T, O, E, L);
        else if (T.fillStyle = a.wall, T.fillRect(0, 0, s, L.ground), T.fillStyle = a.floor, T.fillRect(0, L.ground, s, o - L.ground), T.fillStyle = a.skirting, T.fillRect(0, L.ground - o * 0.012, s, o * 0.012), c) {
          const q = s * 0.26, G = L.ground * 0.5, Q = s * 0.62, j = L.ground * 0.14;
          T.fillStyle = a.frame, T.fillRect(Q - 6, j - 6, q + 12, G + 12), T.save(), T.beginPath(), T.rect(Q, j, q, G), T.clip(), $(T, O, E, { x: Q, y: j, w: q, h: G, ground: j + G * 0.8 }), v(T, O, E, { x: Q, y: j, w: q, h: G }), T.restore(), T.strokeStyle = a.frame, T.lineWidth = 4, T.beginPath(), T.moveTo(Q + q / 2, j), T.lineTo(Q + q / 2, j + G), T.moveTo(Q, j + G / 2), T.lineTo(Q + q, j + G / 2), T.stroke();
        }
        T.restore();
      }
    },
    ground: r,
    anchor(T, A = 1 / 0) {
      const E = y("hour", A);
      if (T === "sun" || T === "moon") {
        const P = S(E, T === "sun" ? 6 : 18);
        return { x: e + P.x, y: n + P.y };
      }
      if (T === "horizon") return { x: e + s / 2, y: r - o * 0.03 };
      if (T === "ground") return { x: e + s / 2, y: r };
      throw new Error(`scenery: ${ft("place", T, ["sun", "moon", "horizon", "ground"])}`);
    },
    set(T, A) {
      if (!(T in k)) throw new Error(`scenery: ${ft("value", T, Object.keys(k))}`);
      if (typeof A.value != "number" || !Number.isFinite(A.value)) throw new Error("scenery.set needs `value`, a number");
      return w.tween(T, y(T, A.at), A.value, A, 1e3), M;
    },
    tracks: w.tracks
  };
  return M;
}
function _M(t) {
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
function HM(t, e) {
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
      throw new Error(ft("scene preset", t, ["park", "street", "office", "home"]));
  }
}
function m3(t, e) {
  const n = HM(t, e), s = OM(n.scenery), o = n.props.map((i) => N5({ x: i.x, y: s.ground, prop: id(i.preset), scale: i.scale, values: { turn: i.turn ?? 0, ...i.values } }));
  return { scenery: s, props: o, ground: s.ground };
}
function y3(t) {
  const { timeline: e } = t, n = new Ve();
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
const b3 = {
  timeline: wg,
  to(t, e, n) {
    const s = new En(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new En(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const o = new En(s);
    return o.fromTo(t, e, n), o;
  },
  set(t, e, n) {
    const s = new En(n);
    return s.set(t, e), s;
  }
};
function ld(t, e, n) {
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
function CM(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), o = Math.min(0.999, Math.max(0, e));
  for (let i = 0; i < n; i++) {
    const r = t[i * 4] / 255, a = t[i * 4 + 1] / 255, l = t[i * 4 + 2] / 255, c = t[i * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= o) continue;
    const u = (h - o) / (1 - o) * c / h;
    s[i * 3] = r * u, s[i * 3 + 1] = a * u, s[i * 3 + 2] = l * u;
  }
  return s;
}
function t0(t, e, n, s, o) {
  const i = new Float32Array(t.length), r = o ? n : e, a = o ? e : n, l = (h, u) => (o ? h * e + u : u * e + h) * 3, c = s * 2 + 1;
  for (let h = 0; h < r; h++)
    for (let u = 0; u < 3; u++) {
      let f = 0;
      for (let d = -s; d <= s; d++) f += t[l(h, Math.min(a - 1, Math.max(0, d))) + u];
      for (let d = 0; d < a; d++) {
        i[l(h, d) + u] = f / c;
        const g = t[l(h, Math.max(0, d - s)) + u], p = t[l(h, Math.min(a - 1, d + s + 1)) + u];
        f += p - g;
      }
    }
  return i;
}
function e0(t, e, n, s) {
  const o = Math.max(1, Math.round(s / Math.sqrt(3)));
  let i = t;
  for (let r = 0; r < 3; r++)
    i = t0(i, e, n, o, !0), i = t0(i, e, n, o, !1);
  return i;
}
function w3(t, e = {}) {
  const n = t.canvas, s = n.width, o = n.height;
  if (!(s > 0 && o > 0)) return;
  const i = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / i)), a = Math.max(1, Math.ceil(o / i)), l = ld(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = CM(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, o) * 0.02) / i, f = e0(h, r, a, u), d = e0(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let b = 0; b < 3; b++) p.data[m * 4 + b] = Math.round(Math.min(1, f[m * 3 + b] + d[m * 3 + b] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, o), t.restore();
}
function k3(t, e, n) {
  const s = n.width ?? 6, o = n.taper ?? 1, i = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = LM(e, s, o, i, r);
    a ? (t.globalCompositeOperation = "lighter", na(t, c, n.color)) : WM(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, RM(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function RM(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const o = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return o ? `rgba(${o[1]}, ${o[2]}, ${o[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function LM(t, e, n, s, o) {
  const i = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = Bp(i), a = zp(i) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = o * (1 - s * h);
    if (u <= 0) continue;
    const f = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...f && a && { cap: a } });
  }
  return l;
}
function na(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [o, i, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(o.x, o.y), t.lineTo(i.x, i.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function WM(t, e, n) {
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
  const u = Math.floor(a) - 1, f = Math.floor(l) - 1, d = s ? ld(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - f) : null, g = d?.getContext("2d");
  if (!d || !g) {
    na(t, e, n);
    return;
  }
  g.translate(-u, -f), g.globalCompositeOperation = "lighter", na(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(d, u, f), t.restore();
}
const v3 = se.to, M3 = se.from, x3 = se.fromTo, S3 = se.set, T3 = se.timeline, E3 = se.ticker, A3 = se.splitText, $3 = se.context, P3 = se.matchMedia, I3 = se.quickTo, O3 = se.imageSequence, _3 = se.pageTransition;
a1();
export {
  Hn as ACTING_STYLES,
  ed as AIRCRAFT_ACTING,
  Rs as ANIMAL_GAITS,
  G2 as ANIME_CAST,
  Vr as BEAT_FIELDS,
  ds as BEAT_MOMENTS,
  uv as BED_ACTING,
  Lv as BIRD_ACTING,
  nh as BOARD_MARKS,
  Vs as BOARD_THEMES,
  Ua as CANVAS_PROPERTIES,
  rv as CHAIR_ACTING,
  Vc as CHARACTER_BEAT_3D_FIELDS,
  Wf as CHARACTER_CAST,
  f2 as CHARACTER_GAIT_SPEEDS,
  lh as CHART_KINDS,
  Sn as CHART_SURFACE,
  Js as CHART_THEMES,
  Xr as CODE_LANGUAGES,
  Lf as CODE_PANEL_EDITS,
  uo as CODE_SURFACE,
  E2 as CODE_THEME,
  DM as Clock,
  En as CompatTimeline,
  Im as CustomBounce,
  Pm as CustomEase,
  Om as CustomWiggle,
  an as DANCE_STYLES,
  p0 as DEFAULT_BAKE_INTERVAL_MS,
  el as DEFAULT_INERTIA_FRICTION,
  qm as DEFAULT_LABELS,
  ie as DEFAULT_SPRING,
  Vx as DEFAULT_TRANSITION,
  cv as DESK_ACTING,
  dv as DOOR_ACTING,
  q0 as Draggable,
  Ur as EMBRACE,
  vt as EXPRESSIONS,
  ju as FACIAL_HAIR_STYLES,
  y1 as FINGERS,
  fi as FLIPS,
  Jy as FOOT_SHAPES,
  tl as FORMAT_VERSION,
  Wp as FRAME_ASPECTS,
  on as GAGS,
  Yt as GAITS,
  kh as GAIT_CYCLE_MS,
  Uu as GLASSES_STYLES,
  we as HAIR_COLORS,
  vs as HAIR_STILL,
  Lu as HAIR_STYLES,
  Bo as HAND_MEETINGS,
  It as HAND_REST,
  Ot as HAND_SHAPES,
  Oa as HAT_STYLES,
  rf as HELD_ITEMS,
  Tn as HELP_UP,
  i3 as HORSE_ACTING,
  o3 as HORSE_GAITS,
  sv as HOUSE_ACTING,
  yk as HUMAN_ACTING_RIG,
  Rr as HUMAN_BUILDS,
  Tc as HUMAN_CYCLES,
  zn as HUMAN_DANCES,
  Eu as HUMAN_EXPRESSIONS,
  _a as HUMAN_GAGS,
  fe as HUMAN_POSES,
  ht as HUMAN_REST,
  b2 as IDENTITY_CAMERA,
  Ex as IDENTITY_SIMILARITY,
  md as INERTIA_MAX_DURATION_MS,
  fp as InertiaTrackPlayer,
  ve as LiveTimeline,
  V2 as MANGA_CAST,
  XM as MORPH_SAMPLES,
  Hr as MUDRAS,
  NM as ManualClock,
  zl as MediaSync,
  ph as OUTFIT_PRESETS,
  Yg as Observer,
  ee as POSES,
  Vh as PROP_BEAT_3D_FIELDS,
  ta as PROP_BEAT_FIELDS,
  rd as PROP_COMMON_ACTIONS,
  Hs as PROP_COMMON_CONTROLS,
  Es as PROP_PRESETS,
  ls as PROP_SURFACE,
  sd as QUADRUPED_ACTING,
  jr as REMOVE_STYLES,
  ct as REST_POSE,
  ad as RIDING_POSES,
  je as SAMPLE_STEP,
  SM as SCENERY_COLORS,
  mi as SCRIPT_ACTIONS,
  fh as SOFT_CARTOON_CAST,
  r0 as SPRING_MAX_DURATION_MS,
  ki as SPRING_PRESETS,
  os as SPRING_STEP_MS,
  pk as STICK_ACTING_RIG,
  fm as ScrollAnimator,
  ti as ScrollDriver,
  dm as ScrollMarkers,
  am as ScrollPin,
  Rl as SmoothScroll,
  jo as SpringSampler,
  up as SpringTrackPlayer,
  Lg as Stage,
  tv as TREE_ACTING,
  _t as Timeline,
  ma as TinyflyPlayer,
  l1 as TinyflySequencer,
  oo as TrackPlayer,
  q5 as VEHICLE_ACTING,
  De as VISEMES,
  sx as ValueResolver,
  rm as VisibilityDriver,
  mv as WHEELCHAIR_ACTING,
  Ee as WHITEBOARD_SURFACE,
  wk as actCharacterTracks,
  Ka as actKeyframes,
  bk as actTracks,
  Bf as actionNames,
  kv as airplane,
  Xe as anchorError,
  Za as animalStrideLength,
  k5 as animatableProperties,
  w3 as applyBloom,
  ES as applyCamera,
  Sy as applyGroove,
  I0 as applySimilarity,
  P0 as aspectOf,
  bh as assertBeats,
  kx as audioEnvelope,
  $d as backOut,
  iS as bakeDanceTracks,
  b0 as bakeEasing,
  m0 as bakeInertiaTrack,
  g0 as bakeSpringTrack,
  fw as basicOutfit,
  nS as beatAt,
  Vo as beatAtTime,
  Go as beatLength,
  yx as beatPeriod,
  wx as beatPulse,
  ra as beatTime,
  cx as beatsBetween,
  hv as bed,
  J5 as bike,
  t1 as bindChoiceHotspots,
  hn as bird,
  ws as blendPose,
  sb as bodyProfileWidth,
  nu as boilFrame,
  Ad as bounceOut,
  s2 as boxMesh,
  rw as brushingPose,
  Lx as bubblePath,
  Wx as bubblePop,
  m3 as buildScene,
  X5 as bus,
  TS as cameraFromValues,
  AS as cameraPoint,
  ux as cameraTracks,
  tM as capabilities,
  a3 as capabilitiesMarkdown,
  K5 as car,
  G5 as cart,
  FS as castMember,
  Iv as cat,
  iv as chair,
  Ss as changingWindows,
  ai as character,
  pS as characterAt,
  bw as characterHandPose,
  ae as characterJoints,
  hS as characterJointsInView,
  xS as characterLookAtTracks,
  kS as characterObjects,
  kw as characterPartsInView,
  Ca as characterPoseOf,
  gS as characterPoseTracks,
  t3 as characterScript,
  MS as characterScript3D,
  r5 as characterStrideLength,
  dS as characterTarget,
  pp as charactersFor,
  LS as chart,
  qo as checkBeats,
  zf as checkCast,
  y2 as checkCharacterBeats3D,
  jv as checkPropBeats,
  kM as checkPropBeats3D,
  s5 as checkSurfaceBeats,
  e3 as checkTracks,
  Dv as chicken,
  PS as circlePath,
  X0 as clamp01,
  UM as clearMorphCache,
  KM as clearPathCache,
  Rf as clipErased,
  bo as closestName,
  CS as codePanel,
  _2 as codeTokens,
  $x as composeSimilarity,
  _l as containerProgressAt,
  $3 as context,
  Et as controlValue,
  Ov as cow,
  Xx as create,
  Xm as createControls,
  Td as createCubicBezier,
  Wm as createLive,
  ei as createPen,
  rn as createRandom,
  yr as createTrack,
  qM as criticalDamping,
  Nv as crow,
  mx as curve,
  Tp as customBounce,
  Sp as customEase,
  Ep as customWiggle,
  o2 as cylinderMesh,
  xw as danceCircleAt,
  yS as danceCircleTracks,
  Ma as danceFrame,
  qn as danceJoint,
  tS as dancePose,
  Cr as danceStance,
  eS as danceTaps,
  oS as danceTracks,
  Ri as danceTravel,
  $y as danceTravelTrack,
  sS as dancer,
  VS as defineAction,
  JS as defineGait,
  w5 as describeTarget,
  gs as deserializeTimeline,
  wp as deserializeTrack,
  lv as desk,
  hx as detectTempo,
  Pv as dog,
  fv as door,
  zx as draggable,
  wa as drawCartoonHand,
  ww as drawCharacter,
  fS as drawCharacterHead,
  uS as drawCharacterInView,
  xk as drawDustPuff,
  Of as drawEraser,
  Hf as drawHand,
  _c as drawHeldItem,
  GS as drawImpactStars,
  w2 as drawPencil,
  n3 as drawProp,
  l3 as drawPropEffects,
  kf as drawPropShadow,
  zw as drawSolvedFaces,
  wS as drawSolvedPart,
  bf as drawSolvedProp,
  vk as drawSpeedLines,
  dy as drawStickFigure,
  US as drawStickSmear,
  k3 as drawTrail,
  IS as drawnPathTarget,
  Rx as dripPath,
  zv as duck,
  vd as easeIn,
  a0 as easeInCubic,
  xd as easeInOut,
  Uo as easeInOutCubic,
  kd as easeInOutQuad,
  bd as easeInQuad,
  Md as easeOut,
  l0 as easeOutCubic,
  wd as easeOutQuad,
  Cp as editDistance,
  gi as editError,
  _s as editLog,
  Ed as elasticOut,
  Tr as ellipsePoints,
  i2 as ellipsoidMesh,
  zS as embrace,
  BS as embraceSpacing,
  vx as envelopeAt,
  HS as erasable,
  ja as expandBeats,
  cp as expandParametricEasings,
  a2 as extrudeMesh,
  $w as flipPose,
  bS as flipTracks,
  Pw as flipTravel,
  n0 as formatVersionFor,
  Mx as frameRect,
  xx as frameSize,
  M3 as from,
  tx as fromJSON,
  x3 as fromTo,
  yh as gag,
  zo as gagDuration,
  F1 as gaitPose,
  Pr as gaitStrideLength,
  Ft as getEasingFunction,
  yo as getInterpolator,
  w0 as getMotionPathPoint,
  jM as getPathLength,
  Nd as getPointAtProgress,
  _v as goat,
  jg as gridLinesFor,
  rk as hairFollow,
  XS as hairFollowTracks,
  Ab as hairHangs,
  jS as hairMotionAt,
  Co as hairMotionOf,
  Ro as hairlineAt,
  $S as handAt,
  Ki as handGrip,
  $r as handJoints,
  P1 as handJointsAt,
  Yf as handPath,
  Ht as handPose,
  Eo as handProp,
  ud as hasKeyframes,
  ne as hashSeed,
  Zx as headPoint,
  fd as heldTime,
  bv as helicopter,
  YS as helpUp,
  qS as helpUpSpacing,
  pw as holdingLayers,
  $v as horse,
  r3 as horseStrideLength,
  nv as house,
  lS as humanCyclePose,
  Oo as humanDanceFrame,
  aS as humanDanceTracks,
  rS as humanFieldLabel,
  ow as humanGag,
  ef as humanGaitPose,
  nf as humanGaitStrideLength,
  Tu as humanPlan,
  wt as humanPose,
  O3 as imageSequence,
  $s as inertiaDuration,
  As as inertiaRest,
  dr as inertiaValueAt,
  YM as inertiaVelocityAt,
  rp as interpolateArray,
  ip as interpolateColor,
  ZM as interpolateMotionPath,
  ke as interpolateNumber,
  lp as interpolatePathString,
  ap as interpolateQuaternion,
  gl as interpolateString,
  Px as invertSimilarity,
  hd as isCubicBezierEasing,
  Hc as isHeld,
  en as isInertiaTrack,
  FM as isMotionPathPoint,
  s0 as isMotionPathTrack,
  go as isParametricEasing,
  Ps as isPathData,
  nn as isSpringTrack,
  sa as isTextTrack,
  zM as isUnderdamped,
  nx as isUnresolved,
  O0 as isoDepth,
  _0 as isometricBoxFaces,
  H0 as isometricFaces,
  vw as jointsInScene,
  fy as jointsToScene,
  cw as leafOutfit,
  of as leafOutfitContours,
  pr as linear,
  Sf as lipSyncKeyframes,
  za as lipSyncOver,
  vS as lipSyncTracks,
  Mf as lit,
  se as live,
  If as lookFields,
  bx as loopBeats,
  dx as loopEase,
  px as loopNoise,
  Jf as loosePartsOf,
  Ev as lyingPose,
  ko as mapEase,
  Bx as mat4,
  P3 as matchMedia,
  i0 as maxStaggerDistance,
  mS as meetDandiya,
  DS as meetHands,
  NS as meetingSpacing,
  Cx as metaballContours,
  Kp as metaballField,
  Vy as mirrorHumanPose,
  My as mirrorPose,
  xf as mixColors,
  bs as mixHandPoses,
  cf as mixPoses,
  Jd as morphPath,
  Z5 as motorbike,
  n1 as mount,
  i1 as mountAll,
  ix as narrationMarkers,
  rx as narrationSceneAt,
  mo as naturalRest,
  ax as nearestBeat,
  lx as nextBeat,
  K2 as niceCeiling,
  Qc as objectPositionAt,
  ib as organicBodyContours,
  Ks as organicCenterLine,
  KS as outfitPreset,
  qv as owl,
  _3 as pageTransition,
  l2 as panelMesh,
  Id as parametricEasing,
  Yv as parrot,
  Kn as parseAnchor,
  Ol as parseEdge,
  Ln as parsePath,
  j0 as parseTrigger,
  ys as partialPath,
  u1 as pathLength,
  p3 as pedallingKeys,
  Zh as pedallingPose,
  Hx as penroseStairs,
  _x as penroseTriangle,
  QS as persona,
  Fn as phaseOf,
  pi as pieceMotion,
  Bv as pigeon,
  E0 as pingPong,
  ox as planNarration,
  Mw as plantDanceFoot,
  jx as play,
  Gx as playSequence,
  Yx as playWhenVisible,
  k0 as playheadCrossings,
  ya as pointAlong,
  c0 as pointAtDistance,
  cS as pointOnHead,
  Fp as pointsToPath,
  Lt as pose,
  Qx as poseTracks,
  Ix as powSimilarity,
  la as projectIsometric,
  Qa as propActions,
  R5 as propAnchors3D,
  Ja as propAt,
  Zf as propControls,
  wf as propLineWidth,
  f3 as propObjects,
  C5 as propPartsInSpace,
  id as propPreset,
  c3 as propRide,
  g3 as propRide3D,
  Xv as propScript,
  d3 as propScript3D,
  Yo as propShapeMesh,
  s3 as propSurface,
  N5 as propTarget,
  u3 as propTow,
  O5 as propView,
  cn as quadruped,
  GM as quat,
  y3 as quickPlay,
  I3 as quickTo,
  Hv as rabbit,
  M0 as randomBetween,
  ex as randomChoice,
  vp as randomSnapped,
  Re as reachCharacter,
  a5 as reachOf,
  Ff as resolveActingStyle,
  uf as resolveCharacterPoseKeys,
  Nb as resolveFacialHair,
  ni as resolveGait,
  Xb as resolveGlasses,
  $b as resolveHair,
  Jb as resolveHat,
  ew as resolveHeadLook,
  dw as resolveHolding,
  nb as resolveOrganicBody,
  ka as resolvePoseKeys,
  Mp as resolveSequence,
  bu as resolveStickFrame,
  py as resolveStickPose,
  T0 as resolveValue,
  Bp as ribbon,
  zp as ribbonHeadCap,
  Ya as rideFloors,
  Je as rotateAbout,
  xa as routineBeats,
  Dn as rubberLimb,
  Sx as safeAreas,
  Nx as scalePoints,
  HM as scenePreset,
  OM as scenery,
  qf as scriptActionSummaries,
  Xa as scriptTracks,
  qx as scrollProgress,
  Kx as scrubOnScroll,
  OS as scrubPath,
  Jx as seatHeight,
  kp as serializeTimeline,
  bp as serializeTrack,
  S3 as set,
  Ba as shade,
  h2 as shapeMesh,
  aa as shapeToPathData,
  Ax as similarity,
  qp as similarityAbout,
  Yp as similarityFixedPoint,
  Ox as similarityMatrix,
  hp as simplifyKeyframes,
  Xh as sittingPose,
  Ea as skeletonInView,
  Sr as sketchPen,
  EM as skyColors,
  Tf as smoothPath,
  im as smoothToward,
  Kg as snapAxis,
  cm as snapConfig,
  um as snapDuration,
  hm as snapProgress,
  WS as softCartoonCharacter,
  Cs as solveAt,
  si as solvePlanSpace,
  Vf as solveProp,
  Fv as songbird,
  n2 as soundsOf,
  Gk as speechDuration,
  u2 as speechLength,
  h3 as spliceTracks,
  A3 as splitText,
  dd as springDuration,
  io as springFollow,
  BM as springValueAt,
  Fx as squashStretch,
  Cv as squirrel,
  oi as stagePlanSpace,
  SS as stageSpots,
  o0 as staggerDistance,
  oa as staggerOffset,
  fr as staggerOffsets,
  Ko as staggerSpan,
  Ek as stepsDuration,
  Pd as stepsEasing,
  Df as stepsToKeys,
  vu as stickFigureAt,
  he as stickFigureJoints,
  ku as stickFigureTarget,
  Cw as stickToHuman,
  B1 as strideLength,
  kt as surfaceBox,
  ZS as surfaceScript,
  iw as sweepingPose,
  zm as syncMediaElement,
  z1 as talkingMouth,
  ba as taperedLine,
  Wt as taperedOutline,
  mp as textAt,
  b3 as tf,
  E3 as ticker,
  T3 as timeline,
  v3 as to,
  QM as toJSON,
  VM as toKeyframedTrack,
  JM as toKeyframedTracks,
  gx as torusNoise,
  Be as trackTargets,
  U5 as tractor,
  Tx as trailSamples,
  V5 as trainCar,
  Q5 as tree,
  ms as triggerDistance,
  j5 as truck,
  c2 as tubeMesh,
  ft as unknownName,
  Ux as unmount,
  qa as valueAt,
  Dx as vec3,
  Le as vehicle,
  D1 as walkPose,
  gv as wheelchair,
  RS as whiteboard,
  _S as withErased,
  qe as withExpression,
  fx as wobble
};
