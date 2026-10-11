function Iu(t) {
  return typeof t == "object" && t !== null && t.type === "cubic-bezier";
}
function Ws(t) {
  return typeof t == "object" && t !== null && t.type !== "cubic-bezier";
}
const aa = 2;
function jc(t) {
  return t.some((e) => e.interpolation !== void 0) ? 2 : 1;
}
function ar(t) {
  return t.property === "text" && "textConfig" in t;
}
function qe(t) {
  return t.kind === "inertia" && "inertia" in t;
}
function Ye(t) {
  return t.kind === "spring" && "spring" in t;
}
function qc(t) {
  return t.property === "motionPath" && "motionPathConfig" in t;
}
function Nk(t) {
  return typeof t == "object" && t !== null && "x" in t && "y" in t && "angle" in t;
}
function Ou(t) {
  return "keyframes" in t;
}
class Bk {
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
class jk {
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
function _u(t, e) {
  if (!(e > 0)) return t;
  const n = 1e3 / e;
  return Math.floor(t / n + 1e-9) * n;
}
function Yc(t, e, n = "start") {
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
function Kc(t, e = "start") {
  if (t <= 1) return 0;
  let n = 0;
  for (let s = 0; s < t; s++)
    n = Math.max(n, Yc(s, t, e));
  return n;
}
function lr(t, e, n) {
  if (n.offsets) return n.offsets[t] ?? 0;
  const s = n.from ?? "start", o = Yc(t, e, s);
  if (n.amount !== void 0) {
    const i = Kc(e, s);
    return i === 0 ? 0 : n.amount * o / i;
  }
  return n.each !== void 0 ? n.each * o : 0;
}
function wi(t, e) {
  return Array.from({ length: t }, (n, s) => lr(s, t, e));
}
function ao(t, e) {
  return t <= 1 ? 0 : Math.max(...wi(t, e));
}
const On = 1, zc = 6e4, as = zc / On, Jt = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Oo = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class lo {
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
    this.from = e.from, this.to = e.to, this.stiffness = e.stiffness ?? Jt.stiffness, this.damping = e.damping ?? Jt.damping, this.mass = e.mass ?? Jt.mass, this.restDelta = e.restDelta ?? Jt.restDelta, this.restSpeed = e.restSpeed ?? Jt.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = e.velocity ?? Jt.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(e / On);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(n, this.samples.length - 1)], o = this.samples[Math.min(n + 1, this.samples.length - 1)], i = e / On - n;
    return s + (o - s) * i;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(as + 1), this.settledStep !== null ? this.settledStep * On : zc;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(e) {
    if (this.settledStep !== null) return;
    const n = Math.min(e, as + 1), s = On / 1e3;
    for (; this.samples.length < n; ) {
      const o = this.samples[this.samples.length - 1], i = o - this.to, r = -this.stiffness * i, a = -this.damping * this.velocity, l = (r + a) / this.mass;
      this.velocity += l * s;
      const c = o + this.velocity * s;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > as && (this.settledStep = as);
  }
}
function qk(t, e) {
  return new lo(t).valueAt(e);
}
function Hu(t) {
  return new lo(t).settleTime();
}
function Yk(t) {
  const e = t.stiffness ?? Jt.stiffness, n = t.damping ?? Jt.damping, s = t.mass ?? Jt.mass;
  return n < 2 * Math.sqrt(e * s);
}
function Kk(t) {
  const e = t.stiffness ?? Jt.stiffness, n = t.mass ?? Jt.mass;
  return 2 * Math.sqrt(e * n);
}
const la = 4, Cu = 2e-3, Ru = 1e-4, Lu = 6e4;
function co(t) {
  const e = t.friction ?? la;
  return e > 0 ? e : la;
}
function Fs(t) {
  return t.from + t.velocity / co(t);
}
function Wu(t, e) {
  if (e === void 0) return t;
  if (typeof e == "number")
    return e > 0 ? Math.round(t / e) * e : t;
  if (e.length === 0) return t;
  let n = e[0];
  for (const s of e)
    Math.abs(s - t) < Math.abs(n - t) && (n = s);
  return n;
}
function ts(t) {
  let e = Wu(Fs(t), t.end);
  return t.min !== void 0 && (e = Math.max(t.min, e)), t.max !== void 0 && (e = Math.min(t.max, e)), e;
}
function es(t) {
  const e = Math.abs(ts(t) - t.from);
  if (e === 0) return 0;
  const n = t.restDelta ?? Math.max(Ru, e * Cu);
  if (n >= e) return 0;
  const s = Math.log(e / n) / co(t);
  return Math.min(Lu, s * 1e3);
}
function ki(t, e) {
  if (e <= 0) return t.from;
  const n = ts(t);
  if (e >= es(t)) return n;
  const s = co(t);
  return t.from + (n - t.from) * (1 - Math.exp(-s * e / 1e3));
}
function zk(t, e) {
  const n = co(t), s = ts(t);
  return e >= es(t) ? 0 : (s - t.from) * n * Math.exp(-n * Math.max(0, e) / 1e3);
}
const vi = (t) => t, Fu = (t) => t * t, Du = (t) => 1 - (1 - t) * (1 - t), Nu = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, Xc = (t) => t * t * t, Uc = (t) => 1 - Math.pow(1 - t, 3), ho = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, Bu = Xc, ju = Uc, qu = ho, Yu = {
  linear: vi,
  "ease-in": Bu,
  "ease-out": ju,
  "ease-in-out": qu,
  "ease-in-quad": Fu,
  "ease-out-quad": Du,
  "ease-in-out-quad": Nu,
  "ease-in-cubic": Xc,
  "ease-out-cubic": Uc,
  "ease-in-out-cubic": ho
};
function Ku(t) {
  const [e, n, s, o] = t, i = 3 * e, r = 3 * (s - e) - i, a = 1 - i - r, l = 3 * n, c = 3 * (o - n) - l, h = 1 - l - c, u = (p) => ((a * p + r) * p + i) * p, f = (p) => ((h * p + c) * p + l) * p, d = (p) => (3 * a * p + 2 * r) * p + i, g = (p) => {
    let m = p;
    for (let k = 0; k < 8; k++) {
      const y = u(m) - p;
      if (Math.abs(y) < 1e-7)
        return m;
      const S = d(m);
      if (Math.abs(S) < 1e-7)
        break;
      m -= y / S;
    }
    let b = 0, T = 1;
    for (m = p; b < T; ) {
      const k = u(m);
      if (Math.abs(k - p) < 1e-7)
        return m;
      p > k ? b = m : T = m, m = (b + T) / 2;
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
function _o(t, e = "out") {
  if (e === "out") return t;
  const n = (s) => 1 - t(1 - s);
  return e === "in" ? n : (s) => s < 0.5 ? n(s * 2) / 2 : t(s * 2 - 1) / 2 + 0.5;
}
function zu(t = 1, e = 0.3) {
  const n = Math.max(1, t), s = e / (2 * Math.PI) * Math.asin(1 / n);
  return (o) => o <= 0 ? 0 : o >= 1 ? 1 : n * Math.pow(2, -10 * o) * Math.sin((o - s) * (2 * Math.PI) / e) + 1;
}
const Xu = (t) => {
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
function Uu(t = 1.70158) {
  return (e) => {
    if (e <= 0) return 0;
    if (e >= 1) return 1;
    const n = e - 1;
    return n * n * ((t + 1) * n + t) + 1;
  };
}
function Gu(t, e = "end") {
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
function Vu(t) {
  switch (t.type) {
    case "steps":
      return Gu(t.count, t.position);
    case "elastic":
      return _o(zu(t.amplitude, t.period), t.mode);
    case "bounce":
      return _o(Xu, t.mode);
    case "back":
      return _o(Uu(t.overshoot), t.mode);
  }
}
function Ht(t) {
  return t === void 0 ? vi : Iu(t) ? Ku(t.points) : Ws(t) ? Vu(t) : Yu[t] ?? vi;
}
const ca = 32, Ju = 256, tn = /* @__PURE__ */ new Map(), Zu = /[MmLlHhVvCcSsQqTtAaZz]/, Qu = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, tf = {
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
function ef(t) {
  const e = [];
  let n = 0, s = null;
  const o = () => {
    for (; n < t.length && /[\s,]/.test(t[n]); ) n++;
  };
  for (; n < t.length && (o(), !(n >= t.length)); ) {
    const i = t[n];
    if (Zu.test(i)) {
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
    const l = Qu.exec(t.slice(n));
    if (!l) break;
    s.args.push(parseFloat(l[0])), n += l[0].length;
  }
  return e;
}
function nf(t, e, n, s, o, i, r, a, l) {
  if (t === a && e === l) return [];
  let c = Math.abs(n), h = Math.abs(s);
  if (c === 0 || h === 0) return [[t, e, a, l, a, l]];
  const u = o * Math.PI / 180, f = Math.cos(u), d = Math.sin(u), g = (t - a) / 2, p = (e - l) / 2, m = f * g + d * p, b = -d * g + f * p, T = m * m / (c * c) + b * b / (h * h);
  if (T > 1) {
    const _ = Math.sqrt(T);
    c *= _, h *= _;
  }
  const k = i === r ? -1 : 1, y = c * c * h * h - c * c * b * b - h * h * m * m, S = c * c * b * b + h * h * m * m, v = k * Math.sqrt(Math.max(0, y / S)), x = v * c * b / h, M = -v * h * m / c, w = f * x - d * M + (t + a) / 2, $ = d * x + f * M + (e + l) / 2, E = (_, L, F, P) => {
    const R = _ * F + L * P, X = Math.sqrt((_ * _ + L * L) * (F * F + P * P)), Q = Math.acos(Math.max(-1, Math.min(1, R / X)));
    return _ * P - L * F < 0 ? -Q : Q;
  }, A = E(1, 0, (m - x) / c, (b - M) / h);
  let H = E((m - x) / c, (b - M) / h, (-m - x) / c, (-b - M) / h);
  !r && H > 0 && (H -= 2 * Math.PI), r && H < 0 && (H += 2 * Math.PI);
  const I = Math.max(1, Math.ceil(Math.abs(H) / (Math.PI / 2))), C = H / I, W = 4 / 3 * Math.tan(C / 4), D = (_) => {
    const L = c * Math.cos(_), F = h * Math.sin(_);
    return [f * L - d * F + w, d * L + f * F + $];
  }, Y = (_) => {
    const L = -c * Math.sin(_), F = h * Math.cos(_);
    return [f * L - d * F, d * L + f * F];
  }, j = [];
  for (let _ = 0; _ < I; _++) {
    const L = A + _ * C, F = L + C, [P, R] = D(L), [X, Q] = _ === I - 1 ? [a, l] : D(F), [V, nt] = Y(L), [at, N] = Y(F);
    j.push([P + W * V, R + W * nt, X - W * at, Q - W * N, X, Q]);
  }
  return j;
}
function ye(t, e, n, s, o) {
  const i = 1 - o;
  return i * i * i * t + 3 * i * i * o * e + 3 * i * o * o * n + o * o * o * s;
}
function ha(t, e, n, s, o) {
  const i = 1 - o;
  return 3 * i * i * (e - t) + 6 * i * o * (n - e) + 3 * o * o * (s - n);
}
function vn(t, e, n, s) {
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
function ls(t, e, n) {
  const [s, o, i, r, a, l] = n, c = [0];
  let h = t, u = e, f = 0;
  for (let d = 1; d <= ca; d++) {
    const g = d / ca, p = ye(t, s, i, a, g), m = ye(e, o, r, l, g);
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
function fn(t) {
  const e = tn.get(t);
  if (e) return e;
  const n = [];
  let s = 0, o = 0, i = 0, r = 0, a = null, l = null, c = -1;
  const h = /* @__PURE__ */ new Set(), u = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: m } of ef(t)) {
    const b = p.toUpperCase(), T = p !== b, k = tf[b];
    if (b === "Z") {
      (s !== i || o !== r) && u(vn(s, o, i, r)), c >= 0 && h.add(c), s = i, o = r, a = l = null;
      continue;
    }
    for (let y = 0; y + k <= m.length; y += k) {
      const S = m.slice(y, y + k), v = T ? s : 0, x = T ? o : 0;
      let M = null, w = null;
      switch (b) {
        case "M":
          y === 0 ? (s = S[0] + v, o = S[1] + x, i = s, r = o, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (u(vn(s, o, S[0] + v, S[1] + x)), s = S[0] + v, o = S[1] + x);
          break;
        case "L":
          u(vn(s, o, S[0] + v, S[1] + x)), s = S[0] + v, o = S[1] + x;
          break;
        case "H":
          u(vn(s, o, S[0] + v, o)), s = S[0] + v;
          break;
        case "V":
          u(vn(s, o, s, S[0] + x)), o = S[0] + x;
          break;
        case "C": {
          const $ = [S[0] + v, S[1] + x, S[2] + v, S[3] + x, S[4] + v, S[5] + x];
          u(ls(s, o, $)), M = [$[2], $[3]], s = $[4], o = $[5];
          break;
        }
        case "S": {
          const [$, E] = a ? [2 * s - a[0], 2 * o - a[1]] : [s, o], A = [$, E, S[0] + v, S[1] + x, S[2] + v, S[3] + x];
          u(ls(s, o, A)), M = [A[2], A[3]], s = A[4], o = A[5];
          break;
        }
        case "Q":
        case "T": {
          let $ = s, E = o;
          b === "Q" ? ($ = S[0] + v, E = S[1] + x) : l && ($ = 2 * s - l[0], E = 2 * o - l[1]);
          const A = b === "Q" ? S[2] + v : S[0] + v, H = b === "Q" ? S[3] + x : S[1] + x;
          u(
            ls(s, o, [
              s + 2 / 3 * ($ - s),
              o + 2 / 3 * (E - o),
              A + 2 / 3 * ($ - A),
              H + 2 / 3 * (E - H),
              A,
              H
            ])
          ), w = [$, E], s = A, o = H;
          break;
        }
        case "A": {
          const $ = S[5] + v, E = S[6] + x;
          let A = s, H = o;
          for (const I of nf(s, o, S[0], S[1], S[2], S[3], S[4], $, E))
            u(ls(A, H, I)), A = I[4], H = I[5];
          s = $, o = E;
          break;
        }
      }
      a = M, l = w;
    }
  }
  const f = n.reduce((p, m) => p + m.length, 0), d = [];
  for (let p = 0; p < n.length; ) {
    const m = n[p].subpath;
    let b = p, T = 0;
    for (; b < n.length && n[b].subpath === m; ) T += n[b++].length;
    const k = n[p], y = n[b - 1], S = h.has(m) || Math.abs(y.endX - k.startX) < 1e-9 && Math.abs(y.endY - k.startY) < 1e-9;
    d.push({ start: p, end: b, length: T, closed: S }), p = b;
  }
  const g = { segments: n, totalLength: f, subpaths: d };
  return tn.size >= Ju && tn.delete(tn.keys().next().value), tn.set(t, g), g;
}
function sf(t, e) {
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
function of(t, e) {
  if (t.type === "L") {
    const u = t.length > 0 ? Math.max(0, Math.min(1, e / t.length)) : 0;
    return {
      x: t.startX + (t.endX - t.startX) * u,
      y: t.startY + (t.endY - t.startY) * u,
      angle: Math.atan2(t.endY - t.startY, t.endX - t.startX) * 180 / Math.PI
    };
  }
  const [n, s, o, i, r, a] = t.points, l = sf(t, e);
  let c = ha(t.startX, n, o, r, l), h = ha(t.startY, s, i, a, l);
  if (Math.hypot(c, h) < 1e-9) {
    const u = l < 0.5 ? Math.min(1, l + 1e-3) : Math.max(0, l - 1e-3), f = ye(t.startX, n, o, r, u), d = ye(t.startY, s, i, a, u), g = ye(t.startX, n, o, r, l), p = ye(t.startY, s, i, a, l);
    c = l < 0.5 ? f - g : g - f, h = l < 0.5 ? d - p : p - d;
  }
  return {
    x: ye(t.startX, n, o, r, l),
    y: ye(t.startY, s, i, a, l),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function Gc(t, e, n = 0, s = t.length) {
  if (s <= n) return { x: 0, y: 0, angle: 0 };
  let o = 0;
  for (let i = n; i < s; i++) {
    const r = t[i];
    if (o + r.length >= e || i === s - 1)
      return of(r, e - o);
    o += r.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function rf(t, e) {
  const { segments: n, totalLength: s } = fn(t);
  return Gc(n, Math.max(0, Math.min(1, e)) * s);
}
function Xk() {
  tn.clear();
}
function Uk(t) {
  return fn(t).totalLength;
}
const af = 24, lf = 320, cf = 2.5, Mn = 72, Gk = 64, hf = 0.2, uf = 128, _n = /* @__PURE__ */ new Map();
let Es = 0, ge;
const ua = (t) => Math.round(t * 100) / 100;
function fa(t, e) {
  const { segments: n, subpaths: s, totalLength: o } = fn(t);
  if (n.length === 0) return [];
  if (e) {
    const i = s.every((r) => r.closed);
    return [{ segments: n, start: 0, end: n.length, length: o, closed: i }];
  }
  return s.filter((i) => i.length > 0).map((i) => ({ segments: n, start: i.start, end: i.end, length: i.length, closed: i.closed }));
}
function Mi(t, e) {
  const n = t.closed ? (e % 1 + 1) % 1 : Math.max(0, Math.min(1, e)), s = Gc(t.segments, n * t.length, t.start, t.end);
  return [s.x, s.y];
}
function da(t) {
  const e = [];
  let n = 0;
  for (let s = t.start; s < t.end; s++)
    n += t.segments[s].length, t.length > 0 && e.push(n / t.length);
  return e;
}
function pa(t, e) {
  const n = [];
  for (let s = 0; s < e; s++)
    n.push(Mi(t, t.closed ? s / e : s / (e - 1)));
  return n;
}
function ga(t) {
  let e = 0, n = 0;
  for (const [s, o] of t)
    e += s, n += o;
  return e /= t.length, n /= t.length, t.map(([s, o]) => [s - e, o - n]);
}
function ff(t, e, n) {
  const s = t.closed && e.closed;
  if (n !== void 0)
    return { offset: s ? Math.abs(n) % Mn / Mn : 0, reversed: n < 0 };
  const o = ga(pa(t, Mn)), i = ga(pa(e, Mn)), r = Mn;
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
function df(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t + e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function pf(t, e, n) {
  return n ? ((e.reversed ? e.offset - t : t - e.offset) % 1 + 1) % 1 : e.reversed ? 1 - t : t;
}
function gf(t, e, n) {
  const s = t.closed && e.closed, o = ff(t, e, n.shapeIndex), i = Math.max(
    af,
    Math.min(lf, Math.ceil(Math.max(t.length, e.length) / cf))
  ), r = /* @__PURE__ */ new Set(), a = (u) => r.add(Math.round(u * 1e7) / 1e7);
  for (let u = 0; u <= i; u++) a(u / i);
  for (const u of da(t)) a(u);
  for (const u of da(e)) a(pf(u, o, s));
  let l = [...r].sort((u, f) => u - f);
  s && (l = l.filter((u) => u < 1));
  const c = [], h = [];
  for (const u of l)
    c.push(...Mi(t, u)), h.push(...Mi(e, df(u, o, s)));
  return mf({ from: c, to: h, closed: s });
}
function mf(t) {
  const e = t.from.length / 2;
  if (e <= 3) return t;
  const n = new Uint8Array(e);
  n[0] = 1, n[e - 1] = 1;
  const s = [[0, e - 1]];
  for (; s.length > 0; ) {
    const [r, a] = s.pop();
    let l = -1, c = hf;
    for (let h = r + 1; h < a; h++) {
      const u = Math.max(ma(t.from, r, a, h), ma(t.to, r, a, h));
      u > c && (c = u, l = h);
    }
    l !== -1 && (n[l] = 1, s.push([r, l], [l, a]));
  }
  const o = [], i = [];
  for (let r = 0; r < e; r++)
    n[r] && (o.push(t.from[r * 2], t.from[r * 2 + 1]), i.push(t.to[r * 2], t.to[r * 2 + 1]));
  return { from: o, to: i, closed: t.closed };
}
function ma(t, e, n, s) {
  const o = t[e * 2], i = t[e * 2 + 1], r = t[n * 2] - o, a = t[n * 2 + 1] - i, l = t[s * 2] - o, c = t[s * 2 + 1] - i, h = r * r + a * a, u = h === 0 ? 0 : Math.max(0, Math.min(1, (l * r + c * a) / h));
  return Math.hypot(l - u * r, c - u * a);
}
function yf(t, e, n) {
  const s = n.shapeIndex;
  if (ge && ge.from === t && ge.to === e && ge.shapeIndex === s) return ge.plan;
  const i = _n.get(String(s ?? "auto"))?.get(t)?.get(e);
  if (i)
    return ge = { from: t, to: e, shapeIndex: s, plan: i }, i;
  const r = fn(t).subpaths.filter((d) => d.length > 0).length === fn(e).subpaths.filter((d) => d.length > 0).length, a = fa(t, !r), l = fa(e, !r), c = {
    pairs: a.map((d, g) => gf(d, l[g], n))
  };
  Es >= uf && (_n.clear(), Es = 0);
  const h = String(s ?? "auto"), u = _n.get(h) ?? /* @__PURE__ */ new Map();
  _n.set(h, u);
  const f = u.get(t) ?? /* @__PURE__ */ new Map();
  return u.set(t, f), f.set(e, c), Es++, ge = { from: t, to: e, shapeIndex: s, plan: c }, c;
}
function bf(t, e, n, s = {}) {
  if (!t) return e;
  if (!e) return t;
  const o = Math.max(0, Math.min(1, n));
  if (o === 0) return t;
  if (o === 1) return e;
  const i = yf(t, e, s);
  if (i.pairs.length === 0) return o < 0.5 ? t : e;
  let r = "";
  for (const a of i.pairs) {
    for (let l = 0; l < a.from.length; l += 2) {
      const c = ua(a.from[l] + (a.to[l] - a.from[l]) * o), h = ua(a.from[l + 1] + (a.to[l + 1] - a.from[l + 1]) * o);
      r += `${l === 0 ? r ? " M" : "M" : " L"}${c} ${h}`;
    }
    a.closed && (r += " Z");
  }
  return r;
}
function Vk() {
  _n.clear(), Es = 0, ge = void 0;
}
function ns(t) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(t);
}
const en = Math.PI / 180, wf = 0.9995;
function cr() {
  return [0, 0, 0, 1];
}
function zt(t, e) {
  const n = Math.hypot(t[0], t[1], t[2]);
  if (n === 0) return cr();
  const s = e * en / 2, o = Math.sin(s) / n;
  return [t[0] * o, t[1] * o, t[2] * o, Math.cos(s)];
}
function kf(t, e, n) {
  return xi(xi(zt([0, 1, 0], e), zt([1, 0, 0], t)), zt([0, 0, 1], n));
}
function vf(t) {
  const [e, n, s, o] = ve(t), i = 2 * (e * s + n * o), r = 2 * (e * n + s * o), a = 1 - 2 * (e * e + s * s), l = 2 * (n * s - e * o), c = 1 - 2 * (n * n + s * s), h = 2 * (e * s - n * o), u = 1 - 2 * (e * e + n * n), f = Math.asin(Math.max(-1, Math.min(1, -l)));
  return Math.abs(l) < 0.9999999 ? [f / en, Math.atan2(i, u) / en, Math.atan2(r, a) / en] : [f / en, Math.atan2(-h, c) / en, 0];
}
function xi(t, e) {
  const [n, s, o, i] = t, [r, a, l, c] = e;
  return [
    i * r + n * c + s * l - o * a,
    i * a - n * l + s * c + o * r,
    i * l + n * a - s * r + o * c,
    i * c - n * r - s * a - o * l
  ];
}
function Vc(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2] + t[3] * e[3];
}
function Jc(t) {
  return Math.hypot(t[0], t[1], t[2], t[3]);
}
function ve(t) {
  const e = Jc(t);
  return e === 0 ? cr() : [t[0] / e, t[1] / e, t[2] / e, t[3] / e];
}
function Mf(t) {
  return [-t[0], -t[1], -t[2], t[3]];
}
function Zc(t, e, n) {
  const s = ve(t);
  let o = ve(e), i = Vc(s, o);
  if (i < 0 && (o = [-o[0], -o[1], -o[2], -o[3]], i = -i), i > wf)
    return ve([
      s[0] + (o[0] - s[0]) * n,
      s[1] + (o[1] - s[1]) * n,
      s[2] + (o[2] - s[2]) * n,
      s[3] + (o[3] - s[3]) * n
    ]);
  const r = Math.acos(i), a = Math.sin(r), l = Math.sin((1 - n) * r) / a, c = Math.sin(n * r) / a;
  return ve([
    s[0] * l + o[0] * c,
    s[1] * l + o[1] * c,
    s[2] * l + o[2] * c,
    s[3] * l + o[3] * c
  ]);
}
function xf(t, e) {
  const [n, s, o, i] = ve(t), r = 2 * (s * e[2] - o * e[1]), a = 2 * (o * e[0] - n * e[2]), l = 2 * (n * e[1] - s * e[0]);
  return [e[0] + i * r + (s * l - o * a), e[1] + i * a + (o * r - n * l), e[2] + i * l + (n * a - s * r)];
}
const Jk = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  conjugate: Mf,
  dot: Vc,
  fromAxisAngle: zt,
  fromEuler: kf,
  identity: cr,
  length: Jc,
  multiply: xi,
  normalize: ve,
  rotateVec3: xf,
  slerp: Zc,
  toEuler: vf
}, Symbol.toStringTag, { value: "Module" })), ce = (t, e, n) => t + (e - t) * n, Qc = 512, Ho = /* @__PURE__ */ new Map(), Co = /* @__PURE__ */ new Map();
function ya(t) {
  const e = Ho.get(t);
  if (e) return e;
  const n = t.replace("#", ""), s = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return Ho.size < Qc && Ho.set(t, s), s;
}
const ba = (t) => t.charCodeAt(0) === 35, wa = (t) => t.startsWith("rgb"), ka = (t) => t.startsWith("rgba"), Sf = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Ro = (t) => Math.round(t).toString(16).padStart(2, "0");
function Tf(t, e, n) {
  return `#${Ro(t)}${Ro(e)}${Ro(n)}`;
}
function va(t) {
  const e = Co.get(t);
  if (e) return e;
  const n = t.match(Sf);
  if (!n)
    throw new Error(`Invalid rgb color: ${t}`);
  const s = parseInt(n[1], 10), o = parseInt(n[2], 10), i = parseInt(n[3], 10), r = n[4] !== void 0 ? [s, o, i, parseFloat(n[4])] : [s, o, i];
  return Co.size < Qc && Co.set(t, r), r;
}
const Ef = (t, e, n) => {
  if (ba(t) && ba(e)) {
    const [s, o, i] = ya(t), [r, a, l] = ya(e), c = ce(s, r, n), h = ce(o, a, n), u = ce(i, l, n);
    return Tf(c, h, u);
  }
  if ((wa(t) || ka(t)) && (wa(e) || ka(e))) {
    const s = va(t), o = va(e), i = Math.round(ce(s[0], o[0], n)), r = Math.round(ce(s[1], o[1], n)), a = Math.round(ce(s[2], o[2], n));
    if (s.length === 4 || o.length === 4) {
      const l = s[3] ?? 1, c = o[3] ?? 1, h = ce(l, c, n);
      return `rgba(${i}, ${r}, ${a}, ${h})`;
    }
    return `rgb(${i}, ${r}, ${a})`;
  }
  return n < 1 ? t : e;
}, Af = (t, e, n) => {
  const s = Math.min(t.length, e.length), o = [];
  for (let i = 0; i < s; i++)
    o.push(ce(t[i], e[i], n));
  return o;
}, $f = (t, e, n) => Zc(t, e, n), Ma = (t, e, n) => n < 1 ? t : e, Pf = (t, e, n) => bf(t, e, n);
function Ds(t, e) {
  return e === "slerp" ? $f : typeof t == "number" ? ce : Array.isArray(t) ? Af : typeof t == "string" ? t.startsWith("#") || t.startsWith("rgb") ? Ef : ns(t) ? Pf : Ma : Ma;
}
const th = 1e3 / 60;
function eh(t, e = {}) {
  if (!Ye(t))
    throw new Error(`bakeSpringTrack: track "${t.id}" is not a spring track`);
  const n = new lo(t.spring);
  return sh(t, (s) => n.valueAt(s), n.settleTime(), t.spring.from, t.spring.to, e);
}
function nh(t, e = {}) {
  if (!qe(t))
    throw new Error(`bakeInertiaTrack: track "${t.id}" is not an inertia track`);
  const n = t.inertia;
  return sh(
    t,
    (s) => ki(n, s),
    es(n),
    n.from,
    ts(n),
    e
  );
}
function sh(t, e, n, s, o, i) {
  const r = i.intervalMs ?? th, a = i.tolerance ?? 0.01, l = t.delay ?? 0, c = [];
  for (let u = 0; u <= n; u += r)
    c.push({ time: u + l, value: e(u), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + l ? c.push({ time: n + l, value: o, easing: "linear" }) : h.value = o, l > 0 && c.unshift({ time: 0, value: s, easing: "linear" }), {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: a > 0 ? Of(c, a) : c,
    ...t.targets && { targets: [...t.targets] },
    ...t.stagger && { stagger: { ...t.stagger } }
  };
}
function oh(t, e, n, s = {}) {
  const o = s.intervalMs ?? th, i = typeof n == "function" ? n : Ht(n), r = Ds(t.value, s.interpolation), a = e.time - t.time;
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
function Zk(t, e) {
  return Ye(t) ? eh(t, e) : qe(t) ? nh(t, e) : t;
}
function If(t, e = {}) {
  const n = t.keyframes;
  if (!n.some((i) => Ws(i.easing))) return t;
  const s = n.length > 0 ? [n[0]] : [], o = { ...e, interpolation: t.interpolation ?? e.interpolation };
  for (let i = 1; i < n.length; i++) {
    const r = n[i];
    Ws(r.easing) ? s.push(...oh(n[i - 1], r, r.easing, o)) : s.push(r);
  }
  return { ...t, keyframes: s };
}
function Qk(t, e) {
  return t.filter(Ou).map((n) => If(n, e)).concat(
    t.filter(Ye).map((n) => eh(n, e)),
    t.filter(qe).map((n) => nh(n, e))
  );
}
function Of(t, e) {
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
function Si(t) {
  const e = [...t.keyframes].sort((n, s) => n.time - s.time);
  return {
    ...t,
    keyframes: e
  };
}
function Oe(t) {
  return t.targets && t.targets.length > 0 ? t.targets : [t.target];
}
function dn(t, e, n, s) {
  const o = n ?? 0;
  return !s || e <= 1 ? o : o + lr(t, e, s);
}
class Lo {
  track;
  targets;
  constructor(e) {
    this.track = e, this.targets = Oe(e);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(e) {
    return this.valueForOffset(e - dn(0, this.targets.length, this.track.delay, this.track.stagger));
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
      const i = dn(o, n, this.track.delay, this.track.stagger), r = this.valueForOffset(e - i);
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
    const n = e[e.length - 1].time, s = this.track.stagger ? ao(this.targets.length, this.track.stagger) : 0;
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
    const i = o.time - s.time, r = (e - s.time) / i, l = Ht(o.easing)(r);
    return Ds(s.value, this.track.interpolation)(s.value, o.value, l);
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
class _f {
  track;
  targets;
  sampler;
  constructor(e) {
    this.track = e, this.targets = Oe(e), this.sampler = new lo(e.spring);
  }
  getValueAtTime(e) {
    return this.sampler.valueAt(e - dn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = dn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: this.sampler.valueAt(e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? ao(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
class Hf {
  track;
  targets;
  duration;
  constructor(e) {
    this.track = e, this.targets = Oe(e), this.duration = es(e.inertia);
  }
  getValueAtTime(e) {
    return ki(this.track.inertia, e - dn(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(e) {
    const n = this.targets.length, s = [];
    for (let o = 0; o < n; o++) {
      const i = dn(o, n, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[o], value: ki(this.track.inertia, e - i), start: i });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const e = this.track.stagger ? ao(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + e;
  }
  getTrack() {
    return this.track;
  }
}
function ih(t, e) {
  const n = { ...rf(t.pathData, e) };
  if (t.matrix) {
    const [s, o, i, r, a, l] = t.matrix, { x: c, y: h } = n;
    n.x = s * c + i * h + a, n.y = o * c + r * h + l;
    const u = n.angle * Math.PI / 180, f = Math.cos(u), d = Math.sin(u);
    n.angle = Math.atan2(o * f + r * d, s * f + i * d) * 180 / Math.PI;
  }
  return t.autoRotate && t.rotateOffset && (n.angle += t.rotateOffset), n;
}
function tv(t, e, n, s) {
  const o = e + (n - e) * s;
  return ih(t, o);
}
const Wo = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Cf = 20;
function Rf(t) {
  const e = Wo[t ?? "upperCase"] ?? t ?? Wo.upperCase, n = Array.from(e);
  return n.length > 0 ? n : Array.from(Wo.upperCase);
}
function Lf(t, e, n) {
  let s = (t | 0) ^ Math.imul(e + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function Wf(t, e, n = 0) {
  const s = t.from ?? "", o = t.to, i = Math.max(0, Math.min(1, e));
  if (i <= 0) return s;
  if (i >= 1) return o;
  const r = Array.from(s), a = Array.from(o), l = t.rightToLeft ?? !1;
  if (t.mode === "type") {
    const T = Math.round(i * Math.max(r.length, a.length));
    return l ? r.slice(0, Math.max(0, r.length - T)).join("") + a.slice(Math.max(0, a.length - T)).join("") : a.slice(0, T).join("") + r.slice(T).join("");
  }
  const c = Math.max(0, Math.min(0.999, t.revealDelay ?? 0)), h = Math.max(0, (i - c) / (1 - c)), u = Math.floor(h * a.length), f = t.tweenLength === !1 ? a.length : Math.round(r.length + (a.length - r.length) * i), d = Rf(t.chars), g = t.refreshRate ?? Cf, p = g > 0 ? Math.floor(n * g / 1e3) : 0, m = t.seed ?? 1;
  let b = "";
  for (let T = 0; T < f; T++) {
    const k = l ? T >= f - u : T < u, y = l ? a[a.length - (f - T)] : a[T];
    k && y !== void 0 || y === " " || y === `
` ? b += y : b += d[Lf(m, T, p) % d.length];
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
    if (e = _u(e, this._config.drawingRate ?? 0), this._hasSharedWrites())
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
      a.set("text", Wf(l.textConfig, i, Math.max(0, r)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof i == "number") {
      const h = ih(c.motionPathConfig, i);
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
        for (const s of Oe(n)) {
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
    if (this._tracks.push(e), this._sharedWrites = null, qe(e)) {
      this._trackPlayers.set(e.id, new Hf(e));
      return;
    }
    if (Ye(e)) {
      this._trackPlayers.set(e.id, new _f(e)), this._springTracks.set(e.id, e);
      return;
    }
    if (ar(e))
      this._trackPlayers.set(e.id, new Lo(e)), this._textTracks.set(e.id, e);
    else if (qc(e)) {
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
      this._trackPlayers.set(e.id, new Lo(n)), this._motionPathTracks.set(e.id, e);
    } else
      this._trackPlayers.set(e.id, new Lo(e));
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
    if (Ye(s) || qe(s))
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
          const a = Oe(r).filter((u) => Oe(s).includes(u));
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
    if (n.id !== void 0 && e.id !== n.id || n.property !== void 0 && e.property !== n.property || n.target !== void 0 && !Oe(e).includes(n.target)) return !1;
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
      formatVersion: jc(this._tracks),
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
const Ff = 100;
function rh(t, e, n, s) {
  const o = [], i = [], { duration: r, alternate: a } = s, l = (d, g, p, m) => {
    i.push([d, g]);
    const b = [];
    t.forEach((T, k) => {
      (p === "forward" ? (m ? T >= d : T > d) && T <= g : (m ? T <= d : T < d) && T >= g) && b.push(k);
    }), b.sort((T, k) => (p === "forward" ? t[T] - t[k] : t[k] - t[T]) || T - k);
    for (const T of b) o.push({ kind: "event", index: T, direction: p });
  };
  let c = e.time, h = e.direction, u = e.fresh === !0;
  const f = Math.min(Ff, Math.max(0, n.iteration - e.iteration));
  for (let d = 0; d < f; d++) {
    const g = h === "forward" ? r : 0;
    l(c, g, h, u), o.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", c = g, u = !1) : (c = h === "forward" ? 0 : r, u = !0);
  }
  return f > 0 && s.holding && !a ? { crossings: o, passes: i } : (l(c, n.time, h, u), { crossings: o, passes: i });
}
function Df(t) {
  return qe(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "inertia",
    inertia: ah(t.inertia),
    ...oe(t)
  } : Ye(t) ? {
    id: t.id,
    target: t.target,
    property: t.property,
    kind: "spring",
    spring: { ...t.spring },
    ...oe(t)
  } : ar(t) ? {
    id: t.id,
    target: t.target,
    property: "text",
    textConfig: { ...t.textConfig },
    keyframes: t.keyframes.map(Fo),
    ...oe(t)
  } : qc(t) ? {
    id: t.id,
    target: t.target,
    property: "motionPath",
    motionPathConfig: { ...t.motionPathConfig },
    keyframes: t.keyframes.map(Fo),
    ...oe(t)
  } : {
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes.map(Fo),
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...oe(t)
  };
}
function ah(t) {
  return { ...t, ...Array.isArray(t.end) && { end: [...t.end] } };
}
function Fo(t) {
  return {
    time: t.time,
    value: t.value,
    ...t.easing && { easing: t.easing }
  };
}
function oe(t) {
  const e = t.endDelay;
  return {
    ...t.delay !== void 0 && { delay: t.delay },
    ...e !== void 0 && { endDelay: e },
    ...t.targets !== void 0 && { targets: [...t.targets] },
    ...t.stagger !== void 0 && { stagger: { ...t.stagger } }
  };
}
function Nf(t) {
  if (qe(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "inertia",
      inertia: ah(e.inertia),
      ...oe(e)
    };
  }
  if (Ye(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: e.property,
      kind: "spring",
      spring: { ...e.spring },
      ...oe(e)
    };
  }
  if (ar(t)) {
    const e = t;
    return {
      id: e.id,
      target: e.target,
      property: "text",
      textConfig: { ...e.textConfig },
      keyframes: [...e.keyframes].sort((n, s) => n.time - s.time),
      ...oe(e)
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
      ...oe(e)
    };
  }
  return Si({
    id: t.id,
    target: t.target,
    property: t.property,
    keyframes: t.keyframes,
    ...t.interpolation !== void 0 && { interpolation: t.interpolation },
    ...oe(t)
  });
}
function Bf(t) {
  const e = t._config.markers;
  return {
    formatVersion: jc(t.tracks),
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
    tracks: t.tracks.map(Df),
    ...t.captions && { captions: JSON.parse(JSON.stringify(t.captions)) }
  };
}
function qn(t) {
  const e = t.formatVersion ?? 1;
  if (e > aa)
    throw new Error(
      `tinyfly: this animation uses format version ${e}, but this tinyfly reads up to version ${aa}. Update tinyfly to play it.`
    );
  return new Ct({
    id: t.id,
    name: t.name,
    config: t.config,
    tracks: t.tracks.map(Nf),
    captions: t.captions
  });
}
function ev(t) {
  return JSON.stringify(Bf(t));
}
function nv(t) {
  const e = JSON.parse(t);
  return qn(e);
}
function te(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++)
    e ^= t.charCodeAt(n), e = Math.imul(e, 16777619);
  return e >>> 0;
}
function bn(t) {
  let e = t >>> 0 || 2654435769;
  return {
    seed: t >>> 0,
    next() {
      return e ^= e << 13, e >>>= 0, e ^= e >> 17, e ^= e << 5, e >>>= 0, e / 4294967296;
    }
  };
}
function lh(t, e, n) {
  return e + t.next() * (n - e);
}
function jf(t, e, n, s) {
  if (s <= 0) return lh(t, e, n);
  const o = Math.floor((n - e) / s), i = Math.round(t.next() * o);
  return e + i * s;
}
function sv(t, e) {
  if (e.length !== 0)
    return e[Math.floor(t.next() * e.length)];
}
const ch = /^([+\-*/])=\s*(-?[\d.]+)$/, hh = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function ov(t) {
  return typeof t != "string" ? !1 : ch.test(t.trim()) || hh.test(t.trim());
}
function uh(t, e = {}) {
  if (typeof t != "string") return t;
  const n = t.trim(), s = ch.exec(n);
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
  const o = hh.exec(n);
  if (o) {
    if (!e.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const i = Number.parseFloat(o[1]), r = Number.parseFloat(o[2]), a = o[3] !== void 0 ? Number.parseFloat(o[3]) : void 0;
    return a !== void 0 ? jf(e.random, i, r, a) : lh(e.random, i, r);
  }
  return t;
}
function qf(t, e = 0, n) {
  const s = [];
  let o = e;
  for (const i of t) {
    const r = uh(i, { base: o, random: n });
    s.push(r), typeof r == "number" && (o = r);
  }
  return s;
}
class iv {
  random;
  constructor(e) {
    this.random = bn(e);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(e, n = 0) {
    return uh(e, { base: n, random: this.random });
  }
  resolveSequence(e, n = 0) {
    return qf(e, n, this.random);
  }
}
const Yf = 600;
function Kf(t) {
  if (Array.isArray(t)) {
    const [f, d, g, p] = t;
    return { fn: xa(f, d, g, p), bezier: [f, d, g, p] };
  }
  const { segments: e } = fn(t);
  if (e.length === 0) throw new Error(`customEase: no curve in "${t}"`);
  const n = e[0].startX, s = e[0].startY, o = e[e.length - 1], i = o.endX - n, r = o.endY - s;
  if (i === 0 || r === 0) throw new Error(`customEase: "${t}" must move along both axes`);
  const a = (f) => (f - n) / i, l = (f) => (f - s) / r;
  if (e.length === 1 && o.type === "C") {
    const [f, d, g, p] = o.points, m = [a(f), l(d), a(g), l(p)];
    return { fn: xa(...m), bezier: m };
  }
  const c = [], h = [], u = Math.max(8, Math.ceil(Yf / e.length));
  for (const f of e)
    for (let d = c.length === 0 ? 0 : 1; d <= u; d++) {
      const [g, p] = Uf(f, d / u);
      c.push(a(g)), h.push(l(p));
    }
  return { fn: Gf(c, h) };
}
function zf(t = {}) {
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
function Xf(t = {}) {
  const e = Math.max(1, t.wiggles ?? 10), n = t.type ?? "easeOut", s = (o) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * o) : (1 - o) ** 2;
  return (o) => o <= 0 || o >= 1 ? 0 : Math.sin(o * e * Math.PI * 2) * s(o);
}
function Uf(t, e) {
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
function Gf(t, e) {
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
function xa(t, e, n, s) {
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
const Vf = 350, Jf = 300, Zf = 550;
function rv(t, e = {}) {
  const n = e.lead ?? Vf, s = e.gap ?? Jf, o = e.tail ?? Zf, i = [];
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
function av(t) {
  return t.cues.map((e) => ({ id: e.id, time: e.start, label: e.text }));
}
function lv(t, e) {
  let n = t.scenes[0];
  for (const s of t.scenes)
    if (e >= s.start) n = s;
    else break;
  return n;
}
const fh = (t) => 6e4 / t.bpm;
function hr(t, e) {
  return t.offset + e * fh(t);
}
function ur(t, e) {
  return (e - t.offset) / fh(t);
}
function cv(t, e) {
  return hr(t, Math.round(ur(t, e)));
}
function hv(t, e) {
  return hr(t, Math.ceil(ur(t, e) - 1e-9));
}
function uv(t, e, n) {
  const s = Math.max(1, Math.round(t.beatsPerBar ?? 4)), o = [];
  if (!(t.bpm > 0) || n < e) return o;
  for (let i = Math.ceil(ur(t, e) - 1e-9); ; i++) {
    const r = hr(t, i);
    if (r > n + 1e-9) break;
    o.push({ time: r, bar: (i % s + s) % s === 0, n: i });
  }
  return o;
}
const Ue = 100;
function fv(t, e, n = {}) {
  const s = n.minBpm ?? 70, o = n.maxBpm ?? 180, i = Math.max(1, Math.round(e / Ue)), r = Math.min(t.length, Math.round((n.maxSeconds ?? 60) * e)), a = Math.floor(r / i);
  if (a < 4) return { bpm: 120, offset: 0, confidence: 0 };
  const l = new Float64Array(a);
  for (let w = 0; w < a; w++) {
    let $ = 0;
    for (let E = w * i; E < (w + 1) * i; E++) $ += t[E] * t[E];
    l[w] = Math.log(1e-6 + $ / i);
  }
  const c = new Float64Array(a);
  for (let w = 1; w < a; w++) c[w] = Math.max(0, l[w] - l[w - 1]);
  const h = c.reduce((w, $) => w + $, 0) / a;
  for (let w = 0; w < a; w++) c[w] = Math.max(0, c[w] - h);
  const u = Math.max(1, Math.floor(60 * Ue / o)), f = Math.min(a - 1, Math.ceil(60 * Ue / s)), d = (w) => {
    let $ = 0;
    for (let E = w; E < a; E++) $ += c[E] * c[E - w];
    return $ / (a - w);
  };
  let g = 0;
  for (let w = 0; w < a; w++) g += c[w] * c[w];
  g /= a;
  let p = u, m = -1 / 0;
  for (let w = u; w <= f; w++) {
    const $ = 60 * Ue / w, E = Math.exp(-0.5 * (Math.log2($ / 120) / 0.9) ** 2), A = d(w) * E;
    A > m && (m = A, p = w);
  }
  const b = (w) => {
    const $ = Math.floor(w);
    return $ < 0 || $ + 1 >= a ? 0 : c[$] + (c[$ + 1] - c[$]) * (w - $);
  }, T = (w, $) => {
    let E = 0;
    for (let A = $; A < a; A += w) E += b(A);
    return E;
  };
  let k = p, y = 0, S = -1 / 0;
  for (let w = p - 0.6; w <= p + 0.6 + 1e-9; w += 0.02) {
    if (w < 1) continue;
    const $ = Math.max(1, Math.round(w * 4));
    for (let E = 0; E < $; E++) {
      const A = E / $ * w, H = T(w, A);
      H > S && (S = H, y = A, k = w);
    }
  }
  const v = 60 * Ue / k, x = g > 0 ? Math.max(0, Math.min(1, d(p) / g)) : 0, M = (y + 0.5) * 1e3 / Ue;
  return { bpm: Math.round(v * 100) / 100, offset: Math.round(M % (6e4 / v)), confidence: x };
}
const Qf = 600, td = 250, Sa = 1;
function dv(t, e) {
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
      const f = Math.max(Sa, u.duration ?? Qf);
      a(u.at, l), l = {
        focusX: u.frame.focus?.x ?? s.x,
        focusY: u.frame.focus?.y ?? s.y,
        scale: u.frame.scale ?? 1,
        rotate: u.frame.rotate ?? 0
      }, a(u.at + f, l, u.easing ?? (f > Sa ? "ease-in-out" : void 0));
    } else {
      const { follow: f } = u, d = f.lag ?? td, g = new Ct({ id: "follow", tracks: [{ id: "x", target: "s", property: "x", keyframes: f.x }] }), p = (T) => g.getStateAtTime(T).values.get("s")?.get("x") ?? l.focusX, m = [u.at, ...f.x.map((T) => T.time).filter((T) => T > u.at && T < u.until), u.until];
      a(u.at, l);
      const b = (T) => ({
        focusX: p(T) + (f.lead ?? 0),
        focusY: f.y ?? l.focusY,
        scale: f.scale ?? l.scale,
        rotate: l.rotate
      });
      for (const T of m) {
        const k = f.x.find((y) => y.time === T)?.easing;
        a(T + d, b(T), T === u.at ? "ease-in-out" : k);
      }
      l = b(u.until);
    }
  for (const u of c.filter((f) => "shake" in f)) {
    const f = u.shake.strength ?? 12, d = u.shake.roll ?? 1.5, g = 1e3 / (u.shake.frequency ?? 24), p = bn(u.shake.seed ?? Math.round(u.at) + 1), m = () => p.next() * 2 - 1;
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at, 0);
    for (let b = u.at + g; b < u.at + u.duration; b += g) {
      const T = 1 - (b - u.at) / u.duration;
      i("shakeX", b, m() * f * T), i("shakeY", b, m() * f * T), i("shakeRotate", b, m() * d * T);
    }
    for (const b of ["shakeX", "shakeY", "shakeRotate"]) i(b, u.at + u.duration, 0, "ease-out");
  }
  return Object.entries(o).map(([u, f]) => ({ id: `${n}-${u}`, target: n, property: u, keyframes: f }));
}
function ed(t, e) {
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
function Ns(t, e) {
  const n = t.toLowerCase(), s = e.find((r) => r.toLowerCase().includes(n) || n.includes(r.toLowerCase()));
  if (s && Math.min(t.length, s.length) >= 3) return s;
  let o, i = 1 / 0;
  for (const r of e) {
    const a = ed(t, r);
    a < i && (i = a, o = r);
  }
  return o !== void 0 && i <= Math.max(2, Math.floor(t.length / 3)) ? o : void 0;
}
function ft(t, e, n, s) {
  const o = typeof e == "string" ? s ?? Ns(e, n) : void 0;
  return `Unknown ${t} ${JSON.stringify(e)}${o ? `: did you mean "${o}"?` : "."} Known: ${n.join(", ")}`;
}
function As(t, e) {
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
const ee = (t) => Math.round(t * 1e3) / 1e3;
function nd(t, e = {}) {
  if (t.length === 0) return "";
  const n = e.curviness ?? 1, s = e.closed ?? !1, o = t.length;
  let i = `M${ee(t[0].x)} ${ee(t[0].y)}`;
  if (o === 1) return i;
  const r = (l) => s ? t[(l % o + o) % o] : t[Math.max(0, Math.min(o - 1, l))], a = s ? o : o - 1;
  for (let l = 0; l < a; l++) {
    const c = r(l - 1), h = r(l), u = r(l + 1), f = r(l + 2);
    if (n === 0) {
      i += ` L${ee(u.x)} ${ee(u.y)}`;
      continue;
    }
    const d = n / 6, g = h.x + (u.x - c.x) * d, p = h.y + (u.y - c.y) * d, m = u.x - (f.x - h.x) * d, b = u.y - (f.y - h.y) * d;
    i += ` C${ee(g)} ${ee(p)} ${ee(m)} ${ee(b)} ${ee(u.x)} ${ee(u.y)}`;
  }
  return s ? `${i} Z` : i;
}
const Pt = (t, e = 0) => {
  const n = parseFloat(t ?? "");
  return Number.isFinite(n) ? n : e;
};
function sd(t) {
  const e = (t ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let s = 0; s + 1 < e.length; s += 2) n.push({ x: e[s], y: e[s + 1] });
  return n;
}
function fr(t) {
  const e = t.attributes;
  switch (t.tag.toLowerCase()) {
    case "path":
      return e.d ?? null;
    case "circle":
    case "ellipse": {
      const n = Pt(e.cx), s = Pt(e.cy), o = t.tag.toLowerCase() === "circle" ? Pt(e.r) : Pt(e.rx), i = t.tag.toLowerCase() === "circle" ? Pt(e.r) : Pt(e.ry);
      return `M${n + o} ${s} A${o} ${i} 0 1 1 ${n - o} ${s} A${o} ${i} 0 1 1 ${n + o} ${s} Z`;
    }
    case "rect": {
      const n = Pt(e.x), s = Pt(e.y), o = Pt(e.width), i = Pt(e.height);
      let r = e.rx != null ? Pt(e.rx) : e.ry != null ? Pt(e.ry) : 0, a = e.ry != null ? Pt(e.ry) : r;
      return r = Math.min(r, o / 2), a = Math.min(a, i / 2), r === 0 || a === 0 ? `M${n} ${s} H${n + o} V${s + i} H${n} Z` : `M${n + r} ${s} H${n + o - r} A${r} ${a} 0 0 1 ${n + o} ${s + a} V${s + i - a} A${r} ${a} 0 0 1 ${n + o - r} ${s + i} H${n + r} A${r} ${a} 0 0 1 ${n} ${s + i - a} V${s + a} A${r} ${a} 0 0 1 ${n + r} ${s} Z`;
    }
    case "line":
      return `M${Pt(e.x1)} ${Pt(e.y1)} L${Pt(e.x2)} ${Pt(e.y2)}`;
    case "polyline":
    case "polygon": {
      const n = sd(e.points);
      if (n.length === 0) return null;
      const s = n.map((o, i) => `${i === 0 ? "M" : "L"}${o.x} ${o.y}`).join(" ");
      return t.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
function pv(t, e, n) {
  const s = Math.max(2, Math.round(n.samples ?? 32)), o = Math.max(0, n.length), i = n.since !== void 0 ? Math.max(e - o, n.since) : e - o;
  if (i >= e) return [];
  const r = n.period, a = [];
  for (let l = 0; l < s; l++) {
    const c = i + (e - i) * l / (s - 1), h = r && r > 0 && l < s - 1 ? (c % r + r) % r : c;
    a.push({ at: t(h), time: c, age: o > 0 ? (e - c) / o : 0 });
  }
  return a;
}
const od = 2.5;
function id(t) {
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
    const g = u * c[0] + f * c[1], p = Math.min(od, 1 / Math.max(g, 1e-6)), m = r.width / 2 * p;
    e.push({ x: r.x - f * m, y: r.y + u * m }), n.push({ x: r.x + f * m, y: r.y - u * m });
  }
  return { left: e, right: n };
}
function rd(t) {
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
function $s(t, e) {
  return [t[0] + e[0], t[1] + e[1], t[2] + e[2]];
}
function wn(t, e) {
  return [t[0] - e[0], t[1] - e[1], t[2] - e[2]];
}
function an(t, e) {
  return [t[0] * e, t[1] * e, t[2] * e];
}
function Se(t, e) {
  return t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
}
function Bs(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function uo(t) {
  return Math.hypot(t[0], t[1], t[2]);
}
function dr(t, e) {
  return uo(wn(t, e));
}
function Ke(t) {
  const e = uo(t);
  return e === 0 ? [0, 0, 0] : an(t, 1 / e);
}
function dh(t, e, n) {
  return [t[0] + (e[0] - t[0]) * n, t[1] + (e[1] - t[1]) * n, t[2] + (e[2] - t[2]) * n];
}
const gv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: $s,
  cross: Bs,
  distance: dr,
  dot: Se,
  length: uo,
  lerp: dh,
  normalize: Ke,
  scale: an,
  subtract: wn
}, Symbol.toStringTag, { value: "Module" })), ad = Math.PI / 180;
function fo() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}
function Et(t, e) {
  const n = new Array(16);
  for (let s = 0; s < 4; s++)
    for (let o = 0; o < 4; o++) {
      let i = 0;
      for (let r = 0; r < 4; r++) i += t[r * 4 + o] * e[s * 4 + r];
      n[s * 4 + o] = i;
    }
  return n;
}
function _e(t) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1];
}
function De(t) {
  return [t[0], 0, 0, 0, 0, t[1], 0, 0, 0, 0, t[2], 0, 0, 0, 0, 1];
}
function Qt(t) {
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
function pr(t, e, n) {
  const s = Qt(e);
  for (let o = 0; o < 3; o++)
    s[o] *= n[0], s[4 + o] *= n[1], s[8 + o] *= n[2];
  return s[12] = t[0], s[13] = t[1], s[14] = t[2], s;
}
function ld(t) {
  const e = new Array(16);
  for (let n = 0; n < 4; n++) for (let s = 0; s < 4; s++) e[s * 4 + n] = t[n * 4 + s];
  return e;
}
function gr(t) {
  const [e, n, s, o, i, r, a, l, c, h, u, f, d, g, p, m] = t, b = e * r - n * i, T = e * a - s * i, k = e * l - o * i, y = n * a - s * r, S = n * l - o * r, v = s * l - o * a, x = c * g - h * d, M = c * p - u * d, w = c * m - f * d, $ = h * p - u * g, E = h * m - f * g, A = u * m - f * p, H = b * A - T * E + k * $ + y * w - S * M + v * x;
  if (Math.abs(H) < 1e-12) return null;
  const I = 1 / H;
  return [
    (r * A - a * E + l * $) * I,
    (s * E - n * A - o * $) * I,
    (g * v - p * S + m * y) * I,
    (u * S - h * v - f * y) * I,
    (a * w - i * A - l * M) * I,
    (e * A - s * w + o * M) * I,
    (p * k - d * v - m * T) * I,
    (c * v - u * k + f * T) * I,
    (i * E - r * w + l * x) * I,
    (n * w - e * E - o * x) * I,
    (d * S - g * k + m * b) * I,
    (h * k - c * S - f * b) * I,
    (r * M - i * $ - a * x) * I,
    (e * $ - n * M + s * x) * I,
    (g * T - d * y - p * b) * I,
    (c * y - h * T + u * b) * I
  ];
}
function cd(t, e, n, s) {
  const o = 1 / Math.tan(t * ad / 2), i = 1 / (n - s);
  return [o / e, 0, 0, 0, 0, o, 0, 0, 0, 0, (s + n) * i, -1, 0, 0, 2 * s * n * i, 0];
}
function hd(t, e, n, s, o, i) {
  const r = 1 / (e - t), a = 1 / (s - n), l = 1 / (i - o);
  return [2 * r, 0, 0, 0, 0, 2 * a, 0, 0, 0, 0, -2 * l, 0, -(e + t) * r, -(s + n) * a, -(i + o) * l, 1];
}
function ud(t, e, n = [0, 1, 0]) {
  const s = Ke(wn(t, e)), o = Ke(Bs(n, s)), i = Bs(s, o);
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
    -Se(o, t),
    -Se(i, t),
    -Se(s, t),
    1
  ];
}
function Nt(t, e) {
  const n = t[0] * e[0] + t[4] * e[1] + t[8] * e[2] + t[12], s = t[1] * e[0] + t[5] * e[1] + t[9] * e[2] + t[13], o = t[2] * e[0] + t[6] * e[1] + t[10] * e[2] + t[14], i = t[3] * e[0] + t[7] * e[1] + t[11] * e[2] + t[15];
  return i === 1 || i === 0 ? [n, s, o] : [n / i, s / i, o / i];
}
const mv = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  compose: pr,
  fromQuat: Qt,
  identity: fo,
  invert: gr,
  lookAt: ud,
  multiply: Et,
  orthographic: hd,
  perspective: cd,
  scaling: De,
  transformPoint: Nt,
  translation: _e,
  transpose: ld
}, Symbol.toStringTag, { value: "Module" })), cs = {
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
}, Ta = {
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
function fd(t) {
  let e = t.trim().toLowerCase();
  e = e.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(e);
  return n && n[1] !== "steps" && e !== "none" && e !== "linear" && (e = `${n[1]}.out${n[2] ?? ""}`), e;
}
Ht({ type: "bounce", mode: "in" });
Ht({ type: "bounce", mode: "in-out" });
function js(t) {
  const e = ph.get(t.trim().toLowerCase());
  if (e) return e;
  const n = fd(t), s = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (s) {
    const r = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: r, fn: Ht(r) };
  }
  const o = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (o) {
    const [, i, r, a] = o, l = (a ?? "").split(",").map((u) => Number.parseFloat(u)).filter((u) => Number.isFinite(u)), c = r === "inout" ? "in-out" : r;
    if (i === "back" && l.length === 0 && n in cs)
      return { easing: { type: "cubic-bezier", points: cs[n] } };
    const h = i === "elastic" ? { type: "elastic", mode: c, ...l[0] !== void 0 && { amplitude: l[0] }, ...l[1] !== void 0 && { period: l[1] } } : i === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...l[0] !== void 0 && { overshoot: l[0] } };
    return { easing: h, fn: Ht(h) };
  }
  return n in Ta ? { easing: Ta[n] } : n in cs ? { easing: { type: "cubic-bezier", points: cs[n] } } : { easing: "ease-out" };
}
const ph = /* @__PURE__ */ new Map();
function mr(t, e) {
  return ph.set(
    t.trim().toLowerCase(),
    e.bezier ? { easing: { type: "cubic-bezier", points: e.bezier }, fn: e.fn } : { fn: e.fn, requiresBaking: "custom" }
  ), t;
}
function Ti(t) {
  let e = t >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let n = e;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const gh = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function mh(t) {
  return typeof t == "string" && gh.test(t);
}
function dd(t = 1) {
  let e = Ti(t);
  const n = (l, c) => ((...h) => h.length >= l ? c(...h) : (u) => c(...h, u)), s = (l, c, h) => Math.min(Math.max(h, Math.min(l, c)), Math.max(l, c)), o = (l, c, h, u, f) => c === l ? h : h + (f - l) / (c - l) * (u - h), i = (l, c) => {
    if (typeof l == "number") return l === 0 ? c : Math.round(c / l) * l;
    if (Array.isArray(l)) return Ea(l, c, 1 / 0);
    if ("values" in l) return Ea(l.values, c, l.radius ?? 1 / 0);
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
          u[f] = Ds(l[f])(l[f], c[f], h);
        return u;
      }
      return Ds(l)(l, c, h);
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
      const m = p.length, T = lr(d, m, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: u }), k = c !== void 0 ? c : (h ?? 1) * Kc(m, u), y = f && k > 0 ? f(T / k) * k : T;
      return l + y;
    },
    pipe: (...l) => (c) => l.reduce((h, u) => u(h), c),
    splitColor: (l) => pd(l),
    getUnit: (l) => typeof l == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(l.trim())?.[1] ?? "",
    seed: (l) => {
      e = Ti(l);
    },
    resolveRandomString: (l) => {
      const c = gh.exec(l)?.[1] ?? "";
      if (c.startsWith("[")) {
        const g = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return g[Math.floor(e() * g.length)];
      }
      const [h, u, f] = c.split(",").map((d) => Number.parseFloat(d));
      return r(h, u, Number.isFinite(f) ? f : void 0);
    }
  };
}
function Ea(t, e, n) {
  let s = e, o = 1 / 0;
  for (const i of t) {
    const r = Math.abs(i - e);
    r < o && (o = r, s = i);
  }
  return o <= n ? s : e;
}
function pd(t) {
  const e = t.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(e)?.[1];
  if (n) {
    const i = (n.length <= 4 ? [...n].map((r) => r + r).join("") : n).match(/../g).map((r) => Number.parseInt(r, 16));
    return i.length >= 4 ? [i[0], i[1], i[2], Math.round(i[3] / 255 * 1e3) / 1e3] : [i[0], i[1], i[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(e)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((o) => Number.parseFloat(o));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const gd = /^([+-])=\s*(-?[\d.]+)$/, md = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function xn(t, e) {
  const n = e.scale ?? 1, s = (c) => Number.parseFloat(c) * n;
  if (t === void 0) return e.cursor;
  if (typeof t == "number") return t * n;
  const o = t.trim();
  if (o === "") return e.cursor;
  const i = gd.exec(o);
  if (i) {
    const c = s(i[2]);
    return e.cursor + (i[1] === "-" ? -c : c);
  }
  const r = md.exec(o);
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
function yd(t) {
  if (typeof t != "object" || t === null) return !1;
  const e = t;
  return e.grid !== void 0 || e.from === "random" || Array.isArray(e.from) || e.ease !== void 0 || e.axis !== void 0;
}
function bd(t, e, n = {}) {
  if (t === 0) return [];
  const s = e.grid === "auto" ? Math.max(1, Math.min(t, n.columnsFromLayout?.() ?? t)) : Array.isArray(e.grid) ? Math.max(1, e.grid[1]) : t, o = Array.isArray(e.grid) ? Math.max(1, e.grid[0]) : Math.ceil(t / s), i = (g) => ({ x: g % s, y: Math.floor(g / s) }), r = e.from ?? "start", a = Array.isArray(r) ? { x: r[0] * (s - 1), y: r[1] * (o - 1) } : typeof r == "number" ? i(Math.max(0, Math.min(t - 1, r))) : r === "end" ? i(t - 1) : r === "center" || r === "edges" ? { x: (s - 1) / 2, y: (o - 1) / 2 } : { x: 0, y: 0 }, l = (g) => {
    const { x: p, y: m } = i(g), b = Math.abs(p - a.x), T = Math.abs(m - a.y);
    return e.axis === "x" ? b : e.axis === "y" ? T : Math.hypot(b, T);
  };
  let c = Array.from({ length: t }, (g, p) => l(p));
  const h = Math.max(...c);
  if (r === "edges" && (c = c.map((g) => h - g)), r === "random") {
    const g = n.random ?? Math.random;
    c = c.map(() => g() * h);
  }
  const u = e.amount !== void 0 ? e.amount : (e.each ?? 0) * h, f = e.ease ? js(e.ease) : void 0, d = f ? f.fn ?? Ht(f.easing) : void 0;
  return c.map((g) => {
    const p = h === 0 ? 0 : g / h;
    return (d ? d(p) : p) * u;
  });
}
const yr = /* @__PURE__ */ new Set([
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
]), wd = {
  rotation: "rotate",
  rotationZ: "rotate",
  rotationX: "rotateX",
  rotationY: "rotateY",
  transformPerspective: "perspective",
  perspective: "childPerspective"
};
function Ps(t) {
  const e = {}, n = {};
  for (const [s, o] of Object.entries(t))
    yr.has(s) ? e[s] = o : n[wd[s] ?? s] = o;
  return { config: e, properties: n };
}
function qs(t, e) {
  return t === void 0 ? e : t * 1e3;
}
function Ei(t, e) {
  if (t !== void 0)
    return typeof t == "number" ? { each: t * 1e3 } : yd(t) ? { offsets: bd(e?.count ?? 0, t, e ?? {}).map((s) => s * 1e3) } : {
      ...t.each !== void 0 && { each: t.each * 1e3 },
      ...t.amount !== void 0 && { amount: t.amount * 1e3 },
      ...t.from !== void 0 && { from: t.from }
    };
}
const kd = {
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
function yh(t) {
  return kd[t];
}
function vd(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : t;
  if (!e || typeof e.path != "string" && !Array.isArray(e.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(e.path))
    n = nd(e.path, { curviness: e.curviness });
  else if (ns(e.path))
    n = e.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${e.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: n };
  return e.autoRotate !== void 0 && e.autoRotate !== !1 && (s.autoRotate = !0, typeof e.autoRotate == "number" && (s.rotateOffset = e.autoRotate)), e.matrix && (s.matrix = e.matrix), { config: s, start: e.start ?? 0, end: e.end ?? 1 };
}
function Md(t) {
  const e = typeof t == "string" || Array.isArray(t) ? { path: t } : { ...t };
  return { ...e, start: e.end ?? 1, end: e.start ?? 0 };
}
function bh(t) {
  return typeof t == "object" && t !== null && "shape" in t ? t.shape : t;
}
function xd(t) {
  if (t.morphSVG === void 0) return t;
  const { morphSVG: e, ...n } = t, s = bh(e);
  if (typeof s != "string" || !ns(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: s };
}
function Sd(t, e) {
  if (t === !0) return [0, e];
  if (t === !1) return [0, 0];
  if (typeof t == "number") return [0, Aa(t, e)];
  const n = t.trim().split(/[\s,]+/).filter(Boolean), s = (r) => {
    const a = Number.parseFloat(r);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${t}" is not a length or percentage`);
    return Aa(r.endsWith("%") ? e * a / 100 : a, e);
  };
  if (n.length === 0) return [0, e];
  if (n.length === 1) return [0, s(n[0])];
  const o = s(n[0]), i = s(n[1]);
  return o <= i ? [o, i] : [i, o];
}
function Td(t, e) {
  const [n, s] = Sd(t, e);
  return { strokeDasharray: [s - n, e], strokeDashoffset: -n };
}
function Ed(t, e) {
  if (t.drawSVG === void 0) return t;
  const { drawSVG: n, ...s } = t;
  return { ...s, ...Td(n, e) };
}
function Ad(t) {
  if (t.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return t;
}
function Aa(t, e) {
  return Math.max(0, Math.min(e, t));
}
function $d(t) {
  let e = 2166136261;
  for (let n = 0; n < t.length; n++) e = Math.imul(e ^ t.charCodeAt(n), 16777619);
  return e >>> 0;
}
function Pd(t, e, n) {
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
      seed: o.seed ?? $d(`${e}|${o.text}`)
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
function br(t) {
  return Math.max(0.1, t / 25);
}
function Id(t, e) {
  const n = typeof e == "number" ? { velocity: e } : e;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = n.friction ?? (n.resistance !== void 0 ? br(n.resistance) : void 0), o = {
    from: t,
    velocity: n.velocity,
    ...s !== void 0 && { friction: s },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? o.end = [n.end(Fs(o))] : n.end !== void 0 && (o.end = Array.isArray(n.end) ? [...n.end] : n.end), o;
}
function Od(t) {
  const e = t === !0 ? {} : typeof t == "string" ? { preset: t } : t;
  if (e.preset !== void 0 && !(e.preset in Oo))
    throw new Error(
      `gsap-compat: unknown spring preset "${e.preset}" — use one of ${Object.keys(Oo).join(", ")}`
    );
  return {
    ...e.preset ? Oo[e.preset] : {},
    ...e.stiffness !== void 0 && { stiffness: e.stiffness },
    ...e.damping !== void 0 && { damping: e.damping },
    ...e.mass !== void 0 && { mass: e.mass },
    ...e.restDelta !== void 0 && { restDelta: e.restDelta }
  };
}
function _d(t, e) {
  if (t === !0 || typeof t == "string") return;
  const n = t.velocity;
  return typeof n == "number" ? n : n?.[e];
}
class rn {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = Ti(1);
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
    return this.build(e, void 0, Sn(n), s);
  }
  /** Animate from the given values to where the property already is. */
  from(e, n, s) {
    const { config: o, properties: i } = Ps(Sn(n)), { motionPath: r, text: a, scrambleText: l, ...c } = i, h = this.targetsOf(e)[0], u = { ...o };
    for (const g of Object.keys(c))
      u[g] = this.resolveStart(h, g);
    r !== void 0 && (u.motionPath = Md(r));
    const f = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (f.text = Do(a), u.text = typeof a == "object" ? { ...a, value: d } : d), l !== void 0 && (f.text = Do(l), u.scrambleText = typeof l == "object" ? { ...l, text: d } : d), this.build(e, { ...c, ...f }, u, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(e, n, s, o) {
    const { properties: i } = Ps(Sn(n));
    return this.build(e, i, Sn(s), o);
  }
  /** Set values instantly — a single held keyframe. */
  set(e, n, s) {
    return this.build(e, void 0, { ...Sn(n), duration: 0 }, s);
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
    const n = Math.max(0, xn(e, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(e) {
    return xn(e, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(e, n) {
    return this.labels.set(e, xn(n, this.context())), this;
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
    const s = xn(n, this.context());
    for (const i of e.timeline.tracks) {
      if (!("keyframes" in i)) continue;
      const r = Si({
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
    const { config: i, properties: r } = Ps(s), { motionPath: a, text: l, scrambleText: c, inertia: h, ...u } = r, f = this.targetsOf(e), d = xn(o, this.context()), g = qs(i.delay, 0), p = qs(i.duration, 500), m = Ei(i.stagger, {
      count: f.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(f) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), b = this.easingFor(i.ease), T = [], k = i.spring;
    let y = 0, S = !1;
    for (const [E, A] of Object.entries(u)) {
      const H = A;
      let I = n?.[E] !== void 0 ? n[E] : this.resolveStart(f[0], E);
      if (typeof I != typeof H && (this.warn(
        `no usable start value for "${E}" on "${f[0]}" — it will snap to ${String(H)}. Use fromTo() to animate it.`
      ), I = H), k !== void 0 && (typeof I != "number" || typeof H != "number") && this.warn(`spring works on numbers, so "${E}" on "${f[0]}" eases instead`), k !== void 0 && typeof I == "number" && typeof H == "number") {
        const D = {
          ...Od(k),
          from: I,
          to: H,
          velocity: _d(k, E) ?? this.options.startVelocity?.(f[0], E) ?? 0
        }, Y = this.nextTrackId(`${f[0]}-${E}-spring`), j = {
          id: Y,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: E,
          kind: "spring",
          spring: D,
          delay: d + g
        };
        this.timeline.addTrack(j), T.push(Y), y = Math.max(y, Hu(D));
        for (const _ of f) this.lastValues.set(`${_}|${E}`, H);
        continue;
      }
      S = !0;
      const C = this.keyframesFor(I, H, p, b, i.ease), W = this.nextTrackId(`${f[0]}-${E}`);
      this.timeline.addTrack(
        Si({
          id: W,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: E,
          delay: d + g,
          keyframes: C,
          // A quaternion is a rotation: it turns the short way round (see Track.interpolation).
          ...E === "quaternion" && { interpolation: "slerp" }
        })
      ), T.push(W);
      for (const D of f) this.lastValues.set(`${D}|${E}`, H);
    }
    const v = Pd({ text: l, scrambleText: c }, f[0], p);
    if (v) {
      const E = n?.text ?? n?.scrambleText, A = E !== void 0 ? Do(E) : this.resolveStart(f[0], "text"), H = this.nextTrackId(`${f[0]}-text`), I = {
        id: H,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...m && f.length > 1 && { stagger: m },
        property: "text",
        textConfig: { from: typeof A == "string" ? A : String(A ?? ""), ...v },
        delay: d + g,
        keyframes: this.keyframesFor(0, 1, p, b, i.ease)
      };
      this.timeline.addTrack(I), T.push(H);
      for (const C of f) this.lastValues.set(`${C}|text`, v.to);
    }
    if (a !== void 0) {
      const { config: E, start: A, end: H } = vd(a), I = this.nextTrackId(`${f[0]}-motionPath`), C = {
        id: I,
        target: f[0],
        ...f.length > 1 && { targets: f },
        ...m && f.length > 1 && { stagger: m },
        property: "motionPath",
        motionPathConfig: E,
        delay: d + g,
        keyframes: this.keyframesFor(A, H, p, b, i.ease)
      };
      this.timeline.addTrack(C), T.push(I);
    }
    if (h !== void 0)
      for (const [E, A] of Object.entries(h)) {
        const H = this.resolveStart(f[0], E);
        if (typeof H != "number") {
          this.warn(`inertia on "${E}" needs a numeric start value; skipped`);
          continue;
        }
        const I = Id(H, A), C = this.nextTrackId(`${f[0]}-${E}-inertia`), W = {
          id: C,
          target: f[0],
          ...f.length > 1 && { targets: f },
          ...m && f.length > 1 && { stagger: m },
          property: E,
          kind: "inertia",
          inertia: I,
          delay: d + g
        };
        this.timeline.addTrack(W), T.push(C), y = Math.max(y, es(I));
        for (const D of f) this.lastValues.set(`${D}|${E}`, ts(I));
      }
    const w = ((h !== void 0 || k !== void 0) && !S && !v && a === void 0 ? y : Math.max(p, y)) + (m && f.length > 1 ? ao(f.length, m) : 0), $ = d + g + w;
    return this.previousStart = d + g, this.previousEnd = $, this.cursor = Math.max(this.cursor, $), {
      trackIds: T,
      start: d + g,
      end: $,
      kill: () => {
        for (const E of T) this.timeline.removeTrack(E);
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
    const a = typeof i == "string" ? js(i) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Ws(o)) {
      const c = a?.fn ?? Ht(o);
      return [r, ...oh(r, { time: s, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
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
    const r = yh(n);
    return r !== void 0 ? (this.warn(
      `no start value for "${n}" on "${e}" — using the static default ${r}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), r) : (this.warn(`no start value or default for "${n}" on "${e}" — using 0`), 0);
  }
  easingFor(e) {
    if (e !== void 0) {
      if (typeof e == "string") return js(e).easing;
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
function Do(t) {
  if (typeof t == "string") return t;
  if (t && typeof t == "object") {
    const e = t;
    return String(e.value ?? e.text ?? "");
  }
  return String(t ?? "");
}
function Hd(t) {
  return new rn(t);
}
function Sn(t) {
  return Ad(xd(t));
}
function Cd(t) {
  return !Array.isArray(t) || t.length !== 4 ? null : `matrix3d(${Qt(ve(t)).map((n) => Math.round(n * 1e6) / 1e6 + 0).join(", ")})`;
}
const Rd = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Ld = "#ffffff", Wd = "rgba(0, 0, 0, 0.5)";
function Fd(t) {
  const e = [];
  if (t.blur !== void 0 && e.push(`blur(${Math.max(0, t.blur)}px)`), t.brightness !== void 0 && e.push(`brightness(${Math.max(0, t.brightness)})`), t.glow !== void 0 && e.push(`drop-shadow(0 0 ${Math.max(0, t.glow)}px ${t.glowColor ?? Ld})`), t.shadowX !== void 0 || t.shadowY !== void 0 || t.shadowBlur !== void 0) {
    const n = t.shadowX ?? 0, s = t.shadowY ?? 0, o = Math.max(0, t.shadowBlur ?? 0);
    e.push(`drop-shadow(${n}px ${s}px ${o}px ${t.shadowColor ?? Wd})`);
  }
  return e.length > 0 ? e.join(" ") : null;
}
function Dd(t, e) {
  const n = t.childNodes.length === 1 ? t.firstChild : null;
  if (n && n.nodeType === 3) {
    const s = n;
    s.data !== e && (s.data = e);
    return;
  }
  t.textContent !== e && (t.textContent = e);
}
function Nd(t) {
  if (!("ownerSVGElement" in t)) return;
  const e = t.style;
  !e || e.transformBox || (e.transformBox = "fill-box", e.transformOrigin || (e.transformOrigin = "50% 50%"));
}
const $a = /* @__PURE__ */ new Set([
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
]), Bd = /* @__PURE__ */ new Set([
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
]), jd = [
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
], qd = /* @__PURE__ */ new Set(["childPerspective", "perspectiveOriginX", "perspectiveOriginY"]), Yd = /* @__PURE__ */ new Set(["originX", "originY"]), Kd = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), zd = /* @__PURE__ */ new Set(["drawOn"]), Xd = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, Pa = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Ud = "http://www.w3.org/2000/svg";
class Ne {
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
      if (!(g === "x" && l) && !(g === "y" && c) && !((g === "rotate" || g === "rotateZ") && h) && !zd.has(g)) {
        if (Bd.has(g))
          (s ??= {})[g] = p;
        else if (qd.has(g))
          typeof p == "number" && ((o ??= {})[g] = p);
        else if (Yd.has(g))
          typeof p == "number" && ((i ??= {})[g] = p);
        else if (Kd.has(g))
          typeof p == "number" && ((r ??= {})[g] = p);
        else if (Rd.has(g))
          (a ??= {})[g] = p;
        else if (g !== "perspective") {
          if (g !== "shine") if (g === "text" && typeof p == "string")
            Dd(e, p);
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
      for (const g of jd) {
        const p = s[g];
        if (p === void 0) continue;
        const m = this.buildTransformPart(g, p);
        m && f.push(m);
      }
    if (f.length > 0 && (e.style.transform = f.join(" "), Nd(e)), o && (o.childPerspective !== void 0 && (e.style.perspective = `${o.childPerspective}px`), (o.perspectiveOriginX !== void 0 || o.perspectiveOriginY !== void 0) && (e.style.perspectiveOrigin = `${o.perspectiveOriginX ?? 50}% ${o.perspectiveOriginY ?? 50}%`)), i) {
      const g = i.originX ?? 50, p = i.originY ?? 50;
      e.style.transformOrigin = `${g}% ${p}%`;
    }
    if (r) {
      const g = r.clipTop ?? 0, p = r.clipRight ?? 0, m = r.clipBottom ?? 0, b = r.clipLeft ?? 0;
      e.style.clipPath = `inset(${g}% ${p}% ${m}% ${b}%)`;
    }
    if (a) {
      const g = Fd(a);
      g && (e.style.filter = g);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(e, n) {
    if (e === "quaternion") return Cd(n);
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
    if (e.namespaceURI === Ud && n in Pa) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      e.style[Pa[n]] = a;
      return;
    } else n === "fill" && e.dataset?.elementType === "text" ? o = "color" : o = Xd[n] ?? n;
    let r;
    typeof s == "number" ? $a.has(n) || $a.has(o) ? r = `${s}px` : r = String(s) : Array.isArray(s) ? r = s.join(", ") : r = s, e.style[o] = r;
  }
}
const Gd = {
  request: (t) => requestAnimationFrame(t),
  cancel: (t) => cancelAnimationFrame(t)
};
class Vd {
  adapter = new Ne();
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
  utils = dd();
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
    this.scheduler = e.scheduler ?? Gd, this.rootOption = e.root, this.onWarning = e.onWarning;
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
      No(s) && this.currentCollector?.touch(s, o), n.push(o);
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
    if (No(e)) return [e];
    if (!Jd(e)) return [e];
    const n = [];
    for (const s of Array.from(e))
      n.push(...this.targetsOf(s));
    return n;
  }
  nameFor(e) {
    return No(e) ? this.elementName(e) : this.objectName(e);
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
function No(t) {
  return typeof t == "object" && t !== null && t.nodeType === 1;
}
function Jd(t) {
  if (Array.isArray(t)) return !0;
  const e = t;
  return typeof e.length == "number" && typeof e.item == "function";
}
function Ys(t) {
  const e = t.style;
  if (!e) return t.getBoundingClientRect();
  const n = e.transform;
  e.transform = "none";
  const s = t.getBoundingClientRect();
  return e.transform = n, s;
}
const Ia = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Zd(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function Qd(t) {
  const e = t.getScreenCTM?.();
  if (e) return [e.a, e.b, e.c, e.d, e.e, e.f];
  const n = t.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function tp(t, e) {
  const n = typeof t == "string" || Array.isArray(t) || Ia(t) ? { path: t } : t, { align: s, alignOrigin: o, path: i, ...r } = n, a = (v) => {
    const x = Ia(v) ? v : e.query(v);
    return x || e.warn(`gsap-compat: motionPath could not find "${String(v)}"`), x;
  };
  let l = null, c = "";
  if (Array.isArray(i) || typeof i == "string" && ns(i))
    c = i;
  else {
    l = a(i);
    const v = l && fr({ tag: l.localName, attributes: Zd(l) });
    l && !v && e.warn(`gsap-compat: motionPath element <${l.localName}> has no path geometry`), c = v ?? "";
  }
  const h = { ...r, path: c };
  if (s === void 0 || s === !1) return h;
  const u = s === !0 ? l : a(s);
  if (!u)
    return s === !0 && e.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const f = e.targets[0];
  if (!f) return h;
  const [d, g, p, m, b, T] = Qd(u), k = Ys(f), [y, S] = o ?? [0.5, 0.5];
  for (const v of e.targets.slice(1)) {
    const x = Ys(v);
    if (Math.abs(x.left - k.left) > 0.5 || Math.abs(x.top - k.top) > 0.5) {
      e.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, g, p, m, b - k.left - y * k.width, T - k.top - S * k.height], h;
}
const wh = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function kh(t) {
  const e = {};
  for (const n of Array.from(t.attributes)) e[n.name] = n.value;
  return e;
}
function vh(t) {
  if (!t) return null;
  const e = fr({ tag: t.localName, attributes: kh(t) });
  return e || (t.querySelector("path")?.getAttribute("d") ?? null);
}
function ep(t, e, n) {
  const s = bh(t);
  if (typeof s == "string" && ns(s)) return s;
  const o = wh(s) ? s : typeof s == "string" ? e(s) : null, i = vh(o);
  return i || (n(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const np = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function sp(t, e = document) {
  return (typeof t == "string" ? Array.from(e.querySelectorAll(t)) : wh(t) ? [t] : Array.from(t)).map((s) => {
    if (s.localName === "path") return s;
    const o = fr({ tag: s.localName, attributes: kh(s) });
    if (!o || !s.parentNode) return s;
    const i = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const r of Array.from(s.attributes))
      np.has(r.name) || i.setAttribute(r.name, r.value);
    return i.setAttribute("d", o), s.parentNode.replaceChild(i, s), i;
  });
}
const Oa = 0.3;
class op {
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
    this.dragging = !0, this.passedTolerance = !1, this.startX = e, this.startY = n, this.lastX = e, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = _a(), this.options.onPress?.(this.stateFrom(0, 0, s));
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
    const s = _a(), o = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const i = e / o * 1e3, r = n / o * 1e3;
    this.velocityX += (i - this.velocityX) * Oa, this.velocityY += (r - this.velocityY) * Oa;
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
function _a() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function ip(t, e, n) {
  let s = { delta: 0, line: null }, o = n;
  for (const i of t)
    for (const r of e) {
      const a = Math.abs(r - i);
      a <= o && (o = a, s = { delta: r - i, line: r });
    }
  return s;
}
function rp(t, e) {
  return e <= 0 ? [] : t.map((n) => Math.round(n / e) * e);
}
class Mh {
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
    this.options = e, this.x = e.initialX ?? 0, this.y = e.initialY ?? 0, this.observer = new op({
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
    const o = (this.options.axis ?? "both") === "y" ? this.y : this.x, i = ap(o / s);
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
      ...rp([s], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], i = ip([s], o, this.snapThreshold());
    s += i.delta, n === "x" ? this.snappedX = i.line : this.snappedY = i.line;
    const r = this.options.bounds;
    if (r) {
      const a = n === "x" ? r.minX : r.minY, l = n === "x" ? r.maxX : r.maxY;
      a !== void 0 && (s = Math.max(a, s)), l !== void 0 && (s = Math.min(l, s));
    }
    return s;
  }
}
function ap(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
function yv(t) {
  const e = new Mh(t);
  return e.start(), e;
}
const lp = { x: "x", y: "y", "x,y": "both" }, Ai = (t) => typeof t == "object" && t !== null && t.nodeType === 1;
function Ha(t, e) {
  const n = Ys(t), s = e.getBoundingClientRect();
  return {
    minX: s.left - n.left,
    maxX: s.right - n.right,
    minY: s.top - n.top,
    maxY: s.bottom - n.bottom
  };
}
function Ca(t) {
  return Array.isArray(t) ? [...t] : t;
}
function cp(t, e, n, s = {}) {
  const [o] = e.resolveTargets(n), i = o ? e.elementFor(o) : void 0;
  if (!o || !i)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (s.type === "rotation") return hp(t, e, o, i, s);
  const r = lp[s.type ?? "x,y"], a = () => {
    const p = e.appliedValue(o, "x"), m = e.appliedValue(o, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof m == "number" ? m : 0 };
  }, l = typeof s.bounds == "string" ? e.query(s.bounds) : Ai(s.bounds) ? s.bounds : null, h = { bounds: (!l && s.bounds && !Ai(s.bounds) ? s.bounds : void 0) ?? (l ? Ha(i, l) : void 0) };
  let u = null;
  const f = () => {
    u?.kill(), u = null;
  }, d = (p) => {
    const m = s.inertia === !0 ? {} : s.inertia, b = m.friction ?? (m.resistance !== void 0 ? br(m.resistance) : 4), T = a(), k = h.bounds ?? {};
    let y, S;
    const v = m.end;
    if (Array.isArray(v)) {
      const M = Fs({ from: T.x, velocity: r === "y" ? 0 : p.x, friction: b }), w = Fs({ from: T.y, velocity: r === "x" ? 0 : p.y, friction: b });
      let $ = v[0];
      for (const E of v)
        Math.hypot(E.x - M, E.y - w) < Math.hypot($.x - M, $.y - w) && ($ = E);
      $ && (y = [$.x], S = [$.y]);
    } else typeof v == "number" ? (y = v, S = v) : v && (y = Ca(v.x), S = Ca(v.y));
    const x = {};
    r !== "y" && (x.x = { velocity: p.x, friction: b, min: k.minX, max: k.maxX, end: y }), r !== "x" && (x.y = { velocity: p.y, friction: b, min: k.minY, max: k.maxY, end: S }), u = t.to(i, { inertia: x, onComplete: () => s.onThrowComplete?.() });
  }, g = new Mh({
    target: i,
    axis: r,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      f(), l && (h.bounds = Ha(i, l)), s.onPress?.();
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
function hp(t, e, n, s, o) {
  const i = typeof o.bounds == "object" && o.bounds !== null && !Ai(o.bounds) ? o.bounds : {}, r = () => {
    const k = e.appliedValue(n, "rotate");
    return typeof k == "number" ? k : 0;
  }, a = (k) => Math.min(i.maxRotation ?? 1 / 0, Math.max(i.minRotation ?? -1 / 0, k));
  let l = null, c = !1, h, u = { x: 0, y: 0 }, f = 0, d = 0, g = [];
  const p = (k) => Math.atan2(k.clientY - u.y, k.clientX - u.x) * 180 / Math.PI, m = (k) => {
    if (c) return;
    l?.kill(), l = null, c = !0, h = k.pointerId, s.setPointerCapture?.(k.pointerId);
    const y = s.getBoundingClientRect();
    u = { x: y.left + y.width / 2, y: y.top + y.height / 2 }, f = p(k), d = r(), g = [{ time: performance.now(), rotation: d }], o.onPress?.();
  }, b = (k) => {
    if (!c || k.pointerId !== h) return;
    const y = p(k);
    let S = y - f;
    S > 180 && (S -= 360), S < -180 && (S += 360), f = y, d += S;
    let v = a(d);
    o.snap && (v = a(Math.round(v / o.snap) * o.snap)), e.apply(n, { rotate: v });
    const x = performance.now();
    for (g.push({ time: x, rotation: v }); g.length > 2 && x - g[0].time > 100; ) g.shift();
    const M = { x: 0, y: 0 };
    o.onDrag?.(M);
  }, T = (k) => {
    if (!c || k.pointerId !== h) return;
    c = !1;
    const y = g[0], S = g[g.length - 1], v = y && S ? (S.time - y.time) / 1e3 : 0, x = v > 0 ? (S.rotation - y.rotation) / v : 0;
    if (o.onRelease?.({ x, y: 0 }), !o.inertia) return;
    const M = o.inertia === !0 ? {} : o.inertia, w = M.friction ?? (M.resistance !== void 0 ? br(M.resistance) : 4), $ = typeof M.end == "number" || Array.isArray(M.end) ? M.end : void 0;
    l = t.to(s, {
      inertia: {
        rotate: {
          velocity: x,
          friction: w,
          min: i.minRotation,
          max: i.maxRotation,
          end: Array.isArray($) ? $.filter((E) => typeof E == "number") : $
        }
      },
      onComplete: () => o.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", m), s.addEventListener("pointermove", b), s.addEventListener("pointerup", T), s.addEventListener("pointercancel", T), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return r();
    },
    destroy() {
      l?.kill(), s.removeEventListener("pointerdown", m), s.removeEventListener("pointermove", b), s.removeEventListener("pointerup", T), s.removeEventListener("pointercancel", T);
    }
  };
}
const up = { opacity: 0, scale: 0.6 };
function fp(t) {
  const e = t.getBoundingClientRect();
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function Ra(t) {
  const e = Ys(t);
  return e.width === 0 && e.height === 0 ? null : { cx: e.left + e.width / 2, cy: e.top + e.height / 2, width: e.width, height: e.height };
}
function $i(t, e) {
  const s = t.resolveTargets(e).map((r) => t.elementFor(r)).filter((r) => !!r), o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  for (const r of s) {
    const a = fp(r);
    o.set(r, a);
    const l = xh(r);
    a && l !== void 0 && !i.has(l) && i.set(l, { element: r, box: a });
  }
  return { elements: s, boxes: o, ids: i };
}
const Bo = /* @__PURE__ */ new WeakMap();
function Pi(t, e, n, s = {}) {
  const o = s.duration ?? 0.6, i = s.ease ?? "power2.inOut", r = s.stagger ?? 0, a = s.scale !== !1, l = s.enter === void 0 ? up : s.enter, c = new Set(n.elements);
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
    const g = Ra(d);
    if (!g) continue;
    let p = n.boxes.get(d) ?? null, m;
    const b = xh(d), T = !p && b !== void 0 ? n.ids.get(b) : void 0;
    T && T.element !== d && (p = T.box, m = T.element);
    const [k] = t.resolveTargets(d);
    Bo.get(d)?.timeline.removeTracks({ target: k });
    const y = f * r;
    if (!p) {
      if (l === !1) continue;
      u.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...l }, { ...Sh(l), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: o, ease: i, delay: y }, 0), Bo.set(d, u), f++;
      continue;
    }
    const S = p.cx - g.cx, v = p.cy - g.cy, x = a ? p.width / g.width : 1, M = a ? p.height / g.height : 1;
    if (!(Math.abs(S) > 0.5 || Math.abs(v) > 0.5 || Math.abs(x - 1) > 1e-3 || Math.abs(M - 1) > 1e-3)) {
      const E = (A, H) => {
        const I = t.appliedValue(k, A);
        return typeof I == "number" && Math.abs(I - H) > 1e-6;
      };
      (E("x", 0) || E("y", 0) || E("scaleX", 1) || E("scaleY", 1)) && u.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const $ = s.fade === !0 && m !== void 0;
    u.fromTo(
      d,
      { x: S, y: v, scaleX: x, scaleY: M, ...$ && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...$ && { opacity: 1 }, duration: o, ease: i, delay: y },
      0
    ), $ && m && Ra(m) && u.fromTo(m, { opacity: 1 }, { opacity: 0, duration: o, ease: i, delay: y }, 0), Bo.set(d, u), f++;
  }
  return u;
}
function xh(t) {
  return t.dataset?.flipId;
}
function Sh(t) {
  const e = {};
  for (const n of Object.keys(t))
    e[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return e;
}
function dp(t, e = {}) {
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
      const b = (m.textContent ?? "").replace(/\s+/g, " ").trim(), T = pp(m, s.words), k = n.has("chars") ? T.flatMap((v) => gp(v, s.chars)) : [], y = n.has("lines") ? yp(m, T, s.lines) : [];
      if (o) {
        !m.hasAttribute("aria-label") && b && m.setAttribute("aria-label", b);
        for (const v of T) v.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...T);
      else for (const v of T) v.removeAttribute("class");
      p.chars.push(...k), p.lines.push(...y);
      const S = e.mask === "lines" ? y : e.mask === "words" ? T : e.mask === "chars" ? k : [];
      for (const v of S) p.masks.push(bp(v, `${s[e.mask]}-mask`));
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
      const k = () => {
        m = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(k) : setTimeout(k, 0);
    };
    if (typeof ResizeObserver == "function") {
      l = new ResizeObserver((k) => {
        let y = !1;
        for (const S of k) {
          const v = Math.round(S.contentRect.width), x = p.get(S.target);
          p.set(S.target, v), x !== void 0 && x !== v && (y = !0);
        }
        y && b();
      });
      for (const k of t) l.observe(k);
    }
    const T = t[0]?.ownerDocument?.fonts;
    T && T.status !== "loaded" && T.ready.then(() => b());
  }
  return d;
}
function pp(t, e) {
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
function gp(t, e) {
  const n = t.ownerDocument, s = mp(t.textContent ?? "").map((o) => {
    const i = n.createElement("span");
    return i.className = e, i.style.display = "inline-block", i.textContent = o, i;
  });
  return t.replaceChildren(...s), s;
}
function mp(t) {
  const e = Intl.Segmenter;
  return e ? Array.from(new e(void 0, { granularity: "grapheme" }).segment(t), (n) => n.segment) : Array.from(t);
}
function yp(t, e, n) {
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
    for (let k = g.parentNode; k && k !== t; k = k.parentNode) m.unshift(k);
    let b = 0;
    for (; b < f.length && b < m.length && f[b].original === m[b]; ) b++;
    f.length = b;
    let T = b === 0 ? l : f[b - 1].clone;
    for (const k of m.slice(b)) {
      const y = k.cloneNode(!1);
      T.appendChild(y), f.push({ original: k, clone: y }), T = y;
    }
    T.appendChild(g);
  }
  return t.replaceChildren(...a), a;
}
function bp(t, e) {
  const n = t.ownerDocument.createElement("span");
  return n.className = e, n.style.display = t.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", t.replaceWith(n), n.appendChild(t), n;
}
const La = {
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
function Wa(t) {
  const e = t.trim().toLowerCase();
  if (e in La) return La[e];
  if (e.endsWith("%")) {
    const n = Number.parseFloat(e.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function Th(t) {
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
  const o = s[0] !== void 0 ? Wa(s[0]) : void 0, i = s[1] !== void 0 ? Wa(s[1]) : void 0;
  return {
    elementFraction: o ?? 0,
    viewportFraction: i ?? 0,
    offsetPx: e
  };
}
function Yn(t, e, n) {
  const s = Th(n), o = s.absolutePx !== void 0 ? t.top + s.absolutePx : t.top + t.height * s.elementFraction, i = e * s.viewportFraction;
  return o - i + s.offsetPx;
}
function bv(t, e, n, s) {
  const o = Yn(t, e, n), r = Yn(t, e, s) - o;
  return r <= 0 ? o <= 0 ? 1 : 0 : Eh(-o / r);
}
function Eh(t) {
  return t < 0 ? 0 : t > 1 ? 1 : t === 0 ? 0 : t;
}
function wp(t, e, n, s) {
  if (n <= 0) return e;
  const o = 1 - Math.exp(-(s / 1e3) / n);
  return t + (e - t) * o;
}
function Fa(t, e, n, s, o) {
  const i = (h) => Yn({ top: t + o(h), bottom: t + o(h) + e, height: e }, n, s), r = i(0), a = i(1);
  if (Math.sign(r) === Math.sign(a) || r === 0 || a === 0)
    return r === 0 ? 0 : a === 0 ? 1 : Math.abs(r) < Math.abs(a) ? 0 : 1;
  let l = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const u = (l + c) / 2;
    Math.sign(i(u)) === Math.sign(r) ? l = u : c = u;
  }
  return (l + c) / 2;
}
class kp {
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
function wv(t) {
  const e = new kp(t);
  return e.start(), e;
}
class vp {
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
const Mp = 0.15;
function xp(t) {
  return typeof t == "object" && !Array.isArray(t) ? t : { snapTo: t };
}
function Sp(t, e, n) {
  const s = hs(t + e * Mp);
  if (typeof n == "function") return hs(n(s));
  if (typeof n == "number")
    return n <= 0 ? t : hs(Math.round(s / n) * n);
  if (n.length === 0) return t;
  let o = n[0];
  for (const i of n)
    Math.abs(i - s) < Math.abs(o - s) && (o = i);
  return hs(o);
}
function Tp(t, e, n) {
  const s = t.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const o = Math.min(1, Math.abs(e) / Math.max(1, n));
  return s.min + (s.max - s.min) * o;
}
class Ep {
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
  animate(e, n, s, o = ho, i) {
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
function hs(t) {
  return Math.max(0, Math.min(1, t));
}
class Ap {
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
const $p = 120, nn = [], pn = /* @__PURE__ */ new Set();
let jo = !1;
const Pp = () => {
  jo || pn.size === 0 || (jo = !0, queueMicrotask(() => {
    jo = !1;
    for (const t of pn) t.afterRefresh();
  }));
}, Ah = () => {
  for (const t of pn) t.beforeRefresh();
  for (const t of nn) t.refresh();
  for (const t of pn) t.afterRefresh();
};
let sn = { width: 0, height: 0 };
const Da = () => {
  const t = window.innerWidth, e = window.innerHeight, n = t === sn.width && e !== sn.height, s = Math.abs(e - sn.height) < sn.height * 0.25, o = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && s && o || (sn = { width: t, height: e }, Ah());
};
class po {
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
    this.timeline = e.timeline, this.options = e, this.snapper = new Ep((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const e = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    e && !this.options.container && (this.pin = new vp(e, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new Ap(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), nn.length === 0 && typeof window < "u" && (sn = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Da, { passive: !0 })), nn.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), nn.splice(nn.indexOf(this), 1), nn.length === 0 && typeof window < "u" && window.removeEventListener("resize", Da), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Ah();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(e) {
    return pn.add(e), () => pn.delete(e);
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
      if (this.startPx = e + Yn(n, s, Tn(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, s, e), this.pin) {
        const o = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(o.top - (this.startPx - e), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, e), this.lastScroll = null, this.updateFrom(e, !this.measured), this.measured = !0, Pp();
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
    this.targetProgress = s > 0 ? Eh((e - this.startPx) / s) : e >= this.startPx ? 1 : 0, this.zone = s > 0 ? e <= this.startPx ? "before" : e >= this.endPx ? "after" : "active" : e >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(o, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const e = this.options.scrub;
    return typeof e == "number" ? Math.max(0, e) : 0;
  }
  resolveEnd(e, n, s) {
    const o = Tn(this.options.end) ?? "bottom top", i = typeof o == "string" ? o.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (i) {
      const r = Number.parseFloat(i[1]);
      return this.startPx + (i[2] === "%" ? n * r / 100 : r);
    }
    return s + Yn(e, n, o);
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
    }, $p));
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
    const n = xp(e), s = () => {
      this.snapTimer = null;
      const o = this.endPx - this.startPx, i = this.scrollPosition();
      if (!this.running || o <= 0 || i <= this.startPx || i >= this.endPx) return;
      const r = (i - this.startPx) / o, a = this.startPx + Sp(r, this.releaseVelocity / o, n.snapTo) * o;
      Math.abs(a - i) < 1 || this.snapper.animate(i, a, Tp(n, a - i, this.viewportHeight()), n.ease);
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
    const s = n.getBoundingClientRect(), o = this.options.scroller?.getBoundingClientRect?.().left ?? 0, i = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, r = s.left - o - e.shiftAt(e.progress()), { start: a, end: l } = e.range(), c = (d) => a + d * (l - a), h = Fa(r, s.width, i, Tn(this.options.start) ?? "left right", e.shiftAt);
    this.startPx = c(h);
    const u = Tn(this.options.end) ?? "right left", f = typeof u == "string" ? u.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = f ? this.startPx + Number.parseFloat(f[1]) : c(Fa(r, s.width, i, u, e.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(e) {
    const n = (i, r) => {
      const a = Tn(i) ?? r;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const l = Th(a);
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
      this.lastFrameTime = n, this.displayProgress = wp(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
function Tn(t) {
  return typeof t == "function" ? t() : t;
}
function kv(t) {
  const e = new po(t);
  return e.start(), e;
}
const qo = /* @__PURE__ */ new Set(), Ip = 16, Na = 0.5, Op = 2;
class Ba {
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
    return e.addEventListener("wheel", this.onWheel, { passive: !1 }), e.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), qo.add(this), this.stopListening = po.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const e of qo) e.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const e = this.options.scroller ?? window;
    return e.removeEventListener("wheel", this.onWheel), e.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), qo.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const e of this.effects) Yo(e.element, e.saved);
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
    this.target = s, this.journey = { from: this.current, to: s, ms: i * 1e3, ease: n.ease ?? ho, elapsed: 0 }, this.requestFrame();
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
    for (const e of this.effects) Yo(e.element, e.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(e) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || this.nestedScrollerTakes(e)) return;
    const n = e.deltaMode === 1 ? Ip : e.deltaMode === 2 ? this.viewportHeight() : 1, s = e.deltaY * n * (this.options.wheelMultiplier ?? 1), o = this.clamp(this.target + s);
    o === this.target && o === this.current || (e.preventDefault(), this.journey = null, this.target = o, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const e = this.position();
    this.written !== null && Math.abs(e - this.written) <= Op || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = e, this.requestFrame());
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
      this.current += (this.target - this.current) * (1 - Math.exp(-n / i)), Math.abs(this.target - this.current) < Na && (this.current = this.target);
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
        o.lagged = e === 0 ? s : o.lagged + (s - o.lagged) * (1 - Math.exp(-e / r)), Math.abs(s - o.lagged) < Na ? o.lagged = s : n = !0, i += s - o.lagged;
      }
      Yo(o.element, i === 0 ? o.saved : `0 ${_p(i)}px`), o.shift = i;
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
function Yo(t, e) {
  e ? t.style.setProperty("translate", e) : t.style.removeProperty("translate");
}
function _p(t) {
  return Math.round(t * 100) / 100;
}
function Hp(t, e) {
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
function wr(t, e, n, s, o = () => {
}) {
  const i = (d) => typeof d == "string" ? t.query(d) ?? void 0 : d, r = i(e.trigger) ?? s;
  if (!r) {
    o(`gsap-compat: scrollTrigger has no trigger element${typeof e.trigger == "string" ? ` for "${e.trigger}"` : ""}`);
    return;
  }
  const a = e.scrub === void 0 || e.scrub === !1 ? !1 : e.scrub, l = (e.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const u = (d, g) => () => {
    g?.(), n && !a && Hp(n, l[d] ?? "none"), e.once && d === 0 && queueMicrotask(() => h.destroy());
  }, f = e.containerAnimation ? Lp(t, e.containerAnimation, r, o) : void 0;
  return h = new po({
    trigger: r,
    start: e.start,
    end: e.end,
    scrub: a === !1 ? void 0 : a,
    pin: e.pin === !0 ? !0 : i(e.pin),
    scroller: i(e.scroller),
    horizontal: e.horizontal,
    pinSpacing: e.pinSpacing,
    onRefresh: e.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: e.snap === void 0 ? void 0 : Cp(e.snap, n),
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
function Cp(t, e) {
  const n = (o) => o === "labels" ? (i) => Rp(i, e?.labelProgresses?.() ?? []) : o;
  if (typeof t != "object" || Array.isArray(t)) return n(t);
  const s = t.ease ? js(t.ease) : void 0;
  return {
    snapTo: n(t.snapTo),
    duration: t.duration,
    delay: t.delay,
    ease: s ? s.fn ?? Ht(s.easing) : void 0
  };
}
function Rp(t, e) {
  return e.reduce((n, s) => Math.abs(s - t) < Math.abs(n - t) ? s : n, e[0] ?? t);
}
function Lp(t, e, n, s) {
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
class $h {
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
class Wp {
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
    const i = new $h(this.host, this.scope);
    i.conditions = n, i.add(() => e.setup(i)), e.context = i;
  }
}
class Fp {
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
const Dp = { opacity: 0, y: -16 }, Np = { opacity: 0, y: 16 };
async function Bp(t, e, n, s) {
  const o = e.collector?.scope ?? e.root, i = o.ownerDocument ?? o, r = () => s.shared ? [...o.querySelectorAll(s.shared)] : [];
  if (s.native && typeof i.startViewTransition == "function")
    return jp(i, s, r);
  const a = s.duration ?? 0.35, l = s.ease ?? "power2.inOut", c = (m) => new Promise((b) => {
    m(b) || b();
  }), h = r(), u = h.length ? $i(e, h) : void 0, f = s.from !== void 0 ? ja(e, s.from, s.shared) : [];
  if (f.length && s.leave !== !1) {
    const m = s.leave ?? Dp;
    await c((b) => t.to(f, { ...m, duration: a, ease: l, onComplete: b }));
  }
  await s.update();
  const d = [], g = typeof s.to == "function" ? s.to() : s.to, p = g !== void 0 ? ja(e, g, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const m = s.enter ?? Np;
    d.push(c((b) => t.fromTo(p, m, { ...Sh(m), duration: a, ease: l, onComplete: b })));
  }
  if (u) {
    const m = r().filter((b) => !h.includes(b));
    m.length && d.push(
      c(
        (b) => Pi(e, n, u, {
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
function ja(t, e, n) {
  const s = t.resolveTargets(e).map((o) => t.elementFor(o)).filter((o) => !!o);
  return n ? s.flatMap((o) => !o.querySelector(n) && !o.matches(n) ? [o] : [...o.children].filter((i) => !i.matches(n) && !i.querySelector(n))) : s;
}
async function jp(t, e, n) {
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
const qp = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (t, e) => mr(t, Kf(e))
}, Yp = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (t, e) => mr(t, { fn: zf(e) })
}, Kp = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (t, e) => mr(t, { fn: Xf(e) })
}, zp = /* @__PURE__ */ new Set([
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
]), qa = 0.5, Xp = "power1.inOut";
function Up(t) {
  return t.keyframes !== void 0 && t.keyframes !== null;
}
function Gp(t) {
  const e = t.keyframes, n = {};
  for (const [c, h] of Object.entries(t)) zp.has(c) || (n[c] = h);
  if (Array.isArray(e))
    return e.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? t.duration ?? qa
    }));
  const s = Object.entries(e), o = t.duration ?? qa, i = e.easeEach ?? t.easeEach ?? Xp;
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
function Ya(t, e, n, s = {}) {
  const o = e.collector?.scope ?? e.root, i = typeof s.scroller == "string" ? o.querySelector(s.scroller) : s.scroller ?? null, r = {
    x: i ? i.scrollLeft : window.scrollX,
    y: i ? i.scrollTop : window.scrollY
  }, a = {
    x: i ? i.scrollWidth - i.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: i ? i.scrollHeight - i.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, l = (T, k) => {
    if (k === void 0) return r[T];
    if (typeof k == "number") return k;
    if (k === "max") return a[T];
    const y = typeof k == "string" ? o.querySelector(k) : k;
    if (!y) return r[T];
    const S = y.getBoundingClientRect(), v = i?.getBoundingClientRect(), x = (T === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return T === "x" ? S.left - (v?.left ?? 0) + r.x - x : S.top - (v?.top ?? 0) + r.y - x;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: l("x", n.x), y: l("y", n.y) } : { x: r.x, y: l("y", n) }, h = { x: Math.max(0, Math.min(a.x, c.x)), y: Math.max(0, Math.min(a.y, c.y)) }, u = { ...r }, f = () => {
    i ? (i.scrollLeft = u.x, i.scrollTop = u.y) : window.scrollTo({ left: u.x, top: u.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], g = i ?? window, p = () => {
    b.kill(), m();
  }, m = () => {
    for (const T of d) g.removeEventListener(T, p);
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
  if (s.autoKill !== !1) for (const T of d) g.addEventListener(T, p, { passive: !0 });
  return b;
}
function Vp(t, e, n) {
  const s = t.collector?.scope ?? t.root, o = typeof e == "string" ? [...s.querySelectorAll(e)] : "nodeType" in e ? [e] : Array.from(e), { interval: i = 0.1, batchMax: r, onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h, ...u } = n, f = { onEnter: a, onLeave: l, onEnterBack: c, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, g = {}, p = (b) => {
    g[b] !== void 0 && clearTimeout(g[b]), g[b] = void 0;
    const T = d[b].splice(0);
    T.length > 0 && f[b]?.(T);
  }, m = (b, T) => {
    if (f[b]) {
      if (d[b].push(T), r !== void 0 && d[b].length >= r) return p(b);
      g[b] === void 0 && (g[b] = setTimeout(() => p(b), i * 1e3));
    }
  };
  return o.map(
    (b) => wr(t, {
      ...u,
      trigger: b,
      onEnter: () => m("onEnter", b),
      onLeave: () => m("onLeave", b),
      onEnterBack: () => m("onEnterBack", b),
      onLeaveBack: () => m("onLeaveBack", b)
    })
  ).filter((b) => b !== void 0);
}
class he {
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
    if (this.options = s, this.compat = new rn({
      ...s,
      startValue: (o, i) => {
        const r = e.objectFor(o);
        if (r) return tg(r[i]);
        const a = e.appliedValue(o, i);
        if (a !== void 0) return a;
        if (i === "d") return vh(e.elementFor(o)) ?? void 0;
        if (i === "text") return e.elementFor(o)?.textContent ?? void 0;
        if (i === "strokeDasharray" || i === "strokeDashoffset") {
          const l = Xa(e.elementFor(o));
          if (l !== void 0) return i === "strokeDasharray" ? [l, l] : 0;
        }
      },
      startVelocity: (o, i) => e.velocityOf(o, i),
      layoutColumns: (o) => za(o.map((i) => e.elementFor(i))),
      random: () => e.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, e.collector?.track(this), e.liveTimelines.add(this), this.autoplayPending = !s.paused && !s.scrollTrigger, s.scrollTrigger) {
      const o = s.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = wr(e, o, this, this.firstElement, (i) => s.onWarning?.(i)));
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
    return Up(n) ? this.record(() => this.keyframed(e, n, s)) : this.record(() => this.tween(e, [n], s, ([o], i, r) => this.compat.to(i, o, r)));
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
    const o = this.timeline.currentTime, i = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), r = { time: o }, a = s.duration ?? Math.abs(i - o) / 1e3 / (this.timeScale() || 1), l = new he(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
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
    const o = this.events, { crossings: i, passes: r } = rh(
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
    const i = Gp(n);
    if (i.length === 0) return;
    const r = o.length > 1 ? Ei(n.stagger, this.staggerContext(o)) : void 0, a = o.map((m) => this.targetFor(m)).filter((m) => m !== void 0), l = r ? a.map((m) => [m]) : [a], c = r ? wi(o.length, r).map((m) => m / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + qs(n.delay, 0) / 1e3;
    let u = 1 / 0, f = -1 / 0;
    if (l.forEach((m, b) => {
      i.forEach((T, k) => {
        const y = k === 0 ? h + c[b] : ">";
        this.tween(m, [T], y, ([S], v, x) => this.compat.to(v, S, x)), u = Math.min(u, this.compat.lastStart), f = Math.max(f, this.compat.lastEnd);
      });
    }), u === 1 / 0) return;
    const { onStart: d, onUpdate: g, onComplete: p } = n;
    d && this.events.push({ time: u, direction: "forward", run: d }), g && this.ranges.push({ start: u, end: f, run: g }), p && this.events.push({ time: f, direction: "forward", run: p });
  }
  staggerContext(e) {
    return {
      count: e.length,
      columnsFromLayout: () => za(e.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(e, n, s, o) {
    const i = e.map((f) => this.targetFor(f));
    if (!(e.length > 1 && (n.some(Qp) || e.some((f) => this.stage.objectFor(f) !== void 0)))) {
      const f = this.targetFor(e[0]);
      o(n.map((d) => this.prepare(Ka(d, 0, f, this.stage.utils, i), e)), e, s);
      return;
    }
    const a = n.length - 1, { stagger: l, ...c } = n[a], h = Ei(l, this.staggerContext(e)), u = h ? wi(e.length, h).map((f) => f / 1e3) : e.map(() => 0);
    e.forEach((f, d) => {
      const g = d === 0 ? qs(c.delay, 0) / 1e3 + u[0] : 0, p = d === 0 ? 0 : u[d] - u[d - 1], m = d === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, T = n.map((k, y) => y === a ? { ...c, delay: g } : k).map((k) => this.prepare(Ka(k, d, this.targetFor(f), this.stage.utils, i), [f]));
      o(T, [f], m);
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
      const r = tp(e.motionPath, {
        query: o,
        targets: n.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      i = { ...i, motionPath: r };
    }
    if (e.morphSVG !== void 0) {
      const r = ep(e.morphSVG, o, s), { morphSVG: a, ...l } = i;
      i = r ? { ...i, morphSVG: r } : l;
    }
    if (e.drawSVG !== void 0) {
      const r = Xa(this.stage.elementFor(n[0]));
      if (r === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...l } = i;
        i = l;
      } else
        i = Ed(i, r);
    }
    return i;
  }
  resolve(e) {
    const n = this.stage.resolveTargets(e);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${eg(e)}`);
      return;
    }
    return this.firstElement ??= n.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), n;
  }
}
function Jp(t = new Vd()) {
  const e = (i) => {
    const { config: r } = Ps(i);
    return new he(t, {
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
      return l ? l[r] : t.appliedValue(a, r) ?? yh(r);
    },
    scrollTrigger: (i) => s(wr(t, i)),
    scrollBatch: (i, r) => Vp(t, i, r).map((a) => s(a)),
    scrollTo: (i, r) => Ya(o, t, i, r),
    refreshScroll: () => {
      po.refreshAll(), Ba.refreshAll();
    },
    smoothScroll: (i = {}) => {
      const r = typeof i.scroller == "string" ? (t.collector?.scope ?? t.root).querySelector(i.scroller) : i.scroller;
      return s(new Ba({ ...i, scroller: r }).start());
    },
    context: (i, r) => {
      const a = new $h(t, r);
      return i && a.add(() => i(a)), a;
    },
    matchMedia: (i) => new Wp(t, i),
    customEase: qp.create,
    customBounce: Yp.create,
    customWiggle: Kp.create,
    pageTransition: (i) => Bp(o, t, (r) => new he(t, r), i),
    imageSequence: (i, r) => {
      const a = typeof i == "string" ? (t.collector?.scope ?? t.root).querySelector(i) : i;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(i)}`);
      return s(new Fp(a, r));
    },
    quickTo: (i, r, a = {}) => {
      const l = new he(t, { paused: !0 }), [c] = t.resolveTargets(i);
      return Object.assign((u) => {
        if (!c) return;
        const f = a.spring !== void 0 ? t.velocityOf(c, r) ?? 0 : 0;
        l.compat.reset(), l.compat.to(c, {
          [r]: u,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: Zp(a.spring, r, f) }
        }), l.timeline.stop(), l.timeline.play(), t.activate(l.timeline);
      }, { tween: l, kill: () => l.kill() });
    },
    timeline: (i) => new he(t, i),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (i, r) => {
      if (r.scrollTo !== void 0) {
        const { scrollTo: a, ...l } = r, c = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof i != "string" && i !== window && i.nodeType === 1;
        return Ya(o, t, a, {
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
    delayedCall: (i, r, a) => new he(t).call(r, a, i),
    killTweensOf: (i, r) => {
      const a = t.resolveTargets(i), l = typeof r == "string" ? r.split(",").map((c) => c.trim()).filter(Boolean) : r;
      for (const c of [...t.liveTimelines]) c.killTweensOf(a, l);
    },
    convertToPath: (i) => sp(i, t.root),
    splitText: (i, r) => {
      const a = t.collector?.scope ?? t.root, l = typeof i == "string" ? Array.from(a.querySelectorAll(i)) : "nodeType" in i ? [i] : Array.from(i);
      return s(dp(l, r));
    },
    draggable: (i, r) => s(cp(o, t, i, r)),
    getFlipState: (i) => $i(t, i),
    flipFrom: (i, r) => Pi(t, (a) => new he(t, a), i, r),
    flip: (i, r, a) => {
      const l = $i(t, i);
      return r(), Pi(t, (c) => new he(t, c), l, { targets: i, ...a });
    }
  };
  return o;
}
const Ut = /* @__PURE__ */ Jp();
function Zp(t, e, n) {
  return t === !0 ? { velocity: { [e]: n } } : typeof t == "string" ? { preset: t, velocity: { [e]: n } } : { ...t, velocity: { [e]: n } };
}
function Qp(t) {
  return t.morphSVG !== void 0 || t.drawSVG !== void 0 || t.text !== void 0 || t.scrambleText !== void 0 || Ph(t);
}
function Ph(t) {
  return Object.entries(t).some(([e, n]) => (typeof n == "function" || mh(n)) && !yr.has(e));
}
function Ka(t, e, n, s, o) {
  if (!Ph(t)) return t;
  const i = {};
  for (const [r, a] of Object.entries(t))
    yr.has(r) ? i[r] = a : typeof a == "function" ? i[r] = a(e, n, o) : mh(a) ? i[r] = s.resolveRandomString(a) : i[r] = a;
  return i;
}
function za(t) {
  const e = t.map((s) => s?.getBoundingClientRect().top);
  if (e[0] === void 0) return t.length;
  let n = 0;
  for (const s of e) {
    if (s === void 0 || Math.abs(s - e[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function Xa(t) {
  const e = t;
  if (typeof e?.getTotalLength == "function")
    return e.getTotalLength();
}
function tg(t) {
  if (typeof t == "number" || typeof t == "string" || Array.isArray(t) && t.every((e) => typeof e == "number")) return t;
}
function eg(t) {
  return typeof t == "string" ? `"${t}"` : String(t);
}
class Ua {
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
function ng(t, e, n, s, o) {
  const i = n - o;
  if (i < 0) {
    e.paused || e.pause(), e.currentTime = 0;
    return;
  }
  t.update(i, s);
}
class kr {
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
    this.options = n, this.adapter = new Ne();
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
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = qn({ ...e, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
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
      i !== null && (s.volume = Math.max(0, Math.min(1, Number(i) || 0))), this.mediaTargets.push({ el: s, startTime: o, sync: new Ua(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(e, n) {
    for (const s of this.mediaTargets)
      ng(s.sync, s.el, e, n, s.startTime);
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
      const r = new Ne();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const l = a.getAttribute("data-tinyfly");
        l && r.registerTarget(l, a);
      }), this.symbolInstances.push({ adapter: r, timeline: qn(i.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(e, n) {
    this.mediaSync = new Ua(e, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const { crossings: i } = rh(
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
async function vv(t, e, n = {}) {
  const s = new kr(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
function Mv(t, e = {}) {
  return new kr(t, e);
}
const sg = {
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
}, Ga = "tinyfly-controls-style", og = `
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
let ig = 0;
function rg(t) {
  if (t.getElementById(Ga)) return;
  const e = t.createElement("style");
  e.id = Ga, e.textContent = og, t.head.appendChild(e);
}
function ag(t, e, n = {}) {
  const s = e.ownerDocument;
  rg(s);
  const o = { ...sg, ...n.labels }, i = n.speeds ?? [0.5, 1, 2], r = () => t.markers.length > 0, a = () => t.markers.some((C) => C.label !== void 0 || t.caption(C.id) !== void 0), l = s.createElement("div");
  l.className = "tf-ctl";
  const c = s.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (C, W, D, Y = "") => {
    const j = s.createElement("button");
    return j.type = "button", j.className = `tf-ctl-btn ${Y}`.trim(), j.setAttribute("aria-label", C), j.title = C, j.textContent = W, j.addEventListener("click", D), j;
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
  const T = s.createElement("select");
  T.className = "tf-ctl-speed", T.setAttribute("aria-label", o.speed);
  for (const C of i) {
    const W = s.createElement("option");
    W.value = String(C), W.textContent = `${C}×`, C === 1 && (W.selected = !0), T.appendChild(W);
  }
  T.addEventListener("change", () => t.setSpeed(Number(T.value))), c.append(u, f, d, g, m, b), i.length > 0 && c.append(T), l.append(c);
  const k = n.fullscreen ? ug(e, s, o) : void 0;
  k && c.append(k.button);
  const y = s.createElement("p");
  y.className = "tf-ctl-caption", y.setAttribute("aria-live", "polite"), n.captions !== !1 && l.append(y);
  const S = s.createElement("div");
  S.className = "tf-ctl-question", S.hidden = !0;
  const v = s.createElement("span"), x = h(o.reveal, o.reveal, () => t.play(), "tf-ctl-primary");
  S.append(v, x), l.append(S);
  const M = lg(t, s, o.scenario, n.scenarioControl ?? "buttons");
  M && l.append(M.element);
  const w = n.mount;
  w ? w.appendChild(l) : e.insertAdjacentElement("afterend", l);
  const $ = () => {
    const C = t.isPlaying;
    d.textContent = C ? "❚❚" : "▶", d.setAttribute("aria-label", C ? o.pause : o.play), d.title = C ? o.pause : o.play;
    const W = t.duration;
    s.activeElement !== m && (m.value = String(W > 0 ? Math.round(t.currentTime / W * 1e3) : 0));
    const D = t.markers;
    if (f.hidden = g.hidden = b.hidden = D.length === 0, D.length > 0) {
      const Y = t.currentMarker, j = Y ? D.indexOf(Y) + 1 : 0;
      b.textContent = o.stepFormat.replace("{index}", String(j)).replace("{total}", String(D.length)), b.setAttribute("aria-label", `${o.step} ${j} ${o.of} ${D.length}`), f.disabled = t.currentTime <= 0.5, g.disabled = t.currentTime >= W - 0.5;
      const _ = t.caption() ?? "";
      y.textContent !== _ && (y.textContent = _), y.hidden = !a();
      const L = !C && Y?.question !== void 0 && Math.abs(t.currentTime - Y.time) < 1;
      S.hidden = !L, L && v.textContent !== Y.question && (v.textContent = Y.question);
    } else
      S.hidden = !0, y.hidden = !0;
    M?.update();
  }, E = t.subscribe($);
  $();
  const A = n.keyboardScope ?? e;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const H = /* @__PURE__ */ new WeakSet(), I = (C) => {
    if (H.has(C) || (H.add(C), C.defaultPrevented || C.altKey || C.ctrlKey || C.metaKey)) return;
    const W = C.target;
    if (!(W.tagName === "INPUT" || W.tagName === "SELECT") && !(C.key === " " && W.tagName === "BUTTON"))
      switch (C.key) {
        case " ":
          C.preventDefault(), t.isPlaying ? t.pause() : p();
          break;
        case "ArrowRight":
          if (!r()) return;
          C.preventDefault(), t.next();
          break;
        case "ArrowLeft":
          if (!r()) return;
          C.preventDefault(), t.prev();
          break;
        case "Home":
          C.preventDefault(), t.pause(), t.seek(0);
          break;
        case "f":
        case "F":
          if (!k) return;
          C.preventDefault(), k.active ? k.exit() : k.enter();
          break;
      }
  };
  return A.addEventListener("keydown", I), l.addEventListener("keydown", I), {
    element: l,
    fullscreen: k && {
      get active() {
        return k.active;
      },
      enter: k.enter,
      exit: k.exit
    },
    destroy() {
      k?.destroy(), E(), A.removeEventListener("keydown", I), l.removeEventListener("keydown", I), l.remove();
    }
  };
}
function lg(t, e, n, s) {
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
  const a = `tf-ctl-scenario-${++ig}`, l = o.map((h) => {
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
const cg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', hg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function ug(t, e, n) {
  const s = e, o = t, i = e.createElement("button");
  i.type = "button", i.className = "tf-ctl-btn tf-ctl-fullscreen";
  let r, a = "";
  const l = () => {
    const p = r !== void 0;
    i.innerHTML = p ? hg : cg;
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
const Va = "tinyfly-choices-style", fg = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function dg(t) {
  if (t.getElementById(Va)) return;
  const e = t.createElement("style");
  e.id = Va, e.textContent = fg, t.head.appendChild(e);
}
function pg(t, e) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  dg(e.ownerDocument);
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
const Ks = /* @__PURE__ */ new WeakMap(), Ii = /* @__PURE__ */ new WeakMap();
let gg = 0;
function Hn(t, e, n) {
  if (t)
    try {
      return JSON.parse(t);
    } catch (s) {
      console.warn(`tinyfly: invalid ${e} JSON on`, n, s);
      return;
    }
}
async function mg(t, e = {}) {
  const n = Ks.get(t);
  if (n) return n;
  const s = Array.from(t.querySelectorAll("script[data-tinyfly-timeline]")), o = s[0], i = t.getAttribute("data-src"), r = bg(t.getAttribute("data-markers")), a = s.length > 1 || o?.hasAttribute("data-scenario") ? yg(s, r, t) : void 0;
  if (a && a.length === 0) return;
  let l = o && !a ? Hn(o.textContent, "timeline", t) : void 0;
  if (!l && i && r) {
    const d = await fetch(i);
    d.ok && (l = await d.json());
  }
  if (l && r && (l = Ih(l, r)), !l && !i && !a) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', t);
    return;
  }
  const c = Hn(t.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", t), h = {
    playWhenVisible: !0,
    ...e.player,
    ...c && { captions: c },
    ...Hn(t.getAttribute("data-options"), "data-options", t)
  };
  kg(t);
  const u = new kr(t, h), f = { element: t, player: u };
  if (Ks.set(t, f), t.setAttribute("data-tinyfly-mounted", ""), a) {
    const d = t.getAttribute("data-scenario") ?? void 0;
    await u.loadScenarios(a, { initial: a.some((g) => g.id === d) ? d : void 0 }), Ii.set(t, pg(u, t));
  } else
    await u.load(l ?? i);
  if (t.getAttribute("data-controls") !== "false") {
    const d = Hn(t.getAttribute("data-labels"), "data-labels", t), g = t.querySelector("figcaption"), p = t.getAttribute("data-scenario-legend"), m = t.getAttribute("data-scenario-control");
    f.controls = ag(u, t, {
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
function yg(t, e, n) {
  const s = [];
  return t.forEach((o, i) => {
    const r = Hn(o.textContent, "timeline", n);
    if (!r) return;
    const a = o.getAttribute("data-scenario") || `scenario-${i + 1}`;
    if (s.some((c) => c.id === a)) {
      console.warn(`tinyfly: scenario id "${a}" is used more than once; the later one is skipped`, n);
      return;
    }
    const l = o.getAttribute("data-scenario-label") ?? void 0;
    s.push({ id: a, label: l, timeline: e ? Ih(r, e) : r });
  }), s;
}
function Ih(t, e) {
  return t.config.markers?.length ? t : { ...t, config: { ...t.config, markers: e.map((n, s) => ({ id: `step-${s + 1}`, time: n })) } };
}
function bg(t) {
  if (!t) return;
  const e = t.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, s) => n - s);
  return e.length > 0 ? e : void 0;
}
async function wg(t = document, e = {}) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((o) => mg(o, e)))).filter((o) => o !== void 0);
}
function xv(t) {
  const e = Ks.get(t);
  e && (Ii.get(t)?.(), Ii.delete(t), e.controls?.destroy(), e.player.destroy(), Ks.delete(t), t.removeAttribute("data-tinyfly-mounted"));
}
function kg(t) {
  const e = t.querySelector("svg");
  if (!e || e.hasAttribute("role") || e.hasAttribute("aria-hidden")) return;
  const n = t.getAttribute("data-alt"), s = t.querySelector("figcaption");
  e.setAttribute("role", "img"), n ? e.setAttribute("aria-label", n) : s && (s.id ||= `tinyfly-caption-${++gg}`, e.setAttribute("aria-labelledby", s.id));
}
function vg() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const e = () => {
    wg();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", e, { once: !0 }) : e();
}
class Mg {
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
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new Ne(), this.adapterB = new Ne();
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
      const a = new Ne();
      o.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const c = l.getAttribute("data-tinyfly");
        c && a.registerTarget(c, l);
      }), s.push({ adapter: a, timeline: qn(r) });
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
    return e.timeline ? qn(e.timeline) : null;
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
async function Sv(t, e, n = {}) {
  const s = new Mg(t, { ...n, autoplay: !0 });
  return await s.load(e), s;
}
const Tv = { type: "none", duration: 0 }, St = (t) => ({ description: t, unit: "degrees" }), Mt = (t, e = 0, n = 1) => ({ description: t, unit: `${e}..${n}`, min: e, max: n }), Oh = {
  lean: St("Upper body tipped about the hips (+ toward the way it faces)"),
  bend: St("Line of action: the spine curved (+ curls forward, − arches back)"),
  headTilt: St("Head tilt"),
  leftShoulder: St("Left upper arm: 0 hangs down, 90 straight out to its side, 180 straight up; in profile, forward is negative for the left arm"),
  rightShoulder: St("Right upper arm: 0 hangs down, 90 straight out (forward, in profile), 180 straight up"),
  leftElbow: St("Left elbow bend, added to the upper arm"),
  rightElbow: St("Right elbow bend, added to the upper arm"),
  leftHip: St("Left thigh: 0 straight down; in profile negative is forward"),
  rightHip: St("Right thigh: 0 straight down; in profile positive is forward"),
  leftKnee: St("Left knee bend (negative folds the shin back)"),
  rightKnee: St("Right knee bend (positive folds the shin back)"),
  leftWrist: St("Left wrist bend, added to the forearm"),
  rightWrist: St("Right wrist bend, added to the forearm"),
  leftAnkle: St("Left ankle: + points the toe down (tiptoe), − onto the heel"),
  rightAnkle: St("Right ankle: + points the toe down (tiptoe), − onto the heel"),
  leftFootOut: Mt("Left foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  rightFootOut: Mt("Right foot turned out (seen from the front): 0 natural, 1 sideways, negative turned in", -1, 1),
  mouth: Mt("Mouth open: 0 closed, 1 wide open"),
  smile: Mt("−1 frown, 0 flat, 1 smile", -1, 1),
  mouthWidth: { description: "Mouth width: 1 normal, 0.5 pursed, 1.5 wide", unit: "factor", min: 0.3, max: 2 },
  blink: Mt("Eyes closed by a blink: 0 open, 1 shut"),
  leftEye: { description: "Left eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  rightEye: { description: "Right eye openness: 0 shut, 1 normal, 1.6 wide", unit: "factor", min: 0, max: 2 },
  leftBrow: Mt("Left eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  rightBrow: Mt("Right eyebrow: −1 lowered, 0 rest, 1 raised", -1, 1),
  browTilt: Mt("Eyebrow slant: −1 angry, 1 worried", -1, 1),
  lookX: Mt("Eyes look across: + the way it faces", -1, 1),
  lookY: Mt("Eyes look down (+) or up (−)", -1, 1),
  stretch: { description: "Squash and stretch: 1 normal, above taller (a jump), below squashed (a landing)", unit: "factor", min: 0.3, max: 3 },
  turn: Mt("0 front-on, 1 in profile, turned the way it faces"),
  sit: Mt("0 standing, 1 seated"),
  spin: St("Whole body turned about the hips: + rolls forward (a front flip), 360 a full turn"),
  rise: { description: "Lift off the ground, as a fraction of its height (the arc of a jump)", unit: "× height" }
}, _h = {
  walk: { description: "Walk-cycle phase, in strides: animate 0 → n for n strides", unit: "strides" },
  walking: Mt("How much of the walk cycle is applied (0 standing)"),
  gait: { description: "How it walks: a gait name (walk, bouncy, doubleBounce, sneak, strut, tired, run, shove); a string track switches it", kind: "string" },
  talk: Mt("How much the mouth chatters"),
  rubber: Mt("Limbs from jointed (0) to rubber hose (1)"),
  facing: { description: "Which way it faces: 1 right, −1 left (key the flip while turn is near 0)", unit: "±1", min: -1, max: 1 },
  beat: { description: "Beats into its dance (with a dance)", unit: "beats" },
  dancing: Mt("How much of the dance is applied")
}, Hh = {
  "thumb.curl": Mt("Thumb curled in"),
  "thumb.across": Mt("Thumb across the palm"),
  "index.curl": Mt("Index finger curled"),
  "middle.curl": Mt("Middle finger curled"),
  "ring.curl": Mt("Ring finger curled"),
  "pinky.curl": Mt("Little finger curled"),
  spread: Mt("Fingers spread apart"),
  turn: St("Hand turned about the forearm"),
  bend: St("Hand bent at the wrist, palm-ward"),
  tilt: St("Hand tilted sideways"),
  roll: St("Hand rolled to show the back or the palm")
};
let Ch;
function xg(t) {
  Ch = t;
}
function Sg(t) {
  return Ch?.(t) ?? {};
}
function Tg(t) {
  let e = 0;
  for (let n = 1; n < t.length; n++) e += Math.hypot(t[n].x - t[n - 1].x, t[n].y - t[n - 1].y);
  return e;
}
function Kn(t, e) {
  const n = Math.min(1, Math.max(0, e));
  if (t.length < 2 || n === 1) return t.slice();
  if (n === 0) return t.slice(0, 1);
  let s = Tg(t) * n;
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
function vr(t, e) {
  const n = Kn(t, e);
  return n[n.length - 1];
}
function Rh(t, e) {
  return e > 0 ? Math.floor(Math.max(0, t) * e / 1e3) : 0;
}
function Oi(t, e, n) {
  const s = e.roughness ?? 2, o = Math.max(1, Math.round(e.passes ?? 2)), i = Rh(n, e.boil ?? 8);
  let r = 0;
  const a = () => {
    const f = r++;
    return (d) => bn(te(`${e.seed ?? 1}:${i}:${f}:${d}`));
  }, l = (f, d) => (f.next() * 2 - 1) * d, c = (f) => {
    const d = a(), g = t.lineWidth, p = t.globalAlpha;
    for (let m = 0; m < o; m++)
      t.lineWidth = m === 0 ? g : g * 0.55, t.globalAlpha = m === 0 ? p : p * 0.6, f(d(m));
    t.lineWidth = g, t.globalAlpha = p;
  }, h = (f, d = 1) => {
    if (f.length < 2) return;
    const g = f.slice(1).map((m, b) => Math.hypot(m.x - f[b].x, m.y - f[b].y)), p = g.reduce((m, b) => m + b, 0) * Math.min(1, Math.max(0, d));
    c((m) => {
      const b = [], T = [];
      if (f.forEach((y, S) => {
        b.push({ x: y.x + l(m, s * 0.5), y: y.y + l(m, s * 0.5) }), S > 0 && T.push([m.next() * 2 - 1, m.next() * 2 - 1]);
      }), p <= 0) return;
      t.beginPath(), t.moveTo(b[0].x, b[0].y);
      let k = 0;
      for (let y = 1; y < b.length; y++) {
        const S = Eg(b[y - 1], b[y], s, T[y - 1]), v = g[y - 1];
        if (k + v <= p) {
          t.bezierCurveTo(S[1].x, S[1].y, S[2].x, S[2].y, S[3].x, S[3].y), k += v;
          continue;
        }
        const x = Ag(S, v === 0 ? 1 : (p - k) / v);
        t.bezierCurveTo(x[1].x, x[1].y, x[2].x, x[2].y, x[3].x, x[3].y);
        break;
      }
      t.stroke();
    });
  }, u = (f, d, g, p, m = 1) => {
    c((b) => {
      const k = b.next() * Math.PI * 2, y = Math.PI * 2 + 0.15 + b.next() * 0.3, S = [];
      for (let x = 0; x <= 14; x++) {
        const M = k + y * x / 14, w = l(b, s * 0.6);
        S.push({ x: f + Math.cos(M) * (g + w), y: d + Math.sin(M) * (p + w) });
      }
      const v = Kn(S, m);
      v.length < 2 || (Ja(t, v), t.stroke());
    });
  };
  return {
    line: h,
    curve(f, d = 1) {
      if (f.length < 2) return;
      const g = f[0], p = f[f.length - 1], m = Math.hypot(p.x - g.x, p.y - g.y) || 1, b = -(p.y - g.y) / m, T = (p.x - g.x) / m;
      c((k) => {
        const y = { x: l(k, s * 0.5), y: l(k, s * 0.5) }, S = { x: l(k, s * 0.5), y: l(k, s * 0.5) }, v = l(k, s * Math.min(1.5, Math.max(0.3, m / 80))), x = f.map((w, $) => {
          const E = $ / (f.length - 1), A = Math.sin(Math.PI * E) * v;
          return {
            x: w.x + y.x + (S.x - y.x) * E + b * A,
            y: w.y + y.y + (S.y - y.y) * E + T * A
          };
        }), M = Kn(x, d);
        M.length < 2 || (Ja(t, M), t.stroke());
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
function Eg(t, e, n, s) {
  const o = e.x - t.x, i = e.y - t.y, r = Math.hypot(o, i) || 1, a = n * Math.min(1.5, Math.max(0.3, r / 80)), l = -i / r, c = o / r;
  return [
    t,
    { x: t.x + o / 3 + l * s[0] * a, y: t.y + i / 3 + c * s[0] * a },
    { x: t.x + 2 * o / 3 + l * s[1] * a, y: t.y + 2 * i / 3 + c * s[1] * a },
    e
  ];
}
function Ag([t, e, n, s], o) {
  const i = (u, f) => ({ x: u.x + (f.x - u.x) * o, y: u.y + (f.y - u.y) * o }), r = i(t, e), a = i(e, n), l = i(n, s), c = i(r, a), h = i(a, l);
  return [t, r, c, i(c, h)];
}
function Ja(t, e) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let s = 1; s < e.length - 1; s++) {
    const o = { x: (e[s].x + e[s + 1].x) / 2, y: (e[s].y + e[s + 1].y) / 2 };
    t.quadraticCurveTo(e[s].x, e[s].y, o.x, o.y);
  }
  const n = e[e.length - 1];
  t.lineTo(n.x, n.y);
}
function ue(t, e, n) {
  const s = t.length;
  if (s < 2) return [];
  const o = [], i = [], r = (a) => e + (n - e) * a / (s - 1);
  return t.forEach((a, l) => {
    const c = t[Math.max(0, l - 1)], h = t[Math.min(s - 1, l + 1)], u = Math.hypot(h.x - c.x, h.y - c.y) || 1, f = r(l) / 2, d = -(h.y - c.y) / u * f, g = (h.x - c.x) / u * f;
    o.push({ x: a.x + d, y: a.y + g }), i.push({ x: a.x - d, y: a.y - g });
  }), [...o, ...i.reverse()];
}
function Mr(t, e, n, s) {
  const o = e.length;
  if (o < 2) return;
  const i = ue(e, n, s), r = (a) => n + (s - n) * a / (o - 1);
  t.beginPath(), t.moveTo(i[0].x, i[0].y);
  for (const a of i.slice(1)) t.lineTo(a.x, a.y);
  t.closePath(), t.fill(), e.forEach((a, l) => {
    l !== 0 && l !== o - 1 && o > 3 || (t.beginPath(), t.arc(a.x, a.y, r(l) / 2, 0, Math.PI * 2), t.fill());
  });
}
function gn(t, e, n, s, o = 16) {
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
function Za(t, e, n, s, o, i = 0, r = 1, a = 40) {
  const l = Math.cos(o), c = Math.sin(o);
  return Array.from({ length: a + 1 }, (h, u) => {
    const f = i + Math.PI * 2 * r * u / a, d = Math.cos(f) * n, g = Math.sin(f) * s;
    return { x: t + d * l - g * c, y: e + d * c + g * l };
  });
}
function go(t, e) {
  return e.look === "pencil" ? Og(t, e) : $g(t, e.ink, e.look);
}
function zs(t, e, n = !1) {
  t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (const s of e.slice(1)) t.lineTo(s.x, s.y);
  n && t.closePath();
}
function $g(t, e, n) {
  const s = n === "silhouette", o = s ? 1.25 : 1;
  return {
    look: n,
    ink: e,
    limb(i, r, a) {
      t.fillStyle = e, Mr(t, i, r * o, a * o);
    },
    line(i, r) {
      i.length < 2 || (t.strokeStyle = e, t.lineWidth = r * o, t.lineCap = "round", t.lineJoin = "round", zs(t, i), t.stroke());
    },
    shape(i, r, a) {
      zs(t, i, !0), (r !== null || s) && (t.fillStyle = s ? e : r, t.fill()), !(a <= 0) && (t.strokeStyle = e, t.lineWidth = a * o, t.lineJoin = "round", t.stroke());
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
function Pg(t, e) {
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
function Ig(t, e) {
  const n = t.length;
  return t.map((s, o) => {
    const i = t[Math.max(0, o - 1)], r = t[Math.min(n - 1, o + 1)], a = Math.hypot(r.x - i.x, r.y - i.y) || 1, l = e(n === 1 ? 0 : o / (n - 1));
    return { x: s.x - (r.y - i.y) / a * l, y: s.y + (r.x - i.x) / a * l };
  });
}
function Qa(t) {
  const e = [0.6, 1.4, 2.9].map((s) => ({
    frequency: s * (0.8 + t.next() * 0.4),
    phase: t.next() * Math.PI * 2,
    amount: 0.5 + t.next() * 0.5
  })), n = e.reduce((s, o) => s + o.amount, 0);
  return (s) => e.reduce((o, i) => o + i.amount * Math.sin(Math.PI * 2 * i.frequency * s + i.phase), 0) / n;
}
function Og(t, e) {
  const n = e.pencil ?? {}, s = e.ink, o = n.roughness ?? Math.max(1, e.lineWidth * 0.12), i = Math.max(1, Math.round(n.passes ?? 2)), r = Math.min(1, Math.max(0, n.pressure ?? 0.25)), a = Math.min(1, Math.max(0, n.rubbedOut ?? 0.15)), l = Rh(e.time, n.boil ?? 8);
  let c = 0;
  const h = (g, p, m = !1) => bn(te(`${e.seed}:${m ? "paper" : l}:${g}:${p}`)), u = (g, p, m, b, T, k = 0) => {
    if (g.length < 2) return;
    const y = g.slice(1).reduce((E, A, H) => E + Math.hypot(A.x - g[H].x, A.y - g[H].y), 0);
    let S = Pg(g, Math.max(1.5, Math.min(e.lineWidth * 0.8, y / 24)));
    if (k > 0 && S.length >= 2) {
      const [E, A] = [S[S.length - 2], S[S.length - 1]], H = Math.hypot(A.x - E.x, A.y - E.y) || 1;
      S = [...S, { x: A.x + (A.x - E.x) / H * k, y: A.y + (A.y - E.y) / H * k }];
    }
    const v = Qa(m), x = Qa(m), M = S.length, w = [], $ = [];
    S.forEach((E, A) => {
      const H = M === 1 ? 0 : A / (M - 1), I = S[Math.max(0, A - 1)], C = S[Math.min(M - 1, A + 1)], W = Math.hypot(C.x - I.x, C.y - I.y) || 1, D = -(C.y - I.y) / W, Y = (C.x - I.x) / W, j = v(H) * T, _ = Math.min(1, H / 0.08, (1 - H) / 0.08), L = (0.55 + 0.45 * Math.sqrt(Math.max(0, _))) * (1 + r * x(H)), F = Math.max(0.3, p(H) * L / 2), P = E.x + D * j, R = E.y + Y * j;
      w.push({ x: P + D * F, y: R + Y * F }), $.push({ x: P - D * F, y: R - Y * F });
    }), t.save(), t.globalAlpha *= b, t.fillStyle = s, zs(t, [...w, ...$.reverse()], !0), t.fill(), t.restore();
  }, f = (g, p) => {
    const m = c++, b = h(m, 99, !0);
    if (b.next() < a) {
      const S = (b.next() * 2 - 1) * e.lineWidth * 1.4, v = (b.next() * 2 - 1) * e.lineWidth * 1.4, x = g.map((M) => ({ x: M.x + S, y: M.y + v }));
      u(x, (M) => p(M) * 1.8, h(m, 98, !0), 0.035, o), u(x, (M) => p(M) * 0.45, h(m, 97, !0), 0.12, o * 1.5);
    }
    const T = g.slice(1).reduce((S, v, x) => S + Math.hypot(v.x - g[x].x, v.y - g[x].y), 0), k = p(0.5) > 4 && T > p(0.5) * 6, y = k ? [-0.3, 0.3, 0] : [0];
    for (let S = 0; S < i; S++) {
      const v = S === 0;
      y.forEach((x, M) => {
        const w = h(m, S * 10 + M), $ = x === 0 ? g : Ig(g, (A) => p(A) * x * Math.sqrt(Math.sin(Math.PI * A))), E = !v && x === 0 ? e.lineWidth * (0.3 + w.next() * 0.8) : 0;
        u($, (A) => p(A) * (k ? 0.5 : 1) * (v ? 1 : 0.6), w, v ? 0.85 : 0.45, o * (v ? 0.6 : 1), E);
      });
    }
  }, d = (g, p, m, b, T, k) => {
    const S = h(c, 50).next() * Math.PI * 2;
    f(Za(g, p, m, b, T, S, 1.08, 48), () => k);
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
      p !== null && (t.save(), t.globalAlpha *= 0.88, t.fillStyle = p, zs(t, g, !0), t.fill(), t.restore()), m > 0 && f([...g, g[0]], () => m);
    },
    ellipse(g, p, m, b, T, k, y) {
      k !== null && (t.save(), t.globalAlpha *= 0.9, t.fillStyle = k, t.beginPath(), t.ellipse(g, p, m, b, T, 0, Math.PI * 2), t.fill(), t.restore()), d(g, p, m, b, T, y);
    },
    dot(g, p, m) {
      t.save(), t.globalAlpha *= 0.9, t.fillStyle = s, t.beginPath(), t.arc(g, p, m, 0, Math.PI * 2), t.fill(), t.restore();
    },
    guide(g) {
      if (n.construction === !1 || g.length < 2) return;
      const p = c++;
      u(g, () => Math.max(0.6, e.lineWidth * 0.18), h(p, 0), 0.28, o * 1.2, e.lineWidth);
    },
    guideEllipse(g, p, m, b, T) {
      if (n.construction === !1) return;
      const k = c++, y = h(k, 0), S = Za(g, p, m, b, T, y.next() * Math.PI * 2, 1.12, 48);
      u(S, () => Math.max(0.6, e.lineWidth * 0.18), y, 0.28, o * 1.5);
    }
  };
}
const _g = ["thumb", "index", "middle", "ring", "pinky"], $t = {
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
function At(t = {}) {
  return { ...$t, ...t };
}
const Ft = (t, e, n, s, o) => ({
  "thumb.curl": t,
  "index.curl": e,
  "middle.curl": n,
  "ring.curl": s,
  "pinky.curl": o
}), _t = {
  relaxed: $t,
  open: At({ ...Ft(0, 0, 0, 0, 0), "thumb.across": 0, spread: 0.55 }),
  spread: At({ ...Ft(0, 0, 0, 0, 0), "thumb.across": 0, spread: 1 }),
  flat: At({ ...Ft(0, 0, 0, 0, 0), "thumb.across": 0.35, spread: 0 }),
  fist: At({ ...Ft(0.7, 1, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  point: At({ ...Ft(0.75, 0, 1, 1, 1), "thumb.across": 0.9, spread: 0 }),
  /** The fist on its side, knuckles toward the viewer, the thumb up */
  thumbsUp: At({ ...Ft(0, 1, 1, 1, 1), "thumb.across": 0, spread: 0, roll: 70 }),
  peace: At({ ...Ft(0.75, 0, 0, 1, 1), "thumb.across": 0.9, spread: 1 }),
  ok: At({ ...Ft(0.12, 0.6, 0.1, 0.15, 0.2), "thumb.across": 0.55, spread: 0.6 }),
  pinch: At({ ...Ft(0.1, 0.65, 0.75, 0.85, 0.9), "thumb.across": 0.55, spread: 0 }),
  cupped: At({ ...Ft(0.25, 0.4, 0.4, 0.4, 0.4), "thumb.across": 0.4, spread: 0.05, turn: 2 }),
  wave: At({ ...Ft(0, 0.05, 0.05, 0.1, 0.12), "thumb.across": 0, spread: 0.7, turn: 2 }),
  /** Holding a pencil to write: thumb and middle finger pinch it, the index finger rests on top */
  pencilGrip: At({ ...Ft(0.1, 0.6, 0.72, 0.88, 0.95), "thumb.across": 0.5, spread: 0, turn: 0.8, bend: 10 }),
  /** Holding a handle, a cup or a bar: every finger wrapped round it */
  hold: At({ ...Ft(0.5, 0.7, 0.72, 0.74, 0.76), "thumb.across": 0.75, spread: 0, turn: 1 })
};
function zn(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
const Hg = {
  index: { knuckle: [-0.16, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.125, fan: -1 },
  middle: { knuckle: [-0.055, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.13, fan: -0.2 },
  ring: { knuckle: [0.05, 0.475, -0.02], bones: [0.2, 0.125, 0.1], width: 0.122, fan: 0.55 },
  pinky: { knuckle: [0.15, 0.43, -0.02], bones: [0.16, 0.1, 0.085], width: 0.108, fan: 1.25 }
}, Cg = {
  index: { knuckle: [-0.14, 0.47, -0.02], bones: [0.2, 0.125, 0.1], width: 0.15, fan: -1 },
  middle: { knuckle: [0, 0.49, -0.02], bones: [0.22, 0.135, 0.1], width: 0.155, fan: 0 },
  pinky: { knuckle: [0.14, 0.45, -0.02], bones: [0.19, 0.115, 0.095], width: 0.145, fan: 1 }
}, ie = {
  base: [-0.11, 0.1, -0.05],
  bones: [0.2, 0.15, 0.12],
  widths: [0.2, 0.145, 0.135],
  /** Where the thumb points with `across` 0 and 1 */
  out: [-0.7, 0.68, -0.22],
  across: [0.35, 0.5, -0.8]
}, Rg = [82, 100, 62], Lg = [48, 72], Wg = 3, Fg = 13, Dg = 0.035, Ng = -0.075, Bg = [
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
], ke = (t) => t * Math.PI / 180, _i = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Is = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Hi = (t, e) => [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]], En = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function Be(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = Hi(e, t), r = e[0] * t[0] + e[1] * t[1] + e[2] * t[2];
  return [
    t[0] * s + i[0] * o + e[0] * r * (1 - s),
    t[1] * s + i[1] * o + e[1] * r * (1 - s),
    t[2] * s + i[2] * o + e[2] * r * (1 - s)
  ];
}
const tl = [1, 0, 0], el = [0, 1, 0], Wn = [0, 0, 1];
function jg(t, e, n) {
  const s = ke(t.fan * (Wg + Fg * n)), o = [Math.sin(s), Math.cos(s), 0], i = [Math.cos(s), -Math.sin(s), 0], r = [t.knuckle];
  let a = 0;
  t.bones.forEach((h, u) => {
    a += ke(Rg[u] * e), r.push(_i(r[u], Is(Be(o, i, -a), h)));
  });
  const l = Be(Wn, i, -a), c = r.map((h, u) => t.width * (1 - 0.14 * (u / (r.length - 1))));
  return { joints: r, back: l, widths: c };
}
function qg(t, e, n = 1, s = 1) {
  const o = Math.min(1, Math.max(0, e)), i = En(_i(Is(En(ie.out), 1 - o), Is(En(ie.across), o))), r = En(Hi(Wn, i)), a = En(Hi(i, r)), l = [[ie.base[0] * s, ie.base[1], ie.base[2]]];
  let c = 0;
  ie.bones.forEach((f, d) => {
    d > 0 && (c += ke(Lg[d - 1] * t)), l.push(_i(l[d], Is(Be(i, r, c), f)));
  });
  const h = Be(a, r, c), u = [...ie.widths, ie.widths[ie.widths.length - 1] * 0.92].map((f) => f * n);
  return { joints: l, back: h, widths: u };
}
function Ci(t, e = {}) {
  const n = { ...$t, ...t }, s = e.size ?? 100, o = e.side ?? "right", i = o === "left" ? -1 : 1, r = ke(e.angle ?? 0), a = e.fingers === 4, l = Math.max(0.5, e.plump ?? 1), c = 1 + (l - 1) * 0.7, h = (A) => ({
    ...A,
    knuckle: [A.knuckle[0] * c, A.knuckle[1], A.knuckle[2]],
    width: A.width * l
  }), u = ke(n.bend ?? 0), f = ke(n.tilt ?? 0), d = ke(90 * (n.turn ?? 0)), g = (A) => Be(Be(Be(A, tl, -u), Wn, -f), el, d), p = Math.cos(r), m = Math.sin(r), b = ke(n.roll ?? 0), T = Math.cos(b), k = Math.sin(b), y = (A) => {
    const H = A[0] * s, I = -A[1] * s, C = (H * T - I * k) * i, W = H * k + I * T;
    return { x: C * p - W * m, y: C * m + W * p };
  }, S = (A) => {
    const H = y(A), I = Math.hypot(H.x, H.y);
    return I > 1e-6 * s ? { x: H.x / I, y: H.y / I } : { x: 0, y: 0 };
  }, v = {
    thumb: qg(n["thumb.curl"] ?? 0, n["thumb.across"] ?? 0, l, c)
  }, x = a ? Cg : Hg;
  for (const A of _g) {
    const H = x[A];
    H && (v[A] = jg(h(H), n[`${A}.curl`] ?? 0, n.spread ?? 0));
  }
  const M = {};
  for (const [A, H] of Object.entries(v)) {
    const I = H.joints.map(g), C = g(H.back);
    M[A] = {
      points: I.map(y),
      depths: I.map((W) => W[2] * s),
      widths: H.widths.map((W) => W * s),
      nail: C[2],
      back: S(C)
    };
  }
  const w = Bg.flatMap(([A, H]) => [g([A * c, H, Dg]), g([A * c, H, Ng])]), $ = Kg(w.map(y)), E = w.reduce((A, H) => A + H[2], 0) / w.length * s;
  return {
    size: s,
    side: o,
    wrist: { x: 0, y: 0 },
    palm: $,
    palmDepth: E,
    palmFacing: -g(Wn)[2],
    fingers: M,
    axes: { up: S(g(el)), across: S(g(tl)), out: S(g(Wn)) },
    curls: Object.fromEntries(Object.keys(M).map((A) => [A, n[`${A}.curl`] ?? 0]))
  };
}
function Yg(t, e) {
  const n = (o) => ({ x: o.x + e.x - t.wrist.x, y: o.y + e.y - t.wrist.y }), s = {};
  for (const [o, i] of Object.entries(t.fingers))
    s[o] = { ...i, points: i.points.map(n) };
  return { ...t, wrist: n(t.wrist), palm: t.palm.map(n), fingers: s };
}
function Kg(t) {
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
const zg = "#f1c9a5", Xg = "#2f2f33";
function xr(t, e, n, s = {}, o = 0) {
  const i = Yg(Ci(n, s), e), r = s.ink ?? Xg, a = s.lineWidth ?? i.size * 0.035, l = s.pen ?? go(t, {
    look: s.look ?? "clean",
    ink: r,
    lineWidth: a,
    seed: s.seed ?? 1,
    time: o,
    pencil: { construction: !1, ...s.pencil }
  }), c = s.skin ?? zg, h = s.nails ?? !0, u = [
    {
      depth: i.palmDepth,
      draw: () => Ug(l, i, c, a)
    }
  ];
  for (const f of Object.values(i.fingers)) {
    const d = f.depths.reduce((g, p) => g + p, 0) / f.depths.length;
    u.push({
      depth: d,
      draw: () => Gg(t, l, f, c, a, h)
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
function Ug(t, e, n, s) {
  if (t.shape(e.palm, n, s), e.palmFacing < -0.3 && t.look !== "silhouette") {
    const { up: o } = e.axes;
    for (const [i, r] of Object.entries(e.fingers)) {
      const a = e.curls[i] ?? 0;
      if (i === "thumb" || a < 0.5) continue;
      const l = r.points[0], c = r.widths[0] * 0.42, h = { x: l.x - o.x * c * 0.2, y: l.y - o.y * c * 0.2 }, u = Math.atan2(o.y, o.x), f = Array.from({ length: 7 }, (d, g) => {
        const p = u - Math.PI / 2 + Math.PI * g / 6;
        return { x: h.x + Math.cos(p) * c, y: h.y + Math.sin(p) * c };
      });
      t.line(f, s * 0.6);
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
function Gg(t, e, n, s, o, i) {
  const { widths: r } = n, a = Vg(n.points, 2), l = n.points[0], c = a[a.length - 1], h = r[0], u = r[r.length - 1];
  if (t.save(), e.look !== "silhouette") {
    t.beginPath(), t.rect(l.x - 1e5, l.y - 1e5, 2e5, 2e5);
    const p = h / 2 + o * 1.6;
    t.moveTo(l.x + p, l.y), t.arc(l.x, l.y, p, 0, Math.PI * 2), t.clip("evenodd");
  }
  if (e.limb(a, h + 2 * o, u + 2 * o), t.restore(), e.look !== "silhouette" && (t.fillStyle = s, Mr(t, a, h, u)), e.look === "silhouette" || !i || n.nail < 0.25) return;
  const f = a[a.length - 2], d = Jg({ x: c.x - f.x, y: c.y - f.y }) ?? {
    x: 0,
    y: -1
  }, g = {
    x: c.x - d.x * u * 0.22 + n.back.x * u * 0.1,
    y: c.y - d.y * u * 0.22 + n.back.y * u * 0.1
  };
  e.ellipse(g.x, g.y, u * 0.24 * Math.max(0.35, n.nail), u * 0.19, Math.atan2(d.y, d.x), "#f8e3d3", o * 0.45);
}
function Vg(t, e) {
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
const Jg = (t) => {
  const e = Math.hypot(t.x, t.y);
  return e > 1e-6 ? { x: t.x / e, y: t.y / e } : null;
}, Lt = {
  walk: { swing: 24, knee: 30, arm: 22, elbow: 28, lean: 4 },
  bouncy: { swing: 26, knee: 45, arm: 34, elbow: 30, lean: 2, bend: -4, bounce: 0.035, squash: 0.06 },
  doubleBounce: { swing: 22, knee: 40, arm: 26, elbow: 24, lean: 3, bounce: 0.02, bounces: 2, squash: 0.04 },
  sneak: { swing: 28, knee: 70, arm: 6, elbow: 0, forearm: 110, shoulder: 55, lean: 16, bend: 14, headTilt: -8, crouch: 50, tiptoe: 25 },
  strut: { swing: 26, knee: 30, arm: 30, elbow: 20, lean: -4, bend: -10, headTilt: -6, sway: 4, bounce: 0.01 },
  tired: { swing: 14, knee: 14, arm: 6, elbow: 6, lean: 10, bend: 16, headTilt: 12 },
  run: { swing: 40, knee: 95, arm: 45, elbow: 0, forearm: 90, lean: 16, bend: 6, bounce: 0.05, squash: 0.06 },
  shove: { swing: 18, knee: 28, arm: 0, elbow: 0, lean: 0 }
}, Zg = 40;
function mo(t) {
  return t === void 0 ? Lt.walk : typeof t == "string" ? Lt[t] ?? Lt.walk : t;
}
function Qg(t, e, n = ct, s = 1) {
  const o = mo(t);
  if (o === Lt.walk) return em(e, n, s);
  const i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (b) => Math.abs(b) <= Zg, c = o.shoulder ?? 0, h = (b, T) => l(b) ? T * c + o.arm * r : b, u = o.forearm ?? 0, f = l(n.leftShoulder) ? n.leftElbow - u - o.elbow * Math.max(0, -r) : n.leftElbow, d = l(n.rightShoulder) ? n.rightElbow + u + o.elbow * Math.max(0, r) : n.rightElbow, g = o.bounces ?? 1, p = (1 + Math.cos(i * 2 * g)) / 2, m = o.crouch ?? 0;
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
function Ri(t, e, n = 1) {
  const s = mo(t), o = Lt.walk.swing, i = (r) => Math.sin(r * Math.PI / 180);
  return nm(e, n) * i(s.swing * n) / i(o * n);
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
function Ot(t) {
  return { ...ct, ...t };
}
const Lh = {
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
}, It = (t) => ({ ...Lh, ...t }), bt = {
  neutral: Lh,
  happy: It({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: It({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: It({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: It({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: It({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: It({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: It({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: It({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: It({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: It({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: It({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: It({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: It({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: It({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: It({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: It({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: It({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function He(t, e) {
  return { ...t, ...typeof e == "string" ? bt[e] : e };
}
const Xt = {
  rest: ct,
  wave: Ot({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...bt.happy }),
  cheer: Ot({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...bt.joyful }),
  shrug: Ot({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...bt.confused, lookX: 0, lookY: 0 }),
  point: Ot({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: Ot({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...bt.thinking }),
  handsOnHips: Ot({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: Ot({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...bt.sad }),
  surprised: Ot({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...bt.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: Ot({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: Ot({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: Ot({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...bt.joyful }),
  // Ducking: squashed low, bent over, arms over the head.
  duck: Ot({ stretch: 0.62, bend: 28, headTilt: -8, leftShoulder: 150, rightShoulder: 150, leftElbow: 130, rightElbow: 130, leftHip: 25, rightHip: 25, ...bt.scared }),
  // Lying on its back on the floor (rolled back about the hips and lowered), hands behind the head.
  lie: Ot({ spin: -90, rise: -0.42, leftShoulder: 165, rightShoulder: 165, leftElbow: 150, rightElbow: 150, ...bt.sleepy }),
  // Full splits: legs flat along the floor, so the planted feet bring the hips right down to it.
  // Side (straddle) split, seen front-on: each leg straight out to its side, toes pointed.
  sideSplit: Ot({ leftHip: 90, rightHip: 90, leftAnkle: -45, rightAnkle: -45, leftShoulder: 120, rightShoulder: 120, leftElbow: 10, rightElbow: 10, ...bt.happy }),
  // Front split, in profile: the left leg forward (+x), the right leg back.
  frontSplit: Ot({ turn: 1, leftHip: -90, rightHip: -90, leftAnkle: -45, rightAnkle: -45, leftShoulder: -150, rightShoulder: 150, leftElbow: 10, rightElbow: -10, ...bt.happy })
}, Wh = Object.keys(ct);
function Xn(t, e, n) {
  const s = { ...t };
  for (const o of Wh) s[o] = t[o] + (e[o] - t[o]) * n;
  return s;
}
const Li = 24, nl = 4, sl = 28, tm = 40;
function em(t, e = ct, n = 1) {
  const s = Math.sin(t * Math.PI * 2) * n, o = Math.cos(t * Math.PI * 2) * n, i = (c) => Math.abs(c) <= tm, r = (c) => i(c) ? 22 * s : c, a = i(e.leftShoulder) ? e.leftElbow - sl * Math.max(0, -s) : e.leftElbow, l = i(e.rightShoulder) ? e.rightElbow + sl * Math.max(0, s) : e.rightElbow;
  return {
    ...e,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: e.lean + nl * n,
    headTilt: e.headTilt - nl * 0.5 * n,
    leftElbow: a,
    rightElbow: l,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Li * s,
    rightHip: -Li * s,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, o),
    rightKnee: 30 * Math.max(0, -o),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: r(e.leftShoulder),
    rightShoulder: r(e.rightShoulder)
  };
}
function nm(t, e = 1) {
  return 4 * ((Wi + Xs) * t) * Math.sin(Li * e * Math.PI / 180);
}
function sm(t) {
  const e = Math.abs(Math.sin(t / 65)), n = 0.55 + 0.45 * Math.sin(t / 310);
  return e * n;
}
const Fh = 0.12, ol = 0.46, om = 1 - 2 * Fh, im = 0.1, rm = 0.21, am = 0.19, Wi = 0.24, Xs = 0.22, Dh = 0.12, lm = 0.14, Nh = 0.33, il = 0.7, rl = 0.3, cm = 0.35, hm = [1.7, 1.05], um = [1.3, 0.75], al = [1.45, 0.85], fm = [1.15, 0.75], ll = 0.06, dm = 0.7, pm = 0.65, Bh = 0.075, gm = 0.3, mm = 0.02, ym = 0.012, bm = 12, wm = 0.25, us = 90, km = 0.25, vm = 0.04, jh = 0.01, Ce = (t) => Math.min(1, Math.max(0, t ?? 0));
function Ev(t, e = 1) {
  return Xs * t * e;
}
const Fi = -0.12, qh = 0.4, Kt = (t) => t * Math.PI / 180, Mm = (t, e) => ({ x: e * Math.sin(Kt(t)), y: Math.cos(Kt(t)) }), Yh = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), Kh = (t, e, n, s) => t - 0.3 * e - n * 0.14 * e - Math.max(0, s - 1) * 0.12 * e;
function xm(t, e, n, s, o, i) {
  const r = Math.max(1, Math.min(i * 0.6, lm * n)), a = Ce(e.turn), l = (Dh + Nh * a) * n, c = s + Fi * n, h = l + e.lookX * 0.08 * n, u = e.lookY * 0.07 * n, f = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - il * a), squeeze: 1 - il * a, open: e.leftEye, brow: e.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - rl * a), squeeze: 1 - rl * a, open: e.rightEye, brow: e.rightBrow, side: 1 }
  ];
  t.fillStyle = o, t.strokeStyle = o, t.lineWidth = r;
  for (const b of f) {
    const T = Yh(b.open, e.blink);
    if (T < 0.2) {
      const v = e.smile > 0.5 ? -0.12 * n : 0.06 * n;
      t.beginPath(), t.moveTo(b.x + l - 0.12 * n, c), t.quadraticCurveTo(b.x + l, c + v, b.x + l + 0.12 * n, c), t.stroke();
    } else {
      if (T > 1.2) {
        const x = 0.13 * n * T;
        t.beginPath(), t.ellipse(b.x + l, c, x * 0.85, x, 0, 0, Math.PI * 2), t.fillStyle = "#ffffff", t.fill(), t.stroke(), t.fillStyle = o;
      }
      const v = T > 1.2 ? 0.075 * n : 0.1 * n;
      t.beginPath(), t.ellipse(b.x + h, c + u, v, v * 1.1 * Math.min(T, 1), 0, 0, Math.PI * 2), t.fill();
    }
    const k = Kh(c, n, b.brow, T), y = b.x + l - b.side * 0.13 * n * b.squeeze, S = b.x + l + b.side * 0.13 * n * b.squeeze;
    t.beginPath(), t.moveTo(S, k), t.lineTo(y, k - e.browTilt * 0.1 * n), t.stroke();
  }
  const d = s + qh * n, g = 0.25 * n * Math.max(0.3, e.mouthWidth) * (1 - cm * a), p = Math.min(1, Math.max(0, e.mouth));
  if (t.beginPath(), p <= 0.05) {
    t.moveTo(l - g, d), t.quadraticCurveTo(l, d + e.smile * 0.25 * n, l + g, d), t.stroke();
    return;
  }
  const m = 0.3 * n * p;
  e.smile > 0.3 ? (t.moveTo(l - g, d - 0.05 * n), t.lineTo(l + g, d - 0.05 * n), t.quadraticCurveTo(l, d + m * 2, l - g, d - 0.05 * n)) : e.smile < -0.3 ? (t.moveTo(l - g, d + m * 0.6), t.lineTo(l + g, d + m * 0.6), t.quadraticCurveTo(l, d - m * 1.4, l - g, d + m * 0.6)) : t.ellipse(l, d, g * 0.8, m, 0, 0, Math.PI * 2), t.fill();
}
function zh(t, e) {
  const n = e.height ?? 300, s = Math.min(3, Math.max(0.3, t.stretch ?? 1)), o = Math.sqrt(s), i = (e.headSize ?? 2 * Fh) / 2, r = e.headSize === void 0 ? om : 1 - 2 * i, a = i * n, l = Ce(t.sit), c = t.leftHip + (-us - t.leftHip) * l, h = t.leftKnee + (-us - t.leftKnee) * l, u = t.rightHip + (us - t.rightHip) * l, f = t.rightKnee + (us - t.rightKnee) * l, d = e.classic === !0, g = Ce(t.turn), p = (Y, j, _, L, F) => {
    const P = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, Math.abs(Kt(j - _) / 2) + Kt(L))), R = Math.max(-1, Math.min(1, dm + F)), X = g + (1 - g) * Y * R;
    return d ? { x: 0, y: 0 } : { x: Math.cos(P) * ll * X, y: Math.sin(P) * ll };
  }, m = { left: t.leftAnkle ?? 0, right: t.rightAnkle ?? 0 }, b = { left: t.leftFootOut ?? 0, right: t.rightFootOut ?? 0 };
  let T = 0;
  if (l > 0 || !d) {
    const Y = (F, P, R, X, Q) => Wi * Math.cos(Kt(P)) + Xs * Math.cos(Kt(P - R)) + Math.max(0, p(F, P, R, X, Q).y), j = Math.max(
      Y(-1, c, h, m.left, b.left),
      Y(1, u, f, m.right, b.right)
    ), _ = 1 - Ce((t.rise ?? 0) / vm), L = (d ? Math.min(1, l / km) : 1) * _;
    T = (ol - j) * L * n * s;
  }
  const k = -ol * n * s + T, y = -r * n * s + T, S = d ? 0 : (mm * Ce(t.turn) + ym * l) * n * s, v = Kt(t.bend ?? 0), x = { end: hl(k, y, v, 1), bend: v };
  let M;
  if (v !== 0) {
    M = [];
    for (let Y = 0; Y <= cl; Y++) {
      const j = Y / cl, _ = hl(k, y, v, j);
      M.push({ x: _.x - S * Math.sin(Math.PI * j), y: _.y });
    }
  } else
    M = S === 0 ? [{ x: 0, y: k }, { x: 0, y }] : gn({ x: 0, y: k }, { x: -S, y: (k + y) / 2 }, { x: 0, y }, 1, 8);
  const w = y + im * n * s, $ = (e.shoulderWidth ?? 0) * n * Math.cos(g * Math.PI / 2), E = (Y, j, _, L, F) => {
    const P = Mm(_, L);
    return { x: Y + P.x * F * n, y: j + P.y * F * n };
  }, A = (Y, j, _) => {
    const L = E(0, k, j, Y, Wi * s);
    return { root: { x: 0, y: k }, joint: L, end: E(L.x, L.y, j - _, Y, Xs * s) };
  }, H = (Y, j, _) => {
    const L = { x: Y * $, y: w }, F = E(L.x, L.y, j, Y, rm * o);
    return { root: L, joint: F, end: E(F.x, F.y, j + _, Y, am * o) };
  }, I = { left: A(-1, c, h), right: A(1, u, f) }, C = (Y, j, _, L, F, P) => {
    const R = p(Y, _, L, F, P);
    return { x: j.end.x + R.x * n * s, y: j.end.y + R.y * n * s };
  }, W = (Y, j, _, L, F) => E(j.end.x, j.end.y, _ + L + F, Y, Bh * o), D = {
    left: H(-1, t.leftShoulder, t.leftElbow),
    right: H(1, t.rightShoulder, t.rightElbow)
  };
  return {
    height: n,
    facing: (e.facing ?? 1) < 0 ? -1 : 1,
    stretch: s,
    lineWidth: e.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(d ? 0 : gm, e.rubber ?? 0)),
    r: a,
    // The head keeps its area: taller and narrower when stretched.
    headRx: a / Math.sqrt(s),
    headRy: a * Math.sqrt(s),
    hipY: k,
    neckY: y,
    drop: T,
    lean: d ? t.lean : t.lean + bm * Math.sin(Math.PI * l),
    classic: d,
    legs: I,
    toes: {
      left: C(-1, I.left, c, h, m.left, b.left),
      right: C(1, I.right, u, f, m.right, b.right)
    },
    spine: M,
    chest: x,
    arms: D,
    handTips: {
      left: W(-1, D.left, t.leftShoulder, t.leftElbow, t.leftWrist ?? 0),
      right: W(1, D.right, t.rightShoulder, t.rightElbow, t.rightWrist ?? 0)
    }
  };
}
const cl = 10;
function hl(t, e, n, s) {
  const o = t - e, i = n * s;
  if (Math.abs(n) < 1e-9) return { x: 0, y: t - o * s };
  const r = o / n;
  return { x: r * (1 - Math.cos(i)), y: t - r * Math.sin(i) };
}
function Sm(t, e) {
  if (t.chest.bend === 0) return e;
  const n = Un(e, { x: 0, y: t.neckY }, t.chest.bend);
  return { x: n.x + t.chest.end.x, y: n.y + t.chest.end.y - t.neckY };
}
const Cn = (t, e) => e === 0 ? [t.root, t.joint, t.end] : gn(t.root, t.joint, t.end, e);
function Un(t, e, n) {
  const s = Math.cos(n), o = Math.sin(n), i = t.x - e.x, r = t.y - e.y;
  return { x: e.x + i * s - r * o, y: e.y + i * o + r * s };
}
function Xh(t, e, n = !0) {
  const s = Em(t, e), o = e.spin ?? 0, i = e.rise ?? 0;
  return n && (o !== 0 || i !== 0) ? Tm(s, t, o, i) : s;
}
function Uh(t, e, n) {
  return { pivot: { x: 0, y: t.hipY }, angle: t.facing * Kt(e), lift: n * t.height };
}
function Tm(t, e, n, s) {
  const { pivot: o, angle: i, lift: r } = Uh(e, n, s), a = (f) => {
    const d = Un(f, o, i);
    return { x: d.x, y: d.y - r };
  }, l = (f) => ({ left: a(f.left), right: a(f.right) }), c = { left: Math.max(a(t.feet.left).y, a(t.toes.left).y), right: Math.max(a(t.feet.right).y, a(t.toes.right).y) }, h = Math.max(c.left, c.right), u = jh * e.height;
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
function Em(t, e) {
  const n = Kt(t.lean), s = Kt(e.headTilt), o = { x: 0, y: t.hipY }, i = (y) => ({ x: t.facing * y.x, y: y.y }), r = (y) => i(Un(y, o, n)), a = (y) => r(Sm(t, y)), l = (y) => a(Un({ x: y.x, y: y.y + t.neckY }, { x: 0, y: t.neckY }, s)), c = Cn(t.arms.left, t.rubber).map(a), h = Cn(t.arms.right, t.rubber).map(a), u = (y, S) => Math.atan2(S.y - y.y, S.x - y.x), f = { left: a(t.handTips.left), right: a(t.handTips.right) }, d = (y, S) => {
    const [v, x] = y.slice(-2), M = t.arms[S], w = u(a(M.end), f[S]) - u(a(M.joint), a(M.end));
    return u(v, x) + w;
  };
  let g = 1 / 0;
  for (const [y, S] of [
    [e.leftBrow, e.leftEye],
    [e.rightBrow, e.rightEye]
  ]) {
    const v = Kh(Fi, 1, y, Yh(S, e.blink));
    g = Math.min(g, v, v - e.browTilt * 0.1);
  }
  const p = { left: i(t.legs.left.end), right: i(t.legs.right.end) }, m = { left: i(t.toes.left), right: i(t.toes.right) }, b = { left: Math.max(p.left.y, m.left.y), right: Math.max(p.right.y, m.right.y) }, T = Math.max(b.left, b.right), k = jh * t.height;
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
    feetY: T,
    grounded: { left: b.left >= T - k, right: b.right >= T - k },
    fingertips: f,
    handAngle: { left: d(c, "left"), right: d(h, "right") },
    limbs: {
      leftArm: c,
      rightArm: h,
      leftLeg: Cn(t.legs.left, t.rubber).map(i),
      rightLeg: Cn(t.legs.right, t.rubber).map(i),
      spine: t.spine.map(r)
    },
    head: {
      center: l({ x: 0, y: -t.headRy }),
      rx: t.headRx,
      ry: t.headRy,
      // Mirroring a turn reverses it.
      angle: t.facing * (n + t.chest.bend + s),
      eyeY: Fi,
      browTopY: g,
      mouthY: qh,
      faceX: t.facing * (Dh + Nh * Ce(e.turn))
    }
  };
}
function Pe(t, e = {}) {
  return Xh(zh(t, e), t);
}
function Av(t, e, n) {
  return Un({ x: t.center.x + e * t.rx, y: t.center.y + n * t.ry }, t.center, t.angle);
}
function Am(t, e, n) {
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
function $m(t, e, n = {}, s = 0) {
  const o = zh(e, n), i = n.color ?? "#1e293b", r = n.layers ?? {}, a = n.layers ? Xh(o, e, !1) : void 0, l = n.sketch ? Oi(t, n.sketch, s) : void 0, c = n.sketch && n.layers ? Oi(t, n.sketch, s) : void 0, h = (x) => {
    t.save(), x(), t.restore();
  }, u = (x) => {
    x && a && h(() => x(t, a, s, c));
  }, f = () => t.scale(o.facing, 1), d = () => {
    f(), t.translate(0, o.hipY), t.rotate(Kt(o.lean)), t.translate(0, -o.hipY);
  }, g = () => {
    d(), o.chest.bend !== 0 && (t.translate(o.chest.end.x, o.chest.end.y), t.rotate(o.chest.bend), t.translate(0, -o.neckY));
  }, p = (x, M, w) => {
    if (l) return M ? l.curve(x) : l.line(x);
    if (o.classic) {
      t.beginPath(), t.moveTo(x[0].x, x[0].y);
      for (const $ of x.slice(1)) t.lineTo($.x, $.y);
      t.stroke();
      return;
    }
    Mr(t, x, w[0] * o.lineWidth, w[1] * o.lineWidth);
  }, m = (x, M) => p(Cn(x, o.rubber), o.rubber > 0, M), b = (x) => {
    o.classic || p([o.legs[x].end, o.toes[x]], !1, fm);
  }, T = (x) => {
    if (n.hands && !o.classic) return y(x);
    if (o.classic || l) return;
    const M = o.arms[x].end;
    t.beginPath(), t.arc(M.x, M.y, pm * o.lineWidth, 0, Math.PI * 2), t.fill();
  };
  t.save(), t.strokeStyle = i, t.fillStyle = i, t.lineWidth = o.lineWidth, t.lineCap = "round", t.lineJoin = "round";
  const k = Uh(o, e.spin ?? 0, e.rise ?? 0);
  (k.angle !== 0 || k.lift !== 0) && (t.translate(0, -k.lift), t.translate(k.pivot.x, k.pivot.y), t.rotate(k.angle), t.translate(-k.pivot.x, -k.pivot.y));
  function y(x) {
    const M = n.hands ?? {}, w = o.arms[x].end, $ = o.handTips[x], E = n.headFill ?? "#ffffff";
    xr(t, w, M[x] ?? $t, {
      side: x,
      // Degrees clockwise from straight up, in the frame the hand is drawn in.
      angle: Math.atan2($.x - w.x, w.y - $.y) * 180 / Math.PI,
      size: (M.size ?? Bh) * o.height * Math.sqrt(o.stretch),
      skin: M.skin ?? (E === "none" ? void 0 : E),
      ink: i,
      lineWidth: o.lineWidth * 0.45,
      fingers: M.fingers,
      plump: M.plump,
      look: n.sketch ? "pencil" : "clean",
      seed: n.sketch?.seed
    }, s);
  }
  const S = (x) => {
    h(() => {
      g(), m(o.arms[x], um), T(x);
    });
    const M = r.sleeve;
    M && a && h(() => M(t, a, x, s, c));
  }, v = Ce(e.turn) > wm;
  u(r.behind), h(() => {
    f(), m(o.legs.left, al), b("left"), m(o.legs.right, al), b("right");
  }), v && S("left"), h(() => {
    d(), p(o.spine, o.spine.length > 2, hm);
  }), h(() => {
    g();
    const { left: x, right: M } = { left: o.arms.left.root, right: o.arms.right.root };
    if (x.x !== M.x)
      if (o.classic) p([x, M], !1, [1, 1]);
      else {
        const w = { x: (x.x + M.x) / 2, y: x.y - 0.3 * Math.abs(M.x - x.x) };
        p(gn(x, w, M, 1, 8), !0, [1.1, 1.1]);
      }
  }), u(r.body), v || S("left"), S("right"), u(r.behindHead), h(() => {
    g(), t.translate(0, o.neckY), t.rotate(Kt(e.headTilt));
    const x = -o.headRy;
    t.beginPath(), t.ellipse(0, x, o.headRx, o.headRy, 0, 0, Math.PI * 2);
    const M = n.headFill ?? "#ffffff";
    if (M !== "none" && (t.fillStyle = M, t.fill()), l) {
      l.ellipse(0, x, o.headRx, o.headRy);
      const w = l.nudge();
      t.translate(w.x, w.y);
    } else
      t.stroke();
    t.translate(0, x), t.scale(o.headRx / o.r, o.headRy / o.r), xm(t, e, o.r, 0, i, o.lineWidth);
  }), u(r.overHead), u(r.front), t.restore(), n.label && (t.save(), t.fillStyle = i, t.font = n.labelFont ?? `700 ${Math.round(o.height * 0.11)}px sans-serif`, t.textAlign = "center", t.textBaseline = "bottom", t.fillText(n.label, 0, -o.height * o.stretch - 0.04 * o.height + o.drop), t.restore());
}
function Gh(t, e, n, s) {
  const o = { ...t }, i = t.gait && s?.[t.gait] || t.gait;
  let r = t.walking > 0 ? Xn(o, Qg(i, t.walk, o), t.walking) : o, a = Im(t);
  const l = t.dancing ?? 0;
  if (n && l > 0) {
    const c = n(t.beat ?? 0);
    if (r = Xn(r, c.pose, l), c.hands) {
      const h = (u, f) => f ? zn(u ?? $t, f, l) : u;
      a = { left: h(a?.left, c.hands.left), right: h(a?.right, c.hands.right) };
    }
  }
  return t.talk > 0 && (r = { ...r, mouth: Math.max(r.mouth, t.talk * sm(e)) }), { pose: r, hands: a };
}
function Pm(t, e, n, s) {
  return Gh(t, e, n, s).pose;
}
const Vh = (t, e) => (t.facing ?? e.facing ?? 1) < 0 ? -1 : 1, Us = (t, e) => `hand.${t}.${e}`;
function Im(t) {
  const e = (o) => {
    if (typeof t[Us(o, "spread")] == "number")
      return Object.fromEntries(Object.keys($t).map((i) => [i, t[Us(o, i)]]));
  }, n = e("left"), s = e("right");
  return n || s ? { left: n, right: s } : void 0;
}
function Om(t, e) {
  return !e || !t.hands ? t : { ...t, hands: { ...t.hands, left: e.left ?? t.hands.left, right: e.right ?? t.hands.right } };
}
function Jh(t) {
  const e = t.style ?? {}, n = e.height ?? 300, s = n * 0.8, o = { ...Ot(t.pose ?? {}), walk: 0, walking: 0, gait: "walk", facing: (e.facing ?? 1) < 0 ? -1 : 1, talk: 0, rubber: e.rubber ?? 0, beat: 0, dancing: 0 }, i = {};
  if (e.hands)
    for (const r of ["left", "right"]) {
      const a = e.hands[r] ?? $t;
      for (const l of Object.keys($t)) i[Us(r, l)] = a[l] ?? $t[l];
    }
  return {
    type: "custom",
    x: t.x - s / 2,
    y: t.y - n,
    width: s,
    height: n,
    props: { ...o, ...i },
    about: _m(Object.keys(i), t.cast),
    figureStyle: e,
    figureDance: t.dance,
    figureGaits: t.cast?.gaits,
    draw(r, a, l) {
      const c = a.props, h = Gh(c, l, t.dance, t.cast?.gaits);
      r.translate(s / 2, n), $m(r, h.pose, Om({ ...e, rubber: c.rubber, facing: Vh(c, e) }, h.hands), l);
    }
  };
}
function _m(t, e) {
  const n = { ...Oh, ..._h };
  for (const s of t) {
    const [, o, ...i] = s.split("."), r = Hh[i.join(".")];
    r && (n[s] = { ...r, description: `${o === "left" ? "Left" : "Right"} hand: ${r.description.toLowerCase()}` });
  }
  return {
    kind: "stick figure",
    summary: "A poseable stick figure: pose it with joint tracks, or give it beats (`scriptTracks`) that compile into acted tracks.",
    props: n,
    // Read when asked: the list is registered by the acting module (see figure-actions).
    get actions() {
      return Sg(e);
    }
  };
}
function Zh(t, e, n) {
  const s = t.figureStyle;
  if (!s) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const o = { ...t.props };
  let i = 0, r = 0;
  for (const [c, h] of e.state?.values.get(n) ?? [])
    c === "gait" && typeof h == "string" && (o.gait = h), typeof h == "number" && (c === "x" || c === "motionPathX" ? i = h : c === "y" || c === "motionPathY" ? r = h : c in o && (o[c] = h));
  const a = Pm(o, e.time, t.figureDance, t.figureGaits), l = Pe(a, { ...s, rubber: o.rubber, facing: Vh(o, s) });
  return { pose: a, joints: Am(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function Sr(t) {
  const e = [];
  return t.forEach((n, s) => {
    const o = s === 0 ? ct : e[s - 1], i = typeof n.pose == "string" ? Xt[n.pose] : { ...o, ...n.pose };
    e.push(n.expression ? He(i, n.expression) : i);
  }), e;
}
function $v(t, e) {
  const n = Sr(e);
  return Wh.filter((s) => n.some((o) => o[s] !== ct[s])).map((s) => ({
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
const Ko = 0.5, Di = {
  /** Flag: fingers together and straight, thumb bent in */
  pataka: At({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Pataka with the ring finger bent */
  tripataka: At({ "thumb.curl": 0.3, "thumb.across": 0.6, "index.curl": 0, "middle.curl": 0, "ring.curl": 1, "pinky.curl": 0, spread: 0, turn: 2 }),
  /** Lotus in bloom: fingers fanned, each a little more curled than the last */
  alapadma: At({ "thumb.curl": 0.1, "thumb.across": 0, "index.curl": 0.05, "middle.curl": 0.15, "ring.curl": 0.25, "pinky.curl": 0.35, spread: 1, turn: 2 }),
  /** Fist */
  mushti: _t.fist,
  /** Fist, thumb up */
  shikhara: _t.thumbsUp,
  /** Swan's beak: thumb and index touch, the others fanned */
  hamsasya: At({ "thumb.curl": 0.15, "thumb.across": 0.6, "index.curl": 0.6, "middle.curl": 0, "ring.curl": 0, "pinky.curl": 0, spread: 0.7, turn: 2 }),
  /** Bracelet: thumb, index and middle meet, ring and little finger out */
  katakamukha: At({ "thumb.curl": 0.2, "thumb.across": 0.6, "index.curl": 0.65, "middle.curl": 0.7, "ring.curl": 0, "pinky.curl": 0, spread: 0.4, turn: 2 })
};
function Gs(t) {
  return typeof t != "string" ? t : t in Di ? Di[t] : _t[t];
}
function Qh(t, e, n) {
  const s = [];
  for (const o of t.keys) {
    const i = s[s.length - 1], r = !i || o.reset ? { pose: e, ...n } : i;
    s.push({
      beat: o.beat,
      pose: { ...r.pose, ...o.pose },
      left: o.hands?.left ? Gs(o.hands.left) : r.left,
      right: o.hands?.right ? Gs(o.hands.right) : r.right,
      easing: o.easing ?? t.easing
    });
  }
  return s;
}
const Tr = (t, e) => (t % e + e) % e;
function Hm(t, e, n, s) {
  const o = Qh(t, n, s);
  if (o.length === 0) return { pose: n, hands: s };
  const i = Tr(e, t.beats);
  let r = o.length - 1;
  for (let d = 0; d < o.length; d++) o[d].beat <= i && (r = d);
  const a = o[r], l = o[(r + 1) % o.length], c = a.beat <= i ? a.beat : a.beat - t.beats, h = l.beat > c ? l.beat : l.beat + t.beats, u = h > c ? (i - c) / (h - c) : 0, f = Ht(l.easing ?? "ease-in-out")(Math.min(1, Math.max(0, u)));
  return {
    pose: Xn(a.pose, l.pose, f),
    hands: { left: zn(a.left, l.left, f), right: zn(a.right, l.right, f) }
  };
}
const Cm = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
  ["leftFootOut", "rightFootOut"],
  ["leftEye", "rightEye"],
  ["leftBrow", "rightBrow"]
], Rm = ["lean", "headTilt", "lookX", "spin"], Lm = /* @__PURE__ */ new Set(["leftShoulder", "rightShoulder", "leftElbow", "rightElbow", "leftWrist", "rightWrist", "leftHip", "rightHip", "leftKnee", "rightKnee"]);
function Wm(t) {
  const e = { ...t }, n = (t.turn ?? 0) >= 0.5;
  for (const [s, o] of Cm) {
    const i = n && Lm.has(s) ? -1 : 1;
    e[s] = i * t[o], e[o] = i * t[s];
  }
  if (!n) for (const s of Rm) e[s] = -t[s];
  return e;
}
const Fm = (t) => Math.min(1, Math.max(-1, (0.5 - t) * 4));
function Dm(t, e, n) {
  const s = Tr(n, 1), o = (1 + Math.cos(2 * Math.PI * s)) / 2, i = e.bounce * (e.accent === "up" ? 1 - o : o), r = Math.min(1, Math.max(0, t.turn ?? 0)), a = Fm(r);
  return {
    ...t,
    leftHip: t.leftHip + a * i / 2,
    rightHip: t.rightHip + i / 2,
    leftKnee: t.leftKnee + a * i,
    rightKnee: t.rightKnee + i,
    lean: t.lean + (e.sway ?? 0) * (1 - r) * Math.sin(Math.PI * n)
  };
}
function Ni(t) {
  const e = { ...ct, ...t.stance };
  return t.expression ? He(e, t.expression) : e;
}
function t0(t) {
  return {
    left: t.hands?.left ? Gs(t.hands.left) : $t,
    right: t.hands?.right ? Gs(t.hands.right) : $t
  };
}
function zo(t, e, n) {
  const s = t.moves[e.move];
  if (!s) throw new Error(`dance: "${t.label}" has no move "${e.move}"`);
  const o = Hm(s, n, Ni(t), t0(t));
  return e.mirror ? { pose: Wm(o.pose), hands: { left: o.hands?.right, right: o.hands?.left } } : o;
}
function Er(t, e, n = {}) {
  const s = typeof t == "string" ? Xe[t] : t;
  let o;
  if (n.move)
    o = zo(s, { move: n.move, mirror: n.mirror }, e);
  else {
    const i = s.routine, r = i.reduce((u, f) => u + f.beats, 0), a = Tr(e, r);
    let l = 0, c = 0;
    for (; c < i.length - 1 && a >= l + i[c].beats; ) l += i[c++].beats;
    const h = a - l;
    if (o = zo(s, i[c], h), h < Ko && i.length > 1 && e >= Ko) {
      const u = i[(c - 1 + i.length) % i.length], f = zo(s, u, u.beats + h), d = Ht("ease-in-out")(h / Ko);
      o = {
        pose: Xn(f.pose, o.pose, d),
        hands: { left: zn(f.hands.left, o.hands.left, d), right: zn(f.hands.right, o.hands.right, d) }
      };
    }
  }
  return { ...o, pose: Dm(o.pose, s.groove, e) };
}
function Pv(t, e, n = {}) {
  return Er(t, e, n).pose;
}
function Ar(t) {
  return (typeof t == "string" ? Xe[t] : t).routine.reduce((n, s) => n + s.beats, 0);
}
const Nm = { leftToe: "rightToe", rightToe: "leftToe", leftHeel: "rightHeel", rightHeel: "leftHeel" };
function ul(t, e, n, s, o, i, r) {
  for (let a = 0; a * t.beats < n; a++)
    for (const l of t.keys) {
      const c = a * t.beats + l.beat, h = e + c;
      if (!(c >= n || h < i || h >= r))
        for (const u of l.taps ?? []) o.push({ beat: h, tap: s ? Nm[u] : u });
    }
}
function Iv(t, e, n, s = {}) {
  const o = typeof t == "string" ? Xe[t] : t, i = [];
  if (n <= e) return i;
  if (s.move) {
    const r = o.moves[s.move], a = Math.floor(e / r.beats) * r.beats;
    ul(r, a, Math.ceil((n - a) / r.beats) * r.beats, s.mirror, i, e, n);
  } else {
    const r = Ar(o);
    for (let a = Math.floor(e / r) * r; a < n; a += r) {
      let l = a;
      for (const c of o.routine)
        ul(o.moves[c.move], l, c.beats, c.mirror, i, e, n), l += c.beats;
    }
  }
  return i.sort((r, a) => r.beat - a.beat);
}
function fl(t, e) {
  const n = t.moves[e.move];
  if (!n?.travel) return 0;
  const s = n.travel / n.beats;
  return e.mirror ? (Qh(n, Ni(t), t0(t))[0]?.pose.turn ?? Ni(t).turn ?? 0) >= 0.5 ? s : -s : s;
}
function e0(t, e) {
  return e.move ? [{ move: e.move, beats: t.moves[e.move].beats, mirror: e.mirror }] : t.routine;
}
function Xo(t, e, n = {}) {
  const s = typeof t == "string" ? Xe[t] : t, o = e0(s, n), i = o.reduce((h, u) => h + u.beats, 0), r = o.reduce((h, u) => h + fl(s, u) * u.beats, 0), a = Math.floor(e / i);
  let l = a * r, c = e - a * i;
  for (const h of o) {
    const u = Math.min(h.beats, c);
    if (l += fl(s, h) * u, c -= u, c <= 0) break;
  }
  return l;
}
function Bm(t, e, n) {
  const s = e0(t, n), o = [0];
  let i = 0;
  for (let r = 0; i < e; r = (r + 1) % s.length)
    i += s[r].beats, o.push(Math.min(i, e));
  return o;
}
const jm = 8;
function qm(t, e, n) {
  const s = typeof e == "string" ? Xe[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : Ar(s)), r = Bm(s, i, n);
  if (r.every((b) => Xo(s, b, n) === 0)) return;
  const a = Math.min(n.fade ?? 1, i / 2), l = Ht("ease-in-out"), c = (b) => a <= 0 ? 1 : Math.min(l(Math.min(1, b / a)), l(Math.min(1, (i - b) / a))), h = Math.ceil(a * jm), u = a <= 0 ? [] : Array.from({ length: h + 1 }, (b, T) => [T / h * a, i - T / h * a]).flat(), f = [.../* @__PURE__ */ new Set([...r, ...u])].sort((b, T) => b - T);
  let d = 0;
  const g = f.map((b, T) => {
    if (T > 0) {
      const k = f[T - 1], y = Math.max(1, Math.ceil((b - k) * 16));
      for (let S = 0; S < y; S++) {
        const v = k + (b - k) * S / y, x = k + (b - k) * (S + 1) / y;
        d += (Xo(s, x, n) - Xo(s, v, n)) * c((v + x) / 2);
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
function Ov(t, e, n = 0) {
  return (t - n) * e / 6e4;
}
function _v(t, e = {}) {
  return (n) => Er(t, n, e);
}
function Hv(t, e) {
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
function Cv(t, e, n = {}) {
  const s = typeof e == "string" ? Xe[e] : e, o = n.bpm ?? s.bpm, i = n.beats ?? (n.move ? s.moves[n.move].beats : Ar(s)), r = n.samplesPerBeat ?? 4, a = n.start ?? 0, l = Math.round(i * r), c = Array.from({ length: l + 1 }, (p, m) => {
    const b = m / r;
    return { time: a + b * 6e4 / o, frame: Er(s, b, n) };
  }), h = (p, m) => ({
    id: `${t}-${p}`,
    target: t,
    property: p,
    keyframes: c.map((b) => ({ time: b.time, value: m(b.frame) }))
  }), f = Object.keys(ct).filter((p) => c.some((m) => m.frame.pose[p] !== c[0].frame.pose[p]) || c[0].frame.pose[p] !== ct[p]).map((p) => h(p, (m) => m.pose[p])), d = n.height === void 0 ? void 0 : qm(t, s, { ...n, bpm: o, beats: i, start: a, height: n.height, fade: 0 });
  if (d && f.push(d), n.hands === !1) return f;
  const g = [];
  for (const p of ["left", "right"])
    for (const m of Object.keys($t)) {
      const b = (T) => T.hands?.[p]?.[m] ?? $t[m];
      c.some((T) => b(T.frame) !== $t[m]) && g.push(h(Us(p, m), b));
    }
  return [...f, ...g];
}
const Fn = { type: "back", mode: "out", overshoot: 1.1 }, Rt = "ease-out-cubic", Ym = {
  label: "Disco",
  bpm: 120,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 6, rightKnee: 6 },
  expression: { smile: 0.9, mouth: 0.15, leftBrow: 0.3, rightBrow: 0.3 },
  groove: { bounce: 10, accent: "down", sway: 2 },
  moves: {
    point: {
      label: "The point",
      beats: 2,
      easing: Rt,
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
        { beat: 0, pose: { lean: -10, rightHip: 22, leftHip: 4, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Rt },
        { beat: 1, pose: { lean: 0, rightHip: 10, leftHip: 10, leftShoulder: 168, rightShoulder: 168, leftElbow: 22, rightElbow: 22, leftWrist: 0, rightWrist: 0 }, hands: { left: "flat", right: "flat" } },
        { beat: 2, pose: { lean: 10, rightHip: 4, leftHip: 22, leftShoulder: 140, rightShoulder: 140, leftElbow: 0, rightElbow: 0, leftWrist: 20, rightWrist: 20 }, hands: { left: "spread", right: "spread" }, easing: Rt },
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
}, Km = {
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
}, zm = {
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
        { beat: 0, pose: { rightHip: -24, rightKnee: 10, leftHip: 10, leftShoulder: 80, leftElbow: 40, rightShoulder: 55, rightElbow: -50, lean: 6, headTilt: -6 }, easing: Rt },
        { beat: 1, reset: !0, pose: { leftHip: 18, rightHip: 18 } },
        { beat: 2, pose: { leftHip: -24, leftKnee: 10, rightHip: 10, rightShoulder: 80, rightElbow: 40, leftShoulder: 55, leftElbow: -50, lean: -6, headTilt: 6 }, easing: Rt },
        { beat: 3, reset: !0, pose: { leftHip: 18, rightHip: 18 } }
      ]
    },
    kick: {
      label: "Kick out",
      beats: 2,
      keys: [
        { beat: 0, pose: { rightHip: 72, rightKnee: 4, rightAnkle: -20, leftHip: 4, lean: -12, leftShoulder: 100, leftElbow: 20 }, easing: Rt },
        { beat: 1, reset: !0 }
      ]
    },
    freeze: {
      label: "B-boy stance",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 26, leftElbow: -122, rightShoulder: 22, rightElbow: -118, leftHip: 18, rightHip: 18, leftKnee: 6, rightKnee: 6, lean: -4, headTilt: 10, smile: 0.6, leftEye: 0.6, rightEye: 0.6 }, easing: Fn },
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
}, Xm = {
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
        hands: e === 0 ? { left: { ..._t.spread, turn: 2 }, right: { ..._t.spread, turn: 2 } } : void 0
      }))
    },
    kickBallChange: {
      label: "Kick ball change",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 88, rightKnee: 0, rightAnkle: 55, leftHip: 4, lean: -12, leftShoulder: 112, rightShoulder: 112, leftWrist: 15, rightWrist: 15 }, hands: { left: "flat", right: "flat" }, easing: Rt },
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
}, Um = {
  label: "K-pop",
  bpm: 125,
  stance: { leftHip: 9, rightHip: 9, leftKnee: 4, rightKnee: 4 },
  expression: "happy",
  groove: { bounce: 5, accent: "down" },
  moves: {
    pointCombo: {
      label: "Point combo",
      beats: 4,
      easing: Fn,
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
        { beat: 0, reset: !0, pose: { leftShoulder: 165, rightShoulder: 165, leftElbow: 46, rightElbow: 46, headTilt: -8, lean: -4 }, hands: { left: "cupped", right: "cupped" }, easing: Fn },
        { beat: 1, pose: { headTilt: 8, lean: 4 } },
        { beat: 2, reset: !0, pose: { rightShoulder: 32, rightElbow: 112, rightWrist: 10, leftShoulder: 20, leftElbow: -30, headTilt: 10, leftEye: 0, smile: 1 }, hands: { right: "pinch", left: "relaxed" }, easing: Fn },
        { beat: 3, pose: { headTilt: 4 } }
      ]
    },
    isolations: {
      label: "Isolations",
      beats: 2,
      easing: Rt,
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
}, Gm = {
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
        { beat: 0, reset: !0, pose: { rightShoulder: 160, rightElbow: 12, rightWrist: -15, leftShoulder: 40, leftElbow: -12, leftWrist: -45, lean: -4, rightHip: 16, lookX: 0.5, lookY: -0.6 }, hands: { right: { ..._t.cupped, roll: -30 }, left: { ..._t.flat, turn: 0 } } },
        { beat: 0.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ..._t.cupped, roll: 30 } } },
        { beat: 1, pose: { rightWrist: -15, rightElbow: 12, leftWrist: -45, lean: -4, rightHip: 16, leftHip: 6 }, hands: { right: { ..._t.cupped, roll: -30 } } },
        { beat: 1.5, pose: { rightWrist: 25, rightElbow: 22, leftWrist: 10, lean: 4, rightHip: 6, leftHip: 16 }, hands: { right: { ..._t.cupped, roll: 30 } } }
      ]
    },
    thumka: {
      label: "Thumka",
      beats: 2,
      keys: [
        { beat: 0, reset: !0, pose: { lean: -11, rightHip: 22, leftHip: 2, leftKnee: 14, rightShoulder: 45, rightElbow: -105, leftShoulder: 128, leftElbow: 18, leftWrist: 35, headTilt: 10, lookX: -0.5 }, hands: { right: "fist", left: { ..._t.open, turn: 2 } }, easing: Rt },
        { beat: 0.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } },
        { beat: 1, pose: { lean: -11, rightHip: 22, headTilt: 10 }, easing: Rt },
        { beat: 1.5, pose: { lean: -4, rightHip: 12, headTilt: 6 } }
      ]
    },
    flick: {
      label: "Cross and flick",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26 }, hands: { left: "fist", right: "fist" } },
        { beat: 1, pose: { leftShoulder: 132, rightShoulder: 132, leftElbow: 0, rightElbow: 0, leftWrist: 30, rightWrist: 30, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10, stretch: 1.03 }, hands: { left: "spread", right: "spread" }, easing: Rt },
        { beat: 2, pose: { leftShoulder: 22, rightShoulder: 22, leftElbow: -62, rightElbow: -62, leftWrist: 0, rightWrist: 0, leftHip: 16, rightHip: 16, leftKnee: 26, rightKnee: 26, stretch: 1 }, hands: { left: "fist", right: "fist" } },
        { beat: 3, pose: { leftShoulder: 62, rightShoulder: 62, leftElbow: 0, rightElbow: 0, leftWrist: 35, rightWrist: 35, leftKnee: 0, rightKnee: 0, leftHip: 10, rightHip: 10 }, hands: { left: "spread", right: "spread" }, easing: Rt }
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
}, Vm = {
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
}, Jm = { leftHip: 42, rightHip: 42, leftKnee: 82, rightKnee: 82, leftFootOut: 0.3, rightFootOut: 0.3 }, Zm = {
  label: "Bharatanatyam",
  bpm: 80,
  // Natyarambhe: arms out at shoulder height, hands raised in pataka.
  stance: { ...Jm, leftShoulder: 90, rightShoulder: 90, leftElbow: 0, rightElbow: 0, leftWrist: 75, rightWrist: 75 },
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
}, Qm = {
  label: "Charleston",
  bpm: 150,
  stance: { leftHip: 10, rightHip: 10, leftKnee: 10, rightKnee: 10, leftShoulder: 30, rightShoulder: 30, leftElbow: 20, rightElbow: 20 },
  expression: { mouth: 0.4, smile: 1, leftBrow: 0.5, rightBrow: 0.5 },
  hands: { left: { ..._t.spread, turn: 2 }, right: { ..._t.spread, turn: 2 } },
  groove: { bounce: 8, accent: "down" },
  moves: {
    basic: {
      label: "Kick forward, kick back",
      beats: 4,
      keys: [
        { beat: 0, reset: !0, pose: { rightHip: 48, rightKnee: 8, rightAnkle: 45, leftShoulder: 75, rightShoulder: 15, leftElbow: 30, rightElbow: -10, lean: -7, headTilt: -5 }, easing: Rt },
        { beat: 1, reset: !0 },
        { beat: 2, reset: !0, pose: { leftHip: 18, leftKnee: 85, leftAnkle: 35, rightShoulder: 75, leftShoulder: 15, rightElbow: 30, leftElbow: -10, lean: 7, headTilt: 5 }, easing: Rt },
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
}, t1 = {
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
        { beat: 1, pose: { rightShoulder: 135, leftShoulder: 125, leftElbow: 0, rightElbow: 0, leftWrist: 0, rightWrist: 30, rightKnee: 8, leftKnee: -8, rightHip: 4, leftHip: -4 }, hands: { left: { ..._t.spread, turn: 2 }, right: { ..._t.spread, turn: 2 } } },
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
}, e1 = {
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
          easing: Fn
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
}, Xe = {
  disco: Ym,
  hipHop: Km,
  breaking: zm,
  jazz: Xm,
  kpop: Um,
  bollywood: Gm,
  bhangra: Vm,
  bharatanatyam: Zm,
  charleston: Qm,
  tap: t1,
  popping: e1
}, Vs = (t) => Math.min(1, Math.max(0, t));
function n1(t) {
  const e = { ...ct, turn: t.view }, n = [];
  for (const s of t.keys) {
    const o = n[n.length - 1], i = !o || s.reset ? e : o.pose;
    n.push({ at: s.at, pose: { ...i, ...s.pose }, easing: s.easing });
  }
  return n;
}
function s1(t) {
  return t - o1 * Math.sin(2 * Math.PI * t) / (2 * Math.PI);
}
const o1 = 0.5;
function i1(t, e) {
  if (!(e <= t.takeoff || e >= t.landing))
    return (e - t.takeoff) / (t.landing - t.takeoff);
}
function r1(t, e) {
  const n = typeof t == "string" ? yo[t] : t, s = n1(n), o = Vs(e);
  let i = 0;
  for (let u = 0; u < s.length; u++) s[u].at <= o && (i = u);
  const r = s[i], a = s[Math.min(i + 1, s.length - 1)], l = a.at > r.at ? (o - r.at) / (a.at - r.at) : 0, c = Xn(r.pose, a.pose, Ht(a.easing ?? "ease-in-out")(Vs(l))), h = i1(n, o);
  return h === void 0 ? { ...c, spin: 0, rise: 0 } : {
    ...c,
    spin: n.spin * s1(h),
    rise: 4 * n.height * h * (1 - h)
  };
}
function a1(t, e, n) {
  const s = typeof t == "string" ? yo[t] : t, o = Vs(e), i = Vs((o - s.takeoff) / (s.landing - s.takeoff));
  return s.travel * n * i;
}
function Rv(t, e, n = {}) {
  const s = typeof e == "string" ? yo[e] : e, o = n.start ?? 0, i = n.duration ?? s.duration, r = n.samples ?? 48, a = Array.from({ length: r + 1 }, (h, u) => {
    const f = u / r;
    return { time: o + f * i, progress: f, pose: r1(s, f) };
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
      keyframes: a.map((u) => ({ time: u.time, value: (n.x ?? 0) + h * a1(s, u.progress, n.height) }))
    });
  }
  return c;
}
const l1 = {
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
}, c1 = {
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
}, fs = {
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
}, h1 = {
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
}, u1 = {
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
function Ge(t, e, n, s, o, i = 1300) {
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
      { at: 0.16, pose: l1 },
      { at: 0.27, pose: c1, easing: "ease-out-quad" },
      ...o,
      { at: 0.76, pose: h1 },
      { at: 0.86, pose: u1, easing: "ease-out-quad" },
      { at: 1, reset: !0 }
    ]
  };
}
const yo = {
  frontFlip: Ge("Front flip (tuck)", 360, 0.56, 0.35, [
    { at: 0.38, pose: fs, easing: "ease-out-cubic" },
    { at: 0.64, pose: fs }
  ]),
  backFlip: Ge("Back flip (tuck)", -360, 0.58, -0.15, [
    { at: 0.36, pose: { ...fs, lean: 18 }, easing: "ease-out-cubic" },
    { at: 0.64, pose: { ...fs, lean: 18 } }
  ]),
  layout: Ge("Back layout (straight body)", -360, 0.66, -0.2, [
    // Arched, arms overhead, legs together and long.
    { at: 0.4, pose: { leftHip: 8, rightHip: -8, leftKnee: 0, rightKnee: 0, leftAnkle: 60, rightAnkle: 60, leftShoulder: -178, rightShoulder: 178, lean: -18, headTilt: -14 } },
    { at: 0.64, pose: { leftHip: -4, rightHip: 4, lean: -6, headTilt: -4, leftShoulder: -150, rightShoulder: 150 } }
  ], 1400),
  scissorFlip: Ge("Scissor flip", 360, 0.6, 0.45, [
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
  splitLeap: Ge("Split leap (grand jeté)", 0, 0.36, 0.9, [
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
  backHandspring: Ge("Back handspring", -360, 0.16, -0.7, [
    // Arms reach back overhead to the ground, legs snap over.
    { at: 0.38, pose: { leftHip: 10, rightHip: -10, leftKnee: 0, rightKnee: 0, leftShoulder: -178, rightShoulder: 178, lean: -26, headTilt: -20 } },
    { at: 0.6, pose: { leftHip: -40, rightHip: 40, leftKnee: -20, rightKnee: 20, lean: 6, headTilt: 0 } }
  ], 1200)
}, Bi = {
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
}, Uo = 0.215, Go = 0.205, f1 = 0.065, dl = 0.035, d1 = 0.165, p1 = 0.155, g1 = 12, m1 = 0.3, y1 = 0.7, b1 = 0.35, w1 = (t) => t * Math.PI / 180, mt = {
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
function vt(t = {}) {
  return { ...mt, ...t };
}
const k1 = /* @__PURE__ */ new Set(["turn", "side", "head.turn", "head.tilt", "roll", "lookX", "hair.swing"]);
function v1(t) {
  const e = {};
  for (const [n, s] of Object.entries(t)) {
    const o = n.replace(/(^|\.)(left|right)(\.|$)/, (i, r, a, l) => `${r}${a === "left" ? "right" : "left"}${l}`);
    e[o] = k1.has(n) ? -s : s;
  }
  return e;
}
function wt(t, e) {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}
const Me = {
  rest: mt,
  wave: vt({ "arm.right.spread": 115, "arm.right.bend": 55, "arm.right.elbow": 0, "head.tilt": -6, smile: 0.9 }),
  cheer: vt({ ...wt("arm", { spread: 140, bend: 20, elbow: 0 }), mouth: 0.6, smile: 1, "eye.left": 0, "eye.right": 0 }),
  point: vt({ "arm.right.spread": 88, "arm.right.elbow": 0, "arm.right.bend": 0, "head.turn": -20, smile: 0.4 }),
  handsOnHips: vt({ ...wt("arm", { spread: 50, bend: -105, elbow: 0 }), ...wt("leg", { spread: 9 }), smile: 0.8 }),
  think: vt({ "arm.right.spread": 22, "arm.right.bend": -150, "arm.right.elbow": 0, "head.tilt": 10, lookX: -0.5, lookY: -0.8, smile: 0 }),
  shrug: vt({ ...wt("arm", { spread: 35, bend: 75, elbow: 0 }), "head.tilt": -10, smile: -0.2 }),
  sit: vt({ ...wt("leg", { swing: 90, knee: 90, spread: 4 }), ...wt("arm", { swing: 25, elbow: 45, spread: 8 }) }),
  kneel: vt({
    "leg.left.swing": 90,
    "leg.left.knee": 90,
    // The back thigh leans back a little so its knee meets the ground beside the
    // front foot; the shin slopes up from it and the foot points down to tucked toes.
    "leg.right.swing": -18,
    "leg.right.knee": 108,
    "leg.right.ankle": 16,
    ...wt("arm", { swing: 20, elbow: 30 })
  }),
  crouch: vt({ ...wt("leg", { swing: 75, knee: 140, spread: 6 }), lean: 25, ...wt("arm", { swing: 50, elbow: 40 }), "head.nod": -15 }),
  // On hands and knees: the back nearly level, arms straight down, the toes
  // pointed back along the ground.
  crawl: vt({ lean: 82, "head.nod": -35, ...wt("arm", { swing: 80, elbow: 0, spread: 4 }), ...wt("leg", { knee: 92, ankle: -88 }) }),
  lieDown: vt({ roll: 90, ...wt("arm", { spread: 8 }), "head.nod": 0 }),
  // Everyday actions (the motion and everyday-life reference sheets). Hands that hold
  // something are where its grip goes: see `holding` and `handGrip`.
  sleep: vt({ roll: 90, ...wt("arm", { spread: 8, swing: 20, elbow: 40 }), "leg.left.knee": 20, "leg.left.swing": 15, blink: 1, smile: 0.2 }),
  stretch: vt({ side: -16, "arm.left.spread": 165, "arm.left.bend": 35, "arm.left.elbow": 0, "arm.right.spread": 40, "arm.right.bend": -110, "arm.right.elbow": 0, "head.tilt": -10, "eye.left": 0, "eye.right": 0, smile: 0.4 }),
  sitFloor: vt({ ...wt("leg", { swing: 80, spread: 22, rotate: 75, knee: 145 }), ...wt("arm", { swing: 25, spread: 18, elbow: 30 }), lean: 5, smile: 0.5 }),
  carry: vt({ ...wt("arm", { spread: 16, elbow: 4 }), lean: -3, smile: 0.4 }),
  lift: vt({ ...wt("arm", { swing: 28, spread: 24, elbow: 85, bend: -45 }), ...wt("leg", { swing: 12, knee: 22, spread: 6 }), lean: -4, smile: 0.2 }),
  push: vt({ lean: 28, ...wt("arm", { swing: 82, spread: 12, elbow: 18 }), "leg.left.swing": 28, "leg.left.knee": 30, "leg.right.swing": -28, "leg.right.knee": 6, "head.nod": -20, browTilt: -0.6, smile: -0.2 }),
  pull: vt({ lean: -22, ...wt("arm", { swing: 70, spread: 6, elbow: 0 }), "leg.left.swing": 32, "leg.left.knee": 8, "leg.right.swing": -8, "leg.right.knee": 34, "head.nod": 12, browTilt: -0.6, smile: -0.2 }),
  drink: vt({ "arm.right.swing": 85, "arm.right.spread": 8, "arm.right.elbow": 120, "arm.right.bend": 0, "head.nod": -14, "eye.left": 0.5, "eye.right": 0.5, smile: 0 }),
  phone: vt({ "arm.right.swing": 80, "arm.right.spread": 8, "arm.right.elbow": 80, "arm.right.bend": -10, "head.nod": 18, lookY: 0.7, lookX: -0.3, smile: 0.4 }),
  read: vt({ ...wt("arm", { swing: 32, spread: 10, elbow: 82, bend: -28 }), "head.nod": 22, lookY: 0.8, smile: 0.2 }),
  type: vt({ ...wt("leg", { swing: 90, knee: 90, spread: 4 }), ...wt("arm", { swing: 40, spread: 10, elbow: 55, bend: -20 }), lean: 8, "head.nod": 10, lookY: 0.5, smile: 0 })
};
function M1(t = {}) {
  const e = t.headSize ?? 0.3, n = t.shoulderWidth ?? 0.06, s = t.hipWidth ?? 0.022, o = t.legLength ?? 1, i = t.armLength ?? 1, r = Math.max(0.12, 1 - e - dl - (Uo + Go) * o), a = (h) => ({
    id: `arm.${h}`,
    parent: "spine",
    offset: [(h === "left" ? 1 : -1) * n, -0.035, 0],
    rest: [0, -1, 0],
    side: h === "left" ? 1 : -1,
    bones: [
      { length: d1 * i, width: [1.25, 0.9] },
      { length: p1 * i, width: [0.9, 0.75] }
    ]
  }), l = (h) => ({
    id: `leg.${h}`,
    parent: null,
    offset: [(h === "left" ? 1 : -1) * s, 0, 0],
    rest: [0, -1, 0],
    side: h === "left" ? 1 : -1,
    bones: [
      { length: Uo * o, width: [1.45, 1.05] },
      { length: Go * o, width: [1.05, 0.85] },
      { length: f1 * Math.sqrt(o), width: [0.95, 0.7] }
    ]
  }), c = (h, u) => h[u] ?? mt[u] ?? 0;
  return {
    id: "human",
    hipHeight: (Uo + Go) * o,
    // Tie order: legs, then the body, then the arms (in front of the chest unless turned away), then the head.
    chains: [
      l("left"),
      l("right"),
      {
        id: "spine",
        parent: null,
        rest: [0, 1, 0],
        bones: [
          { length: r / 2, width: [1.7, 1.4] },
          { length: r / 2, width: [1.4, 1.1] }
        ]
      },
      { id: "neck", parent: "spine", rest: [0, 1, 0], bones: [{ length: dl, width: [1, 0.9] }] },
      a("left"),
      a("right")
    ],
    head: { on: "neck", size: e },
    contacts: [
      ...["left", "right"].flatMap((h) => [
        { chain: `leg.${h}`, joint: 1 },
        { chain: `leg.${h}`, joint: 2 },
        { chain: `leg.${h}`, joint: 3 },
        { chain: `arm.${h}`, joint: 1 },
        { chain: `arm.${h}`, joint: 2 }
      ]),
      { chain: "spine", joint: 0 },
      { chain: "spine", joint: 1 },
      { chain: "spine", joint: 2 },
      { head: "top" }
    ],
    angles(h, u) {
      if (u.id === "spine") {
        const b = -c(h, "lean") / 2, T = c(h, "side") / 2, k = -c(h, "bend");
        return [
          { swing: b + k * m1, spread: T },
          { swing: b + k * y1, spread: T }
        ];
      }
      if (u.id === "neck") return [{ swing: -c(h, "bend") * b1, spread: 0 }];
      const [f, d] = u.id.split("."), g = (b) => c(h, `${f}.${d}.${b}`);
      if (f === "arm")
        return [
          { swing: g("swing"), spread: g("spread") },
          { swing: g("elbow"), spread: g("bend") }
        ];
      const p = (u.side ?? 1) * g("rotate"), m = 1 - Math.cos(w1(g("rotate")));
      return [
        { swing: g("swing"), spread: g("spread"), yaw: p },
        { swing: -g("knee"), spread: 0, yaw: p },
        // The foot points forward, square to the shin, turned out a little (more with `toeOut`).
        { swing: 90 + g("ankle") - m * (g("swing") - g("knee")), spread: 0, yaw: (g1 + g("toeOut")) * (u.side ?? 1) }
      ];
    },
    withAngles(h, u, f) {
      const [d, g] = u.id.split("."), p = (m) => `${d}.${g}.${m}`;
      return d === "arm" ? {
        ...h,
        [p("swing")]: f[0].swing,
        [p("spread")]: f[0].spread,
        [p("elbow")]: f[1].swing,
        [p("bend")]: f[1].spread
      } : d === "leg" ? { ...h, [p("swing")]: f[0].swing, [p("spread")]: f[0].spread, [p("knee")]: -f[1].swing } : h;
    },
    boneScale(h, u) {
      const f = Math.min(3, Math.max(0.3, c(h, "stretch")));
      return u?.id.startsWith("arm.") ? Math.sqrt(f) : f;
    },
    headPose(h) {
      const u = Math.min(3, Math.max(0.3, c(h, "stretch")));
      return {
        yaw: c(h, "head.turn"),
        nod: c(h, "head.nod"),
        tilt: c(h, "head.tilt"),
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
function Lv(t) {
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
const x1 = {
  leftEye: "eye.left",
  rightEye: "eye.right",
  leftBrow: "brow.left",
  rightBrow: "brow.right"
}, S1 = { blush: 0, tears: 0, sweat: 0 }, ss = Object.fromEntries(
  Object.entries(bt).map(([t, e]) => [
    t,
    { ...Object.fromEntries(Object.entries(e).map(([n, s]) => [x1[n] ?? n, s])), ...S1 }
  ])
);
ss.crying.tears = 1;
ss.scared.sweat = 0.8;
ss.worried.sweat = 0.6;
const jt = (t) => ({ ...ss.neutral, ...t }), n0 = {
  ...ss,
  laughing: jt({ mouth: 0.75, smile: 1, mouthWidth: 1.25, "eye.left": 0, "eye.right": 0, "brow.left": 0.5, "brow.right": 0.5 }),
  afraid: jt({ mouth: 0.4, smile: -0.6, mouthWidth: 0.9, "eye.left": 1.3, "eye.right": 1.3, "brow.left": 0.6, "brow.right": 0.6, browTilt: 1, sweat: 1 }),
  bored: jt({ smile: -0.05, mouthWidth: 0.6, "eye.left": 0.45, "eye.right": 0.45, "brow.left": -0.4, "brow.right": -0.4, lookX: 0.5 }),
  tired: jt({ mouth: 0.2, smile: -0.3, mouthWidth: 0.7, "eye.left": 0.3, "eye.right": 0.3, "brow.left": -0.1, "brow.right": -0.1, browTilt: 0.6, lookY: 0.6 }),
  embarrassed: jt({ smile: 0.4, mouthWidth: 0.7, "eye.left": 0.9, "eye.right": 0.9, browTilt: 0.7, "brow.left": 0.2, "brow.right": 0.2, lookX: -0.6, lookY: 0.5, blush: 1 }),
  proud: jt({ smile: 0.75, mouthWidth: 1, "eye.left": 0.75, "eye.right": 0.75, "brow.left": 0.5, "brow.right": 0.5, lookY: -0.2 }),
  determined: jt({ smile: 0.35, mouthWidth: 0.8, "eye.left": 0.85, "eye.right": 0.85, "brow.left": -0.5, "brow.right": -0.5, browTilt: -0.9 }),
  affectionate: jt({ smile: 0.85, "eye.left": 0, "eye.right": 0, "brow.left": 0.3, "brow.right": 0.3, blush: 0.8 }),
  hurt: jt({ smile: -0.7, mouthWidth: 0.8, "eye.left": 1.1, "eye.right": 1.1, "brow.left": 0.2, "brow.right": 0.2, browTilt: 1, lookY: 0.3, tears: 0.35 }),
  suspicious: jt({ smile: -0.25, mouthWidth: 0.7, "eye.left": 0.5, "eye.right": 0.85, "brow.left": -0.6, "brow.right": 0.4, browTilt: -0.3, lookX: 0.8 }),
  relieved: jt({ smile: 0.7, "eye.left": 0, "eye.right": 0, "brow.left": 0.4, "brow.right": 0.4, browTilt: 0.4 }),
  excited: jt({ mouth: 0.6, smile: 1, mouthWidth: 1.1, "eye.left": 1.4, "eye.right": 1.4, "brow.left": 0.9, "brow.right": 0.9, blush: 0.4 })
};
function T1(t, e) {
  const n = Math.min(1, Math.max(0, t.turn ?? 0)), s = 1 - n, o = { ...mt, turn: n }, i = [
    { stick: "right", human: "left", s: 1 },
    { stick: "left", human: "right", s: -1 }
  ];
  for (const { stick: a, human: l, s: c } of i) {
    const h = t[`${a}Shoulder`], u = t[`${a}Elbow`];
    o[`arm.${l}.spread`] = h * s, o[`arm.${l}.swing`] = c * h * n, o[`arm.${l}.bend`] = u * s, o[`arm.${l}.elbow`] = c * u * n;
    const f = t[`${a}Hip`], d = t[`${a}Knee`], g = s + c * n;
    o[`leg.${l}.rotate`] = 90 * s, o[`leg.${l}.spread`] = 0, o[`leg.${l}.swing`] = f * g, o[`leg.${l}.knee`] = d * g, o[`leg.${l}.ankle`] = -(t[`${a}Ankle`] ?? 0), o[`leg.${l}.toeOut`] = (t[`${a}FootOut`] ?? 0) * E1, o[`eye.${l}`] = t[`${a}Eye`], o[`brow.${l}`] = t[`${a}Brow`], e && Object.assign(o, A1(l, e[a] ?? $t, t[`${a}Wrist`] ?? 0, n));
  }
  const r = t.bend ?? 0;
  o.lean = t.lean * n, o.bend = r * n, o.side = (t.lean + r * 0.5) * s, o["head.tilt"] = (t.headTilt + r * 0.5) * s, o["head.nod"] = t.headTilt * n;
  for (const a of ["mouth", "smile", "mouthWidth", "blink", "browTilt", "lookX", "lookY", "stretch"]) o[a] = t[a];
  return o.lift = t.rise ?? 0, o.roll = t.spin ?? 0, o;
}
const E1 = 70;
function A1(t, e, n, s) {
  const o = t === "right" ? 1 - s : 1 + s, i = {};
  for (const r of Object.keys($t)) i[`hand.${t}.${r}`] = e[r] ?? $t[r];
  return i[`hand.${t}.turn`] = (e.turn ?? 0) - o, i[`hand.${t}.roll`] = (e.roll ?? 0) + n, i;
}
const Zt = (t) => t * Math.PI / 180;
function $r([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t, e * o + n * i, -e * i + n * o];
}
function Pr([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - e * i, t * i + e * o, n];
}
function Ee([t, e, n], s) {
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o + n * i, e, -t * i + n * o];
}
const Te = (t, e) => [t[0] + e[0], t[1] + e[1], t[2] + e[2]], Js = (t, e) => [t[0] * e, t[1] * e, t[2] * e], Os = (t, e) => Pr($r(t, e.swing), e.spread);
function Vo(t, e) {
  const n = Ee(t, e);
  return { point: { x: n[0], y: -n[1] }, depth: n[2] };
}
function Ir(t, e, n) {
  const s = n, i = [0, t.hipHeight * s * (t.boneScale?.(e, null) ?? 1), 0], r = {};
  for (const p of t.chains) {
    const m = p.parent ? r[p.parent] : void 0;
    if (p.parent && !m) throw new Error(`body plan ${t.id}: chain ${p.id} comes before its parent ${p.parent}`);
    const b = p.at ?? (m ? m.joints3.length - 1 : 0), T = m ? m.joints3[b] : i, k = m ? m.frames[Math.max(0, b - 1)] : { swing: 0, spread: 0 }, y = p.offset ? Te(T, Os(Js(p.offset, s), k)) : T, S = p.side ?? 1, v = t.boneScale?.(e, p) ?? 1, x = t.angles(e, p), M = [y], w = [];
    let $ = k.swing, E = k.spread;
    p.bones.forEach((A, H) => {
      const I = x[H] ?? { swing: 0, spread: 0 };
      $ += Zt(I.swing), E += Zt(I.spread) * S, w.push({ swing: $, spread: E });
      const C = Ee(Os(p.rest, { swing: $, spread: E }), Zt(I.yaw ?? 0));
      M.push(Te(M[H], Js(C, A.length * s * v)));
    }), r[p.id] = { joints3: M, frames: w };
  }
  const a = r[t.head.on], l = t.headPose?.(e) ?? { yaw: 0, nod: 0, tilt: 0, sx: 1, sy: 1 }, c = a.frames[a.frames.length - 1], h = t.head.size / 2 * s, u = h * l.sx, f = h * l.sy, d = (p) => Os(Ee($r(Pr(p, -Zt(l.tilt)), -Zt(l.nod)), Zt(l.yaw)), c), g = Te(a.joints3[a.joints3.length - 1], d([0, f, 0]));
  return { height: s, root: i, chains: r, head: { center: g, rx: u, ry: f, toBody: d } };
}
function Or(t, e, n) {
  const s = n.height, o = Zt(90 * (e.turn ?? 0)), i = Ir(t, e, s), { root: r } = i, a = i.chains, { rx: l, ry: c } = i.head, h = i.head.toBody, u = i.head.center, f = {};
  for (const w of t.chains) {
    const { joints3: $, frames: E } = a[w.id], A = $.map((H) => Vo(H, o));
    f[w.id] = {
      id: w.id,
      joints3: $,
      frames: E,
      points: A.map((H) => H.point),
      depths: A.map((H) => H.depth)
    };
  }
  const d = Vo(u, o), g = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((w) => Ee(h(w), o)), p = Vo(r, o).point, m = Zt(e.roll ?? 0), b = (w) => {
    const $ = w.x - p.x, E = w.y - p.y;
    return { x: p.x + $ * Math.cos(m) - E * Math.sin(m), y: p.y + $ * Math.sin(m) + E * Math.cos(m) };
  }, T = ([w, $, E]) => [w * Math.cos(m) + $ * Math.sin(m), -w * Math.sin(m) + $ * Math.cos(m), E];
  for (const w of Object.values(f)) w.points = w.points.map(b);
  const k = {
    center: b(d.point),
    depth: d.depth,
    rx: l,
    ry: c,
    angle: 0,
    axes: g.map(T)
  }, y = k.axes[1];
  k.angle = Math.atan2(y[0], y[1]);
  const S = (w) => {
    if ("head" in w) return { x: k.center.x + y[0] * c, y: k.center.y - y[1] * c };
    const $ = f[w.chain];
    return $.points[Math.min(w.joint, $.points.length - 1)];
  };
  let v = 0;
  (n.contact ?? "ground") === "ground" && (v = -Math.max(...t.contacts.map((w) => S(w).y))), v -= (e.lift ?? 0) * s;
  const x = (w) => ({ x: w.x, y: w.y + v });
  for (const w of Object.values(f)) w.points = w.points.map(x);
  k.center = x(k.center);
  const M = t.contacts.map((w) => ({ spec: w, point: S(w) }));
  return {
    height: s,
    view: o,
    chains: f,
    head: k,
    hip: x(b(p)),
    contacts: M,
    groundY: Math.max(...M.map((w) => w.point.y))
  };
}
const ji = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], s0 = (t) => {
  const e = Math.hypot(t[0], t[1], t[2]) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
};
function _r(t, e, n) {
  const s = n.height, o = Zt(90 * (e.turn ?? 0)), i = Zt(e.roll ?? 0), r = Ir(t, e, s), a = Ee(r.root, o), l = (m) => Te(Pr(ji(Ee(m, o), a), -i), a), c = {};
  for (const m of t.chains) c[m.id] = r.chains[m.id].joints3.map(l);
  const h = l(r.head.center), u = (m) => s0(ji(l(Te(r.head.center, r.head.toBody(m))), h)), f = [u([1, 0, 0]), u([0, 1, 0]), u([0, 0, 1])], d = (m) => {
    if ("head" in m) return Te(h, Js(f[1], r.head.ry));
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
function Hr(t, e, n, s) {
  const o = n.height, i = Zt(90 * (e.turn ?? 0)), r = Ir(t, e, o), a = _r(t, e, n), l = a.hip, c = a.chains, h = a.head.center, u = (w) => {
    if ("head" in w) return Te(h, Js(a.head.axes[1], a.head.ry));
    const $ = c[w.chain];
    return $[Math.min(w.joint, $.length - 1)];
  }, f = s.toView(l), d = s.toScreen(f), g = s.toScreen([f[0] + 1, f[1], f[2]]), p = Math.hypot(g.x - d.x, g.y - d.y), m = (w) => {
    const $ = s.toView(w);
    return { point: s.toScreen($), depth: $[2] * p };
  }, b = {};
  for (const w of t.chains) {
    const $ = c[w.id].map(m);
    b[w.id] = {
      id: w.id,
      joints3: r.chains[w.id].joints3,
      frames: r.chains[w.id].frames,
      points: $.map((E) => E.point),
      depths: $.map((E) => E.depth)
    };
  }
  const T = s.toView(h), k = s.toScreen(T), y = s.toScreen([T[0] + 1, T[1], T[2]]), S = Math.hypot(y.x - k.x, y.y - k.y), v = a.head.axes.map((w) => s0(ji(s.toView(Te(h, w)), T))), x = {
    center: k,
    depth: T[2] * p,
    rx: r.head.rx * S,
    ry: r.head.ry * S,
    angle: Math.atan2(v[1][0], v[1][1]),
    axes: v
  }, M = t.contacts.map((w) => ({ spec: w, point: m(u(w)).point }));
  return {
    height: o * p,
    view: i,
    chains: b,
    head: x,
    hip: d,
    contacts: M,
    groundY: Math.max(...M.map((w) => w.point.y))
  };
}
function Cr(t, [e, n, s]) {
  const [o, i, r] = t.axes, a = [
    o[0] * e * t.rx + i[0] * n * t.ry + r[0] * s * t.rx,
    o[1] * e * t.rx + i[1] * n * t.ry + r[1] * s * t.rx,
    o[2] * e * t.rx + i[2] * n * t.ry + r[2] * s * t.rx
  ], l = Math.hypot(e, n, s) || 1, c = (o[2] * e + i[2] * n + r[2] * s) / l;
  return { point: { x: t.center.x + a[0], y: t.center.y - a[1] }, depth: t.depth + a[2], facing: c };
}
class o0 {
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
function $1(t) {
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
const Rr = Math.PI * 2;
function P1(t, e = 16) {
  const n = new o0(), s = Math.max(6, Math.round(e)), o = Math.max(3, Math.round(s / 2)), i = [];
  for (let r = 0; r <= o; r++) {
    const a = r / o * Math.PI, l = [];
    for (let c = 0; c <= s; c++) {
      const h = c / s * Rr, u = Math.sin(a) * Math.sin(h), f = Math.cos(a), d = Math.sin(a) * Math.cos(h);
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
function pl(t, e, n, s, o) {
  const i = t.vertex(0, n, 0, 0, s, 0), r = Array.from({ length: o }, (a, l) => {
    const c = l / o * Rr;
    return t.vertex(Math.sin(c) * e, n, Math.cos(c) * e, 0, s, 0);
  });
  for (let a = 0; a < o; a++) {
    const l = r[a], c = r[(a + 1) % o];
    s === 1 ? t.triangle(i, l, c) : t.triangle(i, c, l);
  }
}
function i0(t, e, n = 24) {
  const s = new o0(), o = Math.max(6, Math.round(n)), i = e / 2, r = -e / 2, a = (h) => Array.from({ length: o + 1 }, (u, f) => {
    const d = f / o * Rr;
    return s.vertex(Math.sin(d) * t, h, Math.cos(d) * t, Math.sin(d), 0, Math.cos(d));
  }), l = a(r), c = a(i);
  for (let h = 0; h < o; h++) s.quad(l[h], l[h + 1], c[h + 1], c[h]);
  return pl(s, t, i, 1, o), pl(s, t, r, -1, o), s.build();
}
function Zs(t) {
  const e = Array.from({ length: t.indices.length / 3 }, () => []);
  for (const n of $1(t))
    for (const s of n.faces) {
      const o = n.faces.find((i) => i !== s) ?? -1;
      e[s].push({ a: n.a, b: n.b, across: o });
    }
  return { ...t, faceEdges: e };
}
const ds = (t) => t * 180 / Math.PI, Ve = (t, e) => [t[0] - e[0], t[1] - e[1], t[2] - e[2]], Jo = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2], Rn = (t) => Math.hypot(t[0], t[1], t[2]), qi = (t) => {
  const e = Rn(t) || 1;
  return [t[0] / e, t[1] / e, t[2] / e];
}, ps = (t) => Math.atan2(Math.sin(t), Math.cos(t));
function gl(t) {
  const [e, n, s] = qi(t);
  return { swing: Math.asin(Math.max(-1, Math.min(1, s))), spread: Math.atan2(e, -n) };
}
function I1(t, e, n, s, o) {
  const i = t.chains.find(($) => $.id === n);
  if (!i) throw new Error(`reach: no chain ${n} in ${t.id}`);
  if (i.bones.length < 2 || i.rest[1] > -0.99) throw new Error(`reach: ${n} is not a hanging limb of two bones or more`);
  if (!t.withAngles) throw new Error(`reach: the ${t.id} plan cannot set angles`);
  const r = Or(t, { ...e, turn: 0, roll: 0, lift: 0 }, { height: o.height, contact: "none" }), a = r.chains[n], l = a.joints3[0], c = Rn(Ve(a.joints3[1], a.joints3[0])), h = Rn(Ve(a.joints3[2], a.joints3[1])), u = i.parent ? r.chains[i.parent].frames[Math.max(0, (i.at ?? r.chains[i.parent].joints3.length - 1) - 1)] : { swing: 0, spread: 0 }, f = Ve(s, l), d = Math.min(c + h - 1e-6, Math.max(Math.abs(c - h) + 1e-6, Rn(f))), g = qi(f), p = i.parent !== null, m = Os(i.pole ?? (p ? [0, -0.35, -1] : [0, 0, 1]), u);
  let b = Ve(m, [g[0] * Jo(m, g), g[1] * Jo(m, g), g[2] * Jo(m, g)]);
  Rn(b) < 1e-6 && (b = Ee([1, 0, 0], 0)), b = qi(b);
  const T = (c * c + d * d - h * h) / (2 * c * d), k = Math.sqrt(Math.max(0, 1 - T * T)), y = [
    l[0] + c * (T * g[0] + k * b[0]),
    l[1] + c * (T * g[1] + k * b[1]),
    l[2] + c * (T * g[2] + k * b[2])
  ], S = [l[0] + g[0] * d, l[1] + g[1] * d, l[2] + g[2] * d], v = i.side ?? 1, x = gl(Ve(y, l)), M = gl(Ve(S, y)), w = [
    { swing: ds(ps(x.swing - u.swing)), spread: ds(ps(x.spread - u.spread)) * v },
    { swing: ds(ps(M.swing - x.swing)), spread: ds(ps(M.spread - x.spread)) * v }
  ];
  return t.withAngles(e, i, w);
}
const r0 = 0.34, Gt = 0.12, ne = -0.4, Yt = (t, e, n) => t[e] ?? n, O1 = (t, e) => Math.max(0, t) * (1 - Math.min(1, Math.max(0, e))), _1 = 0.45, H1 = 0.35, C1 = 0.7;
function Tt(t, e, n) {
  const s = (d) => Math.sqrt(Math.max(0, 1 - d.x * d.x - d.y * d.y)), o = Cr(t, [n.x, n.y, s(n)]).facing, i = t.axes[2], r = Math.atan2(i[0], i[2]), a = Math.cos(r), l = a >= 0 ? 1 : -1, c = l * Math.max(H1, Math.abs(a)), h = l * Math.max(C1, Math.abs(a)), u = Math.cos(t.angle), f = Math.sin(t.angle);
  return {
    facing: o,
    points: e.map((d) => {
      const g = _1 * Math.sin(r) + n.x * c + (d.x - n.x) * h, p = d.y + i[1] * s(d), m = g * t.rx, b = p * t.ry;
      return { x: t.center.x + m * u + b * f, y: t.center.y + m * f - b * u };
    })
  };
}
const gs = (t, e, n, s = 12) => Array.from({ length: s + 1 }, (o, i) => {
  const r = i / s, a = 1 - r;
  return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
}), _s = (t, e, n, s, o = 16) => Array.from({ length: o }, (i, r) => {
  const a = Math.PI * 2 * r / o;
  return { x: t + Math.cos(a) * n, y: e + Math.sin(a) * s };
}), Dn = 0.05;
function R1(t, e, n, s) {
  const o = Math.max(1, Math.min(s * 0.6, 0.14 * e.rx)), i = (b, T) => Tt(e, b, T).points, r = (b, T) => Tt(e, [], { x: b, y: T }).facing, a = Yt(n, "smile", 0), l = Yt(n, "blink", 0), c = Yt(n, "lookX", 0), h = Yt(n, "lookY", 0), u = Yt(n, "browTilt", 0);
  for (const b of [1, -1]) {
    const T = b === 1 ? "left" : "right", k = r0 * b;
    if (r(k, Gt) < Dn) continue;
    const y = { x: k, y: Gt }, S = O1(Yt(n, `eye.${T}`, 1), l);
    if (S < 0.2) {
      const w = a > 0.5 ? 0.12 : -0.06;
      t.line(i(gs({ x: k - 0.12, y: Gt }, { x: k, y: Gt + w }, { x: k + 0.12, y: Gt }), y), o);
    } else {
      if (S > 1.2) {
        const A = 0.13 * S;
        t.shape(i(_s(k, Gt, A * 0.85, A), y), "#ffffff", o);
      }
      const w = S > 1.2 ? 0.075 : 0.1, $ = k + c * 0.08, E = Gt - h * 0.07;
      t.shape(i(_s($, E, w, w * 1.1 * Math.min(S, 1)), y), t.ink, 0);
    }
    const v = Gt + 0.3 + Yt(n, `brow.${T}`, 0) * 0.14 + Math.max(0, S - 1) * 0.12, x = { x: k + b * 0.13, y: v }, M = { x: k - b * 0.13, y: v + u * 0.1 };
    t.line(i([x, { x: (x.x + M.x) / 2, y: (x.y + M.y) / 2 }, M], { x: k, y: v }), o);
  }
  L1(t, e, n, o);
  const f = { x: 0, y: ne };
  if (r(0, ne) < -Dn) return;
  const d = 0.25 * Math.max(0.3, Yt(n, "mouthWidth", 1)), g = Math.min(1, Math.max(0, Yt(n, "mouth", 0)));
  if (g <= 0.05) {
    t.line(i(gs({ x: -d, y: ne }, { x: 0, y: ne - a * 0.25 }, { x: d, y: ne }), f), o);
    return;
  }
  const p = 0.3 * g;
  let m;
  if (a > 0.3) {
    const b = ne + 0.05;
    m = [...gs({ x: d, y: b }, { x: 0, y: ne - p * 2 }, { x: -d, y: b })];
  } else if (a < -0.3) {
    const b = ne - p * 0.6;
    m = [...gs({ x: d, y: b }, { x: 0, y: ne + p * 1.4 }, { x: -d, y: b })];
  } else
    m = _s(0, ne, d * 0.8, p);
  t.shape(i(m, f), t.ink, 0);
}
const ml = "#8fd0f5", yl = (t, e, n) => Array.from({ length: 18 }, (s, o) => {
  const i = Math.PI * 2 * o / 18, r = Math.sin(i / 2);
  return { x: t + Math.sin(i) * n * r, y: e - n * 0.9 + Math.cos(i) * n * 1.6 * (0.55 + 0.45 * r) - n * 0.4 };
});
function L1(t, e, n, s) {
  const o = Math.min(1, Math.max(0, Yt(n, "blush", 0))), i = Math.min(1, Math.max(0, Yt(n, "tears", 0))), r = Math.min(1, Math.max(0, Yt(n, "sweat", 0)));
  if (!(o + i + r <= 0.01)) {
    for (const a of [1, -1]) {
      const l = { x: 0.5 * a, y: -0.16 }, c = Tt(e, [], l).facing >= Dn;
      if (o > 0.01 && c) {
        const { points: u } = Tt(e, _s(l.x, l.y, 0.17, 0.1), l);
        if (t.shape(u, `rgba(240, 120, 140, ${(0.75 * o).toFixed(3)})`, 0), o > 0.5)
          for (const f of [-0.07, 0, 0.07]) {
            const d = [{ x: l.x + f - 0.018, y: l.y - 0.03 }, { x: l.x + f + 0.018, y: l.y + 0.03 }];
            t.line(Tt(e, d, l).points, s * 0.3);
          }
      }
      const h = { x: r0 * a, y: Gt };
      if (i > 0.01 && Tt(e, [], h).facing >= Dn) {
        const u = 0.05 + 0.04 * i, f = { x: h.x + 0.06 * a, y: Gt - 0.2 - 0.12 * i };
        if (t.shape(Tt(e, yl(f.x, f.y, u), f).points, ml, s * 0.35), i > 0.6) {
          const d = [{ x: h.x + 0.05 * a, y: Gt - 0.1 }, { x: f.x, y: f.y + u * 0.8 }];
          t.line(Tt(e, d, f).points, s * 0.3);
        }
      }
    }
    if (r > 0.01) {
      const a = { x: 0.64, y: 0.42 };
      Tt(e, [], a).facing >= Dn && t.shape(Tt(e, yl(a.x, a.y, 0.05 + 0.05 * r), a).points, ml, s * 0.35);
    }
  }
}
const W1 = 15;
function fe(t, e) {
  const n = Math.sqrt(Math.max(0, 1 - e * e));
  return [n * Math.sin(t), e, n * Math.cos(t)];
}
const F1 = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function de(t, [e, n, s]) {
  const [o, i, r] = t.axes;
  return o[2] * e + i[2] * n + r[2] * s;
}
function Wt(t, e) {
  return Cr(t, e).point;
}
function Qs(t, e) {
  const n = Math.abs(t - e) % (Math.PI * 2);
  return n > Math.PI ? Math.PI * 2 - n : n;
}
function bo(t, e, n = 64) {
  const s = e.top ?? 1, o = e.bottom ?? -1, i = Math.max(8, Math.ceil((s - o) * W1)), r = (g) => Math.min(s, Math.max(o, s - (s - o) * (g - 1) / i)), a = (g) => -Math.PI + Math.PI * 2 * g / n, l = (g, p) => e.normal ? e.normal(g, p) : F1(e.position(g, p)), c = i + 3, h = new Float64Array(n * c), u = new Float64Array(n * c);
  for (let g = 0; g < c; g++) {
    const p = g === 0 || g === c - 1, m = r(g);
    for (let b = 0; b < n; b++) {
      const T = g * n + b;
      if (p) {
        h[T] = -1;
        continue;
      }
      const k = a(b);
      h[T] = e.inside(k, m), u[T] = h[T] > -0.35 ? de(t, l(k, m)) : 0;
    }
  }
  const f = (g) => (g % n + n) % n, d = (g) => {
    const p = n + 1, m = new Float64Array(p * c);
    for (let A = 0; A < c; A++)
      for (let H = 0; H <= n; H++) {
        const I = A * n + (H === n ? 0 : H);
        m[A * p + H] = Math.min(h[I], g * u[I]);
      }
    const b = (A, H) => m[H * p + A], T = (A, H, I, C) => {
      const W = b(A, H), D = b(I, C), Y = W === D ? 0.5 : Math.min(1, Math.max(0, W / (W - D)));
      return Wt(t, e.position(a(A + (I - A) * Y), r(H + (C - H) * Y)));
    }, k = n * c * 2, y = new Int32Array(k).fill(-1), S = new Int32Array(k).fill(-1), v = /* @__PURE__ */ new Map(), x = (A, H, I) => {
      const C = (I * n + f(H)) * 2 + (A ? 1 : 0);
      return v.has(C) || v.set(C, A ? T(f(H), I, f(H), I + 1) : T(H, I, H + 1, I)), C;
    }, M = (A, H) => {
      y[A] === -1 ? y[A] = H : S[A] = H;
    }, w = (A, H) => {
      M(A, H), M(H, A);
    };
    for (let A = 0; A < c - 1; A++)
      for (let H = 0; H < n; H++) {
        const I = A * p + H, C = (m[I] > 0 ? 8 : 0) | (m[I + 1] > 0 ? 4 : 0) | (m[I + p + 1] > 0 ? 2 : 0) | (m[I + p] > 0 ? 1 : 0);
        if (C === 0 || C === 15) continue;
        const W = () => x(!1, H, A), D = () => x(!1, H, A + 1), Y = () => x(!0, H, A), j = () => x(!0, H + 1, A);
        switch (C) {
          case 1:
          case 14:
            w(Y(), D());
            break;
          case 2:
          case 13:
            w(D(), j());
            break;
          case 3:
          case 12:
            w(Y(), j());
            break;
          case 4:
          case 11:
            w(W(), j());
            break;
          case 6:
          case 9:
            w(W(), D());
            break;
          case 7:
          case 8:
            w(Y(), W());
            break;
          case 5:
          case 10: {
            const _ = (b(H, A) + b(H + 1, A) + b(H + 1, A + 1) + b(H, A + 1)) / 4 > 0;
            C === 5 === _ ? (w(Y(), W()), w(D(), j())) : (w(Y(), D()), w(W(), j()));
            break;
          }
        }
      }
    const $ = [], E = new Uint8Array(k);
    for (const A of v.keys()) {
      if (E[A]) continue;
      const H = [];
      let I = -1, C = A;
      for (; C !== -1 && !E[C]; ) {
        E[C] = 1, H.push(v.get(C));
        const W = y[C], D = S[C], Y = W !== -1 && W !== I && !E[W] ? W : D !== -1 && D !== I && !E[D] ? D : -1;
        I = C, C = Y;
      }
      H.length >= 3 && $.push(H);
    }
    return $;
  };
  return { near: d(1), far: d(-1) };
}
const bl = /* @__PURE__ */ new WeakMap();
function Lr(t, e, n) {
  let s = bl.get(t);
  s || bl.set(t, s = /* @__PURE__ */ new Map());
  let o = s.get(e);
  return o || s.set(e, o = n()), o;
}
function Wr(t, e, n) {
  t.save(), t.beginPath(), t.rect(-1e5, -1e5, 2e5, 2e5), t.ellipse(e.center.x, e.center.y, e.rx, e.ry, e.angle, 0, Math.PI * 2), t.clip("evenodd"), n(), t.restore();
}
function a0(t, e, n, s = 0.04) {
  const o = [];
  let i = [];
  return e.forEach((r, a) => {
    de(t, n[a]) > s ? i.push(Wt(t, r)) : (i.length >= 2 && o.push(i), i = []);
  }), i.length >= 2 && o.push(i), o;
}
const Gn = { swing: 0, trail: 0, lift: 0 };
function Fr(t) {
  if (!t) return Gn;
  const e = t["hair.swing"] ?? 0, n = t["hair.trail"] ?? 0, s = t["hair.lift"] ?? 0;
  return e === 0 && n === 0 && s === 0 ? Gn : { swing: e, trail: n, lift: s };
}
const l0 = (t) => t.swing === 0 && t.trail === 0 && t.lift === 0;
function D1(t) {
  return t.length > 0 || t.ties.some((e) => e.kind !== "bun");
}
function Yi([t, e, n], s) {
  if (s === 0) return [t, e, n];
  const o = Math.cos(s), i = Math.sin(s);
  return [t * o - n * i, e, n * o + t * i];
}
const wl = {
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
}, kl = 1.75, c0 = {
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
  shoulderStraight: { volume: 0.16, length: kl, opening: 84, part: 0, strands: "part", hairline: { front: 0.5, side: 0.05, back: -0.85 }, coversEars: !0 },
  shoulderWaves: { volume: 0.22, length: kl, opening: 84, part: 22, texture: "wavy", textureAmount: 0.12, hairline: { front: 0.45, side: 0.05, back: -0.85 }, coversEars: !0 },
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
}, le = {
  black: "#22201f",
  brown: "#6b4630",
  chestnut: "#7b4a2b",
  auburn: "#9a4426",
  blond: "#d9b55a",
  ginger: "#c8662f",
  gray: "#a7a29c",
  white: "#ecebe7"
};
function N1(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ? c0[e.style] : {};
  if (e.style && !n) throw new Error(`hair: unknown style '${e.style}'`);
  const { style: s, hairline: o, ...i } = e;
  return {
    ...wl,
    ...n,
    ...i,
    hairline: { ...wl.hairline, ...n.hairline, ...o },
    ties: (i.ties ?? n.ties ?? []).map((r) => ({ ...r }))
  };
}
const wo = (t) => t * Math.PI / 180, Nn = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, Ki = (t) => 1 - Math.abs(2 * (t - Math.floor(t)) - 1);
function to(t, e) {
  const { front: n, side: s, back: o } = t.hairline, i = (n - o) / 2, r = (n + o) / 2, a = (r + s) / 2, l = (r - s) / 2, c = Math.max(0, Math.cos(e));
  let h = a + i * Math.cos(e) + l * Math.cos(2 * e);
  return h -= t.sweep * Math.sin(e) * c, h += t.recede * Math.exp(-(((Math.abs(e) - 0.75) / 0.32) ** 2)), (t.texture === "spiky" || t.texture === "curly") && (h -= t.textureAmount * 0.6 * Ki(e * 11 / (Math.PI * 2)) * c), h;
}
function vl(t, e, n) {
  const s = t.textureAmount;
  switch (t.texture) {
    case "spiky":
      return s * (Ki(e * 11 / (Math.PI * 2)) * Ki(n * 2.6 + 0.5)) ** 1.2 * Nn(-0.3, 0.4, n);
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
function h0(t, e, n = Gn) {
  const s = t.length > 0, o = /* @__PURE__ */ new Map(), i = (h) => {
    let u = o.get(h);
    return u === void 0 && o.set(h, u = to(t, h)), u;
  }, r = wo(t.opening), a = (h) => t.length + (t.texture === "wavy" || t.texture === "curly" || t.texture === "locs" ? 0.12 * Math.sin(h * 9) : 0), l = (h, u, f) => {
    if (t.flat <= 0 || u < 0.45) return null;
    const d = (u - 0.45) / 0.55, g = Math.sqrt(1 - 0.45 * 0.45) * f * (1 - d ** 5), p = 0.45 + (1 + t.flat - 0.45) * Math.min(1, d * 1.8);
    return [g * Math.sin(h), p * (1 + e), g * Math.cos(h)];
  }, c = {
    top: 1,
    bottom: s ? -(t.length + 0.25) : -1,
    inside(h, u) {
      const f = u - i(h);
      if (!s) return f;
      const d = Math.min(u + a(h), Qs(h, 0) - r);
      return Math.max(f, d);
    },
    position(h, u) {
      if (s && u < 0) {
        const k = t.length < 1.5 ? 0.14 * Nn(-t.length + 0.45, -t.length - 0.1, u) : 0, y = 1 + e + t.volume * (1 - k * 2.5) + vl(t, h, u) - k;
        return [y * Math.sin(h), u, y * Math.cos(h)];
      }
      const f = 0.4 + 0.6 * Nn(0, 0.3, u - to(t, h)), d = 1 + e + (t.volume + vl(t, h, u)) * f, g = l(h, u, d);
      if (g) return g;
      const [p, m, b] = fe(h, u), T = [p * d, m * d, b * d];
      if (t.quiff > 0) {
        const k = t.quiff * Math.exp(-((h / 0.7) ** 2)) * Nn(0.15, 0.85, u);
        T[1] += k * 0.7, T[2] += k * 0.45;
      }
      return T;
    },
    normal(h, u) {
      return s && u < 0 ? [Math.sin(h), 0, Math.cos(h)] : fe(h, u);
    }
  };
  return s && !l0(n) ? B1(c, t, n) : c;
}
function B1(t, e, n) {
  const s = (i) => i < 0 ? Nn(-0.15, -Math.max(0.7, e.length), i) : 0, o = (i) => wo(n.swing) * s(i);
  return {
    top: t.top,
    bottom: t.bottom,
    inside: (i, r) => t.inside(i + o(r), r),
    position(i, r) {
      const a = s(r);
      if (a === 0) return t.position(i, r);
      const l = o(r), [c, h, u] = Yi(t.position(i + l, r), l);
      return [c, h + n.lift * a, u - n.trail * a];
    },
    normal: (i, r) => Yi(t.normal(i + o(r), r), o(r))
  };
}
const j1 = (t) => t.texture === "spiky" || t.texture === "curly" || t.texture === "locs" ? 104 : t.texture === "wavy" ? 80 : 64;
function u0(t, e, n, s) {
  return Lr(t, Y1(e, s), () => bo(t, n, j1(e)));
}
const Ml = /* @__PURE__ */ new WeakMap();
let q1 = 1;
function Y1(t, e) {
  if (l0(e)) return t;
  let n = Ml.get(t);
  return n || Ml.set(t, n = q1++), `${n}:${e.swing}:${e.trail}:${e.lift}`;
}
function f0(t) {
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
function Zo(t, [e, n, s]) {
  const o = Wt(t, [e, n, s]);
  return { x: o.x - t.center.x, y: o.y - t.center.y };
}
function K1(t, e, n, s = 16) {
  return Array.from({ length: s + 1 }, (o, i) => {
    const r = i / s, a = 1 - r;
    return { x: a * a * t.x + 2 * a * r * e.x + r * r * n.x, y: a * a * t.y + 2 * a * r * e.y + r * r * n.y };
  });
}
function z1(t, e, n, s, o) {
  const i = t.ry, r = (e.length ?? 1.8) * i, a = Zo(t, Yi(s, wo(o.swing))), l = Zo(t, [0, o.lift, -o.trail]), c = Math.hypot(a.x, a.y) || 1, h = e.at === "high" || e.at === "low" || e.at === "top" ? Zo(t, [0.95, 0, 0]) : { x: 0 }, u = e.kind === "braid" ? 0.15 : 0.5, f = {
    x: n.x + a.x / c * i * u + h.x * 0.9 + l.x * 0.5,
    y: n.y + a.y / c * i * u * 0.6 + l.y * 0.5
  }, d = { x: n.x + a.x / c * i * u * 0.6 + h.x * 1.3 + l.x, y: n.y + r + l.y };
  return K1(n, f, d);
}
const Dr = (t) => Math.max(1, t * 0.5), d0 = (t, e) => Math.max(0.8, Math.min(t * 0.4, 0.1 * e.rx));
function p0(t, e, n, s, o, i) {
  const { point: r, out: a } = f0(s.at), l = 1 + n.volume, c = Wt(e, [r[0] * l, r[1] * l, r[2] * l]), h = Dr(o), u = d0(o, e);
  if (s.kind === "bun") {
    const p = s.size ?? 0.32, m = Wt(e, [r[0] * l + a[0] * p, r[1] * l + a[1] * p, r[2] * l + a[2] * p]);
    t.ellipse(m.x, m.y, p * e.rx, p * e.ry, e.angle, n.color, h);
    const b = p * e.rx * 0.55;
    t.line(
      Array.from({ length: 9 }, (T, k) => {
        const y = -0.4 + k / 8 * Math.PI * 1.3;
        return { x: m.x + Math.cos(y) * b, y: m.y + Math.sin(y) * b * 0.8 };
      }),
      u
    );
    return;
  }
  const f = z1(e, s, c, a, i), d = (s.size ?? (s.kind === "braid" ? 0.2 : 0.34)) * e.rx * 2;
  if (s.kind === "ponytail")
    t.shape(ue(f, d, d * 0.15), n.color, h), t.line(f.slice(3, f.length - 3), u);
  else {
    const m = f.slice(0, f.length - 3);
    for (let k = 0; k < 7; k++) {
      const y = m[Math.floor(k / 7 * (m.length - 1))], S = m[Math.floor((k + 1) / 7 * (m.length - 1))], v = Math.atan2(S.y - y.y, S.x - y.x), x = Math.hypot(S.x - y.x, S.y - y.y), M = d * (1 - k / (7 * 2.2)), w = (k % 2 === 0 ? 1 : -1) * 0.35, $ = { x: (y.x + S.x) / 2, y: (y.y + S.y) / 2 };
      t.ellipse($.x, $.y, x * 0.62, M * 0.5, v + w, n.color, h * 0.8);
    }
    const b = m[m.length - 1], T = f[f.length - 1];
    t.shape(ue([b, T], d * 0.7, d * 0.2), n.color, h * 0.8);
  }
  const g = f[s.kind === "braid" ? f.length - 4 : 2];
  t.ellipse(g.x, g.y, d * 0.32, d * 0.22, e.angle, n.color, h);
}
function g0(t, e) {
  return de(t, f0(e.at).out) < -0.2;
}
function X1(t) {
  const e = (o, i, r = 0, a = 14) => Array.from({ length: a + 1 }, (l, c) => {
    const h = c / a;
    return [o[0] + (i[0] - o[0]) * h + r * Math.sin(Math.PI * h), o[1] + (i[1] - o[1]) * h];
  }), n = wo(t.part ?? 0), s = (o) => to(t, o) + 0.04;
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
      const o = t.length > 0 ? -t.length + 0.25 : -0.4, i = [-2.6, -2, -1.4, 1.4, 2, 2.6, 3.05].map((r) => e([r, to(t, r) < 0.9 ? 0.6 : 0.9], [r, o], 0));
      return t.part !== null && i.push(e([n, s(n)], [n, 0.97])), i;
    }
    default:
      return [];
  }
}
function U1(t, e, n, s, o) {
  if (s.fill === "stipple" || s.hairline.front > 1.5) return;
  const i = o.motion ?? Gn, r = o.lineWidth * 0.45 / n.rx, { far: a } = u0(n, s, h0(s, r, i), i);
  Wr(e, n, () => {
    for (const l of s.ties) g0(n, l) && p0(t, n, s, l, o.lineWidth, i);
    for (const l of a) t.shape(l, s.color, Dr(o.lineWidth));
  });
}
function m0(t, e, n, s) {
  if (n.hairline.front > 1.5) return;
  const o = s.motion ?? Gn, i = s.lineWidth * 0.45 / e.rx, r = h0(n, i, o), a = d0(s.lineWidth, e);
  if (n.fill === "stipple") {
    for (let h = 0.97; h > -1; h -= 0.17)
      for (let u = -Math.PI; u < Math.PI; u += 0.27) {
        const f = Math.round(h * 100) % 2 * 0.13;
        if (r.inside(u + f, h) < 0.02) continue;
        const d = fe(u + f, h);
        if (de(e, d) < 0.12) continue;
        const g = Wt(e, d);
        t.dot(g.x, g.y, a * 0.4);
      }
    return;
  }
  const { near: l } = u0(e, n, r, o), c = Dr(s.lineWidth);
  for (const h of l) t.shape(h, n.color, c);
  for (const h of X1(n)) {
    const u = h.map(([d, g]) => {
      const [p, m, b] = r.position(d, g);
      return [p * 0.985, m * 0.985, b * 0.985];
    }), f = h.map(([d, g]) => r.normal(d, g));
    for (const d of a0(e, u, f, 0.12)) t.line(d, a);
  }
  for (const h of n.ties) g0(e, h) || p0(t, e, n, h, s.lineWidth, o);
}
const y0 = 0.35, Nr = (t) => ({ centre: [t * 0.98, -0.02, -0.08], out: [t, 0, -0.12] });
function b0(t, e, n, s, o) {
  const { centre: i, out: r } = Nr(n), a = de(e, r), l = Math.max(1, s.lineWidth * 0.55), c = s.skin === "none" ? null : s.skin, h = e.ry * 0.27;
  if (!o) {
    const m = Wt(e, [i[0] * 1.06, i[1], i[2]]);
    t.ellipse(m.x, m.y, e.rx * 0.17, h, e.angle, c, l);
    return;
  }
  const u = Wt(e, i), f = e.rx * (0.12 + 0.08 * a);
  t.ellipse(u.x, u.y, f, h, e.angle, c, l);
  const d = Math.cos(e.angle), g = Math.sin(e.angle), p = Array.from({ length: 9 }, (m, b) => {
    const T = -Math.PI * 0.55 + b / 8 * Math.PI * 1.1, k = Math.cos(T) * f * 0.45 * -n, y = Math.sin(T) * h * 0.55;
    return { x: u.x + k * d - y * g, y: u.y + k * g + y * d };
  });
  t.line(p, Math.max(0.8, l * 0.7));
}
function G1(t, e, n, s) {
  Wr(e, n, () => {
    for (const o of [1, -1]) de(n, Nr(o).out) < y0 && b0(t, n, o, s, !1);
  });
}
function V1(t, e, n) {
  for (const s of [1, -1]) de(e, Nr(s).out) >= y0 && b0(t, e, s, n, !0);
}
const w0 = {
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
function J1(t, e) {
  const n = typeof t == "string" ? { style: t } : t, s = n.style ? w0[n.style] : void 0;
  if (n.style && !s) throw new Error(`facialHair: unknown style '${n.style}'`);
  return {
    color: n.color ?? e ?? "#6b4630",
    moustache: n.moustache ?? s?.moustache ?? "none",
    beard: n.beard ?? s?.beard ?? "none"
  };
}
const be = (t) => t * Math.PI / 180, Hs = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
}, k0 = {
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
}, Z1 = (t, e) => {
  const n = Hs(be(48), be(100), Qs(e, 0));
  return t.top[0] + (t.top[1] - t.top[0]) * n;
}, Q1 = (t) => t === "sideburns" || t === "muttonChops";
function zi(t, e) {
  const n = k0[t];
  if (!n) return null;
  const s = be(n.reach), o = (i) => {
    const r = Qs(i, 0);
    return n.shape === "point" ? Math.exp(-((r / 0.42) ** 2)) : n.shape === "square" ? 1 - Hs(be(45), be(85), r) : Math.cos(Math.min(r, Math.PI / 2)) ** 0.7;
  };
  return {
    top: Math.max(n.top[0], n.top[1]) + 0.05,
    bottom: -1,
    inside(i, r) {
      const a = Qs(i, 0), l = Z1(n, i);
      let c = Math.min(l - r, s - a);
      if (n.band > 0 && (c = Math.min(c, r - (l - n.band))), Q1(t)) {
        const h = t === "muttonChops" ? be(70) - be(22) * Hs(0.08, -0.6, r) : be(72);
        c = Math.min(c, a - h);
      }
      return c;
    },
    position(i, r) {
      const [a, l, c] = fe(i, r), h = 1 + e + n.volume, u = n.length * o(i) * Hs(-0.45, -1, r);
      return [a * h, l * h - u, c * h + u * 0.25];
    },
    normal: (i, r) => fe(i, r)
  };
}
function ty(t) {
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
const Vn = (t) => Math.max(1, t * 0.45);
function ey(t, e, n, s) {
  for (let o = 0.1; o > -1; o -= 0.13)
    for (let i = -Math.PI / 1.7; i < Math.PI / 1.7; i += 0.2) {
      const r = Math.round(o * 100) % 2 * 0.1;
      if (n.inside(i + r, o) < 0.02) continue;
      const a = fe(i + r, o);
      if (de(e, a) < 0.15) continue;
      const l = Wt(e, a);
      t.dot(l.x, l.y, s);
    }
}
function ny(t, e, n, s, o) {
  const i = s.beard === "stubble" ? null : zi(s.beard, o.lineWidth * 0.45 / n.rx);
  if (!i) return;
  const { far: r } = Lr(n, s, () => bo(n, i));
  Wr(e, n, () => {
    for (const a of r) t.shape(a, s.color, Vn(o.lineWidth));
  });
}
function sy(t, e, n, s, o) {
  if (n.beard === "none") return;
  const i = s.lineWidth * 0.45 / e.rx;
  if (n.beard === "stubble") {
    ey(t, e, zi("full", i), Math.max(0.5, s.lineWidth * 0.09));
    return;
  }
  if (n.beard === "soulPatch") {
    const l = [{ x: -0.05, y: -0.55 }, { x: 0.05, y: -0.55 }, { x: 0, y: -0.68 }], { points: c, facing: h } = Tt(e, l, { x: 0, y: -0.6 });
    h > -0.05 && t.shape(c, n.color, Vn(s.lineWidth) * 0.7);
    return;
  }
  const r = zi(n.beard, i);
  if (!r) return;
  const { near: a } = Lr(e, n, () => bo(e, r));
  for (const l of a) t.shape(l, n.color, Vn(s.lineWidth));
  if (k0[n.beard]?.aroundMouth) {
    const l = 0.27 * Math.max(0.3, o), c = Array.from({ length: 20 }, (f, d) => {
      const g = Math.PI * 2 * d / 20;
      return { x: Math.cos(g) * l, y: -0.42 + Math.sin(g) * 0.13 };
    }), { points: h, facing: u } = Tt(e, c, { x: 0, y: -0.42 });
    u > -0.05 && t.shape(h, s.skin === "none" ? "#ffffff" : s.skin, 0);
  }
}
function oy(t, e, n, s) {
  if (n.moustache === "none") return;
  const o = { x: 0, y: -0.24 };
  if (n.moustache === "pencil") {
    const l = [-0.2, -0.1, 0, 0.1, 0.2].map((u) => ({ x: u, y: -0.25 + 0.03 * Math.cos(u / 0.2 * Math.PI) })), { points: c, facing: h } = Tt(e, l, o);
    h > -0.05 && t.line(c, Math.max(1, s.lineWidth * 0.32));
    return;
  }
  const i = ty(n.moustache);
  if (!i) return;
  const { points: r, facing: a } = Tt(e, i, o);
  if (!(a <= -0.05) && (t.shape(r, n.color, Vn(s.lineWidth) * 0.8), n.moustache === "handlebar"))
    for (const l of [1, -1]) {
      const c = Array.from({ length: 10 }, (h, u) => {
        const f = -Math.PI / 2 + u / 9 * Math.PI * 1.4;
        return { x: l * (0.27 + 0.05 * Math.cos(f)), y: -0.21 + 0.05 * (1 + Math.sin(f)) };
      });
      c.unshift({ x: l * 0.22, y: -0.27 }), t.line(Tt(e, c, o).points, Vn(s.lineWidth) * 0.8);
    }
}
const v0 = { round: !0, square: !0, sunglasses: !0 };
function iy(t) {
  const n = (typeof t == "string" ? { style: t } : t).style ?? "round";
  if (!(n in v0)) throw new Error(`glasses: unknown style '${n}'`);
  return { style: n };
}
const xl = 0.34, se = 0.12, ry = 0.05;
function ay(t, e) {
  return Array.from({ length: 28 }, (s, o) => {
    const i = Math.PI * 2 * o / 28;
    if (t === "round") return { x: e + Math.cos(i) * 0.2, y: se + Math.sin(i) * 0.19 };
    const r = Math.cos(i), a = Math.sin(i), l = t === "sunglasses" ? 0.22 : 0.21, c = t === "sunglasses" ? 0.17 : 0.16;
    return { x: e + Math.sign(r) * Math.abs(r) ** 0.45 * l, y: se - 0.01 + Math.sign(a) * Math.abs(a) ** 0.45 * c };
  });
}
function ly(t, e, n, s) {
  const o = Math.max(1, Math.min(s.lineWidth * 0.5, 0.11 * e.rx)), i = [];
  for (const r of [1, -1]) {
    const a = xl * r, { points: l, facing: c } = Tt(e, ay(n.style, a), { x: a, y: se });
    if (c < ry) continue;
    i.push(r), t.shape(l, n.style === "sunglasses" ? "#1f2328" : null, o);
    const h = [r * 0.97, se + 0.02, -0.1];
    if (de(e, [r, 0, 0]) > 0.15) {
      const u = Tt(e, [{ x: a + r * 0.21, y: se + 0.02 }], { x: a, y: se }).points[0];
      t.line([u, Wt(e, h)], o * 0.9);
    }
  }
  if (i.length === 2) {
    const r = [
      { x: xl - 0.2, y: se + 0.02 },
      { x: 0, y: se + 0.07 },
      { x: -0.14, y: se + 0.02 }
    ];
    t.line(Tt(e, r, { x: 0, y: se }).points, o);
  }
}
const Br = {
  cap: { color: "#d64535", brim: [0.36, 0.16], height: 1, peak: 0.7, detail: "seams" },
  beanie: { color: "#3a6ea5", brim: [0.3, 0.12], height: 1.08, detail: "fold" },
  hardHat: { color: "#f2c230", brim: [0.34, 0.22], height: 1.12, ring: 0.16, detail: "ridge" },
  sunHat: { color: "#e3c98f", brim: [0.36, 0.3], height: 1.02, ring: 0.62, detail: "band" },
  bowler: { color: "#2f2b2a", brim: [0.36, 0.28], height: 1.15, ring: 0.2, detail: "band" }
};
function cy(t) {
  const e = typeof t == "string" ? { style: t } : t, n = e.style ?? "cap", s = Br[n];
  if (!s) throw new Error(`hat: unknown style '${n}'`);
  return { style: n, color: e.color ?? s.color };
}
const je = (t, e) => t.brim[1] + (t.brim[0] - t.brim[1]) * (1 + Math.cos(e)) / 2;
function hy(t, e) {
  return {
    top: 1,
    bottom: Math.min(...t.brim) - 0.05,
    inside: (n, s) => s - je(t, n),
    position(n, s) {
      const [o, i, r] = fe(n, s), a = je(t, n), l = s > a ? (i - a) * (t.height - 1) : 0;
      return [o * e, i * e + l, r * e];
    },
    normal: (n, s) => fe(n, s)
  };
}
function uy(t, e, n) {
  const o = (i, r, a) => {
    const l = je(e, i) * n - a;
    return [Math.sin(i) * r, l, Math.cos(i) * r];
  };
  if (e.peak) {
    const i = [], r = [];
    for (let a = 0; a <= 24; a++) {
      const l = (-80 + 160 * a / 24) * (Math.PI / 180), c = e.peak * Math.cos(l) ** 0.6;
      i.push(Wt(t, [Math.sin(l) * (n + c * 0.25), je(e, l) * n - 0.07 * Math.cos(l), Math.cos(l) * (n + c)])), r.push(Wt(t, o(l, n, 0)));
    }
    return [...i, ...r.reverse()];
  }
  return e.ring ? Array.from({ length: 48 }, (i, r) => Wt(t, o(Math.PI * 2 * r / 48, n + e.ring, 0.07))) : null;
}
function fy(t) {
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
function M0(t, e, n, s) {
  const o = Br[n.style], r = 1 + s.lineWidth * 0.45 / e.rx + Math.max(0.05, Math.min(0.3, s.hairVolume) + 0.04), a = Math.max(1, s.lineWidth * 0.5), l = uy(e, o, r);
  l && t.shape(l, n.color, a);
  const c = hy(o, r), { near: h, far: u } = bo(e, c);
  for (const d of [...u, ...h]) t.shape(d, n.color, a);
  const f = Math.max(0.8, a * 0.7);
  for (const d of fy(o)) {
    const g = d.map(([m, b]) => {
      const [T, k, y] = c.position(m, b);
      return [T * 0.99, k * 0.99, y * 0.99];
    }), p = d.map(([m, b]) => fe(m, b));
    for (const m of a0(e, g, p, 0.1)) t.line(m, f);
  }
  if (o.detail === "seams") {
    const d = Wt(e, [0, r * 1.01, 0]);
    t.dot(d.x, d.y, a * 0.9);
  }
}
function dy(t) {
  const e = t.hair ? N1(t.hair) : null;
  return {
    hair: e,
    facialHair: t.facialHair ? J1(t.facialHair, e?.color) : null,
    glasses: t.glasses ? iy(t.glasses) : null,
    hat: t.hat ? cy(t.hat) : null,
    ears: t.ears ?? !1
  };
}
const x0 = (t) => !t.hair && !t.facialHair && !t.glasses && !t.hat && !t.ears, S0 = (t) => t.axes[2][2] < -0.3, T0 = (t) => t.ears && !t.hair?.coversEars;
function E0(t, e, n, s, o, i) {
  x0(n) || (n.hair && U1(e, t, s, n.hair, { ...i, motion: Fr(o) }), n.facialHair && ny(e, t, s, n.facialHair, i), T0(n) && G1(e, t, s, i));
}
function py(t, e, n, s, o, i, r) {
  if (x0(n)) {
    r();
    return;
  }
  const a = S0(s);
  T0(n) && V1(e, s, i), n.hair && !a && m0(e, s, n.hair, { ...i, motion: Fr(o) }), n.facialHair && sy(e, s, n.facialHair, i, o.mouthWidth ?? 1), r(), n.facialHair && oy(e, s, n.facialHair, i), n.glasses && ly(e, s, n.glasses, i), n.hat && !a && M0(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 });
}
function A0(t, e, n, s, o, i) {
  S0(s) && (n.hair && m0(e, s, n.hair, { ...i, motion: Fr(o) }), n.hat && M0(e, s, n.hat, { lineWidth: i.lineWidth, hairVolume: n.hair?.volume ?? 0 }));
}
const Sl = 40, gy = 0.215 + 0.205, Dt = (t, e) => {
  const n = {};
  for (const s of ["left", "right"]) for (const [o, i] of Object.entries(e)) n[`${t}.${s}.${o}`] = i;
  return n;
}, ut = (t, e) => t[e] ?? mt[e] ?? 0;
function $0(t, e, n = mt, s = 1) {
  const o = mo(t), i = e * Math.PI * 2, r = Math.sin(i) * s, a = Math.cos(i) * s, l = (1 + Math.cos(i * 2 * (o.bounces ?? 1))) / 2, c = o.crouch ?? 0, h = o.shoulder ?? 0, u = o.forearm ?? 0, f = { ...mt, ...n };
  f["leg.left.swing"] = o.swing * r + c * 0.6, f["leg.right.swing"] = -o.swing * r + c * 0.6, f["leg.left.knee"] = o.knee * Math.max(0, a) + c * 1.2, f["leg.right.knee"] = o.knee * Math.max(0, -a) + c * 1.2, f["leg.left.ankle"] = ut(n, "leg.left.ankle") - (o.tiptoe ?? 0), f["leg.right.ankle"] = ut(n, "leg.right.ankle") - (o.tiptoe ?? 0);
  for (const [d, g] of [["left", -1], ["right", 1]])
    ut(n, `arm.${d}.spread`) > Sl || ut(n, `arm.${d}.swing`) > Sl || (f[`arm.${d}.swing`] = h + g * o.arm * r, f[`arm.${d}.elbow`] = ut(n, `arm.${d}.elbow`) + u + o.elbow * Math.max(0, g * r));
  return f.lean = ut(n, "lean") + o.lean * s, f.bend = ut(n, "bend") + (o.bend ?? 0), f["head.nod"] = ut(n, "head.nod") - o.lean * 0.5 * s + (o.headTilt ?? 0), f.side = ut(n, "side") + (o.sway ?? 0) * Math.sin(i), f.lift = ut(n, "lift") + (o.bounce ?? 0) * s * l, f.stretch = ut(n, "stretch") * (1 + (o.squash ?? 0) * (l - 0.5)), f;
}
function P0(t, e, n = 1, s = 1) {
  const o = mo(t);
  return 4 * gy * s * e * Math.sin(o.swing * n * Math.PI / 180);
}
const Je = (t) => n0[t], jr = {
  /** Squash down in a squint, shoot up stretched with arms flung up, hang, land squashed, end surprised. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: ut(t, "lean") - 4, ...Dt("arm", { spread: 6, swing: 0, elbow: 10 }), "eye.left": 0.35, "eye.right": 0.35, "brow.left": -0.6, "brow.right": -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { lift: 0.22, stretch: 1.35, bend: -14, ...Dt("arm", { spread: 150, bend: 35, swing: 0, elbow: 0 }), ...Dt("leg", { swing: 25, knee: 60 }), ...Je("shocked") }, easing: "ease-out-cubic" },
    { after: 720, pose: { lift: 0.25, stretch: 1.25, bend: -10, ...Dt("arm", { spread: 140 }) }, easing: "ease-in-out" },
    { after: 900, pose: { lift: 0, stretch: 0.74, bend: 12, ...Dt("arm", { spread: 70, bend: 0 }), ...Dt("leg", { swing: 30, knee: 60 }) }, easing: "ease-in-quad" },
    {
      after: 1060,
      pose: {
        stretch: 1.06,
        bend: -3,
        ...Dt("arm", { spread: 60 }),
        "leg.left.swing": ut(t, "leg.left.swing"),
        "leg.right.swing": ut(t, "leg.right.swing"),
        "leg.left.knee": ut(t, "leg.left.knee"),
        "leg.right.knee": ut(t, "leg.right.knee")
      },
      easing: "ease-out"
    },
    { after: 1260, pose: { stretch: ut(t, "stretch"), bend: ut(t, "bend"), ...Je("surprised"), ...Dt("arm", { spread: 55, bend: 60 }) }, easing: "ease-in-out" }
  ],
  /** Glance ahead, look away unbothered, then snap back in shock with a little hop. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0, "head.turn": 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, "head.turn": 30, "head.nod": ut(t, "head.nod") - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { "head.turn": 0, "head.nod": ut(t, "head.nod") - 10, bend: ut(t, "bend") - 10, lift: 0.05, stretch: 1.18, ...Je("shocked"), lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
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
        ...Je("angry"),
        lookX: 1
      },
      easing: "ease-out"
    },
    { after: 620, pose: { lean: -20, bend: -18, stretch: 0.9 } },
    { after: 700, pose: { lean: 28, bend: 14, "head.nod": 6, "arm.left.swing": -30, "arm.right.swing": 60, "leg.left.swing": -20, "leg.left.knee": 30, "leg.right.swing": 20, stretch: 1.12 }, easing: "ease-out-cubic" }
  ],
  /** Coming down: stretched in the fall, squashed on contact, a spring back up. */
  land: (t) => [
    { after: 120, pose: { lift: 0, stretch: 0.7, bend: 14, ...Dt("arm", { spread: 75 }), ...Dt("leg", { swing: 25, knee: 50 }) }, easing: "ease-in-quad" },
    { after: 300, pose: { stretch: 1.05, bend: -4, "arm.left.spread": ut(t, "arm.left.spread"), "arm.right.spread": ut(t, "arm.right.spread") }, easing: "ease-out" },
    { after: 460, pose: { lift: 0, stretch: ut(t, "stretch"), bend: ut(t, "bend"), ...Dt("leg", { swing: 0, knee: 0 }) }, easing: "ease-in-out" }
  ],
  /** A frightened shiver: paws up, fast small shakes side to side, then still. */
  tremble: (t) => {
    const e = [{ after: 80, pose: { ...Je("scared"), ...Dt("arm", { swing: 40, elbow: 110, spread: 14 }), stretch: 0.94, bend: ut(t, "bend") + 8 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) {
      const s = n % 2 === 0 ? 1 : -1;
      e.push({ after: 80 + n * 45, pose: { side: ut(t, "side") + 2.5 * s, "head.tilt": ut(t, "head.tilt") - 2 * s } });
    }
    return e.push({ after: 755, pose: { side: ut(t, "side"), "head.tilt": ut(t, "head.tilt"), bend: ut(t, "bend") } }), e;
  },
  /** A sigh: the body sags, the back curls, the head and arms drop. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, "head.nod": ut(t, "head.nod") - 4, "brow.left": 0.3, "brow.right": 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Je("sad"), bend: 18, stretch: 0.92, lean: ut(t, "lean") + 5, "head.nod": 14, ...Dt("arm", { spread: 6, swing: 0, elbow: 4, bend: 0 }) }, easing: "ease-in-out" }
  ]
};
function my(t, e) {
  const n = vt(e.from ?? {}), s = e.speed ?? 1;
  let o = n;
  return [
    { time: e.at, pose: n },
    ...jr[t](n).map((i) => (o = { ...o, ...i.pose }, { time: e.at + i.after * s, pose: o, act: !1, ...i.easing ? { easing: i.easing } : {} }))
  ];
}
const Tl = (t, e, n) => t.slice(Math.floor((t.length - 1) * e), Math.ceil((t.length - 1) * n) + 1), qt = (t, e, n) => ({ x: t.x + (e.x - t.x) * n, y: t.y + (e.y - t.y) * n });
function yy(t) {
  return Xi(t, t.parts["leg.left"].depth) > Xi(t, t.parts["leg.right"].depth) ? "left" : "right";
}
const Xi = (t, e) => Math.abs(e) < 0.01 * t.height ? 0 : e, El = (t) => Xi(t, Math.max(t.parts["leg.left"].depth, t.parts["leg.right"].depth)) > 0, ms = (t) => Math.cos(t.turn * Math.PI / 2);
function by(t = {}) {
  const e = t.shirt ?? "#e2493b", n = t.trousers ?? "#24476b", s = t.sleeves ?? "short", o = t.bottom ?? "trousers", i = t.over === "labCoat", r = t.overColor ?? (i ? "#f4f6f8" : "#d8b48a"), a = (v) => v.lineWidth * 0.45, l = (v, x, M) => {
    const w = v.parts[`leg.${M}`].points;
    if (o !== "skirt") {
      if (o === "shorts") {
        const $ = Tl(w, 0, 0.5);
        x.shape(ue($, v.height * 0.085, v.height * 0.07), n, a(v));
        return;
      }
      x.shape(ue(w, v.height * 0.08, v.height * 0.05), n, a(v));
    }
  }, c = (v) => {
    const x = v.chains.spine, M = x[0], w = x[x.length - 1], $ = { x: M.x - (w.x - M.x) * 0.25, y: M.y - (w.y - M.y) * 0.25 };
    return { hip: M, top: w, below: $, line: [$, ...v.parts.spine.points] };
  }, h = (v, x) => {
    x.shape(ue(c(v).line, v.height * 0.15, v.height * 0.14), e, a(v));
  }, u = (v, x) => {
    const { hip: M, top: w } = c(v), $ = qt(M, w, 0.18), E = [v.points["knee.left"], v.points["knee.right"]], A = qt(M, { x: (E[0].x + E[1].x) / 2, y: (E[0].y + E[1].y) / 2 }, 1.05), H = v.height * 0.075, I = Math.max(v.height * 0.13, Math.abs(E[0].x - E[1].x) / 2 + v.height * 0.08), C = A.x - $.x, W = A.y - $.y, D = Math.hypot(C, W) || 1, Y = { x: -W / D, y: C / D };
    x.shape(
      [
        { x: $.x + Y.x * H, y: $.y + Y.y * H },
        { x: A.x + Y.x * I, y: A.y + Y.y * I },
        { x: A.x - Y.x * I, y: A.y - Y.y * I },
        { x: $.x - Y.x * H, y: $.y - Y.y * H }
      ],
      n,
      a(v)
    );
  }, f = (v, x) => {
    const M = ms(v);
    if (M < 0.2) return;
    const { top: w, hip: $ } = c(v), E = { x: ($.x - w.x) * 0.12, y: ($.y - w.y) * 0.12 }, A = v.height * 0.045 * M;
    for (const H of [-1, 1])
      x.shape(
        [
          { x: w.x + H * A * 0.2, y: w.y + E.y * 0.1 },
          { x: w.x + H * A * 1.3, y: w.y - E.y * 0.1 },
          { x: w.x + H * A * 0.6 + E.x, y: w.y + E.y }
        ],
        e,
        a(v) * 0.8
      );
  }, d = (v, x, M) => {
    const w = ms(v);
    if (w < 0.25) return;
    const { top: $, hip: E } = c(v), A = Math.sin(v.turn * Math.PI / 2) * v.height * 0.03, H = (D) => ({ x: qt($, E, D).x + A, y: qt($, E, D).y }), I = v.height * 0.022 * w, C = H(0.08), W = H(0.62);
    x.shape([{ x: C.x - I, y: C.y - I }, { x: C.x + I, y: C.y - I }, { x: C.x + I * 0.6, y: C.y + I }, { x: C.x - I * 0.6, y: C.y + I }], M, a(v) * 0.7), x.shape([{ x: C.x - I * 0.6, y: C.y + I }, { x: C.x + I * 0.6, y: C.y + I }, { x: W.x + I * 1.4, y: W.y - I * 2 }, W, { x: W.x - I * 1.4, y: W.y - I * 2 }], M, a(v) * 0.7);
  }, g = (v, x) => {
    const M = ms(v), { top: w, hip: $ } = c(v), E = qt($, w, 0.72), A = [v.points["knee.left"], v.points["knee.right"]], H = qt($, { x: (A[0].x + A[1].x) / 2, y: (A[0].y + A[1].y) / 2 }, 0.9), I = Math.sin(v.turn * Math.PI / 2) * v.height * 0.04;
    if (M < 0.15) {
      const D = qt($, w, 0.2);
      M < -0.3 && x.line([{ x: D.x - v.height * 0.05, y: D.y }, { x: D.x + v.height * 0.05, y: D.y }], a(v));
      return;
    }
    const C = v.height * 0.075 * M, W = qt($, w, 0.2);
    x.shape(
      [
        { x: E.x + I - C * 0.7, y: E.y },
        { x: E.x + I + C * 0.7, y: E.y },
        { x: W.x + I + C, y: W.y },
        { x: H.x + I + C * 1.15, y: H.y },
        { x: H.x + I - C * 1.15, y: H.y },
        { x: W.x + I - C, y: W.y }
      ],
      r,
      a(v)
    ), x.line([{ x: E.x + I - C * 0.6, y: E.y }, { x: w.x - C * 0.2, y: w.y }, { x: E.x + I + C * 0.6, y: E.y }], a(v) * 0.8);
  }, p = (v, x, M) => {
    const { top: w, hip: $ } = c(v), E = [v.points["knee.left"], v.points["knee.right"]], A = qt($, { x: (E[0].x + E[1].x) / 2, y: (E[0].y + E[1].y) / 2 }, 0.95);
    M ? x.shape(ue([qt(w, $, 0.8), $, A], v.height * 0.145, v.height * 0.17), r, a(v)) : x.shape(ue([w, qt(w, $, 0.5), $], v.height * 0.14, v.height * 0.15), r, a(v));
    const H = ms(v);
    if (H > 0.2) {
      const I = Math.sin(v.turn * Math.PI / 2) * v.height * 0.03, [C, W] = M ? [$, A] : [w, $];
      if (x.line([{ x: C.x + I, y: C.y }, { x: W.x + I, y: W.y }], a(v) * 0.8), !M) {
        const D = qt(w, $, 0.35), Y = v.height * 0.025 * H;
        x.shape([{ x: D.x + I - Y * 2.4, y: D.y }, { x: D.x + I - Y * 0.6, y: D.y }, { x: D.x + I - Y * 0.6, y: D.y + Y * 1.6 }, { x: D.x + I - Y * 2.4, y: D.y + Y * 1.6 }], r, a(v) * 0.6);
      }
    }
  }, m = (v, x, M, w, $) => {
    const E = v.parts[`arm.${M}`].points, A = E[0], H = v.chains.spine[v.chains.spine.length - 1], C = [{ x: A.x + (H.x - A.x) * 0.45, y: A.y + (H.y - A.y) * 0.45 }, ...Tl(E, 0, $)], W = ue(C, v.height * 0.085, v.height * ($ > 0.6 ? 0.045 : 0.06)), D = C.length, Y = W.slice(0, D), j = W.slice(D).reverse();
    x.shape(W, w, 0);
    const _ = (P) => Math.hypot(P[1].x - H.x, P[1].y - H.y), [L, F] = _(Y) > _(j) ? [Y, j] : [j, Y];
    x.line(L.slice(1), a(v)), x.line(F.slice(Math.ceil(D * 0.45)), a(v)), x.line([Y[D - 1], j[D - 1]], a(v));
  }, b = i ? r : e, T = i || s === "long" ? 0.95 : 0.45, k = i || s !== "none", y = (v, x) => {
    o === "skirt" && u(v, x), i && p(v, x, !0), t.over === "apron" && g(v, x);
  }, S = (v) => (x, M, w) => {
    l(M, w, v), yy(M) === v && El(M) && y(M, w);
  };
  return {
    parts: {
      "leg.left": { over: S("left") },
      "leg.right": { over: S("right") },
      spine: {
        over: (v, x, M) => {
          h(x, M), t.collar && f(x, M), t.tie && d(x, M, t.tie), i && p(x, M, !1), El(x) || y(x, M);
        }
      },
      "arm.left": { over: k ? (v, x, M) => m(x, M, "left", b, T) : void 0 },
      "arm.right": { over: k ? (v, x, M) => m(x, M, "right", b, T) : void 0 }
    }
  };
}
const I0 = {
  mug: { color: "#e2493b", hands: "one" },
  phone: { color: "#2b2f36", hands: "one" },
  book: { color: "#3a6ea5", hands: "either" },
  bag: { color: "#e9d8b4", hands: "one" },
  briefcase: { color: "#6b4630", hands: "one" },
  umbrella: { color: "#3c9a6e", hands: "one" },
  broom: { color: "#c8963e", hands: "one" },
  parcel: { color: "#c9a06a", hands: "both" }
};
function wy(t) {
  const e = {};
  for (const n of ["left", "right", "both"]) {
    const s = t[n];
    if (!s) continue;
    const o = typeof s == "string" ? s : s.item, i = I0[o];
    if (!i) throw new Error(`holding: unknown item '${o}'`);
    if (n === "both" && i.hands === "one") throw new Error(`holding: a ${o} is held in one hand ('left' or 'right'), not 'both'`);
    if (n !== "both" && i.hands === "both") throw new Error(`holding: a ${o} is held in both hands ('both')`);
    e[n] = { item: o, color: (typeof s == "object" ? s.color : void 0) ?? i.color };
  }
  return e;
}
function Qo(t, e) {
  const n = t.chains[`arm.${e}`], s = n[n.length - 1], o = n[n.length - 2], i = Math.hypot(s.x - o.x, s.y - o.y) || 1, r = { x: (s.x - o.x) / i, y: (s.y - o.y) / i }, a = t.lineWidth * 0.5;
  return { point: { x: s.x + r.x * a, y: s.y + r.y * a }, along: r, depth: t.parts[`arm.${e}`]?.depth ?? 0 };
}
function An(t, e, n, s = 0) {
  const o = Math.cos(s), i = Math.sin(s);
  return [
    [-e / 2, -n / 2],
    [e / 2, -n / 2],
    [e / 2, n / 2],
    [-e / 2, n / 2]
  ].map(([r, a]) => ({ x: t.x + r * o - a * i, y: t.y + r * i + a * o }));
}
const $n = (t, e, n, s, o = 12) => Array.from({ length: o + 1 }, (i, r) => {
  const a = n + (s - n) * r / o;
  return { x: t.x + Math.cos(a) * e, y: t.y + Math.sin(a) * e };
});
function Al(t, e, n, s, o, i = 1, r) {
  const { point: a, along: l } = n, c = s / 300;
  switch (e.item) {
    case "mug": {
      const h = An({ x: a.x, y: a.y - 4 * c }, 20 * c, 24 * c);
      t.line($n({ x: a.x + 10 * c * Math.sign(i || 1), y: a.y - 4 * c }, 7 * c, -Math.PI / 2, Math.PI / 2).map((u) => ({ x: a.x + (u.x - a.x) * Math.sign(i || 1), y: u.y })), o), t.shape(h, e.color, o);
      return;
    }
    case "phone": {
      const h = Math.atan2(l.y, l.x) - Math.PI / 2;
      t.shape(An(a, 13 * c, 24 * c, h), e.color, o), t.shape(An(a, 9 * c, 17 * c, h), "#8fd0f5", 0);
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
      t.line($n({ x: a.x, y: a.y + 6 * c }, 7 * c, Math.PI, Math.PI * 2), o), t.shape(An({ x: a.x, y: a.y + 22 * c }, 46 * c, 32 * c), e.color, o), t.line([{ x: a.x - 23 * c, y: a.y + 14 * c }, { x: a.x + 23 * c, y: a.y + 14 * c }], Math.max(0.8, o * 0.6));
      return;
    }
    case "umbrella": {
      const h = 78 * c, u = (r ?? a.y - 120 * c) - 14 * c, f = { x: a.x, y: Math.min(a.y - 60 * c, u - h * 0.55) };
      t.line([{ x: a.x, y: a.y + 10 * c }, f], o), t.line($n({ x: a.x + 5 * c, y: a.y + 10 * c }, 5 * c, Math.PI, 0, 8), o);
      const d = [...$n({ x: f.x, y: f.y + h * 0.55 }, h, Math.PI, Math.PI * 2, 24)], g = [];
      for (let p = 4; p >= 0; p--) {
        const m = f.x - h + 2 * h * p / 5;
        g.push(...$n({ x: m + h / 5, y: f.y + h * 0.55 }, h / 5, 0, -Math.PI, 6).reverse());
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
    case "parcel": {
      const h = { x: a.x, y: a.y - 6 * c };
      t.shape(An(h, 50 * c, 40 * c), e.color, o), t.line([{ x: h.x - 25 * c, y: h.y - 6 * c }, { x: h.x + 25 * c, y: h.y - 6 * c }], Math.max(0.8, o * 0.7)), t.line([{ x: h.x, y: h.y - 20 * c }, { x: h.x, y: h.y + 20 * c }], Math.max(0.8, o * 0.7));
      return;
    }
  }
}
const $l = (t, e) => (t[`held.${e}`] ?? 1) >= 0.5, Pl = (t) => Math.sin(t * Math.PI / 2);
function ky(t) {
  const e = (i) => Math.max(1, i.lineWidth * 0.45), n = (i) => (r, a, l, c, h) => {
    const u = t[i];
    u && $l(h ?? {}, i) && Al(l, u, Qo(a, i), a.height, e(a), Pl(a.turn), a.head.center.y - a.head.ry);
  }, s = (i, r, a, l, c) => {
    const h = t.both;
    if (!h || !$l(c ?? {}, "both")) return;
    const u = Qo(r, "left"), f = Qo(r, "right"), d = {
      point: { x: (u.point.x + f.point.x) / 2, y: (u.point.y + f.point.y) / 2 },
      along: { x: (u.along.x + f.along.x) / 2, y: (u.along.y + f.along.y) / 2 },
      depth: (u.depth + f.depth) / 2
    };
    Al(a, h, d, r.height, e(r), Pl(r.turn), r.head.center.y - r.head.ry);
  }, o = { parts: {} };
  if (t.left && (o.parts["arm.left"] = { over: n("left") }), t.right && (o.parts["arm.right"] = { over: n("right") }), t.both) {
    const i = (r) => (a, l, c, h, u) => {
      const f = r === "left" ? "right" : "left";
      (r === "left" ? l.parts["arm.left"].depth >= l.parts["arm.right"].depth : l.parts["arm.right"].depth > l.parts[`arm.${f}`].depth) && s(a, l, c, h, u);
    };
    for (const r of ["left", "right"]) o.parts[`arm.${r}`] = { ...o.parts[`arm.${r}`], over: vy(o.parts[`arm.${r}`]?.over, i(r)) };
  }
  return o;
}
function vy(t, e) {
  return t ? (n, s, o, i, r) => {
    t(n, s, o, i, r), e(n, s, o, i, r);
  } : e;
}
function Il(t, e) {
  const n = (o, i) => o && i ? (r, a, l, c, h) => {
    o(r, a, l, c, h), i(r, a, l, c, h);
  } : o ?? i, s = {};
  for (const o of /* @__PURE__ */ new Set([...Object.keys(t.parts ?? {}), ...Object.keys(e.parts ?? {})])) {
    const i = t.parts?.[o], r = e.parts?.[o];
    s[o] = { under: n(i?.under, r?.under), over: n(i?.over, r?.over) };
  }
  return { behind: n(t.behind, e.behind), parts: s, front: n(t.front, e.front) };
}
function O0(t = {}) {
  if (t.build && !(t.build in Bi)) throw new Error(`character: unknown build '${t.build}'`);
  const e = t.build ? Bi[t.build] : {}, n = (t.proportions ?? "bold") === "bold", s = t.figure ?? "fluid", o = t.look ?? "clean", i = t.height ?? 300, r = s === "stick", a = t.outfit ? by(t.outfit) : null, l = t.holding ? wy(t.holding) : {};
  let c = a ? Il(a, t.layers ?? {}) : t.layers ?? {};
  return Object.keys(l).length > 0 && (c = Il(c, ky(l))), {
    plan: t.plan ?? M1({
      headSize: t.headSize ?? e.headSize ?? (n ? 0.3 : 0.24),
      shoulderWidth: r ? 0 : t.shoulderWidth ?? e.shoulderWidth ?? 0.06,
      hipWidth: r ? 0 : t.hipWidth ?? e.hipWidth ?? 0.022,
      legLength: t.legLength ?? e.legLength ?? 1,
      armLength: t.armLength ?? e.armLength ?? 1
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
    head: dy(t)
  };
}
function Wv(t, e, n, s) {
  const { point: o, facing: i } = Cr(t, [e, n, s]);
  return { point: o, facing: i };
}
const Ui = (t) => t.rest[1] < -0.5, My = 0.3;
function xy(t, e, n) {
  return t.figure === "stick" ? Ui(e) ? n.slice(0, 3) : n : Ui(e) && n.length >= 3 ? gn(n[0], n[1], n[2], My) : n.length === 3 ? gn(n[0], n[1], n[2], 1) : n;
}
function qr(t, e) {
  const n = t.plan.id === "human" ? { ...mt, ...e } : e;
  return ko(t, n, Or(t.plan, n, { height: t.height, contact: t.contact }));
}
function ko(t, e, n) {
  const s = {}, o = {}, i = {}, r = 0.01 * t.height;
  t.plan.chains.forEach((f) => {
    const d = n.chains[f.id];
    s[f.id] = d.points;
    const g = d.depths.reduce((T, k) => T + k, 0) / d.depths.length, p = f.parent ? n.chains[f.parent] : void 0, m = p ? p.depths[f.at ?? p.depths.length - 1] : 0, b = g - m;
    i[f.id] = Math.abs(b) < r ? 0 : b, o[f.id] = { points: xy(t, f, d.points), depth: g };
  }), o.head = { points: [n.head.center], depth: n.head.depth }, i.head = 0;
  const a = [...t.plan.chains.map((f) => f.id), "head"], l = [...a].sort((f, d) => i[f] - i[d] || a.indexOf(f) - a.indexOf(d)), c = { hip: n.hip };
  for (const [f, [d, g]] of Object.entries(t.plan.landmarks ?? {})) {
    const p = n.chains[d]?.points;
    p && (c[f] = p[Math.min(g, p.length - 1)]);
  }
  const h = {};
  for (const [f, d] of Object.entries(c)) h[f] = d.y >= n.groundY - 0.01 * t.height;
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
function vo(t, e) {
  return qr(t, e).joints;
}
function _0(t, e, n) {
  const { head: s } = n;
  t.guideEllipse(s.center.x, s.center.y, s.rx * 1.03, s.ry * 1.03, s.angle);
  const o = Array.from({ length: 13 }, (l, c) => ({ x: 0, y: -0.95 + 1.9 * c / 12 })), i = Array.from({ length: 13 }, (l, c) => ({ x: -0.95 + 1.9 * c / 12, y: 0.12 })), r = Tt(s, o, { x: 0, y: 0 });
  r.facing > 0 && t.guide(r.points), t.guide(Tt(s, i, { x: 0, y: 0.12 }).points), t.guide(n.chains.spine ?? []);
  const a = e.lineWidth * 0.9;
  for (const l of ["shoulder.left", "shoulder.right", "elbow.left", "elbow.right", "hip.left", "hip.right", "knee.left", "knee.right"]) {
    const c = n.points[l];
    c && t.guideEllipse(c.x, c.y, a, a, 0);
  }
}
function H0(t, e, n, s, o, i) {
  const r = n.lineWidth;
  if (o === "head") {
    const { head: d } = s, g = n.skin === "none" ? null : n.skin;
    e.ellipse(d.center.x, d.center.y, d.rx, d.ry, d.angle, g, r), py(t, e, n.head, d, i, { lineWidth: r, skin: n.skin }, () => {
      e.look !== "silhouette" && R1(e, d, i, r);
    });
    return;
  }
  const a = n.plan.chains.find((d) => d.id === o), l = s.chains[o], c = s.parts[o].points;
  if (n.figure === "stick") {
    if (o === "neck") return;
    const d = o === "spine" ? [...l, ...s.chains.neck?.slice(1) ?? []] : c;
    e.line(d, r);
    return;
  }
  const h = (d, g) => [a.bones[d].width[0] * r, a.bones[g].width[1] * r];
  if (Ui(a)) {
    const [d, g] = h(0, 1);
    if (e.limb(c, d, g), a.bones.length >= 3)
      e.limb([l[2], l[3]], a.bones[2].width[0] * r, a.bones[2].width[1] * r);
    else if (n.hands === "cartoon" && o.startsWith("arm."))
      Ty(t, e, n, l, o.endsWith(".left") ? "left" : "right", i);
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
    const b = s.points["shoulder.left"], T = s.points["shoulder.right"];
    b && T && Math.hypot(b.x - T.x, b.y - T.y) > 0.5 && e.limb(gn(b, l[l.length - 1], T, 1, 10), r * 1.15, r * 1.15);
    return;
  }
  const [u, f] = h(0, a.bones.length - 1);
  e.limb(c, u, f);
}
function Sy(t, e) {
  const n = `hand.${e}.`, s = {};
  for (const [r, a] of Object.entries(t)) r.startsWith(n) && (s[r.slice(n.length)] = a);
  const o = t.turn ?? 0, i = e === "right" ? 1 - o : 1 + o;
  return { ...$t, ...s, turn: i + (s.turn ?? 0) };
}
function Ty(t, e, n, s, o, i) {
  const r = s[s.length - 1], a = s[s.length - 2], l = Math.atan2(r.x - a.x, -(r.y - a.y)) * 180 / Math.PI;
  xr(t, r, Sy(i, o), {
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
function Ey(t, e, n, s = 0) {
  const o = e.plan.id === "human" ? { ...mt, ...n } : n;
  C0(t, e, o, qr(e, o), s);
}
function Yr(t, e) {
  const n = e / t.height;
  return { ...t, height: e, lineWidth: t.lineWidth * n };
}
function Fv(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...mt, ...e } : e, i = Hr(t.plan, o, { height: s.height, contact: t.contact }, n);
  return ko(Yr(t, i.height), o, i).joints;
}
function Dv(t, e, n, s, o) {
  const i = e.plan.id === "human" ? { ...mt, ...n } : n, r = Hr(e.plan, i, { height: o.height, contact: e.contact }, s), a = Yr(e, r.height);
  C0(t, a, i, ko(a, i, r), o.time ?? 0);
}
function Ay(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...mt, ...e } : e, i = Hr(t.plan, o, { height: s.height, contact: t.contact }, n), r = Yr(t, i.height), { joints: a, order: l } = ko(r, o, i), c = i.height / s.height;
  return l.map((h, u) => ({
    part: h,
    depth: (a.parts[h]?.depth ?? 0) / c,
    draw(f, d = 0) {
      const g = go(f, { look: r.look, ink: r.ink, lineWidth: r.lineWidth, seed: te(`${r.seed}:${h}`), time: d, pencil: r.pencil }), p = (b) => {
        b && (f.save(), b(f, a, g, d, o), f.restore());
      };
      f.save(), f.lineCap = "round", f.lineJoin = "round", u === 0 && (r.look === "pencil" && r.pencil.construction !== !1 && _0(g, r, a), p(r.layers.behind), E0(f, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }));
      const m = r.layers.parts?.[h];
      p(m?.under), H0(f, g, r, a, h, o), p(m?.over), u === l.length - 1 && (A0(f, g, r.head, a.head, o, { lineWidth: r.lineWidth, skin: r.skin }), p(r.layers.front)), f.restore();
    }
  }));
}
function C0(t, e, n, s, o) {
  const { joints: i, order: r } = s, a = go(t, {
    look: e.look,
    ink: e.ink,
    lineWidth: e.lineWidth,
    seed: e.seed,
    time: o,
    pencil: e.pencil
  }), l = (c) => {
    c && (t.save(), c(t, i, a, o, n), t.restore());
  };
  t.save(), t.lineCap = "round", t.lineJoin = "round", e.look === "pencil" && e.pencil.construction !== !1 && _0(a, e, i), l(e.layers.behind), E0(t, a, e.head, i.head, n, { lineWidth: e.lineWidth, skin: e.skin });
  for (const c of r) {
    const h = e.layers.parts?.[c];
    l(h?.under), H0(t, a, e, i, c, n), l(h?.over);
  }
  A0(t, a, e.head, i.head, n, { lineWidth: e.lineWidth, skin: e.skin }), l(e.layers.front), t.restore();
}
function Nv(t, e, n) {
  const s = { ...t };
  for (const [o, i] of Object.entries(e)) {
    const r = t[o] ?? i;
    s[o] = r + (i - r) * n;
  }
  return s;
}
function $y(t, e, n, s) {
  const o = t.plan.id === "human" ? { ...mt, ...e } : e;
  let i;
  if (Array.isArray(s))
    i = s;
  else {
    const { skeleton: r } = qr(t, o), a = Or(t.plan, { ...o, roll: 0 }, { height: t.height, contact: "none" }), l = (o.roll ?? 0) * Math.PI / 180, c = s.x - r.hip.x, h = s.y - r.hip.y, u = a.hip.x + c * Math.cos(-l) - h * Math.sin(-l), f = a.hip.y + c * Math.sin(-l) + h * Math.cos(-l), d = Math.PI / 2 * (o.turn ?? 0), g = s.depth ?? r.chains[n].depths[r.chains[n].depths.length - 1], p = Math.cos(d), m = Math.sin(d);
    i = [u * p - g * m, -f, u * m + g * p];
  }
  return I1(t.plan, o, n, i, { height: t.height });
}
const R0 = /* @__PURE__ */ new Set(["walk", "walking", "gait"]);
function L0(t, e = mt, n) {
  let s = { ...e };
  for (const [i, r] of Object.entries(t))
    typeof r == "number" && !R0.has(i) && (s[i] = r);
  const o = Math.max(0, Math.min(1, typeof t.walking == "number" ? t.walking : 0));
  if (o > 0) {
    const i = typeof t.gait == "string" ? t.gait : void 0, r = i ? n?.[i] ?? i : void 0, a = $0(r, typeof t.walk == "number" ? t.walk : 0, s);
    s = Object.fromEntries(Object.keys({ ...s, ...a }).map((l) => [l, (s[l] ?? 0) + ((a[l] ?? 0) - (s[l] ?? 0)) * o]));
  }
  return s;
}
function Bv(t) {
  const { character: e } = t, n = e.height * 0.8, s = e.height, o = e.plan.id === "human" ? mt : {};
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
      i.translate(n / 2, s), Ey(i, e, L0(r.props ?? {}, o, t.gaits), a);
    }
  };
}
function Py(t, e, n) {
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
    c === "x" || c === "motionPathX" ? i = typeof h == "number" ? h : i : c === "y" || c === "motionPathY" ? r = typeof h == "number" ? h : r : (typeof h == "number" || R0.has(c)) && (o[c] = h);
  const a = L0(o, s.plan.id === "human" ? mt : {}, t.gaits), l = vo(s, a);
  return { pose: a, joints: Py(l, t.x + i + t.width / 2, t.y + r + t.height) };
}
function W0(t, e = mt) {
  const n = [];
  return t.forEach((s, o) => {
    const i = o === 0 ? e : n[o - 1], r = typeof s.pose == "string" ? Me[s.pose] : void 0;
    n.push(r ? { ...r, turn: i.turn ?? 0 } : { ...i, ...s.pose });
  }), n;
}
function qv(t, e, n = mt) {
  const s = W0(e, n);
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
const ti = /* @__PURE__ */ new Map();
function Iy(t) {
  const e = ti.get(t);
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
  return ti.size < 512 && ti.set(t, n), n;
}
Ke([-3, -5, -4]);
const Oy = (t, e, n) => {
  const s = Math.min(1, Math.max(0, (n - t) / (e - t)));
  return s * s * (3 - 2 * s);
};
function F0(t, e, n) {
  const s = [0, 0, 0];
  for (const o of n) {
    const i = Iy(o.color);
    let r;
    if (o.light === "ambient")
      r = o.intensity;
    else if (o.light === "directional")
      r = o.intensity * Math.max(0, -Se(e, o.direction));
    else {
      const a = wn(o.position, t), l = uo(a), c = l > 0 ? an(a, 1 / l) : e, h = o.range ? Math.max(0, 1 - l / o.range) ** 2 : 1;
      if (r = o.intensity * Math.max(0, Se(e, c)) * h, o.light === "spot") {
        const u = Math.cos(o.angle * Math.PI / 180), f = Math.cos(o.angle * 0.8 * Math.PI / 180);
        r *= Oy(u, f, -Se(c, o.direction));
      }
    }
    s[0] += i[0] * r, s[1] += i[1] * r, s[2] += i[2] * r;
  }
  return s;
}
function D0(t, e) {
  return t ? Math.min(1, Math.max(0, (e - t.near) / (t.far - t.near))) : 0;
}
function N0(t, e, n = {}) {
  t.save(), _y(t, e, n), t.restore();
}
function _y(t, e, n) {
  const s = B0(e, n);
  n.shadow !== !1 && j0(t, e, n);
  for (const o of e.under) Ol(t, o, s, n);
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
  for (const o of e.over) Ol(t, o, s, n);
}
function Ol(t, e, n, s) {
  const o = s.loose?.[e.part.id];
  if (!o) {
    Gi(t, e, n, s);
    return;
  }
  if (o.opacity <= 0) return;
  const i = e.faces.flatMap((c) => c.points);
  if (i.length === 0) return;
  const r = i.map((c) => c.x), a = i.map((c) => c.y), l = { x: (Math.min(...r) + Math.max(...r)) / 2, y: (Math.min(...a) + Math.max(...a)) / 2 };
  t.save(), t.globalAlpha *= Math.min(1, o.opacity), t.translate(l.x + o.x, l.y + o.y), t.rotate(o.rotate * Math.PI / 180), t.translate(-l.x, -l.y), Gi(t, e, n, s), t.restore();
}
function B0(t, e = {}) {
  return e.lineWidth ?? Math.max(1.3, t.sizePx * 0.022);
}
function j0(t, e, n = {}) {
  e.shadow.opacity <= 0 || e.shadow.points.length < 3 || (t.save(), t.globalAlpha = e.shadow.opacity, Mo(t, e.shadow.points, n.ink ?? "#26262b", !1), t.restore());
}
function Yv(t, e, n, s = {}) {
  t.save(), Gi(t, e, n, s), t.restore();
}
function Hy(t, e, n, s = {}) {
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
        b > -_l / 5 && b < _l && (u.layer = Math.max(u.layer, g.layer), u.depth = Math.max(u.depth, g.depth + 1e-6));
      }
    }
  i.sort((h, u) => h.layer - u.layer || h.depth - u.depth);
  const a = /* @__PURE__ */ new Map(), l = (h) => {
    let u = a.get(h.part.id);
    return u || a.set(h.part.id, u = Kr(t, h, n, s)), u;
  };
  t.save();
  const c = t.globalAlpha;
  for (const { part: h, face: u } of i) {
    t.globalAlpha = c * h.opacity;
    const f = l(h);
    if (!u) f.line(h.spine, n * 1.15);
    else {
      const d = o ? q0(h, s) : u.light ? Cy(h, u, s) : zr(h);
      d && (!o && s.look === "silhouette" ? f.shape(u.points, d, 0) : Mo(t, u.points, o || u.light ? d : Ur(d, u.tone), !0, h.cut ? 1.6 : 0.8));
      const g = (h.part.outline ?? 1) * n;
      if (g > 0)
        for (const p of u.edges ?? []) p.length > 1 && f.line(p, g);
      for (const p of u.marks ?? []) f.line(p, n * 0.7);
    }
  }
  t.restore();
}
const _l = 0.05;
function Kr(t, e, n, s) {
  return go(t, {
    look: s.look ?? "clean",
    ink: e.part.ink ?? s.ink ?? "#26262b",
    lineWidth: n,
    seed: te(`${s.seed ?? 0}:${e.part.id}`),
    time: s.time ?? 0,
    pencil: { construction: !1, rubbedOut: 0, ...s.pencil }
  });
}
function zr(t) {
  const { part: e } = t;
  return e.glow && t.glow > 0 && e.fill ? K0(e.fill, e.glow.color, t.glow) : e.fill;
}
function Cy(t, e, n) {
  const { part: s } = t;
  if (!s.fill) return;
  const o = Y0(s.fill, e.light, e.fog ?? 0, n.fog);
  return s.glow && t.glow > 0 ? K0(o, s.glow.color, t.glow) : o;
}
function q0(t, e) {
  const n = zr(t);
  return n && (Ly(n) || t.glow > 0) ? n : e.paper ?? "#fbf8ef";
}
function Gi(t, e, n, s) {
  e.opacity < 1 ? (t.save(), t.globalAlpha *= e.opacity, Hl(t, e, n, s), t.restore()) : Hl(t, e, n, s);
}
function Hl(t, e, n, s) {
  if (s.style === "stick") return Ry(t, e, n, s);
  const { part: o } = e, i = Kr(t, e, n, s), r = zr(e), a = s.look === "silhouette";
  for (const c of e.faces)
    r && (a ? i.shape(c.points, r, 0) : Mo(t, c.points, Ur(r, c.tone)));
  const l = (o.outline ?? 1) * n;
  if (l > 0)
    for (const c of e.edges) c.length > 1 && i.line(c, l);
  for (const c of e.marks) i.line(c, n * 0.7);
}
function Ry(t, e, n, s) {
  const { part: o } = e;
  if (o.solidOnly) return;
  const i = Kr(t, e, n, s);
  if (e.spine) {
    i.line(e.spine, n * 1.15);
    return;
  }
  const r = q0(e, s);
  for (const l of e.faces) Mo(t, l.points, r);
  const a = (o.outline ?? 1) * n;
  if (a > 0)
    for (const l of e.edges) l.length > 1 && i.line(l, a);
  for (const l of e.marks) i.line(l, n * 0.7);
}
function Ly(t) {
  const e = mn(t);
  return e ? (0.299 * e[0] + 0.587 * e[1] + 0.114 * e[2]) / 255 < 0.3 : !1;
}
function Mo(t, e, n, s = !0, o = 0.8) {
  t.fillStyle = n, t.beginPath(), t.moveTo(e[0].x, e[0].y);
  for (let i = 1; i < e.length; i++) t.lineTo(e[i].x, e[i].y);
  t.closePath(), t.fill(), s && (t.strokeStyle = n, t.lineWidth = o, t.lineJoin = "round", t.stroke());
}
function mn(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return;
  const n = e[1].length === 3 ? e[1].replace(/./g, (s) => s + s) : e[1];
  return [0, 2, 4].map((s) => parseInt(n.slice(s, s + 2), 16));
}
const Xr = (t) => `#${t.map((e) => Math.round(Math.max(0, Math.min(255, e))).toString(16).padStart(2, "0")).join("")}`;
function Ur(t, e) {
  const n = mn(t);
  return n ? Xr(e >= 1 ? n.map((s) => s + (255 - s) * (e - 1) * 2) : n.map((s) => s * e)) : t;
}
function Y0(t, e, n, s) {
  const o = mn(t);
  if (!o) return t;
  let i = o.map((a, l) => a * e[l]);
  const r = s ? mn(s) : void 0;
  return r && n > 0 && (i = i.map((a, l) => a + (r[l] - a) * n)), Xr(i);
}
function K0(t, e, n) {
  const s = mn(t), o = mn(e);
  return !s || !o ? n < 0.5 ? t : e : Xr(s.map((i, r) => i + (o[r] - i) * n));
}
const Wy = /* @__PURE__ */ new Set([
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
]), Fy = /* @__PURE__ */ new Set(["walk", "walking", "gait"]), Cl = (t) => typeof t == "number" ? t : void 0, Dy = 1.7;
function Ny(t, e, n) {
  const s = Array.from({ length: 24 }, (o, i) => {
    const r = i / 24 * Math.PI * 2, a = e.toView([Math.cos(r) * n, 0, Math.sin(r) * n * 0.8]);
    return a[2] < -1e-3 ? e.toScreen(a) : null;
  });
  s.some((o) => o === null) || (t.beginPath(), s.forEach((o, i) => i === 0 ? t.moveTo(o.x, o.y) : t.lineTo(o.x, o.y)), t.closePath(), t.fillStyle = "rgba(0, 0, 0, 0.22)", t.fill());
}
function By(t) {
  const e = Se([0, 1, 0], t);
  if (e > 0.999999) return fo();
  if (e < -0.999999) return Qt(zt([1, 0, 0], 180));
  const n = Bs([0, 1, 0], t);
  return Qt(zt(n, Math.acos(e) * 180 / Math.PI));
}
function jy(t, e, n, s, o) {
  const i = t.solid ?? {}, r = i.outline === !1 ? void 0 : i.outline ?? { width: 2, color: "#0f172a" }, a = { color: i.color ?? "#475569", shading: i.shading ?? "toon", outline: r }, l = { color: i.skin ?? "#f2c49b", shading: i.shading ?? "toon", outline: r }, c = { color: "#0f172a", shading: "unlit" }, h = s.height * 0.034, u = [], f = (k, y, S) => u.push({ mesh: k, world: Et(o, y), material: S }), d = (k, y, S) => f(e.sphere, pr(k, [0, 0, 0, 1], [y, y, y]), S);
  for (const k of n.chains) {
    const y = s.chains[k.id], S = k.id === "spine" ? 1.9 : 1;
    k.bones.forEach((v, x) => {
      const M = y[x], w = y[x + 1], $ = dr(M, w), [E, A] = v.width ?? [1, 1], H = h * S * (E + A) / 2;
      if ($ > 1e-6) {
        const I = dh(M, w, 0.5), C = By(Ke(wn(w, M)));
        f(e.cylinder, Et(_e(I), Et(C, De([H, $, H]))), a);
      }
      d(M, h * S * E, a), d(w, h * S * A, a);
    }), k.id.startsWith("arm.") && d(y[y.length - 1], h * 1.5, l);
  }
  const { center: g, rx: p, ry: m, axes: b } = s.head, T = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...g, 1];
  f(e.sphere, Et(T, De([p, m, p])), l);
  for (const k of [-1, 1]) {
    const y = Ke([k * 0.36, 0.15, 0.92]), S = $s(g, $s($s(an(b[0], y[0] * p * 1.04), an(b[1], y[1] * m * 1.04)), an(b[2], y[2] * p * 1.04))), v = [...b[0], 0, ...b[1], 0, ...b[2], 0, ...S, 1];
    f(e.sphere, Et(v, De([p * 0.11, m * 0.14, p * 0.03])), c);
  }
  return u;
}
const Kv = {
  kind: "character",
  validate(t) {
    const e = t;
    return e.height !== void 0 && !(e.height > 0) ? ["a character's height must be positive"] : [];
  },
  prepare(t) {
    return {
      who: O0({ ...t.character, height: 1 }),
      cylinder: Zs(i0(1, 1, 16)),
      sphere: Zs(P1(1, 20))
    };
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = c.who;
    let u = { ...mt, ...l.pose };
    for (const [M, w] of n)
      typeof w == "number" && !Wy.has(M) && !Fy.has(M) && (u[M] = w);
    const f = Math.max(0, Math.min(1, Cl(n.get("walking")) ?? l.walking ?? 0));
    if (f > 0) {
      const M = typeof n.get("gait") == "string" ? n.get("gait") : l.gait, w = $0(M, Cl(n.get("walk")) ?? 0, u);
      u = Object.fromEntries(Object.keys({ ...u, ...w }).map(($) => [$, (u[$] ?? 0) + ((w[$] ?? 0) - (u[$] ?? 0)) * f]));
    }
    const d = l.height ?? Dy, g = Et(o.view, s), p = {
      toView: (M) => Nt(g, M),
      toScreen: (M) => a(M)
    }, b = -p.toView([0, d / 2, 0])[2];
    if (b <= o.near) return null;
    const T = l.shadow === !1 ? [] : [{ depth: b + d, draw: (M) => Ny(M, p, d * 0.18) }];
    if (l.look === "solid") {
      const M = _r(h.plan, u, { height: d, contact: h.contact });
      return { meshes: jy(l, c, h.plan, M, s), drawables: T };
    }
    const k = Nt(s, [0, d * 0.6, 0]), y = Ke(wn(o.position, k)), S = F0(k, y, i).map((M) => Math.min(1, M)), v = i.length > 0 && h.skin !== "none" ? { ...h, skin: Y0(h.skin, S, D0(r, dr(k, o.position)), r?.color) } : h, x = Ay(v, u, p, { height: d });
    return {
      drawables: [
        ...T,
        // Ties keep the character's own order.
        ...x.map((M, w) => ({ depth: -M.depth - w * 1e-6, draw: ($, E) => M.draw($, E.time) }))
      ]
    };
  }
}, Bn = ([t, e, n]) => {
  const s = Math.hypot(t, e, n) || 1;
  return [t / s, e / s, n / s];
};
function qy([t, e, n]) {
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
const Ze = (t, [e, n, s]) => t === "z" ? [e, n, s] : t === "x" ? [s, n, e] : [e, s, n];
function Yy(t, e, n = "x", s = 20, o = 0) {
  const i = [], r = e / 2;
  for (const c of [-r, r])
    for (let h = 0; h < s; h++) {
      const u = Math.PI * 2 * h / s;
      i.push(Ze(n, [Math.cos(u) * t, Math.sin(u) * t, c]));
    }
  const a = [
    { corners: Array.from({ length: s }, (c, h) => s - 1 - h), normal: Ze(n, [0, 0, -1]) },
    { corners: Array.from({ length: s }, (c, h) => s + h), normal: Ze(n, [0, 0, 1]) }
  ];
  for (let c = 0; c < s; c++) {
    const h = (c + 1) % s, u = Math.PI * 2 * (c + 0.5) / s;
    a.push({ corners: [c, h, s + h, s + c], normal: Ze(n, [Math.cos(u), Math.sin(u), 0]) });
  }
  const l = [];
  if (o > 0)
    for (const c of [-r, r]) {
      const h = i.push(Ze(n, [0, 0, c * 1.01])) - 1;
      for (let u = 0; u < o; u++) {
        const f = Math.PI * 2 * u / o, d = i.push(Ze(n, [Math.cos(f) * t * 0.82, Math.sin(f) * t * 0.82, c * 1.01])) - 1;
        l.push([h, d]);
      }
    }
  return { vertices: i, faces: a, marks: l, creases: !0 };
}
function Ky([t, e, n], s = 16) {
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
    return Bn([u[0] / (t * t), u[1] / (e * e), u[2] / (n * n)]);
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
const zy = (t) => t.reduce((e, [n, s], o) => {
  const [i, r] = t[(o + 1) % t.length];
  return e + n * r - i * s;
}, 0) / 2;
function Xy(t, e) {
  const n = zy(t) < 0 ? [...t].reverse() : t, s = n.length, o = e / 2, i = [...n.map(([a, l]) => [o, l, a]), ...n.map(([a, l]) => [-o, l, a])], r = [
    // Seen from +x, (forward, up) = (z, y) runs anticlockwise when z points left on screen: so reverse for the left cap.
    { corners: Array.from({ length: s }, (a, l) => s - 1 - l), normal: [1, 0, 0] },
    { corners: Array.from({ length: s }, (a, l) => s + l), normal: [-1, 0, 0] }
  ];
  for (let a = 0; a < s; a++) {
    const l = (a + 1) % s, [c, h] = [n[l][0] - n[a][0], n[l][1] - n[a][1]];
    r.push({ corners: [a, l, s + l, s + a], normal: Bn([0, -c, h]) });
  }
  return { vertices: i, faces: r, creases: !0 };
}
function Uy(t, e) {
  const n = {
    left: ([o, i]) => [0, i, o],
    right: ([o, i]) => [0, i, o],
    front: ([o, i]) => [o, i, 0],
    back: ([o, i]) => [o, i, 0],
    up: ([o, i]) => [o, 0, i]
  }, s = { left: [1, 0, 0], right: [-1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], up: [0, 1, 0] };
  return { vertices: t.map(n[e]), faces: [{ corners: t.map((o, i) => i), normal: s[e] }] };
}
function Gy(t, e, n = 8) {
  const s = (r) => Array.isArray(e) ? e[Math.min(r, e.length - 1)] : e, o = [], i = [];
  t.forEach((r, a) => {
    const l = t[Math.min(a + 1, t.length - 1)], c = t[Math.max(a - 1, 0)], h = Bn([l[0] - c[0], l[1] - c[1], l[2] - c[2]]), u = Math.abs(h[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], f = Bn(Rl(h, u)), d = Rl(f, h);
    for (let g = 0; g < n; g++) {
      const p = Math.PI * 2 * g / n, m = Math.cos(p) * s(a), b = Math.sin(p) * s(a);
      o.push([r[0] + f[0] * m + d[0] * b, r[1] + f[1] * m + d[1] * b, r[2] + f[2] * m + d[2] * b]);
    }
  });
  for (let r = 0; r < t.length - 1; r++)
    for (let a = 0; a < n; a++) {
      const l = (a + 1) % n, c = [r * n + a, r * n + l, (r + 1) * n + l, (r + 1) * n + a], h = c.reduce((f, d) => [f[0] + o[d][0] / 4, f[1] + o[d][1] / 4, f[2] + o[d][2] / 4], [0, 0, 0]), u = [(t[r][0] + t[r + 1][0]) / 2, (t[r][1] + t[r + 1][1]) / 2, (t[r][2] + t[r + 1][2]) / 2];
      i.push({ corners: c, normal: Bn([h[0] - u[0], h[1] - u[1], h[2] - u[2]]) });
    }
  return { vertices: o, faces: i, creases: !1 };
}
function Rl(t, e) {
  return [t[1] * e[2] - t[2] * e[1], t[2] * e[0] - t[0] * e[2], t[0] * e[1] - t[1] * e[0]];
}
function Vy(t) {
  switch (t.type) {
    case "box":
      return qy(t.size);
    case "cylinder":
      return Yy(t.radius, t.length, t.axis, t.segments, t.spokes);
    case "ellipsoid":
      return Ky(t.radii, t.segments);
    case "extrude":
      return Xy(t.profile, t.width);
    case "panel":
      return Uy(t.points, t.facing);
    case "tube":
      return { ...Gy(t.points, t.radius, t.segments), joined: t.joined };
  }
}
function z0(t, e) {
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
const Re = (t) => Array.isArray(t) && t.length === 2 && t.every((e) => typeof e == "number" && Number.isFinite(e));
function eo(t, e) {
  return ((e - t) % 360 + 540) % 360 - 180;
}
function X0(t) {
  const e = t.map((n, s) => ({ frame: n, i: s })).sort((n, s) => n.frame.time - s.frame.time || n.i - s.i).map(({ frame: n }) => n);
  return e.filter((n, s) => s + 1 >= e.length || e[s + 1].time !== n.time);
}
function ln(t, e) {
  return Math.atan2(e[0] - t[0], e[1] - t[1]) * 180 / Math.PI;
}
function U0(t) {
  const e = t.filter((o, i) => i === 0 || Math.hypot(o[0] - t[i - 1][0], o[1] - t[i - 1][1]) > 1e-6);
  if (e.length < 2) return [];
  const n = e.length === 2 ? e : z0(e.map(([o, i]) => [o, 0, i]), (e.length - 1) * 12).map(([o, , i]) => [o, i]);
  let s = 0;
  return n.map((o, i) => (i > 0 && (s += Math.hypot(o[0] - n[i - 1][0], o[1] - n[i - 1][1])), { point: o, at: s }));
}
function G0(t, e) {
  let n = 1;
  for (; n < t.length - 1 && t[n].at < e; ) n++;
  const s = t[n - 1], o = t[n], i = o.at > s.at ? Math.max(0, Math.min(1, (e - s.at) / (o.at - s.at))) : 0;
  return {
    point: [s.point[0] + (o.point[0] - s.point[0]) * i, s.point[1] + (o.point[1] - s.point[1]) * i],
    direction: [o.point[0] - s.point[0], o.point[1] - s.point[1]]
  };
}
function V0(t, e) {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  let n = 0, s = 1;
  for (let o = 0; o < 40; o++) {
    const i = (n + s) / 2;
    t(i) < e ? n = i : s = i;
  }
  return (n + s) / 2;
}
const Ll = ["do", "at", "for", "to", "through", "toward", "speed", "pose", "gag"], Jy = {
  walk: 1.3,
  bouncy: 1.4,
  doubleBounce: 1.2,
  sneak: 0.6,
  strut: 1.2,
  tired: 0.8,
  run: 3.6,
  shove: 0.7
}, Vi = Object.keys(Lt), ei = Object.keys(Me), ni = Object.keys(jr), Zy = 0.25, Qy = 700 / 180, tb = 200, eb = 300;
function nb(t) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const e = [...Vi, "face", "hold", "pose", "gag", "place"], n = [];
  return t.forEach((s, o) => {
    const i = (c) => n.push({ beat: o, message: c });
    if (!s || typeof s != "object" || Array.isArray(s)) return i("Each beat must be an object like { do: 'walk', to: [x, z] }.");
    const r = s, a = { duration: "for", path: "through", position: "to", heading: "toward", direction: "toward" };
    for (const c of Object.keys(r)) Ll.includes(c) || i(ft("beat field", c, Ll, a[c]));
    const l = typeof r.do == "string" ? ei.includes(r.do) ? "pose" : ni.includes(r.do) ? "gag" : r.do === "turn" ? "face" : void 0 : void 0;
    if (typeof r.do != "string" || !e.includes(r.do)) return i(ft("character 3D beat", r.do, e, l));
    Vi.includes(r.do) && (r.to === void 0 && r.through === void 0 && i(`\`${r.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), r.to !== void 0 && !Re(r.to) && i(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(r.to)}).`), r.through !== void 0 && !(Array.isArray(r.through) && r.through.length > 0 && r.through.every(Re)) && i("`through` is a list of points on the ground, each [x, z] metres.")), r.do === "place" && !Re(r.to) && i("`place` needs `to`: a point on the ground, [x, z] metres."), r.do === "face" && !(Re(r.toward) || typeof r.toward == "number") && i("`face` needs `toward`: a point [x, z] or a heading in degrees."), r.do === "pose" && !(typeof r.pose == "object" && r.pose !== null) && !ei.includes(r.pose) && i(ft("pose", r.pose, ei)), r.do === "gag" && !ni.includes(r.gag) && i(ft("gag", r.gag, ni));
  }), n;
}
function zv(t, e, n) {
  const s = nb(e);
  if (s.length > 0) throw new Error(`characterScript3D: ${s.length} problem(s) in the beats:
${s.map((y) => `  beat ${y.beat}: ${y.message}`).join(`
`)}`);
  const o = n.height ?? 1.7, i = { ...mt, ...n.pose };
  let [r, a] = n.position ?? [0, 0], l = n.heading ?? 0, c = 0;
  const h = /* @__PURE__ */ new Map(), u = [], f = (y, S, v, x = "linear") => {
    const M = h.get(y) ?? [];
    M.push({ time: S, value: v, easing: x }), h.set(y, M);
  };
  f("x", 0, r), f("z", 0, a), f("rotateY", 0, l);
  const d = (y, S) => {
    const v = eo(l, S);
    if (Math.abs(v) < 1) return y;
    const x = Math.max(tb, Math.abs(v) * Qy);
    return f("rotateY", y, l), l += v, f("rotateY", y + x, l, "ease-in-out"), y + x;
  }, g = (y, S, v, x = "ease-in-out") => {
    for (const [M, w] of Object.entries(v))
      i[M] !== w && (f(M, y, i[M] ?? 0), f(M, S, w, x), i[M] = w);
  }, p = (y, S, v) => {
    const x = U0([[r, a], ...S.through ?? [S.to]]);
    if (x.length < 2) return v;
    const M = d(v, ln(x[0].point, x[1].point)), w = x[x.length - 1].at, $ = S.speed ?? Jy[y] * Math.sqrt(o / 1.7), E = S.for ?? w / $ * 1e3, A = P0(y, o), H = Ht("ease-in-out"), I = Math.min(eb, E / 4);
    u.push({ time: M, value: y }), f("walking", M, 0), f("walking", M + I, 1, "ease-out"), f("walking", M + E - I, 1), f("walking", M + E, 0, "ease-in");
    const C = c;
    let W = l;
    for (let D = 0; ; D = Math.min(w, D + Zy)) {
      const Y = M + V0(H, D / w) * E, { point: j, direction: _ } = G0(x, D);
      if (W += eo(W, ln([0, 0], _)), f("x", Y, j[0]), f("z", Y, j[1]), f("rotateY", Y, W), f("walk", Y, C + D / A), D >= w) break;
    }
    return c = C + w / A, [r, a] = x[x.length - 1].point, l = W, M + E;
  }, m = [];
  let b = 0;
  for (const y of e) {
    const S = y.at ?? b;
    let v = S;
    if (Vi.includes(y.do)) v = p(y.do, y, S);
    else if (y.do === "face") v = d(S, typeof y.toward == "number" ? y.toward : ln([r, a], y.toward));
    else if (y.do === "hold") v = S + (y.for ?? 1e3);
    else if (y.do === "place")
      f("x", S, r), f("z", S, a), [r, a] = y.to, f("x", S + 1, r), f("z", S + 1, a), typeof y.toward == "number" && (f("rotateY", S, l), l = y.toward, f("rotateY", S + 1, l)), v = S + 1;
    else if (y.do === "pose") {
      v = S + (y.for ?? 500);
      const x = typeof y.pose == "string" ? Me[y.pose] : y.pose;
      g(S, v, x);
    } else if (y.do === "gag") {
      const x = my(y.gag, { at: S, from: { ...i } });
      let M = x[0];
      for (const w of x.slice(1))
        g(M.time, w.time, Object.fromEntries(Object.entries(w.pose).filter(([$, E]) => i[$] !== E)), w.easing ?? "ease-in-out"), M = w;
      v = M.time;
    }
    m.push({ do: y.do, start: S, end: v }), b = v;
  }
  const T = `${n.scene}/${t}`, k = [...h].map(([y, S]) => ({ id: `${t}-${y}`, target: T, property: y, keyframes: X0(S) }));
  return u.length > 0 && k.push({ id: `${t}-gait`, target: T, property: "gait", keyframes: u }), { tracks: k, duration: b, beats: m, end: { position: [r, a], heading: l, pose: { ...i } } };
}
const sb = { x: 0, y: 0, scale: 1, rotate: 0, shakeX: 0, shakeY: 0, shakeRotate: 0 };
function Xv(t) {
  const e = (n) => {
    const s = t?.get(n);
    return typeof s == "number" ? s : sb[n];
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
function Uv(t, e, n) {
  const s = n.width / 2, o = n.height / 2, r = 1 + 2 * Math.max(Math.abs(e.shakeX), Math.abs(e.shakeY)) / Math.max(1, Math.min(n.width, n.height));
  t.translate(s + e.x + e.shakeX, o + e.y + e.shakeY), t.rotate((e.rotate + e.shakeRotate) * Math.PI / 180), t.scale(e.scale * r, e.scale * r), t.translate(-s, -o);
}
function Gv(t, e, n) {
  const s = e.width / 2, o = e.height / 2, i = (t.rotate + t.shakeRotate) * Math.PI / 180, r = (n.x - s) * t.scale, a = (n.y - o) * t.scale;
  return {
    x: s + t.x + t.shakeX + r * Math.cos(i) - a * Math.sin(i),
    y: o + t.y + t.shakeY + r * Math.sin(i) + a * Math.cos(i)
  };
}
function ob(t, e, n = {}, s) {
  const o = n.length ?? 240, i = 9, r = 28, a = o - 22;
  t.save(), t.translate(e.x, e.y), t.rotate((n.angle ?? -30) * Math.PI / 180), t.fillStyle = n.color ?? "#f4c542", t.fillRect(r, -i, a - r, 2 * i), t.fillStyle = "#e8b4a0", t.fillRect(a, -i, o - a, 2 * i), t.fillStyle = "#f1dcbf", t.beginPath(), t.moveTo(0, 0), t.lineTo(r, -i), t.lineTo(r, i), t.closePath(), t.fill(), t.fillStyle = n.outline ?? "#2f2f33", t.beginPath(), t.moveTo(0, 0), t.lineTo(r * 0.35, -i * 0.35), t.lineTo(r * 0.35, i * 0.35), t.closePath(), t.fill(), t.strokeStyle = n.outline ?? "#2f2f33", t.lineWidth = 3, t.lineJoin = "round", t.lineCap = "round";
  const l = [
    [{ x: 0, y: 0 }, { x: r, y: -i }, { x: o, y: -i }, { x: o, y: i }, { x: r, y: i }, { x: 0, y: 0 }],
    [{ x: r, y: -i }, { x: r, y: i }],
    [{ x: a, y: -i }, { x: a, y: i }]
  ];
  for (const c of l) tu(t, c, s);
  t.restore();
}
function J0(t, e, n = {}, s) {
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
const Z0 = 150, ib = { pencil: 44, eraser: 30 };
function Q0(t, e, n = {}, s) {
  const o = n.tool ?? "pencil", i = n.skin ?? "#f1c9a5", r = n.outline ?? "#2f2f33", a = n.scale ?? 1, l = Math.min(1, Math.max(0, n.lift ?? 0)), c = (n.angle ?? -30) * Math.PI / 180, h = s ? s.nudge(0.6) : { x: 0, y: 0 }, u = Z0 * a * (1 + 0.05 * l);
  l > 0 && (t.save(), t.fillStyle = r, t.globalAlpha = 0.15 * l, t.beginPath(), t.ellipse(e.x, e.y, 9 * a, 4 * a, 0, 0, Math.PI * 2), t.fill(), t.restore());
  const f = { x: e.x + h.x + 6 * l * a, y: e.y + h.y - 18 * l * a }, d = _t.pencilGrip, g = (x) => {
    const M = x.fingers.thumb, w = x.fingers.index, $ = x.fingers.middle, E = Wl([M.points[3], w.points[3], $.points[3]]), A = Wl([M.points[1], w.points[0]]), H = (M.depths[3] + w.depths[3] + $.depths[3]) / 3;
    return { pinch: E, direction: Math.atan2(A.y - E.y, A.x - E.x), depth: H };
  }, p = Ci(d, { size: u }), m = c - g(p).direction, b = Ci(d, { size: u, angle: m * 180 / Math.PI }), T = g(b), k = ib[o] * a, y = { x: T.pinch.x - Math.cos(c) * k, y: T.pinch.y - Math.sin(c) * k }, S = { x: f.x - y.x, y: f.y - y.y }, v = b.axes.up;
  rb(t, S, { x: -v.x, y: -v.y }, u, n.arm ?? 300 * a, i, n.sleeve ?? "#5b7db1", r), xr(t, S, d, {
    size: u,
    angle: m * 180 / Math.PI,
    skin: i,
    ink: r,
    lineWidth: 3 * a,
    prop: {
      depth: T.depth,
      draw: () => {
        t.save(), t.translate(f.x, f.y), t.scale(a, a), o === "eraser" ? J0(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, outline: r }, s) : ob(t, { x: 0, y: 0 }, { angle: c * 180 / Math.PI, length: 190, outline: r }, s), t.restore();
      }
    }
  });
}
const Wl = (t) => ({
  x: t.reduce((e, n) => e + n.x, 0) / t.length,
  y: t.reduce((e, n) => e + n.y, 0) / t.length
});
function rb(t, e, n, s, o, i, r, a) {
  const l = { x: -n.y, y: n.x }, c = s * 0.15, h = (p, m, b) => ({
    x: e.x + n.x * p + l.x * m * b,
    y: e.y + n.y * p + l.y * m * b
  }), u = h(o, 0, 0), f = (p) => {
    const m = t.createLinearGradient(e.x, e.y, u.x, u.y);
    return m.addColorStop(0, p), m.addColorStop(0.6, p), m.addColorStop(1, ab(p)), m;
  }, d = Math.min(s * 0.55, o * 0.35);
  t.save(), t.lineJoin = "round", t.lineCap = "round", t.lineWidth = 3 * (s / Z0), t.beginPath(), t.moveTo(h(-s * 0.1, -1, c).x, h(-s * 0.1, -1, c).y), t.lineTo(h(d + 4, -1, c * 1.1).x, h(d + 4, -1, c * 1.1).y), t.lineTo(h(d + 4, 1, c * 1.1).x, h(d + 4, 1, c * 1.1).y), t.lineTo(h(-s * 0.1, 1, c).x, h(-s * 0.1, 1, c).y), t.closePath(), t.fillStyle = i, t.fill(), t.strokeStyle = a, t.beginPath(), t.moveTo(h(0, -1, c).x, h(0, -1, c).y), t.lineTo(h(d, -1, c * 1.1).x, h(d, -1, c * 1.1).y), t.moveTo(h(0, 1, c).x, h(0, 1, c).y), t.lineTo(h(d, 1, c * 1.1).x, h(d, 1, c * 1.1).y), t.stroke();
  const g = [h(d, -1, c * 1.3), h(o, -1, c * 1.5), h(o, 1, c * 1.5), h(d, 1, c * 1.3)];
  t.beginPath(), g.forEach((p, m) => m ? t.lineTo(p.x, p.y) : t.moveTo(p.x, p.y)), t.closePath(), t.fillStyle = f(r), t.fill(), t.strokeStyle = f(a), t.beginPath(), t.moveTo(g[1].x, g[1].y), t.lineTo(g[0].x, g[0].y), t.lineTo(g[3].x, g[3].y), t.lineTo(g[2].x, g[2].y), t.stroke(), t.restore();
}
function Vv(t, e, n = {}) {
  const s = n.offstage ?? { x: 2e3, y: 1400 }, o = n.enter ?? 450, i = n.exit ?? 450, r = n.linger ?? 1500, a = [...t].filter((p) => p.path.length > 0).sort((p, m) => p.start - m.start), l = (p) => p.tool ?? "pencil", c = (p) => {
    const m = Math.min(1, Math.max(0, p));
    return m * m * (3 - 2 * m);
  }, h = (p, m, b) => ({ x: p.x + (m.x - p.x) * b, y: p.y + (m.y - p.y) * b }), u = a.find((p) => e >= p.start && e <= p.end);
  if (u) {
    const p = u.end - u.start, m = p > 0 ? (e - u.start) / p : 1;
    return { at: vr(u.path, m), tool: l(u), lift: 0, drawing: !0 };
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
function Jv(t, e, n, s = 0.08, o = 32) {
  const i = Math.PI * 2 * (1 + s), r = [];
  for (let a = 0; a <= o; a++) {
    const l = -Math.PI / 2 + i * a / o;
    r.push({ x: t + Math.cos(l) * n, y: e + Math.sin(l) * n });
  }
  return r;
}
function Zv(t) {
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
      const u = t.sketch ? Oi(a, t.sketch, c) : void 0;
      h > 0 && (u ? t.smooth ? u.curve(e, h) : u.line(e, h) : tu(a, Kn(e, h))), r && h > 0 && h < 1 && Q0(a, vr(e, h), r, u);
    }
  };
}
function ab(t) {
  const e = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t.trim());
  if (!e) return "rgba(0, 0, 0, 0)";
  const n = e[1].length === 3 ? [...e[1]].map((r) => r + r).join("") : e[1], [s, o, i] = [0, 2, 4].map((r) => parseInt(n.slice(r, r + 2), 16));
  return `rgba(${s}, ${o}, ${i}, 0)`;
}
function tu(t, e, n) {
  if (!(e.length < 2)) {
    if (n) return n.line(e);
    t.beginPath(), t.moveTo(e[0].x, e[0].y);
    for (const s of e.slice(1)) t.lineTo(s.x, s.y);
    t.stroke();
  }
}
const ys = 1e5;
function Qv(t, e, n, s, o = 6) {
  const i = [], r = Math.max(1, Math.round(o));
  for (let a = 0; a <= r; a++)
    i.push({ x: a % 2 === 0 ? t : t + n, y: e + s * a / r });
  return i;
}
function eu(t, e, n, s) {
  if (s <= 0 || e.length === 0) return;
  const o = Kn(e, s), i = n / 2, r = (a) => {
    t.beginPath(), t.rect(-ys, -ys, 2 * ys, 2 * ys), a(), t.clip("evenodd");
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
function t5(t, e, n, s, o) {
  t.save(), eu(t, e, n, s), o(), t.restore();
}
function e5(t, e) {
  const n = e.width ?? 40, s = e.hand === !0 ? {} : e.hand || void 0, o = e.eraser === !1 ? void 0 : e.eraser === !0 || e.eraser === void 0 ? {} : e.eraser;
  return {
    ...t,
    props: { ...t.props, erase: 0 },
    draw(i, r, a) {
      const l = Number(r.props?.erase ?? 0);
      if (i.save(), eu(i, e.path, n, l), t.draw(i, r, a), i.restore(), !o || l <= 0 || l >= 1) return;
      const c = vr(e.path, l);
      s ? Q0(i, c, { ...s, tool: "eraser" }) : J0(i, c, o);
    }
  };
}
function xo() {
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
    valueAt: (n, s) => Gr(t.get(n), s),
    cutAfter(n, s) {
      for (const o of n) t.set(o, (t.get(o) ?? []).filter((i) => i.time <= s));
    },
    tracks(n) {
      return [...t].filter(([, s]) => s.length > 0).map(([s, o]) => ({
        id: `${n}-${s}`,
        target: n,
        property: s,
        keyframes: lb(o)
      }));
    }
  };
}
function Gr(t, e) {
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
function Jn(t) {
  const e = [...t ?? []].sort((n, s) => n.time - s.time);
  return e.slice(1).flatMap((n, s) => n.value !== e[s].value ? [{ start: e[s].time, end: n.time }] : []);
}
function lb(t) {
  return [...t].sort((n, s) => n.time - s.time).map((n) => ({ time: n.time, value: n.value, ...n.easing ? { easing: n.easing } : {} }));
}
const cb = 16e-4, hb = 0.6, Le = 33;
function So(t) {
  const e = (i, r) => `piece.${i.id}.${r}`, n = (i, r) => ({
    x: i.home.x + t.valueAt(e(i, "x"), r),
    y: i.home.y + t.valueAt(e(i, "y"), r)
  }), s = (i, r) => {
    const a = t.keys(e(i, "x"));
    if (!a || a.length < 2) return;
    const l = n(i, r - Le), c = n(i, r);
    return { x: (c.x - l.x) / Le, y: (c.y - l.y) / Le };
  }, o = (i, r) => t.cutAfter(["x", "y", "rotate"].map((a) => e(i, a)), r);
  return {
    at: n,
    cutAfter: o,
    follow(i, r) {
      for (const a of r)
        t.push(e(i, "x"), { time: a.time, value: a.x - i.home.x }), t.push(e(i, "y"), { time: a.time, value: a.y - i.home.y });
    },
    fling(i, r) {
      const a = n(i, r.at), l = r.velocity ?? s(i, r.at) ?? { x: 0.5, y: -0.6 }, c = r.gravity ?? cb, h = r.duration ?? 900, u = (r.spin ?? hb) * (l.x < 0 ? -1 : 1), f = t.valueAt(e(i, "rotate"), r.at);
      o(i, r.at);
      for (let d = 0; d <= h; d += Le) {
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
function Vr(t, e, { ground: n, every: s, floors: o }) {
  if (o.every((k) => k.windows.length === 0)) return t;
  const i = t.find((k) => k.target === e && k.property === "y"), r = new Ct({ id: `${e}-ride`, tracks: i ? [i] : [] }), a = (k) => i ? Number(r.getStateAtTime(k).values.get(e)?.get("y") ?? 0) : 0, l = (k) => {
    const y = n + a(k);
    return o.findIndex((S) => Math.abs(S.top - y) < 0.5);
  }, c = (i?.keyframes ?? []).map((k) => k.time), h = (k) => {
    const y = (w) => w < 0 ? 0 : o[w].offset(k), S = l(k);
    if (S >= 0) return y(S);
    if (Math.abs(a(k)) < 0.5) return 0;
    const v = (w) => l(w) >= 0 || Math.abs(a(w)) < 0.5, x = [...c].reverse().find((w) => w <= k && v(w)), M = c.find((w) => w >= k && v(w));
    return x === void 0 && M === void 0 ? 0 : x === void 0 ? y(l(M)) : M === void 0 || M === x ? y(l(x)) : y(l(x)) + (y(l(M)) - y(l(x))) * (k - x) / (M - x);
  }, u = o.flatMap((k) => k.windows), f = (k, y) => u.some((S) => S.start < y && S.end > k) || h(k) !== h(y), d = i ? [...i.keyframes] : [{ time: 0, value: 0 }], g = [{ ...d[0], value: d[0].value + h(d[0].time) }], p = (k, y) => {
    const S = /* @__PURE__ */ new Set([y]);
    for (let v = k + s; v < y; v += s) S.add(v);
    for (const v of u) for (const x of [v.start, v.end]) x > k && x < y && S.add(x);
    for (const v of [...S].sort((x, M) => x - M)) g.push({ time: v, value: a(v) + h(v) });
  };
  for (let k = 1; k < d.length; k++) {
    const y = d[k - 1].time, S = d[k].time;
    f(y, S) ? p(y, S) : g.push({ ...d[k], value: d[k].value + h(S) });
  }
  const m = d[d.length - 1].time, b = Math.max(m, ...u.map((k) => k.end));
  b > m && p(m, b);
  const T = { id: i?.id ?? `${e}-y`, target: e, property: "y", keyframes: g };
  return i ? t.map((k) => k === i ? T : k) : [...t, T];
}
function yn(t) {
  const e = t.indexOf(":");
  return e < 0 ? { kind: t, rest: "" } : { kind: t.slice(0, e), rest: t.slice(e + 1) };
}
function We(t, e, n, s) {
  const o = Object.keys(n.anchors).map((r) => yn(r).kind), { kind: i } = yn(e);
  return o.includes(i) ? new Error(`${t}: no anchor "${e}"${s ? `: ${s}` : ""} (anchors: ${Object.keys(n.anchors).join(", ")})`) : new Error(`${t}: ${ft("anchor", i, o)} (anchors: ${Object.keys(n.anchors).join(", ")})`);
}
function To(t, e, n) {
  return new Error(`${t}.edit: ${ft("edit", e, Object.keys(n.edits))}`);
}
function yt(t, e, n, s) {
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
const ub = {
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
}, Ji = ["wipe", "fly", "blur"], Cs = {
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
}, fb = 0.9, db = 8;
function n5(t) {
  const e = { ...ub, ...t.theme }, n = t.code.replace(/\t/g, "    ").replace(/\n$/, "").split(`
`), s = t.fontSize ?? 16, o = (t.lineHeight ?? 1.6) * s, i = (t.charWidth ?? 0.6) * s, r = t.padding ?? 12, a = t.lineNumbers === !1 ? 0 : (String(n.length).length + 2) * i, l = Math.max(1, ...n.map((_) => _.length)), c = t.width ?? r * 2 + a + l * i, h = r * 2 + n.length * o, u = t.x + r + a, f = new Set(t.hidden ?? []), d = t.language ?? "plain";
  if (!Zi.includes(d)) throw new Error(`codePanel: ${ft("language", d, Zi)}`);
  const g = n.map((_) => yb(_, d).flatMap((L) => Array.from(L.text, () => e[L.kind]))), p = xo(), m = So(p), b = [], T = /* @__PURE__ */ new Map(), k = [], y = [], S = (_) => {
    if (!Number.isInteger(_) || _ < 1 || _ > n.length) throw new Error(`codePanel: no line ${_} (it has ${n.length})`);
  }, v = p.tween, x = p.last, M = (_, L, F, P, R, X = 300) => {
    S(_), v(`line.${_}.${L}`, F, P, R, X);
  }, w = (_, L) => b.filter((F) => F.line < _ && F.closed <= L).length, $ = yt, E = (_) => t.y + r + (_ - 1) * o, A = (_) => Array.isArray(_) ? _ : [_], H = (_, L, F) => {
    let P = -1;
    for (let R = 0; R < F; R++)
      if (P = n[_ - 1].indexOf(L, P + 1), P < 0) throw new Error(`codePanel: line ${_} has no ${F > 1 ? `${F}th ` : ""}"${L}"`);
    return P;
  }, I = {};
  n.forEach((_, L) => {
    const F = L + 1;
    I[`line.${F}.highlight`] = 0, I[`line.${F}.strike`] = 0, I[`line.${F}.wipe`] = 0, I[`line.${F}.reveal`] = f.has(F) ? 0 : 1, I[`line.${F}.shift`] = 0;
  });
  const C = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: c,
    height: h,
    props: I,
    about: {
      kind: "code panel",
      summary: `${n.length} lines of ${d} code. Its lines and words are places in the scene (line(), token(), spot()); its edits are methods that record tracks (tracks()).`,
      // Pieces and inserts add props as they are made; these describe them by pattern.
      get props() {
        return gb(Object.keys(I));
      },
      actions: nu
    },
    draw(_, L) {
      const F = L.props ?? {}, P = (V) => Number(F[V] ?? I[V]), R = r + a, X = (V) => r + (V - 1) * o - P(`line.${V}.shift`) * o;
      _.fillStyle = e.background, Fl(_, 0, 0, c, h, 8), _.fill(), _.font = `${s}px ${e.font}`, _.textBaseline = "middle", _.textAlign = "left";
      const Q = (V, nt, at, N, Z) => {
        const U = n[V - 1];
        for (let et = nt; et < at; et++)
          U[et] !== " " && (_.fillStyle = g[V - 1][et], _.fillText(U[et], N + (et - nt) * i, Z));
      };
      _.save(), Fl(_, 0, 0, c, h, 8), _.clip(), n.forEach((V, nt) => {
        const at = nt + 1, N = P(`line.${at}.wipe`);
        if (N >= 1) return;
        const Z = X(at), U = Z + o / 2, et = Math.max(1, V.length) * i, st = Math.round(P(`line.${at}.reveal`) * V.length), ot = T.get(at) ?? { style: "wipe", from: "left" };
        _.save(), N > 0 && pb(_, ot, N, { left: R - a, top: Z, width: a + et + i, height: o }, c);
        const it = P(`line.${at}.highlight`);
        it > 0 && (_.globalAlpha *= Math.min(1, it), _.fillStyle = e.highlight, _.fillRect(R - i / 2, Z, et + i, o), _.globalAlpha /= Math.min(1, it)), a > 0 && st > 0 && (_.fillStyle = e.gutter, _.textAlign = "right", _.fillText(String(at), R - i, U), _.textAlign = "left");
        const O = [
          ...k.filter((z) => z.line === at).map((z) => ({ column: z.column, length: z.text.length, piece: z, insert: void 0 })),
          ...y.filter((z) => z.line === at).map((z) => ({ column: z.column, length: 0, piece: void 0, insert: z }))
        ].sort((z, rt) => z.column - rt.column || z.length - rt.length);
        let q = 0, G = R;
        for (const z of O) {
          Q(at, q, Math.min(z.column, st), G, U), G += (z.column - q) * i;
          let rt = z.length, K = "";
          if (z.piece) {
            const B = z.piece.written ?? "", J = P(`piece.${z.piece.id}.write`);
            B && J > 0 ? (K = B.slice(0, Math.round(J * B.length)), rt = z.length + (B.length - z.length) * Math.min(1, J * 2)) : rt = z.length * (1 - P(`piece.${z.piece.id}.away`));
          } else z.insert && (rt = z.insert.chars * P(`insert.${z.insert.id}.open`), z.insert.text && (K = z.insert.text.slice(0, Math.round(P(`insert.${z.insert.id}.type`) * z.insert.text.length))));
          _.fillStyle = e.text;
          for (let B = 0; B < K.length; B++) K[B] !== " " && _.fillText(K[B], G + B * i, U);
          G += rt * i, q = z.column + z.length;
        }
        Q(at, q, Math.max(q, st), G, U);
        const tt = P(`line.${at}.strike`);
        tt > 0 && (_.strokeStyle = e.strike, _.lineWidth = Math.max(1.5, s / 10), _.beginPath(), _.moveTo(R, U), _.lineTo(R + et * Math.min(1, tt), U), _.stroke()), _.restore();
      });
      for (const V of k) {
        const nt = P(`piece.${V.id}.opacity`);
        if (nt <= 0 || P(`line.${V.line}.wipe`) >= 1) continue;
        const at = R + (V.column + V.text.length / 2) * i + P(`piece.${V.id}.x`), N = X(V.line) + o / 2 + P(`piece.${V.id}.y`);
        _.save(), _.globalAlpha = Math.min(1, nt), _.translate(at, N), _.rotate(P(`piece.${V.id}.rotate`) * Math.PI / 180), Q(V.line, V.column, V.column + V.text.length, -V.text.length * i / 2, 0), _.restore();
      }
      _.restore();
    }
  }, W = (_) => {
    const { kind: L, rest: F } = yn(_), P = (R) => We("codePanel", _, Cs, R);
    if (L === "box") {
      if (F) throw P("box takes no arguments");
      return { kind: L };
    }
    if (L === "line") {
      if (!/^\d+$/.test(F)) throw P("write it line:N");
      return { kind: L, n: Number(F) };
    }
    if (L === "token") {
      const R = /^(\d+)(?:#(\d+))?:(.+)$/.exec(F);
      if (!R) throw P("write it token:N:TEXT, or token:N#K:TEXT for the Kth");
      return { kind: L, n: Number(R[1]), occurrence: R[2] ? Number(R[2]) : 1, text: R[3] };
    }
    if (L === "spot") {
      const R = /^(\d+):(\d+)(?::(\d+))?$/.exec(F);
      if (!R) throw P("write it spot:N:C, or spot:N:C:W for W characters");
      return { kind: L, n: Number(R[1]), column: Number(R[2]), width: R[3] ? Number(R[3]) : 1 };
    }
    throw P();
  }, D = (_, L, F, P = !1) => {
    const R = Array.isArray(L) ? L : [L];
    if (R.length === 0 || P && R.length > 1) throw new Error(`codePanel.edit: ${_} takes ${P ? "one" : "at least one"} ${F} anchor`);
    return R.map((X) => {
      const Q = W(X);
      if (Q.kind !== F) throw new Error(`codePanel.edit: ${_} takes ${F} anchors (${F}:…), not "${X}"`);
      return Q;
    });
  }, Y = (_, L) => {
    if (typeof L.text != "string") throw new Error(`codePanel.edit: ${_} needs \`text\` (the text to write)`);
    return L.text;
  }, j = {
    kind: "code",
    about: Cs,
    target: C,
    lines: n,
    box: $(t.x, t.y, c, h),
    line(_, L = 1 / 0) {
      return S(_), $(u, E(_) - w(_, L) * o, Math.max(1, n[_ - 1].length) * i, o);
    },
    token(_, L, F = 1, P = 1 / 0) {
      S(_);
      const R = H(_, L, F);
      return $(u + R * i, E(_) - w(_, P) * o, L.length * i, o);
    },
    highlight(_, L) {
      for (const F of A(_)) {
        const P = x(`line.${F}.highlight`, 0);
        M(F, "highlight", P, L.on === !1 ? 0 : 1, L, 200);
      }
      return j;
    },
    strike(_, L) {
      for (const F of A(_)) M(F, "strike", x(`line.${F}.strike`, 0), 1, L);
      return j;
    },
    remove(_, L) {
      const F = A(_), P = L.style ?? "wipe";
      if (!Ji.includes(P)) throw new Error(`codePanel.remove: ${ft("style", P, Ji)}`);
      const R = P === "wipe" ? 300 : 450, X = L.at + (L.duration ?? R), Q = L.close ?? 250;
      for (const V of F)
        M(V, "wipe", 0, 1, { ...L, easing: L.easing ?? (P === "fly" ? "ease-in" : void 0) }, R), T.set(V, { style: P, from: L.from ?? "left" }), b.push({ line: V, closed: X + Q });
      for (let V = 1; V <= n.length; V++) {
        if (F.includes(V)) continue;
        const nt = F.filter((N) => N < V).length;
        if (nt === 0) continue;
        const at = x(`line.${V}.shift`, 0);
        M(V, "shift", at, at + nt, { at: X, duration: Q, easing: "ease-in-out" });
      }
      return j;
    },
    type(_, L) {
      return M(_, "reveal", 0, 1, { duration: n[_ - 1].length * 45, ...L }), j;
    },
    piece(_, L, F = 1) {
      if (typeof _ == "string") {
        const V = W(_);
        if (V.kind !== "token") throw new Error(`codePanel.piece: a piece is a word, token:N:TEXT, not "${_}"`);
        return j.piece(V.n, V.text, V.occurrence);
      }
      const P = _;
      if (L === void 0) throw new Error('codePanel.piece: which word? piece(n, text) or piece("token:N:TEXT")');
      S(P);
      const R = H(P, L, F), X = k.find((V) => V.line === P && V.column === R && V.text === L);
      if (X) return X;
      if (k.some((V) => V.line === P && R < V.column + V.text.length && V.column < R + L.length))
        throw new Error(`codePanel: "${L}" on line ${P} overlaps another piece`);
      const Q = { id: k.length + 1, line: P, column: R, text: L, home: j.token(P, L, F, 0) };
      k.push(Q);
      for (const V of ["x", "y", "rotate", "write", "away"]) I[`piece.${Q.id}.${V}`] = 0;
      return I[`piece.${Q.id}.opacity`] = 1, Q;
    },
    follow(_, L) {
      return m.follow(_, L), j;
    },
    fling(_, L) {
      return m.fling(_, L), j;
    },
    move(_, L) {
      return m.move(_, L), j;
    },
    write(_, L, F) {
      return _.written = L, v(`piece.${_.id}.write`, 0, 1, { duration: Math.max(1, L.length) * 70, ...F }), j;
    },
    spot(_, L, F = 1, P = 1 / 0) {
      S(_);
      const R = y.filter((X) => X.line === _ && X.column <= L && X.at <= P).reduce((X, Q) => X + Q.chars, 0);
      return $(u + (L + R) * i, E(_) - w(_, P) * o, F * i, o);
    },
    insert(_, L, F, P) {
      S(_);
      const R = { id: y.length + 1, line: _, column: L, chars: F.length, text: F, at: P.at };
      y.push(R), I[`insert.${R.id}.open`] = 0, I[`insert.${R.id}.type`] = 0;
      const X = P.duration ?? F.length * 70;
      return v(`insert.${R.id}.open`, 0, 1, { at: P.at, duration: X * 0.6, easing: "ease-out" }), v(`insert.${R.id}.type`, 0, 1, { at: P.at, duration: X }), j;
    },
    drop(_, L, F, P) {
      S(L);
      const R = P.duration ?? 250, X = L === _.line, Q = P.easing ?? (X ? "linear" : "ease-out"), V = j.landing(_, L, F, P.at), nt = { id: y.length + 1, line: L, column: F, chars: _.text.length, at: P.at };
      return y.push(nt), I[`insert.${nt.id}.open`] = 0, v(`insert.${nt.id}.open`, 0, 1, { at: P.at, duration: R, easing: X ? Q : "ease-out" }), v(`piece.${_.id}.away`, x(`piece.${_.id}.away`, 0), 1, { at: P.at, duration: R, easing: X ? Q : "ease-in-out" }), m.cutAfter(_, P.at), j.move(_, { at: P.at, duration: R, easing: Q, to: { x: V.x, y: V.y } }), v(`piece.${_.id}.rotate`, p.valueAt(`piece.${_.id}.rotate`, P.at), 0, { at: P.at, duration: R }), j;
    },
    landing(_, L, F, P = 1 / 0) {
      const R = j.spot(L, F, _.text.length, P), X = L === _.line && F > _.column ? _.text.length * i : 0;
      return $(R.left - X, R.top, R.width, R.height);
    },
    ride(_, L, F) {
      const P = n.map((R, X) => {
        const Q = p.keys(`line.${X + 1}.shift`) ?? [];
        return { top: E(X + 1), offset: (V) => -Gr(Q, V) * o, windows: Jn(Q) };
      });
      return Vr(_, L, { ground: F.ground, every: F.every ?? Le, floors: P });
    },
    tracks: p.tracks,
    anchor(_, L = 1 / 0) {
      const F = W(_);
      return F.kind === "box" ? j.box : F.kind === "line" ? j.line(F.n, L) : F.kind === "token" ? j.token(F.n, F.text, F.occurrence, L) : j.spot(F.n, F.column, F.width, L);
    },
    edit(_, L, F) {
      const P = () => D(_, L, "line").map((R) => R.n);
      if (_ === "highlight") return j.highlight(P(), F);
      if (_ === "strike") return j.strike(P(), F);
      if (_ === "remove") return j.remove(P(), F);
      if (_ === "type") {
        for (const R of P()) j.type(R, F);
        return j;
      }
      if (_ === "insert") {
        const [R] = D(_, L, "spot", !0);
        return j.insert(R.n, R.column, Y(_, F), F);
      }
      if (_ === "write" || _ === "drop" || _ === "move" || _ === "fling") {
        const [R] = D(_, L, "token", !0), X = j.piece(R.n, R.text, R.occurrence);
        if (_ === "write") return j.write(X, Y(_, F), F);
        if (_ === "fling") return j.fling(X, F);
        if (_ === "drop") {
          const V = typeof F.into == "string" ? W(F.into) : void 0;
          if (V?.kind !== "spot") throw new Error("codePanel.edit: drop needs `into`, a spot anchor (spot:N:C)");
          return j.drop(X, V.n, V.column, F);
        }
        const Q = typeof F.to == "string" ? j.anchor(F.to, F.at) : F.to;
        if (!Q || typeof Q.x != "number" || typeof Q.y != "number") throw new Error("codePanel.edit: move needs `to`, an anchor name or { x, y }");
        return j.move(X, { ...F, to: Q });
      }
      throw To("codePanel", _, Cs);
    }
  };
  return j;
}
function pb(t, e, n, s, o) {
  if (e.style === "wipe") {
    t.beginPath(), e.from === "right" ? t.rect(s.left, s.top, s.width * (1 - n), s.height) : t.rect(s.left + n * s.width, s.top, s.width * (1 - n), s.height), t.clip();
    return;
  }
  const i = db * n;
  if (i > 0.2 && "filter" in t && (t.filter = `blur(${i.toFixed(1)}px)`), t.globalAlpha *= 1 - n, e.style === "fly") {
    const r = e.from === "right" ? -1 : 1;
    t.translate(r * n * fb * o, 0), t.rotate(r * n * 0.08);
  } else {
    const r = 1 + 0.08 * n, a = s.left + s.width / 2, l = s.top + s.height / 2;
    t.translate(a, l), t.scale(r, r), t.translate(-a, -l);
  }
}
const nu = {
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
function gb(t) {
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
function Fl(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
const no = {
  go: ["break", "case", "chan", "const", "continue", "default", "defer", "else", "fallthrough", "for", "func", "go", "goto", "if", "import", "interface", "map", "package", "range", "return", "select", "struct", "switch", "type", "var", "nil", "true", "false"],
  rust: ["as", "async", "await", "break", "const", "continue", "crate", "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self", "Self", "static", "struct", "super", "trait", "true", "type", "unsafe", "use", "where", "while", "Some", "None", "Ok", "Err"],
  csharp: ["abstract", "async", "await", "base", "bool", "break", "case", "catch", "class", "const", "continue", "default", "do", "else", "enum", "false", "finally", "for", "foreach", "if", "in", "int", "interface", "internal", "is", "namespace", "new", "null", "object", "out", "override", "private", "protected", "public", "readonly", "ref", "return", "sealed", "static", "string", "struct", "switch", "this", "throw", "true", "try", "using", "var", "virtual", "void", "while"],
  javascript: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
  typescript: [],
  python: ["and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "False", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass", "raise", "return", "True", "try", "while", "with", "yield"],
  plain: []
};
no.typescript = [...no.javascript, "enum", "interface", "type", "implements", "private", "public", "readonly", "keyof", "as", "declare", "namespace"];
const Zi = Object.keys(no), mb = {
  go: "//",
  rust: "//",
  csharp: "//",
  javascript: "//",
  typescript: "//",
  python: "#",
  plain: null
};
function yb(t, e) {
  const n = new Set(no[e]), s = mb[e], o = [], i = (a, l) => {
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
const si = '"Patrick Hand", "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive', bs = {
  whiteboard: {
    background: "#f7f7f2",
    frame: "#b8bcc4",
    ink: "#1f2a44",
    colors: { ink: "#1f2a44", red: "#d03b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a" },
    font: si,
    stroke: 0.09,
    opacity: 1
  },
  chalkboard: {
    background: "#2f4a3a",
    frame: "#7a5a3a",
    ink: "#f1f1e8",
    colors: { ink: "#f1f1e8", red: "#f2a3a3", blue: "#a8c8f0", green: "#b7e4a8", orange: "#f5c98a", yellow: "#f6ef9a" },
    font: si,
    stroke: 0.1,
    opacity: 0.9
  },
  lines: {
    background: "#fffdf5",
    frame: "#d9d3c0",
    ink: "#24315c",
    colors: { ink: "#24315c", red: "#c73b3b", blue: "#2f6fd0", green: "#2e9a52", orange: "#e07b1a", pencil: "#6b6b6b" },
    font: si,
    stroke: 0.08,
    opacity: 1,
    rule: { color: "#c9d6ec", spacing: 1.55, margin: "#f0a3a3" }
  }
}, Dl = ["circle", "box", "underline", "arrow"], me = {
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
}, Nl = 90, Bl = 300, bb = 0.3;
function s5(t) {
  const e = typeof t.theme == "string" ? t.theme : "whiteboard";
  if (!(e in bs)) throw new Error(`whiteboard: ${ft("theme", e, Object.keys(bs))}`);
  const n = typeof t.theme == "object" ? { ...bs.whiteboard, ...t.theme } : bs[e], s = t.fontSize ?? 28, o = t.charWidth ?? 0.55, i = (y) => y === void 0 ? n.ink : n.colors[y] ?? y, r = (y) => yt(t.x + y.left, t.y + y.top, y.width, y.height), a = xo(), l = So(a), c = {}, h = /* @__PURE__ */ new Map(), u = [], f = [], d = (y, S, v, x) => {
    const M = h.get(y);
    if (!M || M.kind !== "text") throw We("whiteboard", x, me, `there is no text "${y}" (texts: ${g().join(", ") || "none"})`);
    let w = -1;
    for (let E = 0; E < v; E++)
      if (w = M.item.text.indexOf(S, w + 1), w < 0) throw We("whiteboard", x, me, `text "${y}" has no ${v > 1 ? `${v}th ` : ""}"${S}"`);
    const $ = M.size * o;
    return { column: w, box: yt(M.box.left + w * $, M.box.top, S.length * $, M.box.height) };
  }, g = () => [...h.values()].filter((y) => y.kind === "text").map((y) => y.item.id), p = (y) => {
    const { kind: S, rest: v } = yn(y), x = (M) => We("whiteboard", y, me, M);
    if (S === "box") {
      if (v) throw x("box takes no arguments");
      return { kind: S };
    }
    if (S === "text" || S === "mark") {
      if (!v) throw x(`write it ${S}:ID`);
      return { kind: S, id: v };
    }
    if (S === "term") {
      const M = /^([^:#]+)(?:#(\d+))?:(.+)$/.exec(v);
      if (!M) throw x("write it term:ID:TEXT, or term:ID#K:TEXT for the Kth");
      return { kind: S, id: M[1], occurrence: M[2] ? Number(M[2]) : 1, text: M[3] };
    }
    throw x();
  }, m = (y) => {
    const S = p(y);
    if (S.kind === "box") return yt(0, 0, t.width, t.height);
    if (S.kind === "term") return d(S.id, S.text, S.occurrence, y).box;
    const v = h.get(S.id);
    if (!v || v.kind !== S.kind) {
      const x = [...h.values()].filter((M) => M.kind === S.kind).map((M) => M.item.id);
      throw We("whiteboard", y, me, `there is no ${S.kind} "${S.id}" (${S.kind}s: ${x.join(", ") || "none"})`);
    }
    return v.box;
  };
  for (const y of t.items ?? []) {
    if (!y || typeof y.id != "string" || !y.id || /[:#]/.test(y.id)) throw new Error(`whiteboard: every item needs an \`id\` without ":" or "#" (got ${JSON.stringify(y?.id)})`);
    if (h.has(y.id)) throw new Error(`whiteboard: two items are called "${y.id}"`);
    if ("text" in y) {
      if (!Array.isArray(y.at) || y.at.length !== 2 || !y.at.every((E) => typeof E == "number")) throw new Error(`whiteboard: text "${y.id}" needs \`at\`, [x, y] from the board's top-left`);
      const w = y.size ?? s, $ = yt(y.at[0], y.at[1], Math.max(1, y.text.length) * w * o, w * 1.3);
      h.set(y.id, { kind: "text", item: y, size: w, color: i(y.color), box: $ }), c[`text.${y.id}.write`] = y.hidden ? 0 : 1, c[`text.${y.id}.erase`] = 0;
      continue;
    }
    if (!Dl.includes(y.mark)) throw new Error(`whiteboard: mark "${y.id}": ${ft("mark", y.mark, Dl)}`);
    const S = y.mark === "arrow" ? ["from", "to"] : ["around"];
    for (const w of S) if (typeof y[w] != "string") throw new Error(`whiteboard: ${y.mark} "${y.id}" needs \`${w}\`, a place on the board (an item before it)`);
    const v = new Set([y.from, y.to].filter((w) => typeof w == "string").map((w) => w.split(":")[1])), x = y.mark === "arrow" ? [...h.values()].filter((w) => w.kind === "text" && !v.has(w.item.id)).map((w) => w.box) : [], M = wb(y, m, s, x);
    h.set(y.id, { kind: "mark", item: y, color: i(y.color), points: M, box: Mb(M) }), c[`mark.${y.id}.draw`] = y.hidden ? 0 : 1, c[`mark.${y.id}.erase`] = 0;
  }
  const b = (y) => u.filter((S) => S.item === y), T = {
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
        return xb(Object.keys(c));
      },
      actions: me.edits
    },
    draw(y, S) {
      const v = S.props ?? {}, x = (M) => Number(v[M] ?? c[M] ?? 0);
      if (y.save(), y.fillStyle = n.background, Yl(y, 0, 0, t.width, t.height, 10), y.fill(), y.lineWidth = Math.max(4, t.width * 0.012), y.strokeStyle = n.frame, y.stroke(), n.rule) {
        y.save(), y.beginPath(), Yl(y, 0, 0, t.width, t.height, 10), y.clip(), y.lineWidth = 1, y.strokeStyle = n.rule.color;
        const M = s * (n.rule.spacing ?? 1.55);
        for (let w = M; w < t.height; w += M)
          y.beginPath(), y.moveTo(0, w), y.lineTo(t.width, w), y.stroke();
        n.rule.margin && (y.strokeStyle = n.rule.margin, y.beginPath(), y.moveTo(s * 2.2, 0), y.lineTo(s * 2.2, t.height), y.stroke()), y.restore();
      }
      y.textAlign = "center", y.textBaseline = "middle", y.lineCap = "round", y.lineJoin = "round", y.globalAlpha = n.opacity;
      for (const M of h.values()) {
        if (y.save(), oi(y, M.box, x(`${M.kind}.${M.item.id}.erase`)), M.kind === "text") {
          const w = b(M.item.id), $ = x(`text.${M.item.id}.write`) * M.item.text.length;
          y.font = `${M.size}px ${n.font}`, y.fillStyle = M.color;
          for (let E = 0; E < Math.ceil($); E++)
            M.item.text[E] === " " || w.some((A) => E >= A.column && E < A.column + A.text.length) || (y.globalAlpha = n.opacity * Math.min(1, $ - E), y.fillText(M.item.text[E], M.box.left + (E + 0.5) * M.size * o, M.box.y));
        } else
          ql(y, M.points, x(`mark.${M.item.id}.draw`), M.color, s * n.stroke, M.item.mark === "arrow");
        y.restore();
      }
      for (const M of f) {
        const w = x(`strike.${M.id}.draw`);
        if (w <= 0) continue;
        const { box: $ } = M, E = $.height * 0.15;
        ql(y, [{ x: $.left - 3, y: $.y + E }, { x: $.right + 3, y: $.y - E }], w, n.colors.red ?? n.ink, s * n.stroke * 0.8, !1);
      }
      for (const M of u) {
        const w = h.get(M.item), $ = w.size * o;
        y.font = `${w.size}px ${n.font}`, y.fillStyle = w.color;
        const E = M.written;
        if (E) {
          const C = x(`piece.${M.id}.write`) * E.length, W = M.home.x - t.x - E.length * $ / 2;
          for (let D = 0; D < Math.ceil(C); D++)
            E[D] !== " " && (y.globalAlpha = n.opacity * Math.min(1, C - D), y.fillText(E[D], W + (D + 0.5) * $, M.home.y - t.y));
        }
        const A = x(`piece.${M.id}.opacity`) * Math.min(1, x(`text.${M.item}.write`) * w.item.text.length - M.column);
        if (A <= 0) continue;
        y.save();
        const H = { x: M.home.x - t.x, y: M.home.y - t.y }, I = { x: x(`piece.${M.id}.x`), y: x(`piece.${M.id}.y`) };
        oi(y, yt(H.x + I.x - M.home.width / 2, H.y + I.y - M.home.height / 2, M.home.width, M.home.height), x(`piece.${M.id}.erase`)), Math.hypot(I.x, I.y) < 1 && oi(y, w.box, x(`text.${M.item}.erase`)), y.globalAlpha = n.opacity * Math.min(1, A), y.translate(H.x + I.x, H.y + I.y), y.rotate(x(`piece.${M.id}.rotate`) * Math.PI / 180);
        for (let C = 0; C < M.text.length; C++) M.text[C] !== " " && y.fillText(M.text[C], (C + 0.5 - M.text.length / 2) * $, 0);
        y.restore();
      }
      y.restore();
    }
  }, k = {
    kind: "board",
    about: me,
    target: T,
    box: yt(t.x, t.y, t.width, t.height),
    anchor(y) {
      return r(m(y));
    },
    piece(y) {
      const S = p(y);
      if (S.kind !== "term") throw new Error(`whiteboard.piece: a piece is a term, term:ID:TEXT, not "${y}"`);
      const { column: v, box: x } = d(S.id, S.text, S.occurrence, y), M = u.find(($) => $.item === S.id && $.column === v && $.text === S.text);
      if (M) return M;
      if (u.some(($) => $.item === S.id && v < $.column + $.text.length && $.column < v + S.text.length))
        throw new Error(`whiteboard: "${S.text}" in "${S.id}" overlaps another piece`);
      const w = { id: u.length + 1, item: S.id, column: v, text: S.text, home: r(x) };
      u.push(w);
      for (const $ of ["x", "y", "rotate", "erase", "write"]) c[`piece.${w.id}.${$}`] = 0;
      return c[`piece.${w.id}.opacity`] = 1, w;
    },
    edit(y, S, v) {
      const x = Array.isArray(S) ? S : [S];
      if (x.length === 0) throw new Error(`whiteboard.edit: ${y} takes at least one anchor`);
      const M = x.map((E) => ({ name: E, anchor: p(E) }));
      for (const { name: E } of M) m(E);
      const w = (E, A = !1) => {
        const H = M.find((I) => !E.includes(I.anchor.kind));
        if (H) throw new Error(`whiteboard.edit: ${y} takes ${E.join(" or ")} anchors, not "${H.name}"`);
        if (A && M.length > 1) throw new Error(`whiteboard.edit: ${y} takes one ${E.join(" or ")} anchor`);
      }, $ = () => k.piece(M[0].name);
      if (y === "write") {
        if (M.some((E) => E.anchor.kind === "term")) {
          if (w(["term"], !0), typeof v.text != "string") throw new Error("whiteboard.edit: write into a term needs `text` (the new text)");
          const E = $();
          return E.written = v.text, a.tween(`piece.${E.id}.write`, 0, 1, { duration: Math.max(Bl, v.text.length * Nl), ...v }), k;
        }
        w(["text"]);
        for (const { anchor: E } of M) {
          const A = E.id, H = h.get(A).item.text;
          a.tween(`text.${A}.write`, 0, 1, { duration: Math.max(Bl, H.length * Nl), ...v });
        }
        return k;
      }
      if (y === "draw") {
        w(["mark"]);
        for (const { anchor: E } of M) a.tween(`mark.${E.id}.draw`, 0, 1, { duration: 500, ...v });
        return k;
      }
      if (y === "erase") {
        w(["text", "term", "mark"]);
        for (const E of M) {
          const A = E.anchor.kind === "term" ? `piece.${k.piece(E.name).id}.erase` : `${E.anchor.kind}.${E.anchor.id}.erase`;
          a.tween(A, 0, 1, { duration: 400, ...v });
        }
        return k;
      }
      if (y === "strike") {
        w(["text", "term"]);
        for (const E of M) {
          const A = { id: f.length + 1, box: m(E.name) };
          f.push(A), c[`strike.${A.id}.draw`] = 0, a.tween(`strike.${A.id}.draw`, 0, 1, { duration: 250, ...v });
        }
        return k;
      }
      if (y === "move") {
        w(["term"], !0);
        const E = typeof v.to == "string" ? k.anchor(v.to) : v.to;
        if (!E || typeof E.x != "number" || typeof E.y != "number") throw new Error("whiteboard.edit: move needs `to`, an anchor name or { x, y }");
        return k.move($(), { ...v, to: E });
      }
      if (y === "fling")
        return w(["term"], !0), k.fling($(), v);
      throw To("whiteboard", y, me);
    },
    follow(y, S) {
      return l.follow(y, S), k;
    },
    fling(y, S) {
      return l.fling(y, S), k;
    },
    move(y, S) {
      return l.move(y, S), k;
    },
    ride(y) {
      return y;
    },
    tracks: a.tracks
  };
  return k;
}
function wb(t, e, n, s = []) {
  const o = bn(te(t.id)), i = (p) => (o.next() * 2 - 1) * p, r = n * bb;
  if (t.mark === "arrow") {
    const p = e(t.from), m = e(t.to), b = jl(p, m, r * 0.6), T = jl(m, p, r * 0.6), k = Math.hypot(T.x - b.x, T.y - b.y), y = vb(b, T);
    let S = k * (0.06 + i(0.04));
    if (t.bend !== void 0) S = k * t.bend;
    else {
      const M = kb(b, T, y, s, r);
      M !== 0 && (S = M);
    }
    const v = { x: (b.x + T.x) / 2 + y.x * S, y: (b.y + T.y) / 2 + y.y * S }, x = [];
    for (let M = 0; M <= 24; M++) {
      const w = M / 24;
      x.push({ x: (1 - w) ** 2 * b.x + 2 * (1 - w) * w * v.x + w * w * T.x, y: (1 - w) ** 2 * b.y + 2 * (1 - w) * w * v.y + w * w * T.y });
    }
    return x;
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
    const p = a.left - r, m = a.right + r, b = a.top - r * 0.6, T = a.bottom + r * 0.6, k = (S, v) => ({ x: S + i(r * 0.2), y: v + i(r * 0.2) }), y = k(p, b);
    return [y, k(m, b), k(m, T), k(p, T), y, { x: y.x + r * 0.8, y: y.y + i(2) }];
  }
  const l = a.width / 2 + r, c = a.height / 2 + r * 0.6, h = -2.2 + i(0.3), u = o.next() * Math.PI * 2, f = 1.12, d = 64, g = [];
  for (let p = 0; p <= d * f; p++) {
    const m = p / d, b = h + m * Math.PI * 2, T = 1 + 0.035 * Math.sin(m * Math.PI * 4 + u) + 0.06 * m;
    g.push({ x: a.x + Math.cos(b) * l * T, y: a.y + Math.sin(b) * c * T });
  }
  return g;
}
function kb(t, e, n, s, o) {
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
function jl(t, e, n) {
  const s = e.x - t.x, o = e.y - t.y;
  if (s === 0 && o === 0) return { x: t.x, y: t.y };
  const i = Math.min(s === 0 ? 1 / 0 : (t.width / 2 + n) / Math.abs(s), o === 0 ? 1 / 0 : (t.height / 2 + n) / Math.abs(o));
  return { x: t.x + s * i, y: t.y + o * i };
}
function vb(t, e) {
  const n = Math.hypot(e.x - t.x, e.y - t.y) || 1;
  return { x: -(e.y - t.y) / n, y: (e.x - t.x) / n };
}
function Mb(t) {
  const e = t.map((i) => i.x), n = t.map((i) => i.y), s = Math.min(...e), o = Math.min(...n);
  return yt(s, o, Math.max(...e) - s, Math.max(...n) - o);
}
function ql(t, e, n, s, o, i) {
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
function oi(t, e, n) {
  if (n <= 0) return;
  const s = 8;
  t.beginPath(), t.rect(e.left - s + n * (e.width + s * 2), e.top - s * 4, (1 - n) * (e.width + s * 2), e.height + s * 8), t.clip();
}
function Yl(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function xb(t) {
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
const Kl = ["bar", "line", "pie", "donut"], zl = 'system-ui, -apple-system, "Segoe UI", sans-serif', ws = {
  light: {
    background: "#ffffff",
    text: "#3b4252",
    grid: "#d8dee9",
    color: "#4c7bd9",
    highlight: "#e8833a",
    palette: ["#4c7bd9", "#3fa66b", "#b05cc9", "#d9c04c", "#4cb8c4", "#d95c6f", "#8a7a5a", "#6b7a99"],
    font: zl
  },
  dark: {
    background: "#1e2230",
    text: "#cdd6f4",
    grid: "#3a4055",
    color: "#89b4fa",
    highlight: "#fab387",
    palette: ["#89b4fa", "#a6e3a1", "#cba6f7", "#f9e2af", "#94e2d5", "#f38ba8", "#b4a58a", "#9399b2"],
    font: zl
  }
}, on = {
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
}, Sb = 600, Tb = 500, Eb = 200, Ab = 400, $b = 0.14, Pb = Math.PI * 2;
function o5(t) {
  if (!Kl.includes(t.kind)) throw new Error(`chart: ${ft("kind", t.kind, Kl)}`);
  const e = typeof t.theme == "string" ? t.theme : "light";
  if (!(e in ws)) throw new Error(`chart: ${ft("theme", e, Object.keys(ws))}`);
  const n = typeof t.theme == "object" ? { ...ws.light, ...t.theme } : ws[e];
  if (!Array.isArray(t.data) || t.data.length === 0) throw new Error("chart: `data` needs at least one { id, value }");
  const s = t.kind, o = s === "pie" || s === "donut", i = Array.isArray(t.series) && t.series.length > 1, r = Array.isArray(t.series) && t.series.length > 0 ? t.series : [{ id: "value" }];
  if (o && i) throw new Error(`chart: a ${s} shows one series (got ${r.length}); make a chart per series`);
  const a = /* @__PURE__ */ new Set();
  for (const O of r) {
    if (typeof O?.id != "string" || !O.id || /[:.]/.test(O.id)) throw new Error(`chart: every series needs an \`id\` without ":" or "." (got ${JSON.stringify(O?.id)})`);
    if (a.has(O.id)) throw new Error(`chart: two series are called "${O.id}"`);
    a.add(O.id);
  }
  const l = new Map(r.map((O, q) => [O.id, q])), c = (O) => r[l.get(O)].color ?? (l.get(O) === 0 ? n.color : n.palette[l.get(O) % n.palette.length]), h = /* @__PURE__ */ new Set(), u = (O, q) => {
    const G = O.values?.[q.id] ?? (t.series ? void 0 : O.value) ?? O.value;
    if (typeof G != "number" || !Number.isFinite(G))
      throw new Error(i ? `chart: "${O.id}" needs a value for series "${q.id}" (\`values: { ${q.id}: … }\`)` : `chart: "${O.id}" needs a \`value\`, a number`);
    return G;
  };
  for (const O of t.data) {
    if (typeof O?.id != "string" || !O.id || /[:.]/.test(O.id)) throw new Error(`chart: every datum needs an \`id\` without ":" or "." (got ${JSON.stringify(O?.id)})`);
    if (h.has(O.id)) throw new Error(`chart: two data are called "${O.id}"`);
    for (const q of r) u(O, q);
    h.add(O.id);
  }
  const f = s === "bar" ? "bar" : s === "line" ? "point" : "slice", d = Math.max(...t.data.flatMap((O) => r.map((q) => u(O, q)))), g = o ? t.data.reduce((O, q) => O + u(q, r[0]), 0) : t.max ?? Ib(d * 1.1);
  if (!o && !(g > 0)) throw new Error(`chart: \`max\` must be above 0 (got ${g})`);
  const p = Math.max(10, Math.min(16, t.height / 20)), m = i && t.legend !== !1, b = o ? void 0 : t.axis?.x, T = o ? void 0 : t.axis?.y, k = t.title ? p * 2.3 : p * 0.5, y = {
    left: p * 3.6 + (T ? p * 1.5 : 0),
    right: t.width - p,
    top: (t.title ? p * 3 : p * 1.6) + (m ? p * 1.6 : 0),
    bottom: t.height - p * 2.4 - (b ? p * 1.4 : 0)
  }, S = y.bottom - y.top, v = (y.right - y.left) / t.data.length, x = i ? v * 0.72 / r.length : v * 0.6, M = i ? x * 0.86 : x, w = Math.max(4, p * 0.35), $ = S / g, E = new Map(t.data.map((O, q) => [O.id, q])), A = (O) => y.left + v * (E.get(O) + 0.5), H = (O, q) => i ? A(O) - v * 0.36 + x * l.get(q) + (x - M) / 2 : A(O) - M / 2, I = (O, q) => H(O, q) + M / 2, C = t.height - p * 1.2, W = {
    cx: t.width / 2,
    cy: (y.top + C) / 2,
    r: Math.max(10, Math.min(t.width / 2, (C - y.top) / 2) - p * 2.6)
  }, D = s === "donut" ? W.r * 0.55 : 0, Y = s === "donut" ? (D + W.r) / 2 : W.r * 0.62, j = /* @__PURE__ */ new Map();
  if (m) {
    let O = y.right;
    for (const q of [...r].reverse()) {
      const G = q.label ?? q.id, tt = p * 0.62 * G.length + p * 1.9;
      j.set(q.id, yt(O - tt, k, tt, p * 1.4)), O -= tt + p * 0.6;
    }
  }
  const _ = xo(), L = So(_), F = {}, P = (O, q, G) => i ? `${f}.${O}.${q}.${G}` : `${f}.${O}.${G}`;
  for (const O of t.data)
    for (const q of r)
      F[P(O.id, q.id, "value")] = u(O, q), F[P(O.id, q.id, "show")] = O.hidden ? 0 : 1, F[P(O.id, q.id, "highlight")] = 0, o && (F[P(O.id, q.id, "pull")] = 0);
  const R = (O, q) => _.keys(O)?.length ? Gr(_.keys(O), q) : F[O], X = (O, q, G) => R(P(O, q, "value"), G) * (s === "bar" ? R(P(O, q, "show"), G) : 1) * $, Q = (O) => {
    const q = r[0].id, G = t.data.map((K) => Math.max(0, O(P(K.id, q, "value"))) * Math.max(0, Math.min(1, O(P(K.id, q, "show"))))), tt = G.reduce((K, B) => K + B, 0), z = /* @__PURE__ */ new Map();
    let rt = -Math.PI / 2;
    return t.data.forEach((K, B) => {
      const J = tt > 0 ? Pb * G[B] / tt : 0, lt = rt + J / 2, ht = Math.max(0, Math.min(1, O(P(K.id, q, "pull")))) * W.r * $b;
      z.set(K.id, {
        start: rt,
        sweep: J,
        mid: lt,
        out: ht,
        centre: { x: W.cx + Math.cos(lt) * (Y + ht), y: W.cy + Math.sin(lt) * (Y + ht) }
      }), rt += J;
    }), z;
  }, V = (O) => Q((q) => R(q, O)), nt = (O) => {
    const { kind: q, rest: G } = yn(O), tt = (z) => We("chart", O, on, z);
    if (q === "box") {
      if (G) throw tt("box takes no arguments");
      return { kind: "box" };
    }
    if (q === "legend") {
      if (!j.has(G)) throw tt(m ? `there is no series "${G}" (series: ${r.map((z) => z.id).join(", ")})` : "only a chart with several series has a legend");
      return { kind: "legend", series: G };
    }
    if (q === "bar" || q === "point" || q === "slice" || q === "label" || q === "value") {
      if (!G) throw tt(`write it ${q}:ID`);
      const z = G.indexOf(":"), rt = z < 0 ? G : G.slice(0, z), K = z < 0 ? r[0].id : G.slice(z + 1);
      if (!E.has(rt)) throw tt(`there is no "${rt}" (data: ${[...E.keys()].join(", ")})`);
      if (!a.has(K)) throw tt(`there is no series "${K}" (series: ${r.map((B) => B.id).join(", ")})`);
      if (q === "label" && z >= 0) throw tt("a label is one per datum: label:ID");
      if ((q === "bar" || q === "point" || q === "slice") && q !== f) throw tt(`a ${s} chart has ${f}s, not ${q}s: ${f}:${rt}`);
      return { kind: q, id: rt, series: K };
    }
    throw tt();
  }, at = (O, q) => {
    if (O.kind === "box") return yt(0, 0, t.width, t.height);
    if (O.kind === "legend") return j.get(O.series);
    if (o) {
      const K = V(q).get(O.id), B = Math.max(p * 1.5, W.r * 0.42);
      if (O.kind === "slice") return yt(K.centre.x - B / 2, K.centre.y - B / 2, B, B);
      const J = N(K);
      return O.kind === "label" ? J : K.sweep >= 0.3 ? yt(K.centre.x - p * 1.6, K.centre.y - p * 0.65, p * 3.2, p * 1.3) : yt(J.left, J.bottom, J.width, p * 1.3);
    }
    const G = O.kind === "label" ? A(O.id) : I(O.id, O.series), tt = y.bottom - X(O.id, O.series, q);
    if (O.kind === "bar") return yt(G - M / 2, tt, M, y.bottom - tt);
    if (O.kind === "point") return yt(A(O.id) - w, tt - w, w * 2, w * 2);
    if (O.kind === "label") return yt(G - v / 2, y.bottom + p * 0.4, v, p * 1.4);
    const z = tt - (s === "line" ? w : 0) - p * 0.3, rt = i && s === "bar" ? x : v;
    return yt((s === "line" ? A(O.id) : G) - rt / 2, z - p * 1.3, rt, p * 1.3);
  }, N = (O) => {
    const q = W.r + O.out + p * 0.9, G = { x: W.cx + Math.cos(O.mid) * q, y: W.cy + Math.sin(O.mid) * q }, tt = p * 4.2, z = Math.cos(O.mid), rt = z > 0.2 ? G.x : z < -0.2 ? G.x - tt : G.x - tt / 2;
    return yt(rt, G.y - p * 0.7, tt, p * 1.4);
  }, Z = (O) => yt(t.x + O.left, t.y + O.top, O.width, O.height), U = (O) => `${t.prefix ?? ""}${O.toFixed(t.decimals ?? 0)}${t.suffix ?? ""}`, et = /* @__PURE__ */ new Map(), st = {
    type: "custom",
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    props: F,
    about: {
      kind: `${s} chart`,
      summary: `A ${s} chart of ${t.data.length} values (${t.data.map((O) => O.id).join(", ")})${i ? ` in ${r.length} series (${r.map((O) => O.id).join(", ")})` : ""}${o ? "" : `, scaled to ${g}`}. Its ${f}s and labels are places in the scene (anchor()); its edits record tracks (edit(), tracks()).`,
      props: Object.fromEntries(Object.keys(F).map((O) => [O, Hb(O)])),
      actions: on.edits
    },
    draw(O, q) {
      const G = q.props ?? {}, tt = (K) => Number(G[K] ?? F[K] ?? 0);
      if (O.save(), O.fillStyle = n.background, Xl(O, 0, 0, t.width, t.height, 8), O.fill(), O.font = `${p}px ${n.font}`, O.textBaseline = "middle", t.title && (O.fillStyle = n.text, O.textAlign = "left", O.font = `600 ${p * 1.2}px ${n.font}`, O.fillText(t.title, o ? p : y.left, p * 1.5), O.font = `${p}px ${n.font}`), m) {
        O.textAlign = "left";
        for (const K of r) {
          const B = j.get(K.id);
          O.fillStyle = c(K.id), Xl(O, B.left, B.top + p * 0.25, p * 0.9, p * 0.9, 2), O.fill(), O.fillStyle = n.text, O.fillText(K.label ?? K.id, B.left + p * 1.3, B.top + B.height / 2);
        }
      }
      if (o) {
        ot(O, tt), O.restore();
        return;
      }
      O.lineWidth = 1, O.textAlign = "right";
      for (let K = 0; K <= 4; K++) {
        const B = y.bottom - S * K / 4;
        O.strokeStyle = n.grid, O.beginPath(), O.moveTo(y.left, B), O.lineTo(y.right, B), O.stroke(), O.fillStyle = n.text, O.globalAlpha = 0.7, O.fillText(Ob(g * K / 4), y.left - p * 0.5, B), O.globalAlpha = 1;
      }
      (T || b) && (O.fillStyle = n.text, O.textAlign = "center", O.globalAlpha = 0.85, T && (O.save(), O.translate(p * 0.9, (y.top + y.bottom) / 2), O.rotate(-Math.PI / 2), O.fillText(T, 0, 0), O.restore()), b && O.fillText(b, (y.left + y.right) / 2, y.bottom + p * 2.3), O.globalAlpha = 1);
      const z = (K, B) => tt(P(K, B, "value")) * (s === "bar" ? tt(P(K, B, "show")) : 1) * $, rt = (K, B) => ii(c(B), n.highlight, tt(P(K, B, "highlight")));
      if (s === "line") {
        O.lineWidth = Math.max(2, p * 0.2), O.lineJoin = "round", O.lineCap = "round";
        for (const K of r)
          O.strokeStyle = c(K.id), O.beginPath(), t.data.forEach((B, J) => {
            const lt = { x: A(B.id), y: y.bottom - z(B.id, K.id) }, ht = tt(P(B.id, K.id, "show"));
            if (J === 0) {
              ht > 0 && O.moveTo(lt.x, lt.y);
              return;
            }
            const gt = t.data[J - 1];
            if (tt(P(gt.id, K.id, "show")) < 1 || ht <= 0) return;
            const pt = { x: A(gt.id), y: y.bottom - z(gt.id, K.id) };
            O.lineTo(pt.x + (lt.x - pt.x) * ht, pt.y + (lt.y - pt.y) * ht);
          }), O.stroke();
      }
      O.textAlign = "center";
      for (const K of t.data) {
        for (const B of r) {
          const J = s === "bar" ? I(K.id, B.id) : A(K.id), lt = z(K.id, B.id), ht = tt(P(K.id, B.id, "show"));
          if (O.fillStyle = rt(K.id, B.id), s === "bar" ? lt > 0.5 && (_b(O, J - M / 2, y.bottom - lt, M, lt, Math.min(6, M / 4)), O.fill()) : ht > 0 && (O.beginPath(), O.arc(J, y.bottom - lt, w * Math.min(1, ht * 1.5) * (1 + 0.3 * tt(P(K.id, B.id, "highlight"))), 0, Math.PI * 2), O.fill()), t.values !== !1 && ht > 0) {
            O.globalAlpha = Math.min(1, ht * 2), O.font = `600 ${i ? p * 0.85 : p}px ${n.font}`, O.fillStyle = ii(n.text, n.highlight, tt(P(K.id, B.id, "highlight")));
            const gt = y.bottom - lt - (s === "line" ? w : 0) - p * 0.95;
            O.fillText(U(tt(P(K.id, B.id, "value"))), J, gt), O.font = `${p}px ${n.font}`, O.globalAlpha = 1;
          }
        }
        O.fillStyle = n.text, O.fillText(K.label ?? K.id, A(K.id), y.bottom + p * 1.1);
      }
      O.strokeStyle = n.text, O.lineWidth = 1.5, O.beginPath(), O.moveTo(y.left, y.bottom), O.lineTo(y.right, y.bottom), O.stroke(), O.restore();
    }
  };
  function ot(O, q) {
    const G = r[0].id, tt = Q(q);
    t.data.forEach((z, rt) => {
      const K = tt.get(z.id);
      if (K.sweep <= 1e-4) return;
      const B = et.get(z.id), J = B ? { x: q(`piece.${B.id}.x`), y: q(`piece.${B.id}.y`) } : { x: 0, y: 0 }, lt = B ? q(`piece.${B.id}.rotate`) * Math.PI / 180 : 0, ht = B ? q(`piece.${B.id}.opacity`) : 1;
      if (ht <= 0) return;
      O.save(), O.globalAlpha = ht;
      const gt = { x: W.cx + Math.cos(K.mid) * K.out, y: W.cy + Math.sin(K.mid) * K.out };
      O.translate(K.centre.x + J.x, K.centre.y + J.y), O.rotate(lt), O.translate(-K.centre.x, -K.centre.y), O.beginPath(), O.arc(gt.x, gt.y, W.r, K.start, K.start + K.sweep), D > 0 ? O.arc(gt.x, gt.y, D, K.start + K.sweep, K.start, !0) : O.lineTo(gt.x, gt.y), O.closePath(), O.fillStyle = ii(n.palette[rt % n.palette.length], n.highlight, q(P(z.id, G, "highlight"))), O.fill(), O.strokeStyle = n.background, O.lineWidth = Math.max(1.5, p * 0.15), O.stroke(), t.values !== !1 && K.sweep >= 0.3 && (O.fillStyle = n.background, O.font = `600 ${p}px ${n.font}`, O.textAlign = "center", O.fillText(U(q(P(z.id, G, "value"))), K.centre.x, K.centre.y), O.font = `${p}px ${n.font}`), O.restore();
      const pt = N(K), Bt = Math.cos(K.mid);
      O.globalAlpha = ht, O.fillStyle = n.text, O.textAlign = Bt > 0.2 ? "left" : Bt < -0.2 ? "right" : "center";
      const kn = Bt > 0.2 ? pt.left : Bt < -0.2 ? pt.right : pt.left + pt.width / 2;
      O.fillText(z.label ?? z.id, kn, pt.top + pt.height / 2), t.values !== !1 && K.sweep < 0.3 && (O.globalAlpha = ht * 0.8, O.fillText(U(q(P(z.id, G, "value"))), kn, pt.bottom + p * 0.65)), O.globalAlpha = 1;
    });
  }
  const it = {
    kind: "chart",
    chartKind: s,
    about: on,
    target: st,
    max: g,
    box: yt(t.x, t.y, t.width, t.height),
    anchor(O, q = 1 / 0) {
      return Z(at(nt(O), q));
    },
    piece(O) {
      const q = nt(O);
      if (q.kind !== "slice")
        throw new Error(o ? `chart: a piece is a slice, slice:ID, not "${O}"` : `chart: a ${f} is not a piece; slices of a pie or donut are (slice:ID). Change a ${f} with edit('set' | 'show' | 'highlight', …)`);
      const G = et.get(q.id);
      if (G) return G;
      const tt = { id: et.size + 1, datum: q.id, home: Z(at(q, 0)) };
      et.set(q.id, tt);
      for (const z of ["x", "y", "rotate"]) F[`piece.${tt.id}.${z}`] = 0;
      return F[`piece.${tt.id}.opacity`] = 1, tt;
    },
    edit(O, q, G) {
      const tt = Array.isArray(q) ? q : [q];
      if (tt.length === 0) throw new Error(`chart.edit: ${O} takes at least one anchor`);
      if (!(O in on.edits)) throw To("chart", O, on);
      if (O === "pull" && !o) throw new Error(`chart.edit: pull takes slice anchors of a pie or donut; a ${s} chart has ${f}s`);
      const z = tt.map((rt) => {
        const K = nt(rt);
        if (K.kind !== f) throw new Error(`chart.edit: ${O} takes ${f} anchors (${f}:ID), not "${rt}"`);
        return K;
      });
      for (const { id: rt, series: K } of z) {
        const B = (J) => P(rt, K, J);
        if (O === "set") {
          if (typeof G.value != "number" || !Number.isFinite(G.value)) throw new Error("chart.edit: set needs `value`, a number");
          _.tween(B("value"), R(B("value"), G.at), G.value, G, Sb);
        } else O === "show" ? _.tween(B("show"), R(B("show"), G.at), G.on === !1 ? 0 : 1, G, Tb) : O === "pull" ? _.tween(B("pull"), R(B("pull"), G.at), G.on === !1 ? 0 : 1, G, Ab) : _.tween(B("highlight"), R(B("highlight"), G.at), G.on === !1 ? 0 : 1, G, Eb);
      }
      return it;
    },
    follow(O, q) {
      return L.follow(O, q), it;
    },
    fling(O, q) {
      return L.fling(O, q), it;
    },
    move(O, q) {
      return L.move(O, q), it;
    },
    ride(O, q, G) {
      if (s !== "bar") return O;
      const tt = t.data.flatMap(
        (z) => r.map((rt) => {
          const K = X(z.id, rt.id, 0), B = [...Jn(_.keys(P(z.id, rt.id, "value"))), ...Jn(_.keys(P(z.id, rt.id, "show")))];
          return { top: t.y + y.bottom - K, offset: (J) => K - X(z.id, rt.id, J), windows: B };
        })
      );
      return Vr(O, q, { ground: G.ground, every: G.every ?? Le, floors: tt });
    },
    tracks: _.tracks
  };
  return it;
}
function Ib(t) {
  if (!(t > 0)) return 1;
  const e = 10 ** Math.floor(Math.log10(t));
  for (const n of [1, 2, 2.5, 5, 10]) if (n * e >= t - 1e-9) return n * e;
  return 10 * e;
}
function Ob(t) {
  return Number.isInteger(t) ? String(t) : String(Number(t.toFixed(2)));
}
function ii(t, e, n) {
  if (n <= 0) return t;
  if (n >= 1) return e;
  const s = (r) => [1, 3, 5].map((a) => parseInt(r.slice(a, a + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(t) || !/^#[0-9a-f]{6}$/i.test(e)) return n < 0.5 ? t : e;
  const [o, i] = [s(t), s(e)];
  return `#${o.map((r, a) => Math.round(r + (i[a] - r) * n).toString(16).padStart(2, "0")).join("")}`;
}
function Xl(t, e, n, s, o, i) {
  t.beginPath(), t.moveTo(e + i, n), t.arcTo(e + s, n, e + s, n + o, i), t.arcTo(e + s, n + o, e, n + o, i), t.arcTo(e, n + o, e, n, i), t.arcTo(e, n, e + s, n, i), t.closePath();
}
function _b(t, e, n, s, o, i) {
  const r = Math.min(i, o);
  t.beginPath(), t.moveTo(e, n + o), t.lineTo(e, n + r), t.arcTo(e, n, e + r, n, r), t.lineTo(e + s - r, n), t.arcTo(e + s, n, e + s, n + r, r), t.lineTo(e + s, n + o), t.closePath();
}
function Hb(t) {
  return t.endsWith(".value") ? { description: "Its value (the bar’s height, the point’s, or the slice’s share, and its value label)", unit: "value" } : t.endsWith(".show") ? { description: "How much of it is shown: a bar grown in from the axis, the line drawn out to the point, a slice opened", unit: "0..1", min: 0, max: 1 } : t.endsWith(".pull") ? { description: "How far the slice is pulled out from the centre", unit: "0..1", min: 0, max: 1 } : t.startsWith("piece.") ? { description: t.endsWith(".opacity") ? "The loose slice’s opacity" : t.endsWith(".rotate") ? "The loose slice’s turn, degrees" : "The loose slice’s offset from home, px", unit: t.endsWith(".rotate") ? "degrees" : t.endsWith(".opacity") ? "0..1" : "px" } : { description: "How much it is coloured out", unit: "0..1", min: 0, max: 1 };
}
const su = {
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
    options: { build: "child", hair: { style: "bob", color: le.chestnut }, ears: !0, outfit: { shirt: "#e86a92", trousers: "#4a5b8c", bottom: "skirt" } }
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
    options: { build: "slim", hair: { style: "highPonytail", color: le.auburn }, ears: !0, outfit: { shirt: "#f0b43c", trousers: "#36507a" } }
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
    options: { build: "curvy", hair: { style: "shoulderWaves", color: le.black }, ears: !0, outfit: { shirt: "#9b5fc0", trousers: "#2f2f3a", sleeves: "long" } }
  },
  grandpa: {
    label: "Grandpa",
    group: "family",
    scale: 0.96,
    options: {
      build: "stocky",
      hair: { style: "receding", color: le.gray },
      facialHair: { style: "shortBoxed", color: le.white },
      glasses: "square",
      ears: !0,
      outfit: { shirt: "#b98a5a", trousers: "#4b4440", sleeves: "long", collar: !0 }
    }
  },
  grandma: {
    label: "Grandma",
    group: "family",
    scale: 0.9,
    options: { build: "short", hair: { style: "topBun", color: le.white }, glasses: "round", ears: !0, outfit: { shirt: "#5d9fa8", trousers: "#5a4a5e", sleeves: "long", bottom: "skirt" } }
  },
  doctor: {
    label: "Doctor",
    group: "work",
    scale: 0.97,
    options: { build: "slim", hair: { style: "lowPonytail", color: le.black }, ears: !0, outfit: { shirt: "#8fb8d8", trousers: "#36507a", over: "labCoat", collar: !0 } }
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
    options: { build: "stocky", hair: { style: "shoulderStraight", color: le.blond }, hat: "sunHat", ears: !0, outfit: { shirt: "#d64535", trousers: "#4f6b3a", sleeves: "long" } }
  }
};
function i5(t, e = 300, n = {}) {
  const s = su[t];
  if (!s) throw new Error(`castMember: unknown cast member '${t}'`);
  return { ...s.options, height: Math.round(e * s.scale), ...n };
}
const so = {
  handshake: { height: 0.47, spacing: 0.42, lean: 6 },
  highFive: { height: 0.9, spacing: 0.4, lean: 4 },
  fistBump: { height: 0.55, spacing: 0.44, lean: 6 },
  handOver: { height: 0.52, spacing: 0.46, lean: 8 }
};
function r5(t, e, n) {
  return so[t].spacing * Math.min(e.height, n.height);
}
const Ul = 0.075;
function a5(t, e, n, s = {}) {
  const o = so[t];
  if (!o) throw new Error(`meetHands: unknown meeting '${t}' (one of ${Object.keys(so).join(", ")})`);
  const [i, r] = e.x <= n.x ? [e, n] : [n, e], a = s.view === "side", l = Math.min(i.character.height, r.character.height), c = { x: (i.x + r.x) / 2, y: -(s.height ?? o.height) * l }, h = (m, b) => {
    const T = b ? a ? 1 : 0.62 : a ? 3 : 3.38;
    let k = { ...mt, ...m.pose, turn: T, lean: (m.pose?.lean ?? 0) + o.lean };
    const y = b ? 1 : -1, S = (v, x, M) => {
      k = $y(m.character, k, v, { x: c.x + x - m.x, y: c.y, depth: M });
    };
    if (t === "handOver") {
      const v = Ul * l;
      S("arm.left", -y * v * 0.9, v), S("arm.right", -y * v * 0.9, -v);
    } else
      S("arm.right", 0, 0);
    return t === "fistBump" && (k = { ...k, "hand.right.index.curl": 1, "hand.right.middle.curl": 1, "hand.right.ring.curl": 1, "hand.right.pinky.curl": 1 }), k;
  }, u = h(i, !0), f = h(r, !1), d = 0.03 * l, g = (m, b) => {
    const T = vo(m.character, b), k = t === "handOver" ? ["hand.left", "hand.right"] : ["hand.right"], y = t === "handOver" ? Ul * l + d : d;
    return k.every((S) => Math.abs(T.points[S].y - c.y) < d && Math.abs(T.points[S].x + m.x - c.x) < y);
  }, p = g(i, u) && g(r, f);
  return e.x <= n.x ? { a: u, b: f, point: c, reached: p } : { a: f, b: u, point: c, reached: p };
}
const Cb = 50, Rb = 1.2, Lb = 0.8, Wb = 3, Fb = 30, Db = 0.8, Nb = 0.6, ri = (t, e) => Math.max(-e, Math.min(e, t)), Bb = ["hair.swing", "hair.trail", "hair.lift"];
function jb(t, e) {
  const n = e.start ?? 0, s = e.amount ?? 1, o = Math.max(1e-6, e.headRadius);
  let i = NaN, r = { x: 0, y: 0, turn: 0 };
  const a = (d) => (d !== i && (r = t(d), i = d), r), l = (d) => {
    const g = a(d);
    return g.turn * 90 + (g.headTurn ?? 0);
  }, c = { start: n, end: e.end, step: e.step, stiffness: e.stiffness ?? 70, damping: e.damping ?? 6 }, h = As(l, c), u = As((d) => a(d).x, c), f = As((d) => a(d).y, c);
  return h.map((d, g) => {
    const p = a(d.time), m = d.value - l(d.time), b = u[g].value - p.x, T = f[g].value - p.y, k = Math.sin(p.turn * Math.PI / 2), y = Math.cos(p.turn * Math.PI / 2), S = m * Wb + b * y / o * Fb, v = -b * k / o * Db, x = -T / o * Nb;
    return {
      time: d.time,
      swing: ri(S * s, Cb),
      trail: ri(v * s, Rb),
      lift: ri(x * s, Lb)
    };
  });
}
function l5(t, e) {
  if (t.length === 0) return { "hair.swing": 0, "hair.trail": 0, "hair.lift": 0 };
  if (e <= t[0].time) return Gl(t[0]);
  if (e >= t[t.length - 1].time) return Gl(t[t.length - 1]);
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
const Gl = (t) => ({ "hair.swing": t.swing, "hair.trail": t.trail, "hair.lift": t.lift }), qb = 1500;
function c5(t, e, n, s = {}) {
  const o = n.head.hair;
  if (!o || !D1(o)) return [];
  const i = e.filter((d) => d.target === t), r = i.reduce((d, g) => g.keyframes.reduce((p, m) => Math.max(p, m.time), d), 0), a = /* @__PURE__ */ new Set(["x", "y", "turn", "head.turn"]), l = new Ct({ id: `${t}-hair-follow`, tracks: i.filter((d) => a.has(d.property)) }), c = mt, h = (d, g, p) => {
    const m = l.getStateAtTime(d).values.get(t)?.get(g);
    return typeof m == "number" ? m : p;
  }, u = jb(
    (d) => ({
      x: h(d, "x", 0),
      y: h(d, "y", 0),
      turn: h(d, "turn", c.turn ?? 0),
      headTurn: h(d, "head.turn", c["head.turn"] ?? 0)
    }),
    {
      start: 0,
      end: r + (s.settle ?? qb),
      headRadius: vo(n, mt).head.rx,
      step: s.step,
      stiffness: s.stiffness,
      damping: s.damping,
      amount: s.amount
    }
  ), f = [];
  for (const d of Bb) {
    const g = d.slice(5);
    let p = u.map((b) => ({ time: b.time, value: b[g] }));
    if (p.every((b) => Math.abs(b.value) < 1e-3)) continue;
    const m = i.find((b) => b.property === d);
    if (m) {
      const b = new Ct({ id: `${t}-${d}-own`, tracks: [m] }), T = (k) => Number(b.getStateAtTime(k).values.get(t)?.get(d) ?? 0);
      p = p.map((k) => ({ time: k.time, value: k.value + T(k.time) }));
    }
    f.push({ id: `${t}-${d}`, target: t, property: d, keyframes: p });
  }
  return f;
}
const cn = {
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
function ou(t) {
  if (t === void 0) return cn.full;
  if (typeof t == "string") return cn[t];
  const { base: e, ...n } = t;
  return { ...cn[e ?? "full"], ...n };
}
const Qi = 160, Yb = 120, Kb = 700, ai = 60, zb = 90, ks = 3200, hn = 1, Fe = 1e-6;
function Jr(t, e, n = {}) {
  const s = ou(n.style), o = n.seed ?? 1, i = {};
  if (t.length === 0) return i;
  const r = Object.keys(t[0].pose).filter((u) => t.some((f) => Math.abs(f.pose[u] - t[0].pose[u]) > Fe));
  for (const u of r) i[u] = Xb(u, t, e, s, o);
  const a = e.blink, l = a !== void 0 && r.includes(a);
  if (s.blinks && a !== void 0 && !l && a in t[0].pose) {
    const u = Ub(t, e, s, o, t[0].pose[a]);
    u.length > 0 && (i[a] = u);
  }
  const { lift: c, stretch: h } = e;
  if (s.jumpSquash > 0 && c && h && r.includes(c) && !r.includes(h) && h in t[0].pose) {
    const u = Gb(t, c, t[0].pose[h], s.jumpSquash);
    u.length > 0 && (i[h] = u);
  }
  return i;
}
function Xb(t, e, n, s, o) {
  const i = n.eyes.includes(t), r = n.limits[t], a = r !== void 0, l = i ? -s.eyeLead : (n.depth[t] ?? 1) * s.overlap, c = (d) => {
    const g = (e[d].time - e[d - 1].time) / 2;
    return Math.max(-g, Math.min(g, l));
  }, h = [{ time: e[0].time, value: e[0].pose[t] }], u = (d, g, p) => {
    const m = h[h.length - 1];
    if (d <= m.time + hn) {
      h[h.length - 1] = { ...m, value: g, ...p ? { easing: p } : {} };
      return;
    }
    h.push({ time: d, value: g, ...p ? { easing: p } : {} });
  };
  let f = e[0].pose[t];
  for (let d = 1; d < e.length; d++) {
    const g = e[d], p = e[d - 1].pose[t], m = g.pose[t], b = m - p, T = h[h.length - 1].time, k = g.act !== !1;
    if (Math.abs(b) <= Fe) {
      const E = g.time + (k ? c(d) : 0);
      if (d === e.length - 1)
        Math.abs(f - m) > Fe && u(Math.max(E, T + Qi), m, "ease-in-out"), f = m;
      else if (k && a && s.drift > 0 && n.drift.includes(t) && E - T >= Kb) {
        const A = te(`${o}:${t}:${d}`) % 2 === 0 ? 1 : -1;
        f = m + A * s.drift * r, u(E, f, "ease-in-out");
      }
      continue;
    }
    if (!k) {
      u(e[d - 1].time, f), u(g.time, m, g.easing), f = m;
      continue;
    }
    const y = c(d), S = Math.max(e[d - 1].time + y, T);
    let v = g.time + y;
    i && s.eyeDart > 0 && (v = Math.min(v, S + s.eyeDart));
    const x = v - S;
    if (x <= hn) {
      u(g.time, m, g.easing), f = m;
      continue;
    }
    u(S, f);
    const M = Math.sign(b);
    if (a && s.anticipation > 0 && r > 0 && x >= Qi) {
      const E = f - M * Math.min(Math.abs(b) * s.anticipation, r), A = S + x * s.anticipationTime;
      u(A, E, "ease-in-out"), s.hold > 0 && u(A + x * s.hold, E);
    }
    const w = d + 1 < e.length ? e[d + 1].time - g.time : 1 / 0, $ = Math.min(s.settle, w / 2);
    if (a && s.overshoot > 0 && r > 0 && x >= Yb && $ > hn) {
      const E = Math.min(Math.abs(b) * s.overshoot, r);
      u(v, m + M * E, g.easing ?? s.actionEase), u(v + $, m, s.settleEase);
    } else
      u(v, m, g.easing ?? s.actionEase);
    f = m;
  }
  return h;
}
function Ub(t, e, n, s, o) {
  const i = [], r = ai + zb;
  for (let d = 1; d < t.length; d++) {
    const g = t[d - 1].pose, p = t[d].pose;
    Object.entries(e.headTurns).some(([b, T]) => Math.abs((p[b] ?? 0) - (g[b] ?? 0)) > T) && t[d].act !== !1 && i.push(Math.max(t[0].time, t[d - 1].time - n.eyeLead));
  }
  const a = t[0].time, l = t[t.length - 1].time, c = [...i];
  let h = a + ks * 0.6, u = 0;
  for (; h < l; ) {
    c.some((p) => Math.abs(p - h) < ks / 2) || i.push(h);
    const g = (te(`${s}:blink:${u++}`) % 1e3 / 1e3 - 0.5) * (ks * 0.66);
    h += ks + g;
  }
  i.sort((d, g) => d - g);
  const f = [{ time: a, value: o }];
  for (const d of i) {
    const g = f[f.length - 1].time;
    d + ai <= g + hn || (d > g + hn && f.push({ time: d, value: o }), f.push({ time: d + ai, value: 1, easing: "ease-in" }), f.push({ time: d + r, value: o, easing: "ease-out" }));
  }
  return f.length > 1 ? f : [];
}
function Gb(t, e, n, s) {
  const o = n * (1 - 0.18 * s), i = n * (1 + 0.14 * s), r = [{ time: t[0].time, value: n }], a = (l, c, h) => {
    const u = r[r.length - 1];
    l <= u.time + hn || r.push({ time: l, value: c, ...h ? { easing: h } : {} });
  };
  for (let l = 1; l < t.length; l++) {
    const c = t[l - 1].pose[e], h = t[l].pose[e], u = t[l - 1].time, f = t[l].time, d = f - u;
    if (!(d < Qi || t[l].act === !1)) {
      if (c <= Fe && h > Fe)
        a(u, n), a(u + d * 0.2, o, "ease-out"), a(u + d * 0.45, i, "ease-out"), a(f, n, "ease-in-out");
      else if (c > Fe && h <= Fe) {
        const g = l + 1 < t.length ? t[l + 1].time - f : 400;
        a(u + d * 0.5, n), a(f - Math.min(60, d * 0.15), i, "ease-in"), a(f, o, "ease-out"), a(f + Math.min(260, g / 2), n, { type: "back", mode: "out", overshoot: 1.4 });
      }
    }
  }
  return r.length > 1 ? r : [];
}
const Vb = {
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
function Jb(t) {
  return /^(turn|lean|bend|side|lift|roll|stretch)$/.test(t) ? { depth: 0, limit: { turn: 0.06, lean: 10, bend: 10, side: 8, lift: 0, roll: 25, stretch: 0.08 }[t] } : /^leg\.\w+\.(swing|spread|rotate)$/.test(t) ? { depth: 0, limit: 12 } : /^head\./.test(t) ? { depth: 1, limit: 12 } : /^arm\.\w+\.(swing|spread)$/.test(t) ? { depth: 1, limit: 20 } : /^leg\.\w+\.knee$/.test(t) ? { depth: 1, limit: 15 } : /^(brow\.|browTilt$)/.test(t) ? { depth: 1, limit: t === "browTilt" ? void 0 : 0.25 } : /^eye\./.test(t) ? { depth: 1, limit: 0.15 } : /^arm\.\w+\.(elbow|bend)$/.test(t) ? { depth: 2, limit: 18 } : /^leg\.\w+\.(ankle|toeOut)$/.test(t) ? { depth: 2, limit: 10 } : /^(mouth|smile|mouthWidth)$/.test(t) ? { depth: 2 } : /^hand\./.test(t) ? { depth: 3 } : { depth: 1 };
}
function Zb() {
  const t = {}, e = {};
  for (const n of Object.keys(mt)) {
    const s = Jb(n);
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
const Qb = Zb();
function iu(t, e) {
  return Object.entries(e).map(([n, s]) => ({ id: `${t}-${n}`, target: t, property: n, keyframes: s }));
}
function tw(t, e, n = {}) {
  const s = Sr(e), o = e.map((i, r) => ({ time: i.time, pose: { ...s[r] }, easing: i.easing, act: i.act }));
  return iu(t, Jr(o, n.rig ?? Vb, n));
}
function ew(t, e, n = {}) {
  const s = n.rest ?? mt, o = W0(e, s), i = e.map((r, a) => ({ time: r.time, pose: { ...s, ...o[a] }, easing: r.easing, act: r.act }));
  return iu(t, Jr(i, n.rig ?? Qb, n));
}
const Vl = bt.shocked, nw = bt.scared, ze = {
  /** The classic take: squash down in a squint, then shoot up stretched with eyes popping, hang, and land squashed. */
  take: (t) => [
    { after: 140, pose: { stretch: 0.8, bend: 10, lean: t.lean - 4, leftShoulder: 8, rightShoulder: 8, leftEye: 0.35, rightEye: 0.35, leftBrow: -0.6, rightBrow: -0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 260, pose: { stretch: 0.78 } },
    { after: 360, pose: { rise: 0.22, stretch: 1.35, bend: -14, leftShoulder: 150, rightShoulder: 150, leftElbow: 35, rightElbow: 35, leftHip: 22, rightHip: 22, leftKnee: 45, rightKnee: 45, ...Vl, headTilt: 0 }, easing: "ease-out-cubic" },
    { after: 720, pose: { rise: 0.25, stretch: 1.25, bend: -10, leftShoulder: 140, rightShoulder: 140 }, easing: "ease-in-out" },
    { after: 900, pose: { rise: 0, stretch: 0.74, bend: 12, leftShoulder: 70, rightShoulder: 70, leftHip: 18, rightHip: 18, leftKnee: 30, rightKnee: 30 }, easing: "ease-in-quad" },
    { after: 1060, pose: { stretch: 1.06, bend: -3, leftShoulder: 60, rightShoulder: 60, leftHip: t.leftHip, rightHip: t.rightHip, leftKnee: t.leftKnee, rightKnee: t.rightKnee }, easing: "ease-out" },
    { after: 1260, pose: { stretch: t.stretch, bend: t.bend, ...bt.surprised, leftShoulder: 70, rightShoulder: 70, leftElbow: 60, rightElbow: 60 }, easing: "ease-in-out" }
  ],
  /** Glance at something, look away unbothered, then snap back to it in shock. */
  doubleTake: (t) => [
    { after: 160, pose: { lookX: 1, lookY: 0 }, easing: "ease-out" },
    { after: 520, pose: { lookX: -0.6, headTilt: t.headTilt - 4, smile: 0.6, mouth: 0 }, easing: "ease-in-out" },
    { after: 1100, pose: { lookX: -0.6 } },
    { after: 1180, pose: { bend: t.bend - 10, headTilt: t.headTilt + 10, rise: 0.05, stretch: 1.18, ...Vl, lookX: 1, lookY: 0 }, easing: "ease-out-cubic" },
    { after: 1360, pose: { rise: 0, stretch: 0.88, bend: t.bend + 4, headTilt: t.headTilt + 4 }, easing: "ease-in-quad" },
    { after: 1560, pose: { stretch: t.stretch, bend: t.bend, headTilt: t.headTilt }, easing: { type: "elastic", mode: "out", amplitude: 1, period: 0.35 } }
  ],
  /** Rear back for a zip-off: lean back, one knee up, arms cocked, hold, then pitch forward ready to run. */
  windUp: () => [
    { after: 220, pose: { lean: -18, bend: -16, headTilt: -6, leftShoulder: 70, leftElbow: -100, rightShoulder: 40, rightElbow: 100, leftHip: -45, leftKnee: -80, stretch: 0.92, ...bt.angry, lookX: 1 }, easing: "ease-out" },
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
    const e = [{ after: 80, pose: { ...nw, bend: t.bend + 8, leftShoulder: 40, rightShoulder: 40, leftElbow: 110, rightElbow: 110, stretch: 0.94 }, easing: "ease-out" }];
    for (let n = 1; n <= 14; n++) e.push({ after: 80 + n * 45, pose: { lean: t.lean + (n % 2 === 0 ? 2.5 : -2.5), headTilt: t.headTilt + (n % 2 === 0 ? -2 : 2) } });
    return e.push({ after: 755, pose: { lean: t.lean, headTilt: t.headTilt, bend: t.bend } }), e;
  },
  /** A sigh: the body sags, shoulders drop, head and eyes go down. */
  deflate: (t) => [
    { after: 260, pose: { stretch: 1.04, headTilt: t.headTilt + 4, leftBrow: 0.3, rightBrow: 0.3 }, easing: "ease-in-out" },
    { after: 900, pose: { ...Xt.sad, bend: 18, stretch: 0.92, lean: t.lean + 5, turn: t.turn, sit: t.sit }, easing: "ease-in-out" }
  ]
};
function Jl(t, e) {
  const n = typeof e.from == "string" ? Xt[e.from] : e.from ?? ct;
  return ru(ze[t](n), { ...e, from: n });
}
function ru(t, e) {
  const n = e.speed ?? 1;
  let s = e.from;
  return [
    { time: e.at, pose: e.from },
    ...t.map((o) => (s = { ...s, ...o.pose }, { time: e.at + o.after * n, pose: s, act: !1, ...o.easing ? { easing: o.easing } : {} }))
  ];
}
function oo(t, e = 1) {
  const n = ze[t](ct);
  return n[n.length - 1].after * e;
}
function sw(t, e, n = {}) {
  if (e.length < 2) return;
  const s = Math.max(1, Math.round(n.lines ?? 3)), o = n.spacing ?? 5, i = n.lineWidth ?? 2, r = n.opacity ?? 0.7;
  t.save(), t.strokeStyle = n.color ?? "#222", t.lineCap = "round";
  for (let a = 0; a < s; a++) {
    const l = (a - (s - 1) / 2) * o, c = Math.floor(Math.abs(l) / Math.max(o, 1) * (e.length / 6));
    for (let h = c + 1; h < e.length; h++) {
      const u = e[h - 1], f = e[h], d = f.x - u.x, g = f.y - u.y, p = Math.hypot(d, g) || 1, m = -g / p, b = d / p, T = 1 - h / (e.length - 1);
      t.globalAlpha = r * (1 - T), t.lineWidth = i * (1 - T * 0.7), t.beginPath(), t.moveTo(u.x + m * l, u.y + b * l), t.lineTo(f.x + m * l, f.y + b * l), t.stroke();
    }
  }
  t.restore();
}
const ow = {
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
function h5(t, e, n, s, o = {}) {
  const i = n.stateAt;
  if (!i) return;
  const r = o.length ?? 120, a = Math.max(2, Math.round(o.samples ?? 8)), l = Math.max(0, n.time - r);
  if (n.time - l < 1) return;
  const c = [];
  for (let d = 0; d < a; d++) {
    const g = l + (n.time - l) * d / (a - 1);
    c.push(Zh(e, { time: g, state: i(g) }, s).joints);
  }
  const h = c[c.length - 1].height, u = (o.threshold ?? 1.2) * h, f = (o.parts ?? ["hands", "toes", "head"]).flatMap((d) => ow[d]);
  for (const d of f) {
    const g = c.map(d.at);
    let p = 0;
    for (let T = 1; T < g.length; T++) p += Math.hypot(g[T].x - g[T - 1].x, g[T].y - g[T - 1].y);
    const m = p / ((n.time - l) / 1e3);
    if (m <= u) continue;
    const b = Math.min(1, (m - u) / (u * 0.5));
    sw(t, g, { ...o, opacity: (o.opacity ?? 0.7) * b, spacing: o.spacing ?? h * 0.02 });
  }
}
function iw(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = s.seed ?? 1, r = 0.45 + 0.55 * (1 - (1 - n) ** 3);
  t.save(), t.strokeStyle = s.color ?? "#555", t.lineWidth = Math.max(1, o * 0.03), t.globalAlpha = Math.min(1, n / 0.08) * (1 - n);
  for (let a = 0; a < 5; a++) {
    const l = te(`${i}:puff:${a}`) % 1e3 / 1e3, c = a - 2, h = e.x + c * o * 0.3 * r, u = e.y - o * (0.06 + 0.12 * l) * r + Math.abs(c) * o * 0.03, f = o * (0.11 + 0.07 * l) * r;
    t.beginPath(), t.arc(h, u, f, Math.PI * 0.95, Math.PI * 2.05), t.stroke();
  }
  t.restore();
}
function u5(t, e, n, s = {}) {
  if (n <= 0 || n >= 1) return;
  const o = s.size ?? 40, i = 5, r = 1 - (1 - n) ** 2;
  t.save(), t.strokeStyle = s.color ?? "#222", t.lineWidth = Math.max(1, o * 0.035), t.lineJoin = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  for (let a = 0; a < i; a++) {
    const l = -Math.PI / 2 + (a - (i - 1) / 2) * Math.PI / (i + 1), c = o * (0.3 + 0.7 * r), h = e.x + Math.cos(l) * c, u = e.y + Math.sin(l) * c;
    rw(t, h, u, o * 0.14, n * Math.PI + a), t.stroke();
  }
  t.restore();
}
function rw(t, e, n, s, o) {
  t.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.45, a = o + i * Math.PI / 5 - Math.PI / 2, l = e + Math.cos(a) * r, c = n + Math.sin(a) * r;
    i === 0 ? t.moveTo(l, c) : t.lineTo(l, c);
  }
  t.closePath();
}
const Ie = {
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
}, Pn = 1, vs = 0.55, Zl = 0.35, aw = 1.6, Ql = { a: "a", e: "e", i: "i", y: "i", o: "o", u: "u" }, tc = { m: "m", b: "m", p: "m", f: "f", v: "f", w: "u", q: "u", l: "l", n: "l", d: "l", t: "l" }, ec = {
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
}, nc = {
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
}, lw = { प: "m", फ: "m", ब: "m", भ: "m", म: "m", व: "u" }, cw = "्", sc = "़", hw = (t) => t >= "क" && t <= "ह", oc = /* @__PURE__ */ new Set([".", ",", "!", "?", ";", ":", "…", "।", "॥", "—", "-"]);
function uw(t) {
  const e = [], n = Array.from(t.toLowerCase()), s = (o, i) => {
    const r = e[e.length - 1];
    r && r.viseme === o ? r.weight += i * 0.5 : e.push({ viseme: o, weight: i });
  };
  for (let o = 0; o < n.length; o++) {
    const i = n[o], r = n[o + 1];
    if (oc.has(i)) s("rest", aw);
    else if (/\s/.test(i)) {
      const a = e[e.length - 1];
      a && a.viseme !== "rest" && e.push({ viseme: "c", weight: Zl });
    } else if ((i === "o" || i === "e") && r === i)
      s(i === "o" ? "u" : "i", Pn), o++;
    else if (i in Ql) s(Ql[i], Pn);
    else if (i in tc) s(tc[i], vs);
    else {
      if (i === "h") continue;
      if (/[a-z]/.test(i)) s("c", vs);
      else if (i in ec) s(ec[i], Pn);
      else if (hw(i)) {
        const a = r === sc ? i === "फ" ? "f" : void 0 : lw[i];
        s(a ?? "c", vs);
        let l = o + 1;
        n[l] === sc && l++;
        const c = n[l];
        c === cw ? o = l : c && c in nc ? (s(nc[c], Pn), o = l) : (!c || /\s/.test(c) || oc.has(c) || s("a", Pn * 0.6), o = l - 1);
      } else (i === "ं" || i === "ँ") && s("l", vs * 0.6);
    }
  }
  for (; e.length > 0 && (e[e.length - 1].viseme === "rest" || e[e.length - 1].weight === Zl); ) e.pop();
  return e;
}
function au(t, e = {}) {
  const n = e.fields?.mouth ?? "mouth", s = e.fields?.mouthWidth ?? "mouthWidth", o = e.energy ?? 1, i = uw(t.text), r = [{ time: t.start, value: Ie.rest.mouth }], a = [{ time: t.start, value: Ie.rest.mouthWidth }], l = i.reduce((h, u) => h + u.weight, 0), c = t.end - t.start;
  if (l > 0 && c > 0) {
    let h = t.start;
    for (const u of i) {
      const f = c * u.weight / l, d = h + Math.min(f * 0.4, 60);
      if (d > r[r.length - 1].time) {
        const g = Ie[u.viseme];
        r.push({ time: d, value: g.mouth * o, easing: "ease-out" }), a.push({ time: d, value: 1 + (g.mouthWidth - 1) * Math.min(1.3, o), easing: "ease-out" });
      }
      h += f;
    }
  }
  return t.end > r[r.length - 1].time && (r.push({ time: t.end, value: Ie.rest.mouth, easing: "ease-in-out" }), a.push({ time: t.end, value: Ie.rest.mouthWidth, easing: "ease-in-out" })), { [n]: r, [s]: a };
}
function f5(t, e, n = {}) {
  const s = {};
  for (const o of [...e].sort((i, r) => i.start - r.start))
    for (const [i, r] of Object.entries(au(o, n))) {
      const a = s[i] ??= [], l = a.length > 0 ? a[a.length - 1].time : -1 / 0;
      a.push(...r.filter((c) => c.time > l));
    }
  return Object.entries(s).map(([o, i]) => ({ id: `${t}-${o}`, target: t, property: o, keyframes: i }));
}
function lu(t, e, n, s = {}) {
  if (n.length === 0) return e;
  const o = s.fields?.mouth ?? "mouth", i = s.fields?.mouthWidth ?? "mouthWidth", r = { [o]: Ie.rest.mouth, [i]: Ie.rest.mouthWidth, ...s.rest }, a = new Ct({ id: "before-speech", tracks: e }), l = (u, f) => a.getStateAtTime(f).values.get(t)?.get(u) ?? r[u], c = [o, i], h = e.filter((u) => u.target !== t || !c.includes(u.property));
  for (const u of c) {
    const f = e.find((g) => g.target === t && g.property === u);
    let d = f ? [...f.keyframes] : [{ time: 0, value: l(u, 0) }];
    for (const g of n) {
      const p = au(g, s)[u];
      p[0] = { ...p[0], value: l(u, g.start) }, p[p.length - 1] = { ...p[p.length - 1], value: l(u, g.end) }, d = [...d.filter((m) => m.time < g.start || m.time > g.end), ...p], d.sort((m, b) => m.time - b.time);
    }
    h.push({ id: f?.id ?? `${t}-${u}`, target: t, property: u, keyframes: d });
  }
  return h;
}
const Eo = {
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
function cu(t = {}) {
  return [
    ...Object.keys(Lt),
    ...Object.keys(Xt),
    ...Object.keys(ze),
    ...Object.keys(Eo),
    ...Object.keys(t.gaits ?? {}),
    ...Object.keys(t.actions ?? {})
  ];
}
function hu(t = {}) {
  const e = new Set(cu()), n = [];
  for (const s of [...Object.keys(t.actions ?? {}), ...Object.keys(t.gaits ?? {})])
    e.has(s) && n.push(`Custom action or gait "${s}" has the name of a built-in one; give it its own name.`);
  for (const s of Object.keys(t.actions ?? {}))
    t.gaits && s in t.gaits && n.push(`"${s}" is both a custom action and a custom gait.`);
  return n;
}
function uu(t = {}) {
  const e = {};
  for (const n of Object.keys(Lt)) e[n] = `Walks to \`to\` in the ${n} gait, feet planted, turning round first if needed.`;
  for (const n of Object.keys(Xt)) e[n] = `Moves into the ${n} pose and holds it.`;
  for (const n of Object.keys(ze)) e[n] = `The ${n} gag, built on the current pose.`;
  for (const [n, s] of Object.entries(Eo)) e[n] = s.summary;
  for (const [n, s] of Object.entries(t.gaits ?? {})) e[n] = s.summary ?? `Walks to \`to\` in the ${n} gait (custom).`;
  for (const [n, s] of Object.entries(t.actions ?? {})) e[n] = s.summary;
  return e;
}
const tr = ["do", "at", "for", "to", "toward", "mood", "say", "pose", "target", "onto"], fw = {
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
}, Ms = ["viewer", "ahead", "back"], $e = (t) => typeof t == "number" && Number.isFinite(t);
function io(t, e = {}) {
  const n = hu(e).map((l) => ({ level: "error", beat: -1, message: l }));
  if (!Array.isArray(t)) return [...n, { level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const s = cu(e), o = (l) => l in Lt || l in (e.gaits ?? {}), i = Object.keys(bt), r = Object.keys(ct);
  let a = -1 / 0;
  return t.forEach((l, c) => {
    const h = (p) => n.push({ level: "error", beat: c, message: p }), u = (p) => n.push({ level: "warning", beat: c, message: p });
    if (!l || typeof l != "object" || Array.isArray(l)) {
      h(`Each beat must be an object like { do: 'walk', to: 400 } (got ${JSON.stringify(l)}).`);
      return;
    }
    const f = l;
    for (const p of Object.keys(f))
      tr.includes(p) || h(ft("beat field", p, tr, fw[p.toLowerCase()]));
    const d = f.do;
    if (d === void 0) {
      h(`A beat needs \`do\` (what happens). Actions: ${s.join(", ")}`);
      return;
    }
    if (typeof d != "string" || !s.includes(d)) {
      h(ft("action", d, s));
      return;
    }
    const g = Eo[d] ?? e.actions?.[d];
    for (const p of g?.needs ?? [])
      f[p] === void 0 && h(`\`${d}\` needs \`${p}\`.`);
    if (o(d) && f.to === void 0 && u(`\`${d}\` without \`to\` walks nowhere.`), d === "leap" && f.to === void 0 && f.onto === void 0 && u("`leap` without `to` or `onto` jumps on the spot."), f.mood !== void 0 && (typeof f.mood != "string" || !i.includes(f.mood)) && h(ft("mood", f.mood, i)), f.pose !== void 0)
      if (!f.pose || typeof f.pose != "object" || Array.isArray(f.pose))
        h("`pose` is joints to change, an object like { rightShoulder: 90 } (for a named pose, use it as the action).");
      else
        for (const [p, m] of Object.entries(f.pose))
          r.includes(p) ? $e(m) || h(`Pose joint \`${p}\` must be a number (got ${JSON.stringify(m)}).`) : h(ft("pose joint", p, r));
    for (const p of ["at", "for"]) {
      const m = f[p];
      m !== void 0 && !($e(m) && m >= 0) && h(`\`${p}\` is milliseconds, a number ≥ 0 (got ${JSON.stringify(m)}).`);
    }
    $e(f.at) && (f.at < a && u(`\`at\` ${f.at} is before an earlier beat's \`at\` (${a}); beats run in order, so it starts when the one before ends.`), a = f.at);
    for (const p of ["to", "onto"]) {
      const m = f[p];
      m !== void 0 && !$e(m) && h(`\`${p}\` is a scene ${p === "to" ? "x" : "y"} in px, a number (got ${JSON.stringify(m)}).`);
    }
    if (f.toward !== void 0 && !$e(f.toward) && !Ms.includes(f.toward) && h(`\`toward\` is a scene x or one of ${Ms.join(", ")}${typeof f.toward == "string" && Ns(f.toward, Ms) ? ` (did you mean "${Ns(f.toward, Ms)}"?)` : ""} (got ${JSON.stringify(f.toward)}).`), f.say !== void 0 && typeof f.say != "string" && h(`\`say\` is the line spoken, a string (got ${JSON.stringify(f.say)}).`), f.target !== void 0) {
      const p = f.target;
      (!p || typeof p != "object" || !$e(p.x) || !$e(p.y)) && h("`target` is a point or box in scene px: { x, y } (a code panel’s line(), token() or spot() fits).");
    }
  }), n;
}
function ic(t, e = {}, n = "scriptTracks") {
  const s = io(t, e).filter((o) => o.level === "error");
  if (s.length !== 0)
    throw new Error(`${n}: ${s.length} problem(s) in the beats:
${s.map((o) => `  ${o.beat >= 0 ? `beat ${o.beat}: ` : ""}${o.message}`).join(`
`)}`);
}
xg(uu);
function d5(t) {
  const e = "steps" in t && typeof t.steps == "function", n = "beats" in t && typeof t.beats == "function";
  if (e === n) throw new Error("defineAction: give either `steps: (from, beat) => [...]` or `beats: (beat) => [...]`");
  if (!t.summary) throw new Error("defineAction: give a `summary`: one line on what the figure does");
  return t;
}
function p5(t) {
  for (const e of ["swing", "knee", "arm", "elbow", "lean"])
    if (typeof t[e] != "number") throw new Error(`defineGait: \`${e}\` must be a number (degrees)`);
  if (t.cycle !== void 0 && !(t.cycle > 0)) throw new Error("defineGait: `cycle` is ms per two steps, above 0");
  return t;
}
const rc = 8;
function Zr(t, e = {}, n = 0) {
  if (n > rc) throw new Error(`scriptTracks: custom actions nest more than ${rc} deep (does one build itself?)`);
  return t.flatMap((s) => {
    const o = e[s.do];
    if (!o || !("beats" in o)) return [s];
    const i = o.beats(s).map(
      (r, a) => a === 0 ? { ...r, ...s.at !== void 0 && r.at === void 0 ? { at: s.at } : {}, ...s.mood && !r.mood ? { mood: s.mood } : {}, ...s.say && !r.say ? { say: s.say } : {} } : r
    );
    return Zr(i, e, n + 1);
  });
}
function dw(t) {
  return t.length === 0 ? 0 : Math.max(...t.map((e) => e.after));
}
const ac = {
  walk: 1e3,
  bouncy: 900,
  doubleBounce: 1100,
  sneak: 1600,
  strut: 1100,
  tired: 1500,
  shove: 1300,
  run: 560
}, pw = 450, gw = 2.4, mw = 160, lc = 2.5, yw = 200, bw = 340, ww = 1.1, cc = [380, 900], kw = 0.35, xs = 300, li = 150, vw = 260, Mw = 1.2, ci = 160, hc = 400, In = 300, xw = 450, uc = 500, hi = 350, fc = 150, Sw = 120, ui = 180, dc = 420, Tw = 300, pc = 300, Ew = 140, fi = 150, gc = 450, Aw = 450, di = 150, mc = 350, yc = 400, $w = 12, Pw = 600, bc = 90, wc = 400, Iw = 200, Ow = 0.09, kc = 350, re = 450, pi = 1200, _w = 700, Qe = 320, ae = 220, Hw = 65, Cw = 700, vc = (t) => t in ze, Rw = (t) => t in Xt;
function Lw(t) {
  return Math.max(Cw, Array.from(t).length * Hw);
}
function Qr(t, e, n = {}) {
  const s = { actions: n.actions, gaits: n.gaits };
  ic(e, s);
  const o = n.gait ?? "walk", i = Zr(e, n.actions).map((P) => P.do === "go" ? { ...P, do: o } : P);
  ic(i, s, "scriptTracks (after expanding custom actions)");
  const r = (P) => Lt[P] ?? n.gaits?.[P], a = (P) => ac[P] ?? n.gaits?.[P]?.cycle ?? 1e3, l = (P) => {
    const R = n.actions?.[P];
    return R && "steps" in R ? R : void 0;
  }, c = n.from ?? 0, h = n.ground ?? 0, u = n.height ?? 300;
  let f = c, d = h, g = n.facing ?? 1, p = n.start ?? ct, m = 0, b = 0;
  const T = [{ time: 0, pose: p }], k = [{ time: 0, value: 0 }], y = [{ time: 0, value: 0 }], S = [{ time: 0, value: 0 }], v = [{ time: 0, value: 0 }], x = [{ time: 0, value: "walk" }], M = [{ time: 0, value: g }], w = [], $ = [], E = [], A = (P, R, X, Q) => {
    p = { ...p, ...R }, X && (p = He(p, X)), T.push({ time: P, pose: p, ...Q === !1 ? { act: Q } : {} });
  }, H = (P, R, X) => (A(P + Qe / 2, { turn: 0 }, X), M.push({ time: P + Qe / 2, value: g }, { time: P + Qe / 2 + 1, value: R }), g = R, A(P + Qe, { turn: 1 }), P + Qe), I = (P) => P < f ? -1 : 1, C = (P, R, X) => I(R) !== g ? H(P, I(R), X) : P, W = (P, R, X, Q = "arm") => {
    const V = Q === "arm", nt = Pe({ ...P, ...V ? { rightShoulder: 0, rightElbow: 0 } : { rightHip: 0, rightKnee: 0 } }, { height: u, facing: g }), at = V ? nt.shoulders.right : nt.hip, N = V ? nt.elbows.right : nt.knees.right, Z = (st, ot) => Math.atan2(g * st, ot) * 180 / Math.PI, et = ((Z(R - (f + at.x), X - (d + at.y)) - Z(N.x - at.x, N.y - at.y)) % 360 + 360) % 360;
    return et > 270 ? et - 360 : et;
  }, D = (P, R, X, Q) => {
    const V = Q === "arm", nt = Pe({ ...P, ...V ? { rightShoulder: 90, rightElbow: 0, rightWrist: 0 } : { rightHip: 90, rightKnee: 0 } }, { height: u, facing: g }), at = V ? nt.shoulders.right : nt.hip, N = V ? { x: (nt.hands.right.x + nt.fingertips.right.x) / 2, y: (nt.hands.right.y + nt.fingertips.right.y) / 2 } : nt.feet.right, Z = Math.hypot(N.x - at.x, N.y - at.y), U = X - (d + at.y), et = Math.abs(U) < Z ? Math.sqrt(Z * Z - U * U) : Z * 0.1;
    return R - at.x - g * et;
  }, Y = (P) => {
    const R = Pe(P, { height: u, facing: g });
    return { x: f + (R.hands.right.x + R.fingertips.right.x) / 2, y: d + (R.hands.right.y + R.fingertips.right.y) / 2 };
  }, j = (P, R, X) => {
    const Q = { ...P, rightWrist: 0, rightElbow: 0, rightShoulder: W(P, R, X) }, V = Pe(Q, { height: u, facing: g }), nt = { x: f + V.shoulders.right.x, y: d + V.shoulders.right.y }, at = { x: f + V.elbows.right.x, y: d + V.elbows.right.y }, N = Y(Q), Z = Math.hypot(at.x - nt.x, at.y - nt.y), U = Math.hypot(N.x - at.x, N.y - at.y), et = Math.min(Z + U - 0.01, Math.max(Math.abs(Z - U) + 0.01, Math.hypot(R - nt.x, X - nt.y))), st = (G) => G * 180 / Math.PI, ot = st(Math.acos((Z * Z + et * et - U * U) / (2 * Z * et))), it = 180 - st(Math.acos((Z * Z + U * U - et * et) / (2 * Z * U)));
    let O = { rightShoulder: Q.rightShoulder, rightElbow: 0 }, q = 1 / 0;
    for (const G of [1, -1])
      for (const tt of [1, -1]) {
        const z = { rightShoulder: Q.rightShoulder + G * ot, rightElbow: tt * it }, rt = { ...P, rightWrist: 0, ...z }, K = Y(rt), J = Math.hypot(K.x - R, K.y - X) - Pe(rt, { height: u, facing: g }).elbows.right.y * 1e-3;
        J < q && (q = J, O = z);
      }
    return O;
  }, _ = (P, R, X) => Math.abs(R - f) < 2 ? P : (k.push({ time: P, value: f - c }, { time: P + X, value: R - c, easing: "ease-in-out" }), f = R, P + X);
  for (const P of i) {
    const R = Math.max(P.at ?? b, b === 0 ? 0 : T[T.length - 1].time);
    let X = R, Q, V;
    const nt = P.pose ?? {}, at = l(P.do);
    if (r(P.do)) {
      const N = P.to ?? f, Z = N === f ? g : I(N);
      let U = R;
      Z !== g ? U = H(R, Z, P.mood) : p.turn < 1 ? (U = R + ae, A(U, { turn: 1, ...nt }, P.mood)) : (P.mood || P.pose) && A(R + ae, nt, P.mood);
      const st = Math.abs(N - f) / Ri(r(P.do), u), ot = P.for ?? Math.max(ae * 2, st * a(P.do)), it = U + ot;
      x.push({ time: U, value: P.do }), v.push({ time: U, value: 0 }, { time: U + ae, value: 1, easing: "ease-out" }), v.push({ time: it - ae, value: 1 }, { time: it, value: 0, easing: "ease-in" }), S.push({ time: U, value: m }, { time: it, value: m + st }), k.push({ time: U, value: f - c }, { time: it, value: N - c }), m += st, f = N, A(it, {}), X = it;
    } else if (P.do === "zip") {
      const N = P.to ?? f, Z = N === f ? g : I(N);
      let U = R;
      Z !== g ? U = H(R, Z, P.mood) : p.turn < 1 && (U = R + ae, A(U, { turn: 1 }, P.mood));
      const et = Jl("windUp", { at: U, from: P.mood ? He(p, P.mood) : p });
      T.push(...et), p = et[et.length - 1].pose;
      const st = U + oo("windUp"), ot = st + pw, it = ot + Math.max(mw, Math.abs(N - f) / gw);
      x.push({ time: st, value: "run" }), v.push({ time: st, value: 0 }, { time: st + 80, value: 1, easing: "ease-out" }, { time: it, value: 1 }, { time: it + 120, value: 0 }), S.push({ time: st, value: m }, { time: ot, value: m + lc, easing: "ease-in" }), m += lc + (it - ot) / ac.run * 1.5, S.push({ time: it, value: m }), k.push({ time: ot, value: f - c }, { time: it, value: N - c, easing: "ease-in" }), E.push({ kind: "dust", time: ot, x: f, y: d, length: 900 }), f = N, A(it, {}), X = it;
    } else if (P.do === "leap") {
      const N = P.to ?? f, Z = P.onto ?? d;
      let U = N === f ? R : C(R, N, P.mood);
      p.turn < 1 && (U += ae, A(U, { turn: 1 }, P.mood));
      const et = { leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50 };
      A(U + yw, { stretch: 0.75, bend: 12, leftHip: 22, rightHip: 22, ...et }, P.mood, !1);
      const st = U + bw;
      A(st - 40, { stretch: 0.72 }, void 0, !1), A(st, { stretch: 1.2, bend: -6, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4 }, void 0, !1);
      const ot = Math.hypot(N - f, Z - d), it = P.for ?? Math.min(cc[1], Math.max(cc[0], 300 + ot * ww)), O = Math.min(d, Z) - kw * u, q = Math.sqrt(d - O), G = Math.sqrt(Z - O), tt = st + it * q / (q + G), z = st + it;
      A(tt, { stretch: 1, bend: 4, leftHip: -55, leftKnee: -80, rightHip: 55, rightKnee: 80, leftShoulder: 110, rightShoulder: 110 }, void 0, !1), A(z, { stretch: 0.72, bend: 12, leftShoulder: 75, rightShoulder: 75, leftElbow: 0, rightElbow: 0, leftHip: 18, rightHip: 18, leftKnee: 0, rightKnee: 0 }, void 0, !1), A(z + 180, { stretch: 1.05, bend: -3 }, void 0, !1), A(z + 340, { stretch: 1, bend: 0, leftHip: ct.leftHip, rightHip: ct.rightHip, leftShoulder: ct.leftShoulder, rightShoulder: ct.rightShoulder, leftElbow: ct.leftElbow, rightElbow: ct.rightElbow }, void 0, !1), k.push({ time: st, value: f - c }, { time: z, value: N - c }), y.push(
        { time: st, value: d - h },
        { time: tt, value: O - h, easing: "ease-out-quad" },
        { time: z, value: Z - h, easing: "ease-in-quad" }
      ), f = N, d = Z, E.push({ kind: "dust", time: z, x: f, y: d, length: 500 }), X = z + 340, Q = z;
    } else if (P.do === "point" && P.target) {
      const N = P.target, Z = C(R, N.x, P.mood), U = { ...p, ...P.mood ? bt[P.mood] : {}, turn: Math.max(p.turn, 0.6), rightElbow: 0, rightWrist: 0, ...nt }, et = Pe(U, { height: u, facing: g }).head.center, st = Math.abs(N.x - (f + et.x)), ot = N.y - (d + et.y), it = Z + re;
      A(it, { ...U, rightShoulder: W(U, N.x, N.y), lookX: 1, lookY: Ww(ot / Math.max(1, Math.hypot(st, ot))) * 0.8 }), X = it + (P.for ?? pi), Q = it, V = X;
    } else if (P.do === "swipe") {
      const N = P.target ?? { x: f + g * u * 0.5, y: d - u * 0.6 }, Z = I(N.x), U = C(R, N.x, P.mood), et = Z === 1 ? N.left ?? N.x : N.right ?? N.x, st = Z === 1 ? N.right ?? N.x : N.left ?? N.x, ot = { ...p, turn: 1, lean: -10, bend: -8, rightElbow: 40, lookX: 1, ...nt };
      A(U + xs, { ...ot, rightShoulder: W(ot, f - g * u * 0.3, d - u * 1.1) }, P.mood, !1);
      const it = { ...p, lean: 6, bend: 4, rightElbow: 0, rightWrist: 0 }, O = { ...p, lean: 14, bend: 12, rightElbow: 0, rightWrist: 0 };
      _(U, D(it, et, N.y, "arm"), xs + li), A(U + xs + li, { lean: -12 }, void 0, !1);
      const q = U + xs + li + 80;
      A(q, { ...it, rightShoulder: W(it, et, N.y) }, void 0, !1);
      const G = q + (P.for ?? Math.max(vw, Math.abs(st - et) / Mw));
      k.push({ time: q, value: f - c }), f = D(O, st, N.y, "arm"), k.push({ time: G, value: f - c }), A(G, { ...O, rightShoulder: W(O, st, N.y) }, void 0, !1), A(G + ci, { lean: 16, bend: 14, rightShoulder: W(p, st + Z * u * 0.4, N.y + u * 0.25) }, void 0, !1), A(G + ci + hc, { lean: 0, bend: 0, rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow }), X = G + ci + hc, Q = q, V = G;
    } else if (P.do === "grab" && P.target) {
      const N = P.target, Z = C(R, N.x, P.mood), U = N.y > d - u * 0.5, et = {
        ...p,
        turn: 1,
        rightElbow: 0,
        bend: U ? 35 : 0,
        lean: U ? 12 : 0,
        stretch: U ? 0.75 : 1,
        lookX: 1,
        lookY: U ? 0.8 : 0,
        ...nt
      }, ot = _(Z, D(et, N.x, N.y, "arm"), In) + xw;
      A(ot, { ...et, rightShoulder: W(et, N.x, N.y) }, P.mood, !1), A(ot + 120, {}, void 0, !1), A(ot + uc, { bend: 0, lean: -3, stretch: 1, rightShoulder: 165, rightElbow: 20, lookY: -0.6 }), X = ot + uc + 150, Q = ot;
    } else if (P.do === "throw") {
      const N = P.target?.x ?? P.to ?? f + g * u, Z = C(R, N, P.mood), U = { ...p, turn: 1, lean: -12, bend: -10, rightElbow: 60, stretch: 0.95, lookX: 1, lookY: -0.3, ...nt };
      A(Z + hi, { ...U, rightShoulder: W(U, f - g * u * 0.4, d - u * 1.05) }, P.mood, !1), A(Z + hi + fc, { lean: -14 }, void 0, !1);
      const et = Z + hi + fc + Sw, st = { ...p, lean: 14, bend: 12, rightElbow: 0, stretch: 1.04 };
      T.push({ time: et, pose: p = { ...st, rightShoulder: W(st, f + g * u, d - u * 1.1) }, easing: "ease-in", act: !1 }), A(et + ui, { lean: 18, bend: 14, rightShoulder: 55, stretch: 1 }, void 0, !1), A(et + ui + dc, { lean: 0, bend: 0, rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow, lookY: 0 }), X = et + ui + dc, Q = et, V = et;
    } else if (P.do === "kick" && P.target) {
      const N = P.target, Z = C(R, N.x, P.mood), U = { ...p, turn: 1, lean: -12, bend: -6, rightKnee: 0, leftShoulder: 100, rightShoulder: 70 }, et = _(Z, D(U, N.x, N.y, "leg"), Tw), st = { leftShoulder: 70, rightShoulder: 50, leftElbow: -20, rightElbow: 20 };
      A(et + pc, { turn: 1, lean: 8, bend: 6, rightHip: -40, rightKnee: 80, lookX: 1, lookY: 0.7, ...st, ...nt }, P.mood, !1);
      const ot = et + pc + Ew, it = W(U, N.x, N.y, "leg");
      T.push({ time: ot, pose: p = { ...p, ...U, rightHip: it }, easing: "ease-in", act: !1 }), A(ot + fi, { lean: -15, rightHip: it + 20 }, void 0, !1), A(ot + fi + gc, {
        lean: 0,
        bend: 0,
        rightHip: ct.rightHip,
        rightKnee: 0,
        leftShoulder: ct.leftShoulder,
        rightShoulder: ct.rightShoulder,
        leftElbow: ct.leftElbow,
        rightElbow: ct.rightElbow,
        lookY: 0
      }), X = ot + fi + gc, Q = ot;
    } else if (P.do === "put" && P.target) {
      const N = P.target, Z = C(R, N.x, P.mood), U = N.y > d - u * 0.5, et = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, bend: U ? 35 : 0, lean: U ? 12 : 0, stretch: U ? 0.75 : 1, lookX: 1, lookY: U ? 0.8 : 0, ...nt }, ot = _(Z, D(et, N.x, N.y, "arm"), In) + Aw;
      A(ot, { ...et, rightShoulder: W(et, N.x, N.y) }, P.mood, !1), A(ot + di, {}, void 0, !1), A(ot + di + mc, { bend: 0, lean: 0, stretch: 1, rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow, lookY: 0 }), X = ot + di + mc, Q = ot;
    } else if (P.do === "write" && P.target) {
      const N = P.target, Z = N.left ?? N.x, U = N.right ?? N.x, et = C(R, (Z + U) / 2, P.mood), st = { ...p, turn: 1, rightElbow: 0, rightWrist: 0, ...bt.thinking, lookX: 1, lookY: 0, ...nt }, ot = (K) => D(st, K, N.y, "arm") + g * u * 0.08, it = (K) => {
        const B = Y({ ...st, ...j(st, K, N.y), rightWrist: 0 });
        return Math.hypot(B.x - K, B.y - N.y) < 2;
      }, O = g === 1 ? Z : U, q = _(et, ot((Z + U) / 2), In), G = !it(Z) || !it(U), tt = G ? _(q, ot(Z), In) + yc : q + yc;
      A(tt, { ...st, ...j(st, G ? Z : O, N.y) }, P.mood, !1);
      const z = P.for ?? Math.max(Pw, Math.abs(U - Z) * $w);
      G && k.push({ time: tt, value: f - c });
      for (let K = bc, B = 0; K <= z; K += bc, B++) {
        const J = Z + (U - Z) * Math.min(K, z) / z;
        G && (f = ot(J), k.push({ time: tt + K, value: f - c }));
        const lt = (B % 2 === 0 ? -1 : 1) * u * 0.02;
        A(tt + K, j(st, J, N.y + lt), void 0, !1);
      }
      const rt = tt + z;
      A(rt, j(st, U, N.y), void 0, !1), A(rt + wc, { rightShoulder: ct.rightShoulder, rightElbow: ct.rightElbow, ...bt.happy }), X = rt + wc, Q = tt, V = rt;
    } else if (P.do === "push" && P.target) {
      const N = P.target, Z = P.to ?? N.x, U = C(R, f + (Z >= N.x ? 1 : -1), P.mood), et = g === 1 ? N.left ?? N.x : N.right ?? N.x, st = { ...p, turn: 1, lean: 16, bend: 8, rightWrist: 0, leftWrist: 0, lookX: 1, ...nt }, ot = D(st, et, N.y, "arm"), it = _(U, ot + g * u * 0.06, In), O = j(st, et, N.y), q = { ...st, ...O, leftShoulder: -O.rightShoulder, leftElbow: -O.rightElbow }, G = it + Iw;
      A(G, q, P.mood, !1);
      const tt = Math.abs(Z - N.x), z = G + (P.for ?? Math.max(600, tt / Ow)), rt = tt / Ri("shove", u);
      x.push({ time: G, value: "shove" }), v.push({ time: G, value: 0 }, { time: G + ae, value: 1, easing: "ease-out" }, { time: z - ae, value: 1 }, { time: z, value: 0, easing: "ease-in" }), S.push({ time: G, value: m }, { time: z, value: m + rt }), m += rt, k.push({ time: G, value: f - c }, { time: z, value: f + (Z - N.x) - c }), f += Z - N.x, A(z, {}, void 0, !1), A(z + kc, { lean: 0, bend: 0, rightShoulder: ct.rightShoulder, leftShoulder: ct.leftShoulder, rightElbow: ct.rightElbow, leftElbow: ct.leftElbow }), X = z + kc, Q = G, V = z;
    } else if (at) {
      const N = P.mood ? He(p, P.mood) : p, Z = at.steps(N, P), U = ru(Z, { at: R, from: N });
      T.push(...U), p = U[U.length - 1].pose, X = R + Math.max(dw(Z), P.for ?? 0);
    } else if (vc(P.do)) {
      const N = Jl(P.do, { at: R, from: P.mood ? He(p, P.mood) : p });
      T.push(...N), p = N[N.length - 1].pose, X = R + oo(P.do), P.do === "take" && E.push({ kind: "dust", time: R + 900, x: f, y: d, length: 500 }), P.do === "land" && E.push({ kind: "dust", time: R + 120, x: f, y: d, length: 500 });
    } else if (P.do === "look" || P.do === "face") {
      const N = P.toward ?? "viewer", Z = P.for ?? _w;
      if (N === "viewer") A(R + re, { turn: 0, lookX: 0, lookY: 0, ...nt }, P.mood);
      else if (N === "ahead") A(R + re, { turn: P.do === "face" ? 1 : 0.6, lookX: 1, ...nt }, P.mood);
      else if (N === "back") A(R + re, { turn: 0.2, lookX: -1, ...nt }, P.mood);
      else {
        const U = I(N);
        U !== g && P.do === "face" ? (H(R, U, P.mood), A(R + Qe + 1, { lookX: 1, ...nt })) : U !== g ? A(R + re, { turn: 0.25, lookX: -1, ...nt }, P.mood) : A(R + re, { turn: P.do === "face" ? 1 : 0.6, lookX: 1, ...nt }, P.mood);
      }
      X = R + Math.max(Z, re);
    } else if (Rw(P.do) || P.do === "stand") {
      const N = P.do === "stand" ? n.rest ?? ct : Xt[P.do], Z = N.turn !== ct.turn ? N.turn : p.turn, U = P.mood ? bt[P.mood] : { lookX: p.lookX, lookY: p.lookY };
      A(R + re, { ...N, turn: Z, ...U, ...nt }), X = R + (P.for ?? pi);
    } else {
      const N = P.for ?? (P.say ? Lw(P.say) : pi);
      (P.mood || P.pose) && A(R + Math.min(re, N / 2), nt, P.mood), X = R + N;
    }
    if (P.say) {
      const N = r(P.do) || vc(P.do) || at ? R : R + Math.min(150, (X - R) / 4), Z = r(P.do) ? X : Math.max(N + 200, X - 100);
      w.push({ text: P.say, start: N, end: Z }), P.do === "say" && Nw(T, p, N, Z);
    }
    P.onto !== void 0 && P.do !== "leap" && P.onto !== d && (y.push({ time: R, value: d - h }, { time: X, value: P.onto - h, easing: "ease-in-out" }), d = P.onto), X > T[T.length - 1].time && T.push({ time: X, pose: p }), $.push({ start: R, end: X, ...Q !== void 0 ? { contact: Q } : {}, ...V !== void 0 ? { release: V } : {} }), b = X;
  }
  const L = tw(t, Dw(T), n), F = [
    { id: `${t}-x`, target: t, property: "x", keyframes: k },
    { id: `${t}-y`, target: t, property: "y", keyframes: y },
    { id: `${t}-walk`, target: t, property: "walk", keyframes: S },
    { id: `${t}-walking`, target: t, property: "walking", keyframes: v },
    { id: `${t}-gait`, target: t, property: "gait", keyframes: x },
    { id: `${t}-facing`, target: t, property: "facing", keyframes: M }
  ].filter(
    (P) => P.keyframes.length > 1 || P.property === "x" || // Starting left is kept even if it never turns: a figure target faces right unless told.
    P.property === "facing" && P.keyframes[0].value === -1
  );
  return {
    tracks: [...lu(t, L, w, { energy: n.energy }), ...F],
    duration: b,
    lines: w,
    keys: T,
    beats: $,
    effects: E
  };
}
const Ww = (t) => Math.max(-1, Math.min(1, t)), Fw = 30;
function Dw(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && n.time - s.time < Fw ? e[e.length - 1] = { ...n, time: s.time } : e.push(n);
  }
  return e;
}
function Nw(t, e, n, s) {
  const i = t.filter((l) => l.time > n), r = t.filter((l) => l.time <= n), a = [];
  for (let l = n + 520, c = 0; l < s - 520 / 2; l += 520, c++) {
    const h = c % 2 === 0 ? 3 : -2;
    a.push({ time: l, pose: { ...e, headTilt: e.headTilt + h, leftBrow: e.leftBrow + (c % 2 === 0 ? 0.25 : 0), rightBrow: e.rightBrow + (c % 2 === 0 ? 0.25 : 0) } });
  }
  a.length > 0 && a.push({ time: s, pose: e }), t.length = 0, t.push(...r, ...a.filter((l) => !i.some((c) => Math.abs(c.time - l.time) < 60)), ...i), t.sort((l, c) => l.time - c.time);
}
function fu(t, e, n) {
  const s = new Ct({ id: `${t}-hand`, tracks: e.filter((l) => l.target === t) }), o = Jh({ x: n.x, y: n.y, style: n.style, cast: n.cast }), i = n.side ?? "right", r = n.every ?? 33, a = [];
  for (let l = n.start; ; l = Math.min(n.end, l + r)) {
    const { joints: c } = Zh(o, { time: l, state: s.getStateAtTime(l) }, t), h = c.hands[i], u = c.fingertips[i];
    if (a.push({ time: l, x: (h.x + u.x) / 2, y: (h.y + u.y) / 2 }), l >= n.end) break;
  }
  return a;
}
const jn = ["start", "contact", "release", "end"], Bw = ["surface", "edit", "anchor", "at", "until"], jw = ["carry"], Rs = (t) => !!t && typeof t == "object" && !Array.isArray(t) && "surface" in t && "anchor" in t, qw = (t) => t.then === void 0 ? [] : Array.isArray(t.then) ? t.then : [t.then];
function g5(t, e, n, s = {}) {
  const o = Yw(n, e, s).filter((f) => f.level === "error");
  if (o.length > 0)
    throw new Error(`surfaceScript: ${o.length} problem(s) in the beats:
${o.map((f) => `  ${f.beat >= 0 ? `beat ${f.beat}: ` : ""}${f.message}`).join(`
`)}`);
  const i = n.map((f) => du(f, e)), r = Qr(t, i, s), a = Kw(i, r.beats, s), l = s.ground ?? 0, c = (f) => s.ride === !1 ? f : Object.values(e).reduce((d, g) => g.ride(d, t, { ground: l }), f);
  n.forEach((f, d) => {
    for (const g of qw(f)) {
      const p = (y) => new Error(`surfaceScript: beat ${d} (${f.do}), ${g.edit} on ${g.surface}: ${y}`), m = (y, S) => {
        const v = typeof y == "object" ? y.beat : d, x = (typeof y == "object" ? y.at : y) ?? S ?? "start", M = a[v][x];
        if (M === void 0) {
          const w = jn.filter(($) => a[v][$] !== void 0).join(", ");
          throw p(`beat ${v} (${n[v].do}) has no ${x} (it has ${w})`);
        }
        return M;
      }, b = e[g.surface], T = m(g.at ?? (a[d].contact !== void 0 ? "contact" : "start")), k = g.until === void 0 ? void 0 : m(g.until, "end");
      if (k !== void 0 && k < T) throw p(`it ends (${k} ms) before it starts (${T} ms)`);
      try {
        if (g.edit === "carry") {
          const S = b.piece(g.anchor), v = fu(t, c(r.tracks), {
            x: s.from ?? 0,
            y: l,
            style: s.figureStyle ?? (s.height ? { height: s.height } : void 0),
            cast: s,
            start: T,
            end: k
          });
          b.follow(S, v);
          continue;
        }
        const y = Object.fromEntries(Object.entries(g).filter(([S]) => !Bw.includes(S)));
        b.edit(g.edit, g.anchor, { ...y, at: T, ...k !== void 0 ? { duration: k - T } : {} });
      } catch (y) {
        throw p(y.message);
      }
    }
  });
  const h = c(r.tracks), u = Object.entries(e).flatMap(([f, d]) => d.tracks(f));
  return { ...r, tracks: [...h, ...u], figureTracks: h };
}
function Yw(t, e, n = {}) {
  if (!Array.isArray(t)) return io(t, n);
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
    typeof f == "number" ? s.push({ level: "error", beat: c, message: `${u}: a cue starts at a moment of its beat (${jn.join(", ")}), not at ms; set the beat's own \`at\` to move it.` }) : (typeof f != "string" || !jn.includes(f)) && s.push({ level: "error", beat: c, message: `${u}: ${ft("moment", f, jn)}` });
  };
  t.forEach((c, h) => {
    if (!c || typeof c != "object" || Array.isArray(c)) return;
    const u = c;
    for (const d of ["target", "to", "onto"]) {
      if (!Rs(u[d])) continue;
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
      const m = `\`then\` (${String(g.edit)} on ${String(g.surface)})`, b = [...Object.keys(p.about.edits), ...jw];
      if (typeof g.edit != "string" || !b.includes(g.edit)) {
        s.push({ level: "error", beat: h, message: `\`then\`: ${ft("edit", g.edit, b)}` });
        return;
      }
      for (const T of Array.isArray(g.anchor) ? g.anchor : [g.anchor]) r(h, p, T, m);
      g.edit === "carry" && typeof g.anchor != "string" && s.push({ level: "error", beat: h, message: `${m}: \`carry\` takes one anchor, the piece it carries.` }), g.edit === "carry" && g.until === void 0 && s.push({ level: "error", beat: h, message: `${m}: \`carry\` needs \`until\` (when it lets go, such as { beat: ${h + 1}, at: 'release' }).` }), g.at !== void 0 && a(h, g.at, `${m} \`at\``), g.until !== void 0 && a(h, g.until, `${m} \`until\``), g.until !== void 0 && g.duration !== void 0 && s.push({ level: "error", beat: h, message: `${m}: give \`until\` or \`duration\`, not both.` });
    });
  });
  const l = t.map((c) => c && typeof c == "object" && !Array.isArray(c) ? du(c, e, !0) : c);
  return [...io(l, n), ...s];
}
function du(t, e, n = !1) {
  const { then: s, ...o } = t, i = (a) => {
    try {
      return e[a.surface].anchor(a.anchor, 0);
    } catch (l) {
      if (n) return { x: 0, y: 0, left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
      throw l;
    }
  }, r = { ...o };
  return Rs(t.target) && (r.target = i(t.target)), Rs(t.to) && (r.to = i(t.to).x), Rs(t.onto) && (r.onto = i(t.onto).top), r;
}
function Kw(t, e, n) {
  let s = 0;
  return t.map((o) => {
    const i = Zr([o], n.actions).length, r = e.slice(s, s + i);
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
function m5(t) {
  const e = { actions: t.actions, gaits: t.gaits }, n = hu(e);
  if (n.length > 0) throw new Error(`persona "${t.name}": ${n.join(" ")}`);
  const s = [...Object.keys(Lt), ...Object.keys(t.gaits ?? {})], o = t.gait ?? "walk";
  if (!s.includes(o)) throw new Error(`persona "${t.name}": ${ft("gait", o, s)}`);
  if (t.mood && !(t.mood in bt)) throw new Error(`persona "${t.name}": ${ft("mood", t.mood, Object.keys(bt))}`);
  const i = t.acting ?? "snappy";
  if (typeof i == "string" && !(i in cn)) throw new Error(`persona "${t.name}": ${ft("acting style", i, Object.keys(cn))}`);
  if (typeof t.stance == "string" && !(t.stance in Xt)) throw new Error(`persona "${t.name}": ${ft("stance", t.stance, Object.keys(Xt))}`);
  const r = t.height ?? 120, a = typeof t.stance == "string" ? Xt[t.stance] : Ot(t.stance ?? {}), l = t.mood ? He(a, t.mood) : a, c = { ...t.look, height: r }, h = t.summary ?? `${t.name}, a stick figure`;
  return {
    name: t.name,
    summary: h,
    cast: e,
    rest: l,
    height: r,
    figure: (u) => Jh({ x: u.x, y: u.y, pose: l, style: { ...c, ...u.facing ? { facing: u.facing } : {} }, cast: e }),
    script: (u, f, d = {}) => Qr(u, f, {
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
    check: (u) => io(u, e),
    handPath: (u, f, d) => fu(u, f, { ...d, style: c, cast: e }),
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
      actions: uu(e),
      own: { actions: Object.keys(t.actions ?? {}), gaits: Object.keys(t.gaits ?? {}) }
    })
  };
}
const zw = /* @__PURE__ */ new Set(["x", "y", "walking", "gait"]), Mc = 0.215 + 0.205;
function Xw(t, e, n = 1) {
  const { points: s } = vo(t, mt), o = s["hip.left"], i = s["knee.left"], r = s["ankle.left"], a = o && i && r ? Math.hypot(i.x - o.x, i.y - o.y) + Math.hypot(r.x - i.x, r.y - i.y) : Mc * t.height;
  return P0(e, a / Mc, n);
}
function y5(t, e, n, s = {}) {
  const o = Qr(t, n, { ...s, height: e.height }), i = o.tracks.find((b) => b.property === "facing")?.keyframes ?? [], r = (b) => {
    let T = s.facing ?? 1;
    for (const k of i) k.time <= b && (T = k.value);
    return T;
  }, a = Sr(o.keys), l = o.keys.map((b, T) => {
    const k = T1(a[T]);
    return {
      time: b.time,
      pose: r(b.time) < 0 ? v1(k) : k,
      ...b.easing ? { easing: b.easing } : {},
      ...b.act === !1 ? { act: !1 } : {}
    };
  }), { rest: c, start: h, ...u } = s, f = ew(t, l, u), d = lu(t, f, o.lines, { energy: s.energy }), g = o.tracks.filter((b) => zw.has(b.property)), p = o.tracks.find((b) => b.property === "walk");
  return { tracks: p ? [...d, ...g, Uw(t, p, o.tracks, e, s)] : [...d, ...g], duration: o.duration, lines: o.lines, keys: l, beats: o.beats, effects: o.effects };
}
function Uw(t, e, n, s, o) {
  const i = n.find((u) => u.property === "gait"), r = i ? new Ct({ id: `${t}-gait-of`, tracks: [i] }) : void 0, a = (u) => {
    const f = r?.getStateAtTime(u).values.get(t)?.get("gait");
    if (typeof f == "string")
      return Lt[f] ?? o.gaits?.[f] ?? f;
  }, l = e.keyframes, c = [];
  let h = l[0]?.value ?? 0;
  return l.forEach((u, f) => {
    if (f > 0) {
      const d = l[f - 1], g = a((d.time + u.time) / 2), p = Ri(g, s.height), m = Xw(s, g);
      h += (u.value - d.value) * (m > 0 ? p / m : 1);
    } else
      h = u.value;
    c.push({ ...u, value: h });
  }), { ...e, keyframes: c };
}
const dt = ["rect", "circle", "text", "line", "path", "image", "custom"], Gw = ["rect", "circle", "line", "path"], ta = {
  x: { description: "Moves it right by this much from where it was placed (an offset; the target’s own x is its place)", unit: "px", types: dt },
  y: { description: "Moves it down by this much from where it was placed (an offset)", unit: "px", types: dt },
  opacity: { description: "How opaque it is", unit: "0..1", min: 0, max: 1, types: dt },
  rotate: { description: "Turns it clockwise about its origin", unit: "degrees", types: dt },
  rotateX: { description: "Tips it about the horizontal axis (3D; shows with perspective)", unit: "degrees", types: dt },
  rotateY: { description: "Turns it about the vertical axis (3D; shows with perspective)", unit: "degrees", types: dt },
  z: { description: "Depth toward the viewer (shows with perspective)", unit: "px", types: dt },
  perspective: { description: "Distance from the viewer: nearer parts grow, further ones shrink", unit: "px", min: 1, types: dt },
  scale: { description: "Size, both ways", unit: "factor", types: dt },
  scaleX: { description: "Width factor", unit: "factor", types: dt },
  scaleY: { description: "Height factor", unit: "factor", types: dt },
  skewX: { description: "Slants it sideways", unit: "degrees", types: dt },
  skewY: { description: "Slants it up and down", unit: "degrees", types: dt },
  originX: { description: "Transform pivot across its box", unit: "% (0 left, 50 centre, 100 right)", min: 0, max: 100, types: dt },
  originY: { description: "Transform pivot down its box", unit: "% (0 top, 50 centre, 100 bottom)", min: 0, max: 100, types: dt },
  fill: { description: "Fill colour (also written fillStyle)", kind: "color", types: dt },
  stroke: { description: "Outline colour (also written strokeStyle)", kind: "color", types: dt },
  strokeWidth: { description: "Outline width (also written lineWidth)", unit: "px", min: 0, types: dt },
  clipTop: { description: "Hides this much from the top edge, for reveals", unit: "% of its height", min: 0, max: 100, types: dt },
  clipRight: { description: "Hides this much from the right edge", unit: "% of its width", min: 0, max: 100, types: dt },
  clipBottom: { description: "Hides this much from the bottom edge", unit: "% of its height", min: 0, max: 100, types: dt },
  clipLeft: { description: "Hides this much from the left edge", unit: "% of its width", min: 0, max: 100, types: dt },
  blur: { description: "Gaussian blur", unit: "px", min: 0, types: dt },
  brightness: { description: "Brightness factor (1 unchanged)", unit: "factor", min: 0, types: dt },
  glow: { description: "Soft glow around it, in glowColor", unit: "px", min: 0, types: dt },
  glowColor: { description: "Colour of the glow", kind: "color", types: dt },
  shadowX: { description: "Drop shadow offset right", unit: "px", types: dt },
  shadowY: { description: "Drop shadow offset down", unit: "px", types: dt },
  shadowBlur: { description: "Drop shadow softness", unit: "px", min: 0, types: dt },
  shadowColor: { description: "Drop shadow colour", kind: "color", types: dt },
  shine: { description: "A highlight sweeping across the fill", unit: "0..1 (progress)", min: 0, max: 1, types: dt },
  drawOn: { description: "How much of the outline is drawn, for drawing a shape on; the fill appears when it is complete", unit: "0..1", min: 0, max: 1, types: Gw },
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
  motionPath: { description: "Moves it along an SVG path (a motion-path track writes motionPathX/Y and, aligned, rotate)", kind: "string", types: dt },
  quaternion: { description: 'A rotation as [x, y, z, w] (a track with interpolation: "slerp")', kind: "list", types: dt }
}, er = { fillStyle: "fill", strokeStyle: "stroke", lineWidth: "strokeWidth", rotateZ: "rotate", motionPathX: "x", motionPathY: "y", motionPathRotate: "rotate" }, Vw = {
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
function Jw(t) {
  const e = t, n = Object.entries(ta).filter(([, o]) => o.types.includes(t.type)).map(([o, { types: i, ...r }]) => ({ name: o, ...r, ...e[o] !== void 0 && typeof e[o] != "object" ? { value: e[o] } : {} }));
  if (t.type !== "custom") return { type: t.type, properties: n };
  const s = t.about;
  for (const [o, i] of Object.entries(t.props ?? {}))
    n.push({ name: o, description: s?.props?.[o]?.description ?? "", ...s?.props?.[o], value: i });
  return { type: "custom", ...s ? { kind: s.kind, summary: s.summary } : {}, properties: n, ...s?.actions ? { actions: s.actions } : {} };
}
function Zw(t) {
  const e = Jw(t).properties.map((n) => n.name);
  return [...e, ...Object.keys(er).filter((n) => e.includes(er[n]))];
}
function b5(t, e) {
  const n = [], s = Object.keys(e);
  for (const o of t) {
    const i = (f) => n.push({ level: "error", track: o.id, message: f }), r = e[o.target];
    if (!r) {
      i(ft("target", o.target, s));
      continue;
    }
    const a = Zw(r), l = r.type === "custom" && r.acceptsProp?.(o.property);
    if (!a.includes(o.property) && !l) {
      i(`${o.target}: ${ft("property", o.property, a, Vw[o.property])}`);
      continue;
    }
    const c = o.keyframes ?? [];
    for (let f = 1; f < c.length; f++)
      c[f].time < c[f - 1].time && i(`${o.target}.${o.property}: keyframes out of time order (${c[f - 1].time} ms, then ${c[f].time} ms).`);
    const h = ta[er[o.property] ?? o.property] ?? r.about?.props?.[o.property], u = h && (h.kind ?? "number") === "number";
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
const un = (t, e) => t[2] <= -e;
function nr(t, e, n) {
  const s = (-n - t[2]) / (e[2] - t[2]);
  return [t[0] + (e[0] - t[0]) * s, t[1] + (e[1] - t[1]) * s, -n];
}
function xc(t, e) {
  if (t.every((s) => un(s, e))) return t;
  const n = [];
  return t.forEach((s, o) => {
    const i = t[(o + t.length - 1) % t.length], r = un(s, e), a = un(i, e);
    r !== a && n.push(nr(i, s, e)), r && n.push(s);
  }), n.length >= 3 ? n : [];
}
function Qw(t, e) {
  if (t.every((o) => un(o, e))) return [t];
  const n = [];
  let s = [];
  return t.forEach((o, i) => {
    const r = un(o, e);
    if (i > 0) {
      const a = t[i - 1], l = un(a, e);
      l && !r ? (s.push(nr(a, o, e)), n.push(s), s = []) : !l && r && s.push(nr(a, o, e));
    }
    r && s.push(o);
  }), s.length > 0 && n.push(s), n.filter((o) => o.length >= 2);
}
function Sc(t, e, n) {
  const s = e - t;
  if (!(s >= n * 1.5)) return [t, e];
  const o = Math.round(s / n);
  return Array.from({ length: o + 1 }, (i, r) => t + s * r / o);
}
function t2(t, e, n) {
  const s = (o, i) => Math.max(0, Math.min(o.length - 2, o.findIndex((r, a) => a > 0 && i <= r) - 1));
  return [s(t, n[0]), s(e, n[2])];
}
function e2(t, e) {
  const n = (s) => {
    const o = [e[0] * s[0] + e[4] * s[1] + e[8] * s[2], e[1] * s[0] + e[5] * s[1] + e[9] * s[2], e[2] * s[0] + e[6] * s[1] + e[10] * s[2]], i = Math.hypot(...o) || 1;
    return [o[0] / i, o[1] / i, o[2] / i];
  };
  return { ...t, vertices: t.vertices.map((s) => Nt(e, s)), faces: t.faces.map((s) => ({ corners: s.corners, normal: n(s.normal) })) };
}
function Ss(t, e, n, s) {
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
function n2(t, e, n) {
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
        f(r) || (p = Ss(p, 0, e[r], 1)), p.length && !d(r, e) && (p = Ss(p, 0, e[r + 1], -1)), p.length && !f(a) && (p = Ss(p, 2, n[a], 1)), p.length && !d(a, n) && (p = Ss(p, 2, n[a + 1], -1)), p.length >= 3 && u.push({ corners: p.map(h), normal: g.normal });
      }
      u.length > 0 && o.push({ cell: [r, a], mesh: { vertices: l, faces: u, creases: t.creases, joined: t.joined, walls: i } });
    }
  return o;
}
const s2 = /* @__PURE__ */ new WeakMap(), o2 = /* @__PURE__ */ new WeakMap(), i2 = 48, pu = (t) => t.map((e) => Math.round(e * 1e5)).join(",");
function gu(t, e, n, s) {
  let o = t.get(e);
  o || t.set(e, o = /* @__PURE__ */ new Map());
  let i = o.get(n);
  return i === void 0 && (o.size >= i2 && o.clear(), o.set(n, i = s())), i;
}
function ea(t, e) {
  const n = pu(e);
  return gu(s2, t, n, () => {
    const s = e2(t, e), o = [1 / 0, 1 / 0, 1 / 0], i = [-1 / 0, -1 / 0, -1 / 0];
    for (const r of s.vertices) for (const a of [0, 1, 2])
      o[a] = Math.min(o[a], r[a]), i[a] = Math.max(i[a], r[a]);
    return { key: n, inSpace: s, low: o, high: i };
  });
}
function r2(t, e) {
  const n = t.map((h) => ({ ...h, ...ea(h.mesh, h.local) })), s = [1 / 0, 1 / 0, 1 / 0], o = [-1 / 0, -1 / 0, -1 / 0];
  for (const h of n) for (const u of [0, 1, 2])
    s[u] = Math.min(s[u], h.low[u]), o[u] = Math.max(o[u], h.high[u]);
  const i = Sc(s[0], o[0], e), r = Sc(s[2], o[2], e), a = `${i.join(",")}|${r.join(",")}`, l = n.flatMap((h) => {
    if (h.high[0] - h.low[0] <= e * 2.5 && h.high[2] - h.low[2] <= e * 2.5 || h.whole || h.mesh.joined || (h.mesh.marks?.length ?? 0) > 0) {
      const f = [(h.low[0] + h.high[0]) / 2, (h.low[1] + h.high[1]) / 2, (h.low[2] + h.high[2]) / 2];
      return [{ part: h.part, mesh: h.mesh, cut: !1, cell: t2(i, r, f) }];
    }
    return gu(o2, h.inSpace, a, () => n2(h.inSpace, i, r)).map((f) => ({ part: h.part, mesh: f.mesh, cut: !0, cell: f.cell }));
  }), c = (s[1] + o[1]) / 2;
  return { pieces: l, middle: ([h, u]) => [(i[h] + i[h + 1]) / 2, c, (r[u] + r[u + 1]) / 2] };
}
const Tc = 4e-3, gi = 0.05, Ec = /* @__PURE__ */ new WeakMap();
function a2(t) {
  let e = Ec.get(t);
  return e === void 0 && (e = !t.joined && !t.walls && t.faces.length >= 4 && t.faces.every((n) => {
    const s = t.vertices[n.corners[0]];
    return t.vertices.every((o) => n.normal[0] * (o[0] - s[0]) + n.normal[1] * (o[1] - s[1]) + n.normal[2] * (o[2] - s[2]) <= 1e-6);
  }), Ec.set(t, e)), e;
}
const Ac = /* @__PURE__ */ new WeakMap();
function mu(t) {
  return t.filter(({ mesh: e }) => a2(e)).map(({ part: e, key: n, inSpace: s, low: o, high: i }) => {
    let r = Ac.get(s);
    return r || (r = s.faces.map((a) => {
      const l = s.vertices[a.corners[0]];
      return { normal: a.normal, offset: a.normal[0] * l[0] + a.normal[1] * l[1] + a.normal[2] * l[2] };
    }), Ac.set(s, r)), { part: e, key: n, planes: r, low: o, high: i };
  });
}
function l2(t, e, n, s) {
  const o = e.reduce((i, r) => [i[0] + r[0] / e.length, i[1] + r[1] / e.length, i[2] + r[2] / e.length], [0, 0, 0]);
  for (const i of s) {
    if (i.part === t || [0, 1, 2].some((a) => o[a] < i.low[a] - gi || o[a] > i.high[a] + gi)) continue;
    if (i.planes.every((a) => {
      const l = a.normal[0] * n[0] + a.normal[1] * n[1] + a.normal[2] * n[2], c = e.map((u) => a.normal[0] * u[0] + a.normal[1] * u[1] + a.normal[2] * u[2] - a.offset);
      if (c.every((u) => Math.abs(u) <= Tc)) return l < -0.9;
      const h = Math.abs(l) < 0.5 ? gi : Tc;
      return c.every((u) => u <= h);
    })) return !0;
  }
  return !1;
}
const $c = /* @__PURE__ */ new WeakMap();
function yu(t, e, n, s, o) {
  const i = `${s}|${o.map((l) => l.key).join(";")}`;
  let r = $c.get(e);
  r || $c.set(e, r = /* @__PURE__ */ new Map());
  let a = r.get(i);
  if (!a) {
    r.size >= 48 && r.clear();
    const l = (h) => {
      const u = [n[0] * h[0] + n[4] * h[1] + n[8] * h[2], n[1] * h[0] + n[5] * h[1] + n[9] * h[2], n[2] * h[0] + n[6] * h[1] + n[10] * h[2]], f = Math.hypot(...u) || 1;
      return [u[0] / f, u[1] / f, u[2] / f];
    }, c = e.vertices.map((h) => Nt(n, h));
    a = e.faces.map((h) => l2(t, h.corners.map((u) => c[u]), l(h.normal), o)), r.set(i, a);
  }
  return a;
}
const os = {
  turn: { description: "Which way it faces: 0 toward the viewer, 1 screen-right, 2 away, 3 (or −1) screen-left; in between turns it in 3D", unit: "quarter turns" },
  tilt: { description: "How far the camera looks down on it: 0 level, 12 the ¾ look, 90 straight down", unit: "degrees", default: 12, min: -90, max: 90 },
  pitch: { description: "Nose up (+) or down (−), about its middle on the ground", unit: "degrees" },
  roll: { description: "Tipped onto its right (+) or left (−) side", unit: "degrees" },
  squash: { description: "Squash and stretch about the ground, keeping its volume: 1 normal, below squashed, above stretched", unit: "factor", default: 1, min: 0.3, max: 3 },
  lift: { description: "Off the ground", unit: "metres" },
  lean: { description: "The top sheared forward (+) or back (−): speed and drag", unit: "shear" },
  size: { description: "Its size, about the ground: 1 as built, 0 gone (pop it in or out)", unit: "factor", default: 1, min: 0 }
}, sr = Math.PI / 180;
function c2(t, e, n) {
  return {
    toView: (s) => $r(Ee(s, t * 90 * sr), -e * sr),
    toScreen: (s) => ({ x: s[0] * n, y: -s[1] * n })
  };
}
const Pc = /* @__PURE__ */ new WeakMap(), ro = (t) => Ls(t), Ls = (t) => {
  let e = Pc.get(t);
  return e || Pc.set(t, e = Vy(t)), e;
};
function xt(t, e, n) {
  return e[n] ?? t.controls[n]?.default ?? os[n]?.default ?? 0;
}
function Zn(t, e) {
  const n = Math.max(0.05, xt(t, e, "squash")), s = 1 / Math.sqrt(n), i = [1, 0, 0, 0, 0, 1, xt(t, e, "lean"), 0, 0, 0, 1, 0, 0, 0, 0, 1];
  return [
    _e([0, xt(t, e, "lift"), 0]),
    Qt(zt([1, 0, 0], -xt(t, e, "pitch"))),
    Qt(zt([0, 0, 1], xt(t, e, "roll"))),
    i,
    De([s, n, s]),
    De(Array(3).fill(Math.max(0, xt(t, e, "size"))))
  ].reduce((r, a) => Et(r, a));
}
function na(t, e) {
  const n = Zn(t, e), s = /* @__PURE__ */ new Map(), o = Object.entries(t.controls).flatMap(([r, a]) => (a.bind ?? []).map((l) => ({ value: xt(t, e, r), bind: l }))), i = (r) => {
    const a = s.get(r.id);
    if (a) return a;
    const l = r.parent ? t.parts.find((h) => h.id === r.parent) : void 0;
    if (r.parent && !l) throw new Error(`prop rig: part "${r.id}" hangs from "${r.parent}", which is not a part`);
    let c = Et(l ? i(l) : n, _e(r.at ?? [0, 0, 0]));
    if (r.rotate) {
      const [h, u, f] = r.rotate;
      h && (c = Et(c, Qt(zt([1, 0, 0], h)))), u && (c = Et(c, Qt(zt([0, 1, 0], u)))), f && (c = Et(c, Qt(zt([0, 0, 1], f))));
    }
    for (const { value: h, bind: u } of o)
      if (!(!u.parts.includes(r.id) || h === 0)) {
        if (u.translate && (c = Et(c, _e([u.translate[0] * h, u.translate[1] * h, u.translate[2] * h]))), u.rotate) {
          const f = u.rotate.pivot ?? [0, 0, 0], d = u.rotate.axis === "x" ? [1, 0, 0] : u.rotate.axis === "y" ? [0, 1, 0] : [0, 0, 1];
          c = [c, _e(f), Qt(zt(d, u.rotate.degrees * h)), _e([-f[0], -f[1], -f[2]])].reduce((g, p) => Et(g, p));
        }
        u.scale && (c = Et(c, De([1 + (u.scale[0] - 1) * h, 1 + (u.scale[1] - 1) * h, 1 + (u.scale[2] - 1) * h])));
      }
    return s.set(r.id, c), c;
  };
  for (const r of t.parts) i(r);
  return s;
}
const mi = (() => {
  const t = [-0.45, 0.75, 0.5], e = Math.hypot(...t);
  return [t[0] / e, t[1] / e, t[2] / e];
})(), h2 = Math.cos(35 * sr);
function bu(t, e, n, s, o = {}) {
  const i = t.derive ? { ...e, ...t.derive(e) } : e, r = na(t, i), a = n.toView([0, 0, 0]), l = (I) => (C) => [I[0] * C[0] + I[4] * C[1] + I[8] * C[2], I[1] * C[0] + I[5] * C[1] + I[9] * C[2], I[2] * C[0] + I[6] * C[1] + I[10] * C[2]], c = Zn(t, i), h = o.slice === void 0 ? null : gr(c), u = h ? t.parts.map((I) => ({ part: I, mesh: Ls(I.shape), local: Et(h, r.get(I.id)), whole: I.shape.type === "tube" })) : void 0, f = u ? r2(u, o.slice) : void 0, d = u ? mu(u.map((I) => ({ part: I.part.id, mesh: I.mesh, ...ea(I.mesh, I.local) }))) : void 0, g = (I, C, W, D) => {
    const Y = (B) => n.toView(Nt(W, B)), j = C.vertices.map(Y), _ = j.map((B) => n.toScreen(B)), L = o.perspective ? o.near : void 0, F = (B) => B.map((J) => n.toScreen(J)), P = (B) => L === void 0 ? B : xc(B, L), R = (B) => L === void 0 ? [B] : Qw(B, L), X = l(W), Q = C.faces.map((B) => {
      const J = n.toView(X(B.normal)), lt = [J[0] - a[0], J[1] - a[1], J[2] - a[2]], ht = Math.hypot(...lt) || 1;
      return [lt[0] / ht, lt[1] / ht, lt[2] / ht];
    }), V = d && D ? yu(I.id, C, D, pu(D), d) : void 0, nt = (B) => V?.[B] ?? !1, at = Q.map((B, J) => {
      if (nt(J)) return !1;
      if (!o.perspective) return B[2] > 1e-6;
      const ht = C.faces[J].corners.reduce((gt, pt) => [gt[0] + j[pt][0], gt[1] + j[pt][1], gt[2] + j[pt][2]], [0, 0, 0]);
      return -(B[0] * ht[0] + B[1] * ht[1] + B[2] * ht[2]) > 1e-9;
    }), N = (B) => C.faces[B].corners.reduce((J, lt) => J + j[lt][2], 0) / C.faces[B].corners.length, Z = C.faces.map((B, J) => ({ face: B, i: J })).filter(({ i: B }) => at[B]).map(({ face: B, i: J }) => ({
      i: J,
      solved: {
        points: L === void 0 ? B.corners.map((lt) => _[lt]) : F(P(B.corners.map((lt) => j[lt]))),
        depth: N(J),
        tone: 0.72 + 0.33 * Math.max(0, Q[J][0] * mi[0] + Q[J][1] * mi[1] + Q[J][2] * mi[2])
      }
    })).filter((B) => B.solved.points.length >= 3).sort((B, J) => B.solved.depth - J.solved.depth);
    if (o.light) {
      const B = l(W);
      for (const { i: J, solved: lt } of Z) {
        const ht = C.faces[J].corners, gt = ht.reduce((Po, Pu) => {
          const Io = Nt(W, C.vertices[Pu]);
          return [Po[0] + Io[0] / ht.length, Po[1] + Io[1] / ht.length, Po[2] + Io[2] / ht.length];
        }, [0, 0, 0]), pt = B(C.faces[J].normal), Bt = Math.hypot(...pt) || 1, kn = o.light(gt, [pt[0] / Bt, pt[1] / Bt, pt[2] / Bt]);
        lt.light = kn.light, lt.fog = kn.fog;
      }
    }
    const U = Z.map((B) => B.solved), et = u2(C), st = [], ot = [];
    for (const [B, J] of et) {
      const lt = J.filter((gt) => at[gt]).length;
      if (lt === 0) continue;
      const ht = J.length === 2 && lt === 2 && C.creases !== !1 && Q[J[0]][0] * Q[J[1]][0] + Q[J[0]][1] * Q[J[1]][1] + Q[J[0]][2] * Q[J[1]][2] < h2;
      J.length === 1 && (C.joined || p2(C, B)) || (J.length === 1 || lt === 1 || ht) && (st.push(B.split("-").map(Number)), ot.push(J.filter((gt) => at[gt]).reduce((gt, pt) => N(pt) > N(gt) ? pt : gt)));
    }
    const it = (B) => C.faces.findIndex((J) => J.corners.length > 4 && Math.sign(m2(C.vertices[B], J.normal)) > 0), O = (C.marks ?? []).filter(([B]) => it(B) < 0 || at[it(B)]), q = ([B, J]) => L === void 0 ? [[_[B], _[J]]] : R([j[B], j[J]]).map(F), G = O.flatMap(q), tt = (B) => L === void 0 ? [B.map((J) => _[J])] : R(B.map((J) => j[J])).map(F);
    if (o.slice !== void 0) {
      const B = /* @__PURE__ */ new Map();
      st.forEach((J, lt) => B.set(ot[lt], [...B.get(ot[lt]) ?? [], J]));
      for (const { i: J, solved: lt } of Z) {
        lt.edges = Oc(B.get(J) ?? []).flatMap(tt);
        const ht = C.faces[J].corners;
        lt.center = ht.reduce((pt, Bt) => [pt[0] + j[Bt][0] / ht.length, pt[1] + j[Bt][1] / ht.length, pt[2] + j[Bt][2] / ht.length], [0, 0, 0]), lt.normal = Q[J];
        const gt = Z[Z.length - 1].i;
        lt.marks = O.filter(([pt]) => (it(pt) >= 0 ? it(pt) : gt) === J).flatMap(q);
      }
    }
    const z = I.glow ? Math.max(0, Math.min(1, xt(t, i, I.glow.control))) : 0, rt = I.fade ? Math.max(0, Math.min(1, xt(t, i, I.fade.control))) : 0, K = I.fade ? Math.max(0, Math.min(1, I.fade.from + (I.fade.to - I.fade.from) * rt)) : 1;
    return {
      part: I,
      depth: j.reduce((B, J) => B + J[2], 0) / Math.max(1, j.length),
      faces: U,
      edges: Oc(st).flatMap(tt),
      marks: G,
      glow: z,
      opacity: K,
      ...I.shape.type === "tube" ? { spine: g2(R(I.shape.points.map(Y)).map(F)) } : {},
      ...C.walls ? { cut: !0 } : {}
    };
  }, p = new Map(u?.map((I) => [I.part.id, I.local])), b = (f ? f.pieces.map((I) => ({
    part: I.part,
    mesh: I.mesh,
    // A cut piece is already in rest space: the body's matrix places it.
    m: I.cut ? c : r.get(I.part.id),
    local: I.cut ? fo() : p.get(I.part.id),
    cell: I.cell
  })) : t.parts.map((I) => ({ part: I, mesh: Ls(I.shape), m: r.get(I.id), local: void 0, cell: void 0 }))).map((I) => ({ cell: I.cell, solved: g(I.part, I.mesh, I.m, I.local) })), T = b.map((I) => I.solved), k = (I) => I.filter((C) => C.faces.length > 0 && C.opacity > 0.01).sort((C, W) => C.depth - W.depth);
  let y;
  if (f) {
    const I = new Map(t.parts.map((W) => {
      const D = r.get(W.id), Y = Ls(W.shape).vertices;
      return [W.id, Y.reduce((j, _) => j + n.toView(Nt(D, _))[2], 0) / Math.max(1, Y.length)];
    })), C = /* @__PURE__ */ new Map();
    for (const W of b) {
      const D = W.cell.join(",");
      C.has(D) || C.set(D, { cell: W.cell, parts: [] }), C.get(D).parts.push(W.solved), W.solved.depth = I.get(W.solved.part.id);
    }
    y = [...C.values()].map(({ cell: W, parts: D }) => ({ depth: n.toView(Nt(c, f.middle(W)))[2], parts: k(D) })).filter((W) => W.parts.length > 0);
  }
  const S = {};
  for (const [I, C] of Object.entries(t.anchors ?? {})) {
    const W = C.part ? r.get(C.part) : Zn(t, i);
    if (!W) throw new Error(`prop rig: anchor "${I}" is on "${C.part}", which is not a part`);
    const D = n.toView(Nt(W, C.at));
    S[I] = { point: n.toScreen(D), depth: D[2] };
  }
  const [v, x] = t.footprint ?? [t.length * 0.45, t.length], M = Math.max(0, xt(t, i, "lift")), w = Math.max(0, xt(t, i, "size")) / (1 + M * 0.8), $ = Array.from({ length: 24 }, (I, C) => {
    const W = Math.PI * 2 * C / 24;
    return n.toView([Math.cos(W) * v * 0.55 * w, 0, Math.sin(W) * x * 0.55 * w]);
  }), E = o.perspective ? o.near : void 0, A = {
    points: (E === void 0 ? $ : xc($, E)).map((I) => n.toScreen(I)),
    opacity: 0.16 * w
  }, H = T.filter((I) => I.part.seeThrough && I.opacity > 0.01).flatMap((I) => I.faces.map((C) => C.points));
  return { under: k(T.filter((I) => !I.part.overRider)), over: k(T.filter((I) => I.part.overRider)), ...y ? { cells: y } : {}, anchors: S, openings: H, shadow: A, pxPerUnit: s, sizePx: t.height * s };
}
const Ic = /* @__PURE__ */ new WeakMap();
function u2(t) {
  let e = Ic.get(t);
  if (!e) {
    e = /* @__PURE__ */ new Map();
    for (let n = 0; n < t.faces.length; n++) {
      const s = t.faces[n].corners;
      for (let o = 0; o < s.length; o++) {
        const i = s[o], r = s[(o + 1) % s.length], a = i < r ? `${i}-${r}` : `${r}-${i}`, l = e.get(a);
        l ? l.push(n) : e.set(a, [n]);
      }
    }
    Ic.set(t, e);
  }
  return e;
}
function f2(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = na(t, n), o = gr(Zn(t, n)) ?? fo(), i = (r) => Math.max(0, Math.min(1, r));
  return t.parts.map((r) => {
    const a = r.fade ? i(xt(t, n, r.fade.control)) : 0;
    return {
      part: r,
      matrix: s.get(r.id),
      local: Et(o, s.get(r.id)),
      glow: r.glow ? i(xt(t, n, r.glow.control)) : 0,
      opacity: r.fade ? i(r.fade.from + (r.fade.to - r.fade.from) * a) : 1
    };
  });
}
function d2(t, e) {
  const n = t.derive ? { ...e, ...t.derive(e) } : e, s = na(t, n), o = Zn(t, n), i = {};
  for (const [r, a] of Object.entries(t.anchors ?? {})) {
    const l = a.part ? s.get(a.part) : o;
    if (!l) throw new Error(`prop rig: anchor "${r}" is on "${a.part}", which is not a part`);
    i[r] = Nt(l, a.at);
  }
  return i;
}
function p2(t, e) {
  if (!t.walls) return !1;
  const [n, s] = e.split("-").map((i) => t.vertices[Number(i)]), o = (i, r) => r.some((a) => Math.abs(n[i] - a) < 1e-6 && Math.abs(s[i] - a) < 1e-6);
  return o(0, t.walls.x) || o(2, t.walls.z);
}
function g2(t) {
  return t.reduce((e, n) => !e || n.length > e.length ? n : e, void 0);
}
const m2 = (t, e) => t[0] * e[0] + t[1] * e[1] + t[2] * e[2];
function Oc(t) {
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
function wu(t, e) {
  if (!t.loose?.size) return;
  const n = {};
  for (const [s, o] of t.loose)
    n[s] = { x: e[`piece.${o}.x`] ?? 0, y: e[`piece.${o}.y`] ?? 0, rotate: e[`piece.${o}.rotate`] ?? 0, opacity: e[`piece.${o}.opacity`] ?? 1 };
  return n;
}
function ku(t) {
  const e = {};
  for (const [n, s] of Object.entries({ ...os, ...t.rig.controls })) {
    const { bind: o, ...i } = s;
    e[n] = i;
  }
  return e;
}
function w5(t) {
  const { prop: e } = t, n = t.scale ?? 60, s = e.rig.length * n * 1.4, o = e.rig.height * n * 1.6, i = ku(e), r = {};
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
      l.translate(s / 2, o), N0(l, is(e, u, n), { ...a, time: h, loose: wu(c, u) });
    }
  };
}
function is(t, e, n) {
  const s = c2(xt(t.rig, e, "turn"), xt(t.rig, e, "tilt"), n);
  return bu(t.rig, e, s, n);
}
function sa(t, e, n) {
  const s = { ...t.props };
  let o = 0, i = 0;
  for (const [l, c] of e.state?.values.get(n) ?? [])
    typeof c == "number" && (l === "x" ? o = c : l === "y" ? i = c : l in s && (s[l] = c));
  const r = { x: t.x + t.width / 2 + o, y: t.y + t.height + i }, a = is(t.prop, s, t.propScale);
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
function k5(t, e, n, s, o = {}) {
  const i = sa(e, n, s);
  return t.save(), t.translate(i.origin.x, i.origin.y), N0(t, i.solved, {
    ...e.propDraw,
    time: n.time,
    loose: wu(e, i.values),
    // The rider is drawn in scene px.
    rider: o.rider ? (r) => {
      r.save(), r.translate(-i.origin.x, -i.origin.y), o.rider(r), r.restore();
    } : void 0
  }), t.restore(), i;
}
const Ln = {
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
}, y2 = 400, b2 = 0.2;
function v5(t, e = {}) {
  const { prop: n } = t, s = ku(n), o = Object.keys(s), i = Object.keys(n.rig.anchors ?? {}), r = n.rig.parts.map((v) => v.id), a = xo(), l = So(a), c = e.tracks?.length ? new Ct({ id: `${n.kind}-surface`, tracks: e.tracks }) : void 0, h = Math.max(0, ...(e.tracks ?? []).flatMap((v) => v.keyframes.map((x) => x.time))), u = /* @__PURE__ */ new Map(), f = /* @__PURE__ */ new Map();
  t.loose = f;
  const d = t.props, g = (v) => {
    const x = { ...t.props };
    let M = 0, w = 0;
    if (c) {
      const $ = c.getStateAtTime(Math.min(v, h));
      for (const E of $.values.values())
        for (const [A, H] of E)
          typeof H == "number" && (A === "x" ? M = H : A === "y" ? w = H : A in x && (x[A] = H));
    }
    for (const $ of o) a.keys($)?.length && (x[$] = a.valueAt($, v));
    return { values: x, origin: { x: t.x + t.width / 2 + M, y: t.y + t.height + w } };
  }, p = (v) => {
    const { kind: x, rest: M } = yn(v), w = ($) => We(n.kind, v, Ln, $);
    if (x === "box") {
      if (M) throw w("box takes no arguments");
      return { kind: x };
    }
    if (x === "anchor") {
      if (!i.includes(M)) throw w(ft(`${n.kind} anchor`, M, i));
      return { kind: x, name: M };
    }
    if (x === "part") {
      if (!r.includes(M)) throw w(ft(`${n.kind} part`, M, r));
      return { kind: x, name: M };
    }
    if (x === "control") {
      if (!o.includes(M)) throw w(ft(`${n.kind} control`, M, o));
      return { kind: x, name: M };
    }
    throw w();
  }, m = (v) => {
    const x = (n.rig.controls[v]?.bind ?? []).flatMap((w) => w.parts), M = n.rig.parts.filter((w) => w.glow?.control === v).map((w) => w.id);
    return /* @__PURE__ */ new Set([...x, ...M]);
  }, b = /* @__PURE__ */ new Map(), T = (v) => {
    let x = b.get(v);
    if (!x) {
      const M = g(v);
      b.set(v, x = { ...M, solved: is(n, M.values, t.propScale) });
    }
    return x;
  }, k = (v, x) => {
    const M = p(v), { values: w, origin: $, solved: E } = T(x);
    if (M.kind === "box") return yt($.x - t.width / 2, $.y - t.height, t.width, t.height);
    if (M.kind === "anchor") {
      const I = E.anchors[M.name].point, C = b2 * t.propScale;
      return yt($.x + I.x - C / 2, $.y + I.y - C / 2, C, C);
    }
    if (M.kind === "part") return H(/* @__PURE__ */ new Set([M.name]), `part "${M.name}" is`);
    const A = m(M.name);
    if (A.size === 0) return yt($.x - t.width / 2, $.y - t.height, t.width, t.height);
    return H(A, `the parts control "${M.name}" moves are`);
    function H(I, C) {
      const W = [...E.under, ...E.over].filter((L) => I.has(L.part.id)).flatMap((L) => L.faces.flatMap((F) => F.points));
      if (W.length === 0) {
        const L = Number.isFinite(x) ? `at ${x} ms` : "after its edits";
        throw new Error(`${n.kind}: ${C} turned away from the viewer ${L}; aim at an anchor (${i.map((F) => `anchor:${F}`).join(", ") || "none"}) or box`);
      }
      const D = W.map((L) => L.x), Y = W.map((L) => L.y), j = Math.min(...D), _ = Math.min(...Y);
      return yt($.x + j, $.y + _, Math.max(...D) - j, Math.max(...Y) - _);
    }
  }, y = (v, x) => {
    try {
      return k(v, x);
    } catch {
      return;
    }
  }, S = {
    kind: "prop",
    prop: t,
    about: Ln,
    target: t,
    box: yt(t.x, t.y, t.width, t.height),
    anchor(v, x = 1 / 0) {
      return k(v, x);
    },
    piece(v) {
      const x = p(v);
      if (x.kind !== "part") throw new Error(`${n.kind}: a piece is a part, part:ID (${r.slice(0, 6).map((E) => `part:${E}`).join(", ")}…), not "${v}"`);
      const M = u.get(x.name);
      if (M) return M;
      const w = [x.name];
      for (let E = 0; E < w.length; E++) for (const A of n.rig.parts) A.parent === w[E] && !w.includes(A.id) && w.push(A.id);
      const $ = { id: u.size + 1, part: x.name, home: k(v, 0) };
      u.set(x.name, $);
      for (const E of w) f.set(E, $.id);
      for (const E of ["x", "y", "rotate"]) d[`piece.${$.id}.${E}`] = 0;
      return d[`piece.${$.id}.opacity`] = 1, $;
    },
    edit(v, x, M) {
      if (!(v in Ln.edits)) throw To(n.kind, v, Ln);
      const w = Array.isArray(x) ? x : [x];
      if (w.length === 0) throw new Error(`${n.kind}.edit: ${v} takes at least one anchor`);
      if (b.clear(), v === "move" || v === "fling") {
        if (w.length > 1) throw new Error(`${n.kind}.edit: ${v} takes one part anchor`);
        const $ = S.piece(w[0]);
        if (v === "fling") return S.fling($, M);
        const E = M.to;
        if (!E) throw new Error(`${n.kind}.edit: move needs \`to\`, an anchor name or { x, y }`);
        const A = typeof E == "string" ? k(E, M.at) : void 0;
        return S.move($, { ...M, to: A ? { x: A.left + A.width / 2, y: A.top + A.height / 2 } : E });
      }
      for (const $ of w) {
        const E = p($);
        if (E.kind !== "control") throw new Error(`${n.kind}.edit: ${v} takes control anchors (control:${o.join(", control:")}), not "${$}"`);
        const A = s[E.name];
        let H;
        if (v === "set") {
          if (typeof M.value != "number" || !Number.isFinite(M.value)) throw new Error(`${n.kind}.edit: set needs \`value\`, a number (${E.name}: ${A.description})`);
          H = M.value;
        } else
          H = M.on === !1 ? A.default ?? A.min ?? 0 : A.max ?? 1;
        a.tween(E.name, g(M.at).values[E.name], H, M, y2);
      }
      return S;
    },
    follow(v, x) {
      return b.clear(), l.follow(v, x), S;
    },
    fling(v, x) {
      return b.clear(), l.fling(v, x), S;
    },
    move(v, x) {
      return b.clear(), l.move(v, x), S;
    },
    ride(v, x, M) {
      const w = [
        ...o.flatMap((E) => Jn(a.keys(E))),
        ...(e.tracks ?? []).flatMap((E) => Jn(E.keyframes.filter((A) => typeof A.value == "number")))
      ];
      if (w.length === 0) return v;
      const $ = [...i.map((E) => `anchor:${E}`), ...r.map((E) => `part:${E}`)].flatMap((E) => {
        const A = y(E, 0);
        return A ? [{ top: A.top, offset: (H) => (y(E, H)?.top ?? A.top) - A.top, windows: w }] : [];
      });
      return Vr(v, x, { ground: M.ground, every: M.every ?? Le, floors: $ });
    },
    tracks: a.tracks
  };
  return S;
}
const w2 = { body: "#e8574a", trim: "#3b3b44", glass: "#bfe3f2", tyre: "#2c2c33", hub: "#c9ccd3", light: "#fff4b8", tail: "#ff5a4f", inside: "#3b3640", seat: "#6d5d55" };
function Ae(t) {
  const e = { ...w2, ...t.colors }, n = [], { forwardMost: s, backMost: o, top: i } = vu(t);
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
      const b = h + (u - h) * 0.15, T = h + (u - h) * 0.55;
      n.push({
        id: `seat-back-${m}`,
        shape: { type: "panel", points: [[b, f + 0.05], [T, f + 0.05], [T - 0.08, d - 0.06], [b + 0.06, d - 0.04]], facing: p > 0 ? "left" : "right" },
        at: [p * (t.width / 2 + 6e-3), 0, 0],
        fill: e.seat,
        outline: 0.4
      }), n.push({
        id: `door-${m}`,
        shape: { type: "panel", points: g.map(([k, y]) => [k - u, y]), facing: p > 0 ? "left" : "right" },
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
      n.push({ id: `headlight-${b}`, shape: { type: "panel", points: m, facing: "front" }, at: [b * h, 0, d], fill: e.light, outline: 0.6, glow: { control: "lights", color: "#ffffff" } }), n.push({ id: `taillight-${b}`, shape: { type: "panel", points: m, facing: "back" }, at: [b * h, 0, g], fill: Ur(e.tail, 0.62), outline: 0.6, glow: { control: "lights", color: e.tail } });
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
    actions: v2(t),
    acting: k2,
    colors: { body: e.body, ink: "#26262b" },
    follow: t.antenna ? [{ control: "antenna", of: "x", per: 0.9, stiffness: 140, damping: 7, limit: 35 }] : void 0,
    wheelRadius: r,
    // In world metres: its wheels turn 180/π degrees per wheel radius covered.
    ...t.wheels.length > 0 ? { moves: { drive: { speed: t.speed ?? 6, perMetre: { wheelSpin: 180 / (Math.PI * r) } } } } : {}
  };
}
function vu(t) {
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
const k2 = {
  depth: { turn: 0, lift: 0, lights: 0, pitch: 1, roll: 1, squash: 1, lean: 1, door: 2 },
  limits: { turn: 0.08, pitch: 5, roll: 4, lean: 0.1, squash: 0.06, door: 0.12, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Ts(t, e, n, s, o, i, r = !1) {
  const a = t.facing() || Math.sign(s - t.x) || 1, l = t.values.wheelSpin ?? 0, c = (s - t.x) * a / t.scale;
  t.set("wheelSpin", e, l), t.move(e, n, s, { easing: o }), t.set("wheelSpin", n, r ? l : l + c / i * (180 / Math.PI), o);
}
const _c = 0.4;
function v2(t) {
  const e = t.wheels[0]?.radius ?? 0.4, { forwardMost: n, backMost: s } = vu(t), o = (n - s) / 2, i = (a, l, c) => {
    const h = a.exaggeration;
    let u = l;
    return a.facing() !== c && (u = a.turnTo(u, c > 0 ? "right" : "left")), a.key(u + 200, { pitch: 4 * h, squash: 1 - 0.07 * h, lean: -0.1 * h }, { act: !1, easing: "ease-out" }), Ts(a, u, u + 200, a.x - c * 0.15 * h * a.scale, "ease-out", e), a.effect({ kind: "exhaust", time: u + 150, x: a.x - c * o * a.scale, y: a.floor - 0.3 * a.scale, length: 900, direction: -c }), u + 260;
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
        const u = i(a, c, h), f = a.exaggeration, d = Math.abs(l.to - a.x), g = l.for ?? Math.max(500, d / (l.speed ?? _c));
        return a.effect({ kind: "dust", time: u, x: a.x - h * o * a.scale, y: a.floor, length: 600, direction: -h }), a.key(u + 140, { pitch: -1.5 * f, squash: 1 + 0.05 * f, lean: 0.12 * f }, { act: !1, easing: "ease-out" }), a.key(u + Math.max(160, g - 160), { pitch: 0, lean: 0.08 * f, squash: 1.02 }, { act: !1 }), Ts(a, u, u + g, l.to, "ease-in-out", e), r(a, u + g, !1), { end: u + g + 380, contact: u, release: u + g };
      }
    },
    brake: {
      summary: "Drives toward `to` and slams on the brakes: the wheels lock and it skids the last stretch, nose diving, leaving skid marks.",
      needs: ["to"],
      uses: ["speed", "for"],
      run(a, l, c) {
        const h = Math.sign(l.to - a.x);
        if (h === 0) return { end: c };
        const u = i(a, c, h), f = a.exaggeration, d = a.x, g = Math.abs(l.to - d), p = l.for ?? Math.max(600, g / (l.speed ?? _c * 1.2)), m = u + p * 0.55, b = d + (l.to - d) * 0.65;
        return a.key(u + 140, { pitch: -1.5 * f, squash: 1 + 0.06 * f, lean: 0.14 * f }, { act: !1, easing: "ease-out" }), Ts(a, u, m, b, "ease-in", e), a.key(m + 80, { pitch: -7 * f, lean: -0.12 * f, squash: 0.94 }, { act: !1, easing: "ease-out" }), Ts(a, m, u + p, l.to, "ease-out", e, !0), a.effect({ kind: "skid", time: m, x: b, toX: l.to, y: a.floor, length: p * 0.45 + 1500 }), a.effect({ kind: "dust", time: u + p, x: l.to + h * o * a.scale, y: a.floor, length: 600, direction: h }), r(a, u + p, !0), { end: u + p + 380, contact: m, release: u + p };
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
function M2(t = {}) {
  return Ae({
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
function x2(t = {}) {
  return Ae({
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
function S2(t = {}) {
  return Ae({
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
function T2(t = {}) {
  return Ae({
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
function E2(t = {}) {
  const e = t.colors?.body ?? "#a8743f";
  return Ae({
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
function A2(t = {}) {
  return Ae({
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
function $2(t = {}) {
  const e = t.colors?.body ?? "#e0473b", n = [0, 0.32, -0.05], s = [0, 0.86, -0.22], o = [0, 0.9, 0.42], i = [0, 0.34, 0.56], r = [0, 0.34, -0.56];
  return Ae({
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
function P2(t = {}) {
  return Ae({
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
function I2(t = {}) {
  const e = t.height ?? 2.4, n = t.trunkRadius ?? 0.16, s = t.canopy?.radius ?? 1.1, o = t.canopy?.shape === "tall", i = { trunk: "#8a5a3b", leaves: "#5cae5a", ...t.colors }, r = bn(t.canopy?.seed ?? 7), a = [
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
    actions: _2(),
    acting: O2,
    colors: { body: i.leaves }
  };
}
const O2 = {
  depth: { sway: 1, canopySway: 2, size: 0, squash: 1 },
  limits: { sway: 2, canopySway: 3, squash: 0.08 },
  eyes: [],
  headTurns: {},
  drift: []
};
function _2() {
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
function H2(t = {}) {
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
    actions: R2(!!d),
    acting: C2,
    colors: { body: r.walls }
  };
}
const C2 = {
  depth: { door: 1, lights: 0, roll: 1, squash: 1, size: 0 },
  limits: { door: 0.1, roll: 1.5, squash: 0.05 },
  eyes: [],
  headTurns: {},
  drift: []
};
function R2(t) {
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
function L2(t = {}) {
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
    actions: W2(),
    acting: Mu,
    colors: { body: e.body, ink: "#26262b" },
    // In world metres: flies with its rotor spinning (a blur), at the height a beat gives.
    moves: { fly: { speed: 15, flies: !0, hold: { blur: 1 }, perSecond: { rotor: we * 1e3 } } }
  };
}
const Mu = {
  depth: { turn: 0, lift: 0, blur: 0, pitch: 1, roll: 1, squash: 1, lean: 1, size: 0 },
  limits: { turn: 0.08, pitch: 6, roll: 6, squash: 0.06, lift: 0.15 },
  eyes: [],
  headTurns: {},
  drift: []
}, we = 2.6;
function W2() {
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
        t(n, o, o + 900, we, "ease-in"), n.key(o + 900, { blur: 1 }, { act: !1, easing: "ease-in" }), n.key(o + 700, { squash: 1 - 0.08 * i }, { act: !1, easing: "ease-in" });
        const a = o + 1e3;
        return n.key(a + 150, { squash: 1 + 0.06 * i, lift: 0.3 }, { act: !1, easing: "ease-out" }), n.key(a + 1300, { squash: 1, lift: r, pitch: -4 * i }, { act: !1, easing: "ease-in-out" }), n.key(a + 1700, { pitch: 0 }), t(n, o + 900, a + 1700, we), n.effect({ kind: "dust", time: a, x: n.x, y: n.floor, length: 900 }), { end: a + 1700, contact: a };
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
        return n.key(a + 300, { pitch: -9 * i, roll: 6 * i }, { act: !1, easing: "ease-out" }), n.key(a + c - 250, { pitch: -4 * i, roll: 3 * i, lift: h }, { act: !1 }), n.key(a + c, { pitch: 7 * i, roll: 0 }, { act: !1, easing: "ease-out" }), n.key(a + c + 450, { pitch: 0 }), n.move(a, a + c, s.to, { easing: "ease-in-out" }), t(n, o, a + c + 450, we), { end: a + c + 450, contact: a, release: a + c };
      }
    },
    hover: {
      summary: "Hovers in place for `for` ms (default 2000), bobbing gently.",
      uses: ["for"],
      run(n, s, o) {
        const i = s.for ?? 2e3, r = n.values.lift, a = n.exaggeration;
        for (let l = 350, c = 0; l < i; l += 350, c++)
          n.key(o + l, { lift: r + (c % 2 === 0 ? 0.12 : -0.06) * a, roll: (c % 2 === 0 ? 1.5 : -1.5) * a }, { act: !1, easing: "ease-in-out" });
        return n.key(o + i, { lift: r, roll: 0 }, { act: !1, easing: "ease-in-out" }), (e(n) || r > 0) && t(n, o, o + i, we), { end: o + i };
      }
    },
    land: {
      summary: "Settles down onto its skids: a flare, a squash on touchdown with dust, and the rotor spools down.",
      run(n, s, o) {
        const i = n.exaggeration, r = o + Math.max(900, n.values.lift * 450);
        return n.key(o + 400, { pitch: 3 * i }, { act: !1, easing: "ease-out" }), n.key(r, { lift: 0, pitch: 0, squash: 1 - 0.14 * i }, { act: !1, easing: "ease-in" }), n.key(r + 280, { squash: 1 }), t(n, o, r, we), t(n, r, r + 1600, we, "ease-out"), n.key(r + 1600, { blur: 0 }, { act: !1, easing: "ease-out" }), n.effect({ kind: "dust", time: r, x: n.x, y: n.floor, length: 800 }), { end: r + 1600, contact: r };
      }
    }
  };
}
function F2(t = {}) {
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
    actions: N2(),
    acting: Mu,
    colors: { body: e.body, ink: "#26262b" },
    moves: { fly: { speed: 30, flies: !0, hold: { blur: 1 }, perSecond: { rotor: we * 1e3 } } }
  };
}
const D2 = 3.2;
function N2() {
  const t = (n, s, o, i) => {
    const r = n.values.rotor ?? 0;
    n.set("rotor", s, r), n.set("rotor", o, r + D2 * (o - s) * (i ? 0.5 : 1), i);
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
const rs = ["walk", "trot", "canter", "gallop"], M5 = rs, xu = ["fl", "fr", "hl", "hr"], Ao = {
  walk: { offsets: { hl: 0, fl: 0.25, hr: 0.5, fr: 0.75 }, swing: 16, lift: 45, bob: 0.02, rock: 0, cycle: 1100 },
  trot: { offsets: { fl: 0, hr: 0, fr: 0.5, hl: 0.5 }, swing: 22, lift: 75, bob: 0.05, rock: 0, cycle: 640 },
  canter: { offsets: { hr: 0, hl: 0.33, fr: 0.33, fl: 0.66 }, swing: 30, lift: 70, bob: 0.08, rock: 5, cycle: 560 },
  gallop: { offsets: { hr: 0, hl: 0.1, fr: 0.5, fl: 0.6 }, swing: 40, lift: 80, bob: 0.1, rock: 7, cycle: 460 }
}, xe = Math.PI / 180;
function oa(t, e) {
  return 4 * t * Math.sin(Ao[e].swing * xe);
}
function $o(t) {
  const { legs: e, colors: n } = t, s = e.upper + e.lower + e.foot, o = s + t.body.rise, i = (u, f) => [f * u[0], u[1], u[2]], r = [
    { id: "body", shape: { type: "ellipsoid", radii: t.body.radii, segments: 18 }, at: [0, o, 0], fill: n.coat },
    // The neck tapers from the shoulders up to the head.
    { id: "neck", shape: { type: "tube", points: t.neck.points, radius: t.neck.points.map((u, f, d) => t.neck.radius * (1.25 - 0.4 * f / Math.max(1, d.length - 1))), segments: 12 }, at: t.neck.at, fill: n.coat },
    { id: "head", parent: "neck", shape: { type: "ellipsoid", radii: t.head.radii, segments: 14 }, at: t.head.at, rotate: t.head.rotate, fill: n.coat },
    ...j2(t, n, o)
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
    gait: { description: `Which gait: ${t.gaits.map((u) => `${rs.indexOf(u)} ${u}`).join(", ")}`, unit: "index", min: 0, max: 3 },
    neck: { description: "Neck bent down (+, eating, sniffing) or up (−, alert)", unit: "degrees", bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 } }] },
    // The tail bends along its length: each segment turns its share, so the whole tail curls.
    tail: { description: "Tail flicked up and back (+), curling along its length, on a spring behind the motion", unit: "degrees", bind: [{ parts: Vt, rotate: { axis: "x", degrees: 1 / Vt.length } }] },
    wag: { description: "Tail swung side to side, curling", unit: "degrees", bind: [{ parts: Vt, rotate: { axis: "y", degrees: 1 / Vt.length } }] },
    // The ears hinge at their base: laid back on a run, on a spring behind the motion.
    ears: { description: "Ears pricked forward (+) or laid back (−), on a spring behind the motion", unit: "degrees", bind: [{ parts: ["ear-left", "ear-right"], rotate: { axis: "x", degrees: 1, pivot: [0, -t.ears.radii[1], 0] } }] }
  };
  for (const u of xu) {
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
    derive: (u) => q2(u, t, s)
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
    actions: { ...K2(t, h), ...t.actions?.(h) },
    acting: Su,
    colors: { body: n.coat, ink: "#26262b" },
    follow: [
      { control: "tail", of: "x", per: 0.6, stiffness: 90, damping: 6, limit: 40 },
      { control: "ears", of: "x", per: 1.4, stiffness: 150, damping: 8, limit: 45 }
    ],
    moves: B2(t, s)
  };
}
function B2(t, e) {
  const n = (o) => {
    const i = oa(e, o);
    return {
      speed: i / (Ao[o].cycle * (t.cycleScale ?? 1) / 1e3),
      set: { gait: rs.indexOf(o) },
      hold: { walking: 1 },
      perMetre: { walk: 1 / i }
    };
  }, s = Object.fromEntries(t.gaits.map((o) => [o === "gallop" && !t.gaits.includes("canter") ? "run" : o, n(o)]));
  return t.gaits.includes("gallop") && !s.gallop && (s.gallop = n("gallop")), s;
}
const Vt = Array.from({ length: 7 }, (t, e) => e === 0 ? "tail" : `tail-${e}`);
function j2(t, e, n) {
  const s = z0(t.tail.points, Vt.length + 1), [, o, i] = t.body.radii, r = (t.tail.at[1] - n) / o, a = Math.abs(r) < 1 ? -i * Math.sqrt(1 - r * r) : t.tail.at[2], l = [t.tail.at[0], t.tail.at[1], a + Math.min(0.04, i * 0.08)], c = (d) => t.tail.radius * (1 - 0.5 * d / Vt.length), h = Vt.map((d, g) => {
    const p = s[g], m = s[g + 1], b = [m[0] - p[0], m[1] - p[1], m[2] - p[2]], T = g === 0 ? void 0 : s[g - 1];
    return {
      id: d,
      ...g > 0 ? { parent: Vt[g - 1] } : {},
      shape: { type: "tube", points: [[0, 0, 0], b], radius: [c(g), c(g + 1)], segments: 8, joined: !0 },
      // The first segment starts where the tail does; each next one starts at the end of the one before.
      at: g === 0 ? l : [p[0] - T[0], p[1] - T[1], p[2] - T[2]],
      fill: e.dark,
      outline: 0.8
    };
  }), u = s[s.length - 1], f = s[s.length - 2];
  return h.push({
    id: "tail-tip",
    parent: Vt[Vt.length - 1],
    shape: { type: "ellipsoid", radii: Array(3).fill(c(Vt.length) * 1.05), segments: 8 },
    at: [u[0] - f[0], u[1] - f[1], u[2] - f[2]],
    fill: e.dark,
    outline: 0.8,
    solidOnly: !0
  }), h;
}
function q2(t, e, n) {
  const s = Math.max(0, Math.min(1, t.walking ?? 0));
  if (s === 0) return {};
  const o = rs[Math.max(0, Math.min(3, Math.round(t.gait ?? 0)))], i = Ao[e.gaits.includes(o) ? o : e.gaits[0]], r = t.walk ?? 0, a = {};
  for (const c of xu) {
    const h = Math.PI * 2 * (r + i.offsets[c]);
    a[`${c}.swing`] = (t[`${c}.swing`] ?? 0) + s * i.swing * Math.sin(h), a[`${c}.knee`] = (t[`${c}.knee`] ?? 0) + s * i.lift * Math.max(0, Math.cos(h));
  }
  const l = Math.PI * 2 * r;
  return a.lift = (t.lift ?? 0) + s * i.bob * n * Math.abs(Math.sin(l * 2)), a.pitch = (t.pitch ?? 0) + s * i.rock * Math.sin(l), a.neck = (t.neck ?? 0) + s * (i.rock > 0 ? -i.rock * 1.4 : 5) * Math.sin(l * 2), a;
}
function Hc(t) {
  const n = Math.sin(32 * xe), s = t.legLength - (t.front - t.hind) * n, o = 72, r = (s - t.upper * Math.cos(o * xe) - t.foot) / t.lower, a = r >= 1 ? 0 : r <= -1 ? 180 : Math.acos(r) / xe, l = {
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
    l[`${c}.swing`] = o - 32, l[`${c}.knee`] = -(o + a), l[`${c}.ankle`] = a;
  return l;
}
const Su = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, neck: 2, tail: 3, wag: 3, "fl.swing": 2, "fr.swing": 2, "hl.swing": 2, "hr.swing": 2, "fl.knee": 3, "fr.knee": 3, "hl.knee": 3, "hr.knee": 3 },
  limits: { pitch: 6, neck: 8, tail: 10, wag: 8, "fl.swing": 8, "fr.swing": 8, "hl.swing": 8, "hr.swing": 8, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
}, x5 = Su;
function Y2(t) {
  const e = (t.upper + t.lower) * 0.32, n = Math.asin(Math.min(1, e / (t.upper + t.lower + t.foot))) / xe, s = {
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
function K2(t, e) {
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
      const g = Math.abs(l.to - a.x) / a.scale / oa(e.legLength, r), p = l.for ?? Math.max(500, g * Ao[r].cycle * n), m = a.values.walk ?? 0;
      return a.set("gait", u, a.values.gait ?? 0), a.set("gait", u + 1, rs.indexOf(r)), a.set("walking", u, 0), a.set("walking", u + 240, 1, "ease-out"), a.set("walking", u + p - 240, 1), a.set("walking", u + p, 0, "ease-in"), a.set("walk", u, m), a.move(u, u + p, l.to, { easing: "ease-in-out" }), a.set("walk", u + p, m + g, "ease-in-out"), a.key(u + p + 300, { neck: 0 }), (r === "gallop" || r === "canter") && (a.effect({ kind: "dust", time: u + 200, x: a.x - h * e.legLength * a.scale, y: a.floor, length: 700, direction: -h }), a.effect({ kind: "dust", time: u + p, x: l.to + h * e.legLength * 0.6 * a.scale, y: a.floor, length: 600, direction: h })), { end: u + p + 300, contact: u, release: u + p };
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
        const c = Hc(e), h = l + 450;
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
        const c = Y2(e), h = { ...Hc(e) }, u = l + 400, f = u + 450;
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
function z2(t = {}) {
  return $o({
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
          const i = n.exaggeration, r = Math.min(55, 32 * i), a = -e.hind * Math.sin(r * xe), l = s.for ?? 700;
          n.key(o + 200, { pitch: -4, neck: 6, "hl.knee": 12, "hr.knee": 12 }, { act: !1, easing: "ease-out" }), n.key(o + 520, { pitch: r, lift: a, neck: -25, "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-out" }), n.key(o + 520 + l * 0.5, { "fl.swing": 35, "fl.knee": 70, "fr.swing": 58, "fr.knee": 100 }, { act: !1, easing: "ease-in-out" }), n.key(o + 520 + l, { "fl.swing": 55, "fl.knee": 95, "fr.swing": 40, "fr.knee": 80 }, { act: !1, easing: "ease-in-out" });
          const c = o + 520 + l + 380;
          return n.key(c, { pitch: 0, lift: 0, neck: 8, squash: 0.94, "fl.swing": 0, "fl.knee": 0, "fr.swing": 0, "fr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(c + 320, { neck: 0, squash: 1 }), e.call(n, o + 520), n.effect({ kind: "dust", time: c, x: n.x + (n.facing() || 1) * e.front * n.scale, y: n.floor, length: 600 }), { end: c + 320, contact: c };
        }
      },
      buck: {
        summary: "Bucks: drops its head and kicks both hind legs up and back.",
        run(n, s, o) {
          const i = n.exaggeration, r = Math.min(35, 18 * i), a = e.front * Math.sin(r * xe);
          return n.key(o + 220, { pitch: 3, squash: 0.95 }, { act: !1, easing: "ease-out" }), n.key(o + 480, { pitch: -r, lift: a, neck: 30, "hl.swing": -65, "hr.swing": -60, "hl.knee": 10, "hr.knee": 10 }, { act: !1, easing: "ease-out" }), n.key(o + 900, { pitch: 0, lift: 0, neck: 0, squash: 0.95, "hl.swing": 0, "hr.swing": 0, "hl.knee": 0, "hr.knee": 0 }, { act: !1, easing: "ease-in" }), n.key(o + 1150, { squash: 1 }), n.effect({ kind: "dust", time: o + 900, x: n.x - (n.facing() || 1) * 0.6 * n.scale, y: n.floor, length: 600 }), { end: o + 1150, contact: o + 480 };
        }
      }
    })
  });
}
function X2(t = {}) {
  return $o({
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
function U2(t = {}) {
  return $o({
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
function G2(t = {}) {
  return $o({
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
function S5(t) {
  return oa(1, t);
}
const pe = 0.6, Tu = 75, yi = 80;
function ia(t) {
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
      shape: { type: "ellipsoid", radii: [t.wing.span * pe / 2, t.wing.chord * 0.1, t.wing.chord / 2], segments: 12 },
      at: [h * t.wing.span * pe / 2, 0, -t.wing.chord * 0.1],
      // Folded, the blade is rolled about its length so it lies flat against the body's side.
      rotate: [-yi, 0, 0],
      fill: e.wing,
      outline: 0.8
    }), a.push({
      id: `wing-${u}-tip`,
      parent: `wing-${u}-blade`,
      shape: { type: "ellipsoid", radii: [t.wing.span * pe / 2.4, t.wing.chord * 0.06, t.wing.chord * 0.3], segments: 10 },
      at: [h * t.wing.span * pe / 4, 0, -t.wing.chord * 0.3],
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
        { parts: ["wing-left-blade"], translate: [t.wing.span * (1 - pe) / 2, 0, 0], rotate: { axis: "x", degrees: yi }, scale: [1 / pe, 1, 1] },
        { parts: ["wing-right-blade"], translate: [-t.wing.span * (1 - pe) / 2, 0, 0], rotate: { axis: "x", degrees: yi }, scale: [1 / pe, 1, 1] }
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
      bind: [{ parts: ["neck"], rotate: { axis: "x", degrees: 1 }, translate: [0, -(t.neckReach ?? 0) / Tu, 0] }]
    },
    step: { description: "Phase of a walk, in steps (a chicken’s legs)", unit: "steps" },
    stepping: { description: "How much of the walk is applied", unit: "0..1", min: 0, max: 1 },
    "leg.left": { description: "Left leg swung forward (+)", unit: "degrees", bind: [{ parts: ["leg-left"], rotate: { axis: "x", degrees: -1 } }] },
    "leg.right": { description: "Right leg swung forward (+)", unit: "degrees", bind: [{ parts: ["leg-right"], rotate: { axis: "x", degrees: -1 } }] }
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
    actions: Z2(t),
    acting: J2,
    colors: { body: e.body, ink: "#26262b" },
    moves: V2(t)
  };
}
function V2(t) {
  const e = t.legs.length * 1.2, n = { walk: { speed: e / 0.42, hold: { stepping: 1 }, perMetre: { step: 0.5 / e } } };
  return t.flies !== !1 && (n.fly = { speed: 4 + t.wing.span * 12, flies: !0, hold: { flapping: 1, spread: 1 }, perSecond: { wingbeat: t.beatsPerSecond ?? 4 } }), n;
}
const J2 = {
  depth: { turn: 0, lift: 0, pitch: 1, roll: 1, squash: 1, spread: 1, flap: 2, peck: 2 },
  limits: { pitch: 6, roll: 6, squash: 0.06, peck: 8, flap: 10, lift: 0 },
  eyes: [],
  headTurns: {},
  drift: []
};
function Z2(t) {
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
          r.key(l + 120 + u * 300 + 90, { peck: Tu }, { act: !1, easing: "ease-in" }), r.key(l + 120 + u * 300 + 260, { peck: 20 }, { act: !1, easing: "ease-out" });
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
      const c = r.exaggeration, h = s(r, l, a.to), u = a.height ?? 2, f = a.for ?? Math.max(700, Math.abs(a.to - r.x) / 0.35), d = r.values.lift > t.legs.length, g = d ? h : h + 200;
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
      return r.set("flapping", l, r.values.flapping ?? 1), r.set("flapping", l + 700 - 120, 1), r.set("flapping", l + 700, 0, "ease-in"), n(r, l, l + 700), r.key(l + 700 * 0.6, { pitch: 14 }, { act: !1, easing: "ease-out" }), r.key(l + 700, { lift: h, pitch: 0, squash: 0.85 }, { act: !1, easing: "ease-in" }), a.to !== void 0 && r.move(l, l + 700, a.to, { easing: "ease-out" }), r.key(l + 700 + 160, { squash: 1, spread: 0, flap: 0 }), { end: l + 700 + 200, contact: l + 700 };
    }
  }) : i.flutter = {
    summary: "Flutters up a little way and back down, wings beating hard (a chicken’s flight).",
    run(r, a, l) {
      return r.key(l + 100, { spread: 1, squash: 0.9 }, { act: !1, easing: "ease-out" }), r.set("flapping", l + 80, 0), r.set("flapping", l + 160, 1, "ease-out"), r.set("flapping", l + 900 - 100, 1), r.set("flapping", l + 900, 0, "ease-in"), n(r, l + 80, l + 900), r.key(l + 900 * 0.5, { lift: t.legs.length * 2.5, squash: 1.08 }, { act: !1, easing: "ease-out" }), r.key(l + 900, { lift: 0, squash: 0.85, spread: 0 }, { act: !1, easing: "ease-in" }), r.key(l + 900 + 160, { squash: 1 }), { end: l + 900 + 160, contact: l + 900 };
    }
  }, i;
}
function Q2(t = {}) {
  return ia({
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
function tk(t = {}) {
  return ia({
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
function ek(t = {}) {
  return ia({
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
const Qn = { car: M2, truck: x2, bus: S2, tractor: T2, cart: E2, trainCar: A2, bike: $2, motorbike: P2, tree: I2, house: H2, helicopter: L2, airplane: F2, horse: z2, dog: X2, cat: U2, cow: G2, songbird: Q2, crow: tk, chicken: ek };
function nk(t, e = {}) {
  const n = Qn[t];
  if (!n) throw new Error(ft("prop preset", t, Object.keys(Qn)));
  return n(e);
}
const or = ["do", "at", "for", "to", "toward", "speed", "open", "on", "height", "wind"], ir = { viewer: 0, right: 1, away: 2, left: 3 }, sk = 420, Eu = {
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
function ra(t) {
  return { ...Eu, ...t.actions };
}
const bi = (t) => typeof t == "number" && Number.isFinite(t);
function ok(t, e) {
  if (!Array.isArray(t)) return [{ level: "error", beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = ra(e), s = Object.keys(n), o = [];
  return t.forEach((i, r) => {
    const a = (c) => o.push({ level: "error", beat: r, message: c });
    if (!i || typeof i != "object" || Array.isArray(i)) return a(`Each beat must be an object like { do: '${s[s.length - 1]}' }.`);
    const l = i;
    for (const c of Object.keys(l))
      or.includes(c) || a(ft("beat field", c, or, c === "duration" ? "for" : c === "direction" ? "toward" : void 0));
    if (typeof l.do != "string" || !s.includes(l.do)) return a(ft(`${e.kind} action`, l.do, s));
    for (const c of n[l.do].needs ?? []) l[c] === void 0 && a(`\`${l.do}\` needs \`${c}\`.`);
    for (const c of ["at", "for", "speed", "height", "wind"])
      l[c] !== void 0 && !(bi(l[c]) && l[c] >= 0) && a(`\`${c}\` must be a number ≥ 0 (got ${JSON.stringify(l[c])}).`);
    if (l.to !== void 0 && !bi(l.to) && a(`\`to\` is a scene x in px (got ${JSON.stringify(l.to)}).`), l.toward !== void 0 && !bi(l.toward) && !(typeof l.toward == "string" && l.toward in ir)) {
      const c = typeof l.toward == "string" ? Ns(l.toward, Object.keys(ir)) : void 0;
      a(`\`toward\` is viewer, right, away, left or a quarter-turn number${c ? ` (did you mean "${c}"?)` : ""} (got ${JSON.stringify(l.toward)}).`);
    }
    for (const c of ["open", "on"])
      l[c] !== void 0 && typeof l[c] != "boolean" && a(`\`${c}\` is true or false (got ${JSON.stringify(l[c])}).`);
  }), o;
}
function ik(t, e, n, s = {}) {
  const o = ok(n, e).filter((w) => w.level === "error");
  if (o.length > 0) throw new Error(`propScript (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((w) => `  beat ${w.beat}: ${w.message}`).join(`
`)}`);
  const i = s.from ?? 0, r = s.ground ?? 0, a = s.scale ?? 60, l = s.exaggeration ?? 1, c = ra(e), h = {};
  for (const w of [...Object.keys(os), ...Object.keys(e.rig.controls)]) h[w] = s.start?.[w] ?? xt(e.rig, {}, w);
  const u = [{ time: 0, pose: { ...h } }], f = /* @__PURE__ */ new Map(), d = [];
  let g = i, p = r;
  const m = (w, $, E, A) => {
    const H = f.get(w) ?? [{ time: 0, value: w === "x" || w === "y" ? 0 : h[w] }];
    H.push({ time: $, value: E, ...A ? { easing: A } : {} }), f.set(w, H), w !== "x" && w !== "y" && (h[w] = E);
  }, b = (w, $) => {
    const E = w === "x" ? g - i : w === "y" ? p - r : h[w], A = f.get(w);
    (!A || A[A.length - 1].time < $) && m(w, $, E);
  }, T = {
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
      const w = Math.sin(h.turn * Math.PI / 2);
      return Math.abs(w) < 0.5 ? 0 : w > 0 ? 1 : -1;
    },
    key(w, $, E = {}) {
      Object.assign(h, $), u.push({ time: w, pose: { ...h }, ...E.act === !1 ? { act: !1 } : {}, ...E.easing ? { easing: E.easing } : {} });
    },
    move(w, $, E, A = {}) {
      b("x", w), m("x", $, E - i, A.easing), g = E, A.floor !== void 0 && (b("y", w), m("y", $, A.floor - r, A.easing), p = A.floor);
    },
    set(w, $, E, A) {
      m(w, $, E, A);
    },
    turnTo(w, $) {
      const E = typeof $ == "number" ? $ : ir[$], A = h.turn, I = [E - 4, E, E + 4].map((W) => ({ t: W, d: Math.abs(W - A) })).sort((W, D) => W.d - D.d || Math.abs(W.t) - Math.abs(D.t))[0];
      if (I.d < 1e-3) return w;
      const C = w + sk * Math.max(1, I.d);
      return T.key(C, { turn: I.t }), C;
    },
    effect(w) {
      d.push(w);
    },
    anchor(w) {
      const E = is(e, h, a).anchors[w];
      if (!E) throw new Error(`${e.kind}: no anchor "${w}"`);
      return { x: g + E.point.x, y: p + E.point.y };
    }
  }, k = [];
  let y = 0;
  for (const w of n) {
    const $ = Math.max(w.at ?? y, u[u.length - 1].time), E = c[w.do].run(T, w, $);
    E.end > u[u.length - 1].time && u.push({ time: E.end, pose: { ...h } }), k.push({ start: $, end: E.end, ...E.contact !== void 0 ? { contact: E.contact } : {}, ...E.release !== void 0 ? { release: E.release } : {} }), y = E.end;
  }
  const S = ou(s.style ?? "snappy"), v = { ...S, anticipation: S.anticipation * l, overshoot: S.overshoot * l }, x = Jr(ck(u), e.acting, { style: v }), M = [
    // Controls keyed exactly (wheels, rotors) are not acted.
    ...Object.entries(x).filter(([w]) => !f.has(w)).map(([w, $]) => ({ id: `${t}-${w}`, target: t, property: w, keyframes: $ })),
    ...[...f].map(([w, $]) => ({ id: `${t}-${w}`, target: t, property: w, keyframes: hk($) }))
  ];
  for (const w of ak(t, e, M, y, u[0].pose)) {
    const $ = M.findIndex((H) => H.property === w.property);
    if ($ < 0) {
      M.push(w);
      continue;
    }
    const E = new Ct({ id: `${t}-own`, tracks: [M[$]] }), A = (H) => Number(E.getStateAtTime(H).values.get(t)?.get(w.property) ?? 0);
    M[$] = { ...w, keyframes: w.keyframes.map((H) => ({ time: H.time, value: Number(H.value) + A(H.time) })) };
  }
  return { tracks: M, duration: y, beats: k, effects: d };
}
const rk = 1500;
function ak(t, e, n, s, o) {
  if (!e.follow?.length) return [];
  const i = new Ct({ id: `${t}-follow`, tracks: n.filter((a) => a.property === "turn" || e.follow.some((l) => l.of === a.property)) }), r = (a, l) => {
    const c = i.getStateAtTime(a).values.get(t)?.get(l);
    return typeof c == "number" ? c : o[l] ?? 0;
  };
  return e.follow.map((a) => {
    const l = s + rk, c = As((f) => r(f, a.of), { start: 0, end: l, stiffness: a.stiffness, damping: a.damping }), h = a.limit ?? 1 / 0, u = c.map(({ time: f, value: d }) => {
      const g = Math.sin(r(f, "turn") * Math.PI / 2), p = (d - r(f, a.of)) * g;
      return { time: f, value: Math.max(-h, Math.min(h, p * a.per)) };
    });
    return { id: `${t}-${a.control}`, target: t, property: a.control, keyframes: u };
  });
}
const lk = 20;
function ck(t) {
  const e = [...t].sort((s, o) => s.time - o.time), n = [];
  for (const s of e) {
    const o = n[n.length - 1];
    o && s.time - o.time < lk ? n[n.length - 1] = { ...s, time: o.time } : n.push(s);
  }
  return n;
}
function hk(t) {
  const e = t.map((s, o) => ({ k: s, i: o })).sort((s, o) => s.k.time - o.k.time || s.i - o.i), n = [];
  for (const { k: s } of e)
    n.length > 0 && n[n.length - 1].time === s.time ? n[n.length - 1] = s : n.push(s);
  return n;
}
const uk = {
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
function fk(t, e = {}) {
  const n = {};
  for (const s of Object.keys(Lt)) n[s] = { summary: `Walks to \`to\` in the ${s} gait.`, needs: ["to"] };
  for (const s of Object.keys(Xt)) n[s] = { summary: `Moves into the ${s} pose and holds it (\`for\` ms).` };
  for (const s of Object.keys(ze)) n[s] = { summary: `The ${s} gag (${oo(s)} ms).` };
  for (const [s, o] of Object.entries(Eo)) n[s] = { ...o };
  return {
    ...t ? { version: t } : {},
    timing: "JSON timelines and tracks are in milliseconds; the GSAP-style API (live.to, tf.timeline) takes seconds. Scene x grows right, y grows down, in px.",
    easings: {
      named: Object.keys(uk),
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
    canvasProperties: ta,
    stickFigure: {
      poseFields: Oh,
      props: _h,
      handFields: Hh,
      poses: Object.keys(Xt),
      expressions: Object.keys(bt),
      gags: Object.fromEntries(Object.keys(ze).map((s) => [s, oo(s)])),
      gaits: Object.keys(Lt),
      actingStyles: Object.keys(cn),
      beatFields: tr,
      actions: n,
      dances: Object.fromEntries(Object.entries(Xe).map(([s, o]) => [s, Object.keys(o.moves)])),
      flips: Object.fromEntries(Object.entries(yo).map(([s, o]) => [s, o.label])),
      handShapes: Object.keys(_t),
      mudras: Object.keys(Di)
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
      beatFields: or,
      commonControls: Object.fromEntries(Object.entries(os).map(([s, o]) => [s, `${o.description}${o.unit ? ` (${o.unit})` : ""}`])),
      commonActions: Object.fromEntries(Object.entries(Eu).map(([s, o]) => [s, o.summary])),
      presets: Object.fromEntries(
        Object.entries(Qn).map(([s, o]) => {
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
      poses: Object.keys(Me),
      expressions: Object.keys(n0),
      gags: Object.keys(jr),
      builds: Object.keys(Bi),
      hair: Object.keys(c0),
      hairColors: { ...le },
      facialHair: Object.keys(w0),
      glasses: Object.keys(v0),
      hats: Object.keys(Br),
      cast: Object.keys(su),
      heldItems: Object.fromEntries(Object.entries(I0).map(([s, o]) => [s, o.hands])),
      handMeetings: Object.keys(so)
    },
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
      edits: nu
    },
    surfaces: { code: Cs, board: me, chart: on, prop: Ln },
    surfaceScript: {
      "surfaceScript(figureId, { name: surface }, beats, options)": "compiles beats that act on surfaces: returns the script result with `tracks` (the figure’s, ridden, then every surface’s, keyed by its name) and `figureTracks`; options are scriptTracks’ plus `figureStyle` (for carry) and `ride` (default true)",
      "checkSurfaceBeats(beats, surfaces, cast?)": "every problem checkBeats finds, plus unknown surfaces, places, edits and moments, with suggestions",
      "{ surface, anchor }": "a named place, where a beat takes `target` (its box), `to` (its centre x) or `onto` (its top); as laid out, before any edit moves it",
      "then: { surface, edit, anchor, at?, until?, …options }": "what the surface does in answer to the beat (or a list of them): one of its edits, or `carry` (the piece follows the hand until `until`); the other fields are the edit’s options",
      at: `a moment of the beat: ${jn.join(", ")} (default contact, or start when the beat has none); not ms`,
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
const kt = (t) => t.map((e) => `\`${e}\``).join(", "), Cc = (t) => Object.entries(t).map(([e, n]) => `| \`${e}\` | ${n.unit ?? n.kind ?? ""} | ${n.description} |`).join(`
`);
function T5(t, e = {}) {
  const n = fk(t, e), s = n.stickFigure;
  return [
    `# tinyfly capabilities${n.version ? ` (v${n.version})` : ""}`,
    "",
    "Generated from the library itself: every name below is accepted, and names not listed are rejected (beat scripts, code panels and `checkTracks` say which name was probably meant).",
    "",
    `**Timing.** ${n.timing}`,
    "",
    "## Easings",
    "",
    `Named: ${kt(n.easings.named)}.`,
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
    Cc(s.poseFields),
    "",
    "### Other props",
    "",
    "| Prop | Unit | What it does |",
    "|---|---|---|",
    Cc(s.props),
    "",
    `With \`style.hands\`, each hand has \`hand.left.<field>\` / \`hand.right.<field>\` props: ${kt(Object.keys(s.handFields))}.`,
    "",
    `**Poses** (a beat's \`do\`, or a pose key): ${kt(s.poses)}.`,
    "",
    `**Expressions** (a beat's \`mood\`): ${kt(s.expressions)}.`,
    "",
    `**Gags** (ms): ${Object.entries(s.gags).map(([i, r]) => `\`${i}\` (${r})`).join(", ")}.`,
    "",
    `**Gaits**: ${kt(s.gaits)}. **Acting styles** (\`style\`): ${kt(s.actingStyles)}.`,
    "",
    "### Beat scripts",
    "",
    `\`scriptTracks(target, beats, { from, ground, height, facing, style })\`. A beat has these fields only: ${kt(s.beatFields)}. Times are ms; \`to\` and \`target\` are scene px; \`onto\` is a floor's scene y.`,
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
    `**Hand shapes**: ${kt(s.handShapes)}. **Mudras**: ${kt(s.mudras)}.`,
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
    `Prop beat fields: ${kt(n.props.beatFields)}. Every prop has the controls ${Object.keys(n.props.commonControls).map((i) => `\`${i}\``).join(", ")} and the actions ${Object.keys(n.props.commonActions).map((i) => `\`${i}\``).join(", ")}.`,
    "",
    "| Preset | Family | Actions (needs) | Controls | Anchors |",
    "|---|---|---|---|---|",
    ...Object.entries(n.props.presets).map(
      ([i, r]) => `| \`${i}()\` | ${r.family} | ${Object.entries(r.actions).map(([a, l]) => `\`${a}\`${l.needs?.length ? ` (${l.needs.join(", ")})` : ""}`).join(", ")} | ${r.controls.map((a) => `\`${a}\``).join(", ")} | ${r.anchors.join(", ")} |`
    ),
    "",
    "## Character (v2 human)",
    "",
    `Poses: ${kt(n.character.poses)}. Expressions: ${kt(n.character.expressions)}. Gags: ${kt(n.character.gags)}.`,
    "",
    "Appearance options of `character({ … })`, all plain data that turns with the head (see docs/character-appearance.md):",
    "",
    `- \`build\`: ${kt(n.character.builds)}`,
    `- \`hair\`: ${kt(n.character.hair)} (colours: ${kt(Object.keys(n.character.hairColors))} in \`HAIR_COLORS\`)`,
    `- \`facialHair\`: ${kt(n.character.facialHair)}`,
    `- \`glasses\`: ${kt(n.character.glasses)}; \`hat\`: ${kt(n.character.hats)}; \`ears: true\``,
    "- `outfit`: `{ shirt, trousers, sleeves: short | long | none, bottom: trousers | shorts | skirt, collar, tie: colour, over: apron | labCoat, overColor }`",
    `- \`castMember(name, height)\`: ${kt(n.character.cast)}`,
    "- Face marks (pose fields, 0–1): `blush`, `tears`, `sweat`",
    "- Hair in motion (pose fields): `hair.swing` (degrees round the head, + toward its left), `hair.trail` (head radii back), `hair.lift` (head radii up); key them with `hairFollowTracks(target, tracks, who)` after the character's tracks, or `hairFollow` + `hairMotionAt` when posing per frame",
    `- \`holding\`: ${Object.entries(n.character.heldItems).map(([i, r]) => `\`${i}\` (${r === "both" ? "both" : r === "either" ? "one hand or both" : "left or right"})`).join(", ")}; pose fields \`held.left\`, \`held.right\`, \`held.both\` (below 0.5 lets go); \`handGrip(joints, side)\``,
    `- \`meetHands(kind, a, b)\` (stand them \`meetingSpacing(kind, a, b)\` apart): ${kt(n.character.handMeetings)}`,
    "",
    "## Code panel",
    "",
    `\`codePanel({ code, language, x, y, fontSize?, lineHeight?, width? })\`: a code listing as a scene object. Languages: ${kt(n.codePanel.languages)}. Remove styles: ${kt(n.codePanel.removeStyles)}.`,
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
function E5(t, e, n, s = {}) {
  const o = s.color ?? "#555", i = s.size ?? 60;
  for (const r of e) {
    const a = (n - r.time) / r.length;
    if (a <= 0 || a >= 1) continue;
    const l = te(`${r.kind}:${r.time}:${r.x}`);
    r.kind === "dust" ? iw(t, { x: r.x, y: r.y }, a, { size: i, color: o, seed: l }) : r.kind === "exhaust" ? gk(t, r, a, i, o, l) : r.kind === "skid" ? mk(t, r, a, n, o) : r.kind === "honk" ? yk(t, r, a, i, o) : r.kind === "smoke" ? dk(t, r, n, i, o) : r.kind === "leaves" && pk(t, r, a, i, s.leafColor ?? "#5cae5a", o, l);
  }
}
function dk(t, e, n, s, o, i) {
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
function pk(t, e, n, s, o, i, r) {
  const a = e.direction ?? 1, l = e.toY ?? e.y + s * 3;
  t.save(), t.lineWidth = Math.max(1, s * 0.02), t.strokeStyle = i, t.fillStyle = o;
  for (let c = 0; c < 4; c++) {
    const h = te(`${r}:${c}`) % 1e3 / 1e3, u = Math.min(1, n * (1.1 + h * 0.4)), f = e.x + (h - 0.5) * s * 1.2, d = e.y + (h - 0.3) * s * 0.4, g = u * u * 0.4 + u * 0.6, p = f + a * u * s * (0.6 + h) + Math.sin(u * 9 + h * 6) * s * 0.18, m = Math.min(l - 2, d + (l - d) * g);
    t.globalAlpha = n > 0.85 ? (1 - n) / 0.15 : 1, t.save(), t.translate(p, m), t.rotate(Math.sin(u * 7 + h * 5) * 1.2), t.beginPath(), t.ellipse(0, 0, s * 0.07, s * 0.035, 0, 0, Math.PI * 2), t.fill(), t.stroke(), t.restore();
  }
  t.restore();
}
function gk(t, e, n, s, o, i) {
  const r = e.direction ?? -1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1, s * 0.025);
  for (let a = 0; a < 3; a++) {
    const l = n * 1.6 - a * 0.25;
    if (l <= 0 || l >= 1) continue;
    const c = (te(`${i}:${a}`) % 100 / 100 - 0.5) * s * 0.1, h = e.x + r * l * s * 0.9, u = e.y - l * s * 0.45 + c;
    t.globalAlpha = (1 - l) * 0.9, t.beginPath(), t.arc(h, u, s * (0.06 + l * 0.14), 0, Math.PI * 2), t.stroke();
  }
  t.restore();
}
function mk(t, e, n, s, o) {
  const i = e.toX ?? e.x, r = Math.min(1, (s - e.time) / e.length * 3), a = e.x + (i - e.x) * r;
  t.save(), t.strokeStyle = o, t.lineCap = "round", t.globalAlpha = n < 0.6 ? 0.8 : 0.8 * (1 - (n - 0.6) / 0.4), t.lineWidth = 3;
  for (const l of [-2, 4])
    t.beginPath(), t.moveTo(e.x, e.y + l), t.lineTo(a, e.y + l), t.stroke();
  t.restore();
}
function yk(t, e, n, s, o) {
  const i = e.direction ?? 1;
  t.save(), t.strokeStyle = o, t.lineWidth = Math.max(1.5, s * 0.04), t.lineCap = "round", t.globalAlpha = n < 0.7 ? 1 : (1 - n) / 0.3;
  const r = s * (0.15 + 0.5 * (1 - (1 - n) ** 2));
  for (let a = -1; a <= 1; a++) {
    const l = a * Math.PI / 7, c = e.x + i * Math.cos(l) * r, h = e.y + Math.sin(l) * r;
    t.beginPath(), t.arc(c, h, s * 0.12, i > 0 ? -Math.PI / 3 : Math.PI * 2 / 3, i > 0 ? Math.PI / 3 : Math.PI * 4 / 3), t.stroke();
  }
  t.restore();
}
function A5(t) {
  const e = new Ct({ id: `${t.propId}-ride`, tracks: t.propTracks.filter((h) => h.target === t.propId) }), n = t.every ?? 33, s = [], o = [], i = [], r = [];
  let a = 1;
  for (let h = t.start; ; h = Math.min(t.end, h + n)) {
    const u = sa(t.prop, { state: e.getStateAtTime(h) }, t.propId), f = u.anchor(t.anchor);
    s.push({ time: h, value: f.x + (t.offset?.x ?? 0) - t.figure.x }), o.push({ time: h, value: f.y + (t.offset?.y ?? 0) - t.figure.y });
    const d = Math.sin(u.values.turn * Math.PI / 2);
    if (Math.abs(d) > 0.15 && (a = d > 0 ? 1 : -1), i.push({ time: h, value: Math.abs(d) }), r.push({ time: h, value: a }), h >= t.end) break;
  }
  const l = t.figureId, c = [
    { id: `${l}-x`, target: l, property: "x", keyframes: s },
    { id: `${l}-y`, target: l, property: "y", keyframes: o }
  ];
  return t.turn !== !1 && c.push({ id: `${l}-turn`, target: l, property: "turn", keyframes: i }, { id: `${l}-facing`, target: l, property: "facing", keyframes: bk(r) }), c;
}
function bk(t) {
  const e = [];
  for (const n of t) {
    const s = e[e.length - 1];
    s && s.value !== n.value && e.push({ time: n.time - 1, value: s.value }), (!s || s.value !== n.value || n === t[t.length - 1]) && e.push(n);
  }
  return e;
}
function $5(t, e, n) {
  const s = (r) => `${r.target}\0${r.property}`, o = new Map(e.map((r) => [s(r), r]));
  return [...t.map((r) => {
    const a = o.get(s(r));
    if (!a) return r;
    o.delete(s(r));
    const c = [...(r.keyframes ?? []).filter((h) => h.time < n.from || h.time > n.to), ...a.keyframes ?? []].sort((h, u) => h.time - u.time);
    return { ...r, keyframes: c };
  }), ...o.values()];
}
function P5(t) {
  const e = new Ct({ id: `${t.leaderId}-tow`, tracks: t.leaderTracks.filter((d) => d.target === t.leaderId) }), n = t.every ?? 33, s = t.towed, o = s.x + s.width / 2, i = s.props, r = s.prop.wheelRadius, a = [], l = [], c = [];
  let h = i.wheelSpin ?? 0, u;
  for (let d = t.start; ; d = Math.min(t.end, d + n)) {
    const g = sa(t.leader, { state: e.getStateAtTime(d) }, t.leaderId), p = g.anchor(t.hitch), m = g.values.turn, b = is(s.prop, { ...i, turn: m }, s.propScale).anchors[t.anchor];
    if (!b) throw new Error(`propTow: ${s.prop.kind} has no anchor "${t.anchor}"`);
    const T = p.x - b.point.x;
    if (u !== void 0 && r) {
      const k = Math.sin(m * Math.PI / 2);
      h += (T - u) * (k || 1) / s.propScale / r * (180 / Math.PI);
    }
    if (u = T, a.push({ time: d, value: T - o }), l.push({ time: d, value: m }), c.push({ time: d, value: h }), d >= t.end) break;
  }
  const f = t.towedId;
  return [
    { id: `${f}-x`, target: f, property: "x", keyframes: a },
    { id: `${f}-turn`, target: f, property: "turn", keyframes: l },
    ...r ? [{ id: `${f}-wheelSpin`, target: f, property: "wheelSpin", keyframes: c }] : []
  ];
}
const Rc = /* @__PURE__ */ new WeakMap();
function wk(t, e) {
  const n = e?.some(Boolean) ? e.map((f) => f ? 1 : 0).join("") : "";
  let s = Rc.get(t);
  s || Rc.set(t, s = /* @__PURE__ */ new Map());
  const o = s.get(n);
  if (o) return o;
  const i = ro(t), r = { vertices: i.vertices, faces: i.faces.filter((f, d) => !e?.[d]) }, a = r.vertices.flatMap((f) => [f[0], f[1], f[2]]), l = r.vertices.map(() => [0, 0, 0]), c = [];
  r.faces.forEach((f) => {
    for (const p of f.corners) for (const m of [0, 1, 2]) l[p][m] += f.normal[m];
    const [d, ...g] = f.corners;
    for (let p = 0; p + 1 < g.length; p++) {
      const [m, b, T] = [d, g[p], g[p + 1]], [k, y, S] = [r.vertices[m], r.vertices[b], r.vertices[T]], v = [y[0] - k[0], y[1] - k[1], y[2] - k[2]], x = [S[0] - k[0], S[1] - k[1], S[2] - k[2]], M = [v[1] * x[2] - v[2] * x[1], v[2] * x[0] - v[0] * x[2], v[0] * x[1] - v[1] * x[0]], w = M[0] * f.normal[0] + M[1] * f.normal[1] + M[2] * f.normal[2];
      c.push(...w >= 0 ? [m, b, T] : [m, T, b]);
    }
  });
  const h = l.flatMap((f) => {
    const d = Math.hypot(...f) || 1;
    return [f[0] / d, f[1] / d, f[2] / d];
  }), u = Zs({ positions: a, normals: h, indices: c });
  return s.size >= 16 && s.clear(), s.set(n, u), u;
}
function kk(t, e, n = {}) {
  const s = t.ink ?? n.ink ?? "#26262b", o = (n.outline ?? 2) * (t.outline ?? 1), i = t.glow && e.glow > 0 ? vk(t.glow.color, e.glow) : void 0;
  return {
    // A part with no fill (a spoked wheel's wire) is drawn in its ink.
    color: t.fill ?? s,
    // A smooth shape (an ellipsoid, a tube) shows only its silhouette, not the facets it is built of.
    creases: ro(t.shape).creases !== !1,
    shading: n.shading ?? "toon",
    ...o > 0 ? { outline: { width: o, color: s } } : {},
    ...i ? { emissive: i } : {},
    ...t.seeThrough ? { opacity: 0.45 * e.opacity } : e.opacity < 1 ? { opacity: e.opacity } : {}
  };
}
function vk(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t.trim());
  return n ? `#${[0, 2, 4].map((o) => Math.round(parseInt(n[1].slice(o, o + 2), 16) * Math.max(0, Math.min(1, e)))).map((o) => o.toString(16).padStart(2, "0")).join("")}` : t;
}
const Mk = Zs(i0(1, 2e-3, 28));
function xk(t, e, n) {
  const s = t.rig, [o, i] = s.footprint ?? [s.length * 0.45, s.length], r = Math.max(0, xt(s, e, "lift")), a = Math.max(0, xt(s, e, "size")) / (1 + r * 0.8);
  return {
    mesh: Mk,
    world: Et(n, pr([0, 4e-3, 0], [0, 0, 0, 1], [o * 0.55 * a || 1e-4, 1, i * 0.55 * a || 1e-4])),
    material: { color: "#000000", shading: "unlit", opacity: 0.16 * a }
  };
}
const Sk = /* @__PURE__ */ new Set([
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
]), Tk = 1, I5 = {
  kind: "prop",
  validate(t) {
    const e = t, n = typeof e.prop == "string" && e.prop in Qn ? [] : [ft("prop preset", e.prop, Object.keys(Qn))];
    for (const [s, o] of [[0, "rotateX"], [1, "rotateY"], [2, "rotateZ"]])
      o in e && n.push(`${o} is a track, not a field: place it turned with rotation: [${[0, 1, 2].map((i) => i === s ? e[o] : 0).join(", ")}]`);
    return n;
  },
  prepare(t) {
    const e = t;
    return nk(e.prop, e.options);
  },
  // `lights` may be missing from a scene entry older than this add-on: treated as none.
  resolve({ object: t, prepared: e, values: n, world: s, camera: o, lights: i = [], fog: r, toScreen: a }) {
    const l = t, c = e, h = { ...l.values };
    for (const [x, M] of n)
      typeof M == "number" && !Sk.has(x) && (h[x] = M);
    h.turn = 0, h.tilt = 0;
    const u = Et(o.view, s), f = {
      toView: (x) => Nt(u, x),
      toScreen: (x) => a(x)
    }, d = f.toView([0, c.rig.height / 2, 0]);
    if (-d[2] <= o.near) return null;
    if (l.look === "mesh") {
      const x = f2(c.rig, h), M = x.map(({ part: E, local: A }) => ({ part: E.id, mesh: ro(E.shape), ...ea(ro(E.shape), A) })), w = mu(M), $ = x.map((E, A) => ({ ...E, hidden: yu(E.part.id, M[A].mesh, E.local, M[A].key, w) })).filter(({ opacity: E }) => E > 0.01).map(({ part: E, matrix: A, glow: H, opacity: I, hidden: C }) => ({
        mesh: wk(E.shape, C),
        world: Et(s, A),
        material: kk(E, { glow: H, opacity: I }, { shading: l.shading, ink: l.ink, outline: l.outline })
      }));
      return { meshes: l.shadow === !1 ? $ : [xk(c, h, s), ...$] };
    }
    const g = a(d), p = a(f.toView([0, c.rig.height / 2 + 1, 0])), m = Math.hypot(p.x - g.x, p.y - g.y), b = i.length === 0 ? void 0 : (x, M) => {
      const w = Nt(s, x), $ = [s[0] * M[0] + s[4] * M[1] + s[8] * M[2], s[1] * M[0] + s[5] * M[1] + s[9] * M[2], s[2] * M[0] + s[6] * M[1] + s[10] * M[2]], E = Math.hypot(...$) || 1;
      return { light: F0(w, [$[0] / E, $[1] / E, $[2] / E], i), fog: D0(r, Math.hypot(w[0] - o.position[0], w[1] - o.position[1], w[2] - o.position[2])) };
    }, T = bu(c.rig, h, f, m, { perspective: !0, near: o.near, slice: Tk, light: b }), k = { look: l.look, style: l.style, ink: l.ink, paper: l.paper, fog: r?.color }, y = B0(T), S = T.cells ?? [], v = Math.max(...S.map((x) => -x.depth), -d[2]);
    return {
      drawables: [
        ...l.shadow === !1 ? [] : [{ depth: v + c.rig.length, draw: (x) => j0(x, T, k) }],
        ...S.map((x) => ({
          depth: -x.depth,
          draw(M, w) {
            M.lineCap = "round", M.lineJoin = "round", Hy(M, x.parts, y, { ...k, time: w.time });
          }
        }))
      ]
    };
  }
}, Lc = ["do", "at", "for", "to", "through", "toward", "speed", "height", "open", "on", "wind"], Ek = 0.25, Ak = 800 / 180, $k = 220, Pk = 300, Ik = ["turn"];
function Ok(t) {
  const e = ra(t), n = Object.keys(t.moves ?? {});
  return Object.keys(e).filter((s) => !n.includes(s) && !Ik.includes(s) && !(e[s].needs ?? []).includes("to"));
}
function _k(t, e) {
  if (!Array.isArray(t)) return [{ beat: -1, message: `Beats must be an array of { do: … } objects (got ${typeof t}).` }];
  const n = Object.keys(e.moves ?? {}), s = Ok(e), o = [...n, "face", "hold", ...s.filter((r) => r !== "hold")], i = [];
  return t.forEach((r, a) => {
    const l = (u) => i.push({ beat: a, message: u });
    if (!r || typeof r != "object" || Array.isArray(r)) return l(`Each beat must be an object like { do: '${o[0] ?? "hold"}' }.`);
    const c = r, h = { duration: "for", path: "through", points: "through", position: "to", heading: "toward", direction: "toward" };
    for (const u of Object.keys(c)) Lc.includes(u) || l(ft("beat field", u, Lc, h[u]));
    if (typeof c.do != "string" || !o.includes(c.do)) {
      const u = c.do === "turn" ? "face" : void 0;
      return l(ft(`${e.kind} 3D beat`, c.do, o, u));
    }
    n.includes(c.do) && (c.to === void 0 && c.through === void 0 && l(`\`${c.do}\` needs \`to\` ([x, z] metres) or \`through\` (a list of them).`), c.to !== void 0 && !Re(c.to) && l(`\`to\` is a point on the ground, [x, z] metres (got ${JSON.stringify(c.to)}).`), c.through !== void 0 && !(Array.isArray(c.through) && c.through.length > 0 && c.through.every(Re)) && l("`through` is a list of points on the ground, each [x, z] metres.")), c.do === "face" && !(Re(c.toward) || typeof c.toward == "number") && l("`face` needs `toward`: a point [x, z] or a heading in degrees.");
  }), i;
}
function O5(t, e, n, s) {
  const o = _k(n, e);
  if (o.length > 0) throw new Error(`propScript3D (${e.kind}): ${o.length} problem(s) in the beats:
${o.map((k) => `  beat ${k.beat}: ${k.message}`).join(`
`)}`);
  const i = {};
  for (const k of [...Object.keys(os), ...Object.keys(e.rig.controls)]) i[k] = s.values?.[k] ?? xt(e.rig, {}, k);
  let [r, a] = s.position ?? [0, 0], l = s.heading ?? 0;
  const c = /* @__PURE__ */ new Map(), h = (k, y, S, v = "linear") => {
    const x = c.get(k) ?? [];
    x.push({ time: y, value: S, easing: v }), c.set(k, x);
  }, u = (k, y, S) => h(k, y, S);
  h("x", 0, r), h("z", 0, a), h("rotateY", 0, l);
  const f = (k, y) => {
    const S = eo(l, y);
    if (Math.abs(S) < 1) return k;
    const v = Math.max($k, Math.abs(S) * Ak);
    return u("rotateY", k, l), l += S, h("rotateY", k + v, l, "ease-in-out"), k + v;
  }, d = (k, y, S) => {
    const v = U0([[r, a], ...y.through ?? [y.to]]);
    if (v.length < 2) return S;
    const x = f(S, ln(v[0].point, v[1].point)), M = v[v.length - 1].at, w = y.for ?? M / (y.speed ?? k.speed) * 1e3, $ = Ht("ease-in-out"), E = Math.min(Pk, w / 4);
    for (const [D, Y] of Object.entries(k.set ?? {}))
      u(D, x, i[D]), h(D, x + 1, Y), i[D] = Y;
    const A = k.flies ? y.height ?? (i.lift > 0.05 ? i.lift : 2) : void 0, H = A !== void 0 && A > 0.05;
    for (const [D, Y] of Object.entries(k.hold ?? {}))
      u(D, x, i[D]), h(D, x + E, Y, "ease-out"), H || (h(D, x + w - E, Y), h(D, x + w, 0, "ease-in")), i[D] = H ? Y : 0;
    A !== void 0 && (u("lift", x, i.lift), h("lift", x + Math.min(w * 0.35, 1400), A, "ease-out"), h("lift", x + w, A), i.lift = A);
    const I = { ...i };
    let C = l;
    for (let D = 0; ; D = Math.min(M, D + Ek)) {
      const Y = x + V0($, D / M) * w, { point: j, direction: _ } = G0(v, D);
      C += eo(C, ln([0, 0], _)), h("x", Y, j[0]), h("z", Y, j[1]), h("rotateY", Y, C);
      for (const [L, F] of Object.entries(k.perMetre ?? {})) h(L, Y, I[L] + D * F);
      for (const [L, F] of Object.entries(k.perSecond ?? {})) h(L, Y, I[L] + (Y - x) / 1e3 * F);
      if (D >= M) break;
    }
    for (const [D, Y] of Object.entries(k.perMetre ?? {})) i[D] = I[D] + M * Y;
    for (const [D, Y] of Object.entries(k.perSecond ?? {})) i[D] = I[D] + w / 1e3 * Y;
    return [r, a] = v[v.length - 1].point, l = C, x + w;
  }, g = (k, y) => {
    const S = Object.fromEntries(Object.entries(k).filter(([x]) => !["at", "to", "through", "toward"].includes(x))), v = ik(t, e, [S], { start: { ...i, turn: 1 }, scale: 100, style: s.style, exaggeration: s.exaggeration });
    for (const x of v.tracks) {
      if (Hk.includes(x.property)) continue;
      const M = x.keyframes ?? [], w = i[x.property];
      if (!M.every(($) => $.value === w)) {
        u(x.property, y, w);
        for (const $ of M) $.time > 0 && c.get(x.property).push({ ...$, time: y + $.time });
        i[x.property] = M[M.length - 1].value;
      }
    }
    return y + v.duration;
  }, p = [];
  let m = 0;
  for (const k of n) {
    const y = k.at ?? m;
    let S = y;
    const v = e.moves?.[k.do];
    v ? S = d(v, k, y) : k.do === "face" ? S = f(y, typeof k.toward == "number" ? k.toward : ln([r, a], k.toward)) : k.do === "hold" ? S = y + (k.for ?? 1e3) : S = g(k, y), p.push({ do: k.do, start: y, end: S }), m = S;
  }
  const b = `${s.scene}/${t}`;
  return { tracks: [...c].map(([k, y]) => ({
    id: `${t}-${k}`,
    target: b,
    property: k,
    keyframes: X0(y)
  })), duration: m, beats: p, end: { position: [r, a], heading: l, values: { ...i } } };
}
const Hk = ["x", "y", "turn", "facing", "tilt"], Ck = 0.35, Au = {
  seated: Me.sit,
  astride: { ...Me.sit, "leg.left.spread": 26, "leg.right.spread": 26, "leg.left.swing": 40, "leg.right.swing": 40, "leg.left.knee": 70, "leg.right.knee": 70 },
  driving: { ...Me.sit, "arm.left.swing": 52, "arm.right.swing": 52, "arm.left.spread": 8, "arm.right.spread": 8, "arm.left.elbow": 38, "arm.right.elbow": 38, lean: 4 },
  cycling: { ...Me.sit, lean: 22, bend: 10, "head.nod": -14, "arm.left.swing": 58, "arm.right.swing": 58, "arm.left.spread": 10, "arm.right.spread": 10, "arm.left.elbow": 22, "arm.right.elbow": 22, "leg.left.spread": 6, "leg.right.spread": 6 }
}, Rk = 22, Wc = 38;
function Fc(t, e = Au.cycling) {
  const n = t * Math.PI * 2, s = (r) => ({
    swing: (e["leg.left.swing"] ?? 40) + Rk * Math.cos(n + r),
    // The knee straightens as the foot pushes down and over the bottom of the stroke.
    knee: (e["leg.left.knee"] ?? 70) + Wc * (0.5 + 0.5 * Math.cos(n + r)) - Wc * 0.5,
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
function _5(t) {
  const e = t.cadence ?? 1.2, n = Math.max(2, t.samplesPerTurn ?? 8), s = 1e3 / e / n, o = [];
  for (let i = t.start, r = 0; i < t.end; i += s, r++)
    o.push({ time: Math.round(i), pose: Fc((i - t.start) / 1e3 * e, t.base), ...r > 0 ? { act: !1 } : {} });
  return o.push({ time: t.end, pose: Fc((t.end - t.start) / 1e3 * e, t.base), act: !1 }), o;
}
const Dc = (t, e) => {
  const n = e * Math.PI / 180;
  return [t[0] * Math.cos(n) + t[2] * Math.sin(n), t[1], -t[0] * Math.sin(n) + t[2] * Math.cos(n)];
};
function H5(t) {
  const e = `${t.scene}/${t.propId}`, n = new Ct({ id: `${t.propId}-ride-3d`, tracks: t.propTracks.filter((m) => m.target === e) }), s = t.placement ?? {}, [o, i, r] = s.position ?? [0, 0, 0], a = t.prop.rig, l = O0({ ...t.character, height: 1 }), c = { ...mt, ...t.pose ?? Au.seated }, h = _r(l.plan, c, { height: t.height ?? 1.7, contact: l.contact }).hip, u = t.facing ?? 0, f = t.every ?? 33, d = { x: [], y: [], z: [], rotateY: [] };
  for (let m = t.start; ; m = Math.min(t.end, m + f)) {
    const b = n.getStateAtTime(m).values.get(e) ?? /* @__PURE__ */ new Map(), T = (I, C) => {
      const W = b.get(I);
      return typeof W == "number" ? W : C;
    }, k = { ...s.values };
    for (const I of Object.keys(a.controls)) k[I] = T(I, s.values?.[I] ?? xt(a, {}, I));
    for (const I of ["pitch", "roll", "squash", "lift", "lean", "size"]) k[I] = T(I, s.values?.[I] ?? xt(a, {}, I));
    const y = d2(a, k)[t.anchor];
    if (!y) throw new Error(`propRide3D: ${t.prop.kind} has no anchor "${t.anchor}" (it has ${Object.keys(a.anchors ?? {}).join(", ") || "none"})`);
    const S = T("rotateY", s.heading ?? 0), v = Dc(y, S), x = [T("x", o) + v[0], T("y", i) + v[1], T("z", r) + v[2]], M = S + u, w = Dc(h, M);
    let $ = [x[0] - w[0], x[1] - w[1], x[2] - w[2]];
    const E = (I, C) => {
      const W = C * C * (3 - 2 * C);
      return [I[0] + ($[0] - I[0]) * W, $[1] * W + Ck * Math.sin(Math.PI * C), I[1] + ($[2] - I[1]) * W];
    }, A = t.mount ? Math.max(1, t.mount.for ?? 450) : 0, H = t.dismount ? Math.max(1, t.dismount.for ?? 450) : 0;
    if (t.mount && m < t.start + A ? $ = E(t.mount.from, (m - t.start) / A) : t.dismount && m > t.end - H && ($ = E(t.dismount.to, (t.end - m) / H)), d.x.push({ time: m, value: $[0] }), d.y.push({ time: m, value: $[1] }), d.z.push({ time: m, value: $[2] }), d.rotateY.push({ time: m, value: M }), m >= t.end) break;
  }
  const g = t.riderId, p = `${t.scene}/${g}`;
  return Object.keys(d).map((m) => ({ id: `${g}-${m}`, target: p, property: m, keyframes: d[m] }));
}
function C5(t) {
  const { timeline: e } = t, n = new Ne();
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
const R5 = {
  timeline: Hd,
  to(t, e, n) {
    const s = new rn(n);
    return s.to(t, e), s;
  },
  from(t, e, n) {
    const s = new rn(n);
    return s.from(t, e), s;
  },
  fromTo(t, e, n, s) {
    const o = new rn(s);
    return o.fromTo(t, e, n), o;
  },
  set(t, e, n) {
    const s = new rn(n);
    return s.set(t, e), s;
  }
};
function $u(t, e, n) {
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
function Lk(t, e) {
  const n = t.length / 4, s = new Float32Array(n * 3), o = Math.min(0.999, Math.max(0, e));
  for (let i = 0; i < n; i++) {
    const r = t[i * 4] / 255, a = t[i * 4 + 1] / 255, l = t[i * 4 + 2] / 255, c = t[i * 4 + 3] / 255, h = Math.max(r, a, l);
    if (h <= o) continue;
    const u = (h - o) / (1 - o) * c / h;
    s[i * 3] = r * u, s[i * 3 + 1] = a * u, s[i * 3 + 2] = l * u;
  }
  return s;
}
function Nc(t, e, n, s, o) {
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
function Bc(t, e, n, s) {
  const o = Math.max(1, Math.round(s / Math.sqrt(3)));
  let i = t;
  for (let r = 0; r < 3; r++)
    i = Nc(i, e, n, o, !0), i = Nc(i, e, n, o, !1);
  return i;
}
function L5(t, e = {}) {
  const n = t.canvas, s = n.width, o = n.height;
  if (!(s > 0 && o > 0)) return;
  const i = Math.max(1, Math.round(e.downsample ?? 4)), r = Math.max(1, Math.ceil(s / i)), a = Math.max(1, Math.ceil(o / i)), l = $u(t, r, a), c = l?.getContext("2d");
  if (!l || !c) return;
  c.imageSmoothingEnabled = !0, c.drawImage(t.canvas, 0, 0, r, a);
  const h = Lk(c.getImageData(0, 0, r, a).data, e.threshold ?? 0.55), u = (e.radius ?? Math.max(s, o) * 0.02) / i, f = Bc(h, r, a, u), d = Bc(h, r, a, u * 3), g = e.halo ?? 0.6, p = c.createImageData(r, a);
  for (let m = 0; m < r * a; m++) {
    for (let b = 0; b < 3; b++) p.data[m * 4 + b] = Math.round(Math.min(1, f[m * 3 + b] + d[m * 3 + b] * g) * 255);
    p.data[m * 4 + 3] = 255;
  }
  c.putImageData(p, 0, 0), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalCompositeOperation = "lighter", t.globalAlpha = Math.max(0, e.strength ?? 0.9), t.imageSmoothingEnabled = !0, t.drawImage(l, 0, 0, s, o), t.restore();
}
function W5(t, e, n) {
  const s = n.width ?? 6, o = n.taper ?? 1, i = n.fade ?? 1, r = n.opacity ?? 1, a = n.blend === "add";
  if (t.save(), e.length >= 2) {
    const c = Fk(e, s, o, i, r);
    a ? (t.globalCompositeOperation = "lighter", rr(t, c, n.color)) : Dk(t, c, n.color);
  }
  const l = e[e.length - 1];
  if (n.head && l && n.head.radius > 0) {
    a && (t.globalCompositeOperation = "lighter");
    const c = n.head.color ?? n.color, h = t.createRadialGradient(l.at.x, l.at.y, 0, l.at.x, l.at.y, n.head.radius);
    h.addColorStop(0, c), h.addColorStop(0.35, c), h.addColorStop(1, Wk(t, c)), t.globalAlpha = r, t.fillStyle = h, t.beginPath(), t.arc(l.at.x, l.at.y, n.head.radius, 0, Math.PI * 2), t.fill();
  }
  t.restore();
}
function Wk(t, e) {
  t.fillStyle = e;
  const n = String(t.fillStyle), s = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(n);
  if (s) return `rgba(${parseInt(s[1], 16)}, ${parseInt(s[2], 16)}, ${parseInt(s[3], 16)}, 0)`;
  const o = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(n);
  return o ? `rgba(${o[1]}, ${o[2]}, ${o[3]}, 0)` : "rgba(0, 0, 0, 0)";
}
function Fk(t, e, n, s, o) {
  const i = t.map((c) => ({ x: c.at.x, y: c.at.y, width: e * (1 - n * c.age) })), r = id(i), a = rd(i) ?? void 0, l = [];
  for (let c = 0; c + 1 < t.length; c++) {
    const h = (t[c].age + t[c + 1].age) / 2, u = o * (1 - s * h);
    if (u <= 0) continue;
    const f = c + 2 === t.length;
    l.push({ corners: [r.left[c], r.left[c + 1], r.right[c + 1], r.right[c]], alpha: u, ...f && a && { cap: a } });
  }
  return l;
}
function rr(t, e, n) {
  t.fillStyle = n;
  for (const s of e) {
    const [o, i, r, a] = s.corners;
    t.globalAlpha = Math.min(1, s.alpha), t.beginPath(), t.moveTo(o.x, o.y), t.lineTo(i.x, i.y), s.cap && t.arc(s.cap.x, s.cap.y, s.cap.radius, s.cap.start, s.cap.start - Math.PI, !0), t.lineTo(r.x, r.y), t.lineTo(a.x, a.y), t.closePath(), t.fill();
  }
}
function Dk(t, e, n) {
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
  const u = Math.floor(a) - 1, f = Math.floor(l) - 1, d = s ? $u(t, Math.ceil(c) + 1 - u, Math.ceil(h) + 1 - f) : null, g = d?.getContext("2d");
  if (!d || !g) {
    rr(t, e, n);
    return;
  }
  g.translate(-u, -f), g.globalCompositeOperation = "lighter", rr(g, r, n), t.save(), t.setTransform(1, 0, 0, 1, 0, 0), t.globalAlpha = 1, t.drawImage(d, u, f), t.restore();
}
const F5 = Ut.to, D5 = Ut.from, N5 = Ut.fromTo, B5 = Ut.set, j5 = Ut.timeline, q5 = Ut.ticker, Y5 = Ut.splitText, K5 = Ut.context, z5 = Ut.matchMedia, X5 = Ut.quickTo, U5 = Ut.imageSequence, G5 = Ut.pageTransition;
vg();
export {
  cn as ACTING_STYLES,
  Mu as AIRCRAFT_ACTING,
  rs as ANIMAL_GAITS,
  tr as BEAT_FIELDS,
  jn as BEAT_MOMENTS,
  J2 as BIRD_ACTING,
  Dl as BOARD_MARKS,
  bs as BOARD_THEMES,
  ta as CANVAS_PROPERTIES,
  Ll as CHARACTER_BEAT_3D_FIELDS,
  su as CHARACTER_CAST,
  Jy as CHARACTER_GAIT_SPEEDS,
  Kl as CHART_KINDS,
  on as CHART_SURFACE,
  ws as CHART_THEMES,
  Zi as CODE_LANGUAGES,
  nu as CODE_PANEL_EDITS,
  Cs as CODE_SURFACE,
  ub as CODE_THEME,
  jk as Clock,
  rn as CompatTimeline,
  Yp as CustomBounce,
  qp as CustomEase,
  Kp as CustomWiggle,
  Xe as DANCE_STYLES,
  th as DEFAULT_BAKE_INTERVAL_MS,
  la as DEFAULT_INERTIA_FRICTION,
  sg as DEFAULT_LABELS,
  Jt as DEFAULT_SPRING,
  Tv as DEFAULT_TRANSITION,
  Mh as Draggable,
  bt as EXPRESSIONS,
  w0 as FACIAL_HAIR_STYLES,
  _g as FINGERS,
  yo as FLIPS,
  aa as FORMAT_VERSION,
  ze as GAGS,
  Lt as GAITS,
  ac as GAIT_CYCLE_MS,
  v0 as GLASSES_STYLES,
  le as HAIR_COLORS,
  Gn as HAIR_STILL,
  c0 as HAIR_STYLES,
  so as HAND_MEETINGS,
  $t as HAND_REST,
  _t as HAND_SHAPES,
  Br as HAT_STYLES,
  I0 as HELD_ITEMS,
  x5 as HORSE_ACTING,
  M5 as HORSE_GAITS,
  C2 as HOUSE_ACTING,
  Qb as HUMAN_ACTING_RIG,
  Bi as HUMAN_BUILDS,
  n0 as HUMAN_EXPRESSIONS,
  jr as HUMAN_GAGS,
  Me as HUMAN_POSES,
  mt as HUMAN_REST,
  sb as IDENTITY_CAMERA,
  Lu as INERTIA_MAX_DURATION_MS,
  Hf as InertiaTrackPlayer,
  he as LiveTimeline,
  Gk as MORPH_SAMPLES,
  Di as MUDRAS,
  Bk as ManualClock,
  Ua as MediaSync,
  op as Observer,
  Xt as POSES,
  Lc as PROP_BEAT_3D_FIELDS,
  or as PROP_BEAT_FIELDS,
  Eu as PROP_COMMON_ACTIONS,
  os as PROP_COMMON_CONTROLS,
  Qn as PROP_PRESETS,
  Ln as PROP_SURFACE,
  Su as QUADRUPED_ACTING,
  Ji as REMOVE_STYLES,
  ct as REST_POSE,
  Au as RIDING_POSES,
  Le as SAMPLE_STEP,
  Eo as SCRIPT_ACTIONS,
  zc as SPRING_MAX_DURATION_MS,
  Oo as SPRING_PRESETS,
  On as SPRING_STEP_MS,
  Vb as STICK_ACTING_RIG,
  Ep as ScrollAnimator,
  po as ScrollDriver,
  Ap as ScrollMarkers,
  vp as ScrollPin,
  Ba as SmoothScroll,
  lo as SpringSampler,
  _f as SpringTrackPlayer,
  Vd as Stage,
  O2 as TREE_ACTING,
  Ct as Timeline,
  kr as TinyflyPlayer,
  Mg as TinyflySequencer,
  Lo as TrackPlayer,
  k2 as VEHICLE_ACTING,
  Ie as VISEMES,
  iv as ValueResolver,
  kp as VisibilityDriver,
  me as WHITEBOARD_SURFACE,
  ew as actCharacterTracks,
  Jr as actKeyframes,
  tw as actTracks,
  cu as actionNames,
  F2 as airplane,
  We as anchorError,
  oa as animalStrideLength,
  Zw as animatableProperties,
  L5 as applyBloom,
  Uv as applyCamera,
  Dm as applyGroove,
  ic as assertBeats,
  Uu as backOut,
  Cv as bakeDanceTracks,
  oh as bakeEasing,
  nh as bakeInertiaTrack,
  eh as bakeSpringTrack,
  by as basicOutfit,
  Ov as beatAt,
  ur as beatAtTime,
  fh as beatLength,
  hr as beatTime,
  uv as beatsBetween,
  $2 as bike,
  pg as bindChoiceHotspots,
  ia as bird,
  Xn as blendPose,
  Rh as boilFrame,
  Xu as bounceOut,
  qy as boxMesh,
  S2 as bus,
  Xv as cameraFromValues,
  Gv as cameraPoint,
  dv as cameraTracks,
  fk as capabilities,
  T5 as capabilitiesMarkdown,
  M2 as car,
  E2 as cart,
  i5 as castMember,
  U2 as cat,
  Jn as changingWindows,
  O0 as character,
  jv as characterAt,
  Sy as characterHandPose,
  vo as characterJoints,
  Fv as characterJointsInView,
  Kv as characterObjects,
  Ay as characterPartsInView,
  L0 as characterPoseOf,
  qv as characterPoseTracks,
  y5 as characterScript,
  zv as characterScript3D,
  Xw as characterStrideLength,
  Bv as characterTarget,
  Rf as charactersFor,
  o5 as chart,
  io as checkBeats,
  hu as checkCast,
  nb as checkCharacterBeats3D,
  ok as checkPropBeats,
  _k as checkPropBeats3D,
  Yw as checkSurfaceBeats,
  b5 as checkTracks,
  ek as chicken,
  Jv as circlePath,
  Eh as clamp01,
  Vk as clearMorphCache,
  Xk as clearPathCache,
  eu as clipErased,
  Ns as closestName,
  n5 as codePanel,
  yb as codeTokens,
  Fa as containerProgressAt,
  K5 as context,
  xt as controlValue,
  G2 as cow,
  Mv as create,
  ag as createControls,
  Ku as createCubicBezier,
  Jp as createLive,
  go as createPen,
  bn as createRandom,
  Si as createTrack,
  Kk as criticalDamping,
  tk as crow,
  zf as customBounce,
  Kf as customEase,
  Xf as customWiggle,
  Yy as cylinderMesh,
  Er as danceFrame,
  Pv as dancePose,
  Ni as danceStance,
  Iv as danceTaps,
  Hv as danceTracks,
  Xo as danceTravel,
  qm as danceTravelTrack,
  _v as dancer,
  d5 as defineAction,
  p5 as defineGait,
  Jw as describeTarget,
  qn as deserializeTimeline,
  Nf as deserializeTrack,
  fv as detectTempo,
  X2 as dog,
  yv as draggable,
  xr as drawCartoonHand,
  Ey as drawCharacter,
  Dv as drawCharacterInView,
  iw as drawDustPuff,
  J0 as drawEraser,
  Q0 as drawHand,
  Al as drawHeldItem,
  u5 as drawImpactStars,
  ob as drawPencil,
  k5 as drawProp,
  E5 as drawPropEffects,
  j0 as drawPropShadow,
  Hy as drawSolvedFaces,
  Yv as drawSolvedPart,
  N0 as drawSolvedProp,
  sw as drawSpeedLines,
  $m as drawStickFigure,
  h5 as drawStickSmear,
  W5 as drawTrail,
  Zv as drawnPathTarget,
  Bu as easeIn,
  Xc as easeInCubic,
  qu as easeInOut,
  ho as easeInOutCubic,
  Nu as easeInOutQuad,
  Fu as easeInQuad,
  ju as easeOut,
  Uc as easeOutCubic,
  Du as easeOutQuad,
  ed as editDistance,
  To as editError,
  xo as editLog,
  zu as elasticOut,
  Za as ellipsePoints,
  Ky as ellipsoidMesh,
  e5 as erasable,
  Zr as expandBeats,
  If as expandParametricEasings,
  Xy as extrudeMesh,
  r1 as flipPose,
  Rv as flipTracks,
  a1 as flipTravel,
  jc as formatVersionFor,
  D5 as from,
  nv as fromJSON,
  N5 as fromTo,
  Jl as gag,
  oo as gagDuration,
  Qg as gaitPose,
  Ri as gaitStrideLength,
  Ht as getEasingFunction,
  Ds as getInterpolator,
  ih as getMotionPathPoint,
  Uk as getPathLength,
  rf as getPointAtProgress,
  rp as gridLinesFor,
  jb as hairFollow,
  c5 as hairFollowTracks,
  D1 as hairHangs,
  l5 as hairMotionAt,
  Fr as hairMotionOf,
  to as hairlineAt,
  Vv as handAt,
  Qo as handGrip,
  Ci as handJoints,
  Yg as handJointsAt,
  fu as handPath,
  At as handPose,
  Us as handProp,
  Ou as hasKeyframes,
  te as hashSeed,
  Av as headPoint,
  _u as heldTime,
  L2 as helicopter,
  ky as holdingLayers,
  z2 as horse,
  S5 as horseStrideLength,
  H2 as house,
  Lv as humanFieldLabel,
  my as humanGag,
  $0 as humanGaitPose,
  P0 as humanGaitStrideLength,
  M1 as humanPlan,
  vt as humanPose,
  U5 as imageSequence,
  es as inertiaDuration,
  ts as inertiaRest,
  ki as inertiaValueAt,
  zk as inertiaVelocityAt,
  Af as interpolateArray,
  Ef as interpolateColor,
  tv as interpolateMotionPath,
  ce as interpolateNumber,
  Pf as interpolatePathString,
  $f as interpolateQuaternion,
  Ma as interpolateString,
  Iu as isCubicBezierEasing,
  $l as isHeld,
  qe as isInertiaTrack,
  Nk as isMotionPathPoint,
  qc as isMotionPathTrack,
  Ws as isParametricEasing,
  ns as isPathData,
  Ye as isSpringTrack,
  ar as isTextTrack,
  Yk as isUnderdamped,
  ov as isUnresolved,
  Py as jointsInScene,
  Am as jointsToScene,
  vi as linear,
  au as lipSyncKeyframes,
  lu as lipSyncOver,
  f5 as lipSyncTracks,
  Y0 as lit,
  Ut as live,
  wu as loosePartsOf,
  Y2 as lyingPose,
  js as mapEase,
  mv as mat4,
  z5 as matchMedia,
  Kc as maxStaggerDistance,
  a5 as meetHands,
  r5 as meetingSpacing,
  v1 as mirrorHumanPose,
  Wm as mirrorPose,
  K0 as mixColors,
  zn as mixHandPoses,
  Nv as mixPoses,
  bf as morphPath,
  P2 as motorbike,
  mg as mount,
  wg as mountAll,
  av as narrationMarkers,
  lv as narrationSceneAt,
  Fs as naturalRest,
  cv as nearestBeat,
  hv as nextBeat,
  Ib as niceCeiling,
  G5 as pageTransition,
  Uy as panelMesh,
  Vu as parametricEasing,
  yn as parseAnchor,
  Wa as parseEdge,
  fn as parsePath,
  Th as parseTrigger,
  Kn as partialPath,
  Tg as pathLength,
  _5 as pedallingKeys,
  Fc as pedallingPose,
  m5 as persona,
  So as pieceMotion,
  rv as planNarration,
  vv as play,
  Sv as playSequence,
  wv as playWhenVisible,
  rh as playheadCrossings,
  vr as pointAlong,
  Gc as pointAtDistance,
  Wv as pointOnHead,
  nd as pointsToPath,
  Ot as pose,
  $v as poseTracks,
  ra as propActions,
  d2 as propAnchors3D,
  sa as propAt,
  ku as propControls,
  B0 as propLineWidth,
  I5 as propObjects,
  f2 as propPartsInSpace,
  nk as propPreset,
  A5 as propRide,
  H5 as propRide3D,
  ik as propScript,
  O5 as propScript3D,
  ro as propShapeMesh,
  v5 as propSurface,
  w5 as propTarget,
  P5 as propTow,
  c2 as propView,
  $o as quadruped,
  Jk as quat,
  C5 as quickPlay,
  X5 as quickTo,
  lh as randomBetween,
  sv as randomChoice,
  jf as randomSnapped,
  $y as reachCharacter,
  ou as resolveActingStyle,
  W0 as resolveCharacterPoseKeys,
  J1 as resolveFacialHair,
  mo as resolveGait,
  iy as resolveGlasses,
  N1 as resolveHair,
  cy as resolveHat,
  dy as resolveHeadLook,
  wy as resolveHolding,
  Sr as resolvePoseKeys,
  qf as resolveSequence,
  Gh as resolveStickFrame,
  Pm as resolveStickPose,
  uh as resolveValue,
  id as ribbon,
  rd as ribbonHeadCap,
  Vr as rideFloors,
  Be as rotateAbout,
  Ar as routineBeats,
  gn as rubberLimb,
  uu as scriptActionSummaries,
  Qr as scriptTracks,
  bv as scrollProgress,
  kv as scrubOnScroll,
  Qv as scrubPath,
  Ev as seatHeight,
  Bf as serializeTimeline,
  Df as serializeTrack,
  B5 as set,
  Ur as shade,
  Vy as shapeMesh,
  fr as shapeToPathData,
  Of as simplifyKeyframes,
  Hc as sittingPose,
  Hr as skeletonInView,
  Oi as sketchPen,
  z0 as smoothPath,
  wp as smoothToward,
  ip as snapAxis,
  xp as snapConfig,
  Tp as snapDuration,
  Sp as snapProgress,
  is as solveAt,
  Ir as solvePlanSpace,
  bu as solveProp,
  Q2 as songbird,
  uw as soundsOf,
  Lw as speechDuration,
  $5 as spliceTracks,
  Y5 as splitText,
  Hu as springDuration,
  As as springFollow,
  qk as springValueAt,
  _r as stagePlanSpace,
  Yc as staggerDistance,
  lr as staggerOffset,
  wi as staggerOffsets,
  ao as staggerSpan,
  dw as stepsDuration,
  Gu as stepsEasing,
  ru as stepsToKeys,
  Zh as stickFigureAt,
  Pe as stickFigureJoints,
  Jh as stickFigureTarget,
  T1 as stickToHuman,
  nm as strideLength,
  yt as surfaceBox,
  g5 as surfaceScript,
  ng as syncMediaElement,
  sm as talkingMouth,
  Mr as taperedLine,
  ue as taperedOutline,
  Wf as textAt,
  R5 as tf,
  q5 as ticker,
  j5 as timeline,
  F5 as to,
  ev as toJSON,
  Zk as toKeyframedTrack,
  Qk as toKeyframedTracks,
  Oe as trackTargets,
  T2 as tractor,
  pv as trailSamples,
  A2 as trainCar,
  I2 as tree,
  Yn as triggerDistance,
  x2 as truck,
  Gy as tubeMesh,
  ft as unknownName,
  xv as unmount,
  Gr as valueAt,
  gv as vec3,
  Ae as vehicle,
  em as walkPose,
  s5 as whiteboard,
  t5 as withErased,
  He as withExpression
};
