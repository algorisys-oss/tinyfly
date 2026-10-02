function Yi(e) {
  return typeof e == "object" && e !== null && e.type === "cubic-bezier";
}
function Ot(e) {
  return typeof e == "object" && e !== null && e.type !== "cubic-bezier";
}
const Nt = 1;
function _e(e) {
  return e.property === "text" && "textConfig" in e;
}
function et(e) {
  return e.kind === "inertia" && "inertia" in e;
}
function nt(e) {
  return e.kind === "spring" && "spring" in e;
}
function $n(e) {
  return e.property === "motionPath" && "motionPathConfig" in e;
}
function Ha(e) {
  return typeof e == "object" && e !== null && "x" in e && "y" in e && "angle" in e;
}
function qi(e) {
  return "keyframes" in e;
}
class Ua {
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
class za {
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
function Dn(e, t, n = "start") {
  if (t <= 1) return 0;
  if (typeof n == "number") {
    const i = Math.max(0, Math.min(t - 1, n));
    return Math.abs(e - i);
  }
  switch (n) {
    case "end":
      return t - 1 - e;
    case "center":
      return Math.abs(e - (t - 1) / 2);
    case "edges":
      return (t - 1) / 2 - Math.abs(e - (t - 1) / 2);
    default:
      return e;
  }
}
function Bn(e, t = "start") {
  if (e <= 1) return 0;
  let n = 0;
  for (let i = 0; i < e; i++)
    n = Math.max(n, Dn(i, e, t));
  return n;
}
function Ce(e, t, n) {
  if (n.offsets) return n.offsets[e] ?? 0;
  const i = n.from ?? "start", s = Dn(e, t, i);
  if (n.amount !== void 0) {
    const r = Bn(t, i);
    return r === 0 ? 0 : n.amount * s / r;
  }
  return n.each !== void 0 ? n.each * s : 0;
}
function de(e, t) {
  return Array.from({ length: e }, (n, i) => Ce(i, e, t));
}
function zt(e, t) {
  return e <= 1 ? 0 : Math.max(...de(e, t));
}
const bt = 1, On = 6e4, Ct = On / bt, W = {
  stiffness: 180,
  damping: 12,
  mass: 1,
  velocity: 0,
  restDelta: 0.01,
  restSpeed: 0.1
}, Jt = {
  gentle: { stiffness: 120, damping: 18, mass: 1 },
  default: { stiffness: 180, damping: 12, mass: 1 },
  snappy: { stiffness: 280, damping: 20, mass: 1 },
  bouncy: { stiffness: 220, damping: 8, mass: 1 },
  wobbly: { stiffness: 180, damping: 5, mass: 1 },
  stiff: { stiffness: 400, damping: 30, mass: 1 }
};
class jt {
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
    this.from = t.from, this.to = t.to, this.stiffness = t.stiffness ?? W.stiffness, this.damping = t.damping ?? W.damping, this.mass = t.mass ?? W.mass, this.restDelta = t.restDelta ?? W.restDelta, this.restSpeed = t.restSpeed ?? W.restSpeed, this.distance = Math.abs(this.to - this.from) || 1, this.samples = [this.from], this.velocity = t.velocity ?? W.velocity, this.isAtRest(this.from) && (this.settledStep = 0);
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
    const n = Math.floor(t / bt);
    if (this.simulateTo(n + 1), this.settledStep !== null && n >= this.settledStep)
      return this.to;
    const i = this.samples[Math.min(n, this.samples.length - 1)], s = this.samples[Math.min(n + 1, this.samples.length - 1)], r = t / bt - n;
    return i + (s - i) * r;
  }
  /**
   * How long the spring takes to settle, in milliseconds — the natural duration
   * of a spring track. Runs the simulation to completion once.
   */
  settleTime() {
    return this.simulateTo(Ct + 1), this.settledStep !== null ? this.settledStep * bt : On;
  }
  /** Advance the cached simulation until it holds at least `steps` samples. */
  simulateTo(t) {
    if (this.settledStep !== null) return;
    const n = Math.min(t, Ct + 1), i = bt / 1e3;
    for (; this.samples.length < n; ) {
      const s = this.samples[this.samples.length - 1], r = s - this.to, o = -this.stiffness * r, l = -this.damping * this.velocity, a = (o + l) / this.mass;
      this.velocity += a * i;
      const c = s + this.velocity * i;
      if (this.samples.push(c), this.isAtRest(c)) {
        this.settledStep = this.samples.length - 1;
        return;
      }
    }
    this.samples.length > Ct && (this.settledStep = Ct);
  }
}
function ja(e, t) {
  return new jt(e).valueAt(t);
}
function Xi(e) {
  return new jt(e).settleTime();
}
function Ga(e) {
  const t = e.stiffness ?? W.stiffness, n = e.damping ?? W.damping, i = e.mass ?? W.mass;
  return n < 2 * Math.sqrt(t * i);
}
function Ka(e) {
  const t = e.stiffness ?? W.stiffness, n = e.mass ?? W.mass;
  return 2 * Math.sqrt(t * n);
}
const Oe = 4, Wi = 2e-3, Vi = 1e-4, Hi = 6e4;
function Gt(e) {
  const t = e.friction ?? Oe;
  return t > 0 ? t : Oe;
}
function Yt(e) {
  return e.from + e.velocity / Gt(e);
}
function Ui(e, t) {
  if (t === void 0) return e;
  if (typeof t == "number")
    return t > 0 ? Math.round(e / t) * t : e;
  if (t.length === 0) return e;
  let n = t[0];
  for (const i of t)
    Math.abs(i - e) < Math.abs(n - e) && (n = i);
  return n;
}
function At(e) {
  let t = Ui(Yt(e), e.end);
  return e.min !== void 0 && (t = Math.max(e.min, t)), e.max !== void 0 && (t = Math.min(e.max, t)), t;
}
function Et(e) {
  const t = Math.abs(At(e) - e.from);
  if (t === 0) return 0;
  const n = e.restDelta ?? Math.max(Vi, t * Wi);
  if (n >= t) return 0;
  const i = Math.log(t / n) / Gt(e);
  return Math.min(Hi, i * 1e3);
}
function pe(e, t) {
  if (t <= 0) return e.from;
  const n = At(e);
  if (t >= Et(e)) return n;
  const i = Gt(e);
  return e.from + (n - e.from) * (1 - Math.exp(-i * t / 1e3));
}
function Za(e, t) {
  const n = Gt(e), i = At(e);
  return t >= Et(e) ? 0 : (i - e.from) * n * Math.exp(-n * Math.max(0, t) / 1e3);
}
const me = (e) => e, zi = (e) => e * e, ji = (e) => 1 - (1 - e) * (1 - e), Gi = (e) => e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2, Nn = (e) => e * e * e, Yn = (e) => 1 - Math.pow(1 - e, 3), Kt = (e) => e < 0.5 ? 4 * e * e * e : 1 - Math.pow(-2 * e + 2, 3) / 2, Ki = Nn, Zi = Yn, Qi = Kt, Ji = {
  linear: me,
  "ease-in": Ki,
  "ease-out": Zi,
  "ease-in-out": Qi,
  "ease-in-quad": zi,
  "ease-out-quad": ji,
  "ease-in-out-quad": Gi,
  "ease-in-cubic": Nn,
  "ease-out-cubic": Yn,
  "ease-in-out-cubic": Kt
};
function ts(e) {
  const [t, n, i, s] = e, r = 3 * t, o = 3 * (i - t) - r, l = 1 - r - o, a = 3 * n, c = 3 * (s - n) - a, h = 1 - a - c, f = (p) => ((l * p + o) * p + r) * p, u = (p) => ((h * p + c) * p + a) * p, d = (p) => (3 * l * p + 2 * o) * p + r, m = (p) => {
    let g = p;
    for (let w = 0; w < 8; w++) {
      const T = f(g) - p;
      if (Math.abs(T) < 1e-7)
        return g;
      const v = d(g);
      if (Math.abs(v) < 1e-7)
        break;
      g -= T / v;
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
function te(e, t = "out") {
  if (t === "out") return e;
  const n = (i) => 1 - e(1 - i);
  return t === "in" ? n : (i) => i < 0.5 ? n(i * 2) / 2 : e(i * 2 - 1) / 2 + 0.5;
}
function es(e = 1, t = 0.3) {
  const n = Math.max(1, e), i = t / (2 * Math.PI) * Math.asin(1 / n);
  return (s) => s <= 0 ? 0 : s >= 1 ? 1 : n * Math.pow(2, -10 * s) * Math.sin((s - i) * (2 * Math.PI) / t) + 1;
}
const ns = (e) => {
  if (e <= 0) return 0;
  if (e >= 1) return 1;
  if (e < 1 / 2.75) return 7.5625 * e * e;
  if (e < 2 / 2.75) {
    const s = e - 0.5454545454545454;
    return 7.5625 * s * s + 0.75;
  }
  if (e < 2.5 / 2.75) {
    const s = e - 0.8181818181818182;
    return 7.5625 * s * s + 0.9375;
  }
  const i = e - 2.625 / 2.75;
  return 7.5625 * i * i + 0.984375;
};
function is(e = 1.70158) {
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const n = t - 1;
    return n * n * ((e + 1) * n + e) + 1;
  };
}
function ss(e, t = "end") {
  const n = Math.max(1, Math.floor(e));
  return (i) => {
    if (i >= 1) return 1;
    if (i <= 0) return t === "start" || t === "both" ? t === "start" ? 1 / n : 1 / (n + 1) : 0;
    const s = Math.floor(i * n);
    switch (t) {
      case "start":
        return Math.min(1, (s + 1) / n);
      case "both":
        return (s + 1) / (n + 1);
      case "none":
        return n === 1 ? 0 : Math.min(1, s / (n - 1));
      default:
        return s / n;
    }
  };
}
function rs(e) {
  switch (e.type) {
    case "steps":
      return ss(e.count, e.position);
    case "elastic":
      return te(es(e.amplitude, e.period), e.mode);
    case "bounce":
      return te(ns, e.mode);
    case "back":
      return te(is(e.overshoot), e.mode);
  }
}
function G(e) {
  return e === void 0 ? me : Yi(e) ? ts(e.points) : Ot(e) ? rs(e) : Ji[e] ?? me;
}
const Ne = 32, os = 256, st = /* @__PURE__ */ new Map(), as = /[MmLlHhVvCcSsQqTtAaZz]/, ls = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/, cs = {
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
function hs(e) {
  const t = [];
  let n = 0, i = null;
  const s = () => {
    for (; n < e.length && /[\s,]/.test(e[n]); ) n++;
  };
  for (; n < e.length && (s(), !(n >= e.length)); ) {
    const r = e[n];
    if (as.test(r)) {
      i = { type: r, args: [] }, t.push(i), n++;
      continue;
    }
    if (!i) break;
    const o = i.type === "A" || i.type === "a", l = i.args.length % 7;
    if (o && (l === 3 || l === 4)) {
      if (r !== "0" && r !== "1") break;
      i.args.push(r === "1" ? 1 : 0), n++;
      continue;
    }
    const a = ls.exec(e.slice(n));
    if (!a) break;
    i.args.push(parseFloat(a[0])), n += a[0].length;
  }
  return t;
}
function us(e, t, n, i, s, r, o, l, a) {
  if (e === l && t === a) return [];
  let c = Math.abs(n), h = Math.abs(i);
  if (c === 0 || h === 0) return [[e, t, l, a, l, a]];
  const f = s * Math.PI / 180, u = Math.cos(f), d = Math.sin(f), m = (e - l) / 2, p = (t - a) / 2, g = u * m + d * p, y = -d * m + u * p, b = g * g / (c * c) + y * y / (h * h);
  if (b > 1) {
    const L = Math.sqrt(b);
    c *= L, h *= L;
  }
  const w = r === o ? -1 : 1, T = c * c * h * h - c * c * y * y - h * h * g * g, v = c * c * y * y + h * h * g * g, x = w * Math.sqrt(Math.max(0, T / v)), S = x * c * y / h, C = -x * h * g / c, R = u * S - d * C + (e + l) / 2, _ = d * S + u * C + (t + a) / 2, k = (L, $, Y, it) => {
    const Qt = L * Y + $ * it, _t = Math.sqrt((L * L + $ * $) * (Y * Y + it * it)), ft = Math.acos(Math.max(-1, Math.min(1, Qt / _t)));
    return L * it - $ * Y < 0 ? -ft : ft;
  }, A = k(1, 0, (g - S) / c, (y - C) / h);
  let E = k((g - S) / c, (y - C) / h, (-g - S) / c, (-y - C) / h);
  !o && E > 0 && (E -= 2 * Math.PI), o && E < 0 && (E += 2 * Math.PI);
  const P = Math.max(1, Math.ceil(Math.abs(E) / (Math.PI / 2))), M = E / P, I = 4 / 3 * Math.tan(M / 4), F = (L) => {
    const $ = c * Math.cos(L), Y = h * Math.sin(L);
    return [u * $ - d * Y + R, d * $ + u * Y + _];
  }, N = (L) => {
    const $ = -c * Math.sin(L), Y = h * Math.cos(L);
    return [u * $ - d * Y, d * $ + u * Y];
  }, O = [];
  for (let L = 0; L < P; L++) {
    const $ = A + L * M, Y = $ + M, [it, Qt] = F($), [_t, ft] = L === P - 1 ? [l, a] : F(Y), [Di, Bi] = N($), [Oi, Ni] = N(Y);
    O.push([it + I * Di, Qt + I * Bi, _t - I * Oi, ft - I * Ni, _t, ft]);
  }
  return O;
}
function Q(e, t, n, i, s) {
  const r = 1 - s;
  return r * r * r * e + 3 * r * r * s * t + 3 * r * s * s * n + s * s * s * i;
}
function Ye(e, t, n, i, s) {
  const r = 1 - s;
  return 3 * r * r * (t - e) + 6 * r * s * (n - t) + 3 * s * s * (i - n);
}
function dt(e, t, n, i) {
  return {
    subpath: 0,
    type: "L",
    points: [n, i],
    startX: e,
    startY: t,
    endX: n,
    endY: i,
    length: Math.hypot(n - e, i - t)
  };
}
function It(e, t, n) {
  const [i, s, r, o, l, a] = n, c = [0];
  let h = e, f = t, u = 0;
  for (let d = 1; d <= Ne; d++) {
    const m = d / Ne, p = Q(e, i, r, l, m), g = Q(t, s, o, a, m);
    u += Math.hypot(p - h, g - f), c.push(u), h = p, f = g;
  }
  return {
    subpath: 0,
    type: "C",
    points: [i, s, r, o, l, a],
    startX: e,
    startY: t,
    endX: l,
    endY: a,
    length: u,
    lengths: c
  };
}
function lt(e) {
  const t = st.get(e);
  if (t) return t;
  const n = [];
  let i = 0, s = 0, r = 0, o = 0, l = null, a = null, c = -1;
  const h = /* @__PURE__ */ new Set(), f = (p) => {
    c < 0 && (c = 0), p.subpath = c, n.push(p);
  };
  for (const { type: p, args: g } of hs(e)) {
    const y = p.toUpperCase(), b = p !== y, w = cs[y];
    if (y === "Z") {
      (i !== r || s !== o) && f(dt(i, s, r, o)), c >= 0 && h.add(c), i = r, s = o, l = a = null;
      continue;
    }
    for (let T = 0; T + w <= g.length; T += w) {
      const v = g.slice(T, T + w), x = b ? i : 0, S = b ? s : 0;
      let C = null, R = null;
      switch (y) {
        case "M":
          T === 0 ? (i = v[0] + x, s = v[1] + S, r = i, o = s, (c < 0 || n[n.length - 1]?.subpath === c) && c++) : (f(dt(i, s, v[0] + x, v[1] + S)), i = v[0] + x, s = v[1] + S);
          break;
        case "L":
          f(dt(i, s, v[0] + x, v[1] + S)), i = v[0] + x, s = v[1] + S;
          break;
        case "H":
          f(dt(i, s, v[0] + x, s)), i = v[0] + x;
          break;
        case "V":
          f(dt(i, s, i, v[0] + S)), s = v[0] + S;
          break;
        case "C": {
          const _ = [v[0] + x, v[1] + S, v[2] + x, v[3] + S, v[4] + x, v[5] + S];
          f(It(i, s, _)), C = [_[2], _[3]], i = _[4], s = _[5];
          break;
        }
        case "S": {
          const [_, k] = l ? [2 * i - l[0], 2 * s - l[1]] : [i, s], A = [_, k, v[0] + x, v[1] + S, v[2] + x, v[3] + S];
          f(It(i, s, A)), C = [A[2], A[3]], i = A[4], s = A[5];
          break;
        }
        case "Q":
        case "T": {
          let _ = i, k = s;
          y === "Q" ? (_ = v[0] + x, k = v[1] + S) : a && (_ = 2 * i - a[0], k = 2 * s - a[1]);
          const A = y === "Q" ? v[2] + x : v[0] + x, E = y === "Q" ? v[3] + S : v[1] + S;
          f(
            It(i, s, [
              i + 2 / 3 * (_ - i),
              s + 2 / 3 * (k - s),
              A + 2 / 3 * (_ - A),
              E + 2 / 3 * (k - E),
              A,
              E
            ])
          ), R = [_, k], i = A, s = E;
          break;
        }
        case "A": {
          const _ = v[5] + x, k = v[6] + S;
          let A = i, E = s;
          for (const P of us(i, s, v[0], v[1], v[2], v[3], v[4], _, k))
            f(It(A, E, P)), A = P[4], E = P[5];
          i = _, s = k;
          break;
        }
      }
      l = C, a = R;
    }
  }
  const u = n.reduce((p, g) => p + g.length, 0), d = [];
  for (let p = 0; p < n.length; ) {
    const g = n[p].subpath;
    let y = p, b = 0;
    for (; y < n.length && n[y].subpath === g; ) b += n[y++].length;
    const w = n[p], T = n[y - 1], v = h.has(g) || Math.abs(T.endX - w.startX) < 1e-9 && Math.abs(T.endY - w.startY) < 1e-9;
    d.push({ start: p, end: y, length: b, closed: v }), p = y;
  }
  const m = { segments: n, totalLength: u, subpaths: d };
  return st.size >= os && st.delete(st.keys().next().value), st.set(e, m), m;
}
function fs(e, t) {
  const n = e.lengths;
  if (t <= 0) return 0;
  if (t >= e.length) return 1;
  let i = 0, s = n.length - 1;
  for (; i < s - 1; ) {
    const l = i + s >> 1;
    n[l] < t ? i = l : s = l;
  }
  const r = n[s] - n[i], o = r > 0 ? (t - n[i]) / r : 0;
  return (i + o) / (n.length - 1);
}
function ds(e, t) {
  if (e.type === "L") {
    const f = e.length > 0 ? Math.max(0, Math.min(1, t / e.length)) : 0;
    return {
      x: e.startX + (e.endX - e.startX) * f,
      y: e.startY + (e.endY - e.startY) * f,
      angle: Math.atan2(e.endY - e.startY, e.endX - e.startX) * 180 / Math.PI
    };
  }
  const [n, i, s, r, o, l] = e.points, a = fs(e, t);
  let c = Ye(e.startX, n, s, o, a), h = Ye(e.startY, i, r, l, a);
  if (Math.hypot(c, h) < 1e-9) {
    const f = a < 0.5 ? Math.min(1, a + 1e-3) : Math.max(0, a - 1e-3), u = Q(e.startX, n, s, o, f), d = Q(e.startY, i, r, l, f), m = Q(e.startX, n, s, o, a), p = Q(e.startY, i, r, l, a);
    c = a < 0.5 ? u - m : m - u, h = a < 0.5 ? d - p : p - d;
  }
  return {
    x: Q(e.startX, n, s, o, a),
    y: Q(e.startY, i, r, l, a),
    angle: Math.atan2(h, c) * 180 / Math.PI
  };
}
function qn(e, t, n = 0, i = e.length) {
  if (i <= n) return { x: 0, y: 0, angle: 0 };
  let s = 0;
  for (let r = n; r < i; r++) {
    const o = e[r];
    if (s + o.length >= t || r === i - 1)
      return ds(o, t - s);
    s += o.length;
  }
  return { x: 0, y: 0, angle: 0 };
}
function ps(e, t) {
  const { segments: n, totalLength: i } = lt(e);
  return qn(n, Math.max(0, Math.min(1, t)) * i);
}
function Qa() {
  st.clear();
}
function Ja(e) {
  return lt(e).totalLength;
}
const ms = 24, gs = 320, ys = 2.5, pt = 72, tl = 64, bs = 0.2, ws = 128, wt = /* @__PURE__ */ new Map();
let Dt = 0, K;
const qe = (e) => Math.round(e * 100) / 100;
function Xe(e, t) {
  const { segments: n, subpaths: i, totalLength: s } = lt(e);
  if (n.length === 0) return [];
  if (t) {
    const r = i.every((o) => o.closed);
    return [{ segments: n, start: 0, end: n.length, length: s, closed: r }];
  }
  return i.filter((r) => r.length > 0).map((r) => ({ segments: n, start: r.start, end: r.end, length: r.length, closed: r.closed }));
}
function ge(e, t) {
  const n = e.closed ? (t % 1 + 1) % 1 : Math.max(0, Math.min(1, t)), i = qn(e.segments, n * e.length, e.start, e.end);
  return [i.x, i.y];
}
function We(e) {
  const t = [];
  let n = 0;
  for (let i = e.start; i < e.end; i++)
    n += e.segments[i].length, e.length > 0 && t.push(n / e.length);
  return t;
}
function Ve(e, t) {
  const n = [];
  for (let i = 0; i < t; i++)
    n.push(ge(e, e.closed ? i / t : i / (t - 1)));
  return n;
}
function He(e) {
  let t = 0, n = 0;
  for (const [i, s] of e)
    t += i, n += s;
  return t /= e.length, n /= e.length, e.map(([i, s]) => [i - t, s - n]);
}
function vs(e, t, n) {
  const i = e.closed && t.closed;
  if (n !== void 0)
    return { offset: i ? Math.abs(n) % pt / pt : 0, reversed: n < 0 };
  const s = He(Ve(e, pt)), r = He(Ve(t, pt)), o = pt;
  let l = { offset: 0, reversed: !1 }, a = 1 / 0;
  for (const c of [!1, !0]) {
    const h = i ? o : 1;
    for (let f = 0; f < h; f++) {
      let u = 0;
      for (let d = 0; d < o && u < a; d++) {
        const m = i ? c ? (f - d + o) % o : (d + f) % o : c ? o - 1 - d : d, p = s[d][0] - r[m][0], g = s[d][1] - r[m][1];
        u += p * p + g * g;
      }
      u < a && (a = u, l = { offset: i ? f / o : 0, reversed: c });
    }
  }
  return l;
}
function Ts(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e + t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function xs(e, t, n) {
  return n ? ((t.reversed ? t.offset - e : e - t.offset) % 1 + 1) % 1 : t.reversed ? 1 - e : e;
}
function ks(e, t, n) {
  const i = e.closed && t.closed, s = vs(e, t, n.shapeIndex), r = Math.max(
    ms,
    Math.min(gs, Math.ceil(Math.max(e.length, t.length) / ys))
  ), o = /* @__PURE__ */ new Set(), l = (f) => o.add(Math.round(f * 1e7) / 1e7);
  for (let f = 0; f <= r; f++) l(f / r);
  for (const f of We(e)) l(f);
  for (const f of We(t)) l(xs(f, s, i));
  let a = [...o].sort((f, u) => f - u);
  i && (a = a.filter((f) => f < 1));
  const c = [], h = [];
  for (const f of a)
    c.push(...ge(e, f)), h.push(...ge(t, Ts(f, s, i)));
  return Ss({ from: c, to: h, closed: i });
}
function Ss(e) {
  const t = e.from.length / 2;
  if (t <= 3) return e;
  const n = new Uint8Array(t);
  n[0] = 1, n[t - 1] = 1;
  const i = [[0, t - 1]];
  for (; i.length > 0; ) {
    const [o, l] = i.pop();
    let a = -1, c = bs;
    for (let h = o + 1; h < l; h++) {
      const f = Math.max(Ue(e.from, o, l, h), Ue(e.to, o, l, h));
      f > c && (c = f, a = h);
    }
    a !== -1 && (n[a] = 1, i.push([o, a], [a, l]));
  }
  const s = [], r = [];
  for (let o = 0; o < t; o++)
    n[o] && (s.push(e.from[o * 2], e.from[o * 2 + 1]), r.push(e.to[o * 2], e.to[o * 2 + 1]));
  return { from: s, to: r, closed: e.closed };
}
function Ue(e, t, n, i) {
  const s = e[t * 2], r = e[t * 2 + 1], o = e[n * 2] - s, l = e[n * 2 + 1] - r, a = e[i * 2] - s, c = e[i * 2 + 1] - r, h = o * o + l * l, f = h === 0 ? 0 : Math.max(0, Math.min(1, (a * o + c * l) / h));
  return Math.hypot(a - f * o, c - f * l);
}
function Ms(e, t, n) {
  const i = n.shapeIndex;
  if (K && K.from === e && K.to === t && K.shapeIndex === i) return K.plan;
  const r = wt.get(String(i ?? "auto"))?.get(e)?.get(t);
  if (r)
    return K = { from: e, to: t, shapeIndex: i, plan: r }, r;
  const o = lt(e).subpaths.filter((d) => d.length > 0).length === lt(t).subpaths.filter((d) => d.length > 0).length, l = Xe(e, !o), a = Xe(t, !o), c = {
    pairs: l.map((d, m) => ks(d, a[m], n))
  };
  Dt >= ws && (wt.clear(), Dt = 0);
  const h = String(i ?? "auto"), f = wt.get(h) ?? /* @__PURE__ */ new Map();
  wt.set(h, f);
  const u = f.get(e) ?? /* @__PURE__ */ new Map();
  return f.set(e, u), u.set(t, c), Dt++, K = { from: e, to: t, shapeIndex: i, plan: c }, c;
}
function As(e, t, n, i = {}) {
  if (!e) return t;
  if (!t) return e;
  const s = Math.max(0, Math.min(1, n));
  if (s === 0) return e;
  if (s === 1) return t;
  const r = Ms(e, t, i);
  if (r.pairs.length === 0) return s < 0.5 ? e : t;
  let o = "";
  for (const l of r.pairs) {
    for (let a = 0; a < l.from.length; a += 2) {
      const c = qe(l.from[a] + (l.to[a] - l.from[a]) * s), h = qe(l.from[a + 1] + (l.to[a + 1] - l.from[a + 1]) * s);
      o += `${a === 0 ? o ? " M" : "M" : " L"}${c} ${h}`;
    }
    l.closed && (o += " Z");
  }
  return o;
}
function el() {
  wt.clear(), Dt = 0, K = void 0;
}
function Pt(e) {
  return /^\s*[Mm]\s*[-+]?(?:\d|\.\d)/.test(e);
}
const U = (e, t, n) => e + (t - e) * n, Xn = 512, ee = /* @__PURE__ */ new Map(), ne = /* @__PURE__ */ new Map();
function ze(e) {
  const t = ee.get(e);
  if (t) return t;
  const n = e.replace("#", ""), i = [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16)
  ];
  return ee.size < Xn && ee.set(e, i), i;
}
const je = (e) => e.charCodeAt(0) === 35, Ge = (e) => e.startsWith("rgb"), Ke = (e) => e.startsWith("rgba"), Es = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/, ie = (e) => Math.round(e).toString(16).padStart(2, "0");
function Ps(e, t, n) {
  return `#${ie(e)}${ie(t)}${ie(n)}`;
}
function Ze(e) {
  const t = ne.get(e);
  if (t) return t;
  const n = e.match(Es);
  if (!n)
    throw new Error(`Invalid rgb color: ${e}`);
  const i = parseInt(n[1], 10), s = parseInt(n[2], 10), r = parseInt(n[3], 10), o = n[4] !== void 0 ? [i, s, r, parseFloat(n[4])] : [i, s, r];
  return ne.size < Xn && ne.set(e, o), o;
}
const _s = (e, t, n) => {
  if (je(e) && je(t)) {
    const [i, s, r] = ze(e), [o, l, a] = ze(t), c = U(i, o, n), h = U(s, l, n), f = U(r, a, n);
    return Ps(c, h, f);
  }
  if ((Ge(e) || Ke(e)) && (Ge(t) || Ke(t))) {
    const i = Ze(e), s = Ze(t), r = Math.round(U(i[0], s[0], n)), o = Math.round(U(i[1], s[1], n)), l = Math.round(U(i[2], s[2], n));
    if (i.length === 4 || s.length === 4) {
      const a = i[3] ?? 1, c = s[3] ?? 1, h = U(a, c, n);
      return `rgba(${r}, ${o}, ${l}, ${h})`;
    }
    return `rgb(${r}, ${o}, ${l})`;
  }
  return n < 1 ? e : t;
}, Cs = (e, t, n) => {
  const i = Math.min(e.length, t.length), s = [];
  for (let r = 0; r < i; r++)
    s.push(U(e[r], t[r], n));
  return s;
}, Qe = (e, t, n) => n < 1 ? e : t, Is = (e, t, n) => As(e, t, n);
function qt(e) {
  return typeof e == "number" ? U : Array.isArray(e) ? Cs : typeof e == "string" ? e.startsWith("#") || e.startsWith("rgb") ? _s : Pt(e) ? Is : Qe : Qe;
}
const Wn = 1e3 / 60;
function Vn(e, t = {}) {
  if (!nt(e))
    throw new Error(`bakeSpringTrack: track "${e.id}" is not a spring track`);
  const n = new jt(e.spring);
  return Un(e, (i) => n.valueAt(i), n.settleTime(), e.spring.from, e.spring.to, t);
}
function Hn(e, t = {}) {
  if (!et(e))
    throw new Error(`bakeInertiaTrack: track "${e.id}" is not an inertia track`);
  const n = e.inertia;
  return Un(
    e,
    (i) => pe(n, i),
    Et(n),
    n.from,
    At(n),
    t
  );
}
function Un(e, t, n, i, s, r) {
  const o = r.intervalMs ?? Wn, l = r.tolerance ?? 0.01, a = e.delay ?? 0, c = [];
  for (let f = 0; f <= n; f += o)
    c.push({ time: f + a, value: t(f), easing: "linear" });
  const h = c[c.length - 1];
  return !h || h.time < n + a ? c.push({ time: n + a, value: s, easing: "linear" }) : h.value = s, a > 0 && c.unshift({ time: 0, value: i, easing: "linear" }), {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: l > 0 ? Ls(c, l) : c,
    ...e.targets && { targets: [...e.targets] },
    ...e.stagger && { stagger: { ...e.stagger } }
  };
}
function zn(e, t, n, i = {}) {
  const s = i.intervalMs ?? Wn, r = typeof n == "function" ? n : G(n), o = qt(e.value), l = t.time - e.time;
  if (l <= 0) return [t];
  const a = [];
  for (let h = s; h < l; h += s) {
    const f = h / l;
    a.push({
      time: e.time + h,
      value: o(e.value, t.value, r(f)),
      easing: "linear"
    });
  }
  const c = r(1);
  return a.push({ ...t, ...c !== 1 && { value: o(e.value, t.value, c) }, easing: "linear" }), a;
}
function nl(e, t) {
  return nt(e) ? Vn(e, t) : et(e) ? Hn(e, t) : e;
}
function Rs(e, t = {}) {
  const n = e.keyframes;
  if (!n.some((s) => Ot(s.easing))) return e;
  const i = n.length > 0 ? [n[0]] : [];
  for (let s = 1; s < n.length; s++) {
    const r = n[s];
    Ot(r.easing) ? i.push(...zn(n[s - 1], r, r.easing, t)) : i.push(r);
  }
  return { ...e, keyframes: i };
}
function il(e, t) {
  return e.filter(qi).map((n) => Rs(n, t)).concat(
    e.filter(nt).map((n) => Vn(n, t)),
    e.filter(et).map((n) => Hn(n, t))
  );
}
function Ls(e, t) {
  if (e.length <= 2) return e;
  const n = [e[0]];
  for (let i = 1; i < e.length - 1; i++) {
    const s = n[n.length - 1], r = e[i], o = e[i + 1], l = o.time - s.time;
    if (l <= 0) continue;
    const a = (r.time - s.time) / l, c = s.value + (o.value - s.value) * a;
    Math.abs(r.value - c) > t && n.push(r);
  }
  return n.push(e[e.length - 1]), n;
}
function ye(e) {
  const t = [...e.keyframes].sort((n, i) => n.time - i.time);
  return {
    ...e,
    keyframes: t
  };
}
function J(e) {
  return e.targets && e.targets.length > 0 ? e.targets : [e.target];
}
function ct(e, t, n, i) {
  const s = n ?? 0;
  return !i || t <= 1 ? s : s + Ce(e, t, i);
}
class se {
  track;
  targets;
  constructor(t) {
    this.track = t, this.targets = J(t);
  }
  /**
   * Get the interpolated value at a specific time.
   *
   * For a multi-target track this returns the *first* target's value; callers
   * that need every target should use `getTargetValues`.
   */
  getValueAtTime(t) {
    return this.valueForOffset(t - ct(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  /**
   * Every target's value at a specific time, in target order.
   *
   * Single-target tracks yield one entry; staggered tracks yield one per target,
   * each sampled at its own offset time.
   */
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = ct(s, n, this.track.delay, this.track.stagger), o = this.valueForOffset(t - r);
      o !== void 0 && i.push({ target: this.targets[s], value: o, start: r + this.track.keyframes[0].time });
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
    const n = t[t.length - 1].time, i = this.track.stagger ? zt(this.targets.length, this.track.stagger) : 0;
    return n + (this.track.delay ?? 0) + i + (this.track.endDelay ?? 0);
  }
  /**
   * Get the track metadata.
   */
  getTrack() {
    return this.track;
  }
  /** Interpolated value at a time already shifted into the track's own frame. */
  valueForOffset(t) {
    const { keyframes: n } = this.track;
    if (n.length === 0)
      return;
    if (n.length === 1 || t <= n[0].time)
      return n[0].value;
    if (t >= n[n.length - 1].time)
      return n[n.length - 1].value;
    const { from: i, to: s } = this.findSurroundingKeyframes(t);
    if (!i || !s)
      return;
    if (i.time === t)
      return i.value;
    const r = s.time - i.time, o = (t - i.time) / r, a = G(s.easing)(o);
    return qt(i.value)(i.value, s.value, a);
  }
  /**
   * Find the keyframes surrounding a given time.
   */
  findSurroundingKeyframes(t) {
    const { keyframes: n } = this.track;
    for (let i = 0; i < n.length - 1; i++)
      if (t >= n[i].time && t <= n[i + 1].time)
        return { from: n[i], to: n[i + 1] };
    return { from: null, to: null };
  }
}
class Fs {
  track;
  targets;
  sampler;
  constructor(t) {
    this.track = t, this.targets = J(t), this.sampler = new jt(t.spring);
  }
  getValueAtTime(t) {
    return this.sampler.valueAt(t - ct(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = ct(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: this.sampler.valueAt(t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? zt(this.targets.length, this.track.stagger) : 0;
    return this.sampler.settleTime() + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
class $s {
  track;
  targets;
  duration;
  constructor(t) {
    this.track = t, this.targets = J(t), this.duration = Et(t.inertia);
  }
  getValueAtTime(t) {
    return pe(this.track.inertia, t - ct(0, this.targets.length, this.track.delay, this.track.stagger));
  }
  getTargetValues(t) {
    const n = this.targets.length, i = [];
    for (let s = 0; s < n; s++) {
      const r = ct(s, n, this.track.delay, this.track.stagger);
      i.push({ target: this.targets[s], value: pe(this.track.inertia, t - r), start: r });
    }
    return i;
  }
  /** Settle time plus delay and the widest stagger offset. */
  getDuration() {
    const t = this.track.stagger ? zt(this.targets.length, this.track.stagger) : 0;
    return this.duration + (this.track.delay ?? 0) + t;
  }
  getTrack() {
    return this.track;
  }
}
function jn(e, t) {
  const n = { ...ps(e.pathData, t) };
  if (e.matrix) {
    const [i, s, r, o, l, a] = e.matrix, { x: c, y: h } = n;
    n.x = i * c + r * h + l, n.y = s * c + o * h + a;
    const f = n.angle * Math.PI / 180, u = Math.cos(f), d = Math.sin(f);
    n.angle = Math.atan2(s * u + o * d, i * u + r * d) * 180 / Math.PI;
  }
  return e.autoRotate && e.rotateOffset && (n.angle += e.rotateOffset), n;
}
function sl(e, t, n, i) {
  const s = t + (n - t) * i;
  return jn(e, s);
}
const re = {
  upperCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowerCase: "abcdefghijklmnopqrstuvwxyz",
  upperAndLowerCase: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789"
}, Ds = 20;
function Bs(e) {
  const t = re[e ?? "upperCase"] ?? e ?? re.upperCase, n = Array.from(t);
  return n.length > 0 ? n : Array.from(re.upperCase);
}
function Os(e, t, n) {
  let i = (e | 0) ^ Math.imul(t + 1, 2654435761) ^ Math.imul(n + 1, 2246822507);
  return i = Math.imul(i ^ i >>> 16, 2146121005), i = Math.imul(i ^ i >>> 15, 2221713035), (i ^ i >>> 16) >>> 0;
}
function Ns(e, t, n = 0) {
  const i = e.from ?? "", s = e.to, r = Math.max(0, Math.min(1, t));
  if (r <= 0) return i;
  if (r >= 1) return s;
  const o = Array.from(i), l = Array.from(s), a = e.rightToLeft ?? !1;
  if (e.mode === "type") {
    const b = Math.round(r * Math.max(o.length, l.length));
    return a ? o.slice(0, Math.max(0, o.length - b)).join("") + l.slice(Math.max(0, l.length - b)).join("") : l.slice(0, b).join("") + o.slice(b).join("");
  }
  const c = Math.max(0, Math.min(0.999, e.revealDelay ?? 0)), h = Math.max(0, (r - c) / (1 - c)), f = Math.floor(h * l.length), u = e.tweenLength === !1 ? l.length : Math.round(o.length + (l.length - o.length) * r), d = Bs(e.chars), m = e.refreshRate ?? Ds, p = m > 0 ? Math.floor(n * m / 1e3) : 0, g = e.seed ?? 1;
  let y = "";
  for (let b = 0; b < u; b++) {
    const w = a ? b >= u - f : b < f, T = a ? l[l.length - (u - b)] : l[b];
    w && T !== void 0 || T === " " || T === `
` ? y += T : y += d[Os(g, b, p) % d.length];
  }
  return y;
}
class Gn {
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
      for (const n of t.tracks)
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
  setDuration(t) {
    if (this._explicitDuration = t, t !== void 0)
      this._config = { ...this._config, duration: t };
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
    const n = this.duration > 0 ? this.duration : 1 / 0;
    this._currentTime = Math.max(0, Math.min(t, n)), this._repeatDelayRemaining = 0, this._wrapAfterDelay = !1;
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
    const n = this.duration;
    if (n <= 0)
      return;
    let s = t * this.speed;
    if (this._repeatDelayRemaining > 0) {
      const l = Math.min(this._repeatDelayRemaining, s);
      if (this._repeatDelayRemaining -= l, s -= l, this._repeatDelayRemaining > 0) {
        this.onUpdate?.(this.getStateAtTime(this._currentTime));
        return;
      }
      this._wrapAfterDelay && (this._wrapAfterDelay = !1, this._currentTime = 0);
    }
    const r = 1e3;
    for (let l = 0; l < r && s > 0 && this._playbackState === "playing"; l++)
      if (this._direction === "forward") {
        const a = n - this._currentTime;
        if (s >= a) {
          if (s -= a, this._currentTime = n, !this._handleEndReached())
            break;
        } else
          this._currentTime += s, s = 0;
      } else {
        const a = this._currentTime;
        if (s >= a) {
          if (s -= a, this._currentTime = 0, !this._handleStartReached())
            break;
        } else
          this._currentTime -= s, s = 0;
      }
    const o = this.getStateAtTime(this._currentTime);
    this.onUpdate?.(o);
  }
  /**
   * Get the animation state at a specific time.
   */
  getStateAtTime(t) {
    const n = /* @__PURE__ */ new Map();
    if (this._hasSharedWrites())
      this._resolveShared(t, n);
    else
      for (const [i, s] of this._trackPlayers) {
        const r = s.getTrack().property;
        for (const { target: o, value: l, start: a } of s.getTargetValues(t))
          this._write(n, i, o, r, l, t - a);
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
  _resolveShared(t, n) {
    const i = /* @__PURE__ */ new Map();
    for (const [s, r] of this._trackPlayers) {
      const o = r.getTrack().property;
      for (const { target: l, value: a, start: c } of r.getTargetValues(t)) {
        const h = `${l}\0${o}`, f = c <= t, u = i.get(h);
        (!u || (f !== u.started ? f : f ? c >= u.start : c <= u.start)) && i.set(h, { trackId: s, target: l, property: o, value: a, start: c, started: f });
      }
    }
    for (const { trackId: s, target: r, property: o, value: l, start: a } of i.values())
      this._write(n, s, r, o, l, t - a);
  }
  /**
   * Write one track's value for a target, expanding the progress of motion paths
   * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
   * since this target's animation on the track started.
   */
  _write(t, n, i, s, r, o) {
    if (r === void 0) return;
    let l = t.get(i);
    l || (l = /* @__PURE__ */ new Map(), t.set(i, l));
    const a = this._textTracks.get(n);
    if (a && typeof r == "number") {
      l.set("text", Ns(a.textConfig, r, Math.max(0, o)));
      return;
    }
    const c = this._motionPathTracks.get(n);
    if (c && typeof r == "number") {
      const h = jn(c.motionPathConfig, r);
      l.set("motionPathX", h.x), l.set("motionPathY", h.y), c.motionPathConfig.autoRotate && l.set("motionPathRotate", h.angle);
    } else
      l.set(s, r);
  }
  /** Cached: does any target+property have more than one track? */
  _sharedWrites = null;
  _hasSharedWrites() {
    if (this._sharedWrites === null) {
      const t = /* @__PURE__ */ new Set();
      this._sharedWrites = !1;
      t: for (const n of this._tracks)
        for (const i of J(n)) {
          const s = `${i}\0${n.property}`;
          if (t.has(s)) {
            this._sharedWrites = !0;
            break t;
          }
          t.add(s);
        }
    }
    return this._sharedWrites;
  }
  /**
   * Add a track to the timeline.
   */
  addTrack(t) {
    if (this._tracks.push(t), this._sharedWrites = null, et(t)) {
      this._trackPlayers.set(t.id, new $s(t));
      return;
    }
    if (nt(t)) {
      this._trackPlayers.set(t.id, new Fs(t)), this._springTracks.set(t.id, t);
      return;
    }
    if (_e(t))
      this._trackPlayers.set(t.id, new se(t)), this._textTracks.set(t.id, t);
    else if ($n(t)) {
      const n = {
        id: t.id,
        target: t.target,
        property: t.property,
        keyframes: t.keyframes,
        delay: t.delay,
        endDelay: t.endDelay,
        targets: t.targets,
        stagger: t.stagger
      };
      this._trackPlayers.set(t.id, new se(n)), this._motionPathTracks.set(t.id, t);
    } else
      this._trackPlayers.set(t.id, new se(t));
  }
  /**
   * Replace a track with a new version, keeping its place in the track order
   * (which decides ties when tracks overlap). The new track may have a
   * different id. Does nothing if no track has `trackId`.
   */
  replaceTrack(t, n) {
    const i = this._tracks.findIndex((r) => r.id === t);
    if (i < 0) return;
    const s = this._tracks.slice(i + 1);
    this.removeTrack(t);
    for (const r of s) this.removeTrack(r.id);
    this.addTrack(n);
    for (const r of s) this.addTrack(r);
  }
  /**
   * Remove a track by its ID.
   */
  removeTrack(t) {
    this._tracks = this._tracks.filter((n) => n.id !== t), this._sharedWrites = null, this._trackPlayers.delete(t), this._motionPathTracks.delete(t), this._springTracks.delete(t), this._textTracks.delete(t);
  }
  /**
   * Tracks matching a filter. All provided fields must match (AND).
   *
   * This is the closest principled equivalent to GSAP's per-tween handle: we
   * have no live tween objects to hold, so a "tween" is addressed by describing
   * the tracks it produced.
   */
  getTracks(t = {}) {
    return this._tracks.filter((n) => this._matches(n, t));
  }
  /**
   * Remove every track matching a filter. Returns the ids removed.
   *
   * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
   * tweens on an element.
   */
  removeTracks(t = {}) {
    const n = this.getTracks(t).map((i) => i.id);
    for (const i of n)
      this.removeTrack(i);
    return n;
  }
  /**
   * The time span a track is active over: [start, end] in milliseconds.
   */
  getTrackSpan(t) {
    const n = this._trackPlayers.get(t);
    if (!n) return;
    const i = n.getTrack(), s = i.delay ?? 0;
    if (nt(i) || et(i))
      return { from: s, to: n.getDuration() };
    const r = i.keyframes;
    if (!(!r || r.length === 0))
      return { from: r[0].time + s, to: n.getDuration() };
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
    for (let n = 0; n < this._tracks.length; n++) {
      const i = this._tracks[n], s = this.getTrackSpan(i.id);
      if (s)
        for (let r = 0; r < n; r++) {
          const o = this._tracks[r];
          if (o.property !== i.property) continue;
          const l = J(o).filter((f) => J(i).includes(f));
          if (l.length === 0) continue;
          const a = this.getTrackSpan(o.id);
          if (!a || !(a.from <= s.to && s.from <= a.to)) continue;
          const h = s.from >= a.from;
          for (const f of l)
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
  _matches(t, n) {
    if (n.id !== void 0 && t.id !== n.id || n.property !== void 0 && t.property !== n.property || n.target !== void 0 && !J(t).includes(n.target)) return !1;
    if (n.timeRange) {
      const i = this.getTrackSpan(t.id);
      if (!i || i.to < n.timeRange.from || i.from > n.timeRange.to) return !1;
    }
    return !0;
  }
  /**
   * Export timeline as a serializable definition.
   */
  toDefinition() {
    return {
      formatVersion: Nt,
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
    return [...this._config.markers ?? []].sort((t, n) => t.time - n.time);
  }
  /** Replace the markers (kept in time order); an empty list removes them. */
  setMarkers(t) {
    const n = t && t.length > 0 ? [...t].sort((s, r) => s.time - r.time).map((s) => ({ ...s })) : void 0, i = { ...this._config };
    n ? i.markers = n : delete i.markers, this._config = i;
  }
  /** Caption text per language, per marker id */
  get captions() {
    return this._captions;
  }
  /** Replace the captions; languages with no captions are dropped. */
  setCaptions(t) {
    const n = {};
    for (const [i, s] of Object.entries(t ?? {})) n[i] = { ...s };
    this._captions = Object.keys(n).length > 0 ? n : void 0;
  }
  /** Start the between-iterations pause, if the timeline configures one. */
  _armRepeatDelay() {
    this._repeatDelayRemaining = this._config.repeatDelay ?? 0;
  }
  _calculateDuration() {
    let t = 0;
    for (const [, n] of this._trackPlayers)
      t = Math.max(t, n.getDuration());
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
const Ys = 100;
function Kn(e, t, n, i) {
  const s = [], r = [], { duration: o, alternate: l } = i, a = (d, m, p, g) => {
    r.push([d, m]);
    const y = [];
    e.forEach((b, w) => {
      (p === "forward" ? (g ? b >= d : b > d) && b <= m : (g ? b <= d : b < d) && b >= m) && y.push(w);
    }), y.sort((b, w) => (p === "forward" ? e[b] - e[w] : e[w] - e[b]) || b - w);
    for (const b of y) s.push({ kind: "event", index: b, direction: p });
  };
  let c = t.time, h = t.direction, f = t.fresh === !0;
  const u = Math.min(Ys, Math.max(0, n.iteration - t.iteration));
  for (let d = 0; d < u; d++) {
    const m = h === "forward" ? o : 0;
    a(c, m, h, f), s.push({ kind: "repeat" }), l ? (h = h === "forward" ? "reverse" : "forward", c = m, f = !1) : (c = h === "forward" ? 0 : o, f = !0);
  }
  return u > 0 && i.holding && !l ? { crossings: s, passes: r } : (a(c, n.time, h, f), { crossings: s, passes: r });
}
function qs(e) {
  return et(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "inertia",
    inertia: Zn(e.inertia),
    ...H(e)
  } : nt(e) ? {
    id: e.id,
    target: e.target,
    property: e.property,
    kind: "spring",
    spring: { ...e.spring },
    ...H(e)
  } : _e(e) ? {
    id: e.id,
    target: e.target,
    property: "text",
    textConfig: { ...e.textConfig },
    keyframes: e.keyframes.map(oe),
    ...H(e)
  } : $n(e) ? {
    id: e.id,
    target: e.target,
    property: "motionPath",
    motionPathConfig: { ...e.motionPathConfig },
    keyframes: e.keyframes.map(oe),
    ...H(e)
  } : {
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes.map(oe),
    ...H(e)
  };
}
function Zn(e) {
  return { ...e, ...Array.isArray(e.end) && { end: [...e.end] } };
}
function oe(e) {
  return {
    time: e.time,
    value: e.value,
    ...e.easing && { easing: e.easing }
  };
}
function H(e) {
  const t = e.endDelay;
  return {
    ...e.delay !== void 0 && { delay: e.delay },
    ...t !== void 0 && { endDelay: t },
    ...e.targets !== void 0 && { targets: [...e.targets] },
    ...e.stagger !== void 0 && { stagger: { ...e.stagger } }
  };
}
function Xs(e) {
  if (et(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "inertia",
      inertia: Zn(t.inertia),
      ...H(t)
    };
  }
  if (nt(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: t.property,
      kind: "spring",
      spring: { ...t.spring },
      ...H(t)
    };
  }
  if (_e(e)) {
    const t = e;
    return {
      id: t.id,
      target: t.target,
      property: "text",
      textConfig: { ...t.textConfig },
      keyframes: [...t.keyframes].sort((n, i) => n.time - i.time),
      ...H(t)
    };
  }
  if (e.property === "motionPath" && "motionPathConfig" in e) {
    const t = e, n = [...t.keyframes].sort((i, s) => i.time - s.time);
    return {
      id: t.id,
      target: t.target,
      property: "motionPath",
      motionPathConfig: { ...t.motionPathConfig },
      keyframes: n,
      ...H(t)
    };
  }
  return ye({
    id: e.id,
    target: e.target,
    property: e.property,
    keyframes: e.keyframes,
    ...H(e)
  });
}
function Ws(e) {
  const t = e._config.markers;
  return {
    formatVersion: Nt,
    id: e.id,
    name: e.name,
    config: {
      duration: e.duration > 0 ? e.duration : void 0,
      loop: e._config.loop,
      speed: e._config.speed,
      alternate: e._config.alternate,
      repeatDelay: e._config.repeatDelay,
      ...t && { markers: t.map((n) => ({ ...n })) }
    },
    tracks: e.tracks.map(qs),
    ...e.captions && { captions: JSON.parse(JSON.stringify(e.captions)) }
  };
}
function kt(e) {
  const t = e.formatVersion ?? 1;
  if (t > Nt)
    throw new Error(
      `tinyfly: this animation uses format version ${t}, but this tinyfly reads up to version ${Nt}. Update tinyfly to play it.`
    );
  return new Gn({
    id: e.id,
    name: e.name,
    config: e.config,
    tracks: e.tracks.map(Xs),
    captions: e.captions
  });
}
function rl(e) {
  return JSON.stringify(Ws(e));
}
function ol(e) {
  const t = JSON.parse(e);
  return kt(t);
}
function Vs(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++)
    t ^= e.charCodeAt(n), t = Math.imul(t, 16777619);
  return t >>> 0;
}
function Qn(e) {
  let t = e >>> 0 || 2654435769;
  return {
    seed: e >>> 0,
    next() {
      return t ^= t << 13, t >>>= 0, t ^= t >> 17, t ^= t << 5, t >>>= 0, t / 4294967296;
    }
  };
}
function Jn(e, t, n) {
  return t + e.next() * (n - t);
}
function Hs(e, t, n, i) {
  if (i <= 0) return Jn(e, t, n);
  const s = Math.floor((n - t) / i), r = Math.round(e.next() * s);
  return t + r * i;
}
function al(e, t) {
  if (t.length !== 0)
    return t[Math.floor(e.next() * t.length)];
}
const ti = /^([+\-*/])=\s*(-?[\d.]+)$/, ei = /^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*(-?[\d.]+)\s*)?\)$/i;
function ll(e) {
  return typeof e != "string" ? !1 : ti.test(e.trim()) || ei.test(e.trim());
}
function ni(e, t = {}) {
  if (typeof e != "string") return e;
  const n = e.trim(), i = ti.exec(n);
  if (i) {
    const [, r, o] = i, l = t.base ?? 0, a = Number.parseFloat(o);
    switch (r) {
      case "+":
        return l + a;
      case "-":
        return l - a;
      case "*":
        return l * a;
      case "/":
        return a === 0 ? l : l / a;
    }
  }
  const s = ei.exec(n);
  if (s) {
    if (!t.random)
      throw new Error(
        `resolveValue: "${n}" needs a random source — pass one via context.random`
      );
    const r = Number.parseFloat(s[1]), o = Number.parseFloat(s[2]), l = s[3] !== void 0 ? Number.parseFloat(s[3]) : void 0;
    return l !== void 0 ? Hs(t.random, r, o, l) : Jn(t.random, r, o);
  }
  return e;
}
function Us(e, t = 0, n) {
  const i = [];
  let s = t;
  for (const r of e) {
    const o = ni(r, { base: s, random: n });
    i.push(o), typeof o == "number" && (s = o);
  }
  return i;
}
class cl {
  random;
  constructor(t) {
    this.random = Qn(t);
  }
  /** The seed, to be stored alongside the timeline so this can be reproduced. */
  get seed() {
    return this.random.seed;
  }
  resolve(t, n = 0) {
    return ni(t, { base: n, random: this.random });
  }
  resolveSequence(t, n = 0) {
    return Us(t, n, this.random);
  }
}
const zs = 600;
function js(e) {
  if (Array.isArray(e)) {
    const [u, d, m, p] = e;
    return { fn: Je(u, d, m, p), bezier: [u, d, m, p] };
  }
  const { segments: t } = lt(e);
  if (t.length === 0) throw new Error(`customEase: no curve in "${e}"`);
  const n = t[0].startX, i = t[0].startY, s = t[t.length - 1], r = s.endX - n, o = s.endY - i;
  if (r === 0 || o === 0) throw new Error(`customEase: "${e}" must move along both axes`);
  const l = (u) => (u - n) / r, a = (u) => (u - i) / o;
  if (t.length === 1 && s.type === "C") {
    const [u, d, m, p] = s.points, g = [l(u), a(d), l(m), a(p)];
    return { fn: Je(...g), bezier: g };
  }
  const c = [], h = [], f = Math.max(8, Math.ceil(zs / t.length));
  for (const u of t)
    for (let d = c.length === 0 ? 0 : 1; d <= f; d++) {
      const [m, p] = Zs(u, d / f);
      c.push(l(m)), h.push(a(p));
    }
  return { fn: Qs(c, h) };
}
function Gs(e = {}) {
  const n = 0.1 + Math.max(0, Math.min(1, e.strength ?? 0.7)) * 0.7, i = [1];
  for (let r = n; r > 2e-3; r *= n) i.push(2 * Math.sqrt(r));
  const s = i.reduce((r, o) => r + o, 0);
  return (r) => {
    if (r <= 0) return 0;
    if (r >= 1) return 1;
    let o = r * s;
    for (let l = 0; l < i.length; l++) {
      if (o <= i[l]) {
        if (l === 0) return (o / i[0]) ** 2;
        const a = i[l] / 2, c = a * a, h = o - a;
        return 1 - (c - h * h);
      }
      o -= i[l];
    }
    return 1;
  };
}
function Ks(e = {}) {
  const t = Math.max(1, e.wiggles ?? 10), n = e.type ?? "easeOut", i = (s) => n === "uniform" ? 1 : n === "easeInOut" ? Math.sin(Math.PI * s) : (1 - s) ** 2;
  return (s) => s <= 0 || s >= 1 ? 0 : Math.sin(s * t * Math.PI * 2) * i(s);
}
function Zs(e, t) {
  if (e.type === "L") {
    const [c, h] = e.points;
    return [e.startX + (c - e.startX) * t, e.startY + (h - e.startY) * t];
  }
  const [n, i, s, r, o, l] = e.points, a = 1 - t;
  return [
    a * a * a * e.startX + 3 * a * a * t * n + 3 * a * t * t * s + t * t * t * o,
    a * a * a * e.startY + 3 * a * a * t * i + 3 * a * t * t * r + t * t * t * l
  ];
}
function Qs(e, t) {
  return (n) => {
    if (n <= e[0]) return t[0];
    if (n >= e[e.length - 1]) return t[t.length - 1];
    let i = 0, s = e.length - 1;
    for (; s - i > 1; ) {
      const o = i + s >> 1;
      e[o] <= n ? i = o : s = o;
    }
    const r = e[s] - e[i];
    return r === 0 ? t[s] : t[i] + (n - e[i]) / r * (t[s] - t[i]);
  };
}
function Je(e, t, n, i) {
  const s = (o, l, a) => 3 * (1 - o) * (1 - o) * o * l + 3 * (1 - o) * o * o * a + o * o * o, r = (o, l, a) => 3 * (1 - o) * (1 - o) * l + 6 * (1 - o) * o * (a - l) + 3 * o * o * (1 - a);
  return (o) => {
    if (o <= 0) return 0;
    if (o >= 1) return 1;
    let l = o;
    for (let h = 0; h < 8; h++) {
      const f = s(l, e, n) - o, u = r(l, e, n);
      if (Math.abs(f) < 1e-6) return s(l, t, i);
      if (Math.abs(u) < 1e-6) break;
      l -= f / u;
    }
    let a = 0, c = 1;
    l = o;
    for (let h = 0; h < 40; h++)
      s(l, e, n) < o ? a = l : c = l, l = (a + c) / 2;
    return s(l, t, i);
  };
}
const Js = 350, tr = 300, er = 550;
function hl(e, t = {}) {
  const n = t.lead ?? Js, i = t.gap ?? tr, s = t.tail ?? er, r = [];
  let o = 0;
  return e.forEach((l, a) => {
    const c = [];
    let h = o + n;
    l.lines.forEach((u, d) => {
      if (!(u.duration >= 0))
        throw new Error(`narration: scene ${a} line ${d} has an invalid duration (${u.duration})`);
      d > 0 && (h += i), c.push({
        id: u.id ?? `s${a}-l${d}`,
        scene: a,
        line: d,
        start: h,
        end: h + u.duration,
        text: u.text
      }), h += u.duration;
    });
    const f = h + s + (l.tail ?? 0);
    r.push({ id: l.id ?? `s${a}`, start: o, duration: f - o, cues: c }), o = f;
  }), { duration: o, scenes: r, cues: r.flatMap((l) => l.cues) };
}
function ul(e) {
  return e.cues.map((t) => ({ id: t.id, time: t.start, label: t.text }));
}
function fl(e, t) {
  let n = e.scenes[0];
  for (const i of e.scenes)
    if (t >= i.start) n = i;
    else break;
  return n;
}
const V = (e) => Math.round(e * 1e3) / 1e3;
function nr(e, t = {}) {
  if (e.length === 0) return "";
  const n = t.curviness ?? 1, i = t.closed ?? !1, s = e.length;
  let r = `M${V(e[0].x)} ${V(e[0].y)}`;
  if (s === 1) return r;
  const o = (a) => i ? e[(a % s + s) % s] : e[Math.max(0, Math.min(s - 1, a))], l = i ? s : s - 1;
  for (let a = 0; a < l; a++) {
    const c = o(a - 1), h = o(a), f = o(a + 1), u = o(a + 2);
    if (n === 0) {
      r += ` L${V(f.x)} ${V(f.y)}`;
      continue;
    }
    const d = n / 6, m = h.x + (f.x - c.x) * d, p = h.y + (f.y - c.y) * d, g = f.x - (u.x - h.x) * d, y = f.y - (u.y - h.y) * d;
    r += ` C${V(m)} ${V(p)} ${V(g)} ${V(y)} ${V(f.x)} ${V(f.y)}`;
  }
  return i ? `${r} Z` : r;
}
const D = (e, t = 0) => {
  const n = parseFloat(e ?? "");
  return Number.isFinite(n) ? n : t;
};
function ir(e) {
  const t = (e ?? "").trim().split(/[\s,]+/).filter(Boolean).map(Number), n = [];
  for (let i = 0; i + 1 < t.length; i += 2) n.push({ x: t[i], y: t[i + 1] });
  return n;
}
function Ie(e) {
  const t = e.attributes;
  switch (e.tag.toLowerCase()) {
    case "path":
      return t.d ?? null;
    case "circle":
    case "ellipse": {
      const n = D(t.cx), i = D(t.cy), s = e.tag.toLowerCase() === "circle" ? D(t.r) : D(t.rx), r = e.tag.toLowerCase() === "circle" ? D(t.r) : D(t.ry);
      return `M${n + s} ${i} A${s} ${r} 0 1 1 ${n - s} ${i} A${s} ${r} 0 1 1 ${n + s} ${i} Z`;
    }
    case "rect": {
      const n = D(t.x), i = D(t.y), s = D(t.width), r = D(t.height);
      let o = t.rx != null ? D(t.rx) : t.ry != null ? D(t.ry) : 0, l = t.ry != null ? D(t.ry) : o;
      return o = Math.min(o, s / 2), l = Math.min(l, r / 2), o === 0 || l === 0 ? `M${n} ${i} H${n + s} V${i + r} H${n} Z` : `M${n + o} ${i} H${n + s - o} A${o} ${l} 0 0 1 ${n + s} ${i + l} V${i + r - l} A${o} ${l} 0 0 1 ${n + s - o} ${i + r} H${n + o} A${o} ${l} 0 0 1 ${n} ${i + r - l} V${i + l} A${o} ${l} 0 0 1 ${n + o} ${i} Z`;
    }
    case "line":
      return `M${D(t.x1)} ${D(t.y1)} L${D(t.x2)} ${D(t.y2)}`;
    case "polyline":
    case "polygon": {
      const n = ir(t.points);
      if (n.length === 0) return null;
      const i = n.map((s, r) => `${r === 0 ? "M" : "L"}${s.x} ${s.y}`).join(" ");
      return e.tag.toLowerCase() === "polygon" ? `${i} Z` : i;
    }
    default:
      return null;
  }
}
const Rt = {
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
}, tn = {
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
function sr(e) {
  let t = e.trim().toLowerCase();
  t = t.replace(/\.ease(in|out|inout)$/, ".$1");
  const n = /^([a-z]+\d?)(\(.*\))?$/.exec(t);
  return n && n[1] !== "steps" && t !== "none" && t !== "linear" && (t = `${n[1]}.out${n[2] ?? ""}`), t;
}
G({ type: "bounce", mode: "in" });
G({ type: "bounce", mode: "in-out" });
function Xt(e) {
  const t = ii.get(e.trim().toLowerCase());
  if (t) return t;
  const n = sr(e), i = /^steps\(\s*(\d+)\s*\)$/.exec(n);
  if (i) {
    const o = { type: "steps", count: Math.max(1, Number.parseInt(i[1], 10)) + 1, position: "none" };
    return { easing: o, fn: G(o) };
  }
  const s = /^(elastic|bounce|back)\.(in|out|inout)(?:\(([^)]*)\))?$/.exec(n);
  if (s) {
    const [, r, o, l] = s, a = (l ?? "").split(",").map((f) => Number.parseFloat(f)).filter((f) => Number.isFinite(f)), c = o === "inout" ? "in-out" : o;
    if (r === "back" && a.length === 0 && n in Rt)
      return { easing: { type: "cubic-bezier", points: Rt[n] } };
    const h = r === "elastic" ? { type: "elastic", mode: c, ...a[0] !== void 0 && { amplitude: a[0] }, ...a[1] !== void 0 && { period: a[1] } } : r === "bounce" ? { type: "bounce", mode: c } : { type: "back", mode: c, ...a[0] !== void 0 && { overshoot: a[0] } };
    return { easing: h, fn: G(h) };
  }
  return n in tn ? { easing: tn[n] } : n in Rt ? { easing: { type: "cubic-bezier", points: Rt[n] } } : { easing: "ease-out" };
}
const ii = /* @__PURE__ */ new Map();
function Re(e, t) {
  return ii.set(
    e.trim().toLowerCase(),
    t.bezier ? { easing: { type: "cubic-bezier", points: t.bezier }, fn: t.fn } : { fn: t.fn, requiresBaking: "custom" }
  ), e;
}
function be(e) {
  let t = e >>> 0;
  return () => {
    t = t + 1831565813 >>> 0;
    let n = t;
    return n = Math.imul(n ^ n >>> 15, n | 1), n ^= n + Math.imul(n ^ n >>> 7, n | 61), ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
const si = /^\s*random\(\s*(\[.*\]|[^)]*)\s*\)\s*$/;
function ri(e) {
  return typeof e == "string" && si.test(e);
}
function rr(e = 1) {
  let t = be(e);
  const n = (a, c) => ((...h) => h.length >= a ? c(...h) : (f) => c(...h, f)), i = (a, c, h) => Math.min(Math.max(h, Math.min(a, c)), Math.max(a, c)), s = (a, c, h, f, u) => c === a ? h : h + (u - a) / (c - a) * (f - h), r = (a, c) => {
    if (typeof a == "number") return a === 0 ? c : Math.round(c / a) * a;
    if (Array.isArray(a)) return en(a, c, 1 / 0);
    if ("values" in a) return en(a.values, c, a.radius ?? 1 / 0);
    const h = Math.round(c / a.increment) * a.increment;
    return Math.abs(h - c) <= (a.radius ?? 1 / 0) ? h : c;
  }, o = (a, c, h) => {
    const f = a + t() * (c - a);
    return h ? Math.round(f / h) * h : f;
  };
  return {
    clamp: n(3, i),
    mapRange: n(5, s),
    normalize: n(3, (a, c, h) => s(a, c, 0, 1, h)),
    interpolate: n(3, (a, c, h) => {
      if (typeof a == "object" && !Array.isArray(a)) {
        const f = {};
        for (const u of Object.keys(a))
          f[u] = qt(a[u])(a[u], c[u], h);
        return f;
      }
      return qt(a)(a, c, h);
    }),
    wrap: ((a, c, h) => {
      if (Array.isArray(a)) {
        const p = a, g = (y) => p[(Math.round(y) % p.length + p.length) % p.length];
        return c === void 0 ? g : g(c);
      }
      const f = a, d = c - f, m = (p) => d === 0 ? f : ((p - f) % d + d) % d + f;
      return h === void 0 ? m : m(h);
    }),
    wrapYoyo: n(3, (a, c, h) => {
      const f = c - a;
      if (f === 0) return a;
      const u = ((h - a) % (f * 2) + f * 2) % (f * 2);
      return a + (u > f ? f * 2 - u : u);
    }),
    snap: n(2, r),
    random: ((a, c, h, f) => {
      if (Array.isArray(a)) {
        const d = () => a[Math.floor(t() * a.length)];
        return c === !0 ? d : d();
      }
      const u = () => o(a, c, h);
      return f ? u : u();
    }),
    shuffle: (a) => {
      for (let c = a.length - 1; c > 0; c--) {
        const h = Math.floor(t() * (c + 1));
        [a[c], a[h]] = [a[h], a[c]];
      }
      return a;
    },
    distribute: ({ base: a = 0, amount: c, each: h, from: f = "start", ease: u }) => (d, m, p) => {
      const g = p.length, b = Ce(d, g, { ...c !== void 0 ? { amount: c } : { each: h ?? 1 }, from: f }), w = c !== void 0 ? c : (h ?? 1) * Bn(g, f), T = u && w > 0 ? u(b / w) * w : b;
      return a + T;
    },
    pipe: (...a) => (c) => a.reduce((h, f) => f(h), c),
    splitColor: (a) => or(a),
    getUnit: (a) => typeof a == "number" ? "" : /^-?[\d.]+(?:e[-+]?\d+)?([a-z%]*)$/i.exec(a.trim())?.[1] ?? "",
    seed: (a) => {
      t = be(a);
    },
    resolveRandomString: (a) => {
      const c = si.exec(a)?.[1] ?? "";
      if (c.startsWith("[")) {
        const m = c.slice(1, -1).split(",").map((p) => p.trim()).filter(Boolean).map((p) => Number.isFinite(Number(p)) ? Number(p) : p.replace(/^['"]|['"]$/g, ""));
        return m[Math.floor(t() * m.length)];
      }
      const [h, f, u] = c.split(",").map((d) => Number.parseFloat(d));
      return o(h, f, Number.isFinite(u) ? u : void 0);
    }
  };
}
function en(e, t, n) {
  let i = t, s = 1 / 0;
  for (const r of e) {
    const o = Math.abs(r - t);
    o < s && (s = o, i = r);
  }
  return s <= n ? i : t;
}
function or(e) {
  const t = e.trim(), n = /^#([0-9a-f]{3,8})$/i.exec(t)?.[1];
  if (n) {
    const r = (n.length <= 4 ? [...n].map((o) => o + o).join("") : n).match(/../g).map((o) => Number.parseInt(o, 16));
    return r.length >= 4 ? [r[0], r[1], r[2], Math.round(r[3] / 255 * 1e3) / 1e3] : [r[0], r[1], r[2]];
  }
  const i = (/rgba?\(([^)]+)\)/i.exec(t)?.[1] ?? "0,0,0").split(/[\s,/]+/).filter(Boolean).map((s) => Number.parseFloat(s));
  return i.length >= 4 ? [i[0], i[1], i[2], i[3]] : [i[0] ?? 0, i[1] ?? 0, i[2] ?? 0];
}
const ar = /^([+-])=\s*(-?[\d.]+)$/, lr = /^([<>])\s*(?:([+-])?=?\s*(-?[\d.]+))?$/;
function mt(e, t) {
  const n = t.scale ?? 1, i = (c) => Number.parseFloat(c) * n;
  if (e === void 0) return t.cursor;
  if (typeof e == "number") return e * n;
  const s = e.trim();
  if (s === "") return t.cursor;
  const r = ar.exec(s);
  if (r) {
    const c = i(r[2]);
    return t.cursor + (r[1] === "-" ? -c : c);
  }
  const o = lr.exec(s);
  if (o) {
    const c = o[1] === "<" ? t.previousStart : t.previousEnd;
    if (o[3] === void 0) return c;
    const h = i(o[3]);
    return c + (o[2] === "-" ? -h : h);
  }
  const l = /^(.+?)([+-])=\s*(-?[\d.]+)$/.exec(s);
  if (l) {
    const c = t.labels.get(l[1].trim());
    if (c !== void 0) {
      const h = i(l[3]);
      return c + (l[2] === "-" ? -h : h);
    }
  }
  const a = t.labels.get(s);
  return a !== void 0 ? a : /^-?[\d.]+$/.test(s) ? i(s) : t.cursor;
}
function cr(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.grid !== void 0 || t.from === "random" || Array.isArray(t.from) || t.ease !== void 0 || t.axis !== void 0;
}
function hr(e, t, n = {}) {
  if (e === 0) return [];
  const i = t.grid === "auto" ? Math.max(1, Math.min(e, n.columnsFromLayout?.() ?? e)) : Array.isArray(t.grid) ? Math.max(1, t.grid[1]) : e, s = Array.isArray(t.grid) ? Math.max(1, t.grid[0]) : Math.ceil(e / i), r = (m) => ({ x: m % i, y: Math.floor(m / i) }), o = t.from ?? "start", l = Array.isArray(o) ? { x: o[0] * (i - 1), y: o[1] * (s - 1) } : typeof o == "number" ? r(Math.max(0, Math.min(e - 1, o))) : o === "end" ? r(e - 1) : o === "center" || o === "edges" ? { x: (i - 1) / 2, y: (s - 1) / 2 } : { x: 0, y: 0 }, a = (m) => {
    const { x: p, y: g } = r(m), y = Math.abs(p - l.x), b = Math.abs(g - l.y);
    return t.axis === "x" ? y : t.axis === "y" ? b : Math.hypot(y, b);
  };
  let c = Array.from({ length: e }, (m, p) => a(p));
  const h = Math.max(...c);
  if (o === "edges" && (c = c.map((m) => h - m)), o === "random") {
    const m = n.random ?? Math.random;
    c = c.map(() => m() * h);
  }
  const f = t.amount !== void 0 ? t.amount : (t.each ?? 0) * h, u = t.ease ? Xt(t.ease) : void 0, d = u ? u.fn ?? G(u.easing) : void 0;
  return c.map((m) => {
    const p = h === 0 ? 0 : m / h;
    return (d ? d(p) : p) * f;
  });
}
const Le = /* @__PURE__ */ new Set([
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
function Bt(e) {
  const t = {}, n = {};
  for (const [i, s] of Object.entries(e))
    Le.has(i) ? t[i] = s : n[i] = s;
  return { config: t, properties: n };
}
function Wt(e, t) {
  return e === void 0 ? t : e * 1e3;
}
function we(e, t) {
  if (e !== void 0)
    return typeof e == "number" ? { each: e * 1e3 } : cr(e) ? { offsets: hr(t?.count ?? 0, e, t ?? {}).map((i) => i * 1e3) } : {
      ...e.each !== void 0 && { each: e.each * 1e3 },
      ...e.amount !== void 0 && { amount: e.amount * 1e3 },
      ...e.from !== void 0 && { from: e.from }
    };
}
const ur = {
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
function oi(e) {
  return ur[e];
}
function fr(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : e;
  if (!t || typeof t.path != "string" && !Array.isArray(t.path))
    throw new Error("gsap-compat: motionPath needs a path — SVG path data or an array of { x, y } points.");
  let n;
  if (Array.isArray(t.path))
    n = nr(t.path, { curviness: t.curviness });
  else if (Pt(t.path))
    n = t.path;
  else
    throw new Error(
      `gsap-compat: motionPath "${t.path}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  const i = { pathData: n };
  return t.autoRotate !== void 0 && t.autoRotate !== !1 && (i.autoRotate = !0, typeof t.autoRotate == "number" && (i.rotateOffset = t.autoRotate)), t.matrix && (i.matrix = t.matrix), { config: i, start: t.start ?? 0, end: t.end ?? 1 };
}
function dr(e) {
  const t = typeof e == "string" || Array.isArray(e) ? { path: e } : { ...e };
  return { ...t, start: t.end ?? 1, end: t.start ?? 0 };
}
function ai(e) {
  return typeof e == "object" && e !== null && "shape" in e ? e.shape : e;
}
function pr(e) {
  if (e.morphSVG === void 0) return e;
  const { morphSVG: t, ...n } = e, i = ai(t);
  if (typeof i != "string" || !Pt(i))
    throw new Error(
      `gsap-compat: morphSVG "${String(i)}" is not path data. Selectors and elements are resolved by live.to(); timeline() and tf need the path data itself.`
    );
  return { ...n, d: i };
}
function mr(e, t) {
  if (e === !0) return [0, t];
  if (e === !1) return [0, 0];
  if (typeof e == "number") return [0, nn(e, t)];
  const n = e.trim().split(/[\s,]+/).filter(Boolean), i = (o) => {
    const l = Number.parseFloat(o);
    if (Number.isNaN(l)) throw new Error(`gsap-compat: drawSVG "${e}" is not a length or percentage`);
    return nn(o.endsWith("%") ? t * l / 100 : l, t);
  };
  if (n.length === 0) return [0, t];
  if (n.length === 1) return [0, i(n[0])];
  const s = i(n[0]), r = i(n[1]);
  return s <= r ? [s, r] : [r, s];
}
function gr(e, t) {
  const [n, i] = mr(e, t);
  return { strokeDasharray: [i - n, t], strokeDashoffset: -n };
}
function yr(e, t) {
  if (e.drawSVG === void 0) return e;
  const { drawSVG: n, ...i } = e;
  return { ...i, ...gr(n, t) };
}
function br(e) {
  if (e.drawSVG !== void 0)
    throw new Error(
      "gsap-compat: drawSVG needs the stroke length from the page. Use live.to(), or animate strokeDasharray / strokeDashoffset directly (see drawSvgProperties)."
    );
  return e;
}
function nn(e, t) {
  return Math.max(0, Math.min(t, e));
}
function wr(e) {
  let t = 2166136261;
  for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
  return t >>> 0;
}
function vr(e, t, n) {
  if (e.scrambleText !== void 0) {
    const i = e.scrambleText, s = typeof i == "string" ? { text: i } : i;
    if (typeof s?.text != "string")
      throw new Error("gsap-compat: scrambleText needs the text to end on — a string, or { text }.");
    const r = s.revealDelay && n > 0 ? s.revealDelay * 1e3 / n : void 0;
    return {
      to: s.text,
      mode: "scramble",
      ...s.chars !== void 0 && { chars: s.chars },
      ...s.speed !== void 0 && { refreshRate: 20 * s.speed },
      ...r !== void 0 && { revealDelay: Math.min(r, 0.999) },
      ...s.tweenLength !== void 0 && { tweenLength: s.tweenLength },
      ...s.rightToLeft !== void 0 && { rightToLeft: s.rightToLeft },
      seed: s.seed ?? wr(`${t}|${s.text}`)
    };
  }
  if (e.text !== void 0) {
    const i = e.text, s = typeof i == "string" ? { value: i } : i;
    if (typeof s?.value != "string")
      throw new Error("gsap-compat: text needs the text to end on — a string, or { value }.");
    return {
      to: s.value,
      mode: "type",
      ...s.rightToLeft !== void 0 && { rightToLeft: s.rightToLeft }
    };
  }
}
function Fe(e) {
  return Math.max(0.1, e / 25);
}
function Tr(e, t) {
  const n = typeof t == "number" ? { velocity: t } : t;
  if (typeof n?.velocity != "number" || !Number.isFinite(n.velocity))
    throw new Error("gsap-compat: inertia needs a velocity for each property — a number, or { velocity }.");
  const i = n.friction ?? (n.resistance !== void 0 ? Fe(n.resistance) : void 0), s = {
    from: e,
    velocity: n.velocity,
    ...i !== void 0 && { friction: i },
    ...n.min !== void 0 && { min: n.min },
    ...n.max !== void 0 && { max: n.max }
  };
  return typeof n.end == "function" ? s.end = [n.end(Yt(s))] : n.end !== void 0 && (s.end = Array.isArray(n.end) ? [...n.end] : n.end), s;
}
function xr(e) {
  const t = e === !0 ? {} : typeof e == "string" ? { preset: e } : e;
  if (t.preset !== void 0 && !(t.preset in Jt))
    throw new Error(
      `gsap-compat: unknown spring preset "${t.preset}" — use one of ${Object.keys(Jt).join(", ")}`
    );
  return {
    ...t.preset ? Jt[t.preset] : {},
    ...t.stiffness !== void 0 && { stiffness: t.stiffness },
    ...t.damping !== void 0 && { damping: t.damping },
    ...t.mass !== void 0 && { mass: t.mass },
    ...t.restDelta !== void 0 && { restDelta: t.restDelta }
  };
}
function kr(e, t) {
  if (e === !0 || typeof e == "string") return;
  const n = e.velocity;
  return typeof n == "number" ? n : n?.[t];
}
class at {
  /** The engine timeline. Use it for anything the facade does not cover. */
  timeline;
  options;
  cursor = 0;
  fallbackRandom = be(1);
  previousStart = 0;
  previousEnd = 0;
  labels = /* @__PURE__ */ new Map();
  trackCounter = 0;
  /** Last authored value per "target|property", for the resolution chain. */
  lastValues = /* @__PURE__ */ new Map();
  constructor(t = {}) {
    this.options = t, this.timeline = new Gn({
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
  to(t, n, i) {
    return this.build(t, void 0, gt(n), i);
  }
  /** Animate from the given values to where the property already is. */
  from(t, n, i) {
    const { config: s, properties: r } = Bt(gt(n)), { motionPath: o, text: l, scrambleText: a, ...c } = r, h = this.targetsOf(t)[0], f = { ...s };
    for (const m of Object.keys(c))
      f[m] = this.resolveStart(h, m);
    o !== void 0 && (f.motionPath = dr(o));
    const u = {}, d = String(this.resolveStart(h, "text"));
    return l !== void 0 && (u.text = ae(l), f.text = typeof l == "object" ? { ...l, value: d } : d), a !== void 0 && (u.text = ae(a), f.scrambleText = typeof a == "object" ? { ...a, text: d } : d), this.build(t, { ...c, ...u }, f, i);
  }
  /** Animate between two explicit sets of values. */
  fromTo(t, n, i, s) {
    const { properties: r } = Bt(gt(n));
    return this.build(t, r, gt(i), s);
  }
  /** Set values instantly — a single held keyframe. */
  set(t, n, i) {
    return this.build(t, void 0, { ...gt(n), duration: 0 }, i);
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
    const n = Math.max(0, mt(t, this.context()));
    return this.previousStart = n, this.previousEnd = n, this.cursor = Math.max(this.cursor, n), n;
  }
  /** Resolve a position (seconds, label, relative) to milliseconds without adding anything. */
  timeOf(t) {
    return mt(t, this.context());
  }
  /** Name a point in time, for use as a position parameter. */
  addLabel(t, n) {
    return this.labels.set(t, mt(n, this.context())), this;
  }
  /** Time of a label, in milliseconds. */
  /** Every label's time in milliseconds, in time order. */
  labelTimes() {
    return [...this.labels.values()].sort((t, n) => t - n);
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
  add(t, n) {
    const i = mt(n, this.context());
    for (const r of t.timeline.tracks) {
      if (!("keyframes" in r)) continue;
      const o = ye({
        ...r,
        id: this.nextTrackId(`nested-${r.id}`),
        keyframes: r.keyframes.map((l) => ({ ...l, time: l.time + i }))
      });
      this.timeline.addTrack(o);
    }
    const s = i + t.timeline.duration;
    return this.previousStart = i, this.previousEnd = s, this.cursor = Math.max(this.cursor, s), this;
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
      const n = this.labels.get(t);
      return n !== void 0 && this.timeline.seek(n), this;
    }
    return this.timeline.seek(t * 1e3), this;
  }
  /** Progress through the timeline, 0..1. */
  progress(t) {
    const n = this.timeline.duration;
    return t !== void 0 && n > 0 && this.timeline.seek(t * n), n > 0 ? this.timeline.currentTime / n : 0;
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
  build(t, n, i, s) {
    const { config: r, properties: o } = Bt(i), { motionPath: l, text: a, scrambleText: c, inertia: h, ...f } = o, u = this.targetsOf(t), d = mt(s, this.context()), m = Wt(r.delay, 0), p = Wt(r.duration, 500), g = we(r.stagger, {
      count: u.length,
      columnsFromLayout: this.options.layoutColumns ? () => this.options.layoutColumns(u) : void 0,
      random: this.options.random ?? this.fallbackRandom
    }), y = this.easingFor(r.ease), b = [], w = r.spring;
    let T = 0, v = !1;
    for (const [k, A] of Object.entries(f)) {
      const E = A;
      let P = n?.[k] !== void 0 ? n[k] : this.resolveStart(u[0], k);
      if (typeof P != typeof E && (this.warn(
        `no usable start value for "${k}" on "${u[0]}" — it will snap to ${String(E)}. Use fromTo() to animate it.`
      ), P = E), w !== void 0 && (typeof P != "number" || typeof E != "number") && this.warn(`spring works on numbers, so "${k}" on "${u[0]}" eases instead`), w !== void 0 && typeof P == "number" && typeof E == "number") {
        const F = {
          ...xr(w),
          from: P,
          to: E,
          velocity: kr(w, k) ?? this.options.startVelocity?.(u[0], k) ?? 0
        }, N = this.nextTrackId(`${u[0]}-${k}-spring`), O = {
          id: N,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: k,
          kind: "spring",
          spring: F,
          delay: d + m
        };
        this.timeline.addTrack(O), b.push(N), T = Math.max(T, Xi(F));
        for (const L of u) this.lastValues.set(`${L}|${k}`, E);
        continue;
      }
      v = !0;
      const M = this.keyframesFor(P, E, p, y, r.ease), I = this.nextTrackId(`${u[0]}-${k}`);
      this.timeline.addTrack(
        ye({
          id: I,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: k,
          delay: d + m,
          keyframes: M
        })
      ), b.push(I);
      for (const F of u) this.lastValues.set(`${F}|${k}`, E);
    }
    const x = vr({ text: a, scrambleText: c }, u[0], p);
    if (x) {
      const k = n?.text ?? n?.scrambleText, A = k !== void 0 ? ae(k) : this.resolveStart(u[0], "text"), E = this.nextTrackId(`${u[0]}-text`), P = {
        id: E,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "text",
        textConfig: { from: typeof A == "string" ? A : String(A ?? ""), ...x },
        delay: d + m,
        keyframes: this.keyframesFor(0, 1, p, y, r.ease)
      };
      this.timeline.addTrack(P), b.push(E);
      for (const M of u) this.lastValues.set(`${M}|text`, x.to);
    }
    if (l !== void 0) {
      const { config: k, start: A, end: E } = fr(l), P = this.nextTrackId(`${u[0]}-motionPath`), M = {
        id: P,
        target: u[0],
        ...u.length > 1 && { targets: u },
        ...g && u.length > 1 && { stagger: g },
        property: "motionPath",
        motionPathConfig: k,
        delay: d + m,
        keyframes: this.keyframesFor(A, E, p, y, r.ease)
      };
      this.timeline.addTrack(M), b.push(P);
    }
    if (h !== void 0)
      for (const [k, A] of Object.entries(h)) {
        const E = this.resolveStart(u[0], k);
        if (typeof E != "number") {
          this.warn(`inertia on "${k}" needs a numeric start value; skipped`);
          continue;
        }
        const P = Tr(E, A), M = this.nextTrackId(`${u[0]}-${k}-inertia`), I = {
          id: M,
          target: u[0],
          ...u.length > 1 && { targets: u },
          ...g && u.length > 1 && { stagger: g },
          property: k,
          kind: "inertia",
          inertia: P,
          delay: d + m
        };
        this.timeline.addTrack(I), b.push(M), T = Math.max(T, Et(P));
        for (const F of u) this.lastValues.set(`${F}|${k}`, At(P));
      }
    const R = ((h !== void 0 || w !== void 0) && !v && !x && l === void 0 ? T : Math.max(p, T)) + (g && u.length > 1 ? zt(u.length, g) : 0), _ = d + m + R;
    return this.previousStart = d + m, this.previousEnd = _, this.cursor = Math.max(this.cursor, _), {
      trackIds: b,
      start: d + m,
      end: _,
      kill: () => {
        for (const k of b) this.timeline.removeTrack(k);
      }
    };
  }
  /**
   * Two keyframes, or a baked sequence when the ease has no closed form.
   */
  keyframesFor(t, n, i, s, r) {
    const o = { time: 0, value: t };
    if (i <= 0)
      return [{ time: 0, value: n }];
    const l = typeof r == "string" ? Xt(r) : void 0;
    if (l?.requiresBaking === "custom" || this.options.bakeEases && Ot(s)) {
      const c = l?.fn ?? G(s);
      return [o, ...zn(o, { time: i, value: n }, c, { intervalMs: this.options.bakeIntervalMs })];
    }
    return [o, { time: i, value: n, ...s && { easing: s } }];
  }
  /** Resolve a start value through the documented chain. */
  resolveStart(t, n) {
    const i = this.lastValues.get(`${t}|${n}`);
    if (i !== void 0) return i;
    const s = this.options.startValue?.(t, n);
    if (s !== void 0) return s;
    const r = this.options.defaults?.[n];
    if (r !== void 0) return r;
    if (n === "text") return "";
    if (n === "d")
      throw new Error(
        `gsap-compat: no starting shape for "${t}". Use fromTo({ d: … }, { morphSVG: … }), or live.to(), which reads the element's current shape.`
      );
    const o = oi(n);
    return o !== void 0 ? (this.warn(
      `no start value for "${n}" on "${t}" — using the static default ${o}. GSAP would read the live DOM here; tinyfly cannot, so pass an explicit fromTo() or a defaults map.`
    ), o) : (this.warn(`no start value or default for "${n}" on "${t}" — using 0`), 0);
  }
  easingFor(t) {
    if (t !== void 0) {
      if (typeof t == "string") return Xt(t).easing;
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
function ae(e) {
  if (typeof e == "string") return e;
  if (e && typeof e == "object") {
    const t = e;
    return String(t.value ?? t.text ?? "");
  }
  return String(e ?? "");
}
function Sr(e) {
  return new at(e);
}
function gt(e) {
  return br(pr(e));
}
const Mr = /* @__PURE__ */ new Set([
  "blur",
  "brightness",
  "glow",
  "glowColor",
  "shadowX",
  "shadowY",
  "shadowBlur",
  "shadowColor"
]), Ar = "#ffffff", Er = "rgba(0, 0, 0, 0.5)";
function Pr(e) {
  const t = [];
  if (e.blur !== void 0 && t.push(`blur(${Math.max(0, e.blur)}px)`), e.brightness !== void 0 && t.push(`brightness(${Math.max(0, e.brightness)})`), e.glow !== void 0 && t.push(`drop-shadow(0 0 ${Math.max(0, e.glow)}px ${e.glowColor ?? Ar})`), e.shadowX !== void 0 || e.shadowY !== void 0 || e.shadowBlur !== void 0) {
    const n = e.shadowX ?? 0, i = e.shadowY ?? 0, s = Math.max(0, e.shadowBlur ?? 0);
    t.push(`drop-shadow(${n}px ${i}px ${s}px ${e.shadowColor ?? Er})`);
  }
  return t.length > 0 ? t.join(" ") : null;
}
function _r(e, t) {
  const n = e.childNodes.length === 1 ? e.firstChild : null;
  if (n && n.nodeType === 3) {
    const i = n;
    i.data !== t && (i.data = t);
    return;
  }
  e.textContent !== t && (e.textContent = t);
}
function Cr(e) {
  if (!("ownerSVGElement" in e)) return;
  const t = e.style;
  !t || t.transformBox || (t.transformBox = "fill-box", t.transformOrigin || (t.transformOrigin = "50% 50%"));
}
const sn = /* @__PURE__ */ new Set([
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
]), Ir = /* @__PURE__ */ new Set([
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
]), Rr = /* @__PURE__ */ new Set(["originX", "originY"]), Lr = /* @__PURE__ */ new Set(["clipTop", "clipRight", "clipBottom", "clipLeft"]), Fr = /* @__PURE__ */ new Set(["drawOn"]), $r = {
  fill: "backgroundColor",
  stroke: "borderColor",
  strokeWidth: "borderWidth",
  color: "color",
  backgroundColor: "backgroundColor",
  borderColor: "borderColor"
}, rn = {
  fill: "fill",
  stroke: "stroke",
  strokeWidth: "strokeWidth",
  strokeDasharray: "strokeDasharray",
  strokeDashoffset: "strokeDashoffset",
  fillOpacity: "fillOpacity",
  strokeOpacity: "strokeOpacity"
}, Dr = "http://www.w3.org/2000/svg";
class tt {
  targets = /* @__PURE__ */ new Map();
  /**
   * Register an HTML element as an animation target.
   */
  registerTarget(t, n) {
    this.targets.set(t, n);
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
    for (const [n, i] of t.values) {
      const s = this.targets.get(n);
      s && this.applyProperties(s, i);
    }
  }
  /**
   * Apply properties to a single element.
   */
  applyProperties(t, n) {
    const i = [];
    let s = null, r = null, o = null;
    const l = n.has("motionPathX"), a = n.has("motionPathY"), c = n.has("motionPathRotate");
    for (const [u, d] of n)
      if (!(u === "x" && l) && !(u === "y" && a) && !((u === "rotate" || u === "rotateZ") && c) && !Fr.has(u)) {
        if (Ir.has(u)) {
          const m = this.buildTransformPart(u, d);
          m && i.push(m);
        } else if (Rr.has(u))
          typeof d == "number" && ((s ??= {})[u] = d);
        else if (Lr.has(u))
          typeof d == "number" && ((r ??= {})[u] = d);
        else if (Mr.has(u))
          (o ??= {})[u] = d;
        else if (u !== "perspective") {
          if (u !== "shine") if (u === "text" && typeof d == "string")
            _r(t, d);
          else if (u === "d" && typeof d == "string") {
            const m = t;
            (m.tagName?.toLowerCase() === "path" ? m : m.querySelector?.("path"))?.setAttribute?.("d", d);
          } else
            this.applyStyleProperty(t, u, d);
        }
      }
    const h = n.get("shine");
    typeof h == "number" && this.applyShine(t, h);
    const f = n.get("perspective");
    if (typeof f == "number" && i.unshift(`perspective(${f}px)`), i.length > 0 && (t.style.transform = i.join(" "), Cr(t)), s) {
      const u = s.originX ?? 50, d = s.originY ?? 50;
      t.style.transformOrigin = `${u}% ${d}%`;
    }
    if (r) {
      const u = r.clipTop ?? 0, d = r.clipRight ?? 0, m = r.clipBottom ?? 0, p = r.clipLeft ?? 0;
      t.style.clipPath = `inset(${u}% ${d}% ${m}% ${p}%)`;
    }
    if (o) {
      const u = Pr(o);
      u && (t.style.filter = u);
    }
  }
  /**
   * Build a transform function string for a property.
   */
  buildTransformPart(t, n) {
    if (typeof n != "number") return null;
    switch (t) {
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
  applyShine(t, n) {
    t.dataset.shineBase || (t.dataset.shineBase = t.style.color || "currentColor");
    const i = t.dataset.shineBase, s = -20 + n * 140, r = t.style;
    r.color = "transparent", r.backgroundImage = `linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.9) 50%, transparent 60%), linear-gradient(${i}, ${i})`, r.backgroundSize = "250% 100%, 100% 100%", r.backgroundPosition = `${s}% 0, 0 0`, r.backgroundRepeat = "no-repeat", r.webkitBackgroundClip = "text", r.backgroundClip = "text";
  }
  /**
   * Apply a single style property to an element.
   */
  applyStyleProperty(t, n, i) {
    let s;
    if (t.namespaceURI === Dr && n in rn) {
      const l = Array.isArray(i) ? i.join(", ") : String(i);
      t.style[rn[n]] = l;
      return;
    } else n === "fill" && t.dataset?.elementType === "text" ? s = "color" : s = $r[n] ?? n;
    let o;
    typeof i == "number" ? sn.has(n) || sn.has(s) ? o = `${i}px` : o = String(i) : Array.isArray(i) ? o = i.join(", ") : o = i, t.style[s] = o;
  }
}
const Br = {
  request: (e) => requestAnimationFrame(e),
  cancel: (e) => cancelAnimationFrame(e)
};
class Or {
  adapter = new tt();
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
  utils = rr();
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
    this.scheduler = t.scheduler ?? Br, this.rootOption = t.root, this.onWarning = t.onWarning;
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
    const n = [];
    for (const i of this.targetsOf(t)) {
      const s = this.nameFor(i);
      le(i) && this.currentCollector?.touch(i, s), n.push(s);
    }
    return n;
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
  appliedValue(t, n) {
    return this.applied.get(t)?.get(n);
  }
  /**
   * How fast a property is changing right now, in units per second, taken from
   * the most recently played timeline that animates it — so a spring started
   * mid-motion carries the momentum. A finite difference over a few milliseconds
   * of that timeline's own (deterministic) state; undefined when nothing playing
   * animates the property.
   */
  velocityOf(t, n) {
    for (const s of [...this.active.keys()].reverse()) {
      if (s.getTracks({ target: t, property: n }).length === 0) continue;
      const r = s.currentTime;
      if (r < 4) return 0;
      const o = s.getStateAtTime(r).values.get(t)?.get(n), l = s.getStateAtTime(r - 4).values.get(t)?.get(n);
      if (typeof o != "number" || typeof l != "number") return;
      const a = (o - l) / 4;
      return (s.direction === "reverse" ? -a : a) * 1e3;
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
  activate(t, n = {}) {
    this.destroyed || (t.onUpdate = (i) => this.write(i), this.active.delete(t), this.active.set(t, n), this.startLoop());
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
  apply(t, n) {
    if (this.destroyed) return;
    const i = new Map(Object.entries(n));
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
    const n = [...this.active];
    for (const [i] of n)
      i.duration <= 0 ? (this.write(i.getStateAtTime(0)), i.stop()) : i.tick(t);
    this.flush();
    for (const [i, s] of n)
      s.onUpdate?.(), i.playbackState !== "playing" && this.active.get(i) === s && this.active.delete(i);
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
      for (const n of [...this.tickerCallbacks])
        n(this.tickerTime / 1e3, t, this.tickerFrame);
    }
  }
  write(t) {
    for (const [n, i] of t.values) {
      let s = this.applied.get(n);
      s || (s = /* @__PURE__ */ new Map(), this.applied.set(n, s));
      for (const [r, o] of i) s.set(r, o);
      this.dirty.add(n);
    }
  }
  flush() {
    if (this.dirty.size === 0) return;
    const t = /* @__PURE__ */ new Map();
    for (const n of this.dirty) {
      const i = this.applied.get(n), s = this.objects.get(n);
      if (s)
        for (const [r, o] of i) s[r] = o;
      else
        t.set(n, i);
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
    const n = this.lastTimestamp === null ? 0 : t - this.lastTimestamp;
    this.lastTimestamp = t, n > 0 && this.tick(n), this.running && this.frameId === null && (this.frameId = this.scheduler.request(this.frame));
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
    if (le(t)) return [t];
    if (!Nr(t)) return [t];
    const n = [];
    for (const i of Array.from(t))
      n.push(...this.targetsOf(i));
    return n;
  }
  nameFor(t) {
    return le(t) ? this.elementName(t) : this.objectName(t);
  }
  objectName(t) {
    const n = this.objectNames.get(t);
    if (n) return n;
    let i;
    do
      this.nameCounter += 1, i = `obj-${this.nameCounter}`;
    while (this.objects.has(i) || this.elements.has(i));
    return this.objectNames.set(t, i), this.objects.set(i, t), i;
  }
  elementName(t) {
    const n = this.names.get(t);
    if (n) return n;
    let i = t.id ? `#${t.id}` : "";
    if (!i || this.elements.has(i))
      do
        this.nameCounter += 1, i = `el-${this.nameCounter}`;
      while (this.elements.has(i));
    return this.names.set(t, i), this.elements.set(i, t), this.adapter.registerTarget(i, t), i;
  }
}
function le(e) {
  return typeof e == "object" && e !== null && e.nodeType === 1;
}
function Nr(e) {
  if (Array.isArray(e)) return !0;
  const t = e;
  return typeof t.length == "number" && typeof t.item == "function";
}
function Vt(e) {
  const t = e.style;
  if (!t) return e.getBoundingClientRect();
  const n = t.transform;
  t.transform = "none";
  const i = e.getBoundingClientRect();
  return t.transform = n, i;
}
const on = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function Yr(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function qr(e) {
  const t = e.getScreenCTM?.();
  if (t) return [t.a, t.b, t.c, t.d, t.e, t.f];
  const n = e.getBoundingClientRect();
  return [1, 0, 0, 1, n.left, n.top];
}
function Xr(e, t) {
  const n = typeof e == "string" || Array.isArray(e) || on(e) ? { path: e } : e, { align: i, alignOrigin: s, path: r, ...o } = n, l = (x) => {
    const S = on(x) ? x : t.query(x);
    return S || t.warn(`gsap-compat: motionPath could not find "${String(x)}"`), S;
  };
  let a = null, c = "";
  if (Array.isArray(r) || typeof r == "string" && Pt(r))
    c = r;
  else {
    a = l(r);
    const x = a && Ie({ tag: a.localName, attributes: Yr(a) });
    a && !x && t.warn(`gsap-compat: motionPath element <${a.localName}> has no path geometry`), c = x ?? "";
  }
  const h = { ...o, path: c };
  if (i === void 0 || i === !1) return h;
  const f = i === !0 ? a : l(i);
  if (!f)
    return i === !0 && t.warn("gsap-compat: motionPath align: true needs the path to be an element"), h;
  const u = t.targets[0];
  if (!u) return h;
  const [d, m, p, g, y, b] = qr(f), w = Vt(u), [T, v] = s ?? [0.5, 0.5];
  for (const x of t.targets.slice(1)) {
    const S = Vt(x);
    if (Math.abs(S.left - w.left) > 0.5 || Math.abs(S.top - w.top) > 0.5) {
      t.warn("gsap-compat: motionPath align measures the first target; the others are laid out elsewhere");
      break;
    }
  }
  return h.matrix = [d, m, p, g, y - w.left - T * w.width, b - w.top - v * w.height], h;
}
const li = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function ci(e) {
  const t = {};
  for (const n of Array.from(e.attributes)) t[n.name] = n.value;
  return t;
}
function hi(e) {
  if (!e) return null;
  const t = Ie({ tag: e.localName, attributes: ci(e) });
  return t || (e.querySelector("path")?.getAttribute("d") ?? null);
}
function Wr(e, t, n) {
  const i = ai(e);
  if (typeof i == "string" && Pt(i)) return i;
  const s = li(i) ? i : typeof i == "string" ? t(i) : null, r = hi(s);
  return r || (n(`gsap-compat: morphSVG could not find a shape for "${String(i)}"`), "");
}
const Vr = /* @__PURE__ */ new Set(["cx", "cy", "r", "rx", "ry", "x", "y", "width", "height", "x1", "y1", "x2", "y2", "points"]);
function Hr(e, t = document) {
  return (typeof e == "string" ? Array.from(t.querySelectorAll(e)) : li(e) ? [e] : Array.from(e)).map((i) => {
    if (i.localName === "path") return i;
    const s = Ie({ tag: i.localName, attributes: ci(i) });
    if (!s || !i.parentNode) return i;
    const r = i.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
    for (const o of Array.from(i.attributes))
      Vr.has(o.name) || r.setAttribute(o.name, o.value);
    return r.setAttribute("d", s), i.parentNode.replaceChild(r, i), r;
  });
}
const an = 0.3;
class Ur {
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
  begin(t, n, i) {
    this.dragging = !0, this.passedTolerance = !1, this.startX = t, this.startY = n, this.lastX = t, this.lastY = n, this.velocityX = 0, this.velocityY = 0, this.lastTime = ln(), this.options.onPress?.(this.stateFrom(0, 0, i));
  }
  move(t, n, i) {
    if (!this.dragging) return;
    const s = t - this.lastX, r = n - this.lastY;
    this.lastX = t, this.lastY = n;
    const o = t - this.startX, l = n - this.startY, a = this.options.tolerance ?? 3;
    if (!this.passedTolerance) {
      if (Math.hypot(o, l) < a) return;
      this.passedTolerance = !0;
    }
    this.updateVelocity(s, r), this.options.preventDefault !== !1 && i.cancelable && i.preventDefault(), this.options.onMove?.(this.stateFrom(s, r, i));
  }
  end(t) {
    this.dragging && (this.dragging = !1, this.options.onRelease?.(this.stateFrom(0, 0, t)));
  }
  updateVelocity(t, n) {
    const i = ln(), s = Math.max(1, i - this.lastTime);
    this.lastTime = i;
    const r = t / s * 1e3, o = n / s * 1e3;
    this.velocityX += (r - this.velocityX) * an, this.velocityY += (o - this.velocityY) * an;
  }
  stateFrom(t, n, i) {
    return {
      deltaX: t,
      deltaY: n,
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
    const n = t, i = this.target;
    if (typeof n.pointerId == "number" && typeof i.setPointerCapture == "function")
      try {
        i.setPointerCapture(n.pointerId);
      } catch {
      }
    this.begin(n.clientX, n.clientY, t);
  };
  onPointerMove = (t) => {
    const n = t;
    this.move(n.clientX, n.clientY, t);
  };
  onPointerUp = (t) => this.end(t);
  onTouchStart = (t) => {
    const n = t.touches[0];
    n && this.begin(n.clientX, n.clientY, t);
  };
  onTouchMove = (t) => {
    const n = t.touches[0];
    n && this.move(n.clientX, n.clientY, t);
  };
  onTouchEnd = (t) => this.end(t);
  onWheel = (t) => {
    const n = t;
    this.options.preventDefault !== !1 && n.cancelable && n.preventDefault(), this.updateVelocity(n.deltaX, n.deltaY), this.options.onMove?.({
      deltaX: n.deltaX,
      deltaY: n.deltaY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      totalX: 0,
      totalY: 0,
      isDragging: !1,
      event: t
    });
  };
}
function ln() {
  return typeof performance < "u" ? performance.now() : Date.now();
}
function zr(e, t, n) {
  let i = { delta: 0, line: null }, s = n;
  for (const r of e)
    for (const o of t) {
      const l = Math.abs(o - r);
      l <= s && (s = l, i = { delta: o - r, line: o });
    }
  return i;
}
function jr(e, t) {
  return t <= 0 ? [] : e.map((n) => Math.round(n / t) * t);
}
class ui {
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
    this.options = t, this.x = t.initialX ?? 0, this.y = t.initialY ?? 0, this.observer = new Ur({
      target: t.target,
      onPress: (n) => {
        const i = t.getPosition?.();
        i && (this.x = i.x, this.y = i.y), this.originX = this.x, this.originY = this.y, t.onPress?.(n);
      },
      onMove: (n) => this.handleMove(n),
      onRelease: (n) => t.onRelease?.(n)
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
  setPosition(t, n) {
    const i = this.options.axis ?? "both";
    this.x = i === "y" ? this.x : this.applyConstraints(t, "x"), this.y = i === "x" ? this.y : this.applyConstraints(n, "y");
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
    const n = t.duration;
    if (n <= 0) return;
    const i = this.options.scrubDistance ?? 500;
    if (i === 0) return;
    const s = (this.options.axis ?? "both") === "y" ? this.y : this.x, r = Gr(s / i);
    t.pause(), t.seek(r * n);
  }
  /**
   * Apply snapping, then bounds. Snapping uses the shared `snapAxis` helper —
   * the same one the editor stage snaps with — rather than a private rounding
   * rule, so grid and edge snapping behave identically in both places.
   *
   * Bounds are applied last so a snap can never push the target out of range.
   */
  applyConstraints(t, n) {
    let i = t;
    const s = [
      ...jr([i], this.options.snap ?? 0),
      ...(n === "x" ? this.options.snapLinesX : this.options.snapLinesY) ?? []
    ], r = zr([i], s, this.snapThreshold());
    i += r.delta, n === "x" ? this.snappedX = r.line : this.snappedY = r.line;
    const o = this.options.bounds;
    if (o) {
      const l = n === "x" ? o.minX : o.minY, a = n === "x" ? o.maxX : o.maxY;
      l !== void 0 && (i = Math.max(l, i)), a !== void 0 && (i = Math.min(a, i));
    }
    return i;
  }
}
function Gr(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e;
}
function dl(e) {
  const t = new ui(e);
  return t.start(), t;
}
const Kr = { x: "x", y: "y", "x,y": "both" }, ve = (e) => typeof e == "object" && e !== null && e.nodeType === 1;
function cn(e, t) {
  const n = Vt(e), i = t.getBoundingClientRect();
  return {
    minX: i.left - n.left,
    maxX: i.right - n.right,
    minY: i.top - n.top,
    maxY: i.bottom - n.bottom
  };
}
function hn(e) {
  return Array.isArray(e) ? [...e] : e;
}
function Zr(e, t, n, i = {}) {
  const [s] = t.resolveTargets(n), r = s ? t.elementFor(s) : void 0;
  if (!s || !r)
    throw new Error(`gsap-compat: live.draggable could not find ${String(n)}`);
  if (i.type === "rotation") return Qr(e, t, s, r, i);
  const o = Kr[i.type ?? "x,y"], l = () => {
    const p = t.appliedValue(s, "x"), g = t.appliedValue(s, "y");
    return { x: typeof p == "number" ? p : 0, y: typeof g == "number" ? g : 0 };
  }, a = typeof i.bounds == "string" ? t.query(i.bounds) : ve(i.bounds) ? i.bounds : null, h = { bounds: (!a && i.bounds && !ve(i.bounds) ? i.bounds : void 0) ?? (a ? cn(r, a) : void 0) };
  let f = null;
  const u = () => {
    f?.kill(), f = null;
  }, d = (p) => {
    const g = i.inertia === !0 ? {} : i.inertia, y = g.friction ?? (g.resistance !== void 0 ? Fe(g.resistance) : 4), b = l(), w = h.bounds ?? {};
    let T, v;
    const x = g.end;
    if (Array.isArray(x)) {
      const C = Yt({ from: b.x, velocity: o === "y" ? 0 : p.x, friction: y }), R = Yt({ from: b.y, velocity: o === "x" ? 0 : p.y, friction: y });
      let _ = x[0];
      for (const k of x)
        Math.hypot(k.x - C, k.y - R) < Math.hypot(_.x - C, _.y - R) && (_ = k);
      _ && (T = [_.x], v = [_.y]);
    } else typeof x == "number" ? (T = x, v = x) : x && (T = hn(x.x), v = hn(x.y));
    const S = {};
    o !== "y" && (S.x = { velocity: p.x, friction: y, min: w.minX, max: w.maxX, end: T }), o !== "x" && (S.y = { velocity: p.y, friction: y, min: w.minY, max: w.maxY, end: v }), f = e.to(r, { inertia: S, onComplete: () => i.onThrowComplete?.() });
  }, m = new ui({
    target: r,
    axis: o,
    snap: i.snap,
    get bounds() {
      return h.bounds;
    },
    getPosition: l,
    onPress: () => {
      u(), a && (h.bounds = cn(r, a)), i.onPress?.();
    },
    onDrag: (p) => {
      t.apply(s, o === "x" ? { x: p.x } : o === "y" ? { y: p.y } : { x: p.x, y: p.y }), i.onDrag?.(p);
    },
    onRelease: () => {
      const p = m.velocity;
      i.onRelease?.(p), i.inertia && d(p);
    }
  });
  return m.start(), {
    draggable: m,
    get position() {
      return l();
    },
    get rotation() {
      const p = t.appliedValue(s, "rotate");
      return typeof p == "number" ? p : 0;
    },
    destroy() {
      u(), m.destroy();
    }
  };
}
function Qr(e, t, n, i, s) {
  const r = typeof s.bounds == "object" && s.bounds !== null && !ve(s.bounds) ? s.bounds : {}, o = () => {
    const w = t.appliedValue(n, "rotate");
    return typeof w == "number" ? w : 0;
  }, l = (w) => Math.min(r.maxRotation ?? 1 / 0, Math.max(r.minRotation ?? -1 / 0, w));
  let a = null, c = !1, h, f = { x: 0, y: 0 }, u = 0, d = 0, m = [];
  const p = (w) => Math.atan2(w.clientY - f.y, w.clientX - f.x) * 180 / Math.PI, g = (w) => {
    if (c) return;
    a?.kill(), a = null, c = !0, h = w.pointerId, i.setPointerCapture?.(w.pointerId);
    const T = i.getBoundingClientRect();
    f = { x: T.left + T.width / 2, y: T.top + T.height / 2 }, u = p(w), d = o(), m = [{ time: performance.now(), rotation: d }], s.onPress?.();
  }, y = (w) => {
    if (!c || w.pointerId !== h) return;
    const T = p(w);
    let v = T - u;
    v > 180 && (v -= 360), v < -180 && (v += 360), u = T, d += v;
    let x = l(d);
    s.snap && (x = l(Math.round(x / s.snap) * s.snap)), t.apply(n, { rotate: x });
    const S = performance.now();
    for (m.push({ time: S, rotation: x }); m.length > 2 && S - m[0].time > 100; ) m.shift();
    const C = { x: 0, y: 0 };
    s.onDrag?.(C);
  }, b = (w) => {
    if (!c || w.pointerId !== h) return;
    c = !1;
    const T = m[0], v = m[m.length - 1], x = T && v ? (v.time - T.time) / 1e3 : 0, S = x > 0 ? (v.rotation - T.rotation) / x : 0;
    if (s.onRelease?.({ x: S, y: 0 }), !s.inertia) return;
    const C = s.inertia === !0 ? {} : s.inertia, R = C.friction ?? (C.resistance !== void 0 ? Fe(C.resistance) : 4), _ = typeof C.end == "number" || Array.isArray(C.end) ? C.end : void 0;
    a = e.to(i, {
      inertia: {
        rotate: {
          velocity: S,
          friction: R,
          min: r.minRotation,
          max: r.maxRotation,
          end: Array.isArray(_) ? _.filter((k) => typeof k == "number") : _
        }
      },
      onComplete: () => s.onThrowComplete?.()
    });
  };
  return i.addEventListener("pointerdown", g), i.addEventListener("pointermove", y), i.addEventListener("pointerup", b), i.addEventListener("pointercancel", b), i.style.touchAction = "none", {
    draggable: void 0,
    position: { x: 0, y: 0 },
    get rotation() {
      return o();
    },
    destroy() {
      a?.kill(), i.removeEventListener("pointerdown", g), i.removeEventListener("pointermove", y), i.removeEventListener("pointerup", b), i.removeEventListener("pointercancel", b);
    }
  };
}
const Jr = { opacity: 0, scale: 0.6 };
function to(e) {
  const t = e.getBoundingClientRect();
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function un(e) {
  const t = Vt(e);
  return t.width === 0 && t.height === 0 ? null : { cx: t.left + t.width / 2, cy: t.top + t.height / 2, width: t.width, height: t.height };
}
function Te(e, t) {
  const i = e.resolveTargets(t).map((o) => e.elementFor(o)).filter((o) => !!o), s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
  for (const o of i) {
    const l = to(o);
    s.set(o, l);
    const a = fi(o);
    l && a !== void 0 && !r.has(a) && r.set(a, { element: o, box: l });
  }
  return { elements: i, boxes: s, ids: r };
}
const ce = /* @__PURE__ */ new WeakMap();
function xe(e, t, n, i = {}) {
  const s = i.duration ?? 0.6, r = i.ease ?? "power2.inOut", o = i.stagger ?? 0, l = i.scale !== !1, a = i.enter === void 0 ? Jr : i.enter, c = new Set(n.elements);
  if (i.targets !== void 0)
    for (const d of e.resolveTargets(i.targets)) {
      const m = e.elementFor(d);
      m && c.add(m);
    }
  const h = [...c].sort(
    (d, m) => d === m ? 0 : d.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  ), f = t({ onComplete: i.onComplete });
  let u = 0;
  for (const d of h) {
    const m = un(d);
    if (!m) continue;
    let p = n.boxes.get(d) ?? null, g;
    const y = fi(d), b = !p && y !== void 0 ? n.ids.get(y) : void 0;
    b && b.element !== d && (p = b.box, g = b.element);
    const [w] = e.resolveTargets(d);
    ce.get(d)?.timeline.removeTracks({ target: w });
    const T = u * o;
    if (!p) {
      if (a === !1) continue;
      f.fromTo(d, { x: 0, y: 0, scaleX: 1, scaleY: 1, ...a }, { ...di(a), x: 0, y: 0, scaleX: 1, scaleY: 1, duration: s, ease: r, delay: T }, 0), ce.set(d, f), u++;
      continue;
    }
    const v = p.cx - m.cx, x = p.cy - m.cy, S = l ? p.width / m.width : 1, C = l ? p.height / m.height : 1;
    if (!(Math.abs(v) > 0.5 || Math.abs(x) > 0.5 || Math.abs(S - 1) > 1e-3 || Math.abs(C - 1) > 1e-3)) {
      const k = (A, E) => {
        const P = e.appliedValue(w, A);
        return typeof P == "number" && Math.abs(P - E) > 1e-6;
      };
      (k("x", 0) || k("y", 0) || k("scaleX", 1) || k("scaleY", 1)) && f.set(d, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, 0);
      continue;
    }
    const _ = i.fade === !0 && g !== void 0;
    f.fromTo(
      d,
      { x: v, y: x, scaleX: S, scaleY: C, ..._ && { opacity: 0 } },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, ..._ && { opacity: 1 }, duration: s, ease: r, delay: T },
      0
    ), _ && g && un(g) && f.fromTo(g, { opacity: 1 }, { opacity: 0, duration: s, ease: r, delay: T }, 0), ce.set(d, f), u++;
  }
  return f;
}
function fi(e) {
  return e.dataset?.flipId;
}
function di(e) {
  const t = {};
  for (const n of Object.keys(e))
    t[n] = n === "opacity" || n.startsWith("scale") ? 1 : 0;
  return t;
}
function eo(e, t = {}) {
  const n = new Set((t.type ?? "chars,words,lines").split(",").map((p) => p.trim())), i = {
    chars: t.charsClass ?? "char",
    words: t.wordsClass ?? "word",
    lines: t.linesClass ?? "line"
  }, s = t.aria !== !1, r = e.map((p) => ({
    element: p,
    html: p.innerHTML,
    ariaLabel: p.getAttribute("aria-label")
  }));
  let o = { chars: [], words: [], lines: [], masks: [] }, l, a, c = !1;
  const h = () => {
    for (const { element: p, html: g, ariaLabel: y } of r)
      p.innerHTML = g, y === null ? p.removeAttribute("aria-label") : p.setAttribute("aria-label", y);
  }, f = () => {
    l && (l.revert ? l.revert() : l.kill?.(), l = void 0);
  }, u = () => {
    const p = { chars: [], words: [], lines: [], masks: [] };
    for (const { element: g } of r) {
      const y = (g.textContent ?? "").replace(/\s+/g, " ").trim(), b = no(g, i.words), w = n.has("chars") ? b.flatMap((x) => io(x, i.chars)) : [], T = n.has("lines") ? ro(g, b, i.lines) : [];
      if (s) {
        !g.hasAttribute("aria-label") && y && g.setAttribute("aria-label", y);
        for (const x of b) x.setAttribute("aria-hidden", "true");
      }
      if (n.has("words")) p.words.push(...b);
      else for (const x of b) x.removeAttribute("class");
      p.chars.push(...w), p.lines.push(...T);
      const v = t.mask === "lines" ? T : t.mask === "words" ? b : t.mask === "chars" ? w : [];
      for (const x of v) p.masks.push(oo(x, `${i[t.mask]}-mask`));
    }
    o = p;
  }, d = {
    elements: e,
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
      c || (f(), h(), u(), l = t.onSplit?.(d));
    },
    revert() {
      c = !0, a?.disconnect(), f(), h();
    }
  };
  u(), l = t.onSplit?.(d), t.autoSplit && m();
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
      a = new ResizeObserver((w) => {
        let T = !1;
        for (const v of w) {
          const x = Math.round(v.contentRect.width), S = p.get(v.target);
          p.set(v.target, x), S !== void 0 && S !== x && (T = !0);
        }
        T && y();
      });
      for (const w of e) a.observe(w);
    }
    const b = e[0]?.ownerDocument?.fonts;
    b && b.status !== "loaded" && b.ready.then(() => y());
  }
  return d;
}
function no(e, t) {
  const n = e.ownerDocument, i = [], s = n.createTreeWalker(
    e,
    4
    /* NodeFilter.SHOW_TEXT */
  ), r = [];
  for (let o = s.nextNode(); o; o = s.nextNode()) r.push(o);
  for (const o of r) {
    const l = o.data.match(/\s+|\S+/g) ?? [];
    if (l.length === 0) continue;
    const a = n.createDocumentFragment();
    for (const c of l) {
      if (/^\s/.test(c)) {
        a.appendChild(n.createTextNode(c));
        continue;
      }
      const h = n.createElement("span");
      h.className = t, h.style.display = "inline-block", h.textContent = c, a.appendChild(h), i.push(h);
    }
    o.replaceWith(a);
  }
  return i;
}
function io(e, t) {
  const n = e.ownerDocument, i = so(e.textContent ?? "").map((s) => {
    const r = n.createElement("span");
    return r.className = t, r.style.display = "inline-block", r.textContent = s, r;
  });
  return e.replaceChildren(...i), i;
}
function so(e) {
  const t = Intl.Segmenter;
  return t ? Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (n) => n.segment) : Array.from(e);
}
function ro(e, t, n) {
  const i = e.ownerDocument, s = new Map(t.map((m) => [m, m.getBoundingClientRect()])), r = [], o = (m) => {
    for (const p of Array.from(m.childNodes))
      p.nodeType === 3 || s.has(p) || p.tagName === "BR" ? r.push(p) : o(p);
  };
  o(e);
  const l = [];
  let a = null, c = 0, h = 0, f = !1, u = [];
  const d = () => {
    a = i.createElement("span"), a.className = n, a.style.display = "block", l.push(a), u = [];
  };
  for (const m of r) {
    if (m.tagName === "BR") {
      f = !0;
      continue;
    }
    const p = s.get(m);
    if (p && (!a || f || p.top > c + h) && (d(), c = p.top, h = p.height / 2, f = !1), !a) continue;
    const g = [];
    for (let w = m.parentNode; w && w !== e; w = w.parentNode) g.unshift(w);
    let y = 0;
    for (; y < u.length && y < g.length && u[y].original === g[y]; ) y++;
    u.length = y;
    let b = y === 0 ? a : u[y - 1].clone;
    for (const w of g.slice(y)) {
      const T = w.cloneNode(!1);
      b.appendChild(T), u.push({ original: w, clone: T }), b = T;
    }
    b.appendChild(m);
  }
  return e.replaceChildren(...l), l;
}
function oo(e, t) {
  const n = e.ownerDocument.createElement("span");
  return n.className = t, n.style.display = e.style.display === "block" ? "block" : "inline-block", n.style.overflow = "clip", n.style.paddingBottom = "0.12em", n.style.marginBottom = "-0.12em", e.replaceWith(n), n.appendChild(e), n;
}
const fn = {
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
function dn(e) {
  const t = e.trim().toLowerCase();
  if (t in fn) return fn[t];
  if (t.endsWith("%")) {
    const n = Number.parseFloat(t.slice(0, -1));
    return Number.isNaN(n) ? void 0 : n / 100;
  }
}
function pi(e) {
  if (typeof e == "number")
    return { elementFraction: 0, viewportFraction: 0, offsetPx: 0, absolutePx: e };
  let t = 0;
  const i = e.replace(/([+-])=\s*(-?[\d.]+)/g, (o, l, a) => (t += (l === "-" ? -1 : 1) * Number.parseFloat(a), "")).trim().split(/\s+/).filter(Boolean);
  if (i.length === 1 && /^-?[\d.]+$/.test(i[0]))
    return {
      elementFraction: 0,
      viewportFraction: 0,
      offsetPx: 0,
      absolutePx: Number.parseFloat(i[0]) + t
    };
  const s = i[0] !== void 0 ? dn(i[0]) : void 0, r = i[1] !== void 0 ? dn(i[1]) : void 0;
  return {
    elementFraction: s ?? 0,
    viewportFraction: r ?? 0,
    offsetPx: t
  };
}
function St(e, t, n) {
  const i = pi(n), s = i.absolutePx !== void 0 ? e.top + i.absolutePx : e.top + e.height * i.elementFraction, r = t * i.viewportFraction;
  return s - r + i.offsetPx;
}
function pl(e, t, n, i) {
  const s = St(e, t, n), o = St(e, t, i) - s;
  return o <= 0 ? s <= 0 ? 1 : 0 : mi(-s / o);
}
function mi(e) {
  return e < 0 ? 0 : e > 1 ? 1 : e === 0 ? 0 : e;
}
function ao(e, t, n, i) {
  if (n <= 0) return t;
  const s = 1 - Math.exp(-(i / 1e3) / n);
  return e + (t - e) * s;
}
function pn(e, t, n, i, s) {
  const r = (h) => St({ top: e + s(h), bottom: e + s(h) + t, height: t }, n, i), o = r(0), l = r(1);
  if (Math.sign(o) === Math.sign(l) || o === 0 || l === 0)
    return o === 0 ? 0 : l === 0 ? 1 : Math.abs(o) < Math.abs(l) ? 0 : 1;
  let a = 0, c = 1;
  for (let h = 0; h < 40; h++) {
    const f = (a + c) / 2;
    Math.sign(r(f)) === Math.sign(o) ? a = f : c = f;
  }
  return (a + c) / 2;
}
class lo {
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
          for (const n of t)
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
function ml(e) {
  const t = new lo(e);
  return t.start(), t;
}
class co {
  element;
  spacer;
  saved;
  axis;
  spacing;
  constructor(t, n = {}) {
    this.element = t, this.axis = n.axis ?? "y", this.spacing = n.spacing ?? !0;
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
  apply(t, n) {
    const i = Math.max(0, n);
    this.element.style.position = "sticky", this.axis === "x" ? (this.spacer.style.width = `${this.element.offsetWidth + i}px`, this.spacer.style.marginRight = this.spacing ? "" : `-${i}px`, this.element.style.left = `${t}px`) : (this.spacer.style.height = `${this.element.offsetHeight + i}px`, this.spacer.style.marginBottom = this.spacing ? "" : `-${i}px`, this.element.style.top = `${t}px`);
  }
  /** Remove the spacer and restore the element's own styles. */
  destroy() {
    this.element.style.position = this.saved.position, this.element.style.top = this.saved.top, this.element.style.left = this.saved.left, this.spacer.parentNode && this.spacer.replaceWith(this.element);
  }
}
const ho = 0.15;
function uo(e) {
  return typeof e == "object" && !Array.isArray(e) ? e : { snapTo: e };
}
function fo(e, t, n) {
  const i = Lt(e + t * ho);
  if (typeof n == "function") return Lt(n(i));
  if (typeof n == "number")
    return n <= 0 ? e : Lt(Math.round(i / n) * n);
  if (n.length === 0) return e;
  let s = n[0];
  for (const r of n)
    Math.abs(r - i) < Math.abs(s - i) && (s = r);
  return Lt(s);
}
function po(e, t, n) {
  const i = e.duration ?? { min: 0.2, max: 0.8 };
  if (typeof i == "number") return i;
  const s = Math.min(1, Math.abs(t) / Math.max(1, n));
  return i.min + (i.max - i.min) * s;
}
class mo {
  rafId = null;
  cancelEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  onInterrupt = () => this.cancel();
  write;
  eventTarget;
  constructor(t, n) {
    this.write = t, this.eventTarget = n;
  }
  get active() {
    return this.rafId !== null;
  }
  animate(t, n, i, s = Kt, r) {
    if (this.cancel(), typeof requestAnimationFrame > "u" || i <= 0) {
      this.write(n), r?.();
      return;
    }
    for (const a of this.cancelEvents) this.eventTarget?.addEventListener(a, this.onInterrupt, { passive: !0 });
    let o = null;
    const l = (a) => {
      o ??= a;
      const c = Math.min(1, (a - o) / (i * 1e3));
      this.write(t + (n - t) * s(c)), c < 1 ? this.rafId = requestAnimationFrame(l) : (this.rafId = null, this.detach(), r?.());
    };
    this.rafId = requestAnimationFrame(l);
  }
  cancel() {
    this.rafId !== null && typeof cancelAnimationFrame < "u" && cancelAnimationFrame(this.rafId), this.rafId = null, this.detach();
  }
  detach() {
    for (const t of this.cancelEvents) this.eventTarget?.removeEventListener(t, this.onInterrupt);
  }
}
function Lt(e) {
  return Math.max(0, Math.min(1, e));
}
class go {
  options;
  scroller;
  nodes = [];
  scrollerStart;
  scrollerEnd;
  start;
  end;
  constructor(t, n, i) {
    this.options = i === !0 ? {} : i, this.scroller = n;
    const { startColor: s = "#3ecf7a", endColor: r = "#ff5a5a", id: o } = this.options, l = o ? `${o} ` : "", a = (c, h, f) => {
      const u = t.createElement("div");
      return u.textContent = `${l}${c}`, u.setAttribute("aria-hidden", "true"), u.className = "scroll-marker", Object.assign(u.style, {
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
      }), (n ?? t.body).appendChild(u), this.nodes.push(u), u;
    };
    this.scrollerStart = a("scroller-start", s, !n), this.scrollerEnd = a("scroller-end", r, !n), this.start = a("start", s, !1), this.end = a("end", r, !1), n && getComputedStyle(n).position === "static" && (n.style.position = "relative");
  }
  /** Place the markers for the latest measurement. */
  place(t, n) {
    this.start.style.top = `${t.startPage}px`, this.end.style.top = `${t.endPage}px`;
    const i = this.scroller ? n : 0;
    this.scrollerStart.style.top = `${i + t.startViewport}px`, this.scrollerEnd.style.top = `${i + t.endViewport}px`;
  }
  /** Keep the viewport lines in place inside a scrolling element. */
  follow(t, n) {
    this.scroller && this.place(t, n);
  }
  destroy() {
    for (const t of this.nodes.splice(0)) t.remove();
  }
}
const yo = 120, rt = [], ht = /* @__PURE__ */ new Set();
let he = !1;
const bo = () => {
  he || ht.size === 0 || (he = !0, queueMicrotask(() => {
    he = !1;
    for (const e of ht) e.afterRefresh();
  }));
}, gi = () => {
  for (const e of ht) e.beforeRefresh();
  for (const e of rt) e.refresh();
  for (const e of ht) e.afterRefresh();
};
let ot = { width: 0, height: 0 };
const mn = () => {
  const e = window.innerWidth, t = window.innerHeight, n = e === ot.width && t !== ot.height, i = Math.abs(t - ot.height) < ot.height * 0.25, s = typeof navigator < "u" && (navigator.maxTouchPoints ?? 0) > 0;
  n && i && s || (ot = { width: e, height: t }, gi());
};
class Zt {
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
    this.timeline = t.timeline, this.options = t, this.snapper = new mo((n) => this.scrollTo(n), typeof window < "u" ? window : null);
  }
  start() {
    if (this.running) return;
    this.running = !0, this.timeline?.pause();
    const t = this.options.pin === !0 ? this.options.trigger : this.options.pin || null;
    t && !this.options.container && (this.pin = new co(t, { axis: this.options.horizontal ? "x" : "y", spacing: this.options.pinSpacing !== !1 })), this.options.markers && !this.options.horizontal && typeof document < "u" && (this.markers = new go(document, this.options.scroller ?? null, this.options.markers)), this.scrollTarget()?.addEventListener("scroll", this.onScroll, { passive: !0 }), rt.length === 0 && typeof window < "u" && (ot = { width: window.innerWidth, height: window.innerHeight }, window.addEventListener("resize", mn, { passive: !0 })), rt.push(this), this.refresh();
  }
  stop() {
    this.running && (this.running = !1, this.scrollTarget()?.removeEventListener("scroll", this.onScroll), rt.splice(rt.indexOf(this), 1), rt.length === 0 && typeof window < "u" && window.removeEventListener("resize", mn), this.stopSmoothing(), this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = null, this.snapTimer !== null && clearTimeout(this.snapTimer), this.snapTimer = null, this.snapper.cancel());
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
    gi();
  }
  /** Be told around every re-measure; returns a function that stops it. */
  static onRefresh(t) {
    return ht.add(t), () => ht.delete(t);
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
    const n = this.triggerRect();
    if (n && this.options.container)
      this.measureInContainer(this.options.container);
    else if (n) {
      const i = this.viewportHeight();
      if (this.startPx = t + St(n, i, yt(this.options.start) ?? "top bottom"), this.endPx = this.resolveEnd(n, i, t), this.pin) {
        const s = this.relativeRect(this.pin.element.getBoundingClientRect());
        this.pin.apply(s.top - (this.startPx - t), this.endPx - this.startPx);
      }
      this.markerGeometry = this.markers ? this.markersFor(i) : null;
    }
    this.markers && this.markerGeometry && this.markers.place(this.markerGeometry, t), this.lastScroll = null, this.updateFrom(t, !this.measured), this.measured = !0, bo();
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
  updateFrom(t, n) {
    this.trackVelocity(t), this.markers && this.markerGeometry && this.markers.follow(this.markerGeometry, t);
    const i = this.endPx - this.startPx, s = this.zone;
    this.targetProgress = i > 0 ? mi((t - this.startPx) / i) : t >= this.startPx ? 1 : 0, this.zone = i > 0 ? t <= this.startPx ? "before" : t >= this.endPx ? "after" : "active" : t >= this.startPx ? "after" : "before", this.fireBoundaryCallbacks(s, this.zone), n || this.smoothing() <= 0 ? (this.displayProgress = this.targetProgress, this.applyProgress()) : (this.emitUpdate(), this.startSmoothing());
  }
  /** Seconds of smoothing, or 0 for exact tracking. */
  smoothing() {
    const t = this.options.scrub;
    return typeof t == "number" ? Math.max(0, t) : 0;
  }
  resolveEnd(t, n, i) {
    const s = yt(this.options.end) ?? "bottom top", r = typeof s == "string" ? s.trim().match(/^\+=\s*(-?[\d.]+)\s*(%|px)?$/) : null;
    if (r) {
      const o = Number.parseFloat(r[1]);
      return this.startPx + (r[2] === "%" ? n * o / 100 : o);
    }
    return i + St(t, n, s);
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
    const n = typeof performance < "u" ? performance.now() : Date.now();
    this.lastScroll !== null && n > this.lastScrollTime && t !== this.lastScroll && (this.velocityPxPerSecond = (t - this.lastScroll) / (n - this.lastScrollTime) * 1e3), (this.lastScroll === null || t !== this.lastScroll) && (this.lastScroll = t, this.lastScrollTime = n), !(this.velocityPxPerSecond === 0 || typeof setTimeout > "u") && (this.idleTimer !== null && clearTimeout(this.idleTimer), this.idleTimer = setTimeout(() => {
      this.idleTimer = null, this.releaseVelocity = this.velocityPxPerSecond, this.velocityPxPerSecond = 0, this.emitUpdate(), this.scheduleSnap();
    }, yo));
  }
  /**
   * Emit enter/leave callbacks as the scroll position moves between zones. A jump
   * straight across the range (a fast flick, or loading the page scrolled past
   * it) fires both edges in order.
   */
  fireBoundaryCallbacks(t, n) {
    if (t === n) return;
    const { onEnter: i, onLeave: s, onEnterBack: r, onLeaveBack: o } = this.options;
    t === "before" ? (i?.(), n === "after" && s?.()) : t === "after" ? (r?.(), n === "before" && o?.()) : n === "after" ? s?.() : o?.();
  }
  /** Scrolling has stopped: settle on the nearest snap point, if there is one. */
  scheduleSnap() {
    const t = this.options.snap;
    if (t === void 0 || this.snapper.active) return;
    const n = uo(t), i = () => {
      this.snapTimer = null;
      const s = this.endPx - this.startPx, r = this.scrollPosition();
      if (!this.running || s <= 0 || r <= this.startPx || r >= this.endPx) return;
      const o = (r - this.startPx) / s, l = this.startPx + fo(o, this.releaseVelocity / s, n.snapTo) * s;
      Math.abs(l - r) < 1 || this.snapper.animate(r, l, po(n, l - r, this.viewportHeight()), n.ease);
    };
    n.delay ? this.snapTimer = setTimeout(i, n.delay * 1e3) : i();
  }
  scrollTo(t) {
    const n = this.options.scroller, i = this.options.horizontal ? { left: t } : { top: t };
    n ? typeof n.scrollTo == "function" ? n.scrollTo({ ...i, behavior: "instant" }) : this.options.horizontal ? n.scrollLeft = t : n.scrollTop = t : typeof window < "u" && window.scrollTo({ ...i, behavior: "instant" });
  }
  /**
   * Resolve start and end for a trigger inside a horizontally moving container:
   * find the container progress where each horizontal position fires, and turn
   * it into the container's scroll offsets.
   */
  measureInContainer(t) {
    const n = this.options.trigger;
    if (typeof n?.getBoundingClientRect != "function") return;
    const i = n.getBoundingClientRect(), s = this.options.scroller?.getBoundingClientRect?.().left ?? 0, r = this.options.scroller ? this.options.scroller.clientWidth : typeof window < "u" ? window.innerWidth : 0, o = i.left - s - t.shiftAt(t.progress()), { start: l, end: a } = t.range(), c = (d) => l + d * (a - l), h = pn(o, i.width, r, yt(this.options.start) ?? "left right", t.shiftAt);
    this.startPx = c(h);
    const f = yt(this.options.end) ?? "right left", u = typeof f == "string" ? f.trim().match(/^\+=\s*(-?[\d.]+)\s*(px)?$/) : null;
    this.endPx = u ? this.startPx + Number.parseFloat(u[1]) : c(pn(o, i.width, r, f, t.shiftAt)), this.markerGeometry = null;
  }
  /** Where the markers go: the element points on the page, and the viewport lines they meet. */
  markersFor(t) {
    const n = (r, o) => {
      const l = yt(r) ?? o;
      if (typeof l == "number") return 0;
      if (/^\s*\+=/.test(l)) return;
      const a = pi(l);
      return t * a.viewportFraction - a.offsetPx;
    }, i = n(this.options.start, "top bottom") ?? 0, s = n(this.options.end, "bottom top") ?? i;
    return {
      startViewport: i,
      endViewport: s,
      startPage: this.startPx + i,
      endPage: this.endPx + s
    };
  }
  startSmoothing() {
    if (this.rafId !== null || typeof requestAnimationFrame > "u") return;
    const t = (n) => {
      if (this.rafId = null, !this.running) return;
      const i = this.lastFrameTime === null ? 16.67 : n - this.lastFrameTime;
      this.lastFrameTime = n, this.displayProgress = ao(this.displayProgress, this.targetProgress, this.smoothing(), i);
      const s = Math.abs(this.targetProgress - this.displayProgress) < 1e-4;
      s && (this.displayProgress = this.targetProgress), this.applyProgress(), s ? this.lastFrameTime = null : this.rafId = requestAnimationFrame(t);
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
    const t = this.options.scroller, n = this.options.horizontal;
    return t ? (n ? t.scrollLeft : t.scrollTop) ?? 0 : typeof window < "u" ? (n ? window.scrollX : window.scrollY) ?? 0 : 0;
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
    const n = this.options.horizontal, i = n ? t.left ?? 0 : t.top, s = n ? t.right ?? 0 : t.bottom, r = n ? t.width ?? 0 : t.height, o = this.options.scroller;
    if (o && typeof o.getBoundingClientRect == "function") {
      const l = o.getBoundingClientRect(), a = n ? l.left : l.top;
      return { top: i - a, bottom: s - a, height: r };
    }
    return { top: i, bottom: s, height: r };
  }
  /** The viewport's size along the scroll axis. */
  viewportHeight() {
    const t = this.options.scroller, n = this.options.horizontal;
    return t ? n ? t.clientWidth : t.clientHeight : typeof window < "u" ? n ? window.innerWidth : window.innerHeight : 0;
  }
}
function yt(e) {
  return typeof e == "function" ? e() : e;
}
function gl(e) {
  const t = new Zt(e);
  return t.start(), t;
}
const ue = /* @__PURE__ */ new Set(), wo = 16, gn = 0.5, vo = 2;
class yn {
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
      request: (n) => requestAnimationFrame(n),
      cancel: (n) => cancelAnimationFrame(n)
    };
  }
  start() {
    if (this.running || typeof window > "u") return this;
    this.running = !0, this.reduced = this.options.reducedMotion ?? (typeof window.matchMedia == "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches), this.current = this.target = this.position();
    const t = this.options.scroller ?? window;
    return t.addEventListener("wheel", this.onWheel, { passive: !1 }), t.addEventListener("scroll", this.onScroll, { passive: !0 }), window.addEventListener("resize", this.onResize, { passive: !0 }), window.addEventListener("load", this.onLoad), ue.add(this), this.stopListening = Zt.onRefresh({ beforeRefresh: () => this.rest(), afterRefresh: () => this.refresh() }), this.refresh(), this;
  }
  /** Re-measure every started smoother, after layout changes a resize would not catch. */
  static refreshAll() {
    for (const t of ue) t.refresh();
  }
  stop() {
    if (!this.running) return this;
    this.running = !1;
    const t = this.options.scroller ?? window;
    return t.removeEventListener("wheel", this.onWheel), t.removeEventListener("scroll", this.onScroll), window.removeEventListener("resize", this.onResize), window.removeEventListener("load", this.onLoad), ue.delete(this), this.stopListening?.(), this.stopListening = null, this.cancelFrame(), this.journey = null, this;
  }
  /** Stop, and put every effect element back where it was. */
  destroy() {
    this.stop();
    for (const t of this.effects) fe(t.element, t.saved);
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
  scrollTo(t, n = {}) {
    if (!this.running) return;
    const i = this.clamp(this.resolve(t) + (n.offset ?? 0)), s = Math.abs(i - this.current), r = this.reduced ? 0 : n.duration ?? Math.min(1.2, Math.max(0.4, s / 2500));
    if (r <= 0) {
      this.journey = null, this.current = this.target = i, this.write(i), this.applyEffects(0);
      return;
    }
    this.target = i, this.journey = { from: this.current, to: i, ms: r * 1e3, ease: n.ease ?? Kt, elapsed: 0 }, this.requestFrame();
  }
  /** Re-measure the scrollable length and every effect element (resizes do this). */
  refresh() {
    if (!this.running) return;
    this.rest(), this.effects = [];
    const t = this.options.effects === !0 ? "[data-speed], [data-lag]" : this.options.effects || "";
    if (t && !this.reduced) {
      const n = this.options.scroller ?? document, i = this.position(), s = this.viewportHeight(), r = this.options.scroller?.getBoundingClientRect().top ?? 0;
      for (const o of n.querySelectorAll(t)) {
        const l = Number.parseFloat(o.dataset.speed ?? ""), a = Number.parseFloat(o.dataset.lag ?? ""), c = o.getBoundingClientRect(), h = c.top - r + i;
        this.effects.push({
          element: o,
          speed: Number.isFinite(l) ? l : void 0,
          lag: Number.isFinite(a) && a > 0 ? a : void 0,
          centre: h + c.height / 2 - s / 2,
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
    for (const t of this.effects) fe(t.element, t.saved);
  }
  // --- input ----------------------------------------------------------------
  wheel(t) {
    if (this.pausedState || this.reduced || (this.options.smooth ?? 0.8) <= 0 || t.ctrlKey || Math.abs(t.deltaX) > Math.abs(t.deltaY) || this.nestedScrollerTakes(t)) return;
    const n = t.deltaMode === 1 ? wo : t.deltaMode === 2 ? this.viewportHeight() : 1, i = t.deltaY * n * (this.options.wheelMultiplier ?? 1), s = this.clamp(this.target + i);
    s === this.target && s === this.current || (t.preventDefault(), this.journey = null, this.target = s, this.requestFrame());
  }
  /** A scroll that this smoother did not write: follow it. */
  nativeScroll() {
    const t = this.position();
    this.written !== null && Math.abs(t - this.written) <= vo || (this.written = null, this.journey = null, this.cancelFrame(), this.current = this.target = t, this.requestFrame());
  }
  nestedScrollerTakes(t) {
    const n = this.options.scroller ?? document.documentElement;
    for (let i = t.target; i && i !== n && i !== document.body; i = i.parentElement) {
      if (i.hasAttribute?.("data-smooth-ignore")) return !0;
      const s = getComputedStyle(i);
      if (!/(auto|scroll)/.test(s.overflowY) || i.scrollHeight <= i.clientHeight) continue;
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
    const n = this.lastTime === null ? 1e3 / 60 : Math.min(100, t - this.lastTime);
    this.lastTime = t;
    const i = this.current;
    if (this.journey) {
      const r = this.journey;
      r.elapsed += n;
      const o = Math.min(1, r.elapsed / r.ms);
      this.current = r.from + (r.to - r.from) * r.ease(o), o >= 1 && (this.journey = null);
    } else if (this.current !== this.target) {
      const r = (this.options.smooth ?? 0.8) * 1e3 / 3;
      this.current += (this.target - this.current) * (1 - Math.exp(-n / r)), Math.abs(this.target - this.current) < gn && (this.current = this.target);
    }
    this.current !== i && this.write(this.current), this.velocityPxPerSecond = n > 0 ? (this.current - i) * 1e3 / n : 0;
    const s = this.applyEffects(n);
    this.current !== i && this.options.onUpdate?.(this.state), this.journey || this.current !== this.target || s ? this.requestFrame() : (this.lastTime = null, this.velocityPxPerSecond = 0);
  }
  /** Position every effect for the current scroll; true while a lag is still catching up. */
  applyEffects(t) {
    let n = !1;
    const i = this.current;
    for (const s of this.effects) {
      let r = 0;
      if (s.speed !== void 0 && (r += (i - s.centre) * (1 - s.speed)), s.lag !== void 0) {
        const o = s.lag * 1e3 / 3;
        s.lagged = t === 0 ? i : s.lagged + (i - s.lagged) * (1 - Math.exp(-t / o)), Math.abs(i - s.lagged) < gn ? s.lagged = i : n = !0, r += i - s.lagged;
      }
      fe(s.element, r === 0 ? s.saved : `0 ${To(r)}px`), s.shift = r;
    }
    return n;
  }
  // --- geometry -------------------------------------------------------------
  write(t) {
    const n = Math.round(t);
    this.written = n;
    const i = this.options.scroller;
    i ? i.scrollTop = n : window.scrollTo({ top: n, behavior: "instant" });
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
    const n = this.options.scroller ?? document, i = typeof t == "string" ? n.querySelector(t) : t;
    if (!i) return this.current;
    const s = this.options.scroller?.getBoundingClientRect().top ?? 0, r = this.effects.find((o) => o.element === i)?.shift ?? 0;
    return i.getBoundingClientRect().top - s + this.position() - r;
  }
}
function fe(e, t) {
  t ? e.style.setProperty("translate", t) : e.style.removeProperty("translate");
}
function To(e) {
  return Math.round(e * 100) / 100;
}
function xo(e, t) {
  switch (t) {
    // Play forward from wherever it is; reverse() flips a reversed timeline and plays.
    // Neither restarts an animation that is already at that end.
    case "play":
      if (e.progress() >= 1) break;
      e.reversed() ? e.reverse() : e.play();
      break;
    case "reverse":
      if (e.progress() <= 0) break;
      e.reversed() ? e.play() : e.reverse();
      break;
    case "pause":
      e.pause();
      break;
    case "resume":
      e.resume();
      break;
    case "restart":
      e.restart();
      break;
    case "reset":
      e.pause(), e.progress(0);
      break;
    case "complete":
      e.pause(), e.progress(1);
      break;
  }
}
function $e(e, t, n, i, s = () => {
}) {
  const r = (d) => typeof d == "string" ? e.query(d) ?? void 0 : d, o = r(t.trigger) ?? i;
  if (!o) {
    s(`gsap-compat: scrollTrigger has no trigger element${typeof t.trigger == "string" ? ` for "${t.trigger}"` : ""}`);
    return;
  }
  const l = t.scrub === void 0 || t.scrub === !1 ? !1 : t.scrub, a = (t.toggleActions ?? "play none none none").trim().split(/\s+/);
  let c = 0, h;
  const f = (d, m) => () => {
    m?.(), n && !l && xo(n, a[d] ?? "none"), t.once && d === 0 && queueMicrotask(() => h.destroy());
  }, u = t.containerAnimation ? Mo(e, t.containerAnimation, o, s) : void 0;
  return h = new Zt({
    trigger: o,
    start: t.start,
    end: t.end,
    scrub: l === !1 ? void 0 : l,
    pin: t.pin === !0 ? !0 : r(t.pin),
    scroller: r(t.scroller),
    horizontal: t.horizontal,
    pinSpacing: t.pinSpacing,
    onRefresh: t.invalidateOnRefresh && n?.invalidate ? () => n.invalidate() : void 0,
    snap: t.snap === void 0 ? void 0 : ko(t.snap, n),
    markers: t.markers,
    container: u,
    onUpdate: (d, m) => {
      if (n && l !== !1 && n.progress(d), t.onUpdate) {
        const p = d < c || m < 0 ? -1 : 1;
        t.onUpdate({ progress: d, velocity: m, direction: p });
      }
      c = d;
    },
    onEnter: f(0, t.onEnter),
    onLeave: f(1, t.onLeave),
    onEnterBack: f(2, t.onEnterBack),
    onLeaveBack: f(3, t.onLeaveBack)
  }), n && l === !1 && n.progress(0), h.start(), e.own(h);
}
function ko(e, t) {
  const n = (s) => s === "labels" ? (r) => So(r, t?.labelProgresses?.() ?? []) : s;
  if (typeof e != "object" || Array.isArray(e)) return n(e);
  const i = e.ease ? Xt(e.ease) : void 0;
  return {
    snapTo: n(e.snapTo),
    duration: e.duration,
    delay: e.delay,
    ease: i ? i.fn ?? G(i.easing) : void 0
  };
}
function So(e, t) {
  return t.reduce((n, i) => Math.abs(i - e) < Math.abs(n - e) ? i : n, t[0] ?? e);
}
function Mo(e, t, n, i) {
  const s = () => t.timeline.getTracks({ property: "x" }).map((r) => r.target).filter((r) => {
    const o = e.elementFor(r);
    return !!o && o !== n && o.contains(n);
  });
  return s().length === 0 && i("gsap-compat: containerAnimation does not move an ancestor of the trigger along x"), {
    range: () => {
      const r = t.scrollTrigger;
      return r || i("gsap-compat: containerAnimation needs its own scrollTrigger (created before this one)"), { start: r?.startOffset ?? 0, end: r?.endOffset ?? 0 };
    },
    progress: () => t.progress(),
    shiftAt: (r) => {
      const o = t.timeline.getStateAtTime(r * t.timeline.duration);
      let l = 0;
      for (const a of s()) {
        const c = o.values.get(a)?.get("x");
        typeof c == "number" && (l += c);
      }
      return l;
    }
  };
}
class yi {
  /** For contexts made by matchMedia: which named queries match */
  conditions = {};
  scope;
  host;
  items = [];
  snapshots = /* @__PURE__ */ new Map();
  constructor(t, n) {
    this.host = t, this.scope = n;
  }
  /**
   * Run `fn` with this context collecting, and return what it returns. A function
   * it returns is kept as cleanup and called on `revert()`.
   */
  add(t) {
    const n = this.host.collector;
    this.host.setCollector(this);
    try {
      const i = t();
      return typeof i == "function" && this.items.push({ revert: i }), i;
    } finally {
      this.host.setCollector(n);
    }
  }
  track(t) {
    this.items.push(t);
  }
  touch(t, n) {
    this.snapshots.has(t) || this.snapshots.set(t, { name: n, style: t.getAttribute("style"), d: t.getAttribute("d") });
  }
  /** Undo everything, newest first, and restore the elements this context animated. */
  revert() {
    for (const t of this.items.splice(0).reverse())
      t.revert ? t.revert() : t.kill ? t.kill() : t.destroy?.();
    for (const [t, { name: n, style: i, d: s }] of this.snapshots)
      i === null ? t.removeAttribute("style") : t.setAttribute("style", i), s !== null && t.setAttribute("d", s), this.host.forget(n);
    this.snapshots.clear();
  }
  /** Same as `revert()`: GSAP's name for dropping a context. */
  kill() {
    this.revert();
  }
}
class Ao {
  host;
  scope;
  entries = [];
  listeners = [];
  scheduled = !1;
  constructor(t, n) {
    this.host = t, this.scope = n;
  }
  add(t, n) {
    const i = { conditions: t, setup: n, queries: /* @__PURE__ */ new Map() }, s = typeof t == "string" ? { matches: t } : t;
    if (typeof window < "u" && typeof window.matchMedia == "function")
      for (const [r, o] of Object.entries(s)) {
        const l = window.matchMedia(o);
        i.queries.set(r, l);
        const a = () => this.scheduleUpdate();
        l.addEventListener("change", a), this.listeners.push(() => l.removeEventListener("change", a));
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
    const n = {};
    for (const [o, l] of t.queries) n[o] = l.matches;
    const i = Object.values(n).some(Boolean), s = i ? JSON.stringify(n) : void 0;
    if (s === t.key || (t.context?.revert(), t.context = void 0, t.key = s, !i)) return;
    const r = new yi(this.host, this.scope);
    r.conditions = n, r.add(() => t.setup(r)), t.context = r;
  }
}
class Eo {
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
  constructor(t, n) {
    this.canvas = t, this.context = t.getContext("2d"), this.options = n, this.frames = Math.max(1, Math.floor(n.frames)), this.images = new Array(this.frames), this.ready = new Array(this.frames).fill(!1), typeof window < "u" && window.addEventListener("resize", this.onResize, { passive: !0 }), this.resize(), this.pump();
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
    const t = typeof window < "u" ? Math.min(window.devicePixelRatio || 1, 2) : 1, n = Math.round(this.canvas.clientWidth * t), i = Math.round(this.canvas.clientHeight * t);
    n > 0 && i > 0 && (this.canvas.width !== n || this.canvas.height !== i) && (this.canvas.width = n, this.canvas.height = i), this.drawn = -1, this.draw();
  }
  draw() {
    const t = Math.round(this.current), n = this.nearestReady(t);
    if (n === -1 || n === this.drawn || !this.context) return;
    const i = this.images[n], { width: s, height: r } = this.canvas, o = (this.options.fit ?? "cover") === "cover" ? Math.max(s / i.naturalWidth, r / i.naturalHeight) : Math.min(s / i.naturalWidth, r / i.naturalHeight), l = i.naturalWidth * o, a = i.naturalHeight * o;
    this.context.clearRect(0, 0, s, r), this.context.drawImage(i, (s - l) / 2, (r - a) / 2, l, a), this.drawn = n, this.pump();
  }
  /** The loaded frame closest to `index`, or -1. */
  nearestReady(t) {
    for (let n = 0; n < this.frames; n++) {
      if (t - n >= 0 && this.ready[t - n]) return t - n;
      if (t + n < this.frames && this.ready[t + n]) return t + n;
    }
    return -1;
  }
  /** Start loads, nearest to the current frame first, up to the concurrency. */
  pump() {
    const t = this.options.concurrency ?? 6, n = Math.round(this.current);
    for (let i = 0; i < this.frames && this.inFlight < t; i++)
      for (const s of i === 0 ? [n] : [n + i, n - i])
        s < 0 || s >= this.frames || this.images[s] || this.inFlight >= t || this.load(s);
  }
  load(t) {
    const n = new Image();
    n.decoding = "async", this.images[t] = n, this.inFlight++;
    const i = (s) => {
      if (!this.destroyed) {
        if (this.inFlight--, s) {
          this.ready[t] = !0, this.loadedCount++, this.options.onProgress?.(this.loadedCount, this.frames);
          const r = Math.round(this.current);
          (Math.abs(t - r) < Math.abs(this.drawn - r) || this.drawn === -1) && (this.drawn = -1, this.draw());
        }
        this.pump();
      }
    };
    n.onload = () => i(!0), n.onerror = () => i(!1), n.src = this.options.url(t);
  }
}
const Po = { opacity: 0, y: -16 }, _o = { opacity: 0, y: 16 };
async function Co(e, t, n, i) {
  const s = t.collector?.scope ?? t.root, r = s.ownerDocument ?? s, o = () => i.shared ? [...s.querySelectorAll(i.shared)] : [];
  if (i.native && typeof r.startViewTransition == "function")
    return Io(r, i, o);
  const l = i.duration ?? 0.35, a = i.ease ?? "power2.inOut", c = (g) => new Promise((y) => {
    g(y) || y();
  }), h = o(), f = h.length ? Te(t, h) : void 0, u = i.from !== void 0 ? bn(t, i.from, i.shared) : [];
  if (u.length && i.leave !== !1) {
    const g = i.leave ?? Po;
    await c((y) => e.to(u, { ...g, duration: l, ease: a, onComplete: y }));
  }
  await i.update();
  const d = [], m = typeof i.to == "function" ? i.to() : i.to, p = m !== void 0 ? bn(t, m, i.shared) : [];
  if (p.length && i.enter !== !1) {
    const g = i.enter ?? _o;
    d.push(c((y) => e.fromTo(p, g, { ...di(g), duration: l, ease: a, onComplete: y })));
  }
  if (f) {
    const g = o().filter((y) => !h.includes(y));
    g.length && d.push(
      c(
        (y) => xe(t, n, f, {
          targets: g,
          duration: l * 1.4,
          ease: a,
          enter: !1,
          onComplete: y
        })
      )
    );
  }
  await Promise.all(d);
}
function bn(e, t, n) {
  const i = e.resolveTargets(t).map((s) => e.elementFor(s)).filter((s) => !!s);
  return n ? i.flatMap((s) => !s.querySelector(n) && !s.matches(n) ? [s] : [...s.children].filter((r) => !r.matches(n) && !r.querySelector(n))) : i;
}
async function Io(e, t, n) {
  const i = (l, a) => {
    const c = l.dataset?.flipId;
    c && l.style.setProperty("view-transition-name", a ? `tf-${c.replace(/[^\w-]/g, "-")}` : "");
  }, s = n();
  s.forEach((l) => i(l, !0));
  let r = [];
  await e.startViewTransition(async () => {
    s.forEach((l) => i(l, !1)), await t.update(), r = n(), r.forEach((l) => i(l, !0));
  }).finished, r.forEach((l) => i(l, !1));
}
const Ro = {
  /** Register a curve from SVG path data or bezier points. Returns the name. */
  create: (e, t) => Re(e, js(t))
}, Lo = {
  /** Register a bouncing ease that lands and settles on the end value. Returns the name. */
  create: (e, t) => Re(e, { fn: Gs(t) })
}, Fo = {
  /** Register a wiggle that swings around the start value and returns to it. Returns the name. */
  create: (e, t) => Re(e, { fn: Ks(t) })
}, $o = /* @__PURE__ */ new Set([
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
]), wn = 0.5, Do = "power1.inOut";
function Bo(e) {
  return e.keyframes !== void 0 && e.keyframes !== null;
}
function Oo(e) {
  const t = e.keyframes, n = {};
  for (const [c, h] of Object.entries(e)) $o.has(c) || (n[c] = h);
  if (Array.isArray(t))
    return t.map((c) => ({
      ...n,
      ...c,
      duration: c.duration ?? e.duration ?? wn
    }));
  const i = Object.entries(t), s = e.duration ?? wn, r = t.easeEach ?? e.easeEach ?? Do;
  if (i.length > 0 && i.every(([c]) => /^\s*-?\d+(\.\d+)?\s*%\s*$/.test(c) || c === "easeEach")) {
    const c = i.filter(([u]) => u !== "easeEach").map(([u, d]) => ({ at: Number.parseFloat(u) / 100, step: d })).sort((u, d) => u.at - d.at), h = [];
    let f = 0;
    for (const { at: u, step: d } of c) {
      const m = Math.max(0, u - f);
      h.push({ ...n, ease: r, ...d, duration: m * s }), f = u;
    }
    return h;
  }
  const o = i.filter(([c, h]) => c !== "easeEach" && Array.isArray(h)), l = Math.max(0, ...o.map(([, c]) => c.length)), a = [];
  for (let c = 0; c < l; c++) {
    const h = { ...n, ease: r, duration: s / l };
    for (const [f, u] of o)
      c < u.length && (h[f] = u[c]);
    a.push(h);
  }
  return a;
}
function vn(e, t, n, i = {}) {
  const s = t.collector?.scope ?? t.root, r = typeof i.scroller == "string" ? s.querySelector(i.scroller) : i.scroller ?? null, o = {
    x: r ? r.scrollLeft : window.scrollX,
    y: r ? r.scrollTop : window.scrollY
  }, l = {
    x: r ? r.scrollWidth - r.clientWidth : document.documentElement.scrollWidth - window.innerWidth,
    y: r ? r.scrollHeight - r.clientHeight : document.documentElement.scrollHeight - window.innerHeight
  }, a = (b, w) => {
    if (w === void 0) return o[b];
    if (typeof w == "number") return w;
    if (w === "max") return l[b];
    const T = typeof w == "string" ? s.querySelector(w) : w;
    if (!T) return o[b];
    const v = T.getBoundingClientRect(), x = r?.getBoundingClientRect(), S = (b === "x" ? i.offsetX : i.offsetY) ?? i.offset ?? 0;
    return b === "x" ? v.left - (x?.left ?? 0) + o.x - S : v.top - (x?.top ?? 0) + o.y - S;
  }, c = typeof n == "object" && n !== null && !("nodeType" in n) ? { x: a("x", n.x), y: a("y", n.y) } : { x: o.x, y: a("y", n) }, h = { x: Math.max(0, Math.min(l.x, c.x)), y: Math.max(0, Math.min(l.y, c.y)) }, f = { ...o }, u = () => {
    r ? (r.scrollLeft = f.x, r.scrollTop = f.y) : window.scrollTo({ left: f.x, top: f.y, behavior: "instant" });
  }, d = ["wheel", "touchstart", "keydown"], m = r ?? window, p = () => {
    y.kill(), g();
  }, g = () => {
    for (const b of d) m.removeEventListener(b, p);
  }, y = e.to(f, {
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
function No(e, t, n) {
  const i = e.collector?.scope ?? e.root, s = typeof t == "string" ? [...i.querySelectorAll(t)] : "nodeType" in t ? [t] : Array.from(t), { interval: r = 0.1, batchMax: o, onEnter: l, onLeave: a, onEnterBack: c, onLeaveBack: h, ...f } = n, u = { onEnter: l, onLeave: a, onEnterBack: c, onLeaveBack: h }, d = { onEnter: [], onLeave: [], onEnterBack: [], onLeaveBack: [] }, m = {}, p = (y) => {
    m[y] !== void 0 && clearTimeout(m[y]), m[y] = void 0;
    const b = d[y].splice(0);
    b.length > 0 && u[y]?.(b);
  }, g = (y, b) => {
    if (u[y]) {
      if (d[y].push(b), o !== void 0 && d[y].length >= o) return p(y);
      m[y] === void 0 && (m[y] = setTimeout(() => p(y), r * 1e3));
    }
  };
  return s.map(
    (y) => $e(e, {
      ...f,
      trigger: y,
      onEnter: () => g("onEnter", y),
      onLeave: () => g("onLeave", y),
      onEnterBack: () => g("onEnterBack", y),
      onLeaveBack: () => g("onLeaveBack", y)
    })
  ).filter((y) => y !== void 0);
}
class z {
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
  constructor(t, n = {}) {
    this.stage = t;
    const i = { ...n, onWarning: n.onWarning ?? t.onWarning };
    if (this.options = i, this.compat = new at({
      ...i,
      startValue: (s, r) => {
        const o = t.objectFor(s);
        if (o) return Wo(o[r]);
        const l = t.appliedValue(s, r);
        if (l !== void 0) return l;
        if (r === "d") return hi(t.elementFor(s)) ?? void 0;
        if (r === "text") return t.elementFor(s)?.textContent ?? void 0;
        if (r === "strokeDasharray" || r === "strokeDashoffset") {
          const a = kn(t.elementFor(s));
          if (a !== void 0) return r === "strokeDasharray" ? [a, a] : 0;
        }
      },
      startVelocity: (s, r) => t.velocityOf(s, r),
      layoutColumns: (s) => xn(s.map((r) => t.elementFor(r))),
      random: () => t.utils.random(0, 1)
    }), this.compat.timeline.onComplete = () => {
      this.finishedThisFrame = !0;
    }, t.collector?.track(this), t.liveTimelines.add(this), this.autoplayPending = !i.paused && !i.scrollTrigger, i.scrollTrigger) {
      const s = i.scrollTrigger;
      queueMicrotask(() => {
        this.killed || (this.scrollDriver = $e(t, s, this, this.firstElement, (r) => i.onWarning?.(r)));
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
  to(t, n, i) {
    return Bo(n) ? this.record(() => this.keyframed(t, n, i)) : this.record(() => this.tween(t, [n], i, ([s], r, o) => this.compat.to(r, s, o)));
  }
  from(t, n, i) {
    return this.record(() => this.tween(t, [n], i, ([s], r, o) => this.compat.from(r, s, o)));
  }
  fromTo(t, n, i, s) {
    return this.record(
      () => this.tween(t, [n, i], s, ([r, o], l, a) => this.compat.fromTo(l, r, o, a))
    );
  }
  set(t, n, i) {
    return this.record(() => this.tween(t, [n], i, ([s], r, o) => this.compat.set(r, s, o)));
  }
  addLabel(t, n) {
    return this.record(() => this.compat.addLabel(t, n));
  }
  /** Merge another timeline in at a position (flattened, as in `tf`). */
  add(t, n) {
    return this.record(() => {
      t.autoplayPending = !1, t.timeline.stop(), t.stage.deactivate(t.timeline), this.compat.add(t.compat, n);
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
    for (const n of this.recipe) n();
    return this.syncDuration(), this.compat.progress(t), this.stage.render(this.timeline), this;
  }
  /**
   * Run `callback` when the playhead crosses `position` (default: the end so far),
   * in either direction (GSAP's `call`). It takes no time, but a call after the
   * last tween makes the timeline that long.
   */
  call(t, n = [], i) {
    return this.record(() => {
      const s = this.compat.addEvent(i);
      this.events.push({ time: s, run: () => t(...n) });
    });
  }
  /** Pause exactly at `position` when the playhead reaches it, then run `callback`. `play()` continues. */
  addPause(t, n, i = []) {
    return this.record(() => {
      const s = this.compat.addEvent(t);
      this.events.push({ time: s, pause: !0, run: () => n?.(...i) });
    });
  }
  /**
   * Pause, and animate the playhead from where it is to `position` (seconds or a
   * label), firing callbacks on the way. Returns the tween that moves it.
   */
  tweenTo(t, n = {}) {
    return this.tweenFromTo(this.timeline.currentTime / 1e3, t, n);
  }
  /** Jump to `from`, then animate the playhead to `to` (seconds or labels). */
  tweenFromTo(t, n, i = {}) {
    this.pause(), this.seek(t);
    const s = this.timeline.currentTime, r = Math.max(0, Math.min(this.timeline.duration, this.compat.timeOf(n))), o = { time: s }, l = i.duration ?? Math.abs(r - s) / 1e3 / (this.timeScale() || 1), a = new z(this.stage, { onStart: i.onStart, onComplete: i.onComplete });
    return a.to(o, {
      time: r,
      duration: l,
      ease: i.ease ?? "none",
      onUpdate: () => {
        this.moveTo(o.time), i.onUpdate?.();
      }
    }), a;
  }
  // --- playback -----------------------------------------------------------
  play() {
    this.autoplayPending = !1, this.started || (this.started = !0, this.options.onStart?.());
    const t = this.timeline.playbackState === "playing", n = this.timeline.playbackState === "paused";
    if (this.timeline.play(), !t) {
      const i = this.timeline, s = i.direction === "forward" ? i.currentTime === 0 : i.currentTime === i.duration;
      this.playhead = { ...this.readPlayhead(), fresh: s && !n }, this.waitingToWrap = !1;
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
    return t > 0 ? this.compat.labelTimes().map((n) => n / t) : [];
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
  killTweensOf(t, n) {
    for (const i of t)
      for (const s of n ?? [void 0])
        this.timeline.removeTracks({ target: i, ...s !== void 0 && { property: s } });
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
    const t = Math.max(...this.events.map((n) => n.time));
    t > this.timeline.duration && this.timeline.setDuration(t);
  }
  readPlayhead() {
    const t = this.timeline;
    return { time: t.currentTime, iteration: t.loopIteration, direction: t.direction };
  }
  /** Set the playhead to a time (ms) within the current loop, firing what it crosses. */
  moveTo(t) {
    const n = this.playhead;
    this.timeline.seek(t), this.stage.render(this.timeline);
    const i = { time: this.timeline.currentTime, iteration: this.timeline.loopIteration, direction: t >= n.time ? "forward" : "reverse" }, s = { ...n, iteration: i.iteration, direction: i.direction };
    this.playhead = { ...this.readPlayhead() }, this.waitingToWrap = !1, this.runCrossings(s, i, !1), this.options.onUpdate?.();
  }
  /**
   * Rebuild for a new loop, keeping the playhead where the engine put it. Unlike
   * `invalidate()`, start values are not re-read from a rewound render: the
   * rebuilt tweens start where the recorded calls say, with fresh function values.
   */
  refreshForRepeat() {
    const t = this.timeline.currentTime;
    this.compat.reset(), this.events = [], this.ranges = [];
    for (const n of this.recipe) n();
    this.syncDuration(), this.timeline.seek(Math.min(t, this.timeline.duration));
  }
  /** After each frame this timeline played: callbacks crossed, repeats, completion. */
  afterFrame() {
    const t = this.timeline, n = t.repeatDelayRemaining > 0;
    if (this.waitingToWrap && n) {
      this.options.onUpdate?.();
      return;
    }
    this.waitingToWrap = !1;
    const i = this.playhead, s = this.readPlayhead();
    this.playhead = s;
    const r = this.options.yoyo === !0;
    n && !r && s.iteration > i.iteration && (this.playhead = { time: 0, iteration: s.iteration, direction: "forward", fresh: !0 }, this.waitingToWrap = !0);
    const o = this.runCrossings(i, s, n);
    if (this.options.onUpdate?.(), this.finishedThisFrame && !o) {
      this.finishedThisFrame = !1;
      const l = t.currentTime === 0 && t.direction === "reverse";
      !this.scrollDriver && !r && this.stage.liveTimelines.delete(this), l && this.backwards ? this.options.onReverseComplete?.() : this.options.onComplete?.();
    }
    this.finishedThisFrame = !1;
  }
  /** Fire events and repeats between two playheads. Returns true if a pause stopped it. */
  runCrossings(t, n, i) {
    if (this.events.length === 0 && this.ranges.length === 0 && !this.options.onRepeat && !this.options.repeatRefresh) return !1;
    const s = this.events, { crossings: r, passes: o } = Kn(
      s.map((l) => l.time),
      t,
      n,
      { duration: this.timeline.duration, alternate: this.options.yoyo === !0, holding: i }
    );
    for (const l of r) {
      if (this.killed) return !0;
      if (l.kind === "repeat") {
        this.options.repeatRefresh && this.refreshForRepeat(), this.options.onRepeat?.();
        continue;
      }
      const a = s[l.index];
      if (!(a.direction && a.direction !== l.direction)) {
        if (a.pause)
          return this.timeline.seek(a.time), this.stage.render(this.timeline), this.pause(), this.playhead = this.readPlayhead(), this.waitingToWrap = !1, a.run(), !0;
        a.run();
      }
    }
    for (const l of this.ranges)
      o.some(([c, h]) => c !== h && Math.max(c, h) >= l.start && Math.min(c, h) <= l.end) && l.run();
    return !1;
  }
  /**
   * Compile one tween call. A track has one start value and one set of values,
   * but some tweens differ per element — each element's own shape, text or stroke
   * length, each plain object's own current values, or function values called per
   * element — so those build one tween per element at the same position, with any
   * stagger turned into delays. `varsList` is `[vars]`, or `[fromVars, toVars]`.
   */
  tween(t, n, i, s) {
    const r = this.resolve(t);
    if (!r) return;
    const { onStart: o, onUpdate: l, onComplete: a } = n[n.length - 1];
    if (o || l || a) {
      let c = 1 / 0, h = -1 / 0;
      const f = (u, d, m) => {
        s(u, d, m), c = Math.min(c, this.compat.lastStart), h = Math.max(h, this.compat.lastEnd);
      };
      if (this.buildTween(r, n, i, f), c === 1 / 0) return;
      o && this.events.push({ time: c, direction: "forward", run: o }), l && this.ranges.push({ start: c, end: h, run: l }), a && this.events.push({ time: h, direction: "forward", run: a });
      return;
    }
    this.buildTween(r, n, i, s);
  }
  /**
   * A tween with `keyframes`: its segments one after another, from the tween's
   * position and delay. With `stagger`, each target plays the whole sequence,
   * offset like any stagger. Callbacks belong to the sequence as a whole.
   */
  keyframed(t, n, i) {
    const s = this.resolve(t);
    if (!s) return;
    const r = Oo(n);
    if (r.length === 0) return;
    const o = s.length > 1 ? we(n.stagger, this.staggerContext(s)) : void 0, l = s.map((g) => this.targetFor(g)).filter((g) => g !== void 0), a = o ? l.map((g) => [g]) : [l], c = o ? de(s.length, o).map((g) => g / 1e3) : [0], h = this.compat.timeOf(i) / 1e3 + Wt(n.delay, 0) / 1e3;
    let f = 1 / 0, u = -1 / 0;
    if (a.forEach((g, y) => {
      r.forEach((b, w) => {
        const T = w === 0 ? h + c[y] : ">";
        this.tween(g, [b], T, ([v], x, S) => this.compat.to(x, v, S)), f = Math.min(f, this.compat.lastStart), u = Math.max(u, this.compat.lastEnd);
      });
    }), f === 1 / 0) return;
    const { onStart: d, onUpdate: m, onComplete: p } = n;
    d && this.events.push({ time: f, direction: "forward", run: d }), m && this.ranges.push({ start: f, end: u, run: m }), p && this.events.push({ time: u, direction: "forward", run: p });
  }
  staggerContext(t) {
    return {
      count: t.length,
      columnsFromLayout: () => xn(t.map((n) => this.stage.elementFor(n))),
      random: () => this.stage.utils.random(0, 1)
    };
  }
  buildTween(t, n, i, s) {
    const r = t.map((u) => this.targetFor(u));
    if (!(t.length > 1 && (n.some(Xo) || t.some((u) => this.stage.objectFor(u) !== void 0)))) {
      const u = this.targetFor(t[0]);
      s(n.map((d) => this.prepare(Tn(d, 0, u, this.stage.utils, r), t)), t, i);
      return;
    }
    const l = n.length - 1, { stagger: a, ...c } = n[l], h = we(a, this.staggerContext(t)), f = h ? de(t.length, h).map((u) => u / 1e3) : t.map(() => 0);
    t.forEach((u, d) => {
      const m = d === 0 ? Wt(c.delay, 0) / 1e3 + f[0] : 0, p = d === 0 ? 0 : f[d] - f[d - 1], g = d === 0 ? i : `<${p < 0 ? "-" : "+"}${Math.abs(p).toFixed(6)}`, b = n.map((w, T) => T === l ? { ...c, delay: m } : w).map((w) => this.prepare(Tn(w, d, this.targetFor(u), this.stage.utils, r), [u]));
      s(b, [u], g);
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
  prepare(t, n) {
    const i = (o) => this.options.onWarning?.(o), s = (o) => this.stage.query(o);
    let r = t;
    if (t.motionPath !== void 0) {
      const o = Xr(t.motionPath, {
        query: s,
        targets: n.map((l) => this.stage.elementFor(l)).filter((l) => !!l),
        warn: i
      });
      r = { ...r, motionPath: o };
    }
    if (t.morphSVG !== void 0) {
      const o = Wr(t.morphSVG, s, i), { morphSVG: l, ...a } = r;
      r = o ? { ...r, morphSVG: o } : a;
    }
    if (t.drawSVG !== void 0) {
      const o = kn(this.stage.elementFor(n[0]));
      if (o === void 0) {
        i("gsap-compat: drawSVG needs an SVG shape with a stroke (path, line, circle…)");
        const { drawSVG: l, ...a } = r;
        r = a;
      } else
        r = yr(r, o);
    }
    return r;
  }
  resolve(t) {
    const n = this.stage.resolveTargets(t);
    if (n.length === 0) {
      this.options.onWarning?.(`gsap-compat: no elements found for target ${Vo(t)}`);
      return;
    }
    return this.firstElement ??= n.map((i) => this.stage.elementFor(i)).find((i) => i !== void 0), n;
  }
}
function Yo(e = new Or()) {
  const t = (r) => {
    const { config: o } = Bt(r);
    return new z(e, {
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
  }, n = (r) => {
    const { onStart: o, onUpdate: l, onComplete: a, onRepeat: c, onReverseComplete: h, repeatRefresh: f, ...u } = r;
    return u;
  }, i = (r) => (r && e.collector?.track(r), r), s = {
    stage: e,
    ticker: e.ticker,
    utils: e.utils,
    getProperty: (r, o) => {
      const [l] = e.resolveTargets(r);
      if (l === void 0) return;
      const a = e.objectFor(l);
      return a ? a[o] : e.appliedValue(l, o) ?? oi(o);
    },
    scrollTrigger: (r) => i($e(e, r)),
    scrollBatch: (r, o) => No(e, r, o).map((l) => i(l)),
    scrollTo: (r, o) => vn(s, e, r, o),
    refreshScroll: () => {
      Zt.refreshAll(), yn.refreshAll();
    },
    smoothScroll: (r = {}) => {
      const o = typeof r.scroller == "string" ? (e.collector?.scope ?? e.root).querySelector(r.scroller) : r.scroller;
      return i(new yn({ ...r, scroller: o }).start());
    },
    context: (r, o) => {
      const l = new yi(e, o);
      return r && l.add(() => r(l)), l;
    },
    matchMedia: (r) => new Ao(e, r),
    customEase: Ro.create,
    customBounce: Lo.create,
    customWiggle: Fo.create,
    pageTransition: (r) => Co(s, e, (o) => new z(e, o), r),
    imageSequence: (r, o) => {
      const l = typeof r == "string" ? (e.collector?.scope ?? e.root).querySelector(r) : r;
      if (!(l instanceof HTMLCanvasElement)) throw new Error(`gsap-compat: imageSequence needs a <canvas>, got ${String(r)}`);
      return i(new Eo(l, o));
    },
    quickTo: (r, o, l = {}) => {
      const a = new z(e, { paused: !0 }), [c] = e.resolveTargets(r);
      return Object.assign((f) => {
        if (!c) return;
        const u = l.spring !== void 0 ? e.velocityOf(c, o) ?? 0 : 0;
        a.compat.reset(), a.compat.to(c, {
          [o]: f,
          duration: l.duration ?? 0.4,
          ease: l.ease ?? "power3.out",
          ...l.spring !== void 0 && { spring: qo(l.spring, o, u) }
        }), a.timeline.stop(), a.timeline.play(), e.activate(a.timeline);
      }, { tween: a, kill: () => a.kill() });
    },
    timeline: (r) => new z(e, r),
    // A single tween's callbacks are its timeline's, so they are not placed again as events.
    to: (r, o) => {
      if (o.scrollTo !== void 0) {
        const { scrollTo: l, ...a } = o, c = typeof l == "object" && l !== null && !("nodeType" in l) ? l : {}, h = typeof r != "string" && r !== window && r.nodeType === 1;
        return vn(s, e, l, {
          ...a,
          offsetX: c.offsetX,
          offsetY: c.offsetY,
          scroller: h ? r : void 0
        });
      }
      return t(o).to(r, n(o));
    },
    from: (r, o) => t(o).from(r, n(o)),
    fromTo: (r, o, l) => t(l).fromTo(r, o, n(l)),
    set: (r, o) => t(o).set(r, n(o)),
    delayedCall: (r, o, l) => new z(e).call(o, l, r),
    killTweensOf: (r, o) => {
      const l = e.resolveTargets(r), a = typeof o == "string" ? o.split(",").map((c) => c.trim()).filter(Boolean) : o;
      for (const c of [...e.liveTimelines]) c.killTweensOf(l, a);
    },
    convertToPath: (r) => Hr(r, e.root),
    splitText: (r, o) => {
      const l = e.collector?.scope ?? e.root, a = typeof r == "string" ? Array.from(l.querySelectorAll(r)) : "nodeType" in r ? [r] : Array.from(r);
      return i(eo(a, o));
    },
    draggable: (r, o) => i(Zr(s, e, r, o)),
    getFlipState: (r) => Te(e, r),
    flipFrom: (r, o) => xe(e, (l) => new z(e, l), r, o),
    flip: (r, o, l) => {
      const a = Te(e, r);
      return o(), xe(e, (c) => new z(e, c), a, { targets: r, ...l });
    }
  };
  return s;
}
const X = /* @__PURE__ */ Yo();
function qo(e, t, n) {
  return e === !0 ? { velocity: { [t]: n } } : typeof e == "string" ? { preset: e, velocity: { [t]: n } } : { ...e, velocity: { [t]: n } };
}
function Xo(e) {
  return e.morphSVG !== void 0 || e.drawSVG !== void 0 || e.text !== void 0 || e.scrambleText !== void 0 || bi(e);
}
function bi(e) {
  return Object.entries(e).some(([t, n]) => (typeof n == "function" || ri(n)) && !Le.has(t));
}
function Tn(e, t, n, i, s) {
  if (!bi(e)) return e;
  const r = {};
  for (const [o, l] of Object.entries(e))
    Le.has(o) ? r[o] = l : typeof l == "function" ? r[o] = l(t, n, s) : ri(l) ? r[o] = i.resolveRandomString(l) : r[o] = l;
  return r;
}
function xn(e) {
  const t = e.map((i) => i?.getBoundingClientRect().top);
  if (t[0] === void 0) return e.length;
  let n = 0;
  for (const i of t) {
    if (i === void 0 || Math.abs(i - t[0]) > 1) break;
    n++;
  }
  return Math.max(1, n);
}
function kn(e) {
  const t = e;
  if (typeof t?.getTotalLength == "function")
    return t.getTotalLength();
}
function Wo(e) {
  if (typeof e == "number" || typeof e == "string" || Array.isArray(e) && e.every((t) => typeof t == "number")) return e;
}
function Vo(e) {
  return typeof e == "string" ? `"${e}"` : String(e);
}
class Sn {
  media;
  offset;
  driftTolerance;
  constructor(t, n = {}) {
    this.media = t, this.offset = n.offset ?? 0, this.driftTolerance = Math.max(0, n.driftTolerance ?? 0.15);
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
  update(t, n) {
    const i = this.targetTime(t);
    n ? (this.media.paused && this.safePlay(), Math.abs(this.media.currentTime - i) > this.driftTolerance && (this.media.currentTime = i)) : (this.media.paused || this.media.pause(), this.media.currentTime !== i && (this.media.currentTime = i));
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
function Ho(e, t, n, i, s) {
  const r = n - s;
  if (r < 0) {
    t.paused || t.pause(), t.currentTime = 0;
    return;
  }
  e.update(r, i);
}
class De {
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
  constructor(t, n = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i)
        throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = n, this.adapter = new tt();
  }
  /**
   * Load animation from a URL or JSON object.
   */
  async load(t) {
    this.scenarioList = [], this.scenarioId = void 0, await this.loadSource(t);
  }
  async loadSource(t) {
    let n;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load animation: ${i.statusText}`);
      n = await i.json();
    } else
      n = t;
    this.useDefinition(n), this.showInitialFrame(), this.watchReducedMotion(), this.watchVisibility(), this.options.autoplay && !this.reducedMotion && (this.options.playWhenVisible && !this.onScreen ? this.autoplayWhenSeen = !0 : this.play());
  }
  /**
   * Make a definition the current timeline: targets, symbols and media bound, no
   * frame drawn and nothing played. The definition itself is not modified, so a
   * scenario's timeline can be used again.
   */
  useDefinition(t) {
    const n = { ...t.config };
    this.options.speed !== void 0 && (n.speed = this.options.speed), this.options.loop !== void 0 && (n.loop = this.options.loop), this.options.alternate !== void 0 && (n.alternate = this.options.alternate), this.timeline = kt({ ...t, config: n }), this.markerList = this.timeline.markers, this.lastMarkerId = null, this.options.onComplete && (this.timeline.onComplete = this.options.onComplete), this.options.onUpdate && (this.timeline.onUpdate = this.options.onUpdate), this.autoRegisterTargets(), this.setupSymbolInstances(), this.scanMedia();
  }
  // --- scenarios: the reader chooses which timeline plays --------------------
  /**
   * Load several timelines for the same markup, and show one. The reader switches
   * with `setScenario`; the embed's controls and `data-tinyfly-choose` hotspots
   * call it.
   */
  async loadScenarios(t, n = {}) {
    if (t.length === 0) throw new Error("tinyfly: loadScenarios needs at least one scenario");
    const i = /* @__PURE__ */ new Set();
    for (const r of t) {
      if (i.has(r.id)) throw new Error(`tinyfly: scenario id "${r.id}" is used more than once`);
      i.add(r.id);
    }
    const s = n.initial === void 0 ? t[0] : t.find((r) => r.id === n.initial);
    if (!s) throw new Error(`tinyfly: there is no scenario "${n.initial}"`);
    this.scenarioList = [...t], this.scenarioId = s.id, await this.loadSource(s.timeline);
  }
  /** The scenarios to choose from (empty for a single timeline). */
  get scenarios() {
    return this.scenarioList.map((t) => ({ id: t.id, label: t.label ?? t.id }));
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
  setScenario(t) {
    const n = this.scenarioList.find((l) => l.id === t);
    if (!n || !this.timeline) return !1;
    if (t === this.scenarioId) return !0;
    const i = this.isPlaying, s = this.currentTime >= this.duration - 0.5, r = this.currentMarker?.id;
    this.stopAnimationLoop(), this.stepping = !1, this.pausedByVisibility = !1, this.restoreAuthored(), this.scenarioId = t, this.useDefinition(n.timeline), this.lastMarkerId = null;
    let o = 0;
    return this.reducedMotion || s ? o = this.duration : r !== void 0 && (o = this.markers.find((l) => l.id === r)?.time ?? 0), this.seek(o), i && !this.reducedMotion ? (this.stepping = this.options.stepMode === !0, this.startPlaying()) : this.notify(), !0;
  }
  /** Remember how an element was authored, the first time it becomes a target. */
  rememberAuthored(t) {
    if (this.authored.has(t)) return;
    const n = { style: t.getAttribute("style") };
    t.children.length === 0 && (n.text = t.textContent ?? "");
    const i = t.tagName.toLowerCase() === "path" ? t : t.querySelector("path");
    i && (n.path = { element: i, d: i.getAttribute("d") }), this.authored.set(t, n);
  }
  /** Put every target back the way it was authored. */
  restoreAuthored() {
    for (const [t, n] of this.authored) {
      n.style === null ? t.removeAttribute("style") : t.setAttribute("style", n.style), n.text !== void 0 && t.textContent !== n.text && (t.textContent = n.text), n.path && (n.path.d === null ? n.path.element.removeAttribute("d") : n.path.element.setAttribute("d", n.path.d));
      const i = t.dataset;
      i && delete i.shineBase;
    }
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
    let n;
    for (const i of this.markers)
      if (i.time <= t + 0.5) n = i;
      else break;
    return n;
  }
  /**
   * Caption for a marker (default: the current one) in a language (default: the
   * container's closest `lang`, then the document's), falling back to the
   * marker's own label.
   */
  caption(t, n) {
    const i = t ? this.markers.find((o) => o.id === t) : this.currentMarker;
    if (!i) return;
    const s = n ?? this.language(), r = (o) => o?.[s]?.[i.id] ?? o?.[s.split("-")[0]]?.[i.id];
    return r(this.options.captions) ?? r(this.timeline?.captions) ?? i.label;
  }
  /** Move to the next marker: animated, or a jump under reduced motion. At the last marker, to the end. */
  next() {
    if (!this.timeline) return;
    const t = this.currentTime, n = this.markers.find((i) => i.time > t + 0.5);
    if (this.reducedMotion) {
      this.seek(n ? n.time : this.duration);
      return;
    }
    t >= this.duration - 0.5 || (this.stepping = n !== void 0, this.startPlaying());
  }
  /** Jump back to the previous marker (or the start). */
  prev() {
    if (!this.timeline) return;
    const t = this.currentTime, n = [...this.markers].reverse().find((i) => i.time < t - 0.5);
    this.pause(), this.seek(n ? n.time : 0);
  }
  /** Jump to a marker by id, paused there. */
  goToMarker(t) {
    const n = this.markers.find((i) => i.id === t);
    n && (this.pause(), this.seek(n.time));
  }
  language() {
    return this.container.closest("[lang]")?.getAttribute("lang") || (typeof document < "u" ? document.documentElement.lang : "") || "en";
  }
  showInitialFrame() {
    if (!this.timeline) return;
    const t = this.options.initialFrame ?? "start";
    if (t === "none") return;
    const n = t === "end" ? this.timeline.duration : t === "start" ? 0 : t;
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
          for (const i of n) this.onScreen = i.isIntersecting;
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
    const t = this.currentMarker, n = t?.id;
    n !== this.lastMarkerId && (this.lastMarkerId = n, this.options.onMarker(t));
  }
  /**
   * Find embedded media elements (`[data-tinyfly-media]`) in the container and
   * bind each to the timeline. Emitted by the editor's export for audio/video
   * scene elements; the `data-tinyfly-start` attribute sets when each begins.
   */
  scanMedia() {
    this.mediaTargets = [], this.container.querySelectorAll("[data-tinyfly-media]").forEach((n) => {
      const i = n, s = Number(i.getAttribute("data-tinyfly-start") ?? "0") || 0, r = i.getAttribute("data-volume");
      r !== null && (i.volume = Math.max(0, Math.min(1, Number(r) || 0))), this.mediaTargets.push({ el: i, startTime: s, sync: new Sn(i) });
    });
  }
  /** Sync all discovered media targets to a timeline time. */
  syncAllMedia(t, n) {
    for (const i of this.mediaTargets)
      Ho(i.sync, i.el, t, n, i.startTime);
  }
  /**
   * Load animation from inline JSON string.
   */
  loadFromString(t) {
    const n = JSON.parse(t);
    this.load(n);
  }
  /**
   * Register a target element by name.
   */
  registerTarget(t, n) {
    if (typeof n == "string") {
      const i = this.container.querySelector(n);
      i && (this.rememberAuthored(i), this.targets[t] = i, this.adapter.registerTarget(t, i));
    } else
      this.rememberAuthored(n), this.targets[t] = n, this.adapter.registerTarget(t, n);
  }
  /**
   * Auto-register targets using data-tinyfly attribute.
   */
  autoRegisterTargets() {
    this.container.querySelectorAll("[data-tinyfly]").forEach((n) => {
      const i = n.closest("[data-tinyfly-symbol]");
      if (i && i !== n) return;
      const s = n.getAttribute("data-tinyfly");
      s && this.registerTarget(s, n);
    }), this.timeline && new Set(this.timeline.tracks.map((i) => i.target)).forEach((i) => {
      if (!this.targets[i]) {
        const s = this.container.querySelector(`[data-tinyfly="${i}"]`) || this.container.querySelector(`.${i}`) || this.container.querySelector(`#${i}`);
        s && this.registerTarget(i, s);
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
    const n = new Map(t.map((i) => [i.id, i]));
    this.container.querySelectorAll("[data-tinyfly-symbol]").forEach((i) => {
      const s = i.getAttribute("data-tinyfly-symbol");
      if (!s) return;
      const r = n.get(s);
      if (!r || !r.timeline.tracks?.length) return;
      const o = new tt();
      i.querySelectorAll("[data-tinyfly]").forEach((l) => {
        const a = l.getAttribute("data-tinyfly");
        a && o.registerTarget(a, l);
      }), this.symbolInstances.push({ adapter: o, timeline: kt(r.timeline) });
    });
  }
  /**
   * Attach an audio/video element (or any {@link SyncableMedia}) that should
   * stay in sync with the animation timeline. The timeline remains the clock;
   * the media follows its play/pause/seek and rate, with drift corrected as it
   * plays. Pass `{ offset }` to start the media at a timeline offset.
   */
  attachMedia(t, n) {
    this.mediaSync = new Sn(t, n), this.timeline && (this.mediaSync.setRate(this.timeline.speed), this.mediaSync.update(this.timeline.currentTime, this.isPlaying));
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
    this.symbolInstances = [], this.authored.clear(), this.timeline = null;
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const t = (n) => {
      if (this.isDestroyed || !this.timeline) return;
      const i = n - (this.lastTime ?? n);
      this.lastTime = n;
      const s = this.playhead;
      this.timeline.tick(i), this.stopAtMarker(s), this.applyState();
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
    const n = this.timeline, i = { time: n.currentTime, iteration: n.loopIteration, direction: n.direction };
    this.playhead = i;
    const s = this.markers;
    if (s.length === 0) return;
    const { crossings: r } = Kn(
      s.map((o) => o.time),
      t,
      i,
      { duration: n.duration, alternate: n.config.alternate === !0, holding: n.repeatDelayRemaining > 0 }
    );
    for (const o of r) {
      if (o.kind !== "event") continue;
      const l = s[o.index];
      if (this.stepping || l.pause) {
        this.stepping = !1, n.pause(), n.seek(l.time), this.playhead = { time: l.time, iteration: n.loopIteration, direction: n.direction };
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
    for (const n of this.symbolInstances) {
      const i = n.timeline.duration;
      n.adapter.applyState(n.timeline.getStateAtTime(i > 0 ? t % i : t));
    }
  }
}
async function yl(e, t, n = {}) {
  const i = new De(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
function bl(e, t = {}) {
  return new De(e, t);
}
const Uo = {
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
}, Mn = "tinyfly-controls-style", zo = `
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
let jo = 0;
function Go(e) {
  if (e.getElementById(Mn)) return;
  const t = e.createElement("style");
  t.id = Mn, t.textContent = zo, e.head.appendChild(t);
}
function Ko(e, t, n = {}) {
  const i = t.ownerDocument;
  Go(i);
  const s = { ...Uo, ...n.labels }, r = n.speeds ?? [0.5, 1, 2], o = () => e.markers.length > 0, l = () => e.markers.some((M) => M.label !== void 0 || e.caption(M.id) !== void 0), a = i.createElement("div");
  a.className = "tf-ctl";
  const c = i.createElement("div");
  c.className = "tf-ctl-bar", c.setAttribute("role", "group");
  const h = (M, I, F, N = "") => {
    const O = i.createElement("button");
    return O.type = "button", O.className = `tf-ctl-btn ${N}`.trim(), O.setAttribute("aria-label", M), O.title = M, O.textContent = I, O.addEventListener("click", F), O;
  }, f = h(s.restart, "⟲", () => {
    e.pause(), e.seek(0);
  }), u = h(s.prev, "|◀", () => e.prev()), d = h(s.play, "▶", () => e.isPlaying ? e.pause() : p(), "tf-ctl-primary"), m = h(s.next, "▶|", () => e.next()), p = () => {
    e.currentTime >= e.duration - 0.5 && e.seek(0), e.play();
  }, g = i.createElement("input");
  g.type = "range", g.className = "tf-ctl-scrub", g.min = "0", g.max = "1000", g.step = "1", g.setAttribute("aria-label", s.scrub), g.addEventListener("input", () => {
    e.pause(), e.seek(Number(g.value) / 1e3 * e.duration);
  });
  const y = i.createElement("span");
  y.className = "tf-ctl-step";
  const b = i.createElement("select");
  b.className = "tf-ctl-speed", b.setAttribute("aria-label", s.speed);
  for (const M of r) {
    const I = i.createElement("option");
    I.value = String(M), I.textContent = `${M}×`, M === 1 && (I.selected = !0), b.appendChild(I);
  }
  b.addEventListener("change", () => e.setSpeed(Number(b.value))), c.append(f, u, d, m, g, y), r.length > 0 && c.append(b), a.append(c);
  const w = n.fullscreen ? ta(t, i, s) : void 0;
  w && c.append(w.button);
  const T = i.createElement("p");
  T.className = "tf-ctl-caption", T.setAttribute("aria-live", "polite"), n.captions !== !1 && a.append(T);
  const v = i.createElement("div");
  v.className = "tf-ctl-question", v.hidden = !0;
  const x = i.createElement("span"), S = h(s.reveal, s.reveal, () => e.play(), "tf-ctl-primary");
  v.append(x, S), a.append(v);
  const C = Zo(e, i, s.scenario, n.scenarioControl ?? "buttons");
  C && a.append(C.element);
  const R = n.mount;
  R ? R.appendChild(a) : t.insertAdjacentElement("afterend", a);
  const _ = () => {
    const M = e.isPlaying;
    d.textContent = M ? "❚❚" : "▶", d.setAttribute("aria-label", M ? s.pause : s.play), d.title = M ? s.pause : s.play;
    const I = e.duration;
    i.activeElement !== g && (g.value = String(I > 0 ? Math.round(e.currentTime / I * 1e3) : 0));
    const F = e.markers;
    if (u.hidden = m.hidden = y.hidden = F.length === 0, F.length > 0) {
      const N = e.currentMarker, O = N ? F.indexOf(N) + 1 : 0;
      y.textContent = s.stepFormat.replace("{index}", String(O)).replace("{total}", String(F.length)), y.setAttribute("aria-label", `${s.step} ${O} ${s.of} ${F.length}`), u.disabled = e.currentTime <= 0.5, m.disabled = e.currentTime >= I - 0.5;
      const L = e.caption() ?? "";
      T.textContent !== L && (T.textContent = L), T.hidden = !l();
      const $ = !M && N?.question !== void 0 && Math.abs(e.currentTime - N.time) < 1;
      v.hidden = !$, $ && x.textContent !== N.question && (x.textContent = N.question);
    } else
      v.hidden = !0, T.hidden = !0;
    C?.update();
  }, k = e.subscribe(_);
  _();
  const A = n.keyboardScope ?? t;
  !A.hasAttribute("tabindex") && A.tabIndex < 0 && (A.tabIndex = 0);
  const E = /* @__PURE__ */ new WeakSet(), P = (M) => {
    if (E.has(M) || (E.add(M), M.defaultPrevented || M.altKey || M.ctrlKey || M.metaKey)) return;
    const I = M.target;
    if (!(I.tagName === "INPUT" || I.tagName === "SELECT") && !(M.key === " " && I.tagName === "BUTTON"))
      switch (M.key) {
        case " ":
          M.preventDefault(), e.isPlaying ? e.pause() : p();
          break;
        case "ArrowRight":
          if (!o()) return;
          M.preventDefault(), e.next();
          break;
        case "ArrowLeft":
          if (!o()) return;
          M.preventDefault(), e.prev();
          break;
        case "Home":
          M.preventDefault(), e.pause(), e.seek(0);
          break;
        case "f":
        case "F":
          if (!w) return;
          M.preventDefault(), w.active ? w.exit() : w.enter();
          break;
      }
  };
  return A.addEventListener("keydown", P), a.addEventListener("keydown", P), {
    element: a,
    fullscreen: w && {
      get active() {
        return w.active;
      },
      enter: w.enter,
      exit: w.exit
    },
    destroy() {
      w?.destroy(), k(), A.removeEventListener("keydown", P), a.removeEventListener("keydown", P), a.remove();
    }
  };
}
function Zo(e, t, n, i) {
  const s = e.scenarios;
  if (s.length < 2) return;
  if (i === "slider") {
    const h = t.createElement("div");
    h.className = "tf-ctl-choice-slider";
    const f = t.createElement("span");
    f.textContent = n, f.setAttribute("aria-hidden", "true");
    const u = t.createElement("input");
    u.type = "range", u.min = "0", u.max = String(s.length - 1), u.step = "1", u.setAttribute("aria-label", n);
    const d = t.createElement("output");
    return d.setAttribute("aria-hidden", "true"), u.addEventListener("input", () => {
      const p = s[Number(u.value)];
      p && e.setScenario(p.id);
    }), h.append(f, u, d), { element: h, update: () => {
      const p = Math.max(0, s.findIndex((y) => y.id === e.scenario));
      t.activeElement !== u && (u.value = String(p));
      const g = s[p].label;
      d.textContent !== g && (d.textContent = g), u.setAttribute("aria-valuetext", g);
    } };
  }
  const r = t.createElement("fieldset");
  r.className = "tf-ctl-choices";
  const o = t.createElement("legend");
  o.textContent = n, r.append(o);
  const l = `tf-ctl-scenario-${++jo}`, a = s.map((h) => {
    const f = t.createElement("label");
    f.className = "tf-ctl-choice";
    const u = t.createElement("input");
    u.type = "radio", u.name = l, u.value = h.id, u.addEventListener("change", () => {
      u.checked && e.setScenario(h.id);
    });
    const d = t.createElement("span");
    return d.textContent = h.label, f.append(u, d), r.append(f), u;
  });
  return { element: r, update: () => {
    for (const h of a) {
      const f = h.value === e.scenario;
      h.checked !== f && (h.checked = f);
    }
  } };
}
const Qo = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>', Jo = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
function ta(e, t, n) {
  const i = t, s = e, r = t.createElement("button");
  r.type = "button", r.className = "tf-ctl-btn tf-ctl-fullscreen";
  let o, l = "";
  const a = () => {
    const p = o !== void 0;
    r.innerHTML = p ? Jo : Qo;
    const g = p ? n.exitFullscreen : n.fullscreen;
    r.setAttribute("aria-label", g), r.title = g, r.setAttribute("aria-pressed", String(p)), e.classList.toggle("tf-fullscreen", p), e.classList.toggle("tf-fullscreen-overlay", o === "overlay");
  }, c = () => i.fullscreenElement ?? i.webkitFullscreenElement ?? null, h = () => {
    c() === e ? o = "native" : o === "native" && (o = void 0), a();
  }, f = (p) => {
    p.key === "Escape" && m();
  }, u = () => {
    o = "overlay", l = t.documentElement.style.overflow, t.documentElement.style.overflow = "hidden", t.addEventListener("keydown", f), a();
  };
  async function d() {
    if (o) return;
    const p = s.requestFullscreen?.bind(s) ?? s.webkitRequestFullscreen?.bind(s), g = i.fullscreenEnabled ?? i.webkitFullscreenEnabled ?? !1;
    if (p && g)
      try {
        if (await p(), c() === e) {
          o = "native", a();
          return;
        }
      } catch {
      }
    u();
  }
  async function m() {
    if (o === "overlay")
      t.removeEventListener("keydown", f), t.documentElement.style.overflow = l, o = void 0, a();
    else if (o === "native") {
      o = void 0, a();
      const p = i.exitFullscreen?.bind(i) ?? i.webkitExitFullscreen?.bind(i);
      c() === e && p && await p();
    }
  }
  return r.addEventListener("click", () => {
    o ? m() : d();
  }), t.addEventListener("fullscreenchange", h), t.addEventListener("webkitfullscreenchange", h), a(), {
    button: r,
    get active() {
      return o !== void 0;
    },
    enter: d,
    exit: m,
    destroy() {
      m(), t.removeEventListener("fullscreenchange", h), t.removeEventListener("webkitfullscreenchange", h), r.remove();
    }
  };
}
const An = "tinyfly-choices-style", ea = `
[data-tinyfly-choose] { cursor: pointer; }
[data-tinyfly-choose]:focus-visible { outline: 2px solid var(--tf-ctl-accent, #c2410c); outline-offset: 2px; }
`;
function na(e) {
  if (e.getElementById(An)) return;
  const t = e.createElement("style");
  t.id = An, t.textContent = ea, e.head.appendChild(t);
}
function ia(e, t) {
  const n = Array.from(t.querySelectorAll("[data-tinyfly-choose]"));
  if (n.length === 0) return () => {
  };
  na(t.ownerDocument);
  const i = [], s = [];
  for (const l of n) {
    const a = l.getAttribute("data-tinyfly-choose") ?? "", c = [], h = (m, p) => {
      l.hasAttribute(m) || (l.setAttribute(m, p), c.push(m));
    };
    h("role", "button"), h("tabindex", "0");
    const f = e.scenarios.find((m) => m.id === a)?.label;
    f !== void 0 && h("aria-label", f), l.setAttribute("aria-pressed", "false"), c.push("aria-pressed"), i.push({ element: l, attributes: c });
    const u = () => e.setScenario(a), d = (m) => {
      const p = m.key;
      p !== "Enter" && p !== " " || (m.preventDefault(), u());
    };
    l.addEventListener("click", u), l.addEventListener("keydown", d), s.push(() => {
      l.removeEventListener("click", u), l.removeEventListener("keydown", d);
    });
  }
  const r = () => {
    for (const { element: l } of i)
      l.setAttribute("aria-pressed", String(l.getAttribute("data-tinyfly-choose") === e.scenario));
  }, o = e.subscribe(r);
  return r(), () => {
    o();
    for (const l of s) l();
    for (const { element: l, attributes: a } of i) for (const c of a) l.removeAttribute(c);
  };
}
const Ht = /* @__PURE__ */ new WeakMap(), ke = /* @__PURE__ */ new WeakMap();
let sa = 0;
function vt(e, t, n) {
  if (e)
    try {
      return JSON.parse(e);
    } catch (i) {
      console.warn(`tinyfly: invalid ${t} JSON on`, n, i);
      return;
    }
}
async function ra(e, t = {}) {
  const n = Ht.get(e);
  if (n) return n;
  const i = Array.from(e.querySelectorAll("script[data-tinyfly-timeline]")), s = i[0], r = e.getAttribute("data-src"), o = aa(e.getAttribute("data-markers")), l = i.length > 1 || s?.hasAttribute("data-scenario") ? oa(i, o, e) : void 0;
  if (l && l.length === 0) return;
  let a = s && !l ? vt(s.textContent, "timeline", e) : void 0;
  if (!a && r && o) {
    const d = await fetch(r);
    d.ok && (a = await d.json());
  }
  if (a && o && (a = wi(a, o)), !a && !r && !l) {
    console.warn('tinyfly: embed has no timeline (a <script type="application/json" data-tinyfly-timeline> or data-src)', e);
    return;
  }
  const c = vt(e.querySelector("script[data-tinyfly-captions]")?.textContent, "captions", e), h = {
    playWhenVisible: !0,
    ...t.player,
    ...c && { captions: c },
    ...vt(e.getAttribute("data-options"), "data-options", e)
  };
  ca(e);
  const f = new De(e, h), u = { element: e, player: f };
  if (Ht.set(e, u), e.setAttribute("data-tinyfly-mounted", ""), l) {
    const d = e.getAttribute("data-scenario") ?? void 0;
    await f.loadScenarios(l, { initial: l.some((m) => m.id === d) ? d : void 0 }), ke.set(e, ia(f, e));
  } else
    await f.load(a ?? r);
  if (e.getAttribute("data-controls") !== "false") {
    const d = vt(e.getAttribute("data-labels"), "data-labels", e), m = e.querySelector("figcaption"), p = e.getAttribute("data-scenario-legend"), g = e.getAttribute("data-scenario-control");
    u.controls = Ko(f, e, {
      ...t.controls,
      ...e.getAttribute("data-fullscreen") === "true" ? { fullscreen: !0 } : {},
      ...g === "slider" || g === "buttons" ? { scenarioControl: g } : {},
      labels: { ...t.controls?.labels, ...d, ...p ? { scenario: p } : {} },
      // Inside the figure, before its figcaption, so the caption stays last.
      mount: void 0
    }), m ? e.insertBefore(u.controls.element, m) : e.appendChild(u.controls.element);
  }
  return u;
}
function oa(e, t, n) {
  const i = [];
  return e.forEach((s, r) => {
    const o = vt(s.textContent, "timeline", n);
    if (!o) return;
    const l = s.getAttribute("data-scenario") || `scenario-${r + 1}`;
    if (i.some((c) => c.id === l)) {
      console.warn(`tinyfly: scenario id "${l}" is used more than once; the later one is skipped`, n);
      return;
    }
    const a = s.getAttribute("data-scenario-label") ?? void 0;
    i.push({ id: l, label: a, timeline: t ? wi(o, t) : o });
  }), i;
}
function wi(e, t) {
  return e.config.markers?.length ? e : { ...e, config: { ...e.config, markers: t.map((n, i) => ({ id: `step-${i + 1}`, time: n })) } };
}
function aa(e) {
  if (!e) return;
  const t = e.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => Number.isFinite(n) && n >= 0).sort((n, i) => n - i);
  return t.length > 0 ? t : void 0;
}
async function la(e = document, t = {}) {
  const n = Array.from(e.querySelectorAll("[data-tinyfly-embed]"));
  return (await Promise.all(n.map((s) => ra(s, t)))).filter((s) => s !== void 0);
}
function wl(e) {
  const t = Ht.get(e);
  t && (ke.get(e)?.(), ke.delete(e), t.controls?.destroy(), t.player.destroy(), Ht.delete(e), e.removeAttribute("data-tinyfly-mounted"));
}
function ca(e) {
  const t = e.querySelector("svg");
  if (!t || t.hasAttribute("role") || t.hasAttribute("aria-hidden")) return;
  const n = e.getAttribute("data-alt"), i = e.querySelector("figcaption");
  t.setAttribute("role", "img"), n ? t.setAttribute("aria-label", n) : i && (i.id ||= `tinyfly-caption-${++sa}`, t.setAttribute("aria-labelledby", i.id));
}
function ha() {
  if (!(typeof document < "u" ? document.currentScript : null)?.hasAttribute("data-tinyfly-auto")) return;
  const t = () => {
    la();
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", t, { once: !0 }) : t();
}
class ua {
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
  constructor(t, n = {}) {
    if (typeof t == "string") {
      const i = document.querySelector(t);
      if (!i) throw new Error(`Container not found: ${t}`);
      this.container = i;
    } else
      this.container = t;
    this.options = n, this.container.style.position = "relative", this.container.style.overflow = "hidden", this.containerA = this.createSceneContainer(), this.containerB = this.createSceneContainer(), this.container.appendChild(this.containerA), this.container.appendChild(this.containerB), this.containerB.style.visibility = "hidden", this.adapterA = new tt(), this.adapterB = new tt();
  }
  /**
   * Load a sequence from a URL or inline definition.
   */
  async load(t) {
    let n;
    if (typeof t == "string") {
      const i = await fetch(t);
      if (!i.ok)
        throw new Error(`Failed to load sequence: ${i.statusText}`);
      n = await i.json();
    } else
      n = t;
    this.sequence = n, this.symbolDefs.clear();
    for (const i of n.symbols ?? [])
      i.timeline?.tracks?.length && this.symbolDefs.set(i.id, i.timeline);
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
      const t = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(t), this.applyNested(this.adapterA, 0);
    }
  }
  /**
   * Jump to a specific scene by index.
   */
  goToScene(t) {
    if (!this.sequence || t < 0 || t >= this.sequence.scenes.length) return;
    const n = this._isPlaying;
    this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.timelineA && this.timelineA.stop(), this.timelineB && this.timelineB.stop(), this._currentSceneIndex = t, this._state = n ? "playing-scene" : "idle", this.clearContainer(this.containerA), this.clearContainer(this.containerB), this.adapterA.clearTargets(), this.adapterB.clearTargets(), this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB);
    const i = this.sequence.scenes[t];
    if (this.renderScene(i, this.containerA, this.adapterA), this.timelineA = this.createTimeline(i), this.options.onSceneChange?.(t), n)
      this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play(), this.startAnimationLoop()) : this.onSceneComplete();
    else if (this.timelineA) {
      const s = this.timelineA.getStateAtTime(0);
      this.adapterA.applyState(s), this.applyNested(this.adapterA, 0);
    }
  }
  /**
   * Clean up all resources.
   */
  destroy() {
    this._isDestroyed = !0, this._isPlaying = !1, this.transitionTimer !== void 0 && (clearTimeout(this.transitionTimer), this.transitionTimer = void 0), this.stopAnimationLoop(), this.adapterA.clearTargets(), this.adapterB.clearTargets();
    for (const t of this.nestedByAdapter.values())
      for (const n of t) n.adapter.clearTargets();
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
  renderScene(t, n, i) {
    n.innerHTML = "", i.clearTargets();
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;inset:0;transform-origin:center center", s.setAttribute("data-tinyfly", "Camera"), n.appendChild(s), i.registerTarget("Camera", s);
    for (const r of t.elements) {
      if (!r.html) continue;
      const o = document.createElement("div");
      o.innerHTML = r.html.trim();
      const l = o.firstElementChild;
      if (l) {
        s.appendChild(l);
        const a = l.getAttribute("data-tinyfly");
        a && i.registerTarget(a, l);
      }
    }
    this.setupNested(s, i);
  }
  /**
   * For each symbol instance container (`[data-tinyfly-symbol]`) in a scene slot,
   * bind its inner elements to a private adapter driven by the symbol's timeline.
   */
  setupNested(t, n) {
    const i = [];
    t.querySelectorAll("[data-tinyfly-symbol]").forEach((s) => {
      const r = s.getAttribute("data-tinyfly-symbol");
      if (!r) return;
      const o = this.symbolDefs.get(r);
      if (!o) return;
      const l = new tt();
      s.querySelectorAll("[data-tinyfly]").forEach((a) => {
        const c = a.getAttribute("data-tinyfly");
        c && l.registerTarget(c, a);
      }), i.push({ adapter: l, timeline: kt(o) });
    }), i.length ? this.nestedByAdapter.set(n, i) : this.nestedByAdapter.delete(n);
  }
  /** Apply the nested symbol states for a slot at a given scene time. */
  applyNested(t, n) {
    const i = this.nestedByAdapter.get(t);
    if (i)
      for (const s of i) {
        const r = s.timeline.duration;
        s.adapter.applyState(s.timeline.getStateAtTime(r > 0 ? n % r : n));
      }
  }
  clearContainer(t) {
    t.innerHTML = "";
  }
  createTimeline(t) {
    return t.timeline ? kt(t.timeline) : null;
  }
  onSceneComplete() {
    if (this._isDestroyed || !this.sequence) return;
    const t = this._currentSceneIndex + 1;
    if (t >= this.sequence.scenes.length) {
      const n = this.options.loop ?? this.sequence.loop ?? 0;
      n === -1 || n > 0 && this.loopIteration < n - 1 ? (this.loopIteration++, this.beginTransitionTo(0)) : (this._isPlaying = !1, this._state = "idle", this.stopAnimationLoop(), this.options.onComplete?.());
    } else
      this.beginTransitionTo(t);
  }
  beginTransitionTo(t) {
    if (!this.sequence || this._isDestroyed) return;
    const n = this.sequence.scenes[t], i = n.transition;
    if (i.type === "none" || i.duration <= 0) {
      this.switchToScene(t);
      return;
    }
    this._state = "transitioning", this.containerB.style.visibility = "visible", this.renderScene(n, this.containerB, this.adapterB), this.timelineB = this.createTimeline(n), this.timelineB && this.timelineB.play(), this.applyTransition(i.type, i.duration), this.transitionTimer = window.setTimeout(() => {
      this.finishTransition(t);
    }, i.duration);
  }
  applyTransition(t, n) {
    const i = `${n}ms`, s = "ease-in-out";
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
    switch (this.containerB.offsetHeight, this.containerA.style.transition = `opacity ${i} ${s}, transform ${i} ${s}`, this.containerB.style.transition = `opacity ${i} ${s}, transform ${i} ${s}`, t) {
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
    const n = this.containerA;
    this.containerA = this.containerB, this.containerB = n;
    const i = this.adapterA;
    this.adapterA = this.adapterB, this.adapterB = i, this.timelineA = this.timelineB, this.timelineB = null, this.containerB.style.visibility = "hidden", this.resetTransitionStyles(this.containerA), this.resetTransitionStyles(this.containerB), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.playbackState !== "playing" && this.timelineA.play()) : this.onSceneComplete();
  }
  switchToScene(t) {
    if (!this.sequence || this._isDestroyed) return;
    this.timelineA && this.timelineA.stop(), this.adapterA.clearTargets(), this.clearContainer(this.containerA);
    const n = this.sequence.scenes[t];
    this.renderScene(n, this.containerA, this.adapterA), this.timelineA = this.createTimeline(n), this._currentSceneIndex = t, this._state = "playing-scene", this.options.onSceneChange?.(t), this.timelineA ? (this.timelineA.onComplete = () => this.onSceneComplete(), this.timelineA.play()) : this.onSceneComplete();
  }
  startAnimationLoop() {
    if (this.animationFrameId !== void 0) return;
    this.lastTime = performance.now();
    const t = (n) => {
      if (this._isDestroyed || !this._isPlaying) return;
      const i = n - (this.lastTime ?? n);
      if (this.lastTime = n, this.timelineA && this.timelineA.playbackState === "playing") {
        this.timelineA.tick(i);
        const s = this.timelineA.getStateAtTime(this.timelineA.currentTime);
        this.adapterA.applyState(s), this.applyNested(this.adapterA, this.timelineA.currentTime);
      }
      if (this._state === "transitioning" && this.timelineB && this.timelineB.playbackState === "playing") {
        this.timelineB.tick(i);
        const s = this.timelineB.getStateAtTime(this.timelineB.currentTime);
        this.adapterB.applyState(s), this.applyNested(this.adapterB, this.timelineB.currentTime);
      }
      this._isPlaying ? this.animationFrameId = requestAnimationFrame(t) : this.animationFrameId = void 0;
    };
    this.animationFrameId = requestAnimationFrame(t);
  }
  stopAnimationLoop() {
    this.animationFrameId !== void 0 && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = void 0);
  }
}
async function vl(e, t, n = {}) {
  const i = new ua(e, { ...n, autoplay: !0 });
  return await i.load(t), i;
}
const Tl = { type: "none", duration: 0 };
function fa(e) {
  let t = 0;
  for (let n = 1; n < e.length; n++) t += Math.hypot(e[n].x - e[n - 1].x, e[n].y - e[n - 1].y);
  return t;
}
function Mt(e, t) {
  const n = Math.min(1, Math.max(0, t));
  if (e.length < 2 || n === 1) return e.slice();
  if (n === 0) return e.slice(0, 1);
  let i = fa(e) * n;
  const s = [e[0]];
  for (let r = 1; r < e.length; r++) {
    const o = e[r - 1], l = e[r], a = Math.hypot(l.x - o.x, l.y - o.y);
    if (a >= i) {
      const c = a === 0 ? 0 : i / a;
      return s.push({ x: o.x + (l.x - o.x) * c, y: o.y + (l.y - o.y) * c }), s;
    }
    s.push(l), i -= a;
  }
  return s;
}
function vi(e, t) {
  const n = Mt(e, t);
  return n[n.length - 1];
}
function da(e, t) {
  return t > 0 ? Math.floor(Math.max(0, e) * t / 1e3) : 0;
}
function Se(e, t, n) {
  const i = t.roughness ?? 2, s = Math.max(1, Math.round(t.passes ?? 2)), r = da(n, t.boil ?? 8);
  let o = 0;
  const l = () => {
    const u = o++;
    return (d) => Qn(Vs(`${t.seed ?? 1}:${r}:${u}:${d}`));
  }, a = (u, d) => (u.next() * 2 - 1) * d, c = (u) => {
    const d = l(), m = e.lineWidth, p = e.globalAlpha;
    for (let g = 0; g < s; g++)
      e.lineWidth = g === 0 ? m : m * 0.55, e.globalAlpha = g === 0 ? p : p * 0.6, u(d(g));
    e.lineWidth = m, e.globalAlpha = p;
  }, h = (u, d = 1) => {
    if (u.length < 2) return;
    const m = u.slice(1).map((g, y) => Math.hypot(g.x - u[y].x, g.y - u[y].y)), p = m.reduce((g, y) => g + y, 0) * Math.min(1, Math.max(0, d));
    c((g) => {
      const y = [], b = [];
      if (u.forEach((T, v) => {
        y.push({ x: T.x + a(g, i * 0.5), y: T.y + a(g, i * 0.5) }), v > 0 && b.push([g.next() * 2 - 1, g.next() * 2 - 1]);
      }), p <= 0) return;
      e.beginPath(), e.moveTo(y[0].x, y[0].y);
      let w = 0;
      for (let T = 1; T < y.length; T++) {
        const v = pa(y[T - 1], y[T], i, b[T - 1]), x = m[T - 1];
        if (w + x <= p) {
          e.bezierCurveTo(v[1].x, v[1].y, v[2].x, v[2].y, v[3].x, v[3].y), w += x;
          continue;
        }
        const S = ma(v, x === 0 ? 1 : (p - w) / x);
        e.bezierCurveTo(S[1].x, S[1].y, S[2].x, S[2].y, S[3].x, S[3].y);
        break;
      }
      e.stroke();
    });
  }, f = (u, d, m, p, g = 1) => {
    c((y) => {
      const w = y.next() * Math.PI * 2, T = Math.PI * 2 + 0.15 + y.next() * 0.3, v = [];
      for (let S = 0; S <= 14; S++) {
        const C = w + T * S / 14, R = a(y, i * 0.6);
        v.push({ x: u + Math.cos(C) * (m + R), y: d + Math.sin(C) * (p + R) });
      }
      const x = Mt(v, g);
      x.length < 2 || (En(e, x), e.stroke());
    });
  };
  return {
    line: h,
    curve(u, d = 1) {
      if (u.length < 2) return;
      const m = u[0], p = u[u.length - 1], g = Math.hypot(p.x - m.x, p.y - m.y) || 1, y = -(p.y - m.y) / g, b = (p.x - m.x) / g;
      c((w) => {
        const T = { x: a(w, i * 0.5), y: a(w, i * 0.5) }, v = { x: a(w, i * 0.5), y: a(w, i * 0.5) }, x = a(w, i * Math.min(1.5, Math.max(0.3, g / 80))), S = u.map((R, _) => {
          const k = _ / (u.length - 1), A = Math.sin(Math.PI * k) * x;
          return {
            x: R.x + T.x + (v.x - T.x) * k + y * A,
            y: R.y + T.y + (v.y - T.y) * k + b * A
          };
        }), C = Mt(S, d);
        C.length < 2 || (En(e, C), e.stroke());
      });
    },
    circle(u, d, m, p = 1) {
      f(u, d, m, m, p);
    },
    ellipse: f,
    nudge(u = 0.5) {
      const d = l()(0);
      return { x: a(d, i * u), y: a(d, i * u) };
    }
  };
}
function pa(e, t, n, i) {
  const s = t.x - e.x, r = t.y - e.y, o = Math.hypot(s, r) || 1, l = n * Math.min(1.5, Math.max(0.3, o / 80)), a = -r / o, c = s / o;
  return [
    e,
    { x: e.x + s / 3 + a * i[0] * l, y: e.y + r / 3 + c * i[0] * l },
    { x: e.x + 2 * s / 3 + a * i[1] * l, y: e.y + 2 * r / 3 + c * i[1] * l },
    t
  ];
}
function ma([e, t, n, i], s) {
  const r = (f, u) => ({ x: f.x + (u.x - f.x) * s, y: f.y + (u.y - f.y) * s }), o = r(e, t), l = r(t, n), a = r(n, i), c = r(o, l), h = r(l, a);
  return [e, o, c, r(c, h)];
}
function En(e, t) {
  e.beginPath(), e.moveTo(t[0].x, t[0].y);
  for (let i = 1; i < t.length - 1; i++) {
    const s = { x: (t[i].x + t[i + 1].x) / 2, y: (t[i].y + t[i + 1].y) / 2 };
    e.quadraticCurveTo(t[i].x, t[i].y, s.x, s.y);
  }
  const n = t[t.length - 1];
  e.lineTo(n.x, n.y);
}
const ut = {
  lean: 0,
  headTilt: 0,
  leftShoulder: 18,
  rightShoulder: 18,
  leftElbow: -6,
  rightElbow: -6,
  leftHip: 8,
  rightHip: 8,
  leftKnee: 0,
  rightKnee: 0,
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
  sit: 0
};
function q(e) {
  return { ...ut, ...e };
}
const Ti = {
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
}, B = (e) => ({ ...Ti, ...e }), Z = {
  neutral: Ti,
  happy: B({ smile: 0.9, leftBrow: 0.2, rightBrow: 0.2 }),
  joyful: B({ mouth: 0.6, smile: 1, mouthWidth: 1.2, leftEye: 0, rightEye: 0, leftBrow: 0.4, rightBrow: 0.4 }),
  sad: B({ smile: -0.8, leftEye: 0.8, rightEye: 0.8, browTilt: 0.9, leftBrow: -0.1, rightBrow: -0.1, lookY: 0.6 }),
  crying: B({ mouth: 0.45, smile: -1, leftEye: 0, rightEye: 0, browTilt: 1, lookY: 0.4 }),
  surprised: B({ mouth: 0.7, mouthWidth: 0.7, leftEye: 1.5, rightEye: 1.5, leftBrow: 1, rightBrow: 1 }),
  shocked: B({ mouth: 1, mouthWidth: 0.8, leftEye: 1.6, rightEye: 1.6, leftBrow: 1, rightBrow: 1, browTilt: 0.4 }),
  angry: B({ smile: -0.6, mouthWidth: 0.9, leftEye: 0.8, rightEye: 0.8, leftBrow: -0.6, rightBrow: -0.6, browTilt: -1 }),
  furious: B({ mouth: 0.5, smile: -1, mouthWidth: 1.3, leftEye: 0.9, rightEye: 0.9, leftBrow: -0.9, rightBrow: -0.9, browTilt: -1 }),
  worried: B({ smile: -0.3, mouthWidth: 0.8, leftEye: 1.1, rightEye: 1.1, leftBrow: 0.3, rightBrow: 0.3, browTilt: 0.8, lookX: -0.5 }),
  scared: B({ mouth: 0.35, smile: -0.5, mouthWidth: 0.8, leftEye: 1.45, rightEye: 1.45, leftBrow: 0.8, rightBrow: 0.8, browTilt: 0.9 }),
  confused: B({ smile: -0.2, mouthWidth: 0.8, leftEye: 0.9, rightEye: 1.15, leftBrow: -0.3, rightBrow: 0.8, lookX: 0.5, lookY: -0.4 }),
  skeptical: B({ smile: -0.1, leftEye: 0.6, rightEye: 1, leftBrow: -0.4, rightBrow: 0.7, lookX: 0.4 }),
  thinking: B({ smile: 0, mouthWidth: 0.7, leftBrow: 0.3, rightBrow: 0.5, lookX: 0.6, lookY: -0.8 }),
  sleepy: B({ smile: 0.1, leftEye: 0.25, rightEye: 0.25, leftBrow: -0.3, rightBrow: -0.3, lookY: 0.5 }),
  disgusted: B({ smile: -0.7, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.75, leftBrow: -0.5, rightBrow: -0.2, browTilt: -0.4, lookX: -0.6 }),
  smug: B({ smile: 0.6, mouthWidth: 0.9, leftEye: 0.6, rightEye: 0.6, leftBrow: 0.1, rightBrow: 0.5, lookX: 0.5 }),
  wink: B({ smile: 0.9, leftEye: 0, rightEye: 1, leftBrow: -0.2, rightBrow: 0.3 })
};
function ga(e, t) {
  return { ...e, ...typeof t == "string" ? Z[t] : t };
}
const ya = {
  rest: ut,
  wave: q({ rightShoulder: 135, rightElbow: 30, headTilt: 6, ...Z.happy }),
  cheer: q({ leftShoulder: 125, leftElbow: 20, rightShoulder: 125, rightElbow: 20, ...Z.joyful }),
  shrug: q({ leftShoulder: 30, leftElbow: 85, rightShoulder: 30, rightElbow: 85, headTilt: -10, ...Z.confused, lookX: 0, lookY: 0 }),
  point: q({ rightShoulder: 90, rightElbow: 0, lean: 4, smile: 0.4 }),
  // The forearm passes 180° to fold back in, so the hand reaches the chin.
  think: q({ rightShoulder: 60, rightElbow: 150, headTilt: 10, ...Z.thinking }),
  handsOnHips: q({ leftShoulder: 45, leftElbow: -100, rightShoulder: 45, rightElbow: -100, leftHip: 14, rightHip: 14, smile: 0.8 }),
  sad: q({ leftShoulder: 14, rightShoulder: 14, leftElbow: -4, rightElbow: -4, headTilt: -14, lean: -3, ...Z.sad }),
  surprised: q({ leftShoulder: 70, leftElbow: 60, rightShoulder: 70, rightElbow: 60, ...Z.surprised }),
  // Squash and stretch: the wind-up before a jump (or the landing), and the jump itself.
  crouch: q({ stretch: 0.72, leftShoulder: 35, rightShoulder: 35, leftElbow: -50, rightElbow: -50, leftHip: 22, rightHip: 22, headTilt: -4 }),
  // Seated, hands resting on the knees. Arm angles spread outward per side, so
  // reaching forward (+x, the way the figure faces) is negative for the left arm.
  sit: q({ sit: 1, turn: 0.5, leftShoulder: -25, rightShoulder: 25, leftElbow: -55, rightElbow: 55 }),
  jump: q({ stretch: 1.22, leftShoulder: 140, rightShoulder: 140, leftElbow: 20, rightElbow: 20, leftHip: 4, rightHip: 4, ...Z.joyful })
}, xi = Object.keys(ut);
function ba(e, t, n) {
  const i = { ...e };
  for (const s of xi) i[s] = e[s] + (t[s] - e[s]) * n;
  return i;
}
const Me = 24, Pn = 4, _n = 28, wa = 40;
function va(e, t = ut, n = 1) {
  const i = Math.sin(e * Math.PI * 2) * n, s = Math.cos(e * Math.PI * 2) * n, r = (c) => c <= wa, o = (c) => r(c) ? 22 * i : c, l = r(t.leftShoulder) ? t.leftElbow - _n * Math.max(0, -i) : t.leftElbow, a = r(t.rightShoulder) ? t.rightElbow + _n * Math.max(0, i) : t.rightElbow;
  return {
    ...t,
    // Lean into the walk, and keep the head a little more level than the body.
    lean: t.lean + Pn * n,
    headTilt: t.headTilt - Pn * 0.5 * n,
    leftElbow: l,
    rightElbow: a,
    // Left foot forward while swing > 0, right foot back; then the other way.
    leftHip: -Me * i,
    rightHip: -Me * i,
    // The leg swinging forward lifts, its shin trailing backward (-x). A positive
    // knee folds toward the centre, which is backward only for the right leg.
    leftKnee: -30 * Math.max(0, s),
    rightKnee: 30 * Math.max(0, -s),
    // Arms swing against the legs: left arm back while the left foot is forward.
    leftShoulder: o(t.leftShoulder),
    rightShoulder: o(t.rightShoulder)
  };
}
function xl(e, t = 1) {
  return 4 * ((Ae + Ut) * e) * Math.sin(Me * t * Math.PI / 180);
}
function Ta(e) {
  const t = Math.abs(Math.sin(e / 65)), n = 0.55 + 0.45 * Math.sin(e / 310);
  return t * n;
}
const ki = 0.12, Cn = 0.46, xa = 1 - 2 * ki, ka = 0.1, Sa = 0.21, Ma = 0.19, Ae = 0.24, Ut = 0.22, Si = 0.12, Aa = 0.14, Mi = 0.33, In = 0.7, Rn = 0.3, Ea = 0.35, Pa = [1.7, 1.05], _a = [1.3, 0.75], Ln = [1.45, 0.85], Ca = [1.15, 0.75], Fn = 0.06, Ia = 0.65, Ra = 0.3, La = 0.02, Fa = 0.012, $a = 12, Ft = 90, Da = 0.25, Ba = 0.01, xt = (e) => Math.min(1, Math.max(0, e ?? 0));
function kl(e, t = 1) {
  return Ut * e * t;
}
const Ee = -0.12, Ai = 0.4, j = (e) => e * Math.PI / 180, Oa = (e, t) => ({ x: t * Math.sin(j(e)), y: Math.cos(j(e)) }), Ei = (e, t) => Math.max(0, e) * (1 - Math.min(1, Math.max(0, t))), Pi = (e, t, n, i) => e - 0.3 * t - n * 0.14 * t - Math.max(0, i - 1) * 0.12 * t;
function Na(e, t, n, i, s, r) {
  const o = Math.max(1, Math.min(r * 0.6, Aa * n)), l = xt(t.turn), a = (Si + Mi * l) * n, c = i + Ee * n, h = a + t.lookX * 0.08 * n, f = t.lookY * 0.07 * n, u = [
    // The left eye is on the far side; turning closes it up more than the near one.
    { x: -0.34 * n * (1 - In * l), squeeze: 1 - In * l, open: t.leftEye, brow: t.leftBrow, side: -1 },
    { x: 0.34 * n * (1 - Rn * l), squeeze: 1 - Rn * l, open: t.rightEye, brow: t.rightBrow, side: 1 }
  ];
  e.fillStyle = s, e.strokeStyle = s, e.lineWidth = o;
  for (const y of u) {
    const b = Ei(y.open, t.blink);
    if (b < 0.2) {
      const x = t.smile > 0.5 ? -0.12 * n : 0.06 * n;
      e.beginPath(), e.moveTo(y.x + a - 0.12 * n, c), e.quadraticCurveTo(y.x + a, c + x, y.x + a + 0.12 * n, c), e.stroke();
    } else {
      if (b > 1.2) {
        const S = 0.13 * n * b;
        e.beginPath(), e.ellipse(y.x + a, c, S * 0.85, S, 0, 0, Math.PI * 2), e.fillStyle = "#ffffff", e.fill(), e.stroke(), e.fillStyle = s;
      }
      const x = b > 1.2 ? 0.075 * n : 0.1 * n;
      e.beginPath(), e.ellipse(y.x + h, c + f, x, x * 1.1 * Math.min(b, 1), 0, 0, Math.PI * 2), e.fill();
    }
    const w = Pi(c, n, y.brow, b), T = y.x + a - y.side * 0.13 * n * y.squeeze, v = y.x + a + y.side * 0.13 * n * y.squeeze;
    e.beginPath(), e.moveTo(v, w), e.lineTo(T, w - t.browTilt * 0.1 * n), e.stroke();
  }
  const d = i + Ai * n, m = 0.25 * n * Math.max(0.3, t.mouthWidth) * (1 - Ea * l), p = Math.min(1, Math.max(0, t.mouth));
  if (e.beginPath(), p <= 0.05) {
    e.moveTo(a - m, d), e.quadraticCurveTo(a, d + t.smile * 0.25 * n, a + m, d), e.stroke();
    return;
  }
  const g = 0.3 * n * p;
  t.smile > 0.3 ? (e.moveTo(a - m, d - 0.05 * n), e.lineTo(a + m, d - 0.05 * n), e.quadraticCurveTo(a, d + g * 2, a - m, d - 0.05 * n)) : t.smile < -0.3 ? (e.moveTo(a - m, d + g * 0.6), e.lineTo(a + m, d + g * 0.6), e.quadraticCurveTo(a, d - g * 1.4, a - m, d + g * 0.6)) : e.ellipse(a, d, m * 0.8, g, 0, 0, Math.PI * 2), e.fill();
}
function Be(e, t, n, i, s = 16) {
  const r = { x: 2 * t.x - (e.x + n.x) / 2, y: 2 * t.y - (e.y + n.y) / 2 }, o = [];
  for (let l = 0; l <= s; l++) {
    const a = l / s, c = a < 0.5 ? { x: e.x + (t.x - e.x) * 2 * a, y: e.y + (t.y - e.y) * 2 * a } : { x: t.x + (n.x - t.x) * (2 * a - 1), y: t.y + (n.y - t.y) * (2 * a - 1) }, h = 1 - a, f = {
      x: h * h * e.x + 2 * h * a * r.x + a * a * n.x,
      y: h * h * e.y + 2 * h * a * r.y + a * a * n.y
    };
    o.push({ x: c.x + (f.x - c.x) * i, y: c.y + (f.y - c.y) * i });
  }
  return o;
}
function _i(e, t) {
  const n = t.height ?? 300, i = Math.min(3, Math.max(0.3, e.stretch ?? 1)), s = Math.sqrt(i), r = (t.headSize ?? 2 * ki) / 2, o = t.headSize === void 0 ? xa : 1 - 2 * r, l = r * n, a = xt(e.sit), c = e.leftHip + (-Ft - e.leftHip) * a, h = e.leftKnee + (-Ft - e.leftKnee) * a, f = e.rightHip + (Ft - e.rightHip) * a, u = e.rightKnee + (Ft - e.rightKnee) * a, d = t.classic === !0, m = (k, A) => {
    const E = j(k - A) / 2;
    return d ? { x: 0, y: 0 } : { x: Math.cos(E) * Fn, y: Math.abs(Math.sin(E)) * Fn };
  };
  let p = 0;
  if (a > 0 || !d) {
    const k = (P, M) => Ae * Math.cos(j(P)) + Ut * Math.cos(j(P - M)) + m(P, M).y, A = Math.max(k(c, h), k(f, u)), E = d ? Math.min(1, a / Da) : 1;
    p = (Cn - A) * E * n * i;
  }
  const g = -Cn * n * i + p, y = -o * n * i + p, b = d ? 0 : (La * xt(e.turn) + Fa * a) * n * i, w = b === 0 ? [{ x: 0, y: g }, { x: 0, y }] : Be({ x: 0, y: g }, { x: -b, y: (g + y) / 2 }, { x: 0, y }, 1, 8), T = y + ka * n * i, v = (t.shoulderWidth ?? 0) * n * Math.cos(xt(e.turn) * Math.PI / 2), x = (k, A, E, P, M) => {
    const I = Oa(E, P);
    return { x: k + I.x * M * n, y: A + I.y * M * n };
  }, S = (k, A, E) => {
    const P = x(0, g, A, k, Ae * i);
    return { root: { x: 0, y: g }, joint: P, end: x(P.x, P.y, A - E, k, Ut * i) };
  }, C = (k, A, E) => {
    const P = { x: k * v, y: T }, M = x(P.x, P.y, A, k, Sa * s);
    return { root: P, joint: M, end: x(M.x, M.y, A + E, k, Ma * s) };
  }, R = { left: S(-1, c, h), right: S(1, f, u) }, _ = (k, A, E) => {
    const P = m(A, E);
    return { x: k.end.x + P.x * n * i, y: k.end.y + P.y * n * i };
  };
  return {
    height: n,
    facing: (t.facing ?? 1) < 0 ? -1 : 1,
    stretch: i,
    lineWidth: t.lineWidth ?? n * 0.025,
    rubber: Math.min(1, Math.max(d ? 0 : Ra, t.rubber ?? 0)),
    r: l,
    // The head keeps its area: taller and narrower when stretched.
    headRx: l / Math.sqrt(i),
    headRy: l * Math.sqrt(i),
    hipY: g,
    neckY: y,
    drop: p,
    lean: d ? e.lean : e.lean + $a * Math.sin(Math.PI * a),
    classic: d,
    legs: R,
    toes: { left: _(R.left, c, h), right: _(R.right, f, u) },
    spine: w,
    arms: {
      left: C(-1, e.leftShoulder, e.leftElbow),
      right: C(1, e.rightShoulder, e.rightElbow)
    }
  };
}
const Tt = (e, t) => t === 0 ? [e.root, e.joint, e.end] : Be(e.root, e.joint, e.end, t);
function Pe(e, t, n) {
  const i = Math.cos(n), s = Math.sin(n), r = e.x - t.x, o = e.y - t.y;
  return { x: t.x + r * i - o * s, y: t.y + r * s + o * i };
}
function Ci(e, t) {
  const n = j(e.lean), i = j(t.headTilt), s = { x: 0, y: e.hipY }, r = (y) => ({ x: e.facing * y.x, y: y.y }), o = (y) => r(Pe(y, s, n)), l = (y) => o(Pe({ x: y.x, y: y.y + e.neckY }, { x: 0, y: e.neckY }, i)), a = Tt(e.arms.left, e.rubber).map(o), c = Tt(e.arms.right, e.rubber).map(o), h = (y) => {
    const [b, w] = y.slice(-2);
    return Math.atan2(w.y - b.y, w.x - b.x);
  };
  let f = 1 / 0;
  for (const [y, b] of [
    [t.leftBrow, t.leftEye],
    [t.rightBrow, t.rightEye]
  ]) {
    const w = Pi(Ee, 1, y, Ei(b, t.blink));
    f = Math.min(f, w, w - t.browTilt * 0.1);
  }
  const u = { left: r(e.legs.left.end), right: r(e.legs.right.end) }, d = { left: r(e.toes.left), right: r(e.toes.right) }, m = { left: Math.max(u.left.y, d.left.y), right: Math.max(u.right.y, d.right.y) }, p = Math.max(m.left, m.right), g = Ba * e.height;
  return {
    facing: e.facing,
    height: e.height,
    stretch: e.stretch,
    lineWidth: e.lineWidth,
    hip: s,
    neck: o({ x: 0, y: e.neckY }),
    shoulders: { left: o(e.arms.left.root), right: o(e.arms.right.root) },
    elbows: { left: o(e.arms.left.joint), right: o(e.arms.right.joint) },
    hands: { left: o(e.arms.left.end), right: o(e.arms.right.end) },
    knees: { left: r(e.legs.left.joint), right: r(e.legs.right.joint) },
    feet: u,
    toes: d,
    feetY: p,
    grounded: { left: m.left >= p - g, right: m.right >= p - g },
    handAngle: { left: h(a), right: h(c) },
    limbs: {
      leftArm: a,
      rightArm: c,
      leftLeg: Tt(e.legs.left, e.rubber).map(r),
      rightLeg: Tt(e.legs.right, e.rubber).map(r),
      spine: e.spine.map(o)
    },
    head: {
      center: l({ x: 0, y: -e.headRy }),
      rx: e.headRx,
      ry: e.headRy,
      // Mirroring a turn reverses it.
      angle: e.facing * (n + i),
      eyeY: Ee,
      browTopY: f,
      mouthY: Ai,
      faceX: e.facing * (Si + Mi * xt(t.turn))
    }
  };
}
function Ya(e, t = {}) {
  return Ci(_i(e, t), e);
}
function Sl(e, t, n) {
  return Pe({ x: e.center.x + t * e.rx, y: e.center.y + n * e.ry }, e.center, e.angle);
}
function qa(e, t, n) {
  const i = (r) => ({ x: r.x + t, y: r.y + n }), s = (r) => ({ left: i(r.left), right: i(r.right) });
  return {
    ...e,
    hip: i(e.hip),
    neck: i(e.neck),
    shoulders: s(e.shoulders),
    elbows: s(e.elbows),
    hands: s(e.hands),
    knees: s(e.knees),
    feet: s(e.feet),
    toes: s(e.toes),
    feetY: e.feetY + n,
    grounded: { ...e.grounded },
    handAngle: { ...e.handAngle },
    limbs: {
      leftArm: e.limbs.leftArm.map(i),
      rightArm: e.limbs.rightArm.map(i),
      leftLeg: e.limbs.leftLeg.map(i),
      rightLeg: e.limbs.rightLeg.map(i),
      spine: e.limbs.spine.map(i)
    },
    head: { ...e.head, center: i(e.head.center) }
  };
}
function Xa(e, t, n, i) {
  const s = t.length;
  if (s < 2) return;
  const r = [], o = [], l = (a) => n + (i - n) * a / (s - 1);
  t.forEach((a, c) => {
    const h = t[Math.max(0, c - 1)], f = t[Math.min(s - 1, c + 1)], u = Math.hypot(f.x - h.x, f.y - h.y) || 1, d = l(c) / 2, m = -(f.y - h.y) / u * d, p = (f.x - h.x) / u * d;
    r.push({ x: a.x + m, y: a.y + p }), o.push({ x: a.x - m, y: a.y - p });
  }), e.beginPath(), e.moveTo(r[0].x, r[0].y);
  for (const a of r.slice(1)) e.lineTo(a.x, a.y);
  for (const a of o.reverse()) e.lineTo(a.x, a.y);
  e.closePath(), e.fill(), t.forEach((a, c) => {
    c !== 0 && c !== s - 1 && s > 3 || (e.beginPath(), e.arc(a.x, a.y, l(c) / 2, 0, Math.PI * 2), e.fill());
  });
}
function Wa(e, t, n = {}, i = 0) {
  const s = _i(t, n), r = n.color ?? "#1e293b", o = n.layers ?? {}, l = n.layers ? Ci(s, t) : void 0, a = n.sketch ? Se(e, n.sketch, i) : void 0, c = n.sketch && n.layers ? Se(e, n.sketch, i) : void 0, h = (b) => {
    e.save(), b(), e.restore();
  }, f = (b) => {
    b && l && h(() => b(e, l, i, c));
  }, u = () => e.scale(s.facing, 1), d = () => {
    u(), e.translate(0, s.hipY), e.rotate(j(s.lean)), e.translate(0, -s.hipY);
  }, m = (b, w, T) => {
    if (a) return w ? a.curve(b) : a.line(b);
    if (s.classic) {
      e.beginPath(), e.moveTo(b[0].x, b[0].y);
      for (const v of b.slice(1)) e.lineTo(v.x, v.y);
      e.stroke();
      return;
    }
    Xa(e, b, T[0] * s.lineWidth, T[1] * s.lineWidth);
  }, p = (b, w) => m(Tt(b, s.rubber), s.rubber > 0, w), g = (b) => {
    s.classic || m([s.legs[b].end, s.toes[b]], !1, Ca);
  }, y = (b) => {
    if (s.classic || a) return;
    const w = s.arms[b].end;
    e.beginPath(), e.arc(w.x, w.y, Ia * s.lineWidth, 0, Math.PI * 2), e.fill();
  };
  e.save(), e.strokeStyle = r, e.fillStyle = r, e.lineWidth = s.lineWidth, e.lineCap = "round", e.lineJoin = "round", f(o.behind), h(() => {
    u(), p(s.legs.left, Ln), g("left"), p(s.legs.right, Ln), g("right");
  }), h(() => {
    d(), m(s.spine, s.spine.length > 2, Pa);
    const { left: b, right: w } = { left: s.arms.left.root, right: s.arms.right.root };
    if (b.x !== w.x)
      if (s.classic) m([b, w], !1, [1, 1]);
      else {
        const T = { x: (b.x + w.x) / 2, y: b.y - 0.3 * Math.abs(w.x - b.x) };
        m(Be(b, T, w, 1, 8), !0, [1.1, 1.1]);
      }
  }), f(o.body);
  for (const b of ["left", "right"]) {
    h(() => {
      d(), p(s.arms[b], _a), y(b);
    });
    const w = o.sleeve;
    w && l && h(() => w(e, l, b, i, c));
  }
  f(o.behindHead), h(() => {
    d(), e.translate(0, s.neckY), e.rotate(j(t.headTilt));
    const b = -s.headRy;
    e.beginPath(), e.ellipse(0, b, s.headRx, s.headRy, 0, 0, Math.PI * 2);
    const w = n.headFill ?? "#ffffff";
    if (w !== "none" && (e.fillStyle = w, e.fill()), a) {
      a.ellipse(0, b, s.headRx, s.headRy);
      const T = a.nudge();
      e.translate(T.x, T.y);
    } else
      e.stroke();
    e.translate(0, b), e.scale(s.headRx / s.r, s.headRy / s.r), Na(e, t, s.r, 0, r, s.lineWidth);
  }), f(o.overHead), f(o.front), e.restore(), n.label && (e.save(), e.fillStyle = r, e.font = n.labelFont ?? `700 ${Math.round(s.height * 0.11)}px sans-serif`, e.textAlign = "center", e.textBaseline = "bottom", e.fillText(n.label, 0, -s.height * s.stretch - 0.04 * s.height + s.drop), e.restore());
}
function Ii(e, t) {
  const n = { ...e };
  let i = e.walking > 0 ? ba(n, va(e.walk, n), e.walking) : n;
  return e.talk > 0 && (i = { ...i, mouth: Math.max(i.mouth, e.talk * Ta(t)) }), i;
}
function Ml(e) {
  const t = e.style ?? {}, n = t.height ?? 300, i = n * 0.8, s = { ...q(e.pose ?? {}), walk: 0, walking: 0, talk: 0, rubber: t.rubber ?? 0 };
  return {
    type: "custom",
    x: e.x - i / 2,
    y: e.y - n,
    width: i,
    height: n,
    props: { ...s },
    figureStyle: t,
    draw(r, o, l) {
      const a = o.props;
      r.translate(i / 2, n), Wa(r, Ii(a, l), { ...t, rubber: a.rubber }, l);
    }
  };
}
function Al(e, t, n) {
  const i = e.figureStyle;
  if (!i) throw new Error("stickFigureAt: the target was not made by stickFigureTarget");
  const s = { ...e.props };
  let r = 0, o = 0;
  for (const [c, h] of t.state?.values.get(n) ?? [])
    typeof h == "number" && (c === "x" || c === "motionPathX" ? r = h : c === "y" || c === "motionPathY" ? o = h : c in s && (s[c] = h));
  const l = Ii(s, t.time), a = Ya(l, { ...i, rubber: s.rubber });
  return { pose: l, joints: qa(a, e.x + r + e.width / 2, e.y + o + e.height) };
}
function El(e, t) {
  const n = [];
  return t.forEach((i, s) => {
    const r = s === 0 ? ut : n[s - 1], o = typeof i.pose == "string" ? ya[i.pose] : { ...r, ...i.pose };
    n.push(i.expression ? ga(o, i.expression) : o);
  }), xi.filter((i) => n.some((s) => s[i] !== ut[i])).map((i) => ({
    id: `${e}-${i}`,
    target: e,
    property: i,
    keyframes: t.map((s, r) => ({
      time: s.time,
      value: n[r][i],
      ...s.easing ? { easing: s.easing } : {}
    }))
  }));
}
function Va(e, t, n = {}, i) {
  const s = n.length ?? 240, r = 9, o = 28, l = s - 22;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.fillStyle = n.color ?? "#f4c542", e.fillRect(o, -r, l - o, 2 * r), e.fillStyle = "#e8b4a0", e.fillRect(l, -r, s - l, 2 * r), e.fillStyle = "#f1dcbf", e.beginPath(), e.moveTo(0, 0), e.lineTo(o, -r), e.lineTo(o, r), e.closePath(), e.fill(), e.fillStyle = n.outline ?? "#2f2f33", e.beginPath(), e.moveTo(0, 0), e.lineTo(o * 0.35, -r * 0.35), e.lineTo(o * 0.35, r * 0.35), e.closePath(), e.fill(), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round", e.lineCap = "round";
  const a = [
    [{ x: 0, y: 0 }, { x: o, y: -r }, { x: s, y: -r }, { x: s, y: r }, { x: o, y: r }, { x: 0, y: 0 }],
    [{ x: o, y: -r }, { x: o, y: r }],
    [{ x: l, y: -r }, { x: l, y: r }]
  ];
  for (const c of a) Fi(e, c, i);
  e.restore();
}
function Ri(e, t, n = {}, i) {
  const s = n.length ?? 90, r = n.thickness ?? 34;
  e.save(), e.translate(t.x, t.y), e.rotate((n.angle ?? -35) * Math.PI / 180);
  const o = -r / 2;
  e.fillStyle = n.color ?? "#f4a7b9", e.fillRect(0, o, s, r), e.fillStyle = "#e9edf2", e.fillRect(s * 0.45, o, s * 0.55, r), e.strokeStyle = n.outline ?? "#2f2f33", e.lineWidth = 3, e.lineJoin = "round";
  const l = [
    { x: 0, y: o },
    { x: s, y: o },
    { x: s, y: -o },
    { x: 0, y: -o },
    { x: 0, y: o }
  ], a = [{ x: s * 0.45, y: o }, { x: s * 0.45, y: -o }];
  if (i)
    i.line(l), i.line(a);
  else
    for (const c of [l, a]) {
      e.beginPath(), e.moveTo(c[0].x, c[0].y);
      for (const h of c.slice(1)) e.lineTo(h.x, h.y);
      e.stroke();
    }
  e.restore();
}
function Li(e, t, n = {}, i) {
  const s = n.tool ?? "pencil", r = n.skin ?? "#f1c9a5", o = n.outline ?? "#2f2f33", l = s === "eraser" ? 17 : 9, a = s === "eraser" ? -40 : 0, c = i ? i.nudge(0.6) : { x: 0, y: 0 };
  e.save(), e.translate(t.x + c.x, t.y + c.y), e.rotate((n.angle ?? -30) * Math.PI / 180), e.scale(n.scale ?? 1, n.scale ?? 1), e.lineCap = "round", e.lineJoin = "round";
  const h = (d, m, p, g) => {
    for (const [y, b] of [
      [o, p + 6],
      [g, p]
    ])
      e.strokeStyle = y, e.lineWidth = b, e.beginPath(), e.moveTo(d.x, d.y), e.lineTo(m.x, m.y), e.stroke();
  };
  e.save(), e.translate(a, 0);
  const f = { x: 165, y: -l - 26 }, u = (d) => ({ x: f.x + d * 0.8, y: f.y + d * 0.6 });
  h(f, u(2e3), 64, r), h(u(110), u(2e3), 92, n.sleeve ?? "#5b7db1"), e.fillStyle = r, e.strokeStyle = o, e.lineWidth = 3, e.beginPath(), e.ellipse(f.x, f.y, 54, 40, 0.25, 0, Math.PI * 2), e.fill(), e.stroke(), e.restore(), s === "eraser" ? Ri(e, { x: 0, y: 0 }, { angle: 0, outline: o }, i) : Va(e, { x: 0, y: 0 }, { angle: 0, outline: o }, i), e.translate(a, 0), h({ x: 150, y: l + 8 }, { x: 92, y: l + 12 }, 22, r), h({ x: 140, y: -l - 18 }, { x: 58, y: -l - 6 }, 20, r), h({ x: 150, y: -l - 30 }, { x: 112, y: -l + 2 }, 20, r), h({ x: 172, y: -l - 30 }, { x: 140, y: -l + 4 }, 20, r), e.restore();
}
function Pl(e, t, n, i = 0.08, s = 32) {
  const r = Math.PI * 2 * (1 + i), o = [];
  for (let l = 0; l <= s; l++) {
    const a = -Math.PI / 2 + r * l / s;
    o.push({ x: e + Math.cos(a) * n, y: t + Math.sin(a) * n });
  }
  return o;
}
function _l(e) {
  const { path: t } = e, n = t.map((l) => l.x), i = t.map((l) => l.y), s = Math.min(...n), r = Math.min(...i), o = e.hand === !1 ? void 0 : e.hand === !0 || e.hand === void 0 ? {} : e.hand;
  return {
    type: "custom",
    x: s,
    y: r,
    width: Math.max(1, Math.max(...n) - s),
    height: Math.max(1, Math.max(...i) - r),
    props: { draw: 0 },
    draw(l, a, c) {
      const h = Math.min(1, Math.max(0, Number(a.props?.draw ?? 0)));
      l.translate(-s, -r), l.strokeStyle = e.color ?? "#2f2f33", l.lineWidth = e.lineWidth ?? 5, l.lineCap = "round", l.lineJoin = "round";
      const f = e.sketch ? Se(l, e.sketch, c) : void 0;
      h > 0 && (f ? e.smooth ? f.curve(t, h) : f.line(t, h) : Fi(l, Mt(t, h))), o && h > 0 && h < 1 && Li(l, vi(t, h), o, f);
    }
  };
}
function Fi(e, t, n) {
  if (!(t.length < 2)) {
    if (n) return n.line(t);
    e.beginPath(), e.moveTo(t[0].x, t[0].y);
    for (const i of t.slice(1)) e.lineTo(i.x, i.y);
    e.stroke();
  }
}
const $t = 1e5;
function Cl(e, t, n, i, s = 6) {
  const r = [], o = Math.max(1, Math.round(s));
  for (let l = 0; l <= o; l++)
    r.push({ x: l % 2 === 0 ? e : e + n, y: t + i * l / o });
  return r;
}
function $i(e, t, n, i) {
  if (i <= 0 || t.length === 0) return;
  const s = Mt(t, i), r = n / 2, o = (l) => {
    e.beginPath(), e.rect(-$t, -$t, 2 * $t, 2 * $t), l(), e.clip("evenodd");
  };
  for (const l of s)
    o(() => {
      e.moveTo(l.x + r, l.y), e.arc(l.x, l.y, r, 0, Math.PI * 2);
    });
  for (let l = 1; l < s.length; l++) {
    const a = s[l - 1], c = s[l], h = Math.hypot(c.x - a.x, c.y - a.y);
    if (h === 0) continue;
    const f = -(c.y - a.y) / h * r, u = (c.x - a.x) / h * r;
    o(() => {
      e.moveTo(a.x + f, a.y + u), e.lineTo(c.x + f, c.y + u), e.lineTo(c.x - f, c.y - u), e.lineTo(a.x - f, a.y - u), e.closePath();
    });
  }
}
function Il(e, t, n, i, s) {
  e.save(), $i(e, t, n, i), s(), e.restore();
}
function Rl(e, t) {
  const n = t.width ?? 40, i = t.hand === !0 ? {} : t.hand || void 0, s = t.eraser === !1 ? void 0 : t.eraser === !0 || t.eraser === void 0 ? {} : t.eraser;
  return {
    ...e,
    props: { ...e.props, erase: 0 },
    draw(r, o, l) {
      const a = Number(o.props?.erase ?? 0);
      if (r.save(), $i(r, t.path, n, a), e.draw(r, o, l), r.restore(), !s || a <= 0 || a >= 1) return;
      const c = vi(t.path, a);
      i ? Li(r, c, { ...i, tool: "eraser" }) : Ri(r, c, s);
    }
  };
}
function Ll(e) {
  const { timeline: t } = e, n = new tt();
  for (const [c, h] of Object.entries(e.targets)) {
    const f = typeof h == "string" ? document.querySelector(h) : h;
    if (!f)
      throw new Error(`quickPlay: no element found for target "${c}" (${String(h)})`);
    n.registerTarget(c, f);
  }
  t.onUpdate = (c) => {
    n.applyState(c), e.onUpdate?.(c);
  }, e.onComplete && (t.onComplete = e.onComplete);
  let i = null, s = null, r = !1;
  const o = (c) => {
    if (r) return;
    const h = s === null ? 0 : c - s;
    s = c, h > 0 && t.tick(h), i = requestAnimationFrame(o);
  }, l = () => {
    i !== null || r || (s = null, i = requestAnimationFrame(o));
  }, a = () => {
    i !== null && cancelAnimationFrame(i), i = null, s = null;
  };
  return n.applyState(t.getStateAtTime(t.currentTime)), e.autoplay !== !1 && (t.play(), l()), {
    timeline: t,
    adapter: n,
    play() {
      t.play(), l();
    },
    pause() {
      t.pause(), a();
    },
    restart() {
      t.stop(), t.play(), l();
    },
    seek(c) {
      t.seek(c * 1e3), n.applyState(t.getStateAtTime(t.currentTime));
    },
    destroy() {
      r = !0, a(), t.stop(), n.clearTargets();
    }
  };
}
const Fl = {
  timeline: Sr,
  to(e, t, n) {
    const i = new at(n);
    return i.to(e, t), i;
  },
  from(e, t, n) {
    const i = new at(n);
    return i.from(e, t), i;
  },
  fromTo(e, t, n, i) {
    const s = new at(i);
    return s.fromTo(e, t, n), s;
  },
  set(e, t, n) {
    const i = new at(n);
    return i.set(e, t), i;
  }
}, $l = X.to, Dl = X.from, Bl = X.fromTo, Ol = X.set, Nl = X.timeline, Yl = X.ticker, ql = X.splitText, Xl = X.context, Wl = X.matchMedia, Vl = X.quickTo, Hl = X.imageSequence, Ul = X.pageTransition;
ha();
export {
  za as Clock,
  at as CompatTimeline,
  Lo as CustomBounce,
  Ro as CustomEase,
  Fo as CustomWiggle,
  Wn as DEFAULT_BAKE_INTERVAL_MS,
  Oe as DEFAULT_INERTIA_FRICTION,
  Uo as DEFAULT_LABELS,
  W as DEFAULT_SPRING,
  Tl as DEFAULT_TRANSITION,
  ui as Draggable,
  Z as EXPRESSIONS,
  Nt as FORMAT_VERSION,
  Hi as INERTIA_MAX_DURATION_MS,
  $s as InertiaTrackPlayer,
  z as LiveTimeline,
  tl as MORPH_SAMPLES,
  Ua as ManualClock,
  Sn as MediaSync,
  Ur as Observer,
  ya as POSES,
  ut as REST_POSE,
  On as SPRING_MAX_DURATION_MS,
  Jt as SPRING_PRESETS,
  bt as SPRING_STEP_MS,
  mo as ScrollAnimator,
  Zt as ScrollDriver,
  go as ScrollMarkers,
  co as ScrollPin,
  yn as SmoothScroll,
  jt as SpringSampler,
  Fs as SpringTrackPlayer,
  Or as Stage,
  Gn as Timeline,
  De as TinyflyPlayer,
  ua as TinyflySequencer,
  se as TrackPlayer,
  cl as ValueResolver,
  lo as VisibilityDriver,
  is as backOut,
  zn as bakeEasing,
  Hn as bakeInertiaTrack,
  Vn as bakeSpringTrack,
  ia as bindChoiceHotspots,
  ba as blendPose,
  da as boilFrame,
  ns as bounceOut,
  Bs as charactersFor,
  Pl as circlePath,
  mi as clamp01,
  el as clearMorphCache,
  Qa as clearPathCache,
  $i as clipErased,
  pn as containerProgressAt,
  Xl as context,
  bl as create,
  Ko as createControls,
  ts as createCubicBezier,
  Yo as createLive,
  Qn as createRandom,
  ye as createTrack,
  Ka as criticalDamping,
  Gs as customBounce,
  js as customEase,
  Ks as customWiggle,
  kt as deserializeTimeline,
  Xs as deserializeTrack,
  dl as draggable,
  Ri as drawEraser,
  Li as drawHand,
  Va as drawPencil,
  Wa as drawStickFigure,
  _l as drawnPathTarget,
  Ki as easeIn,
  Nn as easeInCubic,
  Qi as easeInOut,
  Kt as easeInOutCubic,
  Gi as easeInOutQuad,
  zi as easeInQuad,
  Zi as easeOut,
  Yn as easeOutCubic,
  ji as easeOutQuad,
  es as elasticOut,
  Rl as erasable,
  Rs as expandParametricEasings,
  Dl as from,
  ol as fromJSON,
  Bl as fromTo,
  G as getEasingFunction,
  qt as getInterpolator,
  jn as getMotionPathPoint,
  Ja as getPathLength,
  ps as getPointAtProgress,
  jr as gridLinesFor,
  qi as hasKeyframes,
  Vs as hashSeed,
  Sl as headPoint,
  Hl as imageSequence,
  Et as inertiaDuration,
  At as inertiaRest,
  pe as inertiaValueAt,
  Za as inertiaVelocityAt,
  Cs as interpolateArray,
  _s as interpolateColor,
  sl as interpolateMotionPath,
  U as interpolateNumber,
  Is as interpolatePathString,
  Qe as interpolateString,
  Yi as isCubicBezierEasing,
  et as isInertiaTrack,
  Ha as isMotionPathPoint,
  $n as isMotionPathTrack,
  Ot as isParametricEasing,
  Pt as isPathData,
  nt as isSpringTrack,
  _e as isTextTrack,
  Ga as isUnderdamped,
  ll as isUnresolved,
  qa as jointsToScene,
  me as linear,
  X as live,
  Xt as mapEase,
  Wl as matchMedia,
  Bn as maxStaggerDistance,
  As as morphPath,
  ra as mount,
  la as mountAll,
  ul as narrationMarkers,
  fl as narrationSceneAt,
  Yt as naturalRest,
  Ul as pageTransition,
  rs as parametricEasing,
  dn as parseEdge,
  lt as parsePath,
  pi as parseTrigger,
  Mt as partialPath,
  fa as pathLength,
  hl as planNarration,
  yl as play,
  vl as playSequence,
  ml as playWhenVisible,
  Kn as playheadCrossings,
  vi as pointAlong,
  qn as pointAtDistance,
  nr as pointsToPath,
  q as pose,
  El as poseTracks,
  Ll as quickPlay,
  Vl as quickTo,
  Jn as randomBetween,
  al as randomChoice,
  Hs as randomSnapped,
  Us as resolveSequence,
  Ii as resolveStickPose,
  ni as resolveValue,
  Be as rubberLimb,
  pl as scrollProgress,
  gl as scrubOnScroll,
  Cl as scrubPath,
  kl as seatHeight,
  Ws as serializeTimeline,
  qs as serializeTrack,
  Ol as set,
  Ie as shapeToPathData,
  Ls as simplifyKeyframes,
  Se as sketchPen,
  ao as smoothToward,
  zr as snapAxis,
  uo as snapConfig,
  po as snapDuration,
  fo as snapProgress,
  ql as splitText,
  Xi as springDuration,
  ja as springValueAt,
  Dn as staggerDistance,
  Ce as staggerOffset,
  de as staggerOffsets,
  zt as staggerSpan,
  ss as stepsEasing,
  Al as stickFigureAt,
  Ya as stickFigureJoints,
  Ml as stickFigureTarget,
  xl as strideLength,
  Ho as syncMediaElement,
  Ta as talkingMouth,
  Xa as taperedLine,
  Ns as textAt,
  Fl as tf,
  Yl as ticker,
  Nl as timeline,
  $l as to,
  rl as toJSON,
  nl as toKeyframedTrack,
  il as toKeyframedTracks,
  J as trackTargets,
  St as triggerDistance,
  wl as unmount,
  va as walkPose,
  Il as withErased,
  ga as withExpression
};
