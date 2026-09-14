function Hi(i) {
  return typeof i == "object" && i !== null && i.type === "cubic-bezier";
}
function Et(i) {
  return typeof i == "object" && i !== null && i.type !== "cubic-bezier";
}
const _t = 1;
function fe(i) {
  return i.property === "text" && "textConfig" in i;
}
function Z(i) {
  return i.kind === "inertia" && "inertia" in i;
}
function Q(i) {
  return i.kind === "spring" && "spring" in i;
}
function ai(i) {
  return i.property === "motionPath" && "motionPathConfig" in i;
}
function ao(i) {
  return typeof i == "object" && i !== null && "x" in i && "y" in i && "angle" in i;
}
function Gi(i) {
  return "keyframes" in i;
}
class co {
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
class lo {
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
        const s = (t - this._lastFrameTime) * this._speed;
        this._currentTime += s, this.onTick?.(s, this._currentTime);
      }
      this._lastFrameTime = t, this._scheduleFrame();
    }
  }
}
function ci(i, t, e = "start") {
  if (t <= 1) return 0;
  if (typeof e == "number") {
    const s = Math.max(0, Math.min(t - 1, e));
    return Math.abs(i - s);
  }
  switch (e) {
    case "end":
      return t - 1 - i;
    case "center":
      return Math.abs(i - (t - 1) / 2);
    case "edges":
      return (t - 1) / 2 - Math.abs(i - (t - 1) / 2);
    default:
      return i;
  }
}
function li(i, t = "start") {
  if (i <= 1) return 0;
  let e = 0;
  for (let s = 0; s < i; s++)
    e = Math.max(e, ci(s, i, t));
  return e;
}
function de(i, t, e) {
  if (e.offsets) return e.offsets[i] ?? 0;
  const s = e.from ?? "start", n = ci(i, t, s);
  if (e.amount !== void 0) {
    const r = li(t, s);
    return r === 0 ? 0 : e.amount * n / r;
  }
  return e.each !== void 0 ? e.each * n : 0;
}
function ie(i, t) {
  return Array.from({ length: i }, (e, s) => de(s, i, t));
}
function Dt(i, t) {
  return i <= 1 ? 0 : Math.max(...ie(i, t));
}
const dt = 1, hi = 6e4, Tt = hi / dt, N = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Yt = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class Ot {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? N.stiffness, this.damping = t.damping ?? N.damping, this.mass = t.mass ?? N.mass, this.restDelta = t.restDelta ?? N.restDelta, this.restSpeed = t.restSpeed ?? N.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? N.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const e = Math.floor(t / dt);
    if (this.simulateTo(e + 1), this.settledStep !== null && e >= this.settledStep)
      return this.to;
    const s = this.samples[Math.min(e, this.samples.length - 1)], n = this.samples[Math.min(e + 1, this.samples.length - 1)], r = t / dt - e;
    return s + (n - s) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Tt + 1), this.settledStep !== null ? this.settledStep * dt : hi;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const e = Math.min(t, Tt + 1), s = dt / 1e3;
    for (; this.samples.length < e; ) {
      const n = this.samples[this.samples.length - 1], r = n - this.to, o = -this.stiffness * r, a = -this.damping * this.velocity, c = (o + a) / this.mass;
      this.velocity += c * s;
      const l = n + this.velocity * s;
      if (this.samples.push(l), this.isAtRest(l)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Tt && (this.settledStep = Tt);
  }
}
function ho(i, t) {
  return new Ot(i).valueAt(t);
}
function Ki(i) {
  return new Ot(i).settleTime();
}
function uo(i) {
  const t = i.stiffness ?? N.stiffness, e = i.damping ?? N.damping, s = i.mass ?? N.mass;
  return e < 2 * Math.sqrt(t * s);
}
function fo(i) {
  const t = i.stiffness ?? N.stiffness, e = i.mass ?? N.mass;
  return 2 * Math.sqrt(t * e);
}
const we = 4, Zi = 2e-3, Qi = 1e-4, Ji = 6e4;
function Bt(i) {
  const t = i.friction ?? we;
  return t > 0 ? t : we;
}
function Ct(i) {
  return i.from + i.velocity / Bt(i);
}
function ts(i, t) {
  if (t === void 0) return i;
  if (typeof t == "number")
    return t > 0 ? Math.round(i / t) * t : i;
  if (t.length === 0) return i;
  let e = t[0];
  for (const s of t)
    Math.abs(s - i) < Math.abs(e - i) && (e = s);
  return e;
}
function yt(i) {
  let t = ts(Ct(i), i.end);
  return i.min !== void 0 && (t = Math.max(i.min, t)), i.max !== void 0 && (t = Math.min(i.max, t)), t;
}
function bt(i) {
  const t = Math.abs(yt(i) - i.from);
  if (t === 0) return 0;
  const e = i.restDelta ?? Math.max(Qi, t * Zi);
  if (e >= t) return 0;
  const s = Math.log(t / e) / Bt(i);
  return Math.min(Ji, s * 1e3);
}
function se(i, t) {
  if (t <= 0) return i.from;
  const e = yt(i);
  if (t >= bt(i)) return e;
  const s = Bt(i);
  return i.from + (e - i.from) * (1 - Math.exp(-s * t / 1e3));
}
function po(i, t) {
  const e = Bt(i), s = yt(i);
  return t >= bt(i) ? 0 : (s - i.from) * e * Math.exp(-e * Math.max(0, t) / 1e3);
}
const ne = (i) => i, es = (i) => i * i, is = (i) => 1 - (1 - i) * (1 - i), ss = (i) => i < 0.5 ? 2 * i * i : 1 - Math.pow(-2 * i + 2, 2) / 2, ui = (i) => i * i * i, fi = (i) => 1 - Math.pow(1 - i, 3), Nt = (i) => i < 0.5 ? 4 * i * i * i : 1 - Math.pow(-2 * i + 2, 3) / 2, ns = ui, rs = fi, os = Nt, as = {
  linear: ne,
  "ease-in": ns,
  "ease-out": rs,
  "ease-in-out": os,
  "ease-in-quad": es,
  "ease-out-quad": is,
  "ease-in-out-quad": ss,
  "ease-in-cubic": ui,
  "ease-out-cubic": fi,
  "ease-in-out-cubic": Nt
};
function cs(i) {
  const [t, e, s, n] = i, r = 3 * t, o = 3 * (s - t) - r, a = 1 - r - o, c = 3 * e, l = 3 * (n - e) - c, h = 1 - c - l, f = (p) => ((a * p + o) * p + r) * p, u = (p) => ((h * p + l) * p + c) * p, d = (p) => (3 * a * p + 2 * o) * p + r, m = (p) => {
    let g = p;
    for (let v = 0; v < 8; v++) {
      const T = f(g) - p;
      if (Math.abs(T) < 1e-7)
        return g;
      const w = d(g);
      if (Math.abs(w) < 1e-7)
        break;
      g -= T / w;
    }
    let y = 0, b = 1;
    for (g = p; y < b; ) {
      const v = f(g);
      if (Math.abs(v - p) < 1e-7)
        return g;
      p > v ? y = g : b = g, g = (y + b) / 2;
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
function Vt(i, t = "out") {
  if (t === "out") return i;
  const e = (s) => 1 - i(1 - s);
  return t === "in" ? e : (s) => s < 0.5 ? e(s * 2) / 2 : i(s * 2 - 1) / 2 + 0.5;
}
function ls(i = 1, t = 0.3) {
  const e = Math.max(1, i), s = t / (2 * Math.PI) * Math.asin(1 / e);
  return (n) => n <= 0 ? 0 : n >= 1 ? 1 : e * Math.pow(2, -10 * n) * Math.sin((n - s) * (2 * Math.PI) / t) + 1;
}
const hs = (i) => {
  if (i <= 0) return 0;
  if (i >= 1) return 1;
  if (i < 1 / 2.75) return 7.5625 * i * i;
  if (i < 2 / 2.75) {
    const n = i - 0.5454545454545454;
    return 7.5625 * n * n + 0.75;
  }
  if (i < 2.5 / 2.75) {
    const n = i - 0.8181818181818182;
    return 7.5625 * n * n + 0.9375;
  }
  const s = i - 2.625 / 2.75;
  return 7.5625 * s * s + 0.984375;
};
function us(i = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const e = t - 1;
    return e * e * ((i + 1) * e + i) + 1;
  };
}
function fs(i, t = "end") {
  const e = Math.max(1, Math.floor(i));
  return (s) => {
    if (s >= 1) return 1;
    if (s <= 0) return t === "start" || t === "both" ? t === "start" ? 1 / e : 1 / (e + 1) : 0;
    const n = Math.floor(s * e);
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
function ds(i) {
  switch (i.type) {
    case "steps":
      return fs(i.count, i.position);
    case "elastic":
      return Vt(ls(i.amplitude, i.period), i.mode);
    case "bounce":
      return Vt(hs, i.mode);
    case "back":
      return Vt(us(i.overshoot), i.mode);
  }
}
function W(i) {
  return i === void 0 ? ne : Hi(i) ? cs(i.points) : Et(i) ? ds(i) : as[i] ?? ne;
}
const Te = 32, ps = 256, tt = /* @__PURE__ */ new Map(), ms = /[MmLlHhVvCcSsQqTtAaZz]/, gs = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, ys = {
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
function bs(i) {
  const t = [];
  let e = 0, s = null;
  const n = () => {
    for (; e < i.length && /[\s,]/.test(i[e]); ) e++;
  };
  for (; e < i.length && (n(), !(e >= i.length)); ) {
    const r = i[e];
    if (ms.test(r)) {
      s = { type: r, args: [] }, t.push(s), e++;
      continue;
    }
    if (!s) break;
    const o = s.type === "A" || s.type === "a", a = s.args.length % 7;
    if (o && (a === 3 || a === 4)) {
      if (r !== "0" && r !== "1") break;
      s.args.push(r === "1" ? 1 : 0), e++;
      continue;
    }
    const c = gs.exec(i.slice(e));
    if (!c) break;
    s.args.push(parseFloat(c[0])), e += c[0].length;
  }
  return t;
}
function vs(i, t, e, s, n, r, o, a, c) {
  if (i === a && t === c) return [];
  let l = Math.abs(e), h = Math.abs(s);
  if (l === 0 || h === 0) return [[i, t, a, c, a, c]];
  const f = n * Math.PI / 180, u = Math.cos(f), d = Math.sin(f), m = (i - a) / 2, p = (t - c) / 2, g = u * m + d * p, y = -d * m + u * p, b = g * g / (l * l) + y * y / (h * h);
  if (b > 1) {
    const I = Math.sqrt(b);
    l *= I, h *= I;
  }
  const v = r === o ? -1 : 1, T = l * l * h * h - l * l * y * y - h * h * g * g, w = l * l * y * y + h * h * g * g, x = v * Math.sqrt(Math.max(0, T / w)), S = x * l * y / h, _ = -x * h * g / l, L = u * S - d * _ + (i + a) / 2, A = d * S + u * _ + (t + c) / 2, M = (I, D, O, J) => {
    const Xt = I * O + D * J, wt = Math.sqrt((I * I + D * D) * (O * O + J * J)), at = Math.acos(Math.max(-1, Math.min(1, Xt / wt)));
    return I * J - D * O < 0 ? -at : at;
  }, E = M(1, 0, (g - S) / l, (y - _) / h);
  let k = M((g - S) / l, (y - _) / h, (-g - S) / l, (-y - _) / h);
  !o && k > 0 && (k -= 2 * Math.PI), o && k < 0 && (k += 2 * Math.PI);
  const P = Math.max(1, Math.ceil(Math.abs(k) / (Math.PI / 2))), C = k / P, $ = 4 / 3 * Math.tan(C / 4), R = (I) => {
    const D = l * Math.cos(I), O = h * Math.sin(I);
    return [u * D - d * O + L, d * D + u * O + A];
  }, j = (I) => {
    const D = -l * Math.sin(I), O = h * Math.cos(I);
    return [u * D - d * O, d * D + u * O];
  }, H = [];
  for (let I = 0; I < P; I++) {
    const D = E + I * C, O = D + C, [J, Xt] = R(D), [wt, at] = I === P - 1 ? [a, c] : R(O), [Wi, ji] = j(D), [Ui, zi] = j(O);
    H.push([J + $ * Wi, Xt + $ * ji, wt - $ * Ui, at - $ * zi, wt, at]);
  }
  return H;
}
function z(i, t, e, s, n) {
  const r = 1 - n;
  return r * r * r * i + 3 * r * r * n * t + 3 * r * n * n * e + n * n * n * s;
}
function xe(i, t, e, s, n) {
  const r = 1 - n;
  return 3 * r * r * (t - i) + 6 * r * n * (e - t) + 3 * n * n * (s - e);
}
function ct(i, t, e, s) {
  return {
    subpath: 0,
    type: "L",
    points: [e, s],
    startX: i,
    startY: t,
    endX: e,
    endY: s,
    length: Math.hypot(e - i, s - t)
  };
}
function xt(i, t, e) {
  const [s, n, r, o, a, c] = e, l = [0];
  let h = i, f = t, u = 0;
  for (let d = 1; d <= Te; d++) {
    const m = d / Te, p = z(i, s, r, a, m), g = z(t, n, o, c, m);
    u += Math.hypot(p - h, g - f), l.push(u), h = p, f = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [s, n, r, o, a, c],
    startX: i,
    startY: t,
    endX: a,
    endY: c,
    length: u,
    lengths: l
  };
}
function nt(i) {
  const t = tt.get(i);
  if (t) return t;
  const e = [];
  let s = 0, n = 0, r = 0, o = 0, a = null, c = null, l = -1;
  const h = /* @__PURE__ */ new Set(), f = (p) => {
    l < 0 && (l = 0), p.subpath = l, e.push(p);
  };
  for (const { type: p, args: g } of bs(i)) {
    const y = p.toUpperCase(), b = p !== y, v = ys[y];
    if (y === "Z") {
      (s !== r || n !== o) && f(ct(s, n, r, o)), l >= 0 && h.add(l), s = r, n = o, a = c = null;
      continue;
    }
    for (let T = 0; T + v <= g.length; T += v) {
      const w = g.slice(T, T + v), x = b ? s : 0, S = b ? n : 0;
      let _ = null, L = null;
      switch (y) {
        case "M":
          T === 0 ? (s = w[0] + x, n = w[1] + S, r = s, o = n, (l < 0 || e[e.length - 1]?.subpath === l) && l++) : (f(ct(s, n, w[0] + x, w[1] + S)), s = w[0] + x, n = w[1] + S);
          break;
        case "L":
          f(ct(s, n, w[0] + x, w[1] + S)), s = w[0] + x, n = w[1] + S;
          break;
        case "H":
          f(ct(s, n, w[0] + x, n)), s = w[0] + x;
          break;
        case "V":
          f(ct(s, n, s, w[0] + S)), n = w[0] + S;
          break;
        case "C": {
          const A = [w[0] + x, w[1] + S, w[2] + x, w[3] + S, w[4] + x, w[5] + S];
          f(xt(s, n, A)), _ = [A[2], A[3]], s = A[4], n = A[5];
          break;
        }
        case "S": {
          const [A, M] = a ? [2 * s - a[0], 2 * n - a[1]] : [s, n], E = [A, M, w[0] + x, w[1] + S, w[2] + x, w[3] + S];
          f(xt(s, n, E)), _ = [E[2], E[3]], s = E[4], n = E[5];
          break;
        }
        case "Q":
        case "T": {
          let A = s, M = n;
          y === "Q" ? (A = w[0] + x, M = w[1] + S) : c && (A = 2 * s - c[0], M = 2 * n - c[1]);
          const E = y === "Q" ? w[2] + x : w[0] + x, k = y === "Q" ? w[3] + S : w[1] + S;
          f(
            xt(s, n, [
              s + 2 / 3 * (A - s),
              n + 2 / 3 * (M - n),
              E + 2 / 3 * (A - E),
              k + 2 / 3 * (M - k),
              E,
              k
            ])
          ), L = [A, M], s = E, n = k;
          break;
        }
        case "A": {
          const A = w[5] + x, M = w[6] + S;
          let E = s, k = n;
          for (const P of vs(s, n, w[0], w[1], w[2], w[3], w[4], A, M))
            f(xt(E, k, P)), E = P[4], k = P[5];
          s = A, n = M;
          break;
        }
      }
      a = _, c = L;
    }
  }
  const u = e.reduce((p, g) => p + g.length, 0), d = [];
  for (let p = 0; p < e.length; ) {
    const g = e[p].subpath;
    let y = p, b = 0;
    for (; y < e.length && e[y].subpath === g; ) b += e[y++].length;
    const v = e[p], T = e[y - 1], w = h.has(g) || Math.abs(T.endX - v.startX) < 1e-9 && Math.abs(T.endY - v.startY) < 1e-9;
    d.push({ start: p, end: y, length: b, closed: w }), p = y;
  }
  const m = { segments: e, totalLength: u, subpaths: d };
  return tt.size >= ps && tt.delete(tt.keys().next().value), tt.set(i, m), m;
}
function ws(i, t) {
  const e = i.lengths;
  if (t <= 0) return 0;
  if (t >= i.length) return 1;
  let s = 0, n = e.length - 1;
  for (; s < n - 1; ) {
    const a = s + n >> 1;
    e[a] < t ? s = a : n = a;
  }
  const r = e[n] - e[s], o = r > 0 ? (t - e[s]) / r : 0;
  return (s + o) / (e.length - 1);
}
function Ts(i, t) {
  if (i.type === "L") {
    const f = i.length > 0 ? Math.max(0, Math.min(1, t / i.length)) : 0;
    return {
      x: i.startX + (i.endX - i.startX) * f,
      y: i.startY + (i.endY - i.startY) * f,
      angle: Math.atan2(i.endY - i.startY, i.endX - i.startX) * 180 / Math.PI
    };
  }
  const [e, s, n, r, o, a] = i.points, c = ws(i, t);
  let l = xe(i.startX, e, n, o, c), h = xe(i.startY, s, r, a, c);
  if (Math.hypot(l, h) < 1e-9) {
    const f = c < 0.5 ? Math.min(1, c + 1e-3) : Math.max(0, c - 1e-3), u = z(i.startX, e, n, o, f), d = z(i.startY, s, r, a, f), m = z(i.startX, e, n, o, c), p = z(i.startY, s, r, a, c);
    l = c < 0.5 ? u - m : m - u, h = c < 0.5 ? d - p : p - d;
  }
  return {
    x: z(i.startX, e, n, o, c),
    y: z(i.startY, s, r, a, c),
    angle: Math.atan2(h, l) * 180 / Math.PI
  };
}
function di(i, t, e = 0, s = i.length) {
  if (s <= e) return { x: 0, y: 0, angle: 0 };
  let n = 0;
  for (let r = e; r < s; r++) {
    const o = i[r];
    if (n + o.length >= t || r === s - 1)
      return Ts(o, t - n);
    n += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function xs(i, t) {
  const { segments: e, totalLength: s } = nt(i);
  return di(e, Math.max(0, Math.min(1, t)) * s);
}
function mo() {
  tt.clear();
}
function go(i) {
  return nt(i).totalLength;
}
const ks = 24, Ss = 320, Ms = 2.5, lt = 72, yo = 64, As = 0.2, Ps = 128, pt = /* @__PURE__ */ new Map();
let At = 0, U;
const ke = (i) => Math.round(i * 100) / 100;
function Se(i, t) {
  const { segments: e, subpaths: s, totalLength: n } = nt(i);
  if (e.length === 0) return [];
  if (t) {
    const r = s.every((o) => o.closed);
    return [{ segments: e, start: 0, end: e.length, length: n, closed: r }];
  }
  return s.filter((r) => r.length > 0).map((r) => ({ segments: e, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function re(i, t) {
  const e = i.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), s = di(i.segments, e * i.length, i.start, i.end);
  return [s.x, s.y];
}
function Me(i) {
  const t = [];
  let e = 0;
  for (let s = i.start; s < i.end; s++)
    e += i.segments[s].length, i.length > 0 && t.push(e / i.length);
  return t;
}
function Ae(i, t) {
  const e = [];
  for (let s = 0; s < t; s++)
    e.push(re(i, i.closed ? s / t : s / (t - 1)));
  return e;
}
function Pe(i) {
  let t = 0, e = 0;
  for (const [s, n] of i)
    t += s, e += n;
  return t /= i.length, e /= i.length, i.map(([s, n]) => [s - t, n - e]);
}
function Es(i, t, e) {
  const s = i.closed && t.closed;
  if (e !== void 0)
    return { offset: s ? Math.abs(e) % lt / lt : 0, reversed: e < 0 };
  const n = Pe(Ae(i, lt)), r = Pe(Ae(t, lt)), o = lt;
  let a = { offset: 0, reversed: !1 }, c = 1 / 0;
  for (const l of [!1, !0]) {
    const h = s ? o : 1;
    for (let f = 0; f < h; f++) {
      let u = 0;
      for (let d = 0; d < o && u < c; d++) {
        const m = s ? l ? (f - d + o) % o : (d + f) % o : l ? o - 1 - d : d, p = n[d][0] - r[m][0], g = n[d][1] - r[m][1];
        u += p * p + g * g;
      }
      u < c && (c = u, a = { offset: s ? f / o : 0, reversed: l });
    }
  }
  return a;
}
function _s(i, t, e) {
  return e ? ((t.reversed ? t.offset - i : i + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - i : i;
}
function Cs(i, t, e) {
  return e ? ((t.reversed ? t.offset - i : i - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - i : i;
}
function Rs(i, t, e) {
  const s = i.closed && t.closed, n = Es(i, t, e.shapeIndex), r = Math.max(
    ks,
    Math.min(Ss, Math.ceil(Math.max(i.length, t.length) / Ms))
  ), o = /* @__PURE__ */ new Set(), a = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) a(f / r);
  for (const f of Me(i)) a(f);
  for (const f of Me(t)) a(Cs(f, n, s));
  let c = [...o].sort((f, u) => f - u);
  s && (c = c.filter((f) => f < 1));
  const l = [], h = [];
  for (const f of c)
    l.push(...re(i, f)), h.push(...re(t, _s(f, n, s)));
  return Is({ from: l, to: h, closed: s });
}
function Is(i) {
  const t = i.from.length / 2;
  if (t <= 3) return i;
  const e = new Uint8Array(t);
  e[0] = 1, e[t - 1] = 1;
  const s = [[0, t - 1]];
  for (; s.length > 0; ) {
    const [o, a] = s.pop();
    let c = -1, l = As;
    for (let h = o + 1; h < a; h++) {
      const f = Math.max(Ee(i.from, o, a, h), Ee(i.to, o, a, h));
      f > l && (l = f, c = h);
    }
    c !== -1 && (e[c] = 1, s.push([o, c], [c, a]));
  }
  const n = [], r = [];
  for (let o = 0; o < t; o++)
    e[o] && (n.push(i.from[o * 2], i.from[o * 2 + 1]), r.push(i.to[o * 2], i.to[o * 2 + 1]));
  return { from: n, to: r, closed: i.closed };
}
function Ee(i, t, e, s) {
  const n = i[t * 2], r = i[t * 2 + 1], o = i[e * 2] - n, a = i[e * 2 + 1] - r, c = i[s * 2] - n, l = i[s * 2 + 1] - r, h = o * o + a * a, f = h === 0 ? 0 : Math.max(0, Math.min(1, (c * o + l * a) / h));
  return Math.hypot(c - f * o, l - f * a);
}
function $s(i, t, e) {
  const s = e.shapeIndex;
  if (U && U.from === i && U.to === t && U.shapeIndex === s) return U.plan;
  const r = pt.get(String(s ?? "auto"))?.get(i)?.get(t);
  if (r)
    return U = { from: i, to: t, shapeIndex: s, plan: r }, r;
  const o = nt(i).subpaths.filter((d) => d.length > 0).length === nt(t).subpaths.filter((d) => d.length > 0).length, a = Se(i, !o), c = Se(t, !o), l = {
    pairs: a.map((d, m) => Rs(d, c[m], e))
  };
  At >= Ps && (pt.clear(), At = 0);
  const h = String(s ?? "auto"), f = pt.get(h) ?? /* @__PURE__ */ new Map();
  pt.set(h, f);
  const u = f.get(i) ?? /* @__PURE__ */ new Map();
  return f.set(i, u), u.set(t, l), At++, U = { from: i, to: t, shapeIndex: s, plan: l }, l;
}
function Fs(i, t, e, s = {}) {
  if (!i) return t;
  if (!t) return i;
  const n = Math.max(0, Math.min(1, e));
  if (n === 0) return i;
  if (n === 1) return t;
  const r = $s(i, t, s);
  if (r.pairs.length === 0) return n < 0.5 ? i : t;
  let o = "";
  for (const a of r.pairs) {
    for (let c = 0; c < a.from.length; c += 2) {
      const l = ke(a.from[c] + (a.to[c] - a.from[c]) * n), h = ke(a.from[c + 1] + (a.to[c + 1] - a.from[c + 1]) * n);
      o += `${c === 0 ? o ? " M" : "M" : " L"}${l} ${h}`;
    }
    a.closed && (o += " Z");
  }
  return o;
}
function bo() {
  pt.clear(), At = 0, U = void 0;
}
function vt(i) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(i);
}
const Y = (i, t, e) => i + (t - i) * e, pi = 512, Wt = /* @__PURE__ */ new Map(), jt = /* @__PURE__ */ new Map();
function _e(i) {
  const t = Wt.get(i);
  if (t) return t;
  const e = i.replace("#", ""), s = [
    parseInt(e.slice(0, 2), 16),
    parseInt(e.slice(2, 4), 16),
    parseInt(e.slice(4, 6), 16)
  ];
  return Wt.size < pi && Wt.set(i, s), s;
}
const Ce = (i) => i.charCodeAt(0) === 35, Re = (i) => i.startsWith("rgb"), Ie = (i) => i.startsWith("rgba"), Ls = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, Ut = (i) => Math.round(i).toString(16).padStart(2, "0");
function Ds(i, t, e) {
  return `#${Ut(i)}${Ut(t)}${Ut(e)}`;
}
function $e(i) {
  const t = jt.get(i);
  if (t) return t;
  const e = i.match(Ls);
  if (!e)
    throw new Error(`Invalid rgb color: ${i}`);
  const s = parseInt(e[1], 10), n = parseInt(e[2], 10), r = parseInt(e[3], 10), o = e[4] !== void 0 ? [s, n, r, parseFloat(e[4])] : [s, n, r];
  return jt.size < pi && jt.set(i, o), o;
}
const Os = (i, t, e) => {
  if (Ce(i) && Ce(t)) {
    const [s, n, r] = _e(i), [o, a, c] = _e(t), l = Y(s, o, e), h = Y(n, a, e), f = Y(r, c, e);
    return Ds(l, h, f);
  }
  if ((Re(i) || Ie(i)) && (Re(t) || Ie(t))) {
    const s = $e(i), n = $e(t), r = Math.round(Y(s[0], n[0], e)), o = Math.round(Y(s[1], n[1], e)), a = Math.round(Y(s[2], n[2], e));
    if (s.length === 4 || n.length === 4) {
      const c = s[3] ?? 1, l = n[3] ?? 1, h = Y(c, l, e);
      return `rgba(${r}, ${o}, ${a}, ${h})`;
    }
    return `rgb(${r}, ${o}, ${a})`;
  }
  return e < 1 ? i : t;
}, Bs = (i, t, e) => {
  const s = Math.min(i.length, t.length), n = [];
  for (let r = 0; r < s; r++)
    n.push(Y(i[r], t[r], e));
  return n;
}, Fe = (i, t, e) => e < 1 ? i : t, Ns = (i, t, e) => Fs(i, t, e);
function Rt(i) {
  return typeof i == "number" ? Y : Array.isArray(i) ? Bs : typeof i == "string" ? i.startsWith("#") || i.startsWith("rgb") ? Os : vt(i) ? Ns : Fe : Fe;
}
const mi = 1e3 / 60;
function gi(i, t = {}) {
  if (!Q(i))
    throw new Error(`bakeSpringTrack: track "${i.id}" is not a spring track`);
  const e = new Ot(i.spring);
  return bi(i, (s) => e.valueAt(s), e.settleTime(), i.spring.from, i.spring.to, t);
}
function yi(i, t = {}) {
  if (!Z(i))
    throw new Error(`bakeInertiaTrack: track "${i.id}" is not an inertia track`);
  const e = i.inertia;
  return bi(
    i,
    (s) => se(e, s),
    bt(e),
    e.from,
    yt(e),
    t
  );
}
function bi(i, t, e, s, n, r) {
  const o = r.intervalMs ?? mi, a = r.tolerance ?? 0.01, c = i.delay ?? 0, l = [];
  for (let f = 0; f <= e; f += o)
    l.push({ time: f + c, value: t(f), easing: "linear" });
  const h = l[l.length - 1];
  return !h || h.time < e + c ? l.push({ time: e + c, value: n, easing: "linear" }) : h.value = n, c > 0 && l.unshift({ time: 0, value: s, easing: "linear" }), {
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: a > 0 ? Xs(l, a) : l,
    ...i.targets && { targets: [...i.targets] },
    ...i.stagger && { stagger: { ...i.stagger } }
  };
}
function vi(i, t, e, s = {}) {
  const n = s.intervalMs ?? mi, r = typeof e == "function" ? e : W(e), o = Rt(i.value), a = t.time - i.time;
  if (a <= 0) return [t];
  const c = [];
  for (let h = n; h < a; h += n) {
    const f = h / a;
    c.push({
      time: i.time + h,
      value: o(i.value, t.value, r(f)),
      easing: "linear"
    });
  }
  const l = r(1);
  return c.push({ ...t, ...l !== 1 && { value: o(i.value, t.value, l) }, easing: "linear" }), c;
}
function vo(i, t) {
  return Q(i) ? gi(i, t) : Z(i) ? yi(i, t) : i;
}
function qs(i, t = {}) {
  const e = i.keyframes;
  if (!e.some((n) => Et(n.easing))) return i;
  const s = e.length > 0 ? [e[0]] : [];
  for (let n = 1; n < e.length; n++) {
    const r = e[n];
    Et(r.easing) ? s.push(...vi(e[n - 1], r, r.easing, t)) : s.push(r);
  }
  return { ...i, keyframes: s };
}
function wo(i, t) {
  return i.filter(Gi).map((e) => qs(e, t)).concat(
    i.filter(Q).map((e) => gi(e, t)),
    i.filter(Z).map((e) => yi(e, t))
  );
}
function Xs(i, t) {
  if (i.length <= 2) return i;
  const e = [i[0]];
  for (let s = 1; s < i.length - 1; s++) {
    const n = e[e.length - 1], r = i[s], o = i[s + 1], a = o.time - n.time;
    if (a <= 0) continue;
    const c = (r.time - n.time) / a, l = n.value + (o.value - n.value) * c;
    Math.abs(r.value - l) > t && e.push(r);
  }
  return e.push(i[i.length - 1]), e;
}
function oe(i) {
  const t = [...i.keyframes].sort((e, s) => e.time - s.time);
  return {
    ...i,
    keyframes: t
  };
}
function G(i) {
  return i.targets && i.targets.length > 0 ? i.targets : [i.target];
}
function rt(i, t, e, s) {
  const n = e ?? 0;
  return !s || t <= 1 ? n : n + de(i, t, s);
}
class zt {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = G(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - rt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const e = this.targets.length, s = [];
    for (let n = 0; n < e; n++) {
      const r = rt(n, e, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
      o !== void 0 && s.push({ target: this.targets[n], value: o, start: r + this.track.keyframes[0].time });
    }
    return s;
  }
  /**
   * Get the duration of this track — the last keyframe, plus any delay, the
   * widest stagger offset, and any trailing hold.
   */
  getDuration() {
    const { keyframes: t } = this.track;
    if (t.length === 0)
      return 0;
    const e = t[t.length - 1].time, s = this.track.stagger ? Dt(this.targets.length, this.track.stagger) : 0;
    return e + (this.track.delay ?? 0) + s + (this.track.endDelay ?? 0);
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
    const { from: s, to: n } = this.findSurroundingKeyframes(t);
    if (!s || !n)
      return;
    if (s.time === t)
      return s.value;
    const r = n.time - s.time, o = (t - s.time) / r, c = W(n.easing)(o);
    return Rt(s.value)(s.value, n.value, c);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: e } = this.track;
    for (let s = 0; s < e.length - 1; s++)
      if (t >= e[s].time && t <= e[s + 1].time)
        return { from: e[s], to: e[s + 1] };
    return { from: null, to: null };
  }
}
class Ys {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = G(t), this.sampler = new Ot(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - rt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, s = [];
    for (let n = 0; n < e; n++) {
      const r = rt(n, e, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[n], value: this.sampler.valueAt(t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Dt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class Vs {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = G(t), this.duration = bt(t.inertia);
  }
  getValueAtTime(t) {
    return se(this.track.inertia, t - rt(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const e = this.targets.length, s = [];
    for (let n = 0; n < e; n++) {
      const r = rt(n, e, this.track.delay, this.track.stagger);
      s.push({ target: this.targets[n], value: se(this.track.inertia, t - r), start: r });
    }
    return s;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? Dt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function wi(i, t) {
  const e = { ...xs(i.pathData, t) };
  if (i.matrix) {
    const [s, n, r, o, a, c] = i.matrix, { x: l, y: h } = e;
    e.x = s * l + r * h + a, e.y = n * l + o * h + c;
    const f = e.angle * Math.PI / 180, u = Math.cos(f), d = Math.sin(f);
    e.angle = Math.atan2(n * u + o * d, s * u + r * d) * 180 / Math.PI;
  }
  return i.autoRotate && i.rotateOffset && (e.angle += i.rotateOffset), e;
}
function To(i, t, e, s) {
  const n = t + (e - t) * s;
  return wi(i, n);
}
const Ht = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Ws = 20;
function js(i) {
  const t = Ht[i ?? "upperCase"] ?? i ?? Ht.upperCase, e = Array.from(t);
  return e.length > 0 ? e : Array.from(Ht.upperCase);
}
function Us(i, t, e) {
  let s = (i | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(e + 1, 2246822507);
  return s = Math.imul(s ^ s >>> 16, 2146121005), s = Math.imul(s ^ s >>> 15, 2221713035), (s ^ s >>> 16) >>> 0;
}
function zs(i, t, e = 0) {
  const s = i.from ?? "", n = i.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return s;
  if (r >= 1) return n;
  const o = Array.from(s), a = Array.from(n), c = i.rightToLeft ?? !1;
  if (i.mode === "type") {
    const b = Math.round(r * Math.max(o.length, a.length));
    return c ? o.slice(0, Math.max(0, o.length - b)).join("") + a.slice(Math.max(0, a.length - b)).join("") : a.slice(0, b).join("") + o.slice(b).join("");
  }
  const l = Math.max(0, Math.min(0.999, i.revealDelay ?? 0)), h = Math.max(0, (r - l) / (1 - l)), f = Math.floor(h * a.length), u = i.tweenLength === !1 ? a.length : Math.round(o.length + (a.length - o.length) * r), d = js(i.chars), m = i.refreshRate ?? Ws, p = m > 0 ? Math.floor(e * m / 1e3) : 0, g = i.seed ?? 1;
  let y = "";
  for (let b = 0; b < u; b++) {
    const v = c ? b >= u - f : b < f, T = c ? a[a.length - (u - b)] : a[b];
    v && T !== void 0 || T === " " || T === `
` ? y += T : y += d[Us(g, b, p) % d.length];
  }
  return y;
}
class Ti {
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
  constructor(t) {
    if (this.id = t.id, this.name = t.name, this._captions = t.captions, this._config = t.config ?? {}, this._explicitDuration = t.config?.duration, t.tracks)
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
      for (const [s, n] of this._trackPlayers) {
        const r = n.getTrack().property;
        for (const { target: o, value: a, start: c } of n.getTargetValues(t))
          this._write(e, s, o, r, a, t - c);
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
    const s = /* @__PURE__ */ new Map();
    for (const [n, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: a, value: c, start: l } of r.getTargetValues(t)) {
        const h = `${a}\0${o}`, f = l <= t, u = s.get(h);
        (!u || (f !== u.started ? f : f ? l >= u.start : l <= u.start)) && s.set(h, { trackId: n, target: a, property: o, value: c, start: l, started: f });
      }
    }
    for (const { trackId: n, target: r, property: o, value: a, start: c } of s.values())
      this._write(e, n, r, o, a, t - c);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, e, s, n, r, o) {
    if (r === void 0) return;
    let a = t.get(s);
    a || (a = /* @__PURE__ */ new Map(), t.set(s, a));
    const c = this._textTracks.get(e);
    if (c && typeof r == "number") {
      a.set("text", zs(c.textConfig, r, Math.max(0, o)));
      return;
    }
    const l = this._motionPathTracks.get(e);
    if (l && typeof r == "number") {
      const h = wi(l.motionPathConfig, r);
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
        for (const s of G(e)) {
          const n = `${s}\0${e.property}`;
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
    if (this._tracks.push(t), this._sharedWrites = null, Z(t)) {
      this._trackPlayers.set(t.id, new Vs(t));
      return;
    }
    if (Q(t)) {
      this._trackPlayers.set(t.id, new Ys(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (fe(t))
      this._trackPlayers.set(t.id, new zt(t)), this._textTracks.set(t.id, t);
    else if (ai(t)) {
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
      this._trackPlayers.set(t.id, new zt(e)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new zt(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, e) {
    const s = this._tracks.findIndex((r) => r.id === t);
    if (s < 0) return;
    const n = this._tracks.slice(s + 1);
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
    const e = this.getTracks(t).map((s) => s.id);
    for (const s of e)
      this.removeTrack(s);
    return e;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const e = this._trackPlayers.get(t);
    if (!e) return;
    const s = e.getTrack(), n = s.delay ?? 0;
    if (Q(s) || Z(s))
      return { from: n, to: e.getDuration() };
    const r = s.keyframes;
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
      const s = this._tracks[e], n = this.getTrackSpan(s.id);
      if (n)
        for (let r = 0; r < e; r++) {
          const o = this._tracks[r];
          if (o.property !== s.property) continue;
          const a = G(o).filter((f) => G(s).includes(f));
          if (a.length === 0) continue;
          const c = this.getTrackSpan(o.id);
          if (!c || !(c.from <= n.to && n.from <= c.to)) continue;
          const h = n.from >= c.from;
          for (const f of a)
            t.push({
              target: f,
              property: s.property,
              losingTrackId: h ? o.id : s.id,
              winningTrackId: h ? s.id : o.id
            });
        }
    }
    return t;
  }
  _matches(t, e) {
    if (e.id !== void 0 && t.id !== e.id || e.property !== void 0 && t.property !== e.property || e.target !== void 0 && !G(t).includes(e.target)) return !1;
    if (e.timeRange) {
      const s = this.getTrackSpan(t.id);
      if (!s || s.to < e.timeRange.from || s.from > e.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      formatVersion: _t,
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
    return [...this._config.markers ?? []].sort((t, e) => t.time - e.time);
  }
  /** Replace the markers (kept in time order); an empty list removes them. */
  setMarkers(t) {
    const e = t && t.length > 0 ? [...t].sort((n, r) => n.time - r.time).map((n) => ({ ...n })) : void 0, s = { ...this._config };
    e ? s.markers = e : delete s.markers, this._config = s;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(t) {
    const e = {};
    for (const [s, n] of Object.entries(t ?? {})) e[s] = { ...n };
    this._captions = Object.keys(e).length > 0 ? e : void 0;
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
const Hs = 100;
function xi(i, t, e, s) {
  const n = [], r = [], { duration: o, alternate: a } = s, c = (d, m, p, g) => {
    r.push([d, m]);
    const y = [];
    i.forEach((b, v) => {
      (p === "forward" ? (g ? b >= d : b > d) && b <= m : (g ? b <= d : b < d) && b >= m) && y.push(v);
    }), y.sort((b, v) => (p === "forward" ? i[b] - i[v] : i[v] - i[b]) || b - v);
    for (const b of y) n.push({ kind: "event", index: b, direction: p });
  };
  let l = t.time, h = t.direction, f = t.fresh === !0;
  const u = Math.min(Hs, Math.max(0, e.iteration - t.iteration));
  for (let d = 0; d < u; d++) {
    const m = h === "forward" ? o : 0;
    c(l, m, h, f), n.push({ kind: "repeat" }), a ? (h = h === "forward" ? "reverse" : "forward", l = m, f = !1) : (l = h === "forward" ? 0 : o, f = !0);
  }
  return u > 0 && s.holding && !a ? { crossings: n, passes: r } : (c(l, e.time, h, f), { crossings: n, passes: r });
}
function Gs(i) {
  return Z(i) ? {
    id: i.id,
    target: i.target,
    property: i.property,
    kind: "inertia",
    inertia: ki(i.inertia),
    ...X(i)
  } : Q(i) ? {
    id: i.id,
    target: i.target,
    property: i.property,
    kind: "spring",
    spring: { ...i.spring },
    ...X(i)
  } : fe(i) ? {
    id: i.id,
    target: i.target,
    property: "text",
    textConfig: { ...i.textConfig },
    keyframes: i.keyframes.map(Gt),
    ...X(i)
  } : ai(i) ? {
    id: i.id,
    target: i.target,
    property: "motionPath",
    motionPathConfig: { ...i.motionPathConfig },
    keyframes: i.keyframes.map(Gt),
    ...X(i)
  } : {
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: i.keyframes.map(Gt),
    ...X(i)
  };
}
function ki(i) {
  return { ...i, ...Array.isArray(i.end) && { end: [...i.end] } };
}
function Gt(i) {
  return {
    time: i.time,
    value: i.value,
    ...i.easing && { easing: i.easing }
  };
}
function X(i) {
  const t = i.endDelay;
  return {
    ...i.delay !== void 0 && { delay: i.delay },
    ...t !== void 0 && { endDelay: t },
    ...i.targets !== void 0 && { targets: [...i.targets] },
    ...i.stagger !== void 0 && { stagger: { ...i.stagger } }
  };
}
function Ks(i) {
  if (Z(i)) {
    const t = i;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: ki(t.inertia),
      ...X(t)
    };
  }
  if (Q(i)) {
    const t = i;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...X(t)
    };
  }
  if (fe(i)) {
    const t = i;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((e, s) => e.time - s.time),
      ...X(t)
    };
  }
  if (i.property === "motionPath" && "motionPathConfig" in i) {
    const t = i, e = [...t.keyframes].sort((s, n) => s.time - n.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: e,
      ...X(t)
    };
  }
  return oe({
    id: i.id,
    target: i.target,
    property: i.property,
    keyframes: i.keyframes,
    ...X(i)
  });
}
function Zs(i) {
  const t = i._config.markers;
  return {
    formatVersion: _t,
    id: i.id,
    name: i.name,
    config: {
      duration: i.duration > 0 ? i.duration : void 0,
      loop: i._config.loop,
      speed: i._config.speed,
      alternate: i._config.alternate,
      repeatDelay: i._config.repeatDelay,
      ...t && { markers: t.map((e) => ({ ...e })) }
    },
    tracks: i.tracks.map(Gs),
    ...i.captions && { captions: JSON.parse(JSON.stringify(i.captions)) }
  };
}
function mt(i) {
  const t = i.formatVersion ?? 1;
  if (t > _t)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${_t}. Update tinyfly to play it.`
    );
  return new Ti({
    id: i.id,
    name: i.name,
    config: i.config,
    tracks: i.tracks.map(Ks),
    captions: i.captions
  });
}
function xo(i) {
  return JSON.stringify(Zs(i));
}
function ko(i) {
  const t = JSON.parse(i);
  return mt(t);
}
function So(i) {
  let t = 2166136261;
  for (let e = 0; e < i.length; e++)
    t ^= i.charCodeAt(e), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Qs(i) {
  let t = i >>> 0 || 2654435769;
  return {
    seed: i >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Si(i, t, e) {
  return t + i.next() * (e - t);
}
function Js(i, t, e, s) {
  if (s <= 0) return Si(i, t, e);
  const n = Math.floor((e - t) / s), r = Math.round(i.next() * n);
  return t + r * s;
}
function Mo(i, t) {
  if (t.length !== 0)
    return t[Math.floor(i.next() * t.length)];
}
const Mi = /^([+\-*/])=\s*(-?[\d.]+)$/, Ai = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function Ao(i) {
  return typeof i != "string" ? !1 : Mi.test(i.trim()) || Ai.test(i.trim());
}
function Pi(i, t = {}) {
  if (typeof i != "string") return i;
  const e = i.trim(), s = Mi.exec(e);
  if (s) {
    const [, r, o] = s, a = t.base ?? 0, c = Number.parseFloat(o);
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
  const n = Ai.exec(e);
  if (n) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${e}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(n[1]), o = Number.parseFloat(n[2]), a = n[3] !== void 0 ? Number.parseFloat(n[3]) : void 0;
    return a !== void 0 ? Js(t.random, r, o, a) : Si(t.random, r, o);
  }
  return i;
}
function tn(i, t = 0, e) {
  const s = [];
  let n = t;
  for (const r of i) {
    const o = Pi(r, { base: n, random: e });
    s.push(o), typeof o == "number" && (n = o);
  }
  return s;
}
class Po {
  random;
  constructor(t) {
    this.random = Qs(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, e = 0) {
    return Pi(t, { base: e, random: this.random });
  }
  resolveSequence(t, e = 0) {
    return tn(t, e, this.random);
  }
}
const en = 600;
function sn(i) {
  if (Array.isArray(i)) {
    const [u, d, m, p] = i;
    return { fn: Le(u, d, m, p), bezier: [u, d, m, p] };
  }
  const { segments: t } = nt(i);
  if (t.length === 0) throw new Error(`customEase: no curve in "${i}"`);
  const e = t[0].startX, s = t[0].startY, n = t[t.length - 1], r = n.endX - e, o = n.endY - s;
  if (r === 0 || o === 0) throw new Error(`customEase: "${i}" must move along both axes`);
  const a = (u) => (u - e) / r, c = (u) => (u - s) / o;
  if (t.length === 1 && n.type === "C") {
    const [u, d, m, p] = n.points, g = [a(u), c(d), a(m), c(p)];
    return { fn: Le(...g), bezier: g };
  }
  const l = [], h = [], f = Math.max(8, Math.ceil(en / t.length));
  for (const u of t)
    for (let d = l.length === 0 ? 0 : 1; d <= f; d++) {
      const [m, p] = on(u, d / f);
      l.push(a(m)), h.push(c(p));
    }
  return { fn: an(l, h) };
}
function nn(i = {}) {
  const e = 0.1 + Math.max(0, Math.min(1, i.strength ?? 0.7)) * 0.7, s = [1];
  for (let r = e; r > 2e-3; r *= e) s.push(2 * Math.sqrt(r));
  const n = s.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * n;
    for (let a = 0; a < s.length; a++) {
      if (o <= s[a]) {
        if (a === 0) return (o / s[0]) ** 2;
        const c = s[a] / 2, l = c * c, h = o - c;
        return 1 - (l - h * h);
      }
      o -= s[a];
    }
    return 1;
  };
}
function rn(i = {}) {
  const t = Math.max(1, i.wiggles ?? 10), e = i.type ?? "easeOut", s = (n) => e === "uniform" ? 1 : e === "easeInOut" ? Math.sin(Math.PI * n) : (1 - n) ** 2;
  return (n) => n <= 0 || n >= 1 ? 0 : Math.sin(n * t * Math.PI * 2) * s(n);
}
function on(i, t) {
  if (i.type === "L") {
    const [l, h] = i.points;
    return [i.startX + (l - i.startX) * t, i.startY + (h - i.startY) * t];
  }
  const [e, s, n, r, o, a] = i.points, c = 1 - t;
  return [
    c * c * c * i.startX + 3 * c * c * t * e + 3 * c * t * t * n + t * t * t * o,
    c * c * c * i.startY + 3 * c * c * t * s + 3 * c * t * t * r + t * t * t * a
  ];
}
function an(i, t) {
  return (e) => {
    if (e <= i[0]) return t[0];
    if (e >= i[i.length - 1]) return t[t.length - 1];
    let s = 0, n = i.length - 1;
    for (; n - s > 1; ) {
      const o = s + n >> 1;
      i[o] <= e ? s = o : n = o;
    }
    const r = i[n] - i[s];
    return r === 0 ? t[n] : t[s] + (e - i[s]) / r * (t[n] - t[s]);
  };
}
function Le(i, t, e, s) {
  const n = (o, a, c) => 3 * (1 - o) * (1 - o) * o * a + 3 * (1 - o) * o * o * c + o * o * o, r = (o, a, c) => 3 * (1 - o) * (1 - o) * a + 6 * (1 - o) * o * (c - a) + 3 * o * o * (1 - c);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let a = o;
    for (let h = 0; h < 8; h++) {
      const f = n(a, i, e) - o, u = r(a, i, e);
      if (Math.abs(f) < 1e-6) return n(a, t, s);
      if (Math.abs(u) < 1e-6) break;
      a -= f / u;
    }
    let c = 0, l = 1;
    a = o;
    for (let h = 0; h < 40; h++)
      n(a, i, e) < o ? c = a : l = a, a = (c + l) / 2;
    return n(a, t, s);
  };
}
const q = (i) => Math.round(i * 1e3) / 1e3;
function cn(i, t = {}) {
  if (i.length === 0) return "";
  const e = t.curviness ?? 1, s = t.closed ?? !1, n = i.length;
  let r = `M${q(i[0].x)} ${q(i[0].y)}`;
  if (n === 1) return r;
  const o = (c) => s ? i[(c % n + n) % n] : i[Math.max(0, Math.min(n - 1, c))], a = s ? n : n - 1;
  for (let c = 0; c < a; c++) {
    const l = o(c - 1), h = o(c), f = o(c + 1), u = o(c + 2);
    if (e === 0) {
      r += ` L${q(f.x)} ${q(f.y)}`;
      continue;
    }
    const d = e / 6, m = h.x + (f.x - l.x) * d, p = h.y + (f.y - l.y) * d, g = f.x - (u.x - h.x) * d, y = f.y - (u.y - h.y) * d;
    r += ` C${q(m)} ${q(p)} ${q(g)} ${q(y)} ${q(f.x)} ${q(f.y)}`;
  }
  return s ? `${r} Z` : r;
}
const F = (i, t = 0) => {
  const e = parseFloat(i ?? "");
  return Number.isFinite(e) ? e : t;
};
function ln(i) {
  const t = (i ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), e = [];
  for (let s = 0; s + 1 < t.length; s += 2) e.push({ x: t[s], y: t[s + 1] });
  return e;
}
function pe(i) {
  const t = i.attributes;
  switch (i.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const e = F(t.cx), s = F(t.cy), n = i.tag.toLowerCase() === "circle" ? F(t.r) : F(t.rx), r = i.tag.toLowerCase() === "circle" ? F(t.r) : F(t.ry);
      return `M${e + n} ${s} A${n} ${r} 0 1 1 ${e - n} ${s} A${n} ${r} 0 1 1 ${e + n} ${s} Z`;
    }
    case "rect": {
      const e = F(t.x), s = F(t.y), n = F(t.width), r = F(t.height);
      let o = t.rx != null ? F(t.rx) : t.ry != null ? F(t.ry) : 0, a = t.ry != null ? F(t.ry) : o;
      return o = Math.min(o, n / 2), a = Math.min(a, r / 2), o === 0 || a === 0 ? `M${e} ${s} H${e + n} V${s + r} H${e} Z` : `M${e + o} ${s} H${e + n - o} A${o} ${a} 0 0 1 ${e + n} ${s + a} V${s + r - a} A${o} ${a} 0 0 1 ${e + n - o} ${s + r} H${e + o} A${o} ${a} 0 0 1 ${e} ${s + r - a} V${s + a} A${o} ${a} 0 0 1 ${e + o} ${s} Z`;
    }
    case "line":
      return `M${F(t.x1)} ${F(t.y1)} L${F(t.x2)} ${F(t.y2)}`;
    case "polyline":
    case "polygon": {
      const e = ln(t.points);
      if (e.length === 0) return null;
      const s = e.map((n, r) => `${r === 0 ? "M" : "L"}${n.x} ${n.y}`).join(" ");
      return i.tag.toLowerCase() === "polygon" ? `${s} Z` : s;
    }
    default:
      return null;
  }
}
const kt = {
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
}, De = {
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
function hn(i) {
  let t = i.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const e = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return e && e[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${e[1]}.out${e[2] ?? ""}`), t;
}
W({ type: "bounce", mode: "in" });
W({ type: "bounce", mode: "in-out" });
function It(i) {
  const t = Ei.get(i.trim().toLowerCase());
  if (t) return t;
  const e = hn(i), s = /^steps\(\s*(\d+)\s*\)$/.exec(e);
  if (s) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(s[1], 10)) + 1, position: "none" };
    return { easing: o, fn: W(o) };
  }
  const n = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(e);
  if (n) {
    const [, r, o, a] = n, c = (a ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), l = o === "inout" ? "in-out" : o;
    if (r === "back" && c.length === 0 && e in kt)
      return { easing: { type: "cubic-bezier", points: kt[e] } };
    const h = r === "elastic" ? { type: "elastic", mode: l, ...c[0] !== void 0 && { amplitude: c[0] }, ...c[1] !== void 0 && { period: c[1] } } : r === "bounce" ? { type: "bounce", mode: l } : { type: "back", mode: l, ...c[0] !== void 0 && { overshoot: c[0] } };
    return { easing: h, fn: W(h) };
  }
  return e in De ? { easing: De[e] } : e in kt ? { easing: { type: "cubic-bezier", points: kt[e] } } : { easing: "ease-out" };
}
const Ei = /* @__PURE__ */ new Map();
function me(i, t) {
  return Ei.set(
    i.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), i;
}
function ae(i) {
  let t = i >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let e = t;
    return e = Math.imul(e ^ e >>> 15, e | 1), e ^= e + Math.imul(e ^ e >>> 7, e | 61), ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
const _i = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function Ci(i) {
  return typeof i == "string" && _i.test(i);
}
function un(i = 1) {
  let t = ae(i);
  const e = (c, l) => ((...h) => h.length >= c ? l(...h) : (f) => l(...h, f)), s = (c, l, h) => Math.min(Math.max(h, Math.min(c, l)), Math.max(c, l)), n = (c, l, h, f, u) => l === c ? h : h + (u - c) / (l - c) * (f - h), r = (c, l) => {
    if (typeof c == "number") return c === 0 ? l : Math.round(l / c) * c;
    if (Array.isArray(c)) return Oe(c, l, 1 / 0);
    if ("values" in c) return Oe(c.values, l, c.radius ?? 1 / 0);
    const h = Math.round(l / c.increment) * c.increment;
    return Math.abs(h - l) <= (c.radius ?? 1 / 0) ? h : l;
  }, o = (c, l, h) => {
    const f = c + t() * (l - c);
    return h ? Math.round(f / h) * h : f;
  };
  return {
    clamp: e(3, s),
    mapRange: e(5, n),
    normalize: e(3, (c, l, h) => n(c, l, 0, 1, h)),
    interpolate: e(3, (c, l, h) => {
      if (typeof c == "object" && !Array.isArray(c)) {
        const f = {};
        for (const u of Object.keys(c))
          f[u] = Rt(c[u])(c[u], l[u], h);
        return f;
      }
      return Rt(c)(c, l, h);
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
      const g = p.length, b = de(d, g, { ...l !== void 0 ? { amount: l } : { each: h ?? 1 }, from: f }), v = l !== void 0 ? l : (h ?? 1) * li(g, f), T = u && v > 0 ? u(b / v) * v : b;
      return c + T;
    },
    pipe: (...c) => (l) => c.reduce((h, f) => f(h), l),
    splitColor: (c) => fn(c),
    getUnit: (c) => typeof c == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(c.trim())?.[1] ?? "",
    seed: (c) => {
      t = ae(c);
    },
    resolveRandomString: (c) => {
      const l = _i.exec(c)?.[1] ?? "";
      if (l.startsWith("[")) {
        const m = l.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [h, f, u] = l.split(",").map((d) => Number.parseFloat(d));
      return o(h, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function Oe(i, t, e) {
  let s = t, n = 1 / 0;
  for (const r of i) {
    const o = Math.abs(r - t);
    o < n && (n = o, s = r);
  }
  return n <= e ? s : t;
}
function fn(i) {
  const t = i.trim(), e = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (e) {
    const r = (e.length <= 4 ? [...e].map((o) => o + o).join("") : e).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const s = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((n) => Number.parseFloat(n));
  return s.length >= 4 ? [s[0], s[1], s[2], s[3]] : [s[0] ?? 0, s[1] ?? 0, s[2] ?? 0];
}
const dn = /^([+-])=\s*(-?[\d.]+)$/, pn = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function ht(i, t) {
  const e = t.scale ?? 1, s = (l) => Number.parseFloat(l) * e;
  if (i === void 0) return t.cursor;
  if (typeof i == "number") return i * e;
  const n = i.trim();
  if (n === "") return t.cursor;
  const r = dn.exec(n);
  if (r) {
    const l = s(r[2]);
    return t.cursor + (r[1] === "-" ? -l : l);
  }
  const o = pn.exec(n);
  if (o) {
    const l = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return l;
    const h = s(o[3]);
    return l + (o[2] === "-" ? -h : h);
  }
  const a = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(n);
  if (a) {
    const l = t.labels.get(a[1].trim());
    if (l !== void 0) {
      const h = s(a[3]);
      return l + (a[2] === "-" ? -h : h);
    }
  }
  const c = t.labels.get(n);
  return c !== void 0 ? c : /^-?[\d.]+$/.test(n) ? s(n) : t.cursor;
}
function mn(i) {
  if (typeof i != "object" || i === null) return !1;
  const t = i;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function gn(i, t, e = {}) {
  if (i === 0) return [];
  const s = t.grid === "auto" ? Math.max(1, Math.min(i, e.columnsFromLayout?.() ?? i)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : i, n = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(i / s), r = (m) => ({ x: m % s, y: Math.floor(m / s) }), o = t.from ?? "start", a = Array.isArray(o) ? { x: o[0] * (s - 1), y: o[1] * (n - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(i - 1, o))) : o === "end" ? r(i - 1) : o === "center" || o === "edges" ? { x: (s - 1) / 2, y: (n - 1) / 2 } : { x: 0, y: 0 }, c = (m) => {
    const { x: p, y: g } = r(m), y = Math.abs(p - a.x), b = Math.abs(g - a.y);
    return t.axis === "x" ? y : t.axis === "y" ? b : Math.hypot(y, b);
  };
  let l = Array.from({ length: i }, (m, p) => c(p));
  const h = Math.max(...l);
  if (o === "edges" && (l = l.map((m) => h - m)), o === "random") {
    const m = e.random ?? Math.random;
    l = l.map(() => m() * h);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * h, u = t.ease ? It(t.ease) : void 0, d = u ? u.fn ?? W(u.easing) : void 0;
  return l.map((m) => {
    const p = h === 0 ? 0 : m / h;
    return (d ? d(p) : p) * f;
  });
}
const ge = /* @__PURE__ */ new Set([
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
function Pt(i) {
  const t = {}, e = {};
  for (const [s, n] of Object.entries(i))
    ge.has(s) ? t[s] = n : e[s] = n;
  return { config: t, properties: e };
}
function $t(i, t) {
  return i === void 0 ? t : i * 1e3;
}
function ce(i, t) {
  if (i !== void 0)
    return typeof i == "number" ? { each: i * 1e3 } : mn(i) ? { offsets: gn(t?.count ?? 0, i, t ?? {}).map((s) => s * 1e3) } : {
      ...i.each !== void 0 && { each: i.each * 1e3 },
      ...i.amount !== void 0 && { amount: i.amount * 1e3 },
      ...i.from !== void 0 && { from: i.from }
    };
}
const yn = {
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
function Ri(i) {
  return yn[i];
}
function bn(i) {
  const t = typeof i == "string" || Array.isArray(i) ? { path: i } : i;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let e;
  if (Array.isArray(t.path))
    e = cn(t.path, { curviness: t.curviness });
  else if (vt(t.path))
    e = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const s = { pathData: e };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (s.autoRotate = !0, typeof t.autoRotate == "number" && (s.rotateOffset = t.autoRotate)), t.matrix && (s.matrix = t.matrix), { config: s, start: t.start ?? 0, end: t.end ?? 1 };
}
function vn(i) {
  const t = typeof i == "string" || Array.isArray(i) ? { path: i } : { ...i };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function Ii(i) {
  return typeof i == "object" && i !== null && "shape" in i ? i.shape : i;
}
function wn(i) {
  if (i.morphSVG === void 0) return i;
  const { morphSVG: t, ...e } = i, s = Ii(t);
  if (typeof s != "string" || !vt(s))
    throw new Error(
      `gsap-compat: morphSVG "${String(s)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...e, d: s };
}
function Tn(i, t) {
  if (i === !0) return [0, t];
  if (i === !1) return [0, 0];
  if (typeof i == "number") return [0, Be(i, t)];
  const e = i.trim().split(/[\s,]+/).filter(Boolean), s = (o) => {
    const a = Number.parseFloat(o);
    if (Number.isNaN(a)) throw new Error(`gsap-compat: drawSVG "${i}" is not a length or percentage`);
    return Be(o.endsWith("%") ? t * a / 100 : a, t);
  };
  if (e.length === 0) return [0, t];
  if (e.length === 1) return [0, s(e[0])];
  const n = s(e[0]), r = s(e[1]);
  return n <= r ? [n, r] : [r, n];
}
function xn(i, t) {
  const [e, s] = Tn(i, t);
  return { strokeDasharray: [s - e, t], strokeDashoffset: -e };
}
function kn(i, t) {
  if (i.drawSVG === void 0) return i;
  const { drawSVG: e, ...s } = i;
  return { ...s, ...xn(e, t) };
}
function Sn(i) {
  if (i.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return i;
}
function Be(i, t) {
  return Math.max(0, Math.min(t, i));
}
function Mn(i) {
  let t = 2166136261;
  for (let e = 0; e < i.length; e++) t = Math.imul(t ^ i.charCodeAt(e), 16777619);
  return t >>> 0;
}
function An(i, t, e) {
  if (i.scrambleText !== void 0) {
    const s = i.scrambleText, n = typeof s == "string" ? { text: s } : s;
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
      seed: n.seed ?? Mn(`${t}|${n.text}`)
    };
  }
  if (i.text !== void 0) {
    const s = i.text, n = typeof s == "string" ? { value: s } : s;
    if (typeof n?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: n.value,
      mode: "type",
      ...n.rightToLeft !== void 0 && { rightToLeft: n.rightToLeft }
    };
  }
}
function ye(i) {
  return Math.max(0.1, i / 25);
}
function Pn(i, t) {
  const e = typeof t == "number" ? { velocity: t } : t;
  if (typeof e?.velocity != "number" || !Number.isFinite(e.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const s = e.friction ?? (e.resistance !== void 0 ? ye(e.resistance) : void 0), n = {
    from: i,
    velocity: e.velocity,
    ...s !== void 0 && { friction: s },
    ...e.min !== void 0 && { min: e.min },
    ...e.max !== void 0 && { max: e.max }
  };
  return typeof e.end == "function" ? n.end = [e.end(Ct(n))] : e.end !== void 0 && (n.end = Array.isArray(e.end) ? [...e.end] : e.end), n;
}
function En(i) {
  const t = i === !0 ? {} : typeof i == "string" ? { preset: i } : i;
  if (t.preset !== void 0 && !(t.preset in Yt))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(Yt).join(", ")}`
    );
  return {
    ...t.preset ? Yt[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function _n(i, t) {
  if (i === !0 || typeof i == "string") return;
  const e = i.velocity;
  return typeof e == "number" ? e : e?.[t];
}
class st {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = ae(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new Ti({
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
  to(t, e, s) {
    return this.build(t, void 0, ut(e), s);
  }
  /** Animate from the given values to where the property already is. */
  from(t, e, s) {
    const { config: n, properties: r } = Pt(ut(e)), { motionPath: o, text: a, scrambleText: c, ...l } = r, h = this.targetsOf(t)[0], f = { ...n };
    for (const m of Object.keys(l))
      f[m] = this.resolveStart(h, m);
    o !== void 0 && (f.motionPath = vn(o));
    const u = {}, d = String(this.resolveStart(h, "text"));
    return a !== void 0 && (u.text = Kt(a), f.text = typeof a == "object" ? { ...a, value: d } : d), c !== void 0 && (u.text = Kt(c), f.scrambleText = typeof c == "object" ? { ...c, text: d } : d), this.build(t, { ...l, ...u }, f, s);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, e, s, n) {
    const { properties: r } = Pt(ut(e));
    return this.build(t, r, ut(s), n);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, e, s) {
    return this.build(t, void 0, { ...ut(e), duration: 0 }, s);
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
    const e = Math.max(0, ht(t, this.context()));
    return this.previousStart = e, this.previousEnd = e, this.cursor = Math.max(this.cursor, e), e;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return ht(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, e) {
    return this.labels.set(t, ht(e, this.context())), this;
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
    const s = ht(e, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = oe({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((a) => ({ ...a, time: a.time + s }))
      });
      this.timeline.addTrack(o);
    }
    const n = s + t.timeline.duration;
    return this.previousStart = s, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), this;
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
  build(t, e, s, n) {
    const { config: r, properties: o } = Pt(s), { motionPath: a, text: c, scrambleText: l, inertia: h, ...f } = o, u = this.targetsOf(t), d = ht(n, this.context()), m = $t(r.delay, 0), p = $t(r.duration, 500), g = ce(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), b = [], v = r.spring;
    let T = 0, w = !1;
    for (const [M, E] of Object.entries(f)) {
      const k = E;
      let P = e?.[M] !== void 0 ? e[M] : this.resolveStart(u[0], M);
      if (typeof P != typeof k && (this.warn(
        `no usable start value for "${M}" on "${u[0]}" — it will snap to ${String(k)}. Use fromTo() to animate it.`
      ), P = k), v !== void 0 && typeof P == "number" && typeof k == "number") {
        const R = {
          ...En(v),
          from: P,
          to: k,
          velocity: _n(v, M) ?? this.options.startVelocity?.(u[0], M) ?? 0
        }, j = this.nextTrackId(`${u[0]}-${M}-spring`), H = {
          id: j,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: M,
          kind: "spring",
          spring: R,
          delay: d + m
        };
        this.timeline.addTrack(H), b.push(j), T = Math.max(T, Ki(R));
        for (const I of u) this.lastValues.set(`${I}|${M}`, k);
        continue;
      }
      w = !0;
      const C = this.keyframesFor(P, k, p, y, r.ease), $ = this.nextTrackId(`${u[0]}-${M}`);
      this.timeline.addTrack(
        oe({
          id: $,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: M,
          delay: d + m,
          keyframes: C
        })
      ), b.push($);
      for (const R of u) this.lastValues.set(`${R}|${M}`, k);
    }
    const x = An({ text: c, scrambleText: l }, u[0], p);
    if (x) {
      const M = e?.text ?? e?.scrambleText, E = M !== void 0 ? Kt(M) : this.resolveStart(u[0], "text"), k = this.nextTrackId(`${u[0]}-text`), P = {
        id: k,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof E == "string" ? E : String(E ?? ""), ...x },
        delay: d + m,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(P), b.push(k);
      for (const C of u) this.lastValues.set(`${C}|text`, x.to);
    }
    if (a !== void 0) {
      const { config: M, start: E, end: k } = bn(a), P = this.nextTrackId(`${u[0]}-motionPath`), C = {
        id: P,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: M,
        delay: d + m,
        keyframes: this.keyframesFor(E, k, p, y, r.ease)
      };
      this.timeline.addTrack(C), b.push(P);
    }
    if (h !== void 0)
      for (const [M, E] of Object.entries(h)) {
        const k = this.resolveStart(u[0], M);
        if (typeof k != "number") {
          this.warn(`inertia on "${M}" needs a numeric start value; skipped`);
          continue;
        }
        const P = Pn(k, E), C = this.nextTrackId(`${u[0]}-${M}-inertia`), $ = {
          id: C,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: M,
          kind: "inertia",
          inertia: P,
          delay: d + m
        };
        this.timeline.addTrack($), b.push(C), T = Math.max(T, bt(P));
        for (const R of u) this.lastValues.set(`${R}|${M}`, yt(P));
      }
    const L = ((h !== void 0 || v !== void 0) && !w && !x && a === void 0 ? T : Math.max(p, T)) + (g && u.length > 1 ? Dt(u.length, g) : 0), A = d + m + L;
    return this.previousStart = d + m, this.previousEnd = A, this.cursor = Math.max(this.cursor, A), {
      trackIds: b,
      start: d + m,
      end: A,
      kill: () => {
        for (const M of b) this.timeline.removeTrack(M);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, e, s, n, r) {
    const o = { time: 0, value: t };
    if (s <= 0)
      return [{ time: 0, value: e }];
    const a = typeof r == "string" ? It(r) : void 0;
    if (a?.requiresBaking === "custom" || this.options.bakeEases && Et(n)) {
      const l = a?.fn ?? W(n);
      return [o, ...vi(o, { time: s, value: e }, l, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [o, { time: s, value: e, ...n && { easing: n } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, e) {
    const s = this.lastValues.get(`${t}|${e}`);
    if (s !== void 0) return s;
    const n = this.options.startValue?.(t, e);
    if (n !== void 0) return n;
    const r = this.options.defaults?.[e];
    if (r !== void 0) return r;
    if (e === "text") return "";
    if (e === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = Ri(e);
    return o !== void 0 ? (this.warn(
      `no start value for "${e}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${e}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return It(t).easing;
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
function Kt(i) {
  if (typeof i == "string") return i;
  if (i && typeof i == "object") {
    const t = i;
    return String(t.value ?? t.text ?? "");
  }
  return String(i ?? "");
}
function Cn(i) {
  return new st(i);
}
function ut(i) {
  return Sn(wn(i));
}
const Rn = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), In = "#ffffff", $n = "rgba(0, 0, 0, 0.5)";
function Fn(i) {
  const t = [];
  if (i.blur !== void 0 && t.push(`blur(${Math.max(0, i.blur)}px)`), i.brightness !== void 0 && t.push(`brightness(${Math.max(0, i.brightness)})`), i.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, i.glow)}px ${i.glowColor ?? In})`), i.shadowX !== void 0 || i.shadowY !== void 0 || i.shadowBlur !== void 0) {
    const e = i.shadowX ?? 0, s = i.shadowY ?? 0, n = Math.max(0, i.shadowBlur ?? 0);
    t.push(`drop-shadow(${e}px ${s}px ${n}px ${i.shadowColor ?? $n})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function Ln(i, t) {
  const e = i.childNodes.length === 1 ? i.firstChild : null;
  if (e && e.nodeType === 3) {
    const s = e;
    s.data !== t && (s.data = t);
    return;
  }
  i.textContent !== t && (i.textContent = t);
}
function Dn(i) {
  if (!("ownerSVGElement" in i)) return;
  const t = i.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const Ne = /* @__PURE__ */ new Set([
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
]), On = /* @__PURE__ */ new Set([
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
]), Bn = /* @__PURE__ */ new Set(["originX", "originY"]), Nn = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), qn = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, qe = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Xn = "http://www.w3.org/2000/svg";
class K {
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
    for (const [e, s] of t.values) {
      const n = this.targets.get(e);
      n && this.applyProperties(n, s);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, e) {
    const s = [];
    let n = null, r = null, o = null;
    const a = e.has("motionPathX"), c = e.has("motionPathY"), l = e.has("motionPathRotate");
    for (const [u, d] of e)
      if (!(u === "x" && a) && !(u === "y" && c) && !((u === "rotate" || u === "rotateZ") && l)) {
        if (On.has(u)) {
          const m = this.buildTransformPart(u, d);
          m && s.push(m);
        } else if (Bn.has(u))
          typeof d == "number" && ((n ??= {})[u] = d);
        else if (Nn.has(u))
          typeof d == "number" && ((r ??= {})[u] = d);
        else if (Rn.has(u))
          (o ??= {})[u] = d;
        else if (u !== "perspective") {
          if (u !== "shine") if (u === "text" && typeof d == "string")
            Ln(t, d);
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
    if (typeof f == "number" && s.unshift(`perspective(${f}px)`), s.length > 0 && (t.style.transform = s.join(" "), Dn(t)), n) {
      const u = n.originX ?? 50, d = n.originY ?? 50;
      t.style.transformOrigin = `${u}% ${d}%`;
    }
    if (r) {
      const u = r.clipTop ?? 0, d = r.clipRight ?? 0, m = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${u}% ${d}% ${m}% ${p}%)`;
    }
    if (o) {
      const u = Fn(o);
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
    const s = t.dataset.shineBase, n = -20 + e * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${s}, ${s})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${n}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, e, s) {
    let n;
    if (t.namespaceURI === Xn && e in qe) {
      const a = Array.isArray(s) ? s.join(", ") : String(s);
      t.style[qe[e]] = a;
      return;
    } else e === "fill" && t.dataset?.elementType === "text" ? n = "color" : n = qn[e] ?? e;
    let o;
    typeof s == "number" ? Ne.has(e) || Ne.has(n) ? o = `${s}px` : o = String(s) : Array.isArray(s) ? o = s.join(", ") : o = s, t.style[n] = o;
  }
}
const Yn = {
  request: (i) => requestAnimationFrame(i),
  cancel: (i) => cancelAnimationFrame(i)
};
class Vn {
  adapter = new K();
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
  utils = un();
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
    this.scheduler = t.scheduler ?? Yn, this.rootOption = t.root;
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
    for (const s of this.targetsOf(t)) {
      const n = this.nameFor(s);
      Zt(s) && this.currentCollector?.touch(s, n), e.push(n);
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
    this.destroyed || (t.onUpdate = (s) => this.write(s), this.active.delete(t), this.active.set(t, e), this.startLoop());
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
    const s = new Map(Object.entries(e));
    this.write({ values: /* @__PURE__ */ new Map([[t, s]]), currentTime: 0, playbackState: "idle", direction: "forward", loopIteration: 0 }), this.flush();
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
    for (const [s] of e)
      s.duration <= 0 ? (this.write(s.getStateAtTime(0)), s.stop()) : s.tick(t);
    this.flush();
    for (const [s, n] of e)
      n.onUpdate?.(), s.playbackState !== "playing" && this.active.get(s) === n && this.active.delete(s);
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
    for (const [e, s] of t.values) {
      let n = this.applied.get(e);
      n || (n = /* @__PURE__ */ new Map(), this.applied.set(e, n));
      for (const [r, o] of s) n.set(r, o);
      this.dirty.add(e);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const e of this.dirty) {
      const s = this.applied.get(e), n = this.objects.get(e);
      if (n)
        for (const [r, o] of s) n[r] = o;
      else
        t.set(e, s);
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
    if (Zt(t)) return [t];
    if (!Wn(t)) return [t];
    const e = [];
    for (const s of Array.from(t))
      e.push(...this.targetsOf(s));
    return e;
  }
  nameFor(t) {
    return Zt(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const e = this.objectNames.get(t);
    if (e) return e;
    let s;
    do
      this.nameCounter += 1, s = `obj-${this.nameCounter}`;
    while (this.objects.has(s) || this.elements.has(s));
    return this.objectNames.set(t, s), this.objects.set(s, t), s;
  }
  elementName(t) {
    const e = this.names.get(t);
    if (e) return e;
    let s = t.id ? `#${t.id}` : "";
    if (!s || this.elements.has(s))
      do
        this.nameCounter += 1, s = `el-${this.nameCounter}`;
      while (this.elements.has(s));
    return this.names.set(t, s), this.elements.set(s, t), this.adapter.registerTarget(s, t), s;
  }
}
function Zt(i) {
  return typeof i == "object" && i !== null && i.nodeType === 1;
}
function Wn(i) {
  if (Array.isArray(i)) return !0;
  const t = i;
  return typeof t.length == "number" && typeof t.item == "function";
}
function Ft(i) {
  const t = i.style;
  if (!t) return i.getBoundingClientRect();
  const e = t.transform;
  t.transform = "none";
  const s = i.getBoundingClientRect();
  return t.transform = e, s;
}
const Xe = (i) => typeof i == "object" && i !== null && i.nodeType === 1;
function jn(i) {
  const t = {};
  for (const e of Array.from(i.attributes)) t[e.name] = e.value;
  return t;
}
function Un(i) {
  const t = i.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const e = i.getBoundingClientRect();
  return [1, 0, 0, 1, e.left, e.top];
}
function zn(i, t) {
  const e = typeof i == "string" || Array.isArray(i) || Xe(i) ? { path: i } : i, { align: s, alignOrigin: n, path: r, ...o } = e, a = (x) => {
    const S = Xe(x) ? x : t.query(x);
    return S || t.warn(`gsap-compat: motionPath could not find "${String(x)}"`), S;
  };
  let c = null, l = "";
  if (Array.isArray(r) || typeof r == "string" && vt(r))
    l = r;
  else {
    c = a(r);
    const x = c && pe({ tag: c.localName, attributes: jn(c) });
    c && !x && t.warn(`gsap-compat: motionPath element <${c.localName}> has no path geometry`), l = x ?? "";
  }
  const h = { ...o, path: l };
  if (s === void 0 || s === !1) return h;
  const f = s === !0 ? c : a(s);
  if (!f)
    return s === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = t.targets[0];
  if (!u) return h;
  const [d, m, p, g, y, b] = Un(f), v = Ft(u), [T, w] = n ?? [0.5, 0.5];
  for (const x of t.targets.slice(1)) {
    const S = Ft(x);
    if (Math.abs(S.left - v.left) > 0.5 || Math.abs(S.top - v.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, m, p, g, y - v.left - T * v.width, b - v.top - w * v.height], h;
}
const $i = (i) => typeof i == "object" && i !== null && i.nodeType === 1;
function Fi(i) {
  const t = {};
  for (const e of Array.from(i.attributes)) t[e.name] = e.value;
  return t;
}
function Li(i) {
  if (!i) return null;
  const t = pe({ tag: i.localName, attributes: Fi(i) });
  return t || (i.querySelector("path")?.getAttribute("d") ?? null);
}
function Hn(i, t, e) {
  const s = Ii(i);
  if (typeof s == "string" && vt(s)) return s;
  const n = $i(s) ? s : typeof s == "string" ? t(s) : null, r = Li(n);
  return r || (e(`gsap-compat: morphSVG could not find a shape for "${String(s)}"`), "");
}
const Gn = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Kn(i, t = document) {
  return (typeof i == "string" ? Array.from(t.querySelectorAll(i)) : $i(i) ? [i] : Array.from(i)).map((s) => {
    if (s.localName === "path") return s;
    const n = pe({ tag: s.localName, attributes: Fi(s) });
    if (!n || !s.parentNode) return s;
    const r = s.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(s.attributes))
      Gn.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", n), s.parentNode.replaceChild(r, s), r;
  });
}
const Ye = 0.3;
class Zn {
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
  begin(t, e, s) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = e, this.lastX = t, this.lastY = e, this.velocityX = 0, this.velocityY = 0, this.lastTime = Ve(), this.options.onPress?.(this.stateFrom(0, 0, s));
  }
  move(t, e, s) {
    if (!this.dragging) return;
    const n = t - this.lastX, r = e - this.lastY;
    this.lastX = t, this.lastY = e;
    const o = t - this.startX, a = e - this.startY, c = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, a) < c) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(n, r), this.options.preventDefault !== !1 && s.cancelable && s.preventDefault(), this.options.onMove?.(this.stateFrom(n, r, s));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, e) {
    const s = Ve(), n = Math.max(1, s - this.lastTime);
    this.lastTime = s;
    const r = t / n * 1e3, o = e / n * 1e3;
    this.velocityX += (r - this.velocityX) * Ye, this.velocityY += (o - this.velocityY) * Ye;
  }
  stateFrom(t, e, s) {
    return {
      deltaX: t,
      deltaY: e,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: this.lastX - this.startX,
      totalY: this.lastY - this.startY,
      isDragging: this.dragging,
      event: s
    };
  }
  // --- listeners ----------------------------------------------------------
  onPointerDown = (t) => {
    const e = t, s = this.target;
    if (typeof e.pointerId == "number" && typeof s.setPointerCapture == "function")
      try {
        s.setPointerCapture(e.pointerId);
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
function Ve() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function Qn(i, t, e) {
  let s = { delta: 0, line: null }, n = e;
  for (const r of i)
    for (const o of t) {
      const a = Math.abs(o - r);
      a <= n && (n = a, s = { delta: o - r, line: o });
    }
  return s;
}
function Jn(i, t) {
  return t <= 0 ? [] : i.map((e) => Math.round(e / t) * t);
}
class Di {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Zn({
      target: t.target,
      onPress: (e) => {
        const s = t.getPosition?.();
        s && (this.x = s.x, this.y = s.y), this.originX = this.x, this.originY = this.y, t.onPress?.(e);
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
    const s = this.options.axis ?? "both";
    this.x = s === "y" ? this.x : this.applyConstraints(t, "x"), this.y = s === "x" ? this.y : this.applyConstraints(e, "y");
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
    const s = this.options.scrubDistance ?? 500;
    if (s === 0) return;
    const n = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = tr(n / s);
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
    let s = t;
    const n = [
      ...Jn([s], this.options.snap ?? 0),
      ...(e === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = Qn([s], n, this.snapThreshold());
    s += r.delta, e === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const a = e === "x" ? o.minX : o.minY, c = e === "x" ? o.maxX : o.maxY;
      a !== void 0 && (s = Math.max(a, s)), c !== void 0 && (s = Math.min(c, s));
    }
    return s;
  }
}
function tr(i) {
  return i < 0 ? 0 : i > 1 ? 1 : i;
}
function Eo(i) {
  const t = new Di(i);
  return t.start(), t;
}
const er = { x: "x", y: "y", "x,y": "both" }, le = (i) => typeof i == "object" && i !== null && i.nodeType === 1;
function We(i, t) {
  const e = Ft(i), s = t.getBoundingClientRect();
  return {
    minX: s.left - e.left,
    maxX: s.right - e.right,
    minY: s.top - e.top,
    maxY: s.bottom - e.bottom
  };
}
function je(i) {
  return Array.isArray(i) ? [...i] : i;
}
function ir(i, t, e, s = {}) {
  const [n] = t.resolveTargets(e), r = n ? t.elementFor(n) : void 0;
  if (!n || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(e)}`);
  if (s.type === "rotation") return sr(i, t, n, r, s);
  const o = er[s.type ?? "x,y"], a = () => {
    const p = t.appliedValue(n, "x"), g = t.appliedValue(n, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof g == "number" ? g : 0 };
  }, c = typeof s.bounds == "string" ? t.query(s.bounds) : le(s.bounds) ? s.bounds : null, h = { bounds: (!c && s.bounds && !le(s.bounds) ? s.bounds : void 0) ?? (c ? We(r, c) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const g = s.inertia === !0 ? {} : s.inertia, y = g.friction ?? (g.resistance !== void 0 ? ye(g.resistance) : 4), b = a(), v = h.bounds ?? {};
    let T, w;
    const x = g.end;
    if (Array.isArray(x)) {
      const _ = Ct({ from: b.x, velocity: o === "y" ? 0 : p.x, friction: y }), L = Ct({ from: b.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let A = x[0];
      for (const M of x)
        Math.hypot(M.x - _, M.y - L) < Math.hypot(A.x - _, A.y - L) && (A = M);
      A && (T = [A.x], w = [A.y]);
    } else typeof x == "number" ? (T = x, w = x) : x && (T = je(x.x), w = je(x.y));
    const S = {};
    o !== "y" && (S.x = { velocity: p.x, friction: y, min: v.minX, max: v.maxX, end: T }), o !== "x" && (S.y = { velocity: p.y, friction: y, min: v.minY, max: v.maxY, end: w }), f = i.to(r, { inertia: S, onComplete: () => s.onThrowComplete?.() });
  }, m = new Di({
    target: r,
    axis: o,
    snap: s.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: a,
    onPress: () => {
      u(), c && (h.bounds = We(r, c)), s.onPress?.();
    },
    onDrag: (p) => {
      t.apply(n, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), s.onDrag?.(p);
    },
    onRelease: () => {
      const p = m.velocity;
      s.onRelease?.(p), s.inertia && d(p);
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
function sr(i, t, e, s, n) {
  const r = typeof n.bounds == "object" && n.bounds !== null && !le(n.bounds) ? n.bounds : {}, o = () => {
    const v = t.appliedValue(e, "rotate");
    return typeof v == "number" ? v : 0;
  }, a = (v) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, v));
  let c = null, l = !1, h, f = { x: 0, y: 0 }, u = 0, d = 0, m = [];
  const p = (v) => Math.atan2(v.clientY - f.y, v.clientX - f.x) * 180 / Math.PI, g = (v) => {
    if (l) return;
    c?.kill(), c = null, l = !0, h = v.pointerId, s.setPointerCapture?.(v.pointerId);
    const T = s.getBoundingClientRect();
    f = { x: T.left + T.width / 2, y: T.top + T.height / 2 }, u = p(v), d = o(), m = [{ time: performance.now(), rotation: d }], n.onPress?.();
  }, y = (v) => {
    if (!l || v.pointerId !== h) return;
    const T = p(v);
    let w = T - u;
    w > 180 && (w -= 360), w < -180 && (w += 360), u = T, d += w;
    let x = a(d);
    n.snap && (x = a(Math.round(x / n.snap) * n.snap)), t.apply(e, { rotate: x });
    const S = performance.now();
    for (m.push({ time: S, rotation: x }); m.length > 2 && S - m[0].time > 100; ) m.shift();
    const _ = { x: 0, y: 0 };
    n.onDrag?.(_);
  }, b = (v) => {
    if (!l || v.pointerId !== h) return;
    l = !1;
    const T = m[0], w = m[m.length - 1], x = T && w ? (w.time - T.time) / 1e3 : 0, S = x > 0 ? (w.rotation - T.rotation) / x : 0;
    if (n.onRelease?.({ x: S, y: 0 }), !n.inertia) return;
    const _ = n.inertia === !0 ? {} : n.inertia, L = _.friction ?? (_.resistance !== void 0 ? ye(_.resistance) : 4), A = typeof _.end == "number" || Array.isArray(_.end) ? _.end : void 0;
    c = i.to(s, {
      inertia: {
        rotate: {
          velocity: S,
          friction: L,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(A) ? A.filter((M) => typeof M == "number") : A
        }
      },
      onComplete: () => n.onThrowComplete?.()
    });
  };
  return s.addEventListener("pointerdown", g), s.addEventListener("pointermove", y), s.addEventListener("pointerup", b), s.addEventListener("pointercancel", b), s.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      c?.kill(), s.removeEventListener("pointerdown", g), s.removeEventListener("pointermove", y), s.removeEventListener("pointerup", b), s.removeEventListener("pointercancel", b);
    }
  };
}
const nr = { opacity: 0, scale: 0.6 };
function rr(i) {
  const t = i.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Ue(i) {
  const t = Ft(i);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function he(i, t) {
  const s = i.resolveTargets(t).map((o) => i.elementFor(o)).filter((o) => !!o), n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of s) {
    const a = rr(o);
    n.set(o, a);
    const c = Oi(o);
    a && c !== void 0 && !r.has(c) && r.set(c, { element: o, box: a });
  }
  return { elements: s, boxes: n, ids: r };
}
const Qt = /* @__PURE__ */ new WeakMap();
function ue(i, t, e, s = {}) {
  const n = s.duration ?? 0.6, r = s.ease ?? "power2.inOut", o = s.stagger ?? 0, a = s.scale !== !1, c = s.enter === void 0 ? nr : s.enter, l = new Set(e.elements);
  if (s.targets !== void 0)
    for (const d of i.resolveTargets(s.targets)) {
      const m = i.elementFor(d);
      m && l.add(m);
    }
  const h = [...l].sort(
    (d, m) => d === m ? 0 : d.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: s.onComplete });
  let u = 0;
  for (const d of h) {
    const m = Ue(d);
    if (!m) continue;
    let p = e.boxes.get(d) ?? null, g;
    const y = Oi(d), b = !p && y !== void 0 ? e.ids.get(y) : void 0;
    b && b.element !== d && (p = b.box, g = b.element);
    const [v] = i.resolveTargets(d);
    Qt.get(d)?.timeline.removeTracks({ target: v });
    const T = u * o;
    if (!p) {
      if (c === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...c }, { ...Bi(c), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: n, ease: r, delay: T }, 0), Qt.set(d, f), u++;
      continue;
    }
    const w = p.cx - m.cx, x = p.cy - m.cy, S = a ? p.width / m.width : 1, _ = a ? p.height / m.height : 1;
    if (!(Math.abs(w) > 0.5 || Math.abs(x) > 0.5 || Math.abs(S - 1) > 1e-3 || Math.abs(_ - 1) > 1e-3)) {
      const M = (E, k) => {
        const P = i.appliedValue(v, E);
        return typeof P == "number" && Math.abs(P - k) > 1e-6;
      };
      (M("x", 0) || M("y", 0) || M("scaleX", 1) || M("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const A = s.fade === !0 && g !== void 0;
    f.fromTo(
      d,
      { x: w, y: x, scaleX: S, scaleY: _, ...A && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ...A && { opacity: 1 }, duration: n, ease: r, delay: T },
      0
    ), A && g && Ue(g) && f.fromTo(g, { opacity: 1 }, { opacity: 0, duration: n, ease: r, delay: T }, 0), Qt.set(d, f), u++;
  }
  return f;
}
function Oi(i) {
  return i.dataset?.flipId;
}
function Bi(i) {
  const t = {};
  for (const e of Object.keys(i))
    t[e] = e === "opacity" || e.startsWith("scale") ? 1 : 0;
  return t;
}
function or(i, t = {}) {
  const e = new Set((t.type ?? "chars,words,lines").split(",").map((p) => p.trim())), s = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, n = t.aria !== !1, r = i.map((p) => ({
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
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), b = ar(g, s.words), v = e.has("chars") ? b.flatMap((x) => cr(x, s.chars)) : [], T = e.has("lines") ? hr(g, b, s.lines) : [];
      if (n) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const x of b) x.setAttribute("aria-hidden", "true");
      }
      if (e.has("words")) p.words.push(...b);
      else for (const x of b) x.removeAttribute("class");
      p.chars.push(...v), p.lines.push(...T);
      const w = t.mask === "lines" ? T : t.mask === "words" ? b : t.mask === "chars" ? v : [];
      for (const x of w) p.masks.push(ur(x, `${s[t.mask]}-mask`));
    }
    o = p;
  }, d = {
    elements: i,
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
      const v = () => {
        g = !1, d.split();
      };
      typeof requestAnimationFrame == "function" ? requestAnimationFrame(v) : setTimeout(v, 0);
    };
    if (typeof ResizeObserver == "function") {
      c = new ResizeObserver((v) => {
        let T = !1;
        for (const w of v) {
          const x = Math.round(w.contentRect.width), S = p.get(w.target);
          p.set(w.target, x), S !== void 0 && S !== x && (T = !0);
        }
        T && y();
      });
      for (const v of i) c.observe(v);
    }
    const b = i[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return d;
}
function ar(i, t) {
  const e = i.ownerDocument, s = [], n = e.createTreeWalker(
    i,
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
      h.className = t, h.style.display = "inline-block", h.textContent = l, c.appendChild(h), s.push(h);
    }
    o.replaceWith(c);
  }
  return s;
}
function cr(i, t) {
  const e = i.ownerDocument, s = lr(i.textContent ?? "").map((n) => {
    const r = e.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = n, r;
  });
  return i.replaceChildren(...s), s;
}
function lr(i) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(i), (e) => e.segment) : Array.from(i);
}
function hr(i, t, e) {
  const s = i.ownerDocument, n = new Map(t.map((m) => [m, m.getBoundingClientRect()])), r = [], o = (m) => {
    for (const p of Array.from(m.childNodes))
      p.nodeType === 3 || n.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(i);
  const a = [];
  let c = null, l = 0, h = 0, f = !1, u = [];
  const d = () => {
    c = s.createElement("span"), c.className = e, c.style.display = "block", a.push(c), u = [];
  };
  for (const m of r) {
    if (m.tagName === "BR") {
      f = !0;
      continue;
    }
    const p = n.get(m);
    if (p && (!c || f || p.top > l + h) && (d(), l = p.top, h = p.height / 2, f = !1), !c) continue;
    const g = [];
    for (let v = m.parentNode; v && v !== i; v = v.parentNode) g.unshift(v);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let b = y === 0 ? c : u[y - 1].clone;
    for (const v of g.slice(y)) {
      const T = v.cloneNode(!1);
      b.appendChild(T), u.push({ original: v, clone: T }), b = T;
    }
    b.appendChild(m);
  }
  return i.replaceChildren(...a), a;
}
function ur(i, t) {
  const e = i.ownerDocument.createElement("span");
  return e.className = t, e.style.display = i.style.display === "block" ? "block" : "inline-block", e.style.overflow = "clip", e.style.paddingBottom = "0.12em", e.style.marginBottom = "-0.12em", i.replaceWith(e), e.appendChild(i), e;
}
const ze = {
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
function He(i) {
  const t = i.trim().toLowerCase();
  if (t in ze) return ze[t];
  if (t.endsWith("%")) {
    const e = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(e) ? void 0 : e / 100;
  }
}
function Ni(i) {
  if (typeof i == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: i };
  let t = 0;
  const s = i.replace(/([+-])=\s*(-?[\d.]+)/g, (o, a, c) => (t += (a === "-" ? -1 : 1) * Number.parseFloat(c), "")).trim().split(/\s+/).filter(Boolean);
  if (s.length === 1 && /^-?[\d.]+$/.test(s[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(s[0]) + t
    };
  const n = s[0] !== void 0 ? He(s[0]) : void 0, r = s[1] !== void 0 ? He(s[1]) : void 0;
  return {
    elementFraction: n ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function gt(i, t, e) {
  const s = Ni(e), n = s.absolutePx !== void 0 ? i.top + s.absolutePx : i.top + i.height * s.elementFraction, r = t * s.viewportFraction;
  return n - r + s.offsetPx;
}
function _o(i, t, e, s) {
  const n = gt(i, t, e), o = gt(i, t, s) - n;
  return o <= 0 ? n <= 0 ? 1 : 0 : qi(-n / o);
}
function qi(i) {
  return i < 0 ? 0 : i > 1 ? 1 : i === 0 ? 0 : i;
}
function fr(i, t, e, s) {
  if (e <= 0) return t;
  const n = 1 - Math.exp(-(s / 1e3) / e);
  return i + (t - i) * n;
}
function Ge(i, t, e, s, n) {
  const r = (h) => gt({ top: i + n(h), bottom: i + n(h) + t, height: t }, e, s), o = r(0), a = r(1);
  if (Math.sign(o) === Math.sign(a) || o === 0 || a === 0)
    return o === 0 ? 0 : a === 0 ? 1 : Math.abs(o) < Math.abs(a) ? 0 : 1;
  let c = 0, l = 1;
  for (let h = 0; h < 40; h++) {
    const f = (c + l) / 2;
    Math.sign(r(f)) === Math.sign(o) ? c = f : l = f;
  }
  return (c + l) / 2;
}
class dr {
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
function Co(i) {
  const t = new dr(i);
  return t.start(), t;
}
class pr {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(t, e = {}) {
    this.element = t, this.axis = e.axis ?? "y", this.spacing = e.spacing ?? !0;
    const s = t.ownerDocument;
    this.spacer = s.createElement("div"), this.spacer.className = "pin-spacer", this.saved = { position: t.style.position, top: t.style.top, left: t.style.left }, this.axis === "x" && (this.spacer.style.flexShrink = "0"), t.replaceWith(this.spacer), this.spacer.appendChild(t);
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
    const s = Math.max(0, e);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + s}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${s}px`, this.element.style.left = `${t}px`) : (this.spacer.style.height = `${this.element.offsetHeight + s}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${s}px`, this.element.style.top = `${t}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const mr = 0.15;
function gr(i) {
  return typeof i == "object" && !Array.isArray(i) ? i : { snapTo: i };
}
function yr(i, t, e) {
  const s = St(i + t * mr);
  if (typeof e == "function") return St(e(s));
  if (typeof e == "number")
    return e <= 0 ? i : St(Math.round(s / e) * e);
  if (e.length === 0) return i;
  let n = e[0];
  for (const r of e)
    Math.abs(r - s) < Math.abs(n - s) && (n = r);
  return St(n);
}
function br(i, t, e) {
  const s = i.duration ?? { min: 0.2, max: 0.8 };
  if (typeof s == "number") return s;
  const n = Math.min(1, Math.abs(t) / Math.max(1, e));
  return s.min + (s.max - s.min) * n;
}
class vr {
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
  animate(t, e, s, n = Nt, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || s <= 0) {
      this.write(e), r?.();
      return;
    }
    for (const c of this.cancelEvents) this.eventTarget?.addEventListener(c, this.onInterrupt, { passive: !0 });
    let o = null;
    const a = (c) => {
      o ??= c;
      const l = Math.min(1, (c - o) / (s * 1e3));
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
function St(i) {
  return Math.max(0, Math.min(1, i));
}
class wr {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, e, s) {
    this.options = s === !0 ? {} : s, this.scroller = e;
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
    const s = this.scroller ? e : 0;
    this.scrollerStart.style.top = `${s + t.startViewport}px`, this.scrollerEnd.style.top = `${s + t.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(t, e) {
    this.scroller && this.place(t, e);
  }
  destroy() {
    for (const t of this.nodes.splice(0)) t.remove();
  }
}
const Tr = 120, et = [], ot = /* @__PURE__ */ new Set();
let Jt = !1;
const xr = () => {
  Jt || ot.size === 0 || (Jt = !0, queueMicrotask(() => {
    Jt = !1;
    for (const i of ot) i.afterRefresh();
  }));
}, Xi = () => {
  for (const i of ot) i.beforeRefresh();
  for (const i of et) i.refresh();
  for (const i of ot) i.afterRefresh();
};
let it = { width: 0, height: 0 };
const Ke = () => {
  const i = window.innerWidth, t = window.innerHeight, e = i === it.width && t !== it.height, s = Math.abs(t - it.height) < it.height * 0.25, n = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  e && s && n || (it = { width: i, height: t }, Xi());
};
class qt {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new vr((e) => this.scrollTo(e), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new pr(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new wr(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), et.length === 0 && typeof window < "u" && (it = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", Ke, { passive: !0 })), et.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), et.splice(et.indexOf(this), 1), et.length === 0 && typeof window < "u" && window.removeEventListener("resize", Ke), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    Xi();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return ot.add(t), () => ot.delete(t);
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
      const s = this.viewportHeight();
      if (this.startPx = t + gt(e, s, ft(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(e, s, t), this.pin) {
        const n = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(n.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(s) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, xr();
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
    const s = this.endPx - this.startPx, n = this.zone;
    this.targetProgress = s > 0 ? qi((t - this.startPx) / s) : t >= this.startPx ? 1 : 0, this.zone = s > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(n, this.zone), e || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, e, s) {
    const n = ft(this.options.end) ?? "bottom top", r = typeof n == "string" ? n.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? e * o / 100 : o);
    }
    return s + gt(t, e, n);
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
    }, Tr));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, e) {
    if (t === e) return;
    const { onEnter: s, onLeave: n, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (s?.(), e === "after" && n?.()) : t === "after" ? (r?.(), e === "before" && o?.()) : e === "after" ? n?.() : o?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const t = this.options.snap;
    if (t === void 0 || this.snapper.active) return;
    const e = gr(t), s = () => {
      this.snapTimer = null;
      const n = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || n <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / n, a = this.startPx + yr(o, this.releaseVelocity / n, e.snapTo) * n;
      Math.abs(a - r) < 1 || this.snapper.animate(r, a, br(e, a - r, this.viewportHeight()), e.ease);
    };
    e.delay ? this.snapTimer = setTimeout(s, e.delay * 1e3) : s();
  }
  scrollTo(t) {
    const e = this.options.scroller, s = this.options.horizontal ? { left: t } : { top: t };
    e ? typeof e.scrollTo == "function" ? e.scrollTo({ ...s, behavior: "instant" }) : this.options.horizontal ? e.scrollLeft = t : e.scrollTop = t : typeof window < "u" && window.scrollTo({ ...s, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const e = this.options.trigger;
    if (typeof e?.getBoundingClientRect != "function") return;
    const s = e.getBoundingClientRect(), n = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = s.left - n - t.shiftAt(t.progress()), { start: a, end: c } = t.range(), l = (d) => a + d * (c - a), h = Ge(o, s.width, r, ft(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = l(h);
    const f = ft(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : l(Ge(o, s.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const e = (r, o) => {
      const a = ft(r) ?? o;
      if (typeof a == "number") return 0;
      if (/^\s*\+=/.test(a)) return;
      const c = Ni(a);
      return t * c.viewportFraction - c.offsetPx;
    }, s = e(this.options.start, "top bottom") ?? 0, n = e(this.options.end, "bottom top") ?? s;
    return {
      startViewport: s,
      endViewport: n,
      startPage: this.startPx + s,
      endPage: this.endPx + n
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (e) => {
      if (this.rafId = null, !this.running) return;
      const s = this.lastFrameTime === null ? 16.67 : e - this.lastFrameTime;
      this.lastFrameTime = e, this.displayProgress = fr(this.displayProgress, this.targetProgress, this.smoothing(), s);
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
    const e = this.options.horizontal, s = e ? t.left ?? 0 : t.top, n = e ? t.right ?? 0 : t.bottom, r = e ? t.width ?? 0 : t.height, o = this.options.scroller;
    if (o && typeof o.getBoundingClientRect == "function") {
      const a = o.getBoundingClientRect(), c = e ? a.left : a.top;
      return { top: s - c, bottom: n - c, height: r };
    }
    return { top: s, bottom: n, height: r };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const t = this.options.scroller, e = this.options.horizontal;
    return t ? e ? t.clientWidth : t.clientHeight : typeof window < "u" ? e ? window.innerWidth : window.innerHeight : 0;
  }
}
function ft(i) {
  return typeof i == "function" ? i() : i;
}
function Ro(i) {
  const t = new qt(i);
  return t.start(), t;
}
const te = /* @__PURE__ */ new Set(), kr = 16, Ze = 0.5, Sr = 2;
class Qe {
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
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), te.add(this), this.stopListening = qt.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of te) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), te.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) ee(t.element, t.saved);
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
    const s = this.clamp(this.resolve(t) + (e.offset ?? 0)), n = Math.abs(s - this.current), r = this.reduced ? 0 : e.duration ?? Math.min(1.2, Math.max(0.4, n / 2500));
    if (r <= 0) {
      this.journey = null, this.current = this.target = s, this.write(s), this.applyEffects(0);
      return;
    }
    this.target = s, this.journey = { from: this.current, to: s, ms: r * 1e3, ease: e.ease ?? Nt, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const e = this.options.scroller ?? document, s = this.position(), n = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of e.querySelectorAll(t)) {
        const a = Number.parseFloat(o.dataset.speed ?? ""), c = Number.parseFloat(o.dataset.lag ?? ""), l = o.getBoundingClientRect(), h = l.top - r + s;
        this.effects.push({
          element: o,
          speed: Number.isFinite(a) ? a : void 0,
          lag: Number.isFinite(c) && c > 0 ? c : void 0,
          centre: h + l.height / 2 - n / 2,
          lagged: s,
          shift: 0,
          saved: o.style.getPropertyValue("translate")
        });
      }
    }
    this.current = this.target = this.clamp(this.position()), this.applyEffects(0);
  }
  /** Put effect elements at their natural place, for measuring. */
  rest() {
    for (const t of this.effects) ee(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const e = t.deltaMode === 1 ? kr : t.deltaMode === 2 ? this.viewportHeight() : 1, s = t.deltaY * e * (this.options.wheelMultiplier ?? 1), n = this.clamp(this.target + s);
    n === this.target && n === this.current || (t.preventDefault(), this.journey = null, this.target = n, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= Sr || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
  }
  nestedScrollerTakes(t) {
    const e = this.options.scroller ?? document.documentElement;
    for (let s = t.target; s && s !== e && s !== document.body; s = s.parentElement) {
      if (s.hasAttribute?.("data-smooth-ignore")) return !0;
      const n = getComputedStyle(s);
      if (!/(auto|scroll)/.test(n.overflowY) || s.scrollHeight <= s.clientHeight) continue;
      if (t.deltaY < 0 ? s.scrollTop > 0 : s.scrollTop + s.clientHeight < s.scrollHeight - 1) return !0;
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
    const s = this.current;
    if (this.journey) {
      const r = this.journey;
      r.elapsed += e;
      const o = Math.min(1, r.elapsed / r.ms);
      this.current = r.from + (r.to - r.from) * r.ease(o), o >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const r = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-e / r)), Math.abs(this.target - this.current) < Ze && (this.current = this.target);
    }
    this.current !== s && this.write(this.current), this.velocityPxPerSecond = e > 0 ? (this.current - s) * 1e3 / e : 0;
    const n = this.applyEffects(e);
    this.current !== s && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || n ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(t) {
    let e = !1;
    const s = this.current;
    for (const n of this.effects) {
      let r = 0;
      if (n.speed !== void 0 && (r += (s - n.centre) * (1 - n.speed)), n.lag !== void 0) {
        const o = n.lag * 1e3 / 3;
        n.lagged = t === 0 ? s : n.lagged + (s - n.lagged) * (1 - Math.exp(-t / o)), Math.abs(s - n.lagged) < Ze ? n.lagged = s : e = !0, r += s - n.lagged;
      }
      ee(n.element, r === 0 ? n.saved : `0 ${Mr(r)}px`), n.shift = r;
    }
    return e;
  }
  // --- geometry -------------------------------------------------------------
  write(t) {
    const e = Math.round(t);
    this.written = e;
    const s = this.options.scroller;
    s ? s.scrollTop = e : window.scrollTo({ top: e, behavior: "instant" });
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
    const e = this.options.scroller ?? document, s = typeof t == "string" ? e.querySelector(t) : t;
    if (!s) return this.current;
    const n = this.options.scroller?.getBoundingClientRect().top ?? 0, r = this.effects.find((o) => o.element === s)?.shift ?? 0;
    return s.getBoundingClientRect().top - n + this.position() - r;
  }
}
function ee(i, t) {
  t ? i.style.setProperty("translate", t) : i.style.removeProperty("translate");
}
function Mr(i) {
  return Math.round(i * 100) / 100;
}
function Ar(i, t) {
  switch (t) {
    // Play forward from wherever it is; reverse() flips a reversed timeline and plays.
    // Neither restarts an animation that is already at that end.
    case "play":
      if (i.progress() >= 1) break;
      i.reversed() ? i.reverse() : i.play();
      break;
    case "reverse":
      if (i.progress() <= 0) break;
      i.reversed() ? i.play() : i.reverse();
      break;
    case "pause":
      i.pause();
      break;
    case "resume":
      i.resume();
      break;
    case "restart":
      i.restart();
      break;
    case "reset":
      i.pause(), i.progress(0);
      break;
    case "complete":
      i.pause(), i.progress(1);
      break;
  }
}
function be(i, t, e, s, n = () => {
}) {
  const r = (d) => typeof d == "string" ? i.query(d) ?? void 0 : d, o = r(t.trigger) ?? s;
  if (!o) {
    n(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const a = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, c = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let l = 0, h;
  const f = (d, m) => () => {
    m?.(), e && !a && Ar(e, c[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => h.destroy());
  }, u = t.containerAnimation ? _r(i, t.containerAnimation, o, n) : void 0;
  return h = new qt({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: a === !1 ? void 0 : a,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && e?.invalidate ? () => e.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : Pr(t.snap, e),
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
  }), e && a === !1 && e.progress(0), h.start(), i.own(h);
}
function Pr(i, t) {
  const e = (n) => n === "labels" ? (r) => Er(r, t?.labelProgresses?.() ?? []) : n;
  if (typeof i != "object" || Array.isArray(i)) return e(i);
  const s = i.ease ? It(i.ease) : void 0;
  return {
    snapTo: e(i.snapTo),
    duration: i.duration,
    delay: i.delay,
    ease: s ? s.fn ?? W(s.easing) : void 0
  };
}
function Er(i, t) {
  return t.reduce((e, s) => Math.abs(s - i) < Math.abs(e - i) ? s : e, t[0] ?? i);
}
function _r(i, t, e, s) {
  const n = () => t.timeline.getTracks({ property: "x" }).map((r) => r.target).filter((r) => {
    const o = i.elementFor(r);
    return !!o && o !== e && o.contains(e);
  });
  return n().length === 0 && s("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const r = t.scrollTrigger;
      return r || s("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: r?.startOffset ?? 0, end: r?.endOffset ?? 0 };
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
class Yi {
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
      const s = t();
      return typeof s == "function" && this.items.push({ revert: s }), s;
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
    for (const [t, { name: e, style: s, d: n }] of this.snapshots)
      s === null ? t.removeAttribute("style") : t.setAttribute("style", s), n !== null && t.setAttribute("d", n), this.host.forget(e);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class Cr {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, e) {
    this.host = t, this.scope = e;
  }
  add(t, e) {
    const s = { conditions: t, setup: e, queries: /* @__PURE__ */ new Map() }, n = typeof t == "string" ? { matches: t } : t;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [r, o] of Object.entries(n)) {
        const a = window.matchMedia(o);
        s.queries.set(r, a);
        const c = () => this.scheduleUpdate();
        a.addEventListener("change", c), this.listeners.push(() => a.removeEventListener("change", c));
      }
    return this.entries.push(s), this.update(s), this;
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
    const s = Object.values(e).some(Boolean), n = s ? JSON.stringify(e) : void 0;
    if (n === t.key || (t.context?.revert(), t.context = void 0, t.key = n, !s)) return;
    const r = new Yi(this.host, this.scope);
    r.conditions = e, r.add(() => t.setup(r)), t.context = r;
  }
}
class Rr {
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
    const t = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, e = Math.round(this.canvas.clientWidth * t), s = Math.round(this.canvas.clientHeight * t);
    e > 0 && s > 0 && (this.canvas.width !== e || this.canvas.height !== s) && (this.canvas.width = e, this.canvas.height = s), this.drawn = -1, this.draw();
  }
  draw() {
    const t = Math.round(this.current), e = this.nearestReady(t);
    if (e === -1 || e === this.drawn || !this.context) return;
    const s = this.images[e], { width: n, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(n / s.naturalWidth, r / s.naturalHeight) : Math.min(n / s.naturalWidth, r / s.naturalHeight), a = s.naturalWidth * o, c = s.naturalHeight * o;
    this.context.clearRect(0, 0, n, r), this.context.drawImage(s, (n - a) / 2, (r - c) / 2, a, c), this.drawn = e, this.pump();
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
    for (let s = 0; s < this.frames && this.inFlight < t; s++)
      for (const n of s === 0 ? [e] : [e + s, e - s])
        n < 0 || n >= this.frames || this.images[n] || this.inFlight >= t || this.load(n);
  }
  load(t) {
    const e = new Image();
    e.decoding = "async", this.images[t] = e, this.inFlight++;
    const s = (n) => {
      if (!this.destroyed) {
        if (this.inFlight--, n) {
          this.ready[t] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const r = Math.round(this.current);
          (Math.abs(t - r) < Math.abs(this.drawn - r) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    e.onload = () => s(!0), e.onerror = () => s(!1), e.src = this.options.url(t);
  }
}
const Ir = { opacity: 0, y: -16 }, $r = { opacity: 0, y: 16 };
async function Fr(i, t, e, s) {
  const n = t.collector?.scope ?? t.root, r = n.ownerDocument ?? n, o = () => s.shared ? [...n.querySelectorAll(s.shared)] : [];
  if (s.native && typeof r.startViewTransition == "function")
    return Lr(r, s, o);
  const a = s.duration ?? 0.35, c = s.ease ?? "power2.inOut", l = (g) => new Promise((y) => {
    g(y) || y();
  }), h = o(), f = h.length ? he(t, h) : void 0, u = s.from !== void 0 ? Je(t, s.from, s.shared) : [];
  if (u.length && s.leave !== !1) {
    const g = s.leave ?? Ir;
    await l((y) => i.to(u, { ...g, duration: a, ease: c, onComplete: y }));
  }
  await s.update();
  const d = [], m = typeof s.to == "function" ? s.to() : s.to, p = m !== void 0 ? Je(t, m, s.shared) : [];
  if (p.length && s.enter !== !1) {
    const g = s.enter ?? $r;
    d.push(l((y) => i.fromTo(p, g, { ...Bi(g), duration: a, ease: c, onComplete: y })));
  }
  if (f) {
    const g = o().filter((y) => !h.includes(y));
    g.length && d.push(
      l(
        (y) => ue(t, e, f, {
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
function Je(i, t, e) {
  const s = i.resolveTargets(t).map((n) => i.elementFor(n)).filter((n) => !!n);
  return e ? s.flatMap((n) => !n.querySelector(e) && !n.matches(e) ? [n] : [...n.children].filter((r) => !r.matches(e) && !r.querySelector(e))) : s;
}
async function Lr(i, t, e) {
  const s = (a, c) => {
    const l = a.dataset?.flipId;
    l && a.style.setProperty("view-transition-name", c ? `tf-${l.replace(/[^\w-]/g, "-")}` : "");
  }, n = e();
  n.forEach((a) => s(a, !0));
  let r = [];
  await i.startViewTransition(async () => {
    n.forEach((a) => s(a, !1)), await t.update(), r = e(), r.forEach((a) => s(a, !0));
  }).finished, r.forEach((a) => s(a, !1));
}
const Dr = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (i, t) => me(i, sn(t))
}, Or = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (i, t) => me(i, { fn: nn(t) })
}, Br = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (i, t) => me(i, { fn: rn(t) })
}, Nr = /* @__PURE__ */ new Set([
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
]), ti = 0.5, qr = "power1.inOut";
function Xr(i) {
  return i.keyframes !== void 0 && i.keyframes !== null;
}
function Yr(i) {
  const t = i.keyframes, e = {};
  for (const [l, h] of Object.entries(i)) Nr.has(l) || (e[l] = h);
  if (Array.isArray(t))
    return t.map((l) => ({
      ...e,
      ...l,
      duration: l.duration ?? i.duration ?? ti
    }));
  const s = Object.entries(t), n = i.duration ?? ti, r = t.easeEach ?? i.easeEach ?? qr;
  if (s.length > 0 && s.every(([l]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(l) || l === "easeEach")) {
    const l = s.filter(([u]) => u !== "easeEach").map(([u, d]) => ({ at: Number.parseFloat(u) / 100, step: d })).sort((u, d) => u.at - d.at), h = [];
    let f = 0;
    for (const { at: u, step: d } of l) {
      const m = Math.max(0, u - f);
      h.push({ ...e, ease: r, ...d, duration: m * n }), f = u;
    }
    return h;
  }
  const o = s.filter(([l, h]) => l !== "easeEach" && Array.isArray(h)), a = Math.max(0, ...o.map(([, l]) => l.length)), c = [];
  for (let l = 0; l < a; l++) {
    const h = { ...e, ease: r, duration: n / a };
    for (const [f, u] of o)
      l < u.length && (h[f] = u[l]);
    c.push(h);
  }
  return c;
}
function ei(i, t, e, s = {}) {
  const n = t.collector?.scope ?? t.root, r = typeof s.scroller == "string" ? n.querySelector(s.scroller) : s.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, a = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, c = (b, v) => {
    if (v === void 0) return o[b];
    if (typeof v == "number") return v;
    if (v === "max") return a[b];
    const T = typeof v == "string" ? n.querySelector(v) : v;
    if (!T) return o[b];
    const w = T.getBoundingClientRect(), x = r?.getBoundingClientRect(), S = (b === "x" ? s.offsetX : s.offsetY) ?? s.offset ?? 0;
    return b === "x" ? w.left - (x?.left ?? 0) + o.x - S : w.top - (x?.top ?? 0) + o.y - S;
  }, l = typeof e == "object" && e !== null && !("nodeType" in e) ? { x: c("x", e.x), y: c("y", e.y) } : { x: o.x, y: c("y", e) }, h = { x: Math.max(0, Math.min(a.x, l.x)), y: Math.max(0, Math.min(a.y, l.y)) }, f = { ...o }, u = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], m = r ?? window, p = () => {
    y.kill(), g();
  }, g = () => {
    for (const b of d) m.removeEventListener(b, p);
  }, y = i.to(f, {
    x: h.x,
    y: h.y,
    duration: s.duration ?? 1,
    ease: s.ease ?? "power2.inOut",
    onStart: s.onStart,
    onUpdate: () => {
      u(), s.onUpdate?.();
    },
    onComplete: () => {
      g(), s.onComplete?.();
    }
  });
  if (s.autoKill !== !1) for (const b of d) m.addEventListener(b, p, { passive: !0 });
  return y;
}
function Vr(i, t, e) {
  const s = i.collector?.scope ?? i.root, n = typeof t == "string" ? [...s.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: a, onLeave: c, onEnterBack: l, onLeaveBack: h, ...f } = e, u = { onEnter: a, onLeave: c, onEnterBack: l, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, p = (y) => {
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
    (y) => be(i, {
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
    if (this.stage = t, this.options = e, this.compat = new st({
      ...e,
      startValue: (s, n) => {
        const r = t.objectFor(s);
        if (r) return zr(r[n]);
        const o = t.appliedValue(s, n);
        if (o !== void 0) return o;
        if (n === "d") return Li(t.elementFor(s)) ?? void 0;
        if (n === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (n === "strokeDasharray" || n === "strokeDashoffset") {
          const a = ni(t.elementFor(s));
          if (a !== void 0) return n === "strokeDasharray" ? [a, a] : 0;
        }
      },
      startVelocity: (s, n) => t.velocityOf(s, n),
      layoutColumns: (s) => si(s.map((n) => t.elementFor(n))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !e.paused && !e.scrollTrigger, e.scrollTrigger) {
      const s = e.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = be(t, s, this, this.firstElement, (n) => e.onWarning?.(n)));
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
  to(t, e, s) {
    return Xr(e) ? this.record(() => this.keyframed(t, e, s)) : this.record(() => this.tween(t, [e], s, ([n], r, o) => this.compat.to(r, n, o)));
  }
  from(t, e, s) {
    return this.record(() => this.tween(t, [e], s, ([n], r, o) => this.compat.from(r, n, o)));
  }
  fromTo(t, e, s, n) {
    return this.record(
      () => this.tween(t, [e, s], n, ([r, o], a, c) => this.compat.fromTo(a, r, o, c))
    );
  }
  set(t, e, s) {
    return this.record(() => this.tween(t, [e], s, ([n], r, o) => this.compat.set(r, n, o)));
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
  call(t, e = [], s) {
    return this.record(() => {
      const n = this.compat.addEvent(s);
      this.events.push({ time: n, run: () => t(...e) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(t, e, s = []) {
    return this.record(() => {
      const n = this.compat.addEvent(t);
      this.events.push({ time: n, pause: !0, run: () => e?.(...s) });
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
  tweenFromTo(t, e, s = {}) {
    this.pause(), this.seek(t);
    const n = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(e))), o = { time: n }, a = s.duration ?? Math.abs(r - n) / 1e3 / (this.timeScale() || 1), c = new V(this.stage, { onStart: s.onStart, onComplete: s.onComplete });
    return c.to(o, {
      time: r,
      duration: a,
      ease: s.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), s.onUpdate?.();
      }
    }), c;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const t = this.timeline.playbackState === "playing", e = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !t) {
      const s = this.timeline, n = s.direction === "forward" ? s.currentTime === 0 : s.currentTime === s.duration;
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
    for (const s of t)
      for (const n of e ?? [void 0])
        this.timeline.removeTracks({ target: s, ...n !== void 0 && { property: n } });
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
    const s = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: t >= e.time ? "forward" : "reverse" }, n = { ...e, iteration: s.iteration, direction: s.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(n, s, !1), this.options.onUpdate?.();
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
    const s = this.playhead, n = this.readPlayhead();
    this.playhead = n;
    const r = this.options.yoyo === !0;
    e && !r && n.iteration > s.iteration && (this.playhead = { time: 0, iteration: n.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const o = this.runCrossings(s, n, e);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !o) {
      this.finishedThisFrame = !1;
      const a = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), a && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, e, s) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const n = this.events, { crossings: r, passes: o } = xi(
      n.map((a) => a.time),
      t,
      e,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: s }
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
  tween(t, e, s, n) {
    const r = this.resolve(t);
    if (!r) return;
    const { onStart: o, onUpdate: a, onComplete: c } = e[e.length - 1];
    if (o || a || c) {
      let l = 1 / 0, h = -1 / 0;
      const f = (u, d, m) => {
        n(u, d, m), l = Math.min(l, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(r, e, s, f), l === 1 / 0) return;
      o && this.events.push({ time: l, direction: "forward", run: o }), a && this.ranges.push({ start: l, end: h, run: a }), c && this.events.push({ time: h, direction: "forward", run: c });
      return;
    }
    this.buildTween(r, e, s, n);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(t, e, s) {
    const n = this.resolve(t);
    if (!n) return;
    const r = Yr(e);
    if (r.length === 0) return;
    const o = n.length > 1 ? ce(e.stagger, this.staggerContext(n)) : void 0, a = n.map((g) => this.targetFor(g)).filter((g) => g !== void 0), c = o ? a.map((g) => [g]) : [a], l = o ? ie(n.length, o).map((g) => g / 1e3) : [0], h = this.compat.timeOf(s) / 1e3 + $t(e.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (c.forEach((g, y) => {
      r.forEach((b, v) => {
        const T = v === 0 ? h + l[y] : ">";
        this.tween(g, [b], T, ([w], x, S) => this.compat.to(x, w, S)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: d, onUpdate: m, onComplete: p } = e;
    d && this.events.push({ time: f, direction: "forward", run: d }), m && this.ranges.push({ start: f, end: u, run: m }), p && this.events.push({ time: u, direction: "forward", run: p });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => si(t.map((e) => this.stage.elementFor(e))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, e, s, n) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (e.some(Ur) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      n(e.map((d) => this.prepare(ii(d, 0, u, this.stage.utils, r), t)), t, s);
      return;
    }
    const a = e.length - 1, { stagger: c, ...l } = e[a], h = ce(c, this.staggerContext(t)), f = h ? ie(t.length, h).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, d) => {
      const m = d === 0 ? $t(l.delay, 0) / 1e3 + f[0] : 0, p = d === 0 ? 0 : f[d] - f[d - 1], g = d === 0 ? s : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, b = e.map((v, T) => T === a ? { ...l, delay: m } : v).map((v) => this.prepare(ii(v, d, this.targetFor(u), this.stage.utils, r), [u]));
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
    const s = (o) => this.options.onWarning?.(o), n = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = zn(t.motionPath, {
        query: n,
        targets: e.map((a) => this.stage.elementFor(a)).filter((a) => !!a),
        warn: s
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Hn(t.morphSVG, n, s), { morphSVG: a, ...c } = r;
      r = o ? { ...r, morphSVG: o } : c;
    }
    if (t.drawSVG !== void 0) {
      const o = ni(this.stage.elementFor(e[0]));
      if (o === void 0) {
        s("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: a, ...c } = r;
        r = c;
      } else
        r = kn(r, o);
    }
    return r;
  }
  resolve(t) {
    const e = this.stage.resolveTargets(t);
    if (e.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Hr(t)}`);
      return;
    }
    return this.firstElement ??= e.map((s) => this.stage.elementFor(s)).find((s) => s !== void 0), e;
  }
}
function Wr(i = new Vn()) {
  const t = (r) => {
    const { config: o } = Pt(r);
    return new V(i, {
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
  }, s = (r) => (r && i.collector?.track(r), r), n = {
    stage: i,
    ticker: i.ticker,
    utils: i.utils,
    getProperty: (r, o) => {
      const [a] = i.resolveTargets(r);
      if (a === void 0) return;
      const c = i.objectFor(a);
      return c ? c[o] : i.appliedValue(a, o) ?? Ri(o);
    },
    scrollTrigger: (r) => s(be(i, r)),
    scrollBatch: (r, o) => Vr(i, r, o).map((a) => s(a)),
    scrollTo: (r, o) => ei(n, i, r, o),
    refreshScroll: () => {
      qt.refreshAll(), Qe.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (i.collector?.scope ?? i.root).querySelector(r.scroller) : r.scroller;
      return s(new Qe({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const a = new Yi(i, o);
      return r && a.add(() => r(a)), a;
    },
    matchMedia: (r) => new Cr(i, r),
    customEase: Dr.create,
    customBounce: Or.create,
    customWiggle: Br.create,
    pageTransition: (r) => Fr(n, i, (o) => new V(i, o), r),
    imageSequence: (r, o) => {
      const a = typeof r == "string" ? (i.collector?.scope ?? i.root).querySelector(r) : r;
      if (!(a instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return s(new Rr(a, o));
    },
    quickTo: (r, o, a = {}) => {
      const c = new V(i, { paused: !0 }), [l] = i.resolveTargets(r);
      return Object.assign((f) => {
        if (!l) return;
        const u = a.spring !== void 0 ? i.velocityOf(l, o) ?? 0 : 0;
        c.compat.reset(), c.compat.to(l, {
          [o]: f,
          duration: a.duration ?? 0.4,
          ease: a.ease ?? "power3.out",
          ...a.spring !== void 0 && { spring: jr(a.spring, o, u) }
        }), c.timeline.stop(), c.timeline.play(), i.activate(c.timeline);
      }, { tween: c, kill: () => c.kill() });
    },
    timeline: (r) => new V(i, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: a, ...c } = o, l = typeof a == "object" && a !== null && !("nodeType" in a) ? a : {}, h = typeof r != "string" && r !== window && r.nodeType === 1;
        return ei(n, i, a, {
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
    delayedCall: (r, o, a) => new V(i).call(o, a, r),
    killTweensOf: (r, o) => {
      const a = i.resolveTargets(r), c = typeof o == "string" ? o.split(",").map((l) => l.trim()).filter(Boolean) : o;
      for (const l of [...i.liveTimelines]) l.killTweensOf(a, c);
    },
    convertToPath: (r) => Kn(r, i.root),
    splitText: (r, o) => {
      const a = i.collector?.scope ?? i.root, c = typeof r == "string" ? Array.from(a.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return s(or(c, o));
    },
    draggable: (r, o) => s(ir(n, i, r, o)),
    getFlipState: (r) => he(i, r),
    flipFrom: (r, o) => ue(i, (a) => new V(i, a), r, o),
    flip: (r, o, a) => {
      const c = he(i, r);
      return o(), ue(i, (l) => new V(i, l), c, { targets: r, ...a });
    }
  };
  return n;
}
const B = /* @__PURE__ */ Wr();
function jr(i, t, e) {
  return i === !0 ? { velocity: { [t]: e } } : typeof i == "string" ? { preset: i, velocity: { [t]: e } } : { ...i, velocity: { [t]: e } };
}
function Ur(i) {
  return i.morphSVG !== void 0 || i.drawSVG !== void 0 || i.text !== void 0 || i.scrambleText !== void 0 || Vi(i);
}
function Vi(i) {
  return Object.entries(i).some(([t, e]) => (typeof e == "function" || Ci(e)) && !ge.has(t));
}
function ii(i, t, e, s, n) {
  if (!Vi(i)) return i;
  const r = {};
  for (const [o, a] of Object.entries(i))
    ge.has(o) ? r[o] = a : typeof a == "function" ? r[o] = a(t, e, n) : Ci(a) ? r[o] = s.resolveRandomString(a) : r[o] = a;
  return r;
}
function si(i) {
  const t = i.map((s) => s?.getBoundingClientRect().top);
  if (t[0] === void 0) return i.length;
  let e = 0;
  for (const s of t) {
    if (s === void 0 || Math.abs(s - t[0]) > 1) break;
    e++;
  }
  return Math.max(1, e);
}
function ni(i) {
  const t = i;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function zr(i) {
  if (typeof i == "number" || typeof i == "string" || Array.isArray(i) && i.every((t) => typeof t == "number")) return i;
}
function Hr(i) {
  return typeof i == "string" ? `"${i}"` : String(i);
}
class ri {
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
    const s = this.targetTime(t);
    e ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - s) > this.driftTolerance && (this.media.currentTime = s)) : (this.media.paused || this.media.pause(), this.media.currentTime !== s && (this.media.currentTime = s));
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
function Gr(i, t, e, s, n) {
  const r = e - n;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  i.update(r, s);
}
class ve {
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
  constructor(t, e = {}) {
    if (typeof t == "string") {
      const s = document.querySelector(t);
      if (!s)
        throw new Error(`Container not found: ${t}`);
      this.container = s;
    } else
      this.container = t;
    this.options = e, this.adapter = new K();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    let e;
    if (typeof t == "string") {
      const s = await fetch(t);
      if (!s.ok)
        throw new Error(`Failed to load animation: ${s.statusText}`);
      e = await s.json();
    } else
      e = t;
    this.options.speed !== void 0 && (e.config = { ...e.config, speed: this.options.speed }), this.options.loop !== void 0 && (e.config = { ...e.config, loop: this.options.loop }), this.options.alternate !== void 0 && (e.config = { ...e.config, alternate: this.options.alternate }), this.timeline = mt(e), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia(), this.showInitialFrame(), this.watchReducedMotion(), this.watchVisibility(), this.options.autoplay && !this.reducedMotion && (this.options.playWhenVisible && !this.onScreen ? this.autoplayWhenSeen = !0 : this.play());
  }
  // --- teaching: frames, markers, reduced motion, visibility -----------------
  /**
   * Be told whenever the time, play state or current marker may have changed —
   * for controls and captions. Returns a function that stops it.
   */
  subscribe(t) {
    return this.listeners.add(t), () => this.listeners.delete(t);
  }
  notify() {
    for (const t of this.listeners) t();
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
    const t = this.currentTime;
    let e;
    for (const s of this.markers)
      if (s.time <= t + 0.5) e = s;
      else break;
    return e;
  }
  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(t, e) {
    const s = t ? this.markers.find((o) => o.id === t) : this.currentMarker;
    if (!s) return;
    const n = e ?? this.language(), r = (o) => o?.[n]?.[s.id] ?? o?.[n.split("-")[0]]?.[s.id];
    return r(this.options.captions) ?? r(this.timeline?.captions) ?? s.label;
  }
  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next() {
    if (!this.timeline) return;
    const t = this.currentTime, e = this.markers.find((s) => s.time > t + 0.5);
    if (this.reducedMotion) {
      this.seek(e ? e.time : this.duration);
      return;
    }
    t >= this.duration - 0.5 || (this.stepping = e !== void 0, this.startPlaying());
  }
  /** Jump back to the previous marker (or the start). */
  prev() {
    if (!this.timeline) return;
    const t = this.currentTime, e = [...this.markers].reverse().find((s) => s.time < t - 0.5);
    this.pause(), this.seek(e ? e.time : 0);
  }
  /** Jump to a marker by id, paused there. */
  goToMarker(t) {
    const e = this.markers.find((s) => s.id === t);
    e && (this.pause(), this.seek(e.time));
  }
  language() {
    return this.container.closest("[lang]")?.getAttribute("lang") || (typeof document < "u" ? document.documentElement.lang : "") || "en";
  }
  showInitialFrame() {
    if (!this.timeline) return;
    const t = this.options.initialFrame ?? "start";
    if (t === "none") return;
    const e = t === "end" ? this.timeline.duration : t === "start" ? 0 : t;
    this.timeline.seek(Math.max(0, Math.min(this.timeline.duration, e))), this.applyState();
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
        this.visibilityObserver?.disconnect(), this.listeners.clear(), this.visibilityObserver = new IntersectionObserver((e) => {
          for (const s of e) this.onScreen = s.isIntersecting;
          this.updateVisibility();
        }), this.visibilityObserver.observe(this.container);
        const t = this.container.getBoundingClientRect?.();
        t && (t.width > 0 || t.height > 0) && (this.onScreen = t.bottom > 0 && t.top < window.innerHeight && t.right > 0 && t.left < window.innerWidth);
      }
      document.addEventListener("visibilitychange", this.onDocumentVisibility);
    }
  }
  updateVisibility() {
    const t = this.onScreen && document.visibilityState !== "hidden";
    !t && this.isPlaying ? (this.pausedByVisibility = !0, this.pause()) : t && (this.pausedByVisibility || this.autoplayWhenSeen) && !this.reducedMotion && (this.pausedByVisibility = !1, this.autoplayWhenSeen = !1, this.startPlaying());
  }
  /** Report the current marker if it changed since the last frame. */
  announceMarker() {
    if (!this.options.onMarker) return;
    const t = this.currentMarker, e = t?.id;
    e !== this.lastMarkerId && (this.lastMarkerId = e, this.options.onMarker(t));
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((e) => {
      const s = e, n = Number(s.getAttribute("data-tinyfly-start") ?? "0") || 0, r = s.getAttribute("data-volume");
      r !== null && (s.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: s, startTime: n, sync: new ri(s) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, e) {
    for (const s of this.mediaTargets)
      Gr(s.sync, s.el, t, e, s.startTime);
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
      const s = this.container.querySelector(e);
      s && (this.targets[t] = s, this.adapter.registerTarget(t, s));
    } else
      this.targets[t] = e, this.adapter.registerTarget(t, e);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((e) => {
      const s = e.closest("[data-tinyfly-symbol]");
      if (s && s !== e) return;
      const n = e.getAttribute("data-tinyfly");
      n && this.registerTarget(n, e);
    }), this.timeline && new Set(this.timeline.tracks.map((s) => s.target)).forEach((s) => {
      if (!this.targets[s]) {
        const n = this.container.querySelector(`[data-tinyfly="${s}"]`) || this.container.querySelector(`.${s}`) || this.container.querySelector(`#${s}`);
        n && this.registerTarget(s, n);
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
    const e = new Map(t.map((s) => [s.id, s]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const n = s.getAttribute("data-tinyfly-symbol");
      if (!n) return;
      const r = e.get(n);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new K();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && o.registerTarget(c, a);
      }), this.symbolInstances.push({ adapter: o, timeline: mt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, e) {
    this.mediaSync = new ri(t, e), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    const t = this.timeline.playbackState === "idle";
    this.timeline.play(), t && this.timeline.currentTime === 0 && this.applyState(), this.playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: this.timeline.direction }, this.mediaSync?.update(this.timeline.currentTime, !0), this.syncAllMedia(this.timeline.currentTime, !0), this.startAnimationLoop(), this.notify();
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
  seek(t) {
    this.timeline && (this.timeline.seek(t), this.applyState(), this.playhead = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: this.timeline.direction }, this.mediaSync?.seek(this.timeline.currentTime), this.syncAllMedia(this.timeline.currentTime, this.isPlaying));
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
    this.isDestroyed = !0, this.stopAnimationLoop(), this.reducedQuery?.removeEventListener?.("change", this.onReducedChange), this.visibilityObserver?.disconnect(), typeof document < "u" && document.removeEventListener("visibilitychange", this.onDocumentVisibility), this.mediaSync?.dispose(), this.mediaSync = void 0;
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
      const s = e - (this.lastTime ?? e);
      this.lastTime = e;
      const n = this.playhead;
      this.timeline.tick(s), this.stopAtMarker(n), this.applyState();
      const r = this.timeline.playbackState === "playing";
      this.mediaSync?.update(this.timeline.currentTime, r), this.syncAllMedia(this.timeline.currentTime, r), this.timeline.playbackState === "playing" ? this.animationFrameId = requestAnimationFrame(t) : (this.animationFrameId = void 0, this.notify());
    };
    this.animationFrameId = requestAnimationFrame(t);
  }
  /**
   * If this frame crossed a marker it should stop at — the next one while
   * stepping, or any marker with `pause` — put the playhead exactly there and pause.
   */
  stopAtMarker(t) {
    const e = this.timeline, s = { time: e.currentTime, iteration: e.loopIteration, direction: e.direction };
    this.playhead = s;
    const n = this.markers;
    if (n.length === 0) return;
    const { crossings: r } = xi(
      n.map((o) => o.time),
      t,
      s,
      { duration: e.duration, alternate: e.config.alternate === !0, holding: e.repeatDelayRemaining > 0 }
    );
    for (const o of r) {
      if (o.kind !== "event") continue;
      const a = n[o.index];
      if (this.stepping || a.pause) {
        this.stepping = !1, e.pause(), e.seek(a.time), this.playhead = { time: a.time, iteration: e.loopIteration, direction: e.direction };
        return;
      }
    }
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
  applyState() {
    if (!this.timeline) return;
    const t = this.timeline.currentTime;
    this.adapter.applyState(this.timeline.getStateAtTime(t)), this.announceMarker(), this.notify();
    for (const e of this.symbolInstances) {
      const s = e.timeline.duration;
      e.adapter.applyState(e.timeline.getStateAtTime(s > 0 ? t % s : t));
    }
  }
}
async function Io(i, t, e = {}) {
  const s = new ve(i, { ...e, autoplay: !0 });
  return await s.load(t), s;
}
function $o(i, t = {}) {
  return new ve(i, t);
}
const Kr = {
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
  stepFormat: "{index} / {total}"
}, oi = "tinyfly-controls-style", Zr = `
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
`;
function Qr(i) {
  if (i.getElementById(oi)) return;
  const t = i.createElement("style");
  t.id = oi, t.textContent = Zr, i.head.appendChild(t);
}
function Jr(i, t, e = {}) {
  const s = t.ownerDocument;
  Qr(s);
  const n = { ...Kr, ...e.labels }, r = e.speeds ?? [0.5, 1, 2], o = () => i.markers.length > 0, a = () => i.markers.some((k) => k.label !== void 0 || i.caption(k.id) !== void 0), c = s.createElement("div");
  c.className = "tf-ctl";
  const l = s.createElement("div");
  l.className = "tf-ctl-bar", l.setAttribute("role", "group");
  const h = (k, P, C, $ = "") => {
    const R = s.createElement("button");
    return R.type = "button", R.className = `tf-ctl-btn ${$}`.trim(), R.setAttribute("aria-label", k), R.title = k, R.textContent = P, R.addEventListener("click", C), R;
  }, f = h(n.restart, "⟲", () => {
    i.pause(), i.seek(0);
  }), u = h(n.prev, "◀", () => i.prev()), d = h(n.play, "▶", () => i.isPlaying ? i.pause() : p(), "tf-ctl-primary"), m = h(n.next, "▶|", () => i.next()), p = () => {
    i.currentTime >= i.duration - 0.5 && i.seek(0), i.play();
  }, g = s.createElement("input");
  g.type = "range", g.className = "tf-ctl-scrub", g.min = "0", g.max = "1000", g.step = "1", g.setAttribute("aria-label", n.scrub), g.addEventListener("input", () => {
    i.pause(), i.seek(Number(g.value) / 1e3 * i.duration);
  });
  const y = s.createElement("span");
  y.className = "tf-ctl-step";
  const b = s.createElement("select");
  b.className = "tf-ctl-speed", b.setAttribute("aria-label", n.speed);
  for (const k of r) {
    const P = s.createElement("option");
    P.value = String(k), P.textContent = `${k}×`, k === 1 && (P.selected = !0), b.appendChild(P);
  }
  b.addEventListener("change", () => i.setSpeed(Number(b.value))), l.append(f, u, d, m, g, y), r.length > 0 && l.append(b), c.append(l);
  const v = s.createElement("p");
  v.className = "tf-ctl-caption", v.setAttribute("aria-live", "polite"), e.captions !== !1 && c.append(v);
  const T = s.createElement("div");
  T.className = "tf-ctl-question", T.hidden = !0;
  const w = s.createElement("span"), x = h(n.reveal, n.reveal, () => i.play(), "tf-ctl-primary");
  T.append(w, x), c.append(T);
  const S = e.mount;
  S ? S.appendChild(c) : t.insertAdjacentElement("afterend", c);
  const _ = () => {
    const k = i.isPlaying;
    d.textContent = k ? "❚❚" : "▶", d.setAttribute("aria-label", k ? n.pause : n.play), d.title = k ? n.pause : n.play;
    const P = i.duration;
    s.activeElement !== g && (g.value = String(P > 0 ? Math.round(i.currentTime / P * 1e3) : 0));
    const C = i.markers;
    if (u.hidden = m.hidden = y.hidden = C.length === 0, C.length > 0) {
      const $ = i.currentMarker, R = $ ? C.indexOf($) + 1 : 0;
      y.textContent = n.stepFormat.replace("{index}", String(R)).replace("{total}", String(C.length)), y.setAttribute("aria-label", `${n.step} ${R} ${n.of} ${C.length}`), u.disabled = i.currentTime <= 0.5, m.disabled = i.currentTime >= P - 0.5;
      const j = i.caption() ?? "";
      v.textContent !== j && (v.textContent = j), v.hidden = !a();
      const H = !k && $?.question !== void 0 && Math.abs(i.currentTime - $.time) < 1;
      T.hidden = !H, H && w.textContent !== $.question && (w.textContent = $.question);
    } else
      T.hidden = !0, v.hidden = !0;
  }, L = i.subscribe(_);
  _();
  const A = e.keyboardScope ?? t;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const M = /* @__PURE__ */ new WeakSet(), E = (k) => {
    if (M.has(k) || (M.add(k), k.defaultPrevented || k.altKey || k.ctrlKey || k.metaKey)) return;
    const P = k.target;
    if (!(P.tagName === "INPUT" || P.tagName === "SELECT") && !(k.key === " " && P.tagName === "BUTTON"))
      switch (k.key) {
        case " ":
          k.preventDefault(), i.isPlaying ? i.pause() : p();
          break;
        case "ArrowRight":
          if (!o()) return;
          k.preventDefault(), i.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          k.preventDefault(), i.prev();
          break;
        case "Home":
          k.preventDefault(), i.pause(), i.seek(0);
          break;
      }
  };
  return A.addEventListener("keydown", E), c.addEventListener("keydown", E), {
    element: c,
    destroy() {
      L(), A.removeEventListener("keydown", E), c.removeEventListener("keydown", E), c.remove();
    }
  };
}
const Lt = /* @__PURE__ */ new WeakMap();
let to = 0;
function Mt(i, t, e) {
  if (i)
    try {
      return JSON.parse(i);
    } catch (s) {
      console.warn(`tinyfly: invalid ${t} JSON on`, e, s);
      return;
    }
}
async function eo(i, t = {}) {
  const e = Lt.get(i);
  if (e) return e;
  const s = i.querySelector("script[data-tinyfly-timeline]"), n = i.getAttribute("data-src");
  let r = s ? Mt(s.textContent, "timeline", i) : void 0;
  const o = io(i.getAttribute("data-markers"));
  if (!r && n && o) {
    const f = await fetch(n);
    f.ok && (r = await f.json());
  }
  if (r && o && !r.config.markers?.length && (r.config = { ...r.config, markers: o.map((f, u) => ({ id: `step-${u + 1}`, time: f })) }), !r && !n) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', i);
    return;
  }
  const a = Mt(i.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", i), c = {
    playWhenVisible: !0,
    ...t.player,
    ...a && { captions: a },
    ...Mt(i.getAttribute("data-options"), "data-options", i)
  };
  no(i);
  const l = new ve(i, c), h = { element: i, player: l };
  if (Lt.set(i, h), i.setAttribute("data-tinyfly-mounted", ""), await l.load(r ?? n), i.getAttribute("data-controls") !== "false") {
    const f = Mt(i.getAttribute("data-labels"), "data-labels", i), u = i.querySelector("figcaption");
    h.controls = Jr(l, i, {
      ...t.controls,
      labels: { ...t.controls?.labels, ...f },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), u ? i.insertBefore(h.controls.element, u) : i.appendChild(h.controls.element);
  }
  return h;
}
function io(i) {
  if (!i) return;
  const t = i.split(/[\s,]+/).filter(Boolean).map(Number).filter((e) => Number.isFinite(e) && e >= 0).sort((e, s) => e - s);
  return t.length > 0 ? t : void 0;
}
async function so(i = document, t = {}) {
  const e = Array.from(i.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(e.map((n) => eo(n, t)))).filter((n) => n !== void 0);
}
function Fo(i) {
  const t = Lt.get(i);
  t && (t.controls?.destroy(), t.player.destroy(), Lt.delete(i), i.removeAttribute("data-tinyfly-mounted"));
}
function no(i) {
  const t = i.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const e = i.getAttribute("data-alt"), s = i.querySelector("figcaption");
  t.setAttribute("role", "img"), e ? t.setAttribute("aria-label", e) : s && (s.id ||= `tinyfly-caption-${++to}`, t.setAttribute("aria-labelledby", s.id));
}
function ro() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    so();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class oo {
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
      const s = document.querySelector(t);
      if (!s) throw new Error(`Container not found: ${t}`);
      this.container = s;
    } else
      this.container = t;
    this.options = e, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new K(), this.adapterB = new K();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let e;
    if (typeof t == "string") {
      const s = await fetch(t);
      if (!s.ok)
        throw new Error(`Failed to load sequence: ${s.statusText}`);
      e = await s.json();
    } else
      e = t;
    this.sequence = e, this.symbolDefs.clear();
    for (const s of e.symbols ?? [])
      s.timeline?.tracks?.length && this.symbolDefs.set(s.id, s.timeline);
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
    const s = this.sequence.scenes[t];
    if (this.renderScene(s, this.containerA, this.adapterA), this.timelineA = this.createTimeline(s), this.options.onSceneChange?.(t), e)
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
  renderScene(t, e, s) {
    e.innerHTML = "", s.clearTargets();
    const n = document.createElement("div");
    n.style.cssText = "position:absolute;inset:0;transform-origin:center center", n.setAttribute("data-tinyfly", "Camera"), e.appendChild(n), s.registerTarget("Camera", n);
    for (const r of t.elements) {
      if (!r.html) continue;
      const o = document.createElement("div");
      o.innerHTML = r.html.trim();
      const a = o.firstElementChild;
      if (a) {
        n.appendChild(a);
        const c = a.getAttribute("data-tinyfly");
        c && s.registerTarget(c, a);
      }
    }
    this.setupNested(n, s);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(t, e) {
    const s = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((n) => {
      const r = n.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const a = new K();
      n.querySelectorAll("[data-tinyfly]").forEach((c) => {
        const l = c.getAttribute("data-tinyfly");
        l && a.registerTarget(l, c);
      }), s.push({ adapter: a, timeline: mt(o) });
    }), s.length ? this.nestedByAdapter.set(e, s) : this.nestedByAdapter.delete(e);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, e) {
    const s = this.nestedByAdapter.get(t);
    if (s)
      for (const n of s) {
        const r = n.timeline.duration;
        n.adapter.applyState(n.timeline.getStateAtTime(r > 0 ? e % r : e));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? mt(t.timeline) : null;
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
    const e = this.sequence.scenes[t], s = e.transition;
    if (s.type === "none" || s.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(e, this.containerB, this.adapterB), this.timelineB = this.createTimeline(e), this.timelineB && this.timelineB.play(), this.applyTransition(s.type, s.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, s.duration);
  }
  applyTransition(t, e) {
    const s = `${e}ms`, n = "ease-in-out";
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${s} ${n}, transform ${s} ${n}`, this.containerB.style.transition = `opacity ${s} ${n}, transform ${s} ${n}`, t) {
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
    const s = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = s, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
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
      const s = e - (this.lastTime ?? e);
      if (this.lastTime = e, this.timelineA && this.timelineA.playbackState === "playing") {
        this.timelineA.tick(s);
        const n = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(n), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(s);
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
async function Lo(i, t, e = {}) {
  const s = new oo(i, { ...e, autoplay: !0 });
  return await s.load(t), s;
}
const Do = { type: "none", duration: 0 };
function Oo(i) {
  const { timeline: t } = i, e = new K();
  for (const [l, h] of Object.entries(i.targets)) {
    const f = typeof h == "string" ? document.querySelector(h) : h;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${l}" (${String(h)})`);
    e.registerTarget(l, f);
  }
  t.onUpdate = (l) => {
    e.applyState(l), i.onUpdate?.(l);
  }, i.onComplete && (t.onComplete = i.onComplete);
  let s = null, n = null, r = !1;
  const o = (l) => {
    if (r) return;
    const h = n === null ? 0 : l - n;
    n = l, h > 0 && t.tick(h), s = requestAnimationFrame(o);
  }, a = () => {
    s !== null || r || (n = null, s = requestAnimationFrame(o));
  }, c = () => {
    s !== null && cancelAnimationFrame(s), s = null, n = null;
  };
  return e.applyState(t.getStateAtTime(t.currentTime)), i.autoplay !== !1 && (t.play(), a()), {
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
const Bo = {
  timeline: Cn,
  to(i, t, e) {
    const s = new st(e);
    return s.to(i, t), s;
  },
  from(i, t, e) {
    const s = new st(e);
    return s.from(i, t), s;
  },
  fromTo(i, t, e, s) {
    const n = new st(s);
    return n.fromTo(i, t, e), n;
  },
  set(i, t, e) {
    const s = new st(e);
    return s.set(i, t), s;
  }
}, No = B.to, qo = B.from, Xo = B.fromTo, Yo = B.set, Vo = B.timeline, Wo = B.ticker, jo = B.splitText, Uo = B.context, zo = B.matchMedia, Ho = B.quickTo, Go = B.imageSequence, Ko = B.pageTransition;
ro();
export {
  lo as Clock,
  st as CompatTimeline,
  Or as CustomBounce,
  Dr as CustomEase,
  Br as CustomWiggle,
  mi as DEFAULT_BAKE_INTERVAL_MS,
  we as DEFAULT_INERTIA_FRICTION,
  Kr as DEFAULT_LABELS,
  N as DEFAULT_SPRING,
  Do as DEFAULT_TRANSITION,
  Di as Draggable,
  _t as FORMAT_VERSION,
  Ji as INERTIA_MAX_DURATION_MS,
  Vs as InertiaTrackPlayer,
  V as LiveTimeline,
  yo as MORPH_SAMPLES,
  co as ManualClock,
  ri as MediaSync,
  Zn as Observer,
  hi as SPRING_MAX_DURATION_MS,
  Yt as SPRING_PRESETS,
  dt as SPRING_STEP_MS,
  vr as ScrollAnimator,
  qt as ScrollDriver,
  wr as ScrollMarkers,
  pr as ScrollPin,
  Qe as SmoothScroll,
  Ot as SpringSampler,
  Ys as SpringTrackPlayer,
  Vn as Stage,
  Ti as Timeline,
  ve as TinyflyPlayer,
  oo as TinyflySequencer,
  zt as TrackPlayer,
  Po as ValueResolver,
  dr as VisibilityDriver,
  us as backOut,
  vi as bakeEasing,
  yi as bakeInertiaTrack,
  gi as bakeSpringTrack,
  hs as bounceOut,
  js as charactersFor,
  qi as clamp01,
  bo as clearMorphCache,
  mo as clearPathCache,
  Ge as containerProgressAt,
  Uo as context,
  $o as create,
  Jr as createControls,
  cs as createCubicBezier,
  Wr as createLive,
  Qs as createRandom,
  oe as createTrack,
  fo as criticalDamping,
  nn as customBounce,
  sn as customEase,
  rn as customWiggle,
  mt as deserializeTimeline,
  Ks as deserializeTrack,
  Eo as draggable,
  ns as easeIn,
  ui as easeInCubic,
  os as easeInOut,
  Nt as easeInOutCubic,
  ss as easeInOutQuad,
  es as easeInQuad,
  rs as easeOut,
  fi as easeOutCubic,
  is as easeOutQuad,
  ls as elasticOut,
  qs as expandParametricEasings,
  qo as from,
  ko as fromJSON,
  Xo as fromTo,
  W as getEasingFunction,
  Rt as getInterpolator,
  wi as getMotionPathPoint,
  go as getPathLength,
  xs as getPointAtProgress,
  Jn as gridLinesFor,
  Gi as hasKeyframes,
  So as hashSeed,
  Go as imageSequence,
  bt as inertiaDuration,
  yt as inertiaRest,
  se as inertiaValueAt,
  po as inertiaVelocityAt,
  Bs as interpolateArray,
  Os as interpolateColor,
  To as interpolateMotionPath,
  Y as interpolateNumber,
  Ns as interpolatePathString,
  Fe as interpolateString,
  Hi as isCubicBezierEasing,
  Z as isInertiaTrack,
  ao as isMotionPathPoint,
  ai as isMotionPathTrack,
  Et as isParametricEasing,
  vt as isPathData,
  Q as isSpringTrack,
  fe as isTextTrack,
  uo as isUnderdamped,
  Ao as isUnresolved,
  ne as linear,
  B as live,
  It as mapEase,
  zo as matchMedia,
  li as maxStaggerDistance,
  Fs as morphPath,
  eo as mount,
  so as mountAll,
  Ct as naturalRest,
  Ko as pageTransition,
  ds as parametricEasing,
  He as parseEdge,
  nt as parsePath,
  Ni as parseTrigger,
  Io as play,
  Lo as playSequence,
  Co as playWhenVisible,
  xi as playheadCrossings,
  di as pointAtDistance,
  cn as pointsToPath,
  Oo as quickPlay,
  Ho as quickTo,
  Si as randomBetween,
  Mo as randomChoice,
  Js as randomSnapped,
  tn as resolveSequence,
  Pi as resolveValue,
  _o as scrollProgress,
  Ro as scrubOnScroll,
  Zs as serializeTimeline,
  Gs as serializeTrack,
  Yo as set,
  pe as shapeToPathData,
  Xs as simplifyKeyframes,
  fr as smoothToward,
  Qn as snapAxis,
  gr as snapConfig,
  br as snapDuration,
  yr as snapProgress,
  jo as splitText,
  Ki as springDuration,
  ho as springValueAt,
  ci as staggerDistance,
  de as staggerOffset,
  ie as staggerOffsets,
  Dt as staggerSpan,
  fs as stepsEasing,
  Gr as syncMediaElement,
  zs as textAt,
  Bo as tf,
  Wo as ticker,
  Vo as timeline,
  No as to,
  xo as toJSON,
  vo as toKeyframedTrack,
  wo as toKeyframedTracks,
  G as trackTargets,
  gt as triggerDistance,
  Fo as unmount
};
